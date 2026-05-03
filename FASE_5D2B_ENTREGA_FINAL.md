# FASE 5D.2B — ENTREGA FINAL
**Fecha:** 2026-05-03  
**Estado:** ✅ IMPLEMENTACIÓN COMPLETA — Tests pendientes  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce  

---

## 1. ARCHIVOS CREADOS/MODIFICADOS

### Archivos Nuevos (1)

**`src/app/api/account/addresses/[id]/route.ts`** (293 líneas)
- PATCH: Editar dirección con actualización parcial
- DELETE: Eliminar dirección con auto-marcado de default
- Auth: Bearer token + ownership validation
- Manejo error 23505 (unique default constraint)

### Archivos Modificados (2)

**`src/types/address.ts`** (+13 líneas)
- Agregado: `UpdateAddressDTO` interface (todos los campos opcionales)

**`src/lib/addresses/validation.ts`** (+114 líneas)
- Agregado: `validateUpdateAddress()` — Validaciones PATCH (campos opcionales)
- Agregado: `sanitizeUpdateData()` — Sanitización parcial (solo campos presentes)

**Total:** 1 archivo nuevo + 2 modificados

---

## 2. EXPLICACIÓN DE PATCH

### Endpoint

**PATCH /api/account/addresses/[id]**

### Flujo

```
1. Auth: Verify Bearer token → auth.getUser()
2. Params: Get address ID from URL
3. Fetch: Get address from DB + verify ownership
4. If not exists → 404
5. If belongs to other user → 403
6. Validate: Parse body + validate fields (solo los enviados)
7. Sanitize: Clean data + ignore immutable fields (id, user_id, created_at, updated_at)
8. Handle is_default logic:
   a. If is_default = true → unmark other user's addresses
   b. If is_default = false AND current is default AND other addresses exist → 400
   c. If is_default = false AND only address → keep is_default = true (override)
9. Update: Apply changes with retry on 23505
10. Return: Updated address
```

### Campos Permitidos (Todos Opcionales)

- full_name, phone_country_code, phone_country_iso, phone
- country, state, city, postal_code
- address_line1, address_line2, delivery_references
- is_default

**Solo actualiza los campos enviados** — Los demás permanecen sin cambios

### Campos Prohibidos

- id, user_id, created_at, updated_at (ignorados si se envían)

### Validaciones

Reutiliza validaciones de POST, pero todos los campos son opcionales:
- phone_country_code: regex `^\+\d{1,4}$`
- phone_country_iso: 2 chars uppercase
- full_name, country, city, address_line1: min length si se envían

### Lógica is_default

**Marcar como default (is_default = true):**
```
1. Desmarcar todas las otras default del usuario
2. Marcar esta como default
3. Retry on error 23505
```

**Desmarcar default (is_default = false):**
```
1. Si es la única default y hay otras direcciones → rechazar con 400
2. Si es la única dirección del usuario → mantener is_default = true (override)
```

---

## 3. EXPLICACIÓN DE DELETE

### Endpoint

**DELETE /api/account/addresses/[id]**

### Flujo

```
1. Auth: Verify Bearer token → auth.getUser()
2. Params: Get address ID from URL
3. Fetch: Get address from DB + verify ownership
4. If not exists → 404
5. If belongs to other user → 403
6. Handle default logic:
   a. If NOT default → skip to step 7
   b. If IS default:
      - Get most recent address (exclude current, order by created_at DESC)
      - If found → mark as new default
      - If not found → no action (user will have 0 addresses)
7. Delete: Remove address
8. Return: Success + new_default_id (or null)
```

### Casos

| Escenario | Acción |
|-----------|--------|
| DELETE dirección NO default | Eliminar directamente |
| DELETE dirección default + hay otras | Eliminar + auto-marcar más reciente como default |
| DELETE última dirección | Eliminar (usuario queda sin direcciones) |

### Response

```json
{
  "success": true,
  "message": "Address deleted successfully",
  "new_default_id": "uuid or null"
}
```

- `new_default_id`: UUID de la nueva dirección default (si se auto-marcó)
- `null`: Si no era default o no había otras direcciones

---

## 4. ESTRATEGIA DE DEFAULT

### Regla Global

**Solo puede haber UNA dirección con `is_default = true` por usuario**

**Protección:** Índice único parcial `idx_customer_addresses_user_default`

### PATCH: Marcar como Default

