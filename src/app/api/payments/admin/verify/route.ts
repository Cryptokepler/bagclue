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

    // Fetch order items to get product IDs (multi-item compatible)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[AdminVerify] Failed to fetch order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch order items', message: itemsError.message },
        { status: 500 }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Order has no items' },
        { status: 400 }
      );
    }

    const productIds = orderItems.map(item => item.product_id);

    // 5. Handle APPROVE
    if (action === 'approve') {
      console.log('[AdminVerify] Approving payment:', {
        transactionId,
        orderId,
        productIds,
      });

      // Update transaction: status = confirmed
      const { error: updateTxError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: null, // MVP.2A: iron-session admin has no auth.users UUID
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

      // Update products: status = sold (multi-item compatible)
      for (const productId of productIds) {
        const statusUpdate = await updateProductStatus(productId, 'sold');
        if (!statusUpdate.success) {
          console.error('[AdminVerify] Failed to mark product as sold:', {
            productId,
            error: statusUpdate.error,
          });
          return NextResponse.json(
            { error: 'Failed to mark product as sold', message: statusUpdate.error },
            { status: 500 }
          );
        }
      }

      console.log('[AdminVerify] Payment approved successfully:', {
        transactionId,
        orderId,
        productIds,
        productsCount: productIds.length,
        transactionStatus: 'confirmed',
        orderStatus: 'confirmed',
        productStatus: 'sold',
      });

      // Send payment confirmed email (non-blocking)
      // Fetch order_items for product details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_snapshot')
        .eq('order_id', orderId)
        .limit(1)
        .single();

      if (orderItems?.product_snapshot) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app';
        const trackingUrl = `${baseUrl}/track/${order.tracking_token}`;
        
        const { sendBankTransferConfirmedEmail } = await import('@/lib/email/mailer');
        const emailSent = await sendBankTransferConfirmedEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id.slice(0, 8),
          productName: orderItems.product_snapshot.title,
          productBrand: orderItems.product_snapshot.brand,
          amount: order.total,
          currency: 'MXN',
          trackingUrl,
        });

        if (!emailSent) {
          console.warn('[AdminVerify] Failed to send payment confirmed email, but approval successful');
        }
      }

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
        productIds,
        reason: rejectionReason,
      });

      // Update transaction: status = rejected
      const { error: updateTxError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: null, // MVP.2A: iron-session admin has no auth.users UUID
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
      // Products: reserved → available (multi-item compatible)
      for (const productId of productIds) {
        const statusUpdate = await updateProductStatus(productId, 'available');
        if (!statusUpdate.success) {
          console.error('[AdminVerify] Failed to unreserve product:', {
            productId,
            error: statusUpdate.error,
          });
          return NextResponse.json(
            { error: 'Failed to unreserve product', message: statusUpdate.error },
            { status: 500 }
          );
        }
      }

      console.log('[AdminVerify] Payment rejected successfully:', {
        transactionId,
        orderId,
        productIds,
        productsCount: productIds.length,
        transactionStatus: 'rejected',
        orderStatus: 'pending (unchanged)',
        productStatus: 'available',
        reason: rejectionReason,
      });

      // Send payment rejected email (non-blocking)
      // Fetch transaction with payment_reference and expires_at
      const { data: fullTransaction } = await supabase
        .from('payment_transactions')
        .select('payment_reference, expires_at')
        .eq('id', transactionId)
        .single();

      // Fetch order_items for product details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_snapshot')
        .eq('order_id', orderId)
        .limit(1)
        .single();

      if (fullTransaction && orderItems?.product_snapshot) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app';
        const paymentUrl = `${baseUrl}/payment/bank-transfer/${transactionId}?token=${order.tracking_token}`;
        
        const { sendBankTransferRejectedEmail } = await import('@/lib/email/mailer');
        const emailSent = await sendBankTransferRejectedEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id.slice(0, 8),
          productName: orderItems.product_snapshot.title,
          productBrand: orderItems.product_snapshot.brand,
          paymentReference: fullTransaction.payment_reference,
          rejectionReason: rejectionReason || 'Comprobante inválido',
          expiresAt: fullTransaction.expires_at,
          paymentUrl,
        });

        if (!emailSent) {
          console.warn('[AdminVerify] Failed to send rejection email, but rejection successful');
        }
      }

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
