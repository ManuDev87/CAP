"""
Convierte PDFs de Examenes CAP a JSON de la app.

Regiones:
  cataluna — questionari + plantilla-correccio (texto)
  valencia — EXAMEN + PLANTILLA (respuestas = casillas negras)

Filtros:
  - Solo mercancías
  - Cataluña: modelo A + castellano
  - Valencia: plantilla modelo A (casillas), sin ampliación

Uso:
  python scripts/ingest_exams.py --region cataluna
  python scripts/ingest_exams.py --region valencia
  python scripts/ingest_exams.py --region valencia --limit 2
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("Necesitas PyMuPDF: pip install pymupdf")

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "cap-app" / "src" / "data" / "exams"

MONTHS_ES = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
}

HEADER_RE = re.compile(
    r"^("
    r"EXAMEN OBTENCI.*|"
    r"Examen:.*|"
    r"Fecha:.*|"
    r"Duraci[oó]n:.*|"
    r"PREGUNTAS DE RESERVA:.*|"
    r"NOTA SOBRE LA CORRECCI[OÓ]N:.*"
    r")$",
    re.I,
)

PAGE_NUM_ONLY = re.compile(r"^\d{1,2}$")
# "12. Texto", "12.Texto" o "12 Texto" (mayúscula).
# Evitar horas tipo "00.00" / "24.00" (dígito justo tras el punto).
Q_START = re.compile(
    r"^(?:"
    r"([1-9]\d{0,2})\.\s*(?!\d)(.+)"
    r"|"
    r"([1-9]\d{0,2})\s+([A-ZÁÉÍÓÚÜÑ¿¡].*)"
    r")$"
)
OPT_START = re.compile(r"^([a-d])\)\s*(.*)$", re.I)

# Fechas en nombres Valencia: 31_05_2025, 28-01-2023, 15-07-23
DATE_IN_NAME = re.compile(
    r"(?<!\d)(\d{1,2})[-_/](\d{1,2})[-_/](\d{2,4})(?!\d)"
)


def pdf_text(path: Path) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def parse_answer_key(text: str) -> dict[str, str]:
    """Cataluña: líneas 'N' / 'A|B|C|D'."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    answers: dict[str, str] = {}
    i = 0
    while i < len(lines) - 1:
        if re.fullmatch(r"\d{1,3}", lines[i]) and re.fullmatch(r"[ABCD]", lines[i + 1]):
            answers[lines[i]] = lines[i + 1].lower()
            i += 2
            continue
        i += 1
    return answers


def parse_answer_key_valencia_filled(path: Path) -> dict[str, str]:
    """
    Valencia: plantilla Ministerio con casillas A/B/C/D; la correcta está rellena en negro.
    Para cada número 1–100, toma las 4 casillas a la derecha en la misma fila.
    """
    doc = fitz.open(path)
    answers: dict[str, str] = {}

    for page in doc:
        words = page.get_text("words")
        nums: list[dict] = []
        for w in words:
            token = w[4]
            if token.isdigit() and 1 <= int(token) <= 100:
                nums.append(
                    {
                        "n": int(token),
                        "x": (w[0] + w[2]) / 2,
                        "y": (w[1] + w[3]) / 2,
                    }
                )

        cells: list[dict] = []
        for d in page.get_drawings():
            r = d.get("rect")
            fill = d.get("fill")
            if not r:
                continue
            w, h = r.width, r.height
            if not (25 < w < 35 and 8 < h < 16):
                continue
            is_black = bool(
                fill and fill[0] < 0.2 and fill[1] < 0.2 and fill[2] < 0.2
            )
            cells.append(
                {
                    "cx": r.x0 + w / 2,
                    "cy": r.y0 + h / 2,
                    "black": is_black,
                }
            )

        # "25" puede aparecer en la cabecera sin casillas; solo aceptamos
        # filas con 4 casillas y una negra. Si ya hay respuesta, no sobrescribir.
        for num in nums:
            key = str(num["n"])
            if key in answers:
                continue

            row = [
                c
                for c in cells
                if abs(c["cy"] - num["y"]) < 15
                and c["cx"] > num["x"] - 5
                and c["cx"] - num["x"] < 200
            ]
            row = sorted(row, key=lambda c: c["cx"])
            uniq: list[dict] = []
            for c in row:
                if not uniq or abs(c["cx"] - uniq[-1]["cx"]) > 10:
                    uniq.append(c)
                elif c["black"]:
                    uniq[-1] = c
            row = uniq[:4]
            blacks = [(i, c) for i, c in enumerate(row) if c["black"]]
            if len(blacks) == 1 and len(row) >= 4:
                answers[key] = "abcd"[blacks[0][0]]

    return answers


