# ADMIN_FASE_1_ENVIOS_SCOPE.md

**Fecha:** 2026-05-04  
**Proyecto:** Bagclue - Admin Panel (Envíos / Fulfillment)  
**Objetivo:** Mejorar gestión de pedidos pendientes de envío y tracking  
**Tipo:** Mejora operativa crítica  
**Estado:** SOLO DISEÑO — NO IMPLEMENTAR SIN AUTORIZACIÓN

---

## CONTEXTO

### Situación Actual
- ✅ Cliente puede confirmar dirección de envío desde `/account/orders/[id]`
- ✅ Admin puede ver órdenes en `/admin/orders`
- ✅ Admin puede actualizar envío en `/admin/orders/[id]`
- ✅ Tracking público funciona en `/track/[tracking_token]`

### Problema
Admin actual NO está optimizado para operación diaria de fulfillment:
- ❌ Sin filtros por estado de envío
- ❌ Sin vista de "pendientes de dirección"
- ❌ Sin vista de "pendientes de envío"
- ❌ Sin búsqueda por cliente/orden
- ❌ Formulario de envío mezclado con info general
- ❌ Sin flujo claro: confirmar dirección → preparar → enviar → entregar

### Objetivo
Crear un módulo de **Envíos / Fulfillment** que cierre el ciclo operativo:
```
Cliente compra → Cliente confirma dirección → Admin prepara → Admin envía → Cliente rastrea
```

---

## 1. AUDITORÍA ADMIN ACTUAL

### 1.1. Ruta: `/admin/orders`

**Archivo:** `src/app/admin/orders/page.tsx`

**Funcionalidad actual:**
- ✅ Listado completo de órdenes (desc por created_at)
- ✅ Stats básicas:
  - Total órdenes
  - Pagadas
  - Pendientes de pago
  - Canceladas
- ✅ Tabla con columnas:
  - Fecha (creación)
  - Cliente (nombre)
  - Email
  - Productos (marca + título)
  - Total
  - Pago (badge: paid/pending)
  - Estado (badge: confirmed/pending/cancelled)
  - Acción (Ver detalle →)

**Limitaciones:**
- ❌ Sin filtros por `shipping_status`
- ❌ Sin filtro "pendientes de dirección" (`paid` + `shipping_address` NULL)
- ❌ Sin filtro "pendientes de envío" (`paid` + `shipping_address` lleno + `shipping_status` pending)
- ❌ Sin búsqueda por cliente/email
- ❌ Sin stat de "órdenes por enviar"
- ❌ No muestra si dirección está confirmada
- ❌ No muestra estado de envío en tabla

---

### 1.2. Ruta: `/admin/orders/[id]`

**Archivo:** `src/app/admin/orders/[id]/page.tsx`

**Funcionalidad actual:**
- ✅ Detalle completo de orden:
  - Productos con `product_snapshot` (brand, title, model, color, slug)
  - Totales (subtotal, shipping, total)
  - Info pago Stripe (session_id, payment_intent_id, payment_status)
  - Info cliente (nombre, email, teléfono, dirección)
  - Fechas (created_at, updated_at)
  - Notas (si existen)
- ✅ Componente `ShippingInfoForm` integrado

**Componente: `ShippingInfoForm`**

**Archivo:** `src/components/admin/ShippingInfoForm.tsx`

**Funcionalidad:**
- ✅ Link de tracking público (copiar al portapapeles)
- ✅ Formulario unificado:
  - Estado de orden (pending, confirmed, preparing, shipped, delivered, cancelled)
  - Estado de envío (pending, preparing, shipped, delivered)
  - Paquetería (DHL, FedEx, manual, sin asignar)
  - Número de rastreo
  - URL de rastreo externo (opcional, auto-generada)
  - Teléfono cliente
  - Dirección de envío
  - Notas internas
- ✅ Guardado separado en 2 endpoints:
  - `PUT /api/orders/[id]/status` (estado orden)
  - `PUT /api/orders/[id]/shipping` (info envío)
- ✅ Feedback visual (success/error)
- ✅ Auto-generación de `tracking_url` según provider

**Limitaciones:**
- ❌ Formulario demasiado largo (mezcla estado orden + envío)
- ❌ No hay validación visual de "dirección confirmada"
- ❌ No hay alerta si `shipping_address` está vacío
- ❌ No hay flujo guiado (preparar → enviar → entregar)
- ❌ Admin debe scrollear mucho para ver toda la info

---

### 1.3. APIs Actuales

#### API: `PUT /api/orders/[id]/status`

**Archivo:** `src/app/api/orders/[id]/status/route.ts`

**Funcionalidad:**
- Actualizar `status` de orden
- Valores válidos: pending, confirmed, preparing, shipped, delivered, cancelled
- Actualiza `updated_at` automáticamente

**Limitaciones:**
- No valida si orden está pagada antes de cambiar a shipped/delivered
- No valida que haya dirección antes de shipped

---

#### API: `PUT /api/orders/[id]/shipping`

**Archivo:** `src/app/api/orders/[id]/shipping/route.ts`

