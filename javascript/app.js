// ============================================
// INTERVIEWOPS PORTUGAL — SHARED LOGIC
// ============================================

// ---------- THEME MANAGEMENT ----------
const THEME_KEY = 'interviewops_theme';

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
});
