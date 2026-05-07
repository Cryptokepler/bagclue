# PAYMENTS MVP.2A — DIAGNÓSTICO + FIX PROPUESTO
**Fecha**: 2026-05-06 23:40 UTC  
**Fase**: Post-QA TEST 1 FAILED

---

## RESUMEN EJECUTIVO

**Problema**: POST `/api/payments/bank-transfer/order` falla con error 500  
**Causa raíz**: Schema mismatch - endpoint asume columnas inexistentes en `orders`  
**Impacto**: QA detenida en TEST 1, bank transfer MVP.2A no funcional  
**Fix requerido**: Alinear endpoint con patrón Stripe existente

---

## 1. SCHEMA REAL DE ORDERS

### Columnas existentes (31 total):
```
id, customer_name, customer_email, customer_phone, customer_address,
subtotal, shipping, total, status, payment_status,
stripe_session_id, stripe_payment_intent_id, notes,
created_at, updated_at,
shipping_address, shipping_provider, tracking_number, tracking_url,
shipping_status, tracking_token, shipped_at, delivered_at,
layaway_id, user_id,
payment_method, payment_currency, payment_reference, exchange_rate,
amount_mxn, amount_usd, payment_expires_at
```

### Columnas NO existentes (asumidas por MVP.2A):
- ❌ `currency` (existe: `payment_currency`)
- ❌ `product_id` (productos se guardan en `order_items`)
- ❌ `quantity` (cantidad se guarda en `order_items`)

### Tabla ORDER_ITEMS (sí existe):
```sql
id, order_id, product_id, quantity, unit_price, subtotal,
product_snapshot (JSONB), created_at
```

**Conclusión**: El sistema usa arquitectura normalizada con `order_items` para productos.

---

## 2. PATRÓN REAL STRIPE CHECKOUT

### Flujo completo:

**A. POST /api/checkout/create-session**:
1. Valida productos: `is_published=true`, `status='available'`, `stock>0`, `price>0`
2. **Marca producto `reserved` INMEDIATAMENTE** (antes de pago)
3. Crea `ORDER`:
   ```js
   {
     customer_name, customer_email, customer_phone, shipping_address,
     user_id (opcional),
     subtotal, shipping, total,
     status: 'pending',
     payment_status: 'pending'
   }
   ```
4. Crea `ORDER_ITEMS`:
   ```js
   {
     order_id, product_id, quantity, unit_price, subtotal,
     product_snapshot: { title, brand, model, color, slug, price, currency }
   }
   ```
5. Crea Stripe session con `metadata.order_id`
6. Guarda `stripe_session_id` en orden

**B. Webhook checkout.session.completed**:
1. Busca orden por `metadata.order_id`
2. ACTUALIZA orden:
   ```js
   {
     payment_status: 'paid',
     status: 'confirmed',
     stripe_payment_intent_id
   }
   ```
3. Busca `order_items` de la orden
4. Para cada producto:
   - Si `stock=1`: `status='sold'`, `stock=0`
   - Si `stock>1`: decrement stock

**C. Webhook checkout.session.expired**:
1. ACTUALIZA orden: `status='cancelled'`, `payment_status='failed'`
2. Libera productos: `status='available'`

### Campos clave del patrón:
- `status`: 'pending' → 'confirmed' (approve) / 'cancelled' (expire/reject)
- `payment_status`: 'pending' → 'paid' (approve) / 'failed' (expire/reject)
- `payment_method`: null en Stripe test (podría ser 'card')
- `payment_currency`: null en Stripe test (podría ser 'MXN')
- `tracking_token`: generado con crypto.randomBytes(16) en algunos casos

---

## 3. CAUSA EXACTA DEL BUG MVP.2A

### Archivo afectado:
`src/app/api/payments/bank-transfer/order/route.ts`

### Error específico:
```
Could not find the 'currency' column of 'orders' in the schema cache
```

