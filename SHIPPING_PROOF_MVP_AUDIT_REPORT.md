# SHIPPING PROOF MVP — AUDIT REPORT

**Fecha:** 2026-05-11  
**Objetivo:** Auditoría de infraestructura para implementar comprobante/guía de envío  
**Status:** ✅ COMPLETADA  

---

## EXECUTIVE SUMMARY

**Infrastructure Status:** ✅ READY (con 1 cambio menor requerido)  
**Implementation Complexity:** LOW (estructura existente reutilizable)  
**Migration Required:** YES (1 nueva tabla + 1-2 campos en orders)  
**Storage Available:** YES (bucket existente reutilizable o crear nuevo)  
**Estimated Time:** 3-4 horas (migration + backend + frontend)  

---

## A. INFRAESTRUCTURA ACTUAL

### 1. RUTAS ADMIN DE ENVÍOS

**Ruta principal de envíos:**
- Path: `/admin/envios`
- File: `src/app/admin/envios/page.tsx`
- Status: ✅ EXISTE

**Ruta de orden individual:**
- Path: `/admin/orders/[id]`
- File: `src/app/admin/orders/page.tsx`
- Status: ✅ EXISTE

**Componentes clave identificados:**
- `src/components/admin/envios/MarcarEnviadoModal.tsx` ✅
- `src/components/admin/envios/EnviosActions.tsx` ✅
- `src/components/admin/envios/EnviosTable.tsx` ✅

---

### 2. ENDPOINT ACTUAL DE SHIPPING

**Archivo identificado:**
```
src/app/api/orders/[id]/shipping/route.ts
```

**Método:** `PUT`

**Campos soportados actualmente:**
- ✅ `customer_phone`
- ✅ `shipping_address`
- ✅ `shipping_status` (pending, preparing, shipped, delivered)
- ✅ `shipping_provider` (dhl, fedex, manual)
- ✅ `tracking_number`
- ✅ `tracking_url`
- ✅ `notes`

**Auto-generación de tracking URL:**
- ✅ DHL: `https://www.dhl.com.mx/es/express/rastreo.html?AWB={number}`
- ✅ FedEx: `https://www.fedex.com/fedextrack/?tracknumbers={number}`

**Email enviado:**
- ✅ Template: `src/lib/email/templates/shipping-tracking.ts`
- ✅ Trigger: cuando `shipping_status = 'shipped'`
- ✅ Destinatario: `order.customer_email`

**Validaciones implementadas:**
- ✅ shipping_status debe ser válido (pending/preparing/shipped/delivered)
- ✅ shipping_provider debe ser válido (dhl/fedex/manual/null)
- ✅ Para marcar shipped: requiere payment_status=paid, shipping_address, provider, tracking_number

---

### 3. TABLA ORDERS — CAMPOS EXISTENTES

**Campos de shipping actuales:**

| Campo | Tipo | Existe | Propósito |
|-------|------|--------|-----------|
| `shipping_status` | TEXT | ✅ | Estado: pending, preparing, shipped, delivered |
| `tracking_number` | TEXT | ✅ | Número de guía |
| `shipping_provider` | TEXT | ✅ | Paquetería: dhl, fedex, manual |
| `tracking_url` | TEXT | ✅ | URL rastreo público |
| `shipping_address` | TEXT | ✅ | Dirección completa |
| `delivered_at` | TIMESTAMPTZ | ✅ | Fecha entrega |
| `shipped_at` | TIMESTAMPTZ | ✅ | Fecha envío |
| `tracking_token` | TEXT UNIQUE | ✅ | Token público (/track/[token]) |
| `customer_phone` | TEXT | ✅ | Teléfono cliente |

**Campos relacionados a comprobante:**

| Campo | Tipo | Existe | Propósito |
|-------|------|--------|-----------|
| `shipping_proof_url` | TEXT | ❌ | URL del comprobante/guía de envío |
| `shipping_proof_file_name` | TEXT | ❌ | Nombre archivo original |
| `shipping_proof_file_type` | TEXT | ❌ | Tipo MIME (image/jpeg, image/png, application/pdf) |
| `shipping_proof_file_size` | INTEGER | ❌ | Tamaño en bytes |
| `shipping_receipt_url` | TEXT | ❌ | Alias alternativo (no recomendado) |
| `shipping_label_url` | TEXT | ❌ | Alias alternativo (no recomendado) |

