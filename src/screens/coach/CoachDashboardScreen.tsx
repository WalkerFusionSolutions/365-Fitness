import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useCoachAssignments } from '@/hooks/useAssignments';
import { colors, spacing, typography } from '@/utils/theme';

export default function CoachDashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { data, error, isLoading, refresh } = useCoachAssignments();
  const coachName = profile?.full_name?.trim() || 'Coach';
  const activeCount = data.filter((item) => item.status === 'active').length;
  const pendingCount = data.filter((item) => item.status === 'pending').length;

  if (isLoading) {
    return <LoadingView label="Loading coach dashboard..." />;
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load dashboard"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.brand}>365 FITNESS</Text>
      <Text style={styles.title}>Coach Dashboard</Text>
      <Text style={styles.subtitle}>Welcome back, {coachName}</Text>

      <Text style={styles.sectionTitle}>Clients</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Clients</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Assignments</Text>
        </Card>
      </View>
      <Button
        label="View Clients"
        onPress={() => navigation.navigate('Clients')}
        style={styles.viewButton}
      />

      <Text style={styles.sectionTitle}>Phase Roadmap</Text>
      <RoadmapCard title="Workout Plans" subtitle="Connected in Phase 3." />
      <RoadmapCard title="Nutrition" subtitle="Coming soon." />
      <RoadmapCard title="Messages" subtitle="Coming soon." />
      <RoadmapCard title="Reports" subtitle="Coming soon." />
    </Screen>
  );
}

function RoadmapCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card style={styles.roadmapCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h1,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  viewButton: {
    marginTop: spacing.md,
  },
  roadmapCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
