# FASE 5D.2A — TESTS MANUALES PRODUCCIÓN
**Fecha:** 2026-05-03  
**URL Producción:** https://bagclue.vercel.app  
**Endpoint:** https://bagclue.vercel.app/api/account/addresses  

---

## PASO 1: Obtener tu Access Token

### Opción A: DevTools Console (Recomendado)

1. Ir a https://bagclue.vercel.app/account/login
2. Hacer login con tu email (magic link)
3. Abrir DevTools Console (F12)
4. Ejecutar:

```javascript
// Obtener token de localStorage
const authData = JSON.parse(localStorage.getItem('sb-orhjnwpbzxyqtyrayvoi-auth-token') || '{}');
const token = authData.access_token;

console.log('Tu token:');
console.log(token);

// Guardar en variable para copy-paste
window.MY_TOKEN = token;
```

5. Copiar el token que aparece en console

### Opción B: Desde Cookies

1. Ir a https://bagclue.vercel.app/account (después de login)
2. DevTools → Application → Cookies → https://bagclue.vercel.app
3. Buscar cookie `sb-orhjnwpbzxyqtyrayvoi-auth-token`
4. Copiar el valor del campo `access_token`

---

## PASO 2: Tests con tu Token

**Reemplaza `<TU_TOKEN>` con el token copiado en los comandos abajo.**

### Test 3: GET usuario sin direcciones → 200, []

```bash
curl -X GET \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "addresses": []
}
```

**Status esperado:** 200

---

### Test 6: POST faltando campos obligatorios → 400

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User"
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "error": "Validation failed",
  "errors": [
    {"field": "country", "message": "Country is required"},
    {"field": "city", "message": "City is required"},
    {"field": "address_line1", "message": "Address line 1 is required"}
  ]
}
```

**Status esperado:** 400

---

### Test 7: POST primera dirección (forzar is_default true)

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Dirección 1",
    "country": "México",
    "city": "Ciudad de México",
    "address_line1": "Calle Primera 123",
    "is_default": false
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "address": {
    "id": "<UUID>",
    "user_id": "<TU_USER_ID>",
    "full_name": "Test Dirección 1",
    "country": "México",
    "city": "Ciudad de México",
    "address_line1": "Calle Primera 123",
    "is_default": true,  // ← FORZADO a true (primera dirección)
    ...
  }
}
```

**Status esperado:** 201  
**Validar:** `is_default` debe ser `true` (ignoró el `false` del body)

**Guardar:** `id` de la dirección creada → **ADDRESS_1_ID**

---

### Test 8: GET después de crear → 1 dirección

```bash
curl -X GET \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "addresses": [
    {
      "id": "<ADDRESS_1_ID>",
      "full_name": "Test Dirección 1",
      "is_default": true,
      ...
    }
  ]
}
```

**Status esperado:** 200  
**Validar:** Array con 1 dirección, `id` coincide con ADDRESS_1_ID

---

### Test 9: POST segunda dirección con is_default false

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Dirección 2",
    "country": "México",
    "city": "Guadalajara",
    "address_line1": "Calle Segunda 456",
    "is_default": false
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "address": {
    "id": "<UUID>",
    "full_name": "Test Dirección 2",
    "is_default": false,  // ← Respetó false (no es primera)
    ...
  }
}
```

**Status esperado:** 201  
**Validar:** `is_default` debe ser `false`

**Guardar:** `id` de la dirección creada → **ADDRESS_2_ID**

---

### Test 10: POST tercera dirección con is_default true

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Dirección 3",
    "country": "México",
    "city": "Monterrey",
    "address_line1": "Calle Tercera 789",
    "is_default": true
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "address": {
    "id": "<UUID>",
    "full_name": "Test Dirección 3",
    "is_default": true,  // ← Marcó como default
    ...
  }
}
```

**Status esperado:** 201  
**Validar:** `is_default` debe ser `true`

**Guardar:** `id` de la dirección creada → **ADDRESS_3_ID**

---

### Test 12: GET ordenamiento correcto

