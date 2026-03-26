export interface PersistStateStore {
  appLanguage: string | null;
  setAppLanguage: (appLanguage: string) => void;
  clearPersistStore: () => Promise<void>;
}

export interface AuthState {
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
  accessToken: string;
  setAccessToken: (accessToken: string) => void;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}
