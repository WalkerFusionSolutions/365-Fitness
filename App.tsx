import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAppTheme, useThemeBootstrap } from '@/hooks/useTheme';

export default function App() {
  useThemeBootstrap();
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
