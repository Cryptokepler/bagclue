# ADMIN PRODUCTO SLUG — AUDITORÍA Y PROPUESTA

**Fecha:** 2026-05-04  
**Estado:** AUDIT COMPLETADO — IMPLEMENTACIÓN NO AUTORIZADA  
**Decisión:** Postponer hasta fase dedicada "ADMIN PRODUCTOS - Auto-generación de slug"

---

## CONTEXTO

Durante el fix del bug 404 de productos (commit 336c864), se detectó que el sistema de slugs tiene problemas estructurales que requieren atención en una fase futura dedicada.

**Fix actual aplicado:**
- ✅ ProductCard usa `product.slug || product.id` (fallback para compatibilidad)
- ✅ Producto test corregido: slug `"25-small-negra"` (URL-friendly)
- ✅ Interface `Product` con `slug?: string` (opcional)

**Lo que NO se implementó (pendiente para fase futura):**
- ❌ Auto-generación de slug en backend
- ❌ Validación URL-safe en frontend
- ❌ Migración de slugs existentes
- ❌ Eliminación/ocultación del campo slug en formulario admin

---

## PROBLEMA ACTUAL

### 1. Slug es manual y sin validación

**Frontend (`/admin/productos/new`):**
```tsx
<input
  type="text"
  name="slug"
  value={formData.slug}
  onChange={handleChange}
  required
  placeholder="chanel-classic-flap-negro"
/>
```

**Problemas:**
- ❌ Usuario debe escribir el slug manualmente
- ❌ Input acepta espacios, mayúsculas, acentos, caracteres especiales
- ❌ No hay validación en tiempo real
- ❌ Riesgo alto de errores humanos

**Backend (`/api/products/create`):**
```typescript
// Valida unicidad
const { data: existing } = await supabaseAdmin
  .from('products')
  .select('id')
  .eq('slug', slug)
  .single()

if (existing) {
  return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 })
}

// Pero acepta slug tal cual (sin transformación)
const { data: product } = await supabaseAdmin
  .from('products')
  .insert({ slug, title, brand, ... })
```

**Problemas:**
- ✅ Valida unicidad (correcto)
- ❌ NO transforma slug a URL-safe
- ❌ Acepta cualquier texto que venga del frontend
- ❌ No genera slug automáticamente

---

### 2. Riesgos del sistema actual

**Riesgo 1: URLs rotas**
- Usuario escribe: `"25 Small Negra"` (con espacios y mayúsculas)
- DB guarda: `"25 Small Negra"`
- ProductCard genera: `/catalogo/25 Small Negra` (URL inválida)
- Resultado: 404

**Riesgo 2: SEO inconsistente**
- Diferentes usuarios crean productos similares con slugs diferentes:
  - `"chanel-classic-flap"`
  - `"Chanel Classic Flap"`
  - `"chanel_classic_flap"`
  - `"ChanelClassicFlap"`
- Dificulta análisis, búsquedas y reporting

**Riesgo 3: Duplicados no detectados**
- Slug `"chanel-25"` vs `"Chanel-25"` → sistema los ve como diferentes
- Usuario puede crear duplicados sin darse cuenta

**Riesgo 4: Fricción operativa**
- Pilar/admin debe pensar en cómo escribir el slug
- Pérdida de tiempo en decisiones triviales
- Errores frecuentes → correcciones manuales

---

### 3. Ejemplo real del problema

**Producto test creado:**
- Marca: `Chanel`
- Modelo: `25`
- Color: `negro`
- **Slug inicial (mal):** `"25 small negra"` (espacios, minúsculas inconsistentes)
- **Slug corregido (manual):** `"25-small-negra"` (después del error)

**Sin auto-generación, este problema se repetirá en cada producto nuevo.**

---

## PROPUESTA DE SOLUCIÓN

### Objetivo
Que el sistema genere slugs automáticamente de forma consistente, URL-safe y única, eliminando la carga manual del usuario.

---

### 1. Función de generación de slug

**Implementación recomendada:**

```typescript
/**
 * Genera slug URL-safe desde brand, model y color
 * Ejemplo: generateSlug('Chanel', '25 Small', 'Negra') → 'chanel-25-small-negra'
 */
function generateSlug(brand: string, model?: string, color?: string): string {
  // 1. Construir partes (filtrar vacíos)
  const parts = [brand, model, color].filter(Boolean)
  
  // 2. Unir con espacios
  const rawSlug = parts.join(' ')
  
  // 3. Transformar a URL-safe
  return rawSlug
    .toLowerCase()                                      // Minúsculas
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Sin acentos (é → e)
    .replace(/[^a-z0-9\s-]/g, '')                     // Solo letras, números, espacios, guiones
    .replace(/\s+/g, '-')                              // Espacios → guiones
    .replace(/-+/g, '-')                               // Múltiples guiones → uno solo
    .replace(/^-|-$/g, '')                             // Trim guiones inicio/fin
}

// Ejemplos:
generateSlug('Chanel', '25 Small', 'Negra')     // → "chanel-25-small-negra"
generateSlug('Hermès', 'Birkin', 'Azul Royal')  // → "hermes-birkin-azul-royal"
generateSlug('Louis Vuitton', 'Neverfull')      // → "louis-vuitton-neverfull"
generateSlug('Goyard', 'St. Louis', '')         // → "goyard-st-louis"
```

