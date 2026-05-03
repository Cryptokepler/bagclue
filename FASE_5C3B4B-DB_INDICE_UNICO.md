# FASE 5C.3B.4B-DB — Índice Único para orders.layaway_id
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ⏸️ PREPARADO - NO EJECUTADO

---

## ⚠️ CONFIRMACIÓN ABSOLUTA

### ❌ NO SE EJECUTÓ NADA

- ❌ NO se ejecutó SQL
- ❌ NO se tocó base de datos
- ❌ NO se modificó nada en producción
- ❌ NO se aplicó migración

**Este documento es solo propuesta SQL final.**

---

## OBJETIVO

Evitar que Stripe pueda crear órdenes duplicadas para el mismo layaway si reenvía el evento `checkout.session.completed`.

**Protección:** Constraint único a nivel de base de datos.

---

## ALCANCE

**SOLO:**
- Migración DB
- Índice único parcial en `orders.layaway_id`
- Verificación de duplicados existentes (si los hay)

**NO TOCAR:**
- Webhook
- UI
- Stripe
- Checkout
- Admin
- Products
- Orders data (salvo verificar duplicados)
- Layaway data

---

## MIGRACIÓN SQL FINAL

```sql
-- ============================================================================
-- Migration 023: Add unique constraint to orders.layaway_id
-- Date: 2026-05-03
-- Purpose: Evitar duplicados de orders para mismo layaway (webhook idempotencia)
-- Author: Kepler
-- ============================================================================

-- ========================================
-- PASO 1: Verificar duplicados existentes
-- ========================================

DO $$
DECLARE
  duplicate_count INT;
  duplicate_details TEXT;
BEGIN
  -- Contar layaway_ids con múltiples orders
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT layaway_id
    FROM orders
    WHERE layaway_id IS NOT NULL
    GROUP BY layaway_id
    HAVING COUNT(*) > 1
  ) AS dups;
  
  IF duplicate_count > 0 THEN
    -- Obtener detalles de duplicados
    SELECT string_agg(
      'layaway_id: ' || layaway_id::text || ' (' || order_count::text || ' orders)',
      E'\n'
    ) INTO duplicate_details
    FROM (
      SELECT layaway_id, COUNT(*) as order_count
      FROM orders
      WHERE layaway_id IS NOT NULL
      GROUP BY layaway_id
      HAVING COUNT(*) > 1
    ) AS dup_detail;
    
    RAISE WARNING 'DUPLICATES FOUND: % layaway_ids have duplicate orders:', duplicate_count;
    RAISE WARNING 'Details: %', duplicate_details;
    RAISE EXCEPTION 'Duplicates found - manual cleanup required before applying unique constraint';
  ELSE
    RAISE NOTICE 'No duplicates found - safe to proceed';
  END IF;
END $$;

-- ========================================
-- PASO 2: Eliminar índice no-único existente
-- ========================================

DROP INDEX IF EXISTS idx_orders_layaway_id;

-- ========================================
-- PASO 3: Crear índice único parcial
-- ========================================

CREATE UNIQUE INDEX idx_orders_layaway_id_unique 
ON orders(layaway_id) 
WHERE layaway_id IS NOT NULL;

-- Explicación:
-- - UNIQUE: Solo permite 1 order por layaway_id
-- - WHERE layaway_id IS NOT NULL: Permite múltiples orders con NULL (compras normales)
-- - Partial index: Más eficiente, solo indexa rows con layaway

COMMENT ON INDEX idx_orders_layaway_id_unique IS 
'Garantiza unicidad: 1 order por layaway completado. NULL permitido para compras normales.';

-- ========================================
-- PASO 4: Verificar índice creado
-- ========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_orders_layaway_id_unique'
  ) THEN
    RAISE NOTICE 'SUCCESS: Unique index created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: Unique index was not created';
  END IF;
END $$;

-- ============================================================================
-- FIN MIGRACIÓN 023
-- ============================================================================
```

---

## COMPORTAMIENTO ESPERADO

### Caso 1: Orden Normal (Sin Layaway)
```sql
INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('Ana', 5000, NULL);

INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('Luis', 8000, NULL);
```
✅ **PERMITIDO** - layaway_id NULL no está sujeto al constraint

---

### Caso 2: Primera Orden de Layaway
```sql
INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('María', 189000, 'aaaaaaaa-bbbb-cccc-dddd-000000000001');
```
✅ **PERMITIDO** - Primera orden con ese layaway_id

---

### Caso 3: Intento de Duplicado (Webhook Duplicado)
```sql
INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('María', 189000, 'aaaaaaaa-bbbb-cccc-dddd-000000000001');
```
❌ **ERROR: duplicate key value violates unique constraint "idx_orders_layaway_id_unique"**

---

## ROLLBACK (Si es necesario)

```sql
-- Eliminar índice único
DROP INDEX IF EXISTS idx_orders_layaway_id_unique;

-- Recrear índice no-único original
CREATE INDEX IF NOT EXISTS idx_orders_layaway_id 
ON orders(layaway_id);
```

---

## VERIFICACIÓN POST-APLICACIÓN

```sql
-- 1. Verificar que índice existe
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id_unique';

-- Resultado esperado:
-- indexname                      | indexdef
-- -------------------------------|--------------------------------------------------
-- idx_orders_layaway_id_unique   | CREATE UNIQUE INDEX ... WHERE layaway_id IS NOT NULL

-- 2. Verificar que índice viejo fue eliminado
SELECT COUNT(*) 
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id';

-- Resultado esperado: 0

-- 3. Probar que constraint funciona (en staging)
-- Crear test layaway
INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('Test User', 100, 'test-uuid-123');

-- Intentar duplicado (debe fallar)
INSERT INTO orders (customer_name, total, layaway_id) 
VALUES ('Test User 2', 200, 'test-uuid-123');
-- Resultado esperado: ERROR duplicate key

-- Limpiar test
DELETE FROM orders WHERE layaway_id = 'test-uuid-123';
```

---

## IMPACTO

**Base de datos:**
- ✅ Protección contra duplicados
- ✅ Compatible con órdenes normales (NULL permitido)
- ✅ Índice parcial (más eficiente)

**Aplicación:**
- ✅ Sin cambios - totalmente transparente
- ✅ Webhook intentará insert → DB rechazará si duplicado
- ✅ Webhook debe manejar error correctamente

**Riesgos:**
- 🟡 Si existen duplicados actuales → migración fallará
- 🟢 Fácil de revertir (DROP INDEX)
- 🟢 Sin impacto en órdenes normales

---

## CHECKLIST PRE-APLICACIÓN

```
ANTES DE EJECUTAR:

[ ] Backup de DB completo
[ ] Verificar que NO hay duplicados actuales (paso 1 del SQL)
[ ] Aplicar primero en staging
[ ] Verificar que índice se creó correctamente
[ ] Probar insert duplicado (debe fallar)
[ ] Verificar que órdenes normales (NULL) siguen funcionando
[ ] Jhonatan aprueba explícitamente aplicar en producción

DESPUÉS DE APLICAR:

[ ] Verificar índice creado (queries de verificación)
[ ] Verificar índice viejo eliminado
[ ] Probar webhook en staging
[ ] Monitorear logs 24h
```

---

## PRÓXIMOS PASOS

1. ⏳ Jhonatan revisa este SQL
2. ⏳ Jhonatan aprueba ejecutar en staging
3. ⏳ Kepler aplica en staging → verifica
4. ⏳ Jhonatan aprueba ejecutar en producción
5. ⏳ Kepler aplica en producción → verifica
6. ⏳ Jhonatan aprueba avanzar a FASE 5C.3B.4B (webhook)

---

**Documento generado:** 2026-05-03 09:55 UTC  
**Autor:** Kepler  
**Status:** ✅ LISTO PARA REVISIÓN

**Esperando aprobación explícita de Jhonatan para ejecutar.**
