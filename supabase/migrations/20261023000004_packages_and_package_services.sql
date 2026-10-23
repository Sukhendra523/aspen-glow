-- Migration: 20261023000004_packages_and_package_services.sql
-- Purpose: Create packages and package_services tables with standalone INR prices, relational integrity, RLS, and seed existing beauty packages.
-- Rollback:
--   DROP POLICY IF EXISTS "package_services_public_select_published" ON public.package_services;
--   DROP POLICY IF EXISTS "package_services_admin_all" ON public.package_services;
--   DROP TABLE IF EXISTS public.package_services;
--   DROP POLICY IF EXISTS "packages_public_select_published" ON public.packages;
--   DROP POLICY IF EXISTS "packages_admin_select" ON public.packages;
--   DROP POLICY IF EXISTS "packages_admin_insert" ON public.packages;
--   DROP POLICY IF EXISTS "packages_admin_update" ON public.packages;
--   DROP TRIGGER IF EXISTS trg_packages_updated_at ON public.packages;
--   DROP TABLE IF EXISTS public.packages;

-- 1. Packages table (standalone package price independent of sum of service prices)
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  price_inr integer NOT NULL CHECK (price_inr >= 0),
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
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packages_status_order
  ON public.packages (status, display_order);

DROP TRIGGER IF EXISTS trg_packages_updated_at ON public.packages;
CREATE TRIGGER trg_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages FORCE ROW LEVEL SECURITY;

-- Prefer archive over hard deletion on packages
REVOKE ALL ON public.packages FROM anon, public;
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.packages TO authenticated;

DROP POLICY IF EXISTS "packages_public_select_published" ON public.packages;
CREATE POLICY "packages_public_select_published"
  ON public.packages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "packages_admin_select" ON public.packages;
CREATE POLICY "packages_admin_select"
  ON public.packages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "packages_admin_insert" ON public.packages;
CREATE POLICY "packages_admin_insert"
  ON public.packages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "packages_admin_update" ON public.packages;
CREATE POLICY "packages_admin_update"
  ON public.packages
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Package Services join table (links packages to reusable services with display order & optional inclusion note)
CREATE TABLE IF NOT EXISTS public.package_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0,
  inclusion_note text NOT NULL DEFAULT '' CHECK (char_length(inclusion_note) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_package_service UNIQUE (package_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_package_services_package_order
  ON public.package_services (package_id, display_order);

ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_services FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.package_services FROM anon, public;
GRANT SELECT ON public.package_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.package_services TO authenticated;

DROP POLICY IF EXISTS "package_services_public_select_published" ON public.package_services;
CREATE POLICY "package_services_public_select_published"
  ON public.package_services
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.packages p
      WHERE p.id = package_services.package_id
        AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS "package_services_admin_all" ON public.package_services;
CREATE POLICY "package_services_admin_all"
  ON public.package_services
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Seed existing 4 beauty packages (idempotent)
INSERT INTO public.packages (name, description, price_inr, icon_name, display_order, status)
VALUES
  ('Basic Glow', 'Essential facial, waxing, and complimentary threading package.', 799, 'AutoAwesome', 1, 'published'),
  ('Radiant Refresh', 'D-Tan facial, half leg & full hand waxing, and complimentary threading.', 1099, 'Star', 2, 'published'),
  ('Diamond Glow', 'Lotus facial, skin brightening bleach, full waxing, and complimentary threading.', 1499, 'AutoAwesome', 3, 'published'),
  ('Royal Treatment', 'O3 facial, skin brightening bleach, full Rica wax, and complimentary threading.', 1999, 'Star', 4, 'published')
ON CONFLICT (name) DO NOTHING;

-- 4. Seed package_services relationships for the 4 beauty packages
WITH pkg_items (pkg_name, svc_name, ord, note) AS (
  VALUES
    ('Basic Glow', 'Facial Cleanup', 1, ''),
    ('Basic Glow', 'Full Hand Waxing', 2, ''),
    ('Basic Glow', 'Threading', 3, '🎉 Free'),
    ('Radiant Refresh', 'D-Tan Treatment Facial', 1, ''),
    ('Radiant Refresh', 'Half Leg & Full Hand Waxing', 2, ''),
    ('Radiant Refresh', 'Threading', 3, '🎉 Free'),
    ('Diamond Glow', 'Lotus Facial', 1, ''),
    ('Diamond Glow', 'Skin Brightening Bleach', 2, ''),
    ('Diamond Glow', 'Full Hand & Full Leg Waxing', 3, ''),
    ('Diamond Glow', 'Threading', 4, '🎉 Free'),
    ('Royal Treatment', 'O3 Facial', 1, ''),
    ('Royal Treatment', 'Skin Brightening Bleach', 2, ''),
    ('Royal Treatment', 'Full Hand & Full Leg Premium Rica Wax', 3, ''),
    ('Royal Treatment', 'Threading', 4, '🎉 Free')
)
INSERT INTO public.package_services (package_id, service_id, display_order, inclusion_note)
SELECT p.id, s.id, pi.ord, pi.note
FROM pkg_items pi
JOIN public.packages p ON p.name = pi.pkg_name
JOIN public.services s ON s.name = pi.svc_name AND s.category = 'Beauty & Skincare'
ON CONFLICT (package_id, service_id) DO NOTHING;