**Características:**
- ✅ Minúsculas siempre
- ✅ Sin acentos (Hermès → hermes)
- ✅ Sin caracteres especiales (puntos, comas, etc.)
- ✅ Espacios → guiones
- ✅ Consistente y predecible

---

### 2. Estrategia de unicidad

**Problema:** Dos productos con misma marca + modelo + color

**Solución:** Agregar sufijo numérico si slug ya existe

```typescript
/**
 * Asegura que el slug sea único, agregando sufijo si existe
 * Ejemplo: "chanel-25-small-negra" → "chanel-25-small-negra-2"
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 2
  
  while (true) {
    // Verificar si slug existe
    const { data } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (!data) {
      // Slug disponible
      return slug
    }
    
    // Ya existe → agregar sufijo
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// Ejemplos:
// Si "chanel-25-small-negra" existe:
// → "chanel-25-small-negra-2"
// Si "chanel-25-small-negra-2" también existe:
// → "chanel-25-small-negra-3"
```

---

### 3. Campos sugeridos para generación

**Prioridad 1:** `brand + model + color`
```typescript
generateSlug(brand, model, color)
// Chanel + 25 Small + Negra → "chanel-25-small-negra"
```

**Prioridad 2 (fallback):** `brand + title`
```typescript
generateSlug(brand, title, '')
// Si model está vacío, usar title como fuente
```

**Razón:**
- Marca + modelo + color = identificación única y descriptiva
- SEO-friendly
- Coincide con cómo usuarios buscan productos

---

### 4. Implementación en backend

**Archivo:** `/api/products/create/route.ts`

**Cambios propuestos:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... auth y validaciones ...
    
    const { title, brand, model, color, /* ... otros campos */ } = body
    
    // NUEVO: Generar slug automáticamente
    const baseSlug = generateSlug(brand, model, color)
    const slug = await ensureUniqueSlug(baseSlug)
    
    // QUITAR del body la validación de slug requerido
    // ANTES: if (!slug || !title || !brand) { ... }
    // DESPUÉS: if (!title || !brand || !category) { ... }
    
    // Insertar con slug generado
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        slug,  // ← Generado automáticamente
        title,
        brand,
        model,
        color,
        // ... otros campos
      })
      .select()
      .single()
    
    // ... manejo de errores y respuesta ...
  }
}
```

**También actualizar:** `/api/products/[id]/route.ts` (edición de productos)
- Si cambian brand/model/color → regenerar slug (opcional)
- O mantener slug original para no romper URLs existentes

---

### 5. Cambios en frontend

**Opción A (RECOMENDADA): Ocultar campo slug**

```tsx
// /admin/productos/new/page.tsx

// ELIMINAR esto:
<div>
  <label>Slug *</label>
  <input
    type="text"
    name="slug"
    value={formData.slug}
    onChange={handleChange}
    required
  />
</div>

// AGREGAR mensaje informativo (opcional):
<p className="text-xs text-gray-500">
  ℹ️ El slug se generará automáticamente desde marca + modelo + color
</p>
```

**Opción B: Hacer campo read-only con preview**

```tsx
<div>
  <label>Slug (auto-generado)</label>
  <input
    type="text"
    value={previewSlug}  // Generado en tiempo real
    readOnly
    className="bg-gray-50 cursor-not-allowed"
  />
  <p className="text-xs text-gray-500">
    Se generará desde: {brand} + {model} + {color}
  </p>
</div>
```

**Estado del formulario:**

```typescript
// ANTES:
const [formData, setFormData] = useState({
  slug: '',  // ← Usuario debe llenarlo
  title: '',
  brand: 'Chanel',
  model: '',
  color: '',
  // ...
})

// DESPUÉS (Opción A):
const [formData, setFormData] = useState({
  // slug: '',  ← Eliminado
  title: '',
  brand: 'Chanel',
  model: '',
  color: '',
  // ...
})

