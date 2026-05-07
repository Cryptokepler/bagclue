# PAYMENTS MVP.2A — Plan de QA Técnica

**Fecha:** 2026-05-07  
**Objetivo:** Validar flujo completo de transferencia bancaria antes de activar en producción  
**Estado:** Pendiente de ejecución  

---

## ⚠️ PREREQUISITOS

### Antes de Empezar:
- ✅ PAYMENTS MVP.2A backend deployado (commit a11df9f)
- ✅ Variables bancarias Banorte configuradas en `.env.production`
- ✅ Fix endpoint `/api/payments/bank-transfer/order` aplicado
- ✅ Estar logueado como admin en producción
- ✅ Tener acceso a base de datos (Supabase dashboard)
- ✅ NO activar Stripe Live
- ✅ NO usar inventario real

### Herramientas Necesarias:
- Navegador con DevTools abierto (Network + Console)
- Cliente HTTP (Postman / Insomnia / curl) o usar fetch desde consola
- Imagen JPG/PNG válida para comprobante (<5MB)
- Imagen inválida para test negativo (opcional)
- Acceso a Supabase dashboard para verificar datos

---

## 📋 PRODUCTO TEST — CREAR O REUTILIZAR

### Opción A: Crear Nuevo Producto Test
1. Ir a `/admin/productos/new`
2. Completar:
   ```
   Título: QA Bank Transfer Test
   Marca: Chanel
   Modelo: Test Model
   Color: Test
   Precio: 20 MXN
   Stock: 1
   Status: available
   Categoría: Bolsas
   Condición: new
   Visible en tienda: ACTIVO
   ```
3. Guardar y anotar `product_id`
4. **Importante:** Este producto será usado para testing, no es real

### Opción B: Reutilizar Producto Test Existente
1. Ir a `/admin/productos`
2. Buscar producto test anterior (ej: slug con "test" o "qa")
3. Verificar que esté disponible y publicado
4. Anotar `product_id`

### Producto Test Debe Cumplir:
- `status = 'available'`
- `is_published = true`
- `price` razonable (ej: 20 MXN)
- `stock >= 1`
- NO ser inventario real

---

## 🧪 TEST 1: CREAR BANK TRANSFER ORDER

### Endpoint:
```
POST /api/payments/bank-transfer/order
```

### Request Body:
```json
{
  "items": [
    {
      "product_id": "<PRODUCT_TEST_ID>",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "name": "QA Test User",
    "phone": "5512345678",
    "street": "Calle Test 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "postal_code": "01234",
    "country": "México"
  },
  "customer": {
    "email": "qa-test@bagclue.com",
    "name": "QA Test User"
  }
}
```

### Ejecutar (desde DevTools Console):
```javascript
fetch('/api/payments/bank-transfer/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ product_id: '<PRODUCT_TEST_ID>', quantity: 1 }],
    shipping_address: {
      name: 'QA Test User',
      phone: '5512345678',
      street: 'Calle Test 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      postal_code: '01234',
      country: 'México'
    },
    customer: {
      email: 'qa-test@bagclue.com',
      name: 'QA Test User'
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data)
  // Anotar order_id, transaction_id, payment_reference
})
```

### Verificaciones:

#### 1.1. Response Exitoso
- [ ] Status HTTP: 200 OK
- [ ] Response incluye:
  ```json
  {
    "success": true,
    "order_id": "...",
    "tracking_token": "...",
    "transaction_id": "...",
    "payment_reference": "...",
    "amount_mxn": 20.00,
    "expires_at": "...", // +24h desde ahora
    "bank_config": {
      "bank_name": "Banorte",
      "account_name": "...",
      "clabe_masked": "****0145", // NO debe mostrar CLABE completa
      "account_number_masked": "...",
      "reference": "..."
    }
  }
  ```
- [ ] `payment_reference` único generado
- [ ] `expires_at` es aproximadamente 24 horas desde ahora

#### 1.2. Order Creada Correctamente
Ir a Supabase → tabla `orders` → buscar por `id = order_id`:
- [ ] `payment_method = 'bank_transfer'`
- [ ] `payment_status = 'pending'`
- [ ] `status = 'pending'`
- [ ] `shipping_status = 'pending'`
- [ ] `subtotal`, `shipping`, `total` correctos
- [ ] `tracking_token` generado

