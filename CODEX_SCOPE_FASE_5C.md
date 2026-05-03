# CODEX SCOPE — Fase 5C: Mis Apartados
**Proyecto:** Bagclue  
**Fecha:** 2026-05-02  
**Tipo de tarea:** Implementación  
**Entorno:** STAGING first  
**Responsable:** Codex (delegado por Kepler)

---

## CONTEXTO

Bagclue es un e-commerce de lujo (bolsas, zapatos, joyas) con sistema de apartados (layaways). Ya tiene:
- ✅ Panel de cliente con auth (magic link)
- ✅ Sección "Mis Pedidos" (Fase 5B completada)
- ✅ Checkout funcional con Stripe
- ✅ RLS policies seguras para orders

**Fase 5C** implementa la sección "Mis Apartados" en el panel de cliente.

---

## OBJETIVO DE FASE 5C

Permitir a usuarios autenticados:
1. Ver lista de apartados activos e historial
2. Ver detalle de apartado individual con cronograma de pagos
3. Pagar cuotas pendientes vía Stripe Checkout
4. Visualizar progreso de pagos

---

## REPO Y BRANCH

**Repo:** `https://github.com/Cryptokepler/bagclue`  
**Branch base:** `staging` (crear nueva branch desde staging)  
**Nueva branch:** `feat/fase-5c-mis-apartados`  
**Target merge:** `staging` (NO main directamente)

---

## PRE-CHECKS OBLIGATORIOS

Antes de iniciar implementación, Codex debe verificar:

### 1. RLS Policies
Ejecutar en Supabase SQL Editor (staging DB):

```sql
-- Policy 1: Users can view own layaways
CREATE POLICY "Users can view own layaways"
ON layaways FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can view own layaway payments
CREATE POLICY "Users can view own layaway payments"
ON layaway_payments FOR SELECT
USING (
  layaway_id IN (
    SELECT id FROM layaways WHERE user_id = auth.uid()
  )
);
```

