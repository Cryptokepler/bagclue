# FASE USER SHIPPING — CONFIRMACIÓN DE DIRECCIÓN DE ENVÍO (SCOPE)

**Fecha:** 2026-05-03  
**Estado:** SCOPE - NO IMPLEMENTAR TODAVÍA  
**Fase anterior:** Fase 5F (Dashboard Cliente) + Ajuste UX Envío ✅ CERRADAS

---

## OBJETIVO

Permitir que el cliente confirme o complete la dirección de envío de sus pedidos pagados desde su panel de cuenta, sin tocar el checkout ni el admin.

**Flujo esperado:**
1. Cliente ve sus pedidos en /account/orders
2. Si falta dirección → badge "Dirección pendiente"
3. Entra al detalle /account/orders/[id]
4. Si pedido pagado sin dirección → sección "Confirma tu dirección de envío"
5. Cliente selecciona dirección guardada o crea nueva
6. Al confirmar → se guarda en orders.shipping_address + customer_phone
7. Si pedido ya enviado/entregado → NO permitir cambiar dirección

---

## 1. ESTADO ACTUAL - QUÉ YA EXISTE

### A. Tablas de Base de Datos

#### Table: `orders`
```sql
id UUID PRIMARY KEY
user_id UUID (foreign key to auth.users, nullable)
customer_name TEXT NOT NULL
customer_email TEXT NOT NULL
customer_phone TEXT (nullable) ← ACTUALIZABLE POR USUARIO
customer_address TEXT (nullable, legacy)
shipping_address TEXT (nullable) ← ACTUALIZABLE POR USUARIO
shipping_status TEXT (nullable) ← SOLO ADMIN
shipping_provider TEXT (nullable) ← SOLO ADMIN
tracking_number TEXT (nullable) ← SOLO ADMIN
tracking_url TEXT (nullable) ← SOLO ADMIN
tracking_token TEXT (nullable) ← SOLO ADMIN
subtotal NUMERIC NOT NULL
shipping NUMERIC NOT NULL
total NUMERIC NOT NULL
status TEXT NOT NULL (pending|confirmed|shipped|delivered|cancelled)
payment_status TEXT NOT NULL (pending|paid|failed|refunded)
stripe_session_id TEXT
stripe_payment_intent_id TEXT
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**RLS Policies (migration 017):**
- ✅ Service role: full access (FOR ALL)
- ✅ Authenticated: SELECT only (view own orders by user_id or customer_email)
- ❌ Authenticated: NO UPDATE policy
- ❌ Public: NO access

**Conclusión:** Customer NO puede actualizar directamente con supabaseCustomer.

#### Table: `customer_addresses`
```sql
id UUID PRIMARY KEY
user_id UUID (foreign key to auth.users)
full_name TEXT NOT NULL
phone_country_code TEXT (nullable)
phone_country_iso TEXT (nullable)
phone TEXT (nullable)
country TEXT NOT NULL
state TEXT (nullable)
city TEXT NOT NULL
postal_code TEXT (nullable)
address_line1 TEXT NOT NULL
address_line2 TEXT (nullable)
delivery_references TEXT (nullable)
is_default BOOLEAN NOT NULL DEFAULT false
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**RLS Policies (migration 024):**
- ✅ Authenticated: SELECT, INSERT, UPDATE, DELETE on own addresses (by user_id)

---

### B. Endpoints API Existentes

#### GET /api/account/orders (no existe, se hace con supabaseCustomer)
- Frontend usa directamente `supabaseCustomer.from('orders').select(...)`
- RLS filtra por user_id

#### PUT /api/orders/[id]/shipping (ADMIN ONLY)
**Ubicación:** `src/app/api/orders/[id]/shipping/route.ts`  
**Uso:** Admin actualiza shipping_address, shipping_status, tracking, etc.  
**Autenticación:** Usa `supabaseAdmin` (bypasses RLS)  
**Campos actualizables:**
- customer_phone
- shipping_address
- shipping_status ← SOLO ADMIN
- shipping_provider ← SOLO ADMIN
- tracking_number ← SOLO ADMIN
- tracking_url ← SOLO ADMIN
- notes

**❌ NO puede ser usado por customer (no tiene auth check, usa service_role)**

#### GET /api/account/addresses (existe)
#### POST /api/account/addresses (existe)
#### PATCH /api/account/addresses/[id] (existe)
#### DELETE /api/account/addresses/[id] (existe)

