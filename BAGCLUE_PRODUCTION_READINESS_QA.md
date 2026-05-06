# BAGCLUE PRODUCTION READINESS QA — CHECKLIST FINAL

**Fecha:** 2026-05-06  
**Objetivo:** Confirmar si Bagclue está lista para producción pública  
**Método:** QA manual guiado (no automático)  
**Ambientes:** Desktop + Mobile básico  
**URL base:** https://bagclue.vercel.app

---

## INSTRUCCIONES GENERALES

### Antes de empezar
1. Abrir Chrome/Safari en modo incógnito (sesión limpia)
2. Abrir DevTools (F12 o Cmd+Opt+I)
3. Ir a Console tab
4. Mantener Console abierta durante toda la validación
5. Anotar cualquier error rojo o warning crítico

### Criterios PASS/FAIL

**PASS:** Funcionalidad correcta + sin errores críticos en consola  
**FAIL:** Error crítico, funcionalidad rota, 500, o consola con errores rojos no manejados  
**WARN:** Funciona pero con warnings menores o UX mejorable

---

## PARTE 1 — RUTAS PÚBLICAS (12 rutas)

### 1. Landing — /

**URL:** https://bagclue.vercel.app

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Hero editorial visible (fondo marfil, copy grande)
- [ ] Sección productos destacados visible
- [ ] Navbar visible (logo + links)
- [ ] Footer visible
- [ ] Mega menú funciona al hover "Catálogo"
- [ ] Links "Ver catálogo" funcionan
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 2. Catálogo — /catalogo

**URL:** https://bagclue.vercel.app/catalogo

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Grid de productos visible
- [ ] Al menos 1 producto se muestra
- [ ] ProductCard tiene imagen, marca, modelo, precio
- [ ] Hover en card funciona (overlay "Ver detalles")
- [ ] Click en card abre detalle
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 3. Catálogo filtrado por marca — /catalogo?brand=Chanel

**URL:** https://bagclue.vercel.app/catalogo?brand=Chanel

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Solo productos Chanel visibles
- [ ] URL tiene `?brand=Chanel`
- [ ] Filtro "Chanel" se ve activo en UI
- [ ] Si no hay productos Chanel, muestra mensaje apropiado
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 4. Catálogo filtrado por categoría — /catalogo?category=Bolsas

**URL:** https://bagclue.vercel.app/catalogo?category=Bolsas

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Solo productos de categoría "Bolsas" visibles
- [ ] URL tiene `?category=Bolsas`
- [ ] Filtro "Bolsas" se ve activo en UI
- [ ] Si no hay productos Bolsas, muestra mensaje apropiado
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 5. Catálogo con búsqueda — /catalogo?search=Birkin

**URL:** https://bagclue.vercel.app/catalogo?search=Birkin

**Validar:**
- [ ] Página carga sin 404/500
- [ ] URL tiene `?search=Birkin`
- [ ] Input de búsqueda contiene "Birkin"
- [ ] Solo productos que matchean "Birkin" visibles (o mensaje "Sin resultados")
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 6. Detalle producto available — /catalogo/[slug]

**URL ejemplo:** https://bagclue.vercel.app/catalogo/chanel-classic-flap-negro

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Layout 55/45 visible (galería grande + info derecha)
- [ ] Galería muestra imagen principal
- [ ] Si hay múltiples imágenes, thumbnails visibles y clicables
- [ ] Marca, título, precio visibles
- [ ] Trust badge Entrupy visible (si producto verificado)
- [ ] Botón "Agregar al Carrito" visible
- [ ] Botón "Apartar" visible (si allow_layaway)
- [ ] 5 secciones editoriales visibles:
  - [ ] Detalles de la pieza
  - [ ] Condición
  - [ ] Qué incluye
  - [ ] Autenticidad (o trust badge arriba)
  - [ ] Envío y apartado
- [ ] Related products visible abajo
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 7. Detalle producto sold/apartado — /catalogo/[slug]

**URL ejemplo:** https://bagclue.vercel.app/catalogo/25-small-negra

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Badge "Vendida" o "Apartada" visible en galería
- [ ] Mensaje de estado elegante visible (ej: "Esta pieza ya encontró nueva dueña")
- [ ] CTA secundario visible (ej: "Ver catálogo completo")
- [ ] NO se muestra botón "Agregar al Carrito"
- [ ] Información del producto visible
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 8. Carrito — /cart

**URL:** https://bagclue.vercel.app/cart

