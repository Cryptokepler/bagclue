# WEB POLISH FASE 2E — PRODUCT DETAIL PREMIUM SCOPE
**Fecha:** 2026-05-06 13:00 UTC  
**Objetivo:** Transformar detalle de producto en experiencia premium editorial de boutique de lujo  
**Base:** BAGCLUE_CREATIVE_DIRECTION.md + Fase 2D completada  
**Estado:** ⏳ PENDIENTE DE APROBACIÓN

---

## OBJETIVO GENERAL

Transformar `/catalogo/[slug]` de página técnica funcional a **experiencia editorial premium** que comunique lujo, confianza y conversión sin perder claridad.

**Sensación actual:** Tabla técnica de e-commerce  
**Sensación objetivo:** Página de producto de boutique editorial de lujo

---

## AUDITORÍA DEL ESTADO ACTUAL

### Archivo principal
**Ruta:** `src/app/catalogo/[id]/page.tsx`

### Layout actual
```
┌────────────────────────────────────────┐
│  Breadcrumb                            │
├──────────────────┬─────────────────────┤
│                  │                     │
│   Imagen         │   Info              │
│   (3:4)          │   - Marca           │
│                  │   - Título          │
│   Badges:        │   - Description     │
│   - Status       │   - Tabla specs     │
│   - Badge        │   - Precio          │
│   - Entrupy      │   - Apartado notice │
│                  │   - CTAs            │
│                  │   - Trust badge     │
│                  │                     │
└──────────────────┴─────────────────────┘
```

**Grid:** `lg:grid-cols-2` (50/50)  
**Gap:** `gap-12`  
**Max-width:** `max-w-6xl`

### Problemas detectados

1. **Layout genérico 50/50** — No da protagonismo a imagen
2. **Tabla de specs demasiado técnica** — 7 filas con borders rosas
3. **Badges en imagen** — 3 badges simultáneos compiten visualmente
4. **Información sin jerarquía clara** — Specs mezcladas con compra
5. **Apartado notice visual pesado** — Border rosa + fondo rosa/5%
6. **Sin galería** — Solo una imagen, no hay thumbnails ni navegación
7. **Spacing inferior apartado** — Se ve cortado/pegado al borde (observación Jhonatan)
8. **Trust badge verde pequeño** — Importante pero discreto al final
9. **No hay secciones editoriales** — Todo se siente tabla técnica

### Fortalezas actuales ✅

- ✅ Tipografía Playfair en título (ya implementado Phase 2D)
- ✅ Marca uppercase rosa pequeña
- ✅ CTAs funcionales (AddToCartButton + LayawayButton)
- ✅ Responsive básico funcional
- ✅ Breadcrumb discreto
- ✅ Related products al final
- ✅ Defensive data handling (avoid objects in render)

---

## DATOS DISPONIBLES

### Campos públicos (PRODUCT_PUBLIC_FIELDS)

**24 campos disponibles:**

#### Básicos
- `id` — ID interno
- `slug` — URL slug
- `title` — Título producto
- `brand` — Marca
- `model` — Modelo (nullable)
- `color` — Color (nullable)
- `origin` — Origen (nullable)

#### Estado y precio
- `status` — available | preorder | reserved | sold | hidden
- `condition` — new | excellent | very_good | good | used
- `price` — Precio (nullable)
- `currency` — Moneda (default MXN)

#### Categorización
- `category` — Categoría
- `badge` — Badge especial (nullable)
- `description` — Descripción (nullable)

#### Publicación
- `is_published` — Publicado
- `stock` — Stock disponible

#### Inclusiones
- `includes_box` — Incluye caja
- `includes_dust_bag` — Incluye dust bag
- `includes_papers` — Incluye papeles/certificados

#### Apartado
- `allow_layaway` — Permite apartado
- `layaway_deposit_percent` — % depósito (default 20)

#### Timestamps
- `created_at` — Fecha creación
- `updated_at` — Última actualización

### Relación product_images
- `id` — ID imagen
- `product_id` — Producto
- `url` — URL imagen
- `alt` — Alt text (nullable)
- `position` — Orden
- `created_at` — Fecha

### Campos NO disponibles (admin only)
❌ `material` — NO existe en schema público  
❌ `condition_notes` — NO existe en schema público  
❌ `included_accessories` — NO existe en schema público  
❌ `authenticity_verified` — NO existe en schema público

**NOTA CRÍTICA:** Los campos mencionados en el brief original (`material`, `condition_notes`, `included_accessories`, `authenticity_verified`) **NO existen en el schema público actual**. La implementación debe trabajar SOLO con campos disponibles.

---

## ESTRUCTURA VISUAL PROPUESTA

### Layout Desktop Premium

