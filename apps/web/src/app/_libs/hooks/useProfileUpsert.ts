"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@kurate/utils";
import { createClient } from "@/app/_libs/supabase/client";
import { saveUserInterests } from "@/app/_libs/hooks/useUserInterests";
import { track } from "@/app/_libs/utils/analytics";
import type { HandleStatus } from "@/app/_libs/hooks/useUsernameAvailability";

interface UseProfileUpsertOptions {
  onHandleStatusChange: (status: HandleStatus) => void;
}

export function useProfileUpsert({ onHandleStatusChange }: UseProfileUpsertOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  async function submit({
    name,
    username,
    interests,
    nextUrl,
  }: {
    name: string;
    username: string;
    interests: string[];
    nextUrl: string | null;
  }) {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      router.replace(ROUTES.AUTH.LOGIN);
      return;
    }

    const spaceIdx = name.indexOf(" ");
    const first_name = spaceIdx === -1 ? name : name.slice(0, spaceIdx);
    const last_name = spaceIdx === -1 ? null : name.slice(spaceIdx + 1) || null;

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name,
      last_name,
      handle: username,
      is_onboarded: true,
    });

    if (upsertError) {
      if (upsertError.code === "23505") {
        setUsernameError("This username is already taken");
        onHandleStatusChange("taken");
      } else {
        setUsernameError(upsertError.message);
      }
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({ data: { is_onboarded: true } });
    try {
      await saveUserInterests(user.id, interests);
    } catch (err) {
      console.error("[onboarding] saveUserInterests failed:", err);
      toast.error("Could not save your interests. You can update them later in settings.");
    }
    track("onboarding_completed", { interests_selected: interests.length });

    router.replace(nextUrl ?? ROUTES.APP.HOME);
  }

  return { submit, loading, usernameError, setUsernameError };
}
