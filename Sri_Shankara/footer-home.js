// Footer Data Configuration
const footerData = {
    hospital: {
        name: "Sri Shankara Cancer Hospital",
        logo: "Images/Logo.webp",
        description: "Sri Shankara Cancer Hospital & Research Centre is committed to providing world-class cancer care with compassion and excellence."
    },
    accreditation: {
        title: "Accreditation",
        logos: [
            {
                src: "Images/nabh.png",
                alt: "NABH Accreditation",
                name: "NABH",
                pdfUrl: "Images/nabh-pdf.pdf"
            }
            // {
            //     src: "Images/nabl.png", 
            //     alt: "NABL Accreditation",
            //     name: "NABL",
            //     pdfUrl: "Images/nabl-pdf.pdf"
            // }
        ]
    },
    socialLinks: [
        { platform: "facebook", icon: "fab fa-facebook-f", url: "https://www.facebook.com/sschrcblr/" },
        { platform: "twitter", icon: "fab fa-twitter", url: "https://twitter.com/shankaracancer" },
        { platform: "linkedin", icon: "fab fa-linkedin-in", url: "https://in.linkedin.com/company/shankara-cancer-hospital-research-centre" },
        { platform: "youtube", icon: "fab fa-youtube", url: "https://www.youtube.com/@SSCHRCBengaluru" },
        { platform: "instagram", icon: "fab fa-instagram", url: "https://www.instagram.com/shankara_cancer/" },
        // { platform: "location", icon: "fas fa-map-marker-alt", url: "#" }
    ],
    quickLinks: [
        { text: "About Us", url: "About-shankara/About-Shankara.html" },
        { text: "Our Doctors", url: "Doctors/Cancer-Specialists.html" },
        { text: "Cancer-We-Treat", url: "Cancer-We-Treat/cancerpedia_index.html" },
        { text: "Screening", url: "Diagnosis-&-Screening/Cancer-Screening-Packages.html" }
    ],
    services: [
        { text: "Donate", url: "headerbutton/Donate.html" },
        { text: "Book Appointment", url: "patient-services/book-appointment.html" },
        // { text: "Detailed scope of Services", url: "patient-services/services.html" },
        { text: "Second Opinion", url: "patient-services/Second-Opinion.html" },
        { text: "Insurance & Billing", url: "patient-services/Insurance-Billing.html" },
        { text: "International Patients", url: "patient-services/International-Patients.html" }
    ],
    contactInfo: [
        { type: "address", icon: "fas fa-map-marker-alt", text: "1st Cross, Shankara Math Premises, Shankarapuram, Basavanagudi, Bengaluru, Karnataka 560 004" },
        { type: "phone", icon: "fas fa-phone", text: "080-4648 1000/ 080-2698 1000" },
        { type: "phone", icon: "fas fa-phone", text: "080-2698 1124/080-4648 4444" },
        { type: "email", icon: "fas fa-envelope", text: "info@sschrc.org" }
    ],
    termsLinks: [
        { text: "Website Privacy Policy", url: "../headerbutton/SSCHRC%20Website%20Privacy%20Policy.pdf" },
        { text: "Mobile Application — Privacy Policy", url: "../headerbutton/Mobile_Application—Privacy_Policy.pdf" }
    ],
    copyright: "© 2026 Sri Shankara Cancer Hospital & Research Centre. All rights reserved."
};

// DOM Creation Functions
function createElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

function createIcon(iconClass) {
    const icon = createElement('i', iconClass);
    return icon;
}

function createSocialLink(social) {
    const link = createElement('a', 'social-link');
    link.href = social.url;
    link.target = '_blank';  // ADD THIS LINE
    link.rel = 'noopener noreferrer';  // ADD THIS LINE
    link.appendChild(createIcon(social.icon));
    link.setAttribute('aria-label', `Follow us on ${social.platform}`);
    return link;
}

function createNavLink(item) {
    const listItem = createElement('li');
    const link = createElement('a', 'nav-link');
    link.href = item.url;
    link.target = '_blank';  // ADD THIS LINE
    link.rel = 'noopener noreferrer';  // ADD THIS LINE
    
    const arrow = createIcon('fas fa-chevron-right nav-arrow');
    const span = createElement('span', '', item.text);
    
    link.appendChild(arrow);
    link.appendChild(span);
    listItem.appendChild(link);
    
    return listItem;
}

