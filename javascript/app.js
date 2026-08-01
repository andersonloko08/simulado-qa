// ============================================
// INTERVIEWOPS PORTUGAL — SHARED LOGIC
// ============================================

// ---------- THEME MANAGEMENT ----------
const THEME_KEY = 'interviewops_theme';

// ---------- LANGUAGE / I18N ----------
const LANG_KEY = 'interviewops_lang';
const ENG_VARIANT_KEY = 'interviewops_eng_variant';
const I18N_PATH = 'json/i18n.json';

const LANGS = ['pt-br', 'pt-pt', 'en-us', 'en-uk'];
const LANG_NAMES = {
    'pt-br': 'Português (BR)',
    'pt-pt': 'Português (PT)',
    'en-us': 'English (US)',
    'en-uk': 'English (UK)'
};

// Categorias cujo conteúdo é 'sobre inglês' (usam a variante de inglês escolhida).
const ENGLISH_CATEGORIES = ['English', 'english'];

let I18N = { strings: {}, questions: {} };
let CURRENT_LANG = 'pt-br';
let CURRENT_ENG_VARIANT = 'en-us';

function getSavedLang() {
    try { return localStorage.getItem(LANG_KEY) || 'pt-br'; } catch (e) { return 'pt-br'; }
}

function getSavedEngVariant() {
    try { return localStorage.getItem(ENG_VARIANT_KEY) || 'en-us'; } catch (e) { return 'en-us'; }
}

function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    CURRENT_LANG = lang;
    try {
        localStorage.setItem(LANG_KEY, lang);
        if (lang === 'en-us') { setEngVariant('en-us'); }
        if (lang === 'en-uk') { setEngVariant('en-uk'); }
    } catch (e) {}
}

function setEngVariant(variant) {
    if (!['en-us', 'en-uk'].includes(variant)) return;
    CURRENT_ENG_VARIANT = variant;
    try { localStorage.setItem(ENG_VARIANT_KEY, variant); } catch (e) {}
}

// Idioma efetivo para uma determinada questão/categoria.
// Regra do usuário:
//   - EN-US selecionado -> tudo US (inclui conteúdo 'English').
//   - EN-UK selecionado -> tudo UK.
//   - PT-BR / PT-PT    -> UI em PT; conteúdo 'English' usa a variante escolhida (US/UK).
function resolveLang(category) {
    if (CURRENT_LANG === 'en-us' || CURRENT_LANG === 'en-uk') return CURRENT_LANG;
    if (ENGLISH_CATEGORIES.includes(category)) return CURRENT_ENG_VARIANT;
    return CURRENT_LANG;
}

// Resolve o conteúdo traduzido de um objeto com chaves por idioma.
function l(obj, category) {
    if (!obj) return '';
    const lang = resolveLang(category);
    if (obj[lang]) return obj[lang];
    if (obj['en-us']) return obj['en-us'];
    return obj['pt-br'] || '';
}

// Tradução de strings de interface.
function t(key) {
    const table = (I18N.strings && I18N.strings[CURRENT_LANG]) || {};
    return table[key] || (I18N.strings && I18N.strings['pt-br'] && I18N.strings['pt-br'][key]) || key;
}

async function initI18n() {
    try {
        I18N = await loadJSON(I18N_PATH);
    } catch (e) {
        I18N = { strings: {}, questions: {} };
    }
    CURRENT_LANG = getSavedLang();
    CURRENT_ENG_VARIANT = getSavedEngVariant();
    if (CURRENT_LANG === 'en-us') CURRENT_ENG_VARIANT = 'en-us';
    if (CURRENT_LANG === 'en-uk') CURRENT_ENG_VARIANT = 'en-uk';
    renderLangSelector();
    applyTranslations();
}

// Insere o seletor de idioma na topbar (chamado em todas as páginas).
function renderLangSelector() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('lang-select')) return;
    const wrap = document.createElement('div');
    wrap.className = 'lang-select-wrap';
    wrap.style.cssText = 'display:flex; align-items:center; gap:0.4rem; position:relative;';
    wrap.innerHTML = `
        <i class="fa-solid fa-globe" style="color:var(--text-muted); font-size:0.9rem;"></i>
        <select id="lang-select" class="lang-select" aria-label="Idioma" style="background:var(--card-bg); color:var(--text-color); border:1px solid var(--card-border); border-radius:8px; padding:0.3rem 0.5rem; font-size:0.85rem; cursor:pointer;">
            ${LANGS.map(lang => `<option value="${lang}" ${lang === CURRENT_LANG ? 'selected' : ''}>${LANG_NAMES[lang]}</option>`).join('')}
        </select>
    `;
    actions.insertBefore(wrap, actions.firstChild);

    const select = document.getElementById('lang-select');
    select.addEventListener('change', () => {
        setLang(select.value);
        // Se PT selecionado, pergunta a variante de inglês
        if (select.value === 'pt-br' || select.value === 'pt-pt') {
            const variant = prompt(t('choose_eng_variant') || 'Escolha a variante de inglês para conteúdo "English" (US ou UK):', CURRENT_ENG_VARIANT === 'en-uk' ? 'uk' : 'us');
            setEngVariant(String(variant || 'us').toLowerCase().startsWith('uk') ? 'en-uk' : 'en-us');
        }
        // atualiza elementos traduzíveis na página atual
        applyTranslations();
        // se a página tem render dinâmico, recarrega
        if (window.onLangChange) window.onLangChange(CURRENT_LANG);
    });
}

