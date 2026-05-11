# BAGCLUE MANUAL QA CHECKLIST — PRE-LIVE

**Ejecutor:** Jhonatan  
**Monitor:** Kepler  
**Fecha:** 2026-05-11  
**Objetivo:** Validar flujos críticos antes de activar Stripe Live  

---

## PRE-REQUISITOS

**Credenciales:**
- Admin: https://bagclue.vercel.app/admin/login → Password: `bagclue2026`
- Stripe test card: `4242 4242 4242 4242` / Exp: `12/34` / CVC: `123`

**Inbox de prueba:**
- Email: cryptokepleroficial@gmail.com (o el que uses para testing)

**Producto test creado:**
- **QA Pre-Live Flow Test** - $20 MXN
- URL: https://bagclue.vercel.app/catalogo/qa-pre-live-flow-test
- ID: `0701ca2e-f575-4ea5-9100-444459516422`
- Brand: Goyard (safe for home)
- Image: Placeholder test image ✅

---

## TEST 1 — STRIPE FLOW END-TO-END ⏳

### Pasos (Usuario)

1. **Abrir producto:**
   - URL: https://bagclue.vercel.app/catalogo/qa-pre-live-flow-test
   - ✅ Confirmar: imagen visible, precio $20 MXN, botones activos

2. **Agregar al carrito:**
   - Click "Agregar al Carrito"
   - ✅ Confirmar: mensaje de confirmación o badge carrito actualizado

3. **Ir a carrito:**
   - URL: https://bagclue.vercel.app/cart
   - ✅ Confirmar: producto listado, subtotal correcto

4. **Seleccionar método de pago:**
   - Click "Tarjeta de Crédito / Débito"
   - ✅ Confirmar: redirige a Stripe Checkout

5. **Pagar con tarjeta test:**
   - Número: `4242 4242 4242 4242`
   - Exp: `12/34`
   - CVC: `123`
   - Email: `cryptokepleroficial@gmail.com` (o tu test email)
   - Click "Pagar"

6. **Confirmar post-pago:**
   - ✅ Confirmar: redirect a success page
   - ✅ Confirmar: mensaje "Pago exitoso" o similar
   - ✅ Confirmar: tracking link visible

7. **Revisar email:**
   - ✅ Confirmar: Email "Pago confirmado" recibido
   - ✅ Confirmar: tracking link en email

8. **Abrir tracking:**
   - Click tracking link del email
   - ✅ Confirmar: página tracking abre
   - ✅ Confirmar: orden visible con status "paid" o "confirmado"
   - ✅ Confirmar: CTA "Confirmar dirección" visible (si no hay dirección guardada)

### Validaciones (Kepler)

**Durante el flujo, Kepler verificará:**
- Order creada en DB
- `payment_status = 'paid'`
- `order.status = 'confirmed'`
- `product.status = 'sold'` (si stock llega a 0)
- `stock` actualizado
- Email pago confirmado enviado (SMTP log)
- `/track/[token]` funciona
- Logs sin secretos (STRIPE_SECRET_KEY, SMTP_PASSWORD, etc.)

**Resultado:** ⏳ PENDING

---

## TEST 2 — BANK TRANSFER FLOW END-TO-END ⏳

### Pasos (Usuario)

1. **Restaurar producto:**
   - Kepler: marca producto como available de nuevo
   - ✅ Confirmar: producto aparece en catálogo

2. **Abrir producto:**
   - URL: https://bagclue.vercel.app/catalogo/qa-pre-live-flow-test
   - ✅ Confirmar: disponible para compra

3. **Agregar al carrito:**
   - Click "Agregar al Carrito"

4. **Ir a carrito:**
   - URL: https://bagclue.vercel.app/cart

5. **Seleccionar método de pago:**
   - Click "Transferencia Bancaria (MXN)"
   - ✅ Confirmar: muestra información Banorte
   - ✅ Confirmar: CLABE visible
   - ✅ Confirmar: referencia visible
   - ✅ Confirmar: fecha límite visible
   - ✅ Confirmar: orden creada

6. **Revisar email instrucciones:**
   - ✅ Confirmar: Email "Instrucciones transferencia" recibido
   - ✅ Confirmar: CLABE, referencia, monto, fecha límite en email

