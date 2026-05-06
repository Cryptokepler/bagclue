# PAYMENTS MVP.1 V3 — REVISIÓN FINAL PRE-EJECUCIÓN

**Fecha:** 2026-05-06  
**Versión:** V3 (ajustes de seguridad finales)  
**Autor:** Kepler  
**Estado:** 📋 AWAITING FINAL APPROVAL  
**Objetivo:** Resumen técnico corto para aprobación final antes de ejecutar SQL

---

## 1. TABLA payment_transactions — ESTRUCTURA EXACTA

### Columnas (29 total):
```
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
order_id                UUID (nullable)
layaway_id              UUID (nullable)
layaway_payment_id      UUID (nullable)
payment_type            TEXT NOT NULL
payment_method          TEXT NOT NULL
currency                TEXT NOT NULL
amount                  NUMERIC(12,2) NOT NULL
amount_mxn              NUMERIC(12,2) (nullable)
amount_usd              NUMERIC(12,2) (nullable)
exchange_rate           NUMERIC(12,6) (nullable)
status                  TEXT NOT NULL DEFAULT 'pending'
payment_reference       TEXT (nullable, unique)
proof_url               TEXT (nullable)
proof_file_name         TEXT (nullable)
proof_file_type         TEXT (nullable)
proof_file_size         INTEGER (nullable)
proof_hash              TEXT (nullable)
stripe_session_id       TEXT (nullable)
stripe_payment_intent_id TEXT (nullable)
admin_notes             TEXT (nullable)
rejection_reason        TEXT (nullable)
confirmed_at            TIMESTAMPTZ (nullable)
confirmed_by            UUID (nullable)
rejected_at             TIMESTAMPTZ (nullable)
rejected_by             UUID (nullable)
expires_at              TIMESTAMPTZ (nullable)
created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Foreign Keys (5):
```sql
order_id → orders(id) ON DELETE RESTRICT
layaway_id → layaways(id) ON DELETE RESTRICT
layaway_payment_id → layaway_payments(id) ON DELETE RESTRICT
confirmed_by → auth.users(id) ON DELETE SET NULL
rejected_by → auth.users(id) ON DELETE SET NULL
```

**V3: RESTRICT en order_id/layaway_id/layaway_payment_id previene violar CHECK constraint**

### CHECK Constraints (5):
```sql
1. payment_type IN ('full_purchase', 'layaway_deposit', 'layaway_installment')
2. payment_method IN ('bank_transfer_mxn', 'stripe_usd')
3. currency IN ('MXN', 'USD')
4. status IN ('pending', 'proof_uploaded', 'confirmed', 'rejected', 'failed', 'expired')
5. payment_transaction_has_relation: (order_id IS NOT NULL OR layaway_id IS NOT NULL OR layaway_payment_id IS NOT NULL)
```

### Índices (7 + PK):
```sql
idx_payment_transactions_order_id
idx_payment_transactions_layaway_id
idx_payment_transactions_layaway_payment_id
idx_payment_transactions_status
idx_payment_transactions_payment_method
idx_payment_transactions_created_at
idx_payment_transactions_expires_at (WHERE expires_at IS NOT NULL)
[+ implicit PK index on id]
```

---

## 2. CAMBIOS A TABLAS EXISTENTES

### orders — 7 columnas nuevas:
```sql
payment_method          TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd'))
payment_currency        TEXT CHECK (payment_currency IN ('MXN', 'USD'))
payment_reference       TEXT
exchange_rate           NUMERIC(12,6)
amount_mxn              NUMERIC(12,2)
amount_usd              NUMERIC(12,2)
payment_expires_at      TIMESTAMPTZ
```
**Todas nullable, sin NOT NULL.**

### layaways — 3 columnas nuevas:
```sql
payment_method          TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd'))
payment_currency        TEXT CHECK (payment_currency IN ('MXN', 'USD'))
exchange_rate           NUMERIC(12,6)
```
**Todas nullable, sin NOT NULL.**

### layaway_payments — 2 columnas nuevas:
```sql
payment_method          TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd'))
payment_reference       TEXT
```
**Todas nullable, sin NOT NULL.**

---

## 3. CONFIRMACIÓN — NO ROMPE NADA

✅ **Todas las columnas nuevas son nullable**  
✅ **No cambia columnas existentes** (solo ADD COLUMN)  
✅ **No borra datos** (ningún DELETE/DROP de datos)  
✅ **No cambia lógica de checkout** (código no toca columnas nuevas)  
✅ **No cambia webhook** (código no toca columnas nuevas)  
✅ **No cambia Stripe** (keys, config, nada)  
✅ **No cambia admin UI** (código frontend sin cambios)  
✅ **No cambia customer panel** (código frontend sin cambios)  

**Migración es 100% backward-compatible.**

---

## 4. RLS — POLÍTICAS EXACTAS

### payment_transactions (3 políticas):

**1. "Users can view own transactions" (SELECT)**
- Usuarios ven solo SUS transacciones via EXISTS checks con orders/layaways

**2. "Admins can view all transactions" (SELECT)**
- Admins ven todas las transacciones (raw_user_meta_data->>'role' = 'admin')

**3. "Admins can confirm/reject transactions" (UPDATE)**
- Admins pueden UPDATE payment_transactions con status IN ('proof_uploaded', 'confirmed', 'rejected')

### ✅ V3: NO hay política UPDATE para usuarios regulares
- Upload de comprobante será via API con service role en MVP.2
- Más seguro que permitir UPDATE directo desde frontend

### ✅ Confirmación RLS:
- **NO rompe lectura/escritura existente** — políticas solo aplican a payment_transactions
- **orders, layaways, layaway_payments** — RLS existente sin cambios

---

## 5. STORAGE BUCKET

### ¿La migración crea bucket?
**SÍ** — via SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-payment-proofs', 'bank-payment-proofs', false)
ON CONFLICT (id) DO NOTHING;
```

