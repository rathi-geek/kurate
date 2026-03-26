"use client";

import { useEffect } from "react";

import { useAuth } from "@/app/_libs/auth-context";
import { identifyUser, initAnalytics, resetUser } from "@/app/_libs/utils/analytics";

function AnalyticsInner() {
  const { user, profile } = useAuth();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null,
        handle: profile?.handle,
      });
    } else {
      resetUser();
    }
  }, [user, profile]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsInner />
      {children}
    </>
  );
}