---

### C. Rutas Frontend Existentes

#### /account/orders (lista de pedidos)
**Ubicación:** `src/app/account/orders/page.tsx`  
**Funcionalidad actual:**
- Lista pedidos del usuario (RLS por user_id)
- Muestra: payment_status, shipping_status, tracking_number
- Badges: Pagado, Enviado, etc.
- NO muestra si falta dirección

#### /account/orders/[id] (detalle de pedido)
**Ubicación:** `src/app/account/orders/[id]/page.tsx`  
**Funcionalidad actual:**
- Muestra orden completa
- Estado de pago
- Estado de envío (nuevo, ajuste UX reciente)
- Timeline de progreso
- Productos
- Dirección de envío (si existe) ← READ-ONLY
- NO permite editar dirección

#### /account/addresses (gestión de direcciones)
**Ubicación:** `src/app/account/addresses/page.tsx`  
**Funcionalidad actual:**
- Listar direcciones guardadas
- Crear nueva dirección
- Editar dirección
- Eliminar dirección
- Marcar como principal

---

### D. Tipos TypeScript Existentes

#### Order (database.ts)
```typescript
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
```

#### Address (address.ts)
```typescript
export interface Address {
  id: string
  user_id: string
  full_name: string
  phone_country_code: string | null
  phone_country_iso: string | null
  phone: string | null
  country: string
  state: string | null
  city: string
  postal_code: string | null
  address_line1: string
  address_line2: string | null
  delivery_references: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}
```

---

### E. Formato Actual de shipping_address

**Tipo:** TEXT (string | null)  
**Formato:** Texto libre, multilínea  
**Ejemplo actual en DB:**
```
María González
Av. Reforma 123, Piso 5
Polanco, CDMX
11560
México
```

**Problema:** No está estructurado, dificulta validación y parsing.

**Propuesta:** Guardar como texto formateado desde Address estructurado.

---

## 2. QUÉ FALTA

### A. Backend - API Route

#### PATCH /api/account/orders/[id]/shipping-address
**Propósito:** Permitir al customer confirmar/actualizar dirección de envío  
**Método:** PATCH  
**Auth:** Bearer token (JWT del customer)  
**Body:**
```json
{
  "address_id": "uuid-de-customer_addresses" // obligatorio
}
```

**Lógica:**
1. Verificar autenticación (Bearer token → supabaseCustomer.auth.getUser())
2. Obtener orden por ID (SELECT con RLS → solo ve sus órdenes)
3. Validar que orden existe y pertenece al usuario
4. Validar que `payment_status = 'paid'` o `status = 'confirmed'`
5. Validar que `shipping_status != 'shipped'` y `!= 'delivered'` (no permitir cambiar si ya enviado)
6. Obtener dirección por `address_id` de `customer_addresses` (SELECT con RLS → solo ve sus direcciones)
7. Validar que dirección existe y pertenece al usuario
8. Formatear dirección a texto multilínea
9. Actualizar orden con `supabaseAdmin` (bypasses RLS):
   ```typescript
   {
     shipping_address: formattedAddress,
     customer_phone: `${address.phone_country_code} ${address.phone}` || null
   }
   ```
10. Retornar orden actualizada

**Validaciones:**
- ❌ Si `payment_status != 'paid'` → 400 "Orden no pagada"
- ❌ Si `shipping_status = 'shipped'` → 400 "Orden ya enviada, no se puede cambiar dirección"
- ❌ Si `shipping_status = 'delivered'` → 400 "Orden ya entregada, no se puede cambiar dirección"
- ❌ Si `address_id` no existe o no pertenece al usuario → 404 "Dirección no encontrada"
- ❌ Si orden no pertenece al usuario → 404 "Orden no encontrada"

**Seguridad:**
- ✅ JWT auth check
- ✅ RLS check en SELECT (orden + dirección)
- ✅ service_role solo para UPDATE (con validaciones previas)

---

### B. Frontend - UI Components

#### 1. Badge "Dirección pendiente" en /account/orders
**Condición:** `payment_status = 'paid'` AND `shipping_address IS NULL`  
**Ubicación:** Junto a badges de pago/envío  
**Estilo:** bg-yellow-100 text-yellow-700 border-yellow-200  
**Texto:** "⚠️ Dirección pendiente"

