import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { AppServiceError, toServiceError } from '@/services/errors';

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw toServiceError(error, 'Unable to restore your session.');
  }

  return data.session;
}

export function onAuthSessionChange(
  callback: (session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}

export async function setSessionFromTokens(
  accessToken: string,
  refreshToken: string
) {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw toServiceError(error, 'Unable to confirm your session.');
  }

  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (__DEV__) {
    console.log('365 FITNESS email sign-in attempt:', {
      emailPresent: normalizedEmail.length > 0,
      passwordPresent: password.length > 0,
    });
  }

  if (!normalizedEmail || !password) {
    throw new AppServiceError('Enter your email and password.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw toServiceError(error, 'Unable to sign in.');
  }

  return data;
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
  phoneNumber,
  emailRedirectTo,
}: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  emailRedirectTo: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber ?? '');

  if (!normalizedEmail || !password || !fullName.trim()) {
    throw new AppServiceError('Please fill in all fields.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName.trim(),
        role: 'client',
        phone_number: normalizedPhoneNumber || null,
      },
    },
  });

  if (error) {
    throw toServiceError(error, 'Unable to create your account.');
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw toServiceError(error, 'Unable to log out.');
  }
}

export async function refreshCurrentSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw toServiceError(error, 'Unable to refresh your session.');
  }

  return data.session;
}

function normalizePhoneNumber(value: string) {
  return value
    .trim()
    .replace(/[\s()-]/g, '')
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');
}
