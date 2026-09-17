import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { useAppTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/utils/theme';

export function LoadingView({ label = 'Loading...' }: { label?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <View style={[styles.skeletonTitle, { backgroundColor: colors.surfaceSecondary }]} />
      <View style={[styles.skeletonLead, { backgroundColor: colors.surfaceSecondary }]} />
      <View style={[styles.skeletonBlock, { backgroundColor: colors.surface }]} />
      <View style={[styles.skeletonRow, { borderColor: colors.border }]} />
      <View style={[styles.skeletonRow, { borderColor: colors.border }]} />
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  subtitle = 'Please try again.',
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="warning-outline" size={24} color={colors.error} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      {onRetry ? (
        <Button
          label="Retry"
          variant="secondary"
          onPress={onRetry}
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.xl,
  },
  skeletonTitle: {
    borderRadius: 4,
    height: 28,
    width: '44%',
  },
  skeletonLead: {
    borderRadius: 4,
    height: 14,
    marginTop: spacing.sm,
    width: '72%',
  },
  skeletonBlock: {
    borderRadius: 8,
    height: 150,
    marginTop: spacing.xl,
  },
  skeletonRow: {
    borderBottomWidth: 1,
    height: 68,
  },
  label: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    maxWidth: 320,
  },
  retryButton: {
    marginTop: spacing.md,
  }
});
