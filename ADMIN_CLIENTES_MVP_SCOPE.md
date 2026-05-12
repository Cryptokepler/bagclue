# ADMIN CLIENTES MVP - SCOPE DOCUMENT

**Fecha:** 2026-05-12  
**Autor:** Kepler  
**Cliente:** Jhonatan (Bagclue)  
**Objetivo:** Diseñar área de gestión de clientes en admin de Bagclue  
**Estado:** DISEÑO (NO implementar hasta aprobación)

---

## 1. AUDITORÍA DE SCHEMA ACTUAL

### 1.1 Tablas existentes confirmadas ✅

#### customer_profiles
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES auth.users(id)  -- FK a Supabase Auth
email                 TEXT NOT NULL UNIQUE
name                  TEXT
phone                 TEXT
phone_country_code    TEXT (ej: "+34")
phone_country_iso     TEXT (ej: "ES")
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
welcome_email_sent_at TIMESTAMPTZ
```

**Propósito:** Perfil de cliente registrado (con cuenta Supabase Auth)

---

#### customer_addresses
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES auth.users(id)
full_name             TEXT
phone_country_code    TEXT
phone_country_iso     TEXT
phone                 TEXT
country               TEXT
state                 TEXT
city                  TEXT
postal_code           TEXT
address_line1         TEXT
address_line2         TEXT
delivery_references   TEXT
is_default            BOOLEAN
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

**Propósito:** Direcciones de envío de clientes registrados

---

#### orders
```sql
id                          UUID PRIMARY KEY
user_id                     UUID (nullable - permite guest checkout)
customer_name               TEXT NOT NULL
customer_email              TEXT NOT NULL
customer_phone              TEXT NOT NULL
customer_address            TEXT (deprecated - usar shipping_address)
shipping_address            TEXT
subtotal                    NUMERIC(12,2)
shipping                    NUMERIC(12,2)
total                       NUMERIC(12,2)
status                      TEXT (pending, confirmed, cancelled)
payment_status              TEXT (pending, paid, failed, refunded)
payment_method              TEXT (nullable, añadido en Payments MVP.1)
payment_currency            TEXT (nullable, MXN/USD)
payment_reference           TEXT (nullable)
exchange_rate               NUMERIC(12,6)
amount_mxn                  NUMERIC(12,2)
amount_usd                  NUMERIC(12,2)
payment_expires_at          TIMESTAMPTZ
shipping_status             TEXT (pending, preparing, shipped, delivered)
shipping_provider           TEXT (dhl, fedex, manual, null)
tracking_number             TEXT
tracking_url                TEXT
tracking_token              TEXT UNIQUE
shipped_at                  TIMESTAMPTZ
delivered_at                TIMESTAMPTZ
stripe_session_id           TEXT
stripe_payment_intent_id    TEXT
layaway_id                  UUID (nullable - si viene de apartado)
notes                       TEXT
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ

-- Shipping proof (Migration 019)
shipping_proof_url          TEXT
shipping_proof_file_name    TEXT
shipping_proof_file_type    TEXT
shipping_proof_file_size    INTEGER
shipping_proof_uploaded_at  TIMESTAMPTZ
```

**Propósito:** Pedidos (guest o registrados)

**Relación con clientes:**
- **Si user_id IS NOT NULL:** Cliente registrado
- **Si user_id IS NULL:** Cliente guest (identificado por customer_email)

---

#### order_items
```sql
id                    UUID PRIMARY KEY
order_id              UUID REFERENCES orders(id)
product_id            UUID REFERENCES products(id)
quantity              INTEGER
price                 NUMERIC(12,2)
created_at            TIMESTAMPTZ
```

**Propósito:** Ítems de cada pedido

---

#### payment_transactions
```sql
id                       UUID PRIMARY KEY
order_id                 UUID REFERENCES orders(id) (nullable)
layaway_id               UUID REFERENCES layaways(id) (nullable)
layaway_payment_id       UUID REFERENCES layaway_payments(id) (nullable)
payment_type             TEXT (full_purchase, layaway_deposit, layaway_installment)
payment_method           TEXT (bank_transfer_mxn, stripe_usd)
currency                 TEXT (MXN, USD)
amount                   NUMERIC(12,2)
amount_mxn               NUMERIC(12,2)
amount_usd               NUMERIC(12,2)
exchange_rate            NUMERIC(12,6)
status                   TEXT (pending, proof_uploaded, confirmed, rejected, failed, expired)
payment_reference        TEXT UNIQUE
proof_url                TEXT
proof_file_name          TEXT
proof_file_type          TEXT
proof_file_size          INTEGER
proof_hash               TEXT (SHA256)
stripe_session_id        TEXT
stripe_payment_intent_id TEXT
admin_notes              TEXT
rejection_reason         TEXT
confirmed_at             TIMESTAMPTZ
confirmed_by             UUID REFERENCES auth.users(id)
rejected_at              TIMESTAMPTZ
rejected_by              UUID REFERENCES auth.users(id)
expires_at               TIMESTAMPTZ
proof_uploaded_at        TIMESTAMPTZ
created_at               TIMESTAMPTZ
updated_at               TIMESTAMPTZ
```

**Propósito:** Transacciones de pago (Payments MVP.1)

**Relación con clientes:**
- payment_transactions → orders → customer_email/user_id
- payment_transactions → layaways → customer_email/user_id

---

#### layaways
```sql
id                              UUID PRIMARY KEY
product_id                      UUID REFERENCES products(id)
user_id                         UUID (nullable - permite guest)
customer_name                   TEXT NOT NULL
customer_email                  TEXT NOT NULL
customer_phone                  TEXT NOT NULL
product_price                   NUMERIC(12,2)
deposit_percent                 NUMERIC(5,2)
deposit_amount                  NUMERIC(12,2)
balance_amount                  NUMERIC(12,2)
currency                        TEXT
status                          TEXT (pending, active, completed, cancelled, forfeited)
plan_type                       TEXT (8_weekly_payments, etc.)
total_payments                  INTEGER
first_payment_amount            NUMERIC(12,2)
minimum_first_payment_amount    NUMERIC(12,2)
total_amount                    NUMERIC(12,2)
amount_paid                     NUMERIC(12,2)
amount_remaining                NUMERIC(12,2)
payments_completed              INTEGER
payments_remaining              INTEGER
next_payment_due_date           DATE
next_payment_amount             NUMERIC(12,2)
plan_start_date                 TIMESTAMPTZ
plan_end_date                   TIMESTAMPTZ
last_payment_at                 TIMESTAMPTZ
consecutive_weeks_without_payment INTEGER
forfeited_at                    TIMESTAMPTZ
completed_at                    TIMESTAMPTZ
cancelled_at                    TIMESTAMPTZ
order_id                        UUID (nullable - solo cuando se completa)
layaway_token                   TEXT UNIQUE
policy_version                  INTEGER
payment_method                  TEXT (nullable)
payment_currency                TEXT (nullable)
exchange_rate                   NUMERIC(12,6)
created_at                      TIMESTAMPTZ
expires_at                      TIMESTAMPTZ
notes                           TEXT
cancelled_by                    TEXT
cancellation_reason             TEXT

-- Stripe legacy (deprecated en Payments MVP.1)
deposit_session_id              TEXT
deposit_payment_intent_id       TEXT
deposit_paid_at                 TIMESTAMPTZ
balance_session_id              TEXT
balance_payment_intent_id       TEXT
balance_paid_at                 TIMESTAMPTZ
```

**Propósito:** Apartados (layaway system)

**Relación con clientes:**
- **Si user_id IS NOT NULL:** Cliente registrado
- **Si user_id IS NULL:** Cliente guest (identificado por customer_email)

---

#### layaway_payments
```sql
id                    UUID PRIMARY KEY
layaway_id            UUID REFERENCES layaways(id)
payment_number        INTEGER
amount                NUMERIC(12,2)
due_date              DATE
paid_at               TIMESTAMPTZ
stripe_session_id     TEXT (deprecated en Payments MVP.1)
stripe_payment_intent_id TEXT (deprecated)
status                TEXT (pending, paid, failed, expired)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

**Propósito:** Pagos individuales de un apartado

**Relación con clientes:**
- layaway_payments → layaways → customer_email/user_id

---

### 1.2 Relaciones identificadas

#### Cliente Registrado:
```
customer_profiles (user_id)
    ↓
customer_addresses (user_id)
orders (user_id)
layaways (user_id)
```

