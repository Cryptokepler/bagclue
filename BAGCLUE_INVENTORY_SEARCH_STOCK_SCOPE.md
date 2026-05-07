# BAGCLUE INVENTORY SEARCH + STOCK MANAGEMENT — SCOPE & DIAGNOSTIC

**Fecha:** 2026-05-07  
**Solicitado por:** Jhonatan  
**Estado:** DIAGNOSTIC COMPLETO — PENDIENTE APROBACIÓN  

---

## 🎯 OBJETIVOS

### A. LANDING SEARCH
Agregar buscador elegante en landing para buscar por marca, modelo o pieza.

### B. INVENTORY STOCK
Asegurar que el sistema maneje stock correctamente para inventario real con múltiples unidades.

---

## 📊 AUDITORÍA ESTADO ACTUAL

### A. LANDING SEARCH — Estado Actual

#### ✅ QUÉ FUNCIONA HOY

1. **Búsqueda en /catalogo funcional:**
   - Ruta: `/catalogo?search=<query>`
   - Implementado en: `src/app/catalogo/page.tsx` (líneas 29-30)
   - Lógica:
     ```typescript
     const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
     ```
   - Filtra por: `title`, `brand`, `model`, `color`, `description` (búsqueda case-insensitive)
   - Ya probado y funcional

2. **Query params sincronizados:**
   - URL params ↔ React state bidireccional
   - Router.replace sin scroll
   - Múltiples filtros combinables: `?search=birkin&brand=Hermès&auth=verified`

3. **Enter ejecuta búsqueda:**
   - Implementado en filtro de búsqueda del catálogo

#### ❌ QUÉ FALTA

1. **NO existe buscador en landing (/):**
   - `src/app/page.tsx` NO tiene input de búsqueda
   - Solo tiene botón "Explorar colección" que lleva a `/catalogo`
   - Hero es editorial, sin interacción de búsqueda

2. **Ubicación no definida:**
   - Opciones sugeridas:
     - A) Debajo del hero, antes de "Recién llegadas"
     - B) Dentro del hero (forma discreta y premium)
     - C) Después del hero como sección independiente

#### 🔴 RIESGOS

- **Diseño visual:** Puede romper estética editorial si no se hace con cuidado
- **Mobile:** Input + botón debe funcionar bien en móvil
- **UX:** Si input vacío, debe redirigir a `/catalogo` o no redirigir

---

### B. INVENTORY STOCK — Estado Actual

#### ✅ QUÉ FUNCIONA HOY

1. **Campo `stock` existe en DB:**
   - Tipo: `number | null` (opcional)
   - Presente en: `src/types/database.ts` (línea 24)
   - Interface Product: `stock?: number | null`

2. **Stripe webhook descuenta stock:**
   - Archivo: `src/app/api/stripe/webhook/route.ts`
   - Lógica completa (líneas 196-240):
     ```typescript
     // Si stock = 1 → marcar sold + stock 0
     if (product && product.stock === 1) {
       .update({ status: 'sold', stock: 0 })
     }
     // Si stock > 1 → decrementar stock
     else {
       const newStock = (product?.stock || 1) - 1
       .update({ stock: newStock })
     }
     ```
   - ✅ **Funciona correctamente para compras Stripe**

3. **Product status workflow funcional:**
   - States: `available`, `preorder`, `reserved`, `sold`, `hidden`
   - Catálogo filtra: `is_published=true` + `status in ['available', 'preorder']`
   - ProductCard muestra badge "Apartada" si `status='Apartada'`

4. **Layaway webhook marca producto `reserved`:**
   - Archivo: `src/app/api/stripe/webhook/route.ts` (línea 313+)
   - Al pagar depósito: `product.status` → `reserved`

#### ❌ QUÉ FALTA

1. **Campo `stock` NO está en forms admin:**
   - ❌ `src/components/admin/EditProductForm.tsx` NO muestra input stock
   - ❌ `src/app/admin/productos/new/page.tsx` NO tiene campo stock
   - Admin NO puede ver ni editar unidades disponibles

2. **Apartados NO manejan stock:**
   - Archivo: `src/app/api/layaways/create/route.ts`
   - Solo valida: `product.status === 'available'`
   - NO verifica: `product.stock > 0`
   - NO descuenta: stock al apartar
   - Solo cambia: `product.status` → `reserved`
   - **Problema:** Si stock > 1, se reserva TODO el producto, no 1 unidad

3. **Catálogo NO muestra productos sold/reserved:**
   - Filtro actual: `.in('status', ['available', 'preorder'])`
   - Productos vendidos/apartados quedan ocultos aunque `is_published=true`
   - **Problema:** No hay registro visual de piezas vendidas

4. **Admin NO muestra stock en listado:**
   - Panel `/admin` NO muestra columna stock
   - NO hay alerta si stock = 0
   - NO hay vista rápida de unidades disponibles

