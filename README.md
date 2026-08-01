# InterviewOps Portugal

## The Ultimate Interview Preparation Platform for QA Automation Engineers

**Version:** 1.0
**Author:** Anderson Vinicius dos Santos Pereira

---

## 🎯 Visão do Projeto

InterviewOps Portugal não é mais um repositório de perguntas de entrevista.

É uma plataforma de engenharia projetada para transformar anos de experiência profissional em prontidão para entrevistas.

Em vez de estudar tecnologias isoladamente, a plataforma ensina o candidato a conectar:

- Conhecimento técnico
- Experiência profissional real
- Contexto de negócio
- Comunicação
- Resolução de problemas
- Confiança

> Transformar um profissional tecnicamente competente em alguém capaz de comunicar essa competência com clareza durante entrevistas.

## 🏛 Arquitetura do Projeto

```
InterviewOps/
├── index.html              # Home / Landing
├── dashboard/              # Dashboard (progresso, pontos fortes/fracos, streak)
├── modules/                # Módulos técnicos (API, SQL, Robot, Playwright, JS...)
├── companies/              # Company Playbooks (Natixis, KLx, Cardif...)
├── career/                 # Career Engine, Story Builder, Evidence Bank
├── english/                # Módulo de Inglês para entrevistas
├── mock/                   # Mock Interview Engine (simulador de entrevista)
├── tracker/                # Gap Tracker e Progress Tracking
├── roadmap/                # Review Engine (spaced repetition)
├── json/                   # Banco de dados (modules, questions, companies, stories, english, i18n)
├── css/                    # Design system compartilhado
├── javascript/             # Lógica compartilhada (tema, idioma, progresso, helpers)
├── assets/                 # Imagens e mídia
├── docs/                   # Documentação
└── tools/qa_editor/        # Editor Python de questões multi-idioma (API/CLI/GUI/Web)
```

## 🌍 Multi-idioma (PT-BR, PT-PT, EN-US, EN-UK)

O banco de questões suporta **4 idiomas** por questão. O seletor de idioma no topo
da página define o idioma de toda a interface e das questões.

- Selecionando **EN-US**: todo o conteúdo (inclusive a categoria *English*) aparece em inglês americano.
- Selecionando **EN-UK**: todo o conteúdo aparece em inglês britânico (behaviour, analyse, prioritise...).
- Selecionando **PT-BR** ou **PT-PT**: a interface e as questões de cada assunto aparecem em português
  (brasileiro ou europeu), e as questões específicas de **inglês** usam a **variante US ou UK** que você
  escolher no momento da seleção.

### Formato da questão (esquema v2)

```json
{
  "id": "API-01",
  "category": "API",
  "difficulty": "Média",
  "type": "open",               // "open" (entrevista) | "choice" (múltipla escolha)
  "answer": 2,                  // apenas para type=choice (índice da correta)
  "lang": {
    "pt-br": { "question": "...", "expectedAnswer": "...", "realExample": "...",
               "english": "...", "followUps": ["..."], "commonMistakes": ["..."] },
    "pt-pt": { "...": "..." },
    "en-us": { "...": "..." },
    "en-uk": { "...": "..." }
  }
}
```

Para múltipla escolha (`type: "choice"`), cada idioma também carrega `options` (4 alternativas).

## 🛠 QA Editor (Python)

`tools/qa_editor/` é uma **ferramenta reutilizável e API-first** para gerenciar o banco de questões
nos 4 idiomas. O mesmo core (`qa_core.py`) alimenta três interfaces:

```bash
cd tools/qa_editor
python qa_gui.py                 # Interface gráfica (Tkinter)
python qa_web.py --port 8001     # Admin web + API JSON (http://localhost:8001/admin)
python qa_cli.py list --category SQL
python qa_cli.py add             # Nova questão (open ou choice, 4 idiomas)
python qa_cli.py validate        # Valida o banco inteiro
python qa_cli.py stats           # Estatísticas por categoria/idioma
python qa_cli.py export          # Gera json/export/ para o front (GitHub Pages)
```

