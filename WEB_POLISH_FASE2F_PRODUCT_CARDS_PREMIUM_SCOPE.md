# WEB POLISH FASE 2F — PRODUCT CARDS EDITORIALES + MICRODETALLES HEADER — SCOPE

**Fecha:** 2026-05-06  
**Objetivo:** Refinar product cards de ecommerce tradicional a luxury editorial boutique  
**Origen:** Auditoría profesional de dirección creativa

---

## RESUMEN EJECUTIVO — 10 CAMBIOS

### ProductCard.tsx (8 cambios)
1. ❌ **Eliminar slug visible** - Línea 57, muestra `product.id` técnico
2. 🎨 **Bloque charcoal premium** - `bg-[#0B0B0B]` → `bg-[#111111]`
3. 💰 **Precio separado elegante** - Dividir precio y MXN, `font-bold` → `font-semibold`
4. 📐 **Jerarquía refinada** - Marca 11px, modelo 15px, tracking ajustado
5. ✓ **Badge auth premium** - Verde fuerte → charcoal discreto `bg-[#1a1a1a]/80`
6. 👆 **Hover sutil** - Scale 1.03 → 1.02, overlay blanco/60 → oscuro/10
7. 📷 **Imagen dominante** - Reducir padding bloque info, fondo marfil fallback
8. ↕️ **Espaciado refinado** - Aire entre marca/modelo/precio, card "silenciosa"

### Badge.tsx (1 cambio)
9. ✓ **Auth badge charcoal** - `bg-white/70 text-emerald-400` → `bg-[#1a1a1a]/80 text-white/80`

### Navbar.tsx (1 cambio)
10. 🔍 **Focus fucsia** - Agregar `focus-visible:ring-[#E85A9A]` en todos los links/buttons

---

## CONTEXTO

**Feedback auditoría:**
> "La web ya se ve mucho mejor y más premium, pero el punto más débil ahora son las product cards y algunos microdetalles del header."

**Problema principal:**  
Las product cards actuales tienen elementos que rompen la percepción premium:
1. Slug visible (parece debug/CMS)
2. Bloque negro puro muy pesado
3. Precio demasiado protagonista/ecommerce
4. Badge autenticidad tipo plugin verde
5. Hover overlay agresivo blanco/60
6. Scale hover 1.03 (demasiado)

---

## RUTAS AFECTADAS

- `/` (landing - featured products)
- `/catalogo` (grid completo)
- Cualquier lugar donde se use `<ProductCard />`

---

## ARCHIVOS A MODIFICAR

### Confirmado
1. **`src/components/ProductCard.tsx`** (cambios principales)
2. **`src/components/Badge.tsx`** (badge auth más premium)

### Posible
3. Header/Nav (solo si microdetalle focus azul requiere ajuste)

---

## RESTRICCIONES

### ❌ NO TOCAR
- Backend
- DB schema
- Supabase queries
- Stripe
- Webhook
- Checkout logic
- Orders logic
- Admin panel
- Customer panel
- RLS
- Migrations
- Lógica de carrito
- Lógica de apartado
- Lógica de filtros
- Product detail page (ya aprobada Fase 2E)

### ✅ SOLO MODIFICAR
- ProductCard.tsx (UI/styling)
- Badge.tsx (styling auth badge)
- Header/Nav (solo si focus state lo requiere)

---

## CAMBIOS EXACTOS SOLICITADOS (10 PUNTOS)

### 1. ELIMINAR SLUG VISIBLE ❌

#### Problema Actual

**Código actual (línea 57):**
```tsx
<div className="mt-3 flex items-center justify-between">
  <span className={`... text-lg font-bold ...`}>
    {formatPrice(product.price)}
  </span>
  <span className="font-[family-name:var(--font-inter)] text-[10px] text-gray-600">
    {product.id}  {/* ← ESTO SE MUESTRA VISUALMENTE */}
  </span>
</div>
```

