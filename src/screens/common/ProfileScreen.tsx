import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/utils/theme';

export function ProfileScreen() {
  const { profile } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      Alert.alert('Logout Error', error.message);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card}>
        <Text style={styles.name}>
          {profile?.full_name || '365 FITNESS User'}
        </Text>
        <Text style={styles.meta}>
          {profile?.role === 'coach' ? 'Coach account' : 'Client account'}
        </Text>
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

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
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
});