// Aplica traduções a elementos com data-i18n.
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = val;
        } else if (el.childElementCount > 0) {
            // preserva elementos filhos (ex.: ícones na nav); traduz só o texto solto
            const nodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
            if (nodes.length) {
                nodes[0].textContent = ' ' + val;
            }
        } else {
            el.textContent = val;
        }
        if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val);
    });
}

window.t = t;
window.l = l;
window.resolveLang = resolveLang;
window.setLang = setLang;
window.setEngVariant = setEngVariant;
window.getSavedLang = getSavedLang;

// ---------- THEME MANAGEMENT ----------

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem(THEME_KEY, 'light');
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_KEY, 'dark');
            toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    });
}

// ---------- NAVIGATION ACTIVE STATE ----------
function initNav() {
    const current = document.body.getAttribute('data-page');
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.page === current) {
            link.classList.add('active');
        }
        // mapeia labels da nav para chaves i18n
        const pageKey = link.dataset.page;
        const map = {
            'home': 'home', 'dashboard': 'dashboard', 'modules': 'modules',
            'mock': 'mock_interview', 'career': 'career_engine', 'companies': 'companies',
            'english': 'english', 'tracker': 'gaps', 'roadmap': 'roadmap'
        };
        if (pageKey && map[pageKey]) {
            link.setAttribute('data-i18n', map[pageKey]);
        }
    });
}

// ---------- PROGRESS TRACKING (localStorage) ----------
const PROGRESS_KEY = 'interviewops_progress';
const STREAK_KEY = 'interviewops_streak';

function getProgressData() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveProgressData(data) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

// Module progress is stored as { moduleId: { completed: n, total: n, quizBest: 0..100, lastStudy: 'YYYY-MM-DD' } }
function getModuleProgress(moduleId) {
    const data = getProgressData();
    return data.modules && data.modules[moduleId] || null;
}

function setModuleProgress(moduleId, obj) {
    const data = getProgressData();
    if (!data.modules) data.modules = {};
    data.modules[moduleId] = Object.assign({}, data.modules[moduleId], obj);
    data.modules[moduleId].lastStudy = new Date().toISOString();
    saveProgressData(data);
}

function markQuestionLearned(moduleId) {
    const p = getModuleProgress(moduleId);
    const completed = (p && p.completed) || 0;
    const total = (p && p.total) || 0;
    setModuleProgress(moduleId, { completed: Math.min(completed + 1, total) });
}

function setQuizBest(moduleId, pct) {
    const p = getModuleProgress(moduleId);
    const best = (p && p.quizBest) || 0;
    setModuleProgress(moduleId, { quizBest: Math.max(best, pct) });
}

// Overall preparation % across all modules
function overallPreparation(modulesMeta) {
    let sum = 0;
    let count = 0;
    (modulesMeta || []).forEach(m => {
        const p = getModuleProgress(m.id);
        const completed = (p && p.completed) || 0;
        const total = (p && p.total) || m.totalQuestions || 0;
        const lessonPct = total > 0 ? completed / total : 0;
        const quizPct = (p && p.quizBest) ? p.quizBest / 100 : 0;
        const pct = Math.round((lessonPct * 0.6 + quizPct * 0.4) * 100);
        sum += pct;
        count++;
    });
    return count > 0 ? Math.round(sum / count) : 0;
}

// ---------- STUDY STREAK ----------
function updateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    let data = {};
    try {
        data = JSON.parse(localStorage.getItem(STREAK_KEY)) || {};
    } catch (e) { data = {}; }

    if (data.last === today) {
        return data.count || 1;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let count = 1;
    if (data.last === yesterday) {
        count = (data.count || 0) + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: today, count }));
    return count;
}

// ---------- UTILITIES ----------
function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Erro ao carregar ${path}`);
    return response.json();
}

function renderProgressBar(id, pct, extraClass) {
    const el = document.getElementById(id);
    if (!el) return;
    const bar = el.querySelector('.progress-bar') || el;
    bar.style.width = `${pct}%`;
    if (extraClass) bar.classList.add(extraClass);
}

// Global helpers for inline onclick usage
window.shuffleArray = shuffleArray;
window.escapeHtml = escapeHtml;
window.formatTime = formatTime;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initI18n();
});