#### Cliente Guest:
```
orders (customer_email, user_id IS NULL)
layaways (customer_email, user_id IS NULL)
```

**Clave:** `customer_email` es el identificador común para agrupar actividad de guests.

---

## 2. MODELO DE CLIENTES PROPUESTO

### 2.1 Tipos de cliente

#### A) Cliente Registrado
- **Identificación primaria:** `user_id` (UUID de auth.users)
- **Identificación secundaria:** `email` (customer_profiles.email)
- **Características:**
  - Tiene cuenta en Supabase Auth
  - Puede tener múltiples direcciones guardadas
  - Puede ver su historial de pedidos/apartados
  - Aparece en customer_profiles

#### B) Cliente Guest
- **Identificación única:** `customer_email` (TEXT)
- **Características:**
  - NO tiene cuenta en Supabase Auth
  - NO aparece en customer_profiles
  - Pedidos/apartados solo con customer_email
  - Sin direcciones guardadas (se captura por pedido)
  - Puede tener múltiples pedidos bajo mismo email

#### C) Cliente Híbrido (edge case)
- **Escenario:** Hizo pedido guest, luego se registró
- **Problema:** Pedidos antiguos (user_id NULL) + pedidos nuevos (user_id NOT NULL)
- **Solución propuesta:** 
  - En vista admin, agrupar por email si existe coincidencia
  - Mostrar badge "Guest + Registrado"
  - Opción futura: migrar pedidos guest a cuenta registrada

### 2.2 Vista unificada de cliente (para admin)

**Estructura propuesta:**
```typescript
interface Cliente {
  // Identificación
  id: string              // user_id si registrado, email si guest
  type: 'registered' | 'guest' | 'hybrid'
  email: string
  name: string | null
  phone: string | null
  
  // Perfil (solo registrados)
  user_id: string | null
  created_at: string | null  // Fecha de registro
  
  // Estadísticas comerciales
  total_orders: number
  total_spent: number        // Suma de orders.total
  total_layaways: number
  active_layaways: number
  pending_payments: number   // payment_transactions con status pending/proof_uploaded
  balance_due: number        // Suma de layaways.amount_remaining + orders pending
  
  // Estado
  last_purchase_at: string | null
  customer_status: 'new' | 'active' | 'recurring' | 'inactive'
  
  // Flags de acción
  has_pending_address: boolean     // order con shipping_status pending y sin shipping_address
  has_payment_review: boolean      // payment_transaction con status proof_uploaded
  has_active_layaway: boolean      // layaway con status active
}
```

---

## 3. ARQUITECTURA PROPUESTA

### 3.1 Rutas

#### Lista de clientes
```
/admin/clientes
```

**Funcionalidad:**
- Tabla paginada de clientes
- Filtros y búsqueda
- Cards de resumen superior
- Acción "Ver cliente" → redirige a detalle

#### Detalle de cliente
```
/admin/clientes/[id]
```

**Parámetro `id`:**
- **Si registrado:** `user_id` (UUID)
- **Si guest:** `email` (encoded URL-safe)

**Ejemplo:**
- Registrado: `/admin/clientes/9b37d6cc-0b45-4a39-8226-d3022606fcd8`
- Guest: `/admin/clientes/jhonatanvenegas%40usdtcapital.es`

**Funcionalidad:**
- Perfil completo
- Direcciones (si registrado)
- Resumen comercial
- Lista de pedidos
- Lista de apartados
- Pagos pendientes de revisión
- Links a tracking/comprobantes

---

### 3.2 Vista `/admin/clientes` (Lista)

#### Cards superiores (8 métricas)

```typescript
interface DashboardMetrics {
  total_customers: number              // COUNT DISTINCT emails
  customers_with_purchases: number     // COUNT emails con orders.status = confirmed
  pending_payments_count: number       // COUNT payment_transactions status pending
  payments_under_review_count: number  // COUNT payment_transactions status proof_uploaded
  pending_address_count: number        // COUNT orders sin shipping_address
  active_layaways_count: number        // COUNT layaways status active
  total_sales_value: number            // SUM orders.total (status confirmed)
  total_balance_due: number            // SUM layaways.amount_remaining
}
```

#### Tabla de clientes

