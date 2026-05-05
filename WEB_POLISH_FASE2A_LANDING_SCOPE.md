# WEB POLISH FASE 2A — LANDING PREMIUM BAGCLUE
**Fecha:** 2026-05-05  
**Objetivo:** Rediseñar landing (/) como boutique de lujo femenina premium  
**Basado en:** Análisis Houlux + Coco Approved  
**Estado:** SCOPE — NO IMPLEMENTAR hasta aprobación

---

## 🎯 OBJETIVO GENERAL

Transformar la landing actual de Bagclue en una experiencia premium que comunique:
- ✅ Lujo auténtico y confiable
- ✅ Boutique femenina (no marketplace)
- ✅ Autenticidad verificada por Entrupy
- ✅ Piezas únicas y exclusivas
- ✅ Apartado como diferenciador
- ✅ Atención personalizada

**Inspiración:** Hero Houlux + Trust signals Coco + Identidad Bagclue

---

## 📋 ESTRUCTURA COMPLETA LANDING

### Vista general vertical:

```
┌─────────────────────────────────────────────┐
│  1. ANNOUNCEMENT BAR                        │
├─────────────────────────────────────────────┤
│  2. HEADER/NAV (existente, solo ajustar)    │
├─────────────────────────────────────────────┤
│  3. HERO PREMIUM (100vh)                    │
│     - Imagen editorial full-screen          │
│     - Titular fuerte                        │
│     - Subtítulo claro                       │
│     - CTA Ver catálogo                      │
│     - CTA Instagram (secundario)            │
│     - Flecha scroll-down                    │
├─────────────────────────────────────────────┤
│  4. TRUST SECTION                           │
│     - 4 pilares de confianza                │
│     - Entrupy, Piezas, Envíos, Atención     │
├─────────────────────────────────────────────┤
│  5. FEATURED PRODUCTS                       │
│     - Productos reales Supabase (4-6)       │
│     - Cards premium refinadas               │
│     - CTA Ver catálogo completo             │
├─────────────────────────────────────────────┤
│  6. APARTADO SECTION                        │
│     - 3 pasos explicados elegantemente      │
│     - CTA Conocer apartado                  │
├─────────────────────────────────────────────┤
│  7. INSTAGRAM/ASESORÍA CTA                  │
│     - Contacto personalizado                │
│     - Instagram principal                   │
│     - WhatsApp opcional                     │
├─────────────────────────────────────────────┤
│  8. FOOTER SIMPLE                           │
│     - Links esenciales                      │
│     - Políticas                             │
└─────────────────────────────────────────────┘
```

---

## 1. ANNOUNCEMENT BAR

### Objetivo
Mensaje de confianza corto, no invasivo, siempre visible.

### Diseño

```tsx
<div className="bg-[#E85A9A] text-white text-center py-3 px-4">
  <p className="text-sm md:text-base">
    <span className="inline-flex items-center gap-2">
      <svg className="w-4 h-4" /* checkmark icon */>✓</svg>
      Piezas verificadas
    </span>
    <span className="mx-3">·</span>
    <span className="inline-flex items-center gap-2">
      <svg className="w-4 h-4" /* truck icon */>📦</svg>
      Envíos a México
    </span>
    <span className="mx-3">·</span>
    <span className="inline-flex items-center gap-2">
      <svg className="w-4 h-4" /* calendar icon */>📅</svg>
      Aparta con pagos semanales
    </span>
  </p>
</div>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Background | `#E85A9A` (rosa principal) |
| Texto | Blanco, 14px (mobile), 16px (desktop) |
| Padding vertical | 12px |
| Icons | SVG 16x16px, blanco |
| Separador | `·` con margin 12px |
| Responsive | Stack vertical en mobile <640px |

### Copy final
```
✓ Piezas verificadas · 📦 Envíos a México · 📅 Aparta con pagos semanales
```

**Archivo:** `src/app/page.tsx` (agregar antes del Hero)

---

## 2. HEADER/NAV

### Cambios mínimos
- **NO rediseñar** el header existente (fuera de scope)
- **Ajustar colores** si usa rosa viejo:
  - Links hover: `#E85A9A`
  - Active state: `#E85A9A`

### Validación
- ✅ Logo visible
- ✅ Links funcionan (Inicio, Catálogo, etc.)
- ✅ Mobile menu si existe

