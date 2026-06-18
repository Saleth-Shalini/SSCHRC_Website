(function () {
    'use strict';

    if (window.SSCHRC_LANG) return;
    window.SSCHRC_LANG = true;

    var STORAGE_KEY = 'sschrc-lang';
    var GOOGTRANS_COOKIE = 'googtrans';
    var currentLang = 'en';
    var textNodeOriginals = new WeakMap();
    var attrOriginals = new WeakMap();
    var originalDocumentTitle = document.title;
    var sortedTranslationKeys = null;
    var languageFeatureInitialized = false;
    var languageObserver = null;
    var isApplyingLanguage = false;
    var mutationTimer = null;
    var googleTranslateLoading = false;
    var googleTranslateReady = false;
    var useGoogleTranslate = window.location.protocol !== 'file:';

    try {
        currentLang = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sschrc-index-lang') || 'en';
        if (currentLang !== 'kn' && currentLang !== 'en') currentLang = 'en';
        localStorage.setItem(STORAGE_KEY, currentLang);
    } catch (err) {
        currentLang = 'en';
    }

    function setGoogTransCookie(value) {
        var hostname = window.location.hostname;
        document.cookie = GOOGTRANS_COOKIE + '=' + value + ';path=/';
        if (hostname && hostname !== 'localhost') {
            document.cookie = GOOGTRANS_COOKIE + '=' + value + ';path=/;domain=' + hostname;
            if (hostname.indexOf('.') !== -1) {
                document.cookie = GOOGTRANS_COOKIE + '=' + value + ';path=/;domain=.' + hostname;
            }
        }
    }

    function clearGoogTransCookie() {
        var hostname = window.location.hostname;
        var expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
        document.cookie = GOOGTRANS_COOKIE + '=;' + expires + ';path=/';
        if (hostname) {
            document.cookie = GOOGTRANS_COOKIE + '=;' + expires + ';path=/;domain=' + hostname;
            if (hostname.indexOf('.') !== -1) {
                document.cookie = GOOGTRANS_COOKIE + '=;' + expires + ';path=/;domain=.' + hostname;
            }
        }
    }

    function syncGoogTransCookie(lang) {
        if (lang === 'kn') {
            setGoogTransCookie('/en/kn');
        } else {
            clearGoogTransCookie();
        }
    }

    syncGoogTransCookie(currentLang);

    /*TRANSLATIONS*/

    function getSortedKeys() {
        if (!sortedTranslationKeys) {
            sortedTranslationKeys = Object.keys(translations).sort(function (a, b) {
                return b.length - a.length;
            });
        }
        return sortedTranslationKeys;
    }

    function translateString(text, lang) {
        if (!text || lang !== 'kn') return text;
        var result = text;
        var keys = getSortedKeys();
        for (var i = 0; i < keys.length; i++) {
            if (result.indexOf(keys[i]) !== -1) {
                result = result.split(keys[i]).join(translations[keys[i]]);
            }
        }
        return result;
    }

    function shouldSkipNode(node) {
        var parent = node.parentElement;
        if (!parent) return true;
        if (parent.closest(
            'script, style, noscript, .lang-switcher, .notranslate, .stat-counter, [data-stat], [data-stat-as-of], ' +
            '#chatbox-container3, #chat-fab3, svg, .carousel-nav, input, textarea, select, option'
        )) {
            return true;
        }
        return false;
    }

    function formatIndianNumber(value) {
        return Number(value).toLocaleString('en-IN');
    }

    function markProtectedElements() {
        var selectors = [
            '.lang-switcher',
            '.stat-counter',
            '[data-stat]',
            '[data-stat-as-of]',
            '#chatbox-container3',
            '#chat-fab3',
            '.carousel-nav',
            '#google_translate_element'
        ];
        selectors.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                el.classList.add('notranslate');
            });
        });
        document.querySelectorAll('#chatbox-container3 input, #chatbox-container3 textarea, #chatbox-container3 select, script, style, noscript, svg').forEach(function (el) {
            el.classList.add('notranslate');
        });
    }

    function refreshStatsDisplay() {
        if (!window.SSCHRC_STATS) return;
        document.querySelectorAll('[data-stat-as-of]').forEach(function (el) {
            var prefix = el.getAttribute('data-stat-as-of-prefix') || 'As of ';
            if (currentLang === 'kn') {
                el.textContent = translateString(prefix + window.SSCHRC_STATS.asOf, 'kn');
            } else {
                el.textContent = prefix + window.SSCHRC_STATS.asOf;
            }
        });
        document.querySelectorAll('.stat-counter[data-stat]').forEach(function (el) {
            var key = el.getAttribute('data-stat');
            var stat = window.SSCHRC_STATS.stats[key];
            if (!stat) return;
            el.textContent = formatIndianNumber(stat.value) + (stat.suffix || '');
        });
    }

    function translateRootElement(root, lang) {
        if (!root) return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
                if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        while (walker.nextNode()) {
            var node = walker.currentNode;
            if (!textNodeOriginals.has(node)) {
                textNodeOriginals.set(node, node.textContent);
            }
            var original = textNodeOriginals.get(node);
            node.textContent = lang === 'kn' ? translateString(original, 'kn') : original;
        }
    }

    function translatePageContent(lang) {
        var skipIds = { 'dynamic-header': 1, 'hospital-footer': 1, 'chatbox-container3': 1, 'chat-fab3': 1, 'google_translate_element': 1 };
        var wrapper = document.getElementById('page-content-wrapper');
        if (wrapper) {
            translateRootElement(wrapper, lang);
        }
        var mainEl = document.querySelector('main');
        if (mainEl && (!wrapper || !wrapper.contains(mainEl))) {
            translateRootElement(mainEl, lang);
        }
        Array.prototype.forEach.call(document.body.children, function (child) {
            if (!child || child.nodeType !== 1) return;
            var tag = child.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'header' || tag === 'footer') return;
            if (child.id && skipIds[child.id]) return;
            if (wrapper && (child === wrapper || wrapper.contains(child))) return;
            translateRootElement(child, lang);
        });
    }

    function translateAttributes(lang) {
        document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function (el) {
            if (el.closest('.lang-switcher, #chatbox-container3')) return;
            if (!attrOriginals.has(el)) {
                attrOriginals.set(el, {
                    placeholder: el.getAttribute('placeholder'),
                    title: el.getAttribute('title'),
                    ariaLabel: el.getAttribute('aria-label')
                });
            }
            var orig = attrOriginals.get(el);
            if (lang === 'kn') {
                if (orig.placeholder) el.setAttribute('placeholder', translateString(orig.placeholder, 'kn'));
                if (orig.title) el.setAttribute('title', translateString(orig.title, 'kn'));
                if (orig.ariaLabel) el.setAttribute('aria-label', translateString(orig.ariaLabel, 'kn'));
            } else {
                if (orig.placeholder) el.setAttribute('placeholder', orig.placeholder);
                if (orig.title) el.setAttribute('title', orig.title);
                if (orig.ariaLabel) el.setAttribute('aria-label', orig.ariaLabel);
            }
        });
    }

    function ensureGoogleTranslateElement() {
        if (document.getElementById('google_translate_element')) return;
        var div = document.createElement('div');
        div.id = 'google_translate_element';
        div.className = 'notranslate';
        div.setAttribute('aria-hidden', 'true');
        document.body.appendChild(div);
    }

    function loadGoogleTranslate(callback) {
        if (!useGoogleTranslate) {
            if (callback) callback(false);
            return;
        }
        if (googleTranslateReady && window.google && window.google.translate) {
            if (callback) callback(true);
            return;
        }
        if (googleTranslateLoading) {
            window.setTimeout(function () { loadGoogleTranslate(callback); }, 150);
            return;
        }
        googleTranslateLoading = true;
        ensureGoogleTranslateElement();
        window.googleTranslateElementInit = function () {
            try {
                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,kn',
                    autoDisplay: false,
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
                }, 'google_translate_element');
                googleTranslateReady = true;
            } catch (err) {
                useGoogleTranslate = false;
            }
            googleTranslateLoading = false;
            if (callback) callback(googleTranslateReady);
        };
        var script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.onerror = function () {
            googleTranslateLoading = false;
            useGoogleTranslate = false;
            if (callback) callback(false);
        };
        document.head.appendChild(script);
    }

    function triggerGoogleTranslate(lang, attempt) {
        attempt = attempt || 0;
        var select = document.querySelector('select.goog-te-combo');
        if (!select) {
            if (attempt < 40) {
                window.setTimeout(function () { triggerGoogleTranslate(lang, attempt + 1); }, 200);
            }
            return;
        }
        var target = lang === 'kn' ? 'kn' : '';
        if (select.value !== target) {
            select.value = target;
            select.dispatchEvent(new Event('change'));
        }
    }

    function applyDictionaryTranslation(lang) {
        translateRootElement(document.getElementById('dynamic-header'), lang);
        translatePageContent(lang);
        translateRootElement(document.getElementById('hospital-footer'), lang);
        translateAttributes(lang);
        document.title = lang === 'kn' ? translateString(originalDocumentTitle, 'kn') : originalDocumentTitle;
        refreshStatsDisplay();
    }

    function updateLanguageButtonLabels(lang) {
        document.querySelectorAll('.lang-switcher .lang-current-label').forEach(function (el) {
            el.textContent = lang === 'kn' ? 'ಕನ್ನಡ' : 'EN';
        });
        document.querySelectorAll('.lang-switcher [data-lang]').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    }

    function closeAllLanguageDropdowns() {
        document.querySelectorAll('.lang-switcher.open').forEach(function (switcher) {
            switcher.classList.remove('open');
            var toggle = switcher.querySelector('.lang-btn');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    }

    function toggleLanguageDropdown(switcher) {
        if (!switcher) return;
        var isOpen = switcher.classList.contains('open');
        closeAllLanguageDropdowns();
        if (!isOpen) {
            switcher.classList.add('open');
            var toggle = switcher.querySelector('.lang-btn');
            if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
    }

    function reconnectLanguageObserver() {
        if (!languageObserver || !document.body) return;
        languageObserver.observe(document.body, { childList: true, subtree: true });
    }

    function applyLanguageOnPage(lang) {
        if (isApplyingLanguage) return;
        isApplyingLanguage = true;
        if (languageObserver) languageObserver.disconnect();
        try {
            currentLang = lang;
            document.documentElement.lang = lang === 'kn' ? 'kn' : 'en';
            markProtectedElements();
            updateLanguageButtonLabels(lang);
            applyDictionaryTranslation(lang);

            if (lang === 'kn' && useGoogleTranslate) {
                syncGoogTransCookie('kn');
                loadGoogleTranslate(function (ready) {
                    if (ready) {
                        triggerGoogleTranslate('kn');
                        window.setTimeout(function () {
                            applyDictionaryTranslation('kn');
                            markProtectedElements();
                        }, 800);
                        window.setTimeout(function () {
                            triggerGoogleTranslate('kn');
                            applyDictionaryTranslation('kn');
                            markProtectedElements();
                        }, 2000);
                    }
                });
            }
        } finally {
            isApplyingLanguage = false;
            reconnectLanguageObserver();
        }
    }

    function applyLanguage(lang) {
        if (lang !== 'kn' && lang !== 'en') lang = 'en';
        if (lang === currentLang) {
            closeAllLanguageDropdowns();
            return;
        }
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) {}
        syncGoogTransCookie(lang);
        window.location.reload();
    }

    function handleDynamicContentUpdate() {
        if (isApplyingLanguage) return;
        updateLanguageButtonLabels(currentLang);
        markProtectedElements();
        if (currentLang !== 'kn') return;
        isApplyingLanguage = true;
        if (languageObserver) languageObserver.disconnect();
        try {
            applyDictionaryTranslation('kn');
            if (useGoogleTranslate && googleTranslateReady) {
                triggerGoogleTranslate('kn');
            }
        } finally {
            isApplyingLanguage = false;
            reconnectLanguageObserver();
        }
    }

    function setupLanguageClickHandlers() {
        if (languageFeatureInitialized) return;
        languageFeatureInitialized = true;
        document.addEventListener('click', function (e) {
            var langOption = e.target.closest('.lang-switcher [data-lang]');
            if (langOption) {
                e.preventDefault();
                e.stopPropagation();
                applyLanguage(langOption.getAttribute('data-lang'));
                closeAllLanguageDropdowns();
                return;
            }
            var langToggle = e.target.closest('.lang-switcher .lang-btn');
            if (langToggle) {
                e.preventDefault();
                e.stopPropagation();
                toggleLanguageDropdown(langToggle.closest('.lang-switcher'));
                return;
            }
            if (!e.target.closest('.lang-switcher')) {
                closeAllLanguageDropdowns();
            }
        }, false);
        window.addEventListener('resize', closeAllLanguageDropdowns);
    }

    function setupMutationObserver() {
        if (languageObserver) return;
        languageObserver = new MutationObserver(function () {
            clearTimeout(mutationTimer);
            mutationTimer = setTimeout(handleDynamicContentUpdate, 250);
        });
        if (document.body) {
            languageObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    function initLanguageFeature() {
        setupLanguageClickHandlers();
        setupMutationObserver();
        markProtectedElements();
        updateLanguageButtonLabels(currentLang);
        applyLanguageOnPage(currentLang);
        if (currentLang === 'kn') {
            window.setTimeout(function () { applyDictionaryTranslation('kn'); }, 600);
            window.setTimeout(function () { applyDictionaryTranslation('kn'); }, 1500);
            window.setTimeout(function () {
                if (useGoogleTranslate && !googleTranslateReady) {
                    loadGoogleTranslate(function (ready) {
                        if (ready) triggerGoogleTranslate('kn');
                    });
                }
            }, 500);
        }
    }

    window.sschrcGetLang = function () { return currentLang; };
    window.sschrcApplyLanguage = applyLanguage;
    window.sschrcTranslateString = function (text) {
        return translateString(text, currentLang);
    };
    window.sschrcRefreshLanguage = function () {
        if (currentLang === 'kn') {
            handleDynamicContentUpdate();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLanguageFeature);
    } else {
        initLanguageFeature();
    }
})();
