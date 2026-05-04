# ADMIN_ERP_BAGCLUE_SCOPE.md

**Fecha:** 2026-05-04  
**Proyecto:** Bagclue E-commerce (Administración)  
**Objetivo:** Diseño del sistema administrativo / mini ERP  
**Tipo:** Auditoría técnica + propuesta de arquitectura  
**Estado:** SOLO DISEÑO — NO IMPLEMENTAR SIN AUTORIZACIÓN

---

## 1. AUDITORÍA DEL ADMIN ACTUAL

### 1.1. Funcionalidades Existentes

#### Dashboard Principal (`/admin`)
- **Ruta:** `/admin/page.tsx`
- **Funcionalidades actuales:**
  - Listado de productos (todos)
  - Stats básicas: total productos, publicados, ocultos
  - Tabla de productos con: imagen, título, marca, precio, status, publicado
  - Acciones: Editar producto, Ver en catálogo
  - Links: Crear Producto, Ver Órdenes
- **Limitaciones:**
  - NO hay filtros
  - NO hay búsqueda
  - NO hay paginación
  - NO hay gestión de inventario
  - NO hay stats de ventas
  - NO hay stats de clientes
  - NO hay reportes
  - Solo muestra productos sin contexto de negocio

#### Gestión de Productos
**Rutas:**
- `/admin/productos/new` — Crear producto
- `/admin/productos/[id]` — Editar producto

**Endpoints API:**
- `POST /api/products/create` — Crear producto
- `PATCH /api/products/[id]` — Actualizar producto
- `POST /api/products/[id]/upload-image` — Subir imagen

**Funcionalidades:**
- Crear productos (título, slug, marca, descripción, precio, currency, categoría, condición)
- Editar productos
- Subir imágenes
- Cambiar status (available, preorder, reserved, sold)
- Publicar/ocultar productos
- Configurar apartado (allow_layaway, layaway_deposit_percent)

**Limitaciones:**
- NO hay gestión de stock/inventario
- NO hay control de costos
- NO hay proveedores
- NO hay márgenes de utilidad
- NO hay ubicación física
- NO hay autenticidad/certificados
- NO hay variantes
- NO hay SKU
- NO hay categorización avanzada

#### Gestión de Órdenes
**Rutas:**
- `/admin/orders` — Listado de órdenes
- `/admin/orders/[id]` — Detalle de orden

**Endpoints API:**
- `PATCH /api/orders/[id]/status` — Cambiar status de orden
- `PATCH /api/orders/[id]/shipping` — Actualizar info de envío
- `PATCH /api/orders/[id]/tracking-url` — Actualizar tracking URL

**Funcionalidades:**
- Listado de órdenes recientes
- Stats básicas: total, pagadas, pendientes, canceladas
- Detalle de orden: cliente, productos, pago, envío
- Cambiar status de orden
- Actualizar información de envío
- Actualizar URL de tracking

**Limitaciones:**
- NO hay filtros avanzados (fecha, cliente, producto, monto)
- NO hay reporte de ventas
- NO hay análisis de rentabilidad
- NO hay control de fulfillment
- NO hay integración con DHL/FedEx
- NO hay gestión de devoluciones
- NO hay facturación
- NO hay CxC

#### Autenticación Admin
- **Ruta:** `/admin/login`
- **Endpoint:** `/api/auth/login`
- **Tipo:** Iron session (sin Supabase)
- **Seguridad:** Básica, no hay roles/permisos

### 1.2. Rutas Admin Existentes (Completo)

```
/admin
/admin/login
/admin/productos/new
/admin/productos/[id]
/admin/orders
/admin/orders/[id]
```

**Endpoints API Admin:**
```
POST   /api/products/create
PATCH  /api/products/[id]
POST   /api/products/[id]/upload-image
PATCH  /api/orders/[id]/status
PATCH  /api/orders/[id]/shipping
PATCH  /api/orders/[id]/tracking-url
POST   /api/admin/migrate
POST   /api/admin/run-migrations
```

### 1.3. Qué Falta en el Admin Actual

**Falta completamente:**
- 📊 **Dashboard analítico** (ventas, ingresos, clientes, inventario)
- 📦 **Inventario avanzado** (stock, ubicación, trazabilidad)
- 💰 **Costos y márgenes** (costo producto, gastos, utilidad)
- 🏭 **Proveedores** (directorio, compras, CxP)
- 👥 **Gestión de clientes** (directorio, historial, análisis)
- 📦 **Envíos avanzados** (DHL/FedEx API, tracking automático, costos)
- 💳 **Apartados / CxC** (gestión de planes de pago, cobranza)
- 📈 **Reportes** (ventas, inventario, clientes, financiero)
- 🔧 **Configuración** (general, payments, shipping, taxes)
- 📋 **Compras** (registro de compras a proveedores, CxP)

---

## 2. TABLAS ACTUALES REUTILIZABLES

### 2.1. Schema Actual (Completo)

#### Tabla: `products`
```sql
id UUID PRIMARY KEY
title TEXT
slug TEXT UNIQUE
brand TEXT
description TEXT
price NUMERIC(10,2)
currency TEXT DEFAULT 'MXN'
category TEXT
condition TEXT (new, preloved, vintage)
status TEXT (available, preorder, reserved, sold)
is_published BOOLEAN DEFAULT false
allow_layaway BOOLEAN DEFAULT true
layaway_deposit_percent NUMERIC(5,2) DEFAULT 20.00
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Tabla relacionada:** `product_images`
```sql
id UUID PRIMARY KEY
product_id UUID REFERENCES products(id)
url TEXT
position INTEGER
created_at TIMESTAMPTZ
```

**Reutilizable:** ✅ Sí  
**Cambios necesarios:** Ver sección 15

---

#### Tabla: `orders`
```sql
id UUID PRIMARY KEY
customer_name TEXT
customer_email TEXT
customer_phone TEXT
shipping_address TEXT
shipping_city TEXT
shipping_state TEXT
shipping_postal_code TEXT
shipping_country TEXT DEFAULT 'MX'
total NUMERIC(10,2)
currency TEXT DEFAULT 'MXN'
status TEXT (pending, confirmed, cancelled, completed)
payment_status TEXT (pending, paid, refunded)
payment_intent_id TEXT
session_id TEXT
tracking_token TEXT UNIQUE
tracking_number TEXT
tracking_url TEXT
carrier TEXT
shipping_status TEXT (pending, preparing, shipped, delivered)
shipped_at TIMESTAMPTZ
delivered_at TIMESTAMPTZ
notes TEXT
layaway_id UUID REFERENCES layaways(id)
user_id UUID REFERENCES auth.users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Tabla relacionada:** `order_items`
```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
product_id UUID REFERENCES products(id)
quantity INTEGER DEFAULT 1
price NUMERIC(10,2)
created_at TIMESTAMPTZ
```