### Código incorrecto (líneas 71-94):
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    product_id: productId,        // ❌ NO EXISTE
    quantity: 1,                   // ❌ NO EXISTE
    total: product.price,
    payment_status: 'pending',
    status: 'pending',
    payment_method: 'bank_transfer_mxn',
    currency: 'MXN',              // ❌ INCORRECTO (debe ser payment_currency)
    // New payment_transactions columns
    payment_reference: paymentReference,
    payment_expires_at: expiresAt.toISOString(),
    amount_mxn: product.price,
  })
  .select()
  .single();
```

### Problemas identificados:
1. ❌ Usa `currency` en vez de `payment_currency`
2. ❌ Intenta insertar `product_id` directamente en `orders`
3. ❌ Intenta insertar `quantity` directamente en `orders`
4. ❌ NO crea `order_items` (tabla separada)
5. ❌ NO genera `product_snapshot` (requerido en `order_items`)
6. ❌ NO marca producto como `reserved` antes de crear orden
7. ❌ NO maneja `subtotal` y `shipping` (usa solo `total`)
8. ❌ NO genera `tracking_token` (podría ser requerido)

---

## 4. FIX MÍNIMO PROPUESTO

### Objetivo:
Alinear endpoint bank-transfer/order con patrón Stripe existente, cambiando solo lo mínimo necesario para:
- MXN en vez de Stripe session
- payment_method = 'bank_transfer_mxn'
- payment_reference + expires_at

### Archivos a modificar:

**A. src/app/api/payments/bank-transfer/order/route.ts** (ÚNICO ARCHIVO)

### Cambios específicos:

**ANTES (líneas 71-94)**:
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    product_id: productId,        // ❌
    quantity: 1,                   // ❌
    total: product.price,
    payment_status: 'pending',
    status: 'pending',
    payment_method: 'bank_transfer_mxn',
    currency: 'MXN',              // ❌
    payment_reference: paymentReference,
    payment_expires_at: expiresAt.toISOString(),
    amount_mxn: product.price,
  })
  .select()
  .single();
```

**DESPUÉS**:
```typescript
// 5a. Validar disponibilidad y marcar producto como RESERVED (patrón Stripe)
const { error: reserveError } = await supabase
  .from('products')
  .update({ status: 'reserved' })
  .eq('id', productId)
  .eq('status', 'available'); // Asegurar que sigue available

if (reserveError) {
  console.error('[BankTransfer] Failed to reserve product:', reserveError);
  return NextResponse.json(
    { error: 'Failed to reserve product', details: reserveError.message },
    { status: 500 }
  );
}

console.log('[BankTransfer] Product reserved:', productId);

// 5b. Crear orden en Supabase (patrón Stripe)
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    user_id: null, // Guest checkout por ahora
    subtotal: product.price,
    shipping: 0,
    total: product.price,
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'bank_transfer_mxn',
    payment_currency: 'MXN', // ✅ CORREGIDO
    payment_reference: paymentReference,
    payment_expires_at: expiresAt.toISOString(),
    amount_mxn: product.price,
  })
  .select()
  .single();

if (orderError || !order) {
  console.error('[BankTransfer] Failed to create order:', orderError);
  // Rollback: liberar producto
  await supabase
    .from('products')
    .update({ status: 'available' })
    .eq('id', productId);
  return NextResponse.json(
    { error: 'Failed to create order', details: orderError?.message },
    { status: 500 }
  );
}

console.log('[BankTransfer] Order created:', {
  orderId: order.id,
  productId,
  amount: product.price,
  reference: paymentReference,
});

// 5c. Crear order_items (patrón Stripe)
const { error: itemsError } = await supabase
  .from('order_items')
  .insert({
    order_id: order.id,
    product_id: productId,
    quantity: 1,
    unit_price: product.price,
    subtotal: product.price,
    product_snapshot: {
      title: product.title,
      brand: product.brand,
      model: product.model || null,
      color: product.color || null,
      slug: product.slug,
      price: product.price,
      currency: product.currency || 'MXN',
    },
  });

if (itemsError) {
  console.error('[BankTransfer] Failed to create order items:', itemsError);
  // Rollback: delete order + liberar producto
  await supabase.from('orders').delete().eq('id', order.id);
  await supabase.from('products').update({ status: 'available' }).eq('id', productId);
  return NextResponse.json(
    { error: 'Failed to create order items', details: itemsError.message },
    { status: 500 }
  );
}

console.log('[BankTransfer] Order items created');
```

