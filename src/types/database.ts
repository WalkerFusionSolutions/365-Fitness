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

type AppointmentType =
  | 'consultation'
  | 'check_in'
  | 'workout'
  | 'assessment'
  | 'progress_review'
  | 'nutrition'
  | 'other';
type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
type AppointmentLocationType = 'in_person' | 'video' | 'phone' | 'other';
type NotificationType =
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'workout_assigned'
  | 'meal_plan_assigned'
  | 'message_received'
  | 'system';

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
      appointments: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          title: string;
          description: string | null;
          appointment_type: AppointmentType;
          status: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          location_type: AppointmentLocationType;
          location_text: string | null;
          meeting_url: string | null;
          client_notes: string | null;
          coach_notes: string | null;
          created_by: string;
          cancelled_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          title: string;
          description?: string | null;
          appointment_type: AppointmentType;
          status?: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          location_type: AppointmentLocationType;
          location_text?: string | null;
          meeting_url?: string | null;
          client_notes?: string | null;
          coach_notes?: string | null;
          created_by: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          coach_id?: string;
          title?: string;
          description?: string | null;
          appointment_type?: AppointmentType;
          status?: AppointmentStatus;
          starts_at?: string;
          ends_at?: string;
          location_type?: AppointmentLocationType;
          location_text?: string | null;
          meeting_url?: string | null;
          client_notes?: string | null;
          coach_notes?: string | null;
          created_by?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointment_reminders: {
        Row: {
          id: string;
          appointment_id: string;
          recipient_id: string;
          remind_at: string;
          reminder_type: '24_hours_before' | '1_hour_before';
          status: 'pending' | 'in_app_created' | 'push_queued' | 'sent' | 'cancelled' | 'failed';
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          recipient_id: string;
          remind_at: string;
          reminder_type: '24_hours_before' | '1_hour_before';
          status?: 'pending' | 'in_app_created' | 'push_queued' | 'sent' | 'cancelled' | 'failed';
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          recipient_id?: string;
          remind_at?: string;
          reminder_type?: '24_hours_before' | '1_hour_before';
          status?: 'pending' | 'in_app_created' | 'push_queued' | 'sent' | 'cancelled' | 'failed';
          created_at?: string;
          processed_at?: string | null;
        };
      };
      push_devices: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          platform: 'ios' | 'android' | 'web' | 'unknown';
          device_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          platform: 'ios' | 'android' | 'web' | 'unknown';
          device_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          platform?: 'ios' | 'android' | 'web' | 'unknown';
          device_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: PublicEnums['user_role'];
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          phone_number: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: PublicEnums['user_role'];
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: PublicEnums['user_role'];
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
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
      staff_permissions: {
        Row: {
          user_id: string;
          can_view_all_clients: boolean;
          can_manage_all_client_measurements: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          can_view_all_clients?: boolean;
          can_manage_all_client_measurements?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          can_view_all_clients?: boolean;
          can_manage_all_client_measurements?: boolean;
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
          hips: number | null;
          left_arm: number | null;
          right_arm: number | null;
          left_thigh: number | null;
          right_thigh: number | null;
          neck: number | null;
          date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          left_arm?: number | null;
          right_arm?: number | null;
          left_thigh?: number | null;
          right_thigh?: number | null;
          neck?: number | null;
          date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          left_arm?: number | null;
          right_arm?: number | null;
          left_thigh?: number | null;
          right_thigh?: number | null;
          neck?: number | null;
          date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress_photos: {
        Row: {
          id: string;
          client_id: string | null;
          photo_url: string | null;
          storage_path: string;
          pose: 'front' | 'side' | 'back' | 'other';
          date: string | null;
          taken_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          photo_url?: string | null;
          storage_path: string;
          pose?: 'front' | 'side' | 'back' | 'other';
          date?: string | null;
          taken_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          photo_url?: string | null;
          storage_path?: string;
          pose?: 'front' | 'side' | 'back' | 'other';
          date?: string | null;
          taken_at?: string;
          notes?: string | null;
          created_at?: string;
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
          status: string;
          estimated_minutes: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name: string;
          description?: string | null;
          assigned_date?: string | null;
          status?: string;
          estimated_minutes?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          assigned_date?: string | null;
          status?: string;
          estimated_minutes?: number | null;
          updated_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string | null;
          library_exercise_id: string | null;
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
          library_exercise_id?: string | null;
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
          library_exercise_id?: string | null;
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
      exercise_library: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          description: string | null;
          instructions: string;
          muscle_group: string;
          equipment: string;
          video_path: string | null;
          thumbnail_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          description?: string | null;
          instructions?: string;
          muscle_group?: string;
          equipment?: string;
          video_path?: string | null;
          thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          name?: string;
          description?: string | null;
          instructions?: string;
          muscle_group?: string;
          equipment?: string;
          video_path?: string | null;
          thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          client_id: string;
          workout_id: string | null;
          started_at: string;
          completed_at: string | null;
          duration_minutes: number | null;
          prescription_snapshot: Json;
        };
        Insert: {
          id?: string;
          client_id: string;
          workout_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          prescription_snapshot?: Json;
        };
        Update: {
          id?: string;
          client_id?: string;
          workout_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          prescription_snapshot?: Json;
        };
      };
      workout_set_logs: {
        Row: {
          id: string;
          session_id: string;
          client_id: string;
          workout_id: string | null;
          workout_exercise_id: string | null;
          library_exercise_id: string | null;
          exercise_name_snapshot: string;
          set_number: number;
          target_reps: string | null;
          prescribed_rest_seconds: number | null;
          weight_used: number;
          reps_completed: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          client_id: string;
          workout_id?: string | null;
          workout_exercise_id?: string | null;
          library_exercise_id?: string | null;
          exercise_name_snapshot: string;
          set_number: number;
          target_reps?: string | null;
          prescribed_rest_seconds?: number | null;
          weight_used?: number;
          reps_completed?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          client_id?: string;
          workout_id?: string | null;
          workout_exercise_id?: string | null;
          library_exercise_id?: string | null;
          exercise_name_snapshot?: string;
          set_number?: number;
          target_reps?: string | null;
          prescribed_rest_seconds?: number | null;
          weight_used?: number;
          reps_completed?: number;
          completed_at?: string;
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
          description: string | null;
          instructions: string | null;
          start_date: string | null;
          end_date: string | null;
          target_calories: number | null;
          target_protein_g: number | null;
          target_carbs_g: number | null;
          target_fat_g: number | null;
          status: string;
          assigned_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name: string;
          description?: string | null;
          instructions?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          target_calories?: number | null;
          target_protein_g?: number | null;
          target_carbs_g?: number | null;
          target_fat_g?: number | null;
          status?: string;
          assigned_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          instructions?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          target_calories?: number | null;
          target_protein_g?: number | null;
          target_carbs_g?: number | null;
          target_fat_g?: number | null;
          status?: string;
          assigned_at?: string | null;
          updated_at?: string;
        };
      };
      meal_plan_meals: {
        Row: {
          id: string;
          meal_plan_id: string | null;
          day: number;
          meal_type: string;
          meal_label: string | null;
          food_items: Json;
          notes: string | null;
          sort_order: number;
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
          meal_label?: string | null;
          food_items?: Json;
          notes?: string | null;
          sort_order?: number;
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
          meal_label?: string | null;
          food_items?: Json;
          notes?: string | null;
          sort_order?: number;
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
          meal_plan_id: string | null;
          title: string;
          items: Json;
          generated_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          meal_plan_id?: string | null;
          title?: string;
          items?: Json;
          generated_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          meal_plan_id?: string | null;
          title?: string;
          items?: Json;
          generated_date?: string;
          updated_at?: string;
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
          coach_id: string | null;
          supplement_name: string;
          dosage: string;
          frequency: string;
          time_of_day: Json;
          notes: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          coach_id?: string | null;
          supplement_name: string;
          dosage: string;
          frequency: string;
          time_of_day?: Json;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          coach_id?: string | null;
          supplement_name?: string;
          dosage?: string;
          frequency?: string;
          time_of_day?: Json;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          client_last_read_at: string | null;
          coach_last_read_at: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          client_last_read_at?: string | null;
          coach_last_read_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          coach_id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          client_last_read_at?: string | null;
          coach_last_read_at?: string | null;
          status?: string;
        };
      };
      message_attachments: {
        Row: {
          id: string;
          conversation_id: string;
          uploader_id: string;
          client_id: string;
          storage_path: string;
          attachment_type: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          duration_seconds: number | null;
          original_filename: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          uploader_id: string;
          client_id: string;
          storage_path: string;
          attachment_type?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          original_filename?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          uploader_id?: string;
          client_id?: string;
          storage_path?: string;
          attachment_type?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          original_filename?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          receiver_id: string;
          content: string | null;
          video_url: string | null;
          timestamp: string;
          message_type: 'text' | 'video_feedback';
          body: string | null;
          attachment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          receiver_id: string;
          content?: string | null;
          video_url?: string | null;
          timestamp?: string;
          message_type?: 'text' | 'video_feedback';
          body?: string | null;
          attachment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string | null;
          video_url?: string | null;
          timestamp?: string;
          message_type?: 'text' | 'video_feedback';
          body?: string | null;
          attachment_id?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string;
          type: NotificationType;
          read: boolean | null;
          is_read: boolean;
          read_at: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          body: string;
          type: NotificationType;
          read?: boolean | null;
          is_read?: boolean;
          read_at?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          body?: string;
          type?: NotificationType;
          read?: boolean | null;
          is_read?: boolean;
          read_at?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
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
      can_manage_all_client_measurements: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_view_all_clients: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_access_client: {
        Args: { client_uuid: string };
        Returns: boolean;
      };
      can_access_conversation: {
        Args: { conversation_uuid: string };
        Returns: boolean;
      };
      can_manage_appointment: {
        Args: { appointment_client_id: string; appointment_coach_id: string };
        Returns: boolean;
      };
      can_send_to_conversation: {
        Args: { conversation_uuid: string };
        Returns: boolean;
      };
      can_coach_client: {
        Args: { client_uuid: string };
        Returns: boolean;
      };
      coach_can_access_client: {
        Args: { coach_uuid: string; client_uuid: string };
        Returns: boolean;
      };
      get_or_create_conversation: {
        Args: { client_uuid: string; coach_uuid: string };
        Returns: Database['public']['Tables']['conversations']['Row'];
      };
      get_primary_coach: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          role: Database['public']['Enums']['user_role'];
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        }>;
      };
      mark_conversation_read: {
        Args: { conversation_uuid: string };
        Returns: Database['public']['Tables']['conversations']['Row'];
      };
      is_client_profile: {
        Args: { client_uuid: string };
        Returns: boolean;
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
