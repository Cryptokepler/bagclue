#!/usr/bin/env node

/**
 * Migration runner for Bagclue
 * Applies SQL migrations directly to Supabase PostgreSQL
 */

import { readFileSync } from 'fs'
import pg from 'pg'
const { Client } = pg

// Supabase connection details
// For direct PostgreSQL connection, you need the pooler connection string
// Format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 
  'postgresql://postgres.orhjnwpbzxyqtyrayvoi:[YOUR_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'

async function runMigration(client, filePath, name) {
  console.log(`\n📦 Running migration: ${name}`)
  console.log(`   File: ${filePath}`)
  
  try {
    const sql = readFileSync(filePath, 'utf-8')
    
    console.log(`   Executing SQL (${sql.length} bytes)...`)
    
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    
    console.log(`   ✅ ${name} completed successfully`)
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`   ❌ ${name} failed:`)
    console.error(`   Error: ${error.message}`)
    if (error.detail) console.error(`   Detail: ${error.detail}`)
    if (error.hint) console.error(`   Hint: ${error.hint}`)
    return false
  }
}

async function main() {
  console.log('🚀 Bagclue Database Migrations\n')
  console.log('⚠️  This script requires SUPABASE_DB_URL environment variable')
  console.log('⚠️  Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)\n')
  
  if (SUPABASE_DB_URL.includes('[YOUR_DB_PASSWORD]')) {
    console.error('❌ Error: SUPABASE_DB_URL not configured')
    console.error('Set environment variable: export SUPABASE_DB_URL="postgresql://..."')
    console.error('\nAlternatively, apply migrations manually via Supabase SQL Editor:')
    console.error('1. Go to: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql')
    console.error('2. Copy content from: supabase/migrations/016_add_user_id_to_orders.sql')
    console.error('3. Run it')
    console.error('4. Copy content from: supabase/migrations/017_orders_rls_customer.sql')
    console.error('5. Run it\n')
    process.exit(1)
  }
  
  const client = new Client({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    console.log('📡 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected\n')
    
    // Run migrations in order
    const migrations = [
      { file: 'supabase/migrations/016_add_user_id_to_orders.sql', name: '016_add_user_id_to_orders' },
      { file: 'supabase/migrations/017_orders_rls_customer.sql', name: '017_orders_rls_customer' }
    ]
    
    for (const migration of migrations) {
      const success = await runMigration(client, migration.file, migration.name)
      if (!success) {
        console.error('\n❌ Migration failed. Stopping.')
        process.exit(1)
      }
    }
    
    console.log('\n✅ All migrations completed successfully!')
    console.log('🎉 Database is ready for Fase 5B - Customer Orders Panel\n')
    
  } catch (error) {
    console.error('❌ Connection error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
