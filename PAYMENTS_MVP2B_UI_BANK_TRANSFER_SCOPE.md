# PAYMENTS MVP.2B — UI CLIENTE TRANSFERENCIA BANCARIA MXN

**Proyecto:** Bagclue E-commerce  
**Fase:** PAYMENTS MVP.2B — Frontend Bank Transfer UI  
**Fecha:** 2026-05-08  
**Autor:** Kepler  
**Requiere aprobación:** Jhonatan

---

## 🎯 OBJETIVO

Permitir que una clienta elija pagar una compra completa por transferencia bancaria MXN desde la web de Bagclue.

**Alcance:** Solo compra completa (full purchase), NO apartados todavía.

---

## 📊 ESTADO ACTUAL — AUDITORÍA DEL FLUJO DE CHECKOUT

### Flujo actual (solo Stripe)

1. Cliente agrega producto al carrito (`/cart`)
2. Completa datos:
   - `customer_name`
   - `customer_email`
   - `customer_phone` (opcional)
3. Click "Proceder al pago"
4. POST `/api/checkout/create-session` (Stripe)
5. Redirect a Stripe Checkout
6. Pago con tarjeta
7. Webhook procesa
8. Redirect a `/checkout/success?session_id=cs_...`

### Customer Auth/Guest Flow

**Autenticado (`supabaseCustomer.auth.getUser()`):**
- Email pre-cargado desde `user.email`
- Nombre/teléfono desde `customer_profiles` si existe
- Authorization header: `Bearer {access_token}`

**Guest (no autenticado):**
- Completa email/nombre/teléfono manualmente
- Sin Authorization header
- Order creada con `user_id = null`

### Create Checkout actual

**Endpoint:** `POST /api/checkout/create-session`

**Payload:**
```json
{
  "items": [{"product_id": "uuid"}],
  "customer_name": "...",
  "customer_email": "...",
  "customer_phone": "..." // opcional
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Backend crea:**
- Order con `payment_status: pending`, `status: pending`
- Order_items con `product_snapshot`
- Producto: `available` → `reserved`
- Stripe session con `metadata: {order_id}`

### Checkout Success actual

**Ruta:** `/checkout/success?session_id=cs_...`

**Acción:**
- Verifica session con `GET /api/checkout/verify-session?session_id=...`
- Muestra mensaje de éxito
- Link a `/account/orders` si autenticado

---

## 🏗️ ARQUITECTURA PROPUESTA

### 1. Selector de Método de Pago

**Ubicación:** `/cart` (modificar página existente)

**UI propuesta:**

```
┌─────────────────────────────────────┐
│ CARRITO (1 pieza - $20 MXN)        │
├─────────────────────────────────────┤
│ Hermès Birkin 30 - $20 MXN         │
│ [Eliminar]                          │
├─────────────────────────────────────┤
│ MÉTODO DE PAGO                      │
│                                     │
│ ○ Transferencia bancaria (MXN)     │
│   └─ Pago en pesos mexicanos       │
│      Confirmación en 24-48h        │
│                                     │
│ ○ Tarjeta (Stripe)                 │
│   └─ Pago inmediato                │
│      Aceptamos Visa, MasterCard    │
│                                     │
│ [Continuar]                         │
└─────────────────────────────────────┘
```

**Lógica:**
- Default: Transferencia bancaria (México) o Tarjeta (internacional)
- Radio buttons para elegir método
- Validación de datos cliente igual que ahora
- Button text cambia según método:
  - Bank transfer: "Ver instrucciones de pago"
  - Stripe: "Proceder al pago"

---

### 2. Flujo Bank Transfer MXN

#### Paso 2.1 — Crear Orden

**Trigger:** Click "Ver instrucciones de pago" con método = bank_transfer

**API Call:**
```typescript
POST /api/payments/bank-transfer/order

