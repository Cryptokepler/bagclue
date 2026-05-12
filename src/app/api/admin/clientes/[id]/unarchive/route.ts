import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * PATCH /api/admin/clientes/[id]/unarchive
 * 
 * Activa un cliente archivado
 * Establece archived_at = NULL
 */
export async function PATCH(
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

    const whereClause = isUUID ? { user_id: clientId } : { email: clientId }

    const { data, error } = await supabaseAdmin
      .from('customer_profiles')
      .update({
        archived_at: null
      })
      .match(whereClause)
      .select('archived_at')
      .single()

    if (error) {
      console.error('[CLIENTE UNARCHIVE] Error:', error)
      return NextResponse.json({ error: 'Error al activar cliente' }, { status: 500 })
    }

    return NextResponse.json({ success: true, archived_at: data.archived_at })

  } catch (error: any) {
    console.error('[CLIENTE UNARCHIVE] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
