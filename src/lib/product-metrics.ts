// src/lib/product-metrics.ts
// Helpers para cálculo de métricas de productos (utilidad, margen, costos)

export interface ProductMetrics {
  costPrice: number
  additionalCostsTotal: number
  totalCost: number
  profit: number
  margin: number
  marginColor: 'green' | 'yellow' | 'red' | 'gray'
}

/**
 * Calcula el total de costos adicionales desde el JSONB additional_costs
 * Suma: shipping + authentication + cleaning + other
 */
export function calculateAdditionalCostsTotal(
  additionalCosts: any
): number {
  if (!additionalCosts || typeof additionalCosts !== 'object') {
    return 0
  }
  
  const shipping = Number(additionalCosts.shipping) || 0
  const authentication = Number(additionalCosts.authentication) || 0
  const cleaning = Number(additionalCosts.cleaning) || 0
  const other = Number(additionalCosts.other) || 0
  
  return shipping + authentication + cleaning + other
}

/**
 * Calcula todas las métricas de un producto:
 * - Costo total (cost_price + additional_costs)
 * - Utilidad (price - totalCost)
 * - Margen % ((profit / price) * 100)
 * - Color del margen (verde >= 30%, amarillo 15-29%, rojo < 15%, gris sin costo)
 */
export function calculateProductMetrics(product: any): ProductMetrics {
  const costPrice = Number(product.cost_price) || 0
  const additionalCostsTotal = calculateAdditionalCostsTotal(product.additional_costs)
  const totalCost = costPrice + additionalCostsTotal
  const price = Number(product.price) || 0
  
  // Si no hay costo o precio, margen es N/A
  if (costPrice === 0 || price === 0) {
    return {
      costPrice,
      additionalCostsTotal,
      totalCost,
      profit: 0,
      margin: 0,
      marginColor: 'gray'
    }
  }
  
  const profit = price - totalCost
  const margin = (profit / price) * 100
  
  // Determinar color según margen
  let marginColor: 'green' | 'yellow' | 'red' | 'gray'
  if (margin >= 30) {
    marginColor = 'green'
  } else if (margin >= 15) {
    marginColor = 'yellow'
  } else {
    marginColor = 'red'
  }
  
  return {
    costPrice,
    additionalCostsTotal,
    totalCost,
    profit,
    margin,
    marginColor
  }
}

/**
 * Formatea un monto como moneda
 * Por defecto usa MXN con formato mexicano
 */
export function formatCurrency(
  amount: number,
  currency: string = 'MXN'
): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatea un margen porcentual
 * Ejemplo: 29.5 → "29.5%"
 */
export function formatMargin(margin: number): string {
  return `${margin.toFixed(1)}%`
}

/**
 * Calcula el margen promedio de un array de productos
 * Solo considera productos con costo y precio válidos
 */
export function calculateAverageMargin(products: any[]): number {
  const validProducts = products.filter(p => {
    const costPrice = Number(p.cost_price) || 0
    const price = Number(p.price) || 0
    return costPrice > 0 && price > 0
  })
  
  if (validProducts.length === 0) {
    return 0
  }
  
  const totalMargin = validProducts.reduce((sum, p) => {
    const metrics = calculateProductMetrics(p)
    return sum + metrics.margin
  }, 0)
  
  return totalMargin / validProducts.length
}
