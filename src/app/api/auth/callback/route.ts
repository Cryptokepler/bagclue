import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'

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

      // Successful OAuth login - redirect to next destination
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

      // Successful magic link login - redirect to account dashboard
      return NextResponse.redirect(new URL('/account', req.url))
    }

    // No valid auth method found
    return NextResponse.redirect(new URL('/account/login?error=invalid_callback', req.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/account/login?error=server_error', req.url))
  }
}
