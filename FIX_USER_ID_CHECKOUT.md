# FIX CRÍTICO - Guardar user_id en Checkout

**Fecha:** 2026-05-01  
**Status:** ✅ IMPLEMENTADO Y DEPLOYADO  
**Commit:** 4f79861  
**URL Producción:** https://bagclue.vercel.app

---

## PROBLEMA CRÍTICO RESUELTO

**Bug:** Checkout NO guardaba `user_id` cuando el usuario estaba logueado
- Orders.user_id quedaba NULL
- Órdenes NO aparecían en /account/orders
- Panel de cliente NO funcionaba
- Bloqueaba cierre de Fase 5B

**Root Cause:**
`/api/checkout/create-session` no capturaba ni guardaba el `user_id` del usuario logueado.

---

## SOLUCIÓN IMPLEMENTADA

### 1. API Route: Capturar user_id validando token

**Archivo:** `src/app/api/checkout/create-session/route.ts`

**Cambios:**
```typescript
// NUEVO: Leer Authorization header
const authHeader = request.headers.get('authorization')
if (authHeader) {
  try {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (!error && user) {
      user_id = user.id
      customer_email_final = user.email || customer_email
    }
  } catch (e) {
    // Guest checkout - user_id stays null
  }
}

// NUEVO: Insertar user_id en orden
await supabaseAdmin.from('orders').insert({
  customer_name,
  customer_email: customer_email_final,  // ← user.email si está logueado
  customer_phone: customer_phone || null,
  shipping_address: shipping_address || null,
  user_id,  // ← NUEVO
  subtotal,
  shipping: 0,
  total: subtotal,
  status: 'pending',
  payment_status: 'pending'
})
```

**Seguridad:**
- ✅ user_id se obtiene en servidor, NO desde frontend
- ✅ Token se valida con supabaseAdmin.auth.getUser()
- ✅ Email de usuario logueado = source of truth
- ✅ Guest checkout sigue funcionando (user_id = null)

---

### 2. Cart Page: Precargar datos y enviar token

**Archivo:** `src/app/cart/page.tsx`

**Cambios:**
```typescript
// NUEVO: Detectar usuario logueado y precargar datos
useEffect(() => {
  async function loadUserData() {
    const { data: { user } } = await supabaseCustomer.auth.getUser()
    
    if (user) {
      setUser(user)
      setCustomerEmail(user.email || '')
      
      // Precargar nombre/teléfono desde customer_profiles
      const { data: profile } = await supabaseCustomer
        .from('customer_profiles')
        .select('name, phone')
        .eq('user_id', user.id)
        .single()
      
      if (profile) {
        if (profile.name) setCustomerName(profile.name)
        if (profile.phone) setCustomerPhone(profile.phone)
      }
    }
  }
  loadUserData()
}, [])

// NUEVO: Enviar Authorization header al API
const { data: { session } } = await supabaseCustomer.auth.getSession()
const headers: HeadersInit = { 'Content-Type': 'application/json' }

if (session?.access_token) {
  headers['Authorization'] = `Bearer ${session.access_token}`
}

await fetch('/api/checkout/create-session', {
  method: 'POST',
  headers,  // ← Incluye Authorization
  body: JSON.stringify({
    items: items.map(item => ({ product_id: item.product_id })),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone || undefined
  })
})
```

**UX Improvements:**
- ✅ Email precargado desde Supabase Auth
- ✅ Email readonly si está logueado (no editable)
- ✅ Nombre/teléfono precargados si existen en customer_profiles
- ✅ Indicador visual "usando cuenta logueada"
- ✅ Campo teléfono agregado al formulario
- ✅ Guest checkout sigue funcionando normalmente

---

### 3. Success Page: Botones de navegación

**Archivo:** `src/app/checkout/success/page.tsx`

