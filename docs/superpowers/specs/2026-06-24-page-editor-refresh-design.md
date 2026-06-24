# Page Editor Refresh — Design Spec

## Overview

Refresh the RecoverBright page editor to reduce friction in product selection and instructions editing. The editor is the core workflow doctors repeat — defaults auto-populate when a page is created, then the doctor fine-tunes by swapping products, editing instructions, and removing what they don't recommend.

## Goals

- Simplify instructions editing from three confusing states to two clear ones
- Make adding/swapping products faster with category-grouped browsing scoped to the surgery type
- Future-proof product browsing so non-ophthalmology surgery types work naturally
- Keep the defaults system as-is — no changes to `rw_default_products` or `createPage`

## Non-Goals

- Inline preview of patient page (not needed for v1)
- Drag-and-drop reordering
- Two-panel builder layout
- Changes to the dashboard, settings, or invite flows (separate effort)

---

## Design

### 1. Product Cards (Selected Products)

Each selected product card in the editor:

- **Header row**: Product image (small thumbnail, omitted if null) + product name + category label (small caps) + Remove button (X icon, right-aligned)
- **Instructions area — two states only**:
  - **Read-only** (default): Instructions shown as static text. Small "Edit" link below.
  - **Editing**: Textarea pre-filled with existing text (default or custom). "Reset to default" link shown when a default exists and text differs from it. "Done" link to collapse back to read-only.
- If no default instructions and doctor hasn't written any: show a subtle "Add instructions" link instead of empty space.

The "Restore defaults" button remains at the top of the product list — resets the entire page back to surgery type defaults.

### 2. Add Products Section

Below the selected products, an "Add Products" section with two tiers:

#### Search Bar
- Full-width search input at the top: "Search products..."
- Filters across all visible products (both tiers) by name match

#### Tier 1: Default Products for This Surgery Type
- Products from `rw_default_products` for the page's surgery type, grouped into collapsible sections by their `category` field
- Section headers: category name + count (e.g. "Eye Drops · 3")
- Sections start **expanded**
- Each product row: thumbnail (omitted if null) + product name + "Add" button
- Already-selected products: checkmark icon instead of "Add", grayed out
- Categories are dynamic — derived from the products' `category` field, not hardcoded

#### Tier 2: All Other Products
- Single collapsible section: "All other products"
- **Collapsed by default**
- Same internal layout: grouped by category, thumbnails, Add buttons, checkmarks for selected
- Contains every active product NOT in the surgery type's defaults

#### Behavior
- Adding a product: appears immediately in the selected list above; browse section updates to show checkmark. No page reload.
- Removing a product (via X on card above): browse section updates to show "Add" button again.

### 3. Editor Header & Save Bar

No changes — existing structure works:

- **Header**: Back link to dashboard + "[Surgery Type] · Recommendation Page"
- **Toggle pills** (top right): "My name shown" / "Practice-wide" + "Draft" / "Published"
- **Save bar** (bottom): "Save" + "Download PDF"

### 4. New Page Flow

Keep as-is with one addition:

- Surgery type picker cards show **default product count** (e.g. "LASIK · 9 products")
- `createPage` auto-populates from `rw_default_products` (unchanged)
- Doctor lands in the editor with defaults pre-loaded

---

## Data Queries

### Add Products — Tier 1 (defaults for surgery type)
```sql
SELECT p.* FROM rw_default_products dp
JOIN rw_products p ON p.id = dp.product_id
WHERE dp.surgery_type = $surgeryType AND p.is_active = true
ORDER BY dp.sort_order
```

### Add Products — Tier 2 (everything else)
```sql
SELECT p.* FROM rw_products p
WHERE p.is_active = true
AND p.id NOT IN (
  SELECT product_id FROM rw_default_products WHERE surgery_type = $surgeryType
)
ORDER BY p.category, p.sort_order
```

### New Page — default product counts
```sql
SELECT surgery_type, COUNT(*) as product_count
FROM rw_default_products
GROUP BY surgery_type
```

---

## Files to Modify

- `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` — main refactor (product cards, instructions states, add products section)
- `app/(recoverbright)/recoverbright/portal/(protected)/pages/[pageId]/edit/page.tsx` — pass default products and all products to editor
- `app/(recoverbright)/recoverbright/portal/(protected)/pages/new/page.tsx` — add product counts to surgery type cards
- `lib/recoverbright/portal-pages.ts` — add query for default products by surgery type, all other products
- `lib/recoverbright/products.ts` — add query for default product counts per surgery type

No new database tables or migrations required.
