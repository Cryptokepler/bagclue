# PAYMENTS MVP.2A — BANK TRANSFER MXN FULL PURCHASE ONLY

**Fecha:** 2026-05-06  
**Autor:** Kepler  
**Estado:** 📋 SCOPE PREPARADO (awaiting final approval to implement)  
**Objetivo:** Implementar backend para **compra completa** por transferencia bancaria MXN, **sin apartados, sin Stripe USD, sin UI pública completa**.

---

## RESUMEN EJECUTIVO

**Fase anterior:** PAYMENTS MVP.1 — DB SCHEMA ✅ CERRADA

**Fase actual:** PAYMENTS MVP.2A — BANK TRANSFER MXN FULL PURCHASE ONLY (subfase reducida)

**Alcance:** 4 endpoints backend para compra completa MXN:
1. Configuración bancaria segura (variables entorno)
2. Crear orden por transferencia MXN
3. Upload comprobante
4. Admin verificar pago (aprobar/rechazar)

**NO incluido en MVP.2A:**
- ❌ Apartados (layaways)
- ❌ Abonos/cuotas
- ❌ Stripe USD
- ❌ UI pública completa (checkout flow)
- ❌ Admin UI dedicado (usar Supabase Dashboard interim)
- ❌ Emails transaccionales

**Resultado esperado:** Backend funcional para crear órdenes con transferencia MXN, subir comprobantes, y admin aprobar/rechazar pagos. Listo para integrar UI básica en MVP.2B (futuro).

---

## 1. CONFIGURACIÓN BANCARIA SEGURA

### 1.1 Variables de Entorno Vercel (Production)

**Agregar en Vercel Dashboard → Settings → Environment Variables:**

```bash
# Datos bancarios Bagclue (NO commitear)
BANK_NAME=Banorte
BANK_ACCOUNT_HOLDER=BAG CLUE SA DE CV
BANK_CLABE=<CLABE proporcionada por Jhonatan>
BANK_ACCOUNT_NUMBER=<opcional si aplica>
BANK_PAYMENT_INSTRUCTIONS=<opcional - texto adicional>
```

**Valores exactos:**
- `BANK_NAME` → `"Banorte"`
- `BANK_ACCOUNT_HOLDER` → `"BAG CLUE SA DE CV"`
- `BANK_CLABE` → `[valor confidencial proporcionado por Jhonatan]`
- `BANK_ACCOUNT_NUMBER` → Opcional (si Jhonatan lo proporciona)
- `BANK_PAYMENT_INSTRUCTIONS` → Opcional (e.g., "Incluir referencia en concepto")

---

### 1.2 Reglas de Seguridad (Obligatorias)

**❌ PROHIBIDO:**
1. Hardcodear datos bancarios en código fuente
2. Imprimir CLABE en logs de aplicación
3. Guardar datos bancarios en repo (Git)
4. Guardar datos bancarios en documentos públicos
5. Exponer CLABE sin validación ownership

**✅ PERMITIDO:**
1. Usar env variables server-side únicamente
2. Loggear eventos sin datos sensibles (e.g., "Bank config requested for order_id X")
3. Devolver datos bancarios a usuarios con orden válida

---

### 1.3 Acceso desde API Routes

**Server-side only:**
```typescript
// src/lib/bank-config.ts
export function getBankDetails() {
  return {
    bank_name: process.env.BANK_NAME || 'Banorte',
    account_holder: process.env.BANK_ACCOUNT_HOLDER || 'BAG CLUE SA DE CV',
    clabe: process.env.BANK_CLABE,
    account_number: process.env.BANK_ACCOUNT_NUMBER,
    instructions: process.env.BANK_PAYMENT_INSTRUCTIONS
  };
}
```

**Validar antes de usar:**
```typescript
const bankDetails = getBankDetails();
if (!bankDetails.clabe) {
  throw new Error('Bank configuration missing: BANK_CLABE not set');
}
```

---

### 1.4 Logs Seguros

**✅ CORRECTO:**
```typescript
console.log('[BANK_CONFIG] Bank details requested for order:', order_id);
console.log('[BANK_CONFIG] Bank details delivered to user:', user_id);
```

**❌ INCORRECTO:**
```typescript
console.log('Bank CLABE:', process.env.BANK_CLABE); // ❌ NUNCA
console.log('Bank details:', bankDetails);           // ❌ NUNCA
```

---

## 2. ENDPOINT: CREAR ORDER POR TRANSFERENCIA MXN

### 2.1 Especificación

**Path:** `POST /api/payments/bank-transfer/order`

**Auth:** 
- Usuario autenticado (si checkout requiere login)
- O guest (si checkout actual permite compra sin cuenta)

**Propósito:** Crear una orden con método de pago transferencia bancaria MXN

---

### 2.2 Payload

```typescript
{
  product_id: string;           // UUID del producto
  customer_name: string;        // Nombre completo
  customer_email: string;       // Email válido
  customer_phone: string;       // Teléfono
  shipping_address?: {          // Opcional si usuario ya tiene dirección
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}
```

---

### 2.3 Validaciones (Pre-Creación)

**Usuario:**
- ✅ Usuario autenticado si checkout actual lo requiere
- ✅ O guest si checkout actual lo permite (validar email único si guest)

**Producto:**
- ✅ `product_id` existe en DB
- ✅ `product.is_published = true`
- ✅ `product.status = 'available'`
- ✅ `product.stock > 0` (si aplica stock en DB actual)
- ✅ `product.price > 0`

**Campos cliente:**
- ✅ `customer_email` formato válido (regex email)
- ✅ `customer_phone` no vacío
- ✅ `customer_name` no vacío

---

### 2.4 Lógica del Endpoint

**Paso 1: Validar producto disponible**

```typescript
const product = await supabase
  .from('products')
  .select('id, price, status, is_published, stock')
  .eq('id', product_id)
  .single();

if (!product) {
  return res.status(404).json({ 
    success: false, 
    error: 'Producto no encontrado' 
  });
}

if (!product.is_published) {
  return res.status(400).json({ 
    success: false, 
    error: 'Producto no disponible para venta' 
  });
}

if (product.status !== 'available') {
  return res.status(400).json({ 
    success: false, 
    error: 'Producto no disponible (ya vendido o reservado)' 
  });
}

if (product.price <= 0) {
  return res.status(400).json({ 
    success: false, 
    error: 'Precio de producto inválido' 
  });
}

// Si hay stock en DB
if (product.stock !== null && product.stock <= 0) {
  return res.status(400).json({ 
    success: false, 
    error: 'Producto sin stock' 
  });
}
```