**Qué muestra:**  
En la esquina inferior derecha aparece texto tipo:
- `chanel-classic-flap-negro`
- `hermes-birkin-30-negro`

**Por qué es malo:**
- Parece backend/debug/CMS
- Mata percepción premium
- No aporta valor al usuario
- Se siente técnico/interno

#### Solución

**Eliminar línea 57:**
```tsx
<span className="...">
  {product.id}  {/* ← ELIMINAR */}
</span>
```

**Card debe mostrar SOLO:**
- Marca
- Nombre/modelo
- Color/origen (si aplica)
- Precio
- Estado/autenticidad (discreto)

**Ejemplo ideal:**
```
CHANEL
Classic Flap 25 Mediana
Negro · Francia
$189,000 MXN
```

**NO:**
```
chanel-classic-flap-negro  ← slug técnico visible
```

---

### 2. BLOQUE NEGRO INFERIOR MENOS PESADO

#### Problema Actual

**Código actual (línea 9):**
```tsx
<div className="relative overflow-hidden bg-[#0B0B0B] border border-[#E85A9A]/10 ...">
```

**Color actual:**  
`#0B0B0B` - Negro casi puro (RGB: 11, 11, 11)

**Por qué es pesado:**
- Negro puro se siente denso/pesado
- Contraste muy fuerte con imagen
- No respira
- Se siente ecommerce tradicional

**Altura visual:**  
`p-5` (padding 20px) - podría reducirse 20-30%

#### Solución

**Cambiar a charcoal premium:**
```tsx
<div className="relative overflow-hidden bg-[#111111] border border-[#E85A9A]/10 ...">
```

**Opciones de color:**
- `#111111` (RGB: 17, 17, 17) - charcoal suave
- `#151515` (RGB: 21, 21, 21) - charcoal medio

**Recomendación:** `#111111`

**Reducir altura bloque:**
```tsx
{/* Antes */}
<div className="p-5">

{/* Después */}
<div className="px-5 py-4">
```

**Resultado:**
- Más aire interno
- Menos densidad visual
- Sensación más editorial
- Padding vertical: 20px → 16px (reducción 20%)

---

### 3. PRECIO MÁS ELEGANTE

#### Problema Actual

**Código actual (líneas 54-56):**
```tsx
<span className={`font-[family-name:var(--font-inter)] text-lg font-bold tracking-tight ${product.price ? 'text-[#E85A9A]' : 'text-gray-500 italic'}`}>
  {formatPrice(product.price)}
</span>
```

**Qué muestra:**
```
$189,000 MXN
```
Todo en una línea, `font-bold`, muy protagonista.

**Por qué es pesado:**
- `font-bold` es demasiado agresivo
- Precio y moneda pegados se siente ecommerce
- Demasiado protagonista visual
- No respira

**formatPrice actual:**
```typescript
export function formatPrice(price: number | null): string {
  if (price === null) return 'Consultar precio';
  return `$${price.toLocaleString('es-MX')} MXN`;
}
```

#### Solución

**Separar precio y moneda visualmente:**
```tsx
{product.price ? (
  <div className="flex items-baseline gap-1.5">
    <span className="font-[family-name:var(--font-inter)] text-xl font-semibold text-[#E85A9A]">
      ${product.price.toLocaleString('es-MX')}
    </span>
    <span className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.18em] text-white/60">
      MXN
    </span>
  </div>
) : (
  <span className="text-sm text-gray-500 italic">Consultar precio</span>
)}
```

**Cambios:**
1. **Precio:**
   - `text-lg` → `text-xl` (más respiro)
   - `font-bold` → `font-semibold` (menos agresivo)
   - Color: `text-[#E85A9A]` (mantiene)

2. **Moneda (MXN):**
   - `text-xs` (pequeña)
   - `uppercase tracking-[0.18em]` (elegante)
   - `text-white/60` (discreta)
   - Separada visualmente con `gap-1.5`

