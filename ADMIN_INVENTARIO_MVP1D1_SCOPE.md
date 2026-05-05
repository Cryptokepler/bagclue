# ADMIN INVENTARIO MVP.1D.1 — LISTADO INVENTARIO READ-ONLY
**Fecha:** 2026-05-05  
**Objetivo:** Crear `/admin/productos` como listado operativo read-only con búsqueda, filtros, rentabilidad visual y links de acción seguros.  
**Estado:** SCOPE AJUSTADO - Pendiente aprobación

---

## 📋 DECISIONES APROBADAS

### ✅ Aprobado
1. **Ruta:** `/admin/productos` (separar dashboard de inventario)
2. **Columnas P1:** stock, ubicación física, proveedor, autenticidad verificada
3. **Stats:** Máximo 6 iniciales + 2 opcionales si es fácil
4. **Acciones limitadas:** Solo Editar y Ver (read-only)

### ❌ NO Aprobado (diferir a fase futura)
1. **Duplicar producto** - Requiere reglas de slug, imágenes, stock, costos
2. **Eliminar/soft delete** - Puede afectar órdenes, apartados, tracking
3. **Publicar/despublicar desde listado** - Por ahora solo desde edición

---

## 🎯 ALCANCE MVP.1D.1

### 1. ARCHIVOS A CREAR/MODIFICAR

**Nuevos archivos:**
```
src/app/admin/productos/page.tsx                    (página principal listado)
src/components/admin/ProductsTable.tsx              (tabla de productos)
src/components/admin/ProductFilters.tsx             (filtros)
src/components/admin/ProductSearchBar.tsx           (búsqueda)
src/components/admin/ProductBadges.tsx              (badges de estado)
src/components/admin/ProductAlerts.tsx              (alertas de incompleto)
src/components/admin/ProductStats.tsx               (stats de dashboard)
src/lib/product-metrics.ts                          (helpers para cálculo utilidad/margen)
```

**Archivos a modificar:**
```
src/app/admin/page.tsx                              (agregar stats mejorados + link a /admin/productos)
src/components/admin/AdminNav.tsx                   (agregar link "Inventario" si no existe)
```

**NO modificar:**
```
❌ src/app/admin/productos/[id]/page.tsx            (edición de producto - ya existe)
❌ src/app/admin/productos/new/page.tsx             (creación - ya existe)
❌ src/app/api/products/*                           (APIs - no necesitan cambios)
❌ src/lib/supabase-admin.ts                        (client - no cambia)
❌ migrations/*.sql                                 (NO tocar DB schema)
```

---

### 2. QUERY DE DATOS

**Query base (Supabase SSR):**
```typescript
const { data: products, error } = await supabaseAdmin
  .from('products')
  .select(`
    id,
    title,
    slug,
    brand,
    model,
    category,
    price,
    currency,
    description,
    status,
    is_published,
    stock,
    cost_price,
    additional_costs,
    supplier_name,
    physical_location,
    authenticity_verified,
    condition_notes,
    created_at,
    acquisition_date,
    product_images(url)
  `)
  .order('created_at', { ascending: false })
```

**Con filtros aplicados (ejemplo):**
```typescript
let query = supabaseAdmin.from('products').select('...')

// Búsqueda
if (search) {
  query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
}

// Status
if (statusFilter && statusFilter !== 'all') {
  query = query.eq('status', statusFilter)
}

// Publicado/Borrador
if (publishedFilter === 'published') {
  query = query.eq('is_published', true)
} else if (publishedFilter === 'draft') {
  query = query.eq('is_published', false)
}

// Categoría
if (categoryFilter && categoryFilter !== 'all') {
  query = query.eq('category', categoryFilter)
}

// Con/sin imagen
if (imageFilter === 'with-image') {
  // Requiere join: product_images.length > 0
  // Implementación: filtrar en cliente o usar subquery
} else if (imageFilter === 'without-image') {
  // product_images.length = 0
}

// Con/sin costo
if (costFilter === 'with-cost') {
  query = query.not('cost_price', 'is', null)
} else if (costFilter === 'without-cost') {
  query = query.is('cost_price', null)
}

// Autenticidad
if (authFilter === 'verified') {
  query = query.eq('authenticity_verified', true)
} else if (authFilter === 'not-verified') {
  query = query.eq('authenticity_verified', false)
}

query = query.order('created_at', { ascending: false })

const { data, error } = await query
```

