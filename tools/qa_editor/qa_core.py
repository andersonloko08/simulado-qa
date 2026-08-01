#!/usr/bin/env python3
"""
InterviewOps QA Editor — Core da API.

Banco de questões multilíngue (PT-BR, PT-PT, EN-US, EN-UK).
Fornece: schema, validação, CRUD, tradução estrutural e exportação
de artefatos para o front estático (GitHub Pages).

Uso (como módulo):
    from qa_core import QAStore
    store = QAStore("../../json/questions.json")
    store.add_question(question_dict)
    store.save()
"""

import json
import os
import re
from copy import deepcopy
from datetime import datetime

# ---------------------------------------------------------------------------
# Constantes / schema
# ---------------------------------------------------------------------------

LANGS = ["pt-br", "pt-pt", "en-us", "en-uk"]
DEFAULT_LANG = "pt-br"
DIFFICULTIES = ["Fácil", "Média", "Intermediária", "Avançada"]

# Campos que existem POR IDIOMA
LANG_TEXT_FIELDS = ["question", "expectedAnswer", "realExample", "english"]
LANG_LIST_FIELDS = ["followUps", "commonMistakes"]
LANG_OPTION_FIELDS = ["options"]

# Campos de metadados (não traduzidos)
META_FIELDS = ["id", "category", "difficulty", "type", "answer"]

SCHEMA_VERSION = "2.0"

# Tipos de questão
TYPE_OPEN = "open"        # pergunta aberta (entrevista) — usa expectedAnswer/realExample
TYPE_CHOICE = "choice"    # múltipla escolha — usa options[] + answer (índice)

_ID_RE = re.compile(r"^[A-Za-z0-9_\-]+$")


def make_empty_lang():
    """Cria a estrutura vazia de um idioma."""
    return (
        {f: "" for f in LANG_TEXT_FIELDS}
        | {f: [] for f in LANG_LIST_FIELDS}
        | {f: [] for f in LANG_OPTION_FIELDS}
    )


def make_question_template(qtype=TYPE_OPEN, n_options=4):
    """Cria um template de questão preenchido com 4 idiomas vazios."""
    lang = {lang: make_empty_lang() for lang in LANGS}
    if qtype == TYPE_CHOICE:
        for l in lang.values():
            l["options"] = ["" for _ in range(n_options)]
    return {
        "id": "",
        "category": "",
        "difficulty": "Média",
        "type": qtype,
        "lang": lang,
    }


# ---------------------------------------------------------------------------
# Validação
# ---------------------------------------------------------------------------


class QAValidationError(Exception):
    pass


def validate_question(q, require_full=True):
    """
    Valida uma questão.
    - require_full=True: exige conteúdo em TODOS os idiomas.
    - require_full=False: permite autoria parcial (idiomas vazios são válidos).
    Levanta QAValidationError descrevendo o problema.
    """
    if not q.get("id"):
        raise QAValidationError("id é obrigatório")
    if not _ID_RE.match(q["id"]):
        raise QAValidationError(
            f"id inválido '{q['id']}': use apenas letras, números, - e _"
        )
    if not q.get("category"):
        raise QAValidationError("category é obrigatória")
    if q.get("difficulty") not in DIFFICULTIES:
        raise QAValidationError(
            f"difficulty inválida '{q.get('difficulty')}'. Use: {DIFFICULTIES}"
        )

    qtype = q.get("type", TYPE_OPEN)
    if qtype not in (TYPE_OPEN, TYPE_CHOICE):
        raise QAValidationError(
            f"type inválido '{qtype}'. Use: {TYPE_OPEN} (aberta) ou {TYPE_CHOICE} (múltipla escolha)"
        )

    # validação específica de múltipla escolha
    if qtype == TYPE_CHOICE:
        if "answer" not in q or not isinstance(q.get("answer"), int):
            raise QAValidationError(f"questão de múltipla escolha '{q['id']}' precisa de 'answer' (índice inteiro)")
        max_opt = 0
        for lang in LANGS:
            lang_data = q.get("lang", {}).get(lang)
            if not lang_data:
                continue
            options = lang_data.get("options", [])
            filled = [o for o in options if o]
            if filled and len(filled) < 2:
                raise QAValidationError(
                    f"questão '{q['id']}' idioma '{lang}': múltipla escolha precisa de pelo menos 2 alternativas"
                )
            if options:
                max_opt = max(max_opt, len(options))
        if max_opt and q["answer"] >= max_opt:
            raise QAValidationError(
                f"questão '{q['id']}': 'answer' ({q['answer']}) fora do range de alternativas (0..{max_opt - 1})"
            )

    for lang in LANGS:
        lang_data = q.get("lang", {}).get(lang)
        if not lang_data:
            if require_full:
                raise QAValidationError(f"falta idioma '{lang}' em {q['id']}")
            continue
        for field in LANG_TEXT_FIELDS:
            value = lang_data.get(field, "")
            if require_full and not value and field == "question":
                raise QAValidationError(
                    f"campo 'question' vazio no idioma '{lang}' de {q['id']}"
                )
        for field in LANG_LIST_FIELDS:
            if not isinstance(lang_data.get(field, []), list):
                raise QAValidationError(
                    f"campo '{field}' deve ser lista no idioma '{lang}' de {q['id']}"
                )
        if qtype == TYPE_CHOICE and not isinstance(lang_data.get("options", []), list):
            raise QAValidationError(
                f"campo 'options' deve ser lista no idioma '{lang}' de {q['id']}"
            )

    return True


