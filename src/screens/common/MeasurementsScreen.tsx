import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { UnitToggle } from '@/components/Questionnaire';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useMeasurements } from '@/hooks/useFitnessProfile';
import { ClientStackParamList, Measurement, WeightUnit } from '@/types';
import { formatWeight, weightToKg } from '@/utils/fitness';
import { colors, radius, spacing, typography } from '@/utils/theme';

type MeasurementsRoute = RouteProp<
  ClientStackParamList,
  'ClientMeasurements' | 'CoachClientMeasurements'
>;

export default function MeasurementsScreen() {
  const route = useRoute<MeasurementsRoute>();
  const { profile } = useAuth();
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? profile?.id;
  const canAdd = !params?.clientId || params.clientId === profile?.id;
  const { data, error, isLoading, isSaving, refresh, saveMeasurement } =
    useMeasurements(clientId);
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const onSave = async () => {
    const values = {
      weight: toNumber(weight)
        ? weightToKg(Number(weight), weightUnit)
        : null,
      waist: toNumber(waist),
      chest: toNumber(chest),
      bodyFat: toNumber(bodyFat),
    };

    if (!values.weight && !values.waist && !values.chest && !values.bodyFat) {
      Alert.alert('Measurement needed', 'Enter at least one measurement.');
      return;
    }

    const saved = await saveMeasurement(values);

    if (saved) {
      setWeight('');
      setWaist('');
      setChest('');
      setBodyFat('');
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
            <Text style={styles.title}>Measurements</Text>
            {params?.clientName ? (
              <Text style={styles.subtitle}>{params.clientName}</Text>
            ) : null}
            {canAdd ? (
              <Card style={styles.form}>
                <Text style={styles.cardTitle}>Add Measurement</Text>
                <Text style={styles.cardSubtitle}>
                  Supported fields: weight, waist, chest, body fat.
                </Text>
                <UnitToggle
                  options={['lb', 'kg']}
                  value={weightUnit}
                  onChange={setWeightUnit}
                />
                <Input label="Weight" value={weight} onChangeText={setWeight} suffix={weightUnit} />
                <Input label="Waist" value={waist} onChangeText={setWaist} suffix="in" />
                <Input label="Chest" value={chest} onChangeText={setChest} suffix="in" />
                <Input label="Body Fat" value={bodyFat} onChangeText={setBodyFat} suffix="%" />
                {error ? <Text style={styles.inlineError}>{error}</Text> : null}
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
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function MeasurementRow({ measurement }: { measurement: Measurement }) {
  return (
    <Card style={styles.measurementCard}>
      <Text style={styles.date}>{formatDate(measurement.date)}</Text>
      <Metric label="Weight" value={formatWeight(measurement.weight)} />
      <Metric label="Waist" value={measurement.waist} suffix="in" />
      <Metric label="Chest" value={measurement.chest} suffix="in" />
      <Metric label="Body Fat" value={measurement.body_fat} suffix="%" />
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
  if (value == null) return null;
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
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

function formatDate(value?: string | null) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  form: { gap: spacing.sm, marginBottom: spacing.lg },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  inputGroup: { gap: spacing.xs },
  inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  suffix: { ...typography.body, color: colors.textSecondary, width: 32 },
  inlineError: { ...typography.caption, color: colors.error },
  measurementCard: { gap: spacing.sm, marginBottom: spacing.sm },
  date: { ...typography.h3, color: colors.textPrimary },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { ...typography.body, color: colors.textSecondary },
  metricValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
});
