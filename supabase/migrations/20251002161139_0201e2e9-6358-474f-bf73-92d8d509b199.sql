-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create past_proposals table
CREATE TABLE public.past_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client TEXT NOT NULL,
  year INTEGER NOT NULL,
  sector TEXT,
  country TEXT,
  contract_type TEXT,
  language TEXT DEFAULT 'en',
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposal_chunks table for semantic search
CREATE TABLE public.proposal_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.past_proposals(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create snippets table
CREATE TABLE public.snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sector TEXT,
  tags TEXT[],
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.past_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for past_proposals
CREATE POLICY "Users can view their own proposals"
ON public.past_proposals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proposals"
ON public.past_proposals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
ON public.past_proposals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals"
ON public.past_proposals FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for proposal_chunks
CREATE POLICY "Users can view chunks of their proposals"
ON public.proposal_chunks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.past_proposals
  WHERE past_proposals.id = proposal_chunks.proposal_id
  AND past_proposals.user_id = auth.uid()
));

CREATE POLICY "Users can create chunks for their proposals"
ON public.proposal_chunks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.past_proposals
  WHERE past_proposals.id = proposal_chunks.proposal_id
  AND past_proposals.user_id = auth.uid()
));

CREATE POLICY "Users can delete chunks of their proposals"
ON public.proposal_chunks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.past_proposals
  WHERE past_proposals.id = proposal_chunks.proposal_id
  AND past_proposals.user_id = auth.uid()
));

-- RLS Policies for templates
CREATE POLICY "Users can view their own templates"
ON public.templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.templates FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for snippets
CREATE POLICY "Users can view their own snippets"
ON public.snippets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snippets"
ON public.snippets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippets"
ON public.snippets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets"
ON public.snippets FOR DELETE
USING (auth.uid() = user_id);

-- Create index for vector similarity search
CREATE INDEX ON public.proposal_chunks USING ivfflat (embedding vector_cosine_ops);

-- Add trigger for updated_at
CREATE TRIGGER update_past_proposals_updated_at
BEFORE UPDATE ON public.past_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at
BEFORE UPDATE ON public.snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();