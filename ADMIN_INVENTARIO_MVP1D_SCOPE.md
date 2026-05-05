# ADMIN INVENTARIO MVP.1D — LISTADO ADMIN DE INVENTARIO MEJORADO
**Fecha:** 2026-05-05  
**Objetivo:** Mejorar el listado de productos del admin para que funcione como inventario operativo completo.  
**Estado:** SCOPE - Pendiente aprobación

---

## 📋 AUDITORÍA ESTADO ACTUAL

### Ruta actual
- **URL:** `/admin` (dashboard principal)
- **Componente:** `/src/app/admin/page.tsx`

### Campos mostrados actualmente
| Campo | Formato | Visible |
|-------|---------|---------|
| Imagen | Miniatura 12x12 | ✅ |
| Título | Texto principal | ✅ |
| Slug | Texto secundario | ✅ |
| Marca | Texto | ✅ |
| Precio | Número + Currency | ✅ |
| Status | Badge (available/preorder/reserved/sold) | ✅ |
| Publicado | Dot indicator (verde/gris) | ✅ |

### Campos disponibles NO mostrados
**Públicos:**
- material
- condition_notes
- authenticity_verified ⭐
- included_accessories
- serial_number
- certificate_notes

**Internos:**
- cost_price ⭐
- additional_costs (JSONB) ⭐
- supplier_name ⭐
- acquisition_date ⭐
- physical_location ⭐
- internal_notes
- stock ⭐

### Acciones actuales
- ✅ Editar → `/admin/productos/[id]`
- ✅ Ver → `/catalogo/[slug]` (nueva pestaña)

### Búsqueda/Filtros
- ❌ NO hay búsqueda
- ❌ NO hay filtros

### Stats mostrados
- Total productos
- Publicados
- Ocultos

### Data source
- **Método:** Supabase directo (supabaseAdmin)
- **Query:** `.select('*, product_images(url)').order('created_at', { ascending: false })`
- **Rendering:** SSR (server component)

---

## 🎯 SCOPE MVP.1D

### 1. RUTA RECOMENDADA

**Opción A (recomendada):** Mantener listado en `/admin`
- ✅ Ya es la convención actual
- ✅ Dashboard = Inventario (core del admin)
- ✅ No requiere cambio de rutas
- ❌ Puede volverse pesado si se agregan más secciones al dashboard

**Opción B:** Crear `/admin/productos`
- ✅ Separación clara (dashboard vs inventario)
- ✅ Escalable si se agregan más módulos (analytics, reportes, etc.)
- ✅ Permite dashboard más limpio con resúmenes ejecutivos
- ❌ Requiere ajustar links existentes

**RECOMENDACIÓN FINAL:** **Opción B** - Crear `/admin/productos` como listado principal
- Mantener `/admin` como dashboard ejecutivo con stats y accesos rápidos
- Mover tabla completa de productos a `/admin/productos` con filtros y búsqueda
- Agregar link "Ver Inventario Completo" en `/admin` que lleve a `/admin/productos`

---

### 2. CAMPOS VISIBLES EN TABLA

**Tabla mejorada con columnas adicionales:**

| Campo | Formato | Justificación | Prioridad |
|-------|---------|---------------|-----------|
| Imagen | Miniatura 48x48 (más grande que actual) | Identificación visual rápida | P0 |
| Título | Texto principal | Identificación del producto | P0 |
| Marca | Texto | Filtro clave para inventario de lujo | P0 |
| Categoría | Badge | Organización por tipo de producto | P0 |
| Precio Venta | $X,XXX MXN | Precio público | P0 |
| Costo Compra | $X,XXX MXN | Cálculo de utilidad | P0 |
| Costos Adicionales | $X,XXX MXN | Suma de additional_costs (shipping+auth+cleaning+other) | P0 |
| Utilidad | $X,XXX MXN | `price - cost_price - total_additional_costs` | P0 |
| Margen % | XX.X% | `(utilidad / price) * 100` | P0 |
| Status | Badge (available/preorder/reserved/sold) | Estado de venta | P0 |
| Stock | Número | Cantidad disponible | P1 |
| Ubicación | Texto corto | Bodega/estante | P1 |
| Proveedor | Texto corto | Fuente de adquisición | P1 |
| Autenticidad | ✓/✗ (icon) | Verificación de autenticidad | P1 |
| Publicado | ✓/✗ (badge) | Visibilidad pública | P0 |
| Fecha Creación | DD/MM/YYYY | Cuándo se agregó al sistema | P2 |
| Fecha Adquisición | DD/MM/YYYY | Cuándo se compró el producto | P2 |
| Acciones | Botones/Iconos | Editar, Ver, Publicar, Eliminar | P0 |

