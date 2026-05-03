# Sistema de Cuentas de Cliente - Diseño Técnico
**Proyecto:** Bagclue  
**Fecha:** 2026-04-30  
**Versión:** 1.0 - Diseño para aprobación

---

## 📋 CONTEXTO

**Producto:** E-commerce de bolsas de lujo con apartados

**Stack actual:**
- ✅ Productos
- ✅ Admin (separado, con login propio)
- ✅ Carrito (localStorage)
- ✅ Stripe Checkout
- ✅ Órdenes (sin user_id)
- ✅ Tracking por token (público, sin login)
- ✅ Sistema de apartado (en progreso)

**Decisión:** Agregar cuentas de cliente con Supabase Auth

**Objetivo:** Panel de cliente donde vean historial de compras, apartados activos, direcciones guardadas y tracking.

**NO incluir (por ahora):**
- Wishlist / favoritos
- Puntos / loyalty
- Reviews
- Chat interno

**SÍ incluir:**
- Login/registro
- Historial de pedidos
- Apartados activos
- Direcciones guardadas
- Perfil editable

---

## 1️⃣ FLUJO DE LOGIN/REGISTRO CLIENTE

### 1.1 Registro de Nueva Clienta

**Opción A: Magic Link (recomendado)**
```
Cliente click "Crear cuenta"
↓
Ingresa email
↓
Supabase envía magic link al email
↓
Click en link → crea cuenta automáticamente
↓
Redirige a /account (logged in)
↓
Opcionalmente: completar perfil (nombre, teléfono)
```

**Opción B: Email + Password**
```
Cliente click "Crear cuenta"
↓
Form: email, password, nombre
↓
Supabase.auth.signUp()
↓
Email de confirmación
↓
Click en link de confirmación
↓
Redirige a /account/login
↓
Login con email + password
```

**Preferencia:** Magic Link (más simple, menos fricción)

### 1.2 Login de Clienta Existente

**Con Magic Link:**
```
Click "Iniciar sesión"
↓
Ingresa email
↓
Supabase envía magic link
↓
Click → logged in
↓
Redirige a /account
```

**Con Email + Password:**
```
Click "Iniciar sesión"
↓
Ingresa email + password
↓
Supabase.auth.signInWithPassword()
↓
Redirige a /account
```

### 1.3 Vincular Compras Anteriores (al crear cuenta)

**Flujo automático:**
```
Cliente crea cuenta con email: maria@ejemplo.com
↓
Trigger de DB busca órdenes y apartados con customer_email = maria@ejemplo.com
↓
Actualiza orders.user_id y layaways.user_id con el nuevo auth.uid
↓
Ahora aparecen en su panel automáticamente
```

**Implementación:** Database trigger o función RPC

---

## 2️⃣ TABLAS NUEVAS

### 2.1 `customer_profiles` (extends auth.users)

**Purpose:** Información adicional del perfil de cliente

```sql
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos básicos
  full_name TEXT,
  phone TEXT,
  
  -- Preferencias
  preferred_currency TEXT DEFAULT 'MXN',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stats (denormalizados para performance)
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0.00,
  active_layaways INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON customer_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON customer_profiles
  FOR ALL
  TO service_role
  USING (true);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2.2 `customer_addresses`

**Purpose:** Direcciones guardadas de la cliente

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de dirección
  label TEXT, -- "Casa", "Trabajo", etc.
  full_name TEXT NOT NULL,
  phone TEXT,
  street TEXT NOT NULL,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'México',
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(user_id, is_default);

-- RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON customer_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON customer_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON customer_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON customer_addresses
  FOR ALL
  TO service_role
  USING (true);
```

---

## 3️⃣ MODIFICACIONES A TABLAS EXISTENTES

### 3.1 Tabla `orders`

**Agregar campos:**
```sql
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN guest_checkout BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_orders_user_id ON orders(user_id);

COMMENT ON COLUMN orders.user_id IS 'ID de cliente autenticado (null si fue compra como invitada)';
COMMENT ON COLUMN orders.guest_checkout IS 'True si fue compra sin login';
```