```
┌─────────────────────────────────────────────────────────┐
│  Breadcrumb (discreto)                                  │
├────────────────────────────┬────────────────────────────┤
│                            │                            │
│    GALERÍA (55%)           │    INFO (45%)              │
│                            │                            │
│  ┌──────────────────────┐  │  MARCA (rosa small)       │
│  │                      │  │  TÍTULO (Playfair 4xl)     │
│  │   Imagen Principal   │  │  PRECIO (Playfair 3xl)    │
│  │   (aspect 3:4)       │  │                            │
│  │                      │  │  ┌───────────────────────┐ │
│  │                      │  │  │ Trust Badge Entrupy   │ │
│  │                      │  │  └───────────────────────┘ │
│  │                      │  │                            │
│  └──────────────────────┘  │  [CTA Comprar]            │
│                            │  [CTA Apartar] (si aplica) │
│  [thumb][thumb][thumb]     │                            │
│  (si hay múltiples)        │  ────────────────          │
│                            │                            │
│  Badges discretos:         │  SECCIONES EDITORIALES:    │
│  - Status (si NO avail)    │                            │
│  - Entrupy (✓)             │  📦 Detalles de la pieza  │
│                            │  - Marca, modelo, color... │
│                            │                            │
│                            │  ✨ Condición              │
│                            │  - Estado conservación     │
│                            │                            │
│                            │  📋 Qué incluye            │
│                            │  - Box, dust bag, papers   │
│                            │                            │
│                            │  🚚 Envío y apartado       │
│                            │  - Info envío + apartado   │
│                            │                            │
└────────────────────────────┴────────────────────────────┘
```

**Proportions:**
- Galería: 55% (aprox)
- Info: 45% (aprox)
- Max-width: 1440px (aumentado de 1200px para más premium feel)
- Padding: `px-8` desktop (aumentado de `px-6`)
- Gap: `gap-16` (aumentado de `gap-12`)

### Layout Mobile

```
┌──────────────────────────┐
│  Breadcrumb              │
├──────────────────────────┤
│                          │
│  Imagen Principal        │
│  (full width)            │
│                          │
│  [thumb][thumb][thumb]   │
│                          │
├──────────────────────────┤
│  MARCA                   │
│  TÍTULO                  │
│  PRECIO                  │
│                          │
│  Trust Badge Entrupy     │
│                          │
│  [CTA Comprar grande]    │
│  [CTA Apartar]           │
│                          │
├──────────────────────────┤
│  Secciones editoriales   │
│  (stack vertical)        │
│                          │
│  📦 Detalles             │
│  ✨ Condición            │
│  📋 Qué incluye          │
│  🚚 Envío y apartado     │
│                          │
└──────────────────────────┘
```

**Mobile specs:**
- Image: full width, aspect 3:4
- CTAs: `py-4` (grandes, tocables fácil)
- Secciones: stack vertical con spacing `space-y-8`
- Padding: `px-6` mobile

---

## 1. GALERÍA PREMIUM

### Si hay múltiples imágenes (product_images.length > 1)

**Layout:**
```
┌────────────────────────┐
│                        │
│   Imagen Principal     │
│   (aspect 3:4)         │
│                        │
│                        │
└────────────────────────┘
[thumb] [thumb] [thumb] [thumb]
```

**Thumbnails:**
- Position: debajo de imagen principal
- Layout: horizontal scroll si >4 imágenes
- Size: aprox 80px x 80px
- Gap: `gap-3`
- Active thumbnail: border fucsia
- Hover: opacity 80%
- Click: cambia imagen principal con fade transition

**Imagen principal:**
- Aspect ratio: `3/4`
- Background: gradient de marca (mantener)
- Transición: fade 300ms cuando cambia
- Sin zoom avanzado (mantener simple)

### Si hay solo una imagen (product_images.length === 1)

**Layout:**
```
┌────────────────────────┐
│                        │
│   Imagen Principal     │
│   (aspect 3:4)         │
│                        │
│                        │
└────────────────────────┘
```

**Sin thumbnails.** Imagen protagonista sola.

### Si no hay imagen

**Fallback elegante:**
```
┌────────────────────────┐
│                        │
│   MARCA (Playfair)     │
│   (grande, discreto)   │
│                        │
│   "Imagen próximamente"│
│   (Inter, small)       │
│                        │
└────────────────────────┘
```

**Background:** gradient de marca  
**NO mostrar thumbnails vacíos**

### Badges en imagen

**Máximo 2-3 badges visibles:**

1. **Status badge** (solo si NO es "available")
   - Position: `top-4 left-4`
   - Sizes: `px-3 py-1.5 text-xs`
   - Text: "Vendida" | "Apartada" | "Pre-venta"
   - Colors: gray-200 (sold), amber-200 (reserved), blue-200 (preorder)

2. **Autenticidad verificada** (siempre)
   - Position: `top-4 right-4`
   - Text: "✓ Verificada"
   - Size: `text-[10px] px-2.5 py-1.5`
   - Color: emerald-100 bg, emerald-600 text
   - Border: emerald-200

3. **Pieza única** (solo si badge especial existe)
   - Position: `bottom-4 left-4`
   - Text: badge content (ej: "Edición limitada")
   - Size: `text-[10px] px-2.5 py-1.5`
   - Color: rosa/10 bg, rosa text
   - Border: rosa/30

**Principio:** NO saturar con badges. Máximo 3 simultáneos, solo cuando aportan valor real.

---

## 2. INFORMACIÓN PRINCIPAL (Columna derecha)

### Jerarquía visual

