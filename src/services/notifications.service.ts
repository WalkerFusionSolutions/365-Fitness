import { RealtimeChannel } from '@supabase/supabase-js';
import { throwIfSupabaseError } from '@/services/errors';
import { supabase } from '@/services/supabase';
import { Notification } from '@/types';

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  throwIfSupabaseError(error, 'Unable to load notifications.');

  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  throwIfSupabaseError(error, 'Unable to load notification count.');

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  throwIfSupabaseError(error, 'Unable to update notification.');
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('is_read', false);

  throwIfSupabaseError(error, 'Unable to update notifications.');
}

export function subscribeToNotifications({
  onInsert,
  userId,
}: {
  onInsert: () => void;
  userId: string;
}): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      onInsert
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  void supabase.removeChannel(channel);
}
