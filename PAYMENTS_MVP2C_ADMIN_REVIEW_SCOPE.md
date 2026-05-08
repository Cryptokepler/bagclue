# PAYMENTS MVP.2C — ADMIN PAYMENT REVIEW + CUSTOMER STATUS

**Fecha:** 2026-05-08  
**Objetivo:** Cerrar operativa de pagos por transferencia bancaria MXN

---

## PROBLEMA ACTUAL

1. Cliente sube comprobante → panel muestra "Esperando pago" (incorrecto)
2. Debería decir "Pago en revisión" cuando hay comprobante
3. Admin no tiene pantalla clara para ver pagos pendientes
4. No hay botón visible para aprobar/rechazar

---

## SCOPE MVP.2C

### A. CUSTOMER STATUS CORRECTO ✅

**Rutas a modificar:**
- `/account/orders/[id]` (ya tiene bank transfer block)
- `/payment/bank-transfer/[transactionId]` (ya status-aware)
- `/track/[tracking_token]` (si muestra payment status)

**Estados según `payment_transaction.status`:**

| Status | Texto Cliente | Subtexto | Notas |
|--------|--------------|----------|-------|
| `pending` | "Esperando pago" | "Realiza tu transferencia y sube el comprobante para que podamos validarlo." | Actual |
| `proof_uploaded` | "Pago en revisión" | "Recibimos tu comprobante. Nuestro equipo validará el pago en banco." | **NUEVO** |
| `confirmed` | "Pago confirmado" | "Tu pago fue verificado. Prepararemos tu envío." | Actual |
| `rejected` | "Comprobante rechazado" | Mostrar `rejection_reason` + CTA volver a subir | Actual |

**Timeline ajuste:**
- `payment_status = 'pending'` + `transaction.status = 'pending'` → "Esperando pago"
- `payment_status = 'pending'` + `transaction.status = 'proof_uploaded'` → "Pago en revisión" **NUEVO**
- `payment_status = 'paid'` → "Pago confirmado"

**Archivos a modificar:**
1. `src/app/account/orders/[id]/page.tsx` - Bank transfer block status text
2. `src/app/payment/bank-transfer/[transactionId]/page.tsx` - Ya status-aware, solo ajustar textos
3. `src/components/OrderTimeline.tsx` - Ajustar lógica para "Pago en revisión"

---

### B. ADMIN PAYMENT REVIEW ✅

**Nueva ruta:** `/admin/payments`

**Funcionalidad:**
- Listar `payment_transactions` donde:
  - `status = 'proof_uploaded'` O `status = 'awaiting_approval'`
  - `payment_method = 'bank_transfer_mxn'`
- Ordenar por `proof_uploaded_at DESC` (más recientes primero)

**Card/Row debe mostrar:**
- Order ID (parcial): `****XXXX`
- Transaction ID (parcial): `****XXXX`
- Cliente: `customer_name` + `customer_email` (from orders)
- Producto: `product_snapshot.brand` + `product_snapshot.title` (from order_items)
- Monto: `$X,XXX MXN`
- Referencia: `****XXXX` (parcial)
- Fecha subida: `proof_uploaded_at` (relativa: "hace 2 horas")
- Archivo: `proof_file_name`
- **Botón:** "Ver comprobante" (abre proof_url en nueva pestaña)
- **Botón:** "Aprobar pago" (verde)
- **Botón:** "Rechazar pago" (rojo)
- **Textarea:** Motivo de rechazo (solo visible si clickea "Rechazar")

**Confirmación modal:**
- Aprobar: "¿Confirmar pago de $X,XXX MXN? El producto se marcará como vendido."
- Rechazar: "¿Rechazar comprobante? Razón: [textarea obligatorio]"

**Archivos a crear:**
1. `src/app/admin/payments/page.tsx` - Lista de pagos pendientes
2. `src/app/api/payments/admin/list/route.ts` - GET endpoint para listar
3. `src/components/admin/PaymentReviewCard.tsx` - Card individual (opcional, puede ser inline)

**Backend existente:**
- ✅ `/api/payments/admin/verify` - Ya existe (approve/reject)
- ✅ `isAuthenticated()` - Ya existe para validar admin

---

### C. VER COMPROBANTE ✅

**Problema:** Bucket `bank-payment-proofs` es privado

**Solución MVP:**
1. Verificar si `proof_url` ya es signed URL válido
2. Si no, crear endpoint: `GET /api/payments/admin/proof-url?transaction_id=...`
   - Validar `isAuthenticated()` admin
   - Generar signed URL con 1 hora de validez
   - Return `{ proofUrl: '...' }`

**Archivo a crear (si necesario):**
- `src/app/api/payments/admin/proof-url/route.ts`

**Para MVP:**
- Si `proof_url` funciona directamente → usar
- Si no, implementar endpoint

---

## TESTING OBLIGATORIO

### Customer Side:
1. Transaction con `proof_uploaded` → Ver "Pago en revisión"
2. Admin aprueba → Ver "Pago confirmado"
3. Admin rechaza → Ver "Comprobante rechazado" + razón
4. Timeline muestra estados correctos

### Admin Side:
1. Login admin → `/admin/payments`
2. Ver lista de comprobantes pendientes
3. Click "Ver comprobante" → Abre imagen/PDF
4. Aprobar pago → Success, desaparece de lista
5. Rechazar pago → Pide razón, success, desaparece de lista
6. Validar que order/product se actualizan correctamente

---

## ARCHIVOS A MODIFICAR/CREAR

### Modificar (3):
1. `src/app/account/orders/[id]/page.tsx` - Texto "Pago en revisión"
2. `src/app/payment/bank-transfer/[transactionId]/page.tsx` - Texto status
3. `src/components/OrderTimeline.tsx` - Lógica "Pago en revisión"

### Crear (3-4):
1. `src/app/admin/payments/page.tsx` - Admin UI
2. `src/app/api/payments/admin/list/route.ts` - GET pending payments
3. `src/app/api/payments/admin/proof-url/route.ts` - Signed URL (si necesario)
4. `src/components/admin/PaymentReviewCard.tsx` - (opcional, puede ser inline)

---

## NO TOCAR

❌ DB schema  
❌ RLS  
❌ Stripe Live  
❌ Stripe webhook  
❌ Checkout Stripe  
❌ Layaways  
❌ Emails (salvo TODO comments)  
❌ Diseño público general  

---

## ESTIMACIÓN

- **Archivos:** 6-7 archivos (3 modificar, 3-4 crear)
- **Complejidad:** Media
- **Tiempo:** 2-3h implementación + 1h testing
- **Deploy:** Manual Vercel CLI + POLÍTICA 12

---

## APROBACIÓN REQUERIDA

**Antes de implementar, confirmar:**
1. ¿Aprobar scope completo A + B + C?
2. ¿Crear `/admin/payments` como ruta nueva?
3. ¿Textos customer "Pago en revisión" aprobados?
4. ¿UI admin debe tener confirmación modal o inline?
5. ¿Prioridad: implementar completo o por partes (A primero, luego B)?

**Esperando tu aprobación para proceder.**
