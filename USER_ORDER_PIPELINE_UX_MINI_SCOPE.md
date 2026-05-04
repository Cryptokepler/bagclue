# USER ORDER PIPELINE UX — MINI SCOPE
## Estado claro del pedido para clientas

**Fecha:** 2026-05-04 18:25 UTC  
**Estado:** PENDIENTE APROBACIÓN  
**NO IMPLEMENTAR hasta aprobación explícita**

---

## 1. ARCHIVOS QUE TOCARÍA

### Archivos principales
- `src/app/account/orders/[id]/page.tsx` (modificar secciones de estado y CTAs)
- `src/app/account/orders/page.tsx` (agregar badge de "próximo paso" si necesario)
- `src/components/customer/ShippingAddressSection.tsx` (revisar CTAs, probablemente sin cambios)

### Archivos opcionales (dependiendo de hallazgos)
- `src/components/OrderTimeline.tsx` (revisar si mensajes son claros)
- `/checkout/success/page.tsx` (ya modificado recientemente, revisar consistencia)

### Archivos que NO tocaré
- ✅ Backend APIs (sin cambios)
- ✅ Admin panel (sin cambios)
- ✅ Checkout logic (sin cambios)
- ✅ Stripe config/webhook (sin cambios)
- ✅ DB schema, RLS (sin cambios)
- ✅ Products/stock (sin cambios)

---

## 2. CÓMO SE VERÁ EL PIPELINE EN /account/orders/[id]

### Estado A: Pago confirmado sin dirección

```
┌──────────────────────────────────────────────────────┐
│                    Tu compra está confirmada ✅      │
│                                                       │
│  Confirma tu dirección de envío para que podamos     │
│  preparar tu paquete.                                │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │    📍 Confirmar dirección de envío            │ │ ← CTA principal (rosa)
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado del pago                                      │
│  ✅ Pagado - Pago procesado correctamente            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Dirección de envío                                   │
│  ⚠️ Pendiente - Confirma tu dirección arriba         │
└──────────────────────────────────────────────────────┘
```

**Características:**
- Card grande arriba con título positivo
- Mensaje claro del próximo paso
- CTA prominente rosa
- Badge de dirección pendiente visible

---

### Estado B: Dirección confirmada + pending

```
┌──────────────────────────────────────────────────────┐
│                 Dirección confirmada ✅               │
│                                                       │
│  Nuestro equipo preparará tu pieza para envío.       │
│  Te notificaremos cuando esté lista.                 │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │         Ver mi dirección de envío             │ │ ← CTA secundario (borde)
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado del pago                                      │
│  ✅ Pagado                                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado de envío                                      │
│  📦 Pendiente de envío                                │
│  Bagclue recibió tu pedido y está preparando el      │
│  proceso de envío.                                    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Dirección de envío                                   │
│  [Dirección completa confirmada]                      │
│  ✅ Confirmada                                        │
└──────────────────────────────────────────────────────┘
```

**Características:**
- Título positivo "Dirección confirmada"
- Mensaje tranquilizador (equipo preparará)
- CTA para ver dirección (secundario, no urgente)
- Badge "Pendiente de envío" claro

---

### Estado C: Preparando tu pieza

```
┌──────────────────────────────────────────────────────┐
│                 Preparando tu pieza 📦                │
│                                                       │
│  Estamos verificando y preparando tu pedido para     │
│  enviarlo. Pronto recibirás información de rastreo.  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado del pago                                      │
│  ✅ Pagado                                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado de envío                                      │
│  📦 Preparando pieza                                  │
│  Estamos preparando tu pieza para envío con mucho    │
│  cuidado.                                             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Dirección de envío                                   │
│  [Dirección completa confirmada]                      │
│  ✅ Confirmada                                        │
└──────────────────────────────────────────────────────┘
```

**Características:**
- Título descriptivo con emoji
- Mensaje tranquilizador (próximamente tracking)
- Sin CTA urgente (cliente espera)
- Badge azul "Preparando"

---

### Estado D: Tu pedido va en camino 🚚

