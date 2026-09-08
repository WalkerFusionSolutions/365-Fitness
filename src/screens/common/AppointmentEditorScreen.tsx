import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Badge, SectionHeader } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAppointment, useAppointmentActions } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useTheme';
import {
  AppointmentLocationType,
  AppointmentType,
} from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

type RouteParams = RouteProp<Record<string, {
  appointmentId?: string;
  clientId?: string;
  clientName?: string;
}>, string>;

const appointmentTypes: AppointmentType[] = [
  'consultation',
  'check_in',
  'workout',
  'assessment',
  'progress_review',
  'nutrition',
  'other',
];
const locationTypes: AppointmentLocationType[] = ['in_person', 'video', 'phone', 'other'];
const durations = [30, 45, 60, 90];

export default function AppointmentEditorScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const appointmentId = route.params?.appointmentId;
  const loaded = useAppointment(appointmentId);
  const actions = useAppointmentActions();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('check_in');
  const [locationType, setLocationType] = useState<AppointmentLocationType>('video');
  const [locationText, setLocationText] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startsAt, setStartsAt] = useState(roundToNextHalfHour(new Date()));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const clientId = route.params?.clientId ?? loaded.data?.client_id;
  const clientName = route.params?.clientName ?? loaded.data?.client?.full_name ?? 'Client';
  const endsAt = useMemo(
    () => new Date(startsAt.getTime() + durationMinutes * 60000),
    [durationMinutes, startsAt]
  );

  useEffect(() => {
    if (!loaded.data) return;

    setTitle(loaded.data.title);
    setDescription(loaded.data.description ?? '');
    setCoachNotes(loaded.data.coach_notes ?? '');
    setAppointmentType(loaded.data.appointment_type);
    setLocationType(loaded.data.location_type);
    setLocationText(loaded.data.location_text ?? '');
    setMeetingUrl(loaded.data.meeting_url ?? '');
    setStartsAt(new Date(loaded.data.starts_at));
    setDurationMinutes(
      Math.max(
        15,
        Math.round(
          (new Date(loaded.data.ends_at).getTime() -
            new Date(loaded.data.starts_at).getTime()) /
            60000
        )
      )
    );
  }, [loaded.data]);

  if (appointmentId && loaded.isLoading) {
    return <LoadingView label="Loading appointment..." />;
  }

  if (appointmentId && loaded.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load appointment"
          subtitle={loaded.error}
          onRetry={loaded.refresh}
        />
      </Screen>
    );
  }

  async function saveAppointment() {
    if (!profile?.id || !clientId) {
      Alert.alert('Appointment', 'Choose a client before scheduling.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Appointment', 'Enter an appointment title.');
      return;
    }

    if (locationType === 'video' && meetingUrl.trim() && !isValidUrl(meetingUrl.trim())) {
      Alert.alert('Appointment', 'Enter a valid meeting URL.');
      return;
    }

    const saved = await actions.save(
      {
        appointmentType,
        clientId,
        coachId: profile.id,
        coachNotes: coachNotes.trim() || null,
        description: description.trim() || null,
        endsAt: endsAt.toISOString(),
        locationText: locationText.trim() || null,
        locationType,
        meetingUrl: meetingUrl.trim() || null,
        startsAt: startsAt.toISOString(),
        title: title.trim(),
      },
      appointmentId
    );

    if (saved) {
      navigation.goBack();
      return;
    }

    Alert.alert('Appointment', actions.error ?? "That appointment couldn't be scheduled.");
  }

  function updatePickedDate(nextDate?: Date) {
    setPickerMode(null);
    if (!nextDate) return;

    setStartsAt((current) => {
      const merged = new Date(current);
      if (pickerMode === 'date') {
        merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
      } else {
        merged.setHours(nextDate.getHours(), nextDate.getMinutes(), 0, 0);
      }
      return merged;
    });
  }

  return (
    <Screen>
      <SectionHeader title={appointmentId ? 'Edit Appointment' : 'Schedule Appointment'} />
      <Text style={[styles.clientName, { color: colors.textSecondary }]}>
        {clientName}
      </Text>

      <Card style={styles.card}>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <SegmentedOptions
          label="Type"
          options={appointmentTypes}
          value={appointmentType}
          onChange={setAppointmentType}
        />
      </Card>

      <Card style={styles.card}>
        <Pressable
          onPress={() => setPickerMode('date')}
          style={[styles.pickerRow, { borderColor: colors.border }]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {startsAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPickerMode('time')}
          style={[styles.pickerRow, { borderColor: colors.border }]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Start Time</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
        <SegmentedOptions
          label="Duration"
          options={durations}
          value={durationMinutes}
          onChange={setDurationMinutes}
          formatter={(value) => `${value}m`}
        />
        <Text style={[styles.endsAt, { color: colors.textMuted }]}>
          Ends {endsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </Card>

      <Card style={styles.card}>
        <SegmentedOptions
          label="Location"
          options={locationTypes}
          value={locationType}
          onChange={setLocationType}
        />
        {locationType === 'video' ? (
          <Input
            label="Meeting URL"
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        ) : (
          <Input
            label={locationType === 'phone' ? 'Phone Details' : 'Location Details'}
            value={locationText}
            onChangeText={setLocationText}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Input
          label="Coach Notes"
          value={coachNotes}
          onChangeText={setCoachNotes}
          multiline
        />
      </Card>

      {actions.error ? (
        <Text style={[styles.error, { color: colors.error }]}>{actions.error}</Text>
      ) : null}

      <Button
        label={appointmentId ? 'Save Changes' : 'Schedule Appointment'}
        loading={actions.isSaving}
        onPress={saveAppointment}
      />

      {pickerMode ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode={pickerMode}
          onChange={(_, selectedDate) => updatePickedDate(selectedDate)}
          value={startsAt}
        />
      ) : null}
    </Screen>
  );
}

function Input({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
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
        ]}
        {...props}
      />
    </View>
  );
}

function SegmentedOptions<T extends string | number>({
  formatter,
  label,
  onChange,
  options,
  value,
}: {
  formatter?: (option: T) => string;
  label: string;
  onChange: (value: T) => void;
  options: T[];
  value: T;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              style={[
                styles.option,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: active ? colors.primaryText : colors.textSecondary },
                ]}
              >
                {formatter ? formatter(option) : formatLabel(String(option))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function roundToNextHalfHour(value: Date) {
  const next = new Date(value);
  next.setMinutes(next.getMinutes() < 30 ? 30 : 60, 0, 0);
  return next;
}

const styles = StyleSheet.create({
  clientName: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
  },
  input: {
    ...typography.body,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  pickerRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  value: {
    ...typography.body,
    fontWeight: '700',
  },
  endsAt: {
    ...typography.caption,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  optionText: {
    ...typography.caption,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
});
