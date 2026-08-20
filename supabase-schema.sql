-- Enum for Role
CREATE TYPE user_role AS ENUM ('client', 'coach');

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
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Medical Questionnaire
CREATE TABLE medical_questionnaire (
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE medical_questionnaire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own questionnaire" ON medical_questionnaire FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view client questionnaire" ON medical_questionnaire FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
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
CREATE POLICY "Coaches can view client goals" ON goals FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

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
CREATE POLICY "Coaches can view client measurements" ON measurements FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

-- Progress Photos
CREATE TABLE progress_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE
);
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own photos" ON progress_photos FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view client photos" ON progress_photos FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

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
CREATE POLICY "Coaches can manage workouts they created" ON workouts FOR ALL USING (auth.uid() = coach_id);

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
CREATE POLICY "Coaches can manage exercises for their workouts" ON workout_exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.coach_id = auth.uid())
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
CREATE POLICY "Coaches can view logs" ON workout_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

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
CREATE POLICY "Coaches can view completions" ON completed_workouts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

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
CREATE POLICY "Coaches can manage meal plans they created" ON meal_plans FOR ALL USING (auth.uid() = coach_id);

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
CREATE POLICY "Coaches can manage meals for their plans" ON meal_plan_meals FOR ALL USING (
    EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_meals.meal_plan_id AND meal_plans.coach_id = auth.uid())
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
CREATE POLICY "Coaches can view/manage supplements" ON supplements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));

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
CREATE POLICY "Users can manage messages" ON messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

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
CREATE POLICY "Users can view relevant reports" ON reports FOR SELECT USING (auth.uid() = client_id OR auth.uid() = coach_id);
CREATE POLICY "Coaches can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = coach_id);
