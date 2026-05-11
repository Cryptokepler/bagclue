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

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('shipping_proof_file_name')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[DOWNLOAD PROOF] Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.shipping_proof_file_name) {
      console.error('[DOWNLOAD PROOF] No shipping proof for order:', orderId)
      return NextResponse.json({ error: 'No shipping proof available' }, { status: 404 })
    }

    // List files in order folder to find the actual file (with timestamp prefix)
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(orderId)

    if (listError || !files) {
      console.error('[DOWNLOAD PROOF] Failed to list files:', listError?.message)
      return NextResponse.json({ error: 'Failed to locate file' }, { status: 500 })
    }

    // Find file matching the stored name
    const fileToDownload = files.find(f => f.name.includes(order.shipping_proof_file_name))
    
    if (!fileToDownload) {
      console.error('[DOWNLOAD PROOF] File not found in storage:', order.shipping_proof_file_name)
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    // Generate signed URL on-demand (1 hour expiration)
    const filePath = `${orderId}/${fileToDownload.name}`
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
