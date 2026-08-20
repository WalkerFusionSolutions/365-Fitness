import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { EmptyState, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography } from '@/utils/theme';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutHistory } from '@/hooks/useWorkout';
import { formatFriendlyDate } from '@/utils/date';
import { CompletedWorkout } from '@/types';

export default function WorkoutHistoryScreen() {
  const { profile } = useAuth();
  const { data: history, isLoading } = useWorkoutHistory(profile?.id);

  if (isLoading) return <LoadingView />;

  return (
    <Screen scroll={false} padded={false}>
      <Text style={styles.title}>Workout History</Text>
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

function HistoryRow({ entry }: { entry: CompletedWorkout }) {
  return (
    <Card style={styles.row}>
      <View style={styles.checkIcon}>
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.date}>{formatFriendlyDate(entry.date_completed)}</Text>
        {entry.duration_minutes ? <Text style={styles.duration}>{entry.duration_minutes} min</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.textPrimary, padding: spacing.md },
  listContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2ECC7133',
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  duration: { ...typography.caption, color: colors.textSecondary },
});
