# BAGCLUE WEB POLISH — ESTÉTICA PREMIUM
## SCOPE COMPLETO

**Fecha:** 2026-05-05  
**Objetivo:** Pulir la web pública de Bagclue para que se vea como boutique de lujo femenina, limpia, elegante y confiable.  
**Estado:** SCOPE - Pendiente aprobación

---

## 🎨 PALETA DE COLORES BAGCLUE (OFICIAL)

**Definida:**
- **Rosa fuerte/fucsia:** `#E85A9A` / `#EC5C9F`
- **Amarillo pastel/crema:** `#FFF4A8` / `#F8F0A0`
- **Negro lujo:** `#0B0B0B`
- **Blanco:** `#FFFFFF`
- **Gris suave:** `#F7F7F7`

**Actualmente en uso (INCORRECTO):**
- `#FF69B4` (rosa distinto - NO oficial)
- `pink-400` (Tailwind - NO controlado)
- `#111` (negro incorrecto)
- Mezcla inconsistente entre Tailwind y hex

---

## 📋 AUDITORÍA ESTADO ACTUAL

### 1. LANDING (/)

**✅ Bien:**
- Hero gradient from-pink-100 via-pink-50 to-white
- Tipografía Playfair Display para títulos
- Trust badges visibles
- CTA Instagram destacado
- Sección "¿Por qué elegir BAGCLUE?" clara
- Featured products con ProductCard

**❌ Problemas:**
- **Color:** Usa `pink-400` (Tailwind) en lugar de rosa oficial `#E85A9A`
- **Inconsistencia:** Alterna entre `text-pink-400`, `bg-pink-100`, `border-pink-300`
- **Botones:** CTA usa `bg-pink-400` pero debería usar rosa oficial
- **Espaciados:** Algunos bloques muy separados (py-20)
- **Mobile:** Hero puede ser muy alto en móviles pequeños

**Mejoras necesarias:**
- Migrar todos los `pink-*` a rosa oficial
- Unificar sistema de botones
- Ajustar espaciados
- Optimizar hero mobile

---

### 2. CATÁLOGO (/catalogo)

**✅ Bien:**
- Header "Catálogo" con línea decorativa
- Contador de piezas
- Filtros por marca y status
- Grid responsivo de productos

**❌ Problemas CRÍTICOS:**
- **Inputs negros:** `bg-[#111] text-gray-900` → texto negro sobre fondo negro = **INVISIBLE**
- **Color inconsistente:** Usa `#FF69B4` en lugar de `#E85A9A`
- **Botón limpiar filtros:** Borde rosa pero no destacado
- **Filtros:** Dropdowns oscuros no se ven bien en página clara
- **ProductCard:** Componente reutilizable puede tener inconsistencias

**Mejoras necesarias:**
- **URGENTE:** Fix inputs (bg-white, border-gray-300, text-gray-900)
- Migrar `#FF69B4` → `#E85A9A`
- Rediseñar filtros (sidebar o chips)
- Mejorar UX de filtros móviles

---

### 3. DETALLE DE PRODUCTO (/catalogo/[slug])

**Auditado:** (sin acceso directo pero inferido de ProductCard)

**Componentes esperados:**
- Galería de imágenes
- Título + marca + precio
- Descripción
- Badge autenticidad
- Botones: Agregar al carrito / Apartado
- Detalles: condición, accesorios, ubicación

**Problemas probables:**
- Color de botones inconsistente
- Sin galería profesional (zoom, thumbnails)
- Badges de autenticidad poco destacados
- Descripción poco estructurada

**Mejoras necesarias:**
- Galería de imágenes tipo Fashionphile (thumbnails + zoom)
- Sección "Verificación Entrupy" destacada (badge verde grande)
- Botones CTA con rosa oficial
- Detalles en tabs o accordion
- Trust signals visibles (envíos, garantía, devoluciones)

---

### 4. CARRITO (/cart)

**✅ Bien:**
- Título Playfair
- Lista de items con imagen
- Total destacado
- Información de checkout visible
- Empty state con CTA al catálogo

**❌ Problemas:**
- **Color:** Total usa `text-[#FF69B4]` (incorrecto)
- **Borders:** `border-[#FF69B4]/10` demasiado sutil
- **Layout:** Lista simple, podría ser más visual
- **Trust signals:** Faltan badges de pago seguro/envío
- **Responsive:** Items muy compactos en mobile

