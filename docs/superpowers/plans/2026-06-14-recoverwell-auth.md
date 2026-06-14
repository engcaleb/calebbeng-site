# RecoverWell Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Supabase email/password auth for the doctor portal, protect `/portal/*` routes, and flip RLS policies from open dev stubs to real per-role policies.

**Architecture:** Middleware refreshes Supabase session cookies on every request. A `(protected)` route group layout calls `requireDoctor()` (wrapped in React `cache()`) to gate all portal pages — redirect to `/portal/login` if not authenticated. Admin mutations switch to a service-role client to survive the RLS flip.

**Tech Stack:** Next.js 16 (App Router), @supabase/ssr 0.12.0, Supabase Auth (email/password), Tailwind CSS v4, TypeScript

> **No automated test framework exists in this project.** Each task ends with a TypeScript check + manual browser verification instead of unit test runs.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/supabase/service.ts` | Service-role Supabase client (bypasses RLS) |
| Modify | `app/(recoverwell)/recoverwell/admin/products/actions.ts` | Switch mutations to service-role client |
| Modify | `middleware.ts` | Add Supabase session cookie refresh |
| Create | `lib/recoverwell/auth.ts` | `requireDoctor()` — verifies auth + fetches doctor record |
| Create | `app/(recoverwell)/recoverwell/portal/login/actions.ts` | `loginAction`, `logoutAction` server actions |
| Create | `app/(recoverwell)/recoverwell/portal/login/page.tsx` | Email/password login form |
| Delete | `app/(recoverwell)/recoverwell/portal/page.tsx` | Replaced by route group page below |
| Create | `app/(recoverwell)/recoverwell/portal/(protected)/layout.tsx` | Auth gate for `/portal` and future portal pages |
| Create | `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx` | Portal dashboard (doctor name, practice, logout) |
| Create | `supabase/migrations/20260614000003_rw_rls_policies.sql` | Real RLS policies replacing dev stubs |

---

## Task 1: Service-role Supabase client

**Files:**
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd ~/Desktop/calebbeng-site && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/service.ts
git commit -m "feat(rw): add service-role Supabase client"
```

---

## Task 2: Switch admin mutations to service-role client

Admin write operations must bypass RLS (which we tighten in Task 9). The service client uses `SUPABASE_SERVICE_ROLE_KEY` which already exists in Vercel env.

**Files:**
- Modify: `app/(recoverwell)/recoverwell/admin/products/actions.ts`

- [ ] **Step 1: Replace the import and client call**

Replace the entire file with:

```typescript
// app/(recoverwell)/recoverwell/admin/products/actions.ts
"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function upsertProduct(formData: FormData) {
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;
  const payload = {
    name: (formData.get("name") as string).trim(),
    slug: (formData.get("slug") as string).trim(),
    category: formData.get("category") as string,
    image_url: (formData.get("image_url") as string).trim() || null,
    default_instructions:
      (formData.get("default_instructions") as string).trim() || null,
    buy_url: (formData.get("buy_url") as string).trim() || null,
    sort_order: parseInt(formData.get("sort_order") as string, 10) || 0,
    is_active: formData.get("is_active") === "true",
  };

  if (id) {
    const { error } = await supabase
      .from("rw_products")
      .update(payload)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("rw_products").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/recoverwell/admin/products");
  redirect("/recoverwell/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string;
  const current = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("rw_products")
    .update({ is_active: !current })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/recoverwell/admin/products");
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(recoverwell\)/recoverwell/admin/products/actions.ts
git commit -m "feat(rw): switch admin mutations to service-role client"
```

---

## Task 3: Add session refresh to middleware

The current `middleware.ts` only does hostname rewriting. We add Supabase session cookie refresh before the rewrite logic. This keeps auth tokens fresh on every navigation so Server Components always see a valid session.

