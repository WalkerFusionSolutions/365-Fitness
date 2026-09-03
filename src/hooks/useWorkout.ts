import { useCallback, useEffect, useState } from 'react';
import {
  assignWorkout,
  completeWorkoutSession,
  getClientWorkouts,
  getCoachWorkouts,
  getExerciseById,
  getExerciseLibrary,
  getExerciseVideoUrl,
  getPreviousPerformance,
  getWorkoutHistory,
  getWorkoutWithExercises,
  logWorkoutSet,
  saveExercise,
  saveWorkout,
  startWorkoutSession,
  uploadExerciseVideo,
} from '@/services/workouts.service';
import {
  ExerciseLibraryItem,
  Workout,
  WorkoutHistoryItem,
  WorkoutSetLog,
  WorkoutWithExercises,
} from '@/types';
import { AppServiceError } from '@/services/errors';

function getUserMessage(error: unknown, fallback: string) {
  if (error instanceof AppServiceError) {
    return error.userMessage;
  }

  return fallback;
}

export function useExerciseLibrary(search?: string) {
  const [data, setData] = useState<ExerciseLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    try {
      setData(await getExerciseLibrary(search));
    } catch (loadError) {
      console.error('Unable to load exercise library:', loadError);
      setError(getUserMessage(loadError, 'Unable to load exercise library.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: load };
}

export function useExercise(exerciseId?: string) {
  const [data, setData] = useState<ExerciseLibraryItem | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(exerciseId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!exerciseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const exercise = await getExerciseById(exerciseId);
      setData(exercise);
      setVideoUrl(await getExerciseVideoUrl(exercise?.video_path));
    } catch (loadError) {
      console.error('Unable to load exercise:', loadError);
      setError(getUserMessage(loadError, 'Unable to load exercise.'));
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, videoUrl, isLoading, error, refresh: load };
}

export function useSaveExercise() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (input: Parameters<typeof saveExercise>[0]) => {
    setIsSaving(true);
    setError(null);

    try {
      return await saveExercise(input);
    } catch (saveError) {
      console.error('Unable to save exercise:', saveError);
      const message = getUserMessage(saveError, 'Unable to save exercise.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { save, isSaving, error };
}

export function useUploadExerciseVideo() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (uri: string, fileName?: string) => {
    setIsUploading(true);
    setError(null);

    try {
      return await uploadExerciseVideo(uri, fileName);
    } catch (uploadError) {
      console.error('Unable to upload exercise video:', uploadError);
      const message = getUserMessage(uploadError, 'Unable to upload video.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading, error };
}

export function useCoachWorkouts() {
  const [data, setData] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    try {
      setData(await getCoachWorkouts());
    } catch (loadError) {
      console.error('Unable to load coach workouts:', loadError);
      setError(getUserMessage(loadError, 'Unable to load workouts.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: load };
}

export function useClientWorkouts(clientId?: string) {
  const [data, setData] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    try {
      setData(await getClientWorkouts(clientId));
    } catch (loadError) {
      console.error('Unable to load client workouts:', loadError);
      setError(getUserMessage(loadError, 'Unable to load workouts.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: load };
}

export function useWorkoutDetail(workoutId?: string) {
  const [data, setData] = useState<WorkoutWithExercises | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(workoutId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workoutId) return;

    setIsLoading(true);
    setError(null);

    try {
      setData(await getWorkoutWithExercises(workoutId));
    } catch (loadError) {
      console.error('Unable to load workout:', loadError);
      setError(getUserMessage(loadError, 'Unable to load workout.'));
    } finally {
      setIsLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}

export function useSaveWorkout() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (input: Parameters<typeof saveWorkout>[0]) => {
    setIsSaving(true);
    setError(null);

    try {
      return await saveWorkout(input);
    } catch (saveError) {
      console.error('Unable to save workout:', saveError);
      const message = getUserMessage(saveError, 'Unable to save workout.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { save, isSaving, error };
}

export function useAssignWorkout() {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = useCallback(async (workoutId: string, clientId: string) => {
    setIsAssigning(true);
    setError(null);

    try {
      return await assignWorkout(workoutId, clientId);
    } catch (assignError) {
      console.error('Unable to assign workout:', assignError);
      const message = getUserMessage(assignError, 'Unable to assign workout.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsAssigning(false);
    }
  }, []);

  return { assign, isAssigning, error };
}

export function useWorkoutHistory(clientId?: string) {
  const [data, setData] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    try {
      setData(await getWorkoutHistory(clientId));
    } catch (loadError) {
      console.error('Unable to load workout history:', loadError);
      setError(getUserMessage(loadError, 'Unable to load workout history.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, isRefreshing, error, refresh: load };
}

export function usePreviousPerformance(
  clientId?: string,
  workoutExerciseId?: string
) {
  const [data, setData] = useState<WorkoutSetLog[]>([]);

  useEffect(() => {
    if (!clientId || !workoutExerciseId) {
      setData([]);
      return;
    }

    getPreviousPerformance(clientId, workoutExerciseId)
      .then(setData)
      .catch((error) => {
        console.error('Unable to load previous performance:', error);
        setData([]);
      });
  }, [clientId, workoutExerciseId]);

  return { data };
}

export function useActiveWorkoutActions() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (workoutId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      return await startWorkoutSession(workoutId);
    } catch (startError) {
      console.error('Unable to start workout:', startError);
      const message = getUserMessage(startError, 'Unable to start workout.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const logSet = useCallback(
    async (input: Parameters<typeof logWorkoutSet>[0]) => {
      setIsSaving(true);
      setError(null);

      try {
        return await logWorkoutSet(input);
      } catch (logError) {
        console.error('Unable to save set:', logError);
        const message = getUserMessage(logError, 'Unable to save set.');
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const complete = useCallback(
    async (input: Parameters<typeof completeWorkoutSession>[0]) => {
      setIsSaving(true);
      setError(null);

      try {
        return await completeWorkoutSession(input);
      } catch (completeError) {
        console.error('Unable to complete workout:', completeError);
        const message = getUserMessage(
          completeError,
          'Unable to complete workout.'
        );
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { start, logSet, complete, isSaving, error };
}
