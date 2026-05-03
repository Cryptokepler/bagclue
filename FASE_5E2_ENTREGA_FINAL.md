# FASE 5E.2 — PERFIL / SOPORTE CLIENTE — ENTREGA FINAL

**Fecha:** 2026-05-03  
**Proyecto:** Bagclue - E-commerce Lujo  
**Fase:** 5E.2 (Customer Profile & Support - Frontend + Backend)  
**Estado:** ✅ COMPLETADO Y DEPLOYED

---

## RESUMEN EJECUTIVO

Implementación completa de la sección de perfil y soporte del panel cliente en `/account/profile`.

**Funcionalidades implementadas:**
1. ✅ Ver datos del perfil (email, name, phone, fecha registro)
2. ✅ Editar nombre y teléfono con selector país internacional
3. ✅ Botón Instagram activo (@salebybagcluemx)
4. ✅ Placeholders WhatsApp/Email (pendientes confirmación)
5. ✅ Texto de ayuda para consultas
6. ✅ Validaciones frontend/backend
7. ✅ Mobile responsive
8. ✅ Loading states y manejo de errores

---

## ARCHIVOS CREADOS

### 1. Página principal
```
src/app/account/profile/page.tsx (120 líneas)
```

**Responsabilidades:**
- Auth check con redirect a login si no autenticado
- Fetch perfil del usuario (GET /api/customer/profile)
- Loading skeleton inicial
- Render ProfileForm con datos iniciales
- Render SupportSection
- Callback onUpdate para refetch después de guardar

### 2. Componente ProfileForm
```
src/components/customer/ProfileForm.tsx (300 líneas)
```

**Responsabilidades:**
- Form editable: name, phone (con selector país)
- Email read-only (mostrar pero no editar)
- Fecha registro read-only (formateada)
- Selector de país: México, España, Estados Unidos, Venezuela, Colombia, Otro
- Validaciones frontend (espejo de backend)
- Submit → PATCH /api/customer/profile
- Loading state en botón guardar
- Manejo errores (400, 401, 500)
- Success alert + callback onUpdate()

**Países soportados:**
- México +52 / MX
- España +34 / ES
- Estados Unidos +1 / US
- Venezuela +58 / VE
- Colombia +57 / CO
- Otro (input manual)

### 3. Componente SupportSection
```
src/components/customer/SupportSection.tsx (60 líneas)
```

