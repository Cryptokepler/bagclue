# BAGCLUE PRE-LIVE CHECKLIST — PREPARACIÓN VENTAS REALES

**Fecha:** 2026-05-06 16:30 UTC  
**Estado:** 📋 SCOPE & PLAN DE EJECUCIÓN  
**Objetivo:** Preparar Bagclue para ventas reales con Stripe Live + Email SMTP

---

## RESUMEN EJECUTIVO

**Scope:** Migración de test mode a live mode para ventas reales  
**Componentes:** Stripe Live, Email SMTP, Variables Vercel, QA pre-live  
**Riesgos identificados:** 5 críticos  
**Plan:** 5 fases incrementales  
**Rollback:** Plan completo si falla

---

## ESTADO ACTUAL

### Stripe
- ✅ Test mode funcional
- ✅ Webhook test configurado
- ❌ Live keys NO configuradas
- ❌ Webhook live NO configurado

### Email
- ❌ SMTP NO configurado
- ❌ Emails transaccionales NO funcionan
- ⚠️ Cliente NO recibe confirmación compra

### Variables Vercel
- ✅ `.env.local` local con test keys
- ⚠️ Vercel production con test keys (revisar)
- ❌ Live keys NO configuradas

### Testing
- ✅ Test mode QA 18/18 PASS
- ❌ Live mode NO testeado

---

## FASE 1: STRIPE LIVE KEYS

### 1.1. Variables Necesarias

#### Current (Test Mode)
```bash
# .env.local / Vercel
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

#### Required (Live Mode)
```bash
# Vercel Production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ← LIVE
STRIPE_SECRET_KEY=sk_live_...                    # ← LIVE
STRIPE_WEBHOOK_SECRET=whsec_live_...             # ← LIVE
```

**Ubicación variables:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Frontend visible, público
- `STRIPE_SECRET_KEY` - Backend only, privado
- `STRIPE_WEBHOOK_SECRET` - Backend only, privado

---

### 1.2. Obtener Live Keys

#### Paso 1: Stripe Dashboard
**URL:** https://dashboard.stripe.com/  
**Acción:**
1. Login cuenta Bagclue
2. Toggle "Test mode" → OFF (switch a Live)
3. Ir a: Developers → API keys
4. Copiar:
   - **Publishable key:** `pk_live_...`
   - **Secret key:** `sk_live_...` (click "Reveal")

**Requisito:** Cuenta Stripe verificada (KYC completo)

**⚠️ Si aparece "Activate account":**
- Completar verificación negocio
- Agregar bank account
- Confirmar identidad
- Proceso puede tomar 1-3 días

---

### 1.3. Webhook Live

#### Current Webhook (Test)
- **URL:** https://bagclue.vercel.app/api/stripe/webhook
- **Secret:** `whsec_test_...`
- **Events:** `checkout.session.completed`

#### Setup Webhook Live
**Stripe Dashboard:**
1. Developers → Webhooks
2. Toggle "Test mode" → OFF
3. Click "+ Add endpoint"
4. **Endpoint URL:** `https://bagclue.vercel.app/api/stripe/webhook`
5. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded` (opcional)
   - ✅ `payment_intent.payment_failed` (opcional)
6. Click "Add endpoint"
7. **Copiar webhook secret:** `whsec_live_...`

**⚠️ CRÍTICO:** Endpoint URL debe ser idéntico a test (mismo path `/api/stripe/webhook`)

---

### 1.4. Verificar Código Actual

#### Archivos que usan Stripe

**`src/app/api/checkout/create-session/route.ts`**
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... });
```
✅ Usa variable entorno correcta

**`src/app/api/stripe/webhook/route.ts`**
```typescript
const sig = headers().get('stripe-signature');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```
✅ Usa variable entorno correcta