**Archivo:** Header ya existe, solo validar

---

## 3. HERO PREMIUM

### Objetivo
Primera impresión WOW — editorial, impactante, premium.

### Layout

```tsx
<section className="relative h-screen flex items-center justify-center overflow-hidden">
  {/* Background image */}
  <div className="absolute inset-0">
    <img
      src="/hero-bagclue.jpg" // Imagen editorial (ver sección Imagen)
      alt="Bagclue Luxury"
      className="w-full h-full object-cover"
    />
    {/* Overlay oscuro para legibilidad */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
  </div>

  {/* Content */}
  <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
    {/* Titular */}
    <h1 className="font-[family-name:var(--font-playfair)] text-6xl md:text-8xl text-white tracking-wide mb-6">
      LUJO AUTÉNTICO
      <span className="block mt-2">SIEMPRE</span>
    </h1>

    {/* Subtítulo */}
    <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
      Cada pieza verificada por Entrupy. Bolsas de las casas más prestigiosas del mundo, con autenticidad garantizada.
    </p>

    {/* CTAs */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      {/* CTA Principal */}
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-2 bg-[#E85A9A] text-white px-10 py-4 text-sm md:text-base tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full shadow-lg shadow-[#E85A9A]/30"
      >
        Ver Catálogo
        <svg className="w-5 h-5" /* arrow right */>→</svg>
      </Link>

      {/* CTA Secundario */}
      <a
        href="https://ig.me/m/salebybagcluemx"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 border-2 border-white/80 text-white px-10 py-4 text-sm md:text-base tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-300 rounded-full"
      >
        <svg className="w-5 h-5" /* Instagram icon */>📷</svg>
        Contactar
      </a>
    </div>

    {/* Trust badge micro */}
    <div className="mt-10 flex items-center justify-center gap-2 text-white/70 text-sm">
      <svg className="w-4 h-4 text-emerald-400">✓</svg>
      <span>100% autenticado por Entrupy</span>
    </div>
  </div>

  {/* Flecha scroll-down */}
  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
    <div className="animate-bounce">
      <svg className="w-8 h-8 text-white" /* chevron down */>↓</svg>
    </div>
  </div>
</section>
```

### Especificaciones Detalladas

#### Imagen de fondo
**Opción 1 — Imagen editorial existente:**
- Si hay imagen de producto Bagclue de alta calidad (Chanel, Hermès)
- Aspect ratio: Landscape 16:9 o 3:2
- Resolución: Mínimo 1920x1080px
- Formato: JPG optimizado, WebP ideal
- Ubicación: `/public/hero-bagclue.jpg`

**Opción 2 — Placeholder premium:**
- Si no hay imagen lista, usar gradiente rosa sutil:
  ```css
  background: linear-gradient(135deg, #E85A9A 0%, #0B0B0B 100%);
  ```
- Agregar imagen real en iteración posterior

**Overlay:**
- Gradient oscuro para legibilidad
- `from-black/40 via-black/30 to-black/50`
- NO debe opacar completamente la imagen

#### Tipografía

| Elemento | Font | Size Desktop | Size Mobile | Weight | Color | Tracking |
|----------|------|--------------|-------------|--------|-------|----------|
| Titular | Playfair | 80px (text-8xl) | 56px (text-6xl) | Normal | Blanco | 0.05em |
| Subtítulo | Sans | 20px (text-xl) | 18px (text-lg) | Normal | Blanco/90% | Normal |
| CTA texto | Sans | 16px | 14px | Medium | Blanco | 0.15em (uppercase) |

#### CTAs

**CTA Principal (Ver Catálogo):**
```css
background: #E85A9A
color: white
padding: 16px 40px
border-radius: 9999px (full)
box-shadow: 0 8px 24px rgba(232, 90, 154, 0.3)
hover:background: #EC5C9F
hover:shadow: 0 12px 32px rgba(232, 90, 154, 0.4)
transition: all 300ms ease
```

**CTA Secundario (Contactar):**
```css
border: 2px solid rgba(255,255,255,0.8)
color: white
padding: 16px 40px
border-radius: 9999px
background: transparent
hover:background: rgba(255,255,255,0.1)
transition: all 300ms ease
```

#### Responsive

**Desktop (≥768px):**
- Headline: 80px, 2 líneas
- Subtítulo: 20px, max-width 700px
- CTAs: side-by-side (flex-row)
- Flecha: visible

