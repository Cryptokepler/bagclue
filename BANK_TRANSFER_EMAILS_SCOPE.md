# BANK TRANSFER EMAILS — SCOPE TÉCNICO

**Proyecto:** Bagclue  
**Fecha:** 2026-05-10  
**Fase:** MVP.2B — Bank Transfer Transactional Emails  
**Estado:** SCOPE APROBACIÓN PENDIENTE — NO IMPLEMENTAR  

---

## OBJETIVO

Implementar emails transaccionales para el flujo completo de pago por transferencia bancaria MXN, asegurando que el cliente reciba comunicación clara en cada etapa del proceso.

---

## INFRAESTRUCTURA EXISTENTE ✅

**Ya implementado y validado en producción:**

- **SMTP Hostinger:** Configurado y funcional
- **Mailer:** `src/lib/email/mailer.ts` (nodemailer + error handling no-fatal)
- **Templates existentes:**
  - `order-confirmation.ts` (Stripe paid orders)
  - `layaway-confirmation.ts` (apartados)
  - `shipping-tracking.ts` (tracking enviado)
- **Estilo:** Branding Bagclue ya definido (#E85A9A rosa, Playfair Display, formato responsive)
- **ENV vars:** SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME

**Reutilizar:** Toda la infraestructura existente. Solo agregar templates nuevos y puntos de invocación.

---

## EMAILS A CREAR (5)

### EMAIL 1: Instrucciones de Transferencia Bancaria ⚠️ P0

**Trigger:**
- POST `/api/payments/bank-transfer/order` exitoso
- `payment_transaction.status = 'pending'`
- Orden creada, producto reservado

**Punto de integración:**
- Archivo: `src/app/api/payments/bank-transfer/order/route.ts`
- Línea aproximada: ~220 (después de crear transaction, antes de return success response)
- Trigger técnico: Inmediatamente después de `payment_transactions` insert exitoso

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (primeros 8 chars)
  productName: string;           // product_snapshot.title
  productBrand: string;          // product_snapshot.brand
  amount: number;                // transaction.amount
  currency: string;              // transaction.currency ('MXN')
  paymentReference: string;      // transaction.payment_reference (ej: BGTF12345678)
  expiresAt: string;             // transaction.expires_at (ISO timestamp)
  // Bank data from config
  bankName: string;              // Banco Santander
  accountHolder: string;         // María González Ruiz
  clabe: string;                 // 014180655043326656
  // URLs
  paymentUrl: string;            // /payment/bank-transfer/[transactionId]?token=[tracking_token]
}
```

**Template a crear:**
- `src/lib/email/templates/bank-transfer-instructions.ts`

**Función exportada:**
```typescript
export function generateBankTransferInstructionsHTML(params: BankTransferInstructionsParams): string
```

**Contenido del email:**
- Saludo personalizado
- Mensaje: "Tu pieza queda reservada mientras validamos tu pago."
- Producto y monto
- **Instrucciones de transferencia:**
  - Banco
  - Titular
  - CLABE
  - Referencia de pago (destacada)
  - Expiración: "Tienes 24 horas para completar tu transferencia"
- CTA: "Subir comprobante de pago" → link a payment URL
- Footer estándar Bagclue

**Función helper en mailer.ts:**
```typescript
export async function sendBankTransferInstructionsEmail(params: { ... }): Promise<boolean>
```

**Subject:**
```
📋 Instrucciones de pago — Pedido #[orderId]
```

---

### EMAIL 2: Comprobante Recibido / Pago en Revisión ⚠️ P0

**Trigger:**
- POST `/api/payments/bank-transfer/upload-proof` exitoso
- `payment_transaction.status = 'proof_uploaded'`

**Punto de integración:**
- Archivo: `src/app/api/payments/bank-transfer/upload-proof/route.ts`
- Línea aproximada: ~180 (después de update transaction status, antes de return success)

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (8 chars)
  productName: string;           // product_snapshot.title
  productBrand: string;          // product_snapshot.brand
  paymentReference: string;      // transaction.payment_reference
  trackingUrl: string;           // /track/[tracking_token]
}
```

**Template a crear:**
- `src/lib/email/templates/bank-transfer-proof-received.ts`

