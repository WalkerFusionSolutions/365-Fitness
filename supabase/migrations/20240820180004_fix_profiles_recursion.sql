-- Create get_auth_role() to prevent profiles RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_assigned_coach(coach_uuid uuid, client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_client_assignments AS cca
    WHERE cca.coach_id = coach_uuid
      AND cca.client_id = client_uuid
      AND cca.status = 'active'::public.assignment_status
  );
$$;

REVOKE ALL ON FUNCTION public.is_assigned_coach(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_assigned_coach(uuid, uuid) TO authenticated;

-- Harden assignment validation while this migration is being applied.
-- Assignment pairs are security boundaries and should not be rewritten after insert.
CREATE OR REPLACE FUNCTION public.validate_coach_client_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_role public.user_role;
  client_role public.user_role;
BEGIN
  IF TG_OP = 'UPDATE'
    AND (
      OLD.coach_id IS DISTINCT FROM NEW.coach_id
      OR OLD.client_id IS DISTINCT FROM NEW.client_id
    )
  THEN
    RAISE EXCEPTION 'coach_id and client_id cannot be changed after assignment creation';
  END IF;

  SELECT p.role INTO coach_role
  FROM public.profiles AS p
  WHERE p.id = NEW.coach_id;

  SELECT p.role INTO client_role
  FROM public.profiles AS p
  WHERE p.id = NEW.client_id;

  IF coach_role IS DISTINCT FROM 'coach'::public.user_role THEN
    RAISE EXCEPTION 'coach_id must reference a profile with role coach';
  END IF;

  IF client_role IS DISTINCT FROM 'client'::public.user_role THEN
    RAISE EXCEPTION 'client_id must reference a profile with role client';
  END IF;

  IF NEW.status = 'active'::public.assignment_status AND NEW.assigned_at IS NULL THEN
    NEW.assigned_at := timezone('utc'::text, now());
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coach_client_assignment() FROM PUBLIC;

-- Drop recursive profiles RLS policies
DROP POLICY IF EXISTS "Clients can view assigned coach profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view assigned client profiles" ON public.profiles;

-- Recreate profiles RLS policies using get_auth_role()
CREATE POLICY "Clients can view assigned coach profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_auth_role() = 'client'::public.user_role
    AND EXISTS (
      SELECT 1
      FROM public.coach_client_assignments
      WHERE client_id = auth.uid()
        AND coach_id = profiles.id
        AND status = 'active'::public.assignment_status
    )
  );

CREATE POLICY "Coaches can view assigned client profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_auth_role() = 'coach'::public.user_role
    AND public.is_assigned_coach(auth.uid(), profiles.id)
  );

-- Drop coach_client_assignments policies that query profiles directly
DROP POLICY IF EXISTS "Coaches can create pending assignments for themselves" ON public.coach_client_assignments;
DROP POLICY IF EXISTS "Clients can create assignments for themselves" ON public.coach_client_assignments;
DROP POLICY IF EXISTS "Clients can update own assignments" ON public.coach_client_assignments;

-- Recreate coach_client_assignments policies using get_auth_role().
-- Coaches can request an assignment, but cannot self-activate it.
CREATE POLICY "Coaches can create pending assignments for themselves"
  ON public.coach_client_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
    AND status = 'pending'::public.assignment_status
    AND public.get_auth_role() = 'coach'::public.user_role
  );

-- Clients approve or archive pending coach requests. Direct client-created rows
-- are intentionally disabled until a requested_by workflow exists.
CREATE POLICY "Clients can update own assignments"
  ON public.coach_client_assignments FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status = 'pending'::public.assignment_status
  )
  WITH CHECK (
    auth.uid() = client_id
    AND status IN ('active'::public.assignment_status, 'archived'::public.assignment_status)
    AND public.get_auth_role() = 'client'::public.user_role
  );
