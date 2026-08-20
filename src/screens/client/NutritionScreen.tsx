import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/utils/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  useActiveMealPlan,
  useGenerateGroceryList,
  useGroceryList,
  useMealPlanMeals,
  useSupplements,
  useTodaysWater,
  useIncrementWater,
  useToggleGroceryItem,
} from '@/hooks/useMealPlan';
import { GroceryItem, MealType } from '@/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionScreen() {
  const { profile } = useAuth();
  const clientId = profile?.id;
  const [tab, setTab] = useState<'meals' | 'grocery' | 'supplements'>('meals');

  const { data: mealPlan, isLoading: planLoading } = useActiveMealPlan(clientId);
  const { data: meals, isLoading: mealsLoading } = useMealPlanMeals(mealPlan?.id);
  const { data: groceryList } = useGroceryList(clientId);
  const generateGrocery = useGenerateGroceryList();
  const toggleItem = useToggleGroceryItem();
  const { data: supplements } = useSupplements(clientId);
  const { data: water } = useTodaysWater(clientId);
  const incrementWater = useIncrementWater();

  const today = new Date().getDay(); // 0-6; meal plans use day 1-7 relative
  const dayOfPlan = (today % 7) + 1;
  const todaysMeals = (meals ?? []).filter((m) => m.day === dayOfPlan);

  return (
    <Screen>
      <Text style={styles.title}>Nutrition</Text>

      <View style={styles.tabs}>
        {(['meals', 'grocery', 'supplements'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'meals' ? 'Meal Plan' : t === 'grocery' ? 'Grocery List' : 'Supplements'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.waterCard}>
        <View>
          <Text style={styles.waterCount}>
            {water?.cups_consumed ?? 0} / {water?.daily_goal_cups ?? 8} cups
          </Text>
          <Text style={styles.waterLabel}>Water today</Text>
        </View>
        <Button
          label="+ Cup"
          variant="secondary"
          onPress={() =>
            water && clientId && incrementWater.mutate({ trackerId: water.id, currentCups: water.cups_consumed, clientId })
          }
        />
      </Card>

      {tab === 'meals' &&
        (planLoading || mealsLoading ? (
          <LoadingView />
        ) : !mealPlan ? (
          <EmptyState icon="restaurant-outline" title="No active meal plan" subtitle="Your coach hasn't assigned one yet." />
        ) : (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Text style={styles.planName}>{mealPlan.name}</Text>
            {MEAL_ORDER.map((mealType) => {
              const meal = todaysMeals.find((m) => m.meal_type === mealType);
              if (!meal) return null;
              return (
                <Card key={mealType}>
                  <Text style={styles.mealType}>{capitalize(mealType)}</Text>
                  {meal.food_items.map((food, idx) => (
                    <View key={idx} style={styles.foodRow}>
                      <Text style={styles.foodName}>
                        {food.name} <Text style={styles.foodPortion}>({food.portion})</Text>
                      </Text>
                      <Text style={styles.foodMacros}>{food.calories} cal</Text>
                    </View>
                  ))}
                  <Text style={styles.mealTotal}>
                    {meal.total_calories} cal &middot; {meal.total_protein_g}g protein &middot; {meal.total_carbs_g}g carbs &middot;{' '}
                    {meal.total_fat_g}g fat
                  </Text>
                </Card>
              );
            })}
          </View>
        ))}

      {tab === 'grocery' && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {!groceryList ? (
            <>
              <EmptyState icon="cart-outline" title="No grocery list yet" />
              {mealPlan && (
                <Button
                  label="Generate from meal plan"
                  onPress={() => clientId && generateGrocery.mutate({ clientId, mealPlanId: mealPlan.id })}
                  loading={generateGrocery.isPending}
                />
              )}
            </>
          ) : (
            groceryList.items.map((item, idx) => (
              <GroceryRow
                key={idx}
                item={item}
                onToggle={() => {
                  const updated = groceryList.items.map((i, iIdx) => (iIdx === idx ? { ...i, checked: !i.checked } : i));
                  toggleItem.mutate({ listId: groceryList.id, items: updated } as never);
                }}
              />
            ))
          )}
        </View>
      )}

      {tab === 'supplements' && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {(supplements ?? []).length === 0 ? (
            <EmptyState icon="medkit-outline" title="No supplements tracked" />
          ) : (
            supplements!.map((s) => (
              <Card key={s.id} style={styles.supplementRow}>
                <View>
                  <Text style={styles.supplementName}>{s.supplement_name}</Text>
                  <Text style={styles.supplementDosage}>
                    {s.dosage} &middot; {s.frequency}
                  </Text>
                </View>
                <Text style={styles.supplementTime}>{s.time_of_day.join(', ')}</Text>
              </Card>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

function GroceryRow({ item, onToggle }: { item: GroceryItem; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle}>
      <Card style={styles.groceryRow}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.checked ? colors.primary : colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.groceryName, item.checked && styles.groceryChecked]}>{item.name}</Text>
          <Text style={styles.groceryQty}>
            {item.quantity} &middot; {item.category}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  waterCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  waterCount: { ...typography.h3, color: colors.textPrimary },
  waterLabel: { ...typography.caption, color: colors.textSecondary },
  planName: { ...typography.h3, color: colors.textPrimary },
  mealType: { ...typography.h3, color: colors.primary, marginBottom: spacing.xs },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  foodName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  foodPortion: { color: colors.textMuted },
  foodMacros: { ...typography.caption, color: colors.textSecondary },
  mealTotal: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  groceryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groceryName: { ...typography.body, color: colors.textPrimary },
  groceryChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
  groceryQty: { ...typography.caption, color: colors.textSecondary },
  supplementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplementName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  supplementDosage: { ...typography.caption, color: colors.textSecondary },
  supplementTime: { ...typography.caption, color: colors.primary },
});
