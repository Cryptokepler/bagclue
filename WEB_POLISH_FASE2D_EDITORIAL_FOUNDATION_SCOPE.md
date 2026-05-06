# WEB POLISH FASE 2D — EDITORIAL FOUNDATION SCOPE
**Fecha:** 2026-05-06  
**Objetivo:** Aplicar dirección creativa de lujo editorial sin rediseñar toda la web ni tocar lógica  
**Base:** BAGCLUE_CREATIVE_DIRECTION.md  
**Estado:** ⏳ PENDIENTE DE APROBACIÓN

---

## OBJETIVO GENERAL

Transformar Bagclue de tienda funcional a **boutique editorial de lujo** aplicando los principios de la dirección creativa en áreas clave: hero, header/nav, tipografía global, spacing, product cards y uso del fucsia.

**No rediseñar toda la web.** Solo refinar componentes críticos que impactan la primera impresión.

---

## ALCANCE DE ESTA FASE

### ✅ Incluido
1. Hero editorial refinado
2. Header/nav más limpio
3. Tipografía global más fina
4. Spacing premium en landing
5. Product cards más elegantes
6. Reducir uso excesivo del fucsia

### ❌ NO Incluido (fases futuras)
- Detalle de producto (Fase 2E)
- Checkout/carrito (Fase 2F)
- Footer completo (Fase 2G)
- Páginas secundarias (apartado, nosotros, etc.)
- Fotografía profesional de hero
- Backend/lógica/Supabase

---

## 1. HERO EDITORIAL REFINADO

### Objetivo
Que el hero se sienta como portada editorial de revista de lujo, no como hero genérico de e-commerce.

### Estado Actual
```
Hero con:
- Gradiente rosa/amarillo decorativo
- Título: "TU PRÓXIMA PIEZA DE LUJO EMPIEZA AQUÍ"
- Párrafo descriptivo
- 2 botones: "Ver Catálogo" + otro
- Decoraciones circulares con blur
```

**Sensación:** Funcional pero no editorial. Demasiado decorativo.

### Propuesta Editorial

#### Fondo
**NO usar foto de producto** hasta tener sesión profesional.

**Usar:**
- Fondo marfil sólido: `#FFFBF8` o `#FFF9F5`
- O crema muy sutil: `#F5F1ED`
- O degradado sutilísimo warm white → crema (casi imperceptible)

**Eliminar:**
- Círculos decorativos con blur
- Gradientes rosa/amarillo prominentes
- Efectos visuales competitivos

**Resultado:** Fondo limpio, elegante, que no compite con el copy.

#### Copy

**Opción A (recomendada):**
```
Título: Bolsas de lujo,
       seleccionadas con intención.
```

**Opción B (alternativa):**
```
Título: Tu próxima pieza de lujo
       empieza aquí
```

**Subtexto:**
```
Una curaduría de piezas auténticas y deseadas 
para quienes entienden el lujo desde la elegancia y la intención.
```

**Características:**
- Título: Playfair 72-96px desktop, 42-52px mobile
- Subtexto: Inter 18-20px, line-height 1.6, color `#0B0B0B` con 70% opacity
- Tracking tight en título
- Copy centrado
- Máximo 2 líneas de título

#### CTAs

**Solo 2 botones máximo:**

1. **Primario:** "Explorar colección" → `/catalogo`  
   - Fucsia: `#E85A9A`
   - Inter uppercase
   - Tracking 0.10em
   - Padding generoso
   - Sombra sutil

2. **Secundario (opcional):** "Asesoría privada" → Instagram o WhatsApp  
   - Outline/ghost style
   - Border fucsia
   - Texto fucsia
   - Sin fondo sólido

**Spacing:** Gap de 24px entre botones (flex gap-6)

#### Composición

```
┌────────────────────────────────────────┐
│                                        │
│         (espacio superior)             │
│                                        │
│      Bolsas de lujo,                   │
│   seleccionadas con intención.         │
│                                        │
│   Una curaduría de piezas auténticas  │
│   y deseadas para quienes entienden    │
│   el lujo desde la elegancia...        │
│                                        │
│   [Explorar colección] [Asesoría]     │
│                                        │
│         (espacio inferior)             │
│                                        │
└────────────────────────────────────────┘
```

**Ratio vertical:** 60% espacio / 40% contenido

#### Altura

