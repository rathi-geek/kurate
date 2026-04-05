import type { ThoughtMessage } from "@kurate/types";
import type { PendingThought } from "@/app/_libs/db";

export type DisplayMessage = ThoughtMessage & { _pending?: boolean; _failed?: boolean };

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function pendingToMessage(p: PendingThought): DisplayMessage {
  return {
    id: p.tempId,
    bucket: p.bucket,
    text: p.text,
    createdAt: p.createdAt,
    media_id: p.media_id,
    content_type: p.content_type,
    _pending: p.status === "sending",
    _failed: p.status === "failed",
  };
}