#### 2. Sección "Confirma tu dirección de envío" en /account/orders/[id]
**Condición:**  
- `payment_status = 'paid'` AND
- `shipping_address IS NULL` AND
- `shipping_status != 'shipped'` AND
- `shipping_status != 'delivered'`

**Contenido:**
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Confirma tu dirección de envío                   │
│                                                     │
│ Tu pedido está pagado. Para poder enviarlo,        │
│ necesitamos que confirmes tu dirección de envío.   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📍 Usar dirección principal                 │   │
│ │                                             │   │
│ │ María González                              │   │
│ │ Av. Reforma 123                             │   │
│ │ Polanco, CDMX, 11560                        │   │
│ │ +52 5512345678                              │   │
│ │                                             │   │
│ │ [Confirmar esta dirección]                  │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Elegir otra dirección] [Crear nueva dirección]    │
└─────────────────────────────────────────────────────┘
```

#### 3. Selector de dirección
**Condición:** Usuario hace click en "Elegir otra dirección"  
**Contenido:** Lista de todas las direcciones guardadas  
**Formato:**
```
┌─────────────────────────────────────────┐
│ Selecciona una dirección                │
│                                         │
│ ○ María González                        │
│   Av. Reforma 123, Polanco, CDMX       │
│   +52 5512345678                        │
│                                         │
│ ○ María González (Oficina)              │
│   Insurgentes Sur 789, Roma, CDMX      │
│   +52 5587654321                        │
│                                         │
│ [Confirmar selección]  [Cancelar]       │
└─────────────────────────────────────────┘
```

#### 4. Dirección confirmada (después de actualizar)
**Condición:** `shipping_address IS NOT NULL`  
**Contenido:**
```
┌─────────────────────────────────────────┐
│ Dirección de envío                      │
│                                         │
│ ✅ Dirección confirmada                 │
│                                         │
│ María González                          │
│ Av. Reforma 123                         │
│ Polanco, CDMX                           │
│ 11560                                   │
│ +52 5512345678                          │
│                                         │
│ [Si shipping_status = pending/preparing]│
│ [Cambiar dirección]                     │
│                                         │
│ [Si shipping_status = shipped/delivered]│
│ (sin botón, read-only)                  │
└─────────────────────────────────────────┘
```

---

## 3. FLUJO USUARIO PROPUESTO

### Flujo A: Usuario con dirección principal guardada

1. Usuario entra a /account/orders
2. Ve pedido con badge: `[Pagado]  [⚠️ Dirección pendiente]`
3. Click en pedido → /account/orders/[id]
4. Ve sección: "⚠️ Confirma tu dirección de envío"
5. Ve dirección principal pre-cargada
6. Click en [Confirmar esta dirección]
7. Se envía PATCH /api/account/orders/[id]/shipping-address con address_id
8. Orden actualizada → mensaje de éxito
9. Sección cambia a "✅ Dirección confirmada" (read-only si pending/preparing)
10. Badge en lista cambia a: `[Pagado]  [📦 Pendiente de envío]` (sin "Dirección pendiente")

### Flujo B: Usuario sin dirección guardada

1. Usuario entra a /account/orders
2. Ve pedido con badge: `[Pagado]  [⚠️ Dirección pendiente]`
3. Click en pedido → /account/orders/[id]
4. Ve sección: "⚠️ Confirma tu dirección de envío"
5. Ve mensaje: "No tienes direcciones guardadas"
6. Click en [Crear nueva dirección]
7. Redirige a /account/addresses?return=/account/orders/[id]
8. Usuario crea dirección
9. Redirige de vuelta a /account/orders/[id]
10. Ve dirección recién creada
11. Click en [Confirmar esta dirección]
12. Flujo continúa igual que Flujo A

### Flujo C: Usuario quiere cambiar dirección antes de envío

1. Usuario entra a /account/orders/[id]
2. Ve "✅ Dirección confirmada" con botón [Cambiar dirección]
3. Click en [Cambiar dirección]
4. Ve selector de direcciones (todas las guardadas)
5. Selecciona otra dirección
6. Click en [Confirmar selección]
7. Se envía PATCH /api/account/orders/[id]/shipping-address
8. Orden actualizada → mensaje de éxito
9. Dirección actualizada visible

### Flujo D: Pedido ya enviado/entregado

1. Usuario entra a /account/orders/[id]
2. shipping_status = 'shipped' o 'delivered'
3. Ve "Dirección de envío" (read-only, sin botón)
4. NO puede cambiar dirección

---

## 4. API PROPUESTA - DETALLE TÉCNICO

### PATCH /api/account/orders/[id]/shipping-address

**Archivo:** `src/app/api/account/orders/[id]/shipping-address/route.ts`

**Request:**
```typescript
PATCH /api/account/orders/[order-uuid]/shipping-address
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json
Body:
{
  "address_id": "uuid-de-customer_addresses"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "shipping_address": "María González\nAv. Reforma 123...",
    "customer_phone": "+52 5512345678",
    "shipping_status": "pending"
  }
}
```

**Response Errors:**
```json
// 401 Unauthorized
{ "error": "Unauthorized" }