def clean_join(parts: list[str]) -> str:
    text = " ".join(p.strip() for p in parts if p.strip())
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_questions(text: str) -> list[dict]:
    """Parse CAP questionari text into question dicts (without correct)."""
    raw_lines = [ln.rstrip() for ln in text.splitlines()]
    lines: list[str] = []
    for ln in raw_lines:
        s = ln.strip()
        if not s:
            continue
        if HEADER_RE.match(s):
            continue
        if PAGE_NUM_ONLY.match(s) and len(s) <= 2:
            continue
        lines.append(s)

    questions: list[dict] = []
    i = 0
    while i < len(lines):
        m = Q_START.match(lines[i])
        if not m:
            i += 1
            continue
        num = m.group(1) or m.group(3)
        first = m.group(2) if m.group(1) else m.group(4)
        q_parts = [first] if first else []
        i += 1
        while i < len(lines) and not OPT_START.match(lines[i]) and not Q_START.match(
            lines[i]
        ):
            if not HEADER_RE.match(lines[i]) and not (
                PAGE_NUM_ONLY.match(lines[i]) and len(lines[i]) <= 2
            ):
                q_parts.append(lines[i])
            i += 1

        options: list[dict] = []
        while i < len(lines):
            om = OPT_START.match(lines[i])
            if not om:
                break
            oid = om.group(1).lower()
            o_parts = [om.group(2)] if om.group(2) else []
            i += 1
            while i < len(lines) and not OPT_START.match(lines[i]) and not Q_START.match(
                lines[i]
            ):
                if HEADER_RE.match(lines[i]):
                    i += 1
                    continue
                if PAGE_NUM_ONLY.match(lines[i]) and len(lines[i]) <= 2:
                    i += 1
                    continue
                o_parts.append(lines[i])
                i += 1
            options.append({"id": oid, "text": clean_join(o_parts)})

        question_text = clean_join(q_parts)
        if not question_text or len(options) < 2:
            continue
        seen: set[str] = set()
        uniq_opts: list[dict] = []
        for o in options:
            if o["id"] in seen:
                continue
            seen.add(o["id"])
            uniq_opts.append(o)
        options = uniq_opts
        if len(options) < 2:
            continue
        questions.append(
            {
                "num": num,
                "question": question_text,
                "options": options,
            }
        )
    return questions


def merge(questions: list[dict], answers: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for q in questions:
        num = q["num"]
        if num not in answers:
            continue
        correct = answers[num]
        ids = {o["id"] for o in q["options"]}
        if correct not in ids:
            raise ValueError(
                f"Pregunta {num}: correct={correct} no está en opciones {sorted(ids)}"
            )
        out.append(
            {
                "num": num,
                "question": q["question"],
                "options": q["options"],
                "correct": correct,
            }
        )
    return out


def validate(exam: list[dict], label: str) -> None:
    if len(exam) < 90:
        raise ValueError(f"{label}: solo {len(exam)} preguntas (esperado ~100)")
    nums = [q["num"] for q in exam]
    if len(nums) != len(set(nums)):
        raise ValueError(f"{label}: números duplicados")
    for q in exam:
        if len(q["options"]) < 2:
            raise ValueError(f"{label} Q{q['num']}: pocas opciones")
        if not any(o["id"] == q["correct"] for o in q["options"]):
            raise ValueError(f"{label} Q{q['num']}: correct inválido")
        for o in q["options"]:
            if not o["text"]:
                raise ValueError(f"{label} Q{q['num']} opción {o['id']}: texto vacío")


def exam_id_from_date(prefix: str, date_yyyymmdd: str) -> tuple[str, str]:
    y, m, d = int(date_yyyymmdd[:4]), int(date_yyyymmdd[4:6]), int(date_yyyymmdd[6:8])
    month = MONTHS_ES[m]
    eid = f"{prefix}_{month}_{y}"
    name = f"{month.capitalize()} {y}"
    return eid, name


def parse_date_from_name(name: str) -> str | None:
    """Return YYYYMMDD or None."""
    m = DATE_IN_NAME.search(name)
    if not m:
        return None
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    if not (1 <= mo <= 12 and 1 <= d <= 31):
        return None
    return f"{y:04d}{mo:02d}{d:02d}"


def find_cataluna_pairs() -> list[dict]:
    pdf_root = ROOT / "Examenes CAP" / "Cataluña"
    pairs: list[dict] = []
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(
                r"questionari.*mercaderies.*model-A.*castella", f.name, re.I
            )
        ]
        keys = [
            f
            for f in files
            if re.search(
                r"plantilla-correccio.*mercaderies.*model-A\.pdf$", f.name, re.I
            )
        ]
        if not exams or not keys:
            continue
        m = re.match(r"^(\d{8})", exams[0].name)
        if not m:
            continue
        date = m.group(1)
        eid, name = exam_id_from_date("cataluna", date)
        existing = [p for p in pairs if p["id"].startswith(eid)]
        if existing:
            eid = f"{eid}_{int(date[6:8])}"
            name = f"{name} ({int(date[6:8])})"
        pairs.append(
            {
                "id": eid,
                "name": name,
                "date": date,
                "year": conv.parent.name,
                "convocatoria": conv.name,
                "exam_pdf": exams[0],
                "key_pdf": keys[0],
                "region": "cataluna",
            }
        )
    return pairs


