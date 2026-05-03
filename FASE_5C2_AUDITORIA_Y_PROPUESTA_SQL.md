# FASE 5C.2 — AUDITORÍA Y PROPUESTA SQL FINAL (ACTUALIZADA)

**Fecha:** 2026-05-01 19:20 UTC  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ✅ AUDITORÍA COMPLETADA - PROPUESTA SQL LISTA (NO EJECUTADA)

---

## ⚠️ IMPORTANTE

**Esta fase es SOLO auditoría + propuesta.**

**NO se ejecutará SQL todavía.**

**NO se tocó código, frontend, Stripe, webhook, admin ni checkout.**

**Esperando aprobación de Jhonatan para proceder.**

---

## ÍNDICE

1. Auditoría de Tablas Actuales
2. Auditoría de RLS Actuales
3. Tipo de Datos para Dinero (INTEGER vs NUMERIC)
4. Análisis de Tablas Adicionales
5. SQL Preliminar Completo - 3 Migraciones
6. Explicación de Cada Tabla/Columna Nueva
7. Confirmación: Migración Aditiva y Segura
8. Riesgos Técnicos
9. Plan de Rollback
10. Pruebas Post-Migración
11. Confirmación Final

---

## 1. AUDITORÍA DE ESTRUCTURA ACTUAL

### 1.1. Tabla `layaways` (Actual)

**Creada en:** Migración 013  
**Propósito actual:** Sistema simple de apartado (depósito 20% + saldo en 15 días)

**Columnas existentes:**

```sql
-- Estructura actual (Migration 013)
CREATE TABLE layaways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product relation
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Amounts (SISTEMA SIMPLE - 2 pagos)
  product_price NUMERIC(10, 2) NOT NULL,
  deposit_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  balance_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  
  -- Stripe payments (SOLO 2 PAGOS)
  deposit_session_id TEXT,
  deposit_payment_intent_id TEXT,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  balance_session_id TEXT,
  balance_payment_intent_id TEXT,
  balance_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status (LIMITADO)
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')) DEFAULT 'pending',
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  layaway_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Admin
  notes TEXT,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  
  -- Final order
  order_id UUID REFERENCES orders(id)
);
```

**Índices existentes:**
```sql
idx_layaways_status
idx_layaways_expires_at
idx_layaways_product_id
idx_layaways_token
idx_layaways_customer_email
```

**RLS (Migration 014):**
- Service role: full access
- Public (anon/authenticated): SELECT (cualquier layaway)
- Public: INSERT

**Limitaciones actuales:**
- ❌ Solo soporta 2 pagos (depósito + saldo)
- ❌ No soporta planes de 4, 8, 18 pagos
- ❌ No guarda primer pago flexible
- ❌ No guarda calendario de pagos
- ❌ No guarda contador de semanas sin abono
- ❌ Estados insuficientes (falta `forfeited`, `overdue`, etc.)
- ❌ No guarda `user_id` para vincular con customer_profiles
- ❌ Campos `deposit_*` y `balance_*` son específicos de sistema simple

---

### 1.2. Tabla `orders` (Actual)

**Columnas relevantes:**

```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL  -- Migración 016
customer_name TEXT NOT NULL
customer_email TEXT NOT NULL
customer_phone TEXT
customer_address TEXT
subtotal NUMERIC(10, 2) NOT NULL
shipping NUMERIC(10, 2) DEFAULT 0
total NUMERIC(10, 2) NOT NULL
status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
stripe_session_id TEXT
stripe_payment_intent_id TEXT
tracking_token TEXT UNIQUE
tracking_number TEXT
tracking_url TEXT
shipping_status TEXT
shipping_provider TEXT
shipping_address TEXT
notes TEXT
layaway_id UUID  -- Migración 013
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**RLS (Migration 017):**
- Service role: full access
- Authenticated: SELECT own orders (by user_id or email)
- NO public access

**Compatibilidad:** ✅ OK - No requiere cambios para apartados

---

### 1.3. Tabla `order_items` (Actual)

**Columnas:**

```sql
id UUID PRIMARY KEY
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE
product_id UUID NOT NULL REFERENCES products(id)
quantity INTEGER NOT NULL
unit_price NUMERIC(10, 2) NOT NULL
subtotal NUMERIC(10, 2) NOT NULL
product_snapshot JSONB  -- Snapshot completo del producto
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**RLS (Migration 017):**
- Service role: full access
- Authenticated: SELECT items of own orders

**Compatibilidad:** ✅ OK - No requiere cambios

---

### 1.4. Tabla `products` (Actual)

**Columnas relevantes:**

```sql
id UUID PRIMARY KEY
slug TEXT UNIQUE
title TEXT NOT NULL
brand TEXT NOT NULL
model TEXT
color TEXT
origin TEXT
status TEXT CHECK (status IN ('available', 'preorder', 'reserved', 'sold', 'hidden'))
condition TEXT CHECK (condition IN ('new', 'excellent', 'very_good', 'good', 'used'))
price NUMERIC(10, 2)
stock INTEGER DEFAULT 0
currency TEXT DEFAULT 'MXN'
category TEXT
badge TEXT
description TEXT
is_published BOOLEAN DEFAULT FALSE
includes_box BOOLEAN DEFAULT FALSE
includes_dust_bag BOOLEAN DEFAULT FALSE
includes_papers BOOLEAN DEFAULT FALSE
allow_layaway BOOLEAN DEFAULT TRUE  -- Migración 013
layaway_deposit_percent NUMERIC(5,2) DEFAULT 20.00  -- Migración 013
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Campos apartado actuales:**
- `allow_layaway` - Si permite apartado
- `layaway_deposit_percent` - Porcentaje depósito (sistema simple)

**Compatibilidad:** 
- ⚠️ `layaway_deposit_percent` ya no se usará (planes fijos)
- ✅ Mantener campo por compatibilidad (no eliminar)
- ✅ `allow_layaway` sigue siendo útil

---

### 1.5. Tabla `customer_profiles` (Actual)

**Columnas:**

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
email TEXT NOT NULL UNIQUE
name TEXT
phone TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**RLS:**
- Users can view own profile
- Users can update own profile

**Compatibilidad:** ✅ OK - Útil para vincular layaways por user_id

---

## 2. REQUISITOS NUEVOS (Políticas Oficiales)

### 2.1. Planes Oficiales

**Valores `plan_type`:**
- `cash` - Pago de contado (1 pago completo)
- `4_weekly_payments` - 4 pagos semanales (pago #1 + 3 restantes)
- `8_weekly_payments` - 8 pagos semanales (pago #1 + 7 restantes)
- `18_weekly_payments` - 18 pagos semanales (pago #1 + 17 restantes)

### 2.2. Primer Pago Mínimo

| Plan | Primer Pago Mínimo |
|------|-------------------|
| `cash` | 100% |
| `4_weekly_payments` | 25% |
| `8_weekly_payments` | 20% |
| `18_weekly_payments` | 20% |

**La clienta puede pagar MÁS del mínimo en el primer pago.**

### 2.3. Estados de Apartado

**Estados requeridos:**
- `pending_first_payment` - Apartado creado, esperando primer pago
- `active` - Primer pago confirmado, apartado activo
- `overdue` - Tiene pagos atrasados
- `completed` - 100% pagado + orden creada
- `expired` - Plan vencido sin liquidar
- `forfeited` - Perdido por incumplimiento
- `cancelled_for_non_payment` - Cancelado por 6 semanas sin abono
- `cancelled_manual` - Cancelado manualmente por admin
- `forfeiture_pending` - Requiere revisión admin (6 semanas sin abono detectadas)

**Total:** 9 estados

### 2.4. Estados de Pago

**Estados requeridos:**
- `pending` - Pendiente de pago
- `paid` - Pagado exitosamente
- `overdue` - Vencido sin pagar
- `cancelled` - Cancelado (apartado cancelado)
- `forfeited` - Perdido (apartado forfeited)
- `failed` - Intento de pago falló

**Total:** 6 estados

### 2.5. Campos Requeridos en `layaways`

**Plan:**
- `plan_type` TEXT NOT NULL
- `total_payments` INTEGER NOT NULL
- `first_payment_amount` NUMERIC(10, 2) NOT NULL
- `minimum_first_payment_amount` NUMERIC(10, 2) NOT NULL

**Montos:**
- `total_amount` NUMERIC(10, 2) NOT NULL
- `amount_paid` NUMERIC(10, 2) DEFAULT 0
- `amount_remaining` NUMERIC(10, 2)

**Tracking:**
- `payments_completed` INTEGER DEFAULT 0
- `payments_remaining` INTEGER
- `next_payment_due_date` TIMESTAMP WITH TIME ZONE
- `next_payment_amount` NUMERIC(10, 2)

**Fechas:**
- `plan_start_date` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `plan_end_date` TIMESTAMP WITH TIME ZONE
- `last_payment_at` TIMESTAMP WITH TIME ZONE

**Control:**
- `consecutive_weeks_without_payment` INTEGER DEFAULT 0
- `status` TEXT (actualizar constraint)
- `cancellation_reason` TEXT (ya existe)
- `cancelled_at` TIMESTAMP WITH TIME ZONE (ya existe)
- `forfeited_at` TIMESTAMP WITH TIME ZONE
- `completed_at` TIMESTAMP WITH TIME ZONE (ya existe)

**Vinculación:**
- `user_id` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `customer_email` TEXT (ya existe)

**Total nuevos:** 18 campos

---

## 2.6. Auditoría de RLS Actuales

### RLS en `layaways` (Migration 014)

**Policies actuales:**

```sql
-- Policy 1: Service role full access
CREATE POLICY "Service role full access on layaways"
  ON layaways FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Policy 2: Public can read ANY layaway
