// Enhanced Script for Cancer We Treat Page - All Sections Working
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing all sections...');

    // =============================================
    // 1. RISK FACTORS & PREVENTION TABS SECTION
    // =============================================
    function initializeTabs() {
        const tabButtons4 = document.querySelectorAll('.tab-button4');
        if (tabButtons4.length > 0) {
            console.log('Initializing tabs...');
            tabButtons4.forEach((button) => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active class from all buttons and contents
                    document.querySelectorAll('.tab-button4').forEach((btn) => btn.classList.remove('active4'));
                    document.querySelectorAll('.tab-pane4').forEach((tab) => tab.classList.remove('active4'));

                    // Add active class to clicked button and associated tab
                    button.classList.add('active4');
                    const tabId = button.getAttribute('data-tab');
                    const targetTab = document.getElementById(tabId);
                    if (targetTab) {
                        targetTab.classList.add('active4');
                    }
                });
            });
        }
    }

    // =============================================
    // 2. DIAGNOSIS TABS SECTION (If exists)
    // =============================================
    function initializeDiagnosisTabs() {
        const diagnosisButtons4 = document.querySelectorAll('.diagnosis-button4');
        if (diagnosisButtons4.length > 0) {
            console.log('Initializing diagnosis tabs...');
            diagnosisButtons4.forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    // Hide all contents
                    document.querySelectorAll('.diagnosis-content4').forEach(content => {
                        content.style.display = 'none';
                    });

                    // Remove active class from all buttons
                    document.querySelectorAll('.diagnosis-button4').forEach(btn => {
                        btn.classList.remove('active4');
                    });

                    // Show the selected content and add active class to the clicked button
                    const tabId = event.target.getAttribute('data-diagnosis-tab');
                    const targetContent = document.getElementById(tabId);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                        event.target.classList.add('active4');
                    }
                });
            });
        }
    }

    // =============================================
    // 3. ADVANCED TREATMENT ACCORDION SECTION
    // =============================================
    function initializeTreatmentAccordion() {
        const treatmentCards = document.querySelectorAll('.treatment-card4');
        if (treatmentCards.length > 0) {
            console.log('Initializing treatment accordion...');
            
            treatmentCards.forEach(card => {
                const header = card.querySelector('.treatment-card-header4');
                const content = card.querySelector('.treatment-card-content4');
                const icon = card.querySelector('.treatment-expand-icon4');
                
                if (header && content && icon) {
                    header.addEventListener('click', (e) => {
                        e.preventDefault();
                        const isExpanded = card.classList.contains('expanded');
                        
                        // Close all other cards
                        treatmentCards.forEach(otherCard => {
                            if (otherCard !== card) {
                                otherCard.classList.remove('expanded');
                                const otherIcon = otherCard.querySelector('.treatment-expand-icon4');
                                if (otherIcon) otherIcon.textContent = '+';
                            }
                        });
                        
                        // Toggle current card
                        if (isExpanded) {
                            card.classList.remove('expanded');
                            icon.textContent = '+';
                        } else {
                            card.classList.add('expanded');
                            icon.textContent = '−';
                        }
                    });
                }
            });
        }
    }

    // =============================================
    // 4. ONCOLOGIST CAROUSEL SECTION
    // =============================================
    let oncoxCurrentSlide4 = 0;
    
    function initializeOncologistCarousel() {
        const oncoxWrapper4 = document.getElementById("oncologist-carousel4");
        const oncoxCards4 = document.querySelectorAll(".doctor-card4");
        
        if (!oncoxWrapper4 || oncoxCards4.length === 0) {
            console.log('Oncologist carousel elements not found');
            return;
        }
        
        console.log('Initializing oncologist carousel...');

        // Calculate cards per view dynamically
        function getCardsPerView4() {
            if (window.innerWidth <= 480) {
                return 1;
            } else if (window.innerWidth <= 768) {
                return 1;
            } else if (window.innerWidth <= 1024) {
                return 2;
            } else {
                return 3;
            }
        }

        function moveDoctorCarousel4(direction) {
            const totalCards = oncoxCards4.length;
            const cardsToShow = getCardsPerView4();
            const cardWidthWithGap = oncoxCards4[0].offsetWidth + 20;

            oncoxCurrentSlide4 += direction;

            if (oncoxCurrentSlide4 < 0) {
                oncoxCurrentSlide4 = Math.max(0, totalCards - cardsToShow);
            } else if (oncoxCurrentSlide4 > totalCards - cardsToShow) {
                oncoxCurrentSlide4 = 0;
            }

            const translateX = -oncoxCurrentSlide4 * cardWidthWithGap;
            oncoxWrapper4.style.transform = `translateX(${translateX}px)`;
        }

        // Expose function to global scope
        window.moveDoctorCarousel4 = moveDoctorCarousel4;

        // Handle window resize
        window.addEventListener('resize', () => {
            oncoxCurrentSlide4 = 0;
            if (oncoxWrapper4) {
                oncoxWrapper4.style.transform = `translateX(0px)`;
            }
        });

        // Auto-advance carousel
        setInterval(() => {
            moveDoctorCarousel4(1);
        }, 5000);
    }

    // =============================================
    // 5. PATIENT TESTIMONIALS CAROUSEL SECTION
    // =============================================
    let currentTestimonial4 = 0;
    
    function initializeTestimonialsCarousel() {
        const testimonialWrapper4 = document.getElementById('testimonials-wrapper4');
        const testimonialSlides4 = document.querySelectorAll('.testimonial-slide4');
        const testimonialIndicators4 = document.querySelectorAll('.testimonial-indicator4');
        
        if (!testimonialWrapper4 || testimonialSlides4.length === 0) {
            console.log('Testimonials carousel elements not found');
            return;
        }
        
        console.log('Initializing testimonials carousel...');
        const totalTestimonials4 = testimonialSlides4.length;

        function updateTestimonialIndicators4() {
            if (testimonialIndicators4.length > 0) {
                testimonialIndicators4.forEach((indicator, index) => {
                    indicator.classList.toggle('active4', index === currentTestimonial4);
                });
            }
        }

        function moveTestimonial4(direction) {
            currentTestimonial4 += direction;
            
            if (currentTestimonial4 < 0) {
                currentTestimonial4 = totalTestimonials4 - 1;
            } else if (currentTestimonial4 >= totalTestimonials4) {
                currentTestimonial4 = 0;
            }
            
            const translateX = -currentTestimonial4 * 100;
            testimonialWrapper4.style.transform = `translateX(${translateX}%)`;
            updateTestimonialIndicators4();
        }

        function goToTestimonial4(index) {
            currentTestimonial4 = index;
            const translateX = -currentTestimonial4 * 100;
            testimonialWrapper4.style.transform = `translateX(${translateX}%)`;
            updateTestimonialIndicators4();
        }

        // Expose functions to global scope
        window.moveTestimonial4 = moveTestimonial4;
        window.goToTestimonial4 = goToTestimonial4;

        // Auto-advance testimonials
        setInterval(() => {
            moveTestimonial4(1);
        }, 6000);

        // Touch/swipe support
        let startX4 = 0;
        let endX4 = 0;

        testimonialWrapper4.addEventListener('touchstart', (e) => {
            startX4 = e.touches[0].clientX;
        }, { passive: true });

        testimonialWrapper4.addEventListener('touchend', (e) => {
            endX4 = e.changedTouches[0].clientX;
            handleSwipe4();
        }, { passive: true });

        function handleSwipe4() {
            const threshold = 50;
            const diff = startX4 - endX4;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    moveTestimonial4(1);
                } else {
                    moveTestimonial4(-1);
                }
            }
        }

        updateTestimonialIndicators4();
    }

    // =============================================
    // 6. CHEMOTHERAPY UNITS CAROUSEL SECTION
    // =============================================
    let currentChemoSlide4 = 0;
    
    function initializeChemoCarousel() {
        const chemoWrapper4 = document.getElementById('chemo-carousel-wrapper4');
        const chemoCards4 = document.querySelectorAll('.chemo-unit-card4');
        const chemoIndicators4 = document.querySelectorAll('.chemo-indicator4');
        
        if (!chemoWrapper4 || chemoCards4.length === 0) {
            console.log('Chemo carousel elements not found');
            return;
        }
        
        console.log('Initializing chemo carousel...');
        const totalChemoCards4 = chemoCards4.length;

        function getChemoCardsPerView4() {
            if (window.innerWidth <= 480) {
                return 1;
            } else if (window.innerWidth <= 768) {
                return 1;
            } else if (window.innerWidth <= 1024) {
                return 2;
            } else {
                return 3;
            }
        }

        function updateChemoIndicators4() {
            if (chemoIndicators4.length > 0) {
                chemoIndicators4.forEach((indicator, index) => {
                    indicator.classList.toggle('active4', index === currentChemoSlide4);
                });
            }
        }

        function moveChemoCarousel4(direction) {
            const cardsToShow = getChemoCardsPerView4();
            const cardWidthWithGap = chemoCards4[0].offsetWidth + 20;

            currentChemoSlide4 += direction;

            if (currentChemoSlide4 < 0) {
                currentChemoSlide4 = Math.max(0, totalChemoCards4 - cardsToShow);
            } else if (currentChemoSlide4 > totalChemoCards4 - cardsToShow) {
                currentChemoSlide4 = 0;
            }

            const translateX = -currentChemoSlide4 * cardWidthWithGap;
            chemoWrapper4.style.transform = `translateX(${translateX}px)`;
            updateChemoIndicators4();
        }

        function goToChemoSlide4(index) {
            if (index >= 0 && index < totalChemoCards4) {
                currentChemoSlide4 = index;
                const cardWidthWithGap = chemoCards4[0].offsetWidth + 20;
                const translateX = -currentChemoSlide4 * cardWidthWithGap;
                chemoWrapper4.style.transform = `translateX(${translateX}px)`;
                updateChemoIndicators4();
            }
        }

        // Expose functions to global scope
        window.moveChemoCarousel4 = moveChemoCarousel4;
        window.goToChemoSlide4 = goToChemoSlide4;

        // Auto-advance carousel
        setInterval(() => {
            moveChemoCarousel4(1);
        }, 4500);

        // Handle window resize
        window.addEventListener('resize', () => {
            currentChemoSlide4 = 0;
            if (chemoWrapper4) {
                chemoWrapper4.style.transform = `translateX(0px)`;
            }
            updateChemoIndicators4();
        });

        // Touch/swipe support
        let startChemoX4 = 0;
        let endChemoX4 = 0;

        chemoWrapper4.addEventListener('touchstart', (e) => {
            startChemoX4 = e.touches[0].clientX;
        }, { passive: true });

        chemoWrapper4.addEventListener('touchend', (e) => {
            endChemoX4 = e.changedTouches[0].clientX;
            handleChemoSwipe4();
        }, { passive: true });

        function handleChemoSwipe4() {
            const threshold = 50;
            const diff = startChemoX4 - endChemoX4;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    moveChemoCarousel4(1);
                } else {
                    moveChemoCarousel4(-1);
                }
            }
        }

        updateChemoIndicators4();
    }

    // =============================================
    // 7. FOOTER BUTTONS SECTION
    // =============================================
    function initializeFooterButtons() {
        console.log('Initializing footer buttons...');
        
        const donateBtn = document.getElementById('donate-btn');
        const csrBtn = document.getElementById('csr-btn');
        const volunteerBtn = document.getElementById('volunteer-btn');

        if (donateBtn) {
            donateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Thank you for your interest in donating for screening programs!');
            });
        }

        if (csrBtn) {
            csrBtn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Thank you for considering CSR partnerships with us!');
            });
        }

        if (volunteerBtn) {
            volunteerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Thank you for volunteering with us! We appreciate your support.');
            });
        }
    }

    // =============================================
    // 8. FAQ SECTION (Native HTML details/summary - no JS needed)
    // =============================================
    function initializeFAQ() {
        const faqItems = document.querySelectorAll('.faq-details-box4');
        if (faqItems.length > 0) {
            console.log('FAQ section found - using native HTML functionality');
            // FAQ uses native <details>/<summary> functionality
            // Add any custom behavior here if needed
        }
    }

    // =============================================
    // 9. CALL TO ACTION BUTTONS
    // =============================================
    function initializeCTAButtons() {
        const ctaButtons = document.querySelectorAll('.cta-link4, .treatment-cta4, .faq-call-to-action-button4');
        if (ctaButtons.length > 0) {
            console.log('Initializing CTA buttons...');
            ctaButtons.forEach(button => {
                // Only add event listeners to buttons that don't already have href attributes
                if (!button.hasAttribute('href') || button.getAttribute('href') === '#') {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const buttonText = button.textContent.trim();
                        console.log('CTA button clicked:', buttonText);
                        // Add specific actions based on button text if needed
                    });
                }
            });
        }
    }

    // =============================================
    // 10. SMOOTH SCROLLING FOR ANCHOR LINKS
    // =============================================
    function initializeSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // =============================================
    // INITIALIZE ALL SECTIONS
    // =============================================
    try {
        initializeTabs();
        initializeDiagnosisTabs();
        initializeTreatmentAccordion();
        initializeOncologistCarousel();
        initializeTestimonialsCarousel();
        initializeChemoCarousel();
        initializeFooterButtons();
        initializeFAQ();
        initializeCTAButtons();
        initializeSmoothScrolling();
        
        console.log('All sections initialized successfully!');
    } catch (error) {
        console.error('Error initializing sections:', error);
    }
});

// =============================================
// GLOBAL UTILITY FUNCTIONS
// =============================================

// Debounce function for resize events
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

// Handle window resize with debouncing
window.addEventListener('resize', debounce(() => {
    console.log('Window resized - adjusting layouts...');
    // Trigger carousel resets if needed
    const event = new CustomEvent('windowResized');
    document.dispatchEvent(event);
}, 250));

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page is hidden - pausing auto-advance');
    } else {
        console.log('Page is visible - resuming auto-advance');
    }
});

// Error handling for missing elements
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});

// Log when page is fully loaded
window.addEventListener('load', () => {
    console.log('Page fully loaded - all resources loaded');
});