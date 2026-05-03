# CODEX SCOPE — Fase 5C.3A: Mis Apartados (Solo Lectura)
**Proyecto:** Bagclue  
**Fecha:** 2026-05-02  
**Tipo de tarea:** Implementación (Frontend + API Routes)  
**Entorno:** STAGING first  
**Responsable:** Codex (delegado por Kepler)  
**Estado:** SCOPE COMPLETO — Pendiente aprobación Jhonatan

---

## OBJETIVO EXACTO

Implementar la sección "Mis Apartados" en el panel de cliente **en modo solo lectura**, permitiendo a usuarios autenticados:
- Ver lista de sus apartados activos e históricos
- Ver detalle completo de cada apartado
- Ver calendario y cronograma de pagos
- Ver historial de pagos realizados

**SIN** permitir:
- Pagar cuotas
- Crear apartados
- Cancelar apartados
- Modificar apartados
- Integración con Stripe Checkout

---

## ALCANCE PERMITIDO

### Páginas a crear
1. `/account/layaways` — Lista de apartados (activos + historial)
2. `/account/layaways/[id]` — Detalle de apartado individual

### Datos a mostrar

#### Lista de apartados (/account/layaways)
Por cada apartado:
- ✅ Foto del producto
- ✅ Nombre del producto
- ✅ Plan seleccionado (4/8/18 pagos semanales)
- ✅ Total del apartado
- ✅ Monto pagado
- ✅ Saldo pendiente
- ✅ Pagos completados / Pagos totales (ej: 3/8)
- ✅ Próxima fecha de pago
- ✅ Próxima cuota
- ✅ Estado (activo, completado, vencido, cancelado)
- ✅ Botón "Ver detalle" → `/account/layaways/[id]`

#### Detalle de apartado (/account/layaways/[id])
- ✅ Foto del producto
- ✅ Nombre del producto
- ✅ Plan seleccionado
- ✅ Precio total del apartado
- ✅ Primer pago realizado (monto y fecha)
- ✅ Total pagado hasta ahora
- ✅ Saldo restante
- ✅ Pagos completados (número)
- ✅ Pagos pendientes (número)
- ✅ Próxima cuota (monto)
- ✅ Próxima fecha de vencimiento
- ✅ **Calendario completo de pagos** (tabla con todas las cuotas)
- ✅ **Historial de pagos** (solo pagos completados con fechas)
- ✅ Política del apartado (texto estático)
- ✅ Contacto Bagclue (WhatsApp, Instagram)

### Funcionalidades
- ✅ Listar apartados del usuario autenticado
- ✅ Filtrar por estado (tabs: Activos / Historial)
- ✅ Ver detalle completo de apartado
- ✅ Cronograma de pagos (tabla)
- ✅ Historial de pagos realizados
- ✅ RLS seguro (solo sus apartados)
- ✅ Empty state si no hay apartados
- ✅ Manejo de errores (404, sin acceso, etc.)

---

## FUERA DE ALCANCE (PROHIBIDO)

❌ **NO implementar:**
- Pagar cuota (botón de pago)
- Crear nuevo apartado
- Cancelar apartado
- Modificar apartado
- Integración con Stripe Checkout
- Webhook de Stripe
- Cron jobs de recordatorios
- Notificaciones automáticas
- Refunds
- Automatización de confiscación
- Liberación de producto
- Registro de pago manual (admin)
- Cambios en checkout de contado
- Cambios en stock de productos
- Cambios en base de datos (estructura)

❌ **NO tocar:**
- Stripe (checkout, webhook, API)
- Admin (panel, lógica, rutas)
- Checkout de contado (flujo actual)
- Producto (stock, disponibilidad)
- Base de datos (solo leer)
- RLS policies (solo verificar que existen)

---

## ESTRUCTURA DE ARCHIVOS

### Nuevas páginas
```
src/app/account/layaways/
├── page.tsx          — Lista de apartados (tabs activos/historial)
└── [id]/
    └── page.tsx      — Detalle de apartado individual
```

### API Routes
```
src/app/api/account/
├── layaways/
│   └── route.ts      — GET /api/account/layaways (lista con filtros)
└── layaways/[id]/
    └── route.ts      — GET /api/account/layaways/[id] (detalle completo)
```

### Componentes
```
src/components/account/
├── layaway-card.tsx           — Card de apartado para lista
├── layaway-payment-row.tsx    — Fila de tabla de pagos
├── layaway-empty-state.tsx    — Estado vacío elegante
└── layaway-policy-card.tsx    — Card con política del apartado
```

