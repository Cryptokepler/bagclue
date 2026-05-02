# HEADER — ACCESO A MI CUENTA
**Proyecto:** Bagclue  
**Fecha:** 2026-05-02  
**Tipo de tarea:** Implementación (UX menor)  
**Entorno:** STAGING first  
**Responsable:** Kepler  

---

## OBJETIVO

Agregar acceso claro al panel de cliente desde la landing pública sin romper nada.

**Problema detectado:**  
Header público no tenía acceso visible a "Mi cuenta" / Login.

**Solución implementada:**  
OPCIÓN A — Ícono de usuario (recomendada y aprobada).

---

## ARCHIVOS MODIFICADOS

### 1. CREADO: `src/components/UserIcon.tsx`

**Nuevo componente:**
```tsx
'use client'

import Link from 'next/link'

export default function UserIcon() {
  return (
    <Link href="/account" className="relative group">
      <svg
        className="w-6 h-6 text-gray-900 group-hover:text-[#FF69B4] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </Link>
  )
}
```

**Características:**
- Componente client-side (igual que CartIcon)
- Link a `/account`
- SVG de usuario (silueta)
- Mismo estilo que CartIcon: hover pink, transiciones
- Clase `group` para hover effect

---

### 2. MODIFICADO: `src/components/Navbar.tsx`

**Cambios realizados:**

#### A) Import agregado
```tsx
import UserIcon from './UserIcon';
```

#### B) Desktop — Ícono agregado
```tsx
// ANTES:
<a href="..." aria-label="Instagram">...</a>
<CartIcon />

// DESPUÉS:
<a href="..." aria-label="Instagram">...</a>
<UserIcon />
<CartIcon />
```

**Orden final desktop:**
```
[BAGCLUE] ... Inicio Catálogo Apartado París Nosotros Contacto [IG] [👤] [🛒]
```

#### C) Mobile — Link agregado
```tsx
// ANTES:
{navLinks.map(l => ...)}
<a href="...">Contactar por Instagram</a>

// DESPUÉS:
{navLinks.map(l => ...)}
<Link href="/account" onClick={() => setMobileOpen(false)}>
  Mi cuenta
</Link>
<a href="...">Contactar por Instagram</a>
```

**Orden final mobile:**
```
Inicio
Catálogo
Apartado
París 2U
Nosotros
Contacto
Mi cuenta          ← NUEVO
[Contactar por Instagram]
```

---

## LO QUE CAMBIÓ

✅ **Desktop:**
- Agregado ícono de usuario entre Instagram y Carrito
- Click → `/account`
- Hover: gris → pink (igual que CartIcon)

✅ **Mobile:**
- Agregado link "Mi cuenta" al final del menú
- Click → `/account`
- Cierra menú automáticamente (onClick setMobileOpen(false))

---

## LO QUE NO SE TOCÓ

✅ **Estructura del header:**
- Logo BAGCLUE → sigue apuntando a `/`
- navLinks array → intacto (6 links originales)
- Instagram icon → intacto
- CartIcon → intacto

✅ **Funcionalidades existentes:**
- ❌ NO se tocó checkout
- ❌ NO se tocó Stripe
- ❌ NO se tocó webhook
- ❌ NO se tocó admin
- ❌ NO se tocó apartados
- ❌ NO se tocó base de datos
- ❌ NO se tocó RLS
- ❌ NO se tocó carrito logic
- ❌ NO se tocó productos

✅ **Código no modificado:**
- `CartIcon.tsx` → intacto
- Rutas de checkout → intactas
- Lógica de carrito → intacta
- Página `/account` → NO modificada (ya existe)

---

## COMPORTAMIENTO ESPERADO

### Desktop
1. Usuario ve ícono de usuario (👤) en header
2. Click en ícono → redirect a `/account`
3. Si usuario NO está logueado → `/account` debe redirigir a login o mostrar página protegida
4. Si usuario SÍ está logueado → entra al panel de cliente

### Mobile
1. Usuario abre menú hamburger
2. Ve link "Mi cuenta" después de Contacto
3. Click → redirect a `/account`
4. Menú se cierra automáticamente
5. Mismo comportamiento de login que desktop

---

## VALIDACIÓN TÉCNICA

### Build local
**Pendiente:** Ejecutar `npm run build` para verificar que no hay errores de TypeScript.

