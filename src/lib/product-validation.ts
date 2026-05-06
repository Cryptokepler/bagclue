// Product validation helpers for payment system
// Created: 2026-05-06 (PAYMENTS MVP.2A)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Validate that a product is available for purchase
 * Checks: exists, is_published, status=available, stock>0, price>0
 * 
 * @returns {object} { valid: boolean, error?: string, product?: any }
 */
export async function validateProductForPurchase(productId: string): Promise<{
  valid: boolean;
  error?: string;
  product?: any;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch product
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    return { valid: false, error: 'Product not found' };
  }

  // Validate is_published
  if (!product.is_published) {
    return { valid: false, error: 'Product is not published' };
  }

  // Validate status = available
  if (product.status !== 'available') {
    return { valid: false, error: `Product status is ${product.status}, not available` };
  }

  // Validate stock > 0 (if stock field exists)
  if (product.stock !== undefined && product.stock !== null && product.stock <= 0) {
    return { valid: false, error: 'Product is out of stock' };
  }

  // Validate price > 0
  if (!product.price || product.price <= 0) {
    return { valid: false, error: 'Product price is invalid' };
  }

  return { valid: true, product };
}

/**
 * Update product status
 * Used to reserve/unreserve products during payment flow
 */
export async function updateProductStatus(
  productId: string,
  newStatus: 'available' | 'reserved' | 'sold'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId);

  if (error) {
    console.error('[ProductValidation] Failed to update product status:', {
      productId,
      newStatus,
      error: error.message,
    });
    return { success: false, error: error.message };
  }

  console.log('[ProductValidation] Product status updated:', {
    productId,
    newStatus,
  });

  return { success: true };
}
