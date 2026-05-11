'use client'

import { use } from 'react'
import ClientOnly from '@/components/ClientOnly'
import AdminLoading from '@/components/admin/AdminLoading'
import OrderDetailClient from './page.client'

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <ClientOnly fallback={<AdminLoading />}>
      <OrderDetailClient orderId={id} />
    </ClientOnly>
  )
}
