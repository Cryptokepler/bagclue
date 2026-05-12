interface Props {
  archivedAt: string | null | undefined
  className?: string
}

export default function ClienteArchivedBadge({ archivedAt, className = '' }: Props) {
  if (!archivedAt) return null

  return (
    <span className={`inline-block px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs ${className}`}>
      📦 Archivado
    </span>
  )
}