**Cambios:**
```typescript
// NUEVO: Detectar si usuario está logueado
const [isLoggedIn, setIsLoggedIn] = useState(false)

useEffect(() => {
  async function checkAuth() {
    const { data: { user } } = await supabaseCustomer.auth.getUser()
    setIsLoggedIn(!!user)
  }
  checkAuth()
}, [])

// NUEVO: Botones condicionales
{isLoggedIn ? (
  <>
    <Link href="/account/orders">Ver mis pedidos</Link>
    <Link href="/account">Ir a mi cuenta</Link>
    <Link href="/catalogo">Ver más productos →</Link>
  </>
) : (
  <>
    <button onClick={() => window.location.href = '/catalogo'}>
      Ver más productos
    </button>
    <button onClick={() => window.location.href = '/'}>
      Volver al inicio
    </button>
  </>
)}
```

**UX Improvements:**
- ✅ Botón "Ver mis pedidos" → /account/orders
- ✅ Botón "Ir a mi cuenta" → /account
- ✅ Botón tracking público se mantiene
- ✅ Para guest: botones originales

---

## ARCHIVOS MODIFICADOS

### Código:
1. ✅ `src/app/api/checkout/create-session/route.ts`
2. ✅ `src/app/cart/page.tsx`
3. ✅ `src/app/checkout/success/page.tsx`

### Documentación:
4. `FASE_5B_VALIDATION_REPORT.md` (validación completa)
5. `FIX_USER_ID_CHECKOUT.md` (este archivo)

### Scripts de testing:
6. `check_orders_columns.mjs`
7. `validate_test_order.mjs`
8. `test_fase5b.mjs`

---

## NO SE MODIFICÓ

✅ **Confirmado que NO se tocó:**
- Stripe checkout session creation (solo customer_email actualizado)
- `/api/stripe/webhook`
- Lógica de pago/validación
- Reserva de productos
- Stock management
- Apartados (`layaways`)
- Admin (`/admin/*`)
- Tracking público (`/track/[token]`)
- RLS policies
- Database schema

---

## VALIDACIÓN POST-DEPLOY

### Estructura de Tabla (Verificada)

✅ Tabla `orders` contiene columnas:
- `user_id` (UUID, nullable) ✅
- `customer_email` (TEXT) ✅
- `customer_phone` (TEXT, nullable) ✅
- `customer_address` (TEXT, nullable) ✅
- `shipping_address` (TEXT, nullable) ✅

### Build Local

✅ Build exitoso sin errores:
```
✓ Compiled successfully in 5.6s
✓ Generating static pages using 3 workers (32/32)
```

### Deploy Vercel

✅ Deploy exitoso:
- Commit: 4f79861
- URL: https://bagclue.vercel.app
- Preview: https://bagclue-34n9bl9yb-kepleragents.vercel.app
- Build: PASS (sin errores)

---

## TESTS PENDIENTES (Requieren Jhonatan)

### 1. Checkout Guest

**Instrucciones:**
1. Logout (o abrir ventana incógnito)
2. Agregar producto al carrito
3. Ir a /cart
4. Llenar datos manualmente
5. Completar checkout con Stripe test

**Esperado:**
- ✅ Formulario NO está precargado
- ✅ Email es editable
- ✅ Checkout funciona normalmente
- ✅ Orden se crea con user_id = NULL
- ✅ Orden guarda customer_email escrito en formulario
- ✅ Success page funciona
- ✅ Tracking funciona

**Resultado:** PASS / FAIL  
**Order ID:**  
**user_id guardado:**  
**customer_email guardado:**  

---

### 2. Checkout Logueado

**Instrucciones:**
1. Login con jhonatanvenegas@usdtcapital.es
2. Agregar producto al carrito
3. Ir a /cart
4. Verificar datos precargados
5. Completar checkout con Stripe test

