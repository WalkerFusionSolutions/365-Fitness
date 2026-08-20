import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList, WorkoutExercise } from '@/types';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingView } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/utils/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCompleteWorkout, useLogSet, useWorkoutExercises } from '@/hooks/useWorkout';

type Props = NativeStackScreenProps<ClientStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const { profile } = useAuth();
  const { data: exercises, isLoading } = useWorkoutExercises(workoutId);
  const completeWorkout = useCompleteWorkout();
  const [startedAt] = useState(Date.now());

  if (isLoading || !exercises) return <LoadingView label="Loading exercises..." />;

  const onComplete = () => {
    if (!profile?.id) return;
    const durationMinutes = Math.round((Date.now() - startedAt) / 60000);
    completeWorkout.mutate(
      { clientId: profile.id, workoutId, durationMinutes },
      { onSuccess: () => navigation.goBack() }
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>Workout Session</Text>
      {exercises.map((exercise, idx) => (
        <ExerciseCard key={exercise.id} exercise={exercise} index={idx} clientId={profile?.id} workoutId={workoutId} />
      ))}
      <Button
        label="Complete Workout"
        onPress={onComplete}
        loading={completeWorkout.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

function ExerciseCard({
  exercise,
  index,
  clientId,
  workoutId,
}: {
  exercise: WorkoutExercise;
  index: number;
  clientId: string | undefined;
  workoutId: string;
}) {
  const logSet = useLogSet();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [completedSets, setCompletedSets] = useState(0);
  const { seconds, isResting, startRest } = useRestTimer(exercise.rest_seconds);

  const onLogSet = () => {
    if (!clientId || !weight || !reps) return;
    logSet.mutate({
      clientId,
      exerciseId: exercise.id,
      workoutId,
      setNumber: completedSets + 1,
      weightUsed: parseFloat(weight),
      repsCompleted: parseInt(reps, 10),
    });
    setCompletedSets((c) => c + 1);
    startRest();
  };

  return (
    <Card style={styles.exerciseCard}>
      <Text style={styles.exerciseTitle}>
        {index + 1}. {exercise.exercise_name}
      </Text>
      <Text style={styles.exerciseMeta}>
        {exercise.sets} sets x {exercise.reps} reps &middot; {exercise.rest_seconds}s rest
      </Text>
      {exercise.notes ? <Text style={styles.exerciseNotes}>{exercise.notes}</Text> : null}

      {exercise.video_url ? <ExerciseVideo uri={exercise.video_url} /> : null}

      <View style={styles.setProgress}>
        <Text style={styles.setProgressText}>
          Set {Math.min(completedSets + 1, exercise.sets)} of {exercise.sets}
        </Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.smallInput}
          placeholder="Weight"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.smallInput}
          placeholder="Reps"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={reps}
          onChangeText={setReps}
        />
        <Button label="Log Set" onPress={onLogSet} style={{ flex: 1 }} disabled={completedSets >= exercise.sets} />
      </View>

      {isResting && (
        <View style={styles.restTimer}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.restTimerText}>Rest: {seconds}s</Text>
        </View>
      )}
    </Card>
  );
}

function ExerciseVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

function useRestTimer(defaultSeconds: number) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isResting, setIsResting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = () => {
    setSeconds(defaultSeconds);
    setIsResting(true);
  };

  useEffect(() => {
    if (!isResting) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setIsResting(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isResting]);

  return { seconds, isResting, startRest };
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  exerciseCard: { marginBottom: spacing.md, gap: spacing.xs },
  exerciseTitle: { ...typography.h3, color: colors.textPrimary },
  exerciseMeta: { ...typography.caption, color: colors.textSecondary },
  exerciseNotes: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },
  video: { width: '100%', height: 200, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.secondary },
  setProgress: { marginTop: spacing.sm },
  setProgressText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
  smallInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    color: colors.textPrimary,
    width: 70,
    textAlign: 'center',
  },
  restTimer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  restTimerText: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
