import type { ContentType } from "@/app/_libs/chat-types";
import { MOCK_THREADS } from "@/app/_libs/mockThreadData";

export interface SharedContentItem {
  id: string;
  contentUrl: string;
  contentTitle: string;
  contentSource: string;
  contentImage: string | null;
  contentType: ContentType;
  contentReadTime: string | null;
  threadId: string | null;
  commentCount: number;
  lastCommentPreview: string | null;
  lastActivityAt: string;
  sharedBy: string;
  sharedByName: string;
}

/** Shared content for a person (threads they participate in) */
export function getSharedContentForPerson(handle: string): SharedContentItem[] {
  const items: SharedContentItem[] = [];
  for (const thread of MOCK_THREADS) {
    const isParticipant = thread.participants.some((p) => p.userHandle === handle);
    if (!isParticipant) continue;
    items.push({
      id: thread.id,
      contentUrl: thread.contentUrl,
      contentTitle: thread.contentTitle ?? "Untitled",
      contentSource: thread.contentSource ?? "",
      contentImage: thread.contentImage,
      contentType: thread.contentType,
      contentReadTime: thread.contentReadTime,
      threadId: thread.id,
      commentCount: 0,
      lastCommentPreview: thread.lastComment ? `${thread.lastComment.senderName}: ${thread.lastComment.content.slice(0, 40)}...` : null,
      lastActivityAt: thread.updatedAt,
      sharedBy: thread.createdByHandle,
      sharedByName: thread.createdByName,
    });
  }
  return items;
}
