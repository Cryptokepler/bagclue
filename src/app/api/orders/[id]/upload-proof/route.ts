import { NextRequest, NextResponse } from 'next/server'
import { uploadShippingProof, deleteShippingProof } from '@/lib/supabase-upload-shipping'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/orders/[id]/upload-proof
 * Upload shipping proof (comprobante/guía) for an order
 * 
 * Accepts: multipart/form-data with 'file' field
 * Returns: { success: true, proof: {...} } or { error: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[UPLOAD PROOF API] Received file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      orderId
    })

    // Upload file to storage
    const uploadResult = await uploadShippingProof(orderId, file)

    if ('error' in uploadResult) {
      console.error('[UPLOAD PROOF API] Upload failed:', uploadResult.error)
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 400 }
      )
    }

    console.log('[UPLOAD PROOF API] File uploaded successfully')

    // Update order with proof metadata
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shipping_proof_url: uploadResult.url,
        shipping_proof_file_name: uploadResult.fileName,
        shipping_proof_file_type: uploadResult.fileType,
        shipping_proof_file_size: uploadResult.fileSize,
        shipping_proof_path: uploadResult.storagePath,  // Store actual storage path
        shipping_proof_uploaded_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('[UPLOAD PROOF API] Order update failed:', updateError.message)
      
      // Rollback: delete uploaded file
      console.log('[UPLOAD PROOF API] Rolling back: deleting uploaded file')
      await deleteShippingProof(orderId, file.name)
      
      return NextResponse.json(
        { error: 'Failed to update order. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[UPLOAD PROOF API] Order updated successfully')

    return NextResponse.json({
      success: true,
      proof: {
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        uploadedAt: order.shipping_proof_uploaded_at
      }
    })

  } catch (error: any) {
    console.error('[UPLOAD PROOF API] Unexpected error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/orders/[id]/upload-proof
 * Delete shipping proof for an order
 * 
 * Returns: { success: true } or { error: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Get current proof info
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('shipping_proof_file_name')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.shipping_proof_file_name) {
      return NextResponse.json({ error: 'No proof to delete' }, { status: 400 })
    }

    // Delete file from storage
    const deleted = await deleteShippingProof(orderId, order.shipping_proof_file_name)
    
    if (!deleted) {
      console.warn('[DELETE PROOF API] File deletion failed, continuing with DB cleanup')
    }

    // Clear proof fields in order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shipping_proof_url: null,
        shipping_proof_file_name: null,
        shipping_proof_file_type: null,
        shipping_proof_file_size: null,
        shipping_proof_uploaded_at: null
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[DELETE PROOF API] Order update failed:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to clear proof metadata' },
        { status: 500 }
      )
    }

    console.log('[DELETE PROOF API] Proof deleted successfully')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[DELETE PROOF API] Unexpected error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
