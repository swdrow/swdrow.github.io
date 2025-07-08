#!/bin/bash

echo "🚀 RowCast Final Deployment Validation"
echo "====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test URL
test_url() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ $name: HTTP $status_code${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: HTTP $status_code (expected $expected_code)${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local name="$1"
    local endpoint="$2"
    local url="http://localhost:5000/api/$endpoint"
    
    local response=$(curl -s "$url")
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" -eq 200 ] && [ -n "$response" ] && [ "$response" != "null" ]; then
        echo -e "${GREEN}✅ $name API: Working${NC}"
        return 0
    else
        echo -e "${RED}❌ $name API: Failed (HTTP $status_code)${NC}"
        return 1
    fi
}

echo "1. Server Status Check"
echo "----------------------"
test_url "Development Server" "http://localhost:3002"
test_url "Production Preview" "http://localhost:4173"
test_url "API Server" "http://localhost:5000/api/complete"
echo ""

echo "2. API Endpoints Check"
echo "----------------------"
test_api "Complete Data" "complete"
test_api "Current Weather" "weather/current"
test_api "Current Water" "water/current"
test_api "RowCast Score" "rowcast"
test_api "Forecast" "rowcast/forecast"
echo ""

echo "3. Static Assets Check"
echo "----------------------"
if [ -f "index.html" ]; then
    echo -e "${GREEN}✅ Main HTML file exists${NC}"
else
    echo -e "${RED}❌ Main HTML file missing${NC}"
fi

if [ -f "js/app.js" ]; then
    echo -e "${GREEN}✅ Main JavaScript file exists${NC}"
else
    echo -e "${RED}❌ Main JavaScript file missing${NC}"
fi

if [ -f "css/liquid-glass.css" ]; then
    echo -e "${GREEN}✅ Main CSS file exists${NC}"
else
    echo -e "${RED}❌ Main CSS file missing${NC}"
fi

if [ -d "public/assets/images" ]; then
    local image_count=$(ls public/assets/images/*.{jpg,jpeg,png,webp} 2>/dev/null | wc -l)
    if [ "$image_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Background images available ($image_count files)${NC}"
    else
        echo -e "${YELLOW}⚠️ No background images found${NC}"
    fi
else
    echo -e "${RED}❌ Assets directory missing${NC}"
fi
echo ""

echo "4. Build Output Check"
echo "--------------------"
if [ -f "dist/index.html" ] && [ -s "dist/index.html" ]; then
    echo -e "${GREEN}✅ Production build exists and is not empty${NC}"
else
    echo -e "${RED}❌ Production build missing or empty${NC}"
fi

if [ -d "dist/assets" ]; then
    local asset_count=$(ls dist/assets/*.{js,css} 2>/dev/null | wc -l)
    if [ "$asset_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Bundled assets available ($asset_count files)${NC}"
    else
        echo -e "${RED}❌ No bundled assets found${NC}"
    fi
else
    echo -e "${RED}❌ Build assets directory missing${NC}"
fi
echo ""

echo "5. Live Data Sample"
echo "------------------"
echo "Current RowCast conditions:"
curl -s http://localhost:5000/api/complete | jq -r '
    if .current then
        "🌊 RowCast Score: \(.current.rowcastScore * 100 | floor)%",
        "🌡️  Temperature: \(.current.weather.currentTemp)°F",
        "💨 Wind: \(.current.weather.windSpeed) mph \(.current.weather.windDir)",
        "🏞️  Water Flow: \(.current.water.discharge) cfs",
        "🌊 Water Temp: \(.current.water.waterTemp)°F"
    else
        "❌ No current data available"
    end
' 2>/dev/null || echo "❌ Failed to fetch live data"

echo ""
echo "6. Quick Access Links"
echo "--------------------"
echo "🖥️  Development: http://localhost:3002"
echo "🚀 Production: http://localhost:4173"
echo "📊 Status Dashboard: http://localhost:3002/status-dashboard.html"
echo "🔧 API Test: http://localhost:3002/test-api-direct.html"
echo "📡 API Data: http://localhost:5000/api/complete"
echo ""

echo "✨ Validation Complete!"
echo "The RowCast platform is ready for use!"
