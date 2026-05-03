# FASE 5D.2 — BACKEND/API ROUTES DE DIRECCIONES
**Fecha:** 2026-05-03  
**Estado:** Propuesta pendiente de aprobación  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce  

---

## 1. OBJETIVO

Implementar endpoints REST seguros para gestión completa de direcciones de envío por clientes autenticados en el panel de usuario.

**Alcance:**
- 5 endpoints CRUD completos
- Autenticación obligatoria (Supabase Auth)
- Validaciones de ownership (usuario solo accede a sus direcciones)
- Manejo automático de dirección default
- Seguridad contra race conditions en default único

**Esta fase NO incluye:**
- ❌ UI (Fase 5D.3)
- ❌ Integración con checkout
- ❌ Modificación de DB schema
- ❌ Nuevas RLS policies

---

## 2. ENDPOINTS EXACTOS

### 2.1 GET /api/account/addresses
**Propósito:** Listar todas las direcciones del usuario autenticado  
**Método:** GET  
**Auth:** Requerida  
**Params:** Ninguno  

**Response 200:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "string",
      "phone_country_code": "+52",
      "phone_country_iso": "MX",
      "phone": "5551234567",
      "country": "México",
      "state": "CDMX",
      "city": "Ciudad de México",
      "postal_code": "06600",
      "address_line1": "Calle Reforma 123",
      "address_line2": "Piso 4, Apt 401",
      "delivery_references": "Edificio azul, portón negro",
      "is_default": true,
      "created_at": "2026-05-03T10:00:00Z",
      "updated_at": "2026-05-03T10:00:00Z"
    },
    ...
  ]
}
```

**Orden:** 
1. `is_default DESC` (default primero)
2. `created_at DESC` (más reciente primero)

**Response 401:** Sin token o token inválido
```json
{ "error": "Unauthorized" }
```

---

### 2.2 POST /api/account/addresses
**Propósito:** Crear nueva dirección  
**Método:** POST  
**Auth:** Requerida  

**Body:**
```json
{
  "full_name": "string (required)",
  "phone_country_code": "string (optional, default '+52')",
  "phone_country_iso": "string (optional, default 'MX')",
  "phone": "string (optional)",
  "country": "string (required, default 'México')",
  "state": "string (optional)",
  "city": "string (required)",
  "postal_code": "string (optional)",
  "address_line1": "string (required)",
  "address_line2": "string (optional)",
  "delivery_references": "string (optional)",
  "is_default": "boolean (optional, default false)"
}
```

**Campos obligatorios:**
- `full_name`
- `country`
- `city`
- `address_line1`

**Lógica especial:**
- Si `is_default = true` → desmarcar otras direcciones del usuario
- Si es la **primera dirección** del usuario → marcar `is_default = true` automáticamente (ignorar valor enviado)
- `user_id` se toma de `auth.uid()`, NO del body

**Response 201:**
```json
{
  "address": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "...",
    ...
    "is_default": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Response 400:** Campos faltantes o inválidos
```json
{ "error": "Missing required field: full_name" }
```

**Response 401:** Sin auth
```json
{ "error": "Unauthorized" }
```

---

### 2.3 PATCH /api/account/addresses/[id]
**Propósito:** Editar dirección propia  
**Método:** PATCH  
**Auth:** Requerida  
**Params:** `id` (UUID de la dirección)  

**Body:** (todos opcionales, solo enviar campos a actualizar)
```json
{
  "full_name": "string",
  "phone_country_code": "string",
  "phone_country_iso": "string",
  "phone": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postal_code": "string",
  "address_line1": "string",
  "address_line2": "string",
  "delivery_references": "string",
  "is_default": "boolean"
}
```

**Lógica especial:**
- Si `is_default = true` → desmarcar otras direcciones del usuario
- Verificar ownership: dirección pertenece al usuario autenticado
- NO permitir cambiar `user_id` (protegido por RLS + validación backend)

**Response 200:**
```json
{
  "address": {
    "id": "uuid",
    ...
  }
}
```

**Response 400:** Campos inválidos
```json
{ "error": "Invalid field: postal_code" }
```

**Response 401:** Sin auth
```json
{ "error": "Unauthorized" }
```

**Response 403:** Dirección ajena
```json
{ "error": "Forbidden: Address does not belong to user" }
```

**Response 404:** Dirección no existe
```json
{ "error": "Address not found" }
```

---

### 2.4 DELETE /api/account/addresses/[id]
**Propósito:** Eliminar dirección propia  
**Método:** DELETE  
**Auth:** Requerida  
**Params:** `id` (UUID de la dirección)  

**Lógica especial:**
- Verificar ownership: dirección pertenece al usuario autenticado
- Si elimina dirección `is_default = true` y existen otras:
  - **Opción A (Recomendada):** Marcar la más reciente como default automáticamente
  - **Opción B:** Dejar sin default
- Si elimina la **única dirección** del usuario → OK, queda sin direcciones

**Response 200:**
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "new_default_id": "uuid or null"
}
```

**Response 401:** Sin auth
```json
{ "error": "Unauthorized" }
```

**Response 403:** Dirección ajena
```json
{ "error": "Forbidden: Address does not belong to user" }
```

**Response 404:** Dirección no existe
```json
{ "error": "Address not found" }
```

---

### 2.5 POST /api/account/addresses/[id]/set-default
**Propósito:** Marcar dirección como principal  
**Método:** POST  
**Auth:** Requerida  
**Params:** `id` (UUID de la dirección)  
**Body:** Vacío (no requiere body)  

**Lógica:**
1. Verificar ownership: dirección pertenece al usuario autenticado
2. Desmarcar todas las direcciones `is_default = true` del usuario
3. Marcar dirección `[id]` como `is_default = true`
4. Manejar error 23505 si índice único se viola (retry con paso 2)

**Response 200:**
```json
{
  "success": true,
  "address": {
    "id": "uuid",
    ...
    "is_default": true
  }
}
```

**Response 401:** Sin auth
```json
{ "error": "Unauthorized" }
```

**Response 403:** Dirección ajena
```json
{ "error": "Forbidden: Address does not belong to user" }
```

**Response 404:** Dirección no existe
```json
{ "error": "Address not found" }
```

---

## 3. ARCHIVOS A CREAR

### 3.1 API Routes (Next.js 13+ App Router)

```
src/app/api/account/addresses/
├── route.ts                      (GET, POST)
└── [id]/
    ├── route.ts                  (PATCH, DELETE)
    └── set-default/
        └── route.ts              (POST)
