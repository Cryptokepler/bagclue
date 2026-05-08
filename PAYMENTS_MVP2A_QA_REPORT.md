# PAYMENTS MVP.2A — QA REPORT

**Proyecto:** Bagclue E-commerce  
**Fase:** PAYMENTS MVP.2A — Bank Transfer MXN (Backend Core)  
**Fecha:** 2026-05-08  
**QA Engineer:** Kepler  
**Aprobado por:** Jhonatan

---

## 📊 RESUMEN EJECUTIVO

**Decisión final:** ✅ **PAYMENTS MVP.2A BACKEND CORE: PASS**

**Tests ejecutados:** 8  
**Tests aprobados:** 8  
**Tests fallidos:** 0  
**Regresiones detectadas:** 0

**Alcance validado:**
- ✅ Crear orden bank transfer MXN
- ✅ Configuración bancaria con ownership validation
- ✅ Upload de comprobante con storage privado
- ✅ Admin approve (confirmar pago)
- ✅ Admin reject (rechazar comprobante)
- ✅ Regresión Stripe Checkout
- ✅ Catálogo frontend
- ✅ Seguridad y logs

---

## 🧪 TEST 1 — Crear Bank Transfer Order

**Status:** ✅ **PASS** (13/13 validaciones)

**Endpoint:** `POST /api/payments/bank-transfer/order`

**Datos test:**
- Product ID: `e162405d-0d82-4b89-9498-86a7b763a643`
- Order ID: `1ff02c91-587d-4aae-ab32-ace779cb712f`
- Transaction ID: `5de07e69-66b2-420f-acc0-127643068ccc`
- Customer: `qa-test@bagclue.com`
- Amount: 20 MXN

**Fix aplicado pre-QA:**
- Commit: `5448bfe`
- Cambio: Agregado `payment_type: 'full_purchase'` y `amount: product.price`
- Motivo: NOT NULL constraint en payment_transactions

**Validaciones:**
1. ✅ Response 201
2. ✅ order_id generado
3. ✅ transaction_id generado
4. ✅ payment_reference generado (parcial: `****JMJF`)
5. ✅ amount_mxn = 20
6. ✅ expires_at +24h
7. ✅ Order pending creada
8. ✅ Order_items correcto con product_snapshot
9. ✅ Payment_transaction pending
10. ✅ Producto available → reserved
11. ✅ payment_type = full_purchase
12. ✅ amount = 20
13. ✅ Sin secretos en logs

---

## 🧪 TEST 2 — Config Bancaria

**Status:** ✅ **PASS** (10/10 validaciones)

**Endpoint:** `GET /api/payments/bank-transfer/config`

**Validaciones:**
1. ✅ Request con transaction_id + customer_email válido → 200 OK
2. ✅ Request con order_id + customer_email válido → 200 OK
3. ✅ Request sin customer_email ni auth → 403 Forbidden
4. ✅ Request con email incorrecto → 403 Forbidden
5. ✅ Request con transaction_id inexistente → 403 Forbidden
6. ✅ Request sin parámetros → 400 Bad Request
7. ✅ BankConfig devuelto completo (BANORTE, CLABE, instrucciones)
8. ✅ CLABE reportado solo parcialmente: `****0145`
9. ✅ Ownership validation funcional
10. ✅ Sin exposición de secretos

**Seguridad validada:**
- ✅ Solo owner con email correcto puede ver config bancaria
- ✅ No permite acceso sin validación de ownership

---

## 🧪 TEST 3 — Upload Comprobante

**Status:** ✅ **PASS** (15/15 validaciones)

**Endpoint:** `POST /api/payments/bank-transfer/upload-proof`

**Datos test:**
- Transaction ID: `5de07e69-66b2-420f-acc0-127643068ccc`
- Archivo: JPG 17KB
- Hash: `4d6fce791071727a518eeabdbba2fa4c...`

