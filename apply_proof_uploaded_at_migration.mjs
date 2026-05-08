#!/usr/bin/env node
// Apply PAYMENTS_MVP2A_ADD_PROOF_UPLOADED_AT migration
// Usage: node apply_proof_uploaded_at_migration.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying PAYMENTS_MVP2A_ADD_PROOF_UPLOADED_AT migration...\n');

  try {
    // Execute ALTER TABLE
    console.log('Step 1: Adding proof_uploaded_at column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE payment_transactions
        ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;
      `
    }).catch(() => {
      // If RPC doesn't exist, use raw SQL via Postgres connection
      // This is a workaround since Supabase JS client doesn't support raw DDL
      throw new Error('RPC exec_sql not available. Please execute migration manually in Supabase SQL Editor.');
    });

    if (alterError) {
      console.error('❌ Failed to add column:', alterError);
      process.exit(1);
    }

    console.log('✅ Column added successfully\n');

    // Validate
    console.log('Step 2: Validating migration...');
    const { data, error: validationError } = await supabase
      .from('payment_transactions')
      .select('proof_uploaded_at')
      .limit(1);

    if (validationError) {
      console.error('❌ Validation failed:', validationError);
      process.exit(1);
    }

    console.log('✅ Validation successful\n');
    console.log('✅ Migration completed successfully!');
    console.log('\nColumn proof_uploaded_at is now available in payment_transactions table.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n⚠️  Please execute the migration manually in Supabase SQL Editor:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql');
    console.log('   2. Paste SQL from: PAYMENTS_MVP2A_ADD_PROOF_UPLOADED_AT.sql');
    console.log('   3. Run the query');
    process.exit(1);
  }
}

applyMigration();
