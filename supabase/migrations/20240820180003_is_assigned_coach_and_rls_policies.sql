-- Phase 1: Assignment helper for RLS policies
CREATE OR REPLACE FUNCTION public.is_assigned_coach(coach_uuid uuid, client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM coach_client_assignments
    WHERE coach_id = coach_uuid
      AND client_id = client_uuid
      AND status = 'active'::assignment_status
  );
$$;

-- Profiles: remove public visibility, scope to self + assignments
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view assigned client profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles coach
      WHERE coach.id = auth.uid() AND coach.role = 'coach'::user_role
    )
    AND is_assigned_coach(auth.uid(), id)
  );

CREATE POLICY "Clients can view assigned coach profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles client
      WHERE client.id = auth.uid() AND client.role = 'client'::user_role
    )
    AND EXISTS (
      SELECT 1 FROM coach_client_assignments
      WHERE client_id = auth.uid()
        AND coach_id = profiles.id
        AND status = 'active'::assignment_status
    )
  );

-- Medical questionnaire
DROP POLICY IF EXISTS "Coaches can view client questionnaire" ON medical_questionnaire;
CREATE POLICY "Coaches can view assigned client questionnaire"
  ON medical_questionnaire FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Goals
DROP POLICY IF EXISTS "Coaches can view client goals" ON goals;
CREATE POLICY "Coaches can view assigned client goals"
  ON goals FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Measurements
DROP POLICY IF EXISTS "Coaches can view client measurements" ON measurements;
CREATE POLICY "Coaches can view assigned client measurements"
  ON measurements FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Progress photos
DROP POLICY IF EXISTS "Coaches can view client photos" ON progress_photos;
CREATE POLICY "Coaches can view assigned client photos"
  ON progress_photos FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Workouts
DROP POLICY IF EXISTS "Coaches can manage workouts they created" ON workouts;
CREATE POLICY "Coaches can manage workouts for assigned clients"
  ON workouts FOR ALL
  USING (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id))
  WITH CHECK (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

-- Workout exercises (via parent workout)
DROP POLICY IF EXISTS "Coaches can manage exercises for their workouts" ON workout_exercises;
CREATE POLICY "Coaches can manage exercises for assigned client workouts"
  ON workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND is_assigned_coach(auth.uid(), w.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.coach_id = auth.uid()
        AND is_assigned_coach(auth.uid(), w.client_id)
    )
  );

-- Workout logs
DROP POLICY IF EXISTS "Coaches can view logs" ON workout_logs;
CREATE POLICY "Coaches can view assigned client logs"
  ON workout_logs FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Completed workouts
DROP POLICY IF EXISTS "Coaches can view completions" ON completed_workouts;
CREATE POLICY "Coaches can view assigned client completions"
  ON completed_workouts FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Meal plans
DROP POLICY IF EXISTS "Coaches can manage meal plans they created" ON meal_plans;
CREATE POLICY "Coaches can manage meal plans for assigned clients"
  ON meal_plans FOR ALL
  USING (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id))
  WITH CHECK (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

-- Meal plan meals (via parent meal plan)
DROP POLICY IF EXISTS "Coaches can manage meals for their plans" ON meal_plan_meals;
CREATE POLICY "Coaches can manage meals for assigned client plans"
  ON meal_plan_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND is_assigned_coach(auth.uid(), mp.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND is_assigned_coach(auth.uid(), mp.client_id)
    )
  );

-- Supplements: coaches SELECT only for assigned clients
DROP POLICY IF EXISTS "Coaches can view/manage supplements" ON supplements;
CREATE POLICY "Coaches can view assigned client supplements"
  ON supplements FOR SELECT
  USING (is_assigned_coach(auth.uid(), client_id));

-- Reports
DROP POLICY IF EXISTS "Users can view relevant reports" ON reports;
DROP POLICY IF EXISTS "Coaches can insert reports" ON reports;

CREATE POLICY "Clients can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can view assigned client reports"
  ON reports FOR SELECT
  USING (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

CREATE POLICY "Coaches can insert reports for assigned clients"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

-- Messages: remove insecure FOR ALL policy, restrict to SELECT and INSERT only
DROP POLICY IF EXISTS "Users can manage messages" ON messages;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      is_assigned_coach(receiver_id, auth.uid())
      OR
      is_assigned_coach(auth.uid(), receiver_id)
    )
  );


