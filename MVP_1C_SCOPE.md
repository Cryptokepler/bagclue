# MVP.1C — FORMULARIO ADMIN PROFESIONAL
**Fecha:** 2026-05-05  
**Estado:** SCOPE PENDIENTE APROBACIÓN  
**Objetivo:** Actualizar formulario crear/editar producto con campos de inventario profesional

---

## 1. CAMPOS A AGREGAR

### A. Campos Públicos (visibles en catálogo)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `material` | Text | No | Placeholder: "Piel caviar, lona, oro 18k, piel de becerro…" |
| `condition_notes` | Textarea | No (recomendado) | Placeholder: "Ligero desgaste en esquinas, interior limpio, herrajes con micro rayas…" |
| `authenticity_verified` | Checkbox | No | Label: "Autenticidad verificada", Default: false |
| `included_accessories` | Textarea | No | Placeholder: "Caja, dust bag, certificado Entrupy, correa, candado, llaves…" |

### B. Campos Internos (solo admin)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `cost_price` | Number | No | Label: "Costo de compra" |
| `additional_costs` | JSONB | No | Ver estructura abajo |
| `supplier_name` | Text | No | Label: "Proveedor / fuente" |
| `acquisition_date` | Date | No | |
| `physical_location` | Text | No | Placeholder: "Showroom, bodega, vitrina 1, estante A3…" |
| `internal_notes` | Textarea | No | Solo admin |
| `certificate_notes` | Textarea | No | Solo admin |
| `serial_number` | Text | No | Solo admin |

### C. Estructura `additional_costs` (JSONB)

**Opción 1 (MVP simple):** Textarea JSON validado
```json
{
  "shipping": 500,
  "authentication": 200,
  "cleaning": 100,
  "other": 50
}
```

**Opción 2 (preferida para MVP):** 4 campos numéricos simples:
- Costo envío/importación
- Costo autenticación
- Costo limpieza/reparación
- Otros costos

Se guardan como objeto en `additional_costs`:
```typescript
{
  shipping: number | null,
  authentication: number | null,
  cleaning: number | null,
  other: number | null
}
```

---

## 2. CAMPOS OBLIGATORIOS VS OPCIONALES

### Obligatorios para guardar:
- `title`
- `brand`
- `category`
- `condition`
- `price`
- `status`

### Opcionales:
- `model`
- `color`
- `origin`
- `material`
- `description`
- `condition_notes`
- `included_accessories`
- `authenticity_verified`
- **Todos los campos internos**

**Regla:** Debe permitir guardar producto aunque falten campos internos.

---

## 3. PÁGINAS A MODIFICAR

### Archivos:
1. `/src/app/admin/productos/new/page.tsx` — Crear producto
2. `/src/components/admin/EditProductForm.tsx` — Editar producto

**Ambas páginas deben tener los mismos campos principales.**

---

## 4. ESTRUCTURA UX — SECCIONES

No usar tabs. Organizar en secciones claras con headers visuales:

### A. Información Básica
- `title` (obligatorio)
- `brand` (obligatorio)
- `model`
- `color`
- `origin`
- `material` ⭐ NUEVO

### B. Estado y Condición
- `status` (obligatorio)
- `condition` (obligatorio)
- `category` (obligatorio)
- `condition_notes` ⭐ NUEVO (textarea)

### C. Precio y Publicación
- `price` (obligatorio)
- `currency`
- `badge`
- `is_published`
- `allow_layaway` (si ya existe en form actual)
- `layaway_deposit_percent` (si ya existe)

### D. Autenticidad y Accesorios ⭐ NUEVA SECCIÓN
- `authenticity_verified` (checkbox)
- `certificate_notes` (textarea)
- `serial_number` (text)
- `included_accessories` (textarea)
- `includes_box` (checkbox, ya existe)
- `includes_dust_bag` (checkbox, ya existe)
- `includes_papers` (checkbox, ya existe)

### E. Información Interna ⭐ NUEVA SECCIÓN
**Nota visual:** "Estos datos son privados y no se muestran en la tienda."

- `cost_price` (number)
- `additional_costs` — 4 campos numéricos:
  - Costo envío/importación
  - Costo autenticación
  - Costo limpieza/reparación
  - Otros costos
- `supplier_name` (text)
- `acquisition_date` (date)
- `physical_location` (text)
- `internal_notes` (textarea)

---

## 5. CÁLCULO DE RENTABILIDAD (UI ONLY)

**Ubicación:** Dentro de la sección "Información Interna", después de los campos.

**Si `cost_price` existe, mostrar panel de cálculo:**

