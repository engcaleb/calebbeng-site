import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug } from "@/lib/recoverbright/articles";
import { marked } from "marked";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not Found" };
  return {
    title: `${article.title} — RecoverBright`,
    description:
      article.excerpt ??
      `${article.title} — recovery information from RecoverBright.`,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const html = await marked.parse(article.content);

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/recoverbright"
          className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60"
        >
          RecoverBright
        </Link>
        <Link
          href="/recoverbright/articles"
          className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
        >
          ← All articles
        </Link>
      </nav>

      <article className="mx-auto max-w-2xl px-6 pb-24 pt-12 md:px-12">
        {article.category && (
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
            {article.category}
          </p>
        )}
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          {article.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <p className="font-mono text-[12px] text-[#1c1a17]/40">
            RecoverBright
          </p>
          <span className="text-[#1c1a17]/20">·</span>
          <p className="font-mono text-[12px] text-[#1c1a17]/40">
            {new Date(article.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div
          className="article-content mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/recoverbright/articles"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              All articles
            </Link>
            <Link
              href="/recoverbright/privacy"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
