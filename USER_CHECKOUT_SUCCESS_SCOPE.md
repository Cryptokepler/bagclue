# USER CHECKOUT SUCCESS — Confirmar dirección post-compra

**Fecha:** 2026-05-04  
**Problema:** Después de pagar una compra de contado, el cliente no recibe guía clara para confirmar dirección de envío.  
**Objetivo:** Guiar al cliente a confirmar dirección inmediatamente después del pago.

---

## 1. ESTADO ACTUAL

### `/checkout/success` (página de éxito)
**Archivo:** `src/app/checkout/success/page.tsx`

**Flujo actual:**
1. Recibe `session_id` de query params
2. Llama a `/api/checkout/verify-session?session_id=...`
3. Obtiene `order_id` del response
4. Obtiene `tracking_url` con `/api/orders/${order_id}/tracking-url`
5. Muestra:
   - ✅ "¡Pago Exitoso!"
   - ✅ "Tu pedido ha sido confirmado"
   - ✅ ID de sesión (para debug)
   - ✅ Estado de verificación (verifying/success/error)
   - ✅ "¿Qué sigue?" (email, coordinación, certificado)
   - ✅ Tracking link (si existe)
   - ✅ Botones: "Ver mis pedidos" (si logueado) / "Ver más productos"

**Problemas actuales:**
- ❌ **NO menciona confirmar dirección**
- ❌ **NO guía al cliente al siguiente paso crítico**
- ❌ Cliente puede quedar perdido: "Ya pagué, ¿ahora qué? ¿Dónde pongo mi dirección?"
- ❌ Botón "Ver mis pedidos" no es acción principal
- ❌ No muestra datos del pedido (producto comprado, total, número de pedido)

### `/api/checkout/verify-session`
**Archivo:** `src/app/api/checkout/verify-session/route.ts`

**Funcionalidad:**
- ✅ Consulta Stripe para verificar `payment_status === 'paid'`
- ✅ Lee `metadata.order_id` de la Stripe session
- ✅ Busca orden en Supabase
- ✅ Actualiza orden a `paid` + `confirmed` (idempotent)
- ✅ Actualiza productos (sold/stock)
- ✅ **Devuelve `order_id` en response**

**Resultado:** `/checkout/success` **SÍ puede obtener order_id** vía verify-session.

### Webhook (orden creada con `shipping_address = null`)
**Archivo:** `src/app/api/stripe/webhook/route.ts`

**Confirmado:**
```typescript
shipping_address: null
```

Todas las órdenes (compra directa y layaway) se crean con `shipping_address = null`.

### `/account/orders/[id]` (detalle de pedido)
**Archivo:** `src/app/account/orders/[id]/page.tsx`

**Componente existente:** `ShippingAddressSection`
- ✅ Ya permite confirmar/cambiar dirección
- ✅ Muestra dirección actual si existe
- ✅ Permite editar si `payment_status === 'paid'` y `shipping_status` es `pending/preparing/null`
- ✅ Tiene estado `editing` (muestra/oculta formulario)
- ❌ **NO reacciona a query params** (no hay `useSearchParams`)
- ❌ **NO se expande automáticamente** con `?action=confirm-shipping`

---

## 2. PROPUESTA DE SOLUCIÓN

### UX deseada después del pago:

**Título:**  
"Gracias por tu compra"

**Mensaje:**  
"Tu pedido fue confirmado correctamente. Para preparar tu envío, confirma la dirección donde quieres recibir tu pieza."

**Información del pedido:**
- Número de pedido: `#ABC123XY` (ID corto)
- Producto comprado: `Chanel Classic Flap Negro`
- Total pagado: `$189,000 MXN`
- Estado: `Pagado ✅`
- Siguiente paso: `Confirmar dirección de envío`

**Botón principal (CTA):**  
`[Confirmar dirección de envío →]`  
Navega a: `/account/orders/[order_id]?action=confirm-shipping`

**Botón secundario:**  
`[Ver mis pedidos]`  
Navega a: `/account/orders`

**Link terciario:**  
`Ver más productos →`

---

