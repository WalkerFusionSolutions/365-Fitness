-- Phase 5 post-apply security hardening.
-- Review-only migration. Do not apply until the SQL has been inspected.

ALTER TABLE public.measurements
  ALTER COLUMN client_id SET NOT NULL;

DROP POLICY IF EXISTS "Clients can manage own measurements"
  ON public.measurements;

DROP POLICY IF EXISTS "Clients can read own measurements"
  ON public.measurements;

DROP POLICY IF EXISTS "Clients can insert own measurements"
  ON public.measurements;

CREATE POLICY "Clients can read own measurements"
  ON public.measurements
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own measurements"
  ON public.measurements
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

REVOKE EXECUTE ON FUNCTION public.can_access_client(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_coach_client(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_coach_client(uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_manage_all_client_measurements()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_all_client_measurements()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_view_all_clients()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_all_clients()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_auth_role()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_assigned_coach(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_assigned_coach(uuid, uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_client_profile(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_client_profile(uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_completed_workout_session_mutation()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_completed_workout_set_log_mutation()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_coach_client_assignment()
  FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_weight_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_weight_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_body_fat_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_body_fat_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_chest_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_chest_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_waist_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_waist_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_hips_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_hips_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_left_arm_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_left_arm_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_right_arm_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_right_arm_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_left_thigh_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_left_thigh_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_right_thigh_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_right_thigh_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_neck_non_negative'
  ) THEN
    ALTER TABLE public.measurements VALIDATE CONSTRAINT measurements_neck_non_negative;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.progress_photos'::regclass
      AND conname = 'progress_photos_pose_allowed'
  ) THEN
    ALTER TABLE public.progress_photos VALIDATE CONSTRAINT progress_photos_pose_allowed;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.progress_photos'::regclass
      AND conname = 'progress_photos_storage_path_not_empty'
  ) THEN
    ALTER TABLE public.progress_photos VALIDATE CONSTRAINT progress_photos_storage_path_not_empty;
  END IF;
END $$;
