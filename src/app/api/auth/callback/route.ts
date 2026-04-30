import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Redirect to login if no token
  if (!token_hash || type !== 'magiclink') {
    return NextResponse.redirect(new URL('/account/login?error=invalid_link', req.url))
  }

  try {
    // Verify the magic link token
    const { error } = await supabaseCustomer.auth.verifyOtp({
      token_hash,
      type: 'magiclink',
    })

    if (error) {
      console.error('Magic link verification error:', error)
      return NextResponse.redirect(new URL('/account/login?error=verification_failed', req.url))
    }

    // Successful login - redirect to account dashboard
    return NextResponse.redirect(new URL('/account', req.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/account/login?error=server_error', req.url))
  }
}
