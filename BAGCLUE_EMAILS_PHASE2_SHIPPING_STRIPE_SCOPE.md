# BAGCLUE EMAILS PHASE 2 — SHIPPING + STRIPE SCOPE

**Fecha:** 2026-05-10  
**Status:** Scope definido - Pendiente aprobación  
**Objetivo:** Completar emails P0 restantes antes de producción real

---

## 📋 RESUMEN EJECUTIVO

**Emails de esta fase:**
1. ✅ Producto enviado / Tracking (ya existe, requiere validación)
2. ⚠️ Pago confirmado Stripe (ya existe, requiere alineación)

**Recomendación:** **SOLO AJUSTAR** (no implementar desde cero)

**Razón:** Ambos emails ya están implementados y funcionando. Solo requieren:
- Validación de funcionalidad
- Alineación de diseño/tono con template premium bank-transfer-confirmed
- Testing exhaustivo

---

## 1️⃣ EMAIL: PRODUCTO ENVIADO / TRACKING

### Estado Actual: ✅ IMPLEMENTADO

**Template existente:** `src/lib/email/templates/shipping-tracking.ts`  
**Función mailer:** `sendShippingTrackingEmail()` (línea 187 de mailer.ts)  
**Trigger actual:** `POST /api/orders/[id]/shipping` cuando `shipping_status = 'shipped'`

### Trigger Exacto

**Archivo:** `src/app/api/orders/[id]/shipping/route.ts`  
**Líneas:** 174-207