- **Desktop:** `min-h-[85vh]` o `min-h-[90vh]` (no 100vh, dejar ver siguiente sección)
- **Mobile:** `min-h-[70vh]`

**Razón:** Hero muy alto (100vh) obliga a scroll para ver productos. Queremos que el usuario intuya que hay contenido abajo.

---

## 2. HEADER / NAV MÁS LIMPIO

### Objetivo
Que el header parezca más **maison de lujo** que tienda genérica.

### Estado Actual
```
- Announcement bar: existe, puede ser muy alto
- Logo: BAGCLUE (Playfair, tracking 0.3em)
- Nav links: tracking 0.16em, funcional
- Mega menú: funcional pero puede sentirse denso
```

### Ajustes Propuestos

#### Announcement Bar (Top Bar)
**SI existe:**
- Hacerlo más fino y discreto
- Altura máxima: 40px
- Fondo: marfil `#FFFBF8` o crema `#F5F1ED`
- Texto: Inter 13px, color charcoal con 60% opacity
- Solo 1 mensaje corto: "Autenticidad verificada por Entrupy" o "Envíos seguros a todo México"
- Sin animaciones de scroll

**SI no existe:** No agregarlo a menos que sea crítico.

#### Logo
**Mantener:**
- Playfair Display
- "BAGCLUE"
- Tracking elegante

**Ajustar:**
- Tamaño: 20-22px (actualmente 24px puede ser grande)
- Color: `#0B0B0B`
- Hover: `#E85A9A` (transición suave 300ms)

#### Nav Links
**Ajustar:**
- Tracking: mantener `0.16em` (ya implementado)
- Tamaño: 14px
- Uppercase
- Color: `#6B7280` (gray-600)
- Hover: `#E85A9A` (fucsia solo en hover)
- Active: `#E85A9A`
- Spacing: gap de 32-40px entre links (más aire)

**NO usar:**
- Fucsia en estado normal
- Subrayado grueso
- Fondos de link

#### Mega Menú
**Ajustes mínimos (sin rediseñar):**
- Background: mantener marfil `#FFFBF8`
- Border: mantener sutil `#E85A9A` con 18% opacity
- Títulos columnas: Inter 11px uppercase, tracking 0.20em, color charcoal
- Links: Inter 15px, color `#4B5563`, hover `#E85A9A`
- Padding: mantener generoso (40px)
- Grid gap: mantener 56px

**NO tocar lógica de hover/timer.**

#### Altura Total del Header
**Objetivo:** Reducir altura visual si está pesado.

**Actual:** ~86px nav + ~48px announcement = 134px total  
**Ideal:** ~70px nav + ~40px announcement = 110px total

**Aplicar:**
- Padding vertical del nav: `py-4` o `py-5` (16-20px)
- Logo: 20-22px
- Nav links: 14px
- Announcement bar: max 40px

---

## 3. TIPOGRAFÍA GLOBAL MÁS FINA

### Objetivo
Aplicar sistema tipográfico premium consistente en toda la web pública.

### Reglas (ya documentadas en TYPOGRAPHY_SCOPE.md)

**Playfair Display:**
- Hero: 72-96px desktop, 42-52px mobile
- Section titles: 48-60px desktop, 32-40px mobile
- Product detail title: 36-48px
- Tracking: -0.02em a 0.02em (tight)
- Line-height: 1.1-1.2

**Inter:**
- Nav: 14-15px, tracking 0.16em máximo
- Botones: 14-16px, tracking 0.10em
- Body: 16px, tracking normal
- Precios: 18-20px, bold
- Labels: 11-13px, uppercase

### Aplicar a

**Landing:**
- ✅ Hero (ya implementado parcialmente)
- ✅ Títulos de sección (Playfair)
- ✅ Párrafos (Inter)
- ✅ Botones (Inter)
- ✅ Product cards (Inter)

**Catálogo:**
- ✅ Header (Playfair)
- ✅ Filtros (Inter)
- ✅ Product cards (Inter)

**Global:**
- Nav (Inter) ✅
- Footer (Inter) - Fase 2G
- Formularios (Inter) - según necesidad

---

## 4. SPACING PREMIUM EN LANDING

### Objetivo
Dar más respiración visual. Evitar sensación de densidad o marketplace masivo.

### Principio
**Más espacio entre secciones = más lujo percibido.**

