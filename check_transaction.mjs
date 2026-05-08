import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fetch transactions with proof_uploaded status
const { data, error } = await supabase
  .from('payment_transactions')
  .select('id, proof_url, proof_file_name, proof_file_type, proof_uploaded_at, status')
  .in('status', ['proof_uploaded', 'awaiting_approval'])
  .eq('payment_method', 'bank_transfer_mxn')
  .order('proof_uploaded_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('Transactions with proof_uploaded:');
console.log(JSON.stringify(data, null, 2));

if (data && data.length > 0) {
  console.log('\nFirst transaction analysis:');
  console.log('proof_url exists:', !!data[0].proof_url);
  console.log('proof_url is null:', data[0].proof_url === null);
  console.log('proof_url length:', data[0].proof_url?.length || 0);
  if (data[0].proof_url) {
    console.log('proof_url preview:', data[0].proof_url.substring(0, 150));
  }
}
