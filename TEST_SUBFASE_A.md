# TEST SUBFASE A - Validación Manual

## Datos de Test

### 1. Order ID
```
ded47354-96cf-41f5-8f18-8ff06d4698de
```

**Usuario:** jhonatanvenegas@usdtcapital.es

**Cumple criterios:**
- ✅ payment_status = paid
- ✅ shipping_status = pending (NO shipped/delivered)
- ✅ pertenece al usuario

### 2. Address ID
```
5e2ddcf6-c7e7-493c-821b-4444907c7c28
```

**Pertenece a:** jhonatanvenegas@usdtcapital.es

---

## Estado Actual ANTES del Test

### Order (ded47354-96cf-41f5-8f18-8ff06d4698de)
```
shipping_address:   NULL
customer_phone:     +34722385452
shipping_status:    pending
shipping_provider:  NULL
tracking_number:    NULL
tracking_url:       NULL
payment_status:     paid
status:             confirmed
```

### Address (5e2ddcf6-c7e7-493c-821b-4444907c7c28)
```
full_name:          jhonatan venegas
phone_country_code: +34
phone:              722385452
address_line1:      calle molina 60
address_line2:      1a
city:               madrid
state:              madrid
postal_code:        28029
country:            España
```

---

## Snippet DevTools - Ejecutar en https://bagclue.vercel.app/account/orders

```javascript
(async () => {
  // 1. Obtener token (sin imprimirlo)
  const token = localStorage.getItem('sb-orhjnwpbzxyqtyrayvoi-auth-token');
  if (!token) {
    console.error('❌ No hay token en localStorage');
    return;
  }
  
  const authData = JSON.parse(token);
  const accessToken = authData.access_token;
  
  // 2. Datos del test
  const ORDER_ID = 'ded47354-96cf-41f5-8f18-8ff06d4698de';
  const ADDRESS_ID = '5e2ddcf6-c7e7-493c-821b-4444907c7c28';
  
  console.log('🧪 INICIANDO TEST SUBFASE A');
  console.log(`Order ID: ${ORDER_ID}`);
  console.log(`Address ID: ${ADDRESS_ID}`);
  console.log('');
  
  // 3. PATCH request
  const url = `https://bagclue.vercel.app/api/account/orders/${ORDER_ID}/shipping-address`;
  
  console.log('📤 Enviando PATCH...');
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      address_id: ADDRESS_ID
    })
  });
  
  // 4. Resultado
  console.log(`\n📊 Status: ${response.status}`);
  
  const data = await response.json();
  console.log('\n📦 Respuesta:');
  console.log(JSON.stringify(data, null, 2));
  
  if (response.status === 200) {
    console.log('\n✅ PATCH exitoso');
    console.log('\n📋 Validar en DB:');
    console.log('1. shipping_address → debe tener formato multilínea');
    console.log('2. customer_phone → debe estar actualizado');
    console.log('3. shipping_status → NO debe cambiar (sigue "pending")');
    console.log('4. shipping_provider → NO debe cambiar (sigue NULL)');
    console.log('5. tracking_number → NO debe cambiar (sigue NULL)');
    console.log('6. tracking_url → NO debe cambiar (sigue NULL)');
    console.log('7. payment_status → NO debe cambiar (sigue "paid")');
    console.log('8. status → NO debe cambiar (sigue "confirmed")');
  } else {
    console.log('\n❌ PATCH falló');
  }
})();
```

---

## Formato Esperado de shipping_address

Después del PATCH exitoso, `orders.shipping_address` debe quedar:

```
jhonatan venegas
calle molina 60
1a
madrid, madrid, 28029
España
Tel: +34722385452
```

---

## Criterios de Validación

### ✅ PASS si:
1. HTTP 200
2. `orders.shipping_address` → texto multilínea con formato correcto
3. `orders.customer_phone` → actualizado a `+34722385452`
4. `orders.shipping_status` → sigue siendo `pending`
5. `orders.shipping_provider` → sigue siendo `NULL`
6. `orders.tracking_number` → sigue siendo `NULL`
7. `orders.tracking_url` → sigue siendo `NULL`
8. `orders.payment_status` → sigue siendo `paid`
9. `orders.status` → sigue siendo `confirmed`
10. Product/stock NO cambiaron

### ❌ FAIL si:
- HTTP != 200
- shipping_address vacío o mal formateado
- Cualquier campo de tracking/shipping cambia
- payment_status o status cambian
- Product/stock cambian

---

## Verificación DB Post-Test

```javascript
// Ejecutar en DevTools DESPUÉS del PATCH
(async () => {
  const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';
  
  const ORDER_ID = 'ded47354-96cf-41f5-8f18-8ff06d4698de';
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${ORDER_ID}&select=shipping_address,customer_phone,shipping_status,shipping_provider,tracking_number,tracking_url,payment_status,status`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  
  const order = await res.json();
  console.log('📦 Estado DESPUÉS del PATCH:');
  console.log(JSON.stringify(order[0], null, 2));
})();
```

---

## Próximos Pasos

1. **Jhonatan ejecuta el snippet de DevTools** en https://bagclue.vercel.app/account/orders
2. **Verifica HTTP 200** y respuesta del endpoint
3. **Ejecuta verificación DB** para confirmar que solo cambiaron `shipping_address` y `customer_phone`
4. **Confirma PASS/FAIL** de los 10 criterios

Si todo PASS → SUBFASE A CERRADA ✅
Si algún FAIL → reportar error específico para fix
