import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProfilePhotoError, uploadProfilePhoto } from "@/lib/profile-photo";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  try {
    const url = await uploadProfilePhoto(supabase, user.id, "avatar", file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ProfilePhotoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
