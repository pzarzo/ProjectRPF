export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string
          export_naming_convention: string | null
          footer_text: string | null
          id: string
          language: string | null
          llm_model: string | null
          logo_url: string | null
          min_confidence: number | null
          organization_name: string | null
          require_citations: boolean | null
          require_login: boolean | null
          timezone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          export_naming_convention?: string | null
          footer_text?: string | null
          id?: string
          language?: string | null
          llm_model?: string | null
          logo_url?: string | null
          min_confidence?: number | null
          organization_name?: string | null
          require_citations?: boolean | null
          require_login?: boolean | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          export_naming_convention?: string | null
          footer_text?: string | null
          id?: string
          language?: string | null
          llm_model?: string | null
          logo_url?: string | null
          min_confidence?: number | null
          organization_name?: string | null
          require_citations?: boolean | null
          require_login?: boolean | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string | null
          filename: string
          id: string
          rfp_id: string
          signed: boolean | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          filename: string
          id?: string
          rfp_id: string
          signed?: boolean | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          filename?: string
          id?: string
          rfp_id?: string
          signed?: boolean | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          created_at: string | null
          field: string
          id: string
          page: number | null
          rfp_id: string
          section: string | null
        }
        Insert: {
          created_at?: string | null
          field: string
          id?: string
          page?: number | null
          rfp_id: string
          section?: string | null
        }
        Update: {
          created_at?: string | null
          field?: string
          id?: string
          page?: number | null
          rfp_id?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citations_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_items: {
        Row: {
          action_item: string | null
          created_at: string
          due_date: string | null
          evidence: string | null
          id: string
          owner: string | null
          requirement_id: string
          rfp_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_item?: string | null
          created_at?: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          owner?: string | null
          requirement_id: string
          rfp_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_item?: string | null
          created_at?: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          owner?: string | null
          requirement_id?: string
          rfp_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "rfp_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_items_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_packs: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      draft_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          placeholders_needed: string[] | null
          rfp_id: string
          risks: string | null
          section_key: string
          updated_at: string
          user_id: string
          why_it_scores: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          placeholders_needed?: string[] | null
          rfp_id: string
          risks?: string | null
          section_key: string
          updated_at?: string
          user_id: string
          why_it_scores?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          placeholders_needed?: string[] | null
          rfp_id?: string
          risks?: string | null
          section_key?: string
          updated_at?: string
          user_id?: string
          why_it_scores?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_sections_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          method: string | null
          name: string
          rfp_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          method?: string | null
          name: string
          rfp_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          method?: string | null
          name?: string
          rfp_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      past_proposals: {
        Row: {
          client: string
          contract_type: string | null
          country: string | null
          created_at: string
          file_url: string
          filename: string
          id: string
          language: string | null
          sector: string | null
          updated_at: string
          uploaded_by: string | null
          user_id: string
          year: number
        }
        Insert: {
          client: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          file_url: string
          filename: string
          id?: string
          language?: string | null
          sector?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id: string
          year: number
        }
        Update: {
          client?: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          file_url?: string
          filename?: string
          id?: string
          language?: string | null
          sector?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      proposal_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          embedding: string | null
          id: string
          proposal_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          proposal_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_chunks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "past_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      rfp_deadlines: {
        Row: {
          created_at: string | null
          datetime_iso: string
          id: string
          rfp_id: string
          timezone: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          datetime_iso: string
          id?: string
          rfp_id: string
          timezone?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          datetime_iso?: string
          id?: string
          rfp_id?: string
          timezone?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfp_deadlines_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      rfp_requirements: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          priority: string | null
          rfp_id: string
          section_key: string | null
          source_page: number | null
          source_section: string | null
          text: string
          type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          rfp_id: string
          section_key?: string | null
          source_page?: number | null
          source_section?: string | null
          text: string
          type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          rfp_id?: string
          section_key?: string | null
          source_page?: number | null
          source_section?: string | null
          text?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfp_requirements_rfp_id_fkey"
            columns: ["rfp_id"]
            isOneToOne: false
            referencedRelation: "rfps"
            referencedColumns: ["id"]
          },
        ]
      }
      rfps: {
        Row: {
          budget_cap_amount: number | null
          budget_cap_currency: string | null
          confidence: number | null
          contract_type: string | null
          created_at: string | null
          duration_months: number | null
          id: string
          issuer: string | null
          language: string | null
          procurement_method: string | null
          raw_text: string | null
          reference_id: string | null
          scope_summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_cap_amount?: number | null
          budget_cap_currency?: string | null
          confidence?: number | null
          contract_type?: string | null
          created_at?: string | null
          duration_months?: number | null
          id?: string
          issuer?: string | null
          language?: string | null
          procurement_method?: string | null
          raw_text?: string | null
          reference_id?: string | null
          scope_summary?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_cap_amount?: number | null
          budget_cap_currency?: string | null
          confidence?: number | null
          contract_type?: string | null
          created_at?: string | null
          duration_months?: number | null
          id?: string
          issuer?: string | null
          language?: string | null
          procurement_method?: string | null
          raw_text?: string | null
          reference_id?: string | null
          scope_summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      snippets: {
        Row: {
          content: string
          created_at: string
          id: string
          sector: string | null
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sector?: string | null
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sector?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          filename: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          filename: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          filename?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_proposal_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          id: string
          proposal_id: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "owner" | "editor" | "reviewer" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "editor", "reviewer", "viewer"],
    },
  },
} as const