---

**Paso 2: Generar payment_reference único**

```typescript
import crypto from 'crypto';

function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `BAG-MXN-${timestamp}-${random}`;
}

const payment_reference = generatePaymentReference();
// Ejemplo: BAG-MXN-1715034567890-A7C2F9
```

---

**Paso 3: Calcular montos y expiración**

```typescript
const total_mxn = product.price;
const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
```

---

**Paso 4: Crear orden (con service role)**

```typescript
const { data: order, error: orderError } = await supabaseAdmin
  .from('orders')
  .insert({
    user_id: session?.user?.id || null,  // null si guest
    product_id: product_id,
    customer_name: customer_name,
    customer_email: customer_email,
    customer_phone: customer_phone,
    shipping_address: shipping_address,   // JSON
    total: total_mxn,
    payment_status: 'pending',
    shipping_status: null,                // No tocar hasta que pago sea confirmed
    status: 'pending_payment',            // O el equivalente actual seguro
    payment_method: 'bank_transfer_mxn',
    payment_currency: 'MXN',
    payment_reference: payment_reference,
    amount_mxn: total_mxn,
    payment_expires_at: expires_at
  })
  .select()
  .single();

if (orderError) {
  console.error('[ORDER_CREATE_ERROR]', orderError);
  return res.status(500).json({ 
    success: false, 
    error: 'Error al crear orden' 
  });
}
```

---

**Paso 5: Crear payment_transaction (con service role)**

```typescript
const { data: transaction, error: txError } = await supabaseAdmin
  .from('payment_transactions')
  .insert({
    order_id: order.id,
    payment_type: 'full_purchase',
    payment_method: 'bank_transfer_mxn',
    currency: 'MXN',
    amount: total_mxn,
    amount_mxn: total_mxn,
    status: 'pending',
    payment_reference: payment_reference,
    expires_at: expires_at
  })
  .select()
  .single();

if (txError) {
  console.error('[TRANSACTION_CREATE_ERROR]', txError);
  // Rollback: eliminar orden creada
  await supabaseAdmin.from('orders').delete().eq('id', order.id);
  return res.status(500).json({ 
    success: false, 
    error: 'Error al crear transacción' 
  });
}
```

---

**Paso 6: Actualizar producto (con service role)**

**⚠️ DECISIÓN CRÍTICA: Producto status**

**Opción A (preferida por Jhonatan):** Marcar `reserved` temporalmente
- ✅ Previene que otro cliente compre mientras pago está pendiente
- ✅ Si pago expira/rechaza → volver a `available`
- ⚠️ Requiere validar que lógica actual soporta `status = 'reserved'` sin romper catálogo

**Opción B:** Dejar `available` hasta pago confirmado
- ✅ Producto sigue visible en catálogo
- ❌ Otro cliente podría comprarlo antes de confirmar pago
- ❌ No recomendado

**Jhonatan prefiere Opción A**, pero solicita **confirmar primero** si sistema actual soporta `reserved`.

**Validación previa (antes de implementar):**

```sql
-- Verificar si productos actuales usan status = 'reserved'
SELECT DISTINCT status FROM products;

-- Verificar si hay lógica que filtre reserved del catálogo
-- (revisar src/app/catalogo/page.tsx y queries de productos)
```

**Si `reserved` está soportado:**

```typescript
await supabaseAdmin
  .from('products')
  .update({ 
    status: 'reserved',
    updated_at: new Date()
  })
  .eq('id', product_id);
```

**Si `reserved` NO está soportado:**
- Dejar `available` temporalmente (Opción B)
- Documentar en scope que se agregará lógica `reserved` en MVP.2B

---

**Paso 7: Obtener datos bancarios**

```typescript
import { getBankDetails } from '@/lib/bank-config';

const bankDetails = getBankDetails();

if (!bankDetails.clabe) {
  throw new Error('Bank configuration incomplete');
}
```

---

**Paso 8: Retornar response**

---

### 2.5 Response

**Success (201 Created):**

```typescript
{
  success: true,
  order_id: string;              // UUID de la orden creada
  transaction_id: string;        // UUID de payment_transaction
  payment_reference: string;     // BAG-MXN-1715034567890-A7C2F9
  amount_mxn: number;            // Monto a transferir (e.g., 189000.00)
  expires_at: string;            // ISO timestamp (24h desde now)
  bank_details: {
    bank_name: string;           // "Banorte"
    account_holder: string;      // "BAG CLUE SA DE CV"
    clabe: string;               // CLABE confidencial
    account_number?: string;     // Opcional
    instructions?: string;       // Instrucciones adicionales (opcional)
  }
}
```

**Ejemplo:**
```json
{
  "success": true,
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "transaction_id": "660f9511-f30c-52e5-b827-557766551111",
  "payment_reference": "BAG-MXN-1715034567890-A7C2F9",
  "amount_mxn": 189000.00,
  "expires_at": "2024-05-08T10:30:00.000Z",
  "bank_details": {
    "bank_name": "Banorte",
    "account_holder": "BAG CLUE SA DE CV",
    "clabe": "072XXXXXXXXXX123",
    "instructions": "Incluir referencia en concepto de pago"
  }
}
```

---

**Error (400/404/500):**

```typescript
{
  success: false,
  error: string;                 // Mensaje descriptivo
  code?: string;                 // Código de error (opcional)
}
```

**Códigos de error sugeridos:**
- `product_not_found` → Producto no existe
- `product_not_available` → Producto no disponible
- `product_not_published` → Producto no publicado
- `invalid_email` → Email inválido
- `missing_fields` → Campos requeridos faltantes
- `server_error` → Error interno

---

### 2.6 Logging (Seguro)

```typescript
// ✅ CORRECTO
console.log('[BANK_ORDER_CREATE]', {
  timestamp: new Date().toISOString(),
  order_id: order.id,
  transaction_id: transaction.id,
  payment_reference: payment_reference,
  amount_mxn: total_mxn,
  user_id: session?.user?.id || 'guest',
  product_id: product_id
});

console.log('[BANK_DETAILS_DELIVERED]', {
  order_id: order.id,
  user_id: session?.user?.id || 'guest'
});

// ❌ INCORRECTO (NO loggear datos bancarios)
// console.log('CLABE:', bankDetails.clabe); // ❌ NUNCA
```

