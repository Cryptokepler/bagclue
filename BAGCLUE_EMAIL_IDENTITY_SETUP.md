# BAGCLUE EMAIL IDENTITY SETUP — SCOPE BREVE

**Fecha:** 2026-05-06 16:41 UTC  
**Objetivo:** Definir correo oficial Bagclue para emails transaccionales  
**Estado:** RECOMENDACIÓN Y PASOS (sin implementar)

---

## RESUMEN EJECUTIVO

**Decisión pendiente:** ¿Qué correo usa Bagclue para emails transaccionales?

**Preferencia inicial Jhonatan:**
- **Remitente visible:** Bagclue
- **Correo:** hola@bagclue.com
- **Proveedor:** Google Workspace o Resend

**Recomendación Kepler:** **Google Workspace** para MVP → migrar a Resend después si volumen crece

---

## OPCIÓN 1: GOOGLE WORKSPACE (Recomendado)

### Email Propuesto
```
Remitente: Bagclue
Email: hola@bagclue.com
```

### Alternativas
- `concierge@bagclue.com` - más luxury/boutique
- `soporte@bagclue.com` - más funcional
- `info@bagclue.com` - estándar corporativo

**Recomendación:** `hola@bagclue.com` - cálido, accesible, español natural

---

### Proveedor: Google Workspace

**Qué es:**
- Gmail corporativo con tu dominio
- SMTP incluido
- Inbox funcional (recibe respuestas clientes)

**Plan:**
- **Business Starter:** $6 USD/mes/usuario
- 30GB storage
- Email profesional @bagclue.com
- Admin console

**URL signup:** https://workspace.google.com/

---

### Pros ✅

1. **Setup rápido:** 15-30 minutos
2. **SMTP incluido:** Sin config adicional
3. **Inbox funcional:** Puedes leer respuestas clientes
4. **Sin límites bajos:** 2000 emails/día (suficiente MVP)
5. **Professional:** Email corporativo real
6. **Familiar:** Interface Gmail conocida
7. **Soporte:** Google support si hay problemas
8. **Escalable:** Agregar más usuarios fácil
9. **Credibilidad:** `@bagclue.com` > `@gmail.com`

---

### Contras ⚠️

1. **Costo:** $6/mes (vs gratis opciones)
2. **Verificación dominio:** Requiere agregar records DNS
3. **No analytics built-in:** Debes logear tú
4. **Límite diario:** 2000 emails/día (ampliable)

---

### SMTP Config

**Después de crear cuenta:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=[app_password_generado]
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue
```

**App Password:** Google Workspace → Security → 2-Step Verification → App passwords

---

### Pasos Setup (30 min)

#### 1. Signup Google Workspace
- Ir a https://workspace.google.com/
- Click "Get started"
- Seleccionar "Business Starter" ($6/mes)
- Ingresar nombre negocio: **Bagclue**
- Cantidad empleados: **1-2**
- País: **México** (o donde esté registrado)
- Email contacto actual: [tu email]

#### 2. Configurar Dominio
- Dominio: **bagclue.com**
- Opción: "Tengo dominio" (ya lo tienes)
- Verificar propiedad

#### 3. Verificación DNS (Vercel)
Google te dará un TXT record tipo:
```
google-site-verification=abcd1234...
```

**En Vercel Dashboard:**
- Settings → Domains → bagclue.com → DNS Records
- Add Record:
  - Type: TXT
  - Name: @ (o bagclue.com)
  - Value: `google-site-verification=abcd1234...`
- Save

**Esperar:** 5-10 minutos propagación
**Verificar en Google:** Click "Verify"

#### 4. Configurar MX Records (Email)
Google te dará 5 MX records:
```
Priority 1: ASPMX.L.GOOGLE.COM
Priority 5: ALT1.ASPMX.L.GOOGLE.COM
Priority 5: ALT2.ASPMX.L.GOOGLE.COM
Priority 10: ALT3.ASPMX.L.GOOGLE.COM
Priority 10: ALT4.ASPMX.L.GOOGLE.COM
```

**En Vercel Dashboard:**
- Add 5 MX records con prioridades
- Eliminar MX records previos (si existen)

**Esperar:** 1-24 horas propagación completa (típico: 1-2 horas)

#### 5. Crear Usuario Email
- Admin console → Users
- Add new user: `hola@bagclue.com`
- Nombre: Bagclue
- Password: [temporal, cambiar después]

#### 6. Generar App Password
- Login como hola@bagclue.com
- Account → Security
- Enable 2-Step Verification (requerido para app passwords)
- App passwords → Generate
- App: "Mail" / Device: "Bagclue Web"
- Copiar password de 16 caracteres: `abcd efgh ijkl mnop`

#### 7. Guardar Credenciales
**Archivo:** `contraseñas/bagclue_email.md` (NO commitear)
```markdown
# Bagclue Email - Google Workspace

