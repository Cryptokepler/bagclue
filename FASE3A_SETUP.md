# Fase 3A Setup - Carrito + Stripe Checkout (Test Mode)

**Fecha:** 2026-04-28  
**Responsable:** Kepler  
**Status:** ⚠️ PENDIENTE CONFIGURACIÓN

---

## ⚠️ IMPORTANTE: NO DEPLOYAR TODAVÍA

Esta fase requiere configuración manual de Stripe antes de deploy.

---

## 📋 PASOS PRE-DEPLOY (OBLIGATORIOS)

### 1. Ejecutar migración SQL en Supabase

Ve a Supabase Dashboard → SQL Editor → Ejecuta:

```sql
-- Agregar columna stock a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 1;

-- Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Actualizar productos existentes (por defecto stock=1)
UPDATE products SET stock = 1 WHERE stock IS NULL;
```

**Verifica:** Todos los productos deben tener `stock = 1`

---

### 2. Crear cuenta Stripe (Test Mode)

1. Ir a https://dashboard.stripe.com
2. Crear cuenta o login
3. **Asegurarse de estar en "Test Mode"** (toggle arriba a la derecha)

---

### 3. Obtener claves de API Stripe

**En Stripe Dashboard (Test Mode):**
1. Ir a **Developers** → **API Keys**
2. Copiar:
   - **Publishable key** (empieza con `pk_test_`)
   - **Secret key** (empieza con `sk_test_`)

---

### 4. Configurar Webhook Stripe

**En Stripe Dashboard (Test Mode):**
1. Ir a **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://bagclue.vercel.app/api/stripe/webhook`
   - (o `http://localhost:3000/api/stripe/webhook` para testing local)
4. **Events to listen:**
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Click **Add endpoint**
6. Copiar el **Signing secret** (empieza con `whsec_`)

---

### 5. Configurar variables de entorno

**Archivo `.env.local` (local):**
```env
# Stripe Test Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Base URL (cambiar en producción)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Vercel Environment Variables (producción):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (public)
STRIPE_SECRET_KEY (secret, encrypted)
STRIPE_WEBHOOK_SECRET (secret, encrypted)
NEXT_PUBLIC_BASE_URL=https://bagclue.vercel.app
```

Agregar con:
```bash
cd bagclue
echo "pk_test_..." | npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --yes
echo "sk_test_..." | npx vercel env add STRIPE_SECRET_KEY production --yes
echo "whsec_..." | npx vercel env add STRIPE_WEBHOOK_SECRET production --yes
echo "https://bagclue.vercel.app" | npx vercel env add NEXT_PUBLIC_BASE_URL production --yes
```

---

## 🧪 VALIDACIÓN LOCAL (Test Mode)

### 1. Setup local

```bash
cd /home/node/.openclaw/workspace/bagclue

# Instalar dependencias (ya hecho)
npm install

# Configurar .env.local con claves Stripe

# Ejecutar dev
npm run dev
```

### 2. Test flow completo

**Test 1: Agregar al carrito**
1. Ir a http://localhost:3000/catalogo
2. Click en producto available
3. Click "Agregar al Carrito"
4. Verificar icono de carrito muestra "1"

**Test 2: Ver carrito**
1. Click icono carrito (navbar)
2. Ver producto listado
3. Ver total correcto

**Test 3: Crear checkout**
1. En /cart, llenar nombre + email
2. Click "Pagar Ahora"
3. Debe redirigir a Stripe Checkout
4. **Verificar en Supabase:**
   - Orden creada con `status=pending`, `payment_status=pending`
   - Producto marcado como `status=reserved`

**Test 4: Pagar con tarjeta test**
1. En Stripe Checkout, usar tarjeta test:
   - **Success:** `4242 4242 4242 4242`
   - Exp: `12/34`
   - CVC: `123`
2. Click "Pay"
3. Debe redirigir a /checkout/success
4. **Verificar en Supabase:**
   - Orden: `status=confirmed`, `payment_status=paid`
   - Producto: `status=sold`, `stock=0`

**Test 5: Producto sold no se puede comprar**
1. Ir a catálogo
2. Ver mismo producto ahora muestra "Vendido"
3. Botón deshabilitado

**Test 6: Sesión expirada**
1. Crear otro checkout
2. NO pagar (dejar 30 min)
3. Esperar a que expire
4. **Verificar en Supabase:**
   - Orden: `status=cancelled`, `payment_status=failed`
   - Producto: `status=available` (liberado)

---

