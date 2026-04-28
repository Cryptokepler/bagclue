# PLAN: WEBHOOK FIX + ORDER TRACKING MVP
**Fecha:** 2026-04-28 23:47 UTC  
**Prioridad:** CRÍTICA - Webhook NO está funcionando automáticamente

---

## PARTE 1: DIAGNÓSTICO ACTUAL

### Problema Confirmado

**Orden más reciente:**
- Order ID: `83ec2330-f4b3-4d91-b0bc-ecb2b887eab2`
- Stripe Session: `cs_test_a1lCSr98nhXSmkWcPJJvc1KmSNFo6xU9Ubs0jMbJNtq5beEk2qOloGfQZT`
- Payment Intent: `pi_3TRLIA2KuAFNA49O0pzcVimt`

**Estado en Stripe:**
```
✅ Payment Status: paid
✅ Status: complete
✅ Amount: 189,000 MXN
✅ Payment Intent: pi_3TRLIA2KuAFNA49O0pzcVimt
```

**Estado en Base de Datos (ANTES del fix manual):**
```
❌ payment_status: pending
❌ status: pending
❌ stripe_payment_intent_id: NULL
❌ producto: reserved (debería ser sold)
```

**Estado DESPUÉS del fix manual:**
```
✅ payment_status: paid
✅ status: confirmed
✅ stripe_payment_intent_id: pi_3TRLIA2KuAFNA49O0pzcVimt
✅ producto: sold, stock: 0
```

**Conclusión:** El webhook NO está procesando eventos `checkout.session.completed`

---

## PARTE 2: PLAN DE ACCIÓN WEBHOOK

### Paso 1: Verificar Eventos en Stripe Dashboard

**Acción manual requerida:**

1. Ir a: https://dashboard.stripe.com/test/events
2. Buscar evento `checkout.session.completed` para session: `cs_test_a1lCSr98nhXSmkWcPJJvc1KmSNFo6xU9Ubs0jMbJNtq5beEk2qOloGfQZT`
3. Verificar:
   - ¿Se envió el evento al webhook?
   - ¿Qué respuesta HTTP dio el endpoint?
   - ¿Hay error de firma?
   - ¿Hay error 500?

**Posibles causas:**

A. **Webhook no está recibiendo eventos**
   - Endpoint mal configurado en Stripe
   - URL incorrecta
   - Eventos no seleccionados

B. **Webhook rechaza eventos (firma inválida)**
   - Webhook secret incorrecto
   - Firma no coincide

C. **Webhook falla al procesar (error 500)**
   - Bug en el código
   - Error en Supabase
   - Timeout

### Paso 2: Agregar Logging al Webhook

**Código actual:** `/src/app/api/stripe/webhook/route.ts`

**Mejora propuesta:** Agregar logs detallados

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('[WEBHOOK] Received request')
    console.log('[WEBHOOK] Signature present:', !!signature)

    if (!signature) {
      console.error('[WEBHOOK] No signature in headers')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[WEBHOOK] Event verified:', event.type)
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[WEBHOOK] Processing: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[WEBHOOK] Checkout completed for order:', session.metadata?.order_id)
        await handleCheckoutCompleted(session)
        console.log('[WEBHOOK] Successfully processed checkout.session.completed')
        break
      }
      // ...
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[WEBHOOK] Fatal error:', error.message)
    console.error('[WEBHOOK] Stack:', error.stack)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('[WEBHOOK] No order_id in metadata')
    return
  }

  console.log(`[WEBHOOK] Updating order ${order_id}`)

  // Actualizar orden
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent as string || null
    })
    .eq('id', order_id)

  if (orderError) {
    console.error('[WEBHOOK] Error updating order:', orderError)
    throw orderError
  }

  console.log(`[WEBHOOK] Order ${order_id} updated to paid`)

  // ... resto del código
}
```

### Paso 3: Verificar Webhook Endpoint en Vercel

**Verificar que está deployado:**
```bash
curl -X POST https://bagclue.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Debe responder 400 (No signature) - eso confirma que el endpoint está vivo.

