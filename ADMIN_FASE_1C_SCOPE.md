# ADMIN FASE 1C — ACCIONES DE FULFILLMENT (SCOPE TÉCNICO)

**Fecha:** 2026-05-04  
**Actualización:** 2026-05-04 (ajustes pre-implementación)  
**Proyecto:** Bagclue Admin Panel  
**Fase:** 1C - Acciones de fulfillment desde vista /admin/envios  
**Estado:** SCOPE APROBADO PENDIENTE IMPLEMENTACIÓN  
**Prerequisitos:** FASE 1B completada ✅

---

## 1. OBJETIVO DE LA FASE

### 1.1. Propósito
Permitir al admin **modificar el estado de envío de órdenes** directamente desde la vista `/admin/envios`, sin tener que navegar a `/admin/orders/[id]`.

### 1.2. Funcionalidades a implementar
- ✅ Marcar orden como "Preparando" (preparing)
- ✅ Marcar orden como "Enviado" (shipped) con tracking info
- ✅ Marcar orden como "Entregado" (delivered)
- ✅ Editar tracking info de órdenes ya enviadas
- ✅ Validaciones de seguridad (no permitir transiciones inválidas)
- ✅ **Mantener botón "Ver detalle" siempre disponible**

### 1.3. Alcance
**Modificar:** UI de `/admin/envios` (agregar acciones JUNTO a "Ver detalle")  
**Reutilizar:** API `PUT /api/orders/[id]/shipping` (ya existe con validaciones de FASE 1A)  
**NO crear:** Nuevas APIs (usaremos la existente)

---

## 2. CONTRATO DEL ENDPOINT (DOCUMENTACIÓN EXACTA)

### 2.1. Endpoint reutilizado

**Endpoint:** `PUT /api/orders/[id]/shipping`

**Ubicación:** `src/app/api/orders/[id]/shipping/route.ts`

**Auth:** Cookie `bagclue_admin_session` (httpOnly, automática en browser)

**Content-Type:** `application/json`

---

### 2.2. Payload para marcar como "Preparando"

**Request:**
```json
{
  "shipping_status": "preparing"
}
```

**Validaciones backend:**
- ✅ `payment_status` de la orden debe ser `'paid'`
- ✅ `shipping_address` de la orden NO debe ser `null`
- ✅ Estado actual NO debe ser `'shipped'` ni `'delivered'`

**Response exitosa (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "shipping_status": "preparing",
    ...
  },
  "public_tracking_url": "https://bagclue.vercel.app/track/abc123"
}
```

**Errores posibles:**
- **400:** `"No se puede marcar como preparando sin pago confirmado. Estado de pago actual: pending"`
- **400:** `"No se puede marcar como preparando sin dirección de envío confirmada"`
- **404:** `"Order not found"`
- **500:** `"Internal server error"`

---

### 2.3. Payload para marcar como "Enviado"

**Request:**
```json
{
  "shipping_status": "shipped",
  "shipping_provider": "dhl",
  "tracking_number": "1234567890"
}
```

**Campos:**
- `shipping_status`: **Requerido.** Debe ser `"shipped"`
- `shipping_provider`: **Requerido.** Uno de: `"dhl"`, `"fedex"`, `"ups"`, `"estafeta"`, `"redpack"`, `"paqueteexpress"`, `"otro"`, `"manual"`
- `tracking_number`: **Requerido.** String, min 3 caracteres

**Validaciones backend:**
- ✅ `payment_status` debe ser `'paid'`
- ✅ `shipping_address` NO debe ser `null`
- ✅ `shipping_provider` requerido
- ✅ `tracking_number` requerido

**Comportamiento backend:**
- ✅ Auto-asigna `shipped_at = NOW()`
- ✅ Auto-genera `tracking_url` si provider es `dhl` o `fedex`:
  - DHL: `https://www.dhl.com.mx/es/express/rastreo.html?AWB={tracking}`
  - FedEx: `https://www.fedex.com/fedextrack/?tracknumbers={tracking}`
  - Otros: `tracking_url = null`

