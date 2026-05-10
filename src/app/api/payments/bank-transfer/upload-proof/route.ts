// POST /api/payments/bank-transfer/upload-proof
// Upload payment proof for a bank transfer transaction
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Parse form data
    const formData = await req.formData();
    const transactionId = formData.get('transactionId') as string;
    const file = formData.get('file') as File;
    const trackingToken = formData.get('token') as string | null;

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
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      customerEmail = user?.email || null;
    }

    // If no auth, try to get email from form (for guest checkout)
    if (!userId && !customerEmail) {
      customerEmail = formData.get('customerEmail') as string | null;
    }

    // 5. Fetch transaction (needed for validation)
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('id, order_id, status')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      console.error('[UploadProof] Transaction not found:', transactionId);
      return NextResponse.json(
        { error: 'No user identification provided' },
        { status: 403 }
      );
    }

    // 6. Validate ownership (3 methods: tracking_token, auth, customer_email)
    let ownershipValid = false;

    // Method 1: tracking_token (guest checkout - preferred)
    if (trackingToken) {
      const { data: order } = await supabase
        .from('orders')
        .select('tracking_token')
        .eq('id', transaction.order_id)
        .single();

      if (order?.tracking_token === trackingToken) {
        ownershipValid = true;
        console.log('[UploadProof] Ownership validated via tracking_token');
      }
    }

    // Method 2: Supabase auth (logged in user)
    if (!ownershipValid && userId) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', transaction.order_id)
        .single();

      if (order?.user_id === userId) {
        ownershipValid = true;
        console.log('[UploadProof] Ownership validated via user_id');
      }
    }

    // Method 3: customer_email (fallback)
    if (!ownershipValid && customerEmail) {
      const { data: order } = await supabase
        .from('orders')
        .select('customer_email')
        .eq('id', transaction.order_id)
        .single();

      if (order?.customer_email === customerEmail) {
        ownershipValid = true;
        console.log('[UploadProof] Ownership validated via customer_email');
      }
    }

    if (!ownershipValid) {
      return NextResponse.json(
        { error: 'No user identification provided' },
        { status: 403 }
      );
    }

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
      // Note: Do not log tracking_token, customer_email, or hash for security
    });

    // Send proof received email (non-blocking)
    // Fetch transaction with payment_reference
    const { data: fullTransaction } = await supabase
      .from('payment_transactions')
      .select('payment_reference')
      .eq('id', transactionId)
      .single();

    // Fetch order and product details
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, tracking_token')
      .eq('id', transaction.order_id)
      .single();

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_snapshot')
      .eq('order_id', transaction.order_id)
      .limit(1)
      .single();

    if (order && orderItems?.product_snapshot && fullTransaction) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app';
      const trackingUrl = `${baseUrl}/track/${order.tracking_token}`;
      
      const { sendBankTransferProofReceivedEmail } = await import('@/lib/email/mailer');
      const emailSent = await sendBankTransferProofReceivedEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id.slice(0, 8),
        productName: orderItems.product_snapshot.title,
        productBrand: orderItems.product_snapshot.brand,
        paymentReference: fullTransaction.payment_reference,
        trackingUrl,
      });

      if (!emailSent) {
        console.warn('[UploadProof] Failed to send proof received email, but upload successful');
      }
    }

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
