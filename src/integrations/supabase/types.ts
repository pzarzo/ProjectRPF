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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
