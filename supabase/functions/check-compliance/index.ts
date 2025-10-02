import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { rfp_id } = await req.json();

    // Fetch RFP data
    const { data: rfpData, error: rfpError } = await supabase
      .from('rfps')
      .select('*')
      .eq('id', rfp_id)
      .single();

    if (rfpError) throw rfpError;

    // Fetch requirements
    const { data: requirements, error: reqError } = await supabase
      .from('rfp_requirements')
      .select('*')
      .eq('rfp_id', rfp_id);

    if (reqError) throw reqError;

    // Fetch draft sections
    const { data: draftSections, error: draftError } = await supabase
      .from('draft_sections')
      .select('*')
      .eq('rfp_id', rfp_id);

    if (draftError) throw draftError;

    // Fetch attachments
    const { data: attachments, error: attachError } = await supabase
      .from('attachments')
      .select('*')
      .eq('rfp_id', rfp_id);

    if (attachError) throw attachError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context for AI
    const context = `
RFP: ${rfpData.title}
Requirements count: ${requirements?.length || 0}
Draft sections: ${draftSections?.map((s: any) => s.section_key).join(', ') || 'none'}
Attachments: ${attachments?.length || 0}

Requirements to check:
${requirements?.slice(0, 20).map((r: any, i: number) => `${i + 1}. ${r.text} (${r.priority || r.type})`).join('\n') || 'None'}

Draft content available:
${draftSections?.map((s: any) => `${s.section_key}: ${(s.content || '').substring(0, 100)}...`).join('\n') || 'None'}
    `.trim();

    const prompt = `You are a compliance checker. Analyze whether the proposal drafts and attachments meet the RFP requirements.

${context}

For each requirement, assess:
1. Is there content in the drafts that addresses it?
2. Is there evidence in attachments?
3. What's the compliance status: complies, missing_info, fail, or not_applicable?
4. What action items are needed?

Provide a JSON array with this format:
[
  {
    "requirement_id": "uuid",
    "status": "complies|missing_info|fail|not_applicable",
    "evidence": "Brief explanation of where requirement is addressed",
    "action_item": "What needs to be done if not compliant"
  }
]

Return only the first 10 requirements.`;

    console.log('Running compliance check for RFP:', rfp_id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a compliance expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No analysis generated');
    }

    // Parse JSON response
    let results;
    try {
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      results = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      results = [];
    }

    // Update compliance items
    let updatedCount = 0;
    if (Array.isArray(results)) {
      for (const result of results) {
        const { error: upsertError } = await supabase
          .from('compliance_items')
          .upsert({
            rfp_id,
            user_id: user.id,
            requirement_id: result.requirement_id,
            status: result.status || 'missing_info',
            evidence: result.evidence || '',
            action_item: result.action_item || ''
          });

        if (!upsertError) updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} compliance items`);

    return new Response(
      JSON.stringify({
        message: `Compliance check complete. Updated ${updatedCount} items.`,
        updated: updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-compliance:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
