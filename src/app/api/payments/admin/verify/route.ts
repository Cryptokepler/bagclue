// POST /api/payments/admin/verify
// Admin endpoint to approve or reject bank transfer payments
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '@/lib/session';
import { updateProductStatus } from '@/lib/product-validation';
import type { VerifyPaymentRequest, VerifyPaymentResponse } from '@/types/payment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // 1. Validate admin authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: VerifyPaymentRequest = await req.json();
    const { transactionId, action, rejectionReason } = body;

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action', message: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting payment' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 4. Fetch related order
    const orderId = transaction.order_id;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Transaction has no related order' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const productId = order.product_id;

    // 5. Handle APPROVE
    if (action === 'approve') {
      console.log('[AdminVerify] Approving payment:', {
        transactionId,
        orderId,
        productId,
      });

      // Update transaction: status = confirmed
      const { error: updateTxError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'admin', // Could be enhanced with admin user ID
        })
        .eq('id', transactionId);

      if (updateTxError) {
        console.error('[AdminVerify] Failed to update transaction:', updateTxError);
        return NextResponse.json(
          { error: 'Failed to confirm transaction', message: updateTxError.message },
          { status: 500 }
        );
      }

      // Update order: payment_status = paid, status = confirmed
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          // shipping_status stays as is (pending by default)
          // tracking_number stays as is
        })
        .eq('id', orderId);

      if (updateOrderError) {
        console.error('[AdminVerify] Failed to update order:', updateOrderError);
        return NextResponse.json(
          { error: 'Failed to update order', message: updateOrderError.message },
          { status: 500 }
        );
      }

      // Update product: status = sold
      const statusUpdate = await updateProductStatus(productId, 'sold');
      if (!statusUpdate.success) {
        console.error('[AdminVerify] Failed to mark product as sold:', statusUpdate.error);
        return NextResponse.json(
          { error: 'Failed to mark product as sold', message: statusUpdate.error },
          { status: 500 }
        );
      }

      console.log('[AdminVerify] Payment approved successfully:', {
        transactionId,
        orderId,
        productId,
        transactionStatus: 'confirmed',
        orderStatus: 'confirmed',
        productStatus: 'sold',
      });

      // TODO: Email integration point - send "payment confirmed" email
      // Email should include: order details, next steps (shipping preparation)

      const response: VerifyPaymentResponse = {
        success: true,
        message: 'Payment approved successfully',
        orderId,
        transactionStatus: 'confirmed',
      };

      return NextResponse.json(response, { status: 200 });
    }

    // 6. Handle REJECT
    if (action === 'reject') {
      console.log('[AdminVerify] Rejecting payment:', {
        transactionId,
        orderId,
        productId,
        reason: rejectionReason,
      });

      // Update transaction: status = rejected
      const { error: updateTxError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: 'admin', // Could be enhanced with admin user ID
          rejection_reason: rejectionReason,
        })
        .eq('id', transactionId);

      if (updateTxError) {
        console.error('[AdminVerify] Failed to update transaction:', updateTxError);
        return NextResponse.json(
          { error: 'Failed to reject transaction', message: updateTxError.message },
          { status: 500 }
        );
      }

      // Order stays pending (no status change needed)
      // Product: reserved → available
      const statusUpdate = await updateProductStatus(productId, 'available');
      if (!statusUpdate.success) {
        console.error('[AdminVerify] Failed to unreserve product:', statusUpdate.error);
        return NextResponse.json(
          { error: 'Failed to unreserve product', message: statusUpdate.error },
          { status: 500 }
        );
      }

      console.log('[AdminVerify] Payment rejected successfully:', {
        transactionId,
        orderId,
        productId,
        transactionStatus: 'rejected',
        orderStatus: 'pending (unchanged)',
        productStatus: 'available',
        reason: rejectionReason,
      });

      // TODO: Email integration point - send "payment rejected" email
      // Email should include: rejection reason, refund instructions (if applicable)

      const response: VerifyPaymentResponse = {
        success: true,
        message: 'Payment rejected',
        orderId,
        transactionStatus: 'rejected',
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Should never reach here
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[AdminVerify] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
