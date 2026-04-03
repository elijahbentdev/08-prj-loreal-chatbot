// =============================================
// L'ORÉAL SMART BEAUTY ADVISOR — script.js
// LevelUps: Conversation History ✓
//           Display User Question ✓
//           Chat Bubble UI ✓
// =============================================

// ─── CONFIGURATION ───────────────────────────
// IMPORTANT: Replace this URL with your actual Cloudflare Worker URL
// after deploying your worker in the Cloudflare dashboard.
const WORKER_URL = 'https://fluxbotcca.elijah-bent.workers.dev';

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
        "✨ I'm having a moment — please try again shortly! If the issue persists, the advisor may be refreshing her palette. 💄"
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
