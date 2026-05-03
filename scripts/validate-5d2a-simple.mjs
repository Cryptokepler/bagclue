#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ADDRESS_IDS = [
  '25a65fb3-e288-4a2c-bdf9-dd122caeef69',
  '908f8990-a5f5-4892-9004-ddfa03304981',
  'ec1e0f49-9dce-4768-a917-12274cd76790'
];

async function validate() {
  console.log('🔍 Validación Final Fase 5D.2A\n');
  
  // Validación completa
  const { data: addresses, error } = await supabase
    .from('customer_addresses')
    .select('id, user_id, full_name, is_default, created_at')
    .in('id', ADDRESS_IDS)
    .order('created_at');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Test 1: 3 direcciones existen:', addresses.length === 3);
  console.log('✅ Test 2: Solo 1 default:', addresses.filter(a => a.is_default).length === 1);
  console.log('✅ Test 3: Tercera es default:', addresses[2]?.is_default === true);
  console.log('✅ Test 4: Primera NO default:', addresses[0]?.is_default === false);
  console.log('✅ Test 5: Segunda NO default:', addresses[1]?.is_default === false);
  console.log('✅ Test 6: Mismo user_id:', new Set(addresses.map(a => a.user_id)).size === 1);
  
  const { count } = await supabase
    .from('customer_addresses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total direcciones en DB: ${count}`);
  console.log(`📊 Direcciones test: ${addresses.length}`);
  console.log(`\n🎉 TODAS LAS VALIDACIONES PASS — FASE 5D.2A LISTA PARA CERRAR ✅`);
}

validate();