**Columnas:**
1. Nombre
2. Email
3. Teléfono
4. Total comprado (MXN)
5. # Pedidos
6. Pedidos pendientes
7. Pagos en revisión
8. Saldo pendiente (apartados)
9. Última compra
10. Estado
11. Acciones

**Badges de estado:**
- 🔴 **Pago en revisión** (payment_transaction proof_uploaded)
- 🟡 **Pendiente dirección** (order shipped pero sin shipping_address)
- 🟢 **Apartado activo** (layaway active)
- 🔵 **Recurrente** (>1 pedido confirmado)

#### Filtros

**Barra de búsqueda:**
- Nombre (ILIKE)
- Email (ILIKE)
- Teléfono (ILIKE)

**Dropdown de status:**
- Todos
- Con pagos pendientes
- Pago en revisión
- Compras confirmadas
- Pendientes de dirección
- Recurrentes (>1 pedido)

**Dropdown de ordenamiento:**
- Más recientes (created_at DESC)
- Mayor valor comprado (total_spent DESC)
- Mayor saldo pendiente (balance_due DESC)
- Última compra (last_purchase_at DESC)

**Paginación:**
- 25 clientes por página
- Infinite scroll o botones prev/next

---

### 3.3 Vista `/admin/clientes/[id]` (Detalle)

#### Sección 1: Perfil

**Cliente Registrado:**
```
Nombre: Jhonatan Venegas
Email: jhonatanvenegas@usdtcapital.es
Teléfono: +34 722 385 452
Tipo: Cliente Registrado
Fecha de registro: 30 Abr 2026
Welcome email: Enviado (11 May 2026)
```

**Cliente Guest:**
```
Email: cliente@example.com
Teléfono: +52 555 1234567
Tipo: Cliente Guest (sin cuenta)
Primera compra: 15 Mar 2026
[Botón: Invitar a registrarse]
```

#### Sección 2: Direcciones (solo registrados)

**Lista de direcciones:**
```
📍 Dirección principal (default)
Jhonatan Venegas
Calle Molina 60, 1A
Madrid, 28029, España
Teléfono: +34 722 385 452

📍 Dirección 2
[...]
```

**Si no tiene direcciones:**
```
Sin direcciones guardadas
```

#### Sección 3: Resumen comercial

**Cards de métricas:**
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Total comprado      │ # Pedidos           │ # Apartados         │
│ $189,000 MXN        │ 5                   │ 2                   │
└─────────────────────┴─────────────────────┴─────────────────────┘

┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Saldo pendiente     │ Pagos en revisión   │ Última compra       │
│ $50,000 MXN         │ 1                   │ 10 May 2026         │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

#### Sección 4: Pedidos

**Tabla de pedidos:**
```
ID                 | Producto        | Total       | Estado    | Pago    | Envío     | Fecha      | Acciones
----------------------------------------------------------------------------------------------------------------
57faad17...        | Bolsa Gucci     | $20 MXN     | Confirmed | Paid    | Shipped   | 11 May 26  | [Ver] [Tracking]
6fe3219f...        | Reloj Rolex     | $200k MXN   | Confirmed | Paid    | Delivered | 29 Apr 26  | [Ver] [Tracking]
```

**Acciones:**
- **Ver:** → `/admin/orders/[id]`
- **Tracking:** → `/track/[tracking_token]` (nueva pestaña)
- **Comprobante:** Si existe → download endpoint

#### Sección 5: Apartados (si existen)

**Tabla de apartados:**
```
ID                 | Producto        | Total       | Pagado    | Pendiente | Estado    | Próximo pago | Acciones
-----------------------------------------------------------------------------------------------------------------------
aaaaaaaa...        | Bolsa Chanel    | $189k MXN   | $189k     | $0        | Completed | -            | [Ver]
bbbbbbbb...        | Zapatos Prada   | $95k MXN    | $45k      | $50k      | Active    | 20 May 26    | [Ver] [Pagos]
```

**Acciones:**
- **Ver:** → `/admin` (pendiente implementar admin layaways)
- **Pagos:** → ver detalle de pagos del apartado

#### Sección 6: Pagos pendientes de revisión

**Si tiene payment_transactions con status `proof_uploaded`:**

