# ADMIN INVENTARIO REAL — Guía Operativa

**Fecha:** 2026-05-07  
**Proyecto:** Bagclue  
**Responsable:** Jhonatan / Pilar  

---

## ⚠️ REGLA CRÍTICA — NO CONVERTIR PRODUCTOS TEST EN PRODUCTOS REALES

### Problema Detectado
Durante la carga de inventario real (2026-05-07), se intentó editar un producto viejo con slug `/catalogo/channel` (test de Chanel) para convertirlo en una Goyard real. Esto causó que:
- El slug quedara incorrecto (`/catalogo/channel` para una Goyard)
- La URL no coincidiera con el producto real
- Pérdida de coherencia en el catálogo

### Regla Operativa Permanente

**PROHIBIDO:**
- ❌ Editar productos test para convertirlos en productos reales
- ❌ Cambiar la marca de un producto existente a otra marca
- ❌ Reutilizar fichas viejas/test para inventario real
- ❌ Editar slug manualmente (no hay campo editable, pero evitar trucos)

**CORRECTO:**
- ✅ Crear producto nuevo desde `/admin/productos/new`
- ✅ Cargar datos reales desde cero
- ✅ Dejar slug auto-generado intacto
- ✅ Revisar card y detalle antes de publicar
- ✅ Solo publicar cuando esté 100% correcto

---

## 📋 PROCESO PARA CARGAR INVENTARIO REAL

### Paso 1: Crear Producto Nuevo
1. Ir a `/admin/productos/new`
2. **NO reutilizar fichas viejas/test**

### Paso 2: Completar Información Básica
- **Título:** Marca + Modelo + Color (ej: "Goyard Saint Louis PM Vino")
- **Marca:** Seleccionar marca correcta (Goyard, Chanel, Hermès, etc.)
- **Modelo:** Nombre exacto del modelo (ej: "Saint Louis PM", "Classic Flap")
- **Color:** Color exacto (ej: "Vino", "Negro", "Beige")
- **Origen:** País de fabricación (Francia, Italia, USA, etc.)
- **Material:** Material principal (ej: "Lona Goyardine y piel", "Caviar leather")
- **Categoría:** Bolsas / Accesorios / Colección París
- **Condición:** new / excellent / very_good / good / used
- **Precio:** Precio real en MXN o USD
- **Stock:** 1 (para piezas únicas)

### Paso 3: Cargar Imágenes Reales
1. Subir fotos de alta calidad del producto físico
2. Mínimo 3-4 fotos: frontal, lateral, interior, detalles
3. Verificar que las imágenes sean de la pieza real (no stock photos)

### Paso 4: Completar Autenticidad
- **Autenticidad verificada:** Marcar si tiene certificado Entrupy
- **Número de serie:** Anotar si está visible
- **Accesorios incluidos:** Caja, dust bag, certificado, etc.
- **Includes box / dust bag / papers:** Marcar checkboxes correspondientes

### Paso 5: Costos Internos (Admin Only)
- **Costo de compra:** Precio pagado al proveedor
- **Costos adicionales:** Envío, autenticación, limpieza, otros
- **Proveedor:** Nombre o código del proveedor
- **Fecha de adquisición:** Cuándo se compró
- **Ubicación física:** Dónde está guardada la pieza

### Paso 6: Visibilidad
- **Toggle "Visible en tienda":** Dejar en **INACTIVO** al crear
- **Motivo:** Permite revisar card y detalle antes de publicar
- **Publicar solo cuando:** Fotos correctas, precio verificado, descripción completa

### Paso 7: Guardar y Revisar
1. Guardar producto (se genera slug automático)
2. Ir a `/admin/productos` → buscar producto creado
3. Ver preview: Click "👁️ Ver" (aunque esté inactivo, admin puede verlo)
4. Verificar:
   - Slug correcto (ej: `/catalogo/goyard-saint-louis-pm-vino`)
   - Fotos bien cargadas
   - Precio visible
   - Descripción clara
5. Si todo correcto → **Activar toggle "Visible en tienda"**

---

## 🚨 SI UN PRODUCTO TIENE SLUG INCORRECTO

### Qué Hacer:
1. **Dejar producto como INACTIVO** (toggle off)
2. **Crear producto nuevo** desde cero con datos correctos
3. **NO intentar arreglar el slug** editando campos
4. El slug incorrecto puede quedar archivado o eliminarse después

