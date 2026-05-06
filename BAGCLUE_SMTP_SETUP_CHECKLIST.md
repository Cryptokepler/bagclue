# BAGCLUE SMTP SETUP CHECKLIST
**Correo oficial:** hola@bagclue.com  
**From name:** Bagclue  
**Objetivo:** Configurar SMTP para emails transaccionales (confirmación compra, apartado, tracking)  
**Status:** 📋 PENDIENTE DATOS — NO IMPLEMENTAR hasta validación completa

---

## PASO 1 — Identificar proveedor del correo hola@bagclue.com

**Acción requerida (Jhonatan):**
1. ¿Dónde fue creado hola@bagclue.com?
   - [ ] Google Workspace (Gmail empresarial)
   - [ ] Gmail regular (@gmail.com delegado con dominio)
   - [ ] Hostinger Email (domains/bagclue.com/email)
   - [ ] Otro proveedor: _________

**Por qué importa:**
Cada proveedor tiene diferentes SMTP_HOST y SMTP_PORT:
- Google Workspace: `smtp.gmail.com:587` (TLS)
- Hostinger: `smtp.hostinger.com:587` o específico del dominio
- Otro: Verificar documentación

**Cómo verificar:**
- Si fue creado desde Google Workspace admin console → Google Workspace
- Si fue creado desde Hostinger cPanel → Hostinger Email
- Si es @gmail.com con alias dominio → Gmail regular (no recomendado para producción)

---

## PASO 2 — Configuración SMTP según proveedor

### OPCIÓN A — Google Workspace (Gmail empresarial) ✅ RECOMENDADO

**Variables necesarias:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=<app_password_16_chars>
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue
```

**Pasos para obtener App Password:**
1. Ir a Google Account → https://myaccount.google.com/
2. Iniciar sesión con hola@bagclue.com
3. Security → 2-Step Verification (debe estar ACTIVADA primero)
4. Si 2FA no está activa → Settings → Security → Turn on 2-Step Verification
5. Volver a Security → App passwords (aparece solo si 2FA activo)
6. Select app: "Mail" → Select device: "Other (Custom name)" → Escribir "Bagclue SMTP"
7. Click "Generate"
8. Copiar el password de 16 caracteres (formato: xxxx xxxx xxxx xxxx)
9. Guardar en `contraseñas/bagclue_smtp.md` (fuera del repo)
10. NO guardar en el repo, NO commitear

**Validación:**
- App Password tiene 16 caracteres (4 bloques de 4)
- 2FA está activa en la cuenta
- Cuenta hola@bagclue.com puede iniciar sesión en Gmail

---

### OPCIÓN B — Hostinger Email

**Variables necesarias:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=<password_del_email>
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue
```

**Pasos para obtener password:**
1. Ir a Hostinger cPanel → https://hpanel.hostinger.com/
2. Email → Email Accounts
3. Buscar hola@bagclue.com
4. Si fue creado recientemente → usar password definido al crear
5. Si no recuerdas password → Reset Password desde cPanel
6. Guardar en `contraseñas/bagclue_smtp.md`

**Validación:**
- Iniciar sesión en webmail.hostinger.com con hola@bagclue.com
- Enviar email de prueba manual desde webmail
- Verificar que llegue correctamente

---

### OPCIÓN C — Otro proveedor

**Datos necesarios:**
- SMTP_HOST: _________
- SMTP_PORT: 587 (TLS) o 465 (SSL)
- SMTP_USER: hola@bagclue.com
- SMTP_PASSWORD: _________
- Documentación del proveedor

---

## PASO 3 — Validación manual SMTP (antes de implementar)

**Herramienta:** `send_email_test.mjs` (crear script de prueba)

**Objetivo:** Verificar que las credenciales funcionan ANTES de implementar en Bagclue.

**Script de prueba (no implementar en app todavía):**
```javascript
// Test manual SMTP connection
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // o smtp.hostinger.com
  port: 587,
  secure: false,
  auth: {
    user: 'hola@bagclue.com',
    pass: '<app_password_aquí>' // NUNCA commitear
  }
});

async function testSMTP() {
  try {
    const info = await transporter.sendMail({
      from: '"Bagclue" <hola@bagclue.com>',
      to: 'info@kepleragents.com', // email de prueba
      subject: 'Test SMTP Bagclue',
      text: 'Test de conexión SMTP exitoso',
      html: '<p>Test de conexión SMTP <strong>exitoso</strong></p>'
    });
    console.log('✅ Email enviado:', info.messageId);
  } catch (error) {
    console.error('❌ Error SMTP:', error.message);
  }
}

testSMTP();
```