**Response exitosa (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "shipping_status": "shipped",
    "shipping_provider": "dhl",
    "tracking_number": "1234567890",
    "tracking_url": "https://www.dhl.com.mx/es/express/rastreo.html?AWB=1234567890",
    "shipped_at": "2026-05-04T12:00:00.000Z",
    ...
  },
  "public_tracking_url": "https://bagclue.vercel.app/track/abc123"
}
```

**Errores posibles:**
- **400:** `"No se puede marcar como enviado sin pago confirmado"`
- **400:** `"No se puede marcar como enviado sin dirección de envío confirmada"`
- **400:** `"Paquetería (shipping_provider) es obligatoria para marcar como enviado"`
- **400:** `"Número de rastreo (tracking_number) es obligatorio para marcar como enviado"`
- **400:** `"Invalid shipping_provider. Must be: dhl, fedex, manual, or null"` (si se envía provider inválido)

---

### 2.4. Payload para editar tracking

**Request:**
```json
{
  "shipping_provider": "fedex",
  "tracking_number": "9876543210"
}
```

**Nota:** NO se envía `shipping_status` (ya está en `"shipped"`)

**Comportamiento backend:**
- ✅ Actualiza `shipping_provider` y `tracking_number`
- ✅ Regenera `tracking_url` si provider es dhl/fedex
- ✅ NO modifica `shipped_at` (preserva timestamp original)

**Response exitosa (200):** Igual que "Marcar como enviado"

**Errores posibles:** Mismos que "Marcar como enviado"

---

### 2.5. Payload para marcar como "Entregado"

**Request:**
```json
{
  "shipping_status": "delivered"
}
```

**Validaciones backend:**
- ✅ Estado actual debe ser `'shipped'` (estricto)

**Comportamiento backend:**
- ✅ Auto-asigna `delivered_at = NOW()`

**Response exitosa (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "shipping_status": "delivered",
    "delivered_at": "2026-05-04T15:00:00.000Z",
    ...
  },
  "public_tracking_url": "https://bagclue.vercel.app/track/abc123"
}
```

**Errores posibles:**
- **400:** `"No se puede marcar como entregado sin haber sido enviado primero. Estado actual: preparing"`
- **404:** `"Order not found"`

---

## 3. ACCIONES EXACTAS A IMPLEMENTAR

### 3.1. Acción: Marcar como "Preparando"

**Trigger:** Botón "Marcar preparando" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `payment_status = 'paid'`
- Orden debe tener `shipping_address NOT NULL`
- Estado actual debe ser `shipping_status = 'pending'` o `null`

**Flujo:**
1. Admin click en "Marcar preparando"
2. Modal de confirmación: 
   ```
   ¿Marcar orden como preparando?
   
   Orden: {ORDER_ID}
   
   [Cancelar] [Confirmar]
   ```
3. Si confirma → fetch `PUT /api/orders/[id]/shipping` con payload de sección 2.2
4. Si éxito (200) → actualizar tabla + toast "Orden marcada como preparando"
5. Si error (400/500) → toast error con mensaje del backend

---

### 3.2. Acción: Marcar como "Enviado" con tracking

**Trigger:** Botón "Marcar enviado" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `payment_status = 'paid'`
- Orden debe tener `shipping_address NOT NULL`
- Estado actual debe ser `preparing` o `pending`

**Flujo:**
1. Admin click en "Marcar enviado"
2. Modal con form:
   ```
   Marcar como enviado
   
   Paquetería: [Select ▼]
     - DHL
     - FedEx
     - UPS
     - Estafeta
     - Redpack
     - Paquete Express
     - Otro
   
   [Si selecciona "Otro" → mostrar input text para especificar]
   
   Número de rastreo: [____________]
   (mínimo 3 caracteres)
   
   [Cancelar] [Guardar]
   ```
3. Validación frontend:
   - Paquetería: requerida
   - Si paquetería = "Otro" y input custom está vacío → error
   - Tracking number: requerido, min 3 chars, alfanumérico
4. Si válido → fetch `PUT /api/orders/[id]/shipping` con payload de sección 2.3
5. Backend auto-genera `tracking_url` y asigna `shipped_at`
6. Si éxito (200) → actualizar tabla + toast "Orden marcada como enviada"
7. Si error → toast error con mensaje del backend

**Mapping de paqueterías a valores backend:**
```typescript
const providerMap = {
  'DHL': 'dhl',
  'FedEx': 'fedex',
  'UPS': 'ups',
  'Estafeta': 'estafeta',
  'Redpack': 'redpack',
  'Paquete Express': 'paqueteexpress',
  'Otro': 'otro',  // o valor custom del input
}
```

