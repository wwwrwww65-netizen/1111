#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "--- Starting Cache Debug Check ---"

# 1. Check Service Worker Content (Frontend)
# We expect the new SW to contain "cleanup" or "skipWaiting" immediately
check_sw() {
  URL=$1
  NAME=$2
  echo -n "Checking $NAME SW ($URL)... "
  
  CONTENT=$(curl -s "$URL")
  if echo "$CONTENT" | grep -q "cleanup"; then
    echo -e "${GREEN}OK (Cleanup version detected)${NC}"
  elif echo "$CONTENT" | grep -q "skipWaiting"; then
    echo -e "${GREEN}OK (skipWaiting detected)${NC}"
  else
    echo -e "${RED}WARNING: Old Service Worker might still be active${NC}"
    echo "Sample content: $(echo "$CONTENT" | head -n 1)"
  fi
}

# 2. Check API Headers (Backend)
# We expect Cache-Control: no-store
check_api() {
  URL=$1
  NAME=$2
  echo -n "Checking $NAME Headers ($URL)... "
  
  HEADERS=$(curl -s -I "$URL")
  if echo "$HEADERS" | grep -i -q "no-store"; then
    echo -e "${GREEN}OK (no-store header found)${NC}"
  else
    echo -e "${RED}WARNING: Cache headers might be allowing caching${NC}"
    echo "Cache-Control: $(echo "$HEADERS" | grep -i "Cache-Control")"
  fi
}

# Run Checks
# Adjust domains if you are testing locally (e.g., localhost:3000)
BASE_DOMAIN="jeeey.com"
API_DOMAIN="api.jeeey.com"

echo "--- 1. Service Workers ---"
check_sw "https://$BASE_DOMAIN/sw.js" "Web"
check_sw "https://m.$BASE_DOMAIN/sw.js" "Mobile Web"
check_sw "https://admin.$BASE_DOMAIN/sw.js" "Admin"

echo ""
echo "--- 2. API Endpoints ---"
# Test a product endpoint which usually gets cached
check_api "https://$API_DOMAIN/product/1" "Product Detail"
# Test a public config endpoint
check_api "https://$API_DOMAIN/public/theme/config" "Theme Config"

echo ""
echo "--- Check Complete ---"

