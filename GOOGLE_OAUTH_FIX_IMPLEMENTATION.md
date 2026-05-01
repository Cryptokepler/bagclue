# Google OAuth Fix - Implementación
**Fecha:** 2026-05-01  
**Bug:** Chrome stuck in "Cargando..." / Multiple GoTrueClient instances

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. Singleton Supabase Client

**Archivo:** `src/lib/supabase.ts`

**Antes:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Creaba segunda instancia de GoTrueClient
```

**Después:**
```typescript
export const supabase = supabaseCustomer
// Re-exporta el singleton, elimina instancia duplicada
```

**Impacto:**
- ✅ Elimina "Multiple GoTrueClient instances" warning
- ✅ Catálogo ahora usa el mismo cliente que auth
- ✅ Un solo localStorage auth key

---

### 2. Callback API Route Flow

**Archivo:** `src/components/customer/LoginForm.tsx`

**Antes:**
```typescript
redirectTo: `${window.location.origin}/account/login`
// Redirigía de vuelta a login → loop infinito
```

**Después:**
```typescript
redirectTo: `${window.location.origin}/api/auth/callback?next=/account`
// Usa API route para exchange code → /account
```

**Impacto:**
- ✅ OAuth callback procesa code server-side
- ✅ No depende de detectSessionInUrl
- ✅ Redirect limpio a /account

---

### 3. Timeout Fallback

**Archivo:** `src/components/customer/LoginForm.tsx`

**Agregado:**
```typescript
setTimeout(() => {
  setGoogleLoading(false)
  setMessage({
    type: 'error',
    text: 'La redirección falló. Intenta de nuevo.',
  })
}, 10000)
```

**Impacto:**
- ✅ Si redirect a Google falla → muestra error después de 10s
- ✅ Loading nunca se queda infinito

---

### 4. Error Handling en Login

**Archivo:** `src/components/customer/LoginForm.tsx`

**Agregado:**
```typescript
// Detecta error params de callback
const params = new URLSearchParams(window.location.search)
if (params.get('error')) {
  const errorType = params.get('error')
  let errorMsg = 'Error en inicio de sesión'
  
  if (errorType === 'oauth_failed') errorMsg = 'Autenticación con Google falló'
  if (errorType === 'oauth_exchange_failed') errorMsg = 'Error procesando autenticación'
  
  setMessage({ type: 'error', text: errorMsg })
  return
}
```

**Impacto:**
- ✅ Muestra errores de OAuth al usuario
- ✅ No se queda en loading si callback falló

---

### 5. Callback con `next` Parameter

**Archivo:** `src/app/api/auth/callback/route.ts`

**Agregado:**
```typescript
const next = searchParams.get('next') || '/account'
// ...
return NextResponse.redirect(new URL(next, req.url))
```

**Impacto:**
- ✅ Permite redirigir a diferentes destinos post-login
- ✅ Flexible para future flows

---

### 6. Supabase Client Config

**Archivo:** `src/lib/supabase-customer.ts`

**Antes:**
```typescript
detectSessionInUrl: true
```

**Después:**
```typescript
detectSessionInUrl: false, // Disabled - we use /api/auth/callback
flowType: 'pkce', // More secure OAuth flow
```

**Impacto:**
- ✅ No intenta procesar hash en client
- ✅ Evita race conditions
- ✅ Usa PKCE flow (más seguro)

---

## 🔧 CONFIGURACIÓN REQUERIDA EN SUPABASE

### ⚠️ ACCIÓN MANUAL NECESARIA

**Ir a:** https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/auth/url-configuration

**Agregar a Redirect URLs:**
```
https://bagclue.vercel.app/api/auth/callback
```

**Resultado final debe quedar:**
```
https://bagclue.vercel.app/account
https://bagclue.vercel.app/account/login
https://bagclue.vercel.app/api/auth/callback  ← NUEVO
```

**Click "Save"**

**Sin este paso, el OAuth fallará con error "redirect_uri not allowed"**

---

## 📋 TESTING CHECKLIST

### Pre-Deploy
- [x] Código compilado sin errores
- [x] No hay imports duplicados de Supabase
- [x] LoginForm tiene timeout fallback
- [x] Callback maneja errores correctamente

### Post-Deploy (MANUAL)
- [ ] Agregar `/api/auth/callback` a Supabase Redirect URLs ⚠️ CRÍTICO
- [ ] Test en Chrome incognito:
  - [ ] Click "Continuar con Google"
  - [ ] Seleccionar cuenta
  - [ ] Debe redirigir a /account (no a /login)
  - [ ] NO debe mostrar "Cargando..." infinito
  - [ ] NO debe mostrar "Multiple GoTrueClient" en console
- [ ] Test en Safari:
  - [ ] Mismo flow que Chrome
  - [ ] Debe funcionar igual
- [ ] Verificar customer_profile creado en Supabase
- [ ] Test de logout y re-login

### Edge Cases
- [ ] Test con error (denegar permisos en Google)
  - Debe mostrar error en /login
  - No debe quedar en loading
- [ ] Test con cuenta sin email público
  - Debe manejar error correctamente
- [ ] Test de timeout (bloquear redirect a Google)
  - Debe mostrar error después de 10s

---

## 🚫 NO AFECTADO

- ✅ Admin auth (usa iron-session)
- ✅ Checkout flow
- ✅ Orders
- ✅ Apartados
- ✅ Magic link login (sigue funcionando)
- ✅ Productos
- ✅ Catálogo (solo cambió import)

---

## 🐛 ROLLBACK PLAN

Si algo falla después del deploy:

1. **Revertir Supabase Redirect URLs:**
   - Remover `/api/auth/callback`
   - Dejar solo `/account` y `/account/login`

2. **Revertir código:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Esperar auto-deploy de Vercel**

---

## 📝 COMMITS

```
87d65a7 - fix: simplify OAuth flow to avoid race conditions
<este-commit> - fix: eliminate multiple GoTrueClient instances, use callback API route
```

---

## 🎯 RESULTADO ESPERADO

**Antes:**
- 🔴 Chrome: "Cargando..." infinito
- 🟡 Safari: funciona a veces
- ⚠️ Console: "Multiple GoTrueClient instances"

**Después:**
- ✅ Chrome: login funciona correctamente
- ✅ Safari: login funciona correctamente
- ✅ Console: sin warnings
- ✅ Loading nunca infinito
- ✅ Errores se muestran al usuario
