# BAGCLUE PAYMENT METHODS — MXN Bank Transfer + USD Stripe
**Scope Técnico — Dual Payment Methods**  
**Fecha:** 2026-05-06  
**Status:** 📋 SCOPE PREPARADO — NO IMPLEMENTAR hasta aprobación

---

## 🎯 OBJETIVO

Habilitar 2 métodos de pago en Bagclue:

1. **Transferencia bancaria SPEI (MXN)** — México (manual)
2. **Stripe Checkout (USD)** — Internacional (automático)

Aplica para:
- ✅ Compra completa (pago único)
- ✅ Apartado / planes de pago (cuotas)

---

## 🔍 AUDITORÍA SISTEMA ACTUAL

### 1. DB Schema — Tabla `orders`

**Estructura actual** (database.ts):
```typescript
interface Order {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus  // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: PaymentStatus  // 'pending' | 'paid' | 'failed' | 'refunded'
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

**Campos FALTANTES:**
- ❌ `payment_method` (bank_transfer_mxn | stripe_usd)
- ❌ `currency` (MXN | USD)
- ❌ `exchange_rate` (tasa de cambio si USD)
- ❌ `bank_payment_reference` (referencia única para transferencia)
- ❌ `bank_payment_proof_url` (URL del comprobante subido)
- ❌ `bank_payment_verified_at` (timestamp validación admin)
- ❌ `bank_payment_verified_by` (admin user_id que validó)

---

### 2. DB Schema — Tabla `layaways`

**Estructura actual** (migration 018):
```sql
plan_type TEXT (cash | 4_weekly_payments | 8_weekly_payments | 18_weekly_payments)
total_amount NUMERIC(10, 2)
amount_paid NUMERIC(10, 2)
amount_remaining NUMERIC(10, 2)
payments_completed INTEGER
payments_remaining INTEGER
next_payment_due_date TIMESTAMP
next_payment_amount NUMERIC(10, 2)
user_id UUID
```

**Campos FALTANTES:**
- ❌ `payment_method` (bank_transfer_mxn | stripe_usd)
- ❌ `currency` (MXN | USD)
- ❌ `exchange_rate` (si USD)

---

### 3. DB Schema — Tabla `layaway_payments`

**Estructura actual** (migration 019, inferido):
```sql
id UUID
layaway_id UUID REFERENCES layaways(id)
payment_number INTEGER
amount_due NUMERIC(10, 2)
amount_paid NUMERIC(10, 2)
due_date TIMESTAMP
status TEXT (pending | paid | overdue | cancelled)
stripe_payment_intent_id TEXT
stripe_session_id TEXT
paid_at TIMESTAMP
```

**Campos FALTANTES:**
- ❌ `payment_method` (bank_transfer_mxn | stripe_usd)
- ❌ `bank_payment_reference`
- ❌ `bank_payment_proof_url`
- ❌ `bank_payment_verified_at`
- ❌ `bank_payment_verified_by`

---

### 4. Flujo Checkout Actual (Stripe Only)

**Archivo:** `src/app/api/checkout/route.ts` (inferido)

**Flujo actual:**
1. Frontend: Agregar producto a carrito
2. Frontend: Click "Comprar ahora"
3. Backend: Crear order con `status=pending`, `payment_status=pending`
4. Backend: Crear Stripe Checkout Session (mode=payment)
5. Backend: Redirect a Stripe
6. Stripe: Usuario paga con tarjeta
7. Webhook: `checkout.session.completed` → `payment_status=paid`
8. Email: Confirmación compra
9. Product: `status=sold`

**Problemas:**
- ❌ NO permite elegir método de pago
- ❌ Asume siempre Stripe
- ❌ NO soporta transferencia bancaria
- ❌ Currency hardcoded MXN

---

### 5. Flujo Layaway Actual (Stripe Only)

**Archivo:** `src/app/api/layaways/create/route.ts` (inferido)

**Flujo actual:**
1. Frontend: Click "Apartar"
2. Backend: Crear layaway con `status=pending_first_payment`
3. Backend: Crear layaway_payments[] (según plan)
4. Backend: Crear Stripe Checkout (mode=payment, monto=first_payment)
5. Stripe: Usuario paga depósito
6. Webhook: Marcar payment[0] como `paid`, layaway `status=active`
7. Email: Confirmación apartado
8. Product: `status=reserved`

**Problemas:**
- ❌ NO permite elegir método de pago
- ❌ Asume siempre Stripe
- ❌ NO soporta transferencia para cuotas
- ❌ Currency hardcoded MXN

---

### 6. Webhook Stripe Actual

**Archivo:** `src/app/api/stripe/webhook/route.ts`

**Eventos manejados:**
- `checkout.session.completed` (orders)
- `checkout.session.completed` (layaway_deposit)
- `checkout.session.completed` (layaway_installment)
- `checkout.session.completed` (layaway_full_balance)
- `checkout.session.expired`

**Problemas:**
- ❌ Asume payment_method siempre Stripe
- ❌ NO soporta validación manual de pagos
- ❌ NO hay alternativa para bank transfers

---

### 7. Panel Admin — Órdenes

**Archivo:** `/admin/orders` o `/admin/envios` (inferido)

**Funciones actuales:**
- Ver listado de órdenes
- Ver detalle de orden
- Marcar como enviado (shipping_status)
- Agregar tracking

**Funciones FALTANTES:**
- ❌ Ver comprobantes bancarios subidos
- ❌ Validar pago manual (bank transfer)
- ❌ Marcar payment_status=paid manualmente
- ❌ Rechazar comprobante inválido
- ❌ Filtrar por payment_method

---

### 8. Panel Cliente — Pedidos

**Archivo:** `/account/orders` (existe)

**Funciones actuales:**
- Ver listado de pedidos
- Ver detalle de pedido
- Confirmar dirección de envío
- Ver tracking

**Funciones FALTANTES:**
- ❌ Subir comprobante de pago bancario
- ❌ Ver estado de validación del comprobante
- ❌ Ver instrucciones bancarias si payment_method=bank_transfer_mxn
- ❌ Ver referencia única del pedido

---

### 9. Emails Transaccionales

**Archivos:** `src/lib/email/mailer.ts` + templates

**Emails actuales:**
- ✅ Confirmación compra (cuando payment_status=paid)
- ✅ Confirmación apartado (cuando layaway activo)
- ✅ Tracking enviado (cuando shipped)

**Emails FALTANTES:**
- ❌ Instrucciones de pago bancario (orden creada con bank_transfer_mxn)
- ❌ Confirmación de pago recibido (admin validó comprobante)
- ❌ Comprobante rechazado (admin rechazó comprobante)
- ❌ Recordatorio de pago pendiente (orden lleva X días sin pago)

---

## 🏗️ ARQUITECTURA PROPUESTA

### Modelo de Datos — Nuevos Campos

#### Tabla `orders` — AGREGAR:
```sql
ALTER TABLE orders
  ADD COLUMN payment_method TEXT 
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN'
    CHECK (currency IN ('MXN', 'USD')),
  
  ADD COLUMN exchange_rate NUMERIC(10, 4),
  
  ADD COLUMN bank_payment_reference TEXT UNIQUE,
  
  ADD COLUMN bank_payment_proof_url TEXT,
  
  ADD COLUMN bank_payment_verified_at TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN bank_payment_verified_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_currency ON orders(currency);
