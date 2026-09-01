import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessAssessment } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { ClientStackParamList } from '@/types';
import { spacing, typography } from '@/utils/theme';

type AssessmentRoute = RouteProp<
  ClientStackParamList,
  'ClientAssessment' | 'CoachClientAssessment'
>;

export default function AssessmentScreen() {
  const { colors } = useAppTheme();
  const route = useRoute<AssessmentRoute>();
  const { profile } = useAuth();
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? profile?.id;
  const clientName = params?.clientName ?? profile?.full_name ?? 'Client';
  const { data, error, isLoading, refresh } = useFitnessAssessment(clientId);

  if (isLoading) {
    return <LoadingView label="Loading assessment..." />;
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load assessment"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <EmptyState
          icon="clipboard-outline"
          title="No assessment yet."
          subtitle="Completed assessment details will appear here."
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Assessment</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{clientName}</Text>

      <Section
        title="Goals"
        rows={[
          ['Primary Goal', data.primaryGoal],
          ['Goal Weight', `${data.goalWeight.value} ${data.goalWeight.unit}`],
          ['Focus Areas', data.focusAreas.join(', ') || 'None selected'],
        ]}
      />
      <Section
        title="Body"
        rows={[
          ['Age', `${data.age}`],
          ['Height', `${data.heightCm} cm`],
          ['Current Weight', `${data.currentWeight.value} ${data.currentWeight.unit}`],
          ['BMI', data.bmi?.toFixed(1) ?? 'Not available'],
        ]}
      />
      <Section
        title="Training"
        rows={[
          ['Experience', data.experienceLevel],
          ['Activity', data.activityLevel],
          ['Training', data.trainingFrequency],
          ['Session Duration', data.sessionDuration],
        ]}
      />
      <Section
        title="Equipment"
        rows={[
          ['Location', data.workoutLocation],
          ['Equipment', data.equipment.join(', ') || 'None selected'],
        ]}
      />
      <Section
        title="Health & Limitations"
        rows={[
          ['Limitations', data.limitations.join(', ') || 'None shared'],
          ['Notes', data.healthNotes || 'None shared'],
        ]}
      />
    </Screen>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: readonly (readonly [string, string])[];
}) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1 },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  card: { gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3 },
  row: { gap: spacing.xs },
  label: { ...typography.caption },
  value: { ...typography.body, fontWeight: '600' },
});
