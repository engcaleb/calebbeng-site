import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  is_published: boolean;
  is_featured: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rw_articles")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as Article[];
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rw_articles")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as Article[];
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rw_articles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return (data as Article) ?? null;
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("rw_articles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Article[];
}

export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("rw_articles")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Article) ?? null;
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
