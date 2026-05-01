# Loading Infinito Fix - Diagnóstico y Solución
**Fecha:** 2026-05-01 10:13 UTC  
**Bug:** /account/login se queda en "Cargando..." infinito (Chrome normal, no incógnito)

---

## 🔍 DIAGNÓSTICO COMPLETO

### 1. Código de /account/login

**Archivo:** `src/app/account/login/page.tsx`
```typescript
// Solo renderiza LoginForm - no tiene lógica propia
<LoginForm />
```

**Archivo:** `src/components/customer/LoginForm.tsx` (ANTES del fix)
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabaseCustomer.auth.getUser() // ❌ SIN TIMEOUT
    
    if (user) {
      router.push('/account') // Redirige a /account si detecta user
    }
  }
  checkAuth()
}, [router])
```

**Problema:** Si `getUser()` se queda esperando → nunca resuelve → nunca muestra formulario

---

### 2. ¿Qué condición muestra "Cargando..."?

**El "Cargando..." NO viene de LoginForm, viene de /account/page.tsx**

**Flujo real:**
1. Usuario va a `/account/login`
2. LoginForm ejecuta `checkAuth()`
3. `getUser()` detecta un user (sesión corrupta/vieja)
4. `router.push('/account')`
5. `/account/page.tsx` ejecuta `loadProfile()`
6. `loadProfile()` ejecuta `getUser()` de nuevo
7. `getUser()` se queda trabado ❌
8. Renderiza: `<p>Cargando tu cuenta...</p>` para siempre

---

### 3. ¿Qué promesa está esperando?

**supabaseCustomer.auth.getUser()**

**Posibles causas del hang:**
- Session corrupta en localStorage
- Token expirado que intenta refresh infinitamente
- Network request que nunca resuelve
- Múltiples GoTrueClient instances compitiendo por localStorage
- Bug en Supabase client v2.x con detectSessionInUrl

**Confirmado:** En Chrome normal (con sesión previa) se queda esperando. En incógnito (sin sesión) funciona.

---

### 4. Clientes Supabase en Browser

**Instancias encontradas:**

1. **supabaseCustomer** (`src/lib/supabase-customer.ts`)
   - ✅ Singleton con auth config
   - Usado en: LoginForm, AccountPage, API routes

2. **supabase** (`src/lib/supabase.ts`)
   - ✅ Ahora re-exporta supabaseCustomer (fix previo)
   - Usado en: Catálogo

3. **middleware** (`src/middleware.ts`)
   - ⚠️ Crea instancia en edge runtime (NO en browser)
   - `persistSession: false`
   - NO causa problemas de GoTrueClient en browser

**Total en browser:** 1 instancia (singleton)

---

### 5. ¿Más de un createClient() con auth activo?

**NO** (después del fix previo de 189f75a)

Antes había 2:
- `src/lib/supabase.ts` creaba instancia propia ❌
- `src/lib/supabase-customer.ts` creaba instancia propia ❌

Ahora solo hay 1:
- `src/lib/supabase.ts` re-exporta `supabaseCustomer` ✅

---

### 6. Conflictos entre archivos

**NO hay conflicto de instancias ahora.**

Pero sí hay **conflicto lógico:**
- LoginForm y AccountPage ambos ejecutan `getUser()` sin timeout
- Si getUser() se queda esperando → loading infinito

**Middleware NO interfiere:**
- Se ejecuta en edge runtime, no en browser
- Usa cookies para auth check, no localStorage
- NO crea GoTrueClient en browser context

---

## ✅ FIX IMPLEMENTADO

### Fix #1: Timeout en getUser() (LoginForm)

**ANTES:**
```typescript
const { data: { user } } = await supabaseCustomer.auth.getUser()
// Si getUser() se queda esperando → nunca resuelve
```

**DESPUÉS:**
```typescript
const authCheckPromise = supabaseCustomer.auth.getUser()
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), 5000)
)

