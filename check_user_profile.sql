SELECT 
  id,
  user_id,
  email,
  full_name,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_since_creation
FROM customer_profiles
WHERE email = 'densestore@gmail.com'
ORDER BY created_at DESC;
