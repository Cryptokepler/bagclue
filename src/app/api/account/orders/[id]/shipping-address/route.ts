import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface CustomerAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_country_code: string;
  phone: string;
  is_default: boolean;
}

interface Order {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  payment_status: string;
  shipping_status: string | null;
}

/**
 * PATCH /api/account/orders/[id]/shipping-address
 * 
 * Permite que una clienta autenticada confirme la dirección de envío
 * de un pedido propio usando una dirección guardada.
 * 
 * Reglas:
 * - Requiere Authorization Bearer token
 * - address_id debe existir y pertenecer al usuario
 * - Order debe existir y pertenecer al usuario
 * - Order debe estar paid
 * - Order NO debe estar shipped/delivered
 * - Solo actualiza: shipping_address, customer_phone
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params (Next.js 16 requirement)
    const { id: orderId } = await params;

    // 2. Validar Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 3. Crear cliente Supabase con el token del usuario
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 4. Obtener user del token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 5. Parse body
    const body = await request.json();
    const { address_id } = body;

    if (!address_id) {
      return NextResponse.json(
        { error: 'Missing address_id in request body' },
        { status: 400 }
      );
    }

    // 6. Crear cliente con service_role para queries
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // 7. Validar que address_id existe y pertenece al usuario
    const { data: address, error: addressError } = await supabaseService
      .from('customer_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .single();

    if (addressError || !address) {
      return NextResponse.json(
        { error: 'Address not found or does not belong to user' },
        { status: 404 }
      );
    }

    const customerAddress = address as CustomerAddress;

    // 8. Validar que order existe y pertenece al usuario
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select('id, user_id, customer_email, payment_status, shipping_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = order as Order;

    // Validar ownership: user_id match o customer_email match
    const isOwner = 
      (orderData.user_id && orderData.user_id === user.id) ||
      (orderData.customer_email && orderData.customer_email === user.email);

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Order does not belong to user' },
        { status: 403 }
      );
    }

    // 9. Validar que order está paid
    if (orderData.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Order must be paid before confirming shipping address' },
        { status: 400 }
      );
    }

    // 10. Validar que order NO está shipped ni delivered
    if (orderData.shipping_status === 'shipped' || orderData.shipping_status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot change shipping address for orders that are already shipped or delivered' },
        { status: 400 }
      );
    }

    // 11. Formatear customer_address a shipping_address TEXT multilínea
    const shippingAddressLines = [
      customerAddress.full_name,
      customerAddress.address_line1,
    ];

    if (customerAddress.address_line2) {
      shippingAddressLines.push(customerAddress.address_line2);
    }

    shippingAddressLines.push(
      `${customerAddress.city}, ${customerAddress.state}, ${customerAddress.postal_code}`,
      customerAddress.country,
      `Tel: ${customerAddress.phone_country_code} ${customerAddress.phone}`
    );

    const shippingAddress = shippingAddressLines.join('\n');

    const customerPhone = `${customerAddress.phone_country_code} ${customerAddress.phone}`;

    // 12. Actualizar SOLO shipping_address y customer_phone
    const { data: updatedOrder, error: updateError } = await supabaseService
      .from('orders')
      .update({
        shipping_address: shippingAddress,
        customer_phone: customerPhone,
      })
      .eq('id', orderId)
      .select('id, shipping_address, customer_phone, payment_status, shipping_status')
      .single();

    if (updateError) {
      console.error('Error updating order shipping address:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shipping address' },
        { status: 500 }
      );
    }

    // 13. Responder con order actualizada
    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Error in PATCH /api/account/orders/[id]/shipping-address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
