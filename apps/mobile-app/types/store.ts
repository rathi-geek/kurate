import type { Session } from '@supabase/supabase-js';

export interface AuthState {
  isLoggedIn: boolean;
  isOnboardingCompleted: boolean;
  userId: string | null;
  setSession: (session: Session | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  reset: () => void;
}

export interface PersistStateStore {
  appLanguage: string | null;
  setAppLanguage: (appLanguage: string) => void;
  clearPersistStore: () => Promise<void>;
}
