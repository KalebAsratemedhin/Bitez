#!/bin/bash

# Quick test script for Bitez microservices

echo "🧪 Testing Bitez Microservices..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

echo "1. Testing API Gateway Health..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ API Gateway is healthy${NC}"
else
    echo -e "${RED}✗ API Gateway health check failed (HTTP $response)${NC}"
fi

echo ""
echo "2. Testing Restaurants Service (via Gateway)..."
response=$(curl -s $BASE_URL/api/restaurants/restaurants)
if echo "$response" | grep -q "restaurants"; then
    echo -e "${GREEN}✓ Restaurants service is accessible${NC}"
    echo "   Response: $(echo $response | jq -r '.count // "N/A"') restaurants"
else
    echo -e "${RED}✗ Restaurants service failed${NC}"
fi

echo ""
echo "3. Testing Users Service (via Gateway)..."
response=$(curl -s $BASE_URL/api/users/users)
if echo "$response" | grep -q "users"; then
    echo -e "${GREEN}✓ Users service is accessible${NC}"
    echo "   Response: $(echo $response | jq -r '.count // "N/A"') users"
else
    echo -e "${RED}✗ Users service failed${NC}"
fi

echo ""
echo "4. Testing Direct Service Access..."
restaurants_direct=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
users_direct=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health)

if [ "$restaurants_direct" = "200" ]; then
    echo -e "${GREEN}✓ Restaurants service (direct) is healthy${NC}"
else
    echo -e "${RED}✗ Restaurants service (direct) failed${NC}"
fi

if [ "$users_direct" = "200" ]; then
    echo -e "${GREEN}✓ Users service (direct) is healthy${NC}"
else
    echo -e "${RED}✗ Users service (direct) failed${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Test Summary:${NC}"
echo "   - API Gateway: http://localhost:8080"
echo "   - Restaurants: http://localhost:8000"
echo "   - Users: http://localhost:8001"
echo "   - RabbitMQ UI: http://localhost:15672"
echo ""
echo "Try these commands:"
echo "   curl $BASE_URL/api/restaurants/restaurants"
echo "   curl $BASE_URL/api/users/users"