**Funcionalidad:**
- ✅ Actualizar info de envío:
  - `customer_phone`
  - `shipping_address`
  - `shipping_status` (pending, preparing, shipped, delivered)
  - `shipping_provider` (dhl, fedex, null)
  - `tracking_number`
  - `tracking_url` (manual o auto-generada)
  - `notes`
- ✅ Validaciones:
  - `shipping_status` solo puede ser: pending, preparing, shipped, delivered
  - `shipping_provider` solo puede ser: dhl, fedex, null
  - Si `shipping_status=shipped` → requiere `shipping_provider` y `tracking_number`
- ✅ Auto-generación de `tracking_url` si provider=dhl o fedex y no se proporciona
- ✅ Timestamps automáticos:
  - `shipping_status=shipped` → `shipped_at = NOW()`
  - `shipping_status=delivered` → `delivered_at = NOW()`

**Función: `generateTrackingUrl(provider, trackingNumber)`**
- DHL: `https://www.dhl.com.mx/es/express/rastreo.html?AWB={trackingNumber}`
- FedEx: `https://www.fedex.com/fedextrack/?tracknumbers={trackingNumber}`

**Limitaciones:**
- No valida que `payment_status=paid` antes de shipped
- No valida que `shipping_address` esté lleno antes de shipped

---

### 1.4. Campos Actuales en Tabla `orders`

