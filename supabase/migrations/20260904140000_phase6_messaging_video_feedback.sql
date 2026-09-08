-- Phase 6: secure coach/client messaging and private video feedback.
-- Review before applying. This migration is additive and preserves legacy
-- public.messages rows by backfilling conversation_id/body/created_at.

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  last_message_at timestamptz NULL,
  last_message_preview text NULL,
  client_last_read_at timestamptz NULL,
  coach_last_read_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active',
  CONSTRAINT conversations_status_check CHECK (status IN ('active', 'archived')),
  CONSTRAINT conversations_distinct_participants CHECK (client_id <> coach_id),
  CONSTRAINT conversations_client_coach_unique UNIQUE (client_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id
  ON public.conversations (client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_coach_id
  ON public.conversations (coach_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON public.conversations (last_message_at DESC NULLS LAST);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.conversations TO authenticated;

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  attachment_type text NOT NULL DEFAULT 'video_feedback',
  mime_type text NULL,
  file_size_bytes bigint NULL,
  duration_seconds numeric NULL,
  original_filename text NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT message_attachments_type_check CHECK (attachment_type IN ('video_feedback')),
  CONSTRAINT message_attachments_file_size_check CHECK (
    file_size_bytes IS NULL OR file_size_bytes BETWEEN 1 AND 104857600
  )
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_conversation_id
  ON public.message_attachments (conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_client_id
  ON public.message_attachments (client_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploader_id
  ON public.message_attachments (uploader_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.message_attachments TO authenticated;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid NULL,
  ADD COLUMN IF NOT EXISTS message_type text NULL,
  ADD COLUMN IF NOT EXISTS body text NULL,
  ADD COLUMN IF NOT EXISTS attachment_id uuid NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_conversation_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_attachment_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_attachment_id_fkey
      FOREIGN KEY (attachment_id) REFERENCES public.message_attachments(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.messages
    WHERE sender_id IS NULL
      OR receiver_id IS NULL
      OR (content IS NULL AND video_url IS NULL)
  ) THEN
    RAISE EXCEPTION 'Phase 6 messaging migration stopped: legacy messages contain NULL sender/receiver/content data that must be reviewed before backfill.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.messages
    WHERE video_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Phase 6 messaging migration stopped: legacy messages contain video_url values. Backfill these to private message_attachments/storage_path before applying.';
  END IF;
END;
$$;

INSERT INTO public.conversations (client_id, coach_id, created_at, updated_at, last_message_at, last_message_preview)
SELECT
  CASE
    WHEN sender_profile.role = 'client'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END AS client_id,
  CASE
    WHEN sender_profile.role = 'coach'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END AS coach_id,
  MIN(m.timestamp),
  MAX(m.timestamp),
  MAX(m.timestamp),
  LEFT((ARRAY_AGG(m.content ORDER BY m.timestamp DESC))[1], 140)
FROM public.messages AS m
JOIN public.profiles AS sender_profile ON sender_profile.id = m.sender_id
JOIN public.profiles AS receiver_profile ON receiver_profile.id = m.receiver_id
WHERE m.conversation_id IS NULL
  AND sender_profile.role <> receiver_profile.role
GROUP BY
  CASE
    WHEN sender_profile.role = 'client'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END,
  CASE
    WHEN sender_profile.role = 'coach'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END
ON CONFLICT (client_id, coach_id) DO UPDATE
SET
  last_message_at = GREATEST(
    COALESCE(public.conversations.last_message_at, excluded.last_message_at),
    COALESCE(excluded.last_message_at, public.conversations.last_message_at)
  ),
  last_message_preview = COALESCE(excluded.last_message_preview, public.conversations.last_message_preview),
  updated_at = timezone('utc'::text, now());

UPDATE public.messages AS m
SET
  conversation_id = c.id,
  message_type = COALESCE(m.message_type, 'text'),
  body = COALESCE(m.body, m.content),
  created_at = COALESCE(m.created_at, m.timestamp)
FROM public.profiles AS sender_profile,
  public.profiles AS receiver_profile,
  public.conversations AS c
WHERE m.conversation_id IS NULL
  AND sender_profile.id = m.sender_id
  AND receiver_profile.id = m.receiver_id
  AND sender_profile.role <> receiver_profile.role
  AND c.client_id = CASE
    WHEN sender_profile.role = 'client'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END
  AND c.coach_id = CASE
    WHEN sender_profile.role = 'coach'::public.user_role THEN m.sender_id
    ELSE m.receiver_id
  END;

UPDATE public.messages
SET
  message_type = COALESCE(message_type, 'text'),
  body = COALESCE(body, content),
  created_at = COALESCE(created_at, timestamp)
WHERE conversation_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.messages
    WHERE conversation_id IS NULL
      OR sender_id IS NULL
      OR receiver_id IS NULL
      OR created_at IS NULL
      OR message_type IS NULL
  ) THEN
    RAISE EXCEPTION 'Phase 6 messaging migration stopped: not all legacy messages could be mapped to a valid coach/client conversation.';
  END IF;
END;
$$;

ALTER TABLE public.messages
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN sender_id SET NOT NULL,
  ALTER COLUMN receiver_id SET NOT NULL,
  ALTER COLUMN message_type SET DEFAULT 'text',
  ALTER COLUMN message_type SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_type_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_type_check
      CHECK (message_type IN ('text', 'video_feedback'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_content_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_check
      CHECK (
        (
          message_type = 'text'
          AND attachment_id IS NULL
          AND body IS NOT NULL
          AND length(btrim(body)) BETWEEN 1 AND 2000
        )
        OR (
          message_type = 'video_feedback'
          AND attachment_id IS NOT NULL
        )
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

CREATE OR REPLACE FUNCTION public.can_access_conversation(conversation_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations AS c
    WHERE c.id = conversation_uuid
      AND (
        c.client_id = auth.uid()
        OR (
          c.coach_id = auth.uid()
          AND public.can_coach_client(c.client_id)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_conversation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_access_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_send_to_conversation(conversation_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.conversations AS c
      WHERE c.id = conversation_uuid
        AND c.status = 'active'
        AND (
          (
            c.client_id = auth.uid()
            AND public.is_assigned_coach(c.coach_id, c.client_id)
          )
          OR (
            c.coach_id = auth.uid()
            AND public.can_coach_client(c.client_id)
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_send_to_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_send_to_conversation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_send_to_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  client_uuid uuid,
  coach_uuid uuid
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_row public.conversations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF client_uuid = coach_uuid THEN
    RAISE EXCEPTION 'Conversation participants must be different';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = client_uuid AND role = 'client'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Invalid client';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = coach_uuid AND role = 'coach'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Invalid coach';
  END IF;

  IF NOT (
    (auth.uid() = client_uuid AND public.is_assigned_coach(coach_uuid, client_uuid))
    OR
    (auth.uid() = coach_uuid AND public.can_coach_client(client_uuid))
  ) THEN
    RAISE EXCEPTION 'Conversation access denied';
  END IF;

  INSERT INTO public.conversations (client_id, coach_id)
  VALUES (client_uuid, coach_uuid)
  ON CONFLICT (client_id, coach_id) DO UPDATE
  SET updated_at = public.conversations.updated_at
  RETURNING * INTO conversation_row;

  RETURN conversation_row;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(conversation_uuid uuid)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_row public.conversations;
BEGIN
  SELECT *
  INTO conversation_row
  FROM public.conversations
  WHERE id = conversation_uuid;

  IF conversation_row.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF NOT public.can_access_conversation(conversation_uuid) THEN
    RAISE EXCEPTION 'Conversation access denied';
  END IF;

  IF auth.uid() = conversation_row.client_id THEN
    UPDATE public.conversations
    SET client_last_read_at = timezone('utc'::text, now())
    WHERE id = conversation_uuid
    RETURNING * INTO conversation_row;
  ELSIF auth.uid() = conversation_row.coach_id THEN
    UPDATE public.conversations
    SET coach_last_read_at = timezone('utc'::text, now())
    WHERE id = conversation_uuid
    RETURNING * INTO conversation_row;
  ELSE
    RAISE EXCEPTION 'Conversation access denied';
  END IF;

  RETURN conversation_row;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_message_participants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  conversation_row public.conversations;
BEGIN
  SELECT *
  INTO conversation_row
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF conversation_row.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at = timezone('utc'::text, now());
  END IF;

  IF NEW.sender_id NOT IN (conversation_row.client_id, conversation_row.coach_id) THEN
    RAISE EXCEPTION 'Sender is not a conversation participant';
  END IF;

  IF NEW.receiver_id NOT IN (conversation_row.client_id, conversation_row.coach_id)
    OR NEW.receiver_id = NEW.sender_id THEN
    RAISE EXCEPTION 'Receiver is not the other conversation participant';
  END IF;

  IF NEW.attachment_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.message_attachments AS ma
    WHERE ma.id = NEW.attachment_id
      AND ma.conversation_id = NEW.conversation_id
      AND ma.uploader_id = NEW.sender_id
      AND ma.client_id = conversation_row.client_id
  ) THEN
    RAISE EXCEPTION 'Attachment does not belong to this message';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_after_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.message_type = 'video_feedback' THEN 'Video feedback'
      ELSE LEFT(COALESCE(NEW.body, ''), 140)
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_conversation_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_conversation_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.validate_message_participants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_message_participants() FROM anon;
REVOKE ALL ON FUNCTION public.update_conversation_after_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_conversation_after_message() FROM anon;

DROP TRIGGER IF EXISTS touch_conversation_updated_at
  ON public.conversations;
CREATE TRIGGER touch_conversation_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_updated_at();

DROP TRIGGER IF EXISTS validate_message_participants
  ON public.messages;
CREATE TRIGGER validate_message_participants
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_participants();

DROP TRIGGER IF EXISTS update_conversation_after_message
  ON public.messages;
CREATE TRIGGER update_conversation_after_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_after_message();

DROP POLICY IF EXISTS "Clients can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Coaches can view own authorized conversations" ON public.conversations;
DROP POLICY IF EXISTS "Clients can create assigned coach conversations" ON public.conversations;
DROP POLICY IF EXISTS "Coaches can create authorized client conversations" ON public.conversations;

CREATE POLICY "Clients can view own conversations"
  ON public.conversations FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view own authorized conversations"
  ON public.conversations FOR SELECT
  USING (coach_id = auth.uid() AND public.can_coach_client(client_id));

CREATE POLICY "Clients can create assigned coach conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    AND public.is_assigned_coach(coach_id, client_id)
  );

CREATE POLICY "Coaches can create authorized client conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    coach_id = auth.uid()
    AND public.can_coach_client(client_id)
  );

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;

CREATE POLICY "Conversation participants can read messages"
  ON public.messages FOR SELECT
  USING (public.can_access_conversation(conversation_id));

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.can_send_to_conversation(conversation_id)
    AND EXISTS (
      SELECT 1
      FROM public.conversations AS c
      WHERE c.id = conversation_id
        AND receiver_id IN (c.client_id, c.coach_id)
        AND receiver_id <> sender_id
    )
    AND (
      attachment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.message_attachments AS ma
        WHERE ma.id = attachment_id
          AND ma.conversation_id = messages.conversation_id
          AND ma.uploader_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Conversation participants can read message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Conversation participants can create message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Uploaders can delete unattached message attachments" ON public.message_attachments;

CREATE POLICY "Conversation participants can read message attachments"
  ON public.message_attachments FOR SELECT
  USING (public.can_access_conversation(conversation_id));

CREATE POLICY "Conversation participants can create message attachments"
  ON public.message_attachments FOR INSERT
  WITH CHECK (
    uploader_id = auth.uid()
    AND attachment_type = 'video_feedback'
    AND EXISTS (
      SELECT 1
      FROM public.conversations AS c
      WHERE c.id = conversation_id
        AND c.client_id = message_attachments.client_id
        AND public.can_send_to_conversation(c.id)
    )
  );

CREATE POLICY "Uploaders can delete unattached message attachments"
  ON public.message_attachments FOR DELETE
  USING (
    uploader_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1
      FROM public.messages AS m
      WHERE m.attachment_id = message_attachments.id
    )
  );

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'message-videos',
  'message-videos',
  false,
  104857600,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Conversation participants can upload message video objects" ON storage.objects;
DROP POLICY IF EXISTS "Conversation participants can read message video objects" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders can delete own message video objects" ON storage.objects;

CREATE POLICY "Conversation participants can upload message video objects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-videos'
    AND (storage.foldername(name))[3] = auth.uid()::text
    AND CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (storage.foldername(name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.can_send_to_conversation(((storage.foldername(name))[2])::uuid)
      ELSE false
    END
    AND EXISTS (
      SELECT 1
      FROM public.conversations AS c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.client_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Conversation participants can read message video objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-videos'
    AND EXISTS (
      SELECT 1
      FROM public.message_attachments AS ma
      WHERE ma.storage_path = storage.objects.name
        AND public.can_access_conversation(ma.conversation_id)
    )
  );

CREATE POLICY "Uploaders can delete own message video objects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-videos'
    AND (storage.foldername(name))[3] = auth.uid()::text
    AND CASE
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (storage.foldername(name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.can_access_conversation(((storage.foldername(name))[2])::uuid)
      ELSE false
    END
    AND NOT EXISTS (
      SELECT 1
      FROM public.message_attachments AS ma
      JOIN public.messages AS m ON m.attachment_id = ma.id
      WHERE ma.storage_path = storage.objects.name
    )
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;
