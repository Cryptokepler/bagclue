# ADMIN FASE 1B — UI DE ENVÍOS / FULFILLMENT (SCOPE)

**Fecha:** 2026-05-04  
**Proyecto:** Bagclue Admin Panel  
**Objetivo:** Vista admin clara para gestionar pedidos por estado de envío  
**Tipo:** Frontend + API readonly  
**Estado:** SOLO DISEÑO — NO IMPLEMENTAR SIN AUTORIZACIÓN

---

## CONTEXTO

### Estado Actual
- ✅ **FASE 1A cerrada:** Backend con validaciones reforzadas
- ✅ `PUT /api/orders/[id]/shipping` seguro y funcional
- ✅ Admin puede ver órdenes en `/admin/orders`
- ❌ Sin filtros por estado de envío
- ❌ Sin vista clara de "pendientes de dirección" o "pendientes de envío"
- ❌ Sin búsqueda

### Objetivo FASE 1B
Crear una vista dedicada `/admin/envios` que permita al admin ver rápidamente:
- Qué pedidos necesitan dirección del cliente
- Qué pedidos están listos para enviar
- Qué pedidos ya fueron enviados
- Qué pedidos ya fueron entregados

**Alcance:** Solo lectura + filtros + navegación a detalle

---

## 1. RUTA PROPUESTA

### `/admin/envios`

**Ubicación archivo:** `src/app/admin/envios/page.tsx`

**Tipo:** Server component (con auth check)

**Funcionalidad:**
- Listado de órdenes filtradas por estado de envío
- Tabs para cambiar entre vistas
- Búsqueda por cliente/email/tracking
- Stats en header
- Navegación a detalle `/admin/orders/[id]`

**Auth:**
- Requiere sesión admin (via `isAuthenticated()`)
- Si no autenticado → redirect `/admin/login`

---

## 2. API PROPUESTA

### `GET /api/admin/envios`

**Ubicación archivo:** `src/app/api/admin/envios/route.ts`

**Auth:** Requiere sesión admin

**Query params:**

| Param | Tipo | Valores | Descripción |
|-------|------|---------|-------------|
| `filter` | string | `all`, `pending_address`, `pending_shipment`, `preparing`, `shipped`, `delivered` | Filtrar por estado |
| `search` | string | texto libre | Buscar por nombre/email/tracking |
| `limit` | number | 1-100 | Número de resultados (default: 50) |
| `offset` | number | 0+ | Offset para paginación |

**Response:**

```json
{
  "orders": [
    {
      "id": "uuid",
      "created_at": "2026-05-04T10:00:00Z",
      "customer_name": "Ana Pérez",
      "customer_email": "ana@example.com",
      "customer_phone": "+52 55 1234 5678",
      "product_summary": "Gucci Marmont",
      "total": 45000,
      "currency": "MXN",
      "payment_status": "paid",
      "shipping_status": "pending",
      "shipping_address": "Calle Reforma 123...",
      "shipping_provider": null,
      "tracking_number": null,
      "tracking_url": null,
      "tracking_token": "abc123xyz",
      "shipped_at": null,
      "delivered_at": null
    }
  ],
  "stats": {
    "pending_address": 3,
    "pending_shipment": 12,
    "preparing": 5,
    "shipped": 8,
    "delivered": 142,
    "total": 170
  },
  "pagination": {
    "total": 170,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Lógica de filtros:**

```typescript
// filter=all → todas las órdenes
// filter=pending_address → payment_status=paid AND shipping_address IS NULL
// filter=pending_shipment → payment_status=paid AND shipping_address NOT NULL AND shipping_status IN (pending)
// filter=preparing → shipping_status=preparing
// filter=shipped → shipping_status=shipped
// filter=delivered → shipping_status=delivered

// search → 
//   customer_name ILIKE '%search%' OR
//   customer_email ILIKE '%search%' OR
//   tracking_number = 'search'
```

**Query SQL propuesta:**

```sql
SELECT 
  orders.id,
  orders.created_at,
  orders.customer_name,
  orders.customer_email,
  orders.customer_phone,
  orders.total,
  orders.currency,
  orders.payment_status,
  orders.shipping_status,
  orders.shipping_address,
  orders.shipping_provider,
  orders.tracking_number,
  orders.tracking_url,
  orders.tracking_token,
  orders.shipped_at,
  orders.delivered_at,
  STRING_AGG(products.brand || ' ' || products.title, ', ') AS product_summary
