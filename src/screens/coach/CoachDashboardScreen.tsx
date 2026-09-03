import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { AppHeader, Avatar, IconRow, StatCard } from '@/components/AppUI';
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
      <AppHeader
        title={`Coach ${coachName.split(' ')[0]}`}
        subtitle="Client overview and coaching tools"
        action={<Avatar name={coachName} />}
      />

      <View style={styles.statsRow}>
        <StatCard icon="people-outline" label="Visible Clients" value={data.length} />
        <StatCard icon="clipboard-outline" label="Profiles" value={completeProfiles} tone="success" />
      </View>
      {incompleteProfiles > 0 ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {incompleteProfiles} client{incompleteProfiles === 1 ? '' : 's'} still need a fitness profile.
        </Text>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Clients</Text>
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
      <Button
        label="View All Clients"
        onPress={() => navigation.navigate('Clients')}
        style={styles.viewButton}
      />

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Coach Tools</Text>
      <IconRow
        icon="barbell-outline"
        title="Workout Programs"
        subtitle="Create workouts and manage exercises"
        onPress={() => navigation.navigate('Programs')}
      />
      <IconRow
        icon="restaurant-outline"
        title="Nutrition"
        subtitle="Create and assign meal plans"
        onPress={() => navigation.navigate('CoachNutrition')}
      />
      <IconRow
        icon="chatbubbles-outline"
        title="Messages"
        subtitle="Messaging is not enabled yet"
        onPress={() => navigation.navigate('Messages')}
      />
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

const styles = StyleSheet.create({
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  viewButton: {
    marginTop: spacing.md,
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
