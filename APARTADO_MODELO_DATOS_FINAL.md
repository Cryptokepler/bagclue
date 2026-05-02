# MODELO DE DATOS FINAL - Sistema de Apartado Bagclue

**Fecha:** 2026-05-01 19:00 UTC  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ✅ PROPUESTA FINAL - NO IMPLEMENTADO

---

## ⚠️ CONFIRMACIÓN ABSOLUTA

### ❌ NO SE IMPLEMENTÓ NADA

- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó checkout
- ❌ NO se tocó webhook
- ❌ NO se tocó admin
- ❌ NO se ejecutó ningún SQL
- ❌ NO se aplicaron migraciones

**Este documento es solo propuesta técnica.**

---

## 1. POLÍTICA OFICIAL BAGCLUE

### Resumen de Políticas (Versión Final)

1. ✅ **Puntualidad obligatoria** - Pagos puntuales o apartado en riesgo
2. ❌ **Si no liquida al final, pierde el apartado** - Sin reembolso
3. 🚫 **No cambio de artículo** - Inmutable
4. ❌ **No cancelaciones/devoluciones automáticas** - Admin decide
5. 💰 **Pagos NO reembolsables** - Salvo excepción manual
6. ⏰ **6 semanas sin abono = cancelación automática**
7. 🔓 **Pieza vuelve a disponible** - Al cancelar
8. 🤝 **Sistema de compromiso y confianza**

---

## 2. SIMULACIONES - PRODUCTO $450,000 MXN

### Simulación 1: Pago de Contado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: Pago de contado

Primer pago: $450,000 (100%)
Saldo restante: $0
Pagos restantes: 0

Calendario:
• Pago 1: Hoy — $450,000 ✅

Fecha final: Hoy

POLÍTICA:
✅ Pago completo - Envío inmediato
⚠️ Pago NO reembolsable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 2: 4 Pagos Semanales (Mínimo)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 4 pagos semanales

Primer pago mínimo: $112,500 (25%)
Primer pago elegido: $112,500 ✅

Saldo restante: $337,500
Pagos restantes: 3
Monto por cuota: $112,500

Calendario:
• Pago 1: 01 May 2026 (hoy) — $112,500 ✅
• Pago 2: 08 May 2026 — $112,500
• Pago 3: 15 May 2026 — $112,500
• Pago 4: 22 May 2026 — $112,500

Fecha final del plan: 22 May 2026 (21 días)

POLÍTICA:
✅ Pagos semanales puntuales obligatorios
🚫 No cambios de artículo
❌ No cancelaciones ni devoluciones
⏰ Si no liquidas al final, pierdes el apartado
🚫 Si pasan 6 semanas sin abono, se cancela
🔓 La pieza vuelve a estar disponible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 3: 4 Pagos Semanales (Primer Pago Mayor)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 4 pagos semanales

Primer pago mínimo: $112,500 (25%)
Primer pago elegido: $200,000 💰 ⬆️ (44.4%)

Saldo restante: $250,000
Pagos restantes: 3
Monto por cuota: $83,333.33 ⬇️

Ahorro por cuota: $29,166.67

Calendario:
• Pago 1: 01 May 2026 (hoy) — $200,000 ✅
• Pago 2: 08 May 2026 — $83,333.33
• Pago 3: 15 May 2026 — $83,333.33
• Pago 4: 22 May 2026 — $83,333.33

Fecha final del plan: 22 May 2026 (21 días)