---

## 3. ENDPOINT: UPLOAD COMPROBANTE

### 3.1 Especificación

**Path:** `POST /api/payments/bank-transfer/upload-proof`

**Auth:** Usuario autenticado (dueño de la orden)

**Content-Type:** `multipart/form-data`

**Propósito:** Subir comprobante de transferencia bancaria

---

### 3.2 Payload

**Form data:**
```
transaction_id: string (UUID)
file: File (JPG/PNG/PDF, max 5MB)
```

**Validaciones:**
- ✅ `transaction_id` es UUID válido
- ✅ `file` es requerido
- ✅ Tipo MIME: `image/jpeg`, `image/jpg`, `image/png`, `application/pdf`
- ✅ Tamaño máximo: 5MB (5,242,880 bytes)

---

### 3.3 Validaciones (Pre-Upload)

**Transacción:**
- ✅ `transaction_id` existe en `payment_transactions`
- ✅ Usuario es dueño de la orden asociada (`order.user_id = session.user.id` o `order.customer_email = session.user.email` si guest)
- ✅ Transaction status = `'pending'` o `'rejected'` (permitir reintento si fue rechazado)
- ✅ Transaction status ≠ `'confirmed'`, `'expired'`, `'failed'` (no permitir re-upload si ya confirmado/expirado)

**Archivo:**
- ✅ Tipo MIME permitido
- ✅ Tamaño ≤ 5MB

---

### 3.4 Lógica del Endpoint

**Paso 1: Validar transaction y ownership**

```typescript
const { data: transaction, error: txError } = await supabase
  .from('payment_transactions')
  .select('*, orders(user_id, customer_email)')
  .eq('id', transaction_id)
  .single();

if (!transaction) {
  return res.status(404).json({ 
    success: false, 
    error: 'Transacción no encontrada' 
  });
}

// Validar ownership
const order = transaction.orders;
const isOwner = order.user_id 
  ? order.user_id === session.user.id 
  : order.customer_email === session.user.email;

if (!isOwner) {
  return res.status(403).json({ 
    success: false, 
    error: 'No autorizado para subir comprobante a esta transacción' 
  });
}

// Validar status
if (!['pending', 'rejected'].includes(transaction.status)) {
  return res.status(400).json({ 
    success: false, 
    error: `No se puede subir comprobante. Status actual: ${transaction.status}` 
  });
}
```

---

**Paso 2: Validar archivo**

```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

if (!ALLOWED_TYPES.includes(file.type)) {
  return res.status(400).json({ 
    success: false, 
    error: 'Tipo de archivo no permitido. Solo JPG, PNG o PDF.' 
  });
}

if (file.size > MAX_SIZE) {
  return res.status(400).json({ 
    success: false, 
    error: 'Archivo demasiado grande. Máximo 5MB.' 
  });
}
```

---

**Paso 3: Generar SHA256 hash**

```typescript
import crypto from 'crypto';

async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return crypto
    .createHash('sha256')
    .update(Buffer.from(buffer))
    .digest('hex');
}

const proof_hash = await generateFileHash(file);
```

---

**Paso 4: Verificar duplicado**

```typescript
const { data: duplicate } = await supabase
  .from('payment_transactions')
  .select('id, payment_reference')
  .eq('proof_hash', proof_hash)
  .neq('id', transaction_id)
  .maybeSingle();

if (duplicate) {
  console.warn('[UPLOAD_PROOF_DUPLICATE]', {
    hash: proof_hash,
    original_transaction: duplicate.id,
    new_transaction: transaction_id
  });
  
  return res.status(400).json({ 
    success: false, 
    error: 'Este comprobante ya fue subido anteriormente.',
    code: 'duplicate_proof'
  });
}
```

---

**Paso 5: Subir a storage bucket (con service role)**

**Path recomendado:** `{user_id}/{transaction_id}/{filename}`

```typescript
import { supabaseAdmin } from '@/lib/supabase-admin';

const userId = order.user_id || 'guest';
const fileExtension = file.name.split('.').pop() || 'jpg';
const fileName = `${userId}/${transaction_id}/${Date.now()}.${fileExtension}`;

const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
  .from('bank-payment-proofs')
  .upload(fileName, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false  // No sobrescribir si ya existe
  });

if (uploadError) {
  console.error('[UPLOAD_PROOF_STORAGE_ERROR]', uploadError);
  return res.status(500).json({ 
    success: false, 
    error: 'Error al subir comprobante al servidor' 
  });
}

// Obtener URL pública (aunque bucket es privado, URL existe para service role)
const { data: urlData } = supabaseAdmin.storage
  .from('bank-payment-proofs')
  .getPublicUrl(fileName);

const proof_url = urlData.publicUrl;
```

---

**Paso 6: Actualizar payment_transaction (con service role)**

```typescript
const { error: updateError } = await supabaseAdmin
  .from('payment_transactions')
  .update({
    status: 'proof_uploaded',
    proof_url: proof_url,
    proof_file_name: file.name,
    proof_file_type: file.type,
    proof_file_size: file.size,
    proof_hash: proof_hash,
    updated_at: new Date()
  })
  .eq('id', transaction_id);

if (updateError) {
  console.error('[UPDATE_TRANSACTION_ERROR]', updateError);
  // Intentar limpiar archivo subido
  await supabaseAdmin.storage
    .from('bank-payment-proofs')
    .remove([fileName]);
  
  return res.status(500).json({ 
    success: false, 
    error: 'Error al actualizar transacción' 
  });
}
```

---

**Paso 7: NO actualizar order todavía**

**⚠️ IMPORTANTE:** NO cambiar `order.payment_status` a `'paid'` en este endpoint.

Solo admin puede confirmar pago después de revisar comprobante.

---

**Paso 8: Retornar response**

---

### 3.5 Response

**Success (200 OK):**

```typescript
{
  success: true,
  message: 'Comprobante subido exitosamente. Será revisado por un administrador.',
  transaction_id: string;
  payment_reference: string;
  status: 'proof_uploaded'
}
```

---

**Error (400/403/404/500):**

```typescript
{
  success: false,
  error: string;
  code?: string;
}
```

**Códigos de error:**
- `transaction_not_found`
- `forbidden` (no es dueño)
- `invalid_status` (status no permite upload)
- `invalid_file_type`
- `file_too_large`
- `duplicate_proof`
- `upload_failed`

---

### 3.6 Logging (Seguro)

