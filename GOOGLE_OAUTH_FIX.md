# Google OAuth Fix - Actualización Redirect URL

**Problema detectado:** OAuth callback no procesaba correctamente tokens en hash.

**Solución:** Manejar tokens del lado del cliente.

---

## 🔧 Cambio requerido en Supabase

### Ir a Supabase URL Configuration:
https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/auth/url-configuration

### Actualizar Redirect URLs:

**REMOVER:**
```
https://bagclue.vercel.app/api/auth/callback
```

**AGREGAR:**
```
https://bagclue.vercel.app/account/login
```

**Debe quedar:**
```
https://bagclue.vercel.app/account
https://bagclue.vercel.app/account/login  ← NUEVO
```

Click **"Save changes"**

---

## ✅ Qué hace el fix:

1. Google redirige a `/account/login` (en lugar de `/api/auth/callback`)
2. LoginForm detecta tokens en hash (`#access_token=...`)
3. Llama a `supabase.auth.setSession()` con esos tokens
4. Crea customer_profile automáticamente (trigger existente)
5. Redirige a `/account` dashboard

---

## 📋 Checklist:

- [ ] Actualizar Redirect URLs en Supabase
- [ ] Deploy del código actualizado
- [ ] Test de login con Google
- [ ] Verificar que redirige a /account
- [ ] Verificar que customer_profile se crea