**Reutilizable:** ✅ Sí  
**Cambios necesarios:** Ver sección 15

---

#### Tabla: `layaways`
```sql
id UUID PRIMARY KEY
product_id UUID REFERENCES products(id)
customer_name TEXT
customer_email TEXT
customer_phone TEXT
product_price NUMERIC(10,2)
deposit_percent NUMERIC(5,2) DEFAULT 20.00
deposit_amount NUMERIC(10,2)
balance_amount NUMERIC(10,2)
currency TEXT DEFAULT 'MXN'

-- Stripe payments
deposit_session_id TEXT
deposit_payment_intent_id TEXT
deposit_paid_at TIMESTAMPTZ
balance_session_id TEXT
balance_payment_intent_id TEXT
balance_paid_at TIMESTAMPTZ

-- Status and dates
status TEXT (pending, active, completed, expired, cancelled, ...)
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
cancelled_at TIMESTAMPTZ
layaway_token TEXT UNIQUE
notes TEXT
cancelled_by TEXT
cancellation_reason TEXT
order_id UUID REFERENCES orders(id)

-- Payment plans (migraciones 018-020)
plan_type TEXT (cash, 4_weekly_payments, 8_weekly_payments, 18_weekly_payments)
total_payments INTEGER
first_payment_amount NUMERIC(10,2)
minimum_first_payment_amount NUMERIC(10,2)
total_amount NUMERIC(10,2)
amount_paid NUMERIC(10,2) DEFAULT 0
amount_remaining NUMERIC(10,2)
payments_completed INTEGER DEFAULT 0
payments_remaining INTEGER
next_payment_due_date TIMESTAMPTZ
next_payment_amount NUMERIC(10,2)
plan_start_date TIMESTAMPTZ
plan_end_date TIMESTAMPTZ
last_payment_at TIMESTAMPTZ
consecutive_weeks_without_payment INTEGER DEFAULT 0
forfeited_at TIMESTAMPTZ
user_id UUID REFERENCES auth.users(id)
policy_version INTEGER DEFAULT 2
```

