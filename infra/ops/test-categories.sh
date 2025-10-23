#!/usr/bin/env bash
set -euo pipefail

# Test Categories Functionality After Deployment
# This script tests all category-related functionality to ensure everything works

LOG_FILE="/var/log/category-tests.log"
timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { printf '%s %s\n' "$(timestamp)" "$*" | tee -a "$LOG_FILE"; }
section() { log "===== $* ====="; }

# Configuration
API_BASE="https://api.jeeey.com"
ADMIN_BASE="https://admin.jeeey.com"
MWEB_BASE="https://m.jeeey.com"
COOKIE_JAR="/tmp/category-test-cookies.txt"

# Test data
TEST_CATEGORY_NAME="Test Category $(date +%s)"
TEST_CATEGORY_SLUG="test-category-$(date +%s)"

section "Starting Category Functionality Tests"

# Clean up previous test data
rm -f "$COOKIE_JAR"

# Test 1: API Health Check
section "Test 1: API Health Check"
log "Testing API health endpoint..."
if curl -sS --max-time 10 "$API_BASE/health" | grep -q '"ok":true'; then
    log "✅ API health check passed"
else
    log "❌ API health check failed"
    exit 1
fi

# Test 2: Shop Categories API (for m.jeeey.com)
section "Test 2: Shop Categories API"
log "Testing shop categories endpoint with limit parameter..."
CATEGORIES_RESPONSE=$(curl -sS --max-time 10 "$API_BASE/api/categories?limit=15")
if echo "$CATEGORIES_RESPONSE" | grep -q '"categories"'; then
    log "✅ Shop categories API working"
    CATEGORIES_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '.categories | length' 2>/dev/null || echo "0")
    log "Found $CATEGORIES_COUNT categories"
else
    log "❌ Shop categories API failed"
    log "Response: $CATEGORIES_RESPONSE"
fi

# Test 3: Admin Login
section "Test 3: Admin Login"
log "Testing admin login..."
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@jeeey.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe123!}"

LOGIN_RESPONSE=$(curl -sS -c "$COOKIE_JAR" -X POST \
    -H 'content-type: application/x-www-form-urlencoded' \
    --data-urlencode "email=$ADMIN_EMAIL" \
    --data-urlencode "password=$ADMIN_PASSWORD" \
    "$API_BASE/api/admin/auth/login" 2>/dev/null || echo "")

if grep -q 'auth_token' "$COOKIE_JAR" 2>/dev/null; then
    log "✅ Admin login successful"
else
    log "❌ Admin login failed"
    log "Login response: $LOGIN_RESPONSE"
    # Try to continue with tests anyway
fi

# Test 4: Admin Categories List
section "Test 4: Admin Categories List"
log "Testing admin categories list..."
ADMIN_CATEGORIES_RESPONSE=$(curl -sS -b "$COOKIE_JAR" --max-time 10 "$API_BASE/api/admin/categories" 2>/dev/null || echo "")
if echo "$ADMIN_CATEGORIES_RESPONSE" | grep -q '"categories"'; then
    log "✅ Admin categories list working"
else
    log "❌ Admin categories list failed"
    log "Response: $ADMIN_CATEGORIES_RESPONSE"
fi

# Test 5: Create New Category
section "Test 5: Create New Category"
log "Testing category creation..."
CREATE_RESPONSE=$(curl -sS -b "$COOKIE_JAR" -X POST \
    -H 'content-type: application/json' \
    -d "{\"name\":\"$TEST_CATEGORY_NAME\",\"slug\":\"$TEST_CATEGORY_SLUG\",\"description\":\"Test category description\"}" \
    "$API_BASE/api/admin/categories" 2>/dev/null || echo "")

if echo "$CREATE_RESPONSE" | grep -q '"category"'; then
    log "✅ Category creation successful"
    CREATED_CATEGORY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.category.id' 2>/dev/null || echo "")
    log "Created category ID: $CREATED_CATEGORY_ID"
else
    log "❌ Category creation failed"
    log "Response: $CREATE_RESPONSE"
fi

# Test 6: Media Upload (if category was created)
if [ -n "$CREATED_CATEGORY_ID" ]; then
    section "Test 6: Media Upload"
    log "Testing media upload functionality..."
    
    # Create a simple test image (1x1 pixel PNG)
    TEST_IMAGE_BASE64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    MEDIA_RESPONSE=$(curl -sS -b "$COOKIE_JAR" -X POST \
        -H 'content-type: application/json' \
        -d "{\"base64\":\"$TEST_IMAGE_BASE64\",\"type\":\"image/png\"}" \
        "$API_BASE/api/admin/media" 2>/dev/null || echo "")
    
    if echo "$MEDIA_RESPONSE" | grep -q '"asset"'; then
        log "✅ Media upload successful"
        UPLOADED_URL=$(echo "$MEDIA_RESPONSE" | jq -r '.asset.url' 2>/dev/null || echo "")
        log "Uploaded media URL: $UPLOADED_URL"
    else
        log "❌ Media upload failed"
        log "Response: $MEDIA_RESPONSE"
    fi
