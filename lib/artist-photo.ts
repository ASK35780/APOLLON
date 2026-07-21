import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class ArtistPhotoError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function extensionFor(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

// Mirrors lib/profile-photo.ts but targets the caller's own artist row
// (artists.owner_id = userId) instead of profiles — same public "avatars"
// bucket, same folder-ownership RLS (path convention
// "<user_id>/artist-avatar.<ext>", "<user_id>/artist-banner.<ext>").
export async function uploadArtistPhoto(
  supabase: SupabaseClient,
  userId: string,
  kind: "avatar" | "banner",
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ArtistPhotoError("Format d'image non supporté (JPEG, PNG, WEBP ou GIF attendu).", 400);
  }
  if (file.size > MAX_BYTES) {
    throw new ArtistPhotoError("Image trop lourde (5 Mo maximum).", 400);
  }

  const path = `${userId}/artist-${kind}.${extensionFor(file.type)}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) throw new ArtistPhotoError(uploadError.message, 500);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?t=${Date.now()}`;

  const column = kind === "avatar" ? "avatar_url" : "banner_url";
  const { error: updateError } = await supabase.from("artists").update({ [column]: url }).eq("owner_id", userId);
  if (updateError) throw new ArtistPhotoError(updateError.message, 500);

  return url;
}