### Paso 4: Re-enviar Evento desde Stripe

Si el evento falló, puedes reenviarlo:

1. Ir a: https://dashboard.stripe.com/test/events
2. Buscar evento `checkout.session.completed`
3. Click "..." → "Resend event"
4. Verificar que ahora sí procesa

### Paso 5: Test con Producto Nuevo

**Productos disponibles para testing:**
- Hermès Birkin 30 Gold (ya vendido, necesita restaurarse)
- Louis Vuitton (si existe)
- Otro producto con stock disponible

**Proceso de test:**
1. Restaurar stock de un producto vendido O usar producto nuevo
2. Ir a la ficha del producto
3. Agregar al carrito
4. Checkout completo
5. Pagar con tarjeta test: `4242 4242 4242 4242`
6. **NO hacer fix manual**
7. Esperar 30 segundos
8. Verificar en `/admin/orders`:
   - ✅ payment_status = paid (automático)
   - ✅ status = confirmed (automático)
   - ✅ payment_intent guardado
   - ✅ producto = sold

**Criterio de éxito:** Si todo se actualiza automáticamente → WEBHOOK FUNCIONA ✅

---

## PARTE 3: ORDER TRACKING MVP - DISEÑO

### Objetivo

Permitir al cliente seguir su pedido después de la compra SIN necesidad de crear cuenta.

### Arquitectura Propuesta

#### 3.1 Captura de Datos Adicionales

**Modificar Stripe Checkout Session para capturar:**
- Teléfono
- Dirección de envío

**Código actualizado:** `/src/app/api/checkout/create-session/route.ts`

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items,
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
  customer_email,
  
  // NUEVO: Capturar teléfono y dirección
  phone_number_collection: {
    enabled: true
  },
  shipping_address_collection: {
    allowed_countries: ['MX', 'US'] // Ajustar según tu mercado
  },
  
  metadata: {
    order_id: order.id
  },
  expires_at: Math.floor(Date.now() / 1000) + (30 * 60)
})
```

#### 3.2 Actualizar Esquema de Base de Datos

**Migración SQL:** Agregar campos de shipping a `orders`

```sql
ALTER TABLE orders 
ADD COLUMN customer_phone TEXT,
ADD COLUMN shipping_address JSONB,
ADD COLUMN tracking_status TEXT DEFAULT 'confirmed',
ADD COLUMN tracking_number TEXT,
ADD COLUMN notes TEXT;

-- Estados posibles: confirmed, preparing, shipped, delivered, cancelled

COMMENT ON COLUMN orders.tracking_status IS 'confirmed | preparing | shipped | delivered | cancelled';
COMMENT ON COLUMN orders.shipping_address IS '{ "name": "...", "line1": "...", "line2": "...", "city": "...", "state": "...", "postal_code": "...", "country": "..." }';
```

#### 3.3 Actualizar Webhook para Guardar Shipping Info

**Código:** `/src/app/api/stripe/webhook/route.ts`

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('[WEBHOOK] No order_id in metadata')
    return
  }

  // Preparar datos de shipping
  const shippingAddress = session.shipping_details?.address ? {
    name: session.shipping_details.name,
    line1: session.shipping_details.address.line1,
    line2: session.shipping_details.address.line2,
    city: session.shipping_details.address.city,
    state: session.shipping_details.address.state,
    postal_code: session.shipping_details.address.postal_code,
    country: session.shipping_details.address.country
  } : null

  // Actualizar orden
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent as string || null,
      customer_phone: session.customer_details?.phone || null,  // NUEVO
      shipping_address: shippingAddress,                         // NUEVO
      tracking_status: 'confirmed'                               // NUEVO
    })
    .eq('id', order_id)

  if (orderError) {
    console.error('[WEBHOOK] Error updating order:', orderError)
    throw orderError
  }

  // ... resto del código (marcar productos como sold)
}
```