**Lógica:**
- Si `user_id` IS NOT NULL → orden pertenece a cliente registrado
- Si `user_id` IS NULL y `guest_checkout` = TRUE → orden de invitado
- `customer_email` siempre se guarda (para vincular después)

### 3.2 Tabla `layaways`

**Agregar campo:**
```sql
ALTER TABLE layaways ADD COLUMN user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_layaways_user_id ON layaways(user_id);

COMMENT ON COLUMN layaways.user_id IS 'ID de cliente autenticado (null si fue apartado como invitada)';
```

**Lógica:**
- Si cliente está logged in → `user_id` se guarda al crear apartado
- Si NO está logged in → `user_id` queda NULL (puede vincularse después)

### 3.3 RLS Updates para Orders y Layaways

**Nueva policy para `orders`:**
```sql
-- Permitir que clientes vean sus propias órdenes
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Nueva policy para `layaways`:**
```sql
-- Permitir que clientes vean sus propios apartados
CREATE POLICY "Users can view own layaways"
  ON layaways
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Mantener policies existentes:**
- Public read by tracking_token (para /track/[token])
- Service role full access

---

## 4️⃣ VINCULAR COMPRAS EXISTENTES POR EMAIL

### 4.1 Función de Vinculación Automática

**Trigger al crear cuenta:**
```sql
CREATE OR REPLACE FUNCTION link_existing_orders_and_layaways()
RETURNS TRIGGER AS $$
BEGIN
  -- Obtener email del nuevo usuario
  DECLARE
    user_email TEXT;
  BEGIN
    user_email := NEW.email;
    
    -- Vincular órdenes existentes
    UPDATE orders
    SET user_id = NEW.id
    WHERE customer_email = user_email
      AND user_id IS NULL;
    
    -- Vincular apartados existentes
    UPDATE layaways
    SET user_id = NEW.id
    WHERE customer_email = user_email
      AND user_id IS NULL;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_link_orders
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_existing_orders_and_layaways();
```

### 4.2 Endpoint Manual de Vinculación

**API:** `POST /api/account/link-previous-purchases`

**Purpose:** Permitir a cliente vincular compras anteriores manualmente

**Body:** (vacío, usa auth token)

**Lógica:**
```typescript
const user = await supabase.auth.getUser()
const userEmail = user.data.user?.email

// Buscar y vincular órdenes
await supabase
  .from('orders')
  .update({ user_id: user.data.user.id })
  .eq('customer_email', userEmail)
  .is('user_id', null)

// Buscar y vincular apartados
await supabase
  .from('layaways')
  .update({ user_id: user.data.user.id })
  .eq('customer_email', userEmail)
  .is('user_id', null)
```

---

## 5️⃣ COMPRA LOGUEADA

### 5.1 Flujo de Checkout con Cuenta

```
Cliente logged in agrega producto al carrito
↓
Click "Proceder al checkout"
↓
Checkout page detecta sesión activa
↓
Pre-llena datos: nombre, email, teléfono desde customer_profiles
↓
Opción: "Usar dirección guardada" (dropdown de customer_addresses)
↓
O ingresar dirección nueva + checkbox "Guardar para próximas compras"
↓
Procede a Stripe Checkout
↓
Webhook recibe payment success
↓
Crea orden con user_id = auth.uid
↓
Si marcó "Guardar dirección" → crea customer_address
↓
Cliente redirigido a /account/orders/[id] (o /track/[token] como backup)
```

### 5.2 Modificaciones en Checkout

**Endpoint:** `POST /api/checkout/create-session`

**Cambios:**
```typescript
// Detectar si cliente está logged in
const session = await supabase.auth.getSession()
const userId = session.data.session?.user?.id || null

// Al crear orden (antes de Stripe):
const order = await supabase.from('orders').insert({
  customer_name,
  customer_email,
  user_id: userId, // ← NUEVO
  guest_checkout: userId === null, // ← NUEVO
  ...rest
})

// Metadata de Stripe incluye user_id
const stripeSession = await stripe.checkout.sessions.create({
  metadata: {
    order_id: order.id,
    user_id: userId || '' // ← NUEVO
  }
})
```

