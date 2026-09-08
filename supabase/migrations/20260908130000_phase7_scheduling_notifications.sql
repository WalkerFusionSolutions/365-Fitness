-- Phase 7: Scheduling, appointment reminders, in-app notifications, and push devices.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  appointment_type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location_type text NOT NULL,
  location_text text,
  meeting_url text,
  client_notes text,
  coach_notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_valid_time CHECK (ends_at > starts_at),
  CONSTRAINT appointments_valid_type CHECK (
    appointment_type IN (
      'consultation',
      'check_in',
      'workout',
      'assessment',
      'progress_review',
      'nutrition',
      'other'
    )
  ),
  CONSTRAINT appointments_valid_status CHECK (
    status IN ('scheduled', 'completed', 'cancelled')
  ),
  CONSTRAINT appointments_valid_location_type CHECK (
    location_type IN ('in_person', 'video', 'phone', 'other')
  ),
  CONSTRAINT appointments_cancelled_at_matches_status CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR (status <> 'cancelled' AND cancelled_at IS NULL)
  ),
  CONSTRAINT appointments_completed_at_matches_status CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  reminder_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT appointment_reminders_valid_type CHECK (
    reminder_type IN ('24_hours_before', '1_hour_before')
  ),
  CONSTRAINT appointment_reminders_valid_status CHECK (
    status IN ('pending', 'in_app_created', 'push_queued', 'sent', 'cancelled', 'failed')
  ),
  CONSTRAINT appointment_reminders_unique_interval UNIQUE (
    appointment_id,
    recipient_id,
    reminder_type
  )
);

CREATE TABLE IF NOT EXISTS public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text NOT NULL,
  device_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_devices_valid_platform CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  CONSTRAINT push_devices_user_token_unique UNIQUE (user_id, expo_push_token)
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

