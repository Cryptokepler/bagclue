# ADMIN INVENTARIO MVP.1C — FORMULARIO ADMIN PROFESIONAL
**Fecha:** 2026-05-05  
**Estado:** SCOPE PENDIENTE APROBACIÓN  
**Objetivo:** Actualizar formulario crear/editar producto con campos de inventario profesional para carga de artículos de lujo

---

## 1. ARCHIVOS A MODIFICAR

### Frontend
- `/src/app/admin/productos/new/page.tsx` — Formulario crear producto
- `/src/components/admin/EditProductForm.tsx` — Formulario editar producto
- Opcional: `/src/components/admin/ProfitCalculator.tsx` — Componente de cálculo de rentabilidad (si se extrae)

### Backend/API
- `/src/app/api/products/create/route.ts` — Agregar campos nuevos al INSERT
- `/src/app/api/products/[id]/route.ts` — Agregar campos nuevos al UPDATE

### Validación
- NO se requiere modificar `/src/lib/products-public-fields.ts` para campos internos
- Campos internos NO deben exponerse en catálogo público

---

## 2. CAMPOS POR SECCIÓN

### SECCIÓN A: Información Básica
| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `title` | Text | **Sí** | Ya existe |
| `brand` | Text | **Sí** | Ya existe |
| `model` | Text | No | Ya existe |
| `color` | Text | No | Ya existe |
| `origin` | Text | No | Ya existe |
| `material` | Text | No | ⭐ NUEVO - "Piel caviar, lona, oro 18k…" |

### SECCIÓN B: Estado y Condición
| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `status` | Select | **Sí** | Ya existe |
| `condition` | Select | **Sí** | Ya existe |
| `category` | Select | **Sí** | Ya existe |
| `condition_notes` | Textarea | No | ⭐ NUEVO - "Ligero desgaste en esquinas…" |

### SECCIÓN C: Precio y Publicación
| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `price` | Number | **Sí** | Ya existe |
| `currency` | Select | No | Ya existe |
| `badge` | Text | No | Ya existe |
| `description` | Textarea | No | Ya existe |
| `is_published` | Checkbox | No | Ya existe |
| `allow_layaway` | Checkbox | No | Ya existe |
| `layaway_deposit_percent` | Number | No | Ya existe |

### SECCIÓN D: Autenticidad y Accesorios ⭐ NUEVA
| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `authenticity_verified` | Checkbox | No | ⭐ NUEVO - Default: false |
| `certificate_notes` | Textarea | No | ⭐ NUEVO - Solo admin |
| `serial_number` | Text | No | ⭐ NUEVO - Solo admin |
| `included_accessories` | Textarea | No | ⭐ NUEVO - "Caja, dust bag, certificado…" |
| `includes_box` | Checkbox | No | Ya existe |
| `includes_dust_bag` | Checkbox | No | Ya existe |
| `includes_papers` | Checkbox | No | Ya existe |

### SECCIÓN E: Información Interna ⭐ NUEVA
**Nota visible:** "Estos datos son privados y no se muestran en la tienda."

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `cost_price` | Number | No | ⭐ NUEVO - "Costo de compra" |
| `additional_costs` | JSONB | No | ⭐ NUEVO - Ver estructura abajo |
| `supplier_name` | Text | No | ⭐ NUEVO - "Proveedor / fuente" |
| `acquisition_date` | Date | No | ⭐ NUEVO |
| `physical_location` | Text | No | ⭐ NUEVO - "Showroom, bodega, vitrina 1…" |
| `internal_notes` | Textarea | No | ⭐ NUEVO - Solo admin |

---

## 3. OBLIGATORIOS VS OPCIONALES

### Obligatorios para guardar:
- `title`
- `brand`
- `category`
- `condition`
- `price`
- `status`

### Todos los demás son opcionales, incluyendo:
- Todos los campos nuevos (material, condition_notes, etc.)
- Todos los campos internos (cost_price, supplier_name, etc.)
- model, color, origin, description, badge

**Regla crítica:** Debe permitir guardar producto aunque falten campos internos o públicos opcionales.

---

## 4. CAMBIOS FRONTEND

### 4.1. Crear Producto (`/admin/productos/new`)

