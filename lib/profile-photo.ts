import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 5 * 1024 * 1024; // keep well under Vercel's serverless request body limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class ProfilePhotoError extends Error {
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

// Shared upload path for both the avatar and banner routes: validates the
// file, writes it to the user's own folder in the public "avatars" bucket
// (RLS enforces the folder-ownership check — see
// supabase/migrations/0003_profile_photos_and_featured_badges.sql), and
// updates the matching profiles column with a cache-busted public URL.
export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  kind: "avatar" | "banner",
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ProfilePhotoError("Format d'image non supporté (JPEG, PNG, WEBP ou GIF attendu).", 400);
  }
  if (file.size > MAX_BYTES) {
    throw new ProfilePhotoError("Image trop lourde (5 Mo maximum).", 400);
  }

  const path = `${userId}/${kind}.${extensionFor(file.type)}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) throw new ProfilePhotoError(uploadError.message, 500);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Same path is reused on every upload (upsert), so bust caches with a
  // version query param — otherwise browsers/CDNs may keep showing the old image.
  const url = `${publicUrl}?t=${Date.now()}`;

  const column = kind === "avatar" ? "avatar_url" : "banner_url";
  const { error: updateError } = await supabase.from("profiles").update({ [column]: url }).eq("id", userId);
  if (updateError) throw new ProfilePhotoError(updateError.message, 500);

  return url;
}
