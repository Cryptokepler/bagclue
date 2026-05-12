# ADMIN CLIENTES MVP.2 - GESTIÓN DE CLIENTES (SCOPE)

**Fecha:** 2026-05-12  
**Autor:** Kepler  
**Cliente:** Jhonatan (Bagclue)  
**Objetivo:** Permitir edición, archivado y gestión operativa de clientes  
**Estado:** DISEÑO (NO implementar hasta aprobación)

---

## CONTEXTO

**MVP.1 completado:** ✅ Lista de clientes + dashboard + detalle (solo lectura)  
**MVP.2 objetivo:** Gestión operativa (editar, archivar, borrar con restricciones)

---

## 1. AUDITORÍA DE SCHEMA ACTUAL

### 1.1 Tabla `customer_profiles` (actual)

**Columnas existentes:**
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES auth.users(id) UNIQUE
email                   TEXT NOT NULL UNIQUE
name                    TEXT
phone                   TEXT
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
phone_country_code      TEXT (agregado en migration 018)
phone_country_iso       TEXT (agregado en migration 018)
welcome_email_sent_at   TIMESTAMPTZ (agregado en migration 018)
```

**Columnas NO existentes (requeridas para MVP.2):**
- ❌ `internal_notes` TEXT
- ❌ `is_active` BOOLEAN
- ❌ `archived_at` TIMESTAMPTZ
- ❌ `tags` TEXT[] o JSONB
- ❌ `customer_status` TEXT

### 1.2 Tabla `customer_addresses` (actual)

**Columnas existentes:**
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES auth.users(id)
full_name             TEXT
phone_country_code    TEXT
phone_country_iso     TEXT
phone                 TEXT
country               TEXT
state                 TEXT
city                  TEXT
postal_code           TEXT
address_line1         TEXT
address_line2         TEXT
delivery_references   TEXT
is_default            BOOLEAN
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

**✅ No requiere cambios para MVP.2**

### 1.3 Relaciones críticas (NO TOCAR)

- `orders.user_id` → `customer_profiles.user_id`
- `orders.customer_email` → `customer_profiles.email`
- `layaways.user_id` → `customer_profiles.user_id`
- `layaways.customer_email` → `customer_profiles.email`
- `payment_transactions` → `orders` → cliente
- `payment_transactions` → `layaways` → cliente

**⚠️ RESTRICCIÓN ABSOLUTA:** NO borrar clientes con historial comercial

---

## 2. CAMPOS EDITABLES (SIN MIGRATION)

### Campos que SE PUEDEN editar sin migration:

1. **`customer_profiles.name`** ✅
   - Tipo: TEXT
   - Editable desde admin
   - No afecta relaciones

2. **`customer_profiles.phone`** ✅
   - Tipo: TEXT
   - Editable desde admin
   - No afecta relaciones

3. **`customer_profiles.phone_country_code`** ✅
   - Tipo: TEXT
   - Editable desde admin

4. **`customer_profiles.phone_country_iso`** ✅
   - Tipo: TEXT
   - Editable desde admin

### Campos que NO SE DEBEN editar:

1. **`customer_profiles.email`** ❌
   - **Motivo:** Se usa como identificador único para clientes guest
   - **Motivo:** FK en orders.customer_email, layaways.customer_email
   - **Riesgo:** Romper relaciones históricas
   - **Decisión MVP.2:** NO permitir editar email
   - **Futuro MVP.3:** Si es crítico, implementar migración de email con actualización de orders/layaways relacionados

2. **`customer_profiles.user_id`** ❌
   - FK a auth.users
   - No tocar

3. **`customer_profiles.created_at`** ❌
   - Auditoría

---

## 3. MIGRATION NECESARIA PARA MVP.2

### 3.1 Agregar columnas a `customer_profiles`

```sql
-- Migration 021: Admin Clientes MVP.2 - Gestión operativa
-- Date: 2026-05-12
-- Purpose: Agregar campos para gestión de clientes (notas, archivado)

-- Agregar notas internas (solo visible para admin)
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS internal_notes TEXT NULL;

-- Agregar flag de archivado (soft delete)
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

-- Agregar índice para filtrar archivados
CREATE INDEX IF NOT EXISTS idx_customer_profiles_archived_at 
ON customer_profiles(archived_at);

