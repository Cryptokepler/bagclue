#!/bin/bash
# QA Helper Script - Shipping Proof MVP
# Validaciones DB rápidas durante QA manual

SUPABASE_URL="https://orhjnwpbzxyqtyrayvoi.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 SHIPPING PROOF MVP - QA HELPER"
echo "=================================="
echo ""

# Función: Validar shipping proof de una orden
validate_proof() {
  local order_id="$1"
  
  if [ -z "$order_id" ]; then
    echo -e "${RED}❌ Error: Order ID required${NC}"
    echo "Usage: $0 proof <order_id>"
    exit 1
  fi
  
  echo "📋 Validando shipping proof para orden: ${order_id:0:8}...${order_id: -4}"
  echo ""
  
  response=$(curl -s "${SUPABASE_URL}/rest/v1/orders?select=id,shipping_status,tracking_number,shipping_provider,shipping_proof_url,shipping_proof_file_name,shipping_proof_file_type,shipping_proof_file_size,shipping_proof_uploaded_at&id=eq.${order_id}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}")
  
  # Check if response is empty
  count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
  if [ "$count" -eq 0 ]; then
    echo -e "${RED}❌ Order not found${NC}"
    exit 1
  fi
  
  # Extract fields using python3
  proof_url=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_proof_url', 'null') if data else 'null')")
  proof_name=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_proof_file_name', 'null') if data else 'null')")
  proof_type=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_proof_file_type', 'null') if data else 'null')")
  proof_size=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_proof_file_size', 0) if data else 0)")
  proof_uploaded=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_proof_uploaded_at', 'null') if data else 'null')")
  shipping_status=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_status', 'null') if data else 'null')")
  tracking_number=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('tracking_number', 'null') if data else 'null')")
  shipping_provider=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('shipping_provider', 'null') if data else 'null')")
  
  # Validar campos
  echo "Shipping Status: $shipping_status"
  echo "Tracking Number: $tracking_number"
  echo "Shipping Provider: $shipping_provider"
  echo ""
  
  if [ "$proof_url" != "null" ]; then
    echo -e "${GREEN}✅ Shipping proof EXISTS${NC}"
    echo "  File name: $proof_name"
    echo "  File type: $proof_type"
    echo "  File size: $(echo "scale=2; $proof_size / 1024" | bc) KB"
    echo "  Uploaded: $proof_uploaded"
    echo "  URL: ${proof_url:0:50}... (truncated)"
  else
    echo -e "${YELLOW}⚠️  No shipping proof uploaded${NC}"
  fi
}

# Función: Listar órdenes disponibles para QA
list_orders() {
  echo "📋 Órdenes disponibles para QA:"
  echo ""
  
  response=$(curl -s "${SUPABASE_URL}/rest/v1/orders?select=id,status,payment_status,total,tracking_token,shipping_proof_url&order=created_at.desc&limit=5" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}")
  
  echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for order in data:
    order_id = order['id']
    proof = '✅ YES' if order.get('shipping_proof_url') else '❌ NO'
    print(f\"  Order: {order_id[:8]}...{order_id[-4:]} | Status: {order['status']} | Payment: {order['payment_status']} | Total: \${order['total']} | Proof: {proof}\")
"
}

# Función: Validar tracking page
validate_tracking() {
  local tracking_token="$1"
  
  if [ -z "$tracking_token" ]; then
    echo -e "${RED}❌ Error: Tracking token required${NC}"
    echo "Usage: $0 tracking <tracking_token>"
    exit 1
  fi
  
  echo "🔍 Validando tracking page para token: ${tracking_token:0:8}...${tracking_token: -4}"
  echo ""
  
  response=$(curl -s "https://bagclue.vercel.app/api/orders/track/${tracking_token}")
  
  # Check for error
  has_error=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print('yes' if 'error' in data else 'no')")
  if [ "$has_error" = "yes" ]; then
    error_msg=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))")
    echo -e "${RED}❌ Error: ${error_msg}${NC}"
    exit 1
  fi
  
  proof_url=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('shipping_proof_url', 'null'))")
  proof_name=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('shipping_proof_file_name', 'null'))")
  order_id=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('id', 'unknown'))")
  shipping_status=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('shipping_status', 'null'))")
  tracking_num=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('tracking_number', 'null'))")
  
  echo "Order ID: ${order_id:0:8}..."
  echo "Shipping Status: $shipping_status"
  echo "Tracking Number: $tracking_num"
  echo ""
  
  if [ "$proof_url" != "null" ]; then
    echo -e "${GREEN}✅ Proof available in tracking API${NC}"
    echo "  File name: $proof_name"
  else
    echo -e "${YELLOW}⚠️  No proof in tracking API${NC}"
  fi
}

# Main
case "$1" in
  proof)
    validate_proof "$2"
    ;;
  tracking)
    validate_tracking "$2"
    ;;
  list)
    list_orders
    ;;
  *)
    echo "Usage: $0 {proof|tracking|list} [order_id|tracking_token]"
    echo ""
    echo "Commands:"
    echo "  list              - List orders available for QA"
    echo "  proof <order_id>  - Validate shipping proof for order"
    echo "  tracking <token>  - Validate tracking page API"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 proof 57faad17-94b5-4ec0-a428-320059469335"
    echo "  $0 tracking 9a888a29615a94b9f9ac468220b2a7a2"
    exit 1
    ;;
esac
