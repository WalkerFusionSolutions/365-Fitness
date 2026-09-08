import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAppointment,
  getAppointmentById,
  getClientAppointments,
  getCoachAppointments,
  setAppointmentStatus,
  updateAppointment,
  AppointmentDraft,
} from '@/services/appointments.service';
import { AppServiceError } from '@/services/errors';
import { AppointmentWithProfiles } from '@/types';

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

export function useClientAppointments(clientId?: string) {
  return useAppointmentList(() => getClientAppointments(clientId), [clientId]);
}

export function useCoachSchedule() {
  return useAppointmentList(getCoachAppointments, []);
}

export function useUpcomingAppointments(clientId?: string) {
  const appointments = useClientAppointments(clientId);
  const upcoming = useMemo(
    () =>
      appointments.data
        .filter((appointment) => isUpcomingScheduled(appointment))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [appointments.data]
  );

  return {
    ...appointments,
    nextAppointment: upcoming[0] ?? null,
    upcoming,
  };
}

export function useAppointment(appointmentId?: string) {
  const [data, setData] = useState<AppointmentWithProfiles | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!appointmentId) return;

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const appointment = await getAppointmentById(appointmentId);
      if (requestId.current === currentRequest) {
        setData(appointment);
      }
    } catch (loadError) {
      console.error('Unable to load appointment:', loadError);
      if (requestId.current === currentRequest) {
        setError(getUserMessage(loadError, 'Unable to load appointment.'));
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, [appointmentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, isLoading, refresh, setData };
}

export function useAppointmentActions() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (draft: AppointmentDraft, appointmentId?: string) => {
      setIsSaving(true);
      setError(null);

      try {
        const appointment = appointmentId
          ? await updateAppointment(appointmentId, draft)
          : await createAppointment(draft);
        return appointment;
      } catch (saveError) {
        console.error('Unable to save appointment:', saveError);
        setError(getUserMessage(saveError, "That appointment couldn't be scheduled."));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const changeStatus = useCallback(
    async (appointmentId: string, status: 'cancelled' | 'completed') => {
      setIsSaving(true);
      setError(null);

      try {
        return await setAppointmentStatus(appointmentId, status);
      } catch (statusError) {
        console.error('Unable to update appointment:', statusError);
        setError(getUserMessage(statusError, 'Unable to update appointment.'));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { changeStatus, error, isSaving, save };
}

function useAppointmentList(
  loader: () => Promise<AppointmentWithProfiles[]>,
  dependencies: unknown[]
) {
  const [data, setData] = useState<AppointmentWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(
    async (refreshing = false) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);

      try {
        const appointments = await loader();
        if (requestId.current === currentRequest) {
          setData(appointments);
        }
      } catch (loadError) {
        console.error('Unable to load appointments:', loadError);
        if (requestId.current === currentRequest) {
          setError(getUserMessage(loadError, 'Unable to load appointments.'));
        }
      } finally {
        if (requestId.current === currentRequest) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pullToRefresh = useCallback(() => refresh(true), [refresh]);

  return { data, error, isLoading, isRefreshing, refresh: pullToRefresh };
}

function isUpcomingScheduled(appointment: AppointmentWithProfiles) {
  return (
    appointment.status === 'scheduled' &&
    new Date(appointment.ends_at).getTime() >= Date.now()
  );
}
