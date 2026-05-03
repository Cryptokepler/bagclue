# FASE 5D.3 — UI DE DIRECCIONES CLIENTE

**Fecha:** 2026-05-03  
**Proyecto:** Bagclue - E-commerce Lujo  
**Fase:** 5D.3 (Customer Addresses - Frontend UI)  
**Estado:** SCOPE PLANNING (NO implementado)

---

## OBJETIVO

Crear interfaz de cliente para gestionar direcciones de envío desde el panel de cuenta.

**Ruta:** `/account/addresses`

**Funcionalidades:**
1. ✅ Listar direcciones guardadas del usuario
2. ✅ Estado vacío elegante si no hay direcciones
3. ✅ Crear nueva dirección
4. ✅ Editar dirección existente
5. ✅ Eliminar dirección (con confirmación)
6. ✅ Marcar dirección como principal (PATCH is_default=true)
7. ✅ Badge "Principal" visible en dirección default
8. ✅ Mostrar teléfono con country code (+52, MX)
9. ✅ Mobile responsive

**NO incluye:** Integración con checkout (pendiente fase posterior)

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
- DB schema (NO crear migraciones)
- RLS policies (NO modificar policies)
- Endpoints API addresses (ya están finalizados)

### ✅ ALCANCE PERMITIDO

- Crear componentes UI en `src/app/account/addresses/`
- Crear componentes reutilizables en `src/components/`
- Usar endpoints existentes: GET, POST, PATCH, DELETE `/api/account/addresses`
- Validaciones frontend (espejo de backend validation.ts)
- Estilos con Tailwind CSS (consistente con el proyecto)
- Manejo de estados: loading, error, success, empty
- Auth: reutilizar patrón de `/account/orders` y `/account/layaways`

---

## ARQUITECTURA PROPUESTA

### 1. ARCHIVOS A CREAR

#### Ruta principal
```
src/app/account/addresses/page.tsx (220-280 líneas estimadas)
```

**Responsabilidades:**
- Listar direcciones (GET /api/account/addresses)
- Detectar usuario autenticado (cookies/session)
- Estado vacío si no hay direcciones
- Botón "Agregar dirección" → abrir modal/form
- Tarjetas de dirección con badge "Principal"
- Botones: Editar, Eliminar, Marcar como principal
- Confirmación antes de eliminar
- Feedback: toast/alert success/error
- Loading states
- Mobile responsive

#### Componente de formulario
```
src/components/AddressForm.tsx (180-240 líneas estimadas)
```

**Responsabilidades:**
- Formulario reutilizable para crear/editar
- Campos: full_name, phone_country_code, phone_country_iso, phone, country, state, city, postal_code, address_line1, address_line2, delivery_references, is_default
- Validaciones frontend (regex phone_country_code, phone_country_iso, campos requeridos)
- Props: mode ('create' | 'edit'), initialData, onSubmit, onCancel
- POST /api/account/addresses (create mode)
- PATCH /api/account/addresses/[id] (edit mode)
- Manejo de errores API (400, 401, 500)
- Disable submit mientras loading
- Reset form después de éxito

#### Componente de tarjeta de dirección
```
src/components/AddressCard.tsx (100-140 líneas estimadas)
```

**Responsabilidades:**
- Mostrar dirección formateada
- Badge "Principal" si is_default = true
- Formato: full_name, phone (+52 MX), address_line1, city, state, postal_code, country
- Botones de acción: Editar, Eliminar, Marcar como principal (solo si no es default)
- Responsive: stack vertical en mobile

#### Modal de confirmación
```
src/components/ConfirmDialog.tsx (60-80 líneas estimadas)
```

**Responsabilidades:**
- Modal reutilizable para confirmaciones
- Props: isOpen, title, message, onConfirm, onCancel
- Botones: Cancelar (secondary), Confirmar (danger para delete)
- Usar para confirmar eliminación de dirección

#### Tipos TypeScript (opcional si no existen)
```
src/types/address.ts (ya existe desde 5D.2A)
```

**Ya contiene:**
- Address interface
- CreateAddressDTO
- UpdateAddressDTO

**Añadir si no existe:**
- AddressFormMode = 'create' | 'edit'
- AddressFormProps

---

### 2. ARCHIVOS A MODIFICAR

#### Layout de cuenta (si no existe ruta addresses)
```
src/app/account/layout.tsx (posiblemente)
```

