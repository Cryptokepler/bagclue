# SUBFASE C — UI Confirmar/Cambiar Dirección en Detalle de Pedido

**Fecha:** 2026-05-04  
**Commit:** 7a26c91  
**Deploy:** https://bagclue.vercel.app

---

## 1. Archivos Modificados/Creados

### Archivos Creados (1):
```
src/components/customer/ShippingAddressSection.tsx  (331 líneas)
```

### Archivos Modificados (1):
```
src/app/account/orders/[id]/page.tsx  (+2 import, -6 líneas viejas, +1 componente)
```

**Total archivos tocados:** 2  
**Total líneas nuevas:** 331 (componente) + 3 (integración) = 334 líneas  
**Archivos documentación:** 5 (TEST_SUBFASE_A.md, SUBFASE_A_*, SUBFASE_B_*, script test)

---

## 2. Qué Cambió

### A. Nuevo Componente: `ShippingAddressSection.tsx`

**Tipo:** Client Component ('use client')

**Props:**
- `order: any` — objeto de pedido completo
- `onAddressUpdated?: () => void` — callback opcional post-actualización

**Estado interno:**
- `addresses: Address[]` — direcciones guardadas del usuario
- `selectedAddressId: string` — dirección seleccionada
- `loading: boolean` — cargando direcciones
- `submitting: boolean` — enviando PATCH
- `editing: boolean` — modo edición activo
- `error: string` — mensaje de error
- `success: string` — mensaje de éxito
- `currentShippingAddress: string` — dirección confirmada actual

**Lógica de Permisos:**
```typescript
const canEditAddress = order.payment_status === 'paid' && 
  (order.shipping_status === 'pending' || 
   order.shipping_status === 'preparing' || 
   !order.shipping_status)

const isShipped = order.shipping_status === 'shipped' || 
                  order.shipping_status === 'delivered'
```

**Flujo Condicional:**

#### 1. Si `payment_status != 'paid'`:
```
┌─────────────────────────────────────┐
│ Dirección de envío                  │
├─────────────────────────────────────┤
│ ⚠️ La dirección de envío se podrá   │
│ confirmar cuando el pago esté       │
│ aprobado.                           │
└─────────────────────────────────────┘
```

#### 2. Si `shipped/delivered` + tiene dirección:
```
┌─────────────────────────────────────┐
│ Dirección de envío                  │
├─────────────────────────────────────┤
│ [Dirección formateada]              │
│                                     │
│ ℹ️ No se puede modificar una vez    │
│ enviado.                            │
└─────────────────────────────────────┘
```

#### 3. Si tiene dirección + puede editar (pending/preparing):
```
┌─────────────────────────────────────┐
│ Dirección de envío    [Cambiar] ←   │
├─────────────────────────────────────┤
│ ✅ Dirección confirmada             │
│ [Dirección formateada]              │
└─────────────────────────────────────┘
```

Al hacer clic en "Cambiar" → modo edición (selector + botones)

#### 4. Si NO tiene dirección + puede editar:
```
┌─────────────────────────────────────┐
│ Confirma tu dirección de envío      │
├─────────────────────────────────────┤
│ ℹ️ Selecciona la dirección donde    │
│ quieres recibir tu pedido.          │
│                                     │
│ ○ [Dirección 1] [Principal]         │
│ ○ [Dirección 2]                     │
│                                     │
│ [Confirmar esta dirección]          │
│ [Gestionar direcciones]             │
└─────────────────────────────────────┘
```

#### 5. Si NO hay direcciones guardadas:
```
┌─────────────────────────────────────┐
│ Dirección de envío                  │
├─────────────────────────────────────┤
│ ⚠️ No tienes direcciones guardadas. │
│ Agrega una dirección para confirmar │
│ el envío.                           │
│                                     │
│ [Agregar dirección] →               │
└─────────────────────────────────────┘
```

**Funciones Clave:**

1. **`loadAddresses()`**
   - Fetch de `customer_addresses` vía Supabase
   - Ordenado por `is_default DESC`, `created_at DESC`
   - Pre-selecciona dirección default si no hay confirmada

2. **`handleConfirmAddress()`**
   - Valida selección
   - Obtiene `access_token` vía `supabaseCustomer.auth.getSession()`
   - Llama `PATCH /api/account/orders/[id]/shipping-address`
   - Maneja errores (401 → redirect login, 400/403/404 → mensaje error)
   - Success → actualiza estado local + refresca página en 1s