```
┌─────────────────────────────────────────┐
│ 📊 RENTABILIDAD ESTIMADA                │
├─────────────────────────────────────────┤
│ Costo de compra:           $X,XXX       │
│ Costos adicionales:        $XXX         │
│ ──────────────────────────────────      │
│ Costo total:               $X,XXX       │
│ Precio de venta:           $X,XXX       │
│ ──────────────────────────────────      │
│ Utilidad estimada:         $X,XXX       │
│ Margen:                    XX.X%        │
└─────────────────────────────────────────┘
```

**Fórmulas:**
```typescript
const totalCost = cost_price + (additional_costs.shipping || 0) + (additional_costs.authentication || 0) + (additional_costs.cleaning || 0) + (additional_costs.other || 0)
const profit = price - totalCost
const margin = (profit / price) * 100
```

**NO guardar `total_cost` en DB.** Solo calcular en UI en tiempo real.

**Estado visual:**
- Margen > 30%: verde
- Margen 15-30%: amarillo
- Margen < 15%: rojo

---

## 6. SLUG AUTOMÁTICO

**Comportamiento:**
- Slug 100% automático al crear (ya implementado en MVP.1B)
- No editable por usuario
- No regenerar al editar (mantener slug original)
- En formulario de edición: mostrar slug como campo read-only (disabled)

**No incluir edición manual de slug.**

---

## 7. VALIDACIONES

### Frontend (antes de enviar):
1. Campos obligatorios: title, brand, category, condition, price, status
2. `price` y `cost_price` deben ser números positivos
3. `additional_costs.*` deben ser números positivos o vacíos
4. `acquisition_date` no puede ser futura

### Backend (API):
1. Validar que campos obligatorios existen
2. Validar tipos de datos
3. Validar que `additional_costs` es objeto JSON válido si existe
4. No permitir guardar si faltan obligatorios

---

## 8. IMPACTO EN BACKEND

### API Routes a modificar:

**1. `/api/products/create/route.ts`**
- Agregar nuevos campos al INSERT
- Validar estructura de `additional_costs`
- Mantener generación automática de slug

**2. `/api/products/[id]/route.ts` (PUT)**
- Agregar nuevos campos al UPDATE
- NO permitir editar slug
- Validar estructura de `additional_costs`

### Campos ya existen en DB (migration 010):
✅ No requiere nueva migración, solo modificar formularios y API routes.

---

## 9. PROHIBICIONES

**NO tocar:**
- Checkout
- Stripe
- Webhook
- DB schema/migrations (campos ya existen)
- RLS policies
- Admin envíos
- Orders
- Layaways backend
- Customer panel

---

## 10. CRITERIOS DE CIERRE MVP.1C

1. ✅ Formulario crear producto tiene todos los campos nuevos
2. ✅ Formulario editar producto tiene todos los campos nuevos
3. ✅ Secciones organizadas correctamente
4. ✅ Cálculo de rentabilidad visible en UI
5. ✅ API routes actualizadas (create + update)
6. ✅ Validaciones frontend funcionan
7. ✅ Validaciones backend funcionan
8. ✅ Producto nuevo se crea con campos opcionales vacíos: OK
9. ✅ Producto nuevo se crea con campos internos completos: OK
10. ✅ Producto viejo se edita sin perder datos: OK
11. ✅ Slug sigue siendo automático no-editable
12. ✅ Build PASS
13. ✅ Deploy production exitoso
14. ✅ Prueba Pilar: crear producto de lujo completo

---

## 11. ENTREGABLES

1. `/src/app/admin/productos/new/page.tsx` — actualizado
2. `/src/components/admin/EditProductForm.tsx` — actualizado
3. `/src/api/products/create/route.ts` — actualizado
4. `/src/api/products/[id]/route.ts` — actualizado
5. Componente opcional: `/src/components/admin/ProfitCalculator.tsx` (si se extrae lógica)
6. Documentación: `MVP_1C_ENTREGA.md`

---

## 12. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 2-3 horas (sin interrupciones)  
**Riesgo:** Bajo (campos ya existen en DB, solo UI + API updates)

---

## APROBACIÓN

⏳ **Pendiente aprobación de Jhonatan antes de implementar.**

**Preguntas abiertas:**
1. ¿Preferencia entre Opción 1 (textarea JSON) vs Opción 2 (4 campos) para `additional_costs`?
2. ¿Color/estilo específico para panel de rentabilidad?
3. ¿Algún campo adicional que falte?

**Listo para implementar cuando se apruebe scope.**
