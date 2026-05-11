import { supabaseAdmin } from './supabase-admin'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const BUCKET_NAME = 'shipping-proofs'
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 // 1 year

export interface ShippingProofUploadResult {
  url: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string  // Full storage path: {orderId}/{timestamp}_{sanitizedFileName}
}

export interface ShippingProofUploadError {
  error: string
  code: 'INVALID_TYPE' | 'TOO_LARGE' | 'UPLOAD_FAILED' | 'SIGN_FAILED'
}

/**
 * Upload shipping proof (comprobante/guía) to Supabase Storage
 * 
 * @param orderId - Order UUID
 * @param file - File to upload (JPG, PNG, or PDF, max 5MB)
 * @returns Signed URL (1 year expiry) + metadata
 * 
 * Security:
 * - Bucket is private (public: false)
 * - Only service_role can upload
 * - Clients access via signed URL only
 * - No RLS policies needed
 * 
 * Pattern matches payments (bank-payment-proofs):
 * - Upload file → Generate signed URL → Save URL in DB
 * - No on-demand regeneration (1 year sufficient)
 */
export async function uploadShippingProof(
  orderId: string,
  file: File
): Promise<ShippingProofUploadResult | ShippingProofUploadError> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      error: 'Formato no válido. Solo JPG, PNG o PDF.',
      code: 'INVALID_TYPE'
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: `Archivo demasiado grande. Máximo 5 MB. (Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      code: 'TOO_LARGE'
    }
  }

  // Generate unique file path: {orderId}/{timestamp}_{filename}
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${orderId}/${timestamp}_${sanitizedFileName}`

  console.log('[SHIPPING PROOF] Uploading:', {
    orderId,
    fileName: sanitizedFileName,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    type: file.type
  })

  try {
    // Step 1: Upload file to private bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[SHIPPING PROOF] Upload failed:', uploadError.message)
      return {
        error: `Error al subir: ${uploadError.message}`,
        code: 'UPLOAD_FAILED'
      }
    }

    console.log('[SHIPPING PROOF] Upload success:', uploadData.path)

    // Step 2: Generate signed URL (1 year expiry)
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY)

    if (urlError || !urlData?.signedUrl) {
      console.error('[SHIPPING PROOF] Signed URL generation failed:', urlError?.message)
      
      // Cleanup: Delete uploaded file if signing fails
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath])
      
      return {
        error: 'Error al generar URL. Intenta de nuevo.',
        code: 'SIGN_FAILED'
      }
    }

    console.log('[SHIPPING PROOF] Signed URL generated:', {
      orderId,
      expiresIn: '1 year',
      path: filePath.substring(0, 50) + '...'
    })

    // Step 3: Return result
    return {
      url: urlData.signedUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath: filePath  // Full path with timestamp
    }
  } catch (error: any) {
    console.error('[SHIPPING PROOF] Unexpected error:', error.message)
    return {
      error: 'Error inesperado al subir. Intenta de nuevo.',
      code: 'UPLOAD_FAILED'
    }
  }
}

/**
 * Delete shipping proof from storage
 * Used for rollback when order update fails after successful upload
 */
export async function deleteShippingProof(orderId: string, fileName: string): Promise<boolean> {
  try {
    // List all files in order folder
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(orderId)

    if (listError || !files) {
      console.error('[SHIPPING PROOF] List files failed:', listError?.message)
      return false
    }

    // Find file matching name
    const fileToDelete = files.find(f => f.name.includes(fileName))
    if (!fileToDelete) {
      console.warn('[SHIPPING PROOF] File not found for deletion:', fileName)
      return false
    }

    // Delete file
    const filePath = `${orderId}/${fileToDelete.name}`
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      console.error('[SHIPPING PROOF] Delete failed:', deleteError.message)
      return false
    }

    console.log('[SHIPPING PROOF] Deleted successfully:', filePath)
    return true
  } catch (error: any) {
    console.error('[SHIPPING PROOF] Delete unexpected error:', error.message)
    return false
  }
}