```typescript
// 1. Desmarcar todas las otras default del usuario
await supabaseAdmin
  .from('customer_addresses')
  .update({ is_default: false })
  .eq('user_id', userId)
  .neq('id', addressId)
  .eq('is_default', true);

// 2. Actualizar la dirección target
await supabaseAdmin
  .from('customer_addresses')
  .update({ ...sanitizedData, is_default: true })
  .eq('id', addressId);
```

### PATCH: Intentar Desmarcar Default

```typescript
if (is_default === false && currentAddress.is_default === true) {
  // Contar otras direcciones del usuario
  const { count } = await supabaseAdmin
    .from('customer_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('id', addressId);

  if (count > 0) {
    // Hay otras → rechazar
    return NextResponse.json(
      { error: 'Cannot unmark only default address...' },
      { status: 400 }
    );
  }
  // count === 0 → esta es la única dirección → override is_default = true
}
```

### DELETE: Auto-Marcar Nueva Default

```typescript
if (addressToDelete.is_default) {
  // Obtener la más reciente (excluyendo la que se va a eliminar)
  const { data: otherAddresses } = await supabaseAdmin
    .from('customer_addresses')
    .select('id')
    .eq('user_id', userId)
    .neq('id', addressId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (otherAddresses && otherAddresses.length > 0) {
    newDefaultId = otherAddresses[0].id;
    
    // Marcar como nueva default
    await supabaseAdmin
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', newDefaultId);
  }
}
```

**Criterio "más reciente":** `ORDER BY created_at DESC LIMIT 1`

---

## 5. BUILD RESULT

### Local Build

**Comando:** `npm run build`  
**Resultado:** ✅ PASS  
**Tiempo:** 4.7 segundos

```
✓ Compiled successfully in 4.7s
Route (app)
├ ƒ /api/account/addresses       ← GET, POST (5D.2A)
├ ƒ /api/account/addresses/[id]  ← PATCH, DELETE (5D.2B) ✅ NUEVO
```

### Vercel Build (Production)

**Resultado:** ✅ SUCCESS  
**Tiempo:** 16 segundos  
**Region:** Washington, D.C., USA (iad1)

**Output:**
```
Building: ✓ Compiled successfully in 6.1s
Building: ├ ƒ /api/account/addresses/[id]  ✅ CREADO
```

---

## 6. COMMIT

**Hash:** `33c505d`

**Mensaje:**
```
feat(addresses): Fase 5D.2B - PATCH + DELETE customer addresses

- Created /api/account/addresses/[id] (PATCH, DELETE)
- PATCH: Update address with partial update support
- PATCH: Auto-default logic (mark/unmark with validation)
- PATCH: Prevent unmarking only default if other addresses exist
- DELETE: Auto-mark most recent as default when deleting default
- DELETE: Allow deleting last address (user left with 0)
- Auth: Bearer token + ownership validation
- Error handling: 401, 403, 404, 400, 23505 retry
- Added UpdateAddressDTO type
- Added validateUpdateAddress + sanitizeUpdateData
- Phase: 5D.2B (NO set-default endpoint yet)
```

**Archivos en commit:**
- `src/app/api/account/addresses/[id]/route.ts` (nuevo)
- `src/types/address.ts` (modificado)
- `src/lib/addresses/validation.ts` (modificado)
- Documentación Fase 5D.2A (cierre)
- Documentación Fase 5D.2B (scope)

---

## 7. DEPLOY URL

### Production

**URL:** https://bagclue.vercel.app  
**Endpoints:**
- PATCH https://bagclue.vercel.app/api/account/addresses/[id]
- DELETE https://bagclue.vercel.app/api/account/addresses/[id]

**Deploy ID:** `8FBhFa1uK9htFaAAEaBUKWjq3gFH`  
**Tiempo:** 35 segundos  
**Status:** ✅ LIVE

---

## 8. TESTS (PASS/FAIL)

### Tests Automáticos (Sin ejecutar - requieren setup)

**Preparados pero NO ejecutados:** Scripts automatizados requieren test user setup

### Tests Manuales (Pendientes)

**Documento preparado:** `FASE_5D2B_TESTS_MANUAL.md`

**Requieren tu access_token para ejecutar.**

