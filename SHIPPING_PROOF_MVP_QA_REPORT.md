# SHIPPING PROOF MVP - QA REPORT

**Fecha inicio:** 2026-05-12  
**Tester:** Jhonatan  
**Ejecutor:** Kepler  
**Objetivo:** Validar funcionalidad completa de Shipping Proof MVP antes de cierre formal

---

## ESTADO PREVIO

### Deploy actual
- **Commit:** 76b6391 (`fix: quitar shipping_proof_path del SELECT (columna no existe en DB)`)
- **Production:** https://bagclue.vercel.app
- **Status:** READY + PROMOTED ✅
- **Timestamp:** 2026-05-12 00:15:14 UTC

### Componentes implementados
- ✅ Migration 019: 5 columnas shipping proof
- ✅ Bucket: `shipping-proofs` (private)
- ✅ Backend: Storage helper, API endpoints
- ✅ Frontend: ShippingProofSection (upload + replace + view)
- ✅ Frontend: MarcarEnviadoModal (upload al marcar enviado)
- ✅ Tracking page: Bloque comprobante
- ✅ Email template: Link comprobante
- ✅ Endpoint estable: `/api/admin/orders/[orderId]/shipping-proof/download`

### Fix React Error #418
- ✅ Causa raíz: Signed URL dinámica en HTML
- ✅ Solución: Endpoint estable que genera signed URL server-side
- ✅ Validado: Múltiples hard refreshes sin error
- ✅ Confirmado por Jhonatan: "Ver Comprobante" funciona correctamente

---

## TESTS DE VALIDACIÓN

### ⏳ TEST 1 — Upload desde /admin/orders/[id]

**URL de prueba:** https://bagclue.vercel.app/admin/orders/57faad17-94b5-4ec0-a428-320059469335

**Acciones:**
1. Login admin
2. Navegar a orden con status "paid"
3. Marcar como enviada → subir comprobante
4. Validar archivo se sube correctamente
5. Validar botón "Ver Comprobante" aparece
6. Click "Ver Comprobante" → abre archivo

**Validación DB:**
```sql
SELECT id,
       shipping_proof_url,
       shipping_proof_file_name,
       shipping_proof_file_type,
       shipping_proof_file_size,
       shipping_proof_uploaded_at
FROM orders
WHERE id = '57faad17-94b5-4ec0-a428-320059469335';
```

**Esperado:**
- ✅ Upload exitoso
- ✅ Metadata guardada (file_name, file_type, file_size, uploaded_at)
- ✅ "Ver Comprobante" abre archivo
- ✅ Console sin errores

**Resultado:** ⏳ PENDIENTE

---

### ⏳ TEST 2 — Reemplazar comprobante

**URL de prueba:** Misma orden (57faad17...)

**Acciones:**
1. Abrir `<details>` "Reemplazar comprobante"
2. Seleccionar nuevo archivo
3. Click "Guardar nuevo"
4. Validar mensaje de éxito
5. Refrescar página
6. Validar nuevo archivo aparece
7. Click "Ver Comprobante" → abre NUEVO archivo

**Validación DB:**
```sql
-- Verificar que metadata se actualizó
SELECT shipping_proof_file_name,
       shipping_proof_file_size,
       shipping_proof_uploaded_at
FROM orders
WHERE id = '57faad17-94b5-4ec0-a428-320059469335';
```

**Esperado:**
- ✅ Replace exitoso
- ✅ Metadata actualizada
- ✅ "Ver Comprobante" abre nuevo archivo
- ✅ Archivo viejo sobrescrito o reemplazado

**Resultado:** ⏳ PENDIENTE

---

### ⏳ TEST 3 — Tracking page cliente

**Setup:**
1. Obtener `tracking_token` de la orden
2. Abrir `/track/[tracking_token]`

**Acciones:**
1. Validar que aparece bloque "Comprobante de envío"
2. Validar botón "Ver comprobante de envío"
3. Click botón → abre archivo

**Query tracking_token:**
```sql
SELECT tracking_token
FROM orders
WHERE id = '57faad17-94b5-4ec0-a428-320059469335';
```

**URL esperada:** https://bagclue.vercel.app/track/{tracking_token}

**Esperado:**
- ✅ Bloque visible
- ✅ Botón funcional
- ✅ Abre archivo correctamente
- ✅ Sin errores en console

**Resultado:** ⏳ PENDIENTE

---

### ⏳ TEST 4 — Email shipping

**Acciones:**
1. Marcar orden como enviada (si no está)
2. Ingresar tracking number
3. Subir comprobante (si no existe)
4. Confirmar envío
5. Revisar email enviado a cliente

**Validación email:**
- ✅ Subject: "Tu pieza Bagclue va en camino"
- ✅ Incluye tracking number
- ✅ Incluye link "Ver comprobante de envío"
- ✅ Link funciona (abre archivo)

**Endpoint email:**
```
/api/admin/orders/[orderId]/shipping-proof/download
```

**Esperado:**
- ✅ Email enviado correctamente
- ✅ Link comprobante funcional
- ✅ Sin errores

**Resultado:** ⏳ PENDIENTE

---

### ⏳ TEST 5 — Casos negativos

#### 5.1 Archivo inválido
**Acción:** Upload archivo .txt o .exe  
**Esperado:** ❌ Error "Formato no válido. Solo JPG, PNG o PDF."

#### 5.2 Archivo >5MB
**Acción:** Upload archivo 6MB  
**Esperado:** ❌ Error "Archivo demasiado grande. Máximo 5 MB."

#### 5.3 Sin comprobante
**Acción:** Marcar enviado SIN subir comprobante  
**Esperado:**  
- ✅ Marca como enviada exitosamente
- ✅ No bloquea el flujo
- ✅ No aparece bloque comprobante en tracking

#### 5.4 Seguridad logs
**Acción:** Revisar console/network durante upload y view  
**Esperado:**  
- ✅ No signed URL completa en logs
- ✅ No secrets/tokens visibles
- ✅ Solo primeros 8 chars de orderId en logs

**Resultado:** ⏳ PENDIENTE

---

## CRITERIOS DE CIERRE

Para declarar **SHIPPING PROOF MVP: CERRADO ✅**, todos los tests deben pasar:

- [ ] TEST 1: Upload PASS
- [ ] TEST 2: Replace PASS
- [ ] TEST 3: Tracking page PASS
- [ ] TEST 4: Email PASS
- [ ] TEST 5: Negativos PASS
- [ ] Console sin React #418
- [ ] Logs seguros (sin secrets)

---

## PRÓXIMOS PASOS

1. **Ejecutar TEST 1-5** (Jhonatan manual testing)
2. **Reportar resultados** en este documento
3. **Fix si hay issues**
4. **Declarar cierre formal** cuando todos PASS

---

## NOTAS TÉCNICAS

### Migration 020 status
- **Estado:** NO ejecutada en production
- **Motivo:** Endpoint funciona con fallback (parsear desde shipping_proof_url)
- **Decisión:** Postponer hasta post-QA si es necesario
- **Riesgo:** Bajo (fallback es confiable)

### Endpoint estable confirmado
- **URL:** `/api/admin/orders/[orderId]/shipping-proof/download`
- **Método:** GET
- **Auth:** Requiere sesión admin
- **Flujo:** Valida sesión → consulta DB → parsea path desde URL → genera signed URL → redirect
- **Validado:** Jhonatan confirmó funcionamiento ✅

---

**Status general:** ⏳ QA EN PROGRESO  
**Blocker:** Ninguno  
**ETA cierre:** Según ejecución de tests 1-5
