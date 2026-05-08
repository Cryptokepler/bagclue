// GET /api/payments/admin/list
// List pending bank transfer payments for admin review
// Created: 2026-05-08 (PAYMENTS MVP.2C)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // 1. Validate admin authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch transactions with status = proof_uploaded OR awaiting_approval
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        order_id,
        payment_method,
        amount,
        payment_reference,
        proof_uploaded_at,
        proof_file_name,
        proof_url,
        status
      `)
      .in('status', ['proof_uploaded', 'awaiting_approval'])
      .eq('payment_method', 'bank_transfer_mxn')
      .order('proof_uploaded_at', { ascending: false });

    if (txError) {
      console.error('[AdminPaymentsList] Error fetching transactions:', txError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions', message: txError.message },
        { status: 500 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ payments: [] }, { status: 200 });
    }

    // 3. For each transaction, fetch order and order_items data
    const payments = await Promise.all(
      transactions.map(async (tx) => {
        // Fetch order
        const { data: order } = await supabase
          .from('orders')
          .select('customer_name, customer_email')
          .eq('id', tx.order_id)
          .single();

        // Fetch order items (products)
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_snapshot')
          .eq('order_id', tx.order_id);

        // Build product summary
        const productSummary = orderItems && orderItems.length > 0
          ? orderItems.map(item => {
              const snapshot = item.product_snapshot as any;
              return `${snapshot?.brand || ''} ${snapshot?.title || ''}`.trim();
            }).join(', ')
          : 'N/A';

        return {
          transactionId: tx.id,
          orderId: tx.order_id,
          customerName: order?.customer_name || 'N/A',
          customerEmail: order?.customer_email || 'N/A',
          product: productSummary,
          amount: tx.amount,
          paymentReference: tx.payment_reference,
          proofUploadedAt: tx.proof_uploaded_at,
          proofFileName: tx.proof_file_name,
          proofUrl: tx.proof_url,
          status: tx.status,
        };
      })
    );

    console.log('[AdminPaymentsList] Fetched pending payments:', {
      count: payments.length,
    });

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error: any) {
    console.error('[AdminPaymentsList] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
