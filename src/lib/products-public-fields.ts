/**
 * PRODUCT PUBLIC FIELDS
 * Lista explícita de campos públicos de la tabla products
 * 
 * IMPORTANTE: Esta lista se usa en rutas públicas (catálogo, detalle producto)
 * para evitar exposición de campos internos sensibles.
 * 
 * ⚠️ NUNCA agregar aquí campos internos:
 * - cost_price
 * - additional_costs
 * - supplier_name
 * - acquisition_date
 * - physical_location
 * - internal_notes
 * - certificate_notes
 * - serial_number
 * 
 * Estos campos SOLO deben ser accesibles en rutas admin autenticadas.
 */

export const PRODUCT_PUBLIC_FIELDS = `
  id,
  slug,
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
  includes_papers,
  stock,
  allow_layaway,
  layaway_deposit_percent,
  created_at,
  updated_at
`.trim()

/**
 * Total de campos públicos: 24
 * 
 * - 20 campos base del schema original
 * - 2 campos de layaway (allow_layaway, layaway_deposit_percent)
 * - 2 campos de timestamp (created_at, updated_at)
 * 
 * Uso:
 * ```typescript
 * import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'
 * 
 * const { data } = await supabase
 *   .from('products')
 *   .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
 *   .eq('is_published', true)
 * ```
 */
