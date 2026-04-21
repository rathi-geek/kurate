import type { ThoughtBucket } from "@kurate/utils";

export interface ThoughtMessage {
  id: string;
  bucket: ThoughtBucket;
  text: string;
  created_at: string;
  media_id?: string | null;
  content_type?: string;
}

export interface Bucket {
  id: string;
  slug: string;
  label: string;
  color: string;
  is_system: boolean;
  is_pinned: boolean;
  created_at: string;
}