```
┌──────────────────────────────────────────────────────┐
│              Tu pedido va en camino 🚚                │
│                                                       │
│  Tu pieza fue enviada y está en tránsito.            │
│  Puedes rastrear tu paquete en tiempo real.          │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │          🚚 Rastrear mi paquete               │ │ ← CTA principal (rosa)
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado del pago                                      │
│  ✅ Pagado                                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado de envío                                      │
│  🚚 Enviado                                           │
│  Tu pedido ya fue enviado y está en camino.          │
│                                                       │
│  Paquetería: DHL Express                             │
│  Número de rastreo: 1234567890                       │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │    Rastrear en DHL →                          │ │ ← Link externo
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Dirección de envío                                   │
│  [Dirección completa confirmada]                      │
│  ✅ Confirmada                                        │
└──────────────────────────────────────────────────────┘
```

**Características:**
- Título emocionante "Va en camino"
- Mensaje positivo
- CTA principal: "Rastrear mi paquete" (rosa, prominente)
- Tracking info completa (paquetería, número)
- Link externo a paquetería
- Badge morado "Enviado"

---

### Estado E: Pedido entregado ✅

```
┌──────────────────────────────────────────────────────┐
│                  Pedido entregado ✅                  │
│                                                       │
│  Tu pieza fue entregada correctamente.               │
│  ¡Esperamos que la disfrutes!                        │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │         Ver más piezas de lujo                │ │ ← CTA suave (borde)
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado del pago                                      │
│  ✅ Pagado                                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Estado de envío                                      │
│  ✅ Entregado                                         │
│  Tu pedido fue entregado exitosamente.               │
│                                                       │
│  Paquetería: DHL Express                             │
│  Número de rastreo: 1234567890                       │
│  Fecha de entrega: 12 de mayo, 2026                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Dirección de entrega                                 │
│  [Dirección completa confirmada]                      │
│  ✅ Entregado aquí                                    │
└──────────────────────────────────────────────────────┘
```

**Características:**
- Título celebratorio "Entregado"
- Mensaje cálido
- CTA suave hacia catálogo (no urgente)
- Info completa de tracking + fecha de entrega
- Badge verde "Entregado"
- Sin acciones pendientes

---

## 3. CAMBIOS EN /account/orders (lista de pedidos)

### Vista actual
Muestra lista de pedidos con badges de estado.

### Propuesta de mejora (opcional)
Agregar columna o badge de "Próximo paso":

