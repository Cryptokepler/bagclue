# TEST FASE 5C.3B.4B — INSTRUCCIONES MANUALES
**Fecha:** 2026-05-03 10:25 UTC  
**Layaway Test:** `aaaaaaaa-bbbb-cccc-dddd-000000000001`

---

## ✅ ESTADO INICIAL VALIDADO

```
LAYAWAY:
  status: active
  amount_paid: 105000
  amount_remaining: 84000
  payments_completed: 4
  payments_remaining: 4
  order_id: null

PAYMENTS:
  #1-#4: paid ✅
  #5-#8: pending ⏸️

PRODUCT:
  Chanel Classic Flap Negro
  status: available
  stock: 1
  price: 189000

ORDERS CON LAYAWAY_ID:
  (ninguna)
```

**✅ LISTO PARA TEST**

---

## 📋 PASOS PARA EJECUTAR TEST

### PASO 1: Login en Bagclue

1. Ir a: **https://bagclue.vercel.app/account/login**
2. Email: `jhonatanvenegas@usdtcapital.es`
3. Ingresar password
4. Click "Iniciar sesión"

---

### PASO 2: Ir al apartado test

1. Ir a: **https://bagclue.vercel.app/account/layaways**
2. Click en el apartado activo (Chanel Classic Flap Negro)
3. O ir directamente a: **https://bagclue.vercel.app/account/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001**

---

### PASO 3: Pagar saldo completo

1. Click en botón **"Pagar saldo completo"**
2. Verificar modal muestra:
   - Saldo pendiente: **$84,000 MXN**
   - 4 pagos pendientes
3. Click **"Pagar ahora"**
4. Esperar redirect a Stripe Checkout

---

### PASO 4: Completar pago en Stripe

1. **Stripe Checkout abrirá automáticamente**
2. Ingresar datos de tarjeta test:
   - **Número:** 4242 4242 4242 4242
   - **Exp:** 12/34 (cualquier fecha futura)
   - **CVC:** 123 (cualquier 3 dígitos)
   - **ZIP:** 12345 (cualquier 5 dígitos)
3. Click **"Pagar"**
4. Esperar confirmación de Stripe
5. **NO cerrar la pestaña** hasta ver success page

---

### PASO 5: Esperar webhook (automático)

- Stripe enviará webhook automáticamente a: `/api/stripe/webhook`
- Handler `handleLayawayFullBalance` se ejecutará
- Esperar ~5-10 segundos

---

### PASO 6: Validar resultado

**Ejecutar en terminal:**
```bash
cd /home/node/.openclaw/workspace/bagclue
node scripts/validate-full-balance.mjs
```

---

## 🔍 RESULTADO ESPERADO

### Layaway
```
status: completed ✅
amount_paid: 189000 ✅
amount_remaining: 0 ✅
payments_completed: 8 ✅
payments_remaining: 0 ✅
completed_at: [timestamp] ✅
order_id: [UUID] ✅
```

### Payments #5-#8
```
#5: paid ✅ | amount_paid: 21000 | paid_at: [timestamp]
#6: paid ✅ | amount_paid: 21000 | paid_at: [timestamp]
#7: paid ✅ | amount_paid: 21000 | paid_at: [timestamp]
#8: paid ✅ | amount_paid: 21000 | paid_at: [timestamp]
```

### Order
```
1 order creada ✅
layaway_id: aaaaaaaa-bbbb-cccc-dddd-000000000001 ✅
status: confirmed ✅
payment_status: paid ✅
total: 189000 ✅
tracking_token: [32 hex] ✅
user_id: [UUID] ✅
```

### Order_items
```
1 item ✅
product_id: 9ed1749d-b82b-4ac5-865e-f2f332c439c3 ✅
quantity: 1 ✅
unit_price: 189000 ✅
subtotal: 189000 ✅
product_snapshot: {title, brand, model, color, slug, price, currency} ✅
```

### Product
```
status: sold ✅
stock: 0 ✅
```

---

## 🎯 VALIDACIÓN UI

### /account/layaways/[id]
- [ ] Estado: Completado ✅
- [ ] Calendario: #1-#8 marcados como pagados
- [ ] Botón "Pagar saldo completo": NO visible (ya completado)

### /account/orders
- [ ] Nueva order aparece en lista
- [ ] Total: $189,000 MXN
- [ ] Status: Confirmado
- [ ] Fecha: Hoy

### /account/orders/[id]
- [ ] Detalle completo visible
- [ ] Producto: Chanel Classic Flap Negro
- [ ] Precio: $189,000 MXN
- [ ] Status: Confirmado - Pagado

---

## 🔁 TEST IDEMPOTENCIA (OPCIONAL)

### Reenviar webhook desde Stripe Dashboard

1. Ir a: **https://dashboard.stripe.com/test/events**
2. Buscar evento `checkout.session.completed` más reciente
3. Click en el evento
4. Click **"Resend webhook"**
5. Confirmar

**Resultado esperado:**
- ✅ Webhook responde 200
- ✅ Sigue habiendo solo 1 order
- ✅ No se duplican order_items
- ✅ Amounts no cambian
- ✅ Product sigue sold/stock 0

---

## 📊 DATOS A REPORTAR

Después de ejecutar `validate-full-balance.mjs`, reportar:

1. ✅ session_id
2. ✅ payment_intent_id
3. ✅ event_id Stripe
4. ✅ HTTP code webhook
5. ✅ PASS/FAIL layaway_payments
6. ✅ PASS/FAIL layaway
7. ✅ PASS/FAIL orders
8. ✅ PASS/FAIL order_items
9. ✅ PASS/FAIL product
10. ✅ PASS/FAIL UI
11. ✅ PASS/FAIL idempotencia (si se probó)

---

**Listo para ejecutar test.**
