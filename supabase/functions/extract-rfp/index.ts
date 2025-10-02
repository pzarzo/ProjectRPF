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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated. Please log in.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('User authenticated:', user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Read file content and limit size
    const fileBuffer = await file.arrayBuffer();
    const maxSize = 200000; // 200KB limit for text
    let fileContent = new TextDecoder().decode(fileBuffer.slice(0, maxSize));
    
    // Clean up content - remove excessive whitespace and special characters
    fileContent = fileContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log(`Content length after processing: ${fileContent.length} chars`);

    // Simplified, focused extraction prompt
    const extractionPrompt = `Extract key RFP information from this document. Return ONLY a valid JSON object, no markdown.

Document (${fileExtension}):
${fileContent}

Return this JSON structure:
{
  "title": "RFP title or null",
  "issuer": "Issuing organization or null",
  "reference_id": "RFP reference number or null",
  "budget_cap_amount": number_or_null,
  "budget_cap_currency": "USD/EUR etc or null",
  "duration_months": number_or_null,
  "language": "en/es/fr or null",
  "confidence": 0.7,
  "deadlines": [
    {"type": "submission", "datetime_iso": "2025-10-15T17:00:00Z", "timezone": "UTC"}
  ],
  "requirements": [
    {"text": "requirement text", "type": "mandatory", "category": "technical", "priority": "high"}
  ],
  "citations": [
    {"field": "title", "page": 1, "section": "Cover"}
  ]
}

Rules:
- Extract ONLY what you find explicitly
- Use null for missing data
- Keep it simple and accurate
- Return valid JSON only`;

    // Call Lovable AI with faster model
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling AI for extraction...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Faster model
        messages: [
          { 
            role: 'system', 
            content: 'You extract structured RFP data. Return ONLY valid JSON, no markdown, no explanations.' 
          },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000, // Limit response size
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const extractedText = aiData.choices[0].message.content;
    console.log('Extracted text preview:', extractedText.substring(0, 200));
    
    // Parse JSON from AI response
    let extracted;
    try {
      // Remove markdown code blocks if present
      const cleanText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);
    } catch (e) {
      console.error('Failed to parse AI response:', extractedText);
      throw new Error('AI returned invalid JSON format');
    }

    console.log('Parsed extraction:', JSON.stringify(extracted, null, 2));

    // Save to database
    const { data: rfpData, error: rfpError } = await supabaseClient
      .from('rfps')
      .insert({
        user_id: user.id,
        title: extracted.title || 'Untitled RFP',
        issuer: extracted.issuer,
        reference_id: extracted.reference_id,
        raw_text: fileContent.substring(0, 10000),
        budget_cap_amount: extracted.budget_cap_amount,
        budget_cap_currency: extracted.budget_cap_currency,
        duration_months: extracted.duration_months,
        language: extracted.language,
        confidence: extracted.confidence || 0.5,
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
        type: d.type || 'submission',
        datetime_iso: d.datetime_iso,
        timezone: d.timezone || 'UTC',
      }));

      const { error: deadlinesError } = await supabaseClient
        .from('rfp_deadlines')
        .insert(deadlinesData);

      if (deadlinesError) {
        console.error('Error saving deadlines:', deadlinesError);
      } else {
        console.log(`Saved ${deadlinesData.length} deadlines`);
      }
    }

    // Save requirements
    if (extracted.requirements && extracted.requirements.length > 0) {
      const requirementsData = extracted.requirements.slice(0, 50).map((r: any) => ({
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
      } else {
        console.log(`Saved ${requirementsData.length} requirements`);
      }
    }

    // Save citations
    if (extracted.citations && extracted.citations.length > 0) {
      const citationsData = extracted.citations.slice(0, 20).map((c: any) => ({
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

    console.log('Extraction complete, returning response');

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
        error: error instanceof Error ? error.message : 'Extraction failed. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});