Email: hola@bagclue.com
SMTP Host: smtp.gmail.com
SMTP Port: 587
App Password: abcd efgh ijkl mnop
Login URL: https://mail.google.com
Admin Console: https://admin.google.com

Created: 2026-05-06
```

---

### Testing SMTP

**Después de setup:**

```bash
# Test local
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'hola@bagclue.com',
    pass: 'abcd efgh ijkl mnop'
  }
});

transport.sendMail({
  from: '\"Bagclue\" <hola@bagclue.com>',
  to: 'jhonatan@example.com',
  subject: 'Test Email Bagclue',
  html: '<h1>Email configurado correctamente</h1>'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Sent:', info.messageId);
});
"
```

**Validar:**
- ✅ Email llega a inbox (NO spam)
- ✅ Remitente muestra "Bagclue <hola@bagclue.com>"
- ✅ Responder funciona (llega a inbox hola@bagclue.com)

---

### Riesgos Google Workspace

#### Riesgo 1: Verificación DNS Tarda
**Mitigación:** Esperar 24h completo, validar records con `dig bagclue.com MX`

#### Riesgo 2: Emails Van a Spam Inicialmente
**Mitigación:**
- Configurar SPF record (Google lo hace auto)
- Configurar DKIM (Google admin console)
- Warming: enviar pocos emails primeros días

#### Riesgo 3: Límite 2000/día Alcanzado
**Mitigación:** 
- Monitorear volumen
- Migrar a Resend/SendGrid si crece

#### Riesgo 4: Costo Recurrente $6/mes
**Mitigación:** Incluir en presupuesto operativo Bagclue

---

### Qué NO Hacer

❌ **NO usar email personal** (`@gmail.com`, `@outlook.com`) para negocio  
❌ **NO compartir app password** por WhatsApp/Telegram  
❌ **NO usar password login normal** (usar app password)  
❌ **NO eliminar MX records sin backup** (perderías email)  
❌ **NO omitir 2FA** (requerido para app passwords)

---

## OPCIÓN 2: RESEND (Escalable, Dev-Friendly)

### Email Propuesto
```
Remitente: Bagclue
Email: hola@bagclue.com
```

### Proveedor: Resend

**Qué es:**
- API email moderna para developers
- React Email templates (opcional)
- Analytics built-in

**Plan:**
- **Free:** 3,000 emails/mes gratis
- **Pro:** $20/mes - 50,000 emails/mes
- Sin inbox (solo envío)

**URL signup:** https://resend.com/

---

### Pros ✅

1. **Gratis hasta 3,000/mes:** Suficiente MVP
2. **API simple:** Más fácil que SMTP
3. **Analytics built-in:** Aperturas, clicks, bounces
4. **Sin límites bajos:** Escala bien
5. **React Email:** Templates modernos (opcional)
6. **Deliverability:** Infraestructura optimizada
7. **Dev-friendly:** Docs excelentes
8. **Webhooks:** Events automáticos (bounce, delivered)

---

### Contras ⚠️

1. **NO inbox:** Solo envío (no recibes respuestas)
2. **Verificación dominio:** DNS records requeridos
3. **Signup requerido:** Verificación cuenta
4. **Dependencia externa:** API third-party
5. **Costo si crece:** $20/mes después de 3,000 emails

---

### API Config

```bash
RESEND_API_KEY=re_abcd1234...
EMAIL_FROM=hola@bagclue.com
EMAIL_FROM_NAME=Bagclue
```

**NO usar SMTP** - Resend es API-only

---

### Pasos Setup (45 min)

#### 1. Signup Resend
- Ir a https://resend.com/signup
- Email: [tu email]
- Crear cuenta
- Verificar email

#### 2. Agregar Dominio
- Dashboard → Domains → Add domain
- Domain: **bagclue.com**
- Resend te da 3 DNS records:
  - SPF (TXT)
  - DKIM (TXT)
  - DMARC (TXT)

#### 3. Configurar DNS (Vercel)
**En Vercel Dashboard:**
- Settings → Domains → bagclue.com → DNS Records
- Agregar los 3 records TXT que Resend te dio
- Save

**Esperar:** 5-30 minutos propagación
**Verificar en Resend:** Status "Verified"

#### 4. Generar API Key
- Resend Dashboard → API Keys
- Create API Key
- Name: "Bagclue Production"
- Permission: "Sending access"
- Copiar key: `re_abcd1234...`

#### 5. Guardar Credenciales
**Archivo:** `contraseñas/bagclue_resend.md`
```markdown
# Bagclue Email - Resend

