# ADMIN INVENTARIO MVP.1 — PRODUCTO PROFESIONAL BÁSICO + SLUG AUTOMÁTICO
## Scope Reducido v2 (AJUSTADO)

**Fecha:** 2026-05-04 19:46 UTC  
**Estado:** ✅ AJUSTES APLICADOS — PENDIENTE APROBACIÓN IMPLEMENTACIÓN  
**⚠️ NO IMPLEMENTAR HASTA APROBACIÓN EXPLÍCITA**

---

## AJUSTES APLICADOS (2026-05-04 19:46 UTC)

### 1. ✅ Slug automático SOLO en create
- **Antes:** Regenerar slug al editar brand/model/title/color
- **Ahora:** 
  - ✅ Crear producto → generar slug automático
  - ✅ Editar producto → **mantener slug existente por defecto**
  - ⚠️ **NO regenerar automáticamente** al editar
  - Motivo: Regenerar rompe URLs públicas, SEO y links compartidos
  - Regeneración manual → fase futura (requiere aprobación)

### 2. ✅ Slug con UUID corto limpio
- **Formato:** `chanel-25-small-negra-a1b2c3d4`
- UUID al final, solo 8 caracteres
- Limpio, no muy largo

### 3. ✅ Campo `additional_costs` agregado
- **Tipo:** `DECIMAL(10,2)`
- **Propósito:** Costos adicionales (envío, restauración, comisiones)
- **Rentabilidad:** `cost_price + additional_costs = costo total`
- **Cálculo UI:** No guardar `total_cost` en DB, calcularlo en runtime

### 4. ✅ Auditoría de seguridad SELECT * completada
- **RIESGO CRÍTICO DETECTADO:**
  - `/catalogo/page.tsx` usa `select('*, product_images(*)')`
  - `/catalogo/[id]/page.tsx` usa `select('*, product_images(*)')`
  - Expone TODAS las columnas (incluidos futuros campos internos)
- **PLAN DE MITIGACIÓN:** Ver sección 12 (SEGURIDAD SELECT *)

### 5. ✅ Campos mínimos aprobados actualizados
- **Públicos:** material, condition_notes, authenticity_verified, included_accessories
- **Internos:** cost_price, **additional_costs** ← NUEVO, supplier_name, acquisition_date, physical_location, internal_notes, certificate_notes, serial_number

---

## OBJETIVO

Mejorar la creación y edición de productos con slug automático, campos internos básicos para gestión profesional, y mejor organización del formulario, SIN rediseñar todo el sistema de inventario ni crear tablas nuevas.

**Alcance:**
- Slug automático en create (NO al editar)
- Formulario más profesional con secciones
- Campos internos básicos (cost, additional_costs, supplier, location, etc.)
- Autenticidad y accesorios básicos
- Seguridad: campos internos NO en catálogo público (SELECT explícito)

**NO incluye:**
- Tablas de categorías específicas (bags, shoes, jewelry, accessories)
- Sistema de fotos nuevo
- Dashboard de rentabilidad
- SKU automático
- Suppliers/payments/certificates avanzadas
- Reportes

---

## 1. AUDITORÍA TABLA `products` ACTUAL

### Schema actual (según `database.ts`):

```typescript
export interface Product {
  id: string                    // UUID, PK
  slug: string                  // URL-friendly, unique
  title: string                 // Nombre del producto
  brand: string                 // Marca (Chanel, Hermès, etc.)
  model: string | null          // Modelo específico
  color: string | null          // Color
  origin: string | null         // País de origen
  status: ProductStatus         // available|preorder|reserved|sold|hidden
  condition: ProductCondition   // new|excellent|very_good|good|used
  price: number | null          // Precio de venta
  currency: string              // MXN, USD, EUR
  category: string              // Bolsas, Accesorios, etc.
  badge: string | null          // Badge especial
  description: string | null    // Descripción larga
  is_published: boolean         // Visible en tienda
  includes_box: boolean         // Caja original
  includes_dust_bag: boolean    // Dust bag
  includes_papers: boolean      // Documentos
  created_at: string            // Timestamp
  updated_at: string            // Timestamp
}
```

### Enum types:

```typescript
type ProductStatus = 'available' | 'preorder' | 'reserved' | 'sold' | 'hidden'
type ProductCondition = 'new' | 'excellent' | 'very_good' | 'good' | 'used'
```

---

## 2. CAMPOS EXISTENTES (ANÁLISIS)

### ✅ Campos públicos existentes (20 campos):

