/**
 * Customer Addresses API
 * 
 * Endpoints:
 * - GET: List all addresses for authenticated user
 * - POST: Create new address for authenticated user
 * 
 * Auth: Required (Bearer token + Supabase Admin + manual user_id filter)
 * Phase: 5D.2A
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateCreateAddress, sanitizeAddressData } from '@/lib/addresses/validation';
import type { Address, CreateAddressDTO } from '@/types/address';

/**
 * GET /api/account/addresses
 * 
 * List all addresses for authenticated user.
 * Ordered by: is_default DESC, created_at DESC (default first, then newest)
 * 
 * Auth: Required (Bearer token in Authorization header)
 * Returns: { addresses: Address[] }
 */
export async function GET(request: NextRequest) {
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

    // ===== 2. FETCH: Get addresses for authenticated user =====
    // Manual filter by user_id (service_role bypasses RLS)
    const { data: addresses, error } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id) // Explicit ownership filter
      .order('is_default', { ascending: false }) // Default first
      .order('created_at', { ascending: false }); // Then newest first

    if (error) {
      console.error('[GET ADDRESSES] Error fetching addresses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ addresses: addresses || [] });

  } catch (error) {
    console.error('[GET ADDRESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/addresses
 * 
 * Create new address for authenticated user.
 * 
 * Special logic:
 * - If first address for user → force is_default = true
 * - If is_default = true and user has other addresses → unmark previous default
 * - Handles unique constraint error (23505) on is_default index
 * 
 * Auth: Required (Bearer token in Authorization header)
 * Body: CreateAddressDTO
 * Returns: { address: Address }
 */
export async function POST(request: NextRequest) {
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

    // ===== 2. VALIDATE: Parse and validate request body =====
    const body = await request.json();

    const validationErrors = validateCreateAddress(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validationErrors 
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeAddressData(body);

    // ===== 3. CHECK: Is this the first address for user? =====
    const { count: existingCount, error: countError } = await supabaseAdmin
      .from('customer_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('[CREATE ADDRESS] Error counting addresses:', countError);
      return NextResponse.json(
        { error: 'Failed to check existing addresses' },
        { status: 500 }
      );
    }

    const isFirstAddress = existingCount === 0;

    // ===== 4. PREPARE: Build insert data =====
    const insertData: any = {
      user_id: user.id, // Always use authenticated user's ID (never trust body)
      full_name: sanitizedData.full_name,
      phone_country_code: sanitizedData.phone_country_code,
      phone_country_iso: sanitizedData.phone_country_iso,
      phone: sanitizedData.phone,
      country: sanitizedData.country,
      state: sanitizedData.state,
      city: sanitizedData.city,
      postal_code: sanitizedData.postal_code,
      address_line1: sanitizedData.address_line1,
      address_line2: sanitizedData.address_line2,
      delivery_references: sanitizedData.delivery_references,
      is_default: isFirstAddress ? true : sanitizedData.is_default, // Force true if first
    };

    // ===== 5. CLEAR DEFAULT: If marking as default and not first, unmark others =====
    if (insertData.is_default && !isFirstAddress) {
      const { error: clearError } = await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);

      if (clearError) {
        console.error('[CREATE ADDRESS] Error clearing default addresses:', clearError);
        // Continue anyway - unique index will catch duplicates
      }
    }

    // ===== 6. INSERT: Create new address =====
    const { data: newAddress, error: insertError } = await supabaseAdmin
      .from('customer_addresses')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (error code 23505)
      if (insertError.code === '23505') {
        console.warn('[CREATE ADDRESS] Unique constraint violated (23505), retrying...');
        
        // Retry: clear defaults first, then insert
        await supabaseAdmin
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);

        const { data: retryAddress, error: retryError } = await supabaseAdmin
          .from('customer_addresses')
          .insert(insertData)
          .select()
          .single();

        if (retryError) {
          console.error('[CREATE ADDRESS] Error creating address (retry):', retryError);
          return NextResponse.json(
            { error: 'Failed to create address' },
            { status: 500 }
          );
        }

        console.log('[CREATE ADDRESS] Address created successfully (retry):', retryAddress.id);
        return NextResponse.json({ address: retryAddress }, { status: 201 });
      }

      console.error('[CREATE ADDRESS] Error creating address:', insertError);
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      );
    }

    console.log('[CREATE ADDRESS] Address created successfully:', newAddress.id);
    return NextResponse.json({ address: newAddress }, { status: 201 });

  } catch (error) {
    console.error('[CREATE ADDRESS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
