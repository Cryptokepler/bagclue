// POST /api/payments/bank-transfer/upload-proof
// Upload payment proof for a bank transfer transaction
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTransactionOwnership } from '@/lib/payment-ownership';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data
    const formData = await req.formData();
    const transactionId = formData.get('transactionId') as string;
    const file = formData.get('file') as File;

    if (!transactionId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, file' },
        { status: 400 }
      );
    }

    // 2. Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Only JPG, JPEG, PNG, and PDF files are allowed',
          allowedTypes: ALLOWED_MIME_TYPES,
        },
        { status: 400 }
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // 4. Get user from Supabase auth (if available)
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    let customerEmail: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      customerEmail = user?.email || null;
    }

    // If no auth, try to get email from form (for guest checkout)
    if (!userId && !customerEmail) {
      customerEmail = formData.get('customerEmail') as string | null;
    }

    // 5. Validate ownership
    const ownership = await validateTransactionOwnership(transactionId, userId, customerEmail);
    if (!ownership.valid) {
      return NextResponse.json(
        { error: ownership.error },
        { status: 403 }
      );
    }

    const transaction = ownership.transaction!;

    // 6. Validate transaction status (must be pending or rejected to allow upload)
    if (!['pending', 'rejected'].includes(transaction.status)) {
      return NextResponse.json(
        {
          error: 'Invalid transaction status',
          message: `Cannot upload proof for transaction with status: ${transaction.status}`,
          allowedStatuses: ['pending', 'rejected'],
        },
        { status: 400 }
      );
    }

    // 7. Calculate SHA256 hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 8. Check for duplicate hash (best effort)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existingProof } = await supabase
      .from('payment_transactions')
      .select('id, proof_hash')
      .eq('proof_hash', hash)
      .neq('id', transactionId)
      .single();

    if (existingProof) {
      console.warn('[UploadProof] Duplicate proof hash detected:', {
        transactionId,
        hash,
        existingTransactionId: existingProof.id,
      });
      // Don't block upload, just warn
    }

    // 9. Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `proof_${transactionId}_${Date.now()}.${fileExt}`;
    const filePath = `${transactionId}/${fileName}`;

    // 10. Upload to Supabase storage (private bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bank-payment-proofs')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[UploadProof] Storage upload failed:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          message: uploadError.message,
        },
        { status: 500 }
      );
    }

    // 11. Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from('bank-payment-proofs')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    const proofUrl = urlData?.signedUrl || null;

    // 12. Update transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'proof_uploaded',
        proof_url: proofUrl,
        proof_file_name: fileName,
        proof_file_type: file.type,
        proof_file_size: file.size,
        proof_hash: hash,
        proof_uploaded_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('[UploadProof] Failed to update transaction:', updateError);
      // Try to delete uploaded file
      await supabase.storage.from('bank-payment-proofs').remove([filePath]);
      return NextResponse.json(
        {
          error: 'Failed to update transaction',
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('[UploadProof] Proof uploaded successfully:', {
      transactionId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      hash,
    });

    // TODO: Email integration point - send "proof received" confirmation email
    // Email should include: order ID, thank you message, next steps (admin review)

    return NextResponse.json(
      {
        success: true,
        message: 'Payment proof uploaded successfully',
        proofUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[UploadProof] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
