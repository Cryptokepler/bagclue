# PAYMENTS MVP.2 — BACKEND CORE / APIs BANK TRANSFER

**Fecha:** 2026-05-06  
**Autor:** Kepler  
**Estado:** 📋 SCOPE PREPARADO (awaiting approval - NO implementar todavía)  
**Objetivo:** Crear APIs server-side para pagos por transferencia MXN + upload comprobante, **sin tocar UI pública todavía**.

---

## RESUMEN EJECUTIVO

**Fase anterior:** PAYMENTS MVP.1 — DB SCHEMA ✅ CERRADA (base de datos lista)

**Fase actual:** PAYMENTS MVP.2 — BACKEND CORE (APIs para transferencia bancaria)

**Objetivo:** Habilitar backend completo para:
- Crear transacciones de pago bancario (orders + layaways)
- Upload de comprobantes por clientes
- Verificación admin (aprobar/rechazar)
- Configuración bancaria segura
- Puntos de integración para emails (no implementar todavía)

**Alcance:** **SOLO BACKEND** — No tocar UI pública, checkout, admin panel, ni Stripe

**Resultado esperado:** APIs funcionales que permitan crear pagos por transferencia y validar comprobantes, listas para integrar UI en MVP.3 (futuro).

---

## 1. CREAR TRANSACCIÓN BANCARIA PARA ORDER (Full Purchase)

### 1.1 Endpoint Propuesto

**Path:** `POST /api/payments/bank-transfer/order`

**Auth:** Authenticated user (session/JWT)

**Propósito:** Crear una orden con método de pago transferencia bancaria MXN

---

### 1.2 Payload

```typescript
{
  product_id: string;           // UUID del producto
  customer_name: string;        // Nombre completo cliente
  customer_email: string;       // Email cliente
  customer_phone: string;       // Teléfono cliente
  shipping_address?: {          // Opcional si cliente ya tiene dirección guardada
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}
```

**Validaciones payload:**
- ✅ `product_id` existe en DB y está `available`
- ✅ `customer_email` formato válido
- ✅ `customer_phone` no vacío
- ✅ Si usuario autenticado, validar ownership/session
- ✅ Si `shipping_address` presente, validar campos requeridos

---

### 1.3 Lógica del Endpoint

**Flujo:**

1. **Validar producto disponible:**
   ```sql
   SELECT id, price, status FROM products WHERE id = :product_id AND status = 'available'
   ```
   - Si no existe o status ≠ 'available' → error 400

2. **Calcular montos:**
   ```typescript
   const total_mxn = product.price;
   const exchange_rate = null; // MXN no necesita conversión
   ```

3. **Generar payment_reference único:**
   ```typescript
   const payment_reference = `BAG-MXN-${Date.now()}-${randomString(6)}`;
   // Ejemplo: BAG-MXN-1715034567890-A7C2F9
   ```

4. **Calcular expires_at (24 horas):**
   ```typescript
   const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
   ```

5. **Crear orden (con service role):**
   ```typescript
   const order = await supabase.from('orders').insert({
     user_id: session.user.id,           // Si autenticado
     product_id: product_id,
     customer_name: customer_name,
     customer_email: customer_email,
     customer_phone: customer_phone,
     shipping_address: shipping_address, // JSON
     total: total_mxn,
     payment_status: 'pending',
     shipping_status: null,
     payment_method: 'bank_transfer_mxn',
     payment_currency: 'MXN',
     payment_reference: payment_reference,
     amount_mxn: total_mxn,
     payment_expires_at: expires_at
   });
   ```

6. **Crear payment_transaction (con service role):**
   ```typescript
   const transaction = await supabase.from('payment_transactions').insert({
     order_id: order.id,
     payment_type: 'full_purchase',
     payment_method: 'bank_transfer_mxn',
     currency: 'MXN',
     amount: total_mxn,
     amount_mxn: total_mxn,
     status: 'pending',
     payment_reference: payment_reference,
     expires_at: expires_at
   });
   ```

7. **Marcar producto como reserved (temporal 24h):**
   ```typescript
   await supabase.from('products').update({
     status: 'reserved'  // Temporal hasta que expire o se confirme
   }).eq('id', product_id);
   ```

8. **Retornar respuesta:**

---

### 1.4 Response

**Success (201 Created):**
```typescript
{
  success: true,
  order_id: string;              // UUID de la orden
  payment_reference: string;     // BAG-MXN-...
  total_mxn: number;             // Monto a transferir
  expires_at: string;            // ISO timestamp (24h)
  bank_details: {                // Datos bancarios (ver sección 5)
    bank: string;                // "Banorte"
    beneficiary: string;         // "BAG CLUE SA DE CV"
    clabe: string;               // CLABE proporcionada
    reference: string;           // payment_reference (para que cliente lo ponga)
  }
}
```

**Error (400/500):**
```typescript
{
  success: false,
  error: string;                 // Mensaje descriptivo
  code?: string;                 // Código error (product_not_available, invalid_payload, etc.)
}
```

---

### 1.5 Validaciones

**Pre-creación:**
- ✅ Usuario autenticado (session válida)
- ✅ Producto existe y está `available`
- ✅ Email formato válido
- ✅ Teléfono no vacío
- ✅ `payment_reference` único (constraint DB lo valida)

