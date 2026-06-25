# Copy Page + Dual Page Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow doctors to copy a colleague's page and support both doctor-specific and practice-wide pages for the same surgery type.

**Architecture:** Add `show_doctor` to the `MyPage` type and `getPracticePages` query so the dashboard and new-page flow know each page's type. Add a `copyPage` server action. Update `createPage` to accept a `showDoctor` param. Refactor the 2-segment patient route from a redirect to a direct render for practice-wide pages. Update the editor header to show a static label instead of a toggle.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Supabase, TypeScript, Tailwind CSS

## Global Constraints

- Follow AGENTS.md: read `node_modules/next/dist/docs/` before writing Next.js code if unsure about APIs
- Brand colors: `#f9f7f4` (background), `#1c1a17` (text), `#e8e3da` (borders)
- Font styling: `font-mono text-[Xpx]` for labels/meta
- No new dependencies, no new database tables, no migrations
- `show_doctor` already exists as a boolean column (default `true`) on `rw_recommendation_pages`

---

### Task 1: Data Layer — Add `show_doctor` to `MyPage` and `getPracticePages`

**Files:**
- Modify: `lib/recoverbright/portal-pages.ts`

**Produces:**
- Updated `MyPage` type with `show_doctor: boolean` field
- `getPracticePages` returns `show_doctor` for each page
- Used by Tasks 3, 4, and 5

- [ ] **Step 1: Add `show_doctor` to the `MyPage` type**

In `lib/recoverbright/portal-pages.ts`, update the `MyPage` type:

```typescript
export type MyPage = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  show_doctor: boolean;
  product_count: number;
  doctor_name: string;
  doctor_slug: string;
};
```

- [ ] **Step 2: Update `getPracticePages` to select and return `show_doctor`**

In the `getPracticePages` function, update the `.select()` call to include `show_doctor`:

```typescript
  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, show_doctor, doctor_id, rw_page_products(id)")
    .in("doctor_id", doctors.map((d) => d.id))
    .order("created_at", { ascending: true });
```

And update the return mapping to include `show_doctor`:

```typescript
  return (data ?? []).map((p) => {
    const doc = doctorMap.get(p.doctor_id);
    return {
      id: p.id,
      surgery_type: p.surgery_type,
      is_published: p.is_published,
      show_doctor: p.show_doctor,
      product_count: Array.isArray(p.rw_page_products)
        ? p.rw_page_products.length
        : 0,
      doctor_name: doc?.name ?? "",
      doctor_slug: doc?.slug ?? "",
    };
  });
```

- [ ] **Step 3: Verify with dev server**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: clean — no type errors. The new field is additive.

- [ ] **Step 4: Commit**

```bash
git add lib/recoverbright/portal-pages.ts
git commit -m "feat(recoverbright): add show_doctor to MyPage type and getPracticePages query"
```

---

### Task 2: Server Actions — Update `createPage` and Add `copyPage`, Remove `toggleShowDoctor`

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/actions.ts`

**Produces:**
- `createPage(formData: FormData)` — now reads `showDoctor` field from formData (defaults to `"true"`)
- `copyPage(formData: FormData)` — reads `sourcePageId` and optional `asPracticeWide` from formData
- `toggleShowDoctor` — removed
- Used by Tasks 3, 4, and 5

- [ ] **Step 1: Update `createPage` to accept `showDoctor` from formData**

In `app/(recoverbright)/recoverbright/portal/(protected)/pages/actions.ts`, update the `createPage` function. After the `surgeryType` extraction, add:

```typescript
  const showDoctor = formData.get("showDoctor") !== "false";
```

And update the insert to use it:

```typescript
  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .insert({ doctor_id: doctor.id, surgery_type: surgeryType, is_published: false, show_doctor: showDoctor })
    .select("id")
    .single();
