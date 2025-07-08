// Dashboard Page Manager
class DashboardManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentTimespan = '12hour';
        this.currentDay = 0; // 0 = today
        this.maxDays = 7;
        this.windDirectionChart = null;
        this.rowcastChart = null;
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
                    <!-- Dashboard Header -->
                    <div class="glass-panel rounded-3xl p-8 mb-8">
                        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                            <div>
                                <h1 class="text-3xl font-bold mb-2 flex items-center">
                                    <i class="fas fa-chart-line text-purple-400 mr-3"></i>
                                    RowCast Dashboard
                                </h1>
                                <p class="text-glass-muted">Advanced rowing condition analytics and forecasting</p>
                            </div>
                            <div class="mt-4 lg:mt-0 flex items-center space-x-4">
                                <div class="text-right">
                                    <div class="text-sm text-glass-muted">Last Updated</div>
                                    <div class="text-sm font-medium" id="dashboard-last-update">--</div>
                                </div>
                                <button onclick="window.dashboardManager.refreshData()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">
                                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Current RowCast Score -->
                    <div class="glass-panel rounded-3xl p-8 mb-8">
                        <h2 class="text-2xl font-bold mb-6 text-center">Current RowCast Score</h2>
                        <div class="flex flex-col items-center">
                            <div class="text-6xl font-bold mb-4" id="current-rowcast-score">--</div>
                            <div class="w-full max-w-md">
                                <div class="score-bar-glass rounded-full h-4 mb-4 relative overflow-hidden">
                                    <div class="score-fill h-full rounded-full transition-all duration-1000" id="score-fill-bar" style="width: 0%"></div>
                                </div>
                                <div class="flex justify-between text-sm text-glass-muted">
                                    <span>1 (Poor)</span>
                                    <span>5 (Fair)</span>
                                    <span>10 (Excellent)</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Risk Factors -->
                        <div class="mt-8">
                            <h3 class="text-lg font-bold mb-4 text-center">Risk Factors</h3>
                            <div id="risk-factors" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <!-- Risk factors will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Forecast Controls -->
                    <div class="glass-panel rounded-2xl p-6 mb-8">
                        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                            <h2 class="text-xl font-bold mb-4 lg:mb-0">RowCast Forecast</h2>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <!-- Timespan Selector -->
                                <div class="flex bg-black/20 rounded-xl p-1">
                                    <button class="timespan-btn active" data-timespan="12hour">12 Hour</button>
                                    <button class="timespan-btn" data-timespan="extended">Extended</button>
                                </div>
                                
                                <!-- Day Navigation -->
                                <div class="flex items-center bg-black/20 rounded-xl p-1">
                                    <button onclick="window.dashboardManager.changeDay(-1)" class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" id="prev-day-btn">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <span class="px-4 py-2 text-sm font-medium" id="current-day-display">Today</span>
                                    <button onclick="window.dashboardManager.changeDay(1)" class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" id="next-day-btn">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Forecast Content -->
                        <div id="forecast-content">
                            <!-- Forecast data will be loaded here -->
                        </div>
                    </div>

                    <!-- Wind Direction Visualization -->
                    <div class="grid lg:grid-cols-2 gap-6 mb-8">
                        <!-- Wind Direction Relative to Race Course -->
                        <div class="glass-panel rounded-2xl p-6">
                            <h3 class="text-lg font-bold mb-4 flex items-center">
                                <i class="fas fa-compass text-blue-400 mr-2"></i>
                                Wind vs Race Course
                            </h3>
                            <div id="wind-direction-widget" class="h-64 flex items-center justify-center">
                                <!-- Wind direction visualization will be loaded here -->
                            </div>
                            <div class="mt-4 text-sm text-glass-muted text-center">
                                Race course runs 220° (SW direction)
                            </div>
                        </div>

                        <!-- Current Conditions Summary -->
                        <div class="glass-panel rounded-2xl p-6">
                            <h3 class="text-lg font-bold mb-4">Current Conditions</h3>
                            <div class="space-y-4" id="current-conditions-summary">
                                <!-- Current conditions will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- RowCast Score Trend Chart -->
                    <div class="glass-panel rounded-2xl p-6">
                        <h3 class="text-lg font-bold mb-4">RowCast Score Trend</h3>
                        <div class="h-64">
                            <canvas id="rowcast-trend-chart"></canvas>
                        </div>
                    </div>
                </div>
            `;

            // Attach event listeners
            this.attachEventListeners();
            
            // Load dashboard data
            await this.loadDashboardData();
            await this.loadForecastData();
            this.initializeWindDirection();
            this.initializeRowcastChart();

        } catch (error) {
            console.error('Error loading dashboard content:', error);
            this.showErrorState(mainContent);
        }
    }

    attachEventListeners() {
        // Timespan buttons
        const timespanBtns = document.querySelectorAll('.timespan-btn');
        timespanBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const timespan = e.target.getAttribute('data-timespan');
                await this.switchTimespan(timespan);
            });
        });
    }

    async switchTimespan(timespan) {
        if (this.currentTimespan === timespan) return;
        
        this.currentTimespan = timespan;
        this.currentDay = 0; // Reset to today when changing timespan
        
        // Update button states
        document.querySelectorAll('.timespan-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-timespan') === timespan) {
                btn.classList.add('active');
            }
        });

        // Update day display
        this.updateDayDisplay();
        
        // Load appropriate forecast
        await this.loadForecastData();
    }

    changeDay(delta) {
        const newDay = this.currentDay + delta;
        if (newDay >= 0 && newDay < this.maxDays) {
            this.currentDay = newDay;
            this.updateDayDisplay();
            this.loadForecastData();
        }
    }

    updateDayDisplay() {
        const display = document.getElementById('current-day-display');
        const prevBtn = document.getElementById('prev-day-btn');
        const nextBtn = document.getElementById('next-day-btn');
        
        if (display) {
            if (this.currentDay === 0) {
                display.textContent = 'Today';
            } else if (this.currentDay === 1) {
                display.textContent = 'Tomorrow';
            } else {
                const date = new Date();
                date.setDate(date.getDate() + this.currentDay);
                display.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        }
        
        // Update button states
        if (prevBtn) prevBtn.disabled = this.currentDay === 0;
        if (nextBtn) nextBtn.disabled = this.currentDay >= this.maxDays - 1;
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            
            const data = await response.json();
            this.updateCurrentScore(data);
            this.updateRiskFactors(data);
            this.updateCurrentConditions(data);
            this.updateLastUpdate(data);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadForecastData() {
        try {
            if (this.currentTimespan === 'extended') {
                const response = await fetch(`${this.apiBaseUrl}/rowcast/forecast/extended`);
                if (!response.ok) throw new Error('Failed to fetch extended forecast data');
                
                const extendedData = response.json();
                this.renderExtendedForecast(await extendedData);
            } else {
                const response = await fetch(`${this.apiBaseUrl}/complete`);
                if (!response.ok) throw new Error('Failed to fetch forecast data');
                
                const data = await response.json();
                this.renderForecast(data);
            }
            
        } catch (error) {
            console.error('Error loading forecast data:', error);
            this.showForecastError();
        }
    }

    updateCurrentScore(data) {
        const scoreElement = document.getElementById('current-rowcast-score');
        const fillBar = document.getElementById('score-fill-bar');
        
        if (scoreElement && data.current && data.current.rowcastScore !== undefined) {
            const score = data.current.rowcastScore;
            scoreElement.textContent = score.toFixed(1);
            scoreElement.className = `text-6xl font-bold mb-4 ${this.getScoreColor(score)}`;
            
            // Update score bar
            if (fillBar) {
                const percentage = (score / 10) * 100;
                fillBar.style.width = `${percentage}%`;
            }
        }
    }

    updateRiskFactors(data) {
        const container = document.getElementById('risk-factors');
        if (!container) return;

        const riskFactors = [];
        const weather = data.current?.weather || {};
        const water = data.current?.water || {};
        
        // Analyze various risk factors
        if (weather.windSpeed > 15) {
            riskFactors.push({ 
                icon: 'fas fa-wind', 
                label: 'High Wind Speed', 
                value: `${Math.round(weather.windSpeed)} mph`,
                level: 'warning'
            });
        }
        
        if (weather.precipitation > 30) {
            riskFactors.push({ 
                icon: 'fas fa-cloud-rain', 
                label: 'Precipitation Risk', 
                value: `${Math.round(weather.precipitation)}%`,
                level: 'warning'
            });
        }
        
        if (weather.currentTemp < 40) {
            riskFactors.push({ 
                icon: 'fas fa-thermometer-empty', 
                label: 'Cold Temperature', 
                value: `${Math.round(weather.currentTemp)}°F`,
                level: 'caution'
            });
        }

        if (water.discharge > 5000) {
            riskFactors.push({ 
                icon: 'fas fa-tint', 
                label: 'High Water Flow', 
                value: `${Math.round(water.discharge)} cfs`,
                level: 'warning'
            });
        }

        // If no risk factors, show all clear
        if (riskFactors.length === 0) {
            riskFactors.push({ 
                icon: 'fas fa-check-circle', 
                label: 'Conditions Normal', 
                value: 'All Clear',
                level: 'good'
            });
        }

        container.innerHTML = riskFactors.map(factor => `
            <div class="widget-glass rounded-xl p-4 text-center">
                <i class="${factor.icon} ${this.getRiskLevelColor(factor.level)} text-xl mb-2"></i>
                <div class="text-sm font-medium mb-1">${factor.label}</div>
                <div class="text-lg font-bold ${this.getRiskLevelColor(factor.level)}">${factor.value}</div>
            </div>
        `).join('');
    }

    updateCurrentConditions(data) {
        const container = document.getElementById('current-conditions-summary');
        if (!container) return;

        const weather = data.current?.weather || {};
        const water = data.current?.water || {};

        const conditions = [
            { label: 'River Flow Rate', value: `${Math.round(water.discharge || 0)} cfs`, icon: 'fas fa-tint' },
            { label: 'Wind Speed', value: `${Math.round(weather.windSpeed || 0)} mph`, icon: 'fas fa-wind' },
            { label: 'Wind Gusts', value: `${Math.round(weather.windGust || 0)} mph`, icon: 'fas fa-wind' },
            { label: 'Apparent Temp', value: `${Math.round(weather.apparentTemp || 0)}°F`, icon: 'fas fa-thermometer-half' }
        ];

        container.innerHTML = conditions.map(condition => `
            <div class="flex items-center justify-between p-3 widget-glass rounded-xl">
                <div class="flex items-center">
                    <i class="${condition.icon} text-blue-400 mr-3"></i>
                    <span class="text-sm">${condition.label}</span>
                </div>
                <span class="font-bold">${condition.value}</span>
            </div>
        `).join('');
    }

    renderForecast(data) {
        const container = document.getElementById('forecast-content');
        if (!container) return;

        if (this.currentTimespan === '12hour') {
            this.render12HourForecast(data);
        } else {
            this.renderExtendedForecast(data);
        }
    }

    render12HourForecast(data) {
        const container = document.getElementById('forecast-content');
        const forecastData = data.forecast?.rowcastScores || [];
        
        // Filter for 12-hour period based on current day
        const now = new Date();
        const dayOffset = this.currentDay * 24 * 60 * 60 * 1000;
        const startTime = new Date(now.getTime() + dayOffset - 3 * 60 * 60 * 1000);
        const endTime = new Date(now.getTime() + dayOffset + 9 * 60 * 60 * 1000);
        
        const filteredData = forecastData.filter(item => {
            const itemTime = new Date(item.timestamp);
            return itemTime >= startTime && itemTime <= endTime;
        });

        container.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${filteredData.map(item => {
                    const time = new Date(item.timestamp);
                    const hour = time.getHours();
                    const displayTime = hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
                    const score = item.score || 0;
                    const conditions = item.conditions || {};
                    
                    return `
                        <div class="widget-glass rounded-xl p-4 text-center">
                            <div class="text-sm text-glass-muted mb-2">${displayTime}</div>
                            <div class="text-2xl font-bold mb-2 ${this.getScoreColor(score)}">${score.toFixed(1)}</div>
                            <div class="text-xs text-glass-muted space-y-1">
                                <div>${Math.round(conditions.discharge || 0)} cfs</div>
                                <div>${Math.round(conditions.windGust || 0)} mph gusts</div>
                                <div>${Math.round(conditions.windSpeed || 0)} mph wind</div>
                                <div>${Math.round(conditions.apparentTemp || 0)}°F</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderExtendedForecast(forecastData) {
        const container = document.getElementById('forecast-content');
        if (!container) return;

        // Group RowCast forecast data by day
        const dailyData = this.groupRowcastByDay(forecastData);
        
        // Store data for tooltips
        this.currentExtendedRowcastData = dailyData;
        
        container.innerHTML = `
            <div class="space-y-3" id="extended-rowcast-container">
                ${dailyData.map((day, index) => `
                    <div class="widget-glass rounded-xl overflow-hidden" data-day-index="${index}">
                        <div class="day-header p-4 cursor-pointer hover:bg-white/5 transition-colors" onclick="window.dashboardManager.toggleDayExpansion(${index})">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <i class="fas fa-chevron-right transition-transform duration-300 text-purple-400 mr-3" id="chevron-${index}"></i>
                                    <div>
                                        <div class="font-medium">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                        <div class="text-sm text-glass-muted">${day.hours.length} hour forecast • Avg Score: ${day.avgScore.toFixed(1)}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold ${this.getScoreColor(day.avgScore)}">${day.avgScore.toFixed(1)} RowCast</div>
                                    <div class="text-sm text-glass-muted">Range: ${day.minScore.toFixed(1)} - ${day.maxScore.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="hourly-content hidden border-t border-white/10" id="hourly-${index}">
                            <div class="p-4">
                                <h4 class="text-sm font-medium text-glass-muted mb-3">Hourly RowCast Scores</h4>
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    ${day.hours.map((hour, hourIndex) => {
                                        const time = new Date(hour.timestamp);
                                        const hourValue = time.getHours();
                                        const hourDisplay = hourValue === 0 ? '12 AM' : 
                                                          hourValue === 12 ? '12 PM' :
                                                          hourValue < 12 ? `${hourValue} AM` : 
                                                          `${hourValue - 12} PM`;
                                        return `
                                            <div class="hour-item glass-subtle rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-all relative" 
                                                 onclick="window.dashboardManager.toggleRowcastTooltip(${index}, ${hourIndex}, event)"
                                                 data-hour-index="${hourIndex}">
                                                <div class="text-xs text-glass-muted mb-1">${hourDisplay}</div>
                                                <div class="text-lg font-bold mb-1 ${this.getScoreColor(hour.score)}">${hour.score.toFixed(1)}</div>
                                                <div class="text-xs text-blue-400 mb-1">${Math.round(hour.conditions.windSpeed || 0)} mph</div>
                                                <div class="text-xs text-teal-400">${Math.round(hour.conditions.discharge || 0)} cfs</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- RowCast Tooltip -->
            <div id="rowcast-tooltip" class="fixed z-50 hidden glass-elevated rounded-xl p-4 shadow-2xl max-w-sm">
                <div id="rowcast-tooltip-content"></div>
                <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 glass-elevated rotate-45"></div>
            </div>
        `;
        
        // Add click outside handler for tooltip
        document.addEventListener('click', this.hideRowcastTooltipOnClickOutside.bind(this));
    }

    groupRowcastByDay(forecastData) {
        const dailyGroups = {};
        
        forecastData.forEach(item => {
            const date = new Date(item.timestamp);
            const dateKey = date.toDateString();
            
            if (!dailyGroups[dateKey]) {
                dailyGroups[dateKey] = {
                    date: dateKey,
                    hours: [],
                    scores: [],
                    temps: [],
                    apparentTemps: [],
                    winds: [],
                    flows: []
                };
            }
            
            // Store the complete hour data
            dailyGroups[dateKey].hours.push(item);
            
            // Also collect for averages
            const conditions = item.conditions || {};
            dailyGroups[dateKey].scores.push(item.score || 0);
            dailyGroups[dateKey].temps.push(conditions.apparentTemp || 0);
            dailyGroups[dateKey].apparentTemps.push(conditions.apparentTemp || 0);
            dailyGroups[dateKey].winds.push(conditions.windSpeed || 0);
            dailyGroups[dateKey].flows.push(conditions.discharge || 0);
        });
        
        return Object.values(dailyGroups).map(group => ({
            date: group.date,
            hours: group.hours,
            avgScore: group.scores.reduce((a, b) => a + b, 0) / group.scores.length || 0,
            minScore: Math.min(...group.scores) || 0,
            maxScore: Math.max(...group.scores) || 0,
            avgTemp: group.temps.reduce((a, b) => a + b, 0) / group.temps.length || 0,
            minTemp: Math.min(...group.temps) || 0,
            maxTemp: Math.max(...group.temps) || 0,
            avgApparentTemp: group.apparentTemps.reduce((a, b) => a + b, 0) / group.apparentTemps.length || 0,
            avgWind: group.winds.reduce((a, b) => a + b, 0) / group.winds.length || 0,
            minWind: Math.min(...group.winds) || 0,
            maxWind: Math.max(...group.winds) || 0,
            avgFlow: group.flows.reduce((a, b) => a + b, 0) / group.flows.length || 0
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

    toggleRowcastTooltip(dayIndex, hourIndex, event) {
        const tooltip = document.getElementById('rowcast-tooltip');
        const tooltipContent = document.getElementById('rowcast-tooltip-content');
        
        if (!tooltip || !tooltipContent) return;
        
        // Hide tooltip if clicking the same hour
        if (tooltip.dataset.activeHour === `${dayIndex}-${hourIndex}`) {
            tooltip.classList.add('hidden');
            tooltip.dataset.activeHour = '';
            return;
        }
        
        // Get hour data
        const dailyData = this.currentExtendedRowcastData;
        if (!dailyData || !dailyData[dayIndex] || !dailyData[dayIndex].hours[hourIndex]) return;
        
        const hourData = dailyData[dayIndex].hours[hourIndex];
        const time = new Date(hourData.timestamp);
        const conditions = hourData.conditions || {};
        
        // Format tooltip content
        tooltipContent.innerHTML = `
            <div class="text-sm font-medium mb-2">${time.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                hour12: true
            })}</div>
            <div class="text-center mb-3">
                <div class="text-2xl font-bold ${this.getScoreColor(hourData.score)}">${hourData.score.toFixed(1)}</div>
                <div class="text-xs text-glass-muted">RowCast Score</div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="space-y-1">
                    <div class="text-xs font-medium text-purple-400 mb-1">Weather</div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Temperature:</span>
                        <span class="text-red-400">${Math.round(conditions.apparentTemp || 0)}°F</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Wind Speed:</span>
                        <span class="text-blue-400">${Math.round(conditions.windSpeed || 0)} mph</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Wind Gusts:</span>
                        <span class="text-purple-400">${Math.round(conditions.windGust || 0)} mph</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Precipitation:</span>
                        <span class="text-indigo-400">${Math.round(conditions.precipitation || 0)}%</span>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="text-xs font-medium text-teal-400 mb-1">Water</div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Flow Rate:</span>
                        <span class="text-teal-400">${Math.round(conditions.discharge || 0)} cfs</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Gauge Height:</span>
                        <span class="text-green-400">${(conditions.gaugeHeight || 0).toFixed(2)} ft</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">Water Temp:</span>
                        <span class="text-orange-400">${Math.round(conditions.waterTemp || 0)}°F</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-glass-muted">UV Index:</span>
                        <span class="text-yellow-400">${conditions.uvIndex || 'N/A'}</span>
                    </div>
                </div>
            </div>
            ${hourData.noaaDataUsed ? '<div class="mt-2 text-xs text-glass-muted">✓ Enhanced with NOAA stage/flow data</div>' : ''}
            ${conditions.weatherAlerts && conditions.weatherAlerts.length > 0 ? '<div class="mt-2 text-xs text-yellow-400">⚠ Weather alerts active</div>' : ''}
        `;
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - 200 / 2; // Center horizontally
        let top = rect.top - tooltipRect.height - 10; // Above the element
        
        // Adjust if tooltip would go off screen
        if (left < 10) left = 10;
        if (left + 400 > window.innerWidth) left = window.innerWidth - 410;
        if (top < 10) top = rect.bottom + 10; // Show below if no room above
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.classList.remove('hidden');
        tooltip.dataset.activeHour = `${dayIndex}-${hourIndex}`;
    }

    hideRowcastTooltipOnClickOutside(event) {
        const tooltip = document.getElementById('rowcast-tooltip');
        if (!tooltip || tooltip.classList.contains('hidden')) return;
        
        // Check if click is outside tooltip and hour items
        if (!event.target.closest('#rowcast-tooltip') && !event.target.closest('.hour-item')) {
            tooltip.classList.add('hidden');
            tooltip.dataset.activeHour = '';
        }
    }

    initializeWindDirection() {
        const widget = document.getElementById('wind-direction-widget');
        if (!widget) return;

        // Create wind direction compass visualization
        widget.innerHTML = `
            <div class="relative w-48 h-48 mx-auto">
                <!-- Compass Background -->
                <div class="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                <div class="absolute inset-4 border border-white/10 rounded-full"></div>
                
                <!-- Race Course Direction (220°) -->
                <div class="absolute top-1/2 left-1/2 w-24 h-1 bg-yellow-400 transform -translate-x-1/2 -translate-y-1/2 rotate-220 origin-center rounded" style="transform-origin: center; transform: translate(-50%, -50%) rotate(220deg);"></div>
                <div class="absolute top-1/2 left-1/2 text-xs text-yellow-400 transform -translate-x-1/2 translate-y-8">Race Course</div>
                
                <!-- Wind Direction (will be updated dynamically) -->
                <div id="wind-arrow" class="absolute top-1/2 left-1/2 w-20 h-1 bg-blue-400 transform -translate-x-1/2 -translate-y-1/2 origin-center rounded">
                    <div class="absolute -right-2 -top-1 w-0 h-0 border-l-4 border-l-blue-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                </div>
                
                <!-- Cardinal Directions -->
                <div class="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-white/60">N</div>
                <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white/60">S</div>
                <div class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-white/60">W</div>
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white/60">E</div>
            </div>
            <div class="text-center mt-4">
                <div class="text-sm text-blue-400" id="wind-direction-text">Wind: -- mph from --°</div>
            </div>
        `;

        // Update with current wind data
        this.updateWindDirection();
    }

    async updateWindDirection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch wind data');
            
            const data = await response.json();
            const weather = data.current?.weather || {};
            const windDirection = this.extractWindDirection(weather.windDir) || 0;
            const windSpeed = weather.windSpeed || 0;
            
            const windArrow = document.getElementById('wind-arrow');
            const windText = document.getElementById('wind-direction-text');
            
            if (windArrow) {
                windArrow.style.transform = `translate(-50%, -50%) rotate(${windDirection}deg)`;
            }
            
            if (windText) {
                windText.textContent = `Wind: ${Math.round(windSpeed)} mph from ${weather.windDir || 'N/A'}`;
            }
            
        } catch (error) {
            console.error('Error updating wind direction:', error);
        }
    }

    extractWindDirection(windDir) {
        if (!windDir) return 0;
        
        // Extract degrees from "NW (307°)" format
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

    initializeRowcastChart() {
        const ctx = document.getElementById('rowcast-trend-chart');
        if (!ctx) return;

        // Create a simple trend chart
        this.rowcastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RowCast Score',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });

        // Load chart data
        this.loadChartData();
    }

    async loadChartData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            if (!response.ok) throw new Error('Failed to fetch chart data');
            
            const data = await response.json();
            const forecastData = data.forecast?.rowcastScores || [];
            
            // Extract labels and scores for the chart
            const labels = forecastData.slice(0, 24).map(item => {
                const time = new Date(item.timestamp);
                return time.getHours() + ':00';
            });
            
            const scores = forecastData.slice(0, 24).map(item => item.score || 0);
            
            if (this.rowcastChart) {
                this.rowcastChart.data.labels = labels;
                this.rowcastChart.data.datasets[0].data = scores;
                this.rowcastChart.update();
            }
            
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    updateLastUpdate(data) {
        const updateElement = document.getElementById('dashboard-last-update');
        if (updateElement && data.timestamp) {
            updateElement.textContent = new Date(data.timestamp).toLocaleTimeString();
        }
    }

    getScoreColor(score) {
        if (score >= 8) return 'text-green-400';
        if (score >= 6) return 'text-yellow-400';
        if (score >= 4) return 'text-orange-400';
        return 'text-red-400';
    }

    getRiskLevelColor(level) {
        switch (level) {
            case 'good': return 'text-green-400';
            case 'caution': return 'text-yellow-400';
            case 'warning': return 'text-red-400';
            default: return 'text-gray-400';
        }
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
            await this.loadDashboardData();
            await this.loadForecastData();
            await this.updateWindDirection();
            await this.loadChartData();
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
                    <i class="fas fa-chart-line text-4xl text-purple-400 mb-6"></i>
                    <h2 class="text-2xl font-bold mb-4">Dashboard Unavailable</h2>
                    <p class="text-glass-muted mb-6">Unable to load dashboard data at this time.</p>
                    <button onclick="window.dashboardManager.loadContent()" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

// Add CSS for timespan buttons
const style = document.createElement('style');
style.textContent = `
    .timespan-btn {
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
    
    .timespan-btn.active,
    .timespan-btn:hover {
        background: rgba(147, 51, 234, 0.3);
        color: white;
    }
`;
document.head.appendChild(style);

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.dashboardManager = new DashboardManager();
    await window.dashboardManager.init();
});
