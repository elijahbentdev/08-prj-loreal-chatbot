# PRD: L'Oréal Smart Beauty Advisor Chatbot
**Version:** 1.0 | **Class:** Glo Career Accelerator – Project 8  
**Deployment Target:** Cloudflare Workers (via web UI) + GitHub Pages  
**Rubric Coverage:** All core criteria + all 3 LevelUps (105/105 pts)

---

## 1. Project Overview

Build a fully branded, AI-powered L'Oréal product advisor chatbot. The frontend is a static HTML/CSS/JS site hosted on GitHub Pages. All OpenAI API calls are proxied through a **Cloudflare Worker** (deployed via the Cloudflare web dashboard — no CLI, no secrets.js). The API key lives exclusively in Cloudflare's encrypted secrets store and is never exposed to the browser.

---

## 2. Repository Structure

```
loreal-chatbot/
├── index.html          ← Main chatbot UI
├── style.css           ← All styles (L'Oréal branding + chat bubbles)
├── script.js           ← Frontend chat logic (all LevelUps included)
├── worker.js           ← Cloudflare Worker source (copy-paste into CF dashboard)
├── assets/
│   └── loreal-logo.png ← L'Oréal logo (download from brand assets or SVG inline)
└── README.md           ← Setup and deployment instructions
```

> **IMPORTANT for the agent:** `worker.js` is the Cloudflare Worker code. It does NOT get deployed via GitHub — it is manually copy-pasted into the Cloudflare web dashboard. Everything else in the repo is deployed as a static GitHub Pages site.

---

## 3. L'Oréal Brand Specification

### Colors (CSS Variables — use these exact values)
```css
--loreal-gold:      #C9A84C;   /* Primary accent — logo gold */
--loreal-dark-gold: #A07830;   /* Hover/active states */
--loreal-black:     #1A1A1A;   /* Header, footer, text */
--loreal-white:     #FFFFFF;   /* Page background */
--loreal-light-gray:#F5F5F5;   /* Chat container background */
--loreal-mid-gray:  #E0E0E0;   /* Borders, dividers */
--loreal-text-dark: #2C2C2C;   /* Body text */
--loreal-text-light:#6B6B6B;   /* Secondary text, timestamps */
```

### Typography
- **Display/Header font:** `"Cormorant Garamond"` (Google Fonts) — elegant, luxury feel matching L'Oréal's editorial style
- **Body/UI font:** `"Jost"` (Google Fonts) — clean, modern, geometric
- **Monospace fallback:** `"Courier New"` (only for code, not needed here)

```html
<!-- Paste in <head> of index.html -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Logo
- Place `loreal-logo.png` (or inline SVG of the wordmark) in the header
- Display at height: 36px in header, maintain aspect ratio
- If no logo file is available, render the L'Oréal wordmark as styled text:
  ```html
  <span class="logo-text">L'ORÉAL</span>
  ```
  Styled: `font-family: 'Cormorant Garamond'; font-weight: 700; font-size: 28px; letter-spacing: 6px; color: var(--loreal-gold);`

---

## 4. File Specifications

---

### 4.1 `worker.js` — Cloudflare Worker

This file is **copy-pasted into the Cloudflare dashboard**, not deployed via GitHub. It acts as a secure proxy between the browser and OpenAI.

```javascript
// worker.js — L'Oréal Chatbot Cloudflare Worker
// Deploy this in the Cloudflare Workers dashboard.
// Store your OpenAI key as a Secret named: OPENAI_API_KEY

const ALLOWED_ORIGIN = '*'; // Tighten to your GitHub Pages URL after testing
// e.g. const ALLOWED_ORIGIN = 'https://yourusername.github.io';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Forward to OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: body.messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: openAIResponse.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await openAIResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
```

**Cloudflare Dashboard Setup Steps (tell the agent to include in README):**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Worker
2. Name it: `loreal-chatbot-worker`
3. Click Edit Code, delete the default code, paste the contents of `worker.js`
4. Click **Save and Deploy**
5. Go to **Settings → Variables and Secrets**
6. Under **Secrets**, click Add → Name: `OPENAI_API_KEY`, Value: your OpenAI key → **Save**
7. Copy the Worker URL (format: `https://loreal-chatbot-worker.YOUR-SUBDOMAIN.workers.dev`)
8. Paste that URL into `script.js` as `WORKER_URL`

