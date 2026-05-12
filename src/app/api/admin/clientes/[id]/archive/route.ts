import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * PATCH /api/admin/clientes/[id]/archive
 * 
 * Archiva un cliente (soft delete)
 * Establece archived_at = NOW()
 * 
 * NO elimina historial (orders, layaways, payments permanecen intactos)
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

    if (isUUID) {
      // Cliente registrado
      const { data, error } = await supabaseAdmin
        .from('customer_profiles')
        .update({
          archived_at: new Date().toISOString()
        })
        .eq('user_id', clientId)
        .select('archived_at')
        .single()

      if (error) {
        console.error('[CLIENTE ARCHIVE] Error:', error)
        return NextResponse.json({ error: 'Error al archivar cliente' }, { status: 500 })
      }

      return NextResponse.json({ success: true, archived_at: data.archived_at })

    } else {
      // Cliente guest (email)
      const email = clientId

      // Verificar si ya tiene profile
      const { data: existingProfile } = await supabaseAdmin
        .from('customer_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile) {
        // Ya tiene profile - archivar
        const { data, error } = await supabaseAdmin
          .from('customer_profiles')
          .update({
            archived_at: new Date().toISOString()
          })
          .eq('email', email)
          .select('archived_at')
          .single()

        if (error) {
          console.error('[CLIENTE ARCHIVE] Error:', error)
          return NextResponse.json({ error: 'Error al archivar cliente' }, { status: 500 })
        }

        return NextResponse.json({ success: true, archived_at: data.archived_at })

      } else {
        // NO tiene profile - crear profile con archived_at
        const { data, error } = await supabaseAdmin
          .from('customer_profiles')
          .insert({
            email: email,
            user_id: null,
            archived_at: new Date().toISOString()
          })
          .select('archived_at')
          .single()

        if (error) {
          console.error('[CLIENTE ARCHIVE] Insert error:', error)
          return NextResponse.json({ error: 'Error al archivar cliente guest' }, { status: 500 })
        }

        return NextResponse.json({ success: true, archived_at: data.archived_at, created: true })
      }
    }

  } catch (error: any) {
    console.error('[CLIENTE ARCHIVE] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
