import {
  useGroupComposer as useGroupComposerShared,
  type UseGroupComposerConfig,
} from '@kurate/hooks';
import Toast from 'react-native-toast-message';
import { mobilePendingDb } from '@/libs/pending-db';
import { upsertLoggedItem } from '@/libs/upsertLoggedItem';

type MobileConfig = Omit<
  UseGroupComposerConfig,
  'platform' | 'upsertLoggedItem'
>;

export function useGroupComposer(params: MobileConfig) {
  return useGroupComposerShared({
    ...params,
    upsertLoggedItem,
    platform: {
      pendingDb: mobilePendingDb,
      onToast: (msg, opts) => {
        Toast.show({ type: 'info', text1: msg, text2: opts?.description });
      },
    },
  });
}
