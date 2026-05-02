# PROPUESTA TÉCNICA FINAL - Sistema de Apartado Bagclue

**Fecha:** 2026-05-01 18:55 UTC  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ✅ LISTO PARA APROBACIÓN - NO IMPLEMENTADO

---

## ⚠️ CONFIRMACIÓN ABSOLUTA

### ❌ NO SE IMPLEMENTÓ NADA

- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó checkout
- ❌ NO se tocó webhook
- ❌ NO se tocó admin
- ❌ NO se ejecutaron migraciones

**Solo documentación técnica y propuesta de diseño.**

---

## 1. POLÍTICAS OFICIALES BAGCLUE

### Resumen de Políticas (No Negociables)

#### ✅ Política 1: Puntualidad Obligatoria
- El apartado se mantiene activo **únicamente** si los pagos se realizan de forma puntual
- Cada pago tiene fecha de vencimiento
- Si vence sin pagar → marca `overdue`

#### ❌ Política 2: Liquidación Completa o Pierde el Apartado
- **Si al finalizar el plazo del plan no se ha liquidado el total, el apartado se pierde**
- Fecha final = última cuota programada
- Si no liquidó al final → apartado se marca `forfeited`
- Los pagos realizados **NO son reembolsables**

#### 🚫 Política 3: No Cambio de Artículo
- El apartado **no puede cambiarse por otro artículo**
- El `product_id` es inmutable
- Si quiere otra pieza → cancelar + crear nuevo apartado

#### ❌ Política 4: No Cancelaciones ni Devoluciones Automáticas
- **No se manejan cancelaciones ni devoluciones automáticas**
- No hay botón "cancelar" para cliente
- Cliente debe contactar Bagclue si quiere cancelar
- Admin decide caso por caso

#### 💰 Política 5: Pagos No Reembolsables
- **Los pagos realizados NO son reembolsables**
- Salvo decisión manual excepcional de Bagclue
- Primer pago NO reembolsable
- Pagos parciales NO reembolsables

#### ⏰ Política 6: 6 Semanas sin Abono = Cancelación
- **Si durante 6 semanas consecutivas no se recibe ningún abono, el plan se cancela automáticamente**
- 6 semanas = 42 días
- Cuenta desde último pago confirmado
- Cancelación automática por sistema
- Sin reembolso

#### 🔓 Política 7: Producto Vuelve a Disponible
- **Cuando el plan se cancela por incumplimiento, la pieza vuelve a estar disponible para la venta**
- Producto pasa de `reserved` → `available`
- Otra clienta puede comprarlo

#### 🤝 Política 8: Sistema de Compromiso y Confianza
- **Bagclue trabaja bajo un sistema de compromiso y confianza**
- Cada pieza apartada deja de ofrecerse a otras clientas
- Las políticas estrictas protegen el inventario
- Garantizan que solo clientes comprometidas aparten piezas

---

## 2. PLANES DISPONIBLES

### Plan 1: Pago de Contado
- **Pagos:** 1 (100% hoy)
- **Duración:** Inmediato
- **Primer pago:** 100% del precio

### Plan 2: 4 Pagos Semanales
- **Definición:** Pago #1 hoy + 3 pagos semanales restantes
- **Duración:** 3 semanas (21 días)
- **Primer pago mínimo:** 25% del precio

### Plan 3: 8 Pagos Semanales
- **Definición:** Pago #1 hoy + 7 pagos semanales restantes
- **Duración:** 7 semanas (49 días)
- **Primer pago mínimo:** 12.5% del precio

### Plan 4: 18 Pagos Semanales
- **Definición:** Pago #1 hoy + 17 pagos semanales restantes
- **Duración:** 17 semanas (119 días / ~4 meses)
- **Primer pago mínimo:** 5.56% del precio

**La clienta puede dar un primer pago mayor al mínimo → sistema recalcula cuotas restantes.**

