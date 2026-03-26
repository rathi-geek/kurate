import { PersistStateStore, StorageKeys } from '@/types';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const usePersistStore = create<PersistStateStore>()(
  persist(
    set => ({
      appLanguage: null,
      setAppLanguage: (appLanguage: string) => set({ appLanguage }),
      clearPersistStore: async () => {
        set({ appLanguage: null });
      },
    }),
    {
      name: StorageKeys.PERSIST_STORE,
      storage: createJSONStorage(() => ({
        getItem: getItemAsync,
        setItem: setItemAsync,
        removeItem: deleteItemAsync,
      })),
    },
  ),
);