**Post-creación:**
- ✅ Orden creada con `payment_status = pending`
- ✅ Transacción creada con `status = pending`
- ✅ Producto marcado como `reserved`
- ✅ `expires_at` configurado a NOW() + 24h

**Auto-expiración (cron futuro - no en MVP.2):**
- Después de 24h sin comprobante → status `expired`, producto vuelve a `available`

---

### 1.6 Relación con Orders

**Columnas populadas:**
- `payment_method` → `'bank_transfer_mxn'`
- `payment_currency` → `'MXN'`
- `payment_reference` → generado único
- `amount_mxn` → total en MXN
- `payment_expires_at` → NOW() + 24h
- `payment_status` → `'pending'`

**Columnas NO populadas (todavía):**
- `exchange_rate` → NULL (MXN no necesita conversión)
- `amount_usd` → NULL

---

## 2. CREAR TRANSACCIÓN BANCARIA PARA LAYAWAY/LAYAWAY_PAYMENT

### 2.1 Endpoint Propuesto (Depósito Inicial)

**Path:** `POST /api/payments/bank-transfer/layaway/deposit`

**Auth:** Authenticated user

**Propósito:** Crear apartado con depósito inicial por transferencia bancaria MXN

---

### 2.2 Payload (Depósito Inicial)

```typescript
{
  product_id: string;           // UUID del producto
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  deposit_amount: number;       // Monto del depósito inicial (e.g., 30% del total)
  installments: number;         // Número de pagos (2-4)
  shipping_address?: {...};     // Opcional
}
```

**Validaciones:**
- ✅ `deposit_amount` >= 30% del precio producto
- ✅ `installments` entre 2 y 4
- ✅ Producto `available`

---

### 2.3 Lógica (Depósito Inicial)

**Flujo:**

1. **Validar producto y montos:**
   ```typescript
   const product = await getProduct(product_id);
   if (product.status !== 'available') throw error;
   if (!product.allow_layaway) throw error;
   
   const min_deposit = product.price * 0.30;
   if (deposit_amount < min_deposit) throw error;
   ```

2. **Generar payment_reference:**
   ```typescript
   const payment_reference = `BAG-LAY-${Date.now()}-${randomString(6)}`;
   ```

3. **Crear orden + layaway:**
   ```typescript
   const order = await supabase.from('orders').insert({
     user_id: session.user.id,
     product_id: product_id,
     total: product.price,
     payment_status: 'pending',
     payment_method: 'bank_transfer_mxn',
     payment_currency: 'MXN',
     amount_mxn: product.price,
     payment_reference: payment_reference,
     payment_expires_at: NOW() + 24h
   });
   
   const layaway = await supabase.from('layaways').insert({
     order_id: order.id,
     product_id: product_id,
     user_id: session.user.id,
     total_price: product.price,
     deposit_amount: deposit_amount,
     remaining_balance: product.price - deposit_amount,
     installments: installments,
     status: 'pending',
     payment_method: 'bank_transfer_mxn',
     payment_currency: 'MXN'
   });
   ```

4. **Crear payment_transaction (para el depósito):**
   ```typescript
   const transaction = await supabase.from('payment_transactions').insert({
     order_id: order.id,
     layaway_id: layaway.id,
     payment_type: 'layaway_deposit',
     payment_method: 'bank_transfer_mxn',
     currency: 'MXN',
     amount: deposit_amount,
     amount_mxn: deposit_amount,
     status: 'pending',
     payment_reference: payment_reference,
     expires_at: NOW() + 24h
   });
   ```

5. **Marcar producto como reserved:**

6. **Retornar respuesta con bank_details**

---

### 2.4 Endpoint Propuesto (Abono/Pago Subsiguiente)

**Path:** `POST /api/payments/bank-transfer/layaway/installment`

**Auth:** Authenticated user (dueño del layaway)

**Propósito:** Crear transacción para un abono adicional al apartado

---

### 2.5 Payload (Abono)

```typescript
{
  layaway_id: string;           // UUID del layaway
  amount: number;               // Monto del abono
}
```

**Validaciones:**
- ✅ Layaway existe y pertenece al usuario autenticado
- ✅ Layaway.status = `'active'` (depósito ya confirmado)
- ✅ `amount` <= `remaining_balance`
- ✅ Layaway usa `payment_method = 'bank_transfer_mxn'` (no mezclar métodos)

---

### 2.6 Lógica (Abono)

**Flujo:**

1. **Validar layaway:**
   ```typescript
   const layaway = await supabase.from('layaways')
     .select('*, orders(*)')
     .eq('id', layaway_id)
     .eq('user_id', session.user.id)
     .single();
   
   if (!layaway) throw error 404;
   if (layaway.status !== 'active') throw error;
   if (layaway.payment_method !== 'bank_transfer_mxn') throw error;
   if (amount > layaway.remaining_balance) throw error;
   ```

2. **Generar payment_reference:**
   ```typescript
   const payment_reference = `BAG-INS-${Date.now()}-${randomString(6)}`;
   ```

3. **Crear layaway_payment:**
   ```typescript
   const layaway_payment = await supabase.from('layaway_payments').insert({
     layaway_id: layaway.id,
     amount: amount,
     payment_status: 'pending',
     payment_method: 'bank_transfer_mxn',
     payment_reference: payment_reference
   });
   ```