### Ajustes Específicos

#### Entre Secciones
**Actual:** Variable, puede ser ~60-80px  
**Ideal:** 120-160px desktop, 80-100px mobile

**Aplicar:**
```tsx
// Wrapper de sección
<section className="py-20 md:py-32 lg:py-40">
  {/* py-20 = 80px mobile */}
  {/* py-32 = 128px tablet */}
  {/* py-40 = 160px desktop */}
</section>
```

#### Padding Interno de Secciones
**Actual:** `px-6`  
**Ideal:** `px-6 md:px-8 lg:px-12` + max-w con más margen

**Aplicar:**
```tsx
<div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
```

#### Product Grid
**Actual:** `gap-6` (24px)  
**Ideal:** `gap-8 md:gap-10` (32-40px desktop)

**Aplicar:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
```

#### Títulos de Sección
**Spacing arriba/abajo:**
```tsx
<h2 className="mb-12 md:mb-16">Título</h2>
<!-- 48-64px de margen inferior -->
```

---

## 5. PRODUCT CARDS MÁS ELEGANTES

### Objetivo
Cards minimalistas que se sientan boutique, no marketplace.

### Estado Actual (ProductCard.tsx)
```
- Fondo negro (#0B0B0B)
- Imagen con gradient overlay
- Info en fondo negro
- Marca: Inter 11px uppercase
- Nombre: Inter 16px semibold
- Precio: Inter 18px bold rosa
- Múltiples badges (status, entrupy, especial)
```

**Sensación:** Funcional pero puede ser más refinado.

### Propuesta Editorial

#### Estructura Ideal

```
┌─────────────────────┐
│                     │
│                     │
│      IMAGEN         │
│    (dominante)      │
│                     │
│                     │
├─────────────────────┤
│ CHANEL              │ ← 11px uppercase
│ Classic Flap Negro  │ ← 16px semibold
│ $85,000             │ ← 18px bold rosa
│                     │
│ [Ver pieza →]       │ ← CTA discreto (hover)
└─────────────────────┘
```

#### Cambios Específicos

**Fondo del card:**
- **Opción A:** Mantener negro `#0B0B0B` (contraste premium)
- **Opción B:** Cambiar a blanco `#FFFFFF` con border sutil `#E8E4E0`

**Decisión:** Mantener negro PERO reducir peso visual de badges.

**Imagen:**
- Aspect ratio: mantener `3/4`
- Ocupa: 70-75% del card total
- Hover: `scale(1.03)` suave (300ms ease)
- Sin overlay negro agresivo

**Info:**
- Padding: `p-5` o `p-6` (20-24px, más aire)
- Marca: Inter 11px uppercase tracking-[0.20em], color rosa con 70% opacity
- Nombre: Inter 15-16px semibold, color blanco, line-height 1.4
- Precio: Inter 18px bold, color rosa `#E85A9A`

**Badges:**
**Reducir cantidad.**

**Permitir solo:**
1. Badge autenticidad (Entrupy) - top right, pequeño
2. Badge status (disponible/apartada) - top left, solo si NO es disponible

**Eliminar:**
- Badge "especial" redundante
- Badges decorativos
- Múltiples etiquetas compitiendo

**Estilo de badge:**
- Tamaño pequeño: `px-2 py-1 text-[10px]`
- Fondo: semi-transparente `bg-white/90` o `bg-black/80`
- Bordes redondeados: `rounded-full`
- Sin sombras fuertes

**CTA "Ver pieza":**
**Aparecer en hover:**
```tsx
<div className="absolute inset-0 bg-white/60 opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
  <span className="text-xs tracking-widest uppercase text-[#E85A9A] border border-[#E85A9A]/50 px-4 py-2 bg-white/80">
    Ver pieza
  </span>
</div>
```

**Mantener CTA discreto, no dominante.**

#### Hover State
```css
transition: transform 300ms ease;

&:hover {
  transform: scale(1.02);
  /* O: */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

**NO usar:**
- Scale >1.05
- Bounce effects
- Rotaciones
- Cambios de color agresivos

---

## 6. FUCSIA COMO ACENTO (REGLA ESTRICTA)

### Principio
**Fucsia como acento, NO como bloque dominante.**

Color: `#E85A9A`  
Uso visual: Máximo 5% de la superficie visual total

### ✅ USAR FUCSIA EN:

1. **CTAs principales**
   - Solo 1-2 botones primarios por página
   - Fondo fucsia sólido
   - Texto blanco
   - Ejemplo: "Explorar colección", "Agregar al carrito"

2. **Hover states**
   - Nav links hover
   - Links hover en body
   - Icons hover
   - Card hover accents

3. **Líneas finas**
   - Borders 1px con opacity 15-20%
   - Separadores decorativos sutiles
   - Underlines hover
   - Dividers

4. **Precio destacado**
   - Precio en product card
   - Precio en detalle producto
   - Total en carrito
   - Bold, tamaño destacado

5. **Indicador activo**
   - Nav link activo
   - Tab activo
   - Step indicator activo
   - Badge importante (1 por contexto)

### ❌ NO USAR FUCSIA EN:

1. **Fondos grandes**
   - NO fondos de sección completa
   - NO backgrounds de hero
   - NO overlays fucsia sobre imágenes
   - NO degradados fucsia prominentes

2. **Demasiados badges**
   - Máximo 1-2 badges fucsia simultáneos
   - NO múltiples etiquetas fucsia compitiendo
   - NO badges decorativos fucsia

3. **Demasiado texto**
   - NO párrafos en fucsia
   - NO títulos grandes en fucsia
   - NO body text en fucsia
   - Solo short copy estratégico (precio, label)

4. **Múltiples botones simultáneos**
   - Solo 1 botón fucsia primario por sección
   - Resto: outline/ghost/secondary
   - NO 3-4 botones fucsia juntos

### Validación Rápida

**Si una sección tiene fucsia en >2 elementos → reducir.**

Ejemplo correcto:
```
Sección:
- 1 botón fucsia (CTA)
- 1 precio fucsia
- Rest: neutral colors
✅ PASS
```

Ejemplo incorrecto:
```
Sección:
- 3 botones fucsia
- 2 badges fucsia
- Border fucsia grueso
- Título fucsia
❌ FAIL - demasiado fucsia
```

---

## 7. CONFIANZA Y APARTADO (EVOLUCIÓN FUTURA)

### Objetivo
Documentar cómo deben evolucionar estas secciones sin implementar en esta fase.

### Confianza
**Mensaje central:** "Lujo auténtico, respaldado por confianza real."

**Evolución futura (Fase 2E+):**
- Layout más editorial (menos iconos genéricos)
- Copy refinado que comunique valor sin sonar corporativo
- Testimonios reales (si existen)
- Certificaciones discretas (Entrupy, envío seguro)
- Spacing premium
- Fondo marfil o crema

**Esta fase:**
- Solo ajustes tipográficos mínimos si ya están dentro del sistema
- NO rediseñar layout
- NO crear nueva sección

### Apartado
**Mensaje central:** "Tu próxima pieza, a tu ritmo."

**Evolución futura (Fase 2E+):**
- Copy más emocional y aspiracional
- Visual más boutique (menos instructivo)
- Pasos con diseño premium
- CTA refinado
- Fondo alternado

**Esta fase:**
- Solo ajustes tipográficos mínimos si ya están
- NO rediseñar sección apartado
- NO crear página `/apartado` nueva

---

## 8. ALTERNAR FONDOS (RITMO VISUAL)

### Objetivo
Evitar uniformidad blanca. Crear respiración alternando fondos.

### Secuencia Landing

```
1. Hero
   Background: marfil #FFFBF8
   
2. Recién Llegadas (product grid)
   Background: blanco #FFFFFF
   
3. Comprar por Marca (editorial grid)
   Background: crema #F5F1ED
   
4. Comprar por Categoría (editorial grid)
   Background: blanco #FFFFFF
   
5. Confianza (iconos + copy)
   Background: marfil #FFFBF8
   
6. Apartado (CTA)
   Background: crema #FAF8F5
   
7. Asesoría (CTA final)
   Background: blanco #FFFFFF o marfil
```

**Patrón:** Blanco → Crema → Blanco → Marfil (alternar)

### Implementación

```tsx
<section className="bg-white py-20 md:py-32">
  {/* Producto */}
</section>

<section className="bg-[#F5F1ED] py-20 md:py-32">
  {/* Editorial */}
</section>

<section className="bg-white py-20 md:py-32">
  {/* Producto */}
</section>
```

---

## RUTAS A CONSIDERAR

### ✅ Esta Fase (2D)
1. **`/` (Landing)**
   - Hero editorial
   - Spacing premium
   - Product cards elegantes
   - Alternar fondos
   - Reducir fucsia

2. **`/catalogo`**
   - Header refinado
   - Filtros con tipografía consistente
   - Product cards consistentes
   - Spacing mejorado

3. **`/catalogo/[slug]` (Detalle Producto)**
   - Solo ajustes tipográficos básicos (Playfair título, Inter precio/specs)
   - NO rediseño completo (Fase 2E)

### ❌ NO Tocar Esta Fase
- `/cart` - salvo clases tipográficas mínimas si ya están en el sistema
- `/checkout/*` - no tocar
- `/apartado` - no rediseñar (solo doc evolución futura)
- `/nosotros`, `/contacto`, `/paris` - opcionales, solo si tiempo sobra

---

## ARCHIVOS A MODIFICAR

### Componentes Principales
- [ ] `src/app/page.tsx` (landing hero + sections + spacing)
- [ ] `src/components/Navbar.tsx` (header refinement + announcement bar)
- [ ] `src/components/ProductCard.tsx` (elegance + reduce badges + fucsia)
- [ ] `src/app/catalogo/page.tsx` (header + filtros + spacing)
- [ ] `src/app/catalogo/[slug]/page.tsx` (tipografía básica, NO rediseño)

### Posibles Ajustes Globales
- [ ] `src/app/globals.css` (si necesitamos utilities reutilizables)

### ❌ NO TOCAR

#### Backend / DB / Lógica
- ❌ Backend
- ❌ DB schema
- ❌ Supabase queries (salvo SELECT de campos ya existentes si hace falta)
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Checkout logic
- ❌ Orders logic
- ❌ Inventario
- ❌ RLS policies
- ❌ Migrations

#### Páginas / Componentes Específicos
- ❌ Admin panel (`/admin/*`)
- ❌ Customer panel backend
- ❌ `/cart` (salvo tipografía mínima)
- ❌ `/checkout/*` (salvo tipografía mínima)
- ❌ Footer completo (Fase 2G)
- ❌ Formularios complejos (contact, apartado forms)

#### Solo UI/CSS/Componentes Públicos
✅ Modificar: Clases Tailwind, componentes React, layout visual, tipografía, spacing, colores

---

## CRITERIOS DE CIERRE

### Visual QA Desktop (Obligatorio)

#### Hero
- [ ] Fondo marfil/crema limpio (`#FFFBF8` o `#F5F1ED`)
- [ ] Sin círculos decorativos blur
- [ ] Sin gradiente rosa/amarillo prominente
- [ ] Título Playfair 60-72px, tracking tight, NO cortado
- [ ] Copy: "Bolsas de lujo, seleccionadas con intención" o aprobado
- [ ] Subtexto Inter 18-20px, opacity 70%
- [ ] Solo 1-2 CTAs (primario fucsia + secundario outline)
- [ ] Altura `min-h-[85vh]` (no 100vh)
- [ ] Composición: 60% espacio / 40% contenido

#### Navbar
- [ ] Logo 20-22px (no 24px)
- [ ] Nav links: gap 32-40px (más aire)
- [ ] Tracking `0.16em` (no widest)
- [ ] Fucsia SOLO en hover/active
- [ ] Announcement bar (si existe): max 40px altura

#### Product Cards
- [ ] Padding info: `p-5` o `p-6` (más aire)
- [ ] Máximo 2 badges visibles
- [ ] Hover scale: 1.02-1.03 (no 1.05+)
- [ ] CTA "Ver pieza" discreto en hover
- [ ] Precio fucsia bold destacado

#### Spacing
- [ ] Entre secciones: 120-160px desktop (py-32 o py-40)
- [ ] Product grid: gap 32-40px (gap-8 o gap-10)
- [ ] Títulos sección: mb-12 md:mb-16

#### Fondos
- [ ] Alternancia blanco → crema → blanco → marfil
- [ ] Secuencia clara de ritmo visual
- [ ] NO uniformidad de color

#### Fucsia
- [ ] Fucsia en máximo 1-2 elementos por sección
- [ ] Solo en: CTA primario, hover, precio, línea fina
- [ ] NO en: fondos grandes, múltiples badges, textos largos
- [ ] Validación: <5% superficie visual total

---

### Visual QA Mobile (Obligatorio)

- [ ] Hero: título 42-52px, NO cortado, legible
- [ ] Spacing entre secciones: 80-100px (py-20)
- [ ] Product cards: texto NO apretado, info legible
- [ ] Nav mobile: funcional, tracking correcto
- [ ] CTAs: tamaño tocable (min 44px altura)
- [ ] Fondos alternados visibles

---

### Técnico (Obligatorio)

- [ ] `npm run build` PASS (37/37 rutas)
- [ ] Deploy production exitoso
- [ ] No errores en consola browser
- [ ] No errores TypeScript
- [ ] No warnings críticos
- [ ] Backend/DB/Supabase NO tocados
- [ ] Checkout/Orders logic NO tocado

---

### Experiencia (Validación Subjetiva)

**Pregunta 1:** ¿Se siente como boutique o como marketplace?
- [ ] ✅ Boutique curada
- [ ] ❌ Marketplace genérico

**Pregunta 2:** ¿El fucsia es acento escaso o dominante?
- [ ] ✅ Acento escaso (5% visual)
- [ ] ❌ Demasiado prominente

**Pregunta 3:** ¿El hero comunica "lujo editorial"?
- [ ] ✅ Sí, portada de revista premium
- [ ] ❌ No, hero genérico de e-commerce

**Pregunta 4:** ¿El spacing se siente premium?
- [ ] ✅ Generoso, respira
- [ ] ❌ Apretado, denso

**Pregunta 5:** ¿Las product cards son refinadas?
- [ ] ✅ Minimalistas y elegantes
- [ ] ❌ Cargadas o Amazon-style

**Si 4/5 preguntas = ✅ → PASS**  
**Si 3/5 o menos = ❌ → Revisar**

---

### Checklist de Entrega

- [ ] Commit(s) incrementales con mensajes claros
- [ ] Build PASS local
- [ ] Deploy production exitoso
- [ ] Documento entrega: `WEB_POLISH_FASE2D_ENTREGA.md`
- [ ] Screenshots antes/después (hero, nav, cards)
- [ ] Confirmación áreas NO tocadas
- [ ] URLs de prueba: `/`, `/catalogo`, `/catalogo/[slug]`

---

## NO HACER (RESTRICCIONES INQUEBRANTABLES)

### ❌ Backend / Base de Datos / Lógica
- ❌ NO tocar backend
- ❌ NO modificar DB schema
- ❌ NO cambiar Supabase queries (salvo SELECT de campos existentes si necesario)
- ❌ NO tocar Stripe integration
- ❌ NO modificar webhook handlers
- ❌ NO cambiar checkout logic
- ❌ NO modificar orders logic
- ❌ NO tocar inventario
- ❌ NO cambiar RLS policies
- ❌ NO crear/modificar migrations

### ❌ Páginas / Componentes Protegidos
- ❌ NO rediseñar admin panel (`/admin/*`)
- ❌ NO tocar customer panel backend
- ❌ NO rediseñar `/cart` completo (solo tipografía mínima si ya en sistema)
- ❌ NO rediseñar `/checkout/*` (solo tipografía mínima si ya en sistema)
- ❌ NO rediseñar footer completo (Fase 2G)
- ❌ NO rediseñar formularios complejos (contact, apartado forms)
- ❌ NO rediseñar sección "Confianza" completo
- ❌ NO rediseñar sección "Apartado" completo (solo doc evolución)

### ❌ Alcance / Contenido
- ❌ NO rediseñar toda la web - Solo hero, nav, cards, spacing landing
- ❌ NO usar foto real de producto en hero - Esperar sesión profesional
- ❌ NO crear páginas nuevas - Solo refinar existentes
- ❌ NO cambiar copy sin consultar - Usar copy recomendado en scope
- ❌ NO agregar funcionalidad nueva - Solo refinar UI existente
- ❌ NO implementar antes de aprobación - Esperar OK explícito de Jhonatan

### ❌ Cambios de Lógica
- ❌ NO cambiar lógica de filtros catálogo - Solo UI
- ❌ NO modificar flow de checkout
- ❌ NO cambiar validaciones
- ❌ NO modificar flujo de apartado
- ❌ NO tocar autenticación
- ❌ NO cambiar manejo de errores

### ✅ LO ÚNICO PERMITIDO
- ✅ Modificar clases Tailwind en componentes públicos
- ✅ Ajustar layout visual (spacing, fondos, tipografía)
- ✅ Refinar componentes React (sin cambiar props/lógica)
- ✅ Agregar/modificar estilos CSS
- ✅ Reorganizar orden visual de elementos (sin eliminar funcionalidad)
- ✅ Optimizar copy hero (con copy aprobado en scope)  

---

## CAMBIOS EXACTOS POR SECCIÓN

### 1. Hero Landing (`src/app/page.tsx`)

**Clases a cambiar:**
```tsx
// Fondo
- Eliminar: círculos decorativos blur, gradiente rosa/amarillo
- Agregar: bg-[#FFFBF8] o bg-[#F5F1ED]

// Título
- Cambiar: text-5xl md:text-6xl lg:text-7xl
- Agregar: leading-tight tracking-tight
- Copy: "Bolsas de lujo, seleccionadas con intención."

// Párrafo
- Agregar: font-[family-name:var(--font-inter)]
- Cambiar: text-lg md:text-xl text-[#0B0B0B]/70
- Copy sugerido incluido

// Botones
- Primario: mantener fucsia, ajustar tracking-wide
- Secundario: outline/ghost style
- Reducir de 3-4 a máximo 2

// Altura
- Cambiar: min-h-screen → min-h-[85vh]
```

### 2. Navbar (`src/components/Navbar.tsx`)

**Clases a cambiar:**
```tsx
// Container
- Reducir py-5 → py-4 (si está muy alto)

// Logo
- Mantener Playfair
- Reducir: text-2xl → text-xl (si está grande)

// Nav links
- Mantener: tracking-[0.16em]
- Agregar gap mayor: gap-8 → gap-10 md:gap-12

// Announcement bar (si existe)
- Altura: max 40px
- Fondo: bg-[#FFFBF8]
- Texto: text-xs md:text-sm, opacity 60%
```

### 3. ProductCard (`src/components/ProductCard.tsx`)

**Clases a cambiar:**
```tsx
// Info padding
- Cambiar: p-4 → p-5 o p-6

// Marca
- Mantener: text-xs tracking-[0.20em]
- Ajustar color: text-[#E85A9A]/70

// Badges
- Reducir cantidad: máximo 2 visibles
- Tamaño: px-2 py-1 text-[10px]

// Hover overlay
- Ajustar: "Ver pieza" CTA discreto
- Transition: duration-500

// Hover transform
- Cambiar: group-hover:scale-105 → group-hover:scale-102
```

### 4. Spacing Landing (`src/app/page.tsx`)

**Clases a cambiar:**
```tsx
// Secciones
- Cambiar: py-16 → py-20 md:py-32 lg:py-40

// Product grid
- Cambiar: gap-6 → gap-8 md:gap-10

// Títulos de sección
- Agregar: mb-12 md:mb-16
```

### 5. Fondos Alternados (`src/app/page.tsx`)

**Clases a agregar:**
```tsx
// Sección 1 (Hero)
bg-[#FFFBF8]

// Sección 2 (Productos)
bg-white

// Sección 3 (Editorial)
bg-[#F5F1ED]

// Sección 4 (Confianza)
bg-[#FFFBF8]

// Patrón: alternar
```

### 6. Catálogo (`src/app/catalogo/page.tsx`)

**Clases a cambiar:**
```tsx
// Header title
- Mantener: Playfair text-4xl md:text-5xl
- Agregar: leading-tight tracking-tight

// Product grid
- Cambiar: gap-6 → gap-8 md:gap-10

// Padding sección
- Cambiar: py-24 → py-20 md:py-32
```

### 7. Detalle Producto (`src/app/catalogo/[slug]/page.tsx`)

**Solo tipografía básica:**
```tsx
// Marca
- Inter text-xs uppercase tracking-widest text-[#E85A9A]

// Título
- Playfair text-4xl md:text-5xl leading-tight tracking-tight

// Precio
- Inter text-3xl md:text-4xl font-bold text-[#E85A9A]

// Specs
- Inter text-base leading-relaxed
```

**NO rediseñar layout completo.**

---

## ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Fase 1: Fundamentos (1h)
1. Hero editorial (fondo + copy + CTAs)
2. Navbar refinement (spacing + announcement bar)
3. Commit: "feat(editorial): Hero + nav refinement"

### Fase 2: Componentes (1h)
4. ProductCard elegante (badges + hover + fucsia)
5. Spacing landing (py + gap)
6. Commit: "feat(editorial): Product cards + spacing premium"

### Fase 3: Fondos y Detalles (1h)
7. Alternar fondos secciones
8. Reducir fucsia en landing
9. Catálogo ajustes
10. Commit: "feat(editorial): Fondos alternados + fucsia acento"

### Fase 4: QA y Polish (30-60min)
11. Testing desktop
12. Testing mobile
13. Fixes menores
14. Commit final + deploy

**Total estimado:** 3-4 horas

---

## RIESGOS Y MITIGACIONES

### Riesgo Bajo ✅
- Solo UI/CSS, no toca lógica
- Cambios incrementales con commits
- Build fácil de validar (37/37 rutas)

### Riesgo Potencial ⚠️

**1. Hero muy diferente puede confundir usuarios recurrentes**
- Mitigación: Mantener estructura similar, solo refinar estética
- Copy sigue siendo claro y directo

**2. Reducir badges puede afectar confianza visual (Entrupy)**
- Mitigación: Mantener badge Entrupy, solo reducir badges decorativos

**3. Spacing muy grande puede alargar scroll en mobile**
- Mitigación: Usar responsive spacing (py-20 mobile, py-40 desktop)

**4. Fondos alternados pueden requerir ajuste de contraste**
- Mitigación: Testear que textos sean legibles en crema/marfil

### Riesgo Nulo ❌
- Backend: NO se toca
- DB: NO se toca
- Checkout/Orders: NO se toca

---

## ESTIMACIÓN DETALLADA

**Complejidad:** Media  
**Tiempo total:** 3-4 horas (implementación + QA + deploy)  
**Riesgo técnico:** Bajo  
**Riesgo visual:** Medio (cambio perceptible, requiere validación)

**Desglose:**
- Hero editorial: 60-90 min
- Nav refinement: 30-45 min
- Product cards elegantes: 45-60 min
- Spacing landing: 30-45 min
- Fondos alternados: 30 min
- Reducir fucsia: 20-30 min
- Catálogo ajustes: 20-30 min
- Testing desktop: 20 min
- Testing mobile: 15 min
- Fixes + deploy: 20-30 min

**Commits esperados:** 3-4 commits incrementales

---

## RESUMEN EJECUTIVO

### Alcance Fase 2D
1. ✅ Hero editorial (fondo marfil, copy refinado, 1-2 CTAs)
2. ✅ Nav premium (más aire, fucsia hover only)
3. ✅ Product cards elegantes (minimal, 2 badges max)
4. ✅ Spacing premium (120-160px desktop, 80-100px mobile)
5. ✅ Fondos alternados (blanco/crema/marfil)
6. ✅ Fucsia acento estricto (5% visual, solo CTA/hover/precio)

### Rutas
- `/` (landing) - completo
- `/catalogo` - ajustes consistentes
- `/catalogo/[slug]` - tipografía básica solamente

### NO Incluido
- Rediseño `/cart`, `/checkout`
- Rediseño completo confianza/apartado
- Footer completo
- Backend/DB/lógica

### Estimación
- 3-4 horas implementación + QA
- 3-4 commits incrementales
- Riesgo: Bajo

### Principios Guía
- Lujo editorial boutique
- Fucsia acento escaso
- Spacing generoso
- Tipografía solo Playfair + Inter
- Eliminar ruido visual

---

## ⏸️ ESTADO: PENDIENTE DE APROBACIÓN

**NO implementar hasta recibir confirmación explícita de Jhonatan.**

Una vez aprobado:
1. Kepler implementa cambios incrementales (4 fases)
2. Commit por área (hero, nav, cards, fondos)
3. Build local + deploy production
4. QA visual desktop + mobile
5. Entrega: `WEB_POLISH_FASE2D_ENTREGA.md`
6. Screenshots antes/después
7. URLs de prueba con validación

---

**Fase siguiente:** 2E - Product Detail Premium (detalle de producto refinado + confianza/apartado)

---

**Scope creado por:** Kepler  
**Fecha:** 2026-05-06 12:35 UTC  
**Base:** BAGCLUE_CREATIVE_DIRECTION.md (auditoría profesional)  
**Versión:** 1.0 Final
