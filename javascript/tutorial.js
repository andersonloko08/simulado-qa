// ============================================
// INTERVIEWOPS PORTUGAL — TUTORIAL GUIADO (ONBOARDING)
// ============================================
//
// Tour de primeiro acesso com efeito Spotlight usando driver.js (CDN).
// - 5 passos, apenas na página Home.
// - Botão "Pular tutorial" e "X" (fechar) sempre visíveis em TODAS as etapas.
// - Ao pular OU concluir, grava hasSeenTutorial=true via storeSet (cookie da
//   camada LGPD do projeto) para NÃO reabrir sozinho nas próximas visitas.
// - Botão "?" na topbar reativa o tour manualmente (replay).
//
// Dependências:
//   driver.js v1.3.1 (CDN) carregado no index.html + app.js (storeGet/storeSet).
// Uso:
//   window.startTutorial()   // inicia (ou reinicia) o tour

const TUTORIAL_KEY = 'hasSeenTutorial';
let tutorialDriver = null;

// Retorna true se o driver.js já carregou (CDN assíncrona).
function tutorialLibReady() {
    return !!(window.driver && window.driver.js && window.driver.js.driver);
}

// Marca que o usuário já viu/pulou o tutorial (persiste em cookie).
function markTutorialSeen() {
    try {
        storeSet(TUTORIAL_KEY, true);
    } catch (e) {
        // camada de storage indisponível: segue sem persistir
    }
}

// Injeta o botão "Pular tutorial" no rodapé de cada popover (sempre visível).
function injectSkipButton(popover) {
    if (!popover || !popover.footer) return;
    if (popover.footer.querySelector('.tour-skip-btn')) return;
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'tour-skip-btn';
    skip.textContent = 'Pular tutorial';
    skip.setAttribute('aria-label', 'Pular o tutorial');
    skip.addEventListener('click', () => {
        if (tutorialDriver) tutorialDriver.destroy(); // dispara onDestroyed
    });
    popover.footer.insertBefore(skip, popover.footer.firstChild);
}

// Passos do tour (seletores reais da página Home).
function buildTutorialSteps() {
    return [
        // Passo 1 — Boas-vindas (popover centralizado, sem elemento alvo)
        {
            popover: {
                title: 'Bem-vindo ao Simulado QA! 🚀',
                description:
                    'A sua academia definitiva para decolar na carreira de Qualidade de Software. ' +
                    'Aqui você vai de fundamentos básicos até Engenharia de IA, Vibe Coding e Testes de ' +
                    'API, preparando-se para as entrevistas mais difíceis do mercado.',
            },
        },
        // Passo 2 — Módulos de Estudo (navegação)
        {
            element: '.main-nav',
            popover: {
                title: 'Escolha sua Batalha ⚔️',
                description:
                    'Temos trilhas que vão do Básico ao Avançado. Cada módulo é uma jornada completa: ' +
                    'começa na teoria, passa por erros comuns, projetos reais e termina em testes finais.',
                side: 'bottom',
            },
        },
        // Passo 3 — Questões de Entrevista (CTAs do hero: Mock + Story Analyzer)
        {
            element: '.hero-cta',
            popover: {
                title: 'O Jogo do Mercado 🎯',
                description:
                    'Aprender a ferramenta é só metade do caminho. Nosso sistema traz perguntas reais de ' +
                    'entrevista para você saber exatamente o que os recrutadores querem ouvir e como ' +
                    'aprofundar seu conhecimento.',
                side: 'bottom',
            },
        },
        // Passo 4 — Analisador STAR (seção Story Analyzer)
        {
            element: '#story-analyzer',
            popover: {
                title: 'O Analisador Implacável 🤖',
                description:
                    'Onde a mágica acontece. Escreva suas respostas e nosso algoritmo vai medir o impacto ' +
                    'técnico da sua fala usando a estrutura STAR (Situação, Tarefa, Ação e Resultado). ' +
                    'Passe por ele, e você passa em qualquer entrevista.',
                side: 'top',
            },
        },
        // Passo 5 — Conclusão (popover centralizado)
        {
            popover: {
                title: 'Tudo pronto! 🏁',
                description:
                    'Você está no controle. Explore os módulos, teste seus conhecimentos e prepare-se para ' +
                    'o próximo nível na sua carreira.',
            },
        },
    ];
}

// Inicia (ou reinicia) o tour.
function startTutorial() {
    if (!tutorialLibReady()) return;
    if (tutorialDriver && tutorialDriver.isActive && tutorialDriver.isActive()) {
        tutorialDriver.destroy();
    }
    tutorialDriver = window.driver.js.driver({
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        smoothScroll: true,
        showProgress: true,
        progressText: '{current} / {total}',
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Próximo',
        prevBtnText: 'Anterior',
        doneBtnText: 'Explorar a Plataforma',
        onPopoverRender: (popover) => injectSkipButton(popover),
        onDestroyed: () => markTutorialSeen(),
        steps: buildTutorialSteps(),
    });
    tutorialDriver.drive();
}

// Dispara o tour automaticamente na Home apenas se ainda não foi visto/pulado.
function maybeAutoStartTutorial() {
    if (!tutorialLibReady()) return;
    const isHome = document.body && document.body.getAttribute('data-page') === 'home';
    if (!isHome) return;
    let seen = false;
    try {
        seen = !!storeGet(TUTORIAL_KEY);
    } catch (e) {
        seen = false;
    }
    if (seen) return;
    // pequeno atraso para layout/popover se estabilizarem
    setTimeout(() => startTutorial(), 600);
}

// Expõe para uso via onclick no botão "?" da topbar.
window.startTutorial = startTutorial;

// Inicialização: aguarda DOM + storage, então decide o auto-start.
document.addEventListener('DOMContentLoaded', async () => {
    // aguarda a camada de storage do app.js carregar (cookies do projeto)
    if (typeof initStorage === 'function') {
        try {
            await initStorage();
        } catch (e) {
            // segue mesmo se falhar
        }
    }
    const toggle = document.getElementById('tutorial-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => startTutorial());
    }
    maybeAutoStartTutorial();
});
