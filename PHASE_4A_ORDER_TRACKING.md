# FASE 4A — ORDER TRACKING MVP (sin cuentas de usuario)

**Fecha:** 2026-04-29  
**Estado:** DISEÑO APROBADO - LISTO PARA IMPLEMENTAR  
**Contexto:** Cliente puede ver estado de su pedido mediante link seguro, sin crear cuenta

---

## OBJETIVO

Que la clienta pueda:
1. Ver el estado de su compra después del pago
2. Ver información de envío (paquetería, tracking, dirección)
3. Ver timeline del pedido
4. Acceder mediante un link seguro único

**NO requiere:**
- Crear cuenta
- Login
- Contraseña
- Historial de compras (solo ve su orden específica)

---

## 1. CAMBIOS DB

### 1.1 Modificar tabla `orders`

```sql
-- Agregar campos de shipping y tracking
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN shipping_provider TEXT;  -- 'dhl', 'fedex', null
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN shipping_status TEXT DEFAULT 'pending';  -- 'pending', 'preparing', 'shipped', 'delivered'
ALTER TABLE orders ADD COLUMN tracking_token TEXT UNIQUE;  -- Token seguro para acceso público
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ;

-- Índices
CREATE INDEX idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX idx_orders_shipping_status ON orders(shipping_status);

-- Función para generar tracking_token automáticamente (UUID sin guiones)
UPDATE orders SET tracking_token = REPLACE(gen_random_uuid()::TEXT, '-', '') WHERE tracking_token IS NULL;
```

**Valores válidos `shipping_status`:**
- `pending` → Pedido confirmado, pago recibido, aún no enviado
- `preparing` → Preparando envío
- `shipped` → Enviado, en tránsito
- `delivered` → Entregado

**Valores válidos `shipping_provider`:**
- `dhl` → DHL Express
- `fedex` → FedEx
- `null` → Sin asignar todavía

---

## 2. RUTA PÚBLICA DE TRACKING

### 2.1 Ruta: `/track/[tracking_token]`

**URL de ejemplo:**
```
https://bagclue.vercel.app/track/a1b2c3d4e5f6789012345678
```

**Seguridad:**
- Token generado automáticamente al crear orden (UUID sin guiones, 32 caracteres)
- Token único e irrepetible
- No revela información personal en URL
- Acceso público (no requiere auth)
- Si token no existe → 404

### 2.2 Vista de tracking

```
┌──────────────────────────────────────────┐
│  BAGCLUE                                 │
├──────────────────────────────────────────┤
│  Seguimiento de Pedido                   │
│                                          │
│  Pedido #12345                           │
│  20 Abril 2026                           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  [Imagen producto]                 │  │
│  │                                    │  │
│  │  Chanel Classic Flap Negro         │  │
│  │  $189,000 MXN                      │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Estado del pedido: 🚚 En camino         │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Información de envío                    │
│  Paquetería: DHL Express                 │
│  Número de rastreo: 1234567890           │
│  [Ver en DHL →]                          │
│                                          │
│  Se enviará a:                           │
│  Av. Reforma 123                         │
│  Col. Juárez, CDMX 06600                 │
│  México                                  │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Timeline del pedido                     │
│                                          │
│  ✅ Pago confirmado                      │
│     20 Abr, 10:31                        │
│                                          │
│  ✅ Preparando envío                     │
│     21 Abr, 09:00                        │
│                                          │
│  ✅ Enviado                               │
│     21 Abr, 14:00                        │
│     DHL 1234567890                       │
│                                          │
│  🔄 En camino                            │
│     22 Abr, 09:15                        │
│     Última actualización                 │
│                                          │
│  ⏸️ Entregado                            │
│     Estimado: 25 Abr                     │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  ¿Dudas sobre tu pedido?                 │
│  📷 Instagram: @bagclue                  │
│  💬 WhatsApp: +52 55 1234 5678           │
│                                          │
│  [Ver catálogo] [Volver a inicio]        │
│                                          │
└──────────────────────────────────────────┘
```

