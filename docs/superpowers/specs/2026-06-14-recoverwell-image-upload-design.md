# RecoverWell Image Upload & Portal Settings — Design Spec
*Date: June 14, 2026*

## Overview

Two features in one session, sharing a common storage infrastructure:

1. **Portal settings page** — doctors update practice name, contact email, their own name, and upload a practice logo
2. **Admin product image upload** — file upload alongside the existing URL field in the product form

Plus a **password validation utility** wired up for future signup/change-password flows.

---

## Storage Infrastructure

### Supabase Storage Buckets

Two public buckets created via Supabase dashboard (or migration):

| Bucket | Path pattern | Contents |
|---|---|---|
| `practice-logos` | `{practiceId}/logo.{ext}` | One logo per practice; overwrite in place |
| `product-images` | `{productId}/image.{ext}` | One image per product; overwrite in place |

Both buckets are **public** — files served via Supabase CDN with no auth required. The Supabase CDN hostname (`fmwicqeqpffmvqyerpyo.supabase.co`) is already whitelisted in `next.config.ts`.

Public URL format:
```
https://fmwicqeqpffmvqyerpyo.supabase.co/storage/v1/object/public/{bucket}/{id}/image.{ext}
```

### Upload Route Handler

`app/(recoverwell)/recoverwell/api/upload/route.ts`

```
POST /recoverwell/api/upload
Content-Type: multipart/form-data

Fields:
  file    — the image file
  bucket  — "practice-logos" | "product-images"
  id      — practiceId or productId (used as path prefix)
```

- Uses the **service-role client** (`createServiceClient`) so RLS doesn't block the upload
- Derives file extension from `file.type` (e.g. `image/png` → `png`)
- Path: `{id}/image.{ext}` — always the same name, overwrites previous upload automatically
- Returns `{ url: string }` on success, `{ error: string }` on failure
- No auth check needed on the Route Handler itself: portal settings calls it from a client component that already requires a logged-in doctor; admin upload is behind the admin URL which is not publicly known. If stricter auth is needed later, add it then.

---

## Portal Settings Page

### Route

`app/(recoverwell)/recoverwell/portal/(protected)/settings/page.tsx` — Server Component, gated by the existing `(protected)` layout auth gate.

Linked from the portal dashboard header with a "Settings" link.

### Fields

| Field | DB target | Notes |
|---|---|---|
| Practice logo | `rw_practices.logo_url` | File uploads to storage on file select (gets URL); URL saved to DB on form Save |
| Practice name | `rw_practices.name` | Text input, required |
| Contact email | `rw_practices.contact_email` | Email input |
| Your name | `rw_doctors.name` | Text input, required |

### Logo Upload UX

The logo field shows:
- Current logo image (40×40, rounded) if `logo_url` is set, or initials placeholder if not
- A "Change logo" file button below it
- An "or paste URL" text input alongside

On file select: client component calls `POST /recoverwell/api/upload` with `bucket=practice-logos`, `id={practiceId}`, then updates the URL input with the returned URL. The URL is included in the form's Save submission — no separate save step for the image.

On paste URL: URL input is populated directly and saved on form Submit.

### Save Action

`app/(recoverwell)/recoverwell/portal/(protected)/settings/actions.ts`

Server Action `saveSettings(formData)`:
1. `requireDoctor()` — auth + ownership
2. Updates `rw_practices` (name, contact_email, logo_url) and `rw_doctors` (name) in parallel via `Promise.all`
3. `revalidatePath("/recoverwell/portal")` and `revalidatePath("/recoverwell/portal/settings")`

On success: shows "Saved" confirmation in the UI (same pattern as the page editor save bar).

---

## Admin Product Image Upload

### Change to ProductForm

`app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx`

The existing `image_url` URL-only input becomes a combined field:

```
[ Choose file ]  or paste URL: [________________________]
```

- **File button**: triggers a hidden `<input type="file" accept="image/*">`. On change, POSTs to `/recoverwell/api/upload` with `bucket=product-images`, `id={product.id}`, then sets the URL input value to the returned URL.
- **URL input**: editable at any time. Pre-populated after a file upload. Admin can also paste an external URL directly (Amazon CDN, Supabase, anywhere).
- File upload button is **only shown when editing** an existing product (`isEdit === true`) — new products don't have an ID yet, so file upload isn't possible until after first save. On new product forms, the URL input is shown alone with a note: "Save the product first to enable image upload."
- The `image_url` hidden/text value flows into `upsertProduct` unchanged — no server action changes needed.

### Upload state in ProductForm

Two new pieces of client state:
- `imageUrl: string` — mirrors the URL field, initialized from `product?.image_url ?? ""`
- `isUploading: boolean` — shows a "Uploading…" state on the file button during the fetch

---

## Password Validation Utility

`lib/recoverwell/password.ts`

```typescript
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}
```

Applied in:
- Future **signup form** — validate before submitting to Supabase Auth
- Future **change password form** (settings page, Phase 2) — validate before calling `supabase.auth.updateUser`

**Not applied to the current login form** — can't reject a correct existing password for complexity. Sarah Chen's test account (`sarah.chen@example.com` or whatever was used in Supabase dashboard) is permanently unaffected.

---

## Files

### New
| File | Responsibility |
|---|---|
| `app/(recoverwell)/recoverwell/api/upload/route.ts` | Upload Route Handler — receives file, uploads to Supabase Storage, returns public URL |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/page.tsx` | Settings page shell — Server Component, loads doctor + practice data |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/SettingsForm.tsx` | Client Component — logo upload, all four fields, save button |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/actions.ts` | `saveSettings` Server Action |
| `lib/recoverwell/password.ts` | `validatePassword` utility |

### Modified
| File | Change |
|---|---|
| `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | Add "Settings" link in dashboard header |
| `app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx` | Add file upload button + upload state alongside image_url field |

---

## Error Handling

- **Upload Route Handler**: returns `{ error: "..." }` with appropriate HTTP status. Client shows inline error near the file button ("Upload failed — try again").
- **saveSettings**: if Supabase update fails, Server Action throws; client catches and shows "Error saving — try again" (same pattern as page editor).
- **File type**: Route Handler accepts any `image/*` MIME type. No server-side size limit enforced in Phase 1 — Supabase Storage free tier allows up to 50MB per file, which is more than enough for logos and product images.

---

## Out of Scope

- Image resizing/compression — Supabase Storage doesn't resize on upload; acceptable for Phase 1
- Multiple images per product
- Deleting old uploaded files from storage when a new one is uploaded (old file stays in storage, orphaned — acceptable for Phase 1 given low volume)
- Doctor self-signup — separate feature
- Change password in settings — future; utility is ready when needed
