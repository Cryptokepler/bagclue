# FASE 5E — PERFIL / SOPORTE CLIENTE

**Fecha:** 2026-05-03  
**Proyecto:** Bagclue - E-commerce Lujo  
**Fase:** 5E (Customer Profile & Support)  
**Estado:** SCOPE PLANNING (NO implementado)

---

## OBJETIVO

Completar el panel cliente con una sección de perfil y soporte en una sola ruta.

**Ruta:** `/account/profile`

**Funcionalidades:**
1. ✅ Mostrar datos del perfil (email, name, phone, fecha registro)
2. ✅ Editar nombre y teléfono
3. ✅ Selector de país/código telefónico internacional
4. ✅ Sección de soporte Bagclue (WhatsApp, Instagram, email, ayuda)

**NO incluye:** Cambio password, eliminar cuenta, chat interno, tickets, devoluciones, facturación, notificaciones

---

## AUDITORÍA ESTADO ACTUAL

### Tabla `customer_profiles`

**Migración:** `supabase/migrations/015_customer_accounts_phase1.sql`

**Estructura actual:**
```sql
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customer_profiles_user_id_key UNIQUE(user_id),
  CONSTRAINT customer_profiles_email_key UNIQUE(email)
);
```

**Columnas:**
- `id` - UUID PK
- `user_id` - FK a auth.users (UNIQUE)
- `email` - TEXT NOT NULL UNIQUE
- `name` - TEXT nullable
- `phone` - TEXT nullable ⚠️ (sin country_code/iso separados)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ (auto-updated con trigger)

**RLS Policies:**
- ✅ `Users can view own profile` (SELECT WHERE auth.uid() = user_id)
- ✅ `Users can update own profile` (UPDATE WHERE auth.uid() = user_id)

**Trigger:**
- ✅ `on_auth_user_created` - Auto-crea profile con email al crear usuario
- ✅ `update_customer_profiles_updated_at` - Auto-actualiza updated_at

### Endpoint API existente

**GET `/api/customer/profile`:**
- ✅ Existe (src/app/api/customer/profile/route.ts)
- Retorna: `{ user: { id, email }, profile: { id, user_id, email, name, phone, created_at, updated_at } }`
- Auth: supabaseCustomer.auth.getUser()
- RLS: SELECT policy auto-filtra por user_id

**UPDATE/PATCH endpoint:**
- ❌ NO existe (necesita crearse)

### Frontend

**Página `/account/profile`:**
- ❌ NO existe (necesita crearse)

**Componentes de soporte:**
- ❌ NO existen (necesitan crearse)

---

## PROBLEMA IDENTIFICADO: CAMPO PHONE

**Situación actual:**
- `phone` es TEXT simple sin estructura
- NO hay `phone_country_code` ni `phone_country_iso` separados

**Opciones:**

### OPCIÓN A: Migración DB (agregar columnas phone_country_code/iso)
✅ **Recomendada** - Consistente con `customer_addresses`

**Pros:**
- Consistencia con addresses (ya tiene phone_country_code + phone_country_iso)
- Validación estructurada
- Mejor para futura integración internacional

**Contras:**
- Requiere migración DB (viola restricción "no tocar DB schema")
- Datos existentes necesitan migración

### OPCIÓN B: Guardar phone completo como texto
❌ **No recomendada** - Pierde estructura

**Ejemplo:** `+52 (MX) 5512345678` como TEXT

**Pros:**
- NO requiere migración
- Simple de implementar

**Contras:**
- Inconsistente con addresses
- Difícil validar formato
- Difícil extraer country code después

### OPCIÓN C: Guardar JSON en phone
⚠️ **Posible pero no ideal**

**Ejemplo:** `{"code": "+52", "iso": "MX", "number": "5512345678"}`

**Pros:**
- NO requiere migración DB

**Contras:**
- Queries complejas
- Validación más difícil
- Inconsistente con addresses

---

## DECISIÓN RECOMENDADA

**OPCIÓN A: Migración DB controlada**

**Razones:**
1. Consistencia con `customer_addresses` (ya tiene phone_country_code/iso)
2. Mejor UX (selector país, validación)
3. Preparado para futuro internacional
4. Datos estructurados > texto plano

