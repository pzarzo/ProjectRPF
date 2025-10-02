import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Read file content
    const fileContent = await file.text();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Create prompt for AI extraction
    const extractionPrompt = `Analyze this ${fileExtension?.toUpperCase()} document and extract RFP information in JSON format.

Document content:
${fileContent.substring(0, 50000)} // Limit to avoid token issues

Extract the following fields (use null if not found, don't invent data):
{
  "title": "RFP title",
  "issuer": "Organization name",
  "reference_id": "RFP reference number",
  "procurement_method": "open/restricted/competitive_dialogue/etc",
  "contract_type": "fixed_price/time_materials/cost_plus/etc",
  "scope_summary": "Brief project description",
  "budget_cap_amount": number or null,
  "budget_cap_currency": "USD/EUR/etc",
  "duration_months": number or null,
  "language": "en/es/fr/etc",
  "confidence": 0.0-1.0 (confidence score),
  "deadlines": [
    {
      "type": "clarification_questions/info_session/site_visit/submission/etc",
      "datetime_iso": "ISO 8601 datetime",
      "timezone": "Europe/Madrid/etc"
    }
  ],
  "requirements": [
    {
      "text": "Requirement description",
      "type": "mandatory/optional/gating",
      "category": "eligibility/docs/budget/methodology/legal/submission",
      "priority": "high/medium/low",
      "source_page": page_number or null,
      "source_section": "section name"
    }
  ],
  "evaluation_criteria": [
    {
      "name": "Criterion name",
      "weight": percentage or null,
      "details": "Details",
      "method": "weighted/pass_fail/L1/MEAT"
    }
  ],
  "citations": [
    {
      "field": "field_name",
      "page": page_number,
      "section": "section_name"
    }
  ]
}

IMPORTANT: 
- Only extract information explicitly stated in the document
- Use null for missing values
- Normalize dates to ISO 8601 format
- Include citations showing where each piece of information was found
- Return ONLY valid JSON, no additional text`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Lovable AI for extraction...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at extracting structured information from RFP documents. Always return valid JSON only.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const extractedText = aiData.choices[0].message.content;
    
    // Parse JSON from AI response
    let extracted;
    try {
      // Try to extract JSON if AI added extra text
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : extractedText);
    } catch (e) {
      console.error('Failed to parse AI response:', extractedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Extracted data:', JSON.stringify(extracted, null, 2));

    // Save to database
    const { data: rfpData, error: rfpError } = await supabaseClient
      .from('rfps')
      .insert({
        user_id: user.id,
        title: extracted.title || 'Untitled RFP',
        issuer: extracted.issuer,
        reference_id: extracted.reference_id,
        procurement_method: extracted.procurement_method,
        contract_type: extracted.contract_type,
        scope_summary: extracted.scope_summary,
        raw_text: fileContent.substring(0, 10000),
        budget_cap_amount: extracted.budget_cap_amount,
        budget_cap_currency: extracted.budget_cap_currency,
        duration_months: extracted.duration_months,
        language: extracted.language,
        confidence: extracted.confidence,
      })
      .select()
      .single();

    if (rfpError) {
      console.error('Error saving RFP:', rfpError);
      throw rfpError;
    }

    console.log('RFP saved with ID:', rfpData.id);

    // Save deadlines
    if (extracted.deadlines && extracted.deadlines.length > 0) {
      const deadlinesData = extracted.deadlines.map((d: any) => ({
        rfp_id: rfpData.id,
        type: d.type,
        datetime_iso: d.datetime_iso,
        timezone: d.timezone,
      }));

      const { error: deadlinesError } = await supabaseClient
        .from('rfp_deadlines')
        .insert(deadlinesData);

      if (deadlinesError) {
        console.error('Error saving deadlines:', deadlinesError);
      }
    }

    // Save requirements
    if (extracted.requirements && extracted.requirements.length > 0) {
      const requirementsData = extracted.requirements.map((r: any) => ({
        rfp_id: rfpData.id,
        text: r.text,
        type: r.type,
        category: r.category,
        priority: r.priority,
        source_page: r.source_page,
        source_section: r.source_section,
      }));

      const { error: requirementsError } = await supabaseClient
        .from('rfp_requirements')
        .insert(requirementsData);

      if (requirementsError) {
        console.error('Error saving requirements:', requirementsError);
      }
    }

    // Save evaluation criteria
    if (extracted.evaluation_criteria && extracted.evaluation_criteria.length > 0) {
      const criteriaData = extracted.evaluation_criteria.map((c: any) => ({
        rfp_id: rfpData.id,
        name: c.name,
        weight: c.weight,
        details: c.details,
        method: c.method,
      }));

      const { error: criteriaError } = await supabaseClient
        .from('evaluation_criteria')
        .insert(criteriaData);

      if (criteriaError) {
        console.error('Error saving criteria:', criteriaError);
      }
    }

    // Save citations
    if (extracted.citations && extracted.citations.length > 0) {
      const citationsData = extracted.citations.map((c: any) => ({
        rfp_id: rfpData.id,
        field: c.field,
        page: c.page,
        section: c.section,
      }));

      const { error: citationsError } = await supabaseClient
        .from('citations')
        .insert(citationsData);

      if (citationsError) {
        console.error('Error saving citations:', citationsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        rfp_id: rfpData.id,
        extracted: {
          ...extracted,
          id: rfpData.id,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in extract-rfp function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});