FROM orders
LEFT JOIN order_items ON orders.id = order_items.order_id
LEFT JOIN products ON order_items.product_id = products.id
WHERE 
  -- Filtro según param
  (filter = 'all' OR ...)
  AND
  -- Búsqueda
  (search IS NULL OR ...)
GROUP BY orders.id
ORDER BY orders.created_at DESC
LIMIT :limit OFFSET :offset;
```

---

## 3. DATOS A MOSTRAR

### En tabla/lista:

| Campo | Fuente | Formato | Descripción |
|-------|--------|---------|-------------|
| Fecha | `created_at` | `DD/MM/YYYY HH:mm` | Fecha de creación de la orden |
| Cliente | `customer_name` | Texto | Nombre del cliente |
| Email | `customer_email` | Texto | Email del cliente |
| Teléfono | `customer_phone` | Texto | Teléfono del cliente |
| Producto | `product_summary` | Texto truncado | Resumen de productos (max 50 chars) |
| Total | `total` + `currency` | `$45,000 MXN` | Monto total |
| Pago | `payment_status` | Badge | paid, pending, refunded |
| Dirección | `shipping_address` | Badge | ✅ Confirmada / ⚠️ Pendiente |
| Envío | `shipping_status` | Badge | pending, preparing, shipped, delivered |
| Paquetería | `shipping_provider` | Texto | DHL, FedEx, manual, - |
| Tracking | `tracking_number` | Texto + link | Número de rastreo |
| Acciones | - | Botones | Ver detalle, copiar tracking, etc. |

### Stats en header:

| Stat | Cálculo | Formato |
|------|---------|---------|
| Pendientes dirección | COUNT donde `payment_status=paid` AND `shipping_address IS NULL` | `3` |
| Pendientes envío | COUNT donde `payment_status=paid` AND `shipping_address NOT NULL` AND `shipping_status=pending` | `12` |
| Preparando | COUNT donde `shipping_status=preparing` | `5` |
| Enviados | COUNT donde `shipping_status=shipped` | `8` |
| Entregados | COUNT donde `shipping_status=delivered` | `142` |
| Total | COUNT total de órdenes | `170` |

---

## 4. TABS

### Tab 1: Todos
**Filtro:** Ninguno (muestra todas las órdenes)  
**Orden:** DESC por `created_at`

### Tab 2: Pendiente dirección
**Filtro:** `payment_status=paid` AND `shipping_address IS NULL`  
**Orden:** ASC por `created_at` (más antiguas primero)  
**Badge destacado:** ⚠️ Sin dirección

### Tab 3: Pendiente envío
**Filtro:** `payment_status=paid` AND `shipping_address NOT NULL` AND `shipping_status=pending`  
**Orden:** ASC por `created_at` (FIFO)  
**Badge destacado:** ✅ Listo para enviar

### Tab 4: Preparando
**Filtro:** `shipping_status=preparing`  
**Orden:** ASC por `created_at`  
**Badge destacado:** 📦 Preparando

### Tab 5: Enviados
**Filtro:** `shipping_status=shipped`  
**Orden:** DESC por `shipped_at`  
**Badge destacado:** ✈️ En tránsito

### Tab 6: Entregados
**Filtro:** `shipping_status=delivered`  
**Orden:** DESC por `delivered_at`  
**Badge destacado:** ✅ Entregado

---

## 5. FILTROS

### Búsqueda principal (barra de texto)

**Placeholder:** "Buscar por cliente, email o tracking..."

**Búsqueda por:**
- Nombre cliente (ILIKE)
- Email cliente (ILIKE)
- Tracking number (exact match)

**Query:**
```sql
WHERE 
  customer_name ILIKE '%{search}%'
  OR customer_email ILIKE '%{search}%'
  OR tracking_number = '{search}'