**Resultado:** ❌ **NO EXISTE campo para shipping proof**

---

### 4. STORAGE ACTUAL

**Buckets existentes:**

| Bucket ID | Public | Propósito | Políticas RLS |
|-----------|--------|-----------|---------------|
| `product-images` | ✅ YES | Imágenes de productos | Públicas (read-only) |
| `bank-payment-proofs` | ❌ NO | Comprobantes de pago | Privadas (service_role) |

**Bucket bank-payment-proofs:**
- Created: 2026-05-06 (PAYMENTS MVP.1 migration)
- Access: Private (solo service_role)
- Purpose: Comprobantes de transferencia bancaria
- Max size: No definido (default 50MB Supabase)
- Allowed formats: JPG, PNG, PDF
- Security: Sin políticas RLS públicas (admin solo)

**Opciones para shipping proof:**

**OPCIÓN A: Reutilizar bank-payment-proofs**
- ✅ PRO: Ya existe, configurado, privado
- ✅ PRO: Mismo patrón de upload/acceso que payments
- ⚠️ CON: Nombre no es semántico para shipping
- ⚠️ CON: Mezcla tipos de documentos (payments + shipping)

**OPCIÓN B: Crear nuevo bucket shipping-proofs**
- ✅ PRO: Semántico, separación de concerns
- ✅ PRO: Permite políticas RLS independientes
- ❌ CON: Requiere migración adicional
- ❌ CON: Duplica lógica de upload

**Recomendación:** **OPCIÓN B** (crear bucket dedicado)

**Motivo:**
- Claridad operativa (admin sabe dónde buscar)
- Escalabilidad (futuras features de shipping)
- Seguridad (políticas RLS específicas)

---

## B. UX ADMIN REQUERIDA

### UBICACIÓN

**Componente a modificar:**
```
src/components/admin/envios/MarcarEnviadoModal.tsx
```

**Campos actuales:**
1. Paquetería / Proveedor (select: DHL, FedEx, Otro) ✅
2. Número de tracking (text input) ✅
3. URL de tracking (text input, opcional) ✅

**Nuevo campo requerido:**
4. **Comprobante / guía de envío** (file upload)

---

### ESPECIFICACIONES UX

**Ubicación en modal:**
- Después de "URL de tracking"
- Antes del footer con botones

**Campo:**
- Label: "Comprobante / guía de envío (opcional)"
- Input type: `<input type="file" />`
- Accept: `accept="image/jpeg,image/png,application/pdf"`
- Max size: 5 MB (5,242,880 bytes)
- Multiple: NO

**Estados:**
- Sin archivo: Mostrar "Seleccionar archivo..."
- Con archivo: Mostrar nombre + tamaño + botón "X" para eliminar
- Subiendo: Mostrar spinner + progreso
- Error: Mostrar mensaje de error (tamaño, formato, upload failed)

**Comportamiento:**
- NO subir automáticamente al seleccionar
- Subir al hacer click en "Confirmar envío"
- Validar formato y tamaño en frontend antes de enviar
- Si upload falla, NO marcar orden como shipped (rollback)

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

---

### FLUJO DE GUARDADO

**Paso 1: Admin selecciona archivo**
- File guardado en estado local del modal
- Mostrar nombre + tamaño en UI

**Paso 2: Admin hace click en "Confirmar envío"**
- Validar todos los campos (provider, tracking, archivo)
- Mostrar spinner "Procesando..."

**Paso 3: Upload archivo a storage**
- Subir a bucket `shipping-proofs/{order_id}/{timestamp}_{filename}`
- Obtener URL del archivo
- Si falla: mostrar error, detener flujo

**Paso 4: Update orden**
- Enviar request a `/api/orders/[id]/shipping`
- Incluir `shipping_proof_url`, `shipping_proof_file_name`, etc.
- Marcar `shipping_status = 'shipped'`

