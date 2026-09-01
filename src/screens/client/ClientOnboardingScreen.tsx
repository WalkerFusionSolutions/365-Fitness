import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  MultiSelectCards,
  NumericInput,
  ProgressIndicator,
  QuestionnaireNav,
  SectionHeader,
  SingleSelectCards,
  UnitToggle,
} from '@/components/Questionnaire';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { calculateBmi } from '@/services/fitness.service';
import { FitnessAssessment, HeightUnit, WeightUnit } from '@/types';
import {
  calculateAge,
  formatHeight,
  formatWeight,
  weightToKg,
} from '@/utils/fitness';
import { colors, radius, spacing, typography } from '@/utils/theme';

const TOTAL_STEPS = 15;

const goals = [
  'Fat Loss',
  'Build Muscle',
  'Strength',
  'Improve Health',
  'Athletic Performance',
] as const;
const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
const activities = ['Lightly Active', 'Moderately Active', 'Very Active'] as const;
const frequencies = ['2 days/week', '3 days/week', '4 days/week', '5+ days/week'] as const;
const locations = ['Gym', 'Home', 'Outdoors', 'Mixed'] as const;
const equipmentOptions = ['Dumbbells', 'Barbell', 'Machines', 'Bands', 'Kettlebells', 'Bodyweight'] as const;
const focusOptions = ['Core', 'Upper Body', 'Lower Body', 'Mobility', 'Cardio', 'Full Body'] as const;
const durations = ['30 min', '45 min', '60 min', '75+ min'] as const;
const limitationOptions = ['Knee', 'Back', 'Shoulder', 'Wrist', 'Cardio limitation', 'None'] as const;