### Nombre exacto:
```
bank-payment-proofs
```

### Políticas RLS:
**V3: 0 políticas** (bucket privado sin RLS público)
- Más seguro que políticas abiertas con solo `auth.role() = 'authenticated'`
- Políticas se implementan en MVP.2 cuando exista upload API

### ¿Puede fallar en Supabase SQL Editor?
**POSIBLE** — pero `ON CONFLICT DO NOTHING` hace que fallo sea safe.

**Si falla:**
1. Continuar igual (no bloquea migración)
2. Crear bucket manual via Dashboard: Storage → New bucket → `bank-payment-proofs` (private)

---

## 6. ROLLBACK

### ¿Rollback elimina solo lo nuevo?
**SÍ:**
```sql
DROP TABLE payment_transactions CASCADE
DROP 3 RLS policies (no 4)
ALTER TABLE orders DROP 7 columnas
ALTER TABLE layaways DROP 3 columnas
ALTER TABLE layaway_payments DROP 2 columnas
DELETE FROM storage.buckets WHERE id = 'bank-payment-proofs'
```

### ¿Elimina datos de orders/layaways existentes?
**NO** — rollback solo elimina COLUMNAS (que están vacías).

**Datos existentes NO se tocan.**

### Ventana de rollback:
- **Ideal:** 24-48 horas
- **Ejecución:** 3-5 minutos

---

## 7. RIESGOS

### Riesgo 1 — Función update_updated_at_column no existe:
- **V3 FIX:** Función creada en PASO 0 (CREATE OR REPLACE)
- **Probabilidad:** Muy baja ahora

### Riesgo 2 — Storage bucket falla:
- **Impacto:** Bajo (ON CONFLICT DO NOTHING)
- **Fix:** Crear manual después

### Riesgo 3 — RLS degrada performance:
- **Mitigación:** Índices optimizados en FK
- **Probabilidad:** Baja

### Riesgo 4 — FK RESTRICT bloquea borrado de orders:
- **Es el comportamiento deseado** — auditoría completa
- **NO es bug** — si admin quiere borrar order con transacciones, debe borrar transacciones primero

### ¿Qué revisar ANTES de ejecutar?

1. **Backup Supabase** — manual via Dashboard
2. **Horario bajo tráfico** — 2-5am México
3. **Verificar columnas no existen ya:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name LIKE 'payment%';
   ```
   Si retorna rows → ABORTAR (columnas ya existen)

### ¿Qué hacer si falla a mitad?

**Antes de PASO 4:** Rollback trivial (solo DROP TABLE)  
**Después de PASO 4:** Ejecutar rollback completo  
**Paso 9 falla:** Continuar igual, crear bucket manual

---

## 8. VALIDACIÓN POST-MIGRACIÓN

### Queries críticas:

**1. Tabla existe:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'payment_transactions';
```
**Esperado:** 1 row

**2. Columnas:**
```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payment_transactions';
```
**Esperado:** 29

**3. Índices:**
```sql
SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'payment_transactions';
```
**Esperado:** 8

