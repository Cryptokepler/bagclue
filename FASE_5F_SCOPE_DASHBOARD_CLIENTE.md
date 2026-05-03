# FASE 5F — DASHBOARD CLIENTE FINAL (SCOPE)

**Fecha:** 2026-05-03  
**Estado:** SCOPE - NO IMPLEMENTAR TODAVÍA  
**Fase anterior:** Fase 5E.2 (Perfil/Soporte) ✅ CERRADA

---

## OBJETIVO

Convertir `/account` de un panel base con accesos a un dashboard real y útil para clientas de Bagclue.

**Actualmente:**
- Mensaje de bienvenida genérico
- Información básica del perfil (email, nombre, teléfono, fecha registro)
- 2 tarjetas de acceso rápido (Mis Pedidos, Mis Apartados)

**Objetivo:**
- Bienvenida personalizada
- Resumen de pedidos (total, último, en camino)
- Resumen de apartados (activos, completados, saldo pendiente, próxima cuota)
- Resumen de direcciones (cantidad, dirección principal)
- Estado del perfil (completo/incompleto)
- Accesos rápidos mejorados

---

## 1. AUDITORÍA ESTADO ACTUAL

### Archivos actuales involucrados

#### Backend - Ninguno
- No hay endpoints API dedicados para el dashboard
- RLS policies ya existen y son seguras:
  - `orders`: usuarios solo ven sus órdenes (user_id match)
  - `layaways`: usuarios solo ven sus apartados (user_id match)
  - `customer_addresses`: usuarios solo ven sus direcciones (user_id match)
  - `customer_profiles`: usuarios solo ven su perfil (user_id match)

#### Frontend
1. **src/app/account/page.tsx** (148 líneas)
   - Carga perfil del usuario autenticado
   - Renderiza AccountDashboard
   - Manejo de loading/error states
   - Timeout protection (5s)

2. **src/components/customer/AccountDashboard.tsx** (86 líneas)
   - Recibe `profile` como prop
   - Muestra bienvenida genérica
   - Muestra información del perfil
   - 2 tarjetas de acceso rápido (Pedidos, Apartados)

3. **src/components/customer/AccountLayout.tsx** (ya existe, no tocar)
   - Layout wrapper con nav y footer
   - Logout button
   - User email display

### Patrón actual de lectura de datos

**En /account/orders/page.tsx:**
```tsx
const { data: ordersData, error } = await supabaseCustomer
  .from('orders')
  .select(`
    id,
    customer_name,
    customer_email,
    total,
    status,
    payment_status,
    tracking_token,
    tracking_number,
    shipping_status,
    created_at,
    order_items(...)
  `)
  .order('created_at', { ascending: false })
```

**En /account/layaways/page.tsx:**
```tsx
const { data: layawaysData, error } = await supabaseCustomer
  .from('layaways')
  .select(`
    id,
    user_id,
    product_id,
    customer_name,
    customer_email,
    total_amount,
    amount_paid,
    amount_remaining,
    plan_type,
    total_payments,
    payments_completed,
    payments_remaining,
    next_payment_due_date,
    next_payment_amount,
    status,
    created_at,
    product:products(...)
  `)
  .order('created_at', { ascending: false })
```

**Conclusión:** El patrón es usar `supabaseCustomer` directamente desde el frontend, confiando en RLS policies para filtrar por `user_id`.

---

## 2. DATOS A LEER

### customer_profiles (ya cargado en page.tsx)
```typescript
interface CustomerProfile {
  id: string
  user_id: string
  email: string
  name: string | null
  phone: string | null
  phone_country_code: string | null
  phone_country_iso: string | null
  created_at: string
  updated_at: string
}
```

**Uso:** Bienvenida personalizada, estado del perfil

---

### orders (nueva lectura en dashboard)
```sql
SELECT 
  id,
  status,
  shipping_status,
  total,
  created_at
FROM orders
WHERE user_id = <current_user_id>
ORDER BY created_at DESC
LIMIT 5
```

**Campos necesarios:**
- `id`: para link a detalle
- `status`: para contar pedidos en camino
- `shipping_status`: para identificar pedidos en tránsito
- `total`: para mostrar monto del último pedido
- `created_at`: para ordenar y mostrar fecha del último

