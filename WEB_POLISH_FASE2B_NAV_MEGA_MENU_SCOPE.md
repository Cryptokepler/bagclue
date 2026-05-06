# WEB POLISH FASE 2B — NAV PREMIUM + MEGA MENÚ CATÁLOGO

**Fecha:** 2026-05-06  
**Proyecto:** Bagclue  
**Estado:** SCOPE — PENDIENTE APROBACIÓN  

---

## 1. PROBLEMAS ACTUALES

1. ❌ Menú se ve simple/rústico (solo links planos)
2. ❌ "París 2U" no se entiende para clienta nueva
3. ❌ Cliente no puede previsualizar marcas/categorías sin ir a catálogo
4. ❌ Catálogo y Recién llegadas no están claramente diferenciados
5. ❌ Falta sensación boutique femenina premium

---

## 2. ARCHIVOS A MODIFICAR

### Modificaciones directas
- ✅ `src/components/Navbar.tsx` - Menú principal
- ✅ `src/app/catalogo/page.tsx` - Soporte para query params URL

### Nuevos componentes
- ✨ `src/components/MegaMenu.tsx` - Mega menú desplegable
- ✨ `src/components/MegaMenuColumn.tsx` - Columna de marcas/categorías
- ✨ `src/components/MegaMenuPreview.tsx` - Preview cards de productos

### CSS/Tailwind (sin archivos nuevos)
- Estilos inline con Tailwind (hover effects, transitions)

---

## 3. MENÚ FINAL PROPUESTO

### Desktop

```
Logo BAGCLUE → /
├─ Catálogo → /catalogo
├─ Diseñadores ↓ [MEGA MENÚ]
│  ├─ Columna 1: Chanel
│  │  ├─ Classic Flap → /catalogo?brand=Chanel&model=Classic%20Flap
│  │  ├─ Chanel 25 → /catalogo?brand=Chanel&model=25
│  │  ├─ Boy → /catalogo?brand=Chanel&model=Boy
│  │  ├─ Wallet on Chain → /catalogo?brand=Chanel&model=WOC
│  │  └─ Ver todo Chanel → /catalogo?brand=Chanel
│  ├─ Columna 2: Hermès
│  │  ├─ Birkin → /catalogo?brand=Hermès&model=Birkin
│  │  ├─ Kelly → /catalogo?brand=Hermès&model=Kelly
│  │  ├─ Constance → /catalogo?brand=Hermès&model=Constance
│  │  └─ Ver todo Hermès → /catalogo?brand=Hermès
│  ├─ Columna 3: Otras marcas
│  │  ├─ Louis Vuitton → /catalogo?brand=Louis%20Vuitton
│  │  ├─ Dior → /catalogo?brand=Dior
│  │  ├─ Goyard → /catalogo?brand=Goyard
│  │  └─ Ver todas → /catalogo
│  ├─ Columna 4: Categorías
│  │  ├─ Bolsas → /catalogo?category=Bolsas
│  │  ├─ Zapatos → /catalogo?category=Zapatos
│  │  ├─ Joyería → /catalogo?category=Joyería
│  │  ├─ Accesorios → /catalogo?category=Accesorios
│  │  └─ Recién llegadas → /catalogo?sort=newest
│  └─ Preview: 2 product cards con foto + marca + CTA
├─ Recién llegadas → /catalogo?sort=newest
├─ Apartado → /apartado
├─ Autenticidad → /#autenticidad
├─ Nosotros → /nosotros
├─ Contacto → /contacto
├─ Instagram icon → https://instagram.com/salebybagcluemx
└─ Mi cuenta → /account
```

### Mobile

```
[☰ Menu]
├─ Logo BAGCLUE → /
├─ Catálogo → /catalogo
├─ Diseñadores [Expandible ▼]
│  ├─ Chanel → /catalogo?brand=Chanel
│  ├─ Hermès → /catalogo?brand=Hermès
│  ├─ Louis Vuitton → /catalogo?brand=Louis%20Vuitton
│  ├─ Dior → /catalogo?brand=Dior
│  └─ Todas las marcas → /catalogo
├─ Categorías [Expandible ▼]
│  ├─ Bolsas → /catalogo?category=Bolsas
│  ├─ Zapatos → /catalogo?category=Zapatos
│  ├─ Joyería → /catalogo?category=Joyería
│  └─ Accesorios → /catalogo?category=Accesorios
├─ Recién llegadas → /catalogo?sort=newest
├─ Apartado → /apartado
├─ Autenticidad → /#autenticidad
├─ Nosotros → /nosotros
├─ Contacto → /contacto
├─ Mi cuenta → /account
└─ [Instagram CTA button]
```

