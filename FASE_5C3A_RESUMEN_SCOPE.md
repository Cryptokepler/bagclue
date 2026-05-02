# FASE 5C.3A — RESUMEN DE SCOPE (Solo Lectura)
**Proyecto:** Bagclue  
**Fecha:** 2026-05-02  
**Estado:** PENDIENTE APROBACIÓN  

---

## OBJETIVO

Implementar "Mis Apartados" en el panel de cliente **en modo solo lectura** (sin pagos).

**Rutas:**
- `/account/layaways` — Lista de apartados
- `/account/layaways/[id]` — Detalle individual

---

## ALCANCE RESUMIDO

### Qué SÍ incluye ✅
- Ver lista de apartados (activos + historial)
- Ver detalle completo de apartado
- Ver cronograma de pagos (calendario)
- Ver historial de pagos realizados
- Filtrar por estado (tabs)
- Empty state si no hay apartados
- Navegación desde AccountLayout
- RLS seguro (solo sus apartados)

### Qué NO incluye ❌
- Pagar cuotas (sin Stripe Checkout)
- Crear apartados
- Cancelar apartados
- Modificar apartados
- Webhook de Stripe
- Cron jobs
- Notificaciones
- Admin de apartados

---

## ARCHIVOS PROPUESTOS

### CREAR (8 archivos)

**Pages (2):**
1. `src/app/account/layaways/page.tsx` — Lista
2. `src/app/account/layaways/[id]/page.tsx` — Detalle

**API Routes (2):**
3. `src/app/api/account/layaways/route.ts` — GET lista
4. `src/app/api/account/layaways/[id]/route.ts` — GET detalle

**Components (4):**
5. `src/components/account/layaway-card.tsx` — Card lista
6. `src/components/account/layaway-payment-row.tsx` — Fila cronograma
7. `src/components/account/layaway-empty-state.tsx` — Estado vacío
8. `src/components/account/layaway-policy-card.tsx` — Política

**Types (1):**
9. `src/types/layaway.ts` — Interfaces Layaway, LayawayPayment, LayawayStatus

**TOTAL:** 9 archivos nuevos

---

### MODIFICAR (1 archivo)

**Navegación:**
- `src/components/account/AccountLayout.tsx`
  - Agregar item "Mis Apartados" al sidebar
  - Solo agregar link, NO modificar lógica

**TOTAL:** 1 archivo modificado

---

### NO TOCAR (PROHIBIDO)

❌ **Stripe:**
- `/api/stripe/webhook`
- Cualquier archivo con "stripe"

❌ **Checkout:**
- `/api/checkout/*`
- `/checkout/*`

❌ **Admin:**
- `/admin/*`
- `/components/admin/*`

❌ **Database:**
- `migrations/*`
- No crear migraciones

❌ **Producto:**
- `/api/products/*` (salvo lectura)

❌ **Cron:**
- No crear cron jobs

---

## DATOS A MOSTRAR

### Lista (/account/layaways)
Por cada apartado:
- Foto + nombre producto
- Plan (4/8/18 pagos semanales)
- Total, pagado, saldo
- Progreso: X/Y pagos
- Próxima cuota + fecha
- Estado visual (activo, completado, vencido, cancelado)
- Botón "Ver detalle"

### Detalle (/account/layaways/[id])
- Info del apartado (producto, plan, montos)
- **Cronograma completo** (tabla de todas las cuotas)
- **Historial de pagos** (solo pagos completados)
- Política del apartado
- Contacto Bagclue

---

## SEGURIDAD

### RLS Policies (ya existen, solo verificar)
- `layaways`: SELECT solo si `user_id = auth.uid()`
- `layaway_payments`: SELECT solo si pertenece a layaway del usuario

### Backend
- Usar `supabase.auth.getUser()` para autenticar
- Filtrar queries por `user_id`
- Retornar 401 si no autenticado
- Retornar 403/404 si apartado no es suyo

---

## CRITERIOS DE CIERRE

