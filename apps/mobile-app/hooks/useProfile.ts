import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { queryKeys } from '@kurate/query';

import { supabase } from '@/libs/supabase/client';

const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? '';

export interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  handle: string | null;
  about: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
}

type AvatarJoin = { file_path: string; bucket_name: string } | null;

function resolveAvatarUrl(avatar: AvatarJoin): string | null {
  if (!avatar?.file_path) return null;
  return `${supabaseUrl}/storage/v1/object/public/${avatar.bucket_name}/${avatar.file_path}`;
}

function resolveAvatarPath(avatar: AvatarJoin): string | null {
  if (!avatar?.file_path) return null;
  return `${avatar.bucket_name}/${avatar.file_path}`;
}

async function fetchProfile(userId: string): Promise<ProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, first_name, last_name, handle, about, is_onboarded, avatar:avatar_id(file_path, bucket_name)',
    )
    .eq('id', userId)
    .single();

  if (error) throw error;

  const avatar = data.avatar as AvatarJoin;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    handle: data.handle,
    about: data.about,
    avatarUrl: resolveAvatarUrl(avatar),
    avatarPath: resolveAvatarPath(avatar),
  };
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
