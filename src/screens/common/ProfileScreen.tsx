import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, IconRow, ProfileAvatar, SectionHeader } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { AppServiceError } from '@/services/errors';
import { ThemePreference, useAppTheme } from '@/hooks/useTheme';
import { formatWeight } from '@/utils/fitness';
import { radius, spacing, typography } from '@/utils/theme';

export function ProfileScreen() {
  const { colors, themePreference, setThemePreference } = useAppTheme();
  const { session, profile, error, isLoading, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const fitness = useFitnessProfile(
    profile?.role === 'client' ? profile.id : undefined
  );
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (logoutError) {
      const message =
        logoutError instanceof AppServiceError
          ? logoutError.userMessage
          : 'Unable to log out.';
      Alert.alert('Logout Error', message);
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return <LoadingView label="Loading profile..." />;
  }

  if (error && !profile) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load your profile"
          subtitle="Please log out and sign in again."
        />
        <Button
          label="Log Out"
          variant="secondary"
          onPress={handleLogout}
          loading={isSigningOut}
          style={styles.errorLogout}
        />
      </Screen>
    );
  }

  const accountType = profile?.role === 'coach' ? 'Coach' : 'Client';
  const displayName = profile?.full_name?.trim() || '365 FITNESS User';
  const email = session?.user?.email ?? 'Not available';

  return (
    <Screen>
      <View style={[styles.profileHero, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <ProfileAvatar name={displayName} uri={profile?.avatar_url} size={86} />
        <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
        <Badge label={accountType} />
        <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>
      </View>

      {profile?.role === 'client' ? (
        <ClientSnapshot
          isLoading={fitness.isLoading}
          error={fitness.error}
          summary={fitness.data}
          onStart={() => navigation.navigate('ClientOnboarding')}
          onAssessment={() => navigation.navigate('ClientAssessment')}
          onMeasurements={() => navigation.navigate('ClientMeasurements')}
          onRetry={fitness.refresh}
        />
      ) : (
        <Card style={styles.coachCard}>
          <View style={styles.coachRow}>
            <Avatar name={displayName} size={44} />
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Coach Workspace</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                Clients, programs, and nutrition are managed from the main tabs.
              </Text>
            </View>
          </View>
        </Card>
      )}

      <SectionHeader title="Personal" />
      {profile?.role === 'client' ? (
        <>
          <IconRow
            icon="clipboard-outline"
            title="Fitness Assessment"
            subtitle={fitness.data ? fitness.data.assessment.primaryGoal : 'Complete your assessment'}
            onPress={() => navigation.navigate(fitness.data ? 'ClientAssessment' : 'ClientOnboarding')}
          />
          <IconRow
            icon="scale-outline"
            title="Measurements"
            subtitle={fitness.data ? `${fitness.data.measurementCount} records` : 'Start tracking progress'}
            onPress={() => navigation.navigate('ClientMeasurements')}
          />
        </>
      ) : (
        <IconRow
          icon="people-outline"
          title="Client Management"
          subtitle="Review assigned and visible clients"
          onPress={() => navigation.navigate('Clients')}
        />
      )}

      <SectionHeader title="Preferences" />
      <Card style={styles.preferenceCard}>
        <View style={styles.settingTop}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Current: {labelTheme(themePreference)}
            </Text>
          </View>
          <Ionicons name={themePreference === 'dark' ? 'moon' : 'sunny'} size={22} color={colors.primary} />
        </View>
        <AppearanceSection value={themePreference} onChange={setThemePreference} />
      </Card>

      <SectionHeader title="App" />
      <IconRow icon="information-circle-outline" title="About 365 Fitness" subtitle="Production-minded coaching app" right={null} />

      <View style={styles.actions}>
        <Button
          label="Log Out"
          variant="secondary"
          onPress={handleLogout}
          loading={isSigningOut}
        />
      </View>
    </Screen>
  );
}

function ClientSnapshot({
  isLoading,
  error,
  summary,
  onStart,
  onAssessment,
  onMeasurements,
  onRetry,
}: {
  isLoading: boolean;
  error: string | null;
  summary: ReturnType<typeof useFitnessProfile>['data'];
  onStart: () => void;
  onAssessment: () => void;
  onMeasurements: () => void;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <Card style={styles.snapshot}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Fitness Profile</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Loading your profile...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.snapshot}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Fitness Profile</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>Unable to load your fitness profile.</Text>
        <Button label="Try Again" variant="outline" onPress={onRetry} />
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card style={styles.snapshot}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Complete Your Fitness Profile</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Your coach can personalize workouts and nutrition after this is complete.
        </Text>
        <Button label="Get Started" onPress={onStart} />
      </Card>
    );
  }

  return (
    <Card style={styles.snapshot}>
      <View style={styles.metricRow}>
        <Metric label="Current" value={formatWeight(summary.currentWeightKg)} />
        <Metric label="Goal" value={formatWeight(summary.goalWeightKg)} />
      </View>
      <IconRow
        icon="analytics-outline"
        title={summary.assessment.primaryGoal}
        subtitle={`${summary.assessment.experienceLevel} • ${summary.assessment.trainingFrequency}`}
        onPress={onAssessment}
      />
      <Button label="View Measurements" variant="outline" onPress={onMeasurements} />
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function AppearanceSection({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}) {
  const { colors } = useAppTheme();
  const options: ThemePreference[] = ['system', 'light', 'dark'];

  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceSecondary }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: selected ? colors.primaryText : colors.textSecondary },
              ]}
            >
              {labelTheme(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function labelTheme(value: ThemePreference) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  profileHero: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  name: {
    ...typography.h2,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    textAlign: 'center',
  },
  snapshot: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  coachCard: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  errorText: {
    ...typography.body,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    ...typography.h2,
  },
  preferenceCard: {
    gap: spacing.md,
  },
  settingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.round,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.round,
    paddingVertical: spacing.sm,
    minHeight: 42,
    justifyContent: 'center',
  },
  segmentText: {
    ...typography.caption,
    fontWeight: '800',
  },
  actions: {
    marginTop: spacing.lg,
  },
  errorLogout: {
    marginTop: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
