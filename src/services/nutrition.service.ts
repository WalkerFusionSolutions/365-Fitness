import {
  FoodItem,
  GroceryItem,
  GroceryList,
  MealPlan,
  MealPlanMeal,
  MealPlanWithMeals,
  Supplement,
  WaterTracker,
} from '@/types';
import { Json } from '@/types/database';
import { supabase } from '@/services/supabase';
import { AppServiceError, throwIfSupabaseError } from '@/services/errors';

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppServiceError('Unable to verify your session.', error);
  }

  if (!user) {
    throw new AppServiceError('Please sign in to continue.');
  }

  return user.id;
}

function asFoodItems(value: Json): FoodItem[] {
  return Array.isArray(value) ? (value as unknown as FoodItem[]) : [];
}

function asGroceryItems(value: Json): GroceryItem[] {
  return Array.isArray(value) ? (value as unknown as GroceryItem[]) : [];
}

function asStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeMeal(meal: {
  id: string;
  meal_plan_id?: string | null;
  day: number;
  meal_type: string;
  meal_label?: string | null;
  food_items: Json;
  notes?: string | null;
  sort_order?: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}): MealPlanMeal {
  return {
    ...meal,
    meal_type: (meal.meal_type || 'custom') as MealPlanMeal['meal_type'],
    food_items: asFoodItems(meal.food_items),
    sort_order: meal.sort_order ?? 1,
  };
}

function normalizePlan(
  plan: MealPlan,
  meals: Parameters<typeof normalizeMeal>[0][] = []
): MealPlanWithMeals {
  return {
    ...plan,
    meals: meals.map(normalizeMeal).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.sort_order ?? 1) - (b.sort_order ?? 1);
    }),
  };
}

