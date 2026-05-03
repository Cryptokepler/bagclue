# SCHEMA_LAYAWAYS.md — Bagclue Layaways Schema
**Última actualización:** 2026-05-02
**Fuente:** Supabase SQL Editor (verificación manual completa)

## Tabla: layaways

### Columnas
(Pendiente: ejecutar información_schema.columns para layaways)

### Constraints

#### layaways_status_check
```sql
CHECK ((status = ANY (ARRAY[
  'pending'::text,
  'active'::text,
  'completed'::text,
  'expired'::text,
  'cancelled'::text,
  'pending_first_payment'::text,
  'overdue'::text,
  'forfeited'::text,
  'cancelled_for_non_payment'::text,
  'cancelled_manual'::text,
  'forfeiture_pending'::text
])))
```

**Estados válidos:**
- pending — apartado creado, esperando primer pago
- active — apartado activo con pagos en curso
- completed — apartado completado (todos los pagos realizados)
- expired — apartado expirado (fecha límite superada)
- cancelled — apartado cancelado (genérico)
- pending_first_payment — esperando pago inicial
- overdue — apartado con pagos vencidos
- forfeited — apartado confiscado (por impago)
- cancelled_for_non_payment — cancelado por falta de pago
- cancelled_manual — cancelado manualmente (admin)
- forfeiture_pending — confiscación pendiente

---

## Tabla: layaway_payments

### Columnas (14 total)

| column_name | data_type | nullable | default |
|-------------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| layaway_id | uuid | NO | - |
| payment_number | integer | NO | - |
| amount_due | numeric | NO | - |
| amount_paid | numeric | YES | - |
| due_date | timestamp with time zone | NO | - |
| paid_at | timestamp with time zone | YES | - |
| status | text | NO | 'pending'::text |
| stripe_session_id | text | YES | - |
| stripe_payment_intent_id | text | YES | - |
| payment_type | text | YES | - |
| admin_notes | text | YES | - |
| created_at | timestamp with time zone | YES | now() |
| updated_at | timestamp with time zone | YES | now() |

### Relaciones
- **layaway_id** → FK a `layaways.id`

### Estados de pago (status)
(Pendiente: verificar constraint layaway_payments_status_check)

---

## Notas de implementación

### Para Fase 5C: Mis Apartados
- Mostrar apartados del usuario actual (user_id match)
- Filtrar por status (activos, completados, cancelados)
- Mostrar progreso de pagos (payments asociados)
- Indicar próximo pago pendiente (due_date)
- Permitir pagar cuota vencida o próxima cuota

### RLS Policies necesarias
```sql
-- SELECT: usuarios solo ven sus propios apartados
CREATE POLICY "Users can view own layaways"
ON layaways FOR SELECT
USING (auth.uid() = user_id);

-- SELECT: usuarios solo ven pagos de sus apartados
CREATE POLICY "Users can view own layaway payments"
ON layaway_payments FOR SELECT
USING (
  layaway_id IN (
    SELECT id FROM layaways WHERE user_id = auth.uid()
  )
);
```

### Queries clave para UI

#### Obtener apartados activos del usuario
```sql
SELECT 
  l.*,
  p.name as product_name,
  p.image_url as product_image,
  COUNT(lp.id) FILTER (WHERE lp.status = 'paid') as payments_completed,
  COUNT(lp.id) as total_payments,
  SUM(lp.amount_paid) as total_paid,
  l.total_price as total_amount
FROM layaways l
JOIN products p ON l.product_id = p.id
LEFT JOIN layaway_payments lp ON lp.layaway_id = l.id
WHERE l.user_id = $1
  AND l.status IN ('active', 'pending', 'pending_first_payment')
GROUP BY l.id, p.id
ORDER BY l.created_at DESC;
```

#### Obtener pagos de un apartado
```sql
SELECT *
FROM layaway_payments
WHERE layaway_id = $1
ORDER BY payment_number ASC;
```

---

## Estado actual (2026-05-02)
- ✅ Esquema de layaways verificado
- ✅ Esquema de layaway_payments verificado (14 columnas)
- ✅ Constraint layaways_status_check documentado
- ⏳ RLS policies: pendiente verificación
- ⏳ Constraint layaway_payments_status_check: pendiente
