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
      material,
      status,
      condition,
      category,
      condition_notes,
      price,
      currency,
      badge,
      description,
      is_published,
      // Autenticidad y accesorios
      authenticity_verified,
      certificate_notes,
      serial_number,
      included_accessories,
      includes_box,
      includes_dust_bag,
      includes_papers,
      // Información interna
      cost_price,
      additional_costs,
      supplier_name,
      acquisition_date,
      physical_location,
      internal_notes
    } = body

    // Validaciones básicas
    if (!title || !brand || !category || !status || !condition || price === undefined || price === null) {
      return NextResponse.json({ error: 'Campos requeridos faltantes: title, brand, category, status, condition, price' }, { status: 400 })
    }

    // Validar price
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'price debe ser número positivo' }, { status: 400 })
    }

    // Validar cost_price si se envía
    if (cost_price !== undefined && cost_price !== null && cost_price !== '') {
      const costPriceNum = parseFloat(cost_price)
      if (isNaN(costPriceNum) || costPriceNum < 0) {
        return NextResponse.json({ error: 'cost_price debe ser número no negativo' }, { status: 400 })
      }
    }

    // Validar additional_costs
    let additionalCostsNormalized = null
    if (additional_costs) {
      const costs = typeof additional_costs === 'string' ? JSON.parse(additional_costs) : additional_costs
      
      if (typeof costs !== 'object' || costs === null) {
        return NextResponse.json({ error: 'additional_costs debe ser objeto JSON' }, { status: 400 })
      }

      // Validar valores
      const keys = ['shipping', 'authentication', 'cleaning', 'other']
      for (const key of keys) {
        if (costs[key] !== null && costs[key] !== undefined && costs[key] !== '') {
          const val = parseFloat(costs[key])
          if (isNaN(val) || val < 0) {
            return NextResponse.json({ error: `additional_costs.${key} debe ser número no negativo` }, { status: 400 })
          }
        }
      }

      additionalCostsNormalized = {
        shipping: costs.shipping ? parseFloat(costs.shipping) : null,
        authentication: costs.authentication ? parseFloat(costs.authentication) : null,
        cleaning: costs.cleaning ? parseFloat(costs.cleaning) : null,
        other: costs.other ? parseFloat(costs.other) : null
      }
    }

    // Validar acquisition_date si se envía
    if (acquisition_date) {
      const date = new Date(acquisition_date)
      const now = new Date()
      if (date > now) {
        return NextResponse.json({ error: 'acquisition_date no puede ser futura' }, { status: 400 })
      }
    }

    // Validar límites de textareas
    const textFields = { condition_notes, description, certificate_notes, included_accessories, internal_notes }
    for (const [fieldName, value] of Object.entries(textFields)) {
      if (value && value.length > 2000) {
        return NextResponse.json({ error: `${fieldName} excede el límite de 2000 caracteres` }, { status: 400 })
      }
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
        material: material || null,
        status,
        condition,
        category,
        condition_notes: condition_notes || null,
        price: priceNum,
        currency: currency || 'MXN',
        badge: badge || null,
        description: description || null,
        is_published: is_published || false,
        // Autenticidad y accesorios
        authenticity_verified: authenticity_verified || false,
        certificate_notes: certificate_notes || null,
        serial_number: serial_number || null,
        included_accessories: included_accessories || null,
        includes_box: includes_box || false,
        includes_dust_bag: includes_dust_bag || false,
        includes_papers: includes_papers || false,
        // Información interna
        cost_price: cost_price ? parseFloat(cost_price) : null,
        additional_costs: additionalCostsNormalized,
        supplier_name: supplier_name || null,
        acquisition_date: acquisition_date || null,
        physical_location: physical_location || null,
        internal_notes: internal_notes || null
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
