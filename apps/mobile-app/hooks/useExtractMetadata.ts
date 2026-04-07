import { useExtractMetadata as useExtractShared } from '@kurate/hooks';
import Constants from 'expo-constants';

const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export function useExtractMetadata() {
  return useExtractShared(apiBaseUrl);
}