---

### 3.3. Acción: Editar tracking info

**Trigger:** Botón "Editar tracking" (solo visible si orden ya tiene tracking)

**Condiciones previas (UI):**
- Orden debe tener `shipping_status = 'shipped'`
- Orden debe tener `tracking_number` existente

**Flujo:**
1. Admin click en "Editar tracking"
2. Modal pre-llenado con valores actuales:
   ```
   Editar tracking
   
   Paquetería: [Select ▼] (pre-seleccionado con valor actual)
     - DHL
     - FedEx
     - UPS
     - Estafeta
     - Redpack
     - Paquete Express
     - Otro
   
   Número de rastreo: [valor actual]
   
   [Cancelar] [Guardar]
   ```
3. Admin puede modificar paquetería y/o tracking number
4. Si modifica → fetch `PUT /api/orders/[id]/shipping` con payload de sección 2.4
5. Backend actualiza campos y regenera `tracking_url`
6. Si éxito → actualizar tabla + toast "Tracking actualizado"

---

### 3.4. Acción: Marcar como "Entregado"

**Trigger:** Botón "Marcar entregado" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `shipping_status = 'shipped'`

**Flujo:**
1. Admin click en "Marcar entregado"
2. **Modal de confirmación fuerte:**
   ```
   ⚠️ ¿Confirmar entrega?
   
   Cliente: {customer_name}
   Producto: {product_summary}
   Paquetería: {shipping_provider}
   Tracking: {tracking_number}
   
   Esta acción marca el pedido como entregado
   y no puede revertirse desde esta vista.
   
   [Cancelar] [Confirmar entrega]
   ```
3. Si confirma → fetch `PUT /api/orders/[id]/shipping` con payload de sección 2.5
4. Backend asigna `delivered_at` automáticamente
5. Si éxito → actualizar tabla + toast "Orden marcada como entregada"
6. Si error → toast error con mensaje del backend

---

### 3.5. Botones visibles según estado

**Matriz de visibilidad:**

| Estado actual | Botones visibles |
|---------------|------------------|
| `pending` (sin dirección) | **[Ver detalle]** |
| `pending` (con dirección) | **[Ver detalle]** [Marcar preparando] |
| `preparing` | **[Ver detalle]** [Marcar enviado] |
| `shipped` | **[Ver detalle]** [Editar tracking] [Marcar entregado] |
| `delivered` | **[Ver detalle]** |

**REGLA CRÍTICA:** **"Ver detalle" SIEMPRE está visible**, independientemente del estado.

---

## 4. PAQUETERÍAS PERMITIDAS

### 4.1. Lista de paqueterías

**Opciones en select:**
1. DHL (value: `"dhl"`)
2. FedEx (value: `"fedex"`)
3. UPS (value: `"ups"`)
4. Estafeta (value: `"estafeta"`)
5. Redpack (value: `"redpack"`)
6. Paquete Express (value: `"paqueteexpress"`)
7. Otro (value: `"otro"` + input text custom)

---

### 4.2. Manejo de "Otro"

**Si admin selecciona "Otro":**
1. Mostrar input text: "Especificar paquetería:"
2. Validar que input no esté vacío
3. Enviar valor del input como `shipping_provider`

**Ejemplo:**
```
Select: "Otro"
Input custom: "99 Minutos"
→ shipping_provider = "99 Minutos"
```

**Tracking URL generado:** `null` (solo DHL y FedEx tienen auto-generación)

---

### 4.3. Actualización futura del backend

**NOTA:** Actualmente el endpoint solo valida `['dhl', 'fedex', 'manual', null]`.

**Antes de implementar FASE 1C, actualizar validación backend:**
```typescript
const validProviders = [
  'dhl', 'fedex', 'ups', 'estafeta', 'redpack', 
  'paqueteexpress', 'otro', 'manual', null
]
```

**O mejor:** **Remover validación de lista blanca** y permitir cualquier string (más flexible).

**Recomendación:** Permitir cualquier string para `shipping_provider` (quitar validación restrictiva).

---

## 5. CAMBIOS UI NECESARIOS