UPDATE public.notifications
SET is_read = COALESCE(read, false)
WHERE is_read IS DISTINCT FROM COALESCE(read, false);

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_valid_type;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_valid_type CHECK (
    type IN (
      'appointment_created',
      'appointment_updated',
      'appointment_cancelled',
      'appointment_reminder',
      'workout_assigned',
      'meal_plan_assigned',
      'message_received',
      'system'
    )
  ) NOT VALID;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS appointments_client_starts_at_idx
  ON public.appointments (client_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS appointments_coach_starts_at_idx
  ON public.appointments (coach_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS appointment_reminders_due_idx
  ON public.appointment_reminders (status, remind_at);

CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS push_devices_user_active_idx
  ON public.push_devices (user_id, is_active);

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_coach_scheduled_overlap;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_coach_scheduled_overlap
  EXCLUDE USING gist (
    coach_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status = 'scheduled');

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

CREATE OR REPLACE FUNCTION public.is_coach_profile(coach_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = coach_uuid
      AND p.role = 'coach'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_appointment(
  appointment_client_id uuid,
  appointment_coach_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = appointment_coach_id
    AND public.coach_can_access_client(appointment_coach_id, appointment_client_id);
$$;

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'scheduled'
    AND EXISTS (
      SELECT 1
      FROM public.appointments AS existing
      WHERE existing.coach_id = NEW.coach_id
        AND existing.status = 'scheduled'
        AND existing.id <> COALESCE(NEW.id, gen_random_uuid())
        AND NEW.starts_at < existing.ends_at
        AND NEW.ends_at > existing.starts_at
    )
  THEN
    RAISE EXCEPTION 'This time overlaps another appointment.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_appointment_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_client_profile(NEW.client_id) THEN
    RAISE EXCEPTION 'Appointment client must be a client profile.';
  END IF;

  IF NOT public.is_coach_profile(NEW.coach_id) THEN
    RAISE EXCEPTION 'Appointment coach must be a coach profile.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by <> auth.uid() THEN
      RAISE EXCEPTION 'Appointment creator must be the authenticated user.';
    END IF;

    IF NOT public.can_manage_appointment(NEW.client_id, NEW.coach_id) THEN
      RAISE EXCEPTION 'Appointment access denied.';
    END IF;
  ELSE
    IF auth.uid() = OLD.client_id
      AND NEW.client_notes IS DISTINCT FROM OLD.client_notes
      AND NEW.id IS NOT DISTINCT FROM OLD.id
      AND NEW.client_id IS NOT DISTINCT FROM OLD.client_id
      AND NEW.coach_id IS NOT DISTINCT FROM OLD.coach_id
      AND NEW.title IS NOT DISTINCT FROM OLD.title
      AND NEW.description IS NOT DISTINCT FROM OLD.description
      AND NEW.appointment_type IS NOT DISTINCT FROM OLD.appointment_type
      AND NEW.status IS NOT DISTINCT FROM OLD.status
      AND NEW.starts_at IS NOT DISTINCT FROM OLD.starts_at
      AND NEW.ends_at IS NOT DISTINCT FROM OLD.ends_at
      AND NEW.location_type IS NOT DISTINCT FROM OLD.location_type
      AND NEW.location_text IS NOT DISTINCT FROM OLD.location_text
      AND NEW.meeting_url IS NOT DISTINCT FROM OLD.meeting_url
      AND NEW.coach_notes IS NOT DISTINCT FROM OLD.coach_notes
      AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
      AND NEW.cancelled_at IS NOT DISTINCT FROM OLD.cancelled_at
      AND NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at
    THEN
      NEW.updated_at = now();
      RETURN NEW;
    END IF;

    IF NOT public.can_manage_appointment(OLD.client_id, OLD.coach_id)
      OR NOT public.can_manage_appointment(NEW.client_id, NEW.coach_id)
    THEN
      RAISE EXCEPTION 'Appointment access denied.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_appointment_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'scheduled' THEN
    UPDATE public.appointment_reminders
    SET status = 'cancelled',
        processed_at = now()
    WHERE appointment_id = NEW.id
      AND status = 'pending';

    INSERT INTO public.appointment_reminders (
      appointment_id,
      recipient_id,
      remind_at,
      reminder_type
    )
    SELECT
      reminder.appointment_id,
      reminder.recipient_id,
      reminder.remind_at,
      reminder.reminder_type
    FROM (
      VALUES
        (NEW.id, NEW.client_id, NEW.starts_at - interval '24 hours', '24_hours_before'),
        (NEW.id, NEW.coach_id, NEW.starts_at - interval '24 hours', '24_hours_before'),
        (NEW.id, NEW.client_id, NEW.starts_at - interval '1 hour', '1_hour_before'),
        (NEW.id, NEW.coach_id, NEW.starts_at - interval '1 hour', '1_hour_before')
    ) AS reminder(appointment_id, recipient_id, remind_at, reminder_type)
    WHERE reminder.remind_at > now()
    ON CONFLICT (
      appointment_id,
      recipient_id,
      reminder_type
    )
    DO UPDATE SET
      remind_at = EXCLUDED.remind_at,
      status = 'pending',
      processed_at = NULL;
  ELSE
    UPDATE public.appointment_reminders
    SET status = 'cancelled',
        processed_at = now()
    WHERE appointment_id = NEW.id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_appointment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_type text;
  notification_title text;
  notification_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notification_type = 'appointment_created';
    notification_title = 'Appointment scheduled';
    notification_body = NEW.title;
  ELSIF NEW.status = 'cancelled'
    AND OLD.status IS DISTINCT FROM 'cancelled'
  THEN
    notification_type = 'appointment_cancelled';
    notification_title = 'Appointment cancelled';
    notification_body = NEW.title;
  ELSIF NEW.starts_at IS DISTINCT FROM OLD.starts_at
    OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
    OR NEW.location_type IS DISTINCT FROM OLD.location_type
    OR NEW.location_text IS DISTINCT FROM OLD.location_text
    OR NEW.meeting_url IS DISTINCT FROM OLD.meeting_url
    OR NEW.title IS DISTINCT FROM OLD.title
  THEN
    notification_type = 'appointment_updated';
    notification_title = 'Appointment updated';
    notification_body = NEW.title;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    related_entity_type,
    related_entity_id
  )
  SELECT recipient_id,
    notification_type,
    notification_title,
    notification_body,
    'appointment',
    NEW.id
  FROM (
    VALUES (NEW.client_id), (NEW.coach_id)
  ) AS recipients(recipient_id)
  WHERE recipient_id <> auth.uid();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_due_reminder_notification(reminder_uuid uuid)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reminder_row public.appointment_reminders;
  appointment_row public.appointments;
  notification_row public.notifications;
BEGIN
  SELECT *
  INTO reminder_row
  FROM public.appointment_reminders
  WHERE id = reminder_uuid
    AND status = 'pending'
    AND remind_at <= now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO appointment_row
  FROM public.appointments
  WHERE id = reminder_row.appointment_id
    AND status = 'scheduled';

  IF NOT FOUND THEN
    UPDATE public.appointment_reminders
    SET status = 'cancelled',
        processed_at = now()
    WHERE id = reminder_uuid;

    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    related_entity_type,
    related_entity_id
  )
  VALUES (
    reminder_row.recipient_id,
    'appointment_reminder',
    'Appointment reminder',
    appointment_row.title,
    'appointment',
    appointment_row.id
  )
  RETURNING * INTO notification_row;

  UPDATE public.appointment_reminders
  SET status = 'in_app_created',
      processed_at = now()
  WHERE id = reminder_uuid;

  RETURN notification_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> OLD.user_id THEN
    RAISE EXCEPTION 'Notification access denied.';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.related_entity_type IS DISTINCT FROM OLD.related_entity_type
    OR NEW.related_entity_id IS DISTINCT FROM OLD.related_entity_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only notification read state can be changed.';
  END IF;

  NEW.read = COALESCE(NEW.is_read, false);
  IF NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_appointment_write ON public.appointments;
CREATE TRIGGER validate_appointment_write
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_write();

DROP TRIGGER IF EXISTS prevent_appointment_overlap ON public.appointments;
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE OF coach_id, starts_at, ends_at, status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointment_overlap();

DROP TRIGGER IF EXISTS sync_appointment_reminders ON public.appointments;
CREATE TRIGGER sync_appointment_reminders
  AFTER INSERT OR UPDATE OF starts_at, ends_at, status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_reminders();

DROP TRIGGER IF EXISTS create_appointment_notification ON public.appointments;
CREATE TRIGGER create_appointment_notification
  AFTER INSERT OR UPDATE OF title, starts_at, ends_at, status, location_type, location_text, meeting_url
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_appointment_notification();

DROP TRIGGER IF EXISTS validate_notification_update ON public.notifications;
CREATE TRIGGER validate_notification_update
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_notification_update();

DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Coaches can view authorized client appointments" ON public.appointments;
DROP POLICY IF EXISTS "Coaches can create authorized client appointments" ON public.appointments;
DROP POLICY IF EXISTS "Coaches can update authorized client appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update own appointment notes" ON public.appointments;

CREATE POLICY "Clients can view own appointments"
  ON public.appointments FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view authorized client appointments"
  ON public.appointments FOR SELECT
  USING (public.can_manage_appointment(client_id, coach_id));

CREATE POLICY "Coaches can create authorized client appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_manage_appointment(client_id, coach_id)
  );

CREATE POLICY "Coaches can update authorized client appointments"
  ON public.appointments FOR UPDATE
  USING (public.can_manage_appointment(client_id, coach_id))
  WITH CHECK (public.can_manage_appointment(client_id, coach_id));

CREATE POLICY "Clients can update own appointment notes"
  ON public.appointments FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own appointment reminders" ON public.appointment_reminders;

CREATE POLICY "Users can view own appointment reminders"
  ON public.appointment_reminders FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own push devices" ON public.push_devices;
DROP POLICY IF EXISTS "Users can view own push devices" ON public.push_devices;
DROP POLICY IF EXISTS "Users can insert own push devices" ON public.push_devices;
DROP POLICY IF EXISTS "Users can update own push devices" ON public.push_devices;

CREATE POLICY "Users can view own push devices"
  ON public.push_devices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push devices"
  ON public.push_devices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push devices"
  ON public.push_devices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON FUNCTION public.is_client_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_client_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_client_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_coach_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_coach_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_coach_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.can_manage_appointment(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_appointment(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_appointment(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.prevent_appointment_overlap() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_appointment_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_appointment_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_appointment_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_notification_update() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.create_due_reminder_notification(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_due_reminder_notification(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_due_reminder_notification(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_due_reminder_notification(uuid) TO service_role;