---

### 4.2 `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>L'ORÉAL | Smart Beauty Advisor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- HEADER -->
  <header class="site-header">
    <div class="header-inner">
      <div class="logo-area">
        <!-- If you have loreal-logo.png, use: -->
        <!-- <img src="assets/loreal-logo.png" alt="L'Oréal" class="logo-img" /> -->
        <!-- Otherwise, use this styled text logo: -->
        <span class="logo-text">L'ORÉAL</span>
        <span class="logo-tagline">PARIS</span>
      </div>
      <div class="advisor-label">Smart Beauty Advisor</div>
    </div>
  </header>

  <!-- MAIN CHAT AREA -->
  <main class="chat-wrapper">

    <!-- User question display (LevelUp: Display User Question) -->
    <div class="user-question-display" id="userQuestionDisplay" aria-live="polite">
      <!-- Populated dynamically -->
    </div>

    <!-- Chat conversation container (LevelUp: Chat Conversation UI) -->
    <div class="chat-container" id="chatContainer" role="log" aria-label="Chat conversation" aria-live="polite">
      <!-- Welcome message injected by JS on load -->
    </div>

    <!-- Typing indicator -->
    <div class="typing-indicator" id="typingIndicator" hidden>
      <span></span><span></span><span></span>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <textarea
        id="userInput"
        class="chat-input"
        placeholder="Ask me about skincare, haircare, makeup, or routines…"
        rows="1"
        aria-label="Your message"
      ></textarea>
      <button id="sendBtn" class="send-btn" aria-label="Send message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>

  </main>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="footer-inner">
      <span>&copy; 2024 L'Oréal. All rights reserved.</span>
      <nav class="footer-nav">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Contact Us</a>
      </nav>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

---

### 4.3 `style.css`

