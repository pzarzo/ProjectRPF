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
    const { rfpId, format, includeSections } = await req.json();

    if (!rfpId || !format) {
      throw new Error('rfpId and format are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Exporting submission:', { rfpId, format, includeSections });

    // Get RFP details
    const { data: rfp, error: rfpError } = await supabase
      .from('rfps')
      .select('*')
      .eq('id', rfpId)
      .single();

    if (rfpError) throw rfpError;

    // Get draft sections
    const { data: sections, error: sectionsError } = await supabase
      .from('draft_sections')
      .select('*')
      .eq('rfp_id', rfpId);

    if (sectionsError) throw sectionsError;

    // Filter sections to include
    const filteredSections = sections?.filter((s: any) => 
      includeSections.includes(s.section_key)
    ) || [];

    // Get compliance items for compliance matrix
    const { data: requirements, error: reqError } = await supabase
      .from('rfp_requirements')
      .select('*')
      .eq('rfp_id', rfpId);

    if (reqError) throw reqError;

    const { data: complianceItems, error: compError } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('rfp_id', rfpId);

    if (compError) throw compError;

    // Build document content
    const documentContent = buildDocumentContent(rfp, filteredSections, requirements, complianceItems);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `PROPOSAL_${rfp.reference_id || 'RFP'}_${dateStr}.${format}`;

    // For now, return a mock URL
    // In production, you would:
    // 1. Generate actual DOCX/PDF using a library
    // 2. Upload to storage
    // 3. Return signed URL
    const mockUrl = `data:text/plain;base64,${btoa(documentContent)}`;

    const result = {
      url: mockUrl,
      filename,
    };

    console.log('Export complete:', filename);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildDocumentContent(
  rfp: any,
  sections: any[],
  requirements: any[],
  complianceItems: any[]
): string {
  let content = '';

  // Cover page
  content += `PROPOSAL SUBMISSION\n\n`;
  content += `RFP: ${rfp.title}\n`;
  content += `Issuer: ${rfp.issuer}\n`;
  content += `Reference: ${rfp.reference_id}\n`;
  content += `Date: ${new Date().toLocaleDateString()}\n\n`;
  content += `\n${'='.repeat(80)}\n\n`;

  // Table of contents
  content += `TABLE OF CONTENTS\n\n`;
  sections.forEach((section, i) => {
    content += `${i + 1}. ${section.section_key}\n`;
  });
  content += `${sections.length + 1}. Compliance Matrix\n\n`;
  content += `\n${'='.repeat(80)}\n\n`;

  // Sections
  sections.forEach((section, i) => {
    content += `${i + 1}. ${section.section_key.toUpperCase()}\n\n`;
    content += `${section.content || 'No content available.'}\n\n`;
    content += `\n${'-'.repeat(80)}\n\n`;
  });

  // Compliance Matrix
  content += `${sections.length + 1}. COMPLIANCE MATRIX\n\n`;
  content += `Requirement | Type | Status | Evidence\n`;
  content += `${'-'.repeat(80)}\n`;
  
  requirements.forEach((req: any) => {
    const compliance = complianceItems.find((c: any) => c.requirement_id === req.id);
    const status = compliance?.status || 'missing_info';
    const evidence = compliance?.evidence || 'N/A';
    
    content += `${req.text.substring(0, 40)}... | ${req.type} | ${status} | ${evidence.substring(0, 20)}...\n`;
  });

  return content;
}