-- Comentarios para documentación
COMMENT ON COLUMN customer_profiles.internal_notes IS 'Notas internas del admin (NO visible para clientes)';
COMMENT ON COLUMN customer_profiles.archived_at IS 'Timestamp de archivado (NULL = activo)';
```

**✅ Migration segura:**
- Columnas opcionales (NULL)
- No rompe funcionalidad existente
- Índice para performance
- Backward compatible

### 3.2 Tags (OPCIONALES - postponer a MVP.3)

**Opción A:** Campo simple (MVP.2)
```sql
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS tags TEXT NULL;
-- Formato: "VIP,Mayorista,Problema" (separado por comas)
```

**Opción B:** Tabla dedicada (MVP.3)
```sql
CREATE TABLE customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Decisión recomendada:** Postponer tags a MVP.3. Usar `internal_notes` temporalmente.

---

## 4. PROPUESTA MVP.2

### A. FICHA COMPLETA DE CLIENTE

**Ruta:** `/admin/clientes/[id]` (ya existe en MVP.1)

**Agregar sección:** "Gestión del Cliente"

**Layout propuesto:**

```
┌─────────────────────────────────────────────────────────┐
│ PERFIL DEL CLIENTE                                      │
├─────────────────────────────────────────────────────────┤
│ Nombre:        [Jhonatan Venegas]          [Editar]     │
│ Email:         jhonatanvenegas@...         (No editable)│
│ Teléfono:      [+34 722385452]            [Editar]      │
│ Tipo:          Cliente Registrado                       │
│ Fecha registro: 30 Abr 2026                             │
│ Última compra:  10 May 2026                             │
│ Total comprado: $189,000 MXN                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NOTAS INTERNAS (Solo visible para admin)               │
├─────────────────────────────────────────────────────────┤
│ [Textarea editable]                                     │
│ "Cliente VIP, mayorista. Atención especial en envíos." │
│                                              [Guardar]  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ACCIONES                                                │
├─────────────────────────────────────────────────────────┤
│ [Archivar cliente]                                      │
│ [Eliminar cliente] (solo si no tiene historial)        │
└─────────────────────────────────────────────────────────┘

[Resumen comercial - ya existe MVP.1]
[Pedidos - ya existe MVP.1]
[Apartados - ya existe MVP.1]
[Direcciones - ya existe MVP.1]
```

---

### B. EDITAR CLIENTE

**Modal o formulario inline:**

**Campos editables:**
- ✅ Nombre (TEXT)
- ✅ Teléfono (TEXT + country code + country ISO)
- ✅ Notas internas (TEXTAREA)
- ❌ Email (NO editable en MVP.2)

**Validaciones:**
- Nombre: opcional (puede ser NULL)
- Teléfono: opcional, validar formato si se ingresa
- Notas: máximo 1000 caracteres

**API:**
```
PATCH /api/admin/clientes/[id]
Body: {
  name?: string
  phone?: string
  phone_country_code?: string
  phone_country_iso?: string
  internal_notes?: string
}
```

**Seguridad:**
- ✅ Solo admin autenticado (`isAuthenticated()`)
- ✅ Validar que cliente existe
- ✅ Actualizar `updated_at` automáticamente (trigger existente)
- ✅ Log de cambios (opcional para MVP.3)

---

### C. ARCHIVAR CLIENTE

**Acción:** "Archivar cliente"

**Flujo:**
1. Admin click "Archivar cliente"
2. Modal de confirmación:
   ```
   ⚠️ ¿Archivar a [Nombre del cliente]?
   
   El cliente no se eliminará, pero:
   - No aparecerá en el listado principal
   - Se podrá ver con filtro "Archivados"
   - Su historial permanece intacto
   
   [Cancelar] [Archivar]
   ```
3. API: `PATCH /api/admin/clientes/[id]/archive`
4. Backend: `UPDATE customer_profiles SET archived_at = NOW() WHERE id = ?`
5. Redirect a `/admin/clientes`

**Reglas:**
- ✅ Se puede archivar cualquier cliente (con o sin historial)
- ✅ Historial de pedidos/pagos permanece intacto
- ✅ No afecta tracking públicos (órdenes siguen visibles)
- ✅ Cliente archivado NO aparece en lista principal (filtro: `WHERE archived_at IS NULL`)
- ✅ Cliente archivado SÍ aparece con filtro "Archivados"

**Desarchivar:**
- Acción: "Activar cliente"
- Backend: `UPDATE customer_profiles SET archived_at = NULL WHERE id = ?`

---

### D. BORRAR CLIENTE

**Acción:** "Eliminar cliente"

**Regla estricta:** Solo permitir si **NO** tiene:
- ❌ Orders (`orders.user_id` o `orders.customer_email`)
- ❌ Payment transactions relacionadas
- ❌ Layaways (`layaways.user_id` o `layaways.customer_email`)
- ❌ Layaway payments relacionados

**Flujo:**

