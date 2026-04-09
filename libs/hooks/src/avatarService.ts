import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@kurate/types";

export const AVATARS_BUCKET = "avatars";

type AvatarMeta = { file_path: string; bucket_name: string } | null;

/**
 * Cleans up old avatar file + media_metadata if path changed (e.g. .png → .jpg).
 */
export async function cleanupOldAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  newPath: string,
): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_id, avatar:avatar_id(file_path, bucket_name)")
    .eq("id", userId)
    .single();

  const old = data?.avatar as AvatarMeta;
  if (old && old.file_path !== newPath) {
    await supabase.storage.from(old.bucket_name).remove([old.file_path]);
    if (data?.avatar_id) {
      await supabase.from("media_metadata").delete().eq("id", data.avatar_id);
    }
  }
}

/**
 * Returns the storage path for a user's profile avatar.
 */
export function getAvatarPath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "jpg";
  return `profile_avatars/${userId}.${ext}`;
}

/**
 * After a file is uploaded to storage, upserts media_metadata and links to profile.
 * Returns cache-busted public URL.
 */
export async function linkUploadedAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: string,
  fileName: string,
  fileType: string,
  fileSize: number,
): Promise<string> {
  const { data: media, error: mediaErr } = await supabase
    .from("media_metadata")
    .upsert(
      {
        provider: "supabase",
        bucket_name: AVATARS_BUCKET,
        file_path: path,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        owner_id: userId,
        is_public: true,
      },
      { onConflict: "owner_id,provider,file_path,file_name" },
    )
    .select("id")
    .single();
  if (mediaErr) throw mediaErr;

  await supabase
    .from("profiles")
    .update({ avatar_id: media.id })
    .eq("id", userId);

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}

/**
 * Uploads avatar file to storage, upserts media_metadata, links to profile.
 * Accepts Blob (web) — for React Native, use uploadAvatarFromUri instead.
 * Returns cache-busted public URL.
 */
export async function uploadAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  fileBlob: Blob,
  fileName: string,
  fileType: string,
  fileSize: number,
): Promise<string> {
  const path = getAvatarPath(userId, fileName);

  await cleanupOldAvatar(supabase, userId, path);

  const { error: uploadErr } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, fileBlob, { upsert: true, contentType: fileType });
  if (uploadErr) throw uploadErr;

  return linkUploadedAvatar(supabase, userId, path, fileName, fileType, fileSize);
}

/**
 * Uploads avatar from a local file URI (React Native).
 * Uses FormData which RN's fetch handles natively with file:// URIs.
 * Returns cache-busted public URL.
 */
export async function uploadAvatarFromUri(
  supabase: SupabaseClient<Database>,
  userId: string,
  uri: string,
  fileName: string,
  fileType: string,
  fileSize: number,
): Promise<string> {
  const path = getAvatarPath(userId, fileName);

  await cleanupOldAvatar(supabase, userId, path);

  const formData = new FormData();
  // React Native accepts { uri, type, name } as a file-like object in FormData
  formData.append("file", {
    uri,
    type: fileType,
    name: fileName,
  } as unknown as Blob);

  const { error: uploadErr } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, formData, { upsert: true });
  if (uploadErr) throw uploadErr;

  return linkUploadedAvatar(supabase, userId, path, fileName, fileType, fileSize);
}

/**
 * Full avatar cleanup: storage file + media_metadata row + unlink from profile.
 */
export async function deleteAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_id, avatar:avatar_id(file_path, bucket_name)")
    .eq("id", userId)
    .single();

  const avatar = data?.avatar as AvatarMeta;
  if (avatar && data?.avatar_id) {
    await supabase.storage.from(avatar.bucket_name).remove([avatar.file_path]);
    await supabase.from("media_metadata").delete().eq("id", data.avatar_id);
  }

  await supabase
    .from("profiles")
    .update({ avatar_id: null })
    .eq("id", userId);
}
