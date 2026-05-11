import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/mailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Test endpoint que simula el flujo exacto del callback
 * GET /api/test-callback-flow?user_id=xxx
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
  }

  const logs: string[] = []
  
  try {
    logs.push(`[1] Simulating callback for user_id: ${userId}`)
    
    // Get user from auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      logs.push(`[2] ❌ User not found: ${userError?.message || 'null'}`)
      return NextResponse.json({ success: false, logs }, { status: 404 })
    }
    
    logs.push(`[2] ✅ User found: ${user.email}`)
    
    // Query customer_profiles
    logs.push(`[3] Querying customer_profiles for user_id: ${userId}`)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('customer_profiles')
      .select('created_at, name')
      .eq('user_id', userId)
      .single()
    
    if (profileError) {
      logs.push(`[4] ❌ Profile query error: ${profileError.message}`)
      return NextResponse.json({ success: false, logs }, { status: 500 })
    }
    
    if (!profile) {
      logs.push(`[4] ❌ Profile not found`)
      return NextResponse.json({ success: false, logs }, { status: 404 })
    }
    
    logs.push(`[4] ✅ Profile found, created: ${profile.created_at}`)
    
    // Check timestamp
    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60
    
    logs.push(`[5] Minutes since creation: ${minutesSinceCreation.toFixed(2)}`)
    logs.push(`[6] Within 15 min window: ${minutesSinceCreation < 15 ? 'YES ✅' : 'NO ❌'}`)
    
    if (minutesSinceCreation >= 15) {
      logs.push(`[7] Skipping email (user too old)`)
      return NextResponse.json({ success: false, reason: 'User too old', logs })
    }
    
    // Send email
    logs.push(`[7] Attempting to send welcome email to: ${user.email}`)
    const emailSuccess = await sendWelcomeEmail({
      to: user.email!,
      customerName: profile.name || undefined,
    })
    
    if (emailSuccess) {
      logs.push(`[8] ✅ Email sent successfully`)
      return NextResponse.json({ success: true, logs })
    } else {
      logs.push(`[8] ❌ Email failed to send (SMTP error)`)
      return NextResponse.json({ success: false, reason: 'SMTP failed', logs }, { status: 500 })
    }
    
  } catch (error: any) {
    logs.push(`[ERROR] Unexpected: ${error.message}`)
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 })
  }
}
