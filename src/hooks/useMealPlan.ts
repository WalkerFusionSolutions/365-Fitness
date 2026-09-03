import { useCallback, useEffect, useState } from 'react';
import {
  archiveMealPlan,
  buildGroceryItemsFromMeals,
  deactivateSupplement,
  getClientActiveMealPlan,
  getClientGroceryList,
  getCoachMealPlans,
  getMealPlanWithMeals,
  getSupplements,
  getTodaysWater,
  getWaterHistory,
  saveGroceryList,
  saveMealPlan,
  saveSupplement,
  upsertWater,
} from '@/services/nutrition.service';
import {
  GroceryList,
  MealPlan,
  MealPlanWithMeals,
  Supplement,
  WaterTracker,
} from '@/types';
import { AppServiceError } from '@/services/errors';

function getUserMessage(error: unknown, fallback: string) {
  if (error instanceof AppServiceError) {
    return error.userMessage;
  }

  return fallback;
}

export function useActiveMealPlan(clientId?: string) {
  const [data, setData] = useState<MealPlanWithMeals | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (!clientId) return;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setData(await getClientActiveMealPlan(clientId));
    } catch (loadError) {
      console.error('Unable to load meal plan:', loadError);
      setError(getUserMessage(loadError, 'Unable to load meal plan.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: () => load(true) };
}

export function useMealPlanDetail(mealPlanId?: string) {
  const [data, setData] = useState<MealPlanWithMeals | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(mealPlanId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mealPlanId) return;
    setIsLoading(true);
    setError(null);

    try {
      setData(await getMealPlanWithMeals(mealPlanId));
    } catch (loadError) {
      console.error('Unable to load meal plan:', loadError);
      setError(getUserMessage(loadError, 'Unable to load meal plan.'));
    } finally {
      setIsLoading(false);
    }
  }, [mealPlanId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}

export function useCoachMealPlans() {
  const [data, setData] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setData(await getCoachMealPlans());
    } catch (loadError) {
      console.error('Unable to load coach meal plans:', loadError);
      setError(getUserMessage(loadError, 'Unable to load meal plans.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: () => load(true) };
}

export function useSaveMealPlan() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (input: Parameters<typeof saveMealPlan>[0]) => {
    setIsSaving(true);
    setError(null);

    try {
      return await saveMealPlan(input);
    } catch (saveError) {
      console.error('Unable to save meal plan:', saveError);
      const message = getUserMessage(saveError, 'Unable to save meal plan.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { save, isSaving, error };
}

export function useArchiveMealPlan() {
  const [isPending, setIsPending] = useState(false);

  const archive = useCallback(async (mealPlanId: string) => {
    setIsPending(true);
    try {
      return await archiveMealPlan(mealPlanId);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { archive, isPending };
}

export function useGroceryList(clientId?: string, mealPlanId?: string | null) {
  const [data, setData] = useState<GroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setError(null);

    try {
      setData(await getClientGroceryList(clientId, mealPlanId));
    } catch (loadError) {
      console.error('Unable to load grocery list:', loadError);
      setError(getUserMessage(loadError, 'Unable to load grocery list.'));
    } finally {
      setIsLoading(false);
    }
  }, [clientId, mealPlanId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load, setData };
}

export function useGenerateGroceryList() {
  const [isPending, setIsPending] = useState(false);

  const generate = useCallback(
    async (input: { clientId: string; mealPlan: MealPlanWithMeals; currentList?: GroceryList | null }) => {
      setIsPending(true);

      try {
        return await saveGroceryList({
          id: input.currentList?.id,
          clientId: input.clientId,
          mealPlanId: input.mealPlan.id,
          title: `${input.mealPlan.name} groceries`,
          items: buildGroceryItemsFromMeals(input.mealPlan.meals),
        });
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { generate, isPending };
}

export function useSaveGroceryList() {
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async (input: Parameters<typeof saveGroceryList>[0]) => {
    setIsSaving(true);
    try {
      return await saveGroceryList(input);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { save, isSaving };
}

export function useTodaysWater(clientId?: string) {
  const [data, setData] = useState<WaterTracker | null>(null);
  const [history, setHistory] = useState<WaterTracker[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [today, recent] = await Promise.all([
        getTodaysWater(clientId),
        getWaterHistory(clientId),
      ]);
      setData(today);
      setHistory(recent);
    } catch (loadError) {
      console.error('Unable to load water:', loadError);
      setError(getUserMessage(loadError, 'Unable to load water tracker.'));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, history, isLoading, error, refresh: load, setData };
}

export function useUpdateWater() {
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(async (input: Parameters<typeof upsertWater>[0]) => {
    setIsPending(true);

    try {
      return await upsertWater(input);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { update, isPending };
}

export function useSupplements(clientId?: string) {
  const [data, setData] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setError(null);

    try {
      setData(await getSupplements(clientId));
    } catch (loadError) {
      console.error('Unable to load supplements:', loadError);
      setError(getUserMessage(loadError, 'Unable to load supplements.'));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}

export function useSaveSupplement() {
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async (input: Parameters<typeof saveSupplement>[0]) => {
    setIsSaving(true);

    try {
      return await saveSupplement(input);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { save, isSaving };
}

export function useDeactivateSupplement() {
  const [isPending, setIsPending] = useState(false);

  const deactivate = useCallback(async (supplementId: string) => {
    setIsPending(true);

    try {
      return await deactivateSupplement(supplementId);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { deactivate, isPending };
}