**Notas:**
- **Prioridad P0:** Crítico para MVP.1D
- **Prioridad P1:** Importante, puede diferirse si MVP.1D se vuelve muy grande
- **Prioridad P2:** Nice to have, puede quedar para MVP.1E

**Responsive:**
- Mobile: Mostrar solo imagen, título, precio, margen%, status, acciones (cards)
- Tablet: Agregar marca, costo, utilidad
- Desktop: Tabla completa con todas las columnas P0+P1

---

### 3. BADGES Y ALERTAS VISUALES

**Badges de estado de producto:**

| Badge | Condición | Color | Icono |
|-------|-----------|-------|-------|
| Publicado | `is_published = true` | Verde (#10B981) | ✓ |
| Borrador | `is_published = false` | Amarillo (#F59E0B) | 📝 |
| Disponible | `status = 'available'` | Verde claro (#34D399) | 🟢 |
| Vendido | `status = 'sold'` | Rojo (#EF4444) | ✓ |
| Reservado | `status = 'reserved'` | Amarillo (#FBBF24) | 🔒 |
| Pre-orden | `status = 'preorder'` | Azul (#3B82F6) | 📅 |
| Sin Imagen | `product_images.length = 0` | Rojo claro (#FCA5A5) | 📷 |
| Sin Costo | `cost_price IS NULL` | Naranja (#FB923C) | 💰 |
| Autenticidad ✓ | `authenticity_verified = true` | Verde oscuro (#047857) | ✓ |
| Sin Ubicación | `physical_location IS NULL` | Gris (#9CA3AF) | 📍 |

**Alertas de producto incompleto (warning icons en tabla):**
- ⚠️ Sin imagen (`product_images.length = 0`)
- ⚠️ Sin costo (`cost_price IS NULL`)
- ⚠️ Sin descripción (`description IS NULL OR description = ''`)
- ⚠️ Sin condición detallada (`condition_notes IS NULL OR condition_notes = ''`)
- ⚠️ Sin autenticidad verificada (`authenticity_verified = false`)
- ⚠️ Sin ubicación física (`physical_location IS NULL`)

**Tooltip al hover sobre alerta:** Muestra qué falta completar

---

### 4. FILTROS Y BÚSQUEDA

**Barra de búsqueda:**
- Input tipo text con debounce 300ms
- Búsqueda en:
  - `title` (título del producto)
  - `brand` (marca)
  - `model` (modelo)
  - `slug` (URL)
  - `serial_number` (número de serie)

**Filtros disponibles:**

| Filtro | Opciones | Implementación |
|--------|----------|----------------|
| Status | all / available / preorder / reserved / sold | Dropdown, query param `?status=` |
| Publicación | all / publicado / borrador | Dropdown, query param `?published=` |
| Categoría | all / bolsa / cinturón / zapato / joyería | Dropdown, query param `?category=` |
| Imágenes | all / con-imagen / sin-imagen | Dropdown, query param `?images=` |
| Costo | all / con-costo / sin-costo | Dropdown, query param `?cost=` |
| Autenticidad | all / verificada / no-verificada | Dropdown, query param `?auth=` |

**UI de filtros:**
- Fila horizontal con dropdowns (desktop)
- Botón "Filtros" con modal (mobile)
- Contador de filtros activos: "3 filtros aplicados"
- Botón "Limpiar filtros"

**Ordenamiento:**
- Dropdown "Ordenar por":
  - Más reciente (default)
  - Más antiguo
  - Mayor precio
  - Menor precio
  - Mayor utilidad
  - Menor utilidad
  - Mayor margen %
  - Menor margen %
  - A-Z (título)
  - Z-A (título)

---

### 5. ACCIONES POR PRODUCTO

**Acciones disponibles (iconos/botones en columna Acciones):**

| Acción | Icono | Condición | Efecto |
|--------|-------|-----------|--------|
| Editar | ✏️ | Siempre | Navega a `/admin/productos/[id]` |
| Ver en catálogo | 👁️ | Siempre | Abre `/catalogo/[slug]` en nueva pestaña |
| Publicar | ✓ | `is_published = false` | Toggle `is_published = true`, refetch |
| Despublicar | ✗ | `is_published = true` | Toggle `is_published = false`, refetch |
| Duplicar | 📋 | Siempre (recomendado) | Crea copia con "(Copia)" en título, `is_published = false` |
| Eliminar | 🗑️ | Solo si existe lógica segura | Soft delete (`deleted_at` timestamp) o hard delete con confirmación |

**Notas sobre acciones:**

**Publicar/Despublicar:**
- API: `PATCH /api/products/[id]` con payload `{ is_published: true/false }`
- Endpoint ya existe (usado en EditProductForm)
- Agregar validación: solo publicar si `product_images.length > 0` (tiene al menos 1 imagen)
- Mostrar toast de confirmación: "Producto publicado" / "Producto despublicado"

**Duplicar:**
- API: `POST /api/products/duplicate` con payload `{ product_id: uuid }`
- Crea nuevo producto con:
  - Todos los campos copiados del original
  - Título: `[título original] (Copia)`
  - Slug: generado automáticamente (no duplicar slug)
  - `is_published = false` (siempre borrador)
  - `created_at = NOW()`
  - Imágenes: NO copiar (requeriría duplicar registros en `product_images`)
- Redirige a `/admin/productos/[nuevo_id]?duplicated=true`
- Útil para productos similares (e.g., Chanel 2.55 Small en diferentes colores)

**Eliminar:**
- **Recomendación:** Implementar solo si hay lógica segura
- **Opción A (recomendada):** Soft delete con `deleted_at` timestamp
  - Agregar columna `deleted_at TIMESTAMP NULL`
  - Query admin filtra `WHERE deleted_at IS NULL`
  - Permite recuperación posterior
- **Opción B:** Hard delete con confirmación modal
  - Validar que no hay órdenes asociadas (`orders.product_id`)
  - Validar que no hay layaways asociadas (`layaway_items.product_id`)
  - Modal de confirmación: "¿Seguro? Esta acción no se puede revertir"
  - Solo si pasa validaciones anteriores
- **Si no se implementa eliminar:** Ocultar botón, usar solo despublicar

---

### 6. STATS MEJORADOS (DASHBOARD `/admin`)

**Stats actuales:**
- Total productos
- Publicados
- Ocultos

**Stats recomendados para MVP.1D:**

| Stat | Cálculo | Color |
|------|---------|-------|
| Total Productos | `COUNT(*)` | Blanco |
| Publicados | `COUNT(*) WHERE is_published = true` | Verde |
| Borradores | `COUNT(*) WHERE is_published = false` | Amarillo |
| Disponibles | `COUNT(*) WHERE status = 'available'` | Verde claro |
| Vendidos | `COUNT(*) WHERE status = 'sold'` | Rojo |
| Sin Costo | `COUNT(*) WHERE cost_price IS NULL` | Naranja (⚠️) |
| Sin Imagen | `COUNT(*) WHERE product_images IS NULL` | Rojo claro (⚠️) |
| Valor Total Inventario | `SUM(price) WHERE status IN ('available', 'preorder')` | Dorado |
| Costo Total Inventario | `SUM(cost_price + additional_costs_total) WHERE status IN ('available', 'preorder')` | Gris |
| Utilidad Proyectada | `Valor Total - Costo Total` | Verde |
| Margen Promedio % | `AVG(margen %) WHERE status IN ('available', 'preorder')` | Cyan |

**Layout stats:**
- Grid 3 columnas desktop, 2 columnas tablet, 1 columna mobile
- Tamaño número grande (3xl) + label pequeño (sm)
- Stats de alerta (Sin Costo, Sin Imagen) con icono ⚠️

---

### 7. SEGURIDAD

**Campos internos (NUNCA exponer públicamente):**
- `cost_price`
- `additional_costs`
- `supplier_name`
- `acquisition_date`
- `physical_location`
- `internal_notes`
- `certificate_notes` (si contiene info sensible)

**Validaciones:**
- ✅ Listado `/admin/productos` requiere autenticación admin (`isAuthenticated()`)
- ✅ APIs de productos verifican autenticación (`requireAuth` middleware)
- ✅ RLS policies de Supabase protegen acceso directo (ya implementado en MVP.1C)
- ✅ No incluir campos internos en `PRODUCT_PUBLIC_FIELDS` (ya validado en MVP.1C)
- ✅ Frontend catálogo/detail NO consulta campos internos

**Nuevas validaciones para MVP.1D:**
- Publicar producto requiere `product_images.length > 0`
- Eliminar producto requiere validación de órdenes asociadas (si se implementa)

---

### 8. NO TOCAR (FUERA DE SCOPE)

**Módulos prohibidos para MVP.1D:**
- ❌ Checkout flow
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Orders module
- ❌ Layaways module
- ❌ Admin envíos
- ❌ Customer panel
- ❌ DB schema changes (migrations)
- ❌ RLS policies
- ❌ Authentication flow

**Nota:** MVP.1D solo modifica:
- `/src/app/admin/page.tsx` (dashboard stats)
- `/src/app/admin/productos/page.tsx` (nuevo listado completo)
- `/src/components/admin/*` (componentes de tabla/filtros/badges)
- Posiblemente `/src/app/api/products/duplicate/route.ts` (si se implementa duplicar)
- Posiblemente `/src/app/api/products/[id]/publish/route.ts` (si se prefiere endpoint dedicado vs reusar PATCH)

---

### 9. CRITERIOS DE CIERRE MVP.1D

**Checklist de validación (todos deben ser PASS):**

#### Funcionalidad Core
- [ ] 1. Ruta `/admin/productos` existe y renderiza correctamente
- [ ] 2. Dashboard `/admin` muestra stats mejorados (mínimo 8 stats)
- [ ] 3. Tabla de productos muestra todos los campos P0 (imagen, título, marca, precio, costo, utilidad, margen%, status, publicado, acciones)
- [ ] 4. Tabla responsive (cards en mobile, tabla en desktop)

#### Búsqueda y Filtros
- [ ] 5. Búsqueda funciona correctamente (debounce 300ms, busca en título/marca/modelo)
- [ ] 6. Filtros funcionan (status, publicado, categoría, imágenes, costo, autenticidad)
- [ ] 7. Ordenamiento funciona (mínimo: reciente, precio, utilidad, margen%)
- [ ] 8. Query params reflejan estado de filtros (shareable URL)
- [ ] 9. "Limpiar filtros" resetea todos los filtros correctamente

#### Badges y Alertas
- [ ] 10. Badges de estado se muestran correctamente (Publicado, Borrador, Disponible, Vendido, etc.)
- [ ] 11. Alertas de producto incompleto funcionan (⚠️ sin imagen, sin costo, etc.)
- [ ] 12. Tooltips de alertas muestran descripción clara

#### Acciones
- [ ] 13. Editar → navega a `/admin/productos/[id]` correctamente
- [ ] 14. Ver → abre `/catalogo/[slug]` en nueva pestaña
- [ ] 15. Publicar/Despublicar funciona (toggle, refetch, toast confirmación)
- [ ] 16. Publicar valida que producto tiene al menos 1 imagen
- [ ] 17. (Opcional) Duplicar funciona (crea copia, redirige a edición)
- [ ] 18. (Opcional) Eliminar funciona con validación/confirmación

#### Cálculos
- [ ] 19. Costo total adicional se calcula correctamente (suma de shipping + auth + cleaning + other)
- [ ] 20. Utilidad se calcula correctamente (price - cost_price - additional_costs_total)
- [ ] 21. Margen % se calcula correctamente ((utilidad / price) * 100)
- [ ] 22. Stats de dashboard calculan valores correctos (valor total, costo total, utilidad proyectada)

#### Seguridad
- [ ] 23. Campos internos NO se exponen en catálogo público
- [ ] 24. Ruta `/admin/productos` requiere autenticación
- [ ] 25. APIs de productos verifican autenticación correctamente

#### UX y Performance
- [ ] 26. Tabla carga rápido (<2s con 50 productos)
- [ ] 27. Filtros/búsqueda responden de forma fluida (no lag)
- [ ] 28. No hay errores en consola (críticos o warnings relevantes)
- [ ] 29. Build Next.js exitoso sin errores
- [ ] 30. Deploy a Vercel exitoso

**MÍNIMO PARA CIERRE:** 25/30 PASS (core + filtros + acciones + cálculos + seguridad)

---

### 10. FASES DE IMPLEMENTACIÓN RECOMENDADAS

**SUBFASE 1D.1 — BACKEND (API y queries)**
- Crear helper `calculateProductMetrics(product)` para utilidad/margen
- Agregar endpoint `POST /api/products/[id]/publish` (o reusar PATCH)
- Agregar endpoint `POST /api/products/duplicate` (si se implementa)
- Agregar endpoint `GET /api/products` con query params (search, filters, sort)

**SUBFASE 1D.2 — COMPONENTES UI**
- `ProductsTable.tsx` - tabla principal con columnas P0
- `ProductFilters.tsx` - barra de filtros
- `ProductSearchBar.tsx` - búsqueda con debounce
- `ProductBadges.tsx` - badges de estado
- `ProductActions.tsx` - botones de acción (editar, ver, publicar, duplicar)
- `ProductAlerts.tsx` - alertas de producto incompleto

**SUBFASE 1D.3 — PÁGINA LISTADO**
- Crear `/src/app/admin/productos/page.tsx`
- Integrar componentes UI
- Conectar con API
- Implementar búsqueda/filtros/sort
- Responsive (cards mobile, tabla desktop)

**SUBFASE 1D.4 — DASHBOARD STATS**
- Modificar `/src/app/admin/page.tsx`
- Agregar stats mejorados (8-12 stats)
- Agregar link "Ver Inventario Completo" → `/admin/productos`
- Mostrar resumen de alertas (X productos sin costo, Y sin imagen)

**SUBFASE 1D.5 — QA Y CIERRE**
- Ejecutar checklist de 30 criterios
- Fix de bugs encontrados
- Validar cálculos de utilidad/margen
- Validar seguridad (campos internos no expuestos)
- Build + deploy
- Cierre formal con reporte

---

### 11. DECISIONES PENDIENTES

**Requieren aprobación de Jhonatan:**

1. **Ruta final:** ¿Mantener `/admin` o crear `/admin/productos`?
   - Recomendación: `/admin/productos` (escalabilidad)

2. **Columnas P1 (stock, ubicación, proveedor, autenticidad icon):** ¿Incluir en MVP.1D o diferir a MVP.1E?
   - Recomendación: Incluir en MVP.1D (son críticas para inventario operativo)

3. **Duplicar producto:** ¿Implementar en MVP.1D?
   - Recomendación: SÍ (alto valor, baja complejidad)

4. **Eliminar producto:** ¿Implementar soft delete, hard delete, o no implementar?
   - Recomendación: Soft delete con `deleted_at` timestamp (seguro, reversible)

5. **Stats dashboard:** ¿Cuántos stats mostrar?
   - Recomendación: Mínimo 8, máximo 12 (evitar sobrecarga visual)

6. **Responsive:** ¿Cards en mobile o tabla scrolleable?
   - Recomendación: Cards en mobile (mejor UX, muestra solo campos críticos)

---

### 12. ESTIMACIÓN DE ESFUERZO

| Subfase | Esfuerzo | Riesgo | Prioridad |
|---------|----------|--------|-----------|
| 1D.1 Backend | 2h | Bajo | P0 |
| 1D.2 Componentes UI | 3h | Medio | P0 |
| 1D.3 Página Listado | 2h | Bajo | P0 |
| 1D.4 Dashboard Stats | 1h | Bajo | P0 |
| 1D.5 QA y Cierre | 1h | Bajo | P0 |

**Total estimado:** 9 horas de desarrollo + 1 hora QA = **10 horas**

**Riesgos identificados:**
- 🟡 Cálculo de additional_costs_total desde JSONB (requiere validación)
- 🟡 Performance con 100+ productos (puede requerir paginación)
- 🟢 Resto de funcionalidad es low-risk (patrones ya implementados en MVP.1C)

**Mitigaciones:**
- Pre-calcular metrics en backend (no en frontend)
- Implementar paginación si listado >50 productos (server-side)
- Reusar componentes existentes (badges, botones, modals)

---

## ✅ APROBACIÓN REQUERIDA

**Este scope requiere aprobación de Jhonatan antes de implementar.**

**Decisiones críticas a confirmar:**
1. ¿Ruta `/admin/productos` o mantener `/admin`?
2. ¿Incluir columnas P1 (stock, ubicación, proveedor) o solo P0?
3. ¿Implementar duplicar producto?
4. ¿Implementar eliminar producto (soft delete)?
5. ¿Cuántos stats mostrar en dashboard (8-12)?

**Siguiente paso tras aprobación:**
- Crear `ADMIN_INVENTARIO_MVP1D_IMPLEMENTACION.md` con plan detallado
- Implementar SUBFASE 1D.1 (Backend)
- Iterar subfases hasta cierre

---

**Documento preparado por:** Kepler  
**Fecha:** 2026-05-05  
**Proyecto:** Bagclue - Admin Inventario Profesional  
**Fase:** MVP.1D - Listado Admin Mejorado