```

### Filtros adicionales (opcional v2)

**NO implementar en v1, solo listar para futuro:**
- Filtro por fecha (rango)
- Filtro por paquetería (DHL, FedEx, manual)
- Filtro por monto (rango)

---

## 6. ACCIONES DESDE LISTA

### Acción 1: Ver detalle
**UI:** Link "Ver detalle →" o clic en toda la fila  
**Destino:** `/admin/orders/[id]`  
**Implementación:** `<Link href={...}>` o `router.push()`

### Acción 2: Copiar tracking público
**UI:** Botón "📋 Copiar tracking"  
**Funcionalidad:**
- Copiar al portapapeles: `https://bagclue.vercel.app/track/{tracking_token}`
- Mostrar tooltip "Copiado ✅"
**Condición:** Solo si `tracking_token` existe

### Acción 3: Abrir tracking público
**UI:** Botón "🔗 Ver tracking"  
**Funcionalidad:**
- Abrir en nueva pestaña: `https://bagclue.vercel.app/track/{tracking_token}`
**Condición:** Solo si `tracking_token` existe

### Acción 4: Abrir tracking DHL/FedEx
**UI:** Link en `tracking_number` (si existe `tracking_url`)  
**Funcionalidad:**
- Abrir en nueva pestaña: `tracking_url`
**Condición:** Solo si `tracking_url` existe

### Acción 5: Ir a detalle de orden
**UI:** Toda la fila clickeable  
**Funcionalidad:**
- Redirige a `/admin/orders/[id]`

**NO implementar en v1:**
- ❌ Marcar como enviado desde lista
- ❌ Marcar como entregado desde lista
- ❌ Cambiar estado desde lista
- ❌ Editar tracking desde lista

**Razón:** Toda modificación debe hacerse desde `/admin/orders/[id]` con validaciones completas.

---

## 7. ENLACE HACIA DETALLE

### Navegación principal
**Desde:** `/admin/envios`  
**Hacia:** `/admin/orders/[id]`

**Trigger:**
- Clic en fila
- Clic en "Ver detalle →"

**Implementación:**
```tsx
<Link href={`/admin/orders/${order.id}`}>
  Ver detalle →
</Link>
```

### Breadcrumb en detalle (opcional)
**Desde:** `/admin/orders/[id]`  
**Hacia:** `/admin/envios`

**UI:**
```
← Volver a envíos
```

**Implementación:**
```tsx
<Link href="/admin/envios">
  ← Volver a envíos
</Link>
```

---

## 8. UI PROPUESTA

### Layout Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│ <AdminNav />                                                     │
├─────────────────────────────────────────────────────────────────┤
│ ENVÍOS / FULFILLMENT                                            │
├─────────────────────────────────────────────────────────────────┤
│ Stats Cards:                                                     │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│ │⚠️ Pend.  │🚚 Pend.  │📦 Prep.  │✈️ Env.   │✅ Entre. │       │
│ │dirección │envío     │          │          │          │       │
│ │    3     │   12     │    5     │    8     │   142    │       │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│ Tabs:                                                            │
│ [ Todos ] [ Pend. dirección ] [ Pend. envío ] [ Preparando ]   │
│ [ Enviados ] [ Entregados ]                                     │
├─────────────────────────────────────────────────────────────────┤
│ Búsqueda: [___________________________________] 🔍              │
├─────────────────────────────────────────────────────────────────┤
│ Tabla:                                                           │
│ ┌──────┬────────┬──────┬──────┬──────┬──────┬──────┬──────┬──┐ │
│ │Fecha │Cliente │Email │Tel   │Prod  │Total │Dir   │Envío │→ │ │
│ ├──────┼────────┼──────┼──────┼──────┼──────┼──────┼──────┼──┤ │
│ │02/05 │Ana P.  │ana@..│+5255.│Gucci │$45k  │✅Conf│⏸️Pend│→ │ │
│ │01/05 │Luis G. │luis@.│+5255.│Chanel│$32k  │⚠️Pend│⏸️Pend│→ │ │
│ └──────┴────────┴──────┴──────┴──────┴──────┴──────┴──────┴──┘ │
│                                                                  │
│ [Paginación: ← 1 2 3 ... 10 →]                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Mobile (opcional v2)

