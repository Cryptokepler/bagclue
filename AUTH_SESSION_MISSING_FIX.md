# AuthSessionMissingError Fix
**Fecha:** 2026-05-01  
**Bug:** AuthSessionMissingError loggeado como error + mensaje "Error procesando autenticación"

---

## 🐛 PROBLEMA

**Observado:**
1. Console muestra: `AuthSessionMissingError: Auth session missing`
2. A veces UI muestra: "Error procesando autenticación"

**Causa:**
El código trataba `AuthSessionMissingError` como un error fatal cuando es **estado esperado** para usuarios no logueados.

---

## ✅ FIX IMPLEMENTADO

### Concepto clave:

**AuthSessionMissingError NO es un error** → es el estado esperado cuando:
- Usuario va a `/account/login` sin estar logueado
- Usuario va a `/account` sin estar logueado
- Session expiró o fue eliminada

### Cambios en LoginForm:

**ANTES:**
```typescript
if (error) {
  console.error('Auth check error:', error) // ❌ Loggea todo
  setInitialLoading(false)
  return
}
```

**DESPUÉS:**
```typescript
if (error) {
  // AuthSessionMissingError is EXPECTED when user is not logged in
  const isSessionMissing = error.name === 'AuthSessionMissingError' || 
                           error.message?.includes('session_missing') ||
                           error.message?.includes('Auth session missing')
  
  if (!isSessionMissing) {
    // Real error (not just missing session) - log it
    console.error('Auth check error:', error)
  }
  
  // Show login form regardless
  setInitialLoading(false)
  return
}
```

**Resultado:**
- ✅ AuthSessionMissingError → NO loggea, muestra form
- ✅ Otro error real → loggea + muestra form

---

### Cambios en AccountPage:

**ANTES:**
```typescript
if (authError) {
  console.error('Auth error:', authError) // ❌ Loggea todo
  router.push('/account/login?error=session_expired')
  return
}
```

**DESPUÉS:**
```typescript
if (authError) {
  // AuthSessionMissingError is EXPECTED
  const isSessionMissing = authError.name === 'AuthSessionMissingError' || 
                           authError.message?.includes('session_missing') ||
                           authError.message?.includes('Auth session missing')
  
  if (isSessionMissing) {
    // Not logged in - redirect to login without error param
    router.push('/account/login')
  } else {
    // Real error - log it and redirect with error param
    console.error('Auth error:', authError)
    router.push('/account/login?error=session_expired')
  }
  return
}
```

**Resultado:**
- ✅ AuthSessionMissingError → redirect limpio a `/account/login` (sin error param)
- ✅ Otro error real → loggea + redirect a `/account/login?error=session_expired`

---

### Cambios en catch blocks:

**Aplicado en ambos archivos:**
```typescript
catch (error: any) {
  // Check if it's just missing session (expected state)
  const isSessionMissing = error.name === 'AuthSessionMissingError' || 
                           error.message?.includes('session_missing') ||
                           error.message?.includes('Auth session missing')
  
  if (isSessionMissing) {
    // Not logged in - just redirect or show form
    // NO loggear, NO mostrar error
    return
  }
  
  // Real error - log it
  console.error('Error:', error)
  // ... handle real error
}
```

---

## 📋 COMPORTAMIENTO ESPERADO

### /account/login sin sesión:

1. Usuario va a `/account/login`
2. `getUser()` devuelve `AuthSessionMissingError`
3. **NO loggea en console**
4. **NO muestra mensaje de error**
5. Muestra formulario de login normalmente

---

### /account sin sesión:

1. Usuario va a `/account`
2. `getUser()` devuelve `AuthSessionMissingError`
3. **NO loggea en console**
4. Redirige a `/account/login` (sin parámetro de error)
5. Formulario aparece sin mensaje de error

---

### Errores REALES (sí se muestran):

**Estos SÍ se loggean y muestran:**
- Timeout (>5s esperando respuesta)
- Network error
- OAuth callback failure
- Session corrupta (no missing, sino corrupta)
- Database error al cargar profile

**Query params de error (de callback):**
- `?error=oauth_failed` → "Autenticación con Google falló"
- `?error=oauth_exchange_failed` → "Error procesando autenticación"
- `?error=session_expired` → "Tu sesión expiró. Inicia sesión de nuevo."

---

## 🧪 TESTING

### Test 1: /account/login sin sesión (expected case)
- [ ] Ir a `/account/login`
- [ ] Console: NO debe mostrar AuthSessionMissingError
- [ ] UI: Formulario visible, sin mensaje de error
- [ ] Login funciona normalmente

### Test 2: /account sin sesión
- [ ] Ir a `/account`
- [ ] Console: NO debe mostrar AuthSessionMissingError
- [ ] Redirige a `/account/login`
- [ ] URL NO tiene `?error=...`
- [ ] Formulario visible, sin mensaje de error

### Test 3: Error real en OAuth
- [ ] Ir a `/account/login?error=oauth_failed`
- [ ] UI: Muestra "Autenticación con Google falló"
- [ ] Console: puede mostrar error (es esperado)

### Test 4: Timeout real
- [ ] Simular timeout (>5s sin respuesta)
- [ ] UI: Muestra "Sesión corrupta" + botón limpiar
- [ ] Console: Loggea timeout error
- [ ] Click "Limpiar sesión" → limpia y muestra form

---

## 🚫 NO AFECTADO

- ✅ Checkout (no modificado)
- ✅ Admin (iron-session, separado)
- ✅ Orders (no modificado)
- ✅ Tracking (no modificado)
- ✅ Apartados (no modificado)

---

## 📝 ARCHIVOS MODIFICADOS

1. `src/components/customer/LoginForm.tsx`
   - Filtro de AuthSessionMissingError en `if (error)` y `catch`
   
2. `src/app/account/page.tsx`
   - Filtro de AuthSessionMissingError en `if (authError)` y `catch`
   - Redirect sin error param si es session missing

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- 🔴 Console: `AuthSessionMissingError: Auth session missing`
- 🟡 A veces UI: "Error procesando autenticación"

**DESPUÉS:**
- ✅ Console: limpio (no loggea AuthSessionMissingError)
- ✅ UI: formulario sin mensaje de error
- ✅ Solo loggea errores REALES
- ✅ Solo muestra mensajes para errores REALES

---

## 🔄 ROLLBACK

Si causa problemas:

```bash
git revert HEAD
git push origin main
npx vercel --prod
```

Pero no debería - el fix solo elimina logging innecesario de estado esperado.
