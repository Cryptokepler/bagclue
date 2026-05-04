# ADMIN FASE 1C — ACCIONES DE FULFILLMENT (SCOPE TÉCNICO)

**Fecha:** 2026-05-04  
**Proyecto:** Bagclue Admin Panel  
**Fase:** 1C - Acciones de fulfillment desde vista /admin/envios  
**Estado:** SOLO DISEÑO — NO IMPLEMENTAR SIN AUTORIZACIÓN  
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

### 1.3. Alcance
**Modificar:** UI de `/admin/envios` (agregar acciones)  
**Reutilizar:** API `PUT /api/orders/[id]/shipping` (ya existe con validaciones de FASE 1A)  
**NO crear:** Nuevas APIs (usaremos la existente)

---

## 2. ACCIONES EXACTAS A IMPLEMENTAR

### 2.1. Acción: Marcar como "Preparando"

**Trigger:** Botón "Marcar preparando" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `payment_status = 'paid'`
- Orden debe tener `shipping_address NOT NULL`
- Estado actual debe ser `shipping_status = 'pending'` o `null`

**Flujo:**
1. Admin click en "Marcar preparando"
2. Modal de confirmación: "¿Marcar orden {ORDER_ID} como preparando?"
3. Si confirma → `PUT /api/orders/[id]/shipping` con `{ shipping_status: 'preparing' }`
4. Si éxito (200) → actualizar tabla local + toast success
5. Si error (400/500) → toast error con mensaje

**Validaciones backend (ya existen en FASE 1A):**
- ✅ payment_status = 'paid'
- ✅ shipping_address NOT NULL
- ✅ Estado actual NO es 'shipped' ni 'delivered'

---

### 2.2. Acción: Marcar como "Enviado" con tracking

**Trigger:** Botón "Marcar enviado" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `payment_status = 'paid'`
- Orden debe tener `shipping_address NOT NULL`
- Estado actual debe ser `preparing` o `pending`

**Flujo:**
1. Admin click en "Marcar enviado"
2. Modal con form:
   ```
   Paquetería: [Select: DHL, FedEx, Estafeta, Manual]
   Tracking number: [Input text]
   [Cancelar] [Guardar]
   ```
3. Validación frontend:
   - Paquetería requerida
   - Tracking number requerido (min 3 chars)
4. Si válido → `PUT /api/orders/[id]/shipping` con:
   ```json
   {
     "shipping_status": "shipped",
     "shipping_provider": "dhl",
     "tracking_number": "1234567890"
   }
   ```
5. Backend auto-genera `tracking_url` y asigna `shipped_at`
6. Si éxito (200) → actualizar tabla + toast "Orden marcada como enviada"
7. Si error → toast error con mensaje

**Validaciones backend (ya existen en FASE 1A):**
- ✅ payment_status = 'paid'
- ✅ shipping_address NOT NULL
- ✅ shipping_provider en lista válida
- ✅ tracking_number presente
- ✅ Auto-genera tracking_url si provider es DHL/FedEx/Estafeta

---

### 2.3. Acción: Editar tracking info

**Trigger:** Botón "Editar tracking" (solo visible si orden ya tiene tracking)

**Condiciones previas (UI):**
- Orden debe tener `shipping_status = 'shipped'`
- Orden debe tener `tracking_number` existente

**Flujo:**
1. Admin click en "Editar tracking"
2. Modal pre-llenado con valores actuales:
   ```
   Paquetería: [Select pre-seleccionado con valor actual]
   Tracking number: [Input con valor actual]
   [Cancelar] [Guardar]
   ```
3. Admin puede modificar paquetería y/o tracking number
4. Si modifica → `PUT /api/orders/[id]/shipping` con nuevos valores
5. Backend actualiza `tracking_number`, `tracking_provider`, regenera `tracking_url`
6. Si éxito → actualizar tabla + toast "Tracking actualizado"

**Validaciones backend (ya existen):**
- ✅ Mismas que marcar como enviado
- ✅ Permite actualizar tracking de órdenes ya shipped

---

### 2.4. Acción: Marcar como "Entregado"

**Trigger:** Botón "Marcar entregado" en tabla de órdenes

