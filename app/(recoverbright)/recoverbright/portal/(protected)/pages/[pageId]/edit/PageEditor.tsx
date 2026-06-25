"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { savePageProducts, togglePublish } from "../../actions";
import type { PageForEditor } from "@/lib/recoverbright/portal-pages";
import type { RwProduct } from "@/lib/recoverbright/products";

type ProductState = {
  custom_instructions: string | null;
  sort_order: number;
};

export function PageEditor({
  page,
  defaultProducts,
  nonDefaultProducts,
  practiceSlug,
  defaultProductIds,
  doctorName,
}: {
  page: PageForEditor;
  defaultProducts: RwProduct[];
  nonDefaultProducts: RwProduct[];
  practiceSlug: string;
  defaultProductIds: string[];
  doctorName: string;
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
  const [search, setSearch] = useState("");

  const allProducts = useMemo(
    () => [...defaultProducts, ...nonDefaultProducts],
    [defaultProducts, nonDefaultProducts]
  );
  const productById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts]
  );

  const selectedEntries = useMemo(
    () =>
      Array.from(selected.entries()).sort(
        ([, a], [, b]) => a.sort_order - b.sort_order
      ),
    [selected]
  );

  function addProduct(productId: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (!next.has(productId)) {
        next.set(productId, {
          custom_instructions: null,
          sort_order: next.size,
        });
      }
      return next;
    });
    setSaveStatus("idle");
  }

  function removeProduct(productId: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(productId);
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
      } catch {}
    });
  }

  function handleRestoreDefaults() {
    const entries: [string, ProductState][] = [];
    defaultProductIds.forEach((id, i) => {
      if (productById.has(id)) {
        entries.push([id, { custom_instructions: null, sort_order: i }]);
      }
    });
    setSelected(new Map(entries));
    setSaveStatus("idle");
  }

  const query = search.trim().toLowerCase();

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/recoverbright/portal"
            className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-medium text-[#1c1a17]">
            {page.surgery_type} · Recommendation Page
          </h1>
        </div>
        <div className="mt-1 flex shrink-0 gap-2">
          <span
            className={`rounded-full px-3 py-1 font-mono text-[12px] ${
              page.show_doctor
                ? "bg-[#1c1a17]/6 text-[#1c1a17]/40"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {page.show_doctor ? `${doctorName}'s page` : "Practice page"}
          </span>
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

      {/* ── List header ────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
          Products ({selectedEntries.length})
        </p>
        {defaultProductIds.length > 0 && (
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="font-mono text-[11px] text-[#1c1a17]/35 underline underline-offset-2 hover:text-[#1c1a17] transition"
          >
            Restore defaults
          </button>
        )}
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
              <div className="flex items-center gap-3 px-4 py-3">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded object-contain"
                  />
                )}
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
                  onClick={() => removeProduct(productId)}
                  className="shrink-0 font-mono text-[13px] text-[#1c1a17]/25 hover:text-red-500 transition"
                  aria-label={`Remove ${product.name}`}
                >
                  ✕
                </button>
              </div>
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
            No products yet — browse below to add some.
          </p>
        )}
      </div>

      {/* ── Add products ──────────────────────────────────── */}
      <AddProductsSection
        defaultProducts={defaultProducts}
        nonDefaultProducts={nonDefaultProducts}
        selected={selected}
        search={search}
        query={query}
        onSearchChange={setSearch}
        onAdd={addProduct}
      />

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
          href={`/recoverbright/portal/pages/${page.id}/pdf`}
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
  customInstructions: string | null;
  onChange: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const displayText = customInstructions ?? defaultInstructions;
  const isCustomized = customInstructions !== null;

  if (!editing) {
    if (displayText) {
      return (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
            Instructions
            {!isCustomized && defaultInstructions && (
              <span className="normal-case tracking-normal text-[#1c1a17]/25">
                {" "}· default
              </span>
            )}
          </p>
          <p className="text-[13px] leading-relaxed text-[#1c1a17]/60">
            {displayText}
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17]"
          >
            Edit
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-mono text-[11px] text-[#1c1a17]/35 underline underline-offset-2 hover:text-[#1c1a17]"
      >
        Add instructions
      </button>
    );
  }

  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
        Instructions
      </p>
      <textarea
        rows={2}
        value={customInstructions ?? defaultInstructions ?? ""}
        autoFocus
        placeholder="Instructions for this product…"
        className="input resize-none"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1.5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17] transition"
        >
          Done
        </button>
        {defaultInstructions && isCustomized && customInstructions !== defaultInstructions && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setEditing(false);
            }}
            className="font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17] transition"
          >
            Reset to default
          </button>
        )}
      </div>
    </div>
  );
}

