# ADMIN INVENTARIO — CARGA PROFESIONAL DE ARTÍCULOS DE LUJO
## Scope Document

**Fecha:** 2026-05-04 19:00 UTC  
**Estado:** PENDIENTE APROBACIÓN  
**⚠️ NO IMPLEMENTAR HASTA APROBACIÓN EXPLÍCITA**

---

## OBJETIVO

Rediseñar el sistema de creación y edición de productos en Bagclue para gestión profesional de inventario de artículos de lujo, cubriendo 4 categorías principales con campos específicos, costos internos, certificación de autenticidad, y control de publicación.

**Categorías:**
- Bolsas
- Zapatos
- Joyería
- Accesorios

---

## 1. CAMPOS COMUNES A TODOS LOS ARTÍCULOS

### Identificación y catalogación
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `id` | UUID | Sí | ID único | Interno |
| `sku` | String | Futuro | Código de inventario único | Interno |
| `slug` | String | Sí | URL-friendly identifier | Público |
| `category` | Enum | Sí | bolsas \| zapatos \| joyeria \| accesorios | Público |

### Información básica
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `brand` | String | Sí | Marca (Chanel, Hermès, etc.) | Público |
| `title` | String | Sí | Nombre descriptivo | Público |
| `model` | String | No | Modelo específico (Kelly, Birkin, etc.) | Público |
| `color` | String | No | Color principal | Público |
| `origin` | String | No | País de origen | Público |
| `description` | Text | No | Descripción detallada | Público |

### Precios
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `price` | Decimal | Sí | Precio de venta al público | Público |
| `currency` | String | Sí | MXN, USD, EUR | Público |
| `cost` | Decimal | No | Costo de adquisición | **Interno** |
| `cost_currency` | String | No | Moneda del costo | **Interno** |
| `margin` | Decimal | Computed | (price - cost) / cost * 100 | **Interno** |

### Condición y autenticidad
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `condition` | Enum | Sí | new \| excellent \| very_good \| good \| used | Público |
| `condition_notes` | Text | No | Detalles de la condición | Público |
| `authenticity_verified` | Boolean | Sí | Certificado de autenticidad | Público |
| `authenticity_certificate_url` | String | No | URL del certificado | **Interno** |
| `authenticity_notes` | Text | No | Notas de autenticidad | **Interno** |

### Accesorios incluidos
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `includes_box` | Boolean | Sí | Caja original incluida | Público |
| `includes_dust_bag` | Boolean | Sí | Dust bag incluida | Público |
| `includes_papers` | Boolean | Sí | Documentos originales | Público |
| `includes_extras` | JSONB | No | Otros accesorios (llave, cadenas, etc.) | Público |

### Procedencia y control
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `source` | Enum | Sí | owned \| consignment \| supplier | **Interno** |
| `supplier_name` | String | Condicional | Nombre del proveedor/consignador | **Interno** |
| `supplier_contact` | String | No | Contacto del proveedor | **Interno** |
| `consignment_percentage` | Decimal | Condicional | % para consignador | **Interno** |
| `purchase_date` | Date | No | Fecha de adquisición | **Interno** |
| `purchase_invoice` | String | No | Referencia de factura | **Interno** |

### Estado y publicación
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `status` | Enum | Sí | available \| reserved \| sold \| hidden | Público |
| `is_published` | Boolean | Sí | Visible en tienda | Público |
| `published_at` | Timestamp | Auto | Fecha de publicación | Interno |
| `badge` | String | No | Badge especial (Nuevo, Tendencia, etc.) | Público |

### Auditoría
| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `created_at` | Timestamp | Auto | Fecha de creación | Interno |
| `updated_at` | Timestamp | Auto | Última modificación | Interno |
| `created_by` | UUID | Auto | Admin que creó | Interno |
| `last_modified_by` | UUID | Auto | Admin que modificó | Interno |

---

## 2. CAMPOS ESPECÍFICOS PARA BOLSAS

### Tabla: `product_bags` (1:1 con products donde category='bolsas')

| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `product_id` | UUID | Sí | FK a products | - |
| `bag_type` | Enum | Sí | shoulder \| crossbody \| tote \| clutch \| backpack \| bucket \| hobo | Público |
| `size_category` | Enum | Sí | mini \| small \| medium \| large \| oversized | Público |
| `dimensions_length_cm` | Decimal | No | Largo en cm | Público |
| `dimensions_width_cm` | Decimal | No | Ancho en cm | Público |
| `dimensions_height_cm` | Decimal | No | Alto en cm | Público |
| `strap_type` | Enum | No | removable \| fixed \| chain \| none | Público |
| `strap_length_cm` | Decimal | No | Largo de correa ajustable | Público |
| `hardware_color` | Enum | No | gold \| silver \| rose_gold \| gunmetal \| palladium | Público |
| `closure_type` | Enum | No | zip \| flap \| magnetic \| turn_lock \| drawstring | Público |
| `interior_pockets` | Integer | No | Número de bolsillos internos | Público |
| `exterior_pockets` | Integer | No | Número de bolsillos externos | Público |
| `material_primary` | String | Sí | Cuero, caviar, lambskin, canvas, etc. | Público |
| `material_secondary` | String | No | Material secundario | Público |
| `serial_number` | String | No | Número de serie de la bolsa | **Interno** |
| `production_year` | Integer | No | Año de producción | Público |
| `limited_edition` | Boolean | Sí | Edición limitada | Público |
| `limited_edition_number` | String | No | Número de edición (ej: 25/100) | Público |

**Fotos requeridas para bolsas:**
1. Principal (frontal)
2. Trasera
3. Lateral derecho
4. Lateral izquierdo
5. Superior (vista abierta)
6. Interior
7. Detalle de hardware
8. Detalle de sello/logo
9. Serial number (privada)
10. Certificado de autenticidad (privada)
11-15. Accesorios incluidos

**Total: 10 públicas + 5 internas mínimo**

---

## 3. CAMPOS ESPECÍFICOS PARA ZAPATOS

### Tabla: `product_shoes` (1:1 con products donde category='zapatos')

| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `product_id` | UUID | Sí | FK a products | - |
| `shoe_type` | Enum | Sí | pumps \| flats \| sandals \| boots \| sneakers \| loafers \| mules | Público |
| `size_eu` | Decimal | Sí | Talla europea (37, 37.5, 38, etc.) | Público |
| `size_us` | Decimal | No | Talla US | Público |
| `size_uk` | Decimal | No | Talla UK | Público |
| `heel_height_cm` | Decimal | No | Alto del tacón en cm | Público |
| `heel_type` | Enum | No | stiletto \| block \| wedge \| platform \| flat | Público |
| `toe_shape` | Enum | No | pointed \| round \| square \| open \| almond | Público |
| `closure_type` | Enum | No | buckle \| zip \| lace_up \| slip_on \| velcro | Público |
| `material_upper` | String | Sí | Material superior | Público |
| `material_sole` | String | No | Material de suela | Público |
| `material_lining` | String | No | Material de forro | Público |
| `hardware_color` | Enum | No | gold \| silver \| rose_gold \| gunmetal | Público |
| `embellishments` | JSONB | No | [studs, crystals, bows, chains] | Público |
| `insole_condition` | Enum | No | pristine \| minimal_wear \| visible_wear \| worn | Público |
| `sole_condition` | Enum | No | pristine \| minimal_wear \| visible_wear \| worn | Público |
| `includes_insoles` | Boolean | Sí | Plantillas originales | Público |
| `includes_heel_taps` | Boolean | No | Protectores de tacón | Público |

**Fotos requeridas para zapatos:**
1. Par completo (frontal)
2. Lateral derecho
3. Lateral izquierdo
4. Trasera
5. Superior
6. Suela derecha
7. Suela izquierda
8. Interior/etiqueta
9. Detalle de hardware/hebilla
10. Certificado de autenticidad (privada)
11-13. Accesorios incluidos

**Total: 9 públicas + 4 internas mínimo**

---

## 4. CAMPOS ESPECÍFICOS PARA JOYERÍA

