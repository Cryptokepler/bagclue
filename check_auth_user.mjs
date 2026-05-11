import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

// Query auth.users via Admin API
const { data: { users }, error } = await supabase.auth.admin.listUsers()

if (error) {
  console.error('Query error:', error)
  process.exit(1)
}

const user = users.find(u => u.email === 'cryptokepleroficial@gmail.com')

if (!user) {
  console.log('No auth user found for cryptokepleroficial@gmail.com')
  process.exit(0)
}

const createdAt = new Date(user.created_at)
const now = new Date()
const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

console.log('Auth user found:')
console.log('  ID:', user.id)
console.log('  Email:', user.email)
console.log('  Created:', user.created_at)
console.log('  Last sign in:', user.last_sign_in_at || '(never)')
console.log('  Minutes since user creation:', minutesSinceCreation.toFixed(1))
console.log('')
console.log('Current time:', now.toISOString())
console.log('User created:', createdAt.toISOString())

// Compare with profile
console.log('')
console.log('Profile created: 2026-05-11T12:12:40.286Z (5.9 min ago)')
console.log('Auth user created:', user.created_at)
console.log('Match:', user.created_at === '2026-05-11T12:12:40.286218+00:00' ? 'YES (same timestamp)' : 'Different timestamps')
