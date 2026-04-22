"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;
let pendingQueue: Array<{ event: string; props?: Record<string, unknown> }> = [];
let pendingIdentity: {
  userId: string;
  traits: { email?: string | null; name?: string | null; handle?: string | null };
} | null = null;

function getToken(): string | undefined {
  return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
}

function flushPendingQueue() {
  for (const { event, props } of pendingQueue) {
    try {
      mixpanel.track(event, props);
    } catch {
      /* blocked or failed — swallow */
    }
  }
  pendingQueue = [];
}

function applyIdentity(
  userId: string,
  traits: { email?: string | null; name?: string | null; handle?: string | null },
) {
  try {
    mixpanel.identify(userId);
    mixpanel.people.set({
      $email: traits.email,
      $name: traits.name,
      handle: traits.handle,
    });
  } catch {
    /* blocked — swallow */
  }
}

export function initAnalytics() {
  const token = getToken();
  if (!token || initialized) return;
  try {
    mixpanel.init(token, {
      track_pageview: true,
      persistence: "localStorage",
      api_host: "/mp",
    });
    initialized = true;
  } catch {
    // Mixpanel SDK blocked (ad blocker) — leave initialized false,
    // track() will keep queuing silently without crashing.
    return;
  }

  // If identifyUser() was called before init, apply identity now then flush
  if (pendingIdentity) {
    applyIdentity(pendingIdentity.userId, pendingIdentity.traits);
    pendingIdentity = null;
    flushPendingQueue();
  } else {
    // No pending identity — flush as anonymous (public page analytics)
    flushPendingQueue();
  }
}

export function identifyUser(
  userId: string,
  traits: { email?: string | null; name?: string | null; handle?: string | null },
) {
  if (!initialized) {
    // Store identity for when init completes
    pendingIdentity = { userId, traits };
    return;
  }
  applyIdentity(userId, traits);
  // Flush any events that queued between init and identify
  flushPendingQueue();
}

export function resetUser() {
  pendingIdentity = null;
  if (!initialized) return;
  try {
    mixpanel.reset();
  } catch {
    /* blocked — swallow */
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) {
    pendingQueue.push({ event, props });
    return;
  }
  try {
    mixpanel.track(event, props);
  } catch {
    /* blocked — swallow */
  }
}
