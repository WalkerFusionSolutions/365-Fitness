import { useCallback, useEffect, useState } from 'react';
import {
  addMeasurement,
  getFitnessAssessment,
  getFitnessProfileSummary,
  getMeasurements,
  saveFitnessAssessment,
} from '@/services/fitness.service';
import { AppServiceError } from '@/services/errors';
import {
  FitnessAssessment,
  FitnessProfileSummary,
  Measurement,
} from '@/types';

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

export function useFitnessProfile(clientId?: string) {
  const [data, setData] = useState<FitnessProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getFitnessProfileSummary(clientId));
    } catch (loadError) {
      console.error('Unable to load fitness profile:', loadError);
      setError(
        getUserMessage(loadError, 'Unable to load your fitness profile.')
      );
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAssessment = useCallback(
    async (assessment: FitnessAssessment) => {
      if (!clientId) {
        setError('Please sign in to continue.');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        await saveFitnessAssessment({ clientId, assessment });
        await load();
        return true;
      } catch (saveError) {
        console.error('Unable to save fitness assessment:', saveError);
        setError(
          getUserMessage(saveError, 'Unable to save your assessment.')
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [clientId, load]
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    refresh: load,
    saveAssessment,
  };
}

export function useFitnessAssessment(clientId?: string) {
  const [data, setData] = useState<FitnessAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getFitnessAssessment(clientId));
    } catch (loadError) {
      console.error('Unable to load assessment:', loadError);
      setError(getUserMessage(loadError, 'Unable to load assessment.'));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, isLoading, refresh: load };
}

export function useMeasurements(clientId?: string) {
  const [data, setData] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getMeasurements(clientId));
    } catch (loadError) {
      console.error('Unable to load measurements:', loadError);
      setError(getUserMessage(loadError, 'Unable to load measurements.'));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMeasurement = useCallback(
    async (values: {
      weight?: number | null;
      bodyFat?: number | null;
      chest?: number | null;
      waist?: number | null;
      hips?: number | null;
      leftArm?: number | null;
      rightArm?: number | null;
      leftThigh?: number | null;
      rightThigh?: number | null;
      neck?: number | null;
      notes?: string | null;
      date?: string;
    }) => {
      if (!clientId) {
        setError('Please sign in to continue.');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        await addMeasurement({ clientId, ...values });
        await load();
        return true;
      } catch (saveError) {
        console.error('Unable to save measurement:', saveError);
        setError(getUserMessage(saveError, 'Unable to save measurement.'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [clientId, load]
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    refresh: load,
    saveMeasurement,
  };
}
