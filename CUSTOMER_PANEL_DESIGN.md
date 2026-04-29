# BAGCLUE CUSTOMER PANEL MVP — DISEÑO TÉCNICO

**Fecha:** 2026-04-29  
**Estado:** DISEÑO - NO IMPLEMENTAR SIN APROBACIÓN  
**Contexto:** Panel de cliente para e-commerce de lujo (bolsas, cinturones, zapatos, joyas)

---

## 1. UX DEL PANEL

### 1.1 Estructura de navegación

```
┌─────────────────────────────────────────┐
│  BAGCLUE                    Mi Cuenta  │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────┐  ┌──────────────────┐  │
│  │            │  │ Mi Cuenta        │  │
│  │  Sidebar   │  │                  │  │
│  │            │  │ ┌──────────────┐ │  │
│  │ • Resumen  │  │ │ Contenido    │ │  │
│  │ • Pedidos  │  │ │ principal    │ │  │
│  │ • Apartados│  │ │              │ │  │
│  │ • Envíos   │  │ │              │ │  │
│  │ • Perfil   │  │ │              │ │  │
│  │ • Soporte  │  │ └──────────────┘ │  │
│  │            │  │                  │  │
│  └────────────┘  └──────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### 1.2 Páginas del panel

#### 1.2.1 Dashboard (Resumen)
- Bienvenida personalizada
- Último pedido (estado + tracking)
- Apartados activos (resumen)
- CTA: "Ver catálogo" / "Continuar comprando"

**Mockup visual:**
```
┌──────────────────────────────────────────┐
│ Hola, Jhonatan 👋                        │
├──────────────────────────────────────────┤
│ Tu última compra                         │
│ ┌──────────────────────────────────────┐ │
│ │ Chanel Classic Flap                  │ │
│ │ Pedido #12345                        │ │
│ │ Estado: En camino 📦                 │ │
│ │ DHL: 1234567890 → [Ver tracking]    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Apartados activos (2)                    │
│ ┌──────────────────────────────────────┐ │
│ │ Hermès Birkin 30                     │ │
│ │ $450,000 MXN                         │ │
│ │ Pagado: $135,000 (30%)               │ │
│ │ Próximo pago: 15 Mayo → [Pagar]     │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### 1.2.2 Mis Pedidos
- Lista de pedidos (más reciente primero)
- Filtros: Todos / En proceso / Completados / Cancelados
- Por cada pedido:
  - Thumbnail del producto
  - Nombre del producto
  - Orden ID
  - Fecha
  - Total
  - Estado (pending, confirmed, shipped, delivered, cancelled)
  - CTA: "Ver detalle"

