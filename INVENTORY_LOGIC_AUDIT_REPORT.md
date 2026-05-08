# INVENTORY LOGIC AUDIT REPORT
**Fecha:** 2026-05-08 21:35 UTC  
**Problema reportado:** Productos marcados como "reserved" al agregar al carrito  
**Severidad:** CRÍTICO (afecta disponibilidad pública incorrectamente)

---

## 🔍 DIAGNÓSTICO COMPLETO

### ❌ PROBLEMA 1: Stripe Checkout Session marca RESERVED prematuramente

**Archivo:** `src/app/api/checkout/create-session/route.ts`  
**Línea:** 88  
**Código:**
```typescript
// Marcar producto como reserved INMEDIATAMENTE
const { error: updateError } = await supabaseAdmin
  .from('products')
  .update({ status: 'reserved' })
  .eq('id', product.id)
```

**Evento que lo dispara:** Click en "Comprar ahora" → Stripe Checkout Session creada

**Riesgo actual:**
1. Cliente clickea "Comprar ahora"
2. Producto se marca `reserved` INMEDIATAMENTE
3. Producto desaparece del catálogo público
4. Si cliente:
   - Cierra el checkout sin pagar → producto queda reservado indefinidamente
   - Abandona el sitio → producto queda reservado indefinidamente
   - Falla el pago → producto queda reservado indefinidamente
5. **NO hay limpieza automática de productos reserved si checkout.session.expired**

**Flujos afectados:**
- ✅ Stripe checkout pago exitoso → webhook marca `sold` correctamente (línea 209)
- ❌ Stripe checkout abandonado → producto queda `reserved` sin expiración
- ❌ Stripe checkout expirado → NO libera producto a `available`

**Problema de negocio:**
- Cliente A ve bolsa, clickea "Comprar"
- Producto se reserva
- Cliente A abandona checkout
- Cliente B ya NO puede comprar la bolsa (aparece reservada)
- **Pérdida de venta real**

---

### ❌ PROBLEMA 2: Bank Transfer Order marca RESERVED sin pago confirmado

**Archivo:** `src/app/api/payments/bank-transfer/order/route.ts`  
**Línea:** ~110  
**Código:**
```typescript
// 4. Update product status: available → reserved
console.log('[BankTransfer] Reserving product...');
const statusUpdate = await updateProductStatus(productId, 'reserved');
```

**Evento que lo dispara:** Cliente selecciona "Transferencia bancaria" → crear orden

**Riesgo actual:**
1. Cliente selecciona "Transferencia bancaria MXN"
2. Orden se crea, producto se marca `reserved` INMEDIATAMENTE
3. Cliente recibe instrucciones de pago
4. Si cliente:
   - NO sube comprobante → producto queda reservado
   - Abandona sin transferir → producto queda reservado
   - Sube comprobante pero admin rechaza → producto se libera (línea 167 del verify endpoint)

**Mitigación parcial existente:**
- ✅ Tiene rollback si falla crear orden/transaction (líneas 156, 172, 188)
- ❌ NO tiene expiración automática si cliente no sube comprobante en X horas

**Recomendación previa (línea 13 del archivo):**
```
// TODO: Consider adding expiration_date for pending payments
// Suggestion: 24h expiration, auto-release to available if not paid
```

**Flujos afectados:**
- ✅ Admin aprueba pago → marca `sold` correctamente (verify endpoint)
- ✅ Admin rechaza pago → libera a `available` correctamente
- ❌ Cliente NO sube comprobante → producto queda `reserved` indefinidamente

---

### ✅ CORRECTO: Stripe Webhook (checkout.session.completed)

**Archivo:** `src/app/api/stripe/webhook/route.ts`  
**Líneas:** 209-230  
**Código:**
```typescript
if (product && product.stock === 1) {
  // Si stock = 1, marcar como sold
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('products')
    .update({ status: 'sold', stock: 0 })
    .eq('id', item.product_id)
} else if (product && product.stock > 1) {
  // Si stock > 1, solo bajar stock
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('products')
    .update({ stock: product.stock - 1 })
    .eq('id', item.product_id)
}
```

**Comportamiento:**
- ✅ Pago confirmado → stock baja 1
- ✅ Si stock queda 0 → status = `sold`
- ✅ Si stock > 0 → status sigue `available`
- ✅ Implementación correcta según regla de negocio

---

### ✅ CORRECTO: Layaway Deposit (apartados)

**Archivo:** `src/app/api/stripe/webhook/route.ts`  
**Líneas:** 375  
**Código:**
```typescript
// Update product: available → reserved
const { error: productError } = await supabaseAdmin
  .from('products')
  .update({ status: 'reserved' })
  .eq('id', layaway.product_id)
```

