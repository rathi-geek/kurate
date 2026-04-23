import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.9.6/index.ts";

// ── Types ──────────────────────────────────────────────────

interface NotificationPayload {
  type: "notification";
  notification_id: string;
  recipient_id: string;
}

interface DmMessagePayload {
  type: "dm_message";
  recipient_id: string;
  convo_id: string;
  sender_name: string;
  message_text: string;
  sender_id: string;
}

interface NewPostPayload {
  type: "new_post";
  recipient_id: string;
  convo_id: string;
  poster_name: string;
  group_name: string;
}

type PushPayload = NotificationPayload | DmMessagePayload | NewPostPayload;

interface FcmMessage {
  token: string;
  notification: { title: string; body: string };
  data: Record<string, string>;
  android: {
    priority: string;
    collapse_key?: string;
    notification: { channel_id: string; tag?: string };
  };
  apns: {
    headers?: Record<string, string>;
    payload: { aps: { sound: string; badge: number; "thread-id"?: string } };
  };
}

// ── Google OAuth2 Access Token ─────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(
  serviceAccount: { client_email: string; private_key: string; project_id: string },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");

  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google OAuth2 token exchange failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) - 300,
  };
  return cachedToken.token;
}

// ── Build notification content ─────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  like: "liked your post",
  must_read: "recommended your post",
  comment: "commented on your post",
  new_post: "shared a new post",
  must_read_broadcast: "recommended a post",
  also_must_read: "also recommended this post",
  also_commented: "also commented on this post",
  co_engaged: "also engaged with a post",
  group_invite: "added you to a group",
  mention: "mentioned you in a comment",
};

async function buildNotificationContent(
  supabase: ReturnType<typeof createClient>,
  payload: NotificationPayload,
): Promise<{ title: string; body: string; data: Record<string, string> } | null> {
  const { data: notif } = await supabase
    .from("notifications")
    .select("id, actor_id, event_type, event_id, message")
    .eq("id", payload.notification_id)
    .single();

  if (!notif) return null;

  let actorName = "Someone";
  if (notif.actor_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, handle")
      .eq("id", notif.actor_id)
      .single();

    if (profile) {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      actorName = fullName || profile.handle || "Someone";
    }
  }

  const label = EVENT_TYPE_LABELS[notif.event_type] ?? notif.message ?? notif.event_type;
  const body = `${actorName} ${label}`;

  // Resolve convo_id for deep linking
  let convoId = "";
  if (notif.event_type === "group_invite") {
    convoId = notif.event_id ?? "";
  } else if (notif.event_id) {
    const { data: post } = await supabase
      .from("group_posts")
      .select("convo_id")
      .eq("id", notif.event_id)
      .single();
    convoId = post?.convo_id ?? "";
  }

  return {
    title: "Kurate",
    body,
    data: {
      type: notif.event_type,
      notification_id: notif.id,
      event_id: notif.event_id ?? "",
      convo_id: convoId,
    },
  };
}

function buildDmContent(payload: DmMessagePayload): {
  title: string;
  body: string;
  data: Record<string, string>;
} {
  return {
    title: payload.sender_name,
    body: payload.message_text,
    data: {
      type: "dm_message",
      convo_id: payload.convo_id,
      sender_id: payload.sender_id,
    },
  };
}

function buildNewPostContent(payload: NewPostPayload): {
  title: string;
  body: string;
  data: Record<string, string>;
} {
  return {
    title: payload.group_name,
    body: `${payload.poster_name} shared a post`,
    data: {
      type: "new_post",
      convo_id: payload.convo_id,
    },
  };
}

// ── Send to FCM ────────────────────────────────────────────

async function sendToFcm(
  projectId: string,
  accessToken: string,
  message: FcmMessage,
): Promise<{ success: boolean; unregistered: boolean }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );

  if (res.ok) return { success: true, unregistered: false };

  const error = await res.json().catch(() => ({}));
  const errorCode = error?.error?.details?.[0]?.errorCode ?? error?.error?.status ?? "";

  if (errorCode === "UNREGISTERED" || res.status === 404) {
    return { success: false, unregistered: true };
  }

  console.error("[send-push] FCM error:", JSON.stringify(error));
  return { success: false, unregistered: false };
}

