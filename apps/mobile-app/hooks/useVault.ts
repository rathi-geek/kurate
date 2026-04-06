import { useVault as useVaultShared } from '@kurate/hooks';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import type { VaultFilters } from '@kurate/types';

export function useMobileVault(filters: VaultFilters) {
  const userId = useAuthStore(state => state.userId) ?? '';
  return useVaultShared(filters, userId, supabase);
}