CREATE INDEX idx_orders_bank_reference ON orders(bank_payment_reference);
```

#### Tabla `layaways` — AGREGAR:
```sql
ALTER TABLE layaways
  ADD COLUMN payment_method TEXT 
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN'
    CHECK (currency IN ('MXN', 'USD')),
  
  ADD COLUMN exchange_rate NUMERIC(10, 4);

CREATE INDEX idx_layaways_payment_method ON layaways(payment_method);
CREATE INDEX idx_layaways_currency ON layaways(currency);
```

#### Tabla `layaway_payments` — AGREGAR:
```sql
ALTER TABLE layaway_payments
  ADD COLUMN payment_method TEXT 
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  ADD COLUMN bank_payment_reference TEXT,
  
  ADD COLUMN bank_payment_proof_url TEXT,
  
  ADD COLUMN bank_payment_verified_at TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN bank_payment_verified_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_layaway_payments_bank_reference ON layaway_payments(bank_payment_reference);
```

#### Nueva Tabla `bank_payment_proofs` (Opcional):
```sql
CREATE TABLE bank_payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  layaway_payment_id UUID REFERENCES layaway_payments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_proofs_order ON bank_payment_proofs(order_id);
CREATE INDEX idx_bank_proofs_layaway ON bank_payment_proofs(layaway_payment_id);
CREATE INDEX idx_bank_proofs_status ON bank_payment_proofs(verification_status);
```

---

### Flujo Compra Completa — MXN Bank Transfer

```
1. Frontend: Producto → Carrito
2. Frontend: Click "Comprar ahora"
3. Frontend: Selector método de pago:
   [ ] Transferencia bancaria (MXN)
   [ ] Tarjeta internacional (USD)
4. Usuario elige: Transferencia bancaria (MXN)
5. Backend: POST /api/checkout
   {
     "payment_method": "bank_transfer_mxn",
     "currency": "MXN",
     "products": [...]
   }
