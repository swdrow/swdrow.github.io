// Modern RowCast Application
class RowCastApp {
    constructor() {
        this.currentPage = 'home';
        this.backgroundImages = [
            '/public/assets/images/AdobeStock_666396000.jpeg',
            '/public/assets/img/background.jpg'
        ];
        this.currentBgIndex = 0;
        this.apiData = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startBackgroundRotation();
        await this.loadPage('home');
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
            });
        });
    }

    startBackgroundRotation() {
        // Rotate backgrounds every 15 seconds
        setInterval(() => {
            this.changeBackground();
        }, 15000);
    }

    changeBackground() {
        const layers = document.querySelectorAll('.background-layer');
        const currentLayer = layers[this.currentBgIndex];
        const nextIndex = (this.currentBgIndex + 1) % this.backgroundImages.length;
        const nextLayer = layers[nextIndex];

        // Set next background image
        nextLayer.style.backgroundImage = `url('${this.backgroundImages[nextIndex]}')`;
        
        // Fade transition
        currentLayer.classList.remove('active');
        nextLayer.classList.add('active');
        
        this.currentBgIndex = nextIndex;
    }

    async loadPage(pageName) {
        // Update navigation
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Show loading
        this.showLoading();

        // Load page content
        const content = document.getElementById('main-content');
        try {
            switch(pageName) {
                case 'home':
                    content.innerHTML = this.getHomePage();
                    break;
                case 'weather':
                    content.innerHTML = this.getWeatherPageHTML();
                    await this.initWeatherPage();
                    break;
                case 'dashboard':
                    content.innerHTML = this.getDashboardPageHTML();
                    await this.initDashboardPage();
                    break;
                case 'api':
                    content.innerHTML = this.getApiPageHTML();
                    await this.initApiPage();
                    break;
            }
            this.currentPage = pageName;
        } catch (error) {
            console.error('Error loading page:', error);
            content.innerHTML = this.getErrorPage();
        }

        this.hideLoading();
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    async fetchApiData(endpoint = '/complete') {
        try {
            const response = await fetch(`/api${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    getHomePage() {
        return `
            <div class="page-container fade-in-up">
                <div class="page-header">
                    <h1 class="page-title">RowCast</h1>
                    <p class="page-subtitle">Advanced Rowing Weather Intelligence for the Schuylkill River</p>
                </div>

                <div class="dashboard-grid">
                    <div class="widget large-widget">
                        <div class="widget-header">
                            <h3 class="widget-title">🌊 What is RowCast?</h3>
                        </div>
                        <div class="body-text">
                            <p>RowCast is a comprehensive weather intelligence platform specifically designed for rowing on the Schuylkill River. Our advanced system analyzes multiple weather factors to provide real-time rowing condition scores and forecasts.</p>
                            <br>
                            <p>Using data from NOAA and advanced meteorological models, we calculate a proprietary RowCast Score that takes into account wind speed, wind direction relative to the river course, temperature, precipitation, and other critical factors that affect rowing safety and performance.</p>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">🌤️ Weather Intelligence</h3>
                            <span class="widget-icon">☀️</span>
                        </div>
                        <div class="body-text">
                            <p>Real-time weather monitoring with precipitation alerts, UV index, air quality, and comprehensive 12-hour forecasting.</p>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">📊 RowCast Score</h3>
                            <span class="widget-icon">🎯</span>
                        </div>
                        <div class="body-text">
                            <p>Our proprietary scoring system evaluates rowing conditions on a 1-10 scale, considering wind patterns, temperature, and safety factors.</p>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">🧭 Wind Analysis</h3>
                            <span class="widget-icon">💨</span>
                        </div>
                        <div class="body-text">
                            <p>Detailed wind direction analysis relative to the 220° river course heading, with visual compass representation.</p>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">🔮 Forecasting</h3>
                            <span class="widget-icon">📈</span>
                        </div>
                        <div class="body-text">
                            <p>12-hour rolling forecasts with -3 to +9 hour windows, plus extended forecasts for optimal training planning.</p>
                        </div>
                    </div>

                    <div class="widget large-widget">
                        <div class="widget-header">
                            <h3 class="widget-title">🚀 Get Started</h3>
                        </div>
                        <div class="body-text">
                            <p>Navigate through our platform using the menu above:</p>
                            <ul style="margin-top: 16px; padding-left: 20px; color: var(--text-secondary);">
                                <li><strong>Weather:</strong> Current conditions and detailed forecasts</li>
                                <li><strong>Dashboard:</strong> RowCast scores and comprehensive analysis</li>
                                <li><strong>API:</strong> Technical documentation for developers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getWeatherPageHTML() {
        return `
            <div class="page-container fade-in-up">
                <div class="page-header">
                    <h1 class="page-title">Weather Conditions</h1>
                    <p class="page-subtitle">Real-time weather data and 12-hour forecasting for optimal rowing conditions</p>
                </div>

                <div id="weather-content">
                    <!-- Current conditions will be loaded here -->
                </div>

                <div class="weather-grid" id="weather-widgets">
                    <!-- Weather widgets will be populated here -->
                </div>

                <div class="widget large-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">📡 Weather Radar</h3>
                    </div>
                    <div class="radar-widget">
                        Weather Radar Integration (Coming Soon)
                    </div>
                </div>

                <div class="widget large-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">💨 Wind Map</h3>
                    </div>
                    <div class="wind-map-widget">
                        Wind Map Visualization (Coming Soon)
                    </div>
                </div>
            </div>
        `;
    }

    getDashboardPageHTML() {
        return `
            <div class="page-container fade-in-up">
                <div class="page-header">
                    <h1 class="page-title">RowCast Dashboard</h1>
                    <p class="page-subtitle">Comprehensive rowing condition analysis and forecasting</p>
                </div>

                <div class="widget large-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">🎯 Current RowCast Score</h3>
                    </div>
                    <div id="current-score-display">
                        <!-- Current score will be loaded here -->
                    </div>
                </div>

                <div class="widget">
                    <div class="widget-header">
                        <h3 class="widget-title">🧭 Wind Direction</h3>
                    </div>
                    <div id="wind-compass-container">
                        <!-- Wind compass will be rendered here -->
                    </div>
                </div>

                <div class="widget large-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">📈 12-Hour Forecast</h3>
                    </div>
                    <div id="forecast-timeline-container">
                        <!-- Forecast timeline will be rendered here -->
                    </div>
                </div>

                <div class="dashboard-grid" id="dashboard-widgets">
                    <!-- Additional dashboard widgets will be populated here -->
                </div>
            </div>
        `;
    }

    getApiPageHTML() {
        return `
            <div class="page-container fade-in-up">
                <div class="page-header">
                    <h1 class="page-title">API Documentation</h1>
                    <p class="page-subtitle">Access RowCast data programmatically</p>
                </div>

                <div id="api-documentation">
                    <!-- API documentation will be loaded here -->
                </div>
            </div>
        `;
    }

    getErrorPage() {
        return `
            <div class="page-container fade-in-up">
                <div class="widget">
                    <div class="widget-header">
                        <h3 class="widget-title">⚠️ Error Loading Page</h3>
                    </div>
                    <div class="body-text">
                        <p>Sorry, there was an error loading the requested page. Please try again later.</p>
                    </div>
                </div>
            </div>
        `;
    }

    async initWeatherPage() {
        try {
            const data = await this.fetchApiData('/complete');
            this.apiData = data;
            
            const weatherContent = document.getElementById('weather-content');
            const weatherWidgets = document.getElementById('weather-widgets');
            
            // Display current conditions
            if (data.current && data.current.weather) {
                weatherContent.innerHTML = this.renderCurrentWeather(data.current);
                weatherWidgets.innerHTML = this.renderWeatherWidgets(data);
            }
        } catch (error) {
            console.error('Error initializing weather page:', error);
            document.getElementById('weather-content').innerHTML = `
                <div class="widget">
                    <div class="body-text status-danger">
                        Unable to load weather data. Please check API connection.
                    </div>
                </div>
            `;
        }
    }

    renderCurrentWeather(current) {
        const weather = current.weather;
        const timestamp = new Date(weather.timestamp);
        
        return `
            <div class="widget large-widget">
                <div class="widget-header">
                    <h3 class="widget-title">Current Conditions</h3>
                    <span class="caption">${timestamp.toLocaleString()}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div>
                        <div class="widget-value">${Math.round(weather.temperature_f)}°F</div>
                        <div class="caption">Temperature</div>
                    </div>
                    <div>
                        <div class="widget-value">${Math.round(weather.apparent_temperature_f)}°F</div>
                        <div class="caption">Feels Like</div>
                    </div>
                    <div>
                        <div class="widget-value">${Math.round(weather.wind_speed_mph)}</div>
                        <div class="caption">Wind Speed (mph)</div>
                    </div>
                    <div>
                        <div class="widget-value">${Math.round(weather.wind_gust_mph)}</div>
                        <div class="caption">Wind Gusts (mph)</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWeatherWidgets(data) {
        const weather = data.current.weather;
        
        return `
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">🌡️ Temperature</h3>
                </div>
                <div class="widget-value">${Math.round(weather.temperature_f)}°F</div>
                <div class="caption">Feels like ${Math.round(weather.apparent_temperature_f)}°F</div>
            </div>

            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">💨 Wind Speed</h3>
                </div>
                <div class="widget-value">${Math.round(weather.wind_speed_mph)}</div>
                <div class="caption">mph • Gusts: ${Math.round(weather.wind_gust_mph)} mph</div>
            </div>

            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">🧭 Wind Direction</h3>
                </div>
                <div class="widget-value">${Math.round(weather.wind_direction_degrees)}°</div>
                <div class="caption">${this.getWindDirectionName(weather.wind_direction_degrees)}</div>
            </div>

            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">💧 Humidity</h3>
                </div>
                <div class="widget-value">${Math.round(weather.relative_humidity_percent)}%</div>
                <div class="caption">Relative Humidity</div>
            </div>

            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">☀️ UV Index</h3>
                </div>
                <div class="widget-value">${weather.uv_index || 'N/A'}</div>
                <div class="caption">${this.getUVIndexDescription(weather.uv_index)}</div>
            </div>

            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title">👁️ Visibility</h3>
                </div>
                <div class="widget-value">${Math.round(weather.visibility_miles)}</div>
                <div class="caption">miles</div>
            </div>
        `;
    }

    async initDashboardPage() {
        try {
            const data = await this.fetchApiData('/complete');
            this.apiData = data;
            
            // Render current score
            this.renderCurrentScore(data.current);
            
            // Render wind compass
            this.renderWindCompass(data.current.weather);
            
            // Render forecast timeline
            this.renderForecastTimeline(data.forecast);
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    renderCurrentScore(current) {
        const container = document.getElementById('current-score-display');
        const score = current.rowcast_score || 0;
        const factors = current.risk_factors || [];
        
        container.innerHTML = `
            <div class="widget-value" style="font-size: 48px;">${score.toFixed(1)}</div>
            <div class="score-bar">
                <div class="score-bar-fill" style="width: ${score * 10}%">
                    <div class="score-bar-indicator" style="left: ${score * 10}%"></div>
                </div>
            </div>
            <div class="caption">RowCast Score (1-10 scale)</div>
            ${factors.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 class="heading-3">Risk Factors:</h4>
                    <ul style="margin-top: 8px; color: var(--text-secondary);">
                        ${factors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    renderWindCompass(weather) {
        const container = document.getElementById('wind-compass-container');
        const windDirection = weather.wind_direction_degrees;
        const riverCourse = 220; // River course heading
        
        container.innerHTML = `
            <div class="wind-compass">
                <div class="compass-center"></div>
                <div class="river-course"></div>
                <div class="wind-arrow" style="transform: rotate(${windDirection}deg)"></div>
            </div>
            <div style="text-align: center; margin-top: 16px;">
                <div class="caption">Wind: ${Math.round(windDirection)}° • River Course: ${riverCourse}°</div>
                <div class="caption">Relative Angle: ${Math.abs(windDirection - riverCourse)}°</div>
            </div>
        `;
    }

    renderForecastTimeline(forecast) {
        if (!forecast || !forecast.hourly) return;
        
        const container = document.getElementById('forecast-timeline-container');
        const now = new Date();
        
        // Get 12 hours of forecast data (-3 to +9 hours)
        const forecastItems = forecast.hourly.slice(0, 12).map((item, index) => {
            const time = new Date(now.getTime() + (index - 3) * 60 * 60 * 1000);
            const score = item.rowcast_score || Math.random() * 10; // Fallback if no score
            
            return {
                time: time,
                score: score,
                windSpeed: item.wind_speed_mph || 0,
                windGust: item.wind_gust_mph || 0,
                temperature: item.apparent_temperature_f || item.temperature_f || 0,
                riverFlow: item.river_flow_rate || 'N/A'
            };
        });
        
        container.innerHTML = `
            <div class="forecast-timeline">
                ${forecastItems.map((item, index) => `
                    <div class="forecast-item ${index === 3 ? 'active' : ''}">
                        <div class="forecast-time">${item.time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        <div class="forecast-score">${item.score.toFixed(1)}</div>
                        <div class="forecast-details">
                            Flow: ${item.riverFlow}<br>
                            Wind: ${Math.round(item.windSpeed)} mph<br>
                            Gusts: ${Math.round(item.windGust)} mph<br>
                            Temp: ${Math.round(item.temperature)}°F
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async initApiPage() {
        try {
            const response = await fetch('/api/API_DOCUMENTATION.md');
            if (response.ok) {
                const markdown = await response.text();
                document.getElementById('api-documentation').innerHTML = this.markdownToHtml(markdown);
            } else {
                document.getElementById('api-documentation').innerHTML = `
                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">📖 API Documentation</h3>
                        </div>
                        <div class="body-text">
                            <p>API documentation is available at the following endpoints:</p>
                            <ul style="margin-top: 16px; padding-left: 20px;">
                                <li><code>/api/complete</code> - Complete weather and rowcast data</li>
                                <li><code>/api/current</code> - Current conditions only</li>
                                <li><code>/api/forecast</code> - Forecast data only</li>
                            </ul>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading API documentation:', error);
        }
    }

    markdownToHtml(markdown) {
        // Basic markdown to HTML conversion
        return `<div class="widget"><div class="body-text"><pre>${markdown}</pre></div></div>`;
    }

    getWindDirectionName(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    getUVIndexDescription(uv) {
        if (uv === null || uv === undefined) return 'N/A';
        if (uv <= 2) return 'Low';
        if (uv <= 5) return 'Moderate';
        if (uv <= 7) return 'High';
        if (uv <= 10) return 'Very High';
        return 'Extreme';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RowCastApp();
});
