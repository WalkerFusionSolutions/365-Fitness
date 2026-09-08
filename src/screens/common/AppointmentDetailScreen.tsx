import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, IconRow, ProfileAvatar } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAppointment, useAppointmentActions } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useTheme';
import { AppointmentWithProfiles } from '@/types';
import { spacing, typography } from '@/utils/theme';

type RouteParams = RouteProp<Record<string, { appointmentId: string }>, string>;

export default function AppointmentDetailScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { data, error, isLoading, refresh, setData } = useAppointment(
    route.params.appointmentId
  );
  const actions = useAppointmentActions();
  const isCoach = profile?.role === 'coach';

  if (isLoading) {
    return <LoadingView label="Loading appointment..." />;
  }

  if (error || !data) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load appointment"
          subtitle={error ?? 'Please try again.'}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  async function updateStatus(status: 'cancelled' | 'completed') {
    const updated = await actions.changeStatus(data!.id, status);
    if (updated) {
      setData({ ...data!, ...updated });
    } else if (actions.error) {
      Alert.alert('Appointment', actions.error);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <ProfileAvatar
          name={isCoach ? data.client?.full_name : data.coach?.full_name}
          uri={isCoach ? data.client?.avatar_url : data.coach?.avatar_url}
          size={64}
        />
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {data.title}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {formatType(data.appointment_type)}
          </Text>
        </View>
        <Badge
          label={formatStatus(data.status)}
          tone={data.status === 'scheduled' ? 'primary' : 'muted'}
        />
      </View>

      <Card style={styles.card}>
        <Detail label="Date" value={formatDate(data.starts_at)} />
        <Detail label="Time" value={formatTimeWindow(data)} />
        <Detail label="Duration" value={formatDuration(data)} />
        <Detail
          label={isCoach ? 'Client' : 'Coach'}
          value={isCoach ? data.client?.full_name ?? 'Client' : data.coach?.full_name ?? 'Coach'}
        />
      </Card>

      <Card style={styles.card}>
        <Detail label="Location" value={formatLocation(data)} />
        {data.location_type === 'video' && isValidUrl(data.meeting_url) ? (
          <Button
            label="Join Meeting"
            onPress={() => Linking.openURL(data.meeting_url!)}
          />
        ) : null}
      </Card>

      {data.description ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Description
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {data.description}
          </Text>
        </Card>
      ) : null}

      {isCoach && data.coach_notes ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Coach Notes
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {data.coach_notes}
          </Text>
        </Card>
      ) : null}

      {isCoach ? (
        <View style={styles.actions}>
          <IconRow
            icon="create-outline"
            title="Reschedule or Edit"
            subtitle="Update time, location, notes, or title"
            onPress={() =>
              navigation.navigate('AppointmentEditor', {
                appointmentId: data.id,
                clientId: data.client_id,
                clientName: data.client?.full_name,
              })
            }
          />
          {data.status === 'scheduled' ? (
            <>
              <Button
                label="Mark Completed"
                onPress={() => updateStatus('completed')}
                loading={actions.isSaving}
              />
              <Button
                label="Cancel Appointment"
                variant="outline"
                onPress={() => updateStatus('cancelled')}
                loading={actions.isSaving}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {data.status !== 'scheduled' ? (
        <View style={styles.historyNote}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            This appointment is part of your history.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

function formatType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeWindow(appointment: AppointmentWithProfiles) {
  const start = new Date(appointment.starts_at);
  const end = new Date(appointment.ends_at);
  return `${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function formatDuration(appointment: AppointmentWithProfiles) {
  const minutes = Math.round(
    (new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000
  );
  return `${minutes} minutes`;
}

function formatLocation(appointment: AppointmentWithProfiles) {
  if (appointment.location_type === 'video') return appointment.meeting_url ?? 'Video meeting';
  if (appointment.location_type === 'phone') return appointment.location_text || 'Phone call';
  return appointment.location_text || formatType(appointment.location_type);
}

function isValidUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  title: {
    ...typography.h2,
  },
  meta: {
    ...typography.caption,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  body: {
    ...typography.body,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.body,
    flex: 1,
  },
  detailValue: {
    ...typography.body,
    flex: 1.4,
    fontWeight: '700',
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  historyNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