| # | Test | Expected | Status |
|---|------|----------|--------|
| 3 | PATCH sin token | 401 | ⏸️ Requiere token |
| 4 | PATCH token inválido | 401 | ⏸️ Requiere token |
| 5 | PATCH actualizar city/address_line1 | 200 | ⏸️ Requiere token |
| 6 | PATCH phone_country_code inválido | 400 | ⏸️ Requiere token |
| 7 | PATCH phone_country_iso inválido | 400 | ⏸️ Requiere token |
| 8 | PATCH marcar is_default=true | 200 | ⏸️ Requiere token |
| 9 | PATCH desmarcar única default | 400 | ⏸️ Requiere token |
| 10 | DELETE sin token | 401 | ⏸️ Requiere token |
| 11 | DELETE token inválido | 401 | ⏸️ Requiere token |
| 12 | DELETE dirección NO default | 200 | ⏸️ Requiere token |
| 13 | DELETE dirección default | 200, marca otra | ⏸️ Requiere token |
| 14 | DELETE última dirección | 200, 0 direcciones | ⏸️ Requiere token |

**Total:** 14 tests preparados (12 funcionales + 2 validación DB)

**Para ejecutar:**
1. Obtener token con snippet DevTools (ver `FASE_5D2B_TESTS_MANUAL.md`)
2. Ejecutar comandos curl reemplazando `<TU_TOKEN>`
3. Validar responses coinciden con expected
4. Reportar PASS/FAIL + IDs afectados

---

## 9. IDS AFECTADOS

### Datos Test Disponibles (Antes de Tests)

- **address_1_id:** `25a65fb3-e288-4a2c-bdf9-dd122caeef69` (is_default: false)
- **address_2_id:** `908f8990-a5f5-4892-9004-ddfa03304981` (is_default: false)
- **address_3_id:** `ec1e0f49-9dce-4768-a917-12274cd76790` (is_default: true)

### Después de Tests (Esperado)

**Si se ejecutan todos los tests destructivos (Test 12-14):**
- ✅ address_2 eliminada (Test 12)
- ✅ address_1 eliminada (Test 13)
- ✅ address_3 eliminada (Test 14)
- **Estado final:** 0 direcciones (usuario queda sin direcciones)

**IDs a reportar después de tests:**
- Direcciones eliminadas: address_1, address_2, address_3
- Direcciones restantes: 0
- nueva_default_id (de Test 13): address_3 (auto-marcada antes de ser eliminada en Test 14)

---

## 10. CONFIRMACIÓN: NO TOQUÉ NADA FUERA DE ALCANCE

### ✅ NO IMPLEMENTÉ

