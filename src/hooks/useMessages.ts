import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { AppServiceError } from '@/services/errors';
import {
  getConversationById,
  getConversationMessages,
  getClientConversations,
  getOrCreateConversationForClient,
  getPrimaryCoach,
  getVisibleConversations,
  markConversationRead,
  sendTextMessage,
  sendVideoFeedbackMessage,
  subscribeToConversationUpdates,
  subscribeToMessages,
  unsubscribe,
} from '@/services/messages.service';
import { ConversationSummary, Message, Profile } from '@/types';

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

export function useConversations() {
  return useConversationList(getVisibleConversations);
}

export function useClientConversations() {
  return useConversationList(getClientConversations);
}

export function usePrimaryCoach() {
  const [data, setData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const coach = await getPrimaryCoach();
      if (requestId.current === currentRequest) {
        setData(coach);
      }
    } catch (loadError) {
      console.error('Unable to load primary coach:', loadError);
      if (requestId.current === currentRequest) {
        setError(getUserMessage(loadError, 'Unable to load your coach.'));
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    error,
    isLoading,
    refresh,
  };
}

function useConversationList(
  loader: () => Promise<ConversationSummary[]>
) {
  const [data, setData] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async (refreshing = false) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const conversations = await loader();
      if (requestId.current === currentRequest) {
        setData(conversations);
      }
    } catch (loadError) {
      console.error('Unable to load conversations:', loadError);
      if (requestId.current === currentRequest) {
        setError(getUserMessage(loadError, 'Unable to load messages.'));
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [loader]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = subscribeToConversationUpdates(() => {
      void refresh(true);
    });

    return () => {
      unsubscribe(channel);
    };
  }, [refresh]);

  const pullToRefresh = useCallback(() => refresh(true), [refresh]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh: pullToRefresh,
  };
}

export function useConversation({
  clientId,
  coachId,
  conversationId,
}: {
  clientId?: string;
  coachId?: string;
  conversationId?: string;
}) {
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const nextConversation = conversationId
        ? await getConversationById(conversationId)
        : clientId || coachId
          ? await getOrCreateConversationForClient({ clientId, coachId })
          : null;

      if (!nextConversation) {
        setConversation(null);
        setMessages([]);
        return;
      }

      const nextMessages = await getConversationMessages(nextConversation.id);
      await markConversationRead(nextConversation.id);

      if (requestId.current === currentRequest) {
        setConversation(nextConversation);
        setMessages(nextMessages);
      }
    } catch (loadError) {
      console.error('Unable to load conversation:', loadError);
      if (requestId.current === currentRequest) {
        setError(getUserMessage(loadError, 'Unable to load conversation.'));
        setConversation(null);
        setMessages([]);
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, [clientId, coachId, conversationId]);

  const refreshMessages = useCallback(async () => {
    const activeConversationId = conversation?.id ?? conversationId;
    if (!activeConversationId) return;

    try {
      const nextMessages = await getConversationMessages(activeConversationId);
      await markConversationRead(activeConversationId);
      setMessages(reconcileMessages(nextMessages));
    } catch (loadError) {
      console.error('Unable to refresh messages:', loadError);
      setError(getUserMessage(loadError, 'Unable to refresh messages.'));
    }
  }, [conversation?.id, conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!conversation?.id) return undefined;

    const channel = subscribeToMessages({
      conversationId: conversation.id,
      onChange: () => {
        void refreshMessages();
      },
    });

    return () => {
      unsubscribe(channel);
    };
  }, [conversation?.id, refreshMessages]);

  const sendText = useCallback(
    async (body: string) => {
      if (!conversation) return false;

      setIsSending(true);
      setError(null);

      try {
        const sent = await sendTextMessage({ body, conversation });
        setMessages((current) => reconcileMessages([...current, sent]));
        await refreshMessages();
        return true;
      } catch (sendError) {
        console.error('Unable to send message:', sendError);
        setError(getUserMessage(sendError, 'Unable to send message.'));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversation, refreshMessages]
  );

  const sendVideo = useCallback(
    async (asset: ImagePicker.ImagePickerAsset, caption?: string) => {
      if (!conversation) return false;

      setIsSending(true);
      setError(null);

      try {
        const sent = await sendVideoFeedbackMessage({ asset, caption, conversation });
        setMessages((current) => reconcileMessages([...current, sent]));
        await refreshMessages();
        return true;
      } catch (sendError) {
        console.error('Unable to send video feedback:', sendError);
        setError(getUserMessage(sendError, 'Unable to send video feedback.'));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversation, refreshMessages]
  );

  return {
    conversation,
    error,
    isLoading,
    isSending,
    messages,
    refresh: load,
    refreshMessages,
    sendText,
    sendVideo,
  };
}

function reconcileMessages(messages: Message[]) {
  const byId = new Map<string, Message>();

  for (const message of messages) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}
