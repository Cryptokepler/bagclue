# ADMIN FASE 1C.5 — MINI SCOPE
## Simplificar pipeline visual de envíos

**Fecha:** 2026-05-04 18:20 UTC  
**Estado:** PENDIENTE APROBACIÓN  
**NO IMPLEMENTAR hasta aprobación explícita**

---

## 1. ARCHIVOS QUE TOCARÍA

### Archivos principales
- `src/components/admin/envios/EnviosTable.tsx` (modificar columna Acciones)
- `src/components/admin/envios/EnviosActions.tsx` (ya existe, agregar lógica de texto "Próximo paso")

### Archivos que NO tocaré
- ✅ Backend `/api/admin/envios` (sin cambios)
- ✅ Backend `/api/orders/[id]/shipping` (sin cambios)
- ✅ Modales (MarcarPreparandoModal, MarcarEnviadoModal, MarcarEntregadoModal) - sin cambios
- ✅ Base de datos, schema, RLS
- ✅ Checkout, Stripe, webhook
- ✅ Panel cliente
- ✅ Products/stock
- ✅ Componentes: EnviosStats, EnviosTabs, EnviosSearchBar, EnviosPagination

---

## 2. CÓMO SE VERÁ LA NUEVA COLUMNA "PRÓXIMO PASO"

### Diseño propuesto

**Cambiar header de columna:**
```
Antes: "Acciones"
Ahora: "Próximo paso"
```

**Contenido de celda (ejemplo visual):**

```
┌─────────────────────────────────────┐
│ Esperar dirección de la clienta     │ ← Texto explicativo (gris oscuro)
│ ┌─────────────┐  ┌───────────────┐ │
│ │ Ver pedido  │  │ ... (más)     │ │ ← Botones de acción
│ └─────────────┘  └───────────────┘ │
└─────────────────────────────────────┘
```

**Estructura interna:**
```tsx
<div className="flex flex-col gap-2">
  {/* Texto "Próximo paso" */}
  <div className="text-xs text-gray-700 font-medium">
    {getNextStepText(order)}
  </div>
  
  {/* Botones de acción */}
  <div className="flex gap-2">
    {/* Acción principal (si existe) */}
    {primaryAction && (
      <button className="bg-blue-600 text-white px-3 py-1.5 text-xs">
        {primaryAction}
      </button>
    )}
    
    {/* Ver detalle (siempre) */}
    <button className="border border-gray-300 text-gray-700 px-3 py-1.5 text-xs">
      Ver detalle
    </button>
    
    {/* Acciones secundarias (dropdown si hay más de 1) */}
    {secondaryActions.length > 0 && (
      <button className="border border-gray-300 text-gray-500 px-2 py-1.5 text-xs">
        ⋮
      </button>
    )}
  </div>
</div>
```

---

## 3. QUÉ ACCIONES QUEDARÍAN POR ESTADO

### Pipeline completo

#### Estado 1: Pago pendiente
```
payment_status != 'paid'
```
**Próximo paso:** "Esperando pago"  
**Acción principal:** Ninguna  
**Acción secundaria:** Ver detalle  
**Badges:** Pago Pendiente

---

#### Estado 2: Pagado sin dirección
```
payment_status = 'paid'
shipping_address IS NULL
```
**Próximo paso:** "Esperar dirección de la clienta"  
**Acción principal:** Ninguna (cliente debe confirmar)  
**Acción secundaria:** Ver pedido (para revisar o contactar)  
**Badges:** Pagado, Dirección Pendiente

**Nota:** Admin NO puede hacer nada aquí, debe esperar a que cliente confirme dirección.

---

#### Estado 3: Pagado con dirección, listo para preparar
```
payment_status = 'paid'
shipping_address IS NOT NULL
shipping_status IN ('pending', NULL)
```
**Próximo paso:** "Preparar paquete"  
**Acción principal:** **[Marcar preparando]** (botón azul)  
**Acción secundaria:** Ver detalle  
**Badges:** Pagado, Dirección Confirmada, Envío Pendiente

---