**Modificaciones:**
1. Agregar campo `material` en sección "Información Básica"
2. Agregar campo `condition_notes` (textarea) en sección "Estado y Condición"
3. Crear sección nueva "Autenticidad y Accesorios" con:
   - `authenticity_verified` (checkbox)
   - `certificate_notes` (textarea)
   - `serial_number` (text)
   - `included_accessories` (textarea)
   - `includes_box`, `includes_dust_bag`, `includes_papers` (mover aquí si están en otra sección)
4. Crear sección nueva "Información Interna" con:
   - Nota: "Estos datos son privados y no se muestran en la tienda."
   - `cost_price` (number)
   - `additional_costs` — 4 campos numéricos:
     - Costo envío/importación
     - Costo autenticación
     - Costo limpieza/reparación
     - Otros costos
   - `supplier_name` (text)
   - `acquisition_date` (date input)
   - `physical_location` (text)
   - `internal_notes` (textarea)
5. Agregar componente de cálculo de rentabilidad (si `cost_price` existe)

### 4.2. Editar Producto (`EditProductForm.tsx`)

**Modificaciones:**
1. Mismos campos que crear
2. Mostrar `slug` como campo read-only (disabled)
3. NO regenerar slug al editar
4. Permitir guardar sin completar campos nuevos (no obligar backfill)

### 4.3. Componente Cálculo Rentabilidad

**Ubicación:** Dentro de sección "Información Interna"

**Mostrar solo si `cost_price > 0`:**

```tsx
<div className="border border-gray-200 rounded p-4 bg-gray-50">
  <h3 className="text-sm font-medium text-gray-900 mb-3">📊 Rentabilidad Estimada</h3>
  
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-600">Costo de compra:</span>
      <span className="font-medium">${formatNumber(cost_price)} MXN</span>
    </div>
    
    <div className="flex justify-between">
      <span className="text-gray-600">Costos adicionales:</span>
      <span className="font-medium">${formatNumber(totalAdditionalCosts)} MXN</span>
    </div>
    
    <div className="border-t border-gray-300 pt-2 flex justify-between">
      <span className="text-gray-700 font-medium">Costo total:</span>
      <span className="font-medium">${formatNumber(totalCost)} MXN</span>
    </div>
    
    <div className="flex justify-between">
      <span className="text-gray-700 font-medium">Precio de venta:</span>
      <span className="font-medium">${formatNumber(price)} MXN</span>
    </div>
    
    <div className="border-t border-gray-300 pt-2 flex justify-between">
      <span className="text-gray-900 font-semibold">Utilidad estimada:</span>
      <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        ${formatNumber(profit)} MXN
      </span>
    </div>
    
    <div className="flex justify-between">
      <span className="text-gray-900 font-semibold">Margen:</span>
      <span className={`font-semibold ${getMarginColor(margin)}`}>
        {margin.toFixed(1)}%
      </span>
    </div>
  </div>
</div>
```

**Colores de margen:**
- `margin > 30%`: `text-green-600`
- `margin 15-30%`: `text-yellow-600`
- `margin < 15%`: `text-red-600`

**Fórmulas:**
```typescript
const totalAdditionalCosts = 
  (additional_costs.shipping || 0) + 
  (additional_costs.authentication || 0) + 
  (additional_costs.cleaning || 0) + 
  (additional_costs.other || 0)

const totalCost = cost_price + totalAdditionalCosts
const profit = price - totalCost
const margin = (profit / price) * 100
```

---

## 5. CAMBIOS BACKEND/API

### 5.1. `/api/products/create/route.ts`

**Auditar y modificar:**

1. Agregar campos nuevos al INSERT:
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    // Existentes...
    title,
    brand,
    slug, // auto-generado
    // ...
    
    // NUEVOS - Públicos
    material: material || null,
    condition_notes: condition_notes || null,
    authenticity_verified: authenticity_verified || false,
    included_accessories: included_accessories || null,
    
    // NUEVOS - Internos
    cost_price: cost_price || null,
    additional_costs: additional_costs || null, // JSONB
    supplier_name: supplier_name || null,
    acquisition_date: acquisition_date || null,
    physical_location: physical_location || null,
    internal_notes: internal_notes || null,
    certificate_notes: certificate_notes || null,
    serial_number: serial_number || null
  })
  .select()
  .single()
