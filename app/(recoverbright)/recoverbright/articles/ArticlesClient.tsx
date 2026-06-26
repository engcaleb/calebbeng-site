"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Article } from "@/lib/recoverbright/articles";

export function ArticlesClient({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      [...new Set(articles.map((a) => a.category).filter(Boolean) as string[])],
    [articles]
  );

  const filtered = useMemo(() => {
    let result = articles;
    if (activeCategory) result = result.filter((a) => a.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, query, activeCategory]);

  return (
    <>
      <div className="mt-8">
        <input
          type="search"
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input w-full"
        />
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] transition ${
              !activeCategory
                ? "border-[#1c1a17] bg-[#1c1a17] text-[#f9f7f4]"
                : "border-[#1c1a17]/10 text-[#1c1a17]/50 hover:border-[#1c1a17]/25 hover:text-[#1c1a17]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`rounded-full border px-3 py-1 font-mono text-[11px] transition ${
                activeCategory === cat
                  ? "border-[#1c1a17] bg-[#1c1a17] text-[#f9f7f4]"
                  : "border-[#1c1a17]/10 text-[#1c1a17]/50 hover:border-[#1c1a17]/25 hover:text-[#1c1a17]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-[15px] text-[#1c1a17]/40">
          {query || activeCategory ? "No articles found." : "Articles coming soon."}
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/recoverbright/articles/${article.slug}`}
              className="block overflow-hidden rounded-xl border border-[#e8e3da] bg-white transition hover:border-[#1c1a17]/20"
            >
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt=""
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
