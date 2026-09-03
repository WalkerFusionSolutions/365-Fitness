import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

export default function WorkoutHistoryScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data: history, isLoading } = useWorkoutHistory(profile?.id);

  if (isLoading) return <LoadingView />;

  return (
    <Screen scroll={false} padded={false}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Workout History</Text>
      <FlatList
        data={history ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState icon="time-outline" title="No completed workouts yet" />}
        renderItem={({ item }) => <HistoryRow entry={item} />}
      />
    </Screen>
  );
}

function HistoryRow({ entry }: { entry: WorkoutHistoryItem }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.row}>
      <View style={[styles.checkIcon, { backgroundColor: `${colors.success}22` }]}>
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.date, { color: colors.textPrimary }]}>
          {entry.workout?.name || 'Completed workout'}
        </Text>
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          {formatFriendlyDate(entry.date_completed)}
          {entry.duration_minutes ? ` • ${entry.duration_minutes} min` : ''}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, padding: spacing.md },
  listContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { ...typography.body, fontWeight: '600' },
  duration: { ...typography.caption },
});