# ---------------------------------------------------------------------------
# Store (CRUD sobre JSON)
# ---------------------------------------------------------------------------


class QAStore:
    def __init__(self, path):
        self.path = path
        self.data = self._load()

    def _load(self):
        if not os.path.exists(self.path):
            return self._new_bank()
        with open(self.path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # normaliza versões antigas
        if "questions" not in data:
            data = self._new_bank()
        # migra formato antigo (flat) -> formato multilíngue
        migrated = False
        questions = data.get("questions", [])
        for i, q in enumerate(questions):
            if "lang" not in q and "question" in q:
                questions[i] = migrate_legacy_question(q)
                migrated = True
        if migrated:
            data["schema"] = SCHEMA_VERSION
        return data

    def _new_bank(self):
        return {
            "schema": SCHEMA_VERSION,
            "updatedAt": datetime.now().isoformat(),
            "total": 0,
            "categories": [],
            "questions": [],
        }

    def save(self, target=None):
        path = target or self.path
        self.data["total"] = len(self.data["questions"])
        cats = sorted({q.get("category", "") for q in self.data["questions"]} - {""})
        self.data["categories"] = cats
        self.data["updatedAt"] = datetime.now().isoformat()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=4)
        return path

    # -- leitura -----------------------------------------------------------
    def all_questions(self):
        return self.data["questions"]

    def get_question(self, qid):
        for q in self.data["questions"]:
            if q["id"] == qid:
                return q
        return None

    def by_category(self, category):
        return [q for q in self.data["questions"] if q.get("category") == category]

    def categories(self):
        return self.data.get("categories", [])

    # -- escrita -----------------------------------------------------------
    def add_question(self, q, require_full=False):
        validate_question(q, require_full=require_full)
        if self.get_question(q["id"]):
            raise QAValidationError(f"já existe questão com id '{q['id']}'")
        self.data["questions"].append(deepcopy(q))
        return q["id"]

    def update_question(self, qid, q, require_full=False):
        validate_question(q, require_full=require_full)
        q["id"] = qid  # mantém o id original
        for i, existing in enumerate(self.data["questions"]):
            if existing["id"] == qid:
                self.data["questions"][i] = deepcopy(q)
                return qid
        raise QAValidationError(f"questão '{qid}' não encontrada")

    def delete_question(self, qid):
        before = len(self.data["questions"])
        self.data["questions"] = [q for q in self.data["questions"] if q["id"] != qid]
        if len(self.data["questions"]) == before:
            raise QAValidationError(f"questão '{qid}' não encontrada")
        return qid

    def find_next_id(self, category):
        """Gera o próximo id para a categoria, ex.: SQL-04."""
        prefix = re.sub(r"[^A-Za-z0-9]", "", category)[:4].upper() or "Q"
        existing = self.by_category(category)
        max_num = 0
        for q in existing:
            m = re.search(r"(\d+)$", q["id"])
            if m:
                max_num = max(max_num, int(m.group(1)))
        return f"{prefix}-{max_num + 1:02d}"