**Campos relevantes para envío:**
```sql
-- Cliente
customer_name TEXT
customer_email TEXT
customer_phone TEXT
customer_address TEXT (parece legacy)

-- Dirección estructurada
shipping_address TEXT
shipping_city TEXT
shipping_state TEXT
shipping_postal_code TEXT
shipping_country TEXT DEFAULT 'MX'

-- Pago
payment_status TEXT (pending, paid, refunded)
stripe_session_id TEXT
stripe_payment_intent_id TEXT

-- Estado general
status TEXT (pending, confirmed, preparing, shipped, delivered, cancelled)

-- Envío
shipping_status TEXT (pending, preparing, shipped, delivered)
shipping_provider TEXT (dhl, fedex, manual, null)
tracking_number TEXT
tracking_url TEXT
tracking_token TEXT UNIQUE
shipped_at TIMESTAMPTZ
delivered_at TIMESTAMPTZ

-- Notas
notes TEXT

-- Otros
layaway_id UUID
user_id UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Campos que existen y están validados:**
- ✅ `shipping_address` (confirmado por cliente en Fase 14)
- ✅ `customer_phone` (confirmado por cliente en Fase 14)
- ✅ `shipping_status`
- ✅ `shipping_provider`
- ✅ `tracking_number`
- ✅ `tracking_url`
- ✅ `shipped_at`
- ✅ `delivered_at`
- ✅ `notes`

**Campo que falta (opcional):**
- ❌ `admin_notes` (notas internas separadas de `notes` que ve cliente)

---

## 2. QUÉ YA FUNCIONA

### ✅ Funcionalidades Validadas

1. **Admin puede ver todas las órdenes**
   - `/admin/orders` lista todo
   - Stats básicas funcionan

2. **Admin puede actualizar envío**
   - Formulario `ShippingInfoForm` completo
   - API `PUT /api/orders/[id]/shipping` funciona
   - Validaciones básicas funcionan

3. **Tracking automático DHL/FedEx**
   - URLs se generan automáticamente
   - DHL y FedEx formatos correctos

4. **Timestamps automáticos**
   - `shipped_at` se marca al shipping_status=shipped
   - `delivered_at` se marca al shipping_status=delivered

5. **Link tracking público**
   - Cada orden tiene `tracking_token`
   - Se puede copiar link `/track/{tracking_token}`

6. **Cliente confirma dirección**
   - Desde `/account/orders/[id]`
   - `shipping_address` y `customer_phone` se actualizan

---

## 3. QUÉ FALTA

### ❌ Gaps Operativos

1. **Sin vista de órdenes pendientes de dirección**
   - Filtro: `payment_status=paid` AND `shipping_address IS NULL`
   - Admin no puede ver rápidamente cuáles necesitan dirección

2. **Sin vista de órdenes pendientes de envío**
   - Filtro: `payment_status=paid` AND `shipping_address NOT NULL` AND `shipping_status IN (pending, preparing)`
   - Admin no puede ver rápidamente cuáles enviar hoy

3. **Sin filtros en `/admin/orders`**
   - No hay tabs para: Todos, Pendientes dirección, Pendientes envío, Enviados, Entregados
   - No hay búsqueda por cliente/email

4. **Sin stat "Órdenes por enviar"**
   - Dashboard actual solo muestra: Total, Pagadas, Pendientes pago, Canceladas
   - Falta: Pendientes de dirección, Pendientes de envío

5. **Formulario de envío mezclado**
   - `ShippingInfoForm` actualiza estado orden + info envío
   - Confuso para admin (¿qué cambio primero?)

6. **Sin alerta de dirección vacía**
   - Si admin intenta marcar como `shipped` pero `shipping_address` está NULL
   - API bloquea pero UX no es clara

7. **Sin flujo guiado**
   - Admin debe saber qué hacer en cada estado
   - No hay UI que guíe: confirmar dirección → preparar → cargar tracking → enviar → entregar

8. **Sin búsqueda**
   - Admin debe scrollear toda la tabla para encontrar una orden específica

---

## 4. PROPUESTA DE MEJORA

### Módulo: Envíos / Fulfillment

**Objetivo:** Optimizar operación diaria de fulfillment con vistas filtradas y flujo guiado.

---

### 4.1. Nueva Ruta: `/admin/envios`

**Funcionalidad:**
- **Tabs de filtrado:**
  1. **Todos** (sin filtro)
  2. **Pendientes dirección** (`paid` + `shipping_address` NULL)
  3. **Pendientes envío** (`paid` + `shipping_address` lleno + `shipping_status IN (pending, preparing)`)
  4. **Enviados** (`shipping_status=shipped`)
  5. **Entregados** (`shipping_status=delivered`)

- **Búsqueda:**
  - Por nombre cliente
  - Por email
  - Por tracking_number

- **Tabla optimizada:**
  - Fecha orden
  - Cliente
  - Email
  - Productos (resumen)
  - Total
  - **Dirección** (badge: ✅ Confirmada / ⚠️ Pendiente)
  - **Estado envío** (badge: Pendiente / Preparando / Enviado / Entregado)
  - Acción (Ver detalle →)

- **Stats en header:**
  - Pendientes dirección (número)
  - Pendientes envío (número)
  - Enviados hoy (número)

---

### 4.2. Mejora: `/admin/orders/[id]` (Detalle con Fulfillment)

**Cambio 1:** Separar secciones visualmente

**Sección 1: Información General** (solo lectura)
- Productos
- Totales
- Info pago Stripe
- Cliente
- Fechas

**Sección 2: Dirección de Envío** (resaltada)
- Badge grande:
  - ✅ **Dirección confirmada** (si `shipping_address` lleno)
  - ⚠️ **Pendiente de dirección** (si `shipping_address` NULL)
- Mostrar dirección completa si existe
- Mostrar teléfono
- Link: "Cliente puede confirmar desde su panel" (si pendiente)

**Sección 3: Fulfillment / Envío** (formulario compacto)
- **Estado de envío:** (select: pending, preparing, shipped, delivered)
- **Paquetería:** (select: sin asignar, DHL, FedEx, manual)
- **Número de rastreo:** (input)
- **Link tracking DHL/FedEx:** (auto-generado, solo lectura si provider=dhl/fedex)
- **Notas internas:** (textarea)
- Botón: **Guardar cambios de envío**

**Validaciones UI:**
- Si `shipping_address` NULL:
  - Mostrar alerta: "⚠️ No se puede marcar como enviado sin dirección confirmada"
  - Deshabilitar opción "shipped" en select
- Si `shipping_status=shipped`:
  - Requiere `shipping_provider` y `tracking_number`
  - Mostrar campos como obligatorios

**Cambio 2:** Eliminar estado de orden del formulario
- El campo `status` (orden general) NO debe estar mezclado con envío
- Mover a sección separada si se requiere (opcional)

---

### 4.3. Nueva API: `GET /api/admin/orders/pending-shipment`

**Propósito:** Endpoint optimizado para tab "Pendientes envío"

**Query params:**
- `filter`: `pending_address` | `pending_shipment` | `shipped` | `delivered`
- `search`: búsqueda por nombre/email/tracking

**Respuesta:**
```json
{
  "orders": [
    {
      "id": "...",
      "customer_name": "...",
      "customer_email": "...",
      "products_summary": "Gucci Marmont, Chanel Boy",
      "total": 45000,
      "has_address": true/false,
      "shipping_status": "pending",
      "shipping_provider": null,
      "tracking_number": null,
      "created_at": "...",
      "shipped_at": null,
      "delivered_at": null
    }
  ],
  "stats": {
    "pending_address": 3,
    "pending_shipment": 12,
    "shipped": 5,
    "delivered": 48
  }
}
```

---

### 4.4. Mejora: API `PUT /api/orders/[id]/shipping`

**Validación adicional:**

```typescript
// Antes de actualizar, validar:
if (shipping_status === 'shipped') {
  // 1. Orden debe estar pagada
  if (currentOrder.payment_status !== 'paid') {
    return error('No se puede marcar como enviado sin pago confirmado')
  }
  
  // 2. Debe tener dirección
  if (!currentOrder.shipping_address) {
    return error('No se puede marcar como enviado sin dirección confirmada')
  }
  
  // 3. Debe tener provider y tracking
  if (!shipping_provider || !tracking_number) {
    return error('Paquetería y número de rastreo son obligatorios para marcar como enviado')
  }
}
```

**Sin cambios en estructura de request/response.**

---

## 5. LISTA DE PEDIDOS PENDIENTES DE ENVÍO

### Definición
**Pedidos pendientes de envío** son aquellos que cumplen:
- ✅ `payment_status = 'paid'`
- ✅ `shipping_address IS NOT NULL` (dirección confirmada)
- ✅ `shipping_status IN ('pending', 'preparing')`

### Query SQL
```sql
SELECT 
  orders.id,
  orders.customer_name,
  orders.customer_email,
  orders.customer_phone,
  orders.shipping_address,
  orders.total,
  orders.shipping_status,
  orders.shipping_provider,
  orders.tracking_number,
  orders.created_at,
  STRING_AGG(
    products.brand || ' ' || products.title, 
    ', '
  ) AS products_summary