5. **ProductCard NO muestra badge "Vendida":**
   - Solo muestra: "Apartada" si status='Apartada'
   - NO muestra: badge específico para `status='sold'`
   - NO diferencia entre: reserved (apartada) vs sold (vendida)

#### 🔴 RIESGOS

1. **Stock no controlado manualmente:**
   - Admin no puede definir stock inicial al crear producto
   - Admin no puede ajustar stock si hay devolución/cancelación
   - Sistema asume stock=1 implícitamente

2. **Apartados sin control de stock:**
   - Si producto tiene stock > 1, apartado bloquea TODO el inventario
   - NO hay lógica para reservar 1 unidad y dejar resto disponible
   - NO se descuenta stock al apartar

3. **Productos vendidos invisibles:**
   - Piezas vendidas desaparecen del catálogo
   - No hay historial visible de "última venta"
   - No se puede mostrar "Vendida" como prueba social

4. **Inconsistencia apartado vs compra:**
   - Compra Stripe: descuenta stock ✅
   - Apartado: NO descuenta stock ❌
   - Puede causar overselling si hay stock > 1

---

## 🛠️ CAMBIOS MÍNIMOS RECOMENDADOS

### PRIORIDAD

**MVP mínimo recomendado:**
1. Landing search (bajo riesgo, alta visibilidad)
2. Campo stock en admin forms (crítico para operación)
3. Descuento stock en apartados (crítico para inventario correcto)
4. Mostrar productos sold/reserved en catálogo con badges (prueba social)

---

## 📋 SUBFASES PROPUESTAS

### MVP A — LANDING SEARCH (2-3 horas)

**Objetivo:** Agregar buscador premium en landing.

**Alcance:**
1. Componente `<SearchBar />` en `/src/components/SearchBar.tsx`
   - Input: placeholder "Busca por marca, modelo o pieza..."
   - Botón: "Buscar" (rosa Bagclue)
   - Enter ejecuta búsqueda
   - Si input vacío: redirige a `/catalogo`
   - Si input con texto: redirige a `/catalogo?search=<query>`

2. Integración en `src/app/page.tsx`
   - Ubicación: Debajo del hero, antes de "Recién llegadas"
   - Wrapper: fondo blanco/marfil, borde rosa suave, max-width 600px, centrado
   - Mobile: input + botón apilados en mobile, lado a lado en desktop

3. Estética:
   - Fondo: `#FFFBF8` o `#FFFFFF`
   - Borde: `border-[#E85A9A]/20`
   - Botón: `bg-[#E85A9A]` hover `bg-[#EC5C9F]`
   - Input: `focus:border-[#E85A9A]`
   - Tipografía: Inter, text-base

**Archivos a crear:**
- `src/components/SearchBar.tsx`

**Archivos a modificar:**
- `src/app/page.tsx` (agregar SearchBar después del hero)

**Testing:**
- Desktop: input visible, botón clickeable, enter funciona
- Mobile: layout correcto, no se rompe
- Redirección: `/catalogo?search=<query>` correcto
- Input vacío: redirige a `/catalogo`

**Criterio de cierre:**
- Buscador visible en landing
- Redirección correcta a catálogo con query param
- No errores en consola
- Mobile funcional

---

### MVP B — STOCK VISIBLE/EDITABLE EN ADMIN (3-4 horas)

**Objetivo:** Admin puede ver y editar stock de productos.

**Alcance:**

1. **Form Crear Producto** (`src/app/admin/productos/new/page.tsx`)
   - Agregar campo: "Stock / Unidades disponibles"
   - Tipo: number, min=0
   - Default: 1
   - Ubicación: Junto a "Precio" en sección "Precio y Publicación"
   - Label: "Stock (unidades disponibles)"
   - Helper text: "Cantidad de unidades disponibles para venta"

2. **Form Editar Producto** (`src/components/admin/EditProductForm.tsx`)
   - Agregar campo: "Stock / Unidades disponibles"
   - Tipo: number, min=0
   - Readonly si `status='sold'` o `status='reserved'`
   - Ubicación: Junto a "Precio" en sección "Precio y Publicación"
   - Mostrar valor actual con color:
     - Verde: stock > 3
     - Amarillo: stock 1-3
     - Rojo: stock = 0

3. **Listado Admin** (`src/app/admin/page.tsx`)
   - Agregar columna "Stock" después de "Precio"
   - Mostrar: número con color (verde/amarillo/rojo)
   - Ordenar por stock disponible

4. **API Products PATCH** (`src/app/api/products/[id]/route.ts`)
   - Ya soporta campo `stock` (verificar)
   - Validar: `stock >= 0`
   - Actualizar `updated_at`

