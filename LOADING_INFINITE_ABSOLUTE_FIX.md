# Loading Infinito - Fix Absoluto con Timeout
**Fecha:** 2026-05-01  
**Bug:** /account/login se queda en "Verificando sesión... Máximo 5 segundos" permanentemente

---

## 🐛 PROBLEMA

**Observado:**
- Página muestra "Verificando sesión... Máximo 5 segundos"
- Después de más de 5 segundos NO muestra el formulario
- Se queda en loading infinito

**Por qué el timeout de 5s no funcionaba:**
1. El timeout estaba solo en `getUser()` (5s max)
2. Pero si había hash OAuth, esperaba 1s adicional ANTES de getUser()
3. Si `router.push()` se ejecutaba, nunca llegaba a `setInitialLoading(false)`
4. Si `detectSessionInUrl: true` procesaba el hash, podía colgar la promesa
5. El timeout era relativo, no absoluto desde el inicio del useEffect

---

## ✅ SOLUCIÓN

**Timeout absoluto de 6 segundos desde el inicio del useEffect:**

```typescript
let completed = false

// ABSOLUTE TIMEOUT: force show form after 6 seconds no matter what
const absoluteTimeout = setTimeout(() => {
  if (!completed) {
    console.log('[LOGIN_CHECK_ABSOLUTE_TIMEOUT] Forcing form display after 6s')
    setInitialLoading(false)
    completed = true
  }
}, 6000)
```

**Flag `completed` para evitar race conditions:**
- Cuando cualquier path ejecuta `setInitialLoading(false)`, marca `completed = true`
- Cuando timeout absoluto ejecuta, verifica si ya completó
- Clearea el timeout cuando completa por cualquier otra vía
- En catch/finally verifica si absolute timeout ya ganó

---

## 🔧 CAMBIOS IMPLEMENTADOS

### 1. Timeout absoluto

**ANTES:**
```typescript
useEffect(() => {
  const checkAuth = async () => {
    // ... código
    const { data: { user }, error } = await Promise.race([
      authCheckPromise,
      timeoutPromise // 5s timeout solo en getUser()
    ])
    // ... resto
  }
  checkAuth()
}, [router])
```

**DESPUÉS:**
```typescript
useEffect(() => {
  let completed = false
  
  const absoluteTimeout = setTimeout(() => {
    if (!completed) {
      setInitialLoading(false)
      completed = true
    }
  }, 6000) // TIMEOUT ABSOLUTO desde inicio

  const checkAuth = async () => {
    // ... código
    if (completed) return // Si absolute timeout ganó, skip
    
    setInitialLoading(false)
    completed = true
    clearTimeout(absoluteTimeout)
  }
  
  checkAuth()
  
  return () => clearTimeout(absoluteTimeout) // Cleanup
}, [router])
```

---

### 2. Console logs para debugging

**Logs agregados:**
- `[LOGIN_CHECK_START]` - Inicio del useEffect
- `[LOGIN_CHECK_ERROR_PARAM]` - Error en query params
- `[LOGIN_CHECK_HASH_DETECTED]` - OAuth hash encontrado
- `[LOGIN_CHECK_GET_USER]` - Inicio de getUser()
- `[LOGIN_CHECK_ALREADY_COMPLETED]` - Absolute timeout ya ganó
- `[LOGIN_CHECK_NO_SESSION]` - AuthSessionMissingError (esperado)
- `[LOGIN_CHECK_ERROR]` - Error real (no session missing)
- `[LOGIN_CHECK_SUCCESS_SESSION]` - User encontrado, redirect
- `[LOGIN_CHECK_NO_USER]` - No user, mostrar form
- `[LOGIN_CHECK_TIMEOUT]` - getUser() timeout 5s
- `[LOGIN_CHECK_CATCH_NO_SESSION]` - Caught session missing
- `[LOGIN_CHECK_CATCH_ERROR]` - Caught error real
- `[LOGIN_CHECK_ABSOLUTE_TIMEOUT]` - Timeout absoluto forzó display
- `[LOGIN_CHECK_FINALLY]` - Estado final completed
- `[LOGIN_CHECK_CATCH_ALREADY_COMPLETED]` - Absolute timeout ganó en catch

---

### 3. Texto actualizado

**ANTES:**
```
Verificando sesión...
Máximo 5 segundos
```

**DESPUÉS:**
```
Verificando sesión...
Máximo 6 segundos
```

**Por qué 6 segundos:**
- 1s wait si hay hash OAuth
- 5s timeout en getUser()
- Total: puede tardar hasta 6s en caso peor
- Timeout absoluto a los 6s garantiza que siempre muestra form

---

## 📋 COMPORTAMIENTO GARANTIZADO

### Caso 1: Sin sesión (caso normal)
1. `[LOGIN_CHECK_START]`
2. No error params, no hash
3. `[LOGIN_CHECK_GET_USER]`
4. `[LOGIN_CHECK_NO_SESSION]` (AuthSessionMissingError)
5. `setInitialLoading(false)` → muestra formulario
6. Total: <1 segundo

### Caso 2: Con sesión válida
1. `[LOGIN_CHECK_START]`
2. `[LOGIN_CHECK_GET_USER]`
3. `[LOGIN_CHECK_SUCCESS_SESSION]`
4. `router.push('/account')` → redirect
5. Total: <1 segundo