```css
/* =============================================
   L'ORÉAL SMART BEAUTY ADVISOR — STYLESHEET
   Brand: L'Oréal Paris
   Fonts: Cormorant Garamond + Jost
   ============================================= */

/* --- CSS Variables / Brand Tokens --- */
:root {
  --loreal-gold:        #C9A84C;
  --loreal-dark-gold:   #A07830;
  --loreal-black:       #1A1A1A;
  --loreal-white:       #FFFFFF;
  --loreal-light-gray:  #F5F5F5;
  --loreal-mid-gray:    #E0E0E0;
  --loreal-text-dark:   #2C2C2C;
  --loreal-text-light:  #6B6B6B;
  --loreal-user-bubble: #1A1A1A;
  --loreal-ai-bubble:   #FFFFFF;
  --shadow-soft:        0 2px 12px rgba(0,0,0,0.08);
  --shadow-card:        0 4px 24px rgba(0,0,0,0.12);
  --radius-bubble:      18px;
  --radius-input:       12px;
  --transition:         0.2s ease;
}

/* --- Reset & Base --- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: 'Jost', sans-serif;
  font-weight: 400;
  background: var(--loreal-light-gray);
  color: var(--loreal-text-dark);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* --- Header --- */
.site-header {
  background: var(--loreal-black);
  border-bottom: 2px solid var(--loreal-gold);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-area {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 26px;
  letter-spacing: 6px;
  color: var(--loreal-gold);
  line-height: 1;
}

.logo-tagline {
  font-family: 'Jost', sans-serif;
  font-weight: 300;
  font-size: 10px;
  letter-spacing: 4px;
  color: var(--loreal-gold);
  opacity: 0.8;
  text-transform: uppercase;
}

.advisor-label {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--loreal-white);
  opacity: 0.75;
}

/* --- Main Chat Wrapper --- */
.chat-wrapper {
  flex: 1;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* --- User Question Display (LevelUp) --- */
.user-question-display {
  min-height: 36px;
  padding: 8px 16px;
  border-left: 3px solid var(--loreal-gold);
  background: rgba(201, 168, 76, 0.06);
  border-radius: 0 8px 8px 0;
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--loreal-text-light);
  transition: opacity var(--transition);
  display: none;  /* Hidden when empty */
}

.user-question-display.visible {
  display: block;
}

.user-question-display .uq-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--loreal-gold);
  margin-bottom: 2px;
}

.user-question-display .uq-text {
  color: var(--loreal-text-dark);
  font-size: 14px;
}

/* --- Chat Container (LevelUp: Bubble UI) --- */
.chat-container {
  flex: 1;
  background: var(--loreal-white);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--loreal-mid-gray);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  min-height: 360px;
  max-height: calc(100vh - 340px);
  scroll-behavior: smooth;
}

/* --- Message Bubbles --- */
.message {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  animation: fadeSlideIn 0.3s ease forwards;
}

.message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.message.assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.message-meta {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--loreal-text-light);
  margin-bottom: 5px;
}

.message.user .message-meta { color: var(--loreal-dark-gold); }

.bubble {
  padding: 13px 18px;
  border-radius: var(--radius-bubble);
  line-height: 1.65;
  font-size: 15px;
  font-family: 'Jost', sans-serif;
  font-weight: 400;
  word-break: break-word;
  box-shadow: var(--shadow-soft);
}

/* User bubble — dark gold/black theme */
.message.user .bubble {
  background: var(--loreal-black);
  color: var(--loreal-white);
  border-bottom-right-radius: 4px;
}

/* Assistant bubble — white with gold accent */
.message.assistant .bubble {
  background: var(--loreal-ai-bubble);
  color: var(--loreal-text-dark);
  border: 1px solid var(--loreal-mid-gray);
  border-bottom-left-radius: 4px;
  border-left: 3px solid var(--loreal-gold);
}

/* Welcome message special style */
.message.assistant.welcome .bubble {
  background: linear-gradient(135deg, #1A1A1A 0%, #2C2422 100%);
  color: var(--loreal-white);
  border: none;
  border-left: 3px solid var(--loreal-gold);
}

.message.assistant.welcome .bubble p {
  color: rgba(255,255,255,0.9);
}

/* --- Typing Indicator --- */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 4px;
}

.typing-indicator[hidden] { display: none; }

.typing-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--loreal-gold);
  animation: bounce 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

/* --- Input Area --- */
.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: var(--loreal-white);
  border: 1.5px solid var(--loreal-mid-gray);
  border-radius: var(--radius-input);
  padding: 10px 12px;
  box-shadow: var(--shadow-soft);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input-area:focus-within {
  border-color: var(--loreal-gold);
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.12);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: var(--loreal-text-dark);
  background: transparent;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.chat-input::placeholder {
  color: var(--loreal-text-light);
  font-weight: 300;
}

.send-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: none;
  background: var(--loreal-gold);
  color: var(--loreal-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
}

.send-btn:hover:not(:disabled) {
  background: var(--loreal-dark-gold);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201,168,76,0.35);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: var(--loreal-mid-gray);
  cursor: not-allowed;
}

/* --- Footer --- */
.site-footer {
  background: var(--loreal-black);
  border-top: 1px solid rgba(201,168,76,0.3);
  padding: 16px 20px;
  margin-top: auto;
}

.footer-inner {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  font-family: 'Jost', sans-serif;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.footer-nav {
  display: flex;
  gap: 20px;
}

.footer-nav a {
  color: rgba(255,255,255,0.45);
  text-decoration: none;
  transition: color var(--transition);
}

.footer-nav a:hover {
  color: var(--loreal-gold);
}

/* --- Animations --- */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Scrollbar Styling --- */
.chat-container::-webkit-scrollbar {
  width: 4px;
}
.chat-container::-webkit-scrollbar-track {
  background: transparent;
}
.chat-container::-webkit-scrollbar-thumb {
  background: var(--loreal-mid-gray);
  border-radius: 4px;
}
.chat-container::-webkit-scrollbar-thumb:hover {
  background: var(--loreal-gold);
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .header-inner {
    padding: 10px 14px;
  }
  .logo-text {
    font-size: 20px;
    letter-spacing: 4px;
  }
  .advisor-label {
    font-size: 10px;
  }
  .chat-wrapper {
    padding: 16px 10px 8px;
  }
  .chat-container {
    max-height: calc(100vh - 300px);
    padding: 14px;
  }
  .message {
    max-width: 94%;
  }
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
```

