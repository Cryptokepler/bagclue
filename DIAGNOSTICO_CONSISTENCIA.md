# DIAGNÓSTICO CONSISTENCIA CATÁLOGO
**Fecha:** 2026-05-05  
**Producto analizado:** d6862679-5bd9-456c-ada0-10b1f6ff50d2

---

## Producto nuevo creado desde admin

### Datos en DB
- **Encontrado en DB:** ✅ SÍ
- **ID:** `d6862679-5bd9-456c-ada0-10b1f6ff50d2`
- **Title:** `Test Banner Producto`
- **Slug:** `chanel-qa-test-banner-producto-negro`
- **Status:** `available`
- **is_published:** ❌ **FALSE**
- **Stock:** `1`
- **Price:** `150000 MXN`
- **Category:** `Bolsas`
- **Imágenes count:** 0 (ERROR: columna `alt_text` no existe en `product_images`)
- **Created at:** `2026-05-05T19:59:17.352625+00:00`
- **Updated at:** `2026-05-05T19:59:31.743017+00:00`

### ¿Cumple filtros de /catalogo?
❌ **NO**

**Razón exacta:** `is_published = false`

El producto NO aparece en `/catalogo` porque la query filtra:
```sql
WHERE is_published = true
```

---

## /catalogo (Catálogo público)

### Fuente de datos
✅ **Supabase** (`products` table)

### Query exacta
```typescript
supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('is_published', true)  // ← FILTRO CRÍTICO
  .order('created_at', { ascending: false })
```

### Filtros aplicados
1. ✅ `is_published = true` — **obligatorio**
2. ❌ NO filtra por `status`
3. ❌ NO filtra por `stock`
4. ❌ NO requiere `product_images` (puede mostrar sin foto)
5. ✅ Usa `PRODUCT_PUBLIC_FIELDS` (campos seguros)

### Configuración de caché
- **Tipo:** Client-side rendering (`'use client'`)
- **Revalidate:** N/A (no es server component)
- **Dynamic:** N/A (no es server component)
- **Caché navegador:** Sí (fetch estándar)

### Cantidad de productos
- **Total publicados:** 5 productos
- **Incluye producto nuevo:** ❌ NO (porque `is_published = false`)

### Productos publicados actuales
```
1. ce6f91c8 - "Negra Test Slug" (available, is_published: true)
2. 5dc47bcb - "25 small negra" (sold, is_published: true)
3. cf943ccf - "25" (sold, is_published: true)
4. 4e661f62 - "Hermès Birkin 30 Gold" (sold, is_published: true)
5. 9ed1749d - "Chanel Classic Flap Negro" (available, is_published: true)
```

---

## Landing / (Home page)

### Fuente de datos
❌ **HARDCODED** → `@/data/products.ts`

### Query exacta
```typescript
import { products } from '@/data/products'
const featured = products
  .filter(p => p.status === 'En inventario' || p.status === 'Pre-venta')
  .slice(0, 6)
```

### Filtros aplicados
1. ✅ Filtra por `status` (legacy format: "En inventario" | "Pre-venta")
2. ❌ NO lee de Supabase
3. ❌ NO valida `is_published`
4. ❌ NO valida `stock`
5. ✅ Limita a 6 productos (`slice(0, 6)`)

### Hardcoded: ✅ SÍ

Archivo: `/src/data/products.ts`  
Total de productos hardcoded: **25 productos**

Estructura:
```typescript
export const products: Product[] = [
  { id: 'B010', brand: 'Chanel', model: '25 Mezclilla Small', ... },
  { id: 'B014', brand: 'Chanel', model: '25 Mediana', ... },
  // ... 23 productos más
]
```

### Cantidad de productos
- **Hardcoded total:** 25 productos ficticios
- **Mostrados en landing:** 6 primeros con status "En inventario" o "Pre-venta"
- **Incluye producto nuevo:** ❌ NO (producto nuevo solo existe en DB)

