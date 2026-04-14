import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';

import { supabase } from '@/libs/supabase/client';

async function fetchUserInterests(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_interests')
    .select('interest:interest_id(name)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? [])
    .map(row => (row.interest as { name: string } | null)?.name)
    .filter((name): name is string => !!name);
}

export function useUserInterestsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.interests(userId ?? ''),
    queryFn: () => fetchUserInterests(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