// Backend recibe:
// { title, brand, model, color, ... }
// Y genera slug internamente
```

---

### 6. Migración de slugs existentes (opcional)

Si se implementa auto-generación, productos existentes pueden necesitar corrección:

**Opción 1:** Script de migración one-time

```typescript
// scripts/migrate-slugs.ts
async function migrateExistingSlugs() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, brand, model, color, slug')
    .order('created_at', { ascending: true })
  
  for (const product of products) {
    // Generar nuevo slug
    const baseSlug = generateSlug(product.brand, product.model, product.color)
    const newSlug = await ensureUniqueSlug(baseSlug)
    
    // Actualizar solo si es diferente
    if (newSlug !== product.slug) {
      await supabaseAdmin
        .from('products')
        .update({ slug: newSlug })
        .eq('id', product.id)
      
      console.log(`✅ ${product.id}: "${product.slug}" → "${newSlug}"`)
    }
  }
}
```

**Opción 2:** Mantener slugs legacy, solo aplicar a productos nuevos
- Productos existentes conservan su slug
- Nuevos productos usan auto-generación
- Menos riesgo, URLs no se rompen

---

## SKU / CÓDIGO COMERCIAL

### Estado actual
- ❌ NO existe campo `sku` en DB
- ❌ NO existe campo `sku` en formulario admin
- ✅ UUID (`id`) se genera automáticamente

### Propuesta
**NO crear campo SKU ahora.**

**Motivo:**
- SKU es parte de un sistema de inventario avanzado
- Requiere lógica más compleja:
  - Formato específico (ej: `CH-25-SM-BLK-001`)
  - Generación secuencial
  - Relación con stock, ubicaciones, proveedores
  - Códigos de barras
- Mejor implementarlo en fase dedicada: **ADMIN INVENTARIO**

**Qué usar mientras tanto:**
- **Para URLs:** `slug` (corto, SEO-friendly)
- **Para identificación interna:** `id` (UUID único)
- **Para referencia visual:** `id` corto (primeros 8 caracteres)

---

## RECOMENDACIÓN FINAL

### Implementar en fase futura dedicada

**Nombre de fase:** **ADMIN PRODUCTOS — Auto-generación de slug**

**Alcance:**
1. ✅ Función `generateSlug()` en backend
2. ✅ Función `ensureUniqueSlug()` en backend
3. ✅ Actualizar `/api/products/create` (crear con slug auto)
4. ✅ Actualizar `/api/products/[id]` (editar, decisión sobre slug)
5. ✅ Frontend: ocultar campo slug en formulario (o read-only)
6. ✅ Testing exhaustivo (productos nuevos + edición)
7. ⚠️ Migración de slugs existentes (evaluar necesidad)

**Prerrequisitos:**
- E2E compra contado completado ✅
- QA del fix 404 actual ✅
- USER CHECKOUT SUCCESS implementado ✅
- ADMIN FASE 1C cerrada ✅

**Riesgos de implementar ahora:**
- Estamos en medio de E2E compra
- Cambios en creación de productos requieren testing exhaustivo
- Productos existentes pueden necesitar migración
- Mejor hacerlo en fase dedicada con QA completo

**Beneficio de postponer:**
- Fix actual (ProductCard + producto test) ya resuelve el 404
- Sistema funciona con slug manual mientras tanto
- Permite enfocarse en E2E sin abrir frentes adicionales

---

## ESTADO ACTUAL

### ✅ Fix aplicado (commit 336c864)
- ProductCard usa `product.slug || product.id` (fallback)
- Interface `Product` con `slug?: string` (opcional)
- Producto test corregido manualmente: `"25-small-negra"`
- Build PASS, deploy PASS

### ❌ NO implementado (pendiente)
- Auto-generación de slug en backend
- Validación URL-safe en frontend
- Eliminación del campo slug en formulario
- Migración de slugs existentes

### 📋 Documentado
- ✅ Problema diagnosticado
- ✅ Riesgos identificados
- ✅ Propuesta técnica completa
- ✅ Función `generateSlug()` diseñada
- ✅ Estrategia de unicidad definida
- ✅ Cambios frontend/backend especificados
- ✅ Decisión sobre SKU: postponer para ADMIN INVENTARIO

---

## PRÓXIMOS PASOS

1. **Ahora:** Continuar QA manual fix 404 + E2E compra contado
2. **Después:** Cerrar ADMIN FASE 1C (envíos/fulfillment)
3. **Luego:** Implementar USER CHECKOUT SUCCESS completamente
4. **Futuro:** Fase dedicada "ADMIN PRODUCTOS - Auto-generación de slug"

**Criterio de aprobación para fase futura:**
- E2E completo funcionando
- Sistema de compra estable
- Tiempo dedicado sin otras prioridades críticas
- Testing plan completo para cambios en creación de productos

---

**Fecha de audit:** 2026-05-04  
**Decisión:** Postponer implementación  
**Próxima revisión:** Después de cerrar E2E compra contado + ADMIN FASE 1C