#### 3.4 Mejorar Página de Success

**Archivo:** `/src/app/checkout/success/page.tsx`

**Funcionalidad:**
1. Obtener session_id de URL
2. Consultar orden usando session_id
3. Mostrar detalles reales:
   - Número de orden
   - Productos comprados
   - Total pagado
   - Dirección de envío
   - Estado actual
   - Link a seguimiento

**Código propuesto:**

```typescript
async function getOrderBySession(sessionId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('stripe_session_id', sessionId)
    .single()
  
  return order
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const [order, setOrder] = useState(null)
  
  useEffect(() => {
    if (session_id) {
      fetch(`/api/orders/by-session?session_id=${session_id}`)
        .then(res => res.json())
        .then(data => setOrder(data.order))
    }
  }, [session_id])
  
  if (!order) return <div>Cargando...</div>
  
  return (
    <div>
      <h1>¡Pago Exitoso!</h1>
      <p>Orden #{order.id.slice(0, 8)}</p>
      
      <div>
        <h2>Productos</h2>
        {order.order_items.map(item => (
          <div key={item.id}>
            {item.product_snapshot.brand} {item.product_snapshot.title}
          </div>
        ))}
      </div>
      
      <div>
        <h2>Envío</h2>
        {order.shipping_address && (
          <p>
            {order.shipping_address.line1}<br/>
            {order.shipping_address.city}, {order.shipping_address.state}
          </p>
        )}
      </div>
      
      <Link href={`/track/${session_id}`}>
        Ver estado de tu pedido →
      </Link>
    </div>
  )
}
```

#### 3.5 Crear Página de Tracking

**Nueva página:** `/src/app/track/[sessionId]/page.tsx`

**Funcionalidad:**
- Cliente accede con session_id (del email o URL de success)
- Muestra estado actual del pedido
- Timeline visual
- Información de envío

**Código:**

```typescript
export default async function TrackOrderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  
  const order = await getOrderBySession(sessionId)
  
  if (!order) {
    return <div>Orden no encontrada</div>
  }
  
  const trackingSteps = [
    { status: 'confirmed', label: 'Confirmado', icon: '✅', active: true },
    { status: 'preparing', label: 'Preparando', icon: '📦', active: order.tracking_status === 'preparing' || order.tracking_status === 'shipped' || order.tracking_status === 'delivered' },
    { status: 'shipped', label: 'Enviado', icon: '🚚', active: order.tracking_status === 'shipped' || order.tracking_status === 'delivered' },
    { status: 'delivered', label: 'Entregado', icon: '🎉', active: order.tracking_status === 'delivered' }
  ]
  
  return (
    <div>
      <h1>Seguimiento de Pedido</h1>
      <p>Orden #{order.id.slice(0, 8)}</p>
      
      {/* Timeline */}
      <div className="timeline">
        {trackingSteps.map(step => (
          <div key={step.status} className={step.active ? 'active' : 'inactive'}>
            <span>{step.icon}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      
      {/* Tracking Number */}
      {order.tracking_number && (
        <div>
          <h2>Número de rastreo</h2>
          <p>{order.tracking_number}</p>
        </div>
      )}
      
      {/* Products */}
      <div>
        <h2>Productos</h2>
        {order.order_items.map(item => (
          <div key={item.id}>
            {item.product_snapshot.brand} {item.product_snapshot.title}
          </div>
        ))}
      </div>
      
      {/* Shipping Address */}
      <div>
        <h2>Dirección de envío</h2>
        {order.shipping_address && (
          <p>
            {order.shipping_address.name}<br/>
            {order.shipping_address.line1}<br/>
            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br/></>}
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br/>
            {order.shipping_address.country}
          </p>
        )}
      </div>
    </div>
  )
}
```

#### 3.6 Admin: Actualizar Estado de Envío

**Modificar:** `/src/app/admin/orders/[id]/page.tsx`

**Agregar:**
- Dropdown para cambiar tracking_status
- Input para tracking_number
- Botón "Actualizar estado"

