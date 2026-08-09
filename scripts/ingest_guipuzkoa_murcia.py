"""
Ingest Guipúzcoa y Murcia CAP mercancías (modelo A / Tipo 1).

Guipúzcoa:
  - Examen bilingüe en 2 columnas (izquierda euskera, derecha castellano)
    o a veces solo castellano.
  - Plantilla: texto "N letra" o PDF escaneado (OCR).

Murcia:
  - Examen con texto castellano normal.
  - Plantilla OMR escaneada → OCR de casillas / pares número-letra.

Uso:
  python scripts/ingest_guipuzkoa_murcia.py --region guipuzkoa
  python scripts/ingest_guipuzkoa_murcia.py --region murcia
  python scripts/ingest_guipuzkoa_murcia.py --region all
  python scripts/ingest_guipuzkoa_murcia.py --audit
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

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_exams import (  # noqa: E402
    OUT_DIR,
    ROOT,
    exam_id_from_date,
    merge,
    parse_date_from_name,
    parse_date_from_text,
    parse_questions,
    pdf_text,
    validate,
)

OCR_CACHE = ROOT / "scripts" / "_gm_ocr_cache"
HEADER_SKIP = re.compile(
    r"^(GGA-CAP|SALGAIAK|Página|Pagina|ERANTZUNAK|RESPUESTAS|Galdera|"
    r"Pregunta|Erantzun|Región|de Murcia|HOJA DE EXAMEN|ESPECIALIDAD|"
    r"FECHA|Modelo|A$|B$|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[-/]\d{2}[-/]\d{2})",
    re.I,
)

_OCR = None


def get_ocr() -> RapidOCR:
    global _OCR
    if _OCR is None:
        _OCR = RapidOCR()
    return _OCR


def cache_key(path: Path, tag: str) -> Path:
    h = hashlib.sha1(
        f"{path.resolve()}::{path.stat().st_mtime_ns}::{tag}".encode()
    ).hexdigest()
    OCR_CACHE.mkdir(parents=True, exist_ok=True)
    return OCR_CACHE / f"{h}.json"


def pixmap_bgr(page: fitz.Page, scale: float = 2.4) -> np.ndarray:
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
    lines.sort(key=lambda L: (round(L["y"] / 8) * 8, L["x"]))
    return lines


# ---------- Guipúzcoa questions (right column Spanish) ----------


def extract_guipuzkoa_spanish_text(path: Path) -> str:
    """Toma la columna derecha (castellano) o todo el texto si es monolingüe."""
    doc = fitz.open(path)
    page_chunks: list[str] = []
    for page in doc:
        mid = page.rect.width * 0.48
        right_lines: list[tuple[float, float, str]] = []
        left_count = right_count = 0
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                text = "".join(s["text"] for s in line["spans"]).strip()
                if not text:
                    continue
                x0 = line["bbox"][0]
                y0 = line["bbox"][1]
                if x0 >= mid:
                    right_count += 1
                    right_lines.append((y0, x0, text))
                else:
                    left_count += 1

        # Exámenes solo castellano: poca o ninguna columna izquierda de contenido
        if right_count < 8 and left_count > right_count:
            # Monolingüe: usar todo el texto ordenado
            all_lines: list[tuple[float, float, str]] = []
            for block in page.get_text("dict")["blocks"]:
                if block.get("type") != 0:
                    continue
                for line in block.get("lines", []):
                    text = "".join(s["text"] for s in line["spans"]).strip()
                    if text:
                        all_lines.append((line["bbox"][1], line["bbox"][0], text))
            all_lines.sort()
            chunk = "\n".join(t for _, _, t in all_lines)
        else:
            right_lines.sort()
            chunk = "\n".join(t for _, _, t in right_lines)
        page_chunks.append(chunk)

    text = "\n".join(page_chunks)
    # Normalizar "a." → "a)"
    text = re.sub(r"(?m)^([a-dA-D])\.\s*", r"\1) ", text)
    # "a" / "b" solas en línea → fusionar con la siguiente
    text = re.sub(r"(?m)^([a-dA-D])\s*\n+(?=\S)", r"\1) ", text)
    # "a texto" sin paréntesis (Guipúzcoa / septiembre)
    text = re.sub(
        r"(?m)^([a-dA-D])\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9\"'«])",
        r"\1) ",
        text,
    )
    text = re.sub(r"(?m)^(\d{1,3})\s*$", r"\1.", text)
    # "1 ." / "12 ." → "1. "
    text = re.sub(r"(?m)^(\d{1,3})\s*\.\s*", r"\1. ", text)
    # Número solo en línea + enunciado en la siguiente
    text = re.sub(
        r"(?m)^(\d{1,3})\.\s*\n+(?=[¿¡A-ZÁÉÍÓÚÜÑ\"'])",
        r"\1. ",
        text,
    )
    return text


def parse_guipuzkoa_questions(path: Path) -> list[dict]:
    text = extract_guipuzkoa_spanish_text(path)
    questions = parse_questions(text)
    # Si el parser de números solos falló, forzar "N. texto"
    if len(questions) < 90:
        text2 = re.sub(r"(?m)^(\d{1,3})\.\s*\n+", r"\1. ", text)
        text2 = re.sub(r"(?<!\n)(\d{1,3})\.\s+", r"\n\1. ", text2)
        text2 = re.sub(r"(?<!\n)([a-dA-D])\)\s*", r"\n\1) ", text2)
        questions = parse_questions(text2)
    return questions


# ---------- Answer keys ----------


def parse_guipuzkoa_answer_text(path: Path) -> dict[str, str]:
    """Plantillas con texto: sección MERCANCIAS A."""
    doc = fitz.open(path)
    full = "\n".join(page.get_text("text") for page in doc)
    if not full.strip():
        return {}

    # Recortar a MERCANCIAS A hasta MERCANCIAS B / VIAJEROS
    m = re.search(
        r"MERCANCIAS\s*A\b(.*?)(?:MERCANCIAS\s*B\b|BIDAIARIAK|VIAJEROS\s*A\b|$)",
        full,
        re.S | re.I,
    )
    chunk = m.group(1) if m else full
    answers: dict[str, str] = {}
    for num, letter in re.findall(r"(\d{1,3})\s+([A-Da-d])\b", chunk):
        n = int(num)
        if 1 <= n <= 100 and num not in answers:
            answers[num] = letter.lower()
    return answers


def parse_answer_key_ocr_generic(path: Path) -> dict[str, str]:
    """OCR de plantilla (texto N + letra o '12 C')."""
    ck = cache_key(path, "key_ocr_v1")
    if ck.exists():
        return json.loads(ck.read_text(encoding="utf-8"))

    doc = fitz.open(path)
    answers: dict[str, str] = {}
    for pi, page in enumerate(doc):
        arr = pixmap_bgr(page, scale=2.6)
        lines = ocr_image(arr)
        # Si parece sección viajeros, saltar (heurística)
        head = " ".join(L["text"] for L in lines[:12])
        if re.search(r"VIAJEROS|BIDAIARIAK", head, re.I) and not re.search(
            r"MERCANC|SALGAIAK", head, re.I
        ):
            continue
        nums: list[dict] = []
        letters: list[dict] = []
        for L in lines:
            t = L["text"].strip()
            if not t or HEADER_SKIP.match(t):
                continue
            pair = re.fullmatch(r"(\d{1,3})\s*([A-Da-d])", t)
            if pair:
                n = pair.group(1)
                if 1 <= int(n) <= 100:
                    answers.setdefault(n, pair.group(2).lower())
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


def parse_murcia_omr_answers(path: Path) -> dict[str, str]:
    """
    Plantilla Murcia: hoja OMR. Intenta OCR; si falla, usa RapidOCR + proximidad.
    También busca patrones en capa de texto basura (@ = relleno a veces).
    """
    # Primero OCR genérico
    answers = parse_answer_key_ocr_generic(path)
    if len(answers) >= 90:
        return answers

    # Fallback: render + OCR a escala mayor
    ck = cache_key(path, "murcia_omr_v2")
    if ck.exists():
        cached = json.loads(ck.read_text(encoding="utf-8"))
        if len(cached) >= 90:
            return cached

    doc = fitz.open(path)
    answers = {}
    for page in doc:
        arr = pixmap_bgr(page, scale=3.0)
        # Mejorar contraste
        gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        lines = ocr_image(cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR))
        for L in lines:
            t = L["text"].strip()
            pair = re.fullmatch(r"(\d{1,3})\s*[\.:=\-]?\s*([A-Da-d])", t)
            if pair and 1 <= int(pair.group(1)) <= 100:
                answers.setdefault(pair.group(1), pair.group(2).lower())

    ck.write_text(json.dumps(answers, ensure_ascii=False), encoding="utf-8")
    return answers


# ---------- Pair discovery ----------


def _is_viajeros(name: str) -> bool:
    return bool(re.search(r"viajero|bidaiari", name, re.I))


def _is_modelo_b(name: str) -> bool:
    n = name.lower()
    if re.search(r"modelo\s*b|\btipo\s*b\b|examenb|_b_|mercancias-b|mercancias b", n):
        return True
    if re.search(r"(?<![a-z])b(?![a-z]).*mercan|mercan.*(?<![a-z])b(?![a-z])", n):
        # careful with false positives
        if re.search(r"examen\s*b|mercancias\s*b|mercancías\s*b| b\.pdf", n):
            return True
    return False


def find_guipuzkoa_pairs() -> list[dict]:
    pdf_root = ROOT / "Examenes CAP" / "Examenes Pais Vasco" / "Guipuzkoa"
    pairs: list[dict] = []
    seen: set[str] = set()
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(r"mercanc", f.name, re.I)
            and not _is_viajeros(f.name)
            and not _is_modelo_b(f.name)
            and "plantilla" not in f.name.lower()
            and "respuesta" not in f.name.lower()
        ]
        # Prefer names with A
        exams_a = [
            f
            for f in exams
            if re.search(r"(?i)examena|_a_|mercancias-a|mercancias a| a\.pdf| a_", f.name)
            or re.search(r"(?i)\bA\b", f.name)
        ]
        if exams_a:
            exams = exams_a
        if not exams:
            continue

        keys = [
            f
            for f in files
            if (
                re.search(r"plantilla|respuesta", f.name, re.I)
                and not _is_viajeros(f.name)
            )
            or (
                re.search(r"respuesta", f.name, re.I)
                and re.search(r"mercan|salgaiak|a y b", f.name, re.I)
            )
        ]
        # Prefer plantillas that mention mercancias or are combined A/B sheets
        if not keys:
            keys = [
                f
                for f in files
                if re.search(r"plantilla|respuesta", f.name, re.I)
            ]
        if not keys:
            continue

        exam = exams[0]
        # Prefer key that is not only viajeros
        key = None
        for k in keys:
            if "viajero" in k.name.lower() and "mercan" not in k.name.lower():
                continue
            key = k
            break
        if key is None:
            key = keys[0]

        # Preferir año carpeta + nº convocatoria (el texto bilingüe engaña).
        year = conv.parent.name if conv.parent.name.isdigit() else None
        conv_n = re.search(r"(\d+)", conv.name)
        date = None
        if year and conv_n:
            month = {1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11}.get(int(conv_n.group(1)), 1)
            date = f"{int(year):04d}{month:02d}01"
        if not date:
            date = parse_date_from_name(exam.name) or parse_date_from_name(key.name)
        if not date:
            date = parse_date_from_text(pdf_text(exam))
        if not date:
            continue

        eid, name = exam_id_from_date("guipuzkoa", date)
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
                "region": "guipuzkoa",
            }
        )
    return pairs


def find_murcia_pairs() -> list[dict]:
    pdf_root = ROOT / "Examenes CAP" / "Murcia"
    pairs: list[dict] = []
    seen: set[str] = set()
    for conv in sorted(pdf_root.rglob("*")):
        if not conv.is_dir() or "convocatoria" not in conv.name.lower():
            continue
        files = list(conv.glob("*.pdf"))
        exams = [
            f
            for f in files
            if re.search(r"mercanc", f.name, re.I)
            and not _is_viajeros(f.name)
            and "plantilla" not in f.name.lower()
            and "correccion" not in f.name.lower()
        ]
        keys = [
            f
            for f in files
            if (
                re.search(r"plantilla|correccion", f.name, re.I)
                and re.search(r"mercanc", f.name, re.I)
                and not _is_viajeros(f.name)
            )
            or f.name.lower() == "descarga.pdf"
        ]
        if not exams:
            continue
        if not keys:
            # descarga.pdf as mercancias plantilla when only viajeros plantilla named
            keys = [f for f in files if f.name.lower() == "descarga.pdf"]
        if not keys:
            continue

        exam = exams[0]
        key = keys[0]
        date = parse_date_from_name(exam.name) or parse_date_from_text(pdf_text(exam))
        if not date:
            year = conv.parent.name if conv.parent.name.isdigit() else None
            conv_n = re.search(r"(\d+)", conv.name)
            if year and conv_n:
                month = {1: 1, 2: 3, 3: 5, 4: 7}.get(int(conv_n.group(1)), 1)
                date = f"{int(year):04d}{month:02d}01"
        if not date:
            continue
        eid, name = exam_id_from_date("murcia", date)
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
                "region": "murcia",
            }
        )
    return pairs


# ---------- Convert ----------


def load_sidecar_answers(exam_id: str) -> dict[str, str]:
    sidecar = ROOT / "scripts" / "answer_keys" / f"{exam_id}.json"
    if not sidecar.exists():
        return {}
    payload = json.loads(sidecar.read_text(encoding="utf-8"))
    raw = payload.get("answers") or payload
    return {
        str(k): str(v).lower()
        for k, v in raw.items()
        if str(v).lower() in "abcd"
    }


def convert_pair(pair: dict) -> list[dict]:
    region = pair["region"]
    if region == "guipuzkoa":
        questions = parse_guipuzkoa_questions(pair["exam_pdf"])
        answers = parse_guipuzkoa_answer_text(pair["key_pdf"])
    else:
        questions = parse_questions(pdf_text(pair["exam_pdf"]))
        answers = {}

    # Sidecar antes que OCR (plantillas OMR escaneadas cuelgan/fallan).
    if len(answers) < 90:
        side = load_sidecar_answers(pair["id"])
        if len(side) >= 90:
            print(f"  usando answer_keys/{pair['id']}.json ({len(side)})")
            answers = side

    if len(answers) < 90 and region == "guipuzkoa":
        answers = parse_answer_key_ocr_generic(pair["key_pdf"])
    elif len(answers) < 90:
        answers = parse_murcia_omr_answers(pair["key_pdf"])

    if len(answers) < 90:
        raise ValueError(f"{pair['id']}: plantilla con solo {len(answers)} respuestas")
    if len(questions) < 90:
        raise ValueError(f"{pair['id']}: solo {len(questions)} preguntas parseadas")

    # Deduplicar por número (preferir la que tenga más opciones)
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


def run_ingest(pairs: list[dict], skip_existing: bool = True) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []
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

    # Write per-region manifests
    by_region: dict[str, list] = {}
    for m in manifest:
        rid = m["id"].split("_")[0]
        by_region.setdefault(rid, []).append(m)
    for rid, items in by_region.items():
        man = OUT_DIR / f"_{rid}_manifest.json"
        man.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Manifest {rid}: {man}")
    print(f"\n{ok}/{len(pairs)} convertidos.")


def run_audit(pairs: list[dict]) -> None:
    print("=== AUDITORÍA Guipúzcoa/Murcia (solo lectura) ===\n")
    ok = diff = fail = missing = 0
    for pair in pairs:
        out = OUT_DIR / f"{pair['id']}.json"
        if not out.exists():
            print(f"MISSING {pair['id']}")
            missing += 1
            continue
        try:
            saved = json.loads(out.read_text(encoding="utf-8"))
            fresh = convert_pair(pair)
            sa = {q["num"]: q["correct"] for q in saved}
            fa = {q["num"]: q["correct"] for q in fresh}
            msgs = []
            for n in sorted(set(sa) | set(fa), key=int):
                if sa.get(n) != fa.get(n):
                    msgs.append(f"  Q{n}: JSON={sa.get(n)} fresh={fa.get(n)}")
            if abs(len(saved) - len(fresh)) > 0:
                msgs.append(f"  count JSON={len(saved)} fresh={len(fresh)}")
            if not msgs:
                print(f"OK {pair['id']}: respuestas idénticas ({len(saved)})")
                ok += 1
            else:
                print(f"DIFF {pair['id']}:")
                for m in msgs[:25]:
                    print(m)
                diff += 1
        except Exception as e:
            print(f"FAIL {pair['id']}: {e}")
            fail += 1
    print(f"\nResumen: OK={ok} DIFF={diff} FAIL={fail} MISSING={missing}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--region",
        choices=("guipuzkoa", "murcia", "all"),
        default="all",
    )
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--force", action="store_true", help="Reingestar aunque exista JSON")
    args = ap.parse_args()

    pairs: list[dict] = []
    if args.region in ("guipuzkoa", "all"):
        gp = find_guipuzkoa_pairs()
        print(f"Pares Guipúzcoa mercancías A: {len(gp)}")
        pairs.extend(gp)
    if args.region in ("murcia", "all"):
        mp = find_murcia_pairs()
        print(f"Pares Murcia mercancías: {len(mp)}")
        pairs.extend(mp)

    if args.limit:
        pairs = pairs[: args.limit]

    if args.audit:
        run_audit(pairs)
    else:
        run_ingest(pairs, skip_existing=not args.force)


if __name__ == "__main__":
    main()
