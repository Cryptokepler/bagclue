// Simular llamada al API desde frontend
const url = 'https://bagclue.vercel.app/api/payments/admin/list';

const response = await fetch(url);
const data = await response.json();

console.log('API Response Status:', response.status);
console.log('API Response:', JSON.stringify(data, null, 2));

if (data.payments && data.payments.length > 0) {
  console.log('\nFirst payment:');
  const p = data.payments[0];
  console.log('proofUrl exists:', !!p.proofUrl);
  console.log('proofUrl value:', p.proofUrl);
}