> **Why `middleware` not `proxy`:** Next.js 16 renamed `middleware.ts` → `proxy.ts`, but Vercel still requires `middleware.ts` for this project's hostname rewrite to work. Keep the `middleware` export name.

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Replace the file**

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // --- Supabase session refresh ---
  // Collect cookies Supabase wants to set, then apply them to whichever
  // response we ultimately return (next or rewrite).
  const pendingCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    },
  );

  // getUser() refreshes the access token if it is near expiry.
  // Return value is intentionally ignored here — auth decisions happen in layouts.
  await supabase.auth.getUser();

  // --- Hostname rewrite for recoverwell.calebbeng.com ---
  const hostname = request.headers.get("host") ?? "";
  const isRecoverWell =
    hostname === "recoverwell.calebbeng.com" ||
    hostname.startsWith("recoverwell.calebbeng.com:");

  let response: NextResponse;

  if (!isRecoverWell) {
    response = NextResponse.next({ request });
  } else {
    const { pathname, search } = request.nextUrl;

    if (pathname.startsWith("/recoverwell")) {
      response = NextResponse.next({ request });
    } else {
      const rewritten = new URL(
        `/recoverwell${pathname === "/" ? "" : pathname}${search}`,
        request.url,
      );
      response = NextResponse.rewrite(rewritten);
    }
  }

  // Apply any auth cookies to the final response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify hostname rewrite still works**

```bash
npm run dev
```

Visit `http://localhost:3000/recoverwell` — should show the RecoverWell landing page (no errors in terminal). Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(rw): add Supabase session refresh to middleware"
```

---

## Task 4: requireDoctor() DAL helper

`requireDoctor()` is the single source of truth for "is this request from a valid, known doctor?" It is wrapped in React `cache()` so multiple callers in the same request (layout + page) result in one Supabase round-trip.

**Files:**
- Create: `lib/recoverwell/auth.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/recoverwell/auth.ts
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DoctorWithPractice = {
  id: string;
  name: string;
  auth_user_id: string;
  practice_id: string;
  created_at: string;
  practice: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    contact_email: string | null;
  };
};

export const requireDoctor = cache(async (): Promise<DoctorWithPractice> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/recoverwell/portal/login");

  const { data: doctor, error } = await supabase
    .from("rw_doctors")
    .select("*, practice:rw_practices(*)")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !doctor) redirect("/recoverwell/portal/login");

  // Supabase nested selects type the joined record as an array; cast safely.
  const raw = doctor as unknown as Omit<DoctorWithPractice, "practice"> & {
    practice: DoctorWithPractice["practice"] | DoctorWithPractice["practice"][];
  };

  return {
    ...raw,
    practice: Array.isArray(raw.practice) ? raw.practice[0] : raw.practice,
  } as DoctorWithPractice;
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/recoverwell/auth.ts
git commit -m "feat(rw): add requireDoctor() DAL helper"
```

---

## Task 5: Login server actions

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/login/actions.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/(recoverwell)/recoverwell/portal/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/recoverwell/portal/login?error=invalid_credentials");
  }

  redirect("/recoverwell/portal");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/recoverwell/portal/login");
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/login/actions.ts"
git commit -m "feat(rw): add login/logout server actions"
```

---

## Task 6: Login page

