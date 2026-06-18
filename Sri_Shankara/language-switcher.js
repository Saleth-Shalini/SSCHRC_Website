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

    var translations = {
    'Sri Shankara Cancer Hospital & Research Centre, Bengaluru | Advanced Cancer Care & Oncology Research in India': 'ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರು | ಸುಧಾರಿತ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ ಮತ್ತು ಆನ್ಕಾಲಜಿ ಸಂಶೋಧನೆ',
    'Leading cancer care center providing comprehensive oncology services, advanced treatments, and compassionate care for all types of cancer.': 'ಸಮಗ್ರ ಆನ್ಕಾಲಜಿ ಸೇವೆಗಳು, ಸುಧಾರಿತ ಚಿಕಿತ್ಸೆಗಳು ಮತ್ತು ಎಲ್ಲಾ ರೀತಿಯ ಕ್ಯಾನ್ಸರ್‌ಗಳಿಗೆ ಸಹಾನುಭೂತಿಯ ಆರೈಕೆಯನ್ನು ಒದಗಿಸುವ ಪ್ರಮುಖ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ ಕೇಂದ್ರ.',
    'Search for Specialties...': 'ವಿಶೇಷತೆಗಳನ್ನು ಹುಡುಕಿ...',
    'Type your message here...': 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...',
    'Open chat support': 'ಚಾಟ್ ಬೆಂಬಲ ತೆರೆಯಿರಿ',
    'Close chatbox': 'ಚಾಟ್ ಬಾಕ್ಸ್ ಮುಚ್ಚಿರಿ',
    'About Us': 'ನಮ್ಮ ಬಗ್ಗೆ',
    'Contact Us': 'ಸಂಪರ್ಕಿಸಿ',
    'Sister Institutes': 'ಸಹೋದರ ಸಂಸ್ಥೆಗಳು',
    'Emergency': 'ತುರ್ತು',
    'Appointment': 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್',
    'Language': 'ಭಾಷೆ',
    'English': 'ಇಂಗ್ಲಿಷ್',
    'Kannada': 'ಕನ್ನಡ',
    'Careers': 'ಉದ್ಯೋಗಗಳು',
    'Events': 'ಕಾರ್ಯಕ್ರಮಗಳು',
    'Events & Programs': 'ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಪ್ರೋಗ್ರಾಂಗಳು',
    'Events &amp; Programs': 'ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಪ್ರೋಗ್ರಾಂಗಳು',
    'Donate': 'ದಾನ ಮಾಡಿ',
    'Donate / CSR': 'ದಾನ / CSR',
    'Menu': 'ಮೆನು',
    'Departments': 'ವಿಭಾಗಗಳು',
    'Centres of Excellence': 'ಶ್ರೇಷ್ಠತಾ ಕೇಂದ್ರಗಳು',
    'Doctors & Specialists': 'ವೈದ್ಯರು ಮತ್ತು ತಜ್ಞರು',
    'Cancer Screening': 'ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆ',
    'Patient Services': 'ರೋಗಿ ಸೇವೆಗಳು',
    'Cancer Info': 'ಕ್ಯಾನ್ಸರ್ ಮಾಹಿತಿ',
    'Research & Clinical Trials': 'ಸಂಶೋಧನೆ ಮತ್ತು ಕ್ಲಿನಿಕಲ್ ಪ್ರಯೋಗಗಳು',
    'Academics': 'ಶೈಕ್ಷಣಿಕ',
    'Cancer We Treat': 'ನಾವು ಚಿಕಿತ್ಸೆ ನೀಡುವ ಕ್ಯಾನ್ಸರ್',
    'Cancers We Treat': 'ನಾವು ಚಿಕಿತ್ಸೆ ನೀಡುವ ಕ್ಯಾನ್ಸರ್',
    'Book an Appointment': 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    'Book Appointment': 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    'Find your Specialist': 'ನಿಮ್ಮ ತಜ್ಞರನ್ನು ಹುಡುಕಿ',
    'Second Opinion': 'ಎರಡನೇ ಅಭಿಪ್ರಾಯ',
    "Founder's Message": 'ಸ್ಥಾಪಕರ ಸಂದೇಶ',
    'Read Full Message': 'ಪೂರ್ಣ ಸಂದೇಶ ಓದಿ',
    'View Profile': 'ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ',
    'Senior Consultant, Surgical Oncology & Head of the Institution': 'ಹಿರಿಯ ಸಲಹೆಗಾರ, ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಆನ್ಕಾಲಜಿ ಮತ್ತು ಸಂಸ್ಥೆಯ ಮುಖ್ಯಸ್ಥ',
    'Our Centres of Excellence in Oncology': 'ಆನ್ಕಾಲಜಿಯಲ್ಲಿ ನಮ್ಮ ಶ್ರೇಷ್ಠತಾ ಕೇಂದ್ರಗಳು',
    'Advancing Cancer Care Through Technology, Innovation, and Compassionate Excellence': 'ತಂತ್ರಜ್ಞಾನ, ನವೀಕರಣ ಮತ್ತು ಸಹಾನುಭೂತಿಯ ಶ್ರೇಷ್ಠತೆಯ ಮೂಲಕ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆಯನ್ನು ಮುಂದುವರಿಸುವುದು',
    'Our Centres of Excellence in Oncology are built to deliver cutting-edge cancer treatments & precision oncology solutions—all driven by deep clinical expertise & a commitment to patient-first care. Each centre is designed for organ-specific, multidisciplinary cancer care, integrating evidence-based protocols, advanced imaging, & minimally invasive therapies. With a focus on continuous innovation & compassionate outcomes, we strive to transform every cancer journey—from early detection to survivorship.': 'ನಮ್ಮ ಆನ್ಕಾಲಜಿ ಶ್ರೇಷ್ಠತಾ ಕೇಂದ್ರಗಳನ್ನು ಅತ್ಯಾಧುನಿಕ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಳು ಮತ್ತು ನಿಖರ ಆನ್ಕಾಲಜಿ ಪರಿಹಾರಗಳನ್ನು ಒದಗಿಸಲು ನಿರ್ಮಿಸಲಾಗಿದೆ — ಎಲ್ಲವೂ ಆಳವಾದ ಕ್ಲಿನಿಕಲ್ ಪರಿಣತಿ ಮತ್ತು ರೋಗಿ-ಮೊದಲ ಆರೈಕೆಗೆ ಬದ್ಧತೆಯಿಂದ ನಡೆಸಲ್ಪಡುತ್ತವೆ. ಪ್ರತಿ ಕೇಂದ್ರವನ್ನು ಅಂಗ-ನಿರ್ದಿಷ್ಟ, ಬಹು-ವಿಧಾನ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
    'Centre for Breast Diseases': 'ಸ್ತನ ರೋಗಗಳ ಕೇಂದ್ರ',
    'Expert multidisciplinary care, early detection, and innovative treatments.': 'ತಜ್ಞ ಬಹು-ವಿಧಾನ ಆರೈಕೆ, ಪ್ರಾರಂಭಿಕ ಪತ್ತೆ ಮತ್ತು ನವೀನ ಚಿಕಿತ್ಸೆಗಳು.',
    'Shyamji Agarwal Centre for Lung Diseases': 'ಶ್ಯಾಮಜಿ ಅಗರ್ವಾಲ್ ಶ್ವಾಸಕೋಶ ರೋಗಗಳ ಕೇಂದ್ರ',
    'Advanced diagnostics and therapies to treat lung cancers effectively and quickly.': 'ಶ್ವಾಸಕೋಶ ಕ್ಯಾನ್ಸರ್‌ಗಳನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ಮತ್ತು ವೇಗವಾಗಿ ಚಿಕಿತ್ಸೆ ನೀಡಲು ಸುಧಾರಿತ ರೋಗನಿರ್ಣಯ ಮತ್ತು ಚಿಕಿತ್ಸೆಗಳು.',
    'Centre for Robotic Surgery': 'ರೋಬೋಟಿಕ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ',
    'Minimally invasive procedures using Robotic Surgery Console for higher precision and faster recovery.': 'ಹೆಚ್ಚಿನ ನಿಖರತೆ ಮತ್ತು ವೇಗವಾದ ಚೇತರಿಕೆಗಾಗಿ ರೋಬೋಟಿಕ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕನ್ಸೋಲ್ ಬಳಸಿ ಕನಿಷ್ಠ ಆಕ್ರಮಣಕಾರಿ ವಿಧಾನಗಳು.',
    'Parvathi Chandrashekhar Bone Marrow Transplantation Centre': 'ಪಾರ್ವತಿ ಚಂದ್ರಶೇಖರ್ ಅಂತರಾಸ್ಥಿ ಮಜ್ಜೆ ಕಸಿ ಕೇಂದ್ರ',
    'Comprehensive bone marrow transplantation unit for haematological disorders with top-tier facilities.': 'ಉನ್ನತ ಮಟ್ಟದ ಸೌಲಭ್ಯಗಳೊಂದಿಗೆ ರಕ್ತದ ಕಾಯಿಲೆಗಳಿಗೆ ಸಮಗ್ರ ಅಂತರಾಸ್ಥಿ ಮಜ್ಜೆ ಕಸಿ ಘಟಕ.',
    'Centre for Paediatric Oncology': 'ಬಾಲ ಆನ್ಕಾಲಜಿ ಕೇಂದ್ರ',
    'Specialised care for children with cancer in a supportive and child-friendly environment.': 'ಬೆಂಬಲಿಸುವ ಮತ್ತು ಮಕ್ಕಳಿಗೆ ಸ್ನೇಹಪೂರ್ಣ ವಾತಾವರಣದಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ಹೊಂದಿದ ಮಕ್ಕಳಿಗೆ ವಿಶೇಷ ಆರೈಕೆ.',
    'Centre for Gynaecologic Oncology': 'ಸ್ತ್ರೀರೋಗ ಆನ್ಕಾಲಜಿ ಕೇಂದ್ರ',
    "Comprehensive care for women's cancers with advanced minimally invasive surgery, precision radiation therapy, and personalised treatment planning.": 'ಸುಧಾರಿತ ಕನಿಷ್ಠ ಆಕ್ರಮಣಕಾರಿ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ, ನಿಖರ ವಿಕಿರಣ ಚಿಕಿತ್ಸೆ ಮತ್ತು ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಯೋಜನೆಯೊಂದಿಗೆ ಮಹಿಳೆಯರ ಕ್ಯಾನ್ಸರ್‌ಗಳಿಗೆ ಸಮಗ್ರ ಆರೈಕೆ.',
    'Centre for Ophthalmic Oncology': 'ನೇತ್ರ ಆನ್ಕಾಲಜಿ ಕೇಂದ್ರ',
    'Specialized eye cancer care with advanced diagnostics, vision-preserving surgery, and targeted therapies.': 'ಸುಧಾರಿತ ರೋಗನಿರ್ಣಯ, ದೃಷ್ಟಿ ಸಂರಕ್ಷಣೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಗುರಿ ಚಿಕಿತ್ಸೆಗಳೊಂದಿಗೆ ವಿಶೇಷ ನೇತ್ರ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ.',
    'Centre for Head & Neck Oncology': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಆನ್ಕಾಲಜಿ ಕೇಂದ್ರ',
    'Expert management of head and neck cancers using state-of-the-art surgical techniques, targeted therapies, and organ-preserving treatment approaches.': 'ಅತ್ಯಾಧುನಿಕ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ತಂತ್ರಗಳು, ಗುರಿ ಚಿಕಿತ್ಸೆಗಳು ಮತ್ತು ಅಂಗ ಸಂರಕ್ಷಣೆ ಚಿಕಿತ್ಸಾ ವಿಧಾನಗಳನ್ನು ಬಳಸಿ ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಕ್ಯಾನ್ಸರ್‌ಗಳ ತಜ್ಞ ನಿರ್ವಹಣೆ.',
    'Explore More': 'ಇನ್ನಷ್ಟು ಅನ್ವೇಷಿಸಿ',
    'Specialized': 'ವಿಶೇಷ',
    'Advanced': 'ಸುಧಾರಿತ',
    'Innovative': 'ನವೀನ',
    'Expert': 'ತಜ್ಞ',
    'Why SSCHRC': 'ಏಕೆ SSCHRC',
    'Why Sri Shankara': 'ಏಕೆ ಶ್ರೀ ಶಂಕರ',
    '*As Of May 2026': '*ಮೇ 2026 ರ ವರೆಗೆ',
    'As of ': 'ವರೆಗೆ ',
    'Patients': 'ರೋಗಿಗಳು',
    'Years': 'ವರ್ಷಗಳು',
    'Surgeries': 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳು',
    'Robotic Surgeries': 'ರೋಬೋಟಿಕ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳು',
    'Radiotherapy Treatments': 'ವಿಕಿರಣ ಚಿಕಿತ್ಸೆಗಳು',
    'Chemotherapies': 'ಕೀಮೋಥೆರಪಿಗಳು',
    'Bone Marrow Transplantations': 'ಅಂತರಾಸ್ಥಿ ಮಜ್ಜೆ ಕಸಿಗಳು',
    'Paediatric Patients': 'ಬಾಲ ರೋಗಿಗಳು',
    'No. of IPD Admission': 'ಐಪಿಡಿ ಪ್ರವೇಶಗಳ ಸಂಖ್ಯೆ',
    "India's Most Trusted Cancer Care Experts": 'ಭಾರತದ ಅತ್ಯಂತ ವಿಶ್ವಾಸಾರ್ಹ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ ತಜ್ಞರು',
    "Our distinguished oncologists combine unmatched expertise, compassionate care, and unwavering dedication to every patient's journey. Backed by pioneering research and decades of clinical excellence, they set the benchmark for cancer treatment in India.": 'ನಮ್ಮ ಪ್ರತಿಷ್ಠಿತ ಆನ್ಕೋಲಾಜಿಸ್ಟ್‌ಗಳು ಅತ್ಯುತ್ತಮ ಪರಿಣತಿ, ಸಹಾನುಭೂತಿಯ ಆರೈಕೆ ಮತ್ತು ಪ್ರತಿ ರೋಗಿಯ ಪ್ರಯಾಣಕ್ಕೆ ಅಚಲ ಸಮರ್ಪಣೆಯನ್ನು ಸಂಯೋಜಿಸುತ್ತಾರೆ.',
    'Senior Surgical Oncologist & Head of the Institutions': 'ಹಿರಿಯ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಆನ್ಕೋಲಾಜಿಸ್ಟ್ ಮತ್ತು ಸಂಸ್ಥೆಗಳ ಮುಖ್ಯಸ್ಥ',
    'Senior Consultant': 'ಹಿರಿಯ ಸಲಹೆಗಾರ',
    'Senior Consultant & Head': 'ಹಿರಿಯ ಸಲಹೆಗಾರ ಮತ್ತು ಮುಖ್ಯಸ್ಥ',
    'HOD, Senior Consultant': 'ವಿಭಾಗದ ಮುಖ್ಯಸ್ಥ, ಹಿರಿಯ ಸಲಹೆಗಾರ',
    'Consultant': 'ಸಲಹೆಗಾರ',
    'Department Head and Consultant Radiation Oncologist': 'ವಿಭಾಗದ ಮುಖ್ಯಸ್ಥ ಮತ್ತು ಸಲಹೆಗಾರ ವಿಕಿರಣ ಆನ್ಕೋಲಾಜಿಸ್ಟ್',
    'Surgical Oncology': 'ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಆನ್ಕಾಲಜಿ',
    ' yrs exp': ' ವರ್ಷಗಳ ಅನುಭವ',
    'Stories of Hope & Healing': 'ಭರವಸೆ ಮತ್ತು ಗುಣಮುಖತೆಯ ಕಥೆಗಳು',
    'Real stories from real patients who found hope, healing, and renewed life through our comprehensive cancer care. Their journeys inspire us every day to deliver excellence in everything we do.': 'ನಮ್ಮ ಸಮಗ್ರ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆಯ ಮೂಲಕ ಭರವಸೆ, ಗುಣಮುಖತೆ ಮತ್ತು ಹೊಸ ಜೀವನವನ್ನು ಕಂಡ ನಿಜವಾದ ರೋಗಿಗಳ ನಿಜವಾದ ಕಥೆಗಳು.',
    'Age: 50 | Endometrial Cancer': 'ವಯಸ್ಸು: 50 | ಎಂಡೋಮೆಟ್ರಿಯಲ್ ಕ್ಯಾನ್ಸರ್',
    'Colorectal Cancer': 'ಕೊಲೊರೆಕ್ಟಲ್ ಕ್ಯಾನ್ಸರ್',
    'Age: 50 | Stomach Cancer': 'ವಯಸ್ಸು: 50 | ಹೊಟ್ಟೆಯ ಕ್ಯಾನ್ಸರ್',
    "Hodgkin's Lymphoma": 'ಹಾಡ್ಜ್ಕಿನ್ ಲಿಂಫೋಮಾ',
    'Triple Negative Breast Cancer': 'ಟ್ರಿಪಲ್ ನೆಗೆಟಿವ್ ಸ್ತನ ಕ್ಯಾನ್ಸರ್',
    'Acute Lymphoblastic Leukaemia': 'ತೀವ್ರ ಲಿಂಫೋಬ್ಲಾಸ್ಟಿಕ್ ಲ್ಯೂಕೇಮಿಯಾ',
    'Hover to read full story': 'ಪೂರ್ಣ ಕಥೆ ಓದಲು ಹೋವರ್ ಮಾಡಿ',
    'They saved me...': 'ಅವರು ನನ್ನನ್ನು ರಕ್ಷಿಸಿದರು...',
    'Healing with Science & Compassion': 'ವಿಜ್ಞಾನ ಮತ್ತು ಸಹಾನುಭೂತಿಯಿಂದ ಗುಣಮುಖತೆ',
    '"Healing with Science & Compassion"': '"ವಿಜ್ಞಾನ ಮತ್ತು ಸಹಾನುಭೂತಿಯಿಂದ ಗುಣಮುಖತೆ"',
    'Exceptional hospitality...': 'ಅಸಾಧಾರಣ ಆತಿಥ್ಯ...',
    'Cancer free and can still eat!': 'ಕ್ಯಾನ್ಸರ್ ಮುಕ್ತ ಮತ್ತು ಇನ್ನೂ ತಿನ್ನಬಹುದು!',
    '2 graduations in 1 year!': 'ಒಂದು ವರ್ಷದಲ್ಲಿ 2 ಪದವಿಗಳು!',
    'Everything under one roof...': 'ಒಂದೇ ಛಾವಣಿಯ ಕೆಳಗೆ ಎಲ್ಲವೂ...',
    'Strength Through Care': 'ಆರೈಕೆಯ ಮೂಲಕ ಶಕ್ತಿ',
    '"Strength Through Care"': '"ಆರೈಕೆಯ ಮೂಲಕ ಶಕ್ತಿ"',
    '"Strength to fight and win..."': '"ಹೋರಾಡಿ ಗೆಲುವಿಗಾಗಿ ಶಕ್ತಿ..."',
    'Awards & Achievements': 'ಪ್ರಶಸ್ತಿಗಳು ಮತ್ತು ಸಾಧನೆಗಳು',
    'Certificate of Appreciation – Best Hospital for Oncology': 'ಪ್ರಶಂಸಾ ಪ್ರಮಾಣಪತ್ರ – ಆನ್ಕಾಲಜಿಗೆ ಅತ್ಯುತ್ತಮ ಆಸ್ಪತ್ರೆ',
    'Certificate of Appreciation The Best Informative Programme - Vyadi Vydya': 'ಪ್ರಶಂಸಾ ಪ್ರಮಾಣಪತ್ರ ಅತ್ಯುತ್ತಮ ಮಾಹಿತಿ ಕಾರ್ಯಕ್ರಮ - ವ್ಯಾಧಿ ವೈದ್ಯ',
    'Certificate of Excellence - Excellence in Oncology': 'ಶ್ರೇಷ್ಠತಾ ಪ್ರಮಾಣಪತ್ರ - ಆನ್ಕಾಲಜಿಯಲ್ಲಿ ಶ್ರೇಷ್ಠತೆ',
    'Musically Spreading Health and Happiness': 'ಸಂಗೀತದ ಮೂಲಕ ಆರೋಗ್ಯ ಮತ್ತು ಸಂತೋಷವನ್ನು ಹರಡುವುದು',
    '"Advancing People\'s Health in Karnataka : Vision for Progress"': '"ಕರ್ನಾಟಕದಲ್ಲಿ ಜನರ ಆರೋಗ್ಯವನ್ನು ಮುಂದುವರಿಸುವುದು: ಪ್ರಗತಿಗೆ ದೃಷ್ಟಿ"',
    'Appreciation Memento A Journey of Passion': 'ಪ್ರಶಂಸಾ ಸ್ಮಾರಕ ಅಭಿರುಚಿಯ ಪ್ರಯಾಣ',
    'Certificate of Recognition - Excellence in Healthcare under NGO Category': 'ಗುರುತಿನ ಪ್ರಮಾಣಪತ್ರ - ಎನ್ಜಿಒ ವರ್ಗದಲ್ಲಿ ಆರೋಗ್ಯ ಸೇವೆಯಲ್ಲಿ ಶ್ರೇಷ್ಠತೆ',
    'Best Cancer Hospital for Clinical Excellence': 'ಕ್ಲಿನಿಕಲ್ ಶ್ರೇಷ್ಠತೆಗೆ ಅತ್ಯುತ್ತಮ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ',
    'Best Super Speciality Cancer Hospital': 'ಅತ್ಯುತ್ತಮ ಸೂಪರ್ ಸ್ಪೆಷಾಲಿಟಿ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ',
    'Pride of Karnataka Award 2025': 'ಕರ್ನಾಟಕದ ಅಭಿಮಾನ ಪ್ರಶಸ್ತಿ 2025',
    'Indian Medical Awards 2025': 'ಭಾರತೀಯ ವೈದ್ಯಕೀಯ ಪ್ರಶಸ್ತಿಗಳು 2025',
    'New Age Health Care Summit': 'ನ್ಯೂ ಏಜ್ ಆರೋಗ್ಯ ಸಂಪನ್ನತಾ ಶಿಖರ ಸಮ್ಮೇಳನ',
    'Times Health Excellence': 'ಟೈಮ್ಸ್ ಹೆಲ್ತ್ ಎಕ್ಸಲೆನ್ಸ್',
    'Federation of Karnataka Chambers Commerce and Industry': 'ಕರ್ನಾಟಕ ವಾಣಿಜ್ಯ ಮತ್ತು ಕೈಗಾರಿಕಾ ಸಂಘಗಳ ಒಕ್ಕೂಟ',
    'Bangalore JP Nagar Rotaract Club': 'ಬೆಂಗಳೂರು JP ನಗರ ರೋಟರಾಕ್ಟ್ ಕ್ಲಬ್',
    'Kadamba Karnataka': 'ಕದಂಬ ಕರ್ನಾಟಕ',
    'Svarakshema Foundation': 'ಸ್ವರಕ್ಷೇಮ ಫೌಂಡೇಶನ್',
    'Vision Group': 'ವಿಶನ್ ಗ್ರೂಪ್',
    'No results found': 'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    'Cancers You Should Know': 'ನೀವು ತಿಳಿದಿರಬೇಕಾದ ಕ್ಯಾನ್ಸರ್‌ಗಳು',
    'Comprehensive information about all types of cancers we treat': 'ನಾವು ಚಿಕಿತ್ಸೆ ನೀಡುವ ಎಲ್ಲಾ ರೀತಿಯ ಕ್ಯಾನ್ಸರ್‌ಗಳ ಬಗ್ಗೆ ಸಮಗ್ರ ಮಾಹಿತಿ',
    'View all other cancers we treat': 'ನಾವು ಚಿಕಿತ್ಸೆ ನೀಡುವ ಇತರ ಎಲ್ಲಾ ಕ್ಯಾನ್ಸರ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'Breast Cancer': 'ಸ್ತನ ಕ್ಯಾನ್ಸರ್',
    'Gynecologic Cancer': 'ಸ್ತ್ರೀರೋಗ ಕ್ಯಾನ್ಸರ್',
    'Cervical Cancer': 'ಗರ್ಭಾಶಯ ಕ್ಯಾನ್ಸರ್',
    'Ovarian Cancer': 'ಅಂಡಾಶಯ ಕ್ಯಾನ್ಸರ್',
    'Prostate Cancer': 'ಪ್ರಾಸ್ಟೇಟ್ ಕ್ಯಾನ್ಸರ್',
    'Testicular Cancer': 'ವೃಷಣ ಕ್ಯಾನ್ಸರ್',
    'Paediatric Cancer': 'ಬಾಲ ಕ್ಯಾನ್ಸರ್',
    'Head & Neck Cancer': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಕ್ಯಾನ್ಸರ್',
    'Thyroid Cancer': 'ಥೈರಾಯ್ಡ್ ಕ್ಯಾನ್ಸರ್',
    'Lung Cancer': 'ಶ್ವಾಸಕೋಶ ಕ್ಯಾನ್ಸರ್',
    'Gastrointestinal Cancer': 'ಜೀರ್ಣಾಂಗ ಕ್ಯಾನ್ಸರ್',
    'Liver Tumours': 'ಯಕೃತ್ತಿನ ಗೆಡ್ಡೆಗಳು',
    'Pancreatic Cancer': 'ಅಗ್ನ್ಯಾಶಯ ಕ್ಯಾನ್ಸರ್',
    'Brain Tumours': 'ಮೆದುಳಿನ ಗೆಡ್ಡೆಗಳು',
    'Skin Cancer': 'ಚರ್ಮದ ಕ್ಯಾನ್ಸರ್',
    'Kidney Cancers': 'ಮೂತ್ರಪಿಂಡದ ಕ್ಯಾನ್ಸರ್‌ಗಳು',
    'Adrenal Tumour': 'ಅಡ್ರಿನಲ್ ಗೆಡ್ಡೆ',
    'Cancer Specialities': 'ಕ್ಯಾನ್ಸರ್ ವಿಶೇಷತೆಗಳು',
    'Diagnostics Specialities': 'ರೋಗನಿರ್ಣಯ ವಿಶೇಷತೆಗಳು',
    'Clinical Specialities': 'ಕ್ಲಿನಿಕಲ್ ವಿಶೇಷತೆಗಳು',
    'Pathology & Laboratory Medicine': 'ಪ್ಯಾಥಾಲಜಿ ಮತ್ತು ಪ್ರಯೋಗಾಲಯ ವೈದ್ಯ',
    'Supportive Services': 'ಬೆಂಬಲ ಸೇವೆಗಳು',
    'Medical Oncology': 'ವೈದ್ಯಕೀಯ ಆನ್ಕಾಲಜಿ',
    'Radiation Oncology': 'ವಿಕಿರಣ ಆನ್ಕಾಲಜಿ',
    'Our Doctors': 'ನಮ್ಮ ವೈದ್ಯರು',
    'Request an Appointment': 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ವಿನಂತಿಸಿ',
    'Schedule consultation with specialists': 'ತಜ್ಞರೊಂದಿಗೆ ಸಮಾಲೋಚನೆ ನಿಗದಿಪಡಿಸಿ',
    'Meet our expert medical team': 'ನಮ್ಮ ತಜ್ಞ ವೈದ್ಯಕೀಯ ತಂಡವನ್ನು ಭೇಟಿ ಮಾಡಿ',
    'Cancer Screening Packages': 'ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣಾ ಪ್ಯಾಕೇಜ್‌ಗಳು',
    'Advanced Diagnostic Tests': 'ಸುಧಾರಿತ ರೋಗನಿರ್ಣಯ ಪರೀಕ್ಷೆಗಳು',
    'Schedule your visit': 'ನಿಮ್ಮ ಭೇಟಿಯನ್ನು ನಿಗದಿಪಡಿಸಿ',
    'Get expert review': 'ತಜ್ಞರ ಪರಿಶೀಲನೆ ಪಡೆಯಿರಿ',
    'Insurance & Billing': 'ವಿಮೆ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್',
    'Payment information': 'ಪಾವತಿ ಮಾಹಿತಿ',
    'International Patients': 'ಅಂತರರಾಷ್ಟ್ರೀಯ ರೋಗಿಗಳು',
    'Global care services': 'ಜಾಗತಿಕ ಆರೈಕೆ ಸೇವೆಗಳು',
    'Ongoing Clinical Trials': 'ನಡೆಯುತ್ತಿರುವ ಕ್ಲಿನಿಕಲ್ ಪ್ರಯೋಗಗಳು',
    'Participate in groundbreaking research': 'ಕ್ರಾಂತಿಕಾರಿ ಸಂಶೋಧನೆಯಲ್ಲಿ ಭಾಗವಹಿಸಿ',
    'Research': 'ಸಂಶೋಧನೆ',
    'Discover our latest findings': 'ನಮ್ಮ ಇತ್ತೀಚಿನ ಕಂಡುಹಿಡಿತಗಳನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ',
    'Vision & Mission': 'ದೃಷ್ಟಿ ಮತ್ತು ಧ್ಯೇಯ',
    'Our purpose and guiding principles': 'ನಮ್ಮ ಉದ್ದೇಶ ಮತ್ತು ಮಾರ್ಗದರ್ಶಕ ತತ್ವಗಳು',
    'Milestones': 'ಮೈಲಿಗಲ್ಲುಗಳು',
    'Key achievements and growth': 'ಪ್ರಮುಖ ಸಾಧನೆಗಳು ಮತ್ತು ಬೆಳವಣಿಗೆ',
    'Courses offered': 'ನೀಡಲಾಗುವ ಕೋರ್ಸ್‌ಗಳು',
    'Programmes and fellowships': 'ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಫೆಲೋಶಿಪ್‌ಗಳು',
    'Notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'Announcements and updates': 'ಪ್ರಕಟಣೆಗಳು ಮತ್ತು ನವೀಕರಣಗಳು',
    'Sri Shankara Cancer Hospital': 'ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ',
    'Sri Shankara Cancer Hospital & Research Centre is committed to providing world-class cancer care with compassion and excellence.': 'ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರವು ಸಹಾನುಭೂತಿ ಮತ್ತು ಶ್ರೇಷ್ಠತೆಯೊಂದಿಗೆ ವಿಶ್ವಮಟ್ಟದ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆಯನ್ನು ಒದಗಿಸಲು ಬದ್ಧವಾಗಿದೆ.',
    'Accreditation': 'ಮಾನ್ಯತೆ',
    'Quick Links': 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು',
    'Cancer-We-Treat': 'ನಾವು ಚಿಕಿತ್ಸೆ ನೀಡುವ ಕ್ಯಾನ್ಸರ್',
    'Screening': 'ತಪಾಸಣೆ',
    'Screenings': 'ತಪಾಸಣೆಗಳು',
    'Services': 'ಸೇವೆಗಳು',
    'Website Privacy Policy': 'ವೆಬ್‌ಸೈಟ್ ಗೌಪ್ಯತಾ ನೀತಿ',
    'Mobile Application — Privacy Policy': 'ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ — ಗೌಪ್ಯತಾ ನೀತಿ',
    '© 2026 Sri Shankara Cancer Hospital & Research Centre. All rights reserved.': '© 2026 ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ. ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    'Contact Information': 'ಸಂಪರ್ಕ ಮಾಹಿತಿ',
    "At Sri Shankara Cancer Hospital and Research Centre (SSCHRC), we began with a simple yet powerful belief: that quality cancer care should not be a privilege, but a right for every Indian...": 'ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ (SSCHRC) ನಲ್ಲಿ, ಗುಣಮಟ್ಟದ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆಯು ಸವಲತ್ತು ಅಲ್ಲ, ಪ್ರತಿಯೊಬ್ಬ ಭಾರತೀಯರ ಹಕ್ಕಾಗಿರಬೇಕು ಎಂಬ ಸರಳ ಆದರೆ ಶಕ್ತಿಶಾಲಿ ನಂಬಿಕೆಯೊಂದಿಗೆ ನಾವು ಪ್ರಾರಂಭಿಸಿದ್ದೇವೆ...',
    '"I did not have to depend on anyone. I surrendered to God and doctors. Sri Shankara Cancer Hospital and Research Centre is my god, they saved me."': '"ನಾನು ಯಾರ ಮೇಲೂ ಅವಲಂಬಿಸಬೇಕಾಗಿಲ್ಲ. ನಾನು ದೇವರು ಮತ್ತು ವೈದ್ಯರಿಗೆ ಒಪ್ಪಿಸಿದೆ. ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ ನನ್ನ ದೇವರು, ಅವರು ನನ್ನನ್ನು ರಕ್ಷಿಸಿದರು."',
    '"When I first came to Sri Shankara Cancer Hospital and Research Centre, Bangalore, one special thing I observed was their exceptional \'Athithi Sathkara\' which means hospitality. The patient hospitality and care I received from the doctors and staff during my operation and chemotherapy were outstanding."': '"ನಾನು ಮೊದಲ ಬಾರಿಗೆ ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರಿಗೆ ಬಂದಾಗ, ಅವರ ಅಸಾಧಾರಣ \'ಅತಿಥಿ ಸತ್ಕಾರ\' ಅಂದರೆ ಆತಿಥ್ಯವನ್ನು ನಾನು ಗಮನಿಸಿದೆ."',
    '"I often tell other patients that, like accidents, cancer can happen to anyone, and Shankara is here to fix it with science and evidence-based treatments. There\'s no need to feel sad about the disease."': '"ಅಪಘಾತಗಳಂತೆ ಕ್ಯಾನ್ಸರ್ ಯಾರಿಗಾದರೂ ಸಂಭವಿಸಬಹುದು ಮತ್ತು ಶಂಕರ ವಿಜ್ಞಾನ ಮತ್ತು ಸಾಕ್ಷ್ಯ ಆಧಾರಿತ ಚಿಕಿತ್ಸೆಗಳೊಂದಿಗೆ ಅದನ್ನು ಸರಿಪಡಿಸಲು ಇಲ್ಲಿದೆ ಎಂದು ನಾನು ಇತರ ರೋಗಿಗಳಿಗೆ ಹೇಳುತ್ತೇನೆ."',
    '"I thought I\'ll never be able to eat again. But my life changed when you held a camp in my village. I am now cancer free and can still eat!"': '"ನಾನು ಮತ್ತೆ ತಿನ್ನಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ ಎಂದು ಭಾವಿಸಿದೆ. ಆದರೆ ನನ್ನ ಗ್ರಾಮದಲ್ಲಿ ಶಿಬಿರ ನಡೆಸಿದಾಗ ನನ್ನ ಜೀವನ ಬದಲಾಯಿತು. ನಾನು ಈಗ ಕ್ಯಾನ್ಸರ್ ಮುಕ್ತ ಮತ್ತು ಇನ್ನೂ ತಿನ್ನಬಹುದು!"',
    '"I thought I\'ll never be able to graduate, I completed my treatment and 12th standard last year. 2 graduations in 1 year!"': '"ನಾನು ಪದವಿ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ ಎಂದು ಭಾವಿಸಿದೆ, ನಾನು ನನ್ನ ಚಿಕಿತ್ಸೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಕಳೆದ ವರ್ಷ 12ನೇ ತರಗತಿ ಪೂರ್ಣಗೊಳಿಸಿದೆ. ಒಂದು ವರ್ಷದಲ್ಲಿ 2 ಪದವಿಗಳು!"',
    '"Sri Shankara Cancer Hospital and Research Centre, Bangalore provides everything under one roof, I don\'t have to go anywhere else for any kind of diagnosis or tests. Everything is maintained well and done with the thought in mind that the patient needs to recover soon and go back home soon. I am grateful to them because what I am today is because of them."': '"ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರು ಒಂದೇ ಛಾವಣಿಯ ಕೆಳಗೆ ಎಲ್ಲವನ್ನೂ ಒದಗಿಸುತ್ತದೆ. ಯಾವುದೇ ರೀತಿಯ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಪರೀಕ್ಷೆಗಳಿಗೆ ನಾನು ಬೇರೆ ಎಲ್ಲಿಗೂ ಹೋಗಬೇಕಾಗಿಲ್ಲ."',
    '"When my family struggled with the diagnosis, Sri Shankara Cancer Hospital acted immediately. The doctors began treatment without delay, and the nurses supported me like family. I am grateful to Shankara for giving me the strength to fight and overcome cancer."': '"ನನ್ನ ಕುಟುಂಬವು ರೋಗನಿರ್ಣಯದೊಂದಿಗೆ ಹೋರಾಡುತ್ತಿದ್ದಾಗ, ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ತಕ್ಷಣ ಕ್ರಮ ಕೈಗೊಂಡಿತು. ವೈದ್ಯರು ವಿಳಂಬವಿಲ್ಲದೆ ಚಿಕಿತ್ಸೆ ಪ್ರಾರಂಭಿಸಿದರು ಮತ್ತು ನರ್ಸ್‌ಗಳು ಕುಟುಂಬದಂತೆ ನನ್ನನ್ನು ಬೆಂಬಲಿಸಿದರು."',
    '"I am grateful to them because what I am today is because of them."': '"ನಾನು ಇಂದು ಯಾರಾಗಿದ್ದೇನೆ ಅದು ಅವರ್ದೇ ಕಾರಣ, ಅವರಿಗೆ ನಾನು ಕೃತಜ್ಞನಾಗಿದ್ದೇನೆ."',
    'Learn More': 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
    'Read More': 'ಇನ್ನಷ್ಟು ಓದಿ',
    'Submit': 'ಸಲ್ಲಿಸಿ',
    'Get in Touch': 'ಸಂಪರ್ಕಿಸಿ',
    'Our Mission': 'ನಮ್ಮ ಧ್ಯೇಯ',
    'Our Vision': 'ನಮ್ಮ ದೃಷ್ಟಿ',
    'Treatment': 'ಚಿಕಿತ್ಸೆ',
    'Diagnosis': 'ರೋಗನಿರ್ಣಯ',
    'Symptoms': 'ಲಕ್ಷಣಗಳು',
    'Overview': 'ಅವಲೋಕನ',
    'Facilities': 'ಸೌಲಭ್ಯಗಳು',
    'Home': 'ಮುಖಪುಟ',
    'Phone': 'ದೂರವಾಣಿ',
    'Email': 'ಇಮೇಲ್',
    'Address': 'ವಿಳಾಸ',
    'Name': 'ಹೆಸರು',
    'Message': 'ಸಂದೇಶ',
    'Send': 'ಕಳುಹಿಸಿ',
    'Subscribe': 'ಚಂದಾದಾರರಾಗಿ',
    'Haemato-Oncology & BMT': 'ರಕ್ತ ಆನ್ಕಾಲಜಿ ಮತ್ತು BMT',
    'Plastic & Reconstructive Surgery': 'ಪ್ಲಾಸ್ಟಿಕ್ ಮತ್ತು ಪುನರ್ನಿರ್ಮಾಣ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    'Interventional Pulmonology': 'ಇಂಟರ್ವೆನ್ಷನಲ್ ಪಲ್ಮನಾಲಜಿ',
    'Preventive Oncology': 'ತಡೆಗಟ್ಟುವ ಆನ್ಕಾಲಜಿ',
    'Psycho-Oncology': 'ಮನೋ-ಆನ್ಕಾಲಜಿ',
    'Nutrition & Dietetics': 'ಪೋಷಣೆ ಮತ್ತು ಆಹಾರಶಾಸ್ತ್ರ',
    'Physiotherapy & Rehabilitation': 'ಭೌತಚಿಕಿತ್ಸೆ ಮತ್ತು ಪುನರ್ವಸತಿ',
    'Terms of Use': 'ಬಳಕೆಯ ನಿಯಮಗಳು',
    'Disclaimer': 'ಹಕ್ಕು ನಿರಾಕರಣೆ',
    'Sitemap': 'ಸೈಟ್ ನಕ್ಷೆ',
    'Privacy Policy': 'ಗೌಪ್ಯತಾ ನೀತಿ',
    'All rights reserved.': 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    'Toggle mobile menu': 'ಮೊಬೈಲ್ ಮೆನು',
    'Close menu': 'ಮೆನು ಮುಚ್ಚಿರಿ',
    'Main Navigation': 'ಮುಖ್ಯ ನ್ಯಾವಿಗೇಷನ್',
    'About Us | Sri Shankara Cancer Hospital & Research Centre': 'ನಮ್ಮ ಬಗ್ಗೆ | ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ',
    'Ready to Start Your Healing Journey?': 'ನಿಮ್ಮ ಗುಣಮುಖತೆಯ ಪ್ರಯಾಣವನ್ನು ಪ್ರಾರಂಭಿಸಲು ಸಿದ್ಧರಿದ್ದೀರಾ?',
    'Join thousands of patients who have found hope and healing at Sri Shankara Cancer Hospital. Your story of recovery starts with a single step.': 'ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಭರವಸೆ ಮತ್ತು ಗುಣಮುಖತೆಯನ್ನು ಕಂಡ ಸಾವಿರಾರು ರೋಗಿಗಳೊಂದಿಗೆ ಸೇರಿ. ನಿಮ್ಮ ಚೇತರಿಕೆಯ ಕಥೆ ಒಂದೇ ಹೆಜ್ಜೆಯಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.',
    'Book Consultation': 'ಸಮಾಲೋಚನೆ ಬುಕ್ ಮಾಡಿ',
    'Call Emergency 080-4648 4424': 'ತುರ್ತು ಕರೆ 080-4648 4424',
    'Call Appointment 70905 21000': 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕರೆ 70905 21000',
    'Organ-specific Cancer': 'ಅಂಗ-ನಿರ್ದಿಷ್ಟ ಕ್ಯಾನ್ಸರ್',
    'Cancer Specific to Women': 'ಮಹಿಳೆಯರಿಗೆ ನಿರ್ದಿಷ್ಟ ಕ್ಯಾನ್ಸರ್',
    'Cancer Specific to Men': 'ಪುರುಷರಿಗೆ ನಿರ್ದಿಷ್ಟ ಕ್ಯಾನ್ಸರ್',
    'Other Cancers': 'ಇತರ ಕ್ಯಾನ್ಸರ್‌ಗಳು',
    'Blood Cancer': 'ರಕ್ತದ ಕ್ಯಾನ್ಸರ್',
    'Rare Cancers': 'ಅಪರೂಪದ ಕ್ಯಾನ್ಸರ್‌ಗಳು',
    'Gynaec Oncology': 'ಸ್ತ್ರೀರೋಗ ಆನ್ಕಾಲಜಿ',
    'Gynec Oncology': 'ಸ್ತ್ರೀರೋಗ ಆನ್ಕಾಲಜಿ',
    'Head and Neck Oncology': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಆನ್ಕಾಲಜಿ',
    'Paediatric Oncology & BMT': 'ಬಾಲ ಆನ್ಕಾಲಜಿ ಮತ್ತು BMT',
    'Paediatric Oncology': 'ಬಾಲ ಆನ್ಕಾಲಜಿ',
    'Bone & Soft Tissue Oncology': 'ಎಲுமುಳು ಮತ್ತು ಮೃದು ಚರ್ಮ ಆನ್ಕಾಲಜಿ',
    'Genito-Urinary Oncology': 'ಜನನಾಂಗ-ಮೂತ್ರಾಂಗ ಆನ್ಕಾಲಜಿ',
    'Pain & Palliative Care': 'ನೋವು ಮತ್ತು ಪ್ಯಾಲಿಯೇಟಿವ್ ಆರೈಕೆ',
    'Speech & Swallowing Therapy': 'ಮಾತು ಮತ್ತು ನಿಗಳಿಸುವ ಚಿಕಿತ್ಸೆ',
    'Integrative Oncology': 'ಸಮಗ್ರ ಆನ್ಕಾಲಜಿ',
    'Domiciliary Care': 'ಗೃಹ ಆರೈಕೆ',
    'Clinical Pharmacology': 'ಕ್ಲಿನಿಕಲ್ ಔಷಧಶಾಸ್ತ್ರ',
    'Molecular Diagnostics': 'ಅಣು ರೋಗನಿರ್ಣಯ',
    'Microbiology & Virology': 'ಸೂಕ್ಷ್ಮಜೀವಿ ಮತ್ತು ವೈರಾಲಜಿ',
    'Haematopathology': 'ರಕ್ತಪಾಥಾಲಜಿ',
    'Radiodiagnosis': 'ರೇಡಿಯೋ ರೋಗನಿರ್ಣಯ',
    'Nuclear Medicine': 'ಅಣು ವೈದ್ಯ',
    'Interventional Radiology': 'ಇಂಟರ್ವೆನ್ಷನಲ್ ರೇಡಿಯಾಲಜಿ',
    'Transfusion Medicine': 'ರಕ್ತ ವರ್ಗಾವಣೆ ವೈದ್ಯ',
    'Transfusion Medicine <br>& Blood Centre': 'ರಕ್ತ ವರ್ಗಾವಣೆ ವೈದ್ಯ <br>ಮತ್ತು ರಕ್ತ ಕೇಂದ್ರ',
    '& Blood Centre': 'ಮತ್ತು ರಕ್ತ ಕೇಂದ್ರ',
    'Screening & Diagnostics': 'ತಪಾಸಣೆ ಮತ್ತು ರೋಗನಿರ್ಣಯ',
    'Diagnostics': 'ರೋಗನಿರ್ಣಯ',
    'Histopathology': 'ಹಿಸ್ಟೋಪ್ಯಾಥಾಲಜಿ',
    'Biochemistry': 'ಜೈವರಸಾಯನಶಾಸ್ತ್ರ',
    'Endocrinology': 'ಅಂತಃಸ್ರಾವಿ ಶಾಸ್ತ್ರ',
    'Cardiology': 'ಹೃದಯರೋಗ',
    'Nephrology': 'ನೆಫ್ರಾಲಜಿ',
    'Gastroenterology': 'ಜೀರ್ಣಾಂಗಶಾಸ್ತ್ರ',
    'Anaesthesiology': 'ಅನಸ್ಥೀಸಿಯಾಲಜಿ',
    'Head & Neck Oncology': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಆನ್ಕಾಲಜಿ',
    'Ophthalmic Oncology': 'ನೇತ್ರ ಆನ್ಕಾಲಜಿ',
    'Neuro-Oncology': 'ನ್ಯೂರೋ-ಆನ್ಕಾಲಜಿ',
    'Breast and Endocrine Oncology': 'ಸ್ತನ ಮತ್ತು ಅಂತಃಸ್ರಾವಿ ಆನ್ಕಾಲಜಿ',
    'Breast Oncology': 'ಸ್ತನ ಆನ್ಕಾಲಜಿ',
    'Urologic Oncology': 'ಮೂತ್ರಾಂಗ ಆನ್ಕಾಲಜಿ',
    'Bone Marrow Transplant': 'ಅಂತರಾಸ್ಥಿ ಮಜ್ಜೆ ಕಸಿ',
    'Robotic Surgery': 'ರೋಬೋಟಿಕ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    'Gynaecologic Oncology': 'ಸ್ತ್ರೀರೋಗ ಆನ್ಕಾಲಜಿ',
    'Comprehensive': 'ಸಮಗ್ರ',
    'Our Services': 'ನಮ್ಮ ಸೇವೆಗಳು',
    'Your browser does not support the video tag.': 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ವೀಡಿಯೊ ಟ್ಯಾಗ್ ಅನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.',
    'Sri Shankara Logo': 'ಶ್ರೀ ಶಂಕರ ಲೋಗೋ',
    'NABH Accreditation': 'NABH ಮಾನ್ಯತೆ',
    'Follow us on': 'ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ',
    'Advanced BMT services': 'ಸುಧಾರಿತ BMT ಸೇವೆಗಳು',
    'Comprehensive breast cancer treatment': 'ಸಮಗ್ರ ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ',
    'Advanced lung cancer treatment': 'ಸುಧಾರಿತ ಶ್ವಾಸಕೋಶ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ',
    'Comprehensive head and neck cancer care': 'ಸಮಗ್ರ ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ',
    "Children's cancer care": 'ಮಕ್ಕಳ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ',
    'Advanced gynecological cancer treatment': 'ಸುಧಾರಿತ ಸ್ತ್ರೀರೋಗ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ',
    'Advanced robotic procedures': 'ಸುಧಾರಿತ ರೋಬೋಟಿಕ್ ವಿಧಾನಗಳು',
    'Comprehensive early detection screenings': 'ಸಮಗ್ರ ಪ್ರಾರಂಭಿಕ ಪತ್ತೆ ತಪಾಸಣೆಗಳು',
    'State-of-the-art diagnostic services': 'ಅತ್ಯಾಧುನಿಕ ರೋಗನಿರ್ಣಯ ಸೇವೆಗಳು',
    'Breast Cancer Care': 'ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ',
    'Lung Cancer Care': 'ಶ್ವಾಸಕೋಶ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ',
    '— Dr. B.S. Srinath': '— ಡಾ. ಬಿ.ಎಸ್. ಶ್ರೀನಾಥ್',
    '"They saved me..."': '"ಅವರು ನನ್ನನ್ನು ರಕ್ಷಿಸಿದರು..."',
    '"Exceptional hospitality..."': '"ಅಸಾಧಾರಣ ಆತಿಥ್ಯ..."',
    '"Cancer free and can still eat!"': '"ಕ್ಯಾನ್ಸರ್ ಮುಕ್ತ ಮತ್ತು ಇನ್ನೂ ತಿನ್ನಬಹುದು!"',
    '"2 graduations in 1 year!"': '"ಒಂದು ವರ್ಷದಲ್ಲಿ 2 ಪದವಿಗಳು!"',
    '"Everything under one roof..."': '"ಒಂದೇ ಛಾವಣಿಯ ಕೆಳಗೆ ಎಲ್ಲವೂ..."',
    '"Strength to fight and win..."': '"ಹೋರಾಡಿ ಗೆಲುವಿಗಾಗಿ ಶಕ್ತಿ..."',
    '"My parents could not handle it when the doctor told us the diagnosis. Doctors at Sri Shankara Cancer Hospital and Research Centre, Bangalore did not delay my treatment. I was immediately admitted and my chemotherapies were started."': '"ವೈದ್ಯರು ನಮಗೆ ರೋಗನಿರ್ಣಯ ತಿಳಿಸಿದಾಗ ನನ್ನ ತಂದೆತಾಯಿಗೆ ಸಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರಿನ ವೈದ್ಯರು ನನ್ನ ಚಿಕಿತ್ಸೆಯನ್ನು ವಿಳಂಬಿಸಲಿಲ್ಲ. ನಾನು ತಕ್ಷಣ ದಾಖಲಾಗಿ ನನ್ನ ಕೀಮೋಥೆರಪಿಗಳನ್ನು ಪ್ರಾರಂಭಿಸಿದರು."',
    '"The nurses motivated me whenever I was low and they treated me as their little sister. During the course of my treatment, I made a lot of friends and even after the completion of my treatment, they are in touch. I am forever grateful to Shankara for giving me the strength to fight and win against cancer."': '"ನಾನು ಕುಗ್ಗಿದಾಗ ನರ್ಸ್‌ಗಳು ನನ್ನನ್ನು ಪ್ರೇರೇಪಿಸಿದರು ಮತ್ತು ತಮ್ಮ ಸಣ್ಣ ಸಹೋದರಿಯಂತೆ ನನ್ನನ್ನು ನೋಡಿಕೊಂಡರು. ನನ್ನ ಚಿಕಿತ್ಸೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಬಹಳ ಸ್ನೇಹಿತರನ್ನು ಮಾಡಿಕೊಂಡೆ ಮತ್ತು ಚಿಕಿತ್ಸೆ ಪೂರ್ಣಗೊಂಡ ನಂತರವೂ ಅವರು ಸಂಪರ್ಕದಲ್ಲಿದ್ದಾರೆ. ಕ್ಯಾನ್ಸರ್ ವಿರುದ್ಧ ಹೋರಾಡಿ ಗೆಲ್ಲಲು ಶಕ್ತಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಶಂಕರಕ್ಕೆ ನಾನು ಶಾಶ್ವತವಾಗಿ ಕೃತಜ್ಞನಾಗಿದ್ದೇನೆ."',
    '"When I first came to Sri Shankara Cancer Hospital and Research Centre, Bangalore, one special thing I observed was their exceptional \'Athithi Sathkara\' which means hospitality. The patient hospitality and care I received from the doctors and staff during my operation and chemotherapy were outstanding."': '"ನಾನು ಮೊದಲ ಬಾರಿಗೆ ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರಿಗೆ ಬಂದಾಗ, ಅವರ ಅಸಾಧಾರಣ \'ಅತಿಥಿ ಸತ್ಕಾರ\' ಅಂದರೆ ಆತಿಥ್ಯವನ್ನು ನಾನು ಗಮನಿಸಿದೆ. ನನ್ನ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಕೀಮೋಥೆರಪಿ ಸಮಯದಲ್ಲಿ ವೈದ್ಯರು ಮತ್ತು ಸಿಬ್ಬಂದಿಯಿಂದ ನಾನು ಪಡೆದ ರೋಗಿ ಆತಿಥ್ಯ ಮತ್ತು ಆರೈಕೆ ಅಸಾಧಾರಣವಾಗಿತ್ತು."',
    '"Sri Shankara Cancer Hospital and Research Centre, Bangalore provides everything under one roof, I don\'t have to go anywhere else for any kind of diagnosis or tests. Everything is maintained well and done with the thought in mind that the patient needs to recover soon and go back home soon."': '"ಶ್ರೀ ಶಂಕರ ಕ್ಯಾನ್ಸರ್ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸಂಶೋಧನಾ ಕೇಂದ್ರ, ಬೆಂಗಳೂರು ಒಂದೇ ಛಾವಣಿಯ ಕೆಳಗೆ ಎಲ್ಲವನ್ನೂ ಒದಗಿಸುತ್ತದೆ, ಯಾವುದೇ ರೀತಿಯ ರೋಗನಿರ್ಣಯ ಅತ್ತು ಪರೀಕ್ಷೆಗಳಿಗೆ ನಾನು ಬೇರೆ ಎಲ್ಲಿಗೂ ಹೋಗಬೇಕಾಗಿಲ್ಲ. ಎಲ್ಲವೂ ಚೆನ್ನಾಗಿ ನಿರ್ವಹಿಸಲ್ಪಟ್ಟಿದೆ ಮತ್ತು ರೋಗಿ ಶೀಘ್ರದಲ್ಲೇ ಚೇತರಿಸಿ ಮನೆಗೆ ಹೋಗಬೇಕು ಎಂಬ ಉದ್ದೇಶದಿಂದ ಮಾಡಲಾಗಿದೆ."',
    'Cancer care services': 'ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ ಸೇವೆಗಳು',
    'About Shankara': 'ಶಂಕರ ಬಗ್ಗೆ',
    'About Journey': 'ಪ್ರಯಾಣದ ಬಗ್ಗೆ',
    'Contact us': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
    'Insurance Billing': 'ವಿಮೆ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್',
    'Patient Testimonials': 'ರೋಗಿ ಪ್ರಶಂಸಾಪತ್ರಗಳು',
    'Services Facilities': 'ಸೇವೆಗಳ ಸೌಲಭ್ಯಗಳು',
    'Cancer Specialists': 'ಕ್ಯಾನ್ಸರ್ ತಜ್ಞರು',
    'Doctors': 'ವೈದ್ಯರು',
    'Ongoing Clinical Trial': 'ನಡೆಯುತ್ತಿರುವ ಕ್ಲಿನಿಕಲ್ ಪ್ರಯೋಗ',
    'Department': 'ವಿಭಾಗ',
    'Cancer': 'ಕ್ಯಾನ್ಸರ್',
    'Oncology': 'ಆನ್ಕಾಲಜಿ',
    'Leukaemia': 'ಲ್ಯೂಕೇಮಿಯಾ',
    'Leukemia': 'ಲ್ಯೂಕೇಮಿಯಾ',
    'Lymphoma': 'ಲಿಂಫೋಮಾ',
    'Tumour': 'ಗೆಡ್ಡೆ',
    'Tumor': 'ಗೆಡ್ಡೆ',
    'Tumours': 'ಗೆಡ್ಡೆಗಳು',
    'Tumors': 'ಗೆಡ್ಡೆಗಳು',
    'Carcinoma': 'ಕಾರ್ಸಿನೋಮಾ',
    'Sarcoma': 'ಸಾರ್ಕೋಮಾ',
    'Melanoma': 'ಮೆಲನೋಮಾ',
    'Screening': 'ತಪಾಸಣೆ',
    'Support': 'ಬೆಂಬಲ',
    'Care': 'ಆರೈಕೆ',
    'Treatment': 'ಚಿಕಿತ್ಸೆ',
    'Surgery': 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    'Therapy': 'ಚಿಕಿತ್ಸೆ',
    'Childhood': 'ಬಾಲ್ಯ',
    'Paediatric': 'ಬಾಲ',
    'Pediatric': 'ಬಾಲ',
    'Head and Neck': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ',
    'Head & Neck': 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ',
    'Bone Marrow': 'ಅಂತರಾಸ್ಥಿ ಮಜ್ಜೆ',
    'Soft Tissue': 'ಮೃದು ಚರ್ಮ',
    'Blood Center': 'ರಕ್ತ ಕೇಂದ್ರ',
    'Transfusion': 'ರಕ್ತ ವರ್ಗಾವಣೆ',
    'Nutritional': 'ಪೋಷಣೆ',
    'Psychological': 'ಮಾನಸಿಕ',
    'Counseling': 'ಸಮಾಲೋಚನೆ',
    'Rehabilitation': 'ಪುನರ್ವಸತಿ',
    'Palliative': 'ಪ್ಯಾಲಿಯೇಟಿವ್',
    'Bereavement': 'ಶೋಕ',
    'Survivorship': 'ಉಳಿವು',
    'Holistic': 'ಸಮಗ್ರ',
    'Programs': 'ಕಾರ್ಯಕ್ರಮಗಳು',
    'Groups': 'ಗುಂಪುಗಳು',
    'Caregiver': 'ಸಂರಕ್ಷಕ',
    'View All': 'ಎಲ್ಲಾ ವೀಕ್ಷಿಸಿ'
};


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
