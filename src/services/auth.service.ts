import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { toServiceError } from '@/services/errors';

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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
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
  emailRedirectTo,
}: {
  email: string;
  password: string;
  fullName: string;
  emailRedirectTo: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
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
