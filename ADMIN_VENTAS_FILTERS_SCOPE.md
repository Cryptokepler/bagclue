# ADMIN VENTAS FILTERS + A PAGOS - SCOPE DOCUMENT

**Fecha:** 2026-05-12  
**Proyecto:** Bagclue Admin - Filtros Comerciales  
**Ruta:** `/admin/orders` (Ventas)  
**Status:** PENDING APPROVAL - NO IMPLEMENTAR HASTA APROBACIÓN

---

## 1. CONTEXTO Y OBJETIVO

### Situación Actual
- `/admin/orders` muestra lista simple de ventas recientes
- Sin filtros por fecha, tipo o estado
- No distingue entre ventas contado y apartados
- No permite análisis comercial efectivo

### Objetivo
Mejorar Admin Ventas para permitir:
1. Filtrar ventas por fecha (día, semana, mes, rango)
2. Separar ventas contado vs apartados
3. Mostrar detalle de apartados (pagado, pendiente, próximo pago)
4. Ordenar por múltiples criterios
5. Buscar por cliente/email/producto
6. Visualizar métricas clave en cards

### Usuarios
- **Jhonatan:** Análisis de ventas, seguimiento de cobranza
- **Pilar:** Operación diaria, preparación de pedidos

---

## 2. AUDITORÍA DE TABLAS

### 2.1 Tabla `orders`

**Campos disponibles:**
```sql
id                   UUID PRIMARY KEY
customer_name        TEXT
customer_email       TEXT
customer_phone       TEXT
user_id              UUID (nullable, referencia a auth.users)
total                NUMERIC (total de la orden)
subtotal             NUMERIC (antes de descuentos/shipping)
currency             TEXT (default 'MXN')
payment_method       TEXT (stripe|bank_transfer)
payment_status       TEXT (pending|paid|failed)
status               TEXT (pending|confirmed|cancelled)
shipping_status      TEXT (pending|preparing|shipped|delivered)
shipping_address     TEXT
tracking_token       TEXT (público)
tracking_number      TEXT (carrier tracking)
shipping_provider    TEXT (dhl|fedex|manual)
shipping_proof_url   TEXT (evidencia de envío)
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

**Relaciones:**
- `order_items`: productos de la orden
- `payment_transactions`: pagos asociados

**Notas:**
- ✅ Ya tiene campos para filtrar por fecha, estado pago, estado envío
- ✅ Ya distingue método de pago
- ❌ NO tiene campo para distinguir "tipo de venta" (contado vs apartado)
- ❌ Para ventas contado, todo está aquí
- ❌ Para apartados, la info está en `layaways` (tabla separada)

---

### 2.2 Tabla `order_items`

**Campos disponibles:**
```sql
id                   UUID PRIMARY KEY
order_id             UUID (FK a orders)
product_id           UUID (FK a products)
product_snapshot     JSONB (snapshot completo del producto al momento de compra)
quantity             INTEGER
unit_price           NUMERIC
total_price          NUMERIC (unit_price * quantity)
created_at           TIMESTAMP
```

**Snapshot contiene:**
```json
{
  "title": "...",
  "brand": "...",
  "model": "...",
  "color": "...",
  "slug": "...",
  "currency": "..."
}
```

**Notas:**
- ✅ Permite buscar por producto (título, marca, modelo)
- ✅ Snapshot preserva datos aunque producto cambie

---

### 2.3 Tabla `layaways`

**Campos disponibles:**
```sql
id                        UUID PRIMARY KEY
customer_name             TEXT
customer_email            TEXT
customer_phone            TEXT
user_id                   UUID (nullable)
product_id                UUID (FK a products)
total_amount              NUMERIC (precio total del producto)
amount_paid               NUMERIC (acumulado pagado)
amount_remaining          NUMERIC (saldo pendiente)
payments_completed        INTEGER (número de pagos hechos)
payments_remaining        INTEGER (número de pagos faltantes)
payment_frequency         TEXT (weekly|biweekly|monthly)
next_payment_due_date     DATE (fecha del próximo pago)
next_payment_amount       NUMERIC (monto del próximo pago)
status                    TEXT (pending|active|completed|cancelled)
layaway_token             TEXT (público, para tracking)
created_at                TIMESTAMP
updated_at                TIMESTAMP
```

**Relaciones:**
- `products`: producto apartado
- `layaway_payments`: historial de pagos

**Notas:**
- ✅ Tiene toda la info de apartados
- ✅ Ya calcula amount_remaining, payments_remaining
- ✅ Ya tiene next_payment_due_date para ordenar
- ✅ Permite filtrar por estado
- ⚠️ Es una tabla **separada** de `orders` → necesita unificación en UI

---

### 2.4 Tabla `layaway_payments`

**Campos disponibles:**
```sql
id                   UUID PRIMARY KEY
layaway_id           UUID (FK a layaways)
amount               NUMERIC (monto del pago)
payment_method       TEXT (stripe|bank_transfer)
payment_status       TEXT (pending|paid|failed)
stripe_payment_id    TEXT (si fue Stripe)
paid_at              TIMESTAMP
created_at           TIMESTAMP
```

**Notas:**
- ✅ Historial de pagos del apartado
- ✅ Permite contar pagos realizados
- ✅ Permite sumar monto pagado

---

### 2.5 Tabla `payment_transactions`

**Campos disponibles:**
```sql
id                     UUID PRIMARY KEY
order_id               UUID (nullable, FK a orders)
layaway_id             UUID (nullable, FK a layaways)
payment_type           TEXT (full|installment)
payment_method         TEXT (stripe|bank_transfer)
amount                 NUMERIC
currency               TEXT
status                 TEXT (pending|proof_uploaded|confirmed|rejected)
proof_url              TEXT
proof_uploaded_at      TIMESTAMP
created_at             TIMESTAMP
```

**Notas:**
- ✅ Unifica pagos de orders y layaways
- ✅ Permite filtrar por "en revisión" (`status=proof_uploaded`)
- ⚠️ Un layaway puede tener múltiples payment_transactions

---

## 3. DESAFÍO PRINCIPAL: UNIFICACIÓN CONTADO + APARTADOS

### Problema
- **Ventas contado:** Datos en `orders`
- **Ventas apartados:** Datos en `layaways`
- **Tablas separadas** → difícil unificar en una sola vista

### Opciones de Implementación

#### Opción A: Dos Queries Separadas + Merge en Backend
```typescript
// Query 1: Orders (contado)
const orders = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

