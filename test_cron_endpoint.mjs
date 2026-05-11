/**
 * Test CRON Endpoint with Authorization
 * 
 * SECURITY: This script does NOT print the CRON_SECRET value
 * It only tests the endpoint and reports PASS/FAIL
 */

import { readFileSync } from 'fs'

// Prompt for CRON_SECRET (user must provide it)
console.log('========================================')
console.log('CRON ENDPOINT TEST')
console.log('========================================\n')

console.log('⚠️  This test requires CRON_SECRET from Vercel Production environment')
console.log('The secret will NOT be printed or logged\n')

// For testing purposes, we'll simulate the test
// In real scenario, you'd pass CRON_SECRET as env var: CRON_SECRET=xxx node test_cron_endpoint.mjs

const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not provided')
  console.log('\nUsage: CRON_SECRET=your_secret node test_cron_endpoint.mjs\n')
  console.log('Or manually test with:')
  console.log('curl -X GET https://bagclue.vercel.app/api/cron/welcome-email \\')
  console.log('  -H "Authorization: Bearer YOUR_CRON_SECRET"\n')
  process.exit(1)
}

console.log('Testing endpoint with Authorization header...\n')

try {
  const response = await fetch('https://bagclue.vercel.app/api/cron/welcome-email', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`
    }
  })
  
  const status = response.status
  const data = await response.json()
  
  console.log('HTTP Status:', status)
  console.log('Response:', JSON.stringify(data, null, 2))
  
  if (status === 200) {
    console.log('\n✅ PASS: Endpoint executed successfully')
    
    if (data.success) {
      console.log('✅ CRON logic executed')
      console.log(`   - Total: ${data.results?.total || 0}`)
      console.log(`   - Sent: ${data.results?.sent || 0}`)
      console.log(`   - Failed: ${data.results?.failed || 0}`)
      
      if (data.results?.total === 0) {
        console.log('\n✅ No pending welcome emails (expected after backfill)')
      }
    } else {
      console.log('⚠️  Success=false, check response')
    }
  } else {
    console.log('\n❌ FAIL: Unexpected status code')
  }
  
  console.log('\n⚠️  SECURITY CHECK: CRON_SECRET was NOT printed ✅')
  
} catch (err) {
  console.error('❌ Request failed:', err.message)
  process.exit(1)
}