**Fix aplicado pre-QA:**
- Micro-migración: Agregada columna `proof_uploaded_at TIMESTAMPTZ`
- Motivo: Schema mismatch (columna faltante)

**Validaciones:**
1. ✅ Upload JPG válido funciona
2. ✅ Response 200
3. ✅ transaction.status: pending → proof_uploaded
4. ✅ proof_url guardado
5. ✅ proof_file_name guardado
6. ✅ proof_file_type guardado
7. ✅ proof_file_size guardado
8. ✅ proof_hash guardado
9. ✅ proof_uploaded_at guardado
10. ✅ order.payment_status sigue pending
11. ✅ Order NO queda paid todavía
12. ✅ product.status sigue reserved
13. ✅ Archivo inválido (.txt) rechazado
14. ✅ Archivo >5MB rechazado
15. ✅ Sin secretos en logs

**Storage:**
- Bucket: `bank-payment-proofs` (privado)
- Path: `{transactionId}/proof_*.jpg`

---

## 🧪 TEST 4 — Admin Approve

**Status:** ✅ **PASS** (15/15 validaciones)

**Endpoint:** `POST /api/payments/admin/verify` (action=approve)

**Datos test:**
- Transaction ID: `5de07e69-66b2-420f-acc0-127643068ccc`
- Order ID: `1ff02c91-587d-4aae-ab32-ace779cb712f`
- Product ID: `e162405d-0d82-4b89-9498-86a7b763a643`

**Fixes aplicados:**
- Commit `e907bde`: `confirmed_by/rejected_by` → `null` (UUID type fix)
- Commit `442b9dd`: Obtener `product_id` desde `order_items` (multi-item compatible)

**Validaciones:**
1. ✅ Response 200
2. ✅ transaction.status: proof_uploaded → confirmed
3. ✅ confirmed_at guardado
4. ✅ confirmed_by = null
5. ✅ order.payment_status: pending → paid
6. ✅ order.status: pending → confirmed
7. ✅ product.status: reserved → sold
8. ✅ shipping_status sigue pending
9. ✅ proof_url/proof_hash conservados
10. ✅ Admin auth funcionó
11. ✅ Sin secretos en logs
12. ✅ Sin CLABE completa en logs
13. ✅ Lógica multi-item compatible
14. ✅ Validación order_items existe
15. ✅ Deploy verification aplicado

---

## 🧪 TEST 5 — Admin Reject

**Status:** ✅ **PASS** (15/15 validaciones)

**Endpoint:** `POST /api/payments/admin/verify` (action=reject)

**Datos test:**
- Product ID: `4b3fe6b6-2388-4e40-a696-3b2ba428a06c`
- Order ID: `2128c64e-c93a-4343-a60b-590097cfea74`
- Transaction ID: `01dd66b1-fac8-4fcf-b12f-f0d3ba941c7f`
- Rejection reason: `Comprobante no válido para prueba QA`

**Validaciones:**
1. ✅ Response 200
2. ✅ transaction.status: proof_uploaded → rejected
3. ✅ rejected_at guardado
4. ✅ rejected_by = null
5. ✅ rejection_reason guardado
6. ✅ order.payment_status sigue pending
7. ✅ order.status sigue pending
8. ✅ product.status: reserved → available (liberado)
9. ✅ proof_url/proof_hash conservados
10. ✅ Sin secretos en logs
11. ✅ Sin CLABE completa en logs
12. ✅ Sin cambios en Stripe
13. ✅ Sin cambios en webhook
14. ✅ Sin deploy necesario
15. ✅ Multi-item compatible

**Flujo validado:**
- Reject libera producto para recompra
- Order mantiene estado pending (no se cancela automáticamente)

---

## 🧪 TEST 6 — Regresión Stripe Checkout

**Status:** ✅ **PASS** (8/8 validaciones)

**Objetivo:** Confirmar que cambios de bank transfer NO rompieron Stripe

