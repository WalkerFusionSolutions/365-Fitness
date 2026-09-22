import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/hooks/useTheme';

export function FrostedTabBackground() {
  const theme = useAppTheme();

  return (
    <BlurView
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      intensity={72}
      tint={theme.name === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
      style={StyleSheet.absoluteFill}
    />
  );
}
