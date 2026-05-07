# BAGCLUE MVP D — CATÁLOGO SOLD/RESERVED (SCOPE CORTO)

**Fecha:** 2026-05-07  
**Estado:** SCOPE ONLY — NO IMPLEMENTAR HASTA APROBACIÓN  
**Dependencias:** MVP B (Stock Admin) completado ✅

---

## 🎯 OBJETIVO

Mostrar productos vendidos/apartados en el catálogo con badges informativos, pero deshabilitar botones de compra/apartado.

**Valor de negocio:**
- Prueba social: clientas ven qué piezas se vendieron
- Transparencia: productos apartados visibles hasta completar pago
- Historial: registro de últimas ventas
- Engagement: generar FOMO (fear of missing out)

---

## 📊 ESTADO ACTUAL

### ✅ Qué funciona hoy

**Catálogo `/catalogo`:**
- Filtra por: `.in('status', ['available', 'preorder'])`
- Productos sold/reserved quedan **ocultos** aunque `is_published=true`
- No hay badges para "Vendida" o "Apartada"

**ProductCard:**
- Muestra badge "Apartada" solo si `status='Apartada'` (legacy mapping)
- NO diferencia entre reserved (apartada) vs sold (vendida)

**Product Detail `/catalogo/[id]`:**
- Muestra botones comprar/apartar sin validar status
- NO muestra mensaje si producto ya está sold/reserved

### ❌ Qué falta

1. **Catálogo NO incluye sold/reserved:**
   - Archivo: `src/app/catalogo/page.tsx` (línea ~15)
   - Query actual:
     ```typescript
     .in('status', ['available', 'preorder'])
     ```
   - Necesita cambiar a:
     ```typescript
     .in('status', ['available', 'preorder', 'reserved', 'sold'])
     ```

2. **ProductCard NO muestra badge "Vendida":**
   - Archivo: `src/components/ProductCard.tsx` (línea ~48)
   - Solo muestra badge si `status='Apartada'`
   - NO diferencia sold vs reserved

3. **Botones NO se deshabilitan si sold/reserved:**
   - Botones "Comprar" y "Apartar" siempre visibles
   - NO hay validación de status en click

4. **Product Detail NO muestra mensaje:**
   - Si producto sold: debería mostrar "Esta pieza ya fue vendida"
   - Si producto reserved: debería mostrar "Esta pieza está apartada"
   - Botones siguen activos

---

## 🛠️ CAMBIOS REQUERIDOS

### 1. CATÁLOGO — Incluir sold/reserved

**Archivo:** `src/app/catalogo/page.tsx`

**Cambio:**
```typescript
// ANTES:
.in('status', ['available', 'preorder'])

// DESPUÉS:
.in('status', ['available', 'preorder', 'reserved', 'sold'])
.order('status', { ascending: true }) // available primero, sold último
.order('created_at', { ascending: false })
```

**Lógica de orden:**
- `available` primero
- `preorder` segundo
- `reserved` tercero
- `sold` último

**Alternativa:** Usar `CASE WHEN` en SQL para orden custom:
```sql
ORDER BY
  CASE status
    WHEN 'available' THEN 1
    WHEN 'preorder' THEN 2
    WHEN 'reserved' THEN 3
    WHEN 'sold' THEN 4
  END,
  created_at DESC
```

---

### 2. PRODUCTCARD — Badges sold/reserved

**Archivo:** `src/components/ProductCard.tsx`

**Cambio:**

```typescript
// Determinar badge por status DB
const badge = () => {
  if (dbStatus === 'sold') {
    return (
      <span className="absolute top-4 right-4 bg-gray-900/90 text-white text-xs font-medium px-3 py-1.5 uppercase tracking-wider backdrop-blur-sm">
        Vendida
      </span>
    )
  }
  
  if (dbStatus === 'reserved') {
    return (
      <span className="absolute top-4 right-4 bg-yellow-500/90 text-gray-900 text-xs font-medium px-3 py-1.5 uppercase tracking-wider backdrop-blur-sm">
        Apartada
      </span>
    )
  }
  
  if (product.badge) {
    return (
      <span className="absolute top-4 right-4 bg-[#FF69B4]/90 text-white text-xs font-medium px-3 py-1.5 uppercase tracking-wider backdrop-blur-sm">
        {product.badge}
      </span>
    )
  }
  
  return null
}
```

**Diseño badges:**
- **Vendida:** Fondo gris oscuro/negro (`bg-gray-900`), texto blanco
- **Apartada:** Fondo amarillo (`bg-yellow-500`), texto gris oscuro
- **Custom badge:** Mantener rosa si existe

---

### 3. PRODUCTCARD — Deshabilitar click si sold/reserved

**Archivo:** `src/components/ProductCard.tsx`

**Cambio:**

```typescript
// Determinar si clickeable
const isClickable = dbStatus === 'available' || dbStatus === 'preorder'

return (
  <Link
    href={isClickable ? `/catalogo/${product.slug || product.id}` : '#'}
    onClick={(e) => {
      if (!isClickable) {
        e.preventDefault()
      }
    }}
    className={`group block bg-white overflow-hidden transition-all duration-300 ${
      isClickable 
        ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
        : 'cursor-not-allowed opacity-75'
    }`}
  >
    {/* Card content */}
  </Link>
)
```