**Validación exitosa:**
- [ ] Email enviado sin errores
- [ ] Email recibido en bandeja de entrada (no spam)
- [ ] Remitente visible: "Bagclue" <hola@bagclue.com>
- [ ] No bounce, no rate limit

---

## PASO 4 — Guardar credenciales de forma segura

**Archivo:** `contraseñas/bagclue_smtp.md` (workspace, fuera del repo)

**Contenido:**
```markdown
# Bagclue SMTP Credentials

**Email:** hola@bagclue.com
**Proveedor:** Google Workspace / Hostinger (especificar)
**Propósito:** Emails transaccionales Bagclue (confirmación, apartado, tracking)

## Variables SMTP

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hola@bagclue.com
SMTP_PASSWORD=<app_password_16_chars>
SMTP_FROM_EMAIL=hola@bagclue.com
SMTP_FROM_NAME=Bagclue

## Notas
- App Password creado: YYYY-MM-DD
- 2FA activa: Sí/No
- Límite diario: 500 emails (Google Workspace) / verificar (Hostinger)
- NO commitear este archivo
- NO compartir credenciales fuera del equipo
```

**Seguridad:**
- ✅ Archivo en `contraseñas/` (fuera de git)
- ✅ `.gitignore` incluye `contraseñas/`
- ✅ NO variables hardcodeadas en código
- ✅ Solo Vercel Environment Variables en producción

---

## PASO 5 — Confirmar datos antes de implementar

**Checklist final (completar antes de PRE-LIVE FASE 1):**

### Datos confirmados:
- [ ] Proveedor del correo: _________ (Google Workspace / Hostinger / Otro)
- [ ] SMTP_HOST: _________
- [ ] SMTP_PORT: _________
- [ ] SMTP_USER: hola@bagclue.com ✅
- [ ] SMTP_PASSWORD: Obtenido y guardado en `contraseñas/bagclue_smtp.md`
- [ ] SMTP_FROM_EMAIL: hola@bagclue.com ✅
- [ ] SMTP_FROM_NAME: Bagclue ✅

### Validación técnica:
- [ ] Test manual SMTP exitoso (script de prueba ejecutado)
- [ ] Email recibido correctamente
- [ ] Remitente visible correcto
- [ ] No errores de autenticación

### Seguridad:
- [ ] Credenciales guardadas en `contraseñas/bagclue_smtp.md`
- [ ] `.gitignore` incluye `contraseñas/`
- [ ] NO hay credenciales en el repo
- [ ] App Password (si Google Workspace) tiene 16 caracteres

### Límites y restricciones:
- [ ] Límite diario verificado (Google Workspace: 500/día, Hostinger: verificar)
- [ ] No hay restricciones de dominio SPF/DKIM/DMARC (verificar DNS si hay problemas)

---

## PASO 6 — Implementación (NO EJECUTAR hasta confirmación)

**Una vez confirmados los datos del PASO 5:**

1. Crear `/lib/email/mailer.ts` con configuración SMTP
2. Crear templates HTML minimalistas (Playfair/Inter, marfil/fucsia)
3. Implementar 3 emails transaccionales:
   - Confirmación compra
   - Confirmación apartado
   - Tracking enviado
4. Agregar variables a Vercel Environment Variables (production)
5. Redeploy Bagclue
6. QA con orden de prueba real

**Tiempo estimado:** 2-3 horas (implementación + templates + QA)

---

## SIGUIENTE PASO INMEDIATO

**Acción requerida (Jhonatan):**

1. **Confirmar proveedor del correo hola@bagclue.com:**
   - Google Workspace ✅ (recomendado)
   - Hostinger Email
   - Otro

2. **Si Google Workspace:**
   - Activar 2FA en hola@bagclue.com
   - Crear App Password (pasos arriba)
   - Guardar password en `contraseñas/bagclue_smtp.md`
   - Confirmar: "App Password guardado, listo para test"

3. **Si Hostinger:**
   - Verificar password del email
   - Guardar en `contraseñas/bagclue_smtp.md`
   - Confirmar: "Password guardado, listo para test"

4. **Una vez confirmado:**
   - Kepler ejecuta test manual SMTP
   - Si exitoso → implementa PRE-LIVE FASE 1
   - Si falla → diagnostica y ajusta

---

## Reglas de seguridad (recordatorio)

- ❌ NO imprimir credenciales en logs
- ❌ NO guardar credenciales en el repo
- ❌ NO commitear secretos
- ❌ NO usar console.log() con passwords
- ✅ Variables solo en Vercel o archivo externo seguro
- ✅ Archivo `contraseñas/` fuera de git
- ✅ `.gitignore` actualizado

---

**Status:** 📋 CHECKLIST COMPLETO — Awaiting datos confirmados para ejecutar test SMTP
