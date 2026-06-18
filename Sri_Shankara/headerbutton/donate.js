(function () {
    'use strict';

    var PRESETS = {
        USD: [50, 100, 250, 500],
        INR: [5000, 10000, 25000, 50000]
    };
    var CURRENCY_META = {
        USD: { symbol: '$', flag: '\uD83C\uDDFA\uD83C\uDDF8', code: 'USD' },
        INR: { symbol: '\u20B9', flag: '\uD83C\uDDEE\uD83C\uDDF3', code: 'INR' }
    };
    var state = { currency: 'USD', amount: 100 };

    function formatDisplay(value, currency) {
        if (value == null || value === '') return '\u2014';
        var num = Number(value);
        if (!num || num <= 0) return '\u2014';
        if (currency === 'USD') {
            return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
        }
        return '\u20B9' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' INR';
    }

    function formatInputValue(value) {
        if (value == null || value === '') return '';
        var num = Number(value);
        if (!num || num <= 0) return '';
        return state.currency === 'USD' ? num.toFixed(2) : String(Math.round(num));
    }

    function renderPresets() {
        var container = document.getElementById('amount-presets');
        if (!container) return;
        var amounts = PRESETS[state.currency];
        container.innerHTML = amounts.map(function (amt) {
            var selected = state.amount === amt ? ' selected' : '';
            var label = state.currency === 'USD'
                ? '$' + amt
                : '\u20B9' + amt.toLocaleString('en-IN');
            return '<button type="button" class="amount-preset-btn' + selected + ' preset-btn-main" data-amount="' + amt + '">' + label + '</button>';
        }).join('');
    }

    function syncProgram() {
        var widgetProgram = document.getElementById('widget-program');
        var formProgram = document.getElementById('program');
        if (widgetProgram && formProgram) {
            formProgram.value = widgetProgram.value;
        }
    }

    function syncDedicate() {
        var checkbox = document.getElementById('dedicate-checkbox');
        var hidden = document.getElementById('dedicate');
        if (checkbox && hidden) {
            hidden.value = checkbox.checked ? '1' : '0';
        }
    }

    function syncUI() {
        var meta = CURRENCY_META[state.currency];
        var prefix = document.getElementById('amount-currency-prefix');
        if (prefix) prefix.textContent = meta.symbol;

        var flag = document.getElementById('currency-flag');
        var code = document.getElementById('currency-code');
        if (flag) flag.textContent = meta.flag;
        if (code) code.textContent = meta.code;

        var customInput = document.getElementById('custom-amount-input');
        if (customInput) {
            customInput.value = formatInputValue(state.amount);
        }

        var display = document.getElementById('amount-display');
        if (display) display.textContent = formatDisplay(state.amount, state.currency);

        var hiddenAmount = document.getElementById('amount');
        if (hiddenAmount) hiddenAmount.value = state.amount ? Math.round(state.amount) : '';

        var hiddenCurrency = document.getElementById('donation_currency');
        if (hiddenCurrency) hiddenCurrency.value = state.currency;

        renderPresets();
        syncProgram();
        syncDedicate();
    }

    function setCurrency(currency) {
        state.currency = currency;
        state.amount = PRESETS[currency][1];
        syncUI();
    }

    function toggleCurrency() {
        setCurrency(state.currency === 'USD' ? 'INR' : 'USD');
    }

    function setAmount(amount) {
        var num = parseFloat(String(amount).replace(/,/g, ''));
        state.amount = (!num || num <= 0) ? null : num;
        syncUI();
    }

    window.scrollToDonationForm = function () {
        var formSection = document.getElementById('donation-form');
        if (!formSection) return;
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        formSection.style.transition = 'box-shadow 0.3s ease';
        formSection.style.boxShadow = '0 0 20px rgba(46, 139, 87, 0.3)';
        setTimeout(function () { formSection.style.boxShadow = ''; }, 2000);
    };

    window.handleWidgetDonate = function () {
        if (!state.amount || state.amount <= 0) {
            showFieldError('amount', 'Please select or enter a donation amount.');
            window.scrollToDonationForm();
            return;
        }
        clearFieldError('amount');
        syncProgram();
        window.scrollToDonationForm();
    };

    window.getDonationAmount = function () { return state.amount; };
    window.getDonationCurrency = function () { return state.currency; };
    window.resetDonationAmountWidget = function () {
        state.currency = 'USD';
        state.amount = PRESETS.USD[1];
        var checkbox = document.getElementById('dedicate-checkbox');
        if (checkbox) checkbox.checked = false;
        var widgetProgram = document.getElementById('widget-program');
        if (widgetProgram) widgetProgram.selectedIndex = 0;
        syncUI();
    };

    function showFieldError(fieldId, message) {
        var errEl = document.getElementById('err_' + fieldId);
        var inputEl = document.getElementById(fieldId);
        if (errEl) {
            errEl.textContent = message;
            errEl.classList.add('visible');
        }
        if (inputEl) {
            inputEl.classList.add('invalid');
        }
    }

    function clearFieldError(fieldId) {
        var errEl = document.getElementById('err_' + fieldId);
        var inputEl = document.getElementById(fieldId);
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('visible');
        }
        if (inputEl) {
            inputEl.classList.remove('invalid');
        }
    }

    function clearAllErrors() {
        ['donor_name', 'program', 'amount', 'pan', 'email', 'contact', 'address', 'transaction_id']
            .forEach(clearFieldError);
    }

    function validateDonationForm() {
        clearAllErrors();
        var valid = true;

        var donor_name = document.getElementById('donor_name').value.trim();
        if (!donor_name) {
            showFieldError('donor_name', 'Name of the Donor is required.');
            valid = false;
        } else if (!/^[A-Za-z\s]+$/.test(donor_name)) {
            showFieldError('donor_name', 'Name must contain only alphabets and spaces.');
            valid = false;
        } else if (donor_name.length < 3) {
            showFieldError('donor_name', 'Name must be at least 3 characters long.');
            valid = false;
        } else if (donor_name.length > 50) {
            showFieldError('donor_name', 'Name must not exceed 50 characters.');
            valid = false;
        }

        var program = document.getElementById('program').value;
        if (!program) {
            showFieldError('program', 'Please select a program.');
            valid = false;
        }

        var amount = document.getElementById('amount').value.trim();
        if (!amount) {
            showFieldError('amount', 'Donation amount is required.');
            valid = false;
        } else if (!/^\d+$/.test(amount) || parseInt(amount, 10) <= 0) {
            showFieldError('amount', 'Please enter a valid amount greater than 0 (whole numbers only).');
            valid = false;
        }

        var pan = document.getElementById('pan').value.trim().toUpperCase();
        if (!pan) {
            showFieldError('pan', 'PAN Number is required.');
            valid = false;
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            showFieldError('pan', 'Invalid PAN format. Example: ABCDE1234F');
            valid = false;
        }

        var email = document.getElementById('email').value.trim();
        if (!email) {
            showFieldError('email', 'Email Address is required.');
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email', 'Please enter a valid email address.');
            valid = false;
        }

        var contact = document.getElementById('contact').value.trim();
        if (!contact) {
            showFieldError('contact', 'Contact Number is required.');
            valid = false;
        } else if (!/^\d{10}$/.test(contact)) {
            showFieldError('contact', 'Contact Number must be exactly 10 digits.');
            valid = false;
        }

        var address = document.getElementById('address').value.trim();
        if (!address) {
            showFieldError('address', 'Address is required.');
            valid = false;
        }

        var txn = document.getElementById('transaction_id').value.trim();
        if (!txn) {
            showFieldError('transaction_id', 'UTR/Transaction ID is required.');
            valid = false;
        } else if (!/^[A-Za-z0-9]{6,30}$/.test(txn)) {
            showFieldError('transaction_id', 'Transaction ID must be 6\u201330 alphanumeric characters.');
            valid = false;
        }

        return valid;
    }

    function showNotification(message, type) {
        var existing = document.querySelector('.form-notification');
        if (existing) existing.remove();

        var notification = document.createElement('div');
        notification.className = 'form-notification ' + type;
        notification.innerHTML =
            '<div style="display:flex;align-items:center;gap:0.75rem">' +
            '<i class="fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle') + '"></i>' +
            '<span>' + message + '</span></div>';
        document.body.appendChild(notification);
        requestAnimationFrame(function () { notification.classList.add('show'); });
        setTimeout(function () {
            notification.classList.remove('show');
            setTimeout(function () { notification.remove(); }, 300);
        }, 5000);
    }

    function initDonationWidget() {
        syncUI();

        var currencyBadge = document.getElementById('currency-badge');
        if (currencyBadge) currencyBadge.addEventListener('click', toggleCurrency);

        document.addEventListener('click', function (e) {
            var preset = e.target.closest('.preset-btn-main');
            if (preset) {
                setAmount(preset.getAttribute('data-amount'));
                clearFieldError('amount');
            }
        });

        var customInput = document.getElementById('custom-amount-input');
        if (customInput) {
            customInput.addEventListener('input', function () {
                var raw = customInput.value.replace(/[^\d.]/g, '');
                if (raw) {
                    setAmount(raw);
                    clearFieldError('amount');
                } else {
                    state.amount = null;
                    syncUI();
                }
            });
            customInput.addEventListener('blur', function () {
                if (state.amount) syncUI();
            });
        }

        var widgetProgram = document.getElementById('widget-program');
        if (widgetProgram) {
            widgetProgram.addEventListener('change', function () {
                syncProgram();
                clearFieldError('program');
            });
        }

        var dedicateCheckbox = document.getElementById('dedicate-checkbox');
        if (dedicateCheckbox) {
            dedicateCheckbox.addEventListener('change', syncDedicate);
        }
    }

    function initReceiptForm() {
        var form = document.querySelector('form[action="donate.php"]');
        if (!form) return;

        ['donor_name', 'program', 'amount', 'pan', 'email', 'contact', 'address', 'transaction_id'].forEach(function (fid) {
            var el = document.getElementById(fid);
            if (!el) return;
            el.addEventListener('input', function () { clearFieldError(fid); });
            el.addEventListener('change', function () { clearFieldError(fid); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateDonationForm()) {
                var firstErr = form.querySelector('.invalid');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            var submitBtn = form.querySelector('button[type="submit"]');
            var originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            fetch('donate.php', { method: 'POST', body: new FormData(form) })
                .then(function (response) {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(function (data) {
                    if (data.status === 'success') {
                        if (typeof gtag === 'function') {
                            gtag('event', 'donate_submit', { transport_type: 'beacon' });
                        }
                        showNotification(data.message, 'success');
                        form.reset();
                        if (window.resetDonationAmountWidget) window.resetDonationAmountWidget();
                    } else {
                        showNotification(data.message || 'An error occurred. Please try again.', 'error');
                    }
                })
                .catch(function () {
                    showNotification('An error occurred while submitting your request. Please try again later.', 'error');
                })
                .finally(function () {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initDonationWidget();
        initReceiptForm();
    });
})();