// Query 2: Layaways (apartados)
const layaways = await supabase
  .from('layaways')
  .select('*, products(*)')
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

// Merge en backend
const allSales = [
  ...orders.map(transformOrder),
  ...layaways.map(transformLayaway)
].sort(...)
```

**Pros:**
- Simple de implementar
- No requiere cambios en DB
- Fácil mantener

**Contras:**
- Dos queries → más lento
- Merge/sort en backend → más memoria
- Paginación compleja

---

#### Opción B: View en DB (Recomendado)
```sql
CREATE VIEW admin_ventas AS
SELECT 
  'order' as sale_type,
  o.id,
  o.customer_name,
  o.customer_email,
  o.total as total_amount,
  o.total as amount_paid,
  0 as amount_remaining,
  o.payment_status,
  o.shipping_status,
  o.payment_method,
  o.created_at,
  NULL as next_payment_due_date,
  NULL as payments_completed,
  NULL as payments_remaining,
  o.status as order_status,
  NULL as layaway_status
FROM orders o
WHERE o.status != 'cancelled'

UNION ALL

SELECT
  'layaway' as sale_type,
  l.id,
  l.customer_name,
  l.customer_email,
  l.total_amount,
  l.amount_paid,
  l.amount_remaining,
  CASE 
    WHEN l.status = 'completed' THEN 'paid'
    WHEN l.status = 'active' THEN 'pending'
    ELSE 'pending'
  END as payment_status,
  NULL as shipping_status,
  'layaway' as payment_method,
  l.created_at,
  l.next_payment_due_date,
  l.payments_completed,
  l.payments_remaining,
  NULL as order_status,
  l.status as layaway_status