#### 1.3. Order Items Creado
Ir a Supabase → tabla `order_items` → buscar por `order_id`:
- [ ] Registro existe
- [ ] `product_id` correcto
- [ ] `quantity = 1`
- [ ] `price_at_purchase = 20`
- [ ] `currency = 'MXN'`
- [ ] `product_snapshot` contiene: `title`, `brand`, `model`, `color`, `slug`, `price`

#### 1.4. Payment Transaction Creada
Ir a Supabase → tabla `payment_transactions` → buscar por `id = transaction_id`:
- [ ] `order_id` correcto
- [ ] `method = 'bank_transfer'`
- [ ] `status = 'pending'`
- [ ] `amount_mxn = 20.00`
- [ ] `payment_reference` correcto y único
- [ ] `expires_at` correcto (+24h)
- [ ] `bank_details` incluye: `bank_name`, `clabe_masked`, `account_number_masked`
- [ ] `proof_url = null` (aún no subido)

#### 1.5. Producto Cambió a Reserved
Ir a Supabase → tabla `products` → buscar por `id = product_id`:
- [ ] `status = 'reserved'` (antes era 'available')
- [ ] `stock` sin cambios (aún 1, porque no está paid)

#### 1.6. Seguridad — NO Secretos en Logs
Revisar DevTools Console y Network:
- [ ] NO aparece CLABE completa (solo ****0145)
- [ ] NO aparece `BANORTE_CLABE` raw
- [ ] NO aparece `BANORTE_ACCOUNT_NUMBER` completo
- [ ] Solo aparece `clabe_masked` y `account_number_masked`

**Anotar:**
```
product_id: _______________
order_id: _______________
transaction_id: _______________
payment_reference: _______________
tracking_token: _______________
```

---

## 🧪 TEST 2: CONFIG BANCARIA

### Endpoint:
```
GET /api/payments/bank-transfer/config?order_id=<ORDER_ID>
```

o

```
GET /api/payments/bank-transfer/config?transaction_id=<TRANSACTION_ID>
```

### Ejecutar:
```javascript
fetch('/api/payments/bank-transfer/config?order_id=<ORDER_ID>')
  .then(r => r.json())
  .then(data => console.log('Config:', data))
```

### Verificaciones:

#### 2.1. Response Exitoso
- [ ] Status HTTP: 200 OK
- [ ] Response incluye:
  ```json
  {
    "bank_name": "Banorte",
    "account_name": "...",
    "clabe_masked": "****0145",
    "account_number_masked": "...",
    "reference": "...",
    "amount_mxn": 20.00,
    "expires_at": "..."
  }
  ```

#### 2.2. Solo Dueño de la Orden
- [ ] Si `order_id` o `transaction_id` no pertenece al usuario → Error 403 o 404
- [ ] (Test manual: intentar acceder a order_id de otra persona si es posible)

#### 2.3. Seguridad — NO CLABE Completa
- [ ] `clabe_masked` termina en `****0145`
- [ ] NO aparece CLABE completa en respuesta
- [ ] NO aparece en logs del servidor (verificar si tienes acceso)

---

## 🧪 TEST 3: UPLOAD COMPROBANTE

### Endpoint:
```
POST /api/payments/bank-transfer/upload-proof
```

### Request (FormData):
```
transaction_id: <TRANSACTION_ID>
file: <archivo JPG/PNG>
```

### Ejecutar (desde DevTools Console):
```javascript
// 1. Seleccionar archivo manualmente o crear FormData programáticamente
const formData = new FormData()
formData.append('transaction_id', '<TRANSACTION_ID>')
// Necesitarás un input file real o usar un script para cargar archivo

// 2. Enviar request
fetch('/api/payments/bank-transfer/upload-proof', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(data => console.log('Upload result:', data))
```

**Alternativa:** Crear UI temporal o usar Postman para subir archivo.

### Verificaciones:

#### 3.1. Upload Exitoso (Archivo Válido)
- [ ] Status HTTP: 200 OK
- [ ] Response: `{ success: true, message: "Comprobante subido...", proof_url: "..." }`
- [ ] `proof_url` es URL válida de Supabase Storage