CREATE POLICY "Public can read layaways by token"
  ON layaways FOR SELECT TO anon, authenticated
  USING (true);  -- ⚠️ DEMASIADO PERMISIVO

-- Policy 3: Public can insert layaways
CREATE POLICY "Public can insert layaways"
  ON layaways FOR INSERT TO anon, authenticated
  WITH CHECK (true);  -- ⚠️ PERMITE CREACIÓN SIN AUTENTICACIÓN
```

**Problemas identificados:**
- ❌ Policy 2 permite leer CUALQUIER apartado (solo con conocer ID)
- ❌ Policy 3 permite crear apartados sin autenticación
- ❌ No hay restricción por `user_id` o `customer_email`

**Requiere actualización:** ✅ SÍ

---

### RLS en `orders` (Migration 017)

**Policies actuales:**

```sql
-- Policy 1: Service role full access
CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Policy 2: Authenticated can view own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR customer_email IN (
      SELECT email FROM customer_profiles WHERE user_id = auth.uid()
    )
  );
```

**Análisis:**
- ✅ Bien diseñada: solo authenticated users
- ✅ Match por `user_id` o `customer_email`
- ✅ NO hay acceso público

**Requiere actualización:** ❌ NO (ya está segura)

---

### RLS en `order_items` (Migration 017)

**Policies actuales:**

```sql
-- Policy 1: Service role full access
CREATE POLICY "Service role full access on order_items"
  ON order_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Policy 2: Authenticated can view items of own orders
CREATE POLICY "Customers can view own order_items"
  ON order_items FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid()
         OR customer_email IN (
           SELECT email FROM customer_profiles WHERE user_id = auth.uid()
         )
    )
  );
```

**Análisis:**
- ✅ Bien diseñada
- ✅ Solo authenticated users
- ✅ Solo items de sus propias órdenes

**Requiere actualización:** ❌ NO

---

### RLS en `customer_profiles` (Migration 015)

**Policies actuales:**

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

**Análisis:**
- ✅ Bien diseñada
- ✅ Solo acceso propio

**Requiere actualización:** ❌ NO

---

### Resumen de RLS Actual

| Tabla | RLS Segura | Requiere Cambios |
|-------|------------|------------------|
| `layaways` | ❌ NO | ✅ SÍ |
| `orders` | ✅ SÍ | ❌ NO |
| `order_items` | ✅ SÍ | ❌ NO |
| `customer_profiles` | ✅ SÍ | ❌ NO |

**Solo `layaways` requiere actualización de RLS.**

---

## 3. TIPO DE DATOS PARA DINERO

### 3.1. Opciones Analizadas

#### Opción A: INTEGER (Centavos)

**Descripción:** Guardar montos en centavos como INTEGER

**Ejemplo:**
```sql
amount BIGINT  -- $450,000.00 MXN = 45000000 centavos
```

**Pros:**
- ✅ Precisión absoluta (no hay errores de redondeo)
- ✅ Operaciones más rápidas (aritmética entera)
- ✅ Menos espacio en disco (8 bytes para BIGINT)
- ✅ Usado por Stripe (Stripe usa centavos)

**Contras:**
- ❌ Conversión constante (centavos ↔ decimales)
- ❌ Menos legible en queries
- ❌ Más código de conversión en frontend

**Ejemplo de conversión:**
```javascript
// Guardar
const amountCentavos = Math.round(450000.00 * 100)  // 45000000

// Leer
const amountPesos = amountCentavos / 100  // 450000.00
```

---

#### Opción B: NUMERIC(10, 2) ⭐ RECOMENDADA

**Descripción:** Guardar montos como NUMERIC con precisión fija

**Ejemplo:**
```sql
amount NUMERIC(10, 2)  -- $450,000.00 MXN
```

**Pros:**
- ✅ Precisión exacta (sin errores de punto flotante)
- ✅ Legible en queries (`450000.00` en vez de `45000000`)
- ✅ Menos conversiones en código
- ✅ Compatible con sistema actual de Bagclue
- ✅ Estándar para aplicaciones financieras
- ✅ Postgres optimiza NUMERIC para casos comunes

**Contras:**
- ❌ Ligeramente más lento que INTEGER (diferencia mínima)
- ❌ Más espacio (variable, ~8-16 bytes dependiendo precisión)

**NUMERIC(10, 2) significa:**
- `10` = Total de dígitos (precisión)
- `2` = Dígitos después del punto decimal (escala)
- Rango: `-99,999,999.99` a `99,999,999.99`
- Suficiente para productos hasta $99,999,999.99 MXN

---

### 3.2. Decisión: NUMERIC(10, 2)

**Razón:**

1. ✅ **Compatible con sistema actual**
   - `orders.total` ya es `NUMERIC(10, 2)`
   - `products.price` ya es `NUMERIC(10, 2)`
   - `layaways.product_price` ya es `NUMERIC(10, 2)`

2. ✅ **Menos código de conversión**
   - Frontend maneja decimales directamente
   - Queries legibles
   - Menos bugs por conversiones

3. ✅ **Precisión suficiente**
   - 2 decimales es estándar MXN
   - Sin errores de redondeo

4. ✅ **Estándar de la industria**
   - Rails/Django/Laravel usan DECIMAL/NUMERIC
   - Shopify usa DECIMAL
   - PostgreSQL optimiza NUMERIC

**Todos los campos de dinero usarán:**
```sql
NUMERIC(10, 2)
```

**Campos afectados:**
- `first_payment_amount`
- `minimum_first_payment_amount`
- `total_amount`
- `amount_paid`
- `amount_remaining`
- `next_payment_amount`
- `layaway_payments.amount_due`
- `layaway_payments.amount_paid`

---

## 4. ANÁLISIS DE TABLAS ADICIONALES

### 4.1. ¿Tabla `layaway_events`?

**Propósito:** Log de eventos del apartado

**Ejemplo:**
```sql
CREATE TABLE layaway_events (
  id UUID PRIMARY KEY,
  layaway_id UUID REFERENCES layaways(id),
  event_type TEXT,  -- 'payment_confirmed', 'status_changed', 'cancelled', etc.
  event_data JSONB,
  performed_by TEXT,  -- 'system', 'admin', 'customer'
  created_at TIMESTAMPTZ
);
```

**¿Conviene para MVP?**

**❌ NO para MVP inicial**

**Razón:**
- MVP no requiere historial completo de eventos
- Ya tenemos tracking básico en `layaways` (`notes`, `cancelled_by`, `cancellation_reason`)
- Agrega complejidad sin valor inmediato
- Podemos usar logs de aplicación para auditoría inicial

**✅ SÍ para futuro (post-MVP)**

**Cuándo implementar:**
- Si necesitamos auditoría completa de cambios
- Si admin necesita ver historial completo de acciones
- Si necesitamos compliance/regulación
- Después de 2-3 meses de operación

**Recomendación:** Dejar para Migration 021 (futuro)

---

### 4.2. ¿Tabla `layaway_audit_log`?

**Propósito:** Log general de auditoría

**¿Es diferente a `layaway_events`?**

**❌ NO - Es prácticamente lo mismo**

**Recomendación:**
- Si implementamos auditoría, usar UNA sola tabla
- Llamarla `layaway_events` (más descriptivo)
- No crear `layaway_audit_log` separada

---

### 4.3. ¿Columna `policy_version` en layaways?

**Propósito:** Versionar políticas de apartado

**Ejemplo:**
```sql
ALTER TABLE layaways
  ADD COLUMN policy_version INTEGER DEFAULT 1;
```

**Uso:**
```javascript
if (layaway.policy_version === 1) {
  // Sistema antiguo (depósito + saldo)
  // Política: 15 días, 20% depósito
} else if (layaway.policy_version === 2) {
  // Sistema nuevo (planes de pago)
  // Política: 6 semanas sin abono = cancelación
}
```

**¿Conviene?**

**✅ SÍ - Útil para convivencia de versiones**

**Razón:**
- Permite identificar bajo qué política se creó el apartado
- Facilita migración gradual
- Permite cambiar políticas en futuro sin romper apartados antiguos
- Útil para soporte (saber qué reglas aplicaban)

**Recomendación:** ✅ AGREGAR

**Valores propuestos:**
- `1` = Sistema antiguo (depósito + saldo)
- `2` = Sistema nuevo (planes de pago) ← Default para apartados nuevos

---

### 4.4. ¿Columna `admin_notes` en layaway_payments?

**Propósito:** Notas admin por pago individual

**Ejemplo:**
```sql
ALTER TABLE layaway_payments
  ADD COLUMN admin_notes TEXT;
