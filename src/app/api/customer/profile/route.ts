import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'

export async function GET(req: NextRequest) {
  try {
    // Get current user session
    const { data: { user }, error: authError } = await supabaseCustomer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch customer profile
    const { data: profile, error: profileError } = await supabaseCustomer
      .from('customer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    })
  } catch (error) {
    console.error('Profile route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