### Tabla: `product_jewelry` (1:1 con products donde category='joyeria')

| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `product_id` | UUID | Sí | FK a products | - |
| `jewelry_type` | Enum | Sí | necklace \| bracelet \| earrings \| ring \| brooch \| watch | Público |
| `metal_type` | Enum | Sí | gold \| white_gold \| rose_gold \| platinum \| silver \| mixed | Público |
| `metal_purity` | String | No | 18K, 14K, 925, etc. | Público |
| `metal_weight_grams` | Decimal | No | Peso del metal | Público |
| `gemstone_primary` | String | No | Diamante, rubí, esmeralda, etc. | Público |
| `gemstone_carat` | Decimal | No | Quilates de gema principal | Público |
| `gemstone_cut` | String | No | Corte de la gema | Público |
| `gemstone_clarity` | String | No | Claridad (VVS, VS, SI, etc.) | Público |
| `gemstone_color` | String | No | Color de la gema | Público |
| `gemstones_additional` | JSONB | No | Gemas adicionales | Público |
| `chain_length_cm` | Decimal | Condicional | Largo de cadena (collares/pulseras) | Público |
| `chain_type` | String | No | Tipo de cadena | Público |
| `ring_size` | String | Condicional | Talla de anillo | Público |
| `clasp_type` | String | No | Tipo de cierre | Público |
| `hallmark` | String | No | Sello del fabricante | Público |
| `gemological_certificate` | Boolean | Sí | Certificado gemológico | Público |
| `gemological_certificate_url` | String | No | URL del certificado | **Interno** |
| `gemological_lab` | String | No | GIA, IGI, etc. | Público |
| `certificate_number` | String | No | Número de certificado | **Interno** |
| `appraisal_value` | Decimal | No | Valor de avalúo | **Interno** |
| `appraisal_date` | Date | No | Fecha de avalúo | **Interno** |

**Fotos requeridas para joyería:**
1. Principal (sobre fondo blanco)
2. Detalle frontal
3. Detalle trasero
4. Perfil
5. Sobre modelo/maniquí
6. Detalle de sello/hallmark
7. Detalle de gema (macro)
8. Con escala/regla
9. Certificado gemológico (privada)
10. Certificado de autenticidad (privada)
11-13. Accesorios incluidos

**Total: 8 públicas + 5 internas mínimo**

---

## 5. CAMPOS ESPECÍFICOS PARA ACCESORIOS

### Tabla: `product_accessories` (1:1 con products donde category='accesorios')

| Campo | Tipo | Requerido | Descripción | Público/Interno |
|-------|------|-----------|-------------|-----------------|
| `product_id` | UUID | Sí | FK a products | - |
| `accessory_type` | Enum | Sí | belt \| scarf \| wallet \| keychain \| sunglasses \| hat \| gloves \| other | Público |
| `material_primary` | String | Sí | Material principal | Público |
| `material_secondary` | String | No | Material secundario | Público |

### Subcampos por tipo

**Cinturones (`belt`):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `belt_length_cm` | Decimal | Largo total |
| `belt_width_cm` | Decimal | Ancho |
| `buckle_type` | String | Tipo de hebilla |
| `hardware_color` | Enum | Color de hardware |
| `holes_count` | Integer | Número de orificios |

**Bufandas/Pañuelos (`scarf`):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `scarf_length_cm` | Decimal | Largo |
| `scarf_width_cm` | Decimal | Ancho |
| `scarf_shape` | Enum | square \| rectangle \| triangle |
| `print_pattern` | String | Patrón/diseño |

**Carteras pequeñas (`wallet`):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `wallet_type` | Enum | bifold \| trifold \| cardholder \| zip_around |
| `card_slots` | Integer | Número de ranuras |
| `coin_pocket` | Boolean | Bolsillo para monedas |

**Lentes de sol (`sunglasses`):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `frame_material` | String | Material del armazón |
| `lens_color` | String | Color de lente |
| `uv_protection` | String | Protección UV |
| `polarized` | Boolean | Lentes polarizados |

**JSONB flexible:** `accessory_specs` para almacenar campos variables según tipo

**Fotos requeridas para accesorios:**
1. Principal (frontal)
2. Trasera/reverso
3. Lateral
4. Detalle de logo/marca
5. Sobre modelo (si aplica)
6. Con escala/referencia
7. Certificado de autenticidad (privada)
8-10. Accesorios incluidos

**Total: 6 públicas + 4 internas mínimo**

---

## 6. CONDICIÓN ESTANDARIZADA

### Enum `condition`

| Valor | Label ES | Label EN | Descripción | Descuento típico |
|-------|----------|----------|-------------|------------------|
| `new` | Nueva | New | Sin usar, con etiquetas originales | 0% |
| `excellent` | Excelente | Excellent | Usada 1-2 veces, sin signos de uso | 5-10% |
| `very_good` | Muy buena | Very Good | Uso ligero, pequeñas marcas invisibles a distancia | 15-20% |
| `good` | Buena | Good | Uso moderado, marcas visibles pero estructuralmente bien | 25-35% |
| `used` | Usada | Used | Uso evidente, marcas notorias, puede requerir restauración | 40-60% |

### Campo adicional: `condition_details`

**Estructura JSONB:**
```json
{
  "scratches": "minor|moderate|severe|none",
  "stains": "minor|moderate|severe|none",
  "hardware_wear": "pristine|light|moderate|heavy",
  "corners_edges": "pristine|light_wear|moderate_wear|heavy_wear",
  "interior_condition": "pristine|clean|marks|worn",
  "odor": "none|light|noticeable",
  "custom_notes": "string libre"
}
```

**Checklist de inspección por categoría:**
- Bolsas: esquinas, asas, forro, hardware, cremalleras, manchas
- Zapatos: suela, tacón, plantilla, forro, hardware
- Joyería: brillo, rayones, cierres, engastes
- Accesorios: material, costuras, hardware

---

## 7. AUTENTICIDAD Y CERTIFICADOS

### Campos en `products`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `authenticity_verified` | Boolean | Si fue autenticada |
| `authenticity_method` | Enum | expert \| certificate \| brand_store \| serial_verification |
| `authenticity_date` | Date | Fecha de autenticación |
| `authenticity_expert` | String | Nombre del experto/entidad |
| `authenticity_certificate_url` | String | URL del certificado (almacenamiento seguro) |
| `authenticity_notes` | Text | Notas internas sobre autenticación |

### Tabla: `product_certificates` (1:N con products)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | - |
| `product_id` | UUID | FK a products |
| `certificate_type` | Enum | authenticity \| gemological \| appraisal \| purchase_receipt |
| `issuer` | String | Entidad emisora |
| `certificate_number` | String | Número del certificado |
| `issue_date` | Date | Fecha de emisión |
| `file_url` | String | URL del archivo |
| `is_public` | Boolean | Si es visible para cliente |
| `created_at` | Timestamp | - |

**Almacenamiento seguro:**
- Certificados en bucket privado de Supabase Storage
- URLs firmadas con expiración para acceso temporal
- Backup en almacenamiento externo

**Verificación en checkout:**
- Mostrar badge "Autenticidad verificada"
- Link a certificado público (si `is_public=true`)
- Detalles del método de autenticación

---

## 8. ACCESORIOS INCLUIDOS

### Campos booleanos básicos (ya existen):
- `includes_box` - Caja original
- `includes_dust_bag` - Dust bag
- `includes_papers` - Documentos/tarjetas

### Campo JSONB: `includes_extras`

**Estructura:**
```json
{
  "items": [
    {
      "name": "Cadena larga",
      "type": "chain",
      "condition": "new|excellent|good",
      "notes": "Cadena dorada 120cm"
    },
    {
      "name": "Llave",
      "type": "key",
      "condition": "new",
      "notes": "Llave con charm"
    },
    {
      "name": "Twilly",
      "type": "scarf",
      "condition": "excellent",
      "notes": "Twilly Hermès original"
    }
  ],
  "missing": [
    {
      "name": "Tarjeta de autenticidad",
      "originally_included": true,
      "notes": "No incluida, pero artículo auténtico"
    }
  ]
}
```