1. Admin click "Eliminar cliente"
2. Backend valida:
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM orders 
      WHERE user_id = ? OR customer_email = ?) AS order_count,
     (SELECT COUNT(*) FROM layaways 
      WHERE user_id = ? OR customer_email = ?) AS layaway_count
   ```
3. **Si tiene historial:**
   - Mostrar error:
     ```
     ❌ No se puede eliminar
     
     Este cliente tiene:
     - X pedidos
     - Y apartados
     
     Puedes archivarlo, pero no eliminarlo.
     
     [Cerrar] [Archivar en su lugar]
     ```
4. **Si NO tiene historial:**
   - Modal de confirmación:
     ```
     ⚠️ ¿Eliminar permanentemente a [Nombre]?
     
     Esta acción NO se puede deshacer.
     Se eliminarán:
     - Perfil del cliente
     - Direcciones guardadas
     
     [Cancelar] [Eliminar permanentemente]
     ```
5. API: `DELETE /api/admin/clientes/[id]`
6. Backend:
   ```sql
   -- Eliminar direcciones primero (FK constraint)
   DELETE FROM customer_addresses WHERE user_id = ?;
   
   -- Eliminar perfil
   DELETE FROM customer_profiles WHERE id = ? AND user_id = ?;
   ```

**Seguridad:**
- ✅ Validación doble (frontend + backend)
- ✅ Transaction (rollback si falla)
- ✅ Soft delete preferido (archivar mejor que borrar)

---

### E. GUEST CLIENTS (Clientes sin cuenta)

**Problema:** Clientes guest NO tienen `customer_profile`, solo aparecen en `orders.customer_email`

**Propuesta MVP.2:**

**Opción A - Crear profile temporal (recomendado):**
- Al editar cliente guest, crear `customer_profile` automáticamente
- `user_id` = NULL
- `email` = customer_email del order
- `name` = customer_name del order
- `phone` = customer_phone del order
- Permite agregar notas internas
- Permite archivar

**Opción B - No permitir editar guest:**
- Mostrar información como readonly
- Solo permitir ver historial
- NO permitir editar/archivar
- Más simple pero menos flexible

**Decisión recomendada:** **Opción A** (crear profile temporal)

**Implementación:**
```typescript
// API: PATCH /api/admin/clientes/[email]
// Si [email] no tiene customer_profile:
const { data: profile } = await supabase
  .from('customer_profiles')
  .insert({
    email: decodeURIComponent(email),
    name: req.body.name,
    phone: req.body.phone,
    internal_notes: req.body.internal_notes
  })
  .select()
  .single()
```

---

### F. NOTAS INTERNAS

**Campo:** `customer_profiles.internal_notes` (TEXT NULL)

**Características:**
- ✅ Solo visible para admin
- ✅ NO visible en customer panel
- ✅ NO visible en emails
- ✅ Editable desde `/admin/clientes/[id]`
- ✅ Máximo 1000 caracteres (validar frontend + backend)
- ✅ Formato libre (texto plano o markdown simple)

**UI:**
```tsx
<div className="bg-white/5 border border-[#FF69B4]/20 p-6">
  <h3 className="text-white font-medium mb-2">
    Notas Internas (Solo admin)
  </h3>
  <textarea
    value={internalNotes}
    onChange={(e) => setInternalNotes(e.target.value)}
    maxLength={1000}
    className="w-full h-32 bg-white/10 text-white border border-white/20 p-3"
    placeholder="Ej: Cliente VIP, mayorista. Atención especial en envíos."
  />
  <div className="flex justify-between items-center mt-2">
    <span className="text-xs text-gray-500">
      {internalNotes.length}/1000
    </span>
    <button onClick={handleSaveNotes}>
      Guardar notas
    </button>
  </div>
</div>
```

**API:**
```
PATCH /api/admin/clientes/[id]/notes
Body: { internal_notes: string }
```

---

### G. TAGS SIMPLES (POSTPONER A MVP.3)

**Motivo para postponer:**
- MVP.2 ya agrega bastante funcionalidad
- `internal_notes` es suficiente temporalmente
- Tags requieren UI más compleja (multiselect, badges, etc.)
- Mejor implementar bien en MVP.3

**Alternativa temporal:** Usar keywords en `internal_notes`:
- "VIP"
- "Mayorista"
- "Problema"
- "Atención especial"
- "Recurrente"

**Búsqueda:** `WHERE internal_notes ILIKE '%VIP%'`

---

### H. SEGURIDAD

**Restricciones:**
- ✅ Solo admin autenticado puede:
  - Editar cliente
  - Archivar cliente
  - Eliminar cliente
  - Ver notas internas
- ✅ NO exponer en customer panel (`/account`)
- ✅ NO exponer en APIs públicas
- ✅ Validar permisos en cada API route

**RLS (Row Level Security):**
- **NO requiere cambios** para MVP.2
- `internal_notes` NO debe ser visible para clientes
- Usar `supabaseAdmin` (service role) en API routes admin

**Logging (opcional para MVP.3):**
```sql
CREATE TABLE customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id),
  action TEXT NOT NULL, -- 'update', 'archive', 'delete'
  changes JSONB, -- {name: {old, new}, phone: {old, new}}
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### I. NO TOCAR (CONFIRMADO)