## 3. CÓMO RECUPERAR ORDER_ID

✅ **Ya funciona:**
- `/checkout/success` recibe `session_id`
- Llama a `/api/checkout/verify-session`
- Response incluye `order_id`
- Está disponible en `verifyResult.order_id`

✅ **Seguridad:**
- La orden fue creada por el webhook al procesar el pago
- Stripe session tiene `metadata.order_id`
- Solo se puede verificar si `payment_status === 'paid'`
- No hay riesgo de acceso no autorizado

---

## 4. CASOS EDGE

### 4.1. Cliente NO está logueado

**Escenario:** Usuario compró como guest (sin login).

**Comportamiento actual:**
- `/checkout/success` detecta si hay sesión con `supabaseCustomer.auth.getUser()`
- Si no está logueado → muestra botones "Ver más productos" / "Volver al inicio"

**Propuesta:**
1. **Mostrar información del pedido** (producto, total, número)
2. **Mensaje alternativo:** "Para confirmar tu dirección de envío, inicia sesión con el email que usaste en el checkout."
3. **Botón CTA:** `[Iniciar sesión →]` (navega a `/account/login`)
4. **Tracking link:** Seguir mostrando (no requiere login)

**Nota:** El tracking público (`/track/[token]`) ya funciona sin login.

### 4.2. Orden YA tiene dirección confirmada

**Escenario:** Cliente ya confirmó dirección (ej: refrescó página, volvió a /checkout/success).

**Detección:**
- Fetch `/api/orders/${order_id}` (nuevo endpoint o ampliar verify-session)
- Verificar si `shipping_address !== null`

**Comportamiento:**
1. Si `shipping_address` existe:
   - **Mensaje:** "Tu pedido fue confirmado correctamente. Tu dirección de envío ya está registrada."
   - **Mostrar dirección** (primeras líneas, truncada)
   - **Botón CTA:** `[Ver detalles del pedido →]` (en vez de "Confirmar dirección")
2. Si `shipping_address` es `null`:
   - Mostrar CTA original "Confirmar dirección de envío"

### 4.3. Falla lookup de orden

**Escenario:** `verify-session` devuelve error o `order_id` no encontrado.

**Comportamiento actual:**
- Muestra mensaje de error en banner amarillo/rojo
- Botones genéricos (ver productos, volver al inicio)

**Propuesta:**
- Mantener mensaje de error
- Agregar: **"Si completaste el pago, recibirás un email de confirmación. Puedes revisar tus pedidos iniciando sesión."**
- Botón: `[Ver mis pedidos]` (si logueado) / `[Iniciar sesión]` (si guest)

### 4.4. Usuario refresca `/checkout/success` múltiples veces

**Escenario:** Usuario actualiza la página repetidamente.

**Comportamiento actual:**
- `verify-session` es idempotent (devuelve success si ya está `paid`)
- No hay efectos secundarios

**Propuesta:**
- ✅ Mantener idempotencia
- ✅ Evitar múltiples fetches innecesarios con flag local (ya implementado con `useEffect` deps correctos)

### 4.5. Query param `?action=confirm-shipping` en `/account/orders/[id]`

**Escenario:** Usuario navega a `/account/orders/[order_id]?action=confirm-shipping`

**Comportamiento actual:**
- ❌ Query param es ignorado
- `ShippingAddressSection` NO se expande automáticamente

**Propuesta:**
1. Agregar `useSearchParams` en `/account/orders/[id]/page.tsx`
2. Leer `action` query param
3. Si `action === 'confirm-shipping'`:
   - Pasar prop `autoExpand={true}` a `ShippingAddressSection`
4. En `ShippingAddressSection`:
   - Aceptar prop `autoExpand?: boolean`
   - Si `autoExpand === true` y dirección es `null` → `setEditing(true)` en mount
5. Opcional: Scroll automático a la sección de dirección

---

## 5. UI PROPUESTA (WIREFRAME)

