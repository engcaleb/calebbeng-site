-- Seed catalog for RecoverWell Phase 1 — ophthalmology (LASIK + Cataract)
-- All fields are editable via /recoverwell/admin/products.
-- ON CONFLICT (slug) DO NOTHING makes this idempotent: safe to re-run.

insert into rw_products
  (name, slug, category, default_instructions, buy_url, is_active, sort_order)
values

-- ── ARTIFICIAL TEARS · PRESERVATIVE-FREE ────────────────────────────────
(
  'Systane Ultra PF Unit-Dose Vials',
  'systane-ultra-pf-vials',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed, up to 4 times daily or as directed. Use a fresh vial each time. Discard immediately after use.',
  'https://www.amazon.com/s?k=Systane+Ultra+Preservative+Free+unit+dose+vials&i=hpc',
  true, 1
),
(
  'Oasis TEARS PLUS Preservative Free',
  'oasis-tears-plus-pf',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. Can be used as frequently as every hour. Discard vial after single use.',
  'https://www.amazon.com/s?k=Oasis+TEARS+PLUS+Preservative+Free+unit+dose&i=hpc',
  true, 2
),
(
  'Refresh Optive Mega-3 PF',
  'refresh-optive-mega3-pf',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. The lipid layer formula is especially helpful if you experience dryness worse later in the day.',
  'https://www.amazon.com/s?k=Refresh+Optive+Mega-3+Preservative+Free&i=hpc',
  true, 3
),
(
  'Retaine MGD Emulsion Eye Drops',
  'retaine-mgd',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye up to 4 times daily. Shake well before use. The cationic emulsion stays on the eye surface longer than standard drops.',
  'https://www.amazon.com/s?k=Retaine+MGD+OCuSOFT+eye+drops&i=hpc',
  true, 4
),
(
  'Systane Complete PF Lubricant Eye Drops',
  'systane-complete-pf',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. This comprehensive formula addresses aqueous, lipid, and mucin layers simultaneously.',
  'https://www.amazon.com/s?k=Systane+Complete+Preservative+Free+eye+drops&i=hpc',
  true, 5
),
(
  'i-DROP PUR Lubricating Eye Drops',
  'i-drop-pur',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. Works with your blink to spread and retain moisture. Can be used as often as needed.',
  'https://www.amazon.com/s?k=i-DROP+PUR+eye+drops&i=hpc',
  true, 6
),
(
  'TheraTears Preservative Free Unit-Dose',
  'theratears-pf',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. Discard vial after single use. Electrolyte-balanced formula matches the natural tear film.',
  'https://www.amazon.com/s?k=TheraTears+Preservative+Free+unit+dose+eye+drops&i=hpc',
  true, 7
),
(
  'Bausch + Lomb Soothe XP PF Emollient Drops',
  'bausch-lomb-soothe-xp-pf',
  'Artificial Tears · Preservative-Free',
  'Instill 1–2 drops in each eye as needed. The emollient base is especially soothing for moderate-to-severe dryness.',
  'https://www.amazon.com/s?k=Bausch+Lomb+Soothe+XP+Preservative+Free&i=hpc',
  true, 8
),

-- ── UV PROTECTIVE EYEWEAR ───────────────────────────────────────────────
(
  'Wiley X SG-1 Sunglasses',
  'wiley-x-sg1',
  'UV Protective Eyewear',
  'Wear outdoors any time you are in sunlight. UV protection is essential during healing — your eyes are more sensitive after surgery. These wrap-around frames also protect against wind and debris.',
  'https://www.amazon.com/s?k=Wiley+X+SG-1+sunglasses&i=fashion',
  true, 20
),
(
  'Tifosi Swick Sunglasses',
  'tifosi-swick',
  'UV Protective Eyewear',
  'Wear outdoors during daylight hours while your eyes are healing. The lightweight wrap-around design protects from UV, wind, and dust.',
  'https://www.amazon.com/s?k=Tifosi+Swick+sunglasses+UV+wrap&i=fashion',
  true, 21
),
(
  'Cocoons Fitovers Classic Wrap Polarized',
  'cocoons-fitovers',
  'UV Protective Eyewear',
  'Wear over your existing glasses whenever outdoors. The polarized lens reduces glare, which is especially important during cataract recovery when glare sensitivity is common.',
  'https://www.amazon.com/s?k=Cocoons+fitovers+polarized+sunglasses+wrap&i=fashion',
  true, 22
),
(
  'Bobster Road Hog 2 Foam-Seal Sunglasses',
  'bobster-road-hog',
  'UV Protective Eyewear',
  'Wear outdoors, especially in windy or dusty conditions. The foam gasket creates a protective seal around your eyes — important for the first two weeks after surgery.',
  'https://www.amazon.com/s?k=Bobster+foam+gasket+seal+sunglasses+UV&i=fashion',
  true, 23
),