FROM layaways l
```

**Pros:**
- ✅ Una sola query
- ✅ DB maneja sort/filter
- ✅ Paginación simple
- ✅ Performance mejor

**Contras:**
- ⚠️ Requiere migración DB
- ⚠️ Cambio de estructura

---

#### Opción C: Tabs Separados (MVP.1 - Más Simple)
- **Tab "Contado":** Solo query a `orders`
- **Tab "A pagos":** Solo query a `layaways`
- **Tab "Todas":** Ambas queries + merge simple (sin sort cross-type)

**Pros:**
- ✅ Más fácil de implementar
- ✅ No requiere DB changes
- ✅ Cada tab tiene sus filtros específicos
- ✅ UI más clara para usuario

**Contras:**
- ⚠️ "Todas" no puede ordenar correctamente cross-type
- ⚠️ Métricas requieren ambas queries

---

### Recomendación Inicial: **Opción C para MVP.1**, migrar a **Opción B en MVP.2**

---

## 4. PROPUESTA DE UI

### 4.1 Tabs

```
[ Todas ]  [ Contado ]  [ A pagos ]
```

**Comportamiento:**
- **Todas:** Muestra ambas, sin ordenamiento cross-type
- **Contado:** Solo orders, permite todos los filtros de orders
- **A pagos:** Solo layaways, permite filtros específicos de apartados

---

### 4.2 Filtros (Barra Superior)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 [Buscar cliente, email o producto...]                           │
├─────────────────────────────────────────────────────────────────────┤
│ Fecha:        [▼ Esta semana]                                       │
│ Estado pago:  [▼ Todos]                                             │
│ Envío:        [▼ Todos]                                             │
│ Método:       [▼ Todos]                                             │
│ Ordenar:      [▼ Más recientes]                                     │
│                                                     [Limpiar filtros]│
└─────────────────────────────────────────────────────────────────────┘
```

**Opciones de Fecha:**
- Hoy
- Ayer
- Esta semana
- Este mes
- Rango personalizado (abre modal con date pickers)

**Opciones de Estado Pago:**
- Todos
- Pendiente
- En revisión
- Pagada
- Rechazada/Cancelada

**Opciones de Envío:**
- Todos
- Pendiente
- Preparando
- Enviada
- Entregada

**Opciones de Método:**
- Todos
- Stripe
- Transferencia
- Apartado

**Opciones de Ordenar:**
- Más recientes
- Más antiguas
- Mayor monto
- Menor monto
- **[Solo tab A pagos]:**
  - Menor saldo pendiente
  - Mayor saldo pendiente
  - Próximo pago más cercano

---

### 4.3 Cards (Métricas)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Contado     │ A pagos     │ Ingresos    │
│ ventas      │             │             │ confirmados │
│ 47          │ 32          │ 15          │ $247,500    │
└─────────────┴─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Ventas      │ Ventas      │ Saldo       │ Pagos       │
│ pagadas     │ pendientes  │ pendiente   │ próximos    │
│ 38          │ 9           │ $87,200     │ 12          │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Métricas:**
1. **Total ventas:** count(orders) + count(layaways)
2. **Contado:** count(orders WHERE status != cancelled)
3. **A pagos:** count(layaways WHERE status = active)
4. **Ingresos confirmados:** sum(orders.total WHERE payment_status = paid) + sum(layaways.amount_paid)
5. **Ventas pagadas:** count completas
6. **Ventas pendientes:** count pendientes pago
7. **Saldo pendiente:** sum(layaways.amount_remaining WHERE status = active)
8. **Pagos próximos:** count(layaways WHERE next_payment_due_date <= today + 7 days)

---

### 4.4 Tabla Contado

**Columnas:**
- Fecha (dd/mm/yyyy hh:mm)
- Cliente (nombre)
- Email
- Producto (brand + title)
- Total (formatted currency)
- Método (badge)
- Pago (badge con color)
- Envío (badge con color)
- Acción (Ver detalle →)

**Paginación:** 25 por página

---

### 4.5 Tabla A Pagos

**Columnas:**
- Cliente (nombre)
- Email
- Producto (brand + title)
- Total (formatted)
- Pagado (formatted + %)
- Pendiente (formatted + %)
- Pagos (X/Y realizados)
- Próximo pago (fecha + monto)
- Estado (badge)
- Acción (Ver detalle →)

**Paginación:** 25 por página

**Indicadores visuales:**
- Próximo pago VENCIDO: texto rojo
- Próximo pago HOY: texto naranja
- Próximo pago esta semana: texto amarillo
- Saldo bajo (<20%): badge verde