7. **Subir comprobante:**
   - Volver a tracking page o usar link del email
   - Upload PDF o imagen de comprobante test
   - ✅ Confirmar: upload exitoso
   - ✅ Confirmar: mensaje "Comprobante recibido"

8. **Revisar email comprobante:**
   - ✅ Confirmar: Email "Comprobante recibido" llegó

9. **Ir a admin payments:**
   - URL: https://bagclue.vercel.app/admin/payments
   - Login con `bagclue2026`
   - ✅ Confirmar: pago listado con status "proof_uploaded"

10. **Abrir comprobante:**
    - Click en pago
    - ✅ Confirmar: botón "Ver comprobante" visible
    - Click "Ver comprobante"
    - ✅ Confirmar: archivo carga correctamente

11. **Aprobar pago:**
    - Click "Aprobar pago"
    - ✅ Confirmar: confirmación de aprobación
    - ✅ Confirmar: status cambia a "confirmed"

12. **Revisar email confirmación:**
    - ✅ Confirmar: Email "Pago confirmado" llegó

13. **Cliente: ver orden actualizada:**
    - Volver a tracking page
    - ✅ Confirmar: status "paid" o "confirmed"
    - ✅ Confirmar: CTA "Confirmar dirección" visible

### Validaciones (Kepler)

**Durante el flujo, Kepler verificará:**
- Transaction creada: `status = 'pending'`
- Transaction after upload: `status = 'proof_uploaded'`
- Transaction after approval: `status = 'confirmed'`
- Order: `pending → paid/confirmed`
- Product: `reserved → sold`
- Emails: instrucciones, comprobante recibido, pago confirmado (3 emails)
- Tracking funciona en todo momento
- Logs sin secretos

**Resultado:** ⏳ PENDING

---

## TEST 3 — REJECT FLOW ⏳

### Pasos (Usuario)

1. **Crear segunda orden transferencia:**
   - Restaurar producto de nuevo (Kepler)
   - Repetir steps 1-7 del TEST 2 (hasta subir comprobante)

2. **Admin: rechazar pago:**
   - Ir a https://bagclue.vercel.app/admin/payments
   - Abrir pago con comprobante subido
   - Click "Rechazar pago"
   - Ingresar motivo: "Comprobante ilegible - por favor sube imagen más clara"
   - Confirmar rechazo
   - ✅ Confirmar: status cambia a "rejected"

3. **Revisar email rechazo:**
   - ✅ Confirmar: Email "Comprobante rechazado" llegó
   - ✅ Confirmar: motivo visible en email
   - ✅ Confirmar: instrucciones para volver a subir

4. **Cliente: ver orden rechazada:**
   - Volver a tracking page
   - ✅ Confirmar: mensaje rechazo visible
   - ✅ Confirmar: botón "Subir nuevo comprobante" visible

5. **Verificar producto:**
   - Ir a catálogo
   - ✅ Confirmar: producto vuelve a aparecer como "available"

### Validaciones (Kepler)

**Durante el flujo, Kepler verificará:**
- Transaction: `status = 'rejected'`
- `rejection_reason` guardado correctamente
- Order: sigue `pending` (no cambia a paid)
- Product: vuelve a `status = 'available'`
- Email rechazo enviado
- Cliente puede volver a subir comprobante
- Logs sin secretos

**Resultado:** ⏳ PENDING

---

## TEST 4 — SHIPPING FLOW ⏳

### Pasos (Usuario)

1. **Usar orden paid:**
   - Usar orden del TEST 1 (Stripe) o TEST 2 (transferencia aprobada)
   - Confirmar: orden tiene `payment_status = 'paid'`

2. **Admin: marcar enviado:**
   - Ir a https://bagclue.vercel.app/admin/envios (o /admin/orders si no existe envios)
   - Localizar orden paid
   - Click "Marcar como enviado"
   - Ingresar datos:
     - Paquetería: `DHL`
     - Tracking number: `1234567890TEST`
   - Confirmar
   - ✅ Confirmar: status cambia a "shipped"

