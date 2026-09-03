import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useExercise, useWorkoutDetail } from '@/hooks/useWorkout';
import { useAppTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/utils/theme';

export default function ExerciseDetailScreen({ route }: any) {
  const { colors } = useAppTheme();
  const { workoutId, exerciseId, workoutExerciseId } = route.params ?? {};
  const workout = useWorkoutDetail(workoutId);
  const prescribedExercise = workout.data?.exercises.find(
    (item) => item.id === workoutExerciseId
  );
  const libraryExerciseId = exerciseId ?? prescribedExercise?.library_exercise_id;
  const exercise = useExercise(libraryExerciseId);

  if (workout.isLoading || exercise.isLoading) {
    return <LoadingView label="Loading exercise..." />;
  }

  if (exercise.error || workout.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load exercise"
          subtitle="Please try again."
          onRetry={() => {
            workout.refresh();
            exercise.refresh();
          }}
        />
      </Screen>
    );
  }

  const name = exercise.data?.name ?? prescribedExercise?.exercise_name;

  if (!name) {
    return (
      <Screen>
        <EmptyState
          icon="barbell-outline"
          title="Exercise details unavailable"
          subtitle="This workout exercise does not have a linked library item yet."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {exercise.data?.muscle_group ?? 'Exercise'} • {exercise.data?.equipment ?? 'Equipment varies'}
      </Text>

      {exercise.videoUrl ? <ExerciseVideo uri={exercise.videoUrl} /> : null}

      {prescribedExercise ? (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Prescription</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {prescribedExercise.sets} x {prescribedExercise.reps} • {prescribedExercise.rest_seconds}s rest
          </Text>
          {prescribedExercise.notes ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {prescribedExercise.notes}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>How To Perform</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {exercise.data?.instructions || exercise.data?.description || 'No instructions have been added yet.'}
        </Text>
      </Card>
    </Screen>
  );
}

function ExerciseVideo({ uri }: { uri: string }) {
  const { colors } = useAppTheme();
  const player = useVideoPlayer(uri);

  return (
    <View style={[styles.videoFrame, { backgroundColor: colors.surfaceSecondary }]}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  videoFrame: {
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
  },
  body: {
    ...typography.body,
  },
});