```
⚠️ Pagos pendientes de revisión (1)

┌────────────────────────────────────────────────────────────┐
│ Pago #5de07e69                                              │
│ Tipo: Compra completa                                       │
│ Monto: $20 MXN                                              │
│ Método: Transferencia bancaria                              │
│ Comprobante subido: 8 May 2026                              │
│ [Ver comprobante] [Aprobar] [Rechazar]                      │
└────────────────────────────────────────────────────────────┘
```

**Si no tiene:**
```
✅ Sin pagos pendientes de revisión
```

---

## 4. QUERIES NECESARIAS

### 4.1 Query para Dashboard Metrics

```sql
-- Total clientes (DISTINCT emails de orders + layaways + customer_profiles)
WITH all_emails AS (
  SELECT DISTINCT customer_email AS email FROM orders
  UNION
  SELECT DISTINCT customer_email AS email FROM layaways
  UNION
  SELECT DISTINCT email FROM customer_profiles
)
SELECT COUNT(*) AS total_customers FROM all_emails;

-- Clientes con compras confirmadas
SELECT COUNT(DISTINCT customer_email) 
FROM orders 
WHERE status = 'confirmed';

-- Pagos pendientes
SELECT COUNT(*) 
FROM payment_transactions 
WHERE status = 'pending';

-- Pagos en revisión
SELECT COUNT(*) 
FROM payment_transactions 
WHERE status = 'proof_uploaded';

-- Órdenes pendientes de dirección
SELECT COUNT(*) 
FROM orders 
WHERE shipping_status IN ('pending', 'preparing') 
  AND (shipping_address IS NULL OR shipping_address = '');

-- Apartados activos
SELECT COUNT(*) 
FROM layaways 
WHERE status = 'active';

-- Valor total vendido
SELECT COALESCE(SUM(total), 0) 
FROM orders 
WHERE status = 'confirmed';

-- Saldo pendiente total
SELECT COALESCE(SUM(amount_remaining), 0) 
FROM layaways 
WHERE status IN ('active', 'pending');
```

### 4.2 Query para Lista de Clientes

```sql
-- Vista unificada de clientes (registrados + guests)
WITH customer_stats AS (
  -- Estadísticas de orders
  SELECT 
    COALESCE(o.user_id::text, o.customer_email) AS client_id,
    o.user_id,
    o.customer_email,
    MAX(o.customer_name) AS customer_name,
    MAX(o.customer_phone) AS customer_phone,
    COUNT(*) AS total_orders,
    COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN o.total ELSE 0 END), 0) AS total_spent,
    MAX(o.created_at) AS last_purchase_at,
    COUNT(CASE WHEN o.status IN ('pending', 'confirmed') AND o.payment_status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.shipping_status IN ('pending', 'preparing') AND (o.shipping_address IS NULL OR o.shipping_address = '') THEN 1 END) AS pending_address_count
  FROM orders o
  GROUP BY COALESCE(o.user_id::text, o.customer_email), o.user_id, o.customer_email
),
layaway_stats AS (
  -- Estadísticas de layaways
  SELECT 
    COALESCE(l.user_id::text, l.customer_email) AS client_id,
    COUNT(*) AS total_layaways,
    COUNT(CASE WHEN l.status = 'active' THEN 1 END) AS active_layaways,
    COALESCE(SUM(CASE WHEN l.status IN ('active', 'pending') THEN l.amount_remaining ELSE 0 END), 0) AS balance_due
  FROM layaways l
  GROUP BY COALESCE(l.user_id::text, l.customer_email)
),
payment_review_stats AS (
  -- Pagos en revisión (join con orders/layaways para obtener client_id)
  SELECT 
    COALESCE(o.user_id::text, o.customer_email) AS client_id,
    COUNT(*) AS payments_under_review
  FROM payment_transactions pt
  LEFT JOIN orders o ON pt.order_id = o.id
  LEFT JOIN layaways l ON pt.layaway_id = l.id
  WHERE pt.status = 'proof_uploaded'
  GROUP BY COALESCE(o.user_id::text, o.customer_email, l.user_id::text, l.customer_email)
)
SELECT 
  cs.client_id,
  cs.user_id,
  cs.customer_email AS email,
  cs.customer_name AS name,
  cs.customer_phone AS phone,
  CASE 
    WHEN cs.user_id IS NOT NULL THEN 'registered'
    ELSE 'guest'
  END AS type,
  cs.total_orders,
  cs.total_spent,
  cs.pending_orders,
  cs.pending_address_count,
  COALESCE(ls.total_layaways, 0) AS total_layaways,
  COALESCE(ls.active_layaways, 0) AS active_layaways,
  COALESCE(ls.balance_due, 0) AS balance_due,
  COALESCE(prs.payments_under_review, 0) AS payments_under_review,
  cs.last_purchase_at,
  CASE 
    WHEN cs.total_orders > 1 THEN 'recurring'
    WHEN cs.last_purchase_at > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN cs.last_purchase_at > NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'new'
  END AS customer_status,
  cp.created_at AS registered_at
FROM customer_stats cs
LEFT JOIN layaway_stats ls ON cs.client_id = ls.client_id
LEFT JOIN payment_review_stats prs ON cs.client_id = prs.client_id
LEFT JOIN customer_profiles cp ON cs.user_id = cp.user_id
ORDER BY cs.last_purchase_at DESC NULLS LAST;
```