## 🔍 TESTING WEBHOOK LOCAL

Para testing local del webhook, usar Stripe CLI:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 📊 ADMIN: Ver órdenes

1. Login en `/admin`
2. Click "Ver Órdenes"
3. Ver lista de órdenes con:
   - Cliente
   - Productos
   - Total
   - Estado (pending/confirmed/cancelled)
   - Pago (pending/paid/failed)

---

## ⚠️ REGLAS DE NEGOCIO IMPLEMENTADAS

### Productos comprables:
- ✅ `is_published = true`
- ✅ `status = 'available'`
- ✅ `stock > 0`
- ✅ `price != null`

### Productos NO comprables:
- ❌ `status = 'reserved'` → "Reservado"
- ❌ `status = 'sold'` → "Vendido"
- ❌ `status = 'hidden'` → "No disponible"
- ❌ `status = 'preorder'` → "Pre-venta (próximamente)"
- ❌ `stock = 0` → Sin stock
- ❌ `price = null` → "Consultar precio"

### Prevención de doble venta:
1. Al crear checkout → producto `reserved` inmediatamente
2. Si pago exitoso → producto `sold`
3. Si sesión expira → producto vuelve `available`

---

## 🚀 DEPLOY A PRODUCCIÓN (DESPUÉS DE VALIDAR)

**Solo después de validar test mode completamente:**

```bash
cd /home/node/.openclaw/workspace/bagclue

# Commitear cambios
git add -A
git commit -m "feat: Fase 3A - Carrito + Stripe Checkout (test mode)"
git push origin main

# Deploy a Vercel
npx vercel --prod
```

**Webhook en producción:**
- Crear nuevo endpoint en Stripe con URL: `https://bagclue.vercel.app/api/stripe/webhook`
- Usar nuevo signing secret en Vercel env vars

---

## 📝 TARJETAS DE PRUEBA STRIPE

**Pagos exitosos:**
- `4242 4242 4242 4242` (Visa)
- `5555 5555 5555 4444` (Mastercard)

**Pago declinado:**
- `4000 0000 0000 0002`

**Requiere autenticación 3D:**
- `4000 0025 0000 3155`

**Exp siempre:** `12/34`  
**CVC siempre:** `123`

---

## ✅ CHECKLIST VALIDACIÓN

- [ ] Migración SQL ejecutada
- [ ] Stripe test account creado
- [ ] API keys copiadas
- [ ] Webhook configurado
- [ ] Env vars configuradas
- [ ] Dev server corriendo
- [ ] Producto se agrega a carrito
- [ ] Checkout redirige a Stripe
- [ ] Producto queda reserved
- [ ] Pago test exitoso
- [ ] Webhook recibido
- [ ] Orden marcada paid
- [ ] Producto marcado sold
- [ ] Producto sold no se puede comprar
- [ ] Admin muestra orden
- [ ] Sesión expirada libera producto

---

## 🔐 SEGURIDAD

- ✅ Webhook firma verificada
- ✅ Solo test keys por ahora
- ✅ Productos reservados durante checkout
- ✅ RLS activo (solo available visibles públicamente)
- ✅ Admin protegido con autenticación

---

## 📄 ARCHIVOS NUEVOS/MODIFICADOS

**Nuevos:**
- `src/contexts/CartContext.tsx`
- `src/components/ClientProviders.tsx`
- `src/components/AddToCartButton.tsx`
- `src/components/CartIcon.tsx`
- `src/app/cart/page.tsx`
- `src/app/checkout/success/page.tsx`
- `src/app/checkout/cancel/page.tsx`
- `src/app/api/checkout/create-session/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/admin/orders/page.tsx`
- `migrations/add_stock_to_products.sql`

**Modificados:**
- `src/app/layout.tsx` (ClientProviders)
- `src/components/Navbar.tsx` (CartIcon)
- `src/app/admin/page.tsx` (botón Ver Órdenes)
- `.env.local` (Stripe keys)
- `package.json` (stripe dependencies)

---

## 🎯 PRÓXIMO PASO

**Después de validar Fase 3A exitosamente:**
- Migrar a Stripe Live Mode (claves productivas)
- Configurar emails automáticos (opcional)
- Agregar inventario real
- Stripe Webhook en producción

---

**Implementado por:** Kepler  
**Fecha:** 2026-04-28 21:45 UTC  
**Build:** ✅ Exitoso (21 rutas)  
**Deploy:** ⚠️ PENDIENTE (requiere setup Stripe)
