# USER ORDER PIPELINE UX — ENTREGA FINAL
## Estado claro del pedido para clientas

**Fecha:** 2026-05-04 18:35 UTC  
**Commit:** 8249a54  
**Status:** ✅ IMPLEMENTADO Y DESPLEGADO

---

## RESUMEN EJECUTIVO

Implementación completa del pipeline visual de estado de pedido para clientas con 6 estados claros, mensajes simples y CTAs apropiados por estado.

**Objetivo cumplido:**
- Clienta entiende de forma muy simple qué está pasando con su pedido
- Sabe cuál es el siguiente paso
- CTAs claros y apropiados por estado
- No confundir pagado con enviado
- Textos elegantes y consistentes

---

## ARCHIVOS MODIFICADOS

### 1. src/app/account/orders/[id]/page.tsx

**Cambios principales:**

#### Nueva función getOrderPipelineState()
```typescript
function getOrderPipelineState(order: any): {
  state: 'payment_pending' | 'no_address' | 'address_confirmed' | 'preparing' | 'shipped' | 'delivered'
  title: string
  emoji: string
  message: string
  color: string
  bgColor: string
  borderColor: string
  primaryCTA: { label: string; action: 'confirm-address' | 'track' | 'catalog' } | null
  secondaryCTA: { label: string; action: 'view-address' | 'catalog' } | null
  showTrackingInfo: boolean
}
```

**Lógica de 6 estados:**
1. **payment_pending** (payment_status != 'paid')
2. **no_address** (paid + sin dirección)
3. **address_confirmed** (paid + dirección + shipping pending)
4. **preparing** (shipping_status = 'preparing')
5. **shipped** (shipping_status = 'shipped')
6. **delivered** (shipping_status = 'delivered')

#### Nuevo render del pipeline
- Reemplazado "Status Card" con pipeline unificado
- Card con color según estado (bg/border dinámico)
- Título + emoji + mensaje claro
- CTAs dinámicos por estado
- Scroll automático a shipping address section
- Tracking info solo visible cuando relevante

#### Handler de CTAs
```typescript
const handleCTAClick = (action) => {
  if (action === 'confirm-address' || action === 'view-address') {
    // Scroll to shipping address section
    document.getElementById('shipping-address-section').scrollIntoView()
  } else if (action === 'track') {
    // Navigate to tracking
    router.push(`/track/${order.tracking_token}`) or window.open(tracking_url)
  } else if (action === 'catalog') {
    router.push('/catalogo')
  }
}
```

**Líneas modificadas:** ~200 líneas

---

### 2. src/app/account/orders/page.tsx

**Cambios principales:**

#### Nueva función getNextStepBadge()
```typescript
function getNextStepBadge(order: any) {
  // Determina badge de "próximo paso" según estado
  // Retorna: { style, label, icon }
}
```

**Lógica de badges:**
- **payment_status != 'paid'** → "⏳ Esperando pago"
- **delivered** → "✅ Entregado"
- **shipped** → "🚚 En camino"
- **preparing** → "📦 Preparando pieza"
- **sin dirección** → "⚠️ Confirma dirección"
- **dirección confirmada + pending** → "📦 Preparación pendiente"

#### Render del badge
Agregado en cada pedido de la lista:
```tsx
<div className="flex items-center gap-2 mt-2">
  <span className={`text-xs px-2.5 py-1 rounded border font-medium ${nextStepBadge.style} flex items-center gap-1.5`}>
    <span>{nextStepBadge.icon}</span>
    <span>{nextStepBadge.label}</span>
  </span>
</div>
```

**Posición:** Debajo de la fila de badges existentes (pago, dirección, envío)

**Líneas modificadas:** ~60 líneas

---

## ESTADOS IMPLEMENTADOS

### Estado A: Esperando pago ⏳

**Condición:**
```
payment_status != 'paid'
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  ⏳  Esperando pago                          │
│                                              │
│  Tu pedido se actualizará cuando el pago    │
│  sea confirmado.                             │
└──────────────────────────────────────────────┘
```

**Características:**
- Sin CTA (cliente debe completar pago)
- Color gris
- Mensaje claro sin urgencia

---

### Estado B: Tu compra está confirmada ✅

