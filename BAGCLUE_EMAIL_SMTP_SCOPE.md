# BAGCLUE EMAIL SMTP — SCOPE TÉCNICO

**Fecha:** 2026-05-06 16:35 UTC  
**Prioridad:** FASE 1 PRE-LIVE (antes de Stripe Live)  
**Objetivo:** Emails transaccionales mínimos para ventas reales

---

## RESUMEN EJECUTIVO

**Decisión:** Implementar Email SMTP ANTES de activar Stripe Live  
**Motivo:** Cliente debe recibir confirmación profesional por email  
**Emails mínimos:** 3 (compra, apartado, tracking)  
**Proveedor:** Gmail/App Password para MVP → SendGrid/Resend futuro  
**Estimación:** 2-3 horas implementación + 1h testing

---

## 1. AUDITORÍA CÓDIGO EXISTENTE

### Sistema Email Actual
**Resultado:** ❌ NO existe

**Búsqueda realizada:**
```bash
grep -r "nodemailer\|transporter\|sendMail" src/
# Resultado: (vacío)
```

**Conclusión:**  
- NO hay sistema de email implementado
- NO hay librería email instalada
- Campos `customer_email` existen pero NO se usan para enviar

**Archivos que mencionan "email":**
- `LayawayButton.tsx` - form input email
- `ProfileForm.tsx` - form input email
- `LoginForm.tsx` - magic link email (Supabase auth)
- `orders` table - `customer_email` guardado
- `layaways` table - `customer_email` guardado

**Estado:** Infraestructura lista para agregar email system

---

## 2. AUDITORÍA WEBHOOK STRIPE

### Archivo: `src/app/api/stripe/webhook/route.ts`

**Función relevante:** `handleCheckoutCompleted()`

#### Líneas 126-155: Order Update
```typescript
// LOG 9: Resultado de actualizar orders
const { data: updatedOrder, error: orderError } = await supabaseAdmin
  .from('orders')
  .update({
    payment_status: 'paid',
    status: 'confirmed',
    stripe_payment_intent_id: session.payment_intent as string || null
  })
  .eq('id', order_id)
  .select()
  .single()

console.log('[WEBHOOK] 9. Resultado actualizar orders:', {
  success: !orderError,
  orderId: order_id,
  updatedFields: {
    payment_status: 'paid',
    status: 'confirmed',
    stripe_payment_intent_id: session.payment_intent
  },
  error: orderError?.message || null,
  errorDetails: orderError || null
})
```

**✅ Punto de integración identificado:**
- **Después de línea 155** (tras update successful)
- **Trigger:** `payment_status = 'paid'` confirmed
- **Acción:** Enviar Email #1 "Confirmación de compra"

**Datos disponibles:**
- `order_id` - ID orden
- `updatedOrder` - Orden completa con customer_email
- `session` - Stripe session con metadata

**Variables necesarias:**
- `updatedOrder.customer_email`
- `updatedOrder.order_id`
- `updatedOrder.total`
- `updatedOrder.tracking_token`

---

#### Líneas 101-124: Layaway Deposit Handler
```typescript
// Handle layaway payments (OLD SYSTEM)
if (metadata_type === 'layaway_deposit') {
  await handleLayawayDeposit(session)
  return
}
```

**Función:** `handleLayawayDeposit()` (líneas más abajo en mismo archivo)

**✅ Punto de integración identificado:**
- **Dentro de `handleLayawayDeposit()`** (tras update successful)
- **Trigger:** Layaway deposit paid
- **Acción:** Enviar Email #2 "Confirmación de apartado"

**Datos disponibles:**
- `session.metadata.layaway_id`
- Layaway record con customer_email, producto, amounts

---

## 3. AUDITORÍA ENDPOINT SHIPPING UPDATE

### Archivo: `src/app/api/orders/[id]/shipping/route.ts`