```
┌───────────────────────┐
│ ENVÍOS                │
├───────────────────────┤
│ Stats (horizontal)    │
│ ⚠️3  🚚12  📦5  ✈️8   │
├───────────────────────┤
│ Tabs (scroll horiz.)  │
│ [Todos] [Pend.dir...] │
├───────────────────────┤
│ 🔍 Buscar...          │
├───────────────────────┤
│ Cards:                │
│ ┌───────────────────┐ │
│ │ 02/05 · Ana Pérez │ │
│ │ Gucci Marmont     │ │
│ │ $45,000 MXN       │ │
│ │ ✅ Dirección OK   │ │
│ │ ⏸️ Pendiente envío│ │
│ │ [Ver detalle →]   │ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ 01/05 · Luis G.   │ │
│ │ ...               │ │
│ └───────────────────┘ │
└───────────────────────┘
```

**Decisión mobile:** Implementar en v2 si se requiere (prioridad desktop primero)

---

### Componentes UI Propuestos

#### `<AdminEnviosPage>`
**Ubicación:** `src/app/admin/envios/page.tsx`  
**Tipo:** Server component  
**Props:** Query params (filter, search)  
**Responsabilidad:**
- Auth check
- Fetch data via API
- Render layout

#### `<EnviosStats>`
**Ubicación:** `src/components/admin/EnviosStats.tsx`  
**Tipo:** Client component  
**Props:** `{ stats: StatsType }`  
**Responsabilidad:**
- Mostrar cards de stats
- Responsive grid

#### `<EnviosTabs>`
**Ubicación:** `src/components/admin/EnviosTabs.tsx`  
**Tipo:** Client component  
**Props:** `{ activeTab: string, onTabChange: (tab) => void }`  
**Responsabilidad:**
- Tabs navegables
- Highlight tab activo
- Trigger cambio de filtro

#### `<EnviosTable>`
**Ubicación:** `src/components/admin/EnviosTable.tsx`  
**Tipo:** Client component  
**Props:** `{ orders: Order[], onRowClick: (id) => void }`  
**Responsabilidad:**
- Tabla responsive
- Badges coloreados
- Acciones (copiar tracking, ver detalle)

#### `<SearchBar>`
**Ubicación:** `src/components/admin/SearchBar.tsx` (reutilizable)  
**Tipo:** Client component  
**Props:** `{ placeholder: string, onSearch: (query) => void }`  
**Responsabilidad:**
- Input con debounce (500ms)
- Clear button
- Submit on Enter

#### `<OrderBadge>`
**Ubicación:** `src/components/admin/OrderBadge.tsx` (reutilizable)  
**Tipo:** Client component  
**Props:** `{ type: 'payment' | 'address' | 'shipping', value: string }`  
**Responsabilidad:**
- Badge coloreado según estado
- Consistente con diseño actual

---

### Paleta de Colores (Bagclue Theme)

**Base:**
- Background: `#0a0a0a`
- Text: `#ffffff`
- Border: `#FF69B4/20` (pink con alpha)
- Accent: `#FF69B4`

**Badges:**
- **Paid:** `bg-emerald-500/20 text-emerald-400`
- **Pending:** `bg-yellow-500/20 text-yellow-400`
- **Cancelled/Refunded:** `bg-red-500/20 text-red-400`
- **Confirmado:** `bg-emerald-500/20 text-emerald-400`
- **Pendiente:** `bg-yellow-500/20 text-yellow-400`
- **Shipped:** `bg-blue-500/20 text-blue-400`
- **Delivered:** `bg-emerald-500/20 text-emerald-400`
- **Preparing:** `bg-purple-500/20 text-purple-400`

---

## 9. REGLAS

### Regla 1: Solo lectura desde lista
**NO se permite:**
- ❌ Modificar estados desde `/admin/envios`
- ❌ Marcar como enviado desde lista
- ❌ Marcar como entregado desde lista
- ❌ Editar tracking desde lista
- ❌ Cambiar paquetería desde lista

**Razón:** Toda modificación requiere validaciones completas que solo existen en `/admin/orders/[id]`

**Excepciones futuras (v2, si se aprueban):**
- Modal con formulario completo + validaciones
- Confirmación antes de cambiar estado
- Solo para estados seguros (ej: preparing → shipped con tracking ya cargado)

---

### Regla 2: No tocar pagos
- ❌ NO modificar `payment_status`
- ❌ NO tocar Stripe
- ❌ NO tocar checkout
- ❌ NO tocar webhook

**Alcance:** Solo lectura de `payment_status` para filtros

---

