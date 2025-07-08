// Weather Page Manager
class WeatherManager {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:5000/api' 
            : 'https://api.samwduncan.com/api';
        this.currentForecastType = '12hour';
        this.weatherRadarWidget = null;
        this.windMapWidget = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    async loadContent() {
        const mainContent = document.getElementById('main-content');
        
        try {
            mainContent.innerHTML = `
                <div class="container mx-auto px-6 py-8">
                    <!-- Weather Header -->
                    <div class="glass-panel rounded-3xl p-8 mb-8">
                        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                            <div>
                                <h1 class="text-3xl font-bold mb-2 flex items-center">
                                    <i class="fas fa-cloud-sun text-blue-400 mr-3"></i>
                                    Weather Conditions
                                </h1>
                                <p class="text-glass-muted">Comprehensive weather data and forecasting</p>
                            </div>
                            <div class="mt-4 lg:mt-0 flex items-center space-x-4">
                                <div class="text-right">
                                    <div class="text-sm text-glass-muted">Last Updated</div>
                                    <div class="text-sm font-medium" id="weather-last-update">--</div>
                                </div>
                                <button onclick="window.weatherManager.refreshData()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Current Weather Conditions -->
                    <div class="grid lg:grid-cols-3 gap-6 mb-8">
                        <!-- Main Weather Info -->
                        <div class="lg:col-span-2 glass-panel rounded-2xl p-6">
                            <h2 class="text-xl font-bold mb-6">Current Conditions</h2>
                            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4" id="current-weather-grid">
                                <!-- Dynamic weather data will be loaded here -->
                            </div>
                        </div>

                        <!-- Weather Alerts -->
                        <div class="glass-panel rounded-2xl p-6">
                            <h3 class="text-lg font-bold mb-4">Weather Alerts</h3>
                            <div id="weather-alerts">
                                <!-- Weather advisories will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Forecast Controls -->
                    <div class="glass-panel rounded-2xl p-6 mb-8">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <h2 class="text-xl font-bold mb-4 sm:mb-0">Weather Forecast</h2>
                            <div class="flex bg-black/20 rounded-xl p-1">
                                <button class="forecast-btn active" data-type="12hour">12 Hour</button>
                                <button class="forecast-btn" data-type="extended">Extended</button>
                            </div>
                        </div>
                        
                        <!-- Forecast Content -->
                        <div id="forecast-content">
                            <!-- Forecast data will be loaded here -->
                        </div>
                    </div>

                    <!-- Weather Widgets Grid -->
                    <div class="grid lg:grid-cols-2 gap-6 mb-8">
                        <!-- Weather Radar Widget -->
                        <div class="glass-panel rounded-2xl p-6">
                            <h3 class="text-lg font-bold mb-4 flex items-center">
                                <i class="fas fa-satellite-dish text-green-400 mr-2"></i>
                                Weather Radar
                            </h3>
                            <div id="weather-radar-widget" class="h-64 bg-black/20 rounded-xl flex items-center justify-center">
                                <div class="text-center">
                                    <i class="fas fa-satellite-dish text-3xl text-green-400 mb-2"></i>
                                    <p class="text-glass-muted">Weather Radar Loading...</p>
                                </div>
                            </div>
                        </div>

                        <!-- Wind Map Widget -->
                        <div class="glass-panel rounded-2xl p-6">
                            <h3 class="text-lg font-bold mb-4 flex items-center">
                                <i class="fas fa-wind text-blue-400 mr-2"></i>
                                Wind Map
                            </h3>
                            <div id="wind-map-widget" class="h-64 bg-black/20 rounded-xl flex items-center justify-center">
                                <div class="text-center">
                                    <i class="fas fa-wind text-3xl text-blue-400 mb-2"></i>
                                    <p class="text-glass-muted">Wind Map Loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Weather Metrics -->
                    <div class="glass-panel rounded-2xl p-6">
                        <h3 class="text-lg font-bold mb-6">Additional Metrics</h3>
                        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4" id="additional-metrics">
                            <!-- Additional weather metrics will be loaded here -->
                        </div>
                    </div>
                </div>
            `;

            // Attach event listeners
            this.attachEventListeners();
            
            // Load weather data
            await this.loadWeatherData();
            await this.load12HourForecast();
            
            // Initialize widgets
            this.initializeWeatherRadar();
            this.initializeWindMap();

        } catch (error) {
            console.error('Error loading weather content:', error);
            this.showErrorState(mainContent);
        }
    }

