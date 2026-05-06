# BAGCLUE PAYMENT METHODS — SCOPE V2
**Sistema Dual Payment: MXN Bank Transfer + USD Stripe**  
**Fecha:** 2026-05-06  
**Versión:** 2.0 (Refinado con feedback)  
**Status:** 📋 SCOPE FINAL — NO IMPLEMENTAR hasta aprobación

---

## 📋 ÍNDICE

1. [Auditoría Sistema Actual](#1-auditoría-sistema-actual)
2. [Flujo Propuesto](#2-flujo-propuesto)
3. [Cambios DB Necesarios](#3-cambios-db-necesarios)
4. [Cambios Frontend](#4-cambios-frontend)
5. [Cambios Admin](#5-cambios-admin)
6. [Cambios Emails](#6-cambios-emails)
7. [Seguridad](#7-seguridad)
8. [Riesgos](#8-riesgos)
9. [Subfases Recomendadas](#9-subfases-recomendadas)
10. [Criterios de Cierre](#10-criterios-de-cierre)

---

## 1. AUDITORÍA SISTEMA ACTUAL

### 1.1 Tabla `orders` (Actual)

**Campos relevantes:**
```typescript
{
  id: string
  customer_email: string
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
}
```

**Campos FALTANTES:**
- ❌ `payment_method` (identificar bank vs Stripe)
- ❌ `payment_currency` (MXN vs USD)
- ❌ `payment_reference` (referencia bancaria única)
- ❌ `exchange_rate` (tasa de cambio aplicada)
- ❌ `amount_mxn` / `amount_usd` (montos en ambas monedas)

---

### 1.2 Tabla `layaways` (Actual)

**Campos relevantes:**
```sql
total_amount NUMERIC(10, 2)
amount_paid NUMERIC(10, 2)
amount_remaining NUMERIC(10, 2)
status TEXT (pending_first_payment | active | completed | overdue | forfeited)
```

**Campos FALTANTES:**
- ❌ `payment_method`
- ❌ `currency`
- ❌ `exchange_rate`

---

### 1.3 Tabla `layaway_payments` (Actual)

**Campos relevantes:**
```sql
layaway_id UUID
payment_number INTEGER
amount_due NUMERIC(10, 2)
status TEXT (pending | paid | overdue)
stripe_payment_intent_id TEXT
paid_at TIMESTAMP
```

**Campos FALTANTES:**
- ❌ `payment_method`
- ❌ `proof_url` (comprobante bancario)
- ❌ `confirmed_at` / `confirmed_by`

---

### 1.4 Flujo Checkout Actual (Stripe Only)

**Archivo inferido:** `src/app/api/checkout/route.ts`

**Flujo:**
1. Frontend → POST /api/checkout con productos
2. Backend → Crear order `status=pending`, `payment_status=pending`
3. Backend → Crear Stripe Checkout Session (hardcoded MXN)
4. Backend → Return `{ checkout_url }`
5. Frontend → Redirect a Stripe
6. Usuario → Paga con tarjeta
7. Webhook → `checkout.session.completed` → `payment_status=paid`
8. Backend → Email confirmación + product `status=sold`

**Limitaciones:**
- ❌ Asume siempre Stripe
- ❌ Currency hardcoded MXN
- ❌ NO permite bank transfer

---

### 1.5 Flujo Layaway Actual (Stripe Only)

**Archivo inferido:** `src/app/api/layaways/create/route.ts`

**Flujo:**
1. Frontend → POST /api/layaways/create con product_id + plan
2. Backend → Crear layaway `status=pending_first_payment`
3. Backend → Crear layaway_payments[] (cuotas programadas)
4. Backend → Crear Stripe Checkout (first payment)
5. Usuario → Paga depósito
6. Webhook → Marcar payment[0] paid, layaway `status=active`
7. Backend → Email confirmación + product `status=reserved`

**Limitaciones:**
- ❌ Asume siempre Stripe
- ❌ NO permite bank transfer para cuotas

---

### 1.6 Admin Panel Actual

**Ubicación inferida:** `/admin/envios` o `/admin/orders`

**Funciones:**
- ✅ Ver listado órdenes
- ✅ Filtrar por shipping_status
- ✅ Marcar como enviado
- ✅ Agregar tracking

**Funciones FALTANTES:**
- ❌ Filtrar por payment_method
- ❌ Ver comprobantes bancarios
- ❌ Confirmar/rechazar pagos manuales
- ❌ Ver payment_transactions

---

### 1.7 Customer Panel Actual

**Ubicación:** `/account/orders`

**Funciones:**
- ✅ Ver listado pedidos
- ✅ Ver detalle pedido
- ✅ Confirmar dirección de envío

**Funciones FALTANTES:**
- ❌ Ver instrucciones bancarias
- ❌ Subir comprobante de pago
- ❌ Ver estado validación comprobante

---

## 2. FLUJO PROPUESTO

### 2.1 Compra Completa — Bank Transfer MXN

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: CHECKOUT                                                │
└─────────────────────────────────────────────────────────────────┘

1. Usuario: Producto → Carrito → "Comprar ahora"

2. Frontend: Pantalla método de pago
   ┌─────────────────────────────────────────────────────┐
   │ ¿Cómo deseas pagar?                                 │
   │                                                     │
   │ ○ Transferencia bancaria (Pesos mexicanos)         │
   │   Sin comisión • Validación manual 24-48h          │
   │                                                     │
   │ ○ Tarjeta internacional (Dólares)                  │
   │   Confirmación inmediata • Comisión Stripe         │
   └─────────────────────────────────────────────────────┘

3. Usuario: Selecciona "Transferencia bancaria"

4. Frontend: POST /api/checkout
   {
     "payment_method": "bank_transfer_mxn",
     "currency": "MXN",
     "products": [...]
   }

5. Backend: Crear order
   - id: UUID
   - status: "pending"
   - payment_status: "pending"
   - payment_method: "bank_transfer_mxn"
   - payment_currency: "MXN"
   - total: 189000
   - amount_mxn: 189000
   - amount_usd: null
   - payment_reference: "BAGCLUE-{short_id}"  // UUID 8 chars
   - exchange_rate: null

6. Backend: Crear payment_transaction
   - order_id: {order_id}
   - payment_type: "full_purchase"
   - payment_method: "bank_transfer_mxn"
   - currency: "MXN"
   - amount: 189000
   - status: "pending"
   - created_at: NOW()

7. Backend: Product → status: "pending_payment" (temporal 48h)

8. Backend: Response JSON
   {
     "success": true,
     "order_id": "...",
     "payment_method": "bank_transfer_mxn",
     "redirect_url": "/orders/{order_id}/payment-instructions"
   }

┌─────────────────────────────────────────────────────────────────┐
│ FASE 2: INSTRUCCIONES BANCARIAS                                 │
└─────────────────────────────────────────────────────────────────┘

9. Frontend: Redirect a /orders/{order_id}/payment-instructions

10. Página muestra:
    ┌──────────────────────────────────────────────────────┐
    │ ✓ Pedido reservado                                   │
    │                                                      │
    │ Realiza tu transferencia:                           │
    │                                                      │
    │ Banco: Banorte                                      │
    │ Beneficiario: {account_name}                        │
    │ CLABE: {clabe}                                      │
    │ Referencia: BAGCLUE-A3F8B2C1                        │
    │ Monto: $189,000.00 MXN                              │
    │                                                      │
    │ ⚠️ Importante:                                       │
    │ - Usa exactamente la referencia mostrada            │
    │ - No olvides subir tu comprobante                   │
    │ - Validaremos en máximo 48 horas                    │
    │                                                      │
    │ [📎 Subir comprobante]                              │
    └──────────────────────────────────────────────────────┘

11. Email: Enviar instrucciones bancarias
    - Subject: "Instrucciones de pago — Pedido #{order_id}"
    - Incluye: Datos bancarios, referencia, monto, link upload

┌─────────────────────────────────────────────────────────────────┐
│ FASE 3: USUARIO PAGA Y SUBE COMPROBANTE                         │
└─────────────────────────────────────────────────────────────────┘

12. Usuario: Abre app bancaria → SPEI
    - Destino: CLABE de Bagclue
    - Referencia: BAGCLUE-A3F8B2C1
    - Monto: $189,000.00

13. Usuario: Transferencia exitosa → captura de pantalla

14. Usuario: Click "Subir comprobante"

15. Frontend: Modal upload
    - Drag & drop o file picker
    - Formatos: JPG, PNG, PDF
    - Max: 5 MB
    - Preview antes de confirmar

16. Frontend: POST /api/orders/{order_id}/upload-proof
    - multipart/form-data
    - file: {comprobante.jpg}

17. Backend: Validar
    - Verificar order.payment_method === 'bank_transfer_mxn'
    - Verificar order.payment_status === 'pending'
    - Verificar file type (image/*, application/pdf)
    - Verificar file size <= 5 MB
    - Calcular hash SHA256 para detectar duplicados

18. Backend: Check duplicados
    SELECT id FROM payment_transactions 
    WHERE proof_hash = {hash} AND status = 'confirmed'
    
    Si existe → rechazar con mensaje "Este comprobante ya fue usado"

19. Backend: Upload a Supabase Storage
    - Bucket: "bank-proofs" (private, RLS)
    - Path: orders/{order_id}/{timestamp}_{random}.{ext}
    - Public: false

20. Backend: Actualizar registros
    - payment_transaction.proof_url = {storage_url}
    - payment_transaction.proof_hash = {sha256}
    - payment_transaction.status = "proof_uploaded"
    - payment_transaction.proof_uploaded_at = NOW()

21. Backend: Response
    {
      "success": true,
      "message": "Comprobante recibido. Validaremos tu pago en máximo 48 horas.",
      "proof_url": "https://storage.../proof.jpg"
    }

22. Email: Confirmación comprobante recibido
    - "Comprobante recibido — Pedido #{order_id}"
    - "Estamos validando tu pago..."

23. Backend: Notificar admin
    - Email a admin: "Nuevo comprobante pendiente — Order #{order_id}"
    - Link directo: /admin/payments/pending-verification

┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: ADMIN VALIDA PAGO                                       │
└─────────────────────────────────────────────────────────────────┘

24. Admin: Login → /admin/payments/pending-verification

25. Admin: Ve listado
    ┌───────────────────────────────────────────────────────────┐
    │ Pagos pendientes de validación                            │
    │                                                           │
    │ Order #12345  |  Cliente: Juan Pérez                      │
    │ Monto: $189,000 MXN  |  Ref: BAGCLUE-A3F8B2C1            │
    │ Subido: Hace 2 horas                                      │
    │ [Ver comprobante] [✓ Aprobar] [✗ Rechazar]               │
    └───────────────────────────────────────────────────────────┘

26. Admin: Click "Ver comprobante" → Modal con imagen full

27. Admin: Validar manualmente
    - ✓ Monto correcto ($189,000)
    - ✓ Referencia correcta (BAGCLUE-A3F8B2C1)
    - ✓ Fecha reciente
    - ✓ Banco origen válido
    - ✓ Comprobante legítimo (no editado)

28a. SI VÁLIDO: Admin → Click "Aprobar"

29a. Frontend: PATCH /api/admin/payments/{transaction_id}/verify
     {
       "action": "approve",
       "notes": "Pago verificado correctamente"
     }

30a. Backend: Actualizar registros
     - payment_transaction.status = "confirmed"
     - payment_transaction.confirmed_at = NOW()
     - payment_transaction.confirmed_by = {admin_user_id}
     
     - order.payment_status = "paid"
     - order.status = "confirmed"
     
     - product.status = "sold"
     - product.stock = 0

31a. Backend: Email confirmación pago
     - "✅ Pago confirmado — Pedido #{order_id}"
     - "Tu pago ha sido verificado correctamente"
     - "Próximo paso: Confirma tu dirección de envío"
     - Link: /account/orders/{order_id}

32a. Admin: Mensaje éxito "Pago aprobado correctamente"

28b. SI INVÁLIDO: Admin → Click "Rechazar"

29b. Frontend: Modal con textarea "Razón del rechazo"

30b. Admin: Escribe razón
     "El monto transferido ($150,000) no coincide con el total del pedido ($189,000)"

31b. Frontend: PATCH /api/admin/payments/{transaction_id}/verify
     {
       "action": "reject",
       "rejection_reason": "Monto incorrecto..."
     }

32b. Backend: Actualizar registros
     - payment_transaction.status = "rejected"
     - payment_transaction.rejection_reason = {reason}
     - payment_transaction.rejected_at = NOW()
     - payment_transaction.rejected_by = {admin_user_id}
     
     - order.payment_status sigue "pending"
     - product.status sigue "pending_payment"

33b. Backend: Email rechazo
     - "⚠️ Comprobante no válido — Pedido #{order_id}"
     - Razón: {rejection_reason}
     - Instrucciones para corregir
     - Link: /account/orders/{order_id}

34b. Usuario: Recibe email → corrige → sube nuevo comprobante
     (Volver a paso 14-23)

┌─────────────────────────────────────────────────────────────────┐
│ FASE 5: CONTINUAR FLUJO NORMAL                                  │
└─────────────────────────────────────────────────────────────────┘

35. Order con payment_status = "paid" → continúa flujo normal
    - Cliente confirma dirección
    - Admin prepara envío
    - Admin marca shipped
    - Email tracking enviado
    - Etc.
```

---

### 2.2 Compra Completa — Stripe USD

```
1-2. Igual que bank transfer (selector método de pago)

3. Usuario: Selecciona "Tarjeta internacional"

4. Frontend: POST /api/checkout
   {
     "payment_method": "stripe_usd",
     "currency": "USD"
   }

5. Backend: Calcular precio USD
   - Leer env.EXCHANGE_RATE_USD_TO_MXN (ej: 17.5)
   - price_mxn = 189000
   - price_usd = Math.round(189000 / 17.5) = 10800
   - exchange_rate = 17.5

6. Backend: Crear order
   - payment_method: "stripe_usd"
   - payment_currency: "USD"
   - total: 10800 (USD)
   - amount_mxn: 189000
   - amount_usd: 10800
   - exchange_rate: 17.5

7. Backend: Crear payment_transaction
   - payment_type: "full_purchase"
   - payment_method: "stripe_usd"
   - currency: "USD"
   - amount: 10800
   - exchange_rate: 17.5

8. Backend: Crear Stripe Checkout Session
   - amount: 1080000 (cents USD)
   - currency: "usd"
   - metadata: {
       order_id,
       payment_method: "stripe_usd",
       exchange_rate: "17.5"
     }

9. Backend: Response
   {
     "checkout_url": "https://checkout.stripe.com/..."
   }

10. Frontend: Redirect a Stripe

11. Usuario: Paga con tarjeta

12. Webhook: checkout.session.completed

13. Backend: Webhook handler
    - Verificar metadata.payment_method === "stripe_usd"
    - Actualizar payment_transaction.status = "confirmed"
    - Actualizar payment_transaction.stripe_session_id
    - Actualizar order.payment_status = "paid"
    - Actualizar order.status = "confirmed"
    - Actualizar product.status = "sold"

14. Email: Confirmación compra

15. Continuar flujo normal
```

---

### 2.3 Apartado — Bank Transfer MXN

```
1. Usuario: Click "Apartar"

2. Frontend: Selector método de pago

3. Usuario: Selecciona "Transferencia bancaria"

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
   - amount_remaining: 189000
   - exchange_rate: null

6. Backend: Crear layaway_payments[] (8 cuotas)
   - payment[0]: amount_due: 37800, due_date: NOW, status: "pending"
   - payment[1]: amount_due: 18900, due_date: NOW+7days, status: "pending"
   - ...
   - payment[7]: amount_due: 18900, due_date: NOW+49days, status: "pending"

7. Backend: Crear payment_transaction (depósito)
   - layaway_id: {layaway_id}
   - layaway_payment_id: {payment[0].id}
   - payment_type: "layaway_deposit"
   - payment_method: "bank_transfer_mxn"
   - currency: "MXN"
   - amount: 37800
   - status: "pending"

8. Backend: Asignar payment_reference único
   - payment[0].payment_reference = "BAGCLUE-LAY-{short_id}"

9. Backend: Response con instrucciones bancarias

10. Frontend: Redirect a /layaways/{id}/payment-instructions

11. Email: Instrucciones para depósito
    - Datos bancarios + referencia
    - Monto: $37,800 (depósito)
    - Link upload comprobante

12. Usuario: Transfiere depósito → sube comprobante

13. Frontend: POST /api/layaways/{id}/payments/{payment_id}/upload-proof

14. Backend: Upload a storage + actualizar payment_transaction

15. Admin: Valida comprobante en /admin/layaways/pending-verification

16. Admin: Aprueba

17. Backend: PATCH /api/admin/layaways/{id}/payments/{payment_id}/verify
    { "action": "approve" }

18. Backend: Actualizar registros
    - payment_transaction.status = "confirmed"
    - layaway_payments[0].status = "paid"
    - layaway_payments[0].paid_at = NOW()
    - layaway.status = "active"
    - layaway.amount_paid = 37800
    - layaway.amount_remaining = 151200
    - product.status = "reserved"

19. Email: Apartado activado
    - "✅ Apartado confirmado"
    - Plan: 7 pagos semanales restantes
    - Link: /account/layaways/{id}

20. CUOTAS SUBSECUENTES (Semana 2-8):
    
    Semana 2:
    - Email recordatorio (5 días antes): "💰 Tu cuota #2 vence en 2 días"
    - Datos bancarios + nueva referencia (BAGCLUE-LAY-{cuota2_id})
    - Usuario transfiere + sube comprobante
    - Admin valida
    - Backend actualiza montos
    
    Repetir para cuota 3-8

21. ÚLTIMA CUOTA (Semana 8):
    - Usuario paga cuota 8
    - Admin valida
    - Backend: layaway.amount_remaining = 0
    - Backend: layaway.status = "completed"
    - Backend: Crear order final (vincular a layaway)
    - Backend: product.status = "sold"
    - Email: "🎉 Apartado completado — Tu producto está listo"
```

---

### 2.4 Apartado — Stripe USD

```
1-4. Igual que bank transfer

5. Backend: Calcular precios USD
   - total_amount: 189000 / 17.5 = 10800 USD
   - first_payment: 37800 / 17.5 = 2160 USD
   - cuotas semanales: 18900 / 17.5 = 1080 USD

6. Backend: Crear layaway con currency USD, exchange_rate 17.5

7. Backend: Crear Stripe Checkout (depósito)
   - amount: 216000 (cents USD)
   - currency: "usd"
   - metadata: {
       layaway_id,
       payment_id: payment[0].id,
       payment_type: "layaway_deposit",
       payment_method: "stripe_usd"
     }

8. Usuario: Paga depósito en Stripe

9. Webhook: checkout.session.completed
   - Marcar payment_transaction confirmed
   - Marcar payment[0] paid
   - Layaway status = "active"
   - Product status = "reserved"

10. Email: Apartado activado

11. CUOTAS SUBSECUENTES:
    - Usuario va a /account/layaways/{id}
    - Click "Pagar cuota #{N}"
    - Backend: Crear Stripe Checkout (cuota N en USD)
    - Usuario paga
    - Webhook confirma automático
    - Backend actualiza montos

12. ÚLTIMA CUOTA:
    - Webhook confirma pago cuota 8
    - Backend: layaway completed
    - Backend: Crear order final
    - Product sold
    - Email: Apartado completado
```

---

## 3. CAMBIOS DB NECESARIOS

### 3.1 Nueva Tabla: `payment_transactions` ⭐ RECOMENDADO

**Propósito:** Tabla central para todos los pagos (compra completa + cuotas apartado)

```sql
CREATE TABLE payment_transactions (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones (nullable, solo uno aplica)
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  layaway_id UUID REFERENCES layaways(id) ON DELETE CASCADE,
  layaway_payment_id UUID REFERENCES layaway_payments(id) ON DELETE SET NULL,
  
  -- Tipo de pago
  payment_type TEXT NOT NULL 
    CHECK (payment_type IN ('full_purchase', 'layaway_deposit', 'layaway_installment')),
  
  -- Método y moneda
  payment_method TEXT NOT NULL 
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  currency TEXT NOT NULL 
    CHECK (currency IN ('MXN', 'USD')),
  
  -- Montos
  amount NUMERIC(10, 2) NOT NULL,
  exchange_rate NUMERIC(10, 4),
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'proof_uploaded', 'confirmed', 'rejected', 'failed')),
  
  -- Bank transfer fields
  payment_reference TEXT,  -- BAGCLUE-{short_id}
  proof_url TEXT,
  proof_hash TEXT,  -- SHA256 para detectar duplicados
  proof_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Stripe fields
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Validación admin (bank transfer)
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Metadata
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pt_order ON payment_transactions(order_id);
CREATE INDEX idx_pt_layaway ON payment_transactions(layaway_id);
CREATE INDEX idx_pt_layaway_payment ON payment_transactions(layaway_payment_id);
CREATE INDEX idx_pt_status ON payment_transactions(status);
CREATE INDEX idx_pt_payment_method ON payment_transactions(payment_method);
CREATE INDEX idx_pt_reference ON payment_transactions(payment_reference);
CREATE INDEX idx_pt_proof_hash ON payment_transactions(proof_hash);
CREATE INDEX idx_pt_created ON payment_transactions(created_at DESC);

-- RLS policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access" ON payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can see their own
CREATE POLICY "Users see own" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR layaway_id IN (SELECT id FROM layaways WHERE user_id = auth.uid())
  );

-- Comments
COMMENT ON TABLE payment_transactions IS 'Registro central de todas las transacciones de pago';
COMMENT ON COLUMN payment_transactions.payment_type IS 'full_purchase | layaway_deposit | layaway_installment';
COMMENT ON COLUMN payment_transactions.payment_method IS 'bank_transfer_mxn | stripe_usd';
COMMENT ON COLUMN payment_transactions.status IS 'pending → proof_uploaded → confirmed/rejected';
COMMENT ON COLUMN payment_transactions.proof_hash IS 'SHA256 del archivo para detectar duplicados';
```

---

### 3.2 Modificar Tabla: `orders`

```sql
ALTER TABLE orders
  -- Método y moneda de pago
  ADD COLUMN payment_method TEXT
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  ADD COLUMN payment_currency TEXT
    CHECK (payment_currency IN ('MXN', 'USD')),
  
  -- Referencia bancaria (si bank_transfer)
  ADD COLUMN payment_reference TEXT UNIQUE,
  
  -- Tasa de cambio aplicada (si USD)
  ADD COLUMN exchange_rate NUMERIC(10, 4),
  
  -- Montos en ambas monedas (para auditoría)
  ADD COLUMN amount_mxn NUMERIC(10, 2),
  ADD COLUMN amount_usd NUMERIC(10, 2);

-- Indexes
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_payment_currency ON orders(payment_currency);
CREATE INDEX idx_orders_payment_reference ON orders(payment_reference);

-- Comments
COMMENT ON COLUMN orders.payment_method IS 'Método usado: bank_transfer_mxn | stripe_usd';
COMMENT ON COLUMN orders.payment_currency IS 'Moneda del pago: MXN | USD';
COMMENT ON COLUMN orders.payment_reference IS 'Referencia única para transferencias bancarias';
COMMENT ON COLUMN orders.exchange_rate IS 'Tasa de cambio USD/MXN aplicada al crear la orden';
COMMENT ON COLUMN orders.amount_mxn IS 'Monto en pesos mexicanos (para auditoría)';
COMMENT ON COLUMN orders.amount_usd IS 'Monto en dólares (para auditoría)';
```

---

### 3.3 Modificar Tabla: `layaways`

```sql
ALTER TABLE layaways
  ADD COLUMN payment_method TEXT
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  
  ADD COLUMN currency TEXT DEFAULT 'MXN'
    CHECK (currency IN ('MXN', 'USD')),
  
  ADD COLUMN exchange_rate NUMERIC(10, 4);

-- Indexes
CREATE INDEX idx_layaways_payment_method ON layaways(payment_method);
CREATE INDEX idx_layaways_currency ON layaways(currency);

-- Comments
COMMENT ON COLUMN layaways.payment_method IS 'Método de pago del apartado (todas las cuotas deben usar el mismo)';
COMMENT ON COLUMN layaways.currency IS 'Moneda del apartado: MXN | USD';
COMMENT ON COLUMN layaways.exchange_rate IS 'Tasa de cambio fijada al crear apartado (si USD)';
```

---

### 3.4 Modificar Tabla: `layaway_payments`

```sql
ALTER TABLE layaway_payments
  -- Referencia bancaria única por cuota
  ADD COLUMN payment_reference TEXT,
  
  -- Método de pago (heredado de layaway pero explícito)
  ADD COLUMN payment_method TEXT
    CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd'));

-- Indexes
CREATE INDEX idx_lp_payment_reference ON layaway_payments(payment_reference);

-- Comments
COMMENT ON COLUMN layaway_payments.payment_reference IS 'Referencia única para transferencia de esta cuota específica';
```

---

### 3.5 Nueva Tabla: `bank_account_config` (Opcional pero RECOMENDADO)

**Propósito:** Almacenar datos bancarios de forma segura y editable

```sql
CREATE TABLE bank_account_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificador
  account_key TEXT UNIQUE NOT NULL,  -- 'bagclue_banorte_mxn'
  
  -- Datos bancarios
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT,  -- Opcional, NO mostrar en frontend
  clabe TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('MXN', 'USD')),
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data
INSERT INTO bank_account_config (account_key, bank_name, account_holder_name, clabe, currency) VALUES
('bagclue_banorte_mxn', 'Banorte', 'Bagclue', 'PENDIENTE_CLABE', 'MXN');

-- RLS
ALTER TABLE bank_account_config ENABLE ROW LEVEL SECURITY;

-- Admin can edit
CREATE POLICY "Admin full access" ON bank_account_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public can read active accounts (only safe fields)
CREATE POLICY "Public read active" ON bank_account_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Comments
COMMENT ON TABLE bank_account_config IS 'Configuración de cuentas bancarias para recibir pagos';
COMMENT ON COLUMN bank_account_config.clabe IS 'CLABE interbancaria (OK mostrar en frontend)';
COMMENT ON COLUMN bank_account_config.account_number IS 'Número de cuenta (NO mostrar, solo para admin)';
```

---

### 3.6 Nuevo Storage Bucket: `bank-proofs`

```sql
-- Crear bucket en Supabase Storage (via dashboard o migration)
INSERT INTO storage.buckets (id, name, public) VALUES
('bank-proofs', 'bank-proofs', false);

-- RLS policies para bank-proofs

-- Admin puede ver todos
CREATE POLICY "Admin can see all proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'bank-proofs'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Users pueden subir a su carpeta
CREATE POLICY "Users can upload own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bank-proofs'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders WHERE user_id = auth.uid()
    UNION
    SELECT id::text FROM layaways WHERE user_id = auth.uid()
  )
);

-- Users pueden ver sus propios comprobantes
CREATE POLICY "Users can see own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'bank-proofs'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders WHERE user_id = auth.uid()
    UNION
    SELECT id::text FROM layaways WHERE user_id = auth.uid()
  )
);
```

---

## 4. CAMBIOS FRONTEND

### 4.1 Componente: `<PaymentMethodSelector>`

**Ubicación:** `/checkout`, `/layaway/create`

```tsx
interface PaymentMethodSelectorProps {
  onSelect: (method: 'bank_transfer_mxn' | 'stripe_usd') => void
  defaultMethod?: string
}

export function PaymentMethodSelector({ onSelect }: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<string>()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">¿Cómo deseas pagar?</h3>
      
      {/* Bank Transfer MXN */}
      <label className="block border rounded-lg p-4 cursor-pointer hover:border-fucsia">
        <input 
          type="radio" 
          name="payment_method" 
          value="bank_transfer_mxn"
          onChange={(e) => {
            setSelected(e.target.value)
            onSelect('bank_transfer_mxn')
          }}
        />
        <div className="ml-3">
          <div className="font-semibold">🏦 Transferencia bancaria</div>
          <div className="text-sm text-gray-600">
            Pesos mexicanos (MXN) • Sin comisión • Validación manual 24-48h
          </div>
        </div>
      </label>

      {/* Stripe USD */}
      <label className="block border rounded-lg p-4 cursor-pointer hover:border-fucsia">
        <input 
          type="radio" 
          name="payment_method" 
          value="stripe_usd"
          onChange={(e) => {
            setSelected(e.target.value)
            onSelect('stripe_usd')
          }}
        />
        <div className="ml-3">
          <div className="font-semibold">💳 Tarjeta internacional</div>
          <div className="text-sm text-gray-600">
            Dólares (USD) • Confirmación inmediata • Comisión Stripe incluida
          </div>
        </div>
      </label>
    </div>
  )
}
```

---

### 4.2 Página: `/orders/[id]/payment-instructions`

**Propósito:** Mostrar datos bancarios + upload comprobante

```tsx
export default async function PaymentInstructionsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const order = await getOrder(params.id)
  const bankAccount = await getBankAccountConfig('bagclue_banorte_mxn')

  if (order.payment_method !== 'bank_transfer_mxn') {
    redirect(`/account/orders/${params.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Status badge */}
      <div className="mb-6">
        {order.payment_status === 'pending' && !order.bank_proof_url && (
          <StatusBadge variant="warning">
            ⏳ Esperando pago
          </StatusBadge>
        )}
        {order.payment_status === 'pending' && order.bank_proof_url && (
          <StatusBadge variant="info">
            📎 Comprobante recibido — Validando...
          </StatusBadge>
        )}
      </div>

      {/* Instrucciones */}
      <Card>
        <h2 className="text-2xl font-serif mb-4">Completa tu pago</h2>
        
        <div className="space-y-4">
          <InfoRow label="Banco" value={bankAccount.bank_name} />
          <InfoRow label="Beneficiario" value={bankAccount.account_holder_name} />
          <InfoRow label="CLABE" value={bankAccount.clabe} />
          <InfoRow 
            label="Referencia" 
            value={order.payment_reference}
            highlight
            copyable
          />
          <InfoRow 
            label="Monto" 
            value={`$${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}
            highlight
          />
        </div>

        <Alert variant="warning" className="mt-6">
          <strong>⚠️ Importante:</strong>
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>Usa exactamente la referencia mostrada</li>
            <li>El monto debe ser exacto</li>
            <li>No olvides subir tu comprobante</li>
            <li>Validaremos tu pago en máximo 48 horas</li>
          </ul>
        </Alert>

        {/* Upload comprobante */}
        {!order.bank_proof_url ? (
          <UploadProofButton orderId={order.id} />
        ) : (
          <div className="mt-6">
            <StatusMessage variant="success">
              ✓ Comprobante subido correctamente
            </StatusMessage>
            <p className="text-sm text-gray-600 mt-2">
              Estamos validando tu pago. Te notificaremos por email.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
```

---

### 4.3 Componente: `<UploadProofModal>`

```tsx
'use client'

export function UploadProofButton({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success('Comprobante subido correctamente')
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full mt-6">
        📎 Subir comprobante
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h3 className="text-xl font-semibold mb-4">Subir comprobante de pago</h3>

        <FileDrop
          accept="image/*,application/pdf"
          maxSize={5 * 1024 * 1024}  // 5 MB
          onFileSelect={setFile}
        />

        {file && (
          <div className="mt-4">
            <FilePreview file={file} />
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full mt-4"
            >
              {uploading ? 'Subiendo...' : 'Confirmar y subir'}
            </Button>
          </div>
        )}
      </Modal>
    </>
  )
}
```

---

### 4.4 Modificar: `/checkout` Flow

```tsx
// pages/checkout/page.tsx

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<string>()

  const handleCheckout = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: paymentMethod,
        currency: paymentMethod === 'stripe_usd' ? 'USD' : 'MXN',
        products: cart.items
      })
    })

    const data = await res.json()

    if (paymentMethod === 'bank_transfer_mxn') {
      // Redirect a instrucciones bancarias
      router.push(data.redirect_url)
    } else {
      // Redirect a Stripe Checkout
      window.location.href = data.checkout_url
    }
  }

  return (
    <div>
      <h1>Checkout</h1>
      
      <OrderSummary cart={cart} />
      
      <PaymentMethodSelector onSelect={setPaymentMethod} />
      
      <Button 
        onClick={handleCheckout}
        disabled={!paymentMethod}
      >
        Continuar
      </Button>
    </div>
  )
}
```

---

### 4.5 Modificar: `/account/orders/[id]`

**Agregar sección para bank transfer pending:**

```tsx
{order.payment_method === 'bank_transfer_mxn' && order.payment_status === 'pending' && (
  <Card className="mb-6">
    <h3 className="text-lg font-semibold mb-4">💰 Pago pendiente</h3>
    
    {!order.bank_proof_url ? (
      <div>
        <p className="text-gray-600 mb-4">
          Completa tu transferencia bancaria para confirmar tu pedido.
        </p>
        <Button href={`/orders/${order.id}/payment-instructions`}>
          Ver instrucciones de pago
        </Button>
      </div>
    ) : (
      <div>
        <StatusBadge variant="info">
          ✓ Comprobante recibido
        </StatusBadge>
        <p className="text-sm text-gray-600 mt-2">
          Estamos validando tu pago. Te notificaremos por email cuando esté confirmado.
        </p>
      </div>
    )}
  </Card>
)}
```

---

## 5. CAMBIOS ADMIN

### 5.1 Nueva Página: `/admin/payments/pending-verification`

```tsx
export default async function PendingPaymentsPage() {
  const pendingTransactions = await supabaseAdmin
    .from('payment_transactions')
    .select(`
      *,
      orders (id, customer_name, customer_email, total),
      layaways (id, product_id, total_amount),
      layaway_payments (id, payment_number, amount_due)
    `)
    .eq('status', 'proof_uploaded')
    .order('proof_uploaded_at', { ascending: true })

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">
        Pagos pendientes de validación
      </h1>

      {pendingTransactions.length === 0 ? (
        <EmptyState>No hay comprobantes pendientes</EmptyState>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map(tx => (
            <PaymentVerificationCard key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
```

---

### 5.2 Componente: `<PaymentVerificationCard>`

```tsx
function PaymentVerificationCard({ transaction }: { transaction: PaymentTransaction }) {
  const [showProof, setShowProof] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const handleApprove = async () => {
    const confirmed = confirm('¿Confirmar que el pago es válido?')
    if (!confirmed) return

    await fetch(`/api/admin/payments/${transaction.id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    })

    toast.success('Pago aprobado')
    router.refresh()
  }

  const handleReject = async (reason: string) => {
    await fetch(`/api/admin/payments/${transaction.id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'reject',
        rejection_reason: reason
      })
    })

    toast.success('Comprobante rechazado')
    router.refresh()
    setRejecting(false)
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">
            {transaction.payment_type === 'full_purchase' && 'Compra completa'}
            {transaction.payment_type === 'layaway_deposit' && 'Depósito apartado'}
            {transaction.payment_type === 'layaway_installment' && `Cuota ${transaction.layaway_payments?.payment_number}`}
          </h3>
          
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <div>Cliente: {transaction.orders?.customer_name}</div>
            <div>Email: {transaction.orders?.customer_email}</div>
            <div>Monto: ${transaction.amount.toLocaleString()} {transaction.currency}</div>
            <div>Referencia: {transaction.payment_reference}</div>
            <div>Subido: {formatRelativeTime(transaction.proof_uploaded_at)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowProof(true)}
          >
            👁️ Ver comprobante
          </Button>
          <Button 
            variant="success"
            onClick={handleApprove}
          >
            ✓ Aprobar
          </Button>
          <Button 
            variant="danger"
            onClick={() => setRejecting(true)}
          >
            ✗ Rechazar
          </Button>
        </div>
      </div>

      {/* Modal ver comprobante */}
      <Modal isOpen={showProof} onClose={() => setShowProof(false)}>
        <img 
          src={transaction.proof_url} 
          alt="Comprobante" 
          className="max-w-full"
        />
      </Modal>

      {/* Modal rechazar */}
      <Modal isOpen={rejecting} onClose={() => setRejecting(false)}>
        <h3 className="text-lg font-semibold mb-4">Rechazar comprobante</h3>
        <textarea
          placeholder="Explica por qué el comprobante no es válido..."
          className="w-full border rounded p-2"
          rows={4}
        />
        <Button onClick={handleReject}>Confirmar rechazo</Button>
      </Modal>
    </Card>
  )
}
```

---

### 5.3 Modificar: `/admin/envios` (Filtros)

**Agregar filtro por payment_method:**

```tsx
<FilterBar>
  <FilterButton 
    active={filter === 'all'}
    onClick={() => setFilter('all')}
  >
    Todos
  </FilterButton>
  
  <FilterButton 
    active={filter === 'bank_transfer'}
    onClick={() => setFilter('bank_transfer')}
  >
    🏦 Transferencia
  </FilterButton>
  
  <FilterButton 
    active={filter === 'stripe'}
    onClick={() => setFilter('stripe')}
  >
    💳 Stripe
  </FilterButton>
</FilterBar>
```

**Agregar badge en lista:**

```tsx
<OrderCard order={order}>
  {/* ... */}
  <Badge>
    {order.payment_method === 'bank_transfer_mxn' ? '🏦 Transferencia MXN' : '💳 Tarjeta USD'}
  </Badge>
</OrderCard>
```

---

### 5.4 Nueva Sección: Admin Notes (Interno)

**En detalle de order/layaway:**

```tsx
<Card>
  <h3 className="font-semibold mb-4">Notas internas (Admin only)</h3>
  
  <textarea
    value={adminNotes}
    onChange={(e) => setAdminNotes(e.target.value)}
    placeholder="Notas sobre este pago..."
    className="w-full border rounded p-2"
    rows={3}
  />
  
  <Button onClick={saveNotes}>Guardar notas</Button>
</Card>
```

---

## 6. CAMBIOS EMAILS

### 6.1 Nuevo Template: `bank-transfer-instructions.ts`

**Trigger:** Order/layaway creado con `payment_method=bank_transfer_mxn`

```typescript
export function generateBankTransferInstructionsHTML(params: {
  customerName: string
  orderId: string
  productName: string
  amount: number
  currency: string
  paymentReference: string
  bankDetails: {
    bank: string
    accountHolder: string
    clabe: string
  }
  uploadUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* ... estilos Bagclue ... */
    .highlight-box {
      background: #FFF4A8;
      border: 2px solid #E85A9A;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BAGCLUE</div>
    </div>
    
    <div class="card">
      <h1>✓ Pedido Reservado</h1>
      
      <p>Hola ${params.customerName},</p>
      
      <p>Tu pedido <strong>#${params.orderId}</strong> ha sido reservado exitosamente.</p>
      
      <div class="product-box">
        <strong>Producto:</strong> ${params.productName}<br>
        <strong>Total:</strong> $${params.amount.toLocaleString()} ${params.currency}
      </div>
      
      <h2>Completa tu pago</h2>
      
      <p>Realiza una transferencia bancaria SPEI con los siguientes datos:</p>
      
      <div class="highlight-box">
        <div style="margin-bottom: 12px;">
          <strong>Banco:</strong> ${params.bankDetails.bank}
        </div>
        <div style="margin-bottom: 12px;">
          <strong>Beneficiario:</strong> ${params.bankDetails.accountHolder}
        </div>
        <div style="margin-bottom: 12px;">
          <strong>CLABE:</strong> ${params.bankDetails.clabe}
        </div>
        <div style="margin-bottom: 12px; font-size: 18px; color: #E85A9A;">
          <strong>Referencia:</strong> ${params.paymentReference}
        </div>
        <div style="font-size: 20px; font-weight: 700;">
          <strong>Monto:</strong> $${params.amount.toLocaleString()} ${params.currency}
        </div>
      </div>
      
      <div style="background: #FFF3F3; border-left: 4px solid #E85A9A; padding: 16px; margin: 24px 0;">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Usa exactamente la <strong>referencia mostrada</strong></li>
          <li>El monto debe ser <strong>exacto</strong></li>
          <li>No olvides <strong>subir tu comprobante</strong></li>
          <li>Validaremos tu pago en máximo <strong>48 horas</strong></li>
        </ul>
      </div>
      
      <a href="${params.uploadUrl}" class="button">
        📎 Subir comprobante
      </a>
      
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Una vez que validemos tu pago, te enviaremos un email de confirmación.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Bagclue</strong><br>
      Piezas de lujo auténticas<br>
      hola@bagclue.com</p>
    </div>
  </div>
</body>
</html>
  `
}
```

---

### 6.2 Nuevo Template: `bank-payment-confirmed.ts`

**Trigger:** Admin aprueba comprobante

```typescript
export function generateBankPaymentConfirmedHTML(params: {
  customerName: string
  orderId: string
  productName: string
  amount: number
  currency: string
  nextStepUrl: string
}) {
  return `
<html>
<!-- ... -->
<div class="card">
  <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">✅</div>
  <h1>¡Pago Confirmado!</h1>
  
  <p>Hola ${params.customerName},</p>
  
  <p>Tu pago de <strong>$${params.amount.toLocaleString()} ${params.currency}</strong> ha sido verificado correctamente.</p>
  
  <div class="status-badge" style="background: #10B981;">
    ✓ Pago Verificado
  </div>
  
  <div class="detail-box">
    <div>Pedido: #${params.orderId}</div>
    <div>Producto: ${params.productName}</div>
    <div>Monto: $${params.amount.toLocaleString()} ${params.currency}</div>
  </div>
  
  <p><strong>Próximo paso:</strong> Confirma tu dirección de envío para que podamos preparar tu pedido.</p>
  
  <a href="${params.nextStepUrl}" class="button">
    Confirmar dirección de envío
  </a>
</div>
<!-- ... -->
</html>
  `
}
```

---

### 6.3 Nuevo Template: `bank-payment-rejected.ts`

**Trigger:** Admin rechaza comprobante

```typescript
export function generateBankPaymentRejectedHTML(params: {
  customerName: string
  orderId: string
  rejectionReason: string
  uploadUrl: string
  paymentReference: string
  amount: number
}) {
  return `
<html>
<!-- ... -->
<div class="card">
  <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">⚠️</div>
  <h1>Comprobante No Válido</h1>
  
  <p>Hola ${params.customerName},</p>
  
  <p>Revisamos el comprobante de pago que subiste para el pedido <strong>#${params.orderId}</strong>, pero no pudimos validarlo.</p>
  
  <div style="background: #FFF3F3; border: 2px solid #E85A9A; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <strong>Motivo:</strong><br>
    ${params.rejectionReason}
  </div>
  
  <p><strong>¿Qué hacer?</strong></p>
  <ul>
    <li>Verifica que el monto sea exacto: <strong>$${params.amount.toLocaleString()} MXN</strong></li>
    <li>Verifica que usaste la referencia: <strong>${params.paymentReference}</strong></li>
    <li>Sube un nuevo comprobante claro y legible</li>
  </ul>
  
  <a href="${params.uploadUrl}" class="button">
    Subir nuevo comprobante
  </a>
  
  <p style="font-size: 14px; color: #666; margin-top: 24px;">
    Si tienes dudas, contáctanos por WhatsApp o Instagram.
  </p>
</div>
<!-- ... -->
</html>
  `
}
```

---

### 6.4 Nuevo Template: `layaway-payment-reminder.ts`

**Trigger:** Cuota de apartado próxima a vencer (5 días antes)

```typescript
export function generateLayawayPaymentReminderHTML(params: {
  customerName: string
  layawayId: string
  productName: string
  paymentNumber: number
  totalPayments: number
  amountDue: number
  dueDate: string
  paymentReference: string
  bankDetails: BankDetails
  uploadUrl: string
}) {
  return `
<html>
<!-- ... -->
<div class="card">
  <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">💰</div>
  <h1>Recordatorio de Pago Semanal</h1>
  
  <p>Hola ${params.customerName},</p>
  
  <p>Tu siguiente cuota para el apartado de <strong>${params.productName}</strong> vence pronto.</p>
  
  <div class="detail-box">
    <div>Cuota: #${params.paymentNumber} de ${params.totalPayments}</div>
    <div>Monto: $${params.amountDue.toLocaleString()} MXN</div>
    <div>Vencimiento: ${params.dueDate}</div>
  </div>
  
  <div class="progress-bar">
    <!-- Progress visual -->
  </div>
  
  <h2>Realiza tu pago</h2>
  
  <div class="highlight-box">
    <div>Banco: ${params.bankDetails.bank}</div>
    <div>CLABE: ${params.bankDetails.clabe}</div>
    <div style="color: #E85A9A;"><strong>Referencia: ${params.paymentReference}</strong></div>
    <div><strong>Monto: $${params.amountDue.toLocaleString()} MXN</strong></div>
  </div>
  
  <a href="${params.uploadUrl}" class="button">
    Subir comprobante de pago
  </a>
  
  <p style="font-size: 14px; color: #666; margin-top: 24px;">
    <strong>Recuerda:</strong> Si pasas más de 6 semanas sin realizar un pago, tu apartado puede ser cancelado según nuestra política.
  </p>
</div>
<!-- ... -->
</html>
  `
}
```

---

### 6.5 Nuevo Template: `proof-received-confirmation.ts`

**Trigger:** Usuario sube comprobante

```typescript
export function generateProofReceivedHTML(params: {
  customerName: string
  orderId: string
}) {
  return `
<html>
<!-- ... -->
<div class="card">
  <h1>✓ Comprobante Recibido</h1>
  
  <p>Hola ${params.customerName},</p>
  
  <p>Recibimos el comprobante de pago para tu pedido <strong>#${params.orderId}</strong>.</p>
  
  <div class="status-badge" style="background: #3B82F6;">
    📎 Comprobante en Revisión
  </div>
  
  <p>Estamos validando tu pago. Te notificaremos por email cuando esté confirmado (máximo 48 horas).</p>
  
  <p style="font-size: 14px; color: #666; margin-top: 24px;">
    Gracias por tu paciencia 💕
  </p>
</div>
<!-- ... -->
</html>
  `
}
```

---

## 7. SEGURIDAD

### 7.1 Datos Bancarios — NO Hardcodear

**❌ PROHIBIDO:**
```typescript
// ❌ NO hacer esto
const BANK_CLABE = "012345678901234567"  // hardcoded
```

**✅ CORRECTO:**
```typescript
// Opción A: Env variable (simple)
const BANK_CLABE = process.env.BANK_CLABE_BAGCLUE_MXN

// Opción B: DB table (recomendado)
const bankAccount = await supabaseAdmin
  .from('bank_account_config')
  .select('*')
  .eq('account_key', 'bagclue_banorte_mxn')
  .single()

const BANK_CLABE = bankAccount.clabe
```

---

### 7.2 NO Imprimir CLABE en Logs

**❌ PROHIBIDO:**
```typescript
console.log('Bank details:', { clabe: BANK_CLABE })  // ❌ NO
```

**✅ CORRECTO:**
```typescript
console.log('Bank details loaded for account:', accountKey)  // ✅ SI (sin valor sensible)
```

---

### 7.3 Mostrar Datos Bancarios SOLO en Contexto Correcto

**✅ PERMITIDO mostrar:**
- Página `/orders/{id}/payment-instructions` (usuario autenticado, owner del order)
- Email instrucciones bancarias (destinatario: customer_email del order)
- Admin panel (admin role)

**❌ PROHIBIDO mostrar:**
- Logs públicos
- Respuestas API sin autenticación
- Frontend público (landing, catálogo, etc.)

---

### 7.4 Upload Comprobantes — Validaciones

```typescript
// POST /api/orders/[id]/upload-proof

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticación
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. Ownership
  const order = await getOrder(params.id)
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3. Payment method válido
  if (order.payment_method !== 'bank_transfer_mxn') {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }
  
  // 4. Estado válido
  if (order.payment_status !== 'pending') {
    return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
  }
  
  // 5. File validation
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  
  // 6. File type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ 
      error: 'Invalid file type. Use JPG, PNG or PDF' 
    }, { status: 400 })
  }
  
  // 7. File size (5 MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ 
      error: 'File too large. Max 5 MB' 
    }, { status: 400 })
  }
  
  // 8. Rate limit (3 uploads por hora)
  const recentUploads = await checkRecentUploads(user.id)
  if (recentUploads >= 3) {
    return NextResponse.json({ 
      error: 'Too many uploads. Try again in 1 hour' 
    }, { status: 429 })
  }
  
  // 9. Duplicate check (SHA256 hash)
  const buffer = await file.arrayBuffer()
  const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex')
  
  const duplicate = await supabaseAdmin
    .from('payment_transactions')
    .select('id')
    .eq('proof_hash', hash)
    .eq('status', 'confirmed')
    .single()
  
  if (duplicate) {
    return NextResponse.json({ 
      error: 'Este comprobante ya fue usado en otro pedido' 
    }, { status: 400 })
  }
  
  // 10. Upload to storage
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`
  const path = `orders/${params.id}/${filename}`
  
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('bank-proofs')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false
    })
  
  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
  
  // 11. Update payment_transaction
  await supabaseAdmin
    .from('payment_transactions')
    .update({
      proof_url: uploadData.path,
      proof_hash: hash,
      status: 'proof_uploaded',
      proof_uploaded_at: new Date().toISOString()
    })
    .eq('order_id', params.id)
  
  // 12. Send confirmation email
  await sendProofReceivedEmail({ orderId: params.id, customerEmail: order.customer_email })
  
  // 13. Notify admin
  await notifyAdminNewProof({ orderId: params.id })
  
  return NextResponse.json({ success: true, proof_url: uploadData.path })
}
```

---

### 7.5 Admin Verification — Authorization

```typescript
// PATCH /api/admin/payments/[id]/verify

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // 1. Admin only
  const user = await getUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { action, rejection_reason } = await req.json()
  
  // 2. Valid actions
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  
  // 3. Rejection reason required if rejecting
  if (action === 'reject' && !rejection_reason?.trim()) {
    return NextResponse.json({ 
      error: 'Rejection reason is required' 
    }, { status: 400 })
  }
  
  // Continue with approval/rejection logic...
}
```

---

### 7.6 RLS Policies — Supabase

```sql
-- payment_transactions: Users can only see their own
CREATE POLICY "Users see own transactions"
ON payment_transactions FOR SELECT TO authenticated
USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  OR layaway_id IN (SELECT id FROM layaways WHERE user_id = auth.uid())
);

-- payment_transactions: Only admin can update
CREATE POLICY "Admin can update transactions"
ON payment_transactions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- bank_account_config: Public can read (only safe fields via view)
CREATE OR REPLACE VIEW public_bank_accounts AS
SELECT 
  account_key,
  bank_name,
  account_holder_name,
  clabe,  -- OK mostrar
  currency
FROM bank_account_config
WHERE is_active = true;
-- NO incluir account_number (interno admin only)

-- Storage bank-proofs: Users upload own, admin sees all
-- (Ver sección 3.6)
```

---

### 7.7 Env Variables Seguras

```env
# .env.local (NUNCA commitear)

# Exchange rate
EXCHANGE_RATE_USD_TO_MXN=17.5

# Bank account Bagclue (opción env, o mejor: usar DB table)
BANK_CLABE_BAGCLUE_MXN=012345678901234567
BANK_ACCOUNT_HOLDER=Bagclue
BANK_NAME=Banorte

# Stripe (ya configurado)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 8. RIESGOS

### 8.1 Pago Duplicado

**Escenario:** Usuario transfiere 2 veces por error.

**Mitigación:**
- Check duplicate hash SHA256 del comprobante
- Admin valida monto exacto antes de aprobar
- Backend verifica `payment_status !== 'paid'` antes de confirmar

**Procedimiento si ocurre:**
1. Admin detecta segundo pago
2. Contactar cliente por email/WhatsApp
3. Coordinar reembolso o aplicar a siguiente compra

---

### 8.2 Comprobante Falso/Editado

**Escenario:** Usuario edita captura de pantalla (Photoshop).

**Mitigación:**
- Validación manual admin (revisar detalles: banco, fecha, folio)
- Verificar en banca online real si hay duda
- Rechazar comprobantes con señales de edición (pixeles, fuentes inconsistentes)

**Procedimiento:**
1. Admin marca como rechazado
2. Email con razón: "Comprobante no válido — detectamos inconsistencias"
3. Solicitar captura directa de app bancaria (no screenshots editables)

---

### 8.3 Monto Incorrecto

**Escenario:** Usuario transfiere $150,000 en vez de $189,000.

**Mitigación:**
- Admin valida monto EXACTO antes de aprobar
- Backend guarda `amount` esperado en `payment_transaction`

**Procedimiento:**
1. Admin rechaza comprobante
2. Email: "Monto incorrecto — transferiste $150,000, el total es $189,000"
3. Usuario completa diferencia ($39,000)
4. Sube nuevo comprobante
5. Admin valida suma total

**Alternativa:**
- Crear `payment_transaction` parcial si cliente acepta
- Generar segundo payment para diferencia

---

### 8.4 Tipo de Cambio Incorrecto

**Escenario:** Exchange rate cambia después de crear order, usuario reclama.

**Mitigación:**
- Fijar `exchange_rate` al momento de crear order/layaway (INMUTABLE)
- Guardar en DB: `order.exchange_rate = 17.5`
- NO recalcular después
- Mostrar en UI: "Tasa de cambio aplicada: 17.5 MXN/USD"

**Procedimiento si reclama:**
1. Mostrar evidence: "Tu orden fue creada con tasa 17.5 el día X"
2. Explicar: "La tasa se fija al crear la orden para protección de ambas partes"
3. Si cambio significativo (>5%) y cliente insiste → evaluar caso por caso (buena fe)

---

### 8.5 Stock Reservado Demasiado Tiempo

**Escenario:** Usuario crea order bank_transfer pero nunca paga. Producto queda bloqueado.

**Mitigación:**
- Marcar product `status = 'pending_payment'` (nuevo status)
- Implementar expiry automático:
  - Si no sube comprobante en 48h → enviar email recordatorio
  - Si no sube comprobante en 7 días → cancelar order automático, liberar producto
- Cron job diario: revisar orders con `payment_status=pending` + `created_at < NOW() - 7 days`

**Implementación:**
```typescript
// Cron job (ejecutar diariamente)
async function expireStaleOrders() {
  const staleOrders = await supabaseAdmin
    .from('orders')
    .select('id, product_id')
    .eq('payment_method', 'bank_transfer_mxn')
    .eq('payment_status', 'pending')
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  
  for (const order of staleOrders) {
    // Cancelar order
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', order.id)
    
    // Liberar producto
    await supabaseAdmin
      .from('products')
      .update({ status: 'available' })
      .eq('id', order.product_id)
    
    // Email notificación
    await sendOrderExpiredEmail({ orderId: order.id })
  }
}
```

---

### 8.6 Cliente Paga Sin Referencia

**Escenario:** Usuario transfiere pero NO usa la referencia única.

**Mitigación:**
- Instruir claramente: "⚠️ Usa exactamente la referencia: BAGCLUE-A3F8B2C1"
- Admin puede buscar por monto + fecha si ocurre

**Procedimiento:**
1. Usuario reporta: "Transferí pero no usé la referencia"
2. Admin busca en banca online: monto + fecha + cuenta origen
3. Si se encuentra: aprobar manualmente + agregar nota interna
4. Si NO se encuentra: solicitar comprobante + coordinar nueva transferencia

---

### 8.7 Mezclar MXN/USD

**Escenario:** Usuario crea layaway USD pero quiere pagar cuota en MXN.

**Mitigación:**
- NO permitir cambio de currency mid-layaway
- Validación backend:
  ```typescript
  if (layaway.currency !== paymentCurrency) {
    throw new Error('No puedes cambiar la moneda durante el apartado')
  }
  ```
- UI: Deshabilitar selector método de pago si ya existe layaway activo

**Mensaje si intenta:**
"Tu apartado fue iniciado en USD. Todas las cuotas deben pagarse en la misma moneda."

---

### 8.8 Stripe Test/Live Mezclados

**Escenario:** Orders con Stripe test keys en producción.

**Mitigación:**
- Validar en webhook:
  ```typescript
  if (session.livemode === false && process.env.NODE_ENV === 'production') {
    console.error('TEST MODE payment in PRODUCTION detected!')
    // Alertar admin
    await notifyAdminTestPayment({ sessionId: session.id })
    return  // NO procesar como pago real
  }
  ```
- UI badge en admin: Mostrar "🧪 TEST MODE" si order.stripe_session_id empieza con `cs_test_`

---

### 8.9 Race Condition — Doble Click Upload

**Escenario:** Usuario hace doble click en "Subir comprobante", se duplica request.

**Mitigación:**
- Frontend: Deshabilitar botón durante upload (loading state)
- Backend: Idempotency check:
  ```typescript
  const existing = await getPaymentTransaction({ order_id: orderId })
  if (existing.proof_url) {
    return NextResponse.json({ 
      success: true, 
      proof_url: existing.proof_url,
      message: 'Comprobante ya fue subido anteriormente'
    })
  }
  ```

---

### 8.10 Admin Aprueba Sin Verificar

**Escenario:** Admin aprueba pago sin revisar comprobante realmente.

**Mitigación:**
- UI forzar: Click "Ver comprobante" antes de permitir "Aprobar"
- Tracking: Guardar `confirmed_by` user_id + timestamp
- Auditoría: Reporte mensual de pagos aprobados por admin

**Procedimiento si ocurre fraude:**
1. Detectar: Producto enviado pero pago nunca recibido
2. Auditar: Revisar payment_transaction + comprobante
3. Responsabilizar: Admin que aprobó
4. Recuperar: Contactar cliente, coordinar devolución o pago

---

## 9. SUBFASES RECOMENDADAS

### FASE 1 — DB Schema + Config (2-3 días)

**Entregables:**
- ✅ Migration: Crear tabla `payment_transactions`
- ✅ Migration: Agregar campos a `orders` (payment_method, payment_currency, etc.)
- ✅ Migration: Agregar campos a `layaways` y `layaway_payments`
- ✅ Migration: Crear tabla `bank_account_config`
- ✅ Supabase Storage: Bucket `bank-proofs` + RLS policies
- ✅ Seed data: Insertar cuenta Banorte en `bank_account_config`
- ✅ Actualizar `types/database.ts`

**Testing:**
- Migrations aplicadas sin errores
- Storage bucket creado
- RLS policies funcionan (admin ve todo, users solo sus archivos)

---

### FASE 2 — Backend Core (3-4 días)

**Entregables:**
- ✅ Helper: `calculateUSD(priceMXN)` → USD
- ✅ Helper: `generatePaymentReference(orderId)` → "BAGCLUE-{short_id}"
- ✅ Helper: `getBankAccountConfig(key)` → bank details
- ✅ API: POST `/api/checkout` (modificar para aceptar payment_method)
- ✅ API: POST `/api/orders/[id]/upload-proof`
- ✅ API: PATCH `/api/admin/payments/[id]/verify`
- ✅ Webhook: Modificar `/api/stripe/webhook` (guardar payment_method, currency, exchange_rate)

**Testing:**
- Crear order con `payment_method=bank_transfer_mxn` → OK
- Crear order con `payment_method=stripe_usd` → Stripe Checkout USD OK
- Upload comprobante → Storage OK
- Admin aprobar/rechazar → DB actualizado OK

---

### FASE 3 — Frontend Customer (3-4 días)

**Entregables:**
- ✅ Component: `<PaymentMethodSelector>`
- ✅ Page: `/orders/[id]/payment-instructions`
- ✅ Component: `<UploadProofModal>`
- ✅ Modificar: `/checkout` flow (integrar selector)
- ✅ Modificar: `/account/orders/[id]` (mostrar estado comprobante)

**Testing:**
- Selector método de pago funciona
- Página instrucciones bancarias muestra datos correctos
- Upload comprobante exitoso
- UI actualiza estado después de upload

---

### FASE 4 — Frontend Admin (2-3 días)

**Entregables:**
- ✅ Page: `/admin/payments/pending-verification`
- ✅ Component: `<PaymentVerificationCard>`
- ✅ Modificar: `/admin/envios` (agregar filtro payment_method)
- ✅ Admin notes: Textarea para notas internas

**Testing:**
- Admin ve listado comprobantes pendientes
- Ver comprobante en modal funciona
- Aprobar pago → order confirmed + email OK
- Rechazar pago → email rejection OK

---

### FASE 5 — Emails (2 días)

**Entregables:**
- ✅ Template: `bank-transfer-instructions.ts`
- ✅ Template: `bank-payment-confirmed.ts`
- ✅ Template: `bank-payment-rejected.ts`
- ✅ Template: `proof-received-confirmation.ts`
- ✅ Template: `layaway-payment-reminder.ts`
- ✅ Integrar triggers en backend

**Testing:**
- Email instrucciones enviado al crear order bank_transfer
- Email confirmación enviado cuando admin aprueba
- Email rechazo enviado cuando admin rechaza
- Email recordatorio cuota enviado (manual test)
- HTML renderiza correctamente en Gmail/Outlook

---

### FASE 6 — Layaways Dual Payment (3-4 días)

**Entregables:**
- ✅ API: Modificar `/api/layaways/create` (aceptar payment_method)
- ✅ API: POST `/api/layaways/[id]/payments/[payment_id]/upload-proof`
- ✅ API: PATCH `/api/admin/layaways/[id]/payments/[payment_id]/verify`
- ✅ Frontend: Integrar selector en layaway flow
- ✅ Frontend: Page instrucciones bancarias para cuota
- ✅ Admin: Sección verificación cuotas layaway

**Testing:**
- Crear layaway bank_transfer MXN → instrucciones OK
- Upload comprobante cuota → OK
- Admin aprobar cuota → layaway amounts actualizados OK
- Crear layaway Stripe USD → Checkout USD OK
- Webhook cuota Stripe → amounts actualizados OK

---

### FASE 7 — Security + Expiry (2 días)

**Entregables:**
- ✅ Rate limiting: 3 uploads por hora
- ✅ Duplicate check: SHA256 hash
- ✅ Expiry cron job: Cancelar orders >7 días sin pago
- ✅ Validación Stripe test/live mode
- ✅ Auditoría admin actions logging

**Testing:**
- Upload 4to comprobante en 1h → rate limit 429
- Upload mismo comprobante 2x → error duplicate
- Order >7 días sin comprobante → cancelado + producto liberado
- Stripe test payment en prod → NO procesar + alertar

---

### FASE 8 — QA + Docs (3 días)

**Entregables:**
- ✅ Testing E2E completo:
  - Compra MXN bank transfer (end to end)
  - Compra USD Stripe (end to end)
  - Apartado MXN bank transfer (8 cuotas)
  - Apartado USD Stripe (8 cuotas)
  - Rechazo comprobante + re-upload
  - Expiry order
  - Duplicate upload
- ✅ Documentación admin: Guía validación pagos
- ✅ Documentación cliente: FAQ pagos bancarios
- ✅ Runbook: Procedimiento fraude/disputas

**Criterios:**
- 0 bugs críticos
- Todos los flujos happy path funcionan
- Emails llegan y renderizan bien
- Performance aceptable (<3s upload)

---

**TOTAL ESTIMADO:**  
- Desarrollo: 20-25 días (~4-5 semanas)
- QA: 3 días
- **Gran total: ~5 semanas**

---

## 10. CRITERIOS DE CIERRE

### 10.1 Funcional — Compra Completa Bank Transfer MXN

- [x] Usuario puede seleccionar "Transferencia bancaria" en checkout
- [x] Se crea order con `payment_method=bank_transfer_mxn`, `payment_status=pending`
- [x] Se crea `payment_transaction` con `status=pending`
- [x] Product queda `status=pending_payment` (temporal)
- [x] Usuario recibe email con datos bancarios + referencia única
- [x] Página `/orders/{id}/payment-instructions` muestra datos correctos
- [x] Usuario puede subir comprobante (JPG/PNG/PDF, max 5MB)
- [x] Backend valida: file type, size, duplicados (hash)
- [x] Comprobante se guarda en Storage con RLS correcto
- [x] `payment_transaction.status` cambia a `proof_uploaded`
- [x] Usuario recibe email "Comprobante recibido"
- [x] Admin recibe notificación email
- [x] Admin ve orden en `/admin/payments/pending-verification`
- [x] Admin puede ver comprobante en modal
- [x] Admin puede aprobar:
  - `payment_transaction.status = confirmed`
  - `order.payment_status = paid`
  - `order.status = confirmed`
  - `product.status = sold`
  - Email confirmación enviado
- [x] Admin puede rechazar:
  - `payment_transaction.status = rejected`
  - Email rechazo con razón enviado
  - Usuario puede subir nuevo comprobante
- [x] Flujo continúa normal después de pago confirmado

---

### 10.2 Funcional — Compra Completa Stripe USD

- [x] Usuario puede seleccionar "Tarjeta internacional"
- [x] Precio calculado en USD con `exchange_rate` fijado
- [x] Se crea order con `currency=USD`, `amount_usd`, `exchange_rate`
- [x] Se crea `payment_transaction` USD
- [x] Stripe Checkout Session en USD
- [x] Usuario paga con tarjeta
- [x] Webhook confirma pago automáticamente
- [x] `payment_transaction.status = confirmed`
- [x] `order.payment_status = paid`, `status = confirmed`
- [x] `product.status = sold`
- [x] Email confirmación enviado
- [x] Flujo continúa normal

---

### 10.3 Funcional — Apartado Bank Transfer MXN

- [x] Usuario puede seleccionar método de pago al apartar
- [x] Se crea layaway con `payment_method=bank_transfer_mxn`, `currency=MXN`
- [x] Se crean `layaway_payments[]` (cuotas programadas)
- [x] Primera cuota tiene `payment_reference` único
- [x] Se crea `payment_transaction` para depósito
- [x] Usuario recibe email con instrucciones bancarias
- [x] Usuario sube comprobante depósito
- [x] Admin valida depósito
- [x] Al aprobar:
  - `layaway_payments[0].status = paid`
  - `layaway.status = active`
  - `layaway.amount_paid` actualizado
  - `product.status = reserved`
  - Email apartado activado
- [x] Para cuotas 2-8:
  - Email recordatorio 5 días antes de vencimiento
  - Usuario transfiere + sube comprobante
  - Admin valida
  - Amounts actualizados
- [x] Última cuota:
  - `layaway.status = completed`
  - Order final creado
  - `product.status = sold`
  - Email apartado completado

---

### 10.4 Funcional — Apartado Stripe USD

- [x] Similar a bank transfer pero USD
- [x] Cada cuota vía Stripe Checkout USD
- [x] Webhook confirma automático (sin admin)
- [x] Amounts actualizados automáticamente
- [x] Última cuota → completed + order + sold

---

### 10.5 Seguridad

- [x] Datos bancarios NO hardcodeados (env o DB table)
- [x] CLABE NO impreso en logs
- [x] Datos bancarios mostrados SOLO en contexto seguro
- [x] Upload comprobantes: validación file type, size, rate limit
- [x] Duplicate check con SHA256 hash
- [x] RLS policies: users ven solo sus proofs, admin ve todo
- [x] Admin verification: solo role=admin puede aprobar/rechazar
- [x] Ownership check: users solo suben comprobantes de sus orders
- [x] Stripe test mode: detectado y NO procesado en prod

---

### 10.6 UX/UI

- [x] Selector método de pago claro y visible
- [x] Instrucciones bancarias fáciles de leer
- [x] Referencia única copyable
- [x] Upload comprobante: drag & drop + preview
- [x] Estados claros: "Esperando pago", "Comprobante recibido", "Pago confirmado"
- [x] Loading states durante upload
- [x] Error messages claros y accionables
- [x] Admin panel: listado claro, ver comprobante fácil, aprobar/rechazar simple

---

### 10.7 Emails

- [x] Instrucciones bancarias: enviado al crear order bank_transfer
- [x] Comprobante recibido: enviado al subir comprobante
- [x] Pago confirmado: enviado al aprobar admin
- [x] Pago rechazado: enviado al rechazar admin, con razón
- [x] Recordatorio cuota: enviado 5 días antes de vencimiento
- [x] Todos los emails: HTML responsive, estilo Bagclue, links funcionan

---

### 10.8 Performance

- [x] Upload comprobante: <5s para archivos 5MB
- [x] Página instrucciones bancarias: <2s load
- [x] Admin pending list: <3s load (max 100 items)
- [x] Checkout con selector: <2s respuesta

---

### 10.9 Testing

- [x] E2E: Compra bank transfer (upload válido + aprobado)
- [x] E2E: Compra bank transfer (upload rechazado + re-upload)
- [x] E2E: Compra Stripe USD
- [x] E2E: Apartado bank transfer (8 cuotas completas)
- [x] E2E: Apartado Stripe USD (8 cuotas)
- [x] Edge case: Duplicate upload → error
- [x] Edge case: File too large → error
- [x] Edge case: Rate limit → 429
- [x] Edge case: Order expired (>7 días) → cancelado
- [x] Edge case: Stripe test in prod → NO procesado

---

### 10.10 Documentación

- [x] README: Cómo funciona el sistema de pagos dual
- [x] Admin guide: Validación de comprobantes
- [x] Customer FAQ: Cómo pagar con transferencia bancaria
- [x] Runbook: Procedimiento fraude/disputas
- [x] Runbook: Rollback plan si algo falla

---

## ✅ SIGN-OFF

**Implementación COMPLETA cuando:**
- ✅ Todos los criterios 10.1-10.10 están marcados
- ✅ 0 bugs críticos en producción
- ✅ Testing E2E pasado
- ✅ Documentación entregada
- ✅ Jhonatan aprueba demo final

---

**Status:** 📋 SCOPE V2 COMPLETO — NO IMPLEMENTAR hasta aprobación

**Última actualización:** 2026-05-06 18:00 UTC
