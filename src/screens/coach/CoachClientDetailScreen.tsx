import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { useClientWorkouts, useWorkoutHistory } from '@/hooks/useWorkout';
import { ClientStackParamList } from '@/types';
import { formatFriendlyDate } from '@/utils/date';
import { formatHeight, formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

type DetailRoute = RouteProp<ClientStackParamList, 'CoachClientDetail'>;

export default function CoachClientDetailScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRoute>();
  const { clientId, clientName = 'Client' } = route.params;
  const { data, error, isLoading, refresh } = useFitnessProfile(clientId);
  const workouts = useClientWorkouts(clientId);
  const history = useWorkoutHistory(clientId);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      workouts.refresh();
      history.refresh();
    }, [history.refresh, refresh, workouts.refresh])
  );

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{clientName}</Text>
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
      <Text style={[styles.eyebrow, { color: colors.primary }]}>Client Overview</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{clientName}</Text>

      <View style={styles.weightRow}>
        <Card style={styles.weightCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Starting</Text>
          <Text style={[styles.weightValue, { color: colors.textPrimary }]}>{formatWeight(data.startingWeightKg)}</Text>
        </Card>
        <Card style={styles.weightCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Current</Text>
          <Text style={[styles.weightValue, { color: colors.primary }]}>{formatWeight(data.currentWeightKg)}</Text>
        </Card>
        <Card style={styles.weightCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Goal</Text>
          <Text style={[styles.weightValue, { color: colors.textPrimary }]}>{formatWeight(data.goalWeightKg)}</Text>
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Fitness Overview</Text>
        <Metric label="Height" value={formatHeight(data.assessment.heightCm)} />
        <Metric label="BMI" value={data.bmi?.toFixed(1) ?? 'Not available'} />
        <Metric label="Primary Goal" value={data.assessment.primaryGoal} />
        <Metric label="Experience" value={data.assessment.experienceLevel} />
        <Metric label="Activity Level" value={data.assessment.activityLevel} />
        <Metric label="Training Frequency" value={data.assessment.trainingFrequency} />
        <Metric label="Preferred Session" value={data.assessment.sessionDuration} />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Training Preferences</Text>
        <Metric label="Workout Location" value={data.assessment.workoutLocation} />
        <Metric label="Equipment" value={data.assessment.equipment.join(', ') || 'None selected'} />
        <Metric label="Focus Areas" value={data.assessment.focusAreas.join(', ') || 'None selected'} />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Progress</Text>
        <Metric label="Starting Weight" value={formatWeight(data.startingWeightKg)} />
        <Metric label="Current Weight" value={formatWeight(data.currentWeightKg)} />
        <Metric label="Goal Weight" value={formatWeight(data.goalWeightKg)} />
        <Metric label="Latest Body Fat" value={formatMetric(data.latestMeasurement?.body_fat, '%')} />
        <Metric label="Latest Chest" value={formatMetric(data.latestMeasurement?.chest, 'in')} />
        <Metric label="Latest Waist" value={formatMetric(data.latestMeasurement?.waist, 'in')} />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Health & Safety</Text>
        <Metric
          label="Status"
          value={
            data.assessment.healthNotes || data.assessment.limitations.length > 0
              ? 'Health assessment completed'
              : 'No limitations shared'
          }
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Workouts</Text>
        {workouts.data.length > 0 ? (
          workouts.data.slice(0, 3).map((workout) => (
            <Metric
              key={workout.id}
              label={workout.name}
              value={
                workout.assigned_date
                  ? formatFriendlyDate(workout.assigned_date)
                  : 'Assigned'
              }
            />
          ))
        ) : (
          <Metric label="Assigned Workouts" value="None yet" />
        )}
        {history.data.length > 0 ? (
          <Metric
            label="Recent Completion"
            value={formatFriendlyDate(history.data[0].date_completed)}
          />
        ) : (
          <Metric label="Completed Workouts" value="None yet" />
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Create Workout"
          variant="outline"
          onPress={() =>
            navigation.navigate('CoachWorkoutBuilder', { clientId })
          }
        />
        <Button
          label="View Full Assessment"
          onPress={() =>
            navigation.navigate('CoachClientAssessment', { clientId, clientName })
          }
        />
        <Button
          label="Add / View Measurements"
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
  const { colors } = useAppTheme();

  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function formatMetric(value?: number | null, suffix = '') {
  return value == null ? 'Not recorded' : `${value}${suffix ? ` ${suffix}` : ''}`;
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  weightCard: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  weightValue: {
    ...typography.h3,
    fontWeight: '800',
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricLabel: {
    ...typography.body,
    flex: 1,
  },
  metricValue: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
});
