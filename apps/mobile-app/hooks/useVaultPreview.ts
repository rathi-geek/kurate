import { useVaultPreview as useVaultPreviewShared } from '@kurate/hooks';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store';

const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export function useVaultPreview(resetInput: () => void) {
  const accessToken = useAuthStore(state => state.accessToken);

  return useVaultPreviewShared({
    apiBaseUrl,
    accessToken,
    resetInput,
  });
}
