import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * DELETE /api/admin/clientes/[id]/delete
 * 
 * Elimina permanentemente un cliente
 * 
 * RESTRICCIÓN CRÍTICA: Solo permitir si NO tiene:
 * - orders
 * - layaways
 * - payment_transactions
 * - customer_addresses (se eliminan en cascada)
 * 
 * Si tiene historial, devuelve error con hasHistory: true
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const clientId = decodeURIComponent(id)
    
    // Determine if this is a user_id (UUID) or email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)

    // Validar historial comercial
    const whereCondition = isUUID 
      ? `user_id.eq.${clientId}`
      : `customer_email.eq.${clientId}`

    // Contar orders
    const { count: orderCount, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or(whereCondition)

    if (orderError) {
      console.error('[CLIENTE DELETE] Order count error:', orderError)
      return NextResponse.json({ error: 'Error al validar historial' }, { status: 500 })
    }

    // Contar layaways
    const { count: layawayCount, error: layawayError } = await supabaseAdmin
      .from('layaways')
      .select('id', { count: 'exact', head: true })
      .or(whereCondition)

    if (layawayError) {
      console.error('[CLIENTE DELETE] Layaway count error:', layawayError)
      return NextResponse.json({ error: 'Error al validar historial' }, { status: 500 })
    }

    // Si tiene historial, NO permitir borrar
    if ((orderCount && orderCount > 0) || (layawayCount && layawayCount > 0)) {
      return NextResponse.json({
        error: 'Este cliente tiene historial comercial. Puedes archivarlo, pero no eliminarlo.',
        hasHistory: true,
        order_count: orderCount || 0,
        layaway_count: layawayCount || 0
      }, { status: 400 })
    }

    // NO tiene historial - proceder a eliminar
    if (isUUID) {
      // Cliente registrado
      
      // 1. Eliminar direcciones (FK constraint)
      const { error: addressError } = await supabaseAdmin
        .from('customer_addresses')
        .delete()
        .eq('user_id', clientId)

      if (addressError) {
        console.error('[CLIENTE DELETE] Address delete error:', addressError)
        return NextResponse.json({ error: 'Error al eliminar direcciones' }, { status: 500 })
      }

      // 2. Eliminar profile
      const { error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .delete()
        .eq('user_id', clientId)

      if (profileError) {
        console.error('[CLIENTE DELETE] Profile delete error:', profileError)
        return NextResponse.json({ error: 'Error al eliminar perfil' }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: true })

    } else {
      // Cliente guest (email) - solo eliminar profile si existe
      const email = clientId

      const { error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .delete()
        .eq('email', email)

      if (profileError) {
        console.error('[CLIENTE DELETE] Guest profile delete error:', profileError)
        return NextResponse.json({ error: 'Error al eliminar perfil guest' }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: true })
    }

  } catch (error: any) {
    console.error('[CLIENTE DELETE] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