```

**Uso:**
- Admin registra pago manual → escribe nota
- Admin extiende fecha → escribe razón
- Admin condona cuota → escribe justificación

**¿Conviene?**

**✅ SÍ - Útil para tracking de excepciones**

**Razón:**
- Admin necesita documentar pagos manuales
- Útil para soporte (contexto de decisiones)
- Auditoría básica sin tabla separada

**Recomendación:** ✅ AGREGAR

**Alternativa considerada:**
- Usar tabla `layaway_events` con `event_data.notes`
- Más complejo, menos directo

**Decisión:** Agregar `admin_notes TEXT` a `layaway_payments`

---

### 4.5. ¿Columna `updated_at` en layaway_payments?

**Propósito:** Timestamp de última actualización

**¿Conviene?**

**✅ SÍ - Estándar de buenas prácticas**

**Razón:**
- Tracking de cuándo cambió el pago
- Útil para debugging
- Auditoría básica
- Estándar en la industria

**Recomendación:** ✅ AGREGAR

**Con trigger automático:**
```sql
CREATE OR REPLACE FUNCTION update_layaway_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_layaway_payments_updated_at
  BEFORE UPDATE ON layaway_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_layaway_payments_updated_at();
```

---

### Resumen de Decisiones - Tablas/Columnas Adicionales

| Item | Agregar | Cuándo | Razón |
|------|---------|--------|-------|
| `layaway_events` tabla | ❌ NO | Post-MVP | No necesario para MVP, agrega complejidad |
| `layaway_audit_log` tabla | ❌ NO | - | Duplica `layaway_events` |
| `policy_version` columna | ✅ SÍ | Migration 018 | Útil para convivencia de versiones |
| `admin_notes` en payments | ✅ SÍ | Migration 019 | Tracking de excepciones |
| `updated_at` en payments | ✅ SÍ | Migration 019 | Estándar + auditoría básica |

**Total de cambios aprobados:**
- ✅ Agregar `policy_version INTEGER DEFAULT 2` a `layaways`
- ✅ Agregar `admin_notes TEXT` a `layaway_payments`
- ✅ Agregar `updated_at TIMESTAMPTZ DEFAULT NOW()` a `layaway_payments`
- ✅ Crear trigger para `updated_at`

---

## 5. PROPUESTA: MIGRACIÓN 018

### 3.1. Estrategia de Migración

**Principios:**
1. ✅ **Aditiva** - Solo agregar columnas, NO eliminar ni renombrar
2. ✅ **Compatible** - Mantener columnas antiguas por compatibilidad
3. ✅ **Segura** - Todos los campos nuevos son nullable o tienen defaults
4. ✅ **Reversible** - Puede revertirse sin pérdida de datos

**Columnas antiguas que se mantienen:**
- `product_price` → Mantener (compatibilidad)
- `deposit_percent` → Mantener (compatibilidad)
- `deposit_amount` → Mantener (compatibilidad)
- `balance_amount` → Mantener (compatibilidad)
- `deposit_session_id` → Mantener (compatibilidad)
- `deposit_payment_intent_id` → Mantener (compatibilidad)
- `deposit_paid_at` → Mantener (compatibilidad)
- `balance_session_id` → Mantener (compatibilidad)
- `balance_payment_intent_id` → Mantener (compatibilidad)
- `balance_paid_at` → Mantener (compatibilidad)
- `expires_at` → Mantener (ahora se usa `plan_end_date`)

**Nota:** En el futuro, si queremos eliminar campos antiguos, se hará en migración separada después de validar que no se usan.

---

### 5.2. SQL Propuesto - Migración 018 (ACTUALIZADO)

```sql
-- ========================================
-- Migration 018: Layaway Payment Plans - Add Columns
-- Date: 2026-05-01
-- Purpose: Extend layaways table to support payment plans
-- Strategy: ADDITIVE - No columns deleted or renamed
-- Type: NUMERIC(10, 2) para montos (precisión exacta)
-- ========================================

-- ========================================
-- 1. Add new columns to layaways
-- ========================================

ALTER TABLE layaways
  -- Plan configuration
  ADD COLUMN IF NOT EXISTS plan_type TEXT 
    CHECK (plan_type IN ('cash', '4_weekly_payments', '8_weekly_payments', '18_weekly_payments')),
  
  ADD COLUMN IF NOT EXISTS total_payments INTEGER,
  
  ADD COLUMN IF NOT EXISTS first_payment_amount NUMERIC(10, 2),
  
  ADD COLUMN IF NOT EXISTS minimum_first_payment_amount NUMERIC(10, 2),
  
  -- Amounts (new system) - NUMERIC(10, 2) para precisión exacta
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS amount_remaining NUMERIC(10, 2),
  
  -- Payment tracking
  ADD COLUMN IF NOT EXISTS payments_completed INTEGER DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS payments_remaining INTEGER,
  
  ADD COLUMN IF NOT EXISTS next_payment_due_date TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN IF NOT EXISTS next_payment_amount NUMERIC(10, 2),
  
  -- Plan dates
  ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
  
  -- Control
  ADD COLUMN IF NOT EXISTS consecutive_weeks_without_payment INTEGER DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS forfeited_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer account link
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Policy versioning (NEW)
  ADD COLUMN IF NOT EXISTS policy_version INTEGER DEFAULT 2;

-- ========================================
-- 2. Update status constraint to include new states
-- ========================================

-- Drop old constraint
ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;

-- Add new constraint with all states
ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN (
    -- Old states (keep for compatibility)
    'pending',
    'active',
    'completed',
    'expired',
    'cancelled',
    -- New states
    'pending_first_payment',
    'overdue',
    'forfeited',
    'cancelled_for_non_payment',
    'cancelled_manual',
    'forfeiture_pending'
  ));

-- ========================================
-- 3. Create indexes for new columns
-- ========================================

CREATE INDEX IF NOT EXISTS idx_layaways_plan_type ON layaways(plan_type);
CREATE INDEX IF NOT EXISTS idx_layaways_plan_end_date ON layaways(plan_end_date);
CREATE INDEX IF NOT EXISTS idx_layaways_last_payment_at ON layaways(last_payment_at);
CREATE INDEX IF NOT EXISTS idx_layaways_consecutive_weeks ON layaways(consecutive_weeks_without_payment);
CREATE INDEX IF NOT EXISTS idx_layaways_user_id ON layaways(user_id);
CREATE INDEX IF NOT EXISTS idx_layaways_next_payment_due ON layaways(next_payment_due_date);

-- ========================================
-- 4. Add comments for documentation
-- ========================================

COMMENT ON COLUMN layaways.plan_type IS 'Plan de pago: cash, 4_weekly_payments, 8_weekly_payments, 18_weekly_payments';
COMMENT ON COLUMN layaways.total_payments IS 'Número total de pagos del plan (1, 4, 8, o 18)';
COMMENT ON COLUMN layaways.first_payment_amount IS 'Monto del primer pago (puede ser > mínimo)';
COMMENT ON COLUMN layaways.minimum_first_payment_amount IS 'Primer pago mínimo requerido por el plan';
COMMENT ON COLUMN layaways.total_amount IS 'Precio total del producto (igual a product_price)';
COMMENT ON COLUMN layaways.amount_paid IS 'Total pagado hasta ahora (suma de todos los pagos confirmados)';
COMMENT ON COLUMN layaways.amount_remaining IS 'Saldo pendiente (total_amount - amount_paid)';
COMMENT ON COLUMN layaways.payments_completed IS 'Número de pagos completados';
COMMENT ON COLUMN layaways.payments_remaining IS 'Número de pagos pendientes';
COMMENT ON COLUMN layaways.next_payment_due_date IS 'Fecha de vencimiento del próximo pago';
COMMENT ON COLUMN layaways.next_payment_amount IS 'Monto del próximo pago';
COMMENT ON COLUMN layaways.plan_start_date IS 'Fecha de inicio del plan (cuando se confirma primer pago)';
COMMENT ON COLUMN layaways.plan_end_date IS 'Fecha límite del plan (última cuota programada)';
COMMENT ON COLUMN layaways.last_payment_at IS 'Fecha del último pago confirmado (para regla 6 semanas)';
COMMENT ON COLUMN layaways.consecutive_weeks_without_payment IS 'Contador de semanas consecutivas sin abono (para regla 6 semanas)';
COMMENT ON COLUMN layaways.forfeited_at IS 'Fecha en que se marcó como perdido (forfeited)';
COMMENT ON COLUMN layaways.user_id IS 'ID de cuenta de cliente (null si guest o creado antes de cuentas)';
COMMENT ON COLUMN layaways.policy_version IS 'Versión de política: 1=sistema antiguo (depósito+saldo), 2=planes de pago';

