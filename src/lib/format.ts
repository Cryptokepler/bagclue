/**
 * Formato consistente de moneda (MXN) para evitar hydration mismatch
 * NO usa toLocaleString() porque puede diferir entre server y client
 */
export function formatMXN(amount: number): string {
  // Formato manual con separadores de miles
  const parts = amount.toFixed(0).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${integerPart}`
}

/**
 * Formato genérico de número con separadores de miles
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
