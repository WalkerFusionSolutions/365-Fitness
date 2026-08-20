import { Appearance } from 'react-native';

const isDarkMode = Appearance.getColorScheme() === 'dark';

// Base colors
export const palette = {
  primary: {
    deepTeal: '#063C38',
    emerald: '#008F7A',
    teal: '#0B6F64',
    athleticGreen: '#18A88F',
  },
  neutral: {
    pureWhite: '#FFFFFF',
    offWhite: '#F5F8F7',
    lightGray: '#E3EAE8',
    slateGray: '#667572',
    charcoal: '#17211F',
    black: '#080D0C',
  },
  accent: {
    energyGold: '#D9A441',
  },
  status: {
    success: '#32C48D',
    error: '#E05A5A',
  }
};

export const lightColors = {
  background: palette.neutral.offWhite,
  surface: palette.neutral.pureWhite,
  surfaceElevated: palette.neutral.pureWhite,
  primary: palette.primary.emerald,
  primaryDark: palette.primary.deepTeal,
  secondary: palette.primary.teal,
  highlight: palette.primary.athleticGreen,
  textPrimary: palette.neutral.charcoal,
  textSecondary: palette.neutral.slateGray,
  textMuted: palette.neutral.slateGray, // Might want a lighter gray if needed
  border: palette.neutral.lightGray,
  success: palette.status.success,
  error: palette.status.error,
  warning: palette.accent.energyGold,
  white: palette.neutral.pureWhite,
};

export const darkColors = {
  background: palette.neutral.black,
  surface: '#101A18',
  surfaceElevated: '#172522',
  primary: palette.primary.athleticGreen,
  primaryDark: palette.primary.deepTeal,
  secondary: palette.primary.emerald,
  highlight: palette.primary.athleticGreen,
  textPrimary: palette.neutral.pureWhite,
  textSecondary: '#9BAAA6',
  textMuted: '#9BAAA6',
  border: '#263633',
  success: palette.status.success,
  error: palette.status.error,
  warning: palette.accent.energyGold,
  white: palette.neutral.pureWhite,
};

// Toggle this or hook it up to a ThemeProvider context for dynamic switching
export const colors = isDarkMode ? darkColors : lightColors; // Defaulting to dynamic based on device, or we can force dark mode

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const shadows = {
  sm: {
    shadowColor: palette.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: palette.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
};
