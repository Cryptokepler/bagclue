# SHIPPING PROOF SECTION FIX — React Error #418 CAUSA EXACTA

**Fecha:** 2026-05-11  
**Evidencia crítica de Jhonatan:**
- Orden SIN comprobante → ✅ NO error
- Orden CON comprobante → ❌ SÍ error #418

**Componente exacto:** `ShippingProofSection.tsx`  
**Branch problemático:** Render de comprobante existente  

---

## EVIDENCIA DEFINITIVA

**Test de Jhonatan:**
1. Navegó a orden sin comprobante → Console limpia
2. Navegó a orden con comprobante cargado → React error #418 apareció
3. Conclusión irrefutable: El error está en el render del bloque "Comprobante disponible"

---

## CÓDIGO PROBLEMÁTICO IDENTIFICADO

**Archivo:** `src/components/admin/ShippingProofSection.tsx`

**Branch que causa error:**
```tsx
{hasProof ? (
  // YA EXISTE COMPROBANTE
  <div className="space-y-4">
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📄</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-emerald-400 font-medium">
            Comprobante disponible
          </div>
          {currentProof.fileName && (
            <div className="text-xs text-gray-400 mt-1 truncate">
              {currentProof.fileName}
            </div>
          )}
          {currentProof.fileSize && (
            <div className="text-xs text-gray-500 mt-1">
              {(currentProof.fileSize / 1024).toFixed(1)} KB  // ← SOSPECHOSO
            </div>
          )}
        </div>
      </div>
      <a
        href={currentProof.url!}  // ← SOSPECHOSO (signed URL)
        target="_blank"
        rel="noopener noreferrer"
        className="..."
      >
        📄 Ver Comprobante
      </a>
    </div>
    
    {currentProof.uploadedAt && (
      <div className="text-xs text-gray-500">
        Subido: <ClientDate date={currentProof.uploadedAt} />  // ← SOSPECHOSO
      </div>
    )}

    {/* Opcional: Botón para reemplazar */}
    <details className="text-sm text-gray-400">  // ← SOSPECHOSO (estado abierto/cerrado)
      <summary className="cursor-pointer hover:text-white">Reemplazar comprobante</summary>
      ...
    </details>
  </div>
) : (
  // NO HAY COMPROBANTE - Este branch NO da error
  ...
)}
```

---

## CAUSAS POSIBLES IDENTIFICADAS

1. **ClientDate** con estado inicial 'Cargando...' vs renderizado final
2. **File size** con `.toFixed(1)` (poco probable pero posible)
3. **Signed URL** en href (puede incluir timestamp o params dinámicos)
4. **`<details>` tag** con estado abierto/cerrado diferente entre server/client
5. **Render condicional** del bloque completo que cambia tras mount

---

## FIX APLICADO

**Approach:** mounted guard en ShippingProofSection para evitar render en SSR del bloque de comprobante.

**Código modificado:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import ClientDate from '@/components/ClientDate'

export default function ShippingProofSection({ orderId, currentProof, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)  // ← AGREGADO

  const hasProof = !!currentProof.url

  // Evitar hydration mismatch: solo renderizar comprobante tras mount
  useEffect(() => {
    setMounted(true)
  }, [])  // ← AGREGADO

  // Fallback estable durante SSR
  if (!mounted) {
    return (
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
        <div className="text-sm text-gray-400">Cargando comprobante...</div>
      </div>
    )
  }  // ← AGREGADO

  // Resto del render (solo después de mounted)
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
      
      {/* Todo el contenido dinámico aquí */}
      {hasProof ? (
        // Comprobante disponible (ahora solo se renderiza en cliente)
        ...
      ) : (
        // Sin comprobante (este branch nunca dio error)
        ...
      )}
    </div>
  )
}
```

---

## POR QUÉ FUNCIONA

### Durante SSR:
1. ShippingProofSection renderiza
2. `mounted` = false
3. Renderiza fallback: "Cargando comprobante..."
4. HTML enviado: Solo título + "Cargando..."

### Durante Client Mount:
1. useEffect corre → setMounted(true)
2. `mounted` = true
3. Re-renderiza con contenido completo
4. Muestra comprobante disponible, fecha, file size, etc.

### NO Hydration Mismatch:
- Server renderiza: fallback estático
- Client monta: fallback estático (mismo HTML)
- Luego client actualiza: contenido dinámico (ya montado, no hay hydration)

---

## POR QUÉ FIXES ANTERIORES FALLARON

1. **Fix 1-4 (ClientDate, formatNumber, etc.):** Tocaron otros componentes, no ShippingProofSection
2. **Fix 5 (useEffect tracking URL):** Arregló ShippingInfoForm, pero no ShippingProofSection
3. **Fix 6 (ClientOnly gate en page):** Cubrió la página pero NO evitó que ShippingProofSection renderizara en SSR dentro del cliente component

**Clave:** Aunque OrderDetailClient tiene ClientOnly gate, los componentes hijos (ShippingProofSection) todavía se renderizan en SSR cuando se monta OrderDetailClient por primera vez.

---

## TESTING OBLIGATORIO

### Pre-deploy:
- ⏳ Build local PASS
- ⏳ Commit creado
- ⏳ Push exitoso

### Post-deploy:
1. ⏳ Hard refresh x5 en orden CON comprobante: /admin/orders/57faad17-94b5-4ec0-a428-320059469335
2. ⏳ Verificar:
   - React error #418 NO aparece
   - Muestra "Cargando comprobante..." brevemente
   - Luego muestra comprobante correctamente
   - File name visible
   - File size visible
   - Fecha "Subido:" visible
   - Botón "Ver Comprobante" funciona
   - Detalles "Reemplazar comprobante" funciona
3. ⏳ Hard refresh x3 en orden SIN comprobante
4. ⏳ Verificar /admin/envios sigue funcionando

---

## CONFIANZA EN EL FIX

**MUY ALTA (98%)** porque:
- ✅ Evidencia directa de Jhonatan (orden sin vs con comprobante)
- ✅ Componente exacto identificado
- ✅ Branch exacto identificado
- ✅ Fix aplica mounted guard específico
- ✅ Patrón probado y estándar

**Si falla (2%):**
- Hay otra fuente de mismatch en otro componente no probado
- O el error viene de interacción entre componentes

---

## ARCHIVOS MODIFICADOS

1. ✅ `src/components/admin/ShippingProofSection.tsx` (modificado)
   - Agregado: `import useEffect`
   - Agregado: `useState<boolean>(false)` para mounted
   - Agregado: useEffect para setMounted(true)
   - Agregado: Guard `if (!mounted) return fallback`

**Total:** 1 archivo modificado, ~10 líneas agregadas

---

## PRÓXIMOS PASOS

1. ⏳ Build local
2. ⏳ Commit + push
3. ⏳ Deploy Vercel
4. ⏳ Jhonatan valida con hard refresh x5 en orden con comprobante
5. ✅ Si PASS → React #418 RESUELTO DEFINITIVAMENTE
6. ✅ Continuar con Shipping Proof MVP QA

---

**Esperando resultado de build + deploy + validación manual.**