fi

# Test 7: Update Category with Image
if [ -n "$CREATED_CATEGORY_ID" ] && [ -n "$UPLOADED_URL" ]; then
    section "Test 7: Update Category with Image"
    log "Testing category update with image..."
    
    UPDATE_RESPONSE=$(curl -sS -b "$COOKIE_JAR" -X PATCH \
        -H 'content-type: application/json' \
        -d "{\"name\":\"$TEST_CATEGORY_NAME (Updated)\",\"image\":\"$UPLOADED_URL\"}" \
        "$API_BASE/api/admin/categories/$CREATED_CATEGORY_ID" 2>/dev/null || echo "")
    
    if echo "$UPDATE_RESPONSE" | grep -q '"category"'; then
        log "✅ Category update successful"
    else
        log "❌ Category update failed"
        log "Response: $UPDATE_RESPONSE"
    fi
fi

# Test 8: Mobile Web Categories
section "Test 8: Mobile Web Categories"
log "Testing mobile web categories endpoint..."
MWEB_CATEGORIES_RESPONSE=$(curl -sS --max-time 10 "$MWEB_BASE" 2>/dev/null || echo "")
if echo "$MWEB_CATEGORIES_RESPONSE" | grep -q 'categories'; then
    log "✅ Mobile web categories loading"
else
    log "❌ Mobile web categories failed"
fi

# Test 9: Categories Tree
section "Test 9: Categories Tree"
log "Testing categories tree endpoint..."
TREE_RESPONSE=$(curl -sS -b "$COOKIE_JAR" --max-time 10 "$API_BASE/api/admin/categories/tree" 2>/dev/null || echo "")
if echo "$TREE_RESPONSE" | grep -q '"tree"'; then
    log "✅ Categories tree working"
else
    log "❌ Categories tree failed"
    log "Response: $TREE_RESPONSE"
fi

# Test 10: Cleanup - Delete Test Category
if [ -n "$CREATED_CATEGORY_ID" ]; then
    section "Test 10: Cleanup"
    log "Cleaning up test category..."
    
    DELETE_RESPONSE=$(curl -sS -b "$COOKIE_JAR" -X POST \
        -H 'content-type: application/json' \
        -d "{\"ids\":[\"$CREATED_CATEGORY_ID\"]}" \
        "$API_BASE/api/admin/categories/bulk-delete" 2>/dev/null || echo "")
    
    if echo "$DELETE_RESPONSE" | grep -q '"ok":true'; then
        log "✅ Test category cleanup successful"
    else
        log "❌ Test category cleanup failed"
        log "Response: $DELETE_RESPONSE"
    fi
fi

# Test 11: Performance Test
section "Test 11: Performance Test"
log "Testing API response times..."

# Test shop categories performance
SHOP_START=$(date +%s%3N)
curl -sS --max-time 5 "$API_BASE/api/categories?limit=50" >/dev/null 2>&1
SHOP_END=$(date +%s%3N)
SHOP_TIME=$((SHOP_END - SHOP_START))

if [ "$SHOP_TIME" -lt 2000 ]; then
    log "✅ Shop categories API performance good (${SHOP_TIME}ms)"
else
    log "⚠️ Shop categories API slow (${SHOP_TIME}ms)"
fi

# Test admin categories performance
ADMIN_START=$(date +%s%3N)
curl -sS -b "$COOKIE_JAR" --max-time 5 "$API_BASE/api/admin/categories" >/dev/null 2>&1
ADMIN_END=$(date +%s%3N)
ADMIN_TIME=$((ADMIN_END - ADMIN_START))

if [ "$ADMIN_TIME" -lt 3000 ]; then
    log "✅ Admin categories API performance good (${ADMIN_TIME}ms)"
else
    log "⚠️ Admin categories API slow (${ADMIN_TIME}ms)"
fi

# Final Summary
section "Test Summary"
log "Category functionality tests completed"
log "Check $LOG_FILE for detailed results"

# Check for any critical failures
if grep -q "❌" "$LOG_FILE"; then
    log "⚠️ Some tests failed - check the log above"
    exit 1
else
    log "✅ All tests passed successfully!"
    exit 0
fi