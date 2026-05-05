# MVP.1B — SLUG AUTOMÁTICO BACKEND: SCOPE TÉCNICO

**Fecha:** 2026-05-05  
**Estado:** ⏸️ **PENDIENTE APROBACIÓN**  
**Decisión:** Opción C — Slug 100% automático, NO editable por admin

---

## 1. ARCHIVOS ACTUALES INVOLUCRADOS

### Backend (API routes)
```
/src/app/api/products/create/route.ts
  └─ POST endpoint - crear producto
  └─ Validación de slug único
  └─ Insert a products table

/src/app/api/products/[id]/route.ts
  └─ PATCH endpoint - actualizar producto
  └─ Permite actualizar slug (body.slug)
```

### Frontend (Admin UI)
```
/src/app/admin/productos/new/page.tsx
  └─ Formulario crear producto
  └─ Campo slug requerido (input text)
  └─ formData.slug enviado al backend

/src/components/admin/EditProductForm.tsx
  └─ Formulario editar producto
  └─ Campo slug editable (input text)
  └─ formData.slug enviado en PATCH
```

### Bibliotecas compartidas
```
/src/lib/products-public-fields.ts
  └─ Define campos públicos
  └─ Incluye 'slug' en lista pública (correcto)

/src/lib/supabase-admin.ts
  └─ Cliente Supabase con privilegios admin
  └─ Usado para inserts/updates
```

### Componentes de consumo (NO TOCAR)
```
/src/components/ProductCard.tsx
  └─ Usa slug para Link to /catalogo/[slug]
  └─ NO requiere cambios (sigue funcionando)

/src/app/catalogo/[slug]/page.tsx
  └─ Página detalle producto
  └─ Consume slug desde URL params
  └─ NO requiere cambios
```

---

## 2. CAMBIOS BACKEND

### 2.1. Crear función generateSlug (nueva)

**Ubicación:** `/src/lib/generate-slug.ts`

**Lógica:**
```typescript
/**
 * Genera slug automático URL-safe basado en prioridad:
 * 1. brand + model + title + color (si todos existen)
 * 2. brand + title (fallback)
 * 3. title (fallback final)
 * 
 * Formato:
 * - Lowercase
 * - Sin acentos (á→a, é→e, etc.)
 * - ñ → n
 * - Espacios → guiones
 * - Solo [a-z0-9-]
 * - Múltiples guiones → uno solo
 * - Sin guiones al inicio/final
 * 
 * Ejemplos:
 * - "Chanel Classic Flap 25 Negra" → "chanel-classic-flap-25-negra"
 * - "Hermès Birkin 30 Étoupe" → "hermes-birkin-30-etoupe"
 * - "Louis Vuitton Speedy Azur" → "louis-vuitton-speedy-azur"
 */
export function generateSlugBase(params: {
  brand: string
  title: string
  model?: string | null
  color?: string | null
}): string {
  const { brand, title, model, color } = params
  
  // Prioridad 1: brand + model + title + color
  if (model && color) {
    return normalizeSlug(`${brand} ${model} ${title} ${color}`)
  }
  
  // Prioridad 2: brand + title
  if (brand && title) {
    return normalizeSlug(`${brand} ${title}`)
  }
  
  // Prioridad 3: solo title (fallback final)
  return normalizeSlug(title)
}

function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
    .replace(/ñ/g, 'n') // ñ → n
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios → guiones
    .replace(/-+/g, '-') // Múltiples guiones → uno
    .replace(/^-|-$/g, '') // Sin guiones al inicio/final
}
```

**Tests unitarios incluidos:**
```typescript
// generateSlugBase({ brand: 'Chanel', title: 'Classic Flap 25', model: '25', color: 'Negra' })
// → "chanel-25-classic-flap-25-negra"

// generateSlugBase({ brand: 'Hermès', title: 'Birkin 30', model: null, color: null })
// → "hermes-birkin-30"

// generateSlugBase({ brand: 'Louis Vuitton', title: 'Speedy Azur ñ París', model: 'Speedy', color: 'Azur' })
// → "louis-vuitton-speedy-speedy-azur-azur-n-paris"
```