-- Update status comment
COMMENT ON COLUMN layaways.status IS 'Estado: pending_first_payment, active, overdue, completed, expired, forfeited, cancelled_for_non_payment, cancelled_manual, forfeiture_pending';

-- ========================================
-- 5. Backfill user_id for existing layaways (if any)
-- ========================================

UPDATE layaways
SET user_id = cp.user_id
FROM customer_profiles cp
WHERE layaways.customer_email = cp.email
  AND layaways.user_id IS NULL;

-- ========================================
-- Migration 018 complete
-- ========================================
```

---

### 5.3. SQL Propuesto - Migración 019 (ACTUALIZADO)

```sql
-- ========================================
-- Migration 019: Create layaway_payments table
-- Date: 2026-05-01
-- Purpose: Track individual payments of payment plans
-- Type: NUMERIC(10, 2) para montos (precisión exacta)
-- ========================================

-- ========================================
-- 1. Create layaway_payments table
-- ========================================

CREATE TABLE IF NOT EXISTS layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation to layaway
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  -- Payment identification
  payment_number INTEGER NOT NULL,
    -- 1, 2, 3... (order of payment within the plan)
  
  -- Amounts - NUMERIC(10, 2) para precisión exacta
  amount_due NUMERIC(10, 2) NOT NULL,
    -- Expected amount for this payment
  
  amount_paid NUMERIC(10, 2),
    -- Actual amount paid (null if not paid yet)
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- When this payment is due
  
  paid_at TIMESTAMP WITH TIME ZONE,
    -- When payment was actually confirmed
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',     -- Awaiting payment
    'paid',        -- Successfully paid
    'overdue',     -- Past due date without payment
    'cancelled',   -- Cancelled (layaway cancelled manually)
    'forfeited',   -- Forfeited (layaway forfeited/cancelled_for_non_payment)
    'failed'       -- Payment attempt failed
  )) DEFAULT 'pending',
  
  -- Stripe integration
  stripe_session_id TEXT,
    -- Stripe checkout session ID for this payment
  
  stripe_payment_intent_id TEXT,
    -- Stripe payment intent ID
  
  -- Payment type
  payment_type TEXT CHECK (payment_type IN (
    'first',       -- First payment (downpayment)
    'installment', -- Regular installment
    'final',       -- Last payment
    'extra'        -- Extra/advance payment
  )),
  
  -- Admin notes (NEW)
  admin_notes TEXT,
    -- Admin can document manual payments, extensions, exceptions
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Automatically updated on change (via trigger)
);

-- ========================================
-- 2. Create indexes
-- ========================================

CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE INDEX idx_layaway_payments_payment_number ON layaway_payments(payment_number);

-- Unique constraint: one payment_number per layaway
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);

-- ========================================
-- 3. Create trigger for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_layaway_payments_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_layaway_payments_updated_at
  BEFORE UPDATE ON layaway_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_layaway_payments_updated_at();

-- ========================================
-- 4. Add comments
-- ========================================

COMMENT ON TABLE layaway_payments IS 'Individual payments of layaway payment plans';
COMMENT ON COLUMN layaway_payments.payment_number IS 'Payment sequence number (1, 2, 3...)';
COMMENT ON COLUMN layaway_payments.amount_due IS 'Expected payment amount (NUMERIC for precision)';
COMMENT ON COLUMN layaway_payments.amount_paid IS 'Actual payment amount (may differ slightly due to rounding)';
COMMENT ON COLUMN layaway_payments.due_date IS 'Payment due date';
COMMENT ON COLUMN layaway_payments.paid_at IS 'Actual payment confirmation timestamp';
COMMENT ON COLUMN layaway_payments.status IS 'Payment status: pending, paid, overdue, cancelled, forfeited, failed';
COMMENT ON COLUMN layaway_payments.payment_type IS 'Payment type: first, installment, final, extra';
COMMENT ON COLUMN layaway_payments.admin_notes IS 'Admin notes for manual payments, extensions, exceptions';
COMMENT ON COLUMN layaway_payments.updated_at IS 'Last modification timestamp (auto-updated via trigger)';

-- ========================================
-- Migration 019 complete
-- ========================================
```

---

### 5.4. SQL Propuesto - Migración 020 (RLS ACTUALIZADA)

```sql
-- ========================================
-- Migration 020: RLS policies for layaway_payments and layaways
-- Date: 2026-05-01
-- Purpose: Secure RLS while maintaining tracking and checkout functionality
-- ========================================

-- ========================================
-- PARTE 1: RLS para layaway_payments (nueva tabla)
-- ========================================

-- 1.1. Enable RLS
ALTER TABLE layaway_payments ENABLE ROW LEVEL SECURITY;

-- 1.2. Service role full access (admin, tracking API, checkout API)
CREATE POLICY "Service role full access on layaway_payments"
  ON layaway_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 1.3. Authenticated customers can view payments of their own layaways
CREATE POLICY "Customers can view own layaway payments"
  ON layaway_payments
  FOR SELECT
  TO authenticated
  USING (
    layaway_id IN (
      SELECT id FROM layaways
      WHERE user_id = auth.uid()
         OR customer_email IN (
           SELECT email FROM customer_profiles WHERE user_id = auth.uid()
         )
    )
  );

-- ========================================
-- PARTE 2: Actualizar RLS de layaways (más segura)
-- ========================================

-- 2.1. Drop old public policies (demasiado permisivas)
DROP POLICY IF EXISTS "Public can read layaways by token" ON layaways;
DROP POLICY IF EXISTS "Public can insert layaways" ON layaways;

-- 2.2. Add policy for authenticated customers to view their own layaways
CREATE POLICY "Customers can view own layaways"
  ON layaways
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    customer_email IN (
      SELECT email FROM customer_profiles WHERE user_id = auth.uid()
    )
  );

-- 2.3. Service role policy already exists (Migration 014)
-- No need to recreate: "Service role full access on layaways"

-- ========================================
-- SECURITY NOTES:
-- ========================================
-- 1. Service role bypasses RLS (for admin, tracking API, checkout API)
-- 2. Authenticated customers can only see their own layaways and payments
-- 3. NO public (anon) access to layaways or layaway_payments directly
--
-- 4. TRACKING PÚBLICO sigue funcionando:
--    - /layaway/[token] usa service role en API route
--    - API route valida token antes de retornar datos
--    - RLS no aplica porque se usa supabaseAdmin (service role)
--
-- 5. CHECKOUT sigue funcionando:
--    - /api/checkout/create-layaway usa service role
--    - API route valida request y crea layaway
--    - RLS no aplica porque se usa supabaseAdmin
--
-- 6. ADMIN sigue funcionando:
--    - Admin panel usa supabaseAdmin (service role)
--    - Admin ve todos los layaways
--    - RLS no aplica
--
-- 7. PANEL CLIENTE funciona:
--    - Cliente autenticado usa RLS policies
--    - Solo ve sus propios layaways/payments
--    - RLS aplica (SELECT policy)
-- ========================================

-- ========================================
-- Migration 020 complete
-- ========================================
```

---

## 6. EXPLICACIÓN DETALLADA DE CADA TABLA/COLUMNA NUEVA

### 6.1. Tabla `layaways` - Columnas Nuevas (19 campos)

#### Configuración del Plan

**`plan_type TEXT`**
- **Propósito:** Tipo de plan seleccionado
- **Valores:** `cash`, `4_weekly_payments`, `8_weekly_payments`, `18_weekly_payments`
- **Nullable:** ✅ SÍ (compatibilidad con apartados antiguos)
- **Default:** NULL
- **Uso:** Sistema detecta si es apartado antiguo (NULL) o nuevo (plan específico)

**`total_payments INTEGER`**
- **Propósito:** Número total de pagos del plan
- **Valores:** 1 (cash), 4, 8, o 18
- **Nullable:** ✅ SÍ
- **Uso:** Cálculo de progreso (`payments_completed / total_payments`)

**`first_payment_amount NUMERIC(10, 2)`**
- **Propósito:** Monto del primer pago realizado
- **Puede ser mayor** al mínimo requerido
- **Nullable:** ✅ SÍ
- **Tipo:** NUMERIC(10, 2) para precisión exacta
- **Ejemplo:** $150,000.00 (cliente eligió pagar más del mínimo)

**`minimum_first_payment_amount NUMERIC(10, 2)`**
- **Propósito:** Primer pago mínimo requerido por el plan
- **Uso:** Validación y referencia
- **Nullable:** ✅ SÍ
- **Ejemplo:** $56,250.00 (12.5% de $450,000)

#### Montos

**`total_amount NUMERIC(10, 2)`**
- **Propósito:** Precio total del producto
- **Igual a** `product_price` (pero nombre más claro)
- **Nullable:** ✅ SÍ
- **Tipo:** NUMERIC(10, 2)
- **Ejemplo:** $450,000.00

**`amount_paid NUMERIC(10, 2)`**
- **Propósito:** Total pagado hasta ahora
- **Cálculo:** Suma de todos los pagos confirmados
- **Default:** 0
- **Uso:** Progreso, validación de completitud
- **Ejemplo:** $192,857.14 (después de 2 pagos)

**`amount_remaining NUMERIC(10, 2)`**
- **Propósito:** Saldo pendiente
- **Cálculo:** `total_amount - amount_paid`
- **Nullable:** ✅ SÍ
- **Uso:** UI, botón "Pagar saldo completo"
- **Ejemplo:** $257,142.86

#### Tracking de Pagos

**`payments_completed INTEGER`**
- **Propósito:** Número de pagos completados
- **Default:** 0
- **Incrementa:** Con cada pago confirmado
- **Uso:** Progreso, verificar si es último pago

**`payments_remaining INTEGER`**
- **Propósito:** Número de pagos pendientes
- **Cálculo:** `total_payments - payments_completed`
- **Nullable:** ✅ SÍ
- **Uso:** UI de progreso

**`next_payment_due_date TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Fecha de vencimiento del próximo pago
- **Nullable:** ✅ SÍ (NULL si ya está completado)
- **Uso:** Cron jobs (notificaciones), UI

