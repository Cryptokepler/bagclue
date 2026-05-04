# BAGCLUE - Estado Operativo Actual

**Última actualización:** 2026-05-04  
**Proyecto:** E-commerce de lujo (bolsas, cinturones, zapatos, joyas)  
**Stack:** Next.js 16 + Supabase + Stripe + Vercel  
**Repo:** https://github.com/Cryptokepler/bagclue  
**Producción:** https://bagclue.vercel.app

---

## 1. Estado Actual del Proyecto

### Resumen Ejecutivo
Bagclue está en producción activa con ventas reales. Panel de cliente completado (Fase 5B). Funcionalidad de confirmación de dirección de envío implementada y desplegada (Fase 5C). Sistema de apartados operativo. Admin panel funcional.

### Qué Está Funcionando
- ✅ **Catálogo público** — productos visibles, filtrado, búsqueda
- ✅ **Checkout con Stripe** — pagos en test mode, sesión checkout funcional
- ✅ **Sistema de apartados (layaways)** — creación, pagos parciales, tracking
- ✅ **Panel de admin** — gestión productos, órdenes, envíos, tracking
- ✅ **Panel de cliente (Fase 5B)** — historial pedidos, detalle pedidos, RLS seguro
- ✅ **Confirmación dirección envío (Fase 5C)** — backend + UI desplegados
- ✅ **Tracking público** — órdenes rastreables vía token
- ✅ **Auth cliente** — magic link + Google OAuth
- ✅ **Gestión direcciones** — CRUD direcciones de envío guardadas

### Qué Está Pendiente
- ⏸️ **SUBFASE C validación completa** — funcionalidad confirmar/cambiar dirección (pendiente pruebas finales Jhonatan)
- 📋 **Panel cliente - Apartados** — sección "Mis Apartados" en /account/layaways (existe pero no verificado con datos reales)
- 📋 **Panel cliente - Perfil completo** — edición perfil, preferencias, soporte
- 📋 **Admin ERP Bagclue** — scope definido en ADMIN_ERP_BAGCLUE_SCOPE.md (próximo paso autorizado)

### Qué Está Bloqueado
- ❌ Ningún bloqueo técnico actual
- ⚠️ Deploy requiere validación local previa (política obligatoria)

---

## 2. Fases Cerradas

### Fase 5B — Panel de Cliente (✅ Cerrada 2026-05-01)
**Objetivo:** Historial de pedidos completo para clientes registrados  
**Resultado:**
- Customer auth (magic link + Google OAuth)
- Ruta /account/orders con lista completa
- Ruta /account/orders/[id] con detalle
- RLS policies seguras (usuarios solo ven sus órdenes)
- Fix crítico: checkout guarda user_id para vincular órdenes

**Commits:** 4 commits, 28 archivos modificados

---

### Fase 5C — Confirmar Dirección de Envío (✅ Implementada 2026-05-04, ⏸️ Validación Pendiente)

#### SUBFASE A — Backend (✅ Cerrada)
**Endpoint:** `PATCH /api/account/orders/[id]/shipping-address`  
**Validaciones:**
- Auth: token requerido, token válido
- Ownership: address pertenece a usuario, order pertenece a usuario
- Estado: order paid, order NO shipped/delivered
- Update seguro: SOLO `shipping_address` + `customer_phone`
- NO toca: `shipping_status`, `tracking_*`, `payment_status`, `status`, product, stock

**Commit:** 25f95a7

#### SUBFASE B — Badge en Lista (✅ Cerrada)
**Archivo:** `src/app/account/orders/page.tsx`  
**Funcionalidad:**
- Badge "⚠️ Dirección pendiente" (paid + sin dirección)
- Badge "✅ Dirección confirmada" (paid + con dirección)
- Posición: entre badge pago y badge envío

**Commit:** 68fa352

#### SUBFASE C — UI Confirmar/Cambiar (✅ Implementada, ⏸️ Validación Pendiente)
**Componente:** `src/components/customer/ShippingAddressSection.tsx` (331 líneas)  
**Integración:** `src/app/account/orders/[id]/page.tsx`  
**Funcionalidad:**
- Pedido no pagado → mensaje espera pago
- Pedido pagado sin dirección → selector + confirmar
- Pedido pagado con dirección (pending/preparing) → mostrar + botón cambiar
- Pedido shipped/delivered → solo lectura
- Sin direcciones guardadas → link a /account/addresses
- Llamada PATCH con Authorization Bearer
- Loading states, error handling, success feedback, auto-refresh

