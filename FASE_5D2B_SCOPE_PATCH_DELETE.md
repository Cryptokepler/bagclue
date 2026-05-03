# FASE 5D.2B — SCOPE PATCH + DELETE DIRECCIONES
**Fecha:** 2026-05-03  
**Estado:** Propuesta pendiente de aprobación  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce  

---

## 1. OBJETIVO

Implementar endpoints PATCH y DELETE para permitir a clientes autenticados editar y eliminar sus direcciones de envío.

**Alcance:**
- PATCH /api/account/addresses/[id] — Editar dirección propia
- DELETE /api/account/addresses/[id] — Eliminar dirección propia
- Validación ownership estricta
- Manejo automático de dirección default
- Seguridad contra modificaciones cross-user

**Esta fase NO incluye:**
- ❌ UI (Fase 5D.3)
- ❌ POST /api/account/addresses/[id]/set-default (Fase 5D.2C)
- ❌ Integración con checkout
- ❌ Modificación de DB schema
- ❌ Nuevas RLS policies

---

## 2. ARCHIVOS A CREAR

### 2.1 API Route

```
src/app/api/account/addresses/[id]/route.ts  (NUEVO)
```

**Exports:**
- `export async function PATCH(request, { params })` — Editar dirección
- `export async function DELETE(request, { params })` — Eliminar dirección

**Total:** 1 archivo nuevo (~200-250 líneas)

### 2.2 Helpers (Opcional)

```
src/lib/addresses/defaults.ts  (NUEVO - opcional)
```

**Funciones:**
- `clearDefaultAddresses(userId)` — Desmarcar todas las default del usuario
- `setNewDefaultAfterDelete(userId, excludeId)` — Marcar la más reciente como default

**Total:** 1 archivo opcional (~50-80 líneas)

### 2.3 Tipos (Actualización)

```
src/types/address.ts  (MODIFICAR)
```

**Agregar:**
```typescript
export interface UpdateAddressDTO {
  full_name?: string;
  phone_country_code?: string | null;
  phone_country_iso?: string | null;
  phone?: string | null;
  country?: string;
  state?: string | null;
  city?: string;
  postal_code?: string | null;
  address_line1?: string;
  address_line2?: string | null;
  delivery_references?: string | null;
  is_default?: boolean;
}
```

**Total:** ~20 líneas agregadas

---

## 3. ENDPOINT: PATCH /api/account/addresses/[id]

### 3.1 Campos Permitidos en PATCH

**Todos los campos son opcionales** (actualización parcial):

| Campo | Tipo | Validación | Notas |
|-------|------|------------|-------|
| `full_name` | string | min 3, max 255 | Opcional |
| `phone_country_code` | string \| null | regex `^\+\d{1,4}$` | Opcional |
| `phone_country_iso` | string \| null | 2 chars uppercase | Opcional |
| `phone` | string \| null | min 7, max 20 | Opcional |
| `country` | string | min 3, max 100 | Opcional |
| `state` | string \| null | max 100 | Opcional |
| `city` | string | min 3, max 100 | Opcional |
| `postal_code` | string \| null | max 20 | Opcional |
| `address_line1` | string | min 5, max 255 | Opcional |
| `address_line2` | string \| null | max 255 | Opcional |
| `delivery_references` | string \| null | max 500 | Opcional |
| `is_default` | boolean | true \| false | Opcional |

**Ejemplo request PATCH:**
```json
{
  "full_name": "Nuevo Nombre",
  "city": "Nueva Ciudad",
  "is_default": true
}
```

**Solo actualiza los campos enviados** — Los demás permanecen sin cambios.

---

### 3.2 Campos Prohibidos en PATCH

| Campo | Prohibido | Motivo |
|-------|-----------|--------|
| `id` | ✅ | PK inmutable |
| `user_id` | ✅ | Ownership — nunca permitir cambiar |
| `created_at` | ✅ | Metadata automática |
| `updated_at` | ✅ | Auto-actualizada por trigger DB |

**Si se envían en el body:** Ignorar silenciosamente (no dar error 400, solo no aplicar)

**Protección adicional:** `user_id` siempre debe validarse contra `auth.uid()` del token

---

### 3.3 Validaciones por Campo

**Reutilizar validaciones de POST** con ajustes:

