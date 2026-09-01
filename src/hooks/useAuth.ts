import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { Profile } from '@/types';
import { signOut as signOutService } from '@/services/auth.service';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  error: string | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setError: (error: string | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  error: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
  resetAuth: () =>
    set({
      session: null,
      profile: null,
      error: null,
      isLoading: false,
    }),
}));

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setError = useAuthStore((state) => state.setError);
  const setLoading = useAuthStore((state) => state.setLoading);
  const resetAuth = useAuthStore((state) => state.resetAuth);

  async function signOut() {
    await signOutService();
  }
  
  return {
    session,
    profile,
    error,
    isLoading,
    setSession,
    setProfile,
    setError,
    setLoading,
    resetAuth,
    signOut,
  };
}
