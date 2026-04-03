import Dexie, { type EntityTable } from "dexie";

import type { ThoughtBucket } from "@kurate/utils";

export interface PendingThought {
  tempId: string;
  text: string;
  bucket: ThoughtBucket;
  content_type: string;
  media_id: string | null;
  createdAt: string;
  status: "sending" | "failed" | "confirmed";
}

export interface PendingLink {
  tempId: string;
  url: string;
  title: string;
  source: string | null;
  author: string | null;
  previewImage: string | null;
  contentType: string;
  readTime: string | null;
  tags: string[] | null;
  description: string | null;
  remarks: string | null;
  createdAt: string;
  status: "sending" | "failed" | "confirmed";
}

class KurateDB extends Dexie {
  pending_thoughts!: EntityTable<PendingThought, "tempId">;
  pending_links!: EntityTable<PendingLink, "tempId">;

  constructor() {
    super("kurate");
    this.version(1).stores({
      pending_thoughts: "tempId, status, createdAt",
      pending_links: "tempId, status, createdAt",
    });
    this.version(2).stores({
      pending_thoughts: "tempId, status, createdAt",
      pending_links: "tempId, url, status, createdAt",
    });
  }
}

export const db = new KurateDB();
