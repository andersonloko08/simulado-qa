# InterviewOps Portugal

## The Ultimate Interview Preparation Platform for QA Automation Engineers

| | |
|---|---|
| **Versão** | 3.1 |
| **Autor** | Anderson Vinicius dos Santos Pereira |
| **Repositório** | https://github.com/andersonloko08/simulado-qa |
| **Live Site** | https://andersonloko08.github.io/simulado-qa |
| **Conecte-se** | https://www.linkedin.com/in/anderson-v-pereira |

---

## 🎯 Visão do Projeto

InterviewOps Portugal é uma plataforma de engenharia projetada para transformar anos de experiência profissional em prontidão para entrevistas.

Em vez de estudar tecnologias isoladamente, a plataforma ensina o candidato a conectar:

- Conhecimento técnico
- Experiência profissional real
- Contexto de negócio
- Comunicação em Português e Inglês
- Resolução de problemas
- Confiança

A plataforma foi construída com assistência de IA (vibe coding) e integralmente revisada, validada e dirigida por um profissional de QA. Todo o conteúdo gerado por IA é claramente sinalizado na interface.

---

## 🏛 Arquitetura do Projeto

```
InterviewOps/
├── index.html              # Home / Landing
├── dashboard/              # Dashboard (progresso, pontos fortes/fracos, streak)
├── modules/                # Módulos técnicos (17 módulos, ex.: AI, API, SQL, Robot, Playwright...)
├── career/                 # Career Engine + Story Analyzer + Evidence Bank
│   ├── index.html          #   Career Engine (seleção de história/contexto)
│   ├── analyzer.html       #   Story Analyzer (análise de histórico em linguagem natural)
│   └── stories.html        #   Evidence Bank (12 histórias reais em formato STAR)
├── english/                # Módulo de Inglês para entrevistas
├── mock/                   # Mock Interview Engine (simulador de entrevista)
├── tracker/                # Gap Tracker e Progress Tracking
├── roadmap/                # Roadmap de estudos (revisão espaçada)
├── privacidade/            # Política de Privacidade & LGPD
├── json/                   # Banco de dados (modules, questions, stories, i18n)
│   ├── modules.json        #   Índice dos 17 módulos
│   ├── modules/*.json      #   Conteúdo de cada módulo (conceitos + questões)
│   ├── questions.json      #   402 questões em 4 idiomas
│   ├── stories.json        #   Evidence Bank (12 histórias STAR)
│   └── i18n.json           #   Chaves de tradução da interface
├── css/                    # Design system compartilhado
├── javascript/             # Lógica compartilhada (app.js: cookies, i18n, tema, progresso, perfis)
├── I18N.md                 # Guia de Internacionalização
└── tools/qa_editor/        # Editor Python de questões multi-idioma (API/CLI/GUI/Web)
```

---

## 🧠 Conteúdo

### 17 Módulos Técnicos

| Módulo | ID | Questões | Duração |
|--------|-----|----------|---------|
| IA para QA & Vibe Coding | ai | 18 | 2-3 semanas |
| API (REST/HTTP) | api | 14 | 2-3 semanas |
| SQL & Bancos de Dados | sql | 14 | 2-3 semanas |
| Python | python | 12 | 2 semanas |
| JavaScript | javascript | 12 | 2 semanas |
| Robot Framework | robot | 14 | 3 semanas |
| Playwright | playwright | 12 | 2-3 semanas |
| Git | git | 10 | 1 semana |
| CI/CD | cicd | 12 | 2 semanas |
| Docker | docker | 10 | 1-2 semanas |
| Kubernetes | kubernetes | 10 | 2 semanas |
| SAP | sap | 12 | 2 semanas |
| Agile & Scrum | agile | 10 | 1 semana |
| BDD | bdd | 10 | 1-2 semanas |
| Testing & Automação | testing | 12 | 1-2 semanas |
| Security Testing | security | 12 | 2 semanas |
| Performance Testing | performance | 12 | 2 semanas |

### Banco de Questões

- **402 questões** em 4 idiomas (pt-br, pt-pt, en-us, en-uk), com 360 de múltipla escolha e 42 abertas.
- Categorias: AI, API, SQL, Git, CI/CD, Docker, Kubernetes, Playwright, Python, Robot Framework, SAP, Agile, BDD, Testing, Security, Performance, JavaScript, English, HR, Leadership, Architecture, Banking, Insurance, Behavior, Technical.
- Cada questão inclui: enunciado, resposta esperada, exemplo real, follow-ups, erros comuns e (na categoria English) versão em inglês.