**Paso 5: Confirmar éxito**
- Mostrar toast "Envío confirmado ✓"
- Recargar tabla de envíos
- Cerrar modal

**Rollback en error:**
- Si upload falla en paso 3: NO actualizar orden
- Si update falla en paso 4: Eliminar archivo subido (cleanup)

---

## C. EMAIL AL CLIENTE

### TEMPLATE ACTUAL

**Archivo:**
```
src/lib/email/templates/shipping-tracking.ts
```

**Función:**
```typescript
generateShippingTrackingHTML(params: ShippingTrackingParams)
```

**Parámetros actuales:**
- ✅ `customerName`
- ✅ `orderId`
- ✅ `productName`
- ✅ `shippingProvider`
- ✅ `trackingNumber`
- ✅ `trackingUrl` (opcional)
- ✅ `orderTrackingUrl`

**Contenido actual:**
- Encabezado: "Tu Pieza Bagclue Va en Camino"
- Status badge: "En Tránsito"
- Detalles: Pedido, Producto, Paquetería
- Tracking box: Número de rastreo + botones CTA
- Footer: Contacto Bagclue

**Botones CTA actuales:**
1. "Rastrear Paquete en {Provider}" (si trackingUrl existe)
2. "Ver Estado del Pedido" (order tracking page)

---

### MODIFICACIÓN REQUERIDA

**Nuevo parámetro:**
```typescript
interface ShippingTrackingParams {
  // ... existing params
  shippingProofUrl?: string;  // NUEVO
}
```

**Nuevo bloque HTML:**

**Ubicación:** Después del tracking box, antes del párrafo de tiempo estimado

**HTML:**
```html
${params.shippingProofUrl ? `
<div style="margin: 24px 0; padding: 16px; background: #F5F1ED; border-radius: 8px; text-align: center;">
  <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
    📄 Comprobante de envío disponible
  </p>
  <a href="${params.shippingProofUrl}" 
     class="button" 
     style="background: #111111; display: inline-block;">
    Ver Guía de Envío
  </a>
</div>
` : ''}
```

**Comportamiento:**
- Si `shippingProofUrl` existe: Mostrar bloque
- Si `shippingProofUrl` es null/undefined: NO mostrar bloque (email sigue funcionando sin cambios)

**Link seguro:**
- URL debe ser firmada (signed URL) de Supabase Storage
- Expiración: 7 días (604800 segundos)
- No adjuntar archivo pesado al email directamente

---

## D. TRACKING PAGE CLIENTE

### RUTA ACTUAL

**Path:** `/track/[token]`
**File:** `src/app/track/[tracking_token]/page.tsx` (probablemente)

**Funcionalidad actual:**
- Mostrar status de orden
- Mostrar tracking number si existe
- Mostrar paquetería
- Mostrar dirección de envío
- Timeline de estados

---

### MODIFICACIÓN REQUERIDA

**Nuevo bloque condicional:**

**Ubicación:** Después de tracking info, antes de timeline/footer

**Condición:** `if (order.shipping_proof_url)`

**HTML/React:**
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
      className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
    >
      Ver Comprobante
    </a>
  </div>
)}
```

**Comportamiento:**
- Solo mostrar si `shipping_proof_url` existe
- Link abre en nueva pestaña (`target="_blank"`)
- URL debe ser firmada (signed URL) con expiración 7 días

---

## E. CAMBIOS REQUERIDOS

### MIGRATION SQL

**Archivo:** `supabase/migrations/019_add_shipping_proof.sql`

**Contenido:**
```sql
-- Migration: Add shipping proof support to orders
-- Date: 2026-05-11
-- Purpose: Allow admin to upload shipping proof/label

-- 1. Add columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_type TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_size INTEGER;

-- 2. Create storage bucket for shipping proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-proofs', 'shipping-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Add comments
COMMENT ON COLUMN orders.shipping_proof_url IS 'URL del comprobante/guía de envío subido por admin';
COMMENT ON COLUMN orders.shipping_proof_file_name IS 'Nombre original del archivo';
COMMENT ON COLUMN orders.shipping_proof_file_type IS 'Tipo MIME: image/jpeg, image/png, application/pdf';
COMMENT ON COLUMN orders.shipping_proof_file_size IS 'Tamaño del archivo en bytes';

