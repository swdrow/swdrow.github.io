/**
 * RowCast Data Mapping Configuration
 * Centralizes all element IDs and API field mappings
 */

const DATA_CONFIG = {
    // API endpoints
    endpoints: {
        complete: '/api/complete',
        water: '/api/water/current',
        weather: '/api/weather/current', 
        rowcast: '/api/rowcast'
    },
    
    // Element mappings: API field -> HTML element IDs
    mappings: {
        // RowCast Score
        rowcastScore: {
            rowcastScore: ['rowcast-score', 'dashboard-score'],
            fill: ['score-fill', 'dashboard-score-fill'],
            timestamp: ['score-timestamp', 'last-updated']
        },
        
        // Water Data
        water: {
            discharge: ['R-Discharge', 'water-flow', 'current-discharge', 'current-flow'],
            gaugeHeight: ['R-Height', 'water-level', 'current-water-level', 'current-gauge-height'],
            waterTemp: ['R-Temp', 'water-temp', 'current-water-temp']
        },
        
        // Weather/Wind Data
        weather: {
            windSpeed: ['R-WindSpeed', 'wind-speed', 'current-wind-speed', 'main-wind-speed', 'current-wind'],
            windGust: ['R-Gusts', 'wind-gust', 'current-wind-gust'],
            windDir: ['R-Direction', 'wind-direction', 'current-wind-direction'],
            currentTemp: ['air-temp', 'current-air-temp', 'weather-temp', 'current-temp'],
            apparentTemp: ['feels-like', 'apparent-temp'],
            precipitation: ['precipitation', 'current-precipitation'],
            uvIndex: ['uv-index', 'current-uv'],
            visibility: ['visibility', 'current-visibility']
        },
        
        // Timestamp/Status
        status: {
            timestamp: ['data-timestamp', 'last-updated-time'],
            status: ['connection-status', 'api-status']
        },
        
        // Widget Data Sections
        widgets: {
            usgsData: ['usgs-data'],
            tideData: ['tide-data'], 
            uvAirData: ['uv-air-data'],
            weatherAlerts: ['weather-alerts'],
            tempPrecipData: ['temp-precip-data'],
            visibilityData: ['visibility-data'],
            hourlyForecast: ['hourly-forecast']
        }
    },
    
    // Data formatting functions
    formatters: {
        discharge: (value) => `${Math.round(value)} ft³/s`,
        gaugeHeight: (value) => `${value.toFixed(1)} ft`,
        waterTemp: (value) => `${Math.round(value)}°F`,
        windSpeed: (value) => `${Math.round(value)} mph`,
        windGust: (value) => `${Math.round(value)} mph`,
        windDir: (value) => value,
        currentTemp: (value) => `${Math.round(value)}°F`,
        apparentTemp: (value) => `${Math.round(value)}°F`,
        precipitation: (value) => `${value.toFixed(1)} in`,
        uvIndex: (value) => Math.round(value),
        visibility: (value) => `${(value / 1609.34).toFixed(1)} mi`, // Convert meters to miles
        rowcastScore: (value) => value.toFixed(1),
        timestamp: (value) => new Date(value).toLocaleString()
    },
    
    // Score color coding
    scoreColors: {
        excellent: { min: 8, color: '#28a745', label: 'Excellent' },
        good: { min: 6, color: '#17a2b8', label: 'Good' },
        fair: { min: 4, color: '#ffc107', label: 'Fair' },
        poor: { min: 0, color: '#dc3545', label: 'Poor' }
    }
};

// Export for use in main application
window.DATA_CONFIG = DATA_CONFIG;
