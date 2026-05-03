import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Buscar orden
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, tracking_token')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Si no tiene tracking_token, generar uno
    if (!order.tracking_token) {
      const tracking_token = crypto.randomUUID().replace(/-/g, '')
      
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ tracking_token })
        .eq('id', orderId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to generate tracking token' }, { status: 500 })
      }

      order.tracking_token = tracking_token
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    const tracking_url = `${baseUrl}/track/${order.tracking_token}`

    return NextResponse.json({
      tracking_url,
      tracking_token: order.tracking_token
    })

  } catch (error: any) {
    console.error('[TRACKING URL API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
