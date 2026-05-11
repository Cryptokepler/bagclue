# HOME 500 DIAGNOSTIC AND FIX REPORT

**Fecha:** 2026-05-11  
**Responsable:** Kepler  
**Prioridad:** Crítica  
**Estado:** ✅ RESUELTO

---

## DIAGNÓSTICO

### Verificación Inicial
```
GET https://bagclue.vercel.app/     → HTTP 500 ✗
GET https://bagclue.vercel.app/catalogo  → HTTP 200 ✓
GET https://bagclue.vercel.app/cart      → HTTP 200 ✓
```

**Conclusión:** Error específico en homepage, catálogo y cart operativos.

### Commit Production
- **Commit actual:** cf56476 (feat: emails FASE 2)
- **Branch:** main
- **Deployment:** dpl_FbfKNYc9uYxpr5fnvu469xEiH3F4
- **Estado:** READY, PROMOTED

### Auditoría del Código

**Archivo afectado:** `src/app/page.tsx`

La función `getFeaturedProducts()` hace query a Supabase:
```typescript
.select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
.eq('is_published', true)
.in('status', ['available', 'preorder'])
.order('created_at', { ascending: false })
.limit(6)
```

Los productos se transforman y pasan a `ProductCard` component.

### Query Directa a DB

```json
{
  "id": "ef063ef8-e911-4f87-8f1b-7c36f1383fd1",
  "slug": "qa-email-comprobante-rechazado",
  "brand": "Test Brand",      ← ❌ NO EXISTE EN brandGradients
  "model": null,               ← ❌ ProductCard espera string
  "title": "QA Email Comprobante Rechazado",
  "color": "Azul",
  "origin": null,              ← ❌ ProductCard espera string
  "price": 30,
  "status": "available",
  "is_published": true         ← ❌ PUBLICADO EN PRODUCCIÓN
}
```

---

## CAUSA RAÍZ

**Producto de test con datos inválidos publicado en producción.**

### Impacto Técnico

1. **`brandGradients["Test Brand"]`** → `undefined`
   - `ProductCard.tsx` línea 6: `const gradient = brandGradients[product.brand]`
   - TypeScript/Runtime error: Cannot access property of undefined

2. **`product.model = null`** → Error en template string
   - Componente espera string, recibe null

3. **`product.origin = null`** → Error en renderizado
   - Template literal intenta interpolar null sin fallback

### Error React Server Component
```
18:E{"digest":"3756559897"}
```

Este digest indica error en server-side rendering durante la transformación/renderizado de productos featured.

---

## FIX APLICADO

### 1. Fix Inmediato (DB Cleanup)

```bash
# Despublicar producto de test
supabase
  .from('products')
  .update({ is_published: false })
  .eq('id', 'ef063ef8-e911-4f87-8f1b-7c36f1383fd1')
```

**Resultado:** Homepage vuelve a HTTP 200 inmediatamente.

### 2. Fix Preventivo (Defensive Code)

**Archivo:** `src/app/page.tsx`

```typescript
const transformedProducts: LegacyProduct[] = (productsData || [])
  .filter((p: any) => {
    // Filter out products with invalid brands that would break rendering
    const validBrands = ['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga'];
    return validBrands.includes(p.brand);
  })
  .map((p: any) => ({
    id: p.slug || p.id,
    slug: p.slug || undefined,
    brand: p.brand as Brand,
    model: p.model || p.title || 'Sin modelo',  // ✓ Fallback
    color: p.color || 'N/A',                     // ✓ Fallback
    origin: p.origin || 'N/A',                   // ✓ Fallback
    status: dbStatusToLegacy(p.status),
    price: typeof p.price === 'number' ? p.price : null,  // ✓ Type guard
    category: p.category as any,
    image: p.product_images?.[0]?.url || '',
    badge: p.badge || undefined,
    description: p.description || undefined
  }));
```

**Archivo:** `src/components/ProductCard.tsx`

```typescript
export default function ProductCard({ product }: { product: Product }) {
  const defaultGradient = { from: '#1a1a1a', to: '#4A4A4A' };
  const gradient = product.brand in brandGradients 
    ? brandGradients[product.brand]
    : defaultGradient;  // ✓ Fallback seguro

  // ...

  <p className="font-[family-name:var(--font-inter)] text-xs text-white/70 mt-1.5">
    {product.color || 'N/A'} · {product.origin || 'N/A'}  // ✓ Null handling
  </p>

  // ...

  {product.price && typeof product.price === 'number' ? (  // ✓ Type guard
    <span className="font-[family-name:var(--font-inter)] text-xl font-semibold text-[#E85A9A]">
      ${product.price.toLocaleString('es-MX')}
    </span>
  ) : (
    <span className="font-[family-name:var(--font-inter)] text-sm text-gray-500 italic">
      Consultar precio
    </span>
  )}
}
```