-- 4. No RLS policies for now (admin-only via service_role)
-- Future: Add policies when needed
```

**Rollback (si necesario):**
```sql
-- Rollback: Remove shipping proof support
ALTER TABLE orders 
DROP COLUMN IF EXISTS shipping_proof_url,
DROP COLUMN IF EXISTS shipping_proof_file_name,
DROP COLUMN IF EXISTS shipping_proof_file_type,
DROP COLUMN IF EXISTS shipping_proof_file_size;

-- Delete bucket (requires deleting all files first)
DELETE FROM storage.buckets WHERE id = 'shipping-proofs';
```

---

### BACKEND CHANGES

**File:** `src/app/api/orders/[id]/shipping/route.ts`

**Cambios requeridos:**

1. **Aceptar nuevos parámetros:**
```typescript
const {
  // ... existing params
  shipping_proof_url,
  shipping_proof_file_name,
  shipping_proof_file_type,
  shipping_proof_file_size
} = body
```

2. **Incluir en updates:**
```typescript
if (shipping_proof_url !== undefined) updates.shipping_proof_url = shipping_proof_url
if (shipping_proof_file_name !== undefined) updates.shipping_proof_file_name = shipping_proof_file_name
if (shipping_proof_file_type !== undefined) updates.shipping_proof_file_type = shipping_proof_file_type
if (shipping_proof_file_size !== undefined) updates.shipping_proof_file_size = shipping_proof_file_size
```

3. **Pasar a email template:**
```typescript
const emailSent = await sendShippingTrackingEmail({
  // ... existing params
  shippingProofUrl: updates.shipping_proof_url || undefined
})
```

**Validaciones adicionales:**
- Validar que shipping_proof_url sea URL válida (si se proporciona)
- Validar que file_size esté dentro del límite (5MB)
- Validar que file_type sea permitido (jpeg, png, pdf)

---

### FRONTEND CHANGES

**File 1:** `src/components/admin/envios/MarcarEnviadoModal.tsx`

**Cambios:**

1. **Agregar estado para archivo:**
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [fileError, setFileError] = useState<string | null>(null)
```

2. **Agregar validación:**
```typescript
const validateFile = (file: File): string | null => {
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf']
  
  if (!ALLOWED.includes(file.type)) {
    return 'Formato no válido. Solo JPG, PNG o PDF.'
  }
  if (file.size > MAX_SIZE) {
    return 'Archivo demasiado grande. Máximo 5 MB.'
  }
  return null
}
```

3. **Agregar handler de upload:**
```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  const error = validateFile(file)
  if (error) {
    setFileError(error)
    setSelectedFile(null)
    return
  }
  
  setFileError(null)
  setSelectedFile(file)
}
```

4. **Modificar handleSubmit:**
```typescript
const handleSubmit = async () => {
  if (!isValid()) return
  
  let proofUrl: string | undefined
  let proofFileName: string | undefined
  let proofFileType: string | undefined
  let proofFileSize: number | undefined
  
  // Upload file if selected
  if (selectedFile) {
    try {
      const uploadResult = await uploadShippingProof(order.id, selectedFile)
      proofUrl = uploadResult.url
      proofFileName = selectedFile.name
      proofFileType = selectedFile.type
      proofFileSize = selectedFile.size
    } catch (error) {
      console.error('Upload failed:', error)
      // Show error toast
      return // Stop flow
    }
  }
  
  onConfirm({
    shipping_provider: selectedProvider,
    tracking_number: trackingNumber.trim(),
    tracking_url: trackingUrl.trim() || undefined,
    shipping_proof_url: proofUrl,
    shipping_proof_file_name: proofFileName,
    shipping_proof_file_type: proofFileType,
    shipping_proof_file_size: proofFileSize
  })
}
```

