-- Current release owner/head-coach messaging model.
-- Keeps multi-coach assignment architecture intact while allowing clients to
-- start/reply to the privileged owner coach without a direct assignment.

CREATE OR REPLACE FUNCTION public.coach_can_access_client(
  coach_uuid uuid,
  client_uuid uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS coach_profile
    JOIN public.profiles AS client_profile
      ON client_profile.id = client_uuid
    WHERE coach_profile.id = coach_uuid
      AND coach_profile.role = 'coach'::public.user_role
      AND client_profile.role = 'client'::public.user_role
      AND (
        EXISTS (
          SELECT 1
          FROM public.coach_client_assignments AS cca
          WHERE cca.coach_id = coach_uuid
            AND cca.client_id = client_uuid
            AND cca.status = 'active'::public.assignment_status
        )
        OR EXISTS (
          SELECT 1
          FROM public.staff_permissions AS sp
          WHERE sp.user_id = coach_uuid
            AND sp.can_view_all_clients = true
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.coach_can_access_client(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.coach_can_access_client(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.coach_can_access_client(uuid, uuid) TO authenticated;

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
        AND auth.uid() IN (c.client_id, c.coach_id)
        AND public.coach_can_access_client(c.coach_id, c.client_id)
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

  IF NOT public.coach_can_access_client(coach_uuid, client_uuid) THEN
    RAISE EXCEPTION 'Conversation access denied';
  END IF;

  IF auth.uid() NOT IN (client_uuid, coach_uuid) THEN
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

CREATE OR REPLACE FUNCTION public.get_primary_coach()
RETURNS TABLE (
  id uuid,
  role public.user_role,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.role,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles AS p
  JOIN public.staff_permissions AS sp
    ON sp.user_id = p.id
  WHERE auth.uid() IS NOT NULL
    AND p.role = 'coach'::public.user_role
    AND sp.can_view_all_clients = true
  ORDER BY p.created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_primary_coach() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_primary_coach() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_primary_coach() TO authenticated;
