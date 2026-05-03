# CONDICIONES ADICIONALES — Fase 5C.3A (Aprobadas por Jhonatan)
**Fecha:** 2026-05-02  
**Estado:** APROBADO CON CONDICIONES  

---

## CONDICIONES TÉCNICAS OBLIGATORIAS

### 1. API Routes / Supabase

**PREFERENCIA:** Usar Supabase con usuario autenticado y RLS activo

**SI SE USA service_role:**
- ✅ Validar usuario autenticado ANTES de query
- ✅ Filtrar estrictamente por `user_id` o `customer_email` del usuario autenticado
- ❌ JAMÁS devolver apartados de otros clientes

**Ejemplo correcto:**
```typescript
const supabase = createClient(); // service role
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const { data: layaways } = await supabase
  .from('layaways')
  .select('*')
  .eq('user_id', user.id); // ✅ FILTRO OBLIGATORIO
```

---

### 2. Seguridad

**REGLAS:**
- ✅ Cliente autenticado solo ve sus propios `layaways`
- ✅ Cliente autenticado solo ve `layaway_payments` de sus propios `layaways`
- ❌ NO agregar policies nuevas
- ❌ NO crear acceso público
- ❌ NO tocar RLS

**Validación:**
- Si `user_id` NO coincide → 403 o 404
- Si `customer_email` NO coincide → 403 o 404
- RLS debe filtrar automáticamente (si se usa cliente RLS)

---

### 3. Layout / Navegación

**ANTES de modificar navegación:**
- ✅ Confirmar archivo real usado por panel de cuenta
- Puede ser:
  - `src/components/account/AccountLayout.tsx`
  - `src/components/customer/AccountLayout.tsx`
- ❌ NO asumir ruta si no existe
- ✅ Buscar archivo que realmente se usa

**Acción:**
```bash
find ./src -name "*Account*Layout*"
grep -r "Mis Pedidos" src/components/
```

---

### 4. UI — Datos a mostrar

#### /account/layaways (Lista)
Por cada apartado mostrar:
- ✅ Producto (nombre)
- ✅ Foto
- ✅ Plan seleccionado (4/8/18 pagos semanales)
- ✅ Total del apartado
- ✅ Monto pagado
- ✅ Saldo pendiente
- ✅ Pagos completados / Pagos totales (ej: 3/8)
- ✅ Próxima fecha de pago
- ✅ Próxima cuota
- ✅ Estado (activo, completado, vencido, cancelado)
- ✅ Botón "Ver detalle"

#### /account/layaways/[id] (Detalle)
Mostrar:
- ✅ Producto (nombre)
- ✅ Foto
- ✅ Plan
- ✅ Precio total
- ✅ Primer pago
- ✅ Total pagado
- ✅ Saldo restante
- ✅ Pagos completados
- ✅ Pagos pendientes
- ✅ Próxima cuota
- ✅ Próxima fecha de vencimiento
- ✅ **Calendario completo de pagos** (tabla)
- ✅ **Historial de pagos** (solo completados)
- ✅ Política del apartado
- ✅ Contacto Bagclue (WhatsApp, Instagram)

---

### 5. Botones de Pago

**PROHIBIDO:**
- ❌ NO mostrar botón funcional de pagar
- ❌ NO implementar lógica de pago

**PERMITIDO (opcional):**
- ✅ Texto informativo: "Pago de cuotas próximamente"
- ✅ Mejor NO incluir botones de pago todavía

**Decisión final:** NO incluir botones de pago en esta fase.

---

## ARCHIVOS PERMITIDOS

**Pages:**
- ✅ `src/app/account/layaways/page.tsx`
- ✅ `src/app/account/layaways/[id]/page.tsx`

**API Routes (solo si realmente hace falta):**
- ✅ `src/app/api/account/layaways/route.ts`
- ✅ `src/app/api/account/layaways/[id]/route.ts`

**Components:**
- ✅ Componentes UI de layaways (card, payment row, empty state, policy)

**Types:**
- ✅ Tipos TypeScript de layaways

**Layout/Navegación:**
- ✅ Layout de cuenta (solo para enlazar "Mis apartados")
- ⚠️ Confirmar archivo real antes de modificar

---

## ARCHIVOS PROHIBIDOS

❌ **NO tocar:**
- `/api/checkout/create-session`
- `/api/stripe/webhook`
- `/checkout/success`
- `admin/*`
- Productos (stock, disponibilidad)
- `migrations/*`
- Stripe (cualquier archivo)
- Cron jobs
- RLS (policies)
- Tracking público
- Orders
- Order items

---

## FORMA DE TRABAJO

### Pre-Check Obligatorio
1. ✅ Buscar archivos existentes antes de crear
2. ✅ Confirmar rutas reales antes de modificar
3. ✅ Verificar que RLS policies ya existen (NO crear)
4. ✅ Verificar estructura de `layaways` y `layaway_payments`

### Desarrollo
1. ✅ Cambios pequeños y progresivos
2. ✅ Commits incrementales (5-12 commits)
3. ✅ Build local obligatorio: `npm run build`
4. ✅ TypeScript strict (sin `@ts-ignore` innecesarios)

### Cierre
1. ❌ NO declarar PASS sin validación visual
2. ✅ Entregar con evidencia (screenshots, logs, commits)
3. ✅ Reportar qué funciona y qué falta
4. ✅ Kepler valida UX antes de cerrar

### Deploy
**Importante:** Vercel Git Integration está desconectado

**Después de merge/commit:**
1. Deploy manual con Vercel CLI:
   ```bash
   VERCEL_ORG_ID="..." VERCEL_PROJECT_ID="..." \
   npx vercel deploy --prod --token [TOKEN] --yes
   ```
2. Token disponible en `contraseñas/vercel.md`

---

## PRE-CHECK COMMANDS

**Antes de iniciar implementación, ejecutar:**

```bash
# 1. Buscar layout de cuenta
find ./src -name "*Account*Layout*"

# 2. Verificar navegación existente
grep -r "Mis Pedidos" src/components/

# 3. Verificar estructura DB (si hay acceso)
# (Opcional: solo si Codex tiene acceso a Supabase)

# 4. Verificar RLS policies
# SELECT ... FROM pg_policies WHERE tablename IN ('layaways', 'layaway_payments')
```

---

## CRITERIOS DE CIERRE

**Backend PASS:**
- [ ] API routes funcionan
- [ ] Solo devuelven apartados del usuario autenticado
- [ ] RLS filtra correctamente

**UX PASS:**
- [ ] /account/layaways carga lista
- [ ] /account/layaways/[id] carga detalle
- [ ] Usuario solo ve sus apartados
- [ ] Cronograma visible y correcto
- [ ] Empty state si no hay apartados
- [ ] Responsive (desktop + mobile)

**Seguridad PASS:**
- [ ] Usuario no puede ver apartado de otro
- [ ] Queries filtran por user_id

**Compatibilidad PASS:**
- [ ] Login/logout funcionan
- [ ] /account/orders funciona
- [ ] Checkout contado funciona
- [ ] Admin funciona

**No se tocó PASS:**
- [ ] Stripe intacto
- [ ] Webhook intacto
- [ ] Checkout intacto
- [ ] Admin intacto
- [ ] DB intacto

---

**CONDICIONES APROBADAS — READY FOR CODEX**

Codex: Lee este documento JUNTO con CODEX_SCOPE_FASE_5C3A_MIS_APARTADOS_READONLY.md antes de iniciar.
