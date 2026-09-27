"""Limpia cabeceras/pies de PDF colados en exam JSON y parches puntuales de Sevilla.

No toca help-bank (regenerar con npm run build-help).
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_exams import (  # noqa: E402
    OUT_DIR,
    PDF_CHROME_RE,
    ROOT,
    parse_questions,
    pdf_text,
    strip_pdf_chrome,
)

UA = {"User-Agent": "Mozilla/5.0 (compatible; CAP-clean/1.0)"}

SEVILLA_TEXT = [
    (
        "sevilla_noviembre_2024",
        "6",
        "d",
        "la junta constituyente de la cooperativa.",
    ),
    (
        "sevilla_noviembre_2024",
        "58",
        "c",
        "El mecanismo diferencial.",
    ),
    (
        "sevilla_septiembre_2024",
        "13",
        "d",
        "solo a las operaciones de transporte por cuenta ajena por carretera.",
    ),
    (
        "sevilla_enero_2026",
        "87",
        "a",
        "Un servicio de información sobre la situación de sus cargas a las empresas contratantes de transporte.",
    ),
]

MARZO_URL = (
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/"
    "2024/03/examen_mer_se_cap2_2024.pdf"
)


def dump_exam(path: Path, data: list) -> None:
    raw = path.read_text(encoding="utf-8")
    pretty = raw.lstrip().startswith("[\n") or "\n  {" in raw[:120]
    if pretty:
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    else:
        path.write_text(
            json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )


def clean_exam(data: list) -> int:
    n = 0
    for q in data:
        qn = strip_pdf_chrome(q.get("question") or "")
        if qn != q.get("question"):
            q["question"] = qn
            n += 1
        for o in q.get("options") or []:
            ot = strip_pdf_chrome(o.get("text") or "")
            if ot != o.get("text"):
                o["text"] = ot
                n += 1
    return n


def patch_option(data: list, num: str, oid: str, text: str) -> bool:
    for q in data:
        if str(q.get("num")) != str(num):
            continue
        for o in q.get("options") or []:
            if o.get("id") == oid:
                if o.get("text") != text:
                    o["text"] = text
                    return True
                return False
    raise KeyError(f"Q{num} opción {oid} no encontrada")


def restore_marzo_2024(data: list, pdf: Path) -> int:
    fresh = parse_questions(pdf_text(pdf))
    by_num = {str(q["num"]): q for q in fresh}
    n = 0
    for q in data:
        num = str(q.get("num"))
        if int(num) > 100 or num not in by_num:
            continue
        fopts = {
            o["id"]: strip_pdf_chrome(o["text"]) for o in by_num[num].get("options") or []
        }
        for o in q.get("options") or []:
            ft = fopts.get(o["id"]) or ""
            jt = o.get("text") or ""
            if not ft or ft == jt:
                continue
            jn = jt.rstrip(" .")
            fn = ft.rstrip(" .")
            if fn.startswith(jn) and len(fn) > len(jn) + 8:
                o["text"] = ft
                n += 1
    return n


def remaining_chrome(data: list) -> int:
    n = 0
    for q in data:
        blob = q.get("question") or ""
        for o in q.get("options") or []:
            blob += "\n" + (o.get("text") or "")
        if PDF_CHROME_RE.search(blob):
            n += 1
    return n


def main() -> None:
    files = sorted(
        p for p in OUT_DIR.glob("*.json") if not p.name.startswith("_")
    )
    chrome_fields = 0
    changed_files = 0
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            continue
        n = clean_exam(data)
        if n:
            dump_exam(path, data)
            chrome_fields += n
            changed_files += 1
            print(f"  chrome {path.stem}: {n}")
    print(f"Coletillas: {chrome_fields} campos en {changed_files} exámenes")

    for eid, num, oid, text in SEVILLA_TEXT:
        path = OUT_DIR / f"{eid}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        if patch_option(data, num, oid, text):
            dump_exam(path, data)
            print(f"  parche {eid} Q{num} {oid}")
        else:
            print(f"  ya ok {eid} Q{num} {oid}")

    marzo_pdf = ROOT / "scripts" / "_tmp_sevilla_marzo.pdf"
    print("Descargando Sevilla marzo 2024…")
    req = urllib.request.Request(MARZO_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        marzo_pdf.write_bytes(resp.read())
    path = OUT_DIR / "sevilla_marzo_2024.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = restore_marzo_2024(data, marzo_pdf)
    if n:
        dump_exam(path, data)
    print(f"  sevilla_marzo_2024 opciones restauradas: {n}")
    marzo_pdf.unlink(missing_ok=True)

    left = 0
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            left += remaining_chrome(data)
    print(f"Preguntas que aún tienen chrome: {left}")


if __name__ == "__main__":
    main()