API Key: re_abcd1234...
Domain: bagclue.com
From: hola@bagclue.com
Dashboard: https://resend.com/emails

Created: 2026-05-06
```

---

### Código Resend (en vez de nodemailer)

```typescript
// src/lib/email/mailer.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Bagclue <hola@bagclue.com>',
      to: [to],
      subject,
      html
    })
    
    if (error) {
      console.error('[EMAIL] Resend error:', error)
      return { success: false, error }
    }
    
    console.log('[EMAIL] Sent:', { to, subject, id: data?.id })
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('[EMAIL] Failed:', error.message)
    return { success: false, error: error.message }
  }
}
```

**Instalación:**
```bash
npm install resend
```

---

### Riesgos Resend

#### Riesgo 1: Sin Inbox
**Problema:** No puedes recibir respuestas clientes  
**Mitigación:** Configurar "Reply-To" header a otro email funcional

#### Riesgo 2: Verificación DNS Falla
**Mitigación:** Validar records con `dig bagclue.com TXT`

#### Riesgo 3: Límite 3,000/mes Alcanzado
**Mitigación:** Upgrade a $20/mes (50k emails)

#### Riesgo 4: Dependencia API
**Problema:** Si Resend down, emails no salen  
**Mitigación:** Fallback SMTP alternativo (complejo)

---

### Qué NO Hacer

❌ **NO usar para recibir emails** (no hay inbox)  
❌ **NO exponer API key** en frontend (usar backend only)  
❌ **NO omitir DNS verification** (emails irán a spam)  
❌ **NO asumir entrega instantánea** (verificar webhooks)

---

## OPCIÓN 3: SENDGRID (Empresarial, Robusto)

### Email Propuesto
```
Remitente: Bagclue
Email: hola@bagclue.com
```

### Proveedor: SendGrid

**Qué es:**
- Email service by Twilio
- Enterprise-grade

**Plan:**
- **Free:** 100 emails/día gratis
- **Essentials:** $20/mes - 50,000 emails/mes
- Sin inbox (solo envío)

**URL signup:** https://sendgrid.com/

---

### Pros ✅

1. **Gratis 100/día:** Suficiente primeros días
2. **Infraestructura robusta:** Twilio backbone
3. **Analytics completo:** Dashboards, reports
4. **Deliverability:** Muy buena reputación
5. **Webhooks:** Events tracking
6. **Templates visuales:** Editor drag-and-drop
7. **Escalable:** Hasta millones/día

---

### Contras ⚠️

1. **Límite gratis bajo:** 100 emails/día (insuficiente)
2. **Costo:** $20/mes desde el inicio si necesitas más
3. **Setup complejo:** Más pasos que Resend
4. **Sin inbox:** Solo envío
5. **Verificación estricta:** Review manual cuenta

---

### API Config

```bash
SENDGRID_API_KEY=SG.abcd1234...
EMAIL_FROM=hola@bagclue.com
EMAIL_FROM_NAME=Bagclue
```

---

### Pasos Setup (60 min)

Similar a Resend pero más burocrático:
1. Signup + verificación email
2. Review cuenta manual (puede tardar 24-48h)
3. Agregar dominio + DNS
4. Generar API key
5. Configurar sender authentication

**Más lento que Resend**

---

### Riesgos SendGrid

#### Riesgo 1: Límite 100/día Gratis Insuficiente
**Mitigación:** Pagar $20/mes desde día 1

#### Riesgo 2: Review Cuenta Tarda
**Mitigación:** Aplicar 2-3 días antes de lanzamiento

#### Riesgo 3: Sin Inbox
**Mitigación:** Reply-To a otro email

---

### Qué NO Hacer

❌ **NO depender de free tier** (100/día es muy poco)  
❌ **NO aplicar último momento** (review tarda)  
❌ **NO usar para recibir** (no hay inbox)

---

## COMPARACIÓN DIRECTA

| Criterio | Google Workspace | Resend | SendGrid |
|----------|------------------|--------|----------|
| **Setup** | 30 min | 45 min | 60 min |
| **Costo inicial** | $6/mes | $0 (3k/mes) | $0 (100/día) |
| **Inbox funcional** | ✅ SÍ | ❌ NO | ❌ NO |
| **Emails/día gratis** | 2,000 | 100 | 100 |
| **Emails/mes gratis** | ~60,000 | 3,000 | ~3,000 |
| **Professional look** | ✅✅✅ | ✅✅ | ✅✅ |
| **Analytics** | ❌ | ✅ | ✅✅ |
| **Escalabilidad** | ✅✅ | ✅✅✅ | ✅✅✅ |
| **Dev-friendly** | ⚠️ SMTP | ✅✅ API | ✅ API |
| **Credibilidad** | ✅✅✅ | ✅✅ | ✅✅ |
| **Soporte** | ✅✅ | ✅ | ✅✅ |

---

## RECOMENDACIÓN KEPLER

### Para MVP: **GOOGLE WORKSPACE**

**Motivos:**

1. **Inbox funcional** ✅
   - Clientes responden a hola@bagclue.com
   - Puedes leer/responder desde Gmail
   - Comunicación bidireccional

2. **Professional** ✅
   - `@bagclue.com` > cualquier free tier
   - Credibilidad máxima
   - Se siente empresa real

3. **Sin límites bajos** ✅
   - 2,000 emails/día suficiente MVP
   - No te quedas sin cuota primeros días

4. **Setup rápido** ✅
   - 30 minutos total
   - Sin review manual
   - Operativo mismo día

5. **Familiar** ✅
   - Interface Gmail conocida
   - No aprender API nueva
   - Menos fricción

6. **Costo predecible** ✅
   - $6/mes fijo
   - Sin sorpresas
   - Cancelable

---

### Migración Futura: **Resend**

**Cuándo migrar:**
- Si volumen crece >2,000/día
- Si necesitas analytics detallado
- Si quieres webhooks automáticos
- Si el costo $20/mes se justifica

**Ventaja:** Código cambia mínimo (SMTP → API)

---

## DECISIÓN RECOMENDADA

### Email Identity Bagclue

```
Remitente visible: Bagclue
Email: hola@bagclue.com
Proveedor: Google Workspace ($6/mes)
```

**Alternativas email:**
- `concierge@bagclue.com` - si quieres tono más luxury
- `soporte@bagclue.com` - si quieres tono más funcional

**Recomendación final:** `hola@bagclue.com` - cálido, accesible, español

---

### Variables Vercel (Después de Setup)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=[app_password_16_chars]
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue
```

