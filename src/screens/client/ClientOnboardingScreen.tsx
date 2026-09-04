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
import { useAppTheme } from '@/hooks/useTheme';
import { FitnessAssessment, HeightUnit, WeightUnit } from '@/types';
import {
  calculateAge,
  formatHeight,
  formatWeight,
  weightToKg,
} from '@/utils/fitness';
import { radius, spacing, typography } from '@/utils/theme';

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
const noneLimitation = 'None';

export default function ClientOnboardingScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { saveAssessment, isSaving, error } = useFitnessProfile(profile?.id);
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState<string>('Fat Loss');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
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

  const dob = useMemo(
    () => buildDateOfBirth(birthMonth, birthDay, birthYear),
    [birthDay, birthMonth, birthYear]
  );
  const heightCm = useMemo(() => {
    if (heightUnit === 'cm') {
      return parsePositiveNumber(heightCmInput);
    }

    return getHeightCmFromImperial(feet, inches);
  }, [feet, heightCmInput, heightUnit, inches]);
  const currentWeightNumber = parsePositiveNumber(currentWeight);
  const goalWeightNumber = parsePositiveNumber(goalWeight);
  const currentWeightKg = currentWeightNumber ? weightToKg(currentWeightNumber, weightUnit) : 0;
  const goalWeightKg = goalWeightNumber ? weightToKg(goalWeightNumber, weightUnit) : 0;
  const roundedHeightCm = heightCm ? Math.round(heightCm) : 0;
  const bmi = calculateBmi(roundedHeightCm, currentWeightKg);

  const assessment: FitnessAssessment = {
    primaryGoal,
    dateOfBirth: dob.value,
    age: dob.age,
    heightUnit,
    heightCm: roundedHeightCm,
    heightFeet: heightUnit === 'ft_in' ? parsePositiveNumber(feet) ?? undefined : undefined,
    heightInches: heightUnit === 'ft_in' ? parseWholeNumber(inches) ?? undefined : undefined,
    startingWeightKg: currentWeightKg,
    currentWeightKg,
    currentWeight: { value: currentWeightNumber ?? 0, unit: weightUnit },
    goalWeightKg,
    goalWeight: { value: goalWeightNumber ?? 0, unit: weightUnit },
    bmi,
    experienceLevel,
    activityLevel,
    trainingFrequency,
    workoutLocation,
    equipment,
    focusAreas,
    sessionDuration,
    healthNotes,
    limitations: limitations.includes(noneLimitation) ? [] : limitations,
  };

  const canContinue = validateStep(step);

  const onSubmit = async () => {
    if (isSaving) return;

    const saved = await saveAssessment(assessment);
    if (saved) {
      setIsComplete(true);
      navigation.navigate('ClientApp', { screen: 'Home' });
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
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Current BMI</Text>
          <Text style={[styles.bmiValue, { color: colors.primary }]}>{bmi?.toFixed(1) ?? 'Not available'}</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
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
      {error ? <Text style={[styles.inlineError, { color: colors.error }]}>{error}</Text> : null}
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
    if (currentStep === 2) return dob.isValid;
    if (currentStep === 3) {
      if (heightUnit === 'cm') return Boolean(heightCm && heightCm > 0);
      return hasValidImperialHeight(feet, inches);
    }
    if (currentStep === 4) return Boolean(currentWeightNumber && currentWeightNumber > 0);
    if (currentStep === 5) return Boolean(goalWeightNumber && goalWeightNumber > 0);
    if (currentStep === 10) return equipment.length > 0;
    if (currentStep === 11) return focusAreas.length > 0;
    return true;
  }

  function handleHeightUnitChange(nextUnit: HeightUnit) {
    if (nextUnit === heightUnit) return;

    if (nextUnit === 'ft_in') {
      const cmValue = parsePositiveNumber(heightCmInput);
      if (cmValue) {
        const totalInches = Math.round(cmValue / 2.54);
        setFeet(String(Math.floor(totalInches / 12)));
        setInches(String(totalInches % 12));
      }
    } else {
      const cmValue = getHeightCmFromImperial(feet, inches);
      if (cmValue) {
        setHeightCmInput(String(Math.round(cmValue)));
      }
    }

    setHeightUnit(nextUnit);
  }

  function handleLimitationChange(values: string[]) {
    const previous = limitations;
    const selectedNoneNow =
      values.includes(noneLimitation) && !previous.includes(noneLimitation);

    if (selectedNoneNow || values.length === 0) {
      setLimitations([noneLimitation]);
      return;
    }

    setLimitations(values.filter((value) => value !== noneLimitation));
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
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
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
          <View style={styles.dobRow}>
            <NumericInput
              label="Month"
              value={birthMonth}
              onChangeText={(value) => setBirthMonth(cleanWholeNumberInput(value).slice(0, 2))}
              placeholder="MM"
              maxLength={2}
              keyboardType="number-pad"
              style={styles.dobField}
            />
            <NumericInput
              label="Day"
              value={birthDay}
              onChangeText={(value) => setBirthDay(cleanWholeNumberInput(value).slice(0, 2))}
              placeholder="DD"
              maxLength={2}
              keyboardType="number-pad"
              style={styles.dobField}
            />
            <NumericInput
              label="Year"
              value={birthYear}
              onChangeText={(value) => setBirthYear(cleanWholeNumberInput(value).slice(0, 4))}
              placeholder="YYYY"
              maxLength={4}
              keyboardType="number-pad"
              style={styles.yearField}
            />
          </View>
          <Card style={styles.previewCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
            <Text style={[styles.previewValue, { color: dob.isValid ? colors.textPrimary : colors.textMuted }]}>
              {dob.isValid ? dob.label : 'Enter a valid date'}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Age</Text>
            <Text style={[styles.previewValue, { color: dob.isValid ? colors.primary : colors.textMuted }]}>
              {dob.isValid ? String(dob.age) : 'Not available'}
            </Text>
          </Card>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <SectionHeader title="Height" subtitle="Choose the unit that feels natural." />
          <UnitToggle options={['ft_in', 'cm']} value={heightUnit} onChange={handleHeightUnitChange} />
          {heightUnit === 'ft_in' ? (
            <View style={styles.row}>
              <NumericInput
                label="Feet"
                value={feet}
                onChangeText={(value) => setFeet(cleanWholeNumberInput(value).slice(0, 1))}
                suffix="ft"
                keyboardType="number-pad"
                style={styles.rowField}
              />
              <NumericInput
                label="Inches"
                value={inches}
                onChangeText={(value) => setInches(cleanWholeNumberInput(value).slice(0, 2))}
                suffix="in"
                keyboardType="number-pad"
                style={styles.rowField}
              />
            </View>
          ) : (
            <NumericInput
              label="Height"
              value={heightCmInput}
              onChangeText={setHeightCmInput}
              suffix="cm"
            />
          )}
          {heightUnit === 'ft_in' && !hasValidImperialHeight(feet, inches) ? (
            <Text style={[styles.inlineError, { color: colors.error }]}>Enter feet and inches from 0 to 11.</Text>
          ) : null}
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
            <Text style={[styles.bmiValue, { color: colors.primary }]}>{bmi?.toFixed(1) ?? 'Not available'}</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Current Weight: {formatWeight(currentWeightKg)}</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Height: {formatHeight(heightCm)}</Text>
            <Text style={[styles.note, { color: colors.textMuted }]}>BMI is one general measurement and does not represent your complete fitness level.</Text>
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
            onChange={handleLimitationChange}
          />
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
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
          <Summary label="DOB / Age" value={`${dob.label} / ${assessment.age}`} />
          <Summary label="Height" value={formatHeight(roundedHeightCm)} />
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

function cleanWholeNumberInput(value: string) {
  return value.replace(/\D/g, '');
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseWholeNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getHeightCmFromImperial(feet: string, inches: string) {
  if (!hasValidImperialHeight(feet, inches)) return null;

  return Number(feet) * 30.48 + Number(inches) * 2.54;
}

function hasValidImperialHeight(feet: string, inches: string) {
  const feetValue = parsePositiveNumber(feet);
  const inchesValue = parseWholeNumber(inches);

  return Boolean(feetValue && inchesValue != null && inchesValue >= 0 && inchesValue <= 11);
}

function buildDateOfBirth(month: string, day: string, year: string) {
  const emptyDob = {
    age: 0,
    isValid: false,
    label: 'Enter a valid date',
    value: '',
  };

  if (month.length < 1 || day.length < 1 || year.length !== 4) {
    return emptyDob;
  }

  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const yearNumber = Number(year);
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(dayNumber) ||
    !Number.isInteger(yearNumber) ||
    yearNumber < 1900 ||
    yearNumber > currentYear ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return emptyDob;
  }

  const birthDate = new Date(yearNumber, monthNumber - 1, dayNumber);
  if (
    birthDate.getFullYear() !== yearNumber ||
    birthDate.getMonth() !== monthNumber - 1 ||
    birthDate.getDate() !== dayNumber ||
    birthDate > new Date()
  ) {
    return emptyDob;
  }

  const value = [
    String(yearNumber).padStart(4, '0'),
    String(monthNumber).padStart(2, '0'),
    String(dayNumber).padStart(2, '0'),
  ].join('-');
  const label = birthDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    age: calculateAge(value),
    isValid: true,
    label,
    value,
  };
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
      <SummaryText label={label} value={value} />
    </View>
  );
}

function SummaryText({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{value}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  dobRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dobField: { flex: 1 },
  yearField: { flex: 1.35 },
  completionCard: { gap: spacing.sm, marginBottom: spacing.lg },
  bodyText: { ...typography.body },
  metricLabel: { ...typography.caption, fontWeight: '700' },
  previewCard: { gap: spacing.xs, marginBottom: spacing.lg },
  previewValue: { ...typography.h3 },
  bmiCard: { gap: spacing.sm },
  bmiValue: { ...typography.h1, fontSize: 44 },
  note: { ...typography.caption },
  largeInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '700',
  },
  reviewCard: { gap: spacing.sm, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  summaryLabel: { ...typography.caption, flex: 1 },
  summaryValue: { ...typography.body, fontWeight: '600', flex: 1, textAlign: 'right' },
  notesInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    textAlignVertical: 'top',
  },
  inlineError: { ...typography.caption, marginTop: spacing.md },
});
