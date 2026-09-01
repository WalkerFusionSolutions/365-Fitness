import { FitnessAssessment, FitnessProfileSummary, Measurement } from '@/types';
import { supabase } from '@/services/supabase';
import { throwIfSupabaseError } from '@/services/errors';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseAssessment(value: unknown): FitnessAssessment | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as FitnessAssessment;
}

export function calculateBmi(heightCm?: number, weightKg?: number) {
  if (!heightCm || !weightKg) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export async function getFitnessAssessment(clientId: string) {
  const { data, error } = await supabase
    .from('medical_questionnaire')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load your fitness profile.');

  return parseAssessment(data?.responses);
}

export async function getMeasurements(clientId: string) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load measurements.');

  return data ?? [];
}

export async function addMeasurement({
  clientId,
  weight,
  bodyFat,
  chest,
  waist,
  date = todayDate(),
}: {
  clientId: string;
  weight?: number | null;
  bodyFat?: number | null;
  chest?: number | null;
  waist?: number | null;
  date?: string;
}) {
  const { data, error } = await supabase
    .from('measurements')
    .insert({
      client_id: clientId,
      weight: weight ?? null,
      body_fat: bodyFat ?? null,
      chest: chest ?? null,
      waist: waist ?? null,
      date,
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to save measurement.');

  return data;
}

export async function saveFitnessAssessment({
  clientId,
  assessment,
}: {
  clientId: string;
  assessment: FitnessAssessment;
}) {
  const completedAssessment = {
    ...assessment,
    completed_at: new Date().toISOString(),
  };

  const { error: questionnaireError } = await supabase
    .from('medical_questionnaire')
    .upsert({
      client_id: clientId,
      responses: completedAssessment,
      updated_at: new Date().toISOString(),
    });

  throwIfSupabaseError(questionnaireError, 'Unable to save your assessment.');

  const { error: deleteGoalError } = await supabase
    .from('goals')
    .delete()
    .eq('client_id', clientId)
    .eq('goal_type', 'primary');

  throwIfSupabaseError(deleteGoalError, 'Unable to update your goal.');

  const { error: goalError } = await supabase.from('goals').insert({
    client_id: clientId,
    goal_type: 'primary',
    target: `${completedAssessment.primaryGoal} | Goal Weight: ${completedAssessment.goalWeight.value} ${completedAssessment.goalWeight.unit}`,
  });

  throwIfSupabaseError(goalError, 'Unable to save your goal.');

  await addMeasurement({
    clientId,
    weight: completedAssessment.currentWeightKg,
    date: todayDate(),
  });

  return completedAssessment;
}

export async function getFitnessProfileSummary(
  clientId: string
): Promise<FitnessProfileSummary | null> {
  const [assessment, measurements] = await Promise.all([
    getFitnessAssessment(clientId),
    getMeasurements(clientId),
  ]);

  if (!assessment) {
    return null;
  }

  const latestMeasurement = measurements[0];
  const currentWeightKg =
    latestMeasurement?.weight ?? assessment.currentWeightKg;

  return {
    assessment,
    latestMeasurement,
    measurementCount: measurements.length,
    startingWeightKg: assessment.startingWeightKg,
    currentWeightKg,
    goalWeightKg: assessment.goalWeightKg,
    bmi: calculateBmi(assessment.heightCm, currentWeightKg ?? undefined),
  };
}
