import type { ContentThread, ThreadParticipant, ThreadComment } from "@/app/_libs/chat-types";

const THREAD_1 = "t0000000-0000-0000-0000-000000000001";
const THREAD_2 = "t0000000-0000-0000-0000-000000000002";

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function participant(
  threadId: string,
  handle: string,
  name: string,
  role: "sharer" | "participant" = "participant"
): ThreadParticipant {
  return {
    id: `p-${handle.slice(1)}-${threadId.slice(-4)}`,
    threadId,
    userHandle: handle,
    userName: name,
    role,
    joinedAt: ago(10000),
  };
}

function comment(
  threadId: string,
  senderHandle: string,
  senderName: string,
  content: string,
  minutesAgo: number
): ThreadComment {
  return {
    id: `cmt-${threadId}-${minutesAgo}`,
    threadId,
    senderHandle,
    senderName,
    content,
    reactions: [],
    createdAt: ago(minutesAgo),
  };
}

const COMMENTS_1: ThreadComment[] = [
  comment(THREAD_1, "@suchet", "Suchet", "This PG essay is a must-read. The compounding section changed how I think about career decisions.", 120),
  comment(THREAD_1, "@naman", "Naman", "The compounding section is insane. Really clicked for me.", 115),
];

const COMMENTS_2: ThreadComment[] = [
  comment(THREAD_2, "@naman", "Naman", "Bro you HAVE to watch this. Best visual explanation of neural networks.", 240),
  comment(THREAD_2, "@suchet", "Suchet", "Oh yeah 3b1b is goated. The linear algebra series changed my life lol", 235),
];

export const MOCK_THREADS: ContentThread[] = [
  {
    id: THREAD_1,
    contentUrl: "https://paulgraham.com/superlinear.html",
    contentTitle: "Superlinear Returns",
    contentSource: "paulgraham.com",
    contentImage: null,
    contentType: "article",
    contentReadTime: "25 min",
    contentDescription: "Returns for performance are superlinear.",
    loggedItemId: null,
    createdByHandle: "@suchet",
    createdByName: "Suchet",
    createdAt: ago(10000),
    updatedAt: ago(120),
    participants: [
      participant(THREAD_1, "@suchet", "Suchet", "sharer"),
      participant(THREAD_1, "@naman", "Naman", "participant"),
    ],
    lastComment: COMMENTS_1[COMMENTS_1.length - 1],
  },
  {
    id: THREAD_2,
    contentUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
    contentTitle: "Neural Networks (3Blue1Brown)",
    contentSource: "youtube.com",
    contentImage: null,
    contentType: "video",
    contentReadTime: "20 min",
    contentDescription: "Visual introduction to neural networks.",
    loggedItemId: null,
    createdByHandle: "@naman",
    createdByName: "Naman",
    createdAt: ago(10000),
    updatedAt: ago(240),
    participants: [
      participant(THREAD_2, "@naman", "Naman", "sharer"),
      participant(THREAD_2, "@suchet", "Suchet", "participant"),
    ],
    lastComment: COMMENTS_2[COMMENTS_2.length - 1],
  },
];

export const MOCK_THREAD_COMMENTS: Record<string, ThreadComment[]> = {
  [THREAD_1]: COMMENTS_1,
  [THREAD_2]: COMMENTS_2,
};

export function getOtherParticipants(thread: ContentThread): ThreadParticipant[] {
  return thread.participants.filter((p) => p.userHandle !== "@vivek");
}

export function findThread(threadId: string): ContentThread | undefined {
  return MOCK_THREADS.find((t) => t.id === threadId);
}
