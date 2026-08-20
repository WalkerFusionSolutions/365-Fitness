import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Athlete';

  return (
    <Screen padded>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Pressable style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{firstName[0]}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Today's Plan</Text>
      
      <Card style={styles.workoutCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell" size={24} color={colors.white} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Leg Day (Hypertrophy)</Text>
            <Text style={styles.cardSubtitle}>6 exercises &middot; 45 mins</Text>
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
          <Text style={styles.smallCardValue}>3 / 8</Text>
          <Text style={styles.smallCardLabel}>Water Cups</Text>
        </Card>
        
        <Card style={styles.smallCard}>
          <Ionicons name="flame-outline" size={24} color={colors.warning} />
          <Text style={styles.smallCardValue}>Day 4</Text>
          <Text style={styles.smallCardLabel}>Streak</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Progress Snapshot</Text>
      <Card style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Current Weight</Text>
          <Text style={styles.progressValue}>185 lbs</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '60%' }]} />
        </View>
        <Text style={styles.progressGoal}>Goal: 175 lbs</Text>
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
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    ...typography.h3,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  workoutCard: {
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.lg,
    padding: spacing.lg,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  smallCardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.round,
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.highlight,
    borderRadius: radius.round,
  },
  progressGoal: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
  }
});
