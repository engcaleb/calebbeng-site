import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/recoverbright/auth";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["practice-logos", "product-images", "article-images"] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

// No fallback extension — an unrecognized MIME type is rejected outright
// rather than silently stored as ".jpg" with attacker-controlled contentType.
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const id = formData.get("id") as string | null;

    if (!file || !bucket || !id) {
      return NextResponse.json(
        { error: "Missing file, bucket, or id" },
        { status: 400 }
      );
    }
    if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    // Ownership check: the caller must actually control the thing `id`
    // points at. Without this, any authenticated doctor could overwrite
    // any practice logo, product image, or article image by guessing/
    // reading its id.
    if (bucket === "practice-logos") {
      const { data: doctor } = await authClient
        .from("rw_doctors")
        .select("practice_id")
        .eq("auth_user_id", user.id)
        .single();
      if (!doctor || doctor.practice_id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // product-images and article-images are admin-managed catalogs.
      if (!isAdminEmail(user.email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const path = `${id}/image.${ext}`;
    const bytes = await file.arrayBuffer();

    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket as AllowedBucket)
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage
      .from(bucket as AllowedBucket)
      .getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