### Productos mostrados en landing (simulados)
```
1. B010 - Chanel 25 Mezclilla Small
2. B014 - Chanel 25 Mediana Café
3. B015 - Chanel 25 Mediana Beige
4. B018 - Chanel 25 Small Dorada
5. B029 - Chanel Lentes Gato
6. B034 - Hermès Kelly Plateada
```

---

## /catalogo/[slug] (Detalle de producto)

### Fuente de datos
✅ **Supabase** (`products` table)

### Query exacta
```typescript
supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('slug', slug)
  .eq('is_published', true)  // ← FILTRO CRÍTICO
  .single()
```

### Filtros aplicados
1. ✅ `is_published = true` — **obligatorio**
2. ✅ Match por `slug`
3. ❌ NO filtra por `status`
4. ❌ NO filtra por `stock`

### Configuración de caché
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0  // No cache
export const dynamicParams = true
```

### Incluye producto nuevo
❌ **NO** (porque `is_published = false`)

---

## /admin (Admin productos)

### Fuente de datos
✅ **Supabase** (`products` table)

### Query exacta
```typescript
supabase
  .from('products')
  .select('*, product_images(url)')
  .order('created_at', { ascending: false })
```

### Filtros aplicados
❌ **NINGUNO** — muestra TODOS los productos sin importar `is_published`

### Cantidad de productos
- **Total en DB:** 7 productos
- **Incluye producto nuevo:** ✅ SÍ

---

## Comparación de fuentes

| Superficie | Fuente de datos | Filtro is_published | Filtro status | Filtro stock | Incluye producto nuevo | Total productos |
|------------|-----------------|---------------------|---------------|--------------|------------------------|-----------------|
| `/admin` | Supabase | ❌ NO | ❌ NO | ❌ NO | ✅ SÍ | 7 |
| `/catalogo` | Supabase | ✅ SÍ (= true) | ❌ NO | ❌ NO | ❌ NO | 5 |
| `/` (landing) | **Hardcoded** | ❌ NO | ✅ SÍ (legacy) | ❌ NO | ❌ NO | 6 (de 25) |
| `/catalogo/[slug]` | Supabase | ✅ SÍ (= true) | ❌ NO | ❌ NO | ❌ NO | N/A |

---

## Causa raíz

### Principal: `is_published = false` por defecto

El producto creado desde `/admin/productos/new` tiene `is_published = false` por defecto.

**Evidencia:**
```typescript
// src/app/admin/productos/new/page.tsx
const [formData, setFormData] = useState({
  // ...
  is_published: false,  // ← DEFAULT
  // ...
})
```

El admin puede crear productos, pero **debe marcar manualmente** el checkbox "Publicar inmediatamente en el catálogo" para que `is_published = true`.

### Secundaria: Landing desincronizada (hardcoded)

La landing (`/`) usa datos hardcoded de `/data/products.ts` que NO reflejan el inventario real de Supabase.

**Consecuencias:**
- Landing muestra 25 productos ficticios con IDs como "B010", "B014", etc.
- Catálogo muestra 5 productos reales de Supabase
- **Ninguno coincide**
- Usuario ve productos en landing que NO existen en catálogo
- Usuario NO ve productos reales del catálogo en landing

---

## Fix mínimo propuesto

### Opción A: Marcar producto como publicado (manual)

**Acción inmediata:**
1. Ir a `/admin/productos/d6862679-5bd9-456c-ada0-10b1f6ff50d2`
2. Marcar checkbox "Publicado"
3. Guardar

**Resultado:**
- Producto aparece en `/catalogo`
- Producto aparece en `/catalogo/[slug]`
- Landing sigue mostrando productos hardcoded (no se resuelve)

**Pros:**
- Fix inmediato
- No requiere deploy

**Contras:**
- No resuelve inconsistencia landing-catálogo
- Requiere acción manual por cada producto

---

### Opción B: Cambiar default `is_published = true` en crear

**Cambio:**
```typescript
// src/app/admin/productos/new/page.tsx línea ~44
const [formData, setFormData] = useState({
  // ...
  is_published: true,  // ← CAMBIAR DEFAULT
  // ...
})
```

**Resultado:**
- Nuevos productos se publican automáticamente
- Admin puede despublicar si necesita
- Landing sigue desincronizada (no se resuelve)

**Pros:**
- Workflow más rápido
- Menos fricción al crear productos

**Contras:**
- Productos se publican antes de tener imágenes
- No resuelve landing hardcoded
- Requiere deploy

---

### Opción C: Migrar landing a Supabase (RECOMENDADO)

**Cambio:**
```typescript
// src/app/page.tsx
// ANTES
import { products } from '@/data/products'
const featured = products
  .filter(p => p.status === 'En inventario' || p.status === 'Pre-venta')
  .slice(0, 6)