{
  "productId": "uuid",            // un solo producto (MVP.2B)
  "customerName": "...",
  "customerEmail": "...",
  "customerPhone": "..."
}
```

**Response:**
```json
{
  "orderId": "uuid",
  "transactionId": "uuid",
  "paymentReference": "BGCL-...",
  "amountMxn": 20,
  "expiresAt": "2026-05-09T10:00:00Z",
  "bankConfig": {
    "bankName": "BANORTE",
    "accountHolder": "BAG CLUE SA DE CV",
    "clabe": "[REDACTED — configured in Vercel env BANK_CLABE]",
    "accountNumber": "",
    "paymentInstructions": "..."
  }
}
```

**Backend crea:**
- Order con `payment_status: pending`, `status: pending`
- Order_items con product_snapshot
- Producto: `available` → `reserved`
- Payment_transaction con `status: pending`, `expires_at: +24h`

#### Paso 2.2 — Mostrar Instrucciones de Pago

**Ruta propuesta:** `/payment/bank-transfer/[transactionId]`

**Alternativa:** `/orders/[orderId]/payment-instructions`

**UI propuesta:**

```
┌──────────────────────────────────────────┐
│ 🏦 INSTRUCCIONES DE PAGO                │
├──────────────────────────────────────────┤
│ Tu pieza queda reservada 24 horas        │
│                                          │
│ PASO 1: Realiza la transferencia        │
│                                          │
│ Monto a transferir:                      │
│ $20.00 MXN                               │
│                                          │
│ Banco destino:                           │
│ BANORTE                                  │
│                                          │
│ Titular:                                 │
│ BAG CLUE SA DE CV                        │
│                                          │
│ CLABE:                                   │
│ ****0145  [📋 Copiar]                    │
│                                          │
│ Referencia de pago (IMPORTANTE):        │
│ BGCL-1778231705529-JMJF  [📋 Copiar]   │
│                                          │
│ ⏰ Válido hasta:                         │
│ 09 May 2026, 10:00 AM                   │
│                                          │
│ ⚠️ Importante:                           │
│ • Incluye la referencia en tu pago      │
│ • Guarda tu comprobante                 │
│ • Sube tu comprobante después del pago  │
│                                          │
│ [Subir comprobante de pago]             │
│                                          │
│ ¿Necesitas ayuda?                        │
│ WhatsApp: +52 442 123 4567              │
└──────────────────────────────────────────┘
```

**Funcionalidades:**
- Copy to clipboard para CLABE y referencia
- Countdown timer hasta `expiresAt`
- Botón deshabilitado si expiró
- Warning si quedan <2 horas
- Link a WhatsApp para soporte

**Seguridad:**
- Datos bancarios solo visibles después de crear order
- URL protegida por `transactionId` único
- Ownership validation: solo quien creó la orden (por email) puede ver

---

### 3. Upload Comprobante

#### Paso 3.1 — Form de Upload

**Ubicación:** Mismo `/payment/bank-transfer/[transactionId]` (botón/sección abajo de instrucciones)

**UI propuesta:**

```
┌──────────────────────────────────────────┐
│ PASO 2: Sube tu comprobante              │
├──────────────────────────────────────────┤
│ Una vez realizada la transferencia,      │
│ sube tu comprobante para que nuestro     │
│ equipo valide tu pago.                   │
│                                          │
│ Formatos aceptados: JPG, PNG, PDF       │
│ Tamaño máximo: 5 MB                     │
│                                          │
│ [📎 Seleccionar archivo]                │
│                                          │
│ archivo_seleccionado.jpg (2.1 MB)       │
│                                          │
│ [Subir comprobante]                      │
└──────────────────────────────────────────┘
```

**API Call:**
```typescript
POST /api/payments/bank-transfer/upload-proof
Content-Type: multipart/form-data

