# ADMIN FASE 1B.2 — UI /admin/envios (SCOPE DE IMPLEMENTACIÓN)

**Fecha:** 2026-05-04  
**Proyecto:** Bagclue Admin Panel  
**Subfase:** 1B.2 — Implementación UI /admin/envios  
**Estado:** PREPARADO — PENDIENTE AUTORIZACIÓN JHONATAN  
**Duración estimada:** 2-3 días

---

## CONTEXTO CRÍTICO

### Completado antes
- ✅ **FASE 1A:** Backend validations reforzadas (commit c57c9f4)
- ✅ **SUBFASE 1B.1:** API `GET /api/admin/envios` (commit 1919690)
  - Auth admin con iron session
  - 6 filtros: all, pending_address, pending_shipment, preparing, shipped, delivered
  - Search: customer_name, email, tracking_number, order_id
  - Stats: total + 5 categories
  - Pagination: limit (max 100), offset
  - 12/12 tests PASS en producción

### Esta subfase
- Crear UI `/admin/envios` que consuma el endpoint ya validado
- **NO MODIFICA** backend, checkout, Stripe, webhook, products, stock, DB, RLS
- **NO MODIFICA** `/admin/orders` (solo navega a él)
- **READ-ONLY:** Solo visualización + navegación

---

## 1. OBJETIVO

Crear página admin `/admin/envios` con:
- ✅ Tabs para filtrar por estado de envío (6 tabs)
- ✅ Stats header (contadores en tiempo real)
- ✅ Lista/tabla de órdenes con badges
- ✅ Search bar (con debounce)
- ✅ Paginación
- ✅ Navegación a detalle `/admin/orders/[id]`
- ✅ Acciones rápidas: copiar tracking, abrir tracking URL

---

## 2. ARCHIVOS A CREAR

### 2.1. Página principal

**Archivo:** `src/app/admin/envios/page.tsx`

**Tipo:** Client component (`'use client'`)

**Responsabilidades:**
- Auth check (redirect si no autenticado)
- Layout base (header + stats + tabs + lista)
- Orquestación de componentes

---

### 2.2. Componentes UI

#### `src/components/admin/envios/EnviosStats.tsx`
**Tipo:** Client component  
**Props:**
```typescript
interface EnviosStatsProps {
  stats: {
    total: number
    pending_address: number
    pending_shipment: number
    preparing: number
    shipped: number
    delivered: number
  }
  loading?: boolean
}
```
**Funcionalidad:**
- Muestra 6 cards con stats
- Indica estado activo (filtro actual)
- Skeleton loading state

---

#### `src/components/admin/envios/EnviosTabs.tsx`
**Tipo:** Client component  
**Props:**
```typescript
interface EnviosTabsProps {
  activeTab: 'all' | 'pending_address' | 'pending_shipment' | 'preparing' | 'shipped' | 'delivered'
  onTabChange: (tab: string) => void
  stats: { [key: string]: number }
}
```
**Funcionalidad:**
- 6 tabs navegables
- Badge con count en cada tab
- Highlight del tab activo
- Responsive (scroll horizontal en móvil)

---

#### `src/components/admin/envios/EnviosSearchBar.tsx`
**Tipo:** Client component  
**Props:**
```typescript
interface EnviosSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}
```
**Funcionalidad:**
- Input controlado
- Debounce 300ms
- Clear button
- Loading indicator

---

#### `src/components/admin/envios/EnviosTable.tsx`
**Tipo:** Client component  
**Props:**
```typescript
interface EnviosTableProps {
  orders: Order[]
  loading?: boolean
  onOrderClick: (orderId: string) => void
}
```
**Funcionalidad:**
- Tabla responsive (scroll horizontal en móvil)
- Badges para payment_status, shipping_status
- Badge dirección (✅/⚠️)
- Truncate largo de producto/dirección
- Copy tracking number button
- Open tracking URL button (si existe)
- Click en row → navega a `/admin/orders/[id]`
- Skeleton loading state

**Columnas:**
| Columna | Ancho | Descripción |
|---------|-------|-------------|
| Fecha | 120px | `DD/MM HH:mm` |
| Cliente | 180px | Nombre + email en tooltip |
| Producto | 200px | Resumen truncado a 40 chars |
| Total | 100px | `$XX,XXX MXN` |
| Dirección | 80px | Badge ✅ / ⚠️ |
| Envío | 120px | Badge status |
| Tracking | 160px | Número + copy + link |
| Acciones | 80px | Ver detalle |

---

