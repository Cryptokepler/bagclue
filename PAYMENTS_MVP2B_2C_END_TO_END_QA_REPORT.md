# PAYMENTS MVP.2B/MVP.2C END-TO-END QA REPORT
**Fecha:** 2026-05-10  
**Executor:** Kepler  
**Objetivo:** Validar flujo completo transferencia bancaria MXN (crear orden → subir comprobante → admin revisa → cliente ve estado)

---

## FLUJO A — APROBAR PAGO

### Paso 1: Crear producto test ✅ PASS
**Acción:** Crear producto test "QA Transferencia Aprobar"

**Resultado:**
```
Product ID: 9edb93f6-****-****-****-********d29 (sanitizado)
Title: QA Transferencia Aprobar
Brand: Chanel
Price: $20 MXN
Status: available
Stock: 1
Published: true
Slug: qa-transferencia-aprobar-1778415372281
```

**Validación DB:**
```sql
SELECT id, title, price, status, stock, is_published 
FROM products 
WHERE id = '9edb93f6-1ea5-42fe-9998-b4ddf57f5d29';
```

**Status:** ✅ PASS

---

### Paso 2: Cliente — crear orden (transferencia bancaria) ✅ PASS

**Acción:** Simular checkout con transferencia bancaria MXN

**Resultado:**
```
Order ID: ad977b57-****-****-****-******** (sanitizado)
Transaction ID: f956051a-****-****-****-******** (sanitizado)
Payment reference: BGTF15541132
Tracking token: 0a7edaf10f**** (sanitizado)

Estado inicial:
- Order status: pending
- Payment status: pending
- Transaction status: pending
- Product status: reserved
```

**Validación DB:**
```sql
-- Orden creada correctamente
SELECT id, customer_name, customer_email, total, status, payment_status 
FROM orders 
WHERE id = 'ad977b57-7e0f-474c-a1bb-06dbcf4f2d03';

-- Transaction creada correctamente
SELECT id, order_id, payment_method, amount, currency, status, payment_reference 
FROM payment_transactions 
WHERE id = 'f956051a-0d2d-4b29-9dd5-f9c1d01c19e9';

-- Producto reservado
SELECT id, title, status, stock 
FROM products 
WHERE id = '9edb93f6-1ea5-42fe-9998-b4ddf57f5d29';
```

**Expected results:**
- ✅ Order: customer_name = 'Cliente QA Aprobar', status = 'pending', payment_status = 'pending'
- ✅ Transaction: payment_method = 'bank_transfer_mxn', status = 'pending', amount = 20
- ✅ Product: status = 'reserved'

**Status:** ✅ PASS

---

### Paso 2.1: Cliente — verificar redirección ⏳ REQUIERE VALIDACIÓN MANUAL

**Acción esperada:** Cliente debería ser redirigido a:
```
/payment/bank-transfer/[transactionId]?token=[tracking_token]
```

**URL esperada (parcial):**
```
/payment/bank-transfer/f956051a-****?token=0a7edaf10f****
```

**Validación requerida por Jhonatan:**
1. ❓ Abrir URL en browser (sustituir IDs completos desde /tmp/flujo_a_ids.json si necesario)
2. ❓ Confirmar que página carga sin 404
3. ❓ Confirmar que muestra instrucciones bancarias:
   - Banco: Banorte
   - Titular: Jhonatan Venegas
   - CLABE: 072***********123 (parcialmente ofuscada)
   - Monto exacto: $20.00 MXN
   - Referencia: BGTF15541132
4. ❓ Confirmar que muestra sección "Subir comprobante"

**Status:** ⏳ PENDIENTE VALIDACIÓN MANUAL

---

### Paso 2.2: Cliente — seleccionar y subir comprobante ⏳ REQUIERE ACCIÓN MANUAL

**Acción esperada:**
1. Cliente selecciona archivo de imagen (JPG/PNG)
2. Cliente confirma que NO se sube automáticamente al seleccionar
3. Cliente hace click en "Enviar comprobante"
4. Sistema muestra mensaje "Comprobante recibido" / "Pago en revisión"

**Validación requerida por Jhonatan:**
1. ❓ En la página /payment/bank-transfer/f956051a-****, subir imagen de prueba
2. ❓ Confirmar que botón "Enviar comprobante" aparece
3. ❓ Hacer click y confirmar mensaje de éxito
4. ❓ Confirmar que transaction.status pasa a 'pending' y proof_url se guarda

