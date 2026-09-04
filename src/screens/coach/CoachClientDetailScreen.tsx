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
import { AppHeader, IconRow, ProfileAvatar, StatCard } from '@/components/AppUI';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { useClientWorkouts, useWorkoutHistory } from '@/hooks/useWorkout';
import { useActiveMealPlan, useTodaysWater } from '@/hooks/useMealPlan';
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
  const mealPlan = useActiveMealPlan(clientId);
  const water = useTodaysWater(clientId);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      workouts.refresh();
      history.refresh();
      mealPlan.refresh();
      water.refresh();
    }, [history.refresh, mealPlan.refresh, refresh, water.refresh, workouts.refresh])
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
      <AppHeader
        title={clientName}
        subtitle={data.assessment.primaryGoal}
        action={<ProfileAvatar name={clientName} size={58} />}
      />

      <View style={styles.weightRow}>
        <StatCard icon="scale-outline" label="Current" value={formatWeight(data.currentWeightKg)} />
        <StatCard icon="flag-outline" label="Goal" value={formatWeight(data.goalWeightKg)} tone="success" />
      </View>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <Metric label="Height" value={formatHeight(data.assessment.heightCm)} />
        <Metric label="BMI" value={data.bmi?.toFixed(1) ?? 'Not available'} />
        <Metric label="Experience" value={data.assessment.experienceLevel} />
        <Metric label="Training" value={data.assessment.trainingFrequency} />
      </Card>

      <IconRow
        icon="clipboard-outline"
        title="Assessment"
        subtitle={`${data.assessment.workoutLocation} • ${data.assessment.sessionDuration}`}
        onPress={() => navigation.navigate('CoachClientAssessment', { clientId, clientName })}
      />
      <IconRow
        icon="body-outline"
        title="Measurements"
        subtitle={`Latest: ${formatWeight(data.currentWeightKg)}${data.latestMeasurement?.body_fat ? ` • ${data.latestMeasurement.body_fat}% body fat` : ''}`}
        onPress={() => navigation.navigate('CoachClientMeasurements', { clientId, clientName })}
      />

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress</Text>
        <Metric label="Current Weight" value={formatWeight(data.currentWeightKg)} />
        <Metric
          label="Change"
          value={formatWeightChange(data.currentWeightKg, data.startingWeightKg)}
        />
        <Metric
          label="Latest Measurement"
          value={data.latestMeasurement?.date ? formatFriendlyDate(data.latestMeasurement.date) : 'Not recorded'}
        />
        <Button
          label="View Progress"
          onPress={() => navigation.navigate('CoachClientProgress', { clientId, clientName })}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workouts</Text>
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

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nutrition</Text>
        <Metric
          label="Meal Plan"
          value={mealPlan.data?.name ?? 'None assigned'}
        />
        <Metric
          label="Water Today"
          value={`${water.data?.cups_consumed ?? 0} / ${water.data?.daily_goal_cups ?? 8} cups`}
        />
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
          label="Create Meal Plan"
          variant="outline"
          onPress={() =>
            navigation.navigate('CoachMealPlanBuilder', { clientId })
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

function formatWeightChange(current?: number | null, starting?: number | null) {
  if (current == null || starting == null) return 'Not recorded';

  const change = Math.round((current - starting) * 10) / 10;
  return `${change > 0 ? '+' : ''}${change} kg`;
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
