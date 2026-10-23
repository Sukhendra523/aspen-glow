-- Migration: 20261023000001_init_auth_profiles.sql
-- Purpose: Create profiles table, updated_at trigger, and least-privilege RLS for single-admin CMS.
-- Rollback:
--   DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
--   DROP FUNCTION IF EXISTS public.is_admin();
--   DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
--   DROP TABLE IF EXISTS public.profiles;
--   DROP FUNCTION IF EXISTS public.set_updated_at();

-- 1. Reusable timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. Enable and force Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 4. Least-privilege table grants (no anon access; no client-side role self-promotion)
REVOKE ALL ON public.profiles FROM anon, public;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 5. Server-side helper to check if the current authenticated user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 6. RLS Policies on public.profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- ============================================================================
-- Admin Provisioning Instructions (Run manually in Supabase SQL Editor)
-- ============================================================================
-- 1. Disable public sign-ups in Supabase Dashboard -> Authentication -> Providers -> Email.
-- 2. Create Shilpi's user in Supabase Dashboard -> Authentication -> Users -> Add User.
-- 3. Provision her admin profile by running:
--
-- INSERT INTO public.profiles (id, email, display_name, role, status)
-- SELECT id, email, 'Shilpi Chauhan', 'admin', 'active'
-- FROM auth.users
-- WHERE email = '<ADMIN_EMAIL>'
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'admin', status = 'active', display_name = EXCLUDED.display_name;