-- ── BLUE LIGHT GLASSES ─────────────────────────────────────────────────
(
  'Gunnar Intercept Computer Glasses',
  'gunnar-intercept',
  'Blue Light Glasses',
  'Wear when using screens — computers, phones, tablets. Especially important for the first 2–4 weeks of recovery when your eyes are adjusting. Use as much as you need.',
  'https://www.amazon.com/s?k=Gunnar+Intercept+computer+glasses+blue+light&i=fashion',
  true, 30
),
(
  'Pixel Eyewear Blue Light Glasses',
  'pixel-eyewear-bluelight',
  'Blue Light Glasses',
  'Wear when using screens during recovery. Available in clear and amber lens options — amber provides stronger blue light filtering.',
  'https://www.amazon.com/s?k=Pixel+Eyewear+blue+light+blocking+glasses&i=fashion',
  true, 31
),
(
  'Felix Gray Blue Light Glasses',
  'felix-gray-bluelight',
  'Blue Light Glasses',
  'Wear when using screens during recovery and beyond. The clear lens option is nearly imperceptible while still filtering blue light.',
  'https://felixgray.com/collections/blue-light-glasses',
  true, 32
),

-- ── SLEEP EYE SHIELD ───────────────────────────────────────────────────
(
  'Eye Eco Onyix Moisture Chamber Goggle',
  'eye-eco-onyix',
  'Sleep Eye Shield',
  'Wear while sleeping to prevent accidental eye rubbing. The moisture chamber also maintains humidity around the eye, reducing overnight dryness. Use nightly as recommended by your doctor.',
  'https://www.amazon.com/s?k=Eye+Eco+Onyix+moisture+chamber+goggle&i=hpc',
  true, 40
),
(
  'Bedtime Eyes Luxury Molded Eye Mask',
  'bedtime-eyes-molded-mask',
  'Sleep Eye Shield',
  'Wear during sleep to prevent rubbing. Molded cups protect eyes without contact pressure. Use nightly for the period recommended by your doctor.',
  'https://www.amazon.com/s?k=Bedtime+Eyes+eye+mask+molded+cups&i=hpc',
  true, 41
),
(
  'IMAK Eye Pillow',
  'imak-eye-pillow',
  'Sleep Eye Shield',
  'Apply over closed eyes during rest or sleep. The micro-air beads conform gently without pressure. Useful for relaxation and light protection during the healing period.',
  'https://www.amazon.com/s?k=IMAK+eye+pillow+compression+mask&i=hpc',
  true, 42
),

-- ── SILK SLEEP MASK ────────────────────────────────────────────────────
(
  'MANTA Sleep Mask',
  'manta-sleep-mask',
  'Silk Sleep Mask',
  'Wear during sleep. The zero-pressure cup design means the mask never touches your eyes directly — safe and comfortable for post-surgical use. Blocks all light.',
  'https://www.amazon.com/s?k=MANTA+sleep+mask+zero+eye+pressure&i=hpc',
  true, 50
),
(
  'MZOO 3D Contoured Sleep Mask',
  'mzoo-3d-sleep-mask',
  'Silk Sleep Mask',
  'Wear during sleep to block light. The 3D contoured cups prevent fabric from contacting your eyes. Wash regularly according to the included instructions.',
  'https://www.amazon.com/s?k=MZOO+sleep+mask+3D+contoured+eye+cup&i=hpc',
  true, 51
),
(
  'Alaska Bear Natural Silk Sleep Mask',
  'alaska-bear-silk-mask',
  'Silk Sleep Mask',
  'Wear during sleep to block light and reduce irritation. Natural mulberry silk is gentle on healing skin. Wash gently by hand.',
  'https://www.amazon.com/s?k=Alaska+Bear+Natural+Silk+Sleep+Mask&i=hpc',
  true, 52
),

