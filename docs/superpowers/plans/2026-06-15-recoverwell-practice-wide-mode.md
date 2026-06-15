# Practice-Wide Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-page toggle that lets a doctor hide their name from the patient-facing recommendation page, making it appear as a practice-level page rather than a personally attributed one.

**Architecture:** A `show_doctor boolean NOT NULL DEFAULT true` column is added to `rw_recommendation_pages`. The data layer surfaces it through both the portal types and the patient-page query. A new `toggleShowDoctor` server action (mirroring the existing `togglePublish`) lets the doctor flip the flag from the page editor. The patient page wraps the attribution row in a conditional.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS), React Server Components, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-06-15-recoverwell-practice-wide-mode-design.md`

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260615000000_rw_add_show_doctor.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260615000000_rw_add_show_doctor.sql` with this content:

```sql
-- Add show_doctor flag to recommendation pages.
-- DEFAULT true preserves existing behavior for all current rows.
ALTER TABLE rw_recommendation_pages
  ADD COLUMN show_doctor boolean NOT NULL DEFAULT true;
```

- [ ] **Step 2: Apply the migration**

```bash
cd ~/Desktop/calebbeng-site && supabase db push
```

Expected output ends with something like:
```
Applying migration 20260615000000_rw_add_show_doctor.sql...
Finished supabase db push.
```

If it prints "Remote database already up to date" the column already exists — check with:
```bash
supabase db diff
```

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/calebbeng-site && git add supabase/migrations/20260615000000_rw_add_show_doctor.sql && git commit -m "$(cat <<'EOF'
feat(db): add show_doctor column to rw_recommendation_pages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Data layer — types and queries

**Files:**
- Modify: `lib/recoverwell/portal-pages.ts`
- Modify: `lib/recoverwell/pages.ts`

- [ ] **Step 1: Add `show_doctor` to `PageForEditor` in `portal-pages.ts`**

In `lib/recoverwell/portal-pages.ts`, find the `PageForEditor` type (line 24) and add `show_doctor`:

```ts
export type PageForEditor = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  doctor_id: string;
  show_doctor: boolean;
  page_products: PageProductForEditor[];
};
```

- [ ] **Step 2: Update the `getPageForEditor` query to select `show_doctor`**

In `lib/recoverwell/portal-pages.ts`, find `getPageForEditor` (line 66). Change the `.select(...)` string from:

```ts
.select("id, surgery_type, is_published, doctor_id")
```

to:

```ts
.select("id, surgery_type, is_published, doctor_id, show_doctor")
```

The `return { ...page, page_products: pageProducts ?? [] }` spread already picks up the new column automatically — no other change needed in this function.

- [ ] **Step 3: Add `show_doctor` to `PublishedPage` in `pages.ts`**

In `lib/recoverwell/pages.ts`, find the `PublishedPage` type (line 22) and add `show_doctor`:

```ts
export type PublishedPage = {
  id: string;
  surgery_type: string;
  practice: Practice;
  doctor_name: string;
  show_doctor: boolean;
  products: PageProduct[];
};
```

- [ ] **Step 4: Update the `getPublishedPage` query to select and return `show_doctor`**

In `lib/recoverwell/pages.ts`, find the `getPublishedPage` function. Change the `.select(...)` on `rw_recommendation_pages` (line 87) from:

```ts
.select("id, doctor_id, surgery_type")
```

to:

```ts
.select("id, doctor_id, surgery_type, show_doctor")
```

Then find the `return` statement at the bottom of the function and add `show_doctor`:

```ts
return {
  id: page.id,
  surgery_type: page.surgery_type,
  practice,
  doctor_name: doctor.name,
  show_doctor: page.show_doctor,
  products,
};
```

- [ ] **Step 5: Verify the build passes (TypeScript will catch type errors)**

```bash
cd ~/Desktop/calebbeng-site && npx next build 2>&1 | tail -20
```

Expected: clean build. If TypeScript complains about `show_doctor` not existing on the Supabase response type, the migration in Task 1 may not have been applied — confirm with `supabase db diff`.

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/calebbeng-site && git add lib/recoverwell/portal-pages.ts lib/recoverwell/pages.ts && git commit -m "$(cat <<'EOF'
feat(data): surface show_doctor in PublishedPage and PageForEditor types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `toggleShowDoctor` server action