POLÍTICA: (igual que anterior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 4: 8 Pagos Semanales (Mínimo)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 8 pagos semanales

Primer pago mínimo: $56,250 (12.5%)
Primer pago elegido: $56,250 ✅

Saldo restante: $393,750
Pagos restantes: 7
Monto por cuota: $56,250

Calendario:
• Pago 1: 01 May 2026 (hoy) — $56,250 ✅
• Pago 2: 08 May 2026 — $56,250
• Pago 3: 15 May 2026 — $56,250
• Pago 4: 22 May 2026 — $56,250
• Pago 5: 29 May 2026 — $56,250
• Pago 6: 05 Jun 2026 — $56,250
• Pago 7: 12 Jun 2026 — $56,250
• Pago 8: 19 Jun 2026 — $56,250

Fecha final del plan: 19 Jun 2026 (49 días)

POLÍTICA: (igual que anterior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 5: 8 Pagos Semanales (Primer Pago Mayor)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 8 pagos semanales

Primer pago mínimo: $56,250 (12.5%)
Primer pago elegido: $150,000 💰 ⬆️ (33.3%)

Saldo restante: $300,000
Pagos restantes: 7
Monto por cuota: $42,857.14 ⬇️

Ahorro por cuota: $13,392.86

Calendario:
• Pago 1: 01 May 2026 (hoy) — $150,000 ✅
• Pago 2: 08 May 2026 — $42,857.14
• Pago 3: 15 May 2026 — $42,857.14
• Pago 4: 22 May 2026 — $42,857.14
• Pago 5: 29 May 2026 — $42,857.14
• Pago 6: 05 Jun 2026 — $42,857.14
• Pago 7: 12 Jun 2026 — $42,857.14
• Pago 8: 19 Jun 2026 — $42,857.14

Fecha final del plan: 19 Jun 2026 (49 días)

POLÍTICA: (igual que anterior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 6: 18 Pagos Semanales (Mínimo)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 18 pagos semanales

Primer pago mínimo: $25,000 (5.56%)
Primer pago elegido: $25,000 ✅

Saldo restante: $425,000
Pagos restantes: 17
Monto por cuota: $25,000

Calendario:
• Pago 1: 01 May 2026 (hoy) — $25,000 ✅
• Pago 2: 08 May 2026 — $25,000
• Pago 3: 15 May 2026 — $25,000
...
• Pago 17: 18 Ago 2026 — $25,000
• Pago 18: 25 Ago 2026 — $25,000

Fecha final del plan: 25 Ago 2026 (119 días / ~4 meses)

POLÍTICA: (igual que anterior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Simulación 7: 18 Pagos Semanales (Primer Pago Mayor)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Producto: Hermès Birkin 30 Gold
Precio total: $450,000 MXN
Plan: 18 pagos semanales

Primer pago mínimo: $25,000 (5.56%)
Primer pago elegido: $100,000 💰 ⬆️ (22.2%)

Saldo restante: $350,000
Pagos restantes: 17
Monto por cuota: $20,588.24 ⬇️

Ahorro por cuota: $4,411.76

Calendario:
• Pago 1: 01 May 2026 (hoy) — $100,000 ✅
• Pago 2: 08 May 2026 — $20,588.24
• Pago 3: 15 May 2026 — $20,588.24
...
• Pago 17: 18 Ago 2026 — $20,588.24
• Pago 18: 25 Ago 2026 — $20,588.24

Fecha final del plan: 25 Ago 2026 (119 días / ~4 meses)

POLÍTICA: (igual que anterior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. MODELO DE DATOS PROPUESTO

### Tabla: `layaways` (Actualizada)

**Campos nuevos/modificados:**

```sql
-- Plan seleccionado
plan_type TEXT NOT NULL 
  CHECK (plan_type IN ('contado', '4weeks', '8weeks', '18weeks'))

-- Configuración del plan
total_payments INTEGER NOT NULL  -- 1, 4, 8, o 18

first_payment_amount NUMERIC(10, 2) NOT NULL
  -- Primer pago realizado (puede ser > mínimo)

-- Montos
total_amount NUMERIC(10, 2) NOT NULL
  -- Precio total del producto

amount_paid NUMERIC(10, 2) DEFAULT 0
  -- Total pagado hasta ahora

amount_remaining NUMERIC(10, 2)
  -- Saldo pendiente

-- Tracking de pagos
payments_completed INTEGER DEFAULT 0
  -- Cuotas pagadas

payments_remaining INTEGER
  -- Cuotas pendientes

next_payment_due_date TIMESTAMP WITH TIME ZONE
  -- Próxima fecha de pago

next_payment_amount NUMERIC(10, 2)
  -- Monto de próximo pago

-- Fechas del plan
plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()

plan_end_date TIMESTAMP WITH TIME ZONE
  -- Fecha límite del plan (última cuota)

last_payment_at TIMESTAMP WITH TIME ZONE
  -- Última fecha de pago confirmado (para regla 6 semanas)

-- Control de atraso
consecutive_weeks_without_payment INTEGER DEFAULT 0
  -- Contador de semanas sin abono (para regla 6 semanas)

-- Estado
status TEXT NOT NULL CHECK (status IN (
  'pending_first_payment',    -- Apartado creado, esperando primer pago
  'active',                   -- Primer pago confirmado, apartado activo
  'overdue',                  -- Tiene pagos atrasados
  'completed',                -- Completado (100% pagado + orden creada)
  'expired',                  -- Plan vencido sin liquidar
  'forfeited',                -- Perdido por incumplimiento
  'cancelled_for_non_payment',-- Cancelado por 6 semanas sin abono
  'cancelled_manual'          -- Cancelado manualmente por admin
))

-- Cancelación
cancellation_reason TEXT
  -- Razón de cancelación (obligatoria si cancelled)

cancelled_at TIMESTAMP WITH TIME ZONE
  -- Cuándo se canceló

forfeited_at TIMESTAMP WITH TIME ZONE
  -- Cuándo se marcó como perdido
```

**Campos que se mantienen de la tabla actual:**
- `id`, `product_id`, `customer_name`, `customer_email`, `customer_phone`
- `created_at`, `updated_at`, `completed_at`
- `layaway_token`, `notes`, `cancelled_by`
- `order_id`

**Total de campos nuevos:** 15

---

### Tabla: `layaway_payments` (Nueva)

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relación con apartado
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  -- Identificación del pago
  payment_number INTEGER NOT NULL,
    -- 1, 2, 3... (orden del pago)
  
  -- Montos
  amount_due NUMERIC(10, 2) NOT NULL,
    -- Monto esperado
  
  amount_paid NUMERIC(10, 2),
    -- Monto realmente pagado (null si no pagado)
  
  -- Fechas
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Cuándo debe pagarse
  
  paid_at TIMESTAMP WITH TIME ZONE,
    -- Cuándo se pagó realmente
  
  -- Estado
  status TEXT NOT NULL CHECK (status IN (
    'pending',     -- Pendiente de pago
    'paid',        -- Pagado exitosamente
    'overdue',     -- Vencido sin pagar
    'cancelled',   -- Cancelado (apartado cancelado manual)
    'forfeited'    -- Perdido (apartado forfeited)
  )) DEFAULT 'pending',
  
  -- Stripe
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Tipo de pago
  payment_type TEXT CHECK (payment_type IN (
    'first',       -- Primer pago
    'installment', -- Cuota intermedia
    'final',       -- Última cuota
    'extra'        -- Pago extra/adelantado
  )),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);
```

**Total de campos:** 12

---

## 4. ESTADOS PROPUESTOS

### Estados de `layaways.status`

| Estado | Descripción | Trigger | Producto |
|--------|-------------|---------|----------|
| `pending_first_payment` | Apartado creado, esperando primer pago | Manual (crear apartado) | - |
| `active` | Primer pago confirmado, apartado activo | Webhook (primer pago) | `reserved` |
| `overdue` | Tiene pagos atrasados | Cron (pagos vencidos) | `reserved` |
| `completed` | 100% pagado + orden creada | Webhook (último pago) | `sold` |
| `expired` | Plan vencido sin liquidar | Cron (plan_end_date) | `available` |
| `forfeited` | Perdido por incumplimiento | Cron o Admin | `available` |
| `cancelled_for_non_payment` | Cancelado por 6 semanas sin abono | Cron (6 semanas) | `available` |
| `cancelled_manual` | Cancelado por admin | Admin | `available`* |

**Nota:** `available` con asterisco = Admin decide si liberar producto o no.

---

### Estados de `layaway_payments.status`

| Estado | Descripción | Trigger |
|--------|-------------|---------|
| `pending` | Pendiente de pago (aún no vence o próximo a vencer) | Default |
| `paid` | Pagado exitosamente ✅ | Webhook |
| `overdue` | Vencido sin pagar ⚠️ | Cron (due_date < today) |
| `cancelled` | Cancelado (apartado cancelado manual) | Admin |
| `forfeited` | Perdido (apartado forfeited/cancelled_for_non_payment) | Cron |

---

### Flujo de Estados de Apartado

```
pending_first_payment → active → completed ✅
                          ↓         ↓
                       overdue   expired ❌
                          ↓
                    cancelled_for_non_payment ❌
                          ↓
                      forfeited ❌
                          ↓
                    cancelled_manual ❌
```

---

## 5. MANEJO DE ATRASOS

### Regla: Marcar Pagos Vencidos

**Trigger:** Cron diario (00:01 AM)

**Condición:**
```sql
due_date < CURRENT_DATE
AND status = 'pending'
```

**Acción:**
1. Marcar pago como `overdue`
2. Marcar apartado como `overdue` (si tiene al menos 1 pago overdue)

**Implementación:**
```sql
-- Marcar pagos vencidos
UPDATE layaway_payments
SET status = 'overdue'
WHERE status = 'pending'
AND due_date < CURRENT_DATE;

-- Marcar apartados con pagos vencidos
UPDATE layaways
SET status = 'overdue'
WHERE id IN (
  SELECT DISTINCT layaway_id
  FROM layaway_payments
  WHERE status = 'overdue'
)
AND status = 'active';
```

---

### Regla: Incrementar Contador de Semanas sin Abono

**Trigger:** Cron semanal (Lunes 00:00 AM)

**Condición:**
```sql
last_payment_at < (CURRENT_DATE - INTERVAL '7 days')
OR (last_payment_at IS NULL AND created_at < (CURRENT_DATE - INTERVAL '7 days'))
```

**Acción:**
```sql
UPDATE layaways
SET consecutive_weeks_without_payment = consecutive_weeks_without_payment + 1
WHERE (
  last_payment_at < (CURRENT_DATE - INTERVAL '7 days')
  OR (last_payment_at IS NULL AND created_at < (CURRENT_DATE - INTERVAL '7 days'))
)
AND status IN ('active', 'overdue', 'pending_first_payment');
```

**Resetear contador cuando hay pago:**
```sql
-- En webhook cuando pago confirmado
UPDATE layaways
SET consecutive_weeks_without_payment = 0,
    last_payment_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

---

## 6. CANCELACIÓN POR 6 SEMANAS SIN ABONO

### OPCIÓN A — Automática Completa ⚡

**Descripción:**
El cron detecta 6 semanas sin abono y ejecuta cancelación completa automáticamente sin intervención humana.

**Trigger:** Cron diario (01:00 AM)

**Condición:**
```sql
consecutive_weeks_without_payment >= 6
AND status IN ('active', 'overdue', 'pending_first_payment')
```

**Acción:**
```sql
-- 1. Marcar apartado como cancelado
UPDATE layaways
SET status = 'cancelled_for_non_payment',
    cancelled_at = CURRENT_TIMESTAMP,
    cancelled_by = 'system',
    cancellation_reason = '6 semanas consecutivas sin abono'
WHERE consecutive_weeks_without_payment >= 6
AND status IN ('active', 'overdue', 'pending_first_payment');

-- 2. Marcar pagos pendientes como forfeited
UPDATE layaway_payments
SET status = 'forfeited'
WHERE layaway_id IN (
  SELECT id FROM layaways
  WHERE status = 'cancelled_for_non_payment'
)
AND status IN ('pending', 'overdue');

-- 3. Liberar producto automáticamente
UPDATE products
SET status = 'available',
    stock = 1
WHERE id IN (
  SELECT product_id FROM layaways
  WHERE status = 'cancelled_for_non_payment'
);

-- 4. Registrar en audit log
INSERT INTO audit_logs (event_type, entity_type, entity_id, details, created_at)
SELECT 
  'layaway_auto_cancelled',
  'layaway',
  id,
  jsonb_build_object(
    'reason', '6 semanas sin abono',
    'consecutive_weeks', consecutive_weeks_without_payment,
    'last_payment_at', last_payment_at
  ),
  CURRENT_TIMESTAMP
FROM layaways
WHERE status = 'cancelled_for_non_payment';

-- 5. Enviar email (via trigger o aplicación)
-- (implementar en código de aplicación)
```

**Pros:**
- ✅ Totalmente automático
- ✅ No requiere intervención admin
- ✅ Consistente con política oficial
- ✅ Libera inventario rápidamente
- ✅ Menos trabajo manual

**Contras:**
- ❌ Sin revisión humana
- ❌ Riesgo de error técnico (ej: fallo en webhook, pago en tránsito)
- ❌ Difícil revertir si fue error
- ❌ Cliente puede reclamar si hubo malentendido

**Riesgos:**
- 🔴 **Alto:** Cancelación incorrecta por fallo técnico
- 🟡 **Medio:** Cliente reclama, requiere reactivación manual
- 🟢 **Bajo:** Impacto reputacional si cliente comparte experiencia negativa

---

### OPCIÓN B — Automática con Revisión Admin 🛡️

**Descripción:**
El cron detecta 6 semanas sin abono pero NO cancela automáticamente. Solo marca el apartado para revisión admin. Admin confirma antes de liberar producto.

**Trigger:** Cron diario (01:00 AM)

**Condición:**
```sql
consecutive_weeks_without_payment >= 6
AND status IN ('active', 'overdue', 'pending_first_payment')
```

**Acción (Paso 1 - Automático):**
```sql
-- 1. Marcar apartado para revisión (nuevo estado temporal)
UPDATE layaways
SET status = 'forfeiture_pending',  -- Nuevo estado
    updated_at = CURRENT_TIMESTAMP
WHERE consecutive_weeks_without_payment >= 6
AND status IN ('active', 'overdue', 'pending_first_payment');

-- 2. Notificar a admin (crear alerta)
INSERT INTO admin_alerts (alert_type, entity_type, entity_id, message, created_at)
SELECT 
  'layaway_forfeiture_pending',
  'layaway',
  id,
  'Apartado con 6 semanas sin abono - Requiere revisión',
  CURRENT_TIMESTAMP
FROM layaways
WHERE status = 'forfeiture_pending';

-- 3. Enviar email a admin
-- (implementar notificación)

-- 4. NO liberar producto todavía
-- (producto sigue como 'reserved')
```

**Acción (Paso 2 - Manual por Admin):**

**Admin revisa el apartado y decide:**

**Opción 2A: Confirmar cancelación**
```sql
-- Admin confirma cancelación
UPDATE layaways
SET status = 'cancelled_for_non_payment',
    cancelled_at = CURRENT_TIMESTAMP,
    cancelled_by = 'admin_user_id',
    cancellation_reason = '6 semanas sin abono - Confirmado por admin'
WHERE id = $1;

-- Marcar pagos como forfeited
UPDATE layaway_payments
SET status = 'forfeited'
WHERE layaway_id = $1
AND status IN ('pending', 'overdue');

-- Liberar producto
UPDATE products
SET status = 'available',
    stock = 1
WHERE id = (SELECT product_id FROM layaways WHERE id = $1);
```

**Opción 2B: Reactivar apartado (excepción)**
```sql
-- Admin decide dar extensión
UPDATE layaways
SET status = 'active',
    consecutive_weeks_without_payment = 0,  -- Reset contador
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- Registrar razón de excepción
INSERT INTO audit_logs (event_type, entity_type, entity_id, details, created_by)
VALUES (
  'layaway_forfeiture_reverted',
  'layaway',
  $1,
  jsonb_build_object('reason', 'Cliente contactó - Situación excepcional'),
  'admin_user_id'
);
```

**Opción 2C: Extender plazo (dar más tiempo)**
```sql
-- Admin extiende próxima fecha de pago
UPDATE layaway_payments
SET due_date = due_date + INTERVAL '7 days'
WHERE layaway_id = $1
AND status = 'overdue'
ORDER BY payment_number ASC
LIMIT 1;

-- Reactivar apartado
UPDATE layaways
SET status = 'active',
    consecutive_weeks_without_payment = consecutive_weeks_without_payment - 1,  -- Reducir contador
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

**Pros:**
- ✅ Revisión humana antes de cancelar
- ✅ Reduce riesgo de error técnico
- ✅ Permite excepciones justificadas
- ✅ Admin puede contactar cliente antes
- ✅ Mejor experiencia cliente (oportunidad de explicar)
- ✅ Más seguro para MVP

**Contras:**
- ❌ Requiere trabajo manual admin
- ❌ Producto reservado más tiempo
- ❌ Alertas admin pueden acumularse
- ❌ Admin debe revisar diariamente

**Riesgos:**
- 🟢 **Bajo:** Cancelación incorrecta (admin revisa primero)
- 🟡 **Medio:** Admin se olvida de revisar → apartados acumulados en `forfeiture_pending`
- 🟢 **Bajo:** Impacto reputacional (cliente tuvo oportunidad de explicar)

---

### RECOMENDACIÓN: Opción B (Automática con Revisión Admin)

**Razón:**

**Para MVP, Opción B es más segura porque:**

1. ✅ **Reduce riesgo de error técnico**
   - Pago en tránsito no confirmado
   - Fallo en webhook
   - Cliente pagó pero sistema no actualizó

2. ✅ **Permite excepciones justificadas**
   - Emergencia familiar
   - Problema bancario temporal
   - Cliente leal con historial bueno

3. ✅ **Mejor experiencia cliente**
   - Admin puede contactar ANTES de cancelar
   - Cliente tiene oportunidad de explicar
   - Evita cancelaciones injustas

4. ✅ **Menos conflictos**
   - Cliente no puede reclamar que fue injusto
   - Admin tiene contexto completo
   - Decisión documentada

5. ✅ **Control de calidad**
   - Admin verifica que contador es correcto
   - Admin verifica que no hay pagos en tránsito
   - Admin verifica que cliente no contactó recientemente

**En producción futura:**
- Cuando sistema esté estable (6-12 meses)
- Cuando hayamos validado que contadores funcionan bien
- Cuando tengamos confianza en webhooks
- **ENTONCES** considerar migrar a Opción A (Automática completa)

**Implementación sugerida para MVP:**

```javascript
// Cron diario - Detectar apartados para revisión
async function detectForfeiture() {
  const layaways = await db.query(`
    SELECT * FROM layaways
    WHERE consecutive_weeks_without_payment >= 6
    AND status IN ('active', 'overdue', 'pending_first_payment')
  `)
  
  for (const layaway of layaways) {
    // Marcar para revisión
    await db.query(`
      UPDATE layaways
      SET status = 'forfeiture_pending'
      WHERE id = $1
    `, [layaway.id])
    
    // Crear alerta para admin
    await db.query(`
      INSERT INTO admin_alerts (alert_type, entity_id, message)
      VALUES ('layaway_forfeiture_pending', $1, $2)
    `, [layaway.id, `Apartado ${layaway.layaway_token} con 6 semanas sin abono`])
    
    // Enviar email a admin
    await sendEmail({
      to: 'admin@bagclue.com',
      subject: `⚠️ Apartado requiere revisión - 6 semanas sin abono`,
      body: `Cliente: ${layaway.customer_name}
             Producto: ${product.name}
             Último pago: ${layaway.last_payment_at}
             Semanas sin abono: ${layaway.consecutive_weeks_without_payment}
             
             Acciones:
             1. Contactar cliente
             2. Confirmar cancelación
             3. Extender plazo
             
             Link: https://bagclue.com/admin/layaways/${layaway.id}`
    })
  }
  
  console.log(`[CRON] ${layaways.length} apartados marcados para revisión`)
}
```

---

## 7. SQL PRELIMINAR (SOLO PROPUESTA - NO EJECUTAR)

### Migración 020: Actualizar tabla `layaways`

```sql
-- ⚠️ NO EJECUTAR - SOLO PROPUESTA

-- Agregar columnas nuevas
ALTER TABLE layaways
ADD COLUMN plan_type TEXT CHECK (plan_type IN ('contado', '4weeks', '8weeks', '18weeks')),
ADD COLUMN total_payments INTEGER,
ADD COLUMN first_payment_amount NUMERIC(10, 2),
ADD COLUMN total_amount NUMERIC(10, 2),
ADD COLUMN amount_paid NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN amount_remaining NUMERIC(10, 2),
ADD COLUMN payments_completed INTEGER DEFAULT 0,
ADD COLUMN payments_remaining INTEGER,
ADD COLUMN next_payment_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_payment_amount NUMERIC(10, 2),
ADD COLUMN plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN consecutive_weeks_without_payment INTEGER DEFAULT 0,
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN forfeited_at TIMESTAMP WITH TIME ZONE;

-- Actualizar constraint de status
ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;
ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN (
    'pending_first_payment',
    'active',
    'overdue',
    'completed',
    'expired',
    'forfeited',
    'cancelled_for_non_payment',
    'cancelled_manual',
    'forfeiture_pending'  -- Solo para Opción B
  ));

-- Crear índices
CREATE INDEX idx_layaways_status ON layaways(status);
CREATE INDEX idx_layaways_plan_end_date ON layaways(plan_end_date);
CREATE INDEX idx_layaways_last_payment_at ON layaways(last_payment_at);
CREATE INDEX idx_layaways_consecutive_weeks ON layaways(consecutive_weeks_without_payment);
```

---

### Migración 021: Crear tabla `layaway_payments`

```sql
-- ⚠️ NO EJECUTAR - SOLO PROPUESTA

CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  payment_number INTEGER NOT NULL,
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2),
  
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'paid',
    'overdue',
    'cancelled',
    'forfeited'
  )) DEFAULT 'pending',
  
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  payment_type TEXT CHECK (payment_type IN (
    'first',
    'installment',
    'final',
    'extra'
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);
```

---

### Migración 022: Crear tabla `admin_alerts` (Para Opción B)

```sql
-- ⚠️ NO EJECUTAR - SOLO PROPUESTA

CREATE TABLE admin_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  alert_type TEXT NOT NULL,  -- 'layaway_forfeiture_pending', etc.
  entity_type TEXT,           -- 'layaway', 'order', etc.
  entity_id UUID,
  
  message TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_alerts_status ON admin_alerts(status);
CREATE INDEX idx_admin_alerts_alert_type ON admin_alerts(alert_type);
CREATE INDEX idx_admin_alerts_created_at ON admin_alerts(created_at);
```

---

## 8. STRIPE - RECOMENDACIÓN MVP

### Mantener: Stripe Checkout por Cada Pago ✅

**Razón:**
- Reutiliza infraestructura existente
- Simple de implementar
- No requiere guardar payment methods
- Cliente controla cuándo pagar
- Flexible (puede pagar saldo completo en cualquier momento)

**Flow:**

1. Cliente hace click "Pagar siguiente cuota"
2. API crea Stripe Checkout Session
3. Metadata incluye:
   - `layaway_id`
   - `payment_id`
   - `payment_number`
   - `payment_type`
4. Webhook reconcilia usando metadata
5. Actualiza `layaway_payments` → `paid`
6. Actualiza `layaways` (amount_paid, payments_completed, etc.)
7. Si último pago → crear orden final

**Webhook metadata:**
```javascript
{
  layaway_id: 'uuid-123',
  payment_id: 'uuid-456',
  payment_number: 3,
  payment_type: 'installment'
}
```

**Webhook handler:**
```javascript
case 'checkout.session.completed':
  const { layaway_id, payment_id, payment_number, payment_type } = session.metadata
  
  // Idempotencia
  const payment = await getPayment(payment_id)
  if (payment.status === 'paid') {
    return res.status(200).send('OK - already processed')
  }
  
  // Marcar pago como paid
  await updatePayment(payment_id, {
    status: 'paid',
    amount_paid: payment.amount_due,
    paid_at: new Date(),
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent
  })
  
  // Actualizar apartado
  const layaway = await getLayaway(layaway_id)
  await updateLayaway(layaway_id, {
    amount_paid: layaway.amount_paid + payment.amount_due,
    amount_remaining: layaway.amount_remaining - payment.amount_due,
    payments_completed: layaway.payments_completed + 1,
    payments_remaining: layaway.payments_remaining - 1,
    last_payment_at: new Date(),
    consecutive_weeks_without_payment: 0  // Reset contador
  })
  
  // Si primer pago → activar apartado + reservar producto
  if (payment_number === 1) {
    await updateLayaway(layaway_id, { status: 'active' })
    await updateProduct(layaway.product_id, { status: 'reserved' })
  }
  
  // Si último pago → completar apartado
  if (layaway.payments_completed === layaway.total_payments) {
    await completeLayaway(layaway_id)
  }
```

**NO implementar todavía:**
- ❌ Auto-pagos recurrentes (Stripe Subscriptions)
- ❌ Guardar payment methods
- ❌ Cargos automáticos semanales

**Razón:** Agregan complejidad innecesaria para MVP.

---

## 9. ADMIN - VISTA PROPUESTA

### Dashboard Apartados (`/admin/layaways`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Gestión de Apartados                                        [+ Crear manual] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Alertas:                                                                     │
│ ⚠️ 3 apartados requieren revisión (6 semanas sin abono)                     │
│ ❌ 5 apartados con pagos vencidos                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Filtros: Estado [Todos ▼] | Plan [Todos ▼] | Buscar: [________]            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Cliente    │ Producto  │ Plan │ Pagados │ Vencidos │ Sin Abono │ Final   │  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Ana García │ Birkin 30 │ 8w   │ 2/8     │ 0        │ 0 sem     │ 19 Jun  │✅│
│ María L.   │ Chanel    │ 18w  │ 5/18    │ 1        │ 0 sem     │ 25 Ago  │⚠️│
│ Sofia T.   │ LV Speedy │ 4w   │ 1/4     │ 2        │ 3 sem     │ Vencido │❌│
│ Laura P.   │ Gucci     │ 8w   │ 0/8     │ 0        │ 6 sem     │ 12 Jul  │🚫│
└──────────────────────────────────────────────────────────────────────────────┘

🚫 = Requiere revisión (forfeiture_pending)
```

---

### Detalle Apartado Admin (`/admin/layaways/[id]`)

#### Información General
```
Cliente: Ana García (ana@example.com, +52 55 1234 5678)
Producto: Hermès Birkin 30 Gold ($450,000)
Estado producto: 🔒 Reservado

Plan: 8 pagos semanales
Creado: 01 May 2026
Fecha final del plan: 19 Jun 2026
Último abono: 08 May 2026 (hace 1 día)

Estado: ✅ Activo
```

#### Resumen de Pagos
```
Total: $450,000
Pagado: $192,857.14 (42.9%)
Pendiente: $257,142.86

Pagos realizados: 2 / 8
Pagos pendientes: 6
Pagos vencidos: 0

Semanas sin abono: 0
```

#### Calendario
```
✅ Pago 1: $150,000 — Pagado 01 May 2026 (Stripe)
✅ Pago 2: $42,857 — Pagado 08 May 2026 (Stripe)
📅 Pago 3: $42,857 — Vence 15 May 2026 (en 6 días)
⏳ Pago 4: $42,857 — Vence 22 May 2026
...
```

#### Acciones Admin
```
[📧 Contactar cliente]
[💳 Registrar pago manual]
[📅 Extender fecha]
[❌ Cancelar manualmente]
[🔓 Liberar producto]
[📜 Ver historial completo]
```

---

### Vista: Apartados para Revisión (`/admin/layaways/forfeiture-review`)

**Para Opción B:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Apartados Requieren Revisión - 6 Semanas sin Abono                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ Laura Pérez - Gucci Belt ($8,500)                                        ││
│ │ Plan: 8 pagos semanales | Pagado: 0/8                                   ││
│ │ Último abono: Nunca (solo primer pago esperado)                         ││
│ │ Creado: 15 Mar 2026 (hace 47 días / ~7 semanas)                         ││
│ │ Semanas sin abono: 6                                                     ││
│ │                                                                          ││
│ │ [📞 Contactar cliente]                                                   ││
│ │ [✅ Confirmar cancelación] [🔄 Reactivar] [⏰ Extender plazo]          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ Carmen Ruiz - Prada Bag ($12,000)                                        ││
│ │ Plan: 4 pagos semanales | Pagado: 1/4                                   ││
│ │ Último abono: 20 Mar 2026 (hace 42 días / 6 semanas)                    ││
│ │ Semanas sin abono: 6                                                     ││
│ │                                                                          ││
│ │ [📞 Contactar cliente]                                                   ││
│ │ [✅ Confirmar cancelación] [🔄 Reactivar] [⏰ Extender plazo]          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. RIESGOS TÉCNICOS

### Riesgo 1: Contador de Semanas Incorrecto

**Problema:**
- Webhook falla
- `last_payment_at` no se actualiza
- Contador incrementa incorrectamente
- Apartado marcado para cancelación aunque cliente pagó

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Opción B (revisión admin antes de cancelar)
- Logs exhaustivos de webhooks
- Script de auditoría diario: verificar `last_payment_at` vs pagos en `layaway_payments`
- Alert si contador > 4 semanas pero hay pagos recientes

---

### Riesgo 2: Webhook Duplicado

**Problema:**
- Stripe envía webhook 2+ veces
- Pago marcado múltiples veces
- `amount_paid` incorrecto

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Idempotencia obligatoria: verificar `payment.status === 'paid'` antes de procesar
- Guardar `stripe_payment_intent_id` y verificar duplicados
- Tests de webhook duplicado

---

### Riesgo 3: Plan Vencido con Pago en Tránsito

**Problema:**
- `plan_end_date` = 19 Jun 23:59
- Cliente paga última cuota 19 Jun 23:55
- Webhook confirma 20 Jun 00:05
- Cron ya marcó como `expired`

**Probabilidad:** Baja  
**Impacto:** Alto  
**Mitigación:**
- Período de gracia 24h después de `plan_end_date`
- Verificar checkout sessions activos antes de marcar expired
- `plan_end_date` debe ser fin del día (23:59:59) no inicio

---

### Riesgo 4: Producto Liberado Prematuramente

**Problema:**
- Apartado cancelado
- Producto liberado a `available`
- Otra clienta lo compra
- Primera clienta reclama (pagó tarde, estaba en tránsito)

**Probabilidad:** Baja-Media  
**Impacto:** Alto  
**Mitigación:**
- Opción B: Admin confirma antes de liberar
- Período de gracia 48h antes de liberar (apartado cancelled pero producto `reserved`)
- Email inmediato a cliente cuando se cancela
- Log completo de cancelaciones

---

### Riesgo 5: Redondeo de Decimales

**Problema:**
- `installment_amount = remaining_balance / remaining_payments`
- Decimales (ej: $42,857.14)
- `sum(payments.amount_due) ≠ total_amount` por centavos

**Probabilidad:** Alta  
**Impacto:** Bajo  
**Mitigación:**
- Ajustar última cuota para compensar redondeos:
```javascript
const installment_base = Math.round((remaining_balance / remaining_payments) * 100) / 100
const total_installments = installment_base * remaining_payments
const rounding_diff = remaining_balance - total_installments
const last_installment = installment_base + rounding_diff
```
- Validación: `sum(amount_due) === total_amount`

---

### Riesgo 6: Admin Olvida Revisar Alertas

**Problema (Solo Opción B):**
- Apartados en `forfeiture_pending` se acumulan
- Admin no revisa
- Producto queda `reserved` indefinidamente

**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- Email diario a admin con resumen de alertas
- Dashboard destacado con contador de alertas pendientes
- Timeout: si `forfeiture_pending` > 7 días → auto-cancelar
- Métricas: alertas promedio por semana

---

### Riesgo 7: Cliente Paga con Email Diferente

**Problema:**
- Apartado creado con email A
- Cliente paga con email B en Stripe
- Webhook no encuentra apartado

**Probabilidad:** Baja  
**Impacto:** Medio  
**Mitigación:**
- Usar metadata (layaway_id, payment_id) NO email
- Webhook reconcilia por metadata siempre
- Si metadata falta → crear alerta admin para reconciliación manual
- Panel admin "Pagos sin asignar"

---

## 11. CONFIRMACIÓN FINAL

### ❌ NO SE IMPLEMENTÓ NADA

**Verificado:**
- ❌ Código → NO modificado
- ❌ Base de datos → NO modificada
- ❌ Stripe → NO configurado
- ❌ Checkout → NO tocado
- ❌ Webhook → NO modificado
- ❌ Admin → NO modificado
- ❌ SQL → NO ejecutado
- ❌ Migraciones → NO aplicadas
- ❌ Deploy → NO realizado

**Solo documentación:**
- ✅ Políticas oficiales documentadas
- ✅ Simulaciones completas ($450k)
- ✅ Modelo de datos propuesto
- ✅ Estados definidos
- ✅ Manejo de atrasos
- ✅ Dos opciones para cancelación automática
- ✅ SQL preliminar (solo propuesta)
- ✅ Riesgos identificados
- ✅ Recomendación: Opción B

---

## 12. RESUMEN EJECUTIVO

### Políticas Oficiales ✅
8 políticas estrictas documentadas

### Simulaciones ✅
7 simulaciones con producto $450,000 MXN:
- Contado
- 4 pagos (mínimo + mayor)
- 8 pagos (mínimo + mayor)
- 18 pagos (mínimo + mayor)

### Modelo de Datos ✅
- `layaways`: 15 campos nuevos
- `layaway_payments`: 12 campos (tabla nueva)
- `admin_alerts`: Opcional (solo para Opción B)

### Estados ✅
- Apartados: 8 estados (+ 1 opcional para Opción B)
- Pagos: 5 estados

### Manejo de Atrasos ✅
- Cron diario: marcar vencidos
- Cron semanal: incrementar contador semanas sin abono

### Cancelación por 6 Semanas ✅
- **Opción A:** Automática completa (más rápida, más riesgo)
- **Opción B:** Automática con revisión admin (más segura, más trabajo)
- **Recomendación:** **Opción B para MVP**

### Stripe ✅
- Checkout por cada pago
- Metadata para reconciliación
- Webhook idempotente
- NO auto-pagos recurrentes

### Admin ✅
- Vista lista con alertas
- Vista detalle con acciones
- Vista apartados para revisión (Opción B)
- Historial completo

### SQL Preliminar ✅
- 3 migraciones propuestas (NO ejecutadas)

### Riesgos ✅
- 7 riesgos identificados con mitigaciones

---

## 13. PRÓXIMOS PASOS

1. ⏳ Jhonatan revisa este documento
2. ⏳ Jhonatan decide: Opción A o Opción B
3. ⏳ Jhonatan confirma modelo de datos
4. ⏳ Jhonatan aprueba inicio de implementación

**Cuando apruebes:**
- 🚀 Kepler ejecuta migraciones
- 🚀 Kepler implementa Fases 5C.2-5C.6
- 🚀 Kepler despliega a producción

---

**Documento generado:** 2026-05-01 19:00 UTC  
**Autor:** Kepler  
**Status:** ✅ LISTO PARA DECISIÓN FINAL

**Esperando aprobación de Jhonatan.**
