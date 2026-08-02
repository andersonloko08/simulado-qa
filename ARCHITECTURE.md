# Arquitetura e Funcionamento Técnico — InterviewOps Portugal

Documentação detalhada da arquitetura de software, fluxo de dados, mecânicas internas e módulos do **InterviewOps Portugal**.

---

## 🏛️ 1. Visão Geral da Arquitetura

O InterviewOps é projetado como uma **Single Page Application (SPA) estática modular**, construída sem frameworks pesados (Vanilla JavaScript ES6+), sem backend central e hospedada no **GitHub Pages**.

```text
                               ┌─────────────────────────────────────────┐
                               │           Navegador do Usuário          │
                               └────────────────────┬────────────────────┘
                                                    │
                               ┌────────────────────▼────────────────────┐
                               │         Design System & Layout          │
                               │        (HTML5 / CSS3 Variáveis)         │
                               └────────────────────┬────────────────────┘
                                                    │
        ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
        │                                           │                                           │
┌───────▼──────────────┐             ┌──────────────▼──────────────┐             ┌──────────────▼──────────────┐
│  javascript/app.js   │             │   Páginas & Motores de Tela │             │  Camada de Dados (JSON)     │
│                      │             │                             │             │                             │
│ • Storage (Cookies)  │             │ • Home (index.html)         │             │ • modules.json (Índice 17)  │
│ • Compressão Deflate │             │ • Modules (module.html)     │             │ • modules/*.json (Conceitos)│
│ • I18N & Temas       │             │ • Mock (Mock Interview)     │             │ • questions.json (402 Qs)   │
│ • Streaks & Progress │             │ • Career & Story Analyzer   │             │ • stories.json (STAR)       │
│ • Icon Helper        │             │ • Tracker & Roadmap         │             │ • i18n.json (Rótulos UI)    │
└──────────────────────┘             └─────────────────────────────┘             └─────────────────────────────┘
```

### Princípios Arquiteturais

1. **Zero Infraestrutura Server-side**: Toda a execução de lógica (cálculos de progresso, ordenação, filtro, análise NLP heurística) roda 100% no cliente.
2. **Persistência Local e Privada (LGPD)**: Nenhum dado do usuário é enviado a servidores externos. O progresso é mantido no navegador via Cookies com suporte a compressão nativa e particionamento.
3. **Desempenho por Carga sob Demanda**: Os arquivos JSON de conteúdo são divididos por módulo. A aplicação carrega apenas os metadados e consome arquivos detalhados quando o usuário navega até o módulo específico.
4. **Resiliência e Fallbacks**: Toda renderização possui caminhos alternativos para lidar com falhas de carregamento de arquivo ou limitações do navegador.

---

## 💾 2. Camada de Armazenamento e Estado (Storage Engine)

A persistência de estado é gerenciada pelo módulo `javascript/app.js`, utilizando cookies sob o namespace `interviewops_`.

### Estrutura de Compressão e Particionamento

Como navegadores impõem o limite de ~4KB por cookie, objetos grandes de progresso e histórico passam pelo pipeline de compressão:

```text
[ Objeto JavaScript ] ──(JSON.stringify)──> [ String JSON ] ──(CompressionStream 'deflate-raw')──> [ Uint8Array ]
                                                                                                        │
[ Cookie / Local ] <──(Particionamento em chunks de ~3.5KB)─── [ Base64 URL-Safe ] <──(btoa)────────────┘
```

1. **Compressão**: Utiliza a Web API nativa `CompressionStream('deflate-raw')`. Payloads comprimidos recebem o prefixo `z1:`.
2. **Fallback**: Se o navegador não suportar `CompressionStream`, os dados são salvos em texto plano URL-encoded sem romper a aplicação.
3. **Particionamento**: Quando uma string codificada excede 3.500 caracteres, a função `storeSet` divide o valor em múltiplos cookies sequenciais (`interviewops_progress_0`, `interviewops_progress_1`, etc.) e cria um cookie de cabeçalho indicando o total de partes.

