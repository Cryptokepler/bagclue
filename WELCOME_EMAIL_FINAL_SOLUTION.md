# WELCOME EMAIL — SOLUCIÓN FINAL

**Problema:** Email no llega desde callback OAuth real  
**Causa:** `await` bloquea callback y Vercel puede estar timing out  
**Fecha:** 2026-05-11

---

## INTENTOS FALLIDOS

### Intento 1: Fire-and-forget con .catch()
```typescript
checkAndSendWelcomeEmail(user).catch(err => {...})
return NextResponse.redirect(...)
```
**Resultado:** Redirect cancela promesa antes de que email se envíe ❌

### Intento 2: await antes del redirect
```typescript
await checkAndSendWelcomeEmail(user)
return NextResponse.redirect(...)
```
**Resultado:** Callback timeout o no ejecuta correctamente ❌

### Intento 3: Ventana de 15 → 20 minutos
**Resultado:** Usuario cayó fuera de ventana por timing ❌

---

## SOLUCIÓN FINAL: Background Worker/Queue

**Approach:** En lugar de enviar email desde callback, registrar tarea en queue.

### Opción A: Vercel Cron + Check Pendientes (Recomendado)

**Flujo:**
1. Usuario hace login
2. Callback NO envía email directamente
3. Cron job cada 5 minutos busca usuarios nuevos sin welcome email
4. Envía email a usuarios que:
   - `created_at < 30 min`
   - `welcome_email_sent = false` (agregar campo DB)

**Pros:**
- No bloquea callback
- No timeout
- Retry automático si falla
- Simple de implementar

**Cons:**
- Email llega con delay (máximo 5 min)
- Requiere cambio en DB schema (agregar campo)

### Opción B: Edge Function + Vercel Waituntil

```typescript
if (data?.user) {
  // Usar waitUntil para continuar después del response
  ctx.waitUntil(checkAndSendWelcomeEmail(data.user))
}
return NextResponse.redirect(...)
```

**Requiere:** Next.js Edge Runtime  
**Verificar:** Si `/api/auth/callback` puede ser edge function

### Opción C: Webhook Externo (Inngest, Trigger.dev, etc.)

**Flujo:**
1. Callback dispara webhook a servicio externo
2. Servicio envía email
3. Retry automático

**Pros:**
- Robusto
- Observabilidad

**Cons:**
- Requiere servicio externo
- Costo adicional

---

## RECOMENDACIÓN INMEDIATA

**Para MVP:** Usar emails manuales temporalmente mientras implementamos solución robusta.

**Para producción:** Opción A (Cron job + campo DB)

---

## SIGUIENTE PASO

1. **Decidir:** ¿Opción A (cron), B (edge), o C (webhook)?
2. **Si Opción A:** Agregar campo `welcome_email_sent` a `customer_profiles`
3. **Crear cron job** que ejecute cada 5 minutos
4. **Testing exhaustivo**

---

**Status:** Pendiente de decisión