```typescript
console.log('[UPLOAD_PROOF_SUCCESS]', {
  timestamp: new Date().toISOString(),
  transaction_id: transaction_id,
  payment_reference: transaction.payment_reference,
  user_id: session.user.id,
  file_type: file.type,
  file_size: file.size,
  proof_hash: proof_hash.substring(0, 8) + '...' // Solo primeros 8 chars
});
```

---

## 4. ENDPOINT: ADMIN VERIFY PAYMENT

### 4.1 Especificación

**Path:** `POST /api/payments/admin/verify`

**Auth:** Admin autenticado (mismo patrón actual del admin de Bagclue)

**Propósito:** Aprobar o rechazar un pago por transferencia bancaria

---

### 4.2 Payload

```typescript
{
  transaction_id: string;        // UUID de payment_transaction
  action: 'approve' | 'reject';
  rejection_reason?: string;     // Requerido si action = 'reject'
  admin_notes?: string;          // Opcional
}
```

**Validaciones:**
- ✅ `transaction_id` es UUID válido
- ✅ `action` es `'approve'` o `'reject'`
- ✅ Si `action = 'reject'`, `rejection_reason` es requerido y no vacío

---

### 4.3 Validaciones (Pre-Verify)

**Admin:**
- ✅ Usuario autenticado es admin (mismo check que usa admin actual de Bagclue)
  - Ejemplo: `session.user.role === 'admin'` o `raw_user_meta_data->>'role' = 'admin'`

**Transacción:**
- ✅ `transaction_id` existe
- ✅ Transaction status = `'proof_uploaded'` (no `'pending'`, `'confirmed'`, etc.)
- ✅ Orden asociada existe

---

### 4.4 Lógica (Aprobar)

**Si action = 'approve':**

**Paso 1: Validar transacción**

```typescript
const { data: transaction, error: txError } = await supabase
  .from('payment_transactions')
  .select('*, orders(*)')
  .eq('id', transaction_id)
  .single();

if (!transaction) {
  return res.status(404).json({ 
    success: false, 
    error: 'Transacción no encontrada' 
  });
}

if (transaction.status !== 'proof_uploaded') {
  return res.status(400).json({ 
    success: false, 
    error: `No se puede aprobar. Status actual: ${transaction.status}` 
  });
}

const order = transaction.orders;
if (!order) {
  return res.status(500).json({ 
    success: false, 
    error: 'Orden asociada no encontrada' 
  });
}
```

---

**Paso 2: Actualizar payment_transaction (con service role)**

```typescript
const { error: updateTxError } = await supabaseAdmin
  .from('payment_transactions')
  .update({
    status: 'confirmed',
    confirmed_at: new Date(),
    confirmed_by: session.user.id,  // ID del admin
    admin_notes: admin_notes,
    updated_at: new Date()
  })
  .eq('id', transaction_id);

if (updateTxError) {
  console.error('[VERIFY_UPDATE_TX_ERROR]', updateTxError);
  return res.status(500).json({ 
    success: false, 
    error: 'Error al actualizar transacción' 
  });
}
```

---

**Paso 3: Actualizar orden (con service role)**

```typescript
const { error: updateOrderError } = await supabaseAdmin
  .from('orders')
  .update({
    payment_status: 'paid',
    status: 'confirmed',  // O el equivalente actual (puede ser 'processing', 'pending_shipment', etc.)
    updated_at: new Date()
  })
  .eq('id', order.id);

if (updateOrderError) {
  console.error('[VERIFY_UPDATE_ORDER_ERROR]', updateOrderError);
  // Rollback transaction status
  await supabaseAdmin
    .from('payment_transactions')
    .update({ status: 'proof_uploaded' })
    .eq('id', transaction_id);
  
  return res.status(500).json({ 
    success: false, 
    error: 'Error al actualizar orden' 
  });
}
```

---

**Paso 4: Actualizar producto a 'sold' (con service role)**

```typescript
const { error: updateProductError } = await supabaseAdmin
  .from('products')
  .update({
    status: 'sold',
    updated_at: new Date()
  })
  .eq('id', order.product_id);

if (updateProductError) {
  console.error('[VERIFY_UPDATE_PRODUCT_ERROR]', updateProductError);
  // No rollback — admin puede marcar sold manualmente después
}
```

---

**Paso 5: Generar tracking_token si no existe (con service role)**

**Si el flujo actual requiere `tracking_token` para tracking público de órdenes:**

```typescript
if (!order.tracking_token) {
  const tracking_token = crypto.randomBytes(16).toString('hex');
  
  await supabaseAdmin
    .from('orders')
    .update({ tracking_token: tracking_token })
    .eq('id', order.id);
}
```

**Si no aplica:** Omitir este paso.

---

**Paso 6: NO tocar shipping_status**

**⚠️ IMPORTANTE:** NO cambiar `order.shipping_status` en este endpoint.

- Mantener `shipping_status = null` o `'pending'`
- Admin debe marcar envío después desde panel de envíos existente

---

**Paso 7: Retornar response**

---

### 4.5 Lógica (Rechazar)

**Si action = 'reject':**

**Paso 1: Validar rejection_reason**

```typescript
if (!rejection_reason || rejection_reason.trim() === '') {
  return res.status(400).json({ 
    success: false, 
    error: 'Motivo de rechazo es requerido' 
  });
}
```

---

**Paso 2: Actualizar payment_transaction (con service role)**

```typescript
const { error: updateTxError } = await supabaseAdmin
  .from('payment_transactions')
  .update({
    status: 'rejected',
    rejected_at: new Date(),
    rejected_by: session.user.id,
    rejection_reason: rejection_reason.trim(),
    admin_notes: admin_notes,
    updated_at: new Date()
  })
  .eq('id', transaction_id);

if (updateTxError) {
  console.error('[VERIFY_REJECT_TX_ERROR]', updateTxError);
  return res.status(500).json({ 
    success: false, 
    error: 'Error al rechazar transacción' 
  });
}
```

---

**Paso 3: NO actualizar orden**

**La orden debe seguir con `payment_status = 'pending'` para permitir que cliente reintente.**

---

**Paso 4: Producto vuelve a 'available' (si estaba 'reserved')**

**Solo si producto estaba marcado como `reserved` temporalmente:**

```typescript
const { data: product } = await supabase
  .from('products')
  .select('status')
  .eq('id', order.product_id)
  .single();

if (product && product.status === 'reserved') {
  await supabaseAdmin
    .from('products')
    .update({
      status: 'available',
      updated_at: new Date()
    })
    .eq('id', order.product_id);
}
```

