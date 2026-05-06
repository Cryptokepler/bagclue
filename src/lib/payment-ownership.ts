// Payment ownership validation helpers
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Validate that a user owns an order
 * Checks user_id OR customer_email match
 * 
 * @param orderId - Order ID to validate
 * @param userId - User ID from Supabase auth (optional)
 * @param customerEmail - Customer email (optional)
 * @returns { valid: boolean, error?: string, order?: any }
 */
export async function validateOrderOwnership(
  orderId: string,
  userId?: string | null,
  customerEmail?: string | null
): Promise<{
  valid: boolean;
  error?: string;
  order?: any;
}> {
  if (!userId && !customerEmail) {
    return { valid: false, error: 'No user identification provided' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    return { valid: false, error: 'Order not found' };
  }

  // Check ownership: user_id OR customer_email
  const isOwner =
    (userId && order.user_id === userId) ||
    (customerEmail && order.customer_email?.toLowerCase() === customerEmail.toLowerCase());

  if (!isOwner) {
    return { valid: false, error: 'Order does not belong to this user' };
  }

  return { valid: true, order };
}

/**
 * Validate that a user owns a payment transaction
 * Fetches the related order and checks ownership
 * 
 * @param transactionId - Transaction ID to validate
 * @param userId - User ID from Supabase auth (optional)
 * @param customerEmail - Customer email (optional)
 * @returns { valid: boolean, error?: string, transaction?: any, order?: any }
 */
export async function validateTransactionOwnership(
  transactionId: string,
  userId?: string | null,
  customerEmail?: string | null
): Promise<{
  valid: boolean;
  error?: string;
  transaction?: any;
  order?: any;
}> {
  if (!userId && !customerEmail) {
    return { valid: false, error: 'No user identification provided' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch transaction
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txError || !transaction) {
    return { valid: false, error: 'Transaction not found' };
  }

  // Fetch related order
  const orderId = transaction.order_id || transaction.layaway_id;
  if (!orderId) {
    return { valid: false, error: 'Transaction has no related order' };
  }

  // Validate order ownership
  const ownershipCheck = await validateOrderOwnership(orderId, userId, customerEmail);
  
  if (!ownershipCheck.valid) {
    return { valid: false, error: ownershipCheck.error };
  }

  return {
    valid: true,
    transaction,
    order: ownershipCheck.order,
  };
}