**Migración propuesta:**
```sql
-- Migration 026: Add phone country fields to customer_profiles

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_iso TEXT;

-- Migrar datos existentes (si phone tiene formato +XX ...)
-- Se puede hacer manualmente o con script según data real
```

**Impacto:**
- ✅ NO rompe código existente (columnas nullable)
- ✅ Endpoint GET sigue funcionando (nuevas columnas se retornan como null si vacías)
- ⚠️ Requiere aprobación explícita de Jhonatan (toca DB schema)

---

## RESTRICCIONES

### ❌ NO SE DEBE TOCAR

- Checkout (ni frontend ni API)
- Stripe (ni API ni webhook)
- Webhook handlers
- Admin (ni rutas ni componentes)
- Orders (ni tabla ni API ni UI)
- Layaways (ni tabla ni API ni UI)
- Products (ni tabla ni API ni UI)
- Customer_addresses (salvo lectura si hace falta)

### ⏸️ REQUIERE APROBACIÓN ESPECÍFICA

- **DB schema:** Agregar phone_country_code/iso a customer_profiles
- **RLS:** NO necesita cambios (policies existentes cubren UPDATE)

### ✅ ALCANCE PERMITIDO

- Crear página `/account/profile`
- Crear/modificar endpoint PATCH `/api/customer/profile`
- Crear componentes UI (form, soporte)
- Validaciones frontend (espejo de backend)
- Estilos con Tailwind CSS

---

## ARQUITECTURA PROPUESTA

### 1. ARCHIVOS A CREAR

#### A. Migración DB (requiere aprobación)
```
supabase/migrations/026_customer_profiles_phone_international.sql
```

**Contenido:**
```sql
-- Add phone international fields to customer_profiles
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_iso TEXT;

-- Optional: Migrate existing phone data if format is known
-- UPDATE customer_profiles SET ...
```

#### B. Endpoint API PATCH
```
src/app/api/customer/profile/route.ts (modificar archivo existente)
```

**Agregar función:**
```typescript
export async function PATCH(req: NextRequest) {
  // 1. Auth check
  // 2. Parse body: { name?, phone?, phone_country_code?, phone_country_iso? }
  // 3. Validate fields
  // 4. Update customer_profiles (RLS auto-filtra por user_id)
  // 5. Return updated profile
}
```

**Validaciones backend:**
- `name`: 2-100 chars (opcional)
- `phone`: 8-15 dígitos (opcional)
- `phone_country_code`: regex `^\+\d{1,4}$` (opcional)
- `phone_country_iso`: regex `^[A-Z]{2}$` (opcional)

#### C. Página /account/profile
```
src/app/account/profile/page.tsx (~250 líneas)
```

**Responsabilidades:**
- Auth check (redirect si no autenticado)
- Fetch perfil (GET /api/customer/profile)
- Mostrar datos (email, name, phone, created_at)
- Form edición (name + phone con selector país)
- Sección soporte (WhatsApp, Instagram, email, texto ayuda)
- Loading/error/success states
- Responsive

#### D. Componente ProfileForm
```
src/components/customer/ProfileForm.tsx (~180 líneas)
```

**Responsabilidades:**
- Form editable: name, phone (con selector país)
- Email read-only (mostrar pero no editar)
- Fecha registro read-only
- Validaciones frontend
- Submit → PATCH /api/customer/profile
- Loading state en botón guardar
- Manejo errores (400, 401, 500)

#### E. Componente SupportSection
```
src/components/customer/SupportSection.tsx (~100 líneas)
```

**Responsabilidades:**
- Botón WhatsApp (link a wa.me)
- Botón Instagram (link a perfil)
- Email de contacto
- Texto de ayuda personalizada
- Iconos SVG/emoji

---

### 2. ARCHIVOS A MODIFICAR

#### A. AccountLayout (navegación)
```
src/components/customer/AccountLayout.tsx
```

**Cambio:** Agregar link "Perfil" en navegación (desktop + mobile)

**Orden sugerido:**
- Mi cuenta > Mis pedidos > Mis apartados > Mis direcciones > **Perfil** > Catálogo

---

## COMPONENTES UI DETALLADOS

