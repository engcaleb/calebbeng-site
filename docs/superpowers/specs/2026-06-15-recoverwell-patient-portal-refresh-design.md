# RecoverWell — Patient Portal Refresh Design

**Date:** 2026-06-15
**Scope:** `/dr/[slug]/[surgery-type]/page.tsx` — the patient-facing recommendation page

---

## Goal

Refresh the patient portal to surface the doctor's identity, make the surgery type explicit in the page title, and tighten the overall visual hierarchy. No data model changes required — `doctor_name` is already returned by `getPublishedPage`.

---

## Design Decisions

### Header (approved)

Replace the current generic header with a two-part structure:

**Top row — practice identity**
- Practice logo (or initials placeholder, same as today)
- Practice name as primary text (`font-weight: 600`, 15px)
- Surgery type as a monospace uppercase label below the name (e.g. `LASIK · Recovery Guide`)

**Below divider — page title + doctor attribution**
- h1: `"Your {surgery_type} Recovery Guide"` — surgery-specific, not the generic "Your Doctor's Recommendations"
- Doctor attribution row beneath the h1:
  - Avatar circle showing doctor's initials (26px, light blue background)
  - `"Recommended by Dr. Sarah Chen"` in 12px — "Recommended by" muted, name in `font-weight: 600`
- Avatar initials: strip known honorific prefixes (`Dr.`, `Mr.`, `Ms.`, `Mrs.`), then take the first letter of the first two remaining words. Example: `"Dr. Sarah Chen"` → `"SC"`. If only one word remains after stripping, use its first letter only.

### Product Cards (approved)

Keep the existing horizontal layout (image left, content right). Refinements:

- Image placeholder: 64×64px, `bg-[#1c1a17]/4`, `rounded-[7px]`
- Category label moves **inside** the card above the product name (removes the repeated section label above each group — the section header alone is sufficient)
- Product name: 13px, `font-weight: 600`
- Instructions: 11.5px, `leading-[1.65]`, muted
- Buy Now button: unchanged (`bg-[#1c1a17]`, `text-[#f9f7f4]`, `rounded-[5px]`)
- Card border-radius: 9px (up from 8px)
- Card spacing: `mb-2` between cards within a section, `mb-5` between sections

### Section Headers

Category labels remain above each product group as monospace uppercase labels (`text-[9px]`, `tracking-[0.28em]`). The per-card category label inside the card is kept for standalone context (if a card is shared or printed out of context).

### Footer

Split the disclaimer onto two lines for readability:
```
Not a substitute for medical advice
Follow your doctor's instructions · Recover Well
```

---

## What Changes in Code

### `app/(recoverwell)/recoverwell/dr/[slug]/[surgery-type]/page.tsx`

1. **Use `doctor_name`** — already on `PublishedPage`, currently unused. Derive initials (first letter of each space-separated word, max 2).
2. **Header rewrite:**
   - Practice row: logo/initials + practice name + `{surgery_type} · Recovery Guide` monospace label
   - Divider
   - h1: `"Your {surgery_type} Recovery Guide"`
   - Doctor attr row: avatar circle + `"Recommended by {doctor_name}"`
3. **ProductCard update:**
   - Add category label inside card (above product name)
   - Adjust image size to 64px, border-radius to 7px
   - Adjust card border-radius to 9px
4. **Footer:** split text to two lines

### No changes needed to:
- `lib/recoverwell/pages.ts` — `doctor_name` is already returned
- Database schema — no new columns
- Any other routes

---

## Out of Scope

The following are queued for later and NOT part of this refresh:

- Practice-wide mode (hide doctor name toggle)
- Doctor headshot upload + display
- PDF generation
- Product images (currently all null — image placeholder remains)
