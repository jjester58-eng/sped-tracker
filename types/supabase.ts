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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      case_managers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          class_name: string
          created_at: string | null
          data_entry_person_id: string
          id: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          data_entry_person_id: string
          id?: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          data_entry_person_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_data_entry_person_id_fkey"
            columns: ["data_entry_person_id"]
            isOneToOne: false
            referencedRelation: "data_entry_people"
            referencedColumns: ["id"]
          },
        ]
      }
      data_entry_assignments: {
        Row: {
          class_id: string
          created_at: string | null
          data_entry_person_id: string
          id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          data_entry_person_id: string
          id?: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          data_entry_person_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_entry_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_entry_assignments_data_entry_person_id_fkey"
            columns: ["data_entry_person_id"]
            isOneToOne: false
            referencedRelation: "data_entry_people"
            referencedColumns: ["id"]
          },
        ]
      }
      data_entry_people: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          class_id: string | null
          created_at: string | null
          goal_description: string
          goal_number: number
          id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          goal_description: string
          goal_number: number
          id?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          goal_description?: string
          goal_number?: number
          id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          grade_level: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      weekly_progress: {
        Row: {
          accommodations_used: string | null
          case_manager_id: string | null
          created_at: string | null
          entered_by_id: string
          goal_id: string
          id: string
          notes: string | null
          progress_notes: string | null
          review_date: string | null
          student_id: string
          updated_at: string | null
          week_of: string
        }
        Insert: {
          accommodations_used?: string | null
          case_manager_id?: string | null
          created_at?: string | null
          entered_by_id: string
          goal_id: string
          id?: string
          notes?: string | null
          progress_notes?: string | null
          review_date?: string | null
          student_id: string
          updated_at?: string | null
          week_of: string
        }
        Update: {
          accommodations_used?: string | null
          case_manager_id?: string | null
          created_at?: string | null
          entered_by_id?: string
          goal_id?: string
          id?: string
          notes?: string | null
          progress_notes?: string | null
          review_date?: string | null
          student_id?: string
          updated_at?: string | null
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_progress_case_manager_id_fkey"
            columns: ["case_manager_id"]
            isOneToOne: false
            referencedRelation: "case_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_progress_entered_by_id_fkey"
            columns: ["entered_by_id"]
            isOneToOne: false
            referencedRelation: "data_entry_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
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
