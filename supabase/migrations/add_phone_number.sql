-- Run this in Supabase → SQL Editor
-- Adds phone number column to profiles (alumni-facing).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number text;
