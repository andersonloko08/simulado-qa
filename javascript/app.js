// ============================================
// INTERVIEWOPS PORTUGAL — SHARED LOGIC
// ============================================

// ---------- THEME MANAGEMENT ----------
const THEME_KEY = 'theme';

// ---------- LANGUAGE / I18N ----------
const LANG_KEY = 'lang';
const I18N_PATH = 'json/i18n.json';

// ---------- STORAGE LAYER (COOKIE + perfil) ----------
// Dados ficam em COOKIES (LGPD: dados informados a mim ficam só no navegador do
// usuário). Cookies têm limite ~4KB; por isso os valores são comprimidos
// (deflate-raw via CompressionStream) e particionados em N cookies quando
// necessário. Cada perfil nomeado tem suas próprias chaves (prefixo 'p_<nome>_').

const PROFILE_KEY = 'active_profile';
const PROFILES_KEY = 'profiles';
const CONSENT_KEY = 'consent';
const COOKIE_PREFIX = 'interviewops_';
const COOKIE_DAYS = 365;
const COOKIE_MAX_CHARS = 3500;
// Chaves que NÃO são por-perfil (preferências e configuração).
const GLOBAL_KEYS = new Set(['lang', 'theme', 'active_profile', 'profiles', 'consent']);
// Chaves não-essenciais: só persistem após consentimento 'accepted'.
const ESSENTIAL_KEYS = new Set(['lang', 'theme', 'active_profile', 'profiles', 'consent']);

let STORE_CACHE = {};

function slugify(str) {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
}

function effectiveKey(key) {
    if (GLOBAL_KEYS.has(key)) return key;
    const profile = STORE_CACHE[PROFILE_KEY] || '';
    return profile ? 'p_' + slugify(profile) + '_' + key : key;
}

function consentState() {
    return STORE_CACHE[CONSENT_KEY] || 'pending';
}

function canStore(key) {
    return ESSENTIAL_KEYS.has(key) || consentState() === 'accepted';
}

// ---- compressão (async, com fallback) ----
async function _deflate(text) {
    if (typeof CompressionStream === 'undefined') return { z: false, data: text };
    try {
        const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        const buf = await new Response(stream).arrayBuffer();
        const u8 = new Uint8Array(buf);
        let bin = '';
        for (const b of u8) bin += String.fromCharCode(b);
        const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return b64.length < text.length ? { z: true, data: b64 } : { z: false, data: text };
    } catch (e) {
        return { z: false, data: text };
    }
}

async function _inflate(payload) {
    if (typeof DecompressionStream === 'undefined') return payload;
    if (typeof payload !== 'string' || !payload.startsWith('z1:')) return payload;
    try {
        const b64 = payload.slice(3).replace(/-/g, '+').replace(/_/g, '/');
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return await new Response(stream).text();
    } catch (e) {
        return payload;
    }
}

function _setRawCookie(name, value) {
    const enc = encodeURIComponent(value);
    const parts = enc.match(new RegExp('[\\s\\S]{1,' + COOKIE_MAX_CHARS + '}', 'g')) || [];
    if (parts.length === 1) {
        document.cookie = `${name}=${parts[0]}; path=/; max-age=${COOKIE_DAYS * 86400}; SameSite=Lax`;
        return;
    }
    document.cookie = `${name}=N; path=/; max-age=${COOKIE_DAYS * 86400}; SameSite=Lax`;
    for (let i = 0; i < parts.length; i++) {
        document.cookie = `${name}_${i}=${parts[i]}; path=/; max-age=${COOKIE_DAYS * 86400}; SameSite=Lax`;
    }
}

function _getRawCookie(name) {
    const map = {};
    document.cookie.split(';').forEach(c => {
        const i = c.indexOf('=');
        if (i < 0) return;
        map[c.slice(0, i).trim()] = c.slice(i + 1);
    });
    const main = map[name];
    if (main && main !== 'N') return decodeURIComponent(main);
    const keys = Object.keys(map).filter(k => k.startsWith(name + '_'));
    if (!keys.length) return null;
    const sorted = keys.map(k => parseInt(k.slice(name.length + 1), 10)).sort((a, b) => a - b);
    const joined = sorted.map(i => map[`${name}_${i}`]).join('');
    return joined ? decodeURIComponent(joined) : null;
}

function _deleteCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    for (let i = 0; i < 20; i++) {
        document.cookie = `${name}_${i}=; path=/; max-age=0; SameSite=Lax`;
    }
}

async function _writeCookieAsync(effKey, value) {
    const serialized = JSON.stringify(value);
    const { z, data } = await _deflate(serialized);
    _setRawCookie(COOKIE_PREFIX + effKey, (z ? 'z1:' : '') + data);
}