6. Backend: Crear order
   - status: "pending"
   - payment_status: "pending"
   - payment_method: "bank_transfer_mxn"
   - currency: "MXN"
   - bank_payment_reference: UUID único
7. Backend: Respuesta JSON:
   {
     "order_id": "...",
     "payment_method": "bank_transfer_mxn",
     "bank_details": {
       "account_name": "Bagclue",
       "bank": "Banorte",
       "account_number": "XXXX",
       "clabe": "XXXX",
       "reference": "BAGCLUE-{order_id_short}",
       "amount": 189000.00,
       "currency": "MXN"
     },
     "upload_proof_url": "/account/orders/{id}/upload-proof"
   }
8. Frontend: Redirect a página de instrucciones bancarias
   - Mostrar cuenta Banorte
   - Mostrar referencia única
   - Mostrar monto exacto
   - Botón "Subir comprobante"
9. Email: Enviar instrucciones bancarias
10. Usuario: Hace transferencia SPEI
11. Usuario: Sube comprobante (imagen/PDF)
12. Backend: POST /api/orders/{id}/upload-proof
    - Subir archivo a storage (Supabase Storage)
    - Actualizar order.bank_payment_proof_url
13. Admin: Recibe notificación (email/panel)
14. Admin: Va a /admin/orders/pending-verification
15. Admin: Ve comprobante, valida datos
16. Admin: Click "Aprobar pago"
17. Backend: PATCH /api/orders/{id}/verify-payment
    - payment_status: "paid"
    - bank_payment_verified_at: NOW()
    - bank_payment_verified_by: admin_id
    - status: "confirmed"
18. Backend: Marcar product.status = "sold"
19. Email: Confirmación de pago recibido
20. Continúa flujo normal (preparar envío, etc.)
```

---

### Flujo Compra Completa — USD Stripe

```
1-3. Igual que bank transfer
4. Usuario elige: Tarjeta internacional (USD)
5. Backend: POST /api/checkout
   {
     "payment_method": "stripe_usd",
     "currency": "USD"
   }
6. Backend: Calcular precio USD
   - Leer product.price (MXN)
   - Aplicar exchange_rate (configurado o API)
   - Ej: 189,000 MXN / 17.5 = 10,800 USD
7. Backend: Crear order
   - payment_method: "stripe_usd"
   - currency: "USD"
   - total: 10800 (USD)
   - exchange_rate: 17.5
8. Backend: Crear Stripe Checkout Session
   - amount: 1080000 (cents USD)
   - currency: "usd"
   - metadata: { order_id, payment_method: "stripe_usd" }
9. Backend: Respuesta JSON:
   {
     "checkout_url": "https://checkout.stripe.com/..."
   }
10. Frontend: Redirect a Stripe Checkout
11. Stripe: Usuario paga con tarjeta
12. Webhook: checkout.session.completed
13. Backend: Webhook handler
    - Verificar metadata.payment_method === "stripe_usd"
    - payment_status: "paid"
    - status: "confirmed"
14. Backend: Marcar product.status = "sold"
15. Email: Confirmación compra
16. Continúa flujo normal
```

---

### Flujo Apartado — MXN Bank Transfer

```
1. Usuario: Click "Apartar"
2. Frontend: Selector método de pago
3. Usuario: Elige transferencia bancaria (MXN)
4. Frontend: POST /api/layaways/create
   {
     "product_id": "...",
     "plan_type": "8_weekly_payments",
     "first_payment_amount": 37800,
     "payment_method": "bank_transfer_mxn",
     "currency": "MXN"
   }
5. Backend: Crear layaway
   - status: "pending_first_payment"
   - payment_method: "bank_transfer_mxn"
   - currency: "MXN"
   - total_amount: 189000
   - amount_paid: 0
6. Backend: Crear layaway_payments[] (8 cuotas)
   - payment[0]: amount_due: 37800, due_date: NOW, status: "pending"
   - payment[1-7]: cuotas semanales
7. Backend: Asignar bank_payment_reference a payment[0]
8. Backend: Respuesta JSON con instrucciones bancarias
9. Email: Instrucciones para depósito
10. Usuario: Hace transferencia
11. Usuario: Sube comprobante
    POST /api/layaways/{id}/payments/{payment_id}/upload-proof
12. Admin: Valida comprobante
13. Admin: PATCH /api/layaways/{id}/payments/{payment_id}/verify
14. Backend:
    - layaway_payments[0].status: "paid"
    - layaway_payments[0].amount_paid: 37800
    - layaway_payments[0].paid_at: NOW
    - layaway.status: "active"
    - layaway.amount_paid: 37800
    - layaway.amount_remaining: 151200
    - product.status: "reserved"