**Código:**

```typescript
'use client'

function UpdateTrackingForm({ orderId, currentStatus, currentTrackingNumber }) {
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || '')
  
  const handleUpdate = async () => {
    const res = await fetch(`/api/orders/${orderId}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_status: status, tracking_number: trackingNumber })
    })
    
    if (res.ok) {
      alert('Estado actualizado')
      window.location.reload()
    }
  }
  
  return (
    <div>
      <h3>Actualizar Estado de Envío</h3>
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="confirmed">Confirmado</option>
        <option value="preparing">Preparando</option>
        <option value="shipped">Enviado</option>
        <option value="delivered">Entregado</option>
        <option value="cancelled">Cancelado</option>
      </select>
      
      <input 
        type="text" 
        placeholder="Número de rastreo"
        value={trackingNumber}
        onChange={e => setTrackingNumber(e.target.value)}
      />
      
      <button onClick={handleUpdate}>Actualizar</button>
    </div>
  )
}
```

**API endpoint:** `/src/app/api/orders/[id]/tracking/route.ts`

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { tracking_status, tracking_number } = await request.json()
  
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      tracking_status,
      tracking_number,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ order: data[0] })
}
```

---

## PARTE 4: ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Fix Webhook (PRIORIDAD CRÍTICA)

**Duración estimada:** 1-2 horas

1. ✅ Diagnosticar problema (COMPLETADO)
2. ⏳ Verificar evento en Stripe dashboard
3. ⏳ Agregar logging al webhook
4. ⏳ Deploy con logs
5. ⏳ Re-enviar evento o hacer test nuevo
6. ⏳ Confirmar que webhook funciona automáticamente

**Criterio de éxito:** Compra nueva se procesa sin intervención manual

### Fase 2: Order Tracking Básico

**Duración estimada:** 2-3 horas

1. ⏳ Crear migración SQL (agregar campos a orders)
2. ⏳ Actualizar checkout session (capturar teléfono + dirección)
3. ⏳ Actualizar webhook (guardar shipping info)
4. ⏳ Mejorar success page (mostrar detalles reales)
5. ⏳ Crear `/track/[sessionId]` page
6. ⏳ Test completo del flujo

**Criterio de éxito:** Cliente puede ver detalles de su orden después de pagar

### Fase 3: Admin Tracking Update

**Duración estimada:** 1-2 horas

1. ⏳ Crear API endpoint `/api/orders/[id]/tracking`
2. ⏳ Agregar form de actualización en admin
3. ⏳ Agregar timeline visual en tracking page
4. ⏳ Test de actualización de estado

**Criterio de éxito:** Admin puede actualizar estado y cliente lo ve reflejado

### Fase 4: Polish

**Duración estimada:** 1 hora

1. ⏳ Email de confirmación con link de tracking
2. ⏳ Diseño visual de timeline
3. ⏳ Notificaciones de cambio de estado (opcional)

---

## EXCLUSIONES (NO IMPLEMENTAR TODAVÍA)

❌ Cuentas de usuario  
❌ Historial de compras  
❌ Login de cliente  
❌ Wishlist  
❌ Perfil de usuario  

**Razón:** El tracking por session_id es suficiente para MVP. Cuentas agregan complejidad innecesaria.

---

## NEXT STEPS INMEDIATOS

1. **Jhonatan debe hacer:**
   - Verificar evento en Stripe dashboard
   - Confirmar si quiere que agreguemos logging al webhook

2. **Kepler hará:**
   - Esperar confirmación para agregar logging
   - Preparar migración SQL para tracking
   - Implementar captura de shipping info

3. **Test final:**
   - Compra limpia con producto nuevo
   - Verificar webhook automático
   - Si pasa → continuar con Order Tracking MVP

---

**Fecha de creación:** 2026-04-28 23:50 UTC  
**Status:** Webhook fix pendiente → luego Order Tracking MVP  
**Prioridad:** 🔴 CRÍTICA
