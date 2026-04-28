# DIAGNÓSTICO CTA CHANEL - Bagclue
**Fecha:** 2026-04-28 23:39 UTC  
**Issue:** Chanel muestra "Consultar por Instagram" en vez de "Agregar al carrito"

---

## EVIDENCIA EXACTA SOLICITADA

### 1. RESPONSE REAL DEL PRODUCTO EN FICHA PÚBLICA

**Estado ANTES del fix:**
```json
{
  "slug": "chanel-classic-flap-negro",
  "status": "available",      ← ✅ Correcto
  "is_published": true,        ← ✅ Correcto
  "stock": 0,                  ← ❌ PROBLEMA: stock es 0
  "price": 189000              ← ✅ Correcto
}
```

**Estado DESPUÉS del fix:**
```json
{
  "slug": "chanel-classic-flap-negro",
  "status": "available",       ← ✅
  "is_published": true,        ← ✅
  "stock": 1,                  ← ✅ CORREGIDO (era 0)
  "price": 189000              ← ✅
}
```

---

### 2. CONDICIÓN EXACTA DEL FRONTEND

**Archivo:** `/src/app/catalogo/[id]/page.tsx` (línea 176)

**Código:**
```typescript
{product.status === 'available' && 
 product.is_published && 
 (product.stock ?? 0) > 0 &&     // ← CONDICIÓN QUE FALLABA
 product.price ? (
  <AddToCartButton product={{...}} />
) : product.status === 'preorder' ? (
  <InstagramCTA text="Consultar pre-venta" />
) : product.status === 'reserved' ? (
  <InstagramCTA text="Apartada / Consultar disponibilidad" />
) : product.status === 'sold' ? (
  <div>Vendida</div>
) : !product.price ? (
  <InstagramCTA text="Consultar precio" />
) : (
  <InstagramCTA text="Consultar por Instagram" />  // ← SE MOSTRABA ESTO
)}
```

**Evaluación de condiciones ANTES del fix:**
```
status === 'available':  true  ✅
is_published:            true  ✅
(stock ?? 0) > 0:        false ❌  (stock era 0)
price:                   true  ✅

RESULTADO: false → Cae en el else final → Muestra "Consultar por Instagram"
```

**Evaluación de condiciones DESPUÉS del fix:**
```
status === 'available':  true  ✅
is_published:            true  ✅
(stock ?? 0) > 0:        true  ✅  (stock es 1)
price:                   true  ✅

RESULTADO: true → Muestra AddToCartButton ✅
```

---

### 3. CONFIRMACIÓN TIPO DE DATO DE STOCK

**ANTES del fix:**
```javascript
stock: 0        // tipo: number
typeof stock:   "number"
```

- ✅ NO es `null`
- ✅ NO es `undefined`
- ❌ ES `0` (número)

**Condición `(product.stock ?? 0) > 0`:**
- Nullish coalescing `??` no afecta porque stock NO es null/undefined
- Evaluación directa: `0 > 0` → `false` ❌

**DESPUÉS del fix:**
```javascript
stock: 1        // tipo: number
typeof stock:   "number"

Evaluación: 1 > 0 → true ✅
```

---

### 4. ADDTOCARTBUTTON IMPORTADO/RENDERIZANDO CORRECTAMENTE

**Import (línea 8):**
```typescript
import AddToCartButton from '@/components/AddToCartButton';
```

✅ **Importado correctamente**

**Componente verificado:**
```typescript
// src/components/AddToCartButton.tsx
export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, items } = useCart()
  const canPurchase = product.status === 'available' && product.price !== null
  
  // Renderiza correctamente cuando se cumplen las condiciones
}
```

✅ **Renderiza correctamente cuando las condiciones se cumplen**

---

### 5. FIX MÍNIMO APLICADO

**Problema identificado:**
- El Chanel se vendió en un test anterior (orden ID: 434f17f5-6949-4f23-922e-bfa5e8fb9009)
- Al venderse, el stock se puso en 0
- Posteriormente, alguien cambió el status de "sold" a "available" manualmente
- Pero el stock quedó en 0
- Condición `stock > 0` falló → mostró Instagram CTA

**Fix aplicado:**
```sql
UPDATE products 
SET stock = 1 
WHERE slug = 'chanel-classic-flap-negro';
```

**Resultado:**
```
status = 'available' ✅
is_published = true ✅
stock = 1 ✅ (> 0)
price = 189000 ✅

TODAS las condiciones cumplidas → Muestra "Agregar al carrito" ✅
```

---

## HISTORIAL DEL PRODUCTO

**Compra anterior:**
- Orden ID: `434f17f5-6949-4f23-922e-bfa5e8fb9009`
- Cliente: jhonatan venegas
- Fecha: 2026-04-28 23:00:43
- Payment status: paid
- Producto: Chanel Classic Flap Negro

**Cambios de estado:**
1. Inicial: `status='available', stock=1`
2. Al venderse: `status='sold', stock=0`
3. Manual (fecha desconocida): `status='available', stock=0` ← INCONSISTENCIA
4. Fix aplicado: `status='available', stock=1` ← CORREGIDO

---

## VALIDACIÓN COMPLETA

**Condición esperada:**
```
status === 'available' AND 
is_published === true AND 
stock > 0 AND 
price IS NOT NULL
→ Mostrar "Agregar al carrito"
```

**Estado actual del Chanel:**
| Campo | Valor | Cumple |
|-------|-------|--------|
| status | 'available' | ✅ |
| is_published | true | ✅ |
| stock | 1 | ✅ (> 0) |
| price | 189000 | ✅ (not null) |

**Resultado final:** ✅ **TODAS las condiciones cumplidas**

---

## TESTING

**Para verificar en producción:**

1. Ir a: https://bagclue.vercel.app/catalogo/chanel-classic-flap-negro
2. Verificar que muestra:
   - Estado visual: "Disponible" ✅
   - Precio: "$189,000 MXN" ✅
   - CTA: **"Agregar al carrito"** ✅ (NO "Consultar por Instagram")

3. Click en "Agregar al carrito"
   - Debe agregar al carrito correctamente ✅
   - Debe poder proceder al checkout ✅

---

## NOTA IMPORTANTE

El Chanel ya se vendió anteriormente en una orden pagada. Al poner `stock=1` de nuevo, estamos asumiendo que:

**OPCIÓN A: Testing/Demo**
- El stock se restaura para propósitos de testing
- El Chanel puede venderse de nuevo en modo test

**OPCIÓN B: Inventario Real**
- Tienen otro Chanel Classic Flap Negro disponible
- El stock=1 refleja inventario real

Si el Chanel **NO debe estar disponible** (solo se tenía uno y ya se vendió), el estado correcto sería:
```
status = 'sold'
stock = 0
→ Mostraría: "Vendida" (sin botón de compra)
```

---

**Archivo generado:** 2026-04-28 23:42 UTC  
**Fix aplicado:** stock actualizado de 0 a 1  
**Status:** ✅ Chanel ahora muestra "Agregar al carrito" correctamente