function deriveTotals(foodItems: FoodItem[]) {
  return foodItems.reduce(
    (totals, item) => ({
      calories: totals.calories + Number(item.calories ?? 0),
      protein: totals.protein + Number(item.protein ?? 0),
      carbs: totals.carbs + Number(item.carbs ?? 0),
      fat: totals.fat + Number(item.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export async function getClientActiveMealPlan(clientId?: string) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const { data: plan, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('client_id', resolvedClientId)
    .eq('status', 'assigned')
    .order('assigned_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load meal plan.');

  if (!plan) return null;
  return getMealPlanWithMeals(plan.id);
}

export async function getMealPlanWithMeals(mealPlanId: string) {
  const [planResult, mealsResult] = await Promise.all([
    supabase.from('meal_plans').select('*').eq('id', mealPlanId).maybeSingle(),
    supabase
      .from('meal_plan_meals')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .order('day', { ascending: true })
      .order('sort_order', { ascending: true }),
  ]);

  throwIfSupabaseError(planResult.error, 'Unable to load meal plan.');
  throwIfSupabaseError(mealsResult.error, 'Unable to load meals.');

  if (!planResult.data) return null;
  return normalizePlan(planResult.data, mealsResult.data ?? []);
}

export async function getCoachMealPlans() {
  const coachId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('coach_id', coachId)
    .order('updated_at', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load meal plans.');
  return data ?? [];
}

export async function saveMealPlan(input: {
  id?: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  clientId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  targets?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  };
  meals: Array<{
    id?: string;
    day: number;
    mealType: string;
    mealLabel?: string | null;
    notes?: string | null;
    foodItems: FoodItem[];
    sortOrder: number;
  }>;
}) {
  const coachId = await getCurrentUserId();
  const assigning = Boolean(input.clientId);
  const payload = {
    coach_id: coachId,
    client_id: null,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    instructions: input.instructions?.trim() || null,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    target_calories: input.targets?.calories ?? null,
    target_protein_g: input.targets?.protein ?? null,
    target_carbs_g: input.targets?.carbs ?? null,
    target_fat_g: input.targets?.fat ?? null,
    status: 'draft',
    assigned_at: null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data: existing, error: existingError } = await supabase
      .from('meal_plans')
      .select('status')
      .eq('id', input.id)
      .maybeSingle();

    throwIfSupabaseError(existingError, 'Unable to load meal plan.');

    if (existing?.status !== 'draft') {
      throw new AppServiceError(
        'Assigned meal plans are locked. Create a new draft for changes.'
      );
    }
  }

  const { data: plan, error: planError } = input.id
    ? await supabase
        .from('meal_plans')
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single()
    : await supabase.from('meal_plans').insert(payload).select('*').single();

  throwIfSupabaseError(planError, 'Unable to save meal plan.');

  if (!plan) {
    throw new AppServiceError('Unable to save meal plan.');
  }

  const { error: deleteError } = await supabase
    .from('meal_plan_meals')
    .delete()
    .eq('meal_plan_id', plan.id);

  throwIfSupabaseError(deleteError, 'Unable to update meals.');

  if (input.meals.length > 0) {
    const rows = input.meals.map((meal, index) => {
      const totals = deriveTotals(meal.foodItems);

      return {
        meal_plan_id: plan.id,
        day: meal.day,
        meal_type: meal.mealType,
        meal_label: meal.mealLabel?.trim() || null,
        notes: meal.notes?.trim() || null,
        sort_order: meal.sortOrder || index + 1,
        food_items: meal.foodItems as unknown as Json,
        total_calories: totals.calories,
        total_protein_g: totals.protein,
        total_carbs_g: totals.carbs,
        total_fat_g: totals.fat,
      };
    });

    const { error: mealsError } = await supabase.from('meal_plan_meals').insert(rows);
    throwIfSupabaseError(mealsError, 'Unable to save meals.');
  }

  if (assigning) {
    const { error: assignError } = await supabase
      .from('meal_plans')
      .update({
        client_id: input.clientId,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      })
      .eq('id', plan.id);

    throwIfSupabaseError(assignError, 'Unable to assign meal plan.');
  }

  return getMealPlanWithMeals(plan.id);
}

export async function archiveMealPlan(mealPlanId: string) {
  const { data, error } = await supabase
    .from('meal_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', mealPlanId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to archive meal plan.');
  return data;
}

export async function getClientGroceryList(clientId?: string, mealPlanId?: string | null) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  let query = supabase
    .from('grocery_lists')
    .select('*')
    .eq('client_id', resolvedClientId)
    .order('generated_date', { ascending: false })
    .limit(1);

  if (mealPlanId) {
    query = query.eq('meal_plan_id', mealPlanId);
  }

  const { data, error } = await query.maybeSingle();
  throwIfSupabaseError(error, 'Unable to load grocery list.');

  if (!data) return null;
  return { ...data, items: asGroceryItems(data.items) };
}

export async function saveGroceryList(input: {
  id?: string;
  clientId: string;
  mealPlanId?: string | null;
  title?: string;
  items: GroceryItem[];
}) {
  const payload = {
    client_id: input.clientId,
    meal_plan_id: input.mealPlanId ?? null,
    title: input.title?.trim() || 'Grocery List',
    items: input.items as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = input.id
    ? await supabase
        .from('grocery_lists')
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single()
    : await supabase.from('grocery_lists').insert(payload).select('*').single();

  throwIfSupabaseError(error, 'Unable to save grocery list.');
  return data ? { ...data, items: asGroceryItems(data.items) } : null;
}

export function buildGroceryItemsFromMeals(meals: MealPlanMeal[]): GroceryItem[] {
  const byName = new Map<string, GroceryItem>();

  meals.forEach((meal) => {
    meal.food_items.forEach((food) => {
      if (!food.name?.trim()) return;
      const key = food.name.trim().toLowerCase();
      if (byName.has(key)) return;
      byName.set(key, {
        name: food.name.trim(),
        quantity: food.portion || '',
        category: food.category || 'Other',
        checked: false,
      });
    });
  });

  return Array.from(byName.values()).sort((a, b) =>
    `${a.category ?? 'Other'} ${a.name}`.localeCompare(`${b.category ?? 'Other'} ${b.name}`)
  );
}

export async function getTodaysWater(clientId?: string) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('water_tracker')
    .select('*')
    .eq('client_id', resolvedClientId)
    .eq('date', today)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load water tracker.');
  return data;
}

export async function upsertWater(input: {
  clientId: string;
  date?: string;
  cups: number;
  dailyGoalCups?: number;
}) {
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('water_tracker')
    .upsert(
      {
        client_id: input.clientId,
        date,
        cups_consumed: Math.max(0, input.cups),
        daily_goal_cups: input.dailyGoalCups ?? 8,
      },
      { onConflict: 'client_id,date' }
    )
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to update water.');
  return data;
}

export async function getWaterHistory(clientId?: string, limit = 14) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const { data, error } = await supabase
    .from('water_tracker')
    .select('*')
    .eq('client_id', resolvedClientId)
    .order('date', { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error, 'Unable to load water history.');
  return data ?? [];
}

export async function getSupplements(clientId?: string) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const { data, error } = await supabase
    .from('supplements')
    .select('*')
    .eq('client_id', resolvedClientId)
    .eq('is_active', true)
    .order('supplement_name', { ascending: true });

  throwIfSupabaseError(error, 'Unable to load supplements.');
  return (data ?? []).map((item) => ({
    ...item,
    time_of_day: asStringArray(item.time_of_day),
  }));
}

export async function saveSupplement(input: {
  id?: string;
  clientId: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  notes?: string | null;
}) {
  const coachId = await getCurrentUserId();
  const payload = {
    client_id: input.clientId,
    coach_id: coachId,
    supplement_name: input.name.trim(),
    dosage: input.dosage.trim(),
    frequency: input.frequency.trim(),
    time_of_day: input.timeOfDay as unknown as Json,
    notes: input.notes?.trim() || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = input.id
    ? await supabase
        .from('supplements')
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single()
    : await supabase.from('supplements').insert(payload).select('*').single();

  throwIfSupabaseError(error, 'Unable to save supplement.');
  return data ? { ...data, time_of_day: asStringArray(data.time_of_day) } : null;
}

export async function deactivateSupplement(supplementId: string) {
  const { data, error } = await supabase
    .from('supplements')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', supplementId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to remove supplement.');
  return data;
}
