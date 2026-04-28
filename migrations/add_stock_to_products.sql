-- Agregar columna stock a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 1;

-- Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Actualizar productos existentes (por defecto stock=1)
UPDATE products SET stock = 1 WHERE stock IS NULL;

-- Comentario: stock=0 significa sin inventario, stock=1 significa 1 unidad disponible
