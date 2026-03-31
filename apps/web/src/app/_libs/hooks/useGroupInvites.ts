"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";

const supabase = createClient();

export interface GroupInvite {
  id: string;
  group_id: string;
  invited_email: string;
  invited_by: string;
  created_at: string;
}

async function fetchGroupInvites(groupId: string): Promise<GroupInvite[]> {
  const { data, error } = await supabase
    .from("group_invites")
    .select("id, group_id, invited_email, invited_by, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useGroupInvites(groupId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.groups.invites(groupId),
    queryFn: () => fetchGroupInvites(groupId),
    staleTime: 1000 * 30,
    enabled: !!groupId,
  });

  const removeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from("group_invites").delete().eq("id", inviteId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.invites(groupId) });
    },
  });

  return {
    invites: query.data ?? [],
    isLoading: query.isLoading,
    removeInvite: removeInvite.mutate,
  };
}