---

## 4. CÓMO FUNCIONARÁ MEGA MENÚ DESKTOP

### Trigger
- **Hover:** Al pasar mouse sobre "Diseñadores" (desktop)
- **Click:** Alternativa para touch devices desktop

### Contenido
- **Layout:** Grid 4 columnas + preview lateral
- **Columnas:**
  - Col 1: Chanel (4-5 modelos + "Ver todo")
  - Col 2: Hermès (3-4 modelos + "Ver todo")
  - Col 3: Otras marcas (Louis Vuitton, Dior, Goyard + "Ver todas")
  - Col 4: Categorías (Bolsas, Zapatos, Joyería, Accesorios, Recién llegadas)
- **Preview:** 2 product cards con:
  - Imagen real de Supabase (si disponible)
  - Marca
  - Modelo/Título
  - Badge "Nueva" o "Única" si aplica
  - CTA "Ver pieza" → link a detalle

### Estética
- Fondo: `bg-white` o `bg-[#FFFBF8]` (crema suave)
- Bordes: `border border-[#E85A9A]/10`
- Padding: generoso (`p-8`)
- Sombra: `shadow-2xl`
- Títulos: `uppercase tracking-widest text-[#0B0B0B]`
- Links: `text-gray-600 hover:text-[#E85A9A]`
- Badges: `bg-[#FFF4A8] text-[#0B0B0B]` (amarillo pastel para "Nueva")
- Badges premium: `bg-[#E85A9A]/10 text-[#E85A9A]` (rosa para "Única")

### Comportamiento
- Aparece con `transition-all duration-300`
- Se oculta al salir del área del menú + panel
- No bloquea scroll de página
- z-index alto para superponerse a contenido

---

## 5. CÓMO FUNCIONARÁ MOBILE

### Trigger
- Botón hamburguesa toggle (ya existente)

### Contenido
- Menu drawer full-height
- Acordeones para "Diseñadores" y "Categorías"
- Links grandes (min-height 48px) para touch fácil
- Scroll vertical si contenido excede viewport

### Diseñadores (expandible)
```
Diseñadores ▼
  ├─ Chanel
  ├─ Hermès
  ├─ Louis Vuitton
  ├─ Dior
  ├─ Goyard
  └─ Todas las marcas
```

### Categorías (expandible)
```
Categorías ▼
  ├─ Bolsas
  ├─ Zapatos
  ├─ Joyería
  └─ Accesorios
```

### Estética mobile
- Fondo: `bg-white/98 backdrop-blur-md`
- Separadores: `border-b border-gray-100`
- Padding: `px-6 py-4`
- Acordeón icono: `▼` / `▲`

---

## 6. LINKS EXISTENTES VS NO EXISTENTES

### ✅ Links que YA EXISTEN y FUNCIONAN

- `/` - Home (landing)
- `/catalogo` - Catálogo
- `/apartado` - Apartado
- `/nosotros` - Nosotros (página existe, verificado)
- `/contacto` - Contacto (página existe, verificado)
- `/account` - Mi cuenta
- `/#autenticidad` - Anchor a sección en landing (agregado en commit anterior)

### ⚠️ Links que NO FUNCIONAN TODAVÍA (requieren implementación)

- `/catalogo?brand=Chanel` - Catálogo NO lee query params de URL
- `/catalogo?brand=Hermès` - Catálogo NO lee query params de URL
- `/catalogo?category=Bolsas` - Catálogo NO lee query params de URL
- `/catalogo?sort=newest` - Catálogo NO lee query params de URL
- `/catalogo?model=Birkin` - Catálogo NO lee query params de URL

**Motivo:** El catálogo actual usa state local (`brandFilter`, `statusFilter`) pero NO lee `searchParams` de URL.

---

## 7. QUÉ QUERY PARAMS YA SOPORTA /CATALOGO

### Estado actual del catálogo

**Análisis de `src/app/catalogo/page.tsx`:**

