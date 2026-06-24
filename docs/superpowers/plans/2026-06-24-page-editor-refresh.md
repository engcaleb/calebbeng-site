# Page Editor Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the page editor to simplify instructions editing (two states instead of three), add surgery-type-scoped category-grouped product browsing, and show default product counts on the new page picker.

**Architecture:** Add two new data-access functions to fetch default products and non-default products for a surgery type. Refactor `PageEditor.tsx` to use a two-state `InstructionsPanel` and a new `AddProductsSection` with collapsible category groups. Update the new-page picker to show product counts per surgery type.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Supabase, TypeScript, Tailwind CSS

## Global Constraints

- Follow AGENTS.md: read `node_modules/next/dist/docs/` before writing Next.js code if unsure about APIs
- Brand colors: `#f9f7f4` (background), `#1c1a17` (text), `#e8e3da` (borders)
- Font styling: `font-mono text-[Xpx]` for labels/meta, regular font for content
- No new dependencies — all changes use existing packages
- No new database tables or migrations
- Product images: omit entirely when null, never show placeholder
- `createPage` and `rw_default_products` are unchanged

---

### Task 1: Data Access — Default and Non-Default Products by Surgery Type

**Files:**
- Modify: `lib/recoverbright/products.ts` (add `getDefaultProductCounts`)
- Modify: `lib/recoverbright/portal-pages.ts` (add `getDefaultProductsForSurgeryType`, `getNonDefaultProducts`)

**Produces:**
- `getDefaultProductCounts(): Promise<Record<string, number>>` — used by Task 3 (new page picker)
- `getDefaultProductsForSurgeryType(surgeryType: string): Promise<RwProduct[]>` — used by Task 2 (editor page)
- `getNonDefaultProducts(surgeryType: string): Promise<RwProduct[]>` — used by Task 2 (editor page)

- [ ] **Step 1: Add `getDefaultProductCounts` to `products.ts`**

Add this function at the end of `lib/recoverbright/products.ts`:

```typescript
export async function getDefaultProductCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_default_products")
    .select("surgery_type");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.surgery_type] = (counts[row.surgery_type] ?? 0) + 1;
  }
  return counts;
}
```

- [ ] **Step 2: Add `getDefaultProductsForSurgeryType` to `portal-pages.ts`**

Add this function at the end of `lib/recoverbright/portal-pages.ts`:

```typescript
export async function getDefaultProductsForSurgeryType(
  surgeryType: string
): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data: defaults } = await supabase
    .from("rw_default_products")
    .select("product_id, sort_order")
    .eq("surgery_type", surgeryType)
    .order("sort_order", { ascending: true });
  if (!defaults?.length) return [];

  const ids = defaults.map((d) => d.product_id);
  const { data: products, error } = await supabase
    .from("rw_products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  if (error || !products) return [];

  // Preserve default sort order
  const orderMap = new Map(defaults.map((d) => [d.product_id, d.sort_order]));
  return products.sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );
}
```

This requires importing `RwProduct` at the top of `portal-pages.ts`:

```typescript
import type { RwProduct } from "@/lib/recoverbright/products";
```

- [ ] **Step 3: Add `getNonDefaultProducts` to `portal-pages.ts`**

Add this function below `getDefaultProductsForSurgeryType`:

```typescript
export async function getNonDefaultProducts(
  surgeryType: string
): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data: defaults } = await supabase
    .from("rw_default_products")
    .select("product_id")
    .eq("surgery_type", surgeryType);
  const excludeIds = (defaults ?? []).map((d) => d.product_id);

  let query = supabase
    .from("rw_products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
```

- [ ] **Step 4: Verify with dev server**

```bash
cd ~/Desktop/calebbeng-site && npm run dev
```