**Vista:**
```
┌──────────────────────────────────────────┐
│ Mis Pedidos                              │
│ [Todos] [En proceso] [Completados]       │
├──────────────────────────────────────────┤
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Chanel Classic Flap                │ │
│ │ │ #12345 • 20 Abr 2026               │ │
│ │ │ $189,000 MXN                       │ │
│ │ │ 🚚 En camino → [Ver detalle]       │ │
│ └─┴────────────────────────────────────┘ │
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Louis Vuitton Speedy 30            │ │
│ │ │ #12344 • 15 Abr 2026               │ │
│ │ │ $95,000 MXN                        │ │
│ │ │ ✅ Entregado → [Ver detalle]       │ │
│ └─┴────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### 1.2.3 Detalle de Pedido
- Info de la orden
  - Orden ID
  - Fecha
  - Estado
  - Payment status
  - Total
- Productos comprados (thumbnail, nombre, precio)
- Dirección de envío
- Método de pago usado
- Tracking info (si aplica)
- Timeline del pedido:
  - ✅ Pedido confirmado
  - ✅ Pago recibido
  - ✅ Enviado
  - 🔄 En camino
  - ⏸️ Entregado
- CTA: "Descargar factura" (futuro), "Contactar soporte"

**Vista:**
```
┌──────────────────────────────────────────┐
│ ← Volver    Pedido #12345                │
├──────────────────────────────────────────┤
│ Estado: En camino 🚚                     │
│ Fecha: 20 Abr 2026                       │
│                                          │
│ Producto:                                │
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Chanel Classic Flap Negro          │ │
│ │ │ $189,000 MXN                       │ │
│ └─┴────────────────────────────────────┘ │
│                                          │
│ Envío a:                                 │
│ Av. Reforma 123, CDMX                    │
│                                          │
│ Tracking: DHL 1234567890                 │
│ [Ver tracking completo →]                │
│                                          │
│ Timeline:                                │
│ ✅ Pedido confirmado - 20 Abr, 10:30    │
│ ✅ Pago recibido - 20 Abr, 10:31         │
│ ✅ Enviado - 21 Abr, 14:00               │
│ 🔄 En camino - 22 Abr, 09:15             │
│ ⏸️ Entregado - Estimado 25 Abr          │
│                                          │
│ [Contactar soporte]                      │
└──────────────────────────────────────────┘
```

#### 1.2.4 Mis Apartados
- Lista de apartados activos
- Por cada apartado:
  - Thumbnail del producto
  - Nombre
  - Precio total
  - Monto pagado
  - % completado
  - Próximo pago (fecha + monto)
  - CTA: "Pagar cuota" / "Ver detalle"
- Historial de pagos

**Vista:**
```
┌──────────────────────────────────────────┐
│ Mis Apartados                            │
├──────────────────────────────────────────┤
│ Apartados activos (2)                    │
│                                          │
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Hermès Birkin 30 Gold              │ │
│ │ │ Total: $450,000 MXN                │ │
│ │ │ Pagado: $135,000 (30%)             │ │
│ │ │ ▓▓▓░░░░░░░ 30%                     │ │
│ │ │ Próximo pago: $45,000 • 15 Mayo    │ │
│ │ │ [Pagar cuota] [Ver detalle]        │ │
│ └─┴────────────────────────────────────┘ │
│                                          │
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Louis Vuitton Neverfull            │ │
│ │ │ Total: $120,000 MXN                │ │
│ │ │ Pagado: $60,000 (50%)              │ │
│ │ │ ▓▓▓▓▓░░░░░ 50%                     │ │
│ │ │ Próximo pago: $30,000 • 1 Mayo     │ │
│ │ │ [Pagar cuota] [Ver detalle]        │ │
│ └─┴────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### 1.2.5 Detalle de Apartado
- Producto apartado (imagen, nombre, precio)
- Plan de pagos:
  - Enganche
  - Cuotas (monto, fecha, estado: pagado/pendiente)
  - Total pagado
  - Saldo pendiente
- Historial de pagos (fecha, monto, método)
- CTA: "Pagar cuota" (si hay pendiente)
- Política de apartado (link o texto)

**Vista:**
```
┌──────────────────────────────────────────┐
│ ← Volver    Apartado #AP-001             │
├──────────────────────────────────────────┤
│ ┌─┬────────────────────────────────────┐ │
│ │█│ Hermès Birkin 30 Gold              │ │
│ │ │ $450,000 MXN                       │ │
│ └─┴────────────────────────────────────┘ │
│                                          │
│ Plan de pagos (10 quincenas):            │
│ Enganche: $90,000 (20%)                  │
│ 9 cuotas de $40,000 c/u                  │
│                                          │
│ ✅ Cuota 1: $90,000 - 1 Abr (Enganche)  │
│ ✅ Cuota 2: $40,000 - 15 Abr             │
│ ✅ Cuota 3: $40,000 - 30 Abr             │
│ 🔲 Cuota 4: $40,000 - 15 Mayo (próxima) │
│ 🔲 Cuota 5: $40,000 - 30 Mayo            │
│ ...                                      │
│                                          │
│ Pagado: $170,000 (37.7%)                 │
│ Saldo: $280,000                          │
│                                          │
│ [Pagar cuota siguiente: $40,000]         │
│                                          │
│ Historial de pagos:                      │
│ • $40,000 - 30 Abr - Stripe ****1234     │
│ • $40,000 - 15 Abr - Stripe ****1234     │
│ • $90,000 - 1 Abr - Stripe ****1234      │
└──────────────────────────────────────────┘
```

#### 1.2.6 Envíos y Tracking
- Lista de envíos activos
- Por cada envío:
  - Orden relacionada
  - Paquetería (DHL/FedEx)
  - Guía de rastreo
  - Estado (en tránsito, entregado, etc.)
  - Fecha estimada de entrega
  - CTA: "Ver tracking en DHL/FedEx" (link externo)
- Integración con API DHL/FedEx (futuro: polling automático)

