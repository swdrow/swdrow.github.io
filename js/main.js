/**
 * RowCast - Unified Main Application Script
 * Completely overhauled data mapping and assignment system
 * Last updated: 2025-07-04
 */

// ===== CORE APPLICATION CLASS =====
class RowCastApp {
    constructor() {
        this.baseURL = this.determineAPIBaseURL();
        this.currentData = {};
        this.isLoading = false;
        this.updateInterval = null;
        this.contentCache = {};
        
        console.log('🚣 RowCast App initialized with API base:', this.baseURL);
        this.init();
    }

    determineAPIBaseURL() {
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        const currentProtocol = window.location.protocol;
        
        console.log('🌐 Environment Detection:', {
            host: currentHost,
            port: currentPort,
            protocol: currentProtocol,
            href: window.location.href
        });
        
        // For development, skip environment variable check and use port detection
        const isDevelopment = currentHost === 'localhost' || currentHost === '127.0.0.1';
        const isViteDev = ['3000', '3001', '3002', '4173'].includes(currentPort);
        
        if (isDevelopment && isViteDev) {
            // Vite dev server with proxy - use relative URLs
            console.log('🔧 Using Vite dev server with proxy (port', currentPort, ')');
            return '';
        } else if (isDevelopment) {
            // Static server or direct Flask - use direct connection
            console.log('🔧 Using direct Flask connection');
            return 'http://localhost:5000';
        } else {
            // Production fallback
            console.log('🔧 Using production fallback');
            return 'https://your-api-domain.com';
        }
    }

    async init() {
        this.setupWindowResize();
        this.setupTabNavigation();
        this.setupDashboardNavigation();
        await this.loadAllData();
        this.startDataRefresh();
        
        // Initialize default tab
        const defaultTab = document.getElementById('defaultOpen');
        if (defaultTab) defaultTab.click();
        
        console.log('✅ RowCast App initialization complete');
        
        // Debug data mapping
        setTimeout(() => this.debugDataMapping(), 1000);
    }

    // ===== WINDOW & LAYOUT =====
    setupWindowResize() {
        const windowH = () => {
            const wH = $(window).height();
            $('.tabcontent').css({ height: wH });
        };
        
        windowH();
        $(window).resize(windowH);
    }

    // ===== TAB NAVIGATION =====
    setupTabNavigation() {
        window.openPage = (pageName, elmnt, color) => {
            // Hide all tab content
            const tabcontent = document.getElementsByClassName('tabcontent');
            for (let i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = 'none';
            }

            // Reset all tab button colors
            const tablinks = document.getElementsByClassName('tablink');
            for (let i = 0; i < tablinks.length; i++) {
                tablinks[i].style.backgroundColor = '';
            }

            // Show selected tab and set button color
            const targetPage = document.getElementById(pageName);
            if (targetPage) {
                targetPage.style.display = 'block';
                elmnt.style.backgroundColor = color;
                
                // Load dashboard content dynamically if needed
                if (pageName === 'dashboard') {
                    this.loadDashboardContent();
                }
            }
        };
    }