15. Email: Confirmación apartado activado
16. Para cuotas subsecuentes (semana 2-8):
    - Email recordatorio con instrucciones bancarias
    - Usuario transfiere + sube comprobante
    - Admin valida
    - Actualizar montos
17. Cuando amount_remaining === 0:
    - layaway.status: "completed"
    - Crear order final
    - product.status: "sold"
    - Email: Apartado completado
```

---

### Flujo Apartado — USD Stripe

```
1-4. Igual que bank transfer
5. Backend: Calcular precio USD
   - total_amount: 189000 MXN / 17.5 = 10,800 USD
   - first_payment: 37800 MXN / 17.5 = 2,160 USD
6. Backend: Crear layaway
   - payment_method: "stripe_usd"
   - currency: "USD"
   - total_amount: 10800 (USD)
   - exchange_rate: 17.5
7. Backend: Crear Stripe Checkout (first payment)
   - amount: 216000 (cents USD)
   - currency: "usd"
   - metadata: {
       layaway_id,
       payment_id,
       payment_method: "stripe_usd"
     }
8. Stripe: Usuario paga depósito
9. Webhook: checkout.session.completed
10. Backend: Marcar payment[0] paid, layaway active
11. Email: Confirmación apartado
12. Para cuotas subsecuentes:
    - Usuario va a /account/layaways/{id}
    - Click "Pagar cuota"
    - Crear Stripe Checkout (cuota N)
    - Webhook confirma pago
    - Actualizar montos
13. Final: layaway completed, order creado, email
```

---

## 📋 CAMBIOS REQUERIDOS

### DB Migrations (1 nueva)

**Archivo:** `migrations/0XX_add_payment_methods.sql`

```sql
-- Add payment_method, currency, exchange_rate to orders
ALTER TABLE orders
  ADD COLUMN payment_method TEXT,
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN',
  ADD COLUMN exchange_rate NUMERIC(10, 4),
  ADD COLUMN bank_payment_reference TEXT UNIQUE,
  ADD COLUMN bank_payment_proof_url TEXT,
  ADD COLUMN bank_payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN bank_payment_verified_by UUID REFERENCES auth.users(id);

-- Add to layaways
ALTER TABLE layaways
  ADD COLUMN payment_method TEXT,
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN',
  ADD COLUMN exchange_rate NUMERIC(10, 4);

-- Add to layaway_payments
ALTER TABLE layaway_payments
  ADD COLUMN payment_method TEXT,
  ADD COLUMN bank_payment_reference TEXT,
  ADD COLUMN bank_payment_proof_url TEXT,
  ADD COLUMN bank_payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN bank_payment_verified_by UUID REFERENCES auth.users(id);

-- Add constraints
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd'));

ALTER TABLE orders ADD CONSTRAINT orders_currency_check
  CHECK (currency IN ('MXN', 'USD'));

-- Indexes
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_currency ON orders(currency);
CREATE INDEX idx_orders_bank_reference ON orders(bank_payment_reference);
CREATE INDEX idx_layaways_payment_method ON layaways(payment_method);
CREATE INDEX idx_layaway_payments_bank_reference ON layaway_payments(bank_payment_reference);
```

---

### API Endpoints — NUEVOS

#### 1. POST `/api/checkout` — Modificar

**Agregar campos:**
```typescript
{
  payment_method: 'bank_transfer_mxn' | 'stripe_usd'
  currency: 'MXN' | 'USD'
}
```

**Lógica:**
- Si `bank_transfer_mxn` → crear order, NO crear Stripe session, retornar bank_details
- Si `stripe_usd` → calcular USD, crear Stripe session, retornar checkout_url

---

#### 2. POST `/api/orders/[id]/upload-proof`

**Request:**
```typescript
{
  file: File  // multipart/form-data
}
```

**Lógica:**
1. Validar order.payment_method === 'bank_transfer_mxn'
2. Validar order.payment_status === 'pending'
3. Upload file a Supabase Storage: `bank-proofs/{order_id}/{timestamp}.{ext}`
4. Update order.bank_payment_proof_url
5. Notificar admin (email/webhook interno)

**Response:**
```json
{
  "success": true,
  "proof_url": "https://storage.../.../proof.jpg",
  "message": "Comprobante subido correctamente. Estamos validando tu pago."
}
```

---

#### 3. PATCH `/api/admin/orders/[id]/verify-payment`

**Request:**
```typescript
{
  verified: boolean,
  rejection_reason?: string
}
```

**Lógica:**
- Si `verified: true`:
  - payment_status: "paid"
  - bank_payment_verified_at: NOW()
  - bank_payment_verified_by: req.user.id
  - status: "confirmed"
  - Marcar product sold
  - Enviar email confirmación
- Si `verified: false`:
  - Enviar email con rejection_reason
  - Mantener payment_status: "pending"

---

#### 4. POST `/api/layaways/[id]/payments/[payment_id]/upload-proof`

Similar a orders, pero para cuotas de apartado.

---

#### 5. PATCH `/api/admin/layaways/[id]/payments/[payment_id]/verify`

Similar a orders, pero:
- Actualizar layaway_payments[N].status = "paid"
- Recalcular layaway.amount_paid, amount_remaining
- Si first payment → layaway.status = "active", product reserved
- Si last payment → layaway completed, crear order

---

#### 6. GET `/api/config/exchange-rate`

**Response:**
```json
{
  "usd_to_mxn": 17.5,
  "last_updated": "2026-05-06T12:00:00Z",
  "source": "manual"  // o "api"
}
```

**Lógica:**
- Leer de tabla `config` o env variable
- Opcionalmente: integrar API externa (fixer.io, etc.)

---

### Frontend Components — NUEVOS

#### 1. `<PaymentMethodSelector>`

**Ubicación:** `/checkout`, `/layaway/[id]`

```tsx
<PaymentMethodSelector
  onSelect={(method) => setPaymentMethod(method)}
  defaultCurrency="MXN"
