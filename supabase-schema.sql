-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'coach');
CREATE TYPE assignment_status AS ENUM ('pending', 'active', 'archived');

-- Profiles Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Coach-Client Assignments
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
CREATE INDEX idx_coach_client_assignments_coach_id ON coach_client_assignments (coach_id);
CREATE INDEX idx_coach_client_assignments_client_id ON coach_client_assignments (client_id);
CREATE INDEX idx_coach_client_assignments_status ON coach_client_assignments (status);
CREATE INDEX idx_coach_client_assignments_active_lookup
  ON coach_client_assignments (coach_id, client_id) WHERE status = 'active';

-- Assignment/profile helper functions must exist before policies call them.
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

CREATE POLICY "Coaches can view assigned client profiles" ON profiles FOR SELECT USING (
    public.get_auth_role() = 'coach'::public.user_role
    AND public.is_assigned_coach(auth.uid(), id)
);
CREATE POLICY "Clients can view assigned coach profiles" ON profiles FOR SELECT USING (
    public.get_auth_role() = 'client'::public.user_role
    AND EXISTS (
        SELECT 1 FROM public.coach_client_assignments
        WHERE client_id = auth.uid()
          AND coach_id = profiles.id
          AND status = 'active'::public.assignment_status
    )
);

ALTER TABLE coach_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own assignments" ON coach_client_assignments FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Clients can view own assignments" ON coach_client_assignments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Coaches can create pending assignments for themselves" ON coach_client_assignments FOR INSERT WITH CHECK (
    auth.uid() = coach_id
    AND status = 'pending'::public.assignment_status
    AND public.get_auth_role() = 'coach'::public.user_role
);
CREATE POLICY "Coaches can update own assignments" ON coach_client_assignments FOR UPDATE USING (
    auth.uid() = coach_id
) WITH CHECK (
    auth.uid() = coach_id
    AND status <> 'active'::public.assignment_status
);
CREATE POLICY "Clients can update own assignments" ON coach_client_assignments FOR UPDATE USING (
    auth.uid() = client_id
    AND status = 'pending'::public.assignment_status
) WITH CHECK (
    auth.uid() = client_id
    AND status IN ('active'::public.assignment_status, 'archived'::public.assignment_status)
    AND public.get_auth_role() = 'client'::public.user_role
);

-- Medical Questionnaire
CREATE TABLE medical_questionnaire (
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE medical_questionnaire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own questionnaire" ON medical_questionnaire FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client questionnaire" ON medical_questionnaire FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Goals
CREATE TABLE goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    target TEXT NOT NULL,
    deadline DATE
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own goals" ON goals FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client goals" ON goals FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Measurements
CREATE TABLE measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    weight NUMERIC,
    body_fat NUMERIC,
    chest NUMERIC,
    waist NUMERIC,
    date DATE DEFAULT CURRENT_DATE
);
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own measurements" ON measurements FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client measurements" ON measurements FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Progress Photos
CREATE TABLE progress_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE
);
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own photos" ON progress_photos FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client photos" ON progress_photos FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Workouts
CREATE TABLE workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    assigned_date DATE
);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own workouts" ON workouts FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Coaches can manage workouts for assigned clients" ON workouts FOR ALL
  USING (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id))
  WITH CHECK (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

-- Workout Exercises
CREATE TABLE workout_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    rest_seconds INTEGER NOT NULL,
    video_url TEXT,
    order_index INTEGER NOT NULL,
    notes TEXT
);
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view assigned exercises" ON workout_exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.client_id = auth.uid())
);
CREATE POLICY "Coaches can manage exercises for assigned client workouts" ON workout_exercises FOR ALL USING (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND w.coach_id = auth.uid()
          AND is_assigned_coach(auth.uid(), w.client_id)
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND w.coach_id = auth.uid()
          AND is_assigned_coach(auth.uid(), w.client_id)
    )
);

-- Workout Logs
CREATE TABLE workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight_used NUMERIC NOT NULL,
    reps_completed INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own logs" ON workout_logs FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client logs" ON workout_logs FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Completed Workouts
CREATE TABLE completed_workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    duration_minutes INTEGER,
    date_completed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own completions" ON completed_workouts FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client completions" ON completed_workouts FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Meal Plans
CREATE TABLE meal_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE
);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Coaches can manage meal plans for assigned clients" ON meal_plans FOR ALL
  USING (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id))
  WITH CHECK (auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id));

-- Meal Plan Meals
CREATE TABLE meal_plan_meals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC NOT NULL DEFAULT 0,
    total_protein_g NUMERIC NOT NULL DEFAULT 0,
    total_carbs_g NUMERIC NOT NULL DEFAULT 0,
    total_fat_g NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own meals" ON meal_plan_meals FOR SELECT USING (
    EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_meals.meal_plan_id AND meal_plans.client_id = auth.uid())
);
CREATE POLICY "Coaches can manage meals for assigned client plans" ON meal_plan_meals FOR ALL USING (
    EXISTS (
        SELECT 1 FROM meal_plans mp
        WHERE mp.id = meal_plan_meals.meal_plan_id
          AND mp.coach_id = auth.uid()
          AND is_assigned_coach(auth.uid(), mp.client_id)
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM meal_plans mp
        WHERE mp.id = meal_plan_meals.meal_plan_id
          AND mp.coach_id = auth.uid()
          AND is_assigned_coach(auth.uid(), mp.client_id)
    )
);

-- Grocery Lists
CREATE TABLE grocery_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own grocery lists" ON grocery_lists FOR ALL USING (auth.uid() = client_id);

-- Water Tracker
CREATE TABLE water_tracker (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    cups_consumed INTEGER DEFAULT 0,
    daily_goal_cups INTEGER DEFAULT 8,
    UNIQUE(client_id, date)
);
ALTER TABLE water_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own water tracker" ON water_tracker FOR ALL USING (auth.uid() = client_id);

-- Supplements
CREATE TABLE supplements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    supplement_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time_of_day JSONB NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own supplements" ON supplements FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client supplements" ON supplements FOR SELECT USING (
    is_assigned_coach(auth.uid(), client_id)
);

-- Messages
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    video_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
        is_assigned_coach(receiver_id, auth.uid())
        OR
        is_assigned_coach(auth.uid(), receiver_id)
    )
);

-- Notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Reports
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own reports" ON reports FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view assigned client reports" ON reports FOR SELECT USING (
    auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id)
);
CREATE POLICY "Coaches can insert reports for assigned clients" ON reports FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND is_assigned_coach(auth.uid(), client_id)
);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'client'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Role changes require administrator privileges';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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

-- Triggers (auth schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers (public schema)
DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

DROP TRIGGER IF EXISTS validate_assignment_roles ON coach_client_assignments;
CREATE TRIGGER validate_assignment_roles
  BEFORE INSERT OR UPDATE ON coach_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coach_client_assignment();