---

### 2.2. Estrategia de unicidad

**Función:** `ensureUniqueSlug(baseSlug: string): Promise<string>`

**Ubicación:** `/src/lib/generate-slug.ts`

**Lógica:**
1. Verificar si `baseSlug` existe en DB
2. Si NO existe → retornar `baseSlug`
3. Si existe → intentar `baseSlug-2`, `baseSlug-3`, etc.
4. Límite: 100 intentos (después throw error)
5. NO usar UUID en MVP (solo sufijo numérico)

**Pseudocódigo:**
```typescript
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('slug', baseSlug)
    .single()
  
  if (!data) return baseSlug // Slug base está libre
  
  // Buscar sufijo disponible
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('slug', candidate)
      .single()
    
    if (!existing) return candidate
  }
  
  // Fallback extremo: UUID corto (solo si falla todo)
  const shortId = generateShortId() // 8 caracteres aleatorios
  return `${baseSlug}-${shortId}`
}

function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}
```

**Optimización:** Considerar query con `LIKE 'baseSlug%'` para reducir queries, pero en MVP con pocos productos, estrategia iterativa es aceptable.

---

### 2.3. Modificar API `/api/products/create`

**Cambios:**

1. **Remover validación de slug requerido**
   ```typescript
   // ANTES:
   if (!slug || !title || !brand || !category || !status || !condition) {
     return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
   }
   
   // DESPUÉS:
   if (!title || !brand || !category || !status || !condition) {
     return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
   }
   ```

2. **Ignorar slug del body (si viene)**
   ```typescript
   const { slug: _ignored, title, brand, model, color, ... } = body
   // Ya no destructurar slug para uso
   ```

3. **Generar slug automático**
   ```typescript
   import { generateSlugBase, ensureUniqueSlug } from '@/lib/generate-slug'
   
   // Generar slug base
   const slugBase = generateSlugBase({
     brand,
     title,
     model: model || null,
     color: color || null
   })
   
   // Asegurar unicidad
   const finalSlug = await ensureUniqueSlug(slugBase)
   ```

4. **Remover validación de slug único (ya no necesaria)**
   ```typescript
   // REMOVER ESTE BLOQUE:
   const { data: existing } = await supabaseAdmin
     .from('products')
     .select('id')
     .eq('slug', slug)
     .single()
   
   if (existing) {
     return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 })
   }
   ```

5. **Usar finalSlug en insert**
   ```typescript
   const { data: product, error } = await supabaseAdmin
     .from('products')
     .insert({
       slug: finalSlug, // ← usar slug generado
       title,
       brand,
       // ... resto de campos
     })
   ```

**Archivo completo modificado:** Ver sección 8 (ejemplo completo)

---

### 2.4. Modificar API `/api/products/[id]` (PATCH)

**Cambios:**

1. **Prevenir actualización de slug**
   ```typescript
   // REMOVER esta línea:
   if (body.slug !== undefined) updates.slug = body.slug
   
   // Agregar comentario:
   // slug no es editable - se mantiene el original
   ```

2. **Opcional: Registrar advertencia si intentan cambiar slug**
   ```typescript
   if (body.slug !== undefined && body.slug !== product.slug) {
     console.warn(`Intento de cambiar slug ignorado: ${product.slug} → ${body.slug}`)
   }
   ```

**Impacto:** EditProductForm puede seguir enviando slug en el body, pero backend lo ignora silenciosamente.

---

## 3. CAMBIOS FRONTEND

### 3.1. Formulario crear producto (`/admin/productos/new/page.tsx`)

**Cambios:**

1. **Remover campo slug del formData**
   ```typescript
   // ANTES:
   const [formData, setFormData] = useState({
     slug: '',
     title: '',
     // ...
   })
   
   // DESPUÉS:
   const [formData, setFormData] = useState({
     // slug removido - se genera automáticamente
     title: '',
     // ...
   })
   ```

