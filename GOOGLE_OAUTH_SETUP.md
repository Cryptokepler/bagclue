# Google OAuth Setup - Bagclue Customer Accounts

**Fecha:** 2026-04-30  
**Propósito:** Habilitar "Continuar con Google" en /account/login

---

## 🔧 Paso 1: Crear OAuth Client en Google Cloud Console

### 1.1 Ir a Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 1.2 Crear OAuth Client ID
1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. **Application type:** Web application
3. **Name:** `Bagclue Customer Auth`

### 1.3 Configurar Authorized Origins
Agregar estos 2 orígenes:
```
https://bagclue.vercel.app
https://orhjnwpbzxyqtyrayvoi.supabase.co
```

### 1.4 Configurar Redirect URIs
Agregar este URI:
```
https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback
```

### 1.5 Guardar credenciales
- **Client ID:** (copiar)
- **Client Secret:** (copiar)

---

## 🔐 Paso 2: Configurar Google Provider en Supabase

### 2.1 Ir a Supabase Auth Providers
https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/auth/providers

### 2.2 Habilitar Google Provider
1. Buscar **"Google"** en la lista
2. Click para expandir
3. Toggle **"Enable Sign in with Google"** → ON

### 2.3 Pegar credenciales
- **Client ID (for OAuth):** (pegar el Client ID de Google)
- **Client Secret (for OAuth):** (pegar el Client Secret de Google)

### 2.4 Configurar Redirect URL
Ya está configurado por defecto:
```
https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback
```

### 2.5 Save Configuration
Click **"Save"**

---

## ✅ Paso 3: Verificación

### 3.1 Verificar en Google Cloud Console
- Ir a Credentials
- Ver OAuth 2.0 Client IDs
- Confirmar que "Bagclue Customer Auth" existe
- Verificar que tiene las URIs correctas

### 3.2 Verificar en Supabase
- Ir a Auth → Providers
- Google debe mostrar **"Enabled"** con ícono verde

---

## 🧪 Paso 4: Testing Post-Deploy

Una vez deployado el código:

1. **Ir a:** https://bagclue.vercel.app/account/login
2. **Verificar que aparece:** Botón "Continuar con Google" con logo
3. **Click en botón:** Debe redirigir a pantalla de Google OAuth
4. **Seleccionar cuenta:** Autorizar acceso
5. **Verificar redirect:** Debe volver a https://bagclue.vercel.app/account
6. **Verificar perfil creado:**
   - En Supabase → Table Editor → `customer_profiles`
   - Debe existir registro con email en minúsculas
7. **Logout:** Click "Cerrar sesión" → debe funcionar
8. **Re-login:** Volver a entrar con Google → NO debe duplicar perfil

---

## 📋 Checklist de Configuración

- [ ] OAuth Client creado en Google Cloud Console
- [ ] Authorized Origins configurados (2 URLs)
- [ ] Redirect URI configurado
- [ ] Client ID copiado
- [ ] Client Secret copiado
- [ ] Google Provider habilitado en Supabase
- [ ] Client ID pegado en Supabase
- [ ] Client Secret pegado en Supabase
- [ ] Save en Supabase
- [ ] Deploy del código completado
- [ ] Test exitoso de login con Google
- [ ] Verificado que customer_profile se crea
- [ ] Verificado que no duplica en segundo login

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Verificar que la redirect URI en Google Console sea EXACTAMENTE:
  `https://orhjnwpbzxyqtyrayvoi.supabase.co/auth/v1/callback`
- No debe tener espacios ni slash extra al final

### Error: "unauthorized_client"
- Verificar que el Client ID/Secret estén correctamente copiados
- No debe haber espacios extra al inicio/final

### Login funciona pero no se crea customer_profile
- Verificar que la migration 015 esté aplicada
- Verificar que el trigger `on_auth_user_created` exista
- Ver logs en Supabase → Database → Functions

### Login funciona pero duplica perfiles
- Verificar constraint UNIQUE en `customer_profiles.user_id`
- Revisar si hay múltiples usuarios de auth.users para mismo email

---

## 🔒 Seguridad

### ✅ Implementado:
- Client Secret solo en servidor (Supabase)
- HTTPS obligatorio en producción
- RLS en customer_profiles
- Email normalizado a minúsculas
- Trigger automático seguro (SECURITY DEFINER)

### ⚠️ No exponer:
- Client Secret (nunca en frontend ni commits)
- Service Role Key de Supabase

---

## 📝 Notas

- **Magic link sigue disponible:** Como opción secundaria
- **Admin separado:** No usa Google OAuth, sigue con iron-session
- **Guest checkout:** No afectado, sigue funcionando
- **Auto-create profile:** Trigger automático en signup
- **No duplicación:** Constraint UNIQUE en user_id y email
