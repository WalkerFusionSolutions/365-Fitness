"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import type { Appointment, Profile } from "@/types/app";

type FormState = {
  client_id: string;
  title: string;
  appointment_type: Appointment["appointment_type"];
  starts_at: string;
  ends_at: string;
  location_type: Appointment["location_type"];
  location_text: string;
  meeting_url: string;
  description: string;
};

const emptyForm: FormState = {
  client_id: "",
  title: "",
  appointment_type: "check_in",
  starts_at: "",
  ends_at: "",
  location_type: "video",
  location_text: "",
  meeting_url: "",
  description: "",
};

export function ScheduleBoard({ initialAppointments, clients, coachId }: { initialAppointments: Appointment[]; clients: Profile[]; coachId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedAppointments = appointments.filter((appointment) => appointment.starts_at.slice(0, 10) === selectedDate);

  async function refresh() {
    const { data, error: loadError } = await supabase
      .from("appointments")
      .select("*")
      .order("starts_at", { ascending: true })
      .returns<Appointment[]>();

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setAppointments(data ?? []);
  }

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const startsAt = new Date(form.starts_at);
    const endsAt = new Date(form.ends_at);

    if (!form.client_id || !form.title.trim() || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setError("Choose a client, title, start time, and an end time after the start.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      client_id: form.client_id,
      coach_id: coachId,
      created_by: coachId,
      title: form.title.trim(),
      appointment_type: form.appointment_type,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location_type: form.location_type,
      location_text: form.location_text.trim() || null,
      meeting_url: form.meeting_url.trim() || null,
      description: form.description.trim() || null,
      status: "scheduled",
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setMessage("Appointment created.");
    await refresh();
    setSaving(false);
  }

  async function updateStatus(appointment: Appointment, status: Appointment["status"]) {
    setError(null);
    setMessage(null);
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status,
        cancelled_at: status === "cancelled" ? now : null,
        completed_at: status === "completed" ? now : null,
      })
      .eq("id", appointment.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(`Appointment marked ${status}.`);
    await refresh();
  }

  async function moveByMinutes(appointment: Appointment, minutes: number) {
    const starts = new Date(appointment.starts_at);
    const ends = new Date(appointment.ends_at);
    starts.setMinutes(starts.getMinutes() + minutes);
    ends.setMinutes(ends.getMinutes() + minutes);

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: "scheduled", cancelled_at: null, completed_at: null })
      .eq("id", appointment.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Appointment rescheduled.");
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <h2 className="text-xl font-bold">Create appointment</h2>
        <form onSubmit={createAppointment} className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-semibold" htmlFor="appointment-client">Client</label>
          <select id="appointment-client" className="input -mt-3" value={form.client_id} onChange={(event) => setForm({ ...form, client_id: event.target.value })} required>
            <option value="">Choose client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.full_name}</option>
            ))}
          </select>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="appointment-title">Title</label>
          <input id="appointment-title" className="input -mt-3" placeholder="Progress check-in" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">Starts<input className="input font-normal" type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} required /></label>
            <label className="grid gap-1 text-sm font-semibold">Ends<input className="input font-normal" type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} required /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">Appointment type<select className="input font-normal" value={form.appointment_type} onChange={(event) => setForm({ ...form, appointment_type: event.target.value as Appointment["appointment_type"] })}>
              {["consultation", "check_in", "workout", "assessment", "progress_review", "nutrition", "other"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
            </select></label>
            <label className="grid gap-1 text-sm font-semibold">Location type<select className="input font-normal" value={form.location_type} onChange={(event) => setForm({ ...form, location_type: event.target.value as Appointment["location_type"] })}>
              {["video", "phone", "in_person", "other"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
            </select></label>
          </div>
          <label className="grid gap-1 text-sm font-semibold">Location details<input className="input font-normal" placeholder="Gym, studio, or call details" value={form.location_text} onChange={(event) => setForm({ ...form, location_text: event.target.value })} /></label>
          <label className="grid gap-1 text-sm font-semibold">Meeting URL<input className="input font-normal" type="url" placeholder="https://" value={form.meeting_url} onChange={(event) => setForm({ ...form, meeting_url: event.target.value })} /></label>
          <label className="grid gap-1 text-sm font-semibold">Description<textarea className="input min-h-24 font-normal" placeholder="Add useful context for the session" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <Button type="submit" disabled={saving || clients.length === 0}>{saving ? "Saving..." : "Create appointment"}</Button>
        </form>
        {message ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-brand">{message}</p> : null}
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Schedule</h2>
            <p className="text-sm text-muted">Create, reschedule, cancel, and complete records through existing RLS.</p>
          </div>
          <label className="grid gap-1 text-xs font-semibold text-muted">View date<input className="input max-w-48 text-foreground" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        </div>
        <div className="mt-5 grid gap-3">
          {selectedAppointments.length ? selectedAppointments.map((appointment) => (
            <div key={appointment.id} className="border-b border-line py-4 last:border-b-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{appointment.title}</h3>
                    <Badge tone={appointment.status === "scheduled" ? "good" : appointment.status === "cancelled" ? "danger" : "neutral"}>{appointment.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.starts_at)}</p>
                  <p className="mt-1 text-sm text-muted">{appointment.location_type.replaceAll("_", " ")} {appointment.location_text ? `· ${appointment.location_text}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => moveByMinutes(appointment, 30)}>+30 min</Button>
                  <Button type="button" variant="secondary" onClick={() => updateStatus(appointment, "completed")}>Complete</Button>
                  <Button type="button" variant="danger" onClick={() => updateStatus(appointment, "cancelled")}>Cancel</Button>
                </div>
              </div>
            </div>
          )) : (
            <div className="border-y border-dashed border-line py-6 text-sm text-muted">No appointments scheduled for this day.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
