-- Migración: Agregar tracking y shipping info a orders
-- Fecha: 2026-04-29
-- Fase 4A: Order Tracking MVP

-- Agregar campos de tracking y shipping
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Generar tracking_token para órdenes existentes (UUID sin guiones)
UPDATE orders 
SET tracking_token = REPLACE(gen_random_uuid()::TEXT, '-', '') 
WHERE tracking_token IS NULL;

-- Comentarios
COMMENT ON COLUMN orders.tracking_token IS 'Token único para acceso público a tracking (32 caracteres alfanuméricos)';
COMMENT ON COLUMN orders.shipping_status IS 'pending, preparing, shipped, delivered';
COMMENT ON COLUMN orders.shipping_provider IS 'dhl, fedex, null';
COMMENT ON COLUMN orders.customer_phone IS 'Teléfono del cliente';
COMMENT ON COLUMN orders.shipping_address IS 'Dirección de envío completa (texto libre)';
COMMENT ON COLUMN orders.tracking_number IS 'Número de guía de rastreo';
COMMENT ON COLUMN orders.tracking_url IS 'URL de rastreo (DHL, FedEx, etc.)';
COMMENT ON COLUMN orders.shipped_at IS 'Fecha en que se envió el pedido';
COMMENT ON COLUMN orders.delivered_at IS 'Fecha en que se entregó el pedido';