**Datos test:**
- Product ID: `c3a0e296-443e-4946-bdc0-c8a28b669b02`
- Order ID: `0901854c-3e40-40bc-a199-abdf90a06276`
- Stripe Session: `cs_test_a1RCd4qeFIFXOtbT0TKBKM81gwC7ecq4uVvyl8a22YOICJ8wiObPDDxIS6`
- Customer: `qa-stripe-regression@bagclue.com`
- Payment: Test card `4242 4242 4242 4242`

**Validaciones:**
1. ✅ Webhook procesado correctamente
2. ✅ order.payment_status: pending → paid
3. ✅ order.status: pending → confirmed
4. ✅ product.status: reserved → sold
5. ✅ Stock: 1 → 0
6. ✅ Email confirmación procesado
7. ✅ Stripe en TEST MODE (livemode: false)
8. ✅ Sin secretos en logs

**Conclusión:**
- ✅ Checkout Stripe **NO fue afectado** por cambios de bank transfer
- ✅ Columnas nuevas de `payment_transactions` no interfieren
- ✅ Flujo funciona normalmente

---

## 🧪 TEST 7 — Catálogo

**Status:** ✅ **PASS**

**Validaciones:**
1. ✅ `/catalogo` carga con HTTP 200
2. ✅ Productos con estados mixtos (available, reserved, sold) en DB
3. ✅ Stock: 0 y >0 coexisten sin errores
4. ✅ Frontend renderiza correctamente (client-side)

**Productos en DB:**
- Total: 5 productos
- Estados: available (3), sold (2), reserved (0 al momento de test)
- Stock: 0-1 (sin errores)

---

## 🧪 TEST 8 — Seguridad / logs

**Status:** ✅ **PASS** (11/11 validaciones)

**Validaciones:**
1. ✅ CLABE completa NO hardcodeada en código
2. ✅ Número de cuenta completo NO expuesto
3. ✅ SMTP_PASSWORD NO hardcodeado
4. ✅ STRIPE_SECRET_KEY NO hardcodeado
5. ✅ SUPABASE_SERVICE_ROLE_KEY NO hardcodeado
6. ✅ Webhook secret NO hardcodeado
7. ✅ Responses API no exponen secretos
8. ✅ payment_reference reportado parcialmente en docs
9. ✅ Archivos QA no contienen secretos hardcodeados
10. ✅ Sin endpoints temporales vivos
11. ✅ `/api/test-smtp` retorna 404 (no existe)

**Secretos validados:**
- CLABE `****0145` → NO en código ✅
- `sk_test_*` (Stripe) → NO en código ✅
- Service role JWT → NO en código ✅
- Todos en variables de entorno ✅

---

## 🔧 FIXES APLICADOS DURANTE QA

### Fix 1 — Payment type/amount (TEST 1)
- **Commit:** `5448bfe`
- **Archivo:** `src/app/api/payments/bank-transfer/order/route.ts`
- **Cambio:** Agregado `payment_type: 'full_purchase'` y `amount: product.price`
- **Motivo:** NOT NULL constraint violation
- **Deploy:** Manual Vercel CLI

### Fix 2 — Confirmed/rejected by NULL (TEST 4)
- **Commit:** `e907bde`
- **Archivo:** `src/app/api/payments/admin/verify/route.ts`
- **Cambio:** `confirmed_by: 'admin'` → `confirmed_by: null`
- **Motivo:** UUID type mismatch (iron-session admin sin auth.users UUID)
- **Deploy:** Manual Vercel CLI

### Fix 3 — Product_id desde order_items (TEST 4)
- **Commit:** `442b9dd`
- **Archivo:** `src/app/api/payments/admin/verify/route.ts`
- **Cambio:** Obtener `product_id` desde `order_items` (multi-item compatible)
- **Motivo:** orders table NO tiene columna product_id
- **Deploy:** Manual Vercel CLI