**Uso:** 
- Total de pedidos
- Último pedido (fecha, monto)
- Pedidos en camino (status = 'shipped' o shipping_status = 'in_transit')

**Protección RLS:** ✅ Ya existe policy que filtra por `user_id`

---

### layaways (nueva lectura en dashboard)
```sql
SELECT 
  id,
  status,
  total_amount,
  amount_paid,
  amount_remaining,
  next_payment_due_date,
  next_payment_amount,
  created_at
FROM layaways
WHERE user_id = <current_user_id>
ORDER BY created_at DESC
```

**Campos necesarios:**
- `id`: para link a detalle
- `status`: para separar activos/completados
- `total_amount`: para cálculo de saldo total
- `amount_paid`: para cálculo de saldo total
- `amount_remaining`: para mostrar saldo pendiente
- `next_payment_due_date`: para mostrar próxima cuota
- `next_payment_amount`: para mostrar monto de próxima cuota
- `created_at`: para ordenar

**Uso:**
- Apartados activos (status IN ['active', 'pending'])
- Apartados completados (status = 'completed')
- Saldo pendiente total (SUM amount_remaining WHERE status IN ['active', 'pending'])
- Próxima cuota (MIN next_payment_due_date WHERE status = 'active' AND next_payment_due_date IS NOT NULL)

**Protección RLS:** ✅ Ya existe policy que filtra por `user_id`

---

### customer_addresses (nueva lectura en dashboard)
```sql
SELECT 
  id,
  full_name,
  address_line1,
  city,
  state,
  postal_code,
  is_default
FROM customer_addresses
WHERE user_id = <current_user_id>
ORDER BY is_default DESC, created_at DESC
```

**Campos necesarios:**
- `id`: para contar
- `full_name`, `address_line1`, `city`, `state`, `postal_code`: para mostrar dirección principal resumida
- `is_default`: para identificar dirección principal

**Uso:**
- Cantidad de direcciones guardadas
- Dirección principal resumida (is_default = true)

**Protección RLS:** ✅ Ya existe policy que filtra por `user_id`

---

## 3. QUERIES PROPUESTAS

### Opción A: Queries directas en AccountDashboard (RECOMENDADA)

**Ventajas:**
- Consistente con patrón actual (/account/orders, /account/layaways)
- Sin backend adicional
- RLS protege automáticamente
- Más rápido de implementar

**Desventajas:**
- Lógica de agregación en frontend
- Múltiples queries en paralelo

**Implementación:**
```tsx
// En AccountDashboard.tsx
useEffect(() => {
  const loadDashboardData = async () => {
    const [ordersRes, layawaysRes, addressesRes] = await Promise.all([
      supabaseCustomer.from('orders').select('id, status, shipping_status, total, created_at').order('created_at', { ascending: false }).limit(5),
      supabaseCustomer.from('layaways').select('id, status, total_amount, amount_paid, amount_remaining, next_payment_due_date, next_payment_amount, created_at').order('created_at', { ascending: false }),
      supabaseCustomer.from('customer_addresses').select('id, full_name, address_line1, city, state, postal_code, is_default').order('is_default', { ascending: false }).order('created_at', { ascending: false })
    ])
    
    // Procesar datos
    const orders = ordersRes.data || []
    const layaways = layawaysRes.data || []
    const addresses = addressesRes.data || []
    
    setDashboardData({
      orders: {
        total: orders.length,
        lastOrder: orders[0] || null,
        inTransit: orders.filter(o => o.shipping_status === 'in_transit' || o.status === 'shipped').length
      },
      layaways: {
        active: layaways.filter(l => ['active', 'pending'].includes(l.status)).length,
        completed: layaways.filter(l => l.status === 'completed').length,
        totalPending: layaways.filter(l => ['active', 'pending'].includes(l.status)).reduce((sum, l) => sum + (l.amount_remaining || 0), 0),
        nextPayment: layaways.filter(l => l.status === 'active' && l.next_payment_due_date).sort((a, b) => new Date(a.next_payment_due_date).getTime() - new Date(b.next_payment_due_date).getTime())[0] || null
      },
      addresses: {
        total: addresses.length,
        primary: addresses.find(a => a.is_default) || addresses[0] || null
      }
    })
  }
  
  loadDashboardData()
}, [])
```

### Opción B: Crear endpoints /api/account/dashboard