#### Líneas 150-160: Update Execution
```typescript
// Construir objeto de actualización
const updates: any = {}

if (customer_phone !== undefined) updates.customer_phone = customer_phone
if (shipping_address !== undefined) updates.shipping_address = shipping_address
if (shipping_status !== undefined) updates.shipping_status = shipping_status
if (shipping_provider !== undefined) updates.shipping_provider = shipping_provider
if (tracking_number !== undefined) updates.tracking_number = tracking_number
if (tracking_url !== undefined) updates.tracking_url = tracking_url
if (notes !== undefined) updates.notes = notes
```

**Líneas 165-170: Shipped timestamp**
```typescript
// Timestamps automáticos (REGLA B5, C2)
if (shipping_status === 'shipped' && !updates.shipped_at) {
  updates.shipped_at = new Date().toISOString()
}
```

**✅ Punto de integración identificado:**
- **Después de línea 185** (tras `supabaseAdmin.from('orders').update()` successful)
- **Trigger:** `shipping_status = 'shipped'` confirmed
- **Acción:** Enviar Email #3 "Tracking enviado"

**Datos disponibles:**
- `orderId` - ID orden
- `updates.shipping_provider` - Paquetería
- `updates.tracking_number` - Número tracking
- `updates.tracking_url` - URL tracking
- Order record con `customer_email`, `tracking_token`

---

## 4. LIBRERÍA PROPUESTA

### Opción 1: nodemailer (Recomendado para MVP)

**Pros:**
- ✅ Estándar Node.js
- ✅ Funciona con Gmail SMTP
- ✅ 0 dependencies externas (SMTP directo)
- ✅ Templates HTML personalizados
- ✅ Ya tenemos app password disponible

**Cons:**
- ⚠️ Requiere SMTP config manual
- ⚠️ Gmail límite ~500 emails/día

**Instalación:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Tamaño:** ~900KB (aceptable)

---

### Opción 2: Resend (Escalable, Futuro)

**Pros:**
- ✅ API simple
- ✅ React Email templates
- ✅ Analytics built-in
- ✅ Sin límites bajos

**Cons:**
- ❌ Requiere API key nueva
- ❌ Signup/verificación adicional
- ❌ Costo si >3000 emails/mes

**Recomendación:** Migrar después si volumen crece

---

### Opción 3: SendGrid

**Pros:**
- ✅ 100 emails gratis/día
- ✅ Infraestructura robusta

**Cons:**
- ❌ Signup/verificación
- ❌ Setup adicional

---

### Decisión: nodemailer para MVP

**Motivos:**
1. Gmail app password ya disponible
2. Script `send_email.mjs` funcional en workspace
3. Cero signup adicional
4. Deployment inmediato

**Migración futura a Resend/SendGrid:** Fácil (misma interfaz)

---

## 5. VARIABLES SMTP NECESARIAS

