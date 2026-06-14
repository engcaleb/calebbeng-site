-- RecoverWell Phase 1 schema
-- All tables prefixed rw_ to scope them within the shared calebbeng-site project.

create table rw_practices (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  contact_email text,
  created_at  timestamptz not null default now()
);

create table rw_doctors (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references rw_practices(id) on delete cascade,
  name          text not null,
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table rw_products (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  category             text not null,
  image_url            text,
  default_instructions text,
  -- Phase 1: direct Amazon link; swap for affiliate URL when Associates approved
  buy_url              text,
  is_active            boolean not null default true,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now()
);

create table rw_recommendation_pages (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references rw_doctors(id) on delete cascade,
  surgery_type text not null,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (doctor_id, surgery_type)
);

create table rw_page_products (
  id                   uuid primary key default gen_random_uuid(),
  page_id              uuid not null references rw_recommendation_pages(id) on delete cascade,
  product_id           uuid not null references rw_products(id) on delete cascade,
  custom_instructions  text,
  sort_order           integer not null default 0,
  unique (page_id, product_id)
);

-- Indexes for common query patterns
create index on rw_doctors(practice_id);
create index on rw_recommendation_pages(doctor_id);
create index on rw_page_products(page_id);
create index on rw_products(is_active, sort_order);

-- RLS: enable on all tables (policies to be added when auth is wired up)
alter table rw_practices          enable row level security;
alter table rw_doctors            enable row level security;
alter table rw_products           enable row level security;
alter table rw_recommendation_pages enable row level security;
alter table rw_page_products      enable row level security;

-- Temporary open policies for development — replace with proper auth policies before launch
create policy "dev_all_practices"           on rw_practices           for all using (true) with check (true);
create policy "dev_all_doctors"             on rw_doctors             for all using (true) with check (true);
create policy "dev_all_products"            on rw_products            for all using (true) with check (true);
create policy "dev_all_recommendation_pages" on rw_recommendation_pages for all using (true) with check (true);
create policy "dev_all_page_products"       on rw_page_products       for all using (true) with check (true);