### 5.1. Componente nuevo: `EnviosActions.tsx`

**Ubicación:** `src/components/admin/envios/EnviosActions.tsx`

**Props:**
```typescript
interface EnviosActionsProps {
  order: EnviosOrder
  onActionComplete: () => void  // Callback para refresh data
}
```

**Responsabilidad:**
- Renderizar botones según estado de la orden
- **SIEMPRE renderizar "Ver detalle"**
- Mostrar modales de confirmación/form
- Hacer fetch a `PUT /api/orders/[id]/shipping`
- Manejar success/error con toasts

**Botones a renderizar:**
```tsx
// SIEMPRE (todos los estados)
<button onClick={() => router.push(`/admin/orders/${order.id}`)}>
  Ver detalle
</button>

// Condicionales
{order.shipping_status === 'pending' && order.shipping_address && (
  <button onClick={handleMarkPreparing}>Marcar preparando</button>
)}

{order.shipping_status === 'preparing' && (
  <button onClick={handleMarkShipped}>Marcar enviado</button>
)}

{order.shipping_status === 'shipped' && (
  <>
    <button onClick={handleEditTracking}>Editar tracking</button>
    <button onClick={handleMarkDelivered}>Marcar entregado</button>
  </>
)}
```

---

### 5.2. Modificar `EnviosTable.tsx`

**Cambio:** Agregar columna "Acciones" que renderiza `<EnviosActions>`

**Antes:**
```tsx
<td>
  <button onClick={() => onOrderClick(order.id)}>Ver detalle</button>
</td>
```

**Después:**
```tsx
<td>
  <EnviosActions order={order} onActionComplete={refetchOrders} />
</td>
```

---

### 5.3. Modales necesarios

#### Modal 1: Confirmación simple (preparando)
```tsx
<Modal>
  <h3>¿Marcar orden como preparando?</h3>
  <p>Orden: {orderId}</p>
  <button onClick={onCancel}>Cancelar</button>
  <button onClick={onConfirm}>Confirmar</button>
</Modal>
```

#### Modal 2: Form tracking (enviado, editar tracking)
```tsx
<Modal>
  <h3>{isEdit ? 'Editar tracking' : 'Marcar como enviado'}</h3>
  <form onSubmit={handleSubmit}>
    <label>Paquetería</label>
    <select name="provider" required>
      <option value="dhl">DHL</option>
      <option value="fedex">FedEx</option>
      <option value="ups">UPS</option>
      <option value="estafeta">Estafeta</option>
      <option value="redpack">Redpack</option>
      <option value="paqueteexpress">Paquete Express</option>
      <option value="otro">Otro</option>
    </select>
    
    {providerValue === 'otro' && (
      <input 
        type="text" 
        name="customProvider"
        placeholder="Especificar paquetería"
        required
      />
    )}
    
    <label>Número de rastreo</label>
    <input 
      type="text" 
      name="tracking" 
      required 
      minLength={3}
      placeholder="1234567890"
    />
    
    <button type="button" onClick={onCancel}>Cancelar</button>
    <button type="submit">Guardar</button>
  </form>
</Modal>
```

#### Modal 3: Confirmación fuerte (entregado)
```tsx
<Modal>
  <h3>⚠️ ¿Confirmar entrega?</h3>
  <div className="order-summary">
    <p><strong>Cliente:</strong> {order.customer_name}</p>
    <p><strong>Producto:</strong> {formatProductSummary(order)}</p>
    <p><strong>Paquetería:</strong> {order.shipping_provider}</p>
    <p><strong>Tracking:</strong> {order.tracking_number}</p>
  </div>
  <p className="warning">
    Esta acción marca el pedido como entregado y no puede revertirse desde esta vista.
  </p>
  <button onClick={onCancel}>Cancelar</button>
  <button onClick={onConfirm} className="danger">Confirmar entrega</button>
</Modal>
```

---

### 5.4. Toast notifications

**Librería recomendada:** `react-hot-toast`

**Mensajes:**
- ✅ Success: "Orden marcada como {status}"
- ✅ Success: "Tracking actualizado correctamente"
- ❌ Error: Mostrar mensaje exacto del backend (ej: "No se puede marcar como preparando sin pago confirmado")
- ❌ Error genérico: "No se pudo actualizar la orden. Intenta de nuevo."

