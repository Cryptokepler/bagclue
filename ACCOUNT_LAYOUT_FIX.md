# Account Layout Fix - Header Duplicado/Superpuesto
**Fecha:** 2026-05-01  
**Bug:** Header roto/mezclado en /account - logo encimado con navegación pública

---

## 🐛 PROBLEMA

**Observado:**
- Logo BAGCLUE aparece duplicado
- Navegación pública superpuesta con contenido de cuenta
- Email y "Cerrar sesión" mezclados con menú público
- Layout roto visual

---

## 🔍 CAUSA RAÍZ

**Headers duplicados renderizándose al mismo tiempo:**

1. **ConditionalLayout** (root layout wrapper)
   - Renderizaba `<Navbar />` para todas las rutas públicas
   - `/account` NO estaba excluido → Navbar se renderizaba

2. **AccountLayout** (component específico de /account)
   - Renderizaba su propio header
   - Con logo "Bagclue" + "Mi Cuenta" + email + botón logout

3. **Resultado:**
   - Dos headers uno encima del otro
   - Superposición visual
   - Layout roto

---

## ✅ SOLUCIÓN

### Fix #1: Excluir /account de ConditionalLayout

**ConditionalLayout.tsx:**

**ANTES:**
```typescript
export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isTracking = pathname.startsWith('/track/')

  if (isAdmin) {
    return <>{children}</>
  }

  if (isTracking) {
    return (
      <>
        <TrackingHeader />
        {children}
        <Footer />
      </>
    )
  }

  // Todas las demás rutas (incluyendo /account) ❌
  return (
    <>
      <Navbar /> {/* Header público duplicado */}
      {children}
      <Footer />
    </>
  )
}
```

**DESPUÉS:**
```typescript
export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isAccount = pathname.startsWith('/account') // ✅ Nuevo
  const isTracking = pathname.startsWith('/track/')

  if (isAdmin) {
    return <>{children}</>
  }

  if (isAccount) {
    // Account usa AccountLayout internamente
    // No aplicar Navbar/Footer de ConditionalLayout
    return <>{children}</> // ✅ Sin header duplicado
  }

  if (isTracking) {
    return (
      <>
        <TrackingHeader />
        {children}
        <Footer />
      </>
    )
  }

  // Solo rutas públicas (/catalogo, /, /nosotros, etc.)
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
```

---

### Fix #2: Mejorar AccountLayout con Navegación Completa

**AccountLayout.tsx mejorado:**

**Características:**
- ✅ Logo BAGCLUE (único, no duplicado)
- ✅ Navegación completa:
  - Mi cuenta
  - Mis pedidos
  - Mis apartados
  - Catálogo
  - Cerrar sesión
- ✅ Responsive mobile con menú hamburguesa
- ✅ Sticky header (fixed en scroll)
- ✅ Email del usuario visible
- ✅ Footer con link "Volver a la tienda"

**Desktop:**
```
+----------------------------------------------------------+
| BAGCLUE  |  Mi cuenta  Mis pedidos  Mis apartados       |
|          |  Catálogo    |    email@user.com  [Cerrar]  |
+----------------------------------------------------------+
```

**Mobile:**
```
+---------------------------+
| BAGCLUE            [☰]   |
+---------------------------+
| (menú desplegable)        |
|  email@user.com           |
|  Mi cuenta                |
|  Mis pedidos              |
|  Mis apartados            |
|  Catálogo                 |
|  [Cerrar sesión]          |
+---------------------------+
```

---

## 📋 ESTRUCTURA FINAL

### Rutas /account/* (excepto /account/login):

```
ConditionalLayout (no aplica Navbar)
  └─ AccountPage
       └─ AccountLayout ✅
            ├─ Header (sticky)
            │    ├─ Logo BAGCLUE
            │    ├─ Nav (Mi cuenta, Pedidos, Apartados, Catálogo)
            │    └─ User menu (email, logout)
            ├─ Main content
            └─ Footer
```

### Ruta /account/login:

```
ConditionalLayout (no aplica Navbar)
  └─ LoginPage
       └─ LoginForm
            └─ Formulario limpio (sin headers)
```

### Rutas públicas (/, /catalogo, /nosotros, etc.):

```
ConditionalLayout
  ├─ Navbar (header público completo)
  ├─ Content
  └─ Footer
```

### Rutas /admin/*:

