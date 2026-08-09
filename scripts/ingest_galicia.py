"""
Ingest Galicia CAP mercancías Modelo A via OCR.

Los PDFs de Galicia usan fuentes con ToUnicode identidad (texto ilegible) y
plantillas dibujadas sin capa de texto. Por eso:

  - Preguntas: OCR de la mitad en CASTELLANO del cuaderno
  - Respuestas: OCR de la plantilla (tabla N / letra)

Ignora: Viaxeiros y Modelo B.

Uso:
  python scripts/ingest_galicia.py --limit 1
  python scripts/ingest_galicia.py
  python scripts/ingest_galicia.py --audit
  python scripts/ingest_galicia.py --audit --rounds 3
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import cv2
    import fitz
    import numpy as np
    from rapidocr_onnxruntime import RapidOCR
except ImportError:
    sys.exit(
        "Necesitas: pip install pymupdf rapidocr-onnxruntime opencv-python-headless numpy"
    )

# Reutilizar utilidades del ingest principal
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_exams import (  # noqa: E402
    MONTHS_ES,
    OUT_DIR,
    ROOT,
    exam_id_from_date,
    merge,
    parse_date_from_name,
    parse_date_from_text,
    parse_questions,
    validate,
)

PDF_ROOT = ROOT / "Examenes CAP" / "Galicia"
OCR_CACHE = ROOT / "scripts" / "_galicia_ocr_cache"
HEADER_SKIP = re.compile(
    r"^(Pagina\s*\d|EXAMEN|EXAME|Fecha:|Data:|Lugar:|Duraci|CASTELLANO|GALEGO|"
    r"MODELO|XUNTA|CONSELLER|RELACION|RESPOSTAS|Mercador|Test$|Profesional)",
    re.I,
)
ANS_TOKEN = re.compile(r"^(?:(\d{1,3})|([A-D]))$", re.I)
HOUR_RE = re.compile(r"(\d{1,2})[.:](\d{2})")


_OCR = None


def get_ocr() -> RapidOCR:
    global _OCR
    if _OCR is None:
        _OCR = RapidOCR()
    return _OCR


def cache_key(path: Path, tag: str) -> Path:
    h = hashlib.sha1(f"{path.resolve()}::{path.stat().st_mtime_ns}::{tag}".encode()).hexdigest()
    OCR_CACHE.mkdir(parents=True, exist_ok=True)
    return OCR_CACHE / f"{h}.json"


def pixmap_bgr(page: fitz.Page, scale: float = 2.2) -> np.ndarray:
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    if pix.n == 4:
        return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
    if pix.n == 3:
        return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    return arr


def ocr_image(arr: np.ndarray) -> list[dict]:
    result, _ = get_ocr()(arr)
    lines: list[dict] = []
    for box, text, conf in result or []:
        ys = [p[1] for p in box]
        xs = [p[0] for p in box]
        lines.append(
            {
                "text": (text or "").strip(),
                "y": sum(ys) / 4,
                "x": min(xs),
                "conf": float(conf or 0),
            }
        )
    lines.sort(key=lambda L: (round(L["y"] / 6) * 6, L["x"]))
    return lines


def ocr_page_cached(
    path: Path,
    page_index: int,
    scale: float = 2.2,
    rotate180: bool = False,
) -> list[dict]:
    tag = f"p{page_index}_s{scale}" + ("_r180" if rotate180 else "")
    ck = cache_key(path, tag)
    if ck.exists():
        return json.loads(ck.read_text(encoding="utf-8"))
    doc = fitz.open(path)
    arr = pixmap_bgr(doc[page_index], scale=scale)
    if rotate180:
        arr = cv2.rotate(arr, cv2.ROTATE_180)
    lines = ocr_image(arr)
    ck.write_text(json.dumps(lines, ensure_ascii=False), encoding="utf-8")
    return lines


def fix_ocr_spacing(text: str) -> str:
    """Heurística ligera: separa marcadores de pregunta/opción."""
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text)
    # "1.Como" / "24.Cual"
    text = re.sub(r"(?<=\d)\.(?=[A-Za-zÁÉÍÓÚáéíóúÜüÑñ¿¡])", ". ", text)
    # "a)Texto"
    text = re.sub(r"([a-d])\)(?=\S)", r"\1) ", text, flags=re.I)
    # Pegados frecuentes
    text = re.sub(r"([a-záéíóúñ])([A-ZÁÉÍÓÚÑ¿¡])", r"\1 \2", text)
    return text.strip()


def parse_answer_key_ocr(path: Path) -> dict[str, str]:
    """OCR plantilla y empareja número→letra por proximidad en la misma fila."""
    lines = ocr_page_cached(path, 0, scale=2.8)
    nums: list[dict] = []
    letters: list[dict] = []
    for L in lines:
        t = L["text"].strip()
        if not t or HEADER_SKIP.match(t):
            continue
        # "1 C" juntos
        pair = re.fullmatch(r"(\d{1,3})\s*([A-Da-d])", t)
        if pair:
            n = int(pair.group(1))
            if 1 <= n <= 100:
                nums.append({"n": n, "x": L["x"], "y": L["y"], "done": True})
                letters.append(
                    {
                        "L": pair.group(2).lower(),
                        "x": L["x"] + 40,
                        "y": L["y"],
                        "used": False,
                    }
                )
            continue
        if re.fullmatch(r"\d{1,3}", t):
            n = int(t)
            if 1 <= n <= 103:
                nums.append({"n": n, "x": L["x"], "y": L["y"], "done": False})
            continue
        if re.fullmatch(r"[A-Da-d]", t):
            letters.append({"L": t.lower(), "x": L["x"], "y": L["y"], "used": False})

    answers: dict[str, str] = {}
    for num in nums:
        if num.get("done"):
            continue
        # Letra a la derecha, misma fila
        cands = [
            let
            for let in letters
            if not let["used"]
            and abs(let["y"] - num["y"]) < 18
            and let["x"] > num["x"] - 5
        ]
        if not cands:
            continue
        cands.sort(key=lambda let: let["x"] - num["x"])
        let = cands[0]
        # No asociar si está demasiado lejos (siguiente columna)
        if let["x"] - num["x"] > 160:
            continue
        let["used"] = True
        if 1 <= num["n"] <= 100:
            answers[str(num["n"])] = let["L"]

    # Fallback secuencial si faltan muchas
    if len(answers) < 90:
        tokens: list[str] = []
        for L in sorted(lines, key=lambda z: (round(z["y"] / 8) * 8, z["x"])):
            t = L["text"].strip()
            parts = re.findall(r"\d{1,3}|[A-D]", t, flags=re.I)
            tokens.extend(parts)
        i = 0
        while i < len(tokens) - 1:
            if re.fullmatch(r"\d{1,3}", tokens[i]) and re.fullmatch(
                r"[A-Da-d]", tokens[i + 1]
            ):
                n = int(tokens[i])
                if 1 <= n <= 100 and str(n) not in answers:
                    answers[str(n)] = tokens[i + 1].lower()
                i += 2
                continue
            i += 1
    return answers


def is_castellano_page(lines: list[dict]) -> bool:
    blob = " ".join(L["text"] for L in lines)
    if re.search(r"CASTELLANO|obtenci[oó]n del CAP|Examen:", blob, re.I):
        return True
    if re.search(r"obtenci[oó]n do CAP|Exame:|Mercador[ií]as", blob, re.I):
        return False
    # Páginas centrales: castellano suele decir "Pagina X de 14" en la mitad final
    return bool(re.search(r"Pagina\s*\d+\s*de\s*14", blob, re.I)) and bool(
        re.search(r"\b(del|una|que|seg[uú]n|veh[ií]culo)\b", blob, re.I)
    )


def fix_mirrored_option_line(text: str) -> str:
    """Algunas líneas sueltas aún salen como OCR de texto invertido."""
    t = text.strip()
    if re.fullmatch(r"'?ON\s*\(?P\.?", t, re.I):
        return "d) No."
    if re.fullmatch(r"!?\s*S\s*\(?P\.?", t, re.I):
        return "d) Si."
    return text


def merge_ocr_scales(
    path: Path,
    page_index: int,
    scales: tuple[float, ...] = (2.5, 3.0),
    rotate180: bool = True,
) -> list[dict]:
    """
    Fusiona OCR a varias escalas. Páginas castellano del cuaderno Galicia
    van boca abajo en el PDF → rotate180=True.
    """
    by_norm: dict[tuple[int, int], dict] = {}
    for scale in scales:
        for L in ocr_page_cached(path, page_index, scale=scale, rotate180=rotate180):
            t = (L["text"] or "").strip()
            if not t:
                continue
            # Normalizar coords al espacio scale=1
            ny = L["y"] / scale
            nx = L["x"] / scale
            key = (int(round(ny / 4.0) * 4), int(round(nx / 8.0) * 8))
            cand = {
                "text": t,
                "y": ny,
                "x": nx,
                "conf": float(L.get("conf") or 0),
                "scale": scale,
            }
            prev = by_norm.get(key)
            if prev is None:
                by_norm[key] = cand
                continue
            # Preferir: marcador de pregunta/opción, luego más largo, luego más conf
            def score(z: dict) -> tuple:
                tx = z["text"]
                marker = 1 if re.match(r"^(\d{1,3}\.|[a-dA-D]\))", tx) else 0
                return (marker, len(tx), z["conf"], z["scale"])

            if score(cand) > score(prev):
                by_norm[key] = cand
    lines = list(by_norm.values())
    lines.sort(key=lambda L: (round(L["y"] / 3) * 3, L["x"]))
    return lines


def parse_questions_galicia_ocr(text: str) -> list[dict]:
    """Parser OCR Galicia: normaliza C), recupera opciones huérfanas en huecos."""
    text = text.replace("\u00a0", " ").replace("\uff09", ")")
    text = re.sub(r"\bC\)", "c)", text)
    text = re.sub(r"(?<=\d)\.(?=\S)", ". ", text)
    text = re.sub(r"([a-dA-D])\)(?=\S)", r"\1) ", text)
    lines = [
        fix_mirrored_option_line(ln.strip()) for ln in text.splitlines() if ln.strip()
    ]

    Q = re.compile(r"^(\d{1,3})\.\s*(.*)$")
    O = re.compile(r"^([a-d])\)\s*(.*)$", re.I)

    blocks: list[dict] = []
    i = 0
    while i < len(lines):
        mq = Q.match(lines[i])
        if mq:
            num = mq.group(1)
            q_parts = [mq.group(2)] if mq.group(2) else []
            i += 1
            while i < len(lines) and not O.match(lines[i]) and not Q.match(lines[i]):
                q_parts.append(lines[i])
                i += 1
            options: list[dict] = []
            while i < len(lines):
                mo = O.match(lines[i])
                if not mo:
                    break
                oid = mo.group(1).lower()
                o_parts = [mo.group(2)] if mo.group(2) else []
                i += 1
                while i < len(lines) and not O.match(lines[i]) and not Q.match(lines[i]):
                    o_parts.append(lines[i])
                    i += 1
                options.append(
                    {"id": oid, "text": re.sub(r"\s+", " ", " ".join(o_parts)).strip()}
                )
            seen: set[str] = set()
            uniq = []
            for o in options:
                if o["id"] in seen or not o["text"]:
                    continue
                seen.add(o["id"])
                uniq.append(o)
            blocks.append(
                {
                    "num": num,
                    "question": re.sub(r"\s+", " ", " ".join(q_parts)).strip()
                    or f"Pregunta {num}",
                    "options": sorted(uniq, key=lambda o: o["id"]),
                }
            )
            continue

        mo = O.match(lines[i])
        if mo:
            options = []
            while i < len(lines):
                mo = O.match(lines[i])
                if not mo:
                    break
                oid = mo.group(1).lower()
                o_parts = [mo.group(2)] if mo.group(2) else []
                i += 1
                while i < len(lines) and not O.match(lines[i]) and not Q.match(lines[i]):
                    o_parts.append(lines[i])
                    i += 1
                options.append(
                    {"id": oid, "text": re.sub(r"\s+", " ", " ".join(o_parts)).strip()}
                )
            seen = set()
            uniq = []
            for o in options:
                if o["id"] in seen or not o["text"]:
                    continue
                seen.add(o["id"])
                uniq.append(o)
            if len(uniq) >= 2:
                blocks.append({"num": None, "question": None, "options": sorted(uniq, key=lambda o: o["id"])})
            continue
        i += 1

    used = {int(b["num"]) for b in blocks if b["num"]}
    numbered = [b for b in blocks if b["num"] is not None]
    orphans = [b for b in blocks if b["num"] is None]
    max_n = max(used) if used else 0
    gaps = [n for n in range(1, max_n + 1) if n not in used]
    out: list[dict] = list(numbered)
    for gap, orphan in zip(gaps, orphans):
        out.append(
            {
                "num": str(gap),
                "question": f"Pregunta {gap}",
                "options": orphan["options"],
            }
        )
        used.add(gap)
    for orphan in orphans[len(gaps) :]:
        max_n += 1
        while max_n in used:
            max_n += 1
        out.append(
            {
                "num": str(max_n),
                "question": f"Pregunta {max_n}",
                "options": orphan["options"],
            }
        )
        used.add(max_n)

    by_num: dict[str, dict] = {}
    for q in out:
        n = q["num"]
        if n not in by_num or len(q["options"]) > len(by_num[n]["options"]):
            by_num[n] = q
    return [by_num[k] for k in sorted(by_num, key=lambda x: int(x))]


def decode_galicia_pdf_text(text: str) -> str:
    """
    Decodifica las fuentes Identity-H usadas en los cuadernos de Galicia.

    Los glifos aparecen en el área privada U+F000..U+F0FF y, salvo el
    espacio, su código real es 0x120 menos el byte bajo del glifo.
    """
    decoded: list[str] = []
    for char in text:
        code = ord(char)
        if 0xF000 <= code <= 0xF0FF:
            low = code & 0xFF
            decoded.append(" " if low == 0x20 else chr(0x120 - low))
        else:
            decoded.append(char)
    return "".join(decoded)


def extract_exam_native_text(path: Path) -> str:
    """Extrae y ordena la mitad castellana sin OCR."""
    doc = fitz.open(path)
    pages: list[tuple[int, str]] = []
    for page_index in range(len(doc) // 2, len(doc)):
        text = decode_galicia_pdf_text(doc[page_index].get_text("text"))
        question_numbers = [
            int(n) for n in re.findall(r"(?m)^\s*(\d{1,3})\.\s+", text)
        ]
        if not question_numbers:
            continue
        pages.append((min(question_numbers), text))

    pages.sort(key=lambda item: item[0])
    return "\n".join(text for _, text in pages)


def extract_exam_ocr_text(path: Path) -> str:
    """OCR páginas castellano rotadas 180° (cuaderno boca abajo en el PDF)."""
    # v8: una sola escala 2.5 (con rot180 basta y va ~2x más rápido)
    ck = cache_key(path, "exam_castellano_v8_rot180_s25")
    if ck.exists():
        return ck.read_text(encoding="utf-8")

    doc = fitz.open(path)
    n = len(doc)
    # Convención: 1ª mitad gallego, 2ª mitad castellano boca abajo (≈14 págs)
    start = max(0, n // 2)
    page_texts: list[tuple[int, str]] = []
    for pi in range(start, n):
        print(f"  OCR exam p{pi+1}/{n} (rot180 s2.5)", flush=True)
        lines = merge_ocr_scales(path, pi, scales=(2.5,), rotate180=True)
        if not is_castellano_page(lines) and pi < n - 1:
            blob0 = " ".join(L["text"] for L in lines[:8])
            if re.search(r"GALEGO|obtenci[oó]n do", blob0, re.I) and not re.search(
                r"CASTELLANO|obtenci[oó]n del", blob0, re.I
            ):
                continue
        blob = " ".join(L["text"] for L in lines)
        m = re.search(r"Pagina\s*(\d+)\s*de\s*14", blob, re.I)
        cuaderno_n = int(m.group(1)) if m else (1000 + pi)
        kept: list[str] = []
        for L in lines:
            t = L["text"].strip()
            if not t or HEADER_SKIP.match(t):
                continue
            if re.search(r"Pagina\s*\d", t, re.I):
                continue
            kept.append(fix_ocr_spacing(fix_mirrored_option_line(t)))
        if kept:
            # Ya rotadas: orden natural arriba→abajo (no invertir)
            page_texts.append((cuaderno_n, "\n".join(kept)))

    page_texts.sort(key=lambda x: x[0])
    text = "\n".join(t for _, t in page_texts)
    text = re.sub(r"(?<=\d)\.(?=\S)", ". ", text)
    text = re.sub(r"([a-dA-D])\)(?=\S)", r"\1) ", text)
    text = re.sub(r"\bC\)", "c)", text)
    ck.write_text(text, encoding="utf-8")
    return text

def hour_from_name(name: str) -> str | None:
    m = HOUR_RE.search(name)
    if not m:
        return None
    return f"{int(m.group(1)):02d}{m.group(2)}"


def find_galicia_pairs() -> list[dict]:
    pairs: list[dict] = []
    seen: set[str] = set()
    for conv in sorted(PDF_ROOT.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = {f.resolve(): f for f in conv.glob("*.pdf")}
        # También *.pdf.pdf
        for f in conv.glob("*.pdf.pdf"):
            files[f.resolve()] = f
        files_l = list(files.values())

        exams = [
            f
            for f in files_l
            if re.search(r"mercador", f.name, re.I)
            and re.search(r"(?:^|[_\s.-])A(?:[_\s.-]|\.pdf|$)", f.name, re.I)
            and "plantilla" not in f.name.lower()
            and not re.search(r"(?:^|[_\s.-])B(?:[_\s.-]|\.pdf|$)", f.name, re.I)
        ]
        keys = [
            f
            for f in files_l
            if re.search(r"plantilla", f.name, re.I)
            and re.search(r"mercador", f.name, re.I)
            and re.search(r"(?:^|[_\s.-])A(?:[_\s.-]|\.pdf|$)", f.name, re.I)
            and not re.search(r"(?:^|[_\s.-])B(?:[_\s.-]|\.pdf|$)", f.name, re.I)
        ]
        if not exams or not keys:
            continue

        # Deduplicar por nombre
        exams = list({f.name.lower(): f for f in exams}.values())
        keys = list({f.name.lower(): f for f in keys}.values())

        for exam in exams:
            eh = hour_from_name(exam.name)
            key = None
            if eh:
                for k in keys:
                    if hour_from_name(k.name) == eh:
                        key = k
                        break
            if key is None and len(keys) == 1:
                key = keys[0]
            if key is None:
                continue

            # Fecha: preferir nombre; si no, año de carpeta + mes por convocatoria
            date = parse_date_from_name(exam.name)
            if not date:
                year = conv.parent.name if conv.parent.name.isdigit() else None
                conv_n = re.search(r"(\d+)", conv.name)
                if year and conv_n:
                    # Galicia suele tener ~6-8 convocatorias/año
                    month = {
                        1: 1,
                        2: 3,
                        3: 5,
                        4: 6,
                        5: 7,
                        6: 9,
                        7: 10,
                        8: 11,
                    }.get(int(conv_n.group(1)), 1)
                    date = f"{int(year):04d}{month:02d}01"
            if not date:
                continue

            eid, name = exam_id_from_date("galicia", date)
            if eh:
                eid = f"{eid}_{eh}"
                name = f"{name} ({eh[:2]}:{eh[2:]})"
            # Desambiguar
            base = eid
            n = 2
            while eid in seen:
                eid = f"{base}_{n}"
                n += 1
            seen.add(eid)

            pairs.append(
                {
                    "id": eid,
                    "name": name,
                    "date": date,
                    "exam_pdf": exam,
                    "key_pdf": key,
                    "region": "galicia",
                }
            )
    return pairs


def convert_pair(pair: dict) -> list[dict]:
    answers = parse_answer_key_ocr(pair["key_pdf"])
    if len(answers) < 90:
        raise ValueError(f"{pair['id']}: plantilla OCR con solo {len(answers)} respuestas")

    # Los cuadernos tienen texto completo codificado con una fuente Identity-H.
    # Decodificarlo es más rápido y preciso que aplicar OCR a catorce páginas.
    q_text = extract_exam_native_text(pair["exam_pdf"])
    questions = parse_questions(q_text)
    if len(questions) < 90:
        # Fallback para posibles formatos sin capa de texto aprovechable.
        q_text = extract_exam_ocr_text(pair["exam_pdf"])
        questions = parse_questions_galicia_ocr(q_text)
        q_text2 = re.sub(r"(?<!\n)(\d{1,3})\.\s*", r"\n\1. ", q_text)
        q_text2 = re.sub(r"(?<!\n)([a-dA-D])\)\s*", r"\n\1) ", q_text2)
        q_text2 = re.sub(r"\bC\)", "c)", q_text2)
        questions = parse_questions_galicia_ocr(q_text2)
        if len(questions) < len(parse_questions(q_text2)):
            questions = parse_questions(q_text2)

    for q in questions:
        q["options"] = sorted(q["options"], key=lambda o: o["id"])
        for o in q["options"]:
            o["id"] = o["id"].lower()

    # Preferir preguntas con 4 opciones; permitir 3 si la correcta está
    ready = []
    for q in questions:
        ids = {o["id"] for o in q["options"]}
        if len(q["options"]) < 3:
            continue
        if q["num"] not in answers:
            continue
        if answers[q["num"]] not in ids:
            continue
        ready.append(q)

    exam = merge(ready, answers)
    exam.sort(key=lambda q: int(q["num"]))
    validate(exam, pair["id"])
    return exam

def diff_answers(a: list[dict], b: list[dict]) -> list[str]:
    ma = {q["num"]: q for q in a}
    mb = {q["num"]: q for q in b}
    msgs: list[str] = []
    for num in sorted(set(ma) | set(mb), key=lambda x: int(x)):
        if num not in ma:
            msgs.append(f"  Q{num}: solo en B")
            continue
        if num not in mb:
            msgs.append(f"  Q{num}: solo en A")
            continue
        if ma[num].get("correct") != mb[num].get("correct"):
            msgs.append(
                f"  Q{num} correct: {ma[num].get('correct')} vs {mb[num].get('correct')}"
            )
    return msgs


def run_ingest(pairs: list[dict], skip_existing: bool = True) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    ok = 0
    for pair in pairs:
        out = OUT_DIR / f"{pair['id']}.json"
        if skip_existing and out.exists():
            try:
                prev = json.loads(out.read_text(encoding="utf-8"))
                if len(prev) >= 100:
                    print(f"SKIP {pair['id']}: ya tiene {len(prev)} preguntas", flush=True)
                    manifest.append(
                        {
                            "id": pair["id"],
                            "name": pair["name"],
                            "date": pair["date"],
                            "questions": len(prev),
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
            exam = convert_pair(pair)
            out = OUT_DIR / f"{pair['id']}.json"
            out.write_text(
                json.dumps(exam, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            print(f"OK {pair['id']}: {len(exam)} preguntas -> {out.name}", flush=True)
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
            print(f"FAIL {pair['id']}: {e}", flush=True)

    man = OUT_DIR / "_galicia_manifest.json"
    man.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{ok}/{len(pairs)} convertidos. Manifest: {man}")


def run_audit(pairs: list[dict], rounds: int = 3) -> None:
    print(f"=== AUDITORÍA GALICIA ({rounds} rondas; no modifica JSON) ===\n")
    for rnd in range(1, rounds + 1):
        print(f"--- Ronda {rnd}/{rounds} ---")
        # Forzar re-OCR de plantillas en rondas >1 invalidando solo comparación
        # (la caché garantiza determinismo; comparamos JSON vs reparse de caché +
        #  re-OCR fresco de plantilla en cada ronda)
        ok = diff = fail = missing = 0
        for pair in pairs:
            out = OUT_DIR / f"{pair['id']}.json"
            if not out.exists():
                print(f"MISSING {pair['id']}")
                missing += 1
                continue
            try:
                saved = json.loads(out.read_text(encoding="utf-8"))
                # Releer plantilla: borrar caché de esa página para ronda fresca
                if rnd > 1:
                    for tag in ("p0_s2.8", "p0_s2.5", "p0_s3.0"):
                        ck = cache_key(pair["key_pdf"], tag)
                        if ck.exists():
                            ck.unlink()
                fresh_answers = parse_answer_key_ocr(pair["key_pdf"])
                q_text = extract_exam_ocr_text(pair["exam_pdf"])
                questions = parse_questions_galicia_ocr(q_text)
                # Solo comparar claves de respuesta (determinismo plantilla)
                fresh = []
                for q in saved:
                    num = q["num"]
                    if num not in fresh_answers:
                        continue
                    fresh.append({**q, "correct": fresh_answers[num]})
                # Si no hay saved usable, merge completo
                if len(fresh) < 50:
                    fresh = merge(questions, fresh_answers)
                msgs = diff_answers(saved, fresh)
                # También tamaño
                if abs(len(saved) - len(fresh)) > 0:
                    msgs.append(f"  count: JSON={len(saved)} fresh={len(fresh)}")
                if not msgs:
                    print(f"OK {pair['id']}: respuestas idénticas ({len(saved)})")
                    ok += 1
                else:
                    print(f"DIFF {pair['id']}:")
                    for m in msgs[:30]:
                        print(m)
                    diff += 1
            except Exception as e:
                print(f"FAIL {pair['id']}: {e}")
                fail += 1
        print(f"Ronda {rnd}: OK={ok} DIFF={diff} FAIL={fail} MISSING={missing}\n")
    print("Ningún archivo ha sido modificado.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--id", type=str, default="")
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--rounds", type=int, default=3, help="Rondas de auditoría")
    args = ap.parse_args()

    if not PDF_ROOT.exists():
        sys.exit(f"No existe {PDF_ROOT}")

    pairs = find_galicia_pairs()
    print(f"Pares Galicia mercancías A: {len(pairs)}")
    if args.id:
        pairs = [p for p in pairs if p["id"] == args.id]
    if args.limit:
        pairs = pairs[: args.limit]

    if args.audit:
        run_audit(pairs, rounds=args.rounds)
    else:
        run_ingest(pairs)


if __name__ == "__main__":
    main()