| Campo | Tipo | Descripción | Público | Estado |
|-------|------|-------------|---------|--------|
| `id` | UUID | ID único | No | ✅ OK |
| `slug` | String | URL-friendly | Sí (URL) | ⚠️ Manual (mejorar) |
| `title` | String | Nombre | Sí | ✅ OK |
| `brand` | String | Marca | Sí | ✅ OK |
| `model` | String? | Modelo | Sí | ✅ OK |
| `color` | String? | Color | Sí | ✅ OK |
| `origin` | String? | País origen | Sí | ✅ OK |
| `status` | Enum | Estado inventario | Sí | ✅ OK |
| `condition` | Enum | Condición física | Sí | ✅ OK |
| `price` | Number? | Precio venta | Sí | ✅ OK |
| `currency` | String | Moneda | Sí | ✅ OK |
| `category` | String | Categoría | Sí | ✅ OK |
| `badge` | String? | Badge especial | Sí | ✅ OK |
| `description` | String? | Descripción | Sí | ✅ OK |
| `is_published` | Boolean | Publicado | No (control) | ✅ OK |
| `includes_box` | Boolean | Caja incluida | Sí | ✅ OK |
| `includes_dust_bag` | Boolean | Dust bag | Sí | ✅ OK |
| `includes_papers` | Boolean | Documentos | Sí | ✅ OK |
| `created_at` | Timestamp | Creación | No | ✅ OK |
| `updated_at` | Timestamp | Modificación | No | ✅ OK |

**Total existentes: 20 campos**

### ❌ Campos que NO existen pero necesitamos:

**Información interna (gestión):**
1. `material` - Material principal (cuero, caviar, canvas, etc.)
2. `cost_price` - Precio de costo/adquisición
3. **`additional_costs`** ← NUEVO - Costos adicionales (envío, restauración)
4. `supplier_name` - Nombre del proveedor/consignador
5. `acquisition_date` - Fecha de adquisición
6. `physical_location` - Ubicación física en bodega
7. `internal_notes` - Notas internas del admin

**Autenticidad:**
8. `authenticity_verified` - Boolean si fue autenticado
9. `certificate_notes` - Notas sobre certificado/autenticidad
10. `serial_number` - Número de serie (interno)

**Accesorios:**
11. `included_accessories` - JSONB con accesorios extra

**Condición detallada:**
12. `condition_notes` - Texto libre de detalles de condición

**Total nuevos: 12 campos** (+1 additional_costs)

---

## 3. CAMPOS NUEVOS MÍNIMOS PROPUESTOS

### Columnas a agregar a `products`:

| Campo | Tipo | Null | Default | Descripción | Público/Interno |
|-------|------|------|---------|-------------|-----------------|
| `material` | VARCHAR(100) | YES | NULL | Material principal | **Público** |
| `cost_price` | DECIMAL(10,2) | YES | NULL | Precio de costo | **Interno** |
| **`additional_costs`** | **DECIMAL(10,2)** | **YES** | **NULL** | **Costos adicionales** | **Interno** |
| `supplier_name` | VARCHAR(200) | YES | NULL | Proveedor/consignador | **Interno** |
| `acquisition_date` | DATE | YES | NULL | Fecha de adquisición | **Interno** |
| `physical_location` | VARCHAR(100) | YES | NULL | Ubicación en bodega | **Interno** |
| `internal_notes` | TEXT | YES | NULL | Notas internas | **Interno** |
| `authenticity_verified` | BOOLEAN | NO | FALSE | Si fue autenticado | **Público** (boolean) |
| `certificate_notes` | TEXT | YES | NULL | Notas de certificado | **Interno** |
| `serial_number` | VARCHAR(100) | YES | NULL | Número de serie | **Interno** |
| `included_accessories` | JSONB | YES | NULL | Accesorios extra | **Público** |
| `condition_notes` | TEXT | YES | NULL | Detalles de condición | **Público** |

**Total: 12 columnas nuevas** (11 originales + 1 additional_costs)

### Campos calculados (opcionales, no columnas):

- **`total_cost`** - Calculado: `cost_price + additional_costs`
- `margin` - Calculado: `(price - total_cost) / total_cost * 100`
- `profit` - Calculado: `price - total_cost`

**No agregamos columnas calculadas en esta fase. Se calculan en runtime.**

---

## 4. SQL DE MIGRACIÓN PROPUESTA (NO EJECUTAR TODAVÍA)

### ⚠️ VER DOCUMENTO SEPARADO: `ADMIN_INVENTARIO_MVP1A_SQL_MIGRATION.md`

**Nota:** La migración SQL completa con rollback y validaciones está en documento separado por claridad.

**Resumen:**
- 12 columnas nuevas (incluye `additional_costs`)
- Índices para performance
- Comentarios para documentación
- Rollback seguro
- Validaciones post-migración

---

## 5. CAMBIOS EN CREATE PRODUCT (`/admin/productos/new`)

### UI propuesta con secciones