#### 3.2. Transacción Actualizada
Ir a Supabase → tabla `payment_transactions` → buscar por `id = transaction_id`:
- [ ] `status = 'proof_uploaded'` (cambió de 'pending')
- [ ] `proof_url` apunta a archivo subido
- [ ] `proof_uploaded_at` tiene timestamp
- [ ] `proof_file_name`, `proof_file_size`, `proof_file_type` correctos
- [ ] `proof_hash` generado

#### 3.3. Order NO Marcada Como Paid Todavía
Ir a Supabase → tabla `orders` → buscar por `id = order_id`:
- [ ] `payment_status` sigue siendo `'pending'` (NO 'paid')
- [ ] `status` sigue siendo `'pending'`

#### 3.4. Test Negativo — Archivo Inválido
Subir archivo que NO sea imagen (ej: .txt, .pdf):
- [ ] Status HTTP: 400 Bad Request
- [ ] Error: "El archivo debe ser una imagen (JPG o PNG)"

#### 3.5. Test Negativo — Archivo > 5MB (Opcional)
Si es fácil conseguir archivo >5MB:
- [ ] Status HTTP: 400 Bad Request
- [ ] Error: "El archivo debe ser menor a 5MB"

---

## 🧪 TEST 4: ADMIN VERIFY — APPROVE

### Endpoint:
```
POST /api/payments/admin/verify
```

### Request Body:
```json
{
  "transaction_id": "<TRANSACTION_ID>",
  "action": "approve",
  "verification_notes": "QA Test - Comprobante válido"
}
```

### Ejecutar (desde DevTools Console como admin):
```javascript
fetch('/api/payments/admin/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_id: '<TRANSACTION_ID>',
    action: 'approve',
    verification_notes: 'QA Test - Comprobante válido'
  })
})
.then(r => r.json())
.then(data => console.log('Verify result:', data))
```

### Verificaciones:

#### 4.1. Response Exitoso
- [ ] Status HTTP: 200 OK
- [ ] Response: `{ success: true, message: "Pago aprobado...", ... }`

#### 4.2. Payment Transaction Confirmada
Ir a Supabase → tabla `payment_transactions` → buscar por `id = transaction_id`:
- [ ] `status = 'confirmed'` (cambió de 'proof_uploaded')
- [ ] `verified_by` tiene email/ID del admin
- [ ] `verified_at` tiene timestamp
- [ ] `verification_notes = 'QA Test - Comprobante válido'`

#### 4.3. Order Marcada Como Paid
Ir a Supabase → tabla `orders` → buscar por `id = order_id`:
- [ ] `payment_status = 'paid'` (cambió de 'pending')
- [ ] `status = 'confirmed'` (cambió de 'pending')
- [ ] `shipping_status = 'pending'` (sin cambios, correcto)

#### 4.4. Producto Marcado Como Sold
Ir a Supabase → tabla `products` → buscar por `id = product_id`:
- [ ] `status = 'sold'` (cambió de 'reserved')
- [ ] `stock` sin cambios (aún 1, o decrementado si lógica de stock aplica)

---

## 🧪 TEST 5: ADMIN VERIFY — REJECT

### Prerequisito:
Crear **segundo producto test** y **segunda orden** siguiendo pasos de TEST 1.

### Endpoint:
```
POST /api/payments/admin/verify
```

### Request Body:
```json
{
  "transaction_id": "<TRANSACTION_ID_2>",
  "action": "reject",
  "rejection_reason": "QA Test - Comprobante inválido o pago no encontrado"
}
```

### Ejecutar:
```javascript
fetch('/api/payments/admin/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_id: '<TRANSACTION_ID_2>',
    action: 'reject',
    rejection_reason: 'QA Test - Comprobante inválido o pago no encontrado'
  })
})
.then(r => r.json())
.then(data => console.log('Reject result:', data))
```

### Verificaciones:

#### 5.1. Response Exitoso
- [ ] Status HTTP: 200 OK
- [ ] Response: `{ success: true, message: "Pago rechazado...", ... }`

#### 5.2. Payment Transaction Rechazada
Ir a Supabase → tabla `payment_transactions` → buscar por `id = transaction_id_2`:
- [ ] `status = 'rejected'` (cambió de 'pending' o 'proof_uploaded')
- [ ] `rejection_reason = 'QA Test - Comprobante inválido o pago no encontrado'`
- [ ] `verified_by` tiene email/ID del admin
- [ ] `verified_at` tiene timestamp

