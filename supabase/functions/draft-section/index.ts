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

    const { rfp_json, section_key, rfp_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context from RFP
    const context = `
RFP Title: ${rfp_json.title || 'N/A'}
Issuer: ${rfp_json.issuer || 'N/A'}
Scope: ${rfp_json.scope_summary || 'N/A'}
Budget: ${rfp_json.budget_cap_currency || ''} ${rfp_json.budget_cap_amount || 'N/A'}
Duration: ${rfp_json.duration_months || 'N/A'} months
    `.trim();

    const sectionPrompts: { [key: string]: string } = {
      executive_summary: "Write a compelling executive summary highlighting our understanding of the problem, proposed solution approach, and key differentiators.",
      approach_methodology: "Describe the technical approach and methodology we will use, including frameworks, best practices, and innovation.",
      implementation_plan: "Detail the implementation timeline, milestones, deliverables, and project phases.",
      budget_narrative: "Provide a detailed budget breakdown justifying costs for personnel, equipment, and other expenses.",
      team_cvs: "Outline the team structure, key personnel roles, and required qualifications/experience.",
      risk_mitigation: "Identify potential risks and our mitigation strategies.",
      past_performance: "Describe relevant past performance examples demonstrating our capabilities.",
      compliance_matrix: "Create a compliance matrix mapping RFP requirements to our response sections."
    };

    const prompt = `You are a proposal writer. Based on this RFP information:

${context}

${sectionPrompts[section_key] || 'Write this section of the proposal.'}

Provide your response in the following JSON format:
{
  "content": "The main content for this section (2-3 paragraphs)",
  "why_it_scores": "Brief explanation of why this content addresses evaluation criteria",
  "placeholders_needed": ["List of specific information needed from the company"],
  "risks": "Any risks or considerations for this section"
}`;

    console.log('Calling Lovable AI for section:', section_key);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert proposal writer. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: use the text as content
      result = {
        content: generatedText,
        why_it_scores: "Generated content addresses the RFP requirements.",
        placeholders_needed: ["Company-specific information"],
        risks: "Review and customize for your organization."
      };
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('draft_sections')
      .upsert({
        rfp_id,
        user_id: user.id,
        section_key,
        content: result.content,
        why_it_scores: result.why_it_scores,
        placeholders_needed: result.placeholders_needed || [],
        risks: result.risks
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in draft-section:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