**Vista:**
```
┌──────────────────────────────────────────┐
│ Mis Envíos                               │
├──────────────────────────────────────────┤
│ Envíos activos (1)                       │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Pedido #12345 - Chanel Classic Flap│   │
│ │ 🚚 DHL Express                      │   │
│ │ Guía: 1234567890                    │   │
│ │ Estado: En tránsito                 │   │
│ │ Entrega estimada: 25 Abr 2026       │   │
│ │ [Ver en DHL →]                      │   │
│ └────────────────────────────────────┘   │
│                                          │
│ Envíos completados (3)                   │
│ ┌────────────────────────────────────┐   │
│ │ Pedido #12344 - LV Speedy 30       │   │
│ │ ✅ FedEx                            │   │
│ │ Entregado: 18 Abr 2026              │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

#### 1.2.7 Perfil / Mi Cuenta
- Información personal
  - Nombre
  - Email
  - Teléfono
- Dirección de envío por defecto
- Cambiar contraseña (futuro)
- CTA: "Editar información"

**Vista:**
```
┌──────────────────────────────────────────┐
│ Mi Cuenta                                │
├──────────────────────────────────────────┤
│ Información personal                     │
│ Nombre: Jhonatan Venegas                 │
│ Email: jho190@gmail.com                  │
│ Teléfono: +52 55 1234 5678               │
│ [Editar]                                 │
│                                          │
│ Dirección de envío                       │
│ Av. Reforma 123, Col. Juárez             │
│ CDMX, 06600, México                      │
│ [Editar]                                 │
│                                          │
│ Seguridad                                │
│ [Cambiar contraseña]                     │
└──────────────────────────────────────────┘
```

#### 1.2.8 Soporte / Contacto
- Formulario de contacto
- WhatsApp directo (link)
- Instagram directo (link)
- Email: soporte@bagclue.com
- Teléfono
- Políticas:
  - Envíos
  - Apartados
  - Devoluciones
  - Privacidad

**Vista:**
```
┌──────────────────────────────────────────┐
│ Soporte y Contacto                       │
├──────────────────────────────────────────┤
│ ¿En qué podemos ayudarte?                │
│                                          │
│ Contáctanos:                             │
│ 💬 WhatsApp: +52 55 1234 5678            │
│ 📷 Instagram: @bagclue                   │
│ 📧 Email: soporte@bagclue.com            │
│ 📞 Teléfono: +52 55 1234 5678            │
│                                          │
│ Políticas:                               │
│ • Política de envíos                     │
│ • Política de apartados                  │
│ • Política de devoluciones               │
│ • Política de privacidad                 │
└──────────────────────────────────────────┘
```

---

## 2. RUTAS NECESARIAS

### 2.1 Rutas frontend (Next.js App Router)

```
/account                           → Dashboard (protegido)
/account/orders                    → Lista de pedidos
/account/orders/[id]               → Detalle de pedido
/account/layaway                   → Mis apartados
/account/layaway/[id]              → Detalle de apartado
/account/layaway/[id]/pay          → Pagar cuota de apartado
/account/shipping                  → Envíos y tracking
/account/profile                   → Mi cuenta / perfil
/account/support                   → Soporte

/login                             → Login (email + password)
/register                          → Registro
/forgot-password                   → Recuperar contraseña

/catalogo/[slug]?action=layaway    → Iniciar apartado desde producto
```

### 2.2 Rutas API necesarias

**Auth:**
```
POST   /api/auth/register          → Crear cuenta
POST   /api/auth/login             → Login
POST   /api/auth/logout            → Logout
POST   /api/auth/forgot-password   → Solicitar reset password
POST   /api/auth/reset-password    → Resetear password con token
GET    /api/auth/me                → Usuario actual
```

**Orders (existente, extender):**
```
GET    /api/orders                 → Mis órdenes (requiere auth)
GET    /api/orders/[id]            → Detalle de orden
```

**Layaway (nuevo):**
```
POST   /api/layaway/create         → Crear apartado
GET    /api/layaway                → Mis apartados
GET    /api/layaway/[id]           → Detalle de apartado
POST   /api/layaway/[id]/pay       → Pagar cuota de apartado
GET    /api/layaway/[id]/payments  → Historial de pagos del apartado
```

**Shipping (nuevo):**
```
GET    /api/shipping               → Mis envíos
GET    /api/shipping/[id]          → Detalle de envío
GET    /api/shipping/[id]/track    → Tracking info (proxy a DHL/FedEx)
```

**Profile (nuevo):**
```
GET    /api/profile                → Información del usuario
PUT    /api/profile                → Actualizar perfil
PUT    /api/profile/address        → Actualizar dirección de envío
POST   /api/profile/change-password → Cambiar contraseña
```

---

## 3. CAMBIOS DB NECESARIOS

### 3.1 Nueva tabla: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcrypt
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 3.2 Nueva tabla: `user_addresses`

```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  street_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'México',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);
```

### 3.3 Modificar tabla: `orders`

```sql
-- Agregar user_id a orders (para vincular con cuenta)
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Agregar shipping_address_id (opcional, o guardar snapshot)
ALTER TABLE orders ADD COLUMN shipping_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL;

