import type { ThoughtBucket } from "@kurate/utils";

export interface ThoughtMessage {
  id: string;
  bucket: ThoughtBucket;
  text: string;
  createdAt: string; // ISO
  media_id?: string | null;
  content_type?: string;
}