// 404 Not Found (orden no existe o no pertenece al usuario)
{ "error": "Order not found" }

// 404 Not Found (dirección no existe o no pertenece al usuario)
{ "error": "Address not found" }

// 400 Bad Request (orden no pagada)
{ "error": "Order not paid yet" }

// 400 Bad Request (orden ya enviada)
{ "error": "Cannot update address after order has been shipped" }

// 400 Bad Request (orden ya entregada)
{ "error": "Cannot update address after order has been delivered" }

// 400 Bad Request (address_id faltante)
{ "error": "address_id is required" }
```

**Pseudo-código:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseCustomer } from '@/lib/supabase-customer'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabaseCustomer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse params + body
    const { id: orderId } = await params
    const { address_id } = await request.json()

    if (!address_id) {
      return NextResponse.json({ error: 'address_id is required' }, { status: 400 })
    }

    // 3. Get order (RLS filters by user_id)
    const { data: order, error: orderError } = await supabaseCustomer
      .from('orders')
      .select('id, payment_status, shipping_status, shipping_address, customer_phone')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 4. Validate payment status
    if (order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Order not paid yet' }, { status: 400 })
    }

    // 5. Validate shipping status (no permitir si ya enviado/entregado)
    if (order.shipping_status === 'shipped') {
      return NextResponse.json({ 
        error: 'Cannot update address after order has been shipped' 
      }, { status: 400 })
    }

    if (order.shipping_status === 'delivered') {
      return NextResponse.json({ 
        error: 'Cannot update address after order has been delivered' 
      }, { status: 400 })
    }

    // 6. Get address (RLS filters by user_id)
    const { data: address, error: addressError } = await supabaseCustomer
      .from('customer_addresses')
      .select('*')
      .eq('id', address_id)
      .single()

    if (addressError || !address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // 7. Format address to text
    const formattedAddress = formatAddressToText(address)
    const formattedPhone = address.phone 
      ? `${address.phone_country_code || ''} ${address.phone}`.trim()
      : null

    // 8. Update order with supabaseAdmin (bypasses RLS)
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shipping_address: formattedAddress,
        customer_phone: formattedPhone,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('[UPDATE SHIPPING ADDRESS] Error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update shipping address' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('[UPDATE SHIPPING ADDRESS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function
function formatAddressToText(address: Address): string {
  const parts = [
    address.full_name,
    address.address_line1,
    address.address_line2,
    `${address.city}, ${address.state}`,
    address.postal_code,
    address.country
  ]
  
  return parts.filter(Boolean).join('\n')
}
```

---

## 5. CAMPOS EXACTOS A ACTUALIZAR

### Tabla `orders` - Campos actualizables por customer:

| Campo | Tipo | Actualizable por Customer | Origen |
|-------|------|---------------------------|--------|
| `shipping_address` | TEXT | ✅ SÍ (via API) | Dirección seleccionada de customer_addresses |
| `customer_phone` | TEXT | ✅ SÍ (via API) | Teléfono de la dirección seleccionada |
| `shipping_status` | TEXT | ❌ NO (solo admin) | - |
| `shipping_provider` | TEXT | ❌ NO (solo admin) | - |
| `tracking_number` | TEXT | ❌ NO (solo admin) | - |
| `tracking_url` | TEXT | ❌ NO (solo admin) | - |
| `tracking_token` | TEXT | ❌ NO (solo admin) | - |
| `customer_name` | TEXT | ❌ NO (heredado de checkout) | - |
| `customer_email` | TEXT | ❌ NO (heredado de checkout) | - |
| `status` | TEXT | ❌ NO (solo admin/webhook) | - |
| `payment_status` | TEXT | ❌ NO (solo webhook) | - |

