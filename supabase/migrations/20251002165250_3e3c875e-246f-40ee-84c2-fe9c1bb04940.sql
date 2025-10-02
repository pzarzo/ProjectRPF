-- Add section_key to rfp_requirements for mapping requirements to draft sections
ALTER TABLE public.rfp_requirements 
ADD COLUMN IF NOT EXISTS section_key text;

COMMENT ON COLUMN public.rfp_requirements.section_key IS 'Maps requirement to draft section: executive, methodology, plan, budget, team, risk, pastperf, compliance';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_rfp_requirements_section_key ON public.rfp_requirements(section_key);
CREATE INDEX IF NOT EXISTS idx_compliance_items_rfp_requirement ON public.compliance_items(rfp_id, requirement_id);