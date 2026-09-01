import { useState, useEffect } from 'react';
import { WorkoutExercise, CompletedWorkout } from '@/types';

export function useWorkoutExercises(workoutId: string) {
  const [data, setData] = useState<WorkoutExercise[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData([
      {
        id: '1',
        workout_id: workoutId,
        exercise_name: 'Barbell Squat',
        sets: 4,
        reps: '8-10',
        rest_seconds: 90,
        order_index: 1,
      },
    ]);
  }, [workoutId]);

  return { data, isLoading };
}

export function useCompleteWorkout() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (data: { clientId: string; workoutId: string; durationMinutes?: number }, options?: { onSuccess?: () => void }) => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      options?.onSuccess?.();
    }, 1000);
  };
  return { mutate, isPending };
}

export function useLogSet() {
  const mutate = (data: { clientId: string; exerciseId: string; workoutId: string; setNumber: number; weightUsed: number; repsCompleted: number }) => {
  };
  return { mutate };
}

export function useWorkoutHistory(clientId?: string) {
  const [data, setData] = useState<CompletedWorkout[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setData([
      {
        id: '1',
        client_id: clientId,
        workout_id: 'w1',
        date_completed: new Date().toISOString(),
        duration_minutes: 45,
      }
    ]);
  }, [clientId]);

  return { data, isLoading };
}