**Mejoras necesarias:**
- Migrar rosa a oficial
- Cards de items más visuales (thumbnail más grande)
- Trust badges abajo (Stripe, envío seguro)
- Summary sticky en desktop
- Optimizar mobile (botón checkout fijo abajo)

---

### 5. POST-COMPRA (/checkout/success)

**Auditado:** (inferido)

**Estado esperado:**
- Mensaje de confirmación
- Número de orden
- Detalles de envío
- Próximos pasos

**Problemas probables:**
- Diseño genérico
- Sin celebración visual
- Falta info clara de tracking
- Sin cross-sell (otras piezas)

**Mejoras necesarias:**
- Diseño celebratorio (confetti animation, check verde grande)
- Timeline de envío visual (pasos: confirmado → preparando → enviado → entregado)
- CTA secundario: "Seguir comprando"
- Email confirmation destacado
- Trust signals (atención al cliente, seguimiento)

---

### 6. ACCOUNT DASHBOARD (/account)

**Auditado:** (sin detalle completo)

**Componentes esperados:**
- Menú lateral (órdenes, perfil, direcciones)
- Dashboard con resumen

**Problemas probables:**
- Diseño funcional pero no premium
- Sin personalización ("Hola, [Nombre]")
- Órdenes recientes poco visuales

**Mejoras necesarias:**
- Header personalizado con nombre
- Cards para "Mis órdenes", "Mis apartados", "Mi perfil"
- Navegación lateral elegante
- Empty states amigables

---

### 7. MIS ÓRDENES (/account/orders)

**Estado:** Funcional pero básico

**Mejoras necesarias:**
- Lista de órdenes con thumbnails de productos
- Status badges visuales (preparando, enviado, entregado)
- Filtros por status
- Link a tracking directo
- Empty state: "Aún no tienes órdenes. Descubre nuestro catálogo"

---

### 8. DETALLE DE ORDEN (/account/orders/[id])

**Estado:** Funcional

**Mejoras necesarias:**
- Timeline visual de envío
- Detalles de pago/envío en cards limpias
- Botón "Descargar factura" (si aplica)
- Información de contacto destacada
- Tracking integrado (si tiene tracking number)

---

## 🚨 PROBLEMAS DETECTADOS (PRIORIZADOS)

### P0 (Críticos - rompen UX)

1. **Catálogo inputs invisibles:** `bg-[#111] text-gray-900` = texto negro sobre negro
2. **Color inconsistente:** Mezcla `pink-400`, `#FF69B4`, rosa Tailwind

### P1 (Altos - afectan estética premium)

3. **Sin galería profesional** en detalle de producto
4. **Badges autenticidad poco destacados**
5. **Botones inconsistentes:** Diferentes estilos CTA
6. **Espaciados irregulares:** py-20, py-24, py-8 sin patrón
7. **Tipografía secundaria:** Mezcla entre sans-serif genérico

### P2 (Medios - mejoras incrementales)

8. **Mobile hero muy alto**
9. **Filtros catálogo poco intuitivos**
10. **Cart items muy compactos**
11. **Account dashboard genérico**
12. **Sin animaciones/transiciones suaves**

---

## 🎨 SISTEMA VISUAL RECOMENDADO

### COLORES

**Paleta principal:**
```css
/* Rosa oficial */
--bagclue-pink: #E85A9A;
--bagclue-pink-light: #EC5C9F;
--bagclue-pink-hover: #D14D87;

/* Amarillo/Crema */
--bagclue-cream: #FFF4A8;
--bagclue-cream-dark: #F8F0A0;

/* Neutrales */
--bagclue-black: #0B0B0B;
--bagclue-white: #FFFFFF;
--bagclue-gray-light: #F7F7F7;
--bagclue-gray-medium: #E5E5E5;
--bagclue-gray-text: #4A4A4A;

/* Semánticos */
--bagclue-success: #10B981; /* Verde Entrupy */
--bagclue-warning: #F59E0B;
--bagclue-error: #EF4444;
```