**Validar carrito vacío:**
- [ ] Página carga sin 404/500
- [ ] Mensaje "Tu carrito está vacío" visible
- [ ] Link "Ver catálogo" funciona
- [ ] Sin errores rojos en Console

**Validar carrito con producto (después de agregar):**
- [ ] Producto agregado se muestra con imagen, marca, modelo, precio
- [ ] Cantidad editable
- [ ] Botón "Eliminar" funciona
- [ ] Subtotal correcto
- [ ] Botón "Continuar al checkout" visible
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 9. Checkout success — /checkout/success

**URL:** https://bagclue.vercel.app/checkout/success

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Mensaje de éxito visible
- [ ] Link "Ver mis pedidos" funciona (si usuario logueado)
- [ ] Link "Volver al catálogo" funciona
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 10. Apartado — /apartado

**URL:** https://bagclue.vercel.app/apartado

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Información sobre apartados visible
- [ ] Link al catálogo funciona
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 11. Nosotros — /nosotros

**URL:** https://bagclue.vercel.app/nosotros

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Contenido sobre la marca visible
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 12. Contacto — /contacto

**URL:** https://bagclue.vercel.app/contacto

**Validar:**
- [ ] Página carga sin 404/500
- [ ] Información de contacto visible
- [ ] Link a Instagram funciona
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

## PARTE 2 — RUTAS CLIENTE (5 rutas)

**⚠️ Requiere cuenta de cliente activa. Usar magic link para login.**

### 13. Dashboard cliente — /account

**URL:** https://bagclue.vercel.app/account

**Validar sin login:**
- [ ] Redirige a /account/login

**Validar con login:**
- [ ] Página carga sin 404/500
- [ ] Resumen de cuenta visible
- [ ] Links a pedidos, direcciones, perfil visibles
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 14. Pedidos cliente — /account/orders

**URL:** https://bagclue.vercel.app/account/orders

**Validar:**
- [ ] Requiere login (redirige si no autenticado)
- [ ] Página carga sin 404/500
- [ ] Lista de pedidos visible (o mensaje "Sin pedidos todavía")
- [ ] Cada pedido muestra: ID, fecha, total, estado
- [ ] Click en pedido abre detalle
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 15. Detalle pedido cliente — /account/orders/[id]

**URL ejemplo:** https://bagclue.vercel.app/account/orders/[order-id]

**Validar:**
- [ ] Requiere login (redirige si no autenticado)
- [ ] Página carga sin 404/500
- [ ] Detalle del pedido visible: productos, total, fecha, estado
- [ ] Estado de envío visible
- [ ] Dirección de envío visible
- [ ] Sección "Confirmar dirección" funciona (si pending_address)
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 16. Direcciones cliente — /account/addresses

**URL:** https://bagclue.vercel.app/account/addresses

**Validar:**
- [ ] Requiere login (redirige si no autenticado)
- [ ] Página carga sin 404/500
- [ ] Lista de direcciones visible (o mensaje "Sin direcciones")
- [ ] Botón "Agregar dirección" funciona
- [ ] Editar dirección funciona
- [ ] Eliminar dirección funciona
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 17. Tracking público — /track/[token]

**URL ejemplo:** https://bagclue.vercel.app/track/[tracking-token]

**Validar:**
- [ ] NO requiere login
- [ ] Página carga sin 404/500
- [ ] Info del pedido visible (sin datos sensibles)
- [ ] Estado de envío visible
- [ ] Tracking number visible (si enviado)
- [ ] Link a paquetería funciona (si disponible)
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

## PARTE 3 — RUTAS ADMIN (5 rutas)

**⚠️ Requiere cuenta admin. Usar credenciales de admin.**

### 18. Dashboard admin — /admin

**URL:** https://bagclue.vercel.app/admin

**Validar sin login:**
- [ ] Redirige a /admin/login

**Validar con login admin:**
- [ ] Página carga sin 404/500
- [ ] Stats visibles (total productos, pedidos, etc.)
- [ ] Links a Productos, Órdenes, Envíos visibles
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 19. Lista productos admin — /admin/productos

**URL:** https://bagclue.vercel.app/admin/productos

**Validar:**
- [ ] Requiere login admin
- [ ] Página carga sin 404/500
- [ ] Lista de productos visible (todos, publicados + no publicados)
- [ ] Búsqueda funciona
- [ ] Click en producto abre edición
- [ ] Botón "Crear producto" visible
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 20. Crear producto admin — /admin/productos/new

**URL:** https://bagclue.vercel.app/admin/productos/new