/>

// Render:
[ ] Transferencia bancaria (Pesos mexicanos)
[ ] Tarjeta internacional (Dólares estadounidenses)
```

---

#### 2. `<BankInstructionsPage>`

**Ruta:** `/orders/[id]/bank-instructions`

```tsx
<BankInstructionsPage order={order} />

// Muestra:
- Datos bancarios Bagclue
- Referencia única
- Monto exacto
- Botón "Subir comprobante"
- Estado: "Esperando pago"
```

---

#### 3. `<UploadProofModal>`

**Ubicación:** `/account/orders/[id]`, `/account/layaways/[id]`

```tsx
<UploadProofModal
  orderId={orderId}
  onUpload={(url) => refetch()}
/>

// Features:
- Drag & drop o file picker
- Preview imagen/PDF
- Upload a Supabase Storage
- Loading state
```

---

#### 4. `<AdminPaymentVerificationPanel>`

**Ruta:** `/admin/orders/pending-verification`

```tsx
// Lista de orders con payment_status=pending + bank_payment_proof_url
// Para cada orden:
- Ver comprobante (modal/nueva pestaña)
- Ver datos de la orden
- Botón "Aprobar pago"
- Botón "Rechazar" (con textarea razón)
```

---

### Email Templates — NUEVOS

#### 1. `bank-transfer-instructions.ts`

**Trigger:** Order creada con `payment_method=bank_transfer_mxn`

**Contenido:**
- Saludo
- "Tu pedido está reservado"
- Datos bancarios:
  - Banco: Banorte
  - Cuenta: XXXX
  - CLABE: XXXX
  - Referencia: BAGCLUE-{short_id}
  - Monto: $189,000 MXN
- Instrucciones:
  1. Realizar transferencia
  2. Subir comprobante
- CTA: "Subir comprobante"
- Link: `/account/orders/{id}`

---

#### 2. `bank-payment-verified.ts`

**Trigger:** Admin aprueba pago

**Contenido:**
- "✅ Pago recibido y verificado"
- Pedido confirmado
- Producto
- Próximo paso: Confirmar dirección
- CTA: "Confirmar dirección"

---

#### 3. `bank-payment-rejected.ts`

**Trigger:** Admin rechaza pago

**Contenido:**
- "⚠️ Comprobante no válido"
- Razón: {rejection_reason}
- Instrucciones para corregir
- CTA: "Subir nuevo comprobante"

---

#### 4. `layaway-bank-payment-reminder.ts`

**Trigger:** Cuota de apartado próxima a vencer

**Contenido:**
- "💰 Recordatorio de pago semanal"
- Apartado: {product_name}
- Cuota #{N} de {total}
- Monto: $X MXN
- Vencimiento: {due_date}
- Datos bancarios + referencia
- CTA: "Subir comprobante"

---

### Webhook Stripe — MODIFICAR

**Archivo:** `src/app/api/stripe/webhook/route.ts`

**Cambios:**

```typescript
// En handleCheckoutCompleted():
const payment_method = session.metadata?.payment_method || 'stripe_usd'
const currency = session.metadata?.currency || 'MXN'
const exchange_rate = session.metadata?.exchange_rate || null

// Al actualizar order:
await supabaseAdmin.from('orders').update({
  payment_status: 'paid',
  payment_method,
  currency,
  exchange_rate: exchange_rate ? parseFloat(exchange_rate) : null,
  stripe_session_id: session.id,
  stripe_payment_intent_id: session.payment_intent
})

