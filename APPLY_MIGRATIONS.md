# Aplicar Migraciones - Fase 5B

## Migraciones Pendientes

- `016_add_user_id_to_orders.sql` - Agregar columna user_id a orders
- `017_orders_rls_customer.sql` - Habilitar RLS en orders y order_items

## Opción 1: SQL Editor de Supabase (Recomendado)

1. Ir a: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql/new
2. Copiar contenido completo de `supabase/migrations/016_add_user_id_to_orders.sql`
3. Ejecutar (Run)
4. Copiar contenido completo de `supabase/migrations/017_orders_rls_customer.sql`
5. Ejecutar (Run)

## Opción 2: Script Node.js con PostgreSQL

```bash
# 1. Obtener connection string de Supabase
# Dashboard > Project Settings > Database > Connection string (URI)
# Formato: postgresql://postgres.orhjnwpbzxyqtyrayvoi:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# 2. Ejecutar script
export SUPABASE_DB_URL="postgresql://postgres..."
node apply_migrations.mjs
```

## Opción 3: Supabase CLI

```bash
# Si tienes Supabase CLI configurado
supabase db push
```

## Verificar Migraciones Aplicadas

```bash
node check_migration_status.mjs
```

Debe mostrar:
```
✅ Migration 016 APPLIED: user_id column exists
```

## IMPORTANTE

⚠️ **Las migraciones DEBEN aplicarse ANTES de desplegar el código del panel cliente**

De lo contrario, las páginas `/account/orders` fallarán con error de columna inexistente.

## Seguridad

✅ Las migraciones NO exponen datos de otras clientas
✅ Admin sigue funcionando (service role bypass RLS)
✅ Tracking público sigue funcionando (service role)
✅ Checkout sigue funcionando (service role)
