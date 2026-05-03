# Customer Panel Design - Bagclue
**Fecha:** 2026-05-01  
**Estado:** Fase 5A completada (Auth base) → Siguiente: Fase 5B (Mis pedidos)

---

## 📋 CONTEXTO DEL NEGOCIO

**Bagclue vende:**
- Bolsas de lujo
- Cinturones
- Zapatos
- Joyas

**Modelos de venta:**
- ✅ Compra de contado (Stripe checkout)
- ✅ Sistema de apartado (layaway)
- ✅ Envíos DHL/FedEx
- ✅ Seguimiento de pedido
- ✅ Atención personalizada

**Cliente típico:**
- Mujeres que compran lujo
- Buscan seguimiento de su pedido
- Usan apartado para productos caros
- Valoran atención personalizada
- Necesitan claridad en pagos/saldos

---

## 🎯 ALCANCE DEL PANEL

### ✅ Incluido:
1. Dashboard / Mi cuenta
2. Mis pedidos (lista + detalle)
3. Mis apartados (lista + detalle)
4. Direcciones (CRUD)
5. Perfil / Soporte
6. Navegación limpia

### ❌ NO incluido (futuro):
- Wishlist
- Reviews de productos
- Sistema de puntos
- Chat interno
- Devoluciones automatizadas
- Facturación avanzada

---

## 🗺️ ESTRUCTURA DE RUTAS

```
/account                    → Dashboard (resumen general)
/account/orders             → Lista de pedidos
/account/orders/[id]        → Detalle de pedido + tracking
/account/layaways           → Lista de apartados
/account/layaways/[id]      → Detalle de apartado + pagar saldo
/account/addresses          → Gestión de direcciones
/account/profile            → Perfil + soporte
/account/login              → Login (ya implementado ✅)
```

---

## 📊 ESTRUCTURA DE DATOS

### Orders (ya existe en DB)
```typescript
interface Order {
  id: string
  customer_email: string
  customer_name: string
  customer_phone: string
  
  // Shipping
  shipping_address_line1: string
  shipping_address_line2?: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  
  // Product
  product_id: string
  product_name: string
  product_image_url?: string
  
  // Payment
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed'
  stripe_payment_intent_id?: string
  
  // Shipping
  shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  carrier?: 'DHL' | 'FedEx' | 'Other'
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  delivered_at?: string
  
  // Metadata
  created_at: string
  updated_at: string
}
```

### Layaways (ya existe en DB)
```typescript
interface Layaway {
  id: string
  customer_email: string
  customer_name: string
  customer_phone: string
  
  // Product
  product_id: string
  product_name: string
  product_image_url?: string
  
  // Pricing
  total_price: number
  deposit_amount: number
  remaining_balance: number
  currency: string
  
  // Payment tracking
  deposit_paid: boolean
  deposit_paid_at?: string
  balance_paid: boolean
  balance_paid_at?: string
  
  // Status
  status: 'active' | 'completed' | 'cancelled' | 'expired'
  expires_at?: string
  
  // Metadata
  created_at: string
  updated_at: string
  notes?: string
}
```

### CustomerAddresses (nueva tabla)
```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_profile_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  
  -- Address fields
  label VARCHAR(100), -- "Casa", "Trabajo", "Oficina", etc.
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'México',
  
  -- Flags
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_profile ON customer_addresses(customer_profile_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(customer_profile_id, is_default);
```

### CustomerProfile (ya existe, agregar campos)
```sql
ALTER TABLE customer_profiles
ADD COLUMN phone VARCHAR(50),
ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Preferences puede contener:
-- { "newsletter": true, "sms_notifications": false, "preferred_carrier": "DHL" }
```

---

## 🎨 DISEÑO DE COMPONENTES

### 1. Dashboard (/account)

