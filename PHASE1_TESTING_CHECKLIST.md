# Phase 1 - Customer Accounts: Testing Checklist

**Deploy:** https://bagclue.vercel.app  
**Commit:** 1f76f15  
**Fecha:** 2026-04-30

---

## ⚠️ PASO OBLIGATORIO ANTES DE TESTING

**APLICAR MIGRATION 015 EN SUPABASE**

Ver instrucciones completas en: `MIGRATION_015_INSTRUCTIONS.md`

### Forma rápida:
1. Ir a: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql/new
2. Copiar contenido de `supabase/migrations/015_customer_accounts_phase1.sql`
3. Pegar y ejecutar
4. Verificar que no haya errores

**Sin esta migration, el sistema NO funcionará.**

---

## 🎯 Criterios PASS/FAIL (Fase 1)

### Test 1A: Cliente puede entrar con Google (PRIMARY) ✅/❌
**Pasos:**
1. Ir a https://bagclue.vercel.app/account/login
2. Click en botón "Continuar con Google"
3. Seleccionar cuenta Google
4. Autorizar acceso

**Resultado esperado:**
- Redirige a pantalla OAuth de Google
- Después de autorizar → redirige a https://bagclue.vercel.app/account
- Muestra dashboard con mensaje de bienvenida
- Muestra email de Google

**PASS:** ✅ Login con Google exitoso  
**FAIL:** ❌ Error en OAuth o redirect incorrecto

---

### Test 1B: Cliente puede pedir magic link (SECONDARY) ✅/❌
**Pasos:**
1. Ir a https://bagclue.vercel.app/account/login
2. Scroll hasta sección "o usa tu correo"
3. Ingresar un email válido (ej: test@example.com)
4. Click en "Enviar enlace mágico"

**Resultado esperado:**
- Mensaje de éxito: "✉️ Revisa tu correo - te enviamos el enlace de acceso"
- Email recibido con link de acceso

**PASS:** ✅ Email recibido con magic link  
**FAIL:** ❌ Error al enviar o no se recibe email

---

### Test 2: Cliente puede entrar con magic link ✅/❌
**Pasos:**
1. Abrir el magic link del email
2. Verificar redirección

**Resultado esperado:**
- Redirige a https://bagclue.vercel.app/account
- Muestra dashboard con mensaje de bienvenida
- Muestra email del usuario

**PASS:** ✅ Acceso exitoso al dashboard  
**FAIL:** ❌ Error de autenticación o redirect incorrecto

---

### Test 3: Se crea customer_profile ✅/❌
**Pasos:**
1. En Supabase Dashboard → Table Editor
2. Ir a tabla `customer_profiles`
3. Buscar registro con el email usado

**Resultado esperado:**
- Existe registro con:
  - `user_id` (UUID)
  - `email` (en minúsculas)
  - `created_at` (timestamp)

**PASS:** ✅ Perfil creado automáticamente  
**FAIL:** ❌ No existe registro o email no está normalizado

---

### Test 4: /account protegido funciona ✅/❌
**Pasos:**
1. Abrir ventana de incógnito
2. Ir directo a https://bagclue.vercel.app/account (sin login)

**Resultado esperado:**
- Redirige a https://bagclue.vercel.app/account/login
- Muestra formulario de login
- NO muestra dashboard

**PASS:** ✅ Protección funciona correctamente  
**FAIL:** ❌ Permite acceso sin autenticación

---

### Test 5: Logout funciona ✅/❌
**Pasos:**
1. Estando logueado en /account
2. Click en botón "Cerrar sesión"
3. Confirmar en el diálogo

**Resultado esperado:**
- Sesión cerrada
- Redirige a homepage (/)
- Si intenta volver a /account → redirige a /account/login

**PASS:** ✅ Logout exitoso y protección activa  
**FAIL:** ❌ No cierra sesión o permite acceso post-logout

---

### Test 6: Usuario no logueado redirigido ✅/❌
**Pasos:**
1. Ventana de incógnito (sin sesión)
2. Intentar acceder a:
   - https://bagclue.vercel.app/account
   - (cualquier ruta futura bajo /account/*)

**Resultado esperado:**
- Todas las rutas /account/* redirigen a /account/login
- EXCEPTO /account/login (pública)

**PASS:** ✅ Middleware protege correctamente  
**FAIL:** ❌ Permite acceso sin autenticación

---

### Test 7: No duplica perfil en re-login ✅/❌
**Pasos:**
1. Logout de la cuenta
2. Volver a entrar con el mismo método (Google o magic link)
3. Verificar en Supabase → `customer_profiles`

**Resultado esperado:**
- Solo debe existir UN registro para ese email
- No debe crear perfiles duplicados
- El campo `user_id` debe ser el mismo

**PASS:** ✅ No duplica perfil  
**FAIL:** ❌ Crea múltiples perfiles para mismo usuario

---

### Test 8: PASS/FAIL FINAL ✅/❌

**Criterio:**
- ✅ **PASS:** Si tests 1A-7 pasan TODOS
- ❌ **FAIL:** Si CUALQUIERA de los tests falla

---

## 🔍 Verificaciones Adicionales (Opcionales)

### Email normalizado a minúsculas
```sql
-- En Supabase SQL Editor
SELECT email FROM customer_profiles;
```
- Verificar que todos los emails estén en minúsculas

### RLS funciona correctamente
1. Crear 2 usuarios diferentes
2. Usuario A intenta acceder a perfil de Usuario B via API
3. Debe retornar 401/403 (no autorizado)

### Trigger automático funciona
```sql
-- Verificar que el trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 🚫 LO QUE NO ESTÁ INCLUIDO (NO TESTEAR)

- ❌ Historial de pedidos
- ❌ Gestión de apartados
- ❌ Direcciones guardadas
- ❌ Checkout con cuenta
- ❌ Perfil editable
- ❌ Vinculación de pedidos guest

**Estos features son Fase 2+**

---

## 🐛 Bugs Conocidos / Limitaciones

- Ninguno en este momento

---

## 📝 Registro de Testing

**Testeado por:** _______________  
**Fecha:** _______________  
**Resultado:** PASS / FAIL

**Notas:**
```




```

**Issues encontrados:**
```




```