**Ventajas:**
- Lógica de agregación en backend
- Un solo fetch desde frontend
- Más fácil optimizar queries

**Desventajas:**
- Requiere nuevo endpoint
- Más código a mantener
- No es necesario para este caso

**Decisión:** Usar **Opción A** (consistente con patrón actual)

---

## 4. COMPONENTES UI PROPUESTOS

### 4.1. Estructura del dashboard mejorado

```tsx
<AccountLayout userEmail={userEmail}>
  <div className="space-y-6">
    {/* Bienvenida personalizada */}
    <WelcomeSection profile={profile} />
    
    {/* Grid de resúmenes */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <OrdersSummaryCard data={dashboardData.orders} />
      <LayawaysSummaryCard data={dashboardData.layaways} />
      <AddressesSummaryCard data={dashboardData.addresses} />
      <ProfileSummaryCard profile={profile} />
    </div>
    
    {/* Accesos rápidos */}
    <QuickActionsGrid />
  </div>
</AccountLayout>
```

### 4.2. WelcomeSection

**Contenido:**
- Saludo personalizado con nombre si existe, si no con "Bienvenida"
- Mensaje elegante tipo: "Bienvenida a tu espacio Bagclue, {nombre}"
- Email visible

**Props:**
```tsx
interface WelcomeSectionProps {
  profile: CustomerProfile
}
```

**Mockup:**
```
┌─────────────────────────────────────────────────┐
│ 👋 Bienvenida a tu espacio Bagclue, María      │
│ maria@example.com                               │
│ Miembro desde Enero 2026                        │
└─────────────────────────────────────────────────┘
```

---

### 4.3. OrdersSummaryCard

**Contenido:**
- Total de pedidos
- Último pedido (fecha, monto)
- Pedidos en camino (si > 0)
- Link a "Ver todos mis pedidos"

**Props:**
```tsx
interface OrdersSummaryCardProps {
  data: {
    total: number
    lastOrder: { id: string, created_at: string, total: number } | null
    inTransit: number
  }
}
```

**Mockup (con datos):**
```
┌─────────────────────────────────────────────────┐
│ 📦 Mis Pedidos                                  │
│                                                 │
│ Total de pedidos: 5                             │
│ Último pedido: 15 Abr 2026 • $12,500 MXN      │
│ En camino: 1 pedido                             │
│                                                 │
│ Ver todos mis pedidos →                         │
└─────────────────────────────────────────────────┘
```

**Mockup (sin datos):**
```
┌─────────────────────────────────────────────────┐
│ 📦 Mis Pedidos                                  │
│                                                 │
│ Aún no tienes pedidos                           │
│                                                 │
│ Explorar catálogo →                             │
└─────────────────────────────────────────────────┘
```

---

### 4.4. LayawaysSummaryCard

**Contenido:**
- Apartados activos
- Apartados completados
- Saldo pendiente total
- Próxima cuota (monto, fecha) si existe
- Link a "Ver mis apartados"

**Props:**
```tsx
interface LayawaysSummaryCardProps {
  data: {
    active: number
    completed: number
    totalPending: number
    nextPayment: { 
      next_payment_amount: number, 
      next_payment_due_date: string 
    } | null
  }
}
```

**Mockup (con apartados activos):**
```
┌─────────────────────────────────────────────────┐
│ 🏷️ Mis Apartados                                │
│                                                 │
│ Activos: 2 • Completados: 3                    │
│ Saldo pendiente: $8,400 MXN                    │
│                                                 │
│ Próxima cuota: $2,100 MXN                      │
│ Vence: 10 May 2026                              │
│                                                 │
│ Ver mis apartados →                             │
└─────────────────────────────────────────────────┘
```

**Mockup (sin apartados):**
```
┌─────────────────────────────────────────────────┐
│ 🏷️ Mis Apartados                                │
│                                                 │
│ No tienes apartados activos                     │
│                                                 │
│ Explorar catálogo →                             │
└─────────────────────────────────────────────────┘
```

---

### 4.5. AddressesSummaryCard

**Contenido:**
- Cantidad de direcciones guardadas
- Dirección principal resumida (si existe)
- Link a "Gestionar direcciones"

