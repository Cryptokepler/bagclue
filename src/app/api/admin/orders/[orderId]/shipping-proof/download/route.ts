import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET_NAME = 'shipping-proofs'

/**
 * GET /api/admin/orders/[orderId]/shipping-proof/download
 * 
 * Genera signed URL server-side para el comprobante de envío y redirige.
 * Evita exponer signed URLs dinámicas en el HTML inicial.
 * 
 * Flujo:
 * 1. Validar sesión admin
 * 2. Obtener orden y validar que tiene comprobante
 * 3. Buscar archivo real en storage (con timestamp prefix)
 * 4. Generar signed URL on-demand (1 hora expiración)
 * 5. Redirigir a la signed URL
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Auth check
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await context.params

    // Fetch order (shipping_proof_path column doesn't exist yet, use only existing columns)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('shipping_proof_url, shipping_proof_file_name')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('[DOWNLOAD PROOF] Database error:', orderError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!order) {
      console.error('[DOWNLOAD PROOF] Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.shipping_proof_file_name || !order.shipping_proof_url) {
      console.error('[DOWNLOAD PROOF] No shipping proof for order:', orderId)
      return NextResponse.json({ error: 'No shipping proof available' }, { status: 404 })
    }

    // Parse file path from signed URL
    let filePath: string
    try {
      // Extract path from signed URL: .../shipping-proofs/{orderId}/{file}?token=...
      const urlMatch = order.shipping_proof_url.match(/shipping-proofs\/([^?]+)/)
      if (urlMatch && urlMatch[1]) {
        filePath = urlMatch[1]
        console.log('[DOWNLOAD PROOF] Extracted path from URL for order:', orderId.slice(0, 8))
      } else {
        throw new Error('Could not parse path from URL')
      }
    } catch (error: any) {
      console.error('[DOWNLOAD PROOF] Failed to parse URL:', error.message)
      return NextResponse.json({ 
        error: 'Cannot locate file. Please re-upload the shipping proof.' 
      }, { status: 404 })
    }
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60) // 1 hour

    if (urlError || !urlData?.signedUrl) {
      console.error('[DOWNLOAD PROOF] Failed to generate signed URL:', urlError?.message)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    console.log('[DOWNLOAD PROOF] Redirecting to signed URL for order:', orderId)

    // Redirect to signed URL
    return NextResponse.redirect(urlData.signedUrl)

  } catch (error: any) {
    console.error('[DOWNLOAD PROOF] Unexpected error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