4. **Crear payment_transaction:**
   ```typescript
   const transaction = await supabase.from('payment_transactions').insert({
     order_id: layaway.order_id,
     layaway_id: layaway.id,
     layaway_payment_id: layaway_payment.id,
     payment_type: 'layaway_installment',
     payment_method: 'bank_transfer_mxn',
     currency: 'MXN',
     amount: amount,
     amount_mxn: amount,
     status: 'pending',
     payment_reference: payment_reference,
     expires_at: NOW() + 24h
   });
   ```

5. **Retornar respuesta**

---

### 2.7 Response (Depósito + Abono)

**Success (201):**
```typescript
{
  success: true,
  layaway_id?: string;          // Solo si es depósito
  layaway_payment_id?: string;  // Solo si es abono
  payment_reference: string;
  amount_mxn: number;
  expires_at: string;
  bank_details: {...}
}
```

---

### 2.8 Validación: NO Mezclar Métodos

**Regla crítica:** Si un layaway se creó con `payment_method = 'bank_transfer_mxn'`, **TODOS** los pagos subsiguientes (abonos) deben ser también transferencia MXN.

**Validación en endpoint abono:**
```typescript
if (layaway.payment_method !== 'bank_transfer_mxn') {
  throw new Error('Este apartado fue creado con otro método de pago. No puedes mezclar métodos.');
}
```

---

## 3. UPLOAD COMPROBANTE

### 3.1 Endpoint Propuesto

**Path:** `POST /api/payments/bank-transfer/upload-proof`

**Auth:** Authenticated user

**Propósito:** Subir comprobante de transferencia bancaria

---

### 3.2 Payload

**Content-Type:** `multipart/form-data`

```typescript
{
  payment_reference: string;    // Referencia de la transacción (BAG-MXN-...)
  file: File;                   // Archivo (JPG, PNG, PDF)
}
```

**Validaciones:**
- ✅ `payment_reference` existe en `payment_transactions`
- ✅ Transacción pertenece al usuario autenticado (via order.user_id o layaway.user_id)
- ✅ Transacción en status `pending` (no `proof_uploaded`, `confirmed`, etc.)
- ✅ Archivo tipo: `image/jpeg`, `image/png`, `application/pdf`
- ✅ Tamaño máximo: 5MB (5,242,880 bytes)

---

### 3.3 Lógica

**Flujo:**

1. **Validar payment_reference y ownership:**
   ```typescript
   const transaction = await supabase.from('payment_transactions')
     .select('*, orders(user_id), layaways(user_id)')
     .eq('payment_reference', payment_reference)
     .single();
   
   if (!transaction) throw error 404;
   
   const owner_id = transaction.order_id 
     ? transaction.orders.user_id 
     : transaction.layaways.user_id;
   
   if (owner_id !== session.user.id) throw error 403;
   
   if (transaction.status !== 'pending') {
     throw error 400 ('Comprobante ya fue subido o pago ya fue procesado');
   }
   ```

2. **Validar archivo:**
   ```typescript
   const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
   const MAX_SIZE = 5 * 1024 * 1024; // 5MB
   
   if (!ALLOWED_TYPES.includes(file.type)) {
     throw error 400 ('Tipo de archivo no permitido. Solo JPG, PNG o PDF.');
   }
   
   if (file.size > MAX_SIZE) {
     throw error 400 ('Archivo demasiado grande. Máximo 5MB.');
   }
   ```

3. **Generar proof_hash SHA256:**
   ```typescript
   import crypto from 'crypto';
   
   const buffer = await file.arrayBuffer();
   const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
   ```

4. **Verificar duplicado (opcional - best effort):**
   ```typescript
   const duplicate = await supabase.from('payment_transactions')
     .select('id')
     .eq('proof_hash', hash)
     .neq('id', transaction.id)
     .maybeSingle();
   
   if (duplicate) {
     // Log warning pero no bloquear (puede ser legítimo)
     console.warn(`Duplicate proof_hash detected: ${hash}`);
   }
   ```

5. **Subir a storage bucket (con service role):**
   ```typescript
   const fileName = `${session.user.id}/${payment_reference}.${getExtension(file.type)}`;
   
   const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
     .from('bank-payment-proofs')
     .upload(fileName, buffer, {
       contentType: file.type,
       upsert: false  // No sobrescribir si ya existe
     });
   
   if (uploadError) throw error 500;
   
   const proof_url = supabaseAdmin.storage
     .from('bank-payment-proofs')
     .getPublicUrl(fileName).data.publicUrl;
   ```

6. **Actualizar payment_transaction (con service role):**
   ```typescript
   await supabaseAdmin.from('payment_transactions').update({
     status: 'proof_uploaded',
     proof_url: proof_url,
     proof_file_name: file.name,
     proof_file_type: file.type,
     proof_file_size: file.size,
     proof_hash: hash,
     updated_at: NOW()
   }).eq('id', transaction.id);
   ```

7. **Retornar respuesta:**

---

### 3.4 Response

**Success (200):**
```typescript
{
  success: true,
  message: 'Comprobante subido exitosamente. Será revisado por un administrador.',
  payment_reference: string;
  status: 'proof_uploaded'
}
```

**Error (400/403/500):**
```typescript
{
  success: false,
  error: string;
  code?: string;
}
```

---