**Files:**
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts`

- [ ] **Step 1: Add `toggleShowDoctor` to `actions.ts`**

Open `app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts`. Append this function after the existing `togglePublish` function at the bottom of the file:

```ts
// Called from PageEditor client component via useTransition
export async function toggleShowDoctor(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  currentShowDoctor: boolean
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("rw_recommendation_pages")
    .update({ show_doctor: !currentShowDoctor })
    .eq("id", pageId)
    .eq("doctor_id", doctor.id);

  if (error) throw new Error("Failed to update show_doctor");

  revalidatePath(
    `/recoverwell/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
}
```

Note: All imports (`revalidatePath`, `requireDoctor`, `createClient`, `surgeryTypeToUrlSegment`) are already at the top of this file — do not add duplicates.

- [ ] **Step 2: Verify build**

```bash
cd ~/Desktop/calebbeng-site && npx next build 2>&1 | tail -10
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/calebbeng-site && git add app/\(recoverwell\)/recoverwell/portal/\(protected\)/pages/actions.ts && git commit -m "$(cat <<'EOF'
feat(portal): add toggleShowDoctor server action

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Portal UI — practice-wide toggle in `PageEditor`

**Files:**
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx`

- [ ] **Step 1: Import `toggleShowDoctor`**

At the top of `PageEditor.tsx`, find the existing import from `../../actions`:

```ts
import { savePageProducts, togglePublish } from "../../actions";
```

Add `toggleShowDoctor` to it:

```ts
import { savePageProducts, togglePublish, toggleShowDoctor } from "../../actions";
```

- [ ] **Step 2: Add `show_doctor` to the `PageForEditor` prop shape**

The `PageEditor` component receives `page: PageForEditor`. Since `PageForEditor` now includes `show_doctor: boolean` (updated in Task 2), TypeScript will already expect it. No prop type change needed — it's inferred from the imported type.

- [ ] **Step 3: Add state and transition for `showDoctor`**

Inside the `PageEditor` function, find the existing state declarations (lines 23–40). Add two new lines after the `published` state:

```ts
const [showDoctor, setShowDoctor] = useState(page.show_doctor);
const [isShowDoctorPending, startShowDoctorTransition] = useTransition();
```

- [ ] **Step 4: Add the handler function**

Inside `PageEditor`, after the existing `handleTogglePublish` function (around line 101–115), add:

```ts
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
```

- [ ] **Step 5: Add the toggle button to the header**

In the JSX, find the header section (around line 120–143). It currently contains the `← Dashboard` link, the `h1`, and the Publish pill button. Add the practice-wide toggle button **between the h1 div and the Publish button**, so the right side of the header has both pills. Replace the header `<div>` with:

```tsx
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
```

- [ ] **Step 6: Verify build**

```bash
cd ~/Desktop/calebbeng-site && npx next build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 7: Commit**

```bash
cd ~/Desktop/calebbeng-site && git add app/\(recoverwell\)/recoverwell/portal/\(protected\)/pages/\[pageId\]/edit/PageEditor.tsx && git commit -m "$(cat <<'EOF'
feat(portal): add practice-wide toggle to page editor

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Patient page — conditional attribution + visual verification

**Files:**
- Modify: `app/(recoverwell)/recoverwell/dr/[slug]/[surgery-type]/page.tsx`

- [ ] **Step 1: Wrap the attribution row in a conditional**

In `app/(recoverwell)/recoverwell/dr/[slug]/[surgery-type]/page.tsx`, find the doctor attribution div inside the `<header>`. It currently looks like:

```tsx
<div className="mt-2 flex items-center gap-2">
  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#d4e4f7]">
    <span className="text-[10px] font-bold text-[#2c5282]">
      {doctorInitials(doctor_name)}
    </span>
  </div>
  <p className="text-[12px] text-[#1c1a17]/50">
    Recommended by{" "}
    <span className="font-semibold text-[#1c1a17]">{doctor_name}</span>
  </p>
</div>
```

Wrap it so it only renders when `show_doctor` is true:

```tsx
{page.show_doctor && (
  <div className="mt-2 flex items-center gap-2">
    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#d4e4f7]">
      <span className="text-[10px] font-bold text-[#2c5282]">
        {doctorInitials(doctor_name)}
      </span>
    </div>
    <p className="text-[12px] text-[#1c1a17]/50">
      Recommended by{" "}
      <span className="font-semibold text-[#1c1a17]">{doctor_name}</span>
    </p>
  </div>
)}
```

Note: `page` is the return value of `getPublishedPage` — `page.show_doctor` is a `boolean` (added in Task 2), so this is type-safe. `doctor_name` stays destructured regardless — it's still fetched and used in `doctorInitials` if ever needed server-side, though `doctorInitials` won't be called when `show_doctor` is false.

- [ ] **Step 2: Verify build**

```bash
cd ~/Desktop/calebbeng-site && npx next build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 3: Run the dev server and verify both modes**

```bash
cd ~/Desktop/calebbeng-site && npx next dev
```

Open `http://localhost:3000/recoverwell/portal/pages/[any-page-id]/edit` and verify:
- Two pills appear in the header: "My name shown" (muted) and "Published/Draft" (green/grey)
- Clicking "My name shown" changes it to "Practice-wide" (blue) and back

Then open `http://localhost:3000/recoverwell/dr/prestige-vision-center/lasik`:
- With "My name shown" active: attribution row ("Recommended by Dr. Sarah Chen") is visible
- After toggling to "Practice-wide": page reloads without the attribution row; h1 and practice identity are unchanged

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/calebbeng-site && git add app/\(recoverwell\)/recoverwell/dr/\[slug\]/\[surgery-type\]/page.tsx && git commit -m "$(cat <<'EOF'
feat(patient-portal): hide doctor attribution when show_doctor is false

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
