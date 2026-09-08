import React, { useMemo, useState } from 'react';
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
import { AppHeader, Badge, ProfileAvatar, SearchInput } from '@/components/AppUI';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useConversations } from '@/hooks/useMessages';
import { useAppTheme } from '@/hooks/useTheme';
import { ConversationSummary } from '@/types';
import { spacing, typography } from '@/utils/theme';

export default function CoachMessagesScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { data, error, isLoading, isRefreshing, refresh } = useConversations();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data;

    return data.filter((conversation) =>
      (conversation.client?.full_name ?? 'Client')
        .toLowerCase()
        .includes(needle)
    );
  }, [data, search]);

  if (isLoading) {
    return <LoadingView label="Loading messages..." />;
  }

  if (error && data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load messages"
          subtitle={error}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <AppHeader
              eyebrow=""
              title="Messages"
              subtitle="Client form checks and private coaching feedback."
            />
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search clients"
            />
            {error ? (
              <Text style={[styles.inlineError, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title={search ? 'No conversations found.' : 'No conversations yet.'}
            subtitle={
              search
                ? 'Try a different client name.'
                : 'Open a client profile and start a message thread.'
            }
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() =>
              navigation.navigate('CoachConversation', {
                conversationId: item.id,
                clientId: item.client_id,
                title: item.client?.full_name ?? 'Client',
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationSummary;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const clientName = conversation.client?.full_name?.trim() || 'Client';

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <ProfileAvatar name={clientName} uri={conversation.client?.avatar_url} size={50} />
        <View style={styles.rowText}>
          <View style={styles.titleRow}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
              {clientName}
            </Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {formatConversationTime(conversation.last_message_at)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.rowSubtitle, { color: colors.textSecondary }]}
          >
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
    marginTop: spacing.sm,
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