```typescript
// Validaciones PATCH (todos opcionales)
if (data.full_name !== undefined) {
  if (data.full_name.trim().length < 3) {
    errors.push({ field: 'full_name', message: 'Min 3 characters' });
  }
}

if (data.phone_country_code !== undefined && data.phone_country_code !== null) {
  if (!/^\+\d{1,4}$/.test(data.phone_country_code)) {
    errors.push({ field: 'phone_country_code', message: 'Invalid format' });
  }
}

// ... similar para otros campos
```

**Diferencia vs POST:**
- POST: Validar campos obligatorios (full_name, country, city, address_line1)
- PATCH: Todos opcionales, solo validar si se envían

---

### 3.4 Estrategia para Mantener Solo Una Default

**Regla:** Solo puede haber UNA dirección con `is_default = true` por usuario

**Flujo PATCH con is_default = true:**

```
1. Usuario edita address_1 y marca is_default = true
2. Backend detecta: is_default = true en el update
3. Desmarcar todas las otras default del usuario:
   UPDATE customer_addresses 
   SET is_default = false 
   WHERE user_id = X AND id != address_1_id AND is_default = true
4. Actualizar address_1 con nuevos valores + is_default = true
5. Resultado: Solo address_1 es default
```

**Flujo PATCH con is_default = false:**

**Regla especial:** NO permitir desmarcar la única default si existen otras direcciones

```
1. Usuario edita address_3 (actual default) y envía is_default = false
2. Backend detecta: is_default = false y dirección actual es default
3. Verificar: ¿Existen otras direcciones del usuario?
4. SI existen otras:
   - Rechazar con error 400: "Cannot unmark only default address. Mark another as default first."
5. SI NO existen otras (es la única dirección):
   - Permitir is_default = false (usuario queda sin direcciones default temporalmente)
```

**Implementación:**

```typescript
// Si intenta desmarcar default
if (updateData.is_default === false) {
  // Verificar si la dirección actual es default
  const { data: currentAddress } = await supabase
    .from('customer_addresses')
    .select('is_default')
    .eq('id', addressId)
    .single();

  if (currentAddress?.is_default === true) {
    // Es default ahora, verificar si hay otras direcciones
    const { count: otherAddresses } = await supabase
      .from('customer_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('id', addressId);

    if (otherAddresses > 0) {
      // Hay otras direcciones, no permitir desmarcar única default
      return NextResponse.json(
        { error: 'Cannot unmark only default address. Mark another as default first.' },
        { status: 400 }
      );
    }
    // Si otherAddresses === 0, permitir (es la única dirección)
  }
}
```

**Alternativa más simple:** Siempre permitir `is_default = false` pero agregar warning en response

---

### 3.5 Manejo de Errores PATCH

| Código | Caso | Response Body |
|--------|------|---------------|
| **401** | Sin token | `{ error: "Unauthorized" }` |
| **401** | Token inválido | `{ error: "Unauthorized" }` |
| **400** | Validación fallida | `{ error: "Validation failed", errors: [...] }` |
| **400** | Desmarcar única default | `{ error: "Cannot unmark only default address..." }` |
| **404** | Dirección no existe | `{ error: "Address not found" }` |
| **403** | Dirección ajena | `{ error: "Forbidden: Address does not belong to user" }` |
| **500** | Error DB | `{ error: "Internal server error" }` |

---

## 4. ENDPOINT: DELETE /api/account/addresses/[id]

### 4.1 Estrategia al Eliminar Dirección Default

**Regla:** Si se elimina la dirección default y existen otras, marcar automáticamente la más reciente como nueva default.

**Casos:**

| Escenario | Acción |
|-----------|--------|
| Eliminar dirección NO default | Eliminar directamente (no tocar otras) |
| Eliminar dirección default + hay otras | Eliminar + marcar la más reciente como default |
| Eliminar única dirección del usuario | Eliminar (usuario queda sin direcciones) |

**Flujo DELETE dirección default con otras:**

```
1. Usuario elimina address_3 (default actual)
2. Backend detecta: address_3 tiene is_default = true
3. Verificar: ¿Hay otras direcciones del usuario?
4. SI hay otras:
   a. Obtener la más reciente (ORDER BY created_at DESC LIMIT 1, excluyendo address_3)
   b. Marcar esa dirección como default (is_default = true)
   c. Eliminar address_3
5. SI NO hay otras:
   - Eliminar address_3 (usuario queda sin direcciones)
```

