import {
  useVaultComposer as useVaultComposerShared,
  type UseVaultComposerConfig,
} from '@kurate/hooks';
import { mobilePendingDb } from '@/libs/pending-db';

type SharedConfig = Omit<UseVaultComposerConfig, 'platform'>;

export function useVaultComposer(params: SharedConfig) {
  return useVaultComposerShared({
    ...params,
    platform: {
      pendingDb: mobilePendingDb,
    },
  });
}