Verificar que ambas policies se crearon correctamente:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('layaways', 'layaway_payments');
```

### 2. Webhook Stripe
Verificar que `/app/api/webhooks/stripe/route.ts` existe y maneja `checkout.session.completed`.

### 3. Customer Nav
Verificar estructura actual de `/app/customer/layout.tsx` para agregar link "Mis Apartados".

### 4. Git Author
Verificar antes de commit:
```bash
git config user.name  # debe ser: KeplerAgents
git config user.email # debe ser: info@kepleragents.com
```

---

## ARCHIVOS A CREAR

### Types
```
types/layaway.ts — interfaces Layaway, LayawayPayment, LayawayStatus
```

### API Routes
```
app/api/customer/layaways/route.ts           — GET lista
app/api/customer/layaways/[id]/route.ts      — GET detalle
app/api/customer/layaways/[id]/pay/route.ts  — POST pago
```

### Pages
```
app/customer/layaways/page.tsx       — Lista con tabs activos/historial
app/customer/layaways/[id]/page.tsx  — Detalle + cronograma
```

### Components
```
components/customer/layaway-card.tsx         — Card para lista
components/customer/layaway-payment-row.tsx  — Fila tabla pagos
```

---

## ARCHIVOS A MODIFICAR

### 1. Customer Nav (agregar link)
```
app/customer/layout.tsx
```

Agregar item:
```tsx
{ name: 'Mis Apartados', href: '/customer/layaways', icon: CalendarIcon }
```

### 2. Webhook Stripe (agregar caso layaway_payment)
```
app/api/webhooks/stripe/route.ts
```

En el switch de `event.type`, agregar caso para `checkout.session.completed` con metadata.type === 'layaway_payment'.

---

## SPEC COMPLETA

Leer **obligatoriamente** antes de implementar:
- `/home/node/.openclaw/workspace/bagclue/FASE_5C_MIS_APARTADOS.md` (14KB)
- `/home/node/.openclaw/workspace/bagclue/SCHEMA_LAYAWAYS.md` (esquema DB)

La spec incluye:
- Estructura de archivos completa
- Interfaces TypeScript
- Queries Supabase exactas
- Flujo de pago detallado
- UI/UX specs con mockups
- Validaciones y testing

---

## CRITERIOS DE IMPLEMENTACIÓN

### Backend (API Routes)

#### GET /api/customer/layaways
- Autenticar usuario con `supabase.auth.getUser()`
- Query: select layaways con joins a products y layaway_payments
- Calcular progreso: `payments_completed / total_payments`
- Retornar array de layaways con nested data
- RLS policy asegura que solo ve sus layaways

#### GET /api/customer/layaways/[id]
- Autenticar usuario
- Query: single layaway con product + payments
- Verificar ownership (user_id match)
- Retornar 404 si no existe o no es suyo

#### POST /api/customer/layaways/[id]/pay
- Autenticar usuario
- Recibir body: `{ payment_id: string }`
- Verificar ownership de layaway
- Verificar que payment existe y status === 'pending'
- Crear Stripe Checkout Session:
  - line_items: cuota específica
  - metadata: type='layaway_payment', layaway_id, payment_id, user_id
  - success_url: `/customer/layaways/${id}?payment_success=true`
  - cancel_url: `/customer/layaways/${id}?payment_cancelled=true`
- Guardar `stripe_session_id` en layaway_payments
- Retornar `{ url: session.url }`

#### Webhook Stripe (modificar existente)
En caso `checkout.session.completed`:
```typescript
if (session.metadata.type === 'layaway_payment') {
  // 1. Actualizar payment: status='paid', amount_paid, paid_at, stripe_payment_intent_id
  // 2. Verificar si todos los payments están paid
  // 3. Si todos paid → actualizar layaway.status = 'completed'
  // 4. (Opcional) Crear orden automática para envío
}
```

### Frontend (Pages)

#### /customer/layaways
- Obtener layaways del usuario vía `GET /api/customer/layaways`
- Tabs: "Activos" (status: active, pending, pending_first_payment) | "Historial" (resto)
- Grid responsive: 1 col mobile, 2+ cols desktop
- Card muestra: imagen producto, nombre, total, progreso visual, próximo pago
- Click → navegar a `/customer/layaways/[id]`
- Empty state si no hay apartados

#### /customer/layaways/[id]
- Obtener detalle vía `GET /api/customer/layaways/${id}`
- Sección 1: Info del apartado (producto, montos, fechas, estado)
- Sección 2: Tabla de cronograma de pagos
  - Columnas: #, Monto, Fecha, Estado, Acción
  - Solo próximo pago pendiente tiene botón "Pagar ahora"
  - Estados visuales: ✅ Pagado, ⏳ Pendiente, ⚠️ Vencido, 📅 Próximo
- Click "Pagar ahora" → POST /api/customer/layaways/[id]/pay → redirect a Stripe
- Manejar query params: `?payment_success=true` → toast/alert
- Breadcrumb: "Mis Apartados > [Product Name]"

### Components

#### layaway-card.tsx
Props:
```typescript
interface LayawayCardProps {
  layaway: Layaway & {
    product: { name: string; image_url: string };
    payments_completed: number;
    total_payments: number;
    next_payment?: LayawayPayment;
  };
  variant: 'active' | 'history';
}
```

#### layaway-payment-row.tsx
Props:
```typescript
interface LayawayPaymentRowProps {
  payment: LayawayPayment;
  isNext: boolean;
  onPay: (paymentId: string) => void;
}
```

---

## VALIDACIONES TÉCNICAS (Pre-Commit)

1. **Build local exitoso:**
   ```bash
   npm run build
   ```
   Debe pasar sin errores.

2. **TypeScript strict:**
   Sin `@ts-ignore` ni `any` innecesarios.

3. **RLS funcional:**
   Usuario A no puede ver layaways de usuario B.

4. **Queries optimizadas:**
   Usar select específico, no `*` si no es necesario.

5. **Error handling:**
   Todos los fetch con try/catch y manejo de errores.

6. **Loading states:**
   Spinners mientras carga data o redirige a Stripe.

---

## VALIDACIONES UX (Pre-Cierre)

### Lista de apartados
- [ ] Usuario autenticado puede ver sus apartados
- [ ] Tabs "Activos" y "Historial" filtran correctamente
- [ ] Progreso visual muestra X/Y pagos
- [ ] Click en card navega a detalle
- [ ] Empty state si no hay apartados

### Detalle de apartado
- [ ] Información del apartado correcta
- [ ] Cronograma de pagos muestra todos los payments
- [ ] Solo próximo pago pendiente tiene botón "Pagar"
- [ ] Pagos completados muestran ✅
- [ ] Click "Pagar ahora" redirige a Stripe Checkout
- [ ] Después de pago exitoso → payment actualizado a 'paid'
- [ ] Si todos los pagos están paid → layaway.status = 'completed'

### Seguridad
- [ ] Usuario no autenticado redirige a /customer/login
- [ ] Usuario no puede acceder a layaway de otro usuario (404)

### Responsive
- [ ] Mobile: tabla de pagos stack vertical
- [ ] Desktop: grid de 2-3 columnas

---

## COMMITS ESPERADOS

Estructura de commits progresiva (no un solo commit gigante):

1. `feat: add layaway types and RLS policies`
2. `feat: add GET /api/customer/layaways endpoint`
3. `feat: add GET /api/customer/layaways/[id] endpoint`
4. `feat: add POST /api/customer/layaways/[id]/pay endpoint`
5. `feat: update stripe webhook for layaway payments`
6. `feat: add layaway list page with tabs`
7. `feat: add layaway detail page with payment schedule`
8. `feat: add layaway components (card, payment row)`
9. `fix: responsive layout for mobile`
10. `docs: update README with Fase 5C completion`

**Mensaje de commit format:**
```
feat: <descripción concisa>

