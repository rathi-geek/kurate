"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;
let pendingQueue: Array<{ event: string; props?: Record<string, unknown> }> = [];

function getToken(): string | undefined {
  return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
}

export function initAnalytics() {
  const token = getToken();
  if (!token || initialized) return;
  mixpanel.init(token, { track_pageview: true, persistence: "localStorage" });
  initialized = true;

  // Flush events that arrived before init
  for (const { event, props } of pendingQueue) {
    mixpanel.track(event, props);
  }
  pendingQueue = [];
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
  if (!initialized) {
    pendingQueue.push({ event, props });
    return;
  }
  mixpanel.track(event, props);
}