---

## 6️⃣ COMPRA COMO INVITADA (Guest Checkout)

### 6.1 Flujo Guest

```
Cliente NO logged in
↓
Agrega producto al carrito
↓
Click "Proceder al checkout"
↓
Checkout page: opción "Continuar como invitada" o "Crear cuenta"
↓
Si elige "Continuar como invitada":
  → Form: nombre, email, teléfono, dirección
  → NO se guarda nada permanentemente
  → Stripe Checkout
  → Orden creada con user_id = NULL, guest_checkout = TRUE
  → Redirige a /track/[tracking_token] (público)
↓
Si elige "Crear cuenta":
  → Redirige a /account/register con redirect_to=/checkout
  → Crea cuenta
  → Vuelve a checkout (ahora como logged in)
```

### 6.2 Beneficio de Crear Cuenta

**Mensaje en checkout:**
```
¿Crear una cuenta?
✓ Ver historial de compras
✓ Rastrear apartados activos
✓ Guardar direcciones
✓ Checkout más rápido

[Crear cuenta] [Continuar como invitada]
```

---

## 7️⃣ APARTADO CON CUENTA

### 7.1 Flujo Logged In

```
Cliente logged in
↓
Click "Apartar pieza"
↓
Modal pre-lleno con: nombre, email, teléfono (desde profile)
↓
Confirma apartado
↓
POST /api/layaways/create con auth header
↓
Apartado creado con user_id = auth.uid
↓
Redirige a /account/layaways (panel de apartados)
↓
Puede pagar saldo desde ahí o desde /layaway/[token]
```

### 7.2 Flujo Guest

```
Cliente NO logged in
↓
Click "Apartar pieza"
↓
Modal: ingresar nombre, email, teléfono
↓
Apartado creado con user_id = NULL
↓
Redirige a /layaway/[token] (público)
↓
Si después crea cuenta con ese email → apartado se vincula automáticamente
```

---

## 8️⃣ RUTAS NUEVAS

### 8.1 Auth Routes

| Ruta | Purpose | Pública/Privada |
|------|---------|-----------------|
| `/account/login` | Login con magic link o password | Pública |
| `/account/register` | Registro de nueva cuenta | Pública |
| `/account/logout` | Cerrar sesión | Privada |

### 8.2 Account Dashboard Routes

| Ruta | Purpose | Privada | Componente |
|------|---------|---------|------------|
| `/account` | Dashboard principal | ✅ | AccountDashboard |
| `/account/orders` | Lista de pedidos | ✅ | OrdersList |
| `/account/orders/[id]` | Detalle de pedido | ✅ | OrderDetail |
| `/account/layaways` | Apartados activos | ✅ | LayawaysList |
| `/account/layaways/[id]` | Detalle de apartado | ✅ | LayawayDetail |
| `/account/addresses` | Direcciones guardadas | ✅ | AddressesList |
| `/account/profile` | Editar perfil | ✅ | ProfileEdit |

**Protección:** Middleware de Supabase Auth con `getSession()`

**Redirect:** Si no logged in → redirige a `/account/login?redirect_to=[current_path]`

---

## 9️⃣ ENDPOINTS NUEVOS

### 9.1 Auth Endpoints

**Ya manejados por Supabase Auth:**
- `POST /auth/v1/signup` (magic link o password)
- `POST /auth/v1/token?grant_type=magiclink`
- `POST /auth/v1/logout`

**Custom endpoints (si necesarios):**
- `POST /api/auth/verify-magic-link` - Callback handler
- `POST /api/auth/check-session` - Verificar si está logged in

