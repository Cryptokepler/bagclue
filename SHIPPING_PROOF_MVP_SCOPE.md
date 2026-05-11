# SHIPPING PROOF MVP — SCOPE DOCUMENT

**Fecha:** 2026-05-11  
**Propósito:** Permitir que admin suba comprobante/guía de envío y cliente pueda verlo  
**Status:** ⏳ PENDING APPROVAL — NO IMPLEMENTAR SIN APROBACIÓN  

---

## EXECUTIVE SUMMARY

**Objetivo:** Cuando admin marca pedido como enviado, puede subir comprobante/guía. Cliente recibe email con link y puede ver documento desde tracking page.

**Complejidad:** LOW  
**Tiempo estimado:** 3-4 horas  
**Archivos a modificar:** 7  
**Migration requerida:** SÍ (4 columnas + 1 bucket)  
**Blocker:** NO  

---

## A. AUDITORÍA ACTUAL

### 1. INFRAESTRUCTURA EXISTENTE

**✅ Rutas admin funcionando:**
- `/admin/envios` → Listado de envíos con filtros
- `/admin/orders/[id]` → Detalle de orden individual

**✅ Endpoint de shipping:**
- Path: `/api/orders/[id]/shipping`
- Method: `PUT`
- Acepta: `shipping_status`, `tracking_number`, `shipping_provider`, `tracking_url`, `shipping_address`, `notes`
- Validaciones: payment_status=paid requerido, shipping_address requerido, provider requerido
- Email: Envía automáticamente cuando `shipping_status = 'shipped'`

**✅ Componente modal:**
- File: `src/components/admin/envios/MarcarEnviadoModal.tsx`
- Campos actuales:
  1. Paquetería (select: DHL, FedEx, Otro)
  2. Número tracking (text input)
  3. URL tracking (text input, opcional)
- Flow: Admin llena campos → Click "Confirmar envío" → Update orden + Email cliente

**✅ Email template:**
- File: `src/lib/email/templates/shipping-tracking.ts`
- Función: `generateShippingTrackingHTML(params)`
- Contenido: "Tu Pieza Bagclue Va en Camino" + tracking info + CTAs
- CTAs actuales: "Rastrear Paquete en {Provider}", "Ver Estado del Pedido"

**✅ Tracking page:**
- Path: `/track/[tracking_token]`
- Muestra: Status orden, tracking number, paquetería, dirección, timeline

---

### 2. CAMPOS EXISTENTES EN TABLA ORDERS

| Campo | Tipo | Existe | Propósito |
|-------|------|--------|-----------|
| `shipping_status` | TEXT | ✅ | pending, preparing, shipped, delivered |
| `tracking_number` | TEXT | ✅ | Número de guía |
| `shipping_provider` | TEXT | ✅ | dhl, fedex, manual |
| `tracking_url` | TEXT | ✅ | URL rastreo público |
| `shipping_address` | TEXT | ✅ | Dirección completa |
| `delivered_at` | TIMESTAMPTZ | ✅ | Fecha entrega |
| `shipped_at` | TIMESTAMPTZ | ✅ | Fecha envío |
| `tracking_token` | TEXT UNIQUE | ✅ | Token público tracking |
| `customer_phone` | TEXT | ✅ | Teléfono cliente |

**Migración:** `migrations/add_order_tracking.sql` (ejecutada 2026-04-29)

---

### 3. CAMPOS FALTANTES PARA SHIPPING PROOF

| Campo | Tipo | Existe | Propósito |
|-------|------|--------|-----------|
| `shipping_proof_url` | TEXT | ❌ | Signed URL del comprobante (1 año) |
| `shipping_proof_file_name` | TEXT | ❌ | Nombre archivo original |
| `shipping_proof_file_type` | TEXT | ❌ | MIME type (image/jpeg, image/png, application/pdf) |
| `shipping_proof_uploaded_at` | TIMESTAMPTZ | ❌ | Timestamp de upload |

**Alternativa no recomendada:**
- `shipping_proof_path` → NO (requiere regenerar signed URL on-demand, más complejo)

**Decisión:** Usar `shipping_proof_url` (signed URL con 1 año expiración) para seguir patrón existente de payments.

---

### 4. STORAGE ACTUAL

**Buckets existentes:**

| Bucket ID | Public | Propósito | Usado por |
|-----------|--------|-----------|-----------|
| `product-images` | ✅ YES | Imágenes productos | Catálogo público |
| `bank-payment-proofs` | ❌ NO | Comprobantes pago | Payments MVP |

