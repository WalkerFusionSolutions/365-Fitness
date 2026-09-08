import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Badge, ProfileAvatar } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useClientConversations, usePrimaryCoach } from '@/hooks/useMessages';
import { useAppTheme } from '@/hooks/useTheme';
import { ConversationSummary } from '@/types';
import { spacing, typography } from '@/utils/theme';

export default function ClientMessagesScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const conversations = useClientConversations();
  const primaryCoach = usePrimaryCoach();
  const rows = useMemo(
    () => conversations.data,
    [conversations.data]
  );
  const isLoading = conversations.isLoading || primaryCoach.isLoading;
  const error = conversations.error ?? primaryCoach.error;

  if (isLoading) {
    return <LoadingView label="Loading messages..." />;
  }

  if (error && rows.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load messages"
          subtitle={error}
          onRetry={() => {
            conversations.refresh();
            primaryCoach.refresh();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={conversations.isRefreshing}
            onRefresh={() => {
              conversations.refresh();
              primaryCoach.refresh();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Message Coach"
              subtitle="Private check-ins, form videos, and coaching feedback."
            />
            {error ? (
              <Text style={[styles.inlineError, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <StartCoachConversation
            coachName={primaryCoach.data?.full_name}
            disabled={!primaryCoach.data}
            onPress={() =>
              navigation.navigate('ClientConversation', {
                coachId: primaryCoach.data?.id,
                title: primaryCoach.data?.full_name ?? 'Coach',
              })
            }
          />
        }
        renderItem={({ item }) => (
          <CoachConversationRow
            conversation={item}
            onPress={() =>
              navigation.navigate('ClientConversation', {
                conversationId: item.id,
                coachId: item.coach_id,
                title: item.coach?.full_name ?? 'Coach',
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function StartCoachConversation({
  coachName,
  disabled,
  onPress,
}: {
  coachName?: string | null;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View>
      <EmptyState
        icon="chatbubbles-outline"
        title="No conversations yet"
        subtitle={
          coachName
            ? `Start a private thread with ${coachName}.`
            : 'Your coach will appear here when messaging is available.'
        }
      />
      <Button
        label="Message Coach"
        disabled={disabled}
        onPress={onPress}
        style={styles.startButton}
      />
    </View>
  );
}

function CoachConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationSummary;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const coachName = conversation.coach?.full_name?.trim() || 'Coach';

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <ProfileAvatar name={coachName} uri={conversation.coach?.avatar_url} size={50} />
        <View style={styles.rowText}>
          <View style={styles.titleRow}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
              {coachName}
            </Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {formatConversationTime(conversation.last_message_at)}
            </Text>
          </View>
          <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
            {conversation.last_message_preview || 'No messages yet'}
          </Text>
        </View>
        {conversation.unreadCount > 0 ? (
          <Badge label={String(conversation.unreadCount)} tone="primary" />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </Card>
    </Pressable>
  );
}

function formatConversationTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  inlineError: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  startButton: {
    marginHorizontal: spacing.lg,
  },
  rowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  rowTitle: {
    ...typography.h3,
    flex: 1,
  },
  rowSubtitle: {
    ...typography.caption,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
  },
});