5. **Agregar UI en JSX:**
```tsx
{/* Comprobante de envío */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Comprobante / guía de envío (opcional)
  </label>
  <input
    type="file"
    accept="image/jpeg,image/png,application/pdf"
    onChange={handleFileChange}
    disabled={loading}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
  />
  {fileError && (
    <p className="text-xs text-red-500 mt-1">{fileError}</p>
  )}
  {selectedFile && !fileError && (
    <p className="text-xs text-green-600 mt-1">
      ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
    </p>
  )}
  <p className="text-xs text-gray-500 mt-1">
    Formatos: JPG, PNG o PDF. Máximo 5 MB.
  </p>
</div>
```

---

**File 2:** `src/lib/supabase-upload.ts` (nuevo helper)

**Crear función de upload:**
```typescript
import { supabaseAdmin } from './supabase-admin'

export async function uploadShippingProof(
  orderId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${orderId}/${timestamp}_${safeName}`
  
  const { data, error } = await supabaseAdmin.storage
    .from('shipping-proofs')
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    })
  
  if (error) {
    console.error('[UPLOAD] Shipping proof upload failed:', error)
    throw new Error('Upload failed')
  }
  
  // Generate signed URL (7 days expiration)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from('shipping-proofs')
    .createSignedUrl(path, 604800) // 7 days
  
  if (signedError || !signedData) {
    console.error('[UPLOAD] Failed to generate signed URL:', signedError)
    throw new Error('Failed to generate URL')
  }
  
  return {
    url: signedData.signedUrl,
    path: data.path
  }
}
```

---

**File 3:** `src/lib/email/templates/shipping-tracking.ts`

**Cambios:**

1. **Actualizar interface:**
```typescript
interface ShippingTrackingParams {
  // ... existing
  shippingProofUrl?: string;  // NUEVO
}
```

2. **Agregar bloque HTML:**
```typescript
// Después del tracking box, antes del párrafo de tiempo estimado
${params.shippingProofUrl ? `
  <div style="margin: 24px 0; padding: 16px; background: #F5F1ED; border-radius: 8px; text-align: center;">
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
      📄 Comprobante de envío disponible
    </p>
    <a href="${params.shippingProofUrl}" 
       class="button" 
       style="background: #111111; display: inline-block; background: #111111; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; text-align: center;">
      Ver Guía de Envío
    </a>
  </div>
` : ''}
```

---

**File 4:** Tracking page (necesita identificar archivo exacto)

**Cambios:**

1. **Fetch incluir shipping_proof_url:**
```typescript
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    shipping_proof_url  // AGREGAR
  `)
  .eq('tracking_token', token)
  .single()
```

