-- Migration: 20261023000002_brand_and_contact_settings.sql
-- Purpose: Create singleton brand_settings and contact_settings tables with RLS and seed current salon defaults.
-- Rollback:
--   DROP POLICY IF EXISTS "brand_settings_public_select_published" ON public.brand_settings;
--   DROP POLICY IF EXISTS "brand_settings_admin_select" ON public.brand_settings;
--   DROP POLICY IF EXISTS "brand_settings_admin_insert" ON public.brand_settings;
--   DROP POLICY IF EXISTS "brand_settings_admin_update" ON public.brand_settings;
--   DROP TRIGGER IF EXISTS trg_brand_settings_updated_at ON public.brand_settings;
--   DROP TABLE IF EXISTS public.brand_settings;
--   DROP POLICY IF EXISTS "contact_settings_public_select_published" ON public.contact_settings;
--   DROP POLICY IF EXISTS "contact_settings_admin_select" ON public.contact_settings;
--   DROP POLICY IF EXISTS "contact_settings_admin_insert" ON public.contact_settings;
--   DROP POLICY IF EXISTS "contact_settings_admin_update" ON public.contact_settings;
--   DROP TRIGGER IF EXISTS trg_contact_settings_updated_at ON public.contact_settings;
--   DROP TABLE IF EXISTS public.contact_settings;

-- 1. Brand Settings singleton table
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text NOT NULL CHECK (char_length(trim(brand_name)) BETWEEN 1 AND 100),
  short_name text NOT NULL CHECK (char_length(trim(short_name)) BETWEEN 1 AND 60),
  tagline text NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 200),
  hero_description text NOT NULL DEFAULT '' CHECK (char_length(hero_description) <= 500),
  logo_url text NOT NULL DEFAULT '' CHECK (char_length(logo_url) <= 500),
  primary_color text NOT NULL DEFAULT '#d81b60' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text NOT NULL DEFAULT '#880e4f' CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text NOT NULL DEFAULT '#FEFBF6' CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  heading_font text NOT NULL DEFAULT 'Playfair Display' CHECK (heading_font IN ('Playfair Display', 'Georgia', 'Lato')),
  body_font text NOT NULL DEFAULT 'Lato' CHECK (body_font IN ('Lato', 'Helvetica', 'Georgia')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_brand_settings_updated_at ON public.brand_settings;
CREATE TRIGGER trg_brand_settings_updated_at
BEFORE UPDATE ON public.brand_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.brand_settings FROM anon, public;
GRANT SELECT ON public.brand_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.brand_settings TO authenticated;

DROP POLICY IF EXISTS "brand_settings_public_select_published" ON public.brand_settings;
CREATE POLICY "brand_settings_public_select_published"
  ON public.brand_settings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "brand_settings_admin_select" ON public.brand_settings;
CREATE POLICY "brand_settings_admin_select"
  ON public.brand_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "brand_settings_admin_insert" ON public.brand_settings;
CREATE POLICY "brand_settings_admin_insert"
  ON public.brand_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "brand_settings_admin_update" ON public.brand_settings;
CREATE POLICY "brand_settings_admin_update"
  ON public.brand_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Contact Settings singleton table
CREATE TABLE IF NOT EXISTS public.contact_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  contact_name text NOT NULL CHECK (char_length(trim(contact_name)) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(trim(phone)) BETWEEN 7 AND 20),
  whatsapp text NOT NULL CHECK (char_length(trim(whatsapp)) BETWEEN 7 AND 20),
  address text NOT NULL CHECK (char_length(trim(address)) BETWEEN 1 AND 300),
  booking_url text NOT NULL DEFAULT '' CHECK (char_length(booking_url) <= 500),
  appointment_note text NOT NULL DEFAULT '' CHECK (char_length(appointment_note) <= 300),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_contact_settings_updated_at ON public.contact_settings;
CREATE TRIGGER trg_contact_settings_updated_at
BEFORE UPDATE ON public.contact_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_settings FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.contact_settings FROM anon, public;
GRANT SELECT ON public.contact_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.contact_settings TO authenticated;

DROP POLICY IF EXISTS "contact_settings_public_select_published" ON public.contact_settings;
CREATE POLICY "contact_settings_public_select_published"
  ON public.contact_settings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "contact_settings_admin_select" ON public.contact_settings;
CREATE POLICY "contact_settings_admin_select"
  ON public.contact_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contact_settings_admin_insert" ON public.contact_settings;
CREATE POLICY "contact_settings_admin_insert"
  ON public.contact_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contact_settings_admin_update" ON public.contact_settings;
CREATE POLICY "contact_settings_admin_update"
  ON public.contact_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Seed current salon values (idempotent)
INSERT INTO public.brand_settings (
  id,
  brand_name,
  short_name,
  tagline,
  hero_description,
  logo_url,
  primary_color,
  secondary_color,
  background_color,
  heading_font,
  body_font,
  status
)
VALUES (
  1,
  'Aspen Glow by Shilpi',
  'Aspen Glow',
  'Bringing the Salon Experience at DevSai Sports Home',
  'Hello! I am a professionally trained beautician offering a wide range of services exclusively for our society.',
  '',
  '#d81b60',
  '#880e4f',
  '#FEFBF6',
  'Playfair Display',
  'Lato',
  'published'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contact_settings (
  id,
  contact_name,
  phone,
  whatsapp,
  address,
  booking_url,
  appointment_note,
  status
)
VALUES (
  1,
  'Shilpi Chauhan',
  '7011413546',
  '917011413546',
  '703 Aspen Tower, Dev Sai Sports Home, Greater Noida',
  '',
  'Appointments are highly recommended. Looking forward to pampering you!',
  'published'
)
ON CONFLICT (id) DO NOTHING;