// IMPORTANTE: Solo enviar email si payment_method === 'stripe_usd'
// Bank transfers envían email DESPUÉS de validación admin
if (payment_method === 'stripe_usd') {
  await sendOrderConfirmationEmail(...)
}
```

---

### Admin Panel — MODIFICAR

#### `/admin/envios`

**Agregar filtros:**
- [ ] Transferencia bancaria
- [ ] Stripe internacional

**Agregar columna:** Payment Method

**Badge:**
- `bank_transfer_mxn` → 🏦 Transferencia
- `stripe_usd` → 💳 Tarjeta USD

---

#### `/admin/orders/pending-verification` (NUEVO)

**Funcionalidad:**
- Listar orders con:
  - `payment_status = 'pending'`
  - `payment_method = 'bank_transfer_mxn'`
  - `bank_payment_proof_url IS NOT NULL`
- Ver comprobante en modal
- Aprobar/Rechazar

---

### Customer Panel — MODIFICAR

#### `/account/orders/[id]`

**Agregar sección:**
```tsx
{order.payment_method === 'bank_transfer_mxn' && order.payment_status === 'pending' && (
  <BankPaymentSection>
    {!order.bank_payment_proof_url ? (
      <>
        <BankInstructions />
        <UploadProofButton />
      </>
    ) : (
      <ProofUploaded>
        ✅ Comprobante subido
        {!order.bank_payment_verified_at && (
          <span>⏳ En validación</span>
        )}
      </ProofUploaded>
    )}
  </BankPaymentSection>
)}
```

---

## 🔢 MODELO DE PRECIOS

### Precio Base: MXN

Todos los productos tienen `price` en MXN.

**Ejemplo:**
```json
{
  "product_id": "abc123",
  "price": 189000,
  "currency": "MXN"
}
```

---

### Cálculo USD

**Opción A — Tasa fija configurada (Simple)**
```typescript
const EXCHANGE_RATE_USD_TO_MXN = 17.5  // env variable

function calculateUSD(priceMXN: number): number {
  return Math.round(priceMXN / EXCHANGE_RATE_USD_TO_MXN)
}

// Ejemplo:
189,000 MXN / 17.5 = 10,800 USD
```

**Opción B — API externa (Dinámico)**
```typescript
async function getExchangeRate(): Promise<number> {
  const res = await fetch('https://api.fixer.io/latest?base=USD&symbols=MXN')
  const data = await res.json()
  return data.rates.MXN  // ej: 17.52
}
```

**Recomendación:** Opción A (tasa fija) para MVP, actualizada manualmente cada semana.

---

### Guardado en Order

```json
{
  "order_id": "order_123",
  "subtotal": 189000,
  "currency": "USD",
  "exchange_rate": 17.5,
  "payment_method": "stripe_usd",
  "total": 10800
}
```

**IMPORTANTE:** Guardar `exchange_rate` para auditoría (saber qué tasa se usó en ese momento).

---

## ⚠️ CONSIDERACIONES

### 1. Validación Manual vs Automática

**Bank Transfer:**
- ⚠️ Requiere admin disponible para validar
- ⚠️ Delay entre pago real y confirmación (horas/días)
- ⚠️ Riesgo de comprobantes falsos/editados
- ✅ NO comisiones Stripe
- ✅ Mejor para mercado mexicano

**Stripe:**
- ✅ Confirmación instantánea
- ✅ Fraude manejado por Stripe
- ⚠️ Comisión ~3.6% + $3 MXN
- ⚠️ Requiere tarjeta internacional para USD
- ✅ Mejor para mercado internacional

---

### 2. Productos Reserved

Cuando order/layaway usa `bank_transfer_mxn`:

**Problema:** Producto queda reservado pero pago NO confirmado.

**Soluciones:**

**A. Reserva temporal (24-48h)**
```typescript
if (payment_method === 'bank_transfer_mxn') {
  // Crear order con expires_at = NOW() + 48h
  // Si no se sube comprobante en 48h → cancelar order, liberar producto
}
```

**B. Reserva hasta validación**
```typescript
// Producto queda pending hasta admin valida
// Si comprobante rechazado → cancelar order, liberar producto
```

**Recomendación:** Opción B (sin expiración automática), pero enviar recordatorio email a las 24h si no subió comprobante.

---

### 3. Exchange Rate Fluctuación

**Problema:** USD fluctúa diariamente.

**Solución:** Fijar tasa al momento de crear order/layaway.

```typescript
const exchangeRate = await getExchangeRate()  // 17.5
const priceUSD = priceMXN / exchangeRate      // 10,800

