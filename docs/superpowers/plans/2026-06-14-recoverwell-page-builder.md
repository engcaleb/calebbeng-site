# RecoverWell Page Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a doctor portal page builder so doctors can create, edit, and publish surgery-type recommendation pages by selecting products from the admin catalog and optionally customizing per-product instructions.

**Architecture:** Six tasks, bottom-up: data layer → server actions → dashboard update → new-page route → editor shell (server) → PageEditor (client). No test framework exists in this project — verification is manual browser + Supabase dashboard checks after each task. All writes go through the cookie-based server Supabase client; RLS doctor policies handle authorization automatically. Server actions do a secondary ownership check before any write.

**Tech Stack:** Next.js 16 App Router (server components + server actions), Supabase Postgres, React `useState`/`useTransition` for client state, Tailwind CSS utility classes defined in `app/globals.css` (`.label`, `.input`, `.btn-primary`, `.btn-ghost`).

> ⚠️ **Before writing any code:** this repo's AGENTS.md warns that Next.js 16 has breaking changes. Check `node_modules/next/dist/docs/01-app/` (specifically routing and server actions docs) before writing any Next.js-specific code. Key known differences: `params` and `searchParams` are Promises — always `await` them.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/recoverwell/portal-pages.ts` | **Create** | Types + data fetching for portal (getMyPages, getPageForEditor) |
| `lib/recoverwell/pages.ts` | **Modify** | Add `surgeryTypeToUrlSegment` reverse-lookup utility |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts` | **Create** | Server actions: createPage, savePageProducts, togglePublish |
| `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | **Modify** | Dashboard: replace placeholder with real page list |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/new/page.tsx` | **Create** | Surgery type picker → triggers createPage |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/page.tsx` | **Create** | Editor shell (server component): loads data, passes to PageEditor |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` | **Create** | Client component: all interactive state, checkbox list, instructions panel, save/publish |

---

## Task 1: Data layer

**Files:**
- Create: `lib/recoverwell/portal-pages.ts`
- Modify: `lib/recoverwell/pages.ts`

- [ ] **Step 1: Create `lib/recoverwell/portal-pages.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";

export const SURGERY_TYPES = [
  "LASIK",
  "Cataract",
  "Dry Eye",
  "Retinal",
  "Corneal",
] as const;

export type MyPage = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  product_count: number;
};

export type PageProductForEditor = {
  product_id: string;
  custom_instructions: string | null;
  sort_order: number;
};

export type PageForEditor = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  doctor_id: string;
  page_products: PageProductForEditor[];
};

export async function getMyPages(doctorId: string): Promise<MyPage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, rw_page_products(id)")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    surgery_type: p.surgery_type,
    is_published: p.is_published,
    product_count: Array.isArray(p.rw_page_products)
      ? p.rw_page_products.length
      : 0,
  }));
}

export async function getPageForEditor(
  pageId: string,
  doctorId: string
): Promise<PageForEditor | null> {
  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, doctor_id")
    .eq("id", pageId)
    .eq("doctor_id", doctorId)
    .single();
  if (error || !page) return null;

  const { data: pageProducts } = await supabase
    .from("rw_page_products")
    .select("product_id, custom_instructions, sort_order")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  return {
    ...page,
    page_products: pageProducts ?? [],
  };
}
```

- [ ] **Step 2: Add `surgeryTypeToUrlSegment` to `lib/recoverwell/pages.ts`**

Add this function at the bottom of `lib/recoverwell/pages.ts` (after the existing `urlToSurgeryType`):

```typescript
export function surgeryTypeToUrlSegment(surgeryType: string): string {
  const map: Record<string, string> = {
    LASIK: "lasik",
    Cataract: "cataract",
    "Dry Eye": "dry-eye",
    Retinal: "retinal",
    Corneal: "corneal",
  };
  return map[surgeryType] ?? surgeryType.toLowerCase().replace(/\s+/g, "-");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: no errors related to the new files.

- [ ] **Step 4: Commit**

```bash
git add lib/recoverwell/portal-pages.ts lib/recoverwell/pages.ts
git commit -m "feat(rw): add portal-pages data layer and surgeryTypeToUrlSegment"
```

---

## Task 2: Server actions

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts`

- [ ] **Step 1: Create the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { createClient } from "@/lib/supabase/server";
import { surgeryTypeToUrlSegment } from "@/lib/recoverwell/pages";

// Called from a <form action={createPage}> — receives FormData
export async function createPage(formData: FormData) {
  const surgeryType = formData.get("surgeryType") as string;
  if (!surgeryType) throw new Error("Missing surgeryType");

  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .insert({ doctor_id: doctor.id, surgery_type: surgeryType, is_published: false })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create page");

  redirect(`/recoverwell/portal/pages/${data.id}/edit`);
}

type SaveProduct = {
  product_id: string;
  custom_instructions: string | null;
  sort_order: number;
};

// Called from PageEditor client component via useTransition
export async function savePageProducts(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  products: SaveProduct[]
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  // Ownership check
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id")
    .eq("id", pageId)
    .eq("doctor_id", doctor.id)
    .single();
  if (!page) throw new Error("Page not found");

  // Replace all page products atomically
  await supabase.from("rw_page_products").delete().eq("page_id", pageId);

  if (products.length > 0) {
    const { error } = await supabase.from("rw_page_products").insert(
      products.map((p) => ({
        page_id: pageId,
        product_id: p.product_id,
        custom_instructions: p.custom_instructions,
        sort_order: p.sort_order,
      }))
    );
    if (error) throw new Error("Failed to save products");
  }

  revalidatePath(
    `/recoverwell/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
}