**Mobile (<768px):**
- Headline: 56px, 2 líneas
- Subtítulo: 18px, max-width 90%
- CTAs: stacked (flex-col), full-width con padding
- Flecha: más pequeña

#### Copy final sugerido

**Titular:**
```
LUJO AUTÉNTICO
SIEMPRE
```

**Subtítulo:**
```
Cada pieza verificada por Entrupy. Bolsas de las casas más prestigiosas del mundo, con autenticidad garantizada.
```

**Alternativa titular 1:**
```
ELEGANCIA
VERIFICADA
```

**Alternativa titular 2:**
```
TU PIEZA
TE ESPERA
```

**Jhonatan elige final** antes de implementar.

---

## 4. TRUST SECTION

### Objetivo
Comunicar los 4 pilares de confianza Bagclue de forma premium.

### Layout

```tsx
<section className="py-20 md:py-32 bg-[#F7F7F7]">
  <div className="max-w-7xl mx-auto px-6">
    {/* Header */}
    <div className="text-center mb-16">
      <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
        ¿Por qué Bagclue?
      </h2>
      <div className="w-20 h-1 bg-[#E85A9A] mx-auto mt-6" />
    </div>

    {/* 4 Pilares */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
      {/* Pilar 1 - Entrupy */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E85A9A]" /* shield icon */>🛡️</svg>
        </div>
        <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
          Autenticidad Verificada
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Cada pieza certificada por Entrupy, la tecnología líder mundial en autenticación de artículos de lujo.
        </p>
      </div>

      {/* Pilar 2 - Piezas Únicas */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-16 h-16 bg-[#FFF4A8]/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#0B0B0B]" /* star icon */>⭐</svg>
        </div>
        <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
          Piezas Seleccionadas
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Selección curada de bolsas Chanel, Hermès, Louis Vuitton y más. Cada pieza con historia única.
        </p>
      </div>

      {/* Pilar 3 - Envíos */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E85A9A]" /* truck icon */>📦</svg>
        </div>
        <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
          Envíos Seguros
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Envío asegurado a todo México. Tu pieza llega protegida y con tracking completo.
        </p>
      </div>

      {/* Pilar 4 - Atención */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E85A9A]" /* message icon */>💬</svg>
        </div>
        <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
          Atención Personalizada
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Respuesta rápida por Instagram y WhatsApp. Te asesoramos en cada paso de tu compra.
        </p>
      </div>
    </div>
  </div>
</section>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Background | `#F7F7F7` (gris suave) |
| Padding sección | `py-20` mobile, `py-32` desktop |
| Headline | Playfair 48px (desktop), 40px (mobile) |
| Divider | Rosa `#E85A9A`, 4px alto, 80px ancho |
| Grid | 1 col mobile, 2 cols tablet, 4 cols desktop |
| Gap | 32px mobile, 40px desktop |
| Cards | Blanco, padding 32px, rounded-2xl, shadow-sm |
| Icons | 32x32px dentro de círculo 64x64px |
| Icon background | Rosa/10% o amarillo/30% |
| Título card | 20px, semibold, negro |
| Descripción | 14px, gris-600, line-height 1.8 |

### Responsive

**Mobile (<768px):**
- 1 columna
- Cards full-width
- Padding reducido (p-6)

**Tablet (768-1024px):**
- 2 columnas
- Grid equilibrado

**Desktop (≥1024px):**
- 4 columnas
- Spacing completo

---

## 5. FEATURED PRODUCTS

### Objetivo
Mostrar 4-6 productos reales de Supabase con diseño premium.

### Fetch Existente (NO TOCAR)

```tsx
// YA EXISTE en src/app/page.tsx
async function getFeaturedProducts() {
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('is_published', true)
    .in('status', ['available', 'preorder'])
    .order('created_at', { ascending: false })
    .limit(6);
  // ... transformación existente
}
```

**✅ Este fetch YA funciona — solo ajustar presentación visual**

### Layout