-- Agregar campos de envío
ALTER TABLE orders ADD COLUMN shipping_carrier TEXT;  -- 'dhl', 'fedex'
ALTER TABLE orders ADD COLUMN shipping_tracking_number TEXT;
ALTER TABLE orders ADD COLUMN shipping_status TEXT;  -- 'pending', 'in_transit', 'delivered'
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ;

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_tracking ON orders(shipping_tracking_number);
```

### 3.4 Nueva tabla: `layaway_plans`

```sql
CREATE TABLE layaway_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Precio y plan
  product_price DECIMAL(10,2) NOT NULL,  -- Precio al momento del apartado
  down_payment DECIMAL(10,2) NOT NULL,   -- Enganche
  installment_amount DECIMAL(10,2) NOT NULL,  -- Monto de cada cuota
  installments_count INT NOT NULL,       -- Número de cuotas (sin contar enganche)
  payment_frequency TEXT NOT NULL,       -- 'weekly', 'biweekly', 'monthly'
  
  -- Estado
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'cancelled', 'defaulted'
  total_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2),
  
  -- Fechas
  start_date DATE NOT NULL,
  next_payment_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Snapshot del producto (por si cambia después)
  product_snapshot JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_layaway_user ON layaway_plans(user_id);
CREATE INDEX idx_layaway_product ON layaway_plans(product_id);
CREATE INDEX idx_layaway_status ON layaway_plans(status);
```

### 3.5 Nueva tabla: `layaway_payments`

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_plan_id UUID NOT NULL REFERENCES layaway_plans(id) ON DELETE CASCADE,
  
  -- Pago
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,  -- 'stripe', 'cash', 'transfer'
  stripe_payment_intent_id TEXT,
  
  -- Estado
  status TEXT DEFAULT 'completed',  -- 'completed', 'failed', 'refunded'
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_layaway_payments_plan ON layaway_payments(layaway_plan_id);
CREATE INDEX idx_layaway_payments_date ON layaway_payments(created_at DESC);
```

