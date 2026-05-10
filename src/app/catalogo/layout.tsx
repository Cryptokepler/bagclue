// Force dynamic rendering - no cache de inventario
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