#### 5.3. Order Sigue Pending
Ir a Supabase → tabla `orders` → buscar por `id = order_id_2`:
- [ ] `payment_status = 'pending'` (sin cambios)
- [ ] `status = 'pending'` (sin cambios)

#### 5.4. Producto Vuelve a Available
Ir a Supabase → tabla `products` → buscar por `id = product_id_2`:
- [ ] `status = 'available'` (cambió de 'reserved' de vuelta)

---

## 🧪 TEST 6: REGRESIÓN STRIPE

### Objetivo:
Confirmar que Stripe checkout sigue funcionando en **test mode**.

### Pasos:
1. Ir a `/catalogo`
2. Seleccionar cualquier producto publicado
3. Agregar al carrito
4. Ir a `/cart`
5. Checkout con Stripe (test mode)
6. Usar tarjeta test: `4242 4242 4242 4242`, exp: `12/34`, CVV: `123`
7. Confirmar pago

### Verificaciones:
- [ ] Checkout Stripe se abre correctamente
- [ ] Pago test se procesa sin errores
- [ ] Redirect a `/checkout/success` exitoso
- [ ] Order creada con `payment_method = 'stripe'`
- [ ] Order tiene `payment_status = 'paid'` (por webhook test)
- [ ] Producto cambia a `status = 'sold'`

**Si Stripe NO funciona:**
- Detener QA inmediatamente
- Reportar error exacto
- NO activar bank transfer en producción

---

## 🧪 TEST 7: CATÁLOGO — PRODUCTOS RESERVED/SOLD

### Objetivo:
Confirmar que productos con `status = 'reserved'` o `'sold'` se comportan correctamente en catálogo público.

### Verificaciones:

#### 7.1. Producto Reserved
- [ ] Producto con `status = 'reserved'` y `is_published = true`:
  - ¿Aparece en `/catalogo`?
  - ¿Aparece badge "Reservado"?
  - ¿Botón "Agregar al carrito" deshabilitado o ausente?

#### 7.2. Producto Sold
- [ ] Producto con `status = 'sold'` y `is_published = true`:
  - ¿Aparece en `/catalogo`? (puede estar oculto según lógica actual)
  - Si aparece, ¿muestra badge "Vendido"?
  - ¿Botón "Agregar al carrito" deshabilitado o ausente?

**Comportamiento esperado:** Según la lógica actual del catálogo (verificar código si es necesario).

---

## 🧪 TEST 8: SEGURIDAD — NO SECRETOS EN LOGS

### Verificaciones Finales:

#### 8.1. DevTools Console
Revisar toda la consola del navegador durante QA:
- [ ] NO aparece `BANORTE_CLABE` completo
- [ ] NO aparece `BANORTE_ACCOUNT_NUMBER` completo
- [ ] NO aparece `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Solo aparece `clabe_masked: "****0145"`

#### 8.2. Network Tab
Revisar respuestas de API:
- [ ] NO aparece CLABE completa en ninguna respuesta JSON
- [ ] Solo aparece `clabe_masked`

#### 8.3. Logs del Servidor (Si Tienes Acceso)
- [ ] NO hay `console.log` con CLABE completa
- [ ] NO hay `console.log` con tokens sensibles
- [ ] Logs solo muestran referencias parciales (`****0145`)

---

## 🧹 CLEANUP — DESPUÉS DE QA

### Productos Test:
- [ ] Ir a `/admin/productos`
- [ ] Buscar productos test creados para QA
- [ ] Cambiar a **INACTIVO** (toggle off)
- [ ] O eliminar si es posible (verificar que no haya órdenes reales)

### Órdenes Test:
- [ ] Órdenes test quedan en base de datos (no eliminar)
- [ ] Verificar que no interfieren con reporting real
- [ ] Si es necesario, marcar como "test" en `internal_notes` (si existe campo)

---

## 📊 FORMATO DE REPORTE

Crear archivo `PAYMENTS_MVP2A_QA_REPORT.md` con:

```markdown
# PAYMENTS MVP.2A — QA Report

**Fecha:** YYYY-MM-DD  
**Ejecutado por:** [Nombre]  
**Duración:** [X minutos]  

---

## DATOS TEST