- ❌ Pagos (payment_transactions)
- ❌ Stripe integration
- ❌ Bank transfer flow
- ❌ Email templates
- ❌ Checkout flow
- ❌ Catálogo (products, order_items)
- ❌ Inventario
- ❌ RLS policies (salvo si se requiere para nuevas columnas)
- ❌ Órdenes históricas (orders, layaways)
- ❌ Email del cliente (customer_profiles.email) - NO editable

**Razón:** Gestión de clientes NO debe afectar transacciones completadas

---

## 5. ARQUITECTURA PROPUESTA

### 5.1 Rutas

#### Lista de clientes (ya existe MVP.1)
```
/admin/clientes
```
**Cambios MVP.2:**
- ✅ Agregar filtro "Archivados" (WHERE archived_at IS NOT NULL)
- ✅ Mostrar badge "Archivado" en tabla

#### Detalle de cliente (ya existe MVP.1)
```
/admin/clientes/[id]
```
**Cambios MVP.2:**
- ✅ Agregar sección "Gestión del Cliente"
- ✅ Formulario editar perfil
- ✅ Textarea notas internas
- ✅ Botones "Archivar" y "Eliminar"

### 5.2 API Routes

#### Editar cliente
```
PATCH /api/admin/clientes/[id]
Body: {
  name?: string
  phone?: string
  phone_country_code?: string
  phone_country_iso?: string
  internal_notes?: string
}
Response: { success: true, cliente: Cliente }
```

#### Archivar cliente
```
PATCH /api/admin/clientes/[id]/archive
Body: {} (vacío)
Response: { success: true, archived_at: string }
```

#### Desarchivar cliente
```
PATCH /api/admin/clientes/[id]/unarchive
Body: {} (vacío)
Response: { success: true, archived_at: null }
```

#### Eliminar cliente
```
DELETE /api/admin/clientes/[id]
Body: {} (vacío)
Response: { success: true } o { error: string, hasHistory: boolean }
```

---

## 6. COMPONENTES NUEVOS

```
src/components/admin/clientes/
├── EditClienteForm.tsx          # Formulario editar perfil
├── ClienteNotesSection.tsx      # Notas internas
├── ClienteActionsSection.tsx    # Archivar/Eliminar
└── ClienteArchivedBadge.tsx     # Badge "Archivado"
```

---

## 7. TIPOS TYPESCRIPT

```typescript
// Agregar a /types/admin-clientes.ts

export interface ClienteUpdate {
  name?: string | null
  phone?: string | null
  phone_country_code?: string | null
  phone_country_iso?: string | null
  internal_notes?: string | null
}

export interface ClienteWithManagement extends Cliente {
  internal_notes: string | null
  archived_at: string | null
  can_delete: boolean // true si no tiene historial
}
```

---

## 8. TESTING PLAN

### 8.1 Tests de edición

1. **Editar nombre:** Cambiar nombre → guardar → refrescar → validar cambio
2. **Editar teléfono:** Cambiar phone → guardar → validar formato
3. **Editar notas:** Agregar nota → guardar → refrescar → validar nota visible
4. **Validación max length:** Intentar nota >1000 chars → error
5. **Cliente guest:** Editar guest → crear profile automático → validar

### 8.2 Tests de archivado

1. **Archivar activo:** Archivar cliente → desaparece de lista principal
2. **Ver archivados:** Filtro "Archivados" → cliente aparece
3. **Desarchivar:** Activar cliente → vuelve a lista principal
4. **Historial preservado:** Archivar → validar pedidos/pagos siguen visibles

### 8.3 Tests de borrado

1. **Con historial:** Intentar borrar cliente con pedidos → error + mensaje
2. **Sin historial:** Borrar cliente sin pedidos → confirmación → eliminado
3. **Direcciones:** Validar que direcciones se borran en cascada
4. **Profile temporal guest:** Crear profile guest → borrar → validado

### 8.4 Tests de seguridad