**Layout:**
```
+------------------------------------------------------------------+
| BAGCLUE  |  Mi cuenta  Mis pedidos  Mis apartados  ...  [Cerrar]|
+------------------------------------------------------------------+
|                                                                  |
|  Hola, [Nombre] 👋                                              |
|                                                                  |
|  +----------------------+  +----------------------+              |
|  | 📦 Pedidos recientes |  | 💎 Apartados activos |              |
|  | - Bolsa Chanel       |  | - Cinturón Hermès    |              |
|  |   En camino (DHL)    |  |   $15,000 pendientes |              |
|  | - Zapatos LV         |  |                      |              |
|  |   Entregado ✓        |  | Ver todos →          |              |
|  | Ver todos →          |  +----------------------+              |
|  +----------------------+                                        |
|                                                                  |
|  +--------------------------------------------------+            |
|  | ℹ️ Perfil                                         |            |
|  | Email: cliente@example.com                       |            |
|  | Teléfono: +52 123 456 7890                       |            |
|  | Dirección principal: Calle X #123...             |            |
|  | Editar perfil →                                  |            |
|  +--------------------------------------------------+            |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `AccountDashboard` (ya existe, mejorar)
- `RecentOrdersWidget`
- `ActiveLayawaysWidget`
- `ProfileSummaryWidget`

---

### 2. Mis Pedidos (/account/orders)

**Vista lista:**
```
+------------------------------------------------------------------+
| Mis Pedidos                                         [Buscar 🔍] |
+------------------------------------------------------------------+
|                                                                  |
| +-------------------------------------------------------------+  |
| | [Img]  Bolsa Chanel Classic Flap                           |  |
| |        #ORD-12345                                          |  |
| |        27 Abr 2026  •  $45,000 MXN  •  Pagado ✓           |  |
| |        Estado: En camino 📦  •  DHL: 1234567890           |  |
| |                                          [Ver seguimiento] |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | [Img]  Zapatos Louis Vuitton                               |  |
| |        #ORD-12344                                          |  |
| |        20 Abr 2026  •  $18,500 MXN  •  Pagado ✓           |  |
| |        Estado: Entregado ✓                                 |  |
| |                                          [Ver detalles]    |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| (paginación si hay muchos)                                       |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `OrdersList` (página)
- `OrderCard` (card individual)
- `OrderStatusBadge`
- `PaymentStatusBadge`

---

### 3. Detalle de Pedido (/account/orders/[id])

**Vista detalle:**
```
+------------------------------------------------------------------+
| ← Volver a Mis Pedidos                                          |
+------------------------------------------------------------------+
| Pedido #ORD-12345                                               |
| Realizado el 27 de abril de 2026                               |
+------------------------------------------------------------------+
|                                                                  |
| +---------------------------+  +------------------------------+  |
| | PRODUCTO                  |  | INFORMACIÓN DE ENVÍO         |  |
| | [Imagen grande]           |  | Destinatario: María García   |  |
| | Bolsa Chanel Classic Flap |  | Calle Reforma #123           |  |
| | Color: Negro              |  | Col. Centro                  |  |
| | SKU: CH-123               |  | CDMX, 06000                  |  |
| |                           |  | México                       |  |
| | Total pagado: $45,000 MXN |  | Teléfono: +52 55 1234 5678   |  |
| | Pagado ✓ (Stripe)         |  +------------------------------+  |
| +---------------------------+                                    |
|                                                                  |
| +-------------------------------------------------------------+  |
| | SEGUIMIENTO DE ENVÍO                                        |  |
| | Paquetería: DHL Express                                     |  |
| | Tracking: 1234567890                            [Rastrear] |  |
| |                                                             |  |
| | Timeline:                                                   |  |
| | ✓ 27 Abr - Pedido confirmado                                |  |
| | ✓ 28 Abr - En preparación                                   |  |
| | ✓ 29 Abr - Enviado (DHL)                                    |  |
| | ⋯ 30 Abr - En tránsito                                      |  |
| | ⋯ 01 May - Estimado de entrega                              |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| [Contactar a Bagclue si tienes preguntas]                       |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `OrderDetail` (página)
- `ProductSummary`
- `ShippingInfo`
- `TrackingTimeline`
- `ContactSupport`

---

### 4. Mis Apartados (/account/layaways)

**Vista lista:**
```
+------------------------------------------------------------------+
| Mis Apartados                                                   |
+------------------------------------------------------------------+
|                                                                  |
| +-------------------------------------------------------------+  |
| | [Img]  Cinturón Hermès Reversible                          |  |
| |        #LAY-456                                            |  |
| |        Total: $25,000 MXN                                  |  |
| |        Depósito: $7,500 (pagado ✓)                         |  |
| |        Saldo pendiente: $17,500                            |  |
| |        Vence: 15 May 2026                                  |  |
| |        Estado: Activo 🟢                   [Pagar saldo]   |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | [Img]  Aretes Cartier Love                                 |  |
| |        #LAY-455                                            |  |
| |        Total: $50,000 MXN                                  |  |
| |        Completado ✓                                        |  |
| |        Finalizado el 20 Abr 2026                           |  |
| |                                            [Ver detalles]  |  |
| +-------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `LayawaysList` (página)
- `LayawayCard`
- `LayawayStatusBadge`
- `PaymentProgressBar`