**Props:**
```tsx
interface AddressesSummaryCardProps {
  data: {
    total: number
    primary: {
      full_name: string
      address_line1: string
      city: string
      state: string
      postal_code: string
    } | null
  }
}
```

**Mockup (con direcciones):**
```
┌─────────────────────────────────────────────────┐
│ 📍 Mis Direcciones                              │
│                                                 │
│ 3 direcciones guardadas                         │
│                                                 │
│ Dirección principal:                            │
│ María González                                  │
│ Av. Reforma 123, Polanco                        │
│ CDMX, 11560                                     │
│                                                 │
│ Gestionar direcciones →                         │
└─────────────────────────────────────────────────┘
```

**Mockup (sin direcciones):**
```
┌─────────────────────────────────────────────────┐
│ 📍 Mis Direcciones                              │
│                                                 │
│ No tienes direcciones guardadas                 │
│                                                 │
│ Agregar dirección →                             │
└─────────────────────────────────────────────────┘
```

---

### 4.6. ProfileSummaryCard

**Contenido:**
- Perfil completo/incompleto (nombre y teléfono presentes)
- Teléfono registrado o pendiente
- Link a "Editar perfil"

**Props:**
```tsx
interface ProfileSummaryCardProps {
  profile: CustomerProfile
}
```

**Lógica de "completo":**
```tsx
const isComplete = !!(profile.name && profile.phone)
```

**Mockup (completo):**
```
┌─────────────────────────────────────────────────┐
│ 👤 Mi Perfil                                    │
│                                                 │
│ ✅ Perfil completo                              │
│ Teléfono: +52 55 1234 5678                     │
│                                                 │
│ Editar perfil →                                 │
└─────────────────────────────────────────────────┘
```

**Mockup (incompleto):**
```
┌─────────────────────────────────────────────────┐
│ 👤 Mi Perfil                                    │
│                                                 │
│ ⚠️ Perfil incompleto                            │
│ Agrega tu nombre y teléfono                     │
│                                                 │
│ Completar perfil →                              │
└─────────────────────────────────────────────────┘
```

---

### 4.7. QuickActionsGrid

**Contenido:**
- Mis pedidos
- Mis apartados
- Mis direcciones
- Perfil
- Catálogo (nuevo)

**Mockup:**
```
Accesos rápidos

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Pedidos   │ │ 🏷️ Apartados │ │ 📍 Direccion │
│ →            │ │ →            │ │ →            │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 👤 Perfil    │ │ 🛍️ Catálogo  │
│ →            │ │ →            │
└──────────────┘ └──────────────┘
```

---

## 5. ESTADOS VACÍOS

### Sin pedidos
- Tarjeta OrdersSummaryCard muestra "Aún no tienes pedidos"
- Link a "Explorar catálogo" en lugar de "Ver todos mis pedidos"

### Sin apartados
- Tarjeta LayawaysSummaryCard muestra "No tienes apartados activos"
- Link a "Explorar catálogo" en lugar de "Ver mis apartados"

### Sin direcciones
- Tarjeta AddressesSummaryCard muestra "No tienes direcciones guardadas"
- Link a "Agregar dirección" que lleva a /account/addresses

### Perfil incompleto
- Tarjeta ProfileSummaryCard muestra advertencia ⚠️
- Mensaje "Agrega tu nombre y teléfono"
- Link a "Completar perfil"

---

## 6. RESPONSIVE

**Mobile (< 768px):**
- Grid 1 columna
- Tarjetas full-width
- Texto legible sin scroll horizontal

**Tablet (768px - 1024px):**
- Grid 2 columnas
- Tarjetas balanceadas

**Desktop (>= 1024px):**
- Grid 3 columnas
- Máximo 4 tarjetas visibles en primera fila (Orders, Layaways, Addresses, Profile)
- QuickActions abajo en 2-3 columnas

---

## 7. LOADING & ERROR STATES

### Loading
```tsx
if (loading) {
  return (
    <AccountLayout userEmail={userEmail}>
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
          <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
          <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
        </div>
      </div>
    </AccountLayout>
  )
}
```

### Error parcial
Si falla cargar orders, layaways o addresses:
- Mostrar tarjeta con mensaje de error
- Permitir retry individual
- No bloquear el resto del dashboard

