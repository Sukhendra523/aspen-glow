-- Migration: 20261024000008_merge_poster_catalogue_data.sql
-- Purpose: Merge and update services, packages, bundles, contact settings, and poster templates
--          using the 4 canonical Aspen Glow reference posters as the source of truth.
--          No existing service/package/bundle rows are deleted; existing records are updated/renamed in-place.
-- Rollback:
--   ALTER TABLE public.packages DROP COLUMN IF EXISTS package_group, DROP COLUMN IF EXISTS tagline, DROP COLUMN IF EXISTS badge_text, DROP COLUMN IF EXISTS card_color;
--   ALTER TABLE public.bundles DROP COLUMN IF EXISTS tagline, DROP COLUMN IF EXISTS badge_text, DROP COLUMN IF EXISTS card_color;

-- 1. Add poster-presentation metadata columns to packages and bundles
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS package_group text NOT NULL DEFAULT 'Multi-Service Packages' CHECK (char_length(package_group) <= 80),
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 160),
  ADD COLUMN IF NOT EXISTS badge_text text NOT NULL DEFAULT '' CHECK (char_length(badge_text) <= 60),
  ADD COLUMN IF NOT EXISTS card_color text NOT NULL DEFAULT '' CHECK (char_length(card_color) <= 20);

ALTER TABLE public.bundles
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 160),
  ADD COLUMN IF NOT EXISTS badge_text text NOT NULL DEFAULT '' CHECK (char_length(badge_text) <= 60),
  ADD COLUMN IF NOT EXISTS card_color text NOT NULL DEFAULT '' CHECK (char_length(card_color) <= 20);

-- Allow 2:3 full poster format (portrait_1080x1620) in public.posters
ALTER TABLE public.posters
  DROP CONSTRAINT IF EXISTS posters_format_key_check;
ALTER TABLE public.posters
  ADD CONSTRAINT posters_format_key_check
  CHECK (format_key IN ('square_1080', 'portrait_1080x1350', 'portrait_1080x1620'));

-- 2. Update Contact Settings with full address and Netlify booking URL from reference posters
UPDATE public.contact_settings
SET
  address = '703 Aspen Tower, DevSai Sports Home, Sector 1, Bisrakh, Greater Noida',
  booking_url = CASE
    WHEN booking_url = '' THEN 'https://aspen-glow.netlify.app'
    ELSE booking_url
  END,
  appointment_note = 'Advance Booking Recommended'
WHERE id = 1;