```typescript
// ❌ NO lee query params de URL
export default function CatalogoPage() {
  const [brandFilter, setBrandFilter] = useState<Brand | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  
  // Filtros son SOLO state local
  const filtered = products.filter(p => {
    if (brandFilter && p.brand !== brandFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });
}
```

**Query params soportados:** ❌ NINGUNO

**Funcionalidad actual:**
- ✅ Fetch de todos los productos publicados
- ✅ Filtros locales por marca (dropdown UI)
- ✅ Filtros locales por status (dropdown UI)
- ✅ Order por `created_at desc` (más reciente primero)
- ❌ NO lee URL searchParams
- ❌ NO sincroniza filtros con URL
- ❌ NO permite deep links filtrados

---

## 8. QUÉ SE IMPLEMENTA AHORA VS DESPUÉS

### FASE 2B — IMPLEMENTAR AHORA (MVP Mega Menú)

#### Desktop
1. ✅ Componente `MegaMenu.tsx` con hover trigger
2. ✅ Grid 4 columnas estático (marcas + categorías)
3. ✅ Links mega menú → `/catalogo` sin query params (temporalmente)
4. ✅ Preview cards con 2 productos reales de Supabase
5. ✅ Estética premium: fondo crema, bordes rosa, hover effects
6. ✅ Transiciones suaves (fade in/out)

#### Mobile
1. ✅ Acordeones para "Diseñadores" y "Categorías"
2. ✅ Links móviles → `/catalogo` sin query params (temporalmente)
3. ✅ Touch-friendly (min 48px height)

#### Links temporales (sin query params)
- Chanel → `/catalogo` (muestra todo el catálogo)
- Hermès → `/catalogo`
- Bolsas → `/catalogo`
- Recién llegadas → `/catalogo`

**Nota:** Links apuntan a catálogo completo. Cliente debe usar filtros UI una vez en página.

---

### FASE 2C — IMPLEMENTAR DESPUÉS (Query Params Funcionales)

⏳ **Requiere modificación de `/catalogo/page.tsx`**

1. ⏳ Agregar soporte `useSearchParams()` en catálogo
2. ⏳ Leer `brand`, `category`, `model`, `sort` de URL
3. ⏳ Aplicar filtros automáticamente al cargar
4. ⏳ Sincronizar filtros UI con URL (push state)
5. ⏳ Actualizar links mega menú:
   - Chanel → `/catalogo?brand=Chanel`
   - Hermès → `/catalogo?brand=Hermès`
   - Bolsas → `/catalogo?category=Bolsas`
   - Recién llegadas → `/catalogo?sort=newest`
6. ⏳ Deep links compartibles (SEO friendly)

**Estimación:** 2-3h de desarrollo + testing

**Decisión:** Jhonatan debe aprobar si se implementa en FASE 2B o se deja para 2C.

---

## 9. CRITERIOS DE CIERRE FASE 2B

### Desktop ✅

1. ✅ Mega menú aparece al hover en "Diseñadores"
2. ✅ Grid 4 columnas visible con marcas + categorías
3. ✅ Preview cards muestran 2 productos reales (o placeholder si no hay)
4. ✅ Todos los links funcionan (apuntan a `/catalogo` temporalmente)
5. ✅ Estética premium: fondo crema, bordes rosa, hover effects
6. ✅ Transiciones suaves sin lag
7. ✅ Mega menú se cierra al salir del área
8. ✅ No rompe scroll de página

### Mobile ✅

1. ✅ Acordeones "Diseñadores" y "Categorías" funcionan
2. ✅ Links móviles funcionan
3. ✅ Touch-friendly (áreas grandes)
4. ✅ Scroll vertical funciona si contenido largo

### General ✅

1. ✅ Build PASS sin errores
2. ✅ Deploy production exitoso
3. ✅ Logo BAGCLUE lleva a `/`
4. ✅ No errores en consola
5. ✅ Áreas prohibidas NO tocadas

### Áreas NO tocadas ✅

- ✅ Backend - NO tocado
- ✅ DB - NO tocada
- ✅ Stripe - NO tocado
- ✅ Webhook - NO tocado
- ✅ Checkout logic - NO tocada
- ✅ Orders logic - NO tocada
- ✅ Admin - NO tocado
- ✅ Customer panel - NO tocado
- ✅ RLS - NO tocado
- ✅ Migrations - NO tocadas

