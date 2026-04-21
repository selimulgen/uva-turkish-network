-- ============================================================
-- Profile Enrichment Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Alumni enrichment columns ─────────────────────────────────

-- Career timeline: array of {role, company, start_year, end_year}
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_history              JSONB     DEFAULT '[]';

-- Topics the alumni can help students with (tag multi-select)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_help_with             TEXT[]    DEFAULT '{}';

-- Where the alumni is originally from (e.g. "Istanbul")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hometown                  TEXT      DEFAULT '';

-- How they prefer to meet: 'virtual' | 'in_person' | 'either'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_preference   TEXT      DEFAULT '';

-- Optional note about availability (e.g. "I reply within a week")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_note         TEXT      DEFAULT '';

-- A short piece of advice or quote the alumni wants to share
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS advice_snippet            TEXT      DEFAULT '';

-- ── Student enrichment columns ────────────────────────────────

-- Industries / fields the student is targeting
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_interests          TEXT[]    DEFAULT '{}';

-- Link to personal site, GitHub, or hosted resume
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url             TEXT      DEFAULT '';

-- UVA clubs and activities (stored as a tag array)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extracurriculars          TEXT[]    DEFAULT '{}';

-- High school name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS high_school_name          TEXT      DEFAULT '';

-- 'Turkey' or 'Other'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS high_school_country       TEXT      DEFAULT '';

-- If 'Other', what country
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS high_school_other_country TEXT      DEFAULT '';

-- City of high school (most useful for Turkey)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS high_school_city          TEXT      DEFAULT '';