- Detalle 1
- Detalle 2

Refs: FASE_5C_MIS_APARTADOS.md
```

---

## ENTREGA OBLIGATORIA (Codex → Kepler)

Al finalizar, entregar:

### 1. GitHub
- Repo: `https://github.com/Cryptokepler/bagclue`
- Branch: `feat/fase-5c-mis-apartados`
- Commits: lista de SHAs (mínimo 5, máximo 15)
- Files changed: resumen de archivos creados/modificados

### 2. Build
- Confirmación de `npm run build` exitoso
- Warnings relevantes (si existen)

### 3. Testing manual realizado
- Lista de pruebas ejecutadas (ver sección Validaciones UX)
- Screenshots de:
  - Lista de apartados (activos)
  - Detalle de apartado con cronograma
  - Stripe Checkout session
  - Payment actualizado tras webhook

### 4. Pending items
- Qué funciona 100%
- Qué falta (si algo quedó pendiente)
- Qué no tocar todavía

---

## SCOPE FUERA DE FASE 5C

**NO implementar** en esta fase:
- ❌ Crear nuevo apartado (eso es checkout flow)
- ❌ Cancelar apartado
- ❌ Modificar frecuencia de pagos
- ❌ Notificaciones email/SMS
- ❌ Integración con fulfillment

---

## SIGUIENTE PASO (Post-Merge a Staging)

Tras merge a staging y validación:
1. Kepler valida UX en staging.bagclue.vercel.app
2. Si PASS → merge `staging` → `main` (producción)
3. Fase 5D: Mis Direcciones

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

**SPEC COMPLETA — READY FOR CODEX**

Codex: lee `FASE_5C_MIS_APARTADOS.md` completo antes de iniciar. Sigue este scope estrictamente. Entrega con evidencia real.
