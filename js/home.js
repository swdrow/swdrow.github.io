// Home Page Manager
class HomeManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    async loadContent() {
        const mainContent = document.getElementById('main-content');
        // Show loading spinner
        if (mainContent) {
            mainContent.innerHTML = `<div class="flex items-center justify-center py-12"><div class="loading-spinner mr-4"></div><span class="text-glass-muted">Loading...</span></div>`;
        }
        try {
            // Check API connectivity
            const apiStatus = await this.checkApiStatus();
            
            mainContent.innerHTML = `
                <div class="container mx-auto px-6 py-12">
                    <!-- Hero Section -->
                    <section class="text-center mb-16">
                        <div class="glass-panel rounded-3xl p-12 mb-8">
                            <div class="mb-8">
                                <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                                    <i class="fas fa-water text-3xl text-white"></i>
                                </div>
                                <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                                    RowCast
                                </h1>
                                <p class="text-xl text-glass-muted mb-8">
                                    Advanced Rowing Weather Intelligence Platform
                                </p>
                            </div>
                            
                            <div class="grid md:grid-cols-3 gap-6 text-left">
                                <div class="widget-glass rounded-xl p-6">
                                    <i class="fas fa-chart-line text-2xl text-blue-400 mb-4"></i>
                                    <h3 class="text-lg font-semibold mb-2">Real-time Analytics</h3>
                                    <p class="text-glass-muted text-sm">Comprehensive scoring system combining weather, water conditions, and safety factors.</p>
                                </div>
                                <div class="widget-glass rounded-xl p-6">
                                    <i class="fas fa-cloud-sun text-2xl text-purple-400 mb-4"></i>
                                    <h3 class="text-lg font-semibold mb-2">Weather Intelligence</h3>
                                    <p class="text-glass-muted text-sm">Advanced weather data with 12-hour forecasts and extended predictions.</p>
                                </div>
                                <div class="widget-glass rounded-xl p-6">
                                    <i class="fas fa-water text-2xl text-teal-400 mb-4"></i>
                                    <h3 class="text-lg font-semibold mb-2">Water Monitoring</h3>
                                    <p class="text-glass-muted text-sm">NOAA water stage, flow rate, and temperature monitoring for the Schuylkill River.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Current Status Widget -->
                    <section class="mb-16">
                        <div class="glass-panel rounded-3xl p-8">
                            <h2 class="text-2xl font-bold mb-6 flex items-center">
                                <i class="fas fa-tachometer-alt text-blue-400 mr-3"></i>
                                Current Rowing Conditions
                            </h2>
                            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6" id="current-status-grid">
                                <div class="widget-glass rounded-xl p-6 text-center">
                                    <div class="text-3xl font-bold text-blue-400 mb-2" id="current-score">--</div>
                                    <div class="text-sm text-glass-muted">RowCast Score</div>
                                </div>
                                <div class="widget-glass rounded-xl p-6 text-center">
                                    <div class="text-xl font-bold text-green-400 mb-2" id="current-temp">--°F</div>
                                    <div class="text-sm text-glass-muted">Temperature</div>
                                </div>
                                <div class="widget-glass rounded-xl p-6 text-center">
                                    <div class="text-xl font-bold text-yellow-400 mb-2" id="current-wind">-- mph</div>
                                    <div class="text-sm text-glass-muted">Wind Speed</div>
                                </div>
                                <div class="widget-glass rounded-xl p-6 text-center">
                                    <div class="text-xl font-bold text-teal-400 mb-2" id="current-flow">-- cfs</div>
                                    <div class="text-sm text-glass-muted">Water Flow</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- API Status -->
                    <section class="mb-16">
                        <div class="glass-panel rounded-3xl p-8">
                            <h2 class="text-2xl font-bold mb-6 flex items-center">
                                <i class="fas fa-server text-purple-400 mr-3"></i>
                                System Status
                            </h2>
                            <div class="grid md:grid-cols-2 gap-6">
                                <div class="flex items-center justify-between p-4 widget-glass rounded-xl">
                                    <span>API Server</span>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded-full ${apiStatus.connected ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
                                        <span class="text-sm ${apiStatus.connected ? 'text-green-400' : 'text-red-400'}">
                                            ${apiStatus.connected ? 'Connected' : 'Disconnected'}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between p-4 widget-glass rounded-xl">
                                    <span>Data Updated</span>
                                    <span class="text-sm text-glass-muted" id="last-update">--</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Features Overview -->
                    <section>
                        <div class="glass-panel rounded-3xl p-8">
                            <h2 class="text-2xl font-bold mb-8 text-center">Platform Capabilities</h2>
                            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div class="text-center">
                                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <i class="fas fa-wind text-2xl text-white"></i>
                                    </div>
                                    <h3 class="font-semibold mb-2">Wind Analysis</h3>
                                    <p class="text-sm text-glass-muted">Real-time wind speed, direction, and gust monitoring</p>
                                </div>
                                <div class="text-center">
                                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <i class="fas fa-thermometer-half text-2xl text-white"></i>
                                    </div>
                                    <h3 class="font-semibold mb-2">Temperature</h3>
                                    <p class="text-sm text-glass-muted">Air and water temperature with feels-like calculations</p>
                                </div>
                                <div class="text-center">
                                    <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <i class="fas fa-tint text-2xl text-white"></i>
                                    </div>
                                    <h3 class="font-semibold mb-2">Precipitation</h3>
                                    <p class="text-sm text-glass-muted">Current and forecasted precipitation levels</p>
                                </div>
                                <div class="text-center">
                                    <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <i class="fas fa-exclamation-triangle text-2xl text-white"></i>
                                    </div>
                                    <h3 class="font-semibold mb-2">Safety Alerts</h3>
                                    <p class="text-sm text-glass-muted">Weather advisories and safety recommendations</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            `;

            // Load current data
            if (apiStatus.connected) {
                await this.loadCurrentData();
            }

        } catch (error) {
            console.error('Error loading home content:', error);
            if (mainContent) {
                mainContent.innerHTML = `<div class='text-red-400 text-center py-8'>Error loading home page: ${error.message || error}</div>`;
            }
            this.showErrorState(mainContent);
        }
    }

    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            return {
                connected: response.ok,
                status: response.status
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    async loadCurrentData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const data = await response.json();
            
            // Update current status display
            this.updateCurrentStatus(data);
            
        } catch (error) {
            console.error('Error loading current data:', error);
        }
    }

    updateCurrentStatus(data) {
        // Update RowCast score
        const scoreElement = document.getElementById('current-score');
        if (scoreElement && data.current && data.current.rowcastScore !== undefined) {
            scoreElement.textContent = data.current.rowcastScore.toFixed(1);
            scoreElement.className = `text-3xl font-bold mb-2 ${this.getScoreColor(data.current.rowcastScore)}`;
        }

        // Update temperature
        const tempElement = document.getElementById('current-temp');
        if (tempElement && data.current && data.current.weather && data.current.weather.currentTemp !== undefined) {
            tempElement.textContent = `${Math.round(data.current.weather.currentTemp)}°F`;
        }

        // Update wind speed
        const windElement = document.getElementById('current-wind');
        if (windElement && data.current && data.current.weather && data.current.weather.windSpeed !== undefined) {
            windElement.textContent = `${Math.round(data.current.weather.windSpeed)} mph`;
        }

        // Update water flow
        const flowElement = document.getElementById('current-flow');
        if (flowElement && data.current && data.current.water && data.current.water.discharge !== undefined) {
            flowElement.textContent = `${Math.round(data.current.water.discharge)} cfs`;
        }

        // Update last update time
        const updateElement = document.getElementById('last-update');
        if (updateElement && data.current && data.current.weather && data.current.weather.timestamp) {
            const updateTime = new Date(data.current.weather.timestamp).toLocaleTimeString();
            updateElement.textContent = updateTime;
        }
    }

    getScoreColor(score) {
        if (score >= 8) return 'text-green-400';
        if (score >= 6) return 'text-yellow-400';
        if (score >= 4) return 'text-orange-400';
        return 'text-red-400';
    }

    showErrorState(container) {
        container.innerHTML = `
            <div class="container mx-auto px-6 py-12">
                <div class="glass-panel rounded-3xl p-12 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-6"></i>
                    <h2 class="text-2xl font-bold mb-4">Unable to Load Home Page</h2>
                    <p class="text-glass-muted mb-6">There was an error loading the home page content.</p>
                    <button onclick="window.homeManager.loadContent()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize home manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.homeManager = new HomeManager();
    await window.homeManager.init();
});