// Called from PageEditor client component via useTransition
export async function togglePublish(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  currentIsPublished: boolean
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("rw_recommendation_pages")
    .update({ is_published: !currentIsPublished })
    .eq("id", pageId)
    .eq("doctor_id", doctor.id);

  if (error) throw new Error("Failed to update publish status");

  revalidatePath(
    `/recoverwell/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
  revalidatePath("/recoverwell/portal");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts"
git commit -m "feat(rw): add page builder server actions (createPage, savePageProducts, togglePublish)"
```

---

## Task 3: Update dashboard

**Files:**
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx`

- [ ] **Step 1: Replace the existing dashboard page**

Replace the entire file content with:

```tsx
import { requireDoctor } from "@/lib/recoverwell/auth";
import { getMyPages } from "@/lib/recoverwell/portal-pages";
import { logoutAction } from "../login/actions";
import Link from "next/link";

export default async function PortalPage() {
  const doctor = await requireDoctor();
  const pages = await getMyPages(doctor.id);

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-semibold text-[#1c1a17]">
              Welcome, {doctor.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#1c1a17]/50">
              {doctor.practice.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/recoverwell/portal/pages/new" className="btn-primary">
              New Page
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Page list */}
        {pages.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-12 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              No recommendation pages yet.
            </p>
            <Link
              href="/recoverwell/portal/pages/new"
              className="mt-4 inline-block btn-primary"
            >
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded-xl border border-[#e8e3da] bg-white px-6 py-5"
              >
                <div>
                  <p className="font-medium text-[#1c1a17]">
                    {page.surgery_type}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] text-[#1c1a17]/40">
                    {page.product_count}{" "}
                    {page.product_count === 1 ? "product" : "products"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
                      page.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-[#1c1a17]/6 text-[#1c1a17]/40"
                    }`}
                  >
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`/recoverwell/portal/pages/${page.id}/edit`}
                    className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Start dev server and verify dashboard**

```bash
npm run dev
```

Open `http://localhost:3000/recoverwell/portal` (or via the `recoverwell.calebbeng.com` rewrite if testing locally against the hostname). Log in as Dr. Sarah Chen.

Expected:
- Dashboard shows existing LASIK and Cataract pages with product counts and "Published" badges.
- "New Page" button is visible in the header.
- "Edit" link appears on each card.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/page.tsx"
git commit -m "feat(rw): update portal dashboard to list recommendation pages"
```

---

## Task 4: New page route

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/pages/new/page.tsx`

- [ ] **Step 1: Create the new page route**

```tsx
import { requireDoctor } from "@/lib/recoverwell/auth";
import { getMyPages, SURGERY_TYPES } from "@/lib/recoverwell/portal-pages";
import { createPage } from "../../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const existing = await getMyPages(doctor.id);
  const existingTypes = new Set(existing.map((p) => p.surgery_type));
  const available = SURGERY_TYPES.filter((t) => !existingTypes.has(t));

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href="/recoverwell/portal"
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
            {available.map((type) => (
              <form key={type} action={createPage}>
                <input type="hidden" name="surgeryType" value={type} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-[#e8e3da] bg-white px-6 py-5 text-left transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                >
                  <span className="font-medium text-[#1c1a17]">{type}</span>
                  <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                    recovery recommendations
                  </span>
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/recoverwell/portal/pages/new`.

Expected:
- "LASIK" and "Cataract" are NOT shown (already exist for Dr. Sarah Chen).
- "Dry Eye", "Retinal", "Corneal" are shown as clickable buttons.
- Clicking "Dry Eye" creates a new draft page and redirects to its editor URL (even though the editor shell doesn't exist yet — a 404 is expected here; confirm the redirect URL looks like `/recoverwell/portal/pages/[uuid]/edit`).
- Verify in Supabase dashboard → Table Editor → `rw_recommendation_pages` that a new row was inserted with `surgery_type = 'Dry Eye'` and `is_published = false`.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/pages/new/page.tsx"
git commit -m "feat(rw): add new page surgery-type picker"
```

---

## Task 5: Editor shell (server component)

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/page.tsx`

- [ ] **Step 1: Create the editor shell**

```tsx
import { notFound } from "next/navigation";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { getPageForEditor } from "@/lib/recoverwell/portal-pages";
import { getActiveProducts } from "@/lib/recoverwell/products";
import { PageEditor } from "./PageEditor";

type Params = Promise<{ pageId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { pageId } = await params;
  return { title: `Edit Page — Portal` };
}

export default async function EditPagePage({ params }: { params: Params }) {
  const { pageId } = await params;

  const [doctor, allProducts] = await Promise.all([
    requireDoctor(),
    getActiveProducts(),
  ]);

  const page = await getPageForEditor(pageId, doctor.id);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-3xl">
        <PageEditor
          page={page}
          allProducts={allProducts}
          practiceSlug={doctor.practice.slug}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify shell renders (before PageEditor exists)**

`PageEditor` doesn't exist yet so TypeScript will error. That's expected — don't start the dev server until Task 6 is done. Just confirm the file is saved correctly.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/page.tsx"
git commit -m "feat(rw): add editor shell server component"
```

---

## Task 6: PageEditor client component

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx`

- [ ] **Step 1: Create `PageEditor.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { savePageProducts, togglePublish } from "./actions";
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
            // Save null (use default) if empty string or identical to default
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify full flow in browser**

Start dev server if not running: `npm run dev`

**A — Empty page (new Dry Eye page created in Task 4):**
- Navigate to the Dry Eye page edit URL (find the UUID in Supabase `rw_recommendation_pages`).
- All products are unchecked. No instructions panels are visible.

**B — Check a product:**
- Check "PRN De3 Omega-3" (or any product with `default_instructions`).
- Product expands showing "Default instructions · set by admin" block with the admin text.
- "Customize" button is visible.

**C — Customize instructions:**
- Click "Customize" on a checked product.
- An empty textarea appears with "Your instructions…" placeholder.
- Admin default is shown below in a grey reference box with a "Reset to default" link.
- Type something in the textarea.

**D — Reset to default:**
- Click "Reset to default".
- Textarea disappears; admin default block reappears.

**E — Product with no default:**
- Check a product where `default_instructions` is null.
- An optional textarea appears directly (no "Customize" button needed).

**F — Save:**
- Check 3 products, customize one instruction, leave one as default, leave one empty (no default).
- Click "Save".
- Button shows "Saving…" then "Saved" appears.
- In Supabase Table Editor → `rw_page_products`: verify 3 rows exist for this page.
- The customized product has `custom_instructions` set; the default-left product has `custom_instructions = null`.

**G — Reload:**
- Reload the editor page.
- Checked products are still checked with their saved state.
- The customized product shows the textarea with the custom text.
- The default product shows the admin default block.

**H — Publish:**
- Click "Draft · Publish" button.
- Badge flips to green "Published".
- In Supabase: `is_published` is now `true` for this page.
- Navigate to the patient page URL (e.g., `/dr/prestige-vision-center/dry-eye`) — page should render with the saved products.

**I — Unpublish:**
- Click "Published" badge.
- Flips back to "Draft · Publish".

**J — Existing LASIK page:**
- Navigate to edit the existing LASIK page.
- Pre-seeded products are already checked with their sort order preserved.
- Default instructions show correctly for each.

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx"
git commit -m "feat(rw): add PageEditor client component — checkbox list, instructions panel, save/publish"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec requirements covered — dashboard, new page route, editor (checkbox list, instructions panel with all 3 states, save, publish/unpublish).
- [x] **No placeholders:** All code is complete and runnable. No TBDs.
- [x] **Type consistency:** `PageForEditor`, `PageProductForEditor`, `MyPage` defined in Task 1 and used consistently in Tasks 2, 5, and 6. `RwProduct` imported from existing `lib/recoverwell/products.ts`. `savePageProducts` parameter type `SaveProduct[]` is defined inline in the actions file where it's used.
- [x] **save null semantics:** `custom_instructions === "" ? null : custom_instructions` applied on save. `InstructionsPanel` uses `null` to mean "show default" and `string` (including `""`) to mean "entering custom mode". These are consistent.
- [x] **Ownership check:** Both `savePageProducts` and `togglePublish` query `.eq("doctor_id", doctor.id)` before writing. `getPageForEditor` also scopes by `doctorId` so the shell returns 404 for wrong-owner access.
- [x] **revalidatePath:** Called in both `savePageProducts` and `togglePublish` for the patient-facing URL. `togglePublish` also revalidates `/recoverwell/portal` so the dashboard badge updates.
- [x] **No drag-to-reorder UI:** sort_order is re-numbered at save time (check order), per spec scope decision.