**Si producto se dejó `available` desde el inicio:** No hacer nada.

---

**Paso 5: Retornar response**

---

### 4.6 Response

**Success (200 OK):**

```typescript
{
  success: true,
  action: 'approve' | 'reject';
  transaction_id: string;
  payment_reference: string;
  new_status: 'confirmed' | 'rejected';
  message: string;
}
```

**Ejemplos:**

**Aprobar:**
```json
{
  "success": true,
  "action": "approve",
  "transaction_id": "660f9511-f30c-52e5-b827-557766551111",
  "payment_reference": "BAG-MXN-1715034567890-A7C2F9",
  "new_status": "confirmed",
  "message": "Pago aprobado exitosamente. Orden marcada como pagada."
}
```

**Rechazar:**
```json
{
  "success": true,
  "action": "reject",
  "transaction_id": "660f9511-f30c-52e5-b827-557766551111",
  "payment_reference": "BAG-MXN-1715034567890-A7C2F9",
  "new_status": "rejected",
  "message": "Pago rechazado. Cliente puede reintentar subiendo nuevo comprobante."
}
```

---

**Error (400/403/404/500):**

```typescript
{
  success: false,
  error: string;
  code?: string;
}
```

**Códigos de error:**
- `not_admin` (usuario no es admin)
- `transaction_not_found`
- `invalid_status` (status no permite verificación)
- `missing_rejection_reason`
- `server_error`

---

### 4.7 Logging (Seguro)

```typescript
// Aprobar
console.log('[VERIFY_PAYMENT_APPROVE]', {
  timestamp: new Date().toISOString(),
  transaction_id: transaction_id,
  payment_reference: transaction.payment_reference,
  order_id: order.id,
  admin_id: session.user.id,
  amount_mxn: transaction.amount_mxn
});

// Rechazar
console.log('[VERIFY_PAYMENT_REJECT]', {
  timestamp: new Date().toISOString(),
  transaction_id: transaction_id,
  payment_reference: transaction.payment_reference,
  order_id: order.id,
  admin_id: session.user.id,
  rejection_reason: rejection_reason.substring(0, 50) // Primeros 50 chars
});
```

---

## 5. ENDPOINT: GET BANK CONFIG (SEGURO)

### 5.1 Especificación

**Path:** `GET /api/payments/bank-transfer/config`

**Auth:** Authenticated user

**Query params:**
```
?order_id=<uuid>
o
?transaction_id=<uuid>
```

**Propósito:** Devolver datos bancarios **solo si el usuario es dueño** de una orden/transacción válida

**⚠️ NO debe ser público sin contexto** — No mostrar CLABE de forma global sin orden creada.

---

### 5.2 Validaciones

- ✅ Al menos un parámetro (`order_id` o `transaction_id`) es requerido
- ✅ Usuario autenticado
- ✅ Orden/transacción existe
- ✅ Usuario es dueño (order.user_id = session.user.id o order.customer_email = session.user.email)
- ✅ Transacción status = 'pending' o 'rejected' (permitir re-consulta si rechazado)

---

### 5.3 Lógica

```typescript
// Si viene order_id
if (order_id) {
  const { data: order } = await supabase
    .from('orders')
    .select('user_id, customer_email, payment_reference')
    .eq('id', order_id)
    .single();
  
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  
  const isOwner = order.user_id 
    ? order.user_id === session.user.id 
    : order.customer_email === session.user.email;
  
  if (!isOwner) return res.status(403).json({ error: 'No autorizado' });
  
  // Devolver bank_details
}

// Si viene transaction_id (lógica similar via join con orders)
```

---

### 5.4 Response

**Success (200):**
```typescript
{
  success: true,
  bank_details: {
    bank_name: "Banorte",
    account_holder: "BAG CLUE SA DE CV",
    clabe: "xxxxxxxxxxxxxxxxxxx",
    account_number?: string,
    instructions?: string
  },
  payment_reference: string,
  amount_mxn: number,
  expires_at: string
}
```

**Error (400/403/404):**
```typescript
{
  success: false,
  error: string
}
```

---

## 6. EMAILS (NO IMPLEMENTAR EN MVP.2A)

**Decisión:** NO implementar emails transaccionales en MVP.2A, salvo que sea muy pequeño y no arriesgue.

**Emails quedan para MVP.2B o MVP.3:**
1. Instrucciones transferencia (post-crear orden)
2. Comprobante recibido (post-upload)
3. Pago confirmado (post-aprobar)
4. Pago rechazado (post-rechazar)

**En MVP.2A:** Solo dejar **puntos de integración** comentados en código.

**Ejemplo:**
```typescript
// En POST /api/payments/bank-transfer/order (después de crear orden)
// TODO MVP.2B: Enviar email instrucciones transferencia
// await sendEmail({
//   to: customer_email,
//   template: 'bank-transfer-instructions',
//   data: { order_id, payment_reference, bank_details, expires_at }
// });
```

---

## 7. NO IMPLEMENTAR TODAVÍA

**Lista explícita de lo que NO hacer en MVP.2A:**

❌ Layaway bank transfer  
❌ Layaway installments  
❌ Stripe USD (ya existe, no tocar)  
❌ Exchange rate logic  
❌ Frontend checkout selector completo  
❌ UI admin nueva (usar Supabase Dashboard interim)  
❌ Customer panel UI nueva  
❌ Emails si complica  
❌ Auto-expiry/cancel cron  
❌ Rate limit avanzado si complica  

**MVP.2A es SOLO backend APIs** — sin UI pública completa.

---

## 8. NO TOCAR (GARANTÍAS NO-REGRESIÓN)

**Lista explícita de lo que NO modificar:**

❌ Stripe live keys  
❌ Webhook Stripe actual (`/api/stripe/webhook`)  
❌ Checkout Stripe actual (`/api/stripe/checkout`)  
❌ DB schema/migrations (MVP.1 ya preparó DB)  
❌ RLS policies existentes  
❌ Diseño web (estilos, componentes visuales)  
❌ Inventario (lógica productos)  
❌ Admin envíos (`/admin/envios`)  
❌ Customer panel existente (`/account/*`)  

**Razón:** MVP.2A solo agrega backend APIs nuevos. Stripe y UI actuales siguen funcionando igual.

---

