import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/AppUI';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useMessages';
import { useAppTheme } from '@/hooks/useTheme';
import { ChatMessage } from '@/types';
import { radius, spacing, typography } from '@/utils/theme';

type ConversationParams = {
  clientId?: string;
  coachId?: string;
  conversationId?: string;
  title?: string;
};
type ConversationRoute = RouteProp<Record<string, ConversationParams>, string>;

export default function ConversationScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<ConversationRoute>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const isNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const [draft, setDraft] = useState('');
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [viewerMessage, setViewerMessage] = useState<ChatMessage | null>(null);
  const params = route.params ?? {};
  const conversationState = useConversation({
    clientId: params.clientId,
    coachId: params.coachId,
    conversationId: params.conversationId,
  });
  const otherProfile = conversationState.conversation?.otherProfile;
  const title = useMemo(
    () => params.title ?? otherProfile?.full_name ?? 'Messages',
    [otherProfile?.full_name, params.title]
  );
  const subtitle = otherProfile?.role === 'coach' ? 'Coach' : 'Client';
  const canSend = draft.trim().length > 0 && !conversationState.isSending;

  useFocusEffect(
    React.useCallback(() => {
      void conversationState.refreshMessages();
    }, [conversationState.refreshMessages])
  );

  useEffect(() => {
    const messageCount = conversationState.messages.length;
    const previousCount = previousMessageCountRef.current;
    previousMessageCountRef.current = messageCount;

    if (messageCount === 0) return;

    const newestMessage = conversationState.messages[messageCount - 1];

    if (isNearBottomRef.current) {
      scrollToEnd(previousCount > 0);
      setShowNewMessages(false);
      return;
    }

    if (messageCount > previousCount && newestMessage?.sender_id !== profile?.id) {
      setShowNewMessages(true);
    }
  }, [conversationState.messages, profile?.id]);

  if (conversationState.isLoading) {
    return <LoadingView label="Opening conversation..." />;
  }

  if (conversationState.error && !conversationState.conversation) {
    return (
      <Screen>
        <ErrorState
          title="Unable to open messages"
          subtitle={conversationState.error}
          onRetry={conversationState.refresh}
        />
      </Screen>
    );
  }

  function scrollToEnd(animated = true) {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const isNearBottom = distanceFromBottom < 96;
    isNearBottomRef.current = isNearBottom;
    if (isNearBottom) {
      setShowNewMessages(false);
    }
  }

  function handleContentSizeChange() {
    if (isNearBottomRef.current) {
      scrollToEnd(true);
    }
  }

  function jumpToNewest() {
    isNearBottomRef.current = true;
    setShowNewMessages(false);
    scrollToEnd(true);
  }

  async function sendMessage() {
    if (!canSend) return;

    const body = draft;
    const sent = await conversationState.sendText(body);
    if (sent) {
      setDraft('');
      isNearBottomRef.current = true;
      scrollToEnd(true);
    }
  }

  async function pickVideo() {
    if (conversationState.isSending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Video access needed',
        'Allow photo library access to upload a form-check video.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const sent = await conversationState.sendVideo(result.assets[0]);
    if (sent) {
      isNearBottomRef.current = true;
      scrollToEnd(true);
    }
  }

  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Avatar name={title} size={40} />
          <View style={styles.headerText}>
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: colors.textPrimary }]}
            >
              {title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        {conversationState.error ? (
          <Text style={[styles.inlineError, { color: colors.error }]}>
            {conversationState.error}
          </Text>
        ) : null}

        <FlatList
          ref={listRef}
          data={conversationState.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              subtitle="Start with a quick check-in or a form video."
            />
          }
          renderItem={({ item, index }) => {
            const previous = conversationState.messages[index - 1];
            const next = conversationState.messages[index + 1];
            const showDateSeparator =
              !previous || getDateKey(previous.created_at) !== getDateKey(item.created_at);
            const isMine = item.sender_id === profile?.id;
            const previousIsSameSender =
              previous?.sender_id === item.sender_id &&
              isCloseInTime(previous.created_at, item.created_at);
            const nextIsSameSender =
              next?.sender_id === item.sender_id &&
              isCloseInTime(item.created_at, next.created_at);

            return (
              <>
                {showDateSeparator ? (
                  <DateSeparator value={item.created_at} />
                ) : null}
                <MessageBubble
                  compactTop={previousIsSameSender}
                  compactBottom={nextIsSameSender}
                  isMine={isMine}
                  message={item}
                  onOpenVideo={() => setViewerMessage(item)}
                  onRetryVideo={conversationState.refreshMessages}
                />
              </>
            );
          }}
        />

        {showNewMessages ? (
          <Pressable
            accessibilityLabel="Jump to new messages"
            onPress={jumpToNewest}
            style={[
              styles.newMessagesButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.newMessagesText, { color: colors.primaryText }]}>
              New messages
            </Text>
            <Ionicons name="arrow-down" size={16} color={colors.primaryText} />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.composer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityLabel="Attach form-check video"
            disabled={conversationState.isSending}
            onPress={pickVideo}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surfaceSecondary },
              conversationState.isSending && styles.disabled,
            ]}
          >
            <Ionicons name="videocam-outline" size={22} color={colors.primary} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
          />
          <Pressable
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={sendMessage}
            style={[
              styles.iconButton,
              {
                backgroundColor: canSend ? colors.primary : colors.surfaceSecondary,
                opacity: canSend ? 1 : 0.6,
              },
            ]}
          >
            {conversationState.isSending ? (
              <ActivityIndicator color={colors.primaryText} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={canSend ? colors.primaryText : colors.textMuted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <VideoMessageViewer
        message={viewerMessage}
        onClose={() => setViewerMessage(null)}
      />
    </Screen>
  );
}

const DateSeparator = React.memo(function DateSeparator({ value }: { value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.dateSeparator}>
      <Text
        style={[
          styles.dateSeparatorText,
          { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary },
        ]}
      >
        {formatDateSeparator(value)}
      </Text>
    </View>
  );
});