---

## 3. ESTADOS DEL SISTEMA

### Estados de Apartado

| Estado | Descripción | Automático | Manual |
|--------|-------------|------------|--------|
| `pending` | Creado, esperando primer pago | ✅ | ❌ |
| `active` | Primer pago confirmado, apartado activo | ✅ | ❌ |
| `pending_payment` | Cuota próxima a vencer (1-3 días) | ✅ | ❌ |
| `overdue` | Tiene cuota(s) atrasada(s) | ✅ | ❌ |
| `paid` | Todas las cuotas pagadas, esperando envío | ✅ | ✅ |
| `completed` | Orden final creada + producto enviado | ✅ | ✅ |
| `forfeited` | **Perdido por incumplimiento** | ✅ | ❌ |
| `cancelled_for_non_payment` | **Cancelado por 6 semanas sin abono** | ✅ | ❌ |
| `cancelled` | Cancelado manualmente por admin | ❌ | ✅ |

### Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `scheduled` | Programado, aún no vence (>7 días) |
| `pending` | Vence pronto (0-7 días) |
| `paid` | Pagado exitosamente ✅ |
| `failed` | Intento de pago falló |
| `overdue` | Venció sin pagar ⚠️ |
| `cancelled` | Cancelado (apartado cancelado manual) |
| `forfeited` | **Perdido (apartado forfeited)** |

**Nota:** NO hay estados `refunded` ni `waived` porque no se manejan reembolsos automáticos.

---

## 4. REGLAS TÉCNICAS CRÍTICAS

### Regla 1: Producto Reservado
```
Trigger: Primer pago confirmado (payment #1 = paid)
Acción: Producto → reserved
```

### Regla 2: Apartado Activo
```
Trigger: Primer pago confirmado
Acción: Apartado → active
```

### Regla 3: Pagos Vencidos
```
Trigger: Cron diario (00:01 AM)
Condición: due_date < today AND status = pending
Acción: Payment → overdue, Apartado → overdue
```

### Regla 4: 6 Semanas sin Abono
```
Trigger: Cron diario (01:00 AM)
Condición: last_payment_date < (today - 42 días)
Acción: 
  - Apartado → cancelled_for_non_payment
  - Pagos pendientes → forfeited
  - Producto → available
  - Email a clienta
```

### Regla 5: Plan Vencido sin Liquidar
```
Trigger: Cron diario (02:00 AM)
Condición: plan_end_date < today AND amount_paid < total_amount
Acción:
  - Apartado → forfeited
  - Pagos pendientes → forfeited
  - Producto → available
  - Email a clienta
```

### Regla 6: Orden Final
```
Trigger: Último pago confirmado
Condición: amount_paid >= total_amount
Acción:
  - Crear orden final
  - Apartado → completed
  - Producto → sold
  - Email confirmación
```

### Regla 7: No Cambio de Artículo
```
Validación: En cualquier actualización de layaway
Condición: Si updates contiene product_id
Acción: throw Error('No se permite cambiar el artículo')
```

### Regla 8: No Refunds Automáticos
```
Política: No implementar endpoints de reembolso automático
Excepción: Admin puede procesar manual en Stripe Dashboard
```

---

## 5. AUTOMATIZACIÓN - CRON JOBS

### Job 1: Marcar Pagos Vencidos
- **Frecuencia:** Diario (00:01 AM)
- **Acción:** Marcar `pending` → `overdue` si `due_date < today`
- **Impacto:** Apartados con pagos vencidos → `overdue`

### Job 2: Cancelar por 6 Semanas sin Abono
- **Frecuencia:** Diario (01:00 AM)
- **Condición:** `last_payment_date < (today - 42 días)`
- **Acción:**
  - Apartado → `cancelled_for_non_payment`
  - Pagos → `forfeited`
  - Producto → `available`
  - Email a clienta