**Bucket bank-payment-proofs:**
- Creado: 2026-05-06 (PAYMENTS_MVP1_MIGRATION.sql)
- Public: NO
- Max size: 5 MB por archivo
- Allowed types: JPG, JPEG, PNG, PDF
- Access: Solo service_role (admin)
- Signed URLs: 1 año expiración (`60 * 60 * 24 * 365`)
- Patrón: `{transactionId}/{timestamp}_{filename}`

**Patrón de seguridad payments (CONFIRMED):**
```typescript
// Upload file
await supabase.storage
  .from('bank-payment-proofs')
  .upload(filePath, file, { contentType: file.type, upsert: false })

// Generate signed URL (1 year)
const { data: urlData } = await supabase.storage
  .from('bank-payment-proofs')
  .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

// Save signed URL in DB
const proofUrl = urlData?.signedUrl || null
await supabase.from('payment_transactions').update({ proof_url: proofUrl })
```

**Decisión de seguridad:** OPCIÓN A — Guardar signed URL en DB (igual que payments)

**Motivo:**
- ✅ Patrón ya validado en payments
- ✅ Más simple (no regenerar on-demand)
- ✅ Performance (no hit a storage por cada vista)
- ✅ 1 año expiración suficiente (órdenes viejas ya entregadas)

---

### 5. STORAGE RECOMENDADO PARA SHIPPING

**Crear nuevo bucket:** `shipping-proofs`

**Razones:**
- ✅ Separación de concerns (payments ≠ shipping)
- ✅ Claridad operativa (admin sabe dónde buscar)
- ✅ Escalabilidad (futuras features shipping)
- ✅ Políticas RLS independientes (si se necesitan)

**Configuración:**
- Public: NO
- Max size: 5 MB por archivo
- Allowed types: JPG, JPEG, PNG, PDF
- Access: Solo service_role (admin)
- Signed URLs: 1 año expiración
- Patrón path: `{orderId}/{timestamp}_{filename}`

**Ejemplo path:**
```
shipping-proofs/
  ├── 550e8400-e29b-41d4-a716-446655440000/
  │   └── 1715450000000_guia_dhl.pdf
  ├── 660e8400-e29b-41d4-a716-446655440001/
  │   └── 1715450123456_comprobante_fedex.jpg
```

---

## B. MIGRATION NECESARIA

**Archivo:** `supabase/migrations/019_add_shipping_proof.sql`

**Contenido:**
```sql
-- ============================================================================
-- MIGRATION: Add shipping proof support to orders
-- ============================================================================
-- Date: 2026-05-11
-- Purpose: Allow admin to upload shipping proof/label for customer view
-- Rollback: See rollback section below
-- ============================================================================

-- ============================================================================
-- STEP 1: Add columns to orders table
-- ============================================================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_type TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_uploaded_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 2: Create storage bucket for shipping proofs
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-proofs', 'shipping-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Add comments (documentation)
-- ============================================================================

COMMENT ON COLUMN orders.shipping_proof_url IS 'Signed URL del comprobante/guía de envío (1 año expiración)';
COMMENT ON COLUMN orders.shipping_proof_file_name IS 'Nombre original del archivo subido';
COMMENT ON COLUMN orders.shipping_proof_file_type IS 'Tipo MIME: image/jpeg, image/png, application/pdf';
COMMENT ON COLUMN orders.shipping_proof_uploaded_at IS 'Timestamp cuando admin subió el archivo';

-- ============================================================================
-- STEP 4: No RLS policies for now (admin-only via service_role)
-- ============================================================================
-- Future: Add policies when needed for customer direct access
-- For now, all access via signed URLs generated by backend

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
```

**Rollback (si necesario):**
```sql
-- Rollback: Remove shipping proof support
-- WARNING: Deletes all files in bucket and all metadata

-- Step 1: Remove columns
ALTER TABLE orders 
DROP COLUMN IF EXISTS shipping_proof_url,
DROP COLUMN IF EXISTS shipping_proof_file_name,
DROP COLUMN IF EXISTS shipping_proof_file_type,
DROP COLUMN IF EXISTS shipping_proof_uploaded_at;

-- Step 2: Delete bucket (requires deleting all files first via Supabase Dashboard)
-- Manual step: Go to Storage → shipping-proofs → Delete all files
-- Then:
DELETE FROM storage.buckets WHERE id = 'shipping-proofs';
```

**Validación post-migration:**
```sql
-- Verify columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name LIKE 'shipping_proof%';

-- Expected: 4 rows (shipping_proof_url, file_name, file_type, uploaded_at)

-- Verify bucket exists
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'shipping-proofs';

-- Expected: 1 row (shipping-proofs, false)
```