### Regla 3: No tocar products/stock
- ❌ NO modificar productos
- ❌ NO modificar stock
- ❌ Solo mostrar `product_summary` (JOIN readonly)

---

### Regla 4: No tocar DB schema
- ❌ NO crear tablas nuevas
- ❌ NO modificar schema de `orders`
- ❌ NO crear migraciones
- ✅ Solo queries SELECT

---

### Regla 5: Mantener compatibilidad
- ✅ `/admin/orders` sigue funcionando
- ✅ `/admin/orders/[id]` sigue siendo la vista de edición
- ✅ `ShippingInfoForm` NO se modifica
- ✅ API `PUT /api/orders/[id]/shipping` NO se toca

---

### Regla 6: Stats en tiempo real
- Stats se calculan en cada request
- NO se cachean (por ahora)
- Futuro v2: considerar caché de 1-5 minutos

---

## 10. SUBFASES RECOMENDADAS

### SUBFASE 1B.1: API GET /api/admin/envios (Backend)
**Duración estimada:** 1-2 días

**Tareas:**
1. Crear archivo `src/app/api/admin/envios/route.ts`
2. Implementar auth check (session admin)
3. Implementar query con filtros:
   - `filter` (all, pending_address, pending_shipment, preparing, shipped, delivered)
   - `search` (nombre, email, tracking)
   - `limit` / `offset` (paginación)
4. Implementar JOIN a `order_items` + `products` para `product_summary`
5. Implementar cálculo de stats
6. Tests manuales con Postman/curl
7. Validar que stats son correctos
8. Validar que filtros funcionan
9. Validar que búsqueda funciona

**Entregables:**
- `src/app/api/admin/envios/route.ts`
- Tests manuales documentados
- Validación con órdenes reales de Supabase

**Criterios de cierre:**
- ✅ Endpoint responde 200 con auth válido
- ✅ Endpoint responde 401 sin auth
- ✅ Filtro `all` retorna todas las órdenes
- ✅ Filtro `pending_address` retorna solo paid sin dirección
- ✅ Filtro `pending_shipment` retorna solo paid + dirección + status=pending
- ✅ Filtro `preparing` retorna solo status=preparing
- ✅ Filtro `shipped` retorna solo status=shipped
- ✅ Filtro `delivered` retorna solo status=delivered
- ✅ Búsqueda por nombre funciona
- ✅ Búsqueda por email funciona
- ✅ Búsqueda por tracking funciona
- ✅ Stats son correctos
- ✅ Paginación funciona (limit/offset)
- ✅ Código en GitHub
- ✅ Build local PASS

---

### SUBFASE 1B.2: UI /admin/envios readonly (Frontend)
**Duración estimada:** 2-3 días

**Tareas:**
1. Crear página `src/app/admin/envios/page.tsx`
2. Crear componente `<EnviosStats>`
3. Crear componente `<EnviosTabs>`
4. Crear componente `<EnviosTable>`
5. Crear componente `<SearchBar>` (reutilizable)
6. Crear componente `<OrderBadge>` (reutilizable)
7. Integrar con API `GET /api/admin/envios`
8. Implementar client-side state para tabs + search
9. Implementar navegación a `/admin/orders/[id]`
10. Implementar acciones: copiar tracking, abrir tracking
11. Responsive desktop (mobile opcional v2)
12. Tests manuales en local
13. Deploy a producción
14. Validación con datos reales

**Entregables:**
- `src/app/admin/envios/page.tsx`
- `src/components/admin/EnviosStats.tsx`
- `src/components/admin/EnviosTabs.tsx`
- `src/components/admin/EnviosTable.tsx`
- `src/components/admin/SearchBar.tsx`
- `src/components/admin/OrderBadge.tsx`

**Criterios de cierre:**
- ✅ `/admin/envios` carga correctamente en local
- ✅ Stats se muestran correctamente
- ✅ Tabs cambian filtro correctamente
- ✅ Búsqueda funciona (debounce)
- ✅ Tabla muestra datos correctos
- ✅ Badges tienen colores correctos
- ✅ Navegación a detalle funciona
- ✅ Copiar tracking funciona
- ✅ Abrir tracking funciona
- ✅ Responsive desktop funciona
- ✅ Build local PASS
- ✅ Deploy a producción exitoso
- ✅ Validación manual en https://bagclue.vercel.app/admin/envios

