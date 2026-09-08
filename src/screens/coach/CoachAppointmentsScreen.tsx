import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Badge, ProfileAvatar } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useCoachSchedule } from '@/hooks/useAppointments';
import { useAppTheme } from '@/hooks/useTheme';
import { AppointmentWithProfiles } from '@/types';
import { spacing, typography } from '@/utils/theme';

type AgendaItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'appointment'; appointment: AppointmentWithProfiles; id: string };

export default function CoachAppointmentsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const schedule = useCoachSchedule();
  const agenda = useMemo(() => buildAgenda(schedule.data), [schedule.data]);

  if (schedule.isLoading) {
    return <LoadingView label="Loading schedule..." />;
  }

  if (schedule.error && schedule.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load schedule"
          subtitle={schedule.error}
          onRetry={schedule.refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={agenda}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={schedule.isRefreshing}
            onRefresh={schedule.refresh}
          />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Schedule"
              subtitle="Today, upcoming sessions, and appointment history"
              action={
                <Pressable
                  accessibilityLabel="Create appointment"
                  onPress={() => navigation.navigate('AppointmentEditor')}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={24} color={colors.primaryText} />
                </Pressable>
              }
            />
            {schedule.error ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {schedule.error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No appointments yet."
            subtitle="Schedule check-ins and progress reviews from a client profile."
          />
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
          ) : (
            <AgendaRow
              appointment={item.appointment}
              onPress={() =>
                navigation.navigate('CoachAppointmentDetail', {
                  appointmentId: item.appointment.id,
                })
              }
            />
          )
        }
      />
    </Screen>
  );
}

function AgendaRow({
  appointment,
  onPress,
}: {
  appointment: AppointmentWithProfiles;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const start = new Date(appointment.starts_at);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.timeCol}>
          <Text style={[styles.time, { color: colors.primary }]}>
            {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
        <ProfileAvatar
          name={appointment.client?.full_name ?? 'Client'}
          uri={appointment.client?.avatar_url}
          size={44}
        />
        <View style={styles.flex}>
          <Text style={[styles.client, { color: colors.textPrimary }]}>
            {appointment.client?.full_name ?? 'Client'}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {appointment.title}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {formatLocation(appointment)}
          </Text>
        </View>
        <Badge
          label={appointment.status}
          tone={appointment.status === 'scheduled' ? 'primary' : 'muted'}
        />
      </Card>
    </Pressable>
  );
}

function buildAgenda(appointments: AppointmentWithProfiles[]): AgendaItem[] {
  const today: AppointmentWithProfiles[] = [];
  const upcoming: AppointmentWithProfiles[] = [];
  const past: AppointmentWithProfiles[] = [];
  const now = Date.now();

  appointments.forEach((appointment) => {
    const start = new Date(appointment.starts_at);
    if (isToday(start) && appointment.status === 'scheduled') today.push(appointment);
    else if (appointment.status === 'scheduled' && new Date(appointment.ends_at).getTime() >= now) {
      upcoming.push(appointment);
    } else {
      past.push(appointment);
    }
  });

  const sections: AgendaItem[] = [];
  addSection(sections, 'today', 'Today', today.sort(sortAscending));
  addSection(sections, 'upcoming', 'Upcoming', upcoming.sort(sortAscending));
  addSection(sections, 'past', 'Past', past.sort(sortDescending));
  return sections;
}

function addSection(
  sections: AgendaItem[],
  id: string,
  title: string,
  appointments: AppointmentWithProfiles[]
) {
  if (appointments.length === 0) return;
  sections.push({ id, kind: 'header', title });
  appointments.forEach((appointment) =>
    sections.push({ appointment, id: appointment.id, kind: 'appointment' })
  );
}

function sortAscending(a: AppointmentWithProfiles, b: AppointmentWithProfiles) {
  return a.starts_at.localeCompare(b.starts_at);
}

function sortDescending(a: AppointmentWithProfiles, b: AppointmentWithProfiles) {
  return b.starts_at.localeCompare(a.starts_at);
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

function formatLocation(appointment: AppointmentWithProfiles) {
  if (appointment.location_type === 'video') return 'Video';
  if (appointment.location_type === 'phone') return 'Phone';
  return appointment.location_text || appointment.location_type.replace('_', ' ');
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  error: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  timeCol: {
    width: 72,
  },
  time: {
    ...typography.caption,
    fontWeight: '800',
  },
  flex: {
    flex: 1,
  },
  client: {
    ...typography.body,
    fontWeight: '800',
  },
  meta: {
    ...typography.caption,
  },
});
