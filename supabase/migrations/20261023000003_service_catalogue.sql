-- Migration: 20261023000003_service_catalogue.sql
-- Purpose: Create public.services catalogue table with integer INR prices, lifecycle status, RLS, and initial salon seed data.
-- Rollback:
--   DROP POLICY IF EXISTS "services_public_select_published" ON public.services;
--   DROP POLICY IF EXISTS "services_admin_select" ON public.services;
--   DROP POLICY IF EXISTS "services_admin_insert" ON public.services;
--   DROP POLICY IF EXISTS "services_admin_update" ON public.services;
--   DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
--   DROP TABLE IF EXISTS public.services;

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  category text NOT NULL CHECK (
    category IN (
      'Makeup & Styling',
      'Bridal & Pre-Bridal',
      'Hair Services',
      'Mehndi Artistry',
      'Beauty & Skincare'
    )
  ),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  inclusions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(inclusions) = 'array'),
  price_inr integer NOT NULL CHECK (price_inr >= 0),
  price_label text NOT NULL DEFAULT '' CHECK (char_length(price_label) <= 60),
  icon_name text NOT NULL DEFAULT 'AutoAwesome' CHECK (
    icon_name IN (
      'AutoAwesome',
      'ColorLens',
      'Star',
      'FaceRetouchingNatural',
      'Cake',
      'ContentCut'
    )
  ),
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_services_category_name UNIQUE (category, name)
);

CREATE INDEX IF NOT EXISTS idx_services_status_category_order
  ON public.services (status, category, display_order);

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services FORCE ROW LEVEL SECURITY;

-- Prefer archive over hard deletion: revoke DELETE from client roles
REVOKE ALL ON public.services FROM anon, public;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE ON public.services TO authenticated;

DROP POLICY IF EXISTS "services_public_select_published" ON public.services;
CREATE POLICY "services_public_select_published"
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "services_admin_select" ON public.services;
CREATE POLICY "services_admin_select"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "services_admin_insert" ON public.services;
CREATE POLICY "services_admin_insert"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_admin_update" ON public.services;
CREATE POLICY "services_admin_update"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed existing salon services (idempotent)
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
  (
    'Light Party Makeup',
    'Makeup & Styling',
    '',
    '["Light Party Makeup", "Hairstyle", "Saree Draping"]'::jsonb,
    1199,
    '',
    'ColorLens',
    1,
    'published'
  ),
  (
    'Glamour Pro Makeup',
    'Makeup & Styling',
    '',
    '["Full Party Makeup", "Hairstyle", "Saree Draping"]'::jsonb,
    1999,
    '',
    'ColorLens',
    2,
    'published'
  ),
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
    'A flawless and captivating look for your special day.',
    '["A flawless and captivating look for your special day.", "Includes: Makeup, Hairstyling & Lehnga Draping."]'::jsonb,
    3999,
    '',
    'FaceRetouchingNatural',
    2,
    'published'
  ),
  (
    'HD Bridal Makeup',
    'Bridal & Pre-Bridal',
    'The perfect, long-lasting look for your wedding day.',
    '["The perfect, long-lasting look for your wedding day.", "Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping."]'::jsonb,
    8999,
    '',
    'Star',
    3,
    'published'
  ),
  ('Step Cut', 'Hair Services', '', '[]'::jsonb, 350, '', 'ContentCut', 1, 'published'),
  ('Layer Cut', 'Hair Services', '', '[]'::jsonb, 250, '', 'ContentCut', 2, 'published'),
  ('V-Shape Cut', 'Hair Services', '', '[]'::jsonb, 200, '', 'ContentCut', 3, 'published'),
  ('U-Shape Cut', 'Hair Services', '', '[]'::jsonb, 150, '', 'ContentCut', 4, 'published'),
  ('Baby Cut', 'Hair Services', '', '[]'::jsonb, 100, '', 'ContentCut', 5, 'published'),
  (
    'Mehndi Artistry',
    'Mehndi Artistry',
    'Intricate and beautiful Mehndi designs for all occasions. Bookings now open! Please contact for custom designs and pricing.',
    '[]'::jsonb,
    99,
    'Starting from just',
    'ColorLens',
    1,
    'published'
  ),
  ('Facial Cleanup', 'Beauty & Skincare', 'Deep pore cleansing and skin refresh.', '[]'::jsonb, 399, '', 'AutoAwesome', 1, 'published'),
  ('Full Hand Waxing', 'Beauty & Skincare', 'Smooth waxing for full arms.', '[]'::jsonb, 250, '', 'AutoAwesome', 2, 'published'),
  ('Threading', 'Beauty & Skincare', 'Eyebrow and upper-lip threading.', '[]'::jsonb, 50, '', 'AutoAwesome', 3, 'published'),
  ('D-Tan Treatment Facial', 'Beauty & Skincare', 'Detan and brightening facial treatment.', '[]'::jsonb, 599, '', 'Star', 4, 'published'),
  ('Half Leg & Full Hand Waxing', 'Beauty & Skincare', 'Combo waxing for half legs and full arms.', '[]'::jsonb, 450, '', 'AutoAwesome', 5, 'published'),
  ('Lotus Facial', 'Beauty & Skincare', 'Signature Lotus glow facial.', '[]'::jsonb, 799, '', 'AutoAwesome', 6, 'published'),
  ('Skin Brightening Bleach', 'Beauty & Skincare', 'Gentle skin brightening bleach.', '[]'::jsonb, 200, '', 'AutoAwesome', 7, 'published'),
  ('Full Hand & Full Leg Waxing', 'Beauty & Skincare', 'Complete waxing for full arms and full legs.', '[]'::jsonb, 650, '', 'AutoAwesome', 8, 'published'),
  ('O3 Facial', 'Beauty & Skincare', 'Premium O3+ bridal/party facial treatment.', '[]'::jsonb, 1199, '', 'Star', 9, 'published'),
  ('Full Hand & Full Leg Premium Rica Wax', 'Beauty & Skincare', 'Gentle liposoluble Rica waxing for full arms and legs.', '[]'::jsonb, 950, '', 'Star', 10, 'published')
ON CONFLICT (category, name) DO NOTHING;