```
┌─────────────────────────────────────────────────┐
│  Crear Nuevo Producto                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  [1] INFORMACIÓN PÚBLICA                        │
│  ┌───────────────────────────────────────────┐ │
│  │ * Marca: [Dropdown]                       │ │
│  │ * Título: [Input]                         │ │
│  │   Modelo: [Input]                         │ │
│  │ * Categoría: [Dropdown]                   │ │
│  │   Color: [Input]                          │ │
│  │   Material: [Input]                       │ │ ← NUEVO
│  │   Origen: [Input]                         │ │
│  │                                           │ │
│  │ * Condición: [Dropdown]                   │ │
│  │   Detalles de condición: [Textarea]       │ │ ← NUEVO
│  │                                           │ │
│  │   Descripción: [Textarea rich]            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [2] PRECIO Y PUBLICACIÓN                       │
│  ┌───────────────────────────────────────────┐ │
│  │ * Precio venta: [Input]                   │ │
│  │ * Moneda: [MXN/USD/EUR]                   │ │
│  │ * Estado: [available/preorder/reserved]   │ │
│  │   Badge: [Input opcional]                 │ │
│  │ ☐ Publicar en tienda                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [3] AUTENTICIDAD Y ACCESORIOS                  │
│  ┌───────────────────────────────────────────┐ │
│  │ ☐ Autenticidad verificada                 │ │ ← NUEVO
│  │   Notas certificado: [Textarea]           │ │ ← NUEVO
│  │   Número de serie: [Input]                │ │ ← NUEVO
│  │                                           │ │
│  │ Accesorios incluidos:                     │ │
│  │ ☐ Caja original                           │ │
│  │ ☐ Dust bag                                │ │
│  │ ☐ Documentos/papers                       │ │
│  │   Extras: [Textarea JSON o text]          │ │ ← NUEVO
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [4] INFORMACIÓN INTERNA (Solo admin)           │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔒 Estos campos NO se muestran al público │ │
│  │                                           │ │
│  │   Precio de costo: [Input]                │ │ ← NUEVO
│  │   Costos adicionales: [Input]             │ │ ← NUEVO
│  │   Proveedor: [Input]                      │ │ ← NUEVO
│  │   Fecha adquisición: [Date]               │ │ ← NUEVO
│  │   Ubicación física: [Input]               │ │ ← NUEVO
│  │   Notas internas: [Textarea]              │ │ ← NUEVO
│  │                                           │ │
│  │ Cálculos automáticos (si cost_price):     │ │
│  │   Costo adquisición: $X                   │ │
│  │   Costos adicionales: $Y                  │ │
│  │   Costo total: $Z (X+Y)                   │ │
│  │   Precio venta: $W                        │ │
│  │   Margen: M%                              │ │
│  │   Ganancia: $G                            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ℹ️ El slug se generará automáticamente        │
│     al guardar el producto.                     │
│                                                 │
│  [Guardar producto]  [Cancelar]                 │
└─────────────────────────────────────────────────┘
```

### Cambios específicos:

**1. Quitar campo `slug`:**
- ❌ Admin NO escribe slug manualmente
- ✅ Slug se genera automáticamente al crear producto
- ✅ **NO se regenera al editar** (mantener slug existente)
- ℹ️ Mostrar slug generado en vista previa o después de crear

**2. Agregar campos nuevos:**
- Material (público)
- Condition notes (público)
- Authenticity verified checkbox (público)
- Certificate notes (interno)
- Serial number (interno)
- Included accessories extra (público)
- Cost price (interno)
- **Additional costs (interno)** ← NUEVO
- Supplier name (interno)
- Acquisition date (interno)
- Physical location (interno)
- Internal notes (interno)

**3. Secciones colapsables:**
- Sección 1: siempre abierta
- Sección 2: siempre abierta
- Sección 3: abierta por defecto
- Sección 4: colapsada por defecto con icono 🔒

**4. Validación:**
- Campos requeridos: brand, title, category, condition, price, status
- Slug se genera automáticamente, no se valida manualmente
- Cost price opcional (si se llena, mostrar cálculos con additional_costs)
- Material recomendado (warning si vacío, no bloqueante)

---

## 6. CAMBIOS EN EDIT PRODUCT (`/admin/productos/[id]`)

### Mismo layout que create

**Diferencias:**
1. ✅ Mostrar slug actual (read-only, NO editable)
2. ⚠️ **NO regenerar slug al editar brand/model/title/color**
3. ✅ Sección adicional: "Fotos" (mantener upload actual)
4. ✅ Botón "Guardar cambios" en vez de "Crear producto"
5. ✅ Mostrar created_at y updated_at al final
6. ✅ Si hay cost_price + additional_costs, mostrar cálculos en tiempo real

### Regenerar slug en edit:

**⚠️ CRÍTICO: NO implementar regeneración automática**

**Política:**
- ✅ Al editar brand/model/title/color → **mantener slug existente**
- ❌ NO regenerar automáticamente
- 🔒 Regeneración manual → fase futura (requiere aprobación)

**Motivo:**
- Regenerar rompe URLs públicas (`/catalogo/[slug]`)
- Rompe SEO (Google indexa URL antigua)
- Rompe links compartidos en redes/WhatsApp
- Genera 404s si cliente guardó bookmark