### Production Environment (Vercel)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kepler@usdtcapital.es
SMTP_PASSWORD=[app_password_from_contraseñas]
SMTP_FROM_EMAIL=kepler@usdtcapital.es
SMTP_FROM_NAME=Bagclue
```

**Ubicación password:** `contraseñas/correo_kepler.md`

**⚠️ Alternativa con email de marca:**
```bash
SMTP_FROM_EMAIL=info@kepleragents.com
SMTP_FROM_NAME=Bagclue
```
*(Requiere configurar relay o SMTP Hostinger)*

---

### Local Development (.env.local)

```bash
# Copiar las mismas variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kepler@usdtcapital.es
SMTP_PASSWORD=[app_password]
SMTP_FROM_EMAIL=kepler@usdtcapital.es
SMTP_FROM_NAME=Bagclue
```

---

## 6. SEGURIDAD

### ❌ NO HACER

1. **NO imprimir secretos:**
   ```typescript
   // ❌ PROHIBIDO
   console.log('SMTP Password:', process.env.SMTP_PASSWORD)
   ```

2. **NO guardar en repo:**
   ```typescript
   // ❌ PROHIBIDO
   const SMTP_PASSWORD = "abcd1234" // hardcoded
   ```

3. **NO commitear .env:**
   ```bash
   # Verificar .gitignore
   .env.local
   .env*.local
   ```

4. **NO usar password Gmail normal:**
   - Usar **App Password** generado
   - NO usar password login Gmail

---

### ✅ SÍ HACER

1. **Usar variables entorno:**
   ```typescript
   const password = process.env.SMTP_PASSWORD!
   ```

2. **Log seguro:**
   ```typescript
   console.log('Email sent:', {
     to: email,
     subject: subject,
     // NO incluir password/contenido sensible
   })
   ```

3. **Validar variables al inicio:**
   ```typescript
   if (!process.env.SMTP_HOST) {
     throw new Error('SMTP_HOST not configured')
   }
   ```

4. **Encriptar en Vercel:**
   - Vercel maneja encriptación automática
   - Variables NO se exponen en logs

---

## 7. TEMPLATES HTML MINIMALISTAS

### Estructura Base

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset básico */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      background-color: #FFFBF8;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      letter-spacing: 0.3em;
      color: #0B0B0B;
      font-weight: normal;
    }
    .content {
      background: white;
      padding: 32px 24px;
      border: 1px solid rgba(232, 90, 154, 0.15);
      border-radius: 0;
    }
    .button {
      display: inline-block;
      background: #E85A9A;
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 0;
      font-weight: 500;
      margin: 16px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      color: rgba(11, 11, 11, 0.5);
      font-size: 13px;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background: rgba(232, 90, 154, 0.1);
      margin: 24px 0;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      color: #0B0B0B;
      margin: 0 0 16px 0;
      font-weight: normal;
    }
    p {
      color: rgba(11, 11, 11, 0.8);
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(11, 11, 11, 0.05);
    }
    .detail-label {
      color: rgba(11, 11, 11, 0.5);
      font-size: 13px;
    }
    .detail-value {
      color: #0B0B0B;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BAGCLUE</div>
    </div>
    <div class="content">
      <!-- CONTENT AQUÍ -->
    </div>
    <div class="footer">
      <p>Bagclue · Piezas de lujo seleccionadas con intención</p>
      <p>Instagram: <a href="https://instagram.com/salebybagcluemx" style="color: #E85A9A;">@salebybagcluemx</a></p>
    </div>
  </div>
</body>
</html>
```

---

### Email #1: Confirmación Compra

**Trigger:** `payment_status = 'paid'` en webhook  
**To:** `customer_email`  
**Subject:** `✅ Confirmación de pedido #{{order_id}} - Bagclue`

```html
<h1>¡Gracias por tu compra!</h1>
<p>Hola {{customer_name}},</p>
<p>Confirmamos que recibimos tu pago correctamente.</p>

<div class="divider"></div>

<div class="detail-row">
  <span class="detail-label">Número de pedido</span>
  <span class="detail-value">#{{order_id}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Producto</span>
  <span class="detail-value">{{product_name}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Total pagado</span>
  <span class="detail-value">${{total}} {{currency}}</span>
</div>

<div class="divider"></div>

<h3 style="font-size: 16px; margin: 24px 0 12px 0;">Próximo paso</h3>
<p>Por favor confirma tu dirección de envío en tu cuenta:</p>

<a href="{{account_url}}" class="button">Confirmar dirección</a>

<p style="font-size: 13px; color: rgba(11,11,11,0.5); margin-top: 20px;">
  También puedes hacer seguimiento público de tu pedido en:<br>
  <a href="{{tracking_url}}" style="color: #E85A9A;">{{tracking_url}}</a>
</p>
```

**Variables:**
- `{{customer_name}}` - del order o "Cliente"
- `{{order_id}}` - order.order_id
- `{{product_name}}` - join order_items → products
- `{{total}}` - order.total
- `{{currency}}` - order.currency
- `{{account_url}}` - `https://bagclue.vercel.app/account/orders/${orderId}`
- `{{tracking_url}}` - `https://bagclue.vercel.app/track/${tracking_token}`

