import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ProgressBar } from '@/components/AppUI';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import {
  useActiveWorkoutActions,
  usePreviousPerformance,
  useWorkoutDetail,
} from '@/hooks/useWorkout';
import { useAppTheme } from '@/hooks/useTheme';
import { WorkoutExercise, WorkoutSetLog } from '@/types';
import { spacing, typography } from '@/utils/theme';

export default function ActiveWorkoutScreen({ route, navigation }: any) {
  const { workoutId } = route.params;
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data: workout, isLoading, error, refresh } = useWorkoutDetail(workoutId);
  const actions = useActiveWorkoutActions();
  const { start } = actions;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(8);
  const [logs, setLogs] = useState<WorkoutSetLog[]>([]);
  const [restSeconds, setRestSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exercise = workout?.exercises[exerciseIndex];
  const previous = usePreviousPerformance(profile?.id, exercise?.library_exercise_id);
  const totalSets = useMemo(
    () => workout?.exercises.reduce((total, item) => total + item.sets, 0) ?? 0,
    [workout?.exercises]
  );
  const completedSets = logs.length;
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  useEffect(() => {
    if (!workoutId || sessionId) return;

    start(workoutId)
      .then((session) => {
        if (session) setSessionId(session.id);
      })
      .catch(() => undefined);
  }, [sessionId, start, workoutId]);

  useEffect(() => {
    if (restSeconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setRestSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restSeconds > 0]);

  useEffect(() => {
    if (!exercise) return;

    const targetReps = Number(String(exercise.reps).match(/\d+/)?.[0] ?? 8);
    setReps(targetReps);
  }, [exercise?.id]);

  if (isLoading || !sessionId) {
    return <LoadingView label="Starting workout..." />;
  }

  if (error || !workout || !exercise || !profile?.id) {
    return (
      <Screen>
        <ErrorState
          title="Unable to start workout"
          subtitle={actions.error || 'Please try again.'}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  const isLastSet = setNumber >= exercise.sets;
  const isLastExercise = exerciseIndex >= workout.exercises.length - 1;
  const isWorkoutComplete = isLastSet && isLastExercise;

  const moveNext = () => {
    if (!isLastSet) {
      setSetNumber((current) => current + 1);
      return;
    }

    if (!isLastExercise) {
      setExerciseIndex((current) => current + 1);
      setSetNumber(1);
    }
  };

  const completeSet = async () => {
    try {
      const savedLog = await actions.logSet({
        sessionId,
        clientId: profile.id,
        workoutId,
        exercise,
        setNumber,
        weightUsed: weight,
        repsCompleted: reps,
      });
      if (savedLog) {
        setLogs((current) => [...current, savedLog]);
      }

      if (isWorkoutComplete) {
        const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
        await actions.complete({
          sessionId,
          clientId: profile.id,
          workoutId,
          durationMinutes,
        });
        navigation.replace('ClientApp');
        return;
      }

      setRestSeconds(exercise.rest_seconds);
      moveNext();
    } catch (saveError) {
      Alert.alert('Unable to save set', actions.error || 'Please try again.');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
            {workout.name}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {exercise.exercise_name}
          </Text>
        </View>
        <Text style={[styles.progress, { color: colors.primary }]}>
          {completedSets}/{totalSets}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <ProgressBar value={progressPercent} />
      </View>

      <Card style={styles.currentCard}>
        <Text style={[styles.setTitle, { color: colors.textPrimary }]}>
          Set {setNumber} of {exercise.sets}
        </Text>
        <Text style={[styles.target, { color: colors.textSecondary }]}>
          Target {exercise.reps} reps • {exercise.rest_seconds}s rest
        </Text>

        <Stepper
          label="Weight"
          value={weight}
          suffix="lb"
          step={5}
          onChange={setWeight}
        />
        <Stepper label="Reps" value={reps} step={1} onChange={setReps} />

        {previous.data.length > 0 ? <PreviousPerformance logs={previous.data} /> : null}

        <Button
          label={isWorkoutComplete ? 'Complete Workout' : 'Complete Set'}
          onPress={completeSet}
          loading={actions.isSaving}
          style={styles.completeButton}
        />
      </Card>

      {restSeconds > 0 ? (
        <Card style={[styles.restCard, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.restLabel, { color: colors.textSecondary }]}>Rest</Text>
          <Text style={[styles.restTime, { color: colors.primary }]}>
            {formatTimer(restSeconds)}
          </Text>
          <Button label="Skip Rest" variant="outline" onPress={() => setRestSeconds(0)} />
        </Card>
      ) : null}
    </Screen>
  );
}

function Stepper({
  label,
  value,
  suffix,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  step: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={[styles.stepButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => onChange(Math.max(0, value - step))}
        >
          <Ionicons name="remove" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.stepValue, { color: colors.textPrimary }]}>
          {value} {suffix ?? ''}
        </Text>
        <Pressable
          style={[styles.stepButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => onChange(value + step)}
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function PreviousPerformance({ logs }: { logs: WorkoutSetLog[] }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.previous}>
      <Text style={[styles.previousTitle, { color: colors.textPrimary }]}>Last Time</Text>
      {logs.slice(0, 3).map((log) => (
        <Text key={log.id} style={[styles.previousText, { color: colors.textSecondary }]}>
          Set {log.set_number}: {log.weight_used} lb x {log.reps_completed}
        </Text>
      ))}
    </View>
  );
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  progressTrack: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    ...typography.h1,
  },
  progress: {
    ...typography.h2,
  },
  currentCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  setTitle: {
    ...typography.h2,
  },
  target: {
    ...typography.body,
  },
  stepper: {
    gap: spacing.sm,
  },
  stepperLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  previous: {
    gap: spacing.xs,
  },
  previousTitle: {
    ...typography.h3,
  },
  previousText: {
    ...typography.caption,
  },
  completeButton: {
    marginTop: spacing.sm,
    minHeight: 58,
  },
  restCard: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  restLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  restTime: {
    fontSize: 48,
    fontWeight: '800',
  },
});