---

### 4.4 `script.js`

**This is the complete frontend logic implementing ALL LevelUps.**

```javascript
// =============================================
// L'ORÉAL SMART BEAUTY ADVISOR — script.js
// LevelUps: Conversation History ✓
//           Display User Question ✓
//           Chat Bubble UI ✓
// =============================================

// ─── CONFIGURATION ───────────────────────────
// IMPORTANT: Replace this URL with your actual Cloudflare Worker URL
// after deploying your worker in the Cloudflare dashboard.
const WORKER_URL = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev';

// System prompt: tells the AI who it is and what it can/can't answer
const SYSTEM_PROMPT = `You are "Beauty Advisor" — L'Oréal Paris's expert AI assistant.

Your role is to help users discover and understand L'Oréal's full range of products including skincare, haircare, makeup, and fragrances. You also create personalized beauty routines and product recommendations based on the user's skin type, hair type, concerns, and goals.

IMPORTANT GUIDELINES:
- Only answer questions related to: L'Oréal products, beauty routines, skincare, haircare, makeup techniques, fragrance, ingredients, skin types, hair care tips, and general beauty/wellness topics.
- If a user asks something completely unrelated to beauty or L'Oréal products (e.g., sports, politics, coding, homework), politely decline and redirect them back to beauty topics. Example: "That's outside my area of expertise! I'm here to help you with all things beauty. Can I help you find the perfect skincare routine or recommend a L'Oréal product for you? ✨"
- Be warm, knowledgeable, and encouraging. Use occasional emojis to keep the tone friendly.
- When you first learn the user's name, remember it and use it occasionally.
- Always try to recommend specific L'Oréal product lines or ranges when relevant (e.g., Revitalift, EverPure, Infallible, True Match, Elvive, etc.).
- Keep responses concise but helpful — typically 2–4 short paragraphs.

