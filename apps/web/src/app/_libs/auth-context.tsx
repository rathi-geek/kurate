"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/app/_libs/supabase/client";
import type { Tables } from "@kurate/types";
import { getMediaPublicUrl } from "@/app/_libs/utils/getMediaUrl";
import { track } from "@/app/_libs/utils/analytics";

export type UserProfile = Pick<
  Tables<"profiles">,
  "first_name" | "last_name" | "handle" | "about" | "is_onboarded"
> & { avatar_url: string | null };

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── localStorage cache helpers ──────────────────────────────────────────────

const PROFILE_KEY = (id: string) => `kurate:profile:${id}`;

function readCachedProfile(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY(userId));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(userId: string, profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY(userId), JSON.stringify(profile));
  } catch {}
}

function clearCachedProfile(userId: string) {
  try {
    localStorage.removeItem(PROFILE_KEY(userId));
  } catch {}
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  async function loadProfile(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, handle, about, is_onboarded, avatar:avatar_id(file_path, bucket_name)")
      .eq("id", userId)
      .single();

    const profileData = data
      ? {
          first_name: data.first_name,
          last_name: data.last_name,
          handle: data.handle,
          about: data.about,
          is_onboarded: data.is_onboarded,
          avatar_url: (data.avatar as { file_path: string; bucket_name: string } | null)?.file_path
            ? getMediaPublicUrl(
                (data.avatar as { file_path: string; bucket_name: string }).bucket_name,
                (data.avatar as { file_path: string; bucket_name: string }).file_path,
              )
            : null,
        }
      : null;

    setProfile(profileData);
    setLoading(false);

    if (profileData) {
      writeCachedProfile(userId, profileData);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    let profileLoaded = false;

    // Page load: read session from cookie (no network call), serve cached profile
    // instantly, then sync once from backend to catch changes from other devices.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        const cached = readCachedProfile(authUser.id);
        if (cached) setProfile(cached);
        void loadProfile(authUser.id).then(() => { profileLoaded = true; });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("[auth] getSession failed:", err);
      setLoading(false);
    });

    // Profile is loaded once above. onAuthStateChange only handles:
    // - SIGNED_IN when profile hasn't loaded yet (fresh login after redirect)
    // - SIGNED_OUT to clear state
    // Supabase fires SIGNED_IN / TOKEN_REFRESHED on every tab focus — the
    // profileLoaded flag ensures we never re-fetch profile from those events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (event === "SIGNED_IN" && authUser && !profileLoaded) {
        const cached = readCachedProfile(authUser.id);
        if (cached) setProfile(cached);
        void loadProfile(authUser.id).then(() => { profileLoaded = true; });
        track("user_logged_in", {
          method: "google",
          user_id: authUser.id,
          email: authUser.email ?? null,
          name: authUser.user_metadata?.full_name ?? null,
        });
      } else if (event === "SIGNED_OUT") {
        profileLoaded = false;
        if (user?.id) clearCachedProfile(user.id);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshUser() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    if (data.user) {
      await loadProfile(data.user.id);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
