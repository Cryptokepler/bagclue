# PAYMENTS MVP.1 — CAMBIOS V2 → V3

**Fecha:** 2026-05-06  
**Autor:** Kepler  
**Motivo:** Ajustes de seguridad solicitados por Jhonatan antes de ejecución

---

## RESUMEN DE CAMBIOS

### 1. Foreign Keys de payment_transactions

**V2 (Inseguro):**
```sql
order_id UUID REFERENCES orders(id) ON DELETE SET NULL
layaway_id UUID REFERENCES layaways(id) ON DELETE SET NULL
layaway_payment_id UUID REFERENCES layaway_payments(id) ON DELETE SET NULL
```

**V3 (Seguro):**
```sql
order_id UUID REFERENCES orders(id) ON DELETE RESTRICT
layaway_id UUID REFERENCES layaways(id) ON DELETE RESTRICT
layaway_payment_id UUID REFERENCES layaway_payments(id) ON DELETE RESTRICT
```

**Motivo del cambio:**
- Si se borra una order/layaway/layaway_payment y el FK hace `SET NULL`, puede violar el CHECK constraint `payment_transaction_has_relation` que exige al menos una relación `NOT NULL`.
- Con `ON DELETE RESTRICT`, no se puede borrar una order/layaway si tiene transacciones asociadas (más seguro para auditoría).

**FKs que SÍ mantienen SET NULL:**
```sql
confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
```
(Estos no tienen CHECK constraint que los requiera, es OK si admin se elimina)

---

### 2. RLS UPDATE de Usuarios

**V2 (Demasiado permisivo):**
```sql
CREATE POLICY "Users can upload proof for own transactions"
  ON payment_transactions FOR UPDATE
  USING (status = 'pending' AND [EXISTS checks])
  WITH CHECK (status IN ('pending', 'proof_uploaded') AND proof_url IS NOT NULL);
```

**V3 (Eliminado):**
- ❌ Política removida completamente

**Motivo del cambio:**
- No queremos que el cliente pueda actualizar `payment_transactions` directamente desde frontend.
- Para MVP, los uploads deben pasar por API server-side:
  1. API valida usuario
  2. API valida archivo (tipo, tamaño, rate limit)
  3. API sube comprobante a storage
  4. API actualiza payment_transactions con service role (bypass RLS)

**RLS policies finales en V3 (3 en vez de 4):**
1. ✅ "Users can view own transactions" (SELECT)
2. ✅ "Admins can view all transactions" (SELECT)
3. ✅ "Admins can confirm/reject transactions" (UPDATE)

---

### 3. Storage Policies

**V2 (Demasiado permisivo):**
```sql
CREATE POLICY "Users can upload own proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bank-payment-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-payment-proofs' AND [path check]);
```

**V3 (Removido):**
- ❌ Políticas removidas completamente
- ✅ Bucket se crea privado (public = false)
- ✅ Policies de storage se implementan en MVP.2 cuando haya upload API

**Motivo del cambio:**
- Política INSERT solo con `auth.role() = 'authenticated'` es demasiado permisiva.
- Cualquier usuario autenticado podría subir archivos sin validación.
- Para MVP.1 (solo DB schema), no necesitamos policies todavía.
- MVP.2 implementará upload API con validaciones + service role (bypass RLS).

**Bucket sigue existiendo:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-payment-proofs', 'bank-payment-proofs', false)
ON CONFLICT (id) DO NOTHING;
```
(Privado, sin policies públicas)

---

### 4. Function updated_at

**V2 (Asume que existe):**
```sql
-- Nota: Asumimos que la función update_updated_at_column() ya existe en Supabase
-- Si no existe, descomentar y ejecutar primero:
--
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
```

**V3 (Crea si no existe):**
```sql
-- Crear función si no existe (seguro)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Motivo del cambio:**
- No depender de que la función ya exista en Supabase.
- `CREATE OR REPLACE` es idempotente (si existe, la reemplaza; si no, la crea).
- Más seguro para ejecución en cualquier ambiente.

---

### 5. Validaciones Actualizadas

**V2 esperaba:**
- 4 políticas RLS en payment_transactions
- 2 políticas RLS en storage.objects

**V3 espera:**
- **3 políticas RLS en payment_transactions** (users view, admins view, admins update)
- **0 políticas RLS en storage.objects** (bucket privado sin policies)

---

## RESUMEN EJECUTIVO V3

| Aspecto | V2 | V3 | Cambio |
|---------|----|----|--------|
| FK order_id/layaway_id | ON DELETE SET NULL | ON DELETE RESTRICT | ✅ Más seguro |
| FK confirmed_by/rejected_by | ON DELETE SET NULL | ON DELETE SET NULL | Sin cambio |
| RLS UPDATE usuarios | Permitido | Removido | ✅ Más seguro |
| RLS policies payment_transactions | 4 | 3 | -1 |
| Storage policies | 2 (INSERT + SELECT) | 0 | ✅ Más seguro |
| Function updated_at | Comentada (asumir existe) | CREATE OR REPLACE | ✅ Más seguro |
| Bucket storage | Público con RLS | Privado sin RLS | ✅ Más seguro |

---

## CONFIRMACIÓN FINAL

✅ **No toca datos existentes** — solo estructura  
✅ **No cambia checkout** — código actual sin cambios  
✅ **No cambia webhook** — código actual sin cambios  
✅ **No cambia Stripe** — keys/config sin cambios  
✅ **No cambia admin UI** — código frontend sin cambios  
✅ **No cambia customer panel** — código frontend sin cambios  
✅ **No toca lógica actual** — CartContext, AddToCartButton, LayawayButton sin cambios  

**Backward-compatible al 100%.**

---

## PRÓXIMOS PASOS (Post-Aprobación V3)

1. **Jhonatan aprueba V3** ← BLOCKER
2. Backup Supabase (manual)
3. Ejecutar `PAYMENTS_MVP1_MIGRATION.sql` V3
4. Ejecutar `PAYMENTS_MVP1_VALIDATION.sql` V3 → verificar 100% PASS
5. QA manual: 1 compra Stripe test
6. Monitoring 2 horas
7. Commit + deploy + tag `v1.0.0-payments-mvp1-db-schema`

---

**Autor:** Kepler  
**Fecha:** 2026-05-06  
**Versión:** V3 (final antes de ejecución)  
**Status:** 📋 AWAITING APPROVAL
