export interface EnviosOrder {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  total: number
  currency: string | null
  payment_status: 'paid' | 'pending' | 'refunded'
  status: string
  shipping_status: 'pending' | 'preparing' | 'shipped' | 'delivered' | null
  shipping_address: string | null
  shipping_provider: string | null
  tracking_number: string | null
  tracking_url: string | null
  tracking_token: string
  shipped_at: string | null
  delivered_at: string | null
  order_items: OrderItem[]
}

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product_snapshot: {
    title: string
    brand: string
    color?: string
    model?: string
  }
}

export interface EnviosStats {
  total: number
  pending_address: number
  pending_shipment: number
  preparing: number
  shipped: number
  delivered: number
}

export interface EnviosPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface EnviosResponse {
  orders: EnviosOrder[]
  stats: EnviosStats
  pagination: EnviosPagination
}

export type EnviosFilter = 'all' | 'pending_address' | 'pending_shipment' | 'preparing' | 'shipped' | 'delivered'
