import * as ImagePicker from 'expo-image-picker';
import { AppServiceError, throwIfSupabaseError, toServiceError } from '@/services/errors';
import { supabase } from '@/services/supabase';
import {
  BodyMeasurementChange,
  FitnessAssessment,
  Measurement,
  ProgressPhoto,
  ProgressChartPoint,
  ProgressPhotoPose,
  ProgressPhotoWithUrl,
  ProgressSummary,
} from '@/types';
import { getFitnessAssessment } from '@/services/fitness.service';

const PHOTO_BUCKET = 'progress-photos';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

type MeasurementInput = {
  clientId: string;
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

type ProgressPhotoInput = {
  clientId: string;
  pose: ProgressPhotoPose;
  takenAt?: string;
  notes?: string;
  asset: ImagePicker.ImagePickerAsset;
};

const bodyMeasurementFields: {
  key: BodyMeasurementChange['key'];
  label: string;
  unit: BodyMeasurementChange['unit'];
}[] = [
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'body_fat', label: 'Body Fat', unit: '%' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'left_arm', label: 'Left Arm', unit: 'cm' },
  { key: 'right_arm', label: 'Right Arm', unit: 'cm' },
  { key: 'left_thigh', label: 'Left Thigh', unit: 'cm' },
  { key: 'right_thigh', label: 'Right Thigh', unit: 'cm' },
  { key: 'neck', label: 'Neck', unit: 'cm' },
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getProgressMeasurements(clientId: string) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error, 'Unable to load measurements.');

  return data ?? [];
}

export async function addProgressMeasurement(input: MeasurementInput) {
  const { data, error } = await supabase
    .from('measurements')
    .insert({
      client_id: input.clientId,
      date: input.date ?? todayDate(),
      weight: input.weight ?? null,
      body_fat: input.bodyFat ?? null,
      chest: input.chest ?? null,
      waist: input.waist ?? null,
      hips: input.hips ?? null,
      left_arm: input.leftArm ?? null,
      right_arm: input.rightArm ?? null,
      left_thigh: input.leftThigh ?? null,
      right_thigh: input.rightThigh ?? null,
      neck: input.neck ?? null,
      notes: input.notes?.trim() || null,
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to save measurement.');

  return data;
}

export async function updateProgressMeasurement(
  measurementId: string,
  input: Omit<MeasurementInput, 'clientId'>
) {
  const { data, error } = await supabase
    .from('measurements')
    .update({
      date: input.date,
      weight: input.weight ?? null,
      body_fat: input.bodyFat ?? null,
      chest: input.chest ?? null,
      waist: input.waist ?? null,
      hips: input.hips ?? null,
      left_arm: input.leftArm ?? null,
      right_arm: input.rightArm ?? null,
      left_thigh: input.leftThigh ?? null,
      right_thigh: input.rightThigh ?? null,
      neck: input.neck ?? null,
      notes: input.notes?.trim() || null,
    })
    .eq('id', measurementId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to update measurement.');

  return data;
}

export async function deleteProgressMeasurement(measurementId: string) {
  const { error } = await supabase
    .from('measurements')
    .delete()
    .eq('id', measurementId);

  throwIfSupabaseError(error, 'Unable to delete measurement.');
}

export async function getProgressPhotos(clientId: string) {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: false })
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, "We couldn't load progress photos.");

  return Promise.all((data ?? []).map(withSignedUrl));
}

export async function getProgressPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN_SECONDS);

  throwIfSupabaseError(error, "That photo couldn't be loaded.");

  return data?.signedUrl ?? null;
}

