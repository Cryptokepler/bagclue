#!/usr/bin/env node

/**
 * Fase 5B - Validation Tests
 * Tests customer orders panel end-to-end
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDAzNDAsImV4cCI6MjA5Mjk3NjM0MH0.NZFdqy2CUlVmXulXGekUj4O1cbm43oxzk0BkAvwXFP8'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🧪 FASE 5B - VALIDATION TESTS\n')

// Test 1: Check user_id column exists
console.log('1️⃣  Checking orders.user_id column...')
try {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('user_id')
    .limit(1)
  
  if (error) {
    console.log('   ❌ FAIL: user_id column does not exist')
    console.log('   Error:', error.message)
  } else {
    console.log('   ✅ PASS: user_id column exists')
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 2: Check RLS enabled on orders
console.log('\n2️⃣  Checking RLS on orders...')
try {
  const { data, error } = await supabaseAdmin.rpc('exec', {
    sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders';"
  })
  
  // Alternative: try querying pg_catalog
  const query = `
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = 'orders' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  `
  
  // Can't execute raw SQL via client, will check via policies
  console.log('   ⚠️  Cannot check directly via client API')
  console.log('   Checking via policies existence instead...')
  
  // Try to query without auth - should fail if RLS is enabled
  const { data: testData, error: testError } = await supabaseClient
    .from('orders')
    .select('id')
    .limit(1)
  
  if (testError && testError.message.includes('row-level security')) {
    console.log('   ✅ PASS: RLS appears to be enabled (anon query blocked)')
  } else if (testError) {
    console.log('   ⚠️  Got error:', testError.message)
  } else {
    console.log('   ⚠️  Query succeeded - RLS might not be fully restrictive for anon')
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 3: Check RLS enabled on order_items
console.log('\n3️⃣  Checking RLS on order_items...')
try {
  const { data: testData, error: testError } = await supabaseClient
    .from('order_items')
    .select('id')
    .limit(1)
  
  if (testError && testError.message.includes('row-level security')) {
    console.log('   ✅ PASS: RLS appears to be enabled (anon query blocked)')
  } else if (testError) {
    console.log('   ⚠️  Got error:', testError.message)
  } else {
    console.log('   ⚠️  Query succeeded - RLS might not be fully restrictive for anon')
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 4: Check existing orders have data
console.log('\n4️⃣  Checking existing orders...')
try {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, customer_email, user_id, tracking_token')
    .limit(5)
  
  if (error) {
    console.log('   ❌ FAIL:', error.message)
  } else {
    console.log('   ✅ PASS: Found', orders.length, 'orders')
    if (orders.length > 0) {
      console.log('\n   Sample orders:')
      orders.forEach(o => {
        console.log(`   - ${o.id.slice(0,8)} | ${o.customer_email} | user_id: ${o.user_id ? o.user_id.slice(0,8) : 'null'} | tracking: ${o.tracking_token ? 'yes' : 'no'}`)
      })
    }
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 5: Check customer_profiles exist
console.log('\n5️⃣  Checking customer_profiles...')
try {
  const { data: profiles, error } = await supabaseAdmin
    .from('customer_profiles')
    .select('user_id, email')
    .limit(5)
  
  if (error) {
    console.log('   ❌ FAIL:', error.message)
  } else {
    console.log('   ✅ PASS: Found', profiles.length, 'customer profiles')
    if (profiles.length > 0) {
      console.log('\n   Sample profiles:')
      profiles.forEach(p => {
        console.log(`   - ${p.email} | user_id: ${p.user_id.slice(0,8)}`)
      })
    }
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 6: Service role can access all orders (admin simulation)
console.log('\n6️⃣  Testing service role access (admin simulation)...')
try {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, customer_email, user_id')
    .limit(10)
  
  if (error) {
    console.log('   ❌ FAIL: Service role cannot access orders')
    console.log('   Error:', error.message)
  } else {
    console.log('   ✅ PASS: Service role can access all orders (', orders.length, 'fetched)')
  }
} catch (e) {
  console.log('   ❌ FAIL:', e.message)
}

// Test 7: Check for dangerous public policies
console.log('\n7️⃣  Checking for dangerous public policies...')
console.log('   ⚠️  Cannot query pg_policies directly via client')
console.log('   Manual verification required in Supabase dashboard:')
console.log('   - Go to: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/auth/policies')
console.log('   - Check orders policies')
console.log('   - Verify NO policy with: USING (tracking_token IS NOT NULL)')
console.log('   - Verify NO policy with: WITH CHECK (true) for INSERT on anon/authenticated')

console.log('\n✅ AUTOMATED TESTS COMPLETE')
console.log('\n📋 MANUAL TESTS REQUIRED:')
console.log('1. Login with a test customer account')
console.log('2. Visit /account/orders')
console.log('3. Verify only customer\'s own orders appear')
console.log('4. Click on order detail')
console.log('5. Try to access another customer\'s order ID directly')
console.log('6. Test tracking button')
console.log('7. Test admin access to /admin/orders')
console.log('8. Verify checkout still works')
console.log('9. Verify public tracking /track/[token] still works')
