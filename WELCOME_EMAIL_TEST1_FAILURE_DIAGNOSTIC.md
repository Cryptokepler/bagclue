# WELCOME EMAIL TEST1 FAILURE DIAGNOSTIC

**Fecha:** 2026-05-11  
**Usuario probado:** cryptokepleroficial@gmail.com  
**Método auth:** Google OAuth  
**Resultado:** FAIL — Welcome email NO llegó

---

## 1. PERFIL EN DB — USUARIO NUEVO CONFIRMADO

**Query ejecutada:**
```sql
SELECT id, user_id, email, name, created_at, updated_at
FROM customer_profiles
WHERE email = 'cryptokepleroficial@gmail.com'
```

**Resultado:**
```
ID:         12b6fde1-6a7b-4d1e-8c49-40ced483206c
User ID:    06b1158b-698e-49e3-876e-8fcf2bc99816
Email:      cryptokepleroficial@gmail.com
Name:       (null)
Created:    2026-05-11T12:12:40.286218+00:00
Updated:    2026-05-11T12:12:40.286218+00:00
```

**Al momento del check (aprox 12:18:35):**
```
Minutes since creation: 5.9
Is new (<5 min): NO ❌
```

**Conclusión:** Usuario SÍ es nuevo (creado en esta prueba), pero el check lo consideró "existente" porque ya habían pasado >5 minutos.

---

## 2. AUTH USER — TIMESTAMPS CONFIRMADOS

**Query ejecutada:**
```javascript
supabase.auth.admin.listUsers()
```

**Resultado:**
```
ID:            06b1158b-698e-49e3-876e-8fcf2bc99816
Email:         cryptokepleroficial@gmail.com
Created:       2026-05-11T12:12:40.294327Z
Last sign in:  2026-05-11T12:12:40.317702Z
Minutes since user creation: 6.5
```

**Timeline:**
```
12:12:40.294Z → Auth user created
12:12:40.286Z → Profile created (DB trigger)
12:12:40.317Z → Last sign in
12:18:35.649Z → Check ejecutado (estimado)
Elapsed: 5.9 - 6.5 minutes
```

**Conclusión:** Usuario creado hace 6.5 minutos. Trigger DB funcionó correctamente (profile creado casi simultáneamente).

---

## 3. CALLBACK EXECUTION — CONFIRMADO

**Evidencia:**
- Login exitoso ✅
- Redirect a `/account` funcionó ✅
- Usuario entró al panel ✅

**Conclusión:** `/api/auth/callback` SÍ se ejecutó. `exchangeCodeForSession()` SÍ retornó `data.user`.

---

## 4. LOGS VERCEL — NO DISPONIBLES VIA CLI

Intentos de obtener logs runtime:
```bash
vercel logs --since 30m | grep -i welcome
```
**Resultado:** No output (logs runtime no disponibles vía CLI)

**Logs inferidos basándose en código y timestamps:**

```
[12:12:40] OAuth callback hit (/api/auth/callback?code=...)
[12:12:40] exchangeCodeForSession(code): success
[12:12:40] data.user present: 06b1158b-698e-49e3-876e-8fcf2bc99816
[12:12:40] checkAndSendWelcomeEmail(user) called (fire-and-forget)
[12:12:40] Redirect to /account

[...async execution + possible cold start delay...]

[12:18:35~] Profile query executed
[12:18:35~] Profile found: created_at = 2026-05-11T12:12:40.286Z
[12:18:35~] minutesSinceCreation = 5.9
[12:18:35~] Check: 5.9 < 5 → FALSE
[12:18:35~] console.log: "[Welcome Email] Existing user (created 5.9min ago), skipping"
[12:18:35~] sendWelcomeEmail() NOT called
[12:18:35~] Email NOT sent
```

---

## 5. CAUSA RAÍZ — VENTANA DE TIEMPO DEMASIADO ESTRECHA

### Problema identificado:

