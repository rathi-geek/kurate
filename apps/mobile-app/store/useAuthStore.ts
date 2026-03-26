import { AuthState, StorageKeys } from '@/types';
import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isLoggedIn: false,
      login: () => set({ isLoggedIn: true }),
      logout: () =>
        set({
          isLoggedIn: false,
          accessToken: '',
          isOnboardingCompleted: false,
        }),

      isOnboardingCompleted: false,
      completeOnboarding: () => set({ isOnboardingCompleted: true }),

      accessToken: '',
      setAccessToken: (accessToken: string) => set({ accessToken }),
    }),
    {
      name: StorageKeys.AUTH_STORE,
      storage: createJSONStorage(() => ({
        getItem,
        setItem,
        removeItem: deleteItemAsync,
      })),
    },
  ),
);
