import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Badge, ProfileAvatar } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useClientAppointments } from '@/hooks/useAppointments';
import { useAppTheme } from '@/hooks/useTheme';
import { AppointmentWithProfiles } from '@/types';
import { spacing, typography } from '@/utils/theme';

export default function ClientAppointmentsScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const appointments = useClientAppointments(profile?.id);
  const sections = useMemo(
    () => splitAppointments(appointments.data),
    [appointments.data]
  );

  if (appointments.isLoading) {
    return <LoadingView label="Loading appointments..." />;
  }

  if (appointments.error && appointments.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load appointments"
          subtitle={appointments.error}
          onRetry={appointments.refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={[...sections.upcoming, ...sections.past]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={appointments.isRefreshing}
            onRefresh={appointments.refresh}
          />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Appointments"
              subtitle="Upcoming sessions and coaching check-ins"
            />
            {sections.next ? (
              <NextAppointmentCard
                appointment={sections.next}
                onPress={() =>
                  navigation.navigate('ClientAppointmentDetail', {
                    appointmentId: sections.next!.id,
                  })
                }
              />
            ) : null}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Upcoming
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No upcoming appointments."
            subtitle="Scheduled sessions from your coach will appear here."
          />
        }
        renderItem={({ item, index }) => {
          const isPast = sections.upcoming.length <= index;
          const shouldShowPastHeader =
            isPast && index === sections.upcoming.length;

          return (
            <>
              {shouldShowPastHeader ? (
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Past
                </Text>
              ) : null}
              <AppointmentRow
                appointment={item}
                onPress={() =>
                  navigation.navigate('ClientAppointmentDetail', {
                    appointmentId: item.id,
                  })
                }
              />
            </>
          );
        }}
        ListFooterComponent={
          sections.upcoming.length > 0 && sections.past.length === 0 ? (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Past
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Completed and cancelled appointments will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function NextAppointmentCard({
  appointment,
  onPress,
}: {
  appointment: AppointmentWithProfiles;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.nextCard}>
      <View style={styles.nextHeader}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="calendar" size={22} color={colors.primaryText} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {appointment.title}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {formatAppointmentWindow(appointment)}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {appointment.coach?.full_name ?? 'Coach'}
          </Text>
        </View>
      </View>
      <Button label="View Details" onPress={onPress} />
    </Card>
  );
}

function AppointmentRow({
  appointment,
  onPress,
}: {
  appointment: AppointmentWithProfiles;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <ProfileAvatar
          name={appointment.coach?.full_name ?? 'Coach'}
          uri={appointment.coach?.avatar_url}
          size={46}
        />
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {appointment.title}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {formatAppointmentWindow(appointment)}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {formatLocation(appointment)}
          </Text>
        </View>
        <Badge label={formatStatus(appointment.status)} tone={appointment.status === 'scheduled' ? 'primary' : 'muted'} />
      </Card>
    </Pressable>
  );
}

function splitAppointments(appointments: AppointmentWithProfiles[]) {
  const now = Date.now();
  const upcoming = appointments
    .filter((appointment) => appointment.status === 'scheduled' && new Date(appointment.ends_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = appointments
    .filter((appointment) => !upcoming.some((next) => next.id === appointment.id))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return { next: upcoming[0] ?? null, past, upcoming };
}

function formatAppointmentWindow(appointment: AppointmentWithProfiles) {
  const start = new Date(appointment.starts_at);
  const end = new Date(appointment.ends_at);
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function formatLocation(appointment: AppointmentWithProfiles) {
  if (appointment.location_type === 'video') return appointment.meeting_url ? 'Video meeting' : 'Video';
  if (appointment.location_type === 'phone') return 'Phone';
  return appointment.location_text || appointment.location_type.replace('_', ' ');
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  nextCard: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  nextHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  flex: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
  },
  emptyText: {
    ...typography.body,
  },
});