**Aplicación:**
- **Fondos principales:** `#FFFFFF` (blanco puro)
- **Fondos secundarios:** `#F7F7F7` (gris suave)
- **Acentos CTA:** `#E85A9A` (rosa oficial)
- **Texto principal:** `#0B0B0B` (negro lujo)
- **Texto secundario:** `#4A4A4A` (gris texto)

---

### BOTONES

**Sistema de 3 tipos:**

**1. CTA Principal (rosa):**
```html
<button class="bg-[#E85A9A] text-white px-8 py-4 text-sm tracking-wider uppercase font-medium hover:bg-[#D14D87] transition-all duration-300 shadow-lg shadow-pink-500/20">
  Comprar ahora
</button>
```

**2. CTA Secundario (outline rosa):**
```html
<button class="border-2 border-[#E85A9A] text-[#E85A9A] px-8 py-4 text-sm tracking-wider uppercase font-medium hover:bg-[#E85A9A] hover:text-white transition-all duration-300">
  Ver catálogo
</button>
```

**3. CTA Terciario (texto):**
```html
<button class="text-[#E85A9A] text-sm tracking-wider uppercase font-medium hover:text-[#D14D87] transition-colors">
  Seguir comprando
</button>
```

**Formas:**
- Desktop: Rectangulares limpios (sin rounded excesivo)
- Mobile: Rounded-full para CTAs principales (más táctil)

---

### BADGES

**Status de producto:**
```html
<!-- Disponible -->
<span class="bg-emerald-500/10 text-emerald-700 px-3 py-1 text-xs font-medium uppercase tracking-wide">
  Disponible
</span>

<!-- Apartado -->
<span class="bg-yellow-500/10 text-yellow-700 px-3 py-1 text-xs font-medium uppercase tracking-wide">
  Apartado
</span>

<!-- Vendido -->
<span class="bg-gray-500/10 text-gray-700 px-3 py-1 text-xs font-medium uppercase tracking-wide">
  Vendido
</span>

<!-- Autenticidad Entrupy -->
<span class="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 shadow-md">
  <svg>...</svg> Verificado por Entrupy
</span>
```

---

### TIPOGRAFÍA

**Jerarquía:**

**Headlines (títulos grandes):**
```html
<h1 class="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl tracking-tight text-[#0B0B0B] leading-tight">
  Descubre el lujo auténtico
</h1>
```

**Subheadings:**
```html
<h2 class="font-[family-name:var(--font-playfair)] text-2xl md:text-4xl text-[#0B0B0B]">
  Catálogo
</h2>
```

**Body text:**
```html
<p class="text-base md:text-lg text-[#4A4A4A] leading-relaxed">
  Desde 2019, conectamos a los amantes de la moda...
</p>
```

**Small text / labels:**
```html
<span class="text-xs tracking-[0.3em] uppercase text-[#E85A9A]/70">
  Salebybagcluemx
</span>
```

**Fuentes:**
- **Display/Títulos:** Playfair Display (ya configurada)
- **Body/UI:** Inter o similar (sans-serif limpia)

---

### ESPACIADOS

**Sistema consistente (múltiplos de 4):**

**Secciones:**
- Desktop: `py-20` (5rem)
- Mobile: `py-12` (3rem)

**Cards/Componentes:**
- Padding interno: `p-6` (1.5rem)
- Gap entre items: `gap-8` (2rem) desktop, `gap-4` (1rem) mobile

**Márgenes:**
- Entre bloques: `mb-12` (3rem)
- Entre elementos: `mb-4` (1rem)

---

### CARDS

**Product Card (catálogo):**
```html
<div class="group bg-white border border-gray-200 hover:border-[#E85A9A] transition-all duration-300 overflow-hidden">
  <!-- Imagen -->
  <div class="aspect-square overflow-hidden bg-[#F7F7F7]">
    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>
  
  <!-- Info -->
  <div class="p-4">
    <!-- Badge autenticidad -->
    <span class="text-xs text-emerald-600 font-medium">✓ Entrupy</span>
    
    <!-- Marca + modelo -->
    <h3 class="text-sm font-medium text-[#0B0B0B] mt-2">Chanel</h3>
    <p class="text-sm text-[#4A4A4A]">Classic Flap Medium</p>
    
    <!-- Precio -->
    <p class="text-lg font-[family-name:var(--font-playfair)] text-[#E85A9A] mt-3">
      $85,000 MXN
    </p>
  </div>
</div>
```