### 2.3 Estados visuales del timeline

**Código de color por estado:**

```tsx
const statusConfig = {
  pending: {
    label: 'Pago confirmado',
    icon: '✅',
    color: 'text-emerald-500'
  },
  preparing: {
    label: 'Preparando envío',
    icon: '📦',
    color: 'text-blue-500'
  },
  shipped: {
    label: 'Enviado',
    icon: '🚚',
    color: 'text-purple-500'
  },
  delivered: {
    label: 'Entregado',
    icon: '✅',
    color: 'text-emerald-500'
  }
}
```

**Timeline siempre muestra:**
1. ✅ Pago confirmado (siempre activo, fecha = `orders.created_at`)
2. Estado actual según `shipping_status`
3. Estados futuros en gris (⏸️)

**Ejemplos:**

**Orden en `pending`:**
```
✅ Pago confirmado - 20 Abr, 10:31
🔄 Preparando envío - Estimado: 21 Abr
⏸️ Enviado - Estimado: 22 Abr
⏸️ Entregado - Estimado: 25 Abr
```

**Orden en `shipped`:**
```
✅ Pago confirmado - 20 Abr, 10:31
✅ Preparando envío - 21 Abr, 09:00
✅ Enviado - 21 Abr, 14:00 (DHL 1234567890)
🔄 En camino - Última actualización: 22 Abr, 09:15
⏸️ Entregado - Estimado: 25 Abr
```

**Orden en `delivered`:**
```
✅ Pago confirmado - 20 Abr, 10:31
✅ Preparando envío - 21 Abr, 09:00
✅ Enviado - 21 Abr, 14:00
✅ Entregado - 25 Abr, 11:30
```

---

## 3. ADMIN — EDICIÓN DE SHIPPING INFO

### 3.1 Modificar `/admin/orders/[id]`

**Agregar sección "Información de envío":**

```
┌──────────────────────────────────────────┐
│  Admin - Orden #12345                    │
├──────────────────────────────────────────┤
│                                          │
│  Cliente                                 │
│  Nombre: Jhonatan Venegas                │
│  Email: jho190@gmail.com                 │
│  Teléfono: [_____________] [Editar]      │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Información de envío                    │
│                                          │
│  Estado: [pending ▾]                     │
│    • pending (Pendiente)                 │
│    • preparing (Preparando)              │
│    • shipped (Enviado)                   │
│    • delivered (Entregado)               │
│                                          │
│  Paquetería: [dhl ▾]                     │
│    • (Sin asignar)                       │
│    • dhl (DHL Express)                   │
│    • fedex (FedEx)                       │
│                                          │
│  Número de rastreo: [_____________]      │
│  Link de rastreo: [_____________]        │
│    (Opcional - si quieres URL custom)    │
│                                          │
│  Dirección de envío:                     │
│  [___________________________]           │
│  [___________________________]           │
│  [___________________________]           │
│                                          │
│  Notas internas:                         │
│  [___________________________]           │
│  [___________________________]           │
│                                          │
│  [Guardar cambios]                       │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Link de seguimiento (compartir):        │
│  https://bagclue.vercel.app/track/       │
│  a1b2c3d4...                             │
│  [Copiar link]                           │
│                                          │
└──────────────────────────────────────────┘
```

### 3.2 Endpoint API: `PUT /api/orders/[id]/shipping`

**Request body:**
```json
{
  "customer_phone": "+52 55 1234 5678",
  "shipping_address": "Av. Reforma 123\nCol. Juárez\nCDMX 06600\nMéxico",
  "shipping_status": "shipped",
  "shipping_provider": "dhl",
  "tracking_number": "1234567890",
  "tracking_url": "https://www.dhl.com.mx/...",
  "notes": "Envío especial - manejar con cuidado"
}
```

**Validaciones:**
- `shipping_status` debe ser: `pending`, `preparing`, `shipped`, `delivered`
- `shipping_provider` debe ser: `null`, `dhl`, `fedex`
- Si `shipping_status=shipped`, requiere `shipping_provider` y `tracking_number`
- Solo admin puede actualizar

