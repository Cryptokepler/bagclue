-- Create test order for Fase 5B validation
-- Run this in Supabase SQL Editor to create a test order

-- Step 1: Get the user_id from customer_profiles
-- Expected: 9b37d6cc-3ceb-4f8f-925b-c5e0ba3e79f8

-- Step 2: Get a product_id from products table
-- This will use the first available product

-- Step 3: Create the test order
INSERT INTO orders (
  customer_name,
  customer_email,
  user_id,
  subtotal,
  shipping,
  total,
  status,
  payment_status,
  tracking_token,
  tracking_number,
  shipping_status,
  shipping_provider,
  shipping_address
)
SELECT
  'Jhonatan Venegas',
  'jhonatanvenegas@usdtcapital.es',
  cp.user_id,
  15000,
  0,
  15000,
  'confirmed',
  'paid',
  encode(gen_random_bytes(16), 'hex'),
  'DHL1234567890',
  'delivered',
  'dhl',
  'Calle Test 123, Ciudad de México, México'
FROM customer_profiles cp
WHERE cp.email = 'jhonatanvenegas@usdtcapital.es'
LIMIT 1
RETURNING id, tracking_token;

-- Copy the returned order ID and tracking_token for next step

-- Step 4: Create order items (replace ORDER_ID_HERE with the ID from Step 3)
/*
INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  subtotal,
  product_snapshot
)
SELECT
  'ORDER_ID_HERE'::uuid,
  p.id,
  1,
  15000,
  15000,
  jsonb_build_object(
    'title', p.title,
    'brand', p.brand,
    'model', p.model,
    'color', p.color,
    'price', 15000,
    'currency', 'MXN',
    'slug', p.slug
  )
FROM products p
WHERE p.is_published = true
LIMIT 1;
*/

-- After running both queries, you should have:
-- 1. A test order visible in /account/orders
-- 2. Order detail accessible at /account/orders/[ORDER_ID]
-- 3. Tracking page accessible at /track/[TRACKING_TOKEN]
