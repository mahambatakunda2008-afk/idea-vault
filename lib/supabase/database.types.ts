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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      vault_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_evaluations: {
        Row: {
          assumptions: Json
          cost_accessibility: number | null
          created_at: string
          demand_evidence: number | null
          differentiation: number | null
          evaluated_by: string
          evidence: string | null
          feasibility: number | null
          id: string
          idea_id: string
          problem_importance: number | null
          risk_level: number | null
          workspace_id: string
        }
        Insert: {
          assumptions?: Json
          cost_accessibility?: number | null
          created_at?: string
          demand_evidence?: number | null
          differentiation?: number | null
          evaluated_by: string
          evidence?: string | null
          feasibility?: number | null
          id?: string
          idea_id: string
          problem_importance?: number | null
          risk_level?: number | null
          workspace_id: string
        }
        Update: {
          assumptions?: Json
          cost_accessibility?: number | null
          created_at?: string
          demand_evidence?: number | null
          differentiation?: number | null
          evaluated_by?: string
          evidence?: string | null
          feasibility?: number | null
          id?: string
          idea_id?: string
          problem_importance?: number | null
          risk_level?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_evaluations_idea_id_workspace_id_fkey"
            columns: ["idea_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_ideas"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      vault_idea_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string | null
          relationship: Database["public"]["Enums"]["vault_link_type"]
          source_idea_id: string
          target_idea_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          relationship?: Database["public"]["Enums"]["vault_link_type"]
          source_idea_id: string
          target_idea_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          relationship?: Database["public"]["Enums"]["vault_link_type"]
          source_idea_id?: string
          target_idea_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_idea_links_source_idea_id_workspace_id_fkey"
            columns: ["source_idea_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_ideas"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "vault_idea_links_target_idea_id_workspace_id_fkey"
            columns: ["target_idea_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_ideas"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      vault_idea_tags: {
        Row: {
          created_at: string
          idea_id: string
          tag_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          idea_id: string
          tag_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          idea_id?: string
          tag_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_idea_tags_idea_id_workspace_id_fkey"
            columns: ["idea_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_ideas"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "vault_idea_tags_tag_id_workspace_id_fkey"
            columns: ["tag_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_tags"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      vault_ideas: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          differentiation: string | null
          id: string
          priority: Database["public"]["Enums"]["vault_priority"]
          problem: string | null
          proposed_solution: string | null
          resources: string | null
          risks: string | null
          search_document: unknown
          status: Database["public"]["Enums"]["vault_idea_status"]
          summary: string | null
          target_audience: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          differentiation?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["vault_priority"]
          problem?: string | null
          proposed_solution?: string | null
          resources?: string | null
          risks?: string | null
          search_document?: unknown
          status?: Database["public"]["Enums"]["vault_idea_status"]
          summary?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          differentiation?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["vault_priority"]
          problem?: string | null
          proposed_solution?: string | null
          resources?: string | null
          risks?: string | null
          search_document?: unknown
          status?: Database["public"]["Enums"]["vault_idea_status"]
          summary?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_project_tasks: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          is_completed: boolean
          notes: string | null
          position: number
          project_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          position?: number
          project_id: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_project_tasks_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_projects"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      vault_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          source_idea_id: string | null
          status: Database["public"]["Enums"]["vault_project_status"]
          target_date: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["vault_project_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["vault_project_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_projects_source_idea_id_workspace_id_fkey"
            columns: ["source_idea_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_ideas"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "vault_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "vault_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
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
      vault_idea_status:
        | "captured"
        | "developing"
        | "evaluating"
        | "validated"
        | "selected"
        | "in_progress"
        | "completed"
        | "archived"
      vault_link_type:
        | "related"
        | "depends_on"
        | "inspired_by"
        | "duplicates"
        | "contradicts"
      vault_priority: "low" | "normal" | "high" | "critical"
      vault_project_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      vault_idea_status: [
        "captured",
        "developing",
        "evaluating",
        "validated",
        "selected",
        "in_progress",
        "completed",
        "archived",
      ],
      vault_link_type: [
        "related",
        "depends_on",
        "inspired_by",
        "duplicates",
        "contradicts",
      ],
      vault_priority: ["low", "normal", "high", "critical"],
      vault_project_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "archived",
      ],
    },
  },
} as const