```

- [ ] **Step 2: Add `copyPage` server action**

Add this function below `createPage` in the same file:

```typescript
export async function copyPage(formData: FormData) {
  const sourcePageId = formData.get("sourcePageId") as string;
  if (!sourcePageId) throw new Error("Missing sourcePageId");
  const asPracticeWide = formData.get("asPracticeWide") === "true";

  const doctor = await requireDoctor();
  const supabase = await createClient();

  // Verify source page belongs to same practice
  const { data: practiceDocIds } = await supabase
    .from("rw_doctors")
    .select("id")
    .eq("practice_id", doctor.practice_id);
  if (!practiceDocIds?.length) throw new Error("No doctors in practice");
  const docIds = practiceDocIds.map((d) => d.id);

  const { data: sourcePage } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type")
    .eq("id", sourcePageId)
    .in("doctor_id", docIds)
    .single();
  if (!sourcePage) throw new Error("Source page not found");

  // Load source products
  const { data: sourceProducts } = await supabase
    .from("rw_page_products")
    .select("product_id, custom_instructions, sort_order")
    .eq("page_id", sourcePageId)
    .order("sort_order", { ascending: true });

  const showDoctor = !asPracticeWide;

  // Check for existing page of the same type
  let existingPageId: string | null = null;
  if (asPracticeWide) {
    // Practice-wide: check if any doctor in practice has one
    const { data: existing } = await supabase
      .from("rw_recommendation_pages")
      .select("id")
      .in("doctor_id", docIds)
      .eq("surgery_type", sourcePage.surgery_type)
      .eq("show_doctor", false)
      .limit(1)
      .single();
    existingPageId = existing?.id ?? null;
  } else {
    // Doctor-specific: check if current doctor has one
    const { data: existing } = await supabase
      .from("rw_recommendation_pages")
      .select("id")
      .eq("doctor_id", doctor.id)
      .eq("surgery_type", sourcePage.surgery_type)
      .eq("show_doctor", true)
      .limit(1)
      .single();
    existingPageId = existing?.id ?? null;
  }

  let targetPageId: string;

  if (existingPageId) {
    // Replace products on existing page
    targetPageId = existingPageId;
    const { error: deleteError } = await supabase
      .from("rw_page_products")
      .delete()
      .eq("page_id", existingPageId);
    if (deleteError) throw new Error("Failed to clear existing products");
  } else {
    // Create new page
    const { data: newPage, error: createError } = await supabase
      .from("rw_recommendation_pages")
      .insert({
        doctor_id: doctor.id,
        surgery_type: sourcePage.surgery_type,
        is_published: false,
        show_doctor: showDoctor,
      })
      .select("id")
      .single();
    if (createError || !newPage) throw new Error("Failed to create page");
    targetPageId = newPage.id;
  }

  // Insert copied products
  if (sourceProducts && sourceProducts.length > 0) {
    const { error: insertError } = await supabase
      .from("rw_page_products")
      .insert(
        sourceProducts.map((p) => ({
          page_id: targetPageId,
          product_id: p.product_id,
          custom_instructions: p.custom_instructions,
          sort_order: p.sort_order,
        }))
      );
    if (insertError) throw new Error("Failed to copy products");
  }

  revalidatePath("/recoverbright/portal");
  redirect(`/recoverbright/portal/pages/${targetPageId}/edit`);
}
```

- [ ] **Step 3: Remove `toggleShowDoctor` function**

Delete the entire `toggleShowDoctor` export from the file (lines 133-157 in the current file).

- [ ] **Step 4: Verify types compile**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: type errors in `PageEditor.tsx` referencing `toggleShowDoctor` — this is expected and will be fixed in Task 5. The actions file itself should be clean.

- [ ] **Step 5: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/pages/actions.ts
git commit -m "feat(recoverbright): add copyPage action, update createPage for showDoctor, remove toggleShowDoctor"
```

---