---

### Email #2: Confirmación Apartado

**Trigger:** Layaway deposit paid en webhook  
**To:** `customer_email`  
**Subject:** `✅ Apartado confirmado - Bagclue`

```html
<h1>Apartado confirmado</h1>
<p>Hola {{customer_name}},</p>
<p>Tu pieza ha sido apartada exitosamente.</p>

<div class="divider"></div>

<div class="detail-row">
  <span class="detail-label">Producto</span>
  <span class="detail-value">{{product_name}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Precio total</span>
  <span class="detail-value">${{total_price}} {{currency}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Depósito pagado</span>
  <span class="detail-value">${{deposit_amount}} {{currency}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Saldo restante</span>
  <span class="detail-value">${{balance_amount}} {{currency}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Vence</span>
  <span class="detail-value">{{expires_at}}</span>
</div>

<div class="divider"></div>

<p>Tu pieza está reservada. Puedes completar el pago en tu cuenta:</p>

<a href="{{layaway_url}}" class="button">Ver mi apartado</a>

<p style="font-size: 13px; color: rgba(11,11,11,0.5); margin-top: 20px;">
  Recuerda completar el pago antes de la fecha de vencimiento para no perder tu reserva.
</p>
```

**Variables:**
- `{{customer_name}}` - layaway.customer_name
- `{{product_name}}` - producto apartado
- `{{total_price}}` - layaway.product_price
- `{{deposit_amount}}` - layaway.deposit_amount
- `{{balance_amount}}` - layaway.balance_amount
- `{{currency}}` - layaway.currency
- `{{expires_at}}` - layaway.expires_at formatted
- `{{layaway_url}}` - `https://bagclue.vercel.app/layaway/${layaway_token}` o `/account/layaways`

---

### Email #3: Tracking Enviado

**Trigger:** `shipping_status = 'shipped'` en PUT `/api/orders/[id]/shipping`  
**To:** `customer_email`  
**Subject:** `🚚 Tu pedido ha sido enviado - Bagclue`

```html
<h1>Tu pedido está en camino</h1>
<p>Hola {{customer_name}},</p>
<p>Tu pedido ha sido despachado y está en camino.</p>

<div class="divider"></div>

<div class="detail-row">
  <span class="detail-label">Número de pedido</span>
  <span class="detail-value">#{{order_id}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Paquetería</span>
  <span class="detail-value">{{shipping_provider}}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Número de rastreo</span>
  <span class="detail-value">{{tracking_number}}</span>
</div>

<div class="divider"></div>

<p>Puedes hacer seguimiento de tu envío aquí:</p>

<a href="{{tracking_url}}" class="button">Rastrear envío</a>

<p style="font-size: 13px; color: rgba(11,11,11,0.5); margin-top: 20px;">
  Tiempo estimado de entrega: 3-5 días hábiles.<br>
  También puedes ver el estado en tu cuenta: <a href="{{account_url}}" style="color: #E85A9A;">{{account_url}}</a>
</p>
```

**Variables:**
- `{{customer_name}}` - del order
- `{{order_id}}` - order.order_id
- `{{shipping_provider}}` - "DHL", "FedEx", "Otra paquetería"
- `{{tracking_number}}` - order.tracking_number
- `{{tracking_url}}` - order.tracking_url (externo paquetería)
- `{{account_url}}` - `https://bagclue.vercel.app/account/orders/${orderId}`

---

## 8. FALLBACK SI FALLA EMAIL

### Principio: NO romper flujo si email falla

**Implementación:**

```typescript
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    })
    
    // Log seguro (NO incluir contenido completo)
    console.log('[EMAIL] Sent successfully:', {
      to,
      subject,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    })
    
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    // Log error pero NO throw
    console.error('[EMAIL] Failed to send:', {
      to,
      subject,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    // NO lanzar error - sistema sigue funcional
    return { success: false, error: error.message }
  }
}
```