Endpoints da API web: `GET/POST /api/questions`, `PUT/DELETE /api/questions/{id}`,
`GET /api/categories`, `GET /api/stats`, `POST /api/export`.

> A API roda localmente durante a autoria/edição. O que é publicado no GitHub Pages são
> os JSONs exportados (`json/questions.json` e `json/export/`).

## ✨ Principais Funcionalidades

- **Dashboard:** visão geral da preparação com barras de progresso, streak de estudo, áreas fracas e fortes e módulo recomendado.
- **Módulos Técnicos (15):** API, SQL, Python, Robot Framework, Playwright, Git, CI/CD, Docker, Kubernetes, SAP, Agile, BDD, Testing, Security e Performance. Estrutura padronizada: teoria, exemplos, erros comuns, exemplo de projeto real, questões de entrevista (com resposta esperada, follow-ups e versão em inglês), desafios e quiz.
- **Mock Interview Engine:** o sistema vira o entrevistador. Pergunta aparece, timer inicia, o candidato responde e o sistema revela pontos fortes, pontos faltantes, perspectiva técnica e de negócio.
- **Career Engine / Story Builder:** cada experiência profissional vira uma história reutilizável de entrevista (Problema → Ação → Resultado → Valor de negócio).
- **Evidence Bank:** banco de evidências por tecnologia — projetos, falhas, sucessos, lições aprendidas e impacto no negócio.
- **Company Playbooks:** uma página por empresa (Natixis, KLx, Cardif, Siemens, Hitachi Rail) com cultura, stack, perguntas esperadas, gaps comuns e histórias recomendadas.
- **Gap Tracker:** mostra o conhecimento que falta (atual vs. alvo) com lições e exercícios recomendados.
- **Review Engine:** recomendações diárias (spaced repetition) para prevenir a perda de conhecimento.
- **English Module:** vocabulário, perguntas comuns, explicações técnicas e apresentação profissional em inglês.
- **Dark Mode:** suportado, com persistência.
- **Mobile First:** totalmente responsivo e compatível com GitHub Pages.

## 🚀 Tecnologias

- **HTML5, CSS3 (Vanilla), JavaScript ES6+** — sem frameworks, rápido, zero custo de hospedagem.
- **JSON** como banco de dados estático — GitHub Pages friendly, sem backend.
- **localStorage** para progresso, streak e estado do mock interview.
- **Python** como linguagem de apoio para geração/manutenção de conteúdo JSON.

## 💻 Como Rodar

1. Clonar este repositório.
2. Abrir `index.html` (ou servir com `python -m http.server 8000` para melhor experiência com fetch de JSON).
3. Navegar pelos módulos e começar a preparação.

> Nota: como a plataforma carrega dados via `fetch` de arquivos JSON, o uso de um servidor local simples (`python -m http.server 8000`) é recomendado, ou abrir os arquivos de forma que o fetch seja permitido.

## 📚 Módulos Técnicos

API | SQL | Python | JavaScript | Robot Framework | Playwright | Git | CI/CD | Docker | Kubernetes | SAP | Agile | BDD | Testing | Security | Performance

## 🏢 Company Playbooks

Natixis | KLx | Cardif | Siemens | Hitachi Rail

## 🛤 Roadmap de Desenvolvimento

- **Fase 1 — Fundação:** layout, navegação, dashboard, módulos.
- **Fase 2 — Conteúdo:** QA, API, SQL, Robot, Python.
- **Fase 3 — Career Engine:** resume parser, Story Builder, Evidence Bank.
- **Fase 4 — Empresas:** playbooks das 5 empresas.
- **Fase 5 — Interview Engine:** questões, timer, avaliação, revisão adaptativa.
- **Fase 6 — Inglês:** entrevista técnica, RH, vocabulário.
- **Fase 7 — IA (futuro):** simulador de entrevista, recomendações personalizadas, análise de fraquezas.

## ⚖️ Principio Central

> Não memorize respostas.
>
> Construa evidências.
>
> Conte histórias.
>
> Demonstre engenharia.
>
> Inspire confiança.

---

InterviewOps Portugal &copy; 2026. Desenvolvido para estudos e open-source.