// Guardar en order:
order.exchange_rate = exchangeRate  // Inmutable
```

Si cliente paga 2 días después, usar la MISMA tasa (ya guardada).

---

### 4. Apartados Multi-Currency

**Problema:** Cliente comienza apartado en MXN, quiere pagar cuota en USD (o viceversa).

**Solución:** **NO permitir cambio de currency mid-layaway.**

```typescript
// Al crear layaway:
layaway.currency = 'MXN'  // o 'USD'
layaway.payment_method = 'bank_transfer_mxn'  // o 'stripe_usd'

// Todas las cuotas deben usar mismo currency + payment_method
```

Si cliente quiere cambiar → debe cancelar apartado y crear nuevo.

---

### 5. Comprobantes Duplicados

**Problema:** Usuario sube mismo comprobante para 2 órdenes.

**Solución:** Validación hash del archivo.

```typescript
async function checkDuplicateProof(fileHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('bank_payment_proof_hash', fileHash)
    .single()
  
  return !!data
}
```

Guardar hash en `order.bank_payment_proof_hash`.

---

### 6. Datos Bancarios Bagclue

**CRITICAL:** Datos bancarios deben ser configurables (NO hardcoded).

**Opción A — Tabla `config`:**
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO config (key, value) VALUES
('bank_details_mxn', '{
  "bank": "Banorte",
  "account_name": "Bagclue",
  "account_number": "XXXX",
  "clabe": "XXXX"
}');
```

**Opción B — Env variables:**
```env
BANK_NAME_MXN=Banorte
BANK_ACCOUNT_NAME=Bagclue
BANK_ACCOUNT_NUMBER=XXXX
BANK_CLABE=XXXX
```

**Recomendación:** Opción A (editable desde admin panel futuro).

---

### 7. Seguridad Upload Comprobantes

**Validaciones:**
- Tipo de archivo: `image/jpeg`, `image/png`, `application/pdf`
- Tamaño máximo: 5 MB
- Solo usuarios autenticados (user_id === order.user_id)
- Rate limit: 3 uploads por hora

**Storage:**
- Bucket: `bank-proofs` (private)
- Path: `{order_id}/{timestamp}_{random}.{ext}`
- RLS: Solo admin puede ver todos, user solo sus propios

---

## 📅 PLAN DE IMPLEMENTACIÓN

### Fase 1 — DB + Backend Core (2-3 días)

1. Migration `0XX_add_payment_methods.sql`
2. Actualizar types/database.ts
3. Configurar Supabase Storage bucket `bank-proofs`
4. Env variable `EXCHANGE_RATE_USD_TO_MXN`
5. Helper `calculateUSD(priceMXN)`
6. Helper `generateBankReference(orderId)`

---

### Fase 2 — Checkout Dual Payment (2 días)

1. Modificar `/api/checkout`:
   - Agregar `payment_method` param
   - Si `bank_transfer_mxn` → crear order, NO Stripe, retornar bank_details
   - Si `stripe_usd` → calcular USD, crear Stripe session
2. Modificar webhook:
   - Guardar `payment_method`, `currency`, `exchange_rate`
   - Enviar email SOLO si Stripe

---

### Fase 3 — Upload Comprobantes (1-2 días)

1. POST `/api/orders/[id]/upload-proof`
2. Storage upload + RLS
3. Validación file type/size
4. Hash duplicates check
5. Email notificación admin

---

### Fase 4 — Admin Verification (2 días)

1. GET `/api/admin/orders/pending-verification`
2. PATCH `/api/admin/orders/[id]/verify-payment`
3. UI: `/admin/orders/pending-verification`
   - Lista + preview comprobantes
   - Botones aprobar/rechazar
4. Email confirmación/rechazo

---

### Fase 5 — Frontend Checkout (2 días)

1. Component `<PaymentMethodSelector>`
2. Page `/orders/[id]/bank-instructions`
3. Component `<UploadProofModal>`
4. Integrar en `/checkout` flow

---

### Fase 6 — Customer Panel (1 día)

1. Modificar `/account/orders/[id]`
   - Mostrar instrucciones bancarias si pending
   - Mostrar estado comprobante
   - Botón upload si no subido

---

### Fase 7 — Layaways Bank Transfer (3 días)

1. Modificar `/api/layaways/create`:
   - Agregar `payment_method` param
   - Si `bank_transfer_mxn` → NO Stripe, retornar instructions
2. POST `/api/layaways/[id]/payments/[payment_id]/upload-proof`
3. PATCH `/api/admin/layaways/[id]/payments/[payment_id]/verify`
4. UI admin verificación cuotas
5. Email recordatorios cuotas

---

### Fase 8 — Emails + Testing (2 días)

1. Template `bank-transfer-instructions.ts`
2. Template `bank-payment-verified.ts`
3. Template `bank-payment-rejected.ts`
4. Template `layaway-bank-payment-reminder.ts`
5. QA completo:
   - Compra MXN bank transfer
   - Compra USD Stripe
   - Apartado MXN bank transfer
   - Apartado USD Stripe
   - Upload comprobantes
   - Validación admin
   - Emails

