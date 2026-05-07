# TEST 1 — Crear Bank Transfer Order (Instrucciones)

**Fecha:** 2026-05-07  
**Objetivo:** Validar creación de orden con transferencia bancaria  
**Duración estimada:** 10-15 minutos  

---

## 📋 PASO 1: CREAR O VERIFICAR PRODUCTO TEST

### Opción A: Crear Nuevo Producto Test

1. Ir a: https://bagclue.vercel.app/admin/productos/new
2. Completar formulario:
   ```
   Título: QA Bank Transfer Test
   Marca: Chanel
   Modelo: Bank Transfer
   Color: Test
   Origen: Test
   Material: Test
   Categoría: Bolsas
   Condición: new
   Precio: 20 MXN
   Stock: 1
   Status: available (en dropdown de status)
   Visible en tienda: ACTIVO (toggle verde)
   ```
3. **NO subir imágenes** (opcional, no necesario para QA)
4. Guardar producto
5. Anotar el **product_id** (UUID que aparece en la URL):
   ```
   URL: /admin/productos/[UUID]
   Anotar: UUID completo
   ```

### Opción B: Reutilizar Producto Test Existente

1. Ir a: https://bagclue.vercel.app/admin/productos
2. Buscar: "QA Bank Transfer" o "Test"
3. Verificar que:
   - Status: available
   - Visible en tienda: ACTIVO
   - Precio: 20 MXN
4. Si cumple → Anotar **product_id** (UUID de la URL)
5. Si NO cumple → Usar Opción A

---

## 📋 PASO 2: PREPARAR SCRIPT DE TEST

1. Abrir archivo: `TEST1_BANK_TRANSFER_ORDER.js` (en este mismo directorio)
2. Copiar TODO el contenido del archivo
3. Buscar esta línea:
   ```javascript
   const PRODUCT_TEST_ID = 'REEMPLAZAR-CON-UUID-REAL'
   ```
4. Reemplazar con el UUID real del producto test:
   ```javascript
   const PRODUCT_TEST_ID = 'e162405d-0d82-4b89-9498-86a7b763a643' // Ejemplo
   ```
5. Guardar cambio (opcional, solo si quieres guardarlo localmente)

---

## 📋 PASO 3: EJECUTAR TEST 1

1. Abrir: https://bagclue.vercel.app (página principal)
2. Abrir DevTools (F12 o Cmd+Opt+I en Mac)
3. Ir a pestaña **Console**
4. Pegar TODO el script modificado (con el UUID correcto)
5. Presionar **Enter**
6. Esperar respuesta (1-3 segundos)

---

## 📋 PASO 4: REVISAR OUTPUT EN CONSOLE

El script mostrará:

### 4.1. Response Recibido
```
📊 Status: 200 OK

📋 Datos Sanitizados:
{
  "success": true,
  "order_id": "UUID...",
  "tracking_token": "TOKEN...",
  "transaction_id": "UUID...",
  "payment_reference": "****1234", // Últimos 4 dígitos
  "amount_mxn": 20,
  "expires_at": "2026-05-08T...",
  "bank_config": {
    "bank_name": "Banorte",
    "account_name": "...",
    "clabe_masked": "****0145", // ⚠️ DEBE estar masked
    "account_number_masked": "...",
    "reference": "****1234"
  }
}
```

### 4.2. Validaciones Automáticas
```
🔍 VALIDACIONES AUTOMÁTICAS

✅ 1. Response exitoso: true
✅ 2. order_id existe: true
✅ 3. transaction_id existe: true
✅ 4. payment_reference existe: true
✅ 5. amount_mxn = 20: true
✅ 6. expires_at existe: true
✅ 7. bank_config existe: true
✅ 8. clabe_masked correcto: true
✅ 9. NO CLABE completa visible: true
```

**⚠️ SI ALGUNA ES ❌ → DETENER INMEDIATAMENTE Y REPORTAR**

### 4.3. IDs Guardados
```
💾 IDs guardados en window.TEST1_DATA para siguiente test
{
  product_id: "...",
  order_id: "...",
  transaction_id: "...",
  payment_reference_partial: "****1234",
  tracking_token: "..."
}
```

---

## 📋 PASO 5: VERIFICAR EN SUPABASE

### 5.1. Tabla `orders`
1. Ir a: https://supabase.com/dashboard/project/[tu-proyecto]/editor
2. Abrir tabla `orders`
3. Buscar por `id` = [order_id del script]
4. Verificar:
   - [ ] `payment_method = 'bank_transfer'`
   - [ ] `payment_status = 'pending'`
   - [ ] `status = 'pending'`
   - [ ] `shipping_status = 'pending'`
   - [ ] `subtotal` correcto (20)
   - [ ] `shipping` correcto
   - [ ] `total` correcto (20 + shipping)
   - [ ] `tracking_token` existe

**Screenshot:** Tomar captura de la fila completa

### 5.2. Tabla `order_items`
1. Abrir tabla `order_items`
2. Buscar por `order_id` = [order_id del script]
3. Verificar:
   - [ ] `product_id` = [UUID del producto test]
   - [ ] `quantity = 1`
   - [ ] `price_at_purchase = 20`
   - [ ] `currency = 'MXN'`
   - [ ] `product_snapshot` es un objeto JSON con:
     - `title`: "QA Bank Transfer Test"
     - `brand`: "Chanel"
     - `model`: "Bank Transfer"
     - `color`: "Test"
     - `slug`: "..."
     - `price`: 20

