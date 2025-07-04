// Enhanced Data Management for SWD Platform
class EnhancedDataManager {
    constructor() {
        this.cache = {};
        this.charts = {};
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.startDataUpdates();
        this.setupCharts();
    }

    startDataUpdates() {
        // Initial load
        this.loadAllData();
        
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            this.loadAllData();
        }, 300000);
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadRowCastScore(),
                this.loadUSGSData(),
                this.loadTideData(),
                this.loadUVAirData(),
                this.loadWeatherAlerts(),
                this.loadWeatherData(),
                this.loadMarineWeather()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadRowCastScore() {
        try {
            // Simulated RowCast score calculation based on conditions
            const windData = await this.getWindData();
            const waterData = await this.getWaterData();
            
            const score = this.calculateRowCastScore(windData, waterData);
            this.updateRowCastScore(score);
        } catch (error) {
            console.error('Error loading RowCast score:', error);
        }
    }

    calculateRowCastScore(windData, waterData) {
        let score = 10;
        
        // Wind penalty (ideal: 0-10 mph)
        if (windData.windSpeed > 15) score -= 3;
        else if (windData.windSpeed > 10) score -= 1;
        
        // Gust penalty
        if (windData.windGust > 20) score -= 2;
        else if (windData.windGust > 15) score -= 1;
        
        // Water flow penalty (ideal: 1000-3000 ft³/s)
        if (waterData.flow > 5000 || waterData.flow < 500) score -= 2;
        else if (waterData.flow > 4000 || waterData.flow < 800) score -= 1;
        
        // Temperature bonus/penalty
        if (waterData.temperature < 40 || waterData.temperature > 85) score -= 1;
        
        return Math.max(0, Math.min(10, score));
    }

    updateRowCastScore(score) {
        const scoreElements = document.querySelectorAll('#rowcast-score, #dashboard-score');
        const fillElements = document.querySelectorAll('#score-fill, #dashboard-score-fill');
        
        scoreElements.forEach(el => {
            if (el) el.textContent = score.toFixed(1);
        });
        
        fillElements.forEach(el => {
            if (el) el.style.width = `${(score / 10) * 100}%`;
        });
    }

    async loadUSGSData() {
        try {
            const response = await fetch('/api/water/current');
            let data;
            
            if (response.ok) {
                data = await response.json();
            } else {
                // Fallback to simulated data
                data = this.getSimulatedUSGSData();
            }

            this.updateUSGSDisplay(data);
            this.cache.usgsData = data;
        } catch (error) {
            console.error('Error loading USGS data:', error);
            this.updateUSGSDisplay(this.getSimulatedUSGSData());
        }
    }

    getSimulatedUSGSData() {
        return {
            flow: 2450 + Math.random() * 500,
            height: 6.2 + Math.random() * 0.8,
            temperature: 68 + Math.random() * 8,
            timestamp: new Date().toISOString()
        };
    }

    updateUSGSDisplay(data) {
        const usgsContainer = document.getElementById('usgs-data');
        if (usgsContainer) {
            usgsContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Flow Rate</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${data.flow ? data.flow.toFixed(0) : 'N/A'} ft³/s</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Water Level</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${data.height ? data.height.toFixed(1) : 'N/A'} ft</div>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Water Temperature</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${data.temperature ? data.temperature.toFixed(1) : 'N/A'}°F</div>
                    </div>
                </div>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
                    Last updated: ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}
                </div>
            `;
        }

        // Update main data cards
        this.updateDataCard('R-Discharge', data.flow ? `${data.flow.toFixed(0)}` : 'N/A');
        this.updateDataCard('R-Height', data.height ? `${data.height.toFixed(1)}` : 'N/A');
        this.updateDataCard('R-Temp', data.temperature ? `${data.temperature.toFixed(1)}` : 'N/A');
        
        // Update dashboard cards
        this.updateDataCard('dash-flow', data.flow ? `${data.flow.toFixed(0)} ft³/s` : 'N/A');
        this.updateDataCard('dash-water-level', data.height ? `${data.height.toFixed(1)} ft` : 'N/A');
        this.updateDataCard('dash-water-temp', data.temperature ? `${data.temperature.toFixed(1)}°F` : 'N/A');
    }

    async loadTideData() {
        try {
            // Simulated tide data for Delaware River
            const now = new Date();
            const tideData = this.getSimulatedTideData(now);
            
            const tideContainer = document.getElementById('tide-data');
            if (tideContainer) {
                tideContainer.innerHTML = `
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Current Tide</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-green);">${tideData.current}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Next High</div>
                            <div style="font-size: 1rem; font-weight: 600;">${tideData.nextHigh}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Next Low</div>
                            <div style="font-size: 1rem; font-weight: 600;">${tideData.nextLow}</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading tide data:', error);
        }
    }

    getSimulatedTideData(now) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // Simulated tide cycle
        const tideHeight = 3 + 2 * Math.sin((hours + minutes/60) * Math.PI / 6);
        const isRising = Math.cos((hours + minutes/60) * Math.PI / 6) > 0;
        
        return {
            current: `${tideHeight.toFixed(1)} ft ${isRising ? '(Rising)' : '(Falling)'}`,
            nextHigh: new Date(now.getTime() + (isRising ? 2 : 8) * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
            nextLow: new Date(now.getTime() + (isRising ? 8 : 2) * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
        };
    }

    async loadUVAirData() {
        try {
            const uvIndex = Math.floor(Math.random() * 11);
            const aqi = Math.floor(Math.random() * 150);
            
            const uvAirContainer = document.getElementById('uv-air-data');
            if (uvAirContainer) {
                const uvLevel = this.getUVLevel(uvIndex);
                const aqiLevel = this.getAQILevel(aqi);
                
                uvAirContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">UV Index</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: ${uvLevel.color};">${uvIndex}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${uvLevel.description}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Air Quality</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: ${aqiLevel.color};">${aqi}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${aqiLevel.description}</div>
                        </div>
                    </div>
                `;
            }
            
            // Update dashboard
            this.updateDataCard('dash-uv', uvIndex.toString());
        } catch (error) {
            console.error('Error loading UV/Air data:', error);
        }
    }

    getUVLevel(uvIndex) {
        if (uvIndex <= 2) return { description: 'Low', color: 'var(--accent-green)' };
        if (uvIndex <= 5) return { description: 'Moderate', color: 'var(--accent-orange)' };
        if (uvIndex <= 7) return { description: 'High', color: '#ff6b35' };
        if (uvIndex <= 10) return { description: 'Very High', color: '#ff3535' };
        return { description: 'Extreme', color: '#9c27b0' };
    }

    getAQILevel(aqi) {
        if (aqi <= 50) return { description: 'Good', color: 'var(--accent-green)' };
        if (aqi <= 100) return { description: 'Moderate', color: 'var(--accent-orange)' };
        if (aqi <= 150) return { description: 'Unhealthy for Sensitive', color: '#ff6b35' };
        return { description: 'Unhealthy', color: '#ff3535' };
    }

    async loadWeatherAlerts() {
        try {
            // Simulated weather alerts check
            const hasAlerts = Math.random() < 0.2; // 20% chance of alerts
            
            const alertsContainer = document.getElementById('weather-alerts');
            if (alertsContainer) {
                if (hasAlerts) {
                    alertsContainer.innerHTML = `
                        <div style="background: rgba(255, 107, 53, 0.1); border: 1px solid #ff6b35; border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-exclamation-triangle" style="color: #ff6b35;"></i>
                                <strong style="color: #ff6b35;">Weather Advisory</strong>
                            </div>
                            <p style="margin: 0; color: var(--text-secondary);">Small craft advisory in effect for Delaware River. Winds 15-25 mph with gusts up to 35 mph.</p>
                        </div>
                    `;
                } else {
                    alertsContainer.innerHTML = `
                        <div style="text-align: center; padding: 1rem; color: var(--text-muted);">
                            <i class="fas fa-check-circle" style="color: var(--accent-green); font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <p style="margin: 0;">No active weather alerts</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading weather alerts:', error);
        }
    }

    async loadWeatherData() {
        try {
            // Simulated weather data
            const weatherData = {
                temperature: 72 + Math.random() * 10,
                humidity: 45 + Math.random() * 30,
                pressure: 29.8 + Math.random() * 0.4,
                visibility: 8 + Math.random() * 2,
                conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'][Math.floor(Math.random() * 4)]
            };

            // Update dashboard weather summary
            this.updateDataCard('dash-temp', `${weatherData.temperature.toFixed(0)}°F`);
            this.updateDataCard('dash-humidity', `${weatherData.humidity.toFixed(0)}%`);
            this.updateDataCard('dash-pressure', `${weatherData.pressure.toFixed(2)} inHg`);

            // Update visibility data
            const visibilityContainer = document.getElementById('visibility-data');
            if (visibilityContainer) {
                visibilityContainer.innerHTML = `
                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Visibility</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-purple);">${weatherData.visibility.toFixed(1)} mi</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Conditions</div>
                            <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">${weatherData.conditions}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Feels Like</div>
                            <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">${(weatherData.temperature + Math.random() * 4 - 2).toFixed(0)}°F</div>
                        </div>
                    </div>
                `;
            }

            // Update temperature/precipitation data
            const tempPrecipContainer = document.getElementById('temp-precip-data');
            if (tempPrecipContainer) {
                tempPrecipContainer.innerHTML = `
                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Current Temperature</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-orange);">${weatherData.temperature.toFixed(0)}°F</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Precipitation (24h)</div>
                            <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">${(Math.random() * 0.5).toFixed(2)} in</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Dew Point</div>
                            <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">${(weatherData.temperature - 10 + Math.random() * 5).toFixed(0)}°F</div>
                        </div>
                    </div>
                `;
            }

            // Load hourly forecast
            this.loadHourlyForecast();
        } catch (error) {
            console.error('Error loading weather data:', error);
        }
    }

    async loadHourlyForecast() {
        try {
            const hourlyContainer = document.getElementById('hourly-forecast');
            if (!hourlyContainer) return;

            // Generate 24 hours of forecast data
            const now = new Date();
            const hourlyData = Array.from({length: 24}, (_, i) => {
                const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
                const temp = 70 + Math.sin(i * Math.PI / 12) * 8 + Math.random() * 4;
                const windSpeed = 8 + Math.random() * 10;
                const precipitation = Math.random() < 0.3 ? Math.random() * 20 : 0;
                const icons = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];
                const icon = precipitation > 10 ? icons[3] : precipitation > 0 ? icons[1] : icons[0];
                
                return {
                    hour: hour.getHours(),
                    temp: Math.round(temp),
                    windSpeed: Math.round(windSpeed),
                    precipitation: Math.round(precipitation),
                    icon
                };
            });

            hourlyContainer.innerHTML = `
                <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;">
                    ${hourlyData.map(data => `
                        <div style="min-width: 120px; text-align: center; background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1rem;">
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                ${data.hour === now.getHours() ? 'Now' : `${data.hour}:00`}
                            </div>
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${data.icon}</div>
                            <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                                ${data.temp}°F
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                                <i class="fas fa-wind"></i> ${data.windSpeed} mph
                            </div>
                            ${data.precipitation > 0 ? `
                                <div style="font-size: 0.8rem; color: var(--accent-blue);">
                                    <i class="fas fa-tint"></i> ${data.precipitation}%
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading hourly forecast:', error);
        }
    }

    async loadMarineWeather() {
        try {
            const marineData = {
                waveHeight: 0.5 + Math.random() * 1.5,
                windSpeed: 8 + Math.random() * 10,
                visibility: 8 + Math.random() * 2,
                waterTemp: 68 + Math.random() * 8
            };

            const marineContainer = document.getElementById('marine-weather');
            if (marineContainer) {
                marineContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Wave Height</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${marineData.waveHeight.toFixed(1)} ft</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Wind Speed</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${marineData.windSpeed.toFixed(0)} mph</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Visibility</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${marineData.visibility.toFixed(1)} mi</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Water Temp</div>
                            <div style="font-size: 1.5rem; font-weight: 600; color: var(--accent-blue);">${marineData.waterTemp.toFixed(0)}°F</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading marine weather:', error);
        }
    }

    updateDataCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    async getWindData() {
        try {
            const response = await fetch('/api/weather/current');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching wind data:', error);
        }
        
        // Fallback simulated data
        return {
            windSpeed: 8 + Math.random() * 10,
            windGust: 10 + Math.random() * 15,
            windDirection: Math.random() * 360
        };
    }

    async getWaterData() {
        return this.cache.usgsData || this.getSimulatedUSGSData();
    }

    setupCharts() {
        // Wait for Chart.js to be available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        } else {
            setTimeout(() => this.setupCharts(), 1000);
        }
    }

    initializeCharts() {
        this.createWindChart();
        this.createFlowChart();
        this.createHistoricalChart();
    }

    createWindChart() {
        const ctx = document.getElementById('wind-chart');
        if (!ctx) return;

        // Generate 24 hours of data
        const hours = Array.from({length: 24}, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - 23 + i);
            return date.getHours() + ':00';
        });

        const windSpeeds = Array.from({length: 24}, () => 5 + Math.random() * 15);
        const windGusts = windSpeeds.map(speed => speed + Math.random() * 8);

        this.charts.windChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Wind Speed (mph)',
                    data: windSpeeds,
                    borderColor: 'rgba(0, 168, 255, 1)',
                    backgroundColor: 'rgba(0, 168, 255, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Wind Gusts (mph)',
                    data: windGusts,
                    borderColor: 'rgba(108, 92, 231, 1)',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: { 
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createFlowChart() {
        const ctx = document.getElementById('flow-chart');
        if (!ctx) return;

        const hours = Array.from({length: 24}, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - 23 + i);
            return date.getHours() + ':00';
        });

        const flowData = Array.from({length: 24}, () => 2000 + Math.random() * 1000);

        this.charts.flowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Water Flow (ft³/s)',
                    data: flowData,
                    borderColor: 'rgba(0, 184, 148, 1)',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: { 
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalChart() {
        const ctx = document.getElementById('historical-chart');
        if (!ctx) return;

        const days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 6 + i);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        const scores = Array.from({length: 7}, () => 6 + Math.random() * 4);

        this.charts.historicalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'RowCast Score',
                    data: scores,
                    backgroundColor: 'rgba(253, 203, 110, 0.8)',
                    borderColor: 'rgba(253, 203, 110, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: { 
                        beginAtZero: true,
                        max: 10,
                        ticks: { color: '#b2b9c7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize enhanced data manager
let enhancedDataManager;

document.addEventListener('DOMContentLoaded', function() {
    enhancedDataManager = new EnhancedDataManager();
});

// Export for global access
window.enhancedDataManager = enhancedDataManager;
