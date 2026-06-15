# RecoverWell Page Builder — Design Spec
*Date: June 14, 2026*

## Overview

Doctors need a UI to create and manage their surgery-type recommendation pages. Each page is a curated list of products (selected from the admin-managed catalog) with per-product usage instructions. Doctors can use admin-set default instructions or override them. Pages can be published (visible to patients) or kept as drafts.

---

## Routes

All routes live inside `app/(recoverwell)/recoverwell/portal/(protected)/` — already auth-gated by the existing layout.

```
portal/(protected)/
  page.tsx                        ← UPDATE: list doctor's pages (replaces placeholder)
  pages/
    new/
      page.tsx                    ← Surgery type picker; creates draft and redirects
    [pageId]/
      edit/
        page.tsx                  ← Server shell: loads products + existing selections
        PageEditor.tsx            ← Client Component: all interactive state
        actions.ts                ← createPage, savePageProducts, togglePublish
```

---

## Components & Data Flow

### Dashboard (`portal/(protected)/page.tsx`)

Server component. Loads `rw_recommendation_pages` for the current doctor (joined with product count via `rw_page_products`). Renders:

- One card per surgery-type page showing: surgery type name, published/draft badge, product count, "Edit" link.
- "New Page" button → `/recoverwell/portal/pages/new`.
- Empty state if no pages exist yet.

### New Page (`pages/new/page.tsx`)

Server component. Reads the doctor's existing pages to know which surgery types are already created. Shows a list of available types: LASIK, Cataract, Dry Eye, Retinal, Corneal. Submitting calls `createPage(surgeryType)` server action, which inserts an unpublished `rw_recommendation_pages` row and redirects to `/portal/pages/[newId]/edit`.

### Editor Shell (`pages/[pageId]/edit/page.tsx`)

Server component. Loads in parallel:
- All active products from `rw_products` (via `getActiveProducts()`)
- Existing `rw_page_products` for this page (product_id + custom_instructions + sort_order)
- The page row itself (surgery_type, is_published) — verifies it belongs to the current doctor (403/redirect if not)

Passes all three as props to `PageEditor`.

### PageEditor (`PageEditor.tsx`) — Client Component

State: a `Map<productId, { custom_instructions: string | null; sort_order: number }>` initialized from the loaded page products. Products absent from the map are unchecked.

Renders:
- Header: surgery type name, "Published" / "Draft" badge, Publish/Unpublish button (calls `togglePublish` server action directly via `useTransition`).
- Product list grouped by category. Each product row:
  - Checkbox — checked if product is in state map.
  - Product name + category label.
  - Checking adds product to map with `custom_instructions: null` and next sort order.
  - Unchecking removes product from map.
  - Checked products expand to show the instructions panel (see below).
- "Save" button at bottom — calls `savePageProducts` server action with the full current state. Disabled while saving. Shows success/error inline.

### Instructions Panel (inside checked product row)

Three states based on whether `custom_instructions` is null or set:

1. **Default (null):** Shows admin's `default_instructions` in a read-only block labelled "Default instructions · set by admin". A small "Customize" button switches to edit mode.
2. **Customized:** Shows an editable `<textarea>` with the custom text. A "Reset to default" link beneath sets `custom_instructions` back to null (re-renders as state 1).
3. **No default exists:** Shows an optional `<textarea>` with placeholder "Add instructions (optional)…"

On save: if `custom_instructions` is an empty string or equals `default_instructions` exactly, save `null` (use default). This keeps data clean and ensures admin edits to default instructions automatically propagate to uncustomized pages.

---

## Server Actions (`actions.ts`)

### `createPage(doctorId, surgeryType)`
- Inserts into `rw_recommendation_pages` (`doctor_id`, `surgery_type`, `is_published: false`).
- Redirects to `/recoverwell/portal/pages/[newId]/edit`.

### `savePageProducts(pageId, products: Array<{ product_id, custom_instructions, sort_order }>)`
- Verifies `pageId` belongs to the current doctor (security check via `requireDoctor()`).
- Deletes all existing `rw_page_products` rows for this page.
- Bulk inserts the new product list.
- Calls `revalidatePath` on the patient-facing page URL so it updates immediately on publish.

### `togglePublish(pageId, currentIsPublished)`
- Verifies ownership.
- Flips `is_published` on `rw_recommendation_pages`.
- Calls `revalidatePath` on the patient-facing page URL.

---

## Default Instructions — Design Principle

Admin-set `default_instructions` on `rw_products` is the source of truth for what patients should do with each product. Doctors can override this per-page, but the default should be:

- **Visible** — always shown, never hidden behind a click.
- **Clearly labelled** — "set by admin" so doctors know it came from the platform, not them.
- **Easy to keep** — the path of least resistance is to leave the default in place.
- **Easy to reset** — if a doctor customizes and later wants to revert, one click resets to the admin default.

Saving `null` for `custom_instructions` means "use the current default" — both the patient page renderer and the editor must treat null as "fall back to `default_instructions`."

---

## Security

- `requireDoctor()` is called at the top of every server action and the editor shell.
- Page ownership is verified before any write: `rw_recommendation_pages.doctor_id` must match `requireDoctor().id`.
- The editor shell redirects to `/portal/login` if the page doesn't belong to the current doctor.
- No RLS changes needed — writes go through the server-side anon client which is scoped to the authenticated user's RLS policies (doctor can CRUD own pages and page products).

---

## Out of Scope (This Spec)

- Drag-to-reorder products (sort_order is tracked in state but not exposed in the UI — products save in the order they were checked)
- PDF generation
- QR codes
- Product images in the editor (image_url is null for all seeded products)
- Doctor self-serve product additions to the catalog