### 3.6 Nueva tabla: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
```

### 3.7 Nueva tabla: `order_timeline_events`

```sql
CREATE TABLE order_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'created', 'paid', 'shipped', 'delivered', 'cancelled'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_order ON order_timeline_events(order_id);
CREATE INDEX idx_timeline_date ON order_timeline_events(created_at DESC);
```

---

## 4. FLUJO DE COMPRA DE CONTADO (ya existe, refinar)

**Estado actual:**
- ✅ Producto → Carrito → Checkout → Stripe → Success
- ✅ Orden se crea con `payment_status=pending`
- ✅ Webhook actualiza a `paid` (con fallback en success page)
- ✅ Producto se marca `sold`

**Mejoras necesarias:**

### 4.1 Vincular orden con usuario

**Cambio en `/api/checkout/create-session`:**
```typescript
// Si el usuario está logueado, vincular orden
if (session?.user?.id) {
  await supabase
    .from('orders')
    .update({ user_id: session.user.id })
    .eq('id', order_id)
}
```

### 4.2 Guardar dirección de envío

**En el checkout form:**
- Si usuario está logueado → precarga dirección guardada
- Si no → formulario manual (igual que ahora)
- Opción: "Guardar esta dirección" (si está logueado)

**Después del pago:**
- Guardar dirección en `user_addresses` (si usuario marcó checkbox)
- Vincular `shipping_address_id` en la orden

### 4.3 Timeline de la orden

**Al crear orden:**
```sql
INSERT INTO order_timeline_events (order_id, event_type, description)
VALUES (order_id, 'created', 'Pedido creado');
```

**Al confirmar pago:**
```sql
INSERT INTO order_timeline_events (order_id, event_type, description)
VALUES (order_id, 'paid', 'Pago recibido');
```

**Al enviar:**
```sql
INSERT INTO order_timeline_events (order_id, event_type, description, metadata)
VALUES (
  order_id, 
  'shipped', 
  'Pedido enviado vía DHL', 
  '{"carrier": "dhl", "tracking": "1234567890"}'
);
```

---

## 5. FLUJO DE APARTADO (nuevo)

### 5.1 Iniciar apartado desde producto

**Usuario hace click en "Apartar este producto"** (nuevo botón en `/catalogo/[slug]`)

**Flujo:**

1. **Redirigir a `/account/layaway/new?product=[id]`** (si no está logueado → `/login?redirect=...`)

2. **Formulario de apartado:**
   ```
   Producto: Hermès Birkin 30 Gold
   Precio: $450,000 MXN
   
   Plan de apartado:
   [ ] Enganche 20% ($90,000) + 9 quincenas de $40,000
   [ ] Enganche 30% ($135,000) + 7 quincenas de $45,000
   [ ] Enganche 50% ($225,000) + 5 quincenas de $45,000
   
   Primera cuota (enganche): $90,000
   Fecha de inicio: [hoy]
   Frecuencia de pago: Quincenal
   
   [Confirmar y pagar enganche]
   ```

3. **Validación backend (`POST /api/layaway/create`):**
   - Producto disponible (`status=available`)
   - Precio correcto
   - Plan válido (20-50% enganche, máximo 12 cuotas)
   - Usuario autenticado

4. **Crear layaway_plan:**
   ```sql
   INSERT INTO layaway_plans (
     user_id, product_id, product_price, 
     down_payment, installment_amount, installments_count,
     payment_frequency, status, balance, start_date, next_payment_date
   ) VALUES (...)
   ```

5. **Marcar producto como `reserved` (no `sold`):**
   ```sql
   UPDATE products 
   SET status = 'reserved' 
   WHERE id = product_id
   ```

6. **Crear Stripe Checkout Session para enganche:**
   ```typescript
   const session = await stripe.checkout.sessions.create({
     line_items: [{
       price_data: {
         currency: 'mxn',
         product_data: { name: 'Enganche - Hermès Birkin 30' },
         unit_amount: 9000000  // $90,000 en centavos
       },
       quantity: 1
     }],
     mode: 'payment',
     metadata: {
       layaway_plan_id: plan.id,
       payment_type: 'down_payment'
     },
     success_url: `${BASE_URL}/account/layaway/${plan.id}?payment=success`,
     cancel_url: `${BASE_URL}/account/layaway/${plan.id}?payment=cancelled`
   })
   ```

7. **Webhook Stripe confirma pago:**
   ```typescript
   // En /api/stripe/webhook
   if (session.metadata.payment_type === 'down_payment') {
     const planId = session.metadata.layaway_plan_id
     
     // Registrar pago
     await supabase.from('layaway_payments').insert({
       layaway_plan_id: planId,
       amount: session.amount_total / 100,
       payment_method: 'stripe',
       stripe_payment_intent_id: session.payment_intent,
       status: 'completed'
     })
     
     // Actualizar plan
     await supabase.from('layaway_plans').update({
       total_paid: down_payment,
       balance: product_price - down_payment,
       next_payment_date: calculateNextPaymentDate(start_date, 'biweekly')
     }).eq('id', planId)
   }
   ```

8. **Redirigir a `/account/layaway/[id]`** → ver plan de pagos

### 5.2 Pagar cuota de apartado

**Usuario hace click en "Pagar cuota"** en `/account/layaway/[id]`

**Flujo:**

1. **Validación:**
   - Plan activo (`status=active`)
   - Hay saldo pendiente (`balance > 0`)
   - Usuario es dueño del plan

2. **Crear Stripe Checkout Session:**
   ```typescript
   const session = await stripe.checkout.sessions.create({
     line_items: [{
       price_data: {
         currency: 'mxn',
         product_data: { name: `Cuota apartado - ${product.title}` },
         unit_amount: installment_amount * 100
       },
       quantity: 1
     }],
     mode: 'payment',
     metadata: {
       layaway_plan_id: plan.id,
       payment_type: 'installment'
     },
     success_url: `${BASE_URL}/account/layaway/${plan.id}?payment=success`,
     cancel_url: `${BASE_URL}/account/layaway/${plan.id}?payment=cancelled`
   })
   ```

3. **Webhook confirma pago:**
   ```typescript
   // Registrar pago
   await supabase.from('layaway_payments').insert(...)
   
   // Actualizar plan
   const newTotalPaid = total_paid + installment_amount
   const newBalance = balance - installment_amount
   
   await supabase.from('layaway_plans').update({
     total_paid: newTotalPaid,
     balance: newBalance,
     next_payment_date: newBalance > 0 
       ? calculateNextPaymentDate(today, 'biweekly')
       : null,
     status: newBalance === 0 ? 'completed' : 'active',
     completed_at: newBalance === 0 ? new Date() : null
   }).eq('id', planId)
   ```

4. **Si apartado completado (`balance = 0`):**
   ```typescript
   // Crear orden automáticamente
   const order = await supabase.from('orders').insert({
     user_id: plan.user_id,
     customer_email: user.email,
     total: plan.product_price,
     status: 'confirmed',
     payment_status: 'paid',
     notes: `Apartado completado - Plan #${plan.id}`
   }).select().single()
   
   // Crear order_item
   await supabase.from('order_items').insert({
     order_id: order.id,
     product_id: plan.product_id,
     quantity: 1,
     unit_price: plan.product_price
   })
   
   // Marcar producto como SOLD (ya no reserved)
   await supabase.from('products').update({
     status: 'sold',
     stock: 0
   }).eq('id', plan.product_id)
   
   // Notificar al cliente
   // TODO: enviar email "¡Tu apartado está completo! Procederemos al envío."
   ```

### 5.3 Políticas de apartado

**Reglas de negocio:**
- Enganche mínimo: 20%
- Enganche máximo: 50%
- Plazo máximo: 12 cuotas (6 meses quincenal)
- Frecuencia: semanal, quincenal, mensual
- Si se atrasa 2 pagos consecutivos → `status=defaulted` (producto liberado)
- Producto queda `reserved` hasta completar apartado
- No se puede cancelar apartado después del enganche (política estricta)

---

## 6. FLUJO DE ENVÍO DHL/FedEx

### 6.1 Crear envío (admin interno)

**Manual (por ahora):**

1. Admin en `/admin/orders/[id]` → botón "Marcar como enviado"

2. Formulario:
   ```
   Paquetería: [DHL] [FedEx]
   Número de guía: ___________
   Fecha de envío: [hoy]
   Fecha estimada de entrega: [+3 días]
   
   [Confirmar envío]
   ```

3. Backend actualiza orden:
   ```sql
   UPDATE orders SET
     status = 'shipped',
     shipping_carrier = 'dhl',
     shipping_tracking_number = '1234567890',
     shipping_status = 'in_transit',
     shipped_at = NOW()
   WHERE id = order_id;
   ```

4. Crear evento timeline:
   ```sql
   INSERT INTO order_timeline_events (order_id, event_type, description, metadata)
   VALUES (
     order_id,
     'shipped',
     'Pedido enviado vía DHL',
     '{"carrier": "dhl", "tracking": "1234567890"}'
   );
   ```

5. **Enviar email al cliente** (futuro):
   ```
   Subject: 🚚 Tu pedido está en camino
   
   Hola [nombre],
   
   Tu pedido #12345 ha sido enviado.
   
   Paquetería: DHL
   Guía de rastreo: 1234567890
   Entrega estimada: 25 Abr 2026
   
   Rastrea tu pedido: [Ver tracking]
   ```

### 6.2 Tracking del envío (cliente)

**Usuario en `/account/shipping`** ve sus envíos activos.

**Usuario hace click en "Ver en DHL":**
- Link externo a DHL/FedEx con guía de rastreo
- Ejemplo: `https://www.dhl.com.mx/es/express/rastreo.html?AWB=1234567890`

