# FASE 5D.2A — TESTS PRODUCCIÓN
**Fecha:** 2026-05-03  
**URL:** https://bagclue.vercel.app  
**Endpoint:** https://bagclue.vercel.app/api/account/addresses  

---

## SNIPPET DEVTOOLS — Obtener Access Token

Abre https://bagclue.vercel.app/account/login en Chrome/Edge y ejecuta en DevTools Console:

```javascript
// 1. Obtener session actual de Supabase
const session = await (await fetch('https://bagclue.vercel.app/api/auth/session')).json();

// 2. Si no hay sesión, hacer login con magic link primero:
// Ir a https://bagclue.vercel.app/account/login
// Ingresar tu email y hacer login
// Luego volver a ejecutar el snippet

// 3. Copiar access_token
console.log('ACCESS_TOKEN:', session.access_token);

// 4. Guardar en variable para tests
window.ACCESS_TOKEN = session.access_token;
```

**Alternativa más directa (después de login):**

```javascript
// En https://bagclue.vercel.app/account después de login
const supabase = window.supabase || {};
const session = supabase._client?.auth?.session || 
               JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
               
console.log('ACCESS_TOKEN:', session.access_token);
window.ACCESS_TOKEN = session.access_token;
```

**Copia el token y úsalo en los tests manuales abajo.**

---

## TESTS AUTOMATIZADOS (Sin Auth)

Ejecutando tests que no requieren autenticación...

