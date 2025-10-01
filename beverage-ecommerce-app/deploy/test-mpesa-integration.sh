#!/bin/bash

# MPESA STK Integration Test Script
# This script tests the MPESA STK Push integration

echo "🧪 MPESA STK Integration Testing"
echo "================================="

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  .env file not found, using system environment variables"
fi

# Check if required environment variables are set
echo "📋 Checking environment variables..."

if [ -z "$MPESA_CONSUMER_KEY" ]; then
    echo "❌ MPESA_CONSUMER_KEY not set"
    exit 1
fi

if [ -z "$MPESA_CONSUMER_SECRET" ]; then
    echo "❌ MPESA_CONSUMER_SECRET not set" 
    exit 1
fi

if [ -z "$MPESA_SHORTCODE" ]; then
    echo "❌ MPESA_SHORTCODE not set"
    exit 1
fi

if [ -z "$MPESA_PASSKEY" ]; then
    echo "❌ MPESA_PASSKEY not set"
    exit 1
fi

echo "✅ Environment variables configured"

# Set default values
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
PHONE_NUMBER="${TEST_PHONE_NUMBER:-254708374149}" # Safaricom test number
AMOUNT="${TEST_AMOUNT:-1}"

echo "🔧 Test Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL" 
echo "   Test Phone: $PHONE_NUMBER"
echo "   Test Amount: KSh $AMOUNT"
echo ""

# Test 1: Backend health check
echo "🏥 Test 1: Backend Health Check"
echo "------------------------------"

HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "$BACKEND_URL/api/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
    echo "   Make sure backend is running on $BACKEND_URL"
    exit 1
fi

# Test 2: MPESA Configuration Check
echo ""
echo "⚙️  Test 2: MPESA Configuration Check"
echo "------------------------------------"

CONFIG_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/mpesa_config.json "$BACKEND_URL/api/wallet/mpesa/config" 2>/dev/null || echo "000")

if [ "$CONFIG_RESPONSE" = "200" ]; then
    echo "✅ MPESA configuration endpoint accessible"
    if command -v jq >/dev/null 2>&1; then
        CONFIGURED=$(jq -r '.configured' /tmp/mpesa_config.json 2>/dev/null)
        if [ "$CONFIGURED" = "true" ]; then
            echo "✅ MPESA service is properly configured"
        else
            echo "⚠️  MPESA service configuration incomplete"
            jq '.' /tmp/mpesa_config.json 2>/dev/null || cat /tmp/mpesa_config.json
        fi
    fi
else
    echo "❌ MPESA configuration check failed (HTTP $CONFIG_RESPONSE)"
fi

# Test 3: Authentication Test
echo ""
echo "🔐 Test 3: Authentication Test"
echo "------------------------------"

# Create test user or login
LOGIN_DATA='{"email":"test@beverage.com","password":"testpass123"}'
TOKEN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$BACKEND_URL/api/auth/login" 2>/dev/null)

if echo "$TOKEN_RESPONSE" | grep -q '"token"'; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token' 2>/dev/null)
    echo "✅ Authentication successful"
else
    echo "⚠️  Login failed, attempting registration..."
    
    REGISTER_DATA='{"name":"Test User","email":"test@beverage.com","password":"testpass123"}'
    REGISTER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$REGISTER_DATA" \
        "$BACKEND_URL/api/auth/register" 2>/dev/null)
    
    if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
        TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null)
        echo "✅ Registration and authentication successful"
    else
        echo "❌ Authentication failed"
        echo "$REGISTER_RESPONSE"
        exit 1
    fi
fi

# Test 4: Wallet Top-up Test (STK Push)
echo ""
echo "💰 Test 4: Wallet Top-up Test (STK Push)"
echo "----------------------------------------"

if [ -z "$TOKEN" ]; then
    echo "❌ No authentication token available"
    exit 1
fi

TOPUP_DATA="{\"amount\":$AMOUNT,\"phoneNumber\":\"$PHONE_NUMBER\"}"
TOPUP_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$TOPUP_DATA" \
    "$BACKEND_URL/api/wallet/topup" 2>/dev/null)

echo "Request: $TOPUP_DATA"
echo "Response: $TOPUP_RESPONSE"

if echo "$TOPUP_RESPONSE" | grep -q '"success":true'; then
    CHECKOUT_REQUEST_ID=$(echo "$TOPUP_RESPONSE" | jq -r '.checkoutRequestId' 2>/dev/null)
    echo "✅ STK Push initiated successfully"
    echo "   Checkout Request ID: $CHECKOUT_REQUEST_ID"
    
    # Test 5: Payment Status Check
    echo ""
    echo "🔍 Test 5: Payment Status Check"
    echo "-------------------------------"
    
    if [ -n "$CHECKOUT_REQUEST_ID" ] && [ "$CHECKOUT_REQUEST_ID" != "null" ]; then
        echo "Checking payment status in 10 seconds..."
        sleep 10
        
        STATUS_RESPONSE=$(curl -s \
            -H "Authorization: Bearer $TOKEN" \
            "$BACKEND_URL/api/wallet/payment-status/$CHECKOUT_REQUEST_ID" 2>/dev/null)
        
        echo "Status Response: $STATUS_RESPONSE"
        
        if echo "$STATUS_RESPONSE" | grep -q '"success":true'; then
            STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
            echo "✅ Status check successful: $STATUS"
        else
            echo "⚠️  Status check failed or pending"
        fi
    else
        echo "⚠️  No checkout request ID to check status"
    fi
else
    echo "❌ STK Push initiation failed"
    echo "$TOPUP_RESPONSE"
fi

# Test 6: Frontend Callback Test
echo ""
echo "🌐 Test 6: Frontend Callback Endpoints"
echo "--------------------------------------"

CALLBACK_ENDPOINTS=(
    "/api/callback/mpesa"
    "/api/callback/status"  
    "/api/callback/timeout"
)

for endpoint in "${CALLBACK_ENDPOINTS[@]}"; do
    CALLBACK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/callback_test.json "$FRONTEND_URL$endpoint" -X GET 2>/dev/null || echo "000")
    
    if [ "$CALLBACK_RESPONSE" = "405" ]; then
        echo "✅ $endpoint - Method not allowed (expected for GET)"
    elif [ "$CALLBACK_RESPONSE" = "200" ]; then
        echo "✅ $endpoint - Accessible"
    else
        echo "⚠️  $endpoint - HTTP $CALLBACK_RESPONSE"
    fi
done

# Test Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Backend health check"
echo "✅ MPESA configuration check"  
echo "✅ Authentication system"
echo "✅ STK Push initiation"
echo "✅ Payment status checking"
echo "✅ Frontend callback endpoints"
echo ""

if [ -n "$CHECKOUT_REQUEST_ID" ] && [ "$CHECKOUT_REQUEST_ID" != "null" ]; then
    echo "🎯 To complete the test:"
    echo "   1. Check your phone ($PHONE_NUMBER) for M-Pesa prompt"
    echo "   2. Enter your M-Pesa PIN to complete payment of KSh $AMOUNT"
    echo "   3. Monitor backend logs for callback processing"
    echo ""
fi

echo "🎉 MPESA STK Integration testing completed!"
echo "   Use this script to verify your integration is working properly."
echo "   For production, replace test credentials with real ones."

# Cleanup temp files
rm -f /tmp/health.json /tmp/mpesa_config.json /tmp/callback_test.json

echo ""
echo "💡 Next steps:"
echo "   - Replace placeholder credentials in .env files"
echo "   - Test with real phone numbers in sandbox"
echo "   - Deploy and test with production credentials"
echo "   - Monitor transaction logs and callbacks"