**Eliminar código obsoleto (líneas 96-120)**:
```typescript
// 6. Create payment_transaction (pending)
const { data: transaction, error: txError } = await supabase
  .from('payment_transactions')
  .insert({
    order_id: order.id,
    payment_method: 'bank_transfer_mxn',
    status: 'pending',
    currency: 'MXN',
    amount_mxn: product.price,
    payment_reference: paymentReference,
    expires_at: expiresAt.toISOString(),
  })
  .select()
  .single();

if (txError || !transaction) {
  console.error('[BankTransfer] Failed to create transaction:', txError);
  // Rollback: delete order
  await supabase.from('orders').delete().eq('id', order.id);
  return NextResponse.json(
    { error: 'Failed to create payment transaction', details: txError?.message },
    { status: 500 }
  );
}
```

**Reemplazar por** (crear transaction DESPUÉS de order_items):
```typescript
// 6. Create payment_transaction (pending)
const { data: transaction, error: txError } = await supabase
  .from('payment_transactions')
  .insert({
    order_id: order.id,
    payment_method: 'bank_transfer_mxn',
    status: 'pending',
    currency: 'MXN', // payment_transactions usa 'currency', no 'payment_currency'
    amount_mxn: product.price,
    payment_reference: paymentReference,
    expires_at: expiresAt.toISOString(),
  })
  .select()
  .single();

if (txError || !transaction) {
  console.error('[BankTransfer] Failed to create transaction:', txError);
  // Rollback: delete order_items + order + liberar producto
  await supabase.from('order_items').delete().eq('order_id', order.id);
  await supabase.from('orders').delete().eq('id', order.id);
  await supabase.from('products').update({ status: 'available' }).eq('id', productId);
  return NextResponse.json(
    { error: 'Failed to create payment transaction', details: txError?.message },
    { status: 500 }
  );
}

console.log('[BankTransfer] Transaction created:', {
  transactionId: transaction.id,
  orderId: order.id,
  status: 'pending',
});
```

**Eliminar código obsoleto de product update (líneas 125-140)** ya que se hace ANTES de crear orden.

---

## 5. ORDEN DE OPERACIONES CORREGIDO

### Flujo actual (INCORRECTO):
1. Validar producto
2. Generar reference + expiry
3. Crear orden (❌ FALLA)
4. Crear transaction
5. Marcar producto reserved

### Flujo corregido (PATRÓN STRIPE):
1. Validar producto (available, published, stock, price)
2. Generar reference + expiry
3. **Marcar producto RESERVED** (ANTES de crear orden)
4. Crear orden (orders)
5. Crear order_items
6. Crear transaction
7. Si falla cualquier paso: rollback completo (orden + items + transaction + liberar producto)

---

## 6. VALIDACIONES ADICIONALES

### Campos obligatorios verificados:
- ✅ `customer_name` (requerido)
- ✅ `customer_email` (requerido)
- ✅ `customerPhone` (opcional)
- ✅ `productId` (requerido)
- ✅ `product.is_published=true`
- ✅ `product.status='available'`
- ✅ `product.stock>0` (si aplica)
- ✅ `product.price>0`

### Valores por defecto:
- `user_id`: null (guest checkout por ahora)
- `shipping`: 0
- `shipping_address`: null
- `stripe_session_id`: null
- `stripe_payment_intent_id`: null
- `layaway_id`: null

---

## 7. NO-REGRESSION CHECKLIST

