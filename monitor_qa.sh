#!/bin/bash
# BAGCLUE QA MONITOR — Real-time DB checks
# Usage: ./monitor_qa.sh [orders|payment_transactions|product|all]

SUPABASE_URL="https://orhjnwpbzxyqtyrayvoi.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA"

PRODUCT_ID="0701ca2e-f575-4ea5-9100-444459516422"  # QA Pre-Live Flow Test

check_orders() {
  echo "=== ÚLTIMAS 3 ÓRDENES ==="
  curl -s "${SUPABASE_URL}/rest/v1/orders?select=id,created_at,status,payment_status,total,tracking_token&order=created_at.desc&limit=3" \
    -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" | python3 -m json.tool
}

check_payment_transactions() {
  echo "=== ÚLTIMAS 3 TRANSACCIONES ==="
  curl -s "${SUPABASE_URL}/rest/v1/payment_transactions?select=id,created_at,status,payment_method,amount,proof_url,rejection_reason&order=created_at.desc&limit=3" \
    -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" | python3 -m json.tool
}

check_product() {
  echo "=== PRODUCTO TEST (QA Pre-Live) ==="
  curl -s "${SUPABASE_URL}/rest/v1/products?id=eq.${PRODUCT_ID}&select=id,title,stock,status,price" \
    -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" | python3 -m json.tool
}

check_all() {
  check_product
  echo ""
  check_orders
  echo ""
  check_payment_transactions
}

case "$1" in
  orders)
    check_orders
    ;;
  payment_transactions)
    check_payment_transactions
    ;;
  product)
    check_product
    ;;
  all|"")
    check_all
    ;;
  *)
    echo "Usage: $0 [orders|payment_transactions|product|all]"
    exit 1
    ;;
esac
