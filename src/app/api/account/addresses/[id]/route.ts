/**
 * Customer Address Management - Individual Address
 * 
 * Endpoints:
 * - PATCH: Update address (partial update)
 * - DELETE: Delete address
 * 
 * Auth: Required (Bearer token + Supabase Admin + manual user_id filter)
 * Phase: 5D.2B
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateUpdateAddress, sanitizeUpdateData } from '@/lib/addresses/validation';
import type { UpdateAddressDTO } from '@/types/address';

/**
 * PATCH /api/account/addresses/[id]
 * 
 * Update address (partial update - only fields sent are updated).
 * 
 * Special logic:
 * - If is_default = true → unmark other user's addresses
 * - If is_default = false AND address is current default AND other addresses exist → reject with 400
 * - If is_default = false AND address is only address → keep is_default = true
 * - Validates ownership (user can only update own addresses)
 * 
 * Auth: Required (Bearer token in Authorization header)
 * Body: UpdateAddressDTO (all fields optional)
 * Returns: { address: Address }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ===== 1. AUTH: Verify Bearer token =====
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ===== 2. PARAMS: Get address ID =====
    const { id: addressId } = await params;

    // ===== 3. FETCH: Get address and verify ownership =====
    const { data: currentAddress, error: fetchError } = await supabaseAdmin
      .from('customer_addresses')
      .select('id, user_id, is_default')
      .eq('id', addressId)
      .single();

    if (fetchError || !currentAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (currentAddress.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Address does not belong to user' },
        { status: 403 }
      );
    }

    // ===== 4. VALIDATE: Parse and validate request body =====
    const body = await request.json();

    const validationErrors = validateUpdateAddress(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validationErrors 
        },
        { status: 400 }
      );
    }

    // Sanitize data (only sanitize fields present in body)
    const sanitizedData = sanitizeUpdateData(body);

    // Ignore immutable fields if sent
    delete sanitizedData.id;
    delete sanitizedData.user_id;
    delete sanitizedData.created_at;
    delete sanitizedData.updated_at;

    // ===== 5. HANDLE is_default LOGIC =====
    
    // Case 1: User wants to mark this as default
    if (sanitizedData.is_default === true) {
      // Unmark all other default addresses for this user
      const { error: clearError } = await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', addressId)
        .eq('is_default', true);

      if (clearError) {
        console.error('[PATCH ADDRESS] Error clearing default addresses:', clearError);
        // Continue anyway - unique index will catch duplicates
      }
    }

    // Case 2: User wants to unmark as default
    if (sanitizedData.is_default === false && currentAddress.is_default === true) {
      // Check if there are other addresses
      const { count: otherAddresses } = await supabaseAdmin
        .from('customer_addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('id', addressId);

      if (otherAddresses && otherAddresses > 0) {
        // User has other addresses - don't allow unmarking only default
        return NextResponse.json(
          { error: 'Cannot unmark only default address. Mark another address as default first.' },
          { status: 400 }
        );
      }
      // If otherAddresses === 0, this is the only address → keep as default (override user's request)
      sanitizedData.is_default = true;
    }

    // ===== 6. UPDATE: Apply changes =====
    const { data: updatedAddress, error: updateError } = await supabaseAdmin
      .from('customer_addresses')
      .update(sanitizedData)
      .eq('id', addressId)
      .eq('user_id', user.id) // Extra safety: ensure ownership
      .select()
      .single();

    if (updateError) {
      // Handle unique constraint violation (error code 23505)
      if (updateError.code === '23505') {
        console.warn('[PATCH ADDRESS] Unique constraint violated (23505), retrying...');
        
        // Retry: clear defaults first, then update
        await supabaseAdmin
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', addressId)
          .eq('is_default', true);

        const { data: retryAddress, error: retryError } = await supabaseAdmin
          .from('customer_addresses')
          .update(sanitizedData)
          .eq('id', addressId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (retryError) {
          console.error('[PATCH ADDRESS] Error updating address (retry):', retryError);
          return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
          );
        }

        console.log('[PATCH ADDRESS] Address updated successfully (retry):', retryAddress.id);
        return NextResponse.json({ address: retryAddress });
      }

      console.error('[PATCH ADDRESS] Error updating address:', updateError);
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      );
    }

    console.log('[PATCH ADDRESS] Address updated successfully:', updatedAddress.id);
    return NextResponse.json({ address: updatedAddress });

  } catch (error) {
    console.error('[PATCH ADDRESS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account/addresses/[id]
 * 
 * Delete address.
 * 
 * Special logic:
 * - If deleting default address AND other addresses exist → mark most recent as new default
 * - If deleting only address → allow (user has no addresses after)
 * - Validates ownership (user can only delete own addresses)
 * 
 * Auth: Required (Bearer token in Authorization header)
 * Returns: { success: true, message: string, new_default_id: string | null }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ===== 1. AUTH: Verify Bearer token =====
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ===== 2. PARAMS: Get address ID =====
    const { id: addressId } = await params;

    // ===== 3. FETCH: Get address and verify ownership =====
    const { data: addressToDelete, error: fetchError } = await supabaseAdmin
      .from('customer_addresses')
      .select('id, user_id, is_default')
      .eq('id', addressId)
      .single();

    if (fetchError || !addressToDelete) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (addressToDelete.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Address does not belong to user' },
        { status: 403 }
      );
    }

    // ===== 4. FIND NEW DEFAULT: If deleting default, find replacement first =====
    let newDefaultId: string | null = null;

    if (addressToDelete.is_default) {
      // Get the most recent address (excluding the one being deleted)
      const { data: otherAddresses } = await supabaseAdmin
        .from('customer_addresses')
        .select('id')
        .eq('user_id', user.id)
        .neq('id', addressId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (otherAddresses && otherAddresses.length > 0) {
        newDefaultId = otherAddresses[0].id;
        console.log('[DELETE ADDRESS] New default identified (will mark after deletion):', newDefaultId);
      }
      // If no other addresses, newDefaultId stays null (user will have no addresses)
    }

    // ===== 5. DELETE: Remove the address first =====
    const { error: deleteError } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id); // Extra safety: ensure ownership

    if (deleteError) {
      console.error('[DELETE ADDRESS] Error deleting address:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      );
    }

    console.log('[DELETE ADDRESS] Address deleted successfully:', addressId);

    // ===== 6. MARK NEW DEFAULT: After deletion, mark new default if exists =====
    if (newDefaultId) {
      const { error: markError } = await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', newDefaultId)
        .eq('user_id', user.id); // Extra safety: ensure ownership

      if (markError) {
        console.error('[DELETE ADDRESS] Error marking new default:', markError);
        return NextResponse.json(
          { error: 'Address deleted but failed to mark new default' },
          { status: 500 }
        );
      }

      console.log('[DELETE ADDRESS] New default marked successfully:', newDefaultId);
    }

    console.log('[DELETE ADDRESS] Address deleted successfully:', addressId);
    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      new_default_id: newDefaultId
    });

  } catch (error) {
    console.error('[DELETE ADDRESS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