3. **Revisar email tracking:**
   - ✅ Confirmar: Email "Tu pieza va en camino" llegó
   - ✅ Confirmar: tracking number visible en email
   - ✅ Confirmar: link tracking clickeable (puede ser mock)

4. **Cliente: ver orden enviada:**
   - Abrir tracking page de esa orden
   - ✅ Confirmar: status "Enviado" visible
   - ✅ Confirmar: tracking number visible
   - ✅ Confirmar: paquetería visible

### Validaciones (Kepler)

**Durante el flujo, Kepler verificará:**
- `shipping_status = 'shipped'`
- `tracking_number` guardado
- `shipping_provider` guardado
- Email tracking enviado (SMTP log)
- `/track/[token]` muestra shipping info
- Logs sin secretos

**Resultado:** ⏳ PENDING

---

## TEST 5 — SEGURIDAD ✅

### Validaciones (Kepler)

**Endpoints de test:**
- ✅ `/api/test-email` → 404
- ✅ `/api/test-callback-flow` → 404
- ✅ `/api/test-smtp` → 404
- ✅ `/api/cron/welcome-email` (sin secret) → 401

**Logs Vercel (últimas 100 líneas):**
- ⏳ No `STRIPE_SECRET_KEY` en logs
- ⏳ No `SUPABASE_SERVICE_ROLE_KEY` en logs
- ⏳ No `SMTP_PASSWORD` en logs
- ⏳ No `CRON_SECRET` en logs
- ⏳ No CLABE completa en logs (solo últimos 4 dígitos OK)
- ⏳ No tracking_token completo en logs (solo primeros 8 caracteres OK)

**Resultado:** ⏳ PARTIAL (endpoints validated, logs pending)

---

## CLEANUP POST-QA

Después de completar todos los tests:

1. **Restaurar productos:**
   - Pm St. Louis rosa: `status = 'available'`, `stock = 1`
   - Goyard Anjou PM Vino: `status = 'available'`, `stock = 1`

2. **Marcar órdenes test:**
   - Agregar nota en DB: "QA test - no real"
   - O eliminar si es posible sin romper constraints

3. **Limpiar transactions test:**
   - Marcar como test o eliminar

4. **Productos test:**
   - Despublicar o eliminar si se crearon

---

## ENTREGABLE FINAL

Kepler generará: **BAGCLUE_PRE_LIVE_MANUAL_QA_REPORT.md**

**Contendrá:**
- ✅ / ❌ por cada flujo
- IDs parciales (primeros 8 caracteres)
- Emails recibidos (sí/no)
- Bugs detectados (descripción + severidad)
- Cleanup realizado (sí/no)
- **DECISIÓN FINAL: READY FOR STRIPE LIVE: YES / NO**

---

## CRITERIOS DE APROBACIÓN

**PASS = READY FOR STRIPE LIVE:**
- TEST 1 (Stripe): ✅
- TEST 2 (Bank Transfer): ✅
- TEST 3 (Reject): ✅
- TEST 4 (Shipping): ✅
- TEST 5 (Security): ✅
- Bugs críticos detectados: 0
- Bugs altos detectados: 0

**FAIL = NOT READY:**
- Cualquier test falla
- Bug crítico detectado (pagos no procesan, emails no llegan, data corruption)
- Secrets expuestos en logs

---

## MONITOREO EN VIVO (KEPLER)

Durante cada test, Kepler ejecutará:

```bash
# Check orders
curl -s 'https://orhjnwpbzxyqtyrayvoi.supabase.co/rest/v1/orders?select=*&order=created_at.desc&limit=3' -H "apikey: ..."

# Check transactions
curl -s 'https://orhjnwpbzxyqtyrayvoi.supabase.co/rest/v1/transactions?select=*&order=created_at.desc&limit=3' -H "apikey: ..."

# Check products
curl -s 'https://orhjnwpbzxyqtyrayvoi.supabase.co/rest/v1/products?id=eq.cc573dde-815c-4e80-b68e-659609605743&select=*' -H "apikey: ..."

# Vercel logs (últimas 50 líneas)
vercel logs bagclue --limit 50
```

---

**STATUS:** ⏳ READY TO START

**NEXT:** Jhonatan indica cuando comenzar TEST 1
