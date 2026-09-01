-- Allow assigned active coaches to record new client measurements.
-- This preserves measurement history and keeps unassigned coaches denied by RLS.

CREATE POLICY "Assigned coaches can insert client measurements"
  ON public.measurements FOR INSERT
  WITH CHECK (
    public.get_auth_role() = 'coach'::public.user_role
    AND public.is_assigned_coach(auth.uid(), client_id)
  );
