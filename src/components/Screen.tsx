import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewProps,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useTheme';
import { spacing } from '@/utils/theme';

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
  const { colors } = useAppTheme();
  const content = (
    <View style={[styles.container, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 104,
  },
  container: {
    flex: 1,
  },
  padded: {
    padding: spacing.lg,
  }
});
