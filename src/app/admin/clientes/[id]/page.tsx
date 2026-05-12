import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/session'
import { getAdminClienteDetail } from '@/lib/admin/clientes'
import AdminNav from '@/components/admin/AdminNav'
import ClienteDetailClient from './ClienteDetailClient'

export default async function AdminClienteDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const { id } = await params
  const clienteDetail = await getAdminClienteDetail(id)

  if (!clienteDetail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl text-white mb-4">Cliente no encontrado</h1>
            <Link
              href="/admin/clientes"
              className="text-[#FF69B4] hover:text-[#FF69B4]/80"
            >
              Volver a clientes
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />
      <ClienteDetailClient clienteDetail={clienteDetail} />
    </div>
  )
}
