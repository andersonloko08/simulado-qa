#!/usr/bin/env python3
"""
InterviewOps QA Editor — Interface de Linha de Comando (CLI).

Todas as operações delegam para qa_core (QAStore), garantindo as mesmas
regras de validação das interfaces GUI e Web.

Comandos:
    list                Lista questões (com filtros por categoria/idioma)
    add                 Adiciona uma questão interativamente
    edit                Edita uma questão existente
    delete              Remove uma questão
    validate            Valida o banco inteiro
    stats               Mostra estatísticas por categoria/idioma
    export              Exporta artefatos para o front (GitHub Pages)
    translate           Preenche idiomas vazios copiando de um idioma-base
    next-id             Mostra o próximo id disponível para uma categoria

Uso:
    python qa_cli.py list --category SQL
    python qa_cli.py add
    python qa_cli.py export
"""

import argparse
import json
import os
import sys
from qa_core import (
    QAStore,
    QAValidationError,
    LANGS,
    DEFAULT_LANG,
    TYPE_OPEN,
    TYPE_CHOICE,
    export_for_frontend,
    export_by_category,
    fill_from_base,
    stats,
    write_json,
)

DEFAULT_DB = os.path.join(
    os.path.dirname(__file__), "..", "..", "json", "questions.json"
)


def _resolve_store(args):
    """Instancia um QAStore apontando para o banco definido em args.db."""
    return QAStore(args.db)


# ---------------------------------------------------------------------------
# Comandos
# ---------------------------------------------------------------------------


def cmd_list(args):
    """
    Lista questões, com filtros opcionais por categoria, id e idioma.

    Para cada questão, imprime o id, categoria, dificuldade e o enunciado
    no idioma escolhido (padrão: pt-br).
    """
    store = _resolve_store(args)
    qs = store.all_questions()
    if args.category:
        qs = [q for q in qs if q.get("category") == args.category]
    if args.id:
        qs = [q for q in qs if q["id"] == args.id]
    if not qs:
        print("Nenhuma questão encontrada.")
        return
    for q in qs:
        text = q.get("lang", {}).get(args.lang, {}).get("question", "")
        print(f"[{q['id']}] ({q.get('category')}, {q.get('difficulty')})")
        print(f"    {text[:90]}")
    print(f"\nTotal: {len(qs)}")


def _input_multiline(prompt, allow_empty=True):
    """Lê uma resposta que pode ter múltiplas linhas (linha vazia encerra)."""
    print(prompt)
    print("(digite o texto; linha vazia para terminar)")
    lines = []
    while True:
        line = input("    > ")
        if line == "":
            break
        lines.append(line)
    if allow_empty or lines:
        return "\n".join(lines)
    return ""


def _input_list(prompt):
    """Lê uma lista de strings (uma por linha; vazia termina)."""
    print(prompt)
    items = []
    while True:
        line = input("    - ")
        if line == "":
            break
        items.append(line)
    return items


def _lang_editor(q, lang, qtype):
    print(f"\n=== Idioma: {lang} ===")
    data = q.get("lang", {}).setdefault(lang, {})

    if qtype == TYPE_CHOICE:
        print("\n[options] Alternativas (múltipla escolha)")
        opts = data.get("options", [])
        while True:
            try:
                n = int(input("  Quantas alternativas? [4]: ").strip() or "4")
                if n >= 2:
                    break
                print("  Mínimo de 2.")
            except ValueError:
                print("  Número inválido.")
        opts = [""] * n
        for i in range(n):
            opts[i] = input(f"  Alternativa {chr(65+i)}: ").strip()
        data["options"] = opts
        while True:
            try:
                ans = int(input("  Índice da correta (0,1,2,3...): ").strip())
                if 0 <= ans < len(opts):
                    q["answer"] = ans
                    break
                print(f"  Índice entre 0 e {len(opts)-1}.")
            except ValueError:
                print("  Número inválido.")

    for field, prompt in [
        ("question", "Enunciado da pergunta"),
        ("expectedAnswer", "Resposta esperada"),
        ("realExample", "Exemplo real"),
        ("english", "Versão em inglês"),
    ]:
        print(f"\n[{field}] {prompt}")
        current = data.get(field, "") or ""
        if current:
            print(f"  Atual: {current[:60]}")
            change = input("  Alterar? [s/N]: ").strip().lower()
            if change != "s":
                continue
        val = _input_multiline(f"  {prompt}:")
        if val:
            data[field] = val
    for field in ["followUps", "commonMistakes"]:
        print(f"\n[{field}]")
        current = data.get(field, []) or []
        if current:
            print(f"  Atual: {', '.join(str(c)[:30] for c in current)}")
            change = input("  Alterar? [s/N]: ").strip().lower()
            if change != "s":
                continue
        items = _input_list(f"  Itens de '{field}' (vazio termina):")
        if items:
            data[field] = items