**Implementación:**

```typescript
// 1. Verificar si la dirección a eliminar es default
const { data: addressToDelete } = await supabase
  .from('customer_addresses')
  .select('is_default, user_id')
  .eq('id', addressId)
  .single();

if (!addressToDelete) {
  return NextResponse.json({ error: 'Address not found' }, { status: 404 });
}

// Verificar ownership
if (addressToDelete.user_id !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

let newDefaultId = null;

// 2. Si es default, buscar la más reciente para marcar
if (addressToDelete.is_default) {
  const { data: otherAddresses } = await supabase
    .from('customer_addresses')
    .select('id')
    .eq('user_id', userId)
    .neq('id', addressId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (otherAddresses && otherAddresses.length > 0) {
    newDefaultId = otherAddresses[0].id;
    
    // Marcar la nueva default
    await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', newDefaultId);
  }
}

// 3. Eliminar la dirección
await supabase
  .from('customer_addresses')
  .delete()
  .eq('id', addressId);

// 4. Response con info de nueva default (si aplica)
return NextResponse.json({
  success: true,
  message: 'Address deleted successfully',
  new_default_id: newDefaultId
});
```

---

### 4.2 Manejo de Errores DELETE

| Código | Caso | Response Body |
|--------|------|---------------|
| **200** | Eliminada exitosamente | `{ success: true, message: "...", new_default_id: "uuid or null" }` |
| **401** | Sin token | `{ error: "Unauthorized" }` |
| **401** | Token inválido | `{ error: "Unauthorized" }` |
| **404** | Dirección no existe | `{ error: "Address not found" }` |
| **403** | Dirección ajena | `{ error: "Forbidden: Address does not belong to user" }` |
| **500** | Error DB | `{ error: "Internal server error" }` |

---

## 5. MANEJO ERROR 23505 (UNIQUE DEFAULT)

**Contexto:** Índice único `idx_customer_addresses_user_default` previene duplicados de `is_default = true` por usuario.

**PATCH:**
```typescript
try {
  // Desmarcar otras default
  await supabase
    .from('customer_addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .neq('id', addressId)
    .eq('is_default', true);

  // Actualizar dirección target
  const { data, error } = await supabase
    .from('customer_addresses')
    .update(updateData)
    .eq('id', addressId)
    .select()
    .single();

  if (error?.code === '23505') {
    // Retry: desmarcar nuevamente y reintentar
    await clearDefaultAddresses(userId, addressId);
    // Retry update...
  }
} catch (error) {
  // Handle
}
```

**DELETE:**
- Menos probable (solo marcar nueva default, no crear duplicados)
- Si ocurre en el paso "marcar nueva default", retry con desmarque previo

---

## 6. SEGURIDAD / OWNERSHIP

### 6.1 Validación de Ownership

**Flujo obligatorio en PATCH y DELETE:**

```typescript
// 1. Verificar auth
const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Obtener dirección
const { data: address } = await supabaseAdmin
  .from('customer_addresses')
  .select('id, user_id, is_default')
  .eq('id', addressId)
  .single();

// 3. Verificar existe
if (!address) {
  return NextResponse.json({ error: 'Address not found' }, { status: 404 });
}

// 4. Verificar ownership
if (address.user_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden: Address does not belong to user' }, { status: 403 });
}

// 5. Proceder con PATCH/DELETE
```

**Protección en múltiples capas:**
- ✅ Auth token válido
- ✅ Dirección existe
- ✅ user_id de la dirección coincide con user.id del token
- ✅ Query con `.eq('id', addressId)` garantiza solo modificar esa dirección

### 6.2 Cross-User Protection

**Escenario de ataque:**
- Usuario A intenta PATCH/DELETE dirección de Usuario B

**Protección:**
1. Query `.eq('id', addressId)` + `.select('user_id')`
2. Validar `address.user_id === user.id` del token
3. Si no coincide → 403 Forbidden
4. Usuario A no puede modificar direcciones de Usuario B