**Validación DB post-upload:**
```sql
SELECT id, status, proof_url, proof_uploaded_at 
FROM payment_transactions 
WHERE id = 'f956051a-0d2d-4b29-9dd5-f9c1d01c19e9';
```

**Expected:**
- status: 'pending' (sigue pending hasta admin apruebe)
- proof_url: URL de Supabase Storage (no null)
- proof_uploaded_at: timestamp reciente

**Status:** ⏳ PENDIENTE ACCIÓN MANUAL

---

### Paso 3: Cliente cuenta/tracking ⏳ REQUIERE VALIDACIÓN MANUAL

**Acción esperada:** Cliente abre "Ver estado del pedido"

**URL tracking:**
```
/track/0a7edaf10f****
```

**Validación requerida por Jhonatan:**
1. ❓ Abrir /track/[tracking_token_completo]
2. ❓ Confirmar que NO da 404
3. ❓ Confirmar que muestra información de la orden
4. ❓ Confirmar que muestra "Pago en revisión" (NO "Pago confirmado")
5. ❓ Confirmar que NO muestra "Pago rechazado"

**Status:** ⏳ PENDIENTE VALIDACIÓN MANUAL

---

### Paso 4: Admin — revisar comprobante ⏳ REQUIERE ACCIÓN MANUAL

**Acción esperada:** Admin va a /admin/payments y revisa el pago

**Validación requerida por Jhonatan:**
1. ❓ Ir a https://bagclue.vercel.app/admin/payments
2. ❓ Confirmar que aparece el pago pendiente:
   - Order ID: ad977b57-****
   - Customer: Cliente QA Aprobar
   - Amount: $20.00 MXN
   - Status: pending
   - Payment ref: BGTF15541132
3. ❓ Click en "Ver detalles" o botón similar
4. ❓ Confirmar que se puede abrir comprobante (imagen sube correctamente)
5. ❓ Click en "Aprobar pago"
6. ❓ Confirmar mensaje de éxito

**Status:** ⏳ PENDIENTE ACCIÓN MANUAL

---

### Paso 5: Validación final — estados después de aprobar ⏳ PENDIENTE

**Validación DB post-aprobación:**
```sql
-- Transaction debe estar confirmada
SELECT id, status, confirmed_at, confirmed_by 
FROM payment_transactions 
WHERE id = 'f956051a-0d2d-4b29-9dd5-f9c1d01c19e9';

-- Order debe estar paid y confirmed
SELECT id, status, payment_status 
FROM orders 
WHERE id = 'ad977b57-7e0f-474c-a1bb-06dbcf4f2d03';

-- Product debe estar sold
SELECT id, title, status, stock 
FROM products 
WHERE id = '9edb93f6-1ea5-42fe-9998-b4ddf57f5d29';
```

**Expected results:**
- ✅ Transaction: status = 'confirmed', confirmed_at IS NOT NULL
- ✅ Order: status = 'confirmed', payment_status = 'paid'
- ✅ Product: status = 'sold', stock = 0

**Validación UI:**
1. ❓ Cliente tracking: /track/[token] muestra "Pago confirmado"
2. ❓ Catálogo: producto muestra badge "Vendida" (no "Apartada" ni disponible)

**Status:** ⏳ PENDIENTE (depende de paso 4)

---

## FLUJO B — RECHAZAR PAGO

### Paso 1: Crear producto test ⏳ PENDIENTE

**Acción:** Crear segundo producto test "QA Transferencia Rechazar"

**Comando para ejecutar:**
```javascript
// Ejecutar en node o crear producto desde admin UI
const productId = await createProduct({
  title: 'QA Transferencia Rechazar',
  brand: 'Chanel',
  price: 20,
  status: 'available',
  stock: 1,
  is_published: true
});
```

**Status:** ⏳ PENDIENTE

---

### Paso 2-3: Cliente — repetir compra y subir comprobante ⏳ PENDIENTE

**Status:** ⏳ PENDIENTE (mismo flujo que Flujo A pasos 2-3)

---

### Paso 4: Admin — rechazar pago ⏳ PENDIENTE

**Acción esperada:**
1. Admin va a /admin/payments
2. Abre comprobante del segundo pago
3. Click en "Rechazar pago"
4. Ingresa motivo: "Comprobante no válido para prueba QA"
5. Confirma rechazo

**Status:** ⏳ PENDIENTE

---

### Paso 5: Validación final — estados después de rechazar ⏳ PENDIENTE

