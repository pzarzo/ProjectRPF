-- Add foreign key constraints with CASCADE delete for RFP related tables

-- rfp_requirements
ALTER TABLE public.rfp_requirements
DROP CONSTRAINT IF EXISTS rfp_requirements_rfp_id_fkey,
ADD CONSTRAINT rfp_requirements_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

-- draft_sections
ALTER TABLE public.draft_sections
DROP CONSTRAINT IF EXISTS draft_sections_rfp_id_fkey,
ADD CONSTRAINT draft_sections_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

-- compliance_items
ALTER TABLE public.compliance_items
DROP CONSTRAINT IF EXISTS compliance_items_rfp_id_fkey,
ADD CONSTRAINT compliance_items_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

ALTER TABLE public.compliance_items
DROP CONSTRAINT IF EXISTS compliance_items_requirement_id_fkey,
ADD CONSTRAINT compliance_items_requirement_id_fkey 
  FOREIGN KEY (requirement_id) 
  REFERENCES public.rfp_requirements(id) 
  ON DELETE CASCADE;

-- attachments
ALTER TABLE public.attachments
DROP CONSTRAINT IF EXISTS attachments_rfp_id_fkey,
ADD CONSTRAINT attachments_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

-- citations
ALTER TABLE public.citations
DROP CONSTRAINT IF EXISTS citations_rfp_id_fkey,
ADD CONSTRAINT citations_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

-- evaluation_criteria
ALTER TABLE public.evaluation_criteria
DROP CONSTRAINT IF EXISTS evaluation_criteria_rfp_id_fkey,
ADD CONSTRAINT evaluation_criteria_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;

-- rfp_deadlines
ALTER TABLE public.rfp_deadlines
DROP CONSTRAINT IF EXISTS rfp_deadlines_rfp_id_fkey,
ADD CONSTRAINT rfp_deadlines_rfp_id_fkey 
  FOREIGN KEY (rfp_id) 
  REFERENCES public.rfps(id) 
  ON DELETE CASCADE;