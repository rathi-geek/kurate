import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

export const mmkv = new MMKV({ id: 'kurate-app' });

export const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => {
    mmkv.set(key, value);
  },
  removeItem: (key: string) => {
    mmkv.delete(key);
  },
}));