**Futuro (opcional - API DHL/FedEx):**
- Endpoint `/api/shipping/[id]/track`
- Consulta API de DHL/FedEx
- Devuelve estado actual + timeline del envío
- Actualiza `shipping_status` automáticamente

### 6.3 Marcar como entregado

**Manual (por ahora):**
1. Admin en `/admin/orders/[id]` → botón "Marcar como entregado"
2. Backend:
   ```sql
   UPDATE orders SET
     status = 'delivered',
     shipping_status = 'delivered',
     delivered_at = NOW()
   WHERE id = order_id;
   ```

**Futuro (automático):**
- Webhook de DHL/FedEx notifica entrega
- Endpoint `/api/webhooks/shipping/[carrier]`
- Actualiza automáticamente

---

## 7. QUÉ SE IMPLEMENTA PRIMERO (priorización)

### FASE 1: Auth + Panel Básico (1-2 días)
**Objetivo:** Usuario puede ver sus órdenes existentes.

1. ✅ DB: Crear tabla `users`
2. ✅ API: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
3. ✅ Middleware: `requireAuth` para proteger rutas
4. ✅ Frontend: `/login`, `/register`
5. ✅ Frontend: `/account` (dashboard básico)
6. ✅ Frontend: `/account/orders` (lista)
7. ✅ Frontend: `/account/orders/[id]` (detalle)
8. ✅ API: Modificar `/api/orders` para filtrar por `user_id`
9. ✅ Vincular órdenes existentes a usuarios (migración opcional)

**Criterio de cierre Fase 1:**
- Usuario puede registrarse
- Usuario puede hacer login
- Usuario logueado puede ver sus órdenes
- Usuario puede ver detalle de una orden

---

### FASE 2: Apartados (2-3 días)
**Objetivo:** Usuario puede apartar productos y pagar cuotas.

