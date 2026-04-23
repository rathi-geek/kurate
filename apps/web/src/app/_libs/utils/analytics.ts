"use client";

let initialized = false;
let distinctId: string | null = null;
let pendingQueue: Array<{ event: string; props?: Record<string, unknown> }> = [];
let pendingIdentity: {
  userId: string;
  traits: { email?: string | null; name?: string | null; handle?: string | null };
} | null = null;

function sendToServer(
  type: "track" | "engage",
  payload: Record<string, unknown>,
) {
  try {
    fetch("/api/t", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
      keepalive: true,
    });
  } catch {
    /* fire-and-forget — swallow network errors */
  }
}

function flushPendingQueue() {
  for (const { event, props } of pendingQueue) {
    sendToServer("track", {
      event,
      properties: { ...props, distinct_id: distinctId, platform: "web" },
    });
  }
  pendingQueue = [];
}

export function initAnalytics() {
  if (initialized) return;
  initialized = true;

  if (pendingIdentity) {
    const { userId, traits } = pendingIdentity;
    pendingIdentity = null;
    distinctId = userId;
    sendToServer("engage", { distinctId: userId, traits });
    flushPendingQueue();
  }
}

export function identifyUser(
  userId: string,
  traits: { email?: string | null; name?: string | null; handle?: string | null },
) {
  if (!initialized) {
    pendingIdentity = { userId, traits };
    return;
  }
  distinctId = userId;
  sendToServer("engage", { distinctId: userId, traits });
  flushPendingQueue();
}

export function resetUser() {
  distinctId = null;
  pendingIdentity = null;
  pendingQueue = [];
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!distinctId) {
    pendingQueue.push({ event, props });
    return;
  }
  sendToServer("track", {
    event,
    properties: { ...props, distinct_id: distinctId, platform: "web" },
  });
}
