#!/bin/bash
# TEST 1 - Step 1: Create test product via production API

echo "Creating test product via API..."
echo ""

# Product payload
PAYLOAD='{
  "title": "QA Bank Transfer Test",
  "brand": "Chanel",
  "model": "Bank Transfer",
  "color": "Test",
  "origin": "Test",
  "material": "Test",
  "status": "available",
  "condition": "new",
  "category": "Bolsas",
  "price": 20,
  "currency": "MXN",
  "stock": 1,
  "is_published": true,
  "description": "Producto test para QA de transferencia bancaria. NO es producto real.",
  "authenticity_verified": false,
  "allow_layaway": false
}'

echo "Note: This requires admin authentication."
echo "Run this manually from browser console or with valid session cookie."
echo ""
echo "Payload:"
echo "$PAYLOAD"
echo ""
echo "Endpoint: POST https://bagclue.vercel.app/api/products/create"
