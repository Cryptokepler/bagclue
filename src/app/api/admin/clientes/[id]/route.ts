import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminClienteDetail } from '@/lib/admin/clientes'

/**
 * GET /api/admin/clientes/[id]
 * 
 * Retorna detalle completo de un cliente
 * [id] puede ser:
 * - user_id (UUID) para clientes registrados
 * - email (URL-encoded) para clientes guest
 */
export async function GET(
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
    const result = await getAdminClienteDetail(id)
    
    if (!result) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[CLIENTE DETAIL] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/clientes/[id]
 * 
 * Edita datos del cliente
 * Campos editables: name, phone, phone_country_code, phone_country_iso, internal_notes
 * Email NO es editable
 * 
 * Para clientes guest sin customer_profile, crea el profile automáticamente
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
    const body = await request.json()

    // Validar internal_notes length
    if (body.internal_notes && body.internal_notes.length > 1000) {
      return NextResponse.json(
        { error: 'Notas internas máximo 1000 caracteres' },
        { status: 400 }
      )
    }

    // Determine if this is a user_id (UUID) or email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)

    if (isUUID) {
      // Cliente registrado - actualizar profile existente
      const { data, error } = await supabaseAdmin
        .from('customer_profiles')
        .update({
          name: body.name,
          phone: body.phone,
          phone_country_code: body.phone_country_code,
          phone_country_iso: body.phone_country_iso,
          internal_notes: body.internal_notes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', clientId)
        .select()
        .single()

      if (error) {
        console.error('[CLIENTE UPDATE] Error:', error)
        return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
      }

      return NextResponse.json({ success: true, profile: data })

    } else {
      // Cliente guest (email) - verificar si ya tiene profile (case-insensitive)
      const email = clientId

      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from('customer_profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle()

      if (fetchError) {
        console.error('[CLIENTE UPDATE] Fetch error:', fetchError)
        return NextResponse.json({ error: 'Error al buscar cliente' }, { status: 500 })
      }

      if (existingProfile) {
        // Ya existe profile - actualizar (case-insensitive)
        const { data, error } = await supabaseAdmin
          .from('customer_profiles')
          .update({
            name: body.name,
            phone: body.phone,
            phone_country_code: body.phone_country_code,
            phone_country_iso: body.phone_country_iso,
            internal_notes: body.internal_notes,
            updated_at: new Date().toISOString()
          })
          .ilike('email', email)
          .select()
          .single()

        if (error) {
          console.error('[CLIENTE UPDATE] Update error:', error)
          return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
        }

        return NextResponse.json({ success: true, profile: data })

      } else {
        // NO existe profile - crear uno nuevo (guest → profile temporal)
        const { data, error } = await supabaseAdmin
          .from('customer_profiles')
          .insert({
            email: email,
            name: body.name || null,
            phone: body.phone || null,
            phone_country_code: body.phone_country_code || null,
            phone_country_iso: body.phone_country_iso || null,
            internal_notes: body.internal_notes || null,
            user_id: null // Guest no tiene user_id
          })
          .select()
          .single()

        if (error) {
          console.error('[CLIENTE UPDATE] Insert error:', error)
          return NextResponse.json({ error: 'Error al crear perfil de cliente' }, { status: 500 })
        }

        return NextResponse.json({ success: true, profile: data, created: true })
      }
    }

  } catch (error: any) {
    console.error('[CLIENTE UPDATE] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
