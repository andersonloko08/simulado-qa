#!/usr/bin/env python3
"""
InterviewOps QA Editor — Servidor HTTP / Web Admin.

Fornece:
  1. API JSON (REST-like) para criar/editar/listar/validar questões — consumível
     pela GUI, por um admin web e por futuras integrações com IA.
  2. Página web de administração (UI mínima) em http://localhost:PORT/admin
  3. Endpoint /api/export que gera os artefatos estáticos para o GitHub Pages.

Rotas principais:
    GET  /                    Índice com a lista de endpoints
    GET  /api/questions       Lista todas as questões + categorias
    GET  /api/questions/{id}  Busca uma questão
    POST /api/questions       Cria uma questão
    PUT  /api/questions/{id}  Atualiza uma questão
    DELETE /api/questions/{id} Remove uma questão
    GET  /api/categories      Lista categorias
    GET  /api/stats           Estatísticas
    POST /api/export          Gera json/export/ (front GitHub Pages)
    GET  /admin               Página web de administração

Uso:
    python qa_web.py --port 8001
"""

import argparse
import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from qa_core import (
    QAStore,
    QAValidationError,
    LANGS,
    export_for_frontend,
    write_json,
)

DEFAULT_DB = os.path.join(os.path.dirname(__file__), "..", "..", "json", "questions.json")
EXPORT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "json", "export")