---

## 5. QUERIES NECESARIAS

### 5.1 Query Base Contado (Tab Contado)

```typescript
let query = supabaseAdmin
  .from('orders')
  .select(`
    id,
    customer_name,
    customer_email,
    total,
    currency,
    payment_method,
    payment_status,
    shipping_status,
    created_at,
    order_items (
      product_snapshot
    )
  `)
  .neq('status', 'cancelled')

// Filtro de fecha
if (date === 'today') {
  const today = new Date()
  today.setHours(0,0,0,0)
  query = query.gte('created_at', today.toISOString())
}
// ... otros filtros de fecha

// Filtro de pago
if (paymentStatus !== 'all') {
  query = query.eq('payment_status', paymentStatus)
}

// Filtro de envío
if (shippingStatus !== 'all') {
  query = query.eq('shipping_status', shippingStatus)
}

// Filtro de método
if (method !== 'all' && method !== 'layaway') {
  query = query.eq('payment_method', method)
}

// Búsqueda
if (search) {
  query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`)
}

// Ordenar
if (sort === 'recent') {
  query = query.order('created_at', { ascending: false })
} else if (sort === 'oldest') {
  query = query.order('created_at', { ascending: true })
} else if (sort === 'amount_desc') {
  query = query.order('total', { ascending: false })
} else if (sort === 'amount_asc') {
  query = query.order('total', { ascending: true })
}

// Paginación
query = query.range((page - 1) * 25, page * 25 - 1)

const { data, error } = await query
```

---

### 5.2 Query Base A Pagos (Tab A Pagos)

```typescript
let query = supabaseAdmin
  .from('layaways')
  .select(`
    id,
    customer_name,
    customer_email,
    total_amount,
    amount_paid,
    amount_remaining,
    payments_completed,
    payments_remaining,
    next_payment_due_date,
    next_payment_amount,
    status,
    created_at,
    products (
      title,
      brand
    )
  `)
  .in('status', ['pending', 'active', 'completed'])

// Filtro de fecha
// ... (igual que contado)

// Filtro de estado (interpretado como estado del apartado)
if (paymentStatus === 'paid') {
  query = query.eq('status', 'completed')
} else if (paymentStatus === 'pending') {
  query = query.in('status', ['pending', 'active'])
}

// Búsqueda
// ... (igual que contado)

// Ordenar
if (sort === 'recent') {
  query = query.order('created_at', { ascending: false })
} else if (sort === 'balance_asc') {
  query = query.order('amount_remaining', { ascending: true })
} else if (sort === 'balance_desc') {
  query = query.order('amount_remaining', { ascending: false })
} else if (sort === 'next_due') {
  query = query.order('next_payment_due_date', { ascending: true })
}

// Paginación
query = query.range((page - 1) * 25, page * 25 - 1)

const { data, error } = await query
```

---

### 5.3 Query Métricas

**Recomendación:** Crear función server compartida `getVentasMetrics(filters)`.

```typescript
// Contado
const { count: totalContado } = await supabaseAdmin
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .neq('status', 'cancelled')
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

const { data: contadoStats } = await supabaseAdmin
  .from('orders')
  .select('total, payment_status')
  .neq('status', 'cancelled')
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

// A pagos
const { count: totalLayaways } = await supabaseAdmin
  .from('layaways')
  .select('*', { count: 'exact', head: true })
  .in('status', ['pending', 'active', 'completed'])
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

const { data: layawaysStats } = await supabaseAdmin
  .from('layaways')
  .select('amount_paid, amount_remaining, next_payment_due_date, status')
  .in('status', ['pending', 'active', 'completed'])
  .gte('created_at', dateFrom)
  .lte('created_at', dateTo)

