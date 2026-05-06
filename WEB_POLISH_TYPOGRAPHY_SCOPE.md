# WEB POLISH — TYPOGRAPHY SCOPE
**Fecha:** 2026-05-06  
**Objetivo:** Definir y aplicar sistema tipográfico premium para Bagclue (lujo/editorial + legibilidad moderna)

---

## 1. ESTADO TIPOGRÁFICO ACTUAL

### Fuentes Configuradas
```tsx
// layout.tsx
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```

**CSS Variables disponibles:**
- `--font-playfair`
- `--font-inter`

### Uso Actual por Componente

#### Playfair Display (USO ACTUAL)
✅ Ya se usa en:
- Logo nav: `BAGCLUE` (tracking 0.3em, 24px)
- Hero landing: títulos principales (text-5xl → text-8xl)
- Secciones landing: títulos de sección (text-3xl → text-5xl)
- Nosotros: títulos y números grandes
- Apartado: títulos de pasos
- París 2U: títulos de sección
- Contacto: título principal
- Account: títulos de página (text-3xl)
- Layaway: títulos de progreso

#### Inter (USO ACTUAL)
✅ Ya se usa implícitamente como:
- Nav links: `text-sm tracking-widest uppercase`
- Botones: `text-sm tracking-widest uppercase`
- Textos descriptivos: párrafos body
- Formularios: inputs por defecto

#### ❌ Uso Inconsistente
- Algunos títulos usan `font-playfair`, otros no especifican
- Nav usa sintaxis larga: `font-[family-name:var(--font-playfair)]`
- Body text no tiene clase explícita de fuente
- Product cards NO tienen estilos tipográficos definidos
- Catálogo NO tiene jerarquía tipográfica clara

---

## 2. SISTEMA TIPOGRÁFICO DEFINIDO

### Familias Permitidas
1. **Playfair Display** → Editorial/Lujo
2. **Inter** → Moderna/Legible

**Regla:** No más de 2 familias tipográficas en toda la web.

---

### Playfair Display - Uso Definido

**Aplicar en:**
- Hero titles (landing)
- Títulos de sección (h2, h3 grandes)
- Títulos de producto en detalle
- Logo `BAGCLUE`
- Headings editoriales
- Números decorativos grandes

**Tamaños recomendados:**

| Elemento | Desktop | Mobile | Line Height | Letter Spacing |
|----------|---------|--------|-------------|----------------|
| Hero Main | 72–96px (text-7xl/8xl) | 42–52px (text-4xl/5xl) | 1.1 (leading-tight) | 0.02em (tracking-tight) |
| Section H2 | 48–60px (text-5xl) | 32–40px (text-3xl/4xl) | 1.2 (leading-tight) | 0.02em |
| Product Detail Title | 36–48px (text-4xl) | 28–36px (text-3xl) | 1.2 | 0.02em |
| Logo Nav | 24px (text-2xl) | 20px (text-xl) | 1 | 0.3em (actual) |
| Editorial H3 | 24–32px (text-2xl/3xl) | 20–24px (text-xl/2xl) | 1.3 | 0.02em |

**Reglas:**
- Line-height ajustado (1.1–1.3) para evitar cortar textos
- Letter spacing elegante pero NO exagerado (máximo 0.3em para logo)
- Siempre usar `leading-tight` o `leading-snug`
- Color principal: `#0B0B0B` (negro casi puro)

---

### Inter - Uso Definido

**Aplicar en:**
- Navegación (nav links)
- Botones (CTAs, actions)
- Filtros (selects, checkboxes)
- Formularios (inputs, labels)
- Textos descriptivos (párrafos, body)
- Precios en cards
- Cuenta cliente (perfil, órdenes)
- Carrito (items, totales)
- Breadcrumbs
- Labels, badges, tags

**Tamaños recomendados:**

| Elemento | Desktop | Mobile | Weight | Letter Spacing |
|----------|---------|--------|--------|----------------|
| Nav Links | 14–15px (text-sm) | 14px | 400 | 0.16em (tracking-widest) |
| Buttons | 14–15px (text-sm) | 14px | 500/600 (medium/semibold) | 0.10em (tracking-wide) |
| Product Card Brand | 11–12px (text-xs) | 11px | 500 | 0.20em |
| Product Card Name | 15–16px (text-base) | 14px | 600 (semibold) | 0.02em |
| Product Card Price | 18–20px (text-lg) | 16px | 700 (bold) | 0.02em |
| Body Text | 16px (text-base) | 15px | 400 | normal |
| Formularios | 15–16px (text-base) | 15px | 400 | normal |

