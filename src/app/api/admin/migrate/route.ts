import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * TEMPORARY API route to apply migrations 016 and 017
 * This route uses supabaseAdmin (service role) to execute SQL
 * 
 * Security: Should be protected or removed after migrations are applied
 */

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Simple password protection
    if (password !== 'bagclue_migrate_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[MIGRATE] Starting migrations...')
    
    // Read migration files
    const migration016 = readFileSync(
      join(process.cwd(), 'supabase/migrations/016_add_user_id_to_orders.sql'),
      'utf-8'
    )
    
    const migration017 = readFileSync(
      join(process.cwd(), 'supabase/migrations/017_orders_rls_customer.sql'),
      'utf-8'
    )
    
    // Execute migration 016
    console.log('[MIGRATE] Applying 016_add_user_id_to_orders...')
    const { error: error016 } = await supabaseAdmin.rpc('exec', { 
      sql: migration016 
    })
    
    if (error016) {
      // Supabase doesn't have a built-in exec RPC, so we need to use raw SQL
      // Let's try a different approach: use pg directly
      throw new Error(`Migration 016 failed: ${error016.message}`)
    }
    
    console.log('[MIGRATE] ✅ Migration 016 applied')
    
    // Execute migration 017
    console.log('[MIGRATE] Applying 017_orders_rls_customer...')
    const { error: error017 } = await supabaseAdmin.rpc('exec', { 
      sql: migration017 
    })
    
    if (error017) {
      throw new Error(`Migration 017 failed: ${error017.message}`)
    }
    
    console.log('[MIGRATE] ✅ Migration 017 applied')
    
    return NextResponse.json({
      success: true,
      message: 'Migrations applied successfully',
      migrations: ['016_add_user_id_to_orders', '017_orders_rls_customer']
    })
    
  } catch (error: any) {
    console.error('[MIGRATE] Error:', error)
    return NextResponse.json({
      error: error.message,
      hint: 'Migrations may need to be applied manually via Supabase SQL Editor'
    }, { status: 500 })
  }
}