### Task 3: New Page Flow — Dual Options + Copy From Colleague

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx`

**Consumes:**
- `MyPage` type with `show_doctor` field (Task 1)
- `createPage(formData)` with `showDoctor` field (Task 2)
- `copyPage(formData)` with `sourcePageId` and `asPracticeWide` fields (Task 2)
- `getPracticePages(practiceId): Promise<MyPage[]>` (existing, updated in Task 1)
- `getDefaultProductCounts(): Promise<Record<string, number>>` (existing)
- `getSurgeryTypes(): Promise<string[]>` (existing)

- [ ] **Step 1: Rewrite `new/page.tsx`**

Replace the entire content of `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx`:

```tsx
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getSurgeryTypes, getPracticePages } from "@/lib/recoverbright/portal-pages";
import { getDefaultProductCounts } from "@/lib/recoverbright/products";
import { createPage, copyPage } from "../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const [surgeryTypes, productCounts, allPages] = await Promise.all([
    getSurgeryTypes(),
    getDefaultProductCounts(),
    getPracticePages(doctor.practice.id),
  ]);

  // What the current doctor already has
  const myDoctorPages = new Set(
    allPages
      .filter((p) => p.doctor_slug === doctor.slug && p.show_doctor)
      .map((p) => p.surgery_type)
  );
  // What the practice already has (practice-wide)
  const practiceWidePages = new Set(
    allPages.filter((p) => !p.show_doctor).map((p) => p.surgery_type)
  );

  // Surgery types with at least one option available
  const available = surgeryTypes.filter(
    (t) => !myDoctorPages.has(t) || !practiceWidePages.has(t)
  );

  // Other doctors' pages available for copying
  const copyablPages = allPages.filter(
    (p) => p.doctor_slug !== doctor.slug && p.show_doctor
  );

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
          Choose a surgery type and page type.
        </p>

        {available.length === 0 && copyablPages.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-8 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              You already have pages for all available surgery types.
            </p>
          </div>
        ) : (
          <>
            {/* Surgery type picker with dual options */}
            {available.length > 0 && (
              <div className="space-y-2">
                {available.map((type) => {
                  const count = productCounts[type] ?? 0;
                  const canDoctor = !myDoctorPages.has(type);
                  const canPractice = !practiceWidePages.has(type);
                  return (
                    <div
                      key={type}
                      className="rounded-xl border border-[#e8e3da] bg-white px-6 py-5"
                    >
                      <p className="font-medium text-[#1c1a17]">
                        {type}
                        {count > 0 && (
                          <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                            {count} product{count === 1 ? "" : "s"}
                          </span>
                        )}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {canDoctor && (
                          <form action={createPage}>
                            <input type="hidden" name="surgeryType" value={type} />
                            <input type="hidden" name="showDoctor" value="true" />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              My page
                            </button>
                          </form>
                        )}
                        {canPractice && (
                          <form action={createPage}>
                            <input type="hidden" name="surgeryType" value={type} />
                            <input type="hidden" name="showDoctor" value="false" />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              Practice page
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Copy from colleague */}
            {copyablPages.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
                  Or copy from a colleague
                </p>
                <div className="space-y-2">
                  {copyablPages.map((page) => {
                    const hasMyVersion = myDoctorPages.has(page.surgery_type);
                    const hasPracticeVersion = practiceWidePages.has(page.surgery_type);
                    return (
                      <div
                        key={page.id}
                        className="rounded-xl border border-[#e8e3da] bg-white px-6 py-4"
                      >
                        <p className="text-[14px] font-medium text-[#1c1a17]">
                          {page.surgery_type}
                          <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                            {page.doctor_name} · {page.product_count}{" "}
                            {page.product_count === 1 ? "product" : "products"}
                          </span>
                        </p>
                        <div className="mt-3 flex gap-2">
                          <form action={copyPage}>
                            <input type="hidden" name="sourcePageId" value={page.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              {hasMyVersion
                                ? `Copy · replaces your ${page.surgery_type} page`
                                : "Copy as my page"}
                            </button>
                          </form>
                          {!hasPracticeVersion && (
                            <form action={copyPage}>
                              <input type="hidden" name="sourcePageId" value={page.id} />
                              <input type="hidden" name="asPracticeWide" value="true" />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                              >
                                Copy as practice page
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

May still have errors from `PageEditor.tsx` referencing removed `toggleShowDoctor` — that's expected and fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx
git commit -m "feat(recoverbright): new page flow with dual page type options and copy from colleague"
```

---

### Task 4: Dashboard — Type Badges, Copy Buttons, Practice-Wide URLs

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/page.tsx`

**Consumes:**
- `MyPage` type with `show_doctor` field (Task 1)
- `copyPage(formData)` (Task 2)
- `surgeryTypeToUrlSegment(surgeryType: string): string` (existing in `lib/recoverbright/pages.ts`)

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire content of `app/(recoverbright)/recoverbright/portal/(protected)/page.tsx`:

```tsx
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getPracticePages } from "@/lib/recoverbright/portal-pages";
import { surgeryTypeToUrlSegment } from "@/lib/recoverbright/pages";
import { logoutAction } from "../login/actions";
import { copyPage } from "./pages/actions";
import { OnboardingChecklist } from "./OnboardingChecklist";
import Link from "next/link";

export default async function PortalPage() {
  const doctor = await requireDoctor();
  const pages = await getPracticePages(doctor.practice.id);

  const myPages = pages.filter(
    (p) => p.doctor_slug === doctor.slug || !p.show_doctor
  );
  const hasLogo = !!doctor.practice.logo_url;
  const hasPage = myPages.length > 0;
  const hasPublishedPage = myPages.some((p) => p.is_published);

  const firstPublishedPage = myPages.find((p) => p.is_published);
  const shareUrl = firstPublishedPage
    ? firstPublishedPage.show_doctor
      ? `/dr/${doctor.practice.slug}/${doctor.slug}/${surgeryTypeToUrlSegment(firstPublishedPage.surgery_type)}`
      : `/dr/${doctor.practice.slug}/${surgeryTypeToUrlSegment(firstPublishedPage.surgery_type)}`
    : null;

  const onboardingSteps = [
    {
      label: "Upload your practice logo",
      description: "Appears on patient pages and PDFs",
      href: "/recoverbright/portal/settings",
      done: hasLogo,
    },
    {
      label: "Create your first page",
      description: "Pick a surgery type and customize products",
      href: "/recoverbright/portal/pages/new",
      done: hasPage,
    },
    {
      label: "Preview your page",
      description: "See what patients will see",
      href: firstPublishedPage
        ? `/recoverbright${shareUrl}`
        : "/recoverbright/portal/pages/new",
      done: hasPublishedPage,
    },
    {
      label: "Share with patients",
      description: "Copy link or download PDF",
      href: firstPublishedPage
        ? `/recoverbright/portal/pages/${firstPublishedPage.id}/edit`
        : "/recoverbright/portal/pages/new",
      done: hasPublishedPage,
    },
  ];

  const showOnboarding =
    !doctor.onboarding_dismissed &&
    onboardingSteps.some((s) => !s.done);

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
            <Link href="/recoverbright/portal/pages/new" className="btn-primary">
              New Page
            </Link>
            <Link href="/recoverbright/portal/settings" className="btn-ghost">
              Settings
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Onboarding checklist */}
        {showOnboarding && <OnboardingChecklist steps={onboardingSteps} />}

        {/* Page list */}
        {pages.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-12 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              No recommendation pages yet.
            </p>
            <Link
              href="/recoverbright/portal/pages/new"
              className="mt-4 inline-block btn-primary"
            >
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => {
              const segment = surgeryTypeToUrlSegment(page.surgery_type);
              const patientPath = page.show_doctor
                ? `/dr/${doctor.practice.slug}/${page.doctor_slug}/${segment}`
                : `/dr/${doctor.practice.slug}/${segment}`;
              const isOtherDoctor =
                page.doctor_slug !== doctor.slug && page.show_doctor;
              return (
                <div
                  key={page.id}
                  className="rounded-xl border border-[#e8e3da] bg-white px-6 py-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-[#1c1a17]">
                          {page.surgery_type}
                        </p>
                        <p className="mt-0.5 font-mono text-[12px] text-[#1c1a17]/40">
                          {page.product_count}{" "}
                          {page.product_count === 1 ? "product" : "products"}
                        </p>
                      </div>
                      {page.show_doctor ? (
                        <span className="rounded-full bg-[#1c1a17]/6 px-2.5 py-0.5 font-mono text-[11px] text-[#1c1a17]/40">
                          {page.doctor_name}
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] text-blue-700">
                          Practice
                        </span>
                      )}
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
                      {page.is_published && (
                        <Link
                          href={`/recoverbright${patientPath}`}
                          target="_blank"
                          className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                        >
                          View
                        </Link>
                      )}
                      <a
                        href={`/recoverbright/portal/pages/${page.id}/pdf`}
                        download
                        className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                      >
                        PDF
                      </a>
                      <Link
                        href={`/recoverbright/portal/pages/${page.id}/edit`}
                        className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                      >
                        Edit
                      </Link>
                      {isOtherDoctor && (
                        <form action={copyPage}>
                          <input type="hidden" name="sourcePageId" value={page.id} />
                          <button
                            type="submit"
                            className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                          >
                            Copy
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                  {page.is_published && (
                    <p className="mt-2 font-mono text-[11px] text-[#1c1a17]/30">
                      recoverbright.com{patientPath}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/page.tsx
git commit -m "feat(recoverbright): dashboard with type badges, practice-wide URLs, and copy buttons"
```

---

### Task 5: Editor Header — Static Label Instead of Toggle

**Files:**
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx`
- Modify: `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx`

**Consumes:**
- `PageForEditor` type (existing, already has `show_doctor: boolean`)

- [ ] **Step 1: Update `page.tsx` to pass `doctorName` to the editor**

In `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx`, add `doctorName` to the `PageEditor` props:

```tsx
        <PageEditor
          page={page}
          defaultProducts={defaultProducts}
          nonDefaultProducts={nonDefaultProducts}
          practiceSlug={doctor.practice.slug}
          defaultProductIds={defaultProductIds}
          doctorName={doctor.name}
        />
```

- [ ] **Step 2: Update `PageEditor.tsx` — remove toggle, add static label**

In `PageEditor.tsx`, make these changes:

**Add `doctorName` to props:**

Update the function signature and props type to include `doctorName: string`:

```tsx
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
```

**Remove the `showDoctor` state and `handleToggleShowDoctor` function and `isShowDoctorPending` transition:**

Delete these lines:
```tsx
  const [showDoctor, setShowDoctor] = useState(page.show_doctor);
  const [isShowDoctorPending, startShowDoctorTransition] = useTransition();
```

Delete the entire `handleToggleShowDoctor` function.

**Remove the `toggleShowDoctor` import:**

Update the import to remove `toggleShowDoctor`:

```tsx
import { savePageProducts, togglePublish } from "../../actions";
```

**Replace the toggle button in the header with a static label:**

Replace this block:

```tsx
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
```

With this static label:

```tsx
          <span
            className={`rounded-full px-3 py-1 font-mono text-[12px] ${
              page.show_doctor
                ? "bg-[#1c1a17]/6 text-[#1c1a17]/40"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {page.show_doctor ? `${doctorName}'s page` : "Practice page"}
          </span>
```

- [ ] **Step 3: Verify the full project compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: clean — all references to `toggleShowDoctor` are now gone.

- [ ] **Step 4: Commit**

```bash
git add app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx
git commit -m "feat(recoverbright): replace show_doctor toggle with static label in editor header"
```

---

### Task 6: Practice-Wide Patient Route — Serve Instead of Redirect

**Files:**
- Modify: `app/(recoverbright)/recoverbright/dr/[slug]/[surgery-type]/page.tsx`
- Modify: `lib/recoverbright/pages.ts` (add `getPublishedPracticePage`)

**Consumes:**
- `PublishedPage` type (existing in `lib/recoverbright/pages.ts`)
- `urlToSurgeryType(segment: string): string` (existing)

**Produces:**
- `getPublishedPracticePage(practiceSlug: string, surgeryTypeSegment: string): Promise<PublishedPage | null>`

- [ ] **Step 1: Add `getPublishedPracticePage` to `lib/recoverbright/pages.ts`**

Add this function at the end of `lib/recoverbright/pages.ts`:

```typescript
export async function getPublishedPracticePage(
  practiceSlug: string,
  surgeryTypeSegment: string
): Promise<PublishedPage | null> {
  const supabase = await createClient();
  const surgeryType = urlToSurgeryType(surgeryTypeSegment);

  const { data: practice, error: practiceErr } = await supabase
    .from("rw_practices")
    .select("id, name, slug, logo_url")
    .eq("slug", practiceSlug)
    .single();
  if (practiceErr || !practice) return null;

  // Find all doctors in the practice
  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", practice.id);
  if (!doctors?.length) return null;

  // Find published practice-wide page
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id, doctor_id, surgery_type, show_doctor")
    .in("doctor_id", doctors.map((d) => d.id))
    .eq("surgery_type", surgeryType)
    .eq("is_published", true)
    .eq("show_doctor", false)
    .limit(1)
    .single();
  if (!page) return null;

  const pageDoctor = doctors.find((d) => d.id === page.doctor_id)!;

  // Load page products with product details
  const { data: rows } = await supabase
    .from("rw_page_products")
    .select(
      `id, sort_order, custom_instructions,
       rw_products ( id, name, slug, category, image_url, default_instructions, buy_url )`
    )
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  type ProductRow = {
    id: string; name: string; slug: string; category: string;
    image_url: string | null; default_instructions: string | null; buy_url: string | null;
  };

  const products: PageProduct[] = (rows ?? [])
    .filter((r) => r.rw_products)
    .map((r) => {
      const raw = r.rw_products as unknown;
      const p = (Array.isArray(raw) ? raw[0] : raw) as ProductRow;
      return {
        page_product_id: r.id,
        sort_order: r.sort_order,
        instructions: r.custom_instructions ?? p.default_instructions,
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        buy_url: p.buy_url,
      };
    });

  return {
    id: page.id,
    surgery_type: page.surgery_type,
    practice,
    doctor_name: pageDoctor.name,
    doctor_slug: pageDoctor.slug,
    show_doctor: false,
    products,
  };
}
```

- [ ] **Step 2: Rewrite the 2-segment route to serve practice-wide pages**

Replace the entire content of `app/(recoverbright)/recoverbright/dr/[slug]/[surgery-type]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublishedPracticePage } from "@/lib/recoverbright/pages";
import type { Metadata } from "next";

type Params = Promise<{ slug: string; "surgery-type": string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPracticePage(slug, surgerySegment);
  if (!page) return { title: "Not Found" };
  return {
    title: `${page.surgery_type} Recovery — ${page.practice.name}`,
    description: `${page.surgery_type} recovery recommendations from ${page.practice.name}.`,
  };
}

export default async function PracticeWidePage({ params }: { params: Params }) {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPracticePage(slug, surgerySegment);
  if (!page) notFound();

  const { practice, surgery_type, products } = page;

  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[#1c1a17]/8 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <div className="flex items-center gap-4">
            {practice.logo_url && (
              <Image
                src={practice.logo_url}
                alt={`${practice.name} logo`}
                width={96}
                height={96}
                className="rounded-xl object-contain"
              />
            )}
            <div>
              <p className="font-medium text-[#1c1a17]">{practice.name}</p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[#1c1a17]/35">
                {surgery_type} Surgery · Recovery Guide
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#1c1a17]">
            Your {surgery_type} Recovery Guide
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1c1a17]/35">
              {category}
            </p>
            <div className="space-y-3">
              {items.map((product) => (
                <div
                  key={product.page_product_id}
                  className="flex gap-4 rounded-[9px] border border-[#1c1a17]/8 bg-white p-4 sm:p-5"
                >
                  {product.image_url && (
                    <div className="shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="rounded-[7px] object-contain"
                      />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
                        {product.category}
                      </p>
                      <p className="text-[15px] font-medium text-[#1c1a17]">
                        {product.name}
                      </p>
                    </div>
                    {product.instructions && (
                      <p className="text-[13px] leading-relaxed text-[#1c1a17]/55 line-clamp-2 sm:line-clamp-none">
                        {product.instructions}
                      </p>
                    )}
                    {product.buy_url && (
                      <a
                        href={product.buy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block w-fit rounded-full bg-[#1c1a17] px-5 py-1.5 font-mono text-[12px] text-white transition hover:bg-[#1c1a17]/80"
                      >
                        Buy Now
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer className="border-t border-[#1c1a17]/8 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6 text-center">
          <p className="font-mono text-[11px] leading-relaxed text-[#1c1a17]/30">
            Not a substitute for medical advice · Follow your doctor&apos;s
            instructions · Recover Bright
          </p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Verify everything compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Start the dev server and verify end-to-end**

```bash
cd ~/Desktop/calebbeng-site && npm run dev
```

Verify:
1. Dashboard shows type badges ("Practice" blue badge or doctor name gray badge)
2. Dashboard shows "Copy" button on other doctors' pages
3. New page flow shows "My page" and "Practice page" buttons per surgery type
4. New page flow shows "Copy from a colleague" section with other doctors' pages
5. Editor header shows static label instead of toggle
6. Creating a practice-wide page works — URL uses 2-segment format
7. Practice-wide patient page renders at `/dr/[practice-slug]/[surgery-type]` with no doctor attribution

- [ ] **Step 5: Commit**

```bash
git add app/(recoverbright)/recoverbright/dr/[slug]/[surgery-type]/page.tsx lib/recoverbright/pages.ts
git commit -m "feat(recoverbright): serve practice-wide patient pages at 2-segment URL"
```
