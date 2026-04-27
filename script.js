// ============================================================
//  PromptScope — script.js
//  Full application logic: auth, analysis, routing, history
// ============================================================

// ── State ────────────────────────────────────────────────────
let currentUser = null;
let darkMode = false;
let realtimeTimer = null;

// ── Vague & Unclear Word Lists ────────────────────────────────
const VAGUE_WORDS = [
  'something', 'things', 'thing', 'stuff', 'etc', 'etcetera',
  'maybe', 'perhaps', 'some', 'kind of', 'sort of', 'a bit',
  'various', 'whatever', 'anything', 'somehow', 'somewhere',
  'someone', 'anybody', 'everybody', 'nobody', 'everywhere',
  'good', 'bad', 'nice', 'great', 'awesome', 'many', 'few',
  'a lot', 'lots', 'several', 'often', 'sometimes', 'usually',
  'generally', 'basically', 'literally', 'simply', 'just'
];

const UNCLEAR_PHRASES = [
  'as soon as possible', 'asap', 'in detail', 'briefly',
  'in a way', 'and so on', 'and stuff', 'you know', 'like',
  'or something', 'at some point', 'in general', 'about this',
  'about that', 'all of this', 'do something', 'make it',
  'fix it', 'help me', 'tell me about', 'write about'
];

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  checkSession();
  showPage('home');
  highlightNavLink('home');
});

// ── Theme ─────────────────────────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem('ps_theme') || 'light';
  darkMode = saved === 'dark';
  applyTheme();
}

function toggleTheme() {
  darkMode = !darkMode;
  applyTheme();
  localStorage.setItem('ps_theme', darkMode ? 'dark' : 'light');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('themeIcon').textContent = darkMode ? '🌙' : '☀️';
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Session & Auth ────────────────────────────────────────────
function checkSession() {
  const session = localStorage.getItem('ps_session');
  if (session) {
    currentUser = JSON.parse(session);
    updateNavUser();
  }
}

function updateNavUser() {
  if (currentUser) {
    document.getElementById('navUser').classList.remove('hidden');
    document.getElementById('navGuest').classList.add('hidden');
    document.getElementById('navUserName').textContent = `👤 ${currentUser.name}`;
  } else {
    document.getElementById('navUser').classList.add('hidden');
    document.getElementById('navGuest').classList.remove('hidden');
  }
}

function showAuth() {
  document.getElementById('authOverlay').classList.remove('hidden');
  showLogin();
}

function hideAuth() {
  document.getElementById('authOverlay').classList.add('hidden');
}

function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('signupForm').classList.add('hidden');
}

function showSignup() {
  document.getElementById('signupForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
}

function getUsers() {
  return JSON.parse(localStorage.getItem('ps_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('ps_users', JSON.stringify(users));
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Please fill in all fields.', 'error'); return;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showToast('Invalid email or password.', 'error'); return;
  }

  currentUser = { name: user.name, email: user.email };
  localStorage.setItem('ps_session', JSON.stringify(currentUser));
  updateNavUser();
  hideAuth();
  showToast(`Welcome back, ${user.name}! 👋`, 'success');
}

function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;

  if (!name || !email || !password || !confirm) {
    showToast('Please fill in all fields.', 'error'); return;
  }

  if (!email.includes('@')) {
    showToast('Enter a valid email address.', 'error'); return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error'); return;
  }

  if (password !== confirm) {
    showToast('Passwords do not match.', 'error'); return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('An account with this email already exists.', 'error'); return;
  }

  users.push({ name, email, password });
  saveUsers(users);

  currentUser = { name, email };
  localStorage.setItem('ps_session', JSON.stringify(currentUser));
  updateNavUser();
  hideAuth();
  showToast(`Account created! Welcome, ${name}! 🎉`, 'success');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('ps_session');
  updateNavUser();
  showPage('home');
  showToast('You have been logged out.', 'info');
}

// ── Routing ───────────────────────────────────────────────────
function showPage(name) {
  // Protected pages
  const protected_ = ['history'];
  if (protected_.includes(name) && !currentUser) {
    showToast('Please log in to view your history.', 'info');
    showAuth();
    return;
  }

  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');

  highlightNavLink(name);

  // Page-specific init
  if (name === 'history') renderHistory();
  if (name === 'analyzer') {
    document.getElementById('promptInput').focus();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function highlightNavLink(name) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-page') === name);
  });
}

