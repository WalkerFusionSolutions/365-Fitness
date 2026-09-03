-- Phase 4 Nutrition System
-- Builds on Phase 3 authorization helpers. Do not apply before
-- 20260903120000_phase3_workouts.sql.

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS target_calories numeric,
  ADD COLUMN IF NOT EXISTS target_protein_g numeric,
  ADD COLUMN IF NOT EXISTS target_carbs_g numeric,
  ADD COLUMN IF NOT EXISTS target_fat_g numeric,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.meal_plans
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.meal_plans
  ADD CONSTRAINT meal_plans_status_check
    CHECK (status IN ('draft', 'assigned', 'archived')) NOT VALID,
  ADD CONSTRAINT meal_plans_draft_unassigned_check
    CHECK (status <> 'draft' OR client_id IS NULL) NOT VALID,
  ADD CONSTRAINT meal_plans_assigned_client_check
    CHECK (status <> 'assigned' OR client_id IS NOT NULL) NOT VALID,
  ADD CONSTRAINT meal_plans_target_calories_nonnegative
    CHECK (target_calories IS NULL OR target_calories >= 0) NOT VALID,
  ADD CONSTRAINT meal_plans_target_protein_nonnegative
    CHECK (target_protein_g IS NULL OR target_protein_g >= 0) NOT VALID,
  ADD CONSTRAINT meal_plans_target_carbs_nonnegative
    CHECK (target_carbs_g IS NULL OR target_carbs_g >= 0) NOT VALID,
  ADD CONSTRAINT meal_plans_target_fat_nonnegative
    CHECK (target_fat_g IS NULL OR target_fat_g >= 0) NOT VALID;

ALTER TABLE public.meal_plan_meals
  ADD COLUMN IF NOT EXISTS meal_label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 1;

ALTER TABLE public.meal_plan_meals
  ADD CONSTRAINT meal_plan_meals_day_check CHECK (day BETWEEN 1 AND 7) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_sort_order_positive CHECK (sort_order > 0) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_calories_nonnegative CHECK (total_calories >= 0) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_protein_nonnegative CHECK (total_protein_g >= 0) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_carbs_nonnegative CHECK (total_carbs_g >= 0) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_fat_nonnegative CHECK (total_fat_g >= 0) NOT VALID,
  ADD CONSTRAINT meal_plan_meals_food_items_array CHECK (jsonb_typeof(food_items) = 'array') NOT VALID;

ALTER TABLE public.grocery_lists
  ADD COLUMN IF NOT EXISTS meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Grocery List',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.grocery_lists
  ADD CONSTRAINT grocery_lists_items_array CHECK (jsonb_typeof(items) = 'array') NOT VALID;

ALTER TABLE public.water_tracker
  ADD CONSTRAINT water_tracker_cups_nonnegative CHECK (cups_consumed IS NULL OR cups_consumed >= 0) NOT VALID,
  ADD CONSTRAINT water_tracker_goal_positive CHECK (daily_goal_cups IS NULL OR daily_goal_cups > 0) NOT VALID;

ALTER TABLE public.supplements
  ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.supplements
  ADD CONSTRAINT supplements_time_of_day_array CHECK (jsonb_typeof(time_of_day) = 'array') NOT VALID;