// Calcular
const metrics = {
  totalVentas: totalContado + totalLayaways,
  totalContado,
  totalAPagos: totalLayaways,
  ingresosConfirmados: sum(contado paid) + sum(layaways.amount_paid),
  ventasPagadas: count(paid),
  ventasPendientes: count(pending),
  saldoPendiente: sum(layaways.amount_remaining WHERE active),
  pagosProximos: count(layaways WHERE next_due <= today+7)
}
```

---

## 6. DIVISIÓN MVP.1 vs MVP.2

### MVP.1 (Primera Iteración - Recomendado)

**Alcance:**
- ✅ Tabs: Todas, Contado, A pagos
- ✅ Filtro de fecha: Hoy, Ayer, Esta semana, Este mes
- ✅ Filtro de pago: Todos, Pendiente, Pagada
- ✅ Filtro de envío: Todos, Pendiente, Enviada, Entregada
- ✅ Ordenar: Más recientes, Más antiguas, Mayor/Menor monto
- ✅ **Solo tab A pagos:** Ordenar por saldo, próximo pago
- ✅ Búsqueda simple: cliente/email (NO producto todavía)
- ✅ Cards con métricas básicas (4 cards principales)
- ✅ Tabla Contado con columnas esenciales
- ✅ Tabla A Pagos con columnas esenciales
- ✅ Paginación simple (25 por página)

**Estimación MVP.1:** 6-8 horas
- 2h: UI/componentes (tabs, filtros, cards)
- 2h: Backend queries (contado + apartados)
- 1h: Métricas
- 1h: Testing
- 1h: Fixes/ajustes
- 1h: Deploy + validación

**No incluido en MVP.1:**
- ❌ Filtro de rango personalizado de fecha
- ❌ Búsqueda por producto
- ❌ Filtro de método de pago
- ❌ Cards adicionales (8 cards totales)
- ❌ Exportar CSV
- ❌ Vista de calendario
- ❌ Gráficas/charts

---

### MVP.2 (Segunda Iteración - Futuro)

**Alcance:**
- ✅ Filtro de rango personalizado (date picker)
- ✅ Búsqueda por producto (título, marca, modelo)
- ✅ Filtro de método: Stripe, Transferencia, Apartado
- ✅ Cards completos (8 métricas)
- ✅ Exportar a CSV
- ✅ View unificada en DB (Opción B)
- ✅ Indicadores visuales avanzados (vencido, urgente)
- ✅ Notificaciones próximos pagos
- ✅ Mini-gráfica de tendencia en cards

**Estimación MVP.2:** 8-10 horas
- 2h: Date picker + búsqueda avanzada
- 2h: View en DB + migración
- 2h: Indicadores + exportar CSV
- 2h: Testing
- 2h: Fixes + deploy

---

## 7. RIESGOS IDENTIFICADOS

### Riesgo 1: Performance con Muchas Ventas
**Descripción:** Si hay >1000 ventas, queries pueden ser lentos.  
**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Paginación obligatoria
- Índices en DB: `created_at`, `payment_status`, `status`
- Limitar rango de fecha default a "Este mes"

---

### Riesgo 2: Unificación Contado + Apartados
**Descripción:** Merge de dos tipos de datos diferentes puede ser complejo.  
**Probabilidad:** Alta  
**Impacto:** Medio  
**Mitigación:**
- MVP.1: Tabs separados (evita el problema)
- MVP.2: View en DB (solución limpia)

---

### Riesgo 3: Confusión con "Estado de Pago" en Apartados
**Descripción:** En apartados, "estado" puede ser `active` pero "pago" estar pendiente.  
**Probabilidad:** Alta  
**Impacto:** Bajo  
**Mitigación:**
- Mapear correctamente `layaway.status` a "estado de pago"
- Documentar claramente en código
- UI clara: "Apartado activo" vs "Pago pendiente"

---

### Riesgo 4: Búsqueda por Producto
**Descripción:** Producto puede estar en `order_items.product_snapshot` (JSONB) o `layaways.products`.  
**Probabilidad:** Alta  
**Impacto:** Medio  
**Mitigación:**
- MVP.1: No implementar búsqueda por producto
- MVP.2: Usar `@>` operator de PostgreSQL para JSONB search
- Considerar índice GIN en `product_snapshot`

---

### Riesgo 5: Próximos Pagos Vencidos
**Descripción:** Si `next_payment_due_date` está en el pasado, puede confundir.  
**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- Indicador visual claro: VENCIDO en rojo
- Filtro "Pagos vencidos" (MVP.2)
- Notificación automática (futuro)

---

## 8. TESTING PLAN

### 8.1 Testing Manual (MVP.1)

**Test Case 1: Tabs Básicos**
1. Ir a /admin/orders
2. ✅ Ver tabs: Todas, Contado, A pagos
3. ✅ Click Contado → muestra solo orders
4. ✅ Click A pagos → muestra solo layaways
5. ✅ Click Todas → muestra ambos

**Test Case 2: Filtro de Fecha**
1. Tab Contado
2. Seleccionar "Hoy"
3. ✅ Muestra solo ventas de hoy
4. Seleccionar "Esta semana"
5. ✅ Muestra ventas de esta semana
6. Repetir en tab A pagos

**Test Case 3: Filtro de Estado Pago**
1. Tab Contado
2. Seleccionar "Pagada"
3. ✅ Muestra solo payment_status = paid
4. Seleccionar "Pendiente"
5. ✅ Muestra solo payment_status = pending

**Test Case 4: Ordenamiento**
1. Tab Contado
2. Seleccionar "Mayor monto"
3. ✅ Orders ordenadas por total DESC
4. Tab A pagos
5. Seleccionar "Menor saldo pendiente"
6. ✅ Layaways ordenadas por amount_remaining ASC

**Test Case 5: Búsqueda**
1. Buscar por nombre: "Juan"
2. ✅ Muestra solo clientes con "Juan" en nombre
3. Buscar por email: "@gmail.com"
4. ✅ Muestra solo clientes con Gmail

**Test Case 6: Métricas**
1. Verificar cards
2. ✅ Total ventas = count correcto
3. ✅ Saldo pendiente = sum correcto
4. ✅ Ingresos confirmados = sum correcto

**Test Case 7: Paginación**
1. Si hay >25 ventas
2. ✅ Muestra paginación
3. ✅ Siguiente página funciona
4. ✅ Anterior página funciona

**Test Case 8: Tabla A Pagos**
1. Tab A pagos
2. ✅ Columna "Pagado" muestra monto + %
3. ✅ Columna "Pendiente" muestra saldo + %
4. ✅ Columna "Pagos" muestra X/Y
5. ✅ "Próximo pago" muestra fecha + monto
6. ✅ Si vencido, texto rojo

---

### 8.2 Testing de Performance

**Escenario 1:** 100 ventas contado + 50 apartados
- ✅ Carga <2s
- ✅ Filtros responden <500ms
- ✅ Métricas calculan <1s

**Escenario 2:** 500 ventas contado + 200 apartados
- ✅ Carga <3s
- ✅ Paginación funciona
- ✅ Filtros no bloquean UI

---

### 8.3 Testing de Edge Cases

1. ✅ Sin ventas → mensaje "No hay ventas todavía"
2. ✅ Solo contado, sin apartados → tab A pagos vacío
3. ✅ Solo apartados, sin contado → tab Contado vacío
4. ✅ Filtro sin resultados → mensaje "Sin resultados para este filtro"
5. ✅ Fecha inválida → error graceful
6. ✅ Apartado sin próximo pago → mostrar "-"
7. ✅ Apartado completado → no aparece en "Pagos próximos"

---

## 9. ESTRUCTURA DE ARCHIVOS PROPUESTA

```
src/
├── app/
│   └── admin/
│       └── orders/
│           ├── page.tsx                    (actualizar con filtros)
│           └── components/                 (nuevo)
│               ├── VentasTabs.tsx         (tabs: Todas/Contado/A pagos)
│               ├── VentasFilters.tsx      (barra de filtros)
│               ├── VentasMetrics.tsx      (cards de métricas)
│               ├── VentasTableContado.tsx (tabla contado)
│               └── VentasTableAPagos.tsx  (tabla apartados)
├── lib/
│   └── admin/
│       └── ventas.ts                      (función server compartida)
└── types/
    └── admin-ventas.ts                    (tipos TypeScript)