**Nota sobre imágenes:**
- Supabase no permite fácilmente filtrar por count de relación en query directo
- **Opción A:** Filtrar en cliente tras fetch (recomendado para MVP.1D.1)
- **Opción B:** Agregar columna computed `has_images` en DB (requiere migration - NO hacer)
- **Implementación inicial:** Fetch todos, filtrar en JS si `imageFilter` activo

---

### 3. CAMPOS EXACTOS EN TABLA

**Columnas visibles (desktop):**

| # | Campo | Fuente | Tipo | Ancho sugerido | Justificación |
|---|-------|--------|------|----------------|---------------|
| 1 | Imagen | `product_images[0].url` | Thumbnail 48x48 | 80px | Identificación visual |
| 2 | Título | `title` | Texto truncado | 200px | Nombre del producto |
| 3 | Marca/Modelo | `brand` + `model` | Texto | 150px | Identificación rápida |
| 4 | Categoría | `category` | Badge | 100px | Clasificación |
| 5 | Precio Venta | `price` + `currency` | $X,XXX MXN | 120px | Precio público |
| 6 | Costo Compra | `cost_price` | $X,XXX MXN | 120px | Costo base |
| 7 | Costos Adic. | `additional_costs` (suma) | $X,XXX MXN | 120px | Costos extras |
| 8 | Utilidad | Calculado | $X,XXX MXN | 120px | Ganancia estimada |
| 9 | Margen % | Calculado | XX.X% (color) | 100px | Rentabilidad |
| 10 | Status | `status` | Badge | 100px | Estado de venta |
| 11 | Publicado | `is_published` | Badge | 90px | Visibilidad |
| 12 | Stock | `stock` | Número | 80px | Cantidad disponible |
| 13 | Ubicación | `physical_location` | Texto truncado | 120px | Ubicación física |
| 14 | Proveedor | `supplier_name` | Texto truncado | 120px | Fuente |
| 15 | Autenticidad | `authenticity_verified` | ✓/✗ icon | 80px | Verificación |
| 16 | Alertas | Calculado | Icons ⚠️ | 80px | Producto incompleto |
| 17 | Acciones | - | Botones | 120px | Editar, Ver |

**Total:** 17 columnas

**Responsive (mobile):**
- Cambiar a cards verticales
- Mostrar solo: imagen, título, marca, precio, margen% (color), status, acciones
- Resto visible al expandir card (opcional)

**Responsive (tablet):**
- Mostrar: imagen, título, marca, precio, costo, utilidad, margen%, status, publicado, acciones
- Resto en tooltip/expandible

---

### 4. FILTROS

**Barra de filtros (fila horizontal en desktop, modal en mobile):**

| Filtro | Opciones | Query Param | Implementación |
|--------|----------|-------------|----------------|
| **Búsqueda** | Input text | `?search=` | Debounce 300ms, busca en `title`, `brand`, `model` |
| **Status** | all / available / preorder / reserved / sold | `?status=` | Dropdown, `.eq('status', value)` |
| **Publicación** | all / published / draft | `?published=` | Dropdown, `.eq('is_published', true/false)` |
| **Categoría** | all / bolsa / cinturón / zapato / joyería | `?category=` | Dropdown, `.eq('category', value)` |
| **Imágenes** | all / with-image / without-image | `?images=` | Dropdown, filtrar en cliente |
| **Costo** | all / with-cost / without-cost | `?cost=` | Dropdown, `.is('cost_price', null)` o `.not()` |
| **Autenticidad** | all / verified / not-verified | `?auth=` | Dropdown, `.eq('authenticity_verified', true/false)` |