```typescript
if (shipping_status === 'shipped' && order.customer_email) {
  try {
    const { sendShippingTrackingEmail } = await import('@/lib/email/mailer')
    
    const productName = orderItems?.[0]?.product_snapshot?.title || 'Tu compra'
    const trackingUrl = shipping_provider === 'dhl' 
      ? `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${shipping_tracking_number}`
      : shipping_provider === 'fedex'
      ? `https://www.fedex.com/fedextrack/?trknbr=${shipping_tracking_number}`
      : null
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    const orderTrackingUrl = `${baseUrl}/track/${order.tracking_token}`
    
    const emailSent = await sendShippingTrackingEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId: order.id.slice(0, 8),
      productName,
      shippingProvider: shipping_provider || 'manual',
      trackingNumber: shipping_tracking_number,
      trackingUrl: trackingUrl || undefined,
      orderTrackingUrl
    })
    
    console.log(`[SHIPPING UPDATE] Tracking email sent: ${emailSent}`)
  } catch (emailError: any) {
    console.error('[SHIPPING UPDATE] Email error (non-fatal):', emailError.message)
    // NO lanzar error - continuar flujo normal
  }
}
```

### Contenido del Template Actual

**Subject:** "Tu Pedido Ha Sido Enviado"

**Incluye:**
- ✅ Nombre cliente
- ✅ Producto
- ✅ Número de pedido (8 primeros dígitos)
- ✅ Paquetería (DHL/FedEx/manual)
- ✅ Tracking number
- ✅ Tracking URL (si existe)
- ✅ Link Bagclue: `/track/[tracking_token]`
- ✅ Status visual "En Tránsito"
- ✅ Tiempo estimado: 3-5 días hábiles
- ✅ CTA: "Rastrear Paquete en [Provider]"
- ✅ CTA secundario: "Ver Estado del Pedido"
- ✅ Diseño premium Bagclue (marfil #FFFBF8, rosa #E85A9A)

### Error Handling

✅ **Non-fatal:** Email falla → flujo de shipping continúa

### Funciona Para

- ✅ Órdenes Stripe (payment_method=card)
- ✅ Órdenes Bank Transfer (payment_method=bank_transfer_mxn)
- ✅ Cualquier orden con tracking_token

### Issues/Mejoras Propuestas

**Issue menor detectado:**
- Subject podría alinearse mejor: "Tu pieza Bagclue va en camino" (más premium)
- Considerar agregar "tu pieza es tuya" si aplica (compra completa vs apartado)

**Recomendación:** VALIDAR FUNCIONALIDAD → ajustar subject si aprobado

---

## 2️⃣ EMAIL: PAGO CONFIRMADO STRIPE

### Estado Actual: ✅ IMPLEMENTADO

**Template existente:** `src/lib/email/templates/order-confirmation.ts`  
**Función mailer:** `sendOrderConfirmationEmail()` (línea 123 de mailer.ts)  
**Trigger actual:** Stripe webhook `checkout.session.completed`

### Trigger Exacto

**Archivo:** `src/app/api/stripe/webhook/route.ts`  
**Líneas:** 245-273  
**Evento:** `checkout.session.completed` con pago exitoso

```typescript
try {
  const { sendOrderConfirmationEmail } = await import('@/lib/email/mailer')
  
  // Obtener product name desde order_items
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_snapshot')
    .eq('order_id', order_id)
    .limit(1)
  
  const productName = items?.[0]?.product_snapshot?.title || 'Tu compra'
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bagclue.vercel.app'}/account/orders/${order_id}`
  
  const emailSent = await sendOrderConfirmationEmail({
    to: updatedOrder.customer_email,
    customerName: updatedOrder.customer_name,
    orderId: order_id,
    productName,
    totalAmount: updatedOrder.total,
    currency: 'MXN',
    orderUrl
  })
  
  console.log(`[WEBHOOK] Email confirmation sent: ${emailSent}`)
} catch (emailError: any) {
  console.error('[WEBHOOK] Email error (non-fatal):', emailError.message)
  // NO lanzar error - continuar flujo normal
}
```

### Contenido del Template Actual

**Subject:** "✅ Compra Confirmada"

**Incluye:**
- ✅ Nombre cliente
- ✅ Producto
- ✅ Número de pedido
- ✅ Total pagado (formato MXN)
- ✅ Status visual "Pago Confirmado"
- ✅ Próximo paso: "Confirma tu dirección de envío"
- ✅ CTA: "Confirmar Dirección de Envío" → `/account/orders/[id]`
- ✅ Aviso: "Recibirás notificación cuando tu pedido sea enviado"
- ✅ Diseño premium Bagclue

### Error Handling

✅ **Non-fatal:** Email falla → webhook continúa, order se marca como paid

### Comparación con bank-transfer-confirmed.ts

| Elemento | order-confirmation (Stripe) | bank-transfer-confirmed (Transfer) |
|----------|----------------------------|-------------------------------------|
| Subject | "✅ Compra Confirmada" | "Pago confirmado — tu pieza Bagclue es tuya" |
| Tono | Genérico | Premium/emocional |
| CTA | "Confirmar Dirección de Envío" | "Confirmar Dirección de Envío" |
| Link | `/account/orders/[id]` | `/track/[tracking_token]` |
| Mensaje clave | "Tu pago ha sido confirmado" | "Tu pago fue verificado. Tu pieza Bagclue es tuya." |
| Incluye tracking link | ❌ No | ✅ Sí |

### Issues/Mejoras Propuestas

**Diferencias detectadas:**

1. **Subject menos premium:**
   - Actual: "✅ Compra Confirmada"
   - Sugerido: "Pago confirmado — tu pieza Bagclue es tuya"

2. **Link diferente:**
   - Actual: `/account/orders/[id]` (requiere login)
   - Bank transfer: `/track/[tracking_token]` (acceso directo sin login)
   - **Decisión requerida:** ¿alinear con tracking_token o mantener account link?

3. **Tono menos emocional:**
   - Actual: "Tu pago ha sido confirmado exitosamente"
   - Bank transfer: "Tu pago fue verificado. Tu pieza Bagclue es tuya. Prepararemos tu envío."

4. **Falta diferenciación compra completa vs apartado:**
   - Template actual no distingue payment_type
   - Bank transfer sí lo hace

**Recomendación:** ALINEAR con bank-transfer-confirmed para consistencia de marca

---

## 🔧 ARCHIVOS A MODIFICAR

### Si se aprueba alineación:

1. **src/lib/email/templates/order-confirmation.ts**
   - Actualizar subject
   - Alinear tono/mensajes con bank-transfer-confirmed
   - Cambiar link a `/track/[tracking_token]` si aprobado
   - Agregar diferenciación full_purchase vs layaway (futuro)

2. **src/app/api/stripe/webhook/route.ts**
   - Agregar `tracking_token` al parámetro orderUrl
   - Cambiar a `trackingUrl` = `/track/[tracking_token]`
   - Mantener estructura actual

3. **src/lib/email/templates/shipping-tracking.ts**
   - Actualizar subject: "Tu pieza Bagclue va en camino"
   - Opcional: agregar mensaje "tu pieza es tuya" si aplica

**NO TOCAR:**
- `src/lib/email/mailer.ts` (funciones ya correctas)
- `src/app/api/orders/[id]/shipping/route.ts` (trigger ya correcto)
- Lógica de webhook Stripe
- DB schema
- Stripe keys/config
- Checkout logic
- Bank transfer emails (funcionando)

---

## ⚠️ RIESGOS

### Riesgo Bajo

**Razón:** Ambos emails ya funcionan. Solo se modifican templates (HTML/CSS/copy).

**Mitigaciones:**
- Backup de templates originales
- Testing con órdenes test
- Validación visual antes de producción
- Deploy con verification

### Riesgo Específico: Tracking Token en Stripe

**Problema potencial:**  
Si cambiamos link de `/account/orders/[id]` a `/track/[tracking_token]`, usuarios Stripe podrían no tener tracking_token asignado si webhook falló.

**Mitigación:**
- Verificar que webhook SIEMPRE asigna tracking_token
- Fallback a account link si tracking_token null
- Testing exhaustivo

---

## 🧪 TESTING PLAN

### TEST 1: Email Shipping (Validación)

**Objetivo:** Confirmar que email shipping funciona correctamente

**Flujo:**
1. Crear orden test (Stripe o Bank Transfer)
2. Aprobar pago
3. Confirmar dirección
4. Desde `/admin/envios`: marcar como enviado
5. Ingresar tracking number
6. Confirmar envío

**Validar:**
- Email llega
- Subject correcto
- Tracking number visible
- Links funcionan (provider + Bagclue)
- Diseño responsive
- No errores en logs

### TEST 2: Email Stripe Confirmación (Validación)

**Objetivo:** Confirmar que email Stripe funciona correctamente

**Flujo:**
1. Crear producto test
2. Checkout con Stripe (test mode)
3. Pagar con tarjeta test
4. Webhook procesa pago

**Validar:**
- Email llega
- Subject correcto
- Producto correcto
- Monto correcto
- Link funciona
- Diseño responsive
- No errores en logs

### TEST 3: Email Stripe Alineado (Post-ajuste)

**Objetivo:** Validar nuevo template alineado

**Flujo:**
1. Repetir flujo TEST 2
2. Validar nuevo subject
3. Validar nuevo link (tracking_token)
4. Validar nuevo tono/mensajes
5. Comparar con bank-transfer-confirmed (consistencia)

---

## 📊 ESTIMACIÓN

### Opción A: Solo Validación (sin ajustes)

**Tiempo:** 2-3 horas
- Testing email shipping: 1h
- Testing email Stripe: 1h
- Reporte: 30min

**Resultado:** Confirmación de que emails P0 están completos y funcionando

### Opción B: Alineación + Validación

**Tiempo:** 4-6 horas
- Ajuste order-confirmation template: 1-2h
- Ajuste shipping-tracking subject: 30min
- Testing completo (3 tests): 2-3h
- Deploy + verification: 1h

**Resultado:** Emails P0 alineados con tono premium Bagclue + validación completa

---

## 🎯 RECOMENDACIÓN FINAL

### **OPCIÓN RECOMENDADA: B (Alineación + Validación)**

**Razones:**

1. **Consistencia de marca:**
   - Subject Stripe "✅ Compra Confirmada" es genérico
   - Bank transfer "tu pieza Bagclue es tuya" es premium/emocional
   - Alinear refuerza identidad de marca

2. **Experiencia de usuario:**
   - Link `/track/[tracking_token]` es más directo (sin login)
   - Consistente con bank transfer
   - Mejor UX para cliente

3. **Completitud:**
   - Emails P0 quedan 100% alineados antes de producción
   - Evita re-trabajo futuro
   - Cierra fase 2 completa

4. **Bajo riesgo:**
   - Solo templates (no lógica)
   - Ya existe referencia (bank-transfer-confirmed)
   - Testing exhaustivo antes de deploy

### **Alternativa: A (Solo Validación)**

**Razones para elegir A:**
- Si tiempo es crítico
- Si se prefiere no tocar Stripe por ahora
- Si consistencia de marca no es prioridad inmediata

---

## 🚫 NO TOCAR (CONFIRMADO)

- ✅ DB schema
- ✅ Stripe Live keys
- ✅ Stripe config/checkout logic
- ✅ Bank transfer emails funcionando (Fase 1)
- ✅ Admin payments logic
- ✅ Layaways
- ✅ RLS policies
- ✅ Inventario admin
- ✅ Customer panel core
- ✅ Webhook Stripe logic (solo template)
- ✅ Endpoint shipping logic (solo template)

---

## 📝 PRÓXIMOS PASOS

1. **Aprobación de scope:**
   - Opción A (solo validación) o B (alineación)
   - Decisión sobre tracking_token vs account link

2. **Si se aprueba B:**
   - Implementar ajustes templates
   - Testing exhaustivo (3 tests)
   - Deploy con verification
   - Reporte final

3. **Si se aprueba A:**
   - Testing validación (2 tests)
   - Reporte final
   - Emails P0 marcados como completos

4. **Post-Fase 2:**
   - Email P0 restante: Bienvenida (Fase 3)
   - Stripe Live migration
   - Checklist producción

---

**SCOPE COMPLETO. Pendiente aprobación para proceder.**