---

### 5. Detalle de Apartado (/account/layaways/[id])

**Vista detalle:**
```
+------------------------------------------------------------------+
| ← Volver a Mis Apartados                                        |
+------------------------------------------------------------------+
| Apartado #LAY-456                                               |
| Creado el 15 de abril de 2026                                  |
+------------------------------------------------------------------+
|                                                                  |
| +---------------------------+  +------------------------------+  |
| | PRODUCTO APARTADO         |  | RESUMEN DE PAGOS             |  |
| | [Imagen]                  |  | Precio total: $25,000 MXN    |  |
| | Cinturón Hermès           |  | Depósito: $7,500 ✓           |  |
| | Reversible                |  | Saldo pendiente: $17,500     |  |
| | Color: Negro/Café         |  |                              |  |
| |                           |  | Vence: 15 May 2026           |  |
| +---------------------------+  | (14 días restantes)          |  |
|                               +------------------------------+  |
| +-------------------------------------------------------------+  |
| | HISTORIAL DE PAGOS                                          |  |
| | ✓ 15 Abr - Depósito pagado: $7,500                          |  |
| | ⋯ Saldo restante: $17,500                                   |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | ⚠️ POLÍTICA DE APARTADO                                     |  |
| | • El depósito NO es reembolsable                            |  |
| | • El saldo debe pagarse antes del 15 May 2026               |  |
| | • Si no se completa, el apartado se cancela y el depósito   |  |
| |   queda como crédito para futuras compras                   |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| [💳 Pagar saldo restante $17,500]                               |
| [📧 Contactar a Bagclue]                                        |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `LayawayDetail` (página)
- `ProductSummary`
- `PaymentSummary`
- `PaymentHistory`
- `LayawayPolicy`
- `PayBalanceButton` (abre checkout de Stripe)

---

### 6. Direcciones (/account/addresses)

**Vista lista:**
```
+------------------------------------------------------------------+
| Mis Direcciones                                   [+ Nueva]     |
+------------------------------------------------------------------+
|                                                                  |
| +-------------------------------------------------------------+  |
| | 🏠 Casa (Principal)                            [Editar] [X] |  |
| | María García                                                |  |
| | Calle Reforma #123, Col. Centro                             |  |
| | CDMX, 06000, México                                         |  |
| | Tel: +52 55 1234 5678                                       |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | 🏢 Oficina                                     [Editar] [X] |  |
| | María García                                                |  |
| | Av. Insurgentes Sur #456, Piso 3                            |  |
| | CDMX, 03100, México                                         |  |
| | Tel: +52 55 8765 4321                                       |  |
| |                                         [Hacer principal]   |  |
| +-------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

**Formulario nueva dirección:**
```
+------------------------------------------------------------------+
| Nueva Dirección                                                 |
+------------------------------------------------------------------+
|                                                                  |
| Etiqueta: [Casa     ▼]  (Casa/Oficina/Otro)                     |
| Nombre del destinatario: [________________]                     |
| Teléfono: [________________]                                    |
|                                                                  |
| Calle y número: [_______________________________________]       |
| Entre calles / Referencias: [___________________________]       |
| Colonia: [________________]                                     |
| Ciudad: [________________]   Estado: [________________]         |
| Código postal: [______]      País: [México      ▼]              |
|                                                                  |
| [✓] Establecer como dirección principal                         |
|                                                                  |
| [Cancelar]  [Guardar dirección]                                |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `AddressesList` (página)
- `AddressCard`
- `AddressForm` (modal o página separada)

---

### 7. Perfil / Soporte (/account/profile)

**Vista:**
```
+------------------------------------------------------------------+
| Mi Perfil                                                       |
+------------------------------------------------------------------+
|                                                                  |
| +-------------------------------------------------------------+  |
| | INFORMACIÓN PERSONAL                           [Editar]    |  |
| | Nombre: María García López                                  |  |
| | Email: maria@example.com (verificado ✓)                    |  |
| | Teléfono: +52 55 1234 5678                                  |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | PREFERENCIAS                                   [Editar]    |  |
| | Paquetería preferida: DHL Express                           |  |
| | Recibir newsletters: Sí                                     |  |
| | Notificaciones SMS: No                                      |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | SOPORTE Y CONTACTO                                          |  |
| | ¿Tienes preguntas sobre tu pedido o apartado?               |  |
| |                                                             |  |
| | [📧 Enviar email]                                           |  |
| | [💬 WhatsApp]                                               |  |
| | [📞 Llamar]                                                 |  |
| |                                                             |  |
| | Horario de atención:                                        |  |
| | Lun-Vie: 10:00 - 18:00                                      |  |
| | Sáb: 11:00 - 15:00                                          |  |
| +-------------------------------------------------------------+  |
|                                                                  |
| +-------------------------------------------------------------+  |
| | SEGURIDAD                                                   |  |
| | [🔐 Cerrar sesión]                                          |  |
| | [🗑️ Eliminar cuenta]                                        |  |
| +-------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