**Futuro (no MVP.1):**
- Botón "Regenerar slug" con confirmación fuerte
- Warning: "Esto romperá URLs existentes"
- Crear redirect automático de slug viejo → nuevo
- Requiere tabla `slug_redirects` (no en MVP.1)

---

## 7. SLUG AUTOMÁTICO

### Función de generación

**Input:**
```typescript
{
  brand: string
  model?: string
  title: string
  color?: string
  id: string
}
```

**Formato limpio:**
```
{brand}-{model}-{title}-{color}-{uuid8}
```

**Ejemplo:**
```typescript
{
  brand: "Chanel",
  model: "25",
  title: "Small",
  color: "Negra",
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}

// Output:
"chanel-25-small-negra-a1b2c3d4"
```

### Algoritmo:

```typescript
function generateSlug(product: {
  brand: string
  model?: string | null
  title: string
  color?: string | null
  id: string
}): string {
  // 1. Construir partes del slug (solo non-null)
  const parts = [
    product.brand,
    product.model,
    product.title,
    product.color
  ].filter(Boolean) // Eliminar nulls/undefined
  
  // 2. UUID corto (primeros 8 caracteres)
  const uuidShort = product.id.slice(0, 8)
  parts.push(uuidShort)
  
  // 3. Normalizar y limpiar
  const slug = parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')                      // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, '')       // Eliminar diacríticos
    .replace(/[^a-z0-9-]/g, '-')           // Solo alfanuméricos y guiones
    .replace(/-+/g, '-')                   // Colapsar múltiples guiones
    .replace(/^-|-$/g, '')                 // Trim guiones al inicio/fin
  
  return slug
}
```

### Características:

**URL-safe:**
- ✅ Minúsculas
- ✅ Sin acentos (é → e, ñ → n)
- ✅ Sin espacios (→ guiones)
- ✅ Sin caracteres especiales (&, %, $, etc.)
- ✅ Solo: `a-z`, `0-9`, `-`

**Unicidad:**
- UUID corto (8 chars) al final garantiza unicidad
- Si dos productos tienen exactamente mismo brand+model+title+color, el UUID los diferencia
- Probabilidad de colisión: ~0.00000006% (UUID v4)

**Legible y limpio:**
- `chanel-25-small-negra-a1b2c3d4` (limpio, no muy largo)
- Fácil de leer e identificar producto
- SEO-friendly

### Unicidad garantizada

**Validación al crear:**

```typescript
async function ensureUniqueSlug(slug: string): Promise<string> {
  // 1. Verificar si existe
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  
  // 2. Si no existe, OK
  if (!existing) {
    return slug
  }
  
  // 3. Colisión (muy raro con UUID) → agregar sufijo numérico
  let suffix = 2
  let newSlug = `${slug}-${suffix}`
  
  while (suffix <= 100) {
    const { data: check } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle()
    
    if (!check) {
      return newSlug
    }
    
    suffix++
    newSlug = `${slug}-${suffix}`
  }
  
  // Safety: no intentar infinito
  throw new Error('No se pudo generar slug único')
}
```

**Nota:** Con UUID corto incluido, colisiones son extremadamente raras. El sufijo numérico es solo por seguridad extra.

### API endpoint actualizado

**`/api/products/create` (modificar):**

```typescript
// ANTES
const { slug, brand, title, ... } = req.body
if (!slug) {
  return res.status(400).json({ error: 'Slug requerido' })
}

// AHORA
const { brand, model, title, color, ... } = req.body
// NO recibir slug del cliente

// 1. Crear producto primero para obtener UUID
const { data: product, error } = await supabaseAdmin
  .from('products')
  .insert({
    brand,
    model,
    title,
    color,
    // ... otros campos
    slug: 'temp-' + Date.now() // Temporal
  })
  .select()
  .single()

if (error) {
  return res.status(500).json({ error: error.message })
}

// 2. Generar slug con UUID real
const generatedSlug = generateSlug({
  brand,
  model,
  title,
  color,
  id: product.id
})

// 3. Asegurar unicidad (muy raro que falle con UUID)
const finalSlug = await ensureUniqueSlug(generatedSlug)

// 4. Actualizar producto con slug final
await supabaseAdmin
  .from('products')
  .update({ slug: finalSlug })
  .eq('id', product.id)

// 5. Retornar producto con slug final
return res.json({
  success: true,
  product: { ...product, slug: finalSlug }
})
```

### ⚠️ Regenerar slug en edit: PROHIBIDO EN MVP.1

**Política:**
- ❌ NO regenerar slug al editar producto
- ✅ Mantener slug existente siempre
- 🔒 Regeneración manual → requiere aprobación futura

**Código edit:**
```typescript
// En /api/products/[id] PATCH
const { brand, model, title, color, ...otherFields } = req.body

// ⚠️ NUNCA actualizar slug aunque cambien brand/model/title/color
const updates = {
  brand,
  model,
  title,
  color,
  ...otherFields
  // slug: NO TOCAR
}

await supabaseAdmin
  .from('products')
  .update(updates)
  .eq('id', productId)
```

