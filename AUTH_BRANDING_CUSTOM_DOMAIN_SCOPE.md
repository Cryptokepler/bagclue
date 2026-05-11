# AUTH BRANDING P1 — Custom Auth Domain + Google OAuth Branding

**Priority:** P1 (Medium-High)  
**Status:** Scoped — NOT IMPLEMENTED  
**Created:** 2026-05-11  

---

## PROBLEMA DETECTADO

Cuando un usuario inicia sesión con Google OAuth en Bagclue, Google muestra:

```
orhjnwpbzxyqtyrayvoi.supabase.co
```

Esto es **técnicamente correcto** (usamos Supabase Auth), pero **visualmente no es ideal** para branding de Bagclue.

El usuario percibe:
- Dominio técnico extraño
- No se ve profesional
- No refleja marca Bagclue

---

## OBJETIVO

**Que el flujo de Google OAuth se vea alineado con Bagclue y no muestre el dominio técnico de Supabase.**

**Resultado esperado:**
- Usuario ve: `auth.bagclue.com` o similar
- Branding consistente en OAuth consent screen
- Logo de Bagclue
- Nombre "Bagclue" visible

---

## INVESTIGACIÓN REQUERIDA

### 1. Supabase Custom Domain para Auth

**Preguntas:**

- ¿Es posible configurar un custom domain para Supabase Auth?
- ¿Requiere usar `auth.bagclue.com` o subdomain específico?
- ¿Qué plan de Supabase lo permite? (Free, Pro, Team, Enterprise)
- ¿Qué configuración DNS es necesaria?
  - CNAME record?
  - A record?
  - SSL certificate automático o manual?
- ¿Impacto en `NEXT_PUBLIC_SUPABASE_URL`?
  - ¿Sigue siendo `https://orhjnwpbzxyqtyrayvoi.supabase.co`?
  - ¿O cambia a `https://api.bagclue.com` o similar?
- ¿Impacto en OAuth callback URLs?
  - Actual: `https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback`
  - Futuro: `https://auth.bagclue.com/auth/v1/callback`?

**Recursos:**
- Docs: https://supabase.com/docs/guides/platform/custom-domains
- Support: Verificar si plan actual (Pro?) incluye custom domains

---

### 2. Google Cloud OAuth Branding

**Preguntas:**

- ¿Cómo configurar app name en Google Cloud Console?
- ¿Dónde subir logo de Bagclue?
- ¿Qué authorized domains agregar?
  - `bagclue.com`
  - `bagclue.vercel.app`
  - `auth.bagclue.com` (si usamos custom domain)
- ¿OAuth consent screen requiere cambios?
  - Publishing status: Testing vs Production
  - User type: External vs Internal
  - Scopes configurados actualmente
- ¿Requiere Google Brand Verification?
  - Proceso
  - Tiempo estimado
  - Requisitos (dominio verificado, sitio web, etc.)

**Recursos:**
- Google Cloud Console: https://console.cloud.google.com
- OAuth consent screen: APIs & Services → OAuth consent screen
- Brand verification: https://support.google.com/cloud/answer/9110914

---

### 3. URLs Actuales

**Auth URLs en Supabase:**

```
NEXT_PUBLIC_SUPABASE_URL=https://orhjnwpbzxyqtyrayvoi.supabase.co
```

**Site URL configurada en Supabase Auth:**
```
https://bagclue.vercel.app
```

**Redirect URLs configuradas:**
```
https://bagclue.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback (desarrollo)
```

**Google OAuth callback actual:**
```
https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback
```

Este callback es manejado por Supabase, luego redirige a:
```
https://bagclue.vercel.app/api/auth/callback?code=...
```

---

### 4. URLs Futuras Posibles

**Opción A: Custom Auth Domain (Recomendado)**

```
Supabase Auth: https://auth.bagclue.com
API Base URL:  https://api.bagclue.com (opcional)
Site URL:      https://bagclue.vercel.app (sin cambio)
```

**Google OAuth callback futuro:**
```
https://auth.bagclue.com/auth/v1/callback
```

