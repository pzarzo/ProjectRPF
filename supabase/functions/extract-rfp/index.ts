import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  title: string | null;
  issuer: string | null;
  reference_id: string | null;
  deadlines: Array<{type: string; datetime_iso: string; timezone: string}>;
  financials: {budget_cap: {amount: number | null; currency: string | null}};
  duration_months: number | null;
  submission: {channel: string | null; language: string | null; partial_proposals_allowed: boolean | null};
  evaluation: {method: string; criteria: any[]};
  required_documents: any[];
  citations: any[];
  confidence: number;
}

function parseDate(dateStr: string, timeStr: string = '23:59', timezone: string = 'UTC'): string {
  try {
    // Parse formats like "12 October 2025"
    const months: Record<string, string> = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1].toLowerCase()] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}T${timeStr}:00`;
    }
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractWithRegex(text: string): ExtractedData {
  console.log('Using regex fallback extraction');
  
  const result: ExtractedData = {
    title: null,
    issuer: null,
    reference_id: null,
    deadlines: [],
    financials: { budget_cap: { amount: null, currency: null } },
    duration_months: null,
    submission: { channel: null, language: null, partial_proposals_allowed: null },
    evaluation: { method: 'weighted', criteria: [] },
    required_documents: [],
    citations: [],
    confidence: 0.6
  };

  // Title
  const titleMatch = text.match(/(?:Call for Proposals|Request for Proposals|RFP)[:\s]*([^\n]{10,150})/i);
  if (titleMatch) result.title = titleMatch[1].trim();

  // Issuer
  const issuerMatch = text.match(/(?:UNOPS|World Bank|European Commission|Ministry|City Council|Nations?|Government)[^\n]*/i);
  if (issuerMatch) result.issuer = issuerMatch[0].trim().substring(0, 100);

  // Reference ID
  const refMatch = text.match(/([A-Z]+\/[A-Z]+\/\d{4}\/\d+)/);
  if (refMatch) result.reference_id = refMatch[1];

  // Budget
  const budgetMatch = text.match(/Budget\s*(?:Ceiling|Cap|Amount)[:\s]*(?:up to\s*)?(?:USD|EUR|GBP)?\s*([\d.,]+)\s*(?:USD|EUR|GBP)?/i);
  if (budgetMatch) {
    const currMatch = text.match(/(?:USD|EUR|GBP)/i);
    result.financials.budget_cap.amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    result.financials.budget_cap.currency = currMatch ? currMatch[0].toUpperCase() : 'USD';
  }

  // Duration
  const durationMatch = text.match(/(?:duration|grant period)[:\s]*(\d+)\s*months?/i);
  if (durationMatch) result.duration_months = parseInt(durationMatch[1]);

  // Language
  const langMatch = text.match(/Language\s*of\s*proposals?[:\s]*(English|Spanish|French|Portuguese|German)/i);
  if (langMatch) result.submission.language = langMatch[1].toLowerCase().substring(0, 2);

  // Submission channel
  const channelMatch = text.match(/(?:Grant\+|iSupplier|Ariba|Mercell|grantplus\.unops\.org|submit.*(?:via|through|at))[^\n]*/i);
  if (channelMatch) result.submission.channel = channelMatch[0].trim().substring(0, 100);

  // Partial proposals
  const partialMatch = text.match(/Partial\s*proposals[:\s]*(not\s*permitted|not\s*allowed|are\s*permitted|allowed)/i);
  if (partialMatch) {
    result.submission.partial_proposals_allowed = !partialMatch[1].toLowerCase().includes('not');
  }

  // Deadlines
  const deadlinePatterns = [
    { type: 'clarifications', pattern: /(?:Request\s*for\s*clarification|Clarifications?\s*deadline)[:\s]*(\d{1,2}\s+\w+\s+\d{4})\s*(\d{2}:\d{2})?(?:\s*([A-Z]{3,4}))?/i },
    { type: 'info_session', pattern: /(?:Information\s*Session|Info\s*session)[:\s]*(\d{1,2}\s+\w+\s+\d{4})\s*(\d{2}:\d{2})?(?:\s*([A-Z]{3,4}))?/i },
    { type: 'submission', pattern: /(?:Submission\s*of\s*proposals?|Proposal\s*deadline|Closing\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})\s*(\d{2}:\d{2})?(?:\s*([A-Z]{3,4}))?/i },
    { type: 'contract_start', pattern: /(?:Expected\s*(?:agreement|contract)\s*start\s*date|Contract\s*start)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i }
  ];

  for (const { type, pattern } of deadlinePatterns) {
    const match = text.match(pattern);
    if (match) {
      const datetime_iso = parseDate(match[1], match[2] || '23:59', match[3] || 'UTC');
      result.deadlines.push({
        type,
        datetime_iso,
        timezone: match[3] || 'UTC'
      });
    }
  }

  return result;
}

async function extractWithAI(text: string, apiKey: string): Promise<ExtractedData | null> {
  try {
    console.log('Attempting AI extraction...');
    
    const prompt = `Extract RFP data from this text. Return ONLY valid JSON:

${text.substring(0, 150000)}

JSON structure:
{
  "title": "string or null",
  "issuer": "string or null", 
  "reference_id": "string or null",
  "deadlines": [{"type":"submission","datetime_iso":"2025-10-15T17:00:00","timezone":"UTC"}],
  "financials": {"budget_cap":{"amount":170000,"currency":"USD"}},
  "duration_months": 12,
  "submission": {"channel":"Grant+","language":"en","partial_proposals_allowed":false},
  "evaluation": {"method":"weighted","criteria":[]},
  "required_documents": [],
  "citations": [],
  "confidence": 0.8
}

Extract what exists, use null for missing.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Extract RFP data. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('AI extraction successful');
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('AI extraction failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing: ${file.name} (${file.size} bytes)`);

    // Read file as text (simple text extraction for PDFs)
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(arrayBuffer);
    
    // Clean text
    text = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`Extracted text length: ${text.length} chars`);

    // Try AI first, fallback to regex
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let extracted: ExtractedData;

    if (LOVABLE_API_KEY && text.length > 100) {
      const aiResult = await extractWithAI(text, LOVABLE_API_KEY);
      extracted = aiResult || extractWithRegex(text);
    } else {
      extracted = extractWithRegex(text);
    }

    // Save to database
    const { data: rfpData, error: rfpError } = await supabaseClient
      .from('rfps')
      .insert({
        user_id: user.id,
        title: extracted.title || 'Untitled RFP',
        issuer: extracted.issuer,
        reference_id: extracted.reference_id,
        budget_cap_amount: extracted.financials.budget_cap.amount,
        budget_cap_currency: extracted.financials.budget_cap.currency,
        duration_months: extracted.duration_months,
        language: extracted.submission.language,
        confidence: extracted.confidence,
        raw_text: text.substring(0, 10000),
      })
      .select()
      .single();

    if (rfpError) throw rfpError;

    // Save deadlines
    if (extracted.deadlines.length > 0) {
      await supabaseClient.from('rfp_deadlines').insert(
        extracted.deadlines.map(d => ({
          rfp_id: rfpData.id,
          type: d.type,
          datetime_iso: d.datetime_iso,
          timezone: d.timezone
        }))
      );
    }

    const duration = Date.now() - startTime;
    console.log(`Extraction complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        rfp_id: rfpData.id,
        extracted: { ...extracted, id: rfpData.id },
        meta: { duration_ms: duration, method: extracted.confidence > 0.7 ? 'ai' : 'regex' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Extraction error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Extraction failed',
        meta: { duration_ms: duration }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});