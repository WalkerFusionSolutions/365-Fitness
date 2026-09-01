import { useCallback, useEffect, useState } from 'react';
import {
  approvePendingAssignment,
  archiveAssignment,
  AssignmentWithProfile,
  createPendingAssignment,
  getCurrentClientAssignments,
  getCurrentCoachAssignments,
} from '@/services/assignments.service';
import { AppServiceError } from '@/services/errors';

function getUserMessage(error: unknown, fallback: string) {
  if (error instanceof AppServiceError) {
    return error.userMessage;
  }

  return fallback;
}

export function useCoachAssignments() {
  const [data, setData] = useState<AssignmentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      setData(await getCurrentCoachAssignments());
    } catch (loadError) {
      console.error('Unable to load coach assignments:', loadError);
      setError(getUserMessage(loadError, 'Unable to load assignments.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createAssignment = useCallback(
    async (clientId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        await createPendingAssignment(clientId);
        await load(true);
      } catch (mutationError) {
        console.error('Unable to create assignment:', mutationError);
        setError(
          getUserMessage(mutationError, 'Unable to create assignment request.')
        );
      } finally {
        setIsMutating(false);
      }
    },
    [load]
  );

  const archive = useCallback(
    async (assignmentId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        await archiveAssignment(assignmentId);
        await load(true);
      } catch (mutationError) {
        console.error('Unable to archive assignment:', mutationError);
        setError(getUserMessage(mutationError, 'Unable to update assignment.'));
      } finally {
        setIsMutating(false);
      }
    },
    [load]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh: () => load(true),
    createAssignment,
    archive,
  };
}

export function useClientAssignments() {
  const [data, setData] = useState<AssignmentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      setData(await getCurrentClientAssignments());
    } catch (loadError) {
      console.error('Unable to load client assignments:', loadError);
      setError(getUserMessage(loadError, 'Unable to load assignments.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(
    async (assignmentId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        await approvePendingAssignment(assignmentId);
        await load(true);
      } catch (mutationError) {
        console.error('Unable to approve assignment:', mutationError);
        setError(getUserMessage(mutationError, 'Unable to update assignment.'));
      } finally {
        setIsMutating(false);
      }
    },
    [load]
  );

  const archive = useCallback(
    async (assignmentId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        await archiveAssignment(assignmentId);
        await load(true);
      } catch (mutationError) {
        console.error('Unable to archive assignment:', mutationError);
        setError(getUserMessage(mutationError, 'Unable to update assignment.'));
      } finally {
        setIsMutating(false);
      }
    },
    [load]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh: () => load(true),
    approve,
    archive,
  };
}