**Contenido del email:**
- Saludo
- "Hemos recibido tu comprobante de pago."
- Producto y referencia
- Mensaje: "Nuestro equipo validará el pago en banco. Te notificaremos en las próximas horas."
- CTA: "Ver estado del pedido" → tracking URL
- Footer estándar

**Función helper:**
```typescript
export async function sendBankTransferProofReceivedEmail(params: { ... }): Promise<boolean>
```

**Subject:**
```
✅ Comprobante recibido — Pedido #[orderId]
```

---

### EMAIL 3: Pago Confirmado ⚠️ P0

**Trigger:**
- POST `/api/payments/admin/verify` con `action = 'approve'`
- `payment_transaction.status = 'confirmed'`
- `order.payment_status = 'paid'`
- `order.status = 'confirmed'`

**Punto de integración:**
- Archivo: `src/app/api/payments/admin/verify/route.ts`
- Línea aproximada: ~140 (después de update order, antes de return success)

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (8 chars)
  productName: string;           // product_snapshot.title
  productBrand: string;          // product_snapshot.brand
  amount: number;                // transaction.amount
  currency: string;              // transaction.currency
  // URLs
  addressUrl: string;            // /account/addresses
  trackingUrl: string;           // /track/[tracking_token]
}
```

**Template a crear:**
- `src/lib/email/templates/bank-transfer-confirmed.ts`

**Contenido del email:**
- Saludo
- "¡Tu pago ha sido confirmado!"
- Producto y monto pagado
- **Próximo paso:** "Confirma tu dirección de envío para que podamos preparar tu pedido."
- CTA principal: "Confirmar Dirección de Envío" → `/account/addresses`
- CTA secundario: "Ver seguimiento" → tracking URL
- Mensaje: "Prepararemos tu envío una vez que confirmes tu dirección."
- Footer estándar

**Función helper:**
```typescript
export async function sendBankTransferConfirmedEmail(params: { ... }): Promise<boolean>
```

**Subject:**
```
✅ Pago confirmado — Pedido #[orderId]
```

---

### EMAIL 4: Comprobante Rechazado ⚠️ P0

**Trigger:**
- POST `/api/payments/admin/verify` con `action = 'reject'`
- `payment_transaction.status = 'rejected'`

**Punto de integración:**
- Archivo: `src/app/api/payments/admin/verify/route.ts`
- Línea aproximada: ~190 (después de update transaction rejected, antes de return success)

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (8 chars)
  productName: string;           // product_snapshot.title
  productBrand: string;          // product_snapshot.brand
  paymentReference: string;      // transaction.payment_reference
  rejectionReason: string;       // req.body.rejectionReason
  paymentUrl: string;            // /payment/bank-transfer/[transactionId]?token=[tracking_token]
}
```

**Template a crear:**
- `src/lib/email/templates/bank-transfer-rejected.ts`

**Contenido del email:**
- Saludo (tono amable, no agresivo)
- "No hemos podido validar tu comprobante de pago."
- Producto y referencia
- **Motivo:** `rejectionReason` (puede ser: monto incorrecto, referencia incorrecta, comprobante ilegible, etc.)
- Mensaje: "Por favor, revisa los datos de tu transferencia y sube un comprobante nuevo."
- CTA: "Subir nuevo comprobante" → payment URL
- Nota: "Tu pieza sigue reservada. Tienes [tiempo restante] para completar el pago."
- Footer estándar

**Función helper:**
```typescript
export async function sendBankTransferRejectedEmail(params: { ... }): Promise<boolean>
```

**Subject:**
```
⚠️ Comprobante rechazado — Pedido #[orderId]
```

---

### EMAIL 5: Tracking Enviado (Auditar) 📋 P1

**Status:** Auditar si ya existe para bank transfer orders

**Email existente:**
- Función: `sendShippingTrackingEmail()` en `mailer.ts`
- Template: `shipping-tracking.ts`

**Trigger actual:**
- Probablemente POST `/api/orders/[id]/shipping` (admin agrega tracking)

**Auditoría necesaria:**
1. ¿El endpoint `/api/orders/[id]/shipping` ya envía email?
2. ¿Funciona para `payment_method = 'bank_transfer_mxn'`?
3. ¿O solo para Stripe orders?