**Respuesta:**
```json
{
  "success": true,
  "order": { ... },
  "tracking_url": "https://bagclue.vercel.app/track/a1b2c3d4..."
}
```

### 3.3 Auto-generar `tracking_url` si `tracking_number` se proporciona

**Lógica:**
```typescript
if (shipping_provider === 'dhl' && tracking_number && !tracking_url) {
  tracking_url = `https://www.dhl.com.mx/es/express/rastreo.html?AWB=${tracking_number}`
}

if (shipping_provider === 'fedex' && tracking_number && !tracking_url) {
  tracking_url = `https://www.fedex.com/fedextrack/?tracknumbers=${tracking_number}`
}
```

---

## 4. SUCCESS PAGE — BOTÓN DE TRACKING

### 4.1 Modificar `/checkout/success/page.tsx`

**Después de verificación exitosa del pago, mostrar:**

```
┌──────────────────────────────────────────┐
│  ✅ ¡Pago Exitoso!                       │
│                                          │
│  Tu pedido ha sido confirmado            │
│  Pedido #12345                           │
│                                          │
│  [✅ Pago verificado y orden actualizada]│
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  ¿Qué sigue?                             │
│  • Recibirás un email de confirmación    │
│  • Preparamos tu pedido                  │
│  • Te notificaremos cuando se envíe      │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  [📦 Ver seguimiento de mi pedido]       │
│                                          │
│  Guarda este link:                       │
│  https://bagclue.vercel.app/track/...    │
│  [Copiar link]                           │
│                                          │
│  [Ver catálogo]  [Volver al inicio]      │
│                                          │
└──────────────────────────────────────────┘
```

### 4.2 Lógica

**Después de verificar pago en `/api/checkout/verify-session`:**

1. Buscar la orden creada
2. Obtener `tracking_token` de la orden
3. Construir URL: `${BASE_URL}/track/${tracking_token}`
4. Mostrar botón y link copiable

**Código:**
```tsx
const [trackingUrl, setTrackingUrl] = useState<string | null>(null)

useEffect(() => {
  const fetchTrackingUrl = async () => {
    // Después de verificar sesión exitosamente
    if (verifyResult?.success && verifyResult.order_id) {
      const response = await fetch(`/api/orders/${verifyResult.order_id}/tracking-url`)
      const data = await response.json()
      setTrackingUrl(data.tracking_url)
    }
  }
  fetchTrackingUrl()
}, [verifyResult])
```

---

## 5. ENDPOINT: `/api/orders/[id]/tracking-url`

**GET** (público, requiere order_id válido)

**Response:**
```json
{
  "tracking_url": "https://bagclue.vercel.app/track/a1b2c3d4e5f6...",
  "tracking_token": "a1b2c3d4e5f6..."
}
```

**Validación:**
- Orden debe existir
- Debe tener `tracking_token`
- Si no tiene, generar uno

---

## 6. ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   ├── track/
│   │   └── [tracking_token]/
│   │       └── page.tsx               # Página pública de tracking
│   ├── checkout/
│   │   └── success/
│   │       └── page.tsx               # Modificar: agregar botón tracking
│   ├── admin/
│   │   └── orders/
│   │       └── [id]/
│   │           └── page.tsx           # Modificar: agregar sección shipping
│   └── api/
│       └── orders/
│           ├── [id]/
│           │   ├── shipping/
│           │   │   └── route.ts       # PUT - actualizar info shipping
│           │   └── tracking-url/
│           │       └── route.ts       # GET - obtener tracking URL
│           └── track/
│               └── [tracking_token]/
│                   └── route.ts       # GET - obtener info orden por token
├── components/
│   ├── OrderTimeline.tsx              # Timeline visual del pedido
│   └── admin/
│       └── ShippingInfoForm.tsx       # Formulario edición shipping
└── lib/
    └── tracking.ts                    # Lógica de tracking (generar URLs, etc.)
```