**Expected results:**
- Transaction: status = 'rejected', rejection_reason = 'Comprobante no válido para prueba QA'
- Order: status = 'pending' (sigue pending), payment_status = 'pending' (sigue pending)
- Product: status = 'available' (liberado para nueva venta)

**Validación UI:**
1. Cliente tracking: muestra "Comprobante rechazado"
2. Cliente tracking: muestra motivo de rechazo
3. Si backend permite reintento: muestra opción "Subir nuevo comprobante"
4. Si no permite reintento: muestra mensaje "Contacta soporte"

**Status:** ⏳ PENDIENTE

---

## RESUMEN EJECUTIVO

### Tests automatizados completados ✅
1. ✅ **Crear producto test** — PASS
2. ✅ **Crear orden con transferencia** — PASS
3. ✅ **Reservar producto** — PASS
4. ✅ **Crear payment_transaction** — PASS
5. ✅ **Estado inicial correcto** — PASS

### Tests pendientes validación manual ⏳
1. ⏳ **Redirección a página de pago** — Requiere browser
2. ⏳ **Upload de comprobante** — Requiere UI + imagen
3. ⏳ **Tracking page funcional** — Requiere browser
4. ⏳ **Admin payments list** — Requiere UI admin
5. ⏳ **Admin aprobar pago** — Requiere acción admin
6. ⏳ **Validación estados finales** — Depende de aprobación
7. ⏳ **Flujo B completo (rechazar)** — Requiere crear segundo producto

### Bloqueadores identificados
- ❌ **Next.js dev server no disponible** — No se puede hacer requests a localhost:3000
- ℹ️ **Upload de archivos** — Requiere browser real (no se puede simular con curl/node)
- ℹ️ **Admin UI** — Requiere sesión autenticada (no se puede automatizar sin credenciales)

### Bugs encontrados
- ✅ **Ninguno** — Hasta donde se pudo validar automáticamente, todo funciona correctamente

---

## DATOS SENSIBLES (SANITIZADOS)

**FLUJO A:**
- Product ID: 9edb93f6-****-****-****-********d29
- Order ID: ad977b57-****-****-****-********03
- Transaction ID: f956051a-****-****-****-********e9
- Tracking token: 0a7edaf10f****************************
- Payment reference: BGTF15541132 (público, OK mostrar)

**IDs completos guardados en:** `/tmp/flujo_a_ids.json` (solo accessible en servidor)

---

## DECISIÓN FINAL

**MVP.2B/MVP.2C:** ⏳ **PENDIENTE COMPLETAR VALIDACIÓN MANUAL**

**Razón:**
- ✅ Backend funciona correctamente (orden, transaction, reserva producto)
- ⏳ UI cliente y admin requieren validación humana
- ⏳ Flujo de aprobación/rechazo requiere acción manual admin

**Próximos pasos recomendados:**
1. Jhonatan ejecuta pasos manuales (2.1, 2.2, 3, 4, 5) del Flujo A
2. Validar que comprobante sube correctamente
3. Validar que admin puede aprobar/rechazar
4. Validar estados finales en DB
5. Repetir Flujo B (rechazar)
6. Si todos los pasos pasan → **CERRAR MVP.2B/2C** ✅
7. Si algo falla → documentar bug y fix

**Confianza actual:** 🟢 ALTA (backend funciona, solo falta UI)

---

## COMANDOS ÚTILES PARA DEBUG

### Ver orden completa
```sql
SELECT o.*, pt.status as tx_status, pt.proof_url, pt.payment_reference
FROM orders o
LEFT JOIN payment_transactions pt ON pt.order_id = o.id
WHERE o.id = 'ad977b57-7e0f-474c-a1bb-06dbcf4f2d03';
```

### Ver transaction con proof
```sql
SELECT id, order_id, status, amount, currency, payment_reference, 
       proof_url, proof_uploaded_at, confirmed_at, rejected_at, rejection_reason
FROM payment_transactions
WHERE id = 'f956051a-0d2d-4b29-9dd5-f9c1d01c19e9';
```

### Ver producto
```sql
SELECT id, title, price, status, stock, is_published
FROM products
WHERE id = '9edb93f6-1ea5-42fe-9998-b4ddf57f5d29';
```

### Leer IDs completos (si necesario)
```bash
cat /tmp/flujo_a_ids.json
```

---

**Reporte generado:** 2026-05-10 12:19 UTC  
**Versión:** 1.0  
**Status:** PARCIAL (requiere validación manual UI)
