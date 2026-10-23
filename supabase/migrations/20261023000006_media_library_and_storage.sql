-- Migration: 20261023000006_media_library_and_storage.sql
-- Purpose: Configure salon-media Supabase Storage bucket and public.media_assets table with strict MIME/size rules and immutable asset retention for poster snapshots.
-- Rollback:
--   DROP POLICY IF EXISTS "media_assets_public_select_active" ON public.media_assets;
--   DROP POLICY IF EXISTS "media_assets_admin_select" ON public.media_assets;
--   DROP POLICY IF EXISTS "media_assets_admin_insert" ON public.media_assets;
--   DROP POLICY IF EXISTS "media_assets_admin_update" ON public.media_assets;
--   DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
--   DROP TABLE IF EXISTS public.media_assets;
--   DROP POLICY IF EXISTS "salon_media_public_read" ON storage.objects;
--   DROP POLICY IF EXISTS "salon_media_admin_insert" ON storage.objects;

-- 1. Create salon-media bucket (raster images only, max 2 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-media',
  'salon-media',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS policies on storage.objects for salon-media
-- Public read for approved public bucket; admin-only insert; no client update/delete so historical poster snapshots never break.
DROP POLICY IF EXISTS "salon_media_public_read" ON storage.objects;
CREATE POLICY "salon_media_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'salon-media');

DROP POLICY IF EXISTS "salon_media_admin_insert" ON storage.objects;
CREATE POLICY "salon_media_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'salon-media'
    AND public.is_admin()
    AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp')
  );

-- 3. Media assets metadata table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  category text NOT NULL DEFAULT 'logo' CHECK (category IN ('logo', 'poster_motif', 'general')),
  bucket_name text NOT NULL DEFAULT 'salon-media' CHECK (bucket_name = 'salon-media'),
  storage_path text NOT NULL UNIQUE CHECK (char_length(trim(storage_path)) BETWEEN 1 AND 300),
  public_url text NOT NULL CHECK (char_length(trim(public_url)) BETWEEN 1 AND 500),
  mime_type text NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 2097152),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_status_category
  ON public.media_assets (status, category, created_at DESC);

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets FORCE ROW LEVEL SECURITY;

-- Prefer archive over hard deletion on media_assets
REVOKE ALL ON public.media_assets FROM anon, public;
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE ON public.media_assets TO authenticated;

DROP POLICY IF EXISTS "media_assets_public_select_active" ON public.media_assets;
CREATE POLICY "media_assets_public_select_active"
  ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "media_assets_admin_select" ON public.media_assets;
CREATE POLICY "media_assets_admin_select"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "media_assets_admin_insert" ON public.media_assets;
CREATE POLICY "media_assets_admin_insert"
  ON public.media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "media_assets_admin_update" ON public.media_assets;
CREATE POLICY "media_assets_admin_update"
  ON public.media_assets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

