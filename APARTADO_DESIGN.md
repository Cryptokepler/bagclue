# Sistema de Apartado - Diseño Técnico MVP
**Proyecto:** Bagclue  
**Fecha:** 2026-04-30  
**Versión:** 1.0 - Diseño para aprobación

---

## 📋 CONTEXTO

**Producto:** Bolsas, cinturones, zapatos y joyas de lujo (Chanel, Hermès, etc.)

**Stack actual:**
- ✅ Productos (status: available/sold/reserved/preorder/hidden)
- ✅ Carrito (localStorage)
- ✅ Stripe Checkout (pago completo)
- ✅ Órdenes (orders + order_items)
- ✅ Tracking de pedido (/track/[tracking_token])
- ✅ Admin de envíos

**Objetivo MVP:**
Permitir apartado con depósito inicial (20%) y pago posterior del saldo restante (80%) en plazo de 15 días.

---

## 1️⃣ FLUJO DEL CLIENTE

### 1.1 Vista de Producto
```
Cliente ve producto disponible
↓
Botón "Apartar con $X MXN" (20% del precio)
↓
Click → Modal/Página de apartado
```

**UI:**
- Mostrar precio completo: $450,000 MXN
- Mostrar depósito requerido: $90,000 MXN (20%)
- Mostrar saldo restante: $360,000 MXN
- Mostrar plazo: 15 días
- Botón: "Apartar pieza con $90,000"

### 1.2 Checkout de Apartado
```
Cliente click "Apartar"
↓
Form: nombre, email, teléfono
↓
Stripe Checkout (modo apartado, monto = 20%)
↓
Pago exitoso
↓
Producto → status: reserved
↓
Se crea layaway (apartado activo)
↓
Cliente recibe link: /layaway/[layaway_token]
```

### 1.3 Seguimiento de Apartado
**URL:** `/layaway/[layaway_token]`

**Muestra:**
- Producto apartado (imagen, marca, modelo)
- Depósito pagado: $90,000 ✅
- Saldo restante: $360,000
- Fecha de apartado: 29 Abr 2026
- Fecha de vencimiento: 14 May 2026 (15 días)
- Días restantes: 12 días
- Timeline visual:
  - ✅ Depósito pagado (29 Abr)
  - 🔄 Apartado activo (vence 14 May)
  - ⏸️ Saldo pendiente
  - ⏸️ Pieza enviada

**Acciones:**
- Botón: "Pagar saldo restante ($360,000)" → Stripe Checkout
- Enlace: "Contactar por WhatsApp"
- Información: "Tienes hasta el 14 May para completar el pago"

### 1.4 Pago de Saldo
```
Cliente click "Pagar saldo"
↓
Stripe Checkout (monto = saldo restante)
↓
Pago exitoso
↓
layaway.status → completed
↓
producto.status → sold
↓
Se crea orden completa (order)
↓
Cliente recibe tracking normal: /track/[tracking_token]
↓
Admin puede procesar envío
```

### 1.5 Apartado Vencido
```
15 días transcurridos sin pagar saldo
↓
Cron job detecta vencimiento
↓
layaway.status → expired
↓
producto.status → available (vuelve a inventario)
↓
(Opcional) Enviar notificación al cliente
```

---

## 2️⃣ FLUJO DEL ADMIN

### 2.1 Vista de Apartados
**URL:** `/admin/layaways`

**Lista de apartados activos:**
| Producto | Cliente | Depósito | Saldo | Vence | Estado | Acciones |
|----------|---------|----------|-------|-------|--------|----------|
| Hermès Birkin 30 | Ana López | $90k | $360k | 5 días | active | Ver / Cancelar |
| Chanel Classic | María G. | $38k | $152k | -2 días | expired | Ver |

**Filtros:**
- Estado: active / completed / expired / cancelled
- Ordenar por: fecha de vencimiento

### 2.2 Detalle de Apartado
**URL:** `/admin/layaways/[id]`

**Muestra:**
- Info del cliente (nombre, email, teléfono)
- Producto apartado
- Depósito pagado (fecha, Stripe ID)
- Saldo restante
- Fecha de vencimiento
- Timeline de pagos
- Notas internas (editable)

**Acciones:**
- Cancelar apartado manualmente
- Extender plazo (agregar días)
- Ver sesión de Stripe
- Copiar link de seguimiento

