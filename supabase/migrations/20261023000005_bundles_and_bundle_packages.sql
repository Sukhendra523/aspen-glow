-- Migration: 20261023000005_bundles_and_bundle_packages.sql
-- Purpose: Create bundles and bundle_packages tables with promotional INR pricing, relational integrity, and forced RLS.
-- Rollback:
--   DROP POLICY IF EXISTS "bundle_packages_public_select_published" ON public.bundle_packages;
--   DROP POLICY IF EXISTS "bundle_packages_admin_all" ON public.bundle_packages;
--   DROP TABLE IF EXISTS public.bundle_packages;
--   DROP POLICY IF EXISTS "bundles_public_select_published" ON public.bundles;
--   DROP POLICY IF EXISTS "bundles_admin_select" ON public.bundles;
--   DROP POLICY IF EXISTS "bundles_admin_insert" ON public.bundles;
--   DROP POLICY IF EXISTS "bundles_admin_update" ON public.bundles;
--   DROP TRIGGER IF EXISTS trg_bundles_updated_at ON public.bundles;
--   DROP TABLE IF EXISTS public.bundles;

-- 1. Bundles table (promotional bundle price independent of sum of component package prices)
CREATE TABLE IF NOT EXISTS public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  price_inr integer NOT NULL CHECK (price_inr >= 0),
  icon_name text NOT NULL DEFAULT 'Star' CHECK (
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

CREATE INDEX IF NOT EXISTS idx_bundles_status_order
  ON public.bundles (status, display_order);

DROP TRIGGER IF EXISTS trg_bundles_updated_at ON public.bundles;
CREATE TRIGGER trg_bundles_updated_at
BEFORE UPDATE ON public.bundles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles FORCE ROW LEVEL SECURITY;

-- Prefer archive over hard deletion on bundles
REVOKE ALL ON public.bundles FROM anon, public;
GRANT SELECT ON public.bundles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.bundles TO authenticated;

DROP POLICY IF EXISTS "bundles_public_select_published" ON public.bundles;
CREATE POLICY "bundles_public_select_published"
  ON public.bundles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "bundles_admin_select" ON public.bundles;
CREATE POLICY "bundles_admin_select"
  ON public.bundles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "bundles_admin_insert" ON public.bundles;
CREATE POLICY "bundles_admin_insert"
  ON public.bundles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bundles_admin_update" ON public.bundles;
CREATE POLICY "bundles_admin_update"
  ON public.bundles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Bundle Packages join table (links bundles to existing packages with display order)
CREATE TABLE IF NOT EXISTS public.bundle_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_bundle_package UNIQUE (bundle_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_packages_bundle_order
  ON public.bundle_packages (bundle_id, display_order);

ALTER TABLE public.bundle_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_packages FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.bundle_packages FROM anon, public;
GRANT SELECT ON public.bundle_packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bundle_packages TO authenticated;

DROP POLICY IF EXISTS "bundle_packages_public_select_published" ON public.bundle_packages;
CREATE POLICY "bundle_packages_public_select_published"
  ON public.bundle_packages
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bundles b
      WHERE b.id = bundle_packages.bundle_id
        AND b.status = 'published'
    )
  );

DROP POLICY IF EXISTS "bundle_packages_admin_all" ON public.bundle_packages;
CREATE POLICY "bundle_packages_admin_all"
  ON public.bundle_packages
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

