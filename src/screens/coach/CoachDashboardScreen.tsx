import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { AppHeader, Avatar, IconRow, StatCard } from '@/components/AppUI';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppTheme } from '@/hooks/useTheme';
import { CoachVisibleClient } from '@/types';
import { formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

export default function CoachDashboardScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data, error, isLoading, refresh } = useCoachVisibleClients();
  const notifications = useNotifications(profile?.id);
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
        action={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Open notifications"
              onPress={() => navigation.navigate('Notifications')}
              style={[styles.bellButton, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              {notifications.unreadCount > 0 ? (
                <View style={[styles.bellBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.bellBadgeText, { color: colors.primaryText }]}>
                    {Math.min(notifications.unreadCount, 9)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Avatar name={coachName} />
          </View>
        }
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
        icon="calendar-outline"
        title="Schedule"
        subtitle="Appointments, check-ins, and progress reviews"
        onPress={() => navigation.navigate('Schedule')}
      />
      <IconRow
        icon="chatbubbles-outline"
        title="Messages"
        subtitle="Review form videos and send feedback"
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bellButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bellBadge: {
    alignItems: 'center',
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  bellBadgeText: {
    fontSize: 11,
    fontWeight: '900',
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
