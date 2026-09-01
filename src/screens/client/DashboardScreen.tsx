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

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { data: fitnessProfile, isLoading: fitnessLoading } =
    useFitnessProfile(profile?.id);
  const firstName = profile?.full_name?.split(' ')[0] || 'Athlete';

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
        <Text style={[styles.placeholderLabel, { color: colors.warning }]}>Development placeholder data</Text>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="barbell" size={24} color={colors.white} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Leg Day (Hypertrophy)</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Workout assignment connects in Phase 3
            </Text>
          </View>
        </View>
        <Button 
          label="Start Workout" 
          onPress={() => navigation.navigate('ExerciseDetail', { workoutId: 'w1' })} 
          style={styles.actionButton}
        />
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
        <Text style={[styles.placeholderLabel, { color: colors.warning }]}>Development placeholder data</Text>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Current Weight</Text>
          <Text style={[styles.progressValue, { color: colors.textPrimary }]}>185 lbs</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: '60%', backgroundColor: colors.highlight }]} />
        </View>
        <Text style={[styles.progressGoal, { color: colors.textMuted }]}>Goal: 175 lbs</Text>
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
