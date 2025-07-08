// Navigation System
class NavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.pages = ['home', 'weather', 'dashboard', 'api'];
        this.isLoading = false;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        // Wait for all page managers to be available
        await this.waitForManagers();
        
        this.attachEventListeners();
        await this.loadInitialPage();
        this.isInitialized = true;
    }

    async waitForManagers() {
        const maxAttempts = 50; // 5 seconds
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.homeManager && 
                window.weatherManager && 
                window.dashboardManager && 
                window.apiManager) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('Some managers not loaded, proceeding anyway');
    }

    attachEventListeners() {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = button.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
    }

    async navigateToPage(page) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        // Update active navigation button
        this.updateActiveButton(page);
        
        try {
            // Load page content
            await this.loadPageContent(page);
            this.currentPage = page;
            
            // Update URL without page reload
            if (history.pushState) {
                history.pushState({ page }, '', `#${page}`);
            }
            
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            this.showErrorMessage(`Failed to load ${page} page`);
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    updateActiveButton(page) {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-page') === page) {
                button.classList.add('active');
            }
        });
    }

    async loadPageContent(page) {
        const mainContent = document.getElementById('main-content');
        
        // Ensure the manager exists before calling it
        switch (page) {
            case 'home':
                if (window.homeManager && typeof window.homeManager.loadContent === 'function') {
                    await window.homeManager.loadContent();
                } else {
                    throw new Error('Home manager not available');
                }
                break;
            case 'weather':
                if (window.weatherManager && typeof window.weatherManager.loadContent === 'function') {
                    await window.weatherManager.loadContent();
                } else {
                    throw new Error('Weather manager not available');
                }
                break;
            case 'dashboard':
                if (window.dashboardManager && typeof window.dashboardManager.loadContent === 'function') {
                    await window.dashboardManager.loadContent();
                } else {
                    throw new Error('Dashboard manager not available');
                }
                break;
            case 'api':
                if (window.apiManager && typeof window.apiManager.loadContent === 'function') {
                    await window.apiManager.loadContent();
                } else {
                    throw new Error('API manager not available');
                }
                break;
            default:
                throw new Error(`Unknown page: ${page}`);
        }
    }

    async loadInitialPage() {
        // Check URL hash for initial page
        const hash = window.location.hash.substring(1);
        const initialPage = this.pages.includes(hash) ? hash : 'home';
        await this.navigateToPage(initialPage);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    showErrorMessage(message) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container mx-auto px-6 py-12">
                <div class="glass-panel rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <h2 class="text-2xl font-bold mb-4">Error</h2>
                    <p class="text-glass-muted">${message}</p>
                    <button onclick="location.reload()" class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page && window.navigationManager) {
        window.navigationManager.navigateToPage(event.state.page);
    }
});

// Initialize navigation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.navigationManager = new NavigationManager();
    await window.navigationManager.init();
});
