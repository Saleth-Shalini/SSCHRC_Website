/**
 * SSCHRC Impact Statistics — single source of truth
 * Update the values below each month. They appear on:
 *   - index.html (Why SSCHRC section)
 *   - About-shankara/Why-Sri-Shankara.html (Impact by Numbers section)
 */
window.SSCHRC_STATS = {
    asOf: 'May 2026',

    stats: {
        newRegistrations: { value: 104340, suffix: '+' },
        years: { value: 12, suffix: '+' },
        surgeries: { value: 43080, suffix: '+' },
        roboticSurgeries: { value: 993, suffix: '+' },
        radiotherapy: { value: 20932, suffix: '+' },
        daycareChemotherapies: { value: 104968, suffix: '' },
        wardChemotherapies: { value: 102067, suffix: '' },
        totalChemotherapies: { value: 226882, suffix: '+' },
        bmt: { value: 209, suffix: '' },
        paediatricPatients: { value: 2536, suffix: '+' },
        ipdAdmissions: { value: 51337, suffix: '+' }
    }
};

(function () {
    'use strict';

    function getStat(key) {
        return window.SSCHRC_STATS.stats[key] || null;
    }

    function formatIndianNumber(value) {
        return Number(value).toLocaleString('en-IN');
    }

    function applyAsOfDates() {
        document.querySelectorAll('[data-stat-as-of]').forEach(function (el) {
            var prefix = el.getAttribute('data-stat-as-of-prefix') || 'As of ';
            el.textContent = prefix + window.SSCHRC_STATS.asOf;
        });
    }

    function applyStaticStats() {
        document.querySelectorAll('[data-stat]').forEach(function (el) {
            if (el.classList.contains('stat-counter')) {
                return;
            }

            var stat = getStat(el.getAttribute('data-stat'));
            if (!stat) {
                return;
            }

            var suffix = stat.suffix || '';
            el.textContent = formatIndianNumber(stat.value) + suffix;
        });
    }

    function initAnimatedCounters() {
        var counters = document.querySelectorAll('.stat-counter[data-stat]');
        if (!counters.length) {
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                var counter = entry.target;
                var stat = getStat(counter.getAttribute('data-stat'));
                if (!stat) {
                    observer.unobserve(counter);
                    return;
                }

                var target = stat.value;
                var suffix = stat.suffix || '';
                var duration = 2000;
                var increment = target / (duration / 16);
                var current = 0;

                function updateCounter() {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current) + suffix;
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target + suffix;
                    }
                }

                updateCounter();
                observer.unobserve(counter);
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -50px 0px'
        });

        counters.forEach(function (counter) {
            var stat = getStat(counter.getAttribute('data-stat'));
            counter.textContent = '0' + (stat ? stat.suffix : '');
            observer.observe(counter);
        });
    }

    function initStats() {
        applyAsOfDates();
        applyStaticStats();
        initAnimatedCounters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStats);
    } else {
        initStats();
    }
})();