---

## C. ARCHIVOS A MODIFICAR

### BACKEND (3 archivos)

**1. API endpoint de shipping**
- **File:** `src/app/api/orders/[id]/shipping/route.ts`
- **Cambios:**
  - Aceptar 4 nuevos parámetros en body
  - Validar que `shipping_proof_url` sea URL válida (si se proporciona)
  - Incluir en objeto `updates`
  - Pasar `shippingProofUrl` a email template
- **Líneas estimadas:** +15

**2. Helper de upload**
- **File:** `src/lib/supabase-upload-shipping.ts` (NUEVO)
- **Propósito:** Función reutilizable para upload + signed URL
- **Función:** `uploadShippingProof(orderId: string, file: File)`
- **Returns:** `{ url: string, fileName: string, fileType: string, fileSize: number }`
- **Líneas estimadas:** ~80

**3. Email template**
- **File:** `src/lib/email/templates/shipping-tracking.ts`
- **Cambios:**
  - Agregar `shippingProofUrl?: string` a interface
  - Agregar bloque HTML condicional para link
  - Solo mostrar si `shippingProofUrl` existe
- **Líneas estimadas:** +25

---

### FRONTEND (4 archivos)

**4. Modal de envío**
- **File:** `src/components/admin/envios/MarcarEnviadoModal.tsx`
- **Cambios:**
  - Agregar estado: `selectedFile`, `fileError`, `uploading`
  - Agregar validación: formato (JPG/PNG/PDF), tamaño (5MB max)
  - Agregar UI: file input + preview + error messages
  - Modificar `handleSubmit`: upload primero, luego update orden
  - Rollback automático si update falla después de upload
- **Líneas estimadas:** +120

**5. Tipos TypeScript**
- **File:** `src/types/admin-envios.ts` (si existe) o inline
- **Cambios:**
  - Agregar `shipping_proof_url`, `shipping_proof_file_name`, etc. a type `EnviosOrder`
- **Líneas estimadas:** +5

**6. Tracking page (cliente)**
- **File:** Buscar archivo exacto (probablemente `src/app/track/[tracking_token]/page.tsx`)
- **Cambios:**
  - Fetch incluir `shipping_proof_url`
  - Agregar bloque condicional con botón "Ver Comprobante"
  - Link abre en nueva pestaña (`target="_blank"`)
- **Líneas estimadas:** +30

**7. Actions component (opcional)**
- **File:** `src/components/admin/envios/EnviosActions.tsx`
- **Cambios:**
  - Pasar nuevos campos a API
- **Líneas estimadas:** +5

---

## D. UX ADMIN PROPUESTA

### UBICACIÓN

**Modal:** `MarcarEnviadoModal`  
**Trigger:** Admin hace click en "Marcar como enviado" desde tabla de envíos

### CAMPOS ACTUALES

1. **Paquetería / Proveedor** (select) ✅
   - Opciones: DHL, FedEx, Otro
   - Required

2. **Número de tracking** (text input) ✅
   - Placeholder: "Ej: 1234567890"
   - Required

3. **URL de tracking** (text input) ✅
   - Placeholder: "https://... (opcional)"
   - Optional (auto-generado para DHL/FedEx si vacío)

### NUEVO CAMPO

4. **Comprobante / guía de envío** (file input) 🆕
   - Label: "Comprobante / guía de envío (opcional)"
   - Input: `<input type="file" accept="image/jpeg,image/png,application/pdf" />`
   - Max size: 5 MB (5,242,880 bytes)
   - Allowed formats: JPG, PNG, PDF
   - Multiple: NO

**Estados:**

| Estado | UI |
|--------|-----|
| Sin archivo | "Seleccionar archivo..." (button style) |
| Archivo seleccionado | "✓ {filename} ({size} KB)" + botón "X" para eliminar |
| Validando | Spinner + "Validando archivo..." |
| Error formato | "⚠️ Formato no válido. Solo JPG, PNG o PDF." (rojo) |
| Error tamaño | "⚠️ Archivo demasiado grande. Máximo 5 MB." (rojo) |
| Subiendo | Progress bar + "Subiendo comprobante... {percent}%" |
| Upload exitoso | "✓ Comprobante subido correctamente" (verde) |
| Upload fallido | "❌ Error al subir. Intenta de nuevo." (rojo) |