**Validar:**
- [ ] Requiere login admin
- [ ] Página carga sin 404/500
- [ ] Form de producto visible con todos los campos:
  - [ ] Brand, Model, Title, Color, Origin, Material
  - [ ] Price, Currency
  - [ ] Category
  - [ ] Condition, Condition notes
  - [ ] Status
  - [ ] Includes box, dust bag, papers, accessories
  - [ ] Authenticity verified
  - [ ] Stock, allow layaway
- [ ] Upload imagen funciona
- [ ] Botón "Crear" funciona
- [ ] Al crear, redirige a lista o detalle
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 21. Panel envíos admin — /admin/envios

**URL:** https://bagclue.vercel.app/admin/envios

**Validar:**
- [ ] Requiere login admin
- [ ] Página carga sin 404/500
- [ ] 6 tabs visibles: All, Pending address, Pending shipment, Preparing, Shipped, Delivered
- [ ] Stats visibles (total + por categoría)
- [ ] Search bar funciona
- [ ] Lista de envíos visible con:
  - [ ] Order ID
  - [ ] Cliente
  - [ ] Producto
  - [ ] Payment status badge
  - [ ] Shipping status badge
  - [ ] Address badge
  - [ ] Acciones (Ver detalle, Marcar preparando, Marcar enviado, etc.)
- [ ] Pagination funciona (si >20 envíos)
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### 22. Órdenes admin — /admin/orders

**URL:** https://bagclue.vercel.app/admin/orders

**Validar:**
- [ ] Requiere login admin
- [ ] Página carga sin 404/500
- [ ] Lista de órdenes visible
- [ ] Filtros funcionan
- [ ] Search funciona
- [ ] Click en orden abre detalle
- [ ] Sin errores rojos en Console

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

## PARTE 4 — FLUJOS CRÍTICOS (11 flujos)

### FLUJO 1: Ver producto

**Pasos:**
1. Ir a https://bagclue.vercel.app/catalogo
2. Click en cualquier ProductCard
3. Validar que abre detalle correcto

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 2: Agregar al carrito

**Pasos:**
1. Ir a detalle producto available
2. Click "Agregar al Carrito"
3. Validar mensaje "✓ Agregado al carrito"
4. Click "Ver en Carrito" (botón cambia)
5. Validar redirige a /cart
6. Validar producto está en carrito

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 3: Ir al carrito

**Pasos:**
1. Agregar producto al carrito (flujo 2)
2. Click icono carrito en navbar
3. Validar abre /cart
4. Validar producto visible

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 4: Checkout Stripe test

**Pasos:**
1. Tener producto en carrito
2. Click "Continuar al checkout"
3. Validar redirige a Stripe Checkout (dominio stripe.com)
4. Usar tarjeta test: 4242 4242 4242 4242, exp futura, CVC cualquier 3 dígitos
5. Completar form con datos test
6. Click "Pay"
7. Validar procesa sin error

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 5: Pago exitoso

**Pasos:**
1. Completar flujo 4
2. Validar redirige a /checkout/success
3. Validar mensaje de éxito visible
4. Validar se crea orden en DB (verificar admin después)

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 6: Confirmar dirección de envío

**Pasos:**
1. Login como cliente que tiene pedido pendiente de dirección
2. Ir a /account/orders
3. Click en pedido
4. Validar badge "⚠️ Dirección pendiente" visible
5. Click "Confirmar dirección" o "Cambiar dirección"
6. Llenar/seleccionar dirección
7. Confirmar
8. Validar badge cambia a "✓ Dirección confirmada"

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 7: Admin ve pedido pendiente

**Pasos:**
1. Login como admin
2. Ir a /admin/envios
3. Click tab "Pending address" o "Pending shipment"
4. Validar pedido reciente visible
5. Validar info correcta: cliente, producto, payment status

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 8: Admin marca preparando

**Pasos:**
1. Admin en /admin/envios tab "Pending shipment"
2. Pedido con dirección confirmada + paid
3. Click "Marcar preparando"
4. Validar modal con info del pedido
5. Confirmar
6. Validar pedido se mueve a tab "Preparing"
7. Validar shipping_status actualizado en DB

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 9: Admin marca enviado

**Pasos:**
1. Admin en /admin/envios tab "Preparing"
2. Pedido en estado preparing
3. Click "Marcar enviado"
4. Validar modal con form:
   - [ ] Dropdown paquetería (DHL, FedEx, Otro)
   - [ ] Tracking number (required)
   - [ ] Tracking URL (optional)