### 9.2 Account Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/account/profile` | GET | ✅ | Obtener perfil |
| `/api/account/profile` | PUT | ✅ | Actualizar perfil |
| `/api/account/orders` | GET | ✅ | Lista de órdenes del user |
| `/api/account/orders/[id]` | GET | ✅ | Detalle de orden (verificar ownership) |
| `/api/account/layaways` | GET | ✅ | Apartados del user |
| `/api/account/layaways/[id]` | GET | ✅ | Detalle de apartado |
| `/api/account/addresses` | GET | ✅ | Direcciones guardadas |
| `/api/account/addresses` | POST | ✅ | Crear dirección |
| `/api/account/addresses/[id]` | PUT | ✅ | Editar dirección |
| `/api/account/addresses/[id]` | DELETE | ✅ | Eliminar dirección |
| `/api/account/addresses/[id]/set-default` | POST | ✅ | Marcar como default |
| `/api/account/link-previous-purchases` | POST | ✅ | Vincular compras por email |

### 9.3 Auth Middleware

**Para todas las rutas `/api/account/*`:**
```typescript
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return NextResponse.next()
}
```

---

## 🔟 SEGURIDAD Y RLS

### 10.1 Políticas de Supabase RLS

**Principio:** Usuarios solo ven/editan sus propios datos

**Tablas afectadas:**
1. ✅ `customer_profiles` - Solo ver/editar propio perfil
2. ✅ `customer_addresses` - Solo CRUD propias direcciones
3. ✅ `orders` - Solo ver propias órdenes (+ tracking público por token)
4. ✅ `layaways` - Solo ver propios apartados (+ tracking público por token)

**RLS ya aplicado en diseño de tablas (sección 2 y 3)**

### 10.2 Separación Admin vs Cliente

| Aspecto | Admin | Cliente |
|---------|-------|---------|
| Auth | Login custom (password hash en tabla) | Supabase Auth |
| Rutas | `/admin/*` | `/account/*` |
| Acceso | Full (todos los pedidos/productos) | Solo sus datos |
| Rol | service_role policies | authenticated role policies |

**NO hay cruce:** Admin NO usa Supabase Auth, Cliente NO accede a `/admin/*`

### 10.3 Validación de Ownership

**En endpoints de `/api/account/orders/[id]`:**
```typescript
// Verificar que la orden pertenece al usuario
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .eq('user_id', session.user.id) // ← ownership check
  .single()

if (!order) {
  return NextResponse.json({ error: 'Order not found' }, { status: 404 })
}
```

---

## 1️⃣1️⃣ ORDEN DE IMPLEMENTACIÓN POR FASES

### **FASE 1: Base de Autenticación** (2-3 horas)

**Objetivo:** Login/registro funcional

**Tareas:**
1. ✅ Configurar Supabase Auth en proyecto
2. ✅ Crear tabla `customer_profiles` + trigger
3. ✅ Página `/account/login` (magic link)
4. ✅ Página `/account/register` (magic link)
5. ✅ Logout
6. ✅ Middleware de protección de rutas
7. ✅ Componente `AccountLayout` con nav

**Criterio de cierre:**
- Cliente puede crear cuenta con magic link
- Cliente puede login
- Perfil se crea automáticamente
- Rutas protegidas redirigen si no logged in

---

### **FASE 2: Panel de Órdenes** (2-3 horas)

**Objetivo:** Ver historial de compras

**Tareas:**
1. ✅ Modificar tabla `orders` (agregar `user_id`, `guest_checkout`)
2. ✅ Función/trigger de vinculación automática por email
3. ✅ Endpoint `GET /api/account/orders`
4. ✅ Endpoint `GET /api/account/orders/[id]`
5. ✅ Página `/account` (dashboard con resumen)
6. ✅ Página `/account/orders` (lista)
7. ✅ Página `/account/orders/[id]` (detalle)
8. ✅ RLS policy para orders by user_id

**Criterio de cierre:**
- Cliente ve lista de sus órdenes
- Cliente ve detalle de orden específica
- Compras anteriores con mismo email se vinculan automáticamente
- Guest checkout sigue funcionando (user_id = null)

---

### **FASE 3: Panel de Apartados** (1-2 horas)