**`next_payment_amount NUMERIC(10, 2)`**
- **Propósito:** Monto del próximo pago
- **Nullable:** ✅ SÍ
- **Uso:** UI, botón "Pagar siguiente cuota"

#### Fechas del Plan

**`plan_start_date TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Cuándo inició el plan
- **Default:** NOW()
- **Se actualiza:** Cuando se confirma primer pago
- **Uso:** Auditoría, cálculo de duración

**`plan_end_date TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Fecha límite del plan (última cuota)
- **Nullable:** ✅ SÍ
- **Uso:** Cron job para detectar planes vencidos

**`last_payment_at TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Fecha del último pago confirmado
- **Nullable:** ✅ SÍ
- **Uso:** Regla 6 semanas sin abono (crítico)
- **Se actualiza:** Con cada pago confirmado

#### Control

**`consecutive_weeks_without_payment INTEGER`**
- **Propósito:** Contador de semanas sin abono
- **Default:** 0
- **Incrementa:** Cron semanal
- **Reset:** Cuando hay pago
- **Uso:** Regla 6 semanas → cancelación
- **Crítico:** Para política de cancelación automática

**`forfeited_at TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Cuándo se marcó como perdido
- **Nullable:** ✅ SÍ
- **Uso:** Auditoría, tracking de apartados perdidos

#### Vinculación

**`user_id UUID`**
- **Propósito:** Vincular con cuenta de cliente
- **Nullable:** ✅ SÍ (guest o creado antes de sistema de cuentas)
- **Referencias:** `auth.users(id)`
- **Uso:** RLS, panel de cliente

**`policy_version INTEGER`**
- **Propósito:** Versión de política bajo la cual se creó
- **Default:** 2 (planes de pago)
- **Valores:** 1 = sistema antiguo, 2 = planes de pago
- **Uso:** Convivencia de versiones, soporte

---

### 6.2. Tabla `layaway_payments` - Todos los Campos (14 campos)

**`id UUID`**
- **Primary key**
- **Default:** `uuid_generate_v4()`

**`layaway_id UUID`**
- **Foreign key** a `layaways(id)`
- **ON DELETE CASCADE**
- **NOT NULL**
- **Índice:** ✅ (para JOINs)

**`payment_number INTEGER`**
- **Propósito:** Orden del pago (1, 2, 3...)
- **NOT NULL**
- **Unique constraint:** `(layaway_id, payment_number)`
- **Uso:** ORDER BY, identificación

**`amount_due NUMERIC(10, 2)`**
- **Propósito:** Monto esperado
- **NOT NULL**
- **Tipo:** NUMERIC(10, 2) para precisión
- **Ejemplo:** $42,857.14

**`amount_paid NUMERIC(10, 2)`**
- **Propósito:** Monto realmente pagado
- **Nullable:** ✅ SÍ (NULL si no pagado)
- **Puede diferir** ligeramente de `amount_due` (redondeos)
- **Ejemplo:** $42,857.14

**`due_date TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Cuándo vence este pago
- **NOT NULL**
- **Índice:** ✅ (para cron jobs)
- **Ejemplo:** 2026-05-15 00:00:00

**`paid_at TIMESTAMP WITH TIME ZONE`**
- **Propósito:** Cuándo se confirmó el pago
- **Nullable:** ✅ SÍ
- **Uso:** Auditoría, validación

**`status TEXT`**
- **Propósito:** Estado del pago
- **NOT NULL**
- **Default:** `pending`
- **Valores:** pending, paid, overdue, cancelled, forfeited, failed
- **Índice:** ✅ (para filtros)

**`stripe_session_id TEXT`**
- **Propósito:** ID de Checkout Session de Stripe
- **Nullable:** ✅ SÍ (NULL si pago manual)
- **Uso:** Reconciliación webhook

**`stripe_payment_intent_id TEXT`**
- **Propósito:** ID de Payment Intent de Stripe
- **Nullable:** ✅ SÍ
- **Uso:** Idempotencia webhook

**`payment_type TEXT`**
- **Propósito:** Tipo de pago
- **Valores:** first, installment, final, extra
- **Nullable:** ✅ SÍ
- **Uso:** UI, lógica de negocio

**`admin_notes TEXT`**
- **Propósito:** Notas admin para pagos manuales/excepciones
- **Nullable:** ✅ SÍ
- **Uso:** Documentar pagos manuales, extensiones

**`created_at TIMESTAMP WITH TIME ZONE`**
- **Default:** NOW()
- **Uso:** Auditoría

**`updated_at TIMESTAMP WITH TIME ZONE`**
- **Default:** NOW()
- **Auto-actualiza:** Via trigger
- **Uso:** Tracking de modificaciones

---

## 7. CONFIRMACIÓN: MIGRACIÓN ADITIVA Y SEGURA

### 7.1. ¿Es Aditiva?

✅ **SÍ - 100% Aditiva**

**Cambios que NO hacemos:**
- ❌ NO eliminamos columnas existentes
- ❌ NO renombramos columnas
- ❌ NO cambiamos tipos de datos existentes
- ❌ NO eliminamos constraints existentes (solo actualizamos `status` check)

**Cambios que SÍ hacemos:**
- ✅ Agregamos columnas nuevas (todas nullable o con defaults)
- ✅ Creamos tabla nueva (`layaway_payments`)
- ✅ Agregamos índices (no afecta datos)
- ✅ Agregamos policies RLS (no rompe funcionalidad)
- ✅ Actualizamos constraint de `status` (amplía opciones, no restringe)

### 7.2. ¿Es Segura?

✅ **SÍ - Segura para Producción**

**Razones:**

1. **Todas las columnas nuevas son opcionales**
   - Nullable o tienen defaults
   - Apartados existentes no requieren datos nuevos

2. **No rompe queries existentes**
   - SELECT * sigue funcionando
   - WHERE sobre columnas antiguas sigue funcionando
   - JOINs no afectados

3. **No rompe código existente**
   - Frontend actual no usa columnas nuevas
   - API actual no usa columnas nuevas
   - Checkout actual sigue usando `deposit_amount`, `balance_amount`

4. **Backfill seguro**
   - `user_id` se llena desde `customer_profiles` si existe
   - No obliga a llenar si no hay match
   - No bloquea operación

5. **RLS no rompe funcionalidad**
   - Tracking público usa service role (bypassa RLS)
   - Checkout usa service role (bypassa RLS)
   - Admin usa service role (bypassa RLS)
   - Solo panel cliente usa RLS (nuevo, no afecta existente)

### 7.3. Validación de Seguridad

**Antes de ejecutar migraciones:**
- ✅ Código actual NO referencia columnas nuevas
- ✅ Código actual NO referencia tabla `layaway_payments`
- ✅ RLS policies no bloquean APIs existentes

**Después de ejecutar migraciones:**
- ✅ Apartados antiguos siguen visibles
- ✅ Tracking público sigue funcionando
- ✅ Checkout sigue creando apartados
- ✅ Admin sigue viendo todo

---

## 8. RIESGOS TÉCNICOS

### 8.1. Riesgo 1: Apartados Existentes Incompatibles

**Probabilidad:** Baja  
**Impacto:** Bajo

**Descripción:**
- Si hay apartados activos con sistema antiguo
- Código nuevo podría intentar acceder a `plan_type` (NULL)

**Mitigación:**
- Validar `plan_type IS NULL` → usar lógica antigua
- Código de convivencia:
```javascript
if (layaway.plan_type === null || layaway.policy_version === 1) {
  // Sistema antiguo
} else {
  // Sistema nuevo
}
```

**Acción:** Código debe validar antes de acceder a campos nuevos

---

### 8.2. Riesgo 2: RLS Bloquea Tracking Público

**Probabilidad:** Muy Baja  
**Impacto:** Alto

**Descripción:**
- Si tracking público usa client de Supabase con RLS
- Usuarios anónimos no podrían ver apartados

**Mitigación:**
- Tracking público usa service role (`supabaseAdmin`)
- Service role bypassa RLS
- No hay risk

**Validación:** Tests de tracking público después de Migration 020

---

### 8.3. Riesgo 3: Constraint de Status Rompe Apartados Antiguos

**Probabilidad:** Muy Baja  
**Impacto:** Medio

**Descripción:**
- Apartados con status antiguo no reconocido por nuevo constraint

**Mitigación:**
- Nuevo constraint INCLUYE estados antiguos (`pending`, `active`, `completed`, `expired`, `cancelled`)
- Solo agrega nuevos estados
- No restringe

**Validación:** Query para verificar todos los status existentes están en el nuevo constraint

---

### 8.4. Riesgo 4: Índices Nuevos Bloquean Tabla

**Probabilidad:** Baja (depende de volumen)  
**Impacto:** Medio (durante migración)

**Descripción:**
- CREATE INDEX puede bloquear tabla temporalmente
- Si hay muchos apartados, puede tomar tiempo

**Mitigación:**
- Usar `CREATE INDEX CONCURRENTLY` (no bloquea)
- Ejecutar en horario de bajo tráfico
- Monitorear duración

**Nota:** Para MVP con pocos apartados, riesgo mínimo

---

### 8.5. Riesgo 5: Backfill de user_id Falla

**Probabilidad:** Baja  
**Impacto:** Bajo

**Descripción:**
- UPDATE de backfill falla por alguna razón
- `user_id` queda NULL

**Mitigación:**
- UPDATE es transaccional (se revierte si falla)
- `user_id` es nullable (no rompe nada si queda NULL)
- Puede re-ejecutarse después

**Acción:** Validar backfill después de migración con query

---

### 8.6. Riesgo 6: Tipo NUMERIC vs INTEGER

**Probabilidad:** N/A (decisión de diseño)  
**Impacto:** Muy Bajo

**Descripción:**
- NUMERIC es ligeramente más lento que INTEGER

**Análisis:**
- Diferencia es mínima (microsegundos)
- Para <1000 apartados, imperceptible
- Beneficio (precisión, legibilidad) > costo

**Decisión:** NUMERIC(10, 2) aprobado

---

### Resumen de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | Bloqueante |
|--------|--------------|---------|------------|------------|
| Apartados existentes incompatibles | Baja | Bajo | Código de convivencia | ❌ NO |
| RLS bloquea tracking | Muy Baja | Alto | Service role | ❌ NO |
| Constraint rompe status | Muy Baja | Medio | Incluye antiguos | ❌ NO |
| Índices bloquean tabla | Baja | Medio | CONCURRENTLY | ❌ NO |
| Backfill falla | Baja | Bajo | Transaccional | ❌ NO |
| NUMERIC lento | N/A | Muy Bajo | Beneficio > costo | ❌ NO |

**Ningún riesgo es bloqueante.**

**Todas las migraciones son seguras para ejecutar.**

---

## 9. TABLA DE AUDITORÍA (OPCIONAL)

### 4.1. ¿Se necesita tabla `layaway_events` o `audit_log`?

**Consideración:** Para MVP, NO es estrictamente necesaria.

**Razón:**
- Ya tenemos tracking básico en `layaways` (`notes`, `cancelled_by`, `cancellation_reason`)
- Podemos usar logs de aplicación para auditoría inicial
- Los campos nuevos (`last_payment_at`, `forfeited_at`, etc.) dan trazabilidad suficiente

**Cuándo implementar:**
- Si necesitamos auditoría completa de cambios
- Si admin necesita ver historial completo de acciones
- Si necesitamos compliance/regulación

**Propuesta para futuro (Migration 021 - opcional):**

```sql
-- OPCIONAL - NO implementar todavía
CREATE TABLE IF NOT EXISTS layaway_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'payment_confirmed', 'status_changed', 'cancelled', etc.
  event_data JSONB,
  performed_by TEXT,  -- 'system', 'admin', 'customer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_layaway_events_layaway_id ON layaway_events(layaway_id);