const MessageBubble = React.memo(function MessageBubble({
  compactBottom,
  compactTop,
  isMine,
  message,
  onOpenVideo,
  onRetryVideo,
}: {
  compactBottom: boolean;
  compactTop: boolean;
  isMine: boolean;
  message: ChatMessage;
  onOpenVideo: () => void;
  onRetryVideo: () => void;
}) {
  const { colors } = useAppTheme();
  const hasVideo = message.message_type === 'video_feedback';

  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.mineWrap : styles.theirWrap,
        compactTop && styles.compactTop,
        compactBottom && styles.compactBottom,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.mineBubble : styles.theirBubble,
          {
            backgroundColor: isMine ? colors.primary : colors.cardBackground,
            borderColor: isMine ? colors.primary : colors.border,
          },
        ]}
      >
        {hasVideo ? (
          <VideoMessagePreview
            isMine={isMine}
            message={message}
            onOpen={onOpenVideo}
            onRetry={onRetryVideo}
          />
        ) : null}
        {message.body ? (
          <Text
            style={[
              styles.messageText,
              { color: isMine ? colors.primaryText : colors.textPrimary },
            ]}
          >
            {message.body}
          </Text>
        ) : null}
        <Text
          style={[
            styles.timestamp,
            { color: isMine ? colors.primaryText : colors.textMuted },
          ]}
        >
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
});