Start by warmly welcoming the user and asking how you can help them today.`;
// ─────────────────────────────────────────────

// ─── STATE ────────────────────────────────────
// LevelUp: Maintain Conversation History
// We store the full conversation so each API call includes context.
let conversationHistory = [];
let isLoading = false;
// ─────────────────────────────────────────────

// ─── DOM REFERENCES ───────────────────────────
const chatContainer   = document.getElementById('chatContainer');
const userInput       = document.getElementById('userInput');
const sendBtn         = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const userQuestionDisplay = document.getElementById('userQuestionDisplay');
// ─────────────────────────────────────────────

// ─── HELPERS ─────────────────────────────────

/**
 * Creates and appends a message bubble to the chat container.
 * @param {'user'|'assistant'} role
 * @param {string} text
 * @param {boolean} isWelcome - applies special styling to the first message
 * @returns {HTMLElement} the bubble element (for streaming updates)
 */
function appendMessage(role, text, isWelcome = false) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', role);
  if (isWelcome) messageEl.classList.add('welcome');

  const metaEl = document.createElement('div');
  metaEl.classList.add('message-meta');
  metaEl.textContent = role === 'user' ? 'You' : 'Beauty Advisor';

  const bubbleEl = document.createElement('div');
  bubbleEl.classList.add('bubble');
  bubbleEl.innerHTML = formatMessage(text);

  messageEl.appendChild(metaEl);
  messageEl.appendChild(bubbleEl);
  chatContainer.appendChild(messageEl);

  scrollToBottom();
  return bubbleEl; // return bubble so caller can update text if needed
}

/**
 * Light markdown-ish formatter: converts **bold**, line breaks, and emoji.
 */
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\n\n/g, '</p><p>')                         // double newline → paragraph
    .replace(/\n/g, '<br>')                              // single newline → br
    .replace(/^(.+)$/, '<p>$1</p>');                     // wrap in paragraph
}

/** Scrolls chat to the bottom. */
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/** Shows or hides the typing indicator. */
function setLoading(loading) {
  isLoading = loading;
  sendBtn.disabled = loading;
  typingIndicator.hidden = !loading;
  if (loading) scrollToBottom();
}

/**
 * LevelUp: Display User Question Above Response
 * Shows the current user question in the display strip above chat.
 * Resets (clears) before showing the new question.
 */
function updateUserQuestionDisplay(question) {
  if (!question) {
    userQuestionDisplay.classList.remove('visible');
    userQuestionDisplay.innerHTML = '';
    return;
  }
  userQuestionDisplay.innerHTML = `
    <div class="uq-label">Your question</div>
    <div class="uq-text">${escapeHtml(question)}</div>
  `;
  userQuestionDisplay.classList.add('visible');
}

/** Escapes HTML to prevent XSS in user input display. */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── CORE CHAT FUNCTION ───────────────────────

/**
 * Sends the user message to the Cloudflare Worker, which proxies
 * the request to OpenAI. Conversation history is maintained for
 * multi-turn context (LevelUp: Conversation History).
 */
async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText || isLoading) return;

  // Clear input and resize
  userInput.value = '';
  userInput.style.height = 'auto';

  // LevelUp: Display User Question (resets from previous, shows new one)
  updateUserQuestionDisplay(userText);

  // LevelUp: Chat Bubble UI — display user message as bubble
  appendMessage('user', userText);

  // LevelUp: Conversation History — push user message to history array
  conversationHistory.push({ role: 'user', content: userText });

  // Show loading state
  setLoading(true);

  try {
    // Send full conversation history to Worker so OpenAI has full context
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,  // All prior turns = context awareness
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response content from AI');
    }

    // LevelUp: Conversation History — push assistant reply to history
    conversationHistory.push({ role: 'assistant', content: assistantMessage });

    // LevelUp: Chat Bubble UI — display AI reply as bubble
    appendMessage('assistant', assistantMessage);

  } catch (err) {
    console.error('Chat error:', err);
    appendMessage(
      'assistant',
      '✨ I\'m having a moment — please try again shortly! If the issue persists, the advisor may be refreshing her palette. 💄'
    );
  } finally {
    setLoading(false);
    userInput.focus();
  }
}

// ─── EVENT LISTENERS ──────────────────────────

// Send on button click
sendBtn.addEventListener('click', sendMessage);

// Send on Enter (Shift+Enter = new line)
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea as user types
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// ─── INITIALIZATION ───────────────────────────

/**
 * On page load: display a welcome message and seed conversation history.
 * This gives the chatbot a "first turn" context.
 */
function init() {
  const welcomeText = `✨ Welcome to L'Oréal Paris! I'm your Smart Beauty Advisor, here to help you discover personalized skincare routines, find the perfect makeup match, and explore our full range of haircare and fragrance collections.

Whether you're looking for your ideal foundation shade, building a skincare routine for your skin type, or curious about our star ingredients — I'm here to help!

**How can I help you discover your beauty today?**`;

  appendMessage('assistant', welcomeText, true);

  // Seed history so the AI "remembers" it gave a welcome
  conversationHistory.push({
    role: 'assistant',
    content: welcomeText,
  });

  userInput.focus();
}

init();
```

---

### 4.5 `README.md`