```

**Total:** 3 archivos nuevos

### 3.2 Tipos TypeScript

```
src/types/address.ts              (Address, CreateAddressDTO, UpdateAddressDTO)
```

**Total:** 1 archivo nuevo

### 3.3 Helpers/Utils (Opcional)

```
src/lib/addresses/
├── validation.ts                 (Validaciones de campos)
└── defaults.ts                   (Lógica manejo default)
```

**Total:** 2 archivos opcionales (recomendado para DRY)

---

## 4. CAMPOS ESPERADOS POR ENDPOINT

### GET /api/account/addresses
**Query params:** Ninguno  
**Body:** N/A  

### POST /api/account/addresses
**Body (obligatorios):**
- `full_name` (min 3 chars, max 255)
- `country` (min 3 chars, max 100)
- `city` (min 3 chars, max 100)
- `address_line1` (min 5 chars, max 255)

**Body (opcionales):**
- `phone_country_code` (regex: `^\+\d{1,4}$`)
- `phone_country_iso` (2 chars uppercase, e.g., MX, US)
- `phone` (min 7 chars, max 20)
- `state` (max 100)
- `postal_code` (max 20)
- `address_line2` (max 255)
- `delivery_references` (max 500)
- `is_default` (boolean)

### PATCH /api/account/addresses/[id]
**URL param:**
- `id` (UUID válido)

**Body:** Igual que POST, pero todos opcionales (solo enviar campos a actualizar)

### DELETE /api/account/addresses/[id]
**URL param:**
- `id` (UUID válido)

**Body:** N/A

### POST /api/account/addresses/[id]/set-default
**URL param:**
- `id` (UUID válido)

**Body:** N/A (vacío)

---

## 5. VALIDACIONES POR ENDPOINT

### 5.1 Validaciones Comunes (Todos)

| Validación | Descripción |
|------------|-------------|
| **Auth obligatoria** | Verificar token Supabase válido |
| **user_id from token** | Nunca confiar en user_id del body/params |
| **UUID válido** | Validar formato UUID en params `[id]` |

### 5.2 GET /api/account/addresses

| Campo | Validación |
|-------|------------|
| N/A | Solo verificar auth |

### 5.3 POST /api/account/addresses

| Campo | Validación |
|-------|------------|
| `full_name` | Required, min 3, max 255, no solo espacios |
| `country` | Required, min 3, max 100 |
| `city` | Required, min 3, max 100 |
| `address_line1` | Required, min 5, max 255 |
| `phone_country_code` | Optional, regex `^\+\d{1,4}$` |
| `phone_country_iso` | Optional, 2 chars, uppercase |
| `phone` | Optional, min 7, max 20, solo dígitos y espacios |
| `state` | Optional, max 100 |
| `postal_code` | Optional, max 20 |
| `address_line2` | Optional, max 255 |
| `delivery_references` | Optional, max 500 |
| `is_default` | Optional, boolean (ignorado si es primera dirección) |

**Validación especial:**
- Si es la primera dirección del usuario → forzar `is_default = true`
- Si `is_default = true` → desmarcar otras direcciones del usuario

### 5.4 PATCH /api/account/addresses/[id]

| Campo | Validación |
|-------|------------|
| `id` (param) | Required, UUID válido |
| **Ownership** | Dirección pertenece a `auth.uid()` |
| Campos body | Igual que POST, pero todos opcionales |

**Validación especial:**
- Si `is_default = true` en body → desmarcar otras direcciones
- Verificar dirección existe antes de actualizar

### 5.5 DELETE /api/account/addresses/[id]

| Campo | Validación |
|-------|------------|
| `id` (param) | Required, UUID válido |
| **Ownership** | Dirección pertenece a `auth.uid()` |

**Validación especial:**
- Si elimina default y hay otras direcciones → marcar la más reciente como default

### 5.6 POST /api/account/addresses/[id]/set-default

| Campo | Validación |
|-------|------------|
| `id` (param) | Required, UUID válido |
| **Ownership** | Dirección pertenece a `auth.uid()` |

**Validación especial:**
- Desmarcar todas las default del usuario antes de marcar nueva
- Manejar error 23505 del índice único

---

## 6. MANEJO DE DEFAULT ADDRESS

### 6.1 Casos a Manejar

| Escenario | Comportamiento |
|-----------|----------------|
| **Crear primera dirección** | Marcar `is_default = true` automáticamente (ignorar valor del body) |
| **Crear dirección con `is_default = true`** | Desmarcar otras direcciones del usuario → marcar nueva |
| **Crear dirección con `is_default = false`** | Respetar valor, NO tocar otras direcciones |
| **Editar `is_default` de false → true** | Desmarcar otras direcciones → marcar editada |
| **Editar `is_default` de true → false** | Permitir SOLO si hay otra dirección default (prevenir quedar sin default) |
| **Eliminar dirección default** | Marcar la más reciente como default automáticamente |
| **Eliminar única dirección** | Permitir (usuario queda sin direcciones) |
| **set-default explícito** | Desmarcar todas → marcar target |

### 6.2 Estrategia Técnica para Evitar Dos Default

**Opción A (Recomendada): Transaction con 2 updates**
```javascript
// 1. Desmarcar todas las default del usuario
await supabase
  .from('customer_addresses')
  .update({ is_default: false })
  .eq('user_id', userId)
  .eq('is_default', true);

