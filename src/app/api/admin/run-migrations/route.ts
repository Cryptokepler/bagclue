import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * TEMPORARY: Apply migrations 016 and 017
 * This endpoint should be called once and then removed
 */

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Simple protection
    if (password !== 'bagclue_fase5b_migrate_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[MIGRATIONS] Starting...')
    const results = []
    
    // Migration 016: Add user_id to orders
    console.log('[MIGRATIONS] 016: Adding user_id column to orders...')
    try {
      // Check if column already exists
      const { data: checkData, error: checkError } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .limit(1)
      
      if (checkError && checkError.message.includes('column "user_id" does not exist')) {
        // Column doesn't exist, create it
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
          query: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;'
        })
        
        if (alterError) {
          // Try alternative approach: direct SQL via pg_catalog
          // This won't work with standard Supabase client, need to apply manually
          throw new Error('Cannot alter table via API. Apply migrations manually via SQL Editor.')
        }
        
        results.push({ migration: '016', status: 'applied' })
      } else {
        results.push({ migration: '016', status: 'already_exists' })
      }
    } catch (error: any) {
      results.push({ migration: '016', status: 'error', error: error.message })
    }
    
    return NextResponse.json({
      message: 'Migrations must be applied manually via Supabase SQL Editor',
      instructions: [
        '1. Go to: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql/new',
        '2. Copy content from: supabase/migrations/016_add_user_id_to_orders.sql',
        '3. Run it',
        '4. Copy content from: supabase/migrations/017_orders_rls_customer.sql',
        '5. Run it',
        '6. Verify with: node check_migration_status.mjs'
      ],
      note: 'Supabase client API does not support DDL operations',
      results
    })
    
  } catch (error: any) {
    console.error('[MIGRATIONS] Error:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
