import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layaway_token: string }> }
) {
  try {
    const { layaway_token } = await params

    // Validate token format (32 hex chars)
    if (!/^[a-f0-9]{32}$/.test(layaway_token)) {
      return NextResponse.json({ error: 'Invalid layaway token format' }, { status: 400 })
    }

    // Get layaway with product info
    const { data: layaway, error } = await supabaseAdmin
      .from('layaways')
      .select(`
        id,
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        product_price,
        deposit_percent,
        deposit_amount,
        balance_amount,
        currency,
        deposit_paid_at,
        balance_paid_at,
        status,
        created_at,
        expires_at,
        completed_at,
        cancelled_at,
        cancellation_reason,
        layaway_token
      `)
      .eq('layaway_token', layaway_token)
      .single()

    if (error || !layaway) {
      return NextResponse.json({ error: 'Layaway not found' }, { status: 404 })
    }

    // Get product info
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        title,
        brand,
        model,
        color,
        slug,
        product_images(url)
      `)
      .eq('id', layaway.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate days remaining
    let daysRemaining = 0
    if (layaway.status === 'active') {
      const now = new Date()
      const expires = new Date(layaway.expires_at)
      const diffMs = expires.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      layaway: {
        id: layaway.id,
        customer_name: layaway.customer_name,
        customer_phone: layaway.customer_phone,
        product_price: layaway.product_price,
        deposit_percent: layaway.deposit_percent,
        deposit_amount: layaway.deposit_amount,
        balance_amount: layaway.balance_amount,
        currency: layaway.currency,
        deposit_paid_at: layaway.deposit_paid_at,
        balance_paid_at: layaway.balance_paid_at,
        status: layaway.status,
        created_at: layaway.created_at,
        expires_at: layaway.expires_at,
        completed_at: layaway.completed_at,
        cancelled_at: layaway.cancelled_at,
        cancellation_reason: layaway.cancellation_reason,
        days_remaining: daysRemaining,
        product: {
          id: product.id,
          title: product.title,
          brand: product.brand,
          model: product.model,
          color: product.color,
          slug: product.slug,
          image: product.product_images?.[0]?.url || null
        }
      }
    })

  } catch (error: any) {
    console.error('[LAYAWAY TRACK] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