### 3.5 Rate Limit (Opcional - MVP.2 o MVP.3)

**Si viable implementar:**
- Máximo 3 uploads por hora por usuario/transacción
- Usar Redis o memoria in-process
- Key: `upload_proof:${user_id}:${payment_reference}`

**Implementación sugerida:**
```typescript
const key = `upload_proof:${user_id}:${payment_reference}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 3600); // 1 hora

if (count > 3) {
  throw error 429 ('Demasiados intentos. Intenta de nuevo en 1 hora.');
}
```

**Si complica MVP.2:** Dejar para MVP.3, documentar punto de integración.

---

## 4. ADMIN VERIFY PAYMENT

### 4.1 Endpoint Propuesto (Aprobar)

**Path:** `POST /api/payments/admin/verify`

**Auth:** Admin user (role = 'admin')

**Propósito:** Aprobar o rechazar un pago por transferencia bancaria

---

### 4.2 Payload

```typescript
{
  payment_reference: string;    // Referencia de la transacción
  action: 'approve' | 'reject';
  rejection_reason?: string;    // Requerido si action = 'reject'
  admin_notes?: string;         // Opcional
}
```

**Validaciones:**
- ✅ Usuario es admin (`raw_user_meta_data->>'role' = 'admin'`)
- ✅ `payment_reference` existe
- ✅ Transacción en status `proof_uploaded` (no `pending`, `confirmed`, etc.)
- ✅ Si `action = 'reject'`, `rejection_reason` es requerido

---

### 4.3 Lógica (Aprobar)

**Flujo si action = 'approve':**

1. **Validar transacción:**
   ```typescript
   const transaction = await supabase.from('payment_transactions')
     .select('*, orders(*), layaways(*)')
     .eq('payment_reference', payment_reference)
     .single();
   
   if (!transaction) throw error 404;
   if (transaction.status !== 'proof_uploaded') throw error 400;
   ```

2. **Actualizar payment_transaction:**
   ```typescript
   await supabase.from('payment_transactions').update({
     status: 'confirmed',
     confirmed_at: NOW(),
     confirmed_by: session.user.id,
     admin_notes: admin_notes,
     updated_at: NOW()
   }).eq('id', transaction.id);
   ```

3. **Actualizar orden según payment_type:**

   **Si payment_type = 'full_purchase':**
   ```typescript
   await supabase.from('orders').update({
     payment_status: 'paid',
     updated_at: NOW()
   }).eq('id', transaction.order_id);
   
   await supabase.from('products').update({
     status: 'sold',
     updated_at: NOW()
   }).eq('id', transaction.orders.product_id);
   ```

   **Si payment_type = 'layaway_deposit':**
   ```typescript
   await supabase.from('layaways').update({
     status: 'active',  // Apartado activado
     updated_at: NOW()
   }).eq('id', transaction.layaway_id);
   
   await supabase.from('products').update({
     status: 'reserved',  // Sigue reservado hasta pago completo
     updated_at: NOW()
   }).eq('id', transaction.layaways.product_id);
   ```

   **Si payment_type = 'layaway_installment':**
   ```typescript
   const layaway_payment = await supabase.from('layaway_payments').update({
     payment_status: 'paid',
     updated_at: NOW()
   }).eq('id', transaction.layaway_payment_id).select().single();
   
   // Actualizar remaining_balance del layaway
   const layaway = await supabase.from('layaways')
     .select('remaining_balance')
     .eq('id', transaction.layaway_id)
     .single();
   
   const new_balance = layaway.remaining_balance - transaction.amount;
   
   await supabase.from('layaways').update({
     remaining_balance: new_balance,
     updated_at: NOW()
   }).eq('id', transaction.layaway_id);
   
   // Si balance = 0 → apartado completado
   if (new_balance <= 0) {
     await supabase.from('layaways').update({
       status: 'completed',
       updated_at: NOW()
     }).eq('id', transaction.layaway_id);
     
     await supabase.from('orders').update({
       payment_status: 'paid',
       updated_at: NOW()
     }).eq('id', transaction.order_id);
     
     await supabase.from('products').update({
       status: 'sold',
       updated_at: NOW()
     }).eq('id', transaction.layaways.product_id);
   }
   ```

4. **[Punto integración email]** Enviar email confirmación pago (no implementar en MVP.2)

5. **Retornar respuesta:**

---

### 4.4 Lógica (Rechazar)

**Flujo si action = 'reject':**

1. **Actualizar payment_transaction:**
   ```typescript
   await supabase.from('payment_transactions').update({
     status: 'rejected',
     rejected_at: NOW(),
     rejected_by: session.user.id,
     rejection_reason: rejection_reason,
     admin_notes: admin_notes,
     updated_at: NOW()
   }).eq('id', transaction.id);
   ```

2. **NO cambiar orden ni producto** (cliente puede reintentar upload)

3. **[Punto integración email]** Enviar email rechazo con motivo (no implementar en MVP.2)

4. **Retornar respuesta:**

---

### 4.5 Response

**Success (200):**
```typescript
{
  success: true,
  action: 'approve' | 'reject';
  payment_reference: string;
  new_status: 'confirmed' | 'rejected';
  message: string;
}
```

**Error (400/403/500):**
```typescript
{
  success: false,
  error: string;
  code?: string;
}
```

---

## 5. CONFIGURACIÓN BANCARIA

### 5.1 Datos Bancarios (Confidenciales)

**Información proporcionada por Jhonatan:**
- **Banco:** Banorte
- **Beneficiario:** BAG CLUE SA DE CV
- **CLABE:** [proporcionada por Jhonatan en mensaje privado]

**⚠️ REGLAS DE SEGURIDAD:**
- ❌ **NO hardcodear** en código fuente
- ❌ **NO commitear** en repo
- ❌ **NO imprimir** en logs de aplicación
- ❌ **NO exponer** en responses públicas sin autorización
- ✅ **SÍ guardar** en variables de entorno Vercel (production)
- ✅ **SÍ devolver** solo a clientes con orden válida (authenticated)

---

### 5.2 Variables de Entorno (Vercel Production)

**Agregar en Vercel Dashboard → Settings → Environment Variables:**

```bash
# Datos bancarios Bagclue (NO commitear)
BANK_ACCOUNT_CLABE=xxxxxxxxxxxxxxxxxxx
BANK_ACCOUNT_NAME="BAG CLUE SA DE CV"
BANK_ACCOUNT_BANK="Banorte"
```

**Acceso desde API routes:**
```typescript
const bank_details = {
  bank: process.env.BANK_ACCOUNT_BANK,
  beneficiary: process.env.BANK_ACCOUNT_NAME,
  clabe: process.env.BANK_ACCOUNT_CLABE
};
```

---

### 5.3 Endpoint Seguro para Obtener Datos Bancarios

**Path:** `GET /api/payments/bank-transfer/config`

**Auth:** Authenticated user

**Query params:**
```
?order_id=<uuid>
```
o
```
?payment_reference=<BAG-MXN-...>
```

**Propósito:** Devolver datos bancarios solo si el usuario tiene una orden/transacción válida

---

**Lógica:**

```typescript
// Validar que usuario tiene orden/transacción válida
const transaction = await supabase.from('payment_transactions')
  .select('*, orders(user_id), layaways(user_id)')
  .or(`payment_reference.eq.${payment_reference},order_id.eq.${order_id}`)
  .single();