**Acción según resultado:**
- Si ya funciona para bank transfer → ✅ No hacer nada
- Si solo funciona para Stripe → Modificar para incluir bank transfer
- Si no existe integración → Agregar llamada a `sendShippingTrackingEmail()` en endpoint de shipping

**Punto de integración (si falta):**
- Archivo: `src/app/api/orders/[id]/shipping/route.ts` (o equivalente)
- Trigger: Después de update `orders.shipping_status = 'shipped'` + `orders.tracking_number` set

---

## ARCHIVOS A CREAR

1. `src/lib/email/templates/bank-transfer-instructions.ts`
2. `src/lib/email/templates/bank-transfer-proof-received.ts`
3. `src/lib/email/templates/bank-transfer-confirmed.ts`
4. `src/lib/email/templates/bank-transfer-rejected.ts`

**Total:** 4 templates nuevos

---

## ARCHIVOS A MODIFICAR

1. `src/lib/email/mailer.ts`
   - Agregar 4 funciones helper (`sendBankTransfer...Email()`)
   - Importar templates nuevos

2. `src/app/api/payments/bank-transfer/order/route.ts`
   - Agregar llamada a `sendBankTransferInstructionsEmail()` después de crear transaction
   - Línea ~220

3. `src/app/api/payments/bank-transfer/upload-proof/route.ts`
   - Agregar llamada a `sendBankTransferProofReceivedEmail()` después de update status
   - Línea ~180

4. `src/app/api/payments/admin/verify/route.ts`
   - Agregar llamada a `sendBankTransferConfirmedEmail()` en flujo approve
   - Agregar llamada a `sendBankTransferRejectedEmail()` en flujo reject
   - Líneas ~140 y ~190

5. **Auditar:** `src/app/api/orders/[id]/shipping/route.ts`
   - Si no envía email para bank transfer, agregar integración

**Total:** 4-5 archivos modificados

---

## SEGURIDAD ⚠️

### Datos sensibles que SÍ pueden ir en email:

- ✅ CLABE (necesaria para que el cliente haga la transferencia)
- ✅ Payment reference (pública, no sensible)
- ✅ Tracking token (en URL, necesario para acceso)
- ✅ Datos del banco (públicos)

### Datos que NO deben imprimirse en logs:

- ❌ SMTP_PASSWORD
- ❌ Secrets del environment
- ❌ CLABE en logs del servidor (solo en email)
- ❌ Tracking tokens en logs (solo en URLs generadas)

### Error handling:

**Regla crítica:** Si el envío de email falla, **NO debe romper** la operación principal.

**Implementación:**
- Todas las funciones `sendEmail()` ya retornan `boolean` (no lanzan error)
- En API routes, ejecutar email send con:
  ```typescript
  const emailSent = await sendBankTransferInstructionsEmail({ ... });
  if (!emailSent) {
    console.warn('[BankTransfer] Failed to send email, but order created successfully');
  }
  ```
- La operación de creación de orden/transacción **continúa normalmente**
- El cliente puede acceder a la info vía URL aunque no reciba email

**Casos de fallo no-fatal:**
- SMTP down
- Email bounce
- Network error
- Invalid email address

**Resultado:** Orden/transacción se crea exitosamente, email se registra como fallido en logs, cliente puede seguir el flujo vía URL.

---

## TESTING PLAN

### Unit Testing (opcional para MVP):
- Templates generan HTML válido
- Formateo de montos correcto (MXN)
- URLs correctas

### Manual Testing (obligatorio):

#### Test 1: Flujo Completo Aprobación
1. Cliente crea orden bank transfer → ✅ Email 1 recibido (instrucciones)
2. Cliente sube comprobante → ✅ Email 2 recibido (proof received)
3. Admin aprueba pago → ✅ Email 3 recibido (pago confirmado)
4. Admin agrega tracking → ✅ Email 5 recibido (tracking enviado) — si existe

**Verificar en cada email:**
- From: "Bagclue" <hola@bagclue.com>
- To: email correcto del cliente
- Subject correcto
- Datos del pedido correctos
- Links funcionan
- Estilo Bagclue correcto
- Responsive mobile

#### Test 2: Flujo Rechazo
1. Cliente crea orden bank transfer → Email 1 ✅
2. Cliente sube comprobante → Email 2 ✅
3. Admin rechaza pago → ✅ Email 4 recibido (comprobante rechazado)
4. Motivo de rechazo visible
5. Link para resubir funciona

