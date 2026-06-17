// Health Packages Website - Interactive JavaScript Functionality

// DOM Elements
const searchInput = document.getElementById('searchInput');
const packageSelector = document.getElementById('packageSelector');
const searchBtn = document.querySelector('.search-btn');
const packagesGrid = document.getElementById('packagesGrid');
const packageCards = document.querySelectorAll('.package-card');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeAnimations();
    initializeMobileMenu();
});

// Event Listeners
function initializeEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(performSearch, 300));
    packageSelector.addEventListener('change', performSearch);
    searchBtn.addEventListener('click', performSearch);
    
    // Package card interactions
    packageCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                togglePackageDetails(this);
            }
        });
        
        // Book Now buttons
        const bookBtn = card.querySelector('.btn-primary');
        if (bookBtn) {
            bookBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                handleBookNow(card);
            });
        }
        
        // Learn More buttons
        const learnMoreBtn = card.querySelector('.btn-secondary');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                handleLearnMore(card);
            });
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Search and Filter Functionality
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedPackage = packageSelector.value;
    
    let visibleCount = 0;
    
    packageCards.forEach(card => {
        const packageType = card.dataset.package;
        const packageCategory = card.dataset.category || '';
        const cardText = card.textContent.toLowerCase();
        
        // Check if card matches search criteria
        const matchesSearch = searchTerm === '' || cardText.includes(searchTerm);
        const matchesPackage = selectedPackage === '' || packageType === selectedPackage;
        
        if (matchesSearch && matchesPackage) {
            showCard(card);
            highlightSearchTerms(card, searchTerm);
            visibleCount++;
        } else {
            hideCard(card);
        }
    });
    
    // Show/hide no results message
    updateNoResultsMessage(visibleCount);
    
    // Update URL with search parameters (for sharing)
    updateURL(searchTerm, selectedPackage);
}

function showCard(card) {
    card.classList.remove('hidden');
    card.style.animation = 'fadeInUp 0.6s ease forwards';
}

function hideCard(card) {
    card.classList.add('hidden');
}

function highlightSearchTerms(card, searchTerm) {
    if (!searchTerm) {
        // Remove existing highlights
        card.querySelectorAll('.highlight').forEach(highlight => {
            highlight.outerHTML = highlight.innerHTML;
        });
        return;
    }
    
    // Remove existing highlights first
    card.querySelectorAll('.highlight').forEach(highlight => {
        highlight.outerHTML = highlight.innerHTML;
    });
    
    // Add new highlights
    const testElements = card.querySelectorAll('.test-category li, .package-description');
    testElements.forEach(element => {
        const text = element.innerHTML;
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
    });
}

function updateNoResultsMessage(visibleCount) {
    let noResultsMessage = document.getElementById('no-results-message');
    
    if (visibleCount === 0) {
        if (!noResultsMessage) {
            noResultsMessage = document.createElement('div');
            noResultsMessage.id = 'no-results-message';
            noResultsMessage.className = 'no-results';
            noResultsMessage.innerHTML = `
                <div class="no-results-content">
                    <i class="fas fa-search"></i>
                    <h3>No packages found</h3>
                    <p>Try adjusting your search terms or select a different package type.</p>
                    <button class="btn-primary" onclick="clearSearch()">Clear Search</button>
                </div>
            `;
            packagesGrid.appendChild(noResultsMessage);
        }
        noResultsMessage.style.display = 'block';
    } else {
        if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
    }
}

function clearSearch() {
    searchInput.value = '';
    packageSelector.value = '';
    performSearch();
}

function updateURL(searchTerm, selectedPackage) {
    const url = new URL(window.location);
    if (searchTerm) {
        url.searchParams.set('search', searchTerm);
    } else {
        url.searchParams.delete('search');
    }
    if (selectedPackage) {
        url.searchParams.set('package', selectedPackage);
    } else {
        url.searchParams.delete('package');
    }
    window.history.replaceState({}, '', url);
}