ADMIN_HTML = """<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Editor — Web Admin</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --border:#334155; --text:#e2e8f0; --muted:#94a3b8;
          --primary:#6366f1; --ok:#22c55e; --err:#ef4444; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,sans-serif; background:var(--bg); color:var(--text); padding:2rem; }
  h1 { margin-top:0; } h2 { color:var(--primary); margin-top:2rem; }
  .muted { color:var(--muted); }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:2rem; }
  @media(max-width:900px){ .grid{ grid-template-columns:1fr; } }
  .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:1.25rem; }
  label { display:block; margin-top:0.8rem; font-weight:600; font-size:0.9rem; }
  input, select, textarea { width:100%; margin-top:0.3rem; padding:0.55rem; border-radius:8px;
    border:1px solid var(--border); background:#0b1220; color:var(--text); font-size:0.9rem; }
  textarea { min-height:70px; resize:vertical; }
  button { margin-top:1rem; padding:0.6rem 1.2rem; border:none; border-radius:8px; cursor:pointer;
    background:var(--primary); color:#fff; font-weight:600; }
  button.danger { background:var(--err); }
  .lang-tabs { display:flex; gap:0.4rem; margin-top:0.8rem; flex-wrap:wrap; }
  .lang-tab { padding:0.3rem 0.8rem; border-radius:999px; border:1px solid var(--border);
    background:transparent; color:var(--text); font-size:0.8rem; cursor:pointer; }
  .lang-tab.active { background:var(--primary); color:#fff; border-color:var(--primary); }
  .lang-block { display:none; } .lang-block.active { display:block; }
  .badge { display:inline-block; padding:0.2rem 0.6rem; border-radius:999px; font-size:0.75rem;
    background:var(--card); border:1px solid var(--border); margin:0.15rem; }
  .msg { margin-top:0.8rem; font-weight:600; } .msg.ok{ color:var(--ok);} .msg.err{ color:var(--err);}
  a { color:var(--primary); }
  .q-item { border-bottom:1px solid var(--border); padding:0.7rem 0; }
  .q-item button { padding:0.3rem 0.7rem; margin-top:0; margin-left:0.5rem; font-size:0.8rem; }
  table { width:100%; border-collapse:collapse; margin-top:0.5rem; font-size:0.85rem; }
  th, td { text-align:left; padding:0.4rem 0.5rem; border-bottom:1px solid var(--border); }
</style>
</head>
<body>
  <h1>InterviewOps QA Editor <span class="muted">— Web Admin</span></h1>
  <div id="status" class="muted">Carregando...</div>

  <div class="grid">
    <div>
      <div class="card">
        <h2>Nova questão</h2>
        <label>ID <input id="f_id" placeholder="auto se vazio"></label>
        <label>Categoria <input id="f_category" placeholder="ex.: SQL"></label>
        <label>Dificuldade
          <select id="f_difficulty">
            <option>Fácil</option><option selected>Média</option>
            <option>Intermediária</option><option>Avançada</option>
          </select>
        </label>
        <label>Tipo
          <select id="f_type" onchange="onTypeChange()">
            <option value="open">Aberta (entrevista)</option>
            <option value="choice">Múltipla escolha</option>
          </select>
        </label>
        <label id="lbl_answer" style="display:none;">Alternativa correta (0-3) <input id="f_answer" type="number" min="0" max="3" value="0"></label>
        <div class="lang-tabs" id="lang-tabs"></div>
        <div id="lang-blocks"></div>
        <button onclick="saveNew()">Salvar questão</button>
        <div class="msg" id="new-msg"></div>
      </div>
    </div>
    <div>
      <div class="card">
        <h2>Banco <button onclick="refresh()" style="margin:0;padding:0.2rem 0.6rem;font-size:0.8rem;">↻</button></h2>
        <div id="list"></div>
      </div>
      <div class="card" style="margin-top:1.5rem;">
        <h2>Exportar para GitHub Pages</h2>
        <p class="muted">Gera json/export/questions_all.json e questions_by_category.json</p>
        <button onclick="exportAll()">Exportar agora</button>
        <div class="msg" id="export-msg"></div>
      </div>
    </div>
  </div>

<script>
const LANGS = ["pt-br","pt-pt","en-us","en-uk"];
const FIELDS = [
  ["question","Enunciado"],
  ["expectedAnswer","Resposta esperada"],
  ["realExample","Exemplo real"],
  ["english","Versão em inglês"],
  ["followUps","Follow-ups (um por linha)"],
  ["commonMistakes","Erros comuns (um por linha)"]
];

function el(id){ return document.getElementById(id); }

function onTypeChange(){
  const isChoice = el("f_type").value === "choice";
  el("lbl_answer").style.display = isChoice ? "block" : "none";
  document.querySelectorAll(".opt-block").forEach(b => b.style.display = isChoice ? "block" : "none");
}

function renderLangTabs(){
  const tabs = el("lang-tabs"), blocks = el("lang-blocks");
  tabs.innerHTML = ""; blocks.innerHTML = "";
  LANGS.forEach((lang, i) => {
    const tab = document.createElement("button");
    tab.className = "lang-tab" + (i===0 ? " active" : "");
    tab.textContent = lang;
    tab.onclick = () => {
      document.querySelectorAll(".lang-tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".lang-block").forEach(b=>b.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".lang-block")[i].classList.add("active");
    };
    tabs.appendChild(tab);
    const block = document.createElement("div");
    block.className = "lang-block" + (i===0 ? " active" : "");
    block.dataset.lang = lang;
    FIELDS.forEach(([field, label]) => {
      const l = document.createElement("label");
      l.textContent = label + " (" + lang + ")";
      const input = document.createElement("textarea" );
      if (field === "question") input.style.minHeight = "40px";
      input.dataset.field = field;
      l.appendChild(input);
      block.appendChild(l);
    });
    // alternativas (múltipla escolha)
    const optLabel = document.createElement("label");
    optLabel.className = "opt-block";
    optLabel.style.display = "none";
    optLabel.textContent = "Alternativas (" + lang + ")";
    ["A","B","C","D"].forEach((letter, oi) => {
      const row = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = letter + ") ";
      const input = document.createElement("input");
      input.dataset.opt = oi;
      input.placeholder = "alternativa " + letter;
      row.appendChild(span); row.appendChild(input);
      optLabel.appendChild(row);
    });
    block.appendChild(optLabel);
    blocks.appendChild(block);
  });
}

function collectLang(langIndex){
  const block = document.querySelectorAll(".lang-block")[langIndex];
  const data = {};
  FIELDS.forEach(([field]) => {
    const ta = block.querySelector('textarea[data-field="'+field+'"]');
    const val = ta.value.trim();
    if (field === "followUps" || field === "commonMistakes") {
      data[field] = val ? val.split("\\n").map(s=>s.trim()).filter(Boolean) : [];
    } else {
      data[field] = val;
    }
  });
  data["options"] = Array.from(block.querySelectorAll('input[data-opt]')).map(i => i.value.trim());
  return data;
}

async function saveNew(){
  const q = { id: el("f_id").value.trim(), category: el("f_category").value.trim(),
              difficulty: el("f_difficulty").value, type: el("f_type").value, lang: {} };
  LANGS.forEach((_, i) => { q.lang[LANGS[i]] = collectLang(i); });
  if (q.type === "choice") q.answer = parseInt(el("f_answer").value || "0", 10);
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(q)
  });
  const data = await res.json();
  el("new-msg").className = "msg " + (res.ok ? "ok" : "err");
  el("new-msg").textContent = data.message || JSON.stringify(data);
  if (res.ok) { refresh(); el("f_id").value=""; }
}

function questionTeaser(q){
  const text = (q.lang && q.lang["pt-br"] && q.lang["pt-br"].question) || q.id;
  return text.length > 70 ? text.slice(0,70) + "…" : text;
}

async function delQuestion(id){
  if (!confirm("Remover " + id + "?")) return;
  const res = await fetch("/api/questions/" + encodeURIComponent(id), { method: "DELETE" });
  const data = await res.json();
  alert(data.message || "ok");
  refresh();
}

async function refresh(){
  const res = await fetch("/api/questions");
  const data = await res.json();
  const s = await fetch("/api/stats").then(r=>r.json());
  el("status").textContent = "Total: " + data.questions.length + " questões · categorias: "
      + (data.categories || []).join(", ") + " · idiomas: " + LANGS.join(" / ");
  const list = el("list");
  list.innerHTML = data.questions.map(q => {
    const complete = LANGS.every(l => q.lang && q.lang[l] && q.lang[l].question);
    return '<div class="q-item"><span class="badge">' + q.id + '</span>'
      + '<span class="badge">' + q.category + '</span>'
      + '<span class="badge">' + (complete ? "4 idiomas ✓" : "incompleta") + '</span> '
      + questionTeaser(q) + '<button onclick="delQuestion(\\'' + q.id + '\\')">✕</button></div>';
  }).join("") || '<p class="muted">Vazio</p>';
}

async function exportAll(){
  const res = await fetch("/api/export", { method: "POST" });
  const data = await res.json();
  el("export-msg").className = "msg " + (res.ok ? "ok" : "err");
  el("export-msg").textContent = data.message || JSON.stringify(data);
}

renderLangTabs();
refresh();
</script>
</body>
</html>
"""


