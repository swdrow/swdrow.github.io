// SPA Content Loader
class SPALoader {
    constructor() {
        this.contentCache = {};
        this.isLoading = {};
    }

    async loadDashboardContent() {
        if (this.contentCache.dashboard) {
            document.getElementById('dashboard-content').innerHTML = this.contentCache.dashboard;
            return;
        }

        if (this.isLoading.dashboard) return;
        this.isLoading.dashboard = true;

        try {
            const dashboardHTML = `
                <!-- Current Score Widget -->
                <div class="widget-grid">
                    <div class="widget current-score-widget">
                        <div class="widget-header">
                            <h3>Current RowCast Score</h3>
                            <div class="score-indicator" data-tooltip="Current rowing conditions score (0-10)">
                                <span id="current-score">--</span>
                                <small>/10</small>
                            </div>
                        </div>
                        <div class="score-visualization">
                            <div class="score-bar">
                                <div class="score-fill" id="score-fill"></div>
                            </div>
                            <div class="score-labels">
                                <span>Poor</span>
                                <span>Fair</span>
                                <span>Good</span>
                                <span>Excellent</span>
                            </div>
                        </div>
                    </div>
                    <!-- Quick Stats -->
                    <div class="widget stats-widget">
                        <div class="widget-header">
                            <h3>Current Conditions</h3>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-item" data-tooltip="Current water flow rate">
                                <div class="stat-icon">
                                    <i class="fas fa-tint"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value" id="current-flow">--</span>
                                    <span class="stat-label">Flow (cfs)</span>
                                </div>
                            </div>
                            <div class="stat-item" data-tooltip="Wind speed and direction">
                                <div class="stat-icon">
                                    <i class="fas fa-wind"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value" id="current-wind">--</span>
                                    <span class="stat-label">Wind (mph)</span>
                                </div>
                            </div>
                            <div class="stat-item" data-tooltip="Apparent temperature">
                                <div class="stat-icon">
                                    <i class="fas fa-thermometer-half"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value" id="current-temp">--</span>
                                    <span class="stat-label">Temp (°F)</span>
                                </div>
                            </div>
                            <div class="stat-item" data-tooltip="Water temperature">
                                <div class="stat-icon">
                                    <i class="fas fa-water"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value" id="current-water-temp">--</span>
                                    <span class="stat-label">Water (°F)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Forecast Widget -->
                <div class="widget forecast-widget">
                    <div class="widget-header">
                        <h3>Forecast</h3>
                        <div class="forecast-controls">
                            <div class="time-range-selector">
                                <button class="time-btn active" data-range="24h" data-tooltip="24-hour forecast">24H</button>
                                <button class="time-btn" data-range="7d" data-tooltip="7-day forecast">7D</button>
                                <button class="time-btn" data-range="extended" data-tooltip="Extended forecast with NOAA data">Extended</button>
                            </div>
                        </div>
                    </div>
                    <div class="forecast-content">
                        <div class="forecast-grid" id="forecast-grid">
                            <p>Loading forecast data...</p>
                        </div>
                    </div>
                </div>
                <!-- Charts Section -->
                <div class="widget-grid">
                    <div class="widget chart-widget">
                        <div class="widget-header">
                            <h3 data-tooltip="RowCast score trend over time">Score Trend</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="score-chart"></canvas>
                        </div>
                    </div>
                    <div class="widget chart-widget">
                        <div class="widget-header">
                            <h3 data-tooltip="Wind speed and temperature forecast">Conditions Overview</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="conditions-chart"></canvas>
                        </div>
                    </div>
                </div>
            `;

            this.contentCache.dashboard = dashboardHTML;
            document.getElementById('dashboard-content').innerHTML = dashboardHTML;

            // Dispatch event to notify dashboard initialization
            console.log('📍 Dashboard content loaded, dispatching event');
            
            // Wait a bit for DOM to be fully rendered before initializing dashboard
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('dashboardContentLoaded'));
                
                // Also try direct initialization as fallback
                if (typeof initializeDashboard === 'function') {
                    initializeDashboard();
                }
            }, 200);
        } catch (error) {
            console.error('Error loading dashboard content:', error);
            document.getElementById('dashboard-content').innerHTML = '<p>Error loading dashboard content.</p>';
        } finally {
            this.isLoading.dashboard = false;
        }
    }

    async loadAPIDocsContent() {
        if (this.contentCache.apiDocs) {
            document.getElementById('api-docs-content').innerHTML = this.contentCache.apiDocs;
            return;
        }

        if (this.isLoading.apiDocs) return;
        this.isLoading.apiDocs = true;

        try {
            const apiDocsHTML = `
                <!-- Weather Endpoints -->
                <section class="endpoint-section">
                    <h2 class="section-title">Weather Endpoints</h2>
                    <div class="endpoint-card">
                        <div class="endpoint-method">GET</div>
                        <div class="endpoint-path">/api/weather</div>
                        <div class="endpoint-description">
                            Retrieve complete current weather data including temperature, wind conditions, humidity, and atmospheric pressure.
                        </div>
                        <button class="try-button" onclick="tryEndpoint('/api/weather')">Try it</button>
                    </div>
                    <div class="endpoint-card">
                        <div class="endpoint-method">GET</div>
                        <div class="endpoint-path">/api/weather/current</div>
                        <div class="endpoint-description">
                            Get current weather summary with essential conditions for quick reference.
                        </div>
                        <button class="try-button" onclick="tryEndpoint('/api/weather/current')">Try it</button>
                    </div>
                </section>

                <!-- RowCast Endpoints -->
                <section class="endpoint-section">
                    <h2 class="section-title">RowCast Scoring</h2>
                    <div class="endpoint-card">
                        <div class="endpoint-method">GET</div>
                        <div class="endpoint-path">/api/rowcast</div>
                        <div class="endpoint-description">
                            Current RowCast score based on all weather and water conditions.
                        </div>
                        <button class="try-button" onclick="tryEndpoint('/api/rowcast')">Try it</button>
                    </div>
                    <div class="endpoint-card">
                        <div class="endpoint-method">GET</div>
                        <div class="endpoint-path">/api/rowcast/forecast</div>
                        <div class="endpoint-description">
                            RowCast scores for upcoming time periods with detailed conditions.
                        </div>
                        <button class="try-button" onclick="tryEndpoint('/api/rowcast/forecast')">Try it</button>
                    </div>
                </section>

                <!-- Complete Data -->
                <section class="endpoint-section">
                    <h2 class="section-title">Complete Data</h2>
                    <div class="endpoint-card">
                        <div class="endpoint-method">GET</div>
                        <div class="endpoint-path">/api/complete</div>
                        <div class="endpoint-description">
                            All current conditions and short-term forecasts in a single comprehensive response.
                        </div>
                        <button class="try-button" onclick="tryEndpoint('/api/complete')">Try it</button>
                    </div>
                </section>

                <!-- Response Modal -->
                <div id="response-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                    <div style="background: var(--bg-secondary, #fff); border-radius: 1rem; padding: 2rem; max-width: 90%; max-height: 90%; overflow-y: auto; border: 1px solid var(--border-color, #ddd);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="color: var(--text-primary, #333);">API Response</h3>
                            <button onclick="closeModal()" style="background: none; border: none; color: var(--text-primary, #333); font-size: 1.5rem; cursor: pointer;">&times;</button>
                        </div>
                        <pre id="response-content" style="background: var(--bg-primary, #f8f9fa); border: 1px solid var(--border-color, #ddd); border-radius: 0.5rem; padding: 1rem; overflow-x: auto; color: var(--text-primary, #333); font-family: 'Courier New', monospace; font-size: 0.9rem;"></pre>
                    </div>
                </div>
            `;

            this.contentCache.apiDocs = apiDocsHTML;
            document.getElementById('api-docs-content').innerHTML = apiDocsHTML;
        } catch (error) {
            console.error('Error loading API docs content:', error);
            document.getElementById('api-docs-content').innerHTML = '<p>Error loading API documentation.</p>';
        } finally {
            this.isLoading.apiDocs = false;
        }
    }
}

// Initialize the SPA loader
window.spaLoader = new SPALoader();
