import { useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AppTheme, getTheme, ThemeName } from '@/utils/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = '365fitness.themePreference';

interface ThemeState {
  themePreference: ThemePreference;
  systemTheme: ThemeName;
  hasLoadedPreference: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  setSystemTheme: (theme: ThemeName) => void;
  setHasLoadedPreference: (loaded: boolean) => void;
}

function toThemeName(colorScheme: ColorSchemeName | null | undefined): ThemeName {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set) => ({
  themePreference: 'system',
  systemTheme: toThemeName(Appearance.getColorScheme()),
  hasLoadedPreference: false,
  setThemePreference: async (themePreference) => {
    set({ themePreference });
    await AsyncStorage.setItem(STORAGE_KEY, themePreference);
  },
  setSystemTheme: (systemTheme) => set({ systemTheme }),
  setHasLoadedPreference: (hasLoadedPreference) =>
    set({ hasLoadedPreference }),
}));

export function useThemeBootstrap() {
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const setHasLoadedPreference = useThemeStore(
    (state) => state.setHasLoadedPreference
  );

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedPreference) => {
        if (!isMounted) return;

        if (
          storedPreference === 'system' ||
          storedPreference === 'light' ||
          storedPreference === 'dark'
        ) {
          setThemePreference(storedPreference);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedPreference(true);
        }
      });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(toThemeName(colorScheme));
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [setHasLoadedPreference, setSystemTheme, setThemePreference]);
}

export function useAppTheme(): AppTheme & {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
} {
  const themePreference = useThemeStore((state) => state.themePreference);
  const systemTheme = useThemeStore((state) => state.systemTheme);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const resolvedTheme =
    themePreference === 'system' ? systemTheme : themePreference;

  return {
    ...getTheme(resolvedTheme),
    themePreference,
    setThemePreference,
  };
}
