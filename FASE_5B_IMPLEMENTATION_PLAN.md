# Fase 5B - Mis Pedidos - Plan de Implementación
**Fecha:** 2026-05-01  
**Autorizado por:** Jhonatan  
**Alcance:** Solo /account/orders y /account/orders/[id]

---

## 📋 AUDITORÍA INICIAL

### Estructura actual de `orders`:

**Columnas confirmadas (de migración `add_order_tracking.sql`):**
```sql
-- Core
id
customer_name
customer_email
customer_phone
customer_address (legacy, texto libre)
subtotal
shipping
total
status (OrderStatus: pending|confirmed|shipped|delivered|cancelled)
payment_status (pending|paid|failed|refunded)
stripe_session_id
stripe_payment_intent_id
notes
created_at
updated_at

-- Tracking (agregados en Fase 4A)
shipping_address (texto libre, más reciente)
shipping_provider (dhl|fedex|null)
tracking_number
tracking_url
shipping_status (pending|preparing|shipped|delivered)
tracking_token (UUID sin guiones, único)
shipped_at
delivered_at
```

**❌ NO existe:** `user_id` (necesario agregar)

### Relación con productos:

**Tabla `order_items` existe:**
```typescript
interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product_snapshot: Record<string, any>
  created_at: string
}
```

**Relación:**
```
orders (1) ← (N) order_items (N) → (1) products
```

---

## 🔧 CAMBIOS NECESARIOS

### 1. Migración DB - Agregar `user_id`

**Archivo:** `supabase/migrations/016_add_user_id_to_orders.sql`

```sql
-- Migración: Vincular orders con customer_profiles
-- Fase 5B: Mis Pedidos

-- Agregar user_id a orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Comentario
COMMENT ON COLUMN orders.user_id IS 'Usuario autenticado que hizo el pedido (vinculado con customer_profiles)';

-- Intentar vincular órdenes existentes con usuarios por email
-- SOLO si el email coincide con un customer_profile existente
UPDATE orders o
SET user_id = cp.user_id
FROM customer_profiles cp
WHERE o.customer_email = cp.email
  AND o.user_id IS NULL
  AND cp.user_id IS NOT NULL;
```

**Razón:** Necesitamos vincular orders con usuarios autenticados. Guest checkout seguirá funcionando (user_id = null).

---

### 2. Row Level Security (RLS)

**Archivo:** `supabase/migrations/017_orders_rls_customer.sql`

```sql
-- RLS para que clientes vean solo sus propios pedidos

-- Habilitar RLS en orders (si no está)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Cliente puede ver sus pedidos por user_id o email
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (
  -- Si user_id coincide
  user_id = auth.uid()
  OR
  -- Si email coincide con el del usuario autenticado
  (
    customer_email IN (
      SELECT email FROM customer_profiles WHERE user_id = auth.uid()
    )
  )
);

-- Habilitar RLS en order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política: Cliente puede ver items de sus pedidos
CREATE POLICY "Customers can view own order items"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
    OR customer_email IN (
      SELECT email FROM customer_profiles WHERE user_id = auth.uid()
    )
  )
);

-- NO permitir INSERT/UPDATE/DELETE a clientes (solo SELECT)
-- Admin puede hacer todo desde backend con service role
```

**Seguridad:**
- Cliente solo ve pedidos donde `user_id` coincide
- O donde `customer_email` coincide con su perfil
- Esto cubre órdenes hechas como guest antes de crear cuenta

---

### 3. Actualizar TypeScript Types

**Archivo:** `src/types/database.ts`

Actualizar interfaz `Order`:

```typescript
export interface Order {
  id: string
  user_id: string | null // ✅ NUEVO
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null // Legacy
  
  // Pricing
  subtotal: number
  shipping: number
  total: number
  
  // Status
  status: OrderStatus
  payment_status: PaymentStatus
  
  // Stripe
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  
  // Tracking (Fase 4A) ✅ ACTUALIZAR
  shipping_address: string | null
  shipping_provider: string | null
  shipping_status: string | null
  tracking_number: string | null
  tracking_url: string | null
  tracking_token: string | null
  shipped_at: string | null
  delivered_at: string | null
  
  // Metadata
  notes: string | null
  created_at: string
  updated_at: string
}
```

---

### 4. Crear Componentes

