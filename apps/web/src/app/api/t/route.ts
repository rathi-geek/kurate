import { NextResponse } from "next/server";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const TRACK_URL = "https://api.mixpanel.com/track";
const ENGAGE_URL = "https://api.mixpanel.com/engage";

interface TrackPayload {
  type: "track";
  event: string;
  properties: Record<string, unknown>;
}

interface EngagePayload {
  type: "engage";
  distinctId: string;
  traits: Record<string, unknown>;
}

type Payload = TrackPayload | EngagePayload;

export async function POST(request: Request) {
  if (!MIXPANEL_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.type === "track") {
      const data = [
        {
          event: body.event,
          properties: {
            ...body.properties,
            token: MIXPANEL_TOKEN,
            time: Date.now(),
          },
        },
      ];
      await fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify(data),
      });
    } else if (body.type === "engage") {
      const data = [
        {
          $token: MIXPANEL_TOKEN,
          $distinct_id: body.distinctId,
          $set: body.traits,
        },
      ];
      await fetch(ENGAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify(data),
      });
    }
  } catch {
    // Mixpanel API unreachable — swallow, don't fail the client
  }

  return NextResponse.json({ ok: true });
}