1. **Sin sesión admin:** Intentar editar sin login → 401
2. **Customer panel:** Validar que notas NO son visibles en `/account`
3. **API pública:** Validar que notas NO se exponen en APIs públicas
4. **SQL injection:** Intentar inyección SQL en notas → sanitizado

---

## 9. RIESGOS IDENTIFICADOS

### 9.1 Edición de email (postponed)

**Riesgo:** Si permitimos editar email, romper relaciones en orders/layaways

**Mitigación MVP.2:** NO permitir editar email

**Futuro MVP.3:** Si es crítico:
```sql
-- Transaction para cambiar email
BEGIN;
  UPDATE customer_profiles SET email = 'new@example.com' WHERE id = ?;
  UPDATE orders SET customer_email = 'new@example.com' WHERE customer_email = 'old@example.com';
  UPDATE layaways SET customer_email = 'new@example.com' WHERE customer_email = 'old@example.com';
COMMIT;
```

### 9.2 Borrado accidental

**Riesgo:** Admin borra cliente equivocado

**Mitigación:**
- ✅ Confirmación modal obligatoria
- ✅ Validación estricta (solo si sin historial)
- ✅ Preferir archivar sobre borrar
- ✅ (Futuro) Log de auditoría

### 9.3 Performance con clientes archivados

**Riesgo:** Consultas lentas si hay muchos archivados

**Mitigación:**
- ✅ Índice en `archived_at`
- ✅ Filtro por defecto: `WHERE archived_at IS NULL`
- ✅ Query archivados por separado (con filtro explícito)

### 9.4 Notas sensibles

**Riesgo:** Notas internas con información sensible accesible por todos los admins

**Mitigación:**
- ✅ Solo visible para admin autenticado
- ✅ (Futuro) Permisos granulares (admin vs super-admin)
- ✅ Educar a admins sobre qué NO poner en notas

---

## 10. ESTIMACIÓN

### MVP.2 Completo (con migration):

**Tiempo estimado:** 1-2 días

**Desglose:**
- **Migration 021:** 30 min (crear + probar)
- **API Routes:** 2-3 horas (PATCH, DELETE, archive)
- **Componentes frontend:** 3-4 horas (form, notas, actions)
- **Integración detalle cliente:** 1-2 horas
- **Testing:** 2-3 horas
- **QA manual:** 1 hora

**Día 1:**
- Migration 021
- API routes (editar, archivar, borrar)
- Componente EditClienteForm
- Componente ClienteNotesSection

**Día 2:**
- Componente ClienteActionsSection
- Integración en detalle cliente
- Filtro archivados en lista
- Testing + QA

---

## 11. MIGRATION ROLLBACK (si es necesario)

```sql
-- Rollback Migration 021
ALTER TABLE customer_profiles DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE customer_profiles DROP COLUMN IF EXISTS archived_at;
DROP INDEX IF EXISTS idx_customer_profiles_archived_at;
```

---

## 12. ENTREGABLES

### 12.1 Documentación
- ✅ Este documento (ADMIN_CLIENTES_MVP2_SCOPE.md)
- ⏳ API documentation (después de implementación)

### 12.2 Código (cuando se apruebe)
- Migration 021
- 4 API routes (editar, archivar, desarchivar, borrar)
- 4 componentes frontend
- Types TypeScript actualizados
- Tests

### 12.3 QA
- Test plan ejecutado
- Validación de seguridad
- Reporte de bugs (si los hay)

---

## 13. PRÓXIMOS PASOS

1. **Revisión de este scope** (Jhonatan)
2. **Decisiones pendientes:**
   - ¿Aprobar migration 021?
   - ¿Crear profiles para guests al editar? (Opción A vs B)
   - ¿Postponer tags a MVP.3?
   - ¿Implementar logging de auditoría en MVP.2 o MVP.3?
3. **Aprobación final**
4. **Implementación**
5. **QA manual**
6. **Deploy a producción**

---

## 14. DECISIONES RECOMENDADAS

**Kepler recomienda:**

1. ✅ **Migration 021:** Ejecutar (segura, backward compatible)
2. ✅ **Editar email:** NO en MVP.2 (demasiado riesgoso)
3. ✅ **Guest clients:** Opción A (crear profile temporal) - más flexible
4. ✅ **Tags:** Postponer a MVP.3 - usar `internal_notes` temporalmente
5. ✅ **Borrar:** Solo si sin historial (regla estricta)
6. ✅ **Archivar:** Preferir sobre borrar (soft delete)
7. ✅ **Logging auditoría:** Postponer a MVP.3 - no crítico

---

**Status:** ⏳ ESPERANDO APROBACIÓN  
**Autor:** Kepler  
**Fecha:** 2026-05-12  
**Versión:** 1.0