### Types
```typescript
// src/types/layaway.ts (si no existe, crear)
export interface Layaway {
  id: string;
  user_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  
  // Montos
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  first_payment_amount: number;
  
  // Plan
  plan_type: 'cash' | '4_weekly_payments' | '8_weekly_payments' | '18_weekly_payments';
  total_payments: number;
  payments_completed: number;
  payments_remaining: number;
  
  // Fechas
  plan_start_date: string;
  plan_end_date: string;
  next_payment_due_date: string | null;
  next_payment_amount: number | null;
  last_payment_at: string | null;
  
  // Estado
  status: LayawayStatus;
  policy_version: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Joined data
  product?: {
    title: string;
    image_url: string;
    slug: string;
  };
  payments?: LayawayPayment[];
}

export interface LayawayPayment {
  id: string;
  layaway_id: string;
  payment_number: number;
  amount_due: number;
  amount_paid: number | null;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'forfeited' | 'failed';
  payment_type: 'first' | 'installment' | 'final' | 'extra' | null;
  created_at: string;
  updated_at: string;
}

export type LayawayStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'pending_first_payment'
  | 'overdue'
  | 'forfeited'
  | 'cancelled_for_non_payment'
  | 'cancelled_manual'
  | 'forfeiture_pending';
```

---

## ARCHIVOS QUE SE PUEDEN MODIFICAR

### Navegación (solo agregar link)
```
src/components/account/AccountLayout.tsx
```

**Modificación permitida:**
```tsx
// Agregar item al sidebar
{
  name: 'Mis Apartados',
  href: '/account/layaways',
  icon: CalendarIcon
}
```

**Restricción:** Solo agregar item de navegación, NO modificar lógica ni auth.

---

## ARCHIVOS PROHIBIDOS DE MODIFICAR

❌ **NO tocar:**

### Stripe
- `src/app/api/stripe/webhook/route.ts`
- Cualquier archivo con "stripe" en el nombre

### Checkout
- `src/app/api/checkout/*`
- `src/app/checkout/*`

### Admin
- `src/app/admin/*`
- `src/components/admin/*`

### Database
- `migrations/*` (no crear migraciones nuevas)
- Cualquier archivo de migración SQL

### Producto
- `src/app/api/products/*` (solo lectura permitida)

### Cron
- No crear archivos relacionados con cron jobs

---

## QUERIES SUPABASE NECESARIAS