async function _readCookieAsync(effKey) {
    const raw = _getRawCookie(COOKIE_PREFIX + effKey);
    if (raw === null || raw === undefined) return null;
    const inflated = await _inflate(raw);
    try {
        return JSON.parse(inflated);
    } catch (e) {
        return inflated;
    }
}

// API síncrona: leitura do cache (populado por initStorage), escrita em cache +
// gravação assíncrona do cookie.
function storeGet(key) {
    const effKey = effectiveKey(key);
    if (STORE_CACHE.hasOwnProperty(effKey)) return STORE_CACHE[effKey];
    // Fallback: lê o cookie sincronamente (funciona para valores não comprimidos,
    // que são a maioria). Valores 'z1:' só completam após initStorage().
    try {
        const raw = _getRawCookie(COOKIE_PREFIX + effKey);
        if (raw === null || raw === undefined || raw.startsWith('z1:')) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function storeSet(key, value) {
    const effKey = effectiveKey(key);
    STORE_CACHE[effKey] = value; // sempre mantém em memória durante a sessão
    if (!canStore(key)) return;  // sem consentimento: não persiste em cookie
    _writeCookieAsync(effKey, value).catch(() => {});
}

function storeRemove(key) {
    const effKey = effectiveKey(key);
    delete STORE_CACHE[effKey];
    _deleteCookie(COOKIE_PREFIX + effKey);
}

async function initStorage() {
    const allNames = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => n.startsWith(COOKIE_PREFIX));
    const baseNames = [...new Set(allNames.map(n => n.replace(/_\d+$/, '')))];
    const tasks = baseNames.map(name => {
        const effKey = name.slice(COOKIE_PREFIX.length);
        return _readCookieAsync(effKey).then(v => [effKey, v]);
    });
    const results = await Promise.all(tasks);
    results.forEach(([effKey, v]) => {
        if (v !== null && v !== undefined) STORE_CACHE[effKey] = v;
    });
    return STORE_CACHE;
}

window.storeGet = storeGet;
window.storeSet = storeSet;
window.storeRemove = storeRemove;
window.initStorage = initStorage;

// ---------- PERFIS ----------
function getActiveProfile() {
    return storeGet(PROFILE_KEY) || '';
}

function getProfiles() {
    const list = storeGet(PROFILES_KEY);
    return Array.isArray(list) ? list : [];
}

function setActiveProfile(name) {
    const slug = slugify(name);
    if (!slug) return;
    storeSet(PROFILE_KEY, name);
    const list = getProfiles();
    if (!list.includes(name)) {
        list.push(name);
        storeSet(PROFILES_KEY, list);
    }
}

window.getActiveProfile = getActiveProfile;
window.getProfiles = getProfiles;
window.setActiveProfile = setActiveProfile;

// ---------- IDIOMA FIXO EM PT-BR (Inglês apenas no módulo/questões de inglês) ----------
const ENGLISH_CATEGORIES = ['English', 'english'];
let I18N = { lang: {} };
const CURRENT_LANG = 'pt-br';

// Resolve o idioma para questões/conteúdo (inglês apenas para categoria English).
function resolveLang(category) {
    if (category && ENGLISH_CATEGORIES.includes(category)) return 'en-us';
    return 'pt-br';
}

// Resolve o conteúdo traduzido de um objeto.
function l(obj, category) {
    if (!obj) return '';
    const lang = resolveLang(category);
    if (obj[lang]) return obj[lang];
    if (obj['pt-br']) return obj['pt-br'];
    return obj['en-us'] || '';
}

// Tradução de strings de interface (fixo em pt-br).
function t(key) {
    const table = (I18N.lang && I18N.lang['pt-br']) || {};
    return table[key] || key;
}

async function initI18n() {
    try {
        I18N = await loadJSON(I18N_PATH);
    } catch (e) {
        I18N = { lang: {} };
    }
    applyTranslations();
}

// Aplica traduções a elementos com data-i18n.
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = val;
        } else if (el.childElementCount > 0) {
            const nodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
            if (nodes.length) { nodes[0].textContent = ' ' + val; }
        } else {
            el.textContent = val;
        }
        if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val);
    });
}

window.t = t;
window.l = l;
window.resolveLang = resolveLang;
window.translateContent = null;

