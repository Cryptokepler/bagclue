import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔍 Checking backfill status...\n')

// Get all orders
const { data: orders } = await supabaseAdmin
  .from('orders')
  .select('id, customer_email, user_id')

// Get all profiles
const { data: profiles } = await supabaseAdmin
  .from('customer_profiles')
  .select('user_id, email')

console.log('📊 Statistics:')
console.log(`Total orders: ${orders.length}`)
console.log(`Total customer profiles: ${profiles.length}`)
console.log(`Orders with user_id: ${orders.filter(o => o.user_id).length}`)
console.log(`Orders without user_id: ${orders.filter(o => !o.user_id).length}`)

console.log('\n📧 Orders by email:')
const emailGroups = {}
orders.forEach(o => {
  if (!emailGroups[o.customer_email]) {
    emailGroups[o.customer_email] = { total: 0, linked: 0, profile: null }
  }
  emailGroups[o.customer_email].total++
  if (o.user_id) emailGroups[o.customer_email].linked++
})

// Add profile info
profiles.forEach(p => {
  if (emailGroups[p.email]) {
    emailGroups[p.email].profile = p.user_id
  }
})

Object.keys(emailGroups).forEach(email => {
  const info = emailGroups[email]
  console.log(`\n${email}:`)
  console.log(`  - Orders: ${info.total}`)
  console.log(`  - Linked: ${info.linked}`)
  console.log(`  - Has profile: ${info.profile ? 'Yes (' + info.profile.slice(0,8) + ')' : 'No'}`)
  
  if (info.profile && info.linked === 0) {
    console.log(`  ⚠️  Has profile but orders NOT linked - backfill may have failed`)
  }
})

// Check if backfill should have worked
console.log('\n🔧 Backfill analysis:')
const profileEmails = profiles.map(p => p.email)
const ordersNeedingBackfill = orders.filter(o => !o.user_id && profileEmails.includes(o.customer_email))

if (ordersNeedingBackfill.length > 0) {
  console.log(`❌ Found ${ordersNeedingBackfill.length} orders that should have been backfilled but weren't`)
  console.log('\nRunning manual backfill...')
  
  for (const order of ordersNeedingBackfill) {
    const profile = profiles.find(p => p.email === order.customer_email)
    if (profile) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ user_id: profile.user_id })
        .eq('id', order.id)
      
      if (error) {
        console.log(`  ❌ Failed to link order ${order.id.slice(0,8)}: ${error.message}`)
      } else {
        console.log(`  ✅ Linked order ${order.id.slice(0,8)} to user ${profile.user_id.slice(0,8)}`)
      }
    }
  }
  
  console.log('\n✅ Manual backfill complete')
} else {
  console.log('✅ All orders that should be linked are linked')
}
