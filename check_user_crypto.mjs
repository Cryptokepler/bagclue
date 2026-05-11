import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const { data, error } = await supabase
  .from('customer_profiles')
  .select('id, user_id, email, name, created_at, updated_at')
  .eq('email', 'cryptokepleroficial@gmail.com')
  .order('created_at', { ascending: false })

if (error) {
  console.error('Query error:', error)
  process.exit(1)
}

if (!data || data.length === 0) {
  console.log('No profile found for cryptokepleroficial@gmail.com')
  process.exit(0)
}

const profile = data[0]
const createdAt = new Date(profile.created_at)
const now = new Date()
const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

console.log('Profile found:')
console.log('  ID:', profile.id)
console.log('  User ID:', profile.user_id)
console.log('  Email:', profile.email)
console.log('  Name:', profile.name || '(null)')
console.log('  Created:', profile.created_at)
console.log('  Updated:', profile.updated_at)
console.log('  Minutes since creation:', minutesSinceCreation.toFixed(1))
console.log('  Is new (<5 min):', minutesSinceCreation < 5 ? 'YES' : 'NO')
console.log('')
console.log('Current time:', now.toISOString())
console.log('Profile created:', createdAt.toISOString())