// DESPUÉS
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

// Fetch de Supabase
const { data } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('is_published', true)
  .in('status', ['available', 'preorder'])  // Equivalente a "En inventario" y "Pre-venta"
  .order('created_at', { ascending: false })
  .limit(6)

const featured = data || []
```

**Resultado:**
- ✅ Landing sincronizada con catálogo
- ✅ Landing muestra productos reales
- ✅ Consistencia total entre `/`, `/catalogo`, `/catalogo/[slug]`
- ✅ Productos nuevos aparecen automáticamente si `is_published = true`

**Pros:**
- Elimina datos hardcoded obsoletos
- Una sola fuente de verdad (Supabase)
- Escalable y mantenible
- Refleja inventario real

**Contras:**
- Requiere deploy
- Landing se vuelve client-side (fetch en navegador)
- Latencia inicial al cargar (puede optimizarse con SSR)

---

### Opción C+ (Optimizada): Landing Server-Side con Supabase

**Cambio:**
```typescript
// src/app/page.tsx
// Server Component (sin 'use client')
import { supabase } from '@/lib/supabase'
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

export const dynamic = 'force-dynamic'
export const revalidate = 60  // Revalidar cada 60 segundos

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('is_published', true)
    .in('status', ['available', 'preorder'])
    .order('created_at', { ascending: false })
    .limit(6)
  
  return data || []
}

export default async function Home() {
  const featured = await getFeaturedProducts()
  // ... render
}
```

**Resultado:**
- ✅ Todo lo de Opción C
- ✅ Renderizado server-side (más rápido)
- ✅ SEO optimizado
- ✅ Revalidación cada 60s (balance entre frescura y performance)

**Pros:**
- Mejor performance que client-side
- Mejor SEO
- Caché inteligente

**Contras:**
- Productos nuevos pueden tardar hasta 60s en aparecer (configurable)

---

## Recomendación final

**Fix inmediato (manual):**
- Opción A: Marcar producto como publicado

**Fix permanente (deploy requerido):**
- Opción C+ (Migrar landing a Supabase SSR)
- Opción B (cambiar default `is_published = true`)

**Orden sugerido:**
1. **Ahora:** Opción A (manual) → producto aparece en catálogo
2. **Deploy próximo:** Opción C+ → landing sincronizada
3. **Deploy próximo:** Opción B → workflow más fluido

---

## Problema secundario detectado

**Error en query de imágenes:**
```
ERROR: column product_images.alt_text does not exist
```

**Causa:** Script de diagnóstico intenta leer `alt_text` pero la columna real es `alt` (sin `_text`).

**Fix:** Actualizar schema o queries según estructura real de `product_images`.

**Prioridad:** Baja (no afecta funcionalidad actual)

---

## Conclusión

El producto nuevo NO aparece en catálogo porque:
1. `is_published = false` (decisión de diseño actual)
2. Landing muestra productos hardcoded ficticios (deuda técnica)

**El sistema funciona como está diseñado, pero el diseño tiene inconsistencias de UX que pueden confundir al admin/cliente.**

**Solución recomendada:** Migrar landing a Supabase (Opción C+) + cambiar default `is_published = true` (Opción B).