#### Estado 4: Preparando
```
shipping_status = 'preparing'
```
**Próximo paso:** "Cargar guía DHL/FedEx"  
**Acción principal:** **[Marcar enviado]** (botón azul)  
**Acción secundaria:** Ver detalle  
**Badges:** Pagado, Dirección Confirmada, Preparando

---

#### Estado 5: Enviado
```
shipping_status = 'shipped'
```
**Próximo paso:** "Esperar entrega"  
**Acción principal:** **[Marcar entregado]** (botón azul)  
**Acciones secundarias:**
- Ver detalle
- ⋮ Más (dropdown):
  - Editar tracking

**Badges:** Pagado, Dirección Confirmada, Enviado

---

#### Estado 6: Entregado
```
shipping_status = 'delivered'
```
**Próximo paso:** "Completado ✅"  
**Acción principal:** Ninguna  
**Acción secundaria:** Ver detalle  
**Badges:** Pagado, Dirección Confirmada, Entregado

---

## 4. LÓGICA DE TEXTO "PRÓXIMO PASO"

### Función propuesta

```typescript
function getNextStepText(order: EnviosOrder): string {
  // 1. Pago pendiente
  if (order.payment_status !== 'paid') {
    return 'Esperando pago'
  }
  
  // 2. Sin dirección
  if (!order.shipping_address) {
    return 'Esperar dirección de la clienta'
  }
  
  // 3. Listo para preparar
  if (!order.shipping_status || order.shipping_status === 'pending') {
    return 'Preparar paquete'
  }
  
  // 4. Preparando
  if (order.shipping_status === 'preparing') {
    return 'Cargar guía DHL/FedEx'
  }
  
  // 5. Enviado
  if (order.shipping_status === 'shipped') {
    return 'Esperar entrega'
  }
  
  // 6. Entregado
  if (order.shipping_status === 'delivered') {
    return 'Completado ✅'
  }
  
  return 'Ver detalle'
}
```

---

## 5. LÓGICA DE ACCIONES POR ESTADO

### Función propuesta

```typescript
function getActionsForOrder(order: EnviosOrder): {
  primaryAction: 'preparar' | 'enviar' | 'entregar' | null
  secondaryActions: Array<'ver_detalle' | 'editar_tracking'>
} {
  const actions = {
    primaryAction: null as 'preparar' | 'enviar' | 'entregar' | null,
    secondaryActions: ['ver_detalle'] as Array<'ver_detalle' | 'editar_tracking'>
  }
  
  // Pago pendiente
  if (order.payment_status !== 'paid') {
    return actions // Solo ver detalle
  }
  
  // Sin dirección
  if (!order.shipping_address) {
    return actions // Solo ver detalle
  }
  
  // Listo para preparar
  if (!order.shipping_status || order.shipping_status === 'pending') {
    actions.primaryAction = 'preparar'
    return actions
  }
  
  // Preparando
  if (order.shipping_status === 'preparing') {
    actions.primaryAction = 'enviar'
    return actions
  }
  
  // Enviado
  if (order.shipping_status === 'shipped') {
    actions.primaryAction = 'entregar'
    actions.secondaryActions.push('editar_tracking')
    return actions
  }
  
  // Entregado
  if (order.shipping_status === 'delivered') {
    return actions // Solo ver detalle
  }
  
  return actions
}
```

---

## 6. DISEÑO RESPONSIVE

### Desktop (ancho normal)

```
┌──────┬────────┬─────────┬───────┬──────┬──────────┬────────┬──────────┬────────────────────────┐
│Fecha │Cliente │Producto │Total  │Pago  │Dirección │Envío   │Tracking  │Próximo paso            │
├──────┼────────┼─────────┼───────┼──────┼──────────┼────────┼──────────┼────────────────────────┤
│12/05 │Ana Glez│Chanel 25│$189k  │Pagado│Confirmada│Pendiente│—         │Preparar paquete        │
│13:45 │ana@... │         │MXN    │      │✅        │        │          │[Marcar preparando]     │
│      │555...  │         │       │      │          │        │          │[Ver detalle]           │
└──────┴────────┴─────────┴───────┴──────┴──────────┴────────┴──────────┴────────────────────────┘
```

### Mobile (consideraciones)

