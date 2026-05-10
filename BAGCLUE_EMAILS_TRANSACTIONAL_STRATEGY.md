# BAGCLUE — EMAILS TRANSACCIONALES STRATEGY

**Proyecto:** Bagclue  
**Fecha:** 2026-05-10  
**Fase:** Pre-Producción Real  
**Estado:** ESTRATEGIA APROBACIÓN PENDIENTE — NO IMPLEMENTAR  

---

## OBJETIVO

Definir la estrategia completa de emails transaccionales de Bagclue para asegurar comunicación clara, elegante y efectiva con clientes en cada etapa de su relación con la marca.

---

## FAMILIAS DE EMAILS

### 1. CUENTA / RELACIÓN 👤
- Bienvenida
- Confirmación de cuenta
- Reset password (futuro)

### 2. COMPRA / PAGO 💳
- Instrucciones de pago (transferencia bancaria)
- Comprobante recibido
- Pago confirmado (compra completa)
- Comprobante rechazado

### 3. LOGÍSTICA / POSTVENTA 📦
- Producto enviado / tracking
- Entregado (futuro)
- Devoluciones (futuro)

### 4. APARTADOS / PAGOS PARCIALES 💰
- Apartado confirmado
- Pago de cuota recibido
- Recordatorio de cuota
- Apartado liquidado
- Apartado cancelado (futuro)

---

## DIFERENCIAS CLAVE: COMPRA COMPLETA vs APARTADO

### Compra Completa (Stripe o Bank Transfer Full)
**Copy permitido:**
- ✅ "Tu pieza Bagclue es tuya"
- ✅ "Tu compra ha sido confirmada"
- ✅ "Gracias por tu compra"

**Estado:** Cliente pagó 100%, es dueño de la pieza.

### Apartado (Layaway)
**Copy permitido:**
- ✅ "Tu pieza quedó reservada para ti"
- ✅ "Tu apartado ha sido confirmado"
- ✅ "Vas [X]% del camino"

**Copy NO permitido:**
- ❌ "Tu pieza es tuya" (hasta liquidar 100%)
- ❌ "Tu compra ha sido confirmada" (es apartado, no compra completa)

**Estado:** Cliente pagó parcial, tiene derecho a reserva pero NO es dueño hasta liquidar.

---

## EMAILS P0 — ANTES DE PRODUCCIÓN REAL

### EMAIL 1: Bienvenida a Bagclue ✨

**Trigger:**
- Cliente crea cuenta por primera vez
- `auth.users` insert (Supabase auth)

**Objetivo:**
- Dar bienvenida cálida y elegante
- Reforzar confianza (verificación, curaduría, envíos seguros)
- Incentivar primera compra

**Subject:**
```
Bienvenida a Bagclue ✨
```

**Datos necesarios:**
```typescript
{
  to: string;                    // user.email
  customerName: string;          // user metadata o "Amiga de Bagclue"
}
```

**Contenido:**
- Saludo: "Bienvenida a Bagclue"
- Copy: "Nos emociona que formes parte de nuestra comunidad de amantes del lujo auténtico."
- Destacar:
  - ✅ Piezas verificadas por Entrupy
  - ✅ Curaduría experta
  - ✅ Envíos seguros
  - ✅ Apartado disponible (pagos semanales)
- CTA principal: "Explorar Colección" → `/catalogo`
- CTA secundario: "Hablar con Bagclue" → Instagram

**Template a crear:**
- `src/lib/email/templates/welcome.ts`

**Función helper:**
```typescript
export async function sendWelcomeEmail(params: WelcomeParams): Promise<boolean>
```

**Punto de integración:**
- Opción A: Supabase trigger/webhook (si está configurado)
- Opción B: Hook post-signup en frontend (menos confiable)
- Opción C: Auth API route custom (si existe)
- **Recomendación:** Auditar flujo de signup actual y decidir

**Prioridad:** P0 — Crítico para primera impresión

---

### EMAIL 2: Instrucciones de Transferencia Bancaria 📋

**Trigger:**
- POST `/api/payments/bank-transfer/order` exitoso
- `payment_transaction.status = 'pending'`
- `order.payment_method = 'bank_transfer_mxn'`
- `payment_transaction.payment_type = 'full_purchase'`

**Objetivo:**
- Dar instrucciones claras para transferir
- Reforzar reserva de la pieza