### Career Engine & Story Analyzer

- **Story Analyzer** (`career/analyzer.html`): analisa um relato do usuário em linguagem natural, detecta o tema (19 temas de QA), separa em Situation/Task/Action/Result (STAR) e estima o impacto da história. Usa matching por palavra inteira para evitar falsos positivos.
- **Evidence Bank** (`career/stories.html`): 12 histórias reais em formato STAR com contexto de negócio, lições aprendidas e possíveis perguntas de entrevista.

### 🚀 Tutorial Guiado (Onboarding)

- **5 passos** com efeito spotlight (driver.js) que guiam o visitante pela Home: boas-vindas, navegação, CTAs de entrevista e Story Analyzer.
- **Raramente visto**: "Pular tutorial" e botão "X" (fechar) sempre visíveis em todas as etapas.
- **Não repete**: ao concluir ou pular, grava `hasSeenTutorial=true` (cookie LGPD) e nunca mais abre sozinho.
- **Replay**: botão "?" no topo direito reativa o tour manualmente.

### 🌐 QA Outdoor (painel giratório)

- Outdoor de **10 frases** rotativas na Home: **curiosidades** históricas de QA/tecnologia (Grace Hopper, Ariane 5, Ada Lovelace), **motivações** e **dicas** de entrevista (STAR, storytelling).
- Tag colorida por tipo (CURIOSIDADE / MOTIVAÇÃO / DICA), fade animado, indicadores clicáveis e pausa no hover.

### 🎨 Ícones Animados dos Módulos

- **8 GIFs animados** e **9 PNGs estáticos** substituíram os ícones Font Awesome dos 17 módulos, com suporte a fallback via helper `moduleIconHtml()` direto no `app.js`.

---

## 🌍 Multi-idioma

- **Interface**: fixa em Português (BR), com sistema de tradução via `data-i18n` pronto para novos idiomas.
- **Conteúdo**: questões e módulos são armazenados em **4 idiomas** (pt-br, pt-pt, en-us, en-uk).
- **Resolução automática**: conteúdo de categoria English é exibido em inglês; demais em pt-br.
- Para entender a arquitetura e como adicionar idiomas, consulte **[I18N.md](I18N.md)**.

---

## 🍪 Armazenamento em Cookie & Privacidade (LGPD)

- **Sem Backend**: Todo o estado de progresso é mantido no próprio navegador.
- **Cookies com Compressão**: Os dados são comprimidos com a API nativa `CompressionStream` (`deflate-raw`) e codificados em Base64 URL-safe.
- **Particionamento Automático**: Para evitar o limite de ~4KB por cookie, payloads grandes são particionados automaticamente em múltiplos cookies (`interviewops_progress_0`, `interviewops_progress_1`, etc.).
- **Perfis Nomeados**: É possível criar múltiplos perfis para manter pontuações e progressos separados no mesmo navegador.
- **Conformidade LGPD**: Banner de consentimento com opções "Aceitar" / "Recusar" e página dedicada de **Política de Privacidade** em `/privacidade/index.html`.

---

## 🚀 Como Executar Localmente

Como a aplicação é um SPA estático em HTML5/JS (compatível com **GitHub Pages**):

```bash
# Clone o repositório
git clone https://github.com/andersonloko08/simulado-qa.git
cd simulado-qa

# Inicie um servidor estático simples
python -m http.server 8000
```

Acesse em seu navegador: `http://localhost:8000`.

---

## 🛠 QA Editor (Python)

`tools/qa_editor/` é uma ferramenta reutilizável para gerenciar o banco de questões multi-idioma:

```bash
cd tools/qa_editor
python qa_gui.py                 # Interface gráfica (Tkinter)
python qa_web.py --port 8001     # Admin web + API JSON (http://localhost:8001/admin)
python qa_cli.py list --category SQL
python qa_cli.py add             # Nova questão
python qa_cli.py validate        # Valida o banco inteiro
python qa_cli.py stats           # Estatísticas por categoria/idioma
python qa_cli.py export          # Gera artefatos para o front (json/export/)
```

Veja a documentação completa em **[tools/qa_editor/README.md](tools/qa_editor/README.md)**.

---

## ✅ Como Construído (Transparência de IA)

Este projeto foi desenvolvido com assistência de IA (vibe coding) e integralmente revisado por um profissional de QA. As premissas:

- O humano define o que construir, valida a qualidade e toma todas as decisões de arquitetura e design.
- A IA acelera geração de conteúdo, automação de tarefas repetitivas e revisão de código.
- Todo conteúdo de autoria IA é sinalizado na interface (transparência).
