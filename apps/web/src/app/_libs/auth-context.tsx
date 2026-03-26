"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

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
    // Seed React Query cache so components using useQuery(queryKeys.user.profile) get it for free
    queryClient.setQueryData(queryKeys.user.profile(userId), profileData);
  }

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        loadProfile(authUser.id);
        if (event === "SIGNED_IN") {
          track("user_logged_in", { method: "google" });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
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