2. **Agregar bloque condicional en JSX:**
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
      className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
    >
      Ver Comprobante
    </a>
  </div>
)}
```

---

## F. IMPLEMENTATION PLAN

### FASE 1: MIGRATION + BACKEND (1-1.5h)

1. **Crear migration SQL**
   - File: `supabase/migrations/019_add_shipping_proof.sql`
   - Agregar 4 columnas a orders
   - Crear bucket shipping-proofs
   - Ejecutar en Supabase Studio

2. **Actualizar API endpoint**
   - File: `src/app/api/orders/[id]/shipping/route.ts`
   - Aceptar nuevos parámetros
   - Incluir en updates
   - Pasar a email template

3. **Crear helper de upload**
   - File: `src/lib/supabase-upload.ts`
   - Función `uploadShippingProof(orderId, file)`
   - Generar signed URL con expiración 7 días

4. **Testing backend**
   - Upload manual con Postman/curl
   - Verificar URL firmada funciona
   - Verificar campos guardan correctamente

---

### FASE 2: FRONTEND ADMIN (1.5-2h)

1. **Modificar MarcarEnviadoModal**
   - Agregar estado para archivo
   - Agregar validación cliente
   - Agregar input file en UI
   - Modificar handleSubmit con upload

2. **Testing modal**
   - Validar formato/tamaño
   - Upload exitoso
   - Upload fallido (rollback)
   - UI muestra nombre archivo

---

### FASE 3: EMAIL + TRACKING PAGE (1h)

1. **Actualizar email template**
   - Agregar parámetro shippingProofUrl
   - Agregar bloque HTML condicional

2. **Modificar tracking page**
   - Identificar archivo exacto
   - Agregar fetch shipping_proof_url
   - Agregar bloque condicional en UI

3. **Testing email + tracking**
   - Enviar email test con proof
   - Verificar link funciona
   - Verificar tracking page muestra bloque
   - Verificar sin proof sigue funcionando

---

### FASE 4: QA COMPLETA (30min)

1. **Flow completo admin → cliente:**
   - Admin marca enviado SIN comprobante
   - Admin marca enviado CON comprobante
   - Cliente recibe email con/sin link
   - Cliente ve tracking page con/sin comprobante

2. **Edge cases:**
   - Upload falla (rollback correcto)
   - Archivo muy grande (validación frontend)
   - Formato no permitido (validación frontend)
   - URL firmada expirada (regenerar)

---

## G. RISKS & MITIGATIONS

### RIESGO 1: Upload falla pero orden se marca como shipped

**Mitigación:**
- Upload PRIMERO, update orden DESPUÉS
- Si upload falla, NO llamar API de shipping
- Mostrar error claro al admin
- Rollback automático si update falla después de upload

---

### RIESGO 2: URL firmada expira después de 7 días

**Mitigación:**
- Regenerar URL firmada on-demand en tracking page
- Agregar endpoint `/api/orders/[id]/shipping-proof-url` que regenere
- Caché signed URL por 6 días en DB (opcional)

---

### RIESGO 3: Bucket se llena (storage limit Supabase)

**Mitigación:**
- Monitorear uso de storage mensualmente
- Implementar cleanup de archivos antiguos (>90 días)
- Comprimir imágenes antes de subir (frontend)

---

### RIESGO 4: Admin sube archivo equivocado

**Mitigación:**
- Preview de archivo antes de confirmar (opcional)
- Permitir re-upload (sobrescribir)
- Log de cambios (quién subió, cuándo)

---

## H. FUTURE ENHANCEMENTS

**Fase 2 (opcional):**
1. Preview de archivo en modal antes de subir
2. Editar envío existente (cambiar proof)
3. Historial de proofs subidos
4. Notificación al cliente cuando se sube proof
5. OCR automático para extraer tracking number de imagen
6. Compresión automática de imágenes grandes

**Fase 3 (opcional):**
1. Permitir múltiples archivos (guía + foto paquete)
2. Integración directa con API de DHL/FedEx para obtener proof
3. Generación automática de guía PDF desde datos de orden

---

## I. DECISION REQUIRED

**¿Proceder con implementación?**

**Opciones:**

**A) SÍ — Implementar ahora (antes de Stripe Live)**
- Tiempo estimado: 3-4 horas
- Beneficio: UX completa para primer cliente real
- Riesgo: Retraso en launch (3-4h)

**B) NO — Postponer para post-launch**
- Implementar después de validar Stripe Live
- Beneficio: Launch más rápido
- Riesgo: Cliente no ve proof en primer envío

**C) MVP MÍNIMO — Solo backend + email (sin UI admin)**
- Admin sube manualmente a Supabase Storage
- Admin copia URL y la pega en DB
- Email y tracking page funcionan
- Tiempo: 1 hora
- UX admin: Manual (no ideal)

---

## J. RECOMMENDATION

**Recomendación:** **OPCIÓN B — Postponer para post-launch**

**Motivo:**
1. Stripe Live es prioridad crítica (ingresos)
2. Feature es nice-to-have, no blocker
3. Admin puede enviar proof por WhatsApp temporalmente
4. Implementar limpio después de validar payments
5. Cliente verá feature en segundo envío

**Plan de ejecución:**
1. Ahora: Completar QA manual de payments
2. Ahora: Activar Stripe Live
3. Mañana: Implementar Shipping Proof MVP (3-4h)
4. Mañana: Deploy + QA
5. Listo para segundo cliente

---

**AUDIT COMPLETADA — READY FOR DECISION**

**Files afectados identificados:** 7
**Tiempo estimado implementación:** 3-4 horas
**Complejidad:** LOW
**Riesgo técnico:** LOW
**Blocker:** NO

---

END OF AUDIT REPORT