export default function ClientOnboardingScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { saveAssessment, isSaving, error } = useFitnessProfile(profile?.id);
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState<string>('Fat Loss');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('ft_in');
  const [feet, setFeet] = useState('5');
  const [inches, setInches] = useState('10');
  const [heightCmInput, setHeightCmInput] = useState('178');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [currentWeight, setCurrentWeight] = useState('178');
  const [goalWeight, setGoalWeight] = useState('170');
  const [experienceLevel, setExperienceLevel] = useState<string>('Beginner');
  const [activityLevel, setActivityLevel] = useState<string>('Moderately Active');
  const [trainingFrequency, setTrainingFrequency] = useState<string>('3 days/week');
  const [workoutLocation, setWorkoutLocation] = useState<string>('Gym');
  const [equipment, setEquipment] = useState<string[]>(['Dumbbells']);
  const [focusAreas, setFocusAreas] = useState<string[]>(['Full Body']);
  const [sessionDuration, setSessionDuration] = useState<string>('45 min');
  const [limitations, setLimitations] = useState<string[]>(['None']);
  const [healthNotes, setHealthNotes] = useState('');

  const heightCm = useMemo(() => {
    if (heightUnit === 'cm') {
      return Number(heightCmInput);
    }

    return Number(feet) * 30.48 + Number(inches) * 2.54;
  }, [feet, heightCmInput, heightUnit, inches]);
  const currentWeightNumber = Number(currentWeight);
  const goalWeightNumber = Number(goalWeight);
  const currentWeightKg = weightToKg(currentWeightNumber, weightUnit);
  const goalWeightKg = weightToKg(goalWeightNumber, weightUnit);
  const bmi = calculateBmi(heightCm, currentWeightKg);

  const assessment: FitnessAssessment = {
    primaryGoal,
    dateOfBirth,
    age: calculateAge(dateOfBirth),
    heightUnit,
    heightCm: Math.round(heightCm),
    heightFeet: heightUnit === 'ft_in' ? Number(feet) : undefined,
    heightInches: heightUnit === 'ft_in' ? Number(inches) : undefined,
    startingWeightKg: currentWeightKg,
    currentWeightKg,
    currentWeight: { value: currentWeightNumber, unit: weightUnit },
    goalWeightKg,
    goalWeight: { value: goalWeightNumber, unit: weightUnit },
    bmi,
    experienceLevel,
    activityLevel,
    trainingFrequency,
    workoutLocation,
    equipment,
    focusAreas,
    sessionDuration,
    healthNotes,
    limitations: limitations.includes('None') ? [] : limitations,
  };

  const canContinue = validateStep(step);

  const onSubmit = async () => {
    const saved = await saveAssessment(assessment);
    if (saved) {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return (
      <Screen>
        <SectionHeader
          title="Fitness Profile Complete"
          subtitle="Your coach can now use this information to personalize your plan."
        />
        <Card style={styles.completionCard}>
          <Text style={styles.metricLabel}>Current BMI</Text>
          <Text style={styles.bmiValue}>{bmi?.toFixed(1) ?? 'Not available'}</Text>
          <Text style={styles.bodyText}>
            Your assessment and starting measurement were saved.
          </Text>
        </Card>
        <Button label="Back to Profile" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ProgressIndicator current={step} total={TOTAL_STEPS} />
      {renderStep()}
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      <QuestionnaireNav
        canGoBack={step > 1}
        canContinue={canContinue}
        continueLabel={step === TOTAL_STEPS ? 'Save Assessment' : 'Continue'}
        isLoading={isSaving}
        onBack={() => setStep((value) => Math.max(value - 1, 1))}
        onContinue={() => {
          if (!canContinue) {
            Alert.alert('Almost there', 'Complete this step to continue.');
            return;
          }
          if (step === TOTAL_STEPS) {
            onSubmit();
          } else {
            setStep((value) => Math.min(value + 1, TOTAL_STEPS));
          }
        }}
      />
    </Screen>
  );

  function validateStep(currentStep: number) {
    if (currentStep === 2) return calculateAge(dateOfBirth) > 0;
    if (currentStep === 3) return heightCm > 0;
    if (currentStep === 4) return currentWeightNumber > 0;
    if (currentStep === 5) return goalWeightNumber > 0;
    if (currentStep === 10) return equipment.length > 0;
    if (currentStep === 11) return focusAreas.length > 0;
    return true;
  }

  function renderStep() {
    if (step === 1) {
      return (
        <>
          <SectionHeader
            title="Welcome"
            subtitle="Build your fitness profile so your plan starts with the right context."
          />
          <Card>
            <Text style={styles.bodyText}>
              This takes a few minutes. Your answers are saved to your authenticated fitness profile.
            </Text>
          </Card>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <SectionHeader title="Date of Birth" subtitle="Used to estimate age for your profile." />
          <TextInput
            style={styles.largeInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <SectionHeader title="Height" subtitle="Choose the unit that feels natural." />
          <UnitToggle options={['ft_in', 'cm']} value={heightUnit} onChange={setHeightUnit} />
          {heightUnit === 'ft_in' ? (
            <View style={styles.row}>
              <NumericInput label="Feet" value={feet} onChangeText={setFeet} suffix="ft" />
              <NumericInput label="Inches" value={inches} onChangeText={setInches} suffix="in" />
            </View>
          ) : (
            <NumericInput label="Height" value={heightCmInput} onChangeText={setHeightCmInput} suffix="cm" />
          )}
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <SectionHeader title="Current Weight" subtitle="This becomes your starting weight." />
          <UnitToggle options={['lb', 'kg']} value={weightUnit} onChange={setWeightUnit} />
          <NumericInput label="Current Weight" value={currentWeight} onChangeText={setCurrentWeight} suffix={weightUnit} />
        </>
      );
    }

    if (step === 5) {
      return (
        <>
          <SectionHeader title="Goal Weight" subtitle="Use your best target for now." />
          <NumericInput label="Goal Weight" value={goalWeight} onChangeText={setGoalWeight} suffix={weightUnit} />
        </>
      );
    }

    if (step === 6) {
      return (
        <>
          <SectionHeader title="Your BMI" subtitle="Based on your current height and weight." />
          <Card style={styles.bmiCard}>
            <Text style={styles.bmiValue}>{bmi?.toFixed(1) ?? 'Not available'}</Text>
            <Text style={styles.bodyText}>Current Weight: {formatWeight(currentWeightKg)}</Text>
            <Text style={styles.bodyText}>Height: {formatHeight(heightCm)}</Text>
            <Text style={styles.note}>BMI is one general measurement and does not represent your complete fitness level.</Text>
          </Card>
        </>
      );
    }

    if (step === 7) return selectStep('Primary Goal', goals, primaryGoal, setPrimaryGoal);
    if (step === 8) return selectStep('Experience Level', levels, experienceLevel, setExperienceLevel);
    if (step === 9) return selectStep('Activity Level', activities, activityLevel, setActivityLevel);
    if (step === 10) return selectStep('Training Frequency', frequencies, trainingFrequency, setTrainingFrequency);
    if (step === 11) return selectStep('Workout Location', locations, workoutLocation, setWorkoutLocation);
    if (step === 12) {
      return (
        <>
          <SectionHeader title="Equipment" subtitle="Select everything you can use regularly." />
          <MultiSelectCards options={equipmentOptions.map(toOption)} values={equipment} onChange={setEquipment} />
        </>
      );
    }
    if (step === 13) {
      return (
        <>
          <SectionHeader title="Focus Areas" subtitle="Pick the areas you care about most." />
          <MultiSelectCards options={focusOptions.map(toOption)} values={focusAreas} onChange={setFocusAreas} />
          <SectionHeader title="Session Duration" />
          <SingleSelectCards options={durations.map(toOption)} value={sessionDuration} onChange={setSessionDuration} />
        </>
      );
    }

    if (step === 14) {
      return (
        <>
          <SectionHeader title="Health & Limitations" subtitle="Optional. Share anything your coach should consider." />
          <MultiSelectCards
            options={limitationOptions.map(toOption)}
            values={limitations}
            onChange={(values) => setLimitations(values.includes('None') ? ['None'] : values)}
          />
          <TextInput
            style={styles.notesInput}
            placeholder="Optional notes"
            placeholderTextColor={colors.textMuted}
            value={healthNotes}
            onChangeText={setHealthNotes}
            multiline
          />
        </>
      );
    }

    return (
      <>
        <SectionHeader
          title="Review"
          subtitle="Check your assessment before saving. Use Back to correct anything."
        />
        <Card style={styles.reviewCard}>
          <Summary label="Goal" value={primaryGoal} />
          <Summary label="DOB / Age" value={`${dateOfBirth} / ${assessment.age}`} />
          <Summary label="Height" value={formatHeight(heightCm)} />
          <Summary label="Starting Weight" value={formatWeight(currentWeightKg)} />
          <Summary label="Current Weight" value={formatWeight(currentWeightKg)} />
          <Summary label="Goal Weight" value={formatWeight(goalWeightKg)} />
          <Summary label="BMI" value={bmi?.toFixed(1) ?? 'Not available'} />
          <Summary label="Experience" value={experienceLevel} />
          <Summary label="Training" value={trainingFrequency} />
          <Summary label="Location" value={workoutLocation} />
          <Summary label="Equipment" value={equipment.join(', ')} />
          <Summary label="Focus Areas" value={focusAreas.join(', ')} />
          <Summary label="Limitations" value={assessment.limitations.join(', ') || 'None shared'} />
        </Card>
      </>
    );
  }
}

function selectStep<T extends string>(
  title: string,
  options: readonly T[],
  value: string,
  onChange: (value: T) => void
) {
  return (
    <>
      <SectionHeader title={title} />
      <SingleSelectCards options={options.map(toOption)} value={value as T} onChange={onChange} />
    </>
  );
}

function toOption<T extends string>(value: T) {
  return { label: value, value };
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  completionCard: { gap: spacing.sm, marginBottom: spacing.lg },
  bodyText: { ...typography.body, color: colors.textSecondary },
  metricLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  bmiCard: { gap: spacing.sm },
  bmiValue: { ...typography.h1, color: colors.primary, fontSize: 44 },
  note: { ...typography.caption, color: colors.textMuted },
  largeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '700',
  },
  reviewCard: { gap: spacing.sm, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  summaryValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },
  notesInput: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    padding: spacing.md,
    marginTop: spacing.md,
    textAlignVertical: 'top',
  },
  inlineError: { ...typography.caption, color: colors.error, marginTop: spacing.md },
});
