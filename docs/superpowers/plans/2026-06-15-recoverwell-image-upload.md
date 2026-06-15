# RecoverWell Image Upload & Portal Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add practice logo upload + settings page for doctors, product image upload for admin, and a shared password validation utility for future auth flows.

**Architecture:** Two public Supabase Storage buckets (`practice-logos`, `product-images`) served via CDN. A single server-side upload Route Handler at `POST /api/upload` (service-role client, never exposes keys to browser) handles all file uploads and returns a public URL. Portal settings and admin product form both use `fetch("/api/upload")` client-side, then save the returned URL through existing save flows. Settings uses a Server Action (`saveSettings`) with `createServiceClient()` to update both `rw_practices` and `rw_doctors` in one call.

**Tech Stack:** Supabase Storage, Next.js 16 App Router Route Handler, `@supabase/supabase-js` storage API, existing CSS utilities (`.input`, `.label`, `.btn-primary`, `.btn-ghost`).

> ⚠️ **Before writing any Next.js code:** check `node_modules/next/dist/docs/01-app/` for Route Handler and Server Action patterns. Key known fact: `params` in Route Handlers is a `Promise` — always `await` it. The form `action` prop accepts a client-side function in React 19 (same pattern as `ProductForm.tsx`).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/recoverwell/password.ts` | **Create** | `validatePassword(password)` — shared utility for future signup/change-password |
| `app/(recoverwell)/recoverwell/api/upload/route.ts` | **Create** | Upload Route Handler — receives file via multipart POST, uploads to Supabase Storage, returns public URL |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/actions.ts` | **Create** | `saveSettings` Server Action — updates `rw_practices` + `rw_doctors` in parallel |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/page.tsx` | **Create** | Settings page shell — Server Component, loads doctor via `requireDoctor()` |
| `app/(recoverwell)/recoverwell/portal/(protected)/settings/SettingsForm.tsx` | **Create** | Client Component — logo upload + URL field, four text fields, save bar |
| `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | **Modify** | Add "Settings" link in dashboard header |
| `app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx` | **Modify** | Add file upload button + state alongside `image_url` field |

---

## Task 1: Create Supabase Storage buckets

**This task requires the Supabase dashboard — no code to write.**

- [ ] **Step 1: Create `practice-logos` bucket**