- Columna "Próximo paso" puede ser la única visible junto con Cliente
- Resto de columnas colapsables o en vista expandida
- No romper layout (scroll horizontal si es necesario)

**Prioridad:** Desktop primero, mobile funcional pero no tiene que ser perfecto en esta fase.

---

## 7. CAMBIOS EN EnviosActions.tsx

### Modificación propuesta

**Agregar al componente:**
```tsx
// Determinar próximo paso
const nextStepText = getNextStepText(order)
const { primaryAction, secondaryActions } = getActionsForOrder(order)
```

**Render propuesto:**
```tsx
return (
  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
    {/* Texto próximo paso */}
    <div className="text-xs text-gray-700 font-medium">
      {nextStepText}
    </div>
    
    {/* Acciones */}
    <div className="flex gap-2 flex-wrap">
      {/* Acción principal */}
      {primaryAction === 'preparar' && (
        <button
          onClick={handleMarcarPreparando}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Marcar preparando
        </button>
      )}
      
      {primaryAction === 'enviar' && (
        <button
          onClick={handleMarcarEnviado}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Marcar enviado
        </button>
      )}
      
      {primaryAction === 'entregar' && (
        <button
          onClick={handleMarcarEntregado}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Marcar entregado
        </button>
      )}
      
      {/* Ver detalle (siempre) */}
      <button
        onClick={() => router.push(`/admin/orders/${order.id}`)}
        className="border border-gray-300 text-gray-700 px-3 py-1.5 text-xs rounded hover:bg-gray-50"
      >
        Ver detalle
      </button>
      
      {/* Más acciones (si hay secundarias) */}
      {secondaryActions.includes('editar_tracking') && (
        <button
          className="border border-gray-300 text-gray-500 px-2 py-1.5 text-xs rounded hover:bg-gray-50"
          title="Más acciones"
        >
          ⋮
        </button>
      )}
    </div>
    
    {/* Error inline */}
    {error && (
      <div className="text-xs text-red-600">
        {error}
      </div>
    )}
  </div>
)
```

---

## 8. CAMBIOS EN EnviosTable.tsx

### Header de columna

**Cambiar:**
```tsx
<th className="...">Acciones</th>
```

**Por:**
```tsx
<th className="...">Próximo paso</th>
```

### Celda de tabla

**Mantener:**
```tsx
<td className="px-4 py-4 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
  <EnviosActions order={order} onActionComplete={onActionComplete} />
</td>
```

**Nota:** El cambio visual ocurre dentro de `EnviosActions.tsx`, la tabla solo cambia el header.

---

## 9. QUÉ NO TOCARÉ

### Backend
- ✅ `/api/admin/envios` (sin cambios)
- ✅ `/api/orders/[id]/shipping` (sin cambios)
- ✅ Base de datos, schema, RLS

### Checkout y pagos
- ✅ Stripe config
- ✅ Webhook
- ✅ `/api/checkout/*`
- ✅ `/checkout/success`

### Panel cliente
- ✅ `/account/*` (sin cambios)
- ✅ Customer experience

### Productos
- ✅ Products/stock (sin cambios)
- ✅ `/admin/productos` (sin cambios)

### Otros componentes admin/envios
- ✅ EnviosStats (sin cambios)
- ✅ EnviosTabs (sin cambios)
- ✅ EnviosSearchBar (sin cambios)
- ✅ EnviosPagination (sin cambios)

### Modales existentes
- ✅ MarcarPreparandoModal (sin cambios de lógica)
- ✅ MarcarEnviadoModal (sin cambios de lógica)
- ✅ MarcarEntregadoModal (sin cambios de lógica)

**Nota:** Los modales ya existen y funcionan. Solo cambio CUÁNDO se muestran los botones que los abren.

---

## 10. CRITERIOS DE CIERRE

### Testing funcional

**1. Texto "Próximo paso" correcto por estado:**
- ⏳ Pago pendiente → "Esperando pago"
- ⏳ Sin dirección → "Esperar dirección de la clienta"
- ⏳ Listo para preparar → "Preparar paquete"
- ⏳ Preparando → "Cargar guía DHL/FedEx"
- ⏳ Enviado → "Esperar entrega"
- ⏳ Entregado → "Completado ✅"