if (!transaction) throw error 404;

const owner_id = transaction.order_id 
  ? transaction.orders.user_id 
  : transaction.layaways.user_id;

if (owner_id !== session.user.id) throw error 403;

// Si tiene orden válida, devolver datos bancarios
return {
  success: true,
  bank_details: {
    bank: process.env.BANK_ACCOUNT_BANK,
    beneficiary: process.env.BANK_ACCOUNT_NAME,
    clabe: process.env.BANK_ACCOUNT_CLABE,
    reference: transaction.payment_reference  // Para que cliente lo ponga en transferencia
  },
  expires_at: transaction.expires_at
};
```

**Response:**
```typescript
{
  success: true,
  bank_details: {
    bank: "Banorte",
    beneficiary: "BAG CLUE SA DE CV",
    clabe: "xxxxxxxxxxxxxxxxxxx",
    reference: "BAG-MXN-1715034567890-A7C2F9"
  },
  expires_at: "2024-05-08T10:30:00Z"
}
```

---

### 5.4 Logs Seguros

**Nunca loggear:**
```typescript
// ❌ MAL
console.log('Bank details:', bank_details);
console.log('CLABE:', process.env.BANK_ACCOUNT_CLABE);
```

**Loggear solo referencias:**
```typescript
// ✅ BIEN
console.log('Bank config requested for payment_reference:', payment_reference);
console.log('Bank config delivered to user:', session.user.id);
```

---

## 6. SEGURIDAD

### 6.1 Service Role (Supabase)

**Uso obligatorio en:**
- Crear orders/layaways/payment_transactions (bypass RLS)
- Upload comprobante a storage (bucket privado)
- Actualizar status de transacciones (admin verify)
- Actualizar productos (sold/reserved)

**Implementación:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**⚠️ NUNCA exponer service role key en cliente.**

---

### 6.2 RLS No Permite UPDATE Directo de Cliente

**Validación:**
- ✅ Usuarios pueden **SELECT** sus transacciones (policy ya existe)
- ❌ Usuarios **NO pueden UPDATE** payment_transactions directamente
- ✅ Upload comprobante usa API route con service role (bypass RLS)

**Política RLS actual (MVP.1):**
- `Users can view own transactions` (SELECT) ✅
- `Admins can view all transactions` (SELECT) ✅
- `Admins can confirm/reject transactions` (UPDATE) ✅
- NO hay policy UPDATE para usuarios ✅

**Esto está correcto.** Upload usa service role.

---

### 6.3 Validación Ownership

**En TODOS los endpoints que modifican transacciones:**

```typescript
// Validar que usuario es dueño de la orden/layaway
const transaction = await supabase.from('payment_transactions')
  .select('*, orders(user_id), layaways(user_id)')
  .eq('id', transaction_id)
  .single();

const owner_id = transaction.order_id 
  ? transaction.orders.user_id 
  : transaction.layaways.user_id;

