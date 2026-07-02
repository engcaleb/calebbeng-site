-- The public SELECT policy on rw_invites let anyone dump every invite row
-- (token, practice_id, expires_at) via the anon REST API
-- (GET /rest/v1/rw_invites?select=*) and self-register as a doctor on any
-- practice using a stolen token. Token validation during join is already
-- done server-side via the service-role client (see joinAction and
-- join/[token]/page.tsx), so no anon read access to this table is needed.
drop policy if exists rw_invites_select on rw_invites;
