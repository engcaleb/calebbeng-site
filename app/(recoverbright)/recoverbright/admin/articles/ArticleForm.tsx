"use client";

import { useActionState } from "react";
import { saveArticle } from "./actions";
import type { Article } from "@/lib/recoverbright/articles";

export function ArticleForm({
  article,
  existingCategories,
}: {
  article?: Article;
  existingCategories: string[];
}) {
  const [error, action, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await saveArticle(formData);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {article && <input type="hidden" name="id" value={article.id} />}

      <div>
        <label className="label">Title</label>
        <input
          name="title"
          defaultValue={article?.title}
          required
          className="input mt-1"
          placeholder="e.g. What is LASIK?"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Category</label>
          <input
            name="category"
            defaultValue={article?.category ?? ""}
            className="input mt-1"
            placeholder="e.g. Procedures"
            list="article-categories"
          />
          <datalist id="article-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Excerpt</label>
          <input
            name="excerpt"
            defaultValue={article?.excerpt ?? ""}
            className="input mt-1"
            placeholder="Short summary for article cards"
          />
        </div>
      </div>

      <div>
        <label className="label">Content (Markdown)</label>
        <textarea
          name="content"
          defaultValue={article?.content}
          rows={20}
          className="input mt-1 font-mono text-[13px] leading-relaxed"
          placeholder="Write your article in Markdown..."
        />
      </div>

      {error && (
        <p className="text-[13px] text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : article ? "Update article" : "Create article"}
        </button>
        {article && (
          <a href="/recoverbright/admin/articles" className="btn-ghost">
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