**Filtros aplicables:**
```sql
-- Búsqueda
WHERE (
  cs.customer_name ILIKE '%' || :search || '%' OR
  cs.customer_email ILIKE '%' || :search || '%' OR
  cs.customer_phone ILIKE '%' || :search || '%'
)

-- Con pagos pendientes
WHERE cs.pending_orders > 0 OR ls.active_layaways > 0

-- Pago en revisión
WHERE prs.payments_under_review > 0

-- Compras confirmadas
WHERE cs.total_orders > 0

-- Pendientes de dirección
WHERE cs.pending_address_count > 0

-- Recurrentes
WHERE cs.total_orders > 1
```

**Ordenamiento:**
```sql
-- Más recientes
ORDER BY cs.last_purchase_at DESC NULLS LAST

-- Mayor valor comprado
ORDER BY cs.total_spent DESC

-- Mayor saldo pendiente
ORDER BY ls.balance_due DESC

-- Última compra
ORDER BY cs.last_purchase_at DESC NULLS LAST
```

### 4.3 Query para Detalle de Cliente

```sql
-- Perfil base
SELECT 
  cp.user_id,
  cp.email,
  cp.name,
  cp.phone,
  cp.phone_country_code,
  cp.phone_country_iso,
  cp.created_at AS registered_at,
  cp.welcome_email_sent_at
FROM customer_profiles cp
WHERE cp.user_id = :user_id;  -- Si es registrado

-- Si es guest, obtener de orders
SELECT 
  customer_email,
  customer_name,
  customer_phone,
  MIN(created_at) AS first_purchase_at
FROM orders
WHERE customer_email = :email AND user_id IS NULL
GROUP BY customer_email, customer_name, customer_phone;

-- Direcciones (solo registrados)
SELECT *
FROM customer_addresses
WHERE user_id = :user_id
ORDER BY is_default DESC, created_at DESC;

-- Pedidos
SELECT 
  o.id,
  o.customer_name,
  o.customer_email,
  o.total,
  o.status,
  o.payment_status,
  o.shipping_status,
  o.created_at,
  o.tracking_token,
  o.tracking_number,
  o.shipping_proof_url,
  (
    SELECT json_agg(json_build_object(
      'product_id', oi.product_id,
      'quantity', oi.quantity,
      'price', oi.price
    ))
    FROM order_items oi
    WHERE oi.order_id = o.id
  ) AS items
FROM orders o
WHERE o.user_id = :user_id OR o.customer_email = :email
ORDER BY o.created_at DESC;

-- Apartados
SELECT 
  l.id,
  l.product_id,
  l.total_amount,
  l.amount_paid,
  l.amount_remaining,
  l.status,
  l.next_payment_due_date,
  l.next_payment_amount,
  l.created_at,
  l.layaway_token
FROM layaways l
WHERE l.user_id = :user_id OR l.customer_email = :email
ORDER BY l.created_at DESC;

-- Pagos en revisión
SELECT 
  pt.id,
  pt.payment_type,
  pt.payment_method,
  pt.amount,
  pt.currency,
  pt.status,
  pt.proof_url,
  pt.proof_uploaded_at,
  pt.created_at,
  o.id AS order_id,
  l.id AS layaway_id
FROM payment_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
LEFT JOIN layaways l ON pt.layaway_id = l.id
WHERE 
  pt.status = 'proof_uploaded' AND
  (
    (o.user_id = :user_id OR o.customer_email = :email) OR
    (l.user_id = :user_id OR l.customer_email = :email)
  )
ORDER BY pt.proof_uploaded_at DESC;
```