**RLS adicional:**
- Aunque usamos service_role (bypass RLS), la validación manual de ownership es suficiente
- RLS policies existentes (SELECT, INSERT, UPDATE, DELETE) protegen a nivel DB si se usara cliente autenticado

---

## 7. TESTS MANUALES (Con Datos Test Actuales)

### 7.1 Datos Test Disponibles

Creados en Fase 5D.2A:

- **address_1_id:** `25a65fb3-e288-4a2c-bdf9-dd122caeef69` (is_default: false)
- **address_2_id:** `908f8990-a5f5-4892-9004-ddfa03304981` (is_default: false)
- **address_3_id:** `ec1e0f49-9dce-4768-a917-12274cd76790` (is_default: **true**)

**Estado inicial:** 3 direcciones, address_3 es default

---

### 7.2 Tests PATCH

#### Test 1: PATCH sin token → 401

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test"}' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

#### Test 2: PATCH token inválido → 401

```bash
curl -X PATCH \
  -H "Authorization: Bearer invalid-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test"}' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

#### Test 3: PATCH dirección no existe → 404

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test"}' \
  https://bagclue.vercel.app/api/account/addresses/00000000-0000-0000-0000-000000000000
```

**Expected:** 404 `{"error":"Address not found"}`

---

#### Test 4: PATCH dirección ajena → 403

**Requiere:** Crear dirección con otro usuario o usar ID de otro usuario

**Expected:** 403 `{"error":"Forbidden: Address does not belong to user"}`

---

#### Test 5: PATCH actualización parcial (solo full_name)

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jhonatan Venegas Actualizado"
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 200
```json
{
  "address": {
    "id": "25a65fb3-e288-4a2c-bdf9-dd122caeef69",
    "full_name": "Jhonatan Venegas Actualizado",
    "city": "Ciudad de México",  // Sin cambios
    "is_default": false,  // Sin cambios
    ...
  }
}
```

---

#### Test 6: PATCH múltiples campos

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nombre Editado",
    "city": "Guadalajara",
    "postal_code": "44100"
  }' \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 200 con campos actualizados

---

#### Test 7: PATCH marcar address_1 como default (desmarca address_3)

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_default": true
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 200
```json
{
  "address": {
    "id": "25a65fb3-e288-4a2c-bdf9-dd122caeef69",
    "is_default": true  // ← Ahora es default
  }
}
```

**Validar en DB:**
```sql
SELECT id, full_name, is_default 
FROM customer_addresses 
WHERE user_id = '<TU_USER_ID>'
ORDER BY is_default DESC;
```

**Expected:**
- address_1: is_default = true
- address_2: is_default = false
- address_3: is_default = false (desmarcada)

---

#### Test 8: PATCH validación phone_country_code inválido → 400

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_country_code": "52"
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 400
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "phone_country_code",
      "message": "Phone country code must start with + followed by 1-4 digits (e.g., +52)"
    }
  ]
}
```

---

#### Test 9: PATCH desmarcar única default (debe rechazar si hay otras)

**Precondición:** address_1 es la única default

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_default": false
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 400
```json
{
  "error": "Cannot unmark only default address. Mark another as default first."
}
```

**Nota:** Si se decide permitir, cambiar expected a 200 con warning.

---

### 7.3 Tests DELETE

#### Test 10: DELETE sin token → 401

```bash
curl -X DELETE \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

#### Test 11: DELETE token inválido → 401

```bash
curl -X DELETE \
  -H "Authorization: Bearer invalid-token-12345" \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

#### Test 12: DELETE dirección no existe → 404

```bash
curl -X DELETE \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses/00000000-0000-0000-0000-000000000000
```

**Expected:** 404 `{"error":"Address not found"}`

---

#### Test 13: DELETE dirección ajena → 403

**Requiere:** Usar ID de dirección de otro usuario

**Expected:** 403 `{"error":"Forbidden: Address does not belong to user"}`

---

#### Test 14: DELETE dirección NO default (address_2)

**Precondición:** address_1 es default, address_2 NO es default

```bash
curl -X DELETE \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 200
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "new_default_id": null  // ← No cambió default (no era default la eliminada)
}
```

**Validar en DB:** Solo quedan address_1 (default) y address_3

---

#### Test 15: DELETE dirección default (address_1) — auto-marca otra

**Precondición:** address_1 es default, existe address_3

```bash
curl -X DELETE \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 200
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "new_default_id": "ec1e0f49-9dce-4768-a917-12274cd76790"  // ← address_3 marcada como nueva default
}
```

**Validar en DB:**
```sql
SELECT id, full_name, is_default 
FROM customer_addresses 
WHERE user_id = '<TU_USER_ID>'
ORDER BY is_default DESC;
```

**Expected:**
- Solo queda address_3
- address_3.is_default = true (auto-marcada)

---

#### Test 16: DELETE última dirección del usuario

**Precondición:** Solo queda address_3

```bash
curl -X DELETE \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses/ec1e0f49-9dce-4768-a917-12274cd76790
```

**Expected:** 200
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "new_default_id": null  // ← No hay otras direcciones
}
```

