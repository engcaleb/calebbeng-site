"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { savePageProducts, togglePublish } from "../../actions";
import type { PageForEditor } from "@/lib/recoverwell/portal-pages";
import type { RwProduct } from "@/lib/recoverwell/products";

type ProductState = {
  custom_instructions: string | null; // null = use admin default
  sort_order: number;
};

export function PageEditor({
  page,
  allProducts,
  practiceSlug,
}: {
  page: PageForEditor;
  allProducts: RwProduct[];
  practiceSlug: string;
}) {
  const [selected, setSelected] = useState<Map<string, ProductState>>(
    () =>
      new Map(
        page.page_products.map((pp) => [
          pp.product_id,
          {
            custom_instructions: pp.custom_instructions,
            sort_order: pp.sort_order,
          },
        ])
      )
  );
  const [published, setPublished] = useState(page.is_published);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSavePending, startSaveTransition] = useTransition();
  const [isPublishPending, startPublishTransition] = useTransition();

  // Group active products by category (preserving sort order from DB)
  const grouped = allProducts.reduce<Record<string, RwProduct[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  function toggleProduct(productId: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.set(productId, {
          custom_instructions: null,
          sort_order: next.size,
        });
      }
      return next;
    });
    setSaveStatus("idle");
  }

  function setInstructions(productId: string, value: string | null) {
    setSelected((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (existing) next.set(productId, { ...existing, custom_instructions: value });
      return next;
    });
    setSaveStatus("idle");
  }

  function handleSave() {
    startSaveTransition(async () => {
      setSaveStatus("saving");
      try {
        const products = Array.from(selected.entries()).map(
          ([product_id, { custom_instructions }], i) => ({
            product_id,
            // Save null (use default) if empty string
            custom_instructions:
              custom_instructions === "" ? null : custom_instructions,
            sort_order: i,
          })
        );
        await savePageProducts(
          page.id,
          practiceSlug,
          page.surgery_type,
          products
        );
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    });
  }

  function handleTogglePublish() {
    startPublishTransition(async () => {
      try {
        await togglePublish(
          page.id,
          practiceSlug,
          page.surgery_type,
          published
        );
        setPublished((p) => !p);
      } catch {
        // publish failures are silent — user will see the badge didn't flip
      }
    });
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/recoverwell/portal"
            className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-medium text-[#1c1a17]">
            {page.surgery_type} · Recommendation Page
          </h1>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={isPublishPending}
          className={`mt-1 shrink-0 rounded-full px-3 py-1 font-mono text-[12px] transition disabled:opacity-50 ${
            published
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-[#1c1a17]/6 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
          }`}
        >
          {isPublishPending ? "…" : published ? "Published" : "Draft · Publish"}
        </button>
      </div>

      {/* ── Product list ────────────────────────────────────── */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, products]) => (
          <div key={category}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              {category}
            </p>
            <div className="space-y-2">
              {products.map((product) => {
                const state = selected.get(product.id);
                const isChecked = !!state;
                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-lg border border-[#e8e3da] bg-white"
                  >
                    {/* Checkbox row */}
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 accent-[#1c1a17]"
                      />
                      <span className="text-[14px] font-medium text-[#1c1a17]">
                        {product.name}
                      </span>
                    </label>

                    {/* Instructions panel — only when checked */}
                    {isChecked && (
                      <div className="border-t border-[#e8e3da] bg-[#faf9f7] px-4 pb-4 pt-3">
                        <InstructionsPanel
                          defaultInstructions={product.default_instructions}
                          customInstructions={state.custom_instructions}
                          onChange={(value) =>
                            setInstructions(product.id, value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Save bar ────────────────────────────────────────── */}
      <div className="mt-10 flex items-center gap-4 border-t border-[#e8e3da] pt-6">
        <button
          onClick={handleSave}
          disabled={isSavePending}
          className="btn-primary"
        >
          {isSavePending ? "Saving…" : "Save"}
        </button>
        <a
          href={`/recoverwell/portal/pages/${page.id}/pdf`}
          download
          className="btn-ghost"
        >
          Download PDF
        </a>
        {saveStatus === "saved" && (
          <span className="font-mono text-[12px] text-green-600">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="font-mono text-[12px] text-red-500">
            Error saving — try again
          </span>
        )}
      </div>
    </div>
  );
}

// ── InstructionsPanel ──────────────────────────────────────────────────────

function InstructionsPanel({
  defaultInstructions,
  customInstructions,
  onChange,
}: {
  defaultInstructions: string | null;
  customInstructions: string | null; // null = use default
  onChange: (value: string | null) => void;
}) {
  // null = showing default (or empty prompt); string = customizing
  const isCustomizing = customInstructions !== null;

  if (!isCustomizing) {
    if (defaultInstructions) {
      // State 1: default exists, showing it read-only
      return (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
            Default instructions · set by admin
          </p>
          <p className="text-[13px] leading-relaxed text-[#1c1a17]/60">
            {defaultInstructions}
          </p>
          <button
            type="button"
            onClick={() => onChange("")}
            className="mt-2 font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17]"
          >
            Customize
          </button>
        </div>
      );
    }
    // State 3: no default — optional free-text
    return (
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
          Instructions{" "}
          <span className="normal-case tracking-normal text-[#1c1a17]/25">
            (optional)
          </span>
        </p>
        <textarea
          rows={2}
          placeholder="Add instructions for this product…"
          className="input resize-none"
          onChange={(e) => onChange(e.target.value || null)}
        />
      </div>
    );
  }

  // State 2: customizing
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
        Custom instructions
      </p>
      <textarea
        rows={2}
        value={customInstructions}
        autoFocus
        placeholder="Your instructions for this product…"
        className="input resize-none"
        onChange={(e) => onChange(e.target.value)}
      />
      {defaultInstructions && (
        <div className="mt-2 rounded border border-[#e8e3da] bg-white p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1c1a17]/30">
            Admin default
          </p>
          <p className="mt-0.5 text-[12px] text-[#1c1a17]/45">
            {defaultInstructions}
          </p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-1.5 font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17]"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
