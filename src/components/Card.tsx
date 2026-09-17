import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useAppTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/utils/theme';

export function Card({ children, style, ...rest }: ViewProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
  }
});
