-- Phase 3: workouts, reusable exercise library, exercise media, and workout sessions.
-- Existing workouts and workout_exercises are reused as the prescribed workout model.
-- New session tables snapshot performed workout history so later template edits do not rewrite history.

CREATE TABLE IF NOT EXISTS public.exercise_library (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  instructions text NOT NULL DEFAULT '',
  muscle_group text NOT NULL DEFAULT 'General',
  equipment text NOT NULL DEFAULT 'Bodyweight',
  video_path text,
  thumbnail_path text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exercise_library_coach_id
  ON public.exercise_library (coach_id);

CREATE INDEX IF NOT EXISTS idx_exercise_library_name
  ON public.exercise_library (name);

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'assigned',
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.workouts
  DROP CONSTRAINT IF EXISTS workouts_estimated_minutes_positive;

ALTER TABLE public.workouts
  ADD CONSTRAINT workouts_estimated_minutes_positive
  CHECK (estimated_minutes IS NULL OR estimated_minutes > 0) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_workouts_coach_client
  ON public.workouts (coach_id, client_id);

CREATE INDEX IF NOT EXISTS idx_workouts_client_assigned_date
  ON public.workouts (client_id, assigned_date);

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS library_exercise_id uuid REFERENCES public.exercise_library(id) ON DELETE SET NULL;

ALTER TABLE public.workout_exercises
  DROP CONSTRAINT IF EXISTS workout_exercises_sets_positive,
  DROP CONSTRAINT IF EXISTS workout_exercises_rest_nonnegative,
  DROP CONSTRAINT IF EXISTS workout_exercises_order_positive;

ALTER TABLE public.workout_exercises
  ADD CONSTRAINT workout_exercises_sets_positive CHECK (sets > 0) NOT VALID,
  ADD CONSTRAINT workout_exercises_rest_nonnegative CHECK (rest_seconds >= 0) NOT VALID,
  ADD CONSTRAINT workout_exercises_order_positive CHECK (order_index > 0) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_library_exercise_id
  ON public.workout_exercises (library_exercise_id);

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_workout_id_fkey,
  DROP CONSTRAINT IF EXISTS workout_logs_exercise_id_fkey,
  DROP CONSTRAINT IF EXISTS workout_logs_set_number_positive,
  DROP CONSTRAINT IF EXISTS workout_logs_weight_nonnegative,
  DROP CONSTRAINT IF EXISTS workout_logs_reps_nonnegative;

ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_workout_id_fkey
    FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE SET NULL,
  ADD CONSTRAINT workout_logs_exercise_id_fkey
    FOREIGN KEY (exercise_id) REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  ADD CONSTRAINT workout_logs_set_number_positive CHECK (set_number > 0) NOT VALID,
  ADD CONSTRAINT workout_logs_weight_nonnegative CHECK (weight_used >= 0) NOT VALID,
  ADD CONSTRAINT workout_logs_reps_nonnegative CHECK (reps_completed >= 0) NOT VALID;

ALTER TABLE public.completed_workouts
  DROP CONSTRAINT IF EXISTS completed_workouts_workout_id_fkey,
  DROP CONSTRAINT IF EXISTS completed_workouts_duration_nonnegative;

ALTER TABLE public.completed_workouts
  ADD CONSTRAINT completed_workouts_workout_id_fkey
    FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE SET NULL,
  ADD CONSTRAINT completed_workouts_duration_nonnegative
    CHECK (duration_minutes IS NULL OR duration_minutes >= 0) NOT VALID;

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at timestamptz,
  duration_minutes integer,
  prescription_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_client_started
  ON public.workout_sessions (client_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id
  ON public.workout_sessions (workout_id);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.workout_set_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  workout_exercise_id uuid REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  library_exercise_id uuid REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  exercise_name_snapshot text NOT NULL,
  set_number integer NOT NULL,
  target_reps text,
  prescribed_rest_seconds integer,
  weight_used numeric NOT NULL DEFAULT 0,
  reps_completed integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (set_number > 0),
  CHECK (prescribed_rest_seconds IS NULL OR prescribed_rest_seconds >= 0),
  CHECK (weight_used >= 0),
  CHECK (reps_completed >= 0),
  UNIQUE (session_id, workout_exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS idx_workout_set_logs_client_completed
  ON public.workout_set_logs (client_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_set_logs_exercise_history
  ON public.workout_set_logs (client_id, library_exercise_id, completed_at DESC);

ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prevent_completed_workout_session_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND OLD.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Completed workout sessions cannot be changed or deleted';
  END IF;

  IF auth.uid() IS NOT NULL
    AND TG_OP = 'UPDATE'
    AND NEW.completed_at IS NOT NULL
    AND (
      NEW.client_id IS DISTINCT FROM OLD.client_id
      OR NEW.workout_id IS DISTINCT FROM OLD.workout_id
      OR NEW.started_at IS DISTINCT FROM OLD.started_at
      OR NEW.prescription_snapshot IS DISTINCT FROM OLD.prescription_snapshot
    )
  THEN
    RAISE EXCEPTION 'Completing a workout cannot change its historical prescription';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_completed_workout_session_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_completed_workout_session_mutation
  ON public.workout_sessions;

CREATE TRIGGER prevent_completed_workout_session_mutation
  BEFORE UPDATE OR DELETE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_workout_session_mutation();

CREATE OR REPLACE FUNCTION public.prevent_completed_workout_set_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.id = OLD.session_id
        AND ws.completed_at IS NOT NULL
    )
  THEN
    RAISE EXCEPTION 'Completed workout logs cannot be changed or deleted';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_completed_workout_set_log_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_completed_workout_set_log_mutation
  ON public.workout_set_logs;

CREATE TRIGGER prevent_completed_workout_set_log_mutation
  BEFORE UPDATE OR DELETE ON public.workout_set_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_workout_set_log_mutation();

CREATE OR REPLACE FUNCTION public.can_access_client(client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = client_uuid
    OR public.is_assigned_coach(auth.uid(), client_uuid)
    OR (
      public.can_view_all_clients()
      AND public.is_client_profile(client_uuid)
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_coach_client(client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'coach'::public.user_role
    AND (
      public.is_assigned_coach(auth.uid(), client_uuid)
      OR (
        public.can_view_all_clients()
        AND public.is_client_profile(client_uuid)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_coach_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_coach_client(uuid) TO authenticated;

-- Remove older workout policies that are superseded by the Phase 3 model.
-- Client read policies on workouts/workout_exercises are intentionally retained.
DROP POLICY IF EXISTS "Coaches can manage workouts for assigned clients"
  ON public.workouts;
DROP POLICY IF EXISTS "Coaches can manage exercises for assigned client workouts"
  ON public.workout_exercises;
DROP POLICY IF EXISTS "Clients can manage own logs"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches can view assigned client logs"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Clients can manage own completions"
  ON public.completed_workouts;
DROP POLICY IF EXISTS "Coaches can view assigned client completions"
  ON public.completed_workouts;

-- Make this not-yet-applied migration resilient to policy-name collisions.
DROP POLICY IF EXISTS "Coaches can manage own exercise library"
  ON public.exercise_library;
DROP POLICY IF EXISTS "Clients can view exercises in assigned workouts"
  ON public.exercise_library;
DROP POLICY IF EXISTS "Authorized coaches can view assigned exercise library"
  ON public.exercise_library;
DROP POLICY IF EXISTS "Coaches can manage unassigned workout templates"
  ON public.workouts;
DROP POLICY IF EXISTS "Privileged coaches can manage visible client workouts"
  ON public.workouts;
DROP POLICY IF EXISTS "Coaches can manage exercises for own unassigned workouts"
  ON public.workout_exercises;
DROP POLICY IF EXISTS "Privileged coaches can manage visible client workout exercises"
  ON public.workout_exercises;
DROP POLICY IF EXISTS "Clients can view own workout sessions"
  ON public.workout_sessions;
DROP POLICY IF EXISTS "Clients can insert own workout sessions"
  ON public.workout_sessions;
DROP POLICY IF EXISTS "Clients can update own in-progress workout sessions"
  ON public.workout_sessions;
DROP POLICY IF EXISTS "Coaches can view accessible workout sessions"
  ON public.workout_sessions;
DROP POLICY IF EXISTS "Clients can view own workout set logs"
  ON public.workout_set_logs;
DROP POLICY IF EXISTS "Clients can insert own workout set logs"
  ON public.workout_set_logs;
DROP POLICY IF EXISTS "Clients can update own in-progress workout set logs"
  ON public.workout_set_logs;
DROP POLICY IF EXISTS "Coaches can view accessible workout set logs"
  ON public.workout_set_logs;
DROP POLICY IF EXISTS "Privileged coaches can view accessible workout logs"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Clients can view own workout logs"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Clients can insert own workout logs"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Clients can update own workout logs before completion"
  ON public.workout_logs;
DROP POLICY IF EXISTS "Privileged coaches can view accessible completed workouts"
  ON public.completed_workouts;
DROP POLICY IF EXISTS "Clients can view own completed workouts"
  ON public.completed_workouts;
DROP POLICY IF EXISTS "Clients can insert own completed workouts"
  ON public.completed_workouts;
DROP POLICY IF EXISTS "Coaches can upload own exercise videos"
  ON storage.objects;
DROP POLICY IF EXISTS "Coaches can manage own exercise videos"
  ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete own exercise videos"
  ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read exercise videos through signed URLs"
  ON storage.objects;

CREATE POLICY "Coaches can manage own exercise library"
  ON public.exercise_library FOR ALL
  USING (
    coach_id = auth.uid()
    AND public.get_auth_role() = 'coach'::public.user_role
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND public.get_auth_role() = 'coach'::public.user_role
  );

CREATE POLICY "Clients can view exercises in assigned workouts"
  ON public.exercise_library FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises AS we
      JOIN public.workouts AS w ON w.id = we.workout_id
      WHERE we.library_exercise_id = exercise_library.id
        AND w.client_id = auth.uid()
    )
  );

CREATE POLICY "Authorized coaches can view assigned exercise library"
  ON public.exercise_library FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises AS we
      JOIN public.workouts AS w ON w.id = we.workout_id
      WHERE we.library_exercise_id = exercise_library.id
        AND public.can_coach_client(w.client_id)
    )
  );

CREATE POLICY "Coaches can manage unassigned workout templates"
  ON public.workouts FOR ALL
  USING (
    coach_id = auth.uid()
    AND client_id IS NULL
    AND public.get_auth_role() = 'coach'::public.user_role
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND client_id IS NULL
    AND public.get_auth_role() = 'coach'::public.user_role
  );

CREATE POLICY "Privileged coaches can manage visible client workouts"
  ON public.workouts FOR ALL
  USING (
    coach_id = auth.uid()
    AND public.can_coach_client(client_id)
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND public.can_coach_client(client_id)
  );

CREATE POLICY "Coaches can manage exercises for own unassigned workouts"
  ON public.workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND w.client_id IS NULL
        AND public.get_auth_role() = 'coach'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND w.client_id IS NULL
        AND public.get_auth_role() = 'coach'::public.user_role
    )
  );

CREATE POLICY "Privileged coaches can manage visible client workout exercises"
  ON public.workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND public.can_coach_client(w.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND public.can_coach_client(w.client_id)
    )
  );

CREATE POLICY "Clients can view own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND workout_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_sessions.workout_id
        AND w.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update own in-progress workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
    AND (
      completed_at IS NULL
      OR completed_at >= started_at
    )
    AND workout_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_sessions.workout_id
        AND w.client_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view accessible workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Clients can view own workout set logs"
  ON public.workout_set_logs FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own workout set logs"
  ON public.workout_set_logs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND session_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.id = workout_set_logs.session_id
        AND ws.client_id = auth.uid()
        AND ws.workout_id = workout_set_logs.workout_id
        AND ws.completed_at IS NULL
    )
  );

