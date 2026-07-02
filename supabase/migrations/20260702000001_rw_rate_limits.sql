-- Shared counter store for rate-limiting unauthenticated auth endpoints
-- (register, join, login, forgot-password). Written only via the
-- service-role client from lib/recoverbright/rate-limit.ts — RLS is
-- enabled with no policies defined, so anon/authenticated clients get
-- zero access.
create table if not exists rw_rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rw_rate_limits_key_created_idx
  on rw_rate_limits (key, created_at);

alter table rw_rate_limits enable row level security;