**Tipos comunes de extras:**
- `chain` - Cadena/correa adicional
- `strap` - Correa intercambiable
- `key` - Llave (candado Kelly, etc.)
- `lock` - Candado
- `charm` - Charm/colgante
- `scarf` - Twilly/pañuelo
- `care_card` - Tarjeta de cuidados
- `receipt` - Recibo original
- `bag_insert` - Organizador interno
- `shoe_horn` - Calzador
- `heel_taps` - Protectores de tacón
- `insoles` - Plantillas adicionales
- `other` - Otro

**UI en admin:**
- Checkboxes para comunes (box, dust bag, papers)
- Dynamic form para agregar extras
- Indicador visual de qué falta vs qué se incluye

---

## 9. FOTOS REQUERIDAS POR CATEGORÍA

### Sistema de fotos profesional

**Tabla: `product_images` (ya existe, expandir)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | - |
| `product_id` | UUID | FK a products |
| `url` | String | URL de la imagen |
| `thumbnail_url` | String | Thumbnail optimizado |
| `position` | Integer | Orden de visualización |
| `is_primary` | Boolean | Foto principal |
| `category` | Enum | product \| detail \| certificate \| accessory \| condition |
| `view_angle` | Enum | front \| back \| side_right \| side_left \| top \| bottom \| interior \| detail |
| `is_public` | Boolean | Si es visible en tienda |
| `alt` | String | Alt text para SEO |
| `created_at` | Timestamp | - |

### Checklist por categoría

**Bolsas (mínimo 10 públicas):**
- ✅ Frontal (primary)
- ✅ Trasera
- ✅ Lateral derecha
- ✅ Lateral izquierda
- ✅ Superior (vista abierta)
- ✅ Interior
- ✅ Detalle hardware
- ✅ Detalle logo/sello
- ✅ Con modelo/en uso
- ✅ Esquinas/detalles de condición
- 🔒 Serial number (privada)
- 🔒 Certificado (privada)
- 🔒 Accesorios (privadas)

**Zapatos (mínimo 9 públicas):**
- ✅ Par frontal (primary)
- ✅ Lateral derecha
- ✅ Lateral izquierda
- ✅ Trasera
- ✅ Superior
- ✅ Suela derecha
- ✅ Suela izquierda
- ✅ Interior/etiqueta
- ✅ Detalle hardware
- 🔒 Certificado (privada)

**Joyería (mínimo 8 públicas):**
- ✅ Principal sobre fondo blanco (primary)
- ✅ Detalle frontal
- ✅ Detalle trasero
- ✅ Perfil
- ✅ Sobre modelo
- ✅ Detalle sello/hallmark
- ✅ Detalle gema (macro)
- ✅ Con escala
- 🔒 Certificado gemológico (privada)
- 🔒 Certificado autenticidad (privada)

**Accesorios (mínimo 6 públicas):**
- ✅ Principal frontal (primary)
- ✅ Trasera/reverso
- ✅ Lateral
- ✅ Detalle logo
- ✅ Sobre modelo (si aplica)
- ✅ Con escala
- 🔒 Certificado (privada)

### Validación de subida

**Reglas:**
1. Mínimo de fotos públicas según categoría
2. Foto principal (`is_primary=true`) obligatoria
3. Resolución mínima: 1200x1200px
4. Formatos: JPG, PNG, WebP
5. Peso máximo por foto: 5MB
6. Compresión automática y generación de thumbnails
7. Watermark en fotos públicas (opcional)

---

## 10. COSTOS INTERNOS Y RENTABILIDAD

### Campos de costo

| Campo | Tipo | Descripción | Privacidad |
|-------|------|-------------|-----------|
| `cost` | Decimal | Costo de adquisición | **Privado** |
| `cost_currency` | String | Moneda del costo | **Privado** |
| `cost_usd` | Decimal | Costo convertido a USD | **Privado** |
| `additional_costs` | JSONB | Costos adicionales | **Privado** |
| `total_cost` | Decimal | Costo total real | **Privado** |

### Estructura `additional_costs` (JSONB):

```json
{
  "shipping": 500,
  "import_taxes": 1200,
  "authentication_fee": 300,
  "restoration": 800,
  "photography": 200,
  "packaging": 100,
  "platform_fees": 250,
  "other": [
    {"concept": "Limpieza profesional", "amount": 400}
  ]
}
```

### Rentabilidad calculada

**Vista: `product_profitability` (SQL View)**

```sql
CREATE VIEW product_profitability AS
SELECT 
  p.id,
  p.slug,
  p.brand,
  p.title,
  p.price,
  p.currency,
  p.cost,
  p.total_cost,
  
  -- Margen absoluto
  (p.price - p.total_cost) as profit_absolute,
  
  -- Margen porcentual
  CASE 
    WHEN p.total_cost > 0 THEN 
      ((p.price - p.total_cost) / p.total_cost * 100)
    ELSE NULL 
  END as profit_percentage,
  
  -- ROI
  CASE 
    WHEN p.total_cost > 0 THEN 
      ((p.price - p.total_cost) / p.total_cost)
    ELSE NULL 
  END as roi,
  
  -- Status de rentabilidad
  CASE
    WHEN p.total_cost IS NULL THEN 'unknown'
    WHEN ((p.price - p.total_cost) / p.total_cost) >= 1.0 THEN 'excellent'  -- 100%+ ROI
    WHEN ((p.price - p.total_cost) / p.total_cost) >= 0.5 THEN 'good'       -- 50-100% ROI
    WHEN ((p.price - p.total_cost) / p.total_cost) >= 0.2 THEN 'fair'       -- 20-50% ROI
    ELSE 'low'                                                               -- <20% ROI
  END as profitability_status,
  
  p.status,
  p.is_published,
  p.created_at
FROM products p;
```

**Dashboard de rentabilidad:**
- Total invertido en inventario
- Valor total en venta
- Margen promedio
- ROI por categoría
- Artículos con bajo margen (alertas)
- Histórico de rentabilidad

---

## 11. PROVEEDOR / CONSIGNACIÓN / COMPRA PROPIA

### Enum `source`

| Valor | Label | Descripción |
|-------|-------|-------------|
| `owned` | Compra propia | Artículo comprado y propiedad de Bagclue |
| `consignment` | Consignación | Artículo en consignación (pago tras venta) |
| `supplier` | Proveedor | Artículo de proveedor externo |

### Campos relacionados

| Campo | Tipo | Requerido si | Descripción |
|-------|------|--------------|-------------|
| `source` | Enum | Siempre | Origen del artículo |
| `supplier_name` | String | source != owned | Nombre del proveedor/consignador |
| `supplier_contact` | String | source != owned | Email/teléfono |
| `supplier_contract_url` | String | source = consignment | URL del contrato |
| `consignment_percentage` | Decimal | source = consignment | % que recibe el consignador |
| `consignment_min_days` | Integer | source = consignment | Días mínimos de consignación |
| `consignment_expiry` | Date | source = consignment | Fecha de vencimiento del acuerdo |
| `purchase_invoice` | String | source = owned | Referencia de factura de compra |
| `purchase_receipt_url` | String | source = owned | URL del recibo de compra |

### Tabla: `suppliers` (catálogo de proveedores)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | - |
| `name` | String | Nombre del proveedor/consignador |
| `type` | Enum | consignor \| wholesaler \| individual |
| `contact_name` | String | Persona de contacto |
| `contact_email` | String | Email |
| `contact_phone` | String | Teléfono |
| `address` | Text | Dirección |
| `tax_id` | String | RFC/Tax ID |
| `bank_account` | String | Cuenta bancaria (encriptada) |
| `default_consignment_percentage` | Decimal | % estándar de consignación |
| `notes` | Text | Notas internas |
| `is_active` | Boolean | Activo/Inactivo |
| `created_at` | Timestamp | - |

### Lógica de pago en venta

**Cuando `source = consignment`:**
1. Al vender artículo, calcular pago al consignador:
   - `consignor_payment = (price - costs) * consignment_percentage / 100`
