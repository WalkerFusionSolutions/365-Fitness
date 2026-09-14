import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { hasSupabaseEnv } from "./supabase/env";
import type { Appointment, Conversation, Measurement, NotificationRow, Profile, Workout } from "@/types/app";

export async function getSessionProfile() {
  if (!hasSupabaseEnv()) {
    return { supabase: null, user: null, profile: null as Profile | null, missingEnv: true };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
  return { supabase, user: null, profile: null as Profile | null, missingEnv: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, bio, phone_number, created_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { supabase, user, profile, missingEnv: false };
}

export async function requireUserProfile() {
  const session = await getSessionProfile();

  if (!session.user) {
    redirect("/login");
  }

  return session as Awaited<ReturnType<typeof getSessionProfile>> & {
    user: NonNullable<Awaited<ReturnType<typeof getSessionProfile>>["user"]>;
  };
}

export async function getCoachDashboardData() {
  const { supabase, user, profile } = await requireUserProfile();

  if (!profile || profile.role !== "coach") {
    return { user, profile, staffOnly: true, clients: [], appointments: [], notifications: [], workouts: [], conversations: [] };
  }

  const [clientsResult, appointmentsResult, notificationsResult, workoutsResult, conversationsResult] =
    await Promise.all([
      supabase.from("profiles").select("id, role, full_name, avatar_url, bio, phone_number, created_at").eq("role", "client").order("full_name", { ascending: true }).returns<Profile[]>(),
      supabase.from("appointments").select("*").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(8).returns<Appointment[]>(),
      supabase.from("notifications").select("id, user_id, title, body, type, is_read, created_at").eq("user_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(8).returns<NotificationRow[]>(),
      supabase.from("workouts").select("id, coach_id, client_id, name, description, assigned_date, status, estimated_minutes, updated_at").order("updated_at", { ascending: false }).limit(8).returns<Workout[]>(),
      supabase.from("conversations").select("id, client_id, coach_id, last_message_at, last_message_preview, status").order("updated_at", { ascending: false }).limit(8).returns<Conversation[]>(),
    ]);

  return {
    user,
    profile,
    staffOnly: false,
    clients: clientsResult.data ?? [],
    appointments: appointmentsResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    workouts: workoutsResult.data ?? [],
    conversations: conversationsResult.data ?? [],
    errors: [clientsResult.error, appointmentsResult.error, notificationsResult.error, workoutsResult.error, conversationsResult.error].filter(Boolean),
  };
}

export async function getClientDetail(clientId: string) {
  const { supabase, profile } = await requireUserProfile();

  if (!profile || profile.role !== "coach") {
    return { profile, client: null, appointments: [], workouts: [], measurements: [], staffOnly: true };
  }

  const [clientResult, appointmentsResult, workoutsResult, measurementsResult] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, avatar_url, bio, phone_number, created_at").eq("id", clientId).eq("role", "client").maybeSingle<Profile>(),
    supabase.from("appointments").select("*").eq("client_id", clientId).order("starts_at", { ascending: false }).limit(12).returns<Appointment[]>(),
    supabase.from("workouts").select("id, coach_id, client_id, name, description, assigned_date, status, estimated_minutes, updated_at").eq("client_id", clientId).order("updated_at", { ascending: false }).limit(10).returns<Workout[]>(),
    supabase.from("measurements").select("id, client_id, weight, body_fat, waist, date, notes, created_at").eq("client_id", clientId).order("date", { ascending: false }).limit(6).returns<Measurement[]>(),
  ]);

  return {
    profile,
    client: clientResult.data,
    appointments: appointmentsResult.data ?? [],
    workouts: workoutsResult.data ?? [],
    measurements: measurementsResult.data ?? [],
    staffOnly: false,
    errors: [clientResult.error, appointmentsResult.error, workoutsResult.error, measurementsResult.error].filter(Boolean),
  };
}
