export type UserRole = "client" | "coach";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  client_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  appointment_type:
    | "consultation"
    | "check_in"
    | "workout"
    | "assessment"
    | "progress_review"
    | "nutrition"
    | "other";
  status: "scheduled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  location_type: "in_person" | "video" | "phone" | "other";
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

export type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export type Workout = {
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

export type Measurement = {
  id: string;
  client_id: string | null;
  weight: number | null;
  body_fat: number | null;
  waist: number | null;
  date: string | null;
  notes: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  client_id: string;
  coach_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
};
