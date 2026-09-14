import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { AppInput } from '@/components/AppUI';
import { Card } from '@/components/Card';
import { signInWithEmail as signInWithEmailService } from '@/services/auth.service';
import { AppServiceError } from '@/services/errors';
import { useAppTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/utils/theme';

export function LoginScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (loading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Error', 'Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailService(trimmedEmail, password);
    } catch (error) {
      const message =
        error instanceof AppServiceError
          ? error.userMessage
          : 'Unable to sign in.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.brandLockup}>
          <Text style={[styles.brandNumber, { color: colors.primary }]}>365</Text>
          <Text style={[styles.brand, { color: colors.primary }]}>FITNESS</Text>
          <View style={[styles.brandLine, { backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue your fitness journey.
        </Text>

        <Card style={[styles.form, { backgroundColor: colors.surfaceElevated }]}>
          <AppInput
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AppInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </Card>

        <Button label="Sign In" onPress={signInWithEmail} loading={loading} style={styles.button} />
        
        <Button 
          label="Create an Account" 
          variant="outline" 
          onPress={() => navigation.navigate('Signup')} 
          disabled={loading}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.primary }]}>365 FITNESS</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textMuted }]}>BUILD / TRAIN / ACHIEVE</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  brandLockup: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandNumber: {
    fontSize: 62,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 64,
  },
  brand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  brandLine: {
    borderRadius: radius.round,
    height: 3,
    marginTop: spacing.sm,
    width: 76,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  button: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerTitle: {
    ...typography.caption,
    fontWeight: '900',
  },
  footerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.xs,
  }
});
