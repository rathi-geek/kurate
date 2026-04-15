export interface PendingLinkRow {
  tempId: string;
  url: string;
  title: string;
  source: string | null;
  author: string | null;
  previewImage: string | null;
  contentType: string | null;
  readTime: string | null;
  tags: string[] | null;
  description: string | null;
  remarks: string | null;
  createdAt: string;
  status: "sending" | "confirmed" | "failed";
}

export interface PendingThoughtRow {
  tempId: string;
  text: string;
  bucket: string;
  content_type: string;
  media_id: string | null;
  createdAt: string;
  status: "sending" | "confirmed" | "failed";
}

export interface PendingGroupPostRow {
  tempId: string;
  convo_id: string;
  shared_by: string;
  content: string | null;
  logged_item_id: string | null;
  note: string | null;
  url: string | null;
  title: string | null;
  previewImage: string | null;
  source: string | null;
  contentType: string | null;
  serverId: string | null;
  createdAt: string;
  status: "sending" | "confirmed" | "failed";
}

export interface PendingDB {
  addPendingLink(row: PendingLinkRow): Promise<void>;
  getPendingLinkByUrl(url: string): Promise<PendingLinkRow | null>;
  updatePendingLinkStatus(tempId: string, status: string): Promise<void>;
  deletePendingLink(tempId: string): Promise<void>;
  getAllPendingLinks(): Promise<PendingLinkRow[]>;

  addPendingThought(row: PendingThoughtRow): Promise<void>;
  updatePendingThoughtStatus(tempId: string, status: string): Promise<void>;
  deletePendingThought(tempId: string): Promise<void>;
  getAllPendingThoughts(): Promise<PendingThoughtRow[]>;

  addPendingGroupPost(row: PendingGroupPostRow): Promise<void>;
  updatePendingGroupPostStatus(
    tempId: string,
    status: string,
    serverId?: string,
  ): Promise<void>;
  deletePendingGroupPost(tempId: string): Promise<void>;
  getAllPendingGroupPosts(): Promise<PendingGroupPostRow[]>;
  getPendingGroupPostsForGroup(groupId: string): Promise<PendingGroupPostRow[]>;
}
