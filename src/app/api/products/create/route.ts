import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateUniqueSlug } from '@/lib/generate-slug'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      // slug ya no se extrae - se genera automáticamente
      title,
      brand,
      model,
      color,
      origin,
      status,
      condition,
      price,
      currency,
      category,
      badge,
      description,
      is_published,
      includes_box,
      includes_dust_bag,
      includes_papers
    } = body

    // Validaciones básicas (slug removido)
    if (!title || !brand || !category || !status || !condition) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Generar slug único automáticamente
    const slug = await generateUniqueSlug({
      brand,
      title,
      model: model || null,
      color: color || null
    })

    // Crear producto con slug generado
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        slug, // ← slug generado automáticamente
        title,
        brand,
        model: model || null,
        color: color || null,
        origin: origin || null,
        status,
        condition,
        price: price ? parseFloat(price) : null,
        currency: currency || 'MXN',
        category,
        badge: badge || null,
        description: description || null,
        is_published: is_published || false,
        includes_box: includes_box || false,
        includes_dust_bag: includes_dust_bag || false,
        includes_papers: includes_papers || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
