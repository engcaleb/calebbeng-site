# RecoverWell Auth — Design Spec
**Date:** 2026-06-14

## Goal

Wire up Supabase Auth for the doctor portal. Doctors can log in with email/password, access `/portal/*`, and get redirected to `/portal/login` when not authenticated. Tighten RLS policies from open dev stubs to real per-role policies. Switch admin mutations to service-role client so they survive the RLS flip.

---

## Architecture

**Pattern:** Layout gate + middleware session refresh (Option 1)

- `middleware.ts` only handles two things: hostname rewrite for `recoverwell.calebbeng.com` and Supabase session cookie refresh. It does NOT do auth checks.
- `/portal/layout.tsx` is the auth gate. It calls `requireDoctor()` which does `getUser()` + DB lookup and redirects to `/portal/login` if the user is not authenticated or not in `rw_doctors`.
- Individual portal pages call `requireDoctor()` themselves to get the doctor record (cheap — session is already valid by the time layout runs).

---

## Files

### New

| File | Purpose |
|------|---------|
| `app/(recoverwell)/recoverwell/portal/login/page.tsx` | Email/password login form (Server Component with Client form) |
| `app/(recoverwell)/recoverwell/portal/login/actions.ts` | `loginAction` (signInWithPassword), `logoutAction` (signOut + redirect) |
| `app/(recoverwell)/recoverwell/portal/layout.tsx` | Calls `requireDoctor()` → redirects to `/portal/login` if not authed |
| `lib/recoverwell/auth.ts` | `requireDoctor()`: getUser() → rw_doctors lookup → redirect if either missing |
| `lib/supabase/service.ts` | `createServiceClient()` using `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS |
| `supabase/migrations/20260614000003_rw_rls_policies.sql` | Drops dev policies, adds real per-role policies |

### Modified

| File | Change |
|------|--------|
| `middleware.ts` | Add Supabase session refresh after hostname rewrite logic |
| `app/(recoverwell)/recoverwell/portal/page.tsx` | Replace "coming soon" stub with basic dashboard (doctor name + practice) |
| `app/(recoverwell)/recoverwell/admin/products/actions.ts` | Switch from `createClient()` to `createServiceClient()` for all mutations |

---

## Data Flow

### Login
1. Doctor visits `/portal` → layout calls `requireDoctor()` → no session → redirect to `/portal/login`
2. Doctor submits email/password → `loginAction` calls `supabase.auth.signInWithPassword()`
3. Supabase sets auth cookies (via SSR cookie handlers)
4. Redirect to `/portal`
5. Layout calls `requireDoctor()` → user found → pass through

### Per-request session refresh (middleware)
1. `middleware.ts` runs
2. Hostname rewrite runs first (as today)
3. Supabase SSR client created from request cookies
4. `supabase.auth.getUser()` called — refreshes tokens if near expiry, writes updated cookies to response
5. Request continues

### Logout
1. Doctor clicks logout → `logoutAction` → `supabase.auth.signOut()` → clears auth cookies → redirect to `/portal/login`

### `requireDoctor()` helper
```
getUser() from Supabase Auth
  → null user → redirect('/recoverwell/portal/login')
  → user found → SELECT from rw_doctors WHERE auth_user_id = user.id, include rw_practices(*)
    → no doctor record → redirect('/recoverwell/portal/login')
    → doctor found → return { ...doctor, practice: rw_practices }
```

---

## RLS Policies (migration `20260614000003`)

Drops all `dev_all_*` policies and replaces with:

### `rw_products`
- `anon` + `authenticated`: SELECT (all rows — active filter handled in app layer)
- Writes: service role only (no policy needed; service role bypasses RLS)

### `rw_practices`
- `anon` + `authenticated`: SELECT all

### `rw_doctors`
- `anon` + `authenticated`: SELECT all (patient pages need to look up doctor by practice)
- `authenticated`: UPDATE where `auth.uid() = auth_user_id`

### `rw_recommendation_pages`
- `anon`: SELECT where `is_published = true`
- `authenticated`: SELECT where `doctor_id IN (SELECT id FROM rw_doctors WHERE auth_user_id = auth.uid())`
- `authenticated`: INSERT/UPDATE/DELETE where `doctor_id IN (SELECT id FROM rw_doctors WHERE auth_user_id = auth.uid())`

### `rw_page_products`
- `anon`: SELECT where `page_id IN (SELECT id FROM rw_recommendation_pages WHERE is_published = true)`
- `authenticated`: SELECT/INSERT/UPDATE/DELETE where `page_id IN (SELECT id FROM rw_recommendation_pages WHERE doctor_id IN (SELECT id FROM rw_doctors WHERE auth_user_id = auth.uid()))`

---

## Portal Dashboard (stub)

`/portal/page.tsx` shows:
- "Welcome, Dr. [name]" heading
- Practice name
- Logout button (calls `logoutAction`)
- Placeholder cards for "My Pages" (to be built next sprint)

---

## Constraints

- `middleware.ts` keeps the `middleware` export name (not `proxy`) because Vercel still requires it for the hostname rewrite to work on `recoverwell.calebbeng.com`. See project memory.
- `getUser()` makes a network call to Supabase Auth on every protected page load. Acceptable for a B2B portal at this scale.
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is already set in Vercel env for Production + Development. Never expose it client-side.
- RLS migration must be applied to the remote Supabase project via `supabase db push` after commit.
