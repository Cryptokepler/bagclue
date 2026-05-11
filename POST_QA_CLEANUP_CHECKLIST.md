# POST-QA CLEANUP CHECKLIST

**Ejecutar después de completar QA manual pre-live**

---

## 1. DESPUBLICAR PRODUCTO TEST

```sql
UPDATE products 
SET is_published = false 
WHERE id = '0701ca2e-f575-4ea5-9100-444459516422';
```

O eliminar completamente si no se necesita más.

---

## 2. FIX COPY "LINK DE SEGUIMIENTO"

**Archivo:** Identificar en `/admin/orders/[id]` (probablemente page.tsx o componente relacionado)

**Cambio:**
- **Antes:** "Link de seguimiento del cliente"
- **Después:** "Link público de seguimiento"

**Agregar texto:**
```
"Comparte este link con el cliente para que pueda ver el estado de su pedido sin iniciar sesión."
```

**Propósito:** Aclarar que es tracking público, NO comprobante de envío

---

## 3. VALIDAR NO HAY VIA.PLACEHOLDER.COM EN PRODUCCIÓN

**Check:**
```bash
grep -r "via.placeholder.com" . --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Expected:** Solo producto QA (que será despublicado)

Si hay otros usos, reemplazar con:
- Imagen Supabase storage
- O placeholder interno

---

## 4. LIMPIAR ÓRDENES TEST (OPCIONAL)

**Consultar:**
```sql
SELECT id, customer_name, total, status 
FROM orders 
WHERE customer_name LIKE '%test%' 
   OR customer_email LIKE '%test%'
ORDER BY created_at DESC;
```

**Marcar como test o eliminar si conveniente**

---

## 5. LIMPIAR TRANSACTIONS TEST (OPCIONAL)

**Consultar:**
```sql
SELECT id, amount, status, payment_method 
FROM payment_transactions 
WHERE amount = 20.00  -- Producto QA
ORDER BY created_at DESC;
```

**Marcar como test o eliminar**

---

END OF CHECKLIST