---

## 5. COMPONENTES PROPUESTOS

### 5.1 Rutas y páginas

```
src/app/admin/clientes/
├── page.tsx                          // Lista de clientes
├── [id]/
│   └── page.tsx                      // Detalle de cliente
└── components/
    ├── ClientesTable.tsx             // Tabla de clientes
    ├── ClientesDashboard.tsx         // Cards de métricas
    ├── ClientesFilters.tsx           // Filtros y búsqueda
    ├── ClienteProfile.tsx            // Perfil del cliente
    ├── ClienteAddresses.tsx          // Lista de direcciones
    ├── ClienteStats.tsx              // Resumen comercial
    ├── ClienteOrders.tsx             // Lista de pedidos
    ├── ClienteLayaways.tsx           // Lista de apartados
    └── ClientePaymentReviews.tsx     // Pagos pendientes
```

### 5.2 API Routes

```
src/app/api/admin/clientes/
├── route.ts                          // GET lista de clientes
├── metrics/
│   └── route.ts                      // GET dashboard metrics
└── [id]/
    ├── route.ts                      // GET detalle de cliente
    ├── orders/
    │   └── route.ts                  // GET pedidos del cliente
    ├── layaways/
    │   └── route.ts                  // GET apartados del cliente
    └── payment-reviews/
        └── route.ts                  // GET pagos en revisión del cliente
```

### 5.3 Lib helpers

```
src/lib/admin/
└── clientes.ts                       // Helpers para queries de clientes
```

---

## 6. RIESGOS IDENTIFICADOS

### 6.1 Performance

**Riesgo:** Query de lista de clientes puede ser lento con muchos registros

**Mitigación:**
- Índices en orders(customer_email), layaways(customer_email)
- Índices en orders(user_id), layaways(user_id)
- Paginación obligatoria (25 clientes por página)
- Caché de métricas dashboard (refrescar cada 5 min)

### 6.2 Clientes duplicados

**Riesgo:** Mismo cliente con emails diferentes (typos, múltiples emails)

**Mitigación:**
- V1: No intentar deduplicar automáticamente
- V2: Herramienta admin de merge de clientes
- Documentar que cada email es único

### 6.3 Cliente híbrido (guest → registrado)

**Riesgo:** Pedidos guest no se vinculan automáticamente a cuenta nueva

**Mitigación:**
- V1: Mostrar ambos en lista (email coincidente)
- V2: Migración manual de pedidos guest a cuenta
- V3: Migración automática al registrarse

### 6.4 Emails case-sensitive

**Riesgo:** `Cliente@Example.com` vs `cliente@example.com` = 2 registros

**Mitigación:**
- Normalizar emails a lowercase en queries
- Agregar índice case-insensitive si es necesario

---

## 7. MVP.1 vs MVP.2

### MVP.1 (Inicial - Fase 1)

**Objetivo:** Vista básica funcional de clientes

**Incluye:**
- ✅ Lista de clientes con métricas
- ✅ Filtros básicos (búsqueda, status)
- ✅ Ordenamiento
- ✅ Cards de dashboard
- ✅ Paginación
- ✅ Vista detalle básica (perfil + resumen)
- ✅ Lista de pedidos del cliente
- ✅ Lista de apartados del cliente
- ✅ Pagos en revisión del cliente

**NO incluye:**
- ❌ Editar perfil desde admin
- ❌ Agregar notas del cliente
- ❌ Historial de actividad completo
- ❌ Merge de clientes duplicados
- ❌ Invitar a registrarse (guest → registrado)
- ❌ Migración de pedidos guest

**Estimación:** 2-3 días
- Día 1: Backend (queries + API routes)
- Día 2: Frontend (lista + dashboard)
- Día 3: Frontend (detalle) + QA

### MVP.2 (Expansión - Fase 2)

**Objetivo:** Gestión avanzada de clientes