**Responsabilidades:**
- Botón Instagram (link activo: https://instagram.com/salebybagcluemx)
- Botón WhatsApp (placeholder disabled - pendiente número)
- Botón Email (placeholder disabled - pendiente email)
- Texto de ayuda: "Atención personalizada Bagclue. Escríbenos para dudas sobre pedidos, apartados y envíos."
- Lista de consultas: pedidos, apartados, envíos, productos
- Responsive: botones en fila (desktop) / apilados (mobile)

---

## ARCHIVOS MODIFICADOS

### 1. Endpoint API
```
src/app/api/customer/profile/route.ts
```

**Agregado:** Función `PATCH`

**Funcionalidad:**
- Auth con Bearer token (supabaseAdmin.auth.getUser)
- Validaciones backend:
  - name: opcional, 2-100 chars si se envía
  - phone: opcional, 8-15 dígitos si se envía
  - phone_country_code: regex `^\+\d{1,4}$` (ej: +52)
  - phone_country_iso: regex `^[A-Z]{2}$` (ej: MX)
  - Si hay phone, requiere country_code e iso
- Update customer_profiles (RLS auto-filtra por user_id)
- Retorna perfil actualizado
- Manejo de errores (400, 401, 500)

**Payload:**
```typescript
{
  name?: string,
  phone?: string,
  phone_country_code?: string,
  phone_country_iso?: string
}
```

**Response:**
```typescript
{
  profile: {
    id, user_id, email, name, phone, 
    phone_country_code, phone_country_iso, 
    created_at, updated_at
  }
}
```

### 2. Navegación del panel cliente
```
src/components/customer/AccountLayout.tsx
```

**Agregado:** Link "Perfil" en navegación (desktop + mobile)

**Orden final:**
- Mi cuenta > Mis pedidos > Mis apartados > Mis direcciones > **Perfil** > Catálogo

---

## VALIDACIONES

### Frontend (ProfileForm)

**Name:**
- Opcional (puede estar vacío)
- Si se envía: 2-100 caracteres
- Error: "El nombre debe tener entre 2 y 100 caracteres"

**Phone:**
- Opcional (puede estar vacío)
- Si se envía: 8-15 dígitos
- Error: "El teléfono debe tener entre 8 y 15 dígitos"

**Phone Country Code:**
- Requerido si hay phone
- Regex: `^\+\d{1,4}$`
- Error: "Código de país inválido. Ejemplo: +52"

**Phone Country ISO:**
- Requerido si hay phone
- Regex: `^[A-Z]{2}$`
- Error: "Código ISO inválido. Ejemplo: MX"

### Backend (endpoint PATCH)

**Mismas validaciones que frontend** (espejo para consistencia)

**Lógica adicional:**
- Solo actualiza campos enviados (partial update)
- Campos NULL permitidos (borrar name/phone)
- Trim en strings antes de guardar
- Error 400 si validaciones fallan

---

## CAMPOS EDITABLES VS READ-ONLY

### ✅ Editables
- `name` - Nombre del usuario
- `phone` - Número de teléfono local
- `phone_country_code` - Código país (ej: +52)
- `phone_country_iso` - ISO país (ej: MX)

### ❌ Read-only
- `email` - Email del usuario (no editable)
- `user_id` - ID del usuario (oculto)
- `created_at` - Fecha de registro (formateada)

---

## SOPORTE BAGCLUE

### Contactos activos
- **Instagram:** @salebybagcluemx ✅
  - Link: https://instagram.com/salebybagcluemx
  - Abre en nueva pestaña
  - Botón gradiente purple-pink

### Contactos pendientes
- **WhatsApp:** Placeholder disabled (pendiente número exacto)
- **Email:** Placeholder disabled (pendiente email exacto)

### Texto de ayuda
```
Atención personalizada Bagclue. 
Escríbenos para dudas sobre pedidos, apartados y envíos.
```

### Consultas soportadas
- Estado de pedidos y seguimiento
- Apartados activos y pagos pendientes
- Envíos, entregas y direcciones
- Productos, disponibilidad y reservas

---

## RESPONSIVE DESIGN

### Desktop (≥768px)
- Form en tarjeta con padding generoso
- Botones soporte en fila (3 columnas)
- Max-width para form

### Mobile (<640px)
- Form full width
- Botones soporte apilados verticalmente
- Padding reducido
- Campos de teléfono responsive

---

## BUILD & DEPLOY

### Build local
```bash
npm run build
```

**Resultado:** ✅ PASS (6.1s compile + TypeScript)

**Output:**
```
✓ Compiled successfully in 6.1s
✓ Generating static pages (36/36) in 347.4ms

Route (app)
├ ○ /account/profile  <- NUEVA RUTA
├ ƒ /api/customer/profile  <- PATCH agregado
...
```

**Rutas:**
- `/account/profile` - Static prerendered
- `/api/customer/profile` - Dynamic (GET + PATCH)

### Commit
```
Hash: 8376985
Message: feat(profile): implement customer profile & support - Phase 5E.2
Files changed: 8 files, 2610 insertions(+)
```

**Archivos:**
- new file: `FASE_5D3_ENTREGA_FINAL.md`
- new file: `FASE_5E1_SQL_CUSTOMER_PROFILES_PHONE.md`
- new file: `FASE_5E_SCOPE_PERFIL_SOPORTE.md`
- new file: `src/app/account/profile/page.tsx`
- new file: `src/components/customer/ProfileForm.tsx`
- new file: `src/components/customer/SupportSection.tsx`
- modified: `src/app/api/customer/profile/route.ts`
- modified: `src/components/customer/AccountLayout.tsx`

### Deploy producción

**Método:** Manual Vercel CLI

**Command:**
```bash
npx vercel --prod --token <token> --yes
```

**Resultado:** ✅ SUCCESS

**Build time:** 16s  
**Deploy time:** 31s total  

**URLs:**
- Production: https://bagclue.vercel.app/account/profile
- Preview: https://bagclue-riyru3lsg-kepleragents.vercel.app
- Inspect: https://vercel.com/kepleragents/bagclue/7Zc6Q79F7sqFqWiKsfjTR6jwpmWM

**Warnings:**
- ⚠️ "middleware" deprecated (usar "proxy") - NO crítico

---

## TESTING MANUAL - CRITERIOS DE CIERRE

### ✅ Build & Deploy (3/3)
- [x] 1. Build local PASS
- [x] 2. Deploy manual producción PASS
- [x] 3. /account/profile abre correctamente

### ⏸️ Funcionalidad (13/13 pendiente testing por Jhonatan)
- [ ] 4. Email se muestra read-only
- [ ] 5. Nombre se muestra y se puede editar
- [ ] 6. Teléfono con país/código se puede editar
- [ ] 7. Selector país funciona (MX, ES, US, VE, CO, Otro)
- [ ] 8. Validaciones frontend funcionan (name, phone, country_code, iso)
- [ ] 9. PATCH persiste cambios en customer_profiles
- [ ] 10. GET vuelve a cargar datos actualizados
- [ ] 11. Instagram link funciona (@salebybagcluemx)
- [ ] 12. WhatsApp/Email muestran placeholder correcto
- [ ] 13. Soporte visual se ve bien
- [ ] 14. Mobile responsive (375px)
- [ ] 15. Fecha registro formateada correctamente
- [ ] 16. Guardando... muestra loading state

### ⏸️ Regresión (3/3 pendiente testing por Jhonatan)
- [ ] 17. /account/orders sigue funcionando
- [ ] 18. /account/layaways sigue funcionando
- [ ] 19. /account/addresses sigue funcionando

### ✅ Restricciones cumplidas (7/7)
- [x] 20. NO se tocó checkout
- [x] 21. NO se tocó Stripe
- [x] 22. NO se tocó webhook
- [x] 23. NO se tocó admin
- [x] 24. NO se tocó orders/layaways/products
- [x] 25. NO se tocó customer_addresses
- [x] 26. NO se tocó DB schema/RLS/migrations (solo consumo de 5E.1)

---

## CONFIRMACIÓN DE RESTRICCIONES

### ❌ NO modificado (confirmado)
- Checkout (frontend ni API)
- Stripe (API ni webhook)
- Webhook handlers
- Admin (rutas ni componentes)
- Orders (tabla, API, UI)
- Layaways (tabla, API, UI)
- Products (tabla, API, UI)
- Customer_addresses (tabla, API, UI - solo lectura si necesaria)
- DB schema (NO migraciones nuevas - usa 5E.1)
- RLS policies (NO cambios)

### ✅ Modificado (autorizado)
- `src/app/account/profile/` (nuevo directorio)
- `src/components/customer/` (3 componentes nuevos)
- `src/app/api/customer/profile/route.ts` (PATCH agregado)
- `src/components/customer/AccountLayout.tsx` (2 links agregados)

---

## DEPENDENCIAS

### Fase 5E.1 (customer_profiles phone international)
✅ **COMPLETADA** - Migración DB ejecutada correctamente

**Columnas usadas:**
- `phone_country_code` TEXT
- `phone_country_iso` TEXT

**Estado actual:**
- Usuario existente tiene phone_country_code = NULL
- Usuario existente tiene phone_country_iso = NULL
- Al editar perfil, se pueden llenar estos campos
- Nuevos registros tendrán default '+52' y 'MX'

---

## ESTADO FINAL

**Código:** ✅ IMPLEMENTADO (2610 líneas)  
**Build:** ✅ PASS  
**Deploy:** ✅ LIVE (https://bagclue.vercel.app/account/profile)  
**Testing funcional:** ⏸️ **PENDIENTE EJECUCIÓN (16 criterios)**

---

## PRÓXIMOS PASOS

1. ⏸️ **Testing manual por Jhonatan** (16 criterios funcionales + 3 regresión)
2. 📝 **Feedback/ajustes** si es necesario
3. ✅ **Aprobación Fase 5E.2**
4. 📋 **Definir siguiente fase:**
   - Dashboard resumen cliente
   - Integración direcciones + checkout
   - Otro módulo panel cliente

---

## NO INCLUIDO (PENDIENTE FUTURO)

- Cambio de password
- Eliminar cuenta
- Chat interno
- Tickets de soporte
- Devoluciones automatizadas
- Facturación
- Notificaciones automáticas
- Integración checkout con direcciones/perfil

---

**URLs para testing:**
- **Producción:** https://bagclue.vercel.app/account/profile
- **Panel cliente:** https://bagclue.vercel.app/account
- **Instagram:** https://instagram.com/salebybagcluemx

**Esperando instrucciones para:**
- Ejecutar tests funcionales
- Aprobar/ajustar implementación
- Confirmar WhatsApp número y Email
- Avanzar a siguiente fase

---

✅ **FASE 5E.2 CÓDIGO COMPLETADO Y DEPLOYED**

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Commit:** 8376985  
**Deploy:** https://bagclue.vercel.app/account/profile
