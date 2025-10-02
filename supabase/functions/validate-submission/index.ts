import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rfpId } = await req.json();

    if (!rfpId) {
      throw new Error('rfpId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Validating submission for RFP:', rfpId);

    // Get RFP requirements
    const { data: requirements, error: reqError } = await supabase
      .from('rfp_requirements')
      .select('*')
      .eq('rfp_id', rfpId);

    if (reqError) throw reqError;

    // Get compliance items
    const { data: complianceItems, error: compError } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('rfp_id', rfpId);

    if (compError) throw compError;

    // Calculate summary
    const summary = {
      complies: 0,
      missing: 0,
      fail: 0,
      na: 0,
    };

    let hasBlockingIssues = false;

    // Map requirements to compliance status
    const items = requirements.map((req: any) => {
      const compliance = complianceItems?.find((c: any) => c.requirement_id === req.id);
      const status = compliance?.status || 'missing_info';

      // Count by status
      if (status === 'complies') summary.complies++;
      else if (status === 'missing_info') summary.missing++;
      else if (status === 'fail') summary.fail++;
      else if (status === 'na') summary.na++;

      // Check for blocking issues (gating requirements that fail)
      if (req.type === 'gating' && status === 'fail') {
        hasBlockingIssues = true;
      }

      return {
        requirement_id: req.id,
        requirement_text: req.text,
        requirement_type: req.type,
        status,
        blocking: req.type === 'gating' && status === 'fail',
      };
    });

    const result = {
      summary,
      blocking: hasBlockingIssues,
      items,
    };

    console.log('Validation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
