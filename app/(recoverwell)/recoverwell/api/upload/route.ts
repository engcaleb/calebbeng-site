import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["practice-logos", "product-images"] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "jpg";
}

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

    const ext = extFromMime(file.type);
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