**2. Acción principal visible según estado:**
- ⏳ Listo para preparar → botón "Marcar preparando" azul prominente
- ⏳ Preparando → botón "Marcar enviado" azul prominente
- ⏳ Enviado → botón "Marcar entregado" azul prominente
- ⏳ Otros estados → sin botón azul prominente

**3. "Ver detalle" siempre visible:**
- ⏳ Presente en todos los estados
- ⏳ Estilo secundario (borde gris)
- ⏳ No compite con acción principal

**4. Acciones secundarias (dropdown) funcional:**
- ⏳ Enviado → dropdown "⋮" con opción "Editar tracking"
- ⏳ Dropdown solo aparece cuando hay acciones secundarias

**5. Modales siguen funcionando:**
- ⏳ Click "Marcar preparando" → abre MarcarPreparandoModal
- ⏳ Click "Marcar enviado" → abre MarcarEnviadoModal
- ⏳ Click "Marcar entregado" → abre MarcarEntregadoModal
- ⏳ Confirmación en modal → actualiza estado → refetch → texto "Próximo paso" cambia

### Testing visual

**6. Diseño limpio:**
- ⏳ Columna "Próximo paso" no saturada de botones
- ⏳ Acción principal claramente diferenciada (azul)
- ⏳ Texto legible (tamaño y color adecuados)
- ⏳ Botones no se solapan

**7. Responsive desktop:**
- ⏳ Tabla se ve bien en pantallas 1280px+
- ⏳ Columna "Próximo paso" no rompe layout
- ⏳ Botones visibles sin scroll horizontal excesivo

**8. Responsive mobile (funcional):**
- ⏳ Tabla con scroll horizontal si es necesario
- ⏳ No rompe layout en móvil (aunque no sea perfecto)

### Testing de integración

**9. No se rompió nada existente:**
- ⏳ Tabs (All/Pending/Preparing/Shipped/Delivered) funcionan
- ⏳ Search funciona
- ⏳ Pagination funciona
- ⏳ Stats se actualizan correctamente
- ⏳ Click en fila → navega a detalle del pedido
- ⏳ Backend responde igual
- ⏳ Modales confirman y refrescan datos

**10. Áreas NO tocadas siguen funcionando:**
- ⏳ Checkout flow
- ⏳ Panel cliente
- ⏳ Productos
- ⏳ Admin otros módulos

---

## 11. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 1-2 horas  
**Riesgo:** Bajo (solo cambios UI, backend sin tocar)

**Archivos modificados:** 2
- EnviosActions.tsx (~100 líneas nuevas/modificadas)
- EnviosTable.tsx (~5 líneas modificadas)

---

## 12. PRÓXIMOS PASOS

**Esperando aprobación de Jhonatan para:**
1. ✅ Confirmar que la propuesta de columna "Próximo paso" es correcta
2. ✅ Confirmar que los textos por estado son claros
3. ✅ Confirmar que la jerarquía visual (acción principal azul + secundarias grises) funciona
4. ✅ Confirmar que NO tocar backend/checkout/cliente está OK
5. ✅ Autorizar implementación

**Una vez aprobado:**
- Implementar cambios en EnviosActions.tsx y EnviosTable.tsx
- Build PASS
- Deploy production
- Testing manual con Jhonatan
- Cerrar FASE 1C.5

---

## 13. PREGUNTAS ABIERTAS

### Pregunta 1: Dropdown "Más acciones"
**Propuesta:** Cuando hay acciones secundarias (ej: Editar tracking en estado "Enviado"), mostrar botón "⋮" que abre dropdown.

**¿Apruebas o prefieres otro approach?**

### Pregunta 2: Estados sin acción principal
En estados como "Esperando pago" o "Esperar dirección", NO hay acción principal para el admin.

**¿Está OK que solo diga el texto + botón "Ver detalle"?**

### Pregunta 3: Mobile
**¿Priorizar desktop y dejar mobile funcional (con scroll) está OK?**

---

**SCOPE PENDIENTE APROBACIÓN**  
**NO IMPLEMENTAR HASTA AUTORIZACIÓN EXPLÍCITA DE JHONATAN**