2. **Remover input de slug del JSX**
   ```typescript
   // REMOVER ESTE BLOQUE COMPLETO:
   <div>
     <label className="block text-sm text-gray-300 mb-2">
       Slug * <span className="text-xs text-gray-500">(URL única)</span>
     </label>
     <input
       type="text"
       name="slug"
       value={formData.slug}
       onChange={handleChange}
       required
       className="..."
       placeholder="chanel-classic-flap-negro"
     />
   </div>
   ```

3. **Agregar texto informativo (helper)**
   ```tsx
   {/* Información básica */}
   <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
     <h2 className="text-lg text-white font-medium mb-4">Información Básica</h2>
     
     {/* Helper slug automático */}
     <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
       ℹ️ El enlace del producto (URL) se genera automáticamente basado en marca, modelo y título.
     </div>
     
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {/* Campos existentes */}
     </div>
   </div>
   ```

4. **Slug ya no se envía al backend**
   ```typescript
   // En handleSubmit, formData ya no contiene slug
   const res = await fetch('/api/products/create', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData) // slug no está aquí
   })
   ```

---

### 3.2. Formulario editar producto (`EditProductForm.tsx`)

**Cambios:**

1. **Mostrar slug como read-only (opcional)**
   ```tsx
   {/* En sección Información Básica */}
   <div>
     <label className="block text-sm text-gray-300 mb-2">
       URL del producto
     </label>
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

2. **Alternativa: Ocultar completamente el campo slug**
   ```tsx
   // No mostrar nada relacionado con slug
   // El slug sigue en formData pero no es visible ni editable
   ```

3. **Backend ignora slug en PATCH, así que formData.slug puede seguir existiendo sin problema**

**Decisión final:** Mostrar slug como read-only con texto explicativo (mejor UX).

---

## 4. FUNCIÓN generateSlug (implementación completa)

**Archivo:** `/src/lib/generate-slug.ts`

```typescript
import { supabaseAdmin } from './supabase-admin'

/**
 * Parámetros para generar slug
 */
interface SlugParams {
  brand: string
  title: string
  model?: string | null
  color?: string | null
}

/**
 * Genera slug base URL-safe basado en prioridad de campos
 */
export function generateSlugBase(params: SlugParams): string {
  const { brand, title, model, color } = params
  
  // Prioridad 1: brand + model + title + color (todos presentes)
  if (model && color) {
    return normalizeSlug(`${brand} ${model} ${title} ${color}`)
  }
  
  // Prioridad 2: brand + title
  if (brand && title) {
    return normalizeSlug(`${brand} ${title}`)
  }
  
  // Prioridad 3: solo title (fallback)
  return normalizeSlug(title)
}

/**
 * Normaliza texto a formato slug URL-safe
 * - Lowercase
 * - Sin acentos
 * - ñ → n
 * - Solo a-z, 0-9, guiones
 * - Espacios → guiones
 * - Sin guiones múltiples, al inicio o final
 */
function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
    .replace(/ñ/g, 'n') // ñ → n
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios → guiones
    .replace(/-+/g, '-') // Múltiples guiones → uno
    .replace(/^-|-$/g, '') // Remover guiones al inicio/final
}

/**
 * Asegura que el slug sea único en la base de datos
 * Si existe, agrega sufijo numérico: slug-2, slug-3, etc.
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  // Verificar si slug base está disponible
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()
  
  if (!existing) {
    return baseSlug // Slug base está libre
  }
  
  // Buscar sufijo numérico disponible
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    
    const { data: candidateExists } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()
    
    if (!candidateExists) {
      return candidate // Sufijo disponible
    }
  }
  
  // Fallback extremo: UUID corto (solo si 100 colisiones)
  // Esto es altamente improbable en MVP con inventario pequeño
  const shortId = generateShortId()
  return `${baseSlug}-${shortId}`
}

/**
 * Genera ID corto aleatorio (8 caracteres)
 * Solo usado como fallback extremo
 */
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Función principal: genera slug único listo para usar
 */