**Resumen:** Solo `shipping_address` y `customer_phone` son actualizables por customer, y solo si la orden está pagada y no ha sido enviada.

---

## 6. REGLAS DE SEGURIDAD

### A. Autenticación
- ✅ Usuario debe estar autenticado (JWT válido)
- ✅ Usar `supabaseCustomer.auth.getUser()` para verificar

### B. Autorización
- ✅ Usuario solo puede actualizar sus propias órdenes (RLS policy)
- ✅ Usuario solo puede seleccionar sus propias direcciones (RLS policy)
- ✅ Orden debe tener `user_id = auth.uid()` o `customer_email IN (SELECT email FROM customer_profiles WHERE user_id = auth.uid())`

### C. Validaciones de Estado
- ✅ Orden debe estar pagada: `payment_status = 'paid'` o `status = 'confirmed'`
- ✅ Orden NO debe estar enviada: `shipping_status != 'shipped'`
- ✅ Orden NO debe estar entregada: `shipping_status != 'delivered'`
- ✅ Dirección debe existir y pertenecer al usuario

### D. Validaciones de Datos
- ✅ `address_id` es obligatorio
- ✅ `address_id` debe ser UUID válido
- ✅ Dirección debe tener campos mínimos: full_name, address_line1, city, country

### E. Protecciones
- ❌ Customer NO puede cambiar shipping_status, shipping_provider, tracking
- ❌ Customer NO puede actualizar órdenes de otros usuarios
- ❌ Customer NO puede actualizar órdenes canceladas
- ❌ Customer NO puede eliminar shipping_address una vez confirmada (solo cambiar)

---

## 7. UI PROPUESTA - MOCKUPS

### A. Lista de Pedidos - /account/orders

**Antes:**
```
#abc12345  [Pagado]  [📦 Pendiente de envío]
15 de abril de 2026
```

**Después (sin dirección):**
```
#abc12345  [Pagado]  [⚠️ Dirección pendiente]
15 de abril de 2026
```

**Después (con dirección confirmada):**
```
#abc12345  [Pagado]  [📦 Pendiente de envío]
15 de abril de 2026
```

---

### B. Detalle de Pedido - /account/orders/[id] - Sin Dirección

```
┌─────────────────────────────────────────────────────────┐
│ Pedido #abc12345                                        │
│ Realizado el 15 de abril de 2026, 10:30                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ✓ Pedido confirmado                                     │
│ Tu pedido ha sido confirmado                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Estado del pago                                         │
│ ✓ Pagado                                                │
│ Pago procesado correctamente                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚠️ Confirma tu dirección de envío                       │
│                                                         │
│ Tu pedido está pagado. Para poder enviarlo,            │
│ necesitamos que confirmes tu dirección de envío.       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📍 Usar dirección principal                     │   │
│ │                                                 │   │
│ │ María González                                  │   │
│ │ Av. Reforma 123                                 │   │
│ │ Polanco, CDMX, 11560                            │   │
│ │ +52 5512345678                                  │   │
│ │                                                 │   │
│ │ [Confirmar esta dirección]                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Elegir otra dirección]  [Crear nueva dirección]       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Estado de envío                                         │
│ 📦 Pendiente de envío                                   │
│ Confirma tu dirección para que podamos procesar el envío│
└─────────────────────────────────────────────────────────┘
```

---

### C. Detalle de Pedido - Dirección Confirmada (Pending/Preparing)

```
┌─────────────────────────────────────────────────────────┐
│ Dirección de envío                                      │
│                                                         │
│ ✅ Dirección confirmada                                 │
│                                                         │
│ María González                                          │
│ Av. Reforma 123                                         │
│ Polanco, CDMX                                           │
│ 11560                                                   │
│ México                                                  │
│                                                         │
│ Teléfono: +52 5512345678                                │
│                                                         │
│ [Cambiar dirección]                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Estado de envío                                         │
│ 📦 Preparando pieza                                     │
│ Estamos preparando tu pieza para envío                  │
└─────────────────────────────────────────────────────────┘
```

---

### D. Detalle de Pedido - Dirección Confirmada (Shipped/Delivered)