2. Registrar pendiente de pago en tabla `supplier_payments`
3. Dashboard de pagos pendientes
4. Marcar como pagado tras transferencia

**Tabla: `supplier_payments`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | - |
| `product_id` | UUID | Artículo vendido |
| `supplier_id` | UUID | Proveedor/consignador |
| `sale_amount` | Decimal | Monto de venta |
| `payment_amount` | Decimal | Monto a pagar |
| `payment_percentage` | Decimal | % del acuerdo |
| `payment_status` | Enum | pending \| paid \| cancelled |
| `payment_date` | Date | Fecha de pago |
| `payment_method` | String | Transferencia, efectivo, etc. |
| `payment_reference` | String | Referencia de transferencia |
| `notes` | Text | Notas |
| `created_at` | Timestamp | - |

---

## 12. PUBLICACIÓN EN TIENDA

### Control de visibilidad

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `is_published` | Boolean | Si está visible en tienda |
| `published_at` | Timestamp | Fecha de publicación |
| `unpublished_reason` | Enum | out_of_stock \| quality_issue \| pricing_review \| seasonal \| other |
| `scheduled_publish_at` | Timestamp | Publicación programada (futuro) |
| `scheduled_unpublish_at` | Timestamp | Des-publicación programada (futuro) |

### Validaciones pre-publicación

**Checklist automático:**
- ✅ Tiene título, marca, precio
- ✅ Tiene al menos 1 foto pública
- ✅ Tiene descripción (recomendado)
- ✅ Condición definida
- ✅ Autenticidad verificada
- ✅ Status = available o preorder
- ✅ Slug único generado

**Warnings (no bloquean publicación):**
- ⚠️ Faltan fotos recomendadas
- ⚠️ Descripción corta (<100 caracteres)
- ⚠️ Sin certificado de autenticidad
- ⚠️ Margen bajo (<20%)
- ⚠️ Precio fuera de rango típico de marca

### Estados de publicación

| Estado | `is_published` | `status` | Visible en tienda |
|--------|----------------|----------|-------------------|
| Borrador | false | - | No |
| Publicado disponible | true | available | Sí |
| Publicado pre-venta | true | preorder | Sí |
| Reservado | true | reserved | Visible pero no comprable |
| Vendido | false/true | sold | Depende (mostrar como "sold out") |
| Oculto | false | hidden | No |

### Publicación programada

**Casos de uso:**
- Lanzamiento de colección a fecha específica
- Des-publicación automática al final de temporada
- Publicación tras completar fotografía profesional

**Cron job:**
```sql
-- Cada hora, publicar artículos programados
UPDATE products 
SET is_published = true, 
    published_at = NOW()
WHERE scheduled_publish_at <= NOW() 
  AND is_published = false;

-- Des-publicar artículos programados
UPDATE products 
SET is_published = false
WHERE scheduled_unpublish_at <= NOW() 
  AND is_published = true;
```

---

## 13. SLUG AUTOMÁTICO

### Generación de slug

**Formato:**
```
{brand}-{model}-{title}-{color}-{id-short}
```

**Ejemplo:**
```
chanel-classic-flap-small-black-a3b2c1d4
```

**Función:**
```typescript
function generateSlug(product: {
  brand: string
  model?: string
  title: string
  color?: string
  id: string
}): string {
  const parts = [
    product.brand,
    product.model,
    product.title,
    product.color,
    product.id.slice(0, 8)
  ].filter(Boolean)
  
  return parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9-]/g, '-')     // Only alphanumeric and hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-|-$/g, '')            // Trim hyphens
}
```

### Unicidad garantizada

**Al crear producto:**
1. Generar slug base
2. Verificar si existe en DB
3. Si existe, agregar sufijo numérico: `-2`, `-3`, etc.
4. Guardar slug único

**Ejemplo con conflicto:**
```
chanel-classic-flap-small-black-a3b2c1d4  // Original
chanel-classic-flap-small-black-a3b2c1d4-2 // Si ya existe
```

### Regeneración de slug

**Cuándo regenerar:**
- Cambio de brand
- Cambio de model
- Cambio de title
- Cambio de color

**Proceso:**
1. Generar nuevo slug
2. Verificar unicidad
3. Crear redirect 301 de slug antiguo → slug nuevo
4. Actualizar producto

**Tabla: `slug_redirects`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | - |
| `old_slug` | String | Slug antiguo |
| `new_slug` | String | Slug nuevo |
| `product_id` | UUID | Producto |
| `created_at` | Timestamp | - |

### SEO considerations

- Slugs descriptivos mejoran SEO
- Mantener historial de slugs para no perder backlinks
- Implementar redirects 301
- Incluir palabras clave relevantes (marca, modelo, color)

---

## 14. SKU FUTURO

### Sistema de SKU estructurado

**Formato propuesto:**
```
{CAT}{BRAND}{YEAR}{SEQ}
```

**Ejemplo:**
```
BAG-CHA-26-0001  // Bolsa Chanel 2026 #0001
SHO-HER-26-0042  // Zapato Hermès 2026 #0042
JEW-CAR-26-0013  // Joyería Cartier 2026 #0013
ACC-LV-26-0007   // Accesorio Louis Vuitton 2026 #0007
```

### Componentes del SKU

**1. Categoría (3 letras):**
- `BAG` - Bolsas
- `SHO` - Zapatos
- `JEW` - Joyería
- `ACC` - Accesorios

**2. Marca (3 letras):**
- `CHA` - Chanel
- `HER` - Hermès
- `LV` - Louis Vuitton
- `GUC` - Gucci
- `PRA` - Prada
- `CAR` - Cartier
- `ROL` - Rolex
- `BUL` - Bulgari
- `TIF` - Tiffany
- `OTH` - Otras

**Tabla: `brand_codes`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `brand_name` | String | Nombre completo |
| `code` | String(3) | Código de 3 letras |
| `is_active` | Boolean | - |

**3. Año (2 dígitos):**
- Año de ingreso al inventario: `26`, `27`, etc.

**4. Secuencial (4 dígitos):**
- Contador por categoría y año: `0001`, `0002`, ...

### Generación automática de SKU

**Al crear producto:**
```typescript
async function generateSKU(product: {
  category: string
  brand: string
  created_at: Date
}): Promise<string> {
  // 1. Obtener código de categoría
  const catCode = CATEGORY_CODES[product.category] // BAG, SHO, etc.
  
  // 2. Obtener código de marca
  const brandCode = await getBrandCode(product.brand) // CHA, HER, etc.
  
  // 3. Año (2 dígitos)
  const year = product.created_at.getFullYear().toString().slice(-2)
  
  // 4. Siguiente secuencial para esta categoría/año
  const seq = await getNextSequential(catCode, year)
  const seqPadded = seq.toString().padStart(4, '0')
  
  return `${catCode}-${brandCode}-${year}-${seqPadded}`
}
```

### Unicidad y concurrencia

**Estrategia:**
1. Lock de base de datos al generar secuencial
2. Tabla `sku_sequences`:

```sql
CREATE TABLE sku_sequences (
  category VARCHAR(3) NOT NULL,
  year VARCHAR(2) NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category, year)
);
```

3. Transacción atómica:

```sql
BEGIN;
  -- Incrementar y obtener siguiente secuencial
  INSERT INTO sku_sequences (category, year, last_seq)
  VALUES ('BAG', '26', 1)
  ON CONFLICT (category, year) 
  DO UPDATE SET last_seq = sku_sequences.last_seq + 1
  RETURNING last_seq;
COMMIT;
```

### Búsqueda y filtrado

**Ventajas del SKU estructurado:**
- Filtrar por categoría: `BAG-*`
- Filtrar por marca: `*-CHA-*`
- Filtrar por año: `*-26-*`
- Ordenar cronológicamente por secuencial
- Identificación rápida en inventario físico

### Etiquetas y códigos de barras

**Generar:**
- Código de barras Code128 del SKU
- QR code que enlaza a `/admin/productos/{id}`
- Etiqueta imprimible con SKU + QR

**Uso:**
- Inventario físico
- Picking/packing
- Auditorías
- Fotografía (referencia en foto)

