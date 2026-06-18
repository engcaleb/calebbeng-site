import Link from "next/link";
import { getPublishedArticles } from "@/lib/recoverbright/articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles — RecoverBright",
  description:
    "Recovery guides and procedure information to help you prepare.",
};

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  const categories = [
    ...new Set(articles.map((a) => a.category).filter(Boolean) as string[]),
  ];

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/recoverbright"
          className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60"
        >
          RecoverBright
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/recoverbright/portal/login"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-12 md:px-12">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#1c1a17]/40">
          Articles
        </p>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Recovery guides & resources
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#1c1a17]/55">
          Information to help you understand your procedure and prepare for a
          smooth recovery.
        </p>

        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-[#1c1a17]/10 px-3 py-1 font-mono text-[11px] text-[#1c1a17]/50"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {articles.length === 0 ? (
          <p className="mt-16 text-center text-[15px] text-[#1c1a17]/40">
            Articles coming soon.
          </p>
        ) : (
          <div className="mt-12 space-y-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/recoverbright/articles/${article.slug}`}
                className="block rounded-xl border border-[#e8e3da] bg-white p-6 transition hover:border-[#1c1a17]/20"
              >
                {article.category && (
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
                    {article.category}
                  </p>
                )}
                <h2 className="text-[17px] font-medium text-[#1c1a17]">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-2 text-[14px] leading-relaxed text-[#1c1a17]/55">
                    {article.excerpt}
                  </p>
                )}
                <p className="mt-3 font-mono text-[11px] text-[#1c1a17]/30">
                  {new Date(article.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <div className="flex items-center gap-5">
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
