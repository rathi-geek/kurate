import { useDMConversations as useShared } from '@kurate/hooks';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

export function useDMConversations() {
  const userId = useAuthStore(state => state.userId);
  return useShared(supabase, supabaseUrl, userId);
}