---

## 15. CAMPOS PÚBLICOS VS INTERNOS

### Clasificación completa

**🌐 PÚBLICOS (visibles en tienda):**

**Identificación:**
- id
- slug
- category

**Básicos:**
- brand
- title
- model
- color
- origin
- description

**Precio:**
- price
- currency

**Condición:**
- condition
- condition_notes
- condition_details (parcial, solo scratches/stains/hardware_wear)

**Autenticidad (solo indicadores):**
- authenticity_verified (boolean)
- authenticity_method (sin detalles internos)

**Accesorios:**
- includes_box
- includes_dust_bag
- includes_papers
- includes_extras (items, no missing)

**Especificaciones por categoría:**
- Todas las especificaciones técnicas (tallas, materiales, dimensiones, etc.)
- Campos como `serial_number`, `certificate_number` **NO** (internos)

**Estado:**
- status
- is_published
- badge

**Fotos:**
- Fotos donde `is_public = true`

---

**🔒 INTERNOS (solo admin):**

**Costos:**
- cost
- cost_currency
- cost_usd
- additional_costs
- total_cost
- Toda la vista `product_profitability`

**Procedencia:**
- source
- supplier_name
- supplier_contact
- supplier_contract_url
- consignment_percentage
- consignment_min_days
- consignment_expiry
- purchase_date
- purchase_invoice
- purchase_receipt_url

**Autenticidad (detalles):**
- authenticity_certificate_url
- authenticity_notes
- authenticity_expert
- authenticity_date
- certificate_number
- appraisal_value
- appraisal_date

**Identificadores internos:**
- sku
- serial_number (para bolsas)
- certificate_number (para joyería)

**Auditoría:**
- created_at
- updated_at
- created_by
- last_modified_by
- published_at
- unpublished_reason
- scheduled_publish_at
- scheduled_unpublish_at

**Fotos:**
- Fotos donde `is_public = false` (serial numbers, certificados, etc.)

---

## 16. ANÁLISIS DE TABLA `products` ACTUAL

### Schema actual (según `database.ts`):

```typescript
interface Product {
  id: string                    // ✅ OK
  slug: string                  // ✅ OK (mejorar generación)
  title: string                 // ✅ OK
  brand: string                 // ✅ OK
  model: string | null          // ✅ OK
  color: string | null          // ✅ OK
  origin: string | null         // ✅ OK
  status: ProductStatus         // ✅ OK (enum available/preorder/reserved/sold/hidden)
  condition: ProductCondition   // ✅ OK (enum new/excellent/very_good/good/used)
  price: number | null          // ✅ OK
  currency: string              // ✅ OK
  category: string              // ✅ OK (convertir a enum: bolsas|zapatos|joyeria|accesorios)
  badge: string | null          // ✅ OK
  description: string | null    // ✅ OK
  is_published: boolean         // ✅ OK
  includes_box: boolean         // ✅ OK
  includes_dust_bag: boolean    // ✅ OK
  includes_papers: boolean      // ✅ OK
  created_at: string            // ✅ OK
  updated_at: string            // ✅ OK
}
```

### ✅ Columnas que sirven (15/15):
- Todas las columnas actuales son útiles
- Estructura base bien diseñada

### ❌ Columnas que faltan (18 nuevas):

**Costos y rentabilidad:**
1. `cost` DECIMAL
2. `cost_currency` VARCHAR(3)
3. `cost_usd` DECIMAL (calculado)
4. `additional_costs` JSONB
5. `total_cost` DECIMAL (calculado)

**Procedencia:**
6. `source` ENUM('owned', 'consignment', 'supplier')
7. `supplier_id` UUID (FK a `suppliers`)
8. `consignment_percentage` DECIMAL
9. `consignment_expiry` DATE
10. `purchase_date` DATE
11. `purchase_invoice` VARCHAR

**Autenticidad:**
12. `authenticity_verified` BOOLEAN
13. `authenticity_method` ENUM
14. `authenticity_date` DATE
15. `authenticity_notes` TEXT

**Extras:**
16. `includes_extras` JSONB
17. `condition_details` JSONB

**Publicación:**
18. `published_at` TIMESTAMP
19. `scheduled_publish_at` TIMESTAMP
20. `scheduled_unpublish_at` TIMESTAMP
21. `unpublished_reason` ENUM

**SKU:**
22. `sku` VARCHAR(20) UNIQUE

**Auditoría:**
23. `created_by` UUID (FK a admin_users)
24. `last_modified_by` UUID (FK a admin_users)

**Total: 24 columnas nuevas**

---

## 17. COLUMNAS NUEVAS NECESARIAS EN `products`

### Migración SQL propuesta

```sql
-- Fase 1: Costos
ALTER TABLE products 
  ADD COLUMN cost DECIMAL(10,2),
  ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'MXN',
  ADD COLUMN cost_usd DECIMAL(10,2),
  ADD COLUMN additional_costs JSONB DEFAULT '{}',
  ADD COLUMN total_cost DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(cost, 0) + 
    COALESCE((additional_costs->>'total_extras')::DECIMAL, 0)
  ) STORED;

-- Fase 2: Procedencia
ALTER TABLE products
  ADD COLUMN source VARCHAR(20) DEFAULT 'owned' CHECK (source IN ('owned', 'consignment', 'supplier')),
  ADD COLUMN supplier_id UUID REFERENCES suppliers(id),
  ADD COLUMN consignment_percentage DECIMAL(5,2) CHECK (consignment_percentage >= 0 AND consignment_percentage <= 100),
  ADD COLUMN consignment_expiry DATE,
  ADD COLUMN purchase_date DATE,
  ADD COLUMN purchase_invoice VARCHAR(100);

-- Fase 3: Autenticidad
ALTER TABLE products
  ADD COLUMN authenticity_verified BOOLEAN DEFAULT false,
  ADD COLUMN authenticity_method VARCHAR(50) CHECK (authenticity_method IN ('expert', 'certificate', 'brand_store', 'serial_verification')),
  ADD COLUMN authenticity_date DATE,
  ADD COLUMN authenticity_notes TEXT;

-- Fase 4: Extras y condición
ALTER TABLE products
  ADD COLUMN includes_extras JSONB DEFAULT '{"items": [], "missing": []}',
  ADD COLUMN condition_details JSONB DEFAULT '{}';

-- Fase 5: Publicación
ALTER TABLE products
  ADD COLUMN published_at TIMESTAMP,
  ADD COLUMN scheduled_publish_at TIMESTAMP,
  ADD COLUMN scheduled_unpublish_at TIMESTAMP,
  ADD COLUMN unpublished_reason VARCHAR(50);

-- Fase 6: SKU
ALTER TABLE products
  ADD COLUMN sku VARCHAR(20) UNIQUE;

CREATE INDEX idx_products_sku ON products(sku);

-- Fase 7: Auditoría
ALTER TABLE products
  ADD COLUMN created_by UUID,
  ADD COLUMN last_modified_by UUID;

-- Fase 8: Enum para category (convertir string a enum)
ALTER TABLE products
  ALTER COLUMN category TYPE VARCHAR(20);
  
ALTER TABLE products
  ADD CONSTRAINT check_category CHECK (category IN ('bolsas', 'zapatos', 'joyeria', 'accesorios'));

-- Indices adicionales
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_authenticity ON products(authenticity_verified);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_published ON products(is_published, published_at);
CREATE INDEX idx_products_scheduled ON products(scheduled_publish_at, scheduled_unpublish_at);
```

### Valores por defecto para registros existentes

```sql
-- Marcar productos existentes como compra propia
UPDATE products SET source = 'owned' WHERE source IS NULL;

-- Marcar como autenticidad verificada (asumir que sí)
UPDATE products SET authenticity_verified = true WHERE authenticity_verified IS NULL;

-- Set published_at para productos ya publicados
UPDATE products SET published_at = created_at WHERE is_published = true AND published_at IS NULL;
```

---

## 18. TABLAS NUEVAS NECESARIAS

### Prioridad alta (MVP)

