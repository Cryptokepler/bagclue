# RESUMEN EJECUTIVO - Sistema de Apartado con Planes de Pago

**Fecha:** 2026-05-01 18:30 UTC  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ✅ DISEÑO COMPLETO - NO IMPLEMENTADO

---

## ⚠️ CONFIRMACIÓN IMPORTANTE

### ❌ NO SE IMPLEMENTÓ NADA

**Confirmación absoluta:**
- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó checkout
- ❌ NO se tocó webhook
- ❌ NO se tocó admin
- ❌ NO se tocó ningún archivo operativo

**Solo se actualizó:**
- ✅ Documentación de diseño (BAGCLUE_LAYAWAY_PAYMENT_PLANS.md)
- ✅ Este resumen ejecutivo (APARTADO_RESUMEN_EJECUTIVO.md)

---

## 1. NUEVA LÓGICA OFICIAL

### Cambio Principal

**Antes:**
- Sistema simple: depósito 20% + saldo final en 15 días
- Solo 2 pagos
- Sin flexibilidad

**Después:**
- Sistema de planes con cuotas semanales
- Primer pago flexible (cliente puede pagar MÁS del mínimo)
- Sistema recalcula cuotas restantes automáticamente
- Simulador obligatorio antes de confirmar

### Planes Oficiales Bagclue

#### 1. Pago de Contado
- **Pagos totales:** 1 (100% hoy)
- **Primer pago:** 100% del precio
- **Cuotas restantes:** 0
- **Duración:** Inmediato

#### 2. 4 Pagos Semanales
- **Definición:** Pago #1 hoy + 3 pagos semanales restantes
- **Pagos totales:** 4
- **Primer pago mínimo:** 25% del precio
- **Duración:** 3 semanas (21 días)

#### 3. 8 Pagos Semanales
- **Definición:** Pago #1 hoy + 7 pagos semanales restantes
- **Pagos totales:** 8
- **Primer pago mínimo:** 12.5% del precio
- **Duración:** 7 semanas (49 días)

#### 4. 18 Pagos Semanales
- **Definición:** Pago #1 hoy + 17 pagos semanales restantes
- **Pagos totales:** 18
- **Primer pago mínimo:** 5.56% del precio
- **Duración:** 17 semanas (119 días / ~4 meses)

### Innovación Clave: Primer Pago Flexible

**La clienta puede pagar MÁS del mínimo requerido:**

**Ventajas:**
1. ✅ Cuotas restantes más pequeñas
2. ✅ Menos semanas de compromiso
3. ✅ Menor riesgo para Bagclue
4. ✅ Cliente siente control sobre su plan

**Ejemplo:**
```
Producto: $450,000 MXN
Plan: 8 pagos semanales
Primer pago mínimo: $56,250 (12.5%)

Opción A: Cliente paga el mínimo
→ Primer pago: $56,250
→ Cuotas restantes: 7 x $56,250

Opción B: Cliente paga más ($150,000)
→ Primer pago: $150,000 ⬆️
→ Cuotas restantes: 7 x $42,857.14 ⬇️
   (¡$13,392.86 menos por semana!)
```

### Fórmula de Cálculo

```javascript
// Inputs
total_amount = precio_producto
plan_type = 'contado' | '4weeks' | '8weeks' | '18weeks'
first_payment_input = cantidad_elegida_por_cliente

// Configuración por plan
total_payments = { contado: 1, 4weeks: 4, 8weeks: 8, 18weeks: 18 }[plan_type]
first_payment_min_percent = { contado: 100, 4weeks: 25, 8weeks: 12.5, 18weeks: 5.56 }[plan_type]

// Cálculos
first_payment_min = (total_amount * first_payment_min_percent) / 100
first_payment_amount = Math.max(first_payment_input, first_payment_min)
remaining_balance = total_amount - first_payment_amount
remaining_payments = total_payments - 1
installment_amount = remaining_payments > 0 ? remaining_balance / remaining_payments : 0

// Calendario
payment_schedule = []
for (i = 0; i < total_payments; i++) {
  payment_schedule.push({
    payment_number: i + 1,
    amount: i === 0 ? first_payment_amount : installment_amount,
    due_date: hoy + (i * 7 días),
    status: i === 0 ? 'paid' : 'scheduled'
  })
}
```

