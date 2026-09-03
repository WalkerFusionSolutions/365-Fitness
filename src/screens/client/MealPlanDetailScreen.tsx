import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, FilterChip, ProgressBar, SectionHeader, StatCard } from '@/components/AppUI';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useMealPlanDetail } from '@/hooks/useMealPlan';
import { useAppTheme } from '@/hooks/useTheme';
import { MealPlanMeal } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export default function MealPlanDetailScreen({ route }: any) {
  const { colors } = useAppTheme();
  const mealPlanId = route.params?.mealPlanId;
  const { data, isLoading, error, refresh } = useMealPlanDetail(mealPlanId);
  const [day, setDay] = useState(((new Date().getDay() + 6) % 7) + 1);
  const dayMeals = useMemo(
    () => (data?.meals ?? []).filter((meal) => meal.day === day),
    [data?.meals, day]
  );
  const totals = useMemo(() => getTotals(dayMeals), [dayMeals]);

  if (isLoading) {
    return <LoadingView label="Loading meal plan..." />;
  }

  if (error || !data) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load meal plan"
          subtitle={error || 'This meal plan is unavailable.'}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  const calorieTarget = data.target_calories ?? null;
  const caloriePercent = calorieTarget ? Math.round((totals.calories / calorieTarget) * 100) : 0;

  return (
    <Screen>
      <AppHeader
        title={data.name}
        subtitle={data.description || 'Coach-built nutrition plan'}
      />

      {data.instructions ? (
        <Card style={styles.instructions}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Coach Guidance</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{data.instructions}</Text>
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard icon="flame-outline" label="Day Calories" value={Math.round(totals.calories)} />
        <StatCard icon="fitness-outline" label="Protein" value={`${Math.round(totals.protein)}g`} tone="success" />
      </View>

      {calorieTarget ? (
        <Card style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Calories vs target</Text>
            <Text style={[styles.targetValue, { color: colors.textPrimary }]}>
              {Math.round(totals.calories)} / {Math.round(calorieTarget)}
            </Text>
          </View>
          <ProgressBar value={caloriePercent} />
        </Card>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayPicker}
      >
        {DAYS.map((item) => (
          <FilterChip
            key={item.value}
            label={item.label}
            active={day === item.value}
            onPress={() => setDay(item.value)}
          />
        ))}
      </ScrollView>

      <SectionHeader title={`${DAYS.find((item) => item.value === day)?.label} Meals`} />
      {dayMeals.length === 0 ? (
        <EmptyState
          icon="fast-food-outline"
          title="No meals for this day."
          subtitle="Check another day in the plan."
        />
      ) : (
        dayMeals.map((meal) => <MealSection key={meal.id} meal={meal} />)
      )}
    </Screen>
  );
}

function MealSection({ meal }: { meal: MealPlanMeal }) {
  const { colors } = useAppTheme();
  const title = meal.meal_label || meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.badge, { color: colors.primary, backgroundColor: colors.surfaceSecondary }]}>
          {Math.round(meal.total_calories)} kcal
        </Text>
      </View>

      {meal.food_items.map((food, index) => (
        <View key={`${food.name}-${index}`} style={styles.foodRow}>
          <View style={styles.flex}>
            <Text style={[styles.foodName, { color: colors.textPrimary }]}>{food.name}</Text>
            {food.portion ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{food.portion}</Text>
            ) : null}
          </View>
          {food.calories ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{Math.round(food.calories)} kcal</Text>
          ) : null}
        </View>
      ))}

      {meal.notes ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{meal.notes}</Text> : null}
      <Text style={[styles.macroText, { color: colors.textMuted }]}>
        Protein {Math.round(meal.total_protein_g)}g • Carbs {Math.round(meal.total_carbs_g)}g • Fat {Math.round(meal.total_fat_g)}g
      </Text>
    </Card>
  );
}

function getTotals(meals: MealPlanMeal[]) {
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

const styles = StyleSheet.create({
  instructions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  targetCard: {
    gap: spacing.md,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetValue: {
    ...typography.caption,
    fontWeight: '800',
  },
  dayPicker: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  mealCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  mealTitle: {
    ...typography.h3,
    flex: 1,
  },
  badge: {
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
    paddingVertical: spacing.xs,
  },
  foodName: {
    ...typography.body,
  },
  macroText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