**Condición:**
```
payment_status = 'paid'
shipping_address IS NULL
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  ✅  Tu compra está confirmada               │
│                                              │
│  Confirma tu dirección de envío para que    │
│  podamos preparar tu paquete.                │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  📍 Confirmar dirección de envío       │ │ ← CTA primario rosa
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Características:**
- CTA primario prominente (rosa)
- Color verde (emerald)
- Scroll automático a shipping address section
- Prioridad máxima en confirmar dirección

**Badge en lista:** "⚠️ Confirma dirección"

---

### Estado C: Dirección confirmada ✅

**Condición:**
```
payment_status = 'paid'
shipping_address IS NOT NULL
shipping_status IN ('pending', NULL)
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  ✅  Dirección confirmada                    │
│                                              │
│  Nuestro equipo preparará tu pieza para     │
│  envío. Te notificaremos cuando esté lista. │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Ver mi dirección de envío             │ │ ← CTA secundario gris
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Características:**
- CTA secundario opcional (gris)
- Color verde (emerald)
- Mensaje tranquilizador
- Cliente espera, no hay urgencia

**Badge en lista:** "📦 Preparación pendiente"

---

### Estado D: Preparando tu pieza 📦

**Condición:**
```
shipping_status = 'preparing'
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  📦  Preparando tu pieza                     │
│                                              │
│  Estamos verificando y preparando tu pedido │
│  para enviarlo. Pronto recibirás            │
│  información de rastreo.                     │
└──────────────────────────────────────────────┘
```

**Características:**
- Sin CTA (cliente espera)
- Color azul
- Mensaje tranquilizador
- Menciona próximo paso (tracking)

**Badge en lista:** "📦 Preparando pieza"

---

### Estado E: Tu pedido va en camino 🚚

**Condición:**
```
shipping_status = 'shipped'
```

**UI con tracking:**
```
┌──────────────────────────────────────────────┐
│  🚚  Tu pedido va en camino                  │
│                                              │
│  Tu pieza fue enviada y está en tránsito.   │
│  Puedes rastrear tu paquete en tiempo real. │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  🚚 Rastrear mi paquete                │ │ ← CTA primario rosa
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Información de envío                        │
│                                              │
│  Paquetería: DHL Express                     │
│  Número de rastreo: 1234567890               │
│  Rastrear en DHL →                           │
└──────────────────────────────────────────────┘
```

**UI sin tracking:**
```
┌──────────────────────────────────────────────┐
│  🚚  Tu pedido va en camino                  │
│                                              │
│  Tu pedido fue enviado. El número de        │
│  rastreo estará disponible pronto.          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Información de envío                        │
│                                              │
│  Paquetería: DHL Express                     │
│  Tracking pendiente                          │
└──────────────────────────────────────────────┘
```

**Características:**
- CTA primario solo si hay tracking_number/tracking_url/tracking_token
- Color morado (purple)
- Mensaje emocionante
- Tracking info completa cuando disponible
- Mensaje claro "pendiente" si no hay tracking

**Badge en lista:** "🚚 En camino"

---

### Estado F: Pedido entregado ✅

**Condición:**
```
shipping_status = 'delivered'
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  ✅  Pedido entregado                        │
│                                              │
│  Tu pieza fue entregada correctamente.      │
│  ¡Esperamos que la disfrutes!               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Ver más piezas de lujo                │ │ ← CTA secundario gris
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Información de envío                        │
│                                              │
│  Paquetería: DHL Express                     │
│  Número de rastreo: 1234567890               │
│  Fecha de entrega: 12 de mayo, 2026         │
└──────────────────────────────────────────────┘
```

**Características:**
- CTA secundario opcional hacia catálogo (gris)
- Color verde (emerald)
- Mensaje cálido celebratorio
- Sin acciones pendientes
- Tracking info completa para referencia

**Badge en lista:** "✅ Entregado"

---

## CTAS POR ESTADO

| Estado | CTA Principal | Estilo | Acción |
|--------|---------------|--------|--------|
| A. Esperando pago | Ninguno | — | — |
| B. Sin dirección | "📍 Confirmar dirección de envío" | Rosa, prominente | Scroll a shipping address section |
| C. Dirección confirmada | "Ver mi dirección de envío" | Gris, discreto | Scroll a shipping address section |
| D. Preparando | Ninguno | — | — |
| E. Enviado (con tracking) | "🚚 Rastrear mi paquete" | Rosa, prominente | Navegar a `/track/[token]` o tracking_url |
| E. Enviado (sin tracking) | Ninguno | — | — |
| F. Entregado | "Ver más piezas de lujo" | Gris, discreto | Navegar a `/catalogo` |

---

## JERARQUÍA VISUAL

### /account/orders/[id] (detalle)