### Backend ✅
- GET /api/account/layaways funciona
- GET /api/account/layaways/[id] funciona
- RLS filtra correctamente

### Frontend ✅
- /account/layaways carga lista
- Tabs activos/historial funcionan
- Empty state si no hay apartados
- /account/layaways/[id] muestra detalle
- Cronograma y historial visibles
- Estados visuales correctos

### Seguridad ✅
- Usuario solo ve sus apartados
- No puede acceder a apartado de otra clienta

### Compatibilidad ✅
- Login/logout funcionan
- /account/orders funciona
- Checkout de contado funciona
- Tracking público funciona
- Admin funciona

### No se tocó ✅
- Stripe — intacto
- Webhook — intacto
- Checkout — intacto
- Admin — intacto
- DB estructura — intacta

---

## RIESGOS IDENTIFICADOS

### Riesgo 1: RLS policies no existen
**Probabilidad:** Baja (ya se verificaron en Fase 5C.2)  
**Impacto:** Alto (exposición de datos)  
**Mitigación:** Verificar policies antes de implementar. Si no existen, reportar a Kepler (NO crear).

### Riesgo 2: Queries lentas
**Probabilidad:** Media (muchos joins)  
**Impacto:** Medio (UX lenta)  
**Mitigación:** Usar select específico, NO `*`. Limitar joins a lo necesario.

### Riesgo 3: Datos inconsistentes
**Probabilidad:** Baja  
**Impacto:** Medio (UI rota)  
**Mitigación:** Manejar casos donde `payments` esté vacío o `product` sea null.

### Riesgo 4: Responsive table
**Probabilidad:** Media  
**Impacto:** Bajo (UX mobile mala)  
**Mitigación:** Tabla debe hacer scroll horizontal o stack vertical en mobile.

### Riesgo 5: Empty states
**Probabilidad:** Alta (muchos usuarios sin apartados aún)  
**Impacto:** Bajo  
**Mitigación:** Empty state elegante y claro.

---

## VALIDACIONES MANUALES REQUERIDAS

### Pre-implementación
- [ ] Verificar RLS policies existen en Supabase
- [ ] Verificar estructura de `layaways` y `layaway_payments`
- [ ] Confirmar que `products` tiene `image_url`

### Post-implementación
- [ ] Build local exitoso (`npm run build`)
- [ ] Usuario autenticado puede ver lista
- [ ] Usuario sin apartados ve empty state
- [ ] Detalle muestra cronograma completo
- [ ] Usuario no puede ver apartado de otro
- [ ] Responsive (desktop + mobile)

---

## COMMITS ESPERADOS

**5-12 commits progresivos:**
1. Types
2. API routes (lista + detalle)
3. Pages (lista + detalle)
4. Components (4 componentes)
5. Navegación (AccountLayout)
6. Fixes responsive
7. Docs

**NO un solo commit gigante.**

---

## CONFIRMACIÓN — NO SE IMPLEMENTÓ NADA

✅ **CONFIRMADO:**
- NO se implementó código
- NO se crearon archivos
- NO se modificó DB
- NO se tocó Stripe
- NO se tocó webhook
- NO se tocó checkout
- NO se tocó admin
- NO se delegó a Codex

**Solo se creó:**
- CODEX_SCOPE_FASE_5C3A_MIS_APARTADOS_READONLY.md (scope completo)
- FASE_5C3A_RESUMEN_SCOPE.md (este documento)

---

## SIGUIENTE PASO

**Esperando aprobación de Jhonatan.**

**SI APROBADO:**
1. Kepler delega a Codex con scope aprobado
2. Codex implementa en branch `feat/fase-5c3a-mis-apartados-readonly`
3. Codex entrega con evidencia
4. Kepler valida en staging
5. Merge a main si PASS

**SI REQUIERE AJUSTES:**
1. Jhonatan indica cambios necesarios
2. Kepler ajusta scope
3. Re-aprobación
4. Luego delegación a Codex

---

**FIN DE RESUMEN — PENDIENTE APROBACIÓN**
