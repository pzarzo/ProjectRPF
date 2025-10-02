import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Rule = {
  id: string;
  match: (args: {
    requirement: { text: string; type: string; category: string | null; priority: string | null; section_key: string | null };
    drafts: Record<string, string>;
    attachments: Array<{ type: string; filename: string }>;
  }) => { status: "complies" | "missing_info" | "fail" | "not_applicable"; evidence?: string; action_item?: string };
};

const rules: Rule[] = [
  // Gender & Inclusion Strategy
  {
    id: "GEN-STRAT",
    match: ({ requirement, drafts }) => {
      if (!/gender|inclusion|GESI|social inclusion/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const txt = (drafts["methodology"] || "") + " " + (drafts["plan"] || "");
      return /gender|female|inclusion|GBV|PSEA/i.test(txt)
        ? { status: "complies", evidence: "Methodology/Plan mentions gender & inclusion" }
        : { status: "missing_info", action_item: "Add Gender & Inclusion strategy in Methodology" };
    },
  },
  // Budget Cap Compliance
  {
    id: "BUDGET-CAP",
    match: ({ requirement, drafts }) => {
      if (!/budget|ceiling|cap/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const budgetText = drafts["budget"] || "";
      return /(under|within)\s+(the\s+)?budget|<=?\s?\$?\d/i.test(budgetText)
        ? { status: "complies", evidence: "Budget narrative states compliance with cap" }
        : { status: "missing_info", action_item: "State explicitly that total budget complies with the cap" };
    },
  },
  // Audited Financial Statements
  {
    id: "FINANCIALS-AUDITED",
    match: ({ requirement, attachments }) => {
      if (!/audited financial statements|financials/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const has = attachments.some(a => /financial|audit/i.test(a.type + " " + a.filename));
      return has
        ? { status: "complies", evidence: "Audited financials attached" }
        : { status: "missing_info", action_item: "Upload audited financial statements (last 2 years)" };
    },
  },
  // Gating: Revenue ≥ 10M
  {
    id: "GATING-REVENUE",
    match: ({ requirement, drafts }) => {
      if (!/10M\+|10\s?million|annual revenue/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const txt = (drafts["executive"] || "") + " " + (drafts["pastperf"] || "");
      const ok = /(\$|USD)\s?1?0[,\. ]?0{6}/i.test(txt) || /10\s?million/i.test(txt);
      return ok
        ? { status: "complies", evidence: "Revenue stated in Executive/Past Performance" }
        : { status: "fail", action_item: "Provide evidence of ≥ $10M annual revenue (gating requirement)" };
    },
  },
  // CVs for Key Personnel
  {
    id: "CV-KEY-PERSONNEL",
    match: ({ requirement, attachments }) => {
      if (!/CV|curriculum vitae|resume|key personnel/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const hasCvs = attachments.some(a => /cv|resume/i.test(a.type + " " + a.filename));
      return hasCvs
        ? { status: "complies", evidence: "CVs attached" }
        : { status: "missing_info", action_item: "Upload CVs for key personnel" };
    },
  },
  // Certificates/Registrations
  {
    id: "CERTIFICATES",
    match: ({ requirement, attachments }) => {
      if (!/certificate|registration|license/i.test(requirement.text)) {
        return { status: "not_applicable" };
      }
      const hasCerts = attachments.some(a => /certificate|registration|license/i.test(a.type + " " + a.filename));
      return hasCerts
        ? { status: "complies", evidence: "Certificates/registrations attached" }
        : { status: "missing_info", action_item: "Upload required certificates or registrations" };
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { rfp_id } = await req.json();
    if (!rfp_id) throw new Error("Missing rfp_id");

    // Fetch requirements
    const { data: requirements, error: reqError } = await supabase
      .from("rfp_requirements")
      .select("*")
      .eq("rfp_id", rfp_id);

    if (reqError) throw reqError;

    // Fetch drafts
    const { data: draftsData, error: draftError } = await supabase
      .from("draft_sections")
      .select("section_key, content")
      .eq("rfp_id", rfp_id);

    if (draftError) throw draftError;

    const drafts: Record<string, string> = {};
    draftsData?.forEach(d => {
      drafts[d.section_key] = d.content || "";
    });

    // Fetch attachments
    const { data: attachments, error: attError } = await supabase
      .from("attachments")
      .select("type, filename")
      .eq("rfp_id", rfp_id);

    if (attError) throw attError;

    // Process each requirement through rules
    const updates = [];
    for (const req of requirements || []) {
      let result: {
        status: "complies" | "missing_info" | "fail" | "not_applicable";
        evidence?: string;
        action_item?: string;
      } = {
        status: "missing_info",
        evidence: undefined,
        action_item: "Add content or evidence",
      };

      // Try each rule
      for (const rule of rules) {
        const output = rule.match({
          requirement: {
            text: req.text,
            type: req.type,
            category: req.category,
            priority: req.priority,
            section_key: req.section_key,
          },
          drafts,
          attachments: attachments || [],
        });
        
        if (output.status !== "not_applicable") {
          result = output;
          break;
        }
      }

      updates.push({
        rfp_id,
        requirement_id: req.id,
        user_id: user.id,
        status: result.status,
        evidence: result.evidence || null,
        action_item: result.action_item || null,
      });
    }

    // Upsert compliance items
    for (const item of updates) {
      const { error: upsertError } = await supabase
        .from("compliance_items")
        .upsert(item, {
          onConflict: "rfp_id,requirement_id",
        });

      if (upsertError) {
        console.error("Error upserting compliance item:", upsertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: updates.length,
        message: "Compliance check completed"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
