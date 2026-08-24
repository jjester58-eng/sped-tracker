export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: {
          user_id: string;
          email: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      case_managers: {
        Row: {
          id: string;
          name: string;
          email: string;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      class_periods: {
        Row: {
          id: string;
          name: string;
          start_time: string | null;
          end_time: string | null;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          start_time?: string | null;
          end_time?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          start_time?: string | null;
          end_time?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          class_name: string;
          data_entry_person_id: string;
          class_period: number | null;
          class_period_id: string | null;
          school_year: string | null;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          class_name: string;
          data_entry_person_id: string;
          class_period?: number | null;
          class_period_id?: string | null;
          school_year?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          class_name?: string;
          data_entry_person_id?: string;
          class_period?: number | null;
          class_period_id?: string | null;
          school_year?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "classes_data_entry_person_id_fkey";
            columns: ["data_entry_person_id"];
            isOneToOne: false;
            referencedRelation: "data_entry_people";
            referencedColumns: ["id"];
          },
        ];
      };
      data_entry_assignments: {
        Row: {
          id: string;
          class_id: string;
          data_entry_person_id: string;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          data_entry_person_id: string;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string;
          data_entry_person_id?: string;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_entry_assignments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_entry_assignments_data_entry_person_id_fkey";
            columns: ["data_entry_person_id"];
            isOneToOne: false;
            referencedRelation: "data_entry_people";
            referencedColumns: ["id"];
          },
        ];
      };
      data_entry_people: {
        Row: {
          id: string;
          name: string;
          email: string;
          user_id: string | null;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          user_id?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          user_id?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          student_id: string;
          goal_description: string;
          goal_number: number | null;
          class_id: string | null;
          subject: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          goal_description: string;
          goal_number?: number | null;
          class_id?: string | null;
          subject?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          goal_description?: string;
          goal_number?: number | null;
          class_id?: string | null;
          subject?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "goals_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          name: string;
          grade_level: string | null;
          case_manager: string | null;
          status: string | null;
          archived_at: string | null;
          archived_reason: string | null;
          is_active: boolean;
          graduation_year: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          grade_level?: string | null;
          case_manager?: string | null;
          status?: string | null;
          archived_at?: string | null;
          archived_reason?: string | null;
          is_active?: boolean;
          graduation_year?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          grade_level?: string | null;
          case_manager?: string | null;
          status?: string | null;
          archived_at?: string | null;
          archived_reason?: string | null;
          is_active?: boolean;
          graduation_year?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      weekly_progress: {
        Row: {
          id: string;
          student_id: string;
          goal_id: string | null;
          case_manager_id: string | null;
          entered_by_id: string | null;
          teacher_id: string | null;
          class_id: string | null;
          class_period: string | null;
          school_year: string | null;
          week_of: string;
          notes: string | null;
          progress_notes: string | null;
          accommodations_used: string | null;
          review_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          goal_id?: string | null;
          case_manager_id?: string | null;
          entered_by_id?: string | null;
          teacher_id?: string | null;
          class_id?: string | null;
          class_period?: string | null;
          school_year?: string | null;
          week_of: string;
          notes?: string | null;
          progress_notes?: string | null;
          accommodations_used?: string | null;
          review_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          goal_id?: string | null;
          case_manager_id?: string | null;
          entered_by_id?: string | null;
          teacher_id?: string | null;
          class_id?: string | null;
          class_period?: string | null;
          school_year?: string | null;
          week_of?: string;
          notes?: string | null;
          progress_notes?: string | null;
          accommodations_used?: string | null;
          review_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_progress_case_manager_id_fkey";
            columns: ["case_manager_id"];
            isOneToOne: false;
            referencedRelation: "case_managers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_progress_entered_by_id_fkey";
            columns: ["entered_by_id"];
            isOneToOne: false;
            referencedRelation: "data_entry_people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_progress_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;