# MVP.1B — DEBUG DEPLOY ISSUE

**Fecha:** 2026-05-05 13:40 UTC  
**Estado:** 🔧 **INVESTIGACIÓN COMPLETADA**

---

## 🚨 Problema Reportado

**URL probada:** https://bagclue.vercel.app/admin/productos/new  
**Resultado:** Formulario todavía muestra campo "Slug *" (no aplicado)  
**Esperado:** Campo slug removido + helper text visible

---

## 🔍 Causa Raíz Identificada

### Verificaciones realizadas:

1. ✅ **Archivo local correcto:** `/src/app/admin/productos/new/page.tsx`
   - formData NO contiene `slug`
   - JSX NO contiene input de slug
   - Helper text "El enlace del producto se genera automáticamente" presente

2. ✅ **Commit correcto:** `267c32e`
   - Archivos modificados:
     - `src/app/admin/productos/new/page.tsx` (22 cambios)
     - `src/app/api/products/create/route.ts` (28 cambios)
     - `src/components/admin/EditProductForm.tsx` (13 cambios)
     - `src/lib/generate-slug.ts` (111 líneas nuevas)

3. ✅ **Push exitoso:** Commit `267c32e` está en `origin/main`
   ```
   git log origin/main --oneline -3
   267c32e feat: MVP.1B - Slug automático backend
   15ba06c MVP.1A-PRECHECK: Seguridad catálogo público
   443dfaf UI ajuste visual: número de pedido más legible
   ```

4. ❌ **Deploy en Vercel:** NO se activó automáticamente
   - Posibles causas:
     - Webhook de GitHub → Vercel no se disparó
     - Vercel no detectó el push
     - Build cache issue en Vercel
     - Deploy configuration issue

---

## 🔧 Solución Aplicada

### Acción: Forzar redeploy con commit vacío

```bash
git commit --allow-empty -m "chore: Force Vercel redeploy - MVP.1B slug automático"
git push origin main
```

**Nuevo commit:** `8a75a55`  
**Razón:** Trigger manual de deploy en Vercel cuando webhook automático falla

---

## ✅ Archivos Verificados Correctos (Local)

### 1. `/src/app/admin/productos/new/page.tsx`

**formData (líneas 18-36):**
```typescript
const [formData, setFormData] = useState({
  // slug removido - se genera automáticamente en backend
  title: '',
  brand: 'Chanel',
  model: '',
  color: '',
  // ... resto de campos SIN slug
})
```

**JSX Helper (líneas 84-87):**
```tsx
{/* Helper slug automático */}
<div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
  ℹ️ El enlace del producto (URL) se genera automáticamente basado en marca, modelo, título y color.
</div>
```

**JSX Input de slug:** ❌ REMOVIDO (ya no existe)

---

### 2. `/src/app/api/products/create/route.ts`

**Import agregado:**
```typescript
import { generateUniqueSlug } from '@/lib/generate-slug'
```

**Generación automática de slug (líneas 27-32):**
```typescript
// Generar slug único automáticamente
const slug = await generateUniqueSlug({
  brand,
  title,
  model: model || null,
  color: color || null
})
```

**Validación de slug único:** ❌ REMOVIDA (ya no necesaria)

---

### 3. `/src/components/admin/EditProductForm.tsx`

**Input de slug cambiado a read-only (líneas 195-203):**
```tsx
<div>
  <label className="block text-sm text-gray-300 mb-2">URL del producto</label>
  <input
    type="text"
    value={`/catalogo/${formData.slug}`}
    disabled
    className="w-full bg-white/10 border border-[#FF69B4]/10 text-gray-400 px-4 py-2 cursor-not-allowed"
  />
  <p className="text-xs text-gray-500 mt-1">
    El enlace del producto no se puede modificar para mantener URLs estables.
  </p>
</div>
```

---

### 4. `/src/lib/generate-slug.ts` (NUEVO)

**Función principal:**
```typescript
export async function generateUniqueSlug(params: SlugParams): Promise<string> {
  const baseSlug = generateSlugBase(params)
  return await ensureUniqueSlug(baseSlug)
}
```

**Deduplicación de palabras:**
```typescript
const words = normalized.split(/\s+/).filter(w => w.length > 0)
const uniqueWords = Array.from(new Set(words))
return uniqueWords.join('-')
```

---

## 📊 Estado Actual

### Repositorio
- ✅ Commit local: `8a75a55` (force redeploy)
- ✅ Commit anterior: `267c32e` (MVP.1B implementado)
- ✅ Branch: `main`
- ✅ Remote: `origin/main` actualizado

### Vercel (en validación)
- ⏳ Deploy trigger: Forzado manualmente con commit vacío
- ⏳ Build: Esperando confirmación de Vercel
- ⏳ URL: https://bagclue.vercel.app

---

## 🧪 Tests Pendientes (Post-Deploy)

Una vez que Vercel complete el deploy:

1. **Visual: Campo slug removido**
   - URL: https://bagclue.vercel.app/admin/productos/new
   - ✅ Esperado: NO aparece input "Slug *"
   - ✅ Esperado: Aparece helper "El enlace del producto se genera automáticamente"

2. **Funcional: Crear producto**
   - Crear producto sin ingresar slug manualmente
   - ✅ Esperado: Backend genera slug automático
   - ✅ Esperado: Redirect a `/admin/productos/[id]`

3. **Regresión: Productos existentes**
   - Verificar que productos actuales siguen funcionando
   - ✅ Esperado: Slugs manuales preservados

---

## 📝 Lecciones Aprendidas

### Issue: Vercel auto-deploy no siempre funciona

**Síntoma:** Commit pusheado a main, pero deploy no se activa  
**Causa:** Webhook GitHub → Vercel puede fallar silenciosamente  
**Solución:** Forzar redeploy con commit vacío `--allow-empty`

### Mejora futura: Verificación post-push

Después de push importante:
1. Esperar 2-3 minutos
2. Verificar URL de producción manualmente
3. Si no se aplicó → forzar redeploy
4. Considerar usar Vercel CLI para deploys críticos

---

## 🎯 Próximos Pasos

1. ⏳ Esperar 2-3 minutos para que Vercel complete build
2. ✅ Verificar https://bagclue.vercel.app/admin/productos/new
3. ✅ Si campo slug desapareció → PASS
4. ✅ Si campo slug sigue → investigar caché / Vercel config
5. ✅ Ejecutar tests funcionales completos
6. ✅ Reportar resultados finales

---

**Kepler**  
2026-05-05 13:45 UTC