export async function generateUniqueSlug(params: SlugParams): Promise<string> {
  const baseSlug = generateSlugBase(params)
  return await ensureUniqueSlug(baseSlug)
}
```

**Exports:**
- `generateSlugBase(params)` — genera slug base sin verificar unicidad
- `ensureUniqueSlug(baseSlug)` — agrega sufijo si existe
- `generateUniqueSlug(params)` — función todo-en-uno (recomendada)

---

## 5. ESTRATEGIA UNIQUE SLUG

### Enfoque elegido: Iteración con sufijo numérico

**Ventajas:**
- ✅ URLs legibles y predecibles
- ✅ Fácil de debuggear
- ✅ No requiere índices adicionales
- ✅ Funciona bien con inventario pequeño/mediano (<10K productos)

**Limitaciones:**
- ⚠️ Si hay 100+ productos idénticos, usa UUID corto (edge case)
- ⚠️ Múltiples queries secuenciales (acceptable en MVP)

**Alternativas NO elegidas:**
1. **UUID en slug:** URLs feas (`chanel-a3f9b2c8`)
2. **Timestamp suffix:** No semántico (`chanel-1735829400`)
3. **Query con LIKE:** Más complejo, no necesario en MVP

---

### Optimización futura (post-MVP):
Si el catálogo crece a 1000+ productos:
```typescript
// Buscar todos los slugs similares de una vez
const { data: similar } = await supabaseAdmin
  .from('products')
  .select('slug')
  .like('slug', `${baseSlug}%`)

// Encontrar primer sufijo disponible
const usedSuffixes = similar
  .map(p => p.slug.replace(`${baseSlug}-`, ''))
  .filter(s => /^\d+$/.test(s))
  .map(Number)

const nextSuffix = Math.max(0, ...usedSuffixes) + 1
return `${baseSlug}-${nextSuffix}`
```

**Para MVP: No necesario, estrategia simple es suficiente.**

---

## 6. TESTS

### 6.1. Tests unitarios (generate-slug.ts)

```typescript
// /tests/lib/generate-slug.test.ts

import { generateSlugBase, normalizeSlug } from '@/lib/generate-slug'

