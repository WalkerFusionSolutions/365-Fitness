import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { AppHeader, Badge } from '@/components/AppUI';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { useAppTheme } from '@/hooks/useTheme';
import {
  useExerciseLibrary,
  useSaveWorkout,
  useWorkoutDetail,
} from '@/hooks/useWorkout';
import { ExerciseLibraryItem } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

type BuilderExercise = {
  key: string;
  libraryExerciseId?: string | null;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  videoUrl?: string | null;
  notes?: string | null;
};

export default function CoachWorkoutBuilderScreen({ route, navigation }: any) {
  const { colors } = useAppTheme();
  const workoutId = route.params?.workoutId;
  const preselectedClientId = route.params?.clientId;
  const workout = useWorkoutDetail(workoutId);
  const library = useExerciseLibrary();
  const clients = useCoachVisibleClients();
  const saveWorkout = useSaveWorkout();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');
  const [clientId, setClientId] = useState<string | null>(preselectedClientId ?? null);
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);

  useEffect(() => {
    if (!workout.data) return;

    setName(workout.data.name);
    setDescription(workout.data.description ?? '');
    setEstimatedMinutes(String(workout.data.estimated_minutes ?? 45));
    setClientId(workout.data.client_id ?? preselectedClientId ?? null);
    setExercises(
      workout.data.exercises.map((exercise) => ({
        key: exercise.id,
        libraryExerciseId: exercise.library_exercise_id,
        exerciseName: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.rest_seconds,
        videoUrl: exercise.video_url,
        notes: exercise.notes,
      }))
    );
  }, [preselectedClientId, workout.data]);

  if ((workoutId && workout.isLoading) || library.isLoading || clients.isLoading) {
    return <LoadingView label="Loading builder..." />;
  }

  if (workout.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load workout"
          subtitle="Please try again."
          onRetry={workout.refresh}
        />
      </Screen>
    );
  }

  const addExercise = (exercise: ExerciseLibraryItem) => {
    setExercises((current) => [
      ...current,
      {
        key: `${exercise.id}-${Date.now()}`,
        libraryExerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: '8',
        restSeconds: 60,
        notes: exercise.description,
      },
    ]);
  };

  const updateExercise = (key: string, patch: Partial<BuilderExercise>) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key === key ? { ...exercise, ...patch } : exercise
      )
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setExercises((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Add a workout name.');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise.');
      return;
    }

    try {
      await saveWorkout.save({
        id: workoutId,
        name,
        description,
        clientId,
        estimatedMinutes: Number(estimatedMinutes) || null,
        exercises,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save workout', saveWorkout.error || 'Please try again.');
    }
  };

  return (
    <Screen>
      <AppHeader
        title={workoutId ? 'Workout Builder' : 'Create Workout'}
        subtitle="Build a training prescription and assign it when ready."
        action={<Badge label={clientId ? 'Assigned' : 'Draft'} tone={clientId ? 'success' : 'warning'} />}
      />
      <Card style={styles.form}>
        <Field label="Workout Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Field
          label="Estimated Minutes"
          value={estimatedMinutes}
          onChangeText={setEstimatedMinutes}
          keyboardType="number-pad"
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Assign To</Text>
      <View style={styles.chips}>
        <ChoiceChip label="Draft" active={!clientId} onPress={() => setClientId(null)} />
        {clients.data.map((client) => (
          <ChoiceChip
            key={client.profile.id}
            label={client.profile.full_name || 'Client'}
            active={clientId === client.profile.id}
            onPress={() => setClientId(client.profile.id)}
          />
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Exercises</Text>
      {exercises.map((exercise, index) => (
        <Card key={exercise.key} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseTitle, { color: colors.textPrimary }]}>
              {index + 1}. {exercise.exerciseName}
            </Text>
            <Pressable onPress={() => setExercises((current) => current.filter((item) => item.key !== exercise.key))}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <MiniField
              label="Sets"
              value={String(exercise.sets)}
              onChangeText={(value) => updateExercise(exercise.key, { sets: Number(value) || 1 })}
            />
            <MiniField
              label="Reps"
              value={exercise.reps}
              onChangeText={(value) => updateExercise(exercise.key, { reps: value })}
            />
            <MiniField
              label="Rest"
              value={String(exercise.restSeconds)}
              onChangeText={(value) =>
                updateExercise(exercise.key, { restSeconds: Number(value) || 0 })
              }
            />
          </View>
          <Field
            label="Coach Notes"
            value={exercise.notes ?? ''}
            onChangeText={(value) => updateExercise(exercise.key, { notes: value })}
          />
          <View style={styles.reorderRow}>
            <Button
              label="Up"
              variant="outline"
              onPress={() => moveExercise(index, -1)}
              disabled={index === 0}
              style={styles.reorderButton}
            />
            <Button
              label="Down"
              variant="outline"
              onPress={() => moveExercise(index, 1)}
              disabled={index === exercises.length - 1}
              style={styles.reorderButton}
            />
          </View>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add Exercise</Text>
      {library.data.slice(0, 8).map((exercise) => (
        <Pressable key={exercise.id} onPress={() => addExercise(exercise)}>
          <Card style={styles.libraryRow}>
            <View style={styles.flex}>
              <Text style={[styles.libraryName, { color: colors.textPrimary }]}>
                {exercise.name}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {exercise.muscle_group} • {exercise.equipment}
              </Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Card>
        </Pressable>
      ))}

      <Button
        label={clientId ? 'Save & Assign Workout' : 'Save Draft Workout'}
        onPress={onSave}
        loading={saveWorkout.isSaving}
        style={styles.saveButton}
      />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.textPrimary,
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
      />
    </View>
  );
}

function MiniField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.miniField}>
      <Field label={label} value={value} onChangeText={onChangeText} keyboardType="number-pad" />
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.primary : colors.surfaceSecondary },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryText : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
  },
  form: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  exerciseCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseTitle: {
    ...typography.h3,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniField: {
    flex: 1,
  },
  reorderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reorderButton: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  libraryName: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  flex: {
    flex: 1,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
