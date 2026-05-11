# WELCOME EMAIL GOOGLE OAUTH DIAGNOSTIC

**Fecha:** 2026-05-11  
**Usuario probado:** densestore@gmail.com  
**Método auth:** Google OAuth  
**Resultado:** FAIL — Welcome email NO llegó

---

## 1. PERFIL DE USUARIO — CONFIRMADO NUEVO

**Query ejecutada:**
```sql
SELECT id, user_id, email, name, created_at, updated_at
FROM customer_profiles
WHERE email = 'densestore@gmail.com'
```

**Resultado:**
```
ID:         55360b37-1d84-455e-bbc2-13811365dad4
User ID:    e5b40df8-6289-4b0f-aaa5-b37caba30e87
Email:      densestore@gmail.com
Name:       (null)
Created:    2026-05-11T11:41:44.15699+00:00
Updated:    2026-05-11T11:41:44.15699+00:00
Minutes since creation: 4.8
Is new (<5 min): YES ✅
```

**Conclusión:** Usuario SÍ es nuevo. El trigger DB `on_auth_user_created` funcionó correctamente.

---

## 2. FLUJO OAUTH — CONFIRMADO PASA POR CALLBACK

**Archivo:** `src/app/api/auth/callback/route.ts`

**Flujo Google OAuth:**
```typescript
export async function GET(req: NextRequest) {
  const code = searchParams.get('code')
  
  if (code) {
    // ✅ OAuth flow (Google) SÍ pasa por aquí
    const { error: exchangeError } = await supabaseCustomer.auth.exchangeCodeForSession(code)
    
    // ✅ Llama checkAndSendWelcomeEmail()
    checkAndSendWelcomeEmail().catch(err => {
      console.error('[Welcome Email] Failed in OAuth flow:', err.message)
    })
    
    return NextResponse.redirect(new URL(next, req.url))
  }
}
```

**Conclusión:** Google OAuth SÍ pasa por esta route y SÍ llama `checkAndSendWelcomeEmail()`.

---

## 3. LOGS VERCEL — NO DISPONIBLES VIA API

Intentos de obtener logs runtime:
- `vercel logs`: No output
- Vercel API `/v2/deployments/.../events`: Solo build logs
- Vercel API `/v2/projects/.../logs`: No output

**No se pudieron revisar logs runtime directamente.**

Sin embargo, podemos inferir el comportamiento del código:

---

## 4. CAUSA RAÍZ IDENTIFICADA — SUPABASE CLIENT INCORRECTO

### Problema en `checkAndSendWelcomeEmail()`

**Código actual:**
```typescript
async function checkAndSendWelcomeEmail() {
  try {
    // ❌ PROBLEMA: Usa supabaseCustomer en contexto servidor
    const { data: { user } } = await supabaseCustomer.auth.getUser()
    if (!user) {
      console.log('[Welcome Email] No user found, skipping')
      return
    }
    
    // ... resto del código
  }
}
```

### ¿Por qué falla?

**Configuración de `supabaseCustomer`:**
```typescript
// src/lib/supabase-customer.ts
export const supabaseCustomer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ❌ Usa localStorage (solo browser)
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',        // ❌ Flujo browser-based (hash)
  },
})
```

**Conflicto:**
1. `supabaseCustomer` está configurado para **browser** (`flowType: 'implicit'`, `persistSession: true`)
2. En el **servidor** (route handler GET), `supabaseCustomer.auth.getUser()` NO puede leer la sesión recién creada
3. Las cookies/sesión NO están disponibles en el contexto de la request actual
4. `getUser()` retorna `{ user: null }`
5. El código hace `return` early: `"[Welcome Email] No user found, skipping"`
6. **NO se envía email**

### ¿Por qué Magic Link funciona?

**Magic Link NO funcionaría tampoco** por la misma razón. El código tiene el mismo problema en ambos flujos (OAuth y Magic Link).

---

## 5. ESCENARIO REAL — OPCIÓN C

**De las opciones propuestas:**

❌ **A) Usuario no era nuevo:** NO aplica — usuario SÍ es nuevo (4.8 min)

❌ **B) OAuth no pasa por callback:** NO aplica — OAuth SÍ pasa por esta route

✅ **C) Usuario era nuevo, callback pasó, pero NO pudo obtener user:**  
**SÍ APLICA** — `supabaseCustomer.auth.getUser()` falla en servidor porque el cliente está configurado para browser (implicit flow + localStorage)

❌ **D) Email intentó enviarse y falló SMTP:** NO aplica — nunca llegó a intentar enviar porque `getUser()` retornó null

❌ **E) created_at check falló:** NO aplica — nunca llegó a ejecutar el check porque user era null