**Condiciones previas (UI):**
- Orden debe tener `shipping_status = 'shipped'`

**Flujo:**
1. Admin click en "Marcar entregado"
2. Modal de confirmación: "¿Confirmar que la orden {ORDER_ID} fue entregada?"
3. Si confirma → `PUT /api/orders/[id]/shipping` con `{ shipping_status: 'delivered' }`
4. Backend asigna `delivered_at` automáticamente
5. Si éxito → actualizar tabla + toast "Orden marcada como entregada"

**Validaciones backend (ya existen en FASE 1A):**
- ✅ Estado previo debe ser 'shipped'
- ✅ Auto-asigna delivered_at con timestamp actual

---

### 2.5. Botones visibles según estado

**Matriz de visibilidad:**

| Estado actual | Botones visibles |
|---------------|------------------|
| `pending` (sin dirección) | — ninguno — |
| `pending` (con dirección) | [Marcar preparando] |
| `preparing` | [Marcar enviado] |
| `shipped` | [Editar tracking] [Marcar entregado] |
| `delivered` | — ninguno — |

**Regla:** Un botón solo se muestra si la acción es válida según el estado actual y las reglas de negocio.

---

## 3. ENDPOINTS NECESARIOS

### 3.1. Endpoint existente (NO crear nuevo)

**Endpoint:** `PUT /api/orders/[id]/shipping`

**Ubicación:** `src/app/api/orders/[id]/shipping/route.ts`

**Estado:** ✅ Ya existe (creado en FASE 1A)

**Validaciones actuales:**
```typescript
// REGLA A: preparing requiere paid + address
if (shipping_status === 'preparing') {
  if (order.payment_status !== 'paid') return 400
  if (!order.shipping_address) return 400
}

// REGLA B: shipped requiere paid + address + provider + tracking
if (shipping_status === 'shipped') {
  if (order.payment_status !== 'paid') return 400
  if (!order.shipping_address) return 400
  if (!shipping_provider || !tracking_number) return 400
  // Auto-genera tracking_url
  // Auto-asigna shipped_at
}

// REGLA C: delivered requiere estado previo shipped
if (shipping_status === 'delivered') {
  if (order.shipping_status !== 'shipped') return 400
  // Auto-asigna delivered_at
}
```

**Uso desde FASE 1C:**
- ✅ Llamar desde UI con fetch POST
- ✅ No requiere modificaciones (ya tiene todas las validaciones)
- ✅ Auth: usa misma cookie admin que `/admin/envios`

---

### 3.2. NO crear nuevas APIs

**Razón:** El endpoint existente ya cubre todos los casos de uso

**Alternativa descartada:** Crear `/api/admin/envios/[id]/actions` → innecesario, duplicaría lógica

---

## 4. CAMBIOS UI NECESARIOS

### 4.1. Componente nuevo: `EnviosActions.tsx`

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
- Mostrar modales de confirmación/form
- Hacer fetch a `PUT /api/orders/[id]/shipping`
- Manejar success/error con toasts

**Botones a renderizar:**
```tsx
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

### 4.2. Modificar `EnviosTable.tsx`

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

### 4.3. Modales necesarios

#### Modal 1: Confirmación simple (preparando, entregado)
```tsx
<Modal>
  <h3>Confirmar acción</h3>
  <p>¿Marcar orden {orderId} como {action}?</p>
  <button onClick={onCancel}>Cancelar</button>
  <button onClick={onConfirm}>Confirmar</button>
</Modal>
```

#### Modal 2: Form tracking (enviado, editar tracking)
```tsx
<Modal>
  <h3>Información de envío</h3>
  <form onSubmit={handleSubmit}>
    <label>Paquetería</label>
    <select name="provider" required>
      <option value="dhl">DHL</option>
      <option value="fedex">FedEx</option>
      <option value="estafeta">Estafeta</option>
      <option value="manual">Manual</option>
    </select>
    
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

---

### 4.4. Toast notifications

**Librería recomendada:** `react-hot-toast` (ya instalada si está en package.json)

**Mensajes:**
- ✅ Success: "Orden marcada como {status}"
- ✅ Success: "Tracking actualizado correctamente"
- ❌ Error: "Error: {mensaje del servidor}"
- ❌ Error: "No se pudo actualizar la orden. Intenta de nuevo."

