import { create } from 'zustand';
import { Profile } from '@/types';

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
}));

export function useAuth() {
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  return { profile, isLoading, setProfile, setLoading };
}