1. ✅ DB: Crear tablas `layaway_plans`, `layaway_payments`
2. ✅ API: `/api/layaway/create`, `/api/layaway`, `/api/layaway/[id]`, `/api/layaway/[id]/pay`
3. ✅ Frontend: Botón "Apartar" en `/catalogo/[slug]`
4. ✅ Frontend: `/account/layaway/new?product=[id]` (formulario apartado)
5. ✅ Frontend: `/account/layaway` (lista de apartados)
6. ✅ Frontend: `/account/layaway/[id]` (detalle + historial)
7. ✅ Frontend: Botón "Pagar cuota" → Stripe Checkout
8. ✅ Webhook: Manejar pagos de apartado (`payment_type=installment`)
9. ✅ Lógica: Completar apartado → crear orden automática
10. ✅ Marcar producto `reserved` → `sold` al completar

**Criterio de cierre Fase 2:**
- Usuario puede iniciar apartado desde producto
- Usuario puede ver plan de pagos
- Usuario puede pagar cuotas vía Stripe
- Apartado completado crea orden automáticamente
- Producto pasa de `reserved` a `sold`

---

### FASE 3: Envíos y Tracking (1-2 días)
**Objetivo:** Usuario puede ver estado de envío y tracking.

1. ✅ DB: Modificar tabla `orders` (agregar campos shipping)
2. ✅ DB: Crear tabla `order_timeline_events`
3. ✅ API: `/api/shipping`, `/api/shipping/[id]`
4. ✅ Frontend: `/account/shipping` (lista de envíos)
5. ✅ Admin: Formulario "Marcar como enviado" en `/admin/orders/[id]`
6. ✅ Admin: Botón "Marcar como entregado"
7. ✅ Frontend: Timeline en `/account/orders/[id]`
8. ✅ Frontend: Link externo a DHL/FedEx para tracking

**Criterio de cierre Fase 3:**
- Admin puede marcar orden como enviada (manual)
- Usuario ve estado de envío en su panel
- Usuario puede ver timeline del pedido
- Usuario puede hacer click y ver tracking en DHL/FedEx

---

### FASE 4: Perfil + Soporte (1 día)
**Objetivo:** Usuario puede editar su información.

1. ✅ DB: Crear tabla `user_addresses`
2. ✅ API: `/api/profile`, `/api/profile/address`
3. ✅ Frontend: `/account/profile` (ver + editar)
4. ✅ Frontend: `/account/support` (contacto + políticas)
5. ✅ Checkout: Precarga dirección si usuario está logueado
6. ✅ Checkout: Opción "Guardar esta dirección"

**Criterio de cierre Fase 4:**
- Usuario puede editar su información personal
- Usuario puede guardar/editar dirección de envío
- Checkout precarga dirección guardada
- Usuario puede contactar soporte desde panel

---

### FASE 5 (FUTURO - NO IMPLEMENTAR TODAVÍA):
- Cambiar contraseña
- Recuperar contraseña (email)
- API de tracking DHL/FedEx (polling automático)
- Webhooks DHL/FedEx
- Email notifications
- Wishlist
- Reviews
- Sistema de puntos
- Facturación automática
- Devoluciones

---

## 8. CRITERIO DE CIERRE GENERAL

### MVP completo = Fases 1-4 implementadas

**Checklist final:**

**Auth:**
- ✅ Usuario puede registrarse
- ✅ Usuario puede hacer login/logout
- ✅ Sesión persiste (cookie segura)

**Panel de cliente:**
- ✅ Dashboard muestra resumen de actividad
- ✅ Usuario ve lista de pedidos (filtros básicos)
- ✅ Usuario ve detalle de pedido con timeline
- ✅ Usuario ve lista de apartados activos
- ✅ Usuario ve detalle de apartado con plan de pagos
- ✅ Usuario puede pagar cuota de apartado vía Stripe
- ✅ Usuario ve lista de envíos y tracking
- ✅ Usuario puede editar su perfil y dirección
- ✅ Usuario puede contactar soporte

**Apartados:**
- ✅ Usuario puede iniciar apartado desde producto
- ✅ Producto queda `reserved` al iniciar apartado
- ✅ Pagos de cuotas se registran correctamente
- ✅ Apartado completado crea orden automática
- ✅ Producto pasa a `sold` al completar apartado

**Envíos:**
- ✅ Admin puede marcar orden como enviada
- ✅ Usuario ve número de tracking
- ✅ Usuario puede ver tracking externo (link DHL/FedEx)
- ✅ Timeline de orden se actualiza correctamente

