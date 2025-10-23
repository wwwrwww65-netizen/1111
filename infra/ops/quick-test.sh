#!/usr/bin/env bash
# Quick test script for categories functionality
# Usage: ./quick-test.sh

set -euo pipefail

API_BASE="https://api.jeeey.com"
ADMIN_BASE="https://admin.jeeey.com"
MWEB_BASE="https://m.jeeey.com"

echo "🧪 Quick Categories Test"
echo "========================"

# Test 1: API Health
echo "1. Testing API health..."
if curl -sS --max-time 5 "$API_BASE/health" | grep -q '"ok":true'; then
    echo "   ✅ API is healthy"
else
    echo "   ❌ API health check failed"
    exit 1
fi

# Test 2: Shop Categories
echo "2. Testing shop categories..."
SHOP_RESPONSE=$(curl -sS --max-time 5 "$API_BASE/api/categories?limit=5" 2>/dev/null || echo "")
if echo "$SHOP_RESPONSE" | grep -q '"categories"'; then
    echo "   ✅ Shop categories working"
else
    echo "   ❌ Shop categories failed"
    echo "   Response: $SHOP_RESPONSE"
fi

# Test 3: Admin Categories (basic connectivity)
echo "3. Testing admin categories..."
ADMIN_RESPONSE=$(curl -sS --max-time 5 "$API_BASE/api/admin/categories" 2>/dev/null || echo "")
if echo "$ADMIN_RESPONSE" | grep -q '"categories"'; then
    echo "   ✅ Admin categories working"
else
    echo "   ❌ Admin categories failed"
    echo "   Response: $ADMIN_RESPONSE"
fi

# Test 4: Mobile Web
echo "4. Testing mobile web..."
if curl -sS --max-time 5 "$MWEB_BASE" | grep -q 'categories'; then
    echo "   ✅ Mobile web loading"
else
    echo "   ❌ Mobile web failed"
fi

echo ""
echo "🎉 Quick test completed!"
echo "For detailed tests, run: ./infra/ops/test-categories.sh"