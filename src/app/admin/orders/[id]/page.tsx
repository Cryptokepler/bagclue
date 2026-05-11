'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const OrderDetailClient = dynamic(() => import('./page.client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>
  )
})

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return <OrderDetailClient orderId={id} />
}