-- 3. Upsert Services (update existing services with reference poster prices/inclusions and insert new component services)
INSERT INTO public.services (
  name,
  category,
  description,
  inclusions,
  price_inr,
  price_label,
  icon_name,
  display_order,
  status
)
VALUES
  -- Image 4: Makeup & Styling Packages / Services
  (
    'Light Party Makeup',
    'Makeup & Styling',
    'Includes: Professional Makeup, Elegant Hairstyle & Saree Draping.',
    '["Includes: Professional Makeup, Elegant Hairstyle & Saree Draping."]'::jsonb,
    1499,
    '',
    'ColorLens',
    1,
    'published'
  ),
  (
    'Glamour Pro Makeup',
    'Makeup & Styling',
    'Includes: Full Party Makeup, Hairstyle & Saree/Lehenga Draping.',
    '["Includes: Full Party Makeup, Hairstyle & Saree/Lehenga Draping."]'::jsonb,
    1999,
    '',
    'ColorLens',
    2,
    'published'
  ),
  -- Image 4: Bridal & Pre-Bridal Services
  (
    'Haldi / Mehndi Makeup',
    'Bridal & Pre-Bridal',
    'A radiant look for your pre-wedding ceremonies.',
    '["A radiant look for your pre-wedding ceremonies.", "Includes: Makeup, Hairstyling & Lehnga/Saree Draping."]'::jsonb,
    2499,
    '',
    'Cake',
    1,
    'published'
  ),
  (
    'Engagement Makeup',
    'Bridal & Pre-Bridal',
    'Includes: Makeup, Hairstyling & Lehnga Draping.',
    '["Includes: Makeup, Hairstyling & Lehnga Draping."]'::jsonb,
    2999,
    '',
    'FaceRetouchingNatural',
    2,
    'published'
  ),
  (
    'HD Bridal Makeup',
    'Bridal & Pre-Bridal',
    'Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping.',
    '["Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping."]'::jsonb,
    14999,
    '',
    'Star',
    3,
    'published'
  ),
  -- Image 4: À La Carte Haircuts
  ('Step Cut', 'Hair Services', 'Professional Step Cut', '[]'::jsonb, 350, '', 'ContentCut', 1, 'published'),
  ('Layer Cut', 'Hair Services', 'Professional Layer Cut', '[]'::jsonb, 250, '', 'ContentCut', 2, 'published'),
  ('V-Shape Cut', 'Hair Services', 'Professional V-Shape Cut', '[]'::jsonb, 200, '', 'ContentCut', 3, 'published'),
  ('U-Shape Cut', 'Hair Services', 'Professional U-Shape Cut', '[]'::jsonb, 150, '', 'ContentCut', 4, 'published'),
  ('Baby Cut', 'Hair Services', 'Professional Baby Cut', '[]'::jsonb, 100, '', 'ContentCut', 5, 'published'),
  -- Image 4: Mehndi Artistry
  (
    'Mehndi Artistry',
    'Mehndi Artistry',
    'Intricate and beautiful Mehndi designs for all occasions.',
    '[]'::jsonb,
    99,
    'Starting from just',
    'ColorLens',
    1,
    'published'
  ),
  -- Image 1: Multi-Service Package Component Services
  ('Facial Cleanup', 'Beauty & Skincare', 'Deep pore cleansing and skin refresh.', '[]'::jsonb, 399, '', 'AutoAwesome', 1, 'published'),
  ('Full Hand Waxing', 'Beauty & Skincare', 'Smooth waxing for full arms.', '[]'::jsonb, 250, '', 'AutoAwesome', 2, 'published'),
  ('Threading forehead/Upper lips', 'Beauty & Skincare', 'Forehead and upper-lip threading.', '[]'::jsonb, 50, '', 'AutoAwesome', 3, 'published'),
  ('D-Tan Facial', 'Beauty & Skincare', 'Detan and brightening facial treatment.', '[]'::jsonb, 599, '', 'Star', 4, 'published'),
  ('Half Leg Waxing', 'Beauty & Skincare', 'Smooth waxing for half legs.', '[]'::jsonb, 250, '', 'AutoAwesome', 5, 'published'),
  ('Lotus Facial', 'Beauty & Skincare', 'Signature Lotus glow facial.', '[]'::jsonb, 799, '', 'AutoAwesome', 6, 'published'),
  ('Skin Brightening Bleach', 'Beauty & Skincare', 'Gentle skin brightening bleach.', '[]'::jsonb, 200, '', 'AutoAwesome', 7, 'published'),
  ('Full Leg Waxing', 'Beauty & Skincare', 'Complete waxing for full legs.', '[]'::jsonb, 400, '', 'AutoAwesome', 8, 'published'),
  ('Bridal O3 facial 10 step', 'Beauty & Skincare', '10-step Bridal O3+ facial treatment.', '[]'::jsonb, 1199, '', 'Star', 9, 'published'),
  ('Golden Bleach (face, neck, back)', 'Beauty & Skincare', 'Golden glow bleach for face, neck, and back.', '[]'::jsonb, 350, '', 'Star', 10, 'published'),
  ('O3 wax (full hand, half leg)', 'Beauty & Skincare', 'Premium O3 waxing for full hand and half leg.', '[]'::jsonb, 550, '', 'Star', 11, 'published'),
  ('Threading (forehead, upper lips)', 'Beauty & Skincare', 'Forehead and upper lips threading.', '[]'::jsonb, 50, '', 'AutoAwesome', 12, 'published'),
  -- Image 2: Cleanup Services
  ('Gold cleanup with D-tan pack', 'Beauty & Skincare', 'Gold cleanup paired with brightening D-tan pack.', '[]'::jsonb, 599, '', 'AutoAwesome', 13, 'published'),
  ('Wine cleaner with D-tan pack', 'Beauty & Skincare', 'Wine cleanup paired with D-tan pack.', '[]'::jsonb, 499, '', 'AutoAwesome', 14, 'published'),
  ('Clean up VLCC with VLCC bleach', 'Beauty & Skincare', 'VLCC facial cleanup with VLCC bleach.', '[]'::jsonb, 649, '', 'AutoAwesome', 15, 'published'),
  ('Korean clean up with D-tan bleach', 'Beauty & Skincare', 'Glass-skin Korean cleanup with D-tan bleach.', '[]'::jsonb, 699, '', 'Star', 16, 'published'),
  ('Oxy clean up with Oxy bleach', 'Beauty & Skincare', 'Oxygenating cleanup with Oxy bleach.', '[]'::jsonb, 499, '', 'AutoAwesome', 17, 'published'),
  -- Image 3: Festive Luxe Component Services
  ('Bio Aqua facial with oxy bleach (Face Neck Back)', 'Beauty & Skincare', 'Hydrating Bio Aqua facial with Oxy bleach on face, neck, and back.', '[]'::jsonb, 999, '', 'Star', 18, 'published'),
  ('Hydra mask back massaging', 'Beauty & Skincare', 'Relaxing back massage with hydrating mask.', '[]'::jsonb, 450, '', 'AutoAwesome', 19, 'published'),
  ('Threading forehead and upper lips', 'Beauty & Skincare', 'Forehead and upper lips threading.', '[]'::jsonb, 50, '', 'AutoAwesome', 20, 'published'),
  ('Full hand half leg O3 wax', 'Beauty & Skincare', 'Full hand and half leg O3 waxing.', '[]'::jsonb, 550, '', 'Star', 21, 'published'),
  ('Hydra boost facial 8 step scrubbing', 'Beauty & Skincare', '8-step Hydra boost facial with deep scrubbing.', '[]'::jsonb, 1199, '', 'Star', 22, 'published'),
  ('Back massaging included oxy bleach (Face Neck Back)', 'Beauty & Skincare', 'Back massage with Oxy bleach for face, neck, and back.', '[]'::jsonb, 550, '', 'Star', 23, 'published'),
  ('Full hand half leg reka waxing', 'Beauty & Skincare', 'Full hand and half leg Rica waxing.', '[]'::jsonb, 750, '', 'Star', 24, 'published'),
  ('VLCC facial scrubbing back massaging', 'Beauty & Skincare', 'VLCC facial with scrubbing and relaxing back massage.', '[]'::jsonb, 699, '', 'AutoAwesome', 25, 'published'),
  ('VLCC bleach (Face Neck Back)', 'Beauty & Skincare', 'VLCC bleach for face, neck, and back.', '[]'::jsonb, 300, '', 'AutoAwesome', 26, 'published'),
  ('Threading forehead upper lip', 'Beauty & Skincare', 'Forehead and upper lip threading.', '[]'::jsonb, 50, '', 'AutoAwesome', 27, 'published'),
  ('Alo vera wax full hand half leg', 'Beauty & Skincare', 'Soothing Aloe Vera waxing for full hand and half leg.', '[]'::jsonb, 399, '', 'AutoAwesome', 28, 'published')
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  inclusions = EXCLUDED.inclusions,
  price_inr = EXCLUDED.price_inr,
  price_label = EXCLUDED.price_label,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