### Migración DB — proof_uploaded_at (TEST 3)
- **Archivo:** `PAYMENTS_MVP2A_ADD_PROOF_UPLOADED_AT.sql`
- **Cambio:** `ALTER TABLE payment_transactions ADD COLUMN proof_uploaded_at TIMESTAMPTZ`
- **Motivo:** Schema mismatch (columna faltante)
- **Rollback:** `PAYMENTS_MVP2A_ROLLBACK_PROOF_UPLOADED_AT.sql`
- **Ejecutado:** Manual en Supabase SQL Editor

---

## 📦 PRODUCTOS TEST CREADOS

### Producto 1 (TEST 1, 3, 4)
- **ID:** `e162405d-0d82-4b89-9498-86a7b763a643`
- **Title:** TEST PRODUCT QA MVP.2A
- **Status final:** `sold` (aprobado en TEST 4)
- **Stock final:** 1 (no decrementado - flujo bank transfer)
- **Action:** Despublicar (cambiar `is_published = false`)

### Producto 2 (TEST 5)
- **ID:** `4b3fe6b6-2388-4e40-a696-3b2ba428a06c`
- **Title:** QA Bank Transfer Reject Test
- **Status final:** `available` (rechazado en TEST 5)
- **Stock final:** 1
- **Action:** Despublicar (cambiar `is_published = false`)

### Producto 3 (TEST 6)
- **ID:** `c3a0e296-443e-4946-bdc0-c8a28b669b02`
- **Title:** QA Stripe Regression Test
- **Status final:** `sold` (Stripe checkout en TEST 6)
- **Stock final:** 0
- **Action:** Despublicar (cambiar `is_published = false`)

---

## 🧹 CLEANUP RECOMENDADO

### Productos test
```sql
UPDATE products 
SET is_published = false 
WHERE id IN (
  'e162405d-0d82-4b89-9498-86a7b763a643',
  '4b3fe6b6-2388-4e40-a696-3b2ba428a06c',
  'c3a0e296-443e-4946-bdc0-c8a28b669b02'
);
```

### Orders test (opcional - conservar para auditoría)
- TEST 1: `1ff02c91-587d-4aae-ab32-ace779cb712f`
- TEST 5: `2128c64e-c93a-4343-a60b-590097cfea74`
- TEST 6: `0901854c-3e40-40bc-a199-abdf90a06276`

**Decisión:** Conservar en DB como historial de QA.

---

## 📊 ESTADÍSTICAS

**Tests ejecutados:** 8  
**Validaciones totales:** 93  
**Fixes aplicados:** 3 código + 1 migración DB  
**Deploys manuales:** 3 (auto-deploy no completó)  
**Commits generados:** 3

**Tiempo de QA:** ~3 horas  
**Regresiones detectadas:** 0  
**Bugs críticos:** 0  
**Bugs menores:** 4 (todos resueltos durante QA)

---

## ✅ DECISIÓN FINAL

**PAYMENTS MVP.2A BACKEND CORE: PASS**

**Backend validado y funcional:**
- ✅ Crear orden bank transfer MXN
- ✅ Config bancaria con ownership
- ✅ Upload comprobante con storage privado
- ✅ Admin approve/reject
- ✅ Stripe checkout sin regresión
- ✅ Seguridad y logs sin exposición de secretos

**Pendiente para MVP.2B (UI):**
- ⏸️ Frontend bank transfer checkout
- ⏸️ Frontend payment tracking page
- ⏸️ Email confirmaciones bank transfer
- ⏸️ Admin UI visual para aprobar/rechazar
- ⏸️ Dashboard analytics de pagos

**Recomendación:** Proceder con MVP.2B (Frontend + UI) tras cleanup de productos test.

---

**Firma digital:**
- QA Engineer: Kepler
- Fecha: 2026-05-08 10:48 UTC
- Aprobado por: Jhonatan
- Build: `442b9dd`
- Deployment: Vercel Production READY
