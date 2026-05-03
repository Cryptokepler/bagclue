# FASE 5D — DIRECCIONES DE CLIENTE
**Fecha:** 2026-05-03  
**Estado:** Propuesta pendiente de aprobación  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce  

---

## 1. OBJETIVO

Implementar gestión completa de direcciones de envío para clientes registrados en el panel `/account/addresses`, permitiendo:

- Ver listado de direcciones guardadas
- Crear nueva dirección
- Editar dirección existente
- Eliminar dirección
- Marcar dirección como principal (default)
- Validación de una sola dirección principal por usuario

**Esta fase NO conecta direcciones con checkout ni órdenes.** Solo prepara el módulo para uso futuro.

---

## 2. RUTAS PROPUESTAS

### 2.1 Ruta Principal
- **`/account/addresses`** — Listado de direcciones del usuario logueado
  - Vista vacía si no tiene direcciones
  - Botón "Agregar dirección"
  - Cada dirección muestra: nombre, teléfono, dirección completa, badge "Principal" si `is_default=true`
  - Acciones por dirección: Editar, Eliminar, Marcar como principal

### 2.2 Ruta Opcional (Crear)
- **`/account/addresses/new`** — Formulario crear nueva dirección
  - Alternativa: modal inline en `/account/addresses` (menos navegación)

### 2.3 Edición
- **Opción A:** Modal inline en `/account/addresses` (recomendado — menos navegación, mejor UX)
- **Opción B:** Ruta `/account/addresses/[id]/edit`

**Recomendación:** Modal inline para crear/editar (mejor experiencia, menos rutas).

---

## 3. TABLA PROPUESTA: `customer_addresses`

### 3.1 Esquema Completo
```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  
  -- Datos de contacto
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Ubicación
  country TEXT NOT NULL DEFAULT 'México',
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  
  -- Dirección
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  references TEXT, -- Referencias de ubicación (e.g., "edificio azul, portón negro")
  
  -- Control
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_customer_profile_id ON customer_addresses(customer_profile_id);
CREATE INDEX idx_customer_addresses_is_default ON customer_addresses(user_id, is_default) WHERE is_default = true;
```

### 3.2 Campos Detallados

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | Sí | PK, auto-generado |
| `user_id` | UUID | Sí | FK a auth.users, ON DELETE CASCADE |
| `customer_profile_id` | UUID | No | FK a customer_profiles (si existe), ON DELETE SET NULL |
| `full_name` | TEXT | Sí | Nombre completo del destinatario |
| `phone` | TEXT | Sí | Teléfono de contacto (formato internacional recomendado) |
| `country` | TEXT | Sí | País (default México) |
| `state` | TEXT | Sí | Estado/Provincia |
| `city` | TEXT | Sí | Ciudad |
| `postal_code` | TEXT | Sí | Código postal |
| `address_line1` | TEXT | Sí | Calle y número |
| `address_line2` | TEXT | No | Apartamento, suite, piso (opcional) |
| `references` | TEXT | No | Referencias de ubicación física |
| `is_default` | BOOLEAN | Sí | Si es dirección principal (default false) |
| `created_at` | TIMESTAMPTZ | Sí | Fecha creación |
| `updated_at` | TIMESTAMPTZ | Sí | Última actualización |

### 3.3 Relaciones

- `user_id` → `auth.users(id)` — CASCADE DELETE (si usuario se borra, sus direcciones también)
- `customer_profile_id` → `customer_profiles(id)` — SET NULL (si perfil se borra, dirección persiste sin vínculo)

**Nota:** `customer_profile_id` es opcional. Si Bagclue tiene tabla `customer_profiles` separada de `auth.users`, se vincula. Si no existe, este campo puede omitirse.

---

## 4. REGLAS DE NEGOCIO

### 4.1 Seguridad
- **Cada cliente ve SOLO sus direcciones** (RLS por `user_id`)
- Usuario no autenticado → sin acceso
- Usuario A no puede ver/editar direcciones de Usuario B

### 4.2 Dirección Principal
- **Máximo una dirección `is_default=true` por usuario**
- Al marcar una dirección como principal, todas las demás del mismo usuario pasan a `is_default=false`
- Implementar lógica de toggle automático en backend

### 4.3 Operaciones
- **Crear:** Cliente puede crear N direcciones
- **Editar:** Solo sus propias direcciones
- **Eliminar:** Solo sus propias direcciones
- **Marcar principal:** Solo entre sus propias direcciones

