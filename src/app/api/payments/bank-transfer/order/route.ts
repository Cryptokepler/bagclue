// POST /api/payments/bank-transfer/order
// Create a new bank transfer order (MXN full purchase only)
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getBankTransferConfig,
  buildPaymentReference,
  logBankConfigStatus,
} from '@/lib/bank-transfer-config';
import { validateProductForPurchase, updateProductStatus } from '@/lib/product-validation';
import type { CreateBankOrderRequest, CreateBankOrderResponse } from '@/types/payment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Generate payment reference and expiry
    const paymentReference = buildPaymentReference();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    // 5. Create order (pending_payment)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        product_id: productId,
        quantity: 1,
        total: product.price,
        payment_status: 'pending',
        status: 'pending',
        payment_method: 'bank_transfer_mxn',
        currency: 'MXN',
        // New payment_transactions columns
        payment_reference: paymentReference,
        payment_expires_at: expiresAt.toISOString(),
        amount_mxn: product.price,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[BankTransfer] Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError?.message },
        { status: 500 }
      );
    }

    console.log('[BankTransfer] Order created:', {
      orderId: order.id,
      productId,
      amount: product.price,
      reference: paymentReference,
    });

    // 6. Create payment_transaction (pending)
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        payment_method: 'bank_transfer_mxn',
        status: 'pending',
        currency: 'MXN',
        amount_mxn: product.price,
        payment_reference: paymentReference,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('[BankTransfer] Failed to create transaction:', txError);
      // Rollback: delete order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create payment transaction', details: txError?.message },
        { status: 500 }
      );
    }

    console.log('[BankTransfer] Transaction created:', {
      transactionId: transaction.id,
      orderId: order.id,
      status: 'pending',
    });

    // 7. Update product status: available → reserved
    const statusUpdate = await updateProductStatus(productId, 'reserved');
    if (!statusUpdate.success) {
      console.error('[BankTransfer] Failed to reserve product:', statusUpdate.error);
      // Rollback: delete transaction and order
      await supabase.from('payment_transactions').delete().eq('id', transaction.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to reserve product', details: statusUpdate.error },
        { status: 500 }
      );
    }

    // 8. Return response with bank config
    const response: CreateBankOrderResponse = {
      orderId: order.id,
      transactionId: transaction.id,
      paymentReference,
      amountMxn: product.price,
      expiresAt: expiresAt.toISOString(),
      bankConfig,
    };

    console.log('[BankTransfer] Order created successfully:', {
      orderId: order.id,
      transactionId: transaction.id,
      productStatus: 'reserved',
    });

    // TODO: Email integration point - send transfer instructions email
    // Email should include: reference, amount, bank details, expiry, payment instructions

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('[BankTransfer] Unexpected error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