// ── Main handler ───────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!authHeader.includes(serviceRoleKey)) {
      return new Response("Unauthorized", { status: 401 });
    }

    let payload: PushPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    if (!payload.type || !payload.recipient_id) {
      return new Response("Invalid payload", { status: 400 });
    }

    // Init Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check push_enabled preference
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", payload.recipient_id)
      .single();

    if (prefs?.push_enabled === false) {
      return new Response(JSON.stringify({ skipped: "push_disabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check per-conversation mute (DMs + new_post)
    const convoId = "convo_id" in payload ? payload.convo_id : null;
    if (convoId) {
      const { data: membership } = await supabase
        .from("conversation_members")
        .select("muted_until")
        .eq("convo_id", convoId)
        .eq("user_id", payload.recipient_id)
        .single();

      if (membership?.muted_until) {
        const mutedUntil = new Date(membership.muted_until);
        if (mutedUntil > new Date()) {
          return new Response(JSON.stringify({ skipped: "conversation_muted" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get recipient's FCM tokens
    const { data: devices } = await supabase
      .from("user_devices")
      .select("id, fcm_token, device_type")
      .eq("user_id", payload.recipient_id);

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_devices" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build notification content
    let content: { title: string; body: string; data: Record<string, string> } | null = null;

    if (payload.type === "notification") {
      content = await buildNotificationContent(supabase, payload);
    } else if (payload.type === "dm_message") {
      content = buildDmContent(payload);
    } else if (payload.type === "new_post") {
      content = buildNewPostContent(payload);
    }

    if (!content) {
      return new Response(JSON.stringify({ skipped: "no_content" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get FCM access token
    const fcmServiceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!fcmServiceAccountRaw) {
      console.error("[send-push] FCM_SERVICE_ACCOUNT secret not set");
      return new Response("FCM not configured", { status: 500 });
    }

    let serviceAccount: { client_email: string; private_key: string; project_id: string };
    try {
      serviceAccount = JSON.parse(fcmServiceAccountRaw);
    } catch {
      console.error("[send-push] FCM_SERVICE_ACCOUNT is not valid JSON");
      return new Response("FCM config invalid", { status: 500 });
    }
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // Determine notification channel + collapse keys
    const channelId = payload.type === "dm_message" ? "messages" : "default";

    // Collapse key: same key = replace previous notification in tray
    // Thread ID (iOS): groups notifications in notification center
    let collapseKey: string | undefined;
    let threadId: string | undefined;

    if (payload.type === "dm_message") {
      // All DMs from same conversation collapse into one notification
      collapseKey = `dm_${payload.convo_id}`;
      threadId = `dm_${payload.convo_id}`;
    } else if (payload.type === "new_post") {
      // All new posts in same group collapse
      collapseKey = `newpost_${payload.convo_id}`;
      threadId = `group_${payload.convo_id}`;
    } else if (payload.type === "notification") {
      // Engagement: collapse per (type, post) so 5 likes on same post = 1 notification
      const eventType = content.data.type ?? "notif";
      const eventId = content.data.event_id ?? payload.notification_id;
      collapseKey = `${eventType}_${eventId}`;
      threadId = content.data.convo_id ? `group_${content.data.convo_id}` : undefined;
    }

    // Badge: count unread notifications
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", payload.recipient_id)
      .eq("is_read", false);

    const badgeCount = (unreadCount ?? 0) + 1; // +1 for this new notification

    // Send to each device
    const resolvedContent = content;
    let sent = 0;

    await Promise.allSettled(
      devices.map(async (device) => {
        const message: FcmMessage = {
          token: device.fcm_token,
          notification: { title: resolvedContent.title, body: resolvedContent.body },
          data: resolvedContent.data,
          android: {
            priority: "high",
            collapse_key: collapseKey,
            notification: { channel_id: channelId, tag: collapseKey },
          },
          apns: {
            headers: collapseKey ? { "apns-collapse-id": collapseKey } : undefined,
            payload: {
              aps: {
                sound: "default",
                badge: badgeCount,
                ...(threadId ? { "thread-id": threadId } : {}),
              },
            },
          },
        };

        const result = await sendToFcm(projectId, accessToken, message);

        if (result.success) sent++;

        // Clean up stale tokens
        if (result.unregistered) {
          await supabase.from("user_devices").delete().eq("id", device.id);
          console.log(`[send-push] Removed stale token for device ${device.id}`);
        }
      }),
    );

    return new Response(
      JSON.stringify({ sent, total: devices.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-push] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