FROM orders
LEFT JOIN order_items ON orders.id = order_items.order_id
LEFT JOIN products ON order_items.product_id = products.id
WHERE orders.payment_status = 'paid'
  AND orders.shipping_address IS NOT NULL
  AND orders.shipping_status IN ('pending', 'preparing')
GROUP BY orders.id
ORDER BY orders.created_at ASC;
```

### UI Propuesta (Tab "Pendientes envío")
- Tabla con órdenes más antiguas primero (FIFO)
- Badge verde: "✅ Dirección confirmada"
- Badge amarillo: "⚠️ Preparando" o "⏸️ Pendiente"
- Acción rápida: "Marcar como enviado" (modal con form paquetería + tracking)

---

## 6. PEDIDOS PENDIENTES DE DIRECCIÓN

### Definición
**Pedidos pendientes de dirección** son aquellos que cumplen:
- ✅ `payment_status = 'paid'`
- ❌ `shipping_address IS NULL`

### Query SQL
```sql
SELECT 
  orders.id,
  orders.customer_name,
  orders.customer_email,
  orders.total,
  orders.created_at,
  orders.user_id,
  STRING_AGG(
    products.brand || ' ' || products.title, 
    ', '
  ) AS products_summary
FROM orders
LEFT JOIN order_items ON orders.id = order_items.order_id
LEFT JOIN products ON order_items.product_id = products.id
WHERE orders.payment_status = 'paid'
  AND orders.shipping_address IS NULL
GROUP BY orders.id
ORDER BY orders.created_at ASC;
```

### UI Propuesta (Tab "Pendientes dirección")
- Badge rojo: "⚠️ Sin dirección"
- Mensaje: "El cliente debe confirmar su dirección desde su panel de cuenta"
- Link: "Ver tracking público" (para enviar al cliente)
- Si `user_id` NULL: alerta "Cliente sin cuenta → no puede confirmar dirección (requiere soporte manual)"

---

## 7. ACCIONES ADMIN

### Acción 1: Ver órdenes pendientes
**Dónde:** `/admin/envios` (tabs)  
**Qué hace:** Filtrar órdenes por estado  
**Implementación:** GET con filtros

---

### Acción 2: Buscar orden
**Dónde:** `/admin/envios` (barra de búsqueda)  
**Qué hace:** Buscar por nombre/email/tracking  
**Implementación:** GET con query param `search`

---

### Acción 3: Ver detalle de orden
**Dónde:** Clic en "Ver detalle" en tabla  
**Qué hace:** Redirige a `/admin/orders/[id]`  
**Implementación:** Ya existe

---

### Acción 4: Marcar como "Preparando"
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Cambiar `shipping_status` a `preparing`
- Guardar

**Implementación:** 
- API `PUT /api/orders/[id]/shipping` con `{ shipping_status: 'preparing' }`

---

### Acción 5: Marcar como "Enviado"
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Cambiar `shipping_status` a `shipped`
- Requiere:
  - `shipping_provider` (obligatorio)
  - `tracking_number` (obligatorio)
- Auto-asigna:
  - `shipped_at = NOW()`
  - `tracking_url` (auto-generada si dhl/fedex)

**Validaciones antes de permitir:**
- ✅ `payment_status = paid`
- ✅ `shipping_address IS NOT NULL`
- ✅ `shipping_provider` lleno
- ✅ `tracking_number` lleno

**Implementación:** 
- API `PUT /api/orders/[id]/shipping` con validaciones mejoradas

---

### Acción 6: Marcar como "Entregado"
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Cambiar `shipping_status` a `delivered`
- Auto-asigna:
  - `delivered_at = NOW()`

**Validaciones:**
- ✅ `shipping_status` actual debe ser `shipped`

**Implementación:** 
- API `PUT /api/orders/[id]/shipping`

---

### Acción 7: Cargar paquetería (DHL/FedEx/manual)
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Seleccionar provider
- Si DHL/FedEx → auto-generar tracking_url al guardar tracking_number

**Implementación:** 
- Select en formulario
- API ya soporta auto-generación

---

### Acción 8: Cargar tracking number
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Ingresar número de rastreo
- Si provider=dhl/fedex → auto-generar URL

**Implementación:** 
- Input en formulario
- API ya soporta

---

### Acción 9: Cargar tracking URL manual
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Si provider no es DHL/FedEx
- Admin puede pegar URL manualmente

**Implementación:** 
- Input opcional en formulario
- API ya soporta

---

### Acción 10: Editar teléfono cliente
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Actualizar `customer_phone`
- Útil si cliente puso número incorrecto

**Implementación:** 
- Input en formulario
- API ya soporta

---

### Acción 11: Ver dirección de envío
**Dónde:** `/admin/orders/[id]` (sección Dirección)  
**Qué hace:**
- Mostrar `shipping_address` completo
- Solo lectura (admin NO debe modificar dirección confirmada por cliente)

**Implementación:** 
- Ya existe en componente actual
- Mejorar visualmente (badge + formato)

---

### Acción 12: Agregar notas internas
**Dónde:** `/admin/orders/[id]` (sección Fulfillment)  
**Qué hace:**
- Actualizar `notes`
- Notas privadas del admin

**Implementación:** 
- Textarea en formulario
- API ya soporta

---

## 8. REGLAS DE NEGOCIO

### Regla 1: Envío requiere dirección confirmada
- Para marcar `shipping_status=shipped`:
  - ✅ `shipping_address IS NOT NULL`
  - Si NULL → UI bloquea opción + muestra alerta

---

### Regla 2: Envío requiere paquetería y tracking
- Para marcar `shipping_status=shipped`:
  - ✅ `shipping_provider IS NOT NULL`
  - ✅ `tracking_number IS NOT NULL`
  - Si faltan → API retorna error

---

### Regla 3: Envío requiere pago confirmado
- Para marcar `shipping_status=shipped`:
  - ✅ `payment_status = 'paid'`
  - Si pending → API retorna error

---

### Regla 4: Timestamps automáticos
- `shipping_status=shipped` → `shipped_at = NOW()`
- `shipping_status=delivered` → `delivered_at = NOW()`
- No se sobrescribe si ya existe

---

### Regla 5: Tracking URL auto-generada
- Si `shipping_provider IN ('dhl', 'fedex')` AND `tracking_number` presente:
  - Auto-generar `tracking_url` (si no se proporciona manual)
- DHL: `https://www.dhl.com.mx/es/express/rastreo.html?AWB={tracking_number}`
- FedEx: `https://www.fedex.com/fedextrack/?tracknumbers={tracking_number}`