**Integración en webhook:**

```typescript
// Tras actualizar order a paid
const emailResult = await sendEmail(
  updatedOrder.customer_email,
  `✅ Confirmación de pedido #${orderId}`,
  generateOrderConfirmationHTML(updatedOrder)
)

// NO validar emailResult.success
// Webhook continúa exitoso aunque email falle
// Cliente accede info vía /account/orders
```

**Beneficios:**
- ✅ Webhook NO falla si SMTP down
- ✅ Order se crea correctamente
- ✅ Cliente accede info vía account panel
- ✅ Log captura error para debug

---

## 9. TESTING

### Fase 1: Test Local

**Setup:**
1. Copiar variables SMTP a `.env.local`
2. Crear script test `src/lib/email/test-email.ts`:

```typescript
import { sendOrderConfirmationEmail } from './mailer'

async function test() {
  const mockOrder = {
    customer_email: 'jhonatan@example.com', // TU EMAIL
    customer_name: 'Test Cliente',
    order_id: 'TEST-001',
    total: 1000,
    currency: 'MXN',
    tracking_token: 'test-token-123',
    items: [
      { product_name: 'Chanel Classic Flap Negro', quantity: 1, price: 1000 }
    ]
  }
  
  const result = await sendOrderConfirmationEmail(mockOrder)
  console.log('Test result:', result)
}

test()
```

3. Ejecutar:
```bash
npx ts-node src/lib/email/test-email.ts
```

4. **Validar:**
   - ✅ Email llega a inbox (NO spam)
   - ✅ Links funcionan
   - ✅ Formato se ve bien en mobile
   - ✅ Sender name "Bagclue" visible

---

### Fase 2: Test Staging (Si aplica)

**Si hay ambiente staging:**
1. Deploy código email a staging
2. Hacer compra test con Stripe test mode
3. Validar email confirmación llega
4. Validar links apuntan a staging

---

### Fase 3: Test Production (Controlado)

**Después de deploy production:**

1. **Producto test:**
   - Crear producto `is_published=false`, precio $20 MXN
   - URL directa: `/catalogo/test-email-validation`

2. **Compra test real:**
   - Pagar con tarjeta real $20 MXN
   - Validar email confirmación llega
   - Validar links funcionan

3. **Validar campos:**
   - Nombre correcto
   - Order ID correcto
   - Total correcto
   - Links `/account/orders/[id]` y `/track/[token]` funcionan

4. **Refund:**
   - Stripe Dashboard → refund $20 MXN

---

### Fase 4: Test Apartado

1. Click "Apartar" en producto test
2. Completar form + pagar depósito
3. Validar email apartado llega
4. Validar link layaway funciona

---

### Fase 5: Test Tracking

1. Admin login
2. Ir a `/admin/envios`
3. Marcar pedido test como "Enviado"
4. Agregar tracking test: DHL, TEST-123456789
5. Validar email tracking llega
6. Validar links funcionan

---

## 10. QUÉ NO TOCAR

### ❌ Prohibido Modificar

**Stripe:**
- ❌ NO cambiar a live keys (se hace después)
- ❌ NO modificar webhook signature validation
- ❌ NO cambiar estructura metadata

**Database:**
- ❌ NO modificar schema orders
- ❌ NO modificar schema layaways
- ❌ NO agregar columnas nuevas
- ❌ NO modificar RLS policies

**Checkout Logic:**
- ❌ NO modificar `/api/checkout/create-session`
- ❌ NO modificar flow carrito → checkout
- ❌ NO modificar cálculo totales

**Admin UI:**
- ❌ NO modificar `/admin/envios` UI
- ❌ NO modificar `/admin/productos`
- ❌ NO agregar botones "Reenviar email"

**Customer Panel:**
- ❌ NO modificar `/account/orders` UI
- ❌ NO modificar `/account/layaways` UI

---

### ✅ Permitido Modificar

**Nuevo código solamente:**
- ✅ Crear `/lib/email/` directory
- ✅ Crear `mailer.ts` transport
- ✅ Crear templates HTML
- ✅ Agregar `sendEmail()` calls en 3 puntos:
  1. Webhook tras order update
  2. Webhook tras layaway deposit
  3. Shipping route tras update shipped

**Modificaciones mínimas existente:**
- ✅ Agregar 3-5 líneas en webhook tras `updatedOrder`
- ✅ Agregar 3-5 líneas en layaway handler
- ✅ Agregar 3-5 líneas en shipping route

**Variables entorno:**
- ✅ Agregar 6 variables SMTP a Vercel

---

## PLAN DE IMPLEMENTACIÓN

### Paso 1: Setup Base (30 min)

1. **Instalar nodemailer:**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. **Crear estructura:**
   ```
   src/lib/email/
     ├── mailer.ts           # Transport config
     ├── templates/
     │   ├── order-confirmed.ts
     │   ├── layaway-confirmed.ts
     │   └── order-shipped.ts
     └── send.ts             # Helper functions
   ```

3. **Copiar app password:**
   - Leer `contraseñas/correo_kepler.md`
   - Agregar a `.env.local` local
   - NO commitear

---

### Paso 2: Implementar Transport (15 min)

**Archivo:** `src/lib/email/mailer.ts`

```typescript
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!),
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!
  }
})

