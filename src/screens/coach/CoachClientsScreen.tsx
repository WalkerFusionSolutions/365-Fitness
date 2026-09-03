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
import { AppHeader, Badge, ProfileAvatar, SearchInput } from '@/components/AppUI';
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
  const [search, setSearch] = React.useState('');
  const filtered = data.filter((item) =>
    (item.profile.full_name || 'Client')
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

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
        data={filtered}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Clients"
              subtitle="Review progress, workouts, and nutrition."
            />
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search clients"
            />
            {error ? (
              <Text style={[styles.inlineError, { color: colors.error }]}>{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={search ? 'No clients found.' : 'No active clients yet.'}
            subtitle={search ? 'Try a different name.' : 'Assigned or visible clients will appear here.'}
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
  const summary = client.fitnessSummary;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.clientCard}>
        <ProfileAvatar name={name} uri={client.profile.avatar_url} size={50} />
        <View style={styles.clientText}>
          <Text style={[styles.clientName, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {summary
              ? `${summary.assessment.primaryGoal} • ${formatWeight(summary.currentWeightKg)} to ${formatWeight(summary.goalWeightKg)}`
              : 'Fitness profile incomplete'}
          </Text>
        </View>
        <Badge label={client.isPrivilegedAccess ? 'Visible' : 'Assigned'} tone={client.isPrivilegedAccess ? 'warning' : 'success'} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  title: {
    ...typography.h1,
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
  clientText: {
    flex: 1,
  },
  clientName: {
    ...typography.h3,
  },
});
