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

CREATE INDEX IF NOT EXISTS idx_workouts_coach_client
  ON public.workouts (coach_id, client_id);

CREATE INDEX IF NOT EXISTS idx_workouts_client_assigned_date
  ON public.workouts (client_id, assigned_date);

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS library_exercise_id uuid REFERENCES public.exercise_library(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_library_exercise_id
  ON public.workout_exercises (library_exercise_id);

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at timestamptz,
  duration_minutes integer,
  prescription_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_client_started
  ON public.workout_sessions (client_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id
  ON public.workout_sessions (workout_id);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.workout_set_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  workout_exercise_id uuid REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  exercise_name_snapshot text NOT NULL,
  set_number integer NOT NULL,
  target_reps text,
  prescribed_rest_seconds integer,
  weight_used numeric NOT NULL DEFAULT 0,
  reps_completed integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (session_id, workout_exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS idx_workout_set_logs_client_completed
  ON public.workout_set_logs (client_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_set_logs_exercise_history
  ON public.workout_set_logs (client_id, workout_exercise_id, completed_at DESC);

ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Clients can manage own workout sessions"
  ON public.workout_sessions FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
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

CREATE POLICY "Clients can manage own workout set logs"
  ON public.workout_set_logs FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1
      FROM public.workout_sessions AS ws
      WHERE ws.id = workout_set_logs.session_id
        AND ws.client_id = auth.uid()
        AND ws.workout_id = workout_set_logs.workout_id
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