Go to: [Supabase Dashboard](https://app.supabase.com) → project `calebbeng-site` → Storage → New bucket

Settings:
- Name: `practice-logos`
- Public bucket: ✅ ON
- File size limit: leave default
- Allowed MIME types: leave default (allow all image types)

Click Create.

- [ ] **Step 2: Create `product-images` bucket**

Same steps, bucket name: `product-images`, Public: ✅ ON.

- [ ] **Step 3: Verify public URL format**

Click any test file in either bucket → Copy URL. It should match:
```
https://fmwicqeqpffmvqyerpyo.supabase.co/storage/v1/object/public/{bucket}/{path}
```

This hostname is already whitelisted in `next.config.ts` under `images.remotePatterns`.

---

## Task 2: Password validation utility

**Files:**
- Create: `lib/recoverwell/password.ts`

- [ ] **Step 1: Create the utility**

```typescript
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add lib/recoverwell/password.ts
git commit -m "feat(rw): add password validation utility"
```

---

## Task 3: Upload Route Handler

**Files:**
- Create: `app/(recoverwell)/recoverwell/api/upload/route.ts`

**Context:** The middleware rewrites `recoverwell.calebbeng.com/api/upload` → internal path `/recoverwell/api/upload`, which maps to this file. Client components call `fetch("/api/upload", { method: "POST", body: formData })`.

The handler uses `createServiceClient()` (service-role key) to bypass RLS on storage operations. It validates that the `bucket` field is one of the two allowed values to prevent misuse.

- [ ] **Step 1: Create the Route Handler**

```typescript
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["practice-logos", "product-images"] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "jpg";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const id = formData.get("id") as string | null;

    if (!file || !bucket || !id) {
      return NextResponse.json(
        { error: "Missing file, bucket, or id" },
        { status: 400 }
      );
    }
    if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    const ext = extFromMime(file.type);
    const path = `${id}/image.${ext}`;
    const bytes = await file.arrayBuffer();

    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket as AllowedBucket)
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage
      .from(bucket as AllowedBucket)
      .getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/api/upload/route.ts"
git commit -m "feat(rw): add file upload route handler for Supabase Storage"
```

---

## Task 4: Settings Server Action

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/settings/actions.ts`

**Context:** Uses `createServiceClient()` because `rw_practices` has no UPDATE RLS policy for authenticated users (only public SELECT). Ownership is already verified by `requireDoctor()` — if the doctor isn't authenticated or doesn't exist, that call redirects to login before the update runs. Updates both `rw_practices` and `rw_doctors` in parallel.

- [ ] **Step 1: Create the Server Action**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function saveSettings(formData: FormData) {
  const doctor = await requireDoctor();
  const supabase = createServiceClient();

  const [practiceResult, doctorResult] = await Promise.all([
    supabase
      .from("rw_practices")
      .update({
        name: (formData.get("practice_name") as string).trim(),
        contact_email:
          (formData.get("contact_email") as string).trim() || null,
        logo_url: (formData.get("logo_url") as string).trim() || null,
      })
      .eq("id", doctor.practice.id),
    supabase
      .from("rw_doctors")
      .update({ name: (formData.get("doctor_name") as string).trim() })
      .eq("id", doctor.id),
  ]);

  if (practiceResult.error) throw new Error(practiceResult.error.message);
  if (doctorResult.error) throw new Error(doctorResult.error.message);

  revalidatePath("/recoverwell/portal");
  revalidatePath("/recoverwell/portal/settings");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/settings/actions.ts"
git commit -m "feat(rw): add saveSettings server action"
```

---

## Task 5: Settings page and form

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/settings/page.tsx`
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/settings/SettingsForm.tsx`

**Context:** `settings/page.tsx` is a Server Component gated by the existing `(protected)/layout.tsx` auth gate (same as the dashboard). It calls `requireDoctor()` to load the doctor + practice data and passes it to `SettingsForm`.

`SettingsForm` is a Client Component. The form uses `action={handleSave}` (React 19 pattern — same as `ProductForm.tsx`). `handleSave(formData)` injects `logo_url` from state (since it's not a standard named input), then calls `saveSettings` inside `useTransition`. Logo file uploads happen immediately on file select via `fetch("/api/upload")` — the returned URL populates the `logoUrl` state and is injected at save time.

`DoctorWithPractice` type (from `lib/recoverwell/auth.ts`) has: `id`, `name`, `practice.id`, `practice.name`, `practice.slug`, `practice.logo_url`, `practice.contact_email`.

- [ ] **Step 1: Create the page shell**

```typescript
import { requireDoctor } from "@/lib/recoverwell/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — Portal" };

export default async function SettingsPage() {
  const doctor = await requireDoctor();
  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <SettingsForm doctor={doctor} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the SettingsForm client component**

```tsx
"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { saveSettings } from "./actions";
import type { DoctorWithPractice } from "@/lib/recoverwell/auth";

export function SettingsForm({ doctor }: { doctor: DoctorWithPractice }) {
  const [logoUrl, setLogoUrl] = useState(doctor.practice.logo_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = doctor.practice.name.slice(0, 2).toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("bucket", "practice-logos");
      body.append("id", doctor.practice.id);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
      setLogoUrl(json.url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again"
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave(formData: FormData) {
    formData.set("logo_url", logoUrl);
    setSaveStatus("idle");
    startTransition(async () => {
      try {
        await saveSettings(formData);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    });
  }

  return (
    <form action={handleSave} className="space-y-6">
      {/* Back */}
      <div className="mb-8">
        <Link
          href="/recoverwell/portal"
          className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-xl font-medium text-[#1c1a17]">Settings</h1>
      </div>

      {/* Practice Logo */}
      <div>
        <p className="label mb-3">Practice Logo</p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Practice logo"
              className="h-16 w-16 rounded-lg border border-[#e8e3da] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#1c1a17]/6 font-mono text-sm text-[#1c1a17]/40">
              {initials}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn-ghost disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : "Choose file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadError && (
              <p className="mt-1 font-mono text-[11px] text-red-500">
                {uploadError}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
            or paste URL
          </span>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value);
              setSaveStatus("idle");
            }}
            placeholder="https://…"
            className="input flex-1 font-mono text-[13px]"
          />
        </div>
      </div>

      {/* Practice Name */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="practice_name">
          Practice Name
        </label>
        <input
          id="practice_name"
          name="practice_name"
          required
          defaultValue={doctor.practice.name}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Contact Email */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="contact_email">
          Contact Email
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={doctor.practice.contact_email ?? ""}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Doctor Name */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="doctor_name">
          Your Name
        </label>
        <input
          id="doctor_name"
          name="doctor_name"
          required
          defaultValue={doctor.name}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-4 border-t border-[#e8e3da] pt-6">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save"}
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
    </form>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/settings/page.tsx" \
        "app/(recoverwell)/recoverwell/portal/(protected)/settings/SettingsForm.tsx"
git commit -m "feat(rw): add portal settings page with logo upload"
```

---

## Task 6: Settings link in dashboard

**Files:**
- Modify: `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx`

- [ ] **Step 1: Read the current dashboard header**

The header action area currently contains a "New Page" `<Link>` and a "Sign out" form. It looks like:

```tsx
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
```

- [ ] **Step 2: Add Settings link**

Replace that `<div>` with:

```tsx
<div className="flex items-center gap-3">
  <Link href="/recoverwell/portal/pages/new" className="btn-primary">
    New Page
  </Link>
  <Link href="/recoverwell/portal/settings" className="btn-ghost">
    Settings
  </Link>
  <form action={logoutAction}>
    <button type="submit" className="btn-ghost">
      Sign out
    </button>
  </form>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/page.tsx"
git commit -m "feat(rw): add Settings link to portal dashboard header"
```

---

## Task 7: Product image upload in admin

**Files:**
- Modify: `app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx`

**Context:** The existing `ProductForm` already has an `image_url` URL input. We're adding a "Choose file" button alongside it that uploads to `product-images/{productId}/image.{ext}` and populates the URL field. File upload is only available when `isEdit === true` (needs `product.id` for the storage path). New products show a note instead.

The component already uses `useState` and `useRef` and `useTransition`. Add three new pieces of state: `imageUrl`, `isUploading`, `uploadError`. Add one new ref: `imageFileInputRef`. Replace the existing static `image_url` input with the combined field.

- [ ] **Step 1: Read the current ProductForm**

File: `app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx`

Key existing state/refs: `name`, `slug`, `slugEdited`, `isPending`, `formRef`. Keep all of these unchanged.

- [ ] **Step 2: Add upload state and handler**

After the existing `const formRef = useRef<HTMLFormElement>(null);` line, add:

```typescript
const imageFileInputRef = useRef<HTMLInputElement>(null);
const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState<string | null>(null);

async function handleImageFileChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];
  if (!file || !product?.id) return;
  setIsUploading(true);
  setUploadError(null);
  try {
    const body = new FormData();
    body.append("file", file);
    body.append("bucket", "product-images");
    body.append("id", product.id);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
    setImageUrl(json.url);
  } catch (err) {
    setUploadError(
      err instanceof Error ? err.message : "Upload failed — try again"
    );
  } finally {
    setIsUploading(false);
  }
}
```

- [ ] **Step 3: Replace the image_url field**

Find the existing image URL field:

```tsx
        {/* Image URL */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="label" htmlFor="image_url">Image URL</label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={product?.image_url ?? ""}
            className="input font-mono text-[13px]"
            placeholder="https://..."
          />
        </div>
```

Replace with:

```tsx
        {/* Product Image */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="label" htmlFor="image_url">Product Image</label>
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-ghost shrink-0 disabled:opacity-50"
                >
                  {isUploading ? "Uploading…" : "Choose file"}
                </button>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
                  or
                </span>
              </>
            ) : (
              <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
                Save first to upload ·
              </span>
            )}
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUploadError(null);
              }}
              placeholder="https://…"
              className="input flex-1 font-mono text-[13px]"
            />
          </div>
          {uploadError && (
            <p className="mt-1 font-mono text-[11px] text-red-500">
              {uploadError}
            </p>
          )}
        </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add "app/(recoverwell)/recoverwell/admin/products/ProductForm.tsx"
git commit -m "feat(rw): add product image file upload to admin form"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - ✅ Two public Supabase Storage buckets — Task 1
  - ✅ Upload Route Handler (service-role, validates bucket, returns public URL) — Task 3
  - ✅ Password validation utility — Task 2
  - ✅ Portal settings page: logo upload + paste URL, practice name, contact email, doctor name — Task 5
  - ✅ Settings Server Action (parallel update rw_practices + rw_doctors) — Task 4
  - ✅ Settings link in dashboard header — Task 6
  - ✅ Product form: file upload OR paste URL, edit-only restriction, upload error display — Task 7
  - ✅ File upload only on edit (new product shows "Save first to upload") — Task 7 Step 3

- [x] **No placeholders:** All code is complete.

- [x] **Type consistency:**
  - `DoctorWithPractice` from `lib/recoverwell/auth.ts` has `practice.id`, `practice.name`, `practice.logo_url`, `practice.contact_email` — all used correctly in Task 5 ✅
  - `saveSettings(formData: FormData)` defined in Task 4, imported in Task 5 ✅
  - `fetch("/api/upload")` in Tasks 5 and 7 resolves to Route Handler created in Task 3 ✅
  - `product?.id` guarded in Task 7 `handleImageFileChange` — won't run on new products ✅
  - `imageUrl` state initialized from `product?.image_url ?? ""` in Task 7, passed as `value` to controlled input, also sent as `name="image_url"` in formData to existing `upsertProduct` action ✅