CREATE INDEX IF NOT EXISTS idx_meal_plans_coach_status
  ON public.meal_plans (coach_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_meal_plans_client_status
  ON public.meal_plans (client_id, status, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_meal_plan_meals_plan_order
  ON public.meal_plan_meals (meal_plan_id, day, sort_order);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_client_plan
  ON public.grocery_lists (client_id, meal_plan_id, generated_date DESC);

CREATE INDEX IF NOT EXISTS idx_water_tracker_client_date_desc
  ON public.water_tracker (client_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_supplements_client_active
  ON public.supplements (client_id, is_active);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.prevent_immutable_meal_plan_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' OR OLD.client_id IS NOT NULL THEN
      RAISE EXCEPTION 'Only unassigned draft meal plans can be deleted.';
    END IF;

    RETURN OLD;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'draft' THEN
    IF NEW.client_id IS NOT NULL THEN
      RAISE EXCEPTION 'Draft meal plans must remain unassigned.';
    END IF;

    NEW.assigned_at = NULL;
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'assigned' THEN
    IF OLD.name IS DISTINCT FROM NEW.name
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.instructions IS DISTINCT FROM NEW.instructions
      OR OLD.target_calories IS DISTINCT FROM NEW.target_calories
      OR OLD.target_protein_g IS DISTINCT FROM NEW.target_protein_g
      OR OLD.target_carbs_g IS DISTINCT FROM NEW.target_carbs_g
      OR OLD.target_fat_g IS DISTINCT FROM NEW.target_fat_g
      OR OLD.start_date IS DISTINCT FROM NEW.start_date
      OR OLD.end_date IS DISTINCT FROM NEW.end_date
      OR OLD.coach_id IS DISTINCT FROM NEW.coach_id THEN
      RAISE EXCEPTION 'Save prescription changes before assigning the meal plan.';
    END IF;

    IF OLD.client_id IS NOT NULL THEN
      RAISE EXCEPTION 'Only unassigned drafts can be assigned.';
    END IF;

    IF NEW.client_id IS NULL THEN
      RAISE EXCEPTION 'Assigned meal plans require a client.';
    END IF;

    NEW.assigned_at = COALESCE(NEW.assigned_at, timezone('utc'::text, now()));
    RETURN NEW;
  END IF;

  IF OLD.status = 'assigned' AND NEW.status = 'archived' THEN
    IF OLD.name IS DISTINCT FROM NEW.name
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.instructions IS DISTINCT FROM NEW.instructions
      OR OLD.target_calories IS DISTINCT FROM NEW.target_calories
      OR OLD.target_protein_g IS DISTINCT FROM NEW.target_protein_g
      OR OLD.target_carbs_g IS DISTINCT FROM NEW.target_carbs_g
      OR OLD.target_fat_g IS DISTINCT FROM NEW.target_fat_g
      OR OLD.start_date IS DISTINCT FROM NEW.start_date
      OR OLD.end_date IS DISTINCT FROM NEW.end_date
      OR OLD.coach_id IS DISTINCT FROM NEW.coach_id
      OR OLD.client_id IS DISTINCT FROM NEW.client_id
      OR OLD.assigned_at IS DISTINCT FROM NEW.assigned_at THEN
      RAISE EXCEPTION 'Assigned meal plan prescriptions are immutable.';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Illegal meal plan status transition from % to %.', OLD.status, NEW.status;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_immutable_meal_plan_mutation() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.prevent_locked_meal_plan_meal_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_status text;
  target_meal_plan_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_meal_plan_id = NEW.meal_plan_id;
  ELSE
    target_meal_plan_id = OLD.meal_plan_id;
  END IF;

  SELECT status INTO parent_status
  FROM public.meal_plans
  WHERE id = target_meal_plan_id;

  IF parent_status IS NULL THEN
    RAISE EXCEPTION 'Meal plan not found.';
  END IF;

  IF parent_status <> 'draft' THEN
    RAISE EXCEPTION 'Assigned and archived meal plan meals are immutable.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_locked_meal_plan_meal_mutation() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.grocery_meal_plan_matches_client(
  grocery_client_id uuid,
  grocery_meal_plan_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    grocery_meal_plan_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.meal_plans mp
      WHERE mp.id = grocery_meal_plan_id
        AND mp.client_id = grocery_client_id
        AND mp.status = 'assigned'
    );
$$;

REVOKE ALL ON FUNCTION public.grocery_meal_plan_matches_client(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grocery_meal_plan_matches_client(uuid, uuid) TO authenticated;

DROP TRIGGER IF EXISTS set_meal_plans_updated_at ON public.meal_plans;
CREATE TRIGGER set_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS prevent_immutable_meal_plan_mutation ON public.meal_plans;
CREATE TRIGGER prevent_immutable_meal_plan_mutation
  BEFORE UPDATE OR DELETE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_meal_plan_mutation();

DROP TRIGGER IF EXISTS prevent_locked_meal_plan_meal_mutation ON public.meal_plan_meals;
CREATE TRIGGER prevent_locked_meal_plan_meal_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.meal_plan_meals
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_meal_plan_meal_mutation();

DROP TRIGGER IF EXISTS set_grocery_lists_updated_at ON public.grocery_lists;
CREATE TRIGGER set_grocery_lists_updated_at
  BEFORE UPDATE ON public.grocery_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_supplements_updated_at ON public.supplements;
CREATE TRIGGER set_supplements_updated_at
  BEFORE UPDATE ON public.supplements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Clients can view own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Coaches can manage meal plans for assigned clients" ON public.meal_plans;
DROP POLICY IF EXISTS "Clients can view own meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Coaches can manage meals for assigned client plans" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Clients can manage own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Clients can manage own water tracker" ON public.water_tracker;
DROP POLICY IF EXISTS "Clients can manage own supplements" ON public.supplements;
DROP POLICY IF EXISTS "Coaches can view assigned client supplements" ON public.supplements;
DROP POLICY IF EXISTS "Clients can view assigned meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Coaches can view manageable meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Coaches can create meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Coaches can update manageable meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Coaches can delete draft meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Clients can view assigned meal plan meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Coaches can view manageable meal plan meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Coaches can create manageable meal plan meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Coaches can update manageable meal plan meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Coaches can delete manageable meal plan meals" ON public.meal_plan_meals;
DROP POLICY IF EXISTS "Clients can view own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Clients can update own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Clients can insert own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Coaches can manage assigned client grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Clients can view own water tracker" ON public.water_tracker;
DROP POLICY IF EXISTS "Clients can insert own water tracker" ON public.water_tracker;
DROP POLICY IF EXISTS "Clients can update own water tracker" ON public.water_tracker;
DROP POLICY IF EXISTS "Coaches can view assigned client water tracker" ON public.water_tracker;
DROP POLICY IF EXISTS "Clients can view own supplements" ON public.supplements;
DROP POLICY IF EXISTS "Coaches can create assigned client supplements" ON public.supplements;
DROP POLICY IF EXISTS "Coaches can update assigned client supplements" ON public.supplements;
DROP POLICY IF EXISTS "Coaches can delete assigned client supplements" ON public.supplements;

CREATE POLICY "Clients can view assigned meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = client_id AND status IN ('assigned', 'archived'));

CREATE POLICY "Coaches can view manageable meal plans"
  ON public.meal_plans FOR SELECT
  USING (
    (client_id IS NULL AND auth.uid() = coach_id)
    OR (client_id IS NOT NULL AND public.can_coach_client(client_id))
  );

CREATE POLICY "Coaches can create meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
    AND status = 'draft'
    AND client_id IS NULL
  );

CREATE POLICY "Coaches can update manageable meal plans"
  ON public.meal_plans FOR UPDATE
  USING (
    auth.uid() = coach_id
    AND (
      (status = 'draft' AND client_id IS NULL)
      OR (status = 'assigned' AND public.can_coach_client(client_id))
    )
  )
  WITH CHECK (
    auth.uid() = coach_id
    AND (
      (status = 'draft' AND client_id IS NULL)
      OR (status IN ('assigned', 'archived') AND client_id IS NOT NULL AND public.can_coach_client(client_id))
    )
  );

CREATE POLICY "Coaches can delete draft meal plans"
  ON public.meal_plans FOR DELETE
  USING (
    auth.uid() = coach_id
    AND status = 'draft'
    AND client_id IS NULL
  );

CREATE POLICY "Clients can view assigned meal plan meals"
  ON public.meal_plan_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.client_id = auth.uid()
        AND mp.status IN ('assigned', 'archived')
    )
  );