**Frontend (client components)**
```typescript
// Usa NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
✅ Usa variable entorno correcta

**Conclusión:** Código NO requiere cambios. Solo actualizar variables entorno.

---

### 1.5. Test Controlado Live

#### Opción 1: Compra Real Pequeña ($1 USD / $20 MXN)
**Producto test:**
- Crear producto "Test Live Payment" 
- Precio: $20 MXN
- `is_published: false` (NO visible público)
- Solo accesible vía URL directa admin

**Test card REAL (usar tarjeta personal):**
- Card number: [tu tarjeta real]
- Monto cobrado: $20 MXN + fees Stripe
- Orden creada en DB
- Webhook recibido

**Rollback:** Refund desde Stripe Dashboard

---

#### Opción 2: Stripe Test Cards en Live (NO funciona)
❌ Test cards (`4242...`) NO funcionan en live mode  
✅ Solo tarjetas reales funcionan en live

---

### 1.6. Rollback a Test Mode

**Si algo falla:**

1. **Vercel Dashboard:**
   - Environment Variables → Production
   - Cambiar back a test keys:
     ```
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_test_...
     ```
   - Redeploy (auto-trigger)

2. **Validar:**
   - Test card `4242...` funciona de nuevo
   - Checkout procesa

**Tiempo rollback:** ~2-3 minutos (redeploy Vercel)

---

### 1.7. Checklist Stripe Live

**Pre-requisitos:**
- [ ] Cuenta Stripe verificada (KYC completo)
- [ ] Bank account conectado
- [ ] Business info completo
- [ ] Test mode funcionando 100%

**Ejecución:**
- [ ] Obtener `pk_live_...` desde Stripe Dashboard
- [ ] Obtener `sk_live_...` desde Stripe Dashboard
- [ ] Crear webhook live endpoint
- [ ] Obtener `whsec_live_...` del webhook
- [ ] Guardar las 3 variables (NO commitear)
- [ ] Actualizar Vercel production environment variables
- [ ] Esperar redeploy automático (~2min)
- [ ] Validar deployment exitoso
- [ ] Test compra controlada $20 MXN con tarjeta real
- [ ] Verificar webhook recibido en Stripe Dashboard
- [ ] Verificar orden creada en Supabase
- [ ] Verificar payment_status = 'paid'
- [ ] (Opcional) Refund test payment

**Rollback si falla:**
- [ ] Revertir a test keys en Vercel
- [ ] Esperar redeploy
- [ ] Validar test card funciona

---

## FASE 2: EMAIL SMTP

### 2.1. Proveedor Recomendado

#### Opción 1: Gmail SMTP (Rápido, Ya Disponible)
**Pros:**
- ✅ Ya tienes cuenta `kepler@usdtcapital.es`
- ✅ App password ya existe (`contraseñas/correo_kepler.md`)
- ✅ SMTP configurado: `smtp.gmail.com:587`
- ✅ Script `send_email.mjs` funcional

**Cons:**
- ⚠️ Límite ~500 emails/día
- ⚠️ Puede marcar como spam si volumen alto

**Recomendación:** Usar para MVP/launch inicial

---

#### Opción 2: Gmail SMTP + Alias Bagclue
**Email remitente:** `info@kepleragents.com` (Hostinger Free Business Email)  
**SMTP:** Hostinger o relay vía Gmail  
**Pro:** Email de marca profesional  
**Con:** Requiere configuración adicional Hostinger

---

#### Opción 3: SendGrid (Escalable, Futuro)
**Pros:**
- ✅ 100 emails gratis/día
- ✅ Infraestructura robusta
- ✅ Analytics + deliverability

**Cons:**
- ❌ Requiere signup + verificación
- ❌ Setup adicional

**Recomendación:** Migrar después si volumen crece >100 emails/día

---

### 2.2. Variables SMTP (Gmail)

```bash
# Vercel Production Environment Variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kepler@usdtcapital.es
SMTP_PASSWORD=[app_password_from_contraseñas]
EMAIL_FROM=kepler@usdtcapital.es
EMAIL_FROM_NAME=Bagclue
```

**Ubicación app password:** `contraseñas/correo_kepler.md`

**⚠️ CRÍTICO:** 
- NO commitear passwords
- Usar Vercel encrypted environment variables
- Password es **App Password** (NO password Gmail normal)

---

### 2.3. Emails Transaccionales Requeridos

#### 1. Confirmación de Compra
**Trigger:** Webhook `checkout.session.completed` → order created  
**To:** `customer_email` (de order)  
**Subject:** `✅ Confirmación de pedido #{{order_id}} - Bagclue`  
**Content:**
- Número de orden
- Producto(s) comprado(s)
- Total pagado
- Próximos pasos: "Confirma tu dirección de envío"
- Link: `/account/orders/{{order_id}}`
- Link tracking público: `/track/{{tracking_token}}`

**Template:** HTML básico + plain text fallback

---

#### 2. Confirmación de Apartado
**Trigger:** POST `/api/layaways/create` → layaway created  
**To:** `customer_email` (de layaway)  
**Subject:** `✅ Apartado confirmado - Bagclue`  
**Content:**
- Producto apartado
- Depósito pagado
- Saldo restante
- Fecha límite
- Link seguimiento: `/layaway/{{layaway_token}}`

