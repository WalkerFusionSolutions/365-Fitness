import { Profile } from '@/types';
import { supabase } from '@/services/supabase';
import { AppServiceError, throwIfSupabaseError } from '@/services/errors';

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Unable to load your profile.');

  return data;
}

export async function updateOwnProfileDetails({
  fullName,
  phoneNumber,
  userId,
}: {
  fullName: string;
  phoneNumber: string;
  userId: string;
}): Promise<Profile> {
  const normalizedName = fullName.trim();
  if (!normalizedName) throw new AppServiceError('Enter your full name.');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: normalizedName,
      phone_number: phoneNumber.trim() || null,
    })
    .eq('id', userId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Unable to update your profile.');
  return data as Profile;
}
