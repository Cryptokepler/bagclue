# FASE 5D.2B — TESTS MANUALES PRODUCCIÓN
**Fecha:** 2026-05-03  
**URL Producción:** https://bagclue.vercel.app  
**Endpoints:**
- PATCH https://bagclue.vercel.app/api/account/addresses/[id]
- DELETE https://bagclue.vercel.app/api/account/addresses/[id]

---

## DATOS TEST ACTUALES

Creados en Fase 5D.2A:

- **address_1_id:** `25a65fb3-e288-4a2c-bdf9-dd122caeef69` (is_default: false)
- **address_2_id:** `908f8990-a5f5-4892-9004-ddfa03304981` (is_default: false)
- **address_3_id:** `ec1e0f49-9dce-4768-a917-12274cd76790` (is_default: **true**)

**Estado inicial:** 3 direcciones, address_3 es default

---

## PASO 1: Obtener tu Access Token

(Mismo proceso que Fase 5D.2A)

```javascript
// DevTools Console en https://bagclue.vercel.app/account (después de login)
const authData = JSON.parse(
  localStorage.getItem('sb-orhjnwpbzxyqtyrayvoi-auth-token') || '{}'
);
console.log('Token:', authData.access_token);
window.MY_TOKEN = authData.access_token;
```

---

## PASO 2: Tests PATCH

### Test 3: PATCH sin token → 401

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"city": "Nueva Ciudad"}' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

### Test 4: PATCH token inválido → 401

```bash
curl -X PATCH \
  -H "Authorization: Bearer invalid-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"city": "Nueva Ciudad"}' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

### Test 5: PATCH address_1 actualiza city/address_line1 → 200

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Guadalajara Actualizada",
    "address_line1": "Calle Nueva Dirección 456"
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 200
```json
{
  "address": {
    "id": "25a65fb3-e288-4a2c-bdf9-dd122caeef69",
    "city": "Guadalajara Actualizada",
    "address_line1": "Calle Nueva Dirección 456",
    "is_default": false  // Sin cambios
  }
}
```

---

### Test 6: PATCH address_1 con phone_country_code inválido → 400

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

### Test 7: PATCH address_1 con phone_country_iso inválido → 400

```bash
curl -X PATCH \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_country_iso": "MEX"
  }' \
  https://bagclue.vercel.app/api/account/addresses/25a65fb3-e288-4a2c-bdf9-dd122caeef69
```

**Expected:** 400
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "phone_country_iso",
      "message": "Phone country ISO must be 2 uppercase letters (e.g., MX)"
    }
  ]
}
```

---

### Test 8: PATCH address_1 is_default=true → 200 y desmarca address_3

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

### Test 9: PATCH address_1 is_default=false cuando hay otras → 400

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
  "error": "Cannot unmark only default address. Mark another address as default first."
}
```

---

## PASO 3: Tests DELETE

### Test 10: DELETE sin token → 401

```bash
curl -X DELETE \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

### Test 11: DELETE token inválido → 401

```bash
curl -X DELETE \
  -H "Authorization: Bearer invalid-token-12345" \
  https://bagclue.vercel.app/api/account/addresses/908f8990-a5f5-4892-9004-ddfa03304981
```

**Expected:** 401 `{"error":"Unauthorized"}`

---

### Test 12: DELETE address_2 no default → 200

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
  "new_default_id": null  // ← No cambió default
}
```

**Validar en DB:** Solo quedan address_1 (default) y address_3

---

### Test 13: DELETE address_1 default → 200 y marca automáticamente address_3

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
  "new_default_id": "ec1e0f49-9dce-4768-a917-12274cd76790"  // ← address_3 marcada
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

### Test 14: DELETE última dirección → 200 y usuario queda con 0 direcciones

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

## PASO 4: Validación DB Final

### Query: Verificar que nunca hubo más de 1 default

```sql
-- Verificar historial de defaults (si hay logs)
-- Por ahora solo confirmar estado final:

SELECT COUNT(*) as total_addresses
FROM customer_addresses
WHERE user_id = '<TU_USER_ID>';
```

**Expected:** 0 (después de Test 14)

### Query: Verificar que no se afectaron direcciones ajenas

```sql
-- Contar direcciones de otros usuarios
SELECT COUNT(*) as other_users_addresses
FROM customer_addresses
WHERE user_id != '<TU_USER_ID>';
```

**Expected:** Número sin cambios (solo tus direcciones fueron afectadas)

---

## RESUMEN DE RESULTADOS

| # | Test | Expected | Status |
|---|------|----------|--------|
| 3 | PATCH sin token | 401 | ⏸️ |
| 4 | PATCH token inválido | 401 | ⏸️ |
| 5 | PATCH actualizar city/address_line1 | 200 | ⏸️ |
| 6 | PATCH phone_country_code inválido | 400 | ⏸️ |
| 7 | PATCH phone_country_iso inválido | 400 | ⏸️ |
| 8 | PATCH marcar is_default=true | 200, desmarca otras | ⏸️ |
| 9 | PATCH desmarcar única default | 400 | ⏸️ |
| 10 | DELETE sin token | 401 | ⏸️ |
| 11 | DELETE token inválido | 401 | ⏸️ |
| 12 | DELETE dirección NO default | 200 | ⏸️ |
| 13 | DELETE dirección default | 200, marca otra | ⏸️ |
| 14 | DELETE última dirección | 200, 0 direcciones | ⏸️ |
| 15 | DB: Nunca >1 default | Verificación | ⏸️ |
| 15 | DB: Sin afectar otros usuarios | Verificación | ⏸️ |

**Total:** 14 tests

---

## IDs A REPORTAR

Después de ejecutar tests, reporta:

- **Datos test antes:** 3 direcciones (address_1, address_2, address_3)
- **Datos test después:** 0 direcciones (todas eliminadas en tests destructivos)
- **Estado final DB:** Usuario queda sin direcciones (0 total)

---

## LIMPIEZA DE DATOS TEST

Después de tests, quedaste con **0 direcciones** (Test 14 eliminó la última).

Si necesitas recrear datos test para Fase 5D.2C:
- Ejecutar nuevamente POST de Fase 5D.2A (crear 3 direcciones)
- Guardar nuevos IDs

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue — Fase 5D.2B Tests Producción