**Template:** HTML básico + plain text fallback

---

#### 3. Actualización de Envío - Preparando
**Trigger:** Admin marca "Preparando" → order.shipping_status = 'preparing'  
**To:** `customer_email` (de order)  
**Subject:** `📦 Tu pedido está siendo preparado - Bagclue`  
**Content:**
- Número orden
- Estado: "Preparando envío"
- Próximo paso: "Recibirás tracking cuando despache"

---

#### 4. Tracking Enviado
**Trigger:** Admin marca "Enviado" → order.shipping_status = 'shipped'  
**To:** `customer_email` (de order)  
**Subject:** `🚚 Tu pedido ha sido enviado - Bagclue`  
**Content:**
- Número orden
- Paquetería: {{shipping_provider}}
- Número tracking: {{tracking_number}}
- Link tracking externo: {{tracking_url}}
- Link tracking interno: `/track/{{tracking_token}}`
- Tiempo estimado entrega: 3-5 días hábiles (genérico)

---

#### 5. Entregado
**Trigger:** Admin marca "Entregado" → order.shipping_status = 'delivered'  
**To:** `customer_email` (de order)  
**Subject:** `✅ Tu pedido ha sido entregado - Bagclue`  
**Content:**
- Número orden
- Estado: "Entregado"
- Agradecimiento
- Encuesta satisfacción (opcional, futuro)
- Link Instagram para compartir: https://instagram.com/salebybagcluemx

---

### 2.4. Implementación Email

#### Ubicación Código

**Opción 1: Nuevo Directorio `/lib/email/`**
```
src/lib/email/
  ├── mailer.ts           # SMTP transport config
  ├── templates/
  │   ├── order-confirmed.tsx      # Email 1
  │   ├── layaway-confirmed.tsx    # Email 2
  │   ├── order-preparing.tsx      # Email 3
  │   ├── order-shipped.tsx        # Email 4
  │   └── order-delivered.tsx      # Email 5
  └── send.ts             # Helper sendEmail(to, subject, template)
```

**Opción 2: Usar Script Existente**
```
workspace/send_email.mjs → adaptar como module
```

---

#### Trigger Points

**1. Order Confirmed**
```typescript
// src/app/api/stripe/webhook/route.ts
if (event.type === 'checkout.session.completed') {
  // ... create order ...
  await sendEmail({
    to: customer_email,
    subject: `Confirmación de pedido #${orderId}`,
    template: 'order-confirmed',
    data: { orderId, items, total, trackingToken }
  });
}
```

**2. Layaway Confirmed**
```typescript
// src/app/api/layaways/create/route.ts
const layaway = await createLayaway(...);
await sendEmail({
  to: customer_email,
  subject: 'Apartado confirmado - Bagclue',
  template: 'layaway-confirmed',
  data: { product, deposit, balance, token }
});
```

**3-5. Order Status Updates**
```typescript
// src/app/api/orders/[id]/shipping/route.ts
// Tras actualizar shipping_status
if (shipping_status === 'preparing') {
  await sendEmail({ ... template: 'order-preparing' });
}
if (shipping_status === 'shipped') {
  await sendEmail({ ... template: 'order-shipped' });
}
if (shipping_status === 'delivered') {
  await sendEmail({ ... template: 'order-delivered' });
}
```

---

### 2.5. Templates HTML (Minimalistas)

#### Estructura Base
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, sans-serif; background: #FFFBF8; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-family: Playfair Display; font-size: 24px; color: #0B0B0B; }
    .content { background: white; padding: 32px; border: 1px solid #E85A9A20; }
    .button { background: #E85A9A; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; }
    .footer { text-align: center; margin-top: 32px; color: #0B0B0B60; font-size: 14px; }
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
      <p>Bagclue - Piezas de lujo seleccionadas con intención</p>
      <p>Instagram: @salebybagcluemx</p>
    </div>
  </div>
</body>
</html>
```

---

### 2.6. Testing Email