3. **`formatAddress(addr)`**
   - Formatea dirección en texto multilínea
   - Incluye: nombre, calle, apt, ciudad/estado/CP, país, teléfono

**UX Features:**
- ✅ Loading states ("Cargando direcciones...", "Confirmando...")
- ✅ Error handling con mensajes amigables
- ✅ Success feedback ("Dirección de envío actualizada correctamente")
- ✅ Radio buttons para selección
- ✅ Badge "Principal" en dirección default
- ✅ Botones: "Confirmar esta dirección" / "Cambiar dirección" / "Gestionar direcciones"
- ✅ Link a `/account/addresses`
- ✅ Auto-refresh post-confirmación

**Seguridad:**
- ✅ Token NO se imprime (solo se usa en headers)
- ✅ Authorization Bearer
- ✅ 401 → redirect a login
- ✅ RLS policies protegen endpoint

---

### B. Integración en Detalle de Pedido

**Archivo:** `src/app/account/orders/[id]/page.tsx`

**Cambios:**

1. **Import agregado:**
```typescript
import ShippingAddressSection from '@/components/customer/ShippingAddressSection'
```

2. **Sección reemplazada:**
```diff
- {/* Shipping Address */}
- {order.shipping_address && (
-   <div className="bg-white border border-gray-200 rounded-lg p-6">
-     <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
-     <p className="text-gray-900 whitespace-pre-line">{order.shipping_address}</p>
-   </div>
- )}

+ {/* Shipping Address */}
+ <ShippingAddressSection order={order} />
```

**Ventaja:** Componente cliente renderizado dentro de server component, mantiene SSR para carga inicial y permite interactividad para gestión de dirección.

---

## 3. Build Result

### Local Build
```
✓ Compiled successfully in 5.6s
✓ Generating static pages using 3 workers (36/36) in 305.9ms
```

### Vercel Build
```
✓ Compiled successfully in 6.3s
✓ Generating static pages using 3 workers (36/36) in 372.5ms
Build Completed in /vercel/output [17s]
```

**Status:** ✅ PASS (sin errores, sin warnings de TypeScript)

---

## 4. Commit

```
Hash: 7a26c91
Message: feat(account): SUBFASE C - UI confirmar/cambiar dirección en detalle de pedido
Author: KeplerAgents <info@kepleragents.com>
Files: 7 files changed, 1603 insertions(+)
  - src/components/customer/ShippingAddressSection.tsx (nuevo)
  - src/app/account/orders/[id]/page.tsx (modificado)
  - SUBFASE_A_*, SUBFASE_B_*, TEST_*, scripts/* (docs)
```

---

## 5. Deploy URL

✅ **https://bagclue.vercel.app**

**Preview:** https://bagclue-l7htsizbz-kepleragents.vercel.app  
**Inspect:** https://vercel.com/kepleragents/bagclue/Guo3QtR1xuf3jFdC7ucx1bHxNNJV

**Deploy Time:** 35s total (build 17s + deploy 18s)

---

## 6. Criterios de Validación (PENDIENTE)

### Testing Requerido:

| # | Criterio | Status | URL Test |
|---|----------|--------|----------|
| 1 | Build PASS | ✅ | Local + Vercel |
| 2 | Deploy production | ✅ | bagclue.vercel.app |
| 3 | Pedido sin dirección muestra "Confirma tu dirección de envío" | ⏸️ | /account/orders/[id sin dirección] |
| 4 | Pedido con dirección muestra "Dirección confirmada" | ⏸️ | /account/orders/ded47354... |
| 5 | Pedido pending/preparing permite cambiar dirección | ⏸️ | /account/orders/[id pending] |
| 6 | Pedido shipped/delivered no permite cambiar dirección | ⏸️ | /account/orders/[id shipped] |
| 7 | Si no hay direcciones, muestra link a /account/addresses | ⏸️ | (crear usuario sin direcciones) |
| 8 | Confirmar dirección llama endpoint y actualiza shipping_address | ⏸️ | DevTools Network |
| 9 | Después de confirmar, detalle muestra la nueva dirección | ⏸️ | Post-confirmación |
| 10 | /account/orders sigue mostrando badge actualizado | ⏸️ | Lista de pedidos |
| 11 | /account/orders sigue funcionando | ⏸️ | /account/orders |
| 12 | /account/addresses sigue funcionando | ⏸️ | /account/addresses |
| 13 | No hay errores críticos en consola | ⏸️ | DevTools Console |
| 14 | No se tocó checkout/Stripe/webhook/admin/DB/RLS | ✅ | Ver sección 7 |