CREATE POLICY "Clients can update own in-progress workout set logs"
  ON public.workout_set_logs FOR UPDATE
  USING (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.id = workout_set_logs.session_id
        AND ws.client_id = auth.uid()
        AND ws.completed_at IS NULL
    )
  )
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.id = workout_set_logs.session_id
        AND ws.client_id = auth.uid()
        AND ws.workout_id = workout_set_logs.workout_id
        AND ws.completed_at IS NULL
    )
  );

CREATE POLICY "Coaches can view accessible workout set logs"
  ON public.workout_set_logs FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Privileged coaches can view accessible workout logs"
  ON public.workout_logs FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Privileged coaches can view accessible completed workouts"
  ON public.completed_workouts FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Clients can view own workout logs"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND workout_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = workout_logs.workout_id
        AND w.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update own workout logs before completion"
  ON public.workout_logs FOR UPDATE
  USING (
    auth.uid() = client_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.workout_id = workout_logs.workout_id
        AND ws.client_id = auth.uid()
        AND ws.completed_at IS NOT NULL
    )
  )
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view own completed workouts"
  ON public.completed_workouts FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own completed workouts"
  ON public.completed_workouts FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND workout_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workouts AS w
      WHERE w.id = completed_workouts.workout_id
        AND w.client_id = auth.uid()
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-videos', 'exercise-videos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Coaches can upload own exercise videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-videos'
    AND public.get_auth_role() = 'coach'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can manage own exercise videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exercise-videos'
    AND public.get_auth_role() = 'coach'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'exercise-videos'
    AND public.get_auth_role() = 'coach'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can delete own exercise videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-videos'
    AND public.get_auth_role() = 'coach'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authorized users can read exercise videos through signed URLs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exercise-videos'
    AND EXISTS (
      SELECT 1
      FROM public.exercise_library AS el
      WHERE el.video_path = storage.objects.name
        AND (
          el.coach_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.workout_exercises AS we
            JOIN public.workouts AS w ON w.id = we.workout_id
            WHERE we.library_exercise_id = el.id
              AND public.can_access_client(w.client_id)
          )
        )
    )
  );