```bash
curl -X GET \
  -H "Authorization: Bearer <TU_TOKEN>" \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
```json
{
  "addresses": [
    {
      "id": "<ADDRESS_3_ID>",
      "full_name": "Test Dirección 3",
      "is_default": true  // ← Primera en lista (default)
    },
    {
      "id": "<ADDRESS_2_ID>",
      "full_name": "Test Dirección 2",
      "is_default": false  // ← Segunda (más reciente de las no-default)
    },
    {
      "id": "<ADDRESS_1_ID>",
      "full_name": "Test Dirección 1",
      "is_default": false  // ← Tercera (ya no es default)
    }
  ]
}
```

**Status esperado:** 200

**Validar:**
- 3 direcciones en total
- Primera en lista es ADDRESS_3 con `is_default: true`
- Orden: default primero, luego created_at desc

---

### Test 14: Validación phone_country_code inválido

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Validation",
    "country": "México",
    "city": "CDMX",
    "address_line1": "Calle Test 999",
    "phone_country_code": "52"
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
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

**Status esperado:** 400  
**Validar:** Rechaza `"52"` sin `+`

---

### Test 14.1: Validación phone_country_iso inválido

```bash
curl -X POST \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Validation",
    "country": "México",
    "city": "CDMX",
    "address_line1": "Calle Test 999",
    "phone_country_iso": "MEX"
  }' \
  https://bagclue.vercel.app/api/account/addresses
```

**Expected:**
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

**Status esperado:** 400  
**Validar:** Rechaza `"MEX"` (debe ser 2 chars como `"MX"`)

---

## PASO 3: Validación en Supabase

Abre Supabase Dashboard SQL Editor y ejecuta:

```sql
-- Test 11: Solo una dirección default por usuario
SELECT 
  user_id,
  full_name,
  is_default,
  created_at
FROM customer_addresses
WHERE user_id = '<TU_USER_ID>'  -- Reemplazar con tu user_id
ORDER BY is_default DESC, created_at DESC;
```

**Expected:**
- 3 filas (o más si ya tenías direcciones previas)
- Solo 1 fila con `is_default = true` (debe ser "Test Dirección 3")
- Las demás con `is_default = false`

**Verificar:**
```sql
-- Contar cuántas default tiene tu usuario
SELECT COUNT(*) as default_count
FROM customer_addresses
WHERE user_id = '<TU_USER_ID>'
  AND is_default = true;
```

**Expected:** `default_count = 1`

---

## RESUMEN DE RESULTADOS

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | GET sin token → 401 | 401 | ✅ |
| 2 | GET token inválido → 401 | 401 | ✅ |
| 3 | GET usuario sin direcciones → [] | 200, [] | ⏸️ |
| 4 | POST sin token → 401 | 401 | ✅ |
| 5 | POST token inválido → 401 | 401 | ✅ |
| 6 | POST faltando campos → 400 | 400 Validation failed | ⏸️ |
| 7 | POST primera dirección (forzar default) | 201, is_default: true | ⏸️ |
| 8 | GET después de crear → 1 dirección | 200, count: 1 | ⏸️ |
| 9 | POST segunda dirección is_default=false | 201, is_default: false | ⏸️ |
| 10 | POST tercera dirección is_default=true | 201, is_default: true | ⏸️ |
| 11 | DB: Solo 1 default | 1 default en DB | ⏸️ |
| 12 | GET ordenamiento correcto | default primero | ⏸️ |
| 13 | user_id ajeno en body (bloqueado) | N/A (backend ignora) | ✅ |
| 14 | phone_country_code inválido → 400 | 400 Validation | ⏸️ |
| 14.1 | phone_country_iso inválido → 400 | 400 Validation | ⏸️ |
| 15 | No se tocó nada fuera alcance | Código review | ✅ |

**Leyenda:**
- ✅ PASS (verificado automático)
- ⏸️ Pendiente (requiere tu token para ejecutar)

---

## IDs A REPORTAR

Después de ejecutar tests 7, 9, 10, reporta:

- **ADDRESS_1_ID:** `<uuid dirección 1>`
- **ADDRESS_2_ID:** `<uuid dirección 2>`
- **ADDRESS_3_ID:** `<uuid dirección 3>`
- **TU_USER_ID:** `<uuid tu usuario>`

---

## LIMPIEZA DE DATOS TEST

### Opción A: Dejar datos test
- Las 3 direcciones test pueden quedarse
- Sirven para testing futuro de PATCH/DELETE

### Opción B: Limpiar ahora

```sql
-- Eliminar direcciones test
DELETE FROM customer_addresses
WHERE user_id = '<TU_USER_ID>'
  AND full_name LIKE 'Test Dirección%';
```

**¿Cuál prefieres?**

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue — Fase 5D.2A Tests Producción
