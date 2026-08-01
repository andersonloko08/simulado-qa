# InterviewOps QA Editor — Python API

Ferramenta reutilizável para gerenciar o banco de questões **InterviewOps Portugal** em **4 idiomas**
(PT-BR, PT-PT, EN-US, EN-UK). Alimenta a interface gráfica (GUI), um servidor web (admin) e a integração com IA.

## O que é

Um **core de API** (`qa_core.py`) que expõe operações CRUD sobre o banco de questões
(`../../json/questions.json`) e gera artefatos prontos para o front estático (GitHub Pages).

O front-end é **estático** (HTML + JS), então a API aqui é usada em **momento de autoria** (edição)
e gera os JSONs consumidos pelo navegador. No GitHub Pages não roda Python — o que roda lá é o
resultado exportado (`export/`).

## Arquitetura

```
tools/qa_editor/
├── qa_core.py          # Core da API: schema, validação, CRUD, tradução multilíngue
├── qa_gui.py           # Interface gráfica (Tkinter) usando qa_core
├── qa_web.py           # Servidor HTTP local (admin web + endpoints JSON para IA)
├── qa_cli.py           # Interface de linha de comando (adicionar/listar/validar/exportar)
└── README.md
```

## Como usar

```bash
# GUI
python qa_gui.py

# Web admin (abre em http://localhost:8001)
python qa_web.py

# CLI
python qa_cli.py --help
```

## Formato da questão

```json
{
  "id": "API-01",
  "category": "API",
  "difficulty": "Média",
  "lang": {
    "pt-br": {
      "question": "Explique os métodos HTTP e sua idempotência.",
      "expectedAnswer": "...",
      "realExample": "...",
      "followUps": ["..."],
      "commonMistakes": ["..."],
      "english": "..."
    },
    "pt-pt": { "...": "..." },
    "en-us": { "...": "..." },
    "en-uk": { "...": "..." }
  }
}
```

Cada idioma tem o conteúdo completo: enunciado, resposta esperada, exemplo real,
perguntas de follow-up, erros comuns e versão em inglês (para a categoria English).

## GitHub Pages

Execute `python qa_cli.py --export` para gerar a pasta `export/` com:
- `questions_all.json` — banco completo
- `questions_by_category.json` — dividido por categoria
- `index.html` — página estática de demonstração (opcional)

Depois basta publicar `export/` (ou copiar os JSONs para `json/`).