### 4.4 Restricción de Fase
- **NO conectar con checkout** — esta fase solo crea el módulo
- **NO conectar con órdenes** — eso será en fase futura
- **NO conectar con layaways** — fuera de alcance

---

## 5. RLS NECESARIA

### 5.1 Políticas de Seguridad

```sql
-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuario solo ve sus direcciones
CREATE POLICY "Users can view their own addresses"
ON customer_addresses FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuario solo crea para sí mismo
CREATE POLICY "Users can create their own addresses"
ON customer_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuario solo edita sus direcciones
CREATE POLICY "Users can update their own addresses"
ON customer_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuario solo borra sus direcciones
CREATE POLICY "Users can delete their own addresses"
ON customer_addresses FOR DELETE
USING (auth.uid() = user_id);
```

### 5.2 Validación RLS
Confirmar en Supabase Dashboard → Authentication → Policies que:
- ✅ 4 policies activas (SELECT, INSERT, UPDATE, DELETE)
- ✅ Todas verifican `auth.uid() = user_id`
- ✅ No existen policies públicas ni con `true`

---

## 6. MIGRACIÓN PROPUESTA

### 6.1 Archivo
`supabase/migrations/024_customer_addresses.sql`

### 6.2 Contenido

```sql
-- Migration 024: Customer Addresses
-- Created: 2026-05-03
-- Phase: 5D

-- Create customer_addresses table
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  country TEXT NOT NULL DEFAULT 'México',
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  references TEXT,
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_customer_profile_id ON customer_addresses(customer_profile_id);
CREATE INDEX idx_customer_addresses_is_default ON customer_addresses(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own addresses"
ON customer_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses"
ON customer_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
ON customer_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
ON customer_addresses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**⚠️ IMPORTANTE:** Esta migración NO se ejecutará hasta aprobación de scope.

---

## 7. UI PROPUESTA

### 7.1 `/account/addresses` — Listado

**Estado Vacío:**
```
📦 Direcciones de Envío

Aún no tienes direcciones guardadas.
Agrega una para agilizar tus compras futuras.

[+ Agregar dirección]
```

**Estado Con Direcciones:**
```
📦 Direcciones de Envío

┌─────────────────────────────────────────────┐
│ 🏠 Juan Pérez                      [PRINCIPAL] │
│ +52 55 1234 5678                              │
│                                               │
│ Calle Reforma 123, Piso 4                     │
│ Col. Juárez, Ciudad de México                 │
│ CP 06600, México                              │
│ Ref: Edificio azul, portón negro              │
│                                               │
│ [Editar] [Eliminar]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🏢 María González (Oficina)                  │
│ +52 33 9876 5432                              │
│                                               │
│ Av. Chapultepec 456                           │
│ Guadalajara, Jalisco                          │
│ CP 44100, México                              │
│                                               │
│ [Marcar como principal] [Editar] [Eliminar]   │
└─────────────────────────────────────────────┘

[+ Agregar dirección]
```

### 7.2 Modal Crear/Editar

```
✏️ Nueva Dirección / Editar Dirección

Nombre completo *
[________________________]

Teléfono *
[+52] [___________________] (selector país + input)

País *
[México ▼]

Estado *
[________________________]

Ciudad *
[________________________]

Código Postal *
[________________________]

Calle y número *
[________________________]

Apartamento, suite, piso (opcional)
[________________________]

Referencias de ubicación (opcional)
[________________________]
ej: Entre calle X y Y, edificio azul

☑️ Marcar como dirección principal

