import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppHeader } from '@/components/AppUI';
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
      <AppHeader
        title={name}
        subtitle={`${exercise.data?.muscle_group ?? 'Exercise'} • ${exercise.data?.equipment ?? 'Equipment varies'}`}
      />

      {exercise.videoUrl ? <ExerciseVideo uri={exercise.videoUrl} /> : null}

      {prescribedExercise ? (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Prescription</Text>
          <View style={styles.prescriptionStrip}>
            <PrescriptionMeta label="Sets" value={String(prescribedExercise.sets)} />
            <PrescriptionMeta label="Reps" value={prescribedExercise.reps} />
            <PrescriptionMeta label="Rest" value={`${prescribedExercise.rest_seconds}s`} />
          </View>
          {prescribedExercise.notes ? (
            <View style={[styles.notesCallout, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.metaLabel, { color: colors.primary }]}>Coach Notes</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {prescribedExercise.notes}
              </Text>
            </View>
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

function PrescriptionMeta({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.prescriptionMeta, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
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
  prescriptionStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prescriptionMeta: {
    borderRadius: radius.md,
    flex: 1,
    minWidth: 82,
    padding: spacing.md,
  },
  metaValue: {
    ...typography.h3,
  },
  metaLabel: {
    ...typography.caption,
    fontWeight: '800',
  },
  notesCallout: {
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  body: {
    ...typography.body,
  },
});