#### `src/components/admin/envios/EnviosPagination.tsx`
**Tipo:** Client component  
**Props:**
```typescript
interface EnviosPaginationProps {
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  onPageChange: (newOffset: number) => void
}
```
**Funcionalidad:**
- Botones Anterior / Siguiente
- Muestra `Mostrando X-Y de Z`
- Deshabilitado cuando no hay más páginas

---

### 2.3. Types

**Archivo:** `src/types/admin-envios.ts`

```typescript
export interface EnviosOrder {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  total: number
  currency: string
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
```

---

## 3. ESTRUCTURA DE LA PÁGINA

### `page.tsx` estructura propuesta:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import EnviosStats from '@/components/admin/envios/EnviosStats'
import EnviosTabs from '@/components/admin/envios/EnviosTabs'
import EnviosSearchBar from '@/components/admin/envios/EnviosSearchBar'
import EnviosTable from '@/components/admin/envios/EnviosTable'
import EnviosPagination from '@/components/admin/envios/EnviosPagination'

export default function AdminEnviosPage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<EnviosFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<EnviosOrder[]>([])
  const [stats, setStats] = useState<EnviosStats | null>(null)
  const [pagination, setPagination] = useState<EnviosPagination | null>(null)
  const [offset, setOffset] = useState(0)
  
  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/admin/login')
      }
    }
    checkAuth()
  }, [])
  
  // Fetch data
  useEffect(() => {
    fetchOrders()
  }, [activeFilter, searchQuery, offset])
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        limit: '25',
        offset: offset.toString(),
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      const response = await fetch(`/api/admin/envios?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data: EnviosResponse = await response.json()
      setOrders(data.orders)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching orders:', error)
      // TODO: Toast error notification
    } finally {
      setLoading(false)
    }
  }
  
  const handleTabChange = (newTab: EnviosFilter) => {
    setActiveFilter(newTab)
    setOffset(0) // Reset pagination
  }
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setOffset(0) // Reset pagination
  }
  
  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }
  
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Gestión de Envíos</h1>
        </div>
      </div>
      
      {/* Stats */}
      {stats && <EnviosStats stats={stats} loading={loading} />}
      
      {/* Tabs */}
      {stats && (
        <EnviosTabs
          activeTab={activeFilter}
          onTabChange={handleTabChange}
          stats={stats}
        />
      )}
      
      {/* Search + Actions */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <EnviosSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar por cliente, email o tracking..."
        />
      </div>
      
      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EnviosTable
          orders={orders}
          loading={loading}
          onOrderClick={handleOrderClick}
        />
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <EnviosPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
```

---

## 4. INTEGRACIÓN CON API

### Endpoint: `GET /api/admin/envios`

**Headers requeridos:**
- Cookie: `bagclue_admin_session` (httpOnly, automático en browser)

**Query params:**
```typescript
{
  filter?: 'all' | 'pending_address' | 'pending_shipment' | 'preparing' | 'shipped' | 'delivered'
  search?: string
  limit?: number  // default 25, max 100
  offset?: number // default 0
}
```

**Response estructura:**
```json
{
  "orders": [...],
  "stats": {
    "total": 170,
    "pending_address": 3,
    "pending_shipment": 12,
    "preparing": 5,
    "shipped": 8,
    "delivered": 142
  },
  "pagination": {
    "total": 170,
    "limit": 25,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error handling:**
- 401: Redirect a `/admin/login`
- 500: Toast error message
- Network error: Retry con toast

---

## 5. BADGES Y ESTADOS

### Payment Status Badge

| Status | Color | Texto |
|--------|-------|-------|
| `paid` | Green | Pagado |
| `pending` | Yellow | Pendiente |
| `refunded` | Red | Reembolsado |

---

### Shipping Status Badge

| Status | Color | Texto |
|--------|-------|-------|
| `null` o `pending` | Gray | Pendiente |
| `preparing` | Blue | Preparando |
| `shipped` | Purple | Enviado |
| `delivered` | Green | Entregado |

---

### Dirección Badge

| Condición | Badge |
|-----------|-------|
| `shipping_address` NOT NULL | ✅ Confirmada (green) |
| `shipping_address` NULL | ⚠️ Pendiente (yellow) |

---

## 6. FORMATEO DE DATOS

### Fecha
```typescript
// created_at: "2026-05-04T10:30:00.000Z"
// Display: "04/05 10:30"
const formatDate = (isoString: string) => {
  const date = new Date(isoString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}
```

---

### Total
```typescript
// total: 45000, currency: "MXN"
// Display: "$45,000 MXN"
const formatTotal = (amount: number, currency: string) => {
  return `$${amount.toLocaleString('es-MX')} ${currency}`
}
```

---

### Producto Summary
```typescript
// order_items: [{ product_snapshot: { brand, title } }]
// Display: "Gucci Marmont, Chanel Boy Bag" (truncate si > 40 chars)
const formatProductSummary = (items: OrderItem[]) => {
  const summary = items
    .map(item => `${item.product_snapshot.brand} ${item.product_snapshot.title}`)
    .join(', ')
  
  return summary.length > 40 ? summary.slice(0, 37) + '...' : summary
}
```

---

### Tracking URL
```typescript
// Ya viene generado desde API
// Si existe: mostrar link button
// Si no existe: mostrar "-"
```

---

## 7. ACCIONES RÁPIDAS

### Copiar tracking number
**Trigger:** Click en botón copy  
**Acción:** `navigator.clipboard.writeText(tracking_number)`  
**Feedback:** Toast "Número de rastreo copiado"

---

### Abrir tracking URL
**Trigger:** Click en botón link  
**Acción:** `window.open(tracking_url, '_blank')`  
**Condición:** Solo si `tracking_url` existe

---

### Ver detalle orden
**Trigger:** Click en row de tabla  
**Acción:** `router.push(/admin/orders/${orderId})`

---

## 8. RESPONSIVE

### Desktop (>= 768px)
- Tabla completa con todas las columnas
- Stats en grid 3x2
- Tabs en row

---

### Mobile (< 768px)
- Tabla con scroll horizontal
- Stats en grid 2x3
- Tabs con scroll horizontal
- Columnas priorizadas: Fecha, Cliente, Total, Envío, Acciones

---

## 9. LOADING STATES

### Initial load
- Stats: Skeleton placeholders (6 cards)
- Table: Skeleton rows (5 rows)
- Tabs: Disabled

---

### Filter/Search change
- Table: Skeleton rows
- Pagination: Disabled
- Stats: Mantener valores anteriores (no skeleton)

---

### Page change
- Table: Skeleton rows
- Search/Tabs: Disabled

---

## 10. DEBOUNCE SEARCH

**Implementación:**
```typescript
import { useEffect, useState } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// En SearchBar component:
const debouncedQuery = useDebounce(searchQuery, 300)

useEffect(() => {
  onChange(debouncedQuery)
}, [debouncedQuery])
```

---

## 11. NAVEGACIÓN

### Desde AdminNav (NO IMPLEMENTAR EN ESTA SUBFASE)
- Link a `/admin/envios` (pendiente SUBFASE 1B.3)

---

### Desde /admin/envios
- Click en orden → `/admin/orders/[id]`
- NO hay breadcrumbs (pendiente diseño futuro)

---

## 12. EXCLUSIONES CRÍTICAS

### ❌ NO IMPLEMENTAR EN ESTA SUBFASE

- ❌ Link en `AdminNav` (pendiente SUBFASE 1B.3)
- ❌ Modificar shipping_status desde esta vista (read-only)
- ❌ Botones "Marcar como enviado" (futuro)
- ❌ Formularios para agregar tracking (futuro)
- ❌ Export CSV/Excel (futuro)
- ❌ Filtros avanzados (rango de fechas, monto, etc.)
- ❌ Bulk actions (futuro)
- ❌ Confirmaciones/modales para cambiar estados (futuro)

---

### ✅ SÍ IMPLEMENTAR

- ✅ Listado readonly
- ✅ 6 tabs de filtros
- ✅ Stats header
- ✅ Search bar con debounce
- ✅ Pagination
- ✅ Badges visuales
- ✅ Copy tracking number
- ✅ Open tracking URL
- ✅ Navegación a detalle orden
- ✅ Loading states
- ✅ Auth check + redirect
- ✅ Responsive básico

---

## 13. TESTING

### Tests a ejecutar ANTES de deploy

#### TEST 1: Auth check
1. Sin sesión admin → debe redirigir a `/admin/login`
2. Con sesión admin → debe mostrar UI

---

#### TEST 2: Tabs navigation
1. Click en cada tab debe cambiar filtro
2. URL debe reflejar filtro activo (opcional)
3. Stats badge debe coincidir con resultados

---

#### TEST 3: Search
1. Escribir query → debounce 300ms antes de fetch
2. Resultados deben coincidir con búsqueda
3. Clear button debe limpiar search

---

#### TEST 4: Pagination
1. Click "Siguiente" → debe mostrar siguientes 25
2. Click "Anterior" → debe mostrar anteriores 25
3. Botón deshabilitado cuando no hay más páginas

---

#### TEST 5: Order navigation
1. Click en row → debe navegar a `/admin/orders/[id]`
2. ID correcto en URL

---

#### TEST 6: Copy tracking
1. Click copy → debe copiar a clipboard
2. Toast confirmación

---

#### TEST 7: Open tracking URL
1. Click link → debe abrir en nueva tab
2. Solo si tracking_url existe

---

#### TEST 8: Loading states
1. Initial load → skeletons
2. Filter change → table skeleton
3. Search → table skeleton

---

#### TEST 9: Responsive
1. Desktop → tabla completa
2. Mobile → scroll horizontal

---

#### TEST 10: Error handling
1. API error → toast error message
2. Network fail → retry con feedback

---

## 14. CRITERIOS DE CIERRE SUBFASE 1B.2

✅ Página `/admin/envios` funcional  
✅ 6 tabs implementados  
✅ Stats header con contadores  
✅ Search con debounce 300ms  
✅ Tabla con badges y formateo correcto  
✅ Pagination funcional  
✅ Copy tracking + Open tracking URL  
✅ Navegación a detalle orden  
✅ Auth check + redirect  
✅ Loading states (initial + transitions)  
✅ Responsive básico (desktop + mobile)  
✅ Build local PASS  
✅ Deploy production exitoso  
✅ 10 tests manuales PASS  
✅ NO se tocó backend/checkout/Stripe/webhook/products/stock/DB/RLS

---

## 15. PRÓXIMOS PASOS (FUERA DE ESTA SUBFASE)

### SUBFASE 1B.3 — Navegación (0.5d)
- Agregar link en `AdminNav`
- Breadcrumbs (opcional)

---

### SUBFASE 1B.4 — Tests adicionales (0.5d)
- Tests E2E con Playwright
- Tests de integración

---

### FASE 1C — Acciones de envío (FUTURO)
- Botones "Marcar como preparando/enviado/entregado"
- Formulario agregar tracking desde vista

---

## 16. COMMIT MESSAGE PROPUESTO

```
ADMIN FASE 1B.2 - UI /admin/envios

- Crear página /admin/envios (client component)
- Componentes: EnviosStats, EnviosTabs, EnviosSearchBar, EnviosTable, EnviosPagination
- Auth check con redirect a /admin/login
- 6 tabs: all, pending_address, pending_shipment, preparing, shipped, delivered
- Search con debounce 300ms
- Badges: payment_status, shipping_status, dirección
- Formateo: fecha (DD/MM HH:mm), total ($XX,XXX MXN), producto summary
- Acciones: copiar tracking, abrir tracking URL, navegar a detalle
- Pagination: limit 25, botones anterior/siguiente
- Loading states: skeleton en stats + tabla
- Responsive: desktop tabla completa, mobile scroll horizontal
- Build PASS
- NO toca backend/checkout/Stripe/webhook/products/stock/DB/RLS
- NO modifica AdminNav (pendiente SUBFASE 1B.3)
```

---

## 17. ESTIMACIÓN DETALLADA

| Tarea | Duración |
|-------|----------|
| Setup types + structure | 2h |
| EnviosStats component | 3h |
| EnviosTabs component | 2h |
| EnviosSearchBar component | 2h |
| EnviosTable component | 6h |
| EnviosPagination component | 2h |
| page.tsx integration | 4h |
| Formateo + utilities | 2h |
| Responsive adjustments | 3h |
| Loading states | 2h |
| Error handling | 2h |
| Testing manual | 4h |
| Build + deploy | 1h |
| **TOTAL** | **35h (2-3 días)** |

---

## 18. RIESGOS Y MITIGACIONES

### RIESGO 1: Auth check en client component puede causar flash
**Mitigación:** Mostrar loading spinner hasta que se resuelva auth check

---

### RIESGO 2: Debounce puede confundir (escribir rápido pero search lenta)
**Mitigación:** Loading indicator en search bar mientras debounce activo

---

### RIESGO 3: Tabla muy ancha puede romper layout en mobile
**Mitigación:** Scroll horizontal + priorizar columnas clave

---

### RIESGO 4: Stats pueden desincronizarse con tabla si user hace cambios en paralelo
**Mitigación:** No es problema — stats se actualizan en cada fetch

---

## 19. DEPENDENCIAS

### Librerías necesarias (ya instaladas):
- ✅ React 19
- ✅ Next.js 16
- ✅ Tailwind CSS
- ✅ iron-session (auth)

### Nuevas (si se requieren):
- `react-hot-toast` (opcional, para notifications)

---

## 20. APROBACIÓN REQUERIDA

**Antes de implementar, Jhonatan debe aprobar explícitamente:**
1. ✅ Estructura de componentes propuesta
2. ✅ Flujo de navegación
3. ✅ Diseño visual de badges y stats
4. ✅ Exclusión de acciones de modificación (read-only)
5. ✅ Diferimiento de link en AdminNav a SUBFASE 1B.3

---

**FIN DE SCOPE ADMIN FASE 1B.2**