**Configuración DNS necesaria:**
```
auth.bagclue.com  →  CNAME  →  orhjnwpbzxyqtyrayvoi.supabase.co
api.bagclue.com   →  CNAME  →  orhjnwpbzxyqtyrayvoi.supabase.co (opcional)
```

**Opción B: Solo Google OAuth Branding (Sin Custom Domain)**

- Mantener Supabase URL técnica
- Solo cambiar app name y logo en Google Cloud Console
- Más simple, menos impacto
- Pero sigue mostrando dominio técnico

---

### 5. Riesgos Identificados

#### 🔴 Riesgo Alto

1. **Romper login con Google**
   - Si cambias callback URL sin actualizar Google Cloud Console
   - Si custom domain no propaga correctamente
   - Usuarios no podrán iniciar sesión

2. **Romper magic link**
   - Si cambias NEXT_PUBLIC_SUPABASE_URL
   - Magic links enviados usan la URL de Supabase
   - Links antiguos dejarían de funcionar

3. **Romper callback `/api/auth/callback`**
   - Si redirect URL cambia sin actualizar código
   - Usuarios quedan en loop de login

4. **Afectar usuarios existentes**
   - Sessions activas pueden invalidarse
   - Tokens pueden no ser reconocidos con nuevo dominio

#### 🟡 Riesgo Medio

5. **Requerir plan pago en Supabase**
   - Custom domains pueden requerir plan Pro o superior
   - Costo adicional mensual

6. **Downtime durante migración**
   - DNS propagation tarda 1-48 horas
   - Durante transición, algunos usuarios pueden tener problemas

#### 🟢 Riesgo Bajo

7. **Google Brand Verification delay**
   - Proceso puede tardar días/semanas
   - No bloquea funcionalidad, solo branding

---

### 6. Plan Recomendado

#### FASE 0 — PREPARACIÓN (1-2 días)

**No tocar producción aún.**

1. **Auditoría completa:**
   - Revisar configuración actual Supabase Auth
   - Revisar configuración actual Google Cloud Console
   - Listar todos los authorized domains
   - Listar todas las redirect URLs
   - Documentar valores actuales (backup)

2. **Investigación técnica:**
   - Verificar plan actual de Supabase (Free/Pro/Team)
   - Confirmar si custom domain está disponible
   - Leer docs completa de Supabase Custom Domains
   - Verificar DNS actual de bagclue.com (proveedor, acceso)

3. **Crear scope detallado:**
   - Lista de cambios necesarios
   - Orden de ejecución
   - Rollback plan
   - Testing checklist

#### FASE 1 — GOOGLE OAUTH BRANDING (Bajo riesgo, 1 día)

**Sin tocar Supabase, solo Google Cloud Console.**

1. **Google Cloud Console:**
   - Cambiar app name a "Bagclue"
   - Subir logo de Bagclue (120x120px, square)
   - Actualizar OAuth consent screen
   - Agregar authorized domains: `bagclue.com`, `bagclue.vercel.app`

2. **Testing:**
   - Iniciar sesión con Google OAuth
   - Verificar que se muestra "Bagclue" y logo
   - Confirmar que login funciona correctamente

**Resultado:** Branding mejorado sin cambiar URLs.

#### FASE 2 — STAGING CUSTOM DOMAIN (Medio riesgo, 2-3 días)

**Si existe staging/preview environment, probar ahí primero.**

1. **Crear proyecto Supabase staging:**
   - Clonar configuración de producción
   - Configurar custom domain: `auth-staging.bagclue.com`
   - Configurar DNS (CNAME)

2. **Actualizar Next.js staging:**
   - Cambiar `NEXT_PUBLIC_SUPABASE_URL` a custom domain
   - Desplegar a Vercel preview

3. **Testing completo:**
   - Google OAuth login
   - Magic link login
   - Session persistence
   - Logout
   - Password reset (si aplica)

4. **Validación:**
   - Login funciona ✅
   - Magic link funciona ✅
   - No hay errores en console ✅
   - Redirect correcto ✅

**Si falla:** Rollback staging, investigar, reintentar.

#### FASE 3 — PRODUCTION CUSTOM DOMAIN (Alto riesgo, 1 día)

**Solo después de FASE 1 y FASE 2 exitosas.**