**Reglas:**
- Nav uppercase con letter-spacing máximo 0.16em (evitar que se vea rígido)
- Buttons uppercase con letter-spacing 0.10em (más compacto)
- Precios siempre bold/semibold para destacar
- Body text weight 400 (regular)
- NO usar letter-spacing en body text (legibilidad)

---

## 3. AJUSTES POR PÁGINA

### `/` (Landing / Home)

#### Estado Actual
- ✅ Hero usa Playfair: `text-5xl md:text-7xl lg:text-8xl`
- ✅ Secciones usan Playfair: `text-3xl md:text-4xl`, `text-4xl md:text-5xl`
- ⚠️ Botones: uppercase pero sin especificar Inter explícitamente
- ⚠️ Body text: sin fuente explícita

#### Cambios Requeridos
1. **Hero:**
   - Mantener Playfair
   - Ajustar: `text-6xl md:text-7xl lg:text-8xl` (mobile más grande)
   - Agregar: `leading-tight tracking-tight`
   
2. **Secciones:**
   - Mantener Playfair en h2
   - Ajustar: `leading-tight tracking-tight`
   
3. **Botones:**
   - Agregar explícitamente: `font-[family-name:var(--font-inter)]`
   - Mantener: `uppercase tracking-wide font-medium`
   
4. **Body text:**
   - Agregar: `font-[family-name:var(--font-inter)]` en párrafos
   - Tamaño: `text-base md:text-lg`

5. **Product Cards (featured):**
   - Ver sección ProductCard

---

### `/catalogo` (Catálogo)

#### Estado Actual
- ✅ Header usa Playfair: `text-4xl md:text-5xl`
- ⚠️ Filtros: sin fuente explícita
- ⚠️ Product cards: ProductCard component (revisar)

#### Cambios Requeridos
1. **Header:**
   - Mantener Playfair
   - Ajustar: `leading-tight tracking-tight`
   
2. **Filtros (selects, search input):**
   - Agregar: `font-[family-name:var(--font-inter)]`
   - Tamaño: `text-sm`
   
3. **Checkboxes labels:**
   - Agregar: `font-[family-name:var(--font-inter)]`
   - Tamaño: `text-sm`
   
4. **Empty state:**
   - Título: Playfair `text-2xl`
   - Párrafo: Inter `text-sm`
   - Botón: Inter uppercase

5. **Product cards:**
   - Ver sección ProductCard

---

### `/catalogo/[slug]` (Detalle de Producto)

#### Estado Actual
- ❌ NO auditado (necesita revisión)

#### Cambios Requeridos
1. **Marca (brand):**
   - Fuente: Inter
   - Tamaño: `text-xs`
   - Estilo: `uppercase tracking-widest`
   - Color: `text-[#E85A9A]`
   - Weight: `font-medium`

2. **Título (product name):**
   - Fuente: Playfair Display
   - Desktop: `text-4xl md:text-5xl`
   - Mobile: `text-3xl`
   - Estilo: `leading-tight tracking-tight`
   - Color: `text-[#0B0B0B]`

3. **Precio:**
   - Fuente: Inter
   - Desktop: `text-3xl md:text-4xl`
   - Mobile: `text-2xl`
   - Estilo: `font-bold`
   - Color: `text-[#E85A9A]`

4. **Specs (descripción, detalles):**
   - Fuente: Inter
   - Tamaño: `text-base`
   - Weight: `font-normal`
   - Color: `text-gray-700`

5. **Botones (Agregar al carrito, Apartar):**
   - Fuente: Inter
   - Tamaño: `text-sm`
   - Estilo: `uppercase tracking-wide font-semibold`

---

### `/cart` (Carrito)

#### Estado Actual
- ❌ NO auditado (necesita revisión)

#### Cambios Requeridos
1. **Título "Carrito":**
   - Fuente: Playfair
   - Tamaño: `text-3xl md:text-4xl`
   - Estilo: `leading-tight tracking-tight`

2. **Nombres de producto:**
   - Fuente: Inter
   - Tamaño: `text-base`
   - Weight: `font-semibold`

3. **Precios:**
   - Fuente: Inter
   - Tamaño: `text-lg`
   - Weight: `font-bold`
   - Color: `text-[#E85A9A]`

4. **Total:**
   - Fuente: Inter
   - Tamaño: `text-2xl`
   - Weight: `font-bold`
   - Color: `text-[#E85A9A]`

5. **Botones:**
   - Fuente: Inter
   - Estilo: `uppercase tracking-wide font-semibold`

---

### `/checkout/success` (Confirmación)

#### Estado Actual
- ✅ Ya usa Playfair en título: `text-4xl md:text-5xl`

#### Cambios Requeridos
1. **Título "¡Compra confirmada!":**
   - Mantener Playfair
   - Ajustar: `leading-tight tracking-tight`
   
