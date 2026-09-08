import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { AppInput } from '@/components/AppUI';
import { Card } from '@/components/Card';
import { signUpWithEmail as signUpWithEmailService } from '@/services/auth.service';
import { AppServiceError } from '@/services/errors';
import { useAppTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/utils/theme';

const emailRedirectTo =
  process.env.EXPO_PUBLIC_EMAIL_CONFIRMATION_URL ??
  'fitness365://auth/callback';

export function SignupScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !password || !confirmPassword || !trimmedName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmailService({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
        phoneNumber,
        emailRedirectTo,
      });

      Alert.alert('Success', 'Check your email to confirm your account.');
      navigation.navigate('Login');
    } catch (error) {
      const message =
        error instanceof AppServiceError
          ? error.userMessage
          : 'Unable to create your account.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded>
      <View style={styles.container}>
        <Text style={[styles.brand, { color: colors.primary }]}>365 FITNESS</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your coaching journey.</Text>

        <Card style={styles.form}>
          <AppInput
            label="Full Name"
            placeholder="Your name"
            value={fullName}
            onChangeText={setFullName}
          />
          <AppInput
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AppInput
            label="Phone Number"
            placeholder="+1 473 555 0123"
            autoCapitalize="none"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <AppInput
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <AppInput
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </Card>

        <Button
          label="Sign Up"
          onPress={signUpWithEmail}
          loading={loading}
          style={styles.button}
        />
        
        <Button 
          label="Back to Login" 
          variant="secondary" 
          onPress={() => navigation.goBack()} 
          disabled={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    ...typography.caption,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.xs,
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
  },
  button: {
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
});