```
Pedido #abc123
Realizado el 12 de mayo, 2026

┌────────────────────────────────────────────┐
│  Pipeline Card (estado principal)          │
│  - Emoji grande (4xl)                      │
│  - Título (xl, color dinámico)             │
│  - Mensaje (párrafo claro)                 │
│  - CTA primario (rosa) si aplica           │
│  - CTA secundario (gris) si aplica         │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Estado del pago                           │
│  ✅ Pagado - Pago procesado correctamente  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Información de envío (si relevante)       │
│  - Paquetería                              │
│  - Número de rastreo                       │
│  - Link externo a paquetería               │
└────────────────────────────────────────────┘

[Timeline / Productos / Totals / Dirección]
```

---

### /account/orders (lista)

```
Mis Pedidos

┌────────────────────────────────────────────┐
│  Pedido #abc123  12 May, 2026              │
│  Chanel 25 Small Negra                     │
│                                            │
│  ✅ Pagado  ⚠️ Dirección pendiente  📦...  │ ← Badges existentes
│                                            │
│  ⚠️ Confirma dirección                     │ ← Badge próximo paso NUEVO
│                                            │
│  $189,000 MXN                              │
│  [Ver pedido]                              │
└────────────────────────────────────────────┘
```

**Posición del badge:**
- Debajo de badges existentes
- Más prominente (font-medium)
- Separado visualmente con `mt-2`

---

## BUILD RESULT

### Build local
```
✓ Compiled successfully in 5.1s
✓ Running TypeScript ... PASS
✓ Generating static pages (38/38) in 318.6ms
Duration: ~5.5s
Result: PASS ✅
```

### Build Vercel
```
✓ Compiled successfully in 5.8s
✓ Running TypeScript ... PASS
✓ Generating static pages (38/38) in 370.8ms
Build Completed in /vercel/output [17s]
Deployment completed [36s]
Result: PASS ✅
```

---

## DEPLOY

**Commit:** 8249a54  
**Branch:** main  
**Production URL:** https://bagclue.vercel.app  
**Build time:** 17s  
**Deploy time:** 36s total  
**Status:** ✅ DEPLOYED

---

## ÁREAS NO TOCADAS (CONFIRMADO)

### Backend
- ✅ `/api/orders/*` - Sin cambios
- ✅ `/api/checkout/*` - Sin cambios
- ✅ `/api/admin/*` - Sin cambios
- ✅ Base de datos schema - Sin cambios
- ✅ RLS policies - Sin cambios

### Checkout y pagos
- ✅ Stripe config - Sin cambios
- ✅ Webhook `/api/stripe/webhook` - Sin cambios
- ✅ Checkout logic - Sin cambios

### Admin panel
- ✅ `/admin/*` - Sin cambios
- ✅ Admin components - Sin cambios

### Productos
- ✅ Products/stock - Sin cambios
- ✅ `/admin/productos` - Sin cambios

### Tracking público
- ✅ `/track/[tracking_token]` - Sin cambios de lógica (solo enlaces)

---

## CRITERIOS DE CIERRE

### Testing funcional por estado

**Estado A: Esperando pago**
- ⏳ Card muestra "Esperando pago ⏳"
- ⏳ Mensaje: "Tu pedido se actualizará..."
- ⏳ Sin CTA
- ⏳ Badge lista: "⏳ Esperando pago"

**Estado B: Sin dirección**
- ⏳ Card muestra "Tu compra está confirmada ✅"
- ⏳ Mensaje: "Confirma tu dirección..."
- ⏳ CTA rosa: "📍 Confirmar dirección de envío"
- ⏳ Click CTA → scroll a shipping address section
- ⏳ Badge lista: "⚠️ Confirma dirección"

**Estado C: Dirección confirmada**
- ⏳ Card muestra "Dirección confirmada ✅"
- ⏳ Mensaje: "Nuestro equipo preparará..."
- ⏳ CTA gris: "Ver mi dirección de envío" (discreto)
- ⏳ Badge lista: "📦 Preparación pendiente"

**Estado D: Preparando**
- ⏳ Card muestra "Preparando tu pieza 📦"
- ⏳ Mensaje: "Estamos verificando y preparando..."
- ⏳ Sin CTA
- ⏳ Badge lista: "📦 Preparando pieza"

**Estado E: Enviado con tracking**
- ⏳ Card muestra "Tu pedido va en camino 🚚"
- ⏳ Mensaje emocionante: "Tu pieza fue enviada..."
- ⏳ CTA rosa: "🚚 Rastrear mi paquete"
- ⏳ Click CTA → navega a tracking
- ⏳ Tracking info visible: paquetería + número + link
- ⏳ Badge lista: "🚚 En camino"

