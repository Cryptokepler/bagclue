import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    // Get authorization header (consistent with PATCH)
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch customer profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

export async function PATCH(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()

    // Validate fields
    const errors: string[] = []

    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== 'string') {
        errors.push('name must be string')
      } else if (body.name.trim().length > 0 && body.name.trim().length < 2) {
        errors.push('name must be at least 2 characters')
      } else if (body.name.length > 100) {
        errors.push('name must be at most 100 characters')
      }
    }

    if (body.phone !== undefined && body.phone !== null && body.phone.trim().length > 0) {
      const phoneDigits = body.phone.replace(/\D/g, '')
      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        errors.push('phone must be 8-15 digits')
      }
    }

    if (body.phone_country_code !== undefined && body.phone_country_code !== null) {
      if (!/^\+\d{1,4}$/.test(body.phone_country_code)) {
        errors.push('phone_country_code invalid format (e.g. +52)')
      }
    }

    if (body.phone_country_iso !== undefined && body.phone_country_iso !== null) {
      if (!/^[A-Z]{2}$/.test(body.phone_country_iso)) {
        errors.push('phone_country_iso invalid format (e.g. MX)')
      }
    }

    // If phone exists, require country_code and iso
    if (body.phone && body.phone.trim().length > 0) {
      if (!body.phone_country_code || !body.phone_country_iso) {
        errors.push('phone requires phone_country_code and phone_country_iso')
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    // Prepare update data (only fields sent)
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name?.trim() || null
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
    if (body.phone_country_code !== undefined) updateData.phone_country_code = body.phone_country_code || null
    if (body.phone_country_iso !== undefined) updateData.phone_country_iso = body.phone_country_iso || null

    // Update profile (RLS policy auto-filters by user_id)
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('customer_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: updatedProfile
    })

  } catch (error) {
    console.error('PATCH profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