---

## 7. MIGRACIÓN DB

**Archivo:** `migrations/add_order_tracking.sql`

```sql
-- Agregar campos de tracking y shipping a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Generar tracking_token para órdenes existentes (UUID sin guiones)
UPDATE orders 
SET tracking_token = REPLACE(gen_random_uuid()::TEXT, '-', '') 
WHERE tracking_token IS NULL;

-- Comentario
COMMENT ON COLUMN orders.tracking_token IS 'Token único para acceso público a tracking (32 caracteres alfanuméricos)';
COMMENT ON COLUMN orders.shipping_status IS 'pending, preparing, shipped, delivered';
COMMENT ON COLUMN orders.shipping_provider IS 'dhl, fedex, null';
```

---

## 8. PRIORIZACIÓN DE IMPLEMENTACIÓN

### PASO 1: DB (30 min)
1. Crear y ejecutar migración `add_order_tracking.sql`
2. Verificar en Supabase que columnas se crearon
3. Verificar que tracking_token se generó para órdenes existentes

### PASO 2: API de tracking (1-2 horas)
1. `GET /api/orders/track/[tracking_token]` → devolver info orden
2. `GET /api/orders/[id]/tracking-url` → devolver tracking URL
3. `PUT /api/orders/[id]/shipping` → actualizar shipping info (admin)

### PASO 3: Página de tracking (2-3 horas)
1. Crear `/track/[tracking_token]/page.tsx`
2. Componente `OrderTimeline.tsx`
3. Estilos consistentes con Bagclue
4. Estados visuales (pending, preparing, shipped, delivered)
5. Link a DHL/FedEx
6. Responsive

### PASO 4: Admin shipping form (1-2 horas)
1. Modificar `/admin/orders/[id]/page.tsx`
2. Componente `ShippingInfoForm.tsx`
3. Select para `shipping_status`, `shipping_provider`
4. Inputs para `tracking_number`, `shipping_address`, `customer_phone`
5. Textarea para `notes`
6. Botón "Copiar link de tracking"

### PASO 5: Success page botón (30 min)
1. Modificar `/checkout/success/page.tsx`
2. Fetch tracking URL después de verificar pago
3. Mostrar botón "Ver seguimiento"
4. Mostrar link copiable

### PASO 6: Testing (1 hora)
1. Compra test completa
2. Admin marca como enviado
3. Verificar que tracking URL funciona
4. Verificar timeline
5. Verificar link externo DHL/FedEx

**Total estimado:** 6-9 horas (1 día)

---

## 9. CRITERIO DE CIERRE

### ✅ DB actualizada
- Migración ejecutada sin errores
- Todas las órdenes tienen `tracking_token`

### ✅ Tracking público funciona
- URL `/track/[token]` muestra orden correctamente
- Token inválido → 404
- Timeline muestra estados correctos
- Link a DHL/FedEx funciona

### ✅ Admin puede editar shipping
- Formulario de shipping en `/admin/orders/[id]`
- Puede cambiar `shipping_status`
- Puede asignar paquetería
- Puede agregar tracking number
- Al guardar, tracking URL se actualiza
- Puede copiar link de tracking

### ✅ Success page muestra tracking
- Después de pago exitoso, se muestra botón "Ver seguimiento"
- Link es copiable
- Click en botón → redirige a `/track/[token]`

### ✅ UX y diseño
- Página de tracking es elegante y clara
- Timeline es fácil de entender
- Responsive en mobile
- Colores consistentes con Bagclue
- Estados visuales claros

### ✅ Seguridad
- Token es único y no adivinable (UUID 32 chars)
- No se expone información sensible en URL
- Solo se muestra info de la orden específica

---

## 10. NO INCLUIDO EN ESTA FASE

❌ Cuentas de usuario  
❌ Login/logout  
❌ Historial de compras  
❌ Apartados  
❌ Perfil de cliente  
❌ Recuperar contraseña  
❌ Notificaciones email automáticas  
❌ Integración API DHL/FedEx (polling)  
❌ Webhooks de paquetería  
❌ Sistema de puntos  
❌ Reviews  
❌ Wishlist  

