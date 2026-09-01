import {
  AssignmentStatus,
  CoachClientAssignment,
  CoachVisibleClient,
  Profile,
} from '@/types';
import { supabase } from '@/services/supabase';
import { AppServiceError, throwIfSupabaseError } from '@/services/errors';
import { getFitnessProfileSummaries } from '@/services/fitness.service';

export type AssignmentWithProfile = CoachClientAssignment & {
  coach?: Profile | null;
  client?: Profile | null;
};

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

async function getVisibleProfilesById(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

  if (uniqueIds.length === 0) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);

  throwIfSupabaseError(error, 'Unable to load assignment profiles.');

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function withClientProfiles(
  assignments: CoachClientAssignment[],
  profiles: Map<string, Profile>
) {
  return assignments.map((assignment) => ({
    ...assignment,
    client: profiles.get(assignment.client_id) ?? null,
  }));
}

function withCoachProfiles(
  assignments: CoachClientAssignment[],
  profiles: Map<string, Profile>
) {
  return assignments.map((assignment) => ({
    ...assignment,
    coach: profiles.get(assignment.coach_id) ?? null,
  }));
}

export async function getCurrentCoachAssignments() {
  const coachId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('coach_client_assignments')
    .select('*')
    .eq('coach_id', coachId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load assignments.');

  const assignments = data ?? [];
  const profiles = await getVisibleProfilesById(
    assignments.map((assignment) => assignment.client_id)
  );

  return withClientProfiles(assignments, profiles);
}

export async function getCurrentClientAssignments() {
  const clientId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('coach_client_assignments')
    .select('*')
    .eq('client_id', clientId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load assignments.');

  const assignments = data ?? [];
  const profiles = await getVisibleProfilesById(
    assignments.map((assignment) => assignment.coach_id)
  );

  return withCoachProfiles(assignments, profiles);
}

export async function getActiveClientsForCoach() {
  const assignments = await getCurrentCoachAssignments();
  return assignments.filter((assignment) => assignment.status === 'active');
}

export async function getCoachClientSummaries(): Promise<CoachVisibleClient[]> {
  const assignments = await getCurrentCoachAssignments();
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === 'active' && assignment.client
  );
  const summariesByClientId = await getFitnessProfileSummaries(
    activeAssignments.map((assignment) => assignment.client_id)
  );

  return activeAssignments.map((assignment) => ({
    profile: assignment.client!,
    fitnessSummary: summariesByClientId.get(assignment.client_id) ?? null,
    assignment,
  }));
}

export async function createPendingAssignment(clientId: string) {
  const coachId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('coach_client_assignments')
    .insert({
      coach_id: coachId,
      client_id: clientId,
      status: 'pending',
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to create assignment request.');

  return data;
}

export async function approvePendingAssignment(assignmentId: string) {
  return updateAssignmentStatus(assignmentId, 'active');
}

export async function archiveAssignment(assignmentId: string) {
  return updateAssignmentStatus(assignmentId, 'archived');
}

async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus
) {
  const { data, error } = await supabase
    .from('coach_client_assignments')
    .update({ status })
    .eq('id', assignmentId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to update assignment.');

  return data;
}
