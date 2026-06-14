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