```
ConditionalLayout (no aplica Navbar)
  └─ AdminLayout (header propio de admin)
```

---

## 🎨 MEJORAS VISUALES

### Header Sticky
```typescript
<header className="bg-white shadow-sm border-b sticky top-0 z-50">
```
- Queda fixed al hacer scroll
- Siempre visible
- z-index 50 para estar encima del contenido

### Mobile Menu
- Hamburguesa (☰) en mobile
- Desplegable con todas las opciones
- Email visible en mobile
- Botón logout destacado

### Tipografía
- Logo usa `font-playfair` (consistente con diseño público)
- Links con hover states
- Colores consistentes (gray-700 → gray-900)

---

## 🚫 NO AFECTADO

- ✅ /account/login (sin headers, solo form)
- ✅ Rutas públicas (siguen con Navbar público)
- ✅ /admin/* (sigue con AdminLayout)
- ✅ /track/* (sigue con TrackingHeader)
- ✅ Auth logic (no modificado)
- ✅ Checkout (no modificado)
- ✅ Backend (no modificado)

**Solo cambios visuales de layout en /account/***

---

## 🧪 TESTING

### Test 1: /account dashboard
1. [ ] Login exitoso
2. [ ] Ir a /account
3. [ ] Debe mostrar:
   - ✅ Un solo logo BAGCLUE (arriba izquierda)
   - ✅ Navegación: Mi cuenta, Mis pedidos, Mis apartados, Catálogo
   - ✅ Email del usuario (arriba derecha)
   - ✅ Botón "Cerrar sesión"
   - ✅ NO debe haber headers duplicados
   - ✅ NO debe haber superposición visual

### Test 2: Navegación funcional
1. [ ] Click en "Mi cuenta" → debe ir a /account
2. [ ] Click en "Mis pedidos" → debe ir a /account/orders
3. [ ] Click en "Mis apartados" → debe ir a /account/layaways
4. [ ] Click en "Catálogo" → debe ir a /catalogo
5. [ ] Click en "Cerrar sesión" → debe logout y redirect a /

### Test 3: Mobile responsive
1. [ ] Abrir en mobile o reducir ventana
2. [ ] Debe mostrar hamburguesa (☰)
3. [ ] Click hamburguesa → menú desplegable
4. [ ] Menú debe mostrar:
   - Email del usuario
   - Mi cuenta
   - Mis pedidos
   - Mis apartados
   - Catálogo
   - Cerrar sesión
5. [ ] Click en opción → cierra menú y navega

### Test 4: /account/login limpio
1. [ ] Ir a /account/login
2. [ ] Debe mostrar solo formulario
3. [ ] NO debe mostrar header de cuenta
4. [ ] NO debe mostrar header público

### Test 5: Sticky header
1. [ ] Ir a /account
2. [ ] Scroll down
3. [ ] Header debe quedarse fixed arriba
4. [ ] Siempre visible

---

## 📝 ARCHIVOS MODIFICADOS

1. **src/components/ConditionalLayout.tsx**
   - Agregado check `isAccount`
   - Excluye /account de renderizar Navbar público
   - Evita header duplicado

2. **src/components/customer/AccountLayout.tsx**
   - Header sticky con z-index
   - Navegación completa (5 items)
   - Responsive mobile menu
   - Email visible
   - Footer con link a tienda

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- 🔴 Headers duplicados/superpuestos
- 🔴 Logo BAGCLUE aparece 2 veces
- 🔴 Navegación pública mezclada con cuenta
- ❌ Layout roto visual

**DESPUÉS:**
- ✅ Un solo header limpio
- ✅ Logo BAGCLUE una vez (arriba izquierda)
- ✅ Navegación específica de cuenta
- ✅ Email + logout visible
- ✅ Responsive mobile
- ✅ Layout visual correcto

---

## 📐 DISEÑO FINAL

```
+----------------------------------------------------------------+
|  BAGCLUE  | Mi cuenta  Mis pedidos  Mis apartados  Catálogo  | 
|           |                           user@email.com  [Cerrar] |
+----------------------------------------------------------------+
|                                                                |
|  CONTENIDO DE LA PÁGINA                                       |
|  (AccountDashboard, Orders, Layaways, etc.)                   |
|                                                                |
+----------------------------------------------------------------+
|                    ← Volver a la tienda                       |
+----------------------------------------------------------------+
```

**Limpio, profesional, sin duplicación.**