// ── Mobile Nav ────────────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('hidden');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// ── Analyzer: Character Counter & Real-time ───────────────────
function onPromptInput() {
  const input = document.getElementById('promptInput');
  const count = document.getElementById('charCount');
  const len = input.value.length;

  count.textContent = `${len} / 2000`;
  count.classList.toggle('warn', len > 1600);

  clearTimeout(realtimeTimer);
  if (len > 5) {
    realtimeTimer = setTimeout(() => {
      const scores = computeScores(input.value);
      updateRealtimeBars(scores);
    }, 350);
  } else {
    clearRealtimeBars();
  }
}

function clearRealtimeBars() {
  ['rtClarity', 'rtSpecificity', 'rtAmbiguity'].forEach(id => {
    document.getElementById(id).style.width = '0%';
  });
  document.getElementById('rtClarityVal').textContent = '—';
  document.getElementById('rtSpecificityVal').textContent = '—';
  document.getElementById('rtAmbiguityVal').textContent = '—';
}

function updateRealtimeBars(scores) {
  setBar('rtClarity', scores.clarity);
  setBar('rtSpecificity', scores.specificity);
  setBar('rtAmbiguity', scores.ambiguity);
  document.getElementById('rtClarityVal').textContent = scores.clarity;
  document.getElementById('rtSpecificityVal').textContent = scores.specificity;
  document.getElementById('rtAmbiguityVal').textContent = scores.ambiguity;
}

function setBar(id, val) {
  document.getElementById(id).style.width = `${val}%`;
}

function clearPrompt() {
  document.getElementById('promptInput').value = '';
  document.getElementById('charCount').textContent = '0 / 2000';
  document.getElementById('charCount').classList.remove('warn');
  clearRealtimeBars();
  document.getElementById('resultsPanel').innerHTML = `
    <div class="results-placeholder">
      <div class="placeholder-icon">🧠</div>
      <p>Analysis results will appear here after you click <strong>Analyze Prompt</strong></p>
    </div>`;
  document.getElementById('highlightedPrompt').classList.add('hidden');
  document.getElementById('promptInput').classList.remove('hidden');
}

// ── Core Analysis Logic ───────────────────────────────────────
function computeScores(text) {
  return {
    clarity: scoreClarity(text),
    specificity: scoreSpecificity(text),
    ambiguity: scoreAmbiguity(text)
  };
}

