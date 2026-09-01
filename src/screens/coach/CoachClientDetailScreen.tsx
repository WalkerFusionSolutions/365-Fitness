import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { ClientStackParamList } from '@/types';
import { formatWeight } from '@/utils/fitness';
import { colors, spacing, typography } from '@/utils/theme';

type DetailRoute = RouteProp<ClientStackParamList, 'CoachClientDetail'>;

export default function CoachClientDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRoute>();
  const { clientId, clientName = 'Client' } = route.params;
  const { data, error, isLoading, refresh } = useFitnessProfile(clientId);

  if (isLoading) {
    return <LoadingView label="Loading client overview..." />;
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load client"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <Text style={styles.title}>{clientName}</Text>
        <EmptyState
          icon="clipboard-outline"
          title="No fitness profile yet."
          subtitle="This client has not completed onboarding."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>Client Overview</Text>
      <Text style={styles.title}>{clientName}</Text>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Metric label="Starting Weight" value={formatWeight(data.startingWeightKg)} />
        <Metric label="Current Weight" value={formatWeight(data.currentWeightKg)} />
        <Metric label="Goal Weight" value={formatWeight(data.goalWeightKg)} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Training Profile</Text>
        <Metric label="Primary Goal" value={data.assessment.primaryGoal} />
        <Metric label="Experience" value={data.assessment.experienceLevel} />
        <Metric label="Activity" value={data.assessment.activityLevel} />
        <Metric label="Training" value={data.assessment.trainingFrequency} />
      </Card>

      <View style={styles.actions}>
        <Button
          label="View Assessment"
          onPress={() =>
            navigation.navigate('CoachClientAssessment', { clientId, clientName })
          }
        />
        <Button
          label="View Measurements"
          variant="secondary"
          onPress={() =>
            navigation.navigate('CoachClientMeasurements', { clientId, clientName })
          }
        />
      </View>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
});