```
┌─────────────────────────────────────────────┐
│  ✅ (ícono grande verde)                     │
│                                             │
│  Gracias por tu compra                      │
│                                             │
│  Tu pedido fue confirmado correctamente.    │
│  Para preparar tu envío, confirma la        │
│  dirección donde quieres recibir tu pieza.  │
│                                             │
├─────────────────────────────────────────────┤
│  📦 DETALLES DE TU PEDIDO                   │
│                                             │
│  Número de pedido: #ABC123XY                │
│  Producto: Chanel Classic Flap Negro        │
│  Total pagado: $189,000 MXN                 │
│  Estado: Pagado ✅                           │
│                                             │
│  ⚠️  Siguiente paso: Confirmar dirección     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [ Confirmar dirección de envío → ]        │  (botón principal, rosa)
│                                             │
│  [ Ver mis pedidos ]                        │  (botón secundario, outline)
│                                             │
│  Ver más productos →                        │  (link pequeño)
│                                             │
└─────────────────────────────────────────────┘
```

**Variante (cliente NO logueado):**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Para confirmar tu dirección de envío,   │
│     inicia sesión con el email que usaste   │
│     en el checkout.                         │
│                                             │
│  [ Iniciar sesión → ]                       │  (botón principal)
│                                             │
│  📦 Link de seguimiento                     │
│  [Ver seguimiento de mi pedido]             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 6. ARCHIVOS A MODIFICAR

### 6.1. `/checkout/success/page.tsx` ⭐ PRINCIPAL
**Cambios:**
1. Fetch adicional para obtener datos de la orden:
   - Opción A: Ampliar response de `/api/checkout/verify-session` (más eficiente)
   - Opción B: Nuevo fetch a `/api/orders/${order_id}` (más limpio)
2. Agregar sección "Detalles de tu pedido":
   - Número de pedido (ID corto: últimos 8 caracteres uppercase)
   - Producto principal (brand + title)
   - Total pagado (con formato currency)
   - Estado: "Pagado ✅"
   - Siguiente paso: "Confirmar dirección de envío"
3. Cambiar botón principal:
   - De: "Ver mis pedidos"
   - A: "Confirmar dirección de envío" (navega a `/account/orders/${order_id}?action=confirm-shipping`)
4. Detectar si `shipping_address` ya existe:
   - Si existe → cambiar CTA a "Ver detalles del pedido"
   - Si `null` → "Confirmar dirección de envío"
5. Manejo de usuario NO logueado:
   - Mensaje: "Para confirmar tu dirección, inicia sesión..."
   - Botón: "Iniciar sesión" (navega a `/account/login`)

### 6.2. `/api/checkout/verify-session/route.ts` (OPCIONAL)
**Cambios opcionales:**
- Ampliar response para incluir datos de la orden:
  ```typescript
  {
    success: true,
    order_id: "...",
    order: {
      id: "...",
      customer_name: "...",
      total: 189000,
      currency: "MXN",
      shipping_address: null,
      order_items: [{ product_snapshot: {...} }]
    }
  }
  ```
- ⚠️ **Riesgo:** Response más pesado
- ✅ **Beneficio:** Un solo fetch en cliente

**Alternativa (preferida):**
- Crear nuevo endpoint `/api/orders/[id]/summary` (read-only, datos básicos)
- `/checkout/success` hace 2 fetches (verify + summary)

### 6.3. `/account/orders/[id]/page.tsx`
**Cambios:**
1. Importar `useSearchParams` de `next/navigation`
2. Leer `action` query param: `searchParams.get('action')`
3. Si `action === 'confirm-shipping'`:
   - Pasar prop `autoExpand={true}` a `ShippingAddressSection`
4. Opcional: Scroll automático a sección de dirección con `useEffect` + `scrollIntoView`

### 6.4. `/components/customer/ShippingAddressSection.tsx`
**Cambios:**
1. Aceptar nueva prop: `autoExpand?: boolean`
2. En `useEffect` inicial:
   ```typescript
   useEffect(() => {
     if (autoExpand && !currentShippingAddress && canEditAddress) {
       setEditing(true)
     }
   }, [autoExpand, currentShippingAddress, canEditAddress])
   ```
3. Opcional: Agregar ref para scroll automático