---

## 2. EJEMPLOS DE SIMULACIÓN - PRODUCTO $450,000 MXN

### Ejemplo 1: Pago de Contado

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: Pago de contado
- Primer pago: $450,000 (100%)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   Pago de contado

3. Primer pago mínimo requerido:
   $450,000 (100%)

4. Primer pago elegido por ti:
   $450,000

5. Saldo restante después del primer pago:
   $0

6. Número de cuotas restantes:
   0 (pago único)

7. Monto de cada cuota restante:
   No aplica

8. Fechas de vencimiento:
   • Pago 1: 01 May 2026 (hoy) — $450,000 ✅

9. Fecha final estimada:
   01 May 2026 (hoy)

10. Política del apartado:
    ✅ El pago completo reserva el producto
    📦 Envío inmediato tras confirmación
    ⚠️ Pago NO reembolsable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 2: 4 Pagos Semanales (Mínimo)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 4 pagos semanales
- Primer pago: $112,500 (25% - mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   4 pagos semanales

3. Primer pago mínimo requerido:
   $112,500 (25%)

4. Primer pago elegido por ti:
   $112,500 💰

5. Saldo restante después del primer pago:
   $337,500

6. Número de cuotas restantes:
   3 pagos semanales

7. Monto de cada cuota restante:
   $112,500 por semana

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $112,500 ✅
   • Pago 2: 08 May 2026 — $112,500
   • Pago 3: 15 May 2026 — $112,500
   • Pago 4: 22 May 2026 — $112,500

9. Fecha final estimada del apartado:
   22 Mayo 2026 (en 21 días / 3 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 3: 4 Pagos Semanales (Con Primer Pago Mayor)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 4 pagos semanales
- Primer pago: $200,000 (44.4% - MAYOR que mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   4 pagos semanales

3. Primer pago mínimo requerido:
   $112,500 (25%)

4. Primer pago elegido por ti:
   $200,000 💰 ⬆️ (44.4% del total)

5. Saldo restante después del primer pago:
   $250,000

6. Número de cuotas restantes:
   3 pagos semanales

7. Monto de cada cuota restante:
   $83,333.33 por semana ⬇️
   (¡$29,166.67 menos por semana que el mínimo!)

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $200,000 ✅
   • Pago 2: 08 May 2026 — $83,333.33
   • Pago 3: 15 May 2026 — $83,333.33
   • Pago 4: 22 May 2026 — $83,333.33

9. Fecha final estimada del apartado:
   22 Mayo 2026 (en 21 días / 3 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 4: 8 Pagos Semanales (Mínimo)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 8 pagos semanales
- Primer pago: $56,250 (12.5% - mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   8 pagos semanales

3. Primer pago mínimo requerido:
   $56,250 (12.5%)

4. Primer pago elegido por ti:
   $56,250 💰

5. Saldo restante después del primer pago:
   $393,750

6. Número de cuotas restantes:
   7 pagos semanales

7. Monto de cada cuota restante:
   $56,250 por semana

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $56,250 ✅
   • Pago 2: 08 May 2026 — $56,250
   • Pago 3: 15 May 2026 — $56,250
   • Pago 4: 22 May 2026 — $56,250
   • Pago 5: 29 May 2026 — $56,250
   • Pago 6: 05 Jun 2026 — $56,250
   • Pago 7: 12 Jun 2026 — $56,250
   • Pago 8: 19 Jun 2026 — $56,250

9. Fecha final estimada del apartado:
   19 Junio 2026 (en 49 días / 7 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 5: 8 Pagos Semanales (Con Primer Pago Mayor)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 8 pagos semanales
- Primer pago: $150,000 (33.3% - MAYOR que mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   8 pagos semanales

3. Primer pago mínimo requerido:
   $56,250 (12.5%)

4. Primer pago elegido por ti:
   $150,000 💰 ⬆️ (33.3% del total)

5. Saldo restante después del primer pago:
   $300,000

6. Número de cuotas restantes:
   7 pagos semanales

7. Monto de cada cuota restante:
   $42,857.14 por semana ⬇️
   (¡$13,392.86 menos por semana que el mínimo!)

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $150,000 ✅
   • Pago 2: 08 May 2026 — $42,857.14
   • Pago 3: 15 May 2026 — $42,857.14
   • Pago 4: 22 May 2026 — $42,857.14
   • Pago 5: 29 May 2026 — $42,857.14
   • Pago 6: 05 Jun 2026 — $42,857.14
   • Pago 7: 12 Jun 2026 — $42,857.14
   • Pago 8: 19 Jun 2026 — $42,857.14

9. Fecha final estimada del apartado:
   19 Junio 2026 (en 49 días / 7 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 6: 18 Pagos Semanales (Mínimo)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 18 pagos semanales
- Primer pago: $25,000 (5.56% - mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   18 pagos semanales

3. Primer pago mínimo requerido:
   $25,000 (5.56%)

4. Primer pago elegido por ti:
   $25,000 💰

5. Saldo restante después del primer pago:
   $425,000

6. Número de cuotas restantes:
   17 pagos semanales

7. Monto de cada cuota restante:
   $25,000 por semana

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $25,000 ✅
   • Pago 2: 08 May 2026 — $25,000
   • Pago 3: 15 May 2026 — $25,000
   ...
   • Pago 17: 18 Ago 2026 — $25,000
   • Pago 18: 25 Ago 2026 — $25,000

9. Fecha final estimada del apartado:
   25 Agosto 2026 (en 119 días / ~4 meses / 17 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Ejemplo 7: 18 Pagos Semanales (Con Primer Pago Mayor)

**Inputs:**
- Producto: Hermès Birkin 30 Gold
- Precio: $450,000 MXN
- Plan: 18 pagos semanales
- Primer pago: $100,000 (22.2% - MAYOR que mínimo)

**Simulación:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE TU APARTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Precio total del producto:
   $450,000 MXN

2. Plan seleccionado:
   18 pagos semanales

3. Primer pago mínimo requerido:
   $25,000 (5.56%)

4. Primer pago elegido por ti:
   $100,000 💰 ⬆️ (22.2% del total)

5. Saldo restante después del primer pago:
   $350,000

6. Número de cuotas restantes:
   17 pagos semanales

7. Monto de cada cuota restante:
   $20,588.24 por semana ⬇️
   (¡$4,411.76 menos por semana que el mínimo!)

8. Fechas de vencimiento de cada pago:
   • Pago 1: 01 May 2026 (hoy) — $100,000 ✅
   • Pago 2: 08 May 2026 — $20,588.24
   • Pago 3: 15 May 2026 — $20,588.24
   ...
   • Pago 17: 18 Ago 2026 — $20,588.24
   • Pago 18: 25 Ago 2026 — $20,588.24

9. Fecha final estimada del apartado:
   25 Agosto 2026 (en 119 días / ~4 meses / 17 semanas)

10. Política del apartado:
    ✅ El primer pago reserva el producto
    ⚠️ El primer pago NO es reembolsable
    🔒 Producto queda reservado al confirmar
    📦 Envío solo cuando apartado 100% pagado
    ⏰ Bagclue decide en caso de atraso (7d gracia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. PROPUESTA DE CAMPOS NECESARIOS

### Tabla: `layaways` (Campos Nuevos)

**Obligatorios para el nuevo sistema:**

```sql
-- Plan seleccionado
plan_type TEXT NOT NULL 
  CHECK (plan_type IN ('contado', '4weeks', '8weeks', '18weeks'))

-- Configuración del plan
total_payments INTEGER NOT NULL
  -- 1, 4, 8, o 18

first_payment_amount NUMERIC(10, 2) NOT NULL
  -- Primer pago realizado (puede ser > mínimo)

first_payment_min NUMERIC(10, 2) NOT NULL
  -- Primer pago mínimo requerido por el plan

installment_amount NUMERIC(10, 2)
  -- Monto de cada cuota restante (null si contado)

payment_frequency TEXT DEFAULT 'weekly'
  -- Frecuencia (siempre semanal por ahora)

-- Tracking de pagos
payments_completed INTEGER DEFAULT 0
  -- Cuotas pagadas

payments_remaining INTEGER
  -- Cuotas pendientes

next_payment_due_date TIMESTAMP WITH TIME ZONE
  -- Próxima fecha de pago

next_payment_amount NUMERIC(10, 2)
  -- Monto de próximo pago

-- Montos
total_amount NUMERIC(10, 2) NOT NULL
  -- Precio total del producto

amount_paid NUMERIC(10, 2) DEFAULT 0
  -- Total pagado hasta ahora

amount_remaining NUMERIC(10, 2)
  -- Saldo pendiente

-- Fechas del plan
plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()

plan_end_date TIMESTAMP WITH TIME ZONE
  -- Fecha límite estimada (último pago)

last_payment_date TIMESTAMP WITH TIME ZONE
  -- Fecha del último pago realizado

-- Estado del plan
is_on_schedule BOOLEAN DEFAULT TRUE
  -- Si está al corriente

days_overdue INTEGER DEFAULT 0
  -- Días de atraso acumulados
```

**Total de campos nuevos:** 17

**Campos actuales que se mantienen:**
- `id`, `product_id`, `customer_name`, `customer_email`, `customer_phone`
- `status`, `created_at`, `cancelled_at`, `completed_at`
- `layaway_token`, `notes`, `cancelled_by`, `cancellation_reason`
- `order_id`

**Campos actuales deprecados (mantener por compatibilidad):**
- `deposit_percent`, `deposit_amount`, `balance_amount`
- `deposit_session_id`, `deposit_payment_intent_id`, `deposit_paid_at`
- `balance_session_id`, `balance_payment_intent_id`, `balance_paid_at`
- `expires_at` (usar `plan_end_date`)

---

### Nueva Tabla: `layaway_payments`

**Propósito:** Registrar cada pago del plan

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relación con apartado
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  -- Identificación del pago
  payment_number INTEGER NOT NULL,
    -- 1, 2, 3... (orden del pago)
  
  payment_type TEXT DEFAULT 'installment' 
    CHECK (payment_type IN ('first', 'installment', 'final', 'extra')),
  
  -- Montos
  amount_due NUMERIC(10, 2) NOT NULL,
    -- Monto esperado
  
  amount_paid NUMERIC(10, 2),
    -- Monto realmente pagado
  
  -- Fechas
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Cuándo debe pagarse
  
  paid_at TIMESTAMP WITH TIME ZONE,
    -- Cuándo se pagó realmente
  
  -- Stripe
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_url TEXT,
  
  -- Estado
  status TEXT NOT NULL 
    CHECK (status IN ('scheduled', 'pending', 'paid', 'failed', 'overdue', 'cancelled', 'refunded', 'waived'))
    DEFAULT 'scheduled',
  
  -- Tracking
  payment_method TEXT,
    -- 'stripe', 'manual', 'transfer', 'cash'
  
  processed_by TEXT,
    -- 'customer', 'admin'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);
```

**Total de campos:** 18

---

### Resumen de Cambios en DB

| Tabla | Acción | Campos |
|-------|--------|--------|
| `layaways` | Agregar columnas | +17 nuevos |
| `layaways` | Deprecar (mantener) | 9 antiguos |
| `layaway_payments` | Crear tabla nueva | 18 campos |

**Total de cambios:** 1 migración para `layaways` + 1 migración para `layaway_payments`

---

## 4. RIESGOS DETECTADOS

### 🔴 RIESGO ALTO

#### 1. Producto Reservado Largo Tiempo

**Descripción:**
- Plan 18 semanas = 4.2 meses con producto bloqueado
- Producto no disponible para otros compradores
- Inventario bloqueado sin venta completa

**Impacto:**
- ⚠️ Pérdida de ventas potenciales
- ⚠️ Inventario reducido artificialmente
- ⚠️ Riesgo si cliente abandona

**Mitigación:**
1. Límite de 2 apartados activos por cliente
2. Depósito inicial más alto en planes largos (ej: 10% en 18 semanas vs 5.56%)
3. Política clara de cancelación por mora
4. Auto-cancelación si >2 cuotas atrasadas
5. Admin puede liberar producto si necesario

**Probabilidad:** Alta  
**Impacto en negocio:** Alto  
**Prioridad de mitigación:** ⚠️ CRÍTICA

---

#### 2. Reconciliación de Pagos

**Descripción:**
- Pagos manuales (transferencia, efectivo) no pasan por Stripe
- Saldo puede no reflejar realidad si admin no registra correctamente
- Cliente muestra adeudo aunque pagó

**Impacto:**
- ⚠️ Conflictos con clientes
- ⚠️ Saldos incorrectos
- ⚠️ Confianza dañada

**Mitigación:**
1. Botón admin "Registrar pago manual" con validación
2. Requiere confirmación (monto, fecha, método, nota)
3. Auditlog de todos los pagos manuales
4. Notificación automática a cliente cuando admin registra pago
5. Script de auditoría diario: `sum(payments.amount_paid) === layaway.amount_paid`

**Probabilidad:** Media  
**Impacto en negocio:** Alto  
**Prioridad de mitigación:** ⚠️ ALTA

---

### 🟡 RIESGO MEDIO

#### 3. Pagos Parciales Fallidos

**Descripción:**
- Cliente intenta pagar pero falla (tarjeta rechazada, fondos insuficientes)
- Cuota queda como `failed`
- Estado del apartado incierto

**Impacto:**
- Cliente atrasado sin querer
- Frustración
- Admin debe intervenir

**Mitigación:**
1. Permitir múltiples intentos de pago
2. Email/notificación automática si falla
3. Período de gracia de 3 días antes de marcar `overdue`
4. Botón "Reintentar pago" en panel cliente
5. Link directo al checkout en email

**Probabilidad:** Media  
**Impacto en negocio:** Medio  
**Prioridad de mitigación:** MEDIA

---

#### 4. Webhook Duplicado

**Descripción:**
- Stripe envía webhook 2+ veces (retry automático)
- Pago marcado múltiples veces
- Saldo incorrecto

**Impacto:**
- Saldo puede ser negativo
- Apartado completado prematuramente
- Datos corruptos

**Mitigación:**
1. Idempotencia: verificar si `payment_id` ya está marcado como `paid`
2. Guardar `stripe_payment_intent_id` y verificar duplicados
3. Logs de webhook para auditoría
4. Tests de webhook duplicado

**Probabilidad:** Media  
**Impacto en negocio:** Medio  
**Prioridad de mitigación:** MEDIA

---

#### 5. Cliente Paga con Email Diferente

**Descripción:**
- Apartado creado con email A
- Cliente paga con email B en Stripe

**Impacto:**
- Reconciliación manual
- Pago no se asocia automáticamente
- Admin debe intervenir

**Mitigación:**
1. Usar `metadata` en Stripe con `layaway_id` y `payment_id`
2. Webhook reconcilia por metadata, NO por email
3. Si webhook falla, alerta a admin para revisión manual
4. Panel admin con "pagos sin asignar" para reconciliar

**Probabilidad:** Baja-Media  
**Impacto en negocio:** Medio  
**Prioridad de mitigación:** MEDIA

---

### 🟢 RIESGO BAJO

#### 6. Vencimientos No Automatizados

**Descripción:**
- Apartados vencen pero no se marcan automáticamente
- Estado incorrecto
- Producto sigue reservado innecesariamente

**Impacto:**
- Inventario bloqueado innecesariamente
- Estado desactualizado

**Mitigación:**
1. Cron job diario: revisar apartados con cuotas >7 días overdue
2. Auto-marcar como `expired`
3. Email a cliente notificando cancelación
4. Admin puede reactivar si cliente contacta

**Probabilidad:** Baja  
**Impacto en negocio:** Bajo  
**Prioridad de mitigación:** BAJA

---

#### 7. Saldo Incorrecto por Bug

**Descripción:**
- Bug en cálculo de saldo (`amount_paid`, `amount_remaining`)
- Cliente paga de más o de menos
- Apartado completado sin pagar total

**Impacto:**
- Pérdida financiera
- Conflicto con cliente

**Mitigación:**
1. Validación en cada pago: `sum(payments.amount_paid) === layaway.amount_paid`
2. Tests unitarios de cálculo de saldo
3. Admin dashboard con alertas de inconsistencias
4. Script de auditoría semanal

**Probabilidad:** Baja  
**Impacto en negocio:** Medio  
**Prioridad de mitigación:** MEDIA

---

### Resumen de Riesgos

| Riesgo | Nivel | Probabilidad | Impacto | Prioridad |
|--------|-------|--------------|---------|-----------|
| Producto reservado largo tiempo | 🔴 Alto | Alta | Alto | CRÍTICA |
| Reconciliación de pagos | 🔴 Alto | Media | Alto | ALTA |
| Pagos parciales fallidos | 🟡 Medio | Media | Medio | MEDIA |
| Webhook duplicado | 🟡 Medio | Media | Medio | MEDIA |
| Email diferente | 🟡 Medio | Baja-Media | Medio | MEDIA |
| Vencimientos no automatizados | 🟢 Bajo | Baja | Bajo | BAJA |
| Saldo incorrecto | 🟢 Bajo | Baja | Medio | MEDIA |

---

## 5. RECOMENDACIÓN MVP

### Alcance Mínimo Viable (MVP)

**Objetivo:** Implementar sistema funcional de apartados con planes de pago que permita validar el modelo de negocio sin sobre-ingeniería.

### Fases Incluidas en MVP

#### Fase 5C.2 — Modelo de Datos (1 día)
- ✅ Migración 018: Agregar columnas a `layaways`
- ✅ Migración 019: Crear tabla `layaway_payments`
- ✅ Actualizar types TypeScript
- ✅ Crear índices
- ✅ Agregar constraints

**Entregable:** Base de datos lista para soportar planes de pago

---

#### Fase 5C.3 — Panel Cliente (2 días)
- ✅ `/account/layaways` - Lista de apartados
- ✅ `/account/layaways/[id]` - Detalle completo
- ✅ RLS policies para `layaways` y `layaway_payments`
- ✅ Componentes UI:
  - LayawayCard
  - LayawayDetail
  - PaymentCalendar
  - PaymentHistory

**Entregable:** Cliente puede ver sus apartados y calendario

---

#### Fase 5C.4 — Pagar Cuotas (2 días)
- ✅ API `/api/layaways/[id]/pay-next` - Pagar siguiente cuota
- ✅ API `/api/layaways/[id]/pay-full` - Pagar saldo completo
- ✅ Integración Stripe checkout
- ✅ Webhook actualizado para pagos parciales
- ✅ Success page `/layaway/success`

**Entregable:** Cliente puede pagar cuotas desde el panel

---

#### Fase 5C.5 — Admin de Apartados (2 días)
- ✅ `/admin/layaways` - Lista con filtros
- ✅ `/admin/layaways/[id]` - Detalle + acciones
- ✅ Registrar pago manual
- ✅ Extender plazo
- ✅ Cancelar apartado
- ✅ Notas internas
- ✅ Historial de cambios

**Entregable:** Admin puede gestionar apartados completamente

---

#### Fase 5C.6 — Vencimientos y Automatización (1 día)
- ✅ Cron job diario: revisar apartados overdue
- ✅ Auto-marcar `expired` si >7 días atraso
- ✅ Email automático a cliente
- ✅ Admin puede reactivar apartado expirado
- ✅ Script de auditoría de saldos

**Entregable:** Sistema auto-gestiona vencimientos

---

### Fases EXCLUIDAS del MVP

#### ❌ Fase 5C.7 — Crear Apartado desde Admin
**Razón:** MVP se enfoca en gestionar apartados, no en crearlos desde la web  
**Workaround:** Admin puede crear apartados manualmente cuando cliente contacta por Instagram  
**Cuándo implementar:** Después de validar que el sistema de pagos funciona bien

---

#### ❌ Fase 5C.8 — Crear Apartado desde Producto
**Razón:** MVP se enfoca en gestionar apartados, no en crearlos desde la web  
**Workaround:** Admin crea apartados manualmente  
**Cuándo implementar:** Después de validar modelo de negocio completo

---

#### ❌ Auto-Pagos Recurrentes (Stripe Subscriptions)
**Razón:** Agrega complejidad (guardar payment method, manejar retries, etc.)  
**Workaround:** Cliente paga manualmente cada semana  
**Cuándo implementar:** Si clientes lo solicitan frecuentemente

---

#### ❌ Modificar Plan en Curso
**Razón:** Complejo (recalcular cuotas, ajustar calendario, qué pasa con lo pagado)  
**Workaround:** Admin puede cancelar y crear nuevo apartado si cliente lo solicita  
**Cuándo implementar:** Después de MVP validado

---

### Tiempo Estimado

**Total MVP:** 8 días de desarrollo

| Fase | Duración | Complejidad |
|------|----------|-------------|
| 5C.2 - Modelo de datos | 1 día | Media |
| 5C.3 - Panel cliente | 2 días | Media |
| 5C.4 - Pagar cuotas | 2 días | Alta |
| 5C.5 - Admin | 2 días | Media |
| 5C.6 - Vencimientos | 1 día | Baja |
| **TOTAL** | **8 días** | - |

**No incluye:**
- Fase 5C.1 (este documento - ya completado)
- Testing exhaustivo (agregar 1-2 días)
- Deploy y validación (agregar 0.5 días)

**Estimado real con buffer:** 9-10 días

---

### Stack Técnico

**Base de datos:**
- PostgreSQL 15+ (Supabase)
- pgvector (ya instalado)
- Migraciones 018-019

**Backend:**
- Next.js 15 API Routes
- Supabase Admin SDK
- Stripe SDK v14+
- Webhook con idempotencia

**Frontend:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- Componentes reutilizables

**Integraciones:**
- Stripe Checkout
- Stripe Webhooks
- Email (Resend o similar)
- Cron (OpenClaw o Vercel Cron)

---

### Criterios de Éxito MVP

**Técnicos:**
1. ✅ Build exitoso sin errores
2. ✅ Migraciones aplicadas correctamente
3. ✅ RLS policies funcionan (cliente solo ve sus apartados)
4. ✅ Pagos de cuotas actualizan saldos correctamente
5. ✅ Webhook no duplica pagos (idempotencia)
6. ✅ Último pago completa apartado y crea orden

**Funcionales:**
1. ✅ Cliente puede ver sus apartados
2. ✅ Cliente puede pagar cuota individual
3. ✅ Cliente puede pagar saldo completo
4. ✅ Admin puede registrar pagos manuales
5. ✅ Admin puede extender plazos
6. ✅ Admin puede cancelar apartados
7. ✅ Cron marca vencidos automáticamente

**Negocio:**
1. ✅ Producto se reserva al primer pago
2. ✅ Producto se libera al cancelar (si admin elige)
3. ✅ Orden final se crea al completar
4. ✅ Cliente recibe confirmaciones por email
5. ✅ No hay pagos duplicados
6. ✅ Saldos siempre correctos

---

### Riesgos Aceptados en MVP

**Aceptamos:**
- ✅ Cliente debe pagar manualmente cada semana (no auto-pago)
- ✅ Admin crea apartados manualmente (no UI cliente todavía)
- ✅ Reembolsos manuales
- ✅ Notificaciones solo por email (no WhatsApp automático)

**No aceptamos:**
- ❌ Saldos incorrectos → Tests + auditoría obligatoria
- ❌ Webhook duplicado → Idempotencia obligatoria
- ❌ Pagos sin reconciliar → Metadata + admin dashboard obligatorio

---

### Siguiente Paso: Aprobación

**Pendiente:**

1. ⏳ Jhonatan revisa este resumen ejecutivo
2. ⏳ Jhonatan confirma políticas de negocio:
   - Primer pago mínimo por plan (25%, 12.5%, 5.56%)
   - 0% interés confirmado
   - Días de gracia (3 días)
   - Auto-cancelación (7 días)
   - Primer pago NO reembolsable
   - Límites por cliente (2 apartados activos)
3. ⏳ Jhonatan aprueba inicio de implementación

**Cuando apruebes:**
- 🚀 Kepler inicia Fase 5C.2 (modelo de datos)
- 🚀 Commit diario con progreso
- 🚀 Deploy incremental a Vercel preview
- 🚀 Validación paso a paso

---

## 6. DOCUMENTOS GENERADOS

### Documentación Completa

1. **BAGCLUE_LAYAWAY_PAYMENT_PLANS.md** (40KB)
   - Diseño técnico completo
   - UX Cliente detallada
   - UX Admin detallada
   - Modelo de datos
   - Flujos técnicos
   - Estados del sistema
   - Integraciones Stripe
   - Políticas de negocio

2. **APARTADO_RESUMEN_EJECUTIVO.md** (este archivo)
   - Resumen de lógica oficial
   - 7 ejemplos de simulación ($450k)
   - Propuesta de campos
   - Riesgos identificados
   - Recomendación MVP
   - Confirmación de NO implementación

**Total de documentación:** ~60KB

---

## ✅ CONFIRMACIÓN FINAL

### NO SE IMPLEMENTÓ NADA

**Verificado:**
- ❌ Código → NO modificado
- ❌ Base de datos → NO modificada
- ❌ Stripe → NO configurado
- ❌ Checkout → NO tocado
- ❌ Webhook → NO modificado
- ❌ Admin → NO modificado
- ❌ Deploy → NO realizado

**Solo documentación:**
- ✅ Diseño técnico completo
- ✅ Resumen ejecutivo
- ✅ Ejemplos de simulación
- ✅ Propuesta de campos
- ✅ Análisis de riesgos
- ✅ Plan MVP

---

## 📊 ESTADO DEL PROYECTO

**Fase actual:** 5C.1 - Diseño y documentación ✅ COMPLETADO

**Pendiente:** Aprobación para iniciar Fase 5C.2

**Bloqueadores:** Ninguno técnico (esperando aprobación de negocio)

**Riesgo general:** 🟡 MEDIO (manejable con mitigaciones propuestas)

**Recomendación:** ✅ PROCEDER CON MVP

---

**Documento generado:** 2026-05-01 18:45 UTC  
**Autor:** Kepler  
**Status:** ✅ LISTO PARA REVISIÓN
