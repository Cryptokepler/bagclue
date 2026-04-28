import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Construir objeto de actualización solo con campos presentes
    const updates: any = {}
    
    if (body.slug !== undefined) updates.slug = body.slug
    if (body.title !== undefined) updates.title = body.title
    if (body.brand !== undefined) updates.brand = body.brand
    if (body.model !== undefined) updates.model = body.model || null
    if (body.color !== undefined) updates.color = body.color || null
    if (body.origin !== undefined) updates.origin = body.origin || null
    if (body.status !== undefined) updates.status = body.status
    if (body.condition !== undefined) updates.condition = body.condition
    if (body.price !== undefined) updates.price = body.price ? parseFloat(body.price) : null
    if (body.currency !== undefined) updates.currency = body.currency
    if (body.category !== undefined) updates.category = body.category
    if (body.badge !== undefined) updates.badge = body.badge || null
    if (body.description !== undefined) updates.description = body.description || null
    if (body.is_published !== undefined) updates.is_published = body.is_published
    if (body.includes_box !== undefined) updates.includes_box = body.includes_box
    if (body.includes_dust_bag !== undefined) updates.includes_dust_bag = body.includes_dust_bag
    if (body.includes_papers !== undefined) updates.includes_papers = body.includes_papers

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Actualizar producto
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