### 2.3 Gestión de Producto Apartado
```
Producto con status: reserved
↓
En /admin/products, muestra badge "APARTADO"
↓
No se puede vender hasta que:
  - Se complete el apartado (→ sold)
  - Venza el apartado (→ available)
  - Se cancele manualmente (→ available)
```

---

## 3️⃣ CAMBIOS EN BASE DE DATOS

### 3.1 Nueva Tabla: `layaways`
```sql
CREATE TABLE layaways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Montos
  product_price DECIMAL(10, 2) NOT NULL,      -- Precio total original
  deposit_amount DECIMAL(10, 2) NOT NULL,     -- Depósito (20%)
  balance_amount DECIMAL(10, 2) NOT NULL,     -- Saldo restante (80%)
  currency TEXT DEFAULT 'MXN',
  
  -- Pagos Stripe
  deposit_session_id TEXT,                    -- Stripe session del depósito
  deposit_payment_intent_id TEXT,
  deposit_paid_at TIMESTAMP,
  
  balance_session_id TEXT,                    -- Stripe session del saldo
  balance_payment_intent_id TEXT,
  balance_paid_at TIMESTAMP,
  
  -- Estado y fechas
  status TEXT CHECK (status IN ('active', 'completed', 'expired', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,              -- created_at + 15 días
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Tracking
  layaway_token TEXT UNIQUE NOT NULL,         -- Para /layaway/[token]
  
  -- Admin
  notes TEXT,
  cancelled_by TEXT,                           -- 'admin' o 'system'
  cancellation_reason TEXT,
  
  -- Orden final (cuando se completa)
  order_id UUID REFERENCES orders(id)
);

CREATE INDEX idx_layaways_status ON layaways(status);
CREATE INDEX idx_layaways_expires_at ON layaways(expires_at);
CREATE INDEX idx_layaways_product_id ON layaways(product_id);
CREATE INDEX idx_layaways_token ON layaways(layaway_token);
```

### 3.2 Modificaciones a Tabla `products`
**Ya existe `status` con valores:**
- `available` (compra normal)
- `sold` (vendido)
- `reserved` (apartado o reservado)
- `preorder`
- `hidden`

**No requiere cambios en schema.** Status `reserved` se usa para apartados activos.

### 3.3 Modificaciones a Tabla `orders`
**Agregar campo opcional:**
```sql
ALTER TABLE orders ADD COLUMN layaway_id UUID REFERENCES layaways(id);
```
Esto vincula la orden final con el apartado que la originó (para trazabilidad).

---

## 4️⃣ ENDPOINTS API NECESARIOS

### 4.1 Apartados Públicos (Cliente)

#### `POST /api/layaways/create`
**Body:**
```json
{
  "product_id": "uuid",
  "customer_name": "string",
  "customer_email": "string",
  "customer_phone": "string?"
}
```
**Respuesta:**
```json
{
  "layaway_id": "uuid",
  "checkout_url": "https://checkout.stripe.com/...",
  "deposit_amount": 90000,
  "expires_at": "2026-05-14T...",
  "layaway_token": "abc123..."
}
```
**Lógica:**
1. Validar que producto esté `available`
2. Calcular depósito (20%) y saldo (80%)
3. Crear layaway con status `pending` temporal
4. Crear Stripe Checkout Session (modo `payment`, monto = depósito)
5. Metadata de Stripe: `{ type: 'layaway_deposit', layaway_id: ... }`
6. Retornar checkout URL

#### `GET /api/layaways/track/[layaway_token]`
**Respuesta:**
```json
{
  "layaway": {
    "id": "uuid",
    "product": { "title": "...", "brand": "...", "image": "..." },
    "customer_name": "string",
    "deposit_amount": 90000,
    "balance_amount": 360000,
    "deposit_paid_at": "timestamp",
    "status": "active",
    "created_at": "timestamp",
    "expires_at": "timestamp",
    "days_remaining": 12
  }
}
```