**Comportamiento:**
- ✅ Depósito inicial pagado → marca `reserved` (correcto para apartados)
- ✅ Balance pagado → marca `sold` (línea 551)
- ✅ Implementación correcta según regla de negocio

---

### ✅ CORRECTO: Cart (AddToCartButton + CartContext)

**Archivos auditados:**
- `src/components/AddToCartButton.tsx`
- `src/contexts/CartContext.tsx`
- `src/components/CartIcon.tsx`

**Resultado:**
- ✅ AddToCartButton solo MUESTRA status, NO lo modifica
- ✅ CartContext solo guarda items en localStorage, NO toca products table
- ✅ Agregar al carrito NO cambia product.status
- ✅ Implementación correcta según regla de negocio

---

## 📊 RESUMEN AUDITORÍA

| Flujo | Archivo | Marca Reserved | Momento | Correcto | Riesgo |
|-------|---------|----------------|---------|----------|--------|
| Agregar al carrito | AddToCartButton.tsx | ❌ NO | - | ✅ SÍ | Ninguno |
| Stripe create session | checkout/create-session | ✅ SÍ | Inmediato | ❌ NO | Alto |
| Stripe pago completo | stripe/webhook | ❌ NO (marca sold) | Post-pago | ✅ SÍ | Ninguno |
| Stripe checkout expired | stripe/webhook | ❌ NO libera | N/A | ❌ NO | Alto |
| Bank transfer crear orden | bank-transfer/order | ✅ SÍ | Inmediato | ⚠️ PARCIAL | Medio |
| Bank transfer admin aprueba | admin/verify | ❌ NO (marca sold) | Post-aprobación | ✅ SÍ | Ninguno |
| Bank transfer admin rechaza | admin/verify | ❌ NO (libera available) | Post-rechazo | ✅ SÍ | Ninguno |
| Layaway depósito pagado | stripe/webhook | ✅ SÍ | Post-pago | ✅ SÍ | Ninguno |
| Layaway balance pagado | stripe/webhook | ❌ NO (marca sold) | Post-pago | ✅ SÍ | Ninguno |

---

## 🔧 FIX RECOMENDADO

### FIX 1: Stripe Checkout Session (CRÍTICO)

**Opción A — Sin reserva previa (RECOMENDADO PARA MVP):**
```typescript
// REMOVER líneas 86-95 de create-session/route.ts
// NO marcar reserved al crear session
// Dejar que webhook marque sold solo cuando pago confirmado
```

**Pros:**
- ✅ Simple, sin complejidad adicional
- ✅ Producto visible hasta pago real
- ✅ Sin riesgo de productos "fantasma" reservados
- ✅ Webhook ya maneja correctamente sold

**Contras:**
- ❌ Pequeño race condition: 2 clientes podrían intentar comprar mismo producto
- ❌ Uno falla, pero es caso edge muy raro
- ❌ Mitigado porque webhook verifica stock antes de marcar sold

**Opción B — Reserva con expiración (COMPLEJO, NO RECOMENDADO PARA MVP):**
```typescript
// Crear nuevo handler: handleCheckoutExpired
// Webhook event: checkout.session.expired
// Acción: liberar producto a available si session expira
// Requiere: metadata.product_id en session
```

**Pros:**
- ✅ Protege contra race condition

**Contras:**
- ❌ Complejidad adicional
- ❌ Requiere metadata en session
- ❌ Requiere handler nuevo
- ❌ Requiere testing exhaustivo
- ❌ Overkill para MVP con inventario único

**RECOMENDACIÓN:** Opción A (remover reserva previa)

---

### FIX 2: Bank Transfer Order (MEDIO RIESGO)

**Opción A — Reserva temporal 24h (RECOMENDADO):**
```typescript
// En bank-transfer/order/route.ts:
// 1. Agregar expiration_date a orders table (migration)
// 2. Al crear order: expiration_date = now() + 24h
// 3. Crear cron job: cada hora revisar orders expired bank_transfer
// 4. Si expired y transaction.status = pending → liberar producto
```

**Pros:**
- ✅ Equilibrio entre reserva y disponibilidad
- ✅ Cliente tiene 24h para pagar (razonable)
- ✅ Productos no quedan bloqueados indefinidamente

**Contras:**
- ❌ Requiere migration DB
- ❌ Requiere cron job
- ❌ Complejidad moderada

**Opción B — Solo reservar al subir comprobante (ALTERNATIVA):**
```typescript
// En upload-proof/route.ts:
// Marca reserved solo cuando cliente sube comprobante
// NO marcar reserved al crear orden
```