**Componentes:**
- `ProfilePage`
- `PersonalInfo`
- `Preferences`
- `SupportOptions`
- `SecuritySettings`

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

### ✅ FASE 5A: Auth Base (COMPLETADA)
- [x] Google OAuth login
- [x] Magic link login
- [x] AccountLayout con navegación
- [x] /account dashboard básico
- [x] Logout

**Estado:** ✅ Funcional en producción

---

### 📦 FASE 5B: MIS PEDIDOS (SIGUIENTE)

**Alcance:**
- Lista de pedidos del cliente
- Detalle de pedido
- Información de envío
- Tracking básico
- Timeline del pedido

**Rutas:**
- `/account/orders` - Lista
- `/account/orders/[id]` - Detalle

**Componentes a crear:**
1. `src/app/account/orders/page.tsx`
2. `src/app/account/orders/[id]/page.tsx`
3. `src/components/customer/OrderCard.tsx`
4. `src/components/customer/OrderDetail.tsx`
5. `src/components/customer/TrackingTimeline.tsx`
6. `src/components/customer/ShippingInfo.tsx`
7. `src/components/customer/OrderStatusBadge.tsx`

**Queries necesarias:**
```sql
-- Listar pedidos del cliente
SELECT * FROM orders
WHERE customer_email = $1
ORDER BY created_at DESC;

-- Detalle de pedido
SELECT * FROM orders
WHERE id = $1 AND customer_email = $2;
```

**API endpoints:**
- `GET /api/customer/orders` - Lista de pedidos
- `GET /api/customer/orders/[id]` - Detalle

**Estimación:** 1-2 días

---

### 💎 FASE 5C: MIS APARTADOS

**Alcance:**
- Lista de apartados
- Detalle de apartado
- Historial de pagos
- Botón "Pagar saldo"
- Política de apartado visible

**Rutas:**
- `/account/layaways` - Lista
- `/account/layaways/[id]` - Detalle

**Componentes a crear:**
1. `src/app/account/layaways/page.tsx`
2. `src/app/account/layaways/[id]/page.tsx`
3. `src/components/customer/LayawayCard.tsx`
4. `src/components/customer/LayawayDetail.tsx`
5. `src/components/customer/PaymentHistory.tsx`
6. `src/components/customer/PaymentProgressBar.tsx`
7. `src/components/customer/LayawayPolicy.tsx`

**API endpoints:**
- `GET /api/customer/layaways` - Lista
- `GET /api/customer/layaways/[id]` - Detalle
- `POST /api/layaways/[id]/pay-balance` (ya existe, vincular)

**Estimación:** 1-2 días

---

### 📍 FASE 5D: DIRECCIONES

**Alcance:**
- CRUD de direcciones
- Dirección principal
- Validación de campos
- Selector de país/estado

**Rutas:**
- `/account/addresses` - Lista + CRUD

**Componentes a crear:**
1. `src/app/account/addresses/page.tsx`
2. `src/components/customer/AddressCard.tsx`
3. `src/components/customer/AddressForm.tsx`

**Schema nueva tabla:**
```sql
CREATE TABLE customer_addresses (...)
```

**API endpoints:**
- `GET /api/customer/addresses` - Lista
- `POST /api/customer/addresses` - Crear
- `PUT /api/customer/addresses/[id]` - Actualizar
- `DELETE /api/customer/addresses/[id]` - Eliminar
- `POST /api/customer/addresses/[id]/set-default` - Marcar principal

**Estimación:** 1 día

---

### 👤 FASE 5E: PERFIL / SOPORTE

**Alcance:**
- Editar info personal
- Preferencias
- Botones de contacto
- Eliminar cuenta

**Rutas:**
- `/account/profile` - Todo en una página

**Componentes a crear:**
1. `src/app/account/profile/page.tsx`
2. `src/components/customer/PersonalInfoForm.tsx`
3. `src/components/customer/PreferencesForm.tsx`
4. `src/components/customer/SupportButtons.tsx`