```
MARCA (Inter 11px uppercase tracking-[0.20em] rosa/60)
↓
TÍTULO (Playfair 4xl md:5xl tracking-tight)
↓
PRECIO (Playfair 3xl rosa bold) + moneda
↓
TRUST BADGE ENTRUPY (destacado, no al final)
↓
CTAS (Comprar + Apartar si aplica)
↓
SECCIONES EDITORIALES
```

### Marca
```tsx
<p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.20em] text-[#E85A9A]/60">
  {product.brand}
</p>
```

### Título
```tsx
<h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] tracking-tight leading-tight mt-2 mb-6">
  {product.title}
</h1>
```

### Precio
```tsx
<div className="mb-6">
  <span className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#E85A9A]">
    {formatPrice(product.price)}
  </span>
  {!product.price && (
    <p className="text-sm text-[#0B0B0B]/60 mt-2">
      Escríbenos por Instagram para consultar el precio
    </p>
  )}
</div>
```

### Trust Badge Entrupy (destacado ANTES de CTAs)

**Propuesta premium:**
```tsx
<div className="mb-8 p-4 bg-emerald-50 border border-emerald-200/50 rounded-lg">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-emerald-700">Autenticidad verificada</p>
      <p className="text-xs text-emerald-600">Certificado por Entrupy</p>
    </div>
  </div>
</div>
```

**Sensación:** Confianza premium, más prominente que badge discreto al final.

---

## 3. SECCIONES EDITORIALES (Reemplazar tabla técnica)

### Principio
**NO usar tabla de specs con borders.** Usar bloques editoriales con íconos + texto limpio.

### Estructura propuesta

#### A. Detalles de la pieza

```tsx
<div className="mb-8">
  <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
    <span>📦</span> Detalles de la pieza
  </h3>
  <div className="space-y-3 text-sm">
    <div className="flex justify-between">
      <span className="text-[#0B0B0B]/60">Marca</span>
      <span className="text-[#0B0B0B] font-medium">{product.brand}</span>
    </div>
    {product.model && (
      <div className="flex justify-between">
        <span className="text-[#0B0B0B]/60">Modelo</span>
        <span className="text-[#0B0B0B] font-medium">{product.model}</span>
      </div>
    )}
    {product.color && (
      <div className="flex justify-between">
        <span className="text-[#0B0B0B]/60">Color</span>
        <span className="text-[#0B0B0B] font-medium">{product.color}</span>
      </div>
    )}
    {product.origin && (
      <div className="flex justify-between">
        <span className="text-[#0B0B0B]/60">Origen</span>
        <span className="text-[#0B0B0B] font-medium">{product.origin}</span>
      </div>
    )}
    {product.category && (
      <div className="flex justify-between">
        <span className="text-[#0B0B0B]/60">Categoría</span>
        <span className="text-[#0B0B0B] font-medium capitalize">{product.category}</span>
      </div>
    )}
  </div>
</div>
```

**Styling:**
- Sin borders fucsia
- Texto discreto con spacing
- flex justify-between para alineación clean

#### B. Condición

```tsx
<div className="mb-8">
  <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
    <span>✨</span> Condición
  </h3>
  <div className="space-y-2">
    <p className="text-sm">
      <span className="text-[#0B0B0B]/60">Estado: </span>
      <span className="text-[#0B0B0B] font-medium capitalize">
        {product.condition.replace('_', ' ')}
      </span>
    </p>
    {product.description && (
      <p className="text-sm text-[#0B0B0B]/70 leading-relaxed italic">
        {product.description}
      </p>
    )}
  </div>
</div>
```

**Nota:** `condition_notes` NO existe en schema. Usar `description` como descripción general.

#### C. Qué incluye

```tsx
<div className="mb-8">
  <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
    <span>📋</span> Qué incluye
  </h3>
  <ul className="space-y-2 text-sm">
    {product.includes_box && (
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[#0B0B0B]/80">Caja original</span>
      </li>
    )}
    {product.includes_dust_bag && (
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[#0B0B0B]/80">Dust bag</span>
      </li>
    )}
    {product.includes_papers && (
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[#0B0B0B]/80">Papeles y certificados</span>
      </li>
    )}
    {!product.includes_box && !product.includes_dust_bag && !product.includes_papers && (
      <li className="text-[#0B0B0B]/60 italic">Solo la pieza</li>
    )}
  </ul>
</div>
```

**Sensación:** Lista con checkmarks, clara y visual.

#### D. Envío y apartado

```tsx
<div className="mb-8">
  <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
    <span>🚚</span> Envío y apartado
  </h3>
  <div className="space-y-3 text-sm text-[#0B0B0B]/70">
    <div className="flex items-start gap-2">
      <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p>Envío asegurado a todo México</p>
    </div>
    <div className="flex items-start gap-2">
      <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p>Tracking en tiempo real</p>
    </div>
    {product.allow_layaway && (
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p>Apartado disponible con pagos semanales</p>
      </div>
    )}
  </div>
</div>
```

**Sensación:** Información de confianza sin sonar financiero agresivo.

---

## 4. CTAS (Comprar y Apartar)

### Jerarquía por Status

#### Si status = "available"

