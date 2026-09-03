import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { AppHeader, Badge, StatCard } from '@/components/AppUI';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useWorkoutDetail } from '@/hooks/useWorkout';
import { useAppTheme } from '@/hooks/useTheme';
import { WorkoutExercise } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

export default function WorkoutDetailScreen({ route, navigation }: any) {
  const { colors } = useAppTheme();
  const { workoutId } = route.params;
  const { data, isLoading, error, refresh } = useWorkoutDetail(workoutId);

  if (isLoading) return <LoadingView label="Loading workout..." />;

  if (error || !data) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load workout"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title={data.name}
        subtitle={data.description || 'Training prescription'}
        action={<Badge label={data.status || 'assigned'} />}
      />
      <View style={styles.statsRow}>
        <StatCard icon="barbell-outline" label="Exercises" value={data.exercises.length} />
        <StatCard icon="time-outline" label="Duration" value={data.estimated_minutes ? `${data.estimated_minutes} min` : 'Open'} tone="success" />
      </View>

      <Button
        label="Start Workout"
        onPress={() => navigation.navigate('ActiveWorkout', { workoutId })}
        style={styles.startButton}
      />

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Exercises</Text>
      <FlatList
        data={data.exercises}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="No exercises yet"
            subtitle="Ask your coach to add exercises to this workout."
          />
        }
        renderItem={({ item, index }) => (
          <ExerciseRow
            exercise={item}
            index={index}
            onPress={() =>
              navigation.navigate('ExerciseDetail', {
                workoutId,
                workoutExerciseId: item.id,
                exerciseId: item.library_exercise_id,
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function ExerciseRow({
  exercise,
  index,
  onPress,
}: {
  exercise: WorkoutExercise;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.exerciseRow}>
        <View style={[styles.indexBadge, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.index, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
            {exercise.exercise_name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {exercise.sets} x {exercise.reps} • {exercise.rest_seconds}s rest
          </Text>
        </View>
        {exercise.video_url || exercise.library_exercise_id ? (
          <Ionicons name="videocam-outline" size={18} color={colors.primary} />
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  startButton: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    ...typography.caption,
    fontWeight: '800',
  },
  exerciseName: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  flex: {
    flex: 1,
  },
});
