import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewProps,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/utils/theme';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshControl,
  style,
  ...rest
}: ScreenProps) {
  const content = (
    <View style={[styles.container, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    padding: 16,
  }
});