---

### Regla 6: Admin NO modifica dirección
- `shipping_address` solo puede ser confirmada/cambiada por el cliente desde su panel
- Admin ve dirección como solo lectura
- Si dirección incorrecta → cliente debe cambiarla desde `/account/orders/[id]`

---

### Regla 7: Entregado solo después de enviado
- Para marcar `shipping_status=delivered`:
  - ✅ `shipping_status` actual debe ser `shipped`
  - Si no → API retorna error

---

### Regla 8: No tocar pagos/Stripe/checkout/productos/stock
- ❌ Admin de envíos NO debe modificar:
  - `payment_status`
  - `stripe_*` fields
  - `order_items`
  - `products.status`
  - `products.stock_quantity`
- Solo puede modificar:
  - `shipping_status`
  - `shipping_provider`
  - `tracking_number`
  - `tracking_url`
  - `customer_phone`
  - `notes`
  - `shipped_at` (auto)
  - `delivered_at` (auto)

---

## 9. UI PROPUESTA

### 9.1. Nueva Ruta: `/admin/envios`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Envíos / Fulfillment                                    │
├─────────────────────────────────────────────────────────────────┤
│ Stats:                                                           │
│  📦 Pendientes dirección: 3                                     │
│  🚚 Pendientes envío: 12                                        │
│  ✈️ Enviados hoy: 5                                             │
├─────────────────────────────────────────────────────────────────┤
│ Tabs:                                                            │
│  [ Todos ] [ Pendientes dirección ] [ Pendientes envío ]        │
│  [ Enviados ] [ Entregados ]                                    │
├─────────────────────────────────────────────────────────────────┤
│ Búsqueda: [____________________] 🔍                             │
├─────────────────────────────────────────────────────────────────┤
│ Tabla:                                                           │
│ ┌─────┬────────┬──────┬──────────┬──────┬──────────┬──────┬──┐ │
│ │Fecha│Cliente │Email │Productos │Total │Dirección │Envío │  │ │
│ ├─────┼────────┼──────┼──────────┼──────┼──────────┼──────┼──┤ │
│ │02/05│Ana P.  │ana@..│Gucci...  │$45k  │✅Confirm │⏸️Pend│→│ │
│ │01/05│Luis G. │luis..│Chanel..  │$32k  │⚠️Pend   │⏸️Pend│→│ │
│ └─────┴────────┴──────┴──────────┴──────┴──────────┴──────┴──┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `<AdminEnviosPage>` (nuevo)
- `<EnviosStats>` (nuevo)
- `<EnviosTabs>` (nuevo)
- `<EnviosTable>` (nuevo)
- `<SearchBar>` (reutilizable)

---

### 9.2. Mejora: `/admin/orders/[id]`