function createContactItem(contact) {
    const contactDiv = createElement('div', 'contact-item');
    
    const iconWrapper = createElement('div', 'contact-icon-wrapper');
    const icon = createIcon(`${contact.icon} contact-icon`);
    iconWrapper.appendChild(icon);
    
    const text = createElement('span', 'contact-text', contact.text);
    
    contactDiv.appendChild(iconWrapper);
    contactDiv.appendChild(text);
    
    return contactDiv;
}

function createTermsLink(term) {
    const link = createElement('a', 'terms-link', term.text);
    link.href = term.url;
    link.target = '_blank';  // ADD THIS LINE
    link.rel = 'noopener noreferrer';  // ADD THIS LINE
    return link;
}

// Main Footer Creation Functions
function createAccreditationSection() {
    const section = createElement('div', 'footer-section accreditation-section');
    
    // Title
    const title = createElement('h3', 'accreditation-title', footerData.accreditation.title);
    
    // Logos container
    const logosContainer = createElement('div', 'accreditation-logos');
    
    footerData.accreditation.logos.forEach(logo => {
        // Create clickable link wrapper
        const logoLink = createElement('a');
        logoLink.href = logo.pdfUrl;
        logoLink.target = '_blank'; // Open in new tab
        logoLink.rel = 'noopener noreferrer'; // Security best practice
        logoLink.title = `View ${logo.name} Certificate`;
        
        const img = createElement('img', 'accreditation-logo');
        img.src = logo.src;
        img.alt = logo.alt;
        img.title = `Click to view ${logo.name} Certificate`;
        
        logoLink.appendChild(img);
        logosContainer.appendChild(logoLink);
    });
    
    section.appendChild(title);
    section.appendChild(logosContainer);
    
    return section;
}

function createHospitalInfoSection() {
    const section = createElement('div', 'footer-section');
    
    // Hospital info header
    const hospitalInfo = createElement('div', 'hospital-info');
    const logo = createElement('img', 'hospital-logo');
    logo.src = footerData.hospital.logo;
    logo.alt = `${footerData.hospital.name} Logo`;
    
    const divider = createElement('div', 'logo-divider');
    
    hospitalInfo.appendChild(logo);
    hospitalInfo.appendChild(divider);
    
    // Description
    const description = createElement('p', 'hospital-description', footerData.hospital.description);
    
    // Follow us text
    const followText = createElement('p', '', 'Follow us');
    followText.style.color = 'var(--text-gray-300)';
    followText.style.fontSize = '16px';
    followText.style.marginBottom = '8px';
    
    // Social links
    const socialLinks = createElement('div', 'social-links');
    footerData.socialLinks.forEach(social => {
        socialLinks.appendChild(createSocialLink(social));
    });
    
    section.appendChild(hospitalInfo);
    section.appendChild(description);
    section.appendChild(followText);
    section.appendChild(socialLinks);
    
    return section;
}

function createLinksSection(title, links) {
    const section = createElement('div', 'footer-section');
    
    // Section header
    const header = createElement('div', 'section-header');
    const headerDivider = createElement('div', 'header-divider');
    const sectionTitle = createElement('h3', 'section-title', title);
    
    header.appendChild(headerDivider);
    header.appendChild(sectionTitle);
    
    // Navigation list
    const navList = createElement('ul', 'nav-list');
    links.forEach(link => {
        navList.appendChild(createNavLink(link));
    });
    
    section.appendChild(header);
    section.appendChild(navList);
    
    return section;
}