```

---

## 10. TIPOS TYPESCRIPT PROPUESTOS

```typescript
// src/types/admin-ventas.ts

export type VentasTab = 'todas' | 'contado' | 'a-pagos'

export type VentasDateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export type VentasPaymentStatus = 'all' | 'pending' | 'review' | 'paid' | 'rejected'

export type VentasShippingStatus = 'all' | 'pending' | 'preparing' | 'shipped' | 'delivered'

export type VentasMethod = 'all' | 'stripe' | 'bank_transfer' | 'layaway'

export type VentasSort = 
  | 'recent' 
  | 'oldest' 
  | 'amount_desc' 
  | 'amount_asc'
  | 'balance_asc'    // Solo A pagos
  | 'balance_desc'   // Solo A pagos
  | 'next_due'       // Solo A pagos

export interface VentasFilters {
  tab: VentasTab
  date: VentasDateFilter
  dateFrom?: string  // YYYY-MM-DD
  dateTo?: string    // YYYY-MM-DD
  paymentStatus: VentasPaymentStatus
  shippingStatus: VentasShippingStatus
  method: VentasMethod
  search: string
  sort: VentasSort
  page: number
}

export interface VentasMetrics {
  totalVentas: number
  totalContado: number
  totalAPagos: number
  ingresosConfirmados: number
  ventasPagadas: number
  ventasPendientes: number
  saldoPendiente: number
  pagosProximos: number  // próximos 7 días
}

