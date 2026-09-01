import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { signInWithEmail as signInWithEmailService } from '@/services/auth.service';
import { AppServiceError } from '@/services/errors';
import { colors, radius, spacing, typography } from '@/utils/theme';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);

    try {
      await signInWithEmailService(email.trim(), password);
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
        <Text style={styles.title}>365 FITNESS</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button label="Sign In" onPress={signInWithEmail} loading={loading} style={styles.button} />
        
        <Button 
          label="Create an Account" 
          variant="outline" 
          onPress={() => navigation.navigate('Signup')} 
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
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  }
});