**Esperado:**
- ✅ Email está precargado (jhonatanvenegas@usdtcapital.es)
- ✅ Email es readonly / no editable
- ✅ Nombre/teléfono precargados si existen
- ✅ Indica "usando cuenta logueada"
- ✅ Checkout funciona
- ✅ Orden se crea con user_id = 9b37d6cc-...
- ✅ Orden guarda customer_email = jhonatanvenegas@usdtcapital.es
- ✅ Success page muestra botones "Ver mis pedidos" y "Ir a mi cuenta"

**Resultado:** PASS / FAIL  
**Order ID:**  
**user_id guardado:**  
**customer_email guardado:**  

---

### 3. Panel de Cliente

**Instrucciones:**
1. Después de checkout logueado
2. Ir a /account/orders
3. Verificar que aparece la orden
4. Click en la orden → /account/orders/[id]

**Esperado:**
- ✅ /account/orders muestra la orden nueva
- ✅ Card muestra datos correctos (número, total, fecha, estado)
- ✅ /account/orders/[id] carga detalle completo
- ✅ Detalle muestra productos, total, timeline
- ✅ Botón "Ver seguimiento" funciona

**Resultado:** PASS / FAIL  
**Orden visible en /account/orders:** SÍ / NO  
**Detalle carga correctamente:** SÍ / NO  

---

### 4. Seguridad RLS

**Instrucciones:**
1. Login con usuario A
2. Tomar order_id de usuario B (de la base de datos)
3. Intentar abrir /account/orders/[order_id_de_usuario_b]

**Esperado:**
- ✅ Muestra página 404 Not Found
- ✅ NO muestra detalles de la orden
- ✅ NO expone información de otro cliente

**Resultado:** PASS / FAIL  

---

### 5. Validación de Rutas

**Rutas a probar:**
- ✅ /cart → PASS / FAIL
- ✅ /checkout/success → PASS / FAIL
- ✅ /track/[token] → PASS / FAIL
- ✅ /account/orders → PASS / FAIL
- ✅ /account/orders/[id] → PASS / FAIL
- ✅ /admin/orders → PASS / FAIL

---

## ORDEN DE PRUEBA PREVIA (Jhonatan)

**Order ID:** 0c694f63-c61c-4f77-9421-b6e3ce287500  
**customer_email:** jho111@gmail.com  
**user_id:** NULL ❌  
**Problema:** Email NO coincide con profile (jhonatanvenegas@usdtcapital.es)  
**Resultado:** NO aparece en /account/orders (comportamiento esperado)  

**Fix aplicado resuelve este problema:**
- Si Jhonatan hace checkout logueado ahora, se guardará:
  - user_id = 9b37d6cc-...
  - customer_email = jhonatanvenegas@usdtcapital.es
  - Orden APARECERÁ en /account/orders

---

## PRÓXIMOS PASOS

### Inmediato:
1. ⚠️ Jhonatan debe probar checkout logueado
2. ⚠️ Verificar que la orden aparece en /account/orders
3. ⚠️ Verificar user_id y customer_email guardados correctamente
4. ⚠️ Probar checkout guest para confirmar que sigue funcionando

### Si TODO es PASS:
5. ✅ Cerrar oficialmente Fase 5B como COMPLETADA
6. ✅ Actualizar MEMORY.md con resultado final
7. ✅ Preparar para Fase 5C (Mis Apartados)

### Si hay algún FAIL:
5. ❌ Reportar error exacto
6. ❌ Aplicar fix inmediato
7. ❌ Re-validar

---

## COMMIT INFO

```
Commit: 4f79861
Branch: main
Author: Cryptokepler <kepler@kepleragents.com>
Date: 2026-05-01 12:23 UTC
Message: Fix CRÍTICO: Guardar user_id en checkout + UX improvements

Files changed: 9
Insertions: +1206
Deletions: -33
```

---

## CONCLUSIÓN

✅ **Fix implementado completamente**  
✅ **Código deployado a producción**  
✅ **Build exitoso local y en Vercel**  
⚠️ **Validación manual PENDIENTE**  

**Ready for Jhonatan's testing.**