#### `POST /api/layaways/[id]/pay-balance`
**Body:** (vacío, solo trigger)
**Respuesta:**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```
**Lógica:**
1. Verificar layaway.status === 'active'
2. Verificar que no haya vencido
3. Crear Stripe Checkout (monto = balance_amount)
4. Metadata: `{ type: 'layaway_balance', layaway_id: ... }`
5. Retornar checkout URL

### 4.2 Webhooks Stripe

#### Modificar `/api/stripe/webhook`
**Agregar manejo de metadata.type:**

**Caso 1: `layaway_deposit` (pago de depósito)**
```javascript
if (metadata.type === 'layaway_deposit') {
  // 1. Actualizar layaway:
  //    - status: pending → active
  //    - deposit_session_id
  //    - deposit_payment_intent_id
  //    - deposit_paid_at
  // 2. Actualizar producto:
  //    - status: available → reserved
  // 3. (Opcional) Enviar email/notificación
}
```

**Caso 2: `layaway_balance` (pago de saldo)**
```javascript
if (metadata.type === 'layaway_balance') {
  // 1. Actualizar layaway:
  //    - status: active → completed
  //    - balance_session_id
  //    - balance_payment_intent_id
  //    - balance_paid_at
  //    - completed_at
  // 2. Crear orden completa (orders + order_items):
  //    - total = product_price
  //    - payment_status: paid
  //    - status: confirmed
  //    - layaway_id (vínculo)
  //    - generar tracking_token
  // 3. Actualizar producto:
  //    - status: reserved → sold
  // 4. Enviar email con tracking link
}
```

### 4.3 Admin

#### `GET /api/admin/layaways`
**Query params:** `?status=active&sort=expires_at`
**Respuesta:** Array de layaways con datos del producto

#### `GET /api/admin/layaways/[id]`
**Respuesta:** Layaway completo + producto + timeline

#### `PUT /api/admin/layaways/[id]/cancel`
**Body:**
```json
{
  "reason": "Cliente solicitó cancelación"
}
```
**Lógica:**
1. layaway.status → cancelled
2. layaway.cancelled_at → now
3. layaway.cancelled_by → 'admin'
4. layaway.cancellation_reason → reason
5. producto.status: reserved → available

#### `PUT /api/admin/layaways/[id]/extend`
**Body:**
```json
{
  "additional_days": 7
}
```
**Lógica:**
1. layaway.expires_at += additional_days

#### `PUT /api/admin/layaways/[id]/notes`
**Body:**
```json
{
  "notes": "Cliente confirmó pago para el viernes"
}
```

---

## 5️⃣ CAMBIOS EN PRODUCTO PÚBLICO

### 5.1 Página de Producto (`/catalogo/[slug]`)

**Lógica actual:**
```typescript
if (product.status === 'available' && product.stock > 0) {
  return <AddToCartButton />
}
```

**Lógica nueva:**
```typescript
if (product.status === 'available' && product.stock > 0) {
  return (
    <>
      <AddToCartButton />  {/* Compra completa */}
      <LayawayButton product={product} />  {/* Apartado */}
    </>
  )
}

if (product.status === 'reserved') {
  return <ReservedBadge message="Pieza apartada" />
}
```

### 5.2 Componente `LayawayButton`
**Props:** `{ product }`

**UI:**
```jsx
<button className="border-2 border-[#FF69B4] text-[#FF69B4]">
  Apartar con ${depositAmount.toLocaleString()} MXN
  <span className="text-xs">Paga 20% ahora, 80% en 15 días</span>
</button>
```

**onClick:**
1. Abrir modal/drawer con form
2. Pedir: nombre, email, teléfono
3. Mostrar resumen:
   - Depósito: $90k
   - Saldo: $360k
   - Plazo: 15 días
   - Total: $450k
4. Botón "Confirmar apartado"
5. POST /api/layaways/create
6. Redirigir a Stripe Checkout

---

## 6️⃣ CAMBIOS EN CHECKOUT

### 6.1 Checkout Normal (sin cambios)
**Flujo actual:**
- Carrito → Stripe Checkout (pago completo) → Orden → Tracking
- **Se mantiene igual**

### 6.2 Nuevo: Checkout de Apartado
**Diferencias:**
- **No usa carrito** (apartado es 1 producto)
- **Monto = 20%** del precio
- **Metadata diferente** en Stripe
- **Success URL diferente:** `/layaway/success?session_id=...`

**Success page (`/layaway/success`):**
```
✅ Apartado confirmado
Tu depósito de $90,000 fue recibido.

Link de seguimiento:
https://bagclue.vercel.app/layaway/abc123...

