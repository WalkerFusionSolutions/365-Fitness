import { useState, useEffect } from 'react';
import { MealPlan, MealPlanMeal, GroceryList, WaterTracker, Supplement } from '@/types';

export function useActiveMealPlan(clientId?: string) {
  const [data, setData] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setData({
      id: 'mp1',
      coach_id: 'coach1',
      client_id: clientId,
      name: 'Cut Phase 1',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    });
  }, [clientId]);

  return { data, isLoading };
}

export function useMealPlanMeals(mealPlanId?: string) {
  const [data, setData] = useState<MealPlanMeal[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mealPlanId) return;
    setData([
      {
        id: 'm1',
        meal_plan_id: mealPlanId,
        day: 1,
        meal_type: 'breakfast',
        food_items: [
          { name: 'Oats', portion: '1/2 cup', calories: 150, protein: 5, carbs: 27, fat: 3 },
        ],
        total_calories: 150,
        total_protein_g: 5,
        total_carbs_g: 27,
        total_fat_g: 3,
      }
    ]);
  }, [mealPlanId]);

  return { data, isLoading };
}

export function useGroceryList(clientId?: string) {
  const [data, setData] = useState<GroceryList | null>(null);
  useEffect(() => {
    if (!clientId) return;
    setData({
      id: 'gl1',
      client_id: clientId,
      generated_date: new Date().toISOString(),
      items: [{ name: 'Oats', quantity: '1 box', category: 'Pantry', checked: false }],
    });
  }, [clientId]);
  return { data };
}

export function useGenerateGroceryList() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (data: { clientId: string; mealPlanId: string }) => {
    setIsPending(true);
    setTimeout(() => setIsPending(false), 1000);
  };
  return { mutate, isPending };
}

export function useToggleGroceryItem() {
  const mutate = (data: { listId: string; items: any[] }) => {};
  return { mutate };
}

export function useSupplements(clientId?: string) {
  const [data, setData] = useState<Supplement[] | null>(null);
  useEffect(() => {
    if (!clientId) return;
    setData([
      {
        id: 's1',
        client_id: clientId,
        supplement_name: 'Whey Protein',
        dosage: '1 scoop',
        frequency: 'Daily',
        time_of_day: ['Post-workout'],
      }
    ]);
  }, [clientId]);
  return { data };
}

export function useTodaysWater(clientId?: string) {
  const [data, setData] = useState<WaterTracker | null>(null);
  useEffect(() => {
    if (!clientId) return;
    setData({
      id: 'wt1',
      client_id: clientId,
      date: new Date().toISOString(),
      cups_consumed: 3,
      daily_goal_cups: 8,
    });
  }, [clientId]);
  return { data };
}

export function useIncrementWater() {
  const mutate = (data: { trackerId: string; currentCups: number; clientId: string }) => {};
  return { mutate };
}
