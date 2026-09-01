import { Profile } from '@/types';
import { supabase } from '@/services/supabase';
import { throwIfSupabaseError } from '@/services/errors';

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load your profile.');

  return data;
}