**Comandos esperados:**
```bash
cd /home/node/.openclaw/workspace/bagclue
npm run build
```

**Resultado esperado:** ✅ Build exitoso sin errores

---

## VALIDACIÓN UX

### Checklist de validación (PENDIENTE hasta deploy a staging)

#### Desktop
- [ ] Ícono de usuario visible en header
- [ ] Ícono aparece entre Instagram y Carrito
- [ ] Hover cambia color a pink (#FF69B4)
- [ ] Click redirige a `/account`
- [ ] Si no logueado → llega a login
- [ ] Si logueado → entra a panel
- [ ] Logo BAGCLUE sigue llevando a `/`
- [ ] Carrito sigue funcionando
- [ ] Instagram sigue funcionando
- [ ] Header sigue limpio y elegante

#### Mobile
- [ ] Menú hamburger abre correctamente
- [ ] "Mi cuenta" visible en lista
- [ ] "Mi cuenta" aparece después de Contacto
- [ ] Click redirige a `/account`
- [ ] Menú se cierra tras click
- [ ] Si no logueado → llega a login
- [ ] Si logueado → entra a panel

#### General
- [ ] No se rompió checkout
- [ ] Carrito funciona normalmente
- [ ] Links de navegación funcionan
- [ ] Instagram abre en nueva pestaña
- [ ] Responsive funciona correctamente

---

## RUTAS UTILIZADAS

**Corrección aplicada:**
- ✅ Usa `/account` (NO `/customer`)
- ✅ Asume que `/account/login` existe (NO modificado)

**Nota:**  
La ruta `/account` debe tener lógica de protección o redirección a login si el usuario no está autenticado. Esto **NO fue modificado** en esta tarea (se asume que ya existe).

---

## PRÓXIMOS PASOS

### 1. Build local
```bash
cd /home/node/.openclaw/workspace/bagclue
npm run build
```

### 2. Commit
```bash
git add src/components/UserIcon.tsx src/components/Navbar.tsx
git commit -m "feat: add user account access to public header

- Create UserIcon component (links to /account)
- Add UserIcon to desktop nav (between Instagram and Cart)
- Add 'Mi cuenta' link to mobile menu
- Consistent styling with CartIcon (hover pink)
- No changes to checkout, Stripe, webhook, admin, or cart logic

Refs: HEADER_ACCOUNT_ACCESS.md"
```

### 3. Push to staging
```bash
git push origin staging
```

### 4. Deploy to Vercel staging
- Vercel detecta push a `staging`
- Build automático
- Deploy a staging.bagclue.vercel.app (o similar)

### 5. Validación UX real
- Abrir staging en desktop
- Verificar ícono de usuario visible
- Click → verificar redirect a `/account`
- Abrir staging en mobile (DevTools responsive)
- Verificar "Mi cuenta" en menú
- Click → verificar redirect

### 6. PASS/FAIL final
- Si todo funciona → ✅ **PASS**
- Si algo falla → diagnosticar y fix

---

## CRITERIOS DE CIERRE

| # | Criterio | Estado |
|---|----------|--------|
| 1 | En desktop aparece ícono de usuario | ✅ Implementado |
| 2 | Click en ícono lleva a /account | ✅ Implementado |
| 3 | Si no estoy logueado, puedo llegar al login | ⏳ Pendiente validación UX |
| 4 | Si estoy logueado, entro al panel | ⏳ Pendiente validación UX |
| 5 | En mobile aparece "Mi cuenta" | ✅ Implementado |
| 6 | Logo BAGCLUE sigue llevando a / | ✅ No modificado |
| 7 | Carrito sigue funcionando | ✅ No modificado |
| 8 | Instagram sigue funcionando | ✅ No modificado |
| 9 | Header sigue limpio | ✅ Estilo consistente |
| 10 | No se tocó checkout/Stripe/webhook/admin/apartados | ✅ Confirmado |

**Estado actual:** 5/10 IMPLEMENTADO | 5/10 PENDIENTE VALIDACIÓN UX

---

## CIERRE BINARIO (EXECUTION_PROTOCOL)

**Backend PASS:** N/A (solo cambio frontend)  
**UX PASS:** ⏳ Pendiente validación en staging  

**Resultado:** ABIERTO (hasta validación UX en staging)

---

**FIN DE REPORTE — PENDIENTE BUILD + DEPLOY + VALIDACIÓN UX**
