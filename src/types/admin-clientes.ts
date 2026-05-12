/**
 * Types para Admin Clientes MVP.1
 */

export interface ClienteMetrics {
  total_customers: number
  customers_with_purchases: number
  pending_payments_count: number
  payments_under_review_count: number
  pending_address_count: number
  active_layaways_count: number
  total_sales_value: number
  total_balance_due: number
}

export interface Cliente {
  id: string
  type: 'registered' | 'guest' | 'hybrid'
  email: string
  name: string | null
  phone: string | null
  user_id: string | null
  total_orders: number
  total_spent: number
  total_layaways: number
  active_layaways: number
  pending_payments: number
  balance_due: number
  last_purchase_at: string | null
  customer_status: 'new' | 'active' | 'recurring' | 'inactive'
  has_pending_address: boolean
  has_payment_review: boolean
  has_active_layaway: boolean
  registered_at: string | null
  archived_at?: string | null
}

export interface ClienteProfile {
  user_id: string | null
  email: string
  name: string | null
  phone: string | null
  phone_country_code: string | null
  phone_country_iso: string | null
  registered_at: string | null
  welcome_email_sent_at: string | null
  first_purchase_at: string | null
  type: 'registered' | 'guest'
  internal_notes?: string | null
  archived_at?: string | null
}

export interface ClienteAddress {
  id: string
  user_id: string
  full_name: string
  phone_country_code: string
  phone_country_iso: string
  phone: string
  country: string
  state: string
  city: string
  postal_code: string
  address_line1: string
  address_line2: string | null
  delivery_references: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ClienteOrder {
  id: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  payment_status: string
  shipping_status: string
  created_at: string
  tracking_token: string | null
  tracking_number: string | null
  shipping_proof_url: string | null
  items: Array<{
    product_id: string
    product_title?: string
    product_brand?: string
    quantity: number
    price: number
  }>
}

export interface ClienteLayaway {
  id: string
  product_id: string
  product_title?: string
  product_brand?: string
  total_amount: number
  amount_paid: number
  amount_remaining: number
  status: string
  next_payment_due_date: string | null
  next_payment_amount: number | null
  created_at: string
  layaway_token: string
}

export interface ClientePaymentReview {
  id: string
  payment_type: string
  payment_method: string
  amount: number
  currency: string
  status: string
  proof_url: string | null
  proof_uploaded_at: string | null
  created_at: string
  order_id: string | null
  layaway_id: string | null
}

export interface ClienteStats {
  total_spent: number
  total_orders: number
  total_layaways: number
  balance_due: number
  payments_under_review: number
  last_purchase_at: string | null
}

export interface ClientesFilters {
  search?: string
  status?: 'all' | 'pending_payments' | 'payment_review' | 'confirmed_purchases' | 'pending_address' | 'recurring'
  orderBy?: 'recent' | 'total_spent' | 'balance_due' | 'last_purchase'
  page?: number
  limit?: number
}

export interface ClientesListResponse {
  clientes: Cliente[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ClienteDetailResponse {
  profile: ClienteProfile
  addresses: ClienteAddress[]
  stats: ClienteStats
  orders: ClienteOrder[]
  layaways: ClienteLayaway[]
  payment_reviews: ClientePaymentReview[]
}

// MVP.2 - Gestión operativa
export interface ClienteUpdate {
  name?: string | null
  phone?: string | null
  phone_country_code?: string | null
  phone_country_iso?: string | null
  internal_notes?: string | null
}

export interface ClienteDeleteValidation {
  can_delete: boolean
  has_orders: boolean
  has_layaways: boolean
  has_payments: boolean
  order_count?: number
  layaway_count?: number
}
