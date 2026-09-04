import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { AppServiceError } from '@/services/errors';
import {
  addProgressMeasurement,
  deleteProgressPhoto,
  getClientProgressSummary,
  uploadProgressPhoto,
} from '@/services/progress.service';
import {
  ProgressPhotoPose,
  ProgressPhotoWithUrl,
  ProgressSummary,
} from '@/types';

type AddMeasurementInput = {
  date?: string;
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
};

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

export function useClientProgress(clientId?: string) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clientId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getClientProgressSummary(clientId));
    } catch (loadError) {
      console.error('Unable to load progress:', loadError);
      setError(getUserMessage(loadError, "We couldn't load your progress."));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMeasurement = useCallback(
    async (values: AddMeasurementInput) => {
      if (!clientId) {
        setError('Please sign in to continue.');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        await addProgressMeasurement({ clientId, ...values });
        await refresh();
        return true;
      } catch (saveError) {
        console.error('Unable to save progress measurement:', saveError);
        setError(getUserMessage(saveError, 'Unable to save measurement.'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [clientId, refresh]
  );

  const addPhoto = useCallback(
    async ({
      asset,
      notes,
      pose,
      takenAt,
    }: {
      asset: ImagePicker.ImagePickerAsset;
      pose: ProgressPhotoPose;
      takenAt?: string;
      notes?: string;
    }) => {
      if (!clientId) {
        setError('Please sign in to continue.');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        await uploadProgressPhoto({ asset, clientId, notes, pose, takenAt });
        await refresh();
        return true;
      } catch (photoError) {
        console.error('Unable to upload progress photo:', photoError);
        setError(getUserMessage(photoError, "That photo couldn't be uploaded. Try again."));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [clientId, refresh]
  );

  const removePhoto = useCallback(
    async (photo: ProgressPhotoWithUrl) => {
      setIsSaving(true);
      setError(null);

      try {
        await deleteProgressPhoto(photo);
        await refresh();
        return true;
      } catch (deleteError) {
        console.error('Unable to delete progress photo:', deleteError);
        setError(getUserMessage(deleteError, "That photo couldn't be deleted."));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  return {
    addMeasurement,
    addPhoto,
    data,
    error,
    isLoading,
    isSaving,
    refresh,
    removePhoto,
  };
}

export function useCoachClientProgress(clientId?: string) {
  return useClientProgress(clientId);
}
