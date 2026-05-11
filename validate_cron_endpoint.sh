#!/bin/bash
#
# CRON Endpoint Validation Script
# Tests endpoint with Authorization header
#
# Usage: CRON_SECRET=your_secret bash validate_cron_endpoint.sh
#
# SECURITY: This script does NOT print the CRON_SECRET value
#

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not provided"
  echo ""
  echo "Usage: CRON_SECRET=your_secret bash validate_cron_endpoint.sh"
  echo ""
  exit 1
fi

echo "========================================"
echo "CRON ENDPOINT VALIDATION"
echo "========================================"
echo ""
echo "Testing: https://bagclue.vercel.app/api/cron/welcome-email"
echo ""

# Test with Authorization
echo "[Test] With Authorization header..."
RESPONSE=$(curl -s -w "\n%{http_code}" https://bagclue.vercel.app/api/cron/welcome-email \
  -H "Authorization: Bearer $CRON_SECRET")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Validate
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PASS: HTTP 200"
  
  # Check if success=true
  SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ PASS: success=true"
    
    TOTAL=$(echo "$BODY" | jq -r '.results.total' 2>/dev/null)
    SENT=$(echo "$BODY" | jq -r '.results.sent' 2>/dev/null)
    FAILED=$(echo "$BODY" | jq -r '.results.failed' 2>/dev/null)
    
    echo "   - Total: $TOTAL"
    echo "   - Sent: $SENT"
    echo "   - Failed: $FAILED"
    
    if [ "$TOTAL" = "0" ]; then
      echo "✅ PASS: No pending emails (expected after backfill)"
    fi
  else
    echo "⚠️  WARNING: success=$SUCCESS"
  fi
else
  echo "❌ FAIL: Expected HTTP 200, got $HTTP_CODE"
fi

echo ""
echo "========================================"
echo "⚠️  SECURITY CHECK"
echo "========================================"
echo ""
echo "CRON_SECRET was NOT printed in this output ✅"
echo ""
echo "Next: Check Vercel logs to confirm:"
echo "- Execution logged"
echo "- NO secrets exposed in logs"
echo ""
