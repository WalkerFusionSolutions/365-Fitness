import {
  ExerciseLibraryItem,
  Workout,
  WorkoutExercise,
  WorkoutHistoryItem,
  WorkoutSetLog,
  WorkoutWithExercises,
} from '@/types';
import { supabase } from '@/services/supabase';
import { AppServiceError, throwIfSupabaseError } from '@/services/errors';

const EXERCISE_VIDEO_BUCKET = 'exercise-videos';

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppServiceError('Unable to verify your session.', error);
  }

  if (!user) {
    throw new AppServiceError('Please sign in to continue.');
  }

  return user.id;
}

function orderExercises(exercises: WorkoutExercise[]) {
  return [...exercises].sort((a, b) => a.order_index - b.order_index);
}

export async function getExerciseLibrary(search?: string) {
  let query = supabase
    .from('exercise_library')
    .select('*')
    .order('name', { ascending: true });

  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, 'Unable to load exercise library.');

  return data ?? [];
}

export async function getExerciseById(exerciseId: string) {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load exercise.');
  return data;
}

export async function saveExercise(input: {
  id?: string;
  name: string;
  description?: string | null;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  videoPath?: string | null;
}) {
  const coachId = await getCurrentUserId();
  const payload = {
    coach_id: coachId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    instructions: input.instructions.trim(),
    muscle_group: input.muscleGroup.trim() || 'General',
    equipment: input.equipment.trim() || 'Bodyweight',
    video_path: input.videoPath ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = input.id
    ? await supabase
        .from('exercise_library')
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single()
    : await supabase.from('exercise_library').insert(payload).select('*').single();

  throwIfSupabaseError(error, 'Unable to save exercise.');
  return data;
}

export async function uploadExerciseVideo(uri: string, fileName?: string) {
  const coachId = await getCurrentUserId();
  const extension = fileName?.split('.').pop() || uri.split('.').pop() || 'mp4';
  const safeExtension = extension.split('?')[0] || 'mp4';
  const path = `${coachId}/${Date.now()}.${safeExtension}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: `video/${safeExtension === 'mov' ? 'quicktime' : safeExtension}`,
      upsert: false,
    });

  throwIfSupabaseError(error, 'Unable to upload exercise video.');
  return path;
}

export async function getExerciseVideoUrl(videoPath?: string | null) {
  if (!videoPath) return null;

  const { data, error } = await supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .createSignedUrl(videoPath, 60 * 30);

  throwIfSupabaseError(error, 'Unable to load exercise video.');
  return data?.signedUrl ?? null;
}

export async function getCoachWorkouts() {
  const coachId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('coach_id', coachId)
    .order('assigned_date', { ascending: false, nullsFirst: false });

  throwIfSupabaseError(error, 'Unable to load workouts.');
  return data ?? [];
}

export async function getClientWorkouts(clientId?: string) {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('client_id', resolvedClientId)
    .order('assigned_date', { ascending: false, nullsFirst: false });

  throwIfSupabaseError(error, 'Unable to load workouts.');
  return data ?? [];
}

export async function getWorkoutWithExercises(
  workoutId: string
): Promise<WorkoutWithExercises | null> {
  const [workoutResult, exercisesResult] = await Promise.all([
    supabase.from('workouts').select('*').eq('id', workoutId).maybeSingle(),
    supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true }),
  ]);

  throwIfSupabaseError(workoutResult.error, 'Unable to load workout.');
  throwIfSupabaseError(
    exercisesResult.error,
    'Unable to load workout exercises.'
  );

  if (!workoutResult.data) return null;

  return {
    ...workoutResult.data,
    exercises: exercisesResult.data ?? [],
  };
}

export async function saveWorkout(input: {
  id?: string;
  name: string;
  description?: string | null;
  clientId?: string | null;
  estimatedMinutes?: number | null;
  exercises: Array<{
    libraryExerciseId?: string | null;
    exerciseName: string;
    sets: number;
    reps: string;
    restSeconds: number;
    videoUrl?: string | null;
    notes?: string | null;
  }>;
}) {
  const coachId = await getCurrentUserId();
  const workoutPayload = {
    coach_id: coachId,
    client_id: input.clientId ?? null,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    assigned_date: input.clientId ? new Date().toISOString().slice(0, 10) : null,
    status: input.clientId ? 'assigned' : 'draft',
    estimated_minutes: input.estimatedMinutes ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: workout, error: workoutError } = input.id
    ? await supabase
        .from('workouts')
        .update(workoutPayload)
        .eq('id', input.id)
        .select('*')
        .single()
    : await supabase.from('workouts').insert(workoutPayload).select('*').single();

  throwIfSupabaseError(workoutError, 'Unable to save workout.');

  if (!workout) {
    throw new AppServiceError('Unable to save workout.');
  }

  const { error: deleteError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workout.id);

  throwIfSupabaseError(deleteError, 'Unable to update workout exercises.');

  if (input.exercises.length > 0) {
    const { error: exerciseError } = await supabase.from('workout_exercises').insert(
      input.exercises.map((exercise, index) => ({
        workout_id: workout.id,
        library_exercise_id: exercise.libraryExerciseId ?? null,
        exercise_name: exercise.exerciseName.trim(),
        sets: exercise.sets,
        reps: exercise.reps.trim(),
        rest_seconds: exercise.restSeconds,
        video_url: exercise.videoUrl ?? null,
        order_index: index + 1,
        notes: exercise.notes?.trim() || null,
      }))
    );

    throwIfSupabaseError(exerciseError, 'Unable to save workout exercises.');
  }

  return getWorkoutWithExercises(workout.id);
}

export async function assignWorkout(workoutId: string, clientId: string) {
  const sourceWorkout = await getWorkoutWithExercises(workoutId);

  if (!sourceWorkout) {
    throw new AppServiceError('Workout not found.');
  }

  return saveWorkout({
    name: sourceWorkout.name,
    description: sourceWorkout.description,
    clientId,
    estimatedMinutes: sourceWorkout.estimated_minutes,
    exercises: sourceWorkout.exercises.map((exercise) => ({
      libraryExerciseId: exercise.library_exercise_id,
      exerciseName: exercise.exercise_name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.rest_seconds,
      videoUrl: exercise.video_url,
      notes: exercise.notes,
    })),
  });
}

export async function getWorkoutExercises(workoutId: string) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(error, 'Unable to load workout exercises.');
  return orderExercises(data ?? []);
}

export async function startWorkoutSession(workoutId: string) {
  const clientId = await getCurrentUserId();
  const workout = await getWorkoutWithExercises(workoutId);

  if (!workout) {
    throw new AppServiceError('Workout not found.');
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      client_id: clientId,
      workout_id: workoutId,
      prescription_snapshot: workout as any,
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to start workout.');

  if (!data) {
    throw new AppServiceError('Unable to start workout.');
  }

  return data;
}

export async function logWorkoutSet(input: {
  sessionId: string;
  clientId: string;
  workoutId: string;
  exercise: WorkoutExercise;
  setNumber: number;
  weightUsed: number;
  repsCompleted: number;
}) {
  const setLogPayload = {
    session_id: input.sessionId,
    client_id: input.clientId,
    workout_id: input.workoutId,
    workout_exercise_id: input.exercise.id,
    exercise_name_snapshot: input.exercise.exercise_name,
    set_number: input.setNumber,
    target_reps: input.exercise.reps,
    prescribed_rest_seconds: input.exercise.rest_seconds,
    weight_used: input.weightUsed,
    reps_completed: input.repsCompleted,
  };

  const { data, error } = await supabase
    .from('workout_set_logs')
    .insert(setLogPayload)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to save set.');

  if (!data) {
    throw new AppServiceError('Unable to save set.');
  }

  const { error: legacyError } = await supabase.from('workout_logs').insert({
    client_id: input.clientId,
    workout_id: input.workoutId,
    exercise_id: input.exercise.id,
    set_number: input.setNumber,
    weight_used: input.weightUsed,
    reps_completed: input.repsCompleted,
  });

  throwIfSupabaseError(legacyError, 'Unable to save workout log.');

  return data;
}

export async function completeWorkoutSession(input: {
  sessionId: string;
  clientId: string;
  workoutId: string;
  durationMinutes: number;
}) {
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      completed_at: completedAt,
      duration_minutes: input.durationMinutes,
    })
    .eq('id', input.sessionId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to complete workout.');

  const { error: completedError } = await supabase.from('completed_workouts').insert({
    client_id: input.clientId,
    workout_id: input.workoutId,
    duration_minutes: input.durationMinutes,
    date_completed: completedAt,
  });

  throwIfSupabaseError(completedError, 'Unable to save workout completion.');

  return data;
}

export async function getWorkoutHistory(
  clientId?: string
): Promise<WorkoutHistoryItem[]> {
  const resolvedClientId = clientId ?? (await getCurrentUserId());
  const [completedResult, sessionsResult] = await Promise.all([
    supabase
      .from('completed_workouts')
      .select('*, workout:workouts(*)')
      .eq('client_id', resolvedClientId)
      .order('date_completed', { ascending: false }),
    supabase
      .from('workout_sessions')
      .select('*')
      .eq('client_id', resolvedClientId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
  ]);

  throwIfSupabaseError(completedResult.error, 'Unable to load workout history.');
  throwIfSupabaseError(sessionsResult.error, 'Unable to load workout sessions.');

  const sessionsByWorkoutId = new Map(
    (sessionsResult.data ?? []).map((session) => [session.workout_id, session])
  );

  return (completedResult.data ?? []).map((entry: any) => ({
    ...entry,
    workout: entry.workout ?? null,
    session: sessionsByWorkoutId.get(entry.workout_id ?? '') ?? null,
  }));
}

export async function getPreviousPerformance(
  clientId: string,
  workoutExerciseId: string
) {
  const { data, error } = await supabase
    .from('workout_set_logs')
    .select('*')
    .eq('client_id', clientId)
    .eq('workout_exercise_id', workoutExerciseId)
    .order('completed_at', { ascending: false })
    .limit(6);

  throwIfSupabaseError(error, 'Unable to load previous performance.');
  return data ?? [];
}

export function summarizeSetLogs(logs: WorkoutSetLog[]) {
  const setCount = logs.length;
  const totalVolume = logs.reduce(
    (total, log) =>
      total + Number(log.weight_used || 0) * Number(log.reps_completed || 0),
    0
  );

  return {
    setCount,
    totalVolume,
  };
}
