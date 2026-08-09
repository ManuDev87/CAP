"""
Convierte PDFs de Examenes CAP a JSON de la app.

Regiones:
  cataluna — questionari + plantilla-correccio (texto)
  valencia — EXAMEN + PLANTILLA (respuestas = casillas negras)
  extremadura — un solo PDF; la correcta va marcada con '*' junto a la opción

Filtros:
  - Solo mercancías
  - Cataluña: modelo A + castellano
  - Valencia: plantilla modelo A (casillas), sin ampliación
  - Extremadura: mercancías A (asterisco en opción correcta)

Uso:
  python scripts/ingest_exams.py --region cataluna
  python scripts/ingest_exams.py --region valencia
  python scripts/ingest_exams.py --region extremadura
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
    r"Lugar:.*|"
    r"MERCANC[IÍ]AS\s*A|"
    r"VIAJEROS\s*A|"
    r"P[aá]gina\s+\d+\s+de\s+\d+|"
    r"PREGUNTAS DE RESERVA:.*|"
    r"NOTA SOBRE LA CORRECCI[OÓ]N:.*"
    r")$",
    re.I,
)
# Cabeceras Extremadura / restos de Referencia entre preguntas
SKIP_LINE_RE = re.compile(
    r"^("
    r",|"
    r"\d+\s*MINUTOS?|"
    r"CENTRO REGIONAL DE TRANSPORTES\..*|"
    r"MODELO\s+[AB]|"
    r"MERCANC[IÍ]AS|"
    r"Certificado de Aptitud Profesional.*"
    r"|Examen para la obtenci[oó]n del.*"
    r"|(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA)\s+CONVOCATORIA.*"
    r")$",
    re.I,
)

PAGE_NUM_ONLY = re.compile(r"^\d{1,2}$")
# "12. Texto", "12 . Texto" (Álava), "12 Texto"
# Evitar horas tipo "00.00" / "24.00" (dígito justo tras el punto).
Q_START = re.compile(
    r"^(?:"
    # Evita falsos positivos en miles europeos: "3. 500 kg" / "3.500 kg"
    r"([1-9]\d{0,2})\s*\.(?!\s*\d)(\s*.+)"
    r"|"
    r"([1-9]\d{0,2})\s+([A-ZÁÉÍÓÚÜÑ¿¡].*)"
    r")$"
)
# Extremadura / Valencia / Cantabria: "* a) texto"
# Lookbehind: evita falsos positivos en "...encuentra)."
OPT_PAREN = re.compile(r"(?<![A-Za-zÁÉÍÓÚÜáéíóúüÑñ])(\*)?\s*([a-d])\)(?:\s+|$)", re.I)
# Álava: "a texto. b texto." (letra tras inicio de línea o tras ". ")
OPT_BARE = re.compile(r"(?:^|\.\s+)(\*)?\s*([a-d])\s+", re.I)
REF_LINE_RE = re.compile(r"^Referencia(\s+Legal)?:?", re.I)
FECHA_IN_TEXT = re.compile(
    r"Fecha:\s*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})", re.I
)
# "2 DE FEBRERO DE 2024" / "4 FEBRERO 2025" / "4 DIC 2025"
MONTH_ALIAS = {
    "enero": 1,
    "ene": 1,
    "febrero": 2,
    "feb": 2,
    "marzo": 3,
    "mar": 3,
    "abril": 4,
    "abr": 4,
    "mayo": 5,
    "may": 5,
    "junio": 6,
    "jun": 6,
    "julio": 7,
    "jul": 7,
    "agosto": 8,
    "ago": 8,
    "septiembre": 9,
    "sep": 9,
    "set": 9,
    "octubre": 10,
    "oct": 10,
    "noviembre": 11,
    "nov": 11,
    "diciembre": 12,
    "dic": 12,
}
_MONTH_ALT = "|".join(sorted(MONTH_ALIAS.keys(), key=len, reverse=True))
DATE_ES_TEXT = re.compile(
    rf"(?<!\d)(\d{{1,2}})\s+(?:DE\s+)?({_MONTH_ALT})\s+(?:DE\s+)?(\d{{4}})",
    re.I,
)

# Fechas en nombres Valencia: 31_05_2025, 28-01-2023, 15-07-23
DATE_IN_NAME = re.compile(
    r"(?<!\d)(\d{1,2})[-_/](\d{1,2})[-_/](\d{2,4})(?!\d)"
)
DATE_YYYYMMDD = re.compile(r"(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)")
DATE_DDMMYYYY = re.compile(r"(?<!\d)(\d{2})(\d{2})(20\d{2})(?!\d)")


def split_option_fragments(line: str) -> list[tuple[str | None, str, str]]:
    """Soporta 'a) texto', '* a) texto' y 'a texto. b texto.' (Álava)."""
    matches = list(OPT_PAREN.finditer(line))
    if matches:
        if matches[0].start() > 0 and line[: matches[0].start()].strip():
            return []
        out: list[tuple[str | None, str, str]] = []
        for i, m in enumerate(matches):
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(line)
            out.append((m.group(1), m.group(2).lower(), line[start:end].strip()))
        return out

    # Bare options: la línea debe empezar por a-d
    if not re.match(r"^(\*)?\s*[a-d]\s+\S", line, re.I):
        return []
    matches = list(OPT_BARE.finditer(line))
    if not matches:
        return []
    out: list[tuple[str | None, str, str]] = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(line)
        out.append((m.group(1), m.group(2).lower(), line[start:end].strip()))
    return out


def pdf_text(path: Path) -> str:
    """Texto en orden de lectura visual (y, x) para no mezclar columnas/bloques."""
    doc = fitz.open(path)
    parts: list[str] = []
    for page in doc:
        blocks = sorted(
            page.get_text("blocks"),
            key=lambda b: (round(b[1], 1), round(b[0], 1)),
        )
        for b in blocks:
            t = (b[4] or "").strip()
            if t:
                parts.append(t)
    return "\n".join(parts)


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


def is_junk_line(s: str) -> bool:
    if HEADER_RE.match(s) or SKIP_LINE_RE.match(s):
        return True
    if PAGE_NUM_ONLY.match(s) and len(s) <= 2:
        return True
    return False


def parse_questions(text: str) -> list[dict]:
    """Parse CAP text into question dicts. Si hay '* a)', incluye 'correct'."""
    raw_lines = [ln.rstrip() for ln in text.splitlines()]
    lines: list[str] = []
    for ln in raw_lines:
        s = ln.strip()
        if not s:
            continue
        # Mantener "Referencia:" como corte entre preguntas (Extremadura)
        if REF_LINE_RE.match(s):
            lines.append(s)
            continue
        if is_junk_line(s):
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
        while i < len(lines) and not split_option_fragments(lines[i]) and not Q_START.match(
            lines[i]
        ):
            if not is_junk_line(lines[i]):
                q_parts.append(lines[i])
            i += 1

        options: list[dict] = []
        correct: str | None = None
        while i < len(lines):
            frags = split_option_fragments(lines[i])
            if not frags:
                break
            i += 1
            for fi, (starred_mark, oid, first_text) in enumerate(frags):
                o_parts = [first_text] if first_text else []
                # Continuación solo tras el último fragmento de la línea
                if fi == len(frags) - 1:
                    while i < len(lines):
                        if REF_LINE_RE.match(lines[i]):
                            break
                        if split_option_fragments(lines[i]) or Q_START.match(lines[i]):
                            break
                        if is_junk_line(lines[i]):
                            i += 1
                            continue
                        o_parts.append(lines[i])
                        i += 1
                if starred_mark:
                    correct = oid
                options.append({"id": oid, "text": clean_join(o_parts)})
            if i < len(lines) and REF_LINE_RE.match(lines[i]):
                break

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
        # Re-partir opciones si el texto embebió "b ... c ..." (Álava)
        expanded: list[dict] = []
        for o in options:
            frags = split_option_fragments(f"{o['id']} {o['text']}")
            if len(frags) > 1:
                for star, oid, text in frags:
                    if star:
                        correct = oid
                    expanded.append({"id": oid, "text": text})
            else:
                expanded.append(o)
        seen = set()
        options = []
        for o in expanded:
            if o["id"] in seen or not o["text"]:
                continue
            seen.add(o["id"])
            options.append(o)
        if len(options) < 2:
            continue
        item: dict = {
            "num": num,
            "question": question_text,
            "options": options,
        }
        if correct:
            item["correct"] = correct
        questions.append(item)
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
    """Return YYYYMMDD or None from filename."""
    m = DATE_YYYYMMDD.search(name)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    m = DATE_DDMMYYYY.search(name)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    m = DATE_IN_NAME.search(name)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    m = DATE_ES_TEXT.search(name)
    if m:
        d = int(m.group(1))
        mo = MONTH_ALIAS[m.group(2).lower()]
        y = int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    return None


def parse_date_from_text(text: str) -> str | None:
    m = FECHA_IN_TEXT.search(text)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    m = DATE_ES_TEXT.search(text)
    if m:
        d = int(m.group(1))
        mo = MONTH_ALIAS[m.group(2).lower()]
        y = int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}{mo:02d}{d:02d}"
    return None


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


def _is_viajeros(name: str) -> bool:
    return bool(re.search(r"viajer|persona", name, re.I))


def _is_modelo_b(name: str) -> bool:
    return bool(
        re.search(
            r"modelo[-_\s]?b\b|examen\s*b\b|examb_|\bb_mercan|mercancias\s*b\b",
            name,
            re.I,
        )
    )


def _pick_prefer_modelo_a(files: list[Path]) -> list[Path]:
    if len(files) <= 1:
        return files
    a_files = [f for f in files if re.search(r"modelo[-_\s]?a\b|examena_|\ba_mercan", f.name, re.I)]
    return a_files if a_files else files


def find_filled_plantilla_pairs(pdf_root: Path, prefix: str) -> list[dict]:
    """
    Empareja EXAMEN + PLANTILLA mercancías (casillas negras), como Valencia.
    Usado por Valencia, Cantabria y Álava.
    """
    pairs: list[dict] = []
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(r"mercanc", f.name, re.I)
            and not re.search(r"plantilla", f.name, re.I)
            and not _is_viajeros(f.name)
            and not _is_modelo_b(f.name)
        ]
        # Preferir nombres con "examen" si hay varios
        named = [f for f in exams if re.search(r"examen", f.name, re.I)]
        if named:
            exams = named
        exams = _pick_prefer_modelo_a(exams)

        keys = [
            f
            for f in files
            if re.search(r"plantilla", f.name, re.I)
            and re.search(r"mercanc", f.name, re.I)
            and not _is_viajeros(f.name)
            and not _is_modelo_b(f.name)
        ]
        keys = _pick_prefer_modelo_a(keys)
        if not exams or not keys:
            continue

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
                date = exam_date or parse_date_from_name(key.name)
            elif exam_date:
                for kd, kf in keyed.items():
                    if kd[4:] == exam_date[4:]:
                        key = kf
                        break
            if not key:
                continue
            if not date:
                date = parse_date_from_text(pdf_text(exam)) or parse_date_from_name(
                    key.name
                )
            if not date:
                date = parse_date_from_text(pdf_text(key))
            if not date:
                # Último recurso: año de carpeta + mes estimado por nº convocatoria
                year = conv.parent.name if conv.parent.name.isdigit() else None
                conv_n = re.search(r"(\d)", conv.name)
                if year and conv_n:
                    # 1→feb, 2→abr, 3→jun, 4→ago, 5→oct, 6→dic (aprox. CAP)
                    month = {1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12}.get(
                        int(conv_n.group(1)), 1
                    )
                    date = f"{int(year):04d}{month:02d}01"
            if not date:
                continue

            eid, name = exam_id_from_date(prefix, date)
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
                    "region": prefix,
                }
            )
    return pairs


def find_valencia_pairs() -> list[dict]:
    return find_filled_plantilla_pairs(ROOT / "Examenes CAP" / "Valencia", "valencia")


def find_cantabria_pairs() -> list[dict]:
    return find_filled_plantilla_pairs(ROOT / "Examenes CAP" / "Cantabria", "cantabria")


def find_alava_pairs() -> list[dict]:
    return find_filled_plantilla_pairs(
        ROOT / "Examenes CAP" / "Examenes Pais Vasco" / "Alava", "alava"
    )


def find_extremadura_pairs() -> list[dict]:
    """Un solo PDF mercancías A con '*' en la opción correcta."""
    pdf_root = ROOT / "Examenes CAP" / "Extremadura"
    pairs: list[dict] = []
    for pdf in sorted(pdf_root.rglob("*.pdf")):
        if not re.search(r"mercanc", pdf.name, re.I):
            continue
        text = pdf_text(pdf)
        date = parse_date_from_name(pdf.name) or parse_date_from_text(text)
        if not date:
            continue
        eid, name = exam_id_from_date("extremadura", date)
        existing = [p for p in pairs if p["id"].startswith(eid)]
        if existing:
            eid = f"{eid}_{int(date[6:8])}"
            name = f"{name} ({int(date[6:8])})"
        pairs.append(
            {
                "id": eid,
                "name": name,
                "date": date,
                "year": date[:4],
                "convocatoria": pdf.parent.name,
                "exam_pdf": pdf,
                "key_pdf": pdf,
                "region": "extremadura",
            }
        )
    return pairs


FILLED_REGIONS = frozenset({"valencia", "cantabria", "alava"})


def convert_pair(pair: dict) -> list[dict]:
    q_text = pdf_text(pair["exam_pdf"])
    questions = parse_questions(q_text)

    if pair["region"] == "extremadura":
        exam: list[dict] = []
        for q in questions:
            n = int(q["num"])
            if n < 1 or n > 100:
                continue
            if "correct" not in q:
                raise ValueError(f"{pair['id']} Q{q['num']}: sin asterisco de respuesta")
            exam.append(
                {
                    "num": q["num"],
                    "question": q["question"],
                    "options": q["options"],
                    "correct": q["correct"],
                }
            )
        validate(exam, pair["id"])
        return exam

    if pair["region"] in FILLED_REGIONS:
        answers = parse_answer_key_valencia_filled(pair["key_pdf"])
    else:
        answers = parse_answer_key(pdf_text(pair["key_pdf"]))
    # Plantillas escaneadas (sin vectores/texto): usar clave OCR en scripts/answer_keys/
    if len(answers) < 90:
        sidecar = ROOT / "scripts" / "answer_keys" / f"{pair['id']}.json"
        if sidecar.exists():
            payload = json.loads(sidecar.read_text(encoding="utf-8"))
            answers = {
                str(k): str(v).lower()
                for k, v in (payload.get("answers") or payload).items()
                if str(v).lower() in "abcd"
            }
            print(f"  usando answer_keys/{sidecar.name} ({len(answers)} respuestas)")
    if len(answers) < 90:
        raise ValueError(
            f"{pair['id']}: plantilla con solo {len(answers)} respuestas"
        )
    exam = merge(questions, answers)
    validate(exam, pair["id"])
    return exam


def exam_signature(exam: list[dict]) -> dict[str, dict]:
    """Index by question num for comparison."""
    return {str(q["num"]): q for q in exam}


def diff_exams(saved: list[dict], fresh: list[dict]) -> list[str]:
    """Return human-readable diffs; empty if identical for practical purposes."""
    a = exam_signature(saved)
    b = exam_signature(fresh)
    msgs: list[str] = []
    only_a = sorted(set(a) - set(b), key=lambda x: int(x))
    only_b = sorted(set(b) - set(a), key=lambda x: int(x))
    if only_a:
        msgs.append(f"  solo en JSON guardado: {', '.join(only_a)}")
    if only_b:
        msgs.append(f"  solo en reextracción: {', '.join(only_b)}")
    for num in sorted(set(a) & set(b), key=lambda x: int(x)):
        qa, qb = a[num], b[num]
        if qa.get("correct") != qb.get("correct"):
            msgs.append(
                f"  Q{num} correct: JSON={qa.get('correct')} vs PDF={qb.get('correct')}"
            )
        if qa.get("question") != qb.get("question"):
            msgs.append(
                f"  Q{num} enunciado distinto"
                f"\n    JSON: {qa.get('question', '')[:120]}"
                f"\n    PDF:  {qb.get('question', '')[:120]}"
            )
        opts_a = {o["id"]: o["text"] for o in qa.get("options", [])}
        opts_b = {o["id"]: o["text"] for o in qb.get("options", [])}
        if set(opts_a) != set(opts_b):
            msgs.append(
                f"  Q{num} opciones ids: JSON={sorted(opts_a)} vs PDF={sorted(opts_b)}"
            )
        for oid in sorted(set(opts_a) & set(opts_b)):
            if opts_a[oid] != opts_b[oid]:
                msgs.append(
                    f"  Q{num} opción {oid} texto distinto"
                    f"\n    JSON: {opts_a[oid][:100]}"
                    f"\n    PDF:  {opts_b[oid][:100]}"
                )
    return msgs


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--region",
        choices=("cataluna", "valencia", "extremadura", "cantabria", "alava", "all"),
        default="cataluna",
    )
    ap.add_argument("--limit", type=int, default=0, help="Solo N primeros pares")
    ap.add_argument("--id", type=str, default="", help="Solo este exam id")
    ap.add_argument(
        "--audit",
        action="store_true",
        help="Reextrae y compara con JSON existentes; NO escribe ni modifica nada",
    )
    args = ap.parse_args()

    finders = {
        "cataluna": find_cataluna_pairs,
        "valencia": find_valencia_pairs,
        "extremadura": find_extremadura_pairs,
        "cantabria": find_cantabria_pairs,
        "alava": find_alava_pairs,
    }
    regions = list(finders) if args.region == "all" else [args.region]

    if args.audit:
        print("=== AUDITORÍA (solo lectura; no se modifica ningún JSON) ===\n")
        total_ok = total_diff = total_fail = total_missing = 0
        for region in regions:
            pairs = finders[region]()
            if args.id:
                pairs = [p for p in pairs if p["id"] == args.id]
            if args.limit:
                pairs = pairs[: args.limit]
            print(f"--- {region}: {len(pairs)} pares ---")
            for pair in pairs:
                out = OUT_DIR / f"{pair['id']}.json"
                if not out.exists():
                    print(f"MISSING {pair['id']}: no hay JSON en app")
                    total_missing += 1
                    continue
                try:
                    fresh = convert_pair(pair)
                    saved = json.loads(out.read_text(encoding="utf-8"))
                    diffs = diff_exams(saved, fresh)
                    if not diffs:
                        print(f"OK {pair['id']}: idéntico ({len(saved)} preguntas)")
                        total_ok += 1
                    else:
                        print(f"DIFF {pair['id']}: {len(diffs)} diferencia(s)")
                        for m in diffs[:40]:
                            print(m)
                        if len(diffs) > 40:
                            print(f"  ... y {len(diffs) - 40} más")
                        total_diff += 1
                except Exception as e:
                    print(f"FAIL {pair['id']}: {e}")
                    total_fail += 1
            print()
        print(
            f"Resumen: OK={total_ok} DIFF={total_diff} FAIL={total_fail} "
            f"MISSING={total_missing}"
        )
        print("Ningún archivo ha sido modificado.")
        return

    if args.region == "all":
        sys.exit("Para escribir usa --region concreta (no 'all'). Para revisar: --audit --region all")

    pairs = finders[args.region]()

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
