// ============================================
// INTERVIEWOPS PORTUGAL — QA OUTDOOR (HOME)
// ============================================
//
// Outdoor de frases na Home: um "painel" que roda mensagens motivacionais,
// dicas de entrevista e curiosidades de QA/tecnologia, trocando a cada 6s.
// - Tags coloridas por tipo (CURIOSIDADE / MOTIVAÇÃO / DICA).
// - Contador de progresso, indicadores clicáveis e pausa no hover.
// - Acessível: aria-live="polite" no texto rotativo.

const OUTDOOR_MSGS = [
    {
        kind: 'curiosidade',
        text: 'Em 1947, Grace Hopper encontrou uma mariposa presa no computador Harvard Mark II — e o termo "bug" entrou de vez para a história.',
    },
    {
        kind: 'curiosidade',
        text: 'Em 1996, um overflow de conversão float→int derrubou o foguete Ariane 5 em 37 segundos. O preço do "bug": US$ 370 milhões.',
    },
    {
        kind: 'curiosidade',
        text: 'Ada Lovelace escreveu em 1843 o primeiro algoritmo pensado para uma máquina — décadas antes de o primeiro computador existir.',
    },
    {
        kind: 'curiosidade',
        text: 'Em 1962, um hífen perdido no código de guiagem fez a sonda Mariner 1 se perder no oceano. Um caractere custou US$ 18,5 milhões.',
    },
    {
        kind: 'curiosidade',
        text: 'Bugs de software custam à economia global mais de US$ 2 trilhões por ano. O teste é o freio mais barato desse custo.',
    },
    {
        kind: 'motivacao',
        text: 'Não memorize respostas: construa evidências, conte histórias, demonstre engenharia e inspire confiança.',
    },
    {
        kind: 'motivacao',
        text: 'QA não é achar defeito nos outros. É garantir que ninguém encontre o seu bug primeiro — nem o cliente.',
    },
    {
        kind: 'motivacao',
        text: 'O melhor bug é o que você encontra em staging, não o que o usuário encontra em produção.',
    },
    {
        kind: 'dica',
        text: 'Use a técnica STAR: Situação, Tarefa, Ação e Resultado. Recrutadores lembram de histórias, não de adjetivos.',
    },
    {
        kind: 'dica',
        text: 'Se você não explica um bug em uma frase, você ainda não o entendeu — e isso aparece na entrevista.',
    },
];

const OUTDOOR_INTERVAL_MS = 6000;

const OUTDOOR_KIND_LABEL = {
    curiosidade: 'CURIOSIDADE',
    motivacao: 'MOTIVAÇÃO',
    dica: 'DICA',
};

let outdoorCurrent = 0;
let outdoorTimer = null;
let outdoorElements = null;

function outdoorGrabElements() {
    return {
        screen: document.getElementById('qa-outdoor-screen'),
        text: document.getElementById('qa-outdoor-text'),
        kind: document.getElementById('qa-outdoor-kind'),
        count: document.getElementById('qa-outdoor-count'),
        dots: document.getElementById('qa-outdoor-dots'),
    };
}

function outdoorRender(i) {
    const msg = OUTDOOR_MSGS[i];
    outdoorElements.screen.dataset.kind = msg.kind;
    outdoorElements.text.textContent = msg.text;
    outdoorElements.kind.textContent = OUTDOOR_KIND_LABEL[msg.kind] || '';
    outdoorElements.count.textContent = `${i + 1} / ${OUTDOOR_MSGS.length}`;
    const dots = outdoorElements.dots.querySelectorAll('.qa-outdoor-dot');
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
}

function outdoorShow(i) {
    outdoorCurrent = (i + OUTDOOR_MSGS.length) % OUTDOOR_MSGS.length;
    outdoorElements.screen.classList.remove('is-fading');
    void outdoorElements.screen.offsetWidth; // reinicia a animação de fade
    outdoorRender(outdoorCurrent);
    outdoorElements.screen.classList.add('is-fading');
}

function outdoorNext() {
    outdoorShow(outdoorCurrent + 1);
}

function outdoorStartTimer() {
    outdoorStopTimer();
    outdoorTimer = setInterval(outdoorNext, OUTDOOR_INTERVAL_MS);
}

function outdoorStopTimer() {
    if (outdoorTimer) {
        clearInterval(outdoorTimer);
        outdoorTimer = null;
    }
}

function outdoorBuildDots() {
    outdoorElements.dots.innerHTML = '';
    OUTDOOR_MSGS.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'qa-outdoor-dot';
        dot.setAttribute('aria-label', `Ver mensagem ${i + 1}`);
        dot.addEventListener('click', () => {
            outdoorShow(i);
            outdoorStartTimer();
        });
        outdoorElements.dots.appendChild(dot);
    });
}

function initQaOutdoor() {
    outdoorElements = outdoorGrabElements();
    if (!outdoorElements.screen || !outdoorElements.dots) return;
    outdoorBuildDots();
    outdoorShow(0);
    outdoorStartTimer();
    const frame = document.querySelector('.qa-outdoor-frame');
    if (frame) {
        frame.addEventListener('mouseenter', outdoorStopTimer);
        frame.addEventListener('mouseleave', outdoorStartTimer);
    }
}

document.addEventListener('DOMContentLoaded', initQaOutdoor);
