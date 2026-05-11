# SHIPPING PROOF MVP — QA MANUAL REPORT
**Fecha:** 2026-05-11  
**Ejecutor:** Jhonatan  
**Asistente:** Kepler  
**Entorno:** Production (bagclue.vercel.app)  

---

## ⚙️ PRE-QA SETUP

### Órdenes disponibles para testing:
```
ORDER 1: 57faad17-94b5-4ec0-a428-320059469335
  Status: confirmed
  Payment: paid
  Total: $20 MXN
  Tracking token: 9a888a29615a94b9f9ac468220b2a7a2
  Proof: null (perfecto para test)

ORDER 2: 8b028ac7-424d-487d-9d6d-ab5079cd57a0
  Status: confirmed
  Payment: paid
  Total: $20 MXN
  Tracking token: 631fc56e0af0c0cd8527f181bf9f1985
  Proof: null

ORDER 3: 5ce4fbbe-9f33-48b0-b7f7-39fc5039970f
  Status: confirmed
  Payment: paid
  Total: $20 MXN
  Tracking token: e603295a184a4137b324a90c9816d4c0
  Proof: null
```

### URLs:
- Admin login: https://bagclue.vercel.app/admin/login
- Admin orders: https://bagclue.vercel.app/admin/orders/57faad17-94b5-4ec0-a428-320059469335
- Admin envios: https://bagclue.vercel.app/admin/envios
- Tracking page: https://bagclue.vercel.app/track/9a888a29615a94b9f9ac468220b2a7a2

### Archivos de prueba recomendados:
- JPG: Imagen menor a 5MB (ej: screenshot, foto de guía DHL)
- PDF: Documento menor a 5MB (ej: PDF de guía de envío)
- INVÁLIDO: Archivo .txt o .docx (para test negativo)
- GRANDE: Archivo >5MB (para test negativo)

---

## 🧪 TEST 1 — UPLOAD COMPROBANTE DESDE /admin/orders/[id]

**Objetivo:** Validar upload directo desde order detail page

### Pasos manuales (UI):
1. [ ] Ir a: https://bagclue.vercel.app/admin/orders/57faad17-94b5-4ec0-a428-320059469335
2. [ ] Scroll a sección "Comprobante de envío"
3. [ ] Verificar que aparece texto: "Sin comprobante cargado"
4. [ ] Verificar que aparece CTA: "Subir comprobante de envío"
5. [ ] Click en "Subir comprobante de envío"
6. [ ] Seleccionar archivo JPG o PDF (<5MB)
7. [ ] Verificar que aparece nombre del archivo
8. [ ] Verificar que aparece tamaño del archivo
9. [ ] Click en "Guardar comprobante"
10. [ ] Esperar confirmación "Comprobante subido correctamente"
11. [ ] Página debe refrescar automáticamente
12. [ ] Verificar que aparece botón "Ver comprobante"
13. [ ] Click en "Ver comprobante"
14. [ ] Archivo debe abrir en nueva pestaña

### Validación DB (ejecutar después del paso 11):
```bash
curl -s 'https://orhjnwpbzxyqtyrayvoi.supabase.co/rest/v1/orders?select=id,shipping_proof_url,shipping_proof_file_name,shipping_proof_file_type,shipping_proof_file_size,shipping_proof_uploaded_at&id=eq.57faad17-94b5-4ec0-a428-320059469335' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA" | python3 -m json.tool
```

**Expected result:**
```json
{
  "shipping_proof_url": "https://...supabase.co/storage/v1/object/sign/shipping-proofs/...",
  "shipping_proof_file_name": "nombre_archivo.jpg",
  "shipping_proof_file_type": "image/jpeg",
  "shipping_proof_file_size": 123456,
  "shipping_proof_uploaded_at": "2026-05-11T20:XX:XX"
}
```

### Resultado:
- [ ] PASS / [ ] FAIL
- **Order ID (parcial):** 57faad17...9335
- **Proof file name:** _______________
- **Proof file size:** _______________
- **Link abre:** [ ] SÍ / [ ] NO
- **Bugs encontrados:** _______________

---

## 🧪 TEST 2 — MARCAR ENVIADO CON COMPROBANTE DESDE /admin/envios

**Objetivo:** Validar modal "Marcar como enviado" con upload de comprobante