**Screenshot:** Tomar captura de la fila + expandir product_snapshot

### 5.3. Tabla `payment_transactions`
1. Abrir tabla `payment_transactions`
2. Buscar por `id` = [transaction_id del script]
3. Verificar:
   - [ ] `order_id` = [order_id del script]
   - [ ] `method = 'bank_transfer'`
   - [ ] `status = 'pending'`
   - [ ] `amount_mxn = 20.00`
   - [ ] `currency = 'MXN'`
   - [ ] `payment_reference` existe (UUID único)
   - [ ] `expires_at` es aproximadamente +24h desde ahora
   - [ ] `bank_details` es un objeto JSON con:
     - `bank_name`: "Banorte"
     - `clabe_masked`: "****0145" (⚠️ NO debe tener CLABE completa)
     - `account_number_masked`: "..."
   - [ ] `proof_url = null` (aún no subido)
   - [ ] `proof_uploaded_at = null`

**Screenshot:** Tomar captura de la fila + expandir bank_details

### 5.4. Tabla `products`
1. Abrir tabla `products`
2. Buscar por `id` = [UUID del producto test]
3. Verificar:
   - [ ] `status` cambió de `'available'` → `'reserved'`
   - [ ] `stock` sin cambios (aún 1)
   - [ ] `is_published` sigue `true`

**Screenshot:** Tomar captura mostrando status = reserved

---

## 📋 PASO 6: VALIDAR SEGURIDAD — NO SECRETOS EN LOGS

### 6.1. Revisar Console del Navegador
- [ ] NO aparece CLABE completa (18 dígitos consecutivos)
- [ ] Solo aparece `****0145` o similar
- [ ] NO aparece `BANORTE_CLABE` raw
- [ ] NO aparece `SUPABASE_SERVICE_ROLE_KEY`

### 6.2. Revisar Network Tab
1. Ir a pestaña **Network** en DevTools
2. Buscar request: `bank-transfer/order`
3. Ver Response:
   - [ ] NO aparece CLABE completa
   - [ ] Solo aparece `clabe_masked: "****0145"`

### 6.3. Revisar Logs del Servidor (Si Tienes Acceso)
- [ ] NO hay console.log con CLABE completa
- [ ] Solo logs con valores masked

---

## 📋 PASO 7: ANOTAR DATOS PARA REPORTE

Copiar estos valores en un documento seguro (NO commitear):

```
TEST 1 — DATOS SANITIZADOS

Product ID: [UUID]
Order ID: [UUID]
Transaction ID: [UUID]
Payment Reference (parcial): ****[últimos-4-dígitos]
Tracking Token: [TOKEN]

VALIDACIONES AUTOMÁTICAS: ✅ PASS / ❌ FAIL
VALIDACIÓN SUPABASE orders: ✅ PASS / ❌ FAIL
VALIDACIÓN SUPABASE order_items: ✅ PASS / ❌ FAIL
VALIDACIÓN SUPABASE payment_transactions: ✅ PASS / ❌ FAIL
VALIDACIÓN SUPABASE products (reserved): ✅ PASS / ❌ FAIL
SEGURIDAD (sin secretos): ✅ PASS / ❌ FAIL

TEST 1 STATUS: ✅ PASS / ❌ FAIL
```

---

## 📋 PASO 8: COMPLETAR REPORTE

1. Abrir: `PAYMENTS_MVP2A_QA_REPORT.md`
2. Ir a sección **TEST 1: Crear Bank Transfer Order**
3. Completar todos los checkboxes según validaciones
4. Si hubo errores, copiar mensaje exacto en sección "ERRORES EXACTOS"
5. **NO commitear datos sensibles** (payment_reference completo, CLABE, etc.)

---

## ✅ CRITERIOS DE ÉXITO TEST 1

TEST 1 PASA si **TODOS** son ✅:
- [x] Response HTTP 200
- [x] order_id, transaction_id, payment_reference existen
- [x] amount_mxn = 20
- [x] expires_at ~+24h
- [x] Order creada correctamente en DB (payment_status pending)
- [x] Order items creado con product_snapshot correcto
- [x] Payment transaction creada (status pending)
- [x] Producto cambió available → reserved
- [x] NO CLABE completa visible en logs/console/network
- [x] NO secretos impresos

---

## ❌ SI TEST 1 FALLA

1. **DETENER INMEDIATAMENTE**
2. **NO continuar a TEST 2**
3. **NO hacer fix sin aprobación**
4. Anotar:
   - Qué validación falló
   - Request enviado (payload)
   - Response recibido (completo)
   - Error exacto (stack trace si hay)
   - Screenshots de Supabase
5. Reportar a Jhonatan antes de continuar

---

## 🎯 SIGUIENTE PASO

Si TEST 1 PASA:
- Completar reporte TEST 1
- Commit del reporte (sanitizado)
- **ESPERAR APROBACIÓN** antes de continuar a TEST 2

---

**Última actualización:** 2026-05-07  
**Próximo test:** TEST 2 (Config Bancaria) — Solo después de aprobación