**API endpoints:**
- `GET /api/customer/profile` - Ya existe
- `PUT /api/customer/profile` - Actualizar
- `DELETE /api/customer/profile` - Eliminar cuenta

**Estimación:** 1 día

---

### 🎨 FASE 5F: DASHBOARD (MEJORAS)

**Alcance:**
- Widgets de resumen
- Pedidos recientes (últimos 3)
- Apartados activos
- Perfil summary

**Mejoras a:**
- `src/components/customer/AccountDashboard.tsx` (ya existe)

**Componentes nuevos:**
1. `src/components/customer/RecentOrdersWidget.tsx`
2. `src/components/customer/ActiveLayawaysWidget.tsx`
3. `src/components/customer/ProfileSummaryWidget.tsx`

**Estimación:** 1 día

---

## 📅 CALENDARIO ESTIMADO

| Fase | Días | Semana |
|------|------|--------|
| 5A - Auth Base | ✅ | Completada |
| 5B - Mis Pedidos | 2 | Semana 1 |
| 5C - Mis Apartados | 2 | Semana 1-2 |
| 5D - Direcciones | 1 | Semana 2 |
| 5E - Perfil/Soporte | 1 | Semana 2 |
| 5F - Dashboard mejorado | 1 | Semana 3 |

**Total:** ~7 días de desarrollo (~1.5 semanas)

---

## 🎨 CONSIDERACIONES DE DISEÑO

### Colores y estilo
- Mantener identidad Bagclue (playfair, minimalista, lujo)
- Badges de estado con colores claros:
  - Pagado: verde
  - Pendiente: amarillo
  - Cancelado: rojo
  - En camino: azul
  - Entregado: verde oscuro

### Mobile-first
- Todas las vistas responsive
- Cards apilables en mobile
- Forms con inputs grandes (touch-friendly)

### Loading states
- Skeletons para listas
- Spinners para acciones
- Estados vacíos con ilustración/mensaje

### Error handling
- Toasts para errores
- Mensajes claros
- Botones de reintentar

---

## 🔐 SEGURIDAD

### RLS (Row Level Security)
```sql
-- Orders: solo ver propios pedidos
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (customer_email = auth.email());

-- Layaways: solo ver propios apartados
CREATE POLICY "Users can view own layaways"
ON layaways FOR SELECT
USING (customer_email = auth.email());

-- Addresses: solo CRUD propias direcciones
CREATE POLICY "Users can manage own addresses"
ON customer_addresses FOR ALL
USING (customer_profile_id IN (
  SELECT id FROM customer_profiles WHERE user_id = auth.uid()
));
```

### API Routes
- Verificar `supabaseCustomer.auth.getUser()` en todas las rutas
- Filtrar por customer email del usuario autenticado
- NO confiar en parámetros del cliente

---

## 📝 PRÓXIMOS PASOS

### Ahora (diseño):
1. ✅ Revisar esta propuesta
2. ✅ Aprobar alcance de Fase 5B
3. ✅ Confirmar diseño de "Mis Pedidos"

### Después (implementación):
1. Empezar con Fase 5B - Mis Pedidos
2. Crear componentes base
3. Conectar con API
4. Testing
5. Deploy
6. Continuar con Fase 5C

---

## ❓ DECISIONES PENDIENTES

1. **Tracking externo:**
   - ¿Integrar API de DHL/FedEx para tracking en vivo?
   - ¿O solo mostrar tracking number + link externo?
   - **Recomendación:** Link externo primero, API después

2. **Pago de saldo (layaway):**
   - ¿Stripe checkout como en compra normal?
   - ¿Payment intent directo?
   - **Recomendación:** Reutilizar flow de checkout existente

3. **Notificaciones:**
   - ¿Email al cambiar estado de pedido?
   - ¿SMS?
   - **Recomendación:** Email primero, SMS futuro

4. **Límites:**
   - ¿Paginación en lista de pedidos/apartados?
   - ¿Cuántos items por página?
   - **Recomendación:** 10 por página, load more

---

## 📄 REFERENCIAS

**Diseño inspirado en:**
- Amazon (tracking de pedidos)
- Shopify checkout (direcciones)
- Sephora (perfil de cliente)
- Apartado tradicional mexicano

**Stackblitz/Repos de referencia:**
- (agregar si es necesario)

---

**¿Listo para empezar con Fase 5B - Mis Pedidos?**
