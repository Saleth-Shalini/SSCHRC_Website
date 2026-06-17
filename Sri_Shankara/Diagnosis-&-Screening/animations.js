/**
 * SSCHRC Healthcare Dashboard Animations
 * Animated counter functionality with smooth transitions
 */

// Configuration
const ANIMATION_CONFIG = {
    duration: 2000, // Animation duration in milliseconds
    easeOutQuart: t => 1 - (--t) * t * t * t, // Easing function for smooth animation
    observerOptions: {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    }
};

class CounterAnimation {
    constructor(element) {
        this.element = element;
        this.target = parseInt(element.dataset.target);
        this.hasAnimated = false;
        this.duration = ANIMATION_CONFIG.duration;
        this.easing = ANIMATION_CONFIG.easeOutQuart;
    }

    // Format numbers with commas for better readability
    formatNumber(num) {
        return num.toLocaleString();
    }

    // Animate counter from 0 to target value
    animate() {
        if (this.hasAnimated) return;
        
        this.hasAnimated = true;
        this.element.classList.add('counting');
        
        const startTime = performance.now();
        const startValue = 0;
        const changeValue = this.target - startValue;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Apply easing function
            const easedProgress = this.easing(progress);
            const currentValue = Math.floor(startValue + (changeValue * easedProgress));
            
            // Update display
            this.element.textContent = this.formatNumber(currentValue);
            
            // Continue animation or finish
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                this.element.textContent = this.formatNumber(this.target);
                this.element.classList.remove('counting');
                this.onComplete();
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // Callback when animation completes
    onComplete() {
        // Add a subtle pulse effect when animation completes
        this.element.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            this.element.style.animation = '';
        }, 500);
    }

    // Reset animation (for testing or replay)
    reset() {
        this.hasAnimated = false;
        this.element.textContent = '0';
        this.element.classList.remove('counting');
    }
}

class DashboardAnimations {
    constructor() {
        this.counters = [];
        this.observer = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.initializeCounters();
        this.setupIntersectionObserver();
        this.addEventListeners();
        this.animateOnLoad();
    }

    // Initialize all counter elements
    initializeCounters() {
        const counterElements = document.querySelectorAll('.stat-number[data-target]');
        
        counterElements.forEach(element => {
            const counter = new CounterAnimation(element);
            this.counters.push(counter);
            
            // Set initial value to 0
            element.textContent = '0';
        });

        console.log(`Initialized ${this.counters.length} counters`);
    }

    // Setup intersection observer for scroll-triggered animations
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = this.counters.find(c => c.element === entry.target);
                    if (counter && !counter.hasAnimated) {
                        // Add a small delay for staggered effect
                        const delay = Array.from(entry.target.closest('.stats-grid').children)
                            .indexOf(entry.target.closest('.stat-card')) * 100;
                        
                        setTimeout(() => counter.animate(), delay);
                    }
                }
            });
        }, ANIMATION_CONFIG.observerOptions);

        // Observe all counter elements
        this.counters.forEach(counter => {
            this.observer.observe(counter.element);
        });
    }

    // Animate counters immediately if they're already visible
    animateOnLoad() {
        setTimeout(() => {
            this.counters.forEach((counter, index) => {
                const rect = counter.element.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible && !counter.hasAnimated) {
                    setTimeout(() => counter.animate(), index * 100);
                }
            });
        }, 500); // Small delay to ensure page is fully rendered
    }

    // Add event listeners for interactions
    addEventListeners() {
        // Reset animations on double-click (for demonstration)
        document.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('stat-number')) {
                const counter = this.counters.find(c => c.element === e.target);
                if (counter) {
                    counter.reset();
                    setTimeout(() => counter.animate(), 100);
                }
            }
        });

        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.closest('.stat-card')) {
                const statCard = e.target.closest('.stat-card');
                const counterElement = statCard.querySelector('.stat-number');
                const counter = this.counters.find(c => c.element === counterElement);
                
                if (counter) {
                    counter.reset();
                    setTimeout(() => counter.animate(), 100);
                }
            }
        });

        // Handle visibility change to reset animations when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.animateOnLoad();
            }
        });
    }

    // Public method to manually trigger all animations
    triggerAllAnimations() {
        this.counters.forEach((counter, index) => {
            counter.reset();
            setTimeout(() => counter.animate(), index * 100);
        });
    }

    // Public method to reset all animations
    resetAllAnimations() {
        this.counters.forEach(counter => counter.reset());
    }
}

// Card hover effects and interactions
class CardEffects {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.addCardHoverEffects();
        this.addAccessibilityFeatures();
    }

    addCardHoverEffects() {
        const cards = document.querySelectorAll('.stat-card');
        
        cards.forEach(card => {
            // Add mouse enter effect
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.stat-icon i');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                    icon.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                }
            });

            // Add mouse leave effect
            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.stat-icon i');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });

            // Add click effect
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
            });
        });
    }

    addAccessibilityFeatures() {
        const cards = document.querySelectorAll('.stat-card');
        
        cards.forEach(card => {
            // Make cards focusable
            card.setAttribute('tabindex', '0');
            
            // Add ARIA labels
            const label = card.querySelector('.stat-label').textContent;
            const number = card.querySelector('.stat-number').dataset.target;
            card.setAttribute('aria-label', `${label}: ${number}`);
            
            // Add role
            card.setAttribute('role', 'button');
        });
    }
}

// Smooth scrolling utility
class SmoothScroll {
    static scrollToElement(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Performance monitoring
class PerformanceMonitor {
    static logAnimationPerformance() {
        if (performance.mark) {
            performance.mark('dashboard-animations-start');
            
            setTimeout(() => {
                performance.mark('dashboard-animations-end');
                performance.measure('dashboard-animations', 'dashboard-animations-start', 'dashboard-animations-end');
                
                const measures = performance.getEntriesByType('measure');
                const animationMeasure = measures.find(m => m.name === 'dashboard-animations');
                
                if (animationMeasure) {
                    console.log(`Dashboard animations completed in ${animationMeasure.duration.toFixed(2)}ms`);
                }
            }, 3000);
        }
    }
}

// Initialize everything when the page loads
let dashboardAnimations;
let cardEffects;

// Main initialization
function initializeDashboard() {
    try {
        // Start performance monitoring
        PerformanceMonitor.logAnimationPerformance();
        
        // Initialize animations and effects
        dashboardAnimations = new DashboardAnimations();
        cardEffects = new CardEffects();
        
        console.log('SSCHRC Dashboard initialized successfully');
        
        // Add global methods for testing/debugging
        window.dashboardControls = {
            triggerAnimations: () => dashboardAnimations.triggerAllAnimations(),
            resetAnimations: () => dashboardAnimations.resetAllAnimations(),
            scrollToStats: () => {
                const statsGrid = document.querySelector('.stats-grid');
                if (statsGrid) SmoothScroll.scrollToElement(statsGrid);
            }
        };
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DashboardAnimations,
        CounterAnimation,
        CardEffects,
        SmoothScroll,
        PerformanceMonitor
    };
}