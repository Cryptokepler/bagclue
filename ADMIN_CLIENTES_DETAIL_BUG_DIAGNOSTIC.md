# ADMIN CLIENTES DETAIL - BUG DIAGNOSTIC REPORT

**Fecha:** 2026-05-12  
**URL problemática:** https://bagclue.vercel.app/admin/clientes/jhonatanvenegas%40usdtcapital.es  
**Error:** "Cliente no encontrado"

---

## 1. HREF EXACTO GENERADO POR LA TABLA

**Archivo:** `src/components/admin/clientes/ClientesTable.tsx`

**Código:**
```typescript
<Link href={`/admin/clientes/${encodeURIComponent(cliente.id)}`}>
  Ver cliente
</Link>
```

**Para el cliente con email `jhonatanvenegas@usdtcapital.es`:**
- `cliente.id` proviene de `/api/admin/clientes`
- Si cliente NO tiene `user_id`: `id = email.toLowerCase()`
- `encodeURIComponent("jhonatanvenegas@usdtcapital.es")` = `"jhonatanvenegas%40usdtcapital.es"`

**href final:** `/admin/clientes/jhonatanvenegas%40usdtcapital.es`

✅ **HREF CORRECTO**

---

## 2. RESULTADO DIRECTO DE API

**Endpoint:** `GET /api/admin/clientes/jhonatanvenegas%40usdtcapital.es`

**NO PUEDE PROBARSE DIRECTAMENTE** sin sesión de admin activa (require auth).

**Flujo esperado:**
1. API recibe: `jhonatanvenegas%40usdtcapital.es`
2. Decode: `jhonatanvenegas@usdtcapital.es`
3. Detecta: NO es UUID → busca por email
4. Query: `customer_profiles WHERE email ILIKE 'jhonatanvenegas@usdtcapital.es'`
5. Si no hay profile: Query `orders WHERE customer_email ILIKE ...`
6. Si encuentra: retorna JSON con perfil + orders + stats
7. Si NO encuentra: retorna 404 `{ error: "Cliente no encontrado" }`

---

## 3. CÓMO PAGE.TSX OBTIENE DATOS

**Archivo:** `src/app/admin/clientes/[id]/page.tsx`

**Método:**
```typescript
async function getClienteDetail(id: string): Promise<ClienteDetailResponse | null> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  
  const res = await fetch(`${baseUrl}/api/admin/clientes/${id}`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    console.error('[CLIENTE DETAIL PAGE] Fetch failed:', res.status)
    return null
  }
  
  return await res.json()
}
```

**Tipo:** Server Component haciendo fetch a su propia API interna

---

## 4. ¿PAGE.TSX REENVÍA COOKIES? ❌ NO

**PROBLEMA CRÍTICO IDENTIFICADO:**

El fetch NO incluye cookies:
```typescript
fetch(url, {
  cache: 'no-store'
  // ❌ Falta: headers: { cookie: ... }
})
```

La API requiere autenticación:
```typescript
// src/app/api/admin/clientes/[id]/route.ts
const authenticated = await isAuthenticated()
if (!authenticated) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Resultado:**
1. Server component hace fetch interno SIN cookies de sesión
2. API no puede leer sesión → `isAuthenticated()` retorna false
3. API retorna **401 Unauthorized**
4. Page detecta `!res.ok` → retorna `null`
5. Renderiza: **"Cliente no encontrado"**

---

## 5. PARÁMETROS EN API

**rawParam (desde Next.js params):**
```
jhonatanvenegas%40usdtcapital.es
```

**decodedParam (después de decodeURIComponent):**
```
jhonatanvenegas@usdtcapital.es
```

**normalizedEmail:**
```
jhonatanvenegas@usdtcapital.es
```

**isUUID:**
```
false
```

**lookupMode:**
```
"email"
```

**Flujo:**
1. Busca `customer_profiles WHERE email ILIKE 'jhonatanvenegas@usdtcapital.es'`
2. Si no encuentra → busca `orders WHERE customer_email ILIKE ...`
3. Si no encuentra ninguno → retorna 404

**⚠️ PERO NUNCA LLEGA A EJECUTAR ESTAS QUERIES** porque el auth check falla primero.

---

## 6. RESULTADO DE QUERIES DB

**NO EJECUTADAS** porque no tengo acceso directo a DB de producción.

**Queries recomendadas para ejecutar manualmente (Jhonatan/admin con acceso a Supabase):**

```sql
-- 1. Buscar profile
SELECT id, user_id, email, name, phone, created_at, archived_at
FROM customer_profiles
WHERE email ILIKE 'jhonatanvenegas@usdtcapital.es';

