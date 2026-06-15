# RecoverWell PDF Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download PDF" button to the portal dashboard and editor that generates a branded, print-ready recommendation sheet with per-product QR codes.

**Architecture:** A Next.js Route Handler at `/portal/pages/[pageId]/pdf` handles all generation server-side — auth check, Supabase data fetch, parallel QR code generation, and `@react-pdf/renderer` buffer output. The PDF component (`lib/recoverwell/pdf.tsx`) is a pure rendering function with no DB access. Download buttons are plain `<a download>` links.

**Tech Stack:** `@react-pdf/renderer` (PDF layout), `qrcode` (QR as base64 PNG), Next.js Route Handler, Supabase (existing `createClient`), React `createElement` (avoids JSX in `.ts` route file).

> ⚠️ **Before writing any code:** check `node_modules/next/dist/docs/01-app/` for Route Handler patterns in this version. Key known fact: `params` in Route Handlers is a `Promise` — always `await` it.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/recoverwell/qr.ts` | **Create** | `generateQrDataUrl(url)` — wraps `qrcode`, returns base64 PNG |
| `lib/recoverwell/pdf.tsx` | **Create** | `RecoverWellDocument` — pure React-PDF component, no DB |
| `lib/recoverwell/portal-pages.ts` | **Modify** | Add `PdfProduct`, `PageForPdf` types + `getPageForPdf()` |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/pdf/route.ts` | **Create** | Route Handler: auth → data → QR → PDF stream |
| `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | **Modify** | Add "PDF" download link to each page card |
| `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx` | **Modify** | Add "Download PDF" link in save bar |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install runtime and type packages**

```bash
cd ~/Desktop/calebbeng-site
npm install @react-pdf/renderer qrcode
npm install --save-dev @types/qrcode
```

Expected: packages added to `node_modules`, `package.json` updated with `@react-pdf/renderer`, `qrcode`, and `@types/qrcode`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (New packages ship with their own types or `@types/*` just installed.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(rw): install @react-pdf/renderer and qrcode for PDF generation"
```

---

## Task 2: QR utility

**Files:**
- Create: `lib/recoverwell/qr.ts`

- [ ] **Step 1: Create the QR utility**

```typescript
import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 120,
    margin: 1,
    color: { dark: "#1c1a17", light: "#ffffff" },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/recoverwell/qr.ts
git commit -m "feat(rw): add QR code data URL generator"
```

---

## Task 3: PDF data layer

**Files:**
- Modify: `lib/recoverwell/portal-pages.ts`

- [ ] **Step 1: Add `PdfProduct` and `PageForPdf` types**

Append after the existing `PageForEditor` type in `lib/recoverwell/portal-pages.ts`:

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
  products: PdfProduct[];
};
```

- [ ] **Step 2: Add `getPageForPdf` function**

Append at the bottom of `lib/recoverwell/portal-pages.ts`:

```typescript
export async function getPageForPdf(
  pageId: string,
  doctorId: string
): Promise<PageForPdf | null> {
  const supabase = await createClient();

  // Run page ownership check + practice lookup in parallel
  const [pageResult, doctorResult] = await Promise.all([
    supabase
      .from("rw_recommendation_pages")
      .select("surgery_type")
      .eq("id", pageId)
      .eq("doctor_id", doctorId)
      .single(),
    supabase
      .from("rw_doctors")
      .select("practice:rw_practices(name, logo_url)")
      .eq("id", doctorId)
      .single(),
  ]);

  if (pageResult.error || !pageResult.data) return null;
  if (doctorResult.error || !doctorResult.data) return null;

  // Supabase returns FK joins as array or object — handle both
  const practiceRaw = doctorResult.data.practice as unknown;
  const practice = (
    Array.isArray(practiceRaw) ? practiceRaw[0] : practiceRaw
  ) as { name: string; logo_url: string | null } | null;
  if (!practice) return null;

  // Load page products with product details
  const { data: rows } = await supabase
    .from("rw_page_products")
    .select(
      "sort_order, custom_instructions, rw_products(name, slug, category, image_url, default_instructions)"
    )
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  type ProductRow = {
    name: string;
    slug: string;
    category: string;
    image_url: string | null;
    default_instructions: string | null;
  };

  const products: PdfProduct[] = (rows ?? [])
    .filter((r) => r.rw_products)
    .map((r, i) => {
      const raw = r.rw_products as unknown;
      const p = (Array.isArray(raw) ? raw[0] : raw) as ProductRow;
      return {
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        instructions: r.custom_instructions ?? p.default_instructions,
        sort_order: r.sort_order ?? i,
      };
    });

  return {
    surgery_type: pageResult.data.surgery_type,
    practice_name: practice.name,
    practice_logo_url: practice.logo_url,
    products,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/recoverwell/portal-pages.ts
git commit -m "feat(rw): add PdfProduct/PageForPdf types and getPageForPdf data function"
```

---

## Task 4: PDF document component

**Files:**
- Create: `lib/recoverwell/pdf.tsx`

- [ ] **Step 1: Create `lib/recoverwell/pdf.tsx`**

```tsx
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PageForPdf } from "./portal-pages";

const C = {
  bg: "#f9f7f4",
  text: "#1c1a17",
  muted: "rgba(28,26,23,0.45)",
  faint: "rgba(28,26,23,0.28)",
  border: "#e8e3da",
  white: "#ffffff",
  placeholder: "rgba(28,26,23,0.04)",
  logoBg: "rgba(28,26,23,0.06)",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    color: C.text,
    fontFamily: "Helvetica",
  },
  headerLogoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: C.logoBg,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
  },
  practiceName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: C.text,
  },
  surgeryLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    marginTop: 4,
    color: C.text,
  },
  doctorName: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    position: "relative",
  },
  productImg: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  productImgPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: C.placeholder,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  productContent: {
    flex: 1,
    paddingRight: 58,
  },
  productCategory: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    color: C.text,
  },
  productInstructions: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.5,
  },
  qr: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 48,
    height: 48,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: C.faint,
    letterSpacing: 0.8,
  },
  pageNum: {
    fontSize: 7,
    color: C.faint,
  },
});

export type RecoverWellDocumentProps = {
  page: PageForPdf;
  doctorName: string;
  qrDataUrls: Record<string, string>; // keyed by product slug
};

export function RecoverWellDocument({
  page,
  doctorName,
  qrDataUrls,
}: RecoverWellDocumentProps) {
  const initials = page.practice_name.slice(0, 2).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerLogoRow}>
          {page.practice_logo_url ? (
            <Image src={page.practice_logo_url} style={s.logo} />
          ) : (
            <View style={s.logoPlaceholder}>
              <Text style={s.logoInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={s.practiceName}>{page.practice_name}</Text>
            <Text style={s.surgeryLabel}>
              {page.surgery_type.toUpperCase()} · RECOVERY GUIDE
            </Text>
          </View>
        </View>
        <Text style={s.pageTitle}>Your Doctor's Recommendations</Text>
        <Text style={s.doctorName}>{doctorName}</Text>
        <View style={s.divider} />

        {/* ── Product cards ── */}
        {page.products.map((product) => (
          <View key={product.slug} style={s.card} wrap={false}>
            {product.image_url ? (
              <Image src={product.image_url} style={s.productImg} />
            ) : (
              <View style={s.productImgPlaceholder} />
            )}
            <View style={s.productContent}>
              <Text style={s.productCategory}>
                {product.category.toUpperCase()}
              </Text>
              <Text style={s.productName}>{product.name}</Text>
              {product.instructions ? (
                <Text style={s.productInstructions}>
                  {product.instructions}
                </Text>
              ) : null}
            </View>
            {qrDataUrls[product.slug] ? (
              <Image src={qrDataUrls[product.slug]} style={s.qr} />
            ) : null}
          </View>
        ))}

        {/* ── Footer — repeats on every page ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            NOT A SUBSTITUTE FOR MEDICAL ADVICE · FOLLOW YOUR DOCTOR'S
            INSTRUCTIONS · RECOVER WELL
          </Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (`@react-pdf/renderer` ships its own types.)

- [ ] **Step 3: Commit**

```bash
git add lib/recoverwell/pdf.tsx
git commit -m "feat(rw): add RecoverWellDocument PDF component"
```

---

## Task 5: Route Handler

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/pdf/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { getPageForPdf } from "@/lib/recoverwell/portal-pages";
import { generateQrDataUrl } from "@/lib/recoverwell/qr";
import { RecoverWellDocument } from "@/lib/recoverwell/pdf";

// Never cache — each response is personalized and reads live DB data
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { pageId } = await params;

  // requireDoctor redirects to /portal/login if not authenticated
  const doctor = await requireDoctor();

  const page = await getPageForPdf(pageId, doctor.id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate all QR codes in parallel
  const qrEntries = await Promise.all(
    page.products.map(async (p) => {
      const url = `https://recoverwell.calebbeng.com/products/${p.slug}`;
      const dataUrl = await generateQrDataUrl(url);
      return [p.slug, dataUrl] as const;
    })
  );
  const qrDataUrls = Object.fromEntries(qrEntries);

  try {
    const buffer = await renderToBuffer(
      React.createElement(RecoverWellDocument, {
        page,
        doctorName: doctor.name,
        qrDataUrls,
      })
    );

    const surgerySlug = page.surgery_type.toLowerCase().replace(/\s+/g, "-");
    const filename = `recoverwell-${surgerySlug}-recovery.pdf`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[PDF] generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify route returns a PDF**

Start the dev server if not running: `npm run dev`

In a browser, log in as Dr. Sarah Chen, then navigate to:
```
http://localhost:3000/recoverwell/portal/pages/<LASIK-page-uuid>/pdf
```

Find the LASIK page UUID from the dashboard URL or from Supabase → `rw_recommendation_pages`.

Expected:
- Browser prompts to download `recoverwell-lasik-recovery.pdf`
- Open the downloaded file — should show practice initials (PV for Prestige Vision Center), "LASIK · RECOVERY GUIDE", "Your Doctor's Recommendations", Dr. Sarah Chen, product cards with grey placeholder images, QR codes in top-right of each card, footer text.
- Try with a page UUID that belongs to a different doctor (or a fake UUID) — should return 404.

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/pdf/route.ts"
git commit -m "feat(rw): add PDF route handler"
```

---

## Task 6: Download buttons

**Files:**
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx`
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx`

- [ ] **Step 1: Add PDF link to dashboard page cards**

In `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx`, find the card action area:

```tsx
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
```

Replace with:

```tsx
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
                  <a
                    href={`/recoverwell/portal/pages/${page.id}/pdf`}
                    download
                    className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                  >
                    PDF
                  </a>
                  <Link
                    href={`/recoverwell/portal/pages/${page.id}/edit`}
                    className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                  >
                    Edit
                  </Link>
                </div>
```

- [ ] **Step 2: Add Download PDF button to PageEditor save bar**

In `app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx`, find the save bar:

```tsx
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
```

Replace with:

```tsx
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
          href={`/recoverwell/portal/pages/${page.id}/pdf`}
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
```

- [ ] **Step 3: Verify TypeScript compiles and lint passes**

```bash
npx tsc --noEmit && npx eslint . --max-warnings=0
```

Expected: no errors or warnings.

- [ ] **Step 4: Verify download buttons in browser**

With dev server running:

**Dashboard:** Navigate to `/recoverwell/portal`. Each page card should show `[Published/Draft] [PDF] [Edit]`. Click "PDF" — browser downloads the PDF.

**Editor:** Navigate to any page editor. The save bar should show `[Save] [Download PDF]`. Click "Download PDF" — browser downloads the PDF.

- [ ] **Step 5: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/page.tsx" \
        "app/(recoverwell)/recoverwell/portal/(protected)/pages/[pageId]/edit/PageEditor.tsx"
git commit -m "feat(rw): add PDF download buttons to dashboard and editor"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - ✅ QR codes per product linking to `/products/[slug]` — Task 2 + Task 5
  - ✅ Placeholder image box when `image_url` is null — Task 4 (`productImgPlaceholder` View)
  - ✅ Practice logo or initials placeholder — Task 4 (`logoPlaceholder` View)
  - ✅ PDF layout: header (logo, practice name, surgery type, title, doctor name), product cards, footer — Task 4
  - ✅ Route Handler with auth, ownership check, 404 on missing page — Task 5
  - ✅ Download button on dashboard — Task 6 Step 1
  - ✅ Download button on editor — Task 6 Step 2
  - ✅ `dynamic = "force-dynamic"` on route handler — Task 5

- [x] **No placeholders:** All code is complete. No TBDs.

- [x] **Type consistency:**
  - `PageForPdf` defined in Task 3, used in Tasks 4 and 5 ✅
  - `RecoverWellDocumentProps` defined in Task 4, matches `React.createElement` call in Task 5 ✅
  - `PdfProduct.slug` used as `qrDataUrls` key in Task 5, matches `qrDataUrls[product.slug]` in Task 4 ✅
  - `generateQrDataUrl` defined in Task 2, imported in Task 5 ✅
  - `getPageForPdf` defined in Task 3, imported in Task 5 ✅

- [x] **Route Handler JSX:** Uses `React.createElement` instead of JSX so file extension stays `.ts` ✅

- [x] **Auth in Route Handler:** `requireDoctor()` is called explicitly (layouts don't cover Route Handlers) ✅