if (owner_id !== session.user.id && session.user.role !== 'admin') {
  throw new Error('Forbidden');
}
```

---

### 6.4 Rate Limiting

**Endpoints críticos:**
- `POST /api/payments/bank-transfer/upload-proof` → 3 uploads/hora por usuario
- `POST /api/payments/bank-transfer/order` → 10 órdenes/hora por usuario (anti-spam)
- `POST /api/payments/admin/verify` → Sin límite (admin)

**Implementación sugerida (MVP.2 o MVP.3):**
- Redis con TTL
- O memoria in-process (menos robusto pero más simple)
- O Vercel Edge Config (si disponible)

**Si complica MVP.2:** Documentar punto de integración, implementar en MVP.3.

---

### 6.5 Logs de Auditoría

**Loggear (con timestamps):**
- Creación de órdenes por transferencia
- Upload de comprobantes (user_id, payment_reference, file_size, file_type)
- Aprobaciones/rechazos admin (admin_id, payment_reference, action)
- Errores críticos (upload falló, storage lleno, etc.)

**Implementación:**
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'bank_transfer_order_created',
  user_id: session.user.id,
  payment_reference: payment_reference,
  amount_mxn: total_mxn
}));
```

**NO loggear:**
- Datos bancarios (CLABE, cuentas)
- Contenido de archivos
- Service role keys

---

## 7. EMAILS (Puntos de Integración - NO Implementar en MVP.2)

**Objetivo:** Documentar dónde irán los emails en MVP.3, pero **NO implementar** en MVP.2 para no complicar.

---

### 7.1 Email: Instrucciones de Transferencia

**Trigger:** Después de crear orden/layaway con transferencia bancaria

**Destinatario:** Cliente (customer_email)

**Subject:** `Instrucciones de pago — Pedido #{order_id} — Bagclue`

**Contenido:**
- Saludo con nombre cliente
- Producto ordenado
- Monto a transferir (MXN)
- Datos bancarios (banco, beneficiario, CLABE)
- **Referencia crítica:** `payment_reference` (el cliente debe ponerla en la transferencia)
- Plazo: 24 horas
- Link para subir comprobante (MVP.3)
- Instrucciones claras paso a paso

**Punto de integración (código futuro):**
```typescript
// En POST /api/payments/bank-transfer/order
// Después de crear transacción exitosamente:
await sendEmail({
  to: customer_email,
  template: 'bank-transfer-instructions',
  data: {
    customer_name,
    order_id,
    payment_reference,
    total_mxn,
    bank_details,
    expires_at
  }
});
```

---

### 7.2 Email: Comprobante Recibido

**Trigger:** Después de upload exitoso de comprobante

**Destinatario:** Cliente

**Subject:** `Comprobante recibido — Pedido #{order_id} — Bagclue`

**Contenido:**
- Confirmación de que comprobante fue recibido
- Status: "En revisión por administrador"
- Tiempo estimado de validación: 24-48 horas
- Contacto soporte si hay dudas

**Punto de integración:**
```typescript
// En POST /api/payments/bank-transfer/upload-proof
// Después de actualizar status a proof_uploaded:
await sendEmail({
  to: transaction.orders?.customer_email || transaction.layaways?.orders?.customer_email,
  template: 'proof-uploaded-confirmation',
  data: {
    customer_name,
    payment_reference,
    order_id
  }
});
```

---

### 7.3 Email: Pago Confirmado

**Trigger:** Admin aprueba pago

**Destinatario:** Cliente

**Subject:** `✅ Pago confirmado — Pedido #{order_id} — Bagclue`

**Contenido:**
- Confirmación de pago exitoso
- Producto apartado/comprado
- Próximos pasos (envío, tracking, etc.)
- Agradecimiento

**Punto de integración:**
```typescript
// En POST /api/payments/admin/verify (action = approve)
// Después de confirmar transacción:
await sendEmail({
  to: customer_email,
  template: 'payment-confirmed',
  data: {
    customer_name,
    order_id,
    product_name,
    total_mxn
  }
});
```

---

### 7.4 Email: Pago Rechazado

**Trigger:** Admin rechaza pago

**Destinatario:** Cliente

**Subject:** `Comprobante rechazado — Pedido #{order_id} — Bagclue`

**Contenido:**
- Notificación de rechazo
- Motivo (rejection_reason)
- Instrucciones para reintentar (subir nuevo comprobante)
- Contacto soporte

**Punto de integración:**
```typescript
// En POST /api/payments/admin/verify (action = reject)
// Después de rechazar transacción:
await sendEmail({
  to: customer_email,
  template: 'payment-rejected',
  data: {
    customer_name,
    order_id,
    payment_reference,
    rejection_reason
  }
});
```

---

### 7.5 Implementación Futura (MVP.3)

**Stack sugerido:**
- Mailer: `nodemailer` (ya usado en PRE-LIVE FASE 1B)
- SMTP: Hostinger Email (hola@bagclue.com)
- Templates: Reutilizar infraestructura de `src/lib/email/`

**MVP.2:** Solo documentar puntos de integración, **NO implementar todavía**.

---

## 8. QUÉ NO TOCAR (Garantías de No-Regresión)

### 8.1 Frontend Público

❌ **NO tocar:**
- Checkout flow (página `/checkout`)
- PaymentMethodSelector (cuando se implemente en MVP.3)
- BankInstructionsPage (MVP.3)
- ProductCard, ProductDetail, Navbar, Footer
- Cualquier componente público

**MVP.2 es SOLO backend.** UI se implementa en MVP.3.

---

### 8.2 UI Admin