Tienes 15 días para pagar el saldo de $360,000
```

---

## 7️⃣ RELACIÓN CON ORDERS/TRACKING ACTUAL

### 7.1 Durante Apartado Activo
**NO se crea orden.**  
Solo existe el registro en `layaways`.

**Tracking:**
- URL: `/layaway/[layaway_token]` (nueva página)
- Header: TrackingHeader simplificado (igual que /track/[token])
- Muestra: estado de apartado, producto, montos, fechas

### 7.2 Cuando se Completa el Apartado
**Se crea orden normal:**
```javascript
const order = await createOrder({
  customer_name: layaway.customer_name,
  customer_email: layaway.customer_email,
  customer_phone: layaway.customer_phone,
  total: layaway.product_price,
  payment_status: 'paid',
  status: 'confirmed',
  stripe_session_id: layaway.balance_session_id,
  stripe_payment_intent_id: layaway.balance_payment_intent_id,
  layaway_id: layaway.id,  // ← vínculo
  items: [{ product_id, quantity: 1, unit_price: layaway.product_price }]
})
```

**Cliente redirigido a:**
```
/track/[tracking_token]  (orden normal)
```

**Admin puede:**
- Procesar envío desde `/admin/orders/[order_id]`
- Ver que vino de apartado (campo `layaway_id`)

### 7.3 Trazabilidad
```
layaway.id → order.layaway_id
```
Permite rastrear:
- Qué órdenes vienen de apartado
- Historial completo del cliente (depósito + saldo)

---

## 8️⃣ CASOS EDGE

### 8.1 Apartado Vencido
**Trigger:** Cron job diario (o cada hora)

**Lógica:**
```sql
UPDATE layaways 
SET status = 'expired'
WHERE status = 'active' 
  AND expires_at < NOW()
RETURNING product_id;

-- Para cada product_id:
UPDATE products 
SET status = 'available' 
WHERE id IN (...);
```

**UI para cliente:**
```
❌ Apartado vencido
Tu apartado venció el 14 May 2026.
El producto volvió a inventario.

Depósito pagado: $90,000
Estado: No reembolsable

¿Quieres apartar otra pieza?
[Ver catálogo]
```

**Política de depósito:** No reembolsable (aclarar en checkout)

### 8.2 Pago de Depósito Fallido
**Trigger:** Webhook de Stripe `payment_intent.payment_failed`

**Lógica:**
```javascript
if (metadata.type === 'layaway_deposit') {
  // 1. layaway sigue en 'pending' (nunca se activó)
  // 2. producto sigue en 'available'
  // 3. Cliente puede reintentar
}
```

**UI:**
```
❌ Pago no procesado
Tu pago de $90,000 no pudo procesarse.

[Reintentar pago]
```

### 8.3 Pago de Saldo Fallido
**Trigger:** Webhook de Stripe `payment_intent.payment_failed`

**Lógica:**
```javascript
if (metadata.type === 'layaway_balance') {
  // 1. layaway sigue en 'active'
  // 2. producto sigue en 'reserved'
  // 3. Cliente puede reintentar mientras no venza
}
```

**UI en /layaway/[token]:**
```
⚠️ Último pago no procesado
Tu pago de $360,000 del 30 Abr no pudo procesarse.

Tienes 12 días restantes para completar el pago.
[Reintentar pago del saldo]
```

### 8.4 Saldo Completado
**Ya cubierto en sección 7.2**

Resumen:
- layaway.status → completed
- producto.status → sold
- Se crea orden
- Cliente ve tracking normal

### 8.5 Cancelación Manual (Admin)
**Trigger:** Admin click "Cancelar apartado"

**Lógica:**
```javascript
// 1. Pedir motivo
// 2. layaway.status → cancelled
// 3. layaway.cancelled_by → 'admin'
// 4. producto.status → available
```

**UI para cliente en /layaway/[token]:**
```
❌ Apartado cancelado
Tu apartado fue cancelado por el equipo.
Motivo: Cliente solicitó cancelación

Depósito: No reembolsable

Contacto: [WhatsApp] [Instagram]
```

### 8.6 Cliente Intenta Apartar Producto Ya Apartado
**Validación en POST /api/layaways/create:**
```javascript
if (product.status !== 'available') {
  return { error: 'Este producto ya no está disponible para apartado' }
}
```

**UI:**
```
❌ Producto no disponible
Esta pieza ya fue apartada por otra clienta.