### Query 1: Lista de apartados del usuario
```typescript
// GET /api/account/layaways
const { data: layaways } = await supabase
  .from('layaways')
  .select(`
    id,
    user_id,
    product_id,
    customer_name,
    customer_email,
    total_amount,
    amount_paid,
    amount_remaining,
    plan_type,
    total_payments,
    payments_completed,
    payments_remaining,
    next_payment_due_date,
    next_payment_amount,
    status,
    created_at,
    product:products(
      title,
      image_url,
      slug
    ),
    payments:layaway_payments(
      id,
      payment_number,
      status
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**Filtros opcionales:**
- `?status=active` → solo activos
- `?status=completed` → solo completados
- Sin filtro → todos

### Query 2: Detalle de apartado
```typescript
// GET /api/account/layaways/[id]
const { data: layaway } = await supabase
  .from('layaways')
  .select(`
    *,
    product:products(
      title,
      image_url,
      slug,
      description
    ),
    payments:layaway_payments(
      id,
      payment_number,
      amount_due,
      amount_paid,
      due_date,
      paid_at,
      status,
      payment_type
    )
  `)
  .eq('id', id)
  .eq('user_id', user.id)
  .single();

if (!layaway) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

**Ordenar payments:**
```typescript
layaway.payments.sort((a, b) => a.payment_number - b.payment_number);
```

---

## TIPOS TYPESCRIPT NECESARIOS

Ya definidos arriba en sección "Types".

**Archivo:** `src/types/layaway.ts`

**Exports:**
- `Layaway`
- `LayawayPayment`
- `LayawayStatus`

---

## COMPONENTES UI NECESARIOS

### 1. LayawayCard (lista)
**Archivo:** `src/components/account/layaway-card.tsx`

**Props:**
```typescript
interface LayawayCardProps {
  layaway: Layaway & { product: { title: string; image_url: string } };
}
```

**Diseño:**
```
┌─────────────────────────────────────┐
│ [Foto 100x100]  Product Name        │
│                                     │
│ Plan: 8 pagos semanales             │
│ Total: $1,500 MXN                   │
│ Pagado: $600 | Saldo: $900          │
│ Progreso: ████░░░░ 3/8 pagos       │
│                                     │
│ Próximo pago: $150 — 15 May 2026   │
│ Estado: 🟢 Activo                   │
│                                     │
│ [Ver detalle →]                     │
└─────────────────────────────────────┘
```

**Estados visuales:**
- 🟢 Activo (verde)
- ✅ Completado (verde)
- ⚠️ Vencido (amarillo/rojo)
- ❌ Cancelado (gris)

### 2. LayawayPaymentRow (cronograma)
**Archivo:** `src/components/account/layaway-payment-row.tsx`

**Props:**
```typescript
interface LayawayPaymentRowProps {
  payment: LayawayPayment;
  isNext: boolean;
}
```

**Tabla:**
| # | Monto | Fecha vencimiento | Estado | Fecha pago |
|---|-------|-------------------|--------|-----------|
| 1 | $300 | 01 May 2026 | ✅ Pagado | 30 Abr 2026 |
| 2 | $150 | 08 May 2026 | ✅ Pagado | 07 May 2026 |
| 3 | $150 | 15 May 2026 | ⏳ Pendiente | - |
| 4 | $150 | 22 May 2026 | 📅 Próximo | - |

**Estados:**
- ✅ Pagado (verde) — `status: 'paid'`
- ⏳ Pendiente (amarillo) — `status: 'pending'`
- ⚠️ Vencido (rojo) — `status: 'overdue'`
- ❌ Cancelado (gris) — `status: 'cancelled'`
- 📅 Próximo (azul) — siguiente pendiente

### 3. LayawayEmptyState
**Archivo:** `src/components/account/layaway-empty-state.tsx`

**Props:** Ninguno

**Diseño:**
```
┌─────────────────────────────────────┐
│                                     │
│       [Ícono apartados vacío]       │
│                                     │
│   No tienes apartados activos.      │
│                                     │
│   [Explorar catálogo →]             │
│                                     │
└─────────────────────────────────────┘
```

### 4. LayawayPolicyCard
**Archivo:** `src/components/account/layaway-policy-card.tsx`

**Props:**
```typescript
interface LayawayPolicyCardProps {
  policyVersion: number;
}
```

**Contenido:**
- Política de apartado (texto estático según version)
- Reglas de pago
- Consecuencias por impago
- Datos de contacto Bagclue

---

## MANEJO DE ESTADOS VACÍOS

### Sin apartados
**Ruta:** `/account/layaways`

**Si `layaways.length === 0`:**
```tsx
<LayawayEmptyState />
```

**Empty state incluye:**
- Mensaje amigable: "No tienes apartados activos."
- Botón: "Explorar catálogo" → `/catalogo`

### Sin apartado específico (404)
**Ruta:** `/account/layaways/[id]`

**Si apartado no existe o no pertenece al usuario:**
```tsx
<div className="text-center py-12">
  <p className="text-gray-600">Apartado no encontrado.</p>
  <Link href="/account/layaways">← Volver a Mis Apartados</Link>
</div>
```

---

## MANEJO DE ERRORES

### Error de autenticación
**Si `!user`:**
```typescript
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**Frontend:** Redirigir a `/account/login`

### Error de acceso
**Si apartado no pertenece al usuario:**
```typescript
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

**Frontend:** Mostrar mensaje "No tienes acceso a este apartado."

### Error de carga
**Si falla query Supabase:**
```typescript
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

**Frontend:** Mostrar mensaje "Error al cargar apartados. Intenta de nuevo."

---

## REGLAS DE SEGURIDAD / RLS

### Verificar RLS policies existentes

**layaways:**
```sql
-- Policy ya existe (verificar, NO crear):
CREATE POLICY "Customers can view own layaways"
ON layaways FOR SELECT
USING (
  (user_id = auth.uid()) 
  OR 
  (customer_email IN (
    SELECT email FROM customer_profiles WHERE user_id = auth.uid()
  ))
);
```

**layaway_payments:**
```sql
-- Policy ya existe (verificar, NO crear):
CREATE POLICY "Customers can view own layaway payments"
ON layaway_payments FOR SELECT
USING (
  layaway_id IN (
    SELECT id FROM layaways WHERE user_id = auth.uid()
  )
);
```

**IMPORTANTE:** NO crear nuevas policies, solo verificar que existan.

### Backend: Usar service role
**En API routes, usar service role para queries:**
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient(); // usa service role
const { data: { user } } = await supabase.auth.getUser();

// Luego filtrar manualmente por user_id
.eq('user_id', user.id)
```

**Alternativamente, si RLS está activo:**
```typescript
import { createClient } from '@/lib/supabase/client'; // cliente con RLS

// RLS filtra automáticamente por user_id
```

---

## CRITERIOS DE CIERRE

### Backend (API Routes)
- [ ] `GET /api/account/layaways` retorna lista de apartados del usuario
- [ ] `GET /api/account/layaways/[id]` retorna detalle completo
- [ ] Usuario no autenticado → 401
- [ ] Apartado de otro usuario → 403 o 404
- [ ] RLS filtra correctamente (solo sus apartados)

### Frontend (Pages)
- [ ] `/account/layaways` carga y muestra lista
- [ ] Tabs "Activos" / "Historial" funcionan
- [ ] Si no hay apartados → empty state elegante
- [ ] Click en "Ver detalle" → navega a `/account/layaways/[id]`
- [ ] `/account/layaways/[id]` muestra detalle completo
- [ ] Cronograma de pagos visible y ordenado
- [ ] Historial de pagos completados visible
- [ ] Estados visuales correctos (pagado, pendiente, vencido)
- [ ] No hay botones de pago activos
- [ ] Breadcrumb funcional: "Mis Apartados > [Producto]"

### Componentes
- [ ] LayawayCard renderiza correctamente
- [ ] LayawayPaymentRow muestra estado correcto
- [ ] LayawayEmptyState se ve elegante
- [ ] LayawayPolicyCard muestra texto correcto

### Navegación
- [ ] Link "Mis Apartados" agregado en AccountLayout sidebar
- [ ] Click en link → navega a `/account/layaways`

### Seguridad
- [ ] Usuario solo ve sus apartados
- [ ] No puede acceder a apartado de otra clienta
- [ ] RLS policies funcionan

### Compatibilidad
- [ ] Login/logout siguen funcionando
- [ ] `/account/orders` sigue funcionando
- [ ] Checkout de contado sigue funcionando
- [ ] Tracking público sigue funcionando
- [ ] Admin sigue funcionando

### No se tocó
- [ ] Stripe (checkout, webhook, API) — intacto
- [ ] Admin (panel, rutas) — intacto
- [ ] Checkout de contado — intacto
- [ ] Producto (stock) — intacto
- [ ] Base de datos (estructura) — intacto

---

## VALIDACIONES MANUALES

### Validación Desktop
1. Login como cliente con apartados
2. Ir a `/account/layaways`
3. Verificar que se muestran todos sus apartados
4. Verificar progreso visual correcto
5. Click en "Ver detalle" de uno
6. Verificar que `/account/layaways/[id]` muestra:
   - Foto del producto
   - Montos correctos (total, pagado, saldo)
   - Cronograma completo de pagos
   - Historial de pagos completados
   - Política del apartado
7. Intentar acceder a apartado de otra clienta → debe mostrar 404 o "Sin acceso"

### Validación Mobile
1. Abrir `/account/layaways` en mobile (DevTools responsive)
2. Verificar que cards de apartados se ven bien (stack vertical)
3. Tabla de cronograma debe ser responsive (scroll horizontal o stack)
4. Navegación móvil funciona

### Validación Empty State
1. Login como cliente sin apartados
2. Ir a `/account/layaways`
3. Verificar empty state elegante
4. Click en "Explorar catálogo" → debe ir a `/catalogo`

### Validación Seguridad
1. Login como cliente A
2. Obtener URL de apartado de cliente B (si conoces el ID)
3. Intentar acceder → debe mostrar 404 o "Sin acceso"

---

## VALIDACIONES TÉCNICAS

### Build local
```bash
npm run build
```
Debe pasar sin errores.

### TypeScript strict
Sin `@ts-ignore` ni `any` innecesarios.

### RLS funcional
Usuario A no puede ver apartados de usuario B.

### Queries optimizadas
Usar select específico con joins, no múltiples queries.

### Error handling
Todos los fetch con try/catch y manejo de errores.

### Loading states
Spinners mientras carga data.

---

## CONFIRMACIÓN — NO SE TOCARÁ

✅ **NO se tocarán:**

### Stripe
- ❌ NO se modificará `/api/stripe/webhook`
- ❌ NO se creará checkout de pago de cuota
- ❌ NO se integrará Stripe Checkout
- ❌ NO se manejarán payment intents

### Webhook
- ❌ NO se modificará lógica de webhook
- ❌ NO se agregarán casos de eventos

### Checkout de contado
- ❌ NO se modificará `/api/checkout/create-session`
- ❌ NO se tocará flujo de compra directa

### Admin
- ❌ NO se modificarán rutas `/admin/*`
- ❌ NO se tocará panel de administración
- ❌ NO se crearán funciones de admin

### Base de datos
- ❌ NO se crearán migraciones
- ❌ NO se modificarán tablas
- ❌ NO se crearán policies nuevas
- ❌ NO se modificarán constraints

### Producto
- ❌ NO se modificará stock
- ❌ NO se tocará disponibilidad
- ❌ NO se liberarán productos

### Cron jobs
- ❌ NO se crearán cron jobs
- ❌ NO se crearán notificaciones automáticas
- ❌ NO se crearán recordatorios

---

## COMMITS ESPERADOS

Estructura de commits progresiva (5-12 commits):

1. `feat: add layaway types and interfaces`
2. `feat: add GET /api/account/layaways endpoint`
3. `feat: add GET /api/account/layaways/[id] endpoint`
4. `feat: add layaway list page with tabs`
5. `feat: add layaway detail page`
6. `feat: add LayawayCard component`
7. `feat: add LayawayPaymentRow component`
8. `feat: add LayawayEmptyState component`
9. `feat: add LayawayPolicyCard component`
10. `feat: add Mis Apartados link to AccountLayout nav`
11. `fix: responsive layout for layaway tables`
12. `docs: add Fase 5C.3A completion notes`

**Mensaje de commit format:**
```
feat: <descripción concisa>

- Detalle 1
- Detalle 2

Refs: FASE_5C3A_MIS_APARTADOS_READONLY.md
```

---

## ENTREGA OBLIGATORIA (Codex → Kepler)

Al finalizar, entregar:

### 1. GitHub
- Repo: `https://github.com/Cryptokepler/bagclue`
- Branch: `feat/fase-5c3a-mis-apartados-readonly`
- Commits: lista de SHAs (5-12 commits)
- Files changed: resumen de archivos creados/modificados

### 2. Build
- Confirmación de `npm run build` exitoso
- Warnings relevantes (si existen)

### 3. Testing manual realizado
- Lista de pruebas ejecutadas (ver sección Validaciones Manuales)
- Screenshots de:
  - Lista de apartados
  - Detalle de apartado con cronograma
  - Empty state
  - Intento de acceso a apartado de otro usuario (404)

### 4. Archivos creados
- Pages: 2
- API routes: 2
- Components: 4
- Types: 1

### 5. Archivos modificados
- AccountLayout.tsx (solo navegación)

### 6. Pending items
- Qué funciona 100%
- Qué falta (si algo quedó pendiente)
- Qué no tocar todavía (pago de cuotas, Stripe, etc.)

---

## SCOPE FUERA DE FASE 5C.3A

**NO implementar** en esta fase:

### Fase 5C.3B (siguiente)
- ✅ Botón "Pagar cuota"
- ✅ Integración con Stripe Checkout
- ✅ Webhook para procesar pagos de cuotas
- ✅ Actualización automática de payments tras pago

### Fases futuras
- Crear apartado (checkout de apartado)
- Cancelar apartado
- Admin de apartados
- Cron jobs de recordatorios
- Notificaciones automáticas
- Liberación de producto tras completion

---

## SIGUIENTE PASO (Post-Merge a Staging)

Tras merge a staging y validación:
1. Kepler valida UX en staging.bagclue.vercel.app
2. Si PASS → merge `staging` → `main` (producción)
3. Fase 5C.3B: Pago de cuotas (Stripe integration)

---

## REGLAS DE EJECUCIÓN (EXECUTION_PROTOCOL)

### Tipo de tarea: Implementación
### Entorno: STAGING first

**Obligaciones:**
- GitHub or it does not exist — todo cambio en commit
- No cerrar por deploy — validación UX obligatoria
- Staging first — no tocar main directamente
- Evidence first — si algo falla, mostrar request/response/logs exactos

**Cierre binario:**
- Backend PASS + UX PASS = CERRADO
- Backend PASS + UX FAIL = ABIERTO
- Sin validación UX real = ABIERTO

---

**SPEC COMPLETA — READY FOR CODEX (PENDIENTE APROBACIÓN JHONATAN)**

Codex: NO inicies implementación hasta que Jhonatan apruebe este scope.
