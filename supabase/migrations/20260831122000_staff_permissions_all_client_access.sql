-- Phase 2.5 development/testing privileges.
-- This preserves the production model:
-- clients see their own data, normal coaches see active assigned clients,
-- and explicitly privileged coach accounts can see/manage all clients.

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_view_all_clients boolean NOT NULL DEFAULT false,
  can_manage_all_client_measurements boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.staff_permissions TO authenticated;

CREATE POLICY "Users can view own staff permissions"
  ON public.staff_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.can_view_all_clients()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'coach'::public.user_role
    AND EXISTS (
      SELECT 1
      FROM public.staff_permissions AS sp
      WHERE sp.user_id = auth.uid()
        AND sp.can_view_all_clients = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_all_clients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_all_clients() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_all_client_measurements()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'coach'::public.user_role
    AND EXISTS (
      SELECT 1
      FROM public.staff_permissions AS sp
      WHERE sp.user_id = auth.uid()
        AND sp.can_manage_all_client_measurements = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_all_client_measurements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_all_client_measurements() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_client_profile(client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = client_uuid
      AND p.role = 'client'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_client_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_client_profile(uuid) TO authenticated;

CREATE POLICY "Privileged coaches can view all client profiles"
  ON public.profiles FOR SELECT
  USING (
    role = 'client'::public.user_role
    AND public.can_view_all_clients()
  );

CREATE POLICY "Privileged coaches can view all client questionnaires"
  ON public.medical_questionnaire FOR SELECT
  USING (
    public.can_view_all_clients()
    AND public.is_client_profile(client_id)
  );

CREATE POLICY "Privileged coaches can view all client goals"
  ON public.goals FOR SELECT
  USING (
    public.can_view_all_clients()
    AND public.is_client_profile(client_id)
  );

CREATE POLICY "Privileged coaches can view all client measurements"
  ON public.measurements FOR SELECT
  USING (
    public.can_view_all_clients()
    AND public.is_client_profile(client_id)
  );

CREATE POLICY "Privileged coaches can insert all client measurements"
  ON public.measurements FOR INSERT
  WITH CHECK (
    public.can_manage_all_client_measurements()
    AND public.is_client_profile(client_id)
  );