### Caso Específico: Producto `/catalogo/channel` (2026-05-07)
- **Problema:** Slug viejo de Chanel test, pero contenido editado como Goyard
- **Solución:**
  1. ✅ Dejar `/catalogo/channel` como INACTIVO
  2. ✅ Crear nueva ficha para la Goyard desde cero
  3. ✅ Usar datos reales correctos

---

## 📝 DATOS SUGERIDOS — GOYARD VINO (Caso 2026-05-07)

### Opción A: Goyard Anjou PM
```
Título: Goyard Anjou PM Vino
Marca: Goyard
Modelo: Anjou PM
Color: Vino / Burgundy
Origen: Francia
Material: Lona Goyardine y piel
Categoría: Bolsas
Condición: excellent (o la correcta)
Stock: 1
Visibilidad: Inactivo (al crear)
```

### Opción B: Goyard Saint Louis PM
```
Título: Goyard Saint Louis PM Vino
Marca: Goyard
Modelo: Saint Louis PM
Color: Vino / Burgundy
Origen: Francia
Material: Lona Goyardine y piel
Categoría: Bolsas
Condición: excellent (o la correcta)
Stock: 1
Visibilidad: Inactivo (al crear)
```

**Nota:** Verificar modelo correcto antes de crear.

---

## 🔮 MEJORA FUTURA — REGENERAR URL (NO IMPLEMENTAR AHORA)

### Objetivo
Permitir regenerar slug de un producto únicamente cuando sea seguro hacerlo.

### Condiciones para Regenerar Slug
Solo permitir si se cumplen **TODAS** estas condiciones:
1. ✅ Producto está **INACTIVO** (is_published = false)
2. ✅ Producto **NO tiene órdenes** asociadas (ninguna venta)
3. ✅ Producto **NO tiene apartados** activos
4. ✅ Admin **confirma la acción** con prompt de seguridad

### Flujo Propuesto (Futuro)
1. En `/admin/productos/[id]`, mostrar botón "⚠️ Regenerar URL" (solo si condiciones se cumplen)
2. Click → Confirmación:
   ```
   ⚠️ Regenerar URL del Producto
   
   Esta acción generará un nuevo slug basado en:
   - Marca: {brand}
   - Modelo: {model}
   - Color: {color}
   
   Nuevo slug: /catalogo/{nuevo-slug-generado}
   Slug actual: /catalogo/{slug-actual}
   
   ⚠️ ADVERTENCIA: El slug anterior dejará de funcionar.
   Solo haz esto si el producto NO ha sido compartido públicamente.
   
   [Cancelar] [Confirmar y Regenerar]
   ```
3. Si confirma → Backend regenera slug y actualiza DB
4. Banner de éxito con nuevo slug

### Validaciones Backend (Futuro)
```typescript
// Pseudocódigo - NO implementar ahora
async function canRegenerateSlug(productId: string): Promise<boolean> {
  const product = await getProduct(productId)
  
  // Check 1: Producto inactivo
  if (product.is_published) return false
  
  // Check 2: Sin órdenes
  const ordersCount = await db.orders
    .count()
    .where('order_items', 'contains', productId)
  if (ordersCount > 0) return false
  
  // Check 3: Sin apartados activos
  const layawaysCount = await db.layaways
    .count()
    .where('product_id', '=', productId)
    .where('status', 'in', ['active', 'completed'])
  if (layawaysCount > 0) return false
  
  return true
}
```

### Por Qué NO Implementar Ahora
- Requiere validación cuidadosa de relaciones DB
- Necesita testing exhaustivo para evitar romper URLs públicas
- Por ahora, crear producto nuevo es más seguro
- Esta funcionalidad es para casos edge, no crítica

### Cuándo Implementar
- Después de tener inventario real completo
- Cuando haya patrón recurrente de slugs incorrectos
- Después de QA completo de órdenes/apartados
- Con aprobación explícita de Jhonatan

---

## ✅ RESUMEN — Reglas de Inventario Real

1. **Crear producto nuevo** para cada pieza real
2. **NO reutilizar** fichas test/viejas
3. **Slug auto-generado** → no tocar
4. **Inactivo al crear** → activar solo cuando esté perfecto
5. **Si slug incorrecto** → producto inactivo + crear nuevo
6. **Regenerar slug** → solo futuro, con condiciones estrictas

---

**Última actualización:** 2026-05-07  
**Próxima revisión:** Después de cargar primer lote de inventario real