transactionId: "uuid"
customerEmail: "..."
file: File
```

**Validaciones frontend:**
- File type: JPG, JPEG, PNG, PDF
- File size: max 5MB
- Preview imagen antes de upload
- Progress bar durante upload

#### Paso 3.2 — Estado Post-Upload

**UI propuesta (reemplaza form):**

```
┌──────────────────────────────────────────┐
│ ✅ COMPROBANTE RECIBIDO                  │
├──────────────────────────────────────────┤
│ Hemos recibido tu comprobante            │
│ correctamente.                           │
│                                          │
│ Nuestro equipo validará tu pago en las  │
│ próximas 24-48 horas.                    │
│                                          │
│ Te enviaremos una confirmación por       │
│ correo electrónico una vez aprobado tu  │
│ pago.                                    │
│                                          │
│ Estado actual: Pendiente de verificación│
│                                          │
│ Número de pedido: #0901854c             │
│                                          │
│ [Ver mi pedido]                          │
│ [Volver al catálogo]                     │
└──────────────────────────────────────────┘
```

**Backend actualiza:**
- Transaction: `pending` → `proof_uploaded`
- `proof_url`, `proof_file_name`, `proof_hash`, `proof_uploaded_at` guardados

---

### 4. Tracking de Estado

**Ruta:** `/account/orders` (ya existe)

**Modificación necesaria:**

Agregar badge de estado según `payment_status`:

```typescript
{payment_status === 'pending' && payment_method === 'bank_transfer_mxn' && (
  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
    Pendiente de verificación
  </span>
)}

{payment_status === 'paid' && (
  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
    Pagado
  </span>
)}
```

**Link a instrucciones:**
- Si `proof_uploaded`: mostrar "Ver comprobante" (disabled o link a estado)
- Si `pending` y no expiró: "Subir comprobante" → redirect a `/payment/bank-transfer/[transactionId]`

---

## 🔧 COMPONENTES NECESARIOS

### Componentes nuevos a crear

1. **`PaymentMethodSelector.tsx`**
   - Radio buttons: bank_transfer_mxn | stripe
   - Props: `selected`, `onChange`, `disabled`
   - Location: `/src/components/checkout/PaymentMethodSelector.tsx`

2. **`BankTransferInstructions.tsx`**
   - Muestra datos bancarios
   - Copy buttons
   - Countdown timer
   - Props: `bankConfig`, `amount`, `reference`, `expiresAt`
   - Location: `/src/components/payment/BankTransferInstructions.tsx`

3. **`ProofUploadForm.tsx`**
   - File input con validación
   - Preview de imagen
   - Progress bar
   - Props: `transactionId`, `customerEmail`, `onSuccess`
   - Location: `/src/components/payment/ProofUploadForm.tsx`

4. **`PaymentStatusBadge.tsx`**
   - Badge según payment_status
   - Props: `paymentStatus`, `paymentMethod`
   - Location: `/src/components/orders/PaymentStatusBadge.tsx`

### Páginas nuevas a crear

1. **`/src/app/payment/bank-transfer/[transactionId]/page.tsx`**
   - Instrucciones de pago
   - Upload de comprobante
   - Estado post-upload
   - Server component con ownership validation

### Páginas a modificar

1. **`/src/app/cart/page.tsx`**
   - Agregar `PaymentMethodSelector`
   - Lógica para manejar bank_transfer vs stripe
   - Redirect según método seleccionado

2. **`/src/app/account/orders/page.tsx`**
   - Agregar `PaymentStatusBadge`
   - Link a instrucciones de pago si pending

---

## 🔒 SEGURIDAD

### Validaciones requeridas

1. **Datos bancarios NO públicos:**
   - ❌ NO hardcodear CLABE en código frontend
   - ✅ Obtener desde API solo después de crear order
   - ✅ Ownership validation por `customer_email` o `user_id`

2. **Upload comprobante:**
   - ✅ Validar ownership antes de permitir upload
   - ✅ File type validation (frontend + backend)
   - ✅ File size validation (max 5MB)
   - ✅ Sanitizar filename

3. **Logs:**
   - ❌ NO imprimir CLABE completa en console.log
   - ❌ NO imprimir payment_reference completo en frontend
   - ✅ Solo mostrar en UI cuando sea necesario

4. **URL protection:**
   - ✅ `/payment/bank-transfer/[transactionId]` requiere `customer_email` query param o auth
   - ✅ Validar ownership server-side antes de renderizar

---

## 🛣️ RUTAS PROPUESTAS

### Opción A (Recomendada)

```
/cart
  → [método = bank_transfer]
  → POST /api/payments/bank-transfer/order
  → redirect to /payment/bank-transfer/[transactionId]?email=...