#### a. Lista de pedidos

**Archivo:** `src/app/account/orders/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseCustomer } from '@/lib/supabase-customer'
import AccountLayout from '@/components/customer/AccountLayout'
import OrderCard from '@/components/customer/OrderCard'
import type { Order } from '@/types/database'

export default function OrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [userEmail, setUserEmail] = useState<string>()

  useEffect(() => {
    const loadOrders = async () => {
      // Auth check
      const { data: { user } } = await supabaseCustomer.auth.getUser()
      if (!user) {
        router.push('/account/login')
        return
      }
      setUserEmail(user.email)

      // Fetch orders (RLS filters automatically)
      const { data, error } = await supabaseCustomer
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Orders fetch error:', error)
      } else {
        setOrders(data || [])
      }

      setLoading(false)
    }

    loadOrders()
  }, [router])

  if (loading) {
    return (
      <AccountLayout userEmail={userEmail}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <div>
        <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Aún no tienes pedidos
            </p>
            <a
              href="/catalogo"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Ver catálogo
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
```

---

#### b. Card de pedido

**Archivo:** `src/components/customer/OrderCard.tsx`

```typescript
import Link from 'next/link'
import type { Order } from '@/types/database'

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold">
            ${order.total.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} MXN
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <PaymentStatusBadge status={order.payment_status} />
        <ShippingStatusBadge status={order.shipping_status || 'pending'} />
      </div>

      {order.tracking_number && (
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium">Rastreo:</span> {order.tracking_provider?.toUpperCase()} {order.tracking_number}
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href={`/account/orders/${order.id}`}
          className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Ver detalle
        </Link>

        {(order.tracking_token || order.tracking_url) && (
          <Link
            href={order.tracking_url || `/track/${order.tracking_token}`}
            target={order.tracking_url ? "_blank" : undefined}
            className="flex-1 text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Ver seguimiento
          </Link>
        )}
      </div>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config = {
    paid: { label: 'Pagado', class: 'bg-green-100 text-green-800' },
    pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Fallido', class: 'bg-red-100 text-red-800' },
    refunded: { label: 'Reembolsado', class: 'bg-gray-100 text-gray-800' },
  }

  const { label, class: className } = config[status as keyof typeof config] || config.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function ShippingStatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pendiente', class: 'bg-gray-100 text-gray-800' },
    preparing: { label: 'Preparando', class: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', class: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregado', class: 'bg-green-100 text-green-800' },
  }

  const { label, class: className } = config[status as keyof typeof config] || config.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      📦 {label}
    </span>
  )
}
```

---

#### c. Detalle de pedido

**Archivo:** `src/app/account/orders/[id]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabaseCustomer } from '@/lib/supabase-customer'
import AccountLayout from '@/components/customer/AccountLayout'
import OrderDetail from '@/components/customer/OrderDetail'
import type { Order } from '@/types/database'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [userEmail, setUserEmail] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      // Auth check
      const { data: { user } } = await supabaseCustomer.auth.getUser()
      if (!user) {
        router.push('/account/login')
        return
      }
      setUserEmail(user.email)

      // Fetch order (RLS checks ownership)
      const { data, error: fetchError } = await supabaseCustomer
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (fetchError || !data) {
        console.error('Order fetch error:', fetchError)
        setError('Pedido no encontrado o no tienes acceso')
      } else {
        setOrder(data)
      }

      setLoading(false)
    }

    loadOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <AccountLayout userEmail={userEmail}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </AccountLayout>
    )
  }

  if (error || !order) {
    return (
      <AccountLayout userEmail={userEmail}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error || 'Pedido no encontrado'}</p>
          <a
            href="/account/orders"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver a mis pedidos
          </a>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <OrderDetail order={order} />
    </AccountLayout>
  )
}
```

---

#### d. Componente de detalle

**Archivo:** `src/components/customer/OrderDetail.tsx`