**Validación frontend:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato no válido. Solo JPG, PNG o PDF.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Archivo demasiado grande. Máximo 5 MB.'
  }
  return null // Valid
}
```

### FLUJO DE GUARDADO

**Paso 1:** Admin selecciona archivo
- Validar formato + tamaño en frontend
- Mostrar preview (nombre + tamaño)
- NO subir todavía

**Paso 2:** Admin hace click "Confirmar envío"
- Validar todos los campos requeridos (provider, tracking)
- Mostrar spinner "Procesando..."
- Deshabilitar botones

**Paso 3:** Upload archivo (si existe)
- POST a helper function `uploadShippingProof(orderId, file)`
- Upload a bucket `shipping-proofs/{orderId}/{timestamp}_{filename}`
- Generar signed URL (1 año expiración)
- Si falla: mostrar error, detener flujo, NO actualizar orden

**Paso 4:** Update orden
- PUT `/api/orders/[id]/shipping`
- Body incluye: `shipping_status = 'shipped'`, tracking info, + shipping proof metadata
- Si falla: eliminar archivo subido (cleanup), mostrar error

**Paso 5:** Confirmar éxito
- Email enviado automáticamente por backend
- Mostrar toast "✓ Envío confirmado. Email enviado al cliente."
- Refrescar tabla de envíos
- Cerrar modal

**Rollback en error:**
- Upload falla → NO actualizar orden, mostrar error
- Update falla → Eliminar archivo subido, mostrar error

---

## E. SEGURIDAD

### PATRÓN ACTUAL (PAYMENTS)

**Confirmado en código:**
```typescript
// 1. Upload file to private bucket
const { data, error } = await supabase.storage
  .from('bank-payment-proofs')
  .upload(filePath, file, {
    contentType: file.type,
    upsert: false
  })

// 2. Generate signed URL (1 year)
const { data: urlData } = await supabase.storage
  .from('bank-payment-proofs')
  .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

// 3. Save signed URL in DB
const proofUrl = urlData?.signedUrl || null
await supabase.from('payment_transactions').update({ proof_url: proofUrl })
```

### SEGUIR MISMO PATRÓN PARA SHIPPING

**OPCIÓN A (RECOMENDADA):** Guardar signed URL en DB con expiración larga

- ✅ Upload archivo a bucket privado `shipping-proofs`
- ✅ Generar signed URL con 1 año expiración
- ✅ Guardar signed URL en `orders.shipping_proof_url`
- ✅ Cliente accede vía signed URL directamente
- ✅ No regenerar on-demand (más simple)

**OPCIÓN B (NO RECOMENDADA):** Guardar path privado + endpoint de regeneración

- ⚠️ Guardar path en `orders.shipping_proof_path`
- ⚠️ Crear endpoint `/api/orders/[id]/shipping-proof` o `/api/track/[token]/shipping-proof`
- ⚠️ Endpoint valida ownership → genera signed URL on-demand
- ❌ Más complejo
- ❌ Hit a storage por cada vista
- ❌ No necesario (1 año expiración suficiente)

**Decisión:** **OPCIÓN A** (igual que payments)

---

### REGLAS DE SEGURIDAD

**✅ Bucket privado:**
- `public: false` en storage.buckets
- Solo service_role puede subir
- Solo signed URLs pueden acceder

**✅ No logs de secrets:**
- ❌ NO imprimir signed URL completa en logs
- ✅ Imprimir solo: `Proof uploaded: {orderId}, size: {size} bytes`
- ❌ NO imprimir tracking_token completo
- ✅ Imprimir solo primeros 8 caracteres: `token: 12345678...`

**✅ Access control:**
- Solo admin puede subir (via backend service_role)
- Cliente solo puede ver (via signed URL en email/tracking page)
- No políticas RLS públicas (no necesarias con signed URLs)

**✅ Validación:**
- Formato: Solo JPG, PNG, PDF
- Tamaño: Máximo 5 MB
- Anti-duplicados: Hash SHA256 (opcional, no MVP)

**✅ URL firmada:**
- Expiración: 1 año (365 días)
- Regenerar: NO necesario en MVP (1 año suficiente)
- Formato: `https://{supabase_url}/storage/v1/object/sign/shipping-proofs/{path}?token={signature}&exp={timestamp}`

---

## F. EMAIL UPDATE

### TEMPLATE ACTUAL

**Archivo:** `src/lib/email/templates/shipping-tracking.ts`

**Función:** `generateShippingTrackingHTML(params: ShippingTrackingParams)`