function scoreClarity(text) {
  if (!text.trim()) return 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/);
  const avgWords = words.length / Math.max(sentences.length, 1);

  let score = 100;

  // Penalize very long sentences (>25 words per sentence)
  if (avgWords > 25) score -= 30;
  else if (avgWords > 18) score -= 15;
  else if (avgWords > 12) score -= 5;

  // Reward multi-sentence structure
  if (sentences.length >= 2) score += 5;

  // Penalize very short prompts
  if (words.length < 5) score -= 25;
  if (words.length < 10) score -= 10;

  // Penalize prompts with no capitalization
  if (text[0] !== text[0].toUpperCase()) score -= 8;

  // Check for question marks or clear verbs (imperative structure)
  const hasVerb = /\b(explain|describe|list|create|write|show|compare|define|analyze|summarize|provide|generate|tell|give|make|build|help)\b/i.test(text);
  if (hasVerb) score += 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function scoreSpecificity(text) {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 100;
  let vagueCount = 0;

  VAGUE_WORDS.forEach(vw => {
    const pattern = new RegExp(`\\b${escapeRegex(vw)}\\b`, 'gi');
    const matches = (text.match(pattern) || []).length;
    vagueCount += matches;
    score -= matches * 8;
  });

  UNCLEAR_PHRASES.forEach(phrase => {
    if (lower.includes(phrase)) {
      score -= 10;
      vagueCount++;
    }
  });

  // Reward presence of numbers or specific terms
  const hasNumbers = /\d/.test(text);
  if (hasNumbers) score += 8;

  // Reward longer, detail-rich text
  if (words.length > 20) score += 10;
  if (words.length > 40) score += 10;

  // Penalize very short prompts
  if (words.length < 6) score -= 25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function scoreAmbiguity(text) {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  let score = 100;

  // Detect unclear pronouns without context
  const unclearPronouns = ['it', 'this', 'that', 'they', 'them', 'those', 'these', 'he', 'she'];
  unclearPronouns.forEach(p => {
    const pattern = new RegExp(`\\b${p}\\b`, 'gi');
    const count = (text.match(pattern) || []).length;
    if (count > 1) score -= count * 6;
  });

  // Detect double negatives
  if (/\bnot.{0,10}no\b|\bnever.{0,10}not\b/i.test(text)) score -= 20;

  // Detect conditional stacking
  const conditionals = (text.match(/\bif\b|\bwhen\b|\bunless\b|\bwhenever\b/gi) || []).length;
  if (conditionals > 2) score -= conditionals * 8;

  // Detect missing context (very short prompts with broad topic)
  const words = text.trim().split(/\s+/);
  if (words.length < 8) score -= 20;

  // Reward explicit context words
  const contextWords = ['specifically', 'for example', 'in the context of', 'regarding', 'in terms of', 'such as', 'including'];
  contextWords.forEach(cw => {
    if (lower.includes(cw)) score += 6;
  });

  // Check for passive voice ambiguity
  const passiveCount = (text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;
  if (passiveCount > 2) score -= passiveCount * 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function overallScore(scores) {
  return Math.round(scores.clarity * 0.35 + scores.specificity * 0.40 + scores.ambiguity * 0.25);
}

function getGrade(score) {
  if (score >= 85) return { label: 'Excellent', cls: 'good' };
  if (score >= 65) return { label: 'Good', cls: 'good' };
  if (score >= 45) return { label: 'Fair', cls: 'fair' };
  return { label: 'Poor', cls: 'poor' };
}

// ── Highlight Issues in Text ──────────────────────────────────
function highlightText(text) {
  let result = text;
  const lower = text.toLowerCase();

  // We'll build an array of spans to replace
  const ranges = [];

  VAGUE_WORDS.forEach(vw => {
    const pattern = new RegExp(`\\b(${escapeRegex(vw)})\\b`, 'gi');
    let m;
    while ((m = pattern.exec(text)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length, word: m[0], type: 'vague' });
    }
  });

  UNCLEAR_PHRASES.forEach(phrase => {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + phrase.length, word: text.slice(idx, idx + phrase.length), type: 'unclear' });
    }
  });

  // Sort by start, reverse order to replace from end
  ranges.sort((a, b) => b.start - a.start);

  // Remove overlapping
  const seen = new Set();
  const filtered = ranges.filter(r => {
    for (let i = r.start; i < r.end; i++) {
      if (seen.has(i)) return false;
    }
    for (let i = r.start; i < r.end; i++) seen.add(i);
    return true;
  });

  filtered.sort((a, b) => b.start - a.start);

  result = text;
  filtered.forEach(r => {
    const cls = r.type === 'vague' ? 'highlight-vague' : 'highlight-unclear';
    const tooltip = r.type === 'vague'
      ? `title="⚠️ Vague word: '${r.word}' — be more specific"`
      : `title="🔶 Unclear phrase: '${r.word}' — provide context"`;
    const replacement = `<mark class="${cls}" ${tooltip}>${r.word}</mark>`;
    result = result.slice(0, r.start) + replacement + result.slice(r.end);
  });

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Generate Suggestions ──────────────────────────────────────
function generateSuggestion(text, scores) {
  const lower = text.toLowerCase().trim();
  const overall = overallScore(scores);

  if (overall >= 80) {
    return `Your prompt is already well-structured. Minor refinement: "${text.trim()}" — consider adding a specific output format or audience context for maximum precision.`;
  }

  // Replace vague words and build better version
  let improved = text.trim();

  const replacements = {
    'something': 'a specific concept',
    'things': 'key aspects',
    'thing': 'element',
    'stuff': 'relevant components',
    'etc': '(list specific examples)',
    'maybe': 'ideally',
    'some': 'several',
    'kind of': '',
    'sort of': '',
    'a bit': 'moderately',
    'good': 'effective',
    'bad': 'ineffective',
    'nice': 'well-designed',
    'great': 'excellent',
    'awesome': 'impressive',
    'basically': '',
    'literally': '',
    'simply': '',
    'just': '',
    'a lot': 'a significant number of',
    'lots': 'numerous',
    'many': 'a substantial number of',
    'often': 'frequently',
    'usually': 'typically',
    'generally': 'in most cases',
  };

  Object.entries(replacements).forEach(([vague, specific]) => {
    const re = new RegExp(`\\b${escapeRegex(vague)}\\b`, 'gi');
    improved = improved.replace(re, specific);
  });

  // Clean double spaces
  improved = improved.replace(/\s{2,}/g, ' ').trim();

  // Add structure if very short
  if (text.split(/\s+/).length < 10) {
    const topic = text.replace(/^(explain|tell me about|write about|describe|what is|how to)\s*/i, '').trim() || 'the topic';
    improved = `Provide a comprehensive explanation of ${topic}, including its key concepts, practical applications, and real-world examples. Structure the response with clear sections and use specific terminology where appropriate.`;
  }

  // Ensure it starts with a clear imperative
  const imperativeVerbs = /^(explain|describe|list|create|write|show|compare|define|analyze|summarize|provide|generate|tell|give|make|build|help)/i;
  if (!imperativeVerbs.test(improved)) {
    improved = `Provide a detailed and specific response about: ${improved}`;
  }

  return improved;
}

