import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/utils/theme';

export function ProgressIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = Math.min(current / total, 1);

  return (
    <View style={styles.progressWrap}>
      <Text style={styles.progressText}>
        Step {current} of {total}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: progress }]} />
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
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
  return (
    <View style={styles.optionList}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)}>
            <Card style={[styles.optionCard, selected && styles.selectedCard]}>
              <Text style={[styles.optionLabel, selected && styles.selectedText]}>
                {option.label}
              </Text>
              {option.description ? (
                <Text style={styles.optionDescription}>
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
  return (
    <View style={styles.optionList}>
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
            <Card style={[styles.optionCard, selected && styles.selectedCard]}>
              <Text style={[styles.optionLabel, selected && styles.selectedText]}>
                {option.label}
              </Text>
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
  return (
    <View style={styles.toggle}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.toggleItem, selected && styles.toggleItemActive]}
          >
            <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
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
    color: colors.textSecondary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    flexDirection: 'row',
    borderRadius: radius.round,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.primary,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionList: {
    gap: spacing.sm,
  },
  optionCard: {
    gap: spacing.xs,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  optionLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.primary,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleItemActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.white,
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '700',
  },
  suffix: {
    ...typography.h3,
    color: colors.textSecondary,
    width: 48,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
