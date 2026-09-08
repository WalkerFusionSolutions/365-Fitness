import { AppServiceError, throwIfSupabaseError, toServiceError } from '@/services/errors';
import { supabase } from '@/services/supabase';
import {
  Appointment,
  AppointmentLocationType,
  AppointmentStatus,
  AppointmentType,
  AppointmentWithProfiles,
  Profile,
} from '@/types';
import { Database } from '@/types/database';

type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type AppointmentDraft = {
  clientId: string;
  coachId: string;
  title: string;
  description?: string | null;
  appointmentType: AppointmentType;
  startsAt: string;
  endsAt: string;
  locationType: AppointmentLocationType;
  locationText?: string | null;
  meetingUrl?: string | null;
  coachNotes?: string | null;
};

export async function getClientAppointments(
  clientId?: string
): Promise<AppointmentWithProfiles[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .order('starts_at', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, 'Unable to load appointments.');

  return hydrateAppointments(data ?? []);
}

export async function getCoachAppointments(): Promise<AppointmentWithProfiles[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('starts_at', { ascending: true });

  throwIfSupabaseError(error, 'Unable to load schedule.');

  return hydrateAppointments(data ?? []);
}

export async function getAppointmentById(
  appointmentId: string
): Promise<AppointmentWithProfiles> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  throwIfSupabaseError(error, 'Unable to load appointment.');

  if (!data) {
    throw new AppServiceError('Appointment not found.');
  }

  const [appointment] = await hydrateAppointments([data]);
  return appointment;
}

export async function createAppointment(draft: AppointmentDraft) {
  const userId = await getCurrentUserId();
  const payload: AppointmentInsert = {
    appointment_type: draft.appointmentType,
    client_id: draft.clientId,
    coach_id: draft.coachId,
    coach_notes: draft.coachNotes ?? null,
    created_by: userId,
    description: draft.description ?? null,
    ends_at: draft.endsAt,
    location_text: draft.locationText ?? null,
    location_type: draft.locationType,
    meeting_url: draft.meetingUrl ?? null,
    starts_at: draft.startsAt,
    title: draft.title.trim(),
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw mapAppointmentWriteError(error);
  }

  return data as Appointment;
}

export async function updateAppointment(
  appointmentId: string,
  draft: AppointmentDraft
) {
  const payload: AppointmentUpdate = {
    appointment_type: draft.appointmentType,
    client_id: draft.clientId,
    coach_id: draft.coachId,
    coach_notes: draft.coachNotes ?? null,
    description: draft.description ?? null,
    ends_at: draft.endsAt,
    location_text: draft.locationText ?? null,
    location_type: draft.locationType,
    meeting_url: draft.meetingUrl ?? null,
    starts_at: draft.startsAt,
    status: 'scheduled',
    title: draft.title.trim(),
    cancelled_at: null,
    completed_at: null,
  };

  const { data, error } = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error) {
    throw mapAppointmentWriteError(error);
  }

  return data as Appointment;
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: Extract<AppointmentStatus, 'cancelled' | 'completed'>
) {
  const now = new Date().toISOString();
  const payload: AppointmentUpdate =
    status === 'cancelled'
      ? { status, cancelled_at: now, completed_at: null }
      : { status, completed_at: now, cancelled_at: null };

  const { data, error } = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error) {
    throw mapAppointmentWriteError(error);
  }

  return data as Appointment;
}

async function hydrateAppointments(
  appointments: Appointment[]
): Promise<AppointmentWithProfiles[]> {
  const profiles = await getProfilesById(
    appointments.flatMap((appointment) => [
      appointment.client_id,
      appointment.coach_id,
    ])
  );

  return appointments.map((appointment) => ({
    ...appointment,
    client: profiles.get(appointment.client_id) ?? null,
    coach: profiles.get(appointment.coach_id) ?? null,
  }));
}

async function getProfilesById(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, Profile>();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);

  throwIfSupabaseError(error, 'Unable to load appointment profiles.');

  return new Map((data ?? []).map((profile) => [profile.id, profile as Profile]));
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppServiceError('Unable to verify your session.', error);
  }

  if (!user) {
    throw new AppServiceError('Please sign in to continue.');
  }

  return user.id;
}

function mapAppointmentWriteError(error: unknown) {
  const text = String(
    (error as { message?: unknown; details?: unknown })?.message ??
      (error as { details?: unknown })?.details ??
      ''
  ).toLowerCase();

  if (
    text.includes('overlaps another appointment') ||
    text.includes('appointments_no_coach_scheduled_overlap')
  ) {
    return new AppServiceError('This time overlaps another appointment.', error);
  }

  return toServiceError(error, "That appointment couldn't be scheduled.");
}