def find_valencia_pairs() -> list[dict]:
    pdf_root = ROOT / "Examenes CAP" / "Valencia"
    pairs: list[dict] = []
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(r"examen", f.name, re.I)
            and re.search(r"mercanc", f.name, re.I)
            and not re.search(r"plantilla", f.name, re.I)
        ]
        # Algunos exámenes se llaman solo "MERCANCIAS DD-MM-YY.pdf"
        if not exams:
            exams = [
                f
                for f in files
                if re.search(r"mercanc", f.name, re.I)
                and not re.search(r"plantilla", f.name, re.I)
            ]
        keys = [
            f
            for f in files
            if re.search(r"plantilla", f.name, re.I)
            and re.search(r"mercanc", f.name, re.I)
        ]
        if not exams or not keys:
            continue

        # Emparejar por fecha en el nombre
        keyed = {parse_date_from_name(k.name): k for k in keys}
        keyed.pop(None, None)

        for exam in exams:
            exam_date = parse_date_from_name(exam.name)
            key = None
            date = exam_date
            if exam_date and exam_date in keyed:
                key = keyed[exam_date]
            elif len(keys) == 1:
                key = keys[0]
                # Preferir fecha del examen (plantillas a veces tienen typo, p.ej. 2925)
                date = exam_date or parse_date_from_name(key.name)
            elif exam_date:
                # Misma carpeta, fechas cercanas: tomar la única key si hay una
                # o la que coincida en mes/día ignorando año tipográfico
                for kd, kf in keyed.items():
                    if kd[4:] == exam_date[4:]:
                        key = kf
                        break
            if not key or not date:
                continue

            eid, name = exam_id_from_date("valencia", date)
            existing = [p for p in pairs if p["id"].startswith(eid)]
            if existing:
                eid = f"{eid}_{int(date[6:8])}"
                name = f"{name} ({int(date[6:8])})"
            pairs.append(
                {
                    "id": eid,
                    "name": name,
                    "date": date,
                    "year": conv.parent.name,
                    "convocatoria": conv.name,
                    "exam_pdf": exam,
                    "key_pdf": key,
                    "region": "valencia",
                }
            )
    return pairs


def convert_pair(pair: dict) -> list[dict]:
    q_text = pdf_text(pair["exam_pdf"])
    questions = parse_questions(q_text)
    if pair["region"] == "valencia":
        answers = parse_answer_key_valencia_filled(pair["key_pdf"])
    else:
        answers = parse_answer_key(pdf_text(pair["key_pdf"]))
    if len(answers) < 90:
        raise ValueError(
            f"{pair['id']}: plantilla con solo {len(answers)} respuestas"
        )
    exam = merge(questions, answers)
    validate(exam, pair["id"])
    return exam


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--region",
        choices=("cataluna", "valencia"),
        default="cataluna",
    )
    ap.add_argument("--limit", type=int, default=0, help="Solo N primeros pares")
    ap.add_argument("--id", type=str, default="", help="Solo este exam id")
    args = ap.parse_args()

    if args.region == "valencia":
        pairs = find_valencia_pairs()
    else:
        pairs = find_cataluna_pairs()

    print(f"Pares {args.region} mercancías: {len(pairs)}")
    if args.id:
        pairs = [p for p in pairs if p["id"] == args.id]
    if args.limit:
        pairs = pairs[: args.limit]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    ok = 0
    for pair in pairs:
        try:
            exam = convert_pair(pair)
            out = OUT_DIR / f"{pair['id']}.json"
            out.write_text(
                json.dumps(exam, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            print(f"OK {pair['id']}: {len(exam)} preguntas -> {out.name}")
            manifest.append(
                {
                    "id": pair["id"],
                    "name": pair["name"],
                    "date": pair["date"],
                    "questions": len(exam),
                    "exam_pdf": str(pair["exam_pdf"].relative_to(ROOT)),
                    "key_pdf": str(pair["key_pdf"].relative_to(ROOT)),
                }
            )
            ok += 1
        except Exception as e:
            print(f"FAIL {pair['id']}: {e}")

    man_path = OUT_DIR / f"_{args.region}_manifest.json"
    man_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n{ok}/{len(pairs)} convertidos. Manifest: {man_path}")


if __name__ == "__main__":
    main()