class QAServer(BaseHTTPRequestHandler):
    """
    Handler HTTP do servidor web do QA Editor.

    Despacha as rotas REST-like para as operações do QAStore e serve a
    página /admin (ADMIN_HTML). Respostas são JSON (utf-8) com CORS
    habilitado para permitir integrações externas (ex.: IA).
    """

    def __init__(self, *args, store=None, **kwargs):
        self.store = store
        super().__init__(*args, **kwargs)

    # -- helpers -----------------------------------------------------------
    def _send(self, code, payload):
        """Envia uma resposta JSON com status code e headers CORS."""
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, code, html):
        """Envia uma resposta HTML (usada pela página /admin)."""
        body = html.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        """Lê e faz parse do corpo JSON da requisição."""
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw)

    def _path_parts(self):
        """Divide o path da URL em segmentos (ex.: ['api', 'questions'])."""
        path = urllib.parse.urlparse(self.path).path
        return [p for p in path.split("/") if p]

    # -- dispatch ----------------------------------------------------------
    def do_OPTIONS(self):
        """Responde ao preflight CORS."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Despacha requisições GET (admin, api/questions, api/stats, etc.)."""
        parts = self._path_parts()
        if self.path == "/admin" or self.path == "/admin/":
            return self._send_html(200, ADMIN_HTML)
        if not parts:
            return self._send(200, {"ok": True, "service": "InterviewOps QA Editor",
                                    "endpoints": ["/api/questions", "/api/questions/{id}",
                                                  "/api/categories", "/api/stats",
                                                  "/api/export", "/admin"]})
        if parts[0] != "api":
            return self._send(404, {"error": "not found"})
        if len(parts) == 2 and parts[1] == "questions":
            return self._send(200, {"total": len(self.store.all_questions()),
                                    "categories": self.store.categories(),
                                    "questions": self.store.all_questions()})
        if len(parts) == 2 and parts[1] == "categories":
            return self._send(200, {"categories": self.store.categories()})
        if len(parts) == 2 and parts[1] == "stats":
            from qa_core import stats
            return self._send(200, stats(self.store))
        if len(parts) == 3 and parts[1] == "questions":
            q = self.store.get_question(parts[2])
            if not q:
                return self._send(404, {"error": "questão não encontrada"})
            return self._send(200, q)
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        """Despacha requisições POST (criar questão, exportar artefatos)."""
        parts = self._path_parts()
        if len(parts) == 2 and parts[1] == "export":
            try:
                flat = export_for_frontend(self.store)
                p1 = write_json(flat, os.path.join(EXPORT_DIR, "questions_all.json"))
                from qa_core import export_by_category
                p2 = write_json(export_by_category(self.store),
                                os.path.join(EXPORT_DIR, "questions_by_category.json"))
                return self._send(200, {"ok": True, "files": [p1, p2]})
            except Exception as e:
                return self._send(500, {"error": str(e)})
        if len(parts) == 2 and parts[1] == "questions":
            try:
                q = self._read_json()
                qid = self.store.add_question(q)
                self.store.save()
                return self._send(201, {"ok": True, "id": qid, "message": f"Questão '{qid}' criada."})
            except (QAValidationError, KeyError, json.JSONDecodeError) as e:
                return self._send(400, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def do_PUT(self):
        """Despacha requisições PUT (atualizar questão)."""
        parts = self._path_parts()
        if len(parts) == 3 and parts[1] == "questions":
            try:
                q = self._read_json()
                qid = self.store.update_question(parts[2], q)
                self.store.save()
                return self._send(200, {"ok": True, "id": qid})
            except (QAValidationError, KeyError, json.JSONDecodeError) as e:
                return self._send(400, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def do_DELETE(self):
        """Despacha requisições DELETE (remover questão)."""
        parts = self._path_parts()
        if len(parts) == 3 and parts[1] == "questions":
            try:
                qid = self.store.delete_question(parts[2])
                self.store.save()
                return self._send(200, {"ok": True, "id": qid, "message": f"Questão '{qid}' removida."})
            except QAValidationError as e:
                return self._send(400, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def log_message(self, format, *args):
        sys.stderr.write("[qa-web] %s\n" % (format % args))


def main():
    """Inicia o servidor HTTP com o banco configurado (--db) e imprime as rotas."""
    parser = argparse.ArgumentParser(description="InterviewOps QA Editor — Web Admin / API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    parser.add_argument("--db", default=DEFAULT_DB)
    args = parser.parse_args()

    store = QAStore(args.db)

    class Handler(QAServer):
        def __init__(self, *a, **kw):
            super().__init__(*a, store=store, **kw)

    print(f"QA Editor rodando em http://{args.host}:{args.port}")
    print(f"  Admin web:    http://{args.host}:{args.port}/admin")
    print(f"  API JSON:     http://{args.host}:{args.port}/api/questions")
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")


if __name__ == "__main__":
    main()