```
┌─────────────────────────────────────────────────────────┐
│ Dirección de envío                                      │
│                                                         │
│ María González                                          │
│ Av. Reforma 123                                         │
│ Polanco, CDMX                                           │
│ 11560                                                   │
│ México                                                  │
│                                                         │
│ Teléfono: +52 5512345678                                │
│                                                         │
│ (sin botón, read-only)                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Estado de envío                                         │
│ 🚚 Enviado                                              │
│ Tu pedido está en camino                                │
│                                                         │
│ Paquetería: DHL Express                                 │
│ Rastreo: ABC123456789                                   │
│                                                         │
│ [Ver seguimiento completo]  [Rastrear en DHL →]         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. ESTADOS DE ENVÍO DESDE VISTA USUARIO

### Matriz de Estados vs Acciones Permitidas

| payment_status | shipping_status | shipping_address | Acción Permitida |
|----------------|-----------------|------------------|------------------|
| pending | pending | null | ❌ Esperar pago |
| paid | null | null | ✅ Confirmar dirección |
| paid | pending | null | ✅ Confirmar dirección |
| paid | preparing | null | ✅ Confirmar dirección |
| paid | pending | filled | ✅ Cambiar dirección |
| paid | preparing | filled | ✅ Cambiar dirección |
| paid | shipped | filled | ❌ Read-only |
| paid | delivered | filled | ❌ Read-only |
| cancelled | any | any | ❌ Read-only |

**Regla general:**
- ✅ Puede confirmar/cambiar dirección: `paid` + (`pending` o `preparing` o `null`) + no cancelado
- ❌ No puede cambiar: `shipped` o `delivered` o `cancelled`

---

## 9. QUÉ NO TOCAR

### ❌ Backend NO modificar:
- ❌ /api/checkout/** (checkout crea órdenes sin dirección, OK)
- ❌ /api/stripe/webhook (no toca shipping_address)
- ❌ /api/layaways/** (no relacionado)
- ❌ /api/products/** (no relacionado)
- ❌ /api/orders/[id]/shipping (admin route, mantener separado)

### ❌ Frontend NO modificar:
- ❌ /checkout (sigue sin pedir dirección)
- ❌ /admin/** (admin usa su propia ruta)
- ❌ /apartado (no relacionado)
- ❌ /cart (no relacionado)
- ❌ /catalogo (no relacionado)

### ❌ Base de datos NO modificar:
- ❌ DB schema (no agregar columnas nuevas)
- ❌ RLS policies de layaways, products, customer_profiles
- ❌ Triggers existentes

### ❌ Lógica de negocio NO modificar:
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Payment logic
- ❌ Stock management
- ❌ Order creation (checkout)
- ❌ Tracking público (sigue funcionando igual)

### ✅ SOLO modificar/crear:
1. Crear: `src/app/api/account/orders/[id]/shipping-address/route.ts`
2. Modificar: `src/app/account/orders/page.tsx` (badge dirección pendiente)
3. Modificar: `src/app/account/orders/[id]/page.tsx` (sección confirmar dirección)
4. Posible: Crear componente `src/components/customer/ShippingAddressSelector.tsx` si se requiere

---

## 10. SUBFASES RECOMENDADAS

### SUBFASE A: Backend API
**Alcance:** SOLO endpoint  
**Archivos:**
- Crear: `src/app/api/account/orders/[id]/shipping-address/route.ts`

**Validaciones:**
1. Build PASS
2. Endpoint responde correctamente
3. Auth check funciona
4. RLS filtra órdenes por user_id
5. RLS filtra direcciones por user_id
6. Validaciones de estado funcionan
7. Actualización de orden con supabaseAdmin funciona
8. Formato de dirección correcto

**Criterios de cierre:**
- ✅ PATCH funciona con address_id válido
- ✅ Retorna 401 si no autenticado
- ✅ Retorna 404 si orden/dirección no existe o no pertenece al usuario
- ✅ Retorna 400 si orden no pagada
- ✅ Retorna 400 si orden ya enviada/entregada
- ✅ shipping_address y customer_phone se actualizan correctamente
- ✅ Build PASS
- ✅ Deploy PASS

---

### SUBFASE B: UI Badge "Dirección pendiente"
**Alcance:** SOLO /account/orders (lista)  
**Archivos:**
- Modificar: `src/app/account/orders/page.tsx`

**Lógica:**
```typescript
function getAddressBadge(order: any) {
  if (order.payment_status === 'paid' && !order.shipping_address) {
    return {
      style: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      label: 'Dirección pendiente',
      icon: '⚠️'
    }
  }
  return null
}
```

**Validaciones:**
1. Badge aparece solo si `paid` y `shipping_address = null`
2. Badge NO aparece si dirección ya confirmada
3. Badge NO aparece si no pagado
4. Responsive funciona
5. No rompe lista de pedidos

**Criterios de cierre:**
- ✅ Badge visible en pedidos pagados sin dirección
- ✅ Badge no visible en otros casos
- ✅ Build PASS
- ✅ Deploy PASS
- ✅ Validación visual en producción

---

### SUBFASE C: UI Confirmar Dirección
**Alcance:** SOLO /account/orders/[id] - sección nueva  
**Archivos:**
- Modificar: `src/app/account/orders/[id]/page.tsx`
- Posible: Crear `src/components/customer/ShippingAddressSelector.tsx`

**Componentes:**
1. Sección "Confirma tu dirección de envío" (condicional)
2. Mostrar dirección principal pre-cargada
3. Botón "Confirmar esta dirección"
4. Botón "Elegir otra dirección"
5. Botón "Crear nueva dirección" → /account/addresses?return=...
6. Selector de direcciones (modal/accordion)
7. Loading states
8. Success message
9. Error handling

**Validaciones:**
1. Sección aparece solo si paid + sin dirección + no shipped/delivered
2. Fetch de direcciones funciona
3. Dirección principal se pre-selecciona
4. Confirmar envía PATCH correcto
5. Success actualiza UI sin reload completo (revalidate)
6. Error muestra mensaje claro
7. Redirect a /account/addresses funciona con return URL
8. Botón "Cambiar dirección" aparece solo si pending/preparing

**Criterios de cierre:**
- ✅ Usuario puede confirmar dirección principal
- ✅ Usuario puede elegir otra dirección
- ✅ Usuario puede crear nueva dirección (redirect)
- ✅ Success message visible
- ✅ UI actualizada después de confirmar
- ✅ Botón "Cambiar" funciona
- ✅ Read-only si shipped/delivered
- ✅ Build PASS
- ✅ Deploy PASS
- ✅ Validación visual en producción

---

## 11. RIESGOS IDENTIFICADOS

### Riesgo 1: Cliente cambia dirección después de enviado
**Descripción:** Usuario intenta cambiar dirección después de que admin marcó como shipped  
**Mitigación:**
- ✅ Validación backend: shipping_status != 'shipped' && != 'delivered'
- ✅ UI: botón "Cambiar" desaparece si shipped/delivered
- ✅ Frontend: validación adicional antes de enviar PATCH

**Severidad:** Media → **Mitigado**

---

### Riesgo 2: Dirección incompleta
**Descripción:** Usuario selecciona dirección sin campos obligatorios  
**Mitigación:**
- ✅ customer_addresses ya tiene validaciones en POST/PATCH
- ✅ Backend valida que dirección existe antes de formatear
- ✅ Formato de texto incluye filtro `parts.filter(Boolean)` para eliminar nulls

**Severidad:** Baja → **Mitigado**

---

### Riesgo 3: Pedido de otro usuario
**Descripción:** Usuario intenta actualizar dirección de orden que no le pertenece  
**Mitigación:**
- ✅ RLS policy en SELECT orders (solo ve sus órdenes)
- ✅ Si orden no existe en SELECT → 404
- ✅ Doble check en backend (RLS + validación explícita)

**Severidad:** Alta → **Mitigado con RLS**

---

### Riesgo 4: Order sin user_id pero email coincide
**Descripción:** Orden de guest checkout (sin user_id) pero customer_email coincide con cuenta creada después  
**Mitigación:**
- ✅ RLS policy actual ya cubre este caso:
  ```sql
  user_id = auth.uid()
  OR
  customer_email IN (
    SELECT email FROM customer_profiles WHERE user_id = auth.uid()
  )
  ```
- ✅ Usuario puede ver y actualizar esas órdenes

**Severidad:** Baja → **Ya cubierto**

---

### Riesgo 5: shipping_address en formato inconsistente
**Descripción:** Dirección guardada en checkout tiene formato diferente a la confirmada aquí  
**Mitigación:**
- ✅ Función `formatAddressToText()` estandariza el formato
- ✅ Siempre multilínea con campos separados
- ✅ Admin puede sobrescribir manualmente si necesario

**Severidad:** Baja → **Mitigado con formato estándar**

---

### Riesgo 6: Race condition (usuario confirma dirección mientras admin actualiza orden)
**Descripción:** Usuario y admin actualizan la misma orden simultáneamente  
**Mitigación:**
- ⚠️ Partial mitigation: updated_at timestamp
- ⚠️ No hay lock optimista
- ✅ Última escritura gana (acceptable para este caso)

**Severidad:** Muy Baja → **Aceptable**

---

### Riesgo 7: Usuario borra dirección después de confirmarla en orden
**Descripción:** shipping_address queda con texto de dirección borrada  
**Mitigación:**
- ✅ shipping_address es TEXT, no foreign key
- ✅ Información se preserva aunque usuario borre la dirección de customer_addresses
- ✅ Esto es correcto (snapshot de dirección al momento de confirmar)

**Severidad:** Baja → **No es problema, es feature**

---

## 12. CRITERIOS DE CIERRE - FASE COMPLETA

### Funcionales (8)
1. ✅ Cliente puede ver badge "Dirección pendiente" en pedidos pagados sin dirección
2. ✅ Cliente puede confirmar dirección principal desde detalle de pedido
3. ✅ Cliente puede elegir otra dirección guardada
4. ✅ Cliente puede crear nueva dirección y volver a confirmar
5. ✅ Cliente puede cambiar dirección si pedido pending/preparing
6. ✅ Cliente NO puede cambiar dirección si pedido shipped/delivered
7. ✅ Dirección confirmada se muestra correctamente
8. ✅ Teléfono se actualiza desde dirección seleccionada

### Técnicos (6)
9. ✅ Endpoint PATCH /api/account/orders/[id]/shipping-address funciona
10. ✅ Auth check y RLS protegen órdenes de otros usuarios
11. ✅ Validaciones de estado (paid, not shipped) funcionan
12. ✅ Formato de dirección consistente y legible
13. ✅ Build PASS (local + Vercel)
14. ✅ Deploy production Ready

### UX (4)
15. ✅ UI intuitiva para confirmar dirección
16. ✅ Success/error messages claros
17. ✅ Loading states implementados
18. ✅ Responsive mobile/tablet/desktop

### Seguridad (4)
19. ✅ Usuario solo actualiza sus propias órdenes
20. ✅ Usuario solo usa sus propias direcciones
21. ✅ No puede actualizar órdenes enviadas/entregadas
22. ✅ No toca campos admin (shipping_status, tracking, etc.)

### Validación Manual (6)
23. ✅ Test A: Confirmar dirección principal - PASS
24. ✅ Test B: Elegir otra dirección - PASS
25. ✅ Test C: Crear nueva dirección y confirmar - PASS
26. ✅ Test D: Cambiar dirección antes de envío - PASS
27. ✅ Test E: Pedido shipped/delivered read-only - PASS
28. ✅ Test F: Pedido no pagado no permite confirmar - PASS

**Total:** 28 criterios

---

## 13. ESTIMACIÓN

**Complejidad:** Media-Alta (backend + frontend + validaciones de estado)  
**Tiempo estimado:** 4-6 horas (dividido en 3 subfases)

**Desglose:**
- **Subfase A (Backend API):** 1.5-2h
  - Endpoint PATCH
  - Validaciones de estado
  - Tests de auth/RLS
  - Tests de validaciones

- **Subfase B (Badge lista):** 0.5h
  - Lógica de badge
  - Testing visual

- **Subfase C (UI confirmar dirección):** 2-3h
  - Sección confirmar dirección
  - Selector de direcciones
  - Loading/success/error states
  - Responsive
  - Testing completo (6 tests)

---

## 14. PRÓXIMOS PASOS

**Después de aprobar este scope:**

1. ⏸️ Jhonatan aprueba scope completo
2. ⏸️ Implementar Subfase A (Backend API)
3. ⏸️ Implementar Subfase B (Badge lista)
4. ⏸️ Implementar Subfase C (UI confirmar dirección)
5. ⏸️ Testing manual completo (6 tests)
6. ⏸️ Deploy production
7. ⏸️ Validación final por Jhonatan
8. ✅ Si todo PASS → **Fase USER SHIPPING CERRADA ✅**
9. ⏸️ Siguiente: Admin shipping (crear guías DHL/FedEx, marcar shipped, tracking)

---

**Estado actual:** ⏸️ Scope completado, esperando aprobación de Jhonatan para implementar

**NO implementaré nada hasta que apruebes el scope y des GO explícito.**