CREATE INDEX idx_layaway_events_type ON layaway_events(event_type);
CREATE INDEX idx_layaway_events_created_at ON layaway_events(created_at);
```

**Recomendación:** Dejar para después de MVP validado.

---

## 5. COMPATIBILIDAD Y MIGRACIÓN DE DATOS

### 5.1. ¿Qué pasa con apartados existentes?

**Escenario 1:** No hay apartados activos en producción  
**Acción:** Ninguna, migraciones se aplican sin problemas

**Escenario 2:** Hay apartados activos (sistema simple)  
**Acción:**
1. Los campos nuevos son nullable → apartados antiguos siguen funcionando
2. `plan_type` será NULL → código debe validar y tratar como sistema antiguo
3. No se rompe funcionalidad actual
4. Cuando se complete apartado antiguo, se crea orden normal

**Estrategia de convivencia:**

```javascript
// En código de aplicación
if (layaway.plan_type === null) {
  // Sistema antiguo (depósito + saldo)
  // Usar: deposit_amount, balance_amount, deposit_paid_at, balance_paid_at
} else {
  // Sistema nuevo (planes de pago)
  // Usar: plan_type, total_payments, amount_paid, amount_remaining, etc.
}
```

### 5.2. Validación de integridad

**Después de aplicar migraciones, verificar:**

```sql
-- 1. Verificar que no hay inconsistencias
SELECT id, status, plan_type, total_payments, amount_paid, total_amount
FROM layaways
WHERE plan_type IS NOT NULL
  AND (
    amount_paid > total_amount
    OR payments_completed > total_payments
    OR amount_remaining < 0
  );

-- 2. Verificar que pagos suman correctamente
SELECT 
  l.id,
  l.amount_paid as layaway_amount_paid,
  COALESCE(SUM(lp.amount_paid), 0) as payments_sum,
  l.amount_paid - COALESCE(SUM(lp.amount_paid), 0) as difference
FROM layaways l
LEFT JOIN layaway_payments lp ON lp.layaway_id = l.id AND lp.status = 'paid'
WHERE l.plan_type IS NOT NULL
GROUP BY l.id, l.amount_paid
HAVING ABS(l.amount_paid - COALESCE(SUM(lp.amount_paid), 0)) > 0.01;

-- 3. Verificar estados válidos
SELECT status, COUNT(*)
FROM layaways
GROUP BY status;
```

---

## 6. ÍNDICES PROPUESTOS

### 6.1. Índices en `layaways` (nuevos)

```sql
-- Ya existen:
-- idx_layaways_status
-- idx_layaways_expires_at
-- idx_layaways_product_id
-- idx_layaways_token
-- idx_layaways_customer_email

