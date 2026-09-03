import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAppTheme } from '@/hooks/useTheme';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { CoachVisibleClient } from '@/types';
import { formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

export default function CoachClientsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } = useCoachVisibleClients();

  if (isLoading) {
    return <LoadingView label="Loading clients..." />;
  }

  if (error && data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load clients"
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
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Your Clients</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Supabase permissions decide whether this shows assigned clients or all development clients.
            </Text>
            {error ? (
              <Text style={[styles.inlineError, { color: colors.error }]}>{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No active clients yet."
            subtitle="Assigned clients or development-visible clients will appear here."
          />
        }
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            onPress={() =>
              navigation.navigate('CoachClientDetail', {
                clientId: item.profile.id,
                clientName: item.profile.full_name,
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function ClientRow({
  client,
  onPress,
}: {
  client: CoachVisibleClient;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const name = client.profile.full_name?.trim() || 'Client';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const summary = client.fitnessSummary;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.clientCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryDark }]}>
          <Text style={styles.avatarText}>{initials || 'CL'}</Text>
        </View>
        <View style={styles.clientText}>
          <Text style={[styles.clientName, { color: colors.textPrimary }]}>{name}</Text>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
  },
  cardSubtitle: {
    ...typography.caption,
  },
  inlineError: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});
