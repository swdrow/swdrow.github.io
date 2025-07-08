// Main Application Controller
class AppController {
    constructor() {
        this.isInitialized = false;
        this.managers = {};
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Initializing RowCast Application...');
            
            // Wait for all managers to be available
            await this.waitForManagers();
            
            // Store manager references
            this.managers = {
                background: window.backgroundManager,
                navigation: window.navigationManager,
                home: window.homeManager,
                weather: window.weatherManager,
                dashboard: window.dashboardManager,
                api: window.apiManager
            };

            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup responsive behavior
            this.setupResponsiveBehavior();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('RowCast Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showCriticalError();
        }
    }

    async waitForManagers() {
        const maxAttempts = 100; // 10 seconds
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.backgroundManager && 
                window.navigationManager && 
                window.homeManager && 
                window.weatherManager && 
                window.dashboardManager && 
                window.apiManager) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Continue with whatever managers are available
        console.warn('Not all managers loaded, proceeding with available ones');
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });

        // Network error detection
        window.addEventListener('offline', () => {
            this.showNetworkStatus(false);
        });

        window.addEventListener('online', () => {
            this.showNetworkStatus(true);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            // Alt + number keys for navigation
            if (event.altKey && !event.ctrlKey && !event.shiftKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        this.managers.navigation?.navigateToPage('home');
                        break;
                    case '2':
                        event.preventDefault();
                        this.managers.navigation?.navigateToPage('weather');
                        break;
                    case '3':
                        event.preventDefault();
                        this.managers.navigation?.navigateToPage('dashboard');
                        break;
                    case '4':
                        event.preventDefault();
                        this.managers.navigation?.navigateToPage('api');
                        break;
                }
            }

            // R for refresh current page
            if (event.key === 'r' || event.key === 'R') {
                if (event.ctrlKey || event.metaKey) {
                    return; // Allow browser refresh
                }
                event.preventDefault();
                this.refreshCurrentPage();
            }

            // Escape to close modals
            if (event.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    setupResponsiveBehavior() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150);
        });

        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });

        // Setup dynamic navigation behavior
        this.setupDynamicNavigation();
        
        // Setup liquid glass mouse tracking
        this.setupLiquidGlassInteractions();
    }

    setupDynamicNavigation() {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateNavigation = () => {
            const currentScrollY = window.scrollY;
            const navigation = document.querySelector('.nav-glass');
            
            if (navigation) {
                if (currentScrollY > 100) {
                    navigation.classList.add('nav-scrolled');
                } else {
                    navigation.classList.remove('nav-scrolled');
                }
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavigation);
                ticking = true;
            }
        }, { passive: true });
    }

    setupLiquidGlassInteractions() {
        // Mouse tracking for specular highlights
        const glassPanels = document.querySelectorAll('.glass-panel');
        
        const updateMousePosition = (e, panel) => {
            const rect = panel.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            panel.style.setProperty('--mouse-x', `${x}%`);
            panel.style.setProperty('--mouse-y', `${y}%`);
        };

        glassPanels.forEach(panel => {
            panel.addEventListener('mousemove', (e) => {
                updateMousePosition(e, panel);
            });

            panel.addEventListener('mouseleave', () => {
                panel.style.setProperty('--mouse-x', '50%');
                panel.style.setProperty('--mouse-y', '50%');
            });
        });

        // Ripple effect for interactive elements
        const interactiveElements = document.querySelectorAll('.glass-interactive, .nav-button');
        
        interactiveElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                element.style.setProperty('--ripple-x', `${x}px`);
                element.style.setProperty('--ripple-y', `${y}px`);
            });
        });

        // Re-apply mouse tracking when new elements are added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const newGlassPanels = node.querySelectorAll ? node.querySelectorAll('.glass-panel') : [];
                        newGlassPanels.forEach(panel => {
                            panel.addEventListener('mousemove', (e) => {
                                updateMousePosition(e, panel);
                            });

                            panel.addEventListener('mouseleave', () => {
                                panel.style.setProperty('--mouse-x', '50%');
                                panel.style.setProperty('--mouse-y', '50%');
                            });
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    handleResize() {
        // Trigger resize events for charts and responsive components
        if (this.managers.dashboard?.rowcastChart) {
            this.managers.dashboard.rowcastChart.resize();
        }

        // Update mobile navigation state
        this.updateMobileNavigation();
    }

    updateMobileNavigation() {
        const isMobile = window.innerWidth < 768;
        const navButtons = document.querySelectorAll('.nav-button');
        
        navButtons.forEach(button => {
            const text = button.querySelector('.hidden');
            if (text) {
                if (isMobile) {
                    text.classList.add('hidden');
                } else {
                    text.classList.remove('hidden');
                }
            }
        });
    }

    refreshCurrentPage() {
        const currentPage = this.managers.navigation?.currentPage;
        if (!currentPage) return;

        const manager = this.managers[currentPage];
        if (manager && typeof manager.refreshData === 'function') {
            manager.refreshData();
        } else if (manager && typeof manager.loadContent === 'function') {
            manager.loadContent();
        }
    }

    closeModals() {
        // Close API response modal
        const apiModal = document.getElementById('response-modal');
        if (apiModal && !apiModal.classList.contains('hidden')) {
            this.managers.api?.closeModal();
        }

        // Close any other modals that might be open
        const modals = document.querySelectorAll('[id$="-modal"]');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }

    handleError(error) {
        console.error('Application error:', error);
        
        // Don't show error notifications for network errors during development
        if (error.message && error.message.includes('fetch')) {
            return;
        }

        this.showErrorNotification(error.message || 'An unexpected error occurred');
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-24 right-6 z-50 glass-panel rounded-xl p-4 max-w-sm bg-red-500/20 border border-red-500/30';
        
        notification.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-exclamation-circle text-red-400 mr-3 mt-1"></i>
                <div class="flex-1">
                    <div class="font-medium text-red-400">Error</div>
                    <div class="text-sm text-glass-muted mt-1">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-glass-muted hover:text-white ml-2">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showNetworkStatus(isOnline) {
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 z-50 glass-panel rounded-xl p-4 max-w-sm ${isOnline ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`;
        
        const icon = isOnline ? 'fas fa-wifi text-green-400' : 'fas fa-wifi-slash text-red-400';
        const message = isOnline ? 'Connection restored' : 'Connection lost';
        const textColor = isOnline ? 'text-green-400' : 'text-red-400';
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${icon} mr-3"></i>
                <div class="font-medium ${textColor}">${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showCriticalError() {
        document.body.innerHTML = `
            <div class="min-h-screen bg-black flex items-center justify-center p-6">
                <div class="text-center max-w-md">
                    <div class="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-3xl text-white"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-white mb-4">Application Error</h1>
                    <p class="text-gray-400 mb-6">
                        RowCast failed to initialize properly. Please refresh the page to try again.
                    </p>
                    <button onclick="location.reload()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                        Reload Application
                    </button>
                </div>
            </div>
        `;
    }

    // Utility methods for other components
    showLoadingState(element, message = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="loading-spinner mr-4"></div>
                    <span class="text-glass-muted">${message}</span>
                </div>
            `;
        }
    }

    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    formatNumber(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '--';
        }
        return Number(value).toFixed(decimals);
    }

    // Debug methods
    getApplicationState() {
        return {
            initialized: this.isInitialized,
            currentPage: this.managers.navigation?.currentPage,
            managers: Object.keys(this.managers),
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
}

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.appController = new AppController();
    await window.appController.initialize();
});

// Make app controller globally available for debugging
window.getAppState = () => window.appController?.getApplicationState();