    // ===== DASHBOARD NAVIGATION =====
    setupDashboardNavigation() {
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Fetch button (manual data refresh)
        const fetchBtn = document.getElementById('fetchButton');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.refreshData());
        }

        // Navigation links within dashboard
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showDashboardSection(section);
            });
        });
    }

    showDashboardSection(sectionId) {
        // Hide all dashboard sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update navigation active state
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // ===== COMPREHENSIVE DATA LOADING =====
    async loadAllData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Use the complete endpoint for all data
            const completeData = await this.fetchData(DATA_CONFIG.endpoints.complete);
            
            // Extract data from the complete response
            this.currentData = {
                rowcast: { rowcastScore: completeData.current.rowcastScore },
                water: completeData.current.water,
                weather: completeData.current.weather,
                timestamp: new Date().toISOString()
            };
            
            // Update all UI elements
            this.updateAllUIElements();
            
            console.log('✅ All data loaded successfully:', this.currentData);
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async fetchData(endpoint) {
        const fullURL = `${this.baseURL}${endpoint}`;
        console.log(`📡 Fetching data from: ${fullURL}`);
        
        try {
            const response = await fetch(fullURL);
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📡 Received data from ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    // ===== COMPREHENSIVE UI UPDATE SYSTEM =====
    updateAllUIElements() {
        try {
            // Update RowCast Score
            if (this.currentData.rowcast?.rowcastScore !== undefined) {
                // Map the API field directly to the expected structure
                this.updateDataGroup('rowcastScore', {
                    rowcastScore: this.currentData.rowcast.rowcastScore,
                    timestamp: this.currentData.timestamp
                });
                this.updateScoreVisualization(this.currentData.rowcast.rowcastScore);
            }
            
            // Update Water Data
            if (this.currentData.water) {
                this.updateDataGroup('water', this.currentData.water);
            }
            
            // Update Weather Data
            if (this.currentData.weather) {
                this.updateDataGroup('weather', this.currentData.weather);
            }
            
            // Update status
            this.updateDataGroup('status', {
                timestamp: this.currentData.timestamp,
                status: 'Connected'
            });
            
            // Update widgets with new data
            this.updateWidgets();
            
            console.log('🎯 All UI elements updated successfully');
        } catch (error) {
            console.error('❌ Error updating UI:', error);
        }
    }

    updateDataGroup(groupName, data) {
        const mappings = DATA_CONFIG.mappings[groupName];
        if (!mappings) {
            console.warn(`No mappings found for group: ${groupName}`);
            return;
        }
        
        Object.keys(mappings).forEach(fieldName => {
            const elementIds = mappings[fieldName];
            const value = data[fieldName];
            
            if (value !== undefined && value !== null) {
                const formattedValue = this.formatValue(fieldName, value);
                this.updateMultipleElements(elementIds, formattedValue);
            }
        });
    }

    formatValue(fieldName, value) {
        const formatter = DATA_CONFIG.formatters[fieldName];
        return formatter ? formatter(value) : value.toString();
    }

    updateMultipleElements(elementIds, value) {
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`📊 Updated ${id}: ${value}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
    }

    updateScoreVisualization(score) {
        const percentage = (score / 10) * 100;
        const scoreInfo = this.getScoreInfo(score);
        
        // Update all score fill bars
        DATA_CONFIG.mappings.rowcastScore.fill.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.width = `${percentage}%`;
                element.style.backgroundColor = scoreInfo.color;
                element.style.transition = 'width 0.5s ease, background-color 0.5s ease';
            }
        });
        
        console.log(`🎯 Score visualization updated: ${score.toFixed(1)}/10 (${scoreInfo.label})`);
    }

    getScoreInfo(score) {
        const colors = DATA_CONFIG.scoreColors;
        if (score >= colors.excellent.min) return colors.excellent;
        if (score >= colors.good.min) return colors.good;
        if (score >= colors.fair.min) return colors.fair;
        return colors.poor;
    }

    // ===== DASHBOARD CONTENT LOADING =====
    async loadDashboardContent() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) return;
        
        if (this.contentCache.dashboard) {
            dashboardContent.innerHTML = this.contentCache.dashboard;
            return;
        }

        const dashboardHTML = `
            <!-- Current Score Widget -->
            <div class="widget-grid">
                <div class="widget current-score-widget">
                    <div class="widget-header">
                        <h3>Current RowCast Score</h3>
                        <div class="score-indicator" data-tooltip="Current rowing conditions score (0-10)">
                            <span id="dashboard-score">--</span>
                            <small>/10</small>
                        </div>
                    </div>
                    <div class="score-visualization">
                        <div class="score-bar">
                            <div class="score-fill" id="dashboard-score-fill"></div>
                        </div>
                        <div class="score-labels">
                            <span>Poor</span>
                            <span>Fair</span>
                            <span>Good</span>
                            <span>Excellent</span>
                        </div>
                    </div>
                    <p class="score-description">
                        Score based on water conditions, wind speed, and safety factors.
                        <br><small>Data from USGS Schuylkill River at Boathouse Row</small>
                    </p>
                </div>
                
                <!-- Current Conditions -->
                <div class="widget stats-widget">
                    <div class="widget-header">
                        <h3>Current Conditions</h3>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-tint"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Flow Rate</span>
                                <span class="stat-value" id="water-flow">-- ft³/s</span>
                                <small class="stat-note">Ideal: 100-500 ft³/s</small>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-ruler-vertical"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Water Level</span>
                                <span class="stat-value" id="water-level">-- ft</span>
                                <small class="stat-note">Ideal: 8-12 ft</small>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-thermometer-half"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Water Temp</span>
                                <span class="stat-value" id="water-temp">--°F</span>
                                <small class="stat-note">Comfort: 50-75°F</small>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-wind"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Wind Speed</span>
                                <span class="stat-value" id="wind-speed">-- mph</span>
                                <small class="stat-note">Ideal: < 10 mph</small>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-compass"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Wind Direction</span>
                                <span class="stat-value" id="wind-direction">--</span>
                                <small class="stat-note">From weather station</small>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-info">
                                <span class="stat-label">Last Updated</span>
                                <span class="stat-value" id="last-updated">--</span>
                                <small class="stat-note">Real-time data</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        this.contentCache.dashboard = dashboardHTML;
        dashboardContent.innerHTML = dashboardHTML;
        
        // Refresh data for the newly loaded content
        this.updateAllUIElements();
    }

    // ===== WIDGET DATA POPULATION =====
    updateWidgets() {
        try {
            // Update USGS Data Widget
            if (this.currentData.water) {
                this.updateUSGSWidget(this.currentData.water);
            }
            
            // Update UV & Air Quality Widget
            if (this.currentData.weather) {
                this.updateUVAirWidget(this.currentData.weather);
            }
            
            // Update Weather Alerts Widget
            if (this.currentData.weather) {
                this.updateWeatherAlertsWidget(this.currentData.weather);
            }
            
            // Update Temperature & Precipitation Widget
            if (this.currentData.weather) {
                this.updateTempPrecipWidget(this.currentData.weather);
            }
            
            // Update Visibility & Conditions Widget
            if (this.currentData.weather) {
                this.updateVisibilityWidget(this.currentData.weather);
            }
            
            // Note: Tide data and hourly forecast would need additional API endpoints
            this.updatePlaceholderWidgets();
            
        } catch (error) {
            console.error('❌ Error updating widgets:', error);
        }
    }

    updateUSGSWidget(waterData) {
        const element = document.getElementById('usgs-data');
        if (!element) return;
        
        const html = `
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Water Flow Rate</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(waterData.discharge || 0)} ft³/s</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Gauge Height</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${(waterData.gaugeHeight || 0).toFixed(1)} ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Water Temperature</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(waterData.waterTemp || 0)}°F</span>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-muted);">
                    Data from USGS Station #01474500 - Schuylkill River at Philadelphia, PA
                </div>
            </div>
        `;
        element.innerHTML = html;
    }

    updateUVAirWidget(weatherData) {
        const element = document.getElementById('uv-air-data');
        if (!element) return;
        
        const uvIndex = weatherData.uvIndex || 0;
        const uvLevel = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme';
        const uvColor = uvIndex <= 2 ? '#00b894' : uvIndex <= 5 ? '#fdcb6e' : uvIndex <= 7 ? '#e17055' : uvIndex <= 10 ? '#d63031' : '#741b47';
        
        const html = `
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">UV Index</span>
                    <span style="font-weight: bold; color: ${uvColor};">${uvIndex} (${uvLevel})</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Visibility</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${((weatherData.visibility || 0) / 1609.34).toFixed(1)} mi</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Precipitation</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${(weatherData.precipitation || 0).toFixed(1)} in</span>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-muted);">
                    Real-time environmental conditions
                </div>
            </div>
        `;
        element.innerHTML = html;
    }

    updateWeatherAlertsWidget(weatherData) {
        const element = document.getElementById('weather-alerts');
        if (!element) return;
        
        const alerts = weatherData.weatherAlerts || [];
        
        if (alerts.length === 0) {
            element.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--accent-green); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-primary); font-weight: bold;">No Active Alerts</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Current weather conditions are normal</p>
                </div>
            `;
        } else {
            const alertsHTML = alerts.map(alert => `
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(220, 53, 69, 0.1); border-left: 4px solid #dc3545; border-radius: 4px;">
                    <div style="font-weight: bold; color: #dc3545; margin-bottom: 0.5rem;">${alert.type || 'Weather Alert'}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">${alert.description || 'Check local weather services for details'}</div>
                </div>
            `).join('');
            
            element.innerHTML = alertsHTML;
        }
    }

    updateTempPrecipWidget(weatherData) {
        const element = document.getElementById('temp-precip-data');
        if (!element) return;
        
        const html = `
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Current Temperature</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(weatherData.currentTemp || 0)}°F</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Feels Like</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(weatherData.apparentTemp || 0)}°F</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Precipitation</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${(weatherData.precipitation || 0).toFixed(1)} in</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Wind Direction</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${weatherData.windDir || 'N/A'}</span>
                </div>
            </div>
        `;
        element.innerHTML = html;
    }

    updateVisibilityWidget(weatherData) {
        const element = document.getElementById('visibility-data');
        if (!element) return;
        
        const visibilityMiles = ((weatherData.visibility || 0) / 1609.34).toFixed(1);
        const visibilityLevel = visibilityMiles >= 10 ? 'Excellent' : visibilityMiles >= 5 ? 'Good' : visibilityMiles >= 2 ? 'Fair' : 'Poor';
        const visibilityColor = visibilityMiles >= 10 ? '#00b894' : visibilityMiles >= 5 ? '#00a8ff' : visibilityMiles >= 2 ? '#fdcb6e' : '#dc3545';
        
        const html = `
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Visibility</span>
                    <span style="font-weight: bold; color: ${visibilityColor};">${visibilityMiles} mi (${visibilityLevel})</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">UV Index</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${weatherData.uvIndex || 0}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Wind Speed</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(weatherData.windSpeed || 0)} mph</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Wind Gusts</span>
                    <span style="font-weight: bold; color: var(--text-primary);">${Math.round(weatherData.windGust || 0)} mph</span>
                </div>
            </div>
        `;
        element.innerHTML = html;
    }

    updatePlaceholderWidgets() {
        // Tide Data - placeholder since we don't have a tides API endpoint
        const tideElement = document.getElementById('tide-data');
        if (tideElement) {
            tideElement.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-info-circle" style="font-size: 2rem; color: var(--accent-blue); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-primary); font-weight: bold;">Tide Data</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Tide information not available for this location</p>
                </div>
            `;
        }
        
        // Hourly Forecast - placeholder since we don't have hourly forecast API
        const forecastElement = document.getElementById('hourly-forecast');
        if (forecastElement) {
            forecastElement.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-clock" style="font-size: 2rem; color: var(--accent-green); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-primary); font-weight: bold;">24-Hour Forecast</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Extended forecast data coming soon</p>
                </div>
            `;
        }
    }

    // ===== DATA REFRESH =====
    startDataRefresh() {
        // Refresh every 5 minutes
        this.updateInterval = setInterval(() => {
            this.refreshData();
        }, 300000);
        
        console.log('🔄 Data refresh interval started (5 minutes)');
    }

    async refreshData() {
        console.log('🔄 Refreshing all data...');
        await this.loadAllData();
    }

    // ===== UI STATE MANAGEMENT =====
    showLoadingState() {
        // Add loading indicators to main elements
        const loadingElements = [
            'rowcast-score', 'dashboard-score', 'R-Discharge', 'R-Temp', 'R-Height',
            'R-WindSpeed', 'R-Gusts', 'R-Direction'
        ];
        
        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.textContent === '--') {
                element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
    }

    hideLoadingState() {
        // Loading indicators will be replaced by actual data
    }

    showErrorState() {
        const errorElements = DATA_CONFIG.mappings;
        Object.values(errorElements).forEach(group => {
            Object.values(group).forEach(elementIds => {
                elementIds.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = 'Error';
                        element.style.color = '#dc3545';
                    }
                });
            });
        });
    }

    // ===== CLEANUP =====
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('🧹 RowCast App destroyed');
    }

    // ===== DEBUG HELPER =====
    debugDataMapping() {
        console.log('🔍 Debug: Checking element availability...');
        
        // Check all mapped elements
        Object.entries(DATA_CONFIG.mappings).forEach(([groupName, mappings]) => {
            console.log(`\n📊 Group: ${groupName}`);
            Object.entries(mappings).forEach(([fieldName, elementIds]) => {
                elementIds.forEach(id => {
                    const element = document.getElementById(id);
                    const status = element ? '✅ Found' : '❌ Missing';
                    console.log(`  ${status}: ${id}`);
                });
            });
        });
        
        console.log('\n🎯 Current data:', this.currentData);
    }
}

// ===== LEGACY FUNCTION SUPPORT =====
// These functions are kept for backward compatibility with existing HTML

function refreshData() {
    if (window.rowcastApp) {
        window.rowcastApp.refreshData();
    }
}

function loadForecastData(timeRange) {
    console.log('Forecast data loading not yet implemented for timeRange:', timeRange);
}

function changeForecastPage(direction) {
    console.log('Forecast page navigation not yet implemented for direction:', direction);
}

function initializeDashboard() {
    // Legacy function - now handled by RowCastApp constructor
    console.log('Dashboard initialization handled by RowCastApp');
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main application
    window.rowcastApp = new RowCastApp();
    
    console.log('🚣 RowCast application ready!');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.rowcastApp && typeof window.rowcastApp.destroy === 'function') {
        window.rowcastApp.destroy();
    }
});
