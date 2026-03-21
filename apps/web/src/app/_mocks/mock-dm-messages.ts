import type { ThreadComment } from "@/app/_libs/chat-types";

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function dm(handle: string, senderHandle: string, senderName: string, content: string, minutesAgo: number): ThreadComment {
  return {
    id: `dm-${handle}-${minutesAgo}`,
    threadId: `dm-${handle}`,
    senderHandle,
    senderName,
    content,
    reactions: [],
    createdAt: ago(minutesAgo),
  };
}

const DM_SUCHET: ThreadComment[] = [
  dm("@suchet", "@suchet", "Suchet", "Hey, have you read the PG essay on superlinear returns?", 60),
  dm("@suchet", "@vivek", "You", "Yes! The compounding section is incredible.", 55),
  dm("@suchet", "@suchet", "Suchet", "We should start a thread on it.", 50),
];

const DM_NAMAN: ThreadComment[] = [
  dm("@naman", "@naman", "Naman", "Sent you the 3b1b neural nets link.", 120),
  dm("@naman", "@vivek", "You", "Watching it tonight, thanks!", 115),
];

const DM_OTHERS: ThreadComment[] = [
  dm("@arshia", "@arshia", "Arshia", "Check out this design essay when you get a chance.", 200),
  dm("@priya", "@priya", "Priya R.", "Thanks for the recommendation!", 180),
];

const DM_MAP: Record<string, ThreadComment[]> = {
  "@suchet": DM_SUCHET,
  "@naman": DM_NAMAN,
  "@arshia": DM_OTHERS,
  "@priya": DM_OTHERS,
  "@aditya": DM_OTHERS,
  "@shreya": DM_OTHERS,
};

export function getDMMessages(handle: string): ThreadComment[] {
  return DM_MAP[handle] ?? [];
}