/payment/bank-transfer/[transactionId]
  → Server component
  → GET /api/payments/bank-transfer/config?transaction_id=...&customer_email=...
  → Muestra instrucciones
  → Form upload comprobante
  → POST /api/payments/bank-transfer/upload-proof
  → Muestra estado post-upload

/account/orders
  → Lista de órdenes
  → Badge de estado
  → Link a /payment/bank-transfer/[transactionId] si pending
```

### Opción B (Alternativa)

```
/cart
  → [método = bank_transfer]
  → POST /api/payments/bank-transfer/order
  → redirect to /orders/[orderId]/payment-instructions

/orders/[orderId]/payment-instructions
  → Server component
  → GET /api/payments/bank-transfer/config?order_id=...&customer_email=...
  → ...resto igual
```

**Recomendación:** Opción A (más explícita, mejor para tracking)

---

## 🧪 TESTING REQUERIDO

### Tests funcionales

1. ✅ Cliente elige transferencia bancaria en `/cart`
2. ✅ Order se crea correctamente
3. ✅ Producto pasa a `reserved`
4. ✅ Instrucciones se muestran en `/payment/bank-transfer/[transactionId]`
5. ✅ Copy CLABE funciona
6. ✅ Copy referencia funciona
7. ✅ Countdown timer funciona
8. ✅ Upload comprobante funciona (JPG/PNG/PDF)
9. ✅ File validation funciona (<5MB, tipos permitidos)
10. ✅ Estado `proof_uploaded` visible post-upload
11. ✅ Stripe checkout sigue funcionando (no regresión)
12. ✅ Mobile responsive correcto
13. ✅ Sin errores críticos en console

### Tests de seguridad

1. ✅ URL `/payment/bank-transfer/[transactionId]` requiere ownership
2. ✅ Cliente A no puede ver instrucciones de cliente B
3. ✅ Datos bancarios NO accesibles sin crear order
4. ✅ Upload solo permitido al owner de la transaction
5. ✅ Sin CLABE completa en logs del navegador

### Tests de UX

1. ✅ Instrucciones claras y fáciles de seguir
2. ✅ Copy buttons funcionan en mobile
3. ✅ Timer countdown legible
4. ✅ Upload form intuitivo
5. ✅ Preview de imagen funciona
6. ✅ Estado post-upload tranquiliza al cliente

---

## 🚫 FUERA DE ALCANCE (NO IMPLEMENTAR)

1. ❌ Apartados por transferencia bancaria
2. ❌ Cuotas / layaways bank transfer
3. ❌ Stripe USD checkout (ya existe y funciona)
4. ❌ Activar Stripe Live
5. ❌ Admin verification UI nueva (existe en `/admin`, no modificar UI)
6. ❌ Email confirmaciones bank transfer (puntos de integración ya existen, no implementar templates)
7. ❌ Multi-item cart para bank transfer (solo 1 producto por MVP.2B)
8. ❌ Editar/cancelar orden después de crear
9. ❌ Resubir comprobante si rechazado (manual por ahora)

---

## 📦 DEPENDENCIAS

### Backend (ya existe - MVP.2A)

- ✅ `POST /api/payments/bank-transfer/order`
- ✅ `GET /api/payments/bank-transfer/config`
- ✅ `POST /api/payments/bank-transfer/upload-proof`
- ✅ Ownership validation
- ✅ Storage bucket `bank-payment-proofs`

### Frontend (nuevo - MVP.2B)

- ⏸️ Payment method selector
- ⏸️ Bank transfer instructions page
- ⏸️ Proof upload form
- ⏸️ Payment status badges
- ⏸️ Copy to clipboard utility
- ⏸️ Countdown timer component

---

## 📊 ESTIMACIÓN

**Complejidad:** Media

**Componentes:** 4 nuevos + 2 modificados  
**Páginas:** 1 nueva + 2 modificadas  
**Backend:** 0 cambios (ya existe)  
**Testing:** ~15 tests funcionales + 5 seguridad

**Tiempo estimado:** 6-8 horas de desarrollo + 2-3 horas QA

---

## 📋 PLAN DE IMPLEMENTACIÓN (Propuesto)

### Fase 1 — Payment Method Selector (2h)
1. Crear `PaymentMethodSelector.tsx`
2. Modificar `/cart/page.tsx`
3. Lógica de redirección según método
4. Testing básico

### Fase 2 — Bank Transfer Instructions (2h)
1. Crear `/payment/bank-transfer/[transactionId]/page.tsx`
2. Crear `BankTransferInstructions.tsx`
3. Integrar API `/api/payments/bank-transfer/config`
4. Copy buttons
5. Countdown timer

### Fase 3 — Proof Upload (2h)
1. Crear `ProofUploadForm.tsx`
2. File validation
3. Preview imagen
4. Integrar API `/api/payments/bank-transfer/upload-proof`
5. Estados: initial, uploading, success, error

### Fase 4 — Order Tracking (1h)
1. Crear `PaymentStatusBadge.tsx`
2. Modificar `/account/orders/page.tsx`
3. Links a payment instructions

### Fase 5 — Testing & QA (2h)
1. Tests funcionales (13 tests)
2. Tests de seguridad (5 tests)
3. Mobile responsive
4. Cross-browser (Chrome, Safari, Firefox)

### Fase 6 — Refinamiento (1h)
1. UX polish
2. Loading states
3. Error handling
4. Copy adjustments

---

## 🎨 DISEÑO UI

### Paleta de colores (mantener consistencia)

- Primary: `#E85A9A` (rosa Bagclue)
- Success: `#10B981` (verde)
- Warning: `#F59E0B` (amarillo)
- Error: `#EF4444` (rojo)
- Gray: `#0B0B0B`, `#6B7280`, `#F7F7F7`

