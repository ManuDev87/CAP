"""
Ingest CAP viajeros (modelo A / Tipo 1 / castellano) from Examenes CAP PDFs.

Mirrors mercancías pipelines:
  - Cataluña: questionari + plantilla-correccio (texto)
  - Valencia / Cantabria / Álava: examen + plantilla de casillas negras
  - Extremadura-style: '*' junto a la opción (si aparece)
  - Guipúzcoa / Murcia: examen + plantilla (texto u OCR)
  - Galicia: cuaderno Identity-H + plantilla OCR
  - Andalucía: descarga opcional desde la Junta y mismo parser que mercancías

IDs: viajeros_{region}_{mes}_{año}

Uso:
  python scripts/ingest_viajeros.py --discover
  python scripts/ingest_viajeros.py --region all
  python scripts/ingest_viajeros.py --region cataluna
  python scripts/ingest_viajeros.py --audit --rounds 2
  python scripts/ingest_viajeros.py --write-catalog
  python scripts/ingest_viajeros.py --download-andalucia
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ingest_exams import (  # noqa: E402
    MONTHS_ES,
    OUT_DIR,
    ROOT,
    convert_pair as convert_text_pair,
    diff_exams,
    exam_id_from_date,
    merge,
    parse_answer_key,
    parse_answer_key_valencia_filled,
    parse_date_from_name,
    parse_date_from_text,
    parse_questions,
    pdf_text,
    validate,
)

PDF_ROOT = ROOT / "Examenes CAP"
CATALOG_TS = ROOT / "cap-app" / "src" / "lib" / "viajerosCatalog.ts"

VIAJEROS_NAME = re.compile(
    r"viajer|viaj[_-]|viaj\.|persona|viatger|viaxei|bidaiari|pasajer",
    re.I,
)
MODELO_B = re.compile(
    r"modelo[-_\s]?b\b|examen\s*b\b|examb_|viatgers-model-B|viaxeiros_B|"
    r"tipo\s*b\b|viajeros\s*b\b",
    re.I,
)
IS_KEY = re.compile(r"plantilla|respuesta|correccio|correcci[oó]n", re.I)
IS_EXAM = re.compile(r"examen|questionari|questionario", re.I)
UUID_NAME = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$",
    re.I,
)

ANDALUCIA_PROVS = {
    "almeria": "Almería",
    "cadiz": "Cádiz",
    "cordoba": "Córdoba",
    "granada": "Granada",
    "huelva": "Huelva",
    "jaen": "Jaén",
    "malaga": "Málaga",
    "sevilla": "Sevilla",
}

GALICIA_CONV_MONTH = {
    1: 1,
    2: 3,
    3: 5,
    4: 6,
    5: 7,
    6: 9,
    7: 10,
    8: 11,
}

HOUR_RE = re.compile(r"(\d{1,2})[.:](\d{2})")


def _is_viajeros_name(name: str) -> bool:
    return bool(VIAJEROS_NAME.search(name))


def _is_modelo_b(name: str) -> bool:
    return bool(MODELO_B.search(name))


def _pdf_kind(path: Path) -> str:
    try:
        text = pdf_text(path)[:4000]
    except Exception:
        return "unknown"
    if re.search(r"VIAJEROS|VIATGERS|VIAXEIROS|PERSONAS VIAJERAS|BIDAIARIAK", text, re.I):
        return "viajeros"
    if re.search(r"MERCANC|MERCADER|MERCADOR", text, re.I):
        return "mercancias"
    return "unknown"


def _uniq_id(eid: str, seen: set[str]) -> str:
    base = eid
    n = 2
    while eid in seen:
        eid = f"{base}_{n}"
        n += 1
    seen.add(eid)
    return eid


def _pair(
    eid: str,
    name: str,
    date: str,
    exam: Path,
    key: Path,
    parser_region: str,
    catalog_region: str,
) -> dict:
    return {
        "id": eid,
        "name": name,
        "date": date,
        "exam_pdf": exam,
        "key_pdf": key,
        "region": parser_region,
        "catalog_region": catalog_region,
    }


def _date_from_conv(conv: Path, month_map: dict[int, int]) -> str | None:
    year = conv.parent.name if conv.parent.name.isdigit() else None
    conv_n = re.search(r"(\d+)", conv.name)
    if year and conv_n:
        month = month_map.get(int(conv_n.group(1)), 1)
        return f"{int(year):04d}{month:02d}01"
    return None


# ---------- Finders ----------


def find_cataluna_pairs() -> list[dict]:
    pdf_root = PDF_ROOT / "Cataluña"
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(r"questionari.*viatgers.*model-A.*(castella|ESP)", f.name, re.I)
            and not re.search(r"catala|CAT\.pdf", f.name, re.I)
        ]
        keys = [
            f
            for f in files
            if re.search(r"plantilla-correccio.*viatgers.*model-A\.pdf$", f.name, re.I)
        ]
        if not exams or not keys:
            continue
        exam = exams[0]
        key = keys[0]
        m = re.match(r"^(\d{8})", exam.name)
        date = m.group(1) if m else parse_date_from_name(exam.name)
        if not date:
            continue
        eid, name = exam_id_from_date("viajeros_cataluna", date)
        eid = _uniq_id(eid, seen)
        if eid != f"viajeros_cataluna_{MONTHS_ES[int(date[4:6])]}_{int(date[:4])}":
            name = f"{name} ({int(date[6:8])})"
        pairs.append(_pair(eid, name, date, exam, key, "cataluna", "cataluna"))
    return pairs


def find_filled_viajeros_pairs(pdf_root: Path, prefix: str) -> list[dict]:
    """Valencia / Cantabria / Álava: examen + plantilla casillas."""
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    month_map = {1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12}
    if prefix == "alava":
        month_map = {1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11}

    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        named_viaj = [f for f in files if _is_viajeros_name(f.name) and not _is_modelo_b(f.name)]
        uuid_files = [f for f in files if UUID_NAME.match(f.name)]

        exams = [
            f
            for f in named_viaj
            if not IS_KEY.search(f.name)
        ]
        keys = [f for f in named_viaj if IS_KEY.search(f.name)]

        # UUID exams next to a viajeros plantilla
        if not exams and uuid_files and keys:
            for u in uuid_files:
                if _pdf_kind(u) == "viajeros":
                    exams.append(u)

        # "VIAJEROS 05-23.pdf" used as plantilla without the word plantilla
        if exams and not keys:
            leftovers = [
                f
                for f in named_viaj
                if f not in exams and not IS_EXAM.search(f.name)
            ]
            if len(leftovers) == 1:
                keys = leftovers
            elif len(named_viaj) == 2:
                a, b = named_viaj
                if IS_EXAM.search(a.name) and not IS_EXAM.search(b.name):
                    exams, keys = [a], [b]
                elif IS_EXAM.search(b.name) and not IS_EXAM.search(a.name):
                    exams, keys = [b], [a]

        if not exams or not keys:
            continue

        named_ex = [f for f in exams if IS_EXAM.search(f.name)]
        if named_ex:
            exams = named_ex
        # Prefer modelo A
        a_ex = [f for f in exams if re.search(r"modelo[-_\s]?a\b", f.name, re.I)]
        if a_ex:
            exams = a_ex
        a_keys = [f for f in keys if re.search(r"modelo[-_\s]?a\b", f.name, re.I)]
        if a_keys:
            keys = a_keys

        exam = exams[0]
        key = keys[0]
        folder_year = conv.parent.name if conv.parent.name.isdigit() else None

        def _valid_date(src: str | None) -> str | None:
            if not src:
                return None
            if folder_year and src[:4] != folder_year:
                return None
            return src

        date = (
            _valid_date(parse_date_from_name(exam.name))
            or _valid_date(parse_date_from_name(key.name))
            or parse_date_from_text(pdf_text(exam))
            or parse_date_from_text(pdf_text(key))
        )
        if date and folder_year and date[:4] != folder_year:
            date = None
        if not date:
            date = _date_from_conv(conv, month_map)
        if not date:
            continue
        eid, name = exam_id_from_date(f"viajeros_{prefix}", date)
        eid = _uniq_id(eid, seen)
        pairs.append(_pair(eid, name, date, exam, key, prefix, prefix))
    return pairs


def find_valencia_pairs() -> list[dict]:
    return find_filled_viajeros_pairs(PDF_ROOT / "Valencia", "valencia")


def find_cantabria_pairs() -> list[dict]:
    return find_filled_viajeros_pairs(PDF_ROOT / "Cantabria", "cantabria")


def find_alava_pairs() -> list[dict]:
    return find_filled_viajeros_pairs(
        PDF_ROOT / "Examenes Pais Vasco" / "Alava", "alava"
    )


def find_guipuzkoa_pairs() -> list[dict]:
    pdf_root = PDF_ROOT / "Examenes Pais Vasco" / "Guipuzkoa"
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    month_map = {1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11}
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams_a = [
            f
            for f in files
            if _is_viajeros_name(f.name)
            and "plantilla" not in f.name.lower()
            and "respuesta" not in f.name.lower()
            and not _is_modelo_b(f.name)
            and re.search(
                r"(?i)examena|_a_|a_viaj|examen-a|examen a_|viajeros examen-a|viajeros_a",
                f.name,
            )
        ]
        if not exams_a:
            exams_a = [
                f
                for f in files
                if _is_viajeros_name(f.name)
                and "plantilla" not in f.name.lower()
                and "respuesta" not in f.name.lower()
                and not _is_modelo_b(f.name)
            ]
        if not exams_a:
            continue
        exam = exams_a[0]

        keys = [
            f
            for f in files
            if IS_KEY.search(f.name)
            and (
                _is_viajeros_name(f.name)
                or re.search(r"a y b|mercancias a y b|plantillas respuestas", f.name, re.I)
            )
        ]
        if not keys:
            keys = [f for f in files if IS_KEY.search(f.name)]
        if not keys:
            continue
        # Prefer dedicated viajeros plantilla, else combined sheet
        dedicated = [
            k
            for k in keys
            if _is_viajeros_name(k.name) and not re.search(r"mercan", k.name, re.I)
        ]
        key = dedicated[0] if dedicated else keys[0]

        date = _date_from_conv(conv, month_map)
        if not date:
            date = parse_date_from_name(exam.name) or parse_date_from_name(key.name)
        if not date:
            continue
        eid, name = exam_id_from_date("viajeros_guipuzkoa", date)
        eid = _uniq_id(eid, seen)
        pairs.append(_pair(eid, name, date, exam, key, "guipuzkoa", "guipuzkoa"))
    return pairs


def find_murcia_pairs() -> list[dict]:
    pdf_root = PDF_ROOT / "Murcia"
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    month_map = {1: 1, 2: 3, 3: 5, 4: 7}
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if _is_viajeros_name(f.name)
            and not IS_KEY.search(f.name)
            and not _is_modelo_b(f.name)
            and re.search(r"tipo\s*1|_tipo 1", f.name, re.I)
        ]
        if not exams:
            exams = [
                f
                for f in files
                if _is_viajeros_name(f.name)
                and not IS_KEY.search(f.name)
                and not _is_modelo_b(f.name)
            ]
        keys = [
            f
            for f in files
            if IS_KEY.search(f.name)
            and _is_viajeros_name(f.name)
            and not _is_modelo_b(f.name)
        ]
        if not exams or not keys:
            continue
        exam, key = exams[0], keys[0]
        date = parse_date_from_name(exam.name) or _date_from_conv(conv, month_map)
        if not date:
            continue
        eid, name = exam_id_from_date("viajeros_murcia", date)
        eid = _uniq_id(eid, seen)
        pairs.append(_pair(eid, name, date, exam, key, "murcia", "murcia"))
    return pairs


def find_galicia_pairs() -> list[dict]:
    pdf_root = PDF_ROOT / "Galicia"
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf")) + list(conv.glob("*.pdf.pdf"))
        files = list({f.resolve(): f for f in files}.values())
        exams = [
            f
            for f in files
            if re.search(r"viaxei", f.name, re.I)
            and "plantilla" not in f.name.lower()
            and re.search(r"(?:^|[_\s.-])A(?:[_\s.-]|\.pdf|$)", f.name, re.I)
            and not re.search(r"(?:^|[_\s.-])B(?:[_\s.-]|\.pdf|$)", f.name, re.I)
        ]
        keys = [
            f
            for f in files
            if re.search(r"plantilla", f.name, re.I)
            and re.search(r"viaxei", f.name, re.I)
            and re.search(r"(?:^|[_\s.-])A(?:[_\s.-]|\.pdf|$)", f.name, re.I)
            and not re.search(r"(?:^|[_\s.-])B(?:[_\s.-]|\.pdf|$)", f.name, re.I)
        ]
        if not exams or not keys:
            continue
        exam, key = exams[0], keys[0]
        eh = None
        m = HOUR_RE.search(exam.name)
        if m:
            eh = f"{int(m.group(1)):02d}{m.group(2)}"
        date = parse_date_from_name(exam.name) or _date_from_conv(conv, GALICIA_CONV_MONTH)
        if not date:
            continue
        eid, name = exam_id_from_date("viajeros_galicia", date)
        if eh:
            eid = f"{eid}_{eh}"
            name = f"{name} ({eh[:2]}:{eh[2:]})"
        eid = _uniq_id(eid, seen)
        pairs.append(_pair(eid, name, date, exam, key, "galicia", "galicia"))
    return pairs


def find_andalucia_pairs() -> list[dict]:
    """Local Andalucía viajeros PDFs (after --download-andalucia)."""
    pdf_root = PDF_ROOT / "Andalucia"
    pairs: list[dict] = []
    seen: set[str] = set()
    if not pdf_root.exists():
        return pairs
    month_map = {1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11}
    prov_slug = {
        "almería": "almeria",
        "almeria": "almeria",
        "cádiz": "cadiz",
        "cadiz": "cadiz",
        "córdoba": "cordoba",
        "cordoba": "cordoba",
        "granada": "granada",
        "huelva": "huelva",
        "jaén": "jaen",
        "jaen": "jaen",
        "málaga": "malaga",
        "malaga": "malaga",
        "sevilla": "sevilla",
    }
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir():
            continue
        files = [f for f in conv.glob("*.pdf") if _is_viajeros_name(f.name)]
        files = [f for f in files if not _is_modelo_b(f.name)]
        if not files:
            continue
        exams = [f for f in files if not IS_KEY.search(f.name) or f.name.lower().startswith("exam_")]
        keys = [f for f in files if IS_KEY.search(f.name) and f.name.lower().startswith("key_")]
        if not keys:
            keys = [f for f in files if IS_KEY.search(f.name) and f not in exams]
        if not exams:
            continue
        # Combined asterisk PDF: exam == key
        exam = exams[0]
        key = keys[0] if keys else exam
        # Province from path
        slug = None
        for part in conv.parts:
            slug = prov_slug.get(part.lower())
            if slug:
                break
        if not slug:
            continue
        date = parse_date_from_name(exam.name) or _date_from_conv(conv, month_map)
        if not date:
            date = parse_date_from_text(pdf_text(exam))
        if not date:
            continue
        eid, name = exam_id_from_date(f"viajeros_{slug}", date)
        eid = _uniq_id(eid, seen)
        parser = "andalucia"
        pairs.append(_pair(eid, name, date, exam, key, parser, slug))
    return pairs


FINDERS = {
    "cataluna": find_cataluna_pairs,
    "valencia": find_valencia_pairs,
    "cantabria": find_cantabria_pairs,
    "alava": find_alava_pairs,
    "guipuzkoa": find_guipuzkoa_pairs,
    "murcia": find_murcia_pairs,
    "galicia": find_galicia_pairs,
    "andalucia": find_andalucia_pairs,
}


# ---------- Convert ----------


def parse_scanned_filled_grid(path: Path) -> dict[str, str]:
    """
    Plantilla Ministerio escaneada (sin vectores): 5 columnas × 20 filas.
    Top 5 filas = preguntas 1–25; resto = 26–100 en columna.
    La correcta es la casilla claramente más oscura de cada grupo A/B/C/D.
    """
    import cv2
    import fitz
    import numpy as np

    doc = fitz.open(path)
    answers: dict[str, str] = {}
    n_pages = len(doc)
    if n_pages >= 4:
        page_indices = [2, 0, 1, 3] + list(range(4, n_pages))
    elif n_pages == 2:
        page_indices = [1, 0]
    else:
        page_indices = list(range(n_pages))
    for pi in page_indices:
        page = doc[pi]
        pix = page.get_pixmap(matrix=fitz.Matrix(3.0, 3.0))
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        )
        if pix.n == 4:
            bgr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
        elif pix.n == 3:
            bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        else:
            bgr = cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        bw = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 31, 15
        )
        contours, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        raw: list[tuple[float, float, float, float, float]] = []
        for c in contours:
            x, y, cw, ch = cv2.boundingRect(c)
            if not (16 < cw < 70 and 8 < ch < 36):
                continue
            if cw / ch < 1.3 or cw / ch > 5.5:
                continue
            roi = gray[y : y + ch, x : x + cw]
            fill = 1.0 - (float(roi.mean()) / 255.0)
            raw.append((x + cw / 2, y + ch / 2, cw, ch, fill))
        if len(raw) < 200:
            continue
        mw = float(np.median([b[2] for b in raw]))
        mh = float(np.median([b[3] for b in raw]))
        boxes = [
            b
            for b in raw
            if abs(b[2] - mw) < 0.45 * mw and abs(b[3] - mh) < 0.55 * mh
        ]
        if len(boxes) < 200:
            continue
        boxes.sort(key=lambda b: b[1])
        rows: list[list] = []
        for b in boxes:
            if not rows or abs(b[1] - np.median([x[1] for x in rows[-1]])) > mh * 0.75:
                rows.append([b])
            else:
                rows[-1].append(b)
        twenty: list[list] = []
        for row in rows:
            row = sorted(row, key=lambda b: b[0])
            uniq: list = []
            for b in row:
                if not uniq or abs(b[0] - uniq[-1][0]) > mw * 0.55:
                    uniq.append(b)
                elif b[4] > uniq[-1][4]:
                    uniq[-1] = b
            if len(uniq) == 20:
                twenty.append(uniq)
        if len(twenty) < 18:
            continue
        twenty = twenty[:20]

        def letter_of(group: list) -> str | None:
            if len(group) < 4:
                return None
            group = sorted(group, key=lambda b: b[0])[:4]
            fills = [b[4] for b in group]
            dark = [i for i, f in enumerate(fills) if f >= 0.62]
            if len(dark) == 1:
                return "abcd"[dark[0]]
            hi = max(fills)
            second = sorted(fills, reverse=True)[1]
            if hi >= 0.70 and hi - second >= 0.18:
                return "abcd"[int(np.argmax(fills))]
            return None

        page_answers: dict[str, str] = {}
        for r, row in enumerate(twenty):
            for c in range(5):
                if r < 5:
                    n = c * 5 + r + 1
                else:
                    n = 26 + c * 15 + (r - 5)
                let = letter_of(row[c * 4 : (c + 1) * 4])
                if let and 1 <= n <= 100:
                    page_answers[str(n)] = let
        if len(page_answers) >= 90:
            answers = page_answers
            break
    return answers


def parse_guipuzkoa_viajeros_answer_text(path: Path) -> dict[str, str]:
    import fitz

    doc = fitz.open(path)
    full = "\n".join(page.get_text("text") for page in doc)
    if not full.strip():
        return {}
    combined = bool(
        re.search(r"MERCANC|SALGAIAK", full, re.I)
        and re.search(r"VIAJEROS|BIDAIARIAK", full, re.I)
    )
    if combined:
        m = re.search(
            r"(?:VIAJEROS|BIDAIARIAK)\s*A\b(.*?)(?:(?:VIAJEROS|BIDAIARIAK)\s*B\b|$)",
            full,
            re.S | re.I,
        )
        if not m:
            return {}
        chunk = m.group(1)
    else:
        chunk = full
    answers: dict[str, str] = {}
    for num, letter in re.findall(r"(\d{1,3})\s+([A-Da-d])\b", chunk):
        n = int(num)
        if 1 <= n <= 100 and num not in answers:
            answers[num] = letter.lower()
    return answers


def parse_ocr_viajeros_answers(path: Path) -> dict[str, str]:
    import ingest_guipuzkoa_murcia as gm

    ck = gm.cache_key(path, "viajeros_key_ocr_v1")
    if ck.exists():
        return json.loads(ck.read_text(encoding="utf-8"))

    import fitz

    doc = fitz.open(path)
    all_lines: list[dict] = []
    for page in doc:
        arr = gm.pixmap_bgr(page, scale=2.6)
        all_lines.extend(gm.ocr_image(arr))

    start_re = re.compile(r"VIAJEROS\s*A|BIDAIARIAK\s*A|PERSONAS VIAJERAS", re.I)
    end_re = re.compile(r"VIAJEROS\s*B|BIDAIARIAK\s*B", re.I)
    merc_re = re.compile(r"MERCANC|SALGAIAK", re.I)

    started = not any(start_re.search(L["text"]) for L in all_lines)
    # If the sheet is viajeros-only, take everything. If combined, wait for header.
    if any(start_re.search(L["text"]) for L in all_lines):
        started = False
    section: list[dict] = []
    for L in all_lines:
        t = L["text"].strip()
        if not started and start_re.search(t):
            started = True
            continue
        if started and end_re.search(t):
            break
        if started and merc_re.search(t) and not start_re.search(t):
            # mercancías header after we already captured viajeros? stop
            if section:
                break
            continue
        if started:
            section.append(L)

    answers: dict[str, str] = {}
    nums: list[dict] = []
    letters: list[dict] = []
    for L in section:
        t = L["text"].strip()
        if not t or gm.HEADER_SKIP.match(t):
            continue
        pair = re.fullmatch(r"(\d{1,3})\s*([A-Da-d])", t)
        if pair and 1 <= int(pair.group(1)) <= 100:
            answers.setdefault(pair.group(1), pair.group(2).lower())
            continue
        if re.fullmatch(r"\d{1,3}", t) and 1 <= int(t) <= 100:
            nums.append(L)
        elif re.fullmatch(r"[A-Da-d]", t):
            letters.append({**L, "text": t.lower()})
    for num in nums:
        key = num["text"]
        if key in answers:
            continue
        row = [
            L
            for L in letters
            if abs(L["y"] - num["y"]) < 18 and L["x"] > num["x"] - 5
        ]
        if not row:
            continue
        row.sort(key=lambda L: abs(L["x"] - num["x"]))
        answers[key] = row[0]["text"]

    ck.write_text(json.dumps(answers, ensure_ascii=False), encoding="utf-8")
    return answers


def convert_andalucia_pair(pair: dict) -> list[dict]:
    exam_pdf = pair["exam_pdf"]
    key_pdf = pair["key_pdf"]
    q_text = pdf_text(exam_pdf)
    qs = parse_questions(q_text)
    with_star = sum(1 for q in qs if "correct" in q)
    if with_star >= 80:
        tmp = dict(pair)
        tmp["region"] = "extremadura"
        tmp["key_pdf"] = exam_pdf
        return convert_text_pair(tmp)
    questions = qs
    answers = parse_answer_key_valencia_filled(key_pdf)
    if len(answers) < 90:
        answers = parse_answer_key(pdf_text(key_pdf))
    if len(answers) < 90:
        ktext = pdf_text(key_pdf)
        kqs = parse_questions(ktext)
        if sum(1 for q in kqs if "correct" in q) >= 80:
            tmp = dict(pair)
            tmp["region"] = "extremadura"
            tmp["exam_pdf"] = key_pdf
            tmp["key_pdf"] = key_pdf
            return convert_text_pair(tmp)
        answers = parse_scanned_filled_grid(key_pdf)
        if len(answers) < 90:
            raise ValueError(f"{pair['id']}: plantilla con solo {len(answers)} respuestas")
        print(f"  plantilla escaneada: {len(answers)} casillas", flush=True)
    exam = merge(questions, answers)
    validate(exam, pair["id"])
    return exam


def convert_gm_viajeros(pair: dict) -> list[dict]:
    import ingest_guipuzkoa_murcia as gm

    region = pair["region"]
    if region == "guipuzkoa":
        questions = gm.parse_guipuzkoa_questions(pair["exam_pdf"])
        answers = parse_guipuzkoa_viajeros_answer_text(pair["key_pdf"])
    else:
        questions = parse_questions(pdf_text(pair["exam_pdf"]))
        answers = {}

    sidecar = ROOT / "scripts" / "answer_keys" / f"{pair['id']}.json"
    if len(answers) < 90 and sidecar.exists():
        payload = json.loads(sidecar.read_text(encoding="utf-8"))
        raw = payload.get("answers") or payload
        answers = {
            str(k): str(v).lower()
            for k, v in raw.items()
            if str(v).lower() in "abcd"
        }
        print(f"  usando answer_keys/{sidecar.name} ({len(answers)})")

    if len(answers) < 90:
        scanned = parse_scanned_filled_grid(pair["key_pdf"])
        if len(scanned) >= 90:
            answers = scanned
            print(f"  plantilla escaneada: {len(answers)} casillas", flush=True)
    if len(answers) < 90:
        try:
            import ingest_galicia as gal

            table = gal.parse_answer_key_ocr(pair["key_pdf"])
            if len(table) >= 90:
                answers = table
                print(f"  plantilla tabla OCR: {len(answers)}", flush=True)
        except Exception:
            pass
    if len(answers) < 90:
        if region == "murcia":
            answers = gm.parse_murcia_omr_answers(pair["key_pdf"])
            if len(answers) < 90:
                answers = parse_ocr_viajeros_answers(pair["key_pdf"])
        else:
            answers = parse_ocr_viajeros_answers(pair["key_pdf"])

    if len(answers) < 90:
        raise ValueError(f"{pair['id']}: plantilla con solo {len(answers)} respuestas")
    if len(questions) < 90:
        raise ValueError(f"{pair['id']}: solo {len(questions)} preguntas parseadas")

    by_num: dict[str, dict] = {}
    for q in questions:
        q["options"] = sorted(q["options"], key=lambda o: o["id"])
        for o in q["options"]:
            o["id"] = o["id"].lower()
        prev = by_num.get(q["num"])
        if not prev or len(q["options"]) > len(prev["options"]):
            by_num[q["num"]] = q
    questions = [by_num[k] for k in sorted(by_num, key=int)]
    exam = merge(questions, answers)
    exam.sort(key=lambda q: int(q["num"]))
    validate(exam, pair["id"])
    return exam


def convert_filled_with_scan_fallback(pair: dict) -> list[dict]:
    try:
        return convert_text_pair(pair)
    except ValueError as exc:
        if "plantilla con solo" not in str(exc):
            raise
        answers = parse_scanned_filled_grid(pair["key_pdf"])
        if len(answers) < 90:
            sidecar = ROOT / "scripts" / "answer_keys" / f"{pair['id']}.json"
            if sidecar.exists():
                payload = json.loads(sidecar.read_text(encoding="utf-8"))
                raw = payload.get("answers") or payload
                answers = {
                    str(k): str(v).lower()
                    for k, v in raw.items()
                    if str(v).lower() in "abcd"
                }
        if len(answers) < 90:
            raise ValueError(
                f"{pair['id']}: plantilla escaneada con solo {len(answers)} respuestas"
            ) from exc
        questions = parse_questions(pdf_text(pair["exam_pdf"]))
        exam = merge(questions, answers)
        validate(exam, pair["id"])
        print(f"  plantilla escaneada: {len(answers)} casillas", flush=True)
        return exam


def convert_viajeros_pair(pair: dict) -> list[dict]:
    region = pair["region"]
    if region in {"cataluna", "valencia", "cantabria", "alava"}:
        exam = convert_filled_with_scan_fallback(pair)
    elif region == "galicia":
        import ingest_galicia as gal

        exam = gal.convert_pair(pair)
    elif region in {"guipuzkoa", "murcia"}:
        exam = convert_gm_viajeros(pair)
    elif region == "andalucia":
        exam = convert_andalucia_pair(pair)
    else:
        raise ValueError(f"región desconocida: {region}")
    sanity_answers(exam, pair["id"])
    return exam


def sanity_answers(exam: list[dict], label: str) -> None:
    letters = [q["correct"] for q in exam]
    counts = Counter(letters)
    if set(counts) - set("abcd"):
        raise ValueError(f"{label}: letras fuera de a-d: {sorted(counts)}")
    if max(counts.values()) > 55:
        raise ValueError(f"{label}: distribución anómala de respuestas {dict(counts)}")
    for q in exam:
        opt_ids = {o["id"] for o in q["options"]}
        if q["correct"] not in opt_ids:
            raise ValueError(f"{label} Q{q['num']}: {q['correct']} no está en {sorted(opt_ids)}")


# ---------- Catalog ----------


def display_name_from_id(eid: str) -> str:
    # viajeros_galicia_septiembre_2023_1000
    rest = eid[len("viajeros_") :]
    parts = rest.split("_")
    # last token year or hour
    hour = None
    year = None
    month = None
    if parts and parts[-1].isdigit() and len(parts[-1]) == 4 and parts[-1].startswith("20"):
        year = parts[-1]
        month = parts[-2] if len(parts) >= 2 else None
    elif parts and parts[-1].isdigit() and len(parts[-1]) in (3, 4) and len(parts) >= 3:
        hour = parts[-1]
        year = parts[-2]
        month = parts[-3]
    if month and year:
        name = f"{month.capitalize()} {year}"
        if hour and len(hour) == 4:
            name = f"{name} ({hour[:2]}:{hour[2:]})"
        elif hour:
            name = f"{name} ({hour})"
        return name
    return eid


def region_from_id(eid: str) -> str:
    rest = eid[len("viajeros_") :]
    for slug in list(ANDALUCIA_PROVS) + [
        "cataluna",
        "valencia",
        "cantabria",
        "alava",
        "guipuzkoa",
        "vizcaya",
        "galicia",
        "extremadura",
        "murcia",
    ]:
        if rest.startswith(slug + "_"):
            return slug
    return "unknown"


def write_catalog(ids: list[str] | None = None) -> None:
    files = sorted(OUT_DIR.glob("viajeros_*.json"))
    if ids:
        want = set(ids)
        files = [p for p in files if p.stem in want]
    by_reg: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for p in files:
        data = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(data, list) or len(data) < 90:
            continue
        eid = p.stem
        by_reg[region_from_id(eid)].append((eid, display_name_from_id(eid)))

    def sort_key(item: tuple[str, str]) -> tuple:
        eid = item[0]
        m = re.search(r"(20\d{2})", eid)
        year = int(m.group(1)) if m else 0
        month_name = None
        for i, mo in MONTHS_ES.items():
            if f"_{mo}_" in eid:
                month_name = i
                break
        extra = eid
        return (year, month_name or 0, extra)

    def tests_block(var: str, items: list[tuple[str, str]]) -> str:
        items = sorted(items, key=sort_key)
        lines = [f"const {var}: TestMeta[] = ["]
        for eid, name in items:
            lines.append(f'  {{ id: "{eid}", name: "{name}", img: "/img/bus1.jpg" }},')
        lines.append("];")
        return "\n".join(lines)

    chunks = [
        'import type { CommunityRegion, Question, TestMeta } from "./types";',
        "",
        tests_block("viajerosAlmeriaTests", by_reg.get("almeria", [])),
        "",
        tests_block("viajerosCadizTests", by_reg.get("cadiz", [])),
        "",
        tests_block("viajerosCordobaTests", by_reg.get("cordoba", [])),
        "",
        tests_block("viajerosGranadaTests", by_reg.get("granada", [])),
        "",
        tests_block("viajerosHuelvaTests", by_reg.get("huelva", [])),
        "",
        tests_block("viajerosJaenTests", by_reg.get("jaen", [])),
        "",
        tests_block("viajerosMalagaTests", by_reg.get("malaga", [])),
        "",
        tests_block("viajerosSevillaTests", by_reg.get("sevilla", [])),
        "",
        tests_block("viajerosCatalunaTests", by_reg.get("cataluna", [])),
        "",
        tests_block("viajerosValenciaTests", by_reg.get("valencia", [])),
        "",
        tests_block("viajerosCantabriaTests", by_reg.get("cantabria", [])),
        "",
        tests_block("viajerosAlavaTests", by_reg.get("alava", [])),
        "",
        tests_block("viajerosGuipuzkoaTests", by_reg.get("guipuzkoa", [])),
        "",
        tests_block("viajerosGaliciaTests", by_reg.get("galicia", [])),
        "",
        tests_block("viajerosExtremaduraTests", by_reg.get("extremadura", [])),
        "",
        tests_block("viajerosMurciaTests", by_reg.get("murcia", [])),
        "",
        "export const viajerosCommunityRegions: CommunityRegion[] = [",
        "  {",
        '    id: "andalucia",',
        '    name: "Andalucía",',
        "    tests: [],",
        "    subregions: [",
        '      { id: "almeria", name: "Almería", tests: viajerosAlmeriaTests },',
        '      { id: "cadiz", name: "Cádiz", tests: viajerosCadizTests },',
        '      { id: "cordoba", name: "Córdoba", tests: viajerosCordobaTests },',
        '      { id: "granada", name: "Granada", tests: viajerosGranadaTests },',
        '      { id: "huelva", name: "Huelva", tests: viajerosHuelvaTests },',
        '      { id: "jaen", name: "Jaén", tests: viajerosJaenTests },',
        '      { id: "malaga", name: "Málaga", tests: viajerosMalagaTests },',
        '      { id: "sevilla", name: "Sevilla", tests: viajerosSevillaTests },',
        "    ],",
        "  },",
        '  { id: "cataluna", name: "Cataluña", tests: viajerosCatalunaTests },',
        '  { id: "valencia", name: "Valencia", tests: viajerosValenciaTests },',
        '  { id: "cantabria", name: "Cantabria", tests: viajerosCantabriaTests },',
        "  {",
        '    id: "pais_vasco",',
        '    name: "País Vasco",',
        "    tests: [],",
        "    subregions: [",
        '      { id: "alava", name: "Álava", tests: viajerosAlavaTests },',
        '      { id: "guipuzkoa", name: "Guipúzcoa", tests: viajerosGuipuzkoaTests },',
        '      { id: "vizcaya", name: "Vizcaya", tests: [] },',
        "    ],",
        "  },",
        '  { id: "galicia", name: "Galicia", tests: viajerosGaliciaTests },',
        '  { id: "extremadura", name: "Extremadura", tests: viajerosExtremaduraTests },',
        '  { id: "murcia", name: "Murcia", tests: viajerosMurciaTests },',
        "];",
        "",
        "export const viajerosExamLoaders: Record<",
        "  string,",
        "  () => Promise<{ default: Question[] }>",
        "> = {",
    ]
    all_ids = []
    for items in by_reg.values():
        all_ids.extend(eid for eid, _ in items)
    all_ids.sort()
    for eid in all_ids:
        chunks.append(f'  {eid}: () => import("@/data/exams/{eid}.json"),')
    chunks.append("};")
    chunks.append("")
    CATALOG_TS.write_text("\n".join(chunks) + "\n", encoding="utf-8")
    print(f"Catálogo: {CATALOG_TS} ({len(all_ids)} tests)")


# ---------- Andalucía download ----------


def download_andalucia_viajeros() -> None:
    from ingest_andalucia_provincias import (
        MODELO_A,
        MODELO_B as AND_MODELO_B,
        SKIP_LINK,
        VIAJEROS,
        abs_url,
        fetch,
        month_for_conv,
        page_url,
        parse_page_sections,
        safe_name,
        YEARS,
    )
    import urllib.parse
    import urllib.request

    HAS_ANSWERS = re.compile(r"respuesta|corregid|con\s+respuestas|\*", re.I)

    def score_viaj(text: str, url: str, want_key: bool) -> int:
        blob = f"{text} {urllib.parse.unquote(url)}"
        if SKIP_LINK.search(blob):
            return -1000
        if re.search(r"mercanc|[/_-]mer[/_-]|_mer_", blob, re.I) and not VIAJEROS.search(blob):
            return -800
        if AND_MODELO_B.search(blob) and not MODELO_A.search(blob):
            return -500
        if not VIAJEROS.search(blob) and not re.search(r"[/_-]viaj", blob, re.I):
            return -50
        score = 40
        if MODELO_A.search(blob):
            score += 40
        if want_key:
            if re.search(r"plantilla|respuesta|correcci", blob, re.I):
                score += 30
        else:
            if re.search(r"examen", text, re.I):
                score += 20
            if HAS_ANSWERS.search(text):
                score += 15
        return score

    PDF_AND = PDF_ROOT / "Andalucia"
    for prov, label in ANDALUCIA_PROVS.items():
        for year in YEARS:
            url = page_url(prov, year) if prov != "sevilla" else (
                f"https://www.juntadeandalucia.es/organismos/fomentoymovilidad/"
                f"areas/servicios-transporte/servicios-transportista/paginas/"
                f"gestion-formacion-cap-sevilla{year}.html"
            )
            print(f"\n=== VIAJEROS {label} {year} ===")
            try:
                raw = fetch(url).decode("utf-8", "replace")
            except Exception as e:  # noqa: BLE001
                print(f"  FAIL page: {e}")
                continue
            sections = parse_page_sections(raw)
            print(f"  convocatorias: {len(sections)}")
            for sec in sections:
                links = list(sec.get("viajeros") or [])
                if not links:
                    continue
                ranked = sorted(
                    links, key=lambda lk: score_viaj(lk["text"], lk["url"], False), reverse=True
                )
                exam_like = [
                    lk
                    for lk in ranked
                    if re.search(r"examen", lk["text"], re.I)
                    and not re.match(r"^\s*plantilla", lk["text"], re.I)
                    and score_viaj(lk["text"], lk["url"], False) > 0
                ]
                best = exam_like[0] if exam_like else (ranked[0] if ranked else None)
                if not best or score_viaj(best["text"], best["url"], False) < 0:
                    print(f"  conv {sec['conv']}: sin PDF viajeros")
                    continue
                key = None
                for kc in sorted(
                    links, key=lambda lk: score_viaj(lk["text"], lk["url"], True), reverse=True
                ):
                    if kc["url"] == best["url"]:
                        continue
                    if score_viaj(kc["text"], kc["url"], True) < 50:
                        continue
                    if not re.search(r"plantilla|respuesta|correcci", f"{kc['text']} {kc['url']}", re.I):
                        continue
                    key = kc
                    break
                y, mo = month_for_conv(sec["conv"], year, best["url"], best["text"])
                month_name = MONTHS_ES[mo]
                dest_dir = PDF_AND / label / str(year) / f"conv_{sec['conv']:02d}_{month_name}"
                dest_dir.mkdir(parents=True, exist_ok=True)
                exam_fname = safe_name(Path(urllib.parse.urlparse(best["url"]).path).name)
                if not exam_fname.lower().endswith(".pdf"):
                    exam_fname += ".pdf"
                exam_path = dest_dir / f"exam_{exam_fname}"
                if not exam_path.exists():
                    print(f"  DL exam conv{sec['conv']}: {best['text'][:70]}")
                    exam_path.write_bytes(fetch(best["url"]))
                else:
                    print(f"  OK exam conv{sec['conv']}: {exam_path.name}")
                if key:
                    key_fname = safe_name(Path(urllib.parse.urlparse(key["url"]).path).name)
                    if not key_fname.lower().endswith(".pdf"):
                        key_fname += ".pdf"
                    key_path = dest_dir / f"key_{key_fname}"
                    if not key_path.exists():
                        print(f"  DL key  conv{sec['conv']}: {key['text'][:70]}")
                        key_path.write_bytes(fetch(key["url"]))
                    else:
                        print(f"  OK key  conv{sec['conv']}: {key_path.name}")


# ---------- Run ----------


def collect_pairs(regions: list[str]) -> list[dict]:
    out: list[dict] = []
    for r in regions:
        pairs = FINDERS[r]()
        print(f"  {r}: {len(pairs)} pares")
        out.extend(pairs)
    return out


def run_ingest(pairs: list[dict], skip_existing: bool = False) -> list[dict]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []
    ok = 0
    for pair in pairs:
        out = OUT_DIR / f"{pair['id']}.json"
        if skip_existing and out.exists():
            try:
                prev = json.loads(out.read_text(encoding="utf-8"))
                if len(prev) >= 90:
                    print(f"SKIP {pair['id']}: {len(prev)} preguntas")
                    manifest.append(
                        {
                            "id": pair["id"],
                            "name": pair["name"],
                            "date": pair["date"],
                            "questions": len(prev),
                            "catalog_region": pair["catalog_region"],
                            "exam_pdf": str(pair["exam_pdf"].relative_to(ROOT)),
                            "key_pdf": str(pair["key_pdf"].relative_to(ROOT)),
                        }
                    )
                    ok += 1
                    continue
            except Exception:
                pass
        try:
            print(f"INGEST {pair['id']} ...", flush=True)
            exam = convert_viajeros_pair(pair)
            out.write_text(
                json.dumps(exam, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            print(f"OK {pair['id']}: {len(exam)} preguntas", flush=True)
            manifest.append(
                {
                    "id": pair["id"],
                    "name": pair["name"],
                    "date": pair["date"],
                    "questions": len(exam),
                    "catalog_region": pair["catalog_region"],
                    "exam_pdf": str(pair["exam_pdf"].relative_to(ROOT)),
                    "key_pdf": str(pair["key_pdf"].relative_to(ROOT)),
                }
            )
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"FAIL {pair['id']}: {e}", flush=True)
    man_path = OUT_DIR / "_viajeros_manifest.json"
    man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{ok}/{len(pairs)} convertidos. Manifest: {man_path}")
    return manifest


def run_audit(pairs: list[dict], rounds: int = 2) -> None:
    print(f"=== AUDITORÍA VIAJEROS ({rounds} rondas; no modifica JSON) ===\n")
    for rnd in range(1, rounds + 1):
        print(f"--- Ronda {rnd}/{rounds} ---")
        ok = diff = fail = missing = 0
        for pair in pairs:
            out = OUT_DIR / f"{pair['id']}.json"
            if not out.exists():
                print(f"MISSING {pair['id']}")
                missing += 1
                continue
            try:
                saved = json.loads(out.read_text(encoding="utf-8"))
                fresh = convert_viajeros_pair(pair)
                msgs = diff_exams(saved, fresh)
                # Extra: only-answer comparison
                ans_diff = [
                    f"  Q{a['num']} letter {a['correct']} vs {b['correct']}"
                    for a, b in zip(saved, fresh)
                    if a.get("num") == b.get("num") and a.get("correct") != b.get("correct")
                ]
                if ans_diff and not any("correct:" in m for m in msgs):
                    msgs.extend(ans_diff)
                if not msgs:
                    print(f"OK {pair['id']}: idéntico ({len(saved)} preguntas)")
                    ok += 1
                else:
                    print(f"DIFF {pair['id']}: {len(msgs)} diferencia(s)")
                    for m in msgs[:25]:
                        print(m)
                    diff += 1
            except Exception as e:  # noqa: BLE001
                print(f"FAIL {pair['id']}: {e}")
                fail += 1
        print(f"Ronda {rnd}: OK={ok} DIFF={diff} FAIL={fail} MISSING={missing}\n")
    print("Ningún archivo ha sido modificado.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--region",
        default="",
        help="cataluna,valencia,cantabria,alava,guipuzkoa,murcia,galicia,andalucia,all",
    )
    ap.add_argument("--discover", action="store_true")
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--rounds", type=int, default=2)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--id", type=str, default="")
    ap.add_argument("--write-catalog", action="store_true")
    ap.add_argument("--download-andalucia", action="store_true")
    ap.add_argument("--skip-existing", action="store_true")
    args = ap.parse_args()

    if args.download_andalucia:
        download_andalucia_viajeros()
        if not args.region and not args.write_catalog and not args.discover:
            args.region = "andalucia"

    if args.write_catalog and not args.region and not args.audit and not args.discover:
        write_catalog()
        return

    region = args.region or ("all" if args.discover or args.audit else "")
    if not region:
        ap.error("indica --region, --discover, --audit, --write-catalog o --download-andalucia")

    regions = list(FINDERS) if region == "all" else [r.strip() for r in region.split(",")]
    for r in regions:
        if r not in FINDERS:
            sys.exit(f"región desconocida: {r}")

    print("Descubrimiento de pares viajeros:")
    pairs = collect_pairs(regions)
    if args.id:
        pairs = [p for p in pairs if p["id"] == args.id]
    if args.limit:
        pairs = pairs[: args.limit]

    if args.discover:
        for p in pairs:
            print(
                f"{p['id']:42} {p['name']:22} {p['exam_pdf'].name[:50]} | {p['key_pdf'].name[:40]}"
            )
        print(f"\nTotal: {len(pairs)}")
        return

    if args.audit:
        run_audit(pairs, rounds=args.rounds)
        return

    run_ingest(pairs, skip_existing=args.skip_existing)
    write_catalog()


if __name__ == "__main__":
    main()
