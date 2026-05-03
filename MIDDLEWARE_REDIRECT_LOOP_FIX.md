# Middleware Redirect Loop Fix
**Fecha:** 2026-05-01  
**Bug:** /account/login encuentra sesión y dice "redirecting" pero se queda en loading infinito

---

## 🐛 PROBLEMA

**Observado en console:**
```
[LOGIN_CHECK_SUCCESS_SESSION] User found, redirecting to /account
[LOGIN_CHECK_FINALLY] completed = true
```

**Pero página NO redirige - se queda en "Verificando sesión..."**

---

## 🔍 CAUSA RAÍZ

**Redirect loop causado por middleware:**

1. Usuario hace login con Google (implicit flow)
2. Supabase guarda tokens en **localStorage** (NO en cookies)
3. LoginForm detecta sesión en localStorage → ejecuta `router.push('/account')`
4. Browser intenta navegar a `/account`
5. **Middleware** intercepta el request
6. Middleware busca token en **cookies**: `request.cookies.get('sb-access-token')`
7. ❌ **NO encuentra token** (porque está en localStorage, no en cookies)
8. Middleware redirige a `/account/login`
9. LoginForm detecta sesión de nuevo → `router.push('/account')`
10. **LOOP INFINITO**

---

## 📋 INCOMPATIBILIDAD

**Implicit flow vs Middleware:**

| Aspecto | Implicit Flow | Middleware |
|---------|---------------|------------|
| Almacenamiento | localStorage | cookies |
| Contexto | Client-side | Server-side |
| Acceso | Solo browser | Solo server |

**Implicit flow:**
- Tokens en localStorage
- Client-side auth check
- Works in browser only

**Middleware:**
- Busca cookies
- Server-side auth check
- NO tiene acceso a localStorage

**Resultado: Incompatibles** ❌

---

## ✅ SOLUCIÓN

**Deshabilitar middleware para rutas /account/***

**Dejar que client-side (React components) maneje la autenticación.**

### ANTES:
```typescript
export async function middleware(request: NextRequest) {
  // ...
  
  if (pathname.startsWith('/account')) {
    if (pathname === '/account/login') {
      return NextResponse.next()
    }

    // Busca tokens en cookies ❌
    const accessToken = request.cookies.get('sb-access-token')?.value
    
    if (!accessToken) {
      return NextResponse.redirect('/account/login') // Loop infinito
    }
  }
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
}
```

### DESPUÉS:
```typescript
export async function middleware(request: NextRequest) {
  // ... solo admin check
  
  // /account routes: let client-side handle auth
  if (pathname.startsWith('/account')) {
    return NextResponse.next() // ✅ No bloquea
  }
}

export const config = {
  matcher: ['/admin/:path*'] // ✅ Solo aplica a /admin
}
```

---

## 🛡️ SEGURIDAD

**¿Es seguro sin middleware?**

**SÍ - porque client-side components ya verifican auth:**

### AccountPage.tsx:
```typescript
useEffect(() => {
  const { data: { user }, error } = await supabaseCustomer.auth.getUser()
  
  if (!user) {
    router.push('/account/login') // Redirect si no hay sesión
    return
  }
  
  // Cargar profile...
}, [])
```

### LoginForm.tsx:
```typescript
useEffect(() => {
  const { data: { user } } = await supabaseCustomer.auth.getUser()
  
  if (user) {
    router.push('/account') // Redirect si ya hay sesión
  } else {
    setInitialLoading(false) // Mostrar form si no hay sesión
  }
}, [])
```

**Protección en múltiples capas:**
1. ✅ Client-side check en cada página
2. ✅ Supabase RLS en database
3. ✅ API routes verifican auth
4. ⚠️ Middleware NO necesario (causa más problemas que soluciones con implicit flow)

---

## 📊 COMPARACIÓN

### Con middleware (ANTES):
```
User → /account 
  → Middleware check cookies ❌ (no encuentra)
  → Redirect /account/login
  → Client check localStorage ✅ (encuentra sesión)
  → Redirect /account
  → LOOP INFINITO ❌
```

### Sin middleware (DESPUÉS):
```
User → /account 
  → Middleware: NextResponse.next() ✅
  → AccountPage mounts
  → Client check localStorage ✅
  → Si session OK → muestra dashboard ✅
  → Si no session → redirect /login ✅
```

---

## 🧪 TESTING

### Test 1: Login con Google
1. [ ] Ir a /account/login
2. [ ] Click "Continuar con Google"
3. [ ] Autorizar
4. [ ] Console debe mostrar:
   ```
   [LOGIN_CHECK_SUCCESS_SESSION] User found, redirecting
   ```
5. [ ] Debe redirigir a /account ✅
6. [ ] Dashboard debe aparecer ✅
7. [ ] NO más loading infinito ✅

### Test 2: /account sin sesión
1. [ ] Logout
2. [ ] Ir directamente a /account
3. [ ] AccountPage debe detectar no-session
4. [ ] Debe redirigir a /account/login ✅

### Test 3: /account con sesión válida
1. [ ] Login completo
2. [ ] Ir a /account
3. [ ] Dashboard debe aparecer ✅
4. [ ] NO debe redirigir a login ✅

---

## 🚫 NO AFECTADO

- ✅ Admin routes (middleware sigue protegiendo /admin/*)
- ✅ Checkout
- ✅ Orders
- ✅ Tracking
- ✅ Public pages

**Solo /account/* ahora sin middleware.**

---

## 📝 ARCHIVOS MODIFICADOS

1. `src/middleware.ts`
   - Removido bloque de verificación de /account
   - Actualizado matcher: `['/admin/:path*']` (removido `/account/:path*`)
   - Client-side components manejan auth

---

## 🔄 OPCIONES FUTURAS

**Si en el futuro queremos middleware para /account:**

### Opción 1: Cambiar a PKCE flow con SSR
```typescript
import { createServerClient } from '@supabase/ssr'
// Usa cookies compartidas entre client/server
```

### Opción 2: Custom cookie storage para implicit
```typescript
// Hacer que implicit flow también escriba en cookies
// Así middleware puede leerlas
```

### Opción 3: Mantener como está (RECOMENDADO)
- Client-side auth funciona bien
- Más simple
- Sin problemas de sync localStorage/cookies

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- 🔴 Console: "redirecting to /account"
- 🔴 UI: "Verificando sesión..." infinito
- ❌ Loop de redirects

**DESPUÉS:**
- ✅ Console: "redirecting to /account"
- ✅ UI: Redirige a /account dashboard
- ✅ Sin loops
- ✅ Login funciona end-to-end

---

## 🏁 CONCLUSIÓN

**El middleware NO es necesario para /account cuando usamos:**
- Implicit flow (localStorage)
- Client-side auth checks
- Supabase RLS

**Beneficios de removerlo:**
- Elimina incompatibilidad localStorage/cookies
- Elimina redirect loops
- Simplifica el código
- Auth sigue siendo segura (client + RLS + API routes)
