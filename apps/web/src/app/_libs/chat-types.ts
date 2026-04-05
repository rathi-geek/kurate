/** Content type for threads and vault */
export type ContentType = "article" | "video" | "podcast";

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface ContentThread {
  id: string;
  contentUrl: string;
  contentTitle: string | null;
  contentSource: string | null;
  contentImage: string | null;
  contentType: ContentType;
  contentReadTime: string | null;
  contentDescription: string | null;
  loggedItemId: string | null;
  createdByHandle: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  participants: ThreadParticipant[];
  lastComment?: ThreadComment;
  unreadCount?: number;
}

export interface ThreadParticipant {
  id: string;
  threadId: string;
  userHandle: string;
  userName: string;
  userId?: string | null;
  role: "sharer" | "participant";
  joinedAt: string;
}

export interface ThreadComment {
  id: string;
  threadId: string;
  senderHandle: string;
  senderName: string;
  senderId?: string | null;
  content: string;
  reactions: MessageReaction[];
  replyTo?: { id: string; senderName: string; content: string } | null;
  createdAt: string;
  updatedAt?: string;
}
