import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { radius, spacing, typography } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { useAppTheme } from '@/hooks/useTheme';
import { useClientWorkouts } from '@/hooks/useWorkout';

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data: fitnessProfile, isLoading: fitnessLoading } =
    useFitnessProfile(profile?.id);
  const { data: workouts } = useClientWorkouts(profile?.id);
  const nextWorkout = workouts[0];
  const firstName = profile?.full_name?.split(' ')[0] || 'Athlete';
  const currentWeightLb = fitnessProfile?.currentWeightKg
    ? Math.round(fitnessProfile.currentWeightKg * 2.20462)
    : null;
  const goalWeightLb = fitnessProfile?.goalWeightKg
    ? Math.round(fitnessProfile.goalWeightKg * 2.20462)
    : null;

  return (
    <Screen padded>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{firstName}</Text>
        </View>
        <Pressable style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryDark }]}>
          <Text style={styles.avatarText}>{firstName[0]}</Text>
        </Pressable>
      </View>

      {!fitnessLoading && !fitnessProfile ? (
        <Card style={styles.onboardingCard}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Complete Your Fitness Profile</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Help your coach personalize your plan and track your progress.
          </Text>
          <Button
            label="Get Started"
            onPress={() => navigation.navigate('ClientOnboarding')}
            style={styles.actionButton}
          />
        </Card>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Plan</Text>
      
      <Card style={[styles.workoutCard, { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="barbell" size={24} color={colors.white} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {nextWorkout?.name ?? 'No workout assigned'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {nextWorkout
                ? nextWorkout.description || 'Your next assigned workout is ready.'
                : "Your coach hasn't assigned a workout yet."}
            </Text>
          </View>
        </View>
        {nextWorkout ? (
          <Button
            label="View Workout"
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: nextWorkout.id })}
            style={styles.actionButton}
          />
        ) : null}
      </Card>

      <View style={styles.row}>
        <Card style={styles.smallCard}>
          <Ionicons name="water-outline" size={24} color={colors.primary} />
          <Text style={[styles.smallCardValue, { color: colors.textPrimary }]}>3 / 8</Text>
          <Text style={[styles.smallCardLabel, { color: colors.textSecondary }]}>Placeholder Water</Text>
        </Card>
        
        <Card style={styles.smallCard}>
          <Ionicons name="flame-outline" size={24} color={colors.warning} />
          <Text style={[styles.smallCardValue, { color: colors.textPrimary }]}>Day 4</Text>
          <Text style={[styles.smallCardLabel, { color: colors.textSecondary }]}>Streak</Text>
        </Card>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress Snapshot</Text>
      <Card style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Current Weight</Text>
          <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
            {currentWeightLb ? `${currentWeightLb} lbs` : 'Not recorded'}
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${getProgressPercent(
                  fitnessProfile?.startingWeightKg,
                  fitnessProfile?.currentWeightKg,
                  fitnessProfile?.goalWeightKg
                )}%`,
                backgroundColor: colors.highlight,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressGoal, { color: colors.textMuted }]}>
          Goal: {goalWeightLb ? `${goalWeightLb} lbs` : 'Not set'}
        </Text>
      </Card>

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    ...typography.h1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    ...typography.h3,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  workoutCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  onboardingCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.caption,
  },
  placeholderLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  actionButton: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  smallCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  smallCardValue: {
    ...typography.h2,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  smallCardLabel: {
    ...typography.caption,
  },
  progressCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.body,
  },
  progressValue: {
    ...typography.h3,
  },
  progressBarBg: {
    height: 8,
    borderRadius: radius.round,
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.round,
  },
  progressGoal: {
    ...typography.caption,
    textAlign: 'right',
  }
});

function getProgressPercent(
  startingWeight?: number | null,
  currentWeight?: number | null,
  goalWeight?: number | null
) {
  if (!startingWeight || !currentWeight || !goalWeight) return 0;

  const total = Math.abs(startingWeight - goalWeight);
  if (total === 0) return 100;

  const moved = Math.abs(startingWeight - currentWeight);
  return Math.min(100, Math.max(0, Math.round((moved / total) * 100)));
}