---

**Total estimado:** 15-18 días desarrollo + 2-3 días QA = **~3 semanas**

---

## 🎯 CRITERIOS DE ACEPTACIÓN

### Compra Completa — Bank Transfer MXN

- [ ] Usuario puede elegir "Transferencia bancaria" en checkout
- [ ] Se crea order con `payment_method=bank_transfer_mxn`, `payment_status=pending`
- [ ] Usuario recibe email con datos bancarios + referencia única
- [ ] Usuario puede subir comprobante desde `/account/orders/{id}`
- [ ] Admin ve orden en `/admin/orders/pending-verification`
- [ ] Admin puede aprobar/rechazar comprobante
- [ ] Al aprobar: `payment_status=paid`, email confirmación, producto sold
- [ ] Al rechazar: email con razón, orden sigue pending

---

### Compra Completa — Stripe USD

- [ ] Usuario puede elegir "Tarjeta internacional USD" en checkout
- [ ] Precio se calcula en USD usando exchange_rate
- [ ] Se crea Stripe Checkout en USD
- [ ] Webhook confirma pago automáticamente
- [ ] Email confirmación enviado
- [ ] Order guarda `currency=USD`, `exchange_rate`

---

### Apartado — Bank Transfer MXN

- [ ] Usuario puede elegir método de pago al apartar
- [ ] Se crea layaway con `payment_method=bank_transfer_mxn`
- [ ] Usuario recibe email con instrucciones para depósito
- [ ] Usuario sube comprobante para cuota 1
- [ ] Admin valida depósito
- [ ] Layaway pasa a `status=active`, producto reserved
- [ ] Para cuotas 2-8: mismo flujo (upload + validación)
- [ ] Al completar última cuota: layaway completed, order creado, producto sold

---

### Apartado — Stripe USD

- [ ] Similar a MXN pero pago automático
- [ ] Cada cuota crea Stripe Checkout en USD
- [ ] Webhook confirma automáticamente
- [ ] NO requiere validación manual

---

### Admin Panel

- [ ] Filtrar órdenes por payment_method
- [ ] Ver comprobantes subidos
- [ ] Aprobar/rechazar con razón
- [ ] Ver historial de validaciones

---

### Seguridad

- [ ] Solo user owner puede subir comprobante de su orden
- [ ] Comprobantes guardados en storage private
- [ ] Admin puede ver todos los comprobantes
- [ ] Rate limit en uploads (3/hora)
- [ ] Validación file type/size
- [ ] NO se exponen datos bancarios sensibles en frontend (CLABE OK, passwords NO)

---

## ❓ PREGUNTAS PENDIENTES

1. **Datos bancarios Bagclue:**
   - Banco: Banorte (confirmado)
   - ¿Cuenta a nombre de quién?
   - ¿Número de cuenta?
   - ¿CLABE?

2. **Tasa de cambio USD:**
   - ¿Tasa fija manual?
   - ¿Actualización semanal?
   - ¿O integrar API externa?

3. **Expiry órdenes bank transfer:**
   - ¿Cancelar automáticamente si no pagan en X días?
   - ¿O mantener pending indefinidamente?

4. **Notificaciones admin:**
   - ¿Email cuando nuevo comprobante?
   - ¿Webhook a Discord/Slack?
   - ¿O solo revisar panel manual?

5. **Apartados mix payment:**
   - ¿Permitir pagar cuota 1 con bank transfer y cuota 2 con Stripe?
   - ¿O forzar mismo método todo el plan?
   - **Recomendación:** Forzar mismo método.

6. **Comprobantes rechazados:**
   - ¿Límite de intentos? (ej: 3 rechazos → cancelar orden)
   - ¿O ilimitado?

7. **Productos disponibles:**
   - Al crear order bank_transfer, ¿marcar producto como `pending_payment` status?
   - ¿O mantener `available` hasta pago confirmado?
   - **Recomendación:** `pending_payment` o `reserved_pending` (nuevo status).

---

## 📌 NOTAS FINALES

- ✅ Este es un **cambio arquitectónico mayor**
- ✅ Requiere **3 semanas desarrollo + QA**
- ✅ Afecta: DB, checkout, webhook, admin, customer panel, emails
- ✅ NO tocar hasta aprobación de alcance
- ✅ Priorizar testing exhaustivo (comprobantes falsos, race conditions, etc.)
- ✅ Documentar flujos para customer support

---

**Status:** 📋 SCOPE COMPLETO — Awaiting aprobación para comenzar implementación

**Última actualización:** 2026-05-06 17:45 UTC