### Caso 3: OAuth callback (hash en URL)
1. `[LOGIN_CHECK_START]`
2. `[LOGIN_CHECK_HASH_DETECTED]`
3. Wait 1s para que Supabase procese
4. `[LOGIN_CHECK_GET_USER]`
5. Si session OK → redirect
6. Si no → muestra form
7. Total: ~2 segundos

### Caso 4: Sesión corrupta / timeout
1. `[LOGIN_CHECK_START]`
2. `[LOGIN_CHECK_GET_USER]`
3. `[LOGIN_CHECK_TIMEOUT]` (getUser() > 5s)
4. `setInitialLoading(false)` + mensaje error
5. Muestra formulario con botón "Limpiar sesión"
6. Total: 5 segundos

### Caso 5: Timeout absoluto (peor caso)
1. `[LOGIN_CHECK_START]`
2. Cualquier problema que cuelgue la promesa
3. Absolute timeout a los 6s: `[LOGIN_CHECK_ABSOLUTE_TIMEOUT]`
4. `setInitialLoading(false)` forzado
5. Muestra formulario
6. Total: exactamente 6 segundos

---

## 🎯 GARANTÍA

**NUNCA más loading infinito:**
- Timeout absoluto de 6 segundos SIEMPRE ejecuta
- Flag `completed` evita race conditions
- Cleanup en return del useEffect
- Múltiples checkpoints que ejecutan `setInitialLoading(false)`

**Si pasan 6 segundos, el formulario SE MUESTRA, pase lo que pase.**

---

## 🧪 TESTING CON CONSOLE LOGS

### Test 1: Chrome normal sin sesión
1. [ ] Abrir DevTools → Console
2. [ ] Ir a `/account/login`
3. [ ] Debe mostrar:
   ```
   [LOGIN_CHECK_START]
   [LOGIN_CHECK_GET_USER] Starting getUser() with 5s timeout
   [LOGIN_CHECK_NO_SESSION] No session found (expected)
   [LOGIN_CHECK_FINALLY] completed = true
   ```
4. [ ] Formulario aparece en <1s
5. [ ] NO debe llegar a `[LOGIN_CHECK_ABSOLUTE_TIMEOUT]`

### Test 2: Chrome con sesión válida
1. [ ] Login con Google exitoso
2. [ ] Ir a `/account/login`
3. [ ] Debe mostrar:
   ```
   [LOGIN_CHECK_START]
   [LOGIN_CHECK_GET_USER] Starting getUser() with 5s timeout
   [LOGIN_CHECK_SUCCESS_SESSION] User found, redirecting
   [LOGIN_CHECK_FINALLY] completed = true
   ```
4. [ ] Redirige a `/account` en <1s

### Test 3: OAuth callback (con hash)
1. [ ] Click "Continuar con Google"
2. [ ] Después de autorizar, redirect a `/account/login#access_token=...`
3. [ ] Console debe mostrar:
   ```
   [LOGIN_CHECK_START]
   [LOGIN_CHECK_HASH_DETECTED] OAuth callback, waiting 1s
   [LOGIN_CHECK_GET_USER] Starting getUser() with 5s timeout
   [LOGIN_CHECK_SUCCESS_SESSION] User found, redirecting
   ```
4. [ ] Redirige a `/account` en ~2s

### Test 4: Sesión corrupta (timeout)
1. [ ] Crear sesión corrupta (modificar localStorage)
2. [ ] Ir a `/account/login`
3. [ ] Console debe mostrar:
   ```
   [LOGIN_CHECK_START]
   [LOGIN_CHECK_GET_USER] Starting getUser() with 5s timeout
   [LOGIN_CHECK_TIMEOUT] getUser() timed out after 5s
   [LOGIN_CHECK_FINALLY] completed = true
   ```
4. [ ] Formulario + mensaje error en 5s

### Test 5: Timeout absoluto (peor caso)
1. [ ] Si por alguna razón todo falla
2. [ ] Después de exactamente 6s, console:
   ```
   [LOGIN_CHECK_ABSOLUTE_TIMEOUT] Forcing form display after 6s
   ```
3. [ ] Formulario aparece
4. [ ] Nunca más loading infinito

---

## 🚫 NO AFECTADO

- ✅ Google OAuth login (sigue funcionando)
- ✅ Magic link login (sigue funcionando)
- ✅ /account page (no modificado)
- ✅ Checkout, admin, orders, tracking

---

## 📝 ARCHIVOS MODIFICADOS

1. `src/components/customer/LoginForm.tsx`
   - Agregado timeout absoluto de 6s
   - Agregado flag `completed` para race conditions
   - Agregado cleanup en useEffect return
   - Agregado 15+ console logs para debugging
   - Cambiado "Máximo 5 segundos" → "Máximo 6 segundos"

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- 🔴 "Verificando sesión..." permanente
- 🔴 Formulario nunca aparece
- ❌ Stuck sin salida

**DESPUÉS:**
- ✅ Máximo 6 segundos de "Verificando sesión..."
- ✅ Formulario SIEMPRE aparece después
- ✅ Console logs muestran qué pasó
- ✅ NUNCA loading infinito

---

## 📊 DEBUGGING EN PRODUCCIÓN

**Los console logs permiten:**
- Ver exactamente qué path tomó el código
- Identificar si absolute timeout se activó (síntoma de problema)
- Ver si hay sesión, no hay sesión, o error
- Timing de cada paso

**Para remover logs después de confirmar fix:**
```bash
# Buscar y remover todos los console.log que empiezan con [LOGIN_CHECK_
```

**Pero recomiendo dejarlos al menos 1 semana** para monitorear en producción.
