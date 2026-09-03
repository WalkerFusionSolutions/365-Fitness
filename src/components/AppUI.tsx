import React from 'react';
import {
  Pressable,
  PressableProps,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  DimensionValue,
  ViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/utils/theme';

export function AppHeader({
  eyebrow = '365 FITNESS',
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name?: string | null; size?: number }) {
  const { colors } = useAppTheme();
  const initials = (name?.trim() || '365')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryDark,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.white }]}>{initials}</Text>
    </View>
  );
}

export function ProfileAvatar({
  name,
  uri,
  size = 72,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
}) {
  const { colors } = useAppTheme();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceSecondary,
        }}
      />
    );
  }

  return <Avatar name={name} size={size} />;
}

export function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'muted' | 'success' | 'warning';
}) {
  const { colors } = useAppTheme();
  const foreground =
    tone === 'muted'
      ? colors.textSecondary
      : tone === 'success'
        ? colors.success
        : tone === 'warning'
          ? colors.warning
          : colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={[styles.badgeText, { color: foreground }]}>{label}</Text>
    </View>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = 'primary',
  style,
}: ViewProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tone?: 'primary' | 'warning' | 'success';
}) {
  const { colors } = useAppTheme();
  const iconColor = tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.primary;

  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const { colors } = useAppTheme();
  const width = `${Math.min(100, Math.max(0, value))}%` as DimensionValue;

  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
      <View style={[styles.progressFill, { width, backgroundColor: colors.highlight }]} />
    </View>
  );
}

export function AppInput({ label, style, ...props }: TextInputProps & { label: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
          props.multiline && styles.multiline,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function SearchInput(props: TextInputProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.searchWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.textPrimary }]}
        {...props}
      />
    </View>
  );
}

export function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceSecondary,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.primaryText : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function IconRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: PressableProps['onPress'];
}) {
  const { colors } = useAppTheme();
  const content = (
      <View style={[styles.iconRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </View>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  sectionAction: {
    ...typography.caption,
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '900',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '800',
  },
  stat: {
    flex: 1,
    minHeight: 110,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statValue: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.round,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '800',
  },
  input: {
    ...typography.body,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  chipText: {
    ...typography.caption,
    fontWeight: '800',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...typography.h3,
  },
  rowSubtitle: {
    ...typography.caption,
  },
  flex: {
    flex: 1,
  },
  searchWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
  },
});
