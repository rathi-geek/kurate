import { useMessages as useShared } from '@kurate/hooks';
import { supabase, supabaseUrl } from '@/libs/supabase/client';

export function useDMMessages(convoId: string | null) {
  return useShared(supabase, supabaseUrl, convoId);
}