**Objetivo:** Ver apartados activos y completados

**Tareas:**
1. ✅ Modificar tabla `layaways` (agregar `user_id`)
2. ✅ Actualizar función de vinculación para apartados
3. ✅ Endpoint `GET /api/account/layaways`
4. ✅ Endpoint `GET /api/account/layaways/[id]`
5. ✅ Página `/account/layaways`
6. ✅ Modificar `LayawayButton` para pre-llenar si logged in
7. ✅ RLS policy para layaways by user_id

**Criterio de cierre:**
- Cliente ve apartados activos y completados
- Puede pagar saldo desde panel o desde /layaway/[token]
- Apartado creado con cuenta queda vinculado automáticamente

---

### **FASE 4: Direcciones Guardadas** (2-3 horas)

**Objetivo:** CRUD de direcciones

**Tareas:**
1. ✅ Crear tabla `customer_addresses`
2. ✅ Endpoints CRUD de direcciones
3. ✅ Página `/account/addresses`
4. ✅ Form para agregar/editar dirección
5. ✅ Marcar dirección como default
6. ✅ RLS policies

**Criterio de cierre:**
- Cliente puede agregar/editar/eliminar direcciones
- Puede marcar una como default
- Solo ve sus propias direcciones

---

### **FASE 5: Checkout Integrado** (2-3 horas)

**Objetivo:** Checkout usa datos de cuenta si logged in

**Tareas:**
1. ✅ Modificar `/checkout` para detectar sesión
2. ✅ Pre-llenar datos si logged in
3. ✅ Dropdown "Usar dirección guardada"
4. ✅ Checkbox "Guardar esta dirección"
5. ✅ Modificar webhook para guardar dirección si marcado
6. ✅ Modificar `POST /api/checkout/create-session` para incluir `user_id`
7. ✅ Success redirect a `/account/orders/[id]` si logged in

**Criterio de cierre:**
- Checkout pre-llena datos de cuenta
- Puede usar dirección guardada
- Puede guardar nueva dirección
- Guest checkout sigue funcionando
- Orden queda vinculada automáticamente

---

### **FASE 6: Perfil Editable** (1 hora)

**Objetivo:** Cliente puede editar su perfil

**Tareas:**
1. ✅ Endpoint `PUT /api/account/profile`
2. ✅ Página `/account/profile`
3. ✅ Form para editar: nombre, teléfono, email (con confirmación)

**Criterio de cierre:**
- Cliente puede actualizar nombre y teléfono
- Email se puede cambiar (requiere confirmación de Supabase)

---

### **FASE 7: Mejoras UX** (1-2 horas)

**Objetivo:** Pulir experiencia

**Tareas:**
1. ✅ Dashboard `/account` con stats (total órdenes, apartados activos)
2. ✅ Badges/iconos de estado en listas
3. ✅ Botón "Crear cuenta" en tracking público
4. ✅ Banner en checkout: "¿Crear cuenta?" con beneficios
5. ✅ Link de logout en navbar

**Criterio de cierre:**
- Dashboard muestra resumen útil
- UX clara entre guest y logged in
- Flujo de conversión guest → registered

---

## 1️⃣2️⃣ CRITERIOS DE CIERRE GLOBAL

### ✅ Autenticación
- [x] Cliente puede registrarse con magic link
- [x] Cliente puede login con magic link
- [x] Cliente puede logout
- [x] Sesión persiste entre páginas
- [x] Rutas privadas protegidas con middleware

### ✅ Órdenes
- [x] Cliente ve lista de sus órdenes
- [x] Cliente ve detalle de orden
- [x] Órdenes pasadas se vinculan automáticamente por email
- [x] Guest checkout sigue funcionando
- [x] Tracking público (`/track/[token]`) sigue funcionando

### ✅ Apartados
- [x] Cliente ve apartados activos y completados
- [x] Cliente puede pagar saldo desde panel
- [x] Apartados creados con cuenta quedan vinculados
- [x] Apartados guest se vinculan al crear cuenta