### 3. Build Local

```bash
npm run build
```

**Resultado:**
```
✓ Compiled successfully in 11.2s
✓ Generating static pages (42/42)
✓ Finalizing page optimization

Route (app)
├ ƒ /               ← ✓ Homepage compilada
├ ƒ /catalogo       ← ✓ Catálogo compilado
[...]
```

**Build:** PASS  
**TypeScript:** PASS  
**Errores:** 0

---

## DEPLOY VERIFICATION (POLÍTICA 12)

### Checklist Obligatorio

1. ✅ **Build local:** PASS, sin errores TypeScript
2. ✅ **Commit:** 5a6e554 — "fix(homepage): defensive handling for invalid product data"
3. ✅ **Push:** Exitoso a origin/main
4. ✅ **Deploy production:** Manual via Vercel CLI (auto-deploy no se activó)
5. ✅ **Commit Vercel:** 5a6e554
6. ✅ **Commit esperado:** 5a6e554
7. ✅ **Match:** YES (commits coinciden)
8. ✅ **Validación funcional:** Ver sección siguiente

### Verificación Production

```bash
# HTTP Status
Homepage:  200 ✓
Catalogo:  200 ✓
Cart:      200 ✓

# Commit Production
State:     READY
Commit:    5a6e554
Target:    production
Match:     YES ✓

# Content Validation
Homepage muestra: Chanel, Hermès, Goyard ✓
Productos featured: 2 productos Goyard visibles ✓
SearchBar: Renderizada correctamente ✓
Secciones: Hero, Featured, Brands, Categories, CTA ✓
```

### Rutas Validadas

- `/` → HTTP 200, productos featured visibles, sin errores 500
- `/catalogo` → HTTP 200, catálogo completo operativo
- `/cart` → HTTP 200, carrito funcional

---

## DEPLOYMENT REPORT

**Deploy ID:** generado por Vercel CLI  
**Deployment URL:** https://bagclue.vercel.app  
**Vercel Status:** READY / PROMOTED  
**Production Commit:** 5a6e554  
**Expected Commit:** 5a6e554  
**Match:** ✅ YES  
**Production URL:** https://bagclue.vercel.app  
**Cambio visible en producción:** ✅ YES  
**Console errors:** ❌ NO  

---

## LECCIONES APRENDIDAS

### 1. Control de Calidad en DB
- **Problema:** Productos de test con `is_published = true` en producción
- **Impacto:** Homepage 500, pérdida de ventas
- **Prevención:** 
  - Usar DB separada para QA/test
  - Nunca publicar productos con marcas no soportadas
  - Implementar validación de schema en API admin antes de publish

### 2. Defensive Programming
- **Problema:** ProductCard asume que todos los campos son válidos
- **Impacto:** Cualquier dato mal formateado rompe la aplicación
- **Solución:** 
  - Filtrado preventivo en getFeaturedProducts
  - Fallbacks para todos los campos opcionales
  - Type guards antes de operaciones (toLocaleString, etc.)

### 3. Deploy Verification Obligatorio
- **Problema:** Asumir que "commit cf56476 está deployed" sin verificar
- **Impacto:** Error existía desde cf56476 pero no se detectó hasta ahora
- **Solución:** POLÍTICA 12 aplicada correctamente en este fix

### 4. Auto-Deploy Reliability
- **Problema:** Push a main no activó auto-deploy de Vercel
- **Causa probable:** Webhook GitHub-Vercel falló o fue ignorado
- **Solución:** Siempre verificar deployment actual después de push
- **Backup:** Deploy manual via CLI cuando auto-deploy falla

---

## PRÓXIMOS PASOS

### Corto Plazo (No bloquea nuevas fases)
1. ✅ Producto test despublicado
2. ✅ Código defensivo implementado
3. ✅ Deploy verification completado

### Mediano Plazo (Mejoras recomendadas)
1. Agregar validación de brand en API admin/productos
2. Implementar schema validation con Zod/Yup antes de publish
3. Crear DB/entorno separado para QA
4. Documentar marcas soportadas en admin UI

### Monitoreo
- Homepage debe mantener HTTP 200 ✓
- Verificar que no aparezcan más productos con marcas inválidas
- Revisar logs de Vercel para detectar errores early

---

## CONCLUSIÓN

**Homepage restaurada a HTTP 200.**  
**Código defensivo previene futuras roturas por datos inválidos.**  
**Deploy verification completado según POLÍTICA 12.**  

✅ **SAFE TO PROCEED con próximas fases.**

**NO bloqueante para:**
- Welcome Email (Fase 3)
- Stripe Live
- Production checklist
- Nuevas features

**Causa raíz documentada. Fix aplicado. Prevención implementada.**

---

**Report generado:** 2026-05-11 09:55 UTC  
**Kepler / KeplerAgents**
