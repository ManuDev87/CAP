#!/usr/bin/env python3
"""Detect help text that is off-topic vs the question + official correct option.

Mimics the app: catalog bank first, then temario tips, then stem fallback.
Flags cases where the explanation talks about a different concept than Q+A.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_help_bank import compile_rules, load_exams, match_rule
from help_catalog import RULES as MERC_RULES
from help_catalog_viajeros import RULES as VIA_RULES
from help_key import correct_text_of, help_key
from help_temario import explanation_for as merc_tip
from help_temario_viajeros import explanation_for as via_tip

ROOT = Path(__file__).resolve().parents[1]
BANK_M = json.loads((ROOT / "cap-app/src/data/help-bank.json").read_text(encoding="utf-8"))
BANK_V = json.loads((ROOT / "cap-app/src/data/help-bank-viajeros.json").read_text(encoding="utf-8"))

STOP = {
    "para", "como", "esta", "este", "esto", "esos", "esas", "aquel", "aquella",
    "todo", "toda", "todos", "todas", "sobre", "entre", "desde", "hasta",
    "cuando", "donde", "cual", "cuales", "quien", "quienes", "porque", "segun",
    "hacia", "ante", "bajo", "durante", "mediante", "contra", "tras",
    "respuesta", "respuestas", "correcta", "correctas", "incorrecta", "incorrectas",
    "afirmacion", "afirmaciones", "siguiente", "siguientes", "anterior", "anteriores",
    "debe", "deben", "puede", "pueden", "podra", "podran", "sera", "seran",
    "tiene", "tienen", "hace", "caso", "forma", "parte", "tipo", "tipos",
    "tambien", "ademas", "mismo", "misma", "otros", "otras", "solo", "solamente",
    "ningun", "ninguna", "cualquier", "cualquiera", "siempre", "nunca",
    "articulo", "normativa", "temario", "oficial", "examen", "opcion", "opciones",
    "enunciado", "pregunta", "test", "alumno", "conductor", "conductores",
    "vehiculo", "vehiculos", "transporte", "empresa", "empresas",
    "real", "decreto", "reglamento", "ley", "texto", "consolidado",
    "boe", "lott", "rott", "anexo", "capitulo", "titulo",
}

ACCENT = str.maketrans(
    "áéíóúüñàèìòù",
    "aeiouunaeiou",
)


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").lower().translate(ACCENT)
    s = re.sub(r"[^a-z0-9áéíóúüñ]+", " ", s)
    return s.translate(ACCENT)


def tokens(s: str) -> set[str]:
    out = set()
    for w in fold(s).split():
        if len(w) < 4 or w in STOP or w.isdigit():
            continue
        out.add(w)
    return out


def overlap(a: set[str], b: set[str]) -> float:
    if not a:
        return 1.0
    return len(a & b) / len(a)


def is_stem_like(expl: str, question: str, answer: str) -> bool:
    """Runtime fallback copies the stem/answer; not a foreign tip."""
    af = fold(answer)
    ef = fold(expl)
    if len(af) > 12 and af[:40] in ef:
        return True
    qf = fold(question)
    if len(qf) > 20 and qf[:50] in ef:
        return True
    return False


def help_for(track: str, question: str, answer: str) -> tuple[str, str, str]:
    """Returns origin, explanation, rule_or_tip."""
    bank = BANK_V if track == "viajeros" else BANK_M
    key = help_key(question, answer)
    entry = bank.get(key)
    if entry:
        return "catalog", entry["explanation"], entry.get("ruleId") or "catalog"
    expl = (via_tip if track == "viajeros" else merc_tip)(question, answer)
    if expl:
        return "temario", expl, "tip"
    return "none", "", ""


def scan(track: str) -> list[dict]:
    compile_rules(VIA_RULES if track == "viajeros" else MERC_RULES)
    flagged = []
    seen: set[str] = set()
    for _exam, questions in load_exams(viajeros=(track == "viajeros")):
        for q in questions:
            question = q.get("question") or ""
            answer = correct_text_of(q)
            key = help_key(question, answer)
            if key in seen:
                continue
            seen.add(key)
            origin, expl, rid = help_for(track, question, answer)
            if origin == "none" or not expl:
                continue
            if is_stem_like(expl, question, answer):
                continue
            tq, ta, te = tokens(question), tokens(answer), tokens(expl)
            qa = tq | ta
            if len(te) < 4:
                continue
            expl_in_qa = overlap(te, qa)
            ans_in_expl = overlap(ta, te) if ta else 1.0
            # Off-topic: explanation barely shares words with Q+A and
            # the correct option is not reflected in the help.
            if expl_in_qa <= 0.18 and ans_in_expl <= 0.12:
                flagged.append(
                    {
                        "track": track,
                        "origin": origin,
                        "rule": rid,
                        "expl_in_qa": round(expl_in_qa, 3),
                        "ans_in_expl": round(ans_in_expl, 3),
                        "q": re.sub(r"\s+", " ", question)[:160],
                        "a": re.sub(r"\s+", " ", answer)[:120],
                        "e": re.sub(r"\s+", " ", expl)[:180],
                    }
                )
    flagged.sort(key=lambda r: (r["expl_in_qa"], r["ans_in_expl"]))
    return flagged


def main() -> None:
    rows = scan("mercancias") + scan("viajeros")
    by_rule: dict[str, int] = defaultdict(int)
    for r in rows:
        by_rule[f"{r['track']}:{r['origin']}:{r['rule']}"] += 1
    out = ROOT / "scripts" / "_help_alignment_report.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"flagged {len(rows)} unique pairs -> {out}")
    print("top clusters:")
    for k, n in sorted(by_rule.items(), key=lambda x: -x[1])[:25]:
        print(f"  {n:4}  {k}")
    print("\nworst 25:")
    for r in rows[:25]:
        print(f"- [{r['track']}/{r['origin']}/{r['rule']}] {r['expl_in_qa']}")
        print(f"  Q {r['q']}")
        print(f"  A {r['a']}")
        print(f"  E {r['e']}")


if __name__ == "__main__":
    main()