// ---------- PERFIL (seletor na topbar) ----------
function renderProfileSelector() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('profile-select')) return;
    const current = getActiveProfile();
    const profiles = getProfiles();
    const wrap = document.createElement('div');
    wrap.className = 'profile-select-wrap';
    wrap.style.cssText = 'display:flex; align-items:center; gap:0.4rem; position:relative;';
    wrap.innerHTML = `
        <i class="fa-solid fa-user" style="color:var(--text-muted); font-size:0.9rem;" aria-hidden="true"></i>
        <select id="profile-select" aria-label="Perfil" style="background:var(--card-bg); color:var(--text-color); border:1px solid var(--card-border); border-radius:8px; padding:0.3rem 0.5rem; font-size:0.85rem; cursor:pointer;">
            <option value="">${t('profile_default')}</option>
            ${profiles.map(p => `<option value="${escapeHtml(p)}" ${p === current ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
            <option value="__new">${t('profile_new')}</option>
        </select>
    `;
    actions.insertBefore(wrap, actions.firstChild);

    const select = document.getElementById('profile-select');
    select.addEventListener('change', () => {
        const val = select.value;
        if (!val) {
            storeSet(PROFILE_KEY, '');
            select.value = '';
            location.reload();
            return;
        }
        if (val === '__new') {
            const name = prompt(t('profile_prompt') || 'Nome do novo perfil:', '');
            const trimmed = String(name || '').trim();
            if (!trimmed) {
                select.value = current || '';
                return;
            }
            setActiveProfile(trimmed);
            location.reload();
            return;
        }
        if (val !== current) {
            setActiveProfile(val);
            location.reload();
        }
    });
}

// ---------- CONSENTIMENTO LGPD ----------
function initConsentBanner() {
    if (consentState() !== 'pending') return;
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de privacidade');
    banner.style.cssText = 'position:fixed; bottom:0; left:0; right:0; z-index:9999; background:var(--card-bg); color:var(--text-color); border-top:2px solid var(--accent); box-shadow:0 -4px 20px rgba(0,0,0,0.2); padding:1rem 1.25rem; display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center; justify-content:space-between; font-size:0.9rem;';
    banner.innerHTML = `
        <div style="flex:1; min-width:240px;">
            ${t('consent_text')}
            <a id="consent-privacy-link" href="privacidade/index.html" style="color:var(--accent); text-decoration:underline;">${t('consent_link')}</a>
        </div>
        <div style="display:flex; gap:0.5rem; flex-shrink:0;">
            <button id="consent-accept" style="background:var(--accent); color:#fff; border:none; border-radius:8px; padding:0.5rem 1rem; cursor:pointer; font-weight:600;">${t('consent_accept')}</button>
            <button id="consent-decline" style="background:transparent; color:var(--text-color); border:1px solid var(--card-border); border-radius:8px; padding:0.5rem 1rem; cursor:pointer;">${t('consent_decline')}</button>
        </div>
    `;
    document.body.appendChild(banner);

    const privacyHref = location.pathname.includes('/modules/') || location.pathname.includes('/mock/') ||
        location.pathname.includes('/roadmap/') || location.pathname.includes('/dashboard/') ||
        location.pathname.includes('/career/') || location.pathname.includes('/english/') ||
        location.pathname.includes('/tracker/')
        ? '../privacidade/index.html' : 'privacidade/index.html';
    banner.querySelector('#consent-privacy-link').setAttribute('href', privacyHref);

    document.getElementById('consent-accept').addEventListener('click', () => {
        storeSet(CONSENT_KEY, 'accepted');
        banner.remove();
    });
    document.getElementById('consent-decline').addEventListener('click', () => {
        storeSet(CONSENT_KEY, 'rejected');
        banner.remove();
    });
}
window.setLang = setLang;
window.getSavedLang = getSavedLang;

// ---------- THEME MANAGEMENT ----------

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const currentTheme = storeGet(THEME_KEY) || 'light';
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
            storeSet(THEME_KEY, 'light');
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            storeSet(THEME_KEY, 'dark');
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
            'mock': 'mock_interview', 'career': 'career_engine',
            'english': 'english', 'tracker': 'gaps', 'roadmap': 'roadmap'
        };
        if (pageKey && map[pageKey]) {
            link.setAttribute('data-i18n', map[pageKey]);
        }
    });
}

// ---------- PROGRESS TRACKING ----------
const PROGRESS_KEY = 'progress';
const STREAK_KEY = 'streak';

function getProgressData() {
    try {
        const raw = storeGet(PROGRESS_KEY);
        return raw || {};
    } catch (e) {
        return {};
    }
}

function saveProgressData(data) {
    storeSet(PROGRESS_KEY, data);
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
        data = storeGet(STREAK_KEY) || {};
    } catch (e) { data = {}; }

    if (data.last === today) {
        return data.count || 1;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let count = 1;
    if (data.last === yesterday) {
        count = (data.count || 0) + 1;
    }
    storeSet(STREAK_KEY, { last: today, count });
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
document.addEventListener('DOMContentLoaded', async () => {
    await initStorage();
    initTheme();
    initNav();
    await initI18n();
    renderProfileSelector();
    initConsentBanner();
});