#### Test Local
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});
transport.sendMail({
  from: '\"Bagclue\" <kepler@usdtcapital.es>',
  to: 'jhonatan@example.com',
  subject: 'Test Email Bagclue',
  html: '<h1>Test OK</h1>'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Sent:', info.messageId);
});
"
```

#### Test Production
1. Deploy con variables SMTP configuradas
2. Hacer compra test
3. Verificar email llega a inbox
4. Verificar NO va a spam
5. Verificar links funcionan

---

### 2.7. Checklist Email SMTP

**Pre-requisitos:**
- [ ] App password Gmail disponible (`contraseñas/correo_kepler.md`)
- [ ] Cuenta `kepler@usdtcapital.es` activa
- [ ] Script `send_email.mjs` funcional

**Implementación:**
- [ ] Crear `/lib/email/mailer.ts` con nodemailer transport
- [ ] Crear templates HTML 5 emails
- [ ] Integrar sendEmail en webhook order creation
- [ ] Integrar sendEmail en layaway creation
- [ ] Integrar sendEmail en order status updates (3 triggers)
- [ ] Agregar variables SMTP a Vercel production
- [ ] Deploy código nuevo
- [ ] Test local send_email.mjs → inbox OK
- [ ] Test production compra → email confirmación llega
- [ ] Validar links en email funcionan
- [ ] Validar NO va a spam

**Rollback si falla:**
- [ ] Revertir commit email integration
- [ ] Redeploy
- [ ] Sistema funciona sin emails (cliente usa `/account/orders`)

---

## FASE 3: VARIABLES DE ENTORNO VERCEL

### 3.1. Revisar Variables Actuales

#### Comando
```bash
# Listar variables Vercel (requiere Vercel CLI autenticado)
npx vercel env ls --token YOUR_VERCEL_TOKEN
```

**⚠️ NO ejecutar todavía** - solo documentar comando

---

### 3.2. Variables Esperadas

#### Production Environment

**Supabase:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]  # Privado
```

**Stripe (Actual - Test):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**Stripe (Target - Live):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ← CAMBIAR
STRIPE_SECRET_KEY=sk_live_...                    # ← CAMBIAR
STRIPE_WEBHOOK_SECRET=whsec_live_...             # ← CAMBIAR
```

**Email SMTP (Nuevo):**
```bash
SMTP_HOST=smtp.gmail.com                         # ← AGREGAR
SMTP_PORT=587                                    # ← AGREGAR
SMTP_USER=kepler@usdtcapital.es                  # ← AGREGAR
SMTP_PASSWORD=[app_password]                     # ← AGREGAR
EMAIL_FROM=kepler@usdtcapital.es                 # ← AGREGAR
EMAIL_FROM_NAME=Bagclue                          # ← AGREGAR
```

---

### 3.3. Seguridad Variables

#### ❌ NO HACER
- ❌ NO commitear secrets a Git
- ❌ NO imprimir secrets en logs
- ❌ NO compartir secrets por Telegram/WhatsApp
- ❌ NO guardar secrets en archivos `.txt` sin cifrar
- ❌ NO usar same keys en local y production

#### ✅ SÍ HACER
- ✅ Usar Vercel encrypted environment variables
- ✅ Guardar backup secrets en password manager (1Password/Bitwarden)
- ✅ Usar `.env.local` local (gitignored)
- ✅ Rotar keys si se comprometen
- ✅ Usar different keys development vs production

---

### 3.4. Actualizar Variables Vercel

#### Método 1: Vercel Dashboard (Recomendado)
1. https://vercel.com/kepleragents/bagclue/settings/environment-variables
2. Production tab
3. **Actualizar existentes:**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_live_...`
4. **Agregar nuevas:**
   - `SMTP_HOST` → `smtp.gmail.com`
   - `SMTP_PORT` → `587`
   - `SMTP_USER` → `kepler@usdtcapital.es`
   - `SMTP_PASSWORD` → [app_password]
   - `EMAIL_FROM` → `kepler@usdtcapital.es`
   - `EMAIL_FROM_NAME` → `Bagclue`
5. **Save**
6. **Redeploy:** Trigger automático o manual "Redeploy"

---

#### Método 2: Vercel CLI
```bash
# Actualizar variable
npx vercel env add STRIPE_SECRET_KEY production

# Se solicitará el valor (pegarlo, NO se muestra)
```

**⚠️ Menos visual, más riesgo error** - preferir Dashboard

---

### 3.5. Validar Variables Post-Deploy

#### Método 1: Logs Vercel
```bash
# Ver últimos logs production
npx vercel logs --token vcp_... | grep -i stripe
```

**Buscar:** Confirmación Stripe inicializó con live key (pero NO imprimir key completo)

---

#### Método 2: API Route Test
Crear endpoint temporal `/api/test-env` (eliminar después):
```typescript
// src/app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'TEST',
    smtpConfigured: !!process.env.SMTP_HOST,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });
}
```

**Llamar:** `curl https://bagclue.vercel.app/api/test-env`  
**Verificar:** `{ "stripeMode": "LIVE", "smtpConfigured": true, ... }`  
**Eliminar endpoint después**

