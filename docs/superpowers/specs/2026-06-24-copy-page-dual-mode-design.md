# Copy Page + Dual Page Mode — Design Spec

## Overview

Allow doctors to copy a colleague's recommendation page (products + custom instructions) and put their own name on it. Also introduce dual page mode: a doctor can have both a doctor-branded page and a practice-wide page for the same surgery type.

## Goals

- Let invited doctors get productive fast by copying an existing colleague's page
- Support practice-wide pages (no doctor name) alongside doctor-specific pages for the same surgery type
- Keep the data model simple — no new tables

## Non-Goals

- Shared/synced templates (copy is a one-time snapshot)
- Drag-and-drop page reordering on dashboard
- Changes to the page editor itself (already refreshed)

---

## Design

### 1. Dual Page Mode

**Current model**: One page per doctor per surgery type. `show_doctor` is a toggle on the editor.

**New model**: A doctor can have up to two pages per surgery type — one doctor-branded and one practice-wide.

- `show_doctor` is set at creation time, not toggled after. The editor header shows a static label ("Practice page" or "Dr. [Name]'s page") instead of the old toggle pill.
- **Doctor-specific pages**: One per doctor per surgery type. Attributed to the doctor. URL: `/dr/[practice-slug]/[doctor-slug]/[surgery-type]`.
- **Practice-wide pages**: One per practice per surgery type (not per doctor). No doctor attribution on the patient page. URL: `/dr/[practice-slug]/[surgery-type]` (repurpose the current legacy redirect route). Any doctor in the practice can edit it. The `doctor_id` on the row tracks who created it (for the dashboard), but all practice members have access.

**URL routing change**: The 2-segment route `/dr/[slug]/[surgery-type]` currently redirects to the 3-segment URL. It will now serve practice-wide pages directly (if one exists and is published). If no practice-wide page exists, return 404 (no redirect).

### 2. Copy Page Server Action

A new `copyPage` server action in `portal/pages/actions.ts`:

- **Inputs**: `sourcePageId` (the colleague's page to copy from), `asPracticeWide` (boolean, optional — defaults to false)
- **Auth**: `requireDoctor()` — verifies the current doctor belongs to the same practice as the source page's doctor
- **Logic**:
  1. Load the source page's surgery type and all its `rw_page_products` rows (product_id, custom_instructions, sort_order)
  2. Determine if this is a doctor-specific or practice-wide copy based on `asPracticeWide`
  3. Check if the current doctor already has a page of the same type for that surgery type:
     - **Doctor-specific**: check `rw_recommendation_pages` where `doctor_id = current doctor` AND `surgery_type = source surgery type` AND `show_doctor = true`
     - **Practice-wide**: check `rw_recommendation_pages` where `doctor_id IN (practice doctor ids)` AND `surgery_type = source surgery type` AND `show_doctor = false`
  4. If existing page found: delete its `rw_page_products`, insert copied products
  5. If no existing page: create new `rw_recommendation_pages` row (draft, `show_doctor` based on type), insert copied products
  6. Redirect to the editor for the page

### 3. New Page Flow

Update `/portal/pages/new` to handle both page types and copying:

**Surgery type picker changes:**
- Each surgery type card shows up to two sub-options:
  - **"My page"** — creates a doctor-specific page with defaults. Hidden if the doctor already has one for this surgery type.
  - **"Practice page"** — creates a practice-wide page with defaults. Hidden if any doctor in the practice already has a practice-wide page for this surgery type.
- Surgery types where both options are exhausted don't show at all.

**Copy from colleague section:**
- Below the surgery type picker, a section: "Or copy from a colleague"
- Lists doctor-specific pages from other doctors in the practice, showing: surgery type, doctor name, product count (e.g. "LASIK · Dr. Chen · 9 products")
- Clicking copies the products into a new doctor-specific page for the current doctor
- If the current doctor already has a doctor-specific page for that surgery type, the button label indicates replacement (e.g. "Copy · replaces your LASIK page")
- Each copy card also has an option to copy as practice-wide (if no practice-wide page exists for that surgery type)

### 4. Dashboard Changes

**Page cards:**
- Each card shows a type badge: **"Practice"** (blue) for practice-wide pages, or the doctor's name for doctor-specific pages
- Practice-wide pages are visible to and editable by all doctors in the practice
- Page cards for other doctors' pages show a **"Copy"** button — creates a doctor-specific copy for the current doctor

**Existing behavior preserved:**
- "New Page" button links to the updated new page flow
- Edit/PDF/View links work the same
- Published URL displayed below each card (now shows the correct URL format based on page type)

### 5. Editor Header Change

Remove the `show_doctor` toggle pill. Replace with a static label:
- Doctor-specific page: shows "Dr. [Name]'s page" (muted text)
- Practice-wide page: shows "Practice page" (muted text)

The "Published" / "Draft · Publish" toggle stays unchanged.

### 6. Patient Page — Practice-Wide Route

The 2-segment route `/dr/[slug]/[surgery-type]/page.tsx` changes from a redirect to a full page render:

- Query `rw_recommendation_pages` where `show_doctor = false` AND practice matches the slug AND surgery type matches
- If found and published: render the patient page (same component, no doctor attribution)
- If not found: return 404

The 3-segment route `/dr/[slug]/[doctorSlug]/[surgery-type]` continues to serve doctor-specific pages (unchanged).

---

## Data Model Changes

No new tables. Changes to existing:

- Remove the unique-ish UI constraint of one page per doctor per surgery type — now allow up to two (one `show_doctor=true`, one `show_doctor=false`)
- `show_doctor` becomes immutable after page creation (set in `createPage` / `copyPage`, not toggleable)
- Practice-wide pages: `show_doctor = false`, `doctor_id` = creating doctor (for tracking), but all practice members can edit

No migrations needed — `show_doctor` already exists as a boolean column with default `true`.

---

## Files to Modify

- `app/(recoverbright)/recoverbright/portal/(protected)/pages/actions.ts` — add `copyPage` action, update `createPage` to accept `showDoctor` param
- `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx` — dual options per surgery type + copy from colleague section
- `app/(recoverbright)/recoverbright/portal/(protected)/page.tsx` — dashboard: type badges, copy buttons, practice-wide page visibility
- `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` — remove `show_doctor` toggle, add static label
- `app/(recoverbright)/recoverbright/dr/[slug]/[surgery-type]/page.tsx` — serve practice-wide pages instead of redirecting
- `lib/recoverbright/portal-pages.ts` — update `getPracticePages` to include `show_doctor` field, add helper to check existing page types
- `lib/recoverbright/pages.ts` — add `getPublishedPracticePage` for 2-segment route