**Commit:** 7a26c91

**Validación pendiente:** Pruebas funcionales completas de flujo confirmación/cambio dirección

---

### Fix Crítico — Redirect Loop (✅ Corregido 2026-05-04)
**Problema:** `/account/orders/[id]` redirigía a `/account` en lugar de mostrar detalle  
**Causa:** Server component sin acceso a `localStorage` (Supabase implicit flow)  
**Solución:** Convertir a client component con auth check en `useEffect`  
**Commit:** d19e1d7  
**Validación:** ✅ PASS (confirmado por Jhonatan)

---

## 3. Cambios Recientes

### Últimos Cambios Aplicados (2026-05-04)
1. **Endpoint PATCH shipping-address** (backend)
2. **Badge dirección** en lista de pedidos (UI)
3. **Componente ShippingAddressSection** (UI confirmar/cambiar dirección)
4. **Fix redirect loop** (conversión a client component)

### Archivos/Sistemas Afectados
**Backend:**
- `src/app/api/account/orders/[id]/shipping-address/route.ts` (nuevo)

**Frontend:**
- `src/app/account/orders/page.tsx` (modificado - badge)
- `src/app/account/orders/[id]/page.tsx` (modificado - client component + integración)
- `src/components/customer/ShippingAddressSection.tsx` (nuevo)

**Base de datos:**
- Sin cambios en schema
- Sin cambios en RLS policies
- Sin migraciones nuevas

**NO tocados:**
- Checkout, Stripe, Webhook, Admin, Products, Stock, Payment logic

### Impacto Funcional
- ✅ Clientes pueden confirmar dirección de envío desde detalle de pedido
- ✅ Clientes pueden cambiar dirección antes de envío
- ✅ Badge visual en lista de pedidos indica estado dirección
- ✅ Detalle de pedido abre correctamente (fix redirect loop)

---

## 4. Reglas Operativas

### Cómo Se Debe Trabajar en Bagclue

#### Regla 1: Build Local Obligatorio
Antes de deploy a Vercel:
```bash
npm run build
```
- ✅ Debe pasar sin errores
- ✅ Revisar warnings relevantes
- ✅ Confirmar estructura de rutas válida
- ✅ Confirmar que no hay archivos obsoletos

**Queda prohibido desplegar sin build local exitoso.**

#### Regla 2: Git Primero
- Todo cambio relevante debe quedar en Git
- Commit con mensaje descriptivo antes de deploy
- Push a GitHub antes de deploy a Vercel
- Git author estándar: `KeplerAgents <info@kepleragents.com>`

#### Regla 3: Pre-Check Antes de Modificar
Antes de tocar cualquier archivo:
1. ¿Este cambio afecta checkout/Stripe/webhook/admin?
2. ¿El repo local está sincronizado?
3. ¿Hay cambios dirty sin commit?
4. ¿El trabajo conviene hacerlo directamente o delegarlo a Codex?
5. ¿El resultado final quedará correctamente versionado?

#### Regla 4: Deploy a Vercel
```bash
npx vercel --prod --token <VERCEL_TOKEN> --yes
```
- Token en `contraseñas/vercel_token_nuevo.md`
- Deploy solo después de build local PASS
- Deploy solo después de commit + push

#### Regla 5: Un Solo Intento con Diagnóstico
Si un deploy falla:
- NO reintentar en ráfaga
- Leer el error real primero
- Identificar causa probable
- Aplicar fix
- Hacer un solo nuevo intento

**Queda prohibido lanzar múltiples deploys seguidos sin diagnóstico.**

#### Regla 6: Control de Cambios de Sub-Agents/Codex
Si el código fue generado por sub-agent, Codex o herramienta externa:
- Kepler debe revisar estructura, archivos creados, rutas, imports antes de push/deploy
- NO asumir que el output está listo para producción sin revisión

---

## 5. Reglas de Seguridad