```
┌────────────────────────────────────────────────────────────────┐
│  Mis pedidos                                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pedido #abc123   12 May, 2026                                 │
│  Chanel 25 Small Negra                                         │
│  $189,000 MXN                                                  │
│  ✅ Pagado  ⚠️ Confirma tu dirección                          │ ← Badge próximo paso
│  [Ver pedido]                                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pedido #def456   10 May, 2026                                 │
│  Hermès Kelly                                                  │
│  $250,000 MXN                                                  │
│  ✅ Pagado  🚚 Rastrear paquete                               │ ← Badge próximo paso
│  [Ver pedido]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Características:**
- Badge adicional de "próximo paso" en cada pedido
- Color y emoji según estado
- Guía visual rápida sin entrar al detalle

**Pregunta:** ¿Quieres que agregue este badge en la lista o solo mejorar el detalle?

---

## 4. ESTADOS Y MENSAJES FINALES

### Estado A: Pago confirmado sin dirección

**Condición:**
```
payment_status = 'paid'
shipping_address IS NULL
```

**Card principal:**
- **Título:** "Tu compra está confirmada ✅"
- **Emoji:** ✅
- **Mensaje:** "Confirma tu dirección de envío para que podamos preparar tu paquete."
- **Color:** Verde (emerald)
- **CTA principal:** "📍 Confirmar dirección de envío" (rosa, prominente)
- **CTA secundario:** Ninguno

**Payment Status:**
- Badge: "✅ Pagado"
- Texto: "Pago procesado correctamente"

**Shipping Status:**
- Badge: "⚠️ Pendiente de envío"
- Texto: "Confirma tu dirección arriba para continuar"

**Shipping Address:**
- Badge: "⚠️ Pendiente"
- CTA: Expandir formulario de dirección automáticamente si `?action=confirm-shipping`

---

### Estado B: Dirección confirmada + pending

**Condición:**
```
payment_status = 'paid'
shipping_address IS NOT NULL
shipping_status IN ('pending', NULL)
```

**Card principal:**
- **Título:** "Dirección confirmada ✅"
- **Emoji:** ✅
- **Mensaje:** "Nuestro equipo preparará tu pieza para envío. Te notificaremos cuando esté lista."
- **Color:** Verde (emerald)
- **CTA principal:** Ninguno urgente
- **CTA secundario:** "Ver mi dirección de envío" (borde gris, discreto)

**Payment Status:**
- Badge: "✅ Pagado"

**Shipping Status:**
- Badge: "📦 Pendiente de envío"
- Texto: "Bagclue recibió tu pedido y está preparando el proceso de envío."

**Shipping Address:**
- Badge: "✅ Confirmada"
- Mostrar dirección completa
- Sin CTA (ya confirmada)

---

### Estado C: Preparando tu pieza

**Condición:**
```
payment_status = 'paid'
shipping_address IS NOT NULL
shipping_status = 'preparing'
```

**Card principal:**
- **Título:** "Preparando tu pieza 📦"
- **Emoji:** 📦
- **Mensaje:** "Estamos verificando y preparando tu pedido para enviarlo. Pronto recibirás información de rastreo."
- **Color:** Azul (blue)
- **CTA principal:** Ninguno (cliente espera)
- **CTA secundario:** Ninguno

**Payment Status:**
- Badge: "✅ Pagado"

**Shipping Status:**
- Badge: "📦 Preparando pieza"
- Texto: "Estamos preparando tu pieza para envío con mucho cuidado."

**Shipping Address:**
- Badge: "✅ Confirmada"
- Mostrar dirección completa

---

### Estado D: Tu pedido va en camino

**Condición:**
```
payment_status = 'paid'
shipping_status = 'shipped'
tracking_number IS NOT NULL
```

**Card principal:**
- **Título:** "Tu pedido va en camino 🚚"
- **Emoji:** 🚚
- **Mensaje:** "Tu pieza fue enviada y está en tránsito. Puedes rastrear tu paquete en tiempo real."
- **Color:** Morado (purple)
- **CTA principal:** "🚚 Rastrear mi paquete" (rosa, prominente)
  - Si existe `tracking_token` → link a `/track/[tracking_token]`
  - Si existe `tracking_url` → link externo a paquetería
- **CTA secundario:** "Ver dirección de envío" (discreto)

**Payment Status:**
- Badge: "✅ Pagado"

**Shipping Status:**
- Badge: "🚚 Enviado"
- Texto: "Tu pedido ya fue enviado y está en camino."
- **Mostrar info detallada:**
  - Paquetería: DHL Express / FedEx / etc.
  - Número de rastreo: [número]
  - Fecha de envío: [fecha]
- **CTA tracking:**
  - Botón primario: "Rastrear mi paquete" (interno si tracking_token existe)
  - Link externo: "Rastrear en [Paquetería] →" (si tracking_url existe)

**Shipping Address:**
- Badge: "✅ Confirmada"
- Mostrar dirección completa

---

### Estado E: Pedido entregado

**Condición:**
```
payment_status = 'paid'
shipping_status = 'delivered'
```

**Card principal:**
- **Título:** "Pedido entregado ✅"
- **Emoji:** ✅
- **Mensaje:** "Tu pieza fue entregada correctamente. ¡Esperamos que la disfrutes!"
- **Color:** Verde (emerald)
- **CTA principal:** Ninguno urgente
- **CTA secundario:** "Ver más piezas de lujo" → link a `/catalogo` (discreto, borde gris)

**Payment Status:**
- Badge: "✅ Pagado"

**Shipping Status:**
- Badge: "✅ Entregado"
- Texto: "Tu pedido fue entregado exitosamente."
- **Mostrar info detallada:**
  - Paquetería: [nombre]
  - Número de rastreo: [número]
  - Fecha de entrega: [fecha si disponible]

**Shipping Address:**
- Badge: "✅ Entregado aquí"
- Mostrar dirección completa

---

## 5. CTAs POR ESTADO

### Resumen de CTAs principales

| Estado | CTA Principal | Estilo | Navegación |
|--------|---------------|--------|------------|
| A. Sin dirección | "📍 Confirmar dirección de envío" | Rosa, prominente | Expandir ShippingAddressSection |
| B. Dirección confirmada | "Ver mi dirección de envío" | Borde gris, discreto | Expandir ShippingAddressSection (read-only) |
| C. Preparando | Ninguno | — | — |
| D. Enviado | "🚚 Rastrear mi paquete" | Rosa, prominente | `/track/[token]` o `tracking_url` |
| E. Entregado | "Ver más piezas de lujo" | Borde gris, discreto | `/catalogo` |

### CTAs secundarios

**Estado A (sin dirección):**
- Ninguno (foco en confirmar dirección)

**Estado B (dirección confirmada):**
- Ninguno relevante (cliente espera)

**Estado C (preparando):**
- Ninguno (cliente espera)

**Estado D (enviado):**
- "Rastrear en [Paquetería] →" (link externo si `tracking_url` existe)
- "Ver dirección de envío" (discreto)

**Estado E (entregado):**
- Link a `/catalogo` (opcional, no urgente)

---

## 6. LÓGICA DE DETERMINACIÓN DE ESTADO

### Función propuesta: `getOrderPipelineState(order)`

```typescript
function getOrderPipelineState(order: Order): {
  state: 'no_address' | 'address_confirmed' | 'preparing' | 'shipped' | 'delivered'
  title: string
  emoji: string
  message: string
  color: string
  bgColor: string
  borderColor: string
  primaryCTA: { label: string; href: string; style: 'primary' | 'secondary' } | null
  secondaryCTA: { label: string; href: string } | null
} {
  // Estado E: Entregado
  if (order.shipping_status === 'delivered') {
    return {
      state: 'delivered',
      title: 'Pedido entregado ✅',
      emoji: '✅',
      message: 'Tu pieza fue entregada correctamente. ¡Esperamos que la disfrutes!',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: null,
      secondaryCTA: {
        label: 'Ver más piezas de lujo',
        href: '/catalogo'
      }
    }
  }
  
  // Estado D: Enviado
  if (order.shipping_status === 'shipped') {
    const trackingHref = order.tracking_token 
      ? `/track/${order.tracking_token}` 
      : order.tracking_url || '#'
    
    return {
      state: 'shipped',
      title: 'Tu pedido va en camino 🚚',
      emoji: '🚚',
      message: 'Tu pieza fue enviada y está en tránsito. Puedes rastrear tu paquete en tiempo real.',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      primaryCTA: {
        label: '🚚 Rastrear mi paquete',
        href: trackingHref,
        style: 'primary'
      },
      secondaryCTA: null
    }
  }
  
  // Estado C: Preparando
  if (order.shipping_status === 'preparing') {
    return {
      state: 'preparing',
      title: 'Preparando tu pieza 📦',
      emoji: '📦',
      message: 'Estamos verificando y preparando tu pedido para enviarlo. Pronto recibirás información de rastreo.',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      primaryCTA: null,
      secondaryCTA: null
    }
  }
  
  // Estado B: Dirección confirmada + pending
  if (order.shipping_address && (!order.shipping_status || order.shipping_status === 'pending')) {
    return {
      state: 'address_confirmed',
      title: 'Dirección confirmada ✅',
      emoji: '✅',
      message: 'Nuestro equipo preparará tu pieza para envío. Te notificaremos cuando esté lista.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: null,
      secondaryCTA: {
        label: 'Ver mi dirección de envío',
        href: '#shipping-address'
      }
    }
  }
  
  // Estado A: Sin dirección
  if (!order.shipping_address && order.payment_status === 'paid') {
    return {
      state: 'no_address',
      title: 'Tu compra está confirmada ✅',
      emoji: '✅',
      message: 'Confirma tu dirección de envío para que podamos preparar tu paquete.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: {
        label: '📍 Confirmar dirección de envío',
        href: '#shipping-address',
        style: 'primary'
      },
      secondaryCTA: null
    }
  }
  
  // Fallback (pago pendiente, etc.)
  return {
    state: 'no_address',
    title: 'Procesando pedido',
    emoji: '⏳',
    message: 'Estamos procesando tu pedido.',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    primaryCTA: null,
    secondaryCTA: null
  }
}
```

---

## 7. CRITERIOS DE CIERRE

### Testing funcional por estado

**Estado A: Sin dirección**
- ⏳ Card principal muestra "Tu compra está confirmada ✅"
- ⏳ Mensaje claro: "Confirma tu dirección..."
- ⏳ CTA principal rosa: "📍 Confirmar dirección de envío"
- ⏳ Click CTA → expande ShippingAddressSection
- ⏳ Badge pago: "✅ Pagado"
- ⏳ Badge dirección: "⚠️ Pendiente"

**Estado B: Dirección confirmada**
- ⏳ Card principal muestra "Dirección confirmada ✅"
- ⏳ Mensaje tranquilizador: "Nuestro equipo preparará..."
- ⏳ CTA secundario: "Ver mi dirección de envío" (opcional)
- ⏳ Badge shipping: "📦 Pendiente de envío"
- ⏳ Badge dirección: "✅ Confirmada"
- ⏳ Dirección completa visible

**Estado C: Preparando**
- ⏳ Card principal muestra "Preparando tu pieza 📦"
- ⏳ Mensaje: "Estamos verificando y preparando..."
- ⏳ Sin CTA principal (cliente espera)
- ⏳ Badge shipping: "📦 Preparando pieza"
- ⏳ Badge dirección: "✅ Confirmada"

**Estado D: Enviado**
- ⏳ Card principal muestra "Tu pedido va en camino 🚚"
- ⏳ Mensaje emocionante: "Tu pieza fue enviada..."
- ⏳ CTA principal rosa: "🚚 Rastrear mi paquete"
- ⏳ Click CTA → navega a `/track/[token]` o `tracking_url`
- ⏳ Shipping info visible:
  - Paquetería (DHL/FedEx/etc.)
  - Número de rastreo
  - Fecha de envío (si disponible)
- ⏳ Link externo: "Rastrear en [Paquetería] →"
- ⏳ Badge shipping: "🚚 Enviado"

**Estado E: Entregado**
- ⏳ Card principal muestra "Pedido entregado ✅"
- ⏳ Mensaje cálido: "Tu pieza fue entregada..."
- ⏳ CTA secundario: "Ver más piezas de lujo" (discreto)
- ⏳ Shipping info completa + fecha de entrega
- ⏳ Badge shipping: "✅ Entregado"
- ⏳ Badge dirección: "✅ Entregado aquí"
- ⏳ Sin acciones pendientes

### Testing visual

**10. Diseño limpio:**
- ⏳ Card principal destacada con título grande
- ⏳ Emojis consistentes por estado
- ⏳ CTAs claramente diferenciados (primario rosa vs secundario gris)
- ⏳ Badges legibles con colores apropiados
- ⏳ Jerarquía visual clara (título > mensaje > CTA)

**11. Responsive:**
- ⏳ Mobile: card principal se adapta
- ⏳ Mobile: CTAs apilados verticalmente si es necesario
- ⏳ Desktop: layout amplio y claro

### Testing de integración

**12. No se rompió nada:**
- ⏳ OrderTimeline sigue funcionando
- ⏳ ShippingAddressSection se expande correctamente
- ⏳ Payment status correcto
- ⏳ Products list correcta
- ⏳ Totals correctos
- ⏳ /account/orders lista sigue funcionando

**13. Consistencia con /checkout/success:**
- ⏳ Mensajes consistentes entre checkout/success y account/orders/[id]
- ⏳ CTAs consistentes
- ⏳ No contradicciones en estado

**14. Áreas NO tocadas funcionan:**
- ⏳ Admin panel sin cambios
- ⏳ Checkout flow sin cambios
- ⏳ Stripe webhook sin cambios
- ⏳ Backend APIs sin cambios

---

## 8. QUÉ NO TOCARÉ

### Backend
- ✅ `/api/orders/*` (sin cambios)
- ✅ `/api/checkout/*` (sin cambios)
- ✅ `/api/admin/*` (sin cambios)
- ✅ Base de datos, schema, RLS (sin cambios)

### Checkout y pagos
- ✅ Stripe config (sin cambios)
- ✅ Webhook `/api/stripe/webhook` (sin cambios)
- ✅ Checkout logic (sin cambios)

### Admin panel
- ✅ `/admin/*` (sin cambios)
- ✅ Admin components (sin cambios)

### Productos
- ✅ Products/stock (sin cambios)
- ✅ `/admin/productos` (sin cambios)

### Tracking público
- ✅ `/track/[tracking_token]` (sin cambios de lógica, solo enlaces a él)

---

## 9. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 1.5-2 horas  
**Riesgo:** Bajo (solo cambios UI cliente, backend sin tocar)

**Archivos modificados:** 2-3
- `/app/account/orders/[id]/page.tsx` (~150 líneas modificadas)
- `/app/account/orders/page.tsx` (~30 líneas modificadas, opcional)
- `/components/customer/ShippingAddressSection.tsx` (revisar, probablemente sin cambios)

---

## 10. PRÓXIMOS PASOS

**Esperando aprobación de Jhonatan para:**
1. ✅ Confirmar que los 5 estados (A-E) son correctos
2. ✅ Confirmar que los títulos, emojis y mensajes son apropiados
3. ✅ Confirmar que los CTAs por estado son correctos
4. ✅ Confirmar prioridad: ¿mejorar solo detalle `/account/orders/[id]` o también lista `/account/orders`?
5. ✅ Autorizar implementación

**Una vez aprobado:**
- Implementar cambios en `/account/orders/[id]/page.tsx`
- Agregar función `getOrderPipelineState(order)`
- Reemplazar card de estado actual con nuevo diseño
- Agregar CTAs prominentes según estado
- Build PASS
- Deploy production
- Testing manual con Jhonatan
- Cerrar USER ORDER PIPELINE UX

---

## 11. PREGUNTAS ABIERTAS

### Pregunta 1: Mejora en lista de pedidos (/account/orders)
**¿Quieres que agregue badge de "próximo paso" en la lista de pedidos o solo mejorar el detalle?**

Ejemplo:
```
Pedido #abc123
Chanel 25
$189,000 MXN
✅ Pagado  ⚠️ Confirma tu dirección  ← Badge adicional
[Ver pedido]
```

### Pregunta 2: Estado "Pago pendiente"
No especificaste este estado en tu request. 

**¿Qué mostrar si `payment_status != 'paid'`?**
- Opción A: "Esperando pago" con mensaje claro
- Opción B: No debería existir (siempre llegan pagados desde Stripe)

### Pregunta 3: Tracking si no existe tracking_token ni tracking_url
Si `shipping_status = 'shipped'` pero no hay `tracking_number` o URLs:

**¿Qué CTA mostrar?**
- Opción A: CTA deshabilitado "Tracking pendiente"
- Opción B: Mensaje "Recibirás información de rastreo pronto"
- Opción C: No mostrar CTA de tracking

### Pregunta 4: Consistencia con /checkout/success
Ya modificamos `/checkout/success` para guiar a confirmar dirección.

**¿Los mensajes deben ser exactamente iguales o pueden variar ligeramente?**

---

**SCOPE PENDIENTE APROBACIÓN**  
**NO IMPLEMENTAR HASTA AUTORIZACIÓN EXPLÍCITA DE JHONATAN**