### 6.5. Nuevo endpoint (OPCIONAL): `/api/orders/[id]/summary/route.ts`
**Propósito:** Devolver datos básicos de la orden (sin RLS sensible).

**Response:**
```typescript
{
  id: string
  customer_name: string
  customer_email: string
  total: number
  currency: string
  payment_status: string
  status: string
  shipping_address: string | null
  tracking_token: string
  order_items: [{
    product_snapshot: {
      brand: string
      title: string
      image_url?: string
    }
  }]
}
```

**Validación:**
- Solo devolver si `payment_status === 'paid'`
- Usar `supabaseAdmin` (service role) para evitar RLS issues
- Limitar datos sensibles

---

## 7. RIESGOS

### 7.1. Cliente NO logueado no puede confirmar dirección
**Riesgo:** Usuario guest necesita login para confirmar dirección.

**Mitigación:**
- Mostrar mensaje claro: "Para confirmar tu dirección, inicia sesión con el email que usaste en el checkout"
- Botón CTA a `/account/login`
- Tracking link público sigue funcionando (no requiere login)

### 7.2. Orden sin `order_items` (edge case)
**Riesgo:** Webhook creó orden pero falló al crear `order_items`.

**Mitigación:**
- Validar que `order_items.length > 0` antes de renderizar detalles
- Si vacío → mostrar mensaje genérico "Pedido confirmado" sin producto específico

### 7.3. Fetch adicional ralentiza `/checkout/success`
**Riesgo:** Agregar fetch de orden aumenta tiempo de carga.

**Mitigación:**
- Opción A: Ampliar `/api/checkout/verify-session` (un solo fetch)
- Opción B: Hacer fetches en paralelo con `Promise.all`
- Mostrar skeleton/loading state mientras carga

### 7.4. Usuario navega directamente a `/account/orders/[id]?action=confirm-shipping` sin haber completado pago
**Riesgo:** URL puede ser compartida/guardada y usada incorrectamente.

**Mitigación:**
- `ShippingAddressSection` ya valida:
  - `payment_status === 'paid'`
  - `shipping_status` permite edición
- Si no cumple condiciones → no expande, muestra mensaje informativo

### 7.5. Breaking change en flujo checkout actual
**Riesgo:** Modificar `/checkout/success` podría romper flujo existente.

**Mitigación:**
- Mantener toda funcionalidad actual (tracking link, botones existentes)
- Solo agregar nueva sección de detalles + CTA
- Testear con órdenes existentes (layaway + compra directa)

---

## 8. QUÉ NO TOCAR

❌ **Stripe config**
❌ **Webhook logic** (salvo que detectes bug → pedir aprobación)
❌ **DB schema**
❌ **RLS policies**
❌ **Migraciones**
❌ **Admin panel**
❌ **Productos/stock logic**
❌ **Checkout flow** (crear sesión, payment)
❌ **Pedir dirección dentro de Stripe checkout** (no implementar todavía)

✅ **Permitido modificar:**
- `/checkout/success/page.tsx` (UI post-pago)
- `/account/orders/[id]/page.tsx` (query param handling)
- `/components/customer/ShippingAddressSection.tsx` (auto-expand)
- Crear nuevo endpoint read-only `/api/orders/[id]/summary` (opcional)
- Ampliar response de `/api/checkout/verify-session` (opcional)

---

## 9. CRITERIOS DE CIERRE

### 9.1. UX
- [  ] Después del pago, página muestra claramente:
  - Título: "Gracias por tu compra"
  - Mensaje: "...confirma la dirección donde quieres recibir tu pieza"
  - Número de pedido (ID corto)
  - Producto comprado
  - Total pagado
  - Estado: "Pagado ✅"
  - Siguiente paso: "Confirmar dirección de envío"
- [  ] Botón principal CTA: "Confirmar dirección de envío"
  - Navega a `/account/orders/[order_id]?action=confirm-shipping`
- [  ] Botón secundario: "Ver mis pedidos"
- [  ] Link terciario: "Ver más productos"

