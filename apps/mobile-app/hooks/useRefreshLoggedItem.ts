import Constants from 'expo-constants';
import { useRefreshLoggedItem as useRefreshLoggedItemShared } from '@kurate/hooks';
import type { RefreshableItem } from '@kurate/hooks';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export function useRefreshLoggedItem(item: RefreshableItem | null | undefined) {
  const accessToken = useAuthStore(s => s.accessToken);
  return useRefreshLoggedItemShared(item, supabase, apiBaseUrl, accessToken);
}