5. Llenar form (ej: DHL, 1234567890, https://dhl.com/track)
6. Confirmar
7. Validar pedido se mueve a tab "Shipped"
8. Validar tracking info guardada en DB

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 10: Admin marca entregado

**Pasos:**
1. Admin en /admin/envios tab "Shipped"
2. Pedido en estado shipped
3. Click "Marcar entregado"
4. Validar modal con advertencia "no puede revertirse"
5. Confirmar
6. Validar pedido se mueve a tab "Delivered"
7. Validar shipping_status = delivered en DB

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### FLUJO 11: Cliente ve seguimiento actualizado

**Pasos:**
1. Cliente con pedido enviado (tiene tracking_token)
2. Ir a /account/orders
3. Click en pedido enviado
4. Validar:
   - [ ] Badge "📦 Enviado" visible
   - [ ] Paquetería visible
   - [ ] Tracking number visible
   - [ ] Botón "Ver seguimiento" funciona (abre URL tracking)
5. Ir a /track/[tracking-token] (sin login)
6. Validar info de seguimiento visible públicamente

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

## PARTE 5 — VALIDACIÓN MOBILE BÁSICO

**Dispositivo:** iPhone/Android o Chrome DevTools (responsive mode 375x667)

**Rutas críticas mobile:**

### 1. Landing mobile
- [ ] Hero legible
- [ ] Productos en grid 1 columna
- [ ] Navbar mobile funciona (hamburger si existe)
- [ ] Footer legible

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN

---

### 2. Catálogo mobile
- [ ] Grid 1-2 columnas
- [ ] ProductCard legible
- [ ] Filtros accesibles (dropdown o modal)
- [ ] Scroll funciona

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN

---

### 3. Detalle producto mobile
- [ ] Layout stack vertical (galería arriba, info abajo)
- [ ] Galería full width
- [ ] Thumbnails scroll horizontal
- [ ] CTAs grandes y tocables (py-4)
- [ ] Secciones legibles
- [ ] Related products scroll horizontal o grid 2 col

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN

---

### 4. Carrito mobile
- [ ] Productos legibles
- [ ] Botón checkout grande y tocable
- [ ] No overflow horizontal

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN

---

### 5. Admin mobile (opcional)
- [ ] Panel usable (no crítico, admin suele ser desktop)

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN

---

## PARTE 6 — VALIDACIÓN COMPONENTES CRÍTICOS

### Mega menú
- [ ] Hover en "Catálogo" abre mega menú
- [ ] Links marcas funcionan
- [ ] Links categorías funcionan
- [ ] Mega menú NO se cierra solo inmediatamente
- [ ] Mega menú se cierra al salir mouse

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Filtros catálogo
- [ ] Filtro por marca funciona
- [ ] Filtro por categoría funciona
- [ ] Filtro por status funciona
- [ ] Search funciona
- [ ] Sort funciona
- [ ] URL se actualiza con query params
- [ ] Múltiples filtros simultáneos funcionan

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Carrito (CartContext)
- [ ] Agregar producto actualiza contador navbar
- [ ] Remover producto actualiza contador
- [ ] Carrito persiste en localStorage
- [ ] Carrito se vacía después de checkout exitoso

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Checkout Stripe
- [ ] Stripe Checkout abre correctamente
- [ ] Datos pre-llenados (email si customer existe)
- [ ] Tarjeta test 4242... funciona
- [ ] Webhook procesa pago correctamente
- [ ] Orden se crea en DB con payment_status = paid
- [ ] Stock se descuenta (si stock tracking activo)

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Post-compra (customer panel)
- [ ] Cliente logueado ve sus pedidos
- [ ] Cliente puede confirmar dirección
- [ ] Cliente puede cambiar dirección antes de envío
- [ ] Cliente ve tracking actualizado
- [ ] RLS protege pedidos (solo ve los suyos)

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Admin producto
- [ ] Crear producto funciona
- [ ] Editar producto funciona
- [ ] Eliminar producto funciona (si existe)
- [ ] Upload imagen funciona
- [ ] Campos MVP.1A visibles: material, condition_notes, authenticity_verified, included_accessories

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

### Admin envío (ADMIN FASE 1B + 1C.1-4)
- [ ] GET /api/admin/envios funciona (6 filtros + search + stats)
- [ ] UI /admin/envios carga sin errores
- [ ] 6 tabs funcionan (all, pending_address, pending_shipment, preparing, shipped, delivered)
- [ ] Stats en tiempo real correctas
- [ ] Search funciona (customer_name, email, tracking_number, order_id)
- [ ] Pagination funciona
- [ ] "Ver detalle" abre modal/página correcta
- [ ] "Marcar preparando" funciona (solo si pending_shipment + address + paid)
- [ ] "Marcar enviado" funciona (solo si preparing)
  - [ ] Modal con form completo (paquetería + tracking)
  - [ ] Dropdown paqueterías: DHL, FedEx, Otro
  - [ ] Tracking number required
  - [ ] Tracking URL optional
  - [ ] API call PUT /orders/[id]/shipping correcto
- [ ] "Marcar entregado" funciona (solo si shipped)
  - [ ] Modal con advertencia roja "no reversible"
  - [ ] Confirmación explícita
  - [ ] API call PUT /orders/[id]/shipping correcto
- [ ] Refetch automático después de cada acción
- [ ] Estados de botones correctos (disabled cuando no aplica, tooltips informativos)

**Resultado:** [ ] PASS / [ ] FAIL / [ ] WARN  
**Notas:**

---

## PARTE 7 — CONSOLA LIMPIA

**Durante toda la validación, anotar:**

### Errores críticos (rojos)
- [ ] Sin errores de hydration
- [ ] Sin errores 500
- [ ] Sin errores de DB/Supabase no manejados
- [ ] Sin errores de Stripe no manejados

**Lista de errores críticos encontrados:**

---

### Warnings menores (amarillos)
- Anotar warnings relevantes (no todos los warnings son críticos)

**Lista de warnings encontrados:**

---

## PARTE 8 — RESUMEN EJECUTIVO

### Rutas públicas (12)
- PASS: __ / 12
- FAIL: __ / 12
- WARN: __ / 12

### Rutas cliente (5)
- PASS: __ / 5
- FAIL: __ / 5
- WARN: __ / 5

### Rutas admin (5)
- PASS: __ / 5
- FAIL: __ / 5
- WARN: __ / 5

### Flujos críticos (11)
- PASS: __ / 11
- FAIL: __ / 11
- WARN: __ / 11

### Mobile básico (5)
- PASS: __ / 5
- FAIL: __ / 5
- WARN: __ / 5

### Componentes críticos (7)
- PASS: __ / 7
- FAIL: __ / 7
- WARN: __ / 7

**Total:**
- PASS: __ / 45
- FAIL: __ / 45
- WARN: __ / 45

---

## PARTE 9 — BUGS CRÍTICOS

**Definición:** Bug que rompe funcionalidad core o previene uso del sitio.

### Lista de bugs críticos encontrados:

1. 
2. 
3. 

**Total bugs críticos:** __

---

## PARTE 10 — BUGS MENORES

**Definición:** Bug que no rompe funcionalidad pero afecta UX o tiene workaround.

### Lista de bugs menores encontrados:

1. 
2. 
3. 

**Total bugs menores:** __

---

## PARTE 11 — RECOMENDACIONES ANTES DE PRODUCCIÓN

### Críticas (deben resolverse ANTES de abrir público)

1. 
2. 
3. 

### Recomendadas (pueden resolverse post-launch con monitoreo)

1. 
2. 
3. 

### Nice-to-have (mejoras futuras)

1. 
2. 
3. 

---

## PARTE 12 — DECISIÓN FINAL

### Score total
- **PASS rate:** __% (__ de 45)
- **FAIL count:** __
- **WARN count:** __
- **Bugs críticos:** __
- **Bugs menores:** __

### Criterio de aprobación

**LISTA PARA PRODUCCIÓN si:**
- PASS rate ≥ 90% (41+ de 45)
- Bugs críticos = 0
- Bugs menores ≤ 3
- Flujos core 100% funcionales (agregar carrito, checkout, post-compra, admin envío)

**NO LISTA PARA PRODUCCIÓN si:**
- PASS rate < 90%
- Bugs críticos > 0
- Checkout o admin envío roto

---

### Decisión

**[ ] LISTA PARA PRODUCCIÓN PÚBLICA**  
**[ ] NO LISTA — requiere fixes críticos**

**Razón:**

---

### Siguiente paso recomendado

Si LISTA:
- [ ] Anunciar lanzamiento
- [ ] Monitorear primeras 24h
- [ ] Configurar alertas Sentry/logging

Si NO LISTA:
- [ ] Crear issues específicos para bugs críticos
- [ ] Estimar tiempo de fix
- [ ] Re-validar después de fixes

---

## NOTAS FINALES

**Validado por:**  
**Fecha:**  
**Ambiente:** Production (https://bagclue.vercel.app)  
**Commit:** 0af31a3  
**Build:** 37/37 routes PASS

---

**Fin del checklist.**