**1. `product_bags`**
```sql
CREATE TABLE product_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bag_type VARCHAR(20) NOT NULL CHECK (bag_type IN ('shoulder', 'crossbody', 'tote', 'clutch', 'backpack', 'bucket', 'hobo')),
  size_category VARCHAR(20) NOT NULL CHECK (size_category IN ('mini', 'small', 'medium', 'large', 'oversized')),
  dimensions_length_cm DECIMAL(5,1),
  dimensions_width_cm DECIMAL(5,1),
  dimensions_height_cm DECIMAL(5,1),
  strap_type VARCHAR(20) CHECK (strap_type IN ('removable', 'fixed', 'chain', 'none')),
  strap_length_cm DECIMAL(5,1),
  hardware_color VARCHAR(20),
  closure_type VARCHAR(20),
  interior_pockets INTEGER DEFAULT 0,
  exterior_pockets INTEGER DEFAULT 0,
  material_primary VARCHAR(100) NOT NULL,
  material_secondary VARCHAR(100),
  serial_number VARCHAR(100),
  production_year INTEGER,
  limited_edition BOOLEAN DEFAULT false,
  limited_edition_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX idx_product_bags_type ON product_bags(bag_type);
CREATE INDEX idx_product_bags_size ON product_bags(size_category);
CREATE INDEX idx_product_bags_serial ON product_bags(serial_number);
```

**2. `product_shoes`**
```sql
CREATE TABLE product_shoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shoe_type VARCHAR(20) NOT NULL CHECK (shoe_type IN ('pumps', 'flats', 'sandals', 'boots', 'sneakers', 'loafers', 'mules')),
  size_eu DECIMAL(3,1) NOT NULL,
  size_us DECIMAL(3,1),
  size_uk DECIMAL(3,1),
  heel_height_cm DECIMAL(4,1),
  heel_type VARCHAR(20),
  toe_shape VARCHAR(20),
  closure_type VARCHAR(20),
  material_upper VARCHAR(100) NOT NULL,
  material_sole VARCHAR(100),
  material_lining VARCHAR(100),
  hardware_color VARCHAR(20),
  embellishments JSONB DEFAULT '[]',
  insole_condition VARCHAR(20),
  sole_condition VARCHAR(20),
  includes_insoles BOOLEAN DEFAULT false,
  includes_heel_taps BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX idx_product_shoes_type ON product_shoes(shoe_type);
CREATE INDEX idx_product_shoes_size ON product_shoes(size_eu);
```

**3. `product_jewelry`**
```sql
CREATE TABLE product_jewelry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  jewelry_type VARCHAR(20) NOT NULL CHECK (jewelry_type IN ('necklace', 'bracelet', 'earrings', 'ring', 'brooch', 'watch')),
  metal_type VARCHAR(20) NOT NULL,
  metal_purity VARCHAR(10),
  metal_weight_grams DECIMAL(6,2),
  gemstone_primary VARCHAR(50),
  gemstone_carat DECIMAL(6,2),
  gemstone_cut VARCHAR(50),
  gemstone_clarity VARCHAR(10),
  gemstone_color VARCHAR(50),
  gemstones_additional JSONB DEFAULT '[]',
  chain_length_cm DECIMAL(5,1),
  chain_type VARCHAR(50),
  ring_size VARCHAR(10),
  clasp_type VARCHAR(50),
  hallmark VARCHAR(50),
  gemological_certificate BOOLEAN DEFAULT false,
  gemological_certificate_url TEXT,
  gemological_lab VARCHAR(50),
  certificate_number VARCHAR(100),
  appraisal_value DECIMAL(12,2),
  appraisal_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX idx_product_jewelry_type ON product_jewelry(jewelry_type);
CREATE INDEX idx_product_jewelry_metal ON product_jewelry(metal_type);
CREATE INDEX idx_product_jewelry_cert ON product_jewelry(gemological_certificate);
```

**4. `product_accessories`**
```sql
CREATE TABLE product_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accessory_type VARCHAR(20) NOT NULL CHECK (accessory_type IN ('belt', 'scarf', 'wallet', 'keychain', 'sunglasses', 'hat', 'gloves', 'other')),
  material_primary VARCHAR(100) NOT NULL,
  material_secondary VARCHAR(100),
  accessory_specs JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX idx_product_accessories_type ON product_accessories(accessory_type);
```

**5. `suppliers`**
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('consignor', 'wholesaler', 'individual')),
  contact_name VARCHAR(200),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  bank_account VARCHAR(100), -- Encriptar en aplicación
  default_consignment_percentage DECIMAL(5,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_type ON suppliers(type);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
```

**6. `product_certificates`**
```sql
CREATE TABLE product_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certificate_type VARCHAR(30) NOT NULL CHECK (certificate_type IN ('authenticity', 'gemological', 'appraisal', 'purchase_receipt')),
  issuer VARCHAR(200),
  certificate_number VARCHAR(100),
  issue_date DATE,
  file_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificates_product ON product_certificates(product_id);
CREATE INDEX idx_certificates_type ON product_certificates(certificate_type);
CREATE INDEX idx_certificates_public ON product_certificates(is_public);
```

---

### Prioridad media (Fase 2)

**7. `brand_codes`** (para SKU)
```sql
CREATE TABLE brand_codes (
  brand_name VARCHAR(100) PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed con marcas comunes
INSERT INTO brand_codes (brand_name, code) VALUES
  ('Chanel', 'CHA'),
  ('Hermès', 'HER'),
  ('Louis Vuitton', 'LV'),
  ('Gucci', 'GUC'),
  ('Prada', 'PRA'),
  ('Cartier', 'CAR'),
  ('Bulgari', 'BUL'),
  ('Tiffany & Co.', 'TIF'),
  ('Rolex', 'ROL'),
  ('Dior', 'DIO');
```

**8. `sku_sequences`** (para SKU)
```sql
CREATE TABLE sku_sequences (
  category VARCHAR(3) NOT NULL,
  year VARCHAR(2) NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category, year)
);
```

**9. `slug_redirects`** (para SEO)
```sql
CREATE TABLE slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug VARCHAR(200) NOT NULL,
  new_slug VARCHAR(200) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(old_slug)
);

CREATE INDEX idx_slug_redirects_old ON slug_redirects(old_slug);
```

**10. `supplier_payments`** (para consignación)
```sql
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  sale_amount DECIMAL(12,2) NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_percentage DECIMAL(5,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_supplier_payments_status ON supplier_payments(payment_status);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_product ON supplier_payments(product_id);
```

---

### Prioridad baja (Futuro)

**11. `product_history`** (auditoría de cambios)
```sql
CREATE TABLE product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('created', 'updated', 'published', 'unpublished', 'sold')),
  changes JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_history_product ON product_history(product_id);