❌ **NO tocar:**
- Admin panel (`/admin/*`)
- AdminPaymentVerificationPanel (MVP.3)
- EnviosTable, EnviosActions
- ProductsTable, OrdersTable

**Razón:** MVP.2 no requiere cambios en admin UI. Verificación de pagos puede hacerse manualmente vía Supabase Dashboard hasta que MVP.3 implemente panel dedicado.

---

### 8.3 UI Customer

❌ **NO tocar:**
- Customer panel (`/account/*`)
- UploadProofModal (MVP.3)
- MisPedidos, MisApartados
- ShippingAddressSection

---

### 8.4 Stripe

❌ **NO tocar:**
- Stripe webhook (`/api/stripe/webhook`)
- Stripe checkout (`/api/stripe/checkout`)
- Stripe keys (test o live)
- AddToCartButton, LayawayButton (si usan Stripe)

**Razón:** Stripe sigue funcionando para pagos USD. Transferencia MXN es método paralelo, no reemplazo.

---

### 8.5 DB Schema

❌ **NO tocar:**
- Migrations
- Tablas existentes (estructura)
- RLS policies existentes (solo agregar si necesario)
- Storage buckets existentes

**Razón:** MVP.1 ya preparó la DB. MVP.2 solo usa lo existente.

---

### 8.6 Diseño Web

❌ **NO tocar:**
- Estilos globales
- Tailwind config
- Componentes visuales (badges, buttons, modals base)

---

### 8.7 Inventario

❌ **NO tocar:**
- Lógica de productos (available → sold/reserved)
- Stock management
- Categorías, marcas

**Solo actualizar status (sold/reserved) cuando pago se confirma.**

---

## 9. ENTREGABLES

### 9.1 Documentación

- ✅ **PAYMENTS_MVP2_BACKEND_SCOPE.md** (este archivo)

### 9.2 Código (cuando se implemente)

**API Routes a crear:**
1. `src/app/api/payments/bank-transfer/order/route.ts`
2. `src/app/api/payments/bank-transfer/layaway/deposit/route.ts`
3. `src/app/api/payments/bank-transfer/layaway/installment/route.ts`
4. `src/app/api/payments/bank-transfer/upload-proof/route.ts`
5. `src/app/api/payments/bank-transfer/config/route.ts`
6. `src/app/api/payments/admin/verify/route.ts`

**Helpers/Utils:**
7. `src/lib/payment-utils.ts` — funciones compartidas (generar payment_reference, validaciones, etc.)
8. `src/lib/supabase-admin.ts` — ya existe, reutilizar

**Types:**
9. `src/types/payments.ts` — tipos TypeScript para payloads/responses

**Tests (opcional MVP.2, requerido MVP.3):**
10. Unit tests para helpers
11. Integration tests para endpoints críticos

---

### 9.3 Variables de Entorno

**Agregar en Vercel Production:**
```bash
BANK_ACCOUNT_CLABE=xxxxxxxxxxxxxxxxxxx
BANK_ACCOUNT_NAME="BAG CLUE SA DE CV"
BANK_ACCOUNT_BANK="Banorte"
```

---

### 9.4 Documentación Técnica (post-implementación)

- `PAYMENTS_MVP2_IMPLEMENTATION_REPORT.md` — reporte de ejecución
- `PAYMENTS_MVP2_API_DOCS.md` — documentación API completa (endpoints, payloads, responses, errores)
- `PAYMENTS_MVP2_TESTING_REPORT.md` — resultados de testing

---

## 10. RIESGOS Y MITIGACIONES

### 10.1 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **R1:** Datos bancarios filtrados en logs/responses | Media | Crítico | Validar ownership antes de devolver, NO loggear CLABE |
| **R2:** Usuario sube comprobante falso/editado | Alta | Alto | Admin verifica manualmente, hash SHA256 detecta duplicados |
| **R3:** Usuario crea múltiples órdenes spam | Media | Medio | Rate limit 10 órdenes/hora, validar producto available |
| **R4:** Producto marcado sold antes de pago confirmado | Baja | Alto | Marcar reserved (temporal), solo sold cuando admin confirma |
| **R5:** Usuario mezcla métodos en apartado | Baja | Medio | Validar payment_method en endpoint abono |
| **R6:** Storage bucket lleno por archivos grandes | Baja | Medio | Límite 5MB por archivo, cleanup manual periódico (MVP.3 automático) |
| **R7:** Admin aprueba pago sin verificar comprobante | Media | Alto | UI admin debe mostrar comprobante ANTES de botón aprobar (MVP.3) |
| **R8:** Transacción expira pero producto sigue reserved | Media | Medio | Cron job auto-expira tras 24h (MVP.3), manual interim (admin dashboard) |

---

### 10.2 Mitigaciones Críticas

**R1 - Datos bancarios:**
- ✅ Solo devolver a usuarios con orden válida
- ✅ Variables entorno (NO hardcodear)
- ✅ Logs seguros (NO loggear CLABE)

**R2 - Comprobante falso:**
- ✅ Verificación manual admin (MVP.2)
- ✅ Hash SHA256 detecta duplicados exactos
- 📋 OCR/AI validation (MVP.4 futuro)

**R4 - Producto sold prematuramente:**
- ✅ Status `reserved` temporal
- ✅ Solo `sold` cuando admin confirma pago