-- ── MOIST HEAT COMPRESS ────────────────────────────────────────────────
(
  'Bruder Moist Heat Eye Compress',
  'bruder-moist-heat-compress',
  'Moist Heat Compress',
  'Microwave for 20–25 seconds (test on wrist first). Apply over closed eyes for 10 minutes. Use 1–2 times daily or as directed. The self-hydrating beads generate clean moist heat without adding water.',
  'https://www.amazon.com/s?k=Bruder+Moist+Heat+Eye+Compress&i=hpc',
  true, 60
),
(
  'Optase Moist Heat Eye Mask',
  'optase-moist-heat-mask',
  'Moist Heat Compress',
  'Microwave for 25–30 seconds. Test temperature before applying. Place over closed eyes for 10 minutes. Use daily or as directed.',
  'https://www.amazon.com/s?k=Optase+Moist+Heat+Eye+Mask&i=hpc',
  true, 61
),
(
  'MediBeads Washable Eye Mask',
  'medibeads-eye-mask',
  'Moist Heat Compress',
  'Microwave for 20–25 seconds. Apply over closed eyes for 10 minutes. The ceramic microspheres absorb ambient moisture and convert it to moist heat — no water needed.',
  'https://www.amazon.com/s?k=MediBeads+washable+eye+mask+moist+heat&i=hpc',
  true, 62
),

-- ── COOLING GEL EYE MASK ───────────────────────────────────────────────
(
  'TheraPearl Eye Mask Hot/Cold',
  'therapearl-eye-mask',
  'Cooling Gel Eye Mask',
  'For cold therapy: refrigerate for 15+ minutes, then apply over closed eyes for 10–15 minutes to reduce swelling and discomfort. For warm therapy: microwave 10–15 seconds. Do not freeze.',
  'https://www.amazon.com/s?k=TheraPearl+Eye+Mask+hot+cold&i=hpc',
  true, 70
),
(
  '111SKIN Celestial Black Diamond Eye Mask',
  '111skin-celestial-eye-mask',
  'Cooling Gel Eye Mask',
  'Chill in refrigerator before use. Apply the single-use patches under closed eyes for 15–20 minutes. For a cooling, soothing sensation that reduces puffiness and discomfort.',
  'https://www.amazon.com/s?k=111SKIN+Black+Diamond+Eye+Mask&i=beauty',
  true, 71
),

-- ── EYELID HYGIENE WIPES ───────────────────────────────────────────────
(
  'Cliradex Natural Eyelid Cleanser Wipes',
  'cliradex-eyelid-wipes',
  'Eyelid Hygiene Wipes',
  'Use once daily, morning or night. Close your eye and gently scrub along the lash line with the towelette. Allow to dry — do not rinse. The tea tree formula reduces lid bacteria during healing.',
  'https://www.amazon.com/s?k=Cliradex+natural+eyelid+cleanser+wipes&i=hpc',
  true, 80
),
(
  'Zocular Zocufoam Eyelid Cleanser',
  'zocular-zocufoam',
  'Eyelid Hygiene Wipes',
  'Apply one pump to a clean fingertip or pad. Gently massage along closed eyelid margins for 30–60 seconds. Rinse. Use once daily or as directed. The okra-derived formula is gentle on sensitive post-surgical skin.',
  'https://www.amazon.com/s?k=Zocular+Zocufoam+eyelid+cleanser&i=hpc',
  true, 81
),
(
  'OCuSOFT Lid Scrub Original Pre-Moistened Pads',
  'ocusoft-lid-scrub',
  'Eyelid Hygiene Wipes',
  'Close your eye and gently scrub the eyelid and lash line. Allow to air dry — do not rinse. Use once daily or as directed. Standard eyelid cleaning protocol used in clinical settings.',
  'https://www.amazon.com/s?k=OCuSOFT+Lid+Scrub+Original+pre-moistened+pads&i=hpc',
  true, 82
),