**Parámetros actuales:**
```typescript
interface ShippingTrackingParams {
  customerName: string;
  orderId: string;
  productName: string;
  shippingProvider: string;
  trackingNumber: string;
  trackingUrl?: string;
  orderTrackingUrl: string;
}
```

**Contenido actual:**
- Subject: "Tu Pieza Bagclue Va en Camino"
- Header: Logo BAGCLUE
- Icon: 🚚
- Title: "Tu Pieza Bagclue Va en Camino"
- Status badge: "✓ En Tránsito" (verde)
- Detalles orden: Pedido #, Producto, Paquetería
- Tracking box: Número de rastreo + botones
- CTAs actuales:
  1. "Rastrear Paquete en {Provider}" (si trackingUrl existe)
  2. "Ver Estado del Pedido" (orderTrackingUrl)
- Footer: Contacto Bagclue

---

### MODIFICACIÓN REQUERIDA

**1. Actualizar interface:**
```typescript
interface ShippingTrackingParams {
  // ... existing params
  shippingProofUrl?: string;  // NUEVO
}
```

**2. Agregar bloque condicional:**

**Ubicación:** Después del tracking box, antes del párrafo "Tiempo estimado de entrega"

**HTML:**
```html
${params.shippingProofUrl ? `
  <div style="margin: 24px 0; padding: 16px; background: #F5F1ED; border-radius: 8px; text-align: center;">
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #666; font-weight: 600;">
      📄 Comprobante de envío disponible
    </p>
    <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">
      Consulta la guía o comprobante asociado a tu envío
    </p>
    <a 
      href="${params.shippingProofUrl}" 
      target="_blank"
      rel="noopener noreferrer"
      class="button" 
      style="display: inline-block; background: #111111; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; text-align: center;">
      Ver Comprobante de Envío
    </a>
  </div>
` : ''}
```

**Comportamiento:**
- Si `shippingProofUrl` existe → Mostrar bloque
- Si `shippingProofUrl` es null/undefined → NO mostrar bloque (email sigue funcionando sin cambios)
- Link abre en nueva pestaña (`target="_blank"`)
- Link usa signed URL (válida 1 año)

**3. Actualizar llamada en API:**

**File:** `src/app/api/orders/[id]/shipping/route.ts`

**Antes:**
```typescript
const emailSent = await sendShippingTrackingEmail({
  to: order.customer_email,
  customerName: order.customer_name,
  orderId: orderId,
  productName,
  shippingProvider: shipping_provider || 'manual',
  trackingNumber: tracking_number || 'N/A',
  trackingUrl: tracking_url || undefined,
  orderTrackingUrl: public_tracking_url || `${baseUrl}/account/orders/${orderId}`
})
```

**Después:**
```typescript
const emailSent = await sendShippingTrackingEmail({
  to: order.customer_email,
  customerName: order.customer_name,
  orderId: orderId,
  productName,
  shippingProvider: shipping_provider || 'manual',
  trackingNumber: tracking_number || 'N/A',
  trackingUrl: tracking_url || undefined,
  orderTrackingUrl: public_tracking_url || `${baseUrl}/account/orders/${orderId}`,
  shippingProofUrl: updates.shipping_proof_url || undefined  // NUEVO
})
```

---

## G. TRACKING PAGE UPDATE

### UBICACIÓN

**Path:** `/track/[tracking_token]`  
**Archivo:** Buscar exacto (probablemente `src/app/track/[tracking_token]/page.tsx`)

### FUNCIONALIDAD ACTUAL

- Fetch orden por tracking_token
- Mostrar: Status, tracking number, paquetería, dirección
- Timeline de estados
- Link "Ver en Paquetería" si tracking_url existe

### MODIFICACIÓN REQUERIDA

**1. Incluir shipping_proof_url en fetch:**

**Antes:**
```typescript
const { data: order } = await supabase
  .from('orders')
  .select(`
    id,
    status,
    shipping_status,
    tracking_number,
    shipping_provider,
    tracking_url,
    shipped_at,
    delivered_at
  `)
  .eq('tracking_token', token)
  .single()
```

**Después:**
```typescript
const { data: order } = await supabase
  .from('orders')
  .select(`
    id,
    status,
    shipping_status,
    tracking_number,
    shipping_provider,
    tracking_url,
    shipped_at,
    delivered_at,
    shipping_proof_url,              // NUEVO
    shipping_proof_file_name         // NUEVO (opcional, para mostrar nombre)
  `)
  .eq('tracking_token', token)
  .single()
```

**2. Agregar bloque condicional en UI:**

**Ubicación:** Después de tracking info, antes de timeline/footer

