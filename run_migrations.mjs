import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(filePath, name) {
  console.log(`\n📦 Running migration: ${name}`)
  
  try {
    const sql = readFileSync(filePath, 'utf-8')
    
    // Split SQL by statements (simple approach - assumes no complex nested statements)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (!statement) continue
      
      console.log(`   Executing: ${statement.slice(0, 60)}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_string: statement + ';' 
      })
      
      if (error) {
        // Try direct query if rpc fails
        const { error: queryError } = await supabase.from('_migrations').insert({})
        
        // If that doesn't work either, we'll use a different approach
        throw error
      }
    }
    
    console.log(`   ✅ ${name} completed`)
    return true
  } catch (error) {
    console.error(`   ❌ ${name} failed:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Bagclue migrations...\n')
  
  // Run migrations in order
  const migrations = [
    { file: 'supabase/migrations/016_add_user_id_to_orders.sql', name: '016_add_user_id_to_orders' },
    { file: 'supabase/migrations/017_orders_rls_customer.sql', name: '017_orders_rls_customer' }
  ]
  
  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.name)
    if (!success) {
      console.error('\n❌ Migration failed. Stopping.')
      process.exit(1)
    }
  }
  
  console.log('\n✅ All migrations completed successfully!')
}

main()