**Cambio:** Añadir link "Mis Direcciones" al menú de navegación de cuenta (si hay sidebar/nav).

**Verificar primero:** Revisar estructura actual de `/account` para mantener consistencia.

---

## COMPONENTES UI DETALLADOS

### A. Página principal `/account/addresses`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Mi Cuenta > Mis Direcciones             │
├─────────────────────────────────────────┤
│ [+ Agregar dirección]           (botón) │
├─────────────────────────────────────────┤
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 🏠 PRINCIPAL                      │   │ <- Badge
│ │ Jhonatan Venegas                  │   │
│ │ +52 (MX) 5512345678               │   │
│ │ Calle Ejemplo 123                 │   │
│ │ Madrid, Madrid 28001              │   │
│ │ España                            │   │
│ │ Ref: Torre A, Piso 3              │   │
│ │                                   │   │
│ │ [Editar] [Eliminar]               │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Jhonatan Venegas                  │   │
│ │ +52 (MX) 5587654321               │   │
│ │ Av. Reforma 456                   │   │
│ │ Monterrey, Nuevo León 64000       │   │
│ │ México                            │   │
│ │                                   │   │
│ │ [Marcar como principal] [Editar]  │   │
│ │ [Eliminar]                        │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Estado vacío:**
```
┌─────────────────────────────────────────┐
│ Mi Cuenta > Mis Direcciones             │
├─────────────────────────────────────────┤
│                                         │
│          📦                             │
│    No tienes direcciones guardadas      │
│                                         │
│ Agrega una dirección de envío para      │
│ agilizar tus compras futuras            │
│                                         │
│     [+ Agregar dirección]               │
│                                         │
└─────────────────────────────────────────┘
```

**Responsabilidades del componente:**

1. **Auth check:**
   - Usar `createClient` de cookies (mismo patrón que `/account/orders`)
   - Redirect a `/account/login` si no autenticado
   - Obtener user.id

2. **Fetch direcciones:**
   - GET `/api/account/addresses` con Bearer token
   - Almacenar en estado: `addresses: Address[]`
   - Detectar default: `addresses.find(a => a.is_default)`

3. **Estados:**
   - `loading: boolean` - skeleton/spinner inicial
   - `addresses: Address[]` - lista de direcciones
   - `error: string | null` - mensaje de error
   - `isFormOpen: boolean` - modal/drawer de formulario
   - `editingAddress: Address | null` - dirección en edición
   - `deletingAddressId: string | null` - dirección a eliminar (confirmación)

4. **Acciones:**
   - **Agregar:** Abrir form en modo create, `isFormOpen = true`, `editingAddress = null`
   - **Editar:** Abrir form en modo edit, `editingAddress = address`
   - **Eliminar:** Abrir confirmación, `deletingAddressId = address.id`
   - **Marcar principal:** PATCH `/api/account/addresses/[id]` con `{ is_default: true }`, refetch lista
   - **Confirmación eliminar:** DELETE `/api/account/addresses/[id]`, refetch lista

5. **Feedback:**
   - Toast/alert success: "Dirección agregada", "Dirección actualizada", "Dirección eliminada", "Dirección marcada como principal"
   - Toast/alert error: "Error al guardar dirección", "Error al eliminar", etc.

---

### B. Componente `AddressForm`

**Props:**
```typescript
interface AddressFormProps {
  mode: 'create' | 'edit';
  initialData?: Address; // solo en edit mode
  onSuccess: () => void; // callback después de éxito
  onCancel: () => void; // cerrar modal/form
}
```

**Campos del formulario:**

| Campo                | Tipo       | Requerido | Placeholder/Label          | Validación frontend                     |
|----------------------|------------|-----------|----------------------------|-----------------------------------------|
| full_name            | text       | Sí        | Nombre completo            | min 2 chars, max 100 chars              |
| phone_country_code   | text       | No        | +52                        | regex: `^\+\d{1,4}$`                    |
| phone_country_iso    | text       | No        | MX                         | 2 chars uppercase, regex: `^[A-Z]{2}$` |
| phone                | text       | No        | 5512345678                 | 8-15 digits                             |
| country              | text       | Sí        | País                       | min 2 chars                             |
| state                | text       | No        | Estado/Provincia           | -                                       |
| city                 | text       | Sí        | Ciudad                     | min 2 chars                             |
| postal_code          | text       | No        | Código postal              | -                                       |
| address_line1        | text       | Sí        | Calle y número             | min 5 chars                             |
| address_line2        | text       | No        | Depto, piso, etc.          | -                                       |
| delivery_references  | textarea   | No        | Referencias de entrega     | max 500 chars                           |
| is_default           | checkbox   | No        | Marcar como dirección principal | -                                  |