// ── Build Issues List ─────────────────────────────────────────
function buildIssues(text, scores) {
  const issues = [];
  const lower = text.toLowerCase();

  const foundVague = VAGUE_WORDS.filter(vw => new RegExp(`\\b${escapeRegex(vw)}\\b`, 'i').test(text));
  const foundUnclear = UNCLEAR_PHRASES.filter(p => lower.includes(p));

  if (foundVague.length > 0) {
    issues.push({ type: 'vague', icon: '🔴', text: `Vague words detected: ${foundVague.slice(0, 4).map(w => `"${w}"`).join(', ')}` });
  }

  if (foundUnclear.length > 0) {
    issues.push({ type: 'unclear', icon: '🟠', text: `Unclear phrases: ${foundUnclear.slice(0, 3).map(p => `"${p}"`).join(', ')}` });
  }

  if (scores.clarity < 60) {
    issues.push({ type: 'unclear', icon: '🟠', text: 'Sentence structure is complex or unclear. Use shorter, direct sentences.' });
  }

  if (text.trim().split(/\s+/).length < 8) {
    issues.push({ type: 'vague', icon: '🔴', text: 'Prompt is too brief. Add context, constraints, or desired output format.' });
  }

  if (issues.length === 0) {
    issues.push({ type: 'ok', icon: '✅', text: 'No major issues detected. Your prompt is clear and specific.' });
  }

  return issues;
}

// ── Analyze Button ────────────────────────────────────────────
function analyzePrompt() {
  const text = document.getElementById('promptInput').value.trim();

  if (!text) {
    showToast('Please enter a prompt to analyze.', 'error'); return;
  }

  if (text.length < 3) {
    showToast('Prompt is too short to analyze.', 'error'); return;
  }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Analyzing...';

  setTimeout(() => {
    const scores = computeScores(text);
    const overall = overallScore(scores);
    const grade = getGrade(overall);
    const issues = buildIssues(text, scores);
    const suggestion = generateSuggestion(text, scores);
    const highlighted = highlightText(text);

    // Show highlighted text
    const highlightEl = document.getElementById('highlightedPrompt');
    const inputEl = document.getElementById('promptInput');
    highlightEl.innerHTML = highlighted;
    highlightEl.classList.remove('hidden');
    inputEl.classList.add('hidden');

    // Render results
    renderResults(scores, overall, grade, issues, suggestion);

    // Save to history
    saveToHistory(text, scores, overall);

    btn.disabled = false;
    btn.querySelector('span').textContent = 'Analyze Prompt';

    showToast('Analysis complete!', 'success');
  }, 600);
}