**Criterios técnicos:** 3/3 PASS  
**Criterios funcionales:** 0/11 (pendientes validación Jhonatan)

---

## 7. Confirmación Áreas NO Tocadas

### ❌ NO se modificó:

- **Checkout:** 0 archivos modificados
  - ✅ `/api/checkout/*` intacto
  - ✅ `/checkout/*` páginas intactas
  
- **Stripe:** 0 archivos modificados
  - ✅ `/api/stripe/webhook` intacto
  - ✅ Configuración de Stripe intacta
  
- **Webhook:** 0 archivos modificados
  - ✅ `/api/stripe/webhook` intacto
  
- **Admin:** 0 archivos modificados
  - ✅ `/admin/*` páginas intactas
  - ✅ `/api/admin/*` intacto
  
- **Database/RLS:** 0 archivos modificados
  - ✅ Sin migraciones nuevas
  - ✅ `supabase/migrations/` intacto
  - ✅ RLS policies no modificadas
  
- **Products/Stock:** 0 archivos modificados
  - ✅ `/api/products/*` intacto
  - ✅ Catálogo intacto
  
- **Payment Logic:** 0 archivos modificados
  - ✅ Checkout flow intacto
  - ✅ Stripe session creation intacto
  
- **Backend Endpoint:** 0 archivos modificados
  - ✅ `/api/account/orders/[id]/shipping-address/route.ts` intacto
  - ✅ SUBFASE A endpoint NO modificado

- **Lista de pedidos:** 0 archivos modificados (salvo SUBFASE B previa)
  - ✅ `/account/orders/page.tsx` NO tocado en SUBFASE C
  - ✅ SUBFASE B cambios preservados

### ✅ Modificado (SOLO UI):

```
src/components/customer/ShippingAddressSection.tsx  (NUEVO - 331 líneas)
src/app/account/orders/[id]/page.tsx                (3 líneas netas)
```

**Total archivos modificados:** 1  
**Total archivos creados:** 1  
**Áreas tocadas:** Solo UI de detalle de pedido  
**Áreas NO tocadas:** Backend, checkout, Stripe, webhook, admin, DB, RLS, migrations, products, stock, payment logic, endpoint PATCH

---

## 8. Flujo Completo de Usuario

### Escenario 1: Pedido Nuevo (Pagado, Sin Dirección)

1. Usuario completa pago → `payment_status = 'paid'`, `shipping_address = NULL`
2. Usuario va a `/account/orders` → ve badge "⚠️ Dirección pendiente"
3. Usuario hace clic en pedido → `/account/orders/[id]`
4. Ve sección: **"Confirma tu dirección de envío"**
5. Se cargan sus direcciones guardadas
6. Si hay dirección default → pre-seleccionada
7. Usuario hace clic "Confirmar esta dirección"
8. Loading state: "Confirmando..."
9. PATCH `/api/account/orders/[id]/shipping-address` con `address_id`
10. Success: "Dirección de envío actualizada correctamente"
11. Página se refresca en 1s
12. Ahora ve: **"✅ Dirección confirmada"** + dirección formateada
13. Si vuelve a `/account/orders` → badge cambia a "✅ Dirección confirmada"

### Escenario 2: Cambiar Dirección (Pedido Pending/Preparing)

1. Usuario tiene pedido con dirección confirmada, `shipping_status = 'pending'`
2. Va a `/account/orders/[id]`
3. Ve sección: **"Dirección de envío"** con botón "Cambiar dirección"
4. Hace clic en "Cambiar dirección"
5. Se muestra selector de direcciones
6. Selecciona otra dirección
7. Hace clic "Cambiar dirección"
8. PATCH actualiza `shipping_address` y `customer_phone`
9. Success + refresco
10. Nueva dirección confirmada

### Escenario 3: Pedido Enviado/Entregado (Solo Lectura)

1. Usuario tiene pedido con `shipping_status = 'shipped'`
2. Va a `/account/orders/[id]`
3. Ve dirección en modo solo lectura
4. Sin botón "Cambiar dirección"
5. Mensaje: "La dirección no se puede modificar una vez que el pedido ha sido enviado."

### Escenario 4: Sin Direcciones Guardadas

1. Usuario nuevo sin direcciones
2. Completa pago
3. Va a `/account/orders/[id]`
4. Ve: "No tienes direcciones guardadas. Agrega una dirección para confirmar el envío."
5. Botón "Agregar dirección" → `/account/addresses`
6. Agrega dirección
7. Vuelve a `/account/orders/[id]`
8. Ahora ve selector con la dirección nueva