### ✅ Direcciones
- [x] Cliente puede crear/editar/eliminar direcciones
- [x] Cliente puede marcar dirección como default
- [x] Checkout puede usar dirección guardada
- [x] Checkout puede guardar nueva dirección

### ✅ Checkout
- [x] Checkout detecta si cliente está logged in
- [x] Pre-llena datos de perfil si logged in
- [x] Permite checkout como invitada
- [x] Ofrece crear cuenta en checkout
- [x] Órdenes logged in incluyen `user_id`

### ✅ Perfil
- [x] Cliente puede editar nombre y teléfono
- [x] Cliente puede cambiar email (con confirmación)
- [x] Dashboard muestra stats básicos

### ✅ Seguridad
- [x] RLS policies correctas en todas las tablas
- [x] Clientes solo ven sus propios datos
- [x] Admin separado de cliente (auth diferente)
- [x] Ownership verificado en endpoints

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Tipo | Descripción |
|------------|------|-------------|
| DB | Nueva tabla | `customer_profiles` |
| DB | Nueva tabla | `customer_addresses` |
| DB | Modificación | `orders.user_id`, `orders.guest_checkout` |
| DB | Modificación | `layaways.user_id` |
| DB | Trigger | Auto-crear perfil al registrarse |
| DB | Trigger | Vincular órdenes/apartados por email |
| DB | RLS | Policies para todas las tablas de cliente |
| Frontend | Nuevas páginas | `/account/*` (8 rutas) |
| Frontend | Modificación | `/checkout` (detectar sesión, pre-llenar) |
| Frontend | Modificación | `LayawayButton` (pre-llenar si logged in) |
| API | Nuevos endpoints | `/api/account/*` (10+ endpoints) |
| API | Modificación | `/api/checkout/create-session` (incluir user_id) |
| Auth | Supabase Auth | Magic link + session management |
| Middleware | Next.js | Protección de rutas `/account/*` |

---

## ⏱️ ESTIMACIÓN TOTAL

**Fases:**
- Fase 1 (Auth): 2-3h
- Fase 2 (Órdenes): 2-3h
- Fase 3 (Apartados): 1-2h
- Fase 4 (Direcciones): 2-3h
- Fase 5 (Checkout): 2-3h
- Fase 6 (Perfil): 1h
- Fase 7 (UX): 1-2h

**Total:** 11-17 horas de implementación

**Testing + bugs:** +3-5 horas

**Gran total:** 14-22 horas (~2-3 días de trabajo)

---

## 🎯 NOTAS IMPORTANTES

### Mantener Compatibilidad

**Tracking público sigue funcionando:**
- `/track/[tracking_token]` NO requiere login
- Cualquiera con el link puede ver el pedido
- Útil para compartir status con familiares

**Guest checkout sigue funcionando:**
- NO obligar a crear cuenta para comprar
- Checkout debe tener opción clara de "Continuar sin cuenta"
- Conversión a cuenta es opcional pero incentivada

### Magic Link vs Password

**Recomendación:** Magic Link como opción principal
- Más simple (sin password)
- Menos fricción en registro
- Menos riesgo de olvido de contraseña
- Fallback: permitir password como opción alternativa

### Admin NO usa Supabase Auth

**Separación clara:**
- Admin sigue con login custom (`/admin/login`)
- Cliente usa Supabase Auth (`/account/login`)
- NO hay cruce ni roles compartidos
- Tablas de auth completamente separadas

---

## 🚀 APROBACIÓN REQUERIDA

**Pendiente de validar:**
1. ✅ Supabase Auth con magic link
2. ✅ Estructura de tablas propuesta
3. ✅ Flujo guest checkout vs logged in
4. ✅ Vinculación automática por email
5. ✅ Plan de fases de implementación
6. ✅ Estimación de tiempo (14-22h)

**Preguntas clave:**
- ¿Aprobar magic link como método principal?
- ¿Orden de fases correcto?
- ¿Algo faltante en el scope?

**Próximo paso:** Esperar aprobación antes de implementar.