function createContactSection() {
    const section = createElement('div', 'footer-section');
    
    // Section header
    const header = createElement('div', 'section-header');
    const headerDivider = createElement('div', 'header-divider');
    const sectionTitle = createElement('h3', 'section-title', 'Contact Info');
    
    header.appendChild(headerDivider);
    header.appendChild(sectionTitle);
    
    // Contact items container
    const contactContainer = createElement('div');
    contactContainer.style.display = 'flex';
    contactContainer.style.flexDirection = 'column';
    contactContainer.style.gap = '8px';
    
    footerData.contactInfo.forEach(contact => {
        contactContainer.appendChild(createContactItem(contact));
    });
    
    // Newsletter section
    const newsletterSection = createElement('div', 'newsletter-section');
    const newsletterTitle = createElement('h4', 'newsletter-title', 'Subscribe to Our Newsletter');
    
    // Newsletter form
    const newsletterForm = createElement('div', 'newsletter-form');
    const emailInput = createElement('input', 'newsletter-input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter your email';
    
    const submitButton = createElement('button', 'newsletter-button', 'Submit');
    submitButton.addEventListener('click', handleNewsletterSubmit);
    
    newsletterForm.appendChild(emailInput);
    newsletterForm.appendChild(submitButton);
    
    newsletterSection.appendChild(newsletterTitle);
    newsletterSection.appendChild(newsletterForm);
    
    section.appendChild(header);
    section.appendChild(contactContainer);
    section.appendChild(newsletterSection);
    
    return section;
}

function createBottomSection() {
    const bottomSection = createElement('div', 'footer-bottom');
    
    // Terms links
    const termsContainer = createElement('div', 'terms-links');
    footerData.termsLinks.forEach(term => {
        termsContainer.appendChild(createTermsLink(term));
    });
    
    // Copyright
    const copyrightText = createElement('p', 'copyright-text', footerData.copyright);
    
    bottomSection.appendChild(termsContainer);
    bottomSection.appendChild(copyrightText);
    
    return bottomSection;
}

// Event Handlers
function handleNewsletterSubmit(event) {
    event.preventDefault();
    const emailInput = event.target.parentNode.querySelector('.newsletter-input');
    const email = emailInput.value.trim();
    
    if (email && isValidEmail(email)) {
    // Send email to backend PHP file
    fetch('subscribe-home.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'email=' + encodeURIComponent(email)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message || 'Something went wrong. Please try again later.');
        }
        emailInput.value = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong. Please try again later.');
    });
} else {
    alert('Please enter a valid email address.');
}

}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Main Footer Assembly Function
function createFooter() {
    const footer = document.getElementById('hospital-footer');
    if (!footer) {
        console.error('Footer element with id "hospital-footer" not found');
        return;
    }
    
    // Create main container
    const container = createElement('div', 'footer-container');
    
    // Create grid container
    const grid = createElement('div', 'footer-grid');
    
    // Create all sections
    const accreditationSection = createAccreditationSection();
    const hospitalSection = createHospitalInfoSection();
    const quickLinksSection = createLinksSection('Quick Links', footerData.quickLinks);
    const servicesSection = createLinksSection('Quick Links', footerData.services);
    const contactSection = createContactSection();
    
    // Append sections to grid
    grid.appendChild(accreditationSection);
    grid.appendChild(hospitalSection);
    grid.appendChild(quickLinksSection);
    grid.appendChild(servicesSection);
    grid.appendChild(contactSection);
    
    // Create bottom section
    const bottomSection = createBottomSection();
    
    // Append to container
    container.appendChild(grid);
    container.appendChild(bottomSection);
    
    // Append to footer
    footer.appendChild(container);
}

// Initialize footer when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    createFooter();
});

// Handle image loading errors
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('error', function() {
                console.warn(`Failed to load image: ${this.src}`);
                // You could set a fallback image here if needed
                // this.src = 'path/to/fallback-image.png';
            });
        });
    }, 100);
});

// Site-wide Kannada / English language switcher
(function () {
    'use strict';
    if (window.SSCHRC_LANG_LOADER) return;
    window.SSCHRC_LANG_LOADER = true;
    try {
        var lang = localStorage.getItem('sschrc-lang') || localStorage.getItem('sschrc-index-lang');
        if (lang === 'kn') {
            document.cookie = 'googtrans=/en/kn;path=/';
        }
    } catch (e) {}
    var scripts = document.getElementsByTagName('script');
    var assetBase = '';
    for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('footer-home.js') !== -1) {
            assetBase = src.substring(0, src.lastIndexOf('/') + 1);
            break;
        }
    }
    if (!document.getElementById('sschrc-lang-css')) {
        var link = document.createElement('link');
        link.id = 'sschrc-lang-css';
        link.rel = 'stylesheet';
        link.href = assetBase + 'language-switcher.css';
        document.head.appendChild(link);
    }
    if (!document.getElementById('sschrc-lang-js')) {
        var script = document.createElement('script');
        script.id = 'sschrc-lang-js';
        script.src = assetBase + 'language-switcher.js';
        script.onload = function () {
            if (window.sschrcRefreshLanguage) {
                window.sschrcRefreshLanguage();
                window.setTimeout(window.sschrcRefreshLanguage, 400);
                window.setTimeout(window.sschrcRefreshLanguage, 1200);
            }
        };
        document.body.appendChild(script);
    }
})();