def cmd_add(args):
    """
    Adiciona uma nova questão interativamente.

    Pede id (ou gera automaticamente pela categoria), categoria, dificuldade,
    tipo (aberta/múltipla escolha) e o conteúdo por idioma. Valida e salva no
    banco ao final.
    """
    store = _resolve_store(args)
    q = {"id": "", "category": "", "difficulty": "Média", "type": TYPE_OPEN, "lang": {}}
    q["id"] = input("ID (ex.: SQL-05) [vazio = auto]: ").strip()
    if not q["id"]:
        q["category"] = input("Categoria: ").strip()
        q["id"] = store.find_next_id(q["category"])
        print(f"  -> id gerado: {q['id']}")
    else:
        if store.get_question(q["id"]):
            print(f"ERRO: já existe '{q['id']}'")
            sys.exit(1)
        q["category"] = input("Categoria: ").strip()
    print("Dificuldade (Fácil/Média/Intermediária/Avançada) [Média]:")
    diff = input("> ").strip()
    q["difficulty"] = diff or "Média"
    print("Tipo (open = aberta / choice = múltipla escolha) [open]:")
    qtype = input("> ").strip().lower()
    q["type"] = TYPE_CHOICE if qtype == "choice" else TYPE_OPEN

    if args.lang == "all":
        for lang in LANGS:
            _lang_editor(q, lang, q["type"])
    else:
        _lang_editor(q, args.lang, q["type"])

    try:
        store.add_question(q)
        store.save()
        print(f"OK: questão '{q['id']}' adicionada.")
    except QAValidationError as e:
        print(f"ERRO: {e}")
        sys.exit(1)


def cmd_edit(args):
    """Edita uma questão existente por id, permitindo alterar idiomas escolhidos."""
    store = _resolve_store(args)
    qid = args.id or input("ID da questão: ").strip()
    q = store.get_question(qid)
    if not q:
        print(f"ERRO: '{qid}' não encontrada.")
        sys.exit(1)
    print(f"Editando [{q['id']}] ({q.get('category')})")
    if args.lang == "all":
        for lang in LANGS:
            _lang_editor(q, lang, q.get("type", TYPE_OPEN))
    else:
        _lang_editor(q, args.lang, q.get("type", TYPE_OPEN))
    store.save()
    print(f"OK: '{qid}' salva.")


def cmd_delete(args):
    """Remove uma questão por id, pedindo confirmação antes de executar."""
    store = _resolve_store(args)
    qid = args.id or input("ID da questão: ").strip()
    confirm = input(f"Remover '{qid}'? [s/N]: ").strip().lower()
    if confirm != "s":
        print("Cancelado.")
        return
    try:
        store.delete_question(qid)
        store.save()
        print(f"OK: '{qid}' removida.")
    except QAValidationError as e:
        print(f"ERRO: {e}")
        sys.exit(1)