# ---------------------------------------------------------------------------
# Exportação para o front (GitHub Pages)
# ---------------------------------------------------------------------------


def export_flat(store):
    """Converte o banco para uma lista simples de questões (sem a camada 'lang')."""
    out = []
    for q in store.all_questions():
        base = {"id": q["id"], "category": q["category"], "difficulty": q["difficulty"]}
        for lang in LANGS:
            l = q.get("lang", {}).get(lang, {})
            base[lang] = l
        out.append(base)
    return out


def export_for_frontend(store, base_lang=None, target_lang=None):
    """
    Gera um banco otimizado para o front.

    Se base_lang e target_lang forem fornecidos e diferentes, cria uma visão
    'traduzida' (completa apenas no target_lang, mantendo base como fallback).
    """
    return {
        "schema": store.data.get("schema", SCHEMA_VERSION),
        "updatedAt": store.data.get("updatedAt"),
        "total": len(store.all_questions()),
        "categories": store.categories(),
        "languages": LANGS,
        "questions": export_flat(store),
    }


def export_by_category(store):
    """Agrupa questões por categoria (útil para o front carregar só o necessário)."""
    result = {}
    for q in store.all_questions():
        result.setdefault(q["category"], []).append(q)
    return result


def write_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    return path


# ---------------------------------------------------------------------------
# Migração de formato legado
# ---------------------------------------------------------------------------


def migrate_legacy_question(q):
    """
    Converte questão no formato antigo (flat, com 'question'/'expectedAnswer'/
    'english') para o formato multilíngue com a camada 'lang'.

    O conteúdo flat vira pt-br. O campo 'english' (quando existe) vira en-us.
    pt-pt e en-uk ficam vazios, prontos para tradução/edição.
    """
    out = {
        "id": q.get("id", ""),
        "category": q.get("category", ""),
        "difficulty": q.get("difficulty", "Média"),
        "type": q.get("type", TYPE_OPEN),
        "lang": {lang: make_empty_lang() for lang in LANGS},
    }
    if out["type"] == TYPE_CHOICE:
        answer = q.get("answer")
        if isinstance(answer, int):
            out["answer"] = answer
    pt_br = make_empty_lang()
    for field in LANG_TEXT_FIELDS:
        if field == "english":
            continue
        pt_br[field] = q.get(field, "")
    pt_br["english"] = ""
    pt_br["followUps"] = q.get("followUps", [])
    pt_br["commonMistakes"] = q.get("commonMistakes", [])
    out["lang"]["pt-br"] = pt_br

    english = q.get("english", "")
    if english:
        en_us = make_empty_lang()
        en_us["question"] = english
        out["lang"]["en-us"] = en_us
    return out


# ---------------------------------------------------------------------------
# Tradução estrutural / preenchimento parcial
# ---------------------------------------------------------------------------


def fill_from_base(store, base_lang=DEFAULT_LANG):
    """
    Para questões incompletas, copia o conteúdo do base_lang para os idiomas
    ainda vazios. Não traduz — apenas propaga (útil durante autoria parcial).
    """
    count = 0
    for q in store.all_questions():
        lang = q.get("lang", {})
        base = lang.get(base_lang)
        if not base:
            continue
        for other in LANGS:
            if not lang.get(other) or not lang[other].get("question"):
                lang[other] = deepcopy(base)
                count += 1
    return count


def stats(store):
    """Estatísticas do banco para relatórios/CLI."""
    langs = {l: 0 for l in LANGS}
    by_cat = {}
    for q in store.all_questions():
        cat = q.get("category", "?")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        for l in LANGS:
            if q.get("lang", {}).get(l, {}).get("question"):
                langs[l] += 1
    return {"total": len(store.all_questions()), "by_category": by_cat, "by_language": langs}


if __name__ == "__main__":
    print("qa_core: use como módulo (import) ou via qa_cli.py / qa_gui.py / qa_web.py")
