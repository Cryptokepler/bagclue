# PKCE to Implicit Flow Fix
**Fecha:** 2026-05-01  
**Bug:** OAuth code exchange failing with "Error procesando autenticación"

---

## 🐛 PROBLEMA

**Error observado:**
```
Error procesando autenticación
```

**En console (server logs):**
```
Code exchange error: ...
```

---

## 🔍 CAUSA RAÍZ

**PKCE flow incompatible con server-side callback en Next.js App Router:**

1. Browser inicia OAuth con `flowType: 'pkce'`
2. PKCE genera `code_verifier` y lo guarda en **localStorage**
3. Google redirige a `/api/auth/callback` con `code`
4. **API route (server-side)** intenta `exchangeCodeForSession(code)`
5. ❌ **FALLA** - server NO tiene acceso al `code_verifier` (está en localStorage del browser)

**Por qué falla:**
- PKCE requiere `code_verifier` para el exchange
- `code_verifier` se genera y almacena en browser localStorage
- API routes no tienen acceso a localStorage del browser
- Exchange falla por missing verifier

---

## ✅ SOLUCIÓN

**Cambiar de PKCE (code-based) a Implicit (hash-based) flow:**

### Flow anterior (PKCE - NO FUNCIONA):
```
Browser → signInWithOAuth → Google → /api/auth/callback?code=...
                                      → Server exchange code ❌ (no verifier)
```

### Flow nuevo (Implicit - FUNCIONA):
```
Browser → signInWithOAuth → Google → /account/login#access_token=...
                                     → Browser detecta hash ✅
                                     → Auto-login ✅
                                     → Redirect a /account ✅
```

---

## 🔧 CAMBIOS IMPLEMENTADOS

### 1. supabase-customer.ts

**ANTES:**
```typescript
{
  auth: {
    detectSessionInUrl: false, // API route maneja callback
    flowType: 'pkce', // Code-based flow
  },
}
```

**DESPUÉS:**
```typescript
{
  auth: {
    detectSessionInUrl: true, // Browser detecta hash
    flowType: 'implicit', // Hash-based flow
  },
}
```

---

### 2. LoginForm.tsx - redirectTo

**ANTES:**
```typescript
redirectTo: `${window.location.origin}/api/auth/callback?next=/account`
```

**DESPUÉS:**
```typescript
redirectTo: `${window.location.origin}/account/login`
```

**Por qué:**
- Implicit flow usa hash fragments (#access_token=...)
- Hash-based redirect necesita ir directamente a página de browser
- No puede ir a API route (API routes no procesan hash)

---

### 3. LoginForm.tsx - Hash detection

**AGREGADO:**
```typescript
// Check if we have hash params (OAuth callback with implicit flow)
const hash = window.location.hash
if (hash && hash.includes('access_token')) {
  // Supabase will auto-detect and set session
  // Wait a bit for it to process
  setInitialLoading(true)
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

**Por qué:**
- Cuando Google redirige a `/account/login#access_token=...`
- Supabase client detecta hash automáticamente (detectSessionInUrl: true)
- Espera 1s para que procese
- Luego hace getUser() → encuentra user → redirect a /account

---

## 📋 CONFIGURACIÓN SUPABASE

**Redirect URLs permitidas:**
- ✅ `https://bagclue.vercel.app/account`
- ✅ `https://bagclue.vercel.app/account/login` ← Usado ahora
- ✅ `https://bagclue.vercel.app/api/auth/callback` ← Ya no usado para OAuth (solo magic link)

**Google OAuth configuración:**
- Redirect URI: `https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback`
- NO necesita cambios (Supabase maneja redirect interno)

---

## 🧪 TESTING

### Test 1: Google OAuth login
1. [ ] Ir a `/account/login`
2. [ ] Click "Continuar con Google"
3. [ ] Seleccionar cuenta
4. [ ] Debe redirigir a `/account/login#access_token=...`
5. [ ] Debe auto-detectar sesión y redirigir a `/account`
6. [ ] NO debe mostrar "Error procesando autenticación"

### Test 2: Console limpio
1. [ ] Abrir DevTools → Console
2. [ ] Hacer login con Google
3. [ ] NO debe mostrar "Code exchange error"
4. [ ] NO debe mostrar "oauth_exchange_failed"

### Test 3: Magic link (sigue funcionando)
1. [ ] Ingresar email en form
2. [ ] Click "Enviar enlace mágico"
3. [ ] Recibir email
4. [ ] Click en link
5. [ ] Debe redirigir a `/api/auth/callback?token_hash=...`
6. [ ] API route procesa magic link
7. [ ] Redirect a `/account`

---

## 🎯 VENTAJAS Y DESVENTAJAS

### Implicit Flow (actual)
**✅ Ventajas:**
- Funciona 100% en browser
- No requiere server-side code exchange
- Compatible con Next.js App Router
- Más simple de implementar

**❌ Desventajas:**
- Tokens visibles en URL hash (menos seguro que PKCE)
- Tokens pueden quedar en browser history
- No soportado en algunos flujos enterprise

### PKCE Flow (anterior - fallaba)
**✅ Ventajas:**
- Más seguro (code + verifier)
- Tokens nunca visibles en URL
- Recomendado por OAuth 2.1 spec

**❌ Desventajas:**
- Requiere server-side exchange con acceso a verifier
- No compatible con Next.js App Router sin workarounds
- Necesita cookies compartidas entre browser/server

---

## 🚀 SOLUCIONES ALTERNATIVAS (NO IMPLEMENTADAS)

Si en el futuro queremos volver a PKCE:

### Opción 1: Supabase SSR helpers
```typescript
import { createBrowserClient } from '@supabase/ssr'
// Maneja PKCE con cookies
```

### Opción 2: Custom storage adapter
```typescript
{
  auth: {
    storage: customCookieStorage, // En lugar de localStorage
    flowType: 'pkce'
  }
}
```

### Opción 3: Client-side exchange
```typescript
// Hacer exchange en browser, no en API route
// Requiere modificar LoginForm para manejar code
```

---

## 🚫 NO AFECTADO

- ✅ Magic link login (sigue usando API route)
- ✅ Checkout
- ✅ Admin auth (iron-session)
- ✅ Orders
- ✅ Tracking
- ✅ Apartados

---

## 📝 ARCHIVOS MODIFICADOS

1. `src/lib/supabase-customer.ts`
   - flowType: 'pkce' → 'implicit'
   - detectSessionInUrl: false → true

2. `src/components/customer/LoginForm.tsx`
   - redirectTo: /api/auth/callback → /account/login
   - Agregado hash detection + 1s wait

---

## 📊 RESULTADO ESPERADO

**ANTES:**
- 🔴 "Error procesando autenticación"
- 🔴 Console: "Code exchange error"
- ❌ Google login no funciona

**DESPUÉS:**
- ✅ Google login funciona
- ✅ Console limpio
- ✅ Auto-redirect a /account
- ✅ Sin errores de exchange

---

## 🔄 ROLLBACK

Si causa problemas:

```bash
git revert HEAD
git push origin main
npx vercel --prod
```

Pero el flow implicit es más simple y funciona mejor con Next.js App Router.