### Job 3: Forfeit Planes Vencidos
- **Frecuencia:** Diario (02:00 AM)
- **Condición:** `plan_end_date < today AND amount_paid < total_amount`
- **Acción:**
  - Apartado → `forfeited`
  - Pagos → `forfeited`
  - Producto → `available`
  - Email a clienta

### Job 4: Notificaciones Próximos Pagos
- **Frecuencia:** Diario (09:00 AM)
- **Condición:** `due_date = today + 2 días`
- **Acción:** Email recordatorio a clienta

---

## 6. SIMULADOR OBLIGATORIO

**La clienta DEBE ver simulación completa antes de confirmar.**

### 11 Puntos Obligatorios:

1. ✅ Producto
2. ✅ Precio total
3. ✅ Plan seleccionado
4. ✅ Primer pago mínimo requerido
5. ✅ Primer pago elegido
6. ✅ Saldo restante
7. ✅ Cantidad de pagos restantes
8. ✅ Monto de cada pago restante
9. ✅ Fechas exactas de vencimiento
10. ✅ Fecha final del plan
11. ✅ **POLÍTICA VISIBLE** (obligatoria):
    - Pagos semanales puntuales
    - No cambios de artículo
    - No cancelaciones ni devoluciones
    - Si no liquida al final, pierde el apartado
    - Si pasan 6 semanas sin abono, se cancela el plan
    - La pieza vuelve a estar disponible

**La política debe estar visible ANTES de confirmar, no en letra pequeña.**

---

## 7. MODELO DE DATOS

### Tabla: `layaways` (Campos Nuevos)

```sql
-- Plan
plan_type TEXT NOT NULL CHECK (plan_type IN ('contado', '4weeks', '8weeks', '18weeks'))
total_payments INTEGER NOT NULL
first_payment_amount NUMERIC(10, 2) NOT NULL
first_payment_min NUMERIC(10, 2) NOT NULL
installment_amount NUMERIC(10, 2)
payment_frequency TEXT DEFAULT 'weekly'

-- Tracking
payments_completed INTEGER DEFAULT 0
payments_remaining INTEGER
next_payment_due_date TIMESTAMP WITH TIME ZONE
next_payment_amount NUMERIC(10, 2)

-- Montos
total_amount NUMERIC(10, 2) NOT NULL
amount_paid NUMERIC(10, 2) DEFAULT 0
amount_remaining NUMERIC(10, 2)

-- Fechas
plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
plan_end_date TIMESTAMP WITH TIME ZONE
last_payment_date TIMESTAMP WITH TIME ZONE

-- Estado
is_on_schedule BOOLEAN DEFAULT TRUE
days_overdue INTEGER DEFAULT 0
weeks_without_payment INTEGER DEFAULT 0  -- Para regla 6 semanas
```

**Total nuevos campos:** 17

---

### Nueva Tabla: `layaway_payments`

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  payment_number INTEGER NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('first', 'installment', 'final', 'extra')),
  
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
  
  payment_method TEXT,
  processed_by TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Total campos:** 18

---

## 8. FASES DE IMPLEMENTACIÓN

### Fase 5C.2 - Modelo de Datos (1 día)
- Migración 018: Actualizar `layaways`
- Migración 019: Crear `layaway_payments`
- Types TypeScript
- Constraints y validaciones

**Entregable:** DB lista

---

### Fase 5C.3 - Panel Cliente (2 días)
- `/account/layaways` - Lista
- `/account/layaways/[id]` - Detalle
- Calendario de pagos
- Política visible
- RLS policies

**NO incluir botón "Cancelar apartado"**

**Entregable:** Cliente puede ver y pagar

---

### Fase 5C.4 - Pagar Cuotas (2 días)
- API `/api/layaways/[id]/pay-next`
- API `/api/layaways/[id]/pay-full`
- Stripe checkout
- Webhook actualizado
- Success page

**Entregable:** Pagos funcionando

