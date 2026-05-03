# FASE USER SHIPPING — Confirmación de Dirección (RESUMEN EJECUTIVO)

**Documento completo:** FASE_USER_SHIPPING_SCOPE_CONFIRMAR_DIRECCION.md (35KB)

---

## OBJETIVO

Permitir que cliente confirme/complete la dirección de envío de sus pedidos pagados desde su panel, sin tocar checkout ni admin.

---

## ESTADO ACTUAL

### Ya existe:
- ✅ Table `orders` con `shipping_address TEXT` (nullable)
- ✅ Table `customer_addresses` (direcciones guardadas del cliente)
- ✅ /account/orders (lista de pedidos)
- ✅ /account/orders/[id] (detalle, muestra shipping_address read-only)
- ✅ /account/addresses (CRUD direcciones)
- ✅ RLS: Customer puede SELECT orders, NO UPDATE

### Falta:
- ❌ API para que customer actualice shipping_address
- ❌ UI para confirmar/seleccionar dirección
- ❌ Badge "Dirección pendiente"
- ❌ Validaciones de estado (no permitir cambiar si shipped/delivered)

---

## FLUJO PROPUESTO

1. Usuario ve pedido pagado sin dirección → badge "⚠️ Dirección pendiente"
2. Entra al detalle → sección "Confirma tu dirección de envío"
3. Ve dirección principal pre-cargada
4. Click "Confirmar esta dirección" → PATCH /api/account/orders/[id]/shipping-address
5. Orden actualizada → "✅ Dirección confirmada"
6. Si pedido pending/preparing → puede cambiar dirección
7. Si pedido shipped/delivered → read-only, no puede cambiar

---

## API PROPUESTA

### PATCH /api/account/orders/[id]/shipping-address

**Request:**
```json
{
  "address_id": "uuid-de-customer_addresses"
}
```

**Lógica:**
1. Auth check (Bearer token)
2. Get order con RLS (solo ve sus órdenes)
3. Validar: `payment_status = 'paid'`
4. Validar: `shipping_status != 'shipped'` && `!= 'delivered'`
5. Get address con RLS (solo ve sus direcciones)
6. Format address to text
7. Update order con supabaseAdmin:
   ```typescript
   {
     shipping_address: formattedAddress,
     customer_phone: `${phone_country_code} ${phone}` || null
   }
   ```
8. Return orden actualizada

**Validaciones:**
- ❌ Si no pagado → 400 "Order not paid yet"
- ❌ Si shipped/delivered → 400 "Cannot update address after shipped"
- ❌ Si dirección no existe o no pertenece al usuario → 404
- ❌ Si orden no existe o no pertenece al usuario → 404

---

## UI PROPUESTA

### A. Badge en Lista (/account/orders)
```
#abc12345  [Pagado]  [⚠️ Dirección pendiente]
```

### B. Sección en Detalle (sin dirección)
```
┌───────────────────────────────────────┐
│ ⚠️ Confirma tu dirección de envío     │
│                                       │
│ Tu pedido está pagado. Necesitamos    │
│ tu dirección para enviarlo.           │
│                                       │
│ 📍 Usar dirección principal           │
│ María González                        │
│ Av. Reforma 123, CDMX, 11560          │
│ +52 5512345678                        │
│                                       │
│ [Confirmar esta dirección]            │
│ [Elegir otra] [Crear nueva]           │
└───────────────────────────────────────┘
```

### C. Dirección Confirmada (pending/preparing)
```
┌───────────────────────────────────────┐
│ Dirección de envío                    │
│ ✅ Dirección confirmada               │
│                                       │
│ María González                        │
│ Av. Reforma 123, CDMX, 11560          │
│ +52 5512345678                        │
│                                       │
│ [Cambiar dirección]                   │
└───────────────────────────────────────┘
```