// Package Card Interactions
function togglePackageDetails(card) {
    const details = card.querySelector('.package-details');
    const isExpanded = card.classList.contains('expanded');
    
    // Close all other expanded cards
    packageCards.forEach(otherCard => {
        if (otherCard !== card) {
            otherCard.classList.remove('expanded');
            const otherDetails = otherCard.querySelector('.package-details');
            if (otherDetails) {
                otherDetails.style.maxHeight = null;
            }
        }
    });
    
    if (isExpanded) {
        card.classList.remove('expanded');
        details.style.maxHeight = null;
    } else {
        card.classList.add('expanded');
        details.style.maxHeight = details.scrollHeight + 'px';
        
        // Scroll to card
        setTimeout(() => {
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

function handleBookNow(card) {
    const packageName = card.querySelector('h3').textContent;
    
    // Create booking modal or redirect to booking page
    showBookingModal(packageName);
    
    // Track event (if analytics is implemented)
    trackEvent('book_now_clicked', { package: packageName });
}

function handleLearnMore(card) {
    const packageName = card.querySelector('h3').textContent;
    
    // Show detailed information modal
    showDetailsModal(card);
    
    // Track event
    trackEvent('learn_more_clicked', { package: packageName });
}

// Modal Functions
function showBookingModal(packageName) {
    const modal = createModal(`
        <div class="modal-content booking-modal">
            <div class="modal-header">
                <h2><i class="fas fa-calendar-check"></i> Book ${packageName}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form class="booking-form">
                    <div class="form-group">
                        <label for="fullName">Full Name *</label>
                        <input type="text" id="fullName" name="fullName" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="preferredDate">Preferred Date</label>
                        <input type="date" id="preferredDate" name="preferredDate" min="${getTomorrowDate()}">
                    </div>
                    <div class="form-group">
                        <label for="notes">Additional Notes</label>
                        <textarea id="notes" name="notes" rows="3" placeholder="Any specific requirements or questions..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check"></i> Book Appointment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);
    
    // Handle form submission
    const form = modal.querySelector('.booking-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleBookingSubmission(this, packageName);
    });
}

function showDetailsModal(card) {
    const packageName = card.querySelector('h3').textContent;
    const packageDescription = card.querySelector('.package-description').textContent;
    const testCount = card.querySelector('.test-count span').textContent;
    const testsHTML = card.querySelector('.tests-list').innerHTML;
    
    createModal(`
        <div class="modal-content details-modal">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> ${packageName}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="package-overview">
                    <p class="description">${packageDescription}</p>
                    <div class="test-summary">
                        <i class="fas fa-vial"></i>
                        <span>${testCount}</span>
                    </div>
                </div>
                <div class="detailed-tests">
                    ${testsHTML}
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeModal()">Close</button>
                    <button class="btn-primary" onclick="closeModal(); handleBookNow(document.querySelector('[data-package]'));">
                        <i class="fas fa-calendar-check"></i> Book This Package
                    </button>
                </div>
            </div>
        </div>
    `);
}

function createModal(content) {
    // Remove existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = content;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Setup close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Animate modal in
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        
        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-times');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    mobileMenuBtn.querySelector('i').classList.add('fa-bars');
    mobileMenuBtn.querySelector('i').classList.remove('fa-times');
}

// Header Scroll Effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Animations
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe package cards
    packageCards.forEach(card => {
        observer.observe(card);
    });
}

// Keyboard Navigation
function handleKeyboardNavigation(e) {
    // ESC key closes modals
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Enter key on search input performs search
    if (e.key === 'Enter' && e.target === searchInput) {
        performSearch();
    }
    
    // Arrow keys for package navigation
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusedCard = document.querySelector('.package-card:focus-within');
        if (focusedCard) {
            e.preventDefault();
            const cards = Array.from(document.querySelectorAll('.package-card:not(.hidden)'));
            const currentIndex = cards.indexOf(focusedCard);
            let nextIndex;
            
            if (e.key === 'ArrowDown') {
                nextIndex = currentIndex + 1 < cards.length ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : cards.length - 1;
            }
            
            cards[nextIndex].focus();
        }
    }
}

// Form Handling
function handleBookingSubmission(form, packageName) {
    const formData = new FormData(form);
    const bookingData = Object.fromEntries(formData.entries());
    bookingData.package = packageName;
    bookingData.timestamp = new Date().toISOString();
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual booking API)
    setTimeout(() => {
        // Show success message
        showSuccessMessage('Booking request submitted successfully! We will contact you soon.');
        closeModal();
        
        // Reset form
        form.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Track conversion
        trackEvent('booking_completed', bookingData);
    }, 2000);
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

function trackEvent(eventName, eventData = {}) {
    // Implement analytics tracking here
    console.log(`Event: ${eventName}`, eventData);
    
    // Example: Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, eventData);
    // }
}

// Initialize URL parameters on page load
function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const packageParam = urlParams.get('package');
    
    if (searchParam) {
        searchInput.value = searchParam;
    }
    if (packageParam) {
        packageSelector.value = packageParam;
    }
    
    if (searchParam || packageParam) {
        performSearch();
    }
}

// Call initialization function
initializeFromURL();