**JSX:**
```tsx
{order.shipping_proof_url && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
      <span>📄</span> Comprobante de Envío
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      Puedes consultar la guía o comprobante asociado a tu envío.
    </p>
    <a
      href={order.shipping_proof_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
    >
      <span>📄</span>
      Ver Comprobante de Envío
    </a>
    {order.shipping_proof_file_name && (
      <p className="text-xs text-gray-500 mt-3">
        Archivo: {order.shipping_proof_file_name}
      </p>
    )}
  </div>
)}
```

**Comportamiento:**
- Solo mostrar si `shipping_proof_url` existe
- Link abre en nueva pestaña (`target="_blank"`)
- Icono 📄 para claridad visual
- Opcional: Mostrar nombre de archivo original

---

## H. RIESGOS

### RIESGO 1: Upload falla pero orden se marca como shipped

**Probabilidad:** MEDIA  
**Impacto:** ALTO (cliente no recibe comprobante, orden ya "enviada")

**Mitigación:**
- ✅ Upload PRIMERO, update orden DESPUÉS
- ✅ Si upload falla, NO llamar API de shipping
- ✅ Mostrar error claro al admin: "Error al subir comprobante. Intenta de nuevo."
- ✅ NO actualizar orden si upload falla

**Rollback automático:**
- Si update falla DESPUÉS de upload exitoso → Eliminar archivo subido (cleanup)

---

### RIESGO 2: Admin sube archivo equivocado

**Probabilidad:** BAJA  
**Impacto:** BAJO (cliente confundido)

**Mitigación:**
- ⏳ Preview de archivo antes de confirmar (opcional, no MVP)
- ⏳ Permitir re-upload (sobrescribir archivo) (opcional, no MVP)
- ✅ Validación de formato + tamaño frontend
- ✅ Nombre archivo mostrado en UI antes de subir

---

### RIESGO 3: Signed URL expira después de 1 año

**Probabilidad:** MUY BAJA  
**Impacto:** BAJO (órdenes viejas, ya entregadas)

**Mitigación:**
- ✅ 1 año expiración suficiente (órdenes típicamente completas en 1-2 semanas)
- ⏳ Regenerar URL on-demand si expira (Fase 2, no MVP)
- ⏳ Endpoint `/api/orders/[id]/shipping-proof-renew` (Fase 2, no MVP)

---

### RIESGO 4: Bucket se llena (storage limit Supabase)

**Probabilidad:** BAJA (largo plazo)  
**Impacto:** MEDIO (no se pueden subir más archivos)

**Mitigación:**
- ✅ Validar tamaño max 5 MB por archivo
- ⏳ Monitorear uso storage mensualmente
- ⏳ Cleanup archivos antiguos (>90 días) (Fase 2)
- ⏳ Comprimir imágenes antes de subir (Fase 2)

---

### RIESGO 5: Cliente no puede abrir PDF/imagen

**Probabilidad:** BAJA  
**Impacto:** BAJO (UX degradada)

**Mitigación:**
- ✅ Validar formato permitido (JPG, PNG, PDF)
- ✅ Link abre en nueva pestaña (no inline)
- ✅ Signed URL correcta (no expira en 1 año)
- ⏳ Fallback: Email con instrucciones si link no funciona (Fase 2)

---

## I. TESTING PLAN

### PRE-REQUISITOS

1. ✅ Migration ejecutada en Supabase Studio
2. ✅ Bucket `shipping-proofs` creado y privado
3. ✅ Código deployado en Vercel
4. ✅ Orden paid existente (de QA anterior o crear nueva)

---

### TEST 1: UPLOAD EXITOSO (HAPPY PATH)

**Objetivo:** Verificar flujo completo admin → cliente

**Steps:**
1. Usar orden paid (payment_status = 'paid', shipping_address presente)
2. Ir a `/admin/envios`
3. Localizar orden
4. Click "Marcar como enviado"
5. Llenar campos:
   - Paquetería: DHL
   - Tracking: 1234567890TEST
   - Comprobante: Subir PDF test (2 MB)
6. Click "Confirmar envío"
7. Esperar confirmación

**Expected results:**
- ✅ Modal muestra spinner "Procesando..."
- ✅ Upload completa sin errores
- ✅ Modal cierra
- ✅ Toast "✓ Envío confirmado. Email enviado."
- ✅ Tabla refrescada, orden muestra status "shipped"
- ✅ DB check:
  ```sql
  SELECT 
    shipping_status, 
    shipping_proof_url, 
    shipping_proof_file_name,
    shipping_proof_file_type,
    shipping_proof_uploaded_at
  FROM orders 
  WHERE id = '{order_id}';
  ```
  - shipping_status = 'shipped'
  - shipping_proof_url empieza con `https://...supabase.co/storage/v1/object/sign/...`
  - shipping_proof_file_name = nombre archivo original
  - shipping_proof_file_type = 'application/pdf'
  - shipping_proof_uploaded_at = timestamp reciente
