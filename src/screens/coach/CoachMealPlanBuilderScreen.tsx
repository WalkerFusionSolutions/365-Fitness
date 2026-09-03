import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppInput, FilterChip, SectionHeader } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { useMealPlanDetail, useSaveMealPlan, useSaveSupplement } from '@/hooks/useMealPlan';
import { useAppTheme } from '@/hooks/useTheme';
import { FoodItem, MealPlanMeal, MealType } from '@/types';
import { spacing, typography } from '@/utils/theme';

type BuilderMeal = {
  key: string;
  day: number;
  mealType: MealType;
  mealLabel: string;
  notes: string;
  sortOrder: number;
  foodItems: FoodItem[];
};

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'custom'];

export default function CoachMealPlanBuilderScreen({ route, navigation }: any) {
  const { colors } = useAppTheme();
  const mealPlanId = route.params?.mealPlanId;
  const preselectedClientId = route.params?.clientId;
  const detail = useMealPlanDetail(mealPlanId);
  const clients = useCoachVisibleClients();
  const savePlan = useSaveMealPlan();
  const saveSupplement = useSaveSupplement();
  const [clientId, setClientId] = useState<string | null>(preselectedClientId ?? null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFat, setTargetFat] = useState('');
  const [meals, setMeals] = useState<BuilderMeal[]>([]);
  const [supplementName, setSupplementName] = useState('');
  const [supplementDosage, setSupplementDosage] = useState('');
  const [supplementFrequency, setSupplementFrequency] = useState('');
  const [supplementNotes, setSupplementNotes] = useState('');
  const isLocked = Boolean(detail.data && detail.data.status !== 'draft');

  useEffect(() => {
    if (!detail.data) return;

    setClientId(detail.data.client_id ?? preselectedClientId ?? null);
    setName(detail.data.name);
    setDescription(detail.data.description ?? '');
    setInstructions(detail.data.instructions ?? '');
    setTargetCalories(stringifyNumber(detail.data.target_calories));
    setTargetProtein(stringifyNumber(detail.data.target_protein_g));
    setTargetCarbs(stringifyNumber(detail.data.target_carbs_g));
    setTargetFat(stringifyNumber(detail.data.target_fat_g));
    setMeals(detail.data.meals.map(fromMeal));
  }, [detail.data, preselectedClientId]);

  if ((mealPlanId && detail.isLoading) || clients.isLoading) {
    return <LoadingView label="Loading meal plan builder..." />;
  }

  if (detail.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load meal plan"
          subtitle={detail.error}
          onRetry={detail.refresh}
        />
      </Screen>
    );
  }

  const addMeal = () => {
    const order = meals.length + 1;
    setMeals((current) => [
      ...current,
      {
        key: `meal-${Date.now()}`,
        day: 1,
        mealType: 'breakfast',
        mealLabel: '',
        notes: '',
        sortOrder: order,
        foodItems: [{ name: '', portion: '', category: '', calories: null, protein: null, carbs: null, fat: null }],
      },
    ]);
  };

  const updateMeal = (key: string, patch: Partial<BuilderMeal>) => {
    setMeals((current) => current.map((meal) => (meal.key === key ? { ...meal, ...patch } : meal)));
  };

  const updateFood = (mealKey: string, index: number, patch: Partial<FoodItem>) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.key === mealKey
          ? {
              ...meal,
              foodItems: meal.foodItems.map((food, foodIndex) =>
                foodIndex === index ? { ...food, ...patch } : food
              ),
            }
          : meal
      )
    );
  };

  const addFood = (mealKey: string) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.key === mealKey
          ? {
              ...meal,
              foodItems: [
                ...meal.foodItems,
                { name: '', portion: '', category: '', calories: null, protein: null, carbs: null, fat: null },
              ],
            }
          : meal
      )
    );
  };

  const removeFood = (mealKey: string, index: number) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.key === mealKey
          ? { ...meal, foodItems: meal.foodItems.filter((_, foodIndex) => foodIndex !== index) }
          : meal
      )
    );
  };

  const onSave = async () => {
    if (isLocked) {
      Alert.alert(
        'Meal plan locked',
        'Assigned and archived meal plans are read-only. Create a new draft for changes.'
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing name', 'Add a meal plan name.');
      return;
    }

    const cleanedMeals = meals
      .map((meal, index) => ({
        ...meal,
        sortOrder: index + 1,
        foodItems: meal.foodItems
          .filter((food) => food.name.trim())
          .map((food) => ({
            ...food,
            name: food.name.trim(),
            calories: numberOrNull(food.calories),
            protein: numberOrNull(food.protein),
            carbs: numberOrNull(food.carbs),
            fat: numberOrNull(food.fat),
          })),
      }))
      .filter((meal) => meal.foodItems.length > 0);

    if (cleanedMeals.length === 0) {
      Alert.alert('No meals', 'Add at least one meal with a food item.');
      return;
    }

    try {
      await savePlan.save({
        id: mealPlanId,
        name,
        description,
        instructions,
        clientId,
        targets: {
          calories: numberOrNull(targetCalories),
          protein: numberOrNull(targetProtein),
          carbs: numberOrNull(targetCarbs),
          fat: numberOrNull(targetFat),
        },
        meals: cleanedMeals.map((meal) => ({
          day: meal.day,
          mealType: meal.mealType,
          mealLabel: meal.mealLabel,
          notes: meal.notes,
          foodItems: meal.foodItems,
          sortOrder: meal.sortOrder,
        })),
      });

      if (clientId && supplementName.trim()) {
        await saveSupplement.save({
          clientId,
          name: supplementName,
          dosage: supplementDosage || 'See coach notes',
          frequency: supplementFrequency || 'As recommended',
          timeOfDay: [],
          notes: supplementNotes,
        });
      }

      navigation.goBack();
    } catch {
      Alert.alert('Unable to save meal plan', savePlan.error || 'Please try again.');
    }
  };

  return (
    <Screen>
      <AppHeader
        title={mealPlanId ? 'Meal Plan' : 'Create Meal Plan'}
        subtitle={
          isLocked
            ? 'This assigned or archived prescription is read-only.'
            : 'Build meals from real coach-entered guidance and assign when ready.'
        }
      />

      {isLocked ? (
        <Card style={styles.lockedCard}>
          <Text style={[styles.safetyNote, { color: colors.textSecondary }]}>
            Assigned nutrition prescriptions are locked to protect client history.
          </Text>
        </Card>
      ) : null}

      <Card style={styles.form}>
        <AppInput label="Plan Name" value={name} onChangeText={setName} editable={!isLocked} />
        <AppInput label="Description" value={description} onChangeText={setDescription} multiline editable={!isLocked} />
        <AppInput label="Instructions" value={instructions} onChangeText={setInstructions} multiline editable={!isLocked} />
      </Card>

      <SectionHeader title="Targets" />
      <Card style={styles.form}>
        <View style={styles.inputRow}>
          <AppInput label="Calories" value={targetCalories} onChangeText={setTargetCalories} keyboardType="number-pad" editable={!isLocked} style={styles.smallInput} />
          <AppInput label="Protein g" value={targetProtein} onChangeText={setTargetProtein} keyboardType="number-pad" editable={!isLocked} style={styles.smallInput} />
        </View>
        <View style={styles.inputRow}>
          <AppInput label="Carbs g" value={targetCarbs} onChangeText={setTargetCarbs} keyboardType="number-pad" editable={!isLocked} style={styles.smallInput} />
          <AppInput label="Fat g" value={targetFat} onChangeText={setTargetFat} keyboardType="number-pad" editable={!isLocked} style={styles.smallInput} />
        </View>
      </Card>

      {!isLocked ? (
        <>
          <SectionHeader title="Assign To" />
          <View style={styles.chips}>
            <FilterChip label="Draft" active={!clientId} onPress={() => setClientId(null)} />
            {clients.data.map((client) => (
              <FilterChip
                key={client.profile.id}
                label={client.profile.full_name || 'Client'}
                active={clientId === client.profile.id}
                onPress={() => setClientId(client.profile.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Meals" actionLabel={isLocked ? undefined : 'Add Meal'} onAction={isLocked ? undefined : addMeal} />
      {meals.map((meal, index) => (
        <MealEditor
          key={meal.key}
          meal={meal}
          index={index}
          onUpdate={(patch) => updateMeal(meal.key, patch)}
          onRemove={() => setMeals((current) => current.filter((item) => item.key !== meal.key))}
          onAddFood={() => addFood(meal.key)}
          onUpdateFood={(foodIndex, patch) => updateFood(meal.key, foodIndex, patch)}
          onRemoveFood={(foodIndex) => removeFood(meal.key, foodIndex)}
          readOnly={isLocked}
        />
      ))}

      {!isLocked && clientId ? (
        <>
          <SectionHeader title="Optional Supplement Recommendation" />
          <Card style={styles.form}>
            <AppInput label="Supplement Name" value={supplementName} onChangeText={setSupplementName} />
            <AppInput label="Dosage" value={supplementDosage} onChangeText={setSupplementDosage} />
            <AppInput label="Frequency" value={supplementFrequency} onChangeText={setSupplementFrequency} />
            <AppInput label="Coach Notes" value={supplementNotes} onChangeText={setSupplementNotes} multiline />
            <Text style={[styles.safetyNote, { color: colors.textSecondary }]}>
              Recommendations are saved as coaching notes, not medical claims.
            </Text>
          </Card>
        </>
      ) : null}

      {!isLocked ? (
        <Button
          label={clientId ? 'Save & Assign Meal Plan' : 'Save Draft Meal Plan'}
          onPress={onSave}
          loading={savePlan.isSaving || saveSupplement.isSaving}
          style={styles.saveButton}
        />
      ) : null}
    </Screen>
  );
}

function MealEditor({
  meal,
  index,
  onUpdate,
  onRemove,
  onAddFood,
  onUpdateFood,
  onRemoveFood,
  readOnly,
}: {
  meal: BuilderMeal;
  index: number;
  onUpdate: (patch: Partial<BuilderMeal>) => void;
  onRemove: () => void;
  onAddFood: () => void;
  onUpdateFood: (index: number, patch: Partial<FoodItem>) => void;
  onRemoveFood: (index: number) => void;
  readOnly: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>Meal {index + 1}</Text>
        {!readOnly ? (
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        ) : null}
      </View>

      {readOnly ? (
        <Text style={[styles.safetyNote, { color: colors.textSecondary }]}>
          {DAYS.find((day) => day.value === meal.day)?.label} • {meal.mealType}
        </Text>
      ) : (
        <>
          <View style={styles.chips}>
            {DAYS.map((day) => (
              <FilterChip
                key={day.value}
                label={day.label}
                active={meal.day === day.value}
                onPress={() => onUpdate({ day: day.value })}
              />
            ))}
          </View>
          <View style={styles.chips}>
            {MEAL_TYPES.map((type) => (
              <FilterChip
                key={type}
                label={type === 'custom' ? 'Custom' : type.charAt(0).toUpperCase() + type.slice(1)}
                active={meal.mealType === type}
                onPress={() => onUpdate({ mealType: type })}
              />
            ))}
          </View>
        </>
      )}

      <AppInput label="Meal Label" value={meal.mealLabel} onChangeText={(value) => onUpdate({ mealLabel: value })} editable={!readOnly} />
      <AppInput label="Notes" value={meal.notes} onChangeText={(value) => onUpdate({ notes: value })} multiline editable={!readOnly} />

      {meal.foodItems.map((food, foodIndex) => (
        <Card key={foodIndex} style={styles.foodCard}>
          <View style={styles.mealHeader}>
            <Text style={[styles.foodTitle, { color: colors.textPrimary }]}>Food {foodIndex + 1}</Text>
            {!readOnly ? (
              <Pressable onPress={() => onRemoveFood(foodIndex)} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <AppInput label="Food Name" value={food.name} onChangeText={(value) => onUpdateFood(foodIndex, { name: value })} editable={!readOnly} />
          <View style={styles.inputRow}>
            <AppInput label="Portion" value={food.portion ?? ''} onChangeText={(value) => onUpdateFood(foodIndex, { portion: value })} editable={!readOnly} style={styles.smallInput} />
            <AppInput label="Category" value={food.category ?? ''} onChangeText={(value) => onUpdateFood(foodIndex, { category: value })} editable={!readOnly} style={styles.smallInput} />
          </View>
          <View style={styles.inputRow}>
            <AppInput label="Kcal" value={stringifyNumber(food.calories)} onChangeText={(value) => onUpdateFood(foodIndex, { calories: value as never })} keyboardType="number-pad" editable={!readOnly} style={styles.smallInput} />
            <AppInput label="Protein" value={stringifyNumber(food.protein)} onChangeText={(value) => onUpdateFood(foodIndex, { protein: value as never })} keyboardType="number-pad" editable={!readOnly} style={styles.smallInput} />
          </View>
          <View style={styles.inputRow}>
            <AppInput label="Carbs" value={stringifyNumber(food.carbs)} onChangeText={(value) => onUpdateFood(foodIndex, { carbs: value as never })} keyboardType="number-pad" editable={!readOnly} style={styles.smallInput} />
            <AppInput label="Fat" value={stringifyNumber(food.fat)} onChangeText={(value) => onUpdateFood(foodIndex, { fat: value as never })} keyboardType="number-pad" editable={!readOnly} style={styles.smallInput} />
          </View>
        </Card>
      ))}
      {!readOnly ? <Button label="Add Food" variant="outline" onPress={onAddFood} /> : null}
    </Card>
  );
}

function fromMeal(meal: MealPlanMeal): BuilderMeal {
  return {
    key: meal.id,
    day: meal.day,
    mealType: meal.meal_type,
    mealLabel: meal.meal_label ?? '',
    notes: meal.notes ?? '',
    sortOrder: meal.sort_order ?? 1,
    foodItems: meal.food_items.length
      ? meal.food_items
      : [{ name: '', portion: '', category: '', calories: null, protein: null, carbs: null, fat: null }],
  };
}

function stringifyNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

function numberOrNull(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallInput: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mealCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mealTitle: {
    ...typography.h3,
  },
  foodCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  foodTitle: {
    ...typography.caption,
    fontWeight: '800',
  },
  safetyNote: {
    ...typography.caption,
  },
  lockedCard: {
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