CREATE POLICY "Coaches can view manageable meal plan meals"
  ON public.meal_plan_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND (
          (mp.client_id IS NULL AND mp.coach_id = auth.uid())
          OR (mp.client_id IS NOT NULL AND public.can_coach_client(mp.client_id))
        )
    )
  );

CREATE POLICY "Coaches can create manageable meal plan meals"
  ON public.meal_plan_meals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND mp.status = 'draft'
        AND (
          mp.client_id IS NULL
        )
    )
  );

CREATE POLICY "Coaches can update manageable meal plan meals"
  ON public.meal_plan_meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND mp.status = 'draft'
        AND (
          mp.client_id IS NULL
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND mp.status = 'draft'
        AND (
          mp.client_id IS NULL
        )
    )
  );

CREATE POLICY "Coaches can delete manageable meal plan meals"
  ON public.meal_plan_meals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_meals.meal_plan_id
        AND mp.coach_id = auth.uid()
        AND mp.status = 'draft'
        AND (
          mp.client_id IS NULL
        )
    )
  );

CREATE POLICY "Clients can view own grocery lists"
  ON public.grocery_lists FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update own grocery lists"
  ON public.grocery_lists FOR UPDATE
  USING (
    auth.uid() = client_id
    AND public.grocery_meal_plan_matches_client(client_id, meal_plan_id)
  )
  WITH CHECK (
    auth.uid() = client_id
    AND public.grocery_meal_plan_matches_client(client_id, meal_plan_id)
  );

CREATE POLICY "Clients can insert own grocery lists"
  ON public.grocery_lists FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND public.grocery_meal_plan_matches_client(client_id, meal_plan_id)
  );

CREATE POLICY "Coaches can manage assigned client grocery lists"
  ON public.grocery_lists FOR ALL
  USING (
    public.can_coach_client(client_id)
    AND public.grocery_meal_plan_matches_client(client_id, meal_plan_id)
  )
  WITH CHECK (
    public.can_coach_client(client_id)
    AND public.grocery_meal_plan_matches_client(client_id, meal_plan_id)
  );

CREATE POLICY "Clients can view own water tracker"
  ON public.water_tracker FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own water tracker"
  ON public.water_tracker FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own water tracker"
  ON public.water_tracker FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Coaches can view assigned client water tracker"
  ON public.water_tracker FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Clients can view own supplements"
  ON public.supplements FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can view assigned client supplements"
  ON public.supplements FOR SELECT
  USING (public.can_coach_client(client_id));

CREATE POLICY "Coaches can create assigned client supplements"
  ON public.supplements FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
    AND public.can_coach_client(client_id)
  );

CREATE POLICY "Coaches can update assigned client supplements"
  ON public.supplements FOR UPDATE
  USING (
    auth.uid() = coach_id
    AND public.can_coach_client(client_id)
  )
  WITH CHECK (
    auth.uid() = coach_id
    AND public.can_coach_client(client_id)
  );

CREATE POLICY "Coaches can delete assigned client supplements"
  ON public.supplements FOR DELETE
  USING (
    auth.uid() = coach_id
    AND public.can_coach_client(client_id)
  );