### Qué No Hacer
❌ **NUNCA modificar sin autorización explícita:**
- Checkout (`/api/checkout/*`, `/checkout/*`)
- Stripe (`/api/stripe/webhook`, configuración Stripe)
- Webhook (`/api/stripe/webhook`)
- Admin (`/admin/*`, `/api/admin/*`)
- DB schema (`supabase/migrations/*`)
- RLS policies (Supabase)
- Products/Stock (a menos que sea parte del scope autorizado)
- Payment logic (flujo de pagos)

❌ **NUNCA deployar cambios sin:**
- Build local exitoso
- Commit + push a GitHub
- Revisión de archivos modificados
- Confirmación de que no tocaste áreas prohibidas

❌ **NUNCA subir al repo:**
- Secretos, tokens, API keys
- Logs, backups, dumps
- `node_modules/`
- Archivos temporales
- Datos sensibles de clientes

### Manejo de Credenciales
- ✅ Credenciales en `contraseñas/` (fuera del repo)
- ✅ Variables de entorno en `.env.local` (local) y Vercel env vars (producción)
- ✅ Antes de decir "no tengo acceso", revisar `contraseñas/` y VPS
- ✅ Tokens NO se imprimen en logs ni console.log

### Validaciones Antes de Tocar Producción
1. Build local PASS
2. Commit + push a GitHub
3. Verificar que solo modificaste archivos autorizados
4. Verificar que no tocaste checkout/Stripe/webhook/admin/DB
5. Deploy a Vercel
6. Verificar deploy exitoso en Vercel dashboard
7. Prueba básica en producción

### Separación de Contextos
- **Bagclue** es un proyecto cliente de Jhonatan
- **NO mezclar** con KeplerAgents (SaaS propio)
- **NO mezclar** con USDTCAPITAL (operaciones crypto)
- Credenciales separadas, repos separados, deploys separados

---

## 6. Incidencias Abiertas

### Bugs Actuales
- ❌ Ningún bug crítico conocido

### Riesgos Conocidos
- ⚠️ **Stripe en test mode** — pendiente migración a live mode cuando Jhonatan autorice
- ⚠️ **Auth con Supabase implicit flow** — tokens en localStorage, requiere client components en todas las rutas `/account/*`
  - **Verificado:** todas las rutas `/account` ya son client components
  - **Lección aprendida:** server components NO tienen acceso a localStorage

### Qué Falta Validar
- ⏸️ **SUBFASE C validación funcional completa** — Jhonatan debe probar:
  1. Pedido sin dirección muestra "Confirma tu dirección de envío"
  2. Pedido con dirección muestra "Dirección confirmada"
  3. Pedido pending/preparing permite cambiar dirección
  4. Pedido shipped/delivered no permite cambiar dirección
  5. Si no hay direcciones, muestra link a /account/addresses
  6. Confirmar dirección llama endpoint y actualiza shipping_address
  7. Después de confirmar, detalle muestra la nueva dirección
  8. /account/orders sigue mostrando badge actualizado
  9. No hay errores críticos en consola

---

## 7. Próximo Paso Obligatorio

### ADMIN_ERP_BAGCLUE_SCOPE.md

**Por qué es el siguiente paso:**
1. **Fase 5 (panel cliente) está completada** — solo falta validación final
2. **Jhonatan ha mencionado Admin ERP** en sesiones anteriores como prioridad
3. **Admin actual es funcional pero básico** — falta:
   - Gestión avanzada de inventario
   - Reportes de ventas
   - Análisis de clientes
   - Gestión de proveedores
   - Control de costos y márgenes
   - Dashboard analítico

**Criterio de arranque:**
1. **Esperar aprobación formal de Jhonatan** — NO avanzar hasta que diga explícitamente "arranca con Admin ERP"
2. **Leer ADMIN_ERP_BAGCLUE_SCOPE.md** (si existe) o crear scope con Jhonatan
3. **Definir alcance mínimo viable** — qué es imprescindible vs qué es nice-to-have
4. **Validar que Fase 5C está 100% cerrada** antes de arrancar nueva fase

**Acciones previas al arranque:**
1. Confirmar con Jhonatan que SUBFASE C está completamente validada
2. Crear o actualizar `ADMIN_ERP_BAGCLUE_SCOPE.md` con scope detallado
3. Revisar admin actual en `/admin/*` para entender estado base
4. Definir si se requiere:
   - Nuevas migraciones DB
   - Nuevos endpoints API
   - Nuevas tablas o relaciones
   - Integraciones externas (ERP, contabilidad, etc.)

