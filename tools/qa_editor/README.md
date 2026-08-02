# InterviewOps QA Editor — Python API

Ferramenta reutilizável para gerenciar o banco de questões **InterviewOps Portugal** em **4 idiomas**
(PT-BR, PT-PT, EN-US, EN-UK). Alimenta a interface gráfica (GUI), um servidor web (admin) e a integração com IA.

## O que é

Um **core de API** (`qa_core.py`) que expõe operações CRUD sobre o banco de questões
(`../../json/questions.json`) e gera artefatos prontos para o front estático (GitHub Pages).

O front-end é **estático** (HTML + JS), então a API aqui é usada em **momento de autoria** (edição)
e gera os JSONs consumidos pelo navegador. No GitHub Pages não roda Python — o que roda lá é o
resultado exportado (`json/export/`).

## Arquitetura

```
tools/qa_editor/
├── qa_core.py          # Core da API: schema, validação, CRUD, migração, tradução multilíngue, export
├── qa_gui.py           # Interface gráfica (Tkinter) usando qa_core
├── qa_web.py           # Servidor HTTP local (admin web + endpoints JSON REST-like)
├── qa_cli.py           # Interface de linha de comando (add/list/edit/delete/validate/stats/export)
└── README.md
```

Todas as interfaces (GUI, Web, CLI) compartilham o mesmo `qa_core`, garantindo consistência
na validação e no formato dos dados.

## Como usar

```bash
# GUI (interface gráfica)
python qa_gui.py

# Web admin + API JSON (abre em http://localhost:8001/admin)
python qa_web.py --port 8001

# CLI — ajuda completa
python qa_cli.py --help
```

## CLI (qa_cli.py)

| Comando | Descrição |
|---------|-----------|
| `list [--category X] [--id ID] [--lang LANG]` | Lista questões com filtros |
| `add [--lang LANG]` | Adiciona questão interativamente (id vazio gera automático) |
| `edit --id ID [--lang LANG]` | Edita questão existente |
| `delete --id ID` | Remove questão (com confirmação) |
| `validate [--full]` | Valida o banco; `--full` exige todos os idiomas preenchidos |
| `stats` | Estatísticas por categoria e preenchimento por idioma |
| `export` | Gera `json/export/questions_all.json` e `questions_by_category.json` |
| `translate --base-lang pt-br` | Propaga um idioma-base para os idiomas vazios (não traduz) |
| `next-id CATEGORY` | Mostra o próximo id disponível (ex.: `SQL-04`) |

Exemplos:

```bash
python qa_cli.py list --category SQL --lang pt-br
python qa_cli.py add --lang en-us
python qa_cli.py validate --full
```

## API Web (qa_web.py)

Endpoints REST-like (JSON), todos com CORS habilitado para integrações com IA:

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Índice com lista de endpoints |
| `GET` | `/api/questions` | Lista todas as questões + categorias |
| `GET` | `/api/questions/{id}` | Busca uma questão |
| `POST` | `/api/questions` | Cria uma questão (valida e salva) |
| `PUT` | `/api/questions/{id}` | Atualiza uma questão |
| `DELETE` | `/api/questions/{id}` | Remove uma questão |
| `GET` | `/api/categories` | Lista categorias |
| `GET` | `/api/stats` | Estatísticas |
| `POST` | `/api/export` | Gera os artefatos `json/export/` |
| `GET` | `/admin` | Página web de administração |

## Formato da questão

```json
{
  "id": "API-01",
  "category": "API",
  "difficulty": "Média",
  "type": "open",
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

Para questões de múltipla escolha (`"type": "choice"`), inclua `"answer"` (índice 0-3)
e `"options"` (4 alternativas) em cada idioma.

## Validação

- `id` obrigatório, somente letras, números, `-` e `_`.
- `category` e `difficulty` obrigatórias (Fácil/Média/Intermediária/Avançada).
- Múltipla escolha exige pelo menos 2 alternativas e `answer` dentro do range.
- Com `--full`/`require_full=True`, exige enunciado em todos os idiomas.

## Migração de formato legado

`qa_core.migrate_legacy_question()` converte questões no formato antigo (flat, com
`question`/`expectedAnswer`/`english`) para o formato multilíngue: o conteúdo flat vira
`pt-br`, o campo `english` vira `en-us`, e `pt-pt`/`en-uk` ficam vazios para tradução.
A migração é aplicada automaticamente no `QAStore._load()`.

## Export para GitHub Pages

Execute `python qa_cli.py export` (ou `POST /api/export`) para gerar a pasta `json/export/` com:

- `questions_all.json` — banco completo (formato flat com camada `lang`)
- `questions_by_category.json` — dividido por categoria

Copie esses JSONs para `json/` (ou configure o front para ler de `json/export/`) e publique o site.