### 9.2. Casos edge
- [  ] Cliente NO logueado:
  - Mensaje: "Para confirmar tu dirección, inicia sesión..."
  - Botón: "Iniciar sesión"
- [  ] Orden YA tiene dirección:
  - CTA cambia a: "Ver detalles del pedido"
  - Muestra dirección actual (truncada)
- [  ] Falla lookup de orden:
  - Mensaje de error claro
  - Botón: "Ver mis pedidos" / "Iniciar sesión"

### 9.3. Query param `?action=confirm-shipping`
- [  ] `/account/orders/[id]` lee query param
- [  ] `ShippingAddressSection` se expande automáticamente si:
  - `autoExpand === true`
  - `shipping_address === null`
  - `canEditAddress === true`
- [  ] Opcional: Scroll automático a sección de dirección

### 9.4. Technical
- [  ] Build PASS (sin errores)
- [  ] Deploy production exitoso
- [  ] No se rompió flujo checkout actual
- [  ] No se rompió tracking link
- [  ] No se rompió layaway flow
- [  ] Testear con:
  - Cliente logueado
  - Cliente guest
  - Orden con dirección ya confirmada
  - Orden sin dirección
  - Múltiples refrescos de `/checkout/success`

### 9.5. Áreas NO tocadas
- [  ] Confirmado: No se tocó Stripe config
- [  ] Confirmado: No se tocó webhook logic
- [  ] Confirmado: No se tocó DB schema
- [  ] Confirmado: No se tocó RLS
- [  ] Confirmado: No se tocó admin panel
- [  ] Confirmado: No se tocó productos/stock

---

## 10. PLAN DE IMPLEMENTACIÓN (SUGERIDO)

### Fase 1: Ampliar `/api/checkout/verify-session` (OPCIONAL)
1. Agregar select de `order_items` con `product_snapshot`
2. Agregar `shipping_address` al response
3. Devolver datos completos de la orden en response

**Alternativa:** Crear `/api/orders/[id]/summary`

### Fase 2: Modificar `/checkout/success`
1. Fetch datos de orden (si no vienen de verify-session)
2. Agregar sección "Detalles de tu pedido"
3. Cambiar botón principal a "Confirmar dirección de envío"
4. Detectar si `shipping_address` existe → cambiar CTA
5. Manejo de cliente NO logueado

### Fase 3: Query param en `/account/orders/[id]`
1. Importar `useSearchParams`
2. Leer `action` query param
3. Pasar `autoExpand` a `ShippingAddressSection`

### Fase 4: Auto-expand en `ShippingAddressSection`
1. Aceptar prop `autoExpand`
2. `useEffect` para `setEditing(true)` si `autoExpand`
3. Opcional: Scroll automático

### Fase 5: Testing
1. Compra de contado (cliente logueado)
2. Compra de contado (cliente guest)
3. Layaway (verificar no rompe)
4. Orden con dirección ya confirmada
5. Múltiples refrescos `/checkout/success`
6. Query param `?action=confirm-shipping`

---

## 11. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 2-3 horas  
**Archivos modificados:** 3-4  
**Nuevos endpoints:** 0-1 (opcional)  
**Riesgo:** Bajo (cambios aislados en UI post-pago)

---

## 12. PREGUNTAS PENDIENTES

1. **¿Ampliar `/api/checkout/verify-session` o crear nuevo endpoint `/api/orders/[id]/summary`?**
   - Recomendación: Ampliar verify-session (más eficiente, un solo fetch)

2. **¿Scroll automático a sección de dirección con `?action=confirm-shipping`?**
   - Recomendación: Sí, mejora UX (usar `scrollIntoView`)

3. **¿Mostrar imagen del producto en detalles del pedido?**
   - Recomendación: Opcional, agregaría valor visual

4. **¿Tracking link debe seguir visible si cliente está logueado?**
   - Recomendación: Sí, mantener (algunos clientes lo prefieren)

---

**Estado:** 📋 SCOPE COMPLETO  
**Listo para implementación:** ⏸️ Awaiting authorization  
**Próximo paso:** Revisar scope → Aprobar → Implementar por fases