[Ver productos similares]
```

### 8.7 Múltiples Apartados del Mismo Cliente
**Permitido.** Un cliente puede apartar múltiples piezas.

**Vista en /layaway/[token]:** Solo muestra ese apartado específico.

**Vista en cliente (futuro):** Dashboard con todos sus apartados (no MVP).

### 8.8 Producto Eliminado Durante Apartado
**Protección FK:**
```sql
product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT
```
Admin no puede eliminar producto con apartado activo.

**Alternativa:** Soft delete (campo `deleted_at` en products) y filtrar en queries públicas.

---

## 9️⃣ CRITERIO DE CIERRE

### 9.1 Cliente puede:
- ✅ Ver botón "Apartar" en productos disponibles
- ✅ Pagar depósito (20%) vía Stripe
- ✅ Recibir link de seguimiento `/layaway/[token]`
- ✅ Ver estado del apartado (depósito pagado, saldo pendiente, días restantes)
- ✅ Pagar saldo restante (80%) desde la página de apartado
- ✅ Recibir tracking normal `/track/[token]` al completar
- ✅ Ver mensaje claro si apartado vence

### 9.2 Admin puede:
- ✅ Ver lista de apartados activos en `/admin/layaways`
- ✅ Ver detalle completo de cada apartado
- ✅ Cancelar apartado manualmente
- ✅ Extender plazo (agregar días)
- ✅ Ver notas internas editables
- ✅ Copiar link de seguimiento para enviar a cliente
- ✅ Ver badge "APARTADO" en productos reservados

### 9.3 Sistema:
- ✅ Productos apartados tienen status `reserved`
- ✅ Apartados vencidos regresan producto a `available`
- ✅ Apartados completados crean orden normal
- ✅ Webhooks de Stripe procesan depósito y saldo correctamente
- ✅ No se pueden crear apartados sobre productos no disponibles
- ✅ Trazabilidad completa (layaway_id en orden)

### 9.4 UX:
- ✅ Mensajes claros en cada estado
- ✅ Timeline visual del apartado
- ✅ Botones de acción visibles
- ✅ Política de depósito no reembolsable clara
- ✅ Responsive en mobile

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Tipo | Descripción |
|------------|------|-------------|
| DB | Nueva tabla | `layaways` (14 columnas + índices) |
| DB | Modificación | `orders.layaway_id` (nullable FK) |
| API | Nuevo endpoint | `POST /api/layaways/create` |
| API | Nuevo endpoint | `GET /api/layaways/track/[token]` |
| API | Nuevo endpoint | `POST /api/layaways/[id]/pay-balance` |
| API | Modificación | `/api/stripe/webhook` (nuevos metadata types) |
| API | Nuevos endpoints | Admin layaways (list, detail, cancel, extend, notes) |
| Frontend | Nueva página | `/layaway/[layaway_token]/page.tsx` |
| Frontend | Nueva página | `/layaway/success/page.tsx` |
| Frontend | Nuevo componente | `LayawayButton.tsx` |
| Frontend | Modificación | `/catalogo/[slug]` (agregar botón apartado) |
| Frontend | Nueva página admin | `/admin/layaways/page.tsx` |
| Frontend | Nueva página admin | `/admin/layaways/[id]/page.tsx` |
| Cron | Nuevo job | Detectar apartados vencidos (diario) |

---

## ⏱️ ESTIMACIÓN DE IMPLEMENTACIÓN

**Fase 1 - DB y API (2-3 horas):**
- Crear tabla layaways
- Endpoints públicos
- Modificar webhook Stripe

**Fase 2 - Frontend Cliente (2-3 horas):**
- LayawayButton + modal
- Página /layaway/[token]
- Página /layaway/success

**Fase 3 - Admin (1-2 horas):**
- Lista de apartados
- Detalle de apartado
- Acciones (cancelar, extender, notas)

**Fase 4 - Cron y Testing (1 hora):**
- Cron job vencimientos
- Testing de casos edge

**Total estimado:** 6-9 horas de implementación

---

## 🎯 APROBACIÓN REQUERIDA

**Pendiente de validar:**
1. ✅ Depósito 20% / Saldo 80%
2. ✅ Plazo 15 días
3. ✅ Política de depósito no reembolsable
4. ✅ Flujos de cliente y admin
5. ✅ Manejo de casos edge
6. ✅ Estructura de DB

**Próximo paso:** Esperar aprobación antes de implementar.
