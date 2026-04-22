"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/app/_libs/auth-context";
import { identifyUser, initAnalytics, resetUser, track } from "@/app/_libs/utils/analytics";

function AnalyticsInner() {
  const { user, profile } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name:
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          null,
        handle: profile?.handle,
      });

      // Track login only on transition from no-user to user
      if (!prevUserIdRef.current) {
        track("user_logged_in", {
          method: "google",
          user_id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.full_name ?? null,
        });
      }
      prevUserIdRef.current = user.id;
    } else {
      if (prevUserIdRef.current) {
        resetUser();
      }
      prevUserIdRef.current = null;
    }
  }, [user, profile]);

  return null;
}

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsInner />
      {children}
    </>
  );
}
