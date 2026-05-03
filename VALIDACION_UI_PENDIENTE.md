# VALIDACIÓN UI PENDIENTE — FASE 5C.3B.4B
**Fecha:** 2026-05-03 10:30 UTC  
**Status:** ⏸️ PENDIENTE VALIDACIÓN VISUAL

---

## 🔍 RUTAS A VALIDAR

### 1. /account/orders
**URL:** https://bagclue.vercel.app/account/orders

**Pasos:**
1. Login con: `jhonatanvenegas@usdtcapital.es`
2. Ir a "Mis Pedidos"
3. Buscar order más reciente

**Validaciones esperadas:**
- [ ] Order aparece en lista
- [ ] Order ID visible (parcial): `ded47354...`
- [ ] Producto: **Chanel Classic Flap Negro**
- [ ] Total: **$189,000 MXN**
- [ ] Status: **Confirmado** o **Pagado**
- [ ] Fecha: **03 May 2026** o **Hoy**
- [ ] Link clickeable a detalle

**Screenshot requerido:** Lista de orders mostrando la nueva order

---

### 2. /account/orders/[id]
**URL:** https://bagclue.vercel.app/account/orders/ded47354-96cf-41f5-8f18-8ff06d4698de

**Pasos:**
1. Desde /account/orders, click en la order
2. O ir directamente a la URL arriba

**Validaciones esperadas:**
- [ ] Página abre correctamente
- [ ] **Producto:**
  - [ ] Brand: **Chanel**
  - [ ] Title: **Chanel Classic Flap Negro**
  - [ ] Model: **Classic Flap 25 Mediana** (si se muestra)
  - [ ] Color: **Negro** (si se muestra)
- [ ] **Precio:**
  - [ ] Unit price: **$189,000 MXN**
  - [ ] Quantity: **1**
  - [ ] Subtotal: **$189,000 MXN**
  - [ ] Total: **$189,000 MXN**
- [ ] **Status:**
  - [ ] Payment status: **Pagado** o badge verde
  - [ ] Order status: **Confirmado**
  - [ ] Shipping status: **Pendiente** (inicial)
- [ ] **Tracking:**
  - [ ] Tracking token visible: `bea312f8...` o
  - [ ] Link "Rastrear pedido" presente
- [ ] **Cliente:**
  - [ ] Nombre: Jhonatan Venegas
  - [ ] Email: jhonatanvenegas@usdtcapital.es

**Screenshot requerido:** Página completa de detalle de order

---

### 3. /track/[tracking_token] (Público)
**URL:** https://bagclue.vercel.app/track/bea312f81909f4d452561e7f4a8a6995

**Pasos:**
1. Abrir en **navegador de incógnito** (sin login)
2. Ir a URL directamente

**Validaciones esperadas:**
- [ ] Página abre **SIN login requerido** ✅
- [ ] **Order visible:**
  - [ ] Order ID (parcial): `ded47354...` o número de orden
  - [ ] Fecha: 03 May 2026
- [ ] **Cliente:**
  - [ ] Nombre: Jhonatan Venegas (o parcial)
  - [ ] Email: jhonatanve... (parcial/censurado)
- [ ] **Producto:**
  - [ ] Chanel Classic Flap Negro
  - [ ] Imagen del producto (si existe)
- [ ] **Precio:**
  - [ ] Total: $189,000 MXN
- [ ] **Status de envío:**
  - [ ] "Pendiente" o "Orden confirmada" (inicial)
  - [ ] Timeline de estados (preparación, envío, entrega)
- [ ] **Diseño:**
  - [ ] Página pública profesional
  - [ ] No muestra información sensible completa

**Screenshot requerido:** Página pública de tracking (incógnito)

---

## 📊 DATOS STRIPE PENDIENTES

### Event ID y HTTP Response

**Pasos para obtener:**

1. **Ir a Stripe Dashboard:**
   - https://dashboard.stripe.com/test/events
   - Login con cuenta Stripe de Bagclue

2. **Buscar evento:**
   - Filtrar por tipo: `checkout.session.completed`
   - Buscar por session_id: `cs_test_a1VX6NDjh1N1nIyqTeB8JoAhfBnZTmAQSxd7DHJFXqUXfZmVFjUfHRWZ3o`
   - O buscar por fecha: 03 May 2026, ~10:20 UTC
   - O buscar por amount: 84000 centavos (840.00 MXN)

3. **Obtener Event ID:**
   - Click en el evento
   - Copiar Event ID (formato: `evt_...`)

4. **Obtener HTTP Response del Webhook:**
   - En el mismo evento, scroll hasta sección "Webhooks"
   - Buscar endpoint: `/api/stripe/webhook`
   - Ver HTTP response code (esperado: **200**)
   - Copiar detalles:
     - Response code
     - Response body (si disponible)
     - Delivery timestamp
     - Retry attempts (si los hubo)

5. **Screenshot requerido:**
   - Evento completo mostrando Event ID
   - Sección de webhook delivery mostrando HTTP 200

---

## 📋 CHECKLIST VALIDACIÓN

### Rutas UI
- [ ] /account/orders → Order aparece ✅
- [ ] /account/orders/[id] → Detalle completo ✅
- [ ] /track/[token] → Tracking público sin login ✅

### Datos Stripe
- [ ] Event ID obtenido: `evt_...`
- [ ] HTTP response webhook: `200`
- [ ] Delivery timestamp confirmado

### Screenshots
- [ ] Lista de orders
- [ ] Detalle de order
- [ ] Tracking público (incógnito)
- [ ] Stripe event + webhook delivery

---

## 🎯 CUANDO COMPLETAR

**Una vez validado todo:**
1. Reportar resultados a Kepler
2. Confirmar PASS/FAIL de cada ruta
3. Proporcionar Event ID y HTTP code
4. Compartir screenshots (opcional)

**ENTONCES:**
```
FASE 5C.3B.4B — WEBHOOK SALDO COMPLETO ATÓMICO: CERRADA ✅
```

---

**Documento generado:** 2026-05-03 10:30 UTC  
**Autor:** Kepler  
**Status:** ⏸️ ESPERANDO VALIDACIÓN JHONATAN