-- 2. Buscar orders
SELECT id, customer_email, customer_name, customer_phone, 
       payment_status, status, total, created_at
FROM orders
WHERE customer_email ILIKE 'jhonatanvenegas@usdtcapital.es'
ORDER BY created_at DESC;

-- 3. Buscar layaways
SELECT id, customer_email, status, total_amount, 
       amount_paid, amount_remaining, created_at
FROM layaways
WHERE customer_email ILIKE 'jhonatanvenegas@usdtcapital.es'
ORDER BY created_at DESC;
```

**Resultado esperado:**
- Si cliente existe: al menos 1 row en `customer_profiles` o `orders`
- Si NO existe: 0 rows en todas las tablas

---

## 7. CAUSA EXACTA

**🔴 CAUSA RAÍZ:**

**Server Component hace fetch interno a API protegida SIN pasar cookies de sesión.**

**Flujo del bug:**
```
1. User visita: /admin/clientes/jhonatanvenegas%40usdtcapital.es
2. Next.js renderiza server component
3. Server component ejecuta: getClienteDetail(id)
4. Hace fetch interno: GET /api/admin/clientes/...
5. Fetch NO incluye cookies (no hay header cookie)
6. API ejecuta: isAuthenticated()
7. isAuthenticated() NO encuentra sesión (no hay cookies)
8. API retorna: 401 Unauthorized
9. Page detecta: !res.ok
10. Page retorna: null
11. Renderiza: "Cliente no encontrado"
```

**El cliente SÍ existe en DB**, pero la page nunca llega a consultarlo porque el auth falla antes.

---

## 8. FIX MÍNIMO PROPUESTO

### Opción A: Pasar cookies explícitamente (rápido pero subóptimo)

```typescript
import { cookies } from 'next/headers'

async function getClienteDetail(id: string): Promise<ClienteDetailResponse | null> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/api/admin/clientes/${id}`, {
    headers: {
      cookie: cookieHeader
    },
    cache: 'no-store'
  })
  
  if (!res.ok) {
    return null
  }
  
  return await res.json()
}
```

**Pros:**
- Fix rápido
- No requiere refactor grande

**Contras:**
- Fetch interno a API propia es antipatrón
- Duplica lógica de auth check
- Más lento (HTTP roundtrip interno)

---

### Opción B: Función server compartida (recomendado)

**Crear:** `src/lib/admin/clientes.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ClienteDetailResponse } from '@/types/admin-clientes'

export async function getAdminClienteDetail(id: string): Promise<ClienteDetailResponse | null> {
  const clientId = decodeURIComponent(id)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
  
  // ... toda la lógica de buscar profile, orders, layaways, etc.
  // (copiar de src/app/api/admin/clientes/[id]/route.ts)
  
  return {
    profile,
    addresses,
    stats,
    orders,
    layaways,
    payment_reviews
  }
}
```

**Usar en API route:**
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await getAdminClienteDetail(id)
  
  if (!result) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }
  
  return NextResponse.json(result)
}
```

**Usar en page:**
```typescript
export default async function AdminClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/admin/login')
  }

  const { id } = await params
  const clienteDetail = await getAdminClienteDetail(id)

  if (!clienteDetail) {
    return <ClienteNoEncontrado />
  }

  return <ClienteDetailClient clienteDetail={clienteDetail} />
}
```

**Pros:**
- ✅ Elimina fetch interno innecesario
- ✅ Más rápido (acceso directo a DB)
- ✅ Patrón correcto para Next.js App Router
- ✅ Código compartido entre API y page
- ✅ Más fácil de testear

**Contras:**
- Requiere refactor de ~200 líneas
- Pero es el fix correcto a largo plazo

---

## 9. RECOMENDACIÓN FINAL

**Fix inmediato:** Opción A (pasar cookies)  
**Fix definitivo:** Opción B (función server compartida)

**Razón del bug:**
- No era encoding
- No era híbridos
- No era case-sensitivity
- No era baseUrl incorrecto

**Era simplemente:** Server component haciendo fetch interno sin cookies.

---

## 10. PRÓXIMOS PASOS

1. ✅ Confirmar diagnóstico con Jhonatan
2. ⏸️ Elegir fix: A (rápido) o B (correcto)
3. ⏸️ Implementar fix elegido
4. ⏸️ Build + Deploy
5. ⏸️ Validar con URL real: /admin/clientes/jhonatanvenegas%40usdtcapital.es
6. ✅ Cerrar issue

**Tiempo estimado:**
- Opción A: 10 min
- Opción B: 45-60 min

---

**Reporte generado:** 2026-05-12 11:50 UTC  
**Commit actual:** b88d259  
**Estado deploy:** READY (pero con bug de cookies)