describe('generateSlugBase', () => {
  test('prioridad 1: brand + model + title + color', () => {
    const result = generateSlugBase({
      brand: 'Chanel',
      title: 'Classic Flap',
      model: '25',
      color: 'Negra'
    })
    expect(result).toBe('chanel-25-classic-flap-negra')
  })
  
  test('prioridad 2: brand + title (sin model/color)', () => {
    const result = generateSlugBase({
      brand: 'Hermès',
      title: 'Birkin 30',
      model: null,
      color: null
    })
    expect(result).toBe('hermes-birkin-30')
  })
  
  test('prioridad 3: solo title (fallback)', () => {
    const result = generateSlugBase({
      brand: '',
      title: 'Bolsa Vintage Única'
    })
    expect(result).toBe('bolsa-vintage-unica')
  })
  
  test('remover acentos correctamente', () => {
    const result = generateSlugBase({
      brand: 'Céline',
      title: 'Bolsa Azúl París'
    })
    expect(result).toBe('celine-bolsa-azul-paris')
  })
  
  test('convertir ñ a n', () => {
    const result = generateSlugBase({
      brand: 'España',
      title: 'Diseño Español'
    })
    expect(result).toBe('espana-diseno-espanol')
  })
  
  test('remover caracteres especiales', () => {
    const result = generateSlugBase({
      brand: 'Louis Vuitton',
      title: 'Speedy 30 (Edición 2024)'
    })
    expect(result).toBe('louis-vuitton-speedy-30-edicion-2024')
  })
  
  test('múltiples espacios → un guion', () => {
    const result = generateSlugBase({
      brand: 'Chanel',
      title: 'Classic    Flap    Negro'
    })
    expect(result).toBe('chanel-classic-flap-negro')
  })
})
```

---

### 6.2. Tests de integración (API)

**Test manual en Postman/Thunder Client:**

1. **Crear producto con título con acentos**
   ```json
   POST /api/products/create
   {
     "title": "Chanel Classic Flap Negra París",
     "brand": "Chanel",
     "model": "Classic Flap",
     "color": "Negra",
     "category": "Bolsas",
     "status": "available",
     "condition": "excellent"
   }
   ```
   **Esperado:** Slug generado `chanel-classic-flap-chanel-classic-flap-negra-paris-negra`

2. **Crear segundo producto idéntico**
   ```json
   POST /api/products/create
   (mismos datos)
   ```
   **Esperado:** Slug generado `chanel-classic-flap-...-2`

3. **Editar producto (intentar cambiar slug)**
   ```json
   PATCH /api/products/{id}
   {
     "slug": "nuevo-slug-custom",
     "title": "Título Actualizado"
   }
   ```
   **Esperado:** 
   - Slug NO cambia (se mantiene original)
   - Title sí se actualiza

---

### 6.3. Tests visuales (frontend)

**Crear producto:**
1. Ir a `/admin/productos/new`
2. Verificar que NO aparece campo "Slug"
3. Verificar que aparece texto helper: "El enlace del producto se genera automáticamente"
4. Llenar formulario:
   - Título: "Hermès Birkin 30 Étoupe"
   - Marca: Hermès
   - Modelo: Birkin 30
   - Color: Étoupe
5. Crear producto
6. Verificar redirect a `/admin/productos/[id]`
7. Abrir producto en catálogo público
8. Verificar URL: `/catalogo/hermes-birkin-30-hermes-birkin-30-etoupe-etoupe`

**Editar producto:**
1. Ir a `/admin/productos/[id]`
2. Verificar que slug aparece como read-only o no aparece
3. Si aparece, verificar texto: "El enlace del producto no se puede modificar"
4. Editar título del producto
5. Guardar cambios
6. Verificar que slug NO cambió

---

### 6.4. Tests de regresión (no romper existentes)

**Productos existentes:**
1. Verificar que los 4 productos actuales en producción siguen funcionando
2. Abrir cada uno en `/catalogo/[slug]`
3. Verificar que ProductCard sigue usando slug correcto
4. Verificar que checkout/orders no se afectan

**Checkout:**
1. Crear producto de prueba
2. Agregarlo al carrito desde `/catalogo/[slug-generado]`
3. Completar checkout
4. Verificar que order se crea correctamente

---

## 7. RIESGOS

### 7.1. Colisión de slugs (MITIGADO)

**Riesgo:** Dos productos idénticos generan mismo slug base.

**Mitigación:** 
- ✅ `ensureUniqueSlug` agrega sufijo numérico
- ✅ Límite de 100 intentos
- ✅ Fallback a UUID corto en caso extremo

**Probabilidad:** Baja en MVP (inventario <100 productos)

---

### 7.2. Performance con inventario grande (FUTURO)

**Riesgo:** Múltiples queries secuenciales para encontrar sufijo disponible.

**Mitigación actual:** Acceptable en MVP (pocos productos)

**Plan futuro:** 
- Optimizar con query `LIKE` + regex
- Considerar índice en slug (ya existe PRIMARY en slug? revisar)
- Batch processing si se crean múltiples productos a la vez

---

### 7.3. URLs cambian si admin edita brand/title (NO EN MVP)

**Riesgo:** Si admin edita marca/título después de publicar, URLs quedan desactualizadas.

**Decisión:** En MVP, NO regenerar slug al editar (URLs estables > SEO perfecto)

**Plan futuro (post-MVP):**
- Botón manual "Regenerar URL" en edit form
- Redirecciones 301 de slug antiguo → nuevo
- Tabla `product_slug_history` para mantener aliases

---

### 7.4. Productos existentes mantienen slug manual (OK)

**Riesgo:** Los 4 productos actuales tienen slug manual (no generado).

**Mitigación:** 
- ✅ NO re-generar slugs existentes
- ✅ Sistema funciona con ambos (manual + automático)
- ✅ Solo productos NUEVOS usan slug automático

**Validación:** Confirmar que productos existentes siguen funcionando post-deploy.

---

### 7.5. Conflicto si admin crea producto con brand/title idéntico a existente

**Riesgo:** "Chanel Classic Flap Negra" + "Chanel Classic Flap Negra" → slugs con sufijo.

**Impacto:** URLs como `chanel-classic-flap-negra-2` pueden confundir.

**Mitigación:** 
- ✅ Acceptable en MVP (sufijo indica producto diferente)
- ✅ En futuro: advertencia en UI si slug base ya existe

---

## 8. EJEMPLO COMPLETO: API CREATE MODIFICADA

**Archivo:** `/src/app/api/products/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateUniqueSlug } from '@/lib/generate-slug'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      // slug ya no se extrae del body (se genera automáticamente)
      title,
      brand,
      model,
      color,
      origin,
      status,
      condition,
      price,
      currency,
      category,
      badge,
      description,
      is_published,
      includes_box,
      includes_dust_bag,
      includes_papers
    } = body

    // Validaciones básicas (slug removido de validación)
    if (!title || !brand || !category || !status || !condition) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Generar slug único automáticamente
    const slug = await generateUniqueSlug({
      brand,
      title,
      model: model || null,
      color: color || null
    })

    // Crear producto (sin validación manual de slug único)
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        slug, // ← slug generado automáticamente
        title,
        brand,
        model: model || null,
        color: color || null,
        origin: origin || null,
        status,
        condition,
        price: price ? parseFloat(price) : null,
        currency: currency || 'MXN',
        category,
        badge: badge || null,
        description: description || null,
        is_published: is_published || false,
        includes_box: includes_box || false,
        includes_dust_bag: includes_dust_bag || false,
        includes_papers: includes_papers || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

