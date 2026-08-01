# InterviewOps Portugal

## The Ultimate Interview Preparation Platform for QA Automation Engineers

**Version:** 3.0  
**Author:** Anderson Vinicius dos Santos Pereira  
**Repo:** https://github.com/andersonloko08/simulado-qa  
**Live Site:** https://andersonloko08.github.io/simulado-qa/

---

## 🎯 Visão do Projeto

InterviewOps Portugal não é mais um repositório de perguntas de entrevista.

É uma plataforma de engenharia projetada para transformar anos de experiência profissional em prontidão para entrevistas.

Em vez de estudar tecnologias isoladamente, a plataforma ensina o candidato a conectar:

- Conhecimento técnico
- Experiência profissional real
- Contexto de negócio
- Comunicação em Português e Inglês
- Resolução de problemas
- Confiança

---

## 🏛 Arquitetura do Projeto

```
InterviewOps/
├── index.html              # Home / Landing
├── dashboard/              # Dashboard (progresso, pontos fortes/fracos, streak)
├── modules/                # Módulos técnicos (API, SQL, Robot, Playwright, JS...)
├── career/                 # Career Engine, Story Builder, Evidence Bank
├── english/                # Módulo de Inglês para entrevistas
├── mock/                   # Mock Interview Engine (simulador de entrevista)
├── tracker/                # Gap Tracker e Progress Tracking
├── roadmap/                # Review Engine (spaced repetition)
├── privacidade/            # Política de Privacidade & LGPD
├── json/                   # Banco de dados (modules, questions, stories, english, i18n)
├── css/                    # Design system compartilhado
├── javascript/             # Lógica compartilhada (app.js: cookies, i18n, tema, progresso, perfis)
├── I18N.md                 # Guia de Internacionalização
└── tools/qa_editor/        # Editor Python de questões multi-idioma (API/CLI/GUI/Web)
```

---

## 🌍 Multi-idioma Simplificado (PT-BR e EN-US)

O projeto suporta **Português (BR)** e **English (US)**. O seletor de idioma no topo da página altera dinamicamente todo o conteúdo da interface, lições e questões simuladas.

Para entender como adicionar novos idiomas (ex.: Espanhol, Francês), consulte o arquivo **[I18N.md](I18N.md)**.

---

## 🍪 Armazenamento em Cookie & Privacidade (LGPD)

- **Sem Backend**: Todo o estado de progresso é mantido no próprio navegador.
- **Cookies com Compressão**: Os dados são comprimidos utilizando a API nativa `CompressionStream` (`deflate-raw`) e codificados em Base64 URL-safe.
- **Particionamento Automático**: Para evitar o limite de ~4KB por cookie, a camada de armazenamento particiona automaticamente payloads grandes em múltiplos cookies (`interviewops_progress_0`, `interviewops_progress_1`, etc.).
- **Perfis Nomeados**: É possível criar múltiplos perfis para manter pontuações e progressos separados no mesmo navegador.
- **Conformidade LGPD**: Banner de consentimento com opções "Aceitar" / "Recusar" e página dedicada de **Política de Privacidade** em `/privacidade/index.html`.

---

## 🚀 Como Executar Localmente

Como a aplicação é um SPA estático em HTML5/JS (compátivel com **GitHub Pages**):

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

`tools/qa_editor/` é uma ferramenta reutilizável para gerenciar o banco de questões:

```bash
cd tools/qa_editor
python qa_gui.py                 # Interface gráfica (Tkinter)
python qa_web.py --port 8001     # Admin web + API JSON (http://localhost:8001/admin)
python qa_cli.py list --category SQL
python qa_cli.py add             # Nova questão
python qa_cli.py validate        # Valida o banco inteiro
python qa_cli.py stats           # Estatísticas por categoria/idioma
```