**Validar en DB:**
```sql
SELECT COUNT(*) FROM customer_addresses WHERE user_id = '<TU_USER_ID>';
```

**Expected:** 0 (usuario sin direcciones)

---

### 7.4 Resumen Tests Manuales

| # | Test | Endpoint | Expected | Status |
|---|------|----------|----------|--------|
| 1 | PATCH sin token | PATCH | 401 | ⏸️ |
| 2 | PATCH token inválido | PATCH | 401 | ⏸️ |
| 3 | PATCH dirección no existe | PATCH | 404 | ⏸️ |
| 4 | PATCH dirección ajena | PATCH | 403 | ⏸️ |
| 5 | PATCH actualización parcial | PATCH | 200, campo actualizado | ⏸️ |
| 6 | PATCH múltiples campos | PATCH | 200, todos actualizados | ⏸️ |
| 7 | PATCH marcar default | PATCH | 200, desmarca otras | ⏸️ |
| 8 | PATCH validación inválida | PATCH | 400 | ⏸️ |
| 9 | PATCH desmarcar única default | PATCH | 400 (rechazar) | ⏸️ |
| 10 | DELETE sin token | DELETE | 401 | ⏸️ |
| 11 | DELETE token inválido | DELETE | 401 | ⏸️ |
| 12 | DELETE dirección no existe | DELETE | 404 | ⏸️ |
| 13 | DELETE dirección ajena | DELETE | 403 | ⏸️ |
| 14 | DELETE dirección NO default | DELETE | 200, sin cambiar default | ⏸️ |
| 15 | DELETE dirección default | DELETE | 200, marca otra default | ⏸️ |
| 16 | DELETE última dirección | DELETE | 200, usuario sin direcciones | ⏸️ |

**Total:** 16 tests manuales

---

## 8. TESTS CON DATOS ACTUALES (Secuencia Recomendada)

### Secuencia Óptima de Testing

Usando los datos test actuales (address_1, address_2, address_3 con address_3 default):

#### Fase 1: Tests PATCH (Sin eliminar direcciones)

1. **Test 5:** PATCH address_1 → actualizar full_name
2. **Test 6:** PATCH address_2 → actualizar múltiples campos
3. **Test 8:** PATCH address_1 → phone_country_code inválido (error 400)
4. **Test 7:** PATCH address_1 → marcar como default (desmarca address_3)
5. **Validar DB:** Solo address_1 es default

#### Fase 2: Tests DELETE (Destructivo)

6. **Test 14:** DELETE address_2 (NO default) → eliminar sin cambiar default
7. **Validar DB:** Quedan address_1 (default) y address_3
8. **Test 15:** DELETE address_1 (default) → eliminar y auto-marcar address_3 como default
9. **Validar DB:** Solo queda address_3 con is_default = true
10. **Test 16:** DELETE address_3 (última dirección) → usuario queda sin direcciones
11. **Validar DB:** 0 direcciones

#### Fase 3: Re-crear Direcciones para Fase 5D.2C (Opcional)

Después de tests, si necesitas datos test para Fase 5D.2C (set-default):

12. **POST** 3 nuevas direcciones (igual que en Fase 5D.2A)
13. Guardar nuevos IDs para Fase 5D.2C

---

## 9. VALIDACIÓN DB POST-TESTS

### Queries de Validación

#### Después de Test 7 (PATCH marcar default):

