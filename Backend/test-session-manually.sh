#!/bin/bash

# Manual Session Test Script
# This script tests the multi-device session logic

API_URL="${API_URL:-http://localhost:4000}"
EMAIL="${TEST_EMAIL:-test@example.com}"
PASSWORD="${TEST_PASSWORD:-password123}"

echo "======================================"
echo "Multi-Device Session Test"
echo "======================================"
echo ""
echo "API URL: $API_URL"
echo "Test Email: $EMAIL"
echo ""

# Test 1: Login from Device A (Laptop)
echo "📱 Step 1: Login from Device A (Laptop)..."
DEVICE_A_RESPONSE=$(curl -s -c device_a_cookies.txt -X POST "$API_URL/api/student/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$DEVICE_A_RESPONSE" | grep -q "success.*true"; then
  echo "✅ Device A login successful"
  echo "Response: $DEVICE_A_RESPONSE" | jq '.'
else
  echo "❌ Device A login failed"
  echo "Response: $DEVICE_A_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo "🔍 Step 2: Check Device A session..."
DEVICE_A_SESSION=$(curl -s -b device_a_cookies.txt "$API_URL/api/student/debug/session")
echo "Device A Session Info:"
echo "$DEVICE_A_SESSION" | jq '.'

DEVICE_A_JWT_SESSION=$(echo "$DEVICE_A_SESSION" | jq -r '.data.jwtSessionToken')
DEVICE_A_DB_SESSION=$(echo "$DEVICE_A_SESSION" | jq -r '.data.dbSessionToken')

echo ""
echo "Device A JWT Session: $DEVICE_A_JWT_SESSION"
echo "Device A DB Session:  $DEVICE_A_DB_SESSION"

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

# Test 2: Login from Device B (Mobile)
echo ""
echo "📱 Step 3: Login from Device B (Mobile) - SAME USER..."
DEVICE_B_RESPONSE=$(curl -s -c device_b_cookies.txt -X POST "$API_URL/api/student/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$DEVICE_B_RESPONSE" | grep -q "success.*true"; then
  echo "✅ Device B login successful"
  echo "Response: $DEVICE_B_RESPONSE" | jq '.'
else
  echo "❌ Device B login failed"
  echo "Response: $DEVICE_B_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo "🔍 Step 4: Check Device B session..."
DEVICE_B_SESSION=$(curl -s -b device_b_cookies.txt "$API_URL/api/student/debug/session")
echo "Device B Session Info:"
echo "$DEVICE_B_SESSION" | jq '.'

DEVICE_B_JWT_SESSION=$(echo "$DEVICE_B_SESSION" | jq -r '.data.jwtSessionToken')
DEVICE_B_DB_SESSION=$(echo "$DEVICE_B_SESSION" | jq -r '.data.dbSessionToken')

echo ""
echo "Device B JWT Session: $DEVICE_B_JWT_SESSION"
echo "Device B DB Session:  $DEVICE_B_DB_SESSION"

# Test 3: Try accessing from Device A (should fail)
echo ""
echo "======================================"
echo "🧪 CRITICAL TEST: Access from Device A"
echo "======================================"
echo ""
echo "Expected: 401 Unauthorized (session expired)"
echo ""

DEVICE_A_ACCESS=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -b device_a_cookies.txt "$API_URL/api/student/enrollments/my-enrollments")

HTTP_STATUS=$(echo "$DEVICE_A_ACCESS" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$DEVICE_A_ACCESS" | grep -v "HTTP_STATUS")

echo "HTTP Status: $HTTP_STATUS"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.'

echo ""
if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ TEST PASSED - Device A was correctly rejected!"
  echo ""
  echo "Session validation is working correctly."
  echo "Only one device can be logged in at a time."
else
  echo "❌ TEST FAILED - Device A should have been rejected but got $HTTP_STATUS"
  echo ""
  echo "Session validation is NOT working!"
  echo ""
  echo "Debug Info:"
  echo "  Device A JWT Session: $DEVICE_A_JWT_SESSION"
  echo "  Device B JWT Session: $DEVICE_B_JWT_SESSION"
  echo "  DB Session (current):  $DEVICE_B_DB_SESSION"
  echo ""
  echo "These should NOT match if session validation is working."
  echo ""
  echo "Check backend logs for session validation messages."
fi

# Test 4: Verify Device B still works
echo ""
echo "🧪 Verify Device B still has access..."
DEVICE_B_ACCESS=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -b device_b_cookies.txt "$API_URL/api/student/enrollments/my-enrollments")

HTTP_STATUS=$(echo "$DEVICE_B_ACCESS" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$DEVICE_B_ACCESS" | grep -v "HTTP_STATUS")

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Device B has access (correct)"
else
  echo "❌ Device B doesn't have access (should work!)"
fi

# Cleanup
echo ""
echo "======================================"
echo "Cleaning up..."
echo "======================================"
rm -f device_a_cookies.txt device_b_cookies.txt

echo ""
echo "Test complete!"