2. **Detalles de orden:**
   - Fuente: Inter
   - Tamaño: `text-base`
   
3. **Botones:**
   - Fuente: Inter
   - Estilo: `uppercase tracking-wide font-semibold`

---

## 4. COMPONENTES CLAVE

### ProductCard Component

#### Estado Actual
- ❌ NO tiene estilos tipográficos definidos explícitamente

#### Cambios Requeridos

```tsx
// Estructura visual esperada:

// Marca (badge superior)
<p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.20em] text-gray-500 font-medium">
  {product.brand}
</p>

// Nombre producto
<h3 className="font-[family-name:var(--font-inter)] text-base font-semibold text-gray-900 tracking-tight leading-snug">
  {product.model}
</h3>

// Precio
<p className="font-[family-name:var(--font-inter)] text-lg font-bold text-[#E85A9A] tracking-tight">
  ${product.price.toLocaleString()}
</p>

// Badge status (opcional)
<span className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider font-medium">
  {product.status}
</span>
```

**Variante alternativa (más editorial):**
- Nombre producto: Playfair `text-lg leading-snug` en vez de Inter
- Resto igual

**Decisión:** Usar Inter semibold para mantener legibilidad en grids densos.

---

### Navbar Component

#### Estado Actual
- ✅ Logo usa Playfair: `text-2xl tracking-[0.3em]`
- ⚠️ Nav links: sintaxis larga `text-sm tracking-widest uppercase`

#### Cambios Requeridos
1. **Logo:**
   - Mantener Playfair
   - Mantener `tracking-[0.3em]`

2. **Nav links:**
   - Agregar explícitamente: `font-[family-name:var(--font-inter)]`
   - Mantener: `text-sm uppercase`
   - Ajustar tracking: `tracking-[0.16em]` (en vez de `tracking-widest` que es 0.25em)
   - Weight: `font-normal` (400)

3. **Mobile menu:**
   - Mismo estilo que nav desktop

---

### MegaMenu Component

#### Estado Actual
- Títulos columnas: `text-xs tracking-[0.22em] uppercase`
- Links: `text-[15px]` (sin fuente explícita)

#### Cambios Requeridos
1. **Títulos columnas:**
   - Agregar: `font-[family-name:var(--font-inter)]`
   - Mantener: `text-xs uppercase font-semibold`
   - Ajustar tracking: `tracking-[0.20em]`

2. **Links:**
   - Agregar: `font-[family-name:var(--font-inter)]`
   - Tamaño: `text-base` (16px)
   - Weight: `font-normal`
   - Tracking: `tracking-tight`

---

### Footer Component

#### Estado Actual
- ❌ NO auditado

#### Cambios Requeridos
1. **Títulos secciones:**
   - Fuente: Inter
   - Tamaño: `text-sm`
   - Estilo: `uppercase tracking-[0.16em] font-semibold`

2. **Links:**
   - Fuente: Inter
   - Tamaño: `text-sm`
   - Weight: `font-normal`

3. **Copyright:**
   - Fuente: Inter
   - Tamaño: `text-xs`
   - Weight: `font-normal`

---

## 5. REGLAS GLOBALES

### Sintaxis Unificada

**Playfair Display:**
```tsx
className="font-[family-name:var(--font-playfair)]"
```

**Inter:**
```tsx
className="font-[family-name:var(--font-inter)]"
```

**NO usar:**
- `font-sans` (ambiguo)
- `font-serif` (ambiguo)
- `font-playfair` directo (no existe como utility class)

### Tracking (Letter Spacing)

| Uso | Valor Tailwind | Valor Real |
|-----|----------------|------------|
| Logo Playfair | `tracking-[0.3em]` | 0.3em |
| Headings Playfair | `tracking-tight` | -0.025em |
| Nav Inter | `tracking-[0.16em]` | 0.16em |
| Buttons Inter | `tracking-wide` | 0.025em |
| Body Inter | (none) | 0 |
| Uppercase badges | `tracking-[0.20em]` | 0.20em |

### Line Height

| Uso | Valor Tailwind | Valor Real |
|-----|----------------|------------|
| Hero Playfair | `leading-tight` | 1.25 |
| Headings Playfair | `leading-tight` o `leading-snug` | 1.25–1.375 |
| Body Inter | `leading-normal` o `leading-relaxed` | 1.5–1.625 |
| Nav/Buttons | `leading-none` | 1 |

### Color Palette (Tipografía)

| Uso | Color | Tailwind |
|-----|-------|----------|
| Headings principales | #0B0B0B | `text-[#0B0B0B]` |
| Body text | #374151 | `text-gray-700` |
| Nav links | #6B7280 | `text-gray-600` |
| Nav hover | #E85A9A | `text-[#E85A9A]` |
| Precio destacado | #E85A9A | `text-[#E85A9A]` |
| Labels secundarios | #9CA3AF | `text-gray-400` |

