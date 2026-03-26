import { StorageKeys } from '@/types';
import * as SecureStore from 'expo-secure-store';

export const storageUtils = {
  setItem: async (
    key: StorageKeys,
    value: string | number | boolean,
  ): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, String(value));
    } catch (_) {}
  },

  getItem: async (
    key: StorageKeys,
  ): Promise<string | number | boolean | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (_) {
      return null;
    }
  },

  removeItem: async (key: StorageKeys): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (_) {}
  },
  /**
   * Clears all items whose keys are defined in the StorageKeys enum
   */
  clearAllItems: async (): Promise<void> => {
    try {
      const allKeys = Object.values(StorageKeys) as string[];

      // Delete all items in parallel, ignoring errors for keys that don't exist
      await Promise.all(
        allKeys.map(key => SecureStore.deleteItemAsync(key).catch(() => {})),
      );

      console.log(`✅ Cleared ${allKeys.length} item(s) from SecureStore`);
    } catch (_) {}
  },
};
