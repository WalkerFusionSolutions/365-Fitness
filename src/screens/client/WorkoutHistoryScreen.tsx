import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { EmptyState, LoadingView } from '@/components/StateViews';
import { spacing, typography } from '@/utils/theme';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutHistory } from '@/hooks/useWorkout';
import { formatFriendlyDate } from '@/utils/date';
import { WorkoutHistoryItem } from '@/types';
import { useAppTheme } from '@/hooks/useTheme';
import { AppHeader } from '@/components/AppUI';

export default function WorkoutHistoryScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data: history, isLoading } = useWorkoutHistory(profile?.id);

  if (isLoading) return <LoadingView />;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <AppHeader
          title="Workout History"
          subtitle="Track completed training sessions"
          action={
            <View style={[styles.headerIcon, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="barbell-outline" size={24} color={colors.primary} />
            </View>
          }
        />
      </View>
      <FlatList
        data={history ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No completed workouts yet"
            subtitle="Your completed workout sessions will appear here."
          />
        }
        renderItem={({ item }) => <HistoryRow entry={item} />}
      />
    </Screen>
  );
}

function HistoryRow({ entry }: { entry: WorkoutHistoryItem }) {
  const { colors } = useAppTheme();

  return (
    <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.row}>
        <View style={[styles.checkIcon, { backgroundColor: `${colors.success}22` }]}>
          <Ionicons name="checkmark" size={18} color={colors.success} />
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.date, { color: colors.textPrimary }]}>
            {entry.workout?.name || 'Completed workout'}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.duration, { color: colors.textSecondary }]}>
              {formatFriendlyDate(entry.date_completed)}
            </Text>
            {entry.duration_minutes ? (
              <>
                <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.duration, { color: colors.textSecondary }]}>
                  {entry.duration_minutes} min
                </Text>
              </>
            ) : null}
          </View>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  headerIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  listContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  date: { ...typography.body, fontWeight: '600' },
  duration: { ...typography.caption },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dot: {
    ...typography.caption,
  },
  pressed: {
    opacity: 0.72,
  },
});
