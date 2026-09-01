import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { AppServiceError } from '@/services/errors';
import { ThemePreference, useAppTheme } from '@/hooks/useTheme';
import { formatHeight, formatWeight } from '@/utils/fitness';
import { spacing, typography } from '@/utils/theme';

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
      <Text style={[styles.brand, { color: colors.primary }]}>365 FITNESS</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>

      <Card style={styles.card}>
        <ProfileField label="Full Name" value={displayName} />
        <ProfileField label="Account Type" value={accountType} />
        <ProfileField label="Email" value={email} />
        <ProfileField label="Account Status" value="Active" />
      </Card>

      <AppearanceSection
        value={themePreference}
        onChange={setThemePreference}
      />

      {profile?.role === 'client' ? (
        <FitnessProfileSection
          isLoading={fitness.isLoading}
          error={fitness.error}
          summary={fitness.data}
          onStart={() => navigation.navigate('ClientOnboarding')}
          onAssessment={() => navigation.navigate('ClientAssessment')}
          onMeasurements={() => navigation.navigate('ClientMeasurements')}
          onRetry={fitness.refresh}
        />
      ) : null}

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

function FitnessProfileSection({
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
      <Card style={styles.fitnessCard}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Fitness Profile</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Loading fitness profile...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.fitnessCard}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Fitness Profile</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>Unable to load your fitness profile.</Text>
        <Button label="Try Again" variant="secondary" onPress={onRetry} />
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card style={styles.fitnessCard}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Complete Your Fitness Profile</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Help your coach personalize your plan and track your progress.
        </Text>
        <Button label="Get Started" onPress={onStart} />
      </Card>
    );
  }

  return (
    <Card style={styles.fitnessCard}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Fitness Profile</Text>
      <ProfileField label="Starting Weight" value={formatWeight(summary.startingWeightKg)} />
      <ProfileField label="Current Weight" value={formatWeight(summary.currentWeightKg)} />
      <ProfileField label="Goal Weight" value={formatWeight(summary.goalWeightKg)} />
      <ProfileField label="Height" value={formatHeight(summary.assessment.heightCm)} />
      <ProfileField label="BMI" value={summary.bmi?.toFixed(1) ?? 'Not available'} />
      <ProfileField label="Primary Goal" value={summary.assessment.primaryGoal} />
      <ProfileField label="Experience" value={summary.assessment.experienceLevel} />
      <ProfileField label="Activity" value={summary.assessment.activityLevel} />
      <ProfileField label="Training" value={summary.assessment.trainingFrequency} />
      <Button label="View Full Assessment" variant="outline" onPress={onAssessment} />
      <Button label="View Measurements" variant="secondary" onPress={onMeasurements} />
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{value}</Text>
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
    <Card style={styles.appearanceCard}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Appearance</Text>
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
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
  },
  meta: {
    ...typography.body,
  },
  actions: {
    marginTop: spacing.lg,
  },
  fitnessCard: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  errorText: {
    ...typography.body,
  },
  appearanceCard: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: spacing.sm,
  },
  segmentText: {
    ...typography.caption,
    fontWeight: '700',
  },
  errorLogout: {
    marginTop: spacing.md,
  },
});
