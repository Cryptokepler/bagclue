# WELCOME EMAIL — SCOPE & AUDIT
**Proyecto:** Bagclue  
**Fecha:** 2026-05-11  
**Status:** AUDIT COMPLETO — PENDIENTE APROBACIÓN

---

## OBJETIVO
Crear email de bienvenida para nuevos clientes de Bagclue que:
- Dé bienvenida personalizada
- Refuerce confianza en la marca
- Explique brevemente la experiencia Bagclue
- Incentive primera compra

---

## AUDITORÍA DE SIGNUP ACTUAL

### Flujos de Registro Identificados

#### FLUJO 1: Magic Link (Email)
1. Usuario ingresa email en `/account/login`
2. POST `/api/auth/magic-link` → llama `supabaseCustomer.auth.signInWithOtp()`
3. **Supabase envía email automáticamente** con magic link
4. Usuario hace click en magic link del email
5. Redirige a `/api/auth/callback?token_hash=...&type=magiclink`
6. Callback verifica OTP y crea sesión con `supabaseCustomer.auth.verifyOtp()`
7. Redirige a `/account`

**Archivos involucrados:**
- `src/components/customer/LoginForm.tsx` (UI)
- `src/app/api/auth/magic-link/route.ts` (endpoint)
- `src/app/api/auth/callback/route.ts` (callback)

#### FLUJO 2: Google OAuth
1. Usuario hace click en "Continuar con Google"
2. `supabaseCustomer.auth.signInWithOAuth({ provider: 'google' })`
3. Supabase maneja OAuth con Google
4. Redirige a `/api/auth/callback?code=...`
5. Callback intercambia code por session con `supabaseCustomer.auth.exchangeCodeForSession()`
6. Redirige a `/account`

**Archivos involucrados:**
- `src/components/customer/LoginForm.tsx` (UI)
- `src/app/api/auth/callback/route.ts` (callback)

### Trigger de Nuevo Usuario en Base de Datos

**Archivo:** `supabase/migrations/015_customer_accounts_phase1.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, email)
  VALUES (NEW.id, LOWER(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer_user();
```

**✅ PUNTO CLAVE:** Este trigger se ejecuta **solo cuando se crea un nuevo usuario** en `auth.users`, no en logins subsiguientes.

### Infraestructura de Email Existente

**Mailer:** `src/lib/email/mailer.ts`
- Usa `nodemailer` con SMTP Hostinger
- Remitente configurado: `Bagclue <hola@bagclue.com>`
- Ya implementado para: confirmaciones de pago, tracking, apartados, transferencias bancarias

**Templates existentes:**
- `bank-transfer-confirmed.ts`
- `bank-transfer-instructions.ts`
- `bank-transfer-proof-received.ts`
- `bank-transfer-rejected.ts`
- `layaway-confirmation.ts`
- `order-confirmation.ts`
- `shipping-tracking.ts`

**Estilo visual:**
- Colores: `#FFFBF8` (fondo beige), `#0B0B0B` (texto), `#E85A9A` (rosa Bagclue)
- Tipografía: Playfair Display (headers), sans-serif (body)
- Cards con `border-radius: 12px` y `box-shadow`
- CTAs con botones prominentes

### Email Automático de Supabase Auth

**CONFIRMADO:** Supabase Auth envía emails automáticamente para:
1. Magic link (OTP) — **SÍ se envía**
2. Confirmación de registro (si está habilitado) — **depende de config**
3. Recuperación de contraseña — **SÍ se envía**

**RIESGO DE DUPLICADO:**
- Si implementamos welcome email Y Supabase tiene confirmación de email habilitada, el usuario recibirá 2 emails en rápida sucesión

**SOLUCIÓN:**
- Verificar en Supabase dashboard si "Email confirmation" está habilitado
- Si está habilitado: usar branding de Supabase O deshabilitarlo para usar nuestro welcome email
- Si no está habilitado: proceder con welcome email custom

---

## PROPUESTA DE IMPLEMENTACIÓN

### OPCIÓN RECOMENDADA: Post-Callback Check

**Trigger:** Después de crear sesión en `/api/auth/callback`

**Lógica:**
1. Usuario completa signup (magic link O Google OAuth)
2. Callback crea sesión exitosamente
3. **ANTES de redirect a /account:** verificar si es nuevo usuario
4. Consultar `customer_profiles.created_at` del usuario
5. Si `created_at` es reciente (<5 minutos): enviar welcome email
6. Continuar con redirect normal

**Ventajas:**
- ✅ No requiere configuración externa (webhooks, extensions DB)
- ✅ Fácil de implementar y testear
- ✅ Fácil de rollback si falla
- ✅ No rompe auth flow existente
- ✅ Funciona para ambos flujos (magic link + OAuth)

**Desventajas:**
- ⚠️ Si callback falla antes del check, no se envía email (mitigable con retry logic)
- ⚠️ Requiere query adicional en callback (mínimo impacto de performance)

### ALTERNATIVAS EVALUADAS