**Estado E: Enviado sin tracking**
- ⏳ Card muestra "Tu pedido va en camino 🚚"
- ⏳ Mensaje: "El número de rastreo estará disponible pronto"
- ⏳ Sin CTA activo
- ⏳ Tracking info: "Tracking pendiente"

**Estado F: Entregado**
- ⏳ Card muestra "Pedido entregado ✅"
- ⏳ Mensaje: "Tu pieza fue entregada..."
- ⏳ CTA gris: "Ver más piezas de lujo" (discreto)
- ⏳ Tracking info completa visible
- ⏳ Badge lista: "✅ Entregado"
- ⏳ Sin acciones pendientes

### Testing visual

**8. Diseño limpio:**
- ⏳ Card principal destacada
- ⏳ Emojis consistentes por estado
- ⏳ CTAs diferenciados (rosa vs gris)
- ⏳ Badges legibles
- ⏳ Jerarquía visual clara

**9. Responsive:**
- ⏳ Mobile: card se adapta
- ⏳ Desktop: layout amplio

### Testing de integración

**10. No se rompió nada:**
- ⏳ OrderTimeline funciona
- ⏳ ShippingAddressSection funciona
- ⏳ Payment status correcto
- ⏳ Products list correcta
- ⏳ Totals correctos
- ⏳ Lista `/account/orders` funciona

**11. Consistencia:**
- ⏳ Mensajes consistentes con `/checkout/success`
- ⏳ No contradicciones de estado

**12. Áreas NO tocadas:**
- ⏳ Admin panel sin cambios
- ⏳ Checkout flow sin cambios
- ⏳ Stripe webhook sin cambios
- ⏳ Backend APIs sin cambios

---

## LECCIONES APRENDIDAS

### 1. Claridad > Detalle
Menos información bien presentada es mejor que mucha información confusa. Un mensaje claro + emoji + CTA apropiado es suficiente.

### 2. Jerarquía visual importa
CTA primario rosa + secundario gris ayuda a la clienta a saber qué hacer sin pensar. No todos los botones deben verse igual.

### 3. Estado "esperando" no es malo
Cliente no necesita CTA urgente si su estado es "preparando" o "esperando tracking". Mensaje tranquilizador es suficiente.

### 4. Badge de próximo paso simplifica lista
En `/account/orders`, un badge simple de próximo paso permite scan rápido sin entrar al detalle.

### 5. Tracking info condicional reduce confusión
Mostrar "tracking pendiente" es mejor que no mostrar nada o mostrar error. Cliente entiende que viene pronto.

### 6. Scroll automático mejora UX
CTA "Confirmar dirección" que hace scroll automático a la sección reduce fricción vs pedir que busque manualmente.

---

## PRÓXIMOS PASOS

**Validación requerida:**
1. ⏳ Jhonatan valida visualmente los 6 estados
2. ⏳ Test de flujo completo: compra → sin dirección → confirmar → preparing → shipped → delivered
3. ⏳ Validar badges en lista `/account/orders`
4. ⏳ Validar CTAs funcionales (scroll, tracking, catálogo)

**Una vez validado:**
- Cerrar USER ORDER PIPELINE UX ✅
- Decidir siguiente fase (ADMIN FASE 1C.5 o E2E testing)

---

## RESUMEN FINAL

### Problema resuelto
✅ Clienta ahora entiende de forma muy simple qué está pasando con su pedido y cuál es el siguiente paso

### Solución implementada
- 6 estados claros con mensajes simples
- CTAs apropiados por estado
- Badge "Próximo paso" en lista
- No confundir pagado con enviado
- Textos elegantes y consistentes

### Implementación
- Solo UI cliente (2 archivos)
- Sin tocar backend/admin/checkout/Stripe/webhook/DB

### Build & Deploy
- Build: ✅ PASS (5.1s local, 17s Vercel)
- Deploy: ✅ PASS (36s)
- Production: https://bagclue.vercel.app

### Status
- ✅ IMPLEMENTADO
- ✅ DESPLEGADO
- ⏳ AWAITING VALIDACIÓN VISUAL

---

**Listo para validación en producción.**

**URL de test:**
- Lista: https://bagclue.vercel.app/account/orders
- Detalle: https://bagclue.vercel.app/account/orders/[tu_order_id]