const VideoMessagePreview = React.memo(function VideoMessagePreview({
  isMine,
  message,
  onOpen,
  onRetry,
}: {
  isMine: boolean;
  message: ChatMessage;
  onOpen: () => void;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const signedUrl = message.signedVideoUrl ?? null;

  if (!signedUrl) {
    return (
      <Pressable
        onPress={onRetry}
        style={[styles.videoFallback, { backgroundColor: colors.surfaceSecondary }]}
      >
        <Ionicons name="refresh" size={24} color={colors.primary} />
        <Text style={[styles.videoFallbackText, { color: colors.textSecondary }]}>
          Tap to reload video
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel="Open video feedback"
      onPress={onOpen}
      style={[
        styles.videoPreview,
        { backgroundColor: isMine ? colors.primaryDark : colors.surfaceSecondary },
      ]}
    >
      <View style={styles.videoPoster}>
        <Ionicons
          name="videocam"
          size={34}
          color={isMine ? colors.primaryText : colors.primary}
        />
      </View>
      <View style={styles.videoOverlay}>
        <View style={[styles.playButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="play" size={28} color={colors.primary} />
        </View>
        <Text style={styles.videoLabel}>Video feedback</Text>
      </View>
    </Pressable>
  );
});

function VideoMessageViewer({
  message,
  onClose,
}: {
  message: ChatMessage | null;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const signedUrl = message?.signedVideoUrl ?? null;
  const player = useVideoPlayer(signedUrl, (instance) => {
    instance.loop = false;
  });

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={Boolean(message)}
    >
      <View style={styles.viewer}>
        <View
          pointerEvents="box-none"
          style={[
            styles.viewerOverlay,
            { paddingTop: insets.top + spacing.sm },
          ]}
        >
          <View style={styles.viewerHeader}>
            <Pressable
              accessibilityLabel="Close video"
              hitSlop={8}
              onPress={onClose}
              style={styles.viewerClose}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
            <Text style={styles.viewerTitle}>Video feedback</Text>
          </View>
        </View>
        <View style={styles.viewerBody}>
          {signedUrl ? (
            <VideoView
              player={player}
              allowsPictureInPicture
              fullscreenOptions={{ enable: true }}
              nativeControls
              contentFit="contain"
              style={styles.viewerVideo}
            />
          ) : (
            <View style={styles.viewerState}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.viewerStateText}>Loading video...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getDateKey(value: string) {
  return new Date(value).toDateString();
}

function isCloseInTime(first: string, second: string) {
  const firstTime = new Date(first).getTime();
  const secondTime = new Date(second).getTime();
  return Math.abs(secondTime - firstTime) < 5 * 60 * 1000;
}

function formatDateSeparator(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerSubtitle: {
    ...typography.caption,
    lineHeight: 18,
  },
  inlineError: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  messages: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateSeparatorText: {
    ...typography.caption,
    borderRadius: radius.round,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bubbleWrap: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  compactTop: {
    marginTop: 1,
  },
  compactBottom: {
    marginBottom: 1,
  },
  mineWrap: {
    justifyContent: 'flex-end',
  },
  theirWrap: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderWidth: 1,
    maxWidth: '80%',
    padding: spacing.sm,
    rowGap: spacing.xs,
  },
  mineBubble: {
    borderBottomRightRadius: radius.sm,
    borderBottomLeftRadius: radius.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  theirBubble: {
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  messageText: {
    ...typography.body,
  },
  timestamp: {
    ...typography.caption,
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.76,
  },
  videoPreview: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    minWidth: 220,
    overflow: 'hidden',
    width: '100%',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  videoPoster: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(8, 13, 12, 0.22)',
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 58,
  },
  videoLabel: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  videoFallback: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    justifyContent: 'center',
    minWidth: 220,
    width: '100%',
  },
  videoFallbackText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
  },
  newMessagesButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.round,
    bottom: 82,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    position: 'absolute',
  },
  newMessagesText: {
    ...typography.caption,
    fontWeight: '700',
  },
  input: {
    ...typography.body,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    maxHeight: 112,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  disabled: {
    opacity: 0.6,
  },
  viewer: {
    backgroundColor: '#080D0C',
    flex: 1,
  },
  viewerOverlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  viewerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  viewerClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  viewerTitle: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  viewerBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  viewerVideo: {
    height: '100%',
    width: '100%',
  },
  viewerState: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewerStateText: {
    ...typography.body,
    color: '#FFFFFF',
  },
});