---

### 3.6. Checklist Variables

**Pre-requisitos:**
- [ ] Stripe live keys obtenidas
- [ ] Gmail app password disponible
- [ ] Acceso Vercel Dashboard team kepleragents

**Ejecución:**
- [ ] Abrir Vercel Dashboard → bagclue → Settings → Environment Variables
- [ ] Tab "Production"
- [ ] Actualizar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- [ ] Actualizar `STRIPE_SECRET_KEY` → `sk_live_...`
- [ ] Actualizar `STRIPE_WEBHOOK_SECRET` → `whsec_live_...`
- [ ] Agregar `SMTP_HOST` → `smtp.gmail.com`
- [ ] Agregar `SMTP_PORT` → `587`
- [ ] Agregar `SMTP_USER` → `kepler@usdtcapital.es`
- [ ] Agregar `SMTP_PASSWORD` → [app_password]
- [ ] Agregar `EMAIL_FROM` → `kepler@usdtcapital.es`
- [ ] Agregar `EMAIL_FROM_NAME` → `Bagclue`
- [ ] Save changes
- [ ] Trigger redeploy (automático o manual)
- [ ] Esperar deployment completo (~2-3 min)
- [ ] Validar deployment exitoso
- [ ] (Opcional) Test `/api/test-env` → `stripeMode: "LIVE"`
- [ ] (Opcional) Eliminar `/api/test-env`

**Rollback si falla:**
- [ ] Revertir a test keys
- [ ] Redeploy
- [ ] Validar test mode funciona

---

## FASE 4: QA PRE-LIVE

### 4.1. Compra Real Controlada

#### Setup Producto Test
**Admin:**
1. `/admin/productos/new`
2. Crear producto:
   - **Título:** "Test Live Payment"
   - **Brand:** Chanel (o cualquiera)
   - **Precio:** $20 MXN
   - **`is_published`:** `false` (NO visible catálogo público)
   - **Stock:** 1
   - **Status:** available
3. Guardar → obtener slug
4. **URL directa:** `https://bagclue.vercel.app/catalogo/test-live-payment`

---

#### Test Flow Completo

**Paso 1: Agregar al Carrito**
- Ir a URL directa producto test
- Click "Agregar al carrito"
- Validar CartIcon +1

**Paso 2: Checkout**
- Ir a `/cart`
- Click "Proceder al pago"
- Redirect a Stripe Checkout

**Paso 3: Pago Real**
- **Card:** [tu tarjeta personal real]
- **Monto:** $20 MXN + fees Stripe (~$21.50 total)
- Completar pago

**Paso 4: Success**
- Redirect a `/checkout/success`
- **Validar:** Email confirmación llega (si SMTP configurado)

---

### 4.2. Confirmación de Pedido