Ejemplo:
```tsx
{ordersError ? (
  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
    <p className="text-red-700">Error cargando pedidos</p>
    <button onClick={retryOrders}>Reintentar</button>
  </div>
) : (
  <OrdersSummaryCard data={dashboardData.orders} />
)}
```

---

## 8. TESTS MANUALES

### Test 1: Usuario con datos completos
**Precondiciones:**
- Usuario autenticado
- 3+ pedidos
- 2+ apartados activos
- 2+ direcciones
- Perfil completo (nombre + teléfono)

**Pasos:**
1. Navegar a /account
2. Verificar bienvenida personalizada con nombre
3. Verificar resumen de pedidos (total, último, en camino si aplica)
4. Verificar resumen de apartados (activos, completados, saldo, próxima cuota)
5. Verificar resumen de direcciones (total, dirección principal)
6. Verificar perfil completo ✅
7. Click en cada link de acceso rápido
8. Verificar navegación correcta

**Resultado esperado:** PASS

---

### Test 2: Usuario nuevo sin datos
**Precondiciones:**
- Usuario autenticado
- 0 pedidos
- 0 apartados
- 0 direcciones
- Perfil incompleto (sin nombre o teléfono)

**Pasos:**
1. Navegar a /account
2. Verificar bienvenida genérica
3. Verificar estado vacío en OrdersSummaryCard
4. Verificar estado vacío en LayawaysSummaryCard
5. Verificar estado vacío en AddressesSummaryCard
6. Verificar perfil incompleto ⚠️
7. Click en "Explorar catálogo"
8. Click en "Completar perfil"

**Resultado esperado:** PASS

---

### Test 3: Usuario con apartados activos
**Precondiciones:**
- Usuario autenticado
- 1+ apartados activos con próxima cuota definida

**Pasos:**
1. Navegar a /account
2. Verificar LayawaysSummaryCard muestra próxima cuota
3. Verificar monto de próxima cuota
4. Verificar fecha de próxima cuota
5. Click en "Ver mis apartados"

**Resultado esperado:** PASS

---

### Test 4: Usuario con pedidos en camino
**Precondiciones:**
- Usuario autenticado
- 1+ pedidos con shipping_status = 'in_transit' o status = 'shipped'

**Pasos:**
1. Navegar a /account
2. Verificar OrdersSummaryCard muestra "En camino: X pedidos"
3. Click en "Ver todos mis pedidos"

**Resultado esperado:** PASS

---

### Test 5: Responsive mobile
**Precondiciones:**
- Usuario autenticado con datos completos

**Pasos:**
1. Abrir /account en mobile (< 768px)
2. Verificar grid 1 columna
3. Verificar tarjetas full-width
4. Verificar texto legible sin scroll horizontal
5. Verificar navegación mobile funciona

**Resultado esperado:** PASS

---

### Test 6: Error de carga parcial
**Precondiciones:**
- Usuario autenticado
- Simular error en fetch de orders (desconectar internet temporalmente o mock error)

**Pasos:**
1. Navegar a /account
2. Verificar tarjeta de error en OrdersSummaryCard
3. Verificar resto del dashboard carga correctamente
4. Click en "Reintentar"
5. Verificar carga exitosa

**Resultado esperado:** PASS

---

## 9. RIESGOS

### Riesgo 1: Performance con muchos apartados
**Descripción:** Usuario con 20+ apartados puede tener query lento

**Mitigación:**
- Agregar LIMIT en queries si es necesario
- Usar .maybeSingle() para next_payment
- Calcular saldo total en backend si se degrada

**Severidad:** Baja (test mode, pocos usuarios con 20+ apartados)

---

### Riesgo 2: RLS policies incorrectas
**Descripción:** Si RLS policies no filtran correctamente, usuario podría ver datos de otros

**Mitigación:**
- Auditoría de policies antes de implementar (YA EXISTEN Y FUERON VALIDADAS)
- Tests manuales con 2+ usuarios
- Verificar user_id en cada query

**Severidad:** Alta (seguridad crítica)

**Status:** ✅ Policies ya existen y fueron validadas en Fase 5B, 5C, 5D, 5E

---

### Riesgo 3: Formato de montos inconsistente
**Descripción:** Mostrar $12500 en lugar de $12,500 MXN

**Mitigación:**
- Usar función helper `formatCurrency(amount: number): string`
- Consistente en todas las tarjetas
- Incluir "MXN" para claridad

