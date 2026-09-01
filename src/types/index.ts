export type Role = 'client' | 'coach';
export type AssignmentStatus = 'pending' | 'active' | 'archived';

export interface Profile {
  id: string; // Supabase auth.users id
  role: Role;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
}

export interface MedicalQuestionnaire {
  client_id?: string | null;
  responses: any; // JSON
  updated_at: string;
}

export interface Goal {
  id: string;
  client_id: string;
  goal_type: 'weight' | 'strength' | 'custom';
  target: string;
  deadline?: string | null;
}

export interface Measurement {
  id: string;
  client_id: string;
  weight?: number;
  body_fat?: number;
  chest?: number;
  waist?: number;
  date: string;
}

export interface ProgressPhoto {
  id: string;
  client_id: string;
  photo_url: string;
  date: string;
}

export interface Workout {
  id: string;
  coach_id?: string | null;
  client_id?: string | null;
  name: string;
  description?: string | null;
  assigned_date?: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id?: string | null;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  video_url?: string | null;
  order_index: number;
  notes?: string | null;
}

export interface WorkoutLog {
  id: string;
  client_id?: string | null;
  exercise_id?: string | null;
  workout_id?: string | null;
  weight_used: number;
  reps_completed: number;
  date: string;
  set_number: number;
}

export interface CoachClientAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  status: AssignmentStatus;
  assigned_at: string | null;
  created_at: string;
}

export interface CompletedWorkout {
  id: string;
  client_id?: string | null;
  workout_id?: string | null;
  date_completed: string;
  duration_minutes?: number;
}

export interface MealPlan {
  id: string;
  coach_id?: string | null;
  client_id?: string | null;
  name: string;
  start_date: string;
  end_date: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanMeal {
  id: string;
  meal_plan_id?: string | null;
  day: number; // 1-7
  meal_type: MealType;
  food_items: FoodItem[]; // JSON
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface GroceryItem {
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
}

export interface GroceryList {
  id: string;
  client_id?: string | null;
  items: GroceryItem[]; // JSON
  generated_date: string;
}

export interface WaterTracker {
  id: string;
  client_id?: string | null;
  date?: string | null;
  cups_consumed?: number | null;
  daily_goal_cups?: number | null;
}

export interface Supplement {
  id: string;
  client_id?: string | null;
  supplement_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
}

export interface Message {
  id: string;
  sender_id?: string | null;
  receiver_id?: string | null;
  content?: string | null;
  timestamp: string;
  video_url?: string;
}

export interface Notification {
  id: string;
  user_id?: string | null;
  title: string;
  body: string;
  type: string;
  read?: boolean | null;
  created_at: string;
}

export interface Report {
  id: string;
  client_id?: string | null;
  coach_id?: string | null;
  type: string;
  data: any; // JSON
  generated_at: string;
}

// Navigation Types
export type ClientTabsParamList = {
  Home: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Coach: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type ClientStackParamList = {
  ClientTabs: undefined;
  ExerciseDetail: { workoutId: string };
  // add others later
};

export type CoachTabsParamList = {
  Coach: undefined;
  Clients: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Profile: undefined;
};

export type CoachStackParamList = {
  CoachTabs: undefined;
  ClientDetail: { clientId: string };
  // add others later
};
