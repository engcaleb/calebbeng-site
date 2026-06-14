-- Dev seed: one practice, one doctor, LASIK + Cataract pages with product selections.
-- Safe to re-run (ON CONFLICT DO NOTHING throughout).
-- DELETE FROM rw_practices WHERE slug = 'prestige-vision-center'; to reset.

do $$
declare
  v_practice_id uuid;
  v_doctor_id   uuid;
  v_lasik_page  uuid;
  v_cat_page    uuid;
begin

  -- Practice
  insert into rw_practices (name, slug, contact_email)
  values ('Prestige Vision Center', 'prestige-vision-center', 'info@prestigevision.example')
  on conflict (slug) do nothing;

  select id into v_practice_id from rw_practices where slug = 'prestige-vision-center';

  -- Doctor (no auth user in dev)
  insert into rw_doctors (practice_id, name)
  select v_practice_id, 'Dr. Sarah Chen'
  where not exists (
    select 1 from rw_doctors where practice_id = v_practice_id and name = 'Dr. Sarah Chen'
  );

  select id into v_doctor_id from rw_doctors
  where practice_id = v_practice_id and name = 'Dr. Sarah Chen';

  -- LASIK page
  insert into rw_recommendation_pages (doctor_id, surgery_type, is_published)
  values (v_doctor_id, 'LASIK', true)
  on conflict (doctor_id, surgery_type) do update set is_published = true;

  select id into v_lasik_page from rw_recommendation_pages
  where doctor_id = v_doctor_id and surgery_type = 'LASIK';

  -- Cataract page
  insert into rw_recommendation_pages (doctor_id, surgery_type, is_published)
  values (v_doctor_id, 'Cataract', true)
  on conflict (doctor_id, surgery_type) do update set is_published = true;

  select id into v_cat_page from rw_recommendation_pages
  where doctor_id = v_doctor_id and surgery_type = 'Cataract';

  -- LASIK products (doctor-specific custom instructions on a few)
  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 1 from rw_products where slug = 'systane-ultra-pf-vials'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id,
    'Use 4 times daily for the first 2 weeks, then as needed. Do not touch the vial tip to your eye.',
    2 from rw_products where slug = 'refresh-optive-mega3-pf'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 3 from rw_products where slug = 'tifosi-swick'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id,
    'Wear every night for the first week to protect your eyes while sleeping. Resume normal sleep after 7 days unless instructed otherwise.',
    4 from rw_products where slug = 'manta-sleep-mask'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 5 from rw_products where slug = 'bruder-moist-heat-compress'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 6 from rw_products where slug = 'gunnar-intercept'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 7 from rw_products where slug = 'cliradex-eyelid-wipes'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_lasik_page, id, null, 8 from rw_products where slug = 'nordic-naturals-prodha-eye'
  on conflict (page_id, product_id) do nothing;

  -- Cataract products
  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id,
    'Use every 1–2 hours while awake for the first week. Preservative-free is essential — do not use any drops with preservatives during healing.',
    1 from rw_products where slug = 'systane-ultra-pf-vials'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 2 from rw_products where slug = 'retaine-mgd'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 3 from rw_products where slug = 'cocoons-fitovers'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 4 from rw_products where slug = 'eye-eco-onyix'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 5 from rw_products where slug = 'bruder-moist-heat-compress'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 6 from rw_products where slug = 'sea-band-anti-nausea'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 7 from rw_products where slug = 'cliradex-eyelid-wipes'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 8 from rw_products where slug = 'macuhealth-triple-carotenoid'
  on conflict (page_id, product_id) do nothing;

  insert into rw_page_products (page_id, product_id, custom_instructions, sort_order)
  select v_cat_page, id, null, 9 from rw_products where slug = 'preservision-areds2'
  on conflict (page_id, product_id) do nothing;

end $$;