### Pasos manuales (UI):
1. [ ] Usar ORDER 2: 8b028ac7-424d-487d-9d6d-ab5079cd57a0
2. [ ] Ir a: https://bagclue.vercel.app/admin/envios
3. [ ] Localizar orden 8b028ac7...
4. [ ] Click en "Marcar como enviado" (si existe botón)
5. [ ] Llenar campos:
   - Paquetería: DHL
   - Tracking: TEST123456789
   - URL tracking: (dejar vacío para auto-generar)
6. [ ] Verificar que aparece campo "Comprobante / guía de envío (opcional)"
7. [ ] Seleccionar archivo PDF (<5MB)
8. [ ] Verificar que aparece nombre del archivo
9. [ ] Click en "Confirmar envío"
10. [ ] Esperar confirmación
11. [ ] Modal debe cerrar
12. [ ] Tabla debe refrescar

### Validación DB (ejecutar después del paso 12):
```bash
curl -s 'https://orhjnwpbzxyqtyrayvoi.supabase.co/rest/v1/orders?select=id,shipping_status,tracking_number,shipping_provider,shipping_proof_url,shipping_proof_file_name&id=eq.8b028ac7-424d-487d-9d6d-ab5079cd57a0' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA" | python3 -m json.tool
```

**Expected result:**
```json
{
  "shipping_status": "shipped",
  "tracking_number": "TEST123456789",
  "shipping_provider": "dhl",
  "shipping_proof_url": "https://...supabase.co/storage/v1/object/sign/...",
  "shipping_proof_file_name": "guia.pdf"
}
```

### Resultado:
- [ ] PASS / [ ] FAIL
- **Order ID (parcial):** 8b028ac7...57a0
- **Tracking number:** _______________
- **Proof guardado:** [ ] SÍ / [ ] NO
- **Email enviado:** [ ] SÍ / [ ] NO
- **Bugs encontrados:** _______________

---

## 🧪 TEST 3 — EMAIL TRACKING

**Objetivo:** Validar que email incluye comprobante si existe

### Pasos manuales:
1. [ ] Revisar inbox del email de la orden (customer_email)
2. [ ] Buscar email "Tu pieza Bagclue va en camino"
3. [ ] Verificar contenido:
   - [ ] Tracking number visible
   - [ ] Link "Rastrear Paquete en DHL" (si trackingUrl existe)
   - [ ] Link "Ver Estado del Pedido" (tracking Bagclue)
   - [ ] Bloque "Comprobante de envío disponible" (si proof existe)
   - [ ] Botón "Ver Comprobante de Envío" (si proof existe)
4. [ ] Click en "Ver Comprobante de Envío"
5. [ ] Archivo debe abrir en nueva pestaña

### Resultado:
- [ ] PASS / [ ] FAIL
- **Email recibido:** [ ] SÍ / [ ] NO
- **Tracking number visible:** [ ] SÍ / [ ] NO
- **CTA comprobante visible:** [ ] SÍ / [ ] NO
- **Link comprobante abre:** [ ] SÍ / [ ] NO
- **Bugs encontrados:** _______________

---

## 🧪 TEST 4 — TRACKING PAGE CLIENTE

**Objetivo:** Validar que tracking page muestra comprobante

### Pasos manuales (UI):
1. [ ] Ir a: https://bagclue.vercel.app/track/631fc56e0af0c0cd8527f181bf9f1985
2. [ ] Verificar que aparece estado "Enviado" o "En Tránsito"
3. [ ] Verificar que aparece tracking number
4. [ ] Verificar que aparece paquetería (DHL)
5. [ ] Scroll hasta encontrar sección "Comprobante de Envío" (si proof existe)
6. [ ] Verificar que aparece texto: "Puedes consultar la guía o comprobante asociado a tu envío"
7. [ ] Verificar que aparece botón "Ver Comprobante de Envío"
8. [ ] Click en botón
9. [ ] Archivo debe abrir en nueva pestaña

### Validación API tracking:
```bash
curl -s 'https://bagclue.vercel.app/api/orders/track/631fc56e0af0c0cd8527f181bf9f1985' | python3 -m json.tool | grep -A 2 "shipping_proof"
```

**Expected result:**
```json
"shipping_proof_url": "https://...supabase.co/storage/v1/object/sign/...",
"shipping_proof_file_name": "archivo.pdf"
```

