import type { Session } from '@supabase/supabase-js';
import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthState } from '@/types';
import { StorageKeys } from '@/types';

function deriveFromSession(session: Session | null) {
  return {
    isLoggedIn: !!session,
    userId: session?.user?.id ?? null,
    isOnboardingCompleted: session?.user?.user_metadata?.is_onboarded === true,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isLoggedIn: false,
      isOnboardingCompleted: false,
      userId: null,

      setSession: (session: Session | null) => {
        set(deriveFromSession(session));
      },

      setOnboardingCompleted: (completed: boolean) => {
        set({ isOnboardingCompleted: completed });
      },

      reset: () => {
        set({
          isLoggedIn: false,
          isOnboardingCompleted: false,
          userId: null,
        });
      },
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
