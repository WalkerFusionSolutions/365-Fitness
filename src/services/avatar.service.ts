import * as ImagePicker from 'expo-image-picker';
import { AppServiceError, throwIfSupabaseError, toServiceError } from '@/services/errors';
import { supabase } from '@/services/supabase';
import { Profile } from '@/types';

const AVATAR_BUCKET = 'profile-avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_SECONDS = 60 * 60;
const SIGNED_URL_CACHE_MS = 50 * 60 * 1000;

const MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type SupportedAvatarMime = keyof typeof MIME_TO_EXTENSION;

const EXTENSION_TO_MIME = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

const signedUrlCache = new Map<string, { expiresAt: number; url: string }>();

export async function resolveProfileAvatarUrl(value?: string | null) {
  if (!value) return null;
  if (/^(https?:|data:|file:|blob:)/i.test(value)) return value;

  const cached = signedUrlCache.get(value);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(value, SIGNED_URL_SECONDS);

  throwIfSupabaseError(error, 'Unable to load profile photo.');
  if (!data?.signedUrl) return null;

  signedUrlCache.set(value, {
    expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
    url: data.signedUrl,
  });
  return data.signedUrl;
}

export async function uploadOwnProfileAvatar({
  asset,
  currentAvatarPath,
  userId,
}: {
  asset: ImagePicker.ImagePickerAsset;
  currentAvatarPath?: string | null;
  userId: string;
}): Promise<Profile> {
  if (!asset.uri || (asset.type && asset.type !== 'image')) {
    throw new AppServiceError('Choose a JPEG, PNG, or WebP image.');
  }
  if (asset.fileSize != null && asset.fileSize > MAX_AVATAR_BYTES) {
    throw new AppServiceError('Profile photos must be 5 MB or smaller.');
  }

  const { contentType, extension } = getAvatarFileType(asset);
  const imageData = await fetch(asset.uri).then((response) => response.blob());

  if (imageData.size > MAX_AVATAR_BYTES) {
    throw new AppServiceError('Profile photos must be 5 MB or smaller.');
  }
  if (imageData.type && !MIME_TO_EXTENSION[imageData.type as keyof typeof MIME_TO_EXTENSION]) {
    throw new AppServiceError('Choose a JPEG, PNG, or WebP image.');
  }
  await assertImageSignature(imageData, contentType);

  const storagePath = `${userId}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, imageData, { contentType, upsert: true });

  throwIfSupabaseError(uploadError, "That profile photo couldn't be uploaded.");

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: storagePath })
    .eq('id', userId)
    .select('*')
    .single();

  if (profileError) {
    throw toServiceError(profileError, "That profile photo couldn't be saved.");
  }

  signedUrlCache.delete(storagePath);
  if (isPrivateAvatarPath(currentAvatarPath) && currentAvatarPath !== storagePath) {
    const { error: cleanupError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([currentAvatarPath]);
    if (cleanupError) console.warn('Unable to remove replaced profile avatar.');
    signedUrlCache.delete(currentAvatarPath);
  }

  return profile as Profile;
}

export async function removeOwnProfileAvatar(userId: string, currentAvatarPath?: string | null) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)
    .select('*')
    .single();

  throwIfSupabaseError(error, "That profile photo couldn't be removed.");

  if (isPrivateAvatarPath(currentAvatarPath)) {
    const { error: storageError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([currentAvatarPath]);
    if (storageError) console.warn('Unable to remove profile avatar object.');
    signedUrlCache.delete(currentAvatarPath);
  }

  return profile as Profile;
}

function getAvatarFileType(
  asset: ImagePicker.ImagePickerAsset
): { contentType: SupportedAvatarMime; extension: (typeof MIME_TO_EXTENSION)[SupportedAvatarMime] } {
  const mimeType = asset.mimeType?.toLowerCase();
  const uriExtension = getSupportedExtension(asset.uri);
  const extension = uriExtension ?? getSupportedExtension(asset.fileName ?? '');
  const extensionMime = extension
    ? EXTENSION_TO_MIME[extension as keyof typeof EXTENSION_TO_MIME]
    : undefined;

  if (mimeType) {
    const canonicalExtension = MIME_TO_EXTENSION[mimeType as keyof typeof MIME_TO_EXTENSION];
    const uriMime = uriExtension
      ? EXTENSION_TO_MIME[uriExtension as keyof typeof EXTENSION_TO_MIME]
      : undefined;
    if (!canonicalExtension || (uriMime && uriMime !== mimeType)) {
      throw new AppServiceError('Choose a JPEG, PNG, or WebP image.');
    }
    return { contentType: mimeType as SupportedAvatarMime, extension: canonicalExtension };
  }

  if (!extensionMime) throw new AppServiceError('Choose a JPEG, PNG, or WebP image.');
  return { contentType: extensionMime, extension: MIME_TO_EXTENSION[extensionMime] };
}

function getSupportedExtension(value: string) {
  const extension = value.split('?')[0].split('.').pop()?.toLowerCase();
  return extension && extension in EXTENSION_TO_MIME ? extension : undefined;
}

async function assertImageSignature(image: Blob, contentType: SupportedAvatarMime) {
  const bytes = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  const isExpectedType =
    (contentType === 'image/jpeg' && isJpeg) ||
    (contentType === 'image/png' && isPng) ||
    (contentType === 'image/webp' && isWebp);

  if (!isExpectedType) {
    throw new AppServiceError('Choose a valid JPEG, PNG, or WebP image.');
  }
}

function isPrivateAvatarPath(value?: string | null): value is string {
  return Boolean(value && !/^(https?:|data:|file:|blob:)/i.test(value));
}