### A. Página `/account/profile`

**Layout propuesto:**
```
┌─────────────────────────────────────────────────────┐
│ BAGCLUE                    [Navegación] [Cerrar]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Mi perfil                                          │
│  Administra tu información personal                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ DATOS DEL PERFIL                            │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │ Email                                       │   │
│  │ jhonatancv93@gmail.com (no editable)        │   │
│  │                                             │   │
│  │ Nombre *                                    │   │
│  │ [Jhonatan Venegas              ]            │   │
│  │                                             │   │
│  │ Teléfono                                    │   │
│  │ [México (+52)  ▼] [5512345678]              │   │
│  │                                             │   │
│  │ Miembro desde                               │   │
│  │ 1 de mayo de 2026                           │   │
│  │                                             │   │
│  │         [Guardar cambios]                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ SOPORTE BAGCLUE                             │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │ ¿Necesitas ayuda? Estamos aquí para ti.    │   │
│  │                                             │   │
│  │ [💬 WhatsApp]  [📷 Instagram]  [✉️ Email]   │   │
│  │                                             │   │
│  │ Horario de atención:                        │   │
│  │ Lunes a viernes, 9:00 AM - 6:00 PM          │   │
│  │                                             │   │
│  │ Consultas sobre:                            │   │
│  │ • Estado de pedidos                         │   │
│  │ • Apartados activos                         │   │
│  │ • Envíos y entregas                         │   │
│  │ • Productos y disponibilidad                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Estados:**

1. **Loading inicial:**
   - Skeleton para datos del perfil
   - Skeleton para sección soporte

2. **Datos cargados:**
   - Email read-only (gris, disabled)
   - Name editable
   - Phone con selector país + input
   - Fecha registro formateada
   - Botón "Guardar cambios"

3. **Editando:**
   - Botón "Guardar cambios" enabled
   - Validaciones inline al escribir

4. **Guardando:**
   - Botón disabled + spinner: "Guardando..."
   - Inputs disabled temporalmente

5. **Success:**
   - Alert "Perfil actualizado correctamente"
   - Campos vuelven a estado normal

6. **Error:**
   - Alert con mensaje de error
   - Campos siguen editables (permitir retry)

---

### B. Componente ProfileForm

**Props:**
```typescript
interface ProfileFormProps {
  initialData: {
    email: string
    name: string | null
    phone: string | null
    phone_country_code: string | null
    phone_country_iso: string | null
    created_at: string
  }
  onUpdate: () => void // callback para refetch después de success
}
```

**Campos:**

| Campo              | Tipo       | Editable | Validación                     |
|--------------------|------------|----------|--------------------------------|
| email              | text       | NO       | -                              |
| name               | text       | SÍ       | 2-100 chars (opcional)         |
| phone_country_code | select+text| SÍ       | regex `^\+\d{1,4}$` (opcional) |
| phone_country_iso  | hidden     | SÍ       | auto desde selector país       |
| phone              | text       | SÍ       | 8-15 dígitos (opcional)        |
| created_at         | text       | NO       | Formatear como "1 de mayo 2026"|

**Selector de país:**

```typescript
const COUNTRIES = [
  { name: 'México', code: '+52', iso: 'MX' },
  { name: 'España', code: '+34', iso: 'ES' },
  { name: 'Estados Unidos', code: '+1', iso: 'US' },
  { name: 'Venezuela', code: '+58', iso: 'VE' },
  { name: 'Colombia', code: '+57', iso: 'CO' },
  { name: 'Otro', code: '', iso: '' }
]
```

**Lógica:**
- Si `phone_country_code` existe → buscar país en lista
- Si país no está en lista → seleccionar "Otro" + mostrar inputs manuales
- Al cambiar selector → auto-llenar code + iso
- Si elige "Otro" → inputs manuales editables

**Submit:**
```typescript
const handleSubmit = async () => {
  // 1. Validar frontend
  // 2. PATCH /api/customer/profile
  //    body: { name, phone, phone_country_code, phone_country_iso }
  // 3. Si 200 → alert success + callback onUpdate()
  // 4. Si 400 → mostrar errores inline
  // 5. Si 401 → redirect /account/login
  // 6. Si 500 → alert error genérico
}
```

---

### C. Componente SupportSection

**Datos de contacto Bagclue:**

| Canal      | Valor                                    | Link/Acción                          |
|------------|------------------------------------------|--------------------------------------|
| WhatsApp   | +52 XXX XXX XXXX (pendiente confirmar)   | wa.me/52XXXXXXXXXX                   |
| Instagram  | @bagclue (pendiente confirmar)           | instagram.com/bagclue                |
| Email      | info@bagclue.com (pendiente confirmar)   | mailto:info@bagclue.com              |

**Texto de ayuda:**
```
¿Necesitas ayuda? Estamos aquí para ti.

