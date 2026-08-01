#!/usr/bin/env python3
"""
InterviewOps QA Editor — Interface Gráfica (Tkinter).

Consome o mesmo core (qa_core) que a CLI e o servidor web, garantindo que a
ferramenta é reutilizável e consistente em todas as interfaces.

Uso:
    python qa_gui.py
"""

import json
import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox

from qa_core import QAStore, QAValidationError, LANGS, DEFAULT_LANG, TYPE_OPEN, TYPE_CHOICE

DEFAULT_DB = os.path.join(os.path.dirname(__file__), "..", "..", "json", "questions.json")

FIELDS = [
    ("question", "Enunciado da pergunta"),
    ("expectedAnswer", "Resposta esperada"),
    ("realExample", "Exemplo real"),
    ("english", "Versão em inglês"),
]
LIST_FIELDS = [("followUps", "Follow-ups (um por linha)"), ("commonMistakes", "Erros comuns (um por linha)")]

OPTION_FIELD = "options"


class QAEditorApp:
    def __init__(self, root, db_path=DEFAULT_DB):
        self.root = root
        self.root.title("InterviewOps QA Editor — Multi-idioma")
        self.root.geometry("1200x760")
        self.store = QAStore(db_path)
        self.current_id = None
        self.lang_var = tk.StringVar(value="pt-br")
        self.type_var = tk.StringVar(value=TYPE_OPEN)
        self._build_layout()
        self._refresh_list()
        self._set_status()

    # ------------------------------------------------------------------ layout
    def _build_layout(self):
        paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # -- esquerda: lista
        left = ttk.Frame(paned)
        paned.add(left, weight=1)
        ttk.Label(left, text="Questões (duplo clique para editar)").pack(anchor="w")
        self.listbox = tk.Listbox(left, exportselection=False)
        self.listbox.pack(fill=tk.BOTH, expand=True, pady=(4, 8))
        self.listbox.bind("<Double-Button-1>", lambda e: self._load_selected())
        ttk.Button(left, text="Nova questão", command=self._new_question).pack(fill="x")
        ttk.Button(left, text="Salvar alterações", command=self._save).pack(fill="x", pady=(4, 0))
        ttk.Button(left, text="Remover selecionada", command=self._delete).pack(fill="x", pady=(4, 0))

        # -- direita: editor
        right = ttk.Frame(paned)
        paned.add(right, weight=3)
        top = ttk.Frame(right)
        top.pack(fill="x")
        ttk.Label(top, text="ID:").pack(side="left")
        self.entry_id = ttk.Entry(top, width=16)
        self.entry_id.pack(side="left", padx=(4, 12))
        ttk.Label(top, text="Categoria:").pack(side="left")
        self.entry_cat = ttk.Entry(top, width=20)
        self.entry_cat.pack(side="left", padx=(4, 12))
        ttk.Label(top, text="Dificuldade:").pack(side="left")
        self.combo_diff = ttk.Combobox(top, values=["Fácil", "Média", "Intermediária", "Avançada"],
                                       state="readonly", width=14)
        self.combo_diff.current(1)
        self.combo_diff.pack(side="left", padx=(4, 0))
        ttk.Label(top, text="Tipo:").pack(side="left", padx=(12, 4))
        self.combo_type = ttk.Combobox(top, values=[TYPE_OPEN, TYPE_CHOICE], state="readonly", width=10)
        self.combo_type.current(0)
        self.combo_type.pack(side="left")
        self.combo_type.bind("<<ComboboxSelected>>", lambda e: self._on_type_change())
        ttk.Label(top, text="Correta:").pack(side="left", padx=(12, 4))
        self.combo_answer = ttk.Combobox(top, values=[0, 1, 2, 3], state="readonly", width=5)
        self.combo_answer.current(0)
        self.combo_answer.pack(side="left")
        self._answer_widgets = (self.combo_answer,)

        # idiomas
        langbar = ttk.Frame(right)
        langbar.pack(fill="x", pady=(8, 4))
        ttk.Label(langbar, text="Idioma:").pack(side="left")
        for lang in LANGS:
            rb = ttk.Radiobutton(langbar, text=lang.upper(), value=lang,
                                 variable=self.lang_var, command=self._render_lang)
            rb.pack(side="left", padx=6)

        self.notebook = ttk.Notebook(right)
        self.notebook.pack(fill="both", expand=True, pady=(4, 8))
        self.editors = {}
        for lang in LANGS:
            frame = ttk.Frame(self.notebook)
            self.notebook.add(frame, text=lang)
            self.editors[lang] = self._build_lang_frame(frame)

        self.msg = ttk.Label(right, text="", foreground="#1d4ed8")
        self.msg.pack(anchor="w")

    def _build_lang_frame(self, frame):
        fields = {}
        for field, label in FIELDS:
            ttk.Label(frame, text=label).pack(anchor="w", pady=(6, 2))
            txt = tk.Text(frame, height=3)
            txt.pack(fill="x")
            fields[field] = txt
        # alternativas (múltipla escolha)
        opt_frame = ttk.LabelFrame(frame, text="Alternativas (múltipla escolha)")
        opt_frame.pack(fill="x", pady=(8, 2))
        fields[OPTION_FIELD] = []
        for i in range(4):
            ttk.Label(opt_frame, text=f"{chr(65+i)}:").pack(side="left", padx=(8, 2))
            entry = ttk.Entry(opt_frame)
            entry.pack(side="left", fill="x", expand=True, padx=(0, 4), pady=2)
            entry.bind("<Configure>", lambda e: None)
            fields[OPTION_FIELD].append(entry)
        for field, label in LIST_FIELDS:
            ttk.Label(frame, text=label).pack(anchor="w", pady=(6, 2))
            txt = tk.Text(frame, height=2)
            txt.pack(fill="x")
            fields[field] = txt
        return fields

    def _on_type_change(self):
        is_choice = self.combo_type.get() == TYPE_CHOICE
        self.combo_answer.config(state="readonly" if is_choice else "disabled")
        for lang in LANGS:
            for entry in self.editors[lang][OPTION_FIELD]:
                entry.config(state="normal" if is_choice else "disabled")

    # ------------------------------------------------------------------ dados
    def _qid(self, q):
        return q.get("id", "?")

    def _summary(self, q):
        text = (q.get("lang", {}).get("pt-br", {}).get("question") or self._qid(q))
        return f"{self._qid(q)}  [{q.get('category')}]  {text[:70]}"

    def _refresh_list(self):
        self.listbox.delete(0, tk.END)
        for q in self.store.all_questions():
            self.listbox.insert(tk.END, self._summary(q))
        self.listbox_var = self.store.all_questions()

    def _set_status(self):
        n = len(self.store.all_questions())
        self.root.title(f"InterviewOps QA Editor — {n} questões · {len(LANGS)} idiomas")

    # ------------------------------------------------------------------ ações
    def _new_question(self):
        self.current_id = None
        self.entry_id.delete(0, tk.END)
        self.entry_cat.delete(0, tk.END)
        self.combo_diff.current(1)
        self.combo_type.current(0)
        self.combo_answer.current(0)
        for lang, fields in self.editors.items():
            for txt in fields.values():
                if isinstance(txt, list):
                    for e in txt:
                        e.delete(0, tk.END)
                        e.config(state="disabled")
                else:
                    txt.delete("1.0", tk.END)
        self.combo_answer.config(state="disabled")
        self.entry_cat.focus_set()
        self.msg.config(text="Nova questão. Preencha e clique em Salvar.", foreground="#1d4ed8")

    def _load_selected(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        q = self.listbox_var[sel[0]]
        self.current_id = q["id"]
        self.entry_id.delete(0, tk.END)
        self.entry_id.insert(0, q["id"])
        self.entry_cat.delete(0, tk.END)
        self.entry_cat.insert(0, q.get("category", ""))
        self.combo_diff.set(q.get("difficulty", "Média"))
        qtype = q.get("type", TYPE_OPEN)
        self.combo_type.set(qtype)
        self.combo_answer.set(q.get("answer", 0))
        self._on_type_change()
        for lang, fields in self.editors.items():
            lang_data = q.get("lang", {}).get(lang, {})
            for field, txt in fields.items():
                if isinstance(txt, list):
                    opts = lang_data.get(OPTION_FIELD, []) or []
                    for i, entry in enumerate(txt):
                        entry.delete(0, tk.END)
                        if i < len(opts):
                            entry.insert(0, opts[i] or "")
                    continue
                txt.delete("1.0", tk.END)
                if field in lang_data:
                    val = lang_data[field]
                    if isinstance(val, list):
                        val = "\n".join(val)
                    txt.insert("1.0", val or "")
        self.msg.config(text=f"Editando {q['id']}", foreground="#1d4ed8")

    def _collect(self):
        lang_data = {}
        for lang, fields in self.editors.items():
            d = {}
            for field, txt in fields.items():
                if isinstance(txt, list):
                    d[OPTION_FIELD] = [e.get().strip() for e in txt]
                    continue
                val = txt.get("1.0", tk.END).strip("\n")
                if field in ("followUps", "commonMistakes"):
                    d[field] = [s.strip() for s in val.splitlines() if s.strip()]
                else:
                    d[field] = val
            lang_data[lang] = d
        return lang_data

    def _render_lang(self):
        # faz o notebook ir para a aba selecionada
        self.notebook.select(self.lang_var.get())

    def _save(self):
        qtype = self.combo_type.get() or TYPE_OPEN
        q = {
            "id": self.entry_id.get().strip(),
            "category": self.entry_cat.get().strip(),
            "difficulty": self.combo_diff.get(),
            "type": qtype,
            "lang": self._collect(),
        }
        if qtype == TYPE_CHOICE:
            q["answer"] = int(self.combo_answer.get() or 0)
        if not q["id"]:
            q["id"] = self.store.find_next_id(q["category"])
        try:
            if self.current_id and self.store.get_question(self.current_id):
                self.store.update_question(self.current_id, q)
            else:
                self.store.add_question(q)
            self.store.save()
            self.current_id = q["id"]
            self._refresh_list()
            self._set_status()
            self.msg.config(text=f"Salvo: {q['id']}", foreground="#15803d")
        except QAValidationError as e:
            messagebox.showerror("Erro de validação", str(e))

    def _delete(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        q = self.listbox_var[sel[0]]
        if messagebox.askyesno("Remover", f"Remover {q['id']}?"):
            try:
                self.store.delete_question(q["id"])
                self.store.save()
                self._refresh_list()
                self._set_status()
            except QAValidationError as e:
                messagebox.showerror("Erro", str(e))


def main():
    db = os.environ.get("QA_DB", DEFAULT_DB)
    root = tk.Tk()
    try:
        app = QAEditorApp(root, db_path=db)
    except Exception as e:
        root.destroy()
        raise SystemExit(f"Erro ao iniciar GUI: {e}")
    root.mainloop()


if __name__ == "__main__":
    main()
