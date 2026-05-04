# ADMIN FASE 1C.2 — Marcar preparando (funcional)

**Estado:** CERRADA ✅  
**Fecha:** 2026-05-04  
**Commit:** 4834d40  
**URL:** https://bagclue.vercel.app/admin/envios  
**QA:** 14/14 tests PASS (validado por Jhonatan 12:27 UTC)

---

## Objetivo

Activar acción funcional "Marcar preparando" para pedidos en estado `pending_shipment` que tengan dirección confirmada y estén pagados.

---

## Alcance Implementado

### 1. Modal de Confirmación
**Archivo nuevo:** `src/components/admin/envios/MarcarPreparandoModal.tsx`

**Funcionalidad:**
- Muestra datos de la orden antes de confirmar:
  - **Pedido:** ID corto (últimos 8 caracteres, uppercase)
  - **Cliente:** Nombre completo
  - **Producto:** Producto principal (brand + title)
  - **Dirección confirmada:** Primeros 60 caracteres (truncado si es más largo)
- **Mensaje informativo:** "Esta acción marcará el pedido como preparando. Aún no se enviará ni se generará tracking."
- **Botones:**
  - "Cancelar" → cierra modal sin cambios
  - "Confirmar" → ejecuta llamada API
- **Estados:**
  - Loading spinner durante API call
  - Disabled buttons durante loading
- **Diseño:** Modal centrado, fondo oscuro semi-transparente

### 2. Activación del Botón
**Archivo modificado:** `src/components/admin/envios/EnviosActions.tsx`

**Cambios:**
- Importa `MarcarPreparandoModal`
- Agrega estados locales:
  - `showMarcarPreparandoModal` (boolean)
  - `loading` (boolean)
  - `error` (string | null)
- **Handler `handleMarcarPreparando`:**
  - Abre modal
  - Reset error state
- **Handler `handleConfirmMarcarPreparando`:**
  - Llama `PUT /api/orders/[id]/shipping` con payload `{ shipping_status: 'preparing' }`
  - Maneja loading state
  - Maneja errores (catch + display)
  - Si éxito:
    - Cierra modal
    - Llama `onActionComplete()` para refrescar datos
- **Renderizado condicional:**
  - Botón "Marcar preparando" solo visible si:
    - `shipping_status === 'pending'`
    - `shipping_address` existe (not null)
    - `payment_status === 'paid'` (verificado por backend)
  - Modal solo se renderiza si `showMarcarPreparandoModal === true`
  - Error message se muestra inline si existe

### 3. Comportamiento del Sistema

**Flujo completo:**
1. Admin navega a `/admin/envios`
2. Filtra o busca pedidos en "Pendiente envío" con dirección confirmada
3. Botón "Marcar preparando" es visible en columna "Acciones"
4. Click en botón → abre modal con datos del pedido
5. Admin revisa datos en modal
6. Click en "Confirmar" → API call
7. Backend valida (FASE 1A validations):
   - `payment_status === 'paid'`
   - `shipping_address !== null`
   - Actualiza `shipping_status` a `'preparing'`
8. Frontend:
   - Cierra modal
   - Refetch datos (`fetchOrders()` en página padre)
9. UI se actualiza:
   - Pedido ya no aparece en tab "Pendiente envío"
   - Pedido ahora aparece en tab "Preparando"
   - Stats actualizados (`pending_shipment` -1, `preparing` +1)
10. Cliente ve en `/account/orders/[id]`: "Preparando pieza"
11. Cliente ve en `/track/[token]`: estado "Preparando"

**Manejo de errores:**
- Si API responde 400/401/500 → error se muestra inline debajo de botones
- No hay cambio optimista (UI solo cambia tras éxito)
- Modal permanece abierto en caso de error (permite reintentar)

---

## Archivos Modificados

### Nuevos
- `src/components/admin/envios/MarcarPreparandoModal.tsx` (4KB)

### Modificados
- `src/components/admin/envios/EnviosActions.tsx` (+80 líneas, estado + handlers + modal)

**Total:** 2 archivos

---

## Build y Deploy

### Build Local
```bash
cd /home/node/.openclaw/workspace/bagclue
npm run build
```
**Resultado:** ✅ PASS (compiled successfully in 5.6s)

### Commit
```
feat(admin): SUBFASE 1C.2 - Marcar preparando funcional

- Created MarcarPreparandoModal component with order details
- Activated 'Marcar preparando' button for pending_shipment orders with address
- Integrated API call to PUT /api/orders/[id]/shipping
- Added error handling and loading states
- Refetch data on success to update UI and stats
```
**Hash:** 4834d40

### Deploy Vercel
```bash
npx vercel --prod --token [REDACTED] --yes
```
**Resultado:** ✅ PASS (deployed in 34s)  
**URL:** https://bagclue.vercel.app

---

## Impacto en Sistema

### Áreas Tocadas
- ✅ UI `/admin/envios` (botón "Marcar preparando" ahora funcional)
- ✅ Modal de confirmación (nuevo componente)
- ✅ Llamada a API existente `PUT /api/orders/[id]/shipping`
- ✅ Refetch de datos tras éxito

### Áreas NO Tocadas (confirmado)
- ❌ Backend (API routes) — reutilizado endpoint existente
- ❌ Checkout flow
- ❌ Stripe integration
- ❌ Webhooks
- ❌ Database schema
- ❌ RLS policies
- ❌ Products/Stock
- ❌ Customer panel
- ❌ Otras acciones dummy (marcar enviado, editar tracking, marcar entregado)