    attachEventListeners() {
        // Forecast type buttons
        const forecastBtns = document.querySelectorAll('.forecast-btn');
        forecastBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const type = e.target.getAttribute('data-type');
                await this.switchForecastType(type);
            });
        });
    }

    async switchForecastType(type) {
        if (this.currentForecastType === type) return;
        
        this.currentForecastType = type;
        
        // Update button states
        document.querySelectorAll('.forecast-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
            }
        });

        // Load appropriate forecast
        if (type === '12hour') {
            await this.load12HourForecast();
        } else if (type === 'extended') {
            await this.loadExtendedForecast();
        }
    }

    async loadWeatherData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch current weather');
            
            const data = await response.json();
            // Use the correct structure from the API
            const weatherData = data.current?.weather || {};
            this.updateCurrentWeather(weatherData);
            this.updateAdditionalMetrics(weatherData);
            this.updateWeatherAlerts(weatherData);
            
        } catch (error) {
            console.error('Error loading weather data:', error);
        }
    }

    async load12HourForecast() {
        try {
            // Create time range: -3 hours to +9 hours from now
            const now = new Date();
            const startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // -3 hours
            const endTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);   // +9 hours
            
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch forecast');
            
            const data = await response.json();
            this.render12HourForecast(data, startTime, endTime);
            
        } catch (error) {
            console.error('Error loading 12-hour forecast:', error);
            this.showForecastError();
        }
    }

    async loadExtendedForecast() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/weather/extended`);
            if (!response.ok) throw new Error('Failed to fetch extended forecast');
            
            const data = await response.json();
            this.renderExtendedForecast(data);
            
        } catch (error) {
            console.error('Error loading extended forecast:', error);
            this.showForecastError();
        }
    }

    updateCurrentWeather(data) {
        const grid = document.getElementById('current-weather-grid');
        if (!grid) return;

        // Use actual humidity data from API, or calculate fallback if not available
        const humidity = data.humidity || this.calculateHumidity(data.currentTemp, data.apparentTemp);

        const metrics = [
            { label: 'Temperature', value: `${Math.round(data.currentTemp || 0)}°F`, icon: 'fas fa-thermometer-half', color: 'text-red-400' },
            { label: 'Feels Like', value: `${Math.round(data.apparentTemp || 0)}°F`, icon: 'fas fa-thermometer-half', color: 'text-orange-400' },
            { label: 'Wind Speed', value: `${Math.round(data.windSpeed || 0)} mph`, icon: 'fas fa-wind', color: 'text-blue-400' },
            { label: 'Wind Gusts', value: `${Math.round(data.windGust || 0)} mph`, icon: 'fas fa-wind', color: 'text-purple-400' },
            { label: 'Humidity', value: `${Math.round(humidity)}%`, icon: 'fas fa-tint', color: 'text-teal-400' },
            { label: 'Precipitation', value: `${Math.round(data.precipitation || 0)}%`, icon: 'fas fa-cloud-rain', color: 'text-indigo-400' }
        ];

        grid.innerHTML = metrics.map(metric => `
            <div class="widget-glass rounded-xl p-4 text-center">
                <i class="${metric.icon} ${metric.color} text-xl mb-2"></i>
                <div class="text-lg font-bold">${metric.value}</div>
                <div class="text-xs text-glass-muted">${metric.label}</div>
            </div>
        `).join('');

        // Update last update time
        const updateElement = document.getElementById('weather-last-update');
        if (updateElement && data.timestamp) {
            updateElement.textContent = new Date(data.timestamp).toLocaleTimeString();
        }
    }

    updateAdditionalMetrics(data) {
        const grid = document.getElementById('additional-metrics');
        if (!grid) return;

        const additionalMetrics = [
            { label: 'UV Index', value: data.uvIndex || 'N/A', icon: 'fas fa-sun', color: 'text-yellow-400' },
            { label: 'Air Quality', value: data.airQuality || 'Good', icon: 'fas fa-lungs', color: 'text-green-400' },
            { label: 'Visibility', value: data.visibility ? `${Math.round(data.visibility / 1000)} mi` : 'N/A', icon: 'fas fa-eye', color: 'text-blue-400' },
            { label: 'Wind Direction', value: data.windDir || 'N/A', icon: 'fas fa-compass', color: 'text-purple-400' }
        ];

        grid.innerHTML = additionalMetrics.map(metric => `
            <div class="widget-glass rounded-xl p-4 text-center">
                <i class="${metric.icon} ${metric.color} text-xl mb-2"></i>
                <div class="text-lg font-bold">${metric.value}</div>
                <div class="text-xs text-glass-muted">${metric.label}</div>
            </div>
        `).join('');
    }

    updateWeatherAlerts(data) {
        const alertsContainer = document.getElementById('weather-alerts');
        if (!alertsContainer) return;

        // Check for weather advisories or alerts
        const alerts = data.weatherAlerts || [];
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
                    <p class="text-glass-muted">No active weather alerts</p>
                </div>
            `;
        } else {
            alertsContainer.innerHTML = alerts.map(alert => `
                <div class="mb-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-triangle text-yellow-400 mr-2 mt-1"></i>
                        <div>
                            <div class="font-medium text-yellow-400">${alert.headline || alert.type}</div>
                            <div class="text-sm text-glass-muted mt-1">${alert.description}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    render12HourForecast(data, startTime, endTime) {
        const container = document.getElementById('forecast-content');
        if (!container) return;

        // Use the forecast data from the complete API response
        const forecastData = data.forecast?.rowcastScores || [];
        const filteredForecast = forecastData.filter(item => {
            const itemTime = new Date(item.timestamp);
            return itemTime >= startTime && itemTime <= endTime;
        });

        container.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${filteredForecast.map(item => {
                    const time = new Date(item.timestamp);
                    const hour = time.getHours();
                    const displayTime = hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
                    const conditions = item.conditions || {};
                    
                    return `
                        <div class="widget-glass rounded-xl p-4 text-center">
                            <div class="text-sm text-glass-muted mb-2">${displayTime}</div>
                            <i class="fas fa-cloud text-2xl text-blue-400 mb-2"></i>
                            <div class="text-lg font-bold mb-1">${Math.round(conditions.apparentTemp || 0)}°F</div>
                            <div class="text-xs text-glass-muted mb-1">${Math.round(conditions.windSpeed || 0)} mph</div>
                            <div class="text-xs text-blue-400">${Math.round(conditions.precipitation || 0)}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderExtendedForecast(data) {
        const container = document.getElementById('forecast-content');
        if (!container) return;

        // Use extended forecast data and group by day
        const forecastData = data.forecast || [];
        const dailyData = this.groupExtendedWeatherByDay(forecastData);
        
        // Store data for tooltips
        this.currentExtendedData = dailyData;
        
        container.innerHTML = `
            <div class="space-y-3" id="extended-forecast-container">
                ${dailyData.map((day, index) => `
                    <div class="widget-glass rounded-xl overflow-hidden" data-day-index="${index}">
                        <div class="day-header p-4 cursor-pointer hover:bg-white/5 transition-colors" onclick="window.weatherManager.toggleDayExpansion(${index})">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <i class="fas fa-chevron-right transition-transform duration-300 text-blue-400 mr-3" id="chevron-${index}"></i>
                                    <div>
                                        <div class="font-medium">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                        <div class="text-sm text-glass-muted">${day.hours.length} hour forecast • ${Math.round(day.avgPrecip)}% precipitation</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold">${Math.round(day.maxTemp)}° / ${Math.round(day.minTemp)}°</div>
                                    <div class="text-sm text-glass-muted">${Math.round(day.avgWind)} mph • ${Math.round(day.humidity)}% humidity</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="hourly-content hidden border-t border-white/10" id="hourly-${index}">
                            <div class="p-4">
                                <h4 class="text-sm font-medium text-glass-muted mb-3">Hourly Forecast</h4>
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    ${day.hours.map((hour, hourIndex) => {
                                        const time = new Date(hour.timestamp);
                                        const hourValue = time.getHours();
                                        const hourDisplay = hourValue === 0 ? '12 AM' : 
                                                          hourValue === 12 ? '12 PM' :
                                                          hourValue < 12 ? `${hourValue} AM` : 
                                                          `${hourValue - 12} PM`;
                                        return `
                                            <div class="hour-item glass-subtle rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-all relative text-center flex flex-col items-center justify-center min-h-28" 
                                                 onclick="window.weatherManager.toggleHourTooltip(${index}, ${hourIndex}, event)"
                                                 data-hour-index="${hourIndex}">
                                                <div class="text-xs text-glass-muted mb-1 text-center w-full">${hourDisplay}</div>
                                                <div class="text-sm font-medium mb-1 text-center w-full">${Math.round(hour.currentTemp || 0)}°F</div>
                                                <div class="text-xs space-y-1 text-center w-full">
                                                    <div class="text-blue-400">${Math.round(hour.windSpeed || 0)} mph</div>
                                                    <div class="text-purple-400">${Math.round(hour.windGust || 0)} gust</div>
                                                    <div class="text-teal-400">${Math.round(hour.humidity || this.calculateHumidity(hour.currentTemp, hour.apparentTemp))}%</div>
                                                </div>
                                                <i class="fas fa-${this.getWeatherIcon(hour)} text-lg text-center w-full mt-2"></i>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Hour Tooltip -->
            <div id="hour-tooltip" class="fixed z-50 hidden rounded-xl p-4 shadow-2xl max-w-sm" style="background: #1a1a1a; border: 1px solid #555555; color: #ffffff; line-height: 1.4;">
                <div id="tooltip-content"></div>
                <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45" style="background: #1a1a1a; border: 1px solid #555555;"></div>
            </div>
        `;
        
        // Add click outside handler for tooltip
        document.addEventListener('click', this.hideTooltipOnClickOutside.bind(this));
    }

    groupExtendedWeatherByDay(forecastData) {
        const dailyGroups = {};
        
        forecastData.forEach(item => {
            const date = new Date(item.timestamp);
            const dateKey = date.toDateString();
            
            if (!dailyGroups[dateKey]) {
                dailyGroups[dateKey] = {
                    date: dateKey,
                    hours: [],
                    temps: [],
                    apparentTemps: [],
                    winds: [],
                    windGusts: [],
                    precipitation: [],
                    visibility: [],
                    humidity: []
                };
            }
            
            // Store the complete hour data
            dailyGroups[dateKey].hours.push(item);
            
            // Also collect for averages
            dailyGroups[dateKey].temps.push(item.currentTemp || 0);
            dailyGroups[dateKey].apparentTemps.push(item.apparentTemp || 0);
            dailyGroups[dateKey].winds.push(item.windSpeed || 0);
            dailyGroups[dateKey].windGusts.push(item.windGust || 0);
            dailyGroups[dateKey].precipitation.push(item.precipitation || 0);
            dailyGroups[dateKey].visibility.push(item.visibility || 15000);
            // Calculate humidity if not provided
            const humidity = item.humidity || this.calculateHumidity(item.currentTemp, item.apparentTemp);
            dailyGroups[dateKey].humidity.push(humidity);
        });
        
        return Object.values(dailyGroups).map(group => ({
            date: group.date,
            hours: group.hours,
            avgTemp: group.temps.reduce((a, b) => a + b, 0) / group.temps.length || 0,
            minTemp: Math.min(...group.temps) || 0,
            maxTemp: Math.max(...group.temps) || 0,
            avgApparentTemp: group.apparentTemps.reduce((a, b) => a + b, 0) / group.apparentTemps.length || 0,
            avgWind: group.winds.reduce((a, b) => a + b, 0) / group.winds.length || 0,
            maxWindGust: Math.max(...group.windGusts) || 0,
            avgPrecip: group.precipitation.reduce((a, b) => a + b, 0) / group.precipitation.length || 0,
            avgVisibility: group.visibility.reduce((a, b) => a + b, 0) / group.visibility.length || 15000,
            humidity: group.humidity.reduce((a, b) => a + b, 0) / group.humidity.length || 50
        }));
    }

    toggleDayExpansion(dayIndex) {
        const hourlyContent = document.getElementById(`hourly-${dayIndex}`);
        const chevron = document.getElementById(`chevron-${dayIndex}`);
        
        if (!hourlyContent || !chevron) return;
        
        if (hourlyContent.classList.contains('hidden')) {
            // Expand
            hourlyContent.classList.remove('hidden');
            chevron.classList.add('rotate-90');
        } else {
            // Collapse
            hourlyContent.classList.add('hidden');
            chevron.classList.remove('rotate-90');
        }
    }

    toggleHourTooltip(dayIndex, hourIndex, event) {
        const tooltip = document.getElementById('hour-tooltip');
        const tooltipContent = document.getElementById('tooltip-content');
        
        if (!tooltip || !tooltipContent) return;
        
        // Hide tooltip if clicking the same hour
        if (tooltip.dataset.activeHour === `${dayIndex}-${hourIndex}`) {
            tooltip.classList.add('hidden');
            tooltip.dataset.activeHour = '';
            return;
        }
        
        // Get hour data
        const dailyData = this.currentExtendedData;
        if (!dailyData || !dailyData[dayIndex] || !dailyData[dayIndex].hours[hourIndex]) return;
        
        const hourData = dailyData[dayIndex].hours[hourIndex];
        const time = new Date(hourData.timestamp);
        
        // Format tooltip content
        tooltipContent.innerHTML = `
            <div class="text-sm font-medium mb-2">${time.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                hour12: true
            })}</div>
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Temperature:</span>
                        <span class="text-red-400">${Math.round(hourData.currentTemp || 0)}°F</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Feels Like:</span>
                        <span class="text-orange-400">${Math.round(hourData.apparentTemp || 0)}°F</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Humidity:</span>
                        <span class="text-teal-400">${Math.round(hourData.humidity || this.calculateHumidity(hourData.currentTemp, hourData.apparentTemp))}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">UV Index:</span>
                        <span class="text-yellow-400">${hourData.uvIndex || 'N/A'}</span>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Wind:</span>
                        <span class="text-blue-400">${Math.round(hourData.windSpeed || 0)} mph</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Gusts:</span>
                        <span class="text-purple-400">${Math.round(hourData.windGust || 0)} mph</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Precipitation:</span>
                        <span class="text-indigo-400">${Math.round(hourData.precipitation || 0)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Visibility:</span>
                        <span class="text-gray-400">${Math.round((hourData.visibility || 15000) / 1000)} mi</span>
                    </div>
                </div>
            </div>
            ${hourData.windDir ? `<div class="mt-2 text-xs text-glass-muted">Wind Direction: <span class="text-blue-400">${hourData.windDir}</span></div>` : ''}
        `;
        
        // Position tooltip - find the hour item element
        const hourItemElement = event.target.closest('.hour-item');
        if (!hourItemElement) return;
        
        const rect = hourItemElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Show tooltip first to get its dimensions
        tooltip.classList.remove('hidden');
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // For smaller screens, prioritize positioning above/below the element
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 15;
        
        // Enhanced responsive positioning
        if (viewportWidth < 768) {
            // Center tooltip horizontally over the target element
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            
            // Try to position above the element first
            if (rect.top - tooltipRect.height - 15 > 0) {
                top = rect.top - tooltipRect.height - 15;
            } else {
                // Position below if not enough space above
                top = rect.bottom + 15;
            }
        }
        
        // Ensure tooltip stays within viewport bounds
        const margin = 10;
        
        // Horizontal bounds checking
        if (left + tooltipRect.width > viewportWidth - margin) {
            left = viewportWidth - tooltipRect.width - margin;
        }
        if (left < margin) {
            left = margin;
        }
        
        // Vertical bounds checking
        if (top + tooltipRect.height > viewportHeight - margin) {
            top = viewportHeight - tooltipRect.height - margin;
        }
        if (top < margin) {
            top = margin;
        }
        
        // Use scroll-aware positioning
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        tooltip.style.left = `${left + scrollLeft}px`;
        tooltip.style.top = `${top + scrollTop}px`;
        tooltip.dataset.activeHour = `${dayIndex}-${hourIndex}`;
    }

    getWeatherIcon(hourData) {
        const temp = hourData.currentTemp || 0;
        const precipitation = hourData.precipitation || 0;
        const wind = hourData.windSpeed || 0;
        
        if (precipitation > 70) return 'cloud-rain';
        if (precipitation > 30) return 'cloud-drizzle';
        if (wind > 20) return 'wind';
        if (temp > 80) return 'sun';
        if (temp < 40) return 'snowflake';
        return 'cloud-sun';
    }

    hideTooltipOnClickOutside(event) {
        const tooltip = document.getElementById('hour-tooltip');
        if (!tooltip || tooltip.classList.contains('hidden')) return;
        
        // Check if click is outside tooltip and hour items
        if (!event.target.closest('#hour-tooltip') && !event.target.closest('.hour-item')) {
            tooltip.classList.add('hidden');
            tooltip.dataset.activeHour = '';
        }
    }

    async initializeWeatherRadar() {
        const radarWidget = document.getElementById('weather-radar-widget');
        if (!radarWidget) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch weather data');
            
            const data = await response.json();
            const weather = data.current?.weather || {};
            const precipitation = weather.precipitation || 0;
            const visibility = weather.visibility || 15000;
            
            // Create a more informative radar display
            radarWidget.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-green-900/20 to-blue-900/20 rounded-xl relative overflow-hidden">
                    <div class="absolute inset-2 border border-green-400/30 rounded-lg">
                        <div class="absolute inset-0 flex flex-col justify-center items-center">
                            <div class="grid grid-cols-8 gap-1 w-32 h-32 mb-4">
                                ${this.generateRadarGrid(precipitation)}
                            </div>
                            <div class="text-center">
                                <p class="text-green-400 text-sm font-bold">Weather Radar</p>
                                <p class="text-xs text-glass-muted">Philadelphia Region</p>
                                <div class="mt-2 text-xs">
                                    <div class="text-blue-400">Precip: ${Math.round(precipitation)}%</div>
                                    <div class="text-gray-400">Vis: ${Math.round(visibility/1000)}mi</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="absolute top-4 right-4 text-xs text-green-400 animate-pulse">LIVE</div>
                    <div class="absolute bottom-4 left-4 text-xs text-green-400">39.95°N 75.17°W</div>
                </div>
            `;
        } catch (error) {
            console.error('Error initializing weather radar:', error);
            radarWidget.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-red-900/20 to-gray-900/20 rounded-xl relative overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-2"></i>
                            <p class="text-red-400 text-sm">Radar Offline</p>
                            <p class="text-xs text-glass-muted">Data unavailable</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    generateRadarGrid(precipitation) {
        const intensity = Math.min(precipitation / 100, 1);
        let grid = '';
        
        for (let i = 0; i < 64; i++) {
            const random = Math.random();
            let cellClass = 'bg-gray-800/20';
            
            if (intensity > 0.1 && random < intensity * 0.3) {
                cellClass = 'bg-blue-400/40';
            } else if (intensity > 0.3 && random < intensity * 0.2) {
                cellClass = 'bg-yellow-400/60';
            } else if (intensity > 0.6 && random < intensity * 0.1) {
                cellClass = 'bg-red-400/80';
            }
            
            grid += `<div class="w-3 h-3 ${cellClass} rounded-sm"></div>`;
        }
        
        return grid;
    }

    async initializeWindMap() {
        const windWidget = document.getElementById('wind-map-widget');
        if (!windWidget) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch wind data');
            
            const data = await response.json();
            const weather = data.current?.weather || {};
            const windSpeed = weather.windSpeed || 0;
            const windGust = weather.windGust || 0;
            const windDir = weather.windDir || 'N';
            const windDegrees = this.extractWindDirection(windDir);
            
            // Create a functional wind map
            windWidget.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl relative overflow-hidden">
                    <div class="absolute inset-2 border border-blue-400/30 rounded-lg">
                        <div class="absolute inset-0 flex flex-col justify-center items-center">
                            <div class="relative w-32 h-32 mb-4">
                                <!-- Wind direction compass -->
                                <div class="absolute inset-0 border-2 border-blue-400/30 rounded-full"></div>
                                <div class="absolute inset-4 border border-blue-400/20 rounded-full"></div>
                                
                                <!-- Wind arrow -->
                                <div class="absolute top-1/2 left-1/2 w-16 h-1 bg-blue-400 transform -translate-x-1/2 -translate-y-1/2 origin-center rounded" 
                                     style="transform: translate(-50%, -50%) rotate(${windDegrees}deg);">
                                    <div class="absolute -right-2 -top-1 w-0 h-0 border-l-4 border-l-blue-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                                </div>
                                
                                <!-- Wind particles -->
                                ${this.generateWindParticles(windSpeed)}
                                
                                <!-- Cardinal directions -->
                                <div class="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs text-blue-400/60">N</div>
                                <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-blue-400/60">S</div>
                                <div class="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-blue-400/60">W</div>
                                <div class="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-blue-400/60">E</div>
                            </div>
                            
                            <div class="text-center">
                                <p class="text-blue-400 text-sm font-bold">Wind Map</p>
                                <p class="text-xs text-glass-muted">Schuylkill River</p>
                                <div class="mt-2 text-xs">
                                    <div class="text-blue-400">${Math.round(windSpeed)} mph ${windDir}</div>
                                    <div class="text-purple-400">Gusts: ${Math.round(windGust)} mph</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="absolute top-4 right-4 text-xs text-blue-400 animate-pulse">LIVE</div>
                    <div class="absolute bottom-4 left-4 text-xs text-blue-400">Boathouse Row</div>
                </div>
            `;
        } catch (error) {
            console.error('Error initializing wind map:', error);
            windWidget.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-red-900/20 to-gray-900/20 rounded-xl relative overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-2"></i>
                            <p class="text-red-400 text-sm">Wind Map Offline</p>
                            <p class="text-xs text-glass-muted">Data unavailable</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    generateWindParticles(windSpeed) {
        const particleCount = Math.min(Math.floor(windSpeed / 2), 12);
        let particles = '';
        
        for (let i = 0; i < particleCount; i++) {
            const delay = Math.random() * 2;
            const duration = 1 + Math.random() * 2;
            const opacity = 0.3 + Math.random() * 0.4;
            
            particles += `
                <div class="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse" 
                     style="
                         top: ${20 + Math.random() * 60}%; 
                         left: ${20 + Math.random() * 60}%; 
                         opacity: ${opacity};
                         animation-delay: ${delay}s;
                         animation-duration: ${duration}s;
                     "></div>
            `;
        }
        
        return particles;
    }

    extractWindDirection(windDir) {
        if (!windDir) return 0;
        
        // Extract degrees from "NW (315°)" format
        const match = windDir.match(/\((\d+)°\)/);
        if (match) {
            return parseInt(match[1]);
        }
        
        // Convert cardinal directions to degrees
        const directions = {
            'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
            'S': 180, 'SW': 225, 'W': 270, 'NW': 315
        };
        
        return directions[windDir] || 0;
    }

    calculateHumidity(temp, apparentTemp) {
        if (!temp || !apparentTemp) return 50; // Default estimate
        
        // Simplified humidity estimation based on heat index formula
        // When apparent temp is significantly higher than actual temp, humidity is high
        const tempDiff = apparentTemp - temp;
        
        if (tempDiff >= 10) return 85; // Very high humidity
        if (tempDiff >= 7) return 75;  // High humidity  
        if (tempDiff >= 4) return 65;  // Moderate-high humidity
        if (tempDiff >= 2) return 55;  // Moderate humidity
        if (tempDiff >= 0) return 45;  // Lower humidity
        return 35; // Low humidity when feels-like is less than actual
    }

    async refreshData(event) {
        let button, icon;
        
        if (event) {
            button = event.target.closest('button');
            icon = button?.querySelector('i');
        } else {
            // Find refresh button if called directly
            button = document.querySelector('[onclick*="refreshData"]');
            icon = button?.querySelector('i');
        }
        
        // Add spinning animation if icon exists
        if (icon) {
            icon.classList.add('animate-spin');
        }
        
        try {
            await this.loadWeatherData();
            if (this.currentForecastType === '12hour') {
                await this.load12HourForecast();
            } else {
                await this.loadExtendedForecast();
            }
            
            // Refresh widgets
            await this.initializeWeatherRadar();
            await this.initializeWindMap();
        } finally {
            // Remove spinning animation
            if (icon) {
                icon.classList.remove('animate-spin');
            }
        }
    }

    showForecastError() {
        const container = document.getElementById('forecast-content');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-4"></i>
                    <p class="text-glass-muted">Unable to load forecast data</p>
                </div>
            `;
        }
    }

    showErrorState(container) {
        container.innerHTML = `
            <div class="container mx-auto px-6 py-12">
                <div class="glass-panel rounded-3xl p-12 text-center">
                    <i class="fas fa-cloud-rain text-4xl text-blue-400 mb-6"></i>
                    <h2 class="text-2xl font-bold mb-4">Weather Data Unavailable</h2>
                    <p class="text-glass-muted mb-6">Unable to load weather information at this time.</p>
                    <button onclick="window.weatherManager.loadContent()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

// Add CSS for forecast buttons
const style = document.createElement('style');
style.textContent = `
    .forecast-btn {
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        background: transparent;
        color: rgba(255, 255, 255, 0.6);
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .forecast-btn.active,
    .forecast-btn:hover {
        background: rgba(0, 122, 255, 0.3);
        color: white;
    }
`;
document.head.appendChild(style);

// Initialize weather manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.weatherManager = new WeatherManager();
    await window.weatherManager.init();
});