### Perfis de Usuário Isolados

O sistema suporta múltiplos perfis isolados no mesmo navegador:
- Chaves globais (como `theme`, `lang`, `hasSeenTutorial` e `consent`) aplicam-se ao site como um todo.
- Chaves de progresso do usuário recebem o prefixo do perfil ativo: `p_<slug_do_perfil>_<chave>`.

---

## 🌐 3. Sistema de Internacionalização (I18N) e Resolução de Conteúdo

O sistema opera em duas camadas separadas:

### 3.1 Rótulos de Interface
A interface do usuário utiliza rótulos traduzidos carregados de `json/i18n.json`.
- Elementos com o atributo `data-i18n="chave"` têm seu texto atualizado automaticamente via `applyTranslations()`.
- Suporta inserção de HTML seguro via `data-i18n-html`.

### 3.2 Resolução de Idioma do Conteúdo
Para perguntas e explicações técnicas:
- O banco `json/questions.json` armazena 402 questões com textos traduzidos em **4 variantes**: `pt-br`, `pt-pt`, `en-us` e `en-uk`.
- A função `resolveLang(categoria)` seleciona automaticamente o idioma correto: categorias ligadas ao módulo de inglês retornam `en-us`; demais categorias utilizam `pt-br`.

---

## 🧩 4. Funcionalidades e Motores da Aplicação

### 4.1 Home & Painel de Boas-vindas (`index.html`)
- **Hero & CTA**: Apresentação da plataforma e atalhos diretos para Dashboard, Simulador e Story Analyzer.
- **QA Outdoor (`javascript/qa_outdoor.js`)**: Painel dinâmico com 18 frases rotativas (curiosidades históricas de QA, incentivos e dicas do método STAR) trocadas a cada 6 segundos, com pausa ao passar o mouse e controle por indicadores.
- **Tutorial Guiado (`javascript/tutorial.js`)**: Tour interativo de 5 passos via **driver.js v1.3.1**, com destaque spotlight, botão de pular sempre visível e gravação de cookie para não incomodar em acessos futuros.
- **Grade de Módulos**: Amostra dos módulos técnicos com suporte a ícones animados/estáticos via `moduleIconHtml()`.

### 4.2 Módulos Técnicos (`modules/index.html` e `modules/module.html`)
- **17 Módulos de Estudo**: Cobrem do básico ao avançado (IA, API, SQL, Python, JS, Robot, Playwright, Git, CI/CD, Docker, K8s, SAP, Agile, BDD, Testing, Security, Performance).
- **Abas de Conteúdo**:
  - **Conceitos**: Teoria, exemplos de código, erros comuns, casos reais de projetos e perguntas de entrevista.
  - **Quiz**: Perguntas de múltipla escolha sorteadas com cálculo de nota máxima mantida no histórico (`quizBest`).

### 4.3 Mock Interview Engine (`mock/index.html`)
- **Configuração**: Escolha de categorias, nível de dificuldade (Fácil, Média, Intermediária, Avançada), quantidade de questões (1 a 15) e tempo por questão.
- **Cronômetro Circular Animado**: Timer visual feito com `conic-gradient` no CSS que muda de cor nos últimos 30 segundos e pisca no final.
- **Revelação de Resposta e Correção**: Exibe a resposta esperada, exemplos reais, possíveis perguntas de desdobramento (*follow-ups*), erros comuns e versão traduzida para inglês.
- **Marcação de Dificuldade**: Permite marcar questões desafiadoras para influenciar a amostragem das sessões seguintes (*adaptive resampling*).

### 4.4 Career Engine & Story Analyzer (`career/`)
- **Story Analyzer (`career/analyzer.html`)**: Processador heurístico de texto no cliente que analisa relatos de carreira em linguagem natural:
  - Detecta até 19 temas de QA (API, SQL, Automação, CI/CD, etc.) utilizando busca por limites de palavras inteiras (*word boundary matching*).
  - Decompoe o texto na estrutura **STAR** (Situação, Tarefa, Ação e Resultado).
  - Avalia a presença de palavras de impacto e métricas numéricas.
