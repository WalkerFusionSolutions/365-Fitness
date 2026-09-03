import React, { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, FilterChip, ProgressBar, SectionHeader, StatCard } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import {
  useActiveMealPlan,
  useGenerateGroceryList,
  useGroceryList,
  useSaveGroceryList,
  useSupplements,
  useTodaysWater,
  useUpdateWater,
} from '@/hooks/useMealPlan';
import { useAppTheme } from '@/hooks/useTheme';
import { GroceryItem, MealPlanMeal, MealType } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'custom'];

export default function NutritionScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const clientId = profile?.id;
  const [view, setView] = useState<'today' | 'grocery' | 'supplements'>('today');
  const plan = useActiveMealPlan(clientId);
  const grocery = useGroceryList(clientId, plan.data?.id);
  const supplements = useSupplements(clientId);
  const water = useTodaysWater(clientId);
  const updateWater = useUpdateWater();
  const generateGrocery = useGenerateGroceryList();
  const saveGrocery = useSaveGroceryList();
  const cups = water.data?.cups_consumed ?? 0;
  const goal = water.data?.daily_goal_cups ?? 8;
  const waterProgress = goal > 0 ? Math.round((cups / goal) * 100) : 0;
  const isLoading = plan.isLoading || water.isLoading;
  const firstName = profile?.full_name?.split(' ')[0] || 'Athlete';
  const todaysMeals = useMemo(() => getTodaysMeals(plan.data?.meals ?? []), [plan.data?.meals]);
  const totals = useMemo(() => getMealTotals(todaysMeals), [todaysMeals]);

  const refresh = () => {
    plan.refresh();
    grocery.refresh();
    supplements.refresh();
    water.refresh();
  };

  const changeWater = async (delta: number) => {
    if (!clientId) return;

    try {
      const updated = await updateWater.update({
        clientId,
        cups: Math.max(0, cups + delta),
        dailyGoalCups: goal,
      });
      water.setData(updated);
    } catch {
      Alert.alert('Unable to update water', 'Please try again.');
    }
  };

  const onGenerateGrocery = async () => {
    if (!clientId || !plan.data) return;

    try {
      const list = await generateGrocery.generate({
        clientId,
        mealPlan: plan.data,
        currentList: grocery.data,
      });
      grocery.setData(list);
    } catch {
      Alert.alert('Unable to build grocery list', 'Please try again.');
    }
  };

  const toggleGrocery = async (item: GroceryItem, index: number) => {
    if (!clientId || !grocery.data) return;
    const items = grocery.data.items.map((current, itemIndex) =>
      itemIndex === index ? { ...item, checked: !item.checked } : current
    );

    grocery.setData({ ...grocery.data, items });

    try {
      const updated = await saveGrocery.save({
        id: grocery.data.id,
        clientId,
        mealPlanId: plan.data?.id,
        title: grocery.data.title,
        items,
      });
      grocery.setData(updated);
    } catch {
      Alert.alert('Unable to update grocery list', 'Please try again.');
      grocery.refresh();
    }
  };

  if (isLoading) {
    return <LoadingView label="Loading nutrition..." />;
  }

  if (plan.error && !plan.data) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load nutrition"
          subtitle={plan.error}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={plan.isRefreshing} onRefresh={refresh} />}
    >
      <AppHeader
        title="Nutrition"
        subtitle={`Fuel plan for ${firstName}`}
      />

      <View style={styles.segmentRow}>
        <FilterChip label="Today" active={view === 'today'} onPress={() => setView('today')} />
        <FilterChip label="Grocery" active={view === 'grocery'} onPress={() => setView('grocery')} />
        <FilterChip label="Supplements" active={view === 'supplements'} onPress={() => setView('supplements')} />
      </View>

      <Card style={styles.waterCard}>
        <View style={styles.waterHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Water Today</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {cups} of {goal} cups
            </Text>
          </View>
          <Text style={[styles.percent, { color: colors.primary }]}>{Math.min(100, waterProgress)}%</Text>
        </View>
        <ProgressBar value={waterProgress} />
        <View style={styles.waterActions}>
          <Button label="- Cup" variant="outline" onPress={() => changeWater(-1)} disabled={updateWater.isPending || cups <= 0} style={styles.waterButton} />
          <Button label="+ Cup" onPress={() => changeWater(1)} loading={updateWater.isPending} style={styles.waterButton} />
        </View>
      </Card>

      {view === 'today' ? (
        <View>
          <SectionHeader
            title="Current Meal Plan"
            actionLabel={plan.data ? 'View Plan' : undefined}
            onAction={plan.data ? () => navigation.navigate('MealPlanDetail', { mealPlanId: plan.data!.id }) : undefined}
          />
          {!plan.data ? (
            <EmptyState
              icon="restaurant-outline"
              title="No meal plan assigned yet."
              subtitle="Your nutrition plan will appear here when your coach assigns one."
            />
          ) : (
            <>
              <Card style={styles.planCard}>
                <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.data.name}</Text>
                {plan.data.description ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{plan.data.description}</Text>
                ) : null}
                <View style={styles.statsRow}>
                  <StatCard icon="flame-outline" label="Calories" value={formatNumber(totals.calories)} />
                  <StatCard icon="fitness-outline" label="Protein" value={`${formatNumber(totals.protein)}g`} tone="success" />
                </View>
              </Card>

              <SectionHeader title="Today's Meals" />
              {todaysMeals.length === 0 ? (
                <EmptyState
                  icon="fast-food-outline"
                  title="No meals scheduled today."
                  subtitle="Open the full plan to view other days."
                />
              ) : (
                todaysMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
              )}
            </>
          )}
        </View>
      ) : null}

      {view === 'grocery' ? (
        <View>
          <SectionHeader title="Grocery List" />
          {grocery.error ? (
            <ErrorState title="Unable to load grocery list" subtitle={grocery.error} onRetry={grocery.refresh} />
          ) : !grocery.data || grocery.data.items.length === 0 ? (
            <View>
              <EmptyState
                icon="cart-outline"
                title="No grocery items yet."
                subtitle={plan.data ? 'Generate a practical list from your assigned meal plan.' : 'A grocery list can be generated after a meal plan is assigned.'}
              />
              {plan.data ? (
                <Button
                  label="Generate From Meal Plan"
                  onPress={onGenerateGrocery}
                  loading={generateGrocery.isPending}
                />
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.groceryHeader}>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {grocery.data.items.filter((item) => item.checked).length} of {grocery.data.items.length} checked
                </Text>
                {plan.data ? (
                  <Pressable onPress={onGenerateGrocery} disabled={generateGrocery.isPending}>
                    <Text style={[styles.link, { color: colors.primary }]}>Regenerate</Text>
                  </Pressable>
                ) : null}
              </View>
              {grocery.data.items.map((item, index) => (
                <Pressable key={`${item.name}-${index}`} onPress={() => toggleGrocery(item, index)}>
                  <Card style={styles.groceryRow}>
                    <Ionicons
                      name={item.checked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={item.checked ? colors.primary : colors.textMuted}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.foodName, { color: item.checked ? colors.textMuted : colors.textPrimary }, item.checked && styles.checked]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {[item.quantity, item.category].filter(Boolean).join(' • ') || 'Grocery item'}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </>
          )}
        </View>
      ) : null}

      {view === 'supplements' ? (
        <View>
          <SectionHeader title="Supplement Guidance" />
          {supplements.error ? (
            <ErrorState title="Unable to load supplements" subtitle={supplements.error} onRetry={supplements.refresh} />
          ) : supplements.data.length === 0 ? (
            <EmptyState
              icon="medkit-outline"
              title="No supplement recommendations."
              subtitle="Coach recommendations will appear here when available."
            />
          ) : (
            supplements.data.map((supplement) => (
              <Card key={supplement.id} style={styles.supplementCard}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{supplement.supplement_name}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {[supplement.dosage, supplement.frequency].filter(Boolean).join(' • ')}
                </Text>
                {supplement.time_of_day.length ? (
                  <Text style={[styles.link, { color: colors.primary }]}>{supplement.time_of_day.join(', ')}</Text>
                ) : null}
                {supplement.notes ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{supplement.notes}</Text>
                ) : null}
              </Card>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function MealCard({ meal }: { meal: MealPlanMeal }) {
  const { colors } = useAppTheme();
  const label = meal.meal_label || capitalize(meal.meal_type);

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.pill, { color: colors.primary, backgroundColor: colors.surfaceSecondary }]}>
          {formatNumber(meal.total_calories)} kcal
        </Text>
      </View>
      {meal.food_items.length === 0 ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>No foods listed.</Text>
      ) : (
        meal.food_items.map((food, index) => (
          <View key={`${food.name}-${index}`} style={styles.foodRow}>
            <Text style={[styles.foodName, { color: colors.textPrimary }]}>{food.name}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{food.portion || ''}</Text>
          </View>
        ))
      )}
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        P {formatNumber(meal.total_protein_g)}g • C {formatNumber(meal.total_carbs_g)}g • F {formatNumber(meal.total_fat_g)}g
      </Text>
    </Card>
  );
}

function getTodaysMeals(meals: MealPlanMeal[]) {
  const day = ((new Date().getDay() + 6) % 7) + 1;
  const todays = meals.filter((meal) => meal.day === day);
  return todays.sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type));
}

function getMealTotals(meals: MealPlanMeal[]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.total_calories,
      protein: totals.protein + meal.total_protein_g,
      carbs: totals.carbs + meal.total_carbs_g,
      fat: totals.fat + meal.total_fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatNumber(value?: number | null) {
  return Math.round(Number(value ?? 0));
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  waterCard: {
    gap: spacing.md,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterButton: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  percent: {
    ...typography.h2,
  },
  planCard: {
    gap: spacing.md,
  },
  planName: {
    ...typography.h2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pill: {
    ...typography.caption,
    fontWeight: '800',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  foodName: {
    ...typography.body,
    flex: 1,
  },
  groceryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groceryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  checked: {
    textDecorationLine: 'line-through',
  },
  link: {
    ...typography.caption,
    fontWeight: '800',
  },
  supplementCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
