# BAGCLUE - Sistema de Apartado con Planes de Pago

**Fecha actualización:** 2026-05-01 18:50 UTC  
**Status:** DISEÑO ACTUALIZADO CON POLÍTICAS OFICIALES (NO IMPLEMENTADO)  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce de Lujo

---

## ⚠️ IMPORTANTE - NO IMPLEMENTAR TODAVÍA

**Este documento contiene las políticas oficiales reales de Bagclue.**

**NO implementar todavía. NO tocar código. NO tocar base de datos. NO tocar Stripe. NO tocar checkout. NO tocar webhook. NO tocar admin. NO avanzar con migraciones.**

**Solo diseño y documentación.**

---

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Actualizar el sistema de apartado de Bagclue para soportar planes de pago por plazos con las políticas comerciales oficiales del negocio.

**Planes oficiales Bagclue:**
1. **Pago de contado** (1 pago completo hoy)
2. **Apartado en 4 pagos semanales** (pago #1 hoy + 3 pagos semanales restantes)
3. **Apartado en 8 pagos semanales** (pago #1 hoy + 7 pagos semanales restantes)
4. **Apartado en 18 pagos semanales** (pago #1 hoy + 17 pagos semanales restantes)

**Estado actual:** Sistema de apartado con modelo simple (depósito 20% + saldo final en 15 días)

**Cambio requerido:** Migrar a sistema de cuotas semanales con políticas estrictas de cumplimiento

**Complejidad:** Media-Alta

**Riesgo:** Medio (requiere nueva tabla + lógica de pagos parciales + políticas estrictas + automatización de cancelaciones)

---

## 1. POLÍTICA OFICIAL BAGCLUE — APARTADOS / PAGOS SEMANALES

### Principios del Sistema

**Bagclue trabaja con planes de pagos semanales bajo un sistema de compromiso y confianza.**

**Razón:** Cada pieza apartada deja de ofrecerse a otras clientas. Por eso las políticas son estrictas y claras.

---

### Opciones de Compra

1. **Pago de contado** (sin compromiso de cuotas)
2. **Apartado en 4 pagos semanales**
3. **Apartado en 8 pagos semanales**
4. **Apartado en 18 pagos semanales**

---

### Definición de Planes

- **4 pagos semanales** = pago #1 hoy + 3 pagos semanales restantes
- **8 pagos semanales** = pago #1 hoy + 7 pagos semanales restantes
- **18 pagos semanales** = pago #1 hoy + 17 pagos semanales restantes

**La clienta puede dar un primer pago mayor al mínimo.**

**El sistema recalcula automáticamente:**
- Saldo restante
- Pagos restantes
- Monto de cada cuota restante
- Fechas de vencimiento
- Fecha final del plan

---

### POLÍTICAS OFICIALES (No negociables)

#### 1. Puntualidad Obligatoria

**El apartado se mantiene activo únicamente si los pagos se realizan de forma puntual.**

- Cada pago tiene fecha de vencimiento (due_date)
- Si vence y no se paga → marca `overdue`
- Si pasan **6 semanas consecutivas sin ningún abono** → cancelación automática

---

#### 2. Liquidación Completa al Finalizar el Plan

**Si al finalizar el plazo del plan no se ha liquidado el total, el apartado se pierde.**

- Fecha final del plan = última cuota programada
- Si `amount_paid < total_amount` en la fecha final → apartado se marca como `forfeited` (perdido)
- La pieza vuelve a estar disponible para venta
- Los pagos realizados **NO son reembolsables**

---

#### 3. No Cambio de Artículo

**El apartado no puede cambiarse por otro artículo.**

- El `product_id` no puede modificarse después de crear el apartado
- Si la clienta quiere otra pieza → debe crearse un nuevo apartado
- El apartado anterior se cancela (sin reembolso)

---

#### 4. No Cancelaciones ni Devoluciones Automáticas

**No se manejan cancelaciones ni devoluciones automáticas.**

- Los pagos realizados **NO son reembolsables** salvo decisión manual excepcional de Bagclue
- No hay botón de "cancelar apartado" para el cliente
- Si el cliente quiere cancelar → debe contactar a Bagclue
- Admin decide caso por caso si procede algún reembolso (excepcional)

---

#### 5. Pagos No Reembolsables

**Los pagos realizados no son reembolsables, salvo decisión manual excepcional de Bagclue.**

- El primer pago NO es reembolsable
- Los pagos parciales NO son reembolsables
- Si el apartado se cancela por incumplimiento → sin reembolso
- Si el apartado se pierde al finalizar el plan → sin reembolso
- Excepción: Admin puede decidir reembolso manual en casos excepcionales (ej: producto dañado, error de Bagclue)

---

#### 6. Cancelación por 6 Semanas sin Abono

**Si durante 6 semanas consecutivas no se recibe ningún abono, el plan se cancela automáticamente.**

- 6 semanas = 42 días
- Cuenta desde la última fecha de pago confirmado (último `paid_at`)
- Cancelación automática por sistema (cron job)
- Estado: `cancelled_for_non_payment` o `forfeited`
- Notificación por email a la clienta
- La pieza vuelve a estar disponible

---

#### 7. Producto Vuelve a Disponible

**Cuando el plan se cancela por incumplimiento, la pieza vuelve a estar disponible para la venta.**

- Producto pasa de `reserved` → `available`
- Stock vuelve a aparecer en catálogo público
- Otra clienta puede comprarla de contado o apartarla

---

#### 8. Sistema de Compromiso y Confianza

**Bagclue trabaja bajo un sistema de compromiso y confianza, porque cada pieza apartada deja de ofrecerse a otras clientas.**

- Las políticas estrictas protegen el inventario de Bagclue
- Garantizan que solo clientes comprometidas aparten piezas
- Evitan acaparamiento especulativo
- Aseguran flujo de ventas

---

## 2. REGLAS TÉCNICAS A IMPLEMENTAR

### Regla 1: Producto Reservado

**El producto pasa a `reserved` cuando el primer pago está confirmado como `paid`.**

```javascript
// Webhook: checkout.session.completed
if (payment_number === 1 && payment.status === 'paid') {
  await updateProduct(layaway.product_id, { status: 'reserved' })
}
```

---

### Regla 2: Apartado Activo

**El apartado queda `active` después del primer pago confirmado.**

```javascript
// Webhook: checkout.session.completed
if (payment_number === 1 && payment.status === 'paid') {
  await updateLayaway(layaway_id, { 
    status: 'active',
    payments_completed: 1,
    amount_paid: first_payment_amount
  })
}
```

Antes del primer pago: `status: 'pending'`  
Después del primer pago: `status: 'active'`

---

### Regla 3: Registro de Pagos

**Cada pago semanal debe quedar registrado en `layaway_payments`.**

**Campos obligatorios:**
- `payment_number` - Orden del pago (1, 2, 3...)
- `amount_due` - Monto esperado
- `due_date` - Fecha de vencimiento
- `status` - Estado del pago

**Estados de pago:**
- `pending` - Vence pronto o checkout abierto (0-7 días)
- `paid` - Pagado exitosamente ✅
- `overdue` - Venció sin pagar ⚠️
- `cancelled` - Cancelado (apartado cancelado)
- `forfeited` - Perdido por incumplimiento ❌

---

### Regla 4: Manejo de Atrasos

**Si una cuota vence y no se paga, marcarla como `overdue`.**

```javascript
// Cron job diario
const today = new Date()
const overduePayments = await db.query(`
  SELECT * FROM layaway_payments
  WHERE status = 'pending'
  AND due_date < $1
`, [today])

for (const payment of overduePayments) {
  await updatePayment(payment.id, { status: 'overdue' })
  await updateLayaway(payment.layaway_id, { is_on_schedule: false })
}
```

**Si pasan 6 semanas consecutivas sin ningún abono:**

```javascript
// Cron job diario - Detectar 6 semanas sin abono
const sixWeeksAgo = new Date()
sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)

const layawaysToCancel = await db.query(`
  SELECT * FROM layaways
  WHERE status IN ('active', 'pending_payment')
  AND (
    last_payment_date < $1
    OR (last_payment_date IS NULL AND created_at < $1)
  )
`, [sixWeeksAgo])

for (const layaway of layawaysToCancel) {
  await cancelLayawayForNonPayment(layaway.id)
}
```

**Función de cancelación:**
```javascript
async function cancelLayawayForNonPayment(layaway_id) {
  const layaway = await getLayaway(layaway_id)
  
  // 1. Marcar apartado como cancelado
  await updateLayaway(layaway_id, {
    status: 'cancelled_for_non_payment',  // o 'forfeited'
    cancelled_at: new Date(),
    cancelled_by: 'system',
    cancellation_reason: '6 semanas sin abono'
  })
  
  // 2. Marcar pagos pendientes como forfeited
  await db.query(`
    UPDATE layaway_payments
    SET status = 'forfeited'
    WHERE layaway_id = $1
    AND status IN ('pending', 'overdue')
  `, [layaway_id])
  
  // 3. Liberar producto
  await updateProduct(layaway.product_id, { 
    status: 'available',
    stock: 1  // Vuelve a estar disponible
  })
  
  // 4. Enviar email a clienta
  await sendEmail({
    to: layaway.customer_email,
    subject: 'Apartado cancelado - 6 semanas sin abono',
    body: `Tu apartado ha sido cancelado por falta de pago durante 6 semanas...`
  })
}
```

---

### Regla 5: Final del Plan sin Liquidar

**Si llega la fecha final del plan y `amount_paid < total_amount`, el apartado se marca como `forfeited` (perdido).**

```javascript
// Cron job diario - Detectar planes vencidos no liquidados
const today = new Date()

const expiredLayaways = await db.query(`
  SELECT * FROM layaways
  WHERE status IN ('active', 'pending_payment')
  AND plan_end_date < $1
  AND amount_paid < total_amount
`, [today])

for (const layaway of expiredLayaways) {
  await forfeitLayaway(layaway.id)
}
```

**Función forfeit:**
```javascript
async function forfeitLayaway(layaway_id) {
  const layaway = await getLayaway(layaway_id)
  
  // 1. Marcar apartado como perdido
  await updateLayaway(layaway_id, {
    status: 'forfeited',
    cancelled_at: new Date(),
    cancelled_by: 'system',
    cancellation_reason: 'Plan finalizado sin liquidar total'
  })
  
  // 2. Marcar pagos pendientes como forfeited
  await db.query(`
    UPDATE layaway_payments
    SET status = 'forfeited'
    WHERE layaway_id = $1
    AND status IN ('pending', 'overdue')
  `, [layaway_id])
  
  // 3. Liberar producto
  await updateProduct(layaway.product_id, { 
    status: 'available',
    stock: 1
  })
  
  // 4. Enviar email
  await sendEmail({
    to: layaway.customer_email,
    subject: 'Apartado perdido - Plan finalizado',
    body: `Tu plan de apartado ha finalizado sin completar el pago total. Los pagos realizados no son reembolsables...`
  })
}
```

**La pieza vuelve a estar disponible para venta.**

---

### Regla 6: Orden Final Solo si Liquidado

**Solo se crea orden final cuando `amount_paid >= total_amount`.**

```javascript
// Webhook o función de pago
if (layaway.amount_paid >= layaway.total_amount) {
  // Crear orden final
  const order = await createOrderFromLayaway(layaway_id)
  
  // Marcar apartado como completado
  await updateLayaway(layaway_id, {
    status: 'completed',
    completed_at: new Date(),
    order_id: order.id
  })
  
  // Producto pasa de reserved a sold
  await updateProduct(layaway.product_id, {
    status: 'sold',
    stock: 0
  })
}
```

**El envío solo ocurre cuando el apartado está 100% pagado.**

---

### Regla 7: No Cambio de Artículo

**Un apartado no puede cambiar `product_id` después de creado.**

```javascript
// Validación en API de actualización
async function updateLayaway(layaway_id, updates) {
  if ('product_id' in updates) {
    throw new Error('No se permite cambiar el artículo del apartado')
  }
  
  // Resto de la actualización...
}
```

**Si la clienta quiere otra pieza:**
- Admin debe cancelar apartado actual (manual)
- Admin crea nuevo apartado con nueva pieza
- Apartado anterior queda como `cancelled` (sin reembolso)

---

### Regla 8: No Devoluciones Automáticas

**No implementar refunds automáticos.**

- No hay API endpoint de reembolso automático
- No hay botón de "solicitar reembolso" en panel cliente
- Cualquier excepción debe ser manual desde admin en fase futura

**Si se implementa refund manual en admin:**
- Requiere confirmación doble
- Requiere razón obligatoria
- Requiere aprobación de nivel superior
- Registra en audit log
- Procesa manualmente en Stripe Dashboard

---

## 3. ESTADOS DEL APARTADO

### Estados en `layaways.status`

```sql
status TEXT CHECK (status IN (
  'pending',                    -- Apartado creado, esperando primer pago
  'active',                     -- Primer pago realizado, apartado activo
  'pending_payment',            -- Tiene cuota próxima a vencer (1-3 días)
  'overdue',                    -- Tiene cuota(s) atrasada(s)
  'paid',                       -- Todas las cuotas pagadas, esperando envío
  'completed',                  -- Completado (orden final creada + producto enviado)
  'forfeited',                  -- Perdido por incumplimiento (vencido o sin liquidar)
  'cancelled_for_non_payment',  -- Cancelado por 6 semanas sin abono
  'cancelled'                   -- Cancelado manualmente por admin/cliente (raro)
))
```

**Diagrama de flujo:**
```
pending → active → paid → completed ✅
   ↓        ↓       ↓
cancelled  overdue  forfeited ❌
           ↓
        cancelled_for_non_payment ❌
```

---

### Estados en `layaway_payments.status`

```sql
status TEXT CHECK (status IN (
  'scheduled',  -- Programado, aún no vence (>7 días)
  'pending',    -- Vence pronto (0-7 días) o checkout abierto
  'paid',       -- Pagado exitosamente ✅
  'failed',     -- Intento de pago falló
  'overdue',    -- Venció sin pagar (>0 días atraso)
  'cancelled',  -- Cancelado (apartado cancelado manualmente)
  'forfeited'   -- Perdido (apartado perdido por incumplimiento)
))
```

**Nota:** NO hay estado `refunded` ni `waived` porque no se manejan reembolsos automáticos.

---

### Descripción de Estados Críticos

#### `forfeited` (Apartado Perdido)

**Cuándo se aplica:**
- Plan finalizado sin liquidar total (`amount_paid < total_amount` en `plan_end_date`)
- Sistema lo marca automáticamente

**Consecuencias:**
- Pieza vuelve a `available`
- Pagos realizados NO se reembolsan
- Email automático a clienta

---

#### `cancelled_for_non_payment` (Cancelado por 6 Semanas sin Abono)

**Cuándo se aplica:**
- 6 semanas consecutivas (42 días) sin ningún abono
- Sistema lo marca automáticamente

**Consecuencias:**
- Pieza vuelve a `available`
- Pagos realizados NO se reembolsan
- Email automático a clienta

---

#### `cancelled` (Cancelado Manual)

**Cuándo se aplica:**
- Admin cancela manualmente por solicitud de cliente
- Admin cancela por razones excepcionales (ej: producto dañado)

**Consecuencias:**
- Pieza vuelve a `available` (si admin lo configura)
- Reembolso solo si admin lo procesa manualmente
- Requiere razón obligatoria

---

## 4. SIMULADOR OBLIGATORIO

**La clienta DEBE ver una simulación completa antes de confirmar el apartado.**

### 11 Puntos Obligatorios del Simulador

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 RESUMEN DE TU APARTADO                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Producto:                                                │
│    Hermès Birkin 30 Gold                                    │
│                                                             │
│ 2. Precio total:                                            │
│    $450,000 MXN                                             │
│                                                             │
│ 3. Plan seleccionado:                                       │
│    8 pagos semanales                                        │
│                                                             │
│ 4. Primer pago mínimo requerido:                            │
│    $56,250 (12.5%)                                          │
│                                                             │
│ 5. Primer pago elegido por ti:                              │
│    $150,000 💰 (33.3% del total)                           │
│                                                             │
│ 6. Saldo restante después del primer pago:                  │
│    $300,000                                                 │
│                                                             │
│ 7. Cantidad de pagos restantes:                             │
│    7 pagos semanales                                        │
│                                                             │
│ 8. Monto de cada pago restante:                             │
│    $42,857.14 por semana                                    │
│                                                             │
│ 9. Fechas exactas de vencimiento de cada pago:              │
│    • Pago 1: 01 May 2026 (hoy) — $150,000 ✅               │
│    • Pago 2: 08 May 2026 — $42,857.14                      │
│    • Pago 3: 15 May 2026 — $42,857.14                      │
│    • Pago 4: 22 May 2026 — $42,857.14                      │
│    • Pago 5: 29 May 2026 — $42,857.14                      │
│    • Pago 6: 05 Jun 2026 — $42,857.14                      │
│    • Pago 7: 12 Jun 2026 — $42,857.14                      │
│    • Pago 8: 19 Jun 2026 — $42,857.14                      │
│                                                             │
│ 10. Fecha final del plan:                                   │
│     19 Junio 2026 (en 49 días / 7 semanas)                 │
│                                                             │
│ 11. POLÍTICA VISIBLE (OBLIGATORIA):                         │
│                                                             │
│     ⚠️ CONDICIONES DEL APARTADO:                            │
│                                                             │
│     ✅ Pagos semanales puntuales:                           │
│        Debes pagar cada cuota en la fecha indicada.        │
│                                                             │
│     🔒 No cambios de artículo:                              │
│        Esta pieza NO puede cambiarse por otra.             │
│                                                             │
│     ❌ No cancelaciones ni devoluciones:                    │
│        Los pagos realizados NO son reembolsables.          │
│                                                             │
│     ⏰ Si no liquidas al finalizar el plan:                 │
│        Pierdes el apartado y los pagos realizados.         │
│                                                             │
│     🚫 Si pasan 6 semanas sin abono:                        │
│        El plan se cancela automáticamente.                 │
│                                                             │
│     🔓 La pieza vuelve a estar disponible:                  │
│        Si se cancela, otra clienta puede comprarla.        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [✅ Acepto las condiciones y confirmo apartado]            │
│ [🔙 Cambiar plan o monto]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** La política debe estar visible ANTES de confirmar. No en letra pequeña oculta.

---

## 5. UX PANEL CLIENTE

### Vista: Mis Apartados (`/account/layaways`)

```
┌────────────────────────────────────────────────────────────┐
│ Mis Apartados                                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 📦 Hermès Birkin 30 Gold                               ││
│ │ Plan: 8 pagos semanales | Pago 2/8                    ││
│ │                                                        ││
│ │ Total: $450,000                                        ││
│ │ Pagado: $192,857.14  (42.9%)                          ││
│ │ Pendiente: $257,142.86                                 ││
│ │                                                        ││
│ │ Próximo pago: $42,857.14 (15 May 2026 - en 6 días)   ││
│ │ Estado: ✅ Al corriente                                ││
│ │                                                        ││
│ │ [Ver detalle →]                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ⚠️ Recordatorio:                                           │
│ • Pagos puntuales obligatorios                            │
│ • Si pasan 6 semanas sin abono, se cancela el plan       │
│ • Si no liquidas al final, pierdes el apartado           │
└────────────────────────────────────────────────────────────┘
```

---

### Vista: Detalle de Apartado (`/account/layaways/[id]`)

**Secciones:**

#### A) Resumen
```
┌────────────────────────────────────────────────────────────┐
│ Resumen                                                    │
├────────────────────────────────────────────────────────────┤
│ Total del apartado:      $450,000                          │
│ Pagado hasta ahora:      $192,857.14  (42.9%)            │
│ Saldo pendiente:         $257,142.86                       │
│                                                            │
│ Pagos completados:       2 de 8                            │
│ Próximo pago:            $42,857.14 (15 May 2026)         │
│ Fecha final del plan:    19 Jun 2026                      │
│                                                            │
│ [███████████░░░░░░░░░░░] 42.9%                            │
└────────────────────────────────────────────────────────────┘
```

#### B) Calendario Completo de Pagos
```
┌────────────────────────────────────────────────────────────┐
│ Calendario de Pagos                                        │
├────────────────────────────────────────────────────────────┤
│ ✅ Pago 1: $150,000     Pagado 01 May 2026               │
│ ✅ Pago 2: $42,857.14   Pagado 08 May 2026               │
│ 📅 Pago 3: $42,857.14   Vence 15 May 2026  [Pagar ahora] │
│ ⏳ Pago 4: $42,857.14   Vence 22 May 2026                │
│ ⏳ Pago 5: $42,857.14   Vence 29 May 2026                │
│ ⏳ Pago 6: $42,857.14   Vence 05 Jun 2026                │
│ ⏳ Pago 7: $42,857.14   Vence 12 Jun 2026                │
│ ⏳ Pago 8: $42,857.14   Vence 19 Jun 2026                │
└────────────────────────────────────────────────────────────┘
```

#### C) Botones de Acción
```
┌────────────────────────────────────────────────────────────┐
│ [🔵 Pagar siguiente cuota ($42,857.14)]                   │
│ [💰 Pagar saldo completo ($257,142.86)]                   │
│ [📞 Contactar Bagclue]                                     │
└────────────────────────────────────────────────────────────┘
```

**Nota:** NO hay botón "Cancelar apartado" para el cliente. Debe contactar a Bagclue.

#### D) Política de Apartado (Recordatorio)
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Condiciones del Apartado                                │
├────────────────────────────────────────────────────────────┤
│ • Pagos semanales puntuales obligatorios                   │
│ • Sin intereses - pagas el precio exacto                   │
│ • Puedes pagar el saldo completo en cualquier momento      │
│ • Si pasan 6 semanas sin abono, el plan se cancela        │
│ • Si no liquidas al finalizar, pierdes el apartado        │
│ • Los pagos realizados NO son reembolsables                │
│ • No puedes cambiar esta pieza por otra                    │
│ • Envío solo cuando apartado esté 100% pagado             │
└────────────────────────────────────────────────────────────┘
```

---

## 6. UX ADMIN

### Vista: Lista de Apartados (`/admin/layaways`)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Gestión de Apartados                                         [+ Crear manual]        │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Filtros: Estado [Todos ▼] | Plan [Todos ▼] | Buscar: [________]                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Cliente      │ Producto       │ Plan  │ Cuotas │ Saldo      │ Próximo   │ Estado   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Ana García   │ Chanel Flap    │ 8w    │ 2/8    │ $257,142   │ 15 May    │ ✅ OK    │
│ María López  │ Birkin 30      │ 18w   │ 5/18   │ $325,000   │ 12 May    │ ⚠️ 2d    │
│ Sofia Torres │ LV Speedy      │ 4w    │ 1/4    │ $12,000    │ Vencido   │ ❌ -3d   │
│ Laura Pérez  │ Gucci Belt     │ 8w    │ 0/8    │ $8,500     │ 6 semanas │ 🚫 Cancelar│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Alertas:**
- ⚠️ Pagos próximos a vencer (2-3 días)
- ❌ Pagos vencidos
- 🚫 Apartados próximos a cancelarse por 6 semanas sin abono

---

### Vista: Detalle de Apartado Admin (`/admin/layaways/[id]`)

#### Información del Cliente
```
┌────────────────────────────────────────────────────────────┐
│ Cliente                                                    │
├────────────────────────────────────────────────────────────┤
│ Nombre: Ana García                                         │
│ Email: ana@example.com                                     │
│ Teléfono: +52 55 1234 5678                                │
│ [📧 Enviar email] [📱 WhatsApp] [☎️ Llamar]               │
└────────────────────────────────────────────────────────────┘
```

#### Información del Apartado
```
┌────────────────────────────────────────────────────────────┐
│ Apartado                                                   │
├────────────────────────────────────────────────────────────┤
│ Producto: Hermès Birkin 30 Gold                           │
│ Precio: $450,000 MXN                                       │
│ Estado producto: 🔒 Reservado                              │
│                                                            │
│ Plan elegido: 8 pagos semanales                           │
│ Primer pago: $150,000 (pagado 01 May 2026)                │
│                                                            │
│ Creado: 01 May 2026                                        │
│ Fecha final del plan: 19 Jun 2026                         │
│ Último abono: 08 May 2026 (hace 1 día)                    │
│                                                            │
│ Estado: ✅ Al corriente                                    │
└────────────────────────────────────────────────────────────┘
```

#### Resumen de Pagos
```
┌────────────────────────────────────────────────────────────┐
│ Resumen de Pagos                                           │
├────────────────────────────────────────────────────────────┤
│ Total apartado:         $450,000                           │
│ Pagado hasta ahora:     $192,857.14  (42.9%)             │
│ Saldo pendiente:        $257,142.86                        │
│                                                            │
│ Pagos completados:      2 de 8                             │
│ Pagos pendientes:       6                                  │
│ Pagos vencidos:         0                                  │
│                                                            │
│ Próxima cuota:          $42,857.14                         │
│ Próximo vencimiento:    15 May 2026 (en 6 días)           │
└────────────────────────────────────────────────────────────┘
```

#### Calendario de Pagos (Admin)
```
┌────────────────────────────────────────────────────────────┐
│ Calendario de Pagos                                        │
├────────────────────────────────────────────────────────────┤
│ ✅ Pago 1  │ $150,000     │ Pagado 01 May 2026 (Stripe)   │
│            │              │ PI: pi_abc123...               │
│                                                            │
│ ✅ Pago 2  │ $42,857.14   │ Pagado 08 May 2026 (Stripe)   │
│            │              │ PI: pi_def456...               │
│                                                            │
│ 📅 Pago 3  │ $42,857.14   │ Vence 15 May 2026 (en 6d)     │
│            │              │ [Registrar pago manual]        │
│                                                            │
│ ⏳ Pago 4  │ $42,857.14   │ Vence 22 May 2026             │
│ ⏳ Pago 5  │ $42,857.14   │ Vence 29 May 2026             │
│ ⏳ Pago 6  │ $42,857.14   │ Vence 05 Jun 2026             │
│ ⏳ Pago 7  │ $42,857.14   │ Vence 12 Jun 2026             │
│ ⏳ Pago 8  │ $42,857.14   │ Vence 19 Jun 2026             │
└────────────────────────────────────────────────────────────┘
```

#### Acciones Admin
```
┌────────────────────────────────────────────────────────────┐
│ Acciones Manuales                                          │
├────────────────────────────────────────────────────────────┤
│ [💳 Registrar pago manual]                                │
│    Registrar pago recibido por transferencia/efectivo     │
│                                                            │
│ [📅 Extender fecha de vencimiento]                        │
│    Dar más tiempo para próximo pago (gracia)             │
│                                                            │
│ [❌ Cancelar apartado]                                    │
│    Cancelar por solicitud cliente o incumplimiento       │
│                                                            │
│ [🔓 Liberar producto]                                     │
│    Marcar producto como disponible                        │
│                                                            │
│ [📞 Contactar cliente]                                    │
│    Email / WhatsApp / Llamada                             │
│                                                            │
│ [✅ Marcar como completado]                               │
│    Forzar completar apartado (todos pagos ok)            │
│                                                            │
│ [💰 Generar link de pago Stripe]                          │
│    Crear checkout y enviar link por email                │
└────────────────────────────────────────────────────────────┘
```

**Nota:** Admin puede liberar producto manualmente si necesario.

---

## 7. MODELO DE DATOS

### Tabla: `layaways` (Actualizada)

**Campos nuevos obligatorios:**

```sql
-- Plan seleccionado
plan_type TEXT NOT NULL 
  CHECK (plan_type IN ('contado', '4weeks', '8weeks', '18weeks'))

-- Configuración del plan
total_payments INTEGER NOT NULL  -- 1, 4, 8, o 18
first_payment_amount NUMERIC(10, 2) NOT NULL
first_payment_min NUMERIC(10, 2) NOT NULL
installment_amount NUMERIC(10, 2)  -- null si contado
payment_frequency TEXT DEFAULT 'weekly'

-- Tracking de pagos
payments_completed INTEGER DEFAULT 0
payments_remaining INTEGER
next_payment_due_date TIMESTAMP WITH TIME ZONE
next_payment_amount NUMERIC(10, 2)

-- Montos
total_amount NUMERIC(10, 2) NOT NULL
amount_paid NUMERIC(10, 2) DEFAULT 0
amount_remaining NUMERIC(10, 2)

-- Fechas del plan
plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
plan_end_date TIMESTAMP WITH TIME ZONE  -- Fecha límite
last_payment_date TIMESTAMP WITH TIME ZONE  -- Último abono

-- Estado del plan
is_on_schedule BOOLEAN DEFAULT TRUE
days_overdue INTEGER DEFAULT 0
weeks_without_payment INTEGER DEFAULT 0  -- Contador para regla 6 semanas
```

**Campos actuales que se mantienen:**
- `id`, `product_id`, `customer_name`, `customer_email`, `customer_phone`
- `status`, `created_at`, `cancelled_at`, `completed_at`
- `layaway_token`, `notes`, `cancelled_by`, `cancellation_reason`
- `order_id`

---

### Nueva Tabla: `layaway_payments`

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  payment_number INTEGER NOT NULL,  -- 1, 2, 3...
  payment_type TEXT DEFAULT 'installment' 
    CHECK (payment_type IN ('first', 'installment', 'final', 'extra')),
  
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2),
  
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_url TEXT,
  
  status TEXT NOT NULL 
    CHECK (status IN ('scheduled', 'pending', 'paid', 'failed', 'overdue', 'cancelled', 'forfeited'))
    DEFAULT 'scheduled',
  
  payment_method TEXT,  -- 'stripe', 'manual', 'transfer', 'cash'
  processed_by TEXT,    -- 'customer', 'admin'
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);
```

---

## 8. AUTOMATIZACIÓN - CRON JOBS

### Job 1: Marcar Pagos Vencidos (Diario)

```javascript
// Ejecutar: Todos los días a las 00:01 AM

async function markOverduePayments() {
  const today = new Date()
  
  // Marcar pagos vencidos
  await db.query(`
    UPDATE layaway_payments
    SET status = 'overdue',
        updated_at = NOW()
    WHERE status = 'pending'
    AND due_date < $1
  `, [today])
  
  // Actualizar apartados con pagos vencidos
  await db.query(`
    UPDATE layaways
    SET is_on_schedule = false,
        status = 'overdue',
        updated_at = NOW()
    WHERE id IN (
      SELECT DISTINCT layaway_id
      FROM layaway_payments
      WHERE status = 'overdue'
    )
    AND status IN ('active', 'pending_payment')
  `)
}
```

---

### Job 2: Cancelar Apartados por 6 Semanas sin Abono (Diario)

```javascript
// Ejecutar: Todos los días a las 01:00 AM

async function cancel6WeeksNoPayment() {
  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
  
  const layawaysToCancel = await db.query(`
    SELECT * FROM layaways
    WHERE status IN ('active', 'pending_payment', 'overdue')
    AND (
      last_payment_date < $1
      OR (last_payment_date IS NULL AND created_at < $1)
    )
  `, [sixWeeksAgo])
  
  for (const layaway of layawaysToCancel) {
    // Cancelar apartado
    await updateLayaway(layaway.id, {
      status: 'cancelled_for_non_payment',
      cancelled_at: new Date(),
      cancelled_by: 'system',
      cancellation_reason: '6 semanas consecutivas sin abono'
    })
    
    // Marcar pagos pendientes como forfeited
    await db.query(`
      UPDATE layaway_payments
      SET status = 'forfeited', updated_at = NOW()
      WHERE layaway_id = $1
      AND status IN ('pending', 'overdue', 'scheduled')
    `, [layaway.id])
    
    // Liberar producto
    await updateProduct(layaway.product_id, {
      status: 'available',
      stock: 1
    })
    
    // Enviar email
    await sendCancellationEmail(layaway.customer_email, layaway.id, '6 semanas sin abono')
  }
  
  console.log(`[CRON] Cancelados ${layawaysToCancel.length} apartados por 6 semanas sin abono`)
}
```

---

### Job 3: Marcar Apartados Perdidos por Plan Vencido (Diario)

```javascript
// Ejecutar: Todos los días a las 02:00 AM

async function forfeitExpiredLayaways() {
  const today = new Date()
  
  const expiredLayaways = await db.query(`
    SELECT * FROM layaways
    WHERE status IN ('active', 'pending_payment', 'overdue')
    AND plan_end_date < $1
    AND amount_paid < total_amount
  `, [today])
  
  for (const layaway of expiredLayaways) {
    // Marcar como perdido
    await updateLayaway(layaway.id, {
      status: 'forfeited',
      cancelled_at: new Date(),
      cancelled_by: 'system',
      cancellation_reason: 'Plan finalizado sin liquidar total'
    })
    
    // Marcar pagos pendientes como forfeited
    await db.query(`
      UPDATE layaway_payments
      SET status = 'forfeited', updated_at = NOW()
      WHERE layaway_id = $1
      AND status IN ('pending', 'overdue', 'scheduled')
    `, [layaway.id])
    
    // Liberar producto
    await updateProduct(layaway.product_id, {
      status: 'available',
      stock: 1
    })
    
    // Enviar email
    await sendForfeitureEmail(layaway.customer_email, layaway.id)
  }
  
  console.log(`[CRON] Apartados perdidos: ${expiredLayaways.length}`)
}
```

---

### Job 4: Notificaciones de Pago Próximo (Diario)

```javascript
// Ejecutar: Todos los días a las 09:00 AM

async function sendPaymentReminders() {
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  
  const upcomingPayments = await db.query(`
    SELECT lp.*, l.customer_email, l.customer_name, p.name as product_name
    FROM layaway_payments lp
    JOIN layaways l ON lp.layaway_id = l.id
    JOIN products p ON l.product_id = p.id
    WHERE lp.status = 'pending'
    AND lp.due_date::date = $1::date
    AND l.status = 'active'
  `, [twoDaysFromNow])
  
  for (const payment of upcomingPayments) {
    await sendEmail({
      to: payment.customer_email,
      subject: 'Recordatorio: Tu próximo pago vence en 2 días',
      body: `Hola ${payment.customer_name}, tu próximo pago de $${payment.amount_due} vence el ${payment.due_date}...`
    })
  }
  
  console.log(`[CRON] Enviados ${upcomingPayments.length} recordatorios de pago`)
}
```

---

## 9. RIESGOS Y MITIGACIONES

### Riesgo 1: 6 Semanas sin Abono - Cancelación Injusta

**Problema:**
- Cliente paga puntualmente pero hay fallo técnico
- Sistema cancela por error

**Mitigación:**
1. Doble verificación: contador `weeks_without_payment` manual
2. Admin puede reactivar apartado cancelado
3. Email de advertencia a las 4 semanas sin abono
4. Log completo de pagos para auditoría

---

### Riesgo 2: Plan Vencido con Pago en Tránsito

**Problema:**
- Plan vence 19 Jun
- Cliente paga última cuota 19 Jun 23:59
- Pago confirma 20 Jun 00:05
- Sistema ya marcó como forfeited

**Mitigación:**
1. Período de gracia de 24h después de plan_end_date
2. Verificar si hay checkout session activo
3. Admin puede marcar como completado manualmente
4. plan_end_date debe ser fin del día (23:59:59) no inicio

---

### Riesgo 3: Producto Liberado Prematuramente

**Problema:**
- Apartado cancelado por sistema
- Producto vuelve a disponible
- Otra clienta lo compra
- Primera clienta reclama

**Mitigación:**
1. Email inmediato a clienta cuando se cancela
2. Admin debe confirmar liberar producto (no automático)
3. Log de auditoría completo
4. Período de gracia de 48h antes de liberar

---

### Riesgo 4: No Cambio de Artículo - Cliente Frustrado

**Problema:**
- Cliente apartó pieza equivocada
- Quiere cambiarla
- Sistema no permite

**Mitigación:**
1. Simulador obligatorio con confirmación explícita
2. Admin puede cancelar + crear nuevo apartado
3. Política visible desde el inicio
4. Excepción: si es dentro de primeras 24h, admin puede cambiar

---

## 10. PROPUESTA TÉCNICA REVISADA

### Fases de Implementación

#### Fase 5C.1 - Diseño ✅ COMPLETADO
- Documento técnico con políticas oficiales
- Estados del sistema
- Reglas de negocio
- Automatización (cron jobs)

---

#### Fase 5C.2 - Modelo de Datos (1 día)
- Migración 018: Actualizar `layaways` (agregar campos)
- Migración 019: Crear tabla `layaway_payments`
- Types TypeScript actualizados
- Constraints y validaciones

**Entregable:** DB lista para soportar políticas oficiales

---

#### Fase 5C.3 - Panel Cliente (2 días)
- `/account/layaways` - Lista
- `/account/layaways/[id]` - Detalle
- Calendario de pagos
- Política visible
- RLS policies

**Nota:** NO incluir botón "Cancelar apartado"

**Entregable:** Cliente puede ver apartados y pagar cuotas

---

#### Fase 5C.4 - Pagar Cuotas (2 días)
- API `/api/layaways/[id]/pay-next`
- API `/api/layaways/[id]/pay-full`
- Stripe checkout
- Webhook actualizado
- Success page

**Entregable:** Cliente puede pagar desde panel

---

#### Fase 5C.5 - Admin de Apartados (2 días)
- `/admin/layaways` - Lista con filtros
- `/admin/layaways/[id]` - Detalle
- Registrar pago manual
- Extender plazo
- Cancelar apartado
- Liberar producto
- Alertas (6 semanas, vencidos)

**Entregable:** Admin tiene control completo

---

#### Fase 5C.6 - Automatización (1 día)
- Cron job: marcar vencidos
- Cron job: cancelar 6 semanas sin abono
- Cron job: forfeit planes vencidos
- Cron job: notificaciones
- Script auditoría saldos

**Entregable:** Sistema auto-gestiona políticas

---

### Tiempo Total Estimado: 8 días

**No incluye:**
- Fase 5C.1 (ya completado)
- Testing (agregar 1-2 días)
- Deploy (agregar 0.5 días)

**Estimado real:** 9-10 días

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
- ❌ Migraciones → NO ejecutadas

**Solo documentación:**
- ✅ Políticas oficiales documentadas
- ✅ Reglas técnicas definidas
- ✅ Estados del sistema
- ✅ Automatización diseñada
- ✅ UX Cliente + Admin
- ✅ Modelo de datos
- ✅ Propuesta técnica revisada

---

**Documento actualizado:** 2026-05-01 18:50 UTC  
**Esperando aprobación para proceder con implementación.**