---

## 6. FIX MÍNIMO PROPUESTO

### Opción 1: Usar el user retornado por `exchangeCodeForSession()` (RECOMENDADO)

**Cambio en `src/app/api/auth/callback/route.ts`:**

```typescript
// OAuth Flow (Google, etc.)
if (code) {
  // ✅ Capturar user del exchange
  const { data, error: exchangeError } = await supabaseCustomer.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(new URL('/account/login?error=oauth_exchange_failed', req.url))
  }

  // ✅ Pasar user directamente a checkAndSendWelcomeEmail
  if (data?.user) {
    checkAndSendWelcomeEmail(data.user).catch(err => {
      console.error('[Welcome Email] Failed in OAuth flow:', err.message)
    })
  }

  return NextResponse.redirect(new URL(next, req.url))
}
```

**Modificar `checkAndSendWelcomeEmail()` para aceptar user como parámetro:**

```typescript
async function checkAndSendWelcomeEmail(user: User) {
  try {
    // ✅ Ya no usa supabaseCustomer.auth.getUser()
    console.log(`[Welcome Email] Checking for user ${user.id}`)

    // Query customer_profiles con service role
    const { data: profile, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('created_at, name')
      .eq('user_id', user.id)
      .single()

    // ... resto igual
  }
}
```

**También aplicar a Magic Link flow:**

```typescript
// Magic Link Flow
if (token_hash && type === 'magiclink') {
  // ✅ Capturar user del verify
  const { data, error: verifyError } = await supabaseCustomer.auth.verifyOtp({
    token_hash,
    type: 'magiclink',
  })

  if (verifyError) {
    console.error('Magic link verification error:', verifyError)
    return NextResponse.redirect(new URL('/account/login?error=verification_failed', req.url))
  }

  // ✅ Pasar user directamente
  if (data?.user) {
    checkAndSendWelcomeEmail(data.user).catch(err => {
      console.error('[Welcome Email] Failed in magic link flow:', err.message)
    })
  }

  return NextResponse.redirect(new URL('/account', req.url))
}
```

---

## 7. RIESGOS DEL FIX

### Riesgo Bajo:
- Cambio pequeño y quirúrgico
- NO toca DB schema
- NO toca SMTP config
- NO toca otros emails (pagos, shipping, etc.)
- Solo afecta welcome email en callback

### Validación requerida:
- `exchangeCodeForSession()` y `verifyOtp()` SÍ retornan user en data
- TypeScript types permitirán pasar User a la función

---

## 8. TESTING REQUERIDO POST-FIX

### TEST 1 (repetir): Google OAuth nuevo usuario
- Crear nuevo email temporal
- Login con Google OAuth
- Validar welcome email llega

### TEST 2: Magic Link nuevo usuario
- Crear nuevo email temporal
- Solicitar magic link
- Validar welcome email llega

### TEST 3: Usuario existente (ambos métodos)
- Login con cuenta ya registrada
- Validar NO llega welcome email (>5 min)

### TEST 4: Validar logs Vercel
- Confirmar log: `[Welcome Email] New user detected (created X.Xmin ago)`
- Confirmar log: `[Welcome Email] Send attempt` (o success/failed)
- Confirmar NO hay secrets en logs

---

## 9. ALTERNATIVA — SERVER-SIDE SUPABASE CLIENT

Si la Opción 1 no funciona (aunque debería), crear un cliente Supabase server-side con cookies:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseServer = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  }
)

// Luego en checkAndSendWelcomeEmail:
const { data: { user } } = await supabaseServer.auth.getUser()
```

**Esta alternativa es más compleja y requiere Next.js App Router SSR.**

---

## 10. RESUMEN EJECUTIVO

| Aspecto | Estado |
|---------|--------|
| Usuario es nuevo | ✅ SÍ (4.8 min) |
| OAuth pasa por callback | ✅ SÍ |
| checkAndSendWelcomeEmail se ejecuta | ✅ SÍ |
| getUser() funciona en servidor | ❌ NO |
| Welcome email se envía | ❌ NO |

**Causa:** `supabaseCustomer.auth.getUser()` falla en servidor porque el cliente está configurado para browser (implicit flow + localStorage).

**Fix:** Usar el `user` retornado directamente por `exchangeCodeForSession()` y `verifyOtp()` en vez de llamar `getUser()`.

**Impacto:** Quirúrgico, bajo riesgo, NO toca DB.

**Siguiente paso:** Implementar fix y re-ejecutar TEST 1 (Google OAuth) + TEST 2 (Magic Link).

---

**Diagnóstico completo — Esperando aprobación para implementar fix.**
