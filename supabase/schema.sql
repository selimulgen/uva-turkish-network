-- ============================================================
-- UVA Turkish Network — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (once)
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT        NOT NULL,
  full_name           TEXT        NOT NULL DEFAULT '',
  role                TEXT        NOT NULL DEFAULT 'student'
                      CHECK (role IN ('student', 'alumni', 'admin')),
  avatar_url          TEXT,

  -- Student fields
  graduation_year     INTEGER,
  major               TEXT        DEFAULT '',
  degree_type         TEXT        DEFAULT '',
  bio                 TEXT        DEFAULT '',
  looking_for         TEXT[]      DEFAULT '{}',

  -- Alumni fields
  uva_graduation_year INTEGER,
  uva_major           TEXT        DEFAULT '',
  "current_role"      TEXT        DEFAULT '',
  company             TEXT        DEFAULT '',
  industry            TEXT        DEFAULT '',
  city                TEXT        DEFAULT '',
  linkedin_url        TEXT        DEFAULT '',
  show_contact_info   BOOLEAN     NOT NULL DEFAULT TRUE,
  open_to_coffee_chat BOOLEAN     NOT NULL DEFAULT TRUE,
  open_to_mentorship  BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Meta
  profile_completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Jobs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT        NOT NULL,
  company         TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  type            TEXT        NOT NULL
                  CHECK (type IN ('full_time', 'internship', 'referral')),
  location        TEXT        DEFAULT '',
  application_url TEXT        DEFAULT '',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Requests (coffee chat / mentorship) ──────────────────────
CREATE TABLE IF NOT EXISTS public.requests (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user   UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT        NOT NULL
              CHECK (type IN ('coffee_chat', 'mentorship')),
  message     TEXT        DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user   UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'alumni' THEN 'alumni'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'jobs', 'requests', 'messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── Profiles RLS ──────────────────────────────────────────────

-- Anyone can view completed alumni profiles (for the public landing page)
CREATE POLICY "anon_view_alumni" ON public.profiles
  FOR SELECT
  TO anon
  USING (role = 'alumni' AND profile_completed = TRUE);

-- Authenticated users can view all completed profiles
CREATE POLICY "auth_view_all_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (profile_completed = TRUE OR id = auth.uid());

-- Users can insert their own profile (handled by trigger but just in case)
CREATE POLICY "users_insert_own_profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can delete profiles
CREATE POLICY "admin_delete_profiles" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins can update any profile (e.g. role changes)
CREATE POLICY "admin_update_any_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── Jobs RLS ──────────────────────────────────────────────────

-- Anyone can view active jobs
CREATE POLICY "anyone_view_active_jobs" ON public.jobs
  FOR SELECT
  USING (is_active = TRUE);

-- Alumni can create jobs
CREATE POLICY "alumni_create_jobs" ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = posted_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('alumni', 'admin')
    )
  );

-- Alumni can update their own jobs; admins can update any
CREATE POLICY "alumni_update_own_jobs" ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = posted_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "alumni_delete_own_jobs" ON public.jobs
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = posted_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Requests RLS ─────────────────────────────────────────────

-- Users can view requests they're part of
CREATE POLICY "users_view_own_requests" ON public.requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Any authenticated user can create a request
CREATE POLICY "auth_create_requests" ON public.requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user);

-- Recipient can update status (accept/decline)
CREATE POLICY "recipient_update_requests" ON public.requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user OR auth.uid() = from_user);

-- ── Messages RLS ─────────────────────────────────────────────

-- Users can view messages they sent or received
CREATE POLICY "users_view_own_messages" ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Any authenticated user can send messages
CREATE POLICY "auth_send_messages" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user);

-- Recipient can mark as read
CREATE POLICY "recipient_update_messages" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user);

-- ── Admin overrides ───────────────────────────────────────────
-- Admins can read everything
CREATE POLICY "admin_read_all_jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    NOT is_active AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Done! After running this:
-- 1. Go to Supabase Authentication > URL Configuration
--    and set Site URL to your Vercel domain.
-- 2. To grant yourself admin:
--    UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