**UX:**
- ✅ Diseño consistente con estilo Bagclue (elegante, minimalista)
- ✅ Responsive (mobile-first)
- ✅ Navegación clara entre secciones del panel
- ✅ Loading states en requests
- ✅ Error handling visible

**Seguridad:**
- ✅ Rutas protegidas requieren autenticación
- ✅ Usuario solo ve sus propias órdenes/apartados
- ✅ Passwords hasheados (bcrypt)
- ✅ Cookies httpOnly + secure
- ✅ Validación backend en todos los endpoints

---

## 9. NOTAS TÉCNICAS

### 9.1 Auth implementation

**Usar NextAuth.js o implementar custom:**
- Opción A: NextAuth.js (más rápido, menos control)
- Opción B: Custom JWT + httpOnly cookies (más control)

**Recomendación:** Custom JWT para control total sobre UX de login.

**Session cookie:**
```typescript
// httpOnly, secure, sameSite=lax
res.setHeader('Set-Cookie', 
  serialize('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/'
  })
)
```

### 9.2 Middleware de autenticación

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (request.nextUrl.pathname.startsWith('/account')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Validar JWT
    try {
      const user = await verifyJWT(sessionCookie.value)
      // Pasar user a request headers para usar en API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*']
}
```

### 9.3 Estructura de componentes

```
src/
├── app/
│   ├── account/
│   │   ├── layout.tsx              # Layout del panel (sidebar)
│   │   ├── page.tsx                # Dashboard
│   │   ├── orders/
│   │   │   ├── page.tsx            # Lista de pedidos
│   │   │   └── [id]/page.tsx       # Detalle de pedido
│   │   ├── layaway/
│   │   │   ├── page.tsx            # Lista de apartados
│   │   │   ├── [id]/page.tsx       # Detalle de apartado
│   │   │   ├── [id]/pay/page.tsx   # Pagar cuota
│   │   │   └── new/page.tsx        # Crear apartado
│   │   ├── shipping/
│   │   │   └── page.tsx            # Envíos y tracking
│   │   ├── profile/
│   │   │   └── page.tsx            # Perfil
│   │   └── support/
│   │       └── page.tsx            # Soporte
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       ├── orders/
│       ├── layaway/
│       ├── shipping/
│       └── profile/
├── components/
│   ├── account/
│   │   ├── AccountSidebar.tsx
│   │   ├── OrderCard.tsx
│   │   ├── LayawayCard.tsx
│   │   ├── LayawayProgressBar.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── ShippingCard.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
└── lib/
    ├── auth.ts                     # JWT utils
    ├── supabase-admin.ts           # Existing
    └── layaway.ts                  # Layaway business logic
```

### 9.4 Validaciones importantes

**Apartados:**
- Validar que producto esté disponible antes de crear plan
- Validar que enganche esté entre 20-50%
- Validar que usuario sea dueño del plan antes de pagar cuota
- Prevenir doble pago (idempotencia)

**Órdenes:**
- Usuario solo puede ver sus propias órdenes
- Admin puede ver todas

**Productos:**
- `reserved` = apartado activo (no se puede comprar de contado)
- `sold` = apartado completado o compra directa

---

## 10. RESUMEN EJECUTIVO

### Stack final:
- **Frontend:** Next.js 16 + React 19 + Tailwind (existente)
- **Backend:** Next.js API Routes + Supabase PostgreSQL (existente)
- **Auth:** Custom JWT + httpOnly cookies
- **Pagos:** Stripe Checkout (existente, extender para apartados)
- **DB:** Supabase PostgreSQL + 6 tablas nuevas
- **Envíos:** Manual (admin marca enviado) + links externos DHL/FedEx

### Timeline estimado:
- **Fase 1 (Auth + Panel básico):** 1-2 días
- **Fase 2 (Apartados):** 2-3 días
- **Fase 3 (Envíos):** 1-2 días
- **Fase 4 (Perfil):** 1 día
- **Total MVP:** 5-8 días

### Riesgos:
- Complejidad de lógica de apartados (cálculo de cuotas, fechas)
- Manejo de estados de productos (available/reserved/sold)
- Sincronización entre apartado completado → orden creada
- UX de tracking (DHL/FedEx sin API es menos elegante)

### Beneficios:
- Cliente tiene visibilidad total de sus compras
- Sistema de apartado automatizado reduce fricción
- Tracking de envíos mejora experiencia post-compra
- Fundación para features futuros (wishlist, reviews, etc.)

---

**FIN DEL DISEÑO TÉCNICO**

**NO IMPLEMENTAR SIN APROBACIÓN EXPLÍCITA**

Siguiente paso: Revisar diseño → aprobar → implementar Fase 1.
