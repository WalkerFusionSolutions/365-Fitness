import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, Alert, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { supabase } from '@/services/supabase';
import { colors, radius, spacing, typography } from '@/utils/theme';

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'coach'>('client');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: '365fitness://auth/callback',
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the login link!');
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

        <Text style={styles.roleLabel}>I am a:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'client' && styles.roleActive]} 
            onPress={() => setRole('client')}
          >
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'coach' && styles.roleActive]} 
            onPress={() => setRole('coach')}
          >
            <Text style={[styles.roleText, role === 'coach' && styles.roleTextActive]}>Coach</Text>
          </TouchableOpacity>
        </View>

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
  roleLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '11', // Very faint green
  },
  roleText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  }
});