**Validar en Supabase:**
```sql
SELECT 
  id, order_id, customer_email, total, currency,
  payment_status, shipping_status, tracking_token
FROM orders
WHERE customer_email = '[tu_email_test]'
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado:**
- ✅ Order creada
- ✅ `payment_status = 'paid'`
- ✅ `shipping_status = 'pending'`
- ✅ `tracking_token` generado
- ✅ `total = 20` (o precio producto)

**Validar en Stripe Dashboard:**
- https://dashboard.stripe.com/payments (Live mode)
- Buscar payment `$20 MXN`
- Status: **Succeeded**

---

### 4.3. Dirección de Envío

**Como Cliente:**
1. Login `/account/login` (magic link email test)
2. Ir a `/account/orders`
3. Click pedido test
4. Ir a `/account/orders/[id]`
5. Botón "Confirmar dirección"
6. Llenar form dirección completa
7. Submit

**Validar en Supabase:**
```sql
SELECT shipping_address
FROM orders
WHERE id = '[order_id]';
```

**Esperado:**
- ✅ `shipping_address` NOT NULL
- ✅ JSON con 8 campos
- ✅ Badge "✓ Dirección confirmada" visible en UI

---

### 4.4. Admin Envíos

**Admin:**
1. Login `/admin/login`
2. Ir a `/admin/envios`
3. Tab "Pendiente envío"
4. Buscar pedido test
5. **Validar:**
   - ✅ Badge "✓ Dirección confirmada"
   - ✅ Botón "Marcar preparando" activo

**Marcar Preparando:**
- Click "Marcar preparando"
- Modal confirma
- Submit
- **Validar:** Pedido mueve a tab "Preparando"

**Marcar Enviado:**
- Tab "Preparando" → pedido test
- Click "Marcar enviado"
- Form:
   - Paquetería: DHL
   - Tracking: TEST-123456789
   - URL: https://dhl.com/track/TEST-123456789
- Submit
- **Validar:** 
   - ✅ Pedido mueve a tab "Enviado"
   - ✅ Email "Tu pedido ha sido enviado" llega (si SMTP config)

**Marcar Entregado:**
- Tab "Enviado" → pedido test
- Click "Marcar entregado"
- Confirmar advertencia
- Submit
- **Validar:**
   - ✅ Pedido mueve a tab "Entregado"
   - ✅ Email "Tu pedido ha sido entregado" llega

---

### 4.5. Tracking Cliente

**Como Cliente:**
1. Ir a `/account/orders/[id]`
2. **Validar:**
   - ✅ Badge shipping_status = 'delivered'
   - ✅ Tracking number visible: TEST-123456789
   - ✅ Link tracking externo funciona
3. Ir a `/track/[tracking_token]` (sin login)
4. **Validar:**
   - ✅ Página carga
   - ✅ Info pedido visible público
   - ✅ Estado "Entregado"
   - ✅ Tracking info visible

---

### 4.6. Refund (Cleanup)

**Stripe Dashboard:**
1. https://dashboard.stripe.com/payments (Live)
2. Buscar payment $20 MXN
3. Click → "Refund"
4. Full refund
5. Confirm

**Resultado:**
- ✅ Money devuelto a tarjeta (1-5 días)
- ✅ Order permanece en DB (no se elimina)
- ⚠️ Payment status NO actualiza automático (requiere webhook refund, opcional)

---

### 4.7. Checklist QA Pre-Live

**Setup:**
- [ ] Producto test creado `is_published=false`, precio $20 MXN
- [ ] URL directa accesible
- [ ] Stripe live keys configuradas
- [ ] SMTP configurado (si corresponde)

**Test Flow:**
- [ ] Agregar producto test al carrito
- [ ] Ir a checkout
- [ ] Pagar con tarjeta real
- [ ] Redirect a success
- [ ] Email confirmación llega (si SMTP)
- [ ] Order creada en Supabase
- [ ] Payment status = 'paid'
- [ ] Stripe Dashboard muestra payment succeeded

**Dirección:**
- [ ] Login `/account`
- [ ] Ver pedido en `/account/orders`
- [ ] Click detalle
- [ ] Confirmar dirección
- [ ] Form guarda correctamente
- [ ] Badge "✓ Dirección confirmada" aparece

**Admin Fulfillment:**
- [ ] Admin login `/admin`
- [ ] Ver pedido en `/admin/envios` tab "Pendiente envío"
- [ ] Marcar preparando → mueve a "Preparando"
- [ ] Marcar enviado → form tracking → submit → mueve a "Enviado"
- [ ] Email "enviado" llega (si SMTP)
- [ ] Marcar entregado → mueve a "Entregado"
- [ ] Email "entregado" llega (si SMTP)

**Tracking:**
- [ ] Cliente ve tracking en `/account/orders/[id]`
- [ ] Tracking público `/track/[token]` funciona sin login
- [ ] Links tracking externos funcionan

**Cleanup:**
- [ ] Refund payment desde Stripe Dashboard
- [ ] Eliminar producto test (opcional)

**Resultado:** ✅ QA PRE-LIVE PASS

---

## FASE 5: RIESGOS & MITIGACIÓN

### 5.1. Webhook Duplicado

**Riesgo:**
- Webhook test sigue configurado
- Webhook live configurado nuevo
- **2 webhooks** apuntan a mismo endpoint
- Order se crea duplicada

**Mitigación:**
1. **Stripe Dashboard:**
   - Toggle "Test mode" ON
   - Webhooks → deshabilitar webhook test (pause icon)
   - Toggle "Test mode" OFF
   - Webhooks → webhook live activo
2. **Código protección idempotencia:**
   ```typescript
   // webhook route ya valida signature
   // agregar check duplicados por session_id
   const existing = await checkOrderBySessionId(session.id);
   if (existing) {
     return Response.json({ received: true }); // skip
   }
   ```

**Validación:**
- Solo 1 webhook activo en live mode
- Test webhook pausado o eliminado

---

### 5.2. Live/Test Mezclados

**Riesgo:**
- Frontend usa `pk_live_...`
- Backend usa `sk_test_...`
- Checkout falla: "No such checkout session"

**Mitigación:**
1. **Actualizar todas las 3 variables juntas:**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
2. **Validar consistencia:**
   - `pk_live_` → `sk_live_` → `whsec_live_`
   - `pk_test_` → `sk_test_` → `whsec_test_`
3. **Test endpoint `/api/test-env`:**
   ```typescript
   const isLive = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
   const pubKeyLive = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
   if (isLive !== pubKeyLive) {
     throw new Error('STRIPE KEYS MISMATCH');
   }
   ```

**Validación:**
- Todas keys live o todas keys test
- NO mezclar

---

### 5.3. Emails No Llegan

**Riesgo:**
- SMTP configurado mal
- Gmail bloquea envío
- Emails van a spam
- Cliente NO recibe confirmación

**Mitigación:**
1. **Test local primero:**
   ```bash
   node send_email.mjs test@example.com "Test" "Body"
   ```
2. **Revisar Gmail settings:**
   - 2FA activo
   - App password correcto (NO password normal)
   - "Less secure apps" OFF (usar app password)
3. **SPF/DKIM:**
   - Si usas `kepler@usdtcapital.es`, Gmail maneja SPF
   - Si usas `info@kepleragents.com`, configurar SPF en Hostinger
4. **Fallback:**
   - Si emails fallan, sistema sigue funcional
   - Cliente accede info vía `/account/orders`
   - Admin procesa orden sin email

**Validación:**
- Email test llega a inbox (NO spam)
- Links en email funcionan
- Sender name "Bagclue" visible

---

### 5.4. Productos Test Publicados

**Riesgo:**
- Producto "Test Live Payment" $20 MXN publicado por error
- Aparece en catálogo público
- Cliente real lo compra

**Mitigación:**
1. **Crear productos test con `is_published = false`**
2. **Naming convención:** Título incluye "TEST" o "QA"
3. **Eliminar después de QA:**
   ```sql
   DELETE FROM products WHERE title ILIKE '%test%';
   ```
4. **Validar catálogo público:**
   - Ir a `/catalogo`
   - Confirmar solo productos reales visibles

**Validación:**
- Catálogo público sin productos test
- Solo productos con fotos + descripción real

---

### 5.5. Productos Sin Stock

**Riesgo:**
- Producto publicado con `stock = 0`
- Cliente intenta comprar
- Checkout procesa (no valida stock)
- Admin NO puede cumplir

**Mitigación:**
1. **Validación checkout:**
   ```typescript
   // /api/checkout/create-session
   const product = await getProduct(productId);
   if (product.stock <= 0) {
     return Response.json({ error: 'Out of stock' }, { status: 400 });
   }
   ```
2. **Validación AddToCartButton:**
   ```typescript
   // Deshabilitar botón si stock <= 0
   disabled={product.stock <= 0}
   ```
3. **Admin workflow:**
   - Antes de publicar, confirmar stock >= 1
   - Actualizar stock tras venta (manual o automático)

**Validación:**
- Productos publicados tienen stock > 0
- Checkout valida stock antes de crear session

---

### 5.6. Checklist Riesgos

**Validación Pre-Live:**
- [ ] Solo 1 webhook live activo (test pausado)
- [ ] Las 3 keys Stripe son live (consistentes)
- [ ] Email test llega a inbox (NO spam)
- [ ] Productos test NO publicados (`is_published = false`)
- [ ] Productos publicados tienen stock > 0
- [ ] Checkout valida stock antes de procesar

**Monitoreo Post-Live:**
- [ ] Revisar Stripe Dashboard diario primeros 7 días
- [ ] Revisar orders Supabase diario
- [ ] Revisar inbox emails "bounced" o "failed"
- [ ] Responder a cliente si email falla (vía Instagram DM)

---

## PLAN DE EJECUCIÓN COMPLETO

### Secuencia Recomendada

#### Día 0: Preparación (Sin Deploy)
1. ✅ Obtener Stripe live keys (si cuenta verificada)
2. ✅ Crear webhook live endpoint
3. ✅ Confirmar app password Gmail disponible
4. ✅ Preparar lista variables entorno
5. ✅ Crear producto test $20 MXN `is_published=false`

**Duración:** 30-60 min  
**Riesgo:** Ninguno (solo lectura)

---

#### Día 1: Implementación Email (Código)
1. Crear `/lib/email/mailer.ts`
2. Crear templates HTML 5 emails
3. Integrar sendEmail en 5 trigger points
4. Test local `send_email.mjs`
5. Commit código (sin deploy)

**Duración:** 2-3 horas  
**Riesgo:** Bajo (solo código local)

---

#### Día 2: Deploy Stripe Live + Email
**Mañana:**
1. Actualizar variables Vercel (Stripe live + SMTP)
2. Deploy código email
3. Esperar deployment completo
4. Validar `/api/test-env` → `stripeMode: "LIVE"`

**Tarde:**
5. Test compra real $20 MXN
6. Validar order creada
7. Validar email confirmación llega
8. Validar webhook Stripe recibido
9. Refund $20 MXN

**Duración:** 1-2 horas  
**Riesgo:** Medio (deploy production, cobro real)

---

#### Día 3: QA Pre-Live Completo
1. Compra test controlada
2. Confirmar dirección
3. Admin: preparando → enviado → entregado
4. Validar emails 3 triggers
5. Validar tracking cliente
6. Refund

**Duración:** 1 hora  
**Riesgo:** Bajo (QA validación)

---

#### Día 4: Activación Producción Real
1. Publicar productos reales (fotos profesionales)
2. Validar stock > 0
3. Validar catálogo público correcto
4. Anunciar lanzamiento (Instagram, etc.)

**Duración:** Variable  
**Riesgo:** Bajo (ya QA completo)

---

### Rollback en Cualquier Punto

**Si algo falla:**
1. Vercel Dashboard → Variables
2. Cambiar back a test keys
3. Eliminar variables SMTP (opcional)
4. Redeploy
5. Validar test mode funciona
6. **Tiempo total:** 5-10 minutos

---

## DOCUMENTOS DE REFERENCIA

### Contraseñas
- `contraseñas/correo_kepler.md` - Gmail app password
- `contraseñas/vercel_token_nuevo.md` - Vercel token deploy

### Scripts
- `workspace/send_email.mjs` - Email SMTP funcional

### Fase Admin Envíos
- `ADMIN_FASE_1B1_ENTREGA.md` - API envíos
- `ADMIN_FASE_1B2_ENTREGA.md` - UI envíos
- `ADMIN_FASE_1C2_ENTREGA.md` - Marcar preparando
- `ADMIN_FASE_1C3_ENTREGA.md` - Marcar enviado
- `ADMIN_FASE_1C4_ENTREGA.md` - Marcar entregado

### Fase Cliente
- `BAGCLUE_PHASE5B_CUSTOMER_PANEL_ENTREGA.md` - Panel cliente
- `BAGCLUE_PHASE5C_SHIPPING_ADDRESS_ENTREGA.md` - Dirección envío

---

## ESTIMACIÓN TIEMPO TOTAL

**Preparación:** 1 hora  
**Implementación email:** 2-3 horas  
**Deploy + test:** 1-2 horas  
**QA completo:** 1 hora  
**Total:** **5-7 horas**

---

## RESUMEN CHECKLIST

### Pre-requisitos
- [ ] Cuenta Stripe verificada (KYC)
- [ ] Gmail app password disponible
- [ ] Acceso Vercel Dashboard
- [ ] Producto test creado

### Fase 1: Stripe Live
- [ ] Obtener pk_live, sk_live
- [ ] Crear webhook live
- [ ] Obtener whsec_live
- [ ] Guardar 3 keys seguras

### Fase 2: Email SMTP
- [ ] Implementar mailer.ts
- [ ] Crear 5 templates HTML
- [ ] Integrar 5 trigger points
- [ ] Test local email

### Fase 3: Variables Vercel
- [ ] Actualizar Stripe live keys
- [ ] Agregar SMTP variables
- [ ] Redeploy
- [ ] Validar deployment

### Fase 4: QA Pre-Live
- [ ] Compra test $20 MXN real
- [ ] Confirmar dirección
- [ ] Admin fulfillment completo
- [ ] Validar tracking
- [ ] Refund

### Fase 5: Riesgos
- [ ] Validar 1 webhook live
- [ ] Validar keys consistentes
- [ ] Validar emails llegan
- [ ] Validar sin productos test públicos
- [ ] Validar stock > 0

### Go Live
- [ ] Publicar productos reales
- [ ] Anunciar lanzamiento

---

## DECISIÓN IMPLEMENTACIÓN

**Estado:** 📋 **SCOPE PREPARADO - ESPERANDO APROBACIÓN**

**NO tocar código**  
**NO cambiar variables**  
**NO hacer deploy**

**Esperando instrucciones para proceder con ejecución.**

---

**Documento creado:** 2026-05-06 16:30 UTC  
**Preparado por:** Kepler  
**Siguiente paso:** Aprobación para ejecutar Fase 1
