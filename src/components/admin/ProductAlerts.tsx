// src/components/admin/ProductAlerts.tsx
// Alertas visuales para productos incompletos

export function ProductAlerts({ product }: { product: any }) {
  const alerts: Array<{ icon: string; message: string; color: string }> = []
  
  // Sin imagen
  if (!product.product_images || product.product_images.length === 0) {
    alerts.push({ icon: '📷', message: 'Sin imagen', color: 'text-red-400' })
  }
  
  // Sin costo
  if (!product.cost_price || product.cost_price === 0) {
    alerts.push({ icon: '💰', message: 'Sin costo', color: 'text-orange-400' })
  }
  
  // Sin descripción
  if (!product.description || product.description.trim() === '') {
    alerts.push({ icon: '📝', message: 'Sin descripción', color: 'text-yellow-400' })
  }
  
  // Sin condición detallada
  if (!product.condition_notes || product.condition_notes.trim() === '') {
    alerts.push({ icon: '🔍', message: 'Sin condición detallada', color: 'text-yellow-400' })
  }
  
  // Sin autenticidad verificada
  if (!product.authenticity_verified) {
    alerts.push({ icon: '✓', message: 'Sin autenticidad verificada', color: 'text-gray-400' })
  }
  
  // Sin ubicación física
  if (!product.physical_location || product.physical_location.trim() === '') {
    alerts.push({ icon: '📍', message: 'Sin ubicación', color: 'text-gray-400' })
  }
  
  if (alerts.length === 0) {
    return <span className="text-gray-500 text-xs">-</span>
  }
  
  // Mostrar máximo 6 iconos, si hay más mostrar +X
  const visibleAlerts = alerts.slice(0, 6)
  const hiddenCount = alerts.length - 6
  
  return (
    <div 
      className="flex gap-1 items-center flex-wrap" 
      title={alerts.map(a => a.message).join(', ')}
    >
      {visibleAlerts.map((alert, i) => (
        <span key={i} className={`text-sm ${alert.color}`} title={alert.message}>
          {alert.icon}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs text-gray-500">+{hiddenCount}</span>
      )}
    </div>
  )
}