**Pre-requisitos:**
- Backup completo de configuración Supabase
- Backup de environment variables Vercel
- Plan de rollback documentado
- Ventana de mantenimiento (evitar horas pico)

**Ejecución:**

1. **Configurar DNS:**
   - Agregar CNAME: `auth.bagclue.com` → `orhjnwpbzxyqtyrayvoi.supabase.co`
   - Esperar propagación (verificar con `dig auth.bagclue.com`)

2. **Supabase Dashboard:**
   - Configurar custom domain en Project Settings
   - Verificar SSL certificate (automático)
   - Actualizar Site URL si es necesario

3. **Google Cloud Console:**
   - Actualizar Authorized redirect URIs:
     - Agregar: `https://auth.bagclue.com/auth/v1/callback`
     - Mantener: `https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback` (por 48h como fallback)

4. **Next.js Production:**
   - **NO cambiar `NEXT_PUBLIC_SUPABASE_URL` todavía**
   - Supabase permite usar custom domain sin cambiar URL en cliente
   - Solo cambiar si Supabase lo requiere explícitamente

5. **Deploy incremental:**
   - Desplegar cambios
   - Monitorear errores en Vercel logs
   - Verificar Sentry/error tracking

6. **Testing post-deploy:**
   - Login con Google OAuth (nuevo usuario)
   - Login con Google OAuth (usuario existente)
   - Magic link (nuevo email)
   - Logout
   - Session persistence

7. **Monitoreo 48 horas:**
   - Verificar que no hay errores de auth
   - Confirmar que usuarios pueden iniciar sesión
   - Revisar feedback de usuarios

8. **Cleanup (después de 48h):**
   - Remover callback antigua de Google Cloud Console
   - Confirmar que todo funciona solo con custom domain

#### FASE 4 — ROLLBACK (Si falla)

**Si algo sale mal en FASE 3:**

1. **Revertir DNS:**
   - Quitar CNAME de `auth.bagclue.com`
   - Esperar propagación

2. **Revertir Google Cloud Console:**
   - Remover redirect URI nueva
   - Confirmar que antigua sigue activa

3. **Revertir Supabase:**
   - Remover custom domain de settings
   - Confirmar que URL técnica funciona

4. **Desplegar rollback Next.js:**
   - Revertir environment variables si se cambiaron
   - Revertir código si se modificó

5. **Validar:**
   - Login funciona de nuevo
   - Magic link funciona
   - Usuarios pueden acceder

---

## RECURSOS NECESARIOS

### Técnicos

- [ ] Acceso a Supabase Dashboard (Project Settings)
- [ ] Acceso a Google Cloud Console (OAuth 2.0 Client IDs)
- [ ] Acceso a DNS de bagclue.com (Vercel DNS, Hostinger, otro?)
- [ ] Acceso a Vercel Project Settings (Environment Variables)
- [ ] Logo de Bagclue en formato PNG/JPG (120x120px mínimo)

### Tiempo

- FASE 1 (Google Branding): 1 día
- FASE 2 (Staging): 2-3 días
- FASE 3 (Production): 1 día + 48h monitoreo
- **Total estimado:** 5-7 días

### Presupuesto

- Custom domain en Supabase: Verificar si requiere upgrade de plan
- Google Brand Verification: Gratis (solo tiempo)
- DNS configuration: Gratis (ya tenemos dominio)

---

## DECISIÓN PENDIENTE

**Opción recomendada:** Empezar con FASE 1 (Google OAuth Branding solo)

**Razones:**
- Bajo riesgo
- Mejora inmediata de branding
- No requiere custom domain
- No afecta producción
- Rápido de implementar (1 día)

**FASE 2 y 3 (Custom Domain):** Evaluar después según:
- Costo de plan Supabase
- Disponibilidad de staging environment
- Necesidad real (¿cuánto impacta el dominio técnico?)

---

## SIGUIENTE PASO

1. **Decidir:** ¿Solo FASE 1 (branding) o full custom domain?
2. **Si FASE 1:** Implementar Google OAuth Branding ahora
3. **Si custom domain:** Crear staging environment primero
4. **No tocar producción** hasta validar en staging

---

**Documento vivo — actualizar conforme se investiga y ejecuta.**