## 9. TESTING MVP.2A

### 9.1 Tests Mínimos (15 total)

**Tests Backend (API):**

1. ✅ **Crear bank transfer order** para producto test
   - Validar orden creada con payment_status = 'pending'

2. ✅ **Verificar payment_transaction creada**
   - Validar status = 'pending'

3. ✅ **Verificar payment_reference única**
   - Formato BAG-MXN-{timestamp}-{random}

4. ✅ **Verificar datos bancarios devueltos**
   - Response incluye bank_name, account_holder, clabe
   - NO loggear CLABE en logs

5. ✅ **Subir comprobante JPG**
   - Archivo válido → status = 'proof_uploaded'

6. ✅ **Subir comprobante PNG**
   - Archivo válido → upload exitoso

7. ✅ **Subir comprobante PDF**
   - Archivo válido → upload exitoso

8. ✅ **Admin aprueba pago**
   - Transaction → confirmed
   - Order → paid
   - Producto → sold

9. ✅ **Verificar orden paid después de aprobar**

10. ✅ **Verificar producto sold después de aprobar**

11. ✅ **Admin rechaza pago** (test separado)
    - Transaction → rejected
    - Guardar rejection_reason

12. ✅ **Verificar rechazo y reason**
    - Orden sigue pending
    - Producto vuelve available (si estaba reserved)

**Tests No-Regresión:**

13. ✅ **Stripe checkout actual sigue funcionando**
    - Crear orden con Stripe → sin errores

14. ✅ **Catálogo sigue funcionando**
    - Página /catalogo carga correctamente
    - Productos aparecen normal

15. ✅ **No secretos en logs**
    - Revisar logs Vercel
    - Verificar CLABE NO aparece

---

### 9.2 Testing Manual (Paso a Paso)

**Herramientas:**
- Postman/Thunder Client/curl
- Supabase Dashboard (para verificar DB)
- Vercel Logs (para revisar logs)

**Flujo completo:**

1. **Setup:** Configurar variables entorno Vercel
2. **Test crear orden:** POST /api/payments/bank-transfer/order
3. **Verificar DB:** Orden + transaction creadas
4. **Test config:** GET /api/payments/bank-transfer/config?order_id=...
5. **Test upload:** POST /api/payments/bank-transfer/upload-proof
6. **Verificar storage:** Archivo subido a bucket
7. **Test aprobar:** POST /api/payments/admin/verify (action=approve)
8. **Verificar DB:** Orden paid, producto sold
9. **Test rechazar:** POST /api/payments/admin/verify (action=reject) en otra orden
10. **Test Stripe:** Crear orden Stripe normal → funciona
11. **Test catálogo:** Abrir /catalogo → carga normal
12. **Revisar logs:** No CLABE, no datos sensibles

---

## 10. DECISIÓN PENDIENTE: PRODUCTO STATUS 'RESERVED'

### 5.1 Pregunta Crítica

**¿El sistema actual de Bagclue soporta `product.status = 'reserved'` sin romper catálogo/checkout?**

---

### 5.2 Validación Necesaria (Antes de Implementar)

**1. Verificar valores actuales de status en DB:**

```sql
SELECT DISTINCT status FROM products;
```

**Resultado esperado:** Verificar si ya existe `'reserved'` o valores similares.

---

**2. Revisar query de productos en catálogo:**

**Archivo:** `src/app/catalogo/page.tsx` (o equivalente)

**Buscar:**
```typescript
.eq('status', 'available')
// o
.in('status', ['available', ...])
```

**Si query filtra solo `available`:** Sistema ya soporta `reserved` (productos reserved NO aparecen en catálogo) ✅

**Si query NO filtra por status:** Productos `reserved` aparecerán en catálogo ❌ (requiere fix)

---

**3. Revisar query de productos en checkout:**

**Archivo:** Endpoint que valida producto al crear orden Stripe (si existe)

**Buscar validación de status:**
```typescript
if (product.status !== 'available') { ... }
```

**Si existe validación:** Sistema soporta `reserved` ✅

**Si NO existe validación:** Requiere agregar check ❌

---

### 5.3 Decisión

**Opción A (Preferida por Jhonatan):** Marcar `reserved` temporalmente

**Requiere:**
- ✅ Catálogo filtre solo `available` (excluir `reserved`)
- ✅ Checkout valide `status = 'available'` antes de crear orden
- ✅ Al aprobar pago → `reserved` → `sold`
- ✅ Al rechazar pago → `reserved` → `available`
- ✅ Al expirar pago (24h) → `reserved` → `available` (cron futuro)

**Opción B (Fallback):** Dejar `available` hasta pago confirmado

**Requiere:**
- ❌ Riesgo: Otro cliente podría comprar antes de confirmar pago
- ❌ No recomendado

---

### 5.4 Acción Requerida

**Antes de implementar endpoint crear orden:**

1. Ejecutar query `SELECT DISTINCT status FROM products;`
2. Revisar `src/app/catalogo/page.tsx` → query de productos
3. Reportar hallazgos a Jhonatan
4. Confirmar Opción A o B
5. Implementar lógica según decisión

---

## 11. ENTREGA REQUERIDA ANTES DE IMPLEMENTAR

**Antes de escribir código, Kepler debe confirmar y reportar:**

### 11.1 Validación: Status 'Reserved'

**Verificar:**
```sql
-- 1. ¿Qué valores de status existen actualmente?
SELECT DISTINCT status FROM products;

-- 2. ¿Hay productos con status = 'reserved'?
SELECT COUNT(*) FROM products WHERE status = 'reserved';
```

**Revisar código:**
- `src/app/catalogo/page.tsx` → query de productos (¿filtra por status?)
- Queries de productos en checkout actual

**Reportar:**
- ✅ `reserved` está soportado → Opción A (marcar reserved)
- ❌ `reserved` NO está soportado → Opción B (dejar available)

---

### 11.2 Validación: Patrón Admin Auth

**Revisar endpoint admin existente:**
- `src/app/api/admin/*` (cualquier endpoint admin actual)

**Identificar patrón:**
```typescript
// Ejemplo común:
const session = await getServerSession(authOptions);
if (!session || session.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}

// O con Supabase:
const { data: user } = await supabase.auth.getUser();
if (user?.user_metadata?.role !== 'admin') { ... }
```

**Reportar:**
- Patrón exacto usado en admin actual
- Archivo de referencia

---

### 11.3 Validación: Patrón Customer Auth/Ownership

