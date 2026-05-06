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
    const transactionId = searchParams.get('transaction_id');
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

    // 4. Validate ownership
    let ownershipValid = false;

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

    // 5. Return bank config (DO NOT LOG SENSITIVE DATA)
    console.log('[BankConfig] Config requested:', {
      transactionId: transactionId || undefined,
      orderId: orderId || undefined,
      hasUserId: !!userId,
      hasCustomerEmail: !!customerEmail,
      // DO NOT log CLABE or account numbers
    });

    const response: BankConfigResponse = {
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
