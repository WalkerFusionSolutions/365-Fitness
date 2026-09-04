import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { AppHeader, AppInput } from '@/components/AppUI';
import { UnitToggle } from '@/components/Questionnaire';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useMeasurements } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { ClientStackParamList, Measurement, WeightUnit } from '@/types';
import { formatWeight, weightToKg } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

type MeasurementsRoute = RouteProp<
  ClientStackParamList,
  'ClientMeasurements' | 'CoachClientMeasurements'
>;
type LengthUnit = 'cm' | 'in';

export default function MeasurementsScreen() {
  const { colors } = useAppTheme();
  const route = useRoute<MeasurementsRoute>();
  const { profile } = useAuth();
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? profile?.id;
  const canAdd =
    !params?.clientId || params.clientId === profile?.id || profile?.role === 'coach';
  const { data, error, isLoading, isSaving, refresh, saveMeasurement } =
    useMeasurements(clientId);
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('cm');
  const [date, setDate] = useState(todayDate());
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [neck, setNeck] = useState('');
  const [notes, setNotes] = useState('');

  const onSave = async () => {
    const values = {
      date,
      weight: toNumber(weight)
        ? weightToKg(Number(weight), weightUnit)
        : null,
      waist: toCm(waist, lengthUnit),
      chest: toCm(chest, lengthUnit),
      bodyFat: toNumber(bodyFat),
      hips: toCm(hips, lengthUnit),
      leftArm: toCm(leftArm, lengthUnit),
      rightArm: toCm(rightArm, lengthUnit),
      leftThigh: toCm(leftThigh, lengthUnit),
      rightThigh: toCm(rightThigh, lengthUnit),
      neck: toCm(neck, lengthUnit),
      notes,
    };

    if (!isValidDate(date)) {
      Alert.alert('Check the date', 'Use a valid date in YYYY-MM-DD format.');
      return;
    }

    if (
      !values.weight &&
      !values.waist &&
      !values.chest &&
      !values.bodyFat &&
      !values.hips &&
      !values.leftArm &&
      !values.rightArm &&
      !values.leftThigh &&
      !values.rightThigh &&
      !values.neck
    ) {
      Alert.alert('Measurement needed', 'Enter at least one measurement.');
      return;
    }

    const saved = await saveMeasurement(values);

    if (saved) {
      setWeight('');
      setWaist('');
      setChest('');
      setBodyFat('');
      setHips('');
      setLeftArm('');
      setRightArm('');
      setLeftThigh('');
      setRightThigh('');
      setNeck('');
      setNotes('');
    }
  };

  if (isLoading) {
    return <LoadingView label="Loading measurements..." />;
  }

  if (error && data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load measurements"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Measurements"
              subtitle={params?.clientName || 'Track progress over time.'}
            />
            {canAdd ? (
              <Card style={styles.form}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Add Measurement</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Add only the measurements recorded today. Values are stored canonically as kg and cm.
                </Text>
                <AppInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                <UnitToggle
                  options={['lb', 'kg']}
                  value={weightUnit}
                  onChange={setWeightUnit}
                />
                <Input label="Weight" value={weight} onChangeText={setWeight} suffix={weightUnit} />
                <UnitToggle options={['cm', 'in']} value={lengthUnit} onChange={setLengthUnit} />
                <Input label="Waist" value={waist} onChangeText={setWaist} suffix={lengthUnit} />
                <Input label="Chest" value={chest} onChangeText={setChest} suffix={lengthUnit} />
                <Input label="Body Fat" value={bodyFat} onChangeText={setBodyFat} suffix="%" />
                <Input label="Hips" value={hips} onChangeText={setHips} suffix={lengthUnit} />
                <Input label="Left Arm" value={leftArm} onChangeText={setLeftArm} suffix={lengthUnit} />
                <Input label="Right Arm" value={rightArm} onChangeText={setRightArm} suffix={lengthUnit} />
                <Input label="Left Thigh" value={leftThigh} onChangeText={setLeftThigh} suffix={lengthUnit} />
                <Input label="Right Thigh" value={rightThigh} onChangeText={setRightThigh} suffix={lengthUnit} />
                <Input label="Neck" value={neck} onChangeText={setNeck} suffix={lengthUnit} />
                <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
                {error ? <Text style={[styles.inlineError, { color: colors.error }]}>{error}</Text> : null}
                <Button label="Save Measurement" onPress={onSave} loading={isSaving} />
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="analytics-outline"
            title="No measurements yet."
            subtitle="Historical measurement records will appear here."
          />
        }
        renderItem={({ item }) => <MeasurementRow measurement={item} />}
      />
    </Screen>
  );
}

function Input({
  label,
  suffix,
  value,
  onChangeText,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputRow}>
        <AppInput
          label={label}
          style={styles.input}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text>
      </View>
    </View>
  );
}

function MeasurementRow({ measurement }: { measurement: Measurement }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.measurementCard}>
      <Text style={[styles.date, { color: colors.textPrimary }]}>{formatDate(measurement.date)}</Text>
      <Metric label="Weight" value={formatWeight(measurement.weight)} />
      <Metric label="Waist" value={measurement.waist} suffix="cm" />
      <Metric label="Chest" value={measurement.chest} suffix="cm" />
      <Metric label="Body Fat" value={measurement.body_fat} suffix="%" />
      <Metric label="Hips" value={measurement.hips} suffix="cm" />
      <Metric label="Left Arm" value={measurement.left_arm} suffix="cm" />
      <Metric label="Right Arm" value={measurement.right_arm} suffix="cm" />
      <Metric label="Left Thigh" value={measurement.left_thigh} suffix="cm" />
      <Metric label="Right Thigh" value={measurement.right_thigh} suffix="cm" />
      <Metric label="Neck" value={measurement.neck} suffix="cm" />
      <Metric label="Notes" value={measurement.notes} />
    </Card>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value?: number | string | null;
  suffix?: string;
}) {
  const { colors } = useAppTheme();

  if (value == null) return null;
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toCm(value: string, unit: LengthUnit) {
  const parsed = toNumber(value);
  if (!parsed) return null;
  return unit === 'cm' ? parsed : Math.round(parsed * 2.54 * 10) / 10;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
}

function formatDate(value?: string | null) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 120 },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  cardTitle: { ...typography.h3 },
  cardSubtitle: { ...typography.caption },
  inputGroup: { gap: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
  },
  suffix: { ...typography.body, width: 32 },
  inlineError: { ...typography.caption },
  measurementCard: { gap: spacing.sm, marginBottom: spacing.sm },
  date: { ...typography.h3 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { ...typography.body },
  metricValue: { ...typography.body, fontWeight: '600' },
});
