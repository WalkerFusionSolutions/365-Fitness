import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, FilterChip, SearchInput, SectionHeader } from '@/components/AppUI';
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
import { spacing, typography } from '@/utils/theme';

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
            <AppHeader
              title="Programs"
              subtitle="Build workouts, manage exercises, and launch nutrition plans."
            />
            <View style={styles.actionRow}>
              <Button
                label="Create Workout"
                onPress={() => navigation.navigate('CoachWorkoutBuilder')}
                style={styles.action}
              />
              <Button
                label="Create Exercise"
                variant="outline"
                onPress={() => navigation.navigate('CoachExerciseEditor')}
                style={styles.action}
              />
            </View>
            <Button
              label="Create Meal Plan"
              variant="secondary"
              onPress={() => navigation.navigate('CoachMealPlanBuilder')}
              style={styles.nutritionAction}
            />

            <SectionHeader title="Workout Plans" />
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

            <SectionHeader title="Exercise Library" />
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
            />
            <View style={styles.chips}>
              {GROUPS.map((item) => {
                const active = group === item;
                return (
                  <FilterChip
                    key={item}
                    label={item}
                    active={active}
                    onPress={() => setGroup(item)}
                  />
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
    paddingBottom: 120,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  nutritionAction: {
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