**R8 - Expiración:**
- ✅ expires_at guardado en DB
- 📋 Cron job auto-expira (MVP.3)
- 📋 Admin puede cancelar manual (Supabase Dashboard)

---

## 11. CRITERIOS DE CIERRE MVP.2

### 11.1 Funcionalidad Completa

- [ ] Endpoint crear orden transferencia MXN funciona (POST /order)
- [ ] Endpoint crear apartado transferencia MXN funciona (POST /layaway/deposit)
- [ ] Endpoint crear abono apartado funciona (POST /layaway/installment)
- [ ] Endpoint upload comprobante funciona (POST /upload-proof)
- [ ] Endpoint obtener config bancaria funciona (GET /config)
- [ ] Endpoint admin verify funciona (POST /admin/verify)
- [ ] Variables entorno configuradas en Vercel
- [ ] Service role usado correctamente (no expuesto)
- [ ] Ownership validado en todos los endpoints
- [ ] Archivos suben correctamente a bucket storage
- [ ] Hash SHA256 generado y guardado
- [ ] Status transiciones correctas (pending → proof_uploaded → confirmed/rejected)
- [ ] Productos cambian status correctamente (available → reserved → sold)
- [ ] Layaways actualizan remaining_balance correctamente
- [ ] NO se mezclan métodos en apartados

### 11.2 Validación y Testing

- [ ] 10 tests manuales PASS (crear orden, upload, aprobar, rechazar, etc.)
- [ ] Checkout Stripe sigue funcionando (no hay regresiones)
- [ ] Build pasa sin errores (37/37 routes)
- [ ] No hay errores en logs Vercel
- [ ] Storage bucket accesible solo por service role
- [ ] RLS policies funcionan correctamente

### 11.3 Documentación

- [ ] API docs completa (endpoints, payloads, responses)
- [ ] Implementation report entregado
- [ ] Testing report entregado
- [ ] Puntos integración emails documentados

### 11.4 Seguridad

- [ ] Datos bancarios NO en código/repo/logs
- [ ] Service role NO expuesto en cliente
- [ ] Ownership validado en uploads
- [ ] Rate limit implementado o documentado para MVP.3
- [ ] Logs de auditoría implementados

### 11.5 No-Regresión

- [ ] Checkout Stripe funciona igual
- [ ] Admin panel funciona igual
- [ ] Customer panel funciona igual
- [ ] No hay errores nuevos en producción

---

## 12. TIMELINE ESTIMADO

### 12.1 Desarrollo (8-10 días)

**Día 1-2:** Setup + Endpoints básicos
- Crear estructura carpetas API routes
- Implementar POST /order (orden transferencia)
- Implementar POST /layaway/deposit
- Implementar POST /layaway/installment

**Día 3-4:** Upload comprobante
- Implementar POST /upload-proof
- Validaciones archivo (tipo, tamaño)
- Upload a storage bucket
- Hash SHA256

**Día 5-6:** Admin verify + Config
- Implementar POST /admin/verify (aprobar/rechazar)
- Lógica actualización orders/layaways/productos
- Implementar GET /config (datos bancarios)
- Variables entorno Vercel

**Día 7-8:** Helpers + Refactors
- Extraer funciones compartidas a payment-utils.ts
- Types TypeScript
- Logs auditoría
- Validaciones ownership

**Día 9-10:** Testing manual + Fixes
- 10 tests manuales
- Fix bugs encontrados
- Documentación API

### 12.2 QA (2-3 días)

**Día 11:** Testing exhaustivo
- Crear orden transferencia (full purchase)
- Crear apartado transferencia (deposit + installments)
- Upload comprobante (JPG, PNG, PDF)
- Aprobar pago (validar orden → paid, producto → sold)
- Rechazar pago (validar status, poder reintentar)
- Validar no mezclar métodos en apartado

**Día 12:** Validación seguridad
- Intentar acceder datos bancarios sin orden
- Intentar upload comprobante ajeno
- Validar logs seguros (no CLABE)
- Validar service role no expuesto

**Día 13:** Regresión + Deploy
- Validar Stripe sigue funcionando
- Validar admin panel funciona
- Deploy a producción
- Monitoring post-deploy

### 12.3 Total Estimado

**Desarrollo:** 8-10 días  
**QA:** 2-3 días  
**Total:** ~2 semanas (10-13 días)

---

## 13. CONCLUSIÓN

**PAYMENTS MVP.2 está listo para implementación.**

**Beneficios:**
- ✅ Backend completo para transferencias MXN
- ✅ Upload comprobantes seguro
- ✅ Verificación admin funcional
- ✅ Configuración bancaria segura
- ✅ Puntos integración emails documentados
- ✅ Cero impacto en checkout actual (Stripe sigue igual)

**Riesgos mitigados:**
- ✅ Datos bancarios seguros (env vars, ownership validation)
- ✅ Upload seguro (service role, validaciones, hash)
- ✅ Admin verify con lógica correcta (orden → paid, producto → sold)
- ✅ No mezclar métodos en apartados

**Próximo paso:** Jhonatan autoriza ejecutar implementación → proceder con desarrollo.

---

**Autor:** Kepler  
**Fecha:** 2026-05-06  
**Versión:** 1.0  
**Status:** 📋 SCOPE PREPARADO (awaiting approval - NO implementar todavía)
