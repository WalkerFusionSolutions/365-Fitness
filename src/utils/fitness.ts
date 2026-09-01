import { FitnessAssessment, WeightUnit } from '@/types';

export function poundsToKg(value: number) {
  return Math.round(value * 0.45359237 * 10) / 10;
}

export function kgToPounds(value: number) {
  return Math.round(value * 2.20462262 * 10) / 10;
}

export function weightToKg(value: number, unit: WeightUnit) {
  return unit === 'kg' ? value : poundsToKg(value);
}

export function formatWeight(kg?: number | null, unit: WeightUnit = 'lb') {
  if (kg == null) {
    return 'Not set';
  }

  const value = unit === 'kg' ? kg : kgToPounds(kg);
  return `${Math.round(value * 10) / 10} ${unit}`;
}

export function formatHeight(cm?: number | null) {
  if (!cm) {
    return 'Not set';
  }

  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}"`;
}

export function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function summarizeAssessment(assessment: FitnessAssessment) {
  return [
    ['Primary Goal', assessment.primaryGoal],
    ['Height', formatHeight(assessment.heightCm)],
    ['Starting Weight', formatWeight(assessment.startingWeightKg)],
    ['Current Weight', formatWeight(assessment.currentWeightKg)],
    ['Goal Weight', formatWeight(assessment.goalWeightKg)],
    ['BMI', assessment.bmi?.toFixed(1) ?? 'Not available'],
    ['Experience', assessment.experienceLevel],
    ['Activity', assessment.activityLevel],
    ['Training', assessment.trainingFrequency],
    ['Location', assessment.workoutLocation],
    ['Session Duration', assessment.sessionDuration],
    ['Equipment', assessment.equipment.join(', ') || 'None selected'],
    ['Focus Areas', assessment.focusAreas.join(', ') || 'None selected'],
  ] as const;
}