```

2. Validar `additional_costs` si se envía:
```typescript
if (additional_costs) {
  // Si es string, parsear
  let costs = typeof additional_costs === 'string' 
    ? JSON.parse(additional_costs) 
    : additional_costs
  
  // Validar estructura
  if (typeof costs !== 'object' || costs === null) {
    return NextResponse.json({ error: 'additional_costs debe ser objeto JSON' }, { status: 400 })
  }
  
  // Normalizar
  additional_costs = {
    shipping: costs.shipping || null,
    authentication: costs.authentication || null,
    cleaning: costs.cleaning || null,
    other: costs.other || null
  }
}
```

### 5.2. `/api/products/[id]/route.ts` (PUT)

**Auditar y modificar:**

1. Agregar campos nuevos al UPDATE:
```typescript
const { data, error } = await supabase
  .from('products')
  .update({
    // Existentes (excepto slug)...
    title,
    brand,
    // NO actualizar slug
    
    // NUEVOS - Públicos
    material: material || null,
    condition_notes: condition_notes || null,
    authenticity_verified: authenticity_verified || false,
    included_accessories: included_accessories || null,
    
    // NUEVOS - Internos
    cost_price: cost_price || null,
    additional_costs: additional_costs || null,
    supplier_name: supplier_name || null,
    acquisition_date: acquisition_date || null,
    physical_location: physical_location || null,
    internal_notes: internal_notes || null,
    certificate_notes: certificate_notes || null,
    serial_number: serial_number || null,
    
    updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .select()
  .single()
```

2. Misma validación de `additional_costs` que en create

### 5.3. Importante: NO exponer campos internos

**Verificar que `/src/lib/products-public-fields.ts` NO incluye:**
- `cost_price`
- `additional_costs`
- `supplier_name`
- `acquisition_date`
- `physical_location`
- `internal_notes`
- `certificate_notes`
- `serial_number`

**SÍ puede incluir campos públicos nuevos:**
- `material`
- `condition_notes`
- `authenticity_verified`
- `included_accessories`

---

## 6. MANEJO DE `additional_costs`

### Estructura JSONB en DB:
```json
{
  "shipping": 500,
  "authentication": 200,
  "cleaning": 100,
  "other": 50
}
```

### Opción implementación frontend (recomendada):

**4 campos numéricos separados:**
```tsx
<div>
  <label>Costo envío/importación</label>
  <input 
    type="number" 
    min="0"
    value={additionalCosts.shipping || ''}
    onChange={(e) => setAdditionalCosts({
      ...additionalCosts,
      shipping: parseFloat(e.target.value) || null
    })}
  />
</div>

<div>
  <label>Costo autenticación</label>
  <input 
    type="number" 
    min="0"
    value={additionalCosts.authentication || ''}
    onChange={(e) => setAdditionalCosts({
      ...additionalCosts,
      authentication: parseFloat(e.target.value) || null
    })}
  />
</div>

<div>
  <label>Costo limpieza/reparación</label>
  <input 
    type="number" 
    min="0"
    value={additionalCosts.cleaning || ''}
    onChange={(e) => setAdditionalCosts({
      ...additionalCosts,
      cleaning: parseFloat(e.target.value) || null
    })}
  />
</div>

<div>
  <label>Otros costos</label>
  <input 
    type="number" 
    min="0"
    value={additionalCosts.other || ''}
    onChange={(e) => setAdditionalCosts({
      ...additionalCosts,
      other: parseFloat(e.target.value) || null
    })}
  />
</div>
```

**Al enviar al backend:**
```typescript
const payload = {
  // ...otros campos
  additional_costs: {
    shipping: additionalCosts.shipping || null,
    authentication: additionalCosts.authentication || null,
    cleaning: additionalCosts.cleaning || null,
    other: additionalCosts.other || null
  }
}
```

### Alternativa (textarea JSON):

Menos recomendada para MVP, más propensa a errores de usuario.

---

## 7. CÁLCULO DE MARGEN (UI ONLY)

**NO guardar en DB.**  
Solo calcular en tiempo real en UI cuando `cost_price > 0`.

**Fórmulas:**
```typescript
// Suma de costos adicionales
const totalAdditionalCosts = 
  (additionalCosts.shipping || 0) + 
  (additionalCosts.authentication || 0) + 
  (additionalCosts.cleaning || 0) + 
  (additionalCosts.other || 0)

// Costo total
const totalCost = (cost_price || 0) + totalAdditionalCosts

// Utilidad
const profit = (price || 0) - totalCost

// Margen porcentual
const margin = price > 0 ? (profit / price) * 100 : 0
```

**Mostrar:**
- Costo de compra
- Costos adicionales (suma)
- Costo total
- Precio de venta
- Utilidad estimada (con color verde/rojo)
- Margen % (con color verde/amarillo/rojo)

---

## 8. VALIDACIONES

### 8.1. Frontend (antes de enviar)

1. **Obligatorios:** title, brand, category, condition, price, status
2. **price:** debe ser número > 0
3. **cost_price:** si se envía, debe ser número >= 0
4. **additional_costs (campos):** si se envían, deben ser números >= 0
5. **acquisition_date:** no puede ser fecha futura
6. **authenticity_verified:** debe ser boolean
7. **Textareas:** límite razonable (ej: 2000 caracteres)

**Mensajes de error claros:**
- "El precio debe ser mayor a 0"
- "El costo de compra no puede ser negativo"
- "La fecha de adquisición no puede ser futura"

### 8.2. Backend (API routes)

1. **Validar campos obligatorios:**
```typescript
if (!title || !brand || !category || !condition || !price || !status) {
  return NextResponse.json(
    { error: 'Faltan campos obligatorios: title, brand, category, condition, price, status' },
    { status: 400 }
  )
}
```

2. **Validar tipos:**
```typescript
if (price && (typeof price !== 'number' || price <= 0)) {
  return NextResponse.json({ error: 'price debe ser número positivo' }, { status: 400 })
}

if (cost_price && (typeof cost_price !== 'number' || cost_price < 0)) {
  return NextResponse.json({ error: 'cost_price debe ser número no negativo' }, { status: 400 })
}
```

3. **Validar additional_costs:**
```typescript
if (additional_costs) {
  const costs = typeof additional_costs === 'string' 
    ? JSON.parse(additional_costs) 
    : additional_costs
  
  if (typeof costs !== 'object' || costs === null) {
    return NextResponse.json({ error: 'additional_costs debe ser objeto JSON' }, { status: 400 })
  }
  
  // Validar que valores sean números o null
  const keys = ['shipping', 'authentication', 'cleaning', 'other']
  for (const key of keys) {
    if (costs[key] !== null && costs[key] !== undefined) {
      if (typeof costs[key] !== 'number' || costs[key] < 0) {
        return NextResponse.json({ error: `additional_costs.${key} debe ser número no negativo` }, { status: 400 })
      }
    }
  }
}
```

4. **Validar fecha:**
```typescript
if (acquisition_date) {
  const date = new Date(acquisition_date)
  const now = new Date()
  if (date > now) {
    return NextResponse.json({ error: 'acquisition_date no puede ser futura' }, { status: 400 })
  }
}
```

---

## 9. RIESGOS

### 9.1. Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Campos JSONB no se guardan correctamente | Baja | Medio | Validar estructura antes de INSERT/UPDATE |
| Productos viejos se rompen al editar | Baja | Alto | Permitir campos opcionales null, no obligar backfill |
| Campos internos se exponen en catálogo | Media | Alto | Auditar PRODUCT_PUBLIC_FIELDS, no incluir internos |
| Cálculo de margen incorrecto | Baja | Bajo | Fórmulas simples, testear con casos reales |

### 9.2. Riesgos UX

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Formulario demasiado largo | Media | Medio | Organizar en secciones claras, usar spacing |
| Pilar confunde campos internos/públicos | Media | Medio | Nota visible "estos datos son privados" |
| additional_costs confuso | Media | Medio | 4 campos separados en vez de JSON manual |

---

## 10. CRITERIOS DE CIERRE MVP.1C

### Funcionalidad:
1. ✅ Formulario crear producto tiene todos los campos nuevos organizados en 5 secciones
2. ✅ Formulario editar producto tiene todos los campos nuevos
3. ✅ Campo slug mostrado como read-only en editar
4. ✅ Cálculo de rentabilidad visible cuando cost_price > 0
5. ✅ API /products/create acepta y guarda todos los campos nuevos
6. ✅ API /products/[id] acepta y guarda todos los campos nuevos (excepto slug)
7. ✅ additional_costs se guarda como JSONB correctamente
8. ✅ Validaciones frontend funcionan
9. ✅ Validaciones backend funcionan
10. ✅ Campos internos NO se exponen en catálogo público (verificar PRODUCT_PUBLIC_FIELDS)

### Testing:
11. ✅ Crear producto nuevo con solo campos obligatorios: OK
12. ✅ Crear producto nuevo con todos los campos completos: OK
13. ✅ Editar producto viejo sin completar campos nuevos: OK (no rompe)
14. ✅ Editar producto viejo agregando campos nuevos: OK
15. ✅ Editar producto nuevo: OK
16. ✅ Cálculo de margen correcto con diferentes valores
17. ✅ Catálogo público NO muestra cost_price ni campos internos

### Calidad:
18. ✅ Build PASS
19. ✅ Deploy production exitoso
20. ✅ No errores de consola
21. ✅ Formulario responsive (móvil/desktop)

### Validación Usuario:
22. ✅ Pilar puede crear producto de lujo completo con campos de inventario
23. ✅ Pilar entiende secciones y campos
24. ✅ Pilar confirma que cálculo de rentabilidad es útil

---

## 11. QUÉ NO TOCAR

### Prohibido modificar:

#### Checkout y Pagos:
- `/api/checkout/*`
- `/api/stripe/*`
- `/checkout/*` pages
- Stripe webhook
- Payment flows

#### Orders y Layaways:
- `/api/orders/*`
- `/api/layaways/*`
- `/account/orders/*`
- `/account/layaways/*`
- `/layaway/*` pages
- Order tracking
- Layaway backend

#### Admin Envíos:
- `/admin/envios`
- `/api/admin/envios`
- Shipping components
- Shipping workflow

#### Customer Panel:
- `/account/*` (excepto si se rompe algo indirectamente)
- Customer auth
- Customer addresses
- Customer profiles

#### Database:
- **NO crear nuevas migraciones** (campos ya existen)
- **NO modificar schema**
- **NO modificar RLS policies**
- **NO crear nuevas tablas**

#### Funcionalidades Futuras (fuera de scope):
- SKU generation
- Reportes de rentabilidad
- Dashboard de métricas
- Gráficas
- Exports
- Bulk operations
- Backfill de productos viejos

---

## 12. ENTREGABLES

### Código:
1. `/src/app/admin/productos/new/page.tsx` — actualizado
2. `/src/components/admin/EditProductForm.tsx` — actualizado
3. `/src/app/api/products/create/route.ts` — actualizado
4. `/src/app/api/products/[id]/route.ts` — actualizado
5. Opcional: `/src/components/admin/ProfitCalculator.tsx` — nuevo componente

### Documentación:
6. `ADMIN_INVENTARIO_MVP1C_ENTREGA.md` — documento de entrega
   - Cambios realizados
   - Pruebas ejecutadas
   - Screenshots
   - Instrucciones para Pilar

---

## 13. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 2.5-3.5 horas  
**Riesgo general:** Bajo-Medio

**Desglose:**
- Frontend (formularios): 1.5h
- Backend (API routes): 1h
- Testing y validaciones: 0.5h
- Documentación: 0.5h

---

## APROBACIÓN

⏳ **PENDIENTE APROBACIÓN DE JHONATAN**

**Preguntas para confirmar antes de implementar:**
1. ✅ ¿4 campos numéricos separados para additional_costs? (recomendado)
2. ✅ ¿Color/estilo del panel de rentabilidad OK? (gris claro con bordes)
3. ✅ ¿Límite de caracteres para textareas? (sugerencia: 2000)
4. ✅ ¿Algún campo adicional que falte?

**Listo para implementar cuando se apruebe.**
