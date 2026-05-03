#!/usr/bin/env node

/**
 * Test Suite: Fase 5D.2A - GET + POST Addresses
 * 
 * Tests:
 * 1. GET sin token → 401
 * 2. GET token inválido → 401
 * 3. GET usuario correcto sin direcciones → []
 * 4. POST sin token → 401
 * 5. POST token inválido → 401
 * 6. POST faltando campos obligatorios → 400
 * 7. POST primera dirección → is_default true
 * 8. GET usuario correcto → devuelve dirección creada
 * 9. POST segunda dirección con is_default false → is_default false
 * 10. POST tercera dirección con is_default true → solo una default
 * 11. Confirmar en DB solo una default por usuario
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const API_BASE = 'http://localhost:3000';
const ENDPOINT = `${API_BASE}/api/account/addresses`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

async function createTestUser() {
  const email = `test-${Date.now()}@bagclue.test`;
  const password = 'TestPassword123!';
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);
  
  return { email, password, userId: data.user.id };
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(`Failed to sign in: ${error.message}`);
  
  return data.session.access_token;
}

async function cleanupTestUser(userId) {
  // Delete addresses
  await supabase
    .from('customer_addresses')
    .delete()
    .eq('user_id', userId);

  // Delete user
  await supabase.auth.admin.deleteUser(userId);
}

async function runTests() {
  console.log('🧪 Testing Fase 5D.2A: GET + POST Addresses\n');
  console.log('='='.repeat(80) + '\n');

  let testUser = null;
  let validToken = null;

  try {
    // ===== SETUP: Create test user and get token =====
    console.log('📋 SETUP: Creating test user...\n');
    testUser = await createTestUser();
    validToken = await signIn(testUser.email, testUser.password);
    console.log(`✓ Test user created: ${testUser.email}`);
    console.log(`✓ Valid token obtained\n`);

    // ===== TEST 1: GET sin token → 401 =====
    console.log('🔒 AUTH TESTS\n');
    
    const res1 = await fetch(ENDPOINT);
    test(
      'Test 1: GET sin token → 401',
      res1.status === 401,
      `Status: ${res1.status}`
    );

    // ===== TEST 2: GET token inválido → 401 =====
    const res2 = await fetch(ENDPOINT, {
      headers: { 'Authorization': 'Bearer invalid-token-12345' }
    });
    test(
      'Test 2: GET token inválido → 401',
      res2.status === 401,
      `Status: ${res2.status}`
    );

    // ===== TEST 3: GET usuario correcto sin direcciones → [] =====
    console.log('\n📭 EMPTY STATE TESTS\n');
    
    const res3 = await fetch(ENDPOINT, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const data3 = await res3.json();
    test(
      'Test 3: GET usuario sin direcciones → []',
      res3.status === 200 && Array.isArray(data3.addresses) && data3.addresses.length === 0,
      `Status: ${res3.status}, Addresses: ${data3.addresses?.length || 0}`
    );

    // ===== TEST 4: POST sin token → 401 =====
    const res4 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        country: 'México',
        city: 'CDMX',
        address_line1: 'Calle Test 123',
      })
    });
    test(
      'Test 4: POST sin token → 401',
      res4.status === 401,
      `Status: ${res4.status}`
    );

    // ===== TEST 5: POST token inválido → 401 =====
    const res5 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-12345'
      },
      body: JSON.stringify({
        full_name: 'Test User',
        country: 'México',
        city: 'CDMX',
        address_line1: 'Calle Test 123',
      })
    });
    test(
      'Test 5: POST token inválido → 401',
      res5.status === 401,
      `Status: ${res5.status}`
    );

    // ===== TEST 6: POST faltando campos obligatorios → 400 =====
    console.log('\n🔍 VALIDATION TESTS\n');
    
    const res6 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        full_name: 'Test User',
        // Falta country, city, address_line1
      })
    });
    const data6 = await res6.json();
    test(
      'Test 6: POST faltando campos → 400',
      res6.status === 400 && data6.error === 'Validation failed',
      `Status: ${res6.status}, Error: ${data6.error}`
    );

    // ===== TEST 7: POST primera dirección → is_default true =====
    console.log('\n🏠 ADDRESS CREATION TESTS\n');
    
    const res7 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        full_name: 'Dirección Test 1',
        country: 'México',
        city: 'Ciudad de México',
        address_line1: 'Calle Primera 123',
        is_default: false, // Debe ignorarse y forzar true
      })
    });
    const data7 = await res7.json();
    test(
      'Test 7: POST primera dirección → is_default true (automático)',
      res7.status === 201 && data7.address.is_default === true,
      `Status: ${res7.status}, is_default: ${data7.address?.is_default}`
    );

    const address1Id = data7.address?.id;

    // ===== TEST 8: GET usuario correcto → devuelve dirección creada =====
    const res8 = await fetch(ENDPOINT, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const data8 = await res8.json();
    test(
      'Test 8: GET después de crear → 1 dirección',
      res8.status === 200 && data8.addresses.length === 1 && data8.addresses[0].id === address1Id,
      `Status: ${res8.status}, Count: ${data8.addresses?.length}, ID match: ${data8.addresses?.[0]?.id === address1Id}`
    );

    // ===== TEST 9: POST segunda dirección con is_default false → is_default false =====
    const res9 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        full_name: 'Dirección Test 2',
        country: 'México',
        city: 'Guadalajara',
        address_line1: 'Calle Segunda 456',
        is_default: false,
      })
    });
    const data9 = await res9.json();
    test(
      'Test 9: POST segunda dirección is_default=false → false',
      res9.status === 201 && data9.address.is_default === false,
      `Status: ${res9.status}, is_default: ${data9.address?.is_default}`
    );

    const address2Id = data9.address?.id;

    // ===== TEST 10: POST tercera dirección con is_default true → solo una default =====
    const res10 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        full_name: 'Dirección Test 3',
        country: 'México',
        city: 'Monterrey',
        address_line1: 'Calle Tercera 789',
        is_default: true, // Debe desmarcar las otras
      })
    });
    const data10 = await res10.json();
    test(
      'Test 10: POST tercera dirección is_default=true → true',
      res10.status === 201 && data10.address.is_default === true,
      `Status: ${res10.status}, is_default: ${data10.address?.is_default}`
    );

    const address3Id = data10.address?.id;

    // ===== TEST 11: Confirmar en DB solo una default por usuario =====
    console.log('\n🗄️  DATABASE VALIDATION\n');
    
    const { data: allAddresses, error: dbError } = await supabase
      .from('customer_addresses')
      .select('id, full_name, is_default')
      .eq('user_id', testUser.userId)
      .order('created_at');

    if (dbError) {
      test('Test 11: Query DB addresses', false, `Error: ${dbError.message}`);
    } else {
      const defaultCount = allAddresses.filter(a => a.is_default).length;
      test(
        'Test 11: Solo una dirección default en DB',
        defaultCount === 1,
        `Default count: ${defaultCount}, Total: ${allAddresses.length}`
      );

      // Verificar que la tercera es la default
      const defaultAddress = allAddresses.find(a => a.is_default);
      test(
        'Test 11.1: La tercera dirección es la default',
        defaultAddress?.id === address3Id,
        `Default ID: ${defaultAddress?.id}, Expected: ${address3Id}`
      );

      // Verificar que las otras no son default
      test(
        'Test 11.2: Primera dirección ya no es default',
        allAddresses.find(a => a.id === address1Id)?.is_default === false,
        `Address 1 is_default: ${allAddresses.find(a => a.id === address1Id)?.is_default}`
      );

      test(
        'Test 11.3: Segunda dirección sigue sin ser default',
        allAddresses.find(a => a.id === address2Id)?.is_default === false,
        `Address 2 is_default: ${allAddresses.find(a => a.id === address2Id)?.is_default}`
      );

      console.log('\n📋 Addresses in DB:');
      allAddresses.forEach((addr, i) => {
        console.log(`   ${i + 1}. ${addr.full_name} - is_default: ${addr.is_default}`);
      });
    }

    // ===== TEST 12: GET con múltiples direcciones → orden correcto =====
    console.log('\n📊 ORDERING TESTS\n');
    
    const res12 = await fetch(ENDPOINT, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const data12 = await res12.json();
    
    test(
      'Test 12: GET devuelve 3 direcciones',
      res12.status === 200 && data12.addresses.length === 3,
      `Status: ${res12.status}, Count: ${data12.addresses?.length}`
    );

    test(
      'Test 12.1: Primera en lista es la default',
      data12.addresses[0].is_default === true,
      `First is_default: ${data12.addresses[0]?.is_default}`
    );

    test(
      'Test 12.2: Orden: default primero, luego created_at desc',
      data12.addresses[0].id === address3Id && // Default first (most recent)
      data12.addresses[1].id === address2Id && // Second created
      data12.addresses[2].id === address1Id,   // First created
      `Order: ${data12.addresses.map(a => a.full_name).join(' → ')}`
    );

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
    failedTests++;
  } finally {
    // ===== CLEANUP =====
    if (testUser) {
      console.log('\n🧹 CLEANUP: Deleting test user and addresses...\n');
      await cleanupTestUser(testUser.userId);
      console.log('✓ Test user deleted\n');
    }

    // ===== SUMMARY =====
    console.log('='.repeat(80));
    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   Total: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED\n');
      process.exit(0);
    } else {
      console.log(`⚠️  ${failedTests} TEST(S) FAILED\n`);
      process.exit(1);
    }
  }
}

// Run tests
runTests();