**Info Card (features/benefits):**
```html
<div class="bg-[#F7F7F7]/50 border border-[#E85A9A]/10 p-8 text-center hover:bg-[#F7F7F7] transition-colors">
  <div class="text-4xl mb-4">🛡️</div>
  <h3 class="text-lg font-medium text-[#0B0B0B] mb-2">Autenticidad garantizada</h3>
  <p class="text-sm text-[#4A4A4A] leading-relaxed">
    Cada pieza es verificada por Entrupy...
  </p>
</div>
```

---

### FONDOS

**Estructura por secciones:**

**Hero (landing):**
```html
<div class="bg-gradient-to-b from-[#F7F7F7] via-white to-white">
```

**Secciones alternas:**
```html
<!-- Clara -->
<section class="bg-white">

<!-- Suave -->
<section class="bg-[#F7F7F7]">

<!-- Acento (uso limitado) -->
<section class="bg-[#E85A9A]/5">
```

**Cards sobre fondo:**
- Sobre blanco: `bg-[#F7F7F7]` + `border-gray-200`
- Sobre gris: `bg-white` + `border-gray-200`

---

## 🛠️ MEJORAS POR ÁREA

### 1. LANDING (/)

**Cambios:**
- Migrar `pink-400`, `pink-100`, etc. → Rosa oficial `#E85A9A` y variantes
- CTA principal: `bg-[#E85A9A] shadow-lg shadow-pink-500/20`
- Hero: Reducir padding mobile (min-h-screen → min-h-[80vh])
- Secciones: Unificar espaciados (py-20 desktop, py-12 mobile)
- Featured products: Usar ProductCard mejorado

**Estimación:** 2 horas

---

### 2. CATÁLOGO (/catalogo)

**Cambios CRÍTICOS:**
- **Fix inputs:** `bg-white border-gray-300 text-[#0B0B0B]`
- Migrar `#FF69B4` → `#E85A9A`
- Rediseñar filtros:
  - Desktop: Sidebar izquierda sticky
  - Mobile: Botón "Filtros" que abre modal
- Mejorar UX:
  - Chips de filtros activos (removibles)
  - Contador "X piezas encontradas"
  - Botón "Limpiar filtros" destacado

**Estimación:** 3 horas

---

### 3. DETALLE DE PRODUCTO (/catalogo/[slug])

**Cambios:**
- **Galería profesional:**
  - Imagen principal grande
  - Thumbnails abajo (5-6 visibles)
  - Click para zoom/lightbox
  - Swipe mobile
- **Layout:**
  - Desktop: Grid 2 columnas (galería 60%, info 40%)
  - Mobile: Stack (galería → info)
- **Info destacada:**
  - Badge Entrupy verde grande (arriba)
  - Título + marca (Playfair, grande)
  - Precio (rosa, 2xl)
  - Descripción estructurada (tabs: Detalles / Condición / Accesorios)
- **CTAs:**
  - Botón principal: "Agregar al carrito" (rosa)
  - Botón secundario: "Apartado" (outline rosa)
  - Botón terciario: "Contactar por WhatsApp" (outline verde)
- **Trust signals:**
  - "Envío gratis en CDMX"
  - "Autenticidad garantizada"
  - "Devoluciones en 7 días"

**Estimación:** 4 horas

---

### 4. CARRITO (/cart)

**Cambios:**
- Migrar colores a rosa oficial
- **Layout mejorado:**
  - Desktop: 2 columnas (items 65%, summary 35% sticky)
  - Mobile: Stack
- **Items:**
  - Thumbnail más grande (120x120)
  - Info clara (marca, modelo, precio)
  - Botón eliminar visible
- **Summary:**
  - Subtotal
  - Envío (calculado o "A calcular")
  - Total destacado (rosa, 2xl)
  - Trust badges (Stripe, envío seguro)
  - CTA checkout (rosa, grande, sticky mobile)
- **Empty state:**
  - Ilustración/icono
  - "Tu carrito está vacío"
  - CTA al catálogo

**Estimación:** 2.5 horas

---

### 5. POST-COMPRA (/checkout/success)