Horario de atención:
Lunes a viernes, 9:00 AM - 6:00 PM (Hora de México)

Consultas sobre:
• Estado de pedidos y seguimiento
• Apartados activos y pagos pendientes
• Envíos, entregas y direcciones
• Productos, disponibilidad y reservas
```

**Botones:**

```tsx
<div className="flex gap-3">
  <a
    href="https://wa.me/52XXXXXXXXXX"
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center"
  >
    💬 WhatsApp
  </a>
  
  <a
    href="https://instagram.com/bagclue"
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-center"
  >
    📷 Instagram
  </a>
  
  <a
    href="mailto:info@bagclue.com"
    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
  >
    ✉️ Email
  </a>
</div>
```

**Responsive:**
- Desktop: botones en fila
- Mobile: botones apilados verticalmente

---

## VALIDACIONES

### Frontend (espejo de backend)

**Name:**
- Min: 2 chars
- Max: 100 chars
- Opcional (puede estar vacío)
- Mensaje error: "El nombre debe tener entre 2 y 100 caracteres"

**Phone:**
- Min: 8 dígitos
- Max: 15 dígitos
- Solo números (remover espacios/guiones antes de enviar)
- Opcional
- Mensaje error: "El teléfono debe tener entre 8 y 15 dígitos"

**Phone Country Code:**
- Regex: `^\+\d{1,4}$`
- Ejemplo: +52, +1, +34
- Opcional (si no hay teléfono)
- Requerido si hay teléfono
- Mensaje error: "Formato inválido. Ejemplo: +52"

**Phone Country ISO:**
- Regex: `^[A-Z]{2}$`
- Ejemplo: MX, ES, US
- 2 letras mayúsculas
- Opcional (si no hay teléfono)
- Requerido si hay teléfono
- Mensaje error: "Código ISO inválido. Ejemplo: MX"

### Backend (endpoint PATCH)

```typescript
function validateProfileUpdate(data: any) {
  const errors: string[] = []
  
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') errors.push('name must be string')
    else if (data.name.trim().length > 0 && data.name.trim().length < 2) {
      errors.push('name must be at least 2 characters')
    }
    else if (data.name.length > 100) {
      errors.push('name must be at most 100 characters')
    }
  }
  
  if (data.phone !== undefined && data.phone) {
    const phoneDigits = data.phone.replace(/\D/g, '')
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      errors.push('phone must be 8-15 digits')
    }
  }
  
  if (data.phone_country_code !== undefined && data.phone_country_code) {
    if (!/^\+\d{1,4}$/.test(data.phone_country_code)) {
      errors.push('phone_country_code invalid format (e.g. +52)')
    }
  }
  
  if (data.phone_country_iso !== undefined && data.phone_country_iso) {
    if (!/^[A-Z]{2}$/.test(data.phone_country_iso)) {
      errors.push('phone_country_iso invalid format (e.g. MX)')
    }
  }
  
  // Si hay phone, debe haber country_code e iso
  if (data.phone && (!data.phone_country_code || !data.phone_country_iso)) {
    errors.push('phone requires phone_country_code and phone_country_iso')
  }
  
  return errors
}
```

---

## MANEJO DE ESTADOS

### Loading
1. **Carga inicial:** Skeleton para form + sección soporte
2. **Guardando:** Botón disabled + spinner "Guardando..."

### Error
1. **401 Unauthorized:** Redirect a /account/login
2. **400 Bad Request:** Mostrar errores inline en campos
3. **500 Server Error:** Alert "Error al guardar. Intenta de nuevo."

### Success
1. **Profile updated:** Alert "Perfil actualizado correctamente"
2. **Refetch:** Llamar GET /api/customer/profile para actualizar UI

### Empty states
- Si `name` es null → mostrar placeholder "Tu nombre"
- Si `phone` es null → mostrar placeholder vacío

---

## RESPONSIVE DESIGN

### Desktop (≥768px)
- Form en tarjeta con padding generoso
- Botones soporte en fila (3 columnas)
- Max-width 600px para form

### Mobile (<640px)
- Form full width
- Botones soporte apilados verticalmente
- Padding reducido

---

## TESTS MANUALES

### Pre-requisitos
1. Usuario autenticado con session activa
2. Profile existente en DB (auto-created por trigger)

### Casos de prueba

#### 1. Cargar perfil existente
- **Setup:** Usuario con name y phone ya guardados
- **Esperado:**
  - Email visible (read-only)
  - Name pre-llenado en input
  - Phone pre-llenado con selector país correcto
  - Fecha registro formateada

#### 2. Cargar perfil vacío
- **Setup:** Usuario nuevo sin name ni phone
- **Esperado:**
  - Email visible
  - Name vacío con placeholder
  - Phone vacío
  - Selector país en default (México)

#### 3. Editar solo nombre
- **Input:** Cambiar name de "Jhonatan" a "Jhonatan Venegas"
- **Esperado:**
  - PATCH success
  - Alert "Perfil actualizado"
  - Name actualizado en UI

#### 4. Editar solo teléfono
- **Input:** Cambiar phone de vacío a "5512345678" con México (+52)
- **Esperado:**
  - PATCH con phone, phone_country_code, phone_country_iso
  - Success
  - Phone visible con formato "+52 (MX) 5512345678"

#### 5. Validación name muy corto
- **Input:** Name = "A" (1 char)
- **Esperado:**
  - Error inline: "El nombre debe tener entre 2 y 100 caracteres"
  - Submit bloqueado

#### 6. Validación phone corto
- **Input:** Phone = "123" (3 dígitos)
- **Esperado:**
  - Error inline: "El teléfono debe tener entre 8 y 15 dígitos"
  - Submit bloqueado

#### 7. Validación phone sin country code
- **Input:** Phone = "5512345678" pero selector país = "Otro" sin llenar code
- **Esperado:**
  - Error: "Código de país requerido si ingresas teléfono"
  - Submit bloqueado

#### 8. Cambiar país
- **Input:** Cambiar selector de México a España
- **Esperado:**
  - phone_country_code auto-llena a "+34"
  - phone_country_iso auto-llena a "ES"
  - Input phone se mantiene

#### 9. País "Otro" con input manual
- **Input:** Selector = "Otro", llenar manualmente +58 (VE)
- **Esperado:**
  - Inputs code + iso habilitados
  - Validación regex aplicada
  - Submit funciona si formato correcto

#### 10. Click WhatsApp
- **Esperado:**
  - Abre ventana nueva: wa.me/52XXXXXXXXXX
  - NO navega fuera de Bagclue en misma pestaña

#### 11. Click Instagram
- **Esperado:**
  - Abre ventana nueva: instagram.com/bagclue
  - NO navega fuera de Bagclue en misma pestaña

#### 12. Click Email
- **Esperado:**
  - Abre cliente email con mailto:info@bagclue.com
  - Pre-llena destinatario

#### 13. Error 401 (sesión expirada)
- **Setup:** Eliminar cookie session manualmente
- **Esperado:**
  - PATCH retorna 401
  - Redirect automático a /account/login

#### 14. Error 500 (servidor)
- **Setup:** Simular error 500 temporal
- **Esperado:**
  - Alert "Error al guardar. Intenta de nuevo."
  - Form NO se cierra
  - Permitir retry

#### 15. Responsive mobile
- **Device:** iPhone SE / viewport 375px
- **Esperado:**
  - Form full width
  - Botones soporte apilados
  - Todo legible, sin overflow

#### 16. Responsive desktop
- **Device:** Desktop 1920px
- **Esperado:**
  - Form max-width 600px centrado
  - Botones soporte en fila
  - Padding generoso

---

## RIESGOS IDENTIFICADOS

### 1. Migración DB phone_country_code/iso
**Riesgo:** Requiere tocar DB schema (violación de restricción)  
**Mitigación:** Solicitar aprobación explícita de Jhonatan antes de implementar  
**Alternativa:** Usar phone como texto completo (opción B) si no se aprueba migración

### 2. Datos existentes en phone
**Riesgo:** Si users tienen phone guardado sin estructura, migración puede perder datos  
**Mitigación:** Script de migración manual para parsear phone existente

### 3. Contacto Bagclue no confirmado
**Riesgo:** WhatsApp/Instagram/Email pueden ser incorrectos  
**Mitigación:** Confirmar con Jhonatan antes de hardcodear en componente

### 4. RLS policies pueden fallar
**Riesgo:** Si RLS no está habilitado, cualquier usuario puede editar cualquier perfil  
**Mitigación:** Verificar RLS enabled en DB antes de deploy

### 5. Trigger auto-create profile puede no existir
**Riesgo:** Usuarios nuevos no tendrán profile, GET falla con 500  
**Mitigación:** Verificar trigger existe, o crear profile al primer GET si no existe

---

## CRITERIOS DE CIERRE FASE 5E

### Funcionalidad

- [ ] 1. Página `/account/profile` creada y accesible
- [ ] 2. Auth check funciona (redirect si no autenticado)
- [ ] 3. GET perfil muestra email, name, phone, fecha registro
- [ ] 4. Email es read-only (no editable)
- [ ] 5. Name es editable
- [ ] 6. Phone es editable con selector país
- [ ] 7. Selector país incluye: MX, ES, US, VE, CO, Otro
- [ ] 8. País "Otro" permite input manual code + iso
- [ ] 9. Guardar cambios (PATCH) actualiza name
- [ ] 10. Guardar cambios (PATCH) actualiza phone con country_code/iso
- [ ] 11. Fecha registro formateada correctamente
- [ ] 12. Sección soporte visible
- [ ] 13. Botón WhatsApp abre wa.me en nueva pestaña
- [ ] 14. Botón Instagram abre perfil en nueva pestaña
- [ ] 15. Botón Email abre mailto
- [ ] 16. Texto de ayuda visible y claro

### Validaciones

- [ ] 17. Name: 2-100 chars validado
- [ ] 18. Phone: 8-15 dígitos validado
- [ ] 19. phone_country_code: regex `^\+\d{1,4}$` validado
- [ ] 20. phone_country_iso: regex `^[A-Z]{2}$` validado
- [ ] 21. Errores inline visibles en campos inválidos
- [ ] 22. Submit bloqueado si hay errores frontend
- [ ] 23. Errores backend (400) muestran mensajes en form

### UI/UX

- [ ] 24. Loading skeleton inicial mientras carga perfil
- [ ] 25. Spinner en botón "Guardar cambios" mientras guarda
- [ ] 26. Alert success visible después de guardar
- [ ] 27. Alert error visible en caso de fallo
- [ ] 28. Form NO se cierra si hay error (permitir retry)

### Responsive

- [ ] 29. Mobile (375px): form full width, botones apilados
- [ ] 30. Desktop (1920px): form max-width 600px, botones en fila

### Seguridad

- [ ] 31. Error 401 redirige a login
- [ ] 32. RLS policies funcionan (solo own profile)
- [ ] 33. NO se expone user_id en frontend (solo en backend)

### Restricciones cumplidas

- [ ] 34. NO se tocó checkout
- [ ] 35. NO se tocó Stripe
- [ ] 36. NO se tocó webhook
- [ ] 37. NO se tocó admin
- [ ] 38. NO se tocó orders/layaways/products
- [ ] 39. NO se tocó customer_addresses (salvo lectura si necesaria)

### Build & Deploy

- [ ] 40. Build local exitoso sin errores
- [ ] 41. Deploy a Vercel exitoso
- [ ] 42. Ruta `/account/profile` accesible en producción
- [ ] 43. NO se subieron secretos/tokens al repo

---

## ESTIMACIÓN DE ESFUERZO

**Complejidad:** Media

**Archivos nuevos:** 3-4
- `supabase/migrations/026_customer_profiles_phone_international.sql` (~20 líneas)
- `src/app/account/profile/page.tsx` (~250 líneas)
- `src/components/customer/ProfileForm.tsx` (~180 líneas)
- `src/components/customer/SupportSection.tsx` (~100 líneas)

**Archivos modificados:** 2
- `src/app/api/customer/profile/route.ts` (agregar PATCH, ~80 líneas nuevas)
- `src/components/customer/AccountLayout.tsx` (agregar link nav, ~5 líneas)

**Total líneas estimadas:** ~615 líneas nuevas

**Tiempo estimado:**
- Migración DB + verificación: 30 min
- Endpoint PATCH: 1 hora
- Página profile: 2 horas
- ProfileForm: 1.5 horas
- SupportSection: 1 hora
- Testing manual: 1 hora
- Ajustes responsive: 30 min
- **Total: 7-8 horas**

**Dependencias:**
- Fase 5D.3 (UI direcciones): ✅ CERRADA
- Migración 015 (customer_profiles): ⚠️ Verificar ejecutada
- Aprobación migración 026 (phone_country_code/iso): ⏸️ Pendiente

**Bloqueadores:**
- ⚠️ Aprobación para migración DB (agregar phone_country_code/iso)
- ⚠️ Confirmar datos de contacto Bagclue (WhatsApp, Instagram, email)

---

## RECOMENDACIONES

### 1. Confirmar migración DB
- Verificar si migración 015 (customer_profiles) fue ejecutada en producción
- Si no existe, ejecutar 015 + 026 juntas
- Si existe, solo ejecutar 026

### 2. Confirmar datos de contacto Bagclue
Antes de implementar SupportSection, confirmar:
- WhatsApp: ¿número exacto?
- Instagram: ¿@bagclue o @bagclue_oficial?
- Email: ¿info@bagclue.com o soporte@bagclue.com?
- Horario: ¿9 AM - 6 PM horario México?

### 3. Considerar campo adicional: avatar
(NO para Fase 5E, pero para futuro)
- Permitir subir foto de perfil
- Guardar URL en customer_profiles.avatar_url
- Mostrar en nav / dashboard

### 4. Considerar verificación email
(NO para Fase 5E)
- Badge "Email verificado" si user.email_verified_at existe
- Link para reenviar email de verificación

### 5. Testing incremental
- Implementar primero migración + endpoint PATCH
- Luego ProfileForm
- Luego SupportSection
- Testing manual después de cada incremento

---

## SIGUIENTE FASE (NO IMPLEMENTAR TODAVÍA)

**Opciones después de 5E:**

### Opción A: Dashboard resumen
- Widgets: pedidos recientes, apartados activos, direcciones, perfil
- Navegación rápida a cada sección
- Estadísticas visuales

### Opción B: Integración direcciones + checkout
- Selector dirección de envío en checkout
- Pre-cargar dirección default
- Opción "Usar otra dirección"
- Opción "Agregar nueva" desde checkout

### Opción C: Notificaciones/preferencias
- Email notifications on/off
- SMS notifications on/off
- Newsletter subscription

**NO incluir en 5E.**

---

## APROBACIÓN REQUERIDA

Este documento define el scope completo de Fase 5E.

**Antes de implementar, confirmar:**

1. ✅ Aprobación para migración DB (agregar phone_country_code/iso a customer_profiles)
2. ✅ Datos de contacto Bagclue (WhatsApp, Instagram, email)
3. ✅ Confirmar que migración 015 existe en producción
4. ✅ Validar criterios de cierre (43 checks)

**Después de aprobación:**
1. Ejecutar migración 026 (si se aprueba opción A)
2. Implementar endpoint PATCH
3. Implementar página profile + componentes
4. Testing manual continuo
5. Build + Deploy
6. Reporte final con evidencia

---

**Estado:** SCOPE COMPLETO - PENDIENTE DE APROBACIÓN  
**Fecha:** 2026-05-03  
**Preparado por:** Kepler  
**Fase:** 5E - Perfil / Soporte Cliente  
**Decisión pendiente:** Migración DB phone_country_code/iso (Opción A vs Opción B vs Opción C)