- **Evidence Bank (`career/stories.html`)**: Biblioteca com 12 histórias reais escritas no formato STAR, prontas para servirem de referência para o candidato.
- **Story Builder (`career/index.html`)**: Guia conceitual para construção de respostas fortes.

### 4.5 Módulo de Inglês (`english/index.html`)
- **6 Abas Temáticas**: Vocabulário Técnico, Apresentação Profissional, Perguntas de RH, Explicações Técnicas, Comunicação de Negócio e Comportamental.
- **Motor de Pronúncia Fonética**: Função `toFonema()` que gera aproximações fonéticas legíveis em português para termos em inglês.
- **Síntese de Voz Nascida do Browser**: Integração com a API `window.speechSynthesis` (Web Speech API) para leitura em áudio nativa dos termos em inglês.

### 4.6 Dashboard & Métricas (`dashboard/index.html`)
- **Cálculo de Prontidão Ponderado**: A fórmula de progresso por módulo combina estudo de conceitos (60%) e melhor nota em quizzes (40%):
  $$\text{Progresso} = \text{round}((\text{Conceitos Lidos} \times 0.6) + (\text{Nota Máxima no Quiz} \times 0.4))$$
- **Streak de Estudos**: Rastreador de dias consecutivos de estudo.
- **Recomendador de Próximo Passo**: Identifica automaticamente o módulo com menor progresso para sugerir ao usuário.

### 4.7 Gap Tracker & Roadmap (`tracker/` e `roadmap/`)
- **Gap Tracker**: Painel focado em levar todos os 17 módulos à meta de **80% de cobertura**, ordenando-os por prioridade de urgência.
- **Roadmap & Spaced Repetition**: Plano de 10 semanas dividido em 5 fases, acompanhado do **Motor de Revisão Espaçada** que sugere diariamente 5 módulos para revisar com base na data da última revisão e nota de fraqueza.

---

## 🛠️ 5. Ferramental de Suporte (QA Editor em Python)

Em `tools/qa_editor/`, o projeto conta com um ecossistema Python para manutenção do banco de questões:

```text
tools/qa_editor/
├── qa_core.py      # Camada central: CRUD, validação de schema, migração e exportação
├── qa_cli.py       # Interface de linha de comando para inserção rápida e relatórios
├── qa_gui.py       # Aplicação desktop em Tkinter para edição visual em 4 idiomas
└── qa_web.py       # Servidor web leve com painel Admin + 11 endpoints REST JSON
```

- **Validação de Schema**: Garante que todas as questões possuam traduções completas nas 4 variantes de idioma e respostas válidas antes de salvar.
- **Exportação para o Frontend**: O comando `export` gera os pacotes JSON otimizados usados diretamente pelo frontend em `json/export/`.

---

## 🎨 6. Design System e Assets Visuals

- **CSS Custom Properties**: Definidas em `css/style.css`, controlam esquemas de cores, espaçamentos, bordas arredondadas e sombras para suporte a **Tema Claro e Tema Escuro**.
- **Ícones dos Módulos**: Mapeamento inteligente via helper `moduleIconHtml(m)`:
  - 8 Módulos utilizam **GIFs animados** otimizados localizados na pasta `icons/`.
  - 9 Módulos utilizam **PNGs estáticos**.
  - Fallback automático para ícones **Font Awesome** (versão 6 CDN).

---

## 🛡️ 7. Segurança e Proteção de Dados

1. **Execução sem Scripts Externos de Terceiros**: Apenas Font Awesome e Driver.js são carregados via CDN confiável (cdnjs / jsdelivr).
2. **Sem Rastreamento de Terceiros**: Ausência de Google Analytics, pixels ou cookies de rastreamento comercial.
3. **Escapamento contra XSS**: Todas as inserções de texto dinâmico gerado pelo usuário utilizam a função `escapeHtml()`.