```tsx
<div className="space-y-3 mb-8">
  {/* CTA principal: Comprar / Agregar al carrito */}
  <AddToCartButton product={...} />
  
  {/* CTA secundario: Apartar con pagos */}
  {product.allow_layaway && (
    <LayawayButton product={...} />
  )}
</div>
```

**Presentación:**
- Botón primario: "Agregar al carrito" (fucsia sólido)
- Botón secundario: "Apartar con pagos" (outline fucsia)
- **NO cambiar lógica**, solo mejorar presentación

#### Si status = "sold"

```tsx
<div className="space-y-3 mb-8">
  {/* Estado vendida - elegante */}
  <div className="w-full border-2 border-gray-200 text-gray-400 py-4 text-center cursor-not-allowed rounded-lg">
    <span className="block text-lg font-medium">Vendida</span>
    <span className="block text-xs mt-1">Esta pieza ya encontró nueva dueña</span>
  </div>
  
  {/* CTA secundario: Ver piezas similares */}
  <Link
    href="/catalogo"
    className="block w-full border-2 border-[#E85A9A]/40 text-[#E85A9A] py-3 text-center hover:bg-[#E85A9A]/5 transition-colors rounded-lg"
  >
    Ver catálogo completo
  </Link>
</div>
```

**Presentación elegante:**
- "Vendida" discreto pero claro
- Mensaje secundario: "Esta pieza ya encontró nueva dueña"
- CTA: "Ver catálogo completo" (no "Ver piezas similares" porque related ya existe)

#### Si status = "reserved" (Apartada)

```tsx
<div className="space-y-3 mb-8">
  {/* Estado apartada */}
  <div className="w-full border-2 border-amber-200 bg-amber-50 text-amber-700 py-4 text-center rounded-lg">
    <span className="block text-lg font-medium">Apartada</span>
    <span className="block text-xs mt-1">Esta pieza está en proceso de apartado</span>
  </div>
  
  {/* CTA: Ver otras piezas */}
  <Link
    href="/catalogo"
    className="block w-full border-2 border-[#E85A9A]/40 text-[#E85A9A] py-3 text-center hover:bg-[#E85A9A]/5 transition-colors rounded-lg"
  >
    Ver otras piezas
  </Link>
</div>
```

**Presentación:**
- Fondo amber suave (no fucsia agresivo)
- Mensaje claro: "en proceso de apartado"
- CTA: "Ver otras piezas"

#### Si status = "preorder"

```tsx
<div className="space-y-3 mb-8">
  {/* Pre-venta */}
  <a
    href="https://ig.me/m/salebybagcluemx"
    target="_blank"
    rel="noopener noreferrer"
    className="block w-full bg-[#E85A9A] text-white py-4 text-center hover:bg-[#EC5C9F] transition-colors rounded-lg"
  >
    Consultar pre-venta por Instagram
  </a>
</div>
```

### Ajustes a componentes existentes

**AddToCartButton:** Ya funciona bien. Solo ajustar colores:
- `bg-[#FF69B4]` → `bg-[#E85A9A]` (usar fucsia estándar)
- `border-[#FF69B4]` → `border-[#E85A9A]`
- `text-[#FF69B4]` → `text-[#E85A9A]`
- Agregar `rounded-lg`

**LayawayButton:** Ya funciona bien. Solo ajustar colores:
- `bg-[#FF69B4]` → `bg-[#E85A9A]`
- `border-[#FF69B4]` → `border-[#E85A9A]`
- `text-[#FF69B4]` → `text-[#E85A9A]`
- Agregar `rounded-lg`

**CRÍTICO:** NO cambiar lógica de carrito ni apartado. Solo mejorar presentación visual.

### Notice apartado (ELIMINAR)

**Eliminar completamente:**
```tsx
{legacyStatus !== 'Apartada' && (
  <div className="mb-6 p-4 border border-[#E85A9A]/10 bg-[#E85A9A]/5">
    <p className="text-xs text-[#E85A9A]">💎 Apartado disponible...</p>
  </div>
)}
```

**Razón:** El botón LayawayButton ya comunica que apartado está disponible. Notice compite visualmente y es redundante.

---

## 5. RELATED PRODUCTS

### Objetivo
Hacer sección más editorial, no saturar, cards premium.

### Ajustes

**Título:** "También te puede interesar" (más conversacional que "Piezas relacionadas")

**Layout:**
- Grid 4 columnas desktop
- ProductCard component (ya refinado en Phase 2D)
- Border superior discreto

**Spacing:**
- Superior: `mt-32` (aumentado de mt-24)
- Padding superior: `pt-20` (aumentado de pt-16)
- Margin bottom título: `mb-12`

**Implementación:**

```tsx
{related.length > 0 && (
  <div className="mt-32 border-t border-[#E85A9A]/10 pt-20">
    <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#0B0B0B] mb-12 text-center tracking-tight leading-tight">
      También te puede interesar
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
      {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
    </div>
  </div>
)}
```

**NO saturar:** Mantener límite de 4 productos relacionados (ya implementado en query con `.limit(4)`)

---

## 6. SPACING Y LAYOUT

### Principios
- **Mucho espacio** — generoso entre secciones
- **Separadores finos** — borders discretos, no cajas pesadas
- **No usar muchas cajas** — evitar fondos/borders excesivos
- **Fucsia solo en acentos** — borders, hover, CTAs
- **Fondo blanco/marfil** — base limpia

