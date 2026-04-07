import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import Constants from 'expo-constants';

export interface ShareableConversation {
  id: string;
  name: string;
  type: 'group' | 'dm';
  avatar_url: string | null;
  updated_at: string;
}

const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? '';

function storageUrl(
  media: { file_path: string; bucket_name: string } | null,
): string | null {
  if (!media) return null;
  return `${supabaseUrl}/storage/v1/object/public/${media.bucket_name}/${media.file_path}`;
}

type ConvoRow = {
  id: string;
  group_name: string | null;
  is_group: boolean;
  updated_at: string;
  group_avatar?: { file_path: string; bucket_name: string } | null;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  avatar?: { file_path: string; bucket_name: string } | null;
};

async function fetchShareable(
  userId: string,
): Promise<ShareableConversation[]> {
  if (!userId) return [];

  const { data: memberships, error } = await supabase
    .from('conversation_members')
    .select(
      'conversations!conversation_members_convo_id_fkey(id, group_name, is_group, updated_at, group_avatar:group_avatar_id(file_path, bucket_name))',
    )
    .eq('user_id', userId);

  if (error || !memberships) return [];

  const groupConvos: ConvoRow[] = [];
  const dmConvoIds: string[] = [];
  const dmUpdatedAt: Record<string, string> = {};

  for (const row of memberships) {
    const convo = (Array.isArray(row.conversations)
      ? row.conversations[0]
      : row.conversations) as unknown as ConvoRow | null;
    if (!convo) continue;
    if (convo.is_group) {
      groupConvos.push(convo);
    } else {
      dmConvoIds.push(convo.id);
      dmUpdatedAt[convo.id] = convo.updated_at;
    }
  }

  const groupItems: ShareableConversation[] = groupConvos.map(g => ({
    id: g.id,
    name: g.group_name ?? '',
    type: 'group',
    avatar_url: storageUrl(g.group_avatar ?? null),
    updated_at: g.updated_at,
  }));

  let dmItems: ShareableConversation[] = [];
  if (dmConvoIds.length > 0) {
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select(
        'convo_id, profile:profiles!conversation_members_user_id_fkey(first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)',
      )
      .in('convo_id', dmConvoIds)
      .neq('user_id', userId);

    dmItems = (otherMembers ?? []).map(m => {
      const profile = (Array.isArray(m.profile)
        ? m.profile[0]
        : m.profile) as unknown as ProfileRow | null;
      const displayName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
          profile.handle ||
          'DM'
        : 'DM';
      return {
        id: m.convo_id,
        name: displayName,
        type: 'dm' as const,
        avatar_url: storageUrl(profile?.avatar ?? null),
        updated_at: dmUpdatedAt[m.convo_id] ?? '',
      };
    });
  }

  return [...groupItems, ...dmItems].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export function useShareableConversations(enabled = true) {
  const userId = useAuthStore(state => state.userId) ?? '';

  return useQuery<ShareableConversation[]>({
    queryKey: queryKeys.vault.shareConversations(),
    queryFn: () => fetchShareable(userId),
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
  });
}
