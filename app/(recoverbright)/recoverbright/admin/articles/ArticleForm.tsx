"use client";

import { useRef, useState, useActionState } from "react";
import { saveArticle } from "./actions";
import type { Article } from "@/lib/recoverbright/articles";

export function ArticleForm({
  article,
  existingCategories,
}: {
  article?: Article;
  existingCategories: string[];
}) {
  const isEdit = !!article?.id;
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(article?.image_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  async function handleImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file || !article?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("bucket", "article-images");
      body.append("id", article.id);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
      setImageUrl(json.url);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again",
      );
    } finally {
      setIsUploading(false);
    }
  }

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
        <label className="label">Cover Image</label>
        <div className="mt-1 flex items-center gap-2">
          {isEdit ? (
            <>
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-ghost shrink-0 disabled:opacity-50"
              >
                {isUploading ? "Uploading…" : "Choose file"}
              </button>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
                or
              </span>
            </>
          ) : (
            <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
              Save first to upload ·
            </span>
          )}
          <input
            name="image_url"
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setUploadError(null);
            }}
            placeholder="https://…"
            className="input flex-1 font-mono text-[13px]"
          />
        </div>
        {uploadError && (
          <p className="mt-1 font-mono text-[11px] text-red-500">
            {uploadError}
          </p>
        )}
        {imageUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-32 rounded-lg border border-[#1c1a17]/8 object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="font-mono text-[11px] text-red-400 hover:text-red-600"
            >
              Remove image
            </button>
          </div>
        )}
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