---

### 5.5. Refresh de datos tras acción exitosa

**Solución RECOMENDADA (conservadora):**
```typescript
// Re-fetch desde API para garantizar consistencia
await fetchOrders()
```

**NO usar:** Update optimista local (riesgo de desincronización)

---

## 6. VALIDACIONES DE SEGURIDAD

### 6.1. Auth check
✅ Ya existe en endpoint (cookie admin session)

### 6.2. CSRF protection
✅ Ya existe (SameSite cookies)

### 6.3. Input sanitization
✅ Frontend: `maxLength={100}`, `pattern="[a-zA-Z0-9\s\-_]+"` (opcional)  
✅ Backend: Supabase prepared statements (previene SQL injection)

### 6.4. Rate limiting
✅ Deshabilitar botón mientras request en flight  
✅ Mostrar loading spinner

---

## 7. REGLAS DE ESTADOS PERMITIDOS

### 7.1. Diagrama de flujo

```
pending → preparing → shipped → delivered
```

### 7.2. Transiciones válidas

| Estado actual | Puede cambiar a | Requiere |
|---------------|-----------------|----------|
| `pending` | `preparing` | paid + address |
| `preparing` | `shipped` | paid + address + provider + tracking |
| `shipped` | `delivered` | estado previo = shipped |

**Transiciones inválidas (bloqueadas por backend):**
- ❌ `pending` → `shipped` (debe pasar por `preparing`)
- ❌ `pending` → `delivered` (debe pasar por `preparing` y `shipped`)
- ❌ `preparing` → `delivered` (debe pasar por `shipped`)
- ❌ `shipped` → `pending` (no se puede retroceder)
- ❌ `delivered` → cualquier otro (estado final)

---

## 8. RIESGOS

### 8.1. Riesgo: Admin marca "entregado" por error
**Mitigación:** Modal de confirmación fuerte con detalles de orden

### 8.2. Riesgo: Tracking number incorrecto
**Mitigación:** Permitir editar tracking después

### 8.3. Riesgo: Tocar áreas prohibidas
**Mitigación:** Documentación clara + code review

---

## 9. TESTS REQUERIDOS

### 9.1. Tests unitarios (componentes)

**Componente:** `EnviosActions.tsx`

**Tests:**
1. Renderiza "Ver detalle" en TODOS los estados
2. Renderiza "Marcar preparando" solo si `pending` + dirección
3. Renderiza "Marcar enviado" solo si `preparing`
4. Renderiza "Editar tracking" + "Marcar entregado" solo si `shipped`
5. No renderiza botones de acción (solo "Ver detalle") si `delivered`
6. Deshabilita botones mientras request en flight

---

### 9.2. Tests de integración (API)

**Ya existen de FASE 1A, re-validar:**
1. Sin auth → 401
2. Marcar preparing sin pago → 400
3. Marcar preparing sin dirección → 400
4. Marcar shipped sin tracking → 400
5. Marcar delivered sin estado shipped → 400
6. Marcar preparing con pago + dirección → 200
7. Marcar shipped con tracking → 200 y genera tracking_url
8. Editar tracking de orden shipped → 200
9. Marcar delivered con estado shipped → 200

**Nuevos tests (providers):**
10. Marcar shipped con provider="ups" → 200 (tracking_url = null)
11. Marcar shipped con provider="otro" → 200 (tracking_url = null)

---

### 9.3. Tests manuales (QA visual)

**Checklist:**

1. **Marcar como preparando**
   - [ ] Botón visible en órdenes pending con dirección
   - [ ] Modal de confirmación aparece
   - [ ] Confirmar → orden cambia a 'preparing'
   - [ ] Toast success
   - [ ] "Ver detalle" sigue visible

2. **Marcar como enviado**
   - [ ] Botón visible en órdenes preparing
   - [ ] Modal con select de 7 paqueterías
   - [ ] Seleccionar "Otro" → muestra input custom
   - [ ] Submit → orden cambia a 'shipped'
   - [ ] Tracking aparece en tabla
   - [ ] "Ver detalle" sigue visible

3. **Editar tracking**
   - [ ] Botón visible en órdenes shipped
   - [ ] Modal pre-llenado con valores actuales
   - [ ] Modificar → actualiza correctamente
   - [ ] "Ver detalle" sigue visible