---

### Fase 5C.5 - Admin (2 días)
- `/admin/layaways` - Lista + filtros
- `/admin/layaways/[id]` - Detalle + acciones
- Registrar pago manual
- Extender plazo
- Cancelar apartado
- Liberar producto
- Alertas (6 semanas, vencidos, próximos)

**Entregable:** Admin control completo

---

### Fase 5C.6 - Automatización (1 día)
- Cron job: marcar vencidos
- Cron job: cancelar 6 semanas sin abono
- Cron job: forfeit planes vencidos
- Cron job: notificaciones
- Script auditoría

**Entregable:** Políticas auto-gestionadas

---

**Tiempo total estimado:** 8 días de desarrollo  
**Con testing y deploy:** 9-10 días

---

## 9. RIESGOS Y MITIGACIONES

### Riesgo 1: Cancelación Injusta (6 Semanas)
**Problema:** Pago en tránsito, sistema cancela  
**Mitigación:**
- Email advertencia a las 4 semanas
- Admin puede reactivar
- Log completo para auditoría

### Riesgo 2: Plan Vencido con Pago en Tránsito
**Problema:** Paga última cuota justo al vencer, confirma minutos después  
**Mitigación:**
- Período de gracia 24h después de plan_end_date
- Verificar checkout sessions activos
- plan_end_date = fin del día (23:59:59)

### Riesgo 3: Producto Liberado Prematuramente
**Problema:** Apartado cancelado, producto vendido, primera clienta reclama  
**Mitigación:**
- Email inmediato al cancelar
- Admin confirma liberar producto (no 100% automático)
- Período gracia 48h antes de liberar

### Riesgo 4: Cliente Frustrado por No Cambio
**Problema:** Apartó pieza equivocada, quiere cambiar  
**Mitigación:**
- Simulador obligatorio con confirmación explícita
- Admin puede cancelar + crear nuevo
- Excepción: primeras 24h admin puede cambiar

---

## 10. DECISIONES TÉCNICAS CLAVE

### Decisión 1: Automático vs Manual

**Automático:**
- Marcar pagos vencidos → `overdue`
- Cancelar por 6 semanas → `cancelled_for_non_payment`
- Forfeit plan vencido → `forfeited`
- Completar apartado → `completed`

**Manual (Admin):**
- Liberar producto (confirmación)
- Reembolsos (caso por caso)
- Reactivar apartado cancelado
- Cancelar apartado antes de tiempo

---

### Decisión 2: Período de Gracia

**24h después de plan_end_date:**
- Si pago confirma en ese período → validar
- Evita forfeit por minutos de diferencia

**48h antes de liberar producto:**
- Dar tiempo a clienta para resolver
- Evitar liberar producto prematuramente

---

### Decisión 3: No Botón Cancelar para Cliente

**Razón:**
- Evita cancelaciones impulsivas
- Fuerza contacto con Bagclue
- Admin decide caso por caso

**Alternativa:**
- Botón "Contactar Bagclue"
- Cliente explica razón
- Admin decide si procede

---

### Decisión 4: Estados Estrictos

**Nuevos estados:**
- `forfeited` - Apartado perdido (irreversible)
- `cancelled_for_non_payment` - Cancelado por sistema (puede reactivarse)

**Diferencia:**
- `forfeited` = plan completó plazo sin liquidar
- `cancelled_for_non_payment` = 6 semanas sin abono (puede estar a mitad de plan)

---

## 11. PROPUESTA FINAL

### Alcance MVP

**Incluye:**
1. ✅ Modelo de datos (layaways + layaway_payments)
2. ✅ Panel cliente (ver apartados + pagar cuotas)
3. ✅ Panel admin (gestión completa)
4. ✅ Automatización (4 cron jobs)
5. ✅ Políticas estrictas implementadas
6. ✅ Simulador obligatorio
7. ✅ Emails automáticos