**Layout sugerido:**
```
┌─────────────────────────────────────────┐
│ [X] Agregar dirección                   │  <- Título (o "Editar dirección")
├─────────────────────────────────────────┤
│ Nombre completo *                       │
│ [___________________________________]   │
│                                         │
│ País *                                  │
│ [___________________________________]   │
│                                         │
│ Estado/Provincia                        │
│ [___________________________________]   │
│                                         │
│ Ciudad *                                │
│ [___________________________________]   │
│                                         │
│ Código postal                           │
│ [___________________________________]   │
│                                         │
│ Calle y número *                        │
│ [___________________________________]   │
│                                         │
│ Depto, piso, etc.                       │
│ [___________________________________]   │
│                                         │
│ Teléfono                                │
│ Código país  ISO   Número              │
│ [____] [__] [______________]           │
│ +52     MX   5512345678                 │
│                                         │
│ Referencias de entrega                  │
│ [                                  ]    │
│ [                                  ]    │
│                                         │
│ [✓] Marcar como dirección principal     │
│                                         │
│     [Cancelar]  [Guardar]               │
└─────────────────────────────────────────┘
```

**Lógica de submit:**

1. **Validar campos requeridos** (frontend)
2. **Validar formatos** (phone_country_code, phone_country_iso)
3. **Preparar payload:**
   - Create mode: CreateAddressDTO completo
   - Edit mode: UpdateAddressDTO (solo campos modificados)
4. **API call:**
   - Create: `POST /api/account/addresses`
   - Edit: `PATCH /api/account/addresses/[id]`
   - Headers: `Authorization: Bearer ${token}`
5. **Manejo de respuestas:**
   - 200/201: `onSuccess()` + toast success + cerrar form
   - 400: Mostrar errores de validación (backend)
   - 401: Redirect a login
   - 500: Toast error genérico
6. **Loading state:** Disable botón "Guardar" mientras pending

**Consideraciones especiales:**

- **Primera dirección:** Si es la primera del usuario, backend auto-marca `is_default = true` (ignorar checkbox)
- **Editar default a false:** Backend rechaza con 400 si hay otras direcciones (mostrar error: "No puedes desmarcar la única dirección principal. Marca otra como principal primero.")
- **Phone fields:** Mostrar 3 inputs separados pero enviar como campos independientes

---

### C. Componente `AddressCard`

**Props:**
```typescript
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  isDeleting?: boolean; // loading state para botón eliminar
  isSettingDefault?: boolean; // loading state para botón marcar principal
}
```

**Layout:**
```
┌───────────────────────────────────────┐
│ 🏠 PRINCIPAL                          │ <- Badge (solo si is_default)
│                                       │
│ Jhonatan Venegas                      │ <- full_name
│ +52 (MX) 5512345678                   │ <- phone_country_code + iso + phone
│                                       │
│ Calle Ejemplo 123                     │ <- address_line1
│ Depto 4B                              │ <- address_line2 (si existe)
│ Madrid, Madrid 28001                  │ <- city, state, postal_code
│ España                                │ <- country
│                                       │
│ Ref: Torre A, Piso 3                  │ <- delivery_references (si existe)
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ [Marcar como principal] [Editar] │   │ <- Botones (si no es default)
│ │ [Eliminar]                       │   │
│ └─────────────────────────────────┘   │
│                                       │
│ (Si es default, no mostrar "Marcar   │
│  como principal")                     │
└───────────────────────────────────────┘
```

**Lógica de botones:**

1. **Marcar como principal:**
   - Solo visible si `!address.is_default`
   - onClick: `onSetDefault(address.id)`
   - Disable si `isSettingDefault`

2. **Editar:**
   - onClick: `onEdit(address)`

3. **Eliminar:**
   - onClick: `onDelete(address.id)`
   - Disable si `isDeleting`

**Responsive:**
- Desktop: tarjeta con padding generoso, botones inline
- Mobile: stack vertical, botones apilados, full width

---