- **Product ID:** [UUID]
- **Order ID:** [UUID]
- **Transaction ID:** [UUID]
- **Payment Reference:** [Parcial: ****últimos-4-dígitos]
- **Tracking Token:** [Token]
- **Product ID 2 (reject test):** [UUID]
- **Order ID 2:** [UUID]
- **Transaction ID 2:** [UUID]

---

## RESULTADOS

### TEST 1: Crear Bank Transfer Order
- Status: ✅ PASS / ❌ FAIL
- Response exitoso: ✅ / ❌
- Order creada: ✅ / ❌
- Order items: ✅ / ❌
- Payment transaction: ✅ / ❌
- Producto → reserved: ✅ / ❌
- Sin secretos en logs: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 2: Config Bancaria
- Status: ✅ PASS / ❌ FAIL
- Response exitoso: ✅ / ❌
- Solo dueño: ✅ / ❌
- CLABE masked: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 3: Upload Comprobante
- Status: ✅ PASS / ❌ FAIL
- Upload exitoso: ✅ / ❌
- Transacción → proof_uploaded: ✅ / ❌
- Order NO paid todavía: ✅ / ❌
- Test negativo (inválido): ✅ / ❌
- **Errores:** [Si hubo]

### TEST 4: Admin Approve
- Status: ✅ PASS / ❌ FAIL
- Response exitoso: ✅ / ❌
- Transaction → confirmed: ✅ / ❌
- Order → paid: ✅ / ❌
- Producto → sold: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 5: Admin Reject
- Status: ✅ PASS / ❌ FAIL
- Response exitoso: ✅ / ❌
- Transaction → rejected: ✅ / ❌
- Rejection reason: ✅ / ❌
- Order sigue pending: ✅ / ❌
- Producto → available: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 6: Regresión Stripe
- Status: ✅ PASS / ❌ FAIL
- Checkout abre: ✅ / ❌
- Pago test exitoso: ✅ / ❌
- Order creada: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 7: Catálogo
- Status: ✅ PASS / ❌ FAIL
- Producto reserved comportamiento: ✅ / ❌
- Producto sold comportamiento: ✅ / ❌
- **Errores:** [Si hubo]

### TEST 8: Seguridad
- Status: ✅ PASS / ❌ FAIL
- No CLABE completa en console: ✅ / ❌
- No CLABE completa en Network: ✅ / ❌
- Solo clabe_masked visible: ✅ / ❌
- **Errores:** [Si hubo]

---

## CLEANUP

- Productos test despublicados: ✅ / ❌
- IDs anotados: ✅ / ❌
- Sin secretos impresos: ✅ / ❌

---

## RESULTADO FINAL

- **QA Status:** ✅ PASS / ❌ FAIL
- **Bloqueadores:** [Lista si hubo]
- **Recomendación:** APROBAR PARA PRODUCCIÓN / DETENER Y CORREGIR

---

## ERRORES EXACTOS (Si Aplica)

[Copiar errores completos aquí]

---

## NOTAS ADICIONALES

[Cualquier observación relevante]
```

---

## ⚠️ SI CUALQUIER TEST FALLA

1. **Detener QA inmediatamente**
2. **NO hacer fix sin aprobación**
3. **Documentar error exacto** (copiar stack trace completo)
4. **Anotar:**
   - Test que falló
   - Request enviado
   - Response recibido
   - Estado esperado vs estado real
   - Logs de error
5. **Reportar a Jhonatan** antes de continuar

---

## ✅ CRITERIOS DE APROBACIÓN

QA PASA si **TODOS** estos tests son ✅ PASS:
- [x] TEST 1: Crear order exitoso, producto → reserved
- [x] TEST 2: Config bancaria sin secretos
- [x] TEST 3: Upload comprobante exitoso
- [x] TEST 4: Admin approve funciona, producto → sold
- [x] TEST 5: Admin reject funciona, producto → available
- [x] TEST 6: Stripe checkout sigue funcionando
- [x] TEST 7: Catálogo no se rompe
- [x] TEST 8: Sin secretos en logs

Si **ALGUNO** falla → QA FAIL → Detener y reportar.

---

**Última actualización:** 2026-05-07  
**Próximos pasos:** Ejecutar QA → Generar reporte → Aprobar o corregir
