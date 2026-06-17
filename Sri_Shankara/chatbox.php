<?php /* SSCHRC Chatbot Widget — included in every page footer */ ?>

<div id="sschrc-chat-widget-root">
  <div id="sschrc-chat-backdrop" aria-hidden="true" hidden></div>
  <!-- Chatbot Launcher -->
  <div id="sschrc-chat-launcher" aria-label="Open chat assistant" role="button" tabindex="0" aria-expanded="false">
    <span class="sschrc-launcher-icon sschrc-launcher-icon--chat" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" focusable="false">
        <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l6-4h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2m-6 9H6V9h8m4 0H6v2h12v-2m0 4H6v2h8v-2z"/>
      </svg>
    </span>
    <span class="sschrc-launcher-icon sschrc-launcher-icon--close" aria-hidden="true">✕</span>
    <span id="sschrc-chat-notif-dot" aria-hidden="true"></span>
  </div>

  <!-- Chatbot Window -->
  <div id="sschrc-chat-window" role="dialog" aria-modal="true" aria-label="SSCHRC Virtual Assistant" aria-hidden="true">

    <!-- Header -->
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

    <!-- Message area -->
    <div id="sschrc-chat-messages" role="log" aria-live="polite"></div>

    <!-- Input area -->
    <div id="sschrc-chat-footer">
      <div id="sschrc-chat-input-wrap">
        <ul id="sschrc-chat-suggestions" role="listbox" aria-label="Suggested questions" hidden></ul>
        <input
          type="text"
          id="sschrc-chat-input"
          placeholder="Type a keyword…"
          autocomplete="off"
          aria-label="Search questions"
          aria-autocomplete="list"
          aria-controls="sschrc-chat-suggestions"
        />
        <button type="button" id="sschrc-chat-send" aria-label="Select suggestion" disabled>
          <svg viewBox="0 0 24 24" width="20" height="20" focusable="false" aria-hidden="true">
            <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2L2 14v7z"/>
          </svg>
        </button>
      </div>
      <p id="sschrc-chat-disclaimer">Tap a suggestion to get an answer. For emergencies call <a href="tel:08046484424">080-4648 4424</a>.</p>
    </div>

  </div>
</div>
