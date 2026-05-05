// src/components/admin/ProductBadges.tsx
// Badges para status, publicación, categoría y autenticidad

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    available: { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-400' },
    preorder: { label: 'Pre-orden', color: 'bg-blue-500/20 text-blue-400' },
    reserved: { label: 'Reservado', color: 'bg-yellow-500/20 text-yellow-400' },
    sold: { label: 'Vendido', color: 'bg-red-500/20 text-red-400' }
  }
  
  const { label, color } = config[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' }
  
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded ${color}`}>
      {label}
    </span>
  )
}

export function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return isPublished ? (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">
      <span>✓</span>
      <span>Publicado</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
      <span>📝</span>
      <span>Borrador</span>
    </span>
  )
}

export function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">
        <span>📦</span>
        <span>Sin categoría</span>
      </span>
    )
  }
  
  const config: Record<string, { label: string; icon: string }> = {
    bolsa: { label: 'Bolsa', icon: '👜' },
    cinturón: { label: 'Cinturón', icon: '🔗' },
    zapato: { label: 'Zapato', icon: '👠' },
    joyería: { label: 'Joyería', icon: '💎' }
  }
  
  const { label, icon } = config[category.toLowerCase()] || { label: category, icon: '📦' }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#FF69B4]/20 text-[#FF69B4]">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export function AuthenticityIcon({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="text-emerald-400 text-lg" title="Autenticidad verificada">✓</span>
  ) : (
    <span className="text-gray-500 text-lg" title="No verificado">✗</span>
  )
}