Uses the `label`, `input`, and `btn-primary` CSS utilities already defined in `app/globals.css`.

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/login/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
// app/(recoverwell)/recoverwell/portal/login/page.tsx
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e3da] bg-white p-8 shadow-sm">
        <h1 className="mb-6 font-mono text-lg font-semibold text-[#1c1a17]">
          RecoverWell Portal
        </h1>

        {error === "invalid_credentials" && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 font-mono text-sm text-red-600">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify login page renders**

```bash
npm run dev
```

Visit `http://localhost:3000/recoverwell/portal/login` — you should see a "RecoverWell Portal" heading with email/password fields and a "Sign in" button. Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/login/page.tsx"
git commit -m "feat(rw): add portal login page"
```

---

## Task 7: Portal route group and auth-gate layout

Next.js route groups (`(name)`) don't affect URL paths. We put the protected portal page inside `(protected)/` so its layout can gate auth without affecting the `/portal/login` route, which sits outside the group.

**Files:**
- Delete: `app/(recoverwell)/recoverwell/portal/page.tsx` (replaced in Task 8)
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/layout.tsx`

- [ ] **Step 1: Delete the existing portal stub**

```bash
rm "app/(recoverwell)/recoverwell/portal/page.tsx"
```

- [ ] **Step 2: Create the auth-gate layout**

```typescript
// app/(recoverwell)/recoverwell/portal/(protected)/layout.tsx
import { requireDoctor } from "@/lib/recoverwell/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /portal/login if not authenticated.
  // React cache() ensures this shares the getUser() call with the page below.
  await requireDoctor();
  return <>{children}</>;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/layout.tsx"
git rm "app/(recoverwell)/recoverwell/portal/page.tsx"
git commit -m "feat(rw): add portal auth-gate layout with route group"
```

---

## Task 8: Portal dashboard page

**Files:**
- Create: `app/(recoverwell)/recoverwell/portal/(protected)/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
// app/(recoverwell)/recoverwell/portal/(protected)/page.tsx
import { requireDoctor } from "@/lib/recoverwell/auth";
import { logoutAction } from "../login/actions";

export default async function PortalPage() {
  const doctor = await requireDoctor();

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-semibold text-[#1c1a17]">
              Welcome, Dr. {doctor.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#1c1a17]/50">
              {doctor.practice.name}
            </p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#e8e3da] bg-white p-6">
          <p className="font-mono text-sm text-[#1c1a17]/50">
            Your recommendation pages will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(recoverwell)/recoverwell/portal/(protected)/page.tsx"
git commit -m "feat(rw): add portal dashboard page"
```

---

## Task 9: RLS migration

Drops open `dev_all_*` policies and replaces them with real per-role policies. Admin operations use the service-role client (bypasses RLS entirely — no policy needed for writes).

**Files:**
- Create: `supabase/migrations/20260614000003_rw_rls_policies.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260614000003_rw_rls_policies.sql
-- Replace open dev policies with real per-role RLS.

-- Drop open dev policies
drop policy if exists "dev_all_practices"              on rw_practices;
drop policy if exists "dev_all_doctors"                on rw_doctors;
drop policy if exists "dev_all_products"               on rw_products;
drop policy if exists "dev_all_recommendation_pages"   on rw_recommendation_pages;
drop policy if exists "dev_all_page_products"          on rw_page_products;

-- ── rw_practices ─────────────────────────────────────────────────────────────
-- Patient pages look up practices by slug — public read required.
create policy "practices_public_select"
  on rw_practices for select using (true);

-- ── rw_products ──────────────────────────────────────────────────────────────
-- Public read (patient pages + future portal catalog). Active filter is
-- enforced in app layer queries, not in RLS, so portal can see all products.
create policy "products_public_select"
  on rw_products for select using (true);

-- ── rw_doctors ───────────────────────────────────────────────────────────────
-- Patient pages look up doctors by practice — public read required.
create policy "doctors_public_select"
  on rw_doctors for select using (true);

-- Doctors can update their own record (e.g. display name).
create policy "doctors_self_update"
  on rw_doctors for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ── rw_recommendation_pages ──────────────────────────────────────────────────
-- Anon: only published pages (patient-facing URLs).
create policy "pages_anon_select_published"
  on rw_recommendation_pages for select
  using (is_published = true);

-- Authenticated doctor: select own pages (published or not).
create policy "pages_doctor_select"
  on rw_recommendation_pages for select
  using (
    doctor_id in (
      select id from rw_doctors where auth_user_id = auth.uid()
    )
  );

create policy "pages_doctor_insert"
  on rw_recommendation_pages for insert
  with check (
    doctor_id in (
      select id from rw_doctors where auth_user_id = auth.uid()
    )
  );

create policy "pages_doctor_update"
  on rw_recommendation_pages for update
  using (
    doctor_id in (
      select id from rw_doctors where auth_user_id = auth.uid()
    )
  )
  with check (
    doctor_id in (
      select id from rw_doctors where auth_user_id = auth.uid()
    )
  );

create policy "pages_doctor_delete"
  on rw_recommendation_pages for delete
  using (
    doctor_id in (
      select id from rw_doctors where auth_user_id = auth.uid()
    )
  );

-- ── rw_page_products ─────────────────────────────────────────────────────────
-- Anon: only products on published pages.
create policy "page_products_anon_select"
  on rw_page_products for select
  using (
    page_id in (
      select id from rw_recommendation_pages where is_published = true
    )
  );

-- Authenticated doctor: manage products on their own pages.
create policy "page_products_doctor_select"
  on rw_page_products for select
  using (
    page_id in (
      select id from rw_recommendation_pages
      where doctor_id in (
        select id from rw_doctors where auth_user_id = auth.uid()
      )
    )
  );

create policy "page_products_doctor_insert"
  on rw_page_products for insert
  with check (
    page_id in (
      select id from rw_recommendation_pages
      where doctor_id in (
        select id from rw_doctors where auth_user_id = auth.uid()
      )
    )
  );

create policy "page_products_doctor_update"
  on rw_page_products for update
  using (
    page_id in (
      select id from rw_recommendation_pages
      where doctor_id in (
        select id from rw_doctors where auth_user_id = auth.uid()
      )
    )
  )
  with check (
    page_id in (
      select id from rw_recommendation_pages
      where doctor_id in (
        select id from rw_doctors where auth_user_id = auth.uid()
      )
    )
  );

create policy "page_products_doctor_delete"
  on rw_page_products for delete
  using (
    page_id in (
      select id from rw_recommendation_pages
      where doctor_id in (
        select id from rw_doctors where auth_user_id = auth.uid()
      )
    )
  );
```

- [ ] **Step 2: Commit the migration file**

```bash
git add supabase/migrations/20260614000003_rw_rls_policies.sql
git commit -m "feat(rw): real RLS policies replacing open dev stubs"
```

- [ ] **Step 3: Apply the migration to the remote Supabase project**

```bash
supabase db push
```

Expected output ends with: `Finished supabase db push.`

If you see "Remote database is ahead of local migrations", run `supabase db pull` first to sync, then re-run `db push`.

- [ ] **Step 4: Verify patient pages still work**

Start dev server:
```bash
npm run dev
```

Visit `http://localhost:3000/recoverwell/dr/prestige-vision-center/lasik` — should still load the LASIK patient page with products. Visit `/recoverwell/dr/prestige-vision-center/cataract` — same.

Verify admin page still works: `http://localhost:3000/recoverwell/admin/products` — product list should load, toggle/edit should work (uses service role).

Ctrl+C to stop.

---

## Task 10: Create test doctor user and link to DB record

The test practice "Prestige Vision Center" already has an `rw_doctors` row in the database, but `auth_user_id` is null. We need to create a Supabase Auth user and link it.

- [ ] **Step 1: Create auth user in Supabase dashboard**

1. Go to your Supabase project dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `doctor@prestige.test` (or any email you'll remember)
   - Password: something secure
4. Click **Create user**
5. Copy the **UUID** of the newly created user (shown in the users list)

- [ ] **Step 2: Link auth user to rw_doctors**

In the Supabase dashboard → **SQL Editor**, run:

```sql
update rw_doctors
set auth_user_id = '<paste-uuid-here>'
where practice_id = (
  select id from rw_practices where slug = 'prestige-vision-center'
)
returning id, name, auth_user_id;
```

Expected: one row returned with the doctor's name and the UUID you pasted.

---

## Task 11: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify unauthenticated redirect**

Visit `http://localhost:3000/recoverwell/portal` — should redirect immediately to `/recoverwell/portal/login`.

- [ ] **Step 3: Verify bad credentials**

On the login page, enter wrong email/password, click Sign in. Should reload `/portal/login?error=invalid_credentials` with the red error message "Invalid email or password."

- [ ] **Step 4: Verify successful login**

Enter the credentials from Task 10 (e.g. `doctor@prestige.test`). Click Sign in. Should redirect to `/portal` showing:
- "Welcome, Dr. [doctor name]"
- "Prestige Vision Center" subheading
- "Your recommendation pages will appear here." placeholder

- [ ] **Step 5: Verify session persists on refresh**

Refresh the page at `/portal`. Should stay on the dashboard (not redirect to login).

- [ ] **Step 6: Verify logout**

Click "Sign out". Should redirect to `/portal/login`. Visiting `/portal` again should redirect back to `/portal/login`.

- [ ] **Step 7: Commit any fixes from verification**

If you needed to fix anything during verification:

```bash
git add -p
git commit -m "fix(rw): <describe what you fixed>"
```

- [ ] **Step 8: Push to main and verify Vercel deployment**

```bash
git push origin main
```

Wait for Vercel to deploy (auto-deploys on push to main). Then verify the same login flow on `https://recoverwell.calebbeng.com/portal`.