---

### 4.5. Refresh de datos tras acción exitosa

**Problema:** Tras marcar como "enviado", la tabla debe refrescar para mostrar nuevo estado

**Solución 1 (optimista):**
```typescript
// Actualizar estado local inmediatamente
setOrders(prevOrders => 
  prevOrders.map(o => 
    o.id === orderId 
      ? { ...o, shipping_status: 'shipped', tracking_number: '...' }
      : o
  )
)
```

**Solución 2 (conservadora - RECOMENDADA):**
```typescript
// Re-fetch desde API para garantizar consistencia
await fetchOrders()
```

**Decisión:** Usar Solución 2 para evitar desincronización con backend

---

## 5. VALIDACIONES DE SEGURIDAD

### 5.1. Auth check

**Validación:** Endpoint `PUT /api/orders/[id]/shipping` ya valida sesión admin

**Implementado en FASE 1A:**
```typescript
const session = await getSession()
if (!session.isLoggedIn) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Acción requerida en FASE 1C:** ✅ Ninguna (ya existe)

---

### 5.2. CSRF protection

**Mecanismo:** SameSite cookies + verificación de origen

**Estado actual:** ✅ Cookie `bagclue_admin_session` tiene `sameSite: 'lax'`

**Acción requerida:** ✅ Ninguna (ya protegido)

---

### 5.3. Input sanitization

**Riesgo:** Admin podría inyectar SQL/XSS en tracking_number

**Mitigación backend (ya existe):**
- ✅ Supabase usa prepared statements (previene SQL injection)
- ✅ tracking_number se almacena como texto plano (no se renderiza como HTML)

**Mitigación frontend:**
- ✅ Input `type="text"` con `maxLength={100}` y `pattern="[a-zA-Z0-9\-_]+"` (opcional)
- ✅ Escapar valores antes de renderizar (React hace esto automáticamente)

---

### 5.4. Validación de permisos

**Pregunta:** ¿Debe validarse que el admin tiene permisos para modificar órdenes?

**Estado actual:** Sesión admin = permisos totales (no hay roles granulares)

**Acción requerida:** ✅ Ninguna (single admin role)

**Consideración futura:** Si se implementan múltiples admins con roles (editor vs viewer), agregar validación de permisos

---

### 5.5. Rate limiting

**Riesgo:** Admin hace spam de clicks en "Marcar enviado"

**Mitigación UI:**
- ✅ Deshabilitar botón mientras request está en flight
- ✅ Mostrar loading spinner en botón

**Mitigación backend (OPCIONAL):**
- ⏸️ Implementar rate limit (ej: max 10 updates por minuto por admin)
- ⏸️ NO prioritario para esta fase (admin es confiable)

---

## 6. REGLAS DE ESTADOS PERMITIDOS

### 6.1. Diagrama de flujo

```
[Orden creada]
     ↓
payment_status = 'pending'
shipping_status = null
     ↓
[Cliente paga]
     ↓
payment_status = 'paid'
shipping_status = 'pending'
     ↓
[Admin: Marcar preparando]  ← ACCIÓN 1
     ↓
shipping_status = 'preparing'
     ↓
[Admin: Marcar enviado]  ← ACCIÓN 2
     ↓
shipping_status = 'shipped'
tracking_number = "..."
tracking_url = "..."
shipped_at = timestamp
     ↓
[Admin: Marcar entregado]  ← ACCIÓN 3
     ↓
