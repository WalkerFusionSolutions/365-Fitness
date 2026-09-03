import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { AppInput } from '@/components/AppUI';
import { Card } from '@/components/Card';
import { signInWithEmail as signInWithEmailService } from '@/services/auth.service';
import { AppServiceError } from '@/services/errors';
import { useAppTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/utils/theme';

export function LoginScreen({ navigation }: any) {
  const { colors } = useAppTheme();
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
        <Text style={[styles.brand, { color: colors.primary }]}>365 FITNESS</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Continue your progress.</Text>

        <Card style={styles.form}>
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
    marginTop: spacing.sm,
  }
});