**Subject:**
```
Tu pieza Bagclue está reservada — instrucciones de pago
```

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
  paymentReference: string;      // transaction.payment_reference
  expiresAt: string;             // transaction.expires_at (ISO)
  // Bank data
  bankName: string;              // config: Banco Santander
  accountHolder: string;         // config: María González Ruiz
  clabe: string;                 // config: 014180655043326656
  // URLs
  paymentUrl: string;            // /payment/bank-transfer/[transactionId]?token=[tracking_token]
}
```

**Contenido:**
- Saludo personalizado
- **Copy clave:** "Tu pieza queda reservada mientras validamos tu pago."
- Producto: "[Marca] [Título]"
- Monto a transferir: "$X,XXX MXN"
- **Instrucciones de transferencia:**
  - Banco: Banco Santander
  - Titular: María González Ruiz
  - CLABE: 014180655043326656 (destacada visualmente)
  - Referencia de pago: BGTF12345678 (destacada)
- **Expiración:** "Tienes 24 horas para completar tu transferencia"
- CTA: "Subir Comprobante de Pago" → payment URL
- Footer estándar

**Template a crear:**
- `src/lib/email/templates/bank-transfer-instructions.ts`

**Función helper:**
```typescript
export async function sendBankTransferInstructionsEmail(params: BankTransferInstructionsParams): Promise<boolean>
```

**Punto de integración:**
- Archivo: `src/app/api/payments/bank-transfer/order/route.ts`
- Línea aproximada: ~220 (después de create transaction, antes de return)

**Prioridad:** P0 — Crítico para bank transfer flow

---

### EMAIL 3: Comprobante Recibido / Pago en Revisión ✅

**Trigger:**
- POST `/api/payments/bank-transfer/upload-proof` exitoso
- `payment_transaction.status = 'proof_uploaded'`

**Objetivo:**
- Confirmar recepción del comprobante
- Tranquilizar al cliente (pago en revisión)

**Subject:**
```
Recibimos tu comprobante — pago en revisión
```

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

**Contenido:**
- Saludo
- "Hemos recibido tu comprobante de pago."
- Producto: "[Marca] [Título]"
- Referencia: BGTF12345678
- **Estado:** "Pago en revisión"
- Mensaje: "Nuestro equipo validará el pago en banco. Te notificaremos en las próximas horas."
- CTA: "Ver Estado del Pedido" → tracking URL
- Footer estándar

**Template a crear:**
- `src/lib/email/templates/bank-transfer-proof-received.ts`

**Función helper:**
```typescript
export async function sendBankTransferProofReceivedEmail(params: BankTransferProofReceivedParams): Promise<boolean>
```

**Punto de integración:**
- Archivo: `src/app/api/payments/bank-transfer/upload-proof/route.ts`
- Línea aproximada: ~180 (después de update transaction status)

**Prioridad:** P0 — Importante para transparencia

---

### EMAIL 4: Pago Confirmado — Compra Completa 🎉

**Trigger:**
- **Opción A:** Stripe webhook confirma pago completo (`payment_intent.succeeded`)
- **Opción B:** Admin aprueba transferencia bancaria (`/api/payments/admin/verify` action=approve)

**Condición:**
- `order.payment_status = 'paid'`
- `order.status = 'confirmed'`
- `payment_type = 'full_purchase'` (NO apartado)

**Objetivo:**
- Confirmar pago exitoso
- Celebrar la compra
- Solicitar confirmación de dirección

**Subject:**
```
Pago confirmado — tu pieza Bagclue es tuya
```

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (8 chars)
  productName: string;           // product_snapshot.title
  productBrand: string;          // product_snapshot.brand
  amount: number;                // order.total
  currency: string;              // 'MXN'
  paymentMethod: string;         // 'card' | 'bank_transfer_mxn'
  isGuest: boolean;              // si user_id es null
  // URLs
  addressUrl: string;            // /account/addresses
  trackingUrl: string;           // /track/[tracking_token]
}
```

**Contenido:**
- Saludo
- "¡Tu pago ha sido confirmado!"
- **Copy clave:** "Tu pieza Bagclue es tuya." (solo para compra completa)
- Producto: "[Marca] [Título]"
- Monto pagado: "$X,XXX MXN"
- Número de pedido: #ad977b57
- **Estado:** "Pago confirmado ✓"
- **Próximo paso:** "Confirma tu dirección de envío para que podamos preparar tu pedido."
- CTA principal (si usuario logueado): "Confirmar Dirección de Envío" → `/account/addresses`
- CTA principal (si guest): "Ver Seguimiento" → tracking URL (CTA dirección aparece en tracking page)
- Mensaje: "Prepararemos tu envío una vez que confirmes tu dirección."
- Footer estándar

