-- Run this in Supabase → SQL Editor
-- Adds structured academic background columns to the profiles table.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS uva_level   text,         -- 'undergraduate' | 'graduate' | 'phd'
  ADD COLUMN IF NOT EXISTS uva_school  text,         -- primary school name
  ADD COLUMN IF NOT EXISTS uva_programs jsonb         -- array of { type, school, program, customProgram? }
    DEFAULT '[]'::jsonb;
