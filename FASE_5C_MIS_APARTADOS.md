# FASE 5C — Mis Apartados (Panel de Cliente)
**Proyecto:** Bagclue  
**Fecha:** 2026-05-02  
**Responsable:** Kepler → Codex  
**Estado:** SPEC COMPLETO — Listo para implementación

---

## OBJETIVO
Implementar la sección "Mis Apartados" en el panel de cliente, permitiendo a usuarios autenticados ver sus apartados activos, historial completo, estado de pagos, y realizar el pago de cuotas pendientes.

---

## PRE-REQUISITOS ✅

### Dependencias completadas
- ✅ Fase 5B: Panel de cliente con auth y "Mis Pedidos"
- ✅ Customer auth (magic link)
- ✅ RLS policies seguras para orders
- ✅ Esquema layaways + layaway_payments verificado

### Esquema DB verificado
- ✅ `layaways` table con FK a users
- ✅ `layaway_payments` table con FK a layaways
- ✅ Constraint `layaways_status_check` (11 estados)
- ✅ Columnas verificadas: id, layaway_id, payment_number, amount_due, amount_paid, due_date, paid_at, status, stripe_session_id, stripe_payment_intent_id, payment_type, admin_notes, created_at, updated_at

---

## ALCANCE DE FASE 5C

### Páginas a crear
1. `/customer/layaways` — Lista de apartados (activos + historial)
2. `/customer/layaways/[id]` — Detalle de apartado individual

### Funcionalidades
✅ Ver apartados activos (status: active, pending, pending_first_payment)  
✅ Ver historial completo (status: completed, cancelled, expired, forfeited)  
✅ Detalle de apartado: producto, fecha inicio, plazo, pagos  
✅ Cronograma de pagos: cuota #, monto, fecha vencimiento, estado  
✅ Botón "Pagar cuota" para próximo pago pendiente  
✅ Indicador visual de progreso (X/Y pagos completados)  
✅ Manejo de estados: overdue, completado, cancelado  
✅ Integración con Stripe Checkout para pago de cuotas  
✅ Redirección post-pago (success/cancel)  
✅ RLS policies para seguridad

---

## ESTRUCTURA DE ARCHIVOS

### Nuevas páginas
```
app/customer/layaways/
├── page.tsx          — Lista de apartados
└── [id]/
    └── page.tsx      — Detalle individual
```

### API Routes
```
app/api/customer/
├── layaways/
│   └── route.ts      — GET /api/customer/layaways (lista)
└── layaways/[id]/
    ├── route.ts      — GET /api/customer/layaways/[id] (detalle)
    └── pay/
        └── route.ts  — POST /api/customer/layaways/[id]/pay (Stripe session)
```

### Componentes
```
components/customer/
└── layaway-card.tsx          — Card para lista de apartados
└── layaway-payment-row.tsx   — Fila de tabla de pagos
```