**Estos quedan para fases futuras.**

---

## 11. EJEMPLO REAL DE FLUJO

### Escenario: Cliente compra Chanel Classic Flap

**1. Compra:**
- Cliente agrega producto al carrito
- Checkout → paga con Stripe
- Orden creada con `tracking_token=a1b2c3d4e5f6...`
- Success page muestra: "Ver seguimiento de mi pedido"
- Cliente guarda link: `https://bagclue.vercel.app/track/a1b2c3d4e5f6...`

**2. Admin prepara envío:**
- Admin entra a `/admin/orders/12345`
- Ve orden con status `pending`
- Cambia `shipping_status` a `preparing`
- Guarda
- Cliente visita link → ve "✅ Pago confirmado, 🔄 Preparando envío"

**3. Admin envía pedido:**
- Admin entra a `/admin/orders/12345`
- Selecciona `shipping_provider`: DHL
- Ingresa `tracking_number`: 1234567890
- Cambia `shipping_status` a `shipped`
- Ingresa `shipping_address`: "Av. Reforma 123..."
- Guarda
- Sistema auto-genera `tracking_url`: `https://www.dhl.com.mx/...`

**4. Cliente rastrea:**
- Cliente visita link guardado
- Ve timeline:
  - ✅ Pago confirmado - 20 Abr, 10:31
  - ✅ Preparando envío - 21 Abr, 09:00
  - ✅ Enviado - 21 Abr, 14:00
  - 🔄 En camino - Última actualización: 22 Abr, 09:15
  - ⏸️ Entregado - Estimado: 25 Abr
- Ve botón "Ver en DHL →"
- Click → redirige a DHL con número de rastreo

**5. Producto entregado:**
- Admin entra a `/admin/orders/12345`
- Cambia `shipping_status` a `delivered`
- Guarda
- Cliente visita link → ve "✅ Entregado - 25 Abr, 11:30"

---

## 12. NOTAS TÉCNICAS

### 12.1 Tracking token format

```typescript
// Generar token (backend)
function generateTrackingToken(): string {
  return crypto.randomUUID().replace(/-/g, '')  // 32 chars alfanuméricos
}

// Validar token (backend)
function isValidTrackingToken(token: string): boolean {
  return /^[a-f0-9]{32}$/.test(token)
}
```

### 12.2 Tracking URL auto-generation

```typescript
function getTrackingUrl(provider: string, trackingNumber: string): string | null {
  switch (provider) {
    case 'dhl':
      return `https://www.dhl.com.mx/es/express/rastreo.html?AWB=${trackingNumber}`
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`
    default:
      return null
  }
}
```

### 12.3 Timeline logic

```typescript
interface TimelineEvent {
  status: 'completed' | 'current' | 'pending'
  label: string
  icon: string
  date?: string
  description?: string
}

function generateTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = []
  
  // 1. Pago confirmado (siempre completed)
  events.push({
    status: 'completed',
    label: 'Pago confirmado',
    icon: '✅',
    date: formatDate(order.created_at)
  })
  
  // 2-4. Estados según shipping_status
  const stages = ['preparing', 'shipped', 'delivered']
  const currentIndex = stages.indexOf(order.shipping_status || 'pending')
  
  stages.forEach((stage, index) => {
    let status: 'completed' | 'current' | 'pending'
    
    if (index < currentIndex) {
      status = 'completed'
    } else if (index === currentIndex) {
      status = 'current'
    } else {
      status = 'pending'
    }
    
    events.push({
      status,
      label: getStageLabel(stage),
      icon: getStageIcon(stage, status),
      date: status === 'completed' ? getStageDate(order, stage) : undefined
    })
  })
  
  return events
}
```

---

**FIN DEL DISEÑO FASE 4A**

**APROBADO PARA IMPLEMENTAR**

Timeline estimado: 6-9 horas (1 día)