---

## 9. RESUMEN CAMBIOS

### Backend (3 archivos)
1. **NUEVO:** `/src/lib/generate-slug.ts` — lógica de generación de slugs
2. **MODIFICAR:** `/src/app/api/products/create/route.ts` — usar slug automático
3. **MODIFICAR:** `/src/app/api/products/[id]/route.ts` — prevenir edición de slug

### Frontend (2 archivos)
1. **MODIFICAR:** `/src/app/admin/productos/new/page.tsx` — remover campo slug + helper
2. **MODIFICAR:** `/src/components/admin/EditProductForm.tsx` — mostrar slug read-only

### Tests (1 archivo nuevo)
1. **NUEVO:** `/tests/lib/generate-slug.test.ts` — tests unitarios

**Total:** 6 archivos (1 nuevo + 5 modificados)

---

## 10. CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Aprobar lógica de generación de slug (prioridad: brand+model+title+color)
- [ ] Aprobar formato de normalización (lowercase, sin acentos, ñ→n)
- [ ] Aprobar estrategia de unicidad (sufijo numérico -2, -3, etc.)
- [ ] Aprobar límite de intentos (100 + fallback UUID corto)
- [ ] Aprobar NO regenerar slug al editar producto
- [ ] Aprobar ocultar campo slug en crear producto
- [ ] Aprobar mostrar slug read-only en editar producto
- [ ] Confirmar que productos existentes NO se modifican
- [ ] Confirmar que checkout/Stripe/webhook/orders no se tocan

---

## 11. PLAN DE EJECUCIÓN (POST-APROBACIÓN)

1. **Crear `/src/lib/generate-slug.ts`** con tests unitarios
2. **Modificar API create** con slug automático
3. **Modificar API update** para prevenir edición de slug
4. **Modificar formulario crear** (remover campo slug)
5. **Modificar formulario editar** (slug read-only)
6. **Tests manuales** en local (crear/editar productos)
7. **Deploy a Vercel** (preview)
8. **QA en preview:** crear producto de prueba, verificar slug
9. **Deploy a producción**
10. **Validación final:** productos existentes + nuevo producto

---

## 12. ESTIMACIÓN

**Tiempo de implementación:** 1-2 horas  
**Tiempo de testing:** 30 minutos  
**Tiempo de deploy + validación:** 15 minutos  

**Total:** ~2-3 horas

---

**Estado:** ⏸️ PENDIENTE APROBACIÓN  
**Siguiente paso:** Jhonatan aprueba scope → Implementar → QA → Deploy

**Kepler**  
2026-05-05 13:27 UTC