**Cambios:**
- **Diseño celebratorio:**
  - Confetti animation (subtle)
  - Check verde grande (✓ animado)
  - "¡Gracias por tu compra!"
- **Info clara:**
  - Número de orden destacado
  - Email de confirmación
  - Resumen de compra
- **Timeline envío:**
  - Visual (step indicator)
  - Pasos: Confirmado → Preparando → Enviado → Entregado
- **CTAs:**
  - "Seguir comprando" (outline rosa)
  - "Ver mi orden" (texto rosa)
- **Trust signals:**
  - "Te enviaremos actualizaciones a [email]"
  - "¿Preguntas? Contáctanos por WhatsApp"

**Estimación:** 2 horas

---

### 6-8. ACCOUNT (/account/*)

**Cambios generales:**
- Header personalizado: "Hola, [Nombre]"
- Navegación lateral elegante:
  - Mis órdenes
  - Mis apartados
  - Mi perfil
  - Mis direcciones
  - Cerrar sesión
- **Dashboard:** Cards para accesos rápidos
- **Mis órdenes:**
  - Lista con thumbnails
  - Status badges visuales
  - Link a tracking directo
- **Detalle orden:**
  - Timeline envío
  - Detalles en cards limpias
  - Botón "Descargar factura" (si aplica)

**Estimación:** 3 horas

---

### 9. MOBILE OPTIMIZATIONS

**Cambios cross-page:**
- Hero: `min-h-[80vh]` en lugar de `min-h-screen`
- Botones: `rounded-full` para CTAs principales
- Sticky checkout button en cart
- Hamburger menu si nav crece
- Touch-friendly targets (min 48x48px)
- Swipe gestures en galerías

**Estimación:** 2 horas (iterativo con las anteriores)

---

## 📅 ORDEN DE IMPLEMENTACIÓN POR FASES

### FASE 1 - FIX CRÍTICO + COLORES (1 semana, ~12h)

**Prioridad P0:**
1. Fix inputs catálogo (URGENTE)
2. Migrar todos los colores a paleta oficial
3. Sistema de botones consistente
4. ProductCard mejorado (reutilizable)

**Archivos:**
- `/catalogo/page.tsx`
- `/components/ProductCard.tsx`
- `/page.tsx` (landing)
- `/cart/page.tsx`
- Crear `/styles/bagclue-colors.css` (variables CSS)

**Resultado:** Colores consistentes, inputs funcionales, botones unificados

---

### FASE 2 - DETALLE DE PRODUCTO + GALERÍA (1 semana, ~8h)

**Prioridad P1:**
1. Galería profesional con zoom
2. Layout 2 columnas
3. Badge Entrupy destacado
4. Tabs de detalles
5. Trust signals

**Archivos:**
- `/catalogo/[id]/page.tsx`
- `/components/ProductGallery.tsx` (nuevo)
- `/components/ProductDetails.tsx` (nuevo)

**Resultado:** Detalle de producto nivel luxury

---

### FASE 3 - CARRITO + POST-COMPRA (1 semana, ~6h)

**Prioridad P1:**
1. Cart layout mejorado
2. Summary sticky
3. Post-compra celebratorio
4. Timeline envío

**Archivos:**
- `/cart/page.tsx`
- `/checkout/success/page.tsx`
- `/components/OrderTimeline.tsx` (nuevo)

**Resultado:** Experiencia de compra pulida

---

### FASE 4 - CATÁLOGO + FILTROS (1 semana, ~6h)

**Prioridad P2:**
1. Sidebar filtros desktop
2. Modal filtros mobile
3. Chips de filtros activos
4. Mejorar UX búsqueda

**Archivos:**
- `/catalogo/page.tsx`
- `/components/CatalogoFilters.tsx` (nuevo)
- `/components/FilterChips.tsx` (nuevo)

**Resultado:** Catálogo intuitivo y elegante

---

### FASE 5 - ACCOUNT + MOBILE POLISH (1 semana, ~6h)

**Prioridad P2:**
1. Account dashboard personalizado
2. Órdenes visuales
3. Detalle orden mejorado
4. Optimizaciones mobile

**Archivos:**
- `/account/page.tsx`
- `/account/orders/page.tsx`
- `/account/orders/[id]/page.tsx`
- Cross-page mobile fixes