---

## 8. VALIDACIONES

### Client-side (UI)

**Campos requeridos:**
- ✅ brand (dropdown)
- ✅ title (input text)
- ✅ category (dropdown)
- ✅ condition (dropdown)
- ✅ price (input number)
- ✅ currency (dropdown)
- ✅ status (dropdown)

**Validación de formato:**
- price > 0
- cost_price >= 0 (si se llena)
- additional_costs >= 0 (si se llena)
- acquisition_date <= hoy (si se llena)
- serial_number max 100 caracteres
- included_accessories valid JSON (si se usa JSON)

**Warnings (no bloqueantes):**
- ⚠️ Material vacío: "Recomendamos indicar el material"
- ⚠️ Description vacía: "Una descripción ayuda a vender"
- ⚠️ Condition notes vacío si condition != new: "¿Hay detalles de uso?"
- ⚠️ Cost price vacío: "No podrás calcular margen"

---

### Server-side (API)

**Validación estricta:**

```typescript
// 1. Campos requeridos
if (!brand || !title || !category || !condition || price == null || !status) {
  return res.status(400).json({ error: 'Campos requeridos faltantes' })
}

// 2. Valores válidos
if (!['available', 'preorder', 'reserved', 'sold', 'hidden'].includes(status)) {
  return res.status(400).json({ error: 'Status inválido' })
}

if (!['new', 'excellent', 'very_good', 'good', 'used'].includes(condition)) {
  return res.status(400).json({ error: 'Condición inválida' })
}

// 3. Rangos
if (price <= 0) {
  return res.status(400).json({ error: 'Precio debe ser mayor a 0' })
}

if (cost_price != null && cost_price < 0) {
  return res.status(400).json({ error: 'Costo no puede ser negativo' })
}

if (additional_costs != null && additional_costs < 0) {
  return res.status(400).json({ error: 'Costos adicionales no pueden ser negativos' })
}

// 4. Slug único (generado y validado automáticamente)
const finalSlug = await ensureUniqueSlug(generatedSlug)

// 5. JSONB válido
if (included_accessories) {
  try {
    JSON.parse(included_accessories)
  } catch {
    return res.status(400).json({ error: 'included_accessories debe ser JSON válido' })
  }
}
```

---

## 9. CAMPOS PÚBLICOS VS INTERNOS

### 🌐 PÚBLICOS (visibles en catálogo/producto público):

**Identificación:**
- id (en URL)
- slug (URL-friendly)

**Información básica:**
- title
- brand
- model
- category
- color
- material **← NUEVO**
- origin

**Precio:**
- price
- currency

**Condición:**
- condition (enum)
- condition_notes **← NUEVO**

**Estado:**
- status (para mostrar "Disponible", "Pre-venta", etc.)
- badge (si existe)

**Descripción:**
- description

**Accesorios:**
- includes_box
- includes_dust_bag
- includes_papers
- included_accessories **← NUEVO** (JSON con extras)

**Autenticidad (solo indicador):**
- authenticity_verified (boolean) **← NUEVO**
  - Mostrar badge "✅ Autenticidad verificada" si true
  - NO mostrar certificate_notes (interno)

**Fotos:**
- Todas las fotos de `product_images` (actual)

---

### 🔒 INTERNOS (solo admin):

**Costos:**
- cost_price **← NUEVO**
- **additional_costs** **← NUEVO**
- Cálculos: total_cost, margin, profit (computed)

**Procedencia:**
- supplier_name **← NUEVO**
- acquisition_date **← NUEVO**

**Logística:**
- physical_location **← NUEVO**

**Autenticidad (detalles):**
- certificate_notes **← NUEVO**
- serial_number **← NUEVO**

**Notas:**
- internal_notes **← NUEVO**

**Auditoría:**
- created_at
- updated_at

---

## 10. RIESGOS

### Técnicos

**1. Slug duplicados en producción**
- **Riesgo:** Al generar slug, crear duplicados
- **Mitigación:**
  - UUID corto en slug garantiza unicidad casi absoluta
  - Función `ensureUniqueSlug()` valida antes de commit
  - Constraint UNIQUE en columna `slug`
  - Testing exhaustivo de casos edge

**2. Migración de productos existentes**
- **Riesgo:** Productos actuales no tienen nuevos campos
- **Mitigación:**
  - Todos los nuevos campos son `NULL` por defecto (opcionales)
  - Admin puede actualizar después
  - No rompe productos existentes
  - Testing en staging antes de prod

**3. Performance al generar slug**
- **Riesgo:** Múltiples queries para verificar unicidad
- **Mitigación:**
  - UUID en slug hace colisiones extremadamente raras
  - Rara vez necesitará verificar más de 1 vez
  - Si es problema, agregar cache de slugs recientes

**4. Form muy largo**
- **Riesgo:** Admin se abruma con tantos campos
- **Mitigación:**
  - Secciones colapsables (solo una abierta a la vez)
  - Campos opcionales marcados claramente
  - Solo 6 campos requeridos
  - Warnings no bloqueantes

