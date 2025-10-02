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
    const { query } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Performing semantic search for:', query);

    // Generate embedding for the search query using Lovable AI
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small', // or another embedding model
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar proposal chunks using vector similarity
    const { data: similarChunks, error: searchError } = await supabase
      .rpc('match_proposal_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10,
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    // Also search snippets by text
    const { data: snippets, error: snippetsError } = await supabase
      .from('snippets')
      .select('*')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english',
      })
      .limit(5);

    if (snippetsError) {
      console.error('Snippets search error:', snippetsError);
    }

    const results = {
      proposalChunks: similarChunks || [],
      snippets: snippets || [],
    };

    console.log('Search complete:', {
      proposalChunks: results.proposalChunks.length,
      snippets: results.snippets.length,
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