**Severidad:** Baja (UX)

---

### Riesgo 4: Próxima cuota NULL o indefinida
**Descripción:** Apartado activo sin `next_payment_due_date` definido

**Mitigación:**
- Manejar caso NULL en UI
- Mostrar "Próxima cuota: Pendiente de confirmar"
- No romper la tarjeta

**Severidad:** Media

---

### Riesgo 5: Tocar checkout/Stripe/webhook accidentalmente
**Descripción:** Durante implementación, modificar archivos fuera de scope

**Mitigación:**
- Scope claro: SOLO modificar AccountDashboard.tsx
- NO tocar: checkout, Stripe, webhook, admin, DB schema, RLS, migrations
- Code review antes de commit

**Severidad:** Alta (regresión crítica)

---

## 10. CRITERIOS DE CIERRE

### Funcionales
1. ✅ Bienvenida personalizada con nombre si existe
2. ✅ Resumen de pedidos (total, último, en camino)
3. ✅ Resumen de apartados (activos, completados, saldo, próxima cuota)
4. ✅ Resumen de direcciones (total, dirección principal)
5. ✅ Estado del perfil (completo/incompleto)
6. ✅ Accesos rápidos a 5 secciones
7. ✅ Estados vacíos para cada sección
8. ✅ Links de navegación funcionan correctamente

### Técnicos
9. ✅ Queries usan supabaseCustomer con RLS (no service_role)
10. ✅ Build PASS
11. ✅ Deploy production Ready
12. ✅ No se tocó: checkout, Stripe, webhook, admin, DB/RLS/migrations

### UX
13. ✅ Responsive mobile/tablet/desktop
14. ✅ Loading states implementados
15. ✅ Error states implementados (con retry)
16. ✅ Texto legible, sin overflow
17. ✅ Formato de montos consistente ($X,XXX MXN)

### Testing
18. ✅ Test 1: Usuario con datos completos - PASS
19. ✅ Test 2: Usuario nuevo sin datos - PASS
20. ✅ Test 3: Usuario con apartados activos - PASS
21. ✅ Test 4: Usuario con pedidos en camino - PASS
22. ✅ Test 5: Responsive mobile - PASS
23. ✅ Test 6: Error de carga parcial - PASS

### Validación manual por Jhonatan
24. ✅ /account abre correctamente
25. ✅ Dashboard muestra datos reales del usuario
26. ✅ No hay errores en consola
27. ✅ Navegación entre secciones funciona
28. ✅ No se detectaron regresiones en otras funcionalidades

---

## 11. ARCHIVOS A MODIFICAR

### Modificar
1. **src/components/customer/AccountDashboard.tsx** (reescritura completa)
   - Agregar useEffect para cargar orders/layaways/addresses
   - Crear componentes internos: WelcomeSection, OrdersSummaryCard, LayawaysSummaryCard, AddressesSummaryCard, ProfileSummaryCard, QuickActionsGrid
   - Manejar loading/error states
   - Calcular agregaciones (totales, saldos, próximas cuotas)

### NO modificar
- ❌ src/app/account/page.tsx (solo renderiza AccountDashboard, ya funciona)
- ❌ src/components/customer/AccountLayout.tsx (layout wrapper, ya funciona)
- ❌ src/app/api/\*\*/\* (no se crean nuevos endpoints)
- ❌ supabase/migrations/\* (no se tocan migraciones)
- ❌ src/app/api/stripe/\* (no tocar Stripe)
- ❌ src/app/api/checkout/\* (no tocar checkout)
- ❌ src/app/admin/\* (no tocar admin)

---

## 12. ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 2-3 horas (desarrollo + testing)

**Desglose:**
- Queries y lógica de agregación: 45 min
- Componentes UI (6 componentes): 60 min
- Loading/error states: 20 min
- Responsive: 15 min
- Testing manual (6 tests): 30 min

---

## 13. SIGUIENTE PASO

**Esperando aprobación de Jhonatan para implementar Fase 5F.**

Una vez aprobado:
1. Implementar cambios en AccountDashboard.tsx
2. Build local
3. Commit
4. Deploy production
5. Testing manual (6 tests)
6. Reporte final
7. Cierre de Fase 5F

**NO avanzar sin aprobación explícita.**