4. **Marcar como entregado**
   - [ ] Botón visible en órdenes shipped
   - [ ] Modal FUERTE con: cliente, producto, tracking, warning
   - [ ] Confirmar → orden cambia a 'delivered'
   - [ ] Botones de acción desaparecen (solo "Ver detalle")

5. **"Ver detalle" siempre visible**
   - [ ] Visible en pending sin dirección
   - [ ] Visible en pending con dirección
   - [ ] Visible en preparing
   - [ ] Visible en shipped
   - [ ] Visible en delivered

6. **No rompió nada**
   - [ ] /admin/orders funciona
   - [ ] Checkout funciona
   - [ ] Webhook funciona
   - [ ] Panel cliente funciona

---

## 10. ÁREAS PROHIBIDAS

### 10.1. NO MODIFICAR

❌ Checkout: `src/app/checkout/`, `src/app/api/checkout/`  
❌ Stripe: `src/app/api/stripe/webhook/`  
❌ Productos: `src/app/admin/productos/`, `src/app/api/products/`  
❌ Panel cliente: `src/app/account/`, `src/app/api/account/`  
❌ DB schema: `supabase/migrations/`  
❌ RLS policies  

### 10.2. MODIFICAR (permitido)

✅ `src/components/admin/envios/` (crear EnviosActions.tsx)  
✅ `src/components/admin/envios/EnviosTable.tsx` (agregar columna)  
✅ `src/app/admin/envios/page.tsx` (agregar refresh callback)  
✅ `src/types/admin-envios.ts` (si necesario)  

### 10.3. ACTUALIZAR ANTES DE IMPLEMENTAR

⚠️ **`src/app/api/orders/[id]/shipping/route.ts`:**
- Actualizar lista de `validProviders` para incluir: `ups`, `estafeta`, `redpack`, `paqueteexpress`, `otro`
- **O mejor:** Remover validación de lista blanca y permitir cualquier string

---

## 11. PLAN DE IMPLEMENTACIÓN (INCREMENTAL)

### 11.1. Subfases ajustadas

**SUBFASE 1C.1 - EnviosActions UI dummy + mantener "Ver detalle"**
- Duración: 0.5d
- Crear componente con botones dummy
- **SIEMPRE renderizar "Ver detalle"**
- Validar que botones se muestran según estado
- NO conectar a API todavía
- **Criterio de avance:** Botones visibles correctamente + "Ver detalle" siempre presente

---

**SUBFASE 1C.2 - Modales (confirmación simple + form tracking + confirmación fuerte)**
- Duración: 1d
- Implementar 3 modales con React state
- Modal 1: Confirmación simple (preparando)
- Modal 2: Form tracking con 7 paqueterías + "Otro"
- Modal 3: Confirmación fuerte (entregado) con detalles de orden
- Validar que abren/cierran correctamente
- **Criterio de avance:** Modales funcionan + validación frontend OK

---

**SUBFASE 1C.3 - Integración API: Marcar preparando**
- Duración: 0.5d
- Conectar botón "Marcar preparando" a API
- Manejar success/error con toasts
- Implementar refresh de tabla
- **Criterio de avance:** Preparando funciona end-to-end

---

**SUBFASE 1C.4 - Integración API: Marcar enviado + Editar tracking**
- Duración: 1d
- Actualizar backend: agregar paqueterías a validProviders
- Conectar "Marcar enviado" a API
- Conectar "Editar tracking" a API
- Manejar "Otro" correctamente
- **Criterio de avance:** Shipped + edit tracking funcionan

---

**SUBFASE 1C.5 - Integración API: Marcar entregado + QA final**
- Duración: 1d
- Conectar "Marcar entregado" a API
- Tests manuales completos (6 checklist items)
- Validación de regresión
- **Criterio de avance:** Todos los tests PASS

**Total estimado:** 4 días

---

### 11.2. Criterios de avance entre subfases

**1C.1 → 1C.2:**
- ✅ Botones se muestran correctamente
- ✅ "Ver detalle" visible en todos los estados
- ✅ Build PASS

**1C.2 → 1C.3:**
- ✅ Modales abren/cierran
- ✅ Validación frontend funciona
- ✅ Build PASS

