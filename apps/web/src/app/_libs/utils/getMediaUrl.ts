import { env } from "env";

export const AVATARS_BUCKET = "avatars";

export function getMediaPublicUrl(bucket: string, filePath: string): string {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}

export function mediaToUrl(media: { bucket_name: string; file_path: string } | null): string | null {
  if (!media) return null;
  return getMediaPublicUrl(media.bucket_name, media.file_path);
}