### D. Dirección Confirmada (shipped/delivered)
```
┌───────────────────────────────────────┐
│ Dirección de envío                    │
│                                       │
│ María González                        │
│ Av. Reforma 123, CDMX, 11560          │
│ +52 5512345678                        │
│                                       │
│ (sin botón, read-only)                │
└───────────────────────────────────────┘
```

---

## MATRIZ DE ESTADOS

| payment_status | shipping_status | shipping_address | Acción |
|----------------|-----------------|------------------|--------|
| pending | any | any | ❌ Esperar pago |
| paid | null/pending/preparing | null | ✅ Confirmar dirección |
| paid | null/pending/preparing | filled | ✅ Cambiar dirección |
| paid | shipped/delivered | filled | ❌ Read-only |
| cancelled | any | any | ❌ Read-only |

---

## CAMPOS ACTUALIZABLES

**Por customer (via API):**
- ✅ `shipping_address` (TEXT, desde dirección seleccionada)
- ✅ `customer_phone` (TEXT, desde dirección seleccionada)

**Solo admin:**
- ❌ `shipping_status`
- ❌ `shipping_provider`
- ❌ `tracking_number`
- ❌ `tracking_url`
- ❌ `tracking_token`

---

## SEGURIDAD

✅ **Auth:** Bearer token (supabaseCustomer.auth.getUser())  
✅ **RLS:** SELECT orders/addresses (solo ve sus datos)  
✅ **Validación estado:** paid + not shipped/delivered  
✅ **Update seguro:** supabaseAdmin con validaciones previas  
✅ **No tocar:** shipping_status, tracking, admin fields  

---

## 3 SUBFASES

### Subfase A: Backend API (1.5-2h)
- Crear: `/api/account/orders/[id]/shipping-address/route.ts`
- Validaciones de estado
- Tests de auth/RLS

### Subfase B: Badge lista (0.5h)
- Modificar: `/account/orders/page.tsx`
- Badge "Dirección pendiente"

### Subfase C: UI confirmar dirección (2-3h)
- Modificar: `/account/orders/[id]/page.tsx`
- Sección confirmar/seleccionar dirección
- Loading/success/error states
- Responsive

**Total estimado:** 4-6 horas

---

## RIESGOS MITIGADOS

| Riesgo | Mitigación |
|--------|------------|
| Cliente cambia dirección después de enviado | Validación: shipping_status != 'shipped' |
| Dirección incompleta | Validaciones en customer_addresses + filter(Boolean) |
| Pedido de otro usuario | RLS SELECT + validación explícita |
| Formato inconsistente | formatAddressToText() estandarizado |

---

## CRITERIOS DE CIERRE (28 TOTAL)

**Funcionales (8):**
- Badge visible en pedidos pagados sin dirección
- Confirmar dirección principal funciona
- Elegir otra dirección funciona
- Crear nueva dirección y confirmar funciona
- Cambiar dirección si pending/preparing funciona
- No cambiar si shipped/delivered
- Dirección se muestra correctamente
- Teléfono se actualiza

**Técnicos (6):**
- Endpoint PATCH funciona
- Auth + RLS protegen
- Validaciones de estado funcionan
- Formato consistente
- Build PASS
- Deploy PASS

**UX (4):**
- UI intuitiva
- Messages claros
- Loading states
- Responsive

**Seguridad (4):**
- Solo propias órdenes
- Solo propias direcciones
- No actualizar órdenes enviadas
- No tocar campos admin

**Testing (6):**
- 6 tests manuales PASS

---

## QUÉ NO TOCAR

❌ checkout (sigue sin pedir dirección)  
❌ Stripe  
❌ webhook  
❌ admin  
❌ DB schema  
❌ RLS  
❌ products/stock  
❌ payment logic  

✅ **Solo crear/modificar:**
- 1 endpoint API nuevo
- 2 archivos customer panel

---

## APROBACIÓN REQUERIDA

⏸️ **Esperando GO de Jhonatan para implementar**

**Subfases propuestas:**
1. Backend API
2. Badge lista
3. UI confirmar dirección

¿Apruebas proceder?
