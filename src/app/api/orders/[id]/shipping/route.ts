import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Auto-generate tracking URL based on provider
function generateTrackingUrl(provider: string, trackingNumber: string): string | null {
  switch (provider) {
    case 'dhl':
      return `https://www.dhl.com.mx/es/express/rastreo.html?AWB=${trackingNumber}`
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`
    default:
      return null
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    const {
      customer_phone,
      shipping_address,
      shipping_status,
      shipping_provider,
      tracking_number,
      tracking_url: customTrackingUrl,
      notes
    } = body

    // Validar shipping_status
    const validStatuses = ['pending', 'preparing', 'shipped', 'delivered']
    if (shipping_status && !validStatuses.includes(shipping_status)) {
      return NextResponse.json({ 
        error: `Invalid shipping_status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Validar shipping_provider
    const validProviders = ['dhl', 'fedex', null]
    if (shipping_provider !== undefined && !validProviders.includes(shipping_provider)) {
      return NextResponse.json({ 
        error: 'Invalid shipping_provider. Must be: dhl, fedex, or null' 
      }, { status: 400 })
    }

    // Si status=shipped, requiere provider y tracking_number
    if (shipping_status === 'shipped' && (!shipping_provider || !tracking_number)) {
      return NextResponse.json({ 
        error: 'shipped status requires shipping_provider and tracking_number' 
      }, { status: 400 })
    }

    // Auto-generar tracking_url si no se proporciona
    let tracking_url = customTrackingUrl
    if (shipping_provider && tracking_number && !customTrackingUrl) {
      tracking_url = generateTrackingUrl(shipping_provider, tracking_number)
    }

    // Construir objeto de actualización
    const updates: any = {}
    
    if (customer_phone !== undefined) updates.customer_phone = customer_phone
    if (shipping_address !== undefined) updates.shipping_address = shipping_address
    if (shipping_status !== undefined) updates.shipping_status = shipping_status
    if (shipping_provider !== undefined) updates.shipping_provider = shipping_provider
    if (tracking_number !== undefined) updates.tracking_number = tracking_number
    if (tracking_url !== undefined) updates.tracking_url = tracking_url
    if (notes !== undefined) updates.notes = notes

    // Timestamps automáticos
    if (shipping_status === 'shipped' && !updates.shipped_at) {
      updates.shipped_at = new Date().toISOString()
    }
    if (shipping_status === 'delivered' && !updates.delivered_at) {
      updates.delivered_at = new Date().toISOString()
    }

    // Actualizar orden
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('[SHIPPING UPDATE] Error:', error)
      return NextResponse.json({ error: 'Failed to update shipping info' }, { status: 500 })
    }

    // Generar tracking URL público
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    const public_tracking_url = order.tracking_token 
      ? `${baseUrl}/track/${order.tracking_token}`
      : null

    return NextResponse.json({
      success: true,
      order,
      public_tracking_url
    })

  } catch (error: any) {
    console.error('[SHIPPING UPDATE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