**5. Exposición de campos internos**
- **Riesgo:** SELECT * expone cost_price, supplier_name, etc.
- **Mitigación:** Ver sección 12 (SEGURIDAD SELECT *)

---

### Operativos

**6. Admin acostumbrado a escribir slug**
- **Riesgo:** Confusión al no ver campo de slug
- **Mitigación:**
  - Tutorial/tooltip: "El slug se genera automáticamente"
  - Mostrar slug generado después de crear
  - Documentación clara del cambio

**7. Slug cambios inesperados**
- **Riesgo:** Admin piensa que slug se regenera al editar
- **Mitigación:**
  - ✅ **RESUELTO:** Slug NO se regenera al editar
  - Mostrar slug actual como read-only en edit form
  - Documentación clara: "El slug se mantiene siempre"

**8. Datos internos expuestos por error**
- **Riesgo:** Filtro de campos falla, expone cost_price
- **Mitigación:**
  - Testing exhaustivo de API pública
  - SELECT explícito en queries (NO SELECT *)
  - Auditoría de endpoints públicos
  - Monitoring de respuestas API
  - **Plan detallado en sección 12**

---

### De negocio

**9. Cálculo de margen incorrecto**
- **Riesgo:** Formula mal implementada, admin confía en dato erróneo
- **Mitigación:**
  - Fórmula simple: `(price - (cost_price + additional_costs)) / (cost_price + additional_costs) * 100`
  - Mostrar fórmula en UI (transparencia)
  - Validación manual de casos test
  - Permitir override si hay error

**10. Información sensible en included_accessories**
- **Riesgo:** Admin escribe costo o info sensible en campo público
- **Mitigación:**
  - Tooltip: "Este campo es público. NO incluir costos."
  - Revisar ejemplos en documentación
  - Placeholder: `{"items": ["cadena extra", "llave"]}`

---

## 11. CRITERIOS DE CIERRE

### Funcionales

**1. Slug automático funciona:**
- ✅ Admin NO escribe slug en create
- ✅ Slug se genera desde brand+model+title+color+UUID8
- ✅ Slug es URL-safe (minúsculas, sin acentos, sin espacios)
- ✅ Unicidad garantizada (con UUID corto)
- ✅ **Al editar producto, slug NO se regenera (mantener existente)**
- ✅ Slug mostrado como read-only en edit form

**2. Form mejorado:**
- ✅ 4 secciones visibles (Pública, Precio, Autenticidad, Interna)
- ✅ Sección interna marcada con 🔒
- ✅ Todos los nuevos campos presentes (incluye additional_costs)
- ✅ Campos requeridos validados
- ✅ Warnings mostrados (no bloqueantes)

**3. Campos internos seguros:**
- ✅ cost_price, additional_costs, supplier_name, internal_notes NO aparecen en catálogo público
- ✅ API pública filtra campos sensibles correctamente (SELECT explícito)
- ✅ Solo authenticity_verified (boolean) es público

**4. Migración exitosa:**
- ✅ Migración SQL ejecutada sin errores
- ✅ 12 columnas nuevas agregadas (incluye additional_costs)
- ✅ Productos existentes NO rotos
- ✅ Nuevos campos NULL por defecto OK

**5. Cálculos de margen:**
- ✅ Si hay cost_price + additional_costs, mostrar total_cost, margen y profit
- ✅ Fórmula correcta: `(price - (cost_price + additional_costs)) / (cost_price + additional_costs) * 100`
- ✅ Display en UI claro

---

### No regresión

**6. Funcionalidad existente NO rota:**
- ✅ Productos existentes se muestran correctamente
- ✅ Catálogo público funciona
- ✅ Detalle de producto funciona
- ✅ Checkout funciona
- ✅ Admin puede ver/editar productos existentes
- ✅ Fotos existentes se muestran

**7. Performance OK:**
- ✅ Crear producto <2s
- ✅ Generar slug <500ms
- ✅ Editar producto <2s
- ✅ Listado de productos no más lento

---

### Calidad

**8. Testing:**
- ✅ Crear producto nuevo (todos los campos)
- ✅ Crear producto mínimo (solo requeridos)
- ✅ Editar producto existente (slug NO cambia)
- ✅ Verificar slug único con conflicto simulado
- ✅ Verificar campos internos NO en público
- ✅ Calcular margen correctamente (con additional_costs)
- ✅ Auditoría SELECT * en catálogo público

**9. Documentación:**
- ✅ README o guía de uso para admin
- ✅ Explicación de slug automático
- ✅ Qué campos son públicos vs internos
- ✅ Cómo calcular margen (total_cost = cost_price + additional_costs)

---

## 12. SEGURIDAD SELECT * — PLAN DE MITIGACIÓN

### 🚨 PROBLEMA DETECTADO