```typescript
import Link from 'next/link'
import OrderTimeline from './OrderTimeline'
import type { Order } from '@/types/database'

interface OrderDetailProps {
  order: Order
}

export default function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block"
        >
          ← Volver a mis pedidos
        </Link>
        <h1 className="text-3xl font-bold">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-gray-600 mt-1">
          Realizado el {new Date(order.created_at).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Product Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4">Resumen del pedido</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${order.subtotal.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envío:</span>
              <span>${order.shipping.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-base">
              <span>Total:</span>
              <span>${order.total.toFixed(2)} MXN</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <PaymentStatusBadge status={order.payment_status} />
            <ShippingStatusBadge status={order.shipping_status || 'pending'} />
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4">Información de envío</h2>
          
          {order.shipping_address ? (
            <div className="text-sm space-y-1 mb-4">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-gray-600 whitespace-pre-line">
                {order.shipping_address}
              </p>
              {order.customer_phone && (
                <p className="text-gray-600">Tel: {order.customer_phone}</p>
              )}
            </div>
          ) : order.customer_address ? (
            <div className="text-sm space-y-1 mb-4">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-gray-600">{order.customer_address}</p>
              {order.customer_phone && (
                <p className="text-gray-600">Tel: {order.customer_phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Información de envío no disponible
            </p>
          )}

          {order.shipping_provider && (
            <p className="text-sm">
              <span className="text-gray-600">Paquetería:</span>{' '}
              <span className="font-medium">
                {order.shipping_provider.toUpperCase()}
              </span>
            </p>
          )}

          {order.tracking_number && (
            <p className="text-sm">
              <span className="text-gray-600">Guía:</span>{' '}
              <span className="font-medium">{order.tracking_number}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Seguimiento del pedido</h2>
        <OrderTimeline
          order={{
            created_at: order.created_at,
            shipping_status: order.shipping_status || 'pending',
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at,
            tracking_number: order.tracking_number
          }}
        />
      </div>

      {/* Tracking Buttons */}
      {(order.tracking_token || order.tracking_url) && (
        <div className="flex gap-4">
          <Link
            href={order.tracking_url || `/track/${order.tracking_token}`}
            target={order.tracking_url ? "_blank" : undefined}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Ver seguimiento detallado
          </Link>
        </div>
      )}
    </div>
  )
}

// Re-use badges from OrderCard
function PaymentStatusBadge({ status }: { status: string }) {
  const config = {
    paid: { label: 'Pagado', class: 'bg-green-100 text-green-800' },
    pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Fallido', class: 'bg-red-100 text-red-800' },
    refunded: { label: 'Reembolsado', class: 'bg-gray-100 text-gray-800' },
  }

  const { label, class: className } = config[status as keyof typeof config] || config.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function ShippingStatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pendiente', class: 'bg-gray-100 text-gray-800' },
    preparing: { label: 'Preparando', class: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', class: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregado', class: 'bg-green-100 text-green-800' },
  }

  const { label, class: className } = config[status as keyof typeof config] || config.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      📦 {label}
    </span>
  )
}
```

---

#### e. OrderTimeline ya existe

**Archivo:** `src/components/OrderTimeline.tsx` (ya existe, reutilizar)

No modificar, ya funciona.

---

## 🧪 TESTING CHECKLIST

### Pre-deploy:
- [ ] Migración 016 creada
- [ ] Migración 017 RLS creada
- [ ] Types actualizados
- [ ] Componentes creados
- [ ] Build local exitoso

### Post-deploy:
- [ ] /account/orders carga sin error
- [ ] Solo muestra pedidos del cliente logueado
- [ ] /account/orders/[id] muestra detalle correcto
- [ ] No se puede ver pedido de otro cliente (403/redirect)
- [ ] Botón "Ver seguimiento" abre tracking correcto
- [ ] Login/logout siguen funcionando
- [ ] /cart sigue funcionando
- [ ] /checkout sigue funcionando
- [ ] /checkout/success sigue funcionando
- [ ] /track/[token] público sigue funcionando
- [ ] /admin sigue funcionando

---

## 🚫 NO TOCAR

- ❌ Checkout flow
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Admin pages
- ❌ Layaways
- ❌ Product inventory
- ❌ Payment logic
- ❌ Guest checkout
- ❌ Public tracking

---

## 📝 ENTREGA FINAL

Documentar:
1. ✅ Archivos creados/modificados
2. ✅ Cambios en cada archivo
3. ✅ Migraciones aplicadas
4. ✅ Pruebas realizadas
5. ✅ PASS/FAIL por cada test
6. ✅ URLs de validación
7. ✅ Screenshots o descripción visual

---

**LISTO PARA IMPLEMENTAR** 🚀
