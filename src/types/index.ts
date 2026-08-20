export type Role = 'client' | 'coach';

export interface Profile {
  id: string; // Supabase auth.users id
  role: Role;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface MedicalQuestionnaire {
  client_id: string;
  responses: any; // JSON
  updated_at: string;
}

export interface Goal {
  id: string;
  client_id: string;
  goal_type: 'weight' | 'strength' | 'custom';
  target: string;
  deadline: string;
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
  coach_id: string;
  client_id: string;
  name: string;
  description?: string;
  assigned_date: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  video_url?: string;
  order_index: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  exercise_id: string;
  weight_used: number;
  reps_completed: number;
  date: string;
  set_number: number;
}

export interface CompletedWorkout {
  id: string;
  client_id: string;
  workout_id: string;
  date_completed: string;
  duration_minutes?: number;
}

export interface MealPlan {
  id: string;
  coach_id: string;
  client_id: string;
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
  meal_plan_id: string;
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
  client_id: string;
  items: GroceryItem[]; // JSON
  generated_date: string;
}

export interface WaterTracker {
  id: string;
  client_id: string;
  date: string;
  cups_consumed: number;
  daily_goal_cups: number;
}

export interface Supplement {
  id: string;
  client_id: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  video_url?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  coach_id: string;
  type: string;
  data: any; // JSON
  generated_at: string;
}

// Navigation Types
export type ClientTabsParamList = {
  Home: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type ClientStackParamList = {
  ClientTabs: undefined;
  ExerciseDetail: { workoutId: string };
  // add others later
};

export type CoachTabsParamList = {
  Clients: undefined;
  Programs: undefined;
  Nutrition: undefined;
  Messages: undefined;
  Analytics: undefined;
};

export type CoachStackParamList = {
  CoachTabs: undefined;
  ClientDetail: { clientId: string };
  // add others later
};