shipping_status = 'delivered'
delivered_at = timestamp
```

---

### 6.2. Transiciones válidas

| Estado actual | Puede cambiar a | Acción requerida |
|---------------|-----------------|------------------|
| `null` | `pending` | Automático (checkout) |
| `pending` | `preparing` | Admin: Marcar preparando |
| `preparing` | `shipped` | Admin: Marcar enviado + tracking |
| `shipped` | `delivered` | Admin: Marcar entregado |

**Transiciones inválidas (bloqueadas por backend):**
- ❌ `pending` → `shipped` (debe pasar por `preparing`)
- ❌ `pending` → `delivered` (debe pasar por `preparing` y `shipped`)
- ❌ `preparing` → `delivered` (debe pasar por `shipped`)
- ❌ `shipped` → `pending` (no se puede retroceder)
- ❌ `delivered` → cualquier otro (estado final)

---

### 6.3. Validación de prerequisitos

**Para marcar como `preparing`:**
- ✅ `payment_status = 'paid'`
- ✅ `shipping_address NOT NULL`

**Para marcar como `shipped`:**
- ✅ `payment_status = 'paid'`
- ✅ `shipping_address NOT NULL`
- ✅ `shipping_provider NOT NULL`
- ✅ `tracking_number NOT NULL`
- ✅ Estado previo: `preparing` o `pending` (tolerable)

**Para marcar como `delivered`:**
- ✅ Estado previo: `shipped` (estricto)

---

### 6.4. Campos auto-calculados

**Al marcar como `shipped`:**
- ✅ Backend asigna `shipped_at = NOW()`
- ✅ Backend genera `tracking_url` si provider es DHL/FedEx/Estafeta
- ✅ Si provider es 'manual', tracking_url = null

**Al marcar como `delivered`:**
- ✅ Backend asigna `delivered_at = NOW()`

---

## 7. RIESGOS

### 7.1. Riesgo: Admin marca "entregado" por error

**Impacto:** Cliente recibe notificación de entrega cuando el paquete no ha llegado

**Mitigación:**
- ✅ Modal de confirmación: "¿Estás seguro que la orden fue entregada?"
- ✅ No permitir revertir estado (delivered es final)
- ⏸️ Futuro: Log de acciones admin (auditoría)

**Severidad:** Media (requiere contacto manual con cliente para corregir)

---

### 7.2. Riesgo: Tracking number incorrecto

**Impacto:** Cliente no puede rastrear su pedido

**Mitigación:**
- ✅ Permitir editar tracking después de marcar como "enviado"
- ✅ Validación frontend: min 3 chars, alfanumérico
- ⏸️ Futuro: Validar formato de tracking según paquetería (regex)

**Severidad:** Baja (fácilmente corregible con "Editar tracking")

---

### 7.3. Riesgo: Race condition (2 admins editan misma orden)

**Escenario:** 
1. Admin A abre modal "Marcar enviado"
2. Admin B marca la orden como "enviado" primero
3. Admin A guarda con tracking diferente
4. Tracking de Admin A sobreescribe el de Admin B

**Mitigación (FASE 1C):**
- ✅ Last-write-wins (comportamiento por defecto de DB)
- ⏸️ Futuro: Optimistic locking (check `updated_at` antes de update)

**Severidad:** Muy baja (caso extremo, solo si hay múltiples admins activos simultáneamente)

---

### 7.4. Riesgo: Error de red durante update

**Impacto:** Admin ve error, pero el update sí se aplicó en backend

**Mitigación:**
- ✅ Si error de red → mostrar toast "Error de conexión. Verifica si el cambio se aplicó."
- ✅ Refresh automático tras cerrar modal (garantiza UI actualizada)

**Severidad:** Baja (confusión momentánea, sin pérdida de datos)

---

### 7.5. Riesgo: Tocar código de checkout/Stripe

**Impacto:** Romper flujo de pago

**Mitigación:**
- ✅ NO modificar nada en `/api/checkout/`, `/api/stripe/`
- ✅ Solo modificar `/admin/envios` (UI admin) y reutilizar `/api/orders/[id]/shipping` (ya validado)

**Severidad:** Crítica si se viola (pero fácil de prevenir con discipline)

---

## 8. TESTS REQUERIDOS

### 8.1. Tests unitarios (componentes)

**Componente:** `EnviosActions.tsx`

**Tests:**
1. Renderiza "Marcar preparando" solo si `shipping_status = 'pending'` y tiene dirección
2. Renderiza "Marcar enviado" solo si `shipping_status = 'preparing'`
3. Renderiza "Editar tracking" y "Marcar entregado" solo si `shipping_status = 'shipped'`
4. No renderiza ningún botón si `shipping_status = 'delivered'`
5. Deshabilita botones mientras request en flight
6. Llama a `onActionComplete` tras success

---

### 8.2. Tests de integración (API)

**Endpoint:** `PUT /api/orders/[id]/shipping`

**Tests (ya existen de FASE 1A, re-validar):**
1. Sin auth → 401
2. Con auth pero orden no existe → 404
3. Marcar preparing sin pago → 400
4. Marcar preparing sin dirección → 400
5. Marcar shipped sin tracking → 400
6. Marcar delivered sin estado previo shipped → 400
7. Marcar preparing con pago + dirección → 200
8. Marcar shipped con tracking → 200 y genera tracking_url
9. Editar tracking de orden shipped → 200
10. Marcar delivered con estado shipped → 200

---

### 8.3. Tests manuales (QA visual)

**Checklist:**

1. **Marcar como preparando**
   - [ ] Botón solo visible en órdenes pending con dirección
   - [ ] Modal de confirmación aparece
   - [ ] Si confirma → orden cambia a 'preparing'
   - [ ] Toast success aparece
   - [ ] Tabla se actualiza (botón cambia a "Marcar enviado")

2. **Marcar como enviado**
   - [ ] Botón solo visible en órdenes preparing
   - [ ] Modal con form tracking aparece
   - [ ] Seleccionar paquetería DHL + tracking "1234567890" → submit
   - [ ] Si éxito → orden cambia a 'shipped'
   - [ ] Tracking number aparece en tabla
   - [ ] Link tracking funciona (abre DHL)
   - [ ] Toast success aparece

3. **Editar tracking**
   - [ ] Botón solo visible en órdenes shipped
   - [ ] Modal pre-llenado con valores actuales
   - [ ] Modificar tracking → guardar → actualiza correctamente
   - [ ] Toast success aparece

4. **Marcar como entregado**
   - [ ] Botón solo visible en órdenes shipped
   - [ ] Modal de confirmación aparece
   - [ ] Si confirma → orden cambia a 'delivered'
   - [ ] Botones desaparecen (no hay acciones en delivered)
   - [ ] Toast success aparece

5. **Errores**
   - [ ] Intentar marcar preparing sin dirección → error 400 + toast error
   - [ ] Intentar marcar shipped sin tracking → validación frontend previene submit
   - [ ] Error de red → toast error descriptivo

6. **No rompió nada**
   - [ ] /admin/orders sigue funcionando
   - [ ] Checkout sigue funcionando
   - [ ] Stripe webhook sigue funcionando
   - [ ] Panel cliente sigue funcionando

---

### 8.4. Tests de regresión

**Validar que NO se rompió:**
- [ ] FASE 1B.1: API /admin/envios sigue retornando datos correctos
- [ ] FASE 1B.2: UI /admin/envios (tabs, search, pagination) sigue funcionando
- [ ] FASE 1B.3: Link en AdminNav sigue funcionando
- [ ] FASE 1A: Validaciones backend siguen aplicándose

---

## 9. ÁREAS PROHIBIDAS

### 9.1. NO MODIFICAR

❌ **Checkout:**
- `src/app/checkout/`
- `src/app/api/checkout/`

❌ **Stripe:**
- `src/app/api/stripe/webhook/`

❌ **Productos/stock:**
- `src/app/admin/productos/`
- `src/app/api/products/`

❌ **Panel cliente:**
- `src/app/account/`
- `src/app/api/account/`

❌ **DB schema:**
- `supabase/migrations/`
- NO crear nuevas tablas
- NO modificar columnas existentes

❌ **RLS policies:**
- NO modificar policies de Supabase

❌ **API de envíos (solo reutilizar):**
- `src/app/api/orders/[id]/shipping/route.ts` → NO MODIFICAR (ya validado en FASE 1A)

---

### 9.2. SÍ MODIFICAR (permitido)

✅ **UI Admin Envíos:**
- `src/components/admin/envios/EnviosTable.tsx` (agregar columna acciones)
- `src/components/admin/envios/` (crear EnviosActions.tsx)

✅ **Página Admin Envíos:**
- `src/app/admin/envios/page.tsx` (agregar refresh callback)

✅ **Types:**
- `src/types/admin-envios.ts` (agregar types de modales si necesario)

---

## 10. CRITERIOS PASS/FAIL

### 10.1. Criterios PASS (todos deben cumplirse)

**Build:**
- ✅ `npm run build` compila sin errores TypeScript
- ✅ Build time < 30s

**Funcionalidad:**
- ✅ Botón "Marcar preparando" funciona correctamente
- ✅ Botón "Marcar enviado" funciona y genera tracking_url
- ✅ Botón "Editar tracking" funciona y actualiza valores
- ✅ Botón "Marcar entregado" funciona
- ✅ Modales se abren y cierran correctamente
- ✅ Validaciones frontend previenen submit inválido
- ✅ Validaciones backend retornan errores claros (400 + mensaje)
- ✅ Toast notifications aparecen en success y error
- ✅ Tabla se actualiza tras acción exitosa

**Seguridad:**
- ✅ Solo admin autenticado puede ejecutar acciones
- ✅ No se pueden hacer transiciones inválidas de estado
- ✅ Input tracking_number está sanitizado (max length, pattern)

**Regresión:**
- ✅ /admin/envios (readonly) sigue funcionando
- ✅ /admin/orders sigue funcionando
- ✅ Checkout NO se rompió
- ✅ Stripe webhook NO se rompió
- ✅ Panel cliente NO se rompió

**Tests:**
- ✅ 6 tests unitarios PASS (EnviosActions renderiza botones correctos)
- ✅ 10 tests integración PASS (API validations)
- ✅ 6 tests manuales PASS (QA visual)

---

### 10.2. Criterios FAIL (cualquiera causa rechazo)

**Build:**
- ❌ Build falla con errores TypeScript
- ❌ Build time > 60s (señal de problema)

**Funcionalidad:**
- ❌ Botones se muestran en estados incorrectos
- ❌ Acción no actualiza estado de orden
- ❌ Tracking_url no se genera correctamente
- ❌ Tabla no se actualiza tras acción
- ❌ Modales no se abren/cierran
- ❌ Toast notifications no aparecen

**Seguridad:**
- ❌ Usuario no autenticado puede ejecutar acciones
- ❌ Se pueden hacer transiciones inválidas (ej: pending → delivered)
- ❌ Tracking_number permite inyección SQL/XSS

**Regresión:**
- ❌ /admin/envios (tabs/search/pagination) dejó de funcionar
- ❌ /admin/orders se rompió
- ❌ Checkout se rompió
- ❌ Stripe webhook se rompió
- ❌ Panel cliente se rompió
- ❌ Cualquier error crítico en consola

**Tests:**
- ❌ Cualquier test unitario FAIL
- ❌ Cualquier test integración FAIL
- ❌ Más de 2 tests manuales FAIL

---

## 11. PLAN DE IMPLEMENTACIÓN (SUGERIDO)

### 11.1. Subfases recomendadas

**SUBFASE 1C.1 - Componente EnviosActions (solo UI, sin funcionalidad)**
- Duración: 0.5d
- Crear componente con botones dummy
- Validar que botones se muestran según estado
- NO conectar a API todavía

**SUBFASE 1C.2 - Modales de confirmación/form**
- Duración: 1d
- Implementar modales con React state
- Validar que abren/cierran correctamente
- Form tracking con validación frontend

**SUBFASE 1C.3 - Integración con API**
- Duración: 1d
- Conectar botones a `PUT /api/orders/[id]/shipping`
- Manejar success/error
- Implementar toast notifications

**SUBFASE 1C.4 - Refresh de tabla y polish**
- Duración: 0.5d
- Implementar refresh tras acción exitosa
- Loading states en botones
- Mejoras UX (animaciones, feedback)

**SUBFASE 1C.5 - Tests y QA**
- Duración: 1d
- Tests unitarios (EnviosActions)
- Tests manuales (6 checklist items)
- Validación de regresión

**Total estimado:** 4 días

---

### 11.2. Orden de implementación (crítico)

1. ✅ Crear EnviosActions.tsx (sin funcionalidad)
2. ✅ Integrar en EnviosTable.tsx (reemplazar botón "Ver detalle")
3. ✅ Implementar modales (confirmación simple + form tracking)
4. ✅ Conectar "Marcar preparando" a API
5. ✅ Conectar "Marcar enviado" a API
6. ✅ Conectar "Editar tracking" a API
7. ✅ Conectar "Marcar entregado" a API
8. ✅ Implementar refresh de tabla
9. ✅ Tests unitarios
10. ✅ QA manual completo
11. ✅ Validación de regresión

---

### 11.3. Criterios de avance entre subfases

**Para avanzar de 1C.1 a 1C.2:**
- ✅ Botones se muestran correctamente según estado
- ✅ Build PASS

**Para avanzar de 1C.2 a 1C.3:**
- ✅ Modales abren/cierran
- ✅ Validación frontend funciona
- ✅ Build PASS

**Para avanzar de 1C.3 a 1C.4:**
- ✅ Al menos 1 acción funciona end-to-end (ej: Marcar preparando)
- ✅ Success/error handling básico funciona

**Para avanzar de 1C.4 a 1C.5:**
- ✅ Todas las 4 acciones funcionan
- ✅ Refresh de tabla funciona
- ✅ Build PASS

**Para cerrar 1C.5:**
- ✅ Todos los criterios PASS cumplidos (sección 10.1)
- ✅ Ningún criterio FAIL presente (sección 10.2)

---

## 12. CONSIDERACIONES FINALES

### 12.1. Decisiones de diseño

**¿Botón "Ver detalle" sigue existiendo?**
- Opción A: Reemplazarlo con botones de acción
- Opción B: Mantenerlo + agregar botones de acción
- **Recomendación:** Opción A (botones de acción son más útiles que "Ver detalle")

**¿Dónde poner botones de acción?**
- Opción A: Columna "Acciones" (reemplaza "Ver detalle")
- Opción B: Inline en cada row (más espacio)
- Opción C: Dropdown menu (más limpio)
- **Recomendación:** Opción A para desktop, Opción C para mobile (responsive)

**¿Cuántos botones máximo por row?**
- Max 2 botones visibles simultáneamente (ej: "Editar tracking" + "Marcar entregado")
- Si hay más, usar dropdown

---

### 12.2. Mejoras futuras (fuera de FASE 1C)

⏸️ **Log de acciones admin (auditoría):**
- Registrar quién marcó qué y cuándo
- Útil para debugging y compliance

⏸️ **Notificaciones automáticas al cliente:**
- Email cuando orden cambia a "shipped" (con tracking link)
- Email cuando orden cambia a "delivered"

⏸️ **Validación de tracking number por paquetería:**
- DHL: 10 dígitos numéricos
- FedEx: 12-14 dígitos
- Estafeta: formato específico

⏸️ **Integración con APIs de paqueterías:**
- Auto-detectar estado de entrega desde DHL/FedEx API
- Actualizar estado automáticamente

⏸️ **Bulk actions:**
- Marcar múltiples órdenes como "preparando" simultáneamente

---

### 12.3. Dependencias externas

**Librería de toasts:**
- Instalar `react-hot-toast` si no existe: `npm install react-hot-toast`
- Alternativa: Implementar toasts custom con Tailwind

**Librería de modales:**
- Opción 1: Headless UI (`@headlessui/react`)
- Opción 2: Custom modal con Tailwind
- **Recomendación:** Custom modal (más control, menos deps)

---

## 13. RESUMEN EJECUTIVO

**Objetivo:** Permitir al admin modificar estados de envío desde `/admin/envios`

**Acciones:** 4 acciones principales (preparando, enviado, editar tracking, entregado)

**Endpoints:** Reutilizar `PUT /api/orders/[id]/shipping` (ya existe)

**UI:** Agregar componente `EnviosActions.tsx` + modales

**Seguridad:** Auth admin + validaciones backend (ya existentes)

**Tests:** 6 unitarios + 10 integración + 6 manuales

**Duración:** ~4 días (5 subfases)

**Riesgo:** Bajo (reutilizamos API ya validada)

**Blocker:** Ninguno (prerequisito FASE 1B completado)

---

**FIN DE SCOPE ADMIN FASE 1C**

**Estado:** ⏸️ PENDIENTE APROBACIÓN Y AUTORIZACIÓN PARA IMPLEMENTAR