**Cero nuevos endpoints.** API existente validado en FASE 1A.

---

## Testing Completado (QA por Jhonatan, 2026-05-04 12:27 UTC)

**Criterios de validación (14 puntos):**

| # | Test | Esperado | Resultado |
|---|------|----------|-----------|
| 1 | Build PASS | Sin errores | ✅ PASS |
| 2 | Deploy production | URL activa | ✅ PASS |
| 3 | Identificar pedido en "Pendiente envío" con dirección | Botón visible | ✅ PASS |
| 4 | Botón "Marcar preparando" visible | Solo si pending + address + paid | ✅ PASS |
| 5 | Click abre modal | Modal muestra datos | ✅ PASS |
| 6 | Modal muestra cliente/producto/dirección | Datos correctos | ✅ PASS |
| 7 | Confirmar llama API | PUT /api/orders/[id]/shipping | ✅ PASS |
| 8 | Pedido cambia a "Preparando" | Tab y badge actualizados | ✅ PASS |
| 9 | Stats se actualizan | Pendiente envío -1, Preparando +1 | ✅ PASS |
| 10 | `/account/orders` del cliente refleja "Preparando pieza" | Badge correcto | ✅ PASS |
| 11 | `/account/orders/[id]` refleja "Preparando pieza" | Badge correcto | ✅ PASS |
| 12 | `/track/[token]` refleja estado preparando | Badge/mensaje correcto | ✅ PASS |
| 13 | No hay errores críticos en consola | Console limpio | ✅ PASS |
| 14 | No se tocó checkout/Stripe/webhook/DB/RLS/products/stock | Cero cambios | ✅ PASS |

**Resultado final:** 14/14 tests PASS ✅

**Instrucciones para QA (Jhonatan):**
1. Login admin: https://bagclue.vercel.app/admin/login
2. Ir a "Envíos"
3. Click en tab "Pendiente envío"
4. Buscar orden con badge verde "✅ Confirmada" en columna Dirección
5. Verificar que botón "Marcar preparando" es visible
6. Click en botón → validar que modal abre
7. Revisar datos en modal (ID, cliente, producto, dirección)
8. Click "Confirmar" → validar que modal cierra
9. Validar que pedido desaparece de "Pendiente envío"
10. Click en tab "Preparando" → validar que pedido aparece ahí
11. Validar stats actualizados en header
12. Abrir panel cliente (magic link o login) → validar estado en `/account/orders`
13. Abrir detalle de pedido → validar estado "Preparando pieza"
14. Abrir tracking público → validar estado refleja "Preparando"

---

## Próximos Pasos

**SUBFASE 1C.3 — Marcar enviado (NO AUTORIZADO)**

**Alcance propuesto:**
- Activar botón "Marcar enviado" (solo para órdenes en `preparing`)
- Modal de confirmación extendido:
  - Seleccionar paquetería (dropdown controlado: DHL, FedEx, UPS, Estafeta, Redpack, PaqueteExpress, Otro)
  - Ingresar número de tracking (input text)
  - Ingresar URL de tracking (input URL, opcional)
- Llamada a API `PUT /api/orders/[id]/shipping` con payload:
  ```json
  {
    "shipping_status": "shipped",
    "shipping_provider": "DHL",
    "tracking_number": "123456789",
    "tracking_url": "https://dhl.com/track/123456789"
  }
  ```
- Backend valida (FASE 1A):
  - `payment_status === 'paid'`
  - `shipping_address !== null`
  - `shipping_provider !== null`
  - `tracking_number !== null`
  - Actualiza `shipped_at` con timestamp actual
- Refetch tras éxito
- Pedido pasa de "Preparando" a "Enviado"

**Pendiente:** Autorización de Jhonatan para iniciar 1C.3

---

## Notas Técnicas

1. **Reutilización de endpoint:** No se creó nuevo endpoint. Se reutilizó `PUT /api/orders/[id]/shipping` validado en FASE 1A.
2. **No optimistic updates:** UI solo cambia tras confirmación del servidor. Evita estados inconsistentes.
3. **Error handling inline:** Errores se muestran debajo de los botones de acción sin toast/notificación global (más simple).
4. **Modal controlado por estado local:** Cada fila de la tabla maneja su propio estado de modal (escalable).
5. **Preservación de "Ver detalle":** Botón principal de navegación siempre visible (no reemplazado por acciones de estado).

---

## Lecciones de SUBFASE 1C.2

1. **Refetch simple es suficiente:** No se requiere optimistic update complejo cuando refetch es rápido (<1s).
2. **Estados locales en componente hijo:** Mantener estado de modal y loading en `EnviosActions` (no en página padre) simplifica lógica.
3. **Inline errors > Toast:** Para acciones en tabla, mostrar error inline es más claro que notificación flotante.
4. **Callback pattern escalable:** `onActionComplete` permite refetch sin acoplar componente hijo a lógica de fetch.

---

**ADMIN SUBFASE 1C.2: CERRADA ✅**  
**QA completada:** 14/14 tests PASS (2026-05-04 12:27 UTC)  
**Siguiente:** SUBFASE 1C.3 (awaiting authorization)