Open `http://localhost:3000/recoverbright/portal/pages/<any-page-id>/edit` — page should still load without errors (new functions aren't consumed yet).

- [ ] **Step 5: Commit**

```bash
git add lib/recoverbright/products.ts lib/recoverbright/portal-pages.ts
git commit -m "feat(recoverbright): add data access for default/non-default products by surgery type"
```

---

### Task 2: Refactor PageEditor — Instructions Panel and Product Cards

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx` — pass `defaultProducts` and `nonDefaultProducts` props
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` — refactor `InstructionsPanel`, add product thumbnails, restructure add-products section

**Consumes:**
- `getDefaultProductsForSurgeryType(surgeryType: string): Promise<RwProduct[]>` from Task 1
- `getNonDefaultProducts(surgeryType: string): Promise<RwProduct[]>` from Task 1
- Existing: `getPageForEditor`, `getDefaultProductIds`, `getActiveProducts`

- [ ] **Step 1: Update `page.tsx` to pass new props**

Replace the entire content of `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireDoctor } from "@/lib/recoverbright/auth";
import {
  getPageForEditor,
  getDefaultProductIds,
  getDefaultProductsForSurgeryType,
  getNonDefaultProducts,
} from "@/lib/recoverbright/portal-pages";
import { PageEditor } from "./PageEditor";

type Params = Promise<{ pageId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  await params;
  return { title: `Edit Page — Portal` };
}

export default async function EditPagePage({ params }: { params: Params }) {
  const { pageId } = await params;
  const doctor = await requireDoctor();

  const page = await getPageForEditor(pageId, doctor.practice_id);
  if (!page) notFound();

  const [defaultProductIds, defaultProducts, nonDefaultProducts] =
    await Promise.all([
      getDefaultProductIds(page.surgery_type),
      getDefaultProductsForSurgeryType(page.surgery_type),
      getNonDefaultProducts(page.surgery_type),
    ]);

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-3xl">
        <PageEditor
          page={page}
          defaultProducts={defaultProducts}
          nonDefaultProducts={nonDefaultProducts}
          practiceSlug={doctor.practice.slug}
          defaultProductIds={defaultProductIds}
        />
      </div>
    </main>
  );
}
```

Note: `getActiveProducts()` is no longer needed — replaced by the two scoped queries.

- [ ] **Step 2: Rewrite `PageEditor.tsx` — props, state, helpers**

Replace the entire content of `PageEditor.tsx`. This step covers the top half (imports, props, state, helper functions):

```tsx
"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { savePageProducts, togglePublish, toggleShowDoctor } from "../../actions";
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
}: {
  page: PageForEditor;
  defaultProducts: RwProduct[];
  nonDefaultProducts: RwProduct[];
  practiceSlug: string;
  defaultProductIds: string[];
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

  function handleToggleShowDoctor() {
    startShowDoctorTransition(async () => {
      try {
        await toggleShowDoctor(page.id, practiceSlug, page.surgery_type, showDoctor);
        setShowDoctor((v) => !v);
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

  // continued in Step 3...
```

- [ ] **Step 3: Rewrite `PageEditor.tsx` — JSX return (header + selected products + save bar)**

Continue the `PageEditor` function with the return statement. This is the render portion:

```tsx
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
```

- [ ] **Step 4: Add the new `InstructionsPanel` component**

Replace the old `InstructionsPanel` at the bottom of `PageEditor.tsx` with this two-state version:

```tsx
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
```

- [ ] **Step 5: Add the `AddProductsSection` component**

Add this component at the bottom of `PageEditor.tsx`, after `InstructionsPanel`:

```tsx
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
```

- [ ] **Step 6: Verify the editor works end-to-end**

```bash
cd ~/Desktop/calebbeng-site && npm run dev
```

Open `http://localhost:3000/recoverbright/portal` and navigate to edit a page. Verify:
1. Selected products show thumbnails + category + name + remove button
2. Instructions show as static text with "Edit" link; clicking "Edit" opens textarea; "Done" collapses it; "Reset to default" works
3. "Add instructions" link shows for products without any instructions
4. Add Products section shows default products grouped by category (expanded)
5. "All other products" section is collapsed; expanding it shows remaining products by category
6. Search filters both tiers
7. Adding a product moves it to the selected list; checkmark appears in browse section
8. Removing a product restores the "Add" button in browse section
9. "Restore defaults" resets the product list
10. Save works correctly

- [ ] **Step 7: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx
git commit -m "feat(recoverbright): refactor page editor with two-state instructions and category-grouped product browsing"
```

---

### Task 3: New Page Picker — Show Default Product Counts

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx`

**Consumes:**
- `getDefaultProductCounts(): Promise<Record<string, number>>` from Task 1

- [ ] **Step 1: Update `new/page.tsx` to fetch and display product counts**

Replace the entire content of `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx`:

```tsx
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getSurgeryTypes } from "@/lib/recoverbright/portal-pages";
import { getDefaultProductCounts } from "@/lib/recoverbright/products";
import { createClient } from "@/lib/supabase/server";
import { createPage } from "../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const supabase = await createClient();
  const [{ data: myPages }, surgeryTypes, productCounts] = await Promise.all([
    supabase
      .from("rw_recommendation_pages")
      .select("surgery_type")
      .eq("doctor_id", doctor.id),
    getSurgeryTypes(),
    getDefaultProductCounts(),
  ]);
  const existingTypes = new Set(
    (myPages ?? []).map((p: { surgery_type: string }) => p.surgery_type)
  );
  const available = surgeryTypes.filter((t: string) => !existingTypes.has(t));

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href="/recoverbright/portal"
            className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
          >
            ← Dashboard
          </Link>
        </div>

        <h1 className="mb-2 text-xl font-medium text-[#1c1a17]">
          New Recommendation Page
        </h1>
        <p className="mb-6 font-mono text-[13px] text-[#1c1a17]/40">
          Choose a surgery type. You can add products and publish after.
        </p>

        {available.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-8 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              You already have pages for all available surgery types.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {available.map((type) => {
              const count = productCounts[type] ?? 0;
              return (
                <form key={type} action={createPage}>
                  <input type="hidden" name="surgeryType" value={type} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[#e8e3da] bg-white px-6 py-5 text-left transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                  >
                    <span className="font-medium text-[#1c1a17]">{type}</span>
                    <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                      {count > 0
                        ? `${count} product${count === 1 ? "" : "s"}`
                        : "recovery recommendations"}
                    </span>
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the new page picker**

```bash
cd ~/Desktop/calebbeng-site && npm run dev
```

Open `http://localhost:3000/recoverbright/portal/pages/new`. Verify:
1. Each surgery type card shows the product count (e.g. "LASIK · 9 products")
2. Surgery types with no defaults show "recovery recommendations" as before
3. Clicking a card still creates the page and redirects to the editor

- [ ] **Step 3: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx
git commit -m "feat(recoverbright): show default product counts on surgery type picker"
```