**Revisar endpoint customer existente:**
- `src/app/api/account/orders/[id]/route.ts` (o similar)

**Identificar patrón ownership:**
```typescript
// Ejemplo:
const session = await getServerSession();
const order = await supabase.from('orders').select('*').eq('id', order_id).single();

if (order.user_id !== session.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Reportar:**
- Patrón exacto usado
- ¿Soporta guest (sin user_id)?
- ¿Valida por email si guest?

---

### 11.4 Validación: Rutas/API Exactas a Crear

**Confirmar estructura:**
```
src/app/api/payments/
  └── bank-transfer/
      ├── order/
      │   └── route.ts          // POST crear orden
      ├── upload-proof/
      │   └── route.ts          // POST subir comprobante
      └── config/
          └── route.ts          // GET datos bancarios

src/app/api/payments/
  └── admin/
      └── verify/
          └── route.ts          // POST aprobar/rechazar
```

**¿Es correcto o prefieres otra estructura?**

---

### 11.5 Archivos a Modificar

**Nuevos (crear):**
1. `src/app/api/payments/bank-transfer/order/route.ts`
2. `src/app/api/payments/bank-transfer/upload-proof/route.ts`
3. `src/app/api/payments/bank-transfer/config/route.ts`
4. `src/app/api/payments/admin/verify/route.ts`
5. `src/lib/bank-config.ts`
6. `src/lib/payment-utils.ts`
7. `src/types/payments.ts` (opcional)

**Modificados (si necesario):**
- Ninguno (todo es código nuevo)

**NO tocar:**
- `src/app/api/stripe/*` (webhook, checkout)
- `src/app/catalogo/*` (UI catálogo)
- `src/app/admin/*` (UI admin)
- `src/app/account/*` (UI customer)
- `src/components/*` (componentes UI)
- Migrations, RLS, DB schema

---

### 11.6 Riesgos Finales

**Riesgo 1:** Producto 'reserved' rompe catálogo
- **Mitigación:** Validar queries ANTES de implementar (punto 11.1)

**Riesgo 2:** CLABE filtrada en logs
- **Mitigación:** Logs seguros (solo eventos, no datos), validación post-deploy

**Riesgo 3:** Upload comprobante sin ownership
- **Mitigación:** Validación ownership estricta (punto 11.3)

**Riesgo 4:** Admin verify sin auth correcta
- **Mitigación:** Usar patrón admin existente (punto 11.2)

**Riesgo 5:** Stripe regresión
- **Mitigación:** NO tocar archivos Stripe, testing post-deploy

---

### 11.7 Checklist Pre-Implementación

**Antes de escribir código:**

- [ ] Ejecutar query `SELECT DISTINCT status FROM products`
- [ ] Revisar `src/app/catalogo/page.tsx` (query productos)
- [ ] Identificar patrón admin auth (archivo de referencia)
- [ ] Identificar patrón customer auth/ownership (archivo de referencia)
- [ ] Confirmar estructura rutas API
- [ ] Reportar hallazgos a Jhonatan
- [ ] Recibir confirmación final
- [ ] Configurar variables entorno Vercel (BANK_*)

**Después de confirmación:**

- [ ] Implementar 4 endpoints
- [ ] Implementar helpers
- [ ] Testing manual (15 tests)
- [ ] Deploy a producción
- [ ] Monitoring logs (2-4 horas)
- [ ] Documentación final

---

## 12. ENTREGABLES MVP.2A

### 12.1 Código (API Routes)

**Crear 3 archivos nuevos:**

1. `src/app/api/payments/bank-transfer/order/route.ts`
   - POST handler para crear orden transferencia MXN
   - ~200-250 líneas

2. `src/app/api/payments/bank-transfer/upload-proof/route.ts`
   - POST handler para subir comprobante
   - ~150-200 líneas

3. `src/app/api/payments/admin/verify/route.ts`
   - POST handler para aprobar/rechazar pago
   - ~200-250 líneas

---

### 12.2 Helpers/Utils

**Crear/actualizar:**

4. `src/lib/bank-config.ts`
   - Función `getBankDetails()` para leer env vars
   - ~20-30 líneas

5. `src/lib/payment-utils.ts`
   - `generatePaymentReference()` → string único
   - `generateFileHash(file)` → SHA256
   - Validaciones compartidas
   - ~50-80 líneas

6. `src/lib/supabase-admin.ts`
   - Ya existe, reutilizar para service role

---

### 12.3 Types

7. `src/types/payments.ts` (opcional pero recomendado)
   - Tipos TypeScript para payloads/responses
   - ~50-100 líneas

---

### 12.4 Variables de Entorno

**Agregar en Vercel Production:**

```bash
BANK_NAME=Banorte
BANK_ACCOUNT_HOLDER=BAG CLUE SA DE CV
BANK_CLABE=<valor confidencial>
BANK_ACCOUNT_NUMBER=<opcional>
BANK_PAYMENT_INSTRUCTIONS=<opcional>
```

---

### 12.5 Documentación (Post-Implementación)

8. `PAYMENTS_MVP2A_IMPLEMENTATION_REPORT.md`
   - Reporte de ejecución
   - Tests realizados
   - Resultado final

9. `PAYMENTS_MVP2A_API_DOCS.md`
   - Documentación completa de los 4 endpoints
   - Ejemplos de request/response
   - Códigos de error

---

## 13. CRITERIOS DE CIERRE MVP.2A

### 13.1 Funcionalidad Completa

**Test 1: Crear orden transferencia MXN**
- ✅ Producto available → orden creada, transaction pending
- ✅ Response incluye bank_details con CLABE

**Test 2: Crear orden - producto no disponible**
- ❌ Producto sold → error 400

**Test 3: Crear orden - producto no publicado**
- ❌ Producto is_published = false → error 400

**Test 4: Upload comprobante válido (JPG)**
- ✅ Archivo JPG 2MB → upload exitoso, status proof_uploaded

**Test 5: Upload comprobante válido (PDF)**
- ✅ Archivo PDF 4MB → upload exitoso

**Test 6: Upload comprobante - archivo muy grande**
- ❌ Archivo 6MB → error 400 file_too_large

**Test 7: Upload comprobante - tipo inválido**
- ❌ Archivo .docx → error 400 invalid_file_type

**Test 8: Upload comprobante - duplicado**
- ❌ Mismo hash SHA256 → error 400 duplicate_proof

**Test 9: Admin aprobar pago**
- ✅ Transaction proof_uploaded → confirmed, orden paid, producto sold

**Test 10: Admin rechazar pago**
- ✅ Transaction proof_uploaded → rejected, orden pending, producto available

---

### 7.2 Validación de No-Regresión

**Test 11: Checkout Stripe sigue funcionando**
- ✅ Crear orden con Stripe → funciona igual que antes
- ✅ No hay errores en logs

**Test 12: Admin panel funciona**
- ✅ Panel admin carga correctamente
- ✅ Órdenes Stripe aparecen normal

---

## 8. CRITERIOS DE CIERRE MVP.2A

### 8.1 Funcionalidad Completa

- [ ] Endpoint POST /order funciona (crear orden transferencia MXN)
- [ ] Endpoint POST /upload-proof funciona (subir comprobante)
- [ ] Endpoint POST /admin/verify funciona (aprobar/rechazar)
- [ ] Variables entorno configuradas en Vercel
- [ ] Service role usado correctamente
- [ ] Ownership validado en upload
- [ ] Archivos suben a bucket storage
- [ ] Hash SHA256 generado y guardado
- [ ] Duplicados detectados
- [ ] Status transiciones correctas (pending → proof_uploaded → confirmed/rejected)
- [ ] Productos cambian status correctamente (available/reserved → sold)
- [ ] Datos bancarios NO en código/logs
- [ ] Decisión producto 'reserved' confirmada e implementada

### 8.2 Testing

- [ ] 12 tests manuales PASS
- [ ] Checkout Stripe sigue funcionando
- [ ] Build pasa sin errores
- [ ] No hay errores en logs

### 8.3 Documentación

- [ ] Implementation report entregado
- [ ] API docs entregado

### 8.4 Seguridad

- [ ] CLABE NO en código/repo/logs
- [ ] Service role NO expuesto
- [ ] Ownership validado
- [ ] Logs seguros

---

## 9. TIMELINE ESTIMADO

### 9.1 Desarrollo (5-6 días)

**Día 1:** Setup + validación producto 'reserved'
- Verificar status en DB
- Revisar queries catálogo/checkout
- Decidir Opción A o B
- Crear estructura carpetas API routes
- Variables entorno Vercel

**Día 2-3:** Endpoint crear orden
- Implementar POST /order
- Validaciones producto
- Lógica crear order + transaction
- Actualizar producto (reserved o available)
- Helpers (generatePaymentReference, getBankDetails)

**Día 4:** Endpoint upload comprobante
- Implementar POST /upload-proof
- Validaciones archivo
- Upload storage
- Hash SHA256
- Detectar duplicados

**Día 5:** Endpoint admin verify
- Implementar POST /admin/verify
- Lógica aprobar (transaction → confirmed, order → paid, producto → sold)
- Lógica rechazar (transaction → rejected, producto → available)
- Generar tracking_token si aplica

**Día 6:** Testing + fixes
- 12 tests manuales
- Fix bugs encontrados
- Refinamientos

### 9.2 QA (2 días)

**Día 7:** Testing exhaustivo
- Crear órdenes transferencia
- Upload comprobantes (JPG/PNG/PDF)
- Aprobar/rechazar pagos
- Validar status productos
- Validar no-regresión Stripe

**Día 8:** Deploy + monitoring
- Deploy a producción
- Monitoring logs 2-4 horas
- Documentación final

### 9.3 Total Estimado

**Desarrollo:** 5-6 días  
**QA:** 2 días  
**Total:** ~1 semana (7-8 días)

---

## 10. RIESGOS Y MITIGACIONES

### 10.1 Riesgos Identificados

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| **R1:** CLABE filtrada en logs | Media | Crítico | Logs seguros, NO loggear datos bancarios |
| **R2:** Usuario sube comprobante falso | Alta | Alto | Admin verifica manualmente, hash detecta duplicados |
| **R3:** Producto 'reserved' rompe catálogo | Baja | Alto | Validar queries catálogo antes de implementar |
| **R4:** Usuario sube archivo muy grande | Media | Bajo | Límite 5MB, validación pre-upload |
| **R5:** Transacción expira pero producto sigue reserved | Media | Medio | Cron auto-expira en MVP.2B, admin manual interim |
| **R6:** Admin aprueba sin verificar comprobante | Media | Alto | UI admin debe mostrar comprobante (MVP.2C) |

### 10.2 Mitigaciones Críticas

**R1 - CLABE filtrada:**
- ✅ Env variables (NO hardcodear)
- ✅ Logs seguros (solo eventos, no datos)
- ✅ Ownership validation antes de devolver

**R3 - Producto 'reserved':**
- ✅ Validar queries ANTES de implementar
- ✅ Si rompe, usar Opción B (dejar available)

**R5 - Expiración:**
- ✅ expires_at guardado en DB
- 📋 Cron auto-expira (MVP.2B)
- 📋 Admin puede cancelar manual (Supabase Dashboard)

---

## 11. NO INCLUIDO EN MVP.2A (Futuras Fases)

**MVP.2B (futuro):**
- Apartados (layaways)
- Abonos/cuotas
- Cron auto-expiración (24h)

**MVP.2C (futuro):**
- UI admin dedicado (panel verificación pagos)
- Mostrar comprobante antes de aprobar

**MVP.2D (futuro):**
- UI pública checkout (selector método pago)
- Página instrucciones transferencia
- Upload comprobante desde customer panel

**MVP.2E (futuro):**
- Emails transaccionales (instrucciones, confirmación, rechazo)

**MVP.3 (futuro):**
- Stripe USD paralelo
- Rate limiting
- Analytics

---

## 12. CONCLUSIÓN

**PAYMENTS MVP.2A está listo para implementación.**

**Alcance reducido y seguro:**
- ✅ Solo full purchase MXN (sin apartados)
- ✅ 3 endpoints backend (crear orden, upload, verify)
- ✅ Configuración bancaria segura
- ✅ Testing manual exhaustivo
- ✅ Cero impacto en Stripe/UI actual

**Decisión pendiente:**
- ⚠️ Confirmar soporte de `product.status = 'reserved'` antes de implementar

**Próximo paso:** Jhonatan autoriza ejecutar implementación → proceder con desarrollo.

---

**Autor:** Kepler  
**Fecha:** 2026-05-06  
**Versión:** 1.0  
**Status:** 📋 SCOPE PREPARADO (awaiting approval + decisión producto 'reserved')