// Validar config al inicio
transporter.verify((error, success) => {
  if (error) {
    console.error('[EMAIL] SMTP config error:', error.message)
  } else {
    console.log('[EMAIL] SMTP ready to send')
  }
})
```

---

### Paso 3: Templates HTML (1 hora)

**Archivo:** `src/lib/email/templates/order-confirmed.ts`

```typescript
export function generateOrderConfirmationHTML(data: {
  customer_name: string
  order_id: string
  product_name: string
  total: number
  currency: string
  tracking_token: string
}): string {
  const accountUrl = `https://bagclue.vercel.app/account/orders/${data.order_id}`
  const trackingUrl = `https://bagclue.vercel.app/track/${data.tracking_token}`
  
  return `
<!DOCTYPE html>
<html lang="es">
... (base template + content de Email #1)
  `
}
```

*Repetir para layaway-confirmed y order-shipped*

---

### Paso 4: Helper Send (15 min)

**Archivo:** `src/lib/email/send.ts`

```typescript
import { transporter } from './mailer'

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    })
    
    console.log('[EMAIL] Sent:', {
      to,
      subject,
      messageId: info.messageId
    })
    
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('[EMAIL] Failed:', {
      to,
      subject,
      error: error.message
    })
    return { success: false, error: error.message }
  }
}
```

---

### Paso 5: Integración Webhook (30 min)

**Archivo:** `src/app/api/stripe/webhook/route.ts`

**Línea ~155 (tras update order successful):**

```typescript
console.log('[WEBHOOK] 9. Resultado actualizar orders:', { ... })

if (orderError) {
  console.error('[WEBHOOK] ERROR updating order:', orderError)
  return
}

// ========== EMAIL INTEGRATION START ==========
try {
  // Obtener items para email
  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select('product_name, quantity, price')
    .eq('order_id', order_id)
  
  const productName = orderItems?.map(i => i.product_name).join(', ') || 'Producto'
  
  await sendEmail(
    updatedOrder.customer_email,
    `✅ Confirmación de pedido #${orderId}`,
    generateOrderConfirmationHTML({
      customer_name: updatedOrder.customer_name || 'Cliente',
      order_id: orderId,
      product_name: productName,
      total: updatedOrder.total,
      currency: updatedOrder.currency,
      tracking_token: updatedOrder.tracking_token
    })
  )
} catch (emailError: any) {
  // NO fallar webhook si email falla
  console.error('[WEBHOOK] Email send failed (non-critical):', emailError.message)
}
// ========== EMAIL INTEGRATION END ==========
```

**Similar para `handleLayawayDeposit()` (Email #2)**

---

### Paso 6: Integración Shipping (30 min)

**Archivo:** `src/app/api/orders/[id]/shipping/route.ts`

**Línea ~185 (tras update shipping successful):**

```typescript
const { data: order, error: updateError } = await supabaseAdmin
  .from('orders')
  .update(updates)
  .eq('id', orderId)
  .select()
  .single()