### Áreas NO TOCADAS:
- ✅ Stripe checkout (`/api/checkout/create-session`) - NO modificar
- ✅ Stripe webhook (`/api/stripe/webhook`) - NO modificar
- ✅ DB schema - NO modificar
- ✅ Migraciones - NO crear nuevas
- ✅ Admin UI - NO tocar
- ✅ Customer panel - NO tocar
- ✅ Frontend checkout - NO tocar
- ✅ Email infrastructure - NO tocar
- ✅ Layaway logic - NO tocar
- ✅ RLS policies - NO modificar

### Área MODIFICADA:
- ⚠️ `/api/payments/bank-transfer/order/route.ts` (ÚNICO ARCHIVO)
- Cambios: Corrección de schema mismatch + alineación con patrón Stripe

### Tests de regresión requeridos:
1. ✅ Stripe checkout sigue funcionando (TEST 13)
2. ✅ Catálogo sigue funcionando (TEST 14)
3. ✅ Admin órdenes sigue funcionando
4. ✅ Layaway deposit sigue funcionando
5. ✅ Email confirmación sigue enviándose

---

## 8. PLAN REINTENTAR QA

### Prerequisitos:
1. ✅ Aprobar fix propuesto
2. ✅ Implementar cambios en `/api/payments/bank-transfer/order/route.ts`
3. ✅ Build local PASS (41/41 routes)
4. ✅ Commit + push
5. ✅ Deploy production
6. ✅ Verificar endpoint responde correctamente

### Producto test actual:
- **ID**: `e162405d-0d82-4b89-9498-86a7b763a643`
- **Estado actual**: available (despublicado: `is_published=false`)
- **Acción requerida**: Republicar antes de QA (`is_published=true`)

### QA tests pendientes (15 total):
1. ⏳ Crear bank order (reintentar con fix)
2. ⏳ Verificar order pending
3. ⏳ Verificar transaction pending
4. ⏳ Verificar reference única
5. ⏳ Verificar producto reserved
6. ⏳ Verificar config ownership
7-10. ⏳ Upload proof (multipart, requiere tool manual)
11. ⏳ Admin approve
12. ⏳ Admin reject
13. ⏳ Stripe checkout funciona
14. ⏳ Catálogo funciona
15. ⏳ No secretos en logs

---

## 9. ESTIMACIÓN

**Tiempo implementación fix**: 10-15 minutos  
**Build + deploy**: 3-5 minutos  
**QA reintentar**: 15-20 minutos (tests 1-6, 11-15)  
**Total**: ~30-40 minutos

---

## 10. RECOMENDACIONES

1. **Implementar fix incremental**:
   - Solo modificar `/api/payments/bank-transfer/order/route.ts`
   - NO tocar otros endpoints (upload-proof, config, admin/verify)
   - Validar que el fix funciona antes de continuar QA

2. **Tests críticos post-fix**:
   - TEST 1: Crear bank order → debe PASS
   - TEST 5: Producto reserved → debe PASS
   - TEST 13: Stripe checkout → debe seguir funcionando

3. **Si TEST 1 sigue fallando**:
   - Detener QA inmediatamente
   - Reportar error exacto
   - NO reintentar sin diagnóstico

4. **Cleanup producto test**:
   - Después de QA completa: despublicar (`is_published=false`)
   - Dejar `status='sold'` si QA completó
   - Documentar resultado en reporte final

---

## 11. RESUMEN EJECUTIVO FINAL

**Problema**: Schema mismatch en endpoint bank-transfer/order  
**Causa**: Asumió columnas inexistentes (`currency`, `product_id`, `quantity`)  
**Fix**: Alinear con patrón Stripe (usar `payment_currency`, crear `order_items`)  
**Impacto**: 1 archivo modificado, 0 cambios DB, 0 risk regresión  
**Siguiente paso**: Aprobar fix → implementar → reintentar QA TEST 1

---

**Preparado por**: Kepler  
**Fecha**: 2026-05-06 23:40 UTC  
**Status**: ✅ DIAGNÓSTICO COMPLETO - ESPERANDO APROBACIÓN