// 2. Marcar la nueva como default
await supabase
  .from('customer_addresses')
  .update({ is_default: true })
  .eq('id', addressId)
  .eq('user_id', userId);
```

**Ventajas:**
- ✅ Explícito y claro
- ✅ RLS protege ownership en ambos updates
- ✅ Índice único previene race conditions a nivel DB

**Opción B: RPC Function (PostgreSQL)**
```sql
CREATE OR REPLACE FUNCTION set_default_address(address_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE customer_addresses
  SET is_default = false
  WHERE user_id = $2 AND is_default = true;
  
  UPDATE customer_addresses
  SET is_default = true
  WHERE id = $1 AND user_id = $2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Ventajas:**
- ✅ Atómico a nivel DB
- ✅ Menos round-trips

**Desventajas:**
- ⚠️ Requiere crear función en DB (modificar schema)
- ⚠️ SECURITY DEFINER puede saltarse RLS si no se valida user_id

**DECISIÓN:** Usar **Opción A** (no modificar schema, confiar en RLS + índice único)

### 6.3 Manejo de Error 23505 (Unique Violation)

Si índice único se viola (race condition):

```javascript
try {
  // Marcar nueva como default
  const { error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId);
  
  if (error?.code === '23505') {
    // Retry: desmarcar primero, luego marcar
    await clearDefaultAddresses(userId);
    await setDefaultAddress(addressId, userId);
  }
} catch (err) {
  // Log y reportar
}
```

**Frecuencia esperada:** Muy baja (solo si 2 requests simultáneos marcan default)

---

## 7. MANEJO DE ERRORES

### 7.1 Códigos HTTP

| Código | Caso | Response Body |
|--------|------|---------------|
| **200** | Success (GET, PATCH, DELETE, set-default) | `{ address/addresses/success }` |
| **201** | Created (POST) | `{ address }` |
| **400** | Bad Request (campos faltantes, inválidos) | `{ error: "mensaje" }` |
| **401** | Unauthorized (sin token, token inválido) | `{ error: "Unauthorized" }` |
| **403** | Forbidden (dirección ajena) | `{ error: "Forbidden: ..." }` |
| **404** | Not Found (dirección no existe) | `{ error: "Address not found" }` |
| **500** | Internal Server Error | `{ error: "Internal server error" }` |

### 7.2 Validación de Campos (400)

**Ejemplos:**
```json
{ "error": "Missing required field: full_name" }
{ "error": "Invalid field: postal_code (max 20 characters)" }
{ "error": "Invalid phone_country_code format (expected: +XX)" }
{ "error": "Invalid UUID format for address id" }
```

### 7.3 Auth Errors (401)

**Sin token:**
```json
{ "error": "Unauthorized" }
```

**Token expirado/inválido:**
```json
{ "error": "Unauthorized: Invalid or expired token" }
```

### 7.4 Ownership Errors (403)

**Intentar editar/eliminar dirección ajena:**
```json
{ "error": "Forbidden: Address does not belong to user" }
```

### 7.5 Not Found (404)

**Dirección no existe:**
```json
{ "error": "Address not found" }
```

### 7.6 Database Errors (500)

**Error inesperado:**
```json
{ "error": "Internal server error" }
```

**Log:** Registrar error completo en server logs (no exponer detalles al cliente)

---

## 8. ESTRATEGIA DE AUTH

### 8.1 Opción A (Recomendada): Cliente Autenticado + RLS

**Flujo:**
1. Frontend envía request con cookie de sesión Supabase
2. Backend crea cliente autenticado: `createClient(cookies())`
3. Cliente usa token del usuario autenticado
4. RLS policies protegen ownership automáticamente
5. Backend NO necesita verificar `user_id` manualmente (RLS lo hace)

**Código ejemplo:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createClient(cookies());
  
  // RLS garantiza que solo ve sus direcciones
  const { data: addresses, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  return Response.json({ addresses });
}
```

**Ventajas:**
- ✅ Seguro por diseño (RLS protege)
- ✅ Menos código
- ✅ No necesita validación manual de ownership

**Desventajas:**
- ⚠️ No puede hacer queries cross-user (no es problema aquí)

### 8.2 Opción B: Service Role + Validación Manual

**Flujo:**
1. Frontend envía request con cookie de sesión
2. Backend verifica sesión: `supabase.auth.getUser()`
3. Backend usa service_role para queries
4. Backend valida `user_id` manualmente en cada query

**Código ejemplo:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // Verificar auth
  const supabase = createClient(cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query con service role + filtro manual
  const { data: addresses, error } = await supabaseAdmin
    .from('customer_addresses')
    .select('*')
    .eq('user_id', user.id) // Filtro manual
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  return Response.json({ addresses });
}
```

**Ventajas:**
- ✅ Puede hacer queries cross-user si necesario (admin)
- ✅ Más control explícito

**Desventajas:**
- ⚠️ Más código
- ⚠️ Riesgo de olvidar filtro `.eq('user_id', user.id)`

### 8.3 DECISIÓN FINAL

**Usar Opción A (Cliente Autenticado + RLS)** para todos los endpoints de addresses.

**Motivo:**
- Más seguro (RLS protege automáticamente)
- Menos código
- Menos riesgo de bugs de seguridad
- Suficiente para este caso (no necesitamos queries cross-user)

**Excepción:** Si en futuro necesitamos admin panel para ver direcciones de cualquier usuario, crear endpoints separados en `/api/admin/addresses` con service role.

---

## 9. TESTS MANUALES

### 9.1 Test Suite: GET /api/account/addresses

| # | Descripción | Request | Expected Response | Status |
|---|-------------|---------|-------------------|--------|
| 1 | Sin token | GET sin cookie | 401 Unauthorized | ⏸️ |
| 2 | Token inválido | GET con token falso | 401 Unauthorized | ⏸️ |
| 3 | Usuario sin direcciones | GET autenticado | 200, addresses: [] | ⏸️ |
| 4 | Usuario con 1 dirección | GET autenticado | 200, addresses: [1] | ⏸️ |
| 5 | Usuario con 3 direcciones | GET autenticado | 200, addresses: [3], default primero | ⏸️ |
| 6 | Orden correcto | GET autenticado | default → created_at desc | ⏸️ |

### 9.2 Test Suite: POST /api/account/addresses

| # | Descripción | Request | Expected Response | Status |
|---|-------------|---------|-------------------|--------|
| 1 | Sin token | POST sin cookie | 401 Unauthorized | ⏸️ |
| 2 | Campos faltantes | POST sin full_name | 400 Missing field | ⏸️ |
| 3 | Primera dirección del usuario | POST válido | 201, is_default: true (auto) | ⏸️ |
| 4 | Segunda dirección, no default | POST is_default: false | 201, is_default: false | ⏸️ |
| 5 | Nueva default | POST is_default: true | 201, otra desmarcada | ⏸️ |
| 6 | phone_country_code inválido | POST phone_country_code: "52" | 400 Invalid format | ⏸️ |
| 7 | phone_country_iso inválido | POST phone_country_iso: "MEX" | 400 Invalid format | ⏸️ |
| 8 | full_name muy corto | POST full_name: "AB" | 400 Min 3 chars | ⏸️ |
| 9 | address_line1 muy corto | POST address_line1: "123" | 400 Min 5 chars | ⏸️ |

### 9.3 Test Suite: PATCH /api/account/addresses/[id]

| # | Descripción | Request | Expected Response | Status |
|---|-------------|---------|-------------------|--------|
| 1 | Sin token | PATCH sin cookie | 401 Unauthorized | ⏸️ |
| 2 | Dirección ajena | PATCH id de otro usuario | 403 Forbidden | ⏸️ |
| 3 | Dirección no existe | PATCH id inexistente | 404 Not found | ⏸️ |
| 4 | UUID inválido | PATCH id: "abc123" | 400 Invalid UUID | ⏸️ |
| 5 | Editar full_name | PATCH full_name: "Nuevo" | 200, full_name actualizado | ⏸️ |
| 6 | Marcar como default | PATCH is_default: true | 200, otras desmarcadas | ⏸️ |
| 7 | Editar múltiples campos | PATCH varios campos | 200, todos actualizados | ⏸️ |

### 9.4 Test Suite: DELETE /api/account/addresses/[id]

| # | Descripción | Request | Expected Response | Status |
|---|-------------|---------|-------------------|--------|
| 1 | Sin token | DELETE sin cookie | 401 Unauthorized | ⏸️ |
| 2 | Dirección ajena | DELETE id de otro usuario | 403 Forbidden | ⏸️ |
| 3 | Dirección no existe | DELETE id inexistente | 404 Not found | ⏸️ |
| 4 | Eliminar única dirección | DELETE única | 200, success | ⏸️ |
| 5 | Eliminar default con otras | DELETE default | 200, nueva default marcada | ⏸️ |
| 6 | Eliminar no-default | DELETE no-default | 200, default sin cambios | ⏸️ |

### 9.5 Test Suite: POST /api/account/addresses/[id]/set-default

| # | Descripción | Request | Expected Response | Status |
|---|-------------|---------|-------------------|--------|
| 1 | Sin token | POST sin cookie | 401 Unauthorized | ⏸️ |
| 2 | Dirección ajena | POST id de otro usuario | 403 Forbidden | ⏸️ |
| 3 | Dirección no existe | POST id inexistente | 404 Not found | ⏸️ |
| 4 | Marcar como default | POST id válido | 200, otras desmarcadas | ⏸️ |
| 5 | Ya es default | POST id ya default | 200, sin cambios | ⏸️ |

---

## 10. TESTS DE SEGURIDAD

### 10.1 Test: Sin Token

**Endpoint:** Todos  
**Request:** Sin cookie de sesión Supabase  
**Expected:** 401 Unauthorized  
**Validación:** ✅ RLS rechaza query, cliente Supabase retorna error  

### 10.2 Test: Token Inválido

**Endpoint:** Todos  
**Request:** Cookie con token expirado/malformado  
**Expected:** 401 Unauthorized  
**Validación:** ✅ `createClient(cookies())` falla al verificar token  

### 10.3 Test: Usuario Ajeno (Cross-User Access)

**Escenario:**
1. Usuario A crea dirección (ID: `aaa-111`)
2. Usuario B intenta:
   - GET /api/account/addresses → NO debe ver dirección de A
   - PATCH /api/account/addresses/aaa-111 → 403 Forbidden
   - DELETE /api/account/addresses/aaa-111 → 403 Forbidden
   - POST /api/account/addresses/aaa-111/set-default → 403 Forbidden

**Validación:**
- ✅ RLS policies previenen acceso (USING auth.uid() = user_id)
- ✅ Usuario B no ve direcciones de Usuario A en GET
- ✅ Intentos de modificar direcciones ajenas retornan 0 rows affected → 403/404

### 10.4 Test: Modificar user_id Ajeno

**Escenario:**
1. Usuario A intenta crear dirección con `user_id: <usuario-b-id>` en body
2. Usuario A intenta editar dirección propia cambiando `user_id` a otro usuario

**Validación:**
- ✅ Backend ignora `user_id` del body (siempre usa `auth.uid()`)
- ✅ RLS WITH CHECK previene INSERT/UPDATE con user_id ajeno

### 10.5 Test: Inyección SQL (Sanitización)

**Escenario:**
Enviar campos con caracteres especiales SQL:
- `full_name: "'; DROP TABLE customer_addresses; --"`
- `city: "Ciudad' OR '1'='1"`

**Validación:**
- ✅ Supabase client usa prepared statements (inmune a SQL injection)
- ✅ Valores se escapan automáticamente

### 10.6 Test: Race Condition en Default

**Escenario:**
2 requests simultáneos intentan marcar direcciones diferentes como default del mismo usuario

**Validación:**
- ✅ Índice único `idx_customer_addresses_user_default` previene duplicados
- ✅ Una request gana, otra recibe error 23505
- ✅ Backend maneja retry con desmarque previo

---

## 11. CONFIRMACIONES

### ✅ NO TOCARÉ EN FASE 5D.2

- ❌ UI (app/, components/) → Fase 5D.3
- ❌ Checkout (app/checkout/, api/checkout/)
- ❌ Stripe (api/stripe/)
- ❌ Webhook (api/webhooks/)
- ❌ Admin (app/admin/)
- ❌ Orders (tabla orders, order_items)
- ❌ Layaways (tabla layaways, layaway_payments)
- ❌ Products (tabla products)
- ❌ DB Schema (migraciones, ALTER TABLE)
- ❌ RLS Policies (CREATE/DROP POLICY)

### ✅ SOLO CREARÉ

- ✅ 3 archivos API routes (GET/POST, PATCH/DELETE, set-default)
- ✅ 1 archivo tipos TypeScript (address.ts)
- ✅ 2 archivos helpers opcionales (validation.ts, defaults.ts)
- ✅ Tests manuales (scripts o Postman collection)
- ✅ Documentación de cierre

**Total:** ~6 archivos nuevos  
**Modificados:** 0

---

## 12. SUBFASES RECOMENDADAS

### 12.1 Fase 5D.2A — GET + POST (Fundación)
**Objetivo:** Listar y crear direcciones  
**Alcance:**
- `app/api/account/addresses/route.ts` (GET, POST)
- `types/address.ts` (tipos básicos)
- Validaciones campos obligatorios
- Lógica primera dirección → default automático
- Test manual: GET sin auth → 401, POST válido → 201

**Archivos:**
- `src/app/api/account/addresses/route.ts` (nuevo)
- `src/types/address.ts` (nuevo)

**Validación:**
- Test 1: GET sin token → 401 ✅
- Test 2: GET con token, sin direcciones → 200, [] ✅
- Test 3: POST primera dirección → 201, is_default: true ✅
- Test 4: POST segunda dirección → 201, is_default: false ✅
- Test 5: POST con is_default: true → 201, otra desmarcada ✅

**NO tocar:** UI, checkout, Stripe, webhook, admin, DB schema

---

### 12.2 Fase 5D.2B — PATCH + DELETE
**Objetivo:** Editar y eliminar direcciones  
**Alcance:**
- `app/api/account/addresses/[id]/route.ts` (PATCH, DELETE)
- Validación ownership (dirección pertenece al usuario)
- Lógica DELETE default → marcar otra como default
- Test manual: PATCH dirección ajena → 403, DELETE válido → 200

**Archivos:**
- `src/app/api/account/addresses/[id]/route.ts` (nuevo)

**Validación:**
- Test 1: PATCH sin token → 401 ✅
- Test 2: PATCH dirección ajena → 403 ✅
- Test 3: PATCH válido → 200, campos actualizados ✅
- Test 4: DELETE default con otras → 200, nueva default ✅
- Test 5: DELETE única dirección → 200, sin direcciones ✅

**NO tocar:** UI, checkout, Stripe, webhook, admin, DB schema

---

### 12.3 Fase 5D.2C — SET-DEFAULT + Validación Final
**Objetivo:** Marcar dirección como principal + tests completos  
**Alcance:**
- `app/api/account/addresses/[id]/set-default/route.ts` (POST)
- Helpers opcionales (validation.ts, defaults.ts)
- Test suite completo (30+ tests manuales)
- Documentación de cierre

**Archivos:**
- `src/app/api/account/addresses/[id]/set-default/route.ts` (nuevo)
- `src/lib/addresses/validation.ts` (opcional)
- `src/lib/addresses/defaults.ts` (opcional)
- `scripts/test-addresses-api.mjs` (opcional — automatizar tests)

**Validación:**
- Test 1: set-default sin token → 401 ✅
- Test 2: set-default dirección ajena → 403 ✅
- Test 3: set-default válido → 200, otras desmarcadas ✅
- Test suite completo: 30+ tests (seguridad, validación, ownership)

**Documentación:**
- `FASE_5D2_REPORTE_FINAL.md` — Reporte completo
- Endpoints funcionando ✅
- Tests seguridad PASS ✅
- Listo para Fase 5D.3 (UI)

**NO tocar:** UI, checkout, Stripe, webhook, admin, DB schema

---

## 13. RIESGOS Y MITIGACIONES

### 13.1 Riesgo: Race Condition en Marcar Default

**Escenario:** 2 requests simultáneos marcan diferentes direcciones como default del mismo usuario

**Impacto:** Medio (podría violar índice único o dejar 2 default temporalmente)

**Mitigación:**
- ✅ Índice único `idx_customer_addresses_user_default` previene duplicados a nivel DB
- ✅ Manejo de error 23505 con retry
- ✅ Lógica 2-step: desmarcar → marcar

**Probabilidad:** Muy baja (usuario necesita hacer 2 clicks simultáneos)

---

### 13.2 Riesgo: Usuario Deja Sin Dirección Default

**Escenario:** Usuario desmarca última dirección default sin marcar otra

**Impacto:** Bajo (solo UX — puede seleccionar otra después)

**Mitigación:**
- **Opción A:** Prevenir desmarcar última default (validación backend)
- **Opción B:** Permitir (usuario puede marcar otra manualmente)
- **Recomendación:** Opción B (más flexible, no es crítico tener default)

**Decisión:** Permitir usuario sin dirección default (validar en checkout si se integra en futuro)

---

### 13.3 Riesgo: Validación Insuficiente de Campos

**Escenario:** Backend acepta datos inválidos (e.g., postal_code alfabético, phone con letras)

**Impacto:** Medio (datos sucios en DB, problemas en envíos)

**Mitigación:**
- ✅ Validaciones explícitas en backend (min/max length, regex)
- ✅ Sanitización básica (trim, normalizar mayúsculas)
- ✅ Frontend también valida (defensa en profundidad)

**Validaciones mínimas:**
- `phone_country_code`: regex `^\+\d{1,4}$`
- `phone_country_iso`: 2 chars uppercase
- `phone`: solo dígitos y espacios
- `postal_code`: alfanumérico
- `full_name`: min 3 chars, no solo espacios

---

### 13.4 Riesgo: Ownership Bypass (Usuario Modifica Dirección Ajena)

**Escenario:** Bug en validación ownership → Usuario A edita dirección de Usuario B

**Impacto:** Crítico (violación de privacidad)

**Mitigación:**
- ✅ RLS policies garantizan aislamiento a nivel DB
- ✅ Cliente autenticado usa token del usuario (no puede falsificar)
- ✅ Tests de seguridad verifican cross-user access → 403/404

**Probabilidad:** Muy baja (RLS + auth token protegen múltiples capas)

---

### 13.5 Riesgo: Supabase RLS Policies Deshabilitadas Accidentalmente

**Escenario:** Alguien ejecuta `ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;`

**Impacto:** Crítico (todos ven direcciones de todos)

**Mitigación:**
- ✅ Validación en Fase 5D.3: verificar `rowsecurity = true`
- ✅ Monitoreo: script periódico chequea RLS activo
- ✅ Restricción: solo admin/owner de Supabase puede alterar RLS

**Probabilidad:** Muy baja (requiere acceso admin a Supabase)

---

## 14. ENTREGABLES

### 14.1 Código

- ✅ `src/app/api/account/addresses/route.ts` (GET, POST)
- ✅ `src/app/api/account/addresses/[id]/route.ts` (PATCH, DELETE)
- ✅ `src/app/api/account/addresses/[id]/set-default/route.ts` (POST)
- ✅ `src/types/address.ts` (TypeScript types)
- ✅ `src/lib/addresses/validation.ts` (opcional)
- ✅ `src/lib/addresses/defaults.ts` (opcional)

### 14.2 Tests

- ✅ Script manual de tests: `scripts/test-addresses-api.sh` o Postman collection
- ✅ Test suite: 30+ casos (funcionales + seguridad)

### 14.3 Documentación

- ✅ `FASE_5D2_REPORTE_FINAL.md` — Reporte de cierre
- ✅ README de endpoints (opcional — para equipo)

---

## 15. CRITERIOS DE ACEPTACIÓN

### ✅ Fase 5D.2 completa cuando:

1. **Endpoints funcionando:**
   - GET /api/account/addresses → 200, lista direcciones
   - POST /api/account/addresses → 201, crea dirección
   - PATCH /api/account/addresses/[id] → 200, edita dirección
   - DELETE /api/account/addresses/[id] → 200, elimina dirección
   - POST /api/account/addresses/[id]/set-default → 200, marca default

2. **Validaciones funcionando:**
   - Campos obligatorios validados (full_name, country, city, address_line1)
   - Campos opcionales con límites (max length, regex)
   - UUID params validados

3. **Auth funcionando:**
   - Sin token → 401 en todos los endpoints
   - Token inválido → 401
   - Usuario autenticado → acceso solo a sus direcciones

4. **Ownership funcionando:**
   - Usuario A no ve direcciones de Usuario B (GET)
   - Usuario A no edita/elimina direcciones de Usuario B (403)

5. **Default address funcionando:**
   - Primera dirección → is_default: true automático
   - Nueva default → otras desmarcadas
   - DELETE default → otra marcada automáticamente
   - set-default → desmarque previo + marcado nuevo

6. **Tests seguridad PASS:**
   - Sin token → 401 ✅
   - Token inválido → 401 ✅
   - Cross-user access → 403/404 ✅
   - Modificar user_id ajeno → bloqueado ✅

7. **Documentación:**
   - Reporte final con endpoints, validaciones, tests

---

## 16. ESTIMACIÓN

### 16.1 Complejidad

**MEDIA** — CRUD estándar con lógica de negocio moderada (default address)

### 16.2 Tiempo Estimado

| Subfase | Alcance | Tiempo |
|---------|---------|--------|
| 5D.2A — GET + POST | Listar + crear direcciones | 1-2h |
| 5D.2B — PATCH + DELETE | Editar + eliminar direcciones | 1-2h |
| 5D.2C — SET-DEFAULT + Tests | Endpoint set-default + test suite completo | 1-2h |
| **TOTAL** | **Backend API completo** | **3-6h** |

### 16.3 Archivos

**Nuevos:** 6 archivos (3 routes, 1 types, 2 helpers opcionales)  
**Modificados:** 0

---

## 17. PRÓXIMOS PASOS

Una vez completada Fase 5D.2:

1. **Ejecutar Fase 5D.2A** — GET + POST
2. **Ejecutar Fase 5D.2B** — PATCH + DELETE
3. **Ejecutar Fase 5D.2C** — SET-DEFAULT + Tests
4. **Cerrar Fase 5D.2** con reporte completo
5. **Preparar scope Fase 5D.3** — UI Cliente `/account/addresses`

---

## 18. NOTAS FINALES

### 18.1 Decisiones de Diseño

- **Auth:** Cliente autenticado + RLS (más seguro, menos código)
- **Default address:** 2-step update (desmarcar → marcar) en vez de trigger DB
- **Validaciones:** Backend + frontend (defensa en profundidad)
- **Ownership:** RLS policies protegen automáticamente
- **Error 23505:** Retry con desmarque previo (raro, pero manejado)

### 18.2 Compatibilidad Futura

Esta fase prepara backend para:
- **Fase 5D.3:** UI cliente `/account/addresses`
- **Fase futura:** Checkout pre-llenado con dirección default
- **Fase futura:** Admin panel ver direcciones de clientes
- **Fase futura:** Integración con servicios de envío

**Pero NO implementa esas conexiones todavía.**

---

**ESTADO:** ⏸️ Propuesta pendiente de aprobación  
**SIGUIENTE ACCIÓN:** Esperar confirmación de Jhonatan para implementar Fase 5D.2A

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents
