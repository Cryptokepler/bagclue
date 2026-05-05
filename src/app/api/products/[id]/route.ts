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

    // Validar price si se envía
    if (body.price !== undefined && body.price !== null && body.price !== '') {
      const priceNum = parseFloat(body.price)
      if (isNaN(priceNum) || priceNum <= 0) {
        return NextResponse.json({ error: 'price debe ser número positivo' }, { status: 400 })
      }
    }

    // Validar cost_price si se envía
    if (body.cost_price !== undefined && body.cost_price !== null && body.cost_price !== '') {
      const costPriceNum = parseFloat(body.cost_price)
      if (isNaN(costPriceNum) || costPriceNum < 0) {
        return NextResponse.json({ error: 'cost_price debe ser número no negativo' }, { status: 400 })
      }
    }

    // Validar additional_costs
    let additionalCostsNormalized = null
    if (body.additional_costs !== undefined) {
      const costs = typeof body.additional_costs === 'string' ? JSON.parse(body.additional_costs) : body.additional_costs
      
      if (costs && typeof costs === 'object') {
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
    }

    // Validar acquisition_date si se envía
    if (body.acquisition_date && body.acquisition_date !== '') {
      const date = new Date(body.acquisition_date)
      const now = new Date()
      if (date > now) {
        return NextResponse.json({ error: 'acquisition_date no puede ser futura' }, { status: 400 })
      }
    }

    // Validar límites de textareas
    const textFields = { condition_notes: body.condition_notes, description: body.description, certificate_notes: body.certificate_notes, included_accessories: body.included_accessories, internal_notes: body.internal_notes }
    for (const [fieldName, value] of Object.entries(textFields)) {
      if (value && value.length > 2000) {
        return NextResponse.json({ error: `${fieldName} excede el límite de 2000 caracteres` }, { status: 400 })
      }
    }

    // Construir objeto de actualización solo con campos presentes
    const updates: any = {}
    
    // slug NO es editable - se mantiene el original para URLs estables
    if (body.title !== undefined) updates.title = body.title
    if (body.brand !== undefined) updates.brand = body.brand
    if (body.model !== undefined) updates.model = body.model || null
    if (body.color !== undefined) updates.color = body.color || null
    if (body.origin !== undefined) updates.origin = body.origin || null
    if (body.material !== undefined) updates.material = body.material || null
    if (body.status !== undefined) updates.status = body.status
    if (body.condition !== undefined) updates.condition = body.condition
    if (body.category !== undefined) updates.category = body.category
    if (body.condition_notes !== undefined) updates.condition_notes = body.condition_notes || null
    if (body.price !== undefined) updates.price = body.price ? parseFloat(body.price) : null
    if (body.currency !== undefined) updates.currency = body.currency
    if (body.badge !== undefined) updates.badge = body.badge || null
    if (body.description !== undefined) updates.description = body.description || null
    if (body.is_published !== undefined) updates.is_published = body.is_published
    // Autenticidad y accesorios
    if (body.authenticity_verified !== undefined) updates.authenticity_verified = body.authenticity_verified
    if (body.certificate_notes !== undefined) updates.certificate_notes = body.certificate_notes || null
    if (body.serial_number !== undefined) updates.serial_number = body.serial_number || null
    if (body.included_accessories !== undefined) updates.included_accessories = body.included_accessories || null
    if (body.includes_box !== undefined) updates.includes_box = body.includes_box
    if (body.includes_dust_bag !== undefined) updates.includes_dust_bag = body.includes_dust_bag
    if (body.includes_papers !== undefined) updates.includes_papers = body.includes_papers
    // Información interna
    if (body.cost_price !== undefined) updates.cost_price = body.cost_price ? parseFloat(body.cost_price) : null
    if (body.additional_costs !== undefined) updates.additional_costs = additionalCostsNormalized
    if (body.supplier_name !== undefined) updates.supplier_name = body.supplier_name || null
    if (body.acquisition_date !== undefined) updates.acquisition_date = body.acquisition_date || null
    if (body.physical_location !== undefined) updates.physical_location = body.physical_location || null
    if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes || null

    // Agregar updated_at
    updates.updated_at = new Date().toISOString()

    if (Object.keys(updates).length === 0 || (Object.keys(updates).length === 1 && updates.updated_at)) {
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
