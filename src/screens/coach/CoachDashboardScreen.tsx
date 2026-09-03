import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { useAppTheme } from '@/hooks/useTheme';
import { CoachVisibleClient } from '@/types';
import { formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

export default function CoachDashboardScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data, error, isLoading, refresh } = useCoachVisibleClients();
  const coachName = profile?.full_name?.trim() || 'Coach';
  const completeProfiles = data.filter((item) => item.fitnessSummary).length;
  const incompleteProfiles = data.length - completeProfiles;

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
      <Text style={[styles.brand, { color: colors.primary }]}>365 FITNESS</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Coach Dashboard</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back, {coachName}</Text>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Clients</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{data.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Visible Clients</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{completeProfiles}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fitness Profiles</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{incompleteProfiles}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Incomplete</Text>
        </Card>
      </View>
      <Button
        label="View All"
        onPress={() => navigation.navigate('Clients')}
        style={styles.viewButton}
      />

      {data.slice(0, 3).map((client) => (
        <ClientPreview
          key={client.profile.id}
          client={client}
          onPress={() =>
            navigation.navigate('CoachClientDetail', {
              clientId: client.profile.id,
              clientName: client.profile.full_name,
            })
          }
        />
      ))}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Coach Tools</Text>
      <RoadmapCard title="Workout Programs" subtitle="Create workouts from the Programs tab." />
      <RoadmapCard title="Nutrition" subtitle="Coming soon." />
      <RoadmapCard title="Messages" subtitle="Coming soon." />
      <RoadmapCard title="Reports" subtitle="Coming soon." />
    </Screen>
  );
}

function ClientPreview({
  client,
  onPress,
}: {
  client: CoachVisibleClient;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const initials = client.profile.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const summary = client.fitnessSummary;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.clientPreview}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryDark }]}>
          <Text style={styles.avatarText}>{initials || 'CL'}</Text>
        </View>
        <View style={styles.clientText}>
          <Text style={[styles.clientName, { color: colors.textPrimary }]}>{client.profile.full_name || 'Client'}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {summary
              ? `${summary.assessment.primaryGoal} • ${formatWeight(summary.currentWeightKg)} to ${formatWeight(summary.goalWeightKg)}`
              : 'Fitness profile incomplete'}
          </Text>
        </View>
        <Text style={[styles.viewText, { color: colors.primary }]}>View</Text>
      </Card>
    </Pressable>
  );
}

function RoadmapCard({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.roadmapCard}>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
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
    padding: spacing.sm,
  },
  statValue: {
    ...typography.h1,
  },
  statLabel: {
    ...typography.caption,
  },
  viewButton: {
    marginTop: spacing.md,
  },
  roadmapCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  clientPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clientText: {
    flex: 1,
  },
  clientName: {
    ...typography.h3,
  },
  viewText: {
    ...typography.caption,
    fontWeight: '700',
  },
  cardTitle: {
    ...typography.h3,
  },
  cardSubtitle: {
    ...typography.body,
  },
});