### Container
- Max-width: `max-w-7xl` (aumentado de `max-w-6xl`)
- Padding: `px-6 md:px-8` (aumentado de `px-6`)
- Background: `bg-white` o `bg-[#FFFBF8]` (marfil suave)

### Grid principal
- Cols: `lg:grid-cols-[55%_45%]` (55% galería, 45% info)
- Gap: `gap-12 lg:gap-16` (aumentado)

### Padding vertical
- Top: `pt-20 md:pt-28` (consistente con landing Phase 2D)
- Bottom: `pb-32 md:pb-40` (aumentado, fix spacing inferior)

### Secciones info
- Space-y: `space-y-8` (generoso entre bloques)
- Margin-bottom: `mb-8` cada sección
- **NO usar borders pesados** — solo separadores finos si necesario

### Separadores
- Entre secciones: línea fina `border-t border-[#E85A9A]/10` (opcional)
- Padding: `pt-6` después de separador
- **NO usar cajas con fondo** salvo trust badge Entrupy

### Fix spacing inferior apartado (observación Jhonatan)
**Problema:** Bloque apartado se ve pegado/cortado al borde inferior en detalle producto.

**Fix implementado:**
1. Aumentar padding inferior container: `pb-32 md:pb-40`
2. Espacio después de CTAs: `mb-12` en div de CTAs
3. Eliminar notice apartado pesado completamente
4. Asegurar espacio antes de related products: `mt-32`

---

## 7. MOBILE

### Layout mobile
- Stack vertical completo
- Imagen primero (full width)
- Thumbnails horizontales debajo (scroll si >3)
- Info después
- Secciones editoriales stack con `space-y-8`

### CTAs mobile
- Botones grandes: `py-4` (touchable fácil)
- Full width
- Spacing: `space-y-3`

### Typography mobile
- Título: `text-4xl` (reducido de 5xl desktop)
- Precio: `text-3xl` (reducido de 4xl desktop)
- Secciones: mantener `text-sm`

### Padding mobile
- Container: `px-6`
- Secciones: `px-0` (aprovechar ancho)

---

## ARCHIVOS A MODIFICAR

### Componente principal
**1. `src/app/catalogo/[id]/page.tsx`**
- Layout 55/45 con grid-cols-[55%_45%]
- Galería con thumbnails (si múltiples imágenes)
- Badges reducidos (máximo 2)
- Eliminar tabla specs rosa
- Implementar secciones editoriales
- Trust badge Entrupy destacado ANTES de CTAs
- Eliminar/simplificar notice apartado
- Fix spacing inferior
- Related products con más aire

### Componentes secundarios (ajustes menores)
**2. `src/components/AddToCartButton.tsx`**
- Cambiar `#FF69B4` → `#E85A9A` (fucsia estándar)

**3. `src/components/LayawayButton.tsx`**
- Cambiar `#FF69B4` → `#E85A9A` (fucsia estándar)

### CSS/Globals (si necesario)
**4. `src/app/globals.css`**
- Solo si necesitamos utilities reutilizables
- Evitar cambios globales

---

## NO TOCAR

### Backend / DB / Lógica ❌
- ❌ Backend
- ❌ DB schema
- ❌ Supabase queries (salvo SELECT campos públicos existentes)
- ❌ Stripe integration
- ❌ Webhook handlers
- ❌ Checkout logic
- ❌ Orders logic
- ❌ Admin panel
- ❌ Customer panel backend
- ❌ Inventario
- ❌ RLS policies
- ❌ Migrations

### Componentes protegidos ❌
- ❌ CartContext
- ❌ Checkout pages
- ❌ Admin routes
- ❌ API routes (salvo si necesitan ajuste color)

### Funcionalidad existente ❌
- ❌ AddToCartButton logic (solo ajustar colores)
- ❌ LayawayButton logic (solo ajustar colores)
- ❌ Breadcrumb (mantener)
- ❌ Related products logic (solo ajustar layout)

---

## CRITERIOS DE CIERRE

### Visual QA Desktop (Obligatorio)

#### Layout ✅
- [ ] Grid 55/45 visible (galería protagonista)
- [ ] Max-width 1440px o 7xl correcto
- [ ] Gap 16 (64px) entre columnas
- [ ] Padding generoso (px-8 desktop)
- [ ] NO se siente 50/50 genérico

#### Galería ✅
- [ ] Si múltiples imágenes: thumbnails visibles debajo
- [ ] Thumbnails clickeables cambian imagen principal
- [ ] Active thumbnail tiene border fucsia
- [ ] Si solo 1 imagen: NO muestra thumbnails vacíos
- [ ] Si no hay imagen: fallback elegante (marca + "próximamente")
- [ ] Badges reducidos: máximo 2 (status si NO available + entrupy)
- [ ] Badge especial eliminado de imagen

