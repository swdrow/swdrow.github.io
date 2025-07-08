#!/bin/bash

echo "🚀 RowCast Website Validation & Data Population Test"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test API connectivity
echo -e "\n${BLUE}1. Testing API Connectivity${NC}"
echo "----------------------------"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/complete)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API server responding (HTTP $API_STATUS)${NC}"
else
    echo -e "${RED}❌ API server not responding (HTTP $API_STATUS)${NC}"
    exit 1
fi

# Test API data structure
echo -e "\n${BLUE}2. Testing API Data Structure${NC}"
echo "------------------------------"

API_DATA=$(curl -s http://localhost:5000/api/complete)
CURRENT_SCORE=$(echo "$API_DATA" | jq -r '.current.rowcastScore' 2>/dev/null)
CURRENT_TEMP=$(echo "$API_DATA" | jq -r '.current.weather.currentTemp' 2>/dev/null)
CURRENT_WIND=$(echo "$API_DATA" | jq -r '.current.weather.windSpeed' 2>/dev/null)
CURRENT_FLOW=$(echo "$API_DATA" | jq -r '.current.water.discharge' 2>/dev/null)

if [ "$CURRENT_SCORE" != "null" ] && [ "$CURRENT_SCORE" != "" ]; then
    echo -e "${GREEN}✅ RowCast Score: $CURRENT_SCORE${NC}"
else
    echo -e "${RED}❌ RowCast Score missing${NC}"
fi

if [ "$CURRENT_TEMP" != "null" ] && [ "$CURRENT_TEMP" != "" ]; then
    echo -e "${GREEN}✅ Temperature: ${CURRENT_TEMP}°F${NC}"
else
    echo -e "${RED}❌ Temperature missing${NC}"
fi

if [ "$CURRENT_WIND" != "null" ] && [ "$CURRENT_WIND" != "" ]; then
    echo -e "${GREEN}✅ Wind Speed: ${CURRENT_WIND} mph${NC}"
else
    echo -e "${RED}❌ Wind Speed missing${NC}"
fi

if [ "$CURRENT_FLOW" != "null" ] && [ "$CURRENT_FLOW" != "" ]; then
    echo -e "${GREEN}✅ Water Flow: ${CURRENT_FLOW} cfs${NC}"
else
    echo -e "${RED}❌ Water Flow missing${NC}"
fi

# Test website accessibility
echo -e "\n${BLUE}3. Testing Website Accessibility${NC}"
echo "--------------------------------"

WEBSITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173)
if [ "$WEBSITE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website accessible (HTTP $WEBSITE_STATUS)${NC}"
else
    echo -e "${RED}❌ Website not accessible (HTTP $WEBSITE_STATUS)${NC}"
fi

# Test JavaScript file
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/js/app-tailwind.js)
if [ "$JS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ JavaScript file accessible${NC}"
else
    echo -e "${RED}❌ JavaScript file not accessible (HTTP $JS_STATUS)${NC}"
fi

# Test required elements in HTML
echo -e "\n${BLUE}4. Testing HTML Element Structure${NC}"
echo "---------------------------------"

HTML_CONTENT=$(curl -s http://localhost:4173)

REQUIRED_ELEMENTS=("currentScore" "currentTemp" "currentWind" "currentFlow" "weatherTemp" "feelsLike" "dashboardScore")

for element in "${REQUIRED_ELEMENTS[@]}"; do
    if echo "$HTML_CONTENT" | grep -q "id=\"$element\""; then
        echo -e "${GREEN}✅ Element found: $element${NC}"
    else
        echo -e "${RED}❌ Element missing: $element${NC}"
    fi
done

# Test navigation elements
NAV_ELEMENTS=("home" "weather" "dashboard" "api")
echo -e "\n${BLUE}5. Testing Navigation Structure${NC}"
echo "-------------------------------"

for page in "${NAV_ELEMENTS[@]}"; do
    if echo "$HTML_CONTENT" | grep -q "data-page=\"$page\""; then
        echo -e "${GREEN}✅ Navigation link found: $page${NC}"
    else
        echo -e "${RED}❌ Navigation link missing: $page${NC}"
    fi
    
    if echo "$HTML_CONTENT" | grep -q "id=\"$page\""; then
        echo -e "${GREEN}✅ Page section found: $page${NC}"
    else
        echo -e "${RED}❌ Page section missing: $page${NC}"
    fi
done

# Summary
echo -e "\n${BLUE}6. Test Summary${NC}"
echo "---------------"

echo -e "${YELLOW}Expected data population:${NC}"
echo "• RowCast Score: $(echo "$API_DATA" | jq -r '(.current.rowcastScore * 100 | round)'  2>/dev/null)%"
echo "• Temperature: ${CURRENT_TEMP}°F"
echo "• Wind Speed: ${CURRENT_WIND} mph"
echo "• Water Flow: ${CURRENT_FLOW} cfs"

echo -e "\n${YELLOW}Manual Verification Steps:${NC}"
echo "1. Open http://localhost:4173 in your browser"
echo "2. Check if data values above are displayed (not '--' placeholders)"
echo "3. Test navigation between Home, Weather, Dashboard, and API pages"
echo "4. Open browser console (F12) and run: debugRowCast()"
echo "5. Verify no JavaScript errors in console"

echo -e "\n${YELLOW}If data is not populating:${NC}"
echo "1. Check browser console for errors"
echo "2. Verify API server is running: bash api/scripts/server-status.sh"
echo "3. Test API directly: curl http://localhost:5000/api/complete | jq ."

echo -e "\n${GREEN}🎉 Validation complete! Please verify manually in browser.${NC}"
