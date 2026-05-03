# Instrucciones - Aplicar Migration 015

## Migration: Customer Accounts Phase 1
**Archivo:** `supabase/migrations/015_customer_accounts_phase1.sql`

---

## Opción 1: Via Supabase Dashboard (Recomendado)

### Pasos:
1. Ir a: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql/new
2. Copiar todo el contenido del archivo `supabase/migrations/015_customer_accounts_phase1.sql`
3. Pegarlo en el SQL Editor
4. Click en "Run" (ejecutar)
5. Verificar que no haya errores

---

## Opción 2: Via comando (requiere password de DB)

```bash
psql "postgres://postgres:[PASSWORD]@db.orhjnwpbzxyqtyrayvoi.supabase.co:5432/postgres" \
  -f supabase/migrations/015_customer_accounts_phase1.sql
```

---

## Verificación Post-Migration

### 1. Verificar tabla creada:
```sql
SELECT * FROM customer_profiles LIMIT 1;
```

### 2. Verificar RLS habilitado:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'customer_profiles';
```

### 3. Verificar trigger creado:
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## ¿Qué hace esta migration?

1. **Crea tabla `customer_profiles`:**
   - `id` (UUID)
   - `user_id` (FK → auth.users)
   - `email` (normalizado a minúsculas)
   - `name`, `phone` (opcionales)
   - Timestamps: `created_at`, `updated_at`

2. **RLS Policies:**
   - Usuarios solo pueden ver/editar su propio perfil

3. **Trigger automático:**
   - Al crear usuario en `auth.users`, se crea automáticamente registro en `customer_profiles`
   - Email se normaliza a minúsculas

4. **Trigger de updated_at:**
   - Actualiza `updated_at` automáticamente en cada UPDATE

---

## IMPORTANTE

- Esta migration NO afecta pedidos, apartados ni productos
- Solo crea infraestructura de autenticación de clientes
- Es Fase 1 - Auth base únicamente
- Guest checkout sigue funcionando sin cambios