#### OPCIÓN B: Trigger DB con pg_net (HTTP request)
- Modificar trigger `on_auth_user_created` para hacer POST a endpoint interno
- Endpoint envía welcome email
- **Descartada:** Requiere extensión pg_net, más complejo, menos control

#### OPCIÓN C: Supabase Auth Webhook
- Configurar webhook en Supabase dashboard para evento `user.created`
- Webhook llama a endpoint `/api/webhooks/user-created`
- **Descartada:** Requiere configuración manual en Supabase dashboard, menos flexible

#### OPCIÓN D: Customizar email de Supabase
- Usar email branding de Supabase dashboard
- **Descartada:** Menos control sobre contenido, timing y data disponible

---

## DISEÑO DEL WELCOME EMAIL

### Metadata
- **Remitente:** `Bagclue <hola@bagclue.com>`
- **Subject:** `Bienvenida a Bagclue ✨`
- **Template:** `src/lib/email/templates/welcome.ts`
- **Función mailer:** `sendWelcomeEmail()` en `mailer.ts`

### Contenido Propuesto

**Estructura:**
1. **Header:** Logo Bagclue
2. **Hero:** Saludo personalizado con nombre (si disponible)
3. **Mensaje de bienvenida:** Cálido, premium, femenino
4. **Value Props (iconos):**
   - ✓ Piezas verificadas por Entrupy
   - ✨ Curaduría selecta de lujo
   - 📦 Envíos seguros a todo México
   - 💎 Apartado disponible con pagos semanales
5. **CTA Principal:** Botón grande → "Explorar colección" → `/catalogo`
6. **CTA Secundario:** Enlace texto → "Hablar con Bagclue" → Instagram
7. **Footer:** Links útiles + copyright

**Tono:**
- Premium pero accesible
- Cálido y femenino
- Boutique/personal (no corporativo)
- Francés: usar "tu" en vez de "usted"

**Ejemplo de copy:**
```
¡Hola [Nombre]! 👋

Bienvenida a Bagclue — tu nueva boutique de piezas de lujo verificadas.

En Bagclue, cada pieza cuenta una historia. Seleccionamos bolsas, zapatos y joyería 
de las mejores casas de lujo, verificadas por Entrupy, para que compres con total confianza.

✓ Autenticidad certificada
✨ Curaduría selecta y exclusiva
📦 Envíos seguros con tracking
💎 Aparta tu pieza con pagos semanales

¿Lista para encontrar tu próxima pieza?

[BOTÓN: Explorar colección]

¿Necesitas ayuda o tienes dudas? Escríbenos por Instagram — respondemos rápido.

Con cariño,
El equipo Bagclue
```

---

## ARCHIVOS A CREAR/MODIFICAR

### 1. Template Email
**Archivo:** `src/lib/email/templates/welcome.ts`
```typescript
interface WelcomeEmailParams {
  customerName?: string;
  email: string;
}

export function generateWelcomeHTML(params: WelcomeEmailParams): string {
  // HTML con estilo consistente con templates existentes
}
```

### 2. Función Mailer
**Archivo:** `src/lib/email/mailer.ts`
```typescript
export async function sendWelcomeEmail(params: {
  to: string;
  customerName?: string;
}): Promise<boolean> {
  const { generateWelcomeHTML } = await import('./templates/welcome');
  
  const html = generateWelcomeHTML({
    customerName: params.customerName || 'Cliente',
    email: params.to,
  });

  return sendEmail({
    to: params.to,
    subject: 'Bienvenida a Bagclue ✨',
    html,
    text: `Bienvenida a Bagclue. Explora piezas de lujo verificadas.`,
  });
}
```

### 3. Lógica de Callback
**Archivo:** `src/app/api/auth/callback/route.ts`

**Modificación:**
```typescript
// Después de crear sesión exitosamente
// ANTES de redirect

const { data: { user } } = await supabaseCustomer.auth.getUser()
if (user) {
  // Check if new user (created <5 min ago)
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('created_at')
    .eq('user_id', user.id)
    .single()
  
  if (profile) {
    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60
    
    if (minutesSinceCreation < 5) {
      // New user - send welcome email
      // Don't await - fire and forget to avoid blocking redirect
      sendWelcomeEmail({
        to: user.email!,
        customerName: profile.name || undefined,
      }).catch(err => {
        console.error('[Welcome Email] Failed to send:', err)
        // Don't throw - email failure should not break auth
      })
    }
  }
}

// Continue with redirect
```

---

## RIESGOS Y MITIGACIONES

### RIESGO 1: Email Falla pero Auth Funciona
**Impacto:** Usuario no recibe welcome email  
**Probabilidad:** Baja (infraestructura SMTP ya probada)  
**Mitigación:**
- Email envío es fire-and-forget (no bloquea redirect)
- Error logueado pero no lanzado
- Usuario puede seguir usando plataforma normalmente

### RIESGO 2: Doble Email (Supabase + Custom)
**Impacto:** Usuario recibe email de Supabase Y welcome email  
**Probabilidad:** Media (depende de config Supabase)  
**Mitigación:**
- **PRE-IMPLEMENTACIÓN:** Verificar en Supabase dashboard si confirmación está habilitada
- Si está habilitada: decidir entre deshabilitar O usar solo branding de Supabase

