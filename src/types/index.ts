export type Role = 'client' | 'coach';
export type AssignmentStatus = 'pending' | 'active' | 'archived';
export type WeightUnit = 'lb' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';

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
  client_id?: string | null;
  goal_type: 'primary' | 'weight' | 'strength' | 'custom';
  target: string;
  deadline?: string | null;
}

export interface Measurement {
  id: string;
  client_id?: string | null;
  weight?: number | null;
  body_fat?: number | null;
  chest?: number | null;
  waist?: number | null;
  date?: string | null;
}

export interface FitnessAssessment {
  primaryGoal: string;
  dateOfBirth: string;
  age: number;
  heightUnit: HeightUnit;
  heightCm: number;
  heightFeet?: number;
  heightInches?: number;
  startingWeightKg: number;
  currentWeightKg: number;
  currentWeight: {
    value: number;
    unit: WeightUnit;
  };
  goalWeightKg: number;
  goalWeight: {
    value: number;
    unit: WeightUnit;
  };
  bmi: number | null;
  experienceLevel: string;
  activityLevel: string;
  trainingFrequency: string;
  workoutLocation: string;
  equipment: string[];
  focusAreas: string[];
  sessionDuration: string;
  healthNotes: string;
  limitations: string[];
  completed_at?: string;
}

export interface FitnessProfileSummary {
  assessment: FitnessAssessment;
  latestMeasurement?: Measurement | null;
  measurementCount: number;
  startingWeightKg: number;
  currentWeightKg?: number | null;
  goalWeightKg: number;
  bmi: number | null;
}

export interface CoachVisibleClient {
  profile: Profile;
  fitnessSummary: FitnessProfileSummary | null;
  assignment: CoachClientAssignment | null;
  isPrivilegedAccess?: boolean;
}

export interface StaffPermission {
  user_id: string;
  can_view_all_clients: boolean;
  can_manage_all_client_measurements: boolean;
  created_at: string;
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
  status?: string;
  estimated_minutes?: number | null;
  updated_at?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id?: string | null;
  library_exercise_id?: string | null;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  video_url?: string | null;
  order_index: number;
  notes?: string | null;
}

export interface ExerciseLibraryItem {
  id: string;
  coach_id: string;
  name: string;
  description?: string | null;
  instructions: string;
  muscle_group: string;
  equipment: string;
  video_path?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[];
}

export interface WorkoutSession {
  id: string;
  client_id: string;
  workout_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  duration_minutes?: number | null;
  prescription_snapshot: any;
}

export interface WorkoutSetLog {
  id: string;
  session_id: string;
  client_id: string;
  workout_id?: string | null;
  workout_exercise_id?: string | null;
  library_exercise_id?: string | null;
  exercise_name_snapshot: string;
  set_number: number;
  target_reps?: string | null;
  prescribed_rest_seconds?: number | null;
  weight_used: number;
  reps_completed: number;
  completed_at: string;
}

export interface WorkoutHistoryItem extends CompletedWorkout {
  workout?: Workout | null;
  session?: WorkoutSession | null;
  setLogs?: WorkoutSetLog[];
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
  description?: string | null;
  instructions?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  target_calories?: number | null;
  target_protein_g?: number | null;
  target_carbs_g?: number | null;
  target_fat_g?: number | null;
  status?: 'draft' | 'assigned' | 'archived' | string;
  assigned_at?: string | null;
  updated_at?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';

export interface FoodItem {
  name: string;
  portion?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  category?: string;
}

export interface MealPlanMeal {
  id: string;
  meal_plan_id?: string | null;
  day: number; // 1-7
  meal_type: MealType;
  meal_label?: string | null;
  food_items: FoodItem[]; // JSON
  notes?: string | null;
  sort_order?: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface GroceryItem {
  name: string;
  quantity?: string;
  category?: string;
  checked?: boolean;
}

export interface GroceryList {
  id: string;
  client_id?: string | null;
  meal_plan_id?: string | null;
  title?: string;
  items: GroceryItem[]; // JSON
  generated_date: string;
  updated_at?: string;
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
  coach_id?: string | null;
  supplement_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

export interface MealPlanWithMeals extends MealPlan {
  meals: MealPlanMeal[];
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
  WorkoutDetail: { workoutId: string };
  ActiveWorkout: { workoutId: string };
  ExerciseDetail: { workoutId?: string; exerciseId?: string; workoutExerciseId?: string };
  WorkoutHistoryDetail: { completedWorkoutId: string };
  MealPlanDetail: { mealPlanId: string };
  ClientOnboarding: undefined;
  ClientAssessment: undefined;
  ClientMeasurements: { clientId?: string; clientName?: string } | undefined;
  CoachClientDetail: { clientId: string; clientName?: string };
  CoachClientAssessment: { clientId: string; clientName?: string };
  CoachClientMeasurements: { clientId: string; clientName?: string };
  // add others later
};

export type CoachTabsParamList = {
  Coach: undefined;
  Clients: undefined;
  Programs: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type CoachStackParamList = {
  CoachTabs: undefined;
  ClientDetail: { clientId: string };
  CoachExerciseEditor: { exerciseId?: string } | undefined;
  CoachWorkoutBuilder: { workoutId?: string; clientId?: string } | undefined;
  CoachMealPlanBuilder: { mealPlanId?: string; clientId?: string } | undefined;
  CoachNutrition: undefined;
  CoachWorkoutDetail: { workoutId: string };
  // add others later
};
