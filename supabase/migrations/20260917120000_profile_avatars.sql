-- Private profile avatars with user-owned client uploads and authorized reads.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authorized users can read profile avatars"
  ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload own profile avatar"
  ON storage.objects;
DROP POLICY IF EXISTS "Clients can replace own profile avatar"
  ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete own profile avatar"
  ON storage.objects;

CREATE POLICY "Authorized users can read profile avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.profiles AS avatar_profile
        WHERE avatar_profile.id::text = (storage.foldername(name))[1]
          AND (
            public.can_coach_client(avatar_profile.id)
            OR EXISTS (
              SELECT 1
              FROM public.coach_client_assignments AS assignment
              WHERE assignment.client_id = auth.uid()
                AND assignment.coach_id = avatar_profile.id
                AND assignment.status = 'active'::public.assignment_status
            )
          )
      )
    )
  );

CREATE POLICY "Clients can upload own profile avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND public.get_auth_role() = 'client'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('avatar.jpg', 'avatar.png', 'avatar.webp')
  );

CREATE POLICY "Clients can replace own profile avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND public.get_auth_role() = 'client'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('avatar.jpg', 'avatar.png', 'avatar.webp')
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND public.get_auth_role() = 'client'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('avatar.jpg', 'avatar.png', 'avatar.webp')
  );

CREATE POLICY "Clients can delete own profile avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND public.get_auth_role() = 'client'::public.user_role
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('avatar.jpg', 'avatar.png', 'avatar.webp')
  );
