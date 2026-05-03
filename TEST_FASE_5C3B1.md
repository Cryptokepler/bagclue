# TEST FASE 5C.3B.1 - PAY INSTALLMENT ENDPOINT

**Fecha:** 2026-05-02  
**Deploy:** https://bagclue.vercel.app  
**Commit:** b07a76f

---

## OBTENER BEARER TOKEN (MANUAL)

**Pasos para obtener token:**

1. Abrir https://bagclue.vercel.app/account/login
2. Login con: `jhonatanvenegas@usdtcapital.es`
3. Abrir DevTools (F12)
4. Application → Local Storage → https://bagclue.vercel.app
5. Buscar clave que contenga `supabase.auth.token`
6. Copiar el valor del `access_token`

**Formato esperado:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50...
```

---

## TEST 1: Usuario Correcto

### Comando curl

```bash
LAYAWAY_ID="aaaaaaaa-bbbb-cccc-dddd-000000000001"
BEARER_TOKEN="<TOKEN_AQUI>"

curl -X POST \
  -H "Authorization: Bearer ${BEARER_TOKEN}" \
  -H "Content-Type: application/json" \
  -v \
  https://bagclue.vercel.app/api/layaways/${LAYAWAY_ID}/pay-installment
```

### Response esperada (200)

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "payment_id": "uuid",
  "payment_number": 3,
  "amount_due": 21000.00,
  "due_date": "2026-05-13T00:00:00Z",
  "currency": "MXN",
  "expires_at": "2026-05-02T12:30:00Z",
  "message": "Payment session created successfully"
}
```

### Validaciones

- ✅ Status code: 200
- ✅ checkout_url empieza con `https://checkout.stripe.com`
- ✅ payment_number = 3
- ✅ amount_due = 21000.00
- ✅ currency = "MXN"

---

## TEST 2: Sin Token (401)

### Comando curl

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -v \
  https://bagclue.vercel.app/api/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001/pay-installment
```

### Response esperada (401)

```json
{
  "error": "Unauthorized - Authentication required"
}
```

---

## TEST 3: Token Inválido (401)

### Comando curl

```bash
curl -X POST \
  -H "Authorization: Bearer INVALID_TOKEN_XXX" \
  -H "Content-Type: application/json" \
  -v \
  https://bagclue.vercel.app/api/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001/pay-installment
```

### Response esperada (401)

```json
{
  "error": "Unauthorized - Invalid token"
}
```

---

## TEST 4: Usuario Ajeno (403)

**PENDIENTE** - Requiere crear segundo usuario de prueba.

Comando esperado:
```bash
curl -X POST \
  -H "Authorization: Bearer ${OTHER_USER_TOKEN}" \
  -v \
  https://bagclue.vercel.app/api/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001/pay-installment
```

Response esperada (403):
```json
{
  "error": "Forbidden - You do not own this layaway"
}
```

---

## VALIDACIONES EN SUPABASE

### Query 1: Verificar layaway_payment #3

```sql
SELECT 
  id,
  payment_number,
  amount_due,
  amount_paid,
  status,
  stripe_session_id,
  paid_at,
  created_at,
  updated_at
FROM layaway_payments
WHERE layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  AND payment_number = 3;
```

**Validaciones:**
- ✅ stripe_session_id IS NOT NULL (debe tener valor cs_...)
- ✅ status = 'pending' (NO cambió a paid)
- ✅ amount_paid IS NULL (o 0 según schema)
- ✅ paid_at IS NULL

---

### Query 2: Verificar layaway no cambió

```sql
SELECT 
  id,
  status,
  total_amount,
  amount_paid,
  amount_remaining,
  payments_completed,
  payments_remaining,
  next_payment_due_date,
  next_payment_amount,
  last_payment_at
FROM layaways
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
```

**Validaciones:**
- ✅ status = 'active' (NO cambió)
- ✅ total_amount = 189000
- ✅ amount_paid = 63000 (NO cambió)
- ✅ amount_remaining = 126000 (NO cambió)
- ✅ payments_completed = 2 (NO cambió)
- ✅ payments_remaining = 6 (NO cambió)

---

### Query 3: Verificar no se creó orden

```sql
SELECT COUNT(*) as total_orders
FROM orders
WHERE layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
```

**Validación:**
- ✅ total_orders = 0 (no se creó orden)

---

### Query 4: Verificar producto no cambió

```sql
SELECT 
  id,
  status,
  stock
FROM products
WHERE id = '9ed1749d-b82b-4ac5-865e-f2f332c439c3';
```

**Validaciones:**
- ✅ status = 'available' o 'reserved' (NO cambió a sold)
- ✅ stock = valor anterior (NO cambió)

---

## IMPORTANTE: NO COMPLETAR PAGO

⚠️ **NO ABRIR checkout_url en navegador**  
⚠️ **NO COMPLETAR PAGO en Stripe**  
⚠️ **Solo verificar que la URL existe y es válida**

El pago se completará en fase posterior con webhook implementado.

---

**FIN DE TEST PLAN**