**Resultado:** Experiencia account completa + mobile optimizado

---

## ❌ QUÉ NO TOCAR

**Backend/Lógica:**
- ❌ Base de datos (schema, migrations, RLS)
- ❌ API routes (checkout, products, orders)
- ❌ Stripe integration (webhook, create-session)
- ❌ Lógica de órdenes (status, tracking)
- ❌ Lógica de apartados (layaways)
- ❌ Authentication (login, session)

**Admin:**
- ❌ /admin/* (ya tiene tema oscuro consistente)
- ❌ AdminNav
- ❌ Admin envíos
- ❌ Admin productos

**Solo tocar:**
- ✅ Páginas públicas (/, /catalogo, /cart, /checkout/success, /account/*)
- ✅ Componentes UI públicos (ProductCard, buttons, badges)
- ✅ Estilos CSS/Tailwind
- ✅ Layout/estructura HTML
- ✅ Animaciones/transiciones
- ✅ Responsive

---

## 📊 ESTIMACIÓN TOTAL

**Tiempo total:** ~38 horas (5 semanas de trabajo)

**Desglose:**
- FASE 1 (crítico): 12h
- FASE 2 (producto): 8h
- FASE 3 (compra): 6h
- FASE 4 (catálogo): 6h
- FASE 5 (account): 6h

**Riesgo:** Bajo (solo UI/CSS, no toca lógica)

---

## ✅ CRITERIOS DE CIERRE

**Por fase:**

**FASE 1:**
- [ ] Inputs catálogo visibles y funcionales
- [ ] Todos los colores usan paleta oficial (#E85A9A, #FFF4A8, #0B0B0B)
- [ ] 0 referencias a `pink-400`, `#FF69B4`
- [ ] Sistema de 3 tipos de botones implementado
- [ ] ProductCard usa colores oficiales
- [ ] Build PASS
- [ ] Deploy production
- [ ] Validación visual en landing, catálogo, cart

**FASE 2:**
- [ ] Galería con thumbnails + zoom funcional
- [ ] Layout 2 columnas desktop, stack mobile
- [ ] Badge Entrupy destacado (verde)
- [ ] Tabs/accordion de detalles
- [ ] Trust signals visibles
- [ ] Mobile gallery con swipe
- [ ] Build PASS
- [ ] Deploy production
- [ ] Validación visual en detalle producto

**FASE 3:**
- [ ] Cart layout 2 columnas desktop
- [ ] Summary sticky desktop
- [ ] CTA checkout sticky mobile
- [ ] Trust badges visibles
- [ ] Post-compra con check animado
- [ ] Timeline envío visual
- [ ] Build PASS
- [ ] Deploy production
- [ ] Validación visual en cart + success

**FASE 4:**
- [ ] Sidebar filtros desktop funcional
- [ ] Modal filtros mobile funcional
- [ ] Chips de filtros activos removibles
- [ ] Contador "X piezas encontradas"
- [ ] Botón limpiar filtros destacado
- [ ] Build PASS
- [ ] Deploy production
- [ ] Validación visual en catálogo

**FASE 5:**
- [ ] Dashboard account personalizado
- [ ] Órdenes con thumbnails + badges
- [ ] Detalle orden con timeline
- [ ] Mobile: hero optimizado, botones touch-friendly
- [ ] Build PASS
- [ ] Deploy production
- [ ] Validación visual en account + mobile

---

## 🎓 REFERENCIAS VISUALES

**Benchmarks luxury:**
- **Fashionphile:** Galería producto, trust signals, limpieza
- **The RealReal:** Filtros sidebar, badges autenticidad
- **Vestiaire Collective:** Cards producto elegantes
- **Rebag:** Checkout/post-compra celebratorio
- **Coco Approved:** Mobile UX, botones touch-friendly

**Elementos a inspirar:**
- Galería con zoom estilo Fashionphile
- Filtros sidebar estilo The RealReal
- Cards limpias estilo Vestiaire
- Trust badges estilo Rebag
- Mobile polish estilo Coco Approved

---

**Documento preparado por:** Kepler  
**Fecha:** 2026-05-05  
**Proyecto:** Bagclue - Web Polish  
**Estado:** SCOPE - Pendiente aprobación