[Cancelar]  [Guardar dirección]
```

### 7.3 Interacciones

**Eliminar:**
- Confirmación: "¿Eliminar esta dirección? No podrás recuperarla."
- Si es dirección principal → advertencia: "Esta es tu dirección principal. Al eliminarla deberás marcar otra como principal."

**Marcar Principal:**
- Toggle instantáneo: al marcar una, las demás se desmarcan automáticamente
- Sin confirmación (acción reversible)

---

## 8. VALIDACIONES

### 8.1 Frontend (UI)

| Campo | Validación |
|-------|-----------|
| `full_name` | No vacío, min 3 caracteres |
| `phone` | Formato válido (regex internacional o libphonenumber) |
| `country` | No vacío, dropdown preseleccionado |
| `state` | No vacío, min 3 caracteres |
| `city` | No vacío, min 3 caracteres |
| `postal_code` | No vacío, formato numérico (México: 5 dígitos) |
| `address_line1` | No vacío, min 5 caracteres |
| `address_line2` | Opcional, max 255 caracteres |
| `references` | Opcional, max 500 caracteres |

### 8.2 Backend (API)

- **Auth:** Verificar token válido (`createClient(cookies)`)
- **Ownership:** Verificar `user_id` coincide con `auth.uid()`
- **Default Toggle:** Si `is_default=true`, ejecutar UPDATE para desmarcar otras direcciones del mismo usuario
- **Existence:** Al editar/eliminar, verificar que la dirección existe y pertenece al usuario

### 8.3 Base de Datos

- **RLS:** 4 policies activas (SELECT, INSERT, UPDATE, DELETE)
- **Constraints:** NOT NULL en campos obligatorios
- **Foreign Keys:** user_id válido, customer_profile_id válido si no es NULL
- **Índices:** user_id indexado para queries rápidas

---

## 9. RIESGOS Y MITIGACIONES

### 9.1 Riesgo: Múltiples direcciones default
**Mitigación:**
- Índice parcial `idx_customer_addresses_is_default` (WHERE is_default = true) previene duplicados a nivel DB
- Backend verifica y desmarca otras direcciones antes de marcar nueva

### 9.2 Riesgo: Usuario borra última dirección y queda sin default
**Mitigación:**
- Permitir borrar última dirección (usuario puede no tener direcciones guardadas)
- Si checkout requiere dirección en futuro, validar allí (no en este módulo)

### 9.3 Riesgo: RLS mal configurada expone direcciones de otros usuarios
**Mitigación:**
- RLS policies explícitas en todas las operaciones (SELECT, INSERT, UPDATE, DELETE)
- Test manual: Usuario A no puede ver/editar direcciones de Usuario B
- Validación en script: `scripts/test-rls-addresses.mjs`

### 9.4 Riesgo: Formato de teléfono incompatible con envíos internacionales
**Mitigación:**
- Campo `phone` tipo TEXT (acepta cualquier formato)
- Validación frontend con librería internacional (react-phone-number-input o similar)
- Validación backend regex flexible (no bloquear formatos poco comunes)

### 9.5 Riesgo: País hardcodeado a México limita expansión
**Mitigación:**
- Campo `country` TEXT con default 'México' pero editable
- Dropdown de países en UI (usar librería country-list o similar)
- Preparado para validación de postal_code por país en futuro

---

## 10. SUBFASES RECOMENDADAS

### 10.1 Fase 5D.1 — DB y Backend (Fundación)
**Objetivo:** Crear tabla, RLS, API routes  
**Alcance:**
- Ejecutar migración 024
- Crear `/api/addresses` (GET: listar direcciones del usuario)
- Crear `/api/addresses` (POST: crear nueva dirección)
- Crear `/api/addresses/[id]` (PATCH: editar dirección)
- Crear `/api/addresses/[id]` (DELETE: eliminar dirección)
- Crear `/api/addresses/[id]/set-default` (POST: marcar como principal)
- Script validación RLS: `scripts/test-rls-addresses.mjs`

**Validación:**
- Test A: GET sin auth → 401
- Test B: GET con auth → 200, solo direcciones del usuario
- Test C: POST crear dirección → 201, aparece en listado
- Test D: PATCH editar dirección propia → 200
- Test E: DELETE eliminar dirección propia → 200
- Test F: POST set-default → 200, otras direcciones desmarcan
- Test G: Usuario A no puede ver/editar direcciones de Usuario B → 403
- RLS policies verificadas en Supabase Dashboard

**Archivos modificados:**
- `supabase/migrations/024_customer_addresses.sql` (nuevo)
- `src/app/api/addresses/route.ts` (nuevo)
- `src/app/api/addresses/[id]/route.ts` (nuevo)
- `src/app/api/addresses/[id]/set-default/route.ts` (nuevo)
- `scripts/test-rls-addresses.mjs` (nuevo)

**NO tocar:** checkout, webhook, Stripe, admin, órdenes, layaways

### 10.2 Fase 5D.2 — UI Cliente (Interfaz)
**Objetivo:** Implementar `/account/addresses` con listado, crear, editar, eliminar  
**Alcance:**
- Crear `/account/addresses/page.tsx` (listado + modal crear/editar)
- Componente `AddressCard.tsx` (tarjeta de dirección individual)
- Componente `AddressForm.tsx` (formulario crear/editar reutilizable)
- Modal confirmación eliminar
- Toggle marcar como principal (sin confirmación)
- Estado vacío ("Aún no tienes direcciones")
- Validación frontend (libphonenumber, validaciones campos)

**Validación:**
- UI muestra solo direcciones del usuario logueado ✅
- Crear dirección → aparece en listado ✅
- Editar dirección → cambios persisten ✅
- Eliminar dirección → desaparece de listado ✅
- Marcar principal → badge "PRINCIPAL" cambia, otras desmarcan ✅
- Estado vacío se muestra correctamente ✅
- Validación frontend previene submit con datos inválidos ✅

**Archivos modificados:**
- `src/app/account/addresses/page.tsx` (nuevo)
- `src/components/AddressCard.tsx` (nuevo)
- `src/components/AddressForm.tsx` (nuevo)
- `src/types/address.ts` (nuevo — tipos TypeScript)

**NO tocar:** checkout, webhook, Stripe, admin, órdenes, layaways

### 10.3 Fase 5D.3 — Validación Final
**Objetivo:** Test completo extremo a extremo  
**Alcance:**
- Script automatizado: `scripts/test-addresses-e2e.mjs`
- Validación manual UI: crear, editar, eliminar, marcar principal
- Validación RLS: usuario A no ve direcciones de usuario B
- Validación DB: constraints, índices, foreign keys
- Validación Performance: queries con índices (EXPLAIN ANALYZE)
- Documentación cierre fase

**Checklist:**
- [ ] DB: tabla creada, RLS activa, índices creados
- [ ] Backend: 5 endpoints funcionando (GET, POST, PATCH, DELETE, set-default)
- [ ] RLS: Usuario A no accede a direcciones de Usuario B
- [ ] UI: Listado, crear, editar, eliminar, marcar principal funcionan
- [ ] Validaciones frontend: campos obligatorios, formatos válidos
- [ ] Toggle default: solo una dirección principal por usuario
- [ ] Performance: queries indexadas (<50ms promedio)
- [ ] Documentación: FASE_5D_CIERRE_FINAL.md

**Archivos modificados:**
- `scripts/test-addresses-e2e.mjs` (nuevo)
- `bagclue/FASE_5D_CIERRE_FINAL.md` (nuevo)

---

## 11. ENTREGABLES

### 11.1 Base de Datos
- ✅ Migración `024_customer_addresses.sql`
- ✅ Tabla `customer_addresses` con RLS
- ✅ 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ 3 índices (user_id, customer_profile_id, is_default)
- ✅ Trigger `updated_at`

### 11.2 Backend
- ✅ `/api/addresses` (GET, POST)
- ✅ `/api/addresses/[id]` (PATCH, DELETE)
- ✅ `/api/addresses/[id]/set-default` (POST)
- ✅ Validaciones auth, ownership, default toggle

### 11.3 Frontend
- ✅ `/account/addresses` (listado + modal crear/editar)
- ✅ Componente `AddressCard.tsx`
- ✅ Componente `AddressForm.tsx`
- ✅ Validaciones frontend (libphonenumber, campos obligatorios)
- ✅ Estado vacío

### 11.4 Testing
- ✅ Script RLS: `test-rls-addresses.mjs`
- ✅ Script E2E: `test-addresses-e2e.mjs`
- ✅ Validación manual UI

### 11.5 Documentación
- ✅ `FASE_5D_SCOPE_DIRECCIONES_CLIENTE.md` (este documento)
- ✅ `FASE_5D_CIERRE_FINAL.md` (al completar fase)

---

## 12. RESTRICCIONES DE FASE

### ⛔ PROHIBIDO EN FASE 5D

- **NO tocar checkout** (ni `/app/checkout`, ni `create-checkout-session`, ni webhook checkout)
- **NO tocar Stripe** (ni webhooks, ni sessions, ni payment intents)
- **NO tocar órdenes** (ni `orders`, ni `order_items`, ni tracking)
- **NO tocar layaways** (ni `layaways`, ni `layaway_payments`, ni webhook saldo)
- **NO tocar admin** (ni `/admin`, ni dashboard admin)
- **NO conectar direcciones con checkout** — eso será en fase futura
- **NO modificar tablas existentes** — solo crear `customer_addresses`

### ✅ PERMITIDO EN FASE 5D

- Crear tabla `customer_addresses`
- Crear API routes `/api/addresses/*`
- Crear UI `/account/addresses`
- Crear componentes relacionados (AddressCard, AddressForm)
- Crear scripts de testing
- Crear tipos TypeScript en `src/types/address.ts`

---

## 13. DEPENDENCIAS

### 13.1 Prerequisitos
- ✅ Sistema de autenticación funcionando (magic link)
- ✅ Panel `/account` activo
- ✅ RLS policies en `customer_profiles` (si existe tabla)

### 13.2 No Requiere
- ❌ Integración con Stripe
- ❌ Integración con checkout
- ❌ Integración con órdenes
- ❌ Integración con layaways

### 13.3 Bloqueantes
- Ninguno (fase independiente)

---

## 14. CRITERIOS DE ACEPTACIÓN

### ✅ Fase 5D completa cuando:

1. **DB:**
   - Tabla `customer_addresses` creada con todos los campos
   - RLS activa con 4 policies (SELECT, INSERT, UPDATE, DELETE)
   - Índices creados y funcionando

2. **Backend:**
   - 5 endpoints funcionando (GET, POST, PATCH, DELETE, set-default)
   - Auth verificado en todos los endpoints
   - Ownership verificado (usuario solo accede a sus direcciones)
   - Toggle default funciona (solo una dirección principal por usuario)

3. **Frontend:**
   - Listado de direcciones muestra solo las del usuario logueado
   - Crear dirección funciona (modal + submit + aparece en listado)
   - Editar dirección funciona (modal pre-llenado + cambios persisten)
   - Eliminar dirección funciona (confirmación + desaparece de listado)
   - Marcar principal funciona (toggle + badge cambia + otras desmarcan)
   - Estado vacío se muestra cuando usuario no tiene direcciones

4. **Testing:**
   - Script RLS valida aislamiento entre usuarios
   - Script E2E valida flujo completo CRUD
   - Validación manual UI sin errores

5. **Seguridad:**
   - Usuario A no puede ver/editar direcciones de Usuario B
   - RLS policies verificadas en Supabase Dashboard

6. **Documentación:**
   - `FASE_5D_CIERRE_FINAL.md` con reporte completo

---

## 15. ESTIMACIÓN

### 15.1 Complejidad
**MEDIA-BAJA** — CRUD estándar sin lógica de negocio compleja

### 15.2 Tiempo Estimado

| Subfase | Alcance | Tiempo Estimado |
|---------|---------|-----------------|
| 5D.1 — DB + Backend | Migración + 5 endpoints + RLS + testing | 2-3 horas |
| 5D.2 — UI Cliente | Listado + modal + componentes + validaciones | 3-4 horas |
| 5D.3 — Validación Final | Testing E2E + validación manual + docs | 1-2 horas |
| **TOTAL** | **Fase 5D completa** | **6-9 horas** |

### 15.3 Archivos Nuevos
- 1 migración SQL
- 3 API routes (addresses, addresses/[id], addresses/[id]/set-default)
- 1 página UI (addresses/page.tsx)
- 2 componentes (AddressCard, AddressForm)
- 1 archivo tipos (address.ts)
- 2 scripts testing (test-rls-addresses, test-addresses-e2e)
- 2 documentos (scope, cierre)

**Total:** ~12 archivos nuevos

### 15.4 Archivos Modificados
- Ninguno (fase aislada, no toca código existente)

---

## 16. PRÓXIMOS PASOS

### Una vez aprobado FASE 5D:

1. **Ejecutar Fase 5D.1** — DB + Backend + RLS + Testing
2. **Ejecutar Fase 5D.2** — UI Cliente + Validaciones
3. **Ejecutar Fase 5D.3** — Validación Final + Docs
4. **Cerrar Fase 5D** con reporte completo
5. **Preparar scope FASE 5E** — Perfil / Soporte (siguiente prioridad)

---

## 17. NOTAS FINALES

### 17.1 Decisiones de Diseño

- **Modal vs Ruta separada:** Modal inline preferido (menos navegación, mejor UX)
- **País hardcodeado:** Default México pero editable (preparado para expansión)
- **customer_profile_id:** Opcional, depende de si Bagclue ya tiene esta tabla
- **RLS vs Service Role:** RLS en todas las operaciones (mejor seguridad)
- **Teléfono internacional:** Campo TEXT + validación frontend (libphonenumber)

### 17.2 Compatibilidad Futura

Esta fase prepara el módulo de direcciones para:
- **Checkout:** Pre-llenar dirección en checkout (fase futura)
- **Órdenes:** Vincular orden con dirección de envío (fase futura)
- **Admin:** Ver direcciones de clientes (fase futura)
- **Layaways:** Dirección de entrega al liquidar (fase futura)

**Pero NO implementa esas conexiones todavía.**

---

**ESTADO:** ⏸️ Propuesta pendiente de aprobación  
**SIGUIENTE ACCIÓN:** Esperar confirmación de Jhonatan para implementar Fase 5D.1

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents
