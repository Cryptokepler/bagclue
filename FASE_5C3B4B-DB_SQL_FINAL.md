# FASE 5C.3B.4B-DB — SQL FINAL (Índice Único)
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ⏸️ SQL FINAL - NO EJECUTADO

---

## ⚠️ CONFIRMACIÓN ABSOLUTA

### ❌ NO SE EJECUTÓ NADA

- ❌ NO se ejecutó SQL
- ❌ NO se tocó base de datos
- ❌ NO se modificó nada en producción
- ❌ NO se aplicó migración
- ❌ **NO SE BORRARÁN DATOS AUTOMÁTICAMENTE**

**Este documento es SQL final para revisión.**

---

## 1. SQL FINAL — FASE 5C.3B.4B-DB

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

SELECT layaway_id, COUNT(*) as order_count
FROM orders
WHERE layaway_id IS NOT NULL
GROUP BY layaway_id
HAVING COUNT(*) > 1;

-- RESULTADO ESPERADO: 0 rows (sin duplicados)
-- SI DEVUELVE FILAS → DETENERSE Y REPORTAR A JHONATAN
-- NO CONTINUAR CON PASO 2

-- ========================================
-- PASO 2: Crear índice único parcial
-- (SOLO SI PASO 1 NO DEVOLVIÓ FILAS)
-- ========================================

DROP INDEX IF EXISTS idx_orders_layaway_id;

CREATE UNIQUE INDEX idx_orders_layaway_id_unique 
ON orders(layaway_id) 
WHERE layaway_id IS NOT NULL;

-- ========================================
-- PASO 3: Verificar índice creado
-- ========================================

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id_unique';

-- RESULTADO ESPERADO: 1 row con indexdef completo

-- ============================================================================
-- FIN MIGRACIÓN 023
-- ============================================================================
```

---

## 2. CONFIRMACIÓN: NO BORRA DATOS AUTOMÁTICAMENTE

✅ **GARANTIZADO: Este SQL NO borra nada automáticamente.**

**Razones:**
- Paso 1 es solo `SELECT` (lectura)
- Paso 2 solo crea índice (NO modifica data)
- NO hay `DELETE`, `UPDATE`, `TRUNCATE`
- NO hay lógica automática de limpieza

**Si hay duplicados:**
- Paso 1 los muestra
- Kepler DETIENE ejecución
- Kepler REPORTA a Jhonatan
- Jhonatan decide qué hacer manualmente
- NO se ejecuta Paso 2 hasta que duplicados sean resueltos

---

## 3. QUÉ PASA SI EXISTEN DUPLICADOS

### Escenario A: Sin duplicados (esperado)

**Paso 1 devuelve:**
```
layaway_id | order_count
-----------+------------
(0 rows)
```

**Acción:** ✅ Continuar con Paso 2 (crear índice)

---

### Escenario B: Con duplicados (inesperado)

**Paso 1 devuelve:**
```
layaway_id                            | order_count
--------------------------------------+------------
aaaaaaaa-bbbb-cccc-dddd-000000000001  | 2
bbbbbbbb-cccc-dddd-eeee-000000000002  | 3
```

**Acción:** 🛑 **DETENERSE INMEDIATAMENTE**

**Kepler reportará:**
```
⚠️ DUPLICADOS DETECTADOS EN orders.layaway_id

Layaway IDs con múltiples orders:
- aaaaaaaa-bbbb-cccc-dddd-000000000001: 2 orders
- bbbbbbbb-cccc-dddd-eeee-000000000002: 3 orders

ACCIÓN REQUERIDA:
1. Investigar manualmente por qué existen duplicados
2. Decidir cuál order conservar por cada layaway_id
3. Eliminar/corregir duplicados manualmente
4. Volver a ejecutar Paso 1 hasta que devuelva 0 rows
5. ENTONCES ejecutar Paso 2

NO SE EJECUTÓ PASO 2 (crear índice único).
Migración DETENIDA hasta resolver duplicados.
```

**NO se ejecutará nada más hasta que Jhonatan resuelva manualmente.**

---

### Query de investigación (si hay duplicados)

```sql
-- Ver detalles de orders duplicados
SELECT 
  o.layaway_id,
  o.id as order_id,
  o.created_at,
  o.status,
  o.payment_status,
  o.total,
  o.customer_email
FROM orders o
WHERE o.layaway_id IN (
  SELECT layaway_id
  FROM orders
  WHERE layaway_id IS NOT NULL
  GROUP BY layaway_id
  HAVING COUNT(*) > 1
)
ORDER BY o.layaway_id, o.created_at;
```

**Jhonatan decide:**
- ¿Cuál order es el correcto?
- ¿Eliminar el duplicado?
- ¿Setear layaway_id = NULL en el duplicado?
- ¿Investigar por qué se creó duplicado?

---

## 4. ROLLBACK SQL

### Si necesitas revertir el índice único

```sql
-- Eliminar índice único
DROP INDEX IF EXISTS idx_orders_layaway_id_unique;

-- Recrear índice no-único original
CREATE INDEX IF NOT EXISTS idx_orders_layaway_id 
ON orders(layaway_id);

-- Verificar rollback
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id';

-- Resultado esperado: 1 row (índice no-único restaurado)
```

---

## 5. PRUEBAS DESPUÉS DE APLICAR

### Test 1: Verificar índice único creado

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id_unique';
```

**Resultado esperado:**
```
indexname                      | indexdef
-------------------------------|-------------------------------------------------------
idx_orders_layaway_id_unique   | CREATE UNIQUE INDEX idx_orders_layaway_id_unique ON public.orders USING btree (layaway_id) WHERE (layaway_id IS NOT NULL)
```

✅ PASS si devuelve 1 row con `UNIQUE INDEX` y `WHERE (layaway_id IS NOT NULL)`

---

### Test 2: Verificar índice viejo eliminado

```sql
SELECT COUNT(*) as old_index_count
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_layaway_id';
```

**Resultado esperado:**
```
old_index_count
---------------
0
```

✅ PASS si devuelve 0

---

### Test 3: Probar constraint funciona (STAGING ONLY)

```sql
-- Crear order test con layaway_id
INSERT INTO orders (
  customer_name,
  customer_email,
  total,
  subtotal,
  shipping,
  status,
  payment_status,
  layaway_id
) VALUES (
  'Test User',
  'test@example.com',
  1000,
  1000,
  0,
  'pending',
  'pending',
  '11111111-2222-3333-4444-555555555555'
);

-- Debe ejecutarse OK (primera vez)
-- Guardar el order_id generado
```

**Resultado esperado:** 1 row inserted ✅

---

```sql
-- Intentar duplicado (debe fallar)
INSERT INTO orders (
  customer_name,
  customer_email,
  total,
  subtotal,
  shipping,
  status,
  payment_status,
  layaway_id
) VALUES (
  'Test User 2',
  'test2@example.com',
  2000,
  2000,
  0,
  'confirmed',
  'paid',
  '11111111-2222-3333-4444-555555555555'  -- MISMO layaway_id
);

-- Debe FALLAR con error de unique constraint
```

**Resultado esperado:**
```
ERROR:  duplicate key value violates unique constraint "idx_orders_layaway_id_unique"
DETAIL:  Key (layaway_id)=(11111111-2222-3333-4444-555555555555) already exists.
```

✅ PASS si falla con error 23505

---

```sql
-- Limpiar test
DELETE FROM orders 
WHERE layaway_id = '11111111-2222-3333-4444-555555555555';

-- Resultado esperado: 1 row deleted
```

---

### Test 4: Verificar orders normales (NULL) siguen funcionando

```sql
-- Crear múltiples orders SIN layaway_id (compras normales)
INSERT INTO orders (
  customer_name,
  customer_email,
  total,
  subtotal,
  shipping,
  status,
  payment_status,
  layaway_id
) VALUES 
  ('Cliente 1', 'cliente1@example.com', 5000, 5000, 0, 'confirmed', 'paid', NULL),
  ('Cliente 2', 'cliente2@example.com', 8000, 8000, 0, 'confirmed', 'paid', NULL),
  ('Cliente 3', 'cliente3@example.com', 3000, 3000, 0, 'pending', 'pending', NULL);

-- Debe ejecutarse OK (múltiples NULLs permitidos)
```

**Resultado esperado:** 3 rows inserted ✅

```sql
-- Verificar
SELECT id, customer_name, total, layaway_id
FROM orders
WHERE customer_name LIKE 'Cliente %'
ORDER BY created_at DESC
LIMIT 3;
```

**Resultado esperado:** 3 rows con layaway_id = NULL

```sql
-- Limpiar test
DELETE FROM orders 
WHERE customer_name LIKE 'Cliente %';

-- Resultado esperado: 3 rows deleted
```

✅ PASS si múltiples orders con layaway_id NULL se crean sin error

---

## 6. CONFIRMACIÓN: NO IMPLEMENTARÉ WEBHOOK AÚN

✅ **CONFIRMADO: NO tocaré webhook hasta que Jhonatan apruebe explícitamente.**

**Workflow:**
1. ⏳ Jhonatan revisa este SQL final
2. ⏳ Jhonatan aprueba ejecutar migración
3. ⏳ Kepler ejecuta Paso 1 (verificar duplicados)
4. ⏳ Kepler reporta resultado Paso 1
5. ⏳ SI sin duplicados → Kepler ejecuta Paso 2 (crear índice)
6. ⏳ Kepler ejecuta Paso 3 (verificar índice)
7. ⏳ Kepler ejecuta Tests 1-4
8. ⏳ Kepler reporta resultado completo
9. ⏳ **DETENERSE** - esperar aprobación para webhook
10. ⏳ Jhonatan revisa diseño webhook corregido
11. ⏳ Jhonatan aprueba implementar webhook (FASE 5C.3B.4B)
12. ⏳ ENTONCES Kepler implementa webhook

**NO avanzaré a webhook sin aprobación explícita:**
- "OK, implementa webhook"
- "Aprobado, avanza a 5C.3B.4B"
- Confirmación clara de Jhonatan

---

## RESUMEN EJECUTIVO

| Aspecto | Confirmación |
|---------|--------------|
| SQL borra datos automáticamente | ❌ NO |
| Qué pasa si hay duplicados | 🛑 DETENER y reportar |
| Rollback disponible | ✅ SÍ |
| Tests definidos | ✅ 4 tests completos |
| Implementaré webhook después | ❌ NO, solo con aprobación |
| Seguro ejecutar en producción | ✅ SÍ (si Paso 1 = 0 rows) |

---

## CHECKLIST PRE-EJECUCIÓN

```
ANTES DE EJECUTAR:

[ ] Backup de DB completo
[ ] Jhonatan aprobó explícitamente este SQL
[ ] Aplicar primero en staging
[ ] Ejecutar Paso 1 en staging
[ ] Verificar resultado Paso 1 (0 rows esperado)
[ ] Ejecutar Paso 2 en staging (si Paso 1 OK)
[ ] Ejecutar Paso 3 en staging
[ ] Ejecutar Tests 1-4 en staging
[ ] Reportar resultados a Jhonatan
[ ] Jhonatan aprueba aplicar en producción

EN PRODUCCIÓN:

[ ] Ejecutar Paso 1
[ ] Verificar resultado Paso 1 (0 rows)
[ ] SI 0 rows → Ejecutar Paso 2
[ ] SI > 0 rows → DETENERSE y reportar
[ ] Ejecutar Paso 3
[ ] Ejecutar Tests 1-4
[ ] Reportar resultados completos
[ ] DETENERSE - esperar aprobación webhook
```

---

**Documento generado:** 2026-05-03 09:56 UTC  
**Autor:** Kepler  
**Status:** ✅ SQL FINAL - LISTO PARA APROBACIÓN

**Esperando aprobación explícita de Jhonatan para ejecutar.**