---

### SUBFASE 1B.3: Navegación AdminNav (Integración)
**Duración estimada:** 0.5 días

**Tareas:**
1. Agregar link "Envíos" a `<AdminNav>`
2. Highlight activo en `/admin/envios`
3. Breadcrumb "← Volver a envíos" en `/admin/orders/[id]` (opcional)
4. Tests de navegación

**Entregables:**
- `src/components/admin/AdminNav.tsx` (actualizado)

**Criterios de cierre:**
- ✅ Link "Envíos" visible en navegación admin
- ✅ Link activo cuando estás en `/admin/envios`
- ✅ Navegación entre secciones funciona
- ✅ Deploy a producción

---

### SUBFASE 1B.4: Validación producción (Testing Final)
**Duración estimada:** 0.5 días

**Tareas:**
1. Tests end-to-end en producción:
   - Acceder a `/admin/envios`
   - Cambiar tabs
   - Buscar órdenes
   - Copiar tracking
   - Abrir tracking
   - Navegar a detalle
   - Validar que `/admin/orders` sigue funcionando
   - Validar que `/admin/orders/[id]` sigue funcionando
2. Validación con Jhonatan
3. Documentación final

**Entregables:**
- `ADMIN_FASE_1B_TESTS.md` (documento de tests)
- `ADMIN_FASE_1B_ENTREGA.md` (documento final)

**Criterios de cierre:**
- ✅ Todos los tests PASS en producción
- ✅ Jhonatan valida flujo completo
- ✅ Documentación completa
- ✅ FASE 1B cerrada

---

## RESUMEN EJECUTIVO

### Alcance FASE 1B
**Nueva ruta:**
- `/admin/envios` — Vista dedicada de envíos con tabs, stats, búsqueda

**Nueva API:**
- `GET /api/admin/envios` — Endpoint readonly con filtros

**Funcionalidad:**
- Stats en header (6 stats)
- Tabs (6 tabs)
- Búsqueda (nombre/email/tracking)
- Tabla con badges claros
- Navegación a detalle
- Acciones: copiar tracking, abrir tracking

**NO incluye:**
- ❌ Modificar estados desde lista
- ❌ Editar tracking desde lista
- ❌ Cambiar paquetería desde lista
- ❌ Modal de envío rápido (v2)

### Duración Estimada Total
- **1B.1:** 1-2 días (API)
- **1B.2:** 2-3 días (UI)
- **1B.3:** 0.5 días (Nav)
- **1B.4:** 0.5 días (Tests)
- **TOTAL:** 4-6 días

### Riesgos
- Performance en query con JOIN (mitigado con índices existentes)
- UX desktop vs mobile (prioridad desktop primero)
- Paginación simple (limit/offset, no cursor-based)

### Criterios de Éxito
- Admin puede ver rápidamente órdenes por estado
- Admin puede buscar órdenes
- Admin puede navegar a detalle
- Flujo claro: filtrar → buscar → abrir detalle → modificar

---

## PRÓXIMOS PASOS

### Antes de Implementar
1. ✅ Revisar este scope con Jhonatan
2. ✅ Aprobar subfases 1B.1, 1B.2, 1B.3, 1B.4
3. ✅ Confirmar que NO se requieren cambios
4. ✅ Autorizar arranque SUBFASE 1B.1

### Al Aprobar
1. 🚀 Arrancar SUBFASE 1B.1 (API)
2. 📝 Crear documento ADMIN_FASE_1B1_API_SCOPE.md
3. 🔧 Implementar endpoint
4. ✅ Tests con Postman antes de UI

---

## NOTAS FINALES

**Este documento es SOLO diseño y propuesta.**

**NO SE DEBE:**
- ❌ Crear rutas sin autorización
- ❌ Crear APIs sin autorización
- ❌ Modificar código sin autorización
- ❌ Hacer deploy sin autorización

**SOLO SE DEBE:**
- ✅ Revisar con Jhonatan
- ✅ Discutir subfases
- ✅ Aprobar formalmente antes de implementar

**Última actualización:** 2026-05-04  
**Próxima revisión:** Cuando Jhonatan apruebe arrancar

---

**FIN DEL SCOPE ADMIN FASE 1B**