**Incluye:**
- ✅ Editar perfil desde admin
- ✅ Notas internas del cliente
- ✅ Tags/etiquetas (VIP, problema, etc.)
- ✅ Historial de actividad completa
- ✅ Botón "Invitar a registrarse" (guest)
- ✅ Merge de clientes duplicados
- ✅ Exportar clientes (CSV/Excel)
- ✅ Filtros avanzados (fecha registro, valor comprado)

**Estimación:** 3-4 días adicionales

---

## 8. TESTING PLAN

### 8.1 Tests de queries

**Objetivo:** Validar que queries devuelven datos correctos

1. Cliente registrado con pedidos → debe aparecer en lista
2. Cliente guest con pedidos → debe aparecer en lista
3. Cliente sin pedidos → no debe aparecer (o aparecer con $0)
4. Cliente con apartado activo → debe mostrar saldo pendiente
5. Cliente con pago en revisión → debe mostrar badge rojo
6. Métricas dashboard → deben coincidir con SUM manual

### 8.2 Tests de UI

**Objetivo:** Validar funcionalidad frontend

1. Búsqueda por email → filtra correctamente
2. Filtro "Pago en revisión" → solo muestra clientes con proof_uploaded
3. Ordenar por "Mayor valor comprado" → orden DESC correcto
4. Paginación → cambia de página sin errores
5. Click "Ver cliente" → navega a detalle correcto
6. Detalle: sección pedidos → muestra todos los pedidos del cliente
7. Detalle: sección apartados → muestra apartados activos
8. Detalle: pagos en revisión → muestra botón "Ver comprobante"

### 8.3 Tests de edge cases

1. Cliente con email NULL → no debe romper query
2. Cliente con 100+ pedidos → detalle debe paginar
3. Cliente con nombre con caracteres especiales (ñ, á) → búsqueda funciona
4. Teléfono con formato incorrecto → se muestra igual
5. Guest y registrado con mismo email → deben aparecer separados en lista

---

## 9. NO TOCAR (Confirmado)

- ❌ DB schema (no agregar columnas nuevas)
- ❌ Tablas de pagos (payment_transactions, orders.payment_*)
- ❌ Stripe integration
- ❌ Bank transfer flow
- ❌ Email templates
- ❌ Checkout flow
- ❌ Catálogo
- ❌ Inventario
- ❌ RLS policies

**Razón:** Admin Clientes es vista de solo lectura. No modifica transacciones ni pagos.

---

## 10. ENTREGABLES

### 10.1 Documentación
- ✅ Este documento (ADMIN_CLIENTES_MVP_SCOPE.md)
- ⏳ API documentation (después de implementación)

### 10.2 Código (cuando se apruebe)
- Backend: API routes + queries
- Frontend: Páginas + componentes
- Types: TypeScript interfaces
- Tests: Unit + integration

### 10.3 QA
- Test plan ejecutado
- Screenshots de UI
- Reporte de bugs (si los hay)

---

## 11. PRÓXIMOS PASOS

1. **Revisión de este scope** (Jhonatan)
2. **Aprobación o ajustes**
3. **Estimación final** (horas/días)
4. **Implementación** (MVP.1)
5. **QA manual**
6. **Deploy a producción**
7. **Feedback** → MVP.2

---

## 12. PREGUNTAS PENDIENTES

1. **¿Cliente sin pedidos debe aparecer en lista?**
   - Propuesta: NO (solo clientes con actividad comercial)
   - Alternativa: SÍ (mostrar con $0, útil para invitaciones)

2. **¿Merge de clientes duplicados en MVP.1 o MVP.2?**
   - Propuesta: MVP.2 (no es crítico para lanzar)

3. **¿Editar perfil desde admin en MVP.1?**
   - Propuesta: NO (solo lectura en MVP.1)
   - Caso de uso: Si cliente reporta email incorrecto
   - Alternativa: Cliente lo edita desde /account, admin solo ve

4. **¿Apartados cancelados deben mostrarse en detalle?**
   - Propuesta: SÍ (historial completo)
   - Badge "Cancelado" con fecha

5. **¿Clientes inactivos (>90 días sin compra) deben filtrarse?**
   - Propuesta: SÍ (filtro "Inactivos" disponible)
   - Útil para campañas de reactivación

---

**Status:** ⏳ ESPERANDO APROBACIÓN  
**Autor:** Kepler  
**Fecha:** 2026-05-12  
**Versión:** 1.0