---

## 6. CRITERIOS DE CIERRE

### Build & Deploy
- [x] Build local PASS (37/37 rutas)
- [ ] Deploy production exitoso
- [ ] No errores de fuentes en consola

### Visual QA (Desktop)
- [ ] Hero: Playfair grande, legible, NO cortado
- [ ] Nav: Inter uppercase, spacing correcto, NO rígido
- [ ] Botones: Inter uppercase, legible, peso correcto
- [ ] Product cards: jerarquía clara (marca/nombre/precio)
- [ ] Catálogo: filtros legibles, títulos elegantes
- [ ] Detalle producto: título grande Playfair, precio rosa Inter bold

### Visual QA (Mobile)
- [ ] Hero: Playfair 42–52px, NO cortado
- [ ] Nav mobile: Inter legible
- [ ] Product cards: texto NO apretado
- [ ] Formularios: inputs legibles

### Consistencia
- [ ] Todas las páginas usan solo Playfair + Inter
- [ ] No hay fuentes no declaradas (sans-serif genérica)
- [ ] Sintaxis unificada (`font-[family-name:var(--font-X)]`)
- [ ] Tracking consistente según uso (nav/buttons/headings)

### Accesibilidad
- [ ] Contraste WCAG AA en todos los textos
- [ ] Tamaños mínimos legibles (>14px body)
- [ ] Line-height suficiente para lectura (≥1.5 en body)

---

## 7. ARCHIVOS A MODIFICAR

### Componentes
- [ ] `src/components/Navbar.tsx`
- [ ] `src/components/MegaMenu.tsx`
- [ ] `src/components/Footer.tsx`
- [ ] `src/components/ProductCard.tsx`

### Páginas
- [ ] `src/app/page.tsx` (landing)
- [ ] `src/app/catalogo/page.tsx`
- [ ] `src/app/catalogo/[slug]/page.tsx`
- [ ] `src/app/cart/page.tsx`
- [ ] `src/app/checkout/success/page.tsx`
- [ ] `src/app/nosotros/page.tsx`
- [ ] `src/app/apartado/page.tsx`
- [ ] `src/app/contacto/page.tsx`
- [ ] `src/app/paris/page.tsx`
- [ ] `src/app/account/*.tsx` (profile, orders, addresses)

### Globals (opcional)
- [ ] `src/app/globals.css` (definir utilities reutilizables)

---

## 8. NO TOCAR

✅ Confirmado que NO se modifica:
- Backend
- DB schema
- Supabase queries
- Stripe integration
- Webhooks
- Checkout logic
- Orders system
- Admin panel
- Customer panel backend
- RLS policies
- Migrations

✅ **SOLO se modifica:** UI/CSS/Tipografía (clases Tailwind + fuentes)

---

## 9. PRÓXIMOS PASOS

1. **Jhonatan aprueba el scope** (este documento)
2. **Kepler audita ProductCard y página detalle de producto** (verificar estado actual)
3. **Kepler crea branch `typography-polish`**
4. **Kepler aplica cambios por página** (commits incrementales)
5. **Testing visual local** (cada página)
6. **Build local PASS**
7. **Deploy staging/preview**
8. **Jhonatan valida visualmente**
9. **Deploy production**
10. **QA final en producción**

---

## 10. EJEMPLO VISUAL ESPERADO

### Hero (/)
```
[Playfair 72-96px, leading-tight, tracking-tight]
TU PRÓXIMA PIEZA DE LUJO
EMPIEZA AQUÍ

[Inter 18px, font-normal, leading-relaxed]
Piezas de diseñador seleccionadas, verificadas...

[Inter 14px, uppercase, tracking-wide, font-semibold]
[BOTÓN: VER CATÁLOGO]
```

### Product Card
```
[Inter 11px, uppercase, tracking-[0.20em], font-medium, gray-500]
CHANEL

[Inter 15px, font-semibold, leading-snug, gray-900]
Classic Flap Negro Mediano

[Inter 18px, font-bold, text-[#E85A9A]]
$85,000
```

### Detalle Producto
```
[Inter 12px, uppercase, tracking-widest, font-medium, text-[#E85A9A]]
HERMÈS

[Playfair 48px, leading-tight, tracking-tight, text-[#0B0B0B]]
Birkin 30 Gold Togo

[Inter 36px, font-bold, text-[#E85A9A]]
$285,000

[Inter 16px, font-normal, leading-relaxed, text-gray-700]
Bolsa icónica Hermès Birkin en piel Togo color Gold...
```

---

**Kepler** — 2026-05-06 12:06 UTC