- ✅ Email llegó a cliente
- ✅ Email incluye botón "Ver Comprobante de Envío"
- ✅ Click en link abre PDF en nueva pestaña
- ✅ Tracking page `/track/{token}` muestra bloque comprobante
- ✅ Click botón "Ver Comprobante" abre PDF

---

### TEST 2: UPLOAD SIN COMPROBANTE (OPCIONAL)

**Objetivo:** Verificar que feature es opcional, no rompe flujo existente

**Steps:**
1. Usar segunda orden paid
2. Marcar como enviado SIN subir comprobante
3. Llenar solo tracking info
4. Confirmar

**Expected results:**
- ✅ Orden marcada shipped correctamente
- ✅ Email enviado sin bloque de comprobante
- ✅ Tracking page NO muestra bloque comprobante
- ✅ shipping_proof_url = NULL en DB

---

### TEST 3: VALIDACIÓN FORMATO

**Objetivo:** Verificar que solo acepta JPG, PNG, PDF

**Steps:**
1. Intentar subir archivo .txt
2. Intentar subir archivo .docx
3. Intentar subir archivo .zip

**Expected results:**
- ❌ Error: "Formato no válido. Solo JPG, PNG o PDF."
- ❌ Botón "Confirmar envío" deshabilitado
- ❌ No se puede continuar sin archivo válido

---

### TEST 4: VALIDACIÓN TAMAÑO

**Objetivo:** Verificar límite 5 MB

**Steps:**
1. Intentar subir imagen JPG de 7 MB

**Expected results:**
- ❌ Error: "Archivo demasiado grande. Máximo 5 MB."
- ❌ Botón "Confirmar envío" deshabilitado

---

### TEST 5: ROLLBACK EN ERROR (UPLOAD FALLA)

**Objetivo:** Verificar que orden NO se actualiza si upload falla

**Steps:**
1. Simular error de upload (desconectar internet, o bucket lleno)
2. Intentar marcar como enviado con comprobante

**Expected results:**
- ❌ Error: "Error al subir comprobante. Intenta de nuevo."
- ❌ Orden NO marcada como shipped
- ❌ Email NO enviado
- ❌ Modal sigue abierto (puede reintentar)

---

### TEST 6: SEGURIDAD - NO SECRETS EN LOGS

**Objetivo:** Verificar que no se imprimen secrets

**Steps:**
1. Marcar orden como enviado con comprobante
2. Revisar logs de Vercel

**Expected results:**
- ✅ NO aparece signed URL completa en logs
- ✅ Solo aparece: `Proof uploaded for order: {orderId}, size: {bytes} bytes`
- ✅ NO aparece tracking_token completo
- ✅ Solo aparece primeros 8 caracteres: `token: 12345678...`

---

### TEST 7: MOBILE UX

**Objetivo:** Verificar que email y tracking page funcionan en mobile

**Steps:**
1. Abrir email en mobile
2. Click "Ver Comprobante de Envío"
3. Abrir tracking page en mobile

**Expected results:**
- ✅ Email renderiza correctamente
- ✅ Botón "Ver Comprobante" visible y clickeable
- ✅ PDF abre en nueva pestaña (o download en mobile)
- ✅ Tracking page muestra bloque comprobante responsive

---

### TEST 8: EDGE CASE - RE-UPLOAD

**Objetivo:** Verificar comportamiento si admin quiere cambiar comprobante

**Steps:**
1. Marcar orden como shipped con comprobante A
2. Volver a editar envío (si existe UI) y subir comprobante B

**Expected results:**
- ⏳ No implementado en MVP (editar envío no existe)
- ✅ Documentar para Fase 2: Permitir re-upload

---

## J. QUÉ NO TOCAR

**❌ NO MODIFICAR:**

1. **Stripe Live configuration**
   - No tocar variables Stripe
   - No tocar webhook endpoints
   - No tocar checkout flow

2. **Pagos (bank transfer)**
   - No tocar `/api/payments/*`
   - No tocar `payment_transactions` table
   - No tocar bucket `bank-payment-proofs`
   - No tocar emails de pago