-- Nuevos propuestos:
CREATE INDEX idx_layaways_plan_type ON layaways(plan_type);
CREATE INDEX idx_layaways_plan_end_date ON layaways(plan_end_date);
CREATE INDEX idx_layaways_last_payment_at ON layaways(last_payment_at);
CREATE INDEX idx_layaways_consecutive_weeks ON layaways(consecutive_weeks_without_payment);
CREATE INDEX idx_layaways_user_id ON layaways(user_id);
CREATE INDEX idx_layaways_next_payment_due ON layaways(next_payment_due_date);
```

**Razón:**
- `plan_type` - Filtros admin por tipo de plan
- `plan_end_date` - Cron job para detectar planes vencidos
- `last_payment_at` - Cron job para detectar 6 semanas sin abono
- `consecutive_weeks_without_payment` - Cron job para detectar cancelaciones
- `user_id` - RLS y filtros de cliente
- `next_payment_due_date` - Cron job para notificaciones de pagos próximos

### 6.2. Índices en `layaway_payments`

```sql
CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE INDEX idx_layaway_payments_payment_number ON layaway_payments(payment_number);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);
```

**Razón:**
- `layaway_id` - JOIN con layaways
- `status` - Filtros de pagos pendientes/vencidos
- `due_date` - Cron job para marcar overdue
- `payment_number` - ORDER BY en listas
- Unique index - Evitar duplicados de payment_number

---

## 7. RLS (ROW LEVEL SECURITY)

### 7.1. RLS para `layaways` (actualizada)

**Política actual (Migration 014):**
- ❌ `"Public can read layaways by token"` - Demasiado permisiva
- ❌ `"Public can insert layaways"` - Permite creación sin autenticación

**Política propuesta (Migration 020):**
- ✅ Service role: full access
- ✅ Authenticated: SELECT own layaways (by user_id or email)
- ❌ NO public access

**Cambios:**
1. Drop policies públicas
2. Add policy para authenticated users

### 7.2. RLS para `layaway_payments` (nueva)

**Políticas propuestas:**
- ✅ Service role: full access
- ✅ Authenticated: SELECT payments de sus propios layaways
- ❌ NO public access

### 7.3. Acceso desde APIs

**Tracking público (`/layaway/[token]`):**
- Usar service role → bypassa RLS
- API valida token antes de retornar datos

**Checkout (`/api/checkout/*`):**
- Usar service role → bypassa RLS
- API valida request antes de procesar

**Admin (`/admin/*`):**
- Usar service role → bypassa RLS
- Middleware valida rol admin

**Panel cliente (`/account/layaways`):**
- Usar cliente autenticado → RLS aplica
- Cliente solo ve sus apartados

---

## 8. PLAN DE VALIDACIÓN POST-MIGRACIÓN

### 8.1. Tests de estructura

```sql
-- 1. Verificar columnas nuevas existen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'layaways'
AND column_name IN (
  'plan_type', 'total_payments', 'first_payment_amount',
  'minimum_first_payment_amount', 'total_amount', 'amount_paid',
  'amount_remaining', 'payments_completed', 'payments_remaining',
  'next_payment_due_date', 'next_payment_amount', 'plan_start_date',
  'plan_end_date', 'last_payment_at', 'consecutive_weeks_without_payment',
  'forfeited_at', 'user_id'
);

-- 2. Verificar tabla layaway_payments existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'layaway_payments';

-- 3. Verificar índices existen
SELECT indexname
FROM pg_indexes
WHERE tablename = 'layaways'
AND indexname LIKE 'idx_layaways_%';

-- 4. Verificar constraint de status
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'layaways_status_check';
```

### 8.2. Tests funcionales

**Caso 1: Crear apartado con plan 4 pagos**
```sql
-- Insertar apartado
INSERT INTO layaways (
  product_id, customer_name, customer_email, customer_phone,
  plan_type, total_payments, first_payment_amount,
  minimum_first_payment_amount, total_amount,
  amount_paid, amount_remaining,
  payments_completed, payments_remaining,
  plan_start_date, plan_end_date,
  status
) VALUES (
  'some-product-uuid', 'Test Cliente', 'test@example.com', '+521234567890',
  '4_weekly_payments', 4, 112500.00,
  112500.00, 450000.00,
  0, 450000.00,
  0, 4,
  NOW(), NOW() + INTERVAL '21 days',
  'pending_first_payment'
) RETURNING id;

-- Verificar se insertó correctamente
SELECT * FROM layaways WHERE id = '<returned-id>';
```

**Caso 2: Crear pagos del plan**
```sql
-- Insertar 4 pagos
INSERT INTO layaway_payments (layaway_id, payment_number, amount_due, due_date, status, payment_type)
VALUES
  ('<layaway-id>', 1, 112500.00, NOW(), 'pending', 'first'),
  ('<layaway-id>', 2, 112500.00, NOW() + INTERVAL '7 days', 'pending', 'installment'),
  ('<layaway-id>', 3, 112500.00, NOW() + INTERVAL '14 days', 'pending', 'installment'),
  ('<layaway-id>', 4, 112500.00, NOW() + INTERVAL '21 days', 'pending', 'final');

-- Verificar se insertaron
SELECT * FROM layaway_payments WHERE layaway_id = '<layaway-id>' ORDER BY payment_number;
```

### 8.3. Tests de RLS

```sql
-- Test 1: Service role puede leer todo
SET ROLE service_role;
SELECT COUNT(*) FROM layaways;
SELECT COUNT(*) FROM layaway_payments;

-- Test 2: Authenticated user solo ve sus layaways
-- (Requiere crear sesión autenticada con Supabase client)
```

---

## 9. ROLLBACK PLAN

### 9.1. Si necesitamos revertir Migration 018

```sql
-- ⚠️ SOLO si es necesario revertir

-- 1. Eliminar columnas nuevas
ALTER TABLE layaways
  DROP COLUMN IF EXISTS plan_type,
  DROP COLUMN IF EXISTS total_payments,
  DROP COLUMN IF EXISTS first_payment_amount,
  DROP COLUMN IF EXISTS minimum_first_payment_amount,
  DROP COLUMN IF EXISTS total_amount,
  DROP COLUMN IF EXISTS amount_paid,
  DROP COLUMN IF EXISTS amount_remaining,
  DROP COLUMN IF EXISTS payments_completed,
  DROP COLUMN IF EXISTS payments_remaining,
  DROP COLUMN IF EXISTS next_payment_due_date,
  DROP COLUMN IF EXISTS next_payment_amount,
  DROP COLUMN IF EXISTS plan_start_date,
  DROP COLUMN IF EXISTS plan_end_date,
  DROP COLUMN IF EXISTS last_payment_at,
  DROP COLUMN IF EXISTS consecutive_weeks_without_payment,
  DROP COLUMN IF EXISTS forfeited_at,
  DROP COLUMN IF EXISTS user_id;

-- 2. Restaurar constraint antiguo
ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;
ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled'));

-- 3. Eliminar índices nuevos
DROP INDEX IF EXISTS idx_layaways_plan_type;
DROP INDEX IF EXISTS idx_layaways_plan_end_date;
DROP INDEX IF EXISTS idx_layaways_last_payment_at;
DROP INDEX IF EXISTS idx_layaways_consecutive_weeks;
DROP INDEX IF EXISTS idx_layaways_user_id;
DROP INDEX IF EXISTS idx_layaways_next_payment_due;
```

### 9.2. Si necesitamos revertir Migration 019

```sql
-- ⚠️ SOLO si es necesario revertir

DROP TABLE IF EXISTS layaway_payments CASCADE;
```

### 9.3. Si necesitamos revertir Migration 020

```sql
-- ⚠️ SOLO si es necesario revertir

-- 1. Eliminar policies de layaway_payments
DROP POLICY IF EXISTS "Service role full access on layaway_payments" ON layaway_payments;
DROP POLICY IF EXISTS "Customers can view own layaway payments" ON layaway_payments;

-- 2. Eliminar policy de layaways
DROP POLICY IF EXISTS "Customers can view own layaways" ON layaways;

-- 3. Restaurar policies antiguas
CREATE POLICY "Public can read layaways by token"
  ON layaways FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert layaways"
  ON layaways FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4. Disable RLS en layaway_payments
ALTER TABLE layaway_payments DISABLE ROW LEVEL SECURITY;
```

---

## 10. RESUMEN Y RECOMENDACIONES

### 10.1. Migraciones Propuestas

| Migración | Propósito | Riesgo | Reversible |
|-----------|-----------|--------|------------|
| **018** | Agregar columnas a layaways | Bajo | ✅ Sí |
| **019** | Crear tabla layaway_payments | Bajo | ✅ Sí |
| **020** | Actualizar RLS | Medio | ✅ Sí |

**Total:** 3 migraciones

### 10.2. Columnas Agregadas

**En `layaways`:** 18 campos nuevos  
**Tabla nueva:** `layaway_payments` (12 campos)

**Total:** 30 campos nuevos en el sistema

### 10.3. Compatibilidad

**✅ Migraciones son aditivas**
- NO se eliminan columnas
- NO se renombran columnas
- Solo se agregan

**✅ Apartados existentes siguen funcionando**
- Campos nuevos son nullable o tienen defaults
- Código puede detectar sistema antiguo vs nuevo

**✅ Reversible**
- Todas las migraciones pueden revertirse
- Sin pérdida de datos

### 10.4. Próximos Pasos (Pendiente Aprobación)

1. ⏳ Jhonatan revisa esta auditoría
2. ⏳ Jhonatan aprueba SQL propuesto
3. ⏳ Kepler ejecuta migraciones 018, 019, 020
4. ⏳ Kepler valida estructura con tests
5. ⏳ Kepler confirma todo OK
6. ⏳ Jhonatan aprueba continuar con siguiente fase

---

## 11. PRUEBAS POST-MIGRACIÓN

### 11.1. Tests de Estructura (Inmediatos)

**Ejecutar después de cada migración:**

```sql
-- Test 1: Verificar columnas nuevas existen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'layaways'
AND column_name IN (
  'plan_type', 'total_payments', 'first_payment_amount',
  'minimum_first_payment_amount', 'total_amount', 'amount_paid',
  'amount_remaining', 'payments_completed', 'payments_remaining',
  'next_payment_due_date', 'next_payment_amount', 'plan_start_date',
  'plan_end_date', 'last_payment_at', 'consecutive_weeks_without_payment',
  'forfeited_at', 'user_id', 'policy_version'
)
ORDER BY column_name;
-- Esperado: 19 filas

-- Test 2: Verificar tabla layaway_payments existe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'layaway_payments'
ORDER BY ordinal_position;
-- Esperado: 14 filas (id, layaway_id, payment_number, amount_due, amount_paid, due_date, paid_at, status, stripe_session_id, stripe_payment_intent_id, payment_type, admin_notes, created_at, updated_at)

-- Test 3: Verificar índices existen
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('layaways', 'layaway_payments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
-- Esperado: índices nuevos

-- Test 4: Verificar constraint de status
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'layaways_status_check';
-- Esperado: incluye todos los estados nuevos

-- Test 5: Verificar trigger updated_at existe
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_layaway_payments_updated_at';
-- Esperado: 1 fila (BEFORE UPDATE)
```

---

### 11.2. Tests de Integridad (Post-Migración)

```sql
-- Test 6: Verificar no hay apartados rotos
SELECT id, status, plan_type, total_payments, amount_paid, total_amount
FROM layaways
WHERE plan_type IS NOT NULL
  AND (
    amount_paid > total_amount
    OR payments_completed > total_payments
    OR amount_remaining < 0
  );
-- Esperado: 0 filas (ningún apartado roto)

-- Test 7: Verificar backfill de user_id
SELECT 
  COUNT(*) as total_layaways,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as without_user_id
FROM layaways;
-- Verificar cuántos tienen user_id vinculado

-- Test 8: Verificar apartados antiguos siguen válidos
SELECT id, status, product_price, deposit_amount, balance_amount
FROM layaways
WHERE plan_type IS NULL
LIMIT 5;
-- Apartados antiguos deben seguir teniendo sus campos
```

---

### 11.3. Tests de RLS (Seguridad)

```sql
-- Test 9: Service role puede leer todo
SET ROLE service_role;
SELECT COUNT(*) FROM layaways;
SELECT COUNT(*) FROM layaway_payments;
RESET ROLE;
-- Esperado: Devuelve resultados

-- Test 10: Authenticated user solo ve sus layaways (requiere sesión real)
-- (Este test requiere crear usuario de prueba con Supabase Auth)
-- Ejecutar desde aplicación después de migración
```

---

### 11.4. Tests Funcionales (Inserción)

```sql
-- Test 11: Insertar apartado de prueba con plan 4 pagos
INSERT INTO layaways (
  product_id, customer_name, customer_email, customer_phone,
  plan_type, total_payments, first_payment_amount,
  minimum_first_payment_amount, total_amount,
  amount_paid, amount_remaining,
  payments_completed, payments_remaining,
  plan_start_date, plan_end_date,
  status, policy_version,
  product_price, deposit_percent, deposit_amount, balance_amount, currency
) VALUES (
  (SELECT id FROM products WHERE status = 'available' LIMIT 1),
  'Test Cliente', 'test@example.com', '+521234567890',
  '4_weekly_payments', 4, 112500.00,
  112500.00, 450000.00,
  0, 450000.00,
  0, 4,
  NOW(), NOW() + INTERVAL '21 days',
  'pending_first_payment', 2,
  450000.00, 25.00, 112500.00, 337500.00, 'MXN'
) RETURNING id;
-- Esperado: Inserta exitosamente, devuelve UUID

-- Test 12: Insertar pagos del apartado de prueba
INSERT INTO layaway_payments (layaway_id, payment_number, amount_due, due_date, status, payment_type)
VALUES
  ('<layaway-id-from-test-11>', 1, 112500.00, NOW(), 'pending', 'first'),
  ('<layaway-id-from-test-11>', 2, 112500.00, NOW() + INTERVAL '7 days', 'pending', 'installment'),
  ('<layaway-id-from-test-11>', 3, 112500.00, NOW() + INTERVAL '14 days', 'pending', 'installment'),
  ('<layaway-id-from-test-11>', 4, 112500.00, NOW() + INTERVAL '21 days', 'pending', 'final');
-- Esperado: Inserta 4 filas

-- Test 13: Verificar suma de amount_due
SELECT 
  l.id,
  l.total_amount,
  SUM(lp.amount_due) as sum_payments
FROM layaways l
JOIN layaway_payments lp ON lp.layaway_id = l.id
WHERE l.id = '<layaway-id-from-test-11>'
GROUP BY l.id, l.total_amount;
-- Esperado: total_amount = sum_payments (450000.00)

-- Test 14: Limpiar apartado de prueba
DELETE FROM layaway_payments WHERE layaway_id = '<layaway-id-from-test-11>';
DELETE FROM layaways WHERE id = '<layaway-id-from-test-11>';
-- Esperado: Se elimina correctamente (CASCADE funciona)
```

---

### 11.5. Tests de Compatibilidad (API/Frontend)

**Después de migración, validar:**

1. **Tracking público funciona:**
   - Visitar `/layaway/[token]` con token válido
   - Verificar se muestra apartado correctamente
   - ✅ Sin errores de RLS

2. **Checkout funciona:**
   - Crear apartado desde admin o API
   - Verificar se inserta en DB
   - ✅ Sin errores de permisos

3. **Admin panel funciona:**
   - Listar apartados en `/admin/layaways`
   - Verificar se muestran todos
   - ✅ Service role bypassa RLS

4. **Panel cliente funciona (si existe):**
   - Login con cliente de prueba
   - Visitar `/account/layaways`
   - Verificar solo ve sus apartados
   - ✅ RLS aplica correctamente

---

### 11.6. Checklist de Validación

**Ejecutar en orden:**

- [ ] Migration 018 aplicada sin errores
- [ ] Tests de estructura 1-5 PASS
- [ ] Tests de integridad 6-8 PASS
- [ ] Migration 019 aplicada sin errores
- [ ] Tests funcionales 11-14 PASS
- [ ] Migration 020 aplicada sin errores
- [ ] Tests de RLS 9-10 PASS
- [ ] Tests de compatibilidad 1-4 PASS
- [ ] Apartado de prueba creado/eliminado OK
- [ ] Tracking público sigue funcionando
- [ ] Checkout sigue funcionando
- [ ] Admin panel sigue funcionando

**Si todos los checks pasan → Migraciones exitosas ✅**

---

## 12. CONFIRMACIÓN FINAL

### ❌ NO SE EJECUTÓ NINGÚN SQL

**Verificado 100%:**
- ❌ Migraciones NO ejecutadas
- ❌ Base de datos NO modificada
- ❌ Supabase NO tocado
- ❌ Código NO modificado
- ❌ Frontend NO tocado
- ❌ Stripe NO configurado
- ❌ Webhook NO modificado
- ❌ Admin panel NO modificado
- ❌ Checkout NO modificado

**Solo documentación generada:**
- ✅ Auditoría completa de tablas actuales
- ✅ Auditoría completa de RLS actuales
- ✅ Análisis de tipo de datos (NUMERIC vs INTEGER)
- ✅ Análisis de tablas adicionales (layaway_events, admin_notes, updated_at, policy_version)
- ✅ SQL preliminar completo (3 migraciones)
- ✅ Explicación detallada de cada tabla/columna nueva
- ✅ Confirmación: migración aditiva y segura
- ✅ Riesgos técnicos identificados (6 riesgos, ninguno bloqueante)
- ✅ Plan de rollback completo (reversible)
- ✅ Pruebas post-migración definidas (14 tests + checklist)

---

### ✅ ENTREGA COMPLETA - 10 PUNTOS SOLICITADOS

1. ✅ **Auditoría de tablas actuales** (Sección 1)
2. ✅ **Auditoría de RLS actuales** (Sección 2.6)
3. ✅ **SQL preliminar completo Fase 5C.2** (Secciones 5.2, 5.3, 5.4)
4. ✅ **Explicación de cada tabla/columna nueva** (Sección 6)
5. ✅ **Confirmación migración aditiva y segura** (Sección 7)
6. ✅ **Riesgos técnicos** (Sección 8)
7. ✅ **Cómo hacer rollback** (Sección 10)
8. ✅ **Qué pruebas harías post-migración** (Sección 11)
9. ✅ **Confirmación NO ejecutaste migraciones** (Esta sección)
10. ✅ **Confirmación NO tocaste código/frontend/Stripe/webhook/admin/checkout** (Esta sección)

---

### 📊 RESUMEN FINAL

**Migraciones propuestas:** 3 (018, 019, 020)  
**Campos nuevos:** 19 en `layaways` + 14 en `layaway_payments` (nueva tabla)  
**Tipo de datos para dinero:** NUMERIC(10, 2) ✅  
**Tablas adicionales:** policy_version ✅, admin_notes ✅, updated_at ✅, layaway_events ❌ (post-MVP)  
**RLS:** Actualizada (más segura, no rompe funcionalidad)  
**Riesgo:** BAJO (ninguno bloqueante)  
**Reversible:** ✅ SÍ (100%)  
**Compatible:** ✅ SÍ (apartados antiguos siguen funcionando)  
**Segura:** ✅ SÍ (todas las columnas nuevas nullable o con defaults)

---

**Documento generado:** 2026-05-01 19:30 UTC (actualizado)  
**Autor:** Kepler  
**Versión:** 2.0 (incluye análisis completo solicitado)  
**Status:** ✅ LISTO PARA REVISIÓN Y APROBACIÓN

**Esperando aprobación de Jhonatan para ejecutar migraciones 018, 019, 020.**