**Layout mejorado:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Volver a órdenes                                              │
├─────────────────────────────────────────────────────────────────┤
│ Orden #ABC123 — 02 Mayo 2026                                   │
├──────────────────────────────┬──────────────────────────────────┤
│ SECCIÓN 1: Productos         │ SIDEBAR: Cliente                 │
│ - Gucci Marmont              │ - Ana Pérez                      │
│ - $45,000 MXN                │ - ana@example.com                │
│                               │ - +52 55 1234 5678               │
├──────────────────────────────┼──────────────────────────────────┤
│ SECCIÓN 2: Pago              │ SIDEBAR: Fechas                  │
│ - Stripe session: cs_test... │ - Creada: 02 May 10:30           │
│ - Status: ✅ Pagado          │ - Actualizada: 02 May 11:00      │
├──────────────────────────────┴──────────────────────────────────┤
│ SECCIÓN 3: ✅ DIRECCIÓN CONFIRMADA                              │
│ Calle Reforma 123, Col. Centro                                 │
│ Ciudad de México, 06000, CDMX, México                           │
│ Teléfono: +52 55 1234 5678                                     │
├─────────────────────────────────────────────────────────────────┤
│ SECCIÓN 4: FULFILLMENT / ENVÍO                                  │
│                                                                  │
│ Estado de envío: [Pendiente ▼]                                 │
│ Paquetería:      [DHL ▼]                                       │
│ Tracking:        [1234567890_____________]                     │
│ Link tracking:   https://dhl.com.mx/... (auto)                 │
│ Notas internas:  [___________________________]                 │
│                                                                  │
│ [ Guardar cambios de envío ]                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Mejoras visuales:**
- Badge grande "✅ Dirección confirmada" o "⚠️ Pendiente dirección"
- Sección Fulfillment más compacta
- Eliminar campo `status` de orden (no es relevante para fulfillment)

---

### 9.3. Filtros Propuestos

**Tab "Todos":**
- Sin filtro

**Tab "Pendientes dirección":**
- `payment_status=paid` AND `shipping_address IS NULL`

**Tab "Pendientes envío":**
- `payment_status=paid` AND `shipping_address NOT NULL` AND `shipping_status IN (pending, preparing)`

**Tab "Enviados":**
- `shipping_status=shipped`

**Tab "Entregados":**
- `shipping_status=delivered`

---

### 9.4. Búsqueda Propuesta

**Búsqueda por:**
- Nombre cliente (ILIKE)
- Email cliente (ILIKE)
- Tracking number (exact match)

**Query SQL:**
```sql
WHERE 
  customer_name ILIKE '%{search}%'
  OR customer_email ILIKE '%{search}%'
  OR tracking_number = '{search}'
```

---

## 10. API PROPUESTA

### 10.1. Nueva API: `GET /api/admin/envios`

**Endpoint:** `GET /api/admin/envios?filter=pending_shipment&search=Ana`

**Query params:**
- `filter` (opcional): `all` | `pending_address` | `pending_shipment` | `shipped` | `delivered`
- `search` (opcional): texto de búsqueda

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "customer_name": "Ana Pérez",
      "customer_email": "ana@example.com",
      "products_summary": "Gucci Marmont, Chanel Boy",
      "total": 45000,
      "currency": "MXN",
      "has_address": true,
      "shipping_status": "pending",
      "shipping_provider": null,
      "tracking_number": null,
      "created_at": "2026-05-02T10:30:00Z",
      "shipped_at": null,
      "delivered_at": null
    }
  ],
  "stats": {
    "pending_address": 3,
    "pending_shipment": 12,
    "shipped": 5,
    "delivered": 48,
    "shipped_today": 5
  }
}
```

**Implementación:**
- Nueva ruta: `src/app/api/admin/envios/route.ts`
- Requiere auth admin (session check)
- Query con join a `order_items` y `products` para `products_summary`

---

### 10.2. Mejora: `PUT /api/orders/[id]/shipping`

**Agregar validaciones:**

```typescript
// Antes de actualizar:
const { data: order } = await supabase
  .from('orders')
  .select('payment_status, shipping_address, shipping_status')
  .eq('id', orderId)
  .single()

if (shipping_status === 'shipped') {
  // Validación 1: Orden pagada
  if (order.payment_status !== 'paid') {
    return NextResponse.json({ 
      error: 'No se puede marcar como enviado sin pago confirmado' 
    }, { status: 400 })
  }
  
  // Validación 2: Dirección confirmada
  if (!order.shipping_address) {
    return NextResponse.json({ 
      error: 'No se puede marcar como enviado sin dirección confirmada' 
    }, { status: 400 })
  }
  
  // Validación 3: Provider y tracking obligatorios
  if (!shipping_provider || !tracking_number) {
    return NextResponse.json({ 
      error: 'Paquetería y número de rastreo son obligatorios para marcar como enviado' 
    }, { status: 400 })
  }
}

if (shipping_status === 'delivered') {
  // Validación 4: Solo si ya fue enviado
  if (order.shipping_status !== 'shipped') {
    return NextResponse.json({ 
      error: 'No se puede marcar como entregado sin haber sido enviado primero' 
    }, { status: 400 })
  }
}
```

**Sin cambios en estructura de request/response.**

---

## 11. CAMBIOS EN BASE DE DATOS

### ¿Se requieren cambios en DB?

**NO** — Todos los campos necesarios ya existen en tabla `orders`:
- ✅ `shipping_address`
- ✅ `customer_phone`
- ✅ `shipping_status`
- ✅ `shipping_provider`
- ✅ `tracking_number`
- ✅ `tracking_url`
- ✅ `shipped_at`
- ✅ `delivered_at`
- ✅ `notes`

### ¿Campo `admin_notes` es necesario?

**Opcional** — El campo `notes` actual funciona como notas internas.

Si en el futuro se requiere separar:
- `notes` → notas visibles para cliente (futuro)
- `admin_notes` → notas privadas admin

Entonces agregar:
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN orders.admin_notes IS 'Notas internas del admin (no visibles para cliente)';
```