**NO arrancar Admin ERP hasta:**
- ✅ Aprobación explícita de Jhonatan
- ✅ Scope documentado en ADMIN_ERP_BAGCLUE_SCOPE.md
- ✅ SUBFASE C 100% validada y cerrada

---

## 8. Contexto Mínimo para Retomar

### Documentos que Leer Primero
**Obligatorios:**
1. `BAGCLUE_CURRENT_STATE.md` (este archivo)
2. `SUBFASE_C_ENTREGA.md` — entrega completa de Fase 5C
3. `FIX_REDIRECT_LOOP.md` — fix crítico server/client components
4. `contraseñas/supabase_bagclue.md` — credenciales Supabase
5. `contraseñas/vercel_token_nuevo.md` — token deploy Vercel

**Recomendados:**
- `SUBFASE_A_ENTREGA_FINAL.md` — backend confirmar dirección
- `SUBFASE_B_ENTREGA.md` — badge dirección en lista
- `TEST_SUBFASE_A.md` — datos de test

**Si vas a trabajar en Admin:**
- `ADMIN_ERP_BAGCLUE_SCOPE.md` (cuando exista)
- Revisar `/src/app/admin/*` para entender estado actual

### Decisiones Vigentes Que No Deben Olvidarse

#### Arquitectura
- **Next.js 16** con Turbopack
- **Supabase** en modo implicit flow (tokens en localStorage)
- **Todas las rutas `/account/*` DEBEN ser client components** ('use client')
- **RLS policies** protegen datos en Supabase
- **Stripe test mode** (no migrar a live sin autorización Jhonatan)

#### Autenticación
- Magic link + Google OAuth para clientes
- Iron session para admin
- RLS en Supabase filtra por `user_id`
- Service role solo en API routes del servidor

#### Deploy
- Git author estándar: `KeplerAgents <info@kepleragents.com>`
- Build local obligatorio antes de deploy
- Deploy vía `npx vercel --prod --token ... --yes`
- NO usar Vercel Git integration (está roto)

#### Base de Datos
- **NO hacer migraciones sin autorización**
- **NO modificar RLS policies sin autorización**
- Migraciones en `supabase/migrations/`
- Última migración: `017_orders_rls_customer.sql`

#### Áreas Prohibidas (sin autorización explícita)
- Checkout
- Stripe webhook
- Payment logic
- Admin (hasta que se autorice Admin ERP)
- DB schema/RLS
- Products/Stock (fuera de scope autorizado)

#### Políticas de Código
- Git primero (todo versionado)
- Build local antes de deploy
- Un solo intento con diagnóstico
- Revisar output de sub-agents/Codex antes de push
- NO subir secretos/tokens/logs/node_modules

---

## Estado de Validación

| Componente | Estado | Validado Por | Fecha |
|------------|--------|--------------|-------|
| Checkout | ✅ Funcional | Jhonatan | 2026-05-01 |
| Panel Cliente Fase 5B | ✅ Cerrado | Jhonatan | 2026-05-01 |
| SUBFASE A (Backend) | ✅ Cerrado | Jhonatan | 2026-05-04 |
| SUBFASE B (Badge) | ✅ Cerrado | Jhonatan | 2026-05-04 |
| SUBFASE C (UI) | ⏸️ Validación Pendiente | Jhonatan | 2026-05-04 |
| Fix Redirect Loop | ✅ Validado | Jhonatan | 2026-05-04 |

---

## Notas Finales

**Este documento debe actualizarse:**
- Después de cada fase cerrada
- Después de cada cambio importante
- Después de cada incidente crítico
- Al menos 1 vez por semana si hay trabajo activo

**Última sesión:**
- Fecha: 2026-05-04
- Trabajo realizado: SUBFASE C completa + fix redirect loop
- Próxima acción: Aguardar validación completa SUBFASE C → aprobar Admin ERP

**Contacto cliente:**
- Jhonatan Venegas
- Telegram: @USDTCAPITA (id:1622210119)
- Teléfonos: +34722385452, +34638040614
- Email: jhonatanvenegas@usdtcapital.es
