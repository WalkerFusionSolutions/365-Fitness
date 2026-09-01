import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { AppServiceError } from '@/services/errors';
import { colors, spacing, typography } from '@/utils/theme';

export function ProfileScreen() {
  const { session, profile, error, isLoading, signOut } = useAuth();
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
      <Text style={styles.brand}>365 FITNESS</Text>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card}>
        <ProfileField label="Full Name" value={displayName} />
        <ProfileField label="Account Type" value={accountType} />
        <ProfileField label="Email" value={email} />
        <ProfileField label="Account Status" value="Active" />
      </Card>

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

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.name}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.lg,
  },
  errorLogout: {
    marginTop: spacing.md,
  },
});
