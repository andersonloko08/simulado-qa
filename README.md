# InterviewOps Portugal

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?logo=github)](https://andersonloko08.github.io/simulado-qa/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)

> **The Ultimate Interview Preparation Platform for QA Automation Engineers.**
>
> Practice realistic interviews, improve technical skills, master the STAR method, and simulate real hiring processes — all in your browser.

![Demo](docs/demo.gif)

| | |
|---|---|
| **Versão** | 3.1 |
| **Autor** | Anderson Vinicius dos Santos Pereira |
| **Repositório** | https://github.com/andersonloko08/simulado-qa |
| **Live Site** | https://andersonloko08.github.io/simulado-qa |
| **Conecte-se** | https://www.linkedin.com/in/anderson-v-pereira |

---

## 🎯 Visão do Projeto

InterviewOps Portugal é uma **plataforma de engenharia de entrevista** — não apenas um simulador. Ela conecta conhecimento técnico, experiência profissional real, contexto de negócio e comunicação bilíngue em um único ecossistema de preparação para entrevistas.

**Para quem é isto?** Profissionais e aspirantes a QA Automation Engineers, SDETs e testadores que querem chegar prontos para entrevistas técnicas e comportamentais — com evidências, histórias e confiança.

**Por que existe?** A maioria dos candidatos falha não por falta de conhecimento, mas por não saber **contar** o que sabe. O InterviewOps força a estrutura narrativa em cada resposta.

A plataforma foi construída com assistência de IA (vibe coding) e integralmente revisada, validada e dirigida por um profissional de QA. Todo o conteúdo gerado por IA é claramente sinalizado na interface.

---

## 🏛 Arquitetura do Projeto

### Fluxo de Funcionamento

```text
Usuário visita Home
|
├── Tutorial Guiado (primeiro acesso)
├── QA Outdoor (frases rotativas)
|
├→ Módulos Técnicos (17 módulos)
|   ├── Conteína: conceitos, exemplos, erros comuns, desafios
|   └── Quiz: múltipla escolha, rodadas, best-score
|
├→ Mock Interview
|   ├── Configurar categoria/dificuldade/tempo
|   ├── Praticar respondendo em voz alta
|   └── Revele respostas, marque dificuldades
|
├→ Career Engine
|   ├── Story Builder: method STAB
|   ├── Story Analyzer: análise de texto real
|   └── Evidence Bank: 12 histórias reais STAR
|
├→ Dashboard
|   ├── Overall progress (weighted 60% theory + 40% quiz)
|   ├── Strengths & Weaknesses
|   ├── Study streak
|   └── Recommended module
|
├→ Gap Tracker
|   └── Distância até 80% de cobertura por módulo
|
├→ Roadmap
|   ├── 5 fases de 2semanas cada (spaced repetition)
|   └── Motor de revisão diária baseada em fraquezas
|
└── English Module
    ├── Vocabulário, apresentação, RH, Técnico
    ├── Motor fonético embutido
    └── Web Speech API para pronúncia
```

### Organização de Pastas (Responsabilidades)

```
InterviewOps/
├── index.html              # Home / Landing — página única com herói e barras
├── dashboard/              # Dashboard — progresso geral, streak, forças/fracas
│                           #   Apenas tela de visualização de métricas
├── modules/                # Módulos técnicos (17 trilhas interativas)
│   ├── index.html          #   Busca e grid de módulos com barras de progresso
│   └── module.html?id=     #   Página dinâmica de módulo (conceitos + quiz)
│                           #   Carrega dados via JSON (SPA sem recarregamento)
├── career/                 # Career Engine completo
│   ├── index.html          #   Story Builder e pensamento conceitual
│   ├── analyzer.html       #   Story Analyzer — análise 100% cliente (STAR)
│   └── stories.html        #   Evidence Bank — 12 histórias reais com lições
├── english/                # Módulo de Inglês (6 abas temáticas)
├── mock/                   # Mock Interview Engine (configurable timer + category)
├── tracker/                # Gap Tracker (progresso até 80% de tooverguem)
├── roadmap/                # Roadmap de estudos (5 fases, 10 semanas)
├── privacidade/            # Política de Privacidade & LGPD
├── json/                   # Banco de dados JSON (flat-file)
│   │                       #   modules.json — índice dos 17 módulos
│   │                       #   modules/*.json — conteúdo de cada módulo
│   │                       #   questions.json — 402 questões, 4 idiomas
│   │                       #   stories.json — Evidence Bank
│   │                       #   i18n.json — Tabela de tradução UI (pt/pt_br)
│   └── export/             # Artefatos de export do QA Editor (Python)
├── css/style.css           # ~1400 linhas — design system com CSS custom
│                           #   properties (tema claro/escuro, responsivo)
├── javascript/
│   ├── app.js              # Motor principal (500 linhas)
│   │                       #   storage, i18n, tema, progresso, streaks, perfil
│   │                       #   carregado em todas as páginas
│   ├── tutorial.js          # 5 etapas em tour guiado (driver.js)
│   └── qa_outdoor.js        # Billboard rotativa (18 frases)
├── icons/                  # 17 ícones animados (8 GIF) + 9 estáticos (PNG)
├── docs/
│   └── demo.gif             # Demonstração rápida para recrutadores
├── I18N.md                 # Guia completo de internacionalização
├── tools/qa_editor/        # Ferramenta Python (CLI/GUI/Web) para gerenciar questões
└── README.md               # Esta documentação
```

---

## 🛠 Decisões de Engenharia

### Por que HTML5 / CSS3 / JavaScript vanilla?

**Simplicidade e portabilidade.** Sem dependências externas de framework frontend (React, Vue, Angular). Cada página é auto-contida: o HTML fornece a estrutura, o CSS via propriedades custom fornece tema e layout, e o JavaScript é carregado sob demanda com `app.js` compartilhado. Menos dependências = menos manutenção e mais facilidade de contribuição.

### Por que GitHub Pages?

**Zero custo de infraestrutura.** O site inteiro é um SPA estático que o GitHub serve via Pages. Deploy = `git push`. Acesso global, sempre HTTPS, com cache CDN automático e integração nativa ao GitHub. Perfeito para portfolio.

### Por que sem Backend?

**Redução de complexidade.** Sem servidores, sem autenticação, sem banco de dados, sem custos de operação. Todo o estado do usuário é persistido em cookies (LGPD-compliant) e comprimido via API `CompressionStream`. Zero dados em servidores — o usuário controla tudo no navegador.

### Por que cookies com compressão?

**Performance e conformidade.** Os dados são comprimidos com deflate-raw e encoded Base64 URL-safe. Para payloads acima de ~4KB, eles são **particionados em múltiplos cookies** com flag `N` — garantindo máxima performance sem estourar o limite do browser. Perfis nomeados permitem múltiplos usuários compartilharem o mesmo navegador.

### Por que estrutura modular de dados?

**Separação de responsabilidade.** Modules.json é um índice leve; questions.json é um banco central; modules/{nome}.json carrega conteúdo específico. Cada página carrega apenas o JSON que precisa, reduzindo o tempo de carregamento inicial e permitindo paralelização de requests.

---

## 🧠 Conteúdo

### 17 Módulos Técnicos

| Módulo | ID | Questões | Duração |
|--------|-----|---------|---------|
| IA for QA & Vibe Coding | ai | 18 | 2-3 semanas |
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
- Cada questão inclui: enunciado, resposta esperada, exemplo real, follow-ups, erros comuns e (na categoria&) English versão em inglês.

### Career Engine & Story Analyzer

- **Story Analyzer** (`career/analyzer.html`): analisa um relato do usuário em linguagem natural, detecta o tema (19 temas de QA), separa em Situation/Task/Action/Result (STAR) e estima o impacto da história. Usa matching por palavra inteira para evitar falsos positivos.
- **Evidence Bank** (`career/stories.html`): 12 histórias reais em formato STAR com contexto de negócio, lições aprendidas e possíveis perguntas de entrevista.

### 🚀 Tutorial Guiado (Onboarding)

- **5 passos** com efeito spotlight (driver.js) que guiam o visitante pela Home: boas-vindas, navegação, CTAs de entrevista e Story Analyzer.
- **Raramente visto**: "Pular tutorial" e botão "X" (fechar) sempre visíveis em todas as etapas.
- **Não repete**: ao concluir ou pular, grava `hasSeenTutorial=true` (cookie LGPD) e nunca mais abre sozinho.
- **Replay**: botão "?" no topo direito reativa o tour manualmente.

### 🌐 QA Outdoor (painel giratório)

- Outdoor de **18 frases** rotativas na Home: **curiosidades** históricas de QA/tecnologia (Grace Hopper, Ariane 5, Ada YouRece, Mariner 1, Creeper, WannaCry, Y2K), **motivações** e **dicas** de entrevista (STAR, storytelling, mock interview, testar borda).
- Tag colorida por tipo (CurioSIDADE / MOTIVAÇÃO / DICA), fade animado, indicadores clicáveis e pausa no hover.

### 🎨 Ícones Animados dos Módulos

- **8 GIFs animados** e **9 PNGs estáticos** substituíram os ícones Font Awesome dos 17 módulos, com suporte a fallback via helper `moduleIconHtml()` no `app.js`.

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
- **Perfil Nomeados**: É possível criar múltiplos perfis para manter pontuações e progressos separados no mesmo navegador.
- **Conformidade LGPD**: Banner de consentimento com opções "Aceitar" / "Recusar" e página dedicada de **Política de Privacidade** em `/privacidade/index.html`.

---

## 🚀 Como Executar Localmente

Como a aplicação é um SPA estático em HTML5/JS (compatível com **GitHub Pages**):

```bash
# Clone o repositório
git clone https://github.com/andersonlosen08/simulado-qa.git
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
python qa_cli.py stats             # Estatísticas por categoria/idioma
python qa_cli.py export          # Gera artefatos para o front (json/export/)
```

Veja a documentação completa em **[tools/qa_editor/README.md](tools/qa_editor/README.md)**.

---

## 📚 Lessons Learned

Construir o InterviewOps reforçou os seguintes princípios de engenharia:

**Documentação é arquitetura.** Manter o README, I18N.md e comentários de código atualizados não é rotina pós-desenvolvimento — é parte da engenharia. Um código sem documentação é incompleto para quem precisa mantê-lo.

**Static é portação.** Uma aplicação completa (quiz engine, progress tracking, análise STAR, mock timer, design system) entregue como SPA estático puro em HTML/CSS/JS sem backend nem build step: deploy = `git push`. Isso reduz infinity de complexidade e abre caminho para colaboração fácil.

**Design system desde o início.** CSS custom properties tema claro/escuro + variáveis globais de cores/shadows/border-radios cortaram ~40% do tempo de desenvolvimento do front. Consistência visual é automática quando o sistema guia os componentes e as páginas.

**Compressão é educacional.** Implementar compressão e particionamento de cookies foi mais que uma defesa técnica — foi demonstração de domínio interno do navegador e capacidade de resolver problemas complexos com ferramentas nativas (JavaScript + Web API).

**Ferramentas de manutenção são infraestrutura.** O QA Editor (Python CLI/GUI/Web/API) não foi "plus" — foi o que permitiu audit, validação e expansão rápida do banco de 402 questões nos 4 idiomas. Mantenha suas ferramentas tão bem documentadas quanto o produto.

**Storytelling vence memorização.** A plataforma é desenhada para treinar o candidato a construir narrativas estruturadas (STAR) com evidências reais. A análise de coerência, impacto e falhas é mais valorizada por recrutadores do que múltipla escolha.

---

## 📅 Roadmap

### Concluído

- 402 questões multi-idioma (4 línguas por questão) — 25 categorias
- 17 módulos técnicos completos com teoria, erros, quiz, desafios
- Mock Interview Engine com timer configurable e mode adaptativo (hard marking)
- Career Engine (Story Builder + Story Analyzer + EvidenceBank 12 histórias)
- Dashboard (progressão ponderada 60/40, streak, forças, falling)
- Gap Tracker (distância até ~80% de cobertura)
- Roadmap de estudos (5 fases de 2 semanas + spaced repetition + review engine diário)
- English Module (vocab, apresentação, técnico, behavioural) com motor fonético
- Onboarding guiado com blinkenva (driver.js) e cookie persistence
- QA Outdoor (18 frases culturais) e técnica auto-rotativa
- Design system completo (temas claro/escuro, responsive, badges, cards, barras, animação)
- LGPD / Privacidade (consentimento, cookie gears, partição, compressão)
- QA Editor (Python CLI/GUI/Web/API — audit, validar e exportar questões)
- 17 ícones animados (8 GIF) + 9 símbolos estáticos (PNG) + fallback FontAwesome
- Demo GIF para portfólio (docs/demo.gif)

### Planejado

- AI-assisted feedback automático (avaliação coerência via NLP) para mock interview
- Animated svg replaces for performance boost
- Integração com fontes reais de QA curiosidades (RSS Feed)
- Tracks/módulos extras com mais entrevistas específicas (telecom, AI audit)
- Suporte a múltiplos idiomas UI (beyond pt-BR)
- Open source contributions do community review

---

## ✅ Como Construído (Transparência de IA)

This project was built with AI assistance (vibe coding) and fully reviewed by a QA professional. Premises:

- O humano define o que construir, valida qualidade e toma todas as decisões técnicas e de design.
- IA acelera geração de conteúdo, automação de tarefas repetitivas e revisão do redo.
- Todo conteúdo de autoriaIA é sinalizado na interface (transparência).

---

**Website:** [andersonlosen08.github.io/simulado-qa](https://andersonlosen08.github.io/simulado-qa/)  
**Author:** Anderson Vinicius dos Santos Pereira  
**Repository:** [https://github.com/andersonlosen08/simulado-qa](https://www.github.com/andersonlosen08/simulado-qa)