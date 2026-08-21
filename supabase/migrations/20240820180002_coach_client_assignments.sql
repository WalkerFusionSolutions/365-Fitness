-- Phase 1: Coach-client assignment tracking
CREATE TYPE assignment_status AS ENUM ('pending', 'active', 'archived');

CREATE TABLE coach_client_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (coach_id, client_id),
    CHECK (coach_id <> client_id)
);

CREATE INDEX idx_coach_client_assignments_coach_id
  ON coach_client_assignments (coach_id);

CREATE INDEX idx_coach_client_assignments_client_id
  ON coach_client_assignments (client_id);

CREATE INDEX idx_coach_client_assignments_status
  ON coach_client_assignments (status);

CREATE INDEX idx_coach_client_assignments_active_lookup
  ON coach_client_assignments (coach_id, client_id)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.validate_coach_client_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_role user_role;
  client_role user_role;
BEGIN
  SELECT role INTO coach_role FROM profiles WHERE id = NEW.coach_id;
  SELECT role INTO client_role FROM profiles WHERE id = NEW.client_id;

  IF coach_role IS DISTINCT FROM 'coach'::user_role THEN
    RAISE EXCEPTION 'coach_id must reference a profile with role coach';
  END IF;

  IF client_role IS DISTINCT FROM 'client'::user_role THEN
    RAISE EXCEPTION 'client_id must reference a profile with role client';
  END IF;

  IF NEW.status = 'active'::assignment_status AND NEW.assigned_at IS NULL THEN
    NEW.assigned_at := timezone('utc'::text, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_assignment_roles ON coach_client_assignments;
CREATE TRIGGER validate_assignment_roles
  BEFORE INSERT OR UPDATE ON coach_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coach_client_assignment();

ALTER TABLE coach_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own assignments"
  ON coach_client_assignments FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view own assignments"
  ON coach_client_assignments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can create pending assignments for themselves"
  ON coach_client_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
    AND status = 'pending'::assignment_status
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'::user_role
    )
  );

CREATE POLICY "Clients can create assignments for themselves"
  ON coach_client_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'client'::user_role
    )
  );

CREATE POLICY "Coaches can update own assignments"
  ON coach_client_assignments FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (
    auth.uid() = coach_id
    AND status <> 'active'::assignment_status
  );

CREATE POLICY "Clients can update own assignments"
  ON coach_client_assignments FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
  );