// ── Render Results ────────────────────────────────────────────
function renderResults(scores, overall, grade, issues, suggestion) {
  const issuesHTML = issues.map(i =>
    `<div class="issue-item ${i.type}">
      <span class="issue-icon">${i.icon}</span>
      <span>${i.text}</span>
    </div>`
  ).join('');

  document.getElementById('resultsPanel').innerHTML = `
    <div class="score-card">
      <div class="score-header">
        <h3>Analysis Results</h3>
        <div class="overall-badge ${grade.cls}">${overall} <small style="font-size:14px;font-weight:500">${grade.label}</small></div>
      </div>

      <div class="score-metrics">
        <div class="metric-row">
          <div class="metric-label-row">
            <span class="metric-name">🎯 Clarity</span>
            <span class="metric-val" style="color:var(--accent)">${scores.clarity}/100</span>
          </div>
          <div class="metric-bar-track"><div class="metric-bar bar-clarity" id="barClarity"></div></div>
        </div>
        <div class="metric-row">
          <div class="metric-label-row">
            <span class="metric-name">🔍 Specificity</span>
            <span class="metric-val" style="color:var(--success)">${scores.specificity}/100</span>
          </div>
          <div class="metric-bar-track"><div class="metric-bar bar-specificity" id="barSpecificity"></div></div>
        </div>
        <div class="metric-row">
          <div class="metric-label-row">
            <span class="metric-name">⚖️ Ambiguity Score</span>
            <span class="metric-val" style="color:var(--warning)">${scores.ambiguity}/100</span>
          </div>
          <div class="metric-bar-track"><div class="metric-bar bar-ambiguity" id="barAmbiguity"></div></div>
        </div>
      </div>

      <div class="score-divider"></div>

      <div class="issues-section">
        <h4>Detected Issues</h4>
        <div class="issues-list">${issuesHTML}</div>
      </div>

      <div class="suggestions-section">
        <h4>💡 Improved Prompt</h4>
        <div class="suggestion-box">
          <p id="suggestionText">${escapeHTML(suggestion)}</p>
          <button class="copy-btn" onclick="copySuggestion()">Copy Improved Prompt</button>
        </div>
      </div>
    </div>`;

  // Animate bars
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.getElementById('barClarity').style.width = `${scores.clarity}%`;
      document.getElementById('barSpecificity').style.width = `${scores.specificity}%`;
      document.getElementById('barAmbiguity').style.width = `${scores.ambiguity}%`;
    }, 50);
  });
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copySuggestion() {
  const text = document.getElementById('suggestionText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Improved prompt copied!', 'success');
  }).catch(() => {
    showToast('Copy failed. Please copy manually.', 'error');
  });
}

// ── History ───────────────────────────────────────────────────
function getHistory() {
  return JSON.parse(localStorage.getItem('ps_history') || '[]');
}

function saveHistory(history) {
  localStorage.setItem('ps_history', JSON.stringify(history));
}

function saveToHistory(text, scores, overall) {
  const history = getHistory();
  const entry = {
    id: Date.now(),
    text,
    clarity: scores.clarity,
    specificity: scores.specificity,
    ambiguity: scores.ambiguity,
    overall,
    date: new Date().toISOString()
  };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  saveHistory(history);
}

function renderHistory() {
  const history = getHistory();
  const container = document.getElementById('historyList');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <span class="empty-icon">📭</span>
        <p>No prompts analyzed yet.<br/>Head to the <strong>Analyzer</strong> to get started.</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(entry => {
    const d = new Date(entry.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const grade = getGrade(entry.overall);

    return `
      <div class="history-item" id="item-${entry.id}">
        <div class="history-item-header">
          <div class="history-prompt-text">${escapeHTML(entry.text)}</div>
          <div class="history-date">${dateStr} · ${timeStr}</div>
        </div>
        <div class="history-scores">
          <span class="score-pill clarity">Clarity: ${entry.clarity}</span>
          <span class="score-pill specificity">Specificity: ${entry.specificity}</span>
          <span class="score-pill ambiguity">Ambiguity: ${entry.ambiguity}</span>
          <span class="score-pill overall">Overall: ${entry.overall} — ${grade.label}</span>
        </div>
        <div class="history-actions">
          <button class="btn-secondary" onclick="reanalyze(${entry.id})">Re-analyze</button>
          <button class="btn-danger" onclick="deleteHistoryItem(${entry.id})">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function deleteHistoryItem(id) {
  let history = getHistory();
  history = history.filter(e => e.id !== id);
  saveHistory(history);
  renderHistory();
  showToast('Entry deleted.', 'info');
}

function clearAllHistory() {
  if (!confirm('Clear all history? This cannot be undone.')) return;
  localStorage.removeItem('ps_history');
  renderHistory();
  showToast('History cleared.', 'info');
}

function reanalyze(id) {
  const history = getHistory();
  const entry = history.find(e => e.id === id);
  if (!entry) return;

  showPage('analyzer');
  const input = document.getElementById('promptInput');
  input.classList.remove('hidden');
  document.getElementById('highlightedPrompt').classList.add('hidden');
  input.value = entry.text;
  onPromptInput();

  setTimeout(() => analyzePrompt(), 100);
}