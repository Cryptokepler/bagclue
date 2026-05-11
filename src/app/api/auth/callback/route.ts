import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'

/**
 * Welcome Email Delivery: Handled by CRON endpoint
 * 
 * Previous approach: Send email directly from OAuth/Magic Link callback
 * Problem: Lambda can terminate before email sends, unreliable delivery
 * 
 * New approach: CRON-based reliable delivery
 * - Endpoint: /api/cron/welcome-email
 * - Schedule: Every 5 minutes
 * - DB flag: customer_profiles.welcome_email_sent_at
 * - Strategy: Query pending users, send email, mark as sent
 * 
 * Migration: 018_add_welcome_email_tracking.sql
 */

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
      const { data, error: exchangeError } = await supabaseCustomer.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/account/login?error=oauth_exchange_failed', req.url))
      }

      // Successful OAuth login
      // Welcome email is handled by /api/cron/welcome-email (reliable delivery)

      // Redirect to next destination
      return NextResponse.redirect(new URL(next, req.url))
    }

    // Magic Link Flow
    if (token_hash && type === 'magiclink') {
      const { data, error: verifyError } = await supabaseCustomer.auth.verifyOtp({
        token_hash,
        type: 'magiclink',
      })

      if (verifyError) {
        console.error('Magic link verification error:', verifyError)
        return NextResponse.redirect(new URL('/account/login?error=verification_failed', req.url))
      }

      // Successful magic link login
      // Welcome email is handled by /api/cron/welcome-email (reliable delivery)

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