### D. Componente `ConfirmDialog`

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirmar"
  cancelText?: string; // default: "Cancelar"
  variant?: 'danger' | 'primary'; // default: 'primary'
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean; // disable botón confirmar
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ ⚠️ Eliminar dirección               │ <- title
├─────────────────────────────────────┤
│                                     │
│ ¿Estás seguro de que deseas         │ <- message
│ eliminar esta dirección?            │
│                                     │
│ Esta acción no se puede deshacer.   │
│                                     │
│     [Cancelar]  [Eliminar]          │ <- cancelText, confirmText
└─────────────────────────────────────┘
```

**Variantes:**
- `danger`: Botón confirmar rojo (para delete)
- `primary`: Botón confirmar azul (para otros casos)

**Uso:**
```typescript
<ConfirmDialog
  isOpen={deletingAddressId !== null}
  title="Eliminar dirección"
  message="¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => setDeletingAddressId(null)}
  isLoading={isDeleting}
/>
```

---

## VALIDACIONES FRONTEND

**Espejo de backend:** `src/lib/addresses/validation.ts`

### Campos requeridos (CREATE)
- `full_name`
- `country`
- `city`
- `address_line1`

### Campos requeridos (UPDATE - partial)
- Ninguno obligatorio (partial update)

### Formatos

| Campo               | Validación                                  | Mensaje de error                          |
|---------------------|---------------------------------------------|-------------------------------------------|
| full_name           | min 2 chars, max 100 chars                  | "Nombre debe tener entre 2 y 100 caracteres" |
| phone_country_code  | regex: `^\+\d{1,4}$`                        | "Formato inválido. Ej: +52"               |
| phone_country_iso   | regex: `^[A-Z]{2}$` (2 uppercase letters)   | "Código ISO inválido. Ej: MX"             |
| phone               | 8-15 dígitos                                | "Teléfono debe tener entre 8 y 15 dígitos" |
| country             | min 2 chars, max 100 chars                  | "País inválido"                           |
| city                | min 2 chars, max 100 chars                  | "Ciudad inválida"                         |
| address_line1       | min 5 chars, max 200 chars                  | "Dirección debe tener al menos 5 caracteres" |
| delivery_references | max 500 chars                               | "Referencias muy largas (máx 500 caracteres)" |

**Librería sugerida:** `react-hook-form` + `zod` (si ya se usa en el proyecto) o validación manual con estado.

**Mostrar errores:**
- Inline debajo de cada campo
- Color rojo, texto pequeño
- Mostrar solo después de blur o submit

---

## MANEJO DE ESTADOS

### Loading States

1. **Carga inicial:**
   - Skeleton cards mientras `GET /api/account/addresses` está pending
   - Mostrar 2-3 skeleton cards

2. **Creando/Editando dirección:**
   - Disable botón "Guardar"
   - Mostrar spinner en botón: "Guardando..."

3. **Eliminando dirección:**
   - Disable botón "Eliminar" en la tarjeta
   - Mostrar spinner: "Eliminando..."

4. **Marcando como principal:**
   - Disable botón "Marcar como principal"
   - Mostrar spinner: "Actualizando..."

### Error States

1. **Error de autenticación (401):**
   - Redirect a `/account/login`

2. **Error de validación (400):**
   - Mostrar errores inline en formulario
   - Formato backend: `{ error: string, errors: string[] }`
   - Mapear errores a campos específicos

3. **Error de servidor (500):**
   - Toast error: "Ocurrió un error. Intenta de nuevo."
   - NO cerrar formulario
   - Permitir retry

4. **Error de red:**
   - Toast error: "Sin conexión. Verifica tu internet."

### Success States

1. **Dirección creada:**
   - Toast success: "Dirección agregada correctamente"
   - Cerrar formulario
   - Refetch lista de direcciones
   - Scroll a nueva dirección (opcional)

2. **Dirección actualizada:**
   - Toast success: "Dirección actualizada"
   - Cerrar formulario
   - Refetch lista

3. **Dirección eliminada:**
   - Toast success: "Dirección eliminada"
   - Cerrar confirmación
   - Refetch lista

4. **Dirección marcada como principal:**
   - Toast success: "Dirección marcada como principal"
   - Refetch lista (badge "Principal" se mueve)

### Empty State

**Condición:** `addresses.length === 0 && !loading`

**Mostrar:**
- Ícono: 📦 o SVG de caja/casa
- Título: "No tienes direcciones guardadas"
- Descripción: "Agrega una dirección de envío para agilizar tus compras futuras"
- Botón: "+ Agregar dirección"

---

## CONFIRMACIONES

### Eliminar dirección

**Trigger:** Usuario hace clic en "Eliminar"

**Flow:**
1. Abrir modal `ConfirmDialog`
2. Mostrar mensaje: "¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer."
3. Usuario confirma → DELETE `/api/account/addresses/[id]`
4. Usuario cancela → cerrar modal, no hacer nada

**Casos especiales:**
- Si es la única dirección: permitir eliminación (usuario queda sin direcciones)
- Si es la dirección default y hay otras: backend reasigna default automáticamente (5D.2B fix validado)

### Marcar como principal

**NO requiere confirmación** (acción reversible)

**Flow:**
1. Click "Marcar como principal"
2. PATCH `/api/account/addresses/[id]` con `{ is_default: true }`
3. Backend desmarca otras direcciones automáticamente
4. Refetch lista → badge "Principal" se mueve

---

## RESPONSIVE DESIGN

### Desktop (≥768px)

- Layout: grid 1-2 columnas para tarjetas de direcciones
- Formulario: modal centrado, ancho máximo 600px
- Botones: inline en tarjetas
- Padding generoso

### Tablet (≥640px, <768px)

- Layout: 1 columna
- Formulario: modal centrado, ancho máximo 500px
- Botones: inline

### Mobile (<640px)

- Layout: 1 columna, full width
- Formulario: full screen modal o drawer desde abajo
- Botones: apilados verticalmente, full width
- Campos de teléfono: stack vertical (country code, ISO, número)
- Reducir padding en tarjetas

**Breakpoints Tailwind:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px

---

## TESTS MANUALES

### Pre-requisitos
1. Usuario autenticado con session activa
2. Token válido disponible en cookies
3. DB con 0-3 direcciones de prueba

### Casos de prueba

#### 1. Estado vacío
- **Setup:** Usuario sin direcciones
- **Esperado:**
  - Mostrar estado vacío con ícono + mensaje
  - Botón "Agregar dirección" visible
  - NO mostrar skeleton/loading después de carga inicial

#### 2. Listar direcciones existentes
- **Setup:** Usuario con 2-3 direcciones
- **Esperado:**
  - Mostrar todas las direcciones
  - Badge "Principal" solo en la dirección con `is_default = true`
  - Teléfono formateado: "+52 (MX) 5512345678"
  - Campos opcionales vacíos no muestran línea vacía

#### 3. Crear dirección (campos mínimos)
- **Input:**
  - full_name: "Test User"
  - country: "México"
  - city: "CDMX"
  - address_line1: "Calle Test 123"
  - Resto: vacío
- **Esperado:**
  - POST success → 201
  - Toast success
  - Formulario se cierra
  - Nueva dirección aparece en lista
  - Si es la primera, tiene badge "Principal"

#### 4. Crear dirección (todos los campos)
- **Input:**
  - full_name: "Jhonatan Venegas"
  - phone_country_code: "+52"
  - phone_country_iso: "MX"
  - phone: "5512345678"
  - country: "México"
  - state: "CDMX"
  - city: "Ciudad de México"
  - postal_code: "06000"
  - address_line1: "Av. Juárez 123"
  - address_line2: "Depto 4B"
  - delivery_references: "Torre A, piso 3"
  - is_default: true
- **Esperado:**
  - POST success
  - Nueva dirección con badge "Principal"
  - Otras direcciones pierden badge "Principal"

#### 5. Validación frontend - campos requeridos
- **Input:** Enviar form con campos requeridos vacíos
- **Esperado:**
  - NO hacer API call
  - Mostrar errores inline: "Este campo es requerido"
  - Botón "Guardar" disabled o errores visibles

#### 6. Validación frontend - phone_country_code inválido
- **Input:** phone_country_code = "52" (sin +)
- **Esperado:**
  - Error inline: "Formato inválido. Ej: +52"
  - NO hacer API call hasta corregir

#### 7. Validación frontend - phone_country_iso inválido
- **Input:** phone_country_iso = "mx" (lowercase)
- **Esperado:**
  - Error inline: "Código ISO inválido. Ej: MX"
  - NO hacer API call hasta corregir

#### 8. Validación backend - duplicar error 400
- **Setup:** Backend retorna 400 con errores
- **Esperado:**
  - Mostrar errores de backend en formulario
  - NO cerrar formulario
  - Permitir corrección y retry

#### 9. Editar dirección - cambio parcial
- **Input:** Editar address_line2 solamente
- **Esperado:**
  - PATCH con solo `{ address_line2: "nuevo valor" }`
  - Success → toast + refetch
  - Cambio reflejado en tarjeta

#### 10. Editar dirección - marcar como principal
- **Input:** Editar dirección no default, activar checkbox is_default
- **Esperado:**
  - PATCH con `{ is_default: true }`
  - Success → badge "Principal" se mueve a esta dirección
  - Otras direcciones pierden badge

#### 11. Marcar como principal desde tarjeta
- **Setup:** Dirección no default
- **Input:** Click "Marcar como principal"
- **Esperado:**
  - PATCH success
  - Badge "Principal" se mueve
  - Botón "Marcar como principal" desaparece de esta tarjeta
  - Aparece en la que era default antes

#### 12. Eliminar dirección no default
- **Setup:** Usuario con 2+ direcciones, eliminar una no default
- **Input:** Click "Eliminar" → Confirmar
- **Esperado:**
  - DELETE success
  - Toast success
  - Dirección desaparece de lista
  - Dirección default NO cambia

#### 13. Eliminar dirección default (con otras direcciones)
- **Setup:** Usuario con 2+ direcciones, eliminar la default
- **Input:** Click "Eliminar" en default → Confirmar
- **Esperado:**
  - DELETE success
  - Dirección eliminada desaparece
  - **OTRA dirección automáticamente recibe badge "Principal"** (fix 5D.2B)
  - default_count = 1 siempre

#### 14. Eliminar única dirección
- **Setup:** Usuario con 1 dirección
- **Input:** Click "Eliminar" → Confirmar
- **Esperado:**
  - DELETE success
  - Lista vacía → mostrar estado vacío
  - NO hay dirección default (OK)

#### 15. Cancelar eliminación
- **Input:** Click "Eliminar" → Cancelar en confirmación
- **Esperado:**
  - Modal se cierra
  - Dirección NO eliminada
  - NO API call

#### 16. Loading states
- **Acciones:**
  - Crear dirección → botón "Guardar" disabled + spinner
  - Eliminar dirección → botón "Eliminar" disabled + spinner
  - Marcar principal → botón disabled + spinner
- **Esperado:**
  - Botones disabled mientras API call pending
  - Spinner/texto "Cargando..." visible
  - Re-enable después de success/error

#### 17. Error 401 - sesión expirada
- **Setup:** Eliminar cookie/session manualmente
- **Esperado:**
  - API call retorna 401
  - Redirect automático a `/account/login`

#### 18. Error 500 - servidor
- **Setup:** Simular error 500 (temporalmente romper backend)
- **Esperado:**
  - Toast error: "Ocurrió un error. Intenta de nuevo."
  - Formulario NO se cierra
  - Permitir retry

#### 19. Responsive - mobile
- **Device:** iPhone SE / viewport 375px
- **Esperado:**
  - Tarjetas stack verticalmente
  - Botones full width, apilados
  - Formulario full screen o drawer
  - Campos de teléfono stack verticalmente
  - Todo legible, sin overflow horizontal

#### 20. Responsive - tablet
- **Device:** iPad / viewport 768px
- **Esperado:**
  - Tarjetas en 1 columna
  - Formulario modal centrado
  - Botones inline

#### 21. Responsive - desktop
- **Device:** Desktop 1920px
- **Esperado:**
  - Tarjetas en grid 2 columnas (opcional)
  - Formulario modal centrado, ancho máximo 600px
  - Padding generoso

---

## RIESGOS IDENTIFICADOS

### 1. Auth state desincronizado
**Riesgo:** Usuario autenticado en frontend pero token expirado en backend  
**Mitigación:** Interceptar error 401 → redirect a login

### 2. Race conditions en marcar default
**Riesgo:** Usuario hace doble clic en "Marcar como principal" → múltiples PATCH  
**Mitigación:** Disable botón mientras API call pending

### 3. Refetch no refleja cambios
**Riesgo:** Después de crear/editar/eliminar, lista no se actualiza  
**Mitigación:** Siempre hacer refetch después de success (GET /api/account/addresses)

### 4. Validaciones frontend/backend desincronizadas
**Riesgo:** Frontend permite envío que backend rechaza  
**Mitigación:** Mantener validaciones frontend espejo exacto de backend validation.ts

### 5. Estado vacío confuso
**Riesgo:** Usuario ve estado vacío y piensa que algo está roto  
**Mitigación:** Mensaje claro + CTA visible ("Agregar dirección")

### 6. Eliminar default sin reasignar
**Riesgo:** Después de eliminar default, ninguna dirección queda como default  
**Mitigación:** **YA RESUELTO EN 5D.2B** - backend reasigna automáticamente

### 7. Mobile UX pobre
**Riesgo:** Formulario ilegible o botones muy pequeños en móvil  
**Mitigación:** Testing manual en viewport 375px, botones mínimo 44px altura

### 8. Error 500 rompe la UI
**Riesgo:** Error de servidor deja formulario en estado inconsistente  
**Mitigación:** Catch all errors, mostrar mensaje genérico, NO cerrar form

---

## CRITERIOS DE CIERRE FASE 5D.3

### Funcionalidad

- [ ] 1. Página `/account/addresses` creada y accesible
- [ ] 2. Auth check funciona (redirect si no autenticado)
- [ ] 3. GET lista de direcciones muestra todas las direcciones del usuario
- [ ] 4. Estado vacío elegante si no hay direcciones
- [ ] 5. Badge "Principal" visible solo en dirección default
- [ ] 6. Teléfono formateado correctamente (+52 (MX) 5512345678)
- [ ] 7. Crear dirección (POST) funciona con campos mínimos
- [ ] 8. Crear dirección (POST) funciona con todos los campos
- [ ] 9. Primera dirección automáticamente marcada como principal
- [ ] 10. Editar dirección (PATCH) actualiza correctamente
- [ ] 11. Marcar como principal desde form funciona
- [ ] 12. Marcar como principal desde tarjeta funciona
- [ ] 13. Badge "Principal" se mueve correctamente al cambiar default
- [ ] 14. Eliminar dirección no default funciona
- [ ] 15. Eliminar dirección default reasigna default a otra (fix 5D.2B)
- [ ] 16. Eliminar única dirección funciona → estado vacío
- [ ] 17. Confirmación antes de eliminar funciona
- [ ] 18. Cancelar eliminación no hace nada

### Validaciones

- [ ] 19. Campos requeridos validados (full_name, country, city, address_line1)
- [ ] 20. phone_country_code valida formato `^\+\d{1,4}$`
- [ ] 21. phone_country_iso valida formato `^[A-Z]{2}$`
- [ ] 22. Errores inline visibles en campos inválidos
- [ ] 23. Submit bloqueado si hay errores de validación frontend
- [ ] 24. Errores backend (400) muestran mensajes en formulario

### UI/UX

- [ ] 25. Loading skeleton inicial mientras carga lista
- [ ] 26. Spinner en botón "Guardar" mientras crea/edita
- [ ] 27. Spinner en botón "Eliminar" mientras elimina
- [ ] 28. Spinner en botón "Marcar como principal" mientras actualiza
- [ ] 29. Toast success visible después de crear/editar/eliminar
- [ ] 30. Toast error visible en caso de fallo
- [ ] 31. Formulario se cierra después de success
- [ ] 32. Formulario NO se cierra si hay error (permitir retry)

### Responsive

- [ ] 33. Mobile (375px): tarjetas full width, botones apilados
- [ ] 34. Mobile: formulario full screen o drawer
- [ ] 35. Tablet (768px): layout 1 columna, modal centrado
- [ ] 36. Desktop (1920px): grid 2 columnas, modal centrado
- [ ] 37. Botones táctiles mínimo 44px altura en mobile

### Seguridad

- [ ] 38. Error 401 redirige a login
- [ ] 39. NO se expone user_id en frontend (solo token)
- [ ] 40. Bearer token enviado correctamente en headers

### Calidad de código

- [ ] 41. Componentes reutilizables (AddressForm, AddressCard, ConfirmDialog)
- [ ] 42. TypeScript sin errores
- [ ] 43. No hay warnings relevantes en build
- [ ] 44. Código formateado consistentemente
- [ ] 45. Nombres de variables/funciones descriptivos

### Restricciones cumplidas

- [ ] 46. NO se modificó checkout
- [ ] 47. NO se modificó Stripe
- [ ] 48. NO se modificó webhook
- [ ] 49. NO se modificó admin
- [ ] 50. NO se modificó DB schema/RLS/migrations
- [ ] 51. NO se modificaron endpoints API addresses (solo consumo)
- [ ] 52. NO se creó endpoint set-default (se usa PATCH is_default)

### Testing manual

- [ ] 53. Todos los 21 tests manuales ejecutados: PASS
- [ ] 54. Testing en mobile real (iPhone/Android): PASS
- [ ] 55. Testing en tablet: PASS
- [ ] 56. Testing en desktop: PASS

### Build & Deploy

- [ ] 57. Build local exitoso sin errores
- [ ] 58. Deploy a Vercel exitoso
- [ ] 59. Ruta `/account/addresses` accesible en producción
- [ ] 60. NO se subieron secretos/tokens al repo

---

## ESTIMACIÓN DE ESFUERZO

**Complejidad:** Media-Alta

**Archivos nuevos:** 4
- `src/app/account/addresses/page.tsx` (~250 líneas)
- `src/components/AddressForm.tsx` (~220 líneas)
- `src/components/AddressCard.tsx` (~120 líneas)
- `src/components/ConfirmDialog.tsx` (~70 líneas)

**Archivos modificados:** 1
- `src/app/account/layout.tsx` (añadir link nav, ~5 líneas)

**Total líneas estimadas:** ~665 líneas nuevas

**Tiempo estimado:**
- Desarrollo: 4-6 horas
- Testing manual: 1-2 horas
- Ajustes responsive: 1 hora
- **Total: 6-9 horas**

**Dependencias:**
- Fase 5D.1 (DB + RLS): ✅ CERRADA
- Fase 5D.2A (GET + POST API): ✅ CERRADA
- Fase 5D.2B (PATCH + DELETE API): ✅ CERRADA
- Fase 5D.2C (set-default API): ❌ OMITIDA (usar PATCH is_default)

**Bloqueadores:** Ninguno

---

## RECOMENDACIONES

### 1. Reutilizar componentes existentes
- Revisar `/account/orders` y `/account/layaways` para mantener consistencia UI
- Reutilizar Toast/Alert component si ya existe
- Reutilizar Loading skeleton si ya existe

### 2. Form management
- Si el proyecto ya usa `react-hook-form`, usarlo para AddressForm
- Si no, implementar validación manual con estado (más simple pero menos escalable)

### 3. Modal vs Drawer
- Desktop: Modal centrado (mejor UX)
- Mobile: Considerar drawer desde abajo (más natural en touch)
- Librería sugerida: Headless UI (si ya está en proyecto) o implementación custom

### 4. Testing incremental
- Implementar primero lista + estado vacío + GET
- Luego agregar formulario CREATE
- Luego PATCH y DELETE
- Testing manual después de cada incremento

### 5. Accesibilidad
- Labels en todos los inputs
- Focus visible en botones/inputs
- Confirmación navegable con teclado (Tab, Enter, Esc)
- ARIA labels en botones de acción

### 6. Performance
- NO hacer refetch en loop (solo después de mutaciones)
- Considerar optimistic updates para mejor UX (opcional)
- Debounce en validaciones de formato (opcional)

---

## SIGUIENTE FASE (NO IMPLEMENTAR TODAVÍA)

**Fase 5E:** Integración de direcciones con checkout

**Pendiente de planificar:**
- Selector de dirección de envío en checkout
- Pre-llenar dirección default
- Opción "Usar otra dirección" → selector dropdown
- Opción "Agregar nueva dirección" desde checkout
- Guardar dirección nueva desde checkout
- Validar dirección completa antes de pagar

**NO incluir en 5D.3.**

---

## APROBACIÓN REQUERIDA

Este documento define el scope completo de Fase 5D.3.

**Antes de implementar:**
1. Revisar scope completo
2. Confirmar archivos a crear/modificar
3. Validar criterios de cierre
4. Aprobar o ajustar estimación

**Después de aprobación:**
1. Implementar incrementalmente
2. Testing manual continuo
3. Build + Deploy
4. Reporte final con evidencia (screenshots, tests)

---

**Estado:** SCOPE COMPLETO - PENDIENTE DE APROBACIÓN  
**Fecha:** 2026-05-03  
**Preparado por:** Kepler  
**Fase:** 5D.3 - UI de Direcciones Cliente
