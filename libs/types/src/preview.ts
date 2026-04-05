export enum PreviewPhase {
  Idle = "idle",
  Loading = "loading",
  Loaded = "loaded",
  Share = "share",
}

export interface ExtractedMeta {
  title?: string | null;
  source?: string | null;
  author?: string | null;
  previewImage?: string | null;
  contentType?: string | null;
  readTime?: number | string | null;
  description?: string | null;
}