if (updateError) {
  return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
}

// ========== EMAIL INTEGRATION START ==========
if (shipping_status === 'shipped' && order.customer_email) {
  try {
    await sendEmail(
      order.customer_email,
      `🚚 Tu pedido ha sido enviado - Bagclue`,
      generateOrderShippedHTML({
        customer_name: order.customer_name || 'Cliente',
        order_id: order.order_id,
        shipping_provider: order.shipping_provider === 'dhl' ? 'DHL' : 
                           order.shipping_provider === 'fedex' ? 'FedEx' : 
                           'Paquetería',
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url || `https://bagclue.vercel.app/track/${order.tracking_token}`
      })
    )
  } catch (emailError: any) {
    console.error('[SHIPPING] Email send failed (non-critical):', emailError.message)
  }
}
// ========== EMAIL INTEGRATION END ==========

return NextResponse.json({ order })
```

---

### Paso 7: Variables Vercel (15 min)

1. https://vercel.com/kepleragents/bagclue/settings/environment-variables
2. Tab "Production"
3. Agregar 6 variables:
   - `SMTP_HOST` → `smtp.gmail.com`
   - `SMTP_PORT` → `587`
   - `SMTP_USER` → `kepler@usdtcapital.es`
   - `SMTP_PASSWORD` → [app_password]
   - `SMTP_FROM_EMAIL` → `kepler@usdtcapital.es`
   - `SMTP_FROM_NAME` → `Bagclue`
4. Save
5. Trigger redeploy

---

### Paso 8: Testing (1 hora)

1. Test local script
2. Deploy production
3. Compra test $20 MXN
4. Validar email llega
5. Apartado test
6. Validar email llega
7. Marcar shipped test
8. Validar email llega
9. Refund

---

## ESTIMACIÓN FINAL

**Implementación:** 2.5 horas  
**Testing:** 1 hora  
**Total:** 3.5 horas

**Desglose:**
- Setup base: 30 min
- Transport: 15 min
- Templates HTML (3): 1 hora
- Helper send: 15 min
- Integración webhook: 30 min
- Integración shipping: 30 min
- Variables Vercel: 15 min
- Testing completo: 1 hora

---

## ROLLBACK

**Si algo falla:**

1. **Revertir commit:**
   ```bash
   git revert [commit_hash]
   git push origin main
   ```

2. **Remover variables Vercel (opcional):**
   - Dashboard → eliminar 6 variables SMTP
   - Redeploy

3. **Sistema funciona sin emails:**
   - Webhook procesa normal
   - Orders se crean
   - Cliente accede info vía `/account/orders`

**Tiempo rollback:** 5-10 minutos

---

## CHECKLIST PRE-IMPLEMENTACIÓN

**Requisitos:**
- [ ] App password Gmail disponible (`contraseñas/correo_kepler.md`)
- [ ] Acceso Vercel Dashboard team kepleragents
- [ ] Script `workspace/send_email.mjs` funcional (referencia)

**Validaciones:**
- [ ] Webhook actual funciona 100%
- [ ] Shipping route funciona 100%
- [ ] Layaway flow funciona 100%
- [ ] Orders tienen `customer_email` guardado

---

## DECISIÓN IMPLEMENTACIÓN

**Estado:** 📋 **SCOPE TÉCNICO COMPLETO - ESPERANDO APROBACIÓN**

**NO implementar hasta instrucción explícita.**

**Documento preparado:** 2026-05-06 16:40 UTC  
**Siguiente paso:** Aprobación Jhonatan para ejecutar implementación

---

**Después de Email SMTP completo → Fase 2: Stripe Live Keys**