**Archivos afectados:**
1. `src/app/catalogo/page.tsx` → `select('*, product_images(*)')`
2. `src/app/catalogo/[id]/page.tsx` → `select('*, product_images(*)')`
3. `src/app/api/products/[id]/route.ts` → `.select()` (admin auth, menor riesgo)

**Impacto:**
- SELECT * retorna TODAS las columnas de products
- Incluye futuros campos internos:
  - cost_price
  - additional_costs
  - supplier_name
  - internal_notes
  - certificate_notes
  - serial_number

**Riesgo:** Exposición de datos sensibles en catálogo público

---

### ✅ SOLUCIÓN OBLIGATORIA

**1. Crear lista de campos públicos**

```typescript
// src/lib/products-public-fields.ts
export const PRODUCT_PUBLIC_FIELDS = `
  id,
  slug,
  title,
  brand,
  model,
  category,
  color,
  material,
  origin,
  condition,
  condition_notes,
  price,
  currency,
  status,
  badge,
  description,
  includes_box,
  includes_dust_bag,
  includes_papers,
  included_accessories,
  authenticity_verified,
  created_at,
  updated_at
`.trim()

// NO incluir:
// - cost_price
// - additional_costs
// - supplier_name
// - acquisition_date
// - physical_location
// - internal_notes
// - certificate_notes
// - serial_number
```

**2. Actualizar `/catalogo/page.tsx`**

```typescript
// ANTES
const { data: productsData, error: productsError } = await supabase
  .from('products')
  .select('*, product_images(*)')
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// DESPUÉS
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

const { data: productsData, error: productsError } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('is_published', true)
  .order('created_at', { ascending: false });
```

**3. Actualizar `/catalogo/[id]/page.tsx`**

```typescript
// ANTES
const { data: product, error } = await supabase
  .from('products')
  .select('*, product_images(*)')
  .eq('slug', slug)
  .eq('is_published', true)
  .single();

// DESPUÉS
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

const { data: product, error } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('slug', slug)
  .eq('is_published', true)
  .single();
```

**4. Auditar `/api/products/[id]/route.ts`**

```typescript
// Este endpoint es PATCH (admin auth), pero mejor especificar campos:

// ANTES
const { data: product, error } = await supabaseAdmin
  .from('products')
  .update(updates)
  .eq('id', id)
  .select()  // ← SELECT sin campos
  .single()

// DESPUÉS
const { data: product, error } = await supabaseAdmin
  .from('products')
  .update(updates)
  .eq('id', id)
  .select('*')  // ← Admin puede ver todo (autenticado)
  .single()

// OK: está detrás de isAuthenticated(), no es público
```

---

### 📋 CHECKLIST PRE-MIGRACIÓN

**Antes de ejecutar migración SQL MVP.1A, verificar:**

- [ ] Archivo `src/lib/products-public-fields.ts` creado
- [ ] `PRODUCT_PUBLIC_FIELDS` incluye solo campos públicos (23 campos)
- [ ] `/catalogo/page.tsx` usa `PRODUCT_PUBLIC_FIELDS`
- [ ] `/catalogo/[id]/page.tsx` usa `PRODUCT_PUBLIC_FIELDS`
- [ ] Build local PASS
- [ ] Testing: catálogo NO expone cost_price ni campos internos
- [ ] Deploy a staging
- [ ] QA: verificar response de catálogo (no fields internos)

**Solo después de checklist ✅ → ejecutar migración SQL**

---

### 🔍 VALIDACIÓN POST-MIGRACIÓN

**Después de ejecutar migración SQL:**

1. **Verificar schema:**
   ```sql
   \d products
   -- Confirmar 12 columnas nuevas presentes
   ```

2. **Test query pública:**
   ```typescript
   const { data } = await supabase
     .from('products')
     .select(PRODUCT_PUBLIC_FIELDS)
     .eq('is_published', true)
     .limit(1)
     .single()
   
   console.log(data)
   // NO debe incluir: cost_price, supplier_name, internal_notes, etc.
   ```

3. **Test catálogo público:**
   - Abrir `/catalogo` en navegador
   - Inspeccionar Network tab
   - Verificar response de Supabase NO incluye campos internos

4. **Test detalle producto:**
   - Abrir `/catalogo/[slug]` en navegador
   - Inspeccionar Network tab
   - Verificar response NO incluye cost_price, etc.

5. **Test admin:**
   - Abrir `/admin/productos/[id]`
   - Verificar que admin SÍ puede ver todos los campos
   - Endpoint `/api/products/[id]` con auth SÍ retorna todo

---

### ⚠️ PROHIBICIONES

**Nunca hacer en código público (catálogo, detalle, API pública):**
- ❌ `select('*')`
- ❌ `select()` sin especificar campos
- ❌ Agregar campos internos a `PRODUCT_PUBLIC_FIELDS`

**Permitido en código admin (con `isAuthenticated()`):**
- ✅ `select('*')` en endpoints admin autenticados
- ✅ Mostrar todos los campos en UI admin

---