**Template a crear:**
- `src/lib/email/templates/payment-confirmed.ts`

**Función helper:**
```typescript
export async function sendPaymentConfirmedEmail(params: PaymentConfirmedParams): Promise<boolean>
```

**Puntos de integración:**
- **Stripe:** `src/app/api/stripe/webhook/route.ts` (ya existe `sendOrderConfirmationEmail`, reemplazar o complementar)
- **Bank Transfer:** `src/app/api/payments/admin/verify/route.ts` (flujo approve)

**Prioridad:** P0 — Crítico para confirmación de compra

**Nota:** Este email reemplaza/complementa el actual `order-confirmation.ts` para Stripe. Auditar cuál usar o unificar.

---

### EMAIL 5: Comprobante Rechazado ⚠️

**Trigger:**
- POST `/api/payments/admin/verify` con `action = 'reject'`
- `payment_transaction.status = 'rejected'`

**Objetivo:**
- Informar rechazo de forma amable
- Dar motivo claro
- Facilitar resubmisión

**Subject:**
```
Necesitamos revisar tu comprobante de pago
```

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
  expiresAt: string | null;      // transaction.expires_at (puede ser null)
  paymentUrl: string;            // /payment/bank-transfer/[transactionId]?token=[tracking_token]
}
```

**Contenido:**
- Saludo (tono amable, no agresivo)
- "No hemos podido validar tu comprobante de pago."
- Producto: "[Marca] [Título]"
- Referencia: BGTF12345678
- **Motivo:** [rejection_reason] (ejemplos: "Monto incorrecto", "Referencia incorrecta", "Comprobante ilegible")
- Mensaje: "Por favor, revisa los datos de tu transferencia y sube un comprobante nuevo."
- Nota: "Tu pieza sigue reservada. Tienes [tiempo restante] para completar el pago."
- CTA: "Subir Nuevo Comprobante" → payment URL
- Footer estándar

**Template a crear:**
- `src/lib/email/templates/bank-transfer-rejected.ts`

**Función helper:**
```typescript
export async function sendBankTransferRejectedEmail(params: BankTransferRejectedParams): Promise<boolean>
```

**Punto de integración:**
- Archivo: `src/app/api/payments/admin/verify/route.ts`
- Línea aproximada: ~190 (flujo reject, después de update transaction)

**Prioridad:** P0 — Crítico para recuperación de pago

---

### EMAIL 6: Producto Enviado / Tracking 🚚

**Trigger:**
- Admin marca pedido como enviado
- `orders.shipping_status = 'shipped'`
- `orders.tracking_number` set

**Objetivo:**
- Confirmar envío
- Dar info de seguimiento

**Subject:**
```
Tu pieza Bagclue va en camino
```

**Datos necesarios:**
```typescript
{
  to: string;                    // order.customer_email
  customerName: string;          // order.customer_name
  orderId: string;               // order.id (8 chars)
  productName: string;           // product_snapshot.title (desde order_items)
  productBrand: string;          // product_snapshot.brand
  shippingProvider: string;      // order.shipping_provider ('dhl' | 'fedex' | 'manual')
  trackingNumber: string;        // order.tracking_number
  trackingUrl: string | null;    // order.tracking_url (puede ser null)
  orderTrackingUrl: string;      // /track/[tracking_token]
}
```

**Contenido:**
- Saludo
- "¡Tu pieza Bagclue va en camino!"
- Producto: "[Marca] [Título]"
- **Paquetería:** DHL Express / FedEx / Mensajería
- **Número de rastreo:** [tracking_number]
- CTA principal (si tracking_url existe): "Rastrear en [Paquetería]" → tracking_url
- CTA secundario: "Ver Seguimiento en Bagclue" → order tracking URL
- Mensaje: "Recibirás tu pieza en los próximos días."
- Footer estándar

**Template a crear:**
- Ya existe: `src/lib/email/templates/shipping-tracking.ts`

**Función helper:**
- Ya existe: `sendShippingTrackingEmail()` en `mailer.ts`

**Punto de integración:**
- **Auditar:** ¿Existe endpoint `/api/orders/[id]/shipping`?
- **Si existe:** Verificar que llame a `sendShippingTrackingEmail()`
- **Si no existe:** Crear endpoint o agregar email send donde admin actualiza shipping

**Prioridad:** P0 — Crítico para transparencia post-compra

**Nota:** Template ya existe. Solo auditar integración en API route.

---

## EMAILS P1 — DESPUÉS DE PRODUCCIÓN REAL

### EMAIL 7: Apartado Confirmado

**Trigger:**
- Cliente crea apartado exitosamente
- Primera cuota pagada

**Subject:**
```
Apartado confirmado — tu pieza Bagclue te espera
```

**Copy clave:**
- ❌ NO decir "tu pieza es tuya"
- ✅ Decir "Tu pieza quedó reservada para ti"

**Prioridad:** P1 (apartados menos críticos que compras completas en MVP)

---

### EMAIL 8: Pago de Cuota Recibido

**Trigger:**
- Cliente paga cuota de apartado
- No es liquidación final

**Subject:**
```
Cuota recibida — vas [X]% del camino
```

**Prioridad:** P1

---

### EMAIL 9: Recordatorio de Cuota

**Trigger:**
- Cuota próxima a vencer (ej: 3 días antes)

**Subject:**
```
Recordatorio: cuota de tu apartado Bagclue
```

**Prioridad:** P1

---

### EMAIL 10: Apartado Liquidado

**Trigger:**
- Cliente paga última cuota
- Apartado 100% pagado

**Subject:**
```
¡Apartado liquidado! Tu pieza Bagclue es tuya
```

**Copy:**
- ✅ Ahora sí decir "tu pieza es tuya"

**Prioridad:** P1

---

## MAPA DE EMAILS

| # | Email | Familia | Trigger | P0/P1 | Template Nuevo | Integración |
|---|-------|---------|---------|-------|----------------|-------------|
| 1 | Bienvenida | Cuenta | Signup | P0 | ✅ `welcome.ts` | Auth (auditar) |
| 2 | Instrucciones Transferencia | Pago | Bank order created | P0 | ✅ `bank-transfer-instructions.ts` | `/api/payments/bank-transfer/order` |
| 3 | Comprobante Recibido | Pago | Proof uploaded | P0 | ✅ `bank-transfer-proof-received.ts` | `/api/payments/bank-transfer/upload-proof` |
| 4 | Pago Confirmado | Pago | Payment confirmed | P0 | ✅ `payment-confirmed.ts` | Stripe webhook + admin verify |
| 5 | Comprobante Rechazado | Pago | Payment rejected | P0 | ✅ `bank-transfer-rejected.ts` | `/api/payments/admin/verify` |
| 6 | Producto Enviado | Logística | Shipping updated | P0 | ❌ Ya existe: `shipping-tracking.ts` | `/api/orders/[id]/shipping` (auditar) |
| 7 | Apartado Confirmado | Apartado | Layaway created | P1 | ❌ Ya existe: `layaway-confirmation.ts` | Ya integrado |
| 8 | Cuota Recibida | Apartado | Installment paid | P1 | ⏸️ Futuro | N/A |
| 9 | Recordatorio Cuota | Apartado | Due date approaching | P1 | ⏸️ Futuro | N/A |
| 10 | Apartado Liquidado | Apartado | Layaway completed | P1 | ⏸️ Futuro | N/A |

**Total P0:** 6 emails  
**Templates nuevos P0:** 5  
**Template existente P0:** 1 (shipping-tracking)  

---

## ARCHIVOS A CREAR (P0)

1. `src/lib/email/templates/welcome.ts`
2. `src/lib/email/templates/bank-transfer-instructions.ts`
3. `src/lib/email/templates/bank-transfer-proof-received.ts`
4. `src/lib/email/templates/payment-confirmed.ts`
5. `src/lib/email/templates/bank-transfer-rejected.ts`

**Total:** 5 templates nuevos

---

## ARCHIVOS A MODIFICAR (P0)

1. `src/lib/email/mailer.ts`
   - Agregar 5 funciones helper:
     - `sendWelcomeEmail()`
     - `sendBankTransferInstructionsEmail()`
     - `sendBankTransferProofReceivedEmail()`
     - `sendPaymentConfirmedEmail()`
     - `sendBankTransferRejectedEmail()`
   - Auditar: ¿Reemplazar `sendOrderConfirmationEmail()` o complementar?

2. **Auditar primero (signup flow):**
   - ¿Dónde se crea cuenta?
   - ¿Existe hook post-signup?
   - ¿Supabase trigger configurado?
   - **Acción:** Definir punto de integración para Email 1

3. `src/app/api/payments/bank-transfer/order/route.ts`
   - Agregar: `sendBankTransferInstructionsEmail()` después de create transaction

4. `src/app/api/payments/bank-transfer/upload-proof/route.ts`
   - Agregar: `sendBankTransferProofReceivedEmail()` después de update status

5. `src/app/api/payments/admin/verify/route.ts`
   - Flujo approve: `sendPaymentConfirmedEmail()`
   - Flujo reject: `sendBankTransferRejectedEmail()`

6. `src/app/api/stripe/webhook/route.ts`
   - Auditar: ¿Usa `sendOrderConfirmationEmail()`?
   - Reemplazar o complementar con `sendPaymentConfirmedEmail()`

7. **Auditar:** `src/app/api/orders/[id]/shipping/route.ts` (o equivalente)
   - Verificar que llame a `sendShippingTrackingEmail()`
   - Si no existe endpoint, crear o agregar email send donde corresponda

**Total:** 6-7 archivos (1 auditoría signup, 5 bank transfer, 1 auditoría shipping)

---

## ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### FASE 1: Bank Transfer Flow (crítico para MVP)
1. **Email 2:** Instrucciones de transferencia
2. **Email 3:** Comprobante recibido
3. **Email 4:** Pago confirmado (bank transfer path)
4. **Email 5:** Comprobante rechazado

**Rationale:** Completar flujo bank transfer end-to-end antes de producción real.

**Estimación:** 4-5 horas

---

### FASE 2: Stripe + Shipping
5. **Email 4:** Pago confirmado (Stripe path)
6. **Email 6:** Producto enviado (auditar + integrar si falta)

**Rationale:** Asegurar Stripe flow tiene email confirmación + tracking enviado funciona.

**Estimación:** 2-3 horas

---

### FASE 3: Bienvenida
7. **Email 1:** Bienvenida a Bagclue

**Rationale:** Menos crítico que pagos, pero importante para primera impresión.

**Estimación:** 2 horas (incluye auditoría signup)

---

### FASE 4 (P1): Apartados
- Email 7, 8, 9, 10 (apartados)

**Rationale:** Apartados son P1, implementar después de producción real si el flujo gana tracción.

---

## DISEÑO Y ESTILO

### Paleta Bagclue
- **Fondo:** Marfil/Blanco (#FFFBF8, #FFFFFF)
- **Acento:** Rosa Bagclue (#E85A9A)
- **Texto:** Negro elegante (#0B0B0B)
- **Secundario:** Gris suave (#4B5563, #666)

### Tipografía
- **Títulos:** Playfair Display (serif elegante)
- **Cuerpo:** Inter / system fonts (sans-serif limpio)

### Estructura
- Logo/header: "BAGCLUE" en Playfair
- Card principal: fondo blanco, border rosa suave
- Botones CTA: rosa sólido (#E85A9A), hover más oscuro
- Footer: info de contacto, links a Instagram/web

### Responsive
- Mobile-first
- Botones full-width en mobile
- Padding ajustado para pantallas pequeñas

### Remitente
```
From: "Bagclue" <hola@bagclue.com>
```

---

## SEGURIDAD

### Datos que SÍ pueden ir en email:
- ✅ CLABE (necesaria para transferir, dato público del negocio)
- ✅ Payment reference (no sensible)
- ✅ Tracking token en URLs (necesario para acceso)
- ✅ Tracking number (público)
- ✅ Datos del banco (públicos)

### Datos que NO deben imprimirse en logs:
- ❌ SMTP_PASSWORD
- ❌ CLABE en console.log (solo en email)
- ❌ Tracking tokens en logs (solo en URLs)
- ❌ Secrets del environment

### Error Handling No-Fatal

**Regla crítica:** Si email falla, la operación principal NO debe romperse.

**Implementación:**
```typescript
const emailSent = await sendBankTransferInstructionsEmail({ ... });
if (!emailSent) {
  console.warn('[BankTransfer] Email failed to send, but order created successfully');
}
// Continuar con return success
```

**Casos de fallo:**
- SMTP down
- Email bounce
- Network timeout
- Invalid email address

**Resultado:** Operación exitosa, email registrado como fallido, cliente puede acceder a info vía URL.

---

## RIESGOS

### Risk 1: Email cae en spam
- **Probabilidad:** Media (transaccionales pueden ser filtrados)
- **Impacto:** Medio (cliente no ve emails)
- **Mitigación:**
  - Subjects claros, sin palabras spam
  - Contenido transaccional real (no promocional)
  - Cliente puede acceder a info vía URL aunque no reciba email
  - Considerar SPF/DKIM post-MVP (opcional)

### Risk 2: Fallo SMTP rompe operación
- **Probabilidad:** Baja si error handling es correcto
- **Impacto:** Crítico (cliente no puede comprar)
- **Mitigación:** Error handling no-fatal ya implementado en `mailer.ts`

### Risk 3: Cliente no recibe email de instrucciones (bank transfer)
- **Probabilidad:** Media
- **Impacto:** Alto (cliente no sabe cómo pagar)
- **Mitigación:**
  - Payment page muestra instrucciones completas
  - Cliente puede acceder vía `/payment/bank-transfer/[id]?token=...`
  - Email es complementario, no único canal

### Risk 4: Diferenciación compra vs apartado no clara en copy
- **Probabilidad:** Media si no se revisa bien
- **Impacto:** Alto (cliente confundido sobre ownership)
- **Mitigación:**
  - Copy distinto por tipo de pago
  - Condicional en template: `paymentType = 'full_purchase'` vs `'layaway'`
  - Review de textos antes de deploy

### Risk 5: Email bienvenida no se envía (signup flow desconocido)
- **Probabilidad:** Alta si no existe hook
- **Impacto:** Bajo (no crítico para compra)
- **Mitigación:** Auditoría signup obligatoria antes de implementar Email 1

---

## QUÉ NO TOCAR 🚫

- ❌ DB schema (orders, payment_transactions, users)
- ❌ Stripe integration (salvo agregar email send)
- ❌ Bank transfer logic (salvo agregar email send)
- ❌ RLS policies
- ❌ Auth/sessions
- ❌ Frontend checkout flow
- ❌ Frontend tracking page
- ❌ Product validation
- ❌ Order creation logic

**Regla:** Solo agregar llamadas a funciones de email. No modificar lógica de negocio existente.

---

## AUDITORÍAS NECESARIAS ANTES DE IMPLEMENTAR

### 1. Signup Flow (Email 1)
- ¿Dónde se crea cuenta? (Supabase auth)
- ¿Existe hook post-signup?
- ¿Supabase trigger configurado?
- ¿Frontend custom signup route?
- **Acción:** Definir punto exacto de integración

### 2. Stripe Confirmation Email (Email 4)
- ¿Webhook ya envía `sendOrderConfirmationEmail()`?
- ¿Template actual `order-confirmation.ts` es suficiente?
- ¿O necesitamos crear `payment-confirmed.ts` nuevo?
- **Acción:** Decidir si reemplazar o complementar

### 3. Shipping Email (Email 6)
- ¿Existe endpoint `/api/orders/[id]/shipping`?
- ¿Ya llama a `sendShippingTrackingEmail()`?
- ¿O solo actualiza DB sin email?
- **Acción:** Verificar integración o agregar

---

## ESTIMACIÓN TOTAL (P0)

### Desarrollo:
- **Fase 1 (Bank Transfer):** 4-5 horas
- **Fase 2 (Stripe + Shipping):** 2-3 horas
- **Fase 3 (Bienvenida):** 2 horas
- **Auditorías:** 1 hora
- **Testing manual completo:** 2-3 horas

**Total P0:** 11-14 horas

### Complexity:
- **Media:** Infraestructura existe, pero requiere auditorías y decisiones sobre integración Stripe/signup

---

## APROBACIÓN REQUERIDA

**Antes de implementar:**
- [ ] Estrategia general aprobada
- [ ] Subjects aprobados
- [ ] Copy de emails revisado (tono Bagclue)
- [ ] Diferenciación compra/apartado clara
- [ ] Orden de implementación aprobado (Fase 1 → 2 → 3)

**Durante implementación:**
- [ ] Resultados de auditorías (signup, Stripe, shipping)
- [ ] Decisión sobre template Stripe (reutilizar o crear nuevo)

**Después de implementación:**
- [ ] Testing manual P0 completo
- [ ] Deploy a producción aprobado

---

## CONCLUSIÓN

Esta estrategia define:
- ✅ 6 emails P0 críticos antes de producción real
- ✅ 4 emails P1 para después (apartados)
- ✅ Diferenciación clara compra completa vs apartado
- ✅ Orden de implementación por fases
- ✅ Riesgos identificados y mitigaciones
- ✅ Auditorías necesarias antes de implementar
- ✅ Error handling no-fatal para todos los emails

**Ready to implement:** Sí, después de aprobación de estrategia y auditorías.