```tsx
<section className="py-20 md:py-32 bg-white">
  <div className="max-w-7xl mx-auto px-6">
    {/* Header */}
    <div className="text-center mb-16">
      <span className="text-xs tracking-[0.5em] uppercase text-[#E85A9A]/60 mb-3 block">
        Colección
      </span>
      <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
        Piezas Destacadas
      </h2>
      <div className="w-20 h-1 bg-[#E85A9A] mx-auto mt-6" />
    </div>

    {/* Grid */}
    {featured.length > 0 ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {featured.slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* CTA Ver todo */}
        <div className="text-center mt-16">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 border-2 border-[#E85A9A]/40 text-[#E85A9A] px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#E85A9A]/5 transition-all duration-300 rounded-full"
          >
            Ver Catálogo Completo
            <svg className="w-5 h-5">→</svg>
          </Link>
        </div>
      </>
    ) : (
      <div className="text-center py-16">
        <p className="text-gray-500">
          Nuevas piezas próximamente...
        </p>
      </div>
    )}
  </div>
</section>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Cantidad productos | 4 (máximo) — slice(0, 4) |
| Grid | 1 col mobile, 2 tablet, 3 desktop, 4 XL |
| Gap | 32px mobile, 40px desktop |
| ProductCard | YA EXISTE (ajustado en Fase 1) |
| CTA Ver todo | Outline rosa, rounded-full |

### Ajustes a ProductCard (si necesario)

**ProductCard ya existe y fue mejorado en Fase 1:**
- Badges componente Badge (Entrupy, Estado)
- Rosa #E85A9A en precio y marca
- Texto blanco sobre bg negro

**Validar:**
- ✅ Cards se ven premium
- ✅ Badges visibles (max 2)
- ✅ Precio claro
- ✅ Hover funciona

**NO rediseñar ProductCard** en esta fase (ya está bien).

---

## 6. APARTADO SECTION

### Objetivo
Explicar apartado en 3 pasos, tono elegante (no financiero agresivo).

### Layout

```tsx
<section className="py-20 md:py-32 bg-gradient-to-b from-[#E85A9A]/5 to-transparent">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Imagen lifestyle */}
      <div className="order-2 lg:order-1">
        <img
          src="/apartado-lifestyle.jpg" // O placeholder
          alt="Aparta tu pieza"
          className="rounded-2xl shadow-xl w-full h-auto"
        />
      </div>

      {/* Contenido */}
      <div className="order-1 lg:order-2">
        <span className="text-xs tracking-[0.5em] uppercase text-[#E85A9A]/60 mb-3 block">
          Apartado
        </span>
        <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-6">
          Aparta Tu Pieza
        </h2>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Llévate la bolsa de tus sueños con pagos semanales sin complicaciones. Simple, transparente y seguro.
        </p>

        {/* 3 Pasos */}
        <div className="space-y-6 mb-10">
          {/* Paso 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                Elige tu pieza
              </h3>
              <p className="text-sm text-gray-600">
                Encuentra la bolsa perfecta en nuestro catálogo verificado.
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                Aparta con pagos semanales
              </h3>
              <p className="text-sm text-gray-600">
                Define tu plan de pagos semanal que mejor se ajuste a ti.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                Recíbela cuando completes tu pago
              </h3>
              <p className="text-sm text-gray-600">
                Tu pieza te espera asegurada hasta que termines tus pagos.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/apartado"
          className="inline-flex items-center gap-2 bg-[#E85A9A] text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full"
        >
          Conocer Más
          <svg className="w-5 h-5">→</svg>
        </Link>
      </div>
    </div>
  </div>
</section>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Background | Gradient rosa/5% to transparent |
| Layout | 2 columnas (imagen 50% + texto 50%) |
| Imagen | Rounded-2xl, shadow-xl |
| Headline | Playfair 48px |
| Pasos números | Círculo 48x48px, rosa sólido, blanco |
| Paso título | 18px, semibold, negro |
| Paso descripción | 14px, gris-600 |
| CTA | Rosa sólido, rounded-full |

### Imagen Apartado

**Opción 1 — Lifestyle:**
- Mujer joven con bolsa de lujo (Chanel/Hermès)
- Tono cálido, aspiracional
- NO stock photo genérico

**Opción 2 — Producto destacado:**
- Bolsa Bagclue premium sobre fondo rosa pastel
- Con badge "Apartado Disponible"

**Opción 3 — Placeholder:**
- Gradient rosa suave si no hay imagen
- Agregar real después

### Responsive

**Desktop (≥1024px):**
- 2 columnas side-by-side
- Imagen izquierda, texto derecha

**Mobile (<1024px):**
- Stack vertical
- Texto arriba, imagen abajo
- Full-width ambos

---

## 7. INSTAGRAM/ASESORÍA SECTION

### Objetivo
CTA para contactar vía Instagram (principal) y WhatsApp (opcional).

### Layout

```tsx
<section className="py-20 md:py-32 bg-[#0B0B0B] text-white">
  <div className="max-w-4xl mx-auto px-6 text-center">
    <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl mb-6">
      ¿Necesitas Ayuda?
    </h2>
    <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
      Nuestro equipo está listo para asesorarte en la elección de tu pieza perfecta. Contáctanos por Instagram o WhatsApp.
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      {/* Instagram CTA */}
      <a
        href="https://ig.me/m/salebybagcluemx"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-[#E85A9A] text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full shadow-lg shadow-[#E85A9A]/30"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {/* Instagram icon SVG */}
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
        Contáctanos por Instagram
      </a>

      {/* WhatsApp CTA (OPCIONAL — solo si hay número confirmado) */}
      {/* VERIFICAR con Jhonatan antes de activar */}
      {/* 
      <a
        href="https://wa.me/527223854520" // Verificar número
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 border-2 border-white/80 text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-300 rounded-full"
      >
        <svg className="w-5 h-5">📱</svg>
        WhatsApp
      </a>
      */}
    </div>

    {/* Trust micro */}
    <div className="mt-10 text-white/60 text-sm">
      <p>Respuesta rápida · Asesoría personalizada · Sin compromiso</p>
    </div>
  </div>
</section>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Background | Negro `#0B0B0B` |
| Texto | Blanco |
| Headline | Playfair 48px blanco |
| Descripción | 20px, blanco/80% |
| Instagram CTA | Rosa sólido con shadow |
| WhatsApp CTA | Outline blanco (OPCIONAL) |

### ⚠️ IMPORTANTE - WhatsApp

**ANTES de agregar WhatsApp CTA:**
1. Confirmar con Jhonatan el número exacto
2. Verificar formato internacional correcto
3. Si no hay número confirmado → NO agregar (solo Instagram)

**Números conocidos del proyecto:**
- +34722385452 (Jhonatan personal)
- +34638040614 (Jhonatan alternativo)

**NO usar sin confirmación** — puede ser personal, no comercial.

---

## 8. FOOTER SIMPLE

### Objetivo
Links esenciales, políticas, sin saturar.

### Layout

```tsx
<footer className="bg-[#F7F7F7] py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      {/* Col 1 - Logo */}
      <div>
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#0B0B0B] mb-4">
          Bagclue
        </h3>
        <p className="text-sm text-gray-600">
          Lujo auténtico, siempre.
        </p>
      </div>

      {/* Col 2 - Navegación */}
      <div>
        <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
          Navegar
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li><Link href="/catalogo" className="hover:text-[#E85A9A]">Catálogo</Link></li>
          <li><Link href="/apartado" className="hover:text-[#E85A9A]">Apartado</Link></li>
          <li><Link href="/nosotros" className="hover:text-[#E85A9A]">Nosotros</Link></li>
          <li><Link href="/contacto" className="hover:text-[#E85A9A]">Contacto</Link></li>
        </ul>
      </div>

      {/* Col 3 - Autenticidad */}
      <div>
        <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
          Confianza
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✓ Verificado por Entrupy</li>
          <li>✓ Envíos seguros</li>
          <li>✓ Atención personalizada</li>
        </ul>
      </div>

      {/* Col 4 - Políticas */}
      <div>
        <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
          Legal
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li><Link href="/politicas" className="hover:text-[#E85A9A]">Políticas</Link></li>
          <li><Link href="/privacidad" className="hover:text-[#E85A9A]">Privacidad</Link></li>
          <li><Link href="/terminos" className="hover:text-[#E85A9A]">Términos</Link></li>
        </ul>
      </div>
    </div>

    {/* Copyright */}
    <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-500">
      <p>© 2026 Bagclue. Todos los derechos reservados.</p>
    </div>
  </div>
</footer>
```

### Especificaciones

| Elemento | Valor |
|----------|-------|
| Background | `#F7F7F7` (gris suave) |
| Grid | 4 columnas desktop, 1 mobile |
| Links hover | Rosa `#E85A9A` |
| Copyright | Gris-500, centrado |

---

## 9. PALETA DE COLORES

### Colores Oficiales Bagclue

```tsx
// src/lib/colors.ts (YA EXISTE)
export const BAGCLUE_COLORS = {
  pink: {
    primary: '#E85A9A',
    secondary: '#EC5C9F',
  },
  yellow: {
    primary: '#FFF4A8',
    secondary: '#F8F0A0',
  },
  black: '#0B0B0B',
  white: '#FFFFFF',
  gray: {
    soft: '#F7F7F7',
    medium: '#6B7280',
    dark: '#374151',
  },
}
```

### Uso Estratégico

| Color | Dónde Usar | NO Usar |
|-------|-----------|---------|
| **Rosa #E85A9A** | CTAs principales, precio, marca en cards, badges especiales, hover states, announcement bar | Todo el fondo, saturar cada sección |
| **Rosa #EC5C9F** | Hover de CTAs principales | Como color base |
| **Amarillo #FFF4A8** | Badge "Pieza Única", highlights especiales, círculos de iconos (alternado con rosa) | Fondos grandes, texto |
| **Negro #0B0B0B** | Texto principal, headlines, fondo de sección Instagram | Overuse (debe contrastar con blanco) |
| **Blanco #FFFFFF** | Fondo principal, texto sobre negro/rosa, cards | - |
| **Gris #F7F7F7** | Fondo secciones alternadas (Trust, Footer) | Texto principal |

### Distribución en Landing

| Sección | Color dominante | Acentos |
|---------|----------------|---------|
| Announcement bar | Rosa sólido | Blanco texto |
| Hero | Negro/imagen oscura | Rosa CTA, blanco texto |
| Trust | Gris suave | Rosa icons/divider, blanco cards |
| Featured Products | Blanco | Rosa precio/marca |
| Apartado | Rosa gradient/5% | Rosa números/CTA |
| Instagram | Negro | Rosa CTA |
| Footer | Gris suave | Rosa links hover |

---

## 10. QUÉ NO TOCAR

### ❌ ÁREAS PROHIBIDAS

**Backend y lógica:**
- ❌ No modificar funciones de fetch (getFeaturedProducts ya funciona)
- ❌ No tocar Supabase queries excepto lo que ya existe
- ❌ No tocar Stripe integration
- ❌ No tocar webhooks
- ❌ No tocar checkout logic
- ❌ No tocar orders logic

**Paneles y administración:**
- ❌ No tocar `/admin` rutas
- ❌ No tocar `/account` rutas (customer panel)
- ❌ No tocar inventario logic
- ❌ No tocar RLS policies
- ❌ No tocar database migrations

**Solo modificar:**
- ✅ `src/app/page.tsx` (landing markup y styles)
- ✅ Componentes visuales si hace falta (Button, Badge ya existen)
- ✅ Estilos Tailwind
- ✅ Copy/texto
- ✅ Imágenes estáticas en `/public`

---

## 11. ARCHIVOS A MODIFICAR

### Archivo Principal

**`src/app/page.tsx`**
- **Modificaciones:**
  1. Agregar Announcement bar (nuevo)
  2. Rediseñar Hero section (reemplazar completo)
  3. Agregar Trust section (nuevo)
  4. Ajustar Featured Products section (solo diseño, fetch mantener)
  5. Agregar Apartado section (nuevo)
  6. Agregar Instagram/Asesoría section (nuevo)
  7. Agregar Footer (nuevo o ajustar si existe)

- **NO modificar:**
  - `getFeaturedProducts()` function
  - Imports de Supabase
  - Server component config
  - Revalidate settings

### Componentes Existentes a Usar

**`src/components/ProductCard.tsx`**
- ✅ Ya ajustado en Fase 1
- ✅ Usar tal cual (no rediseñar)
- ✅ Validar que se vea premium

**`src/components/Badge.tsx`**
- ✅ Ya existe (Fase 1)
- ✅ Usar para badges de trust section si hace falta

**`src/components/Button.tsx`**
- ✅ Ya existe (Fase 1)
- ⚠️ NO se usa en landing (CTAs son inline `<Link>` por SEO)
- ✅ Mantener para uso futuro

**`src/lib/colors.ts`**
- ✅ Ya existe con paleta oficial
- ✅ Importar si hace falta
- ✅ Usar como referencia de colores

### Imágenes Nuevas Requeridas

**`/public/hero-bagclue.jpg` (o .webp)**
- Imagen editorial para Hero
- Mínimo 1920x1080px
- Formato: JPG optimizado o WebP
- **Placeholder:** Usar gradient si no hay imagen

**`/public/apartado-lifestyle.jpg` (opcional)**
- Imagen para sección Apartado
- Lifestyle o producto
- **Placeholder:** Gradient rosa si no hay

### Archivo de Documentación

**Este documento:**
- `WEB_POLISH_FASE2A_LANDING_SCOPE.md`
- Mantener como referencia durante implementación

---

## 12. CRITERIOS DE CIERRE

### ✅ Funcionalidad

- [ ] Announcement bar visible y no invasivo
- [ ] Hero full-screen con imagen o gradient
- [ ] CTAs Hero funcionan (Ver catálogo → /catalogo, Instagram → ig.me)
- [ ] Trust section muestra 4 pilares
- [ ] Featured products muestra 4-6 productos reales de Supabase
- [ ] ProductCard se ve premium y funciona
- [ ] Apartado section explica 3 pasos claramente
- [ ] Instagram CTA funciona
- [ ] WhatsApp CTA solo si confirmado (o comentado)
- [ ] Footer links funcionan
- [ ] Todos los `<Link>` apuntan a rutas correctas

### ✅ Visual Premium

- [ ] Landing se ve como boutique de lujo femenina
- [ ] Hero impacta en primer vistazo
- [ ] Tipografía grande y espaciada (Playfair headlines)
- [ ] Whitespace generoso (py-20/py-32)
- [ ] Rosa #E85A9A usado estratégicamente (no saturado)
- [ ] Amarillo #FFF4A8 solo en highlights especiales
- [ ] Cards productos destacan fotografía
- [ ] Badges visibles pero mínimos (max 2 por card)
- [ ] CTAs claros y grandes
- [ ] Sensación cohesiva (no secciones desconectadas)

### ✅ Responsive/Mobile

- [ ] Hero no rompe en mobile
- [ ] Headline legible en mobile (56px)
- [ ] CTAs Hero stack vertical en mobile
- [ ] Trust section 1 columna en mobile
- [ ] Featured products 1 columna en mobile
- [ ] Apartado section stack vertical en mobile
- [ ] Footer 1 columna en mobile
- [ ] Touch targets ≥44px
- [ ] Imágenes responsive
- [ ] No overflow horizontal
- [ ] Scroll suave

### ✅ Build y Deploy

- [ ] `npm run build` → ✅ PASS
- [ ] Sin errores TypeScript
- [ ] Sin errores ESLint críticos
- [ ] Deploy manual Vercel CLI exitoso
- [ ] URL production activa: https://bagclue.vercel.app
- [ ] Ruta `/` carga correctamente
- [ ] Productos featured cargan desde Supabase
- [ ] Imágenes de productos visibles
- [ ] Sin errores en consola browser
- [ ] Performance aceptable (LCP <3s)

### ✅ Áreas No Tocadas (Confirmación)

- [ ] `getFeaturedProducts()` function sin modificar
- [ ] Supabase queries sin modificar (salvo las que ya existen)
- [ ] Stripe sin tocar
- [ ] Webhooks sin tocar
- [ ] `/admin` rutas sin tocar
- [ ] `/account` rutas sin tocar
- [ ] Checkout logic sin tocar
- [ ] Orders logic sin tocar
- [ ] RLS/migrations sin tocar
- [ ] Solo `src/app/page.tsx` modificado (UI/markup)

### ✅ Validación Visual Final

- [ ] Landing comunica lujo
- [ ] Landing comunica autenticidad (Entrupy visible)
- [ ] Landing comunica boutique femenina (no marketplace)
- [ ] Landing comunica confianza (trust signals)
- [ ] Landing invita a explorar catálogo
- [ ] Landing destaca apartado como diferenciador
- [ ] Landing facilita contacto (Instagram prominente)
- [ ] Diferenciación clara vs competencia
- [ ] Sensación premium consistente
- [ ] Usuario entiende valor Bagclue en 5 segundos

---

## 📊 ESTIMACIÓN DE TIEMPO

### Desglose por sección

| Sección | Tiempo estimado |
|---------|----------------|
| 1. Announcement bar | 30 min |
| 2. Header (ajustes mínimos) | 15 min |
| 3. Hero premium | 2-3 horas |
| 4. Trust section | 2 horas |
| 5. Featured products (ajuste visual) | 1 hora |
| 6. Apartado section | 2-3 horas |
| 7. Instagram/Asesoría CTA | 1 hora |
| 8. Footer simple | 1-2 horas |
| 9. Responsive/mobile ajustes | 1-2 horas |
| 10. Testing y fixes | 1-2 horas |

**Total estimado:** 12-16 horas

### Factores que pueden acelerar

- ✅ Fetch de productos ya funciona (no hay que crearlo)
- ✅ ProductCard ya está premium (Fase 1)
- ✅ Badge y Button components ya existen
- ✅ Paleta de colores ya definida

### Factores que pueden retrasar

- ⚠️ Imágenes no disponibles (requiere placeholders)
- ⚠️ Copy no aprobado (requiere iteración)
- ⚠️ Responsive issues complejos
- ⚠️ Build errors inesperados

---

## 📝 ENTREGABLES FINAL

### Documentos

- ✅ Este scope: `WEB_POLISH_FASE2A_LANDING_SCOPE.md`
- ⏳ Reporte implementación: `WEB_POLISH_FASE2A_LANDING_ENTREGA.md`

### Código

- ✅ `src/app/page.tsx` modificado
- ✅ Imágenes en `/public` (si aplicable)
- ✅ Commit con mensaje descriptivo
- ✅ Push a `main`
- ✅ Deploy production

### Validación

- ✅ Screenshots o descripción visual del resultado
- ✅ URL production funcionando
- ✅ Checklist de criterios de cierre completo
- ✅ Confirmación áreas no tocadas

---

## ⏭️ PRÓXIMOS PASOS

### Aprobación requerida

1. **Jhonatan revisa este scope**
2. **Jhonatan aprueba:**
   - Estructura general
   - Copy sugerido (o ajusta)
   - Imágenes (confirma si existen o usar placeholders)
   - WhatsApp CTA (confirma número o NO incluir)

3. **Una vez aprobado:**
   - Kepler implementa según scope
   - Kepler hace build local
   - Kepler valida visualmente
   - Kepler hace commit + push
   - Kepler hace deploy manual Vercel
   - Kepler entrega reporte

4. **Jhonatan valida resultado:**
   - Revisa landing en producción
   - Confirma si cumple expectativa premium
   - Aprueba cierre de Fase 2A

5. **Siguiente fase:**
   - Si Fase 2A aprobada → Fase 2B (Product Cards Premium)
   - Si requiere ajustes → iterar Fase 2A

---

## ❓ PREGUNTAS PARA JHONATAN (Antes de implementar)

### 1. Copy Hero

**Titular sugerido:**
```
LUJO AUTÉNTICO
SIEMPRE
```

**¿Apruebas este titular o prefieres:**
- Opción A: "ELEGANCIA VERIFICADA"
- Opción B: "TU PIEZA TE ESPERA"
- Opción C: Otro (especificar)

### 2. Imagen Hero

**¿Tienes imagen editorial lista?**
- ✅ Sí (especificar ubicación/enviar)
- ❌ No → usar gradient placeholder rosa

**Si sí:**
- Formato: JPG o WebP
- Resolución mínima: 1920x1080px
- Producto mostrado: (Chanel, Hermès, etc.)

### 3. WhatsApp CTA

**¿Incluir WhatsApp en sección Asesoría?**
- ✅ Sí → confirmar número exacto: _______________
- ❌ No → solo Instagram

### 4. Imagen Apartado

**¿Tienes imagen para sección Apartado?**
- ✅ Sí (especificar/enviar)
- ❌ No → usar gradient placeholder

### 5. Featured Products

**¿Cuántos productos mostrar?**
- 4 (recomendado — grid más limpio)
- 6 (opción original)

### 6. Footer Links

**¿Existen estas páginas?**
- /apartado → ✅ / ❌
- /nosotros → ✅ / ❌
- /contacto → ✅ / ❌
- /politicas → ✅ / ❌
- /privacidad → ✅ / ❌
- /terminos → ✅ / ❌

**Si NO existen:** comentar links o crear placeholders

---

**Fin del scope FASE 2A**

**Preparado por:** Kepler  
**Fecha:** 2026-05-05 22:40 UTC  
**Esperando aprobación para implementar.**
