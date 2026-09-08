import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppTheme } from '@/hooks/useTheme';
import { Notification } from '@/types';
import { spacing, typography } from '@/utils/theme';

type NotificationListItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'notification'; id: string; notification: Notification };

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const notifications = useNotifications(profile?.id);
  const rows = useMemo(
    () => groupNotifications(notifications.data),
    [notifications.data]
  );

  if (notifications.isLoading) {
    return <LoadingView label="Loading notifications..." />;
  }

  if (notifications.error && notifications.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load notifications"
          subtitle={notifications.error}
          onRetry={notifications.refresh}
        />
      </Screen>
    );
  }

  async function openNotification(notification: Notification) {
    await notifications.markRead(notification.id);
    navigateFromNotification(notification, navigation, profile?.role);
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={notifications.isRefreshing}
            onRefresh={notifications.refresh}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Notifications
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Appointments, messages, and coaching updates
                </Text>
              </View>
              {notifications.unreadCount > 0 ? (
                <Badge label={String(notifications.unreadCount)} />
              ) : null}
            </View>
            {notifications.unreadCount > 0 ? (
              <Button
                label="Mark All Read"
                variant="outline"
                onPress={notifications.markAllRead}
                style={styles.markAll}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet."
            subtitle="Appointment reminders and coaching updates will appear here."
          />
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
          ) : (
            <NotificationRow
              notification={item.notification}
              onPress={() => openNotification(item.notification)}
            />
          )
        }
      />
    </Screen>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const isRead = notification.is_read ?? notification.read ?? false;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: isRead ? colors.surfaceSecondary : colors.primary },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(notification)}
            size={20}
            color={isRead ? colors.primary : colors.primaryText}
          />
        </View>
        <View style={styles.flex}>
          <View style={styles.rowTitleWrap}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
              {notification.title}
            </Text>
            {!isRead ? (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            ) : null}
          </View>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {notification.body}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatRelativeTime(notification.created_at)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

export function navigateFromNotification(
  notification: Pick<Notification, 'related_entity_id' | 'related_entity_type' | 'type'>,
  navigation: { navigate: (name: string, params?: object) => void },
  role?: string
) {
  const entityId = notification.related_entity_id;
  if (!entityId) return;

  if (notification.related_entity_type === 'appointment') {
    navigation.navigate(
      role === 'coach' ? 'CoachAppointmentDetail' : 'ClientAppointmentDetail',
      { appointmentId: entityId }
    );
  }

  if (notification.related_entity_type === 'message') {
    navigation.navigate(role === 'coach' ? 'CoachConversation' : 'ClientConversation', {
      conversationId: entityId,
    });
  }

  if (notification.related_entity_type === 'workout') {
    navigation.navigate('WorkoutDetail', { workoutId: entityId });
  }

  if (notification.related_entity_type === 'meal_plan') {
    navigation.navigate('MealPlanDetail', { mealPlanId: entityId });
  }
}

function groupNotifications(notifications: Notification[]): NotificationListItem[] {
  const sections: NotificationListItem[] = [];
  addGroup(sections, 'today', 'Today', notifications.filter((item) => getGroup(item.created_at) === 'today'));
  addGroup(sections, 'yesterday', 'Yesterday', notifications.filter((item) => getGroup(item.created_at) === 'yesterday'));
  addGroup(sections, 'earlier', 'Earlier', notifications.filter((item) => getGroup(item.created_at) === 'earlier'));
  return sections;
}

function addGroup(
  rows: NotificationListItem[],
  id: string,
  title: string,
  notifications: Notification[]
) {
  if (notifications.length === 0) return;
  rows.push({ id, kind: 'header', title });
  notifications.forEach((notification) =>
    rows.push({ id: notification.id, kind: 'notification', notification })
  );
}

function getGroup(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'today';
  if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
  return 'earlier';
}

function getNotificationIcon(notification: Notification) {
  if (notification.type.startsWith('appointment')) return 'calendar-outline';
  if (notification.type === 'message_received') return 'chatbubble-outline';
  if (notification.type === 'workout_assigned') return 'barbell-outline';
  if (notification.type === 'meal_plan_assigned') return 'restaurant-outline';
  return 'notifications-outline';
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
  },
  markAll: {
    marginTop: spacing.md,
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
  iconBadge: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  flex: {
    flex: 1,
  },
  rowTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    flex: 1,
    fontWeight: '800',
  },
  unreadDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  body: {
    ...typography.caption,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
  },
});
