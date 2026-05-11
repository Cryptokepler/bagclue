import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('Buscando usuarios creados en últimos 30 minutos...')
console.log('')

const { data: { users } } = await supabase.auth.admin.listUsers()

const now = new Date()
const recentUsers = users
  .filter(u => {
    const created = new Date(u.created_at)
    const minutes = (now.getTime() - created.getTime()) / 1000 / 60
    return minutes < 30
  })
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

if (recentUsers.length === 0) {
  console.log('No hay usuarios creados en últimos 30 minutos')
  process.exit(0)
}

console.log(`Encontrados ${recentUsers.length} usuarios recientes:`)
console.log('')

recentUsers.forEach((user, i) => {
  const created = new Date(user.created_at)
  const minutes = (now.getTime() - created.getTime()) / 1000 / 60
  console.log(`${i+1}. ${user.email}`)
  console.log(`   User ID: ${user.id}`)
  console.log(`   Created: ${user.created_at} (${minutes.toFixed(1)} min ago)`)
  console.log(`   Last sign in: ${user.last_sign_in_at || '(never)'}`)
  console.log('')
})