CREATE INDEX idx_product_history_date ON product_history(created_at);
```

**12. `product_views`** (analytics)
```sql
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_date ON product_views(viewed_at);
```

---

## 19. PROPUESTA MVP (MÍNIMO PRODUCTO VIABLE)

### Fase MVP.1: Fundación (Semana 1)

**Objetivo:** Migrar columnas básicas y permitir creación mejorada

**Tareas:**
1. ✅ Migración SQL: agregar columnas a `products`:
   - Costos (cost, cost_currency, total_cost)
   - Procedencia (source, supplier_id básico)
   - Autenticidad (authenticity_verified, authenticity_notes)
   - Extras (includes_extras JSONB)
   - Publicación (published_at)
   - SKU (columna, sin auto-generación todavía)

2. ✅ Crear tabla `suppliers` básica

3. ✅ Crear tabla `product_certificates` básica

4. ✅ Actualizar UI de creación/edición:
   - Sección de costos (opcional)
   - Dropdown de procedencia (owned/consignment/supplier)
   - Checkbox autenticidad verificada
   - Campo notes de autenticidad
   - Inputs para extras incluidos (simplificado)

5. ✅ Mejorar generación de slug automática

6. ✅ Form validation mejorado

**Entregables:**
- Migración SQL ejecutada
- Form de producto con campos básicos ampliados
- Admin puede crear producto con costos y procedencia
- Build PASS, deploy OK

**Tiempo estimado:** 3-4 días

---

### Fase MVP.2: Especificaciones por categoría (Semana 2)

**Objetivo:** Tablas específicas y forms dinámicos

**Tareas:**
1. ✅ Crear 4 tablas:
   - `product_bags`
   - `product_shoes`
   - `product_jewelry`
   - `product_accessories`

2. ✅ Form de creación con tabs por categoría:
   - Tab "Información general" (campos comunes)
   - Tab "Especificaciones" (dinámico según categoría)
   - Tab "Costos" (interno)
   - Tab "Fotos" (upload múltiple)

3. ✅ Al seleccionar categoría, mostrar campos específicos

4. ✅ Validación por categoría (ej: bolsas requieren material_primary)

5. ✅ UI de vista de producto mostrando specs

**Entregables:**
- 4 tablas creadas
- Form dinámico por categoría
- Admin puede crear bolsa/zapato/joya/accesorio con todos los campos
- Vista pública muestra specs correctamente

**Tiempo estimado:** 5-6 días

---

### Fase MVP.3: Sistema de fotos profesional (Semana 3)

**Objetivo:** Upload múltiple, categorización, público/privado

**Tareas:**
1. ✅ Expandir `product_images`:
   - Columnas: category, view_angle, is_public
   - Validación de mínimos por categoría

2. ✅ UI de upload mejorada:
   - Drag & drop múltiple
   - Categorizar foto (product/detail/certificate/accessory)
   - Marcar ángulo (front/back/side/etc.)
   - Toggle público/privado
   - Reordenar con drag & drop
   - Preview en grid

3. ✅ Compresión automática y thumbnails (Supabase Functions o cliente)

4. ✅ Validación: "Faltan X fotos recomendadas" (warning, no bloqueante)

5. ✅ Galería en producto público (solo fotos `is_public=true`)

**Entregables:**
- Sistema de fotos completo
- Admin puede subir, categorizar, reordenar
- Validación de mínimos
- Galería pública funcional

**Tiempo estimado:** 4-5 días

---

### Fase MVP.4: Publicación y rentabilidad (Semana 4)

**Objetivo:** Control de publicación y dashboard de costos

**Tareas:**
1. ✅ Validaciones pre-publicación:
   - Checklist automático
   - Warnings (no bloqueantes)
   - Botón "Publicar" con confirmación

2. ✅ Estados de publicación claros en admin

3. ✅ Dashboard de rentabilidad:
   - Vista SQL `product_profitability`
   - Página `/admin/rentabilidad`
   - Métricas: inversión total, valor en venta, margen promedio
   - Lista de productos con margen bajo

4. ✅ Filtros en `/admin/productos`:
   - Por categoría
   - Por estado de publicación
   - Por procedencia (owned/consignment/supplier)
   - Por margen (bajo/bueno/excelente)

**Entregables:**
- Sistema de publicación completo
- Dashboard de rentabilidad funcional
- Admin puede ver costos y márgenes

**Tiempo estimado:** 3-4 días

---

### Post-MVP (Futuro, no incluir en MVP)

**Fase 2A: SKU automático**
- Sistema de generación automática
- Códigos de marca
- Secuenciales
- Etiquetas e impresión

**Fase 2B: Consignación avanzada**
- Contratos digitales
- Pagos programados
- Dashboard de consignadores
- Notificaciones de vencimiento

**Fase 2C: Certificados y autenticación**
- Upload de certificados
- Storage seguro
- URLs firmadas temporales
- Mostrar certificado público en producto

**Fase 2D: Analytics y vistas**
- Tracking de vistas
- Productos más vistos
- Conversión por categoría
- Tiempo promedio hasta venta

---

## 20. RIESGOS

### Riesgos técnicos

**1. Migración de datos existentes**
- **Riesgo:** Productos actuales no tienen costos, procedencia, etc.
- **Mitigación:** 
  - Valores por defecto razonables
  - Script de migración con rollback
  - Testing en staging primero
  - Admin puede actualizar después

**2. Complejidad del form dinámico**
- **Riesgo:** Form con tabs y campos dinámicos puede tener bugs
- **Mitigación:**
  - Implementar por fases (MVP.1 → MVP.2)
  - Testing exhaustivo por categoría
  - Validación robusta client + server
  - Guardar draft antes de validar

**3. Performance con muchas fotos**
- **Riesgo:** Upload de 10-15 fotos por producto puede ser lento
- **Mitigación:**
  - Compresión client-side antes de upload
  - Upload paralelo (5 a la vez)
  - Progress bar
  - Guardar producto sin fotos, agregar después
  - CDN para servir imágenes (Supabase Storage tiene CDN)

**4. Cálculos de rentabilidad incorrectos**
- **Riesgo:** Errores en fórmulas de margen/ROI
- **Mitigación:**
  - Tests unitarios de funciones de cálculo
  - Validación manual de casos test
  - Mostrar fórmula en UI (transparencia)
  - Admin puede override costo total si hay error

**5. Unicidad de SKU/slug**
- **Riesgo:** Colisiones al generar SKU o slug
- **Mitigación:**
  - Transacciones atómicas para secuenciales
  - Retry logic con sufijos incrementales
  - Índices UNIQUE en DB
  - Validación antes de commit

---

### Riesgos de negocio

**6. Complejidad de uso**
- **Riesgo:** Form muy largo/complejo desincentiva uso
- **Mitigación:**
  - Tabs y secciones colapsables
  - Campos opcionales marcados claramente
  - Solo mínimos requeridos para MVP
  - Tutorial/onboarding
  - "Guardar draft" para continuar después

**7. Datos sensibles (costos)**
- **Riesgo:** Leak de costos internos
- **Mitigación:**
  - RLS policies estrictas (solo admin_users)
  - Campos marcados como `INTERNAL` en frontend
  - Auditoría de quién accede a datos de costos
  - Encriptación de campos ultra-sensibles (bank_account)

**8. Consignación: disputas con proveedores**
- **Riesgo:** Desacuerdos en % de pago o condiciones
- **Mitigación:**
  - Contrato digital firmado (fase 2)
  - Log de todas las transacciones
  - Dashboard transparente para consignador
  - Sistema de aprobación de pagos
  - Registro de comunicaciones

**9. Certificados falsos**
- **Riesgo:** Subir certificado falso de autenticidad
- **Mitigación:**
  - Proceso de verificación por experto real
  - No confiar solo en certificado subido
  - Registrar quién verificó y cuándo
  - Política clara de autenticación
  - Responsabilidad legal definida

**10. Sobre-ingeniería en MVP**
- **Riesgo:** Querer implementar todo de golpe
- **Mitigación:**
  - Seguir plan MVP estricto (solo 4 fases)
  - Posponer SKU automático, analytics, etc.
  - Focus en funcionalidad core primero
  - Iterar basado en feedback real

---

### Riesgos operativos

**11. Training del equipo**
- **Riesgo:** Admin no sabe usar nuevo sistema
- **Mitigación:**
  - Video tutorial corto
  - Guía escrita paso a paso
  - Campos con tooltips explicativos
  - Soporte inicial hands-on

**12. Consistencia de datos**
- **Riesgo:** Algunos productos con specs, otros sin
- **Mitigación:**
  - Migración gradual OK
  - Filtro "productos incompletos"
  - Checklist de completitud
  - Priorizar productos más vendidos

**13. Tiempos de carga del producto**
- **Riesgo:** Crear producto toma mucho tiempo (specs + 15 fotos)
- **Mitigación:**
  - Guardar draft frecuente
  - No bloquear otras pestañas mientras sube fotos
  - Posibilidad de "crear básico" y "enriquecer después"
  - Bulk upload para múltiples productos similares (futuro)

---

## 21. ORDEN DE IMPLEMENTACIÓN

### Etapa 1: Preparación (Día 1)

**Tareas:**
- [ ] Backup completo de DB producción
- [ ] Crear branch `feature/admin-inventario`
- [ ] Setup de entorno de staging
- [ ] Aprobar scope final con Jhonatan

---

### Etapa 2: MVP.1 - Fundación (Días 2-5)

**Tareas:**
- [ ] Migración 001: Agregar columnas a `products`
- [ ] Migración 002: Crear tabla `suppliers`
- [ ] Migración 003: Crear tabla `product_certificates`
- [ ] Actualizar types en `database.ts`
- [ ] Form: Sección de costos (cost, cost_currency, additional_costs)
- [ ] Form: Dropdown procedencia (source)
- [ ] Form: Checkbox autenticidad + notes
- [ ] Form: Input extras incluidos (simplificado)
- [ ] Mejorar función de generación de slug
- [ ] Testing de form básico
- [ ] Deploy a staging
- [ ] QA manual
- [ ] Deploy a producción

**Criterios de cierre:**
- ✅ Migración ejecutada sin errores
- ✅ Admin puede crear producto con costos
- ✅ Admin puede seleccionar procedencia
- ✅ Slug se genera correctamente
- ✅ Build PASS
- ✅ No regression en productos existentes

---

### Etapa 3: MVP.2 - Especificaciones (Días 6-11)

**Tareas:**
- [ ] Migración 004: Crear tabla `product_bags`
- [ ] Migración 005: Crear tabla `product_shoes`
- [ ] Migración 006: Crear tabla `product_jewelry`
- [ ] Migración 007: Crear tabla `product_accessories`
- [ ] Actualizar types para 4 tablas
- [ ] UI: Convertir form a tabs (General, Specs, Costos, Fotos)
- [ ] UI: Form dinámico de specs según categoría seleccionada
- [ ] API: Endpoints para crear/actualizar specs por categoría
- [ ] Validación: Campos requeridos por categoría
- [ ] Vista pública: Mostrar specs en detalle de producto
- [ ] Testing por cada categoría (bolsas, zapatos, joyería, accesorios)
- [ ] Deploy a staging
- [ ] QA manual de cada categoría
- [ ] Deploy a producción

**Criterios de cierre:**
- ✅ 4 tablas creadas
- ✅ Form muestra campos correctos por categoría
- ✅ Admin puede crear producto completo (general + specs)
- ✅ Vista pública muestra specs
- ✅ Build PASS
- ✅ Validación funciona correctamente

---

### Etapa 4: MVP.3 - Fotos (Días 12-16)

**Tareas:**
- [ ] Migración 008: Expandir `product_images` (category, view_angle, is_public)
- [ ] Actualizar types de `ProductImage`
- [ ] UI: Upload múltiple con drag & drop
- [ ] UI: Categorizar foto al subir (product/detail/certificate/accessory)
- [ ] UI: Marcar ángulo (front/back/side/etc.)
- [ ] UI: Toggle público/privado por foto
- [ ] UI: Reordenar fotos con drag & drop
- [ ] UI: Preview en grid con opciones (delete, reorder, toggle public)
- [ ] Backend: Compresión automática (Supabase Function o client-side)
- [ ] Backend: Generación de thumbnails
- [ ] Validación: Warning si faltan fotos mínimas por categoría
- [ ] Vista pública: Galería solo con fotos `is_public=true`
- [ ] Testing de upload múltiple
- [ ] Deploy a staging
- [ ] QA manual de fotos
- [ ] Deploy a producción

**Criterios de cierre:**
- ✅ Admin puede subir múltiples fotos
- ✅ Admin puede categorizar y marcar ángulo
- ✅ Admin puede reordenar fotos
- ✅ Validación de mínimos funciona (warning, no bloqueante)
- ✅ Galería pública solo muestra fotos públicas
- ✅ Build PASS
- ✅ Performance aceptable (upload de 15 fotos <30s)

---

### Etapa 5: MVP.4 - Publicación y rentabilidad (Días 17-20)

**Tareas:**
- [ ] Vista SQL: `product_profitability`
- [ ] Backend: Checklist de validación pre-publicación
- [ ] UI: Botón "Publicar" con modal de confirmación
- [ ] UI: Checklist visual (✅ completos, ⚠️ warnings)
- [ ] UI: Estados de publicación claros (draft/published/hidden)
- [ ] Página: `/admin/rentabilidad` (dashboard)
- [ ] Dashboard: Métricas globales (inversión, valor en venta, margen promedio)
- [ ] Dashboard: Tabla de productos con margen, ROI, status
- [ ] Dashboard: Alertas de margen bajo
- [ ] Filtros: Actualizar `/admin/productos` con filtros avanzados
  - Por categoría
  - Por estado de publicación
  - Por procedencia
  - Por rango de margen
- [ ] Testing de flujo completo (crear → publicar → ver rentabilidad)
- [ ] Deploy a staging
- [ ] QA manual de publicación y dashboard
- [ ] Deploy a producción

**Criterios de cierre:**
- ✅ Admin puede publicar producto con validación
- ✅ Checklist pre-publicación funciona
- ✅ Dashboard de rentabilidad muestra métricas correctas
- ✅ Filtros de productos funcionan
- ✅ Build PASS
- ✅ Cálculos de margen/ROI son correctos

---

### Etapa 6: Testing final y documentación (Días 21-22)

**Tareas:**
- [ ] Testing E2E de flujo completo:
  - Crear producto de cada categoría
  - Subir fotos
  - Publicar
  - Ver en tienda
  - Verificar rentabilidad
- [ ] Documentación de usuario (admin):
  - Cómo crear producto
  - Cómo categorizar fotos
  - Cómo interpretar dashboard de rentabilidad
  - FAQ
- [ ] Video tutorial corto (5-10 min)
- [ ] Actualizar `MEMORY.md` con lecciones aprendidas
- [ ] Deploy final a producción
- [ ] Monitoring post-deploy (24h)
- [ ] Cierre de fase MVP

**Criterios de cierre:**
- ✅ Todos los flujos E2E funcionan
- ✅ Documentación completa
- ✅ Video tutorial grabado
- ✅ No hay bugs críticos en producción
- ✅ Admin puede usar sistema sin soporte

---

## RESUMEN EJECUTIVO

### Alcance total

**MVP (4 semanas):**
- 8 migraciones SQL
- 24 columnas nuevas en `products`
- 6 tablas nuevas (bags, shoes, jewelry, accessories, suppliers, certificates)
- Form de producto con tabs dinámicos
- Sistema de fotos profesional
- Dashboard de rentabilidad
- Validación pre-publicación

**Post-MVP (futuro):**
- SKU automático
- Consignación avanzada
- Analytics de producto
- Publicación programada
- Bulk upload

---

### Decisiones clave

1. **Categorías específicas:** 4 tablas separadas (bags, shoes, jewelry, accessories) para flexibilidad
2. **Costos privados:** Estrictamente internos, no exponer nunca al público
3. **Fotos mínimas:** Validación con warnings, no bloquea publicación
4. **Slug automático:** Generación en creación, regeneración opcional
5. **SKU pospuesto:** No en MVP, implementar en Fase 2
6. **Form incremental:** Tabs colapsables, guardar draft, no todo obligatorio
7. **Rentabilidad calculada:** Vista SQL para performance
8. **RLS estricto:** Admin-only para costos y datos internos

---

### Esfuerzo estimado

| Fase | Días | Complejidad | Riesgo |
|------|------|-------------|--------|
| MVP.1 Fundación | 3-4 | Media | Bajo |
| MVP.2 Especificaciones | 5-6 | Alta | Medio |
| MVP.3 Fotos | 4-5 | Alta | Medio |
| MVP.4 Publicación | 3-4 | Media | Bajo |
| Testing y docs | 2 | Baja | Bajo |
| **Total MVP** | **~20 días** | - | - |

---

### Próximos pasos

1. ⏳ **Aprobar scope** (Jhonatan)
2. ⏳ **Decidir prioridad vs otras tareas** (E2E testing de envíos, etc.)
3. ⏳ **Autorizar inicio de implementación**
4. ⏳ **Definir si hay ajustes al scope antes de empezar**

---

**SCOPE COMPLETO — PENDIENTE APROBACIÓN**

**No implementar hasta autorización explícita de Jhonatan.**
