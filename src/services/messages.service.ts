import * as ImagePicker from 'expo-image-picker';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AppServiceError, throwIfSupabaseError, toServiceError } from '@/services/errors';
import { supabase } from '@/services/supabase';
import {
  ConversationSummary,
  Message,
  MessageAttachment,
  Profile,
} from '@/types';
import { Database } from '@/types/database';

const VIDEO_BUCKET = 'message-videos';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 15;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2000;
const ACCEPTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/webm',
];

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type AttachmentRow = Database['public']['Tables']['message_attachments']['Row'];
type MessageWithAttachmentRow = MessageRow & {
  attachment?: AttachmentRow | null;
};

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppServiceError('Unable to verify your session.', error);
  }

  if (!user) {
    throw new AppServiceError('Please sign in to continue.');
  }

  return user.id;
}

async function getCurrentProfile() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  throwIfSupabaseError(error, 'Unable to load your profile.');

  return data as Profile;
}

async function getVisibleProfilesById(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

  if (uniqueIds.length === 0) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);

  throwIfSupabaseError(error, 'Unable to load conversation profiles.');

  return new Map((data ?? []).map((profile) => [profile.id, profile as Profile]));
}

export async function getVisibleConversations(): Promise<ConversationSummary[]> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load conversations.');

  return hydrateConversations(data ?? [], currentUserId);
}

export async function getClientConversations(): Promise<ConversationSummary[]> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', currentUserId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Unable to load conversations.');

  return hydrateConversations(data ?? [], currentUserId);
}

export async function getPrimaryCoach(): Promise<Profile | null> {
  const { data, error } = await supabase.rpc('get_primary_coach');

  throwIfSupabaseError(error, 'Unable to load your coach.');

  const rows = (data ?? []) as Profile[];
  return rows[0] ?? null;
}

export async function getConversationById(
  conversationId: string
): Promise<ConversationSummary> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  throwIfSupabaseError(error, 'Unable to load conversation.');

  if (!data) {
    throw new AppServiceError('Conversation not found.');
  }

  const [conversation] = await hydrateConversations([data], currentUserId);
  return conversation;
}

export async function getOrCreateConversationForClient({
  clientId,
  coachId,
}: {
  clientId?: string;
  coachId?: string;
}): Promise<ConversationSummary> {
  const currentProfile = await getCurrentProfile();
  const resolvedClientId = currentProfile.role === 'client' ? currentProfile.id : clientId;
  const resolvedCoachId =
    currentProfile.role === 'coach'
      ? currentProfile.id
      : coachId ?? (await getPrimaryCoach())?.id;

  if (!resolvedClientId) {
    throw new AppServiceError('Choose a client before opening messages.');
  }

  if (!resolvedCoachId) {
    throw new AppServiceError('No coach is available yet.');
  }

  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    client_uuid: resolvedClientId,
    coach_uuid: resolvedCoachId,
  });

  throwIfSupabaseError(error, 'Unable to open conversation.');

  if (!data) {
    throw new AppServiceError('Unable to open conversation.');
  }

  const [conversation] = await hydrateConversations([data], currentProfile.id);
  return conversation;
}

export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, attachment:message_attachments(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error, 'Unable to load messages.');

  const rows = (data ?? []) as unknown as MessageWithAttachmentRow[];
  return Promise.all(rows.map(withSignedVideoUrl));
}

export async function sendTextMessage({
  conversation,
  body,
}: {
  conversation: ConversationSummary;
  body: string;
}) {
  const senderId = await getCurrentUserId();
  const trimmed = body.trim();

  if (!trimmed) {
    throw new AppServiceError('Enter a message before sending.');
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new AppServiceError(`Messages must be ${MAX_TEXT_LENGTH} characters or fewer.`);
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: senderId,
      receiver_id: getReceiverId(conversation, senderId),
      message_type: 'text',
      body: trimmed,
    })
    .select('*, attachment:message_attachments(*)')
    .single();

  throwIfSupabaseError(error, 'Unable to send message.');

  return withSignedVideoUrl(data as unknown as MessageWithAttachmentRow);
}

export async function sendVideoFeedbackMessage({
  asset,
  caption,
  conversation,
}: {
  asset: ImagePicker.ImagePickerAsset;
  caption?: string;
  conversation: ConversationSummary;
}) {
  const attachment = await uploadFeedbackVideo({ asset, conversation });

  try {
    const senderId = await getCurrentUserId();
    const trimmedCaption = caption?.trim() || null;
    const { data, error } = await supabase
      .from('messages')
      .insert({
        attachment_id: attachment.id,
        body: trimmedCaption,
        conversation_id: conversation.id,
        message_type: 'video_feedback',
        receiver_id: getReceiverId(conversation, senderId),
        sender_id: senderId,
      })
      .select('*, attachment:message_attachments(*)')
      .single();

    if (error) {
      await deleteUnsentAttachment(attachment);
      throw toServiceError(error, 'Unable to send video feedback.');
    }

    return withSignedVideoUrl(data as unknown as MessageWithAttachmentRow);
  } catch (error) {
    if (error instanceof AppServiceError) {
      throw error;
    }

    await deleteUnsentAttachment(attachment);
    throw toServiceError(error, 'Unable to send video feedback.');
  }
}

export async function markConversationRead(conversationId: string) {
  const { error } = await supabase.rpc('mark_conversation_read', {
    conversation_uuid: conversationId,
  });

  throwIfSupabaseError(error, 'Unable to update read state.');
}

export function subscribeToMessages({
  conversationId,
  onChange,
}: {
  conversationId: string;
  onChange: () => void;
}): RealtimeChannel {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      onChange
    )
    .subscribe();

  return channel;
}

