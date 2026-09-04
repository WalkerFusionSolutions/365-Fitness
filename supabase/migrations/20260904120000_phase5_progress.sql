-- Phase 5: Progress, measurements, goals and private progress photos.
-- Review-only migration. Do not apply until the SQL has been inspected.

ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS hips numeric,
  ADD COLUMN IF NOT EXISTS left_arm numeric,
  ADD COLUMN IF NOT EXISTS right_arm numeric,
  ADD COLUMN IF NOT EXISTS left_thigh numeric,
  ADD COLUMN IF NOT EXISTS right_thigh numeric,
  ADD COLUMN IF NOT EXISTS neck numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_weight_non_negative CHECK (weight IS NULL OR weight >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_body_fat_non_negative CHECK (body_fat IS NULL OR body_fat >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_chest_non_negative CHECK (chest IS NULL OR chest >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_waist_non_negative CHECK (waist IS NULL OR waist >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_hips_non_negative CHECK (hips IS NULL OR hips >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_left_arm_non_negative CHECK (left_arm IS NULL OR left_arm >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_right_arm_non_negative CHECK (right_arm IS NULL OR right_arm >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_left_thigh_non_negative CHECK (left_thigh IS NULL OR left_thigh >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_right_thigh_non_negative CHECK (right_thigh IS NULL OR right_thigh >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.measurements ADD CONSTRAINT measurements_neck_non_negative CHECK (neck IS NULL OR neck >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_measurements_updated_at ON public.measurements;
CREATE TRIGGER set_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS pose text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS taken_at date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

UPDATE public.progress_photos
SET
  storage_path = COALESCE(storage_path, photo_url),
  taken_at = COALESCE(taken_at, date, CURRENT_DATE)
WHERE storage_path IS NULL
   OR taken_at IS NULL;

ALTER TABLE public.progress_photos
  ALTER COLUMN storage_path SET NOT NULL,
  ALTER COLUMN photo_url DROP NOT NULL,
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN taken_at SET DEFAULT CURRENT_DATE,
  ALTER COLUMN taken_at SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.progress_photos ADD CONSTRAINT progress_photos_pose_allowed CHECK (pose IN ('front', 'side', 'back', 'other')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.progress_photos ADD CONSTRAINT progress_photos_storage_path_not_empty CHECK (length(btrim(storage_path)) > 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS progress_photos_client_taken_at_idx
  ON public.progress_photos (client_id, taken_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

DROP POLICY IF EXISTS "Coaches can view assigned client measurements" ON public.measurements;
DROP POLICY IF EXISTS "Coaches can view client measurements through progress access" ON public.measurements;
CREATE POLICY "Coaches can view client measurements through progress access"
  ON public.measurements FOR SELECT
  USING (public.can_coach_client(client_id));

DROP POLICY IF EXISTS "Assigned coaches can insert client measurements" ON public.measurements;
DROP POLICY IF EXISTS "Coaches can insert client measurements through progress access" ON public.measurements;
CREATE POLICY "Coaches can insert client measurements through progress access"
  ON public.measurements FOR INSERT
  WITH CHECK (public.is_assigned_coach(auth.uid(), client_id));

DROP POLICY IF EXISTS "Privileged coaches can insert all client measurements" ON public.measurements;
CREATE POLICY "Privileged coaches can insert all client measurements"
  ON public.measurements FOR INSERT
  WITH CHECK (
    public.can_manage_all_client_measurements()
    AND public.is_client_profile(client_id)
  );

DROP POLICY IF EXISTS "Coaches can view assigned client photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Clients can manage own photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Clients can read own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Clients can insert own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Clients can delete own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Coaches can read client progress photos through progress access" ON public.progress_photos;

CREATE POLICY "Clients can read own progress photos"
  ON public.progress_photos FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own progress photos"
  ON public.progress_photos FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND storage_path LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "Clients can delete own progress photos"
  ON public.progress_photos FOR DELETE
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can read client progress photos through progress access"
  ON public.progress_photos FOR SELECT
  USING (public.can_coach_client(client_id));

DROP POLICY IF EXISTS "Clients can upload own progress photo objects" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read own progress photo objects" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete own progress photo objects" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can read assigned progress photo objects" ON storage.objects;

CREATE POLICY "Clients can upload own progress photo objects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients can read own progress photo objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients can delete own progress photo objects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can read assigned progress photo objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND EXISTS (
      SELECT 1
      FROM public.progress_photos AS pp
      WHERE pp.storage_path = storage.objects.name
        AND public.can_coach_client(pp.client_id)
    )
  );