### Tipografía

- Headings: `Playfair Display`
- Body: `Inter`
- Tracking: `0.16em` uppercase para labels

### Espaciado

- Padding interno: `px-6 py-4`
- Margin entre secciones: `mb-8`
- Max width contenedores: `max-w-2xl` (instrucciones de pago)

---

## 📄 ENTREGABLES

1. ✅ **Este documento:** `PAYMENTS_MVP2B_UI_BANK_TRANSFER_SCOPE.md`
2. ⏸️ Componentes React (4 nuevos)
3. ⏸️ Páginas Next.js (1 nueva, 2 modificadas)
4. ⏸️ QA Report: `PAYMENTS_MVP2B_QA_REPORT.md`
5. ⏸️ Screenshots UI en mobile/desktop

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Must-have (obligatorio)

1. ✅ Cliente puede elegir método de pago en `/cart`
2. ✅ Instrucciones de pago se muestran correctamente
3. ✅ CLABE y referencia son copiables
4. ✅ Upload de comprobante funciona (JPG/PNG/PDF <5MB)
5. ✅ Estado post-upload visible
6. ✅ Ownership validation funcional
7. ✅ Stripe checkout sigue funcionando
8. ✅ Mobile responsive
9. ✅ Sin exposición de secretos

### Nice-to-have (opcional)

1. 🎁 Animaciones en copy button (checkmark temporal)
2. 🎁 Preview de imagen antes de upload
3. 🎁 Drag & drop para upload
4. 🎁 Notificación push cuando admin aprueba (fuera de MVP.2B)

---

## 🚦 DECISIÓN REQUERIDA

**Status:** ⏸️ **PENDIENTE DE APROBACIÓN**

**Aprobador:** Jhonatan

**Preguntas antes de implementar:**

1. ✅ ¿Aprobar Opción A de rutas? (`/payment/bank-transfer/[transactionId]`)
2. ✅ ¿Limitar a 1 producto por orden en MVP.2B? (multi-item en MVP.2C)
3. ✅ ¿Email confirmaciones bank transfer son P0 o P1? (puntos de integración ya existen)
4. ✅ ¿Permitir resubir comprobante si rechazado? (manual admin por ahora)

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-08 10:52 UTC  
**Basado en:** MVP.2A Backend (PASS)  
**Siguiente paso:** Aprobación de scope → Implementación
