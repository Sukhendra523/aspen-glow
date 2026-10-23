-- Migration: 20261023000007_festivals_templates_and_posters.sql
-- Purpose: Create festivals, poster_templates, and posters tables with immutable snapshot storage, RLS, and initial festival/template seeds.
-- Rollback:
--   DROP POLICY IF EXISTS "posters_admin_all" ON public.posters;
--   DROP TRIGGER IF EXISTS trg_posters_updated_at ON public.posters;
--   DROP TABLE IF EXISTS public.posters;
--   DROP POLICY IF EXISTS "poster_templates_admin_all" ON public.poster_templates;
--   DROP TRIGGER IF EXISTS trg_poster_templates_updated_at ON public.poster_templates;
--   DROP TABLE IF EXISTS public.poster_templates;
--   DROP POLICY IF EXISTS "festivals_admin_all" ON public.festivals;
--   DROP TRIGGER IF EXISTS trg_festivals_updated_at ON public.festivals;
--   DROP TABLE IF EXISTS public.festivals;

-- 1. Festivals table
CREATE TABLE IF NOT EXISTS public.festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  category text NOT NULL DEFAULT 'Indian Festival' CHECK (char_length(trim(category)) BETWEEN 1 AND 60),
  default_headline text NOT NULL DEFAULT '' CHECK (char_length(default_headline) <= 120),
  default_subheadline text NOT NULL DEFAULT '' CHECK (char_length(default_subheadline) <= 200),
  motif_label text NOT NULL DEFAULT '✨' CHECK (char_length(motif_label) <= 40),
  accent_color text NOT NULL DEFAULT '#d81b60' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_festivals_updated_at ON public.festivals;
CREATE TRIGGER trg_festivals_updated_at
BEFORE UPDATE ON public.festivals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.festivals FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.festivals TO authenticated;

DROP POLICY IF EXISTS "festivals_admin_all" ON public.festivals;
CREATE POLICY "festivals_admin_all"
  ON public.festivals
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Poster Templates table
CREATE TABLE IF NOT EXISTS public.poster_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE CHECK (char_length(trim(template_key)) BETWEEN 1 AND 60),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  supported_formats jsonb NOT NULL DEFAULT '["square_1080", "portrait_1080x1350"]'::jsonb CHECK (jsonb_typeof(supported_formats) = 'array'),
  layout_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(layout_config) = 'object'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_poster_templates_updated_at ON public.poster_templates;
CREATE TRIGGER trg_poster_templates_updated_at
BEFORE UPDATE ON public.poster_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_templates FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.poster_templates FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.poster_templates TO authenticated;

DROP POLICY IF EXISTS "poster_templates_admin_all" ON public.poster_templates;
CREATE POLICY "poster_templates_admin_all"
  ON public.poster_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Posters table (stores immutable content_snapshot; saving/exporting never publishes to public website)
CREATE TABLE IF NOT EXISTS public.posters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL CHECK (char_length(trim(campaign_name)) BETWEEN 1 AND 120),
  festival_id uuid REFERENCES public.festivals(id) ON DELETE SET NULL,
  template_key text NOT NULL CHECK (char_length(trim(template_key)) BETWEEN 1 AND 60),
  template_version integer NOT NULL DEFAULT 1 CHECK (template_version >= 1),
  format_key text NOT NULL DEFAULT 'square_1080' CHECK (format_key IN ('square_1080', 'portrait_1080x1350')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived')),
  structured_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(structured_config) = 'object'),
  content_snapshot jsonb NOT NULL CHECK (jsonb_typeof(content_snapshot) = 'object'),
  export_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(export_metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posters_status_updated
  ON public.posters (status, updated_at DESC);

DROP TRIGGER IF EXISTS trg_posters_updated_at ON public.posters;
CREATE TRIGGER trg_posters_updated_at
BEFORE UPDATE ON public.posters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posters FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.posters FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.posters TO authenticated;

DROP POLICY IF EXISTS "posters_admin_all" ON public.posters;
CREATE POLICY "posters_admin_all"
  ON public.posters
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Seed canonical festivals (idempotent)
INSERT INTO public.festivals (
  name,
  category,
  default_headline,
  default_subheadline,
  motif_label,
  accent_color,
  active,
  display_order
)
VALUES
  (
    'Karwa Chauth',
    'Indian Festival',
    'Karwa Chauth Special Glow Packages',
    'Celebrate with radiant skin, bridal mehndi, and festive styling.',
    '🌙 ✨ Karwa Chauth Special',
    '#c2185b',
    true,
    1
  ),
  (
    'Diwali',
    'Indian Festival',
    'Diwali Festive Beauty Offers',
    'Shine bright this festival of lights with our curated beauty packages.',
    '🪔 ✨ शुभ दीपावली • Festive Glow',
    '#b26a00',
    true,
    2
  ),
  (
    'Teej',
    'Indian Festival',
    'Hariyali & Hartalika Teej Specials',
    'Traditional mehndi, facial glow, and festive makeup packages.',
    '🌸 🌿 Teej Celebration',
    '#2e7d32',
    true,
    3
  ),
  (
    'Navratri & Durga Puja',
    'Indian Festival',
    'Navratri & Garba Glam Packages',
    'Nine nights of festive beauty, hairstyling, and radiant skin care.',
    '🔱 ✨ Navratri Festive Glam',
    '#ad1457',
    true,
    4
  ),
  (
    'Wedding & Bridal Season',
    'Bridal & Occasion',
    'Bridal & Pre-Bridal Luxury Packages',
    'Complete Haldi, Mehndi, Engagement, and HD Bridal beauty care.',
    '👰 👑 Bridal Season Special',
    '#880e4f',
    true,
    5
  )
ON CONFLICT (name) DO NOTHING;

-- 5. Seed versioned poster templates (idempotent)
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
    'festive_grid_v1',
    'Royal Festive Grid',
    1,
    '["square_1080", "portrait_1080x1350"]'::jsonb,
    '{"max_offerings": 4, "columns": 2, "style": "grid", "show_border": true}'::jsonb,
    true
  ),
  (
    'bridal_spotlight_v1',
    'Spotlight Offer Card',
    1,
    '["square_1080", "portrait_1080x1350"]'::jsonb,
    '{"max_offerings": 2, "columns": 1, "style": "spotlight", "show_border": true}'::jsonb,
    true
  ),
  (
    'minimal_elegance_v1',
    'Minimal Salon Elegance',
    1,
    '["square_1080", "portrait_1080x1350"]'::jsonb,
    '{"max_offerings": 4, "columns": 1, "style": "list", "show_border": false}'::jsonb,
    true
  )
ON CONFLICT (template_key) DO NOTHING;