3. **Admin payments**
   - No tocar `/admin/payments`
   - No tocar approve/reject logic

4. **DB schema (sin aprobación)**
   - No crear tablas nuevas
   - No modificar tablas existentes (excepto `orders` con migration aprobada)
   - No tocar RLS policies existentes

5. **RLS (sin aprobación)**
   - No crear políticas nuevas
   - No modificar políticas existentes
   - Bucket privado solo (no RLS en storage)

6. **Inventario**
   - No tocar tabla `products`
   - No tocar `product_images`
   - No tocar stock logic

7. **Product cards / Catálogo**
   - No tocar `/catalogo`
   - No tocar product detail pages
   - No tocar home page

8. **Checkout**
   - No tocar `/cart`
   - No tocar checkout flow
   - No tocar order creation

9. **Emails validados**
   - No tocar templates de pago
   - No tocar welcome email
   - No tocar SMTP config

---

## K. ESTIMACIÓN

### TIEMPO POR FASE

| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | Migration SQL | 15 min |
| 1 | Ejecutar migration en Supabase | 5 min |
| 1 | Validar migration | 5 min |
| 1 | Crear helper upload | 30 min |
| 1 | Actualizar API endpoint | 20 min |
| 1 | Testing backend (Postman) | 15 min |
| **Subtotal Fase 1** | **Backend** | **1h 30min** |
| | | |
| 2 | Modificar MarcarEnviadoModal | 45 min |
| 2 | Actualizar types | 5 min |
| 2 | Testing modal | 20 min |
| **Subtotal Fase 2** | **Frontend Admin** | **1h 10min** |
| | | |
| 3 | Actualizar email template | 15 min |
| 3 | Modificar tracking page | 20 min |
| 3 | Testing email + tracking | 15 min |
| **Subtotal Fase 3** | **Email + Tracking** | **50min** |
| | | |
| 4 | QA completa (8 tests) | 30 min |
| **Subtotal Fase 4** | **QA** | **30min** |

**TOTAL ESTIMADO:** **4 horas**

---

### COMPLEJIDAD POR TAREA

| Tarea | Complejidad | Riesgo |
|-------|-------------|--------|
| Migration SQL | BAJA | BAJO |
| Helper upload | BAJA | BAJO (copiar patrón payments) |
| API endpoint | BAJA | BAJO (solo agregar params) |
| Modal UI | MEDIA | MEDIO (validación + rollback) |
| Email template | BAJA | BAJO (solo agregar bloque) |
| Tracking page | BAJA | BAJO (solo agregar bloque) |
| QA | BAJA | BAJO |

**Complejidad global:** **LOW-MEDIUM**

---

## L. ENTREGA PRIMERO (ESTE DOCUMENTO)

**✅ COMPLETADO:**

- ✅ Auditoría actual
- ✅ Campos existentes/faltantes
- ✅ Storage recomendado
- ✅ Migration necesaria
- ✅ Archivos a modificar
- ✅ UX admin propuesta
- ✅ Email update
- ✅ Tracking page update
- ✅ Riesgos
- ✅ Testing plan
- ✅ Estimación
- ✅ Qué NO tocar

**STATUS:** ⏳ **PENDING APPROVAL**

---

## M. NEXT STEPS

**¿PROCEDER CON IMPLEMENTACIÓN?**

**Opciones:**

**A) SÍ — Implementar ahora (antes de Stripe Live)**
- Tiempo: 4 horas
- Beneficio: UX completa para primer cliente real
- Riesgo: Retrasa Stripe Live activation 4h

**B) NO — Postponer para post-launch**
- Implementar después de validar Stripe Live
- Beneficio: Stripe Live más rápido
- Riesgo: Cliente no ve comprobante en primer envío
- Admin puede enviar por WhatsApp temporalmente

**C) MVP MÍNIMO — Solo backend (sin UI admin)**
- Admin sube manualmente a Supabase Storage
- Admin copia URL y pega en DB manualmente
- Email y tracking funcionan
- Tiempo: 1 hora
- UX admin: Manual (no escalable)

---

**RECOMENDACIÓN:** **OPCIÓN B — Postponer para post-launch**

**Plan ejecutivo:**
1. **HOY:** Completar QA manual payments (4 flujos)
2. **HOY:** Activar Stripe Live si QA pasa
3. **MAÑANA:** Implementar Shipping Proof MVP (4h)
4. **MAÑANA:** Deploy + QA
5. Listo para segundo cliente con feature completa

---

**END OF SCOPE DOCUMENT**

**Awaiting approval to proceed with implementation.**
