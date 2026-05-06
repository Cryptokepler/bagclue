// Database types matching Supabase schema

export type ProductStatus = 'available' | 'preorder' | 'reserved' | 'sold' | 'hidden'
export type ProductCondition = 'new' | 'excellent' | 'very_good' | 'good' | 'used'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Product {
  id: string
  slug: string
  title: string
  brand: string
  model: string | null
  color: string | null
  origin: string | null
  material: string | null
  status: ProductStatus
  condition: ProductCondition
  condition_notes: string | null
  price: number | null
  currency: string
  category: string
  badge: string | null
  description: string | null
  is_published: boolean
  includes_box: boolean
  includes_dust_bag: boolean
  includes_papers: boolean
  included_accessories: string | null
  authenticity_verified: boolean
  stock?: number | null
  allow_layaway?: boolean | null
  layaway_deposit_percent?: number | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  position: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  tracking_token: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipping_status: string | null
  shipping_provider: string | null
  shipping_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product_snapshot: Record<string, any>
  created_at: string
}

// Frontend status mapping (legacy compatibility)
export type LegacyProductStatus = 'En inventario' | 'Pre-venta' | 'Apartada'

export function dbStatusToLegacy(status: ProductStatus): LegacyProductStatus {
  switch (status) {
    case 'available':
      return 'En inventario'
    case 'preorder':
      return 'Pre-venta'
    case 'reserved':
    case 'sold':
      return 'Apartada'
    case 'hidden':
      return 'Apartada' // Fallback
  }
}

export function legacyStatusToDb(status: LegacyProductStatus): ProductStatus {
  switch (status) {
    case 'En inventario':
      return 'available'
    case 'Pre-venta':
      return 'preorder'
    case 'Apartada':
      return 'reserved'
  }
}