**Decisión:** NO agregar por ahora. Usar `notes` como privado.

---

## 12. RIESGOS TÉCNICOS

### Riesgo 1: Performance en queries con joins
**Descripción:** Query de `products_summary` requiere join a `order_items` y `products`  
**Mitigación:**
- Índice en `order_items.order_id` (ya existe)
- Índice en `order_items.product_id` (verificar)
- Limit de resultados (paginación futura)

---

### Riesgo 2: Sincronización entre estados
**Descripción:** `status` (orden general) vs `shipping_status` pueden desincronizarse  
**Mitigación:**
- Eliminar `status` del formulario de envío
- Solo usar `shipping_status` para fulfillment
- `status` se puede mantener pero NO actualizar desde módulo envíos

---

### Riesgo 3: Dirección NULL en órdenes viejas
**Descripción:** Órdenes creadas antes de Fase 14 pueden tener `shipping_address` NULL  
**Mitigación:**
- Tab "Pendientes dirección" muestra estas órdenes
- Admin puede contactar cliente manualmente
- Futuro: permitir admin ingresar dirección manualmente si cliente sin cuenta

---

### Riesgo 4: Cliente cambia dirección después de shipped
**Descripción:** Si orden ya fue enviada, cliente no debe poder cambiar dirección  
**Mitigación:**
- UI de cliente ya valida: solo permite cambiar si `shipping_status IN (pending, preparing)`
- Si `shipped` o `delivered` → solo lectura

---

### Riesgo 5: Admin marca shipped sin tracking real
**Descripción:** Admin puede poner tracking falso para marcar como shipped  
**Mitigación:**
- Validación obligatoria de campos (ya implementada)
- Logs de cambios (futuro)
- Confianza en admin (es empleado interno)

---

## 13. SUBFASES PEQUEÑAS

### SUBFASE A: API de Envíos (Backend)
**Duración estimada:** 1-2 días

**Tareas:**
1. Crear endpoint `GET /api/admin/envios`
   - Filtros: all, pending_address, pending_shipment, shipped, delivered
   - Búsqueda: nombre, email, tracking
   - Stats: contadores por estado
2. Mejorar `PUT /api/orders/[id]/shipping`
   - Agregar validaciones adicionales (pago, dirección, tracking)
3. Tests manuales en Postman/curl
4. Validar que stats son correctos

**Entregables:**
- `src/app/api/admin/envios/route.ts`
- Validaciones en `src/app/api/orders/[id]/shipping/route.ts`
- Tests manuales documentados

**Criterios de cierre:**
- ✅ Endpoint `/api/admin/envios` retorna órdenes filtradas correctamente
- ✅ Stats son correctos
- ✅ Búsqueda funciona
- ✅ Validaciones en `/shipping` bloquean casos inválidos
- ✅ Código en GitHub

---

### SUBFASE B: UI de Envíos (Frontend Lista)
**Duración estimada:** 2-3 días

**Tareas:**
1. Crear página `/admin/envios`
   - Header con stats
   - Tabs de filtrado
   - Barra de búsqueda
   - Tabla de órdenes
2. Componente `<EnviosStats>`
3. Componente `<EnviosTabs>`
4. Componente `<EnviosTable>`
5. Integración con API `GET /api/admin/envios`
6. Navegación: clic en orden → `/admin/orders/[id]`

**Entregables:**
- `src/app/admin/envios/page.tsx`
- `src/components/admin/EnviosStats.tsx`
- `src/components/admin/EnviosTabs.tsx`
- `src/components/admin/EnviosTable.tsx`

**Criterios de cierre:**
- ✅ `/admin/envios` carga correctamente
- ✅ Stats se muestran
- ✅ Tabs filtran órdenes
- ✅ Búsqueda funciona
- ✅ Tabla muestra datos correctos
- ✅ Link "Ver detalle" redirige a `/admin/orders/[id]`
- ✅ Deploy a producción
- ✅ Validación manual en https://bagclue.vercel.app/admin/envios

---

### SUBFASE C: UI Detalle Mejorada (Fulfillment)
**Duración estimada:** 2-3 días

**Tareas:**
1. Mejorar `/admin/orders/[id]`
   - Separar sección "Dirección de Envío" (badge + datos)
   - Mejorar sección "Fulfillment" (formulario compacto)
   - Eliminar campo `status` del formulario
2. Mejorar `<ShippingInfoForm>`
   - Validaciones UI:
     - Si `shipping_address` NULL → alerta + bloquear opción "shipped"
     - Si `shipping_status=shipped` → campos provider/tracking obligatorios
   - UX: mostrar badges grandes para dirección
3. Tests manuales de flujo completo

**Entregables:**
- `src/app/admin/orders/[id]/page.tsx` (mejorado)
- `src/components/admin/ShippingInfoForm.tsx` (mejorado)

**Criterios de cierre:**
- ✅ Badge "Dirección confirmada/pendiente" visible
- ✅ Formulario Fulfillment compacto y claro
- ✅ Validaciones UI funcionan
- ✅ Flujo guiado claro
- ✅ Deploy a producción
- ✅ Validación manual en producción