export async function uploadProgressPhoto({
  asset,
  clientId,
  notes,
  pose,
  takenAt = todayDate(),
}: ProgressPhotoInput) {
  if (!asset.uri) {
    throw new AppServiceError("That photo couldn't be uploaded. Try again.");
  }

  const extension = getImageExtension(asset);
  const contentType = asset.mimeType ?? `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  const path = `${clientId}/${takenAt}/${pose}-${createPathToken()}.${extension}`;
  const photoData = await readImageAsset(asset);

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, photoData, {
      contentType,
      upsert: false,
    });

  throwIfSupabaseError(uploadError, "That photo couldn't be uploaded. Try again.");

  const { data, error: metadataError } = await supabase
    .from('progress_photos')
    .insert({
      client_id: clientId,
      storage_path: path,
      pose,
      taken_at: takenAt,
      notes: notes?.trim() || null,
    })
    .select('*')
    .single();

  if (metadataError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw toServiceError(metadataError, "That photo couldn't be saved. Try again.");
  }

  return withSignedUrl(data);
}

export async function deleteProgressPhoto(photo: ProgressPhotoWithUrl) {
  const { error: metadataError } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photo.id);

  throwIfSupabaseError(metadataError, "That photo couldn't be deleted.");

  const { error: storageError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);

  throwIfSupabaseError(storageError, "That photo file couldn't be deleted.");
}

export async function getClientProgressSummary(clientId: string): Promise<ProgressSummary> {
  const [assessment, measurements, photos] = await Promise.all([
    getFitnessAssessment(clientId),
    getProgressMeasurements(clientId),
    getProgressPhotos(clientId),
  ]);

  return buildProgressSummary(assessment, measurements, photos);
}

export function buildProgressSummary(
  assessment: FitnessAssessment | null,
  measurements: Measurement[],
  photos: ProgressPhotoWithUrl[]
): ProgressSummary {
  const validWeightMeasurements = measurements.filter((measurement) => measurement.weight != null);
  const startingMeasurement = validWeightMeasurements[0] ?? null;
  const currentMeasurement = validWeightMeasurements[validWeightMeasurements.length - 1] ?? null;
  const startingWeightKg = startingMeasurement?.weight ?? assessment?.startingWeightKg ?? null;
  const currentWeightKg = currentMeasurement?.weight ?? assessment?.currentWeightKg ?? null;
  const goalWeightKg = assessment?.goalWeightKg ?? null;
  const weightChangeKg =
    startingWeightKg != null && currentWeightKg != null ? currentWeightKg - startingWeightKg : null;
  const remainingToGoalKg =
    goalWeightKg != null && currentWeightKg != null ? goalWeightKg - currentWeightKg : null;

  return {
    assessment,
    measurements,
    photos,
    startingMeasurement,
    currentMeasurement,
    startingWeightKg,
    currentWeightKg,
    goalWeightKg,
    weightChangeKg,
    remainingToGoalKg,
    chartPoints: buildWeightChartPoints(validWeightMeasurements),
    bodyChanges: buildBodyChanges(measurements),
  };
}

export function calculateProgressPercent(
  startingWeightKg?: number | null,
  currentWeightKg?: number | null,
  goalWeightKg?: number | null
) {
  if (startingWeightKg == null || currentWeightKg == null || goalWeightKg == null) return null;

  const total = goalWeightKg - startingWeightKg;
  if (total === 0) return 100;

  const moved = currentWeightKg - startingWeightKg;
  return Math.min(100, Math.max(0, Math.round((moved / total) * 100)));
}

function buildWeightChartPoints(measurements: Measurement[]): ProgressChartPoint[] {
  return measurements
    .filter((measurement) => measurement.weight != null)
    .map((measurement) => ({
      date: measurement.date ?? '',
      label: formatShortDate(measurement.date),
      weightKg: Number(measurement.weight),
    }));
}

function buildBodyChanges(measurements: Measurement[]): BodyMeasurementChange[] {
  return bodyMeasurementFields.flatMap((field) => {
    const withValue = measurements.filter((measurement) => measurement[field.key] != null);
    const starting = withValue[0]?.[field.key];
    const current = withValue[withValue.length - 1]?.[field.key];

    if (starting == null || current == null) return [];

    return [{
      ...field,
      starting: Number(starting),
      current: Number(current),
      change: Number(current) - Number(starting),
    }];
  });
}

async function withSignedUrl(photo: ProgressPhoto): Promise<ProgressPhotoWithUrl> {
  try {
    return {
      ...photo,
      signedUrl: await getProgressPhotoSignedUrl(photo.storage_path),
    };
  } catch (error) {
    console.error('Unable to sign progress photo URL:', error);
    return { ...photo, signedUrl: null };
  }
}

async function readImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const response = await fetch(asset.uri);
  return response.blob();
}

function getImageExtension(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';
  return 'jpg';
}

function createPathToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function formatShortDate(value?: string | null) {
  if (!value) return '';

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