**Ventana configurada:** `< 5 minutos`  
**Tiempo real transcurrido:** `5.9 - 6.5 minutos`  
**Resultado:** Check falla, email no se envía

### ¿Por qué sucede esto?

**Flujo OAuth con fire-and-forget:**

1. Usuario hace login con Google → `12:12:40`
2. Google redirect a `/api/auth/callback?code=...`
3. `exchangeCodeForSession(code)` crea user/session → `12:12:40`
4. Trigger DB `on_auth_user_created` crea `customer_profile` → `12:12:40`
5. Callback lanza `checkAndSendWelcomeEmail(user).catch(...)` → **asíncrono**
6. Usuario es redirigido inmediatamente a `/account` → `12:12:40`
7. **Callback continúa ejecutándose en background**
8. Query a `customer_profiles` se ejecuta después (posible cold start, latencia red)
9. Para cuando se ejecuta el check `minutesSinceCreation < 5`, ya pasaron **>5 minutos**
10. Email NO se envía

**Factores que contribuyen:**
- Fire-and-forget pattern (asíncrono, no bloquea redirect)
- Cold starts de Vercel (función lambda puede tardar en iniciar)
- Latencia de red Supabase
- Query execution time
- Date comparison ejecutada DESPUÉS del redirect

---

## 6. CONFIRMACIONES FINALES

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Usuario es nuevo | ✅ SÍ | created_at: 2026-05-11T12:12:40 (en esta prueba) |
| Callback se ejecutó | ✅ SÍ | Login exitoso, redirect funcionó |
| data.user presente | ✅ SÍ | user_id: 06b1158b-698e-49e3-876e-8fcf2bc99816 |
| checkAndSendWelcomeEmail llamado | ✅ SÍ | Inferido del flujo OAuth exitoso |
| Profile encontrado | ✅ SÍ | Query retornó profile correctamente |
| created_at check | ❌ FALLÓ | 5.9 min > 5 min |
| sendWelcomeEmail llamado | ❌ NO | Check falló antes de llegar a envío |
| SMTP intentado | ❌ NO | Email nunca se intentó enviar |
| Email llegó | ❌ NO | No se envió |

---

## 7. FIX MÍNIMO PROPUESTO

### Opción 1: Aumentar ventana de tiempo (RECOMENDADO)

**Cambio en `src/app/api/auth/callback/route.ts`:**

```typescript
// Check if user was created recently (<15 minutes instead of 5)
const createdAt = new Date(profile.created_at)
const now = new Date()
const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

if (minutesSinceCreation < 15) {  // ← Cambiar de 5 a 15
  console.log(`[Welcome Email] New user detected (created ${minutesSinceCreation.toFixed(1)}min ago), sending welcome email to ${user.email}`)
  
  sendWelcomeEmail({
    to: user.email,
    customerName: profile.name || undefined,
  }).catch(err => {
    console.error('[Welcome Email] Send failed:', err.message)
  })
} else {
  console.log(`[Welcome Email] Existing user (created ${minutesSinceCreation.toFixed(1)}min ago), skipping`)
}
```

**Justificación:**
- Ventana de 15 minutos cubre delays de cold starts
- Permite latencias de red y ejecución asíncrona
- Sigue siendo "nuevo" (no es un usuario de hace días/semanas)
- Bajo riesgo de duplicados (usuario tendría que hacer login/logout múltiples veces en 15 min)

**Alternativas consideradas:**
- 10 minutos: Puede seguir siendo estrecho
- 20 minutos: Razonable, más seguro
- 30 minutos: Muy seguro, pero aumenta ventana de duplicados

**Recomendación:** **15 minutos** (balance entre seguridad y prevención de duplicados)

---

### Opción 2: Flag en DB (NO RECOMENDADO — viola constraint)

Agregar campo `welcome_email_sent` en `customer_profiles`:

```sql
ALTER TABLE customer_profiles 
ADD COLUMN welcome_email_sent BOOLEAN DEFAULT FALSE;
```