// ── AddProductsSection + CategorySection ──────────────────────────────────

function groupByCategory(products: RwProduct[]): { category: string; products: RwProduct[] }[] {
  const map = new Map<string, RwProduct[]>();
  for (const p of products) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  return Array.from(map.entries()).map(([category, products]) => ({
    category,
    products,
  }));
}

function AddProductsSection({
  defaultProducts,
  nonDefaultProducts,
  selected,
  search,
  query,
  onSearchChange,
  onAdd,
}: {
  defaultProducts: RwProduct[];
  nonDefaultProducts: RwProduct[];
  selected: Map<string, ProductState>;
  search: string;
  query: string;
  onSearchChange: (value: string) => void;
  onAdd: (productId: string) => void;
}) {
  const [othersOpen, setOthersOpen] = useState(false);

  const filteredDefaults = useMemo(
    () =>
      query
        ? defaultProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query)
          )
        : defaultProducts,
    [query, defaultProducts]
  );

  const filteredOthers = useMemo(
    () =>
      query
        ? nonDefaultProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query)
          )
        : nonDefaultProducts,
    [query, nonDefaultProducts]
  );

  const defaultGroups = useMemo(
    () => groupByCategory(filteredDefaults),
    [filteredDefaults]
  );
  const otherGroups = useMemo(
    () => groupByCategory(filteredOthers),
    [filteredOthers]
  );

  return (
    <div className="mt-8">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
        Add Products
      </p>
      <input
        type="search"
        placeholder="Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input w-full mb-3"
      />

      {/* Tier 1: defaults for this surgery type */}
      {defaultGroups.map((group) => (
        <CategorySection
          key={group.category}
          category={group.category}
          products={group.products}
          selected={selected}
          onAdd={onAdd}
          defaultOpen={true}
        />
      ))}

      {/* Tier 2: all other products */}
      {otherGroups.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOthersOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-[#e8e3da] bg-white px-4 py-3 text-left transition hover:bg-[#faf9f7]"
          >
            <span className="font-mono text-[11px] text-[#1c1a17]/50">
              All other products · {filteredOthers.length}
            </span>
            <span className="font-mono text-[12px] text-[#1c1a17]/30">
              {othersOpen ? "▾" : "▸"}
            </span>
          </button>
          {othersOpen && (
            <div className="mt-2">
              {otherGroups.map((group) => (
                <CategorySection
                  key={group.category}
                  category={group.category}
                  products={group.products}
                  selected={selected}
                  onAdd={onAdd}
                  defaultOpen={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {defaultGroups.length === 0 && filteredOthers.length === 0 && query && (
        <p className="py-4 text-center font-mono text-[12px] text-[#1c1a17]/30">
          No products found
        </p>
      )}
    </div>
  );
}

function CategorySection({
  category,
  products,
  selected,
  onAdd,
  defaultOpen,
}: {
  category: string;
  products: RwProduct[];
  selected: Map<string, ProductState>;
  onAdd: (productId: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-[#e8e3da] bg-white px-4 py-2.5 text-left transition hover:bg-[#faf9f7]"
      >
        <span className="font-mono text-[11px] text-[#1c1a17]/50">
          {category} · {products.length}
        </span>
        <span className="font-mono text-[12px] text-[#1c1a17]/30">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {products.map((product) => {
            const isSelected = selected.has(product.id);
            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 rounded-lg border border-[#e8e3da] px-4 py-2.5 ${
                  isSelected ? "bg-[#f9f7f4] opacity-50" : "bg-white"
                }`}
              >
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded object-contain"
                  />
                )}
                <p className="flex-1 min-w-0 text-[13px] text-[#1c1a17]">
                  {product.name}
                </p>
                {isSelected ? (
                  <span className="shrink-0 font-mono text-[12px] text-green-600">
                    ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAdd(product.id)}
                    className="shrink-0 font-mono text-[12px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
