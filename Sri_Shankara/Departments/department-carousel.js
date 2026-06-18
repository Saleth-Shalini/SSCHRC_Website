(function () {
    'use strict';

    var currentSlide = 0;
    var slidesPerView = 3;
    var autoRotateInterval = null;

    function updateSlidesPerView() {
        if (window.innerWidth < 768) {
            slidesPerView = 1;
        } else if (window.innerWidth < 1024) {
            slidesPerView = 2;
        } else {
            slidesPerView = 3;
        }
        updateCarousel();
        updateDots();
    }

    function updateCarousel() {
        var track = document.getElementById('carouselTrack');
        if (!track) return;
        var cards = track.getElementsByClassName('doctor-card-desktop');
        var totalSlides = cards.length;
        if (totalSlides === 0) return;

        var maxSlide = Math.max(0, totalSlides - slidesPerView);
        currentSlide = Math.min(currentSlide, maxSlide);

        var firstCard = cards[0];
        if (!firstCard) return;

        var trackStyle = window.getComputedStyle(track);
        var gap = parseFloat(trackStyle.gap) || (window.innerWidth < 768 ? 16 : 24);
        var offset = currentSlide * (firstCard.offsetWidth + gap);
        track.style.transform = 'translateX(-' + offset + 'px)';
    }

    window.moveCarousel = function (direction) {
        var track = document.getElementById('carouselTrack');
        if (!track) return;
        var cards = track.getElementsByClassName('doctor-card-desktop');
        var totalSlides = cards.length;
        var maxSlide = Math.max(0, totalSlides - slidesPerView);

        currentSlide += direction;
        if (currentSlide < 0) currentSlide = maxSlide;
        else if (currentSlide > maxSlide) currentSlide = 0;

        updateCarousel();
        updateDots();
        resetAutoRotate();
    };

    function startAutoRotate() {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(function () {
            var track = document.getElementById('carouselTrack');
            if (!track) return;
            var cards = track.getElementsByClassName('doctor-card-desktop');
            var totalSlides = cards.length;
            if (totalSlides === 0) return;
            var maxSlide = Math.max(0, totalSlides - slidesPerView);
            currentSlide += 1;
            if (currentSlide > maxSlide) currentSlide = 0;
            updateCarousel();
            updateDots();
        }, 5000);
    }

    function stopAutoRotate() {
        if (autoRotateInterval) {
            clearInterval(autoRotateInterval);
            autoRotateInterval = null;
        }
    }

    function resetAutoRotate() {
        stopAutoRotate();
        startAutoRotate();
    }

    function updateDots() {
        var dotsContainer = document.getElementById('carouselDots');
        var track = document.getElementById('carouselTrack');
        if (!dotsContainer || !track) return;

        var cards = track.getElementsByClassName('doctor-card-desktop');
        var totalSlides = cards.length;
        var totalDots = Math.ceil(totalSlides / slidesPerView);

        dotsContainer.innerHTML = '';
        for (var i = 0; i < totalDots; i++) {
            var dot = document.createElement('div');
            dot.className = 'carousel-dot';
            if (Math.floor(currentSlide / slidesPerView) === i ||
                (currentSlide === totalSlides - slidesPerView && i === totalDots - 1)) {
                dot.classList.add('active');
            }
            (function (index) {
                dot.onclick = function () {
                    currentSlide = index * slidesPerView;
                    updateCarousel();
                    updateDots();
                    resetAutoRotate();
                };
            })(i);
            dotsContainer.appendChild(dot);
        }
    }

    function initCarousel() {
        var track = document.getElementById('carouselTrack');
        if (!track) return;

        updateSlidesPerView();
        updateDots();
        startAutoRotate();

        var carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', stopAutoRotate);
            carouselContainer.addEventListener('mouseleave', startAutoRotate);
        }

        var touchStartX = 0;
        track.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        track.addEventListener('touchend', function (e) {
            var touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) window.moveCarousel(1);
            if (touchEndX > touchStartX + 50) window.moveCarousel(-1);
        }, { passive: true });
    }

    function initScrollAnimations() {
        if (!('IntersectionObserver' in window)) return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) entry.target.classList.add('animate-slide-up');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.card-hover, .dept-mission-card, .specialty-card').forEach(function (el) {
            observer.observe(el);
        });
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;
                var target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function init() {
        initCarousel();
        initScrollAnimations();
        initSmoothScroll();
    }

    window.addEventListener('resize', function () {
        updateSlidesPerView();
        resetAutoRotate();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