-- ── OMEGA-3 SUPPLEMENT ────────────────────────────────────────────────
(
  'Nordic Naturals ProDHA Eye',
  'nordic-naturals-prodha-eye',
  'Omega-3 Supplement',
  'Take 2 soft gels daily with a meal. Consistent daily use for at least 90 days produces the most benefit for tear film stability and dry eye. Refrigerate after opening.',
  'https://www.amazon.com/s?k=Nordic+Naturals+ProDHA+Eye+omega-3&i=hpc',
  true, 90
),
(
  'EyePromise Screen Shield Pro',
  'eyepromise-screen-shield-pro',
  'Omega-3 Supplement',
  'Take as directed with a meal. This supplement combines zeaxanthin with omega-3s to support both dry eye recovery and protection against digital eye strain during screen use.',
  'https://www.amazon.com/s?k=EyePromise+Screen+Shield+Pro+zeaxanthin&i=hpc',
  true, 91
),
(
  'ScienceBased Health HydroEye',
  'sciencebased-health-hydroeye',
  'Omega-3 Supplement',
  'Take 4 soft gels daily with meals (can split into 2 doses). The GLA + omega-3 combination addresses the inflammatory component of dry eye from both angles. Allow 60–90 days for full effect.',
  'https://www.amazon.com/s?k=ScienceBased+Health+HydroEye+dry+eye&i=hpc',
  true, 92
),

-- ── AREDS2 SUPPLEMENT ─────────────────────────────────────────────────
(
  'MacuHealth Triple Carotenoid Formula',
  'macuhealth-triple-carotenoid',
  'AREDS2 Supplement',
  'Take 1 soft gel daily with your largest meal. Consistent daily use is essential — this supplement builds macular pigment over months, not days. Do not miss doses.',
  'https://www.amazon.com/s?k=MacuHealth+triple+carotenoid+lutein+zeaxanthin&i=hpc',
  true, 100
),
(
  'PreserVision AREDS2 Soft Gels',
  'preservision-areds2',
  'AREDS2 Supplement',
  'Take 2 soft gels daily with meals (one in the morning, one at night). The AREDS2 formula is the clinical gold standard for macular support. Take consistently every day.',
  'https://www.amazon.com/s?k=PreserVision+AREDS2+soft+gels+Bausch+Lomb&i=hpc',
  true, 101
),

-- ── ANTI-NAUSEA ────────────────────────────────────────────────────────
(
  'Sea-Band Acupressure Anti-Nausea Wristband',
  'sea-band-anti-nausea',
  'Anti-Nausea',
  'Apply so the plastic button presses on the P6 (Nei Kuan) point — three finger-widths from the wrist crease, between the two central tendons. Wear on both wrists starting before your procedure and continue for 24–48 hours as needed.',
  'https://www.amazon.com/s?k=Sea-Band+acupressure+anti-nausea+wristband&i=hpc',
  true, 110
),
(
  'Reliefband Classic Anti-Nausea Wristband',
  'reliefband-classic',
  'Anti-Nausea',
  'Wear on the inner wrist as directed in the included instructions. The FDA-cleared neuromodulation signal works continuously. Start 30–60 minutes before you expect nausea and wear as long as needed.',
  'https://www.amazon.com/s?k=Reliefband+Classic+anti-nausea+wristband&i=hpc',
  true, 111
),
(
  'Ginger People Gin Gins Ginger Chews',
  'gin-gins-ginger-chews',
  'Anti-Nausea',
  'Chew 1–2 pieces as needed for nausea relief. Ginger has well-documented anti-nausea properties and is safe to use alongside your medications. Keep a bag handy for the first 24 hours after surgery.',
  'https://www.amazon.com/s?k=Ginger+People+Gin+Gins+ginger+chews+original&i=grocery',
  true, 112
),

-- ── HUMIDIFIER ─────────────────────────────────────────────────────────
(
  'Canopy Humidifier',
  'canopy-humidifier',
  'Humidifier',
  'Run in your bedroom while sleeping and in your primary workspace during the recovery period. Aim for 40–60% indoor humidity. The evaporative design produces no white dust and requires no filter replacement for 45 days.',
  'https://www.canopyhumidifier.com/products/humidifier',
  true, 120
),
(
  'Levoit LV600HH Ultrasonic Humidifier',
  'levoit-lv600hh',
  'Humidifier',
  'Run in your bedroom while sleeping. Set to warm or cool mist as preferred. Maintain indoor humidity between 40–60% — use the built-in humidity sensor. Clean weekly to prevent mineral buildup.',
  'https://www.amazon.com/s?k=Levoit+LV600HH+ultrasonic+humidifier&i=garden',
  true, 121
),

-- ── OTHER ──────────────────────────────────────────────────────────────
(
  'Iris Software Blue Light Filter',
  'iris-software',
  'Other',
  'Install on your Mac or PC and enable during all screen sessions. Set to a warmer color temperature than default, especially in the evenings. Runs in the background automatically once configured.',
  'https://iristech.co/iris-software',
  true, 130
)

on conflict (slug) do nothing;
