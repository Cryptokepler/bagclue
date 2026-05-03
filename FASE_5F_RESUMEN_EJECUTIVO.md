# FASE 5F — DASHBOARD CLIENTE FINAL (RESUMEN EJECUTIVO)

**Fecha:** 2026-05-03  
**Documento completo:** FASE_5F_SCOPE_DASHBOARD_CLIENTE.md (24KB)

---

## OBJETIVO

Convertir `/account` en un dashboard útil que muestre resúmenes de:
- Pedidos (total, último, en camino)
- Apartados (activos, completados, saldo, próxima cuota)
- Direcciones (total, dirección principal)
- Perfil (completo/incompleto)

---

## IMPLEMENTACIÓN PROPUESTA

### Archivos a modificar
- ✅ **Solo 1 archivo:** `src/components/customer/AccountDashboard.tsx`
- ❌ **NO tocar:** checkout, Stripe, webhook, admin, DB/RLS, migrations

### Estrategia de lectura de datos
- **Opción elegida:** Queries directas con `supabaseCustomer` (consistente con /account/orders y /account/layaways)
- **RLS:** Ya existen policies seguras validadas en fases anteriores
- **Queries:**
  ```tsx
  // Parallel fetch
  const [orders, layaways, addresses] = await Promise.all([
    supabaseCustomer.from('orders').select(...).limit(5),
    supabaseCustomer.from('layaways').select(...),
    supabaseCustomer.from('customer_addresses').select(...)
  ])
  ```

### Componentes UI
1. **WelcomeSection** - Bienvenida personalizada
2. **OrdersSummaryCard** - Total, último, en camino
3. **LayawaysSummaryCard** - Activos, completados, saldo, próxima cuota
4. **AddressesSummaryCard** - Total, dirección principal
5. **ProfileSummaryCard** - Completo/incompleto
6. **QuickActionsGrid** - Links rápidos

---

## DATOS A LEER

### Orders
```sql
SELECT id, status, shipping_status, total, created_at
FROM orders
WHERE user_id = current_user
ORDER BY created_at DESC LIMIT 5
```

**Uso:**
- Total: COUNT(*)
- Último: orders[0]
- En camino: COUNT(WHERE shipping_status = 'in_transit' OR status = 'shipped')

### Layaways
```sql
SELECT id, status, total_amount, amount_paid, amount_remaining, 
       next_payment_due_date, next_payment_amount, created_at
FROM layaways
WHERE user_id = current_user
ORDER BY created_at DESC
```

**Uso:**
- Activos: COUNT(WHERE status IN ['active', 'pending'])
- Completados: COUNT(WHERE status = 'completed')
- Saldo: SUM(amount_remaining WHERE status IN ['active', 'pending'])
- Próxima cuota: MIN(next_payment_due_date WHERE status = 'active')

### Addresses
```sql
SELECT id, full_name, address_line1, city, state, postal_code, is_default
FROM customer_addresses
WHERE user_id = current_user
ORDER BY is_default DESC, created_at DESC
```

**Uso:**
- Total: COUNT(*)
- Principal: WHERE is_default = true

---

## MOCKUPS

### Dashboard completo
```
┌─────────────────────────────────────────────────┐
│ 👋 Bienvenida a tu espacio Bagclue, María      │
│ maria@example.com • Miembro desde Enero 2026    │
└─────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Pedidos   │ │ 🏷️ Apartados │ │ 📍 Direccion │
│              │ │              │ │              │
│ Total: 5     │ │ Activos: 2   │ │ 3 guardadas  │
│ Último:      │ │ Saldo: $8.4k │ │              │
│ 15 Abr       │ │ Próxima:     │ │ Principal:   │
│ $12,500      │ │ $2,100       │ │ Av. Reforma  │
│              │ │ 10 May       │ │ CDMX         │
│ Ver todos →  │ │ Ver más →    │ │ Gestionar →  │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐
│ 👤 Perfil    │
│              │
│ ✅ Completo  │
│ +52 55 1234  │
│              │
│ Editar →     │
└──────────────┘

Accesos rápidos:
[Pedidos] [Apartados] [Direcciones] [Perfil] [Catálogo]
```

### Estado vacío
```
┌─────────────────────────────────────────────────┐
│ 👋 Bienvenida a tu espacio Bagclue              │
│ nuevo.cliente@example.com                       │
└─────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Pedidos   │ │ 🏷️ Apartados │ │ 📍 Direccion │
│              │ │              │ │              │
│ Aún no       │ │ No tienes    │ │ No tienes    │
│ tienes       │ │ apartados    │ │ direcciones  │
│ pedidos      │ │ activos      │ │ guardadas    │
│              │ │              │ │              │
│ Explorar →   │ │ Explorar →   │ │ Agregar →    │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐
│ 👤 Perfil    │
│              │
│ ⚠️ Incompleto│
│ Agrega datos │
│              │
│ Completar →  │
└──────────────┘
```

---

## TESTS MANUALES (6)

1. ✅ Usuario con datos completos
2. ✅ Usuario nuevo sin datos
3. ✅ Usuario con apartados activos
4. ✅ Usuario con pedidos en camino
5. ✅ Responsive mobile
6. ✅ Error de carga parcial

---

## RIESGOS

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| RLS policies incorrectas | Alta | ✅ Ya validadas en fases anteriores |
| Performance con muchos apartados | Baja | LIMIT en queries |
| Tocar checkout/Stripe accidentalmente | Alta | Scope claro, solo 1 archivo |
| Próxima cuota NULL | Media | Manejar NULL en UI |

---

## CRITERIOS DE CIERRE (28)

**Funcionales (8):**
- Resúmenes de pedidos/apartados/direcciones/perfil
- Estados vacíos
- Links de navegación

**Técnicos (4):**
- Queries con RLS
- Build/Deploy PASS
- No se tocó checkout/Stripe/webhook/admin/DB

**UX (5):**
- Responsive
- Loading/error states
- Formato montos

**Testing (7):**
- 6 tests manuales PASS
- Validación Jhonatan PASS

---

## ESTIMACIÓN

**Complejidad:** Media  
**Tiempo:** 2-3 horas

---

## APROBACIÓN REQUERIDA

**Esperando GO de Jhonatan para implementar.**

**Siguiente paso después de aprobación:**
1. Implementar AccountDashboard.tsx
2. Build + Deploy
3. Tests (6)
4. Reporte final