---

## PRÓXIMOS PASOS (Post-Decisión)

### Fase 1: Setup Google Workspace (30 min)
1. Signup Business Starter $6/mes
2. Agregar bagclue.com
3. Verificar TXT record
4. Configurar MX records (esperar propagación)
5. Crear usuario hola@bagclue.com
6. Generar app password
7. Guardar en `contraseñas/bagclue_email.md`

### Fase 2: Testing (15 min)
1. Test SMTP local con nodemailer
2. Validar email llega inbox
3. Validar remitente correcto
4. Validar reply funciona

### Fase 3: Implementar Email SMTP (3h)
1. Seguir `BAGCLUE_EMAIL_SMTP_SCOPE.md`
2. Usar credenciales hola@bagclue.com
3. Deploy con variables Vercel
4. Test compra real

---

## RIESGOS GENERALES

### Riesgo 1: DNS Propagación Tarda
**Tiempo:** 1-24 horas (típico: 1-2h)  
**Mitigación:** Configurar 1 día antes de necesitar

### Riesgo 2: Emails Iniciales Van a Spam
**Causa:** Dominio nuevo sin reputación  
**Mitigación:**
- Warming gradual (pocos emails primeros días)
- SPF + DKIM configurados (Google/Resend lo hacen auto)
- Evitar spam words ("gratis", "urgente", etc.)