---

### SUBFASE D: Navegación + Validación Final
**Duración estimada:** 1 día

**Tareas:**
1. Agregar link a `/admin/envios` en `<AdminNav>`
2. Validación end-to-end:
   - Orden sin dirección → aparece en "Pendientes dirección"
   - Orden con dirección → aparece en "Pendientes envío"
   - Marcar como shipped → valida campos obligatorios
   - Marcar como entregado → valida estado previo
3. Tests en producción con órdenes reales
4. Documentación final

**Entregables:**
- `src/components/admin/AdminNav.tsx` (actualizado)
- `ADMIN_FASE_1_ENTREGA.md` (documento final)

**Criterios de cierre:**
- ✅ Link "Envíos" visible en navegación admin
- ✅ Flujo completo validado en producción
- ✅ Validaciones funcionan correctamente
- ✅ Documento ADMIN_FASE_1_ENTREGA.md completo
- ✅ Jhonatan valida y aprueba cierre

---

## 14. CRITERIOS DE CIERRE

### FASE 1 cerrada cuando:

**Backend:**
- ✅ Endpoint `GET /api/admin/envios` funcional
- ✅ Filtros y búsqueda correctos
- ✅ Stats precisos
- ✅ Validaciones en `PUT /api/orders/[id]/shipping` funcionan

**Frontend:**
- ✅ Página `/admin/envios` funcional en producción
- ✅ Tabs filtran correctamente
- ✅ Búsqueda funciona
- ✅ Detalle `/admin/orders/[id]` mejorado con secciones claras
- ✅ Formulario Fulfillment con validaciones UI
- ✅ Badge "Dirección confirmada/pendiente" visible

**Flujo operativo:**
- ✅ Admin puede ver órdenes pendientes de dirección
- ✅ Admin puede ver órdenes pendientes de envío
- ✅ Admin puede marcar como preparando
- ✅ Admin puede marcar como enviado (con validaciones)
- ✅ Admin puede marcar como entregado (con validaciones)
- ✅ Tracking automático DHL/FedEx funciona

**Validación:**
- ✅ Tests manuales PASS en producción
- ✅ Jhonatan valida flujo completo
- ✅ Documento `ADMIN_FASE_1_ENTREGA.md` completo

**Deployment:**
- ✅ Código en GitHub
- ✅ Deploy manual Vercel CLI exitoso
- ✅ Validación contra https://bagclue.vercel.app/admin/envios

---

## 15. RESUMEN EJECUTIVO

### Situación Actual
- Admin puede ver órdenes y actualizar envío
- Pero NO está optimizado para operación diaria
- Sin filtros, sin búsqueda, sin flujo guiado

### Propuesta
- **Nueva ruta:** `/admin/envios` con tabs filtrados
- **Mejorar detalle:** `/admin/orders/[id]` con secciones claras
- **Validaciones:** Bloquear envío sin dirección/pago/tracking

### Beneficio
- **Cierra ciclo operativo:** Cliente compra → confirma dirección → admin envía → cliente rastrea
- **Optimiza tiempo:** Admin ve pendientes rápidamente
- **Reduce errores:** Validaciones evitan envío sin dirección/tracking

### Duración Estimada
- **SUBFASE A:** 1-2 días (API)
- **SUBFASE B:** 2-3 días (UI lista)
- **SUBFASE C:** 2-3 días (UI detalle)
- **SUBFASE D:** 1 día (validación)
- **Total:** 6-9 días

### Riesgos
- Performance en queries (mitigado con índices)
- Sincronización estados (mitigado eliminando `status` del form)
- Dirección NULL en órdenes viejas (mitigado con tab dedicado)

### Criterios de Éxito
- Admin puede procesar órdenes de forma eficiente
- Flujo claro: preparar → enviar → entregar
- Validaciones previenen errores

---

## 16. PRÓXIMOS PASOS

### Antes de Implementar
1. ✅ Revisar este documento con Jhonatan
2. ✅ Aprobar scope y subfases
3. ✅ Confirmar que NO se necesita campo `admin_notes` (usar `notes`)
4. ✅ Autorizar arranque SUBFASE A

### Al Aprobar
1. 🚀 Arrancar SUBFASE A (API)
2. 📝 Crear documento ADMIN_FASE_1_SUBFASE_A.md
3. 🔧 Implementar endpoints
4. ✅ Validar con Postman antes de frontend

---

## 17. NOTAS FINALES

**Este documento es SOLO diseño y propuesta.**

**NO SE DEBE:**
- ❌ Modificar base de datos sin autorización
- ❌ Crear rutas sin autorización
- ❌ Modificar código sin autorización
- ❌ Hacer deploy sin autorización

**SOLO SE DEBE:**
- ✅ Revisar con Jhonatan
- ✅ Discutir subfases y prioridades
- ✅ Aprobar formalmente antes de implementar

**Última actualización:** 2026-05-04  
**Próxima revisión:** Cuando Jhonatan apruebe arrancar

---

**FIN DEL DOCUMENTO**
