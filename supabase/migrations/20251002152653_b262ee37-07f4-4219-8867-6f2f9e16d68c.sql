-- Create draft_sections table
CREATE TABLE public.draft_sections (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  section_key TEXT NOT NULL,
  content TEXT,
  why_it_scores TEXT,
  placeholders_needed TEXT[],
  risks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_rfp_section UNIQUE(rfp_id, section_key)
);

-- Enable RLS
ALTER TABLE public.draft_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own drafts"
  ON public.draft_sections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON public.draft_sections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.draft_sections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.draft_sections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_draft_sections_updated_at
  BEFORE UPDATE ON public.draft_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();