### Escenario 5: Pedido No Pagado

1. Usuario tiene pedido `payment_status = 'pending'`
2. Va a `/account/orders/[id]`
3. Ve: "La dirección de envío se podrá confirmar cuando el pago esté aprobado."
4. No puede seleccionar dirección

---

## 9. Integración con SUBFASE A (Backend)

**Endpoint usado:** `PATCH /api/account/orders/[id]/shipping-address`

**Request:**
```json
{
  "address_id": "5e2ddcf6-c7e7-493c-821b-4444907c7c28"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "order": {
    "id": "ded47354...",
    "shipping_address": "jhonatan venegas\ncalle molina 60\n...",
    "customer_phone": "+34 722385452",
    ...
  }
}
```

**Response Error (400):**
```json
{
  "error": "Order not paid yet"
}
```

**Response Error (401):**
```json
{
  "error": "Missing or invalid token"
}
```

**Response Error (404):**
```json
{
  "error": "Order not found"
}
```

**Manejo en componente:**
- 401 → `window.location.href = '/account/login'`
- 400/403/404 → `setError(data.error)`
- 200 → `setSuccess()` + actualizar estado local + refresco

---

## 10. Diferencias de Código

### ShippingAddressSection.tsx (NUEVO)

**Líneas clave:**

```typescript
// Estado
const [addresses, setAddresses] = useState<Address[]>([])
const [selectedAddressId, setSelectedAddressId] = useState<string>('')
const [currentShippingAddress, setCurrentShippingAddress] = useState(order.shipping_address)

// Permisos
const canEditAddress = order.payment_status === 'paid' && 
  (order.shipping_status === 'pending' || order.shipping_status === 'preparing' || !order.shipping_status)

// Llamada endpoint
const response = await fetch(`/api/account/orders/${order.id}/shipping-address`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ address_id: selectedAddressId })
})

// Success
setSuccess('Dirección de envío actualizada correctamente')
setCurrentShippingAddress(data.order.shipping_address)
setTimeout(() => window.location.reload(), 1000)
```

### Integración en page.tsx

```diff
+ import ShippingAddressSection from '@/components/customer/ShippingAddressSection'

- {order.shipping_address && (
-   <div className="bg-white border border-gray-200 rounded-lg p-6">
-     <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
-     <p className="text-gray-900 whitespace-pre-line">{order.shipping_address}</p>
-   </div>
- )}

+ <ShippingAddressSection order={order} />
```

---

## 11. Próximos Pasos (NO ejecutados)

**Aguardando validación de Jhonatan:**

1. Probar flujo completo en producción
2. Verificar 11 criterios funcionales
3. Confirmar que `/account/orders` muestra badges actualizados post-confirmación
4. Confirmar que `/account/addresses` sigue funcionando
5. Verificar que no hay errores en consola
6. Aprobación formal de cierre SUBFASE C

**NO se avanzó a admin todavía.**

---

## 12. Resumen Ejecutivo

**SUBFASE C — UI confirmar/cambiar dirección en detalle de pedido**

- ✅ Implementado componente `ShippingAddressSection` (331 líneas)
- ✅ Integrado en `/account/orders/[id]`
- ✅ Build PASS (local 5.6s, Vercel 6.3s)
- ✅ Deploy PASS (production)
- ✅ Commit PASS (7a26c91)
- ✅ Confirmado: SOLO UI modificada (2 archivos, 1 nuevo componente)
- ✅ Confirmado: Backend/checkout/Stripe/webhook/admin/DB/RLS intactos
- ✅ Confirmado: Endpoint SUBFASE A NO modificado
- ⏸️ Pendiente: Validación funcional Jhonatan (11 criterios)

**Funcionalidades implementadas:**
- ✅ Confirmar dirección (pedido pagado sin dirección)
- ✅ Cambiar dirección (pedido pending/preparing)
- ✅ Solo lectura (pedido shipped/delivered)
- ✅ Mensaje espera pago (pedido no pagado)
- ✅ Manejo sin direcciones (link a /account/addresses)
- ✅ Loading states
- ✅ Error handling
- ✅ Success feedback
- ✅ Auto-refresh post-confirmación
- ✅ Integración con endpoint PATCH validado
- ✅ Seguridad (token Bearer, RLS, redirects)

**Estado:** EN VALIDACIÓN