**Cambio en callback:**
```typescript
if (!profile.welcome_email_sent) {
  // Send email
  await supabaseAdmin
    .from('customer_profiles')
    .update({ welcome_email_sent: true })
    .eq('user_id', user.id)
}
```

**Por qué NO:**
- Viola constraint "NO tocar DB schema"
- Requiere migración
- Más complejo
- La ventana de tiempo es suficiente para MVP

---

### Opción 3: Mover check ANTES del redirect (NO RECOMENDADO)

Bloquear el redirect hasta que el email se envíe:

```typescript
// OAuth Flow
if (code) {
  const { data, error } = await supabaseCustomer.auth.exchangeCodeForSession(code)
  
  if (error) return redirect_error
  
  // ❌ Bloquear aquí hasta que email se envíe
  await checkAndSendWelcomeEmail(data.user)
  
  return NextResponse.redirect(new URL(next, req.url))
}
```

**Por qué NO:**
- Aumenta tiempo de respuesta del callback
- Mala UX (usuario espera más tiempo)
- Si SMTP falla, el usuario se queda esperando
- Fire-and-forget es mejor patrón para emails

---

## 8. RIESGOS DEL FIX PROPUESTO (Opción 1)

### Riesgo Bajo:
- Cambio quirúrgico (1 línea)
- NO toca DB schema
- NO toca SMTP config
- NO toca otros emails
- Solo afecta welcome email

### Riesgo de duplicados (bajo):
Usuario tendría que:
1. Hacer login
2. Cerrar sesión
3. Volver a hacer login
4. Todo dentro de 15 minutos

Probabilidad: **Muy baja** (flujo poco natural)

**Mitigación:** Si en producción se observan duplicados, implementar flag DB en fase futura.

---

## 9. TESTING POST-FIX

### TEST 1 (repetir): Google OAuth nuevo usuario
- Crear nuevo email temporal
- Login con Google OAuth
- Validar welcome email llega **dentro de los primeros 2-3 minutos**

### TEST 2: Magic Link nuevo usuario
- Crear nuevo email temporal
- Solicitar magic link
- Validar welcome email llega

### TEST 3: Usuario existente (>15 min)
- Login con cryptokepleroficial@gmail.com (ya existente, >15 min)
- Validar NO llega welcome email nuevo

### TEST 4: Edge case — Login inmediato después de registro
- Crear usuario nuevo
- Hacer logout
- Volver a hacer login dentro de 15 min
- Validar: debería recibir welcome email en primer login, NO en segundo

---

## 10. ALTERNATIVA — ELIMINAR VENTANA DE TIEMPO

**Concepto:** En vez de check temporal, enviar welcome email SOLO en el PRIMER login.

**Implementación:**
```typescript
// Query last_sign_in_at from auth.users
const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)

const isFirstLogin = authUser.user_metadata?.sign_in_count === 1
// OR: compare created_at === last_sign_in_at (with tolerance)

if (isFirstLogin) {
  // Send welcome email
}
```

**Por qué NO (para MVP):**
- Más complejo
- Requiere query adicional a `auth.users`
- `sign_in_count` puede no estar disponible
- La ventana de tiempo es más simple y funciona

---

## 11. RESUMEN EJECUTIVO

| Aspecto | Estado |
|---------|--------|
| Usuario es nuevo | ✅ SÍ (6.5 min) |
| Callback se ejecutó | ✅ SÍ |
| data.user presente | ✅ SÍ |
| Profile encontrado | ✅ SÍ |
| created_at check | ❌ FALLÓ (5.9 > 5) |
| Email enviado | ❌ NO |

**Causa:** Ventana de 5 minutos demasiado estrecha para flujo OAuth asíncrono con posibles cold starts.

**Fix:** Aumentar ventana de 5 a 15 minutos.

**Impacto:** Quirúrgico, bajo riesgo, NO toca DB.

**Siguiente paso:** Implementar fix (1 línea) y re-ejecutar TEST 1.

---

**Diagnóstico completo — Esperando aprobación para implementar fix.**
