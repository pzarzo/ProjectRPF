-- Create compliance_items table
CREATE TABLE public.compliance_items (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.rfp_requirements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing_info' CHECK (status IN ('complies', 'missing_info', 'fail', 'not_applicable')),
  evidence TEXT,
  action_item TEXT,
  owner TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_rfp_requirement UNIQUE(rfp_id, requirement_id)
);

-- Enable RLS
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own compliance items"
  ON public.compliance_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compliance items"
  ON public.compliance_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance items"
  ON public.compliance_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compliance items"
  ON public.compliance_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON public.compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();