## 13. QUÉ NO IMPLEMENTAR TODAVÍA

### Excluido de MVP.1 (para fases futuras):

**Tablas nuevas:**
- ❌ `product_bags`
- ❌ `product_shoes`
- ❌ `product_jewelry`
- ❌ `product_accessories`
- ❌ `suppliers` (tabla avanzada)
- ❌ `product_certificates`
- ❌ `supplier_payments`
- ❌ `sku_sequences`
- ❌ `slug_redirects`
- ❌ `brand_codes`
- ❌ `product_history`
- ❌ `product_views`

**Funcionalidades:**
- ❌ SKU automático (solo slug)
- ❌ Regenerar slug en edit (mantener existente siempre)
- ❌ Dashboard de rentabilidad
- ❌ Reportes de costos
- ❌ Consignación avanzada
- ❌ Publicación programada
- ❌ Sistema de fotos nuevo (mantener actual)
- ❌ Certificados con upload (solo notas de texto)
- ❌ Bulk upload
- ❌ Analytics de producto
- ❌ Supplier management avanzado

**Campos calculados (columnas):**
- ❌ `total_cost` (calcular en runtime: cost_price + additional_costs)
- ❌ `margin_percent` (calcular en UI)
- ❌ `profit_amount` (calcular en UI)
- ❌ `consignment_percentage`
- ❌ `production_year`
- ❌ `limited_edition`
- ❌ Campos específicos de categoría (dimensions, heel_height, etc.)

**UI:**
- ❌ Tabs dinámicos por categoría
- ❌ Form condicional según tipo de producto
- ❌ Upload múltiple de fotos mejorado
- ❌ Drag & drop de fotos
- ❌ Categorización de fotos (product/detail/certificate)
- ❌ Preview de margen en dashboard
- ❌ Filtros avanzados por margen/proveedor

---

## RESUMEN EJECUTIVO

### Alcance MVP.1

**Implementar:**
- ✅ Slug automático en create (NO al editar)
- ✅ 12 columnas nuevas en `products` (incluye additional_costs)
- ✅ Form mejorado con 4 secciones
- ✅ Campos internos básicos (cost, additional_costs, supplier, location, notes)
- ✅ Autenticidad y accesorios básicos
- ✅ Seguridad: SELECT explícito en catálogo público (NO SELECT *)
- ✅ Cálculo de margen (total_cost = cost_price + additional_costs)

**NO implementar:**
- ❌ Tablas de categorías específicas
- ❌ SKU automático
- ❌ Regenerar slug al editar
- ❌ Dashboard rentabilidad
- ❌ Sistema fotos nuevo
- ❌ Suppliers/payments/certificates avanzados

---

### Esfuerzo estimado

| Tarea | Tiempo | Complejidad |
|-------|--------|-------------|
| Pre-check seguridad SELECT * | 1h | Media |
| Crear PRODUCT_PUBLIC_FIELDS | 0.5h | Baja |
| Actualizar catálogo público | 1h | Baja |
| Migración SQL | 1h | Baja |
| Slug automático (lógica) | 2h | Media |
| Form UI (4 secciones + additional_costs) | 4h | Media |
| API create/edit | 2h | Media |
| Testing seguridad + funcional | 3h | Media |
| Deploy y validación | 1h | Baja |
| **Total** | **~15.5h** | **~2 días** |

---

### Próximos pasos

1. ⏳ **Aprobar scope MVP.1 v2** (Jhonatan) ← **PENDIENTE**
2. ⏳ **Autorizar SUBFASE MVP.1A (SQL ONLY)**
3. ⏳ **Revisar documento SQL migration** (separado)
4. ⏳ **Ejecutar pre-check seguridad SELECT ***
5. ⏳ **Implementar PRODUCT_PUBLIC_FIELDS**
6. ⏳ **Ejecutar migración SQL en staging**
7. ⏳ **Validación post-migración**
8. ⏳ **Implementar UI/API**
9. ⏳ **Testing exhaustivo**
10. ⏳ **Deploy a producción**

---

**SCOPE MVP.1 v2 COMPLETO — AJUSTES APLICADOS — PENDIENTE APROBACIÓN IMPLEMENTACIÓN**

**No ejecutar migración ni implementar hasta autorización explícita de Jhonatan.**

---

## ANEXO: DIFERENCIAS v1 → v2

| Aspecto | v1 (original) | v2 (ajustado) |
|---------|---------------|---------------|
| **Slug en edit** | Regenerar al cambiar brand/model/title/color | **Mantener siempre (NO regenerar)** |
| **Slug UUID** | 8 chars mencionado | **Formato limpio confirmado** |
| **additional_costs** | No incluido | **Agregado (12 campos total)** |
| **SELECT * seguridad** | Mencionado riesgo | **Auditoría completa + plan detallado** |
| **Cálculo margen** | cost_price solo | **cost_price + additional_costs** |
| **Prioridad seguridad** | Media | **Alta (pre-check obligatorio)** |
