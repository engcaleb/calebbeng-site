"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { savePageProducts, togglePublish, toggleShowDoctor } from "../../actions";
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
  const [showDoctor, setShowDoctor] = useState(page.show_doctor);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSavePending, startSaveTransition] = useTransition();
  const [isPublishPending, startPublishTransition] = useTransition();
  const [isShowDoctorPending, startShowDoctorTransition] = useTransition();

  // Fast lookup: product ID → full product details
  const productById = new Map(allProducts.map((p) => [p.id, p]));

  // Ordered list of selected entries (by sort_order, matching DB order on load)
  const selectedEntries = Array.from(selected.entries()).sort(
    ([, a], [, b]) => a.sort_order - b.sort_order
  );

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

  function handleToggleShowDoctor() {
    startShowDoctorTransition(async () => {
      try {
        await toggleShowDoctor(page.id, practiceSlug, page.surgery_type, showDoctor);
        setShowDoctor((v) => !v);
      } catch {
        // silent — badge won't flip if it fails
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
        <div className="mt-1 flex shrink-0 gap-2">
          <button
            onClick={handleToggleShowDoctor}
            disabled={isShowDoctorPending}
            className={`rounded-full px-3 py-1 font-mono text-[12px] transition disabled:opacity-50 ${
              showDoctor
                ? "bg-[#1c1a17]/6 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {isShowDoctorPending ? "…" : showDoctor ? "My name shown" : "Practice-wide"}
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={isPublishPending}
            className={`rounded-full px-3 py-1 font-mono text-[12px] transition disabled:opacity-50 ${
              published
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-[#1c1a17]/6 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
            }`}
          >
            {isPublishPending ? "…" : published ? "Published" : "Draft · Publish"}
          </button>
        </div>
      </div>

      {/* ── Selected products ─────────────────────────────── */}
      <div className="space-y-2">
        {selectedEntries.map(([productId, state]) => {
          const product = productById.get(productId);
          if (!product) return null;
          return (
            <div
              key={productId}
              className="overflow-hidden rounded-lg border border-[#e8e3da] bg-white"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1c1a17]/35">
                    {product.category}
                  </p>
                  <p className="text-[14px] font-medium text-[#1c1a17]">
                    {product.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProduct(productId)}
                  className="shrink-0 font-mono text-[13px] text-[#1c1a17]/25 hover:text-red-500 transition"
                  aria-label={`Remove ${product.name}`}
                >
                  ✕
                </button>
              </div>
              {/* Instructions — always expanded */}
              <div className="border-t border-[#e8e3da] bg-[#faf9f7] px-4 pb-4 pt-3">
                <InstructionsPanel
                  defaultInstructions={product.default_instructions}
                  customInstructions={state.custom_instructions}
                  onChange={(value) => setInstructions(productId, value)}
                />
              </div>
            </div>
          );
        })}
        {selectedEntries.length === 0 && (
          <p className="py-8 text-center font-mono text-[12px] text-[#1c1a17]/30">
            No products yet — search below to add some.
          </p>
        )}
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