**Alternativa:** Mantener clickeable pero deshabilitar botones en detalle

---

### 4. PRODUCT DETAIL — Deshabilitar botones

**Archivo:** `src/app/catalogo/[id]/page.tsx`

**Cambio:**

```typescript
{/* Botones compra/apartado */}
{product.status === 'sold' ? (
  <div className="border-2 border-gray-300 bg-gray-50 p-6 text-center">
    <p className="text-gray-600 font-medium mb-2">
      Esta pieza ya fue vendida
    </p>
    <p className="text-sm text-gray-500">
      Explora piezas similares o contacta para consultar disponibilidad de modelos parecidos.
    </p>
  </div>
) : product.status === 'reserved' ? (
  <div className="border-2 border-yellow-400 bg-yellow-50 p-6 text-center">
    <p className="text-yellow-800 font-medium mb-2">
      Esta pieza está apartada
    </p>
    <p className="text-sm text-yellow-700">
      Regresa pronto o explora piezas similares mientras se completa el proceso.
    </p>
  </div>
) : (
  <div className="space-y-4">
    {/* Botones comprar/apartar normales */}
  </div>
)}
```

---

### 5. PRODUCT DETAIL — Sugerencias similares

**Archivo:** `src/app/catalogo/[id]/page.tsx`

**Cambio opcional:**

```typescript
// Si producto sold/reserved, mostrar sugerencias
{(product.status === 'sold' || product.status === 'reserved') && (
  <section className="mt-12">
    <h3 className="text-2xl font-serif mb-6">Piezas similares disponibles</h3>
    {/* Fetch productos similares: misma marca, misma categoría, status=available */}
  </section>
)}
```

---

## 🚫 QUÉ NO TOCAR

- ❌ Backend/DB schema
- ❌ Stripe checkout
- ❌ Webhook
- ❌ Apartados logic
- ❌ Bank transfer
- ❌ Emails
- ❌ Admin envíos
- ❌ Customer panel
- ❌ Filtros catálogo (solo query status)

---

## 📊 ARCHIVOS A MODIFICAR

| Archivo | Cambio | Complejidad |
|---------|--------|-------------|
| `src/app/catalogo/page.tsx` | Incluir sold/reserved en query | Baja |
| `src/components/ProductCard.tsx` | Badges + disabled state | Media |
| `src/app/catalogo/[id]/page.tsx` | Deshabilitar botones + mensajes | Media |

**Total:** 3 archivos

---

## 🔴 RIESGOS

1. **Catálogo puede llenarse de productos sold:**
   - Si hay muchas ventas, sold dominará la vista
   - **Mitigación:** Orden correcto (available primero) + paginación

2. **Confusión "Apartada" vs "Vendida":**
   - Clientas pueden no entender diferencia
   - **Mitigación:** Badges con colores distintos + texto claro

3. **SEO de productos sold:**
   - Productos sold siguen indexados si `is_published=true`
   - **Mitigación:** Agregar schema markup "OutOfStock" en futuro

4. **Click en producto sold puede frustrar:**
   - Clienta entra, ve "vendida", se frustra
   - **Mitigación:** Badge visible desde card + mensaje claro en detalle

---

## ✅ CRITERIOS DE CIERRE

### Catálogo
- [ ] Productos sold aparecen en catálogo
- [ ] Productos reserved aparecen en catálogo
- [ ] Orden correcto: available → preorder → reserved → sold
- [ ] Badge "Vendida" visible en card (gris oscuro)
- [ ] Badge "Apartada" visible en card (amarillo)

### Product Detail
- [ ] Si sold: botones ocultos, mensaje visible
- [ ] Si reserved: botones ocultos, mensaje visible
- [ ] Mensaje claro y no frustrante
- [ ] Link a catálogo o sugerencias similares (opcional)

### Mobile
- [ ] Badges legibles
- [ ] Mensajes no se rompen
- [ ] Layout correcto

### Testing
- [ ] Build PASS
- [ ] Deploy production
- [ ] Producto sold aparece con badge correcto
- [ ] Producto reserved aparece con badge correcto
- [ ] Botones deshabilitados correctamente
- [ ] No errores consola

---

## 💡 MEJORAS FUTURAS (FUERA DE SCOPE)

1. **Filtro "Solo disponibles":**
   - Toggle para ocultar sold/reserved
   - Default: mostrar todos

2. **Badge "Vendida recientemente":**
   - Si sold hace <7 días: badge "Vendida recientemente"
   - Color verde o dorado para FOMO

3. **Notificación "Avísame si vuelve":**
   - Si producto sold, permitir suscripción a notificación
   - Email si producto vuelve a available

4. **Schema markup OutOfStock:**
   - JSON-LD con availability: "OutOfStock"
   - Mejor SEO para productos sold

5. **Analytics:**
   - Track clicks en productos sold/reserved
   - Medir interés en piezas no disponibles

---

## 📋 DECISIÓN PENDIENTE

**Jhonatan debe aprobar:**
1. ✅ Implementar MVP D completo (catálogo + badges + detalle)
2. ✅ Implementar solo parcial (ej: solo catálogo, no detalle)
3. ✅ Modificar diseño badges antes de implementar
4. ❌ Rechazar/pausar hasta completar MVP C

**Una vez aprobado, proceder con implementación.**

---

**Fin del scope MVP D.**
