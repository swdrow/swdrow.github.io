// Dashboard JavaScript
class RowCastDashboard {
    constructor() {
        // Use relative URLs for API requests when running through Vite proxy (port 3000-3002)
        // Use direct Flask server when running on static server (port 8000)
        const vitePort = window.location.port;
        this.baseURL = (['3000', '3001', '3002'].includes(vitePort)) ? '' : 'http://localhost:5000';
        this.currentData = null;
        this.forecastData = null;
        this.charts = {};
        this.currentPage = 0;
        this.itemsPerPage = 6;
        this.currentTimeRange = '24h';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeTooltips();
        this.showLoading();
        await this.loadInitialData();
        this.hideLoading();
        this.startDataRefresh();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Time range selector
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimeRange(btn.dataset.range);
            });
        });

        // Refresh button
        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });
    }

    showSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).parentElement.classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Load section-specific data
        if (sectionId === 'api-docs') {
            this.loadAPIDocumentation();
        }
    }

    async loadInitialData() {
        try {
            // Load current data first (includes forecast)
            await this.loadCurrentData();
            
            // Extract forecast data from current data
            if (this.currentData && this.currentData.forecast) {
                this.forecastData = this.currentData.forecast.rowcastScores || [];
                console.log('Extracted forecast data:', this.forecastData);
            }
            
            // Load extended data separately
            await this.loadExtendedData();
            
            this.updateDashboard();
            this.updateForecastWidget();
            this.updateDetailedForecast();
            this.updateCurrentConditions();
            await this.updateDetailedForecastTable();
            this.updateQuickForecast();
            this.updateWindMap();
            await this.initializeCharts();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load data. Please try again.');
        }
    }

    async loadCurrentData() {
        try {
            console.log('Loading current data from:', `${this.baseURL}/api/complete`);
            const response = await fetch(`${this.baseURL}/api/complete`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.currentData = await response.json();
            console.log('Current data loaded:', this.currentData);
        } catch (error) {
            console.error('Error loading current data:', error);
            throw error;
        }
    }

    async loadForecastData() {
        // Forecast data is already included in the complete API call
        // Set it from the current data if available
        if (this.currentData && this.currentData.forecast && this.currentData.forecast.rowcastScores) {
            this.forecastData = this.currentData.forecast.rowcastScores;
            console.log('Using forecast data from complete API:', this.forecastData);
        } else {
            // Fallback to separate API call
            try {
                const response = await fetch(`${this.baseURL}/api/rowcast/forecast`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                this.forecastData = await response.json();
                console.log('Loaded forecast data from separate API:', this.forecastData);
            } catch (error) {
                console.error('Error loading forecast data:', error);
                throw error;
            }
        }
    }

    async loadExtendedData() {
        try {
            const response = await fetch(`${this.baseURL}/api/rowcast/forecast/extended`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.extendedData = await response.json();
        } catch (error) {
            console.error('Error loading extended data:', error);
            // Extended data is optional, don't throw
        }
    }

    updateDashboard() {
        if (!this.currentData) {
            console.log('No current data available');
            return;
        }

        console.log('Updating dashboard with data:', this.currentData);
        const current = this.currentData.current;
        
        // Update current score
        const score = current.rowcastScore || 0;
        console.log('Updating score:', score);
        
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = score.toFixed(1);
            console.log('Score element updated');
        } else {
            console.error('Score element not found');
        }
        
        // Update score bar
        const scoreFill = document.getElementById('score-fill');
        if (scoreFill) {
            scoreFill.style.width = `${(score / 10) * 100}%`;
            console.log('Score bar updated');
        } else {
            console.error('Score fill element not found');
        }
        
        // Update score color
        if (scoreElement) {
            scoreElement.className = this.getScoreClass(score);
        }

        // Update current stats
        if (current.water) {
            document.getElementById('current-flow').textContent = 
                current.water.discharge ? `${current.water.discharge.toLocaleString()}` : '--';
            document.getElementById('current-water-temp').textContent = 
                current.water.waterTemp ? `${current.water.waterTemp.toFixed(1)}` : '--';
        }

        if (current.weather) {
            const windDisplay = current.weather.windSpeed ? 
                `${current.weather.windSpeed.toFixed(1)} ${current.weather.windDir || ''}` : '--';
            document.getElementById('current-wind').textContent = windDisplay;
            document.getElementById('current-temp').textContent = 
                current.weather.apparentTemp ? `${current.weather.apparentTemp.toFixed(1)}` : '--';
        }

        // Update last updated time (convert to local timezone)
        const lastUpdated = new Date(this.currentData.lastUpdated);
        document.getElementById('last-updated').textContent = 
            lastUpdated.toLocaleTimeString('en-US', { 
                timeZone: 'America/New_York', // EST/EDT timezone
                hour12: true, 
                hour: 'numeric', 
                minute: '2-digit' 
            });
    }

    updateForecastWidget(filteredData = null) {
        const data = filteredData || this.getCurrentForecastData();
        console.log('Forecast data for widget:', data);
        if (!data || !data.length) {
            console.log('No forecast data available');
            return;
        }

        const container = document.getElementById('forecast-grid');
        if (!container) {
            console.error('Forecast grid container not found');
            return;
        }
        
        // When using filtered data (day selection), show all hours, otherwise use pagination
        if (filteredData) {
            container.innerHTML = '';
            data.forEach(item => {
                const card = this.createForecastCard(item);
                container.appendChild(card);
            });
            // Hide pagination when showing filtered data
            document.getElementById('prev-page').disabled = true;
            document.getElementById('next-page').disabled = true;
            document.getElementById('page-indicator').textContent = `Day View`;
        } else {
            // Normal pagination behavior
            const startIndex = this.currentPage * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageData = data.slice(startIndex, endIndex);

            container.innerHTML = '';
            pageData.forEach(item => {
                const card = this.createForecastCard(item);
                container.appendChild(card);
            });

            this.updatePagination(data.length);
        }
    }

    createForecastCard(data) {
        const card = document.createElement('div');
        card.className = 'forecast-card';

        const time = new Date(data.timestamp);
        const timeStr = time.toLocaleString('en-US', {
            timeZone: 'America/New_York', // EST/EDT timezone
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            hour12: true
        });
        
        const score = data.score || 0;
        const scoreClass = this.getScoreClass(score);

        card.innerHTML = `
            <div class="forecast-time">${timeStr}</div>
            <div class="forecast-score ${scoreClass}">${score.toFixed(1)}</div>
            <div class="forecast-details">
                <div class="forecast-detail">
                    <span class="forecast-detail-label">Flow</span>
                    <span class="forecast-detail-value">${this.formatValue(data.conditions?.discharge, 'cfs')}</span>
                </div>
                <div class="forecast-detail">
                    <span class="forecast-detail-label">Wind</span>
                    <span class="forecast-detail-value">${this.formatValue(data.conditions?.windSpeed, 'mph')}</span>
                </div>
                <div class="forecast-detail">
                    <span class="forecast-detail-label">Gusts</span>
                    <span class="forecast-detail-value">${this.formatValue(data.conditions?.windGust, 'mph')}</span>
                </div>
                <div class="forecast-detail">
                    <span class="forecast-detail-label">Temp</span>
                    <span class="forecast-detail-value">${this.formatValue(data.conditions?.apparentTemp, '°F')}</span>
                </div>
            </div>
        `;

        return card;
    }

    updateDetailedForecast(filteredData = null) {
        const data = filteredData || this.getCurrentForecastData();
        if (!data || !data.length) return;

        const tbody = document.querySelector('#detailed-forecast-table tbody');
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            const time = new Date(item.timestamp);
            const conditions = item.conditions || {};
            
            const score = item.score || 0;
            const scoreClass = this.getScoreClass(score);
            const conditionsClass = this.getConditionsClass(score);

            row.innerHTML = `
                <td>${time.toLocaleString('en-US', { 
                    timeZone: 'America/New_York', // EST/EDT timezone
                    month: 'short',
                    day: 'numeric', 
                    hour: 'numeric', 
                    hour12: true 
                })}</td>
                <td><span class="score-cell ${scoreClass}">${score.toFixed(1)}</span></td>
                <td>${this.formatValue(conditions.discharge, 'cfs')}</td>
                <td>${this.formatValue(conditions.windSpeed, 'mph')}</td>
                <td>${this.formatValue(conditions.windGust, 'mph')}</td>
                <td>${this.formatValue(conditions.apparentTemp, '°F')}</td>
                <td>${this.formatValue(conditions.waterTemp, '°F')}</td>
                <td><span class="conditions-indicator ${conditionsClass}">${this.getConditionsText(score)}</span></td>
            `;

            tbody.appendChild(row);
        });
    }

    updateCurrentConditions() {
        if (!this.currentData) return;

        this.updateWeatherDetails();
        this.updateWaterDetails();
        this.updateSafetyDetails();
    }

    updateWeatherDetails() {
        const weather = this.currentData.current?.weather;
        if (!weather) return;

        const container = document.getElementById('weather-details');
        container.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Temperature</span>
                <span class="detail-value">${this.formatValue(weather.currentTemp, '°F')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Feels Like</span>
                <span class="detail-value">${this.formatValue(weather.apparentTemp, '°F')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wind Speed</span>
                <span class="detail-value">${this.formatValue(weather.windSpeed, 'mph')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wind Gusts</span>
                <span class="detail-value">${this.formatValue(weather.windGust, 'mph')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wind Direction</span>
                <span class="detail-value">${weather.windDir || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">UV Index</span>
                <span class="detail-value">${weather.uvIndex || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Visibility</span>
                <span class="detail-value">${this.formatValue(weather.visibility, 'mi')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Precipitation</span>
                <span class="detail-value">${this.formatValue(weather.precipitation, 'in')}</span>
            </div>
        `;
    }

    updateWaterDetails() {
        const water = this.currentData.current?.water;
        if (!water) return;

        const container = document.getElementById('water-details');
        container.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Discharge</span>
                <span class="detail-value">${this.formatValue(water.discharge, 'cfs')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Water Temperature</span>
                <span class="detail-value">${this.formatValue(water.waterTemp, '°F')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Gauge Height</span>
                <span class="detail-value">${this.formatValue(water.gaugeHeight, 'ft')}</span>
            </div>
        `;
    }

    updateSafetyDetails() {
        const weather = this.currentData.current?.weather;
        const score = this.currentData.current?.rowcastScore || 0;
        
        const container = document.getElementById('safety-details');
        
        let alertsHtml = '';
        if (weather?.weatherAlerts && weather.weatherAlerts.length > 0) {
            alertsHtml = weather.weatherAlerts.map(alert => `
                <div class="alert alert-warning">
                    <strong>${alert.type || 'Weather Alert'}</strong>
                    ${alert.description ? `<br>${alert.description}` : ''}
                </div>
            `).join('');
        }
        
        const safetyLevel = this.getSafetyLevel(score);
        const safetyClass = this.getConditionsClass(score);

        container.innerHTML = `
            ${alertsHtml}
            <div class="detail-item">
                <span class="detail-label">Safety Level</span>
                <span class="detail-value">
                    <span class="conditions-indicator ${safetyClass}">${safetyLevel}</span>
                </span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Recommendation</span>
                <span class="detail-value">${this.getSafetyRecommendation(score)}</span>
            </div>
        `;
    }

    // ===== ENHANCED FORECASTING FUNCTIONALITY =====
    
    async generateForecastData() {
        // Generate 48-hour detailed forecast with RowCast scoring
        const now = new Date();
        const forecastData = [];
        
        for (let i = 0; i < 48; i++) {
            const timestamp = new Date(now.getTime() + (i * 60 * 60 * 1000));
            
            // Simulate realistic weather patterns
            const baseTemp = 65 + Math.sin((i / 24) * Math.PI * 2) * 15; // Daily temperature cycle
            const windVariation = Math.sin((i / 6) * Math.PI) * 5 + Math.random() * 3;
            const pressurePattern = 1013 + Math.sin((i / 12) * Math.PI) * 10;
            
            const conditions = {
                windSpeed: Math.max(0, 8 + windVariation),
                windDirection: (180 + i * 7.5) % 360, // Gradually changing wind direction
                windGust: Math.max(0, 12 + windVariation + Math.random() * 5),
                temperature: baseTemp + Math.random() * 5 - 2.5,
                apparentTemp: baseTemp + Math.random() * 3,
                humidity: 60 + Math.sin((i / 8) * Math.PI) * 20 + Math.random() * 10,
                pressure: pressurePattern + Math.random() * 5,
                visibility: 10 - Math.random() * 2,
                cloudCover: Math.min(100, Math.max(0, 40 + Math.sin((i / 16) * Math.PI) * 30 + Math.random() * 20)),
                precipChance: Math.max(0, Math.sin((i / 18) * Math.PI) * 30 + Math.random() * 10),
                discharge: 1500 + Math.sin((i / 48) * Math.PI) * 200 + Math.random() * 100,
                waterTemp: 58 + Math.sin(((now.getMonth() + i/24/30) / 12) * Math.PI * 2) * 15
            };
            
            // Calculate RowCast score based on conditions
            const score = this.calculateAdvancedRowCastScore(conditions);
            
            forecastData.push({
                timestamp: timestamp.toISOString(),
                score: score,
                conditions: conditions,
                summary: this.generateConditionSummary(score, conditions)
            });
        }
        
        return forecastData;
    }
    
    calculateAdvancedRowCastScore(conditions) {
        let score = 10;
        
        // Wind factors (weight: 35%)
        const windScore = this.calculateWindScore(conditions.windSpeed, conditions.windGust);
        
        // Water factors (weight: 25%)
        const waterScore = this.calculateWaterScore(conditions.discharge, conditions.waterTemp);
        
        // Weather factors (weight: 25%)
        const weatherScore = this.calculateWeatherScore(conditions.temperature, conditions.precipChance, conditions.visibility);
        
        // Comfort factors (weight: 15%)
        const comfortScore = this.calculateComfortScore(conditions.apparentTemp, conditions.humidity);
        
        score = (windScore * 0.35) + (waterScore * 0.25) + (weatherScore * 0.25) + (comfortScore * 0.15);
        
        return Math.max(0, Math.min(10, score));
    }
    
    calculateWindScore(windSpeed, windGust) {
        let windScore = 10;
        
        // Ideal wind: 0-8 mph
        if (windSpeed > 15) windScore -= 4;
        else if (windSpeed > 12) windScore -= 2;
        else if (windSpeed > 8) windScore -= 1;
        
        // Gust penalty
        if (windGust > 25) windScore -= 3;
        else if (windGust > 20) windScore -= 2;
        else if (windGust > 15) windScore -= 1;
        
        return Math.max(0, windScore);
    }
    
    calculateWaterScore(discharge, waterTemp) {
        let waterScore = 10;
        
        // Ideal flow: 1000-3000 ft³/s
        if (discharge > 4000 || discharge < 600) waterScore -= 3;
        else if (discharge > 3500 || discharge < 800) waterScore -= 2;
        else if (discharge > 3000 || discharge < 1000) waterScore -= 1;
        
        // Water temperature (ideal: 55-75°F)
        if (waterTemp < 45 || waterTemp > 80) waterScore -= 2;
        else if (waterTemp < 50 || waterTemp > 75) waterScore -= 1;
        
        return Math.max(0, waterScore);
    }
    
    calculateWeatherScore(temperature, precipChance, visibility) {
        let weatherScore = 10;
        
        // Temperature comfort (ideal: 60-80°F)
        if (temperature < 40 || temperature > 90) weatherScore -= 3;
        else if (temperature < 50 || temperature > 85) weatherScore -= 2;
        else if (temperature < 55 || temperature > 80) weatherScore -= 1;
        
        // Precipitation penalty
        if (precipChance > 70) weatherScore -= 3;
        else if (precipChance > 50) weatherScore -= 2;
        else if (precipChance > 30) weatherScore -= 1;
        
        // Visibility
        if (visibility < 5) weatherScore -= 2;
        else if (visibility < 8) weatherScore -= 1;
        
        return Math.max(0, weatherScore);
    }
    
    calculateComfortScore(apparentTemp, humidity) {
        let comfortScore = 10;
        
        // Apparent temperature comfort
        if (apparentTemp < 45 || apparentTemp > 85) comfortScore -= 2;
        else if (apparentTemp < 55 || apparentTemp > 80) comfortScore -= 1;
        
        // Humidity comfort
        if (humidity > 80) comfortScore -= 2;
        else if (humidity > 70) comfortScore -= 1;
        else if (humidity < 30) comfortScore -= 1;
        
        return Math.max(0, comfortScore);
    }
    
    generateConditionSummary(score, conditions) {
        if (score >= 8.5) return "Excellent rowing conditions";
        if (score >= 7) return "Good rowing conditions";
        if (score >= 5) return "Fair conditions - some challenges";
        if (score >= 3) return "Poor conditions - not recommended";
        return "Dangerous conditions - avoid rowing";
    }
    
    // ===== WIND MAP FUNCTIONALITY =====
    
    updateWindMap() {
        const windData = this.currentData?.wind || this.getSimulatedWindData();
        
        // Update main wind arrow
        const mainArrow = document.getElementById('main-wind-arrow');
        const mainSpeedLabel = document.getElementById('main-wind-speed');
        
        if (mainArrow && windData) {
            const rotation = windData.direction || 0;
            mainArrow.style.transform = `rotate(${rotation}deg)`;
        }
        
        if (mainSpeedLabel && windData) {
            mainSpeedLabel.textContent = `${Math.round(windData.speed || 0)} mph`;
        }
        
        // Update secondary wind arrows with slight variations
        const secondaryArrows = document.querySelectorAll('.secondary-wind-arrow');
        const secondaryLabels = document.querySelectorAll('.secondary-wind-speed');
        
        secondaryArrows.forEach((arrow, index) => {
            const variation = (Math.random() - 0.5) * 30; // ±15 degree variation
            const speedVariation = (Math.random() - 0.5) * 4; // ±2 mph variation
            
            const direction = (windData.direction || 0) + variation;
            const speed = Math.max(0, (windData.speed || 0) + speedVariation);
            
            arrow.style.transform = `rotate(${direction}deg)`;
            
            if (secondaryLabels[index]) {
                secondaryLabels[index].textContent = `${Math.round(speed)} mph`;
            }
        });
    }
    
    getSimulatedWindData() {
        const now = new Date();
        const hour = now.getHours();
        
        // Simulate daily wind patterns
        const baseSpeed = 6 + Math.sin((hour / 24) * Math.PI * 2) * 3;
        const baseDirection = 180 + hour * 15; // Wind direction changes throughout day
        
        return {
            speed: baseSpeed + Math.random() * 4,
            direction: baseDirection % 360,
            gust: baseSpeed + 3 + Math.random() * 5
        };
    }
    
    // ===== ENHANCED FORECAST TABLE =====
    
    async updateDetailedForecastTable() {
        let forecastData = this.forecastData;
        
        if (!forecastData || forecastData.length === 0) {
            forecastData = await this.generateForecastData();
            this.forecastData = forecastData;
        }
        
        const tbody = document.getElementById('forecast-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Show next 48 hours in 3-hour intervals
        const filteredData = forecastData.filter((_, index) => index % 3 === 0);
        
        filteredData.forEach(item => {
            const row = document.createElement('tr');
            const time = new Date(item.timestamp);
            const conditions = item.conditions || {};
            
            const scoreClass = this.getScoreClass(item.score);
            
            row.innerHTML = `
                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="font-weight: 600;">${time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">${time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</div>
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid var(--border-color);">
                    <div class="score-badge ${scoreClass}" style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">
                        ${item.score.toFixed(1)}
                    </div>
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="font-size: 0.9rem;">${item.summary}</div>
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="margin-bottom: 0.25rem;">${Math.round(conditions.windSpeed || 0)} mph</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Gusts: ${Math.round(conditions.windGust || 0)} mph</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${this.getWindDirection(conditions.windDirection)}</div>
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="margin-bottom: 0.25rem;">${Math.round(conditions.discharge || 0)} ft³/s</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Water: ${Math.round(conditions.waterTemp || 0)}°F</div>
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="margin-bottom: 0.25rem;">${Math.round(conditions.temperature || 0)}°F</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Feels: ${Math.round(conditions.apparentTemp || 0)}°F</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Rain: ${Math.round(conditions.precipChance || 0)}%</div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    getWindDirection(degrees) {
        if (!degrees && degrees !== 0) return 'N/A';
        
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }
    
    // ===== QUICK FORECAST WIDGET =====
    
    updateQuickForecast() {
        let forecastData = this.forecastData;
        
        if (!forecastData || forecastData.length === 0) {
            forecastData = this.generateForecastData();
            this.forecastData = forecastData;
        }
        
        const container = document.getElementById('quick-forecast');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show next 6 hours
        const quickData = forecastData.slice(1, 7); // Skip current hour, show next 6
        
        quickData.forEach(item => {
            const time = new Date(item.timestamp);
            const scoreClass = this.getScoreClass(item.score);
            
            const card = document.createElement('div');
            card.style.cssText = `
                text-align: center;
                padding: 0.75rem;
                background: var(--tertiary-dark);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            `;
            
            card.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    ${time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                </div>
                <div class="score-badge ${scoreClass}" style="display: inline-block; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; margin-bottom: 0.5rem;">
                    ${item.score.toFixed(1)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${Math.round(item.conditions.windSpeed || 0)} mph wind
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    // ===== ENHANCED CHART FUNCTIONALITY =====
    
    async initializeCharts() {
        await this.createRowCastForecastChart();
        await this.createWindForecastChart();
        this.setupChartUpdates();
    }
    
    async createRowCastForecastChart() {
        let forecastData = this.forecastData;
        
        if (!forecastData || forecastData.length === 0) {
            forecastData = await this.generateForecastData();
            this.forecastData = forecastData;
        }
        
        const ctx = document.getElementById('rowcast-forecast-chart');
        if (!ctx || this.charts.rowcastForecast) return;
        
        // Use 48 hours of data
        const chartData = forecastData.slice(0, 48);
        
        this.charts.rowcastForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(item => {
                    const time = new Date(item.timestamp);
                    return time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                }),
                datasets: [{
                    label: 'RowCast Score',
                    data: chartData.map(item => item.score),
                    borderColor: '#00a8ff',
                    backgroundColor: 'rgba(0, 168, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 8
                        }
                    }
                }
            }
        });
    }
    
    async createWindForecastChart() {
        let forecastData = this.forecastData;
        
        if (!forecastData || forecastData.length === 0) {
            forecastData = await this.generateForecastData();
            this.forecastData = forecastData;
        }
        
        const ctx = document.getElementById('wind-forecast-chart');
        if (!ctx || this.charts.windForecast) return;
        
        // Use 24 hours of data for wind chart
        const chartData = forecastData.slice(0, 24);
        
        this.charts.windForecast = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(item => {
                    const time = new Date(item.timestamp);
                    return time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                }),
                datasets: [{
                    label: 'Wind Speed (mph)',
                    data: chartData.map(item => item.conditions.windSpeed),
                    backgroundColor: 'rgba(108, 92, 231, 0.6)',
                    borderColor: '#6c5ce7',
                    borderWidth: 1
                }, {
                    label: 'Wind Gusts (mph)',
                    data: chartData.map(item => item.conditions.windGust),
                    backgroundColor: 'rgba(255, 107, 129, 0.6)',
                    borderColor: '#ff6b81',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 8
                        }
                    }
                }
            }
        });
    }
    
    setupChartUpdates() {
        // Update charts every 10 minutes
        setInterval(() => {
            this.updateCharts();
        }, 600000);
    }
    
    async updateCharts() {
        // Regenerate forecast data
        this.forecastData = await this.generateForecastData();
        
        // Update RowCast forecast chart
        if (this.charts.rowcastForecast) {
            const chartData = this.forecastData.slice(0, 48);
            this.charts.rowcastForecast.data.labels = chartData.map(item => {
                const time = new Date(item.timestamp);
                return time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            });
            this.charts.rowcastForecast.data.datasets[0].data = chartData.map(item => item.score);
            this.charts.rowcastForecast.update();
        }
        
        // Update wind forecast chart
        if (this.charts.windForecast) {
            const chartData = this.forecastData.slice(0, 24);
            this.charts.windForecast.data.labels = chartData.map(item => {
                const time = new Date(item.timestamp);
                return time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            });
            this.charts.windForecast.data.datasets[0].data = chartData.map(item => item.conditions.windSpeed);
            this.charts.windForecast.data.datasets[1].data = chartData.map(item => item.conditions.windGust);
            this.charts.windForecast.update();
        }
    }

    // ===== TIME RANGE AND NAVIGATION =====
    
    setTimeRange(range) {
        this.currentTimeRange = range;
        this.currentPage = 0;
        
        // Update active button
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-range="${range}"]`)?.classList.add('active');
        
        // Update forecast display based on range
        this.updateForecastForTimeRange(range);
    }
    
    async updateForecastForTimeRange(range) {
        let data = this.forecastData;
        
        if (!data || data.length === 0) {
            data = await this.generateForecastData();
            this.forecastData = data;
        }
        
        let filteredData = data;
        
        switch (range) {
            case '6h':
                filteredData = data.slice(0, 6);
                break;
            case '24h':
                filteredData = data.slice(0, 24);
                break;
            case '48h':
                filteredData = data.slice(0, 48);
                break;
        }
        
        this.updateForecastWidget(filteredData);
        await this.updateDetailedForecastTable();
        this.updateQuickForecast();
    }
}
