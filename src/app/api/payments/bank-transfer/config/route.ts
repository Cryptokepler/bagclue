// GET /api/payments/bank-transfer/config
// Get bank transfer configuration (requires ownership validation)
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getBankTransferConfig,
  logBankConfigStatus,
} from '@/lib/bank-transfer-config';
import {
  validateOrderOwnership,
  validateTransactionOwnership,
} from '@/lib/payment-ownership';
import type { BankConfigResponse } from '@/types/payment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
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

    // 2. Get query params (transaction_id OR order_id required)
    const { searchParams } = new URL(req.url);
    let transactionId = searchParams.get('transaction_id');
    const orderId = searchParams.get('order_id');

    if (!transactionId && !orderId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter',
          message: 'Either transaction_id or order_id is required',
        },
        { status: 400 }
      );
    }

    // 3. Get user from Supabase auth (if available)
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

    // If no auth, try to get email from query (for guest checkout)
    if (!userId && !customerEmail) {
      customerEmail = searchParams.get('customer_email');
    }

    // 4. Validate ownership (supports tracking_token for guest checkout)
    let ownershipValid = false;
    const trackingToken = searchParams.get('token');

    // Try tracking_token validation first (guest checkout)
    if (trackingToken && transactionId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get order from transaction
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('order_id')
        .eq('id', transactionId)
        .single();

      if (transaction?.order_id) {
        // Validate tracking_token matches order
        const { data: order } = await supabase
          .from('orders')
          .select('tracking_token')
          .eq('id', transaction.order_id)
          .single();

        if (order?.tracking_token === trackingToken) {
          ownershipValid = true;
        }
      }
    }

    // Fallback to original validation if tracking_token not provided or invalid
    if (!ownershipValid) {
      if (transactionId) {
        const ownership = await validateTransactionOwnership(transactionId, userId, customerEmail);
        ownershipValid = ownership.valid;
        if (!ownershipValid) {
          return NextResponse.json(
            { error: ownership.error },
            { status: 403 }
          );
        }
      } else if (orderId) {
        const ownership = await validateOrderOwnership(orderId, userId, customerEmail);
        ownershipValid = ownership.valid;
        if (!ownershipValid) {
          return NextResponse.json(
            { error: ownership.error },
            { status: 403 }
          );
        }
      }
    }

    // 5. Fetch transaction data and return with bank config
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!transactionId) {
      // If only order_id was provided, fetch transaction_id
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('order_id', orderId)
        .single();
      
      transactionId = transactions?.id;
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction not found for this order' },
        { status: 404 }
      );
    }

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('id, order_id, payment_reference, amount, expires_at, status')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    console.log('[BankConfig] Config requested:', {
      transactionId: transactionId || undefined,
      orderId: orderId || undefined,
      hasUserId: !!userId,
      hasCustomerEmail: !!customerEmail,
      hasTrackingToken: !!trackingToken,
      // DO NOT log CLABE or account numbers
    });

    // Fetch order to get tracking_token (needed for /track link)
    const { data: orderData } = await supabase
      .from('orders')
      .select('tracking_token')
      .eq('id', transaction.order_id)
      .single();

    const response = {
      transactionId: transaction.id,
      orderId: transaction.order_id,
      paymentReference: transaction.payment_reference,
      amountMxn: transaction.amount,
      expiresAt: transaction.expires_at,
      transactionStatus: transaction.status,
      trackingToken: orderData?.tracking_token || null,
      bankConfig,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('[BankConfig] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
