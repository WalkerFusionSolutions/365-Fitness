import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, IconRow, ProgressBar, SectionHeader, StatCard } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { formatHeight, formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

export default function ClientProgressScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const fitness = useFitnessProfile(profile?.id);

  if (fitness.isLoading) {
    return <LoadingView label="Loading progress..." />;
  }

  if (fitness.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load progress"
          subtitle={fitness.error}
          onRetry={fitness.refresh}
        />
      </Screen>
    );
  }

  if (!fitness.data) {
    return (
      <Screen>
        <AppHeader title="Progress" subtitle="Measurements and assessment trends." />
        <Card style={styles.emptyCard}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Complete your fitness profile</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Your progress view starts after your assessment and first measurements are saved.
          </Text>
          <Button label="Get Started" onPress={() => navigation.navigate('ClientOnboarding')} />
        </Card>
      </Screen>
    );
  }

  const percent = getProgressPercent(
    fitness.data.startingWeightKg,
    fitness.data.currentWeightKg,
    fitness.data.goalWeightKg
  );

  return (
    <Screen>
      <AppHeader title="Progress" subtitle="Your real assessment and measurement snapshot." />

      <View style={styles.statsRow}>
        <StatCard icon="scale-outline" label="Current" value={formatWeight(fitness.data.currentWeightKg)} />
        <StatCard icon="flag-outline" label="Goal" value={formatWeight(fitness.data.goalWeightKg)} tone="success" />
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.row}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Weight Goal</Text>
          <Text style={[styles.percent, { color: colors.primary }]}>{percent}%</Text>
        </View>
        <ProgressBar value={percent} />
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Started at {formatWeight(fitness.data.startingWeightKg)}
        </Text>
      </Card>

      <SectionHeader title="Assessment" />
      <IconRow
        icon="clipboard-outline"
        title={fitness.data.assessment.primaryGoal}
        subtitle={`${fitness.data.assessment.experienceLevel} • ${fitness.data.assessment.trainingFrequency}`}
        onPress={() => navigation.navigate('ClientAssessment')}
      />
      <IconRow
        icon="body-outline"
        title="Body Metrics"
        subtitle={`Height ${formatHeight(fitness.data.assessment.heightCm)} • BMI ${fitness.data.bmi?.toFixed(1) ?? 'Not available'}`}
        onPress={() => navigation.navigate('ClientMeasurements')}
      />
      <IconRow
        icon="analytics-outline"
        title="Measurements"
        subtitle={`${fitness.data.measurementCount} measurement records`}
        onPress={() => navigation.navigate('ClientMeasurements')}
      />
    </Screen>
  );
}

function getProgressPercent(
  startingWeight?: number | null,
  currentWeight?: number | null,
  goalWeight?: number | null
) {
  if (!startingWeight || !currentWeight || !goalWeight) return 0;
  const total = Math.abs(startingWeight - goalWeight);
  if (total === 0) return 100;
  const moved = Math.abs(startingWeight - currentWeight);
  return Math.min(100, Math.max(0, Math.round((moved / total) * 100)));
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressCard: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  percent: {
    ...typography.h2,
  },
  emptyCard: {
    gap: spacing.md,
  },
});
