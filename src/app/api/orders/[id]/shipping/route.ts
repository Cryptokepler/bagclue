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

    // ========================================
    // FASE 1A: VALIDACIONES REFORZADAS
    // ========================================

    // Validar shipping_status
    const validStatuses = ['pending', 'preparing', 'shipped', 'delivered']
    if (shipping_status && !validStatuses.includes(shipping_status)) {
      return NextResponse.json({ 
        error: `Invalid shipping_status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Validar shipping_provider
    const validProviders = ['dhl', 'fedex', 'manual', null]
    if (shipping_provider !== undefined && !validProviders.includes(shipping_provider)) {
      return NextResponse.json({ 
        error: 'Invalid shipping_provider. Must be: dhl, fedex, manual, or null' 
      }, { status: 400 })
    }

    // Si se está cambiando shipping_status, necesitamos validar el estado actual de la orden
    if (shipping_status) {
      const { data: currentOrder, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('payment_status, shipping_address, shipping_status')
        .eq('id', orderId)
        .single()

      if (fetchError || !currentOrder) {
        console.error('[SHIPPING UPDATE] Order not found:', fetchError)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // REGLA A: Para marcar shipping_status = preparing
      if (shipping_status === 'preparing') {
        // A1. payment_status debe ser paid
        if (currentOrder.payment_status !== 'paid') {
          return NextResponse.json({ 
            error: 'No se puede marcar como preparando sin pago confirmado. Estado de pago actual: ' + currentOrder.payment_status 
          }, { status: 400 })
        }

        // A2. shipping_address debe existir (preferencia de Jhonatan)
        // Usamos shipping_address del request si se está actualizando, sino el actual
        const finalShippingAddress = shipping_address !== undefined ? shipping_address : currentOrder.shipping_address
        if (!finalShippingAddress) {
          return NextResponse.json({ 
            error: 'No se puede marcar como preparando sin dirección de envío confirmada' 
          }, { status: 400 })
        }
      }

      // REGLA B: Para marcar shipping_status = shipped
      if (shipping_status === 'shipped') {
        // B1. payment_status debe ser paid
        if (currentOrder.payment_status !== 'paid') {
          return NextResponse.json({ 
            error: 'No se puede marcar como enviado sin pago confirmado. Estado de pago actual: ' + currentOrder.payment_status 
          }, { status: 400 })
        }

        // B2. shipping_address debe existir
        const finalShippingAddress = shipping_address !== undefined ? shipping_address : currentOrder.shipping_address
        if (!finalShippingAddress) {
          return NextResponse.json({ 
            error: 'No se puede marcar como enviado sin dirección de envío confirmada' 
          }, { status: 400 })
        }

        // B3. shipping_provider requerido
        if (!shipping_provider) {
          return NextResponse.json({ 
            error: 'Paquetería (shipping_provider) es obligatoria para marcar como enviado' 
          }, { status: 400 })
        }

        // B4. tracking_number requerido
        if (!tracking_number) {
          return NextResponse.json({ 
            error: 'Número de rastreo (tracking_number) es obligatorio para marcar como enviado' 
          }, { status: 400 })
        }
      }

      // REGLA C: Para marcar shipping_status = delivered
      if (shipping_status === 'delivered') {
        // C1. shipping_status previo debe ser shipped
        if (currentOrder.shipping_status !== 'shipped') {
          return NextResponse.json({ 
            error: 'No se puede marcar como entregado sin haber sido enviado primero. Estado actual: ' + currentOrder.shipping_status 
          }, { status: 400 })
        }
      }
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

    // Timestamps automáticos (REGLA B5, C2)
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
