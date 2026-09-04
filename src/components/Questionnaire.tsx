import React from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/utils/theme';

export function ProgressIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const { colors } = useAppTheme();
  const progress = Math.min(current / total, 1);

  return (
    <View style={styles.progressWrap}>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        Step {current} of {total}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { flex: progress, backgroundColor: colors.primary }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function SingleSelectCards<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; description?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.optionList}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)}>
            <Card
              style={[
                styles.optionCard,
                selected && {
                  borderColor: colors.primary,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            >
              <Text style={[styles.optionLabel, { color: selected ? colors.primary : colors.textPrimary }]}>
                {option.label}
              </Text>
              {option.description ? (
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MultiSelectCards<T extends string>({
  options,
  values,
  onChange,
}: {
  options: { label: string; value: T }[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.chipList}>
      {options.map((option) => {
        const selected = values.includes(option.value);

        return (
          <Pressable
            key={option.value}
            onPress={() =>
              onChange(
                selected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value]
              )
            }
          >
            <Card
              style={[
                styles.chipCard,
                selected && {
                  borderColor: colors.primary,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <View style={styles.chipContent}>
                <Text style={[styles.optionLabel, { color: selected ? colors.primary : colors.textPrimary }]}>
                  {option.label}
                </Text>
                {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

export function UnitToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.toggleItem,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.toggleText, { color: selected ? colors.primaryText : colors.textSecondary }]}>
              {option.toUpperCase().replace('_', ' / ')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NumericInput({
  label,
  value,
  onChangeText,
  suffix,
  placeholder,
  maxLength,
  keyboardType = 'decimal-pad',
  style,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {suffix ? <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function QuestionnaireNav({
  canGoBack,
  canContinue,
  continueLabel = 'Continue',
  isLoading,
  onBack,
  onContinue,
}: {
  canGoBack: boolean;
  canContinue: boolean;
  continueLabel?: string;
  isLoading?: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.nav}>
      {canGoBack ? (
        <Button label="Back" variant="secondary" onPress={onBack} />
      ) : (
        <View />
      )}
      <Button
        label={continueLabel}
        onPress={onContinue}
        disabled={!canContinue}
        loading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressText: {
    ...typography.caption,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    flexDirection: 'row',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressFill: {
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
  },
  optionList: {
    gap: spacing.sm,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    gap: spacing.xs,
  },
  chipCard: {
    minWidth: '46%',
  },
  chipContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  optionLabel: {
    ...typography.h3,
  },
  optionDescription: {
    ...typography.caption,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: '700',
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '700',
  },
  suffix: {
    ...typography.h3,
    width: 48,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
