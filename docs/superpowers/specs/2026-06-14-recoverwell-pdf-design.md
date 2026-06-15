# RecoverWell PDF Generation — Design Spec
*Date: June 14, 2026*

## Overview

Doctors can download a branded PDF of any recommendation page from both the portal dashboard and the page editor. The PDF mirrors the patient-facing web page but is formatted for print — practice logo, surgery type header, per-product cards with instructions and QR codes, and a disclaimer footer. QR codes link to `recoverwell.calebbeng.com/products/[slug]` so patients scan and land on the RecoverWell product page before buying.

---

## Architecture

PDF generation is server-side via a Next.js Route Handler. The doctor clicks a plain `<a href="…/pdf" download>` link — no client JS, no streaming UI. The server authenticates, loads data, generates QR codes, renders the PDF, and returns it as a binary response.

**Libraries:**
- `@react-pdf/renderer` — React-based PDF layout, runs in Node.js, no Chromium
- `qrcode` — generates QR code as base64 PNG data URL, embedded directly in the PDF

---

## Files

### New

| File | Responsibility |
|---|---|
| `lib/recoverwell/qr.ts` | `generateQrDataUrl(url: string): Promise<string>` — wraps `qrcode`, returns base64 PNG data URL |
| `lib/recoverwell/pdf.tsx` | `<RecoverWellDocument>` React-PDF component — pure rendering, no DB or auth |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/pdf/route.ts` | Route Handler: auth → data fetch → QR generation → PDF stream |

### Modified

| File | Change |
|---|---|
| `lib/recoverwell/portal-pages.ts` | Add `PageForPdf` type + `getPageForPdf(pageId, doctorId)` data function |
| `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | Add "PDF" `<a>` link on each page card (alongside Edit) |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` | Add "Download PDF" `<a>` button in the save bar |

---

## Data Layer (`lib/recoverwell/portal-pages.ts`)

```typescript
export type PdfProduct = {
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  instructions: string | null; // custom_instructions ?? default_instructions
  sort_order: number;
};

export type PageForPdf = {
  surgery_type: string;
  practice_name: string;
  practice_logo_url: string | null;
  doctor_name: string;
  products: PdfProduct[];
};
```

`getPageForPdf(pageId, doctorId)` does a two-query fetch (same pattern as `getPublishedPage`):
1. Load page row — scoped to `pageId` + `doctorId` for ownership check. Return null if not found.
2. Load `rw_page_products` joined to `rw_products`, ordered by `sort_order`, resolving `instructions = custom_instructions ?? default_instructions`.

Doctor name comes from `requireDoctor()` in the route handler (not from the DB query), so no extra join is needed.

---

## QR Utility (`lib/recoverwell/qr.ts`)

```typescript
import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: "#1c1a17", light: "#ffffff" } });
}
```

Called once per product in the route handler before PDF rendering. Results passed into the PDF component as `qrDataUrls: Record<slug, string>`.

---

## PDF Component (`lib/recoverwell/pdf.tsx`)

Uses `@react-pdf/renderer` primitives only. No Tailwind, no HTML — all styles are inline style objects.

### Props

```typescript
type RecoverWellDocumentProps = {
  page: PageForPdf;
  doctorName: string;
  qrDataUrls: Record<string, string>; // keyed by product slug
};
```

### Layout

**Page:** A4, 20mm margins all sides, `#f9f7f4` background.

**Header (top of page 1 only):**
- Practice logo image (if `practice_logo_url`) OR a 40×40 grey box with 2-letter initials — left side
- Right of logo: practice name in medium weight, surgery type + "Recovery Guide" in small caps below
- Below the logo row: "Your Doctor's Recommendations" as large title
- Doctor name in muted small text below title

**Product cards** (stacked, 8pt gap between cards):
- Outer container: white background, 6pt border-radius, 1pt `#e8e3da` border, 8pt padding
- Left column (fixed 56pt wide): grey placeholder box (if no `image_url`) or product image
- Right column (flex): category label in small-caps muted text, product name bold 11pt, instructions 9pt muted, 4pt gap between
- QR code (48pt × 48pt): absolutely positioned top-right of the card

**Footer (every page):**
- "NOT A SUBSTITUTE FOR MEDICAL ADVICE · FOLLOW YOUR DOCTOR'S INSTRUCTIONS · RECOVER WELL" — centered, 7pt, muted
- Page number right-aligned same line

### Fonts

Use `@react-pdf/renderer`'s built-in Helvetica family — no external font registration required for Phase 1.

---

## Route Handler (`pages/[pageId]/pdf/route.ts`)

```
GET /recoverwell/portal/pages/[pageId]/pdf
```

1. `requireDoctor()` — redirects to login if not authed (via Next.js `redirect()` inside a try/catch or check)
2. `getPageForPdf(pageId, doctor.id)` — return 404 if null
3. For each product: `generateQrDataUrl("https://recoverwell.calebbeng.com/products/" + slug)`
4. `await renderToBuffer(<RecoverWellDocument ... />)` from `@react-pdf/renderer`
5. Return `new Response(buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${slug}-${surgeryTypeSegment}.pdf"` } })`

Route Handlers do not inherit layout auth gates — `requireDoctor()` must be called explicitly here.

---

## Download Button Placement

**Dashboard (`portal/(protected)/page.tsx`):**
Each page card's action area currently shows `[Published/Draft badge] [Edit link]`. Add `[PDF link]` between them:
```tsx
<a
  href={`/recoverwell/portal/pages/${page.id}/pdf`}
  download
  className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
>
  PDF
</a>
```

Available on both published and draft pages (doctors may want to preview before publishing).

**Editor (`PageEditor.tsx`):**
Add "Download PDF" `<a>` button in the save bar, to the right of the Save button:
```tsx
<a
  href={`/recoverwell/portal/pages/${page.id}/pdf`}
  download
  className="btn-ghost"
>
  Download PDF
</a>
```

---

## Error Handling

- No page found (wrong owner or doesn't exist): return `NextResponse.json({ error: "Not found" }, { status: 404 })`
- Not authenticated: `requireDoctor()` calls `redirect("/recoverwell/portal/login")` — Route Handler will throw a redirect response, which Next.js handles correctly
- PDF render error: return `NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })`

---

## Out of Scope

- Product images (all `image_url` are null for seeded products — placeholder box is shown instead; images will render automatically once URLs are set)
- Practice logo (same — shows initials placeholder until uploaded)
- Checkbox column (referenced in context doc for "patient can check off items" — deferred to a future iteration)
- Delivery via email or Twilio — download only for Phase 1
