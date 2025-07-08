// Weather page functionality - integrated with RowCastApp
// This file provides additional weather-specific utilities

class WeatherUtils {
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    static getWeatherIcon(conditions) {
        const iconMap = {
            'clear': '☀️',
            'cloudy': '☁️',
            'rain': '🌧️',
            'snow': '❄️',
            'storm': '⛈️',
            'fog': '🌫️',
            'windy': '💨'
        };
        
        return iconMap[conditions?.toLowerCase()] || '🌤️';
    }

    static getWindDescription(speed) {
        if (speed < 5) return 'Light breeze';
        if (speed < 15) return 'Moderate wind';
        if (speed < 25) return 'Strong wind';
        return 'Very strong wind';
    }

    static getTemperatureColor(temp) {
        if (temp < 32) return 'var(--accent-blue)';
        if (temp < 50) return 'var(--accent-purple)';
        if (temp < 70) return 'var(--accent-green)';
        if (temp < 85) return 'var(--accent-orange)';
        return 'var(--accent-red)';
    }

    static calculateWindChill(temp, windSpeed) {
        if (temp > 50 || windSpeed < 3) return temp;
        
        return Math.round(35.74 + (0.6215 * temp) - (35.75 * Math.pow(windSpeed, 0.16)) + (0.4275 * temp * Math.pow(windSpeed, 0.16)));
    }

    static calculateHeatIndex(temp, humidity) {
        if (temp < 80) return temp;
        
        const c1 = -42.379;
        const c2 = 2.04901523;
        const c3 = 10.14333127;
        const c4 = -0.22475541;
        const c5 = -0.00683783;
        const c6 = -0.05481717;
        const c7 = 0.00122874;
        const c8 = 0.00085282;
        const c9 = -0.00000199;
        
        const hi = c1 + (c2 * temp) + (c3 * humidity) + (c4 * temp * humidity) + 
                   (c5 * temp * temp) + (c6 * humidity * humidity) + 
                   (c7 * temp * temp * humidity) + (c8 * temp * humidity * humidity) + 
                   (c9 * temp * temp * humidity * humidity);
        
        return Math.round(hi);
    }

    static getComfortLevel(temp, humidity, windSpeed) {
        const heatIndex = this.calculateHeatIndex(temp, humidity);
        const windChill = this.calculateWindChill(temp, windSpeed);
        
        const effectiveTemp = temp > 80 ? heatIndex : (temp < 50 ? windChill : temp);
        
        if (effectiveTemp < 20 || effectiveTemp > 100) return { level: 'dangerous', color: 'var(--accent-red)' };
        if (effectiveTemp < 35 || effectiveTemp > 90) return { level: 'uncomfortable', color: 'var(--accent-orange)' };
        if (effectiveTemp < 50 || effectiveTemp > 80) return { level: 'moderate', color: 'var(--accent-orange)' };
        return { level: 'comfortable', color: 'var(--accent-green)' };
    }

    static createWeatherChart(container, data) {
        // Create a simple weather trend chart using Chart.js
        if (!window.Chart) return;
        
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: 'Temperature (°F)',
                    data: data.map(d => d.temperature_f),
                    borderColor: 'var(--accent-blue)',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Wind Speed (mph)',
                    data: data.map(d => d.wind_speed_mph),
                    borderColor: 'var(--accent-orange)',
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

// Export for use in main app
window.WeatherUtils = WeatherUtils;
