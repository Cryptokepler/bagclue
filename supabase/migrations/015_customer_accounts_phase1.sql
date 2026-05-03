-- Migration 015: Customer Accounts - Phase 1 (Auth Base)
-- Purpose: Magic link auth, customer_profiles, RLS policies

-- ========================================
-- 1. Customer Profiles Table
-- ========================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customer_profiles_user_id_key UNIQUE(user_id),
  CONSTRAINT customer_profiles_email_key UNIQUE(email)
);

-- Index for faster lookups
CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_email ON customer_profiles(email);

-- ========================================
-- 2. RLS Policies
-- ========================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ========================================
-- 3. Auto-create profile on signup
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize email to lowercase
  INSERT INTO public.customer_profiles (user_id, email)
  VALUES (NEW.id, LOWER(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer_user();

-- ========================================
-- 4. Updated_at trigger
-- ========================================

CREATE OR REPLACE FUNCTION public.update_customer_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_profile_updated_at();