```sql
-- Verificar solo 1 default
SELECT id, full_name, is_default 
FROM customer_addresses 
WHERE user_id = '<TU_USER_ID>'
ORDER BY is_default DESC, created_at DESC;
```

**Expected:**
- address_1: is_default = true
- address_2: is_default = false
- address_3: is_default = false

#### Después de Test 14 (DELETE address_2):

```sql
SELECT COUNT(*) as total_addresses
FROM customer_addresses
WHERE user_id = '<TU_USER_ID>';
```

**Expected:** total_addresses = 2

#### Después de Test 15 (DELETE address_1 default):

```sql
-- Verificar nueva default auto-marcada
SELECT id, full_name, is_default 
FROM customer_addresses 
WHERE user_id = '<TU_USER_ID>';
```

**Expected:**
- Solo address_3
- address_3.is_default = true

#### Después de Test 16 (DELETE última):

```sql
SELECT COUNT(*) FROM customer_addresses WHERE user_id = '<TU_USER_ID>';
```

**Expected:** 0

---

## 10. CONFIRMACIÓN: NO TOCARÉ

### ✅ NO IMPLEMENTARÉ

- ❌ POST /api/account/addresses/[id]/set-default (Fase 5D.2C)
- ❌ GET /api/account/addresses (ya existe desde 5D.2A)
- ❌ POST /api/account/addresses (ya existe desde 5D.2A)

### ✅ NO MODIFICARÉ