### RIESGO 3: Performance del Callback
**Impacto:** Callback tarda más por query adicional  
**Probabilidad:** Baja  
**Mitigación:**
- Query es simple (WHERE user_id = X)
- Tabla `customer_profiles` tiene índice en user_id
- Impacto estimado: <50ms

### RIESGO 4: Race Condition (Trigger DB vs Callback)
**Impacto:** Callback consulta profile antes de que trigger lo cree  
**Probabilidad:** Muy baja  
**Mitigación:**
- Trigger DB es AFTER INSERT síncrono
- Para cuando llegamos al callback, profile ya existe
- Si no existe profile: skip welcome email sin error

---

## TESTING PLAN

### Pre-Implementación
1. ✅ Verificar en Supabase dashboard: ¿Email confirmation habilitado?
2. ✅ Confirmar SMTP env vars configuradas en Vercel
3. ✅ Testear template HTML en cliente de email (Gmail, Outlook, Apple Mail)

### Implementación
1. **Test 1: Nuevo usuario vía Magic Link**
   - Registrarse con email nuevo
   - Verificar: email welcome recibido
   - Verificar: subject correcto
   - Verificar: CTAs funcionan

2. **Test 2: Nuevo usuario vía Google OAuth**
   - Registrarse con Google (cuenta nueva)
   - Verificar: email welcome recibido
   - Verificar: nombre de Google usado en saludo

3. **Test 3: Usuario existente (no debe recibir email)**
   - Login con usuario existente
   - Verificar: NO recibe welcome email

4. **Test 4: SMTP falla (no debe romper auth)**
   - Desconectar SMTP temporalmente (env var inválido)
   - Registrarse como nuevo usuario
   - Verificar: auth completa exitosamente
   - Verificar: error logueado pero no lanzado
   - Verificar: usuario puede acceder a /account

5. **Test 5: Profile no existe (edge case)**
   - Simular caso donde profile no existe todavía
   - Verificar: callback no rompe, solo skip email

### Post-Deploy
1. Monitorear logs de welcome email por 48h
2. Verificar tasa de envío exitoso (target: >95%)
3. Revisar feedback de usuarios (inbox spam?)

---

## VARIABLES DE ENTORNO REQUERIDAS

**Ya configuradas (verificar en Vercel):**
```
SMTP_HOST=mail.bagclue.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=<password_actual>
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue
```

**Nota:** NO imprimir secrets/passwords en logs o reportes.

---

## SEGURIDAD

### Protecciones Implementadas
1. ✅ Email send es fire-and-forget (no bloquea auth)
2. ✅ Errores logueados pero no lanzados
3. ✅ No se imprimen secrets en logs
4. ✅ Validación de email format en magic-link endpoint
5. ✅ Rate limit implícito (solo 1 email por signup)

### Consideraciones Adicionales
- Email no contiene datos sensibles (solo nombre, email, links públicos)
- Links a /catalogo e Instagram son seguros (HTTPS)
- No hay tokens o credenciales en email

---

## ÁREAS NO TOCADAS (CONFIRMADO)

✅ No tocar:
- Stripe integration
- Bank transfer flow
- Admin payment review
- DB schema (solo query, no modificación)
- RLS policies
- Checkout flow
- Inventario admin
- Emails ya validados (payment, shipping, etc.)

✅ Modificar solo:
- `/api/auth/callback` (agregar check + send email)
- `src/lib/email/mailer.ts` (agregar sendWelcomeEmail)
- Crear nuevo: `src/lib/email/templates/welcome.ts`

---

## RECOMENDACIÓN FINAL

### ✅ RECOMENDADO: IMPLEMENTAR

**Justificación:**
1. Infraestructura de email ya existe y está probada
2. Lógica simple y de bajo riesgo
3. Mejora experiencia de usuario nueva
4. No rompe funcionalidad existente
5. Fácil de rollback si necesario

**Prerrequisitos antes de implementar:**
1. Verificar en Supabase dashboard: Email confirmation setting
2. Confirmar SMTP vars en Vercel production
3. Decidir: ¿Deshabilitar confirmación de Supabase O mantener ambos?

**Recomendación específica:**
- Si Supabase confirmation **está habilitada:** Deshabilitar y usar solo welcome email custom (mejor control)
- Si Supabase confirmation **NO está habilitada:** Implementar welcome email custom directamente

**Tiempo estimado de implementación:**
- Template: 1-2 horas
- Lógica callback: 30 min
- Testing local: 1 hora
- Deploy + testing production: 1 hora
- **Total: 3-4 horas**

---

## PRÓXIMOS PASOS

1. **Jhonatan revisa y aprueba scope**
2. Verificar Supabase email confirmation setting
3. Confirmar SMTP vars production
4. Implementar template + lógica
5. Testing local exhaustivo
6. Deploy a production
7. Monitorear por 48h

---

**Scope preparado por:** Kepler  
**Fecha:** 2026-05-11  
**Status:** ✅ COMPLETO — ESPERANDO APROBACIÓN