-- 4. Rename existing 3 packages in-place if old names exist and target names do not yet exist
UPDATE public.packages
SET name = 'Radiant Care'
WHERE name = 'Radiant Refresh'
  AND NOT EXISTS (SELECT 1 FROM public.packages WHERE name = 'Radiant Care');

UPDATE public.packages
SET name = 'Lotus Glow'
WHERE name = 'Diamond Glow'
  AND NOT EXISTS (SELECT 1 FROM public.packages WHERE name = 'Lotus Glow');

UPDATE public.packages
SET name = 'Royal Pamper'
WHERE name = 'Royal Treatment'
  AND NOT EXISTS (SELECT 1 FROM public.packages WHERE name = 'Royal Pamper');

-- 5. Upsert all 12 source-of-truth Packages (Image 1 Multi-Service + Image 2 Cleanup + Image 3 Festive Luxe)
INSERT INTO public.packages (
  name,
  description,
  price_inr,
  icon_name,
  display_order,
  status,
  package_group,
  tagline,
  badge_text,
  card_color
)
VALUES
  -- Image 1: 4 Multi-Service Packages
  (
    'Basic Glow',
    'Essential facial cleanup, full hand waxing, and forehead/upper lips threading.',
    799,
    'AutoAwesome',
    1,
    'published',
    'Multi-Service Packages',
    'SAVE MORE | LOOK BEAUTIFUL',
    '',
    '#4e1014'
  ),
  (
    'Radiant Care',
    'D-Tan facial, half leg & full hand waxing, and forehead/upper lips threading.',
    1099,
    'Star',
    2,
    'published',
    'Multi-Service Packages',
    'RADIATE BEAUTY | THIS FESTIVE SEASON',
    '',
    '#261326'
  ),
  (
    'Lotus Glow',
    'Lotus facial, skin brightening bleach, full hand & full leg waxing, and threading.',
    1499,
    'AutoAwesome',
    3,
    'published',
    'Multi-Service Packages',
    'SHINE LIKE | A LOTUS',
    'MOST POPULAR',
    '#4f3811'
  ),
  (
    'Royal Pamper',
    '10-step Bridal O3 facial, Golden bleach (face, neck, back), O3 wax, and threading.',
    2099,
    'Star',
    4,
    'published',
    'Multi-Service Packages',
    'FEEL ROYAL | BE ROYAL',
    '',
    '#0c3329'
  ),
  -- Image 2: 5 Cleanup Packages
  (
    'Gold cleanup with D-tan pack',
    'Gold facial cleanup paired with brightening D-tan pack.',
    599,
    'AutoAwesome',
    5,
    'published',
    'Cleanup Packages',
    'UNVEIL YOUR RADIANT GLOW',
    '',
    '#3d1914'
  ),
  (
    'Wine cleaner with D-tan pack',
    'Antioxidant Wine cleanup paired with D-tan pack.',
    499,
    'AutoAwesome',
    6,
    'published',
    'Cleanup Packages',
    'UNVEIL YOUR RADIANT GLOW',
    '',
    '#3d1914'
  ),
  (
    'Clean up VLCC with VLCC bleach',
    'VLCC deep cleanup paired with gentle VLCC bleach.',
    649,
    'AutoAwesome',
    7,
    'published',
    'Cleanup Packages',
    'UNVEIL YOUR RADIANT GLOW',
    '',
    '#3d1914'
  ),
  (
    'Korean clean up with D-tan bleach',
    'Glass-skin Korean cleanup with D-tan bleach.',
    699,
    'Star',
    8,
    'published',
    'Cleanup Packages',
    'UNVEIL YOUR RADIANT GLOW',
    '',
    '#3d1914'
  ),
  (
    'Oxy clean up with Oxy bleach',
    'Oxygenating facial cleanup with Oxy bleach.',
    499,
    'AutoAwesome',
    9,
    'published',
    'Cleanup Packages',
    'UNVEIL YOUR RADIANT GLOW',
    '',
    '#3d1914'
  ),
  -- Image 3: 3 Festive Luxe Packages
  (
    'Bond of Radiance Package',
    'Bio Aqua facial with oxy bleach (Face Neck Back), Hydra mask back massaging, threading, and full hand half leg O3 wax.',
    1999,
    'Star',
    10,
    'published',
    'Festive Luxe Packages',
    'CELEBRATE THE BOND OF LOVE',
    '',
    '#e06d78'
  ),
  (
    'Sister''s Glow Luxe Package',
    'Hydra boost facial 8 step scrubbing, back massaging with oxy bleach (Face Neck Back), full hand half leg rica waxing, and threading.',
    2499,
    'Star',
    11,
    'published',
    'Festive Luxe Packages',
    'SELF-CARE IS THE BEST GIFT',
    'LUXE GIFT',
    '#d49b42'
  ),
  (
    'Pure & Fresh Essence Package',
    'VLCC facial scrubbing back massaging, VLCC bleach (Face Neck Back), threading forehead upper lip, and Aloe vera wax full hand half leg.',
    1299,
    'AutoAwesome',
    12,
    'published',
    'Festive Luxe Packages',
    'PURE & FRESH FESTIVE GLOW',
    '',
    '#df6c5a'
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  package_group = EXCLUDED.package_group,
  tagline = EXCLUDED.tagline,
  badge_text = EXCLUDED.badge_text,
  card_color = EXCLUDED.card_color;

-- 6. Replace package_services links for the 12 canonical packages so items match the reference posters
DELETE FROM public.package_services
WHERE package_id IN (
  SELECT id FROM public.packages
  WHERE name IN (
    'Basic Glow',
    'Radiant Care',
    'Lotus Glow',
    'Royal Pamper',
    'Gold cleanup with D-tan pack',
    'Wine cleaner with D-tan pack',
    'Clean up VLCC with VLCC bleach',
    'Korean clean up with D-tan bleach',
    'Oxy clean up with Oxy bleach',
    'Bond of Radiance Package',
    'Sister''s Glow Luxe Package',
    'Pure & Fresh Essence Package'
  )
);

WITH canonical_pkg_items (pkg_name, svc_name, ord, note) AS (
  VALUES
    -- Image 1: Basic Glow (₹799)
    ('Basic Glow', 'Facial Cleanup', 1, ''),
    ('Basic Glow', 'Full Hand Waxing', 2, ''),
    ('Basic Glow', 'Threading forehead/Upper lips', 3, ''),
    -- Image 1: Radiant Care (₹1,099)
    ('Radiant Care', 'D-Tan Facial', 1, ''),
    ('Radiant Care', 'Half Leg Waxing', 2, ''),
    ('Radiant Care', 'Full Hand Waxing', 3, ''),
    ('Radiant Care', 'Threading forehead/Upper lips', 4, ''),
    -- Image 1: Lotus Glow (₹1,499)
    ('Lotus Glow', 'Lotus Facial', 1, ''),
    ('Lotus Glow', 'Skin Brightening Bleach', 2, ''),
    ('Lotus Glow', 'Full Hand Waxing', 3, ''),
    ('Lotus Glow', 'Full Leg Waxing', 4, ''),
    ('Lotus Glow', 'Threading forehead/Upper lips', 5, ''),
    -- Image 1: Royal Pamper (₹2,099)
    ('Royal Pamper', 'Bridal O3 facial 10 step', 1, ''),
    ('Royal Pamper', 'Golden Bleach (face, neck, back)', 2, ''),
    ('Royal Pamper', 'O3 wax (full hand, half leg)', 3, ''),
    ('Royal Pamper', 'Threading (forehead, upper lips)', 4, ''),
    -- Image 2: 5 Cleanup Packages
    ('Gold cleanup with D-tan pack', 'Gold cleanup with D-tan pack', 1, ''),
    ('Wine cleaner with D-tan pack', 'Wine cleaner with D-tan pack', 1, ''),
    ('Clean up VLCC with VLCC bleach', 'Clean up VLCC with VLCC bleach', 1, ''),
    ('Korean clean up with D-tan bleach', 'Korean clean up with D-tan bleach', 1, ''),
    ('Oxy clean up with Oxy bleach', 'Oxy clean up with Oxy bleach', 1, ''),
    -- Image 3: 3 Festive Luxe Packages
    ('Bond of Radiance Package', 'Bio Aqua facial with oxy bleach (Face Neck Back)', 1, ''),
    ('Bond of Radiance Package', 'Hydra mask back massaging', 2, ''),
    ('Bond of Radiance Package', 'Threading forehead and upper lips', 3, ''),
    ('Bond of Radiance Package', 'Full hand half leg O3 wax', 4, ''),
    ('Sister''s Glow Luxe Package', 'Hydra boost facial 8 step scrubbing', 1, ''),
    ('Sister''s Glow Luxe Package', 'Back massaging included oxy bleach (Face Neck Back)', 2, ''),
    ('Sister''s Glow Luxe Package', 'Full hand half leg reka waxing', 3, ''),
    ('Sister''s Glow Luxe Package', 'Threading forehead and upper lips', 4, ''),
    ('Pure & Fresh Essence Package', 'VLCC facial scrubbing back massaging', 1, ''),
    ('Pure & Fresh Essence Package', 'VLCC bleach (Face Neck Back)', 2, ''),
    ('Pure & Fresh Essence Package', 'Threading forehead upper lip', 3, ''),
    ('Pure & Fresh Essence Package', 'Alo vera wax full hand half leg', 4, '')
)
INSERT INTO public.package_services (package_id, service_id, display_order, inclusion_note)
SELECT p.id, s.id, cpi.ord, cpi.note
FROM canonical_pkg_items cpi
JOIN public.packages p ON p.name = cpi.pkg_name
JOIN public.services s ON s.name = cpi.svc_name AND s.category = 'Beauty & Skincare'
ON CONFLICT (package_id, service_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  inclusion_note = EXCLUDED.inclusion_note;

-- 7. Upsert Promotional Bundles for the 3 Festive Luxe Packages so they can be used as Bundles as well
INSERT INTO public.bundles (
  name,
  description,
  price_inr,
  icon_name,
  display_order,
  status,
  tagline,
  badge_text,
  card_color
)
VALUES
  (
    'Bond of Radiance Package',
    'Bio Aqua facial with oxy bleach (Face Neck Back), Hydra mask back massaging, Threading forehead and upper lips, Full hand half leg O3 wax.',
    1999,
    'Star',
    1,
    'published',
    'CELEBRATE THE BOND OF LOVE',
    '',
    '#e06d78'
  ),
  (
    'Sister''s Glow Luxe Package',
    'Hydra boost facial 8 step scrubbing, Back massaging included oxy bleach (Face Neck Back), Full hand half leg reka waxing, Threading forehead and upper lips.',
    2499,
    'Star',
    2,
    'published',
    'SELF-CARE IS THE BEST GIFT',
    'LUXE GIFT',
    '#d49b42'
  ),
  (
    'Pure & Fresh Essence Package',
    'VLCC facial scrubbing back massaging, VLCC bleach (Face Neck Back), Threading forehead upper lip, Alo vera wax full hand half leg.',
    1299,
    'AutoAwesome',
    3,
    'published',
    'PURE & FRESH FESTIVE GLOW',
    '',
    '#df6c5a'
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  tagline = EXCLUDED.tagline,
  badge_text = EXCLUDED.badge_text,
  card_color = EXCLUDED.card_color;

WITH canonical_bundle_links (bundle_name, pkg_name, ord) AS (
  VALUES
    ('Bond of Radiance Package', 'Bond of Radiance Package', 1),
    ('Sister''s Glow Luxe Package', 'Sister''s Glow Luxe Package', 1),
    ('Pure & Fresh Essence Package', 'Pure & Fresh Essence Package', 1)
)
INSERT INTO public.bundle_packages (bundle_id, package_id, display_order)
SELECT b.id, p.id, cbl.ord
FROM canonical_bundle_links cbl
JOIN public.bundles b ON b.name = cbl.bundle_name
JOIN public.packages p ON p.name = cbl.pkg_name
ON CONFLICT (bundle_id, package_id) DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- 8. Upsert the 4 reference Poster Templates in public.poster_templates
INSERT INTO public.poster_templates (
  template_key,
  name,
  version,
  supported_formats,
  layout_config,
  active
)
VALUES
  (
    'royal_4col_packages_v1',
    'Royal 4-Column Multi-Service Packages (Poster 1)',
    1,
    '["portrait_1080x1350", "square_1080"]'::jsonb,
    '{"max_offerings": 4, "columns": 4, "style": "royal_4col", "show_border": true, "preset_group": "Multi-Service Packages"}'::jsonb,
    true
  ),
  (
    'cleanup_arch_list_v1',
    'Arch Portrait & All Cleanup Packages List (Poster 2)',
    1,
    '["square_1080", "portrait_1080x1350"]'::jsonb,
    '{"max_offerings": 5, "columns": 1, "style": "cleanup_list", "show_border": true, "preset_group": "Cleanup Packages"}'::jsonb,
    true
  ),
  (
    'luxe_3col_gift_v1',
    'Festive 3-Column Luxe Packages & QR (Poster 3)',
    1,
    '["portrait_1080x1350", "square_1080"]'::jsonb,
    '{"max_offerings": 3, "columns": 3, "style": "luxe_3col", "show_border": true, "preset_group": "Festive Luxe Packages"}'::jsonb,
    true
  ),
  (
    'bridal_alacarte_catalogue_v1',
    'Makeup, Bridal & À La Carte Full Catalogue (Poster 4)',
    1,
    '["portrait_1080x1350", "square_1080"]'::jsonb,
    '{"max_offerings": 12, "columns": 2, "style": "bridal_catalogue", "show_border": true, "preset_group": "Full Catalogue"}'::jsonb,
    true
  )
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  supported_formats = EXCLUDED.supported_formats,
  layout_config = EXCLUDED.layout_config,
  active = EXCLUDED.active;