```markdown
# L'Oréal Smart Beauty Advisor

An AI-powered beauty chatbot built for the Glo Career Accelerator — Project 8.

## Live Demo
[View on GitHub Pages](https://YOUR_USERNAME.github.io/loreal-chatbot)

## Cloudflare Worker Setup

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create** → **Worker**
3. Name: `loreal-chatbot-worker` → Click **Deploy**
4. Click **Edit Code**, replace everything with contents of `worker.js`
5. Click **Save and Deploy**
6. Go to **Settings** → **Variables and Secrets**
7. Under **Secrets**: Add `OPENAI_API_KEY` → paste your OpenAI key → Save
8. Copy your Worker URL

## Frontend Setup

1. Open `script.js`
2. Replace `WORKER_URL` value with your Cloudflare Worker URL
3. Commit and push to GitHub
4. Enable GitHub Pages: Settings → Pages → Branch: main → Save

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend Proxy:** Cloudflare Workers
- **AI:** OpenAI GPT-4o-mini via Chat Completions API
- **Deployment:** GitHub Pages + Cloudflare Workers
```

---

## 5. Rubric Coverage Checklist

| Criterion | Points | Implementation |
|---|---|---|
| L'Oréal Branding | 10 | Cormorant Garamond + Jost fonts, gold/black brand colors, logo display, branded header/footer |
| Chatbot Configuration | 20 | System prompt in `script.js`, captures input, POSTs to Worker, displays responses in bubbles |
| AI Relevance | 10 | System prompt explicitly instructs refusal of off-topic questions with redirect language |
| Secure Deployment | 10 | API key in Cloudflare Worker Secret (never in frontend), Worker proxies all requests |
| **LevelUp:** Conversation History | +10 | `conversationHistory` array sent on every call, AI has full multi-turn context |
| **LevelUp:** Display User Question | +5 | `#userQuestionDisplay` strip shows current question, resets on each send |
| **LevelUp:** Chat Bubble UI | +10 | `message.user` / `message.assistant` CSS bubble classes with distinct black vs white styling |
| **Total** | **105** | All rubric points covered |

---

## 6. Deployment Sequence (for agent to follow)

### Step 1 — Create the files
Generate all 5 files in the exact structure listed in Section 2.

### Step 2 — Push to GitHub
Commit and push all files to a new GitHub repo named `loreal-chatbot`.

### Step 3 — Cloudflare Worker (manual — user does this)
> Tell the user to follow the Cloudflare Dashboard Steps in Section 4.1.  
> The agent cannot do this step — it requires a Cloudflare account and API key.

### Step 4 — Update WORKER_URL
After the user copies their Worker URL, update line 9 of `script.js`:
```javascript
const WORKER_URL = 'https://loreal-chatbot-worker.THEIR-SUBDOMAIN.workers.dev';
```
Commit and push this change.

### Step 5 — Enable GitHub Pages
User goes to repo Settings → Pages → Source: Deploy from branch → Branch: `main` → `/root` → Save.

### Step 6 — Test
Open the GitHub Pages URL in an incognito window. Test:
- Welcome message appears on load
- Sending a beauty question returns an AI response
- Asking an off-topic question (e.g., "what is 2+2?") gets a polite refusal
- User question display strip appears and resets
- Chat bubbles styled differently for user vs assistant
- Conversation memory works (e.g., say your name, ask follow-up questions)

---

## 7. Agent Prompt (copy-paste this to start your coding agent)

> "Build the L'Oréal Smart Beauty Advisor chatbot exactly as specified in this PRD. Create the following 5 files with the exact code provided: `index.html`, `style.css`, `script.js`, `worker.js`, and `README.md`. Use the exact CSS variables, fonts (Cormorant Garamond + Jost via Google Fonts), color values, and JavaScript logic specified. Do not simplify or strip features — all LevelUps must be implemented. The `WORKER_URL` constant in `script.js` should be set to a placeholder string `'PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE'` so the user can fill it in after deploying their worker. Ensure the code is production-ready, well-commented, and ready to commit to GitHub."

---

*PRD version 1.0 — Glo Career Accelerator Project 8*
