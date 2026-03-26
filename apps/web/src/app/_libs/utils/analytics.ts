"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;

function getToken(): string | undefined {
  return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
}

export function initAnalytics() {
  const token = getToken();
  if (!token || initialized) return;
  mixpanel.init(token, { track_pageview: true, persistence: "localStorage" });
  initialized = true;
}

export function identifyUser(
  userId: string,
  traits: { email?: string | null; name?: string | null; handle?: string | null },
) {
  if (!initialized) return;
  mixpanel.identify(userId);
  mixpanel.people.set({
    $email: traits.email,
    $name: traits.name,
    handle: traits.handle,
  });
}

export function resetUser() {
  if (!initialized) return;
  mixpanel.reset();
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  mixpanel.track(event, props);
}
