import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

interface ShareInput {
  loggedItemId: string;
  conversationIds: string[];
}

export function useShareToGroups() {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.userId) ?? '';

  return useMutation({
    mutationFn: async ({ loggedItemId, conversationIds }: ShareInput) => {
      await Promise.all(
        conversationIds.map(convo_id =>
          supabase.from('group_posts').insert({
            convo_id,
            logged_item_id: loggedItemId,
            shared_by: userId,
          }),
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });
}