**Formato visual:**
```
Antes:
$189,000 MXN  (bold, todo igual peso)

Después:
$189,000  MXN
^^^^^^^^  ^^^
semibold  xs uppercase discreto
```

**Sensación:** Más editorial, menos marketplace.

---

### 4. JERARQUÍA TIPOGRÁFICA DE CARD

#### Estado Actual

**Marca (línea 51):**
```tsx
<p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.20em] font-medium text-[#E85A9A]/70">
  {product.brand}
</p>
```

**Modelo (línea 52):**
```tsx
<h3 className="font-[family-name:var(--font-inter)] text-base font-semibold text-white mt-1 leading-snug">
  {product.model}
</h3>
```

**Color/origen (línea 53):**
```tsx
<p className="font-[family-name:var(--font-inter)] text-xs text-gray-400 mt-1">
  {product.color} · {product.origin}
</p>
```

**Precio (ya cubierto en punto 3)**

#### Análisis Actual vs Recomendado

| Elemento | Actual | Recomendado | Cambio |
|----------|--------|-------------|--------|
| **Marca** | text-xs tracking-[0.20em] font-medium text-[#E85A9A]/70 | text-[11px] tracking-[0.22em] font-medium text-[#E85A9A]/70 | ✅ Ajustar tracking |
| **Modelo** | text-base (16px) font-semibold text-white | text-[15px] font-semibold text-white leading-relaxed | ✅ Reducir 1px + relaxed |
| **Color/origen** | text-xs text-gray-400 | text-xs text-white/70 | ✅ Cambiar a white/70 |
| **Precio** | text-lg font-bold | text-xl font-semibold (separado) | ✅ Ya cubierto punto 3 |

#### Solución

**Marca:**
```tsx
<p className="font-[family-name:var(--font-inter)] text-[11px] uppercase tracking-[0.22em] font-medium text-[#E85A9A]/70">
  {product.brand}
</p>
```

**Modelo:**
```tsx
<h3 className="font-[family-name:var(--font-inter)] text-[15px] font-semibold text-white mt-1.5 leading-relaxed">
  {product.model}
</h3>
```

**Color/origen:**
```tsx
<p className="font-[family-name:var(--font-inter)] text-xs text-white/70 mt-1">
  {product.color} · {product.origin}
</p>
```

**Spacing:**
- Marca → Modelo: `mt-1` → `mt-1.5` (6px más aire)
- Modelo → Color: `mt-1` (mantiene)
- Color → Precio: `mt-3` (mantiene)

**Resultado:**
- Jerarquía más clara
- Más aire entre elementos
- Colores más cohesivos (white/70 en vez de gray-400)
- Tracking refinado en marca

---

### 5. BADGES MÁS PREMIUM

#### Problema Actual

**Badge auth actual (línea 46):**
```tsx
<div className="absolute top-3 right-3">
  <Badge type="auth" label="✓" />
</div>
```

**Badge.tsx auth actual:**
```tsx
auth: 'bg-white/70 text-emerald-400 border-emerald-500/20',
```

**Qué se ve:**
- Fondo blanco/70 (demasiado fuerte)
- Verde emerald brillante
- Se siente plugin/ecommerce
- Checkmark solo "✓"

**Por qué es malo:**
- Demasiado verde fuerte
- Fondo blanco pesado
- No se siente premium
- Parece badge de "producto verificado" genérico

#### Solución

**Opción 1: Badge charcoal sutil**
```tsx
auth: 'bg-[#1a1a1a]/80 text-white/80 border-white/10',
```

**Opción 2: Badge crema discreto**
```tsx
auth: 'bg-[#F5F1ED]/90 text-[#0B0B0B]/70 border-[#0B0B0B]/10',
```

**Opción 3: Emerald MUY suave**
```tsx
auth: 'bg-emerald-950/40 text-emerald-200/70 border-emerald-500/10',
```

**Recomendación:** Opción 1 (charcoal premium)

**Texto del badge:**
```tsx
{/* Antes */}
<Badge type="auth" label="✓" />

{/* Después - más descriptivo */}
<Badge type="auth" label="✓ Verified" />
```

O si queda muy largo:
```tsx
<Badge type="auth" label="Entrupy ✓" />
```

**Estado badge:**

| Badge | Cuándo mostrar | Estilo |
|-------|----------------|--------|
| Disponible | Solo si NO es "En inventario" | Verde esmeralda suave (mantiene) |
| Apartada | Solo si status = Apartada | Amber (mantiene) |
| Vendida | Solo si status = Vendida | Gris suave (mantiene) |
| Verificada | Siempre | Charcoal premium (CAMBIO) |

**Máximo 2 badges por card:**
- Status (izquierda) - solo si NO disponible
- Verificada (derecha) - siempre pero discreto

---

### 6. HOVER PREMIUM

#### Problema Actual

**Hover overlay (líneas 33-35):**
```tsx
<div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
  <span className="text-xs tracking-widest uppercase text-[#E85A9A] border border-[#E85A9A]/50 px-4 py-2 bg-white/80">
    Ver detalles
  </span>
</div>
```

**Imagen scale (línea 19):**
```tsx
className="... transition-transform duration-700 group-hover:scale-103"
```

**Por qué es agresivo:**
- `bg-white/60` - overlay blanco fuerte
- `opacity-0` → `opacity-100` - cambio drástico
- `scale-103` - zoom 3% demasiado
- "Ver detalles" con fondo blanco/80 - muy ecommerce
- `duration-700` en scale pero `duration-500` en overlay - inconsistente

**Sensación:** Ecommerce 2020, no luxury boutique.

#### Solución

**Hover muy sutil:**

**Opción 1: Sin overlay, solo scale mínimo**
```tsx
{/* Eliminar overlay completo */}

{/* Solo scale sutil en imagen */}
className="... transition-transform duration-700 group-hover:scale-102"
```

**Opción 2: Overlay oscuro MUY sutil**
```tsx
{/* Overlay negro suave */}
<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-700" />

{/* Texto aparece suave */}
<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
  <span className="text-[10px] tracking-[0.22em] uppercase text-white/90 px-3 py-1.5 border border-white/20 bg-black/40 backdrop-blur-sm">
    Ver pieza
  </span>
</div>
```

**Recomendación:** Opción 2 (oscuro sutil)

**Cambios:**
1. **Overlay:**
   - `bg-white/60` → `bg-black/0` hover `bg-black/10` (oscuro mínimo)
   
2. **Scale:**
   - `scale-103` (3%) → `scale-102` (2% máximo)
   - `duration-700` → mantiene (consistente)

3. **Texto "Ver detalles":**
   - Tamaño: `text-xs` → `text-[10px]`
   - Tracking: `tracking-widest` → `tracking-[0.22em]`
   - Color: `text-[#E85A9A]` → `text-white/90`
   - Fondo: `bg-white/80` → `bg-black/40 backdrop-blur-sm`
   - Border: `border-[#E85A9A]/50` → `border-white/20`
   - Texto: "Ver detalles" → "Ver pieza" (más boutique)

4. **Timing:**
   - Todo a `duration-700` (consistente)

**Sensación:**
- Sutil
- Sugiere, no grita
- Luxury boutique
- No agresivo

---

## ANTES / DESPUÉS COMPLETO

### ProductCard.tsx

#### Antes (Actual)
```tsx
<div className="relative overflow-hidden bg-[#0B0B0B] border border-[#E85A9A]/10 ...">
  {/* Image */}
  <div className="aspect-[3/4] ...">
    <img className="... group-hover:scale-103" />
    
    {/* Hover overlay FUERTE */}
    <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ...">
      <span className="... bg-white/80">Ver detalles</span>
    </div>
    
    {/* Badge auth VERDE FUERTE */}
    <Badge type="auth" label="✓" />
  </div>
  
  {/* Info PESADA */}
  <div className="p-5">
    <p className="text-xs tracking-[0.20em] ... text-[#E85A9A]/70">{product.brand}</p>
    <h3 className="text-base font-semibold ...">{product.model}</h3>
    <p className="text-xs text-gray-400 ...">{product.color} · {product.origin}</p>
    
    <div className="mt-3 flex items-center justify-between">
      {/* Precio BOLD TODO JUNTO */}
      <span className="text-lg font-bold ...">
        {formatPrice(product.price)}  {/* $189,000 MXN */}
      </span>
      
      {/* SLUG VISIBLE ← PROBLEMA CRÍTICO */}
      <span className="text-[10px] text-gray-600">{product.id}</span>
    </div>
  </div>
</div>
```

#### Después (Propuesto)
```tsx
<div className="relative overflow-hidden bg-[#111111] border border-[#E85A9A]/10 ...">
  {/* Image */}
  <div className="aspect-[3/4] ...">
    <img className="... group-hover:scale-102" />
    
    {/* Hover overlay SUTIL oscuro */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-700" />
    
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <span className="text-[10px] tracking-[0.22em] uppercase text-white/90 px-3 py-1.5 border border-white/20 bg-black/40 backdrop-blur-sm">
        Ver pieza
      </span>
    </div>
    
    {/* Badge auth CHARCOAL PREMIUM */}
    <Badge type="auth" label="✓ Verified" />
  </div>
  
  {/* Info MÁS LIGERA */}
  <div className="px-5 py-4">
    <p className="text-[11px] tracking-[0.22em] ... text-[#E85A9A]/70">{product.brand}</p>
    <h3 className="text-[15px] font-semibold leading-relaxed ...">{product.model}</h3>
    <p className="text-xs text-white/70 ...">{product.color} · {product.origin}</p>
    
    <div className="mt-3">
      {/* Precio SEPARADO ELEGANTE */}
      {product.price ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-[#E85A9A]">
            ${product.price.toLocaleString('es-MX')}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-white/60">
            MXN
          </span>
        </div>
      ) : (
        <span className="text-sm text-gray-500 italic">Consultar precio</span>
      )}
      
      {/* SLUG ELIMINADO ✅ */}
    </div>
  </div>
</div>
```

### Badge.tsx

#### Antes (Actual)
```tsx
auth: 'bg-white/70 text-emerald-400 border-emerald-500/20',
```

#### Después (Propuesto)
```tsx
auth: 'bg-[#1a1a1a]/80 text-white/80 border-white/10',
```

---

### 7. IMAGEN DOMINANTE (70-75% DEL CARD)

#### Problema Actual

**Proporción imagen vs info:**
- Imagen: `aspect-[3/4]` (ratio 3:4)
- Bloque info: `p-5` (padding 20px)
- Sensación: bloque texto compite con foto

**Por qué es malo:**
- El producto debe ser protagonista visual
- Bloque negro pesa demasiado comparado con imagen
- No se siente editorial

#### Solución

**Aumentar dominancia de imagen:**

**Opción 1: Reducir padding bloque info**
```tsx
{/* Antes */}
<div className="px-5 py-4">

{/* Después */}
<div className="px-4 py-3">
```

**Opción 2: Mantener aspect ratio imagen, reducir densidad info**
- Imagen mantiene `aspect-[3/4]`
- Reducir tamaños de texto
- Reducir spacing interno
- Hacer bloque info más compacto

**Recomendación:** Combinar ambas

**Objetivo visual:**
- Imagen: 70-75% del espacio visual total
- Info: 25-30% del espacio visual total
- Producto dominante, texto discreto

**Ajustes específicos:**
1. Padding bloque: `p-5` → `px-4 py-3`
2. Marca: ya optimizada `text-[11px]`
3. Modelo: ya optimizada `text-[15px]`
4. Meta: mantiene `text-xs`
5. Spacing entre elementos: ya optimizado `mt-1`, `mt-1.5`, `mt-3`

**Fondo imagen:**
- Mantener gradientes por marca
- Si no hay imagen: fondo crema/marfil `#FFFBF8` o `#F5F1ED`

```tsx
{/* Fallback sin imagen - fondo premium */}
<div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFFBF8]">
  <span className="font-[family-name:var(--font-playfair)] text-3xl text-[#0B0B0B]/10 tracking-widest">
    {product.brand}
  </span>
  <span className="text-xs text-[#0B0B0B]/20 mt-2 tracking-wider">
    Imagen próximamente
  </span>
</div>
```

**object-cover:** Ya implementado correctamente.

---

### 8. ESPACIADO REFINADO

#### Problema Actual

**Spacing bloque info:**
```tsx
<div className="p-5">
  <p className="...">Marca</p>
  <h3 className="... mt-1">Modelo</h3>
  <p className="... mt-1">Color · Origen</p>
  <div className="mt-3 ...">Precio + Slug</div>
</div>
```

**Análisis:**
- Marca → Modelo: `mt-1` (4px) - muy pegado
- Modelo → Meta: `mt-1` (4px) - muy pegado
- Meta → Precio: `mt-3` (12px) - correcto
- Padding contenedor: `p-5` (20px) - podría ser más refinado

**Por qué es malo:**
- Todo se siente apretado
- No respira
- Card no se siente "silenciosa"

#### Solución

**Espaciado premium:**

```tsx
<div className="px-4 py-3.5">
  {/* Marca */}
  <p className="text-[11px] tracking-[0.22em] uppercase font-medium text-[#E85A9A]/70">
    {product.brand}
  </p>
  
  {/* Modelo - más aire */}
  <h3 className="text-[15px] font-semibold text-white mt-2 leading-relaxed">
    {product.model}
  </h3>
  
  {/* Meta - más aire */}
  <p className="text-xs text-white/70 mt-1.5">
    {product.color} · {product.origin}
  </p>
  
  {/* Precio - separación clara */}
  <div className="mt-4">
    {/* Precio separado */}
  </div>
</div>
```

**Cambios específicos:**
1. **Padding contenedor:** `p-5` → `px-4 py-3.5` (16px horizontal, 14px vertical)
2. **Marca → Modelo:** `mt-1` → `mt-2` (4px → 8px)
3. **Modelo → Meta:** `mt-1` → `mt-1.5` (4px → 6px)
4. **Meta → Precio:** `mt-3` → `mt-4` (12px → 16px)

**Comparación:**

| Transición | Antes | Después | Aumento |
|------------|-------|---------|---------|
| Padding contenedor | 20px | 16px horiz / 14px vert | Más refinado |
| Marca → Modelo | 4px | 8px | +100% |
| Modelo → Meta | 4px | 6px | +50% |
| Meta → Precio | 12px | 16px | +33% |

**Sensación:** Card respira, elementos claramente separados, "silenciosa".

---

### 9. FOCUS AZUL DEL HEADER/NAV

#### Problema Actual

**Síntoma:**
> "Se ve un borde azul de foco sobre 'Catálogo'. Visualmente rompe la estética."

**Causa:**
Focus ring nativo del navegador (azul por defecto).

**Ubicación probable:**
```tsx
{/* Navbar.tsx - Link Catálogo */}
<Link href="/catalogo" className="...">
  Catálogo
</Link>
```

**Sin focus-visible custom:**
Browser aplica `outline: 2px solid blue` (o similar).

#### Solución

**Reemplazar focus azul por fucsia Bagclue:**

```tsx
{/* Estilo global focus-visible premium */}
className="... outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
```

**Aplicar en:**
1. Links nav principal
2. Botones header
3. Mega menú links (si aplica)

**Ejemplo completo:**
```tsx
<Link 
  href="/catalogo" 
  className="text-sm tracking-[0.16em] uppercase hover:text-[#E85A9A] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
>
  Catálogo
</Link>
```

**Accesibilidad:**
- ✅ `focus-visible` mantiene accesibilidad (solo visible con keyboard)
- ✅ Ring fucsia visible y claro
- ✅ Offset 2px separa del elemento
- ❌ NO elimina focus completamente (`outline-none` solo quita default)

**NO tocar:**
- Mega menú interno (solo si tiene focus azul visible)
- Links que ya funcionan bien

---

### 10. HEADER NAV MICROAJUSTE

#### Estado Actual Navbar.tsx (Verificado)

**Links nav actuales:**
```tsx
<Link 
  href={l.href} 
  className="font-[family-name:var(--font-inter)] text-sm tracking-[0.16em] uppercase text-gray-600 hover:text-[#E85A9A] transition-colors"
>
  {l.label}
</Link>
```

**Botón Catálogo:**
```tsx
<button
  className="font-[family-name:var(--font-inter)] text-sm tracking-[0.16em] uppercase text-gray-600 hover:text-[#E85A9A] transition-colors flex items-center gap-1"
>
  Catálogo
</button>
```

**Análisis:**
- ✅ Tracking: `tracking-[0.16em]` - correcto (NO excesivo)
- ✅ Tamaño: `text-sm` - correcto (fino)
- ✅ Fucsia: `text-gray-600 hover:text-[#E85A9A]` - correcto (solo hover)
- ❌ Focus state: NO tiene focus-visible custom (usa azul nativo)

#### Solución

**SOLO se requiere agregar focus-visible custom:**

```tsx
{/* Links nav */}
<Link 
  href={l.href} 
  className="font-[family-name:var(--font-inter)] text-sm tracking-[0.16em] uppercase text-gray-600 hover:text-[#E85A9A] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
>
  {l.label}
</Link>
```

```tsx
{/* Botón Catálogo */}
<button
  className="font-[family-name:var(--font-inter)] text-sm tracking-[0.16em] uppercase text-gray-600 hover:text-[#E85A9A] transition-colors flex items-center gap-1 outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
>
  Catálogo
</button>
```

```tsx
{/* Link "Mi cuenta" */}
<Link 
  href="/account" 
  className="font-[family-name:var(--font-inter)] text-sm tracking-[0.16em] uppercase text-gray-600 hover:text-[#E85A9A] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
>
  Mi cuenta
</Link>
```

```tsx
{/* Logo BAGCLUE */}
<Link 
  href="/" 
  className="font-[family-name:var(--font-playfair)] text-xl tracking-[0.3em] text-[#0B0B0B] hover:text-[#E85A9A] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
>
  BAGCLUE
</Link>
```

**Clase focus-visible a agregar:**
```
outline-none focus-visible:ring-1 focus-visible:ring-[#E85A9A] focus-visible:ring-offset-2 focus-visible:ring-offset-white
```

**Aplicar en:**
1. Links nav (Recién llegadas, Apartado, Autenticidad, Nosotros, Contacto)
2. Botón Catálogo
3. Link Mi cuenta
4. Link Instagram (opcional)
5. Logo BAGCLUE
6. Mobile menu links (todos)

**Total cambios:** ~10-12 líneas (agregar clase focus-visible a todos los links/buttons nav)

---

## MICRODETALLES HEADER (CONFIRMADO)

**Mención auditoría:**
> "...y algunos microdetalles del header"

**Posible problema:** Focus state azul por defecto en links/inputs.

**Verificar:**
1. Si existe focus azul navegador por defecto
2. Si debe cambiarse a fucsia o eliminarse
3. Si afecta accesibilidad

**Solución típica:**
```css
/* Global focus state premium */
*:focus-visible {
  outline: 2px solid #E85A9A;
  outline-offset: 2px;
}
```

**Pendiente:** Confirmar si este cambio es necesario tras validar ProductCard.

---

## TESTING OBLIGATORIO (16 PUNTOS)

### Build & Deploy (2/16)
1. [ ] Build PASS
2. [ ] Deploy production manual si auto-deploy falla

### Rutas Críticas (4/16)
3. [ ] `/` carga correctamente
4. [ ] `/catalogo` carga correctamente
5. [ ] Product cards ya NO muestran slug
6. [ ] Product cards se ven más editoriales y menos ecommerce

### Estilo Cards (3/16)
7. [ ] Precio se ve refinado con MXN separado
8. [ ] Badges se ven discretos
9. [ ] Hover es sutil, sin overlay pesado

### Funcionalidad Existente (5/16)
10. [ ] Mega menú sigue funcionando
11. [ ] Query params siguen funcionando
12. [ ] `/catalogo/[slug]` sigue cargando
13. [ ] Carrito sigue funcionando
14. [ ] Mobile no se rompe

### Calidad Técnica (2/16)
15. [ ] No hay errores críticos en consola
16. [ ] No se tocaron áreas prohibidas

---

## ESTIMACIÓN

**Complejidad:** Baja-Media  
**Archivos:** 3-4  
**Tiempo estimado:** 2-3 horas  
**Riesgo:** Bajo (solo UI/styling)

**Fases:**
1. ProductCard.tsx cambios (10 puntos) - 60min
2. Badge.tsx auth premium - 15min
3. Navbar.tsx focus + microajustes - 30min
4. Build + deploy - 10min
5. Testing 16 puntos - 30min
6. Ajustes menores - 15min

**Total:** ~2.5 horas

---

## DECISIÓN IMPLEMENTACIÓN

**Esperando aprobación para implementar:**

1. ¿Aprobar scope completo Fase 2F (10 cambios)?
2. ¿Color charcoal: `#111111` o `#151515`?
3. ¿Badge auth texto: "✓ Verified" o "Entrupy ✓"?
4. ¿Hover: oscuro sutil con texto "Ver pieza"?
5. ¿Fondo fallback sin imagen: `#FFFBF8` (marfil) o `#F5F1ED` (crema)?
6. ¿Padding bloque info: `px-4 py-3` o `px-4 py-3.5`?

**Valores por defecto recomendados si no se especifica:**
- Charcoal: `#111111`
- Badge auth: "✓ Verified"
- Hover: oscuro sutil con "Ver pieza"
- Fallback: `#FFFBF8` (marfil)
- Padding: `px-4 py-3.5`

**NO implementaré hasta recibir confirmación explícita: "implementa Fase 2F" o similar.**

---

## SIGUIENTE PASO

Tras aprobación:
1. Implementar 10 cambios (ProductCard + Badge + Navbar)
2. Build local PASS
3. Deploy production manual
4. Testing 16 puntos obligatorios
5. Capturas/descripción visual antes/después
6. Entrega: `WEB_POLISH_FASE2F_PRODUCT_CARDS_PREMIUM_ENTREGA.md`

---

## ENTREGA ESPERADA

### Documentación
- `WEB_POLISH_FASE2F_PRODUCT_CARDS_PREMIUM_ENTREGA.md`
  - Archivos modificados (3-4)
  - Antes/después descrito (10 puntos)
  - Qué se quitó de las cards (slug visible)
  - Qué se cambió en precio/badges/hover/spacing
  - Build result (37/37 routes)
  - Commit hash + mensaje
  - Deploy URL production
  - Testing 16/16 PASS/FAIL
  - Capturas o descripción visual

### Archivos Modificados
1. `src/components/ProductCard.tsx` (8 cambios)
2. `src/components/Badge.tsx` (1 cambio)
3. `src/components/Navbar.tsx` (1 cambio focus-visible)
4. Posible: global CSS si focus-visible requiere

### URLs Para Validar
- `/` (landing featured products)
- `/catalogo` (grid completo)
- `/catalogo/chanel-classic-flap-negro` (product detail con related)
- Mobile responsive

### Testing 16 Puntos
- Build + deploy
- Rutas críticas
- Estilo cards
- Funcionalidad existente
- Calidad técnica

---

**Esperando autorización explícita para implementar Fase 2F.**