const { data: { user }, error } = await Promise.race([
  authCheckPromise,
  timeoutPromise
])
// Máximo 5 segundos, luego rechaza con 'timeout'
```

---

### Fix #2: Timeout en getUser() (AccountPage)

**Mismo patrón:**
- `getUser()` tiene timeout de 5s
- `from('customer_profiles')` tiene timeout de 5s
- Si falla → muestra error con botón "Reintentar" y "Cerrar sesión"

---

### Fix #3: Estado initialLoading

**LoginForm ahora tiene 3 estados:**

1. **initialLoading** (máximo 5s):
   ```
   Verificando sesión...
   Máximo 5 segundos
   ```

2. **Error detectado** (sesión corrupta):
   ```
   Sesión corrupta detectada. Haz click en "Limpiar sesión" abajo.
   [Botón: Limpiar sesión]
   ```

3. **Normal** (formulario de login):
   ```
   [Formulario completo con Google + Magic Link]
   ```

---

### Fix #4: Botón "Limpiar sesión"

**Función:**
```typescript
const handleClearSession = async () => {
  await supabaseCustomer.auth.signOut()
  setMessage({ type: 'success', text: 'Sesión limpiada.' })
}
```

**Trigger automático:**
- Si getUser() lanza timeout → mensaje muestra botón
- Usuario hace click → limpia localStorage
- Puede volver a intentar login limpio

---

### Fix #5: AccountPage con Error States

**Ahora tiene 4 estados:**

1. **Loading** (máximo 5s)
2. **Error** (con botón "Reintentar" + "Cerrar sesión")
3. **No profile** (mensaje + botón "Volver a login")
4. **Success** (dashboard normal)

**Nunca loading infinito.**

---

## 📋 VALIDACIÓN

### Checks obligatorios:

- [x] **getUser() tiene timeout de 5s** (LoginForm)
- [x] **getUser() tiene timeout de 5s** (AccountPage)
- [x] **Renderiza formulario aunque checkAuth falle**
- [x] **Muestra mensaje de error si timeout**
- [x] **Botón "Limpiar sesión" si corrupta**
- [x] **Botón "Reintentar" en AccountPage error**
- [x] **Nunca queda en loading sin salida**

---

## 🧪 TESTING (POST-DEPLOY)

### Chrome Normal (con sesión vieja/corrupta):

1. [ ] Ir a /account/login
2. [ ] Debe mostrar "Verificando sesión..." por máximo 5s
3. [ ] Si timeout → muestra error + botón "Limpiar sesión"
4. [ ] Click "Limpiar sesión" → limpia localStorage
5. [ ] Formulario de login visible y funcional

### Chrome Incógnito (sin sesión):

1. [ ] Ir a /account/login
2. [ ] "Verificando sesión..." por <1s
3. [ ] Formulario de login aparece
4. [ ] Click "Continuar con Google" → funciona
5. [ ] Login exitoso → /account dashboard

### AccountPage con timeout:

1. [ ] Si /account tarda >5s cargando
2. [ ] Muestra mensaje de error (no "Cargando..." infinito)
3. [ ] Botones "Reintentar" y "Cerrar sesión" disponibles
4. [ ] Click "Reintentar" → reload
5. [ ] Click "Cerrar sesión" → vuelve a /login

---

## 🚫 NO AFECTADO

- ✅ Checkout (no modificado)
- ✅ Admin (iron-session, separado)
- ✅ Orders (no modificado)
- ✅ Apartados (no modificado)
- ✅ Tracking (no modificado)
- ✅ Catálogo (solo usa singleton supabase)

---

## 📝 CAUSA RAÍZ

**No era múltiples GoTrueClient** (eso se arregló en 189f75a).

**La causa real:**
1. Session corrupta/vieja en localStorage de Chrome normal
2. `getUser()` intentaba resolver esa sesión
3. Supabase client se quedaba esperando respuesta (posible refresh loop)
4. Sin timeout → espera infinita
5. Loading infinito

**Por qué funcionaba en incógnito:**
- No hay localStorage → no hay sesión vieja
- `getUser()` resuelve rápido con `null`
- Muestra formulario inmediatamente

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- 🔴 Chrome normal: "Cargando..." infinito
- 🟢 Incógnito: funciona

**DESPUÉS:**
- ✅ Chrome normal: máximo 5s → error + botón limpiar sesión
- ✅ Incógnito: funciona igual
- ✅ Nunca loading infinito
- ✅ Siempre hay salida (error + acción)

---

## 🔄 ROLLBACK PLAN

Si el fix causa problemas:

```bash
git revert HEAD
git push origin main
```

El código anterior (189f75a) seguirá funcionando en incógnito, solo falla en Chrome normal con sesión vieja.

---

## 📊 COMMITS

```
189f75a - fix: eliminate multiple GoTrueClient instances, use callback API route
<este-commit> - fix: add timeout protection to prevent infinite loading in auth flows
```
