import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAppTheme } from '@/hooks/useTheme';
import {
  useCoachWorkouts,
  useExerciseLibrary,
} from '@/hooks/useWorkout';
import { ExerciseLibraryItem, Workout } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

const GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function CoachProgramsScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const library = useExerciseLibrary(search);
  const workouts = useCoachWorkouts();
  const isLoading = library.isLoading || workouts.isLoading;
  const isRefreshing = library.isRefreshing || workouts.isRefreshing;
  const filteredExercises = useMemo(
    () =>
      group === 'All'
        ? library.data
        : library.data.filter((item) => item.muscle_group === group),
    [group, library.data]
  );

  const refresh = () => {
    library.refresh();
    workouts.refresh();
  };

  if (isLoading) {
    return <LoadingView label="Loading programs..." />;
  }

  if ((library.error || workouts.error) && library.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load programs"
          subtitle={library.error || workouts.error || 'Please try again.'}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      padded={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Programs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build reusable exercises, create workouts, and assign them to clients.
            </Text>
            <View style={styles.actionRow}>
              <Button
                label="Create Exercise"
                onPress={() => navigation.navigate('CoachExerciseEditor')}
                style={styles.action}
              />
              <Button
                label="Create Workout"
                variant="outline"
                onPress={() => navigation.navigate('CoachWorkoutBuilder')}
                style={styles.action}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workout Plans</Text>
            {workouts.data.length === 0 ? (
              <Card style={styles.emptyBlock}>
                <EmptyState
                  icon="clipboard-outline"
                  title="No workouts yet"
                  subtitle="Create a workout, add exercises, then assign it to a client."
                />
              </Card>
            ) : (
              workouts.data.slice(0, 4).map((workout) => (
                <WorkoutRow
                  key={workout.id}
                  workout={workout}
                  onPress={() =>
                    navigation.navigate('CoachWorkoutBuilder', { workoutId: workout.id })
                  }
                />
              ))
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Exercise Library</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.search,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={styles.chips}>
              {GROUPS.map((item) => {
                const active = group === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setGroup(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.primaryText : colors.textSecondary },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="No exercises found"
            subtitle="Create an exercise to start building workouts."
          />
        }
        renderItem={({ item }) => (
          <ExerciseRow
            exercise={item}
            onPress={() =>
              navigation.navigate('CoachExerciseEditor', { exerciseId: item.id })
            }
          />
        )}
      />
    </Screen>
  );
}

function WorkoutRow({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{workout.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {workout.client_id ? 'Assigned workout' : 'Draft template'}
            {workout.estimated_minutes ? ` • ${workout.estimated_minutes} min` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

function ExerciseRow({
  exercise,
  onPress,
}: {
  exercise: ExerciseLibraryItem;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="barbell-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{exercise.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {exercise.muscle_group} • {exercise.equipment}
          </Text>
        </View>
        {exercise.video_path ? (
          <Ionicons name="videocam" size={18} color={colors.primary} />
        ) : null}
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
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  search: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  emptyBlock: {
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