export function subscribeToConversationUpdates(onChange: () => void): RealtimeChannel {
  return supabase
    .channel('conversation-list')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      onChange
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  void supabase.removeChannel(channel);
}

export async function getFeedbackVideoSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN_SECONDS);

  throwIfSupabaseError(error, 'Unable to load video.');

  return data?.signedUrl ?? null;
}

async function hydrateConversations(
  conversations: ConversationRow[],
  currentUserId: string
): Promise<ConversationSummary[]> {
  const profiles = await getVisibleProfilesById(
    conversations.flatMap((conversation) => [
      conversation.client_id,
      conversation.coach_id,
    ])
  );

  const unreadCounts = await Promise.all(
    conversations.map((conversation) =>
      getUnreadCount(conversation, currentUserId)
    )
  );

  return conversations.map((conversation, index) => {
    const client = profiles.get(conversation.client_id) ?? null;
    const coach = profiles.get(conversation.coach_id) ?? null;

    return {
      ...conversation,
      client,
      coach,
      otherProfile:
        currentUserId === conversation.client_id
          ? coach
          : client,
      unreadCount: unreadCounts[index] ?? 0,
    };
  });
}

async function getUnreadCount(
  conversation: ConversationRow,
  currentUserId: string
) {
  const lastReadAt =
    currentUserId === conversation.client_id
      ? conversation.client_last_read_at
      : conversation.coach_last_read_at;

  let query = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversation.id)
    .neq('sender_id', currentUserId);

  if (lastReadAt) {
    query = query.gt('created_at', lastReadAt);
  }

  const { count, error } = await query;

  throwIfSupabaseError(error, 'Unable to load unread messages.');

  return count ?? 0;
}

async function uploadFeedbackVideo({
  asset,
  conversation,
}: {
  asset: ImagePicker.ImagePickerAsset;
  conversation: ConversationSummary;
}): Promise<MessageAttachment> {
  if (!asset.uri) {
    throw new AppServiceError("That video couldn't be uploaded. Try again.");
  }

  const mimeType = getVideoMimeType(asset);
  if (!ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)) {
    throw new AppServiceError(
      "This video format isn't supported. Please choose an MP4, MOV, M4V, or WebM video."
    );
  }

  if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    throw new AppServiceError('Use a video smaller than 100 MB.');
  }

  if (__DEV__) {
    console.log('365 FITNESS video upload asset:', {
      detectedMimeType: mimeType,
      fileName: asset.fileName ?? null,
      fileSize: asset.fileSize ?? null,
      uri: asset.uri,
    });
  }

  const uploaderId = await getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);
  const extension = getVideoExtension(asset);
  const storagePath = `${conversation.client_id}/${conversation.id}/${uploaderId}/${today}/${createPathToken()}.${extension}`;
  const videoData = await readVideoAsset(asset);

  const { error: uploadError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(storagePath, videoData, {
      contentType: mimeType,
      upsert: false,
    });

  throwIfSupabaseError(uploadError, "That video couldn't be uploaded. Try again.");

  const { data, error: metadataError } = await supabase
    .from('message_attachments')
    .insert({
      attachment_type: 'video_feedback',
      client_id: conversation.client_id,
      conversation_id: conversation.id,
      file_size_bytes: asset.fileSize ?? null,
      mime_type: mimeType,
      original_filename: asset.fileName ?? null,
      storage_path: storagePath,
      uploader_id: uploaderId,
    })
    .select('*')
    .single();

  if (metadataError) {
    await supabase.storage.from(VIDEO_BUCKET).remove([storagePath]);
    throw toServiceError(metadataError, "That video couldn't be saved. Try again.");
  }

  return data as MessageAttachment;
}

async function deleteUnsentAttachment(attachment: MessageAttachment) {
  await supabase.from('message_attachments').delete().eq('id', attachment.id);
  await supabase.storage.from(VIDEO_BUCKET).remove([attachment.storage_path]);
}

async function withSignedVideoUrl(row: MessageWithAttachmentRow): Promise<Message> {
  const attachment = row.attachment as MessageAttachment | null | undefined;

  if (row.message_type !== 'video_feedback' || !attachment?.storage_path) {
    return { ...row, attachment: attachment ?? null, signedVideoUrl: null };
  }

  try {
    return {
      ...row,
      attachment,
      signedVideoUrl: await getFeedbackVideoSignedUrl(attachment.storage_path),
    };
  } catch (error) {
    console.error('Unable to sign message video URL:', error);
    return { ...row, attachment, signedVideoUrl: null };
  }
}

function getReceiverId(conversation: ConversationSummary, senderId: string) {
  if (senderId === conversation.client_id) return conversation.coach_id;
  if (senderId === conversation.coach_id) return conversation.client_id;

  throw new AppServiceError('You are not a participant in this conversation.');
}

async function readVideoAsset(asset: ImagePicker.ImagePickerAsset) {
  const response = await fetch(asset.uri);
  return response.arrayBuffer();
}

function getVideoExtension(asset: ImagePicker.ImagePickerAsset) {
  const source = `${asset.fileName ?? ''} ${asset.uri}`.toLowerCase();
  if (source.includes('.mov')) return 'mov';
  if (source.includes('.m4v')) return 'm4v';
  if (source.includes('.webm')) return 'webm';
  return 'mp4';
}

function getVideoMimeType(asset: ImagePicker.ImagePickerAsset) {
  const directMimeType = asset.mimeType?.toLowerCase();
  if (directMimeType && ACCEPTED_VIDEO_MIME_TYPES.includes(directMimeType)) {
    return directMimeType;
  }

  const extension = getVideoExtension(asset);
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'm4v') return 'video/x-m4v';
  if (extension === 'webm') return 'video/webm';
  if (extension === 'mp4') return 'video/mp4';

  return 'unsupported';
}

function createPathToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
