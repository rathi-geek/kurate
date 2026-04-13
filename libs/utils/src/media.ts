/**
 * Construct a Supabase Storage public URL from a media reference.
 * Both web and mobile use this to render avatars, previews, etc.
 */
export function getMediaPublicUrl(
  supabaseUrl: string,
  bucket: string,
  filePath: string,
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

export function mediaToUrl(
  supabaseUrl: string,
  media: { bucket_name: string; file_path: string } | null,
): string | null {
  if (!media) return null;
  return getMediaPublicUrl(supabaseUrl, media.bucket_name, media.file_path);
}