**Tabla relacionada:** `layaway_payments`
```sql
id UUID PRIMARY KEY
layaway_id UUID REFERENCES layaways(id)
payment_number INTEGER
amount_due NUMERIC(10,2)
amount_paid NUMERIC(10,2)
due_date TIMESTAMPTZ
paid_at TIMESTAMPTZ
status TEXT (pending, paid, overdue, cancelled, forfeited, failed)
stripe_session_id TEXT
stripe_payment_intent_id TEXT
payment_type TEXT (first, installment, final, extra)
admin_notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Reutilizable:** ✅ Sí  
**Cambios necesarios:** Mínimos (ver sección 15)

---

#### Tabla: `customer_profiles`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id) UNIQUE
email TEXT UNIQUE
name TEXT
phone TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Tabla relacionada:** `customer_addresses`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
label TEXT (home, work, other)
name TEXT
street TEXT
street2 TEXT
city TEXT
state TEXT
postal_code TEXT
country TEXT DEFAULT 'MX'
phone TEXT
is_default BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Reutilizable:** ✅ Sí  
**Cambios necesarios:** Ver sección 15

---

### 2.2. Tablas NO Existentes (Necesarias para ERP)

**Proveedores:**
- `suppliers` (no existe)

**Compras:**
- `purchases` (no existe)
- `purchase_items` (no existe)

**Inventario:**
- `inventory_movements` (no existe)
- `inventory_locations` (no existe)

**Costos:**
- `product_costs` (no existe, campos podrían estar en products)

**Reportes:**
- Generados dinámicamente (no necesitan tabla fija)

---

## 3. MÓDULOS RECOMENDADOS

### Módulo 1: Dashboard Administrativo
**Objetivo:** Vista general del negocio en tiempo real

**Contenido:**
- Ventas del mes (monto total, número órdenes)
- Ventas del día
- Productos vendidos (top 5)
- Inventario bajo (alertas)
- Apartados activos (número, monto pendiente)
- Órdenes pendientes de envío
- CxC (cuentas por cobrar apartados)
- CxP (cuentas por pagar proveedores)
- Gráficas: ventas por mes, productos más vendidos, clientes frecuentes

---

### Módulo 2: Inventario
**Objetivo:** Control total del stock y productos

**Submenús:**
1. **Productos**
   - Listado completo
   - Crear/Editar producto
   - Subir imágenes
   - Gestión de stock
   - Precios y costos
   - Categorización
   - Variantes (futuro)

2. **Categorías**
   - Crear/Editar categorías
   - Asignar a productos

3. **Stock**
   - Stock actual por producto
   - Alertas de stock bajo
   - Movimientos de inventario
   - Ajustes de stock

4. **Ubicaciones** (opcional para v2)
   - Ubicaciones físicas
   - Asignar producto a ubicación

---

### Módulo 3: Ventas
**Objetivo:** Gestión completa de órdenes y ventas

**Submenús:**
1. **Órdenes**
   - Listado completo
   - Detalle de orden
   - Cambiar status
   - Historial
   - Filtros avanzados

2. **Clientes Frecuentes**
   - Top clientes por compra
   - Historial por cliente

3. **Reportes de Ventas**
   - Ventas por período
   - Ventas por producto
   - Ventas por categoría
   - Rentabilidad

---

### Módulo 4: Clientes
**Objetivo:** Directorio y análisis de clientes

**Submenús:**
1. **Directorio**
   - Listado completo
   - Detalle de cliente
   - Historial de compras
   - Apartados activos
   - CxC (cuenta corriente)

2. **Análisis**
   - Clientes nuevos vs recurrentes
   - Valor de vida (LTV)
   - Segmentación

---

### Módulo 5: Envíos
**Objetivo:** Gestión de fulfillment y tracking

**Submenús:**
1. **Órdenes por Enviar**
   - Listado de órdenes pagadas sin enviar
   - Marcar como preparando
   - Generar guía (manual o API DHL/FedEx)
   - Asignar tracking

2. **Órdenes Enviadas**
   - Listado de órdenes en tránsito
   - Tracking automático
   - Marcar como entregada

3. **Configuración de Envíos**
   - Tarifas
   - Zonas
   - Integraciones DHL/FedEx

---

### Módulo 6: Apartados / CxC
**Objetivo:** Gestión de planes de pago y cobranza

**Submenús:**
1. **Apartados Activos**
   - Listado completo
   - Detalle de apartado
   - Historial de pagos
   - Próximos vencimientos

2. **Apartados Vencidos**
   - Pendientes de cobro
   - Más de 6 semanas sin pago
   - Acciones: recordar, cancelar

3. **Apartados Completados**
   - Historial

4. **Reportes de CxC**
   - Saldo total por cobrar
   - Apartados por vencer
   - Tasa de completitud

---

### Módulo 7: Compras / Proveedores / CxP
**Objetivo:** Gestión de proveedores y cuentas por pagar

**Submenús:**
1. **Proveedores**
   - Directorio de proveedores
   - Crear/Editar proveedor
   - Historial de compras

2. **Compras**
   - Registrar compra
   - Listado de compras
   - Detalle de compra
   - Vincular productos a compra

3. **CxP (Cuentas por Pagar)**
   - Saldo pendiente por proveedor
   - Compras por pagar
   - Marcar como pagada

4. **Reportes de Compras**
   - Compras por período
   - Compras por proveedor
   - Análisis de costos

---

### Módulo 8: Reportes
**Objetivo:** Análisis y reportes del negocio

**Submenús:**
1. **Ventas**
   - Ventas por período
   - Ventas por producto
   - Ventas por categoría
   - Ventas por cliente

2. **Inventario**
   - Stock actual
   - Movimientos de inventario
   - Productos sin stock
   - Productos más vendidos

3. **Clientes**
   - Nuevos clientes
   - Clientes recurrentes
   - Análisis LTV

4. **Financiero**
   - Ingresos vs egresos
   - Rentabilidad por producto
   - CxC vs CxP
   - Flujo de efectivo

---

### Módulo 9: Configuración
**Objetivo:** Configuración general del sistema

**Submenús:**
1. **General**
   - Nombre del negocio
   - Logo
   - Contacto

2. **Pagos**
   - Stripe (live vs test)
   - Métodos de pago

3. **Envíos**
   - Integraciones
   - Zonas
   - Tarifas

4. **Apartados**
   - Planes disponibles
   - Políticas
   - Reglas de vencimiento

5. **Usuarios Admin**
   - Crear/Editar usuarios admin
   - Roles y permisos (futuro)

---

## 4. INVENTARIO AVANZADO — CARGA DE ARTÍCULOS

### 4.1. Flujo de Carga de Nuevo Producto

**Paso 1: Información Básica**
- Título
- Slug (auto-generado)
- Marca
- Categoría
- Condición (new, preloved, vintage)
- Descripción
- Certificado de autenticidad (opcional, archivo PDF)

**Paso 2: Precios y Costos**
- Precio de venta (público)
- Moneda (MXN, USD)
- Costo de adquisición (privado)
- Proveedor (seleccionar de lista)
- Compra (vincular a compra registrada, opcional)
- Gastos adicionales (envío, aduana, reparación)
- Utilidad estimada (auto-calculada)
- Margen % (auto-calculado)

**Paso 3: Inventario**
- Stock inicial (normalmente 1 para productos únicos)
- Ubicación física (opcional)
- SKU (opcional)
- Estado inventario (disponible, apartado, vendido)

**Paso 4: Apartado**
- Permitir apartado (sí/no)
- Porcentaje de depósito (default 20%)

**Paso 5: Imágenes**
- Subir imágenes (múltiples)
- Asignar orden

**Paso 6: Publicación**
- Publicar ahora
- Guardar como borrador

---

### 4.2. Carga Masiva (Futuro, v2)
- Importar desde Excel/CSV
- Template descargable
- Validación de datos
- Preview antes de importar

---

## 5. CAMPOS NECESARIOS PARA PRODUCTOS

### 5.1. Campos Públicos (ya existen)
```
✅ title
✅ slug
✅ brand
✅ description
✅ price
✅ currency
✅ category
✅ condition
✅ status
✅ is_published
✅ allow_layaway
✅ layaway_deposit_percent
```

### 5.2. Campos Privados (Necesarios, NO EXISTEN)
```
❌ cost_price (costo de adquisición)
❌ supplier_id (proveedor)
❌ purchase_id (compra relacionada)
❌ additional_costs (gastos adicionales)
❌ profit_amount (utilidad calculada)
❌ profit_margin (margen calculado)
❌ authenticity_certificate_url (certificado de autenticidad)
❌ physical_location (ubicación física)
❌ sku (código SKU)
❌ stock_quantity (cantidad en inventario)
❌ low_stock_threshold (alerta de stock bajo)
```

### 5.3. Campos Calculados (Auto-generados)
```
profit_amount = price - cost_price - additional_costs
profit_margin = (profit_amount / price) * 100
```

---

## 6. VENTAS Y REPORTES

### 6.1. Reportes de Ventas

#### Reporte: Ventas por Período
**Filtros:**
- Rango de fechas (desde, hasta)
- Agrupación (día, semana, mes)

**Métricas:**
- Total ventas ($)
- Número de órdenes
- Ticket promedio
- Órdenes pagadas vs pendientes

**Gráfica:**
- Línea de tiempo con ventas por día/semana/mes

---

#### Reporte: Ventas por Producto
**Filtros:**
- Rango de fechas
- Categoría
- Marca

**Métricas:**
- Productos vendidos (unidades)
- Ingresos por producto
- Rentabilidad por producto

**Gráfica:**
- Top 10 productos más vendidos (barras)

---

#### Reporte: Ventas por Categoría
**Filtros:**
- Rango de fechas

**Métricas:**
- Ventas por categoría ($)
- Número de productos vendidos por categoría

**Gráfica:**
- Pie chart de ventas por categoría

---

#### Reporte: Ventas por Cliente
**Filtros:**
- Rango de fechas

**Métricas:**
- Top clientes por monto
- Top clientes por frecuencia
- Valor de vida (LTV)

**Gráfica:**
- Top 10 clientes (barras)

---

### 6.2. Reportes de Inventario

#### Reporte: Stock Actual
**Filtros:**
- Categoría
- Marca
- Status

**Métricas:**
- Productos en stock
- Productos sin stock
- Productos con stock bajo
- Valor total de inventario (costo)
- Valor total de inventario (precio venta)

---

#### Reporte: Movimientos de Inventario
**Filtros:**
- Rango de fechas
- Tipo de movimiento (entrada, salida, ajuste)

**Métricas:**
- Entradas (compras)
- Salidas (ventas)
- Ajustes (manual)

---

### 6.3. Reportes Financieros

#### Reporte: Ingresos vs Egresos
**Filtros:**
- Rango de fechas

**Métricas:**
- Ingresos totales (ventas pagadas)
- Egresos totales (compras a proveedores)
- Utilidad bruta
- Margen bruto %

---

#### Reporte: Rentabilidad por Producto
**Filtros:**
- Rango de fechas
- Categoría

**Métricas:**
- Producto vendido
- Precio de venta
- Costo total (costo + gastos)
- Utilidad
- Margen %

---

#### Reporte: CxC vs CxP
**Filtros:**
- Fecha corte

**Métricas:**
- Saldo total CxC (apartados pendientes)
- Saldo total CxP (compras por pagar)
- Balance neto

---

## 7. CLIENTES

### 7.1. Directorio de Clientes

**Listado:**
- Nombre
- Email
- Teléfono
- Total compras ($)
- Número de compras
- Última compra
- Apartados activos
- Saldo CxC

**Filtros:**
- Buscar por nombre/email
- Clientes con apartados
- Clientes con CxC
- Clientes recurrentes (>1 compra)

**Acciones:**
- Ver detalle de cliente

---

### 7.2. Detalle de Cliente

**Información General:**
- Nombre
- Email
- Teléfono
- Fecha de registro
- Direcciones guardadas

**Historial de Compras:**
- Listado de órdenes
- Total gastado
- Ticket promedio

**Apartados:**
- Apartados activos
- Apartados completados
- Apartados cancelados
- Saldo CxC actual

**Análisis:**
- Valor de vida (LTV)
- Frecuencia de compra
- Productos favoritos (categorías compradas)

---

### 7.3. Segmentación (Futuro, v2)
- Clientes VIP (>$X gastado)
- Clientes en riesgo (sin compra en >6 meses)
- Clientes nuevos (primera compra <30 días)

---

## 8. ENVÍOS

### 8.1. Flujo de Envío Actual (Manual)

**Paso 1:** Orden pagada → Admin ve en "Órdenes por Enviar"  
**Paso 2:** Admin marca como "Preparando"  
**Paso 3:** Admin genera guía DHL/FedEx manualmente  
**Paso 4:** Admin copia tracking number y URL  
**Paso 5:** Admin actualiza orden con tracking  
**Paso 6:** Admin marca como "Enviado"  
**Paso 7:** Admin verifica entrega (manual)  
**Paso 8:** Admin marca como "Entregado"

---

### 8.2. Flujo de Envío Mejorado (Propuesto)

**Paso 1:** Orden pagada → Admin ve en "Órdenes por Enviar"  
**Paso 2:** Admin marca como "Preparando"  
**Paso 3:** Admin hace clic en "Generar Guía DHL" (integración API)  
**Paso 4:** Sistema genera guía y obtiene tracking automáticamente  
**Paso 5:** Sistema actualiza orden con tracking  
**Paso 6:** Sistema marca como "Enviado"  
**Paso 7:** Sistema consulta tracking diariamente (cron job)  
**Paso 8:** Sistema marca como "Entregado" automáticamente cuando DHL confirma

---

### 8.3. Integraciones Propuestas

#### DHL México
- **API:** DHL Express API
- **Funcionalidades:**
  - Crear guía
  - Obtener tracking number
  - Consultar status de envío
  - Imprimir etiqueta (PDF)

**Credenciales necesarias:**
- DHL API Key
- DHL Account Number

**Implementación:**
- Script Node.js para integración
- Endpoints `/api/shipping/dhl/create-label`
- Endpoints `/api/shipping/dhl/track`

---

#### FedEx México
- **API:** FedEx Web Services
- **Funcionalidades:**
  - Crear guía
  - Obtener tracking number
  - Consultar status de envío
  - Imprimir etiqueta (PDF)

**Credenciales necesarias:**
- FedEx API Key
- FedEx Account Number
- FedEx Meter Number

**Implementación:**
- Script Node.js para integración
- Endpoints `/api/shipping/fedex/create-label`
- Endpoints `/api/shipping/fedex/track`

---

### 8.4. Configuración de Envíos

**Tarifas:**
- Nacional (zona 1, 2, 3)
- Internacional

**Zonas:**
- Definir zonas por código postal
- Asignar tarifa por zona

**Opciones:**
- Envío gratis (monto mínimo)
- Tarifa plana

---

## 9. APARTADOS / CxC

### 9.1. Gestión de Apartados

**Listado de Apartados Activos:**
- Cliente
- Producto
- Plan de pago
- Monto total
- Pagado
- Saldo pendiente
- Próximo vencimiento
- Días sin pago

**Filtros:**
- Por status (activo, vencido, completado)
- Por cliente
- Por producto
- Por plan

**Acciones:**
- Ver detalle de apartado
- Ver historial de pagos
- Enviar recordatorio (email/WhatsApp)
- Marcar como cancelado
- Marcar como perdido (forfeited)

---

### 9.2. Detalle de Apartado

**Información General:**
- Cliente
- Producto
- Plan de pago
- Fecha de inicio
- Fecha de vencimiento final

**Pagos:**
- Listado de pagos (realizados y pendientes)
- Monto, fecha vencimiento, status

**Acciones:**
- Registrar pago manual (efectivo, transferencia)
- Enviar recordatorio
- Cancelar apartado
- Extender plazo (manual)

---

### 9.3. Reportes de CxC

**Reporte: Saldo Total por Cobrar**
- Suma de todos los apartados activos (saldo pendiente)

**Reporte: Apartados por Vencer**
- Filtro: próximos 7 días, 14 días, 30 días
- Acciones sugeridas: recordatorio

**Reporte: Tasa de Completitud**
- % de apartados completados vs creados
- % de apartados cancelados vs creados
- % de apartados perdidos vs creados

---

## 10. COMPRAS / PROVEEDORES / CxP

### 10.1. Proveedores

**Directorio de Proveedores:**
- Nombre
- Contacto (email, teléfono)
- Dirección
- Notas
- Total compras ($)
- Última compra
- Saldo CxP

**Acciones:**
- Crear proveedor
- Editar proveedor
- Ver historial de compras
- Ver CxP

---

### 10.2. Compras

**Flujo de Registro de Compra:**

**Paso 1:** Crear compra
- Proveedor (seleccionar de lista)
- Fecha de compra
- Método de pago (efectivo, transferencia, crédito)
- Fecha de pago (si es crédito)
- Notas

**Paso 2:** Agregar productos
- Opción A: Producto existente → actualizar costo
- Opción B: Producto nuevo → crear producto con costo

**Paso 3:** Registrar costos
- Costo unitario
- Cantidad
- Gastos adicionales (envío, aduana, etc.)
- Subtotal
- Total de la compra

**Paso 4:** Guardar compra
- Si es crédito → registrar en CxP
- Actualizar costos de productos

---

**Listado de Compras:**
- Fecha
- Proveedor
- Total
- Status (pagada, pendiente)
- Acciones: Ver detalle

---

### 10.3. CxP (Cuentas por Pagar)

**Listado de CxP:**
- Proveedor
- Compra (referencia)
- Monto
- Fecha vencimiento
- Status (pendiente, pagada)

**Acciones:**
- Marcar como pagada
- Ver detalle de compra

**Reporte: Saldo Total CxP**
- Suma de todas las compras pendientes de pago

---

## 11. DASHBOARD ADMINISTRATIVO

### 11.1. Diseño del Dashboard

**Sección 1: Stats Principales (Cards)**
- Ventas del mes (monto + % vs mes anterior)
- Ventas del día
- Órdenes pendientes de envío
- Apartados activos (número)
- Saldo CxC
- Saldo CxP
- Productos en stock
- Productos con stock bajo

---

**Sección 2: Gráficas**
- **Gráfica 1:** Ventas por día (últimos 30 días) — línea
- **Gráfica 2:** Productos más vendidos (top 10) — barras horizontales
- **Gráfica 3:** Ventas por categoría — pie chart

---

**Sección 3: Alertas y Acciones Rápidas**
- ⚠️ Productos sin stock
- ⚠️ Apartados por vencer (próximos 7 días)
- ⚠️ Apartados vencidos (>6 semanas sin pago)
- 📦 Órdenes pendientes de envío
- 💳 CxP por pagar esta semana

---

**Sección 4: Actividad Reciente**
- Últimas 5 órdenes
- Últimos 5 pagos de apartados
- Últimas 5 compras registradas

---

### 11.2. Datos en Tiempo Real
- Dashboard se actualiza cada vez que se accede
- Opción de "Actualizar" manual
- Futuro: WebSocket/SSE para updates en vivo

---

## 12. REPORTES Y FILTROS

### 12.1. Filtros Obligatorios en Todos los Reportes

**Filtros básicos:**
- Rango de fechas (desde, hasta)
- Botones rápidos: Hoy, Ayer, Esta semana, Semana pasada, Este mes, Mes pasado, Este año

**Filtros adicionales según reporte:**
- Producto (select o búsqueda)
- Categoría (select)
- Cliente (búsqueda)
- Proveedor (select)
- Status (multi-select)

---

### 12.2. Exportación de Reportes

**Formatos:**
- PDF (para impresión)
- Excel/CSV (para análisis)

**Implementación:**
- Librería: `xlsx` (Excel), `pdfkit` o `puppeteer` (PDF)
- Endpoint: `/api/reports/export`

---

## 13. TABLAS NUEVAS PROPUESTAS

### Tabla: `suppliers`
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'MX',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabla: `purchases`
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  payment_method TEXT, -- cash, transfer, credit
  payment_status TEXT DEFAULT 'pending', -- pending, paid
  payment_due_date DATE, -- if credit
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabla: `purchase_items`
```sql
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC(10,2) NOT NULL,
  additional_costs NUMERIC(10,2) DEFAULT 0, -- shipping, customs, etc.
  total_cost NUMERIC(10,2) NOT NULL, -- unit_cost * quantity + additional_costs
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabla: `inventory_movements` (Opcional, v2)
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT, -- in (purchase), out (sale), adjustment
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- purchase, order, manual
  reference_id UUID, -- purchase_id, order_id, null
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabla: `inventory_locations` (Opcional, v2)
```sql
CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Bodega A, Estante 5, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 14. CAMBIOS NECESARIOS EN TABLAS EXISTENTES

### Tabla: `products`

**Agregar campos:**
```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS additional_costs NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authenticity_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS physical_location TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_purchase_id ON products(purchase_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Comments
COMMENT ON COLUMN products.cost_price IS 'Costo de adquisición del producto (privado)';
COMMENT ON COLUMN products.supplier_id IS 'Proveedor del producto';
COMMENT ON COLUMN products.purchase_id IS 'Compra de la cual proviene el producto';
COMMENT ON COLUMN products.additional_costs IS 'Gastos adicionales (envío, aduana, reparación)';
COMMENT ON COLUMN products.authenticity_certificate_url IS 'URL del certificado de autenticidad (PDF)';
COMMENT ON COLUMN products.physical_location IS 'Ubicación física del producto (bodega, estante)';
COMMENT ON COLUMN products.sku IS 'Código SKU único';
COMMENT ON COLUMN products.stock_quantity IS 'Cantidad en inventario (normalmente 1 para productos únicos)';
COMMENT ON COLUMN products.low_stock_threshold IS 'Alerta cuando stock <= threshold';
```

**Impacto:**
- ✅ Totalmente compatible con código actual
- ✅ Campos opcionales (NULL permitido)
- ✅ NO rompe funcionalidad existente
- ✅ Frontend actual ignora campos nuevos si no los usa

---

### Tabla: `orders`

**Cambios mínimos (opcional):**
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN orders.admin_notes IS 'Notas internas del admin (no visibles para cliente)';
```

**Impacto:**
- ✅ Compatible
- ✅ NO afecta funcionalidad actual

---

### Tabla: `customer_profiles`

**Cambios opcionales (para análisis):**
```sql
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_profiles.total_orders IS 'Total de órdenes pagadas (calculado)';
COMMENT ON COLUMN customer_profiles.total_spent IS 'Total gastado (calculado)';
COMMENT ON COLUMN customer_profiles.last_order_at IS 'Fecha de última compra (calculado)';
```

**Trigger para actualizar automáticamente:**
```sql
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'paid' THEN
    UPDATE customer_profiles
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      last_order_at = NEW.created_at
    WHERE email = NEW.customer_email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
```

**Impacto:**
- ✅ Compatible
- ✅ NO afecta funcionalidad actual
- ⚠️ Backfill necesario para órdenes existentes

---

## 15. RIESGOS TÉCNICOS

### 15.1. Riesgos de Base de Datos

**Riesgo 1: Migraciones en producción**
- **Descripción:** Agregar columnas/tablas en producción puede causar downtime
- **Mitigación:**
  - Migraciones aditivas (solo ADD COLUMN, no ALTER/DROP)
  - Campos opcionales (NULL permitido)
  - Ejecutar en ventana de bajo tráfico
  - Backup completo antes de migración

**Riesgo 2: RLS policies**
- **Descripción:** Nuevas tablas necesitan RLS policies
- **Mitigación:**
  - Service role full access para admin
  - Customer policies solo para tablas customer-facing
  - Proveedores/compras solo accesibles vía service role

**Riesgo 3: Backfill de datos**
- **Descripción:** Campos nuevos en `products` quedan NULL en productos existentes
- **Mitigación:**
  - Aceptar NULL (admin completa manualmente)
  - Script de backfill con valores por defecto
  - UI para admin: "Productos sin costo registrado" (alerta)

---

### 15.2. Riesgos de Frontend

**Riesgo 1: Complejidad del admin**
- **Descripción:** Admin ERP es 5x más complejo que admin actual
- **Mitigación:**
  - Implementación por fases (MVP primero)
  - Reutilizar componentes existentes
  - Delegar a Codex para UI repetitiva

**Riesgo 2: Performance en reportes**
- **Descripción:** Reportes con muchos datos pueden ser lentos
- **Mitigación:**
  - Límite de resultados (paginación)
  - Caché de reportes frecuentes
  - Índices en columnas de filtro

**Riesgo 3: UX compleja**
- **Descripción:** Admin con 9 módulos puede abrumar al usuario
- **Mitigación:**
  - Navegación clara (sidebar con secciones)
  - Dashboard como inicio (no listado)
  - Tutoriales/tooltips

---

### 15.3. Riesgos de Integraciones

**Riesgo 1: API DHL/FedEx**
- **Descripción:** Integraciones pueden fallar, cambiar API, o tener downtime
- **Mitigación:**
  - Modo manual como fallback
  - Logs de errores de integración
  - Retry automático con backoff

**Riesgo 2: Credenciales de envío**
- **Descripción:** Credenciales inválidas o expiradas
- **Mitigación:**
  - Validación de credenciales en configuración
  - Alertas cuando falla autenticación

---

### 15.4. Riesgos de Negocio

**Riesgo 1: Sobreingeniería**
- **Descripción:** Implementar todo el ERP puede tomar meses
- **Mitigación:**
  - MVP primero (ver sección 19)
  - Validar con usuario (Jhonatan) antes de avanzar

**Riesgo 2: Cambio de prioridades**
- **Descripción:** Jhonatan puede necesitar otra funcionalidad antes
- **Mitigación:**
  - Desarrollo modular (cada módulo independiente)
  - Fases claramente definidas

---

## 16. ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### FASE 1: Foundation (Base de Datos y API)
**Duración estimada:** 3-5 días

**Tareas:**
1. Crear tabla `suppliers`
2. Crear tabla `purchases`
3. Crear tabla `purchase_items`
4. Migración: agregar campos a `products` (cost_price, supplier_id, etc.)
5. Migración: agregar campos a `customer_profiles` (total_orders, etc.)
6. RLS policies para tablas nuevas
7. Backfill de `customer_profiles` (stats de órdenes existentes)

**Entregable:**
- Migraciones SQL
- RLS policies
- Script de backfill
- Validación en staging

---

### FASE 2: Dashboard Administrativo
**Duración estimada:** 4-6 días

**Tareas:**
1. Endpoint `/api/admin/dashboard/stats` (ventas, órdenes, apartados, CxC, CxP, stock)
2. Endpoint `/api/admin/dashboard/charts` (ventas por día, top productos, ventas por categoría)
3. UI: Dashboard nuevo (`/admin/dashboard`)
4. UI: Navegación lateral (sidebar con módulos)
5. Migrar admin actual a nueva navegación

**Entregable:**
- Dashboard funcional
- Stats en tiempo real
- Gráficas básicas
- Navegación modular

---

### FASE 3: Inventario Mejorado
**Duración estimada:** 5-7 días

**Tareas:**
1. Endpoint `PATCH /api/products/[id]/costs` (actualizar costo, proveedor, gastos)
2. UI: Formulario extendido de producto (costos, proveedor, stock, SKU)
3. UI: Listado de productos con filtros (categoría, marca, stock, status)
4. UI: Alertas de stock bajo
5. Cálculo automático de utilidad y margen en UI

**Entregable:**
- Productos con costos y márgenes
- Gestión de stock básica
- Alertas de inventario

---

### FASE 4: Proveedores y Compras
**Duración estimada:** 5-7 días

**Tareas:**
1. Endpoint CRUD `/api/suppliers` (create, read, update, delete)
2. Endpoint CRUD `/api/purchases` (create, read, update)
3. UI: Directorio de proveedores
4. UI: Crear/editar proveedor
5. UI: Registrar compra
6. UI: Listado de compras
7. Vincular compra → productos (actualizar cost_price automáticamente)

**Entregable:**
- Directorio de proveedores funcional
- Registro de compras
- CxP básico

---

### FASE 5: Reportes de Ventas
**Duración estimada:** 4-6 días

**Tareas:**
1. Endpoint `/api/reports/sales` (ventas por período, producto, categoría, cliente)
2. UI: Página de reportes con filtros
3. UI: Gráficas de ventas
4. Exportación a PDF/Excel

**Entregable:**
- Reportes de ventas completos
- Filtros avanzados
- Exportación

---

### FASE 6: Clientes (Directorio y Análisis)
**Duración estimada:** 3-5 días

**Tareas:**
1. Endpoint `/api/admin/customers` (listado con stats)
2. Endpoint `/api/admin/customers/[id]` (detalle + historial)
3. UI: Directorio de clientes
4. UI: Detalle de cliente
5. UI: Análisis (LTV, frecuencia)

**Entregable:**
- Directorio de clientes
- Análisis de clientes
- Historial completo

---

### FASE 7: Apartados / CxC Mejorado
**Duración estimada:** 3-5 días

**Tareas:**
1. Endpoint `/api/admin/layaways` (listado con filtros)
2. UI: Apartados activos/vencidos/completados
3. UI: Detalle de apartado con acciones (recordatorio, cancelar, extender)
4. UI: Reporte CxC (saldo total, por vencer)

**Entregable:**
- Gestión completa de apartados
- Reportes de CxC
- Acciones admin (recordatorios)

---

### FASE 8: Envíos Mejorados (Manual Optimizado)
**Duración estimada:** 3-4 días

**Tareas:**
1. UI: Órdenes por enviar (filtro payment_status=paid, shipping_status=pending)
2. UI: Formulario actualizar envío (carrier, tracking_number, tracking_url)
3. UI: Marcar como enviado/entregado
4. UI: Órdenes enviadas (en tránsito)

**Entregable:**
- Gestión de envíos optimizada (manual)
- Tracking manual simplificado

---

### FASE 9: Integraciones DHL/FedEx (Opcional, v2)
**Duración estimada:** 7-10 días

**Tareas:**
1. Integración DHL API (crear guía, tracking)
2. Integración FedEx API (crear guía, tracking)
3. Endpoint `/api/shipping/create-label` (DHL o FedEx)
4. UI: Botón "Generar Guía DHL/FedEx" en detalle de orden
5. Cron job: actualizar tracking automáticamente

**Entregable:**
- Generación automática de guías
- Tracking automático
- Impresión de etiquetas

---

## 17. MVP RECOMENDADO DEL ADMIN

### ¿Qué es el MVP?
El **MVP (Minimum Viable Product)** del Admin ERP es la versión mínima funcional que cubre las necesidades críticas del negocio sin sobreingeniería.

---

### MVP = FASES 1-6
**Duración total estimada:** 22-36 días (3-5 semanas)

**Módulos incluidos:**
1. ✅ **Dashboard Administrativo** (stats + gráficas básicas)
2. ✅ **Inventario Mejorado** (costos, stock, márgenes, alertas)
3. ✅ **Proveedores y Compras** (directorio, registro de compras, CxP)
4. ✅ **Reportes de Ventas** (por período, producto, categoría, cliente)
5. ✅ **Clientes** (directorio, análisis, historial)
6. ✅ **Apartados / CxC** (gestión mejorada, reportes)

**Módulos NO incluidos en MVP:**
- ❌ Envíos avanzados (se mantiene manual optimizado en FASE 8)
- ❌ Integraciones DHL/FedEx (v2)
- ❌ Inventario con movimientos detallados (v2)
- ❌ Roles y permisos admin (v2)
- ❌ Configuración avanzada (v2)

---

### Por qué este MVP
1. **Cubre necesidades críticas:**
   - Control de costos y márgenes (rentabilidad)
   - Gestión de proveedores (CxP)
   - Reportes de ventas (análisis de negocio)
   - Directorio de clientes (CRM básico)
   - Apartados mejorados (CxC)

2. **Desarrollo modular:**
   - Cada fase es independiente
   - Se puede pausar/ajustar entre fases

3. **Validación temprana:**
   - Jhonatan puede validar después de cada fase
   - Ajustar prioridades si cambian necesidades

4. **Tiempo razonable:**
   - 3-5 semanas vs 2-3 meses del ERP completo
   - Entregable funcional rápido

---

## 18. QUÉ NO IMPLEMENTAR TODAVÍA

### NO Implementar en MVP (Dejar para v2)

#### 1. Inventario con Movimientos Detallados
**Razón:**
- Bagclue vende productos únicos (no masivos)
- Stock normalmente es 1 por producto
- Movimientos detallados agregan complejidad innecesaria

**Cuándo implementar:**
- Si el negocio escala a productos con stock masivo
- Si se requiere trazabilidad de cada movimiento

---

#### 2. Integraciones DHL/FedEx Automáticas
**Razón:**
- Complejidad de integración vs beneficio
- Volumen de envíos puede no justificar automatización
- Modo manual funciona bien si son <20 envíos/semana

**Cuándo implementar:**
- Si envíos superan 20-30 por semana
- Si errores manuales se vuelven frecuentes
- Si Jhonatan lo solicita explícitamente

---

#### 3. Roles y Permisos Admin
**Razón:**
- Jhonatan es el único admin actual
- Agregar roles es overkill sin múltiples usuarios

**Cuándo implementar:**
- Si se agregan empleados con acceso al admin
- Si se necesita auditoría de quién hizo qué

---

#### 4. Configuración Avanzada del Sistema
**Razón:**
- Configuración básica es suficiente
- Sobreingeniería sin ROI claro

**Cuándo implementar:**
- Si hay múltiples canales de venta
- Si hay múltiples monedas/zonas
- Si hay configuraciones dinámicas que cambian frecuentemente

---

#### 5. Facturación Electrónica (CFDI México)
**Razón:**
- Complejidad alta
- Requiere PAC (Proveedor Autorizado de Certificación)
- Puede no ser requerido según régimen fiscal

**Cuándo implementar:**
- Si Jhonatan lo requiere por obligación fiscal
- Si clientes empresariales lo solicitan

---

#### 6. Devoluciones y Reembolsos
**Razón:**
- Productos de lujo preloved normalmente no aceptan devolución
- Flujo de devolución requiere lógica compleja

**Cuándo implementar:**
- Si política de devoluciones cambia
- Si se vuelve frecuente

---

#### 7. Variantes de Producto
**Razón:**
- Productos de lujo son únicos (no tienen tallas/colores)
- Complejidad innecesaria

**Cuándo implementar:**
- Si se agregan productos con variantes (ej: accesorios con colores)

---

#### 8. Análisis Predictivo / IA
**Razón:**
- Requiere volumen de datos históricos
- Sobreingeniería sin datos suficientes

**Cuándo implementar:**
- Si hay >1 año de datos de ventas
- Si se necesita forecast de demanda

---

## 19. RESUMEN EJECUTIVO

### Situación Actual
- Admin funcional pero básico
- Gestión de productos y órdenes
- Sin control de costos, proveedores, CxC/CxP, reportes

### Propuesta
- Sistema administrativo / mini ERP
- 9 módulos: Dashboard, Inventario, Ventas, Clientes, Envíos, Apartados/CxC, Compras/Proveedores/CxP, Reportes, Configuración

### MVP Recomendado (3-5 semanas)
1. Dashboard Administrativo
2. Inventario Mejorado (costos, stock, márgenes)
3. Proveedores y Compras (CxP)
4. Reportes de Ventas
5. Clientes (directorio, análisis)
6. Apartados / CxC Mejorado

### Qué NO Implementar Todavía
- Integraciones DHL/FedEx (manual optimizado suficiente)
- Inventario con movimientos detallados
- Roles y permisos admin
- Facturación electrónica
- Devoluciones
- Variantes

### Riesgos
- Complejidad del admin (mitigado con fases)
- Migraciones en producción (mitigado con migraciones aditivas)
- Integraciones externas (opcional, v2)

### Orden de Implementación
1. FASE 1: Foundation (DB + API)
2. FASE 2: Dashboard
3. FASE 3: Inventario
4. FASE 4: Proveedores/Compras
5. FASE 5: Reportes Ventas
6. FASE 6: Clientes
7. FASE 7: Apartados/CxC (opcional si no urge)
8. FASE 8: Envíos optimizado manual (opcional)
9. FASE 9: DHL/FedEx (v2, opcional)

---

## 20. PRÓXIMOS PASOS

### Antes de Implementar
1. ✅ **Revisar este documento con Jhonatan**
2. ✅ **Aprobar MVP (Fases 1-6 o ajustar alcance)**
3. ✅ **Confirmar prioridades** (¿algún módulo es más urgente que otro?)
4. ✅ **Validar que SUBFASE C está 100% cerrada** (panel cliente)

### Al Aprobar
1. 🚀 **Arrancar FASE 1** (Foundation)
2. 📝 **Crear documento de implementación** (FASE_1_FOUNDATION.md)
3. 🔧 **Ejecutar migraciones en staging primero**
4. ✅ **Validar con Jhonatan antes de producción**

---

## 21. NOTAS FINALES

**Este documento es SOLO diseño y propuesta.**

**NO SE DEBE:**
- ❌ Modificar base de datos sin autorización
- ❌ Crear tablas sin autorización
- ❌ Modificar código sin autorización
- ❌ Hacer deploy sin autorización

**SOLO SE DEBE:**
- ✅ Revisar con Jhonatan
- ✅ Discutir alcance y prioridades
- ✅ Aprobar formalmente antes de implementar

**Última actualización:** 2026-05-04  
**Próxima revisión:** Cuando Jhonatan apruebe arrancar

---

**FIN DEL DOCUMENTO**
