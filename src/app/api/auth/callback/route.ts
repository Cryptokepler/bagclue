import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/mailer'

// Service role client for server-side queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Check if user is new and send welcome email
 * Fire-and-forget - does not block redirect
 */
async function checkAndSendWelcomeEmail() {
  try {
    // Get current user
    const { data: { user } } = await supabaseCustomer.auth.getUser()
    if (!user) {
      console.log('[Welcome Email] No user found, skipping')
      return
    }

    // Query customer_profiles with service role to bypass RLS
    const { data: profile, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('created_at, name')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('[Welcome Email] Profile query error:', error.message)
      return
    }

    if (!profile) {
      console.log('[Welcome Email] Profile not found, skipping')
      return
    }

    // Check if user was created recently (<5 minutes)
    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

    if (minutesSinceCreation < 5) {
      console.log(`[Welcome Email] New user detected (created ${minutesSinceCreation.toFixed(1)}min ago), sending welcome email to ${user.email}`)
      
      // Send welcome email (fire-and-forget)
      sendWelcomeEmail({
        to: user.email!,
        customerName: profile.name || undefined,
      }).catch(err => {
        console.error('[Welcome Email] Send failed:', err.message)
        // Don't throw - email failure should not break auth flow
      })
    } else {
      console.log(`[Welcome Email] Existing user (created ${minutesSinceCreation.toFixed(1)}min ago), skipping`)
    }
  } catch (error: any) {
    console.error('[Welcome Email] Unexpected error:', error.message)
    // Don't throw - email failure should not break auth flow
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') || '/account'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(new URL('/account/login?error=oauth_failed', req.url))
  }

  try {
    // OAuth Flow (Google, etc.)
    if (code) {
      const { error: exchangeError } = await supabaseCustomer.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/account/login?error=oauth_exchange_failed', req.url))
      }

      // Successful OAuth login - check and send welcome email if new user
      checkAndSendWelcomeEmail().catch(err => {
        console.error('[Welcome Email] Failed in OAuth flow:', err.message)
      })

      // Redirect to next destination
      return NextResponse.redirect(new URL(next, req.url))
    }

    // Magic Link Flow
    if (token_hash && type === 'magiclink') {
      const { error: verifyError } = await supabaseCustomer.auth.verifyOtp({
        token_hash,
        type: 'magiclink',
      })

      if (verifyError) {
        console.error('Magic link verification error:', verifyError)
        return NextResponse.redirect(new URL('/account/login?error=verification_failed', req.url))
      }

      // Successful magic link login - check and send welcome email if new user
      checkAndSendWelcomeEmail().catch(err => {
        console.error('[Welcome Email] Failed in magic link flow:', err.message)
      })

      // Redirect to account dashboard
      return NextResponse.redirect(new URL('/account', req.url))
    }

    // No valid auth method found
    return NextResponse.redirect(new URL('/account/login?error=invalid_callback', req.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/account/login?error=server_error', req.url))
  }
}
