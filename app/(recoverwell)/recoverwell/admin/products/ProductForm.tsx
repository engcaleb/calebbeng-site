"use client";

import { useRef, useState, useTransition } from "react";
import { upsertProduct } from "./actions";
import type { RwProduct } from "@/lib/recoverwell/products";

export const CATEGORIES = [
  "Artificial Tears · Preservative-Free",
  "UV Protective Eyewear",
  "Sleep Eye Shield",
  "Silk Sleep Mask",
  "Moist Heat Compress",
  "Cooling Gel Eye Mask",
  "Eyelid Hygiene Wipes",
  "Omega-3 Supplement",
  "AREDS2 Supplement",
  "Humidifier",
  "Blue Light Glasses",
  "Anti-Nausea",
  "Other",
];

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductForm({ product }: { product?: RwProduct }) {
  const isEdit = !!product?.id;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file || !product?.id) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("bucket", "product-images");
      body.append("id", product.id);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
      setImageUrl(json.url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again"
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugEdited(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertProduct(formData);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      {isEdit && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="is_active" value={product?.is_active !== false ? "true" : "false"} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input"
            placeholder="Bruder Moist Heat Eye Compress"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="slug">
            Slug *{" "}
            <span className="text-[#1c1a17]/35 font-normal">
              (URL identifier)
            </span>
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="input font-mono text-[13px]"
            placeholder="bruder-moist-heat-compress"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            required
            defaultValue={product?.category ?? ""}
            className="input"
          >
            <option value="" disabled>Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="sort_order">
            Sort Order{" "}
            <span className="text-[#1c1a17]/35 font-normal">(lower = first)</span>
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={product?.sort_order ?? 0}
            className="input"
          />
        </div>

        {/* Buy URL */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="label" htmlFor="buy_url">Buy URL</label>
          <input
            id="buy_url"
            name="buy_url"
            type="url"
            defaultValue={product?.buy_url ?? ""}
            className="input font-mono text-[13px]"
            placeholder="https://amazon.com/dp/..."
          />
        </div>

        {/* Product Image */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="label" htmlFor="image_url">Product Image</label>
          <div className="flex items-center gap-2">
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
              id="image_url"
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
        </div>

        {/* Default Instructions */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="label" htmlFor="default_instructions">
            Default Instructions
          </label>
          <textarea
            id="default_instructions"
            name="default_instructions"
            rows={3}
            defaultValue={product?.default_instructions ?? ""}
            className="input resize-none"
            placeholder="Apply warm compress for 10 minutes, 2–4× per day."
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
        </button>
        {isEdit && (
          <a href="/recoverwell/admin/products" className="btn-ghost">
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
