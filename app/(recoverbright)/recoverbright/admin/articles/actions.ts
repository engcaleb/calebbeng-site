"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/recoverbright/auth";
import { titleToSlug } from "@/lib/recoverbright/articles";
import { revalidatePath } from "next/cache";

function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function saveArticle(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string).trim();
  const content = formData.get("content") as string;
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const oldImageUrl = (formData.get("old_image_url") as string)?.trim() || null;

  if (!title) throw new Error("Title is required");

  const supabase = createServiceClient();

  if (id) {
    const { error } = await supabase
      .from("rw_articles")
      .update({ title, content, excerpt, category, image_url, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const slug = titleToSlug(title);
    const { error } = await supabase
      .from("rw_articles")
      .insert({ title, slug, content, excerpt, category, image_url });
    if (error) {
      if (error.code === "23505") throw new Error("An article with that title already exists");
      throw new Error(error.message);
    }
  }

  if (oldImageUrl && !image_url) {
    const path = storagePathFromUrl(oldImageUrl, "article-images");
    if (path) {
      await supabase.storage.from("article-images").remove([path]);
    }
  }

  revalidatePath("/recoverbright/admin/articles");
  revalidatePath("/recoverbright/articles");
  revalidatePath("/recoverbright");
}

export async function togglePublished(id: string, is_published: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("rw_articles")
    .update({ is_published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recoverbright/admin/articles");
  revalidatePath("/recoverbright/articles");
  revalidatePath("/recoverbright");
}

export async function toggleFeatured(id: string, is_featured: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("rw_articles")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recoverbright/admin/articles");
  revalidatePath("/recoverbright");
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: article } = await supabase
    .from("rw_articles")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("rw_articles")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (article?.image_url) {
    const path = storagePathFromUrl(article.image_url, "article-images");
    if (path) {
      await supabase.storage.from("article-images").remove([path]);
    }
  }

  revalidatePath("/recoverbright/admin/articles");
  revalidatePath("/recoverbright/articles");
  revalidatePath("/recoverbright");
}