**UI de filtros:**
```tsx
<div className="flex flex-wrap gap-3 mb-6">
  <ProductSearchBar value={search} onChange={setSearch} />
  
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
    <option value="all">Todos los status</option>
    <option value="available">Disponible</option>
    <option value="preorder">Pre-orden</option>
    <option value="reserved">Reservado</option>
    <option value="sold">Vendido</option>
  </select>
  
  <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value)}>
    <option value="all">Todos</option>
    <option value="published">Publicados</option>
    <option value="draft">Borradores</option>
  </select>
  
  {/* ... resto de filtros ... */}
  
  <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-[#FF69B4]">
    Limpiar filtros
  </button>
  
  {activeFiltersCount > 0 && (
    <span className="text-xs text-gray-500">{activeFiltersCount} filtros aplicados</span>
  )}
</div>
```

**Ordenamiento (opcional para MVP.1D.1):**
- Si es fácil: Dropdown "Ordenar por" con opciones:
  - Más reciente (default)
  - Más antiguo
  - Mayor precio
  - Menor precio
  - Mayor margen %
  - Menor margen %
- Si requiere esfuerzo: diferir a MVP.1D.2

---

### 5. STATS EXACTOS

**Stats obligatorios (6):**

| Stat | Cálculo | Color | Icono |
|------|---------|-------|-------|
| **Total Productos** | `COUNT(*)` | Blanco | 📦 |
| **Publicados** | `COUNT(*) WHERE is_published = true` | Verde (#10B981) | ✓ |
| **Borradores** | `COUNT(*) WHERE is_published = false` | Amarillo (#F59E0B) | 📝 |
| **Disponibles** | `COUNT(*) WHERE status = 'available'` | Verde claro (#34D399) | 🟢 |
| **Vendidos** | `COUNT(*) WHERE status = 'sold'` | Rojo (#EF4444) | ✓ |
| **Valor Inventario Disponible** | `SUM(price) WHERE status IN ('available', 'preorder')` | Dorado (#C9A96E) | 💰 |

**Stats opcionales (+2 si es fácil):**

| Stat | Cálculo | Color | Icono |
|------|---------|-------|-------|
| **Costo Total Inventario Disponible** | `SUM(cost_price + additional_costs_total) WHERE status IN ('available', 'preorder')` | Gris (#9CA3AF) | 📊 |
| **Margen Promedio** | `AVG(margen %) WHERE status IN ('available', 'preorder') AND cost_price IS NOT NULL` | Cyan (#06B6D4) | % |

**Implementación:**
```typescript
// Calcular en server component
const stats = {
  total: products.length,
  published: products.filter(p => p.is_published).length,
  draft: products.filter(p => !p.is_published).length,
  available: products.filter(p => p.status === 'available').length,
  sold: products.filter(p => p.status === 'sold').length,
  totalValue: products
    .filter(p => ['available', 'preorder'].includes(p.status))
    .reduce((sum, p) => sum + (p.price || 0), 0),
  
  // Opcionales
  totalCost: products
    .filter(p => ['available', 'preorder'].includes(p.status))
    .reduce((sum, p) => {
      const costPrice = p.cost_price || 0
      const additionalTotal = calculateAdditionalCostsTotal(p.additional_costs)
      return sum + costPrice + additionalTotal
    }, 0),
  
  averageMargin: calculateAverageMargin(
    products.filter(p => ['available', 'preorder'].includes(p.status) && p.cost_price)
  )
}
```

**Layout stats:**
- Grid 3 columnas (desktop), 2 columnas (tablet), 1 columna (mobile)
- Card con número grande + label pequeño
- Ubicación: en `/admin/productos` arriba de tabla o en `/admin` (dashboard)

---

### 6. CÁLCULO DE MARGEN

**Helper `product-metrics.ts`:**

```typescript
// src/lib/product-metrics.ts

export interface ProductMetrics {
  costPrice: number
  additionalCostsTotal: number
  totalCost: number
  profit: number
  margin: number
  marginColor: 'green' | 'yellow' | 'red' | 'gray'
}

export function calculateAdditionalCostsTotal(
  additionalCosts: any
): number {
  if (!additionalCosts || typeof additionalCosts !== 'object') {
    return 0
  }
  
  const shipping = Number(additionalCosts.shipping) || 0
  const authentication = Number(additionalCosts.authentication) || 0
  const cleaning = Number(additionalCosts.cleaning) || 0
  const other = Number(additionalCosts.other) || 0
  
  return shipping + authentication + cleaning + other
}

export function calculateProductMetrics(product: any): ProductMetrics {
  const costPrice = Number(product.cost_price) || 0
  const additionalCostsTotal = calculateAdditionalCostsTotal(product.additional_costs)
  const totalCost = costPrice + additionalCostsTotal
  const price = Number(product.price) || 0
  
  // Si no hay costo o precio, margen es N/A
  if (costPrice === 0 || price === 0) {
    return {
      costPrice,
      additionalCostsTotal,
      totalCost,
      profit: 0,
      margin: 0,
      marginColor: 'gray'
    }
  }
  
  const profit = price - totalCost
  const margin = (profit / price) * 100
  
  // Determinar color
  let marginColor: 'green' | 'yellow' | 'red' | 'gray'
  if (margin >= 30) {
    marginColor = 'green'
  } else if (margin >= 15) {
    marginColor = 'yellow'
  } else {
    marginColor = 'red'
  }
  
  return {
    costPrice,
    additionalCostsTotal,
    totalCost,
    profit,
    margin,
    marginColor
  }
}

export function formatCurrency(
  amount: number,
  currency: string = 'MXN'
): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatMargin(margin: number): string {
  return `${margin.toFixed(1)}%`
}
```

**Colores de margen:**
- **Verde** (`#10B981`): margen ≥ 30%
- **Amarillo** (`#F59E0B`): margen 15%-29%
- **Rojo** (`#EF4444`): margen < 15% o negativo
- **Gris** (`#9CA3AF`): sin costo (no calculable)

**Uso en tabla:**
```tsx
const metrics = calculateProductMetrics(product)

<td className="px-6 py-4">
  <span className={`font-medium ${
    metrics.marginColor === 'green' ? 'text-emerald-400' :
    metrics.marginColor === 'yellow' ? 'text-yellow-400' :
    metrics.marginColor === 'red' ? 'text-red-400' :
    'text-gray-400'
  }`}>
    {metrics.margin > 0 ? formatMargin(metrics.margin) : 'N/A'}
  </span>
</td>
```

---

### 7. BADGES

**Componente `ProductBadges.tsx`:**

```tsx
export function StatusBadge({ status }: { status: string }) {
  const config = {
    available: { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-400' },
    preorder: { label: 'Pre-orden', color: 'bg-blue-500/20 text-blue-400' },
    reserved: { label: 'Reservado', color: 'bg-yellow-500/20 text-yellow-400' },
    sold: { label: 'Vendido', color: 'bg-red-500/20 text-red-400' }
  }
  
  const { label, color } = config[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' }
  
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded ${color}`}>
      {label}
    </span>
  )
}

export function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return isPublished ? (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">
      <span>✓</span>
      <span>Publicado</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
      <span>📝</span>
      <span>Borrador</span>
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const config = {
    bolsa: { label: 'Bolsa', icon: '👜' },
    cinturón: { label: 'Cinturón', icon: '🔗' },
    zapato: { label: 'Zapato', icon: '👠' },
    joyería: { label: 'Joyería', icon: '💎' }
  }
  
  const { label, icon } = config[category] || { label: category, icon: '📦' }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#FF69B4]/20 text-[#FF69B4]">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export function AuthenticityIcon({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="text-emerald-400" title="Autenticidad verificada">✓</span>
  ) : (
    <span className="text-gray-500" title="No verificado">✗</span>
  )
}
```

---

### 8. ALERTAS DE PRODUCTO INCOMPLETO

**Componente `ProductAlerts.tsx`:**

```tsx
export function ProductAlerts({ product }: { product: any }) {
  const alerts: Array<{ icon: string; message: string; color: string }> = []
  
  // Sin imagen
  if (!product.product_images || product.product_images.length === 0) {
    alerts.push({ icon: '📷', message: 'Sin imagen', color: 'text-red-400' })
  }
  
  // Sin costo
  if (!product.cost_price || product.cost_price === 0) {
    alerts.push({ icon: '💰', message: 'Sin costo', color: 'text-orange-400' })
  }
  
  // Sin descripción
  if (!product.description || product.description.trim() === '') {
    alerts.push({ icon: '📝', message: 'Sin descripción', color: 'text-yellow-400' })
  }
  
  // Sin condición detallada
  if (!product.condition_notes || product.condition_notes.trim() === '') {
    alerts.push({ icon: '🔍', message: 'Sin condición detallada', color: 'text-yellow-400' })
  }
  
  // Sin autenticidad verificada
  if (!product.authenticity_verified) {
    alerts.push({ icon: '✓', message: 'Sin autenticidad verificada', color: 'text-gray-400' })
  }
  
  // Sin ubicación física
  if (!product.physical_location || product.physical_location.trim() === '') {
    alerts.push({ icon: '📍', message: 'Sin ubicación', color: 'text-gray-400' })
  }
  
  if (alerts.length === 0) {
    return null
  }
  
  return (
    <div className="flex gap-1" title={alerts.map(a => a.message).join(', ')}>
      {alerts.map((alert, i) => (
        <span key={i} className={`text-sm ${alert.color}`}>
          {alert.icon}
        </span>
      ))}
    </div>
  )
}
```

**Ubicación en tabla:**
- Columna "Alertas" con iconos pequeños
- Tooltip al hover muestra lista de alertas
- Máximo 6 iconos visible (si más, mostrar "+X")

---

### 9. ACCIONES PERMITIDAS

**Solo 2 acciones (read-only):**

| Acción | Icono | Destino | Implementación |
|--------|-------|---------|----------------|
| **Editar** | ✏️ | `/admin/productos/[id]` | Link (no abre nueva pestaña) |
| **Ver** | 👁️ | `/catalogo/[slug]` | Link (abre nueva pestaña) |

**Componente de acciones:**
```tsx
export function ProductActions({ product }: { product: any }) {
  return (
    <div className="flex items-center gap-3">
      <a
        href={`/admin/productos/${product.id}`}
        className="text-xs text-[#FF69B4] hover:underline"
      >
        ✏️ Editar
      </a>
      
      {product.is_published && product.slug && (
        <a
          href={`/catalogo/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-[#FF69B4]"
        >
          👁️ Ver
        </a>
      )}
    </div>
  )
}
```

**Nota:**
- "Ver" solo visible si `is_published = true` y `slug` existe
- No mostrar publicar/despublicar, duplicar, eliminar
- Futuro: publicar/despublicar puede agregarse en MVP.1D.2 si se aprueba

---

### 10. RESPONSIVE

**Desktop (≥1024px):**
- Tabla completa con 17 columnas
- Scroll horizontal si necesario
- Filtros en fila horizontal

**Tablet (768px - 1023px):**
- Tabla con columnas prioritarias (11 columnas):
  - Imagen, Título, Marca, Precio, Costo, Utilidad, Margen%, Status, Publicado, Alertas, Acciones
- Resto de columnas en tooltip/expandible (opcional)

**Mobile (<768px):**
- Cards verticales
- Cada card muestra:
  - Imagen (más grande, 80x80)
  - Título + Marca
  - Precio + Margen% (con color)
  - Status badge
  - Publicado badge
  - Alertas (iconos)
  - Acciones (botones horizontales)
- Filtros en modal (botón "Filtros")

**Implementación responsive:**
```tsx
{/* Desktop: Tabla */}
<div className="hidden lg:block overflow-x-auto">
  <table className="w-full">
    {/* ... tabla completa ... */}
  </table>
</div>

{/* Mobile: Cards */}
<div className="lg:hidden space-y-4">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

---

### 11. CRITERIOS DE CIERRE MVP.1D.1

**Checklist de validación (25 puntos):**

#### Funcionalidad Core (8)
- [ ] 1. Ruta `/admin/productos` existe y renderiza correctamente
- [ ] 2. Tabla muestra todas las 17 columnas (desktop)
- [ ] 3. Cards responsive funcionan en mobile
- [ ] 4. Query Supabase carga todos los campos necesarios
- [ ] 5. Productos se muestran ordenados por fecha (más reciente primero)
- [ ] 6. Tabla maneja correctamente productos sin imagen (placeholder)
- [ ] 7. Tabla maneja correctamente productos sin costo (muestra "N/A" o "-")
- [ ] 8. No hay errores en consola

#### Búsqueda y Filtros (7)
- [ ] 9. Búsqueda funciona (debounce 300ms, busca en título/marca/modelo)
- [ ] 10. Filtro Status funciona (all/available/preorder/reserved/sold)
- [ ] 11. Filtro Publicación funciona (all/published/draft)
- [ ] 12. Filtro Categoría funciona (all/bolsa/cinturón/zapato/joyería)
- [ ] 13. Filtro Imágenes funciona (all/with-image/without-image)
- [ ] 14. Filtro Costo funciona (all/with-cost/without-cost)
- [ ] 15. Filtro Autenticidad funciona (all/verified/not-verified)

#### Badges y Alertas (4)
- [ ] 16. Badges de status se muestran con colores correctos
- [ ] 17. Badge publicado/borrador funciona
- [ ] 18. Badge categoría funciona
- [ ] 19. Alertas de producto incompleto se muestran (iconos + tooltip)

#### Cálculos (4)
- [ ] 20. Costo adicional se calcula correctamente (suma shipping+auth+cleaning+other)
- [ ] 21. Utilidad se calcula correctamente (price - cost_price - additional_total)
- [ ] 22. Margen % se calcula correctamente ((utilidad / price) * 100)
- [ ] 23. Colores de margen correctos (verde ≥30%, amarillo 15-29%, rojo <15%, gris sin costo)

#### Stats (opcional, +2)
- [ ] 24. Stats de dashboard muestran valores correctos (6 obligatorios)
- [ ] 25. (Opcional) Stats opcionales (costo total, margen promedio) funcionan

**MÍNIMO PARA CIERRE:** 23/25 PASS (sin contar stats opcionales)

---

### 12. QUÉ NO IMPLEMENTAR TODAVÍA

**Diferido a fases futuras:**

#### MVP.1D.2 (futuro - requiere aprobación)
- [ ] Publicar/Despublicar desde listado (toggle rápido)
- [ ] Ordenamiento avanzado (por precio, margen, etc.)
- [ ] Paginación (server-side si >100 productos)
- [ ] Exportar inventario (CSV/Excel)

#### MVP.1D.3 (futuro - requiere aprobación)
- [ ] Duplicar producto (con reglas de slug, imágenes, stock, costos)
- [ ] Edición inline de campos simples (stock, ubicación, precio)
- [ ] Bulk actions (publicar múltiples, cambiar categoría, etc.)

#### Fuera de scope (no inventario)
- [ ] Eliminar/soft delete producto (requiere validación de órdenes/apartados)
- [ ] Gestión de imágenes desde listado
- [ ] Historial de cambios de producto
- [ ] Reportes avanzados de rentabilidad

**Prohibido tocar:**
- ❌ Checkout flow
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Orders module
- ❌ Layaways module
- ❌ Admin envíos
- ❌ Customer panel
- ❌ DB schema (migrations)
- ❌ RLS policies
- ❌ `PRODUCT_PUBLIC_FIELDS` (salvo bug crítico)

---

### 13. ESTIMACIÓN DE ESFUERZO

| Tarea | Esfuerzo | Riesgo |
|-------|----------|--------|
| Helper `product-metrics.ts` | 30 min | Bajo |
| Componentes UI (badges, alerts, filters) | 2h | Bajo |
| Tabla `ProductsTable.tsx` | 2h | Medio |
| Página `/admin/productos/page.tsx` | 1.5h | Bajo |
| Responsive (cards mobile) | 1h | Medio |
| Stats dashboard | 1h | Bajo |
| Query con filtros | 1h | Bajo |
| Testing + fixes | 1h | Bajo |

**Total estimado:** 10 horas

**Riesgos:**
- 🟡 Filtro de imágenes requiere filtrado en cliente (no en query Supabase)
- 🟡 Responsive puede requerir ajustes finos
- 🟢 Resto es bajo riesgo (patrones ya implementados en MVP.1C)

---

### 14. PLAN DE IMPLEMENTACIÓN

**FASE 1 - Backend y Helpers (1h)**
1. Crear `src/lib/product-metrics.ts` con helpers de cálculo
2. Validar helpers con productos de prueba
3. Confirmar query Supabase carga todos los campos

**FASE 2 - Componentes UI (3h)**
1. `ProductBadges.tsx` - badges de status, publicado, categoría, autenticidad
2. `ProductAlerts.tsx` - alertas de producto incompleto
3. `ProductFilters.tsx` - barra de filtros con dropdowns
4. `ProductSearchBar.tsx` - búsqueda con debounce

**FASE 3 - Tabla y Página (3.5h)**
1. `ProductsTable.tsx` - tabla desktop con 17 columnas
2. `ProductCard.tsx` - card mobile responsive
3. `/admin/productos/page.tsx` - página principal con filtros + tabla/cards
4. Integrar filtros con query Supabase

**FASE 4 - Stats (1h)**
1. `ProductStats.tsx` - componente de stats
2. Modificar `/admin/page.tsx` para agregar stats mejorados
3. Link "Ver Inventario Completo" → `/admin/productos`

**FASE 5 - QA y Cierre (1.5h)**
1. Ejecutar checklist de 25 criterios
2. Fix bugs encontrados
3. Validar cálculos de utilidad/margen
4. Validar responsive mobile/tablet
5. Build + deploy
6. Cierre formal

---

## ✅ APROBACIÓN REQUERIDA

**Este scope ajustado requiere aprobación de Jhonatan antes de implementar.**

**Confirmaciones requeridas:**
1. ✅ Ruta `/admin/productos` aprobada
2. ✅ Columnas P1 (stock, ubicación, proveedor, autenticidad) aprobadas
3. ✅ Acciones limitadas a Editar + Ver (read-only) aprobado
4. ✅ Stats: 6 obligatorios + 2 opcionales aprobado
5. ❓ ¿Implementar ordenamiento o diferir a MVP.1D.2?
6. ❓ ¿Implementar paginación o diferir hasta tener >50 productos?

**Siguiente paso tras aprobación:**
- Implementar FASE 1 (Backend y Helpers)
- Iterar fases hasta cierre

---

**Documento preparado por:** Kepler  
**Fecha:** 2026-05-05  
**Proyecto:** Bagclue - Admin Inventario Profesional  
**Fase:** MVP.1D.1 - Listado Inventario Read-Only (scope ajustado)