**1C.3 → 1C.4:**
- ✅ "Marcar preparando" funciona end-to-end
- ✅ Success/error handling funciona

**1C.4 → 1C.5:**
- ✅ "Marcar enviado" funciona
- ✅ "Editar tracking" funciona
- ✅ Paqueterías custom OK

**Cierre 1C.5:**
- ✅ Todos los criterios PASS (sección 12)
- ✅ Tests manuales 6/6 PASS

---

## 12. CRITERIOS PASS/FAIL

### 12.1. Criterios PASS (todos deben cumplirse)

**Build:**
- ✅ `npm run build` sin errores TypeScript
- ✅ Build time < 30s

**Funcionalidad:**
- ✅ "Ver detalle" SIEMPRE visible (todos los estados)
- ✅ Botón "Marcar preparando" funciona
- ✅ Botón "Marcar enviado" funciona (7 paqueterías)
- ✅ Botón "Editar tracking" funciona
- ✅ Botón "Marcar entregado" funciona
- ✅ Modal confirmación fuerte muestra: cliente, producto, tracking, warning
- ✅ Modales abren/cierran correctamente
- ✅ Validaciones frontend previenen submit inválido
- ✅ Toast notifications aparecen (success + error)
- ✅ Tabla se actualiza tras acción exitosa

**Seguridad:**
- ✅ Solo admin autenticado puede ejecutar acciones
- ✅ No se pueden hacer transiciones inválidas
- ✅ Input tracking_number sanitizado

**Regresión:**
- ✅ /admin/envios (readonly) sigue funcionando
- ✅ /admin/orders sigue funcionando
- ✅ Checkout NO se rompió
- ✅ Stripe webhook NO se rompió
- ✅ Panel cliente NO se rompió

**Tests:**
- ✅ 6 tests unitarios PASS
- ✅ 11 tests integración PASS (9 existentes + 2 nuevos)
- ✅ 6 tests manuales PASS

---

### 12.2. Criterios FAIL (cualquiera causa rechazo)

**Build:**
- ❌ Build falla con errores TypeScript

**Funcionalidad:**
- ❌ "Ver detalle" NO está visible en algún estado
- ❌ "Ver detalle" fue reemplazado (en vez de agregado)
- ❌ Botones se muestran en estados incorrectos
- ❌ Acción no actualiza estado de orden
- ❌ Modal de "Entregado" NO muestra cliente/producto/tracking
- ❌ Tabla no se actualiza tras acción

**Seguridad:**
- ❌ Usuario no autenticado puede ejecutar acciones
- ❌ Se pueden hacer transiciones inválidas

**Regresión:**
- ❌ Cualquier área prohibida se rompió

---

## 13. RESUMEN EJECUTIVO

**Objetivo:** Permitir al admin modificar estados de envío desde `/admin/envios`

**Acciones:** 4 acciones (preparando, enviado, editar tracking, entregado)

**Endpoints:** Reutilizar `PUT /api/orders/[id]/shipping` (actualizar validProviders primero)

**UI:** 
- Componente `EnviosActions.tsx`
- **"Ver detalle" siempre visible**
- 3 modales (confirmación simple, form tracking, confirmación fuerte)
- 7 paqueterías: DHL, FedEx, UPS, Estafeta, Redpack, Paquete Express, Otro

**Seguridad:** Auth admin + validaciones backend (ya existentes)

**Tests:** 6 unitarios + 11 integración + 6 manuales

**Duración:** ~4 días (5 subfases incrementales)

**Riesgo:** Bajo (reutilizamos API ya validada)

---

**CAMBIOS RESPECTO A VERSIÓN ANTERIOR:**

1. ✅ **"Ver detalle" NO se reemplaza** — se agrega junto a las acciones
2. ✅ **Contrato del endpoint documentado** — payloads exactos + responses + errores
3. ✅ **7 paqueterías** — DHL, FedEx, UPS, Estafeta, Redpack, Paquete Express, Otro
4. ✅ **Confirmación fuerte para "Entregado"** — muestra cliente, producto, tracking, warning
5. ✅ **Subfases ajustadas** — 5 subfases incrementales con criterios claros

---

**FIN DE SCOPE ADMIN FASE 1C**

**Estado:** ✅ **SCOPE APROBADO — LISTO PARA IMPLEMENTACIÓN**