### Types
```typescript
// types/layaway.ts
export interface Layaway {
  id: string;
  user_id: string;
  product_id: string;
  status: LayawayStatus;
  total_price: number;
  deposit_amount: number;
  remaining_balance: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  number_of_payments: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  product?: {
    name: string;
    image_url: string;
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
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_type: string | null;
  admin_notes: string | null;
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

## RLS POLICIES NECESARIAS

### layaways table
```sql
-- Users can view own layaways
CREATE POLICY "Users can view own layaways"
ON layaways FOR SELECT
USING (auth.uid() = user_id);
```

### layaway_payments table
```sql
-- Users can view payments for own layaways
CREATE POLICY "Users can view own layaway payments"
ON layaway_payments FOR SELECT
USING (
  layaway_id IN (
    SELECT id FROM layaways WHERE user_id = auth.uid()
  )
);
```

---

## UI/UX SPECS

### /customer/layaways (Lista)

#### Layout
- Header: "Mis Apartados"
- Tabs: "Activos" | "Historial"
- Grid responsive: 1 col mobile, 2 cols tablet+

#### Card de apartado (activo)
```
┌─────────────────────────────────────┐
│ [Imagen producto]                   │
│ Product Name                        │
│ $X,XXX.XX total                     │
│                                     │
│ Progreso: ████░░░░ 3/6 pagos       │
│ Próximo pago: $XXX.XX — DD MMM     │
│                                     │
│ [Ver detalles →]                    │
└─────────────────────────────────────┘
```

#### Card de apartado (historial)
```
┌─────────────────────────────────────┐
│ [Imagen producto]                   │
│ Product Name                        │
│ Estado: ✅ Completado / ❌ Cancelado│
│ Fecha: DD MMM YYYY                  │
│                                     │
│ [Ver detalles →]                    │
└─────────────────────────────────────┘
```

#### Empty state (sin apartados)
```
No tienes apartados activos.
[Explorar catálogo →]
```

---

### /customer/layaways/[id] (Detalle)

#### Header
- Breadcrumb: Mis Apartados > [Product Name]
- Botón: "← Volver"

#### Sección: Información del apartado
```
┌─────────────────────────────────────┐
│ [Imagen producto grande]            │
│ Product Name                        │
│ Total: $X,XXX.XX                    │
│ Depósito inicial: $XXX.XX           │
│ Balance restante: $XXX.XX           │
│ Frecuencia: Quincenal               │
│ Plazo: 6 pagos                      │
│ Inicio: DD MMM YYYY                 │
│ Fin estimado: DD MMM YYYY           │
│ Estado: 🟢 Activo / ✅ Completado   │
└─────────────────────────────────────┘
```

#### Sección: Cronograma de pagos
Tabla responsive (stack en mobile):

| # | Monto | Fecha vencimiento | Estado | Acción |
|---|-------|-------------------|--------|--------|
| 1 | $XXX.XX | DD MMM YYYY | ✅ Pagado | - |
| 2 | $XXX.XX | DD MMM YYYY | ✅ Pagado | - |
| 3 | $XXX.XX | DD MMM YYYY | ⏳ Pendiente | [Pagar ahora] |
| 4 | $XXX.XX | DD MMM YYYY | 📅 Próximo | - |

**Estados visuales:**
- ✅ Pagado (verde)
- ⏳ Pendiente (amarillo)
- ⚠️ Vencido (rojo)
- ❌ Cancelado (gris)
- 📅 Próximo (azul)

**Botón "Pagar ahora":**
- Solo visible para próximo pago pendiente (no vencido)
- Si overdue → mostrar mensaje "Pago vencido — contacta soporte"
- Click → POST /api/customer/layaways/[id]/pay → Stripe Checkout

---

## FLUJO DE PAGO DE CUOTA

### 1. Usuario hace click en "Pagar ahora"
```typescript
// Cliente (layaways/[id]/page.tsx)
const handlePayment = async (paymentId: string) => {
  const res = await fetch(`/api/customer/layaways/${layawayId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_id: paymentId })
  });
  
  const { url } = await res.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### 2. Backend crea Stripe Checkout Session
```typescript
// app/api/customer/layaways/[id]/pay/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { payment_id } = await req.json();
  
  // Verificar que el layaway pertenece al usuario
  const { data: layaway } = await supabase
    .from('layaways')
    .select('*, payments:layaway_payments(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  
  if (!layaway) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  // Obtener el pago específico
  const payment = layaway.payments.find(p => p.id === payment_id);
  
  if (!payment || payment.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
  }
  
  // Crear Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Cuota #${payment.payment_number} - ${layaway.product.name}`,
          description: `Apartado ${layaway.id.slice(0, 8)}`
        },
        unit_amount: Math.round(payment.amount_due * 100)
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/layaways/${params.id}?payment_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/layaways/${params.id}?payment_cancelled=true`,
    metadata: {
      type: 'layaway_payment',
      layaway_id: params.id,
      payment_id: payment_id,
      user_id: user.id
    }
  });
  
  // Guardar stripe_session_id en el payment
  await supabase
    .from('layaway_payments')
    .update({ stripe_session_id: session.id })
    .eq('id', payment_id);
  
  return NextResponse.json({ url: session.url });
}
```

### 3. Webhook de Stripe procesa pago
```typescript
// app/api/webhooks/stripe/route.ts (ya existe)
// Agregar caso para layaway_payment:

case 'checkout.session.completed':
  const session = event.data.object;
  
  if (session.metadata.type === 'layaway_payment') {
    const { layaway_id, payment_id, user_id } = session.metadata;
    
    // Actualizar payment
    await supabase
      .from('layaway_payments')
      .update({
        status: 'paid',
        amount_paid: session.amount_total / 100,
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent
      })
      .eq('id', payment_id);
    
    // Verificar si todos los pagos están completos
    const { data: payments } = await supabase
      .from('layaway_payments')
      .select('status')
      .eq('layaway_id', layaway_id);
    
    const allPaid = payments.every(p => p.status === 'paid');
    
    if (allPaid) {
      // Marcar layaway como completado
      await supabase
        .from('layaways')
        .update({ status: 'completed' })
        .eq('id', layaway_id);
      
      // TODO: Crear orden automática (producto listo para envío)
    }
  }
  break;
```

---

## QUERIES SUPABASE

### GET /api/customer/layaways
```typescript
const { data: layaways } = await supabase
  .from('layaways')
  .select(`
    *,
    product:products(name, image_url),
    payments:layaway_payments(
      id, payment_number, amount_due, amount_paid, 
      due_date, paid_at, status
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Transform para UI
const withProgress = layaways.map(l => ({
  ...l,
  payments_completed: l.payments.filter(p => p.status === 'paid').length,
  total_payments: l.payments.length,
  next_payment: l.payments.find(p => p.status === 'pending')
}));
```

### GET /api/customer/layaways/[id]
```typescript
const { data: layaway } = await supabase
  .from('layaways')
  .select(`
    *,
    product:products(name, image_url, description),
    payments:layaway_payments(*)
  `)
  .eq('id', id)
  .eq('user_id', user.id)
  .single();
```

---

## VALIDACIONES PRE-IMPLEMENTACIÓN

### Antes de iniciar desarrollo, verificar:
- [ ] RLS policies creadas en Supabase
- [ ] Constraint `layaway_payments.status` verificado
- [ ] Webhook Stripe maneja tipo 'layaway_payment'
- [ ] Variables de entorno NEXT_PUBLIC_BASE_URL configuradas
- [ ] Customer nav link a /customer/layaways agregado

---

## CHECKLIST DE IMPLEMENTACIÓN

### Backend (API Routes)
- [ ] `GET /api/customer/layaways` — lista con progreso
- [ ] `GET /api/customer/layaways/[id]` — detalle completo
- [ ] `POST /api/customer/layaways/[id]/pay` — crear Stripe session
- [ ] Webhook Stripe actualizado (caso layaway_payment)

### Frontend (Pages)
- [ ] `/customer/layaways/page.tsx` — lista con tabs
- [ ] `/customer/layaways/[id]/page.tsx` — detalle + cronograma
- [ ] Success/cancel URL params manejados
- [ ] Loading states en pago
- [ ] Error handling

### Componentes
- [ ] `layaway-card.tsx` — card lista
- [ ] `layaway-payment-row.tsx` — fila tabla pagos
- [ ] Progress bar visual
- [ ] Status badges

### Types
- [ ] `types/layaway.ts` creado
- [ ] Interfaces Layaway, LayawayPayment, LayawayStatus

### Database
- [ ] RLS policies aplicadas
- [ ] Verificar FK constraints
- [ ] Test query manual

### Testing
- [ ] User puede ver solo sus layaways
- [ ] Pago de cuota crea Stripe session
- [ ] Webhook actualiza payment correctamente
- [ ] Layaway se marca completed cuando todos pagos OK
- [ ] UI muestra estados correctamente (overdue, pending, paid)

---

## NOTAS TÉCNICAS

### Cálculo de progreso
```typescript
const progress = {
  completed: payments.filter(p => p.status === 'paid').length,
  total: payments.length,
  percentage: Math.round((completed / total) * 100)
};
```

### Detección de overdue
```typescript
const isOverdue = (payment: LayawayPayment) => {
  return payment.status === 'pending' && new Date(payment.due_date) < new Date();
};
```

### Próximo pago pendiente
```typescript
const nextPayment = payments
  .filter(p => p.status === 'pending')
  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
```

---

## CONSIDERACIONES UX

1. **Solo permitir pagar próximo pago pendiente** — no permitir saltar cuotas
2. **Overdue payments** — mostrar mensaje de contacto a soporte (no permitir pago automático para evitar abusos)
3. **Empty states** — mensaje amigable si no hay apartados
4. **Mobile-first** — tabla de pagos debe ser responsive (stack vertical en mobile)
5. **Feedback inmediato** — loading spinner al redirigir a Stripe
6. **Breadcrumbs** — navegación clara entre lista y detalle

---

## ENTREGABLES

### Commits esperados
1. Types y RLS policies
2. API routes (layaways list + detail + pay)
3. Pages (lista + detalle)
4. Componentes UI
5. Webhook integration
6. Testing + fixes

### Validación final
- [ ] Build local exitoso (`npm run build`)
- [ ] Usuario puede ver apartados activos
- [ ] Usuario puede pagar cuota pendiente
- [ ] Webhook actualiza payment tras pago
- [ ] RLS bloquea acceso a layaways de otros usuarios
- [ ] UI responsive (mobile + desktop)

---

## SCOPE FUERA DE FASE 5C

❌ Crear nuevo apartado (eso es checkout flow, no customer panel)  
❌ Cancelar apartado (requiere admin review)  
❌ Modificar frecuencia de pagos  
❌ Notificaciones de recordatorio de pago (eso va en cron/email)  
❌ Integración con envío/fulfillment (eso es post-completion)

---

## SIGUIENTE FASE (5D)

Tras completar Fase 5C:
- Fase 5D: Mis Direcciones (CRUD de shipping addresses)
- Fase 5E: Perfil y Soporte (editar info personal, contacto)

---

**SPEC COMPLETA — LISTO PARA CODEX**
