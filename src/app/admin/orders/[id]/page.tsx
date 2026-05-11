import OrderDetailClient from './page.client'

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <OrderDetailClient orderId={id} />
}