#### Test 3: Failure Cases (no-fatal)
1. Simular SMTP down → Orden se crea, email NO se envía, operación continúa
2. Email inválido → Orden se crea, bounce se logea, operación continúa
3. Timeout SMTP → Orden se crea después de timeout, operación continúa

#### Test 4: Email Content
1. Formateo de montos: $1,234 MXN (sin centavos si es entero)
2. Fechas en español: "10 May 2026"
3. Nombres sin tildes rotas
4. CLABE completa y legible
5. Referencia de pago destacada visualmente

---

## RISKS & MITIGATIONS

### Risk 1: Email bounce por dominio no verificado
- **Probabilidad:** Baja (SMTP Hostinger ya validado)
- **Impacto:** Medio (cliente no recibe emails)
- **Mitigación:** Ya mitigado — SMTP funcional en producción

### Risk 2: Email cae en spam
- **Probabilidad:** Media (emails transaccionales pueden ser filtrados)
- **Impacto:** Medio (cliente no ve emails)
- **Mitigación:**
  - Usar asunto claro sin palabras spam
  - Incluir datos del pedido (nombre, referencia)
  - Cliente puede acceder a info vía URL aunque no reciba email
  - Considerar agregar SPF/DKIM (opcional, post-MVP)

### Risk 3: Fallo SMTP rompe creación de orden
- **Probabilidad:** Baja si se implementa correctamente
- **Impacto:** Crítico (cliente no puede comprar)
- **Mitigación:** Error handling no-fatal ya diseñado en mailer.ts

### Risk 4: CLABE expuesta en logs
- **Probabilidad:** Media si no se sanitiza
- **Impacto:** Bajo (CLABE es dato público del negocio, no del cliente)
- **Mitigación:** No logear CLABE en console.log, solo incluir en email

### Risk 5: Cliente no recibe email de instrucciones
- **Probabilidad:** Media (email puede fallar)
- **Impacto:** Alto (cliente no sabe cómo pagar)
- **Mitigación:** 
  - Payment URL muestra instrucciones completas aunque no reciba email
  - Cliente puede acceder vía `/payment/bank-transfer/[id]?token=...`

---

## QUÉ NO TOCAR 🚫

- ❌ DB schema (orders, payment_transactions, order_items)
- ❌ Stripe integration
- ❌ Stripe emails existentes
- ❌ Layaway emails existentes
- ❌ RLS policies
- ❌ Admin auth/sessions
- ❌ Customer auth/sessions
- ❌ Frontend checkout flow
- ❌ Frontend tracking page
- ❌ Bank transfer config
- ❌ Product validation logic
- ❌ Order creation logic (solo agregar email send)

**Regla:** Solo agregar llamadas a funciones de email. No modificar lógica de negocio existente.

---

## ESTIMACIÓN

### Desarrollo:
- **Templates (4):** 2-3 horas (reutilizar estilo existente)
- **Mailer helpers (4):** 1 hora
- **Integración en APIs (4-5 puntos):** 1-2 horas
- **Auditoría tracking email:** 30 min
- **Testing manual completo:** 1-2 horas

**Total estimado:** 5-8 horas

### Complexity:
- **Baja:** Infraestructura ya existe, solo agregar templates y puntos de invocación
- **Risk:** Bajo (error handling no-fatal ya implementado)

---

## APROBACIÓN REQUERIDA

**Antes de implementar:**
- [ ] Scope aprobado por Jhonatan
- [ ] Textos de emails revisados (tono, copy)
- [ ] Decisión sobre Email 5 (tracking) después de auditoría

**Después de implementar:**
- [ ] Testing manual completo aprobado
- [ ] Deploy a producción aprobado

---

## NOTAS FINALES

1. **Prioridad:** P0 — Emails transaccionales son críticos para UX de bank transfer
2. **Dependencias:** Ninguna — SMTP ya funcional
3. **Rollback:** Fácil — solo comentar llamadas a `sendEmail()` si hay problema
4. **Performance:** Sin impacto — emails se envían async, no bloquean response
5. **Observability:** Logs ya implementados en `mailer.ts` (`[Mailer] Email sent successfully...`)

**Ready to implement:** Sí, después de aprobación.
