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
        kind: 'curiosidade',
        text: 'O primeiro vírus de computador, chamado Creeper, foi criado em 1971 como um experimento. O primeiro antivírus, Reaper, nasceu logo depois para caçá-lo.',
    },
    {
        kind: 'curiosidade',
        text: 'O bug Y2K mobilizou equipes no mundo todo: sistemas que guardavam anos com 2 dígitos podiam voltar a 1900 na virada de 1999.',
    },
    {
        kind: 'curiosidade',
        text: 'Em 2017, o ransomware WannaCry paralisou hospitais e empresas em 150 países, explorando uma falha que já tinha correção disponível — mas ninguém tinha aplicado.',
    },
    {
        kind: 'curiosidade',
        text: 'A Receita Federal já emite CNPJ com letras e números. Sistemas de validação antigos que só aceitam dígitos vão quebrar — e QA é quem vai descobrir primeiro.',
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
        kind: 'motivacao',
        text: 'Cada teste que falha agora é uma resposta de entrevista que não vai falhar depois.',
    },
    {
        kind: 'motivacao',
        text: 'Testar não é destruir o produto. É garantir que ele não se destrua sozinho em produção.',
    },
    {
        kind: 'dica',
        text: 'Use a técnica STAR: Situação, Tarefa, Ação e Resultado. Recrutadores lembram de histórias, não de adjetivos.',
    },
    {
        kind: 'dica',
        text: 'Se você não explica um bug em uma frase, você ainda não o entendeu — e isso aparece na entrevista.',
    },
    {
        kind: 'dica',
        text: 'Mock interviews com timer treinam exatamente o que a entrevista real vai exigir: pensar rápido e estruturado sob pressão.',
    },
    {
        kind: 'dica',
        text: 'Perguntaram "como você testaria isso?" — comece SEMPRE pelos cenários de borda. É onde os bugs caros moram.',
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