**Excluye:**
- ❌ Crear apartado desde frontend (admin crea manualmente)
- ❌ Reembolsos automáticos (manual en admin)
- ❌ Auto-pagos recurrentes (cliente paga manual cada semana)
- ❌ Modificar plan en curso (admin cancela + crea nuevo)

---

### Stack Técnico

**Backend:**
- Next.js 15 API Routes
- Supabase (PostgreSQL + RLS)
- Stripe SDK
- Cron jobs (Vercel Cron o OpenClaw)

**Frontend:**
- Next.js 15 App Router
- React 19
- Tailwind CSS
- Componentes reutilizables

**Integraciones:**
- Stripe Checkout
- Stripe Webhooks (idempotencia obligatoria)
- Email (Resend o similar)

---

### Tiempo Estimado

| Fase | Días | Complejidad |
|------|------|-------------|
| 5C.2 - Modelo de datos | 1 | Media |
| 5C.3 - Panel cliente | 2 | Media |
| 5C.4 - Pagar cuotas | 2 | Alta |
| 5C.5 - Admin | 2 | Media |
| 5C.6 - Automatización | 1 | Media |
| **TOTAL** | **8 días** | - |

**Con testing y deploy:** 9-10 días

---

### Criterios de Éxito

**Técnicos:**
1. ✅ Migraciones aplicadas sin errores
2. ✅ RLS policies funcionan
3. ✅ Pagos actualizan saldos correctamente
4. ✅ Webhook idempotente (no duplica pagos)
5. ✅ Cron jobs ejecutan correctamente
6. ✅ Estados cambian según políticas

**Funcionales:**
1. ✅ Cliente ve apartados y puede pagar
2. ✅ Simulador muestra 11 puntos obligatorios
3. ✅ Admin gestiona apartados completamente
4. ✅ 6 semanas sin abono → cancelación automática
5. ✅ Plan vencido sin liquidar → forfeited
6. ✅ Producto vuelve a disponible al cancelar

**Negocio:**
1. ✅ Políticas estrictas implementadas
2. ✅ No cambio de artículo (validado)
3. ✅ No reembolsos automáticos
4. ✅ Producto reservado solo con primer pago
5. ✅ Orden final solo si liquidado 100%

---

## 12. PRÓXIMOS PASOS

### Inmediato (Hoy)

1. ⏳ Jhonatan revisa esta propuesta técnica final
2. ⏳ Jhonatan confirma políticas están correctas
3. ⏳ Jhonatan aprueba inicio de implementación

### Tras Aprobación

4. 🚀 Kepler inicia Fase 5C.2 (modelo de datos)
5. 🚀 Commit por fase con documentación
6. 🚀 Deploy incremental a Vercel preview
7. 🚀 Validación paso a paso
8. 🚀 Testing exhaustivo
9. 🚀 Deploy a producción

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
- ❌ Migraciones → NO ejecutadas
- ❌ Deploy → NO realizado

**Solo documentación:**
- ✅ Políticas oficiales documentadas
- ✅ Reglas técnicas definidas
- ✅ Estados del sistema
- ✅ Automatización diseñada
- ✅ Modelo de datos propuesto
- ✅ Propuesta técnica completa
- ✅ Riesgos identificados
- ✅ Plan de implementación

---

**Documentos generados:**
1. `BAGCLUE_LAYAWAY_PAYMENT_PLANS.md` (41KB) - Diseño técnico completo
2. `APARTADO_PROPUESTA_TECNICA_FINAL.md` (este archivo) - Propuesta ejecutiva

**Total documentación:** ~55KB

---

**Estado:** ✅ LISTO PARA APROBACIÓN

**Esperando decisión de Jhonatan para proceder.**

---

**Fecha:** 2026-05-01 18:55 UTC  
**Autor:** Kepler  
**Proyecto:** Bagclue - Sistema de Apartado con Políticas Oficiales
