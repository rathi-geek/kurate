import { mediaToUrl as _mediaToUrl } from "@kurate/utils";
import { env } from "env";

export const AVATARS_BUCKET = "avatars";
const STORAGE_BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

export function getMediaPublicUrl(bucket: string, filePath: string): string {
  return `${STORAGE_BASE}${bucket}/${filePath}`;
}

export function mediaToUrl(media: { bucket_name: string; file_path: string } | null): string | null {
  return _mediaToUrl(env.NEXT_PUBLIC_SUPABASE_URL, media);
}

/** Convert an avatar_path ('bucket/path') from an RPC to a full public URL. */
export function avatarUrl(path: string | null | undefined): string | null {
  return path ? `${STORAGE_BASE}${path}` : null;
}