**Pros:**
- ✅ Más conservador con inventario
- ✅ No requiere expiración

**Contras:**
- ❌ Cliente puede perder producto entre crear orden y subir comprobante
- ❌ UX confusa: "pagué pero la bolsa desapareció"

**Opción C — Mantener como está (NO RECOMENDADO):**
- ⚠️ Riesgo medio de productos bloqueados
- ⚠️ Requiere intervención manual admin para liberar

**RECOMENDACIÓN:** Opción A (expiración 24h) para Phase 2, mantener como está para MVP con nota documentada

---

## 🧪 PLAN DE PRUEBAS (Post-Fix)

### Test 1: Agregar al carrito
1. Agregar producto al carrito
2. Verificar producto sigue `available` en DB
3. Refrescar catálogo → producto visible
4. Abandonar carrito → producto sigue visible

### Test 2: Stripe checkout abandonado
1. Click "Comprar ahora"
2. Stripe checkout abierto
3. Verificar producto status en DB (debería ser `available`, no `reserved`)
4. Cerrar checkout sin pagar
5. Verificar producto sigue `available`
6. Refrescar catálogo → producto visible

### Test 3: Stripe checkout expirado
1. Crear checkout session
2. Esperar expiración (10 min default)
3. Webhook `checkout.session.expired` recibido
4. Verificar producto liberado a `available`

### Test 4: Stripe pago completo
1. Completar pago Stripe test
2. Webhook `checkout.session.completed` recibido
3. Verificar producto status = `sold`
4. Verificar stock = 0
5. Refrescar catálogo → producto NO visible

### Test 5: Bank transfer crear orden
1. Seleccionar "Transferencia bancaria"
2. Crear orden
3. Verificar producto status = `reserved` (actual behavior)
4. Si FIX implementado: verificar `available` hasta subir comprobante

### Test 6: Bank transfer subir comprobante
1. Subir comprobante
2. Verificar transaction.status = `proof_uploaded`
3. Admin aprueba
4. Verificar producto status = `sold`

### Test 7: Bank transfer rechazar
1. Admin rechaza comprobante
2. Verificar producto status = `available`
3. Refrescar catálogo → producto visible

### Test 8: Layaway depósito
1. Crear apartado
2. Pagar depósito inicial
3. Verificar producto status = `reserved` (correcto)

### Test 9: Layaway balance
1. Pagar balance completo
2. Verificar producto status = `sold`

---

## 📝 ARCHIVOS EXACTOS A MODIFICAR

### FIX 1: Remover reserva previa en Stripe
**Archivo:** `src/app/api/checkout/create-session/route.ts`  
**Acción:** REMOVER líneas 86-95

### FIX 2 (Opcional Phase 2): Handler checkout.session.expired
**Archivo:** `src/app/api/stripe/webhook/route.ts`  
**Acción:** AGREGAR nuevo case + handler

### FIX 3 (Opcional Phase 2): Expiración bank transfer
**Archivos:**
1. Nueva migration: `add_expiration_date_to_orders.sql`
2. `src/app/api/payments/bank-transfer/order/route.ts` - agregar expiration_date
3. Nuevo cron job: `cleanup_expired_bank_transfers.ts`

---

## ⚠️ RECOMENDACIÓN FINAL

**Para MVP (implementar YA):**
1. ✅ Remover reserva previa en `create-session` (FIX 1)
2. ✅ Mantener bank transfer como está (con nota documentada)
3. ✅ Testing exhaustivo post-fix

**Para Phase 2:**
1. Implementar `checkout.session.expired` handler
2. Implementar expiración 24h para bank transfer
3. Cron job de limpieza automática

**Beneficios inmediatos (MVP):**
- ✅ Productos disponibles hasta pago real
- ✅ Sin productos "fantasma" bloqueados
- ✅ Mejor UX para clientes
- ✅ Más ventas (menos fricciones)

**Riesgos mitigados:**
- ✅ Race condition es edge case muy raro (inventario único)
- ✅ Webhook valida stock antes de marcar sold
- ✅ Bank transfer mantiene reserva temporal (trade-off aceptable para MVP)

---

## 🔒 ÁREAS NO TOCAR (según requerimiento)

- ❌ DB schema (hasta Phase 2)
- ❌ Stripe Live
- ❌ Webhook sin revisar (solo agregar handler expired)
- ❌ Admin UI
- ❌ Customer panel
- ❌ Payments bank transfer sin diagnóstico previo
- ❌ Layaways sin diagnóstico previo

---

**Diagnóstico completo. Esperando aprobación para implementar FIX 1 (remover reserva previa Stripe).**