**Archivos a modificar:**
- `src/app/admin/productos/new/page.tsx`
- `src/components/admin/EditProductForm.tsx`
- `src/app/admin/page.tsx`
- `src/app/api/products/[id]/route.ts` (verificar soporte stock)

**Testing:**
- Crear producto con stock=5 → guarda correctamente
- Editar producto con stock=2 → actualiza correctamente
- Listado admin muestra columna stock con colores
- Validación: no permite stock negativo

**Criterio de cierre:**
- Admin puede definir stock al crear producto
- Admin puede editar stock en producto existente
- Listado muestra stock con indicadores visuales
- Validación funcional

---

### MVP C — DESCUENTO STOCK EN APARTADOS (4-5 horas)

**Objetivo:** Apartados descuentan stock correctamente.

**Alcance:**

1. **Validación stock en layaway create** (`src/app/api/layaways/create/route.ts`)
   - Antes de crear layaway:
     ```typescript
     // Validar stock disponible
     if (!product.stock || product.stock < 1) {
       return NextResponse.json({ error: 'Product out of stock' }, { status: 400 })
     }
     ```

2. **Descuento stock al pagar depósito** (`src/app/api/stripe/webhook/route.ts`)
   - En función `handleLayawayDeposit`:
     ```typescript
     // Después de activar layaway (línea 313+)
     // Decrementar stock
     const { data: product } = await supabaseAdmin
       .from('products')
       .select('stock')
       .eq('id', layaway.product_id)
       .single()
     
     if (product && product.stock > 0) {
       const newStock = product.stock - 1
       if (newStock === 0) {
         // Stock agotado: marcar reserved
         await supabaseAdmin
           .from('products')
           .update({ status: 'reserved', stock: 0 })
           .eq('id', layaway.product_id)
       } else {
         // Stock disponible: mantener available, decrementar stock
         await supabaseAdmin
           .from('products')
           .update({ stock: newStock })
           .eq('id', layaway.product_id)
       }
     }
     ```

3. **Lógica status con stock:**
   - `stock > 0` + layaway activo → `status='available'` (otras unidades disponibles)
   - `stock = 0` + layaway activo → `status='reserved'` (última unidad apartada)
   - `stock = 0` + venta completa → `status='sold'`

**Archivos a modificar:**
- `src/app/api/layaways/create/route.ts` (validación stock)
- `src/app/api/stripe/webhook/route.ts` (handleLayawayDeposit: descuento stock)

**Testing:**
- Producto stock=1 → apartar → stock=0, status=reserved
- Producto stock=3 → apartar → stock=2, status=available
- Producto stock=0 → intentar apartar → error "out of stock"
- Layaway completado → producto sold, stock=0

**Criterio de cierre:**
- Apartado descuenta stock correctamente
- Stock=0 bloquea nuevos apartados
- Status refleja disponibilidad real
- Webhook funciona sin errores

---

### MVP D — PRODUCTOS SOLD/RESERVED EN CATÁLOGO (3-4 horas)

**Objetivo:** Mostrar productos vendidos/apartados con badges.

**Alcance:**

1. **Catálogo incluir sold/reserved** (`src/app/catalogo/page.tsx`)
   - Cambiar filtro:
     ```typescript
     // ANTES:
     .in('status', ['available', 'preorder'])
     
     // DESPUÉS:
     .in('status', ['available', 'preorder', 'reserved', 'sold'])
     ```
   - Ordenar: `available` primero, luego `preorder`, luego `reserved`, luego `sold`

2. **ProductCard badges** (`src/components/ProductCard.tsx`)
   - Badge "Vendida" si `status='sold'`:
     - Color: gris oscuro o negro
     - Texto: "Vendida"
   - Badge "Apartada" si `status='reserved'`:
     - Color: amarillo/naranja
     - Texto: "Apartada"
   - Deshabilitar botones compra/apartado si `status='sold'` o `status='reserved'`

3. **Product Detail page deshabilitar acciones** (`src/app/catalogo/[id]/page.tsx`)
   - Si `status='sold'`:
     - Mostrar: "Esta pieza ya fue vendida"
     - Ocultar: botones comprar/apartar
     - Mostrar: sugerencias de piezas similares
   - Si `status='reserved'`:
     - Mostrar: "Esta pieza está apartada"
     - Ocultar: botones comprar/apartar
     - Mostrar: "Regresa pronto o explora piezas similares"

**Archivos a modificar:**
- `src/app/catalogo/page.tsx` (incluir sold/reserved en query)
- `src/components/ProductCard.tsx` (badges + disabled state)
- `src/app/catalogo/[id]/page.tsx` (deshabilitar acciones si sold/reserved)

**Testing:**
- Producto sold aparece en catálogo con badge "Vendida"
- Producto reserved aparece con badge "Apartada"
- Botones deshabilitados correctamente
- Detalle muestra mensaje si sold/reserved
- Mobile correcto

