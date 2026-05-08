// POST /api/payments/bank-transfer/order
// Create a new bank transfer order (MXN full purchase only)
// Created: 2026-05-06 (PAYMENTS MVP.2A)
// Fixed: 2026-05-07 — Aligned with Stripe checkout pattern (orders + order_items)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  getBankTransferConfig,
  buildPaymentReference,
  logBankConfigStatus,
} from '@/lib/bank-transfer-config';
import { validateProductForPurchase, updateProductStatus } from '@/lib/product-validation';
import type { CreateBankOrderRequest, CreateBankOrderResponse } from '@/types/payment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mask payment reference for logs (security)
function maskPaymentReference(ref: string): string {
  if (!ref) return '';
  return `****${ref.slice(-4)}`;
}

// Generate unique tracking token (same as Stripe webhook)
async function generateUniqueTrackingToken(supabase: any): Promise<string> {
  const maxAttempts = 5;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const token = crypto.randomBytes(16).toString('hex');
    
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('tracking_token', token)
      .single();
    
    if (!existing) {
      console.log(`[BankTransfer] Tracking token generated (attempt ${attempt})`);
      return token;
    }
    
    console.warn(`[BankTransfer] Tracking token collision (attempt ${attempt}/${maxAttempts})`);
  }
  
  throw new Error('Failed to generate unique tracking_token after 5 attempts');
}

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Variables for rollback
  let reservedProductId: string | null = null;
  let createdOrderId: string | null = null;
  let createdTransactionId: string | null = null;

  try {
    // 1. Validate bank config exists
    const bankConfig = getBankTransferConfig();
    if (!bankConfig) {
      logBankConfigStatus();
      return NextResponse.json(
        {
          error: 'Bank transfer configuration missing',
          message: 'Bank transfer payments are not available at this time',
        },
        { status: 503 }
      );
    }

    // 2. Parse request body
    const body: CreateBankOrderRequest = await req.json();
    const { productId, customerName, customerEmail, customerPhone } = body;

    if (!productId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, customerName, customerEmail' },
        { status: 400 }
      );
    }

    // 3. Validate product
    const validation = await validateProductForPurchase(productId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const product = validation.product!;

    // 4. Update product status: available → reserved
    console.log('[BankTransfer] Reserving product...');
    const statusUpdate = await updateProductStatus(productId, 'reserved');
    if (!statusUpdate.success) {
      console.error('[BankTransfer] Failed to reserve product:', statusUpdate.error);
      return NextResponse.json(
        { error: 'Failed to reserve product', details: statusUpdate.error },
        { status: 500 }
      );
    }
    reservedProductId = productId;
    console.log('[BankTransfer] Product reserved');

    // 5. Generate payment reference, expiry, and tracking token
    const paymentReference = buildPaymentReference();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
    const trackingToken = await generateUniqueTrackingToken(supabase);

    // 6. Create order (following Stripe pattern: subtotal, shipping, total)
    console.log('[BankTransfer] Creating order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        subtotal: product.price,
        shipping: 0,
        total: product.price,
        payment_status: 'pending',
        status: 'pending',
        payment_method: 'bank_transfer_mxn',
        tracking_token: trackingToken,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[BankTransfer] Failed to create order:', orderError);
      // Rollback: release product
      if (reservedProductId) {
        await updateProductStatus(reservedProductId, 'available');
        console.log('[BankTransfer] Rollback: product released');
      }
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError?.message },
        { status: 500 }
      );
    }
    createdOrderId = order.id;
    console.log('[BankTransfer] Order created:', {
      orderId: order.id,
      trackingToken: order.tracking_token,
    });

    // 7. Create order_items with product_snapshot (following Stripe pattern)
    console.log('[BankTransfer] Creating order_items...');
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
        product_snapshot: {
          title: product.title,
          brand: product.brand,
          model: product.model || null,
          color: product.color || null,
          slug: product.slug,
          price: product.price,
          currency: product.currency || 'MXN',
        },
      });

    if (itemError) {
      console.error('[BankTransfer] Failed to create order_items:', itemError);
      // Rollback: delete order + release product
      await supabase.from('orders').delete().eq('id', order.id);
      if (reservedProductId) {
        await updateProductStatus(reservedProductId, 'available');
      }
      console.log('[BankTransfer] Rollback: order deleted, product released');
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemError?.message },
        { status: 500 }
      );
    }
    console.log('[BankTransfer] Order_items created');

    // 8. Create payment_transaction (pending)
    console.log('[BankTransfer] Creating payment_transaction...');
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        payment_type: 'full_purchase',
        payment_method: 'bank_transfer_mxn',
        currency: 'MXN',
        amount: product.price,
        amount_mxn: product.price,
        status: 'pending',
        payment_reference: paymentReference,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('[BankTransfer] Failed to create transaction:', txError);
      // Rollback: delete order_items + order + release product
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      if (reservedProductId) {
        await updateProductStatus(reservedProductId, 'available');
      }
      console.log('[BankTransfer] Rollback: order_items + order deleted, product released');
      return NextResponse.json(
        { error: 'Failed to create payment transaction', details: txError?.message },
        { status: 500 }
      );
    }
    createdTransactionId = transaction.id;
    console.log('[BankTransfer] Transaction created:', {
      transactionId: transaction.id,
      reference: maskPaymentReference(paymentReference),
    });

    // 9. Return response with bank config
    const response: CreateBankOrderResponse = {
      orderId: order.id,
      transactionId: transaction.id,
      trackingToken: order.tracking_token,
      paymentReference,
      amountMxn: product.price,
      expiresAt: expiresAt.toISOString(),
      bankConfig,
    };

    console.log('[BankTransfer] Order created successfully:', {
      orderId: order.id,
      transactionId: transaction.id,
      trackingToken: order.tracking_token,
      productStatus: 'reserved',
    });

    // TODO: Email integration point - send transfer instructions email
    // Email should include: reference, amount, bank details, expiry, payment instructions

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('[BankTransfer] Unexpected error creating order:', error);
    
    // Emergency rollback
    if (createdTransactionId) {
      await supabase.from('payment_transactions').delete().eq('id', createdTransactionId);
    }
    if (createdOrderId) {
      await supabase.from('order_items').delete().eq('order_id', createdOrderId);
      await supabase.from('orders').delete().eq('id', createdOrderId);
    }
    if (reservedProductId) {
      await updateProductStatus(reservedProductId, 'available');
    }
    
    console.log('[BankTransfer] Emergency rollback executed');
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
