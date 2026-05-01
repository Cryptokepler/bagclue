# Google OAuth Bug - Diagnóstico Completo
**Fecha:** 2026-05-01  
**Reporte:** Chrome se queda en "Cargando..." / Safari funciona mejor / "Multiple GoTrueClient instances"

---

## 🔍 DIAGNÓSTICO

### 1. Clientes Supabase en Frontend (PROBLEMA CRÍTICO)

**Se encontraron 2 clientes creados en browser:**

#### Cliente #1: `supabase` (src/lib/supabase.ts)
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
// ❌ Sin config de auth
// ❌ Usado en componentes 'use client':
//    - src/app/catalogo/page.tsx
//    - src/app/catalogo/[id]/page.tsx
```

#### Cliente #2: `supabaseCustomer` (src/lib/supabase-customer.ts)
```typescript
export const supabaseCustomer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
// ✅ Con config de auth
// ✅ Usado en:
//    - LoginForm
//    - AccountPage
//    - API routes de customer
```

**⚠️ PROBLEMA:**
- Ambos clientes usan la **misma storage key** por defecto: `sb-orhjnwpbzxyqtyrayvoi-auth-token`
- Cuando se cargan en la misma página → múltiples GoTrueClient instances
- Esto causa race conditions en auth state

---

### 2. Múltiples createClient() en Browser

**SÍ, se confirma:**
- 2 clientes diferentes importados en client components
- Ambos instancian GoTrueClient
- Ambos compiten por el mismo localStorage

---

### 3. Storage Key Conflict

**SÍ, conflicto confirmado:**
- `supabase` (catálogo) → usa default storage key
- `supabaseCustomer` (auth) → usa default storage key
- **NO hay separación de storage**

---

### 4. Botón "Continuar con Google" - Análisis

**Código actual en LoginForm:**
```typescript
const handleGoogleSignIn = async () => {
  setGoogleLoading(true)
  setMessage(null)

  try {
    const { error } = await supabaseCustomer.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account/login`, // ❌ PROBLEMA
      },
    })

    if (error) {
      console.error('Google sign in error:', error)
      setMessage({
        type: 'error',
        text: 'Error al iniciar sesión con Google',
      })
      setGoogleLoading(false) // ✅ Sí se quita loading en error
    }
    // ❌ Si NO hay error, googleLoading se queda TRUE para siempre
  } catch (error) {
    setGoogleLoading(false) // ✅ Se quita en catch
  }
}
```

**Problemas encontrados:**

1. ❌ **redirectTo INCORRECTO:**
   - Actual: `/account/login`
   - Correcto: `/api/auth/callback?next=/account`
   - Al redirigir a login → se queda en loop detectando sesión

2. ⚠️ **Loading infinito:**
   - Si signInWithOAuth tiene éxito → redirige a Google
   - Pero `googleLoading` se queda `true`
   - Al volver a login → LoginForm monta con `googleLoading=false` inicial
   - PERO el useEffect con timeout de 500ms intenta redirect
   - Si detectSessionInUrl falla → se queda cargando

3. ❌ **Dependencia de detectSessionInUrl:**
   - LoginForm depende de que Supabase auto-detecte tokens en hash
   - Pero con múltiples clientes → race condition
   - El cliente correcto puede no ganar la carrera

---

### 5. /api/auth/callback - Análisis

**Código revisado:**
```typescript
export async function GET(req: NextRequest) {
  const code = searchParams.get('code')
  
  if (code) {
    const { error } = await supabaseCustomer.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect('/account/login?error=oauth_exchange_failed')
    }
    return NextResponse.redirect('/account') // ✅ Redirige correcto
  }
  
  // ...magic link flow también OK
}
```

**Evaluación:**
- ✅ Recibe `code` correctamente
- ✅ `exchangeCodeForSession` funciona
- ✅ Redirige a `/account` si OK
- ✅ Maneja errores correctamente

**PERO:**
- ❌ **NO se está usando actualmente**
- El flow actual bypassa el callback porque `redirectTo` apunta a `/account/login`

---

### 6. Supabase Auth Config

**Verificado en Supabase Dashboard:**

**Site URL:**
```
https://bagclue.vercel.app
```

**Redirect URLs (actualizadas):**
```
https://bagclue.vercel.app/account
https://bagclue.vercel.app/account/login
```

**Google Provider:**
- ✅ Enabled
- ✅ Client ID configurado
- ✅ Client Secret configurado

**redirectTo permitido:**
- ✅ `/account/login` está en allow list
- ❌ `/api/auth/callback` NO está en allow list
  - **Esto bloqueará el fix si no se agrega**

---

## 🐛 CAUSA RAÍZ DEL BUG

### Chrome:
1. Usuario click "Continuar con Google"
2. `googleLoading = true`
3. `signInWithOAuth` redirige a Google (NO retorna error)
4. Google redirige a `/account/login#access_token=...`
5. LoginForm monta de nuevo
6. useEffect intenta auto-redirect con `setTimeout(500ms)`
7. **PERO** cliente `supabase` (de catálogo) también se carga
8. **Race condition:** ambos clientes intentan leer hash
9. Chrome puede cargar scripts en orden diferente → cliente incorrecto gana
10. Tokens NO se procesan → `getUser()` retorna null
11. No redirige a `/account`
12. Se queda en página de login sin error visible

### Safari:
- Motor de JS ligeramente diferente
- Puede que cliente correcto gane la carrera más frecuentemente
- Por eso "funciona mejor"

---

## ✅ FIX REQUERIDO

### Fix #1: Singleton Supabase Client

**Eliminar `src/lib/supabase.ts`**
- Reemplazar todas las importaciones con `supabaseCustomer`
- Usar un solo cliente en todo el frontend

### Fix #2: Usar Callback API Route

**Cambiar redirectTo en LoginForm:**
```typescript
redirectTo: `${window.location.origin}/api/auth/callback?next=/account`
```

### Fix #3: Agregar /api/auth/callback a Supabase Redirect URLs

**Supabase Dashboard → URL Configuration → Redirect URLs:**
```
https://bagclue.vercel.app/account
https://bagclue.vercel.app/account/login
https://bagclue.vercel.app/api/auth/callback  ← AGREGAR
```

### Fix #4: Eliminar Timeout en LoginForm

**Remover el useEffect que intenta auto-redirect con detectSessionInUrl**
- Confiar en el callback API route para manejar la sesión
- Solo verificar auth en mount si NO hay tokens en URL

### Fix #5: Timeout Fallback

**Agregar timeout a googleLoading:**
```typescript
// Si después de 10s no redirigió → algo falló
setTimeout(() => {
  if (googleLoading) {
    setGoogleLoading(false)
    setMessage({ type: 'error', text: 'Timeout - intenta de nuevo' })
  }
}, 10000)
```

### Fix #6: Limpiar LoginForm

**Simplificar lógica:**
- No intentar procesar hash manualmente
- Dejar que callback API haga el trabajo
- Solo mostrar formulario

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Eliminar `src/lib/supabase.ts`
- [ ] Reemplazar imports en catálogo con `supabaseCustomer`
- [ ] Cambiar `redirectTo` a `/api/auth/callback?next=/account`
- [ ] Agregar `/api/auth/callback` a Supabase Redirect URLs
- [ ] Remover useEffect de auto-redirect en LoginForm
- [ ] Agregar timeout fallback de 10s a googleLoading
- [ ] Test en Chrome incognito
- [ ] Test en Safari
- [ ] Verificar que NO aparece "Multiple GoTrueClient instances"
- [ ] Verificar que login funciona end-to-end
- [ ] Verificar que customer_profile se crea

---

## 🚫 NO TOCAR

- ✅ Checkout (no afectado)
- ✅ Admin auth (usa iron-session, separado)
- ✅ Orders (no afectado)
- ✅ Apartados (no afectado)
- ✅ Productos (no afectado)
- ✅ Stripe webhook (no afectado)
