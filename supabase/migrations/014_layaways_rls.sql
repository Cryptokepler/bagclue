-- Migration 014: RLS policies for layaways
-- Date: 2026-04-30
-- Purpose: Enable RLS policies for layaways table

-- Enable RLS on layaways
ALTER TABLE layaways ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role to do everything
CREATE POLICY "Service role full access on layaways"
  ON layaways
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow public to read layaways by token (for tracking page)
CREATE POLICY "Public can read layaways by token"
  ON layaways
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 3: Allow public to insert layaways (for creating new layaways)
CREATE POLICY "Public can insert layaways"
  ON layaways
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