**4. RLS policies:**
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'payment_transactions';
```
**Esperado:** 3 (no 4)

**5. FK con DELETE action correcto:**
```sql
SELECT kcu.column_name, rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'payment_transactions'
ORDER BY kcu.column_name;
```
**Esperado:**
- order_id → RESTRICT
- layaway_id → RESTRICT
- layaway_payment_id → RESTRICT
- confirmed_by → SET NULL
- rejected_by → SET NULL

**6. Storage bucket:**
```sql
SELECT id, public FROM storage.buckets WHERE id = 'bank-payment-proofs';
```
**Esperado:** 1 row, public = false

**7. QA Manual — Checkout Stripe:**
- Crear orden test con Stripe test mode
- Verificar pago procesa normal
- Verificar orden se crea sin errores
- Verificar columnas payment_* quedan NULL

---

## ✅ CRITERIOS DE ÉXITO

**PASS si:**
- ✅ 7 validations retornan valores esperados
- ✅ Checkout Stripe funciona normal
- ✅ No hay errores en logs
- ✅ Performance sin degradación

**FAIL si:**
- ❌ Cualquier validation incorrecta
- ❌ Checkout Stripe falla
- ❌ Errores en logs relacionados con payment_*

**Acción si FAIL:** Ejecutar `PAYMENTS_MVP1_ROLLBACK.sql` inmediatamente.

---

## 📊 RESUMEN EJECUTIVO V3

| Aspecto | Valor |
|---------|-------|
| **Tabla nueva** | 1 (payment_transactions, 29 columnas) |
| **Columnas agregadas** | 12 (7 orders + 3 layaways + 2 layaway_payments) |
| **Índices nuevos** | 7 (+ 1 PK = 8 total) |
| **Políticas RLS** | 3 en payment_transactions + 0 en storage |
| **Buckets storage** | 1 (bank-payment-proofs, privado) |
| **FK con RESTRICT** | 3 (order_id, layaway_id, layaway_payment_id) |
| **FK con SET NULL** | 2 (confirmed_by, rejected_by) |
| **Riesgo general** | **BAJO** (backward-compatible, rollback trivial) |
| **Tiempo ejecución** | 2-3 minutos |
| **Tiempo validación** | 10-15 minutos |

---

## 🔒 CAMBIOS V3 vs V2 (SEGURIDAD)

| Cambio | V2 | V3 | Motivo |
|--------|----|----|--------|
| FK order_id/layaway_id | ON DELETE SET NULL | ON DELETE RESTRICT | Evita violar CHECK constraint |
| RLS UPDATE usuarios | Permitido (4 policies) | Removido (3 policies) | Upload via API más seguro |
| Storage policies | 2 (INSERT + SELECT) | 0 | Bucket privado sin RLS público |
| Función updated_at | Comentada (asumir) | CREATE OR REPLACE | No depender de existencia |

---

## ✅ RECOMENDACIÓN FINAL

**🟢 PASS — V3 LISTA PARA EJECUTAR**

**Motivos:**
- ✅ Arquitectura sólida y extensible
- ✅ V3 más segura que V2 (FK RESTRICT, sin UPDATE usuarios, bucket privado)
- ✅ Backward-compatible al 100%
- ✅ Rollback trivial (3-5 min)
- ✅ Habilita MVP.2 sin refactors

**Condiciones para ejecutar:**
1. Backup Supabase
2. Horario bajo tráfico (2-5am México)
3. Monitoring 2 horas post-migration
4. QA manual: 1 compra Stripe test
5. Rollback preparado

**Timeline estimado:**
- ⏱️ Backup: 5 min
- ⏱️ Migration: 2-3 min
- ⏱️ Validation: 10 min
- ⏱️ QA manual: 10 min
- ⏱️ Monitoring: 2 horas
- **Total:** ~2h 30min

---

## 📁 ARCHIVOS ENTREGADOS

1. ✅ **PAYMENTS_MVP1_V2_TO_V3_CHANGES.md** (6KB) — Resumen de cambios
2. ✅ **PAYMENTS_MVP1_MIGRATION.sql** (10.7KB) — SQL migration V3
3. ✅ **PAYMENTS_MVP1_ROLLBACK.sql** (6.7KB) — SQL rollback V3
4. ✅ **PAYMENTS_MVP1_VALIDATION.sql** (13.1KB) — SQL validation V3
5. ✅ **PAYMENTS_MVP1_DB_SCHEMA_SCOPE.md** (28KB) — Scope actualizado V3
6. ✅ **PAYMENTS_MVP1_V3_FINAL_REVIEW.md** (este archivo) — Resumen técnico final

---

**Listo para tu aprobación final, Jhonatan.** 🚀

**Próximo paso:** Si apruebas V3 → proceder con ejecución SQL en Supabase producción.

---

**Autor:** Kepler  
**Fecha:** 2026-05-06 20:05 UTC  
**Versión:** V3 (final)  
**Status:** 📋 AWAITING FINAL APPROVAL
