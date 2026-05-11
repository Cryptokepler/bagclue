SELECT 
  id,
  name,
  slug,
  price,
  stock,
  status,
  is_published,
  brand,
  category
FROM products
WHERE is_published = true
ORDER BY created_at DESC;
