-- Migration 013: Create layaways system
-- Date: 2026-04-30
-- Purpose: Sistema de apartado con depósito y plazo

-- 1. Add layaway fields to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS allow_layaway BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS layaway_deposit_percent NUMERIC(5,2) DEFAULT 20.00;

COMMENT ON COLUMN products.allow_layaway IS 'Si el producto permite apartado';
COMMENT ON COLUMN products.layaway_deposit_percent IS 'Porcentaje de depósito requerido (default 20%)';

-- 2. Add layaway_id to orders (for traceability)
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS layaway_id UUID;

-- 3. Create layaways table
CREATE TABLE IF NOT EXISTS layaways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product relation
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Amounts
  product_price NUMERIC(10, 2) NOT NULL,
  deposit_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  balance_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  
  -- Stripe payments
  deposit_session_id TEXT,
  deposit_payment_intent_id TEXT,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  
  balance_session_id TEXT,
  balance_payment_intent_id TEXT,
  balance_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and dates
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  layaway_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Admin fields
  notes TEXT,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  
  -- Final order (when completed)
  order_id UUID REFERENCES orders(id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_layaways_status ON layaways(status);
CREATE INDEX IF NOT EXISTS idx_layaways_expires_at ON layaways(expires_at);
CREATE INDEX IF NOT EXISTS idx_layaways_product_id ON layaways(product_id);
CREATE INDEX IF NOT EXISTS idx_layaways_token ON layaways(layaway_token);
CREATE INDEX IF NOT EXISTS idx_layaways_customer_email ON layaways(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_layaway_id ON orders(layaway_id);

-- 5. Comments
COMMENT ON TABLE layaways IS 'Sistema de apartado con depósito inicial y plazo de pago';
COMMENT ON COLUMN layaways.status IS 'pending=esperando depósito, active=apartado activo, completed=saldo pagado, expired=venció plazo, cancelled=cancelado manual';
COMMENT ON COLUMN layaways.deposit_percent IS 'Porcentaje del depósito (copiado de products al crear)';
COMMENT ON COLUMN layaways.layaway_token IS 'Token único para /layaway/[token]';
COMMENT ON COLUMN layaways.cancelled_by IS 'admin, system, o customer';
