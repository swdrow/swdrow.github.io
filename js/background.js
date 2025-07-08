// Background Image Management System
class BackgroundManager {
    constructor() {
        this.backgroundImages = [
            'dist/img/BG-1.jpeg',
            'dist/img/BG-2.jpeg',
            'dist/img/BG-3.jpeg',
            'dist/img/BG-4.jpeg',
            'dist/img/diagoona-bg-1.jpg',
            'dist/img/diagoona-bg-2.jpg',
            'dist/img/diagoona-bg-3.jpg',
            'dist/assets/img/background.jpg'
        ];
        this.currentIndex = 0;
        this.intervalId = null;
        this.isTransitioning = false;
        
        this.init();
    }

    init() {
        this.preloadImages();
        this.setInitialBackground();
        this.startRotation();
    }

    preloadImages() {
        this.backgroundImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    setInitialBackground() {
        const layer1 = document.getElementById('bg-layer-1');
        if (layer1) {
            layer1.style.backgroundImage = `url('${this.backgroundImages[0]}')`;
            layer1.classList.add('active');
        }
    }

    startRotation() {
        this.intervalId = setInterval(() => {
            this.transitionToNext();
        }, 8000); // Change background every 8 seconds
    }

    transitionToNext() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.currentIndex = (this.currentIndex + 1) % this.backgroundImages.length;
        
        const activeLayer = document.querySelector('.background-layer.active');
        const inactiveLayer = document.querySelector('.background-layer:not(.active)');
        
        if (activeLayer && inactiveLayer) {
            // Set the new background image on the inactive layer
            const imagePath = this.backgroundImages[this.currentIndex];
            inactiveLayer.style.backgroundImage = `url('${imagePath}')`;
            
            // Add console log for debugging
            console.log(`Transitioning to background: ${imagePath}`);
            
            // Swap active states with proper transition timing
            setTimeout(() => {
                activeLayer.classList.remove('active');
                inactiveLayer.classList.add('active');
                
                // Reset the now-inactive layer after transition
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 2000);
            }, 100);
        } else {
            console.warn('Background layers not found');
            this.isTransitioning = false;
        }
    }

    setBackground(index) {
        if (index >= 0 && index < this.backgroundImages.length && !this.isTransitioning) {
            this.currentIndex = index;
            this.transitionToNext();
        }
    }

    pauseRotation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resumeRotation() {
        if (!this.intervalId) {
            this.startRotation();
        }
    }
}

// Initialize background manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.backgroundManager = new BackgroundManager();
});
