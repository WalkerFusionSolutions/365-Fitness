import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { supabase } from '@/services/supabase';
import { colors, radius, spacing, typography } from '@/utils/theme';

const emailRedirectTo =
  process.env.EXPO_PUBLIC_EMAIL_CONFIRMATION_URL ??
  'fitness365://auth/callback';

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account.');
      navigation.navigate('Login');
    }
    setLoading(false);
  }

  return (
    <Screen padded>
      <View style={styles.container}>
        <Text style={styles.title}>Join 365 FITNESS</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />
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

        <Button label="Sign Up" onPress={signUpWithEmail} loading={loading} style={styles.button} />
        
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
  title: {
    ...typography.h2,
    color: colors.textPrimary,
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
    marginTop: spacing.md,
  },
});
