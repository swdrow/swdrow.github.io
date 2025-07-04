// Enhanced Dashboard JavaScript with Forecasting
class RowCastDashboard {
    constructor() {
        // Improved URL detection strategy
        const currentPort = window.location.port;
        const currentProtocol = window.location.protocol;
        const currentHostname = window.location.hostname;
        
        console.log('🌐 Current location:', window.location.href);
        console.log('🔌 Port:', currentPort, 'Protocol:', currentProtocol, 'Hostname:', currentHostname);
        
        // Try different approaches based on environment
        if (currentPort === '8000' || currentPort === '8001') {
            // Served from local HTTP server - try same origin first, then direct Flask
            this.baseURL = '';
            this.fallbackURL = 'http://localhost:5000';
        } else if (['3000', '3001', '3002', '4173'].includes(currentPort)) {
            // Vite dev/preview server - use proxy
            this.baseURL = '';
            this.fallbackURL = 'http://localhost:5000';
        } else {
            // Production or other - try relative first
            this.baseURL = '';
            this.fallbackURL = 'http://localhost:5000';
        }
        
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
        // Navigation - works with both original sidebar and SPA
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
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
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    showSection(sectionId) {
        // Update navigation if in original dashboard mode
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (navLink) {
            navLink.parentElement.classList.add('active');
        }

        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Load section-specific data
        if (sectionId === 'api-docs') {
            this.loadAPIDocumentation();
        }
    }

    async loadInitialData() {
        try {
            // Load current data (includes forecast)
            await this.loadCurrentData();

            // Use API forecast if available, otherwise simulate
            if (this.currentData && this.currentData.forecast && Array.isArray(this.currentData.forecast.rowcastScores) && this.currentData.forecast.rowcastScores.length > 0) {
                this.forecastData = this.currentData.forecast.rowcastScores;
            } else {
                this.forecastData = await this.generateForecastData();
            }

            // Update all dashboard components
            this.updateDashboard();
            this.updateQuickForecast();
            await this.updateDetailedForecastTable();
            this.updateWindMap();
            await this.initializeCharts();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load data. Please try again.');
        }
    }

    async loadCurrentData() {
        console.log(`🔗 Dashboard attempting to load data from: ${this.baseURL}/api/complete`);
        let apiData = null;
        let successfulUrl = null;
        
        try {
            // Try primary URL first
            try {
                const primaryUrl = `${this.baseURL}/api/complete`;
                console.log('📡 Trying primary URL:', primaryUrl);
                const response = await fetch(primaryUrl);
                
                if (response.ok) {
                    apiData = await response.json();
                    successfulUrl = primaryUrl;
                    console.log('✅ Primary API call successful');
                } else {
                    console.warn('⚠️ Primary API returned status:', response.status, response.statusText);
                }
            } catch (error) {
                console.warn('❌ Primary API URL failed:', error.message);
            }
            
            // If primary failed and we have a fallback, try it
            if (!apiData && this.fallbackURL) {
                try {
                    const fallbackUrl = `${this.fallbackURL}/api/complete`;
                    console.log('📡 Trying fallback URL:', fallbackUrl);
                    const response = await fetch(fallbackUrl);
                    
                    if (response.ok) {
                        apiData = await response.json();
                        successfulUrl = fallbackUrl;
                        console.log('✅ Fallback API call successful');
                    } else {
                        console.warn('⚠️ Fallback API returned status:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.warn('❌ Fallback API URL also failed:', error.message);
                }
            }
            
            if (apiData) {
                // Normalize API response to expected structure
                const water = apiData.current?.water || {};
                const weather = apiData.current?.weather || {};
                
                this.currentData = {
                    score: apiData.current?.rowcastScore ?? null,
                    water: {
                        flow: water.discharge,
                        temperature: water.waterTemp,
                        level: water.gaugeHeight,
                        discharge: water.discharge,
                        waterTemp: water.waterTemp,
                        gaugeHeight: water.gaugeHeight
                    },
                    weather: {
                        temperature: weather.currentTemp,
                        apparent_temperature: weather.apparentTemp,
                        wind_speed: weather.windSpeed,
                        wind_direction: weather.windDir,
                        wind_gust: weather.windGust,
                        // Keep original field names too
                        currentTemp: weather.currentTemp,
                        apparentTemp: weather.apparentTemp,
                        windSpeed: weather.windSpeed,
                        windDir: weather.windDir,
                        windGust: weather.windGust,
                        precipitation: weather.precipitation,
                        uvIndex: weather.uvIndex,
                        visibility: weather.visibility
                    },
                    timestamp: apiData.current?.timestamp ?? null,
                    forecast: apiData.forecast ?? {}
                };
                console.log('✅ Normalized current data from:', successfulUrl);
                console.log('📊 Data:', this.currentData);
            } else {
                console.log('⚠️ No API data available, using simulated data');
                // Fallback to simulated data
                this.currentData = this.getSimulatedCurrentData();
            }
        } catch (error) {
            console.error('❌ Error loading current data:', error);
            this.currentData = this.getSimulatedCurrentData();
        }
    }

    getSimulatedCurrentData() {
        const now = new Date();
        return {
            score: 7.2 + Math.random() * 2,
            water: {
                flow: 1800 + Math.random() * 400,
                temperature: 62 + Math.random() * 8,
                level: 3.2 + Math.random() * 0.5
            },
            weather: {
                temperature: 72 + Math.random() * 10,
                apparent_temperature: 74 + Math.random() * 8,
                humidity: 65 + Math.random() * 15,
                wind_speed: 8 + Math.random() * 6,
                wind_direction: Math.random() * 360,
                wind_gust: 12 + Math.random() * 8
            },
            timestamp: now.toISOString()
        };
    }

    // ===== FORECASTING FUNCTIONALITY =====
    
    async generateForecastData() {
        const now = new Date();
        const forecastData = [];
        
        for (let i = 0; i < 48; i++) {
            const timestamp = new Date(now.getTime() + (i * 60 * 60 * 1000));
            
            // Simulate realistic weather patterns
            const baseTemp = 65 + Math.sin((i / 24) * Math.PI * 2) * 15;
            const windVariation = Math.sin((i / 6) * Math.PI) * 5 + Math.random() * 3;
            const pressurePattern = 1013 + Math.sin((i / 12) * Math.PI) * 10;
            
            const conditions = {
                windSpeed: Math.max(0, 8 + windVariation),
                windDirection: (180 + i * 7.5) % 360,
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
            
            // Calculate RowCast score
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
        
        // Wind factors (35% weight)
        const windScore = this.calculateWindScore(conditions.windSpeed, conditions.windGust);
        
        // Water factors (25% weight)
        const waterScore = this.calculateWaterScore(conditions.discharge, conditions.waterTemp);
        
        // Weather factors (25% weight)
        const weatherScore = this.calculateWeatherScore(conditions.temperature, conditions.precipChance, conditions.visibility);
        
        // Comfort factors (15% weight)
        const comfortScore = this.calculateComfortScore(conditions.apparentTemp, conditions.humidity);
        
        score = (windScore * 0.35) + (waterScore * 0.25) + (weatherScore * 0.25) + (comfortScore * 0.15);
        
        return Math.max(0, Math.min(10, score));
    }
    
    calculateWindScore(windSpeed, windGust) {
        let windScore = 10;
        
        if (windSpeed > 15) windScore -= 4;
        else if (windSpeed > 12) windScore -= 2;
        else if (windSpeed > 8) windScore -= 1;
        
        if (windGust > 25) windScore -= 3;
        else if (windGust > 20) windScore -= 2;
        else if (windGust > 15) windScore -= 1;
        
        return Math.max(0, windScore);
    }
    
    calculateWaterScore(discharge, waterTemp) {
        let waterScore = 10;
        
        if (discharge > 4000 || discharge < 600) waterScore -= 3;
        else if (discharge > 3500 || discharge < 800) waterScore -= 2;
        else if (discharge > 3000 || discharge < 1000) waterScore -= 1;
        
        if (waterTemp < 45 || waterTemp > 80) waterScore -= 2;
        else if (waterTemp < 50 || waterTemp > 75) waterScore -= 1;
        
        return Math.max(0, waterScore);
    }
    
    calculateWeatherScore(temperature, precipChance, visibility) {
        let weatherScore = 10;
        
        if (temperature < 40 || temperature > 90) weatherScore -= 3;
        else if (temperature < 50 || temperature > 85) weatherScore -= 2;
        else if (temperature < 55 || temperature > 80) weatherScore -= 1;
        
        if (precipChance > 70) weatherScore -= 3;
        else if (precipChance > 50) weatherScore -= 2;
        else if (precipChance > 30) weatherScore -= 1;
        
        if (visibility < 5) weatherScore -= 2;
        else if (visibility < 8) weatherScore -= 1;
        
        return Math.max(0, weatherScore);
    }
    
    calculateComfortScore(apparentTemp, humidity) {
        let comfortScore = 10;
        
        if (apparentTemp < 45 || apparentTemp > 85) comfortScore -= 2;
        else if (apparentTemp < 55 || apparentTemp > 80) comfortScore -= 1;
        
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

    // ===== DASHBOARD UPDATES =====
    
    updateDashboard() {
        this.updateCurrentScore();
        this.updateCurrentConditions();
    }
    
    updateCurrentScore() {
        const currentScore = this.currentData ? this.currentData.score : (this.forecastData ? this.forecastData[0].score : 7.5);
        
        // Update all possible score element IDs
        const scoreElements = document.querySelectorAll('#current-score, #dashboard-score, #rowcast-score');
        const fillElements = document.querySelectorAll('#score-fill, #dashboard-score-fill');
        const timestampElements = document.querySelectorAll('#score-timestamp');
        
        scoreElements.forEach(el => {
            if (el) {
                el.textContent = currentScore.toFixed(1);
            }
        });
        
        fillElements.forEach(el => {
            if (el) {
                el.style.width = `${(currentScore / 10) * 100}%`;
                // Update color based on score
                if (currentScore >= 7) {
                    el.style.background = 'var(--accent-green)';
                } else if (currentScore >= 4) {
                    el.style.background = 'var(--accent-orange)';
                } else {
                    el.style.background = '#ff6b6b';
                }
            }
        });
        
        timestampElements.forEach(el => {
            if (el) {
                el.textContent = new Date().toLocaleTimeString();
            }
        });
    }
    
    updateCurrentConditions() {
        const data = this.currentData || {};
        const water = data.water || {};
        const weather = data.weather || {};
        
        // Water conditions with fallbacks
        const flow = water.flow || water.discharge || 1800;
        const waterTemp = water.temperature || water.waterTemp || 62;
        const gaugeHeight = water.level || water.gaugeHeight || 7.0;
        
        // Weather conditions with fallbacks
        const windSpeed = weather.wind_speed || weather.windSpeed || 8;
        const windGust = weather.wind_gust || weather.windGust || 12;
        const windDir = weather.wind_direction || weather.windDir || 'N';
        const airTemp = weather.temperature || weather.currentTemp || 72;
        const apparentTemp = weather.apparent_temperature || weather.apparentTemp || 74;
        
        // Update all possible element IDs (different sections use different IDs)
        
        // Flow/Discharge
        this.updateElement('#current-flow', `${Math.round(flow).toLocaleString()} ft³/s`);
        this.updateElement('#R-Discharge', `${Math.round(flow).toLocaleString()}`);
        
        // Wind Speed
        this.updateElement('#current-wind', `${Math.round(windSpeed)} mph`);
        this.updateElement('#R-WindSpeed', `${Math.round(windSpeed)}`);
        
        // Wind Gusts
        this.updateElement('#R-Gusts', `${Math.round(windGust)}`);
        
        // Wind Direction
        this.updateElement('#R-Direction', `${windDir}`);
        
        // Water Temperature
        this.updateElement('#current-water-temp', `${Math.round(waterTemp)}°F`);
        this.updateElement('#R-Temp', `${Math.round(waterTemp)}`);
        
        // Water Height/Gauge
        this.updateElement('#R-Height', `${gaugeHeight.toFixed(1)}`);
        
        // Air Temperature
        this.updateElement('#current-air-temp', `${Math.round(airTemp)}°F`);
        this.updateElement('#current-temp', `${Math.round(apparentTemp)}°F`);
    }
    
    updateElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    }

    // ===== FORECAST WIDGETS =====
    
    updateQuickForecast() {
        if (!this.forecastData || this.forecastData.length === 0) return;
        
        const container = document.getElementById('quick-forecast');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show next 6 hours
        const quickData = this.forecastData.slice(1, 7);
        
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
    
    async updateDetailedForecastTable() {
        if (!this.forecastData || this.forecastData.length === 0) return;
        
        const tbody = document.getElementById('forecast-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Show 48 hours in 3-hour intervals
        const filteredData = this.forecastData.filter((_, index) => index % 3 === 0);
        
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

    // ===== WIND MAP FUNCTIONALITY =====
    
    updateWindMap() {
        const windData = this.getSimulatedWindData();
        
        // Update main wind arrow (Boathouse Row)
        const mainArrow = document.getElementById('main-wind-arrow');
        const mainSpeedLabel = document.getElementById('main-wind-speed');
        
        if (mainArrow && windData) {
            const rotation = windData.direction || 0;
            mainArrow.style.transform = `rotate(${rotation}deg)`;
        }
        
        if (mainSpeedLabel && windData) {
            mainSpeedLabel.textContent = `${Math.round(windData.speed || 0)} mph`;
        }
        
        // Update secondary wind arrows with realistic river variations
        const secondaryArrows = document.querySelectorAll('.secondary-wind-arrow');
        const secondaryLabels = document.querySelectorAll('.secondary-wind-speed');
        
        secondaryArrows.forEach((arrow, index) => {
            // Different variations for different river sections
            const variations = [
                { directionVar: 15, speedVar: 2 },   // Girard Bridge - slight upstream variation
                { directionVar: -10, speedVar: 1 },  // Falls Bridge - downstream shelter
                { directionVar: 20, speedVar: 3 }    // Strawberry Mansion - most upstream, most variation
            ];
            
            const variation = variations[index] || { directionVar: 0, speedVar: 0 };
            
            const direction = (windData.direction || 0) + variation.directionVar + (Math.random() - 0.5) * 10;
            const speed = Math.max(0, (windData.speed || 0) + variation.speedVar + (Math.random() - 0.5) * 2);
            
            arrow.style.transform = `rotate(${direction}deg)`;
            
            if (secondaryLabels[index]) {
                secondaryLabels[index].textContent = `${Math.round(speed)} mph`;
            }
        });
        
        // Update wind direction text displays
        this.updateWindDirectionText(windData);
    }
    
    updateWindDirectionText(windData) {
        // Update any wind direction text elements
        const windDirElements = document.querySelectorAll('.wind-direction-text');
        windDirElements.forEach(element => {
            element.textContent = this.getWindDirection(windData.direction);
        });
    }
    
    getSimulatedWindData() {
        if (this.currentData && this.currentData.weather) {
            return {
                speed: this.currentData.weather.wind_speed,
                direction: this.currentData.weather.wind_direction,
                gust: this.currentData.weather.wind_gust
            };
        }
        
        const now = new Date();
        const hour = now.getHours();
        
        const baseSpeed = 6 + Math.sin((hour / 24) * Math.PI * 2) * 3;
        const baseDirection = 180 + hour * 15;
        
        return {
            speed: baseSpeed + Math.random() * 4,
            direction: baseDirection % 360,
            gust: baseSpeed + 3 + Math.random() * 5
        };
    }

    // ===== CHARTS =====
    
    async initializeCharts() {
        await this.createRowCastForecastChart();
        await this.createWindForecastChart();
    }
    
    async createRowCastForecastChart() {
        const ctx = document.getElementById('rowcast-forecast-chart');
        if (!ctx || this.charts.rowcastForecast) return;
        
        const chartData = this.forecastData.slice(0, 48);
        
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
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff', maxTicksLimit: 8 }
                    }
                }
            }
        });
    }
    
    async createWindForecastChart() {
        const ctx = document.getElementById('wind-forecast-chart');
        if (!ctx || this.charts.windForecast) return;
        
        const chartData = this.forecastData.slice(0, 24);
        
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
                    legend: { labels: { color: '#ffffff' } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff', maxTicksLimit: 8 }
                    }
                }
            }
        });
    }

    // ===== TIME RANGE FUNCTIONALITY =====
    
    setTimeRange(range) {
        this.currentTimeRange = range;
        
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-range="${range}"]`)?.classList.add('active');
        
        this.updateForecastForTimeRange(range);
    }
    
    async updateForecastForTimeRange(range) {
        if (!this.forecastData) return;
        
        let filteredData = this.forecastData;
        
        switch (range) {
            case '6h':
                filteredData = this.forecastData.slice(0, 6);
                break;
            case '24h':
                filteredData = this.forecastData.slice(0, 24);
                break;
            case '48h':
                filteredData = this.forecastData.slice(0, 48);
                break;
        }
        
        await this.updateDetailedForecastTable();
        this.updateQuickForecast();
    }

    // ===== UTILITY FUNCTIONS =====
    
    getScoreClass(score) {
        if (score >= 8.5) return 'score-excellent';
        if (score >= 7) return 'score-good';
        if (score >= 5) return 'score-fair';
        if (score >= 3) return 'score-poor';
        return 'score-dangerous';
    }
    
    getWindDirection(degrees) {
        if (!degrees && degrees !== 0) return 'N/A';
        
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    // ===== REFRESH AND LOADING =====
    
    async refreshData() {
        this.showLoading();
        try {
            await this.loadCurrentData();
            if (this.currentData && this.currentData.forecast && Array.isArray(this.currentData.forecast.rowcastScores) && this.currentData.forecast.rowcastScores.length > 0) {
                this.forecastData = this.currentData.forecast.rowcastScores;
            } else {
                this.forecastData = await this.generateForecastData();
            }
            this.updateDashboard();
            this.updateQuickForecast();
            await this.updateDetailedForecastTable();
            this.updateWindMap();
        } catch (error) {
            console.error('Refresh error:', error);
            this.showError('Failed to refresh data. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    startDataRefresh() {
        setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }
    
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('show');
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('show');
    }
    
    showError(message) {
        console.error('Dashboard error:', message);
        // Could implement a toast notification here
    }

    // ===== API DOCUMENTATION =====
    
    async loadAPIDocumentation() {
        const container = document.getElementById('api-docs-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="glass-card">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    <i class="fas fa-book"></i>
                    RowCast API Documentation
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    Comprehensive API for accessing real-time rowing conditions and forecast data.
                </p>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: var(--accent-blue); margin-bottom: 1rem;">Current Conditions</h4>
                    <div style="background: var(--tertiary-dark); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <code style="color: var(--accent-green);">GET /api/complete</code>
                        <p style="margin-top: 0.5rem; color: var(--text-muted);">Returns current RowCast score, weather, and water conditions</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: var(--accent-blue); margin-bottom: 1rem;">Forecast Data</h4>
                    <div style="background: var(--tertiary-dark); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <code style="color: var(--accent-green);">GET /api/forecast</code>
                        <p style="margin-top: 0.5rem; color: var(--text-muted);">Returns 48-hour forecast with RowCast scoring</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: var(--accent-blue); margin-bottom: 1rem;">Response Format</h4>
                    <pre style="background: var(--primary-dark); padding: 1rem; border-radius: 8px; color: var(--text-primary); overflow-x: auto;">
{
  "score": 7.2,
  "weather": {
    "temperature": 72,
    "wind_speed": 8,
    "wind_direction": 180
  },
  "water": {
    "flow": 1800,
    "temperature": 62
  },
  "forecast": [...]
}
                    </pre>
                </div>
            </div>
        `;
    }

    // ===== TOOLTIP SYSTEM =====
    
    initializeTooltips() {
        // Create tooltip element if it doesn't exist
        if (!document.getElementById('tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(tooltip);
        }

        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, element.dataset.tooltip);
            });

            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            element.addEventListener('mousemove', (e) => {
                this.positionTooltip(e);
            });
        });
    }

    showTooltip(event, text) {
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = text;
        tooltip.style.opacity = '1';
        this.positionTooltip(event);
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.opacity = '0';
    }

    positionTooltip(event) {
        const tooltip = document.getElementById('tooltip');
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.pageX + 10;
        let top = event.pageY - 10;

        if (left + tooltipRect.width > viewportWidth) {
            left = event.pageX - tooltipRect.width - 10;
        }

        if (top - tooltipRect.height < 0) {
            top = event.pageY + 20;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

// ===== GLOBAL FUNCTIONS =====

function refreshData() {
    if (window.dashboard) {
        window.dashboard.refreshData();
    }
}

function loadForecastData(timeRange) {
    if (window.dashboard) {
        window.dashboard.setTimeRange(timeRange);
    }
}

function changeForecastPage(direction) {
    if (window.dashboard) {
        window.dashboard.changeForecastPage(direction);
    }
}

// Initialize dashboard when DOM is loaded OR when dashboard section is activated
function initializeDashboard() {
    if (!window.dashboard && document.getElementById('current-score')) {
        console.log('🚀 Initializing RowCast Dashboard...');
        window.dashboard = new RowCastDashboard();
    } else if (!document.getElementById('current-score')) {
        console.log('⏳ Dashboard content not ready yet, will initialize when content loads');
    }
}

// Try to initialize immediately if content already exists
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

// Also initialize when dashboard content is loaded
window.addEventListener('dashboardContentLoaded', () => {
    console.log('📍 Dashboard content loaded event received');
    initializeDashboard();
});