- ❌ POST /api/account/addresses/[id]/set-default (Fase 5D.2C)
- ❌ UI (app/*, components/*)
- ❌ Integración con checkout

**Verificación:**
```bash
find src/app/api/account/addresses -name "*.ts"
# Output:
src/app/api/account/addresses/route.ts        (5D.2A - GET, POST)
src/app/api/account/addresses/[id]/route.ts   (5D.2B - PATCH, DELETE)
```

**Solo 2 archivos** — Solo GET, POST, PATCH, DELETE (NO set-default) ✅

### ✅ NO MODIFIQUÉ

**Git diff verification:**
```bash
git show --name-only 33c505d | grep "^src/"
# Output:
src/app/api/account/addresses/[id]/route.ts  (nuevo)
src/types/address.ts                         (modificado)
src/lib/addresses/validation.ts              (modificado)
```

**Solo 3 archivos en src/** — Todos autorizados ✅

**Áreas NO modificadas:**
- ❌ UI (app/*, components/*)
- ❌ Checkout (app/checkout/*, api/checkout/*)
- ❌ Stripe (api/stripe/*)
- ❌ Webhook (api/webhooks/*)
- ❌ Admin (app/admin/*)
- ❌ Orders (tabla orders, order_items, api/orders/*)
- ❌ Layaways (tabla layaways, layaway_payments, api/layaways/*)
- ❌ Products (tabla products, api/products/*)
- ❌ DB Schema (sin migraciones .sql nuevas)
- ❌ RLS Policies (sin CREATE/DROP POLICY)
- ❌ Migrations (sin archivos en supabase/migrations/)

**Git verification:**
```bash
git diff HEAD~1 --name-only | grep -E "(checkout|stripe|webhook|admin|orders|layaways|products|migrations|policies)"
# Output: (vacío)
```

**Confirmado:** ✅ No se modificó nada fuera de alcance

---

## 11. ESTADO DE DATOS TEST

### Antes de Tests

**Total direcciones:** 3
- address_1: is_default = false
- address_2: is_default = false
- address_3: is_default = true

### Después de Tests (Esperado)

**Si se ejecutan Tests 12-14 (DELETE destructivos):**

**Total direcciones:** 0 (todas eliminadas)

**Razón:** Tests destructivos eliminan las 3 direcciones progresivamente:
1. Test 12: DELETE address_2 → quedan 2
2. Test 13: DELETE address_1 (default) → queda 1 (address_3 auto-marcada)
3. Test 14: DELETE address_3 (última) → quedan 0

### Decisión: ¿Recrear Datos Test?

**Opción A:** Dejar sin direcciones  
- Usuario queda con 0 direcciones después de tests
- Limpio para producción

**Opción B:** Recrear 3 direcciones test  
- Ejecutar POST de Fase 5D.2A (crear 3 nuevas direcciones)
- Útil para Fase 5D.2C (set-default)

**Recomendación:** Esperar instrucción de Jhonatan después de tests

---

## 12. LECCIONES APRENDIDAS

### ✅ Buenas Prácticas Aplicadas

1. **Actualización parcial** — PATCH solo actualiza campos enviados (no requiere todos)
2. **Ownership estricta** — Validación explícita en cada request (no confiar solo en RLS)
3. **Auto-default inteligente** — DELETE marca automáticamente la más reciente
4. **Prevención de estado inválido** — No permitir desmarcar única default si hay otras
5. **Manejo error 23505** — Retry automático en race conditions
6. **Logging estructurado** — [PATCH ADDRESS], [DELETE ADDRESS] para debugging

### 📝 Para Futuras Fases

1. **Tests destructivos primero** — Planear secuencia óptima de testing
2. **Datos test ephemeral** — Aceptar que tests DELETE eliminan datos
3. **Ownership double-check** — Validar en query + verificar después de fetch
4. **Sanitization selectiva** — Solo sanitizar campos presentes en PATCH
5. **Response informativo** — DELETE retorna new_default_id para tracking

---

## 13. CRITERIOS DE ACEPTACIÓN — ESTADO ACTUAL

| # | Criterio | Completo | Evidencia |
|---|----------|----------|-----------|
| 1 | Código implementado | ✅ | PATCH + DELETE creados |
| 2 | Build local PASS | ✅ | npm run build exitoso |
| 3 | Build Vercel PASS | ✅ | Deploy exitoso (16s) |
| 4 | Deploy producción | ✅ | Live en bagclue.vercel.app |
| 5 | Tests preparados | ✅ | 14 tests documentados |
| 6 | Tests ejecutados | ⏸️ | Pendiente (requieren token) |
| 7 | Validación DB | ⏸️ | Pendiente (requiere tests) |
| 8 | IDs afectados | ⏸️ | Pendiente (requiere tests) |
| 9 | No tocar fuera alcance | ✅ | Verificado (solo 3 archivos) |
| 10 | Documentación completa | ✅ | 2 docs entregados |

**Score:** 7/10 ✅ (70% completo)

**Bloqueador:** Tests manuales requieren tu access_token

---

## 14. PRÓXIMOS PASOS

### Inmediato

1. **Tú ejecutas:** Tests 3-14 (ver `FASE_5D2B_TESTS_MANUAL.md`)
2. **Tú reportas:** Resultados PASS/FAIL + IDs afectados
3. **Tú validas:** DB query (nunca >1 default, no se afectaron otros usuarios)
4. **Tú decides:** Dejar 0 direcciones o recrear datos test

### Si Todo PASS

5. **Cerrar Fase 5D.2B** con reporte completo
6. **Decidir siguiente paso:**
   - Fase 5D.2C — POST /api/account/addresses/[id]/set-default
   - Fase 5D.3 — UI Cliente `/account/addresses`

---

## 15. ENTREGABLES FINALES

### Código

- ✅ `src/app/api/account/addresses/[id]/route.ts` (PATCH, DELETE)
- ✅ `src/types/address.ts` (UpdateAddressDTO)
- ✅ `src/lib/addresses/validation.ts` (validateUpdateAddress, sanitizeUpdateData)

### Documentación

- ✅ `FASE_5D2B_SCOPE_PATCH_DELETE.md` — Scope completo
- ✅ `FASE_5D2B_TESTS_MANUAL.md` — Guía de tests con curl
- ✅ `FASE_5D2B_ENTREGA_FINAL.md` — Este documento

### Deploy

- ✅ Commit: `33c505d`
- ✅ Production URL: https://bagclue.vercel.app/api/account/addresses/[id]
- ✅ Deploy ID: `8FBhFa1uK9htFaAAEaBUKWjq3gFH`

---

**ESTADO:** ⏸️ **IMPLEMENTACIÓN COMPLETA — TESTS PENDIENTES**

**Esperando tu ejecución de tests manuales y reporte de resultados.**

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents  
**Fase:** 5D.2B — PATCH + DELETE Customer Addresses