- ❌ UI (app/*, components/*)
- ❌ Checkout (app/checkout/*, api/checkout/*)
- ❌ Stripe (api/stripe/*)
- ❌ Webhook (api/webhooks/*)
- ❌ Admin (app/admin/*)
- ❌ Orders (tabla orders, order_items, api/orders/*)
- ❌ Layaways (tabla layaways, layaway_payments, api/layaways/*)
- ❌ Products (tabla products, api/products/*)
- ❌ DB Schema (sin migraciones .sql)
- ❌ RLS Policies (sin CREATE/DROP POLICY)
- ❌ Migrations (sin archivos nuevos en supabase/migrations/)

### ✅ SOLO CREARÉ/MODIFICARÉ

- ✅ `src/app/api/account/addresses/[id]/route.ts` (nuevo — PATCH, DELETE)
- ✅ `src/types/address.ts` (modificar — agregar UpdateAddressDTO)
- ✅ `src/lib/addresses/defaults.ts` (nuevo — opcional, helpers default)

**Total:** 1 archivo nuevo + 1 modificado + 1 opcional

---

## 11. RIESGOS Y MITIGACIONES

### 11.1 Riesgo: Race Condition en PATCH is_default

**Escenario:** 2 requests simultáneos marcan diferentes direcciones como default

**Impacto:** Medio (podría quedar 2 default temporalmente hasta que índice único rechace una)

**Mitigación:**
- ✅ Índice único `idx_customer_addresses_user_default` previene duplicados a nivel DB
- ✅ Manejo de error 23505 con retry
- ✅ Lógica 2-step: desmarcar → marcar

**Probabilidad:** Muy baja

---

### 11.2 Riesgo: DELETE Accidental de Última Dirección

**Escenario:** Usuario elimina su única dirección sin querer

**Impacto:** Bajo (usuario puede crear nueva dirección después)

**Mitigación:**
- ✅ Confirmación en UI (Fase 5D.3 — no en esta fase)
- ✅ DELETE permite quedar sin direcciones (comportamiento esperado)

**Decisión:** Permitir DELETE de última dirección (sin confirmación en API, eso es responsabilidad de UI)

---

### 11.3 Riesgo: Ownership Bypass (Usuario Modifica Dirección Ajena)

**Escenario:** Bug permite que Usuario A edite/elimine dirección de Usuario B

**Impacto:** Crítico (violación de privacidad)

**Mitigación:**
- ✅ Validación ownership en PATCH y DELETE
- ✅ Query `.eq('id', addressId)` + verificar `user_id === auth.uid()`
- ✅ Tests de seguridad (Test 4, 13)

**Probabilidad:** Muy baja (múltiples capas de protección)

---

### 11.4 Riesgo: Desmarcar Única Default Deja Usuario Sin Default

**Escenario:** Usuario marca is_default = false en su única dirección default

**Impacto:** Medio (usuario sin dirección default)

**Mitigación:**
- **Opción A (Recomendada):** Rechazar con error 400 si hay otras direcciones
- **Opción B:** Permitir pero retornar warning

**Decisión:** Opción A (rechazar con mensaje claro)

---

## 12. CRITERIOS DE ACEPTACIÓN

### ✅ Fase 5D.2B completa cuando:

1. **Código implementado:**
   - PATCH /api/account/addresses/[id] funcionando
   - DELETE /api/account/addresses/[id] funcionando

2. **Build PASS:**
   - Local build exitoso
   - Vercel build exitoso

3. **Deploy producción:**
   - Live en https://bagclue.vercel.app

4. **Tests PATCH (9 tests):**
   - Sin token → 401 ✅
   - Token inválido → 401 ✅
   - Dirección no existe → 404 ✅
   - Dirección ajena → 403 ✅
   - Actualización parcial → 200 ✅
   - Múltiples campos → 200 ✅
   - Marcar default → 200, desmarca otras ✅
   - Validación inválida → 400 ✅
   - Desmarcar única default → 400 ✅

5. **Tests DELETE (7 tests):**
   - Sin token → 401 ✅
   - Token inválido → 401 ✅
   - Dirección no existe → 404 ✅
   - Dirección ajena → 403 ✅
   - Dirección NO default → 200 ✅
   - Dirección default → 200, marca otra ✅
   - Última dirección → 200, sin direcciones ✅

6. **Validación DB:**
   - Solo 1 default después de PATCH marcar
   - Nueva default auto-marcada después de DELETE default
   - 0 direcciones después de DELETE última

7. **Documentación:**
   - Reporte final con tests PASS/FAIL
   - IDs direcciones test actualizados

8. **Sin modificaciones fuera alcance:**
   - UI, checkout, Stripe, webhook, admin, orders, layaways, products intactos
   - DB schema, RLS, migrations sin cambios

---

## 13. ESTIMACIÓN

### 13.1 Complejidad

**MEDIA** — CRUD estándar con lógica de negocio moderada (default auto-marcado en DELETE)

### 13.2 Tiempo Estimado

**Implementación:** 2-3 horas
- PATCH endpoint: 1-1.5h
- DELETE endpoint: 1-1.5h
- Helpers opcionales: 0.5h

**Testing:** 1-1.5 horas
- Tests manuales PATCH: 0.5h
- Tests manuales DELETE: 0.5h
- Validación DB: 0.5h

**Documentación:** 0.5-1 hora

**Total:** 3.5-5.5 horas

### 13.3 Archivos

**Nuevos:** 1-2 (route.ts + opcional defaults.ts)  
**Modificados:** 1 (types/address.ts)

---

## 14. PRÓXIMOS PASOS

Una vez aprobado Fase 5D.2B:

1. **Implementar** PATCH + DELETE endpoints
2. **Build local + Vercel**
3. **Deploy producción**
4. **Ejecutar tests manuales** (16 tests)
5. **Validar DB** post-tests
6. **Documentar cierre** con reporte completo
7. **Preparar scope Fase 5D.2C** — POST set-default (si apruebas)

---

## 15. NOTAS FINALES

### 15.1 Decisiones de Diseño

- **PATCH parcial:** Solo actualizar campos enviados (no requerir todos)
- **DELETE default:** Auto-marcar más reciente como nueva default
- **Desmarcar default:** Rechazar si hay otras direcciones (prevenir usuario sin default)
- **Ownership:** Validación manual en cada request (no confiar en RLS solo)

### 15.2 Alternativas Consideradas

**Desmarcar única default:**
- Opción A: Rechazar con 400 ← **RECOMENDADA**
- Opción B: Permitir con warning

**DELETE última dirección:**
- Opción A: Permitir ← **RECOMENDADA**
- Opción B: Rechazar con error

**Helpers:**
- Opción A: Inline en route.ts ← Simple
- Opción B: Extraer a `defaults.ts` ← **RECOMENDADA** (mejor organización)

---

**ESTADO:** ⏸️ Propuesta pendiente de aprobación  
**SIGUIENTE ACCIÓN:** Esperar confirmación de Jhonatan para implementar Fase 5D.2B

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents
