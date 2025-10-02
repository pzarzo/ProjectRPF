-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION public.match_proposal_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  proposal_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.proposal_id,
    pc.chunk_text,
    pc.chunk_index,
    1 - (pc.embedding <=> query_embedding) AS similarity
  FROM proposal_chunks pc
  WHERE 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;