export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicEnums = {
  user_role: 'client' | 'coach';
  assignment_status: 'pending' | 'active' | 'archived';
};

type WithRelationships<
  Tables extends Record<
    string,
    {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }
  >,
> = {
  [TableName in keyof Tables]: Tables[TableName] & {
    Relationships: [];
  };
};

type PublicTables = {
      profiles: {
        Row: {
          id: string;
          role: PublicEnums['user_role'];
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: PublicEnums['user_role'];
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: PublicEnums['user_role'];
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      coach_client_assignments: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          status: PublicEnums['assignment_status'];
          assigned_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          status?: PublicEnums['assignment_status'];
          assigned_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          client_id?: string;
          status?: PublicEnums['assignment_status'];
          assigned_at?: string | null;
          created_at?: string;
        };
      };
      medical_questionnaire: {
        Row: { client_id: string; responses: Json; updated_at: string };
        Insert: { client_id: string; responses?: Json; updated_at?: string };
        Update: { client_id?: string; responses?: Json; updated_at?: string };
      };
      goals: {
        Row: {
          id: string;
          client_id: string | null;
          goal_type: string;
          target: string;
          deadline: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          goal_type: string;
          target: string;
          deadline?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          goal_type?: string;
          target?: string;
          deadline?: string | null;
        };
      };
      measurements: {
        Row: {
          id: string;
          client_id: string | null;
          weight: number | null;
          body_fat: number | null;
          chest: number | null;
          waist: number | null;
          date: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          date?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          date?: string | null;
        };
      };
      progress_photos: {
        Row: {
          id: string;
          client_id: string | null;
          photo_url: string;
          date: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          photo_url: string;
          date?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          photo_url?: string;
          date?: string | null;
        };
      };
      workouts: {
        Row: {
          id: string;
          coach_id: string | null;
          client_id: string | null;
          name: string;
          description: string | null;
          assigned_date: string | null;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name: string;
          description?: string | null;
          assigned_date?: string | null;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          assigned_date?: string | null;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string | null;
          exercise_name: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          video_url: string | null;
          order_index: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_id?: string | null;
          exercise_name: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          video_url?: string | null;
          order_index: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          workout_id?: string | null;
          exercise_name?: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          video_url?: string | null;
          order_index?: number;
          notes?: string | null;
        };
      };
      workout_logs: {
        Row: {
          id: string;
          client_id: string | null;
          exercise_id: string | null;
          workout_id: string | null;
          set_number: number;
          weight_used: number;
          reps_completed: number;
          date: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          exercise_id?: string | null;
          workout_id?: string | null;
          set_number: number;
          weight_used: number;
          reps_completed: number;
          date?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          exercise_id?: string | null;
          workout_id?: string | null;
          set_number?: number;
          weight_used?: number;
          reps_completed?: number;
          date?: string;
        };
      };
      completed_workouts: {
        Row: {
          id: string;
          client_id: string | null;
          workout_id: string | null;
          duration_minutes: number | null;
          date_completed: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          workout_id?: string | null;
          duration_minutes?: number | null;
          date_completed?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          workout_id?: string | null;
          duration_minutes?: number | null;
          date_completed?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          coach_id: string | null;
          client_id: string | null;
          name: string;
          start_date: string | null;
          end_date: string | null;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      meal_plan_meals: {
        Row: {
          id: string;
          meal_plan_id: string | null;
          day: number;
          meal_type: string;
          food_items: Json;
          total_calories: number;
          total_protein_g: number;
          total_carbs_g: number;
          total_fat_g: number;
        };
        Insert: {
          id?: string;
          meal_plan_id?: string | null;
          day: number;
          meal_type: string;
          food_items?: Json;
          total_calories?: number;
          total_protein_g?: number;
          total_carbs_g?: number;
          total_fat_g?: number;
        };
        Update: {
          id?: string;
          meal_plan_id?: string | null;
          day?: number;
          meal_type?: string;
          food_items?: Json;
          total_calories?: number;
          total_protein_g?: number;
          total_carbs_g?: number;
          total_fat_g?: number;
        };
      };
      grocery_lists: {
        Row: {
          id: string;
          client_id: string | null;
          items: Json;
          generated_date: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          items?: Json;
          generated_date?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          items?: Json;
          generated_date?: string;
        };
      };
      water_tracker: {
        Row: {
          id: string;
          client_id: string | null;
          date: string | null;
          cups_consumed: number | null;
          daily_goal_cups: number | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          date?: string | null;
          cups_consumed?: number | null;
          daily_goal_cups?: number | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          date?: string | null;
          cups_consumed?: number | null;
          daily_goal_cups?: number | null;
        };
      };
      supplements: {
        Row: {
          id: string;
          client_id: string | null;
          supplement_name: string;
          dosage: string;
          frequency: string;
          time_of_day: Json;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          supplement_name: string;
          dosage: string;
          frequency: string;
          time_of_day?: Json;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          supplement_name?: string;
          dosage?: string;
          frequency?: string;
          time_of_day?: Json;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string | null;
          receiver_id: string | null;
          content: string | null;
          video_url: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          content?: string | null;
          video_url?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          content?: string | null;
          video_url?: string | null;
          timestamp?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string;
          type: string;
          read: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          body: string;
          type: string;
          read?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          body?: string;
          type?: string;
          read?: boolean | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          client_id: string | null;
          coach_id: string | null;
          type: string;
          data: Json;
          generated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          coach_id?: string | null;
          type: string;
          data?: Json;
          generated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          coach_id?: string | null;
          type?: string;
          data?: Json;
          generated_at?: string;
        };
      };
};

export type Database = {
  public: {
    Tables: WithRelationships<PublicTables>;
    Views: Record<string, never>;
    Functions: {
      get_auth_role: {
        Args: Record<string, never>;
        Returns: Database['public']['Enums']['user_role'];
      };
      is_assigned_coach: {
        Args: { coach_uuid: string; client_uuid: string };
        Returns: boolean;
      };
    };
    Enums: {
      [EnumName in keyof PublicEnums]: PublicEnums[EnumName];
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