### Resultado:
- [ ] PASS / [ ] FAIL
- **Tracking token (parcial):** 631fc56e...1985
- **Estado enviado visible:** [ ] SÍ / [ ] NO
- **Bloque comprobante visible:** [ ] SÍ / [ ] NO
- **Link abre:** [ ] SÍ / [ ] NO
- **Bugs encontrados:** _______________

---

## 🧪 TEST 5 — VALIDACIONES NEGATIVAS

**Objetivo:** Validar que las validaciones funcionan correctamente

### Test 5A: Archivo inválido (.txt)
1. [ ] Ir a /admin/orders/5ce4fbbe-9f33-48b0-b7f7-39fc5039970f
2. [ ] Intentar subir archivo .txt
3. [ ] Verificar mensaje de error: "Formato no válido. Solo JPG, PNG o PDF."
4. [ ] Verificar que botón "Guardar" está deshabilitado o no sube

**Resultado 5A:**
- [ ] PASS / [ ] FAIL
- **Error claro:** [ ] SÍ / [ ] NO

### Test 5B: Archivo >5MB
1. [ ] Intentar subir archivo de 7MB
2. [ ] Verificar mensaje de error: "Archivo demasiado grande. Máximo 5 MB."
3. [ ] Verificar que botón "Guardar" está deshabilitado o no sube

**Resultado 5B:**
- [ ] PASS / [ ] FAIL
- **Error claro:** [ ] SÍ / [ ] NO

### Test 5C: Shipping sin comprobante (flujo normal)
1. [ ] Marcar orden como enviado SIN subir comprobante
2. [ ] Verificar que funciona normalmente
3. [ ] Email NO debe incluir bloque de comprobante
4. [ ] Tracking page NO debe mostrar sección comprobante

**Resultado 5C:**
- [ ] PASS / [ ] FAIL
- **Funciona sin proof:** [ ] SÍ / [ ] NO

### Test 5D: Seguridad en logs
1. [ ] Abrir DevTools → Console
2. [ ] Realizar upload de comprobante
3. [ ] Verificar que NO aparece en logs:
   - [ ] Signed URL completa (solo path truncado OK)
   - [ ] tracking_token completo (solo primeros 8 chars OK)
   - [ ] SUPABASE_SERVICE_ROLE_KEY
   - [ ] Secrets/passwords

**Resultado 5D:**
- [ ] PASS / [ ] FAIL
- **Secrets expuestos:** [ ] SÍ / [ ] NO

### Test 5E: Consola sin errores críticos
1. [ ] Navegar por todas las páginas admin (/envios, /orders/[id])
2. [ ] Verificar que NO aparece:
   - [ ] "supabaseKey is required"
   - [ ] Uncaught errors
   - [ ] Failed to fetch (críticos)
   - [ ] CORS errors

**Resultado 5E:**
- [ ] PASS / [ ] FAIL
- **Errores críticos:** [ ] SÍ / [ ] NO

---

## 📊 RESUMEN FINAL

### Tests ejecutados:
- [ ] TEST 1 - Upload desde order detail
- [ ] TEST 2 - Marcar enviado con comprobante
- [ ] TEST 3 - Email tracking
- [ ] TEST 4 - Tracking page cliente
- [ ] TEST 5 - Validaciones negativas

### Resultado global:
- **PASS:** ___ / 5
- **FAIL:** ___ / 5

### Bugs críticos encontrados:
1. _______________
2. _______________
3. _______________

### Bugs menores encontrados:
1. _______________
2. _______________

### Áreas validadas:
- [ ] DB migration aplicada correctamente
- [ ] Bucket privado funciona
- [ ] Upload server-side funciona
- [ ] Signed URLs funcionan (no expiran prematuramente)
- [ ] Email incluye comprobante correctamente
- [ ] Tracking page muestra comprobante
- [ ] Validaciones frontend funcionan
- [ ] Validaciones backend funcionan
- [ ] No secrets en logs
- [ ] Consola limpia

---

## ✅ DECISIÓN FINAL

### SHIPPING PROOF MVP:
- [ ] **CERRADO ✅** (todos los tests PASS, ready for production)
- [ ] **NO CERRADO ❌** (bugs críticos encontrados, requiere fix)

### Notas adicionales:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

**Firma digital:** Jhonatan  
**Fecha de cierre:** _____________  
**Asistente:** Kepler  

---

**END OF QA REPORT**
