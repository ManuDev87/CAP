#!/usr/bin/env python3
"""Build cap-app/src/data/help-bank.json from exam JSONs + the curated catalog.

Only stores entries with a verified source (catalog match or official `reference`
copied from sevilla_marzo_2024 and applied to the same question+answer pair).
The app generates a plantilla fallback at runtime for the rest — we never invent
article numbers.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from help_catalog import REFERENCE_URLS, RULES, Rule
from help_key import correct_text_of, help_key, norm_text

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "cap-app" / "src" / "data" / "exams"
OUT_PATH = ROOT / "cap-app" / "src" / "data" / "help-bank.json"

COMPILED: list[tuple[Rule, dict[str, list[re.Pattern[str]]]]] = []


def _compile_list(patterns: list[str]) -> list[re.Pattern[str]]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


def compile_rules() -> None:
    COMPILED.clear()
    for rule in RULES:
        COMPILED.append(
            (
                rule,
                {
                    "q_all": _compile_list(rule.q_all),
                    "q_any": _compile_list(rule.q_any),
                    "a_all": _compile_list(rule.a_all),
                    "a_any": _compile_list(rule.a_any),
                    "exclude_q": _compile_list(rule.exclude_q),
                },
            )
        )


def _ok(text: str, alls: list[re.Pattern[str]], anys: list[re.Pattern[str]]) -> bool:
    if alls and not all(p.search(text) for p in alls):
        return False
    if anys and not any(p.search(text) for p in anys):
        return False
    return True


def match_rule(question: str, answer: str) -> Rule | None:
    # Search topic keywords in question + official correct option. Generic
    # stems ("Señale la afirmación correcta") only become identifiable via the
    # answer; we still require a_all/a_any to match that same option.
    blob = f"{question}\n{answer}"
    best: tuple[int, Rule] | None = None
    for rule, rx in COMPILED:
        if rx["exclude_q"] and any(p.search(blob) for p in rx["exclude_q"]):
            continue
        if not _ok(blob, rx["q_all"], rx["q_any"]):
            continue
        if not _ok(answer, rx["a_all"], rx["a_any"]):
            continue
        score = (
            rule.priority * 100
            + len(rule.q_all) * 8
            + len(rule.a_all) * 10
            + len(rule.q_any)
            + len(rule.a_any)
        )
        if best is None or score > best[0]:
            best = (score, rule)
    return best[1] if best else None


def url_for_reference(ref: str) -> str | None:
    for pattern, url in REFERENCE_URLS:
        if re.search(pattern, ref, re.IGNORECASE):
            return url
    return None


def load_exams() -> list[tuple[str, list[dict]]]:
    out: list[tuple[str, list[dict]]] = []
    for path in sorted(EXAM_DIR.glob("*.json")):
        if path.name.startswith("_") or path.name == "help-bank.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list) or not data or "question" not in data[0]:
            continue
        out.append((path.stem, data))
    return out


def build() -> dict[str, dict]:
    compile_rules()
    exams = load_exams()

    # Official references from the one exam that already carries them.
    inherited: dict[str, str] = {}
    for exam_id, questions in exams:
        for q in questions:
            ref = (q.get("reference") or "").strip()
            if not ref:
                continue
            key = help_key(q["question"], correct_text_of(q))
            inherited[key] = ref

    bank: dict[str, dict] = {}
    stats = {
        "pairs": 0,
        "catalog": 0,
        "inherited": 0,
        "instances_catalog": 0,
        "instances_inherited": 0,
        "instances_total": 0,
    }

    seen_pairs: set[str] = set()
    for exam_id, questions in exams:
        for q in questions:
            question = q.get("question") or ""
            answer = correct_text_of(q)
            key = help_key(question, answer)
            stats["instances_total"] += 1

            rule = match_rule(question, answer)
            ref = (q.get("reference") or "").strip() or inherited.get(key)

            if key not in seen_pairs:
                seen_pairs.add(key)
                stats["pairs"] += 1

            entry: dict | None = None
            if rule:
                entry = {
                    "explanation": rule.explanation,
                    "source": rule.source,
                    "sourceUrl": rule.source_url,
                    "origin": "catalog",
                    "ruleId": rule.id,
                }
                if key not in bank or bank[key].get("origin") != "catalog":
                    stats["catalog"] += 1 if key not in bank or bank[key].get("origin") != "catalog" else 0
                stats["instances_catalog"] += 1
            elif ref:
                entry = {
                    "explanation": (
                        f"La plantilla oficial marca como correcta:\n\n«{answer.strip()}»\n\n"
                        f"Fundamento recogido en el examen de referencia: {ref}."
                    ),
                    "source": ref,
                    "sourceUrl": url_for_reference(ref),
                    "origin": "official-ref",
                }
                stats["instances_inherited"] += 1
                if key not in bank:
                    stats["inherited"] += 1

            if entry and (key not in bank or entry["origin"] == "catalog"):
                # Prefer catalog text over a bare reference when both exist.
                if key in bank and bank[key].get("origin") == "catalog" and entry["origin"] != "catalog":
                    continue
                bank[key] = {k: v for k, v in entry.items() if v is not None}

    # recount unique catalog vs inherited in the final bank
    stats["catalog"] = sum(1 for v in bank.values() if v["origin"] == "catalog")
    stats["inherited"] = sum(1 for v in bank.values() if v["origin"] == "official-ref")

    print(
        json.dumps(
            {
                "unique_pairs": stats["pairs"],
                "bank_entries": len(bank),
                "catalog_entries": stats["catalog"],
                "official_ref_entries": stats["inherited"],
                "instances_total": stats["instances_total"],
                "instances_with_catalog": stats["instances_catalog"],
                "instances_with_ref_only": stats["instances_inherited"],
                "instance_coverage_pct": round(
                    100
                    * (stats["instances_catalog"] + stats["instances_inherited"])
                    / max(stats["instances_total"], 1),
                    1,
                ),
            },
            indent=2,
        )
    )
    return bank


def self_check() -> None:
    compile_rules()
    cases = [
        (
            "Para sustituir la pausa de 45 minutos, en un período de 4 horas y media de conducción el conductor debe efectuar una pausa de al menos:",
            "15 minutos seguida de otra de al menos 30 minutos intercaladas.",
            "r561_pausa_45",
        ),
        (
            "¿Qué establece el convenio CMR?",
            "Las condiciones que rigen el contrato de transporte internacional de mercancías por carretera.",
            "cmr_que_establece",
        ),
        (
            "¿Cómo se denomina la comprobación periódica que realiza la Administración del mantenimiento, por parte del transportista, de los requisitos para ser titular de la autorización de transporte?",
            "Visado.",
            "visado",
        ),
        (
            "La energía cinética que posee un vehículo en movimiento depende de:",
            "su velocidad y su masa.",
            "energia_cinetica",
        ),
        (
            "¿Qué es la alcoholemia?",
            "La cantidad de alcohol presente en la sangre.",
            "alcohol_sangre",
        ),
        (
            "Las agencias de transporte de mercancías y los almacenistas-distribuidores contratarán:",
            "siempre en nombre propio.",
            "agencias_nombre_propio",
        ),
    ]
    failed = 0
    for q, a, expected in cases:
        rule = match_rule(q, a)
        got = rule.id if rule else None
        if got != expected:
            print(f"FAIL {expected}: got {got}\n  Q={q[:80]}\n  A={a}", file=sys.stderr)
            failed += 1
    if failed:
        raise SystemExit(f"self-check failed: {failed} case(s)")
    print("self-check: ok")


def main() -> None:
    self_check()
    bank = build()
    OUT_PATH.write_text(
        json.dumps(bank, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
