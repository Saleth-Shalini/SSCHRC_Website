/**
 * SSCHRC Chatbot Widget — navigation assistant (no forms, no free-text answers)
 */
(function () {
  'use strict';

  const QA_DATA = [
    {
      id: 'Q-01',
      category: 'Appointments',
      topic: 'Book new appointment',
      questions:
        'I want to book an appointment | how to book appointment | book appointment | schedule consultation | want to see a doctor | OPD booking | first visit | take appointment',
      answer:
        "We'd be glad to help you book an appointment. Please tap below to choose your preferred date, doctor and department, and our team will get back to you.",
      ctas: [
        { label: 'Book Appointment', url: 'patient-services/book-appointment.html' },
        { label: 'Call Now', url: 'tel:+917090521000' },
        { label: 'WhatsApp Us', url: 'https://wa.me/917090521000' }
      ]
    },
    {
      id: 'Q-02',
      category: 'Appointments',
      topic: 'Follow-up appointment',
      questions:
        'follow up appointment | review appointment | I am an existing patient | next visit | come for review',
      answer: 'Welcome back. To book your follow-up, please tap below.',
      ctas: [
        { label: 'Book Follow-up', url: 'patient-services/book-appointment.html' },
        { label: 'Call Appointments', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-03',
      category: 'Appointments',
      topic: 'Second opinion',
      questions:
        "second opinion | expert opinion | review my reports | another doctor's view | I have reports from another hospital",
      answer:
        'A second opinion can give you confidence in your treatment plan. Please tap below to book an expert second opinion.',
      ctas: [
        { label: 'Request Second Opinion', url: 'patient-services/Second-Opinion.html' },
        { label: 'Talk to Us', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-04',
      category: 'Appointments',
      topic: 'OPD timings',
      questions: 'OPD timings | OPD hours | when is OPD open | clinic hours | doctor consultation timings',
      answer: 'Our OPD is open Monday to Saturday, 9:00 AM to 5:30 PM.',
      ctas: [
        { label: 'Book Appointment', url: 'patient-services/book-appointment.html' },
        { label: 'Find a Doctor', url: 'Doctors/Cancer-Specialists.html' },
        { label: 'Call Reception', url: 'tel:08046481000' }
      ]
    },
    {
      id: 'Q-05',
      category: 'Appointments',
      topic: 'First visit checklist',
      questions: 'what to bring | documents needed | what should I carry | first visit checklist',
      answer:
        'For your first visit please bring: previous prescriptions and reports, list of current medications, government ID, and someone to accompany you. If you have biopsy slides or scan films from another hospital, bring the originals.',
      ctas: [
        { label: 'Book Appointment', url: 'patient-services/book-appointment.html' },
        { label: 'Talk to Us', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-06',
      category: 'Find a Doctor',
      topic: 'Find a doctor',
      questions: 'find a doctor | doctor list | who are your doctors | I want a specialist | list of oncologists',
      answer: 'How would you like to find a doctor — by specialty or by name? Tap below.',
      ctas: [
        { label: 'Browse Doctors', url: 'Doctors/Cancer-Specialists.html' },
        { label: 'Book Appointment', url: 'patient-services/book-appointment.html' },
        { label: 'Talk to Us', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-07',
      category: 'Find a Doctor',
      topic: 'Search doctor by name',
      questions: 'Dr Sharma | I want Dr X | search doctor by name | looking for a particular doctor',
      answer: 'You can search for any of our doctors by name on the doctors page. Tap below to search.',
      ctas: [
        { label: 'Search Doctors', url: 'Doctors/Cancer-Specialists.html' },
        { label: 'Browse All', url: 'Doctors/Cancer-Specialists.html' },
        { label: 'Talk to Us', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-08',
      category: 'Treatments',
      topic: 'Cancer screening',
      questions: 'cancer screening | preventive checkup | early detection | screening package | health checkup',
      answer:
        'We offer comprehensive screening packages for breast, cervical, oral, colorectal, lung and prostate cancers. Each package includes relevant tests. Click below to know more.',
      ctas: [
        { label: 'Screening Packages', url: 'Diagnosis-&-Screening/Cancer-Screening-Packages.html' },
        { label: 'Book Screening', url: 'Diagnosis-&-Screening/Cancer-Screening-Packages.html' },
        { label: 'Talk to Us', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-09',
      category: 'Insurance & Billing',
      topic: 'Insurance accepted',
      questions:
        'insurance accepted | which insurance | TPA list | empanelled insurance | cashless companies | do you accept my insurance',
      answer:
        'We are empanelled with most major insurers and TPAs — Star Health, HDFC Ergo, Bajaj Allianz, ICICI Lombard, New India, Care, Niva Bupa, MediAssist, FHPL and others. Click below to know more.',
      ctas: [
        { label: 'Full Insurance List', url: 'patient-services/Insurance-Billing.html' },
        { label: 'TPA Helpdesk', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-10',
      category: 'Donate',
      topic: 'How to donate',
      questions: 'I want to donate | how to donate | make a donation | help patients | give donation',
      answer: 'Thank you for thinking of supporting our patients. All donations are 80G tax-exempt. Click below to know more.',
      ctas: [
        { label: 'Donate Now', url: 'headerbutton/Donate.html#:~:text=Account%20Details' }
      ]
    },
    {
      id: 'Q-11',
      category: 'Careers',
      topic: 'Job openings',
      questions: 'job openings | vacancies | careers | open positions | I want to apply | hiring',
      answer:
        'Open positions are listed on our careers page and refreshed regularly. You can filter by department, role and experience.',
      ctas: [
        { label: 'View Open Jobs', url: 'headerbutton/Careers.html' },
        { label: 'Talk to HR', url: 'tel:+917090521000' }
      ]
    },
    {
      id: 'Q-12',
      category: 'Contact',
      topic: 'Address / Location',
      questions: 'address | location | where is the hospital | how to reach | hospital address',
      answer:
        'Sri Shankara Cancer Hospital & Research Centre, 1st Cross, Shankarapuram, Basavanagudi, Bengaluru — 560004, Karnataka.',
      ctas: [
        { label: 'Open in Maps', url: 'https://maps.app.goo.gl/tD8V2iku9f7GViZf6' },
        { label: 'Call Reception', url: 'tel:08046481000' }
      ]
    },
    {
      id: 'Q-13',
      category: 'Contact',
      topic: 'Phone numbers',
      questions: 'phone number | contact number | call hospital | contact details',
      answer: 'Reception: +91 70905 21000 | Appointments: +91 70905 21000 | Emergency 24×7: 080-4648 4424',
      ctas: [
        { label: 'Call Reception', url: 'tel:+917090521000' },
        { label: 'Call Appointments', url: 'tel:+917090521000' },
        { label: 'WhatsApp', url: 'https://wa.me/917090521000' }
      ]
    },
    {
      id: 'Q-14',
      category: 'Contact',
      topic: 'Emergency',
      questions:
        'emergency | urgent | bleeding | severe pain | breathless | unconscious | critical | need ambulance',
      answer:
        '⚠️ If this is a medical emergency, please call our 24×7 emergency number immediately: 080-4648 4424. Our casualty department is open round the clock.',
      ctas: [
        { label: 'Call Emergency', url: 'tel:08046484424' },
        { label: 'Request Ambulance', url: 'headerbutton/contact-us.html' },
        { label: 'Directions', url: 'https://maps.app.goo.gl/tD8V2iku9f7GViZf6' }
      ]
    },
    {
      id: 'Q-15',
      category: 'Contact',
      topic: 'Ambulance',
      questions: 'ambulance | book ambulance | emergency transport',
      answer:
        'Our ambulance service is available 24×7 within Bangalore. Please call now and our team will arrange the dispatch.',
      ctas: [
        { label: 'Call Ambulance', url: 'tel:08046484424' },
        { label: 'Request Ambulance', url: 'headerbutton/contact-us.html' },
        { label: 'Emergency Number', url: 'tel:08046484424' }
      ]
    }
  ];

  const WIDGET_HTML = `
<div id="sschrc-chat-widget-root">
  <div id="sschrc-chat-backdrop" aria-hidden="true" hidden></div>
  <div id="sschrc-chat-launcher" aria-label="Open chat assistant" role="button" tabindex="0" aria-expanded="false">
    <span class="sschrc-launcher-icon sschrc-launcher-icon--chat" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" focusable="false">
        <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l6-4h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2m-6 9H6V9h8m4 0H6v2h12v-2m0 4H6v2h8v-2z"/>
      </svg>
    </span>
    <span class="sschrc-launcher-icon sschrc-launcher-icon--close" aria-hidden="true">✕</span>
    <span id="sschrc-chat-notif-dot" aria-hidden="true"></span>
  </div>
  <div id="sschrc-chat-window" role="dialog" aria-modal="true" aria-label="SSCHRC Virtual Assistant" aria-hidden="true">
    <div id="sschrc-chat-header">
      <div id="sschrc-chat-header-info">
        <span id="sschrc-chat-title">Sri Shankara Cancer Hospital</span>
        <span id="sschrc-chat-subtitle">How can I help you today?</span>
      </div>
      <div id="sschrc-chat-header-actions">
        <button type="button" id="sschrc-chat-minimise" aria-label="Minimise chat">–</button>
        <button type="button" id="sschrc-chat-close" aria-label="Close chat">✕</button>
      </div>
    </div>
    <div id="sschrc-chat-messages" role="log" aria-live="polite"></div>
    <div id="sschrc-chat-footer">
      <div id="sschrc-chat-input-wrap">
        <ul id="sschrc-chat-suggestions" role="listbox" aria-label="Suggested questions" hidden></ul>
        <input type="text" id="sschrc-chat-input" placeholder="Type a keyword…" autocomplete="off" aria-label="Search questions" aria-autocomplete="list" aria-controls="sschrc-chat-suggestions" />
        <button type="button" id="sschrc-chat-send" aria-label="Select suggestion" disabled>
          <svg viewBox="0 0 24 24" width="20" height="20" focusable="false" aria-hidden="true">
            <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2L2 14v7z"/>
          </svg>
        </button>
      </div>
      <p id="sschrc-chat-disclaimer">Tap a suggestion to get an answer. For emergencies call <a href="tel:08046484424">080-4648 4424</a>.</p>
    </div>
  </div>
</div>`;

  const LEGACY_SELECTORS = ['#chat-fab3', '#chatbox-container3', '#chatbox-form3'];

  let launcher;
  let chatWindow;
  let messagesEl;
  let inputEl;
  let suggestionsEl;
  let sendBtn;
  let minimiseBtn;
  let closeBtn;
  let backdropEl;

  let activeCategory = null;
  let highlightIndex = -1;
  let currentMatches = [];
  let blurTimer = null;
  let welcomeRendered = false;

  function removeLegacyWidget() {
    LEGACY_SELECTORS.forEach(function (sel) {
      const node = document.querySelector(sel);
      if (node) node.remove();
    });
  }

  function ensureWidgetMounted() {
    if (!document.getElementById('sschrc-chat-launcher')) {
      const mount = document.createElement('div');
      mount.innerHTML = WIDGET_HTML.trim();
      document.body.appendChild(mount.firstElementChild);
    }
  }

  function cacheElements() {
    launcher = document.getElementById('sschrc-chat-launcher');
    chatWindow = document.getElementById('sschrc-chat-window');
    messagesEl = document.getElementById('sschrc-chat-messages');
    inputEl = document.getElementById('sschrc-chat-input');
    suggestionsEl = document.getElementById('sschrc-chat-suggestions');
    sendBtn = document.getElementById('sschrc-chat-send');
    minimiseBtn = document.getElementById('sschrc-chat-minimise');
    closeBtn = document.getElementById('sschrc-chat-close');
    backdropEl = document.getElementById('sschrc-chat-backdrop');
  }

  function getUniqueCategories() {
    const seen = new Set();
    const list = [];
    QA_DATA.forEach(function (qa) {
      if (!seen.has(qa.category)) {
        seen.add(qa.category);
        list.push(qa.category);
      }
    });
    return list;
  }

  function getMatchingQuestions(inputText, categoryFilter) {
    const needle = inputText.trim().toLowerCase();
    if (!needle) return [];

    return QA_DATA.filter(function (qa) {
      return !categoryFilter || qa.category === categoryFilter;
    })
      .filter(function (qa) {
        return (
          qa.questions.split('|').some(function (q) {
            return q.trim().toLowerCase().includes(needle);
          }) || qa.topic.toLowerCase().includes(needle)
        );
      })
      .slice(0, 6);
  }

  function getQuestionsByCategory(category) {
    return QA_DATA.filter(function (qa) {
      return qa.category === category;
    });
  }

  function formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  /** Prefix from current page to site root (where chatbox.js lives). */
  function getSiteRootPrefix() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const srcAttr = scripts[i].getAttribute('src');
      if (!srcAttr || srcAttr.indexOf('chatbox.js') === -1) continue;

      if (!/^https?:/i.test(srcAttr)) {
        const rel = srcAttr.replace(/[#?].*/, '');
        const slash = rel.lastIndexOf('/');
        return slash >= 0 ? rel.slice(0, slash + 1) : '';
      }

      try {
        const scriptUrl = new URL(scripts[i].src, window.location.href);
        const pageUrl = new URL(window.location.href);
        const scriptDir = scriptUrl.pathname.replace(/\/[^/]*$/, '/');
        const pagePath = pageUrl.pathname.replace(/\/[^/]*$/, '/');
        const scriptParts = scriptDir.split('/').filter(Boolean);
        const pageParts = pagePath.split('/').filter(Boolean);
        let iPart = 0;
        while (
          iPart < scriptParts.length &&
          iPart < pageParts.length &&
          scriptParts[iPart] === pageParts[iPart]
        ) {
          iPart++;
        }
        const ups = pageParts.length - iPart;
        const downs = scriptParts.slice(iPart);
        return (ups > 0 ? '../'.repeat(ups) : '') + downs.join('/');
      } catch (e) {
        break;
      }
    }

    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && /\.(html?|php)$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    return parts.length ? '../'.repeat(parts.length) : '';
  }

  function isExternalUrl(url) {
    if (!url) return false;
    const lower = url.trim().toLowerCase();
    return (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('tel:') ||
      lower.startsWith('mailto:')
    );
  }

  /** Turn site-root-relative paths into correct href for the current page depth. */
  function resolveUrl(url) {
    if (!url) return '#';
    const trimmed = url.trim();
    if (isExternalUrl(trimmed)) return trimmed;

    const hashIdx = trimmed.indexOf('#');
    const pathPart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
    const hashPart = hashIdx >= 0 ? trimmed.slice(hashIdx) : '';
    const queryIdx = pathPart.indexOf('?');
    const filePart = queryIdx >= 0 ? pathPart.slice(0, queryIdx) : pathPart;
    const queryPart = queryIdx >= 0 ? pathPart.slice(queryIdx) : '';
    const normalized = filePart.replace(/^\/+/, '');

    const relative = getSiteRootPrefix() + normalized + queryPart + hashPart;
    try {
      return new URL(relative, window.location.href).href;
    } catch (err) {
      return relative;
    }
  }

  function renderCTAs(ctas) {
    const group = document.createElement('div');
    group.className = 'sschrc-cta-group';

    const variants = ['sschrc-cta--primary', 'sschrc-cta--secondary', 'sschrc-cta--ghost'];

    (ctas || []).slice(0, 3).forEach(function (cta, index) {
      const href = resolveUrl(cta.url);
      const link = document.createElement('a');
      link.className = 'sschrc-cta ' + variants[index];
      link.href = href;
      link.textContent = cta.label;

      if (isExternalUrl(href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.target = '_self';
      }

      link.setAttribute('aria-label', cta.label);
      link.addEventListener('mousedown', function (e) {
        e.stopPropagation();
      });
      link.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!isExternalUrl(href)) {
          e.preventDefault();
          window.location.assign(href);
        }
      });
      group.appendChild(link);
    });

    return group;
  }

  function scrollMessagesToBottom() {
    if (!messagesEl) return;
    requestAnimationFrame(function () {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function appendUserBubble(text) {
    const row = document.createElement('div');
    row.className = 'sschrc-msg-row sschrc-msg-row--user';

    const bubble = document.createElement('div');
    bubble.className = 'sschrc-bubble sschrc-bubble--user';
    bubble.textContent = text;

    const time = document.createElement('span');
    time.className = 'sschrc-bubble-time';
    time.textContent = formatTime(new Date());
    bubble.appendChild(time);

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToBottom();
  }

  function appendBotBubble(text, ctas) {
    const row = document.createElement('div');
    row.className = 'sschrc-msg-row sschrc-msg-row--bot';

    const bubble = document.createElement('div');
    bubble.className = 'sschrc-bubble sschrc-bubble--bot';

    const body = document.createElement('p');
    body.className = 'sschrc-welcome-text';
    body.style.margin = '0';
    body.textContent = text;
    bubble.appendChild(body);

    if (ctas && ctas.length) {
      bubble.appendChild(renderCTAs(ctas));
    }

    const time = document.createElement('span');
    time.className = 'sschrc-bubble-time';
    time.textContent = formatTime(new Date());
    bubble.appendChild(time);

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToBottom();
  }

  function renderWelcome() {
    if (welcomeRendered || !messagesEl) return;
    welcomeRendered = true;

    const row = document.createElement('div');
    row.className = 'sschrc-msg-row sschrc-msg-row--bot';

    const bubble = document.createElement('div');
    bubble.className = 'sschrc-bubble sschrc-bubble--bot';

    const text = document.createElement('p');
    text.className = 'sschrc-welcome-text';
    text.textContent =
      "Hello! I'm the SSCHRC virtual assistant. Type a keyword or tap a topic below to get started.";
    bubble.appendChild(text);

    const chipRow = document.createElement('div');
    chipRow.className = 'sschrc-chip-row';
    chipRow.setAttribute('role', 'group');
    chipRow.setAttribute('aria-label', 'Question categories');

    getUniqueCategories().forEach(function (category) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sschrc-chip';
      chip.textContent = category;
      chip.dataset.category = category;
      chip.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        onCategoryChipClick(category);
      });
      chipRow.appendChild(chip);
    });

    bubble.appendChild(chipRow);

    const time = document.createElement('span');
    time.className = 'sschrc-bubble-time';
    time.textContent = formatTime(new Date());
    bubble.appendChild(time);

    row.appendChild(bubble);
    messagesEl.appendChild(row);
  }

  function updateChipActiveState() {
    document.querySelectorAll('.sschrc-chip').forEach(function (chip) {
      const cat = chip.dataset.category;
      chip.classList.toggle('sschrc-chip--active', cat === activeCategory);
    });
  }

  function onCategoryChipClick(category) {
    clearTimeout(blurTimer);

    if (activeCategory === category) {
      activeCategory = null;
      updateChipActiveState();
      hideSuggestions();
      const options = document.getElementById('sschrc-category-options');
      if (options) options.closest('.sschrc-msg-row').remove();
      return;
    }

    activeCategory = category;
    updateChipActiveState();
    showCategoryTopics(category);
  }

  function showCategoryTopics(category) {
    // CTA taps show options inside the chat, not in the floating dropdown.
    hideSuggestions();

    const topics = getQuestionsByCategory(category);

    const old = document.getElementById('sschrc-category-options');
    if (old) old.closest('.sschrc-msg-row').remove();

    const row = document.createElement('div');
    row.className = 'sschrc-msg-row sschrc-msg-row--bot';

    const bubble = document.createElement('div');
    bubble.className = 'sschrc-bubble sschrc-bubble--bot';

    const intro = document.createElement('p');
    intro.className = 'sschrc-welcome-text';
    intro.style.margin = '0';
    intro.textContent = category + ' — choose a question below:';
    bubble.appendChild(intro);

    const list = document.createElement('div');
    list.id = 'sschrc-category-options';
    list.className = 'sschrc-option-list';

    topics.forEach(function (qa) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sschrc-option';
      btn.textContent = qa.topic;
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleQuestionSelect(qa);
      });
      list.appendChild(btn);
    });

    bubble.appendChild(list);

    const time = document.createElement('span');
    time.className = 'sschrc-bubble-time';
    time.textContent = formatTime(new Date());
    bubble.appendChild(time);

    row.appendChild(bubble);
    messagesEl.appendChild(row);

    requestAnimationFrame(function () {
      scrollMessagesToBottom();
      if (!isMobileView() && inputEl) {
        inputEl.focus();
      }
    });
  }

  function renderSuggestionsList(matches) {
    suggestionsEl.innerHTML = '';
    highlightIndex = -1;

    if (!matches.length) {
      const empty = document.createElement('li');
      empty.className = 'sschrc-suggestion--empty';
      empty.textContent = 'No questions in this category.';
      empty.setAttribute('role', 'presentation');
      suggestionsEl.appendChild(empty);
      return;
    }

    matches.forEach(function (qa, index) {
      const li = document.createElement('li');
      li.id = 'sschrc-suggestion-' + qa.id;
      li.setAttribute('role', 'option');
      li.dataset.qaId = qa.id;
      li.textContent = qa.topic;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleQuestionSelect(qa);
      });
      li.addEventListener('mouseenter', function () {
        setHighlight(index);
      });
      suggestionsEl.appendChild(li);
    });
  }

  function clearInput() {
    if (!inputEl) return;
    inputEl.value = '';
  }

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = '';
    highlightIndex = -1;
    currentMatches = [];
    updateSendState();
  }

  function updateSendState() {
    if (!sendBtn) return;
    const enabled = highlightIndex >= 0 && currentMatches.length > 0;
    sendBtn.disabled = !enabled;
  }

  function setHighlight(index) {
    highlightIndex = index;
    const items = suggestionsEl.querySelectorAll('li[data-qa-id]');
    items.forEach(function (li, i) {
      li.classList.toggle('sschrc-suggestion--highlight', i === highlightIndex);
      if (i === highlightIndex) {
        li.setAttribute('aria-selected', 'true');
        inputEl.setAttribute('aria-activedescendant', li.id);
      } else {
        li.removeAttribute('aria-selected');
      }
    });
    if (highlightIndex < 0) {
      inputEl.removeAttribute('aria-activedescendant');
    }
    updateSendState();
  }

  function refreshSuggestions() {
    const query = inputEl.value.trim();

    if (query.length < 1) {
      if (activeCategory) {
        showCategoryTopics(activeCategory);
      } else {
        hideSuggestions();
      }
      return;
    }

    currentMatches = getMatchingQuestions(query, activeCategory);

    if (!currentMatches.length) {
      suggestionsEl.innerHTML = '';
      highlightIndex = -1;
      const empty = document.createElement('li');
      empty.className = 'sschrc-suggestion--empty';
      empty.textContent = 'No results — try another keyword.';
      empty.setAttribute('role', 'presentation');
      suggestionsEl.appendChild(empty);
      suggestionsEl.hidden = false;
      updateSendState();
      return;
    }

    renderSuggestionsList(currentMatches);
    suggestionsEl.hidden = false;
    updateSendState();
  }

  function handleQuestionSelect(qaItem) {
    if (!qaItem) return;
    clearTimeout(blurTimer);
    if (!chatWindow.classList.contains('sschrc--open')) {
      openChat();
    }
    const options = document.getElementById('sschrc-category-options');
    if (options) options.closest('.sschrc-msg-row').remove();
    activeCategory = null;
    updateChipActiveState();
    appendUserBubble(qaItem.topic);
    appendBotBubble(qaItem.answer, qaItem.ctas);
    clearInput();
    hideSuggestions();
    scrollMessagesToBottom();
    requestAnimationFrame(function () {
      inputEl.focus();
    });
  }

  function selectHighlightedOrFirst() {
    if (!currentMatches.length) return;
    const index = highlightIndex >= 0 ? highlightIndex : 0;
    handleQuestionSelect(currentMatches[index]);
  }

  function isMobileView() {
    return window.matchMedia('(max-width: 480px)').matches;
  }

  function setMobileUiState(isOpen) {
    const root = document.getElementById('sschrc-chat-widget-root');
    if (isMobileView()) {
      if (root) root.classList.toggle('sschrc--mobile-open', isOpen);
      if (backdropEl) {
        backdropEl.hidden = !isOpen;
        backdropEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
      document.body.classList.toggle('sschrc-chat-scroll-lock', isOpen);
    } else {
      if (root) root.classList.remove('sschrc--mobile-open');
      if (backdropEl) {
        backdropEl.hidden = true;
        backdropEl.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('sschrc-chat-scroll-lock');
    }
  }

  function openChat() {
    chatWindow.classList.add('sschrc--open');
    chatWindow.setAttribute('aria-hidden', 'false');
    launcher.classList.add('sschrc--open');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Close chat assistant');
    setMobileUiState(true);

    if (!sessionStorage.getItem('sschrc_chatOpened')) {
      sessionStorage.setItem('sschrc_chatOpened', 'true');
    }
    launcher.classList.remove('sschrc--has-notif');

    renderWelcome();
    scrollMessagesToBottom();

    setTimeout(function () {
      if (!isMobileView()) {
        inputEl.focus();
      }
    }, 280);
  }

  function closeChat() {
    chatWindow.classList.remove('sschrc--open', 'sschrc--minimised');
    chatWindow.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('sschrc--open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Open chat assistant');
    setMobileUiState(false);
    hideSuggestions();
  }

  function toggleChat() {
    if (chatWindow.classList.contains('sschrc--open')) {
      closeChat();
    } else {
      openChat();
    }
  }

  function toggleMinimise() {
    chatWindow.classList.toggle('sschrc--minimised');
    const minimised = chatWindow.classList.contains('sschrc--minimised');
    minimiseBtn.setAttribute('aria-label', minimised ? 'Restore chat' : 'Minimise chat');
  }

  function initNotificationDot() {
    if (!sessionStorage.getItem('sschrc_chatOpened')) {
      launcher.classList.add('sschrc--has-notif');
    }
  }

  function onDocumentClick(e) {
    if (!chatWindow.classList.contains('sschrc--open')) return;
    if (chatWindow.contains(e.target)) return;
    if (launcher.contains(e.target)) return;
    closeChat();
  }

  function bindEvents() {
    launcher.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleChat();
    });
    launcher.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleChat();
      }
    });

    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeChat();
    });

    minimiseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMinimise();
    });

    inputEl.addEventListener('input', refreshSuggestions);

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (suggestionsEl.hidden || !currentMatches.length) return;
        const next = highlightIndex < currentMatches.length - 1 ? highlightIndex + 1 : 0;
        setHighlight(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (suggestionsEl.hidden || !currentMatches.length) return;
        const prev = highlightIndex > 0 ? highlightIndex - 1 : currentMatches.length - 1;
        setHighlight(prev);
      } else if (e.key === 'Enter') {
        if (!suggestionsEl.hidden && currentMatches.length) {
          e.preventDefault();
          selectHighlightedOrFirst();
        }
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    });

    inputEl.addEventListener('blur', function () {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(function () {
        if (suggestionsEl.matches(':hover')) return;
        if (document.querySelector('.sschrc-chip-row:hover, .sschrc-chip:focus')) return;
        if (!inputEl.value.trim() && activeCategory) return;
        hideSuggestions();
      }, 200);
    });

    suggestionsEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    inputEl.addEventListener('focus', function () {
      clearTimeout(blurTimer);
      if (inputEl.value.trim().length >= 1) {
        refreshSuggestions();
      }
    });

    sendBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    sendBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!sendBtn.disabled) {
        selectHighlightedOrFirst();
      }
    });

    chatWindow.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chatWindow.classList.contains('sschrc--open')) {
        closeChat();
      }
    });

    document.addEventListener('click', onDocumentClick);

    if (backdropEl) {
      backdropEl.addEventListener('click', function () {
        closeChat();
      });
    }

    window.addEventListener('resize', function () {
      if (!chatWindow.classList.contains('sschrc--open')) {
        setMobileUiState(false);
      } else {
        setMobileUiState(true);
      }
    });
  }

  function init() {
    removeLegacyWidget();
    ensureWidgetMounted();
    cacheElements();

    if (!launcher || !chatWindow || !messagesEl || !inputEl) {
      return;
    }

    initNotificationDot();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