def cmd_validate(args):
    """Valida o banco inteiro; sai com código 1 e lista de erros se houver problemas."""
    store = _resolve_store(args)
    errors = []
    for q in store.all_questions():
        try:
            from qa_core import validate_question

            validate_question(q, require_full=args.full)
        except QAValidationError as e:
            errors.append(f"{q.get('id', '?')}: {e}")
    if errors:
        print(f"{len(errors)} problema(s):")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("Banco OK.")


def cmd_stats(args):
    """Imprime estatísticas: total, distribuição por categoria e preenchimento por idioma."""
    store = _resolve_store(args)
    s = stats(store)
    print(f"Total de questões: {s['total']}")
    print("\nPor categoria:")
    for cat, n in sorted(s["by_category"].items()):
        print(f"  {cat}: {n}")
    print("\nPreenchimento por idioma (enunciado presente):")
    for lang, n in s["by_language"].items():
        print(f"  {lang}: {n}/{s['total']}")


def cmd_export(args):
    """
    Gera os artefatos para o front (GitHub Pages) em json/export/:
    questions_all.json (banco completo) e questions_by_category.json.
    """
    store = _resolve_store(args)
    out_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "json", "export"
    )
    flat = export_for_frontend(store)
    by_cat = export_by_category(store)
    p1 = write_json(flat, os.path.join(out_dir, "questions_all.json"))
    p2 = write_json(by_cat, os.path.join(out_dir, "questions_by_category.json"))
    print(f"Exportados:\n  {p1}\n  {p2}")


def cmd_translate(args):
    """Propaga o conteúdo de um idioma-base para os idiomas vazios (não traduz)."""
    store = _resolve_store(args)
    count = fill_from_base(store, args.base_lang)
    store.save()
    print(f"OK: {count} idioma(s) preenchido(s) a partir de '{args.base_lang}'.")


def cmd_next_id(args):
    """Imprime o próximo id disponível para a categoria informada."""
    store = _resolve_store(args)
    print(store.find_next_id(args.category))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def build_parser():
    p = argparse.ArgumentParser(description="InterviewOps QA Editor (CLI)")
    p.add_argument(
        "--db",
        default=DEFAULT_DB,
        help="Caminho do banco JSON (default: json/questions.json)",
    )
    sub = p.add_subparsers(dest="command", required=True)

    lp = sub.add_parser("list", help="Lista questões")
    lp.add_argument("--category", default=None)
    lp.add_argument("--id", default=None)
    lp.add_argument("--lang", default=DEFAULT_LANG, choices=LANGS)
    lp.set_defaults(func=cmd_list)

    ap = sub.add_parser("add", help="Adiciona questão")
    ap.add_argument("--lang", default="all", choices=LANGS + ["all"])
    ap.set_defaults(func=cmd_add)

    ep = sub.add_parser("edit", help="Edita questão")
    ep.add_argument("--id", default=None)
    ep.add_argument("--lang", default="all", choices=LANGS + ["all"])
    ep.set_defaults(func=cmd_edit)

    dp = sub.add_parser("delete", help="Remove questão")
    dp.add_argument("--id", default=None)
    dp.set_defaults(func=cmd_delete)

    vp = sub.add_parser("validate", help="Valida o banco")
    vp.add_argument("--full", action="store_true", help="Exige todos os idiomas")
    vp.set_defaults(func=cmd_validate)

    sp = sub.add_parser("stats", help="Estatísticas")
    sp.set_defaults(func=cmd_stats)

    xp = sub.add_parser("export", help="Exporta para o front")
    xp.set_defaults(func=cmd_export)

    tp = sub.add_parser("translate", help="Propaga idioma-base para os vazios")
    tp.add_argument("--base-lang", default=DEFAULT_LANG, choices=LANGS)
    tp.set_defaults(func=cmd_translate)

    np = sub.add_parser("next-id", help="Próximo id de uma categoria")
    np.add_argument("category")
    np.set_defaults(func=cmd_next_id)
    return p


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
