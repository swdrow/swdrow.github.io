// API Documentation Page Manager
class ApiManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.isInitialized = false;
        this.endpoints = [
            {
                category: 'Weather',
                items: [
                    { method: 'GET', path: '/api/weather', description: 'Complete current weather data including temperature, wind conditions, humidity, and atmospheric pressure.' },
                    { method: 'GET', path: '/api/weather/current', description: 'Current weather conditions summary.' },
                    { method: 'GET', path: '/api/weather/forecast', description: 'Weather forecast data for upcoming periods.' },
                    { method: 'GET', path: '/api/weather/extended', description: 'Extended weather forecast with detailed daily predictions.' }
                ]
            },
            {
                category: 'Water Conditions',
                items: [
                    { method: 'GET', path: '/api/water', description: 'Complete water conditions including flow rate, stage height, and temperature.' },
                    { method: 'GET', path: '/api/water/current', description: 'Current water conditions from NOAA sensors.' },
                    { method: 'GET', path: '/api/water/predictions', description: 'Water condition predictions and forecasts.' }
                ]
            },
            {
                category: 'RowCast Scoring',
                items: [
                    { method: 'GET', path: '/api/rowcast', description: 'Current RowCast score with detailed condition analysis.' },
                    { method: 'GET', path: '/api/rowcast/forecast', description: 'RowCast scores for upcoming time periods with detailed conditions.' },
                    { method: 'GET', path: '/api/rowcast/forecast/simple', description: 'Simplified RowCast forecast with essential data only.' },
                    { method: 'GET', path: '/api/rowcast/forecast/<time_offset>', description: 'RowCast forecast for specific time offset (e.g., +1h, +3h).' },
                    { method: 'GET', path: '/api/rowcast/at/<timestamp>', description: 'RowCast score at a specific timestamp.' },
                    { method: 'GET', path: '/api/rowcast/forecast/short-term', description: 'Short-term RowCast forecasts for immediate planning.' },
                    { method: 'GET', path: '/api/rowcast/forecast/extended', description: 'Extended RowCast forecasts for long-term planning.' }
                ]
            },
            {
                category: 'NOAA Integration',
                items: [
                    { method: 'GET', path: '/api/noaa/stageflow', description: 'Complete NOAA stage and flow data for the Schuylkill River.' },
                    { method: 'GET', path: '/api/noaa/stageflow/current', description: 'Current NOAA stage and flow measurements.' },
                    { method: 'GET', path: '/api/noaa/stageflow/forecast', description: 'NOAA stage and flow forecasts.' }
                ]
            },
            {
                category: 'Complete Data',
                items: [
                    { method: 'GET', path: '/api/complete', description: 'All current conditions and short-term forecasts in a single comprehensive response.' },
                    { method: 'GET', path: '/api/complete/extended', description: 'Complete data package including extended forecasts and historical trends.' }
                ]
            }
        ];
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
                    <!-- API Documentation Header -->
                    <div class="glass-panel rounded-3xl p-8 mb-8">
                        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                            <div>
                                <h1 class="text-3xl font-bold mb-2 flex items-center">
                                    <i class="fas fa-code text-green-400 mr-3"></i>
                                    API Documentation
                                </h1>
                                <p class="text-glass-muted">Complete reference for the RowCast API endpoints</p>
                            </div>
                            <div class="mt-4 lg:mt-0 flex items-center space-x-4">
                                <div class="text-right">
                                    <div class="text-sm text-glass-muted">API Status</div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded-full bg-green-400 mr-2" id="api-status-indicator"></div>
                                        <span class="text-sm font-medium" id="api-status-text">Checking...</span>
                                    </div>
                                </div>
                                <button id="test-connection-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                                    <i class="fas fa-plug mr-2"></i>Test Connection
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- API Base Information -->
                    <div class="glass-panel rounded-2xl p-6 mb-8">
                        <h2 class="text-xl font-bold mb-4">Base Information</h2>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 class="text-lg font-semibold mb-2">Base URL</h3>
                                <code class="block p-3 bg-black/30 rounded-xl text-green-400 font-mono text-sm">
                                    ${this.apiBaseUrl}
                                </code>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold mb-2">Response Format</h3>
                                <code class="block p-3 bg-black/30 rounded-xl text-blue-400 font-mono text-sm">
                                    Content-Type: application/json
                                </code>
                            </div>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-semibold mb-2">CORS Headers</h3>
                            <p class="text-glass-muted text-sm">All endpoints include CORS headers allowing cross-origin requests from any domain.</p>
                        </div>
                    </div>

                    <!-- API Endpoints -->
                    <div class="space-y-6">
                        ${this.renderEndpointCategories()}
                    </div>

                    <!-- Response Modal -->
                    <div id="response-modal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
                        <div class="glass-panel rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto w-full">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-bold">API Response</h3>
                                <button onclick="window.apiManager.closeModal()" class="text-glass-muted hover:text-white">
                                    <i class="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            <div id="response-content">
                                <!-- Response content will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Check API status
            await this.checkApiStatus();

        } catch (error) {
            console.error('Error loading API documentation:', error);
            this.showErrorState(mainContent);
        }
    }

    renderEndpointCategories() {
        return this.endpoints.map(category => `
            <div class="glass-panel rounded-2xl p-6">
                <h2 class="text-xl font-bold mb-6 flex items-center">
                    <i class="fas fa-folder-open text-blue-400 mr-3"></i>
                    ${category.category}
                </h2>
                <div class="space-y-4">
                    ${category.items.map(endpoint => this.renderEndpoint(endpoint)).join('')}
                </div>
            </div>
        `).join('');
    }

    renderEndpoint(endpoint) {
        const methodColor = this.getMethodColor(endpoint.method);
        return `
            <div class="widget-glass rounded-xl p-4">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between mb-3">
                    <div class="flex items-center mb-2 lg:mb-0">
                        <span class="px-3 py-1 rounded-lg text-xs font-bold ${methodColor} mr-3">
                            ${endpoint.method}
                        </span>
                        <code class="text-green-400 font-mono text-sm">${endpoint.path}</code>
                    </div>
                    <button onclick="window.apiManager.tryEndpoint('${endpoint.path}')" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                        <i class="fas fa-play mr-2"></i>Try it
                    </button>
                </div>
                <p class="text-glass-muted text-sm">${endpoint.description}</p>
            </div>
        `;
    }

    getMethodColor(method) {
        switch (method) {
            case 'GET': return 'bg-green-600 text-white';
            case 'POST': return 'bg-blue-600 text-white';
            case 'PUT': return 'bg-yellow-600 text-white';
            case 'DELETE': return 'bg-red-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    }

    async checkApiStatus() {
        const indicator = document.getElementById('api-status-indicator');
        const statusText = document.getElementById('api-status-text');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            const isOnline = response.ok;
            
            if (indicator && statusText) {
                if (isOnline) {
                    indicator.className = 'w-3 h-3 rounded-full bg-green-400 mr-2';
                    statusText.textContent = 'Online';
                    statusText.className = 'text-sm font-medium text-green-400';
                } else {
                    indicator.className = 'w-3 h-3 rounded-full bg-red-400 mr-2';
                    statusText.textContent = 'Offline';
                    statusText.className = 'text-sm font-medium text-red-400';
                }
            }
        } catch (error) {
            if (indicator && statusText) {
                indicator.className = 'w-3 h-3 rounded-full bg-red-400 mr-2';
                statusText.textContent = 'Offline';
                statusText.className = 'text-sm font-medium text-red-400';
            }
        }
    }

    async testConnection() {
        const button = document.getElementById('test-connection-btn');
        if (!button) return;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Testing...';
        button.disabled = true;
        
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.apiBaseUrl}/complete`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (response.ok) {
                button.innerHTML = '<i class="fas fa-check mr-2"></i>Connected';
                button.className = 'px-4 py-2 bg-green-600 rounded-xl transition-colors';
                
                // Show success message with response time
                this.showNotification(`API connected successfully (${responseTime}ms)`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            button.innerHTML = '<i class="fas fa-times mr-2"></i>Failed';
            button.className = 'px-4 py-2 bg-red-600 rounded-xl transition-colors';
            
            this.showNotification(`Connection failed: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                button.innerHTML = originalText;
                button.className = 'px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors';
                button.disabled = false;
            }, 2000);
        }
    }

    async tryEndpoint(path) {
        const modal = document.getElementById('response-modal');
        const content = document.getElementById('response-content');
        
        if (!modal || !content) return;
        
        // Show modal with loading state
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-glass-muted">Making API request...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        try {
            const fullUrl = `${this.apiBaseUrl}${path}`;
            const startTime = Date.now();
            const response = await fetch(fullUrl);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            let responseData;
            let contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
            
            // Display response
            content.innerHTML = `
                <div class="space-y-4">
                    <!-- Request Info -->
                    <div class="widget-glass rounded-xl p-4">
                        <h4 class="font-bold mb-2">Request</h4>
                        <div class="text-sm space-y-1">
                            <div><span class="text-glass-muted">URL:</span> <code class="text-green-400">${fullUrl}</code></div>
                            <div><span class="text-glass-muted">Method:</span> <code class="text-blue-400">GET</code></div>
                            <div><span class="text-glass-muted">Response Time:</span> <code class="text-yellow-400">${responseTime}ms</code></div>
                        </div>
                    </div>
                    
                    <!-- Response Status -->
                    <div class="widget-glass rounded-xl p-4">
                        <h4 class="font-bold mb-2">Response</h4>
                        <div class="text-sm space-y-1">
                            <div><span class="text-glass-muted">Status:</span> 
                                <code class="${response.ok ? 'text-green-400' : 'text-red-400'}">${response.status} ${response.statusText}</code>
                            </div>
                            <div><span class="text-glass-muted">Content-Type:</span> 
                                <code class="text-blue-400">${contentType || 'N/A'}</code>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Response Data -->
                    <div class="widget-glass rounded-xl p-4">
                        <h4 class="font-bold mb-2">Response Data</h4>
                        <pre class="text-sm bg-black/30 p-4 rounded-xl overflow-x-auto"><code>${JSON.stringify(responseData, null, 2)}</code></pre>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                    <h4 class="text-xl font-bold mb-2">Request Failed</h4>
                    <p class="text-glass-muted mb-4">${error.message}</p>
                    <button onclick="window.apiManager.closeModal()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                        Close
                    </button>
                </div>
            `;
        }
    }

    closeModal() {
        const modal = document.getElementById('response-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 z-50 glass-panel rounded-xl p-4 max-w-sm transition-all duration-300 transform translate-x-full`;
        
        
        const iconClass = type === 'success' ? 'fas fa-check-circle text-green-400' : 
                         type === 'error' ? 'fas fa-exclamation-circle text-red-400' : 
                         'fas fa-info-circle text-blue-400';
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${iconClass} mr-3"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showErrorState(container) {
        container.innerHTML = `
            <div class="container mx-auto px-6 py-12">
                <div class="glass-panel rounded-3xl p-12 text-center">
                    <i class="fas fa-code text-4xl text-green-400 mb-6"></i>
                    <h2 class="text-2xl font-bold mb-4">API Documentation Unavailable</h2>
                    <p class="text-glass-muted mb-6">Unable to load API documentation at this time.</p>
                    <button onclick="window.apiManager.loadContent()" class="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize API manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.apiManager = new ApiManager();
    await window.apiManager.init();
});