export interface VentaContado {
  id: string
  fecha: string
  cliente: string
  email: string
  producto: string
  total: number
  currency: string
  metodo: string
  estadoPago: string
  estadoEnvio: string
}

export interface VentaAPagos {
  id: string
  cliente: string
  email: string
  producto: string
  totalAmount: number
  amountPaid: number
  amountRemaining: number
  percentPaid: number
  percentRemaining: number
  paymentsCompleted: number
  paymentsRemaining: number
  nextPaymentDate: string | null
  nextPaymentAmount: number | null
  status: string
  isOverdue: boolean
  isDueSoon: boolean  // próximos 3 días
}
```

---

## 11. API PROPUESTA

### Endpoint: GET /api/admin/ventas

**Query params:**
```
?tab=contado
&date=week
&payment_status=paid
&shipping_status=all
&method=all
&search=juan
&sort=recent
&page=1
```

**Response:**
```json
{
  "metrics": {
    "totalVentas": 47,
    "totalContado": 32,
    "totalAPagos": 15,
    "ingresosConfirmados": 247500,
    "ventasPagadas": 38,
    "ventasPendientes": 9,
    "saldoPendiente": 87200,
    "pagosProximos": 12
  },
  "ventas": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 47,
    "totalPages": 2
  }
}
```

---

## 12. ESTIMACIÓN FINAL

### MVP.1 (Mínimo Viable)
**Tiempo:** 6-8 horas  
**Complejidad:** Media  
**Valor:** Alto

**Desglose:**
- 2h: UI (tabs, filtros básicos, cards)
- 2h: Backend queries (contado + apartados por separado)
- 1h: Métricas
- 1h: Testing manual
- 1-2h: Fixes + ajustes

---

### MVP.2 (Completo)
**Tiempo:** 8-10 horas adicionales  
**Complejidad:** Alta  
**Valor:** Medio-Alto

**Desglose:**
- 2h: Date picker + búsqueda avanzada
- 2h: View unificada en DB
- 2h: Indicadores visuales + exportar CSV
- 2h: Testing
- 2h: Fixes

---

## 13. RECOMENDACIÓN FINAL

### Implementar en 2 Fases

**FASE 1 (MVP.1):**
- Tabs separados (evita complejidad de merge)
- Filtros básicos (fecha, estado, búsqueda simple)
- Ordenamiento por criterios comunes + específicos de apartados
- Métricas esenciales
- **Entrega:** 1 día de trabajo

**FASE 2 (MVP.2):**
- View unificada en DB
- Búsqueda avanzada por producto
- Indicadores visuales sofisticados
- Exportar CSV
- **Entrega:** 1-2 días adicionales

---

## 14. PRÓXIMOS PASOS

**Pendiente aprobación:**
1. ✅ ¿Aprobar alcance MVP.1?
2. ✅ ¿Prioridad alta/media/baja?
3. ✅ ¿Proceder con implementación?
4. ✅ ¿Algún cambio en UI propuesta?
5. ✅ ¿Otras métricas/filtros críticos no considerados?

---

**Scope document generado:** 2026-05-12 12:30 UTC  
**Status:** PENDING APPROVAL  
**Autor:** Kepler  
**Próxima acción:** Esperar feedback de Jhonatan
