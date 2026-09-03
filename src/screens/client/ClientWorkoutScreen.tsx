import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { AppHeader, Badge, SectionHeader } from '@/components/AppUI';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAppTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useClientWorkouts, useWorkoutHistory } from '@/hooks/useWorkout';
import { Workout, WorkoutHistoryItem } from '@/types';
import { formatFriendlyDate } from '@/utils/date';
import { radius, spacing, typography } from '@/utils/theme';

export default function ClientWorkoutScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const workouts = useClientWorkouts(profile?.id);
  const history = useWorkoutHistory(profile?.id);
  const isLoading = workouts.isLoading || history.isLoading;
  const isRefreshing = workouts.isRefreshing || history.isRefreshing;
  const firstWorkout = workouts.data[0];

  const refresh = () => {
    workouts.refresh();
    history.refresh();
  };

  if (isLoading) {
    return <LoadingView label="Loading workouts..." />;
  }

  if (workouts.error && workouts.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load workouts"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <AppHeader
        title="Training"
        subtitle="Assigned workouts and completed sessions."
      />

      <SectionHeader title="Today" />
      {firstWorkout ? (
        <WorkoutHero
          workout={firstWorkout}
          onOpen={() =>
            navigation.navigate('WorkoutDetail', { workoutId: firstWorkout.id })
          }
          onStart={() =>
            navigation.navigate('ActiveWorkout', { workoutId: firstWorkout.id })
          }
        />
      ) : (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="barbell-outline"
            title="No workout assigned"
            subtitle="Your coach has not assigned a workout yet."
          />
        </Card>
      )}

      <SectionHeader title="Upcoming" />
      <FlatList
        data={workouts.data.slice(1, 4)}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Assigned workouts will appear here.
          </Text>
        }
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
          />
        )}
      />

      <SectionHeader title="Recent" />
      <FlatList
        data={history.data.slice(0, 4)}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Completed workouts will appear here.
          </Text>
        }
        renderItem={({ item }) => <HistoryRow entry={item} />}
      />
    </Screen>
  );
}

function WorkoutHero({
  workout,
  onOpen,
  onStart,
}: {
  workout: Workout;
  onOpen: () => void;
  onStart: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Card style={[styles.hero, { backgroundColor: colors.surfaceElevated }]}>
      <View style={styles.heroHeader}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="barbell" size={26} color={colors.primaryText} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            {workout.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {workout.estimated_minutes ? `${workout.estimated_minutes} min` : 'Ready when you are'}
          </Text>
        </View>
        <Badge label={workout.status || 'assigned'} />
      </View>
      {workout.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {workout.description}
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        <Button label="Details" variant="outline" onPress={onOpen} style={styles.action} />
        <Button label="Start Workout" onPress={onStart} style={styles.action} />
      </View>
    </Card>
  );
}

function WorkoutRow({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{workout.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {workout.assigned_date ? formatFriendlyDate(workout.assigned_date) : 'Workout plan'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

function HistoryRow({ entry }: { entry: WorkoutHistoryItem }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.row}>
      <View style={[styles.checkIcon, { backgroundColor: `${colors.success}22` }]}>
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
          {entry.workout?.name || 'Completed workout'}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatFriendlyDate(entry.date_completed)}
          {entry.duration_minutes ? ` • ${entry.duration_minutes} min` : ''}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.h2,
  },
  description: {
    ...typography.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  emptyCard: {
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  muted: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