#### Información principal ✅
- [ ] Marca: Inter 11px uppercase tracking-[0.20em] rosa/60
- [ ] Título: Playfair 4xl/5xl tracking-tight
- [ ] Precio: Playfair 3xl bold rosa
- [ ] Trust badge Entrupy destacado ANTES de CTAs
- [ ] Trust badge tiene fondo emerald/50, border, ícono shield
- [ ] CTAs: Comprar fucsia sólido + Apartar outline
- [ ] Notice apartado eliminado o MUY discreto

#### Secciones editoriales ✅
- [ ] NO hay tabla de specs con borders rosa
- [ ] 4 secciones: Detalles, Condición, Qué incluye, Envío y apartado
- [ ] Cada sección tiene ícono emoji + título uppercase
- [ ] Texto limpio con spacing, sin borders pesados
- [ ] Qué incluye: lista con checkmarks verdes
- [ ] Envío y apartado: lista con checkmarks rosas

#### Spacing ✅
- [ ] Padding inferior `pb-32` (fix spacing apartado)
- [ ] Espacio después CTAs `mb-12`
- [ ] Secciones con `space-y-8`
- [ ] Related products: `mt-32 pt-20`
- [ ] NO se ve cortado/pegado al borde inferior

#### Fucsia ✅
- [ ] Fucsia estándar `#E85A9A` en CTAs (no #FF69B4)
- [ ] Fucsia usado como acento, NO dominante
- [ ] Máximo 2 elementos fucsia visibles simultáneos

---

### Visual QA Mobile (Obligatorio)

#### Layout ✅
- [ ] Stack vertical completo (imagen → info → secciones)
- [ ] Imagen full width aspect 3:4
- [ ] Thumbnails scroll horizontal si >3 imágenes
- [ ] CTAs grandes `py-4` tocables fácil
- [ ] Secciones editoriales stack vertical `space-y-8`

#### Typography ✅
- [ ] Título: 4xl mobile (legible, NO cortado)
- [ ] Precio: 3xl mobile
- [ ] Secciones: text-sm legible

#### Spacing ✅
- [ ] Padding `px-6` mobile
- [ ] Espacio después CTAs suficiente
- [ ] NO se siente apretado

---

### Técnico (Obligatorio)

#### Build ✅
- [ ] `npm run build` PASS (37/37 rutas)
- [ ] No errores TypeScript
- [ ] No warnings críticos
- [ ] Deploy production exitoso

#### Funcionalidad ✅
- [ ] `/catalogo/[slug]` carga correctamente
- [ ] Galería cambia imagen al click thumbnail
- [ ] AddToCartButton funciona (agregar + ver carrito)
- [ ] LayawayButton funciona (modal + form)
- [ ] Breadcrumb navega correctamente
- [ ] Related products cargan y navegan
- [ ] No errores en consola browser

#### Áreas NO tocadas ✅
- [ ] Backend NO modificado
- [ ] DB schema NO modificado
- [ ] Supabase queries usan solo PRODUCT_PUBLIC_FIELDS
- [ ] Stripe NO tocado
- [ ] Checkout logic NO tocada
- [ ] Orders logic NO tocada
- [ ] Admin panel NO tocado
- [ ] RLS NO tocado
- [ ] Migrations NO tocadas

---

### Experiencia (Validación Subjetiva)

**Pregunta 1:** ¿Se siente como página de producto de boutique de lujo o como ficha técnica?
- [ ] ✅ Boutique de lujo (editorial, premium)
- [ ] ❌ Ficha técnica (tabla specs, genérico)

**Pregunta 2:** ¿La información está ordenada y clara o confusa?
- [ ] ✅ Ordenada y clara (jerarquía visual obvia)
- [ ] ❌ Confusa (todo mezclado)

**Pregunta 3:** ¿La galería se siente protagonista o secundaria?
- [ ] ✅ Protagonista (55%, thumbnails claros)
- [ ] ❌ Secundaria (50/50 genérico)

**Pregunta 4:** ¿La confianza (Entrupy) es clara?
- [ ] ✅ Clara (badge destacado antes CTAs)
- [ ] ❌ Perdida (badge discreto al final)

**Pregunta 5:** ¿La experiencia invita a comprar/apartar?
- [ ] ✅ Invita (CTAs claros, info confiable, premium)
- [ ] ❌ Confunde (demasiada info técnica, CTAs perdidos)

**Si 4/5 preguntas = ✅ → PASS**  
**Si 3/5 o menos = ❌ → Revisar**

---

## TESTING REQUERIDO

### Pre-deploy (Local) — OBLIGATORIO

#### 1. Build local
```bash
npm run build
```
- [x] 37/37 rutas PASS
- [x] No errores TypeScript
- [x] No warnings críticos
- [x] No React hydration errors

#### 2. Test funcionalidad por status

**Producto available:**
- [x] `/catalogo/[slug]` con status=available carga correctamente
- [x] Botón "Agregar al carrito" visible y funcional
- [x] Botón "Apartar con pagos" visible (si allow_layaway=true)
- [x] Al hacer click "Agregar", producto se agrega al carrito
- [x] Estado "✓ Agregado" aparece brevemente
- [x] Link "Ver en Carrito →" funciona

**Producto sold:**
- [x] `/catalogo/[slug]` con status=sold carga correctamente
- [x] Estado "Vendida" elegante visible
- [x] Mensaje "Esta pieza ya encontró nueva dueña"
- [x] CTA "Ver catálogo completo" visible y funcional
- [x] NO aparece botón "Agregar al carrito"

**Producto reserved (apartada):**
- [x] `/catalogo/[slug]` con status=reserved carga correctamente
- [x] Estado "Apartada" con fondo amber visible
- [x] Mensaje "en proceso de apartado"
- [x] CTA "Ver otras piezas" visible y funcional
- [x] NO aparece botón "Agregar al carrito"

**Producto preorder:**
- [x] `/catalogo/[slug]` con status=preorder carga correctamente
- [x] CTA "Consultar pre-venta por Instagram" visible
- [x] Link abre Instagram correctamente

#### 3. Test galería

**Producto con múltiples imágenes:**
- [x] Imagen principal muestra primera imagen
- [x] Thumbnails visibles debajo
- [x] Click en thumbnail cambia imagen principal
- [x] Active thumbnail tiene border fucsia
- [x] Transición fade suave 300ms

**Producto con 1 imagen:**
- [x] Imagen principal visible
- [x] NO aparecen thumbnails vacíos
- [x] Layout limpio

**Producto sin imagen:**
- [x] Fallback elegante (marca + "próximamente")
- [x] NO rompe layout
- [x] Background gradient de marca visible

#### 4. Test badges

- [x] Máximo 2-3 badges visibles simultáneos
- [x] Badge status solo aparece si NO es available
- [x] Badge autenticidad siempre visible
- [x] Badge especial solo aparece si existe
- [x] NO hay badges redundantes

#### 5. Test secciones editoriales

- [x] NO hay tabla specs con borders rosa
- [x] 4 secciones: Detalles, Condición, Qué incluye, Envío
- [x] Cada sección tiene ícono + título
- [x] "Qué incluye" muestra checkmarks verdes correctos
- [x] Si no incluye nada: "Solo la pieza" visible

#### 6. Test campos internos

- [x] NO aparecen campos admin (cost_price, supplier, etc.)
- [x] Solo campos públicos visibles
- [x] Defensive rendering funciona (no objects en render)

#### 7. Test mobile local

- [x] DevTools mobile viewport (375px, 390px, 428px)
- [x] Layout stack vertical correcto
- [x] Imagen full width
- [x] Thumbnails scroll horizontal (si múltiples)
- [x] CTAs grandes py-4 tocables fácil
- [x] Secciones editoriales legibles
- [x] NO hay overflow horizontal
- [x] NO hay scroll horizontal involuntario

### Post-deploy (Production) — OBLIGATORIO

#### 8. Validación visual desktop

- [x] `/catalogo/[slug]` en producción carga correctamente
- [x] Layout 55/45 visible (galería protagonista)
- [x] Trust badge Entrupy destacado ANTES de CTAs
- [x] Secciones editoriales sin tabla specs
- [x] Spacing generoso (mucho espacio)
- [x] Separadores finos, no cajas pesadas
- [x] Fucsia solo en acentos
- [x] Related: "También te puede interesar"

#### 9. Validación funcional producción

- [x] Galería thumbnails cambian imagen
- [x] AddToCartButton agrega y navega a /cart
- [x] LayawayButton abre modal y procesa form
- [x] Breadcrumb navega correctamente
- [x] Related products cargan y navegan
- [x] NO errores en consola browser
- [x] NO React hydration errors en consola

#### 10. Validación mobile producción

- [x] Mobile real o DevTools mobile
- [x] Layout stack vertical correcto
- [x] CTAs tocables fácil
- [x] Scroll suave sin glitches
- [x] Thumbnails scroll horizontal funcional

#### 11. Validación rutas críticas

- [x] `/` — PASS (no tocado)
- [x] `/catalogo` — PASS (no tocado)
- [x] `/catalogo/[slug]` — PASS (modificado, debe funcionar)
- [x] `/cart` — PASS (no tocado)
- [x] `/checkout/*` — PASS (no tocado)
- [x] `/admin/*` — PASS (no tocado)

#### 12. Validación lógica NO tocada

- [x] Lógica carrito funciona igual que antes
- [x] Lógica apartado funciona igual que antes
- [x] Stripe checkout NO afectado
- [x] Orders logic NO afectado
- [x] Admin panel NO afectado

---

## ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Fase 1: Layout y Galería (2h)
1. Cambiar grid de 50/50 a 55/45
2. Implementar galería con thumbnails (si múltiples imágenes)
3. Reducir badges en imagen (máximo 2)
4. Ajustar max-width y padding
5. Commit: "feat(product-detail): Layout 55/45 + galería premium"

### Fase 2: Información Principal (1.5h)
6. Reordenar jerarquía (marca → título → precio → trust badge → CTAs)
7. Implementar trust badge Entrupy destacado
8. Ajustar colores CTAs (#FF69B4 → #E85A9A)
9. Eliminar/simplificar notice apartado
10. Commit: "feat(product-detail): Info principal + trust badge destacado"

### Fase 3: Secciones Editoriales (2h)
11. Eliminar tabla specs con borders rosa
12. Implementar sección "Detalles de la pieza"
13. Implementar sección "Condición"
14. Implementar sección "Qué incluye" con checkmarks
15. Implementar sección "Envío y apartado"
16. Commit: "feat(product-detail): Secciones editoriales premium"

### Fase 4: Spacing y Polish (1h)
17. Fix spacing inferior (pb-32, mb-12 CTAs)
18. Ajustar spacing related products (mt-32 pt-20)
19. Ajustar responsive mobile (stack, py-4 CTAs)
20. Commit: "feat(product-detail): Spacing premium + mobile polish"

### Fase 5: QA y Deploy (1h)
21. Build local + testing funcionalidad
22. Testing mobile local
23. Commit final + deploy production
24. QA visual desktop + mobile
25. Validación funcional en producción
26. Documentación entrega

**Total estimado:** 7-8 horas

---

## RIESGOS Y MITIGACIONES

### Riesgo Bajo ✅
- Solo UI/CSS, no toca lógica
- Componentes CTAs ya funcionan (solo ajuste colores)
- Gallery simple (sin zoom avanzado)

### Riesgo Potencial ⚠️

**1. Cambio visual prominente puede confundir usuarios recurrentes**
- Mitigación: Mantener estructura reconocible (breadcrumb, CTAs, related products)
- Jerarquía más clara mejora conversión

**2. Galería con múltiples imágenes requiere state management**
- Mitigación: useState simple para imagen activa
- Transition fade suave 300ms

**3. Mobile puede sentirse más largo con secciones editoriales**
- Mitigación: Spacing controlado `space-y-8` (no `space-y-12`)
- Secciones colapsables NO necesario (mantener simple)

**4. Trust badge prominente puede sentirse repetitivo con badge en imagen**
- Mitigación: Badge imagen discreto ("✓"), trust badge completo con ícono + texto

### Riesgo Nulo ❌
- Backend: NO se toca
- DB: NO se toca
- Checkout/Orders: NO se toca
- Solo SELECT con campos públicos existentes

---

## ESTIMACIÓN DETALLADA

**Complejidad:** Media-Alta  
**Tiempo total:** 7-8 horas (implementación + QA + deploy)  
**Riesgo técnico:** Bajo-Medio  
**Riesgo visual:** Medio (cambio prominente requiere validación)

**Desglose:**
- Layout 55/45 + galería: 120 min
- Info principal reordenada: 60 min
- Trust badge destacado: 30 min
- Eliminar tabla specs: 20 min
- Sección Detalles: 30 min
- Sección Condición: 20 min
- Sección Qué incluye: 30 min
- Sección Envío y apartado: 30 min
- Ajustar colores CTAs: 20 min
- Fix spacing: 30 min
- Related products polish: 20 min
- Mobile responsive: 40 min
- Testing local: 30 min
- Deploy + QA production: 30 min

**Commits esperados:** 4-5 commits incrementales

---

## RESUMEN EJECUTIVO

### Alcance Fase 2E

1. ✅ Layout 55/45 (galería protagonista)
2. ✅ Galería premium (thumbnails si múltiples, fallback elegante)
3. ✅ Badges reducidos (máximo 2)
4. ✅ Info principal reordenada (marca → título → precio → trust → CTAs)
5. ✅ Trust badge Entrupy destacado ANTES de CTAs
6. ✅ Eliminar tabla specs con borders rosa
7. ✅ Secciones editoriales (4 bloques con íconos)
8. ✅ Fix spacing inferior apartado
9. ✅ Ajustar colores CTAs (#E85A9A)
10. ✅ Related products con más aire
11. ✅ Mobile stack vertical responsive

### Rutas

- `/catalogo/[slug]` — transformación completa
- `/` — no tocado
- `/catalogo` — no tocado

### NO Incluido

- Zoom avanzado en imagen (mantener simple)
- Secciones colapsables (mantener todo visible)
- Reviews/ratings (no existe en schema)
- Wishlist (fuera de scope)
- Backend/DB/lógica

### Estimación

- 7-8 horas implementación + QA
- 4-5 commits incrementales
- Riesgo: Bajo-Medio

### Principios Guía

- Luxury Editorial Boutique
- Galería protagonista (55%)
- Información ordenada (no tabla técnica)
- Confianza visual clara (trust badge destacado)
- Fucsia acento escaso
- Spacing premium

---

## ⏸️ ESTADO: PENDIENTE DE APROBACIÓN

**NO implementar hasta recibir confirmación explícita de Jhonatan.**

Una vez aprobado:
1. Kepler implementa cambios incrementales (4 fases)
2. Commit por área (layout, info, secciones, spacing)
3. Build local + deploy production
4. QA visual desktop + mobile
5. Entrega: `WEB_POLISH_FASE2E_PRODUCT_DETAIL_PREMIUM_ENTREGA.md`
6. Screenshots antes/después
7. URLs de prueba con validación

---

**Próxima fase después de 2E:** 2F - Checkout Refinement (forms, steps, success page)

---

**Scope creado por:** Kepler  
**Fecha:** 2026-05-06 13:00 UTC  
**Base:** BAGCLUE_CREATIVE_DIRECTION.md + Fase 2D completada  
**Auditoría:** Estado actual + datos disponibles + componentes existentes  
**Versión:** 1.0 Final — Awaiting Approval
