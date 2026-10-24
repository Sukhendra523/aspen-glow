-- Migration: 20261024000009_custom_icons_and_festivals.sql
-- Purpose:
--   1. Add optional icon_url column to public.services, public.packages, and public.bundles
--      so the admin can select custom icons from the Media Library (or asset URLs).
--   2. Allow 'icon' category in public.media_assets alongside 'logo', 'poster_motif', and 'general'.
--   3. Ensure public.posters format_key check constraint supports 'portrait_1080x1620'.
-- Rollback:
--   ALTER TABLE public.services DROP COLUMN IF EXISTS icon_url;
--   ALTER TABLE public.packages DROP COLUMN IF EXISTS icon_url;
--   ALTER TABLE public.bundles DROP COLUMN IF EXISTS icon_url;

BEGIN;

-- 1. Add custom icon_url to services, packages, and bundles
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS icon_url text NOT NULL DEFAULT ''
  CHECK (char_length(icon_url) <= 500);

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS icon_url text NOT NULL DEFAULT ''
  CHECK (char_length(icon_url) <= 500);

ALTER TABLE public.bundles
  ADD COLUMN IF NOT EXISTS icon_url text NOT NULL DEFAULT ''
  CHECK (char_length(icon_url) <= 500);

-- 2. Expand media_assets category check constraint to include 'icon'
ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_category_check;

ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_category_check
  CHECK (category IN ('logo', 'poster_motif', 'icon', 'general'));

-- 3. Ensure posters.format_key constraint allows portrait_1080x1620
ALTER TABLE public.posters
  DROP CONSTRAINT IF EXISTS posters_format_key_check;

ALTER TABLE public.posters
  ADD CONSTRAINT posters_format_key_check
  CHECK (format_key IN ('square_1080', 'portrait_1080x1350', 'portrait_1080x1620'));

COMMIT;