### Riesgo 3: Costo Recurrente Olvidado
**Mitigación:** Agregar a presupuesto mensual Bagclue

---

## QUÉ NO HACER (General)

❌ **NO usar email personal** para negocio  
❌ **NO omitir verificación dominio**  
❌ **NO hardcodear passwords** en código  
❌ **NO commitear credenciales** a Git  
❌ **NO cambiar remitente** cada deployment  
❌ **NO enviar spam** (destruye reputación dominio)  
❌ **NO ignorar bounces** (muchos bounces = spam flag)

---

## ESTIMACIÓN TIEMPO TOTAL

**Google Workspace (Recomendado):**
- Setup: 30 min
- DNS propagación: 1-2 horas espera
- Testing: 15 min
- Implementación código: 3 horas
- **Total funcional:** 4-5 horas (incluyendo espera DNS)

**Resend (Alternativa):**
- Setup: 45 min
- DNS propagación: 30 min espera
- Testing: 15 min
- Implementación código: 3.5 horas (cambio a API)
- **Total funcional:** 5-6 horas

---

## RECOMENDACIÓN FINAL

### ✅ Google Workspace `hola@bagclue.com`

**Por qué:**
1. Inbox funcional (crítico para customer support)
2. Professional `@bagclue.com` credibilidad
3. Setup más rápido (30 min)
4. Sin límites bajos MVP (2,000/día)
5. $6/mes predecible y cancelable

**Cuándo migrar a Resend:**
- Volumen >60,000/mes
- Necesitas analytics detallado
- Justifica $20/mes

---

## DECISIÓN REQUERIDA DE JHONATAN

**Aprobar:**
1. ✅ Email: `hola@bagclue.com` (o alternativa)
2. ✅ Proveedor: Google Workspace $6/mes
3. ✅ Proceder con setup

**Después de aprobación:**
1. Ejecutar Fase 1 (setup 30 min)
2. Esperar DNS propagación (1-2h)
3. Testing (15 min)
4. Implementar email SMTP code (3h)
5. Deploy production

**Total hasta emails funcionando:** 4-5 horas

---

**Documento preparado:** 2026-05-06 16:45 UTC  
**Esperando decisión:** Email identity y proveedor  
**NO implementado todavía:** Sin cambios código/Vercel
