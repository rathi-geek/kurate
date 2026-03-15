"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { Tables } from "@/app/_libs/types/database.types";

export type UserProfile = Pick<
  Tables<"profiles">,
  "first_name" | "last_name" | "handle" | "about" | "interests" | "avtar_url" | "is_onboarded"
>;

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
      .select("first_name, last_name, handle, about, interests, avtar_url, is_onboarded")
      .eq("id", userId)
      .single();
    const profileData = data ?? null;
    setProfile(profileData);
    // Seed React Query cache so components using useQuery(queryKeys.user.profile) get it for free
    queryClient.setQueryData(queryKeys.user.profile(userId), profileData);
  }

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        loadProfile(authUser.id);
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