**Criterio de cierre:**
- Productos sold/reserved visibles en catálogo
- Badges claros y legibles
- Botones deshabilitados
- Mensajes informativos en detalle
- No errores

---

## 🚫 QUÉ NO TOCAR

**Backend/DB:**
- ❌ Schema DB (products ya tiene stock)
- ❌ Migrations nuevas
- ❌ RLS policies

**Pagos:**
- ❌ Stripe checkout logic
- ❌ Webhook Stripe (solo agregar descuento stock en apartados)
- ❌ Payment intents
- ❌ Bank transfer MVP.2A

**Admin:**
- ❌ Admin envíos (Fase 1B completada)
- ❌ Admin orders
- ❌ Admin verify payments

**Customer:**
- ❌ Customer panel
- ❌ Shipping address flow
- ❌ Order tracking

**Emails:**
- ❌ Email templates
- ❌ Mailer config
- ❌ Email triggers

**Diseño general:**
- ❌ Navbar
- ❌ Footer
- ❌ Hero editorial (solo agregar SearchBar debajo)
- ❌ Product cards (solo agregar badges)
- ❌ Filtros catálogo existentes

---

## ✅ CRITERIOS DE CIERRE GLOBAL

### MVP A — Landing Search
- [ ] Buscador visible en landing
- [ ] Redirige a `/catalogo?search=<query>`
- [ ] Enter funciona
- [ ] Mobile correcto
- [ ] Sin errores consola

### MVP B — Stock Admin
- [ ] Campo stock en form crear
- [ ] Campo stock en form editar
- [ ] Columna stock en listado admin
- [ ] Validación stock >= 0
- [ ] Colores verde/amarillo/rojo funcionales

### MVP C — Stock Apartados
- [ ] Validación stock > 0 antes de apartar
- [ ] Stock descuenta al pagar depósito
- [ ] Status refleja disponibilidad real
- [ ] Webhook sin errores

### MVP D — Catálogo Sold/Reserved
- [ ] Productos sold/reserved visibles
- [ ] Badge "Vendida" / "Apartada" correctos
- [ ] Botones deshabilitados si sold/reserved
- [ ] Mensajes informativos en detalle
- [ ] Mobile correcto

### Global
- [ ] Build PASS
- [ ] Deploy production exitoso
- [ ] Testing end-to-end PASS
- [ ] No regresiones en áreas prohibidas
- [ ] Jhonatan valida UX final

---

## 📊 RESUMEN RIESGOS

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Buscador rompe diseño editorial | Medio | Bajo | Diseño premium discreto, max-width 600px, ubicación cuidadosa |
| Stock sin validación causa overselling | Alto | Medio | Validar stock > 0 antes de compra/apartado |
| Apartados no descuentan stock | Alto | Alto | Implementar descuento en webhook layaway |
| Admin no puede ajustar stock manualmente | Medio | Bajo | Agregar campo editable en forms |
| Productos vendidos invisibles | Bajo | Bajo | Incluir sold/reserved en catálogo con badges |

---

## 🔄 FLUJO STOCK DESEADO (POST-MVP)

```
Producto creado:
└─ stock = N (definido por admin)
└─ status = available
└─ is_published = true

Compra Stripe:
├─ stock - 1
├─ si stock > 0: status = available
└─ si stock = 0: status = sold

Apartado (depósito):
├─ stock - 1
├─ si stock > 0: status = available
└─ si stock = 0: status = reserved

Apartado completado:
└─ status = sold (ya manejado en webhook)

Producto stock = 0:
├─ bloquea compra
├─ bloquea apartado
└─ muestra badge "Vendida" o "Apartada"
```

---

## 💡 RECOMENDACIONES ADICIONALES (FUERA DE SCOPE)

1. **Notificaciones stock bajo:**
   - Email automático a admin si stock ≤ 2
   - Badge rojo en admin si stock = 0

2. **Historial de stock:**
   - Tabla `stock_movements` (product_id, change, reason, timestamp)
   - Auditoría de cambios de stock

3. **Reserva temporal:**
   - Stock "soft lock" durante checkout (15 min)
   - Evitar race conditions

4. **Stock por variante:**
   - Si producto tiene color/talla/variante
   - Requiere schema más complejo (fuera de MVP)

---

## 📋 DECISIÓN PENDIENTE

**Jhonatan debe aprobar:**
1. ✅ Proceder con todas las subfases (A+B+C+D)
2. ✅ Proceder solo con subfases específicas (ej: A+B)
3. ✅ Modificar scope antes de implementar
4. ❌ Rechazar/pausar hasta tener más claridad

**Una vez aprobado, proceder con implementación por subfases.**

---

**Fin del scope.**