---

## 10. QUÉ NO TOCAR

### Backend/API
- ❌ NO modificar rutas API
- ❌ NO crear nuevos endpoints
- ❌ NO cambiar lógica de Supabase queries (solo en catálogo page si se aprueba query params)

### Base de datos
- ❌ NO modificar schema
- ❌ NO crear tablas
- ❌ NO alterar RLS policies
- ❌ NO ejecutar migrations

### Lógica de negocio
- ❌ NO modificar checkout
- ❌ NO modificar orders
- ❌ NO modificar apartado logic
- ❌ NO modificar Stripe integration
- ❌ NO modificar webhook handlers

### Áreas administrativas
- ❌ NO modificar admin panel
- ❌ NO modificar customer account panel
- ❌ NO modificar inventario logic

### Solo modificar
- ✅ UI/componentes públicos (Header, Navbar, MegaMenu)
- ✅ Catálogo page (solo si se aprueba query params en FASE 2B)
- ✅ Estilos Tailwind inline

---

## 11. DECISIONES PENDIENTES DE JHONATAN

### Decisión 1: Query Params en FASE 2B o 2C?

**Opción A (MVP rápido):**
- ✅ Implementar mega menú AHORA (FASE 2B)
- ⏳ Links apuntan a `/catalogo` sin filtros
- ⏳ Query params en FASE 2C separada (después)

**Opción B (Feature completo):**
- ✅ Implementar mega menú + query params juntos (FASE 2B)
- ✅ Links con filtros funcionales desde el inicio
- ⏳ Requiere ~2-3h adicionales

**Recomendación Kepler:** Opción A (MVP rápido). Mega menú mejora UX inmediatamente. Query params pueden ser fase separada.

### Decisión 2: Preview cards en mega menú

**Opción A:** 2 productos reales de Supabase (fetch en Header)  
**Opción B:** Cards estáticas con imágenes placeholder  
**Opción C:** Sin preview (solo links)

**Recomendación Kepler:** Opción A si hay productos disponibles en Supabase. Si fetch es lento, usar Opción B temporalmente.

### Decisión 3: Mantener "Recién llegadas" en menú principal?

**Opción A:** Sí, mantener en menú + dentro de mega menú (doble acceso)  
**Opción B:** Solo dentro de mega menú (liberar espacio en menú principal)

**Recomendación Kepler:** Opción A. Novedades merecen visibilidad doble (menú principal + mega menú).

---

## 12. ESTIMACIÓN DE IMPLEMENTACIÓN

### FASE 2B MVP (sin query params)
- **Tiempo:** 1.5 - 2h
- **Componentes:** MegaMenu.tsx, ajustes Navbar.tsx
- **Testing:** Desktop + Mobile
- **Deploy:** Production

### FASE 2C (query params funcionales)
- **Tiempo:** 2 - 3h
- **Modificaciones:** Catálogo page + actualizar links mega menú
- **Testing:** Deep links + filtros + SEO
- **Deploy:** Production

**Total si se hace todo:** ~4-5h

---

## 13. REFERENCIAS VISUALES

### Inspiración boutique lujo
- **Hermès:** Mega menú con preview de productos
- **Net-a-Porter:** Categorías por diseñador con hover preview
- **The RealReal:** Navegación preloved con marcas destacadas
- **Vestiaire Collective:** Mega menú con filtros visuales

### Paleta Bagclue
- Fondo: `#FFFBF8` (crema suave)
- Rosa principal: `#E85A9A`
- Amarillo pastel: `#FFF4A8`
- Negro: `#0B0B0B`
- Gris texto: `#6B7280` (gray-600)
- Blanco: `#FFFFFF`

---

## 14. PRÓXIMOS PASOS

1. ✅ **Jhonatan revisa scope**
2. ⏳ **Jhonatan decide:**
   - Query params en FASE 2B o 2C?
   - Preview cards: productos reales, placeholder o sin preview?
   - "Recién llegadas" en menú principal + mega menú?
3. ⏳ **Kepler implementa según decisiones**
4. ✅ **QA visual en producción**
5. ✅ **Cierre FASE 2B**

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-06  
**Estado:** PENDIENTE APROBACIÓN JHONATAN
