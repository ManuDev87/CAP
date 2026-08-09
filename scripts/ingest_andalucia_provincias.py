"""
Descarga e ingesta de exámenes CAP mercancías (Junta de Andalucía)
por provincia: Almería, Cádiz, Córdoba, Granada, Huelva, Jaén, Málaga
(+ renombra Sevilla a prefijo sevilla_*).

Formatos PDF (como Valencia / Extremadura):
  - Un solo PDF con '*' en la opción correcta
  - Examen + plantilla de respuestas (texto o casillas)

Uso:
  python scripts/ingest_andalucia_provincias.py --download
  python scripts/ingest_andalucia_provincias.py --ingest
  python scripts/ingest_andalucia_provincias.py --rename-sevilla
  python scripts/ingest_andalucia_provincias.py --all
  python scripts/ingest_andalucia_provincias.py --audit
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_exams import (  # noqa: E402
    MONTHS_ES,
    OUT_DIR,
    ROOT,
    convert_pair,
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

BASE = "https://www.juntadeandalucia.es"
PAGES_BASE = (
    f"{BASE}/organismos/fomentoymovilidad/areas/servicios-transporte/"
    "servicios-transportista/paginas"
)

PROVINCES = {
    "almeria": "Almería",
    "cadiz": "Cádiz",
    "cordoba": "Córdoba",
    "granada": "Granada",
    "huelva": "Huelva",
    "jaen": "Jaén",
    "malaga": "Málaga",
}

YEARS = (2024, 2025, 2026)

# 1ª→enero … 6ª→noviembre (calendario típico Junta Andalucía)
CONV_MONTH = {
    1: 1,  # enero
    2: 3,  # marzo
    3: 5,  # mayo
    4: 7,  # julio
    5: 9,  # septiembre
    6: 11,  # noviembre
}

PDF_ROOT = ROOT / "Examenes CAP" / "Andalucia"
UA = {"User-Agent": "Mozilla/5.0 (compatible; CAP-ingest/1.0)"}

SKIP_LINK = re.compile(
    r"listado|admitid|excluid|aptos|normas|celebraci|plano|distribuci|"
    r"llamamient|aula asignada|consecuencias",
    re.I,
)
VIAJEROS = re.compile(r"viajer|persona", re.I)
MERCANCIAS = re.compile(r"mercanc", re.I)
MODELO_A = re.compile(r"modelo\s*a\b|\bm-?a\b|\bmod-?a\b|\bopci[oó]n\s*a\b", re.I)
MODELO_B = re.compile(r"modelo\s*b\b|\bm-?b\b|\bmod-?b\b|\bopci[oó]n\s*b\b", re.I)
IS_EXAM = re.compile(
    r"examen|plantilla|respuesta|corregid|correcci",
    re.I,
)
IS_KEY_ONLY = re.compile(
    r"^(plantilla(\s+de)?(\s+correcci[oó]n)?(\s+examen)?|"
    r"plantilla(\s+examen)?|"
    r"correcci[oó]n)$",
    re.I,
)
HAS_ANSWERS_HINT = re.compile(
    r"respuesta|corregid|con\s+respuestas|\*",
    re.I,
)


def fetch(url: str, retries: int = 3) -> bytes:
    last: Exception | None = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"fetch failed {url}: {last}")


def abs_url(href: str) -> str:
    href = href.replace("&amp;", "&")
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("/"):
        return BASE + href
    return href


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def page_url(prov: str, year: int) -> str:
    return f"{PAGES_BASE}/gestion-formacion-cap-{prov}{year}.html"


def parse_page_sections(html: str) -> list[dict]:
    """
    Devuelve convocatorias con bloques mercancías/viajeros y sus links PDF.
    """
    # Normalizar headings
    html = re.sub(r"&nbsp;", " ", html)
    # Cortar por </h2> de convocatoria (el título puede ir en <span>)
    matches = list(
        re.finditer(r"(?i)<h2[^>]*>(.*?)</h2>", html, re.S)
    )
    out: list[dict] = []
    conv_heads: list[tuple[int, int, str, int]] = []
    for m in matches:
        title = strip_tags(m.group(1))
        if not re.search(r"convocatoria", title, re.I):
            continue
        mnum = re.search(r"(\d+)", title)
        if not mnum:
            continue
        conv_heads.append((m.start(), m.end(), title, int(mnum.group(1))))

    for idx, (start, end, title, conv) in enumerate(conv_heads):
        body_end = conv_heads[idx + 1][0] if idx + 1 < len(conv_heads) else len(html)
        body = html[end:body_end]
        # Split body by mercancías / viajeros headings (strong/h3/p/b)
        sub = re.split(
            r"(?i)(<p[^>]*>\s*<strong[^>]*>|<strong[^>]*>|<h3[^>]*>)"
            r"([^<]*(?:CUALIFICACI[OÓ]N|MERCANC|VIAJER|PERSONAS)[^<]*)"
            r"(?:</strong>|</h3>|</p>)?",
            body,
        )
        # Fallback: treat whole body as one block if no splits
        blocks: list[tuple[str, str]] = []
        if len(sub) < 3:
            blocks = [("unknown", body)]
        else:
            # sub[0] preamble, then marker, label, chunk...
            for j in range(1, len(sub), 3):
                label = strip_tags(sub[j + 1] if j + 1 < len(sub) else "")
                chunk = sub[j + 2] if j + 2 < len(sub) else ""
                kind = "viajeros" if VIAJEROS.search(label) else (
                    "mercancia" if MERCANCIAS.search(label) or "CUALIFIC" in label.upper()
                    else "unknown"
                )
                # If label is just CUALIFICACIÓN INICIAL DE MERCANCÍAS
                if MERCANCIAS.search(label):
                    kind = "mercancia"
                elif VIAJEROS.search(label):
                    kind = "viajeros"
                blocks.append((kind, chunk))

        def extract_links(chunk: str) -> list[dict]:
            links = []
            for m in re.finditer(
                r'<a[^>]+href="([^"]+\.pdf[^"]*)"[^>]*>(.*?)</a>',
                chunk,
                re.I | re.S,
            ):
                href = abs_url(m.group(1))
                text = strip_tags(m.group(2))
                links.append({"text": text, "url": href})
            # Sometimes the link text is empty and title is elsewhere — also catch bare hrefs in list items
            return links

        merc_links: list[dict] = []
        viaj_links: list[dict] = []
        unknown_links: list[dict] = []
        for kind, chunk in blocks:
            links = extract_links(chunk)
            if kind == "mercancia":
                merc_links.extend(links)
            elif kind == "viajeros":
                viaj_links.extend(links)
            else:
                unknown_links.extend(links)

        # If parser failed to split, classify by link text/url
        if not merc_links and unknown_links:
            for lk in unknown_links:
                blob = f"{lk['text']} {urllib.parse.unquote(lk['url'])}"
                if VIAJEROS.search(blob) or re.search(r"[/_-]viaj", blob, re.I):
                    viaj_links.append(lk)
                else:
                    merc_links.append(lk)

        # Drop viajeros that leaked into mercancías by URL filename
        cleaned = []
        for lk in merc_links:
            blob = f"{lk['text']} {urllib.parse.unquote(lk['url'])}"
            if VIAJEROS.search(blob) or re.search(r"[/_-]viaj", blob, re.I):
                viaj_links.append(lk)
            else:
                cleaned.append(lk)
        merc_links = cleaned

        out.append(
            {
                "conv": conv,
                "title": title,
                "mercancia": merc_links,
                "viajeros": viaj_links,
            }
        )
    return out


def score_exam_link(text: str, url: str) -> int:
    """Higher = better candidate for mercancías exam with answers."""
    blob = f"{text} {urllib.parse.unquote(url)}"
    if SKIP_LINK.search(blob):
        return -1000
    if VIAJEROS.search(blob):
        return -1000
    if MODELO_B.search(blob) and not MODELO_A.search(blob):
        return -500
    if not IS_EXAM.search(blob) and not MERCANCIAS.search(blob):
        return -100
    score = 0
    if MERCANCIAS.search(blob) or re.search(r"[/_-]mer[/_-]|_mer_|mer_", blob, re.I):
        score += 50
    if MODELO_A.search(blob):
        score += 40
    if HAS_ANSWERS_HINT.search(text):
        score += 30
    if re.search(r"examen", text, re.I):
        score += 20
    if re.search(r"plantilla", text, re.I):
        score += 15
    if MODELO_B.search(blob):
        score -= 80
    return score


def score_key_link(text: str, url: str) -> int:
    blob = f"{text} {urllib.parse.unquote(url)}"
    if SKIP_LINK.search(blob) or VIAJEROS.search(blob):
        return -1000
    if MODELO_B.search(blob) and not MODELO_A.search(blob):
        return -500
    if not re.search(r"plantilla|respuesta|correcci", blob, re.I):
        return -50
    score = 10
    if MERCANCIAS.search(blob) or re.search(
        r"[/_-]mer(?:c)?[/_-]|_mer(?:c)?_|\bmer(?:c)?_", blob, re.I
    ):
        score += 40
    if MODELO_A.search(blob):
        score += 30
    if MODELO_B.search(blob):
        score -= 80
    # Bare "Plantilla" next to exam PDF with merc_ in URL
    if re.search(r"plantilla", text, re.I):
        score += 15
    return score


def pick_mercancia_assets(links: list[dict]) -> dict:
    """
    Elige examen (+ plantilla opcional) de mercancías modelo A.
    """
    usable = [lk for lk in links if score_exam_link(lk["text"], lk["url"]) > -200]
    if not usable:
        return {}

    # Deduplicate by URL
    by_url: dict[str, dict] = {}
    for lk in usable:
        by_url[lk["url"]] = lk
    usable = list(by_url.values())

    ranked = sorted(
        usable, key=lambda lk: score_exam_link(lk["text"], lk["url"]), reverse=True
    )
    # Prefer "examen…" over bare "plantilla…" when both exist (Valencia-style pair)
    exam_like = [
        lk
        for lk in ranked
        if re.search(r"examen", lk["text"], re.I)
        and not re.match(r"^\s*plantilla", lk["text"], re.I)
    ]
    best = exam_like[0] if exam_like else ranked[0]
    best_score = score_exam_link(best["text"], best["url"])
    if best_score < 0:
        return {}

    # Look for a separate key if best looks like exam-only or there is an explicit plantilla
    key = None
    key_candidates = sorted(
        usable, key=lambda lk: score_key_link(lk["text"], lk["url"]), reverse=True
    )
    for kc in key_candidates:
        if kc["url"] == best["url"]:
            continue
        if score_key_link(kc["text"], kc["url"]) < 20:
            continue
        key = kc
        break

    # Combined if label says so; keep key when it is a distinct plantilla URL
    combined = bool(HAS_ANSWERS_HINT.search(best["text"])) and key is None
    return {
        "exam": best,
        "key": key,
        "combined": combined,
    }


def month_for_conv(conv: int, year: int, exam_url: str, text_blob: str) -> tuple[int, int]:
    """Return (year, month) preferring date from URL/path, else convocatoria map."""
    for src in (exam_url, text_blob):
        d = parse_date_from_name(urllib.parse.unquote(src))
        if d:
            return int(d[:4]), int(d[4:6])
    # Path like /2026/07/ → month from folder
    m = re.search(r"/inline-files/(\d{4})/(\d{2})/", exam_url)
    if m:
        return int(m.group(1)), int(m.group(2))
    mo = CONV_MONTH.get(conv, conv)
    return year, mo


def safe_name(s: str) -> str:
    s = urllib.parse.unquote(s)
    s = re.sub(r"[^\w.\-]+", "_", s, flags=re.I)
    return s[:140]


def download_all(provinces: list[str] | None = None) -> list[dict]:
    provs = provinces or list(PROVINCES)
    existing = {x["id"]: x for x in load_download_manifest()}
    manifest: list[dict] = []
    for prov in provs:
        # drop old entries for provinces we're refreshing
        existing = {k: v for k, v in existing.items() if v.get("province") != prov}
        for year in YEARS:
            url = page_url(prov, year)
            print(f"\n=== {PROVINCES[prov]} {year} ===")
            print(f"  {url}")
            try:
                raw = fetch(url).decode("utf-8", "replace")
            except Exception as e:  # noqa: BLE001
                print(f"  FAIL page: {e}")
                continue
            sections = parse_page_sections(raw)
            print(f"  convocatorias: {len(sections)}")
            for sec in sections:
                assets = pick_mercancia_assets(sec["mercancia"])
                if not assets:
                    # retry with all non-viajeros links from page section
                    assets = pick_mercancia_assets(
                        [
                            lk
                            for lk in sec["mercancia"] + sec.get("viajeros", [])
                            if not VIAJEROS.search(f"{lk['text']} {lk['url']}")
                        ]
                    )
                if not assets:
                    print(f"  conv {sec['conv']}: sin PDF mercancías")
                    continue
                exam_lk = assets["exam"]
                key_lk = assets.get("key")
                y, mo = month_for_conv(
                    sec["conv"], year, exam_lk["url"], exam_lk["text"]
                )
                month_name = MONTHS_ES[mo]
                eid = f"{prov}_{month_name}_{y}"
                dest_dir = PDF_ROOT / PROVINCES[prov] / str(year) / f"conv_{sec['conv']:02d}_{month_name}"
                dest_dir.mkdir(parents=True, exist_ok=True)

                exam_fname = safe_name(Path(urllib.parse.urlparse(exam_lk["url"]).path).name)
                if not exam_fname.lower().endswith(".pdf"):
                    exam_fname += ".pdf"
                exam_path = dest_dir / f"exam_{exam_fname}"
                if not exam_path.exists():
                    print(f"  DL exam conv{sec['conv']}: {exam_lk['text'][:60]}")
                    exam_path.write_bytes(fetch(exam_lk["url"]))
                else:
                    print(f"  OK exam conv{sec['conv']}: {exam_path.name}")

                key_path = None
                if key_lk:
                    key_fname = safe_name(
                        Path(urllib.parse.urlparse(key_lk["url"]).path).name
                    )
                    if not key_fname.lower().endswith(".pdf"):
                        key_fname += ".pdf"
                    key_path = dest_dir / f"key_{key_fname}"
                    if not key_path.exists():
                        print(f"  DL key  conv{sec['conv']}: {key_lk['text'][:60]}")
                        key_path.write_bytes(fetch(key_lk["url"]))

                manifest.append(
                    {
                        "id": eid,
                        "name": f"{month_name.capitalize()} {y}",
                        "province": prov,
                        "province_label": PROVINCES[prov],
                        "year": y,
                        "month": mo,
                        "conv": sec["conv"],
                        "exam_pdf": str(exam_path.relative_to(ROOT)),
                        "key_pdf": str(key_path.relative_to(ROOT)) if key_path else None,
                        "combined": bool(assets.get("combined")),
                        "exam_url": exam_lk["url"],
                        "exam_label": exam_lk["text"],
                        "key_url": key_lk["url"] if key_lk else None,
                    }
                )
    # Merge with untouched provinces
    by_id = {x["id"]: x for x in existing.values()}
    for item in manifest:
        by_id[item["id"]] = item
    merged = sorted(
        by_id.values(), key=lambda x: (x["province"], x["year"], x.get("conv", 0))
    )
    man_path = OUT_DIR / "_andalucia_provincias_download.json"
    man_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nManifest: {man_path} ({len(merged)} exams)")
    return merged


def load_download_manifest() -> list[dict]:
    p = OUT_DIR / "_andalucia_provincias_download.json"
    if not p.exists():
        return []
    return json.loads(p.read_text(encoding="utf-8"))


def has_asterisk_answers(text: str) -> bool:
    qs = parse_questions(text)
    with_c = sum(1 for q in qs if "correct" in q)
    return with_c >= 80


def ingest_one(item: dict) -> tuple[str, int]:
    exam_pdf = ROOT / item["exam_pdf"]
    key_pdf = ROOT / item["key_pdf"] if item.get("key_pdf") else None
    eid = item["id"]
    q_text = pdf_text(exam_pdf)

    # Prefer date from PDF content if available
    date = parse_date_from_text(q_text) or parse_date_from_name(exam_pdf.name)
    if date:
        y, mo = int(date[:4]), int(date[4:6])
        month_name = MONTHS_ES[mo]
        eid = f"{item['province']}_{month_name}_{y}"
        item["id"] = eid
        item["name"] = f"{month_name.capitalize()} {y}"
        item["year"] = y
        item["month"] = mo

    pair = {
        "id": eid,
        "name": item["name"],
        "exam_pdf": exam_pdf,
        "key_pdf": key_pdf or exam_pdf,
        "region": "extremadura" if (not key_pdf or item.get("combined")) else "andalucia",
    }

    # Detect format
    if has_asterisk_answers(q_text):
        pair["region"] = "extremadura"
        pair["key_pdf"] = exam_pdf
        exam = convert_pair(pair)
    elif key_pdf and key_pdf.exists():
        # Valencia-style: try filled OMR then text key
        questions = parse_questions(q_text)
        answers = parse_answer_key_valencia_filled(key_pdf)
        if len(answers) < 90:
            answers = parse_answer_key(pdf_text(key_pdf))
        if len(answers) < 90:
            # Maybe key PDF also has asterisks / is combined
            ktext = pdf_text(key_pdf)
            if has_asterisk_answers(ktext):
                pair["region"] = "extremadura"
                pair["exam_pdf"] = key_pdf
                pair["key_pdf"] = key_pdf
                exam = convert_pair(pair)
            elif has_asterisk_answers(q_text):
                pair["region"] = "extremadura"
                exam = convert_pair(pair)
            else:
                raise ValueError(f"{eid}: plantilla con solo {len(answers)} respuestas")
        else:
            exam = merge(questions, answers)
            validate(exam, eid)
    else:
        # Single PDF without enough asterisks — try anyway / fail clearly
        if has_asterisk_answers(q_text):
            pair["region"] = "extremadura"
            exam = convert_pair(pair)
        else:
            qs = parse_questions(q_text)
            with_c = sum(1 for q in qs if "correct" in q)
            raise ValueError(
                f"{eid}: sin plantilla y solo {with_c} respuestas con '*'"
            )

    out = OUT_DIR / f"{eid}.json"
    out.write_text(json.dumps(exam, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return eid, len(exam)


def ingest_all() -> list[dict]:
    manifest = load_download_manifest()
    if not manifest:
        raise SystemExit("No hay manifest de descarga. Ejecuta --download primero.")
    results = []
    errors = []
    # Deduplicate by id keeping highest conv / latest path
    by_id: dict[str, dict] = {}
    for item in manifest:
        by_id[item["id"]] = item
    # Re-resolve ids after ingest (date may change)
    final_ids: dict[str, dict] = {}
    for item in sorted(by_id.values(), key=lambda x: (x["province"], x["year"], x["conv"])):
        try:
            eid, n = ingest_one(dict(item))
            print(f"  OK {eid}: {n} preguntas")
            item["id"] = eid
            item["questions"] = n
            final_ids[eid] = item
            results.append(item)
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL {item['id']}: {e}")
            errors.append({"id": item["id"], "error": str(e)})

    man = {
        "ok": results,
        "errors": errors,
        "by_province": defaultdict(list),
    }
    for r in results:
        man["by_province"][r["province"]].append(
            {"id": r["id"], "name": r["name"], "questions": r.get("questions")}
        )
    man["by_province"] = dict(man["by_province"])
    (OUT_DIR / "_andalucia_provincias_manifest.json").write_text(
        json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nIngestados: {len(results)}  errores: {len(errors)}")
    return results


SEVILLA_OLD_IDS = [
    "febrero_2023",
    "marzo_2023",
    "junio_2023",
    "julio_2023",
    "septiembre_2023",
    "noviembre_2023",
    "enero_2024",
    "marzo_2024",
    "mayo_2024",
    "julio_2024",
    "septiembre_2024",
    "noviembre_2024",
    "enero_2025",
    "marzo_2025",
    "mayo_2025",
    "julio_2025",
    "septiembre_2025",
    "noviembre_2025",
    "enero_2026",
    "marzo_2026",
    "mayo_2026",
]


def rename_sevilla() -> None:
    """Renombra JSON unprefixed → sevilla_*."""
    for old in SEVILLA_OLD_IDS:
        src = OUT_DIR / f"{old}.json"
        dst = OUT_DIR / f"sevilla_{old}.json"
        if src.exists() and not dst.exists():
            src.rename(dst)
            print(f"  rename {old} → sevilla_{old}")
        elif dst.exists():
            print(f"  exists sevilla_{old}")
            if src.exists():
                src.unlink()
                print(f"  removed old {old}")
        else:
            print(f"  missing {old}")


def truck(i: int) -> str:
    return f"/img/truck{(i % 4) + 1}.jpg"


def generate_tests_ts_snippet(results: list[dict]) -> str:
    """Devuelve arrays TS por provincia (para pegar / regenerar)."""
    by_prov: dict[str, list[dict]] = defaultdict(list)
    for r in results:
        by_prov[r["province"]].append(r)
    lines = []
    for prov, label in PROVINCES.items():
        items = sorted(by_prov.get(prov, []), key=lambda x: (x["year"], x["month"]))
        lines.append(f"const {prov}Tests: TestMeta[] = [")
        for i, it in enumerate(items):
            lines.append(
                f'  {{ id: "{it["id"]}", name: "{it["name"]}", img: "{truck(i)}" }},'
            )
        lines.append("];")
        lines.append("")
    # Sevilla
    lines.append("const sevillaTests: TestMeta[] = [")
    for i, old in enumerate(SEVILLA_OLD_IDS):
        month = old.rsplit("_", 1)[0]
        year = old.rsplit("_", 1)[1]
        name = f"{month.capitalize()} {year}"
        lines.append(
            f'  {{ id: "sevilla_{old}", name: "{name}", img: "{truck(i)}" }},'
        )
    lines.append("];")
    return "\n".join(lines)


def audit() -> None:
    man_path = OUT_DIR / "_andalucia_provincias_manifest.json"
    if not man_path.exists():
        print("Sin manifest de ingest")
        return
    man = json.loads(man_path.read_text(encoding="utf-8"))
    ok = 0
    bad = 0
    for r in man.get("ok", []):
        p = OUT_DIR / f"{r['id']}.json"
        if not p.exists():
            print(f"MISSING {r['id']}")
            bad += 1
            continue
        data = json.loads(p.read_text(encoding="utf-8"))
        try:
            validate(data, r["id"])
            print(f"OK {r['id']} ({len(data)})")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"BAD {r['id']}: {e}")
            bad += 1
    print(f"\nAudit: {ok} ok, {bad} bad, errors listed: {len(man.get('errors', []))}")
    for e in man.get("errors", []):
        print(f"  ERR {e['id']}: {e['error']}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--ingest", action="store_true")
    ap.add_argument("--rename-sevilla", action="store_true")
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--province", action="append", default=None)
    ap.add_argument("--snippet", action="store_true", help="Print TS snippet")
    args = ap.parse_args()

    if args.all:
        args.download = args.ingest = args.rename_sevilla = True

    if args.download:
        download_all(args.province)
    if args.ingest:
        ingest_all()
    if args.rename_sevilla:
        rename_sevilla()
    if args.audit:
        audit()
    if args.snippet:
        man = load_download_manifest()
        # prefer ingested ids
        ing = OUT_DIR / "_andalucia_provincias_manifest.json"
        if ing.exists():
            data = json.loads(ing.read_text(encoding="utf-8"))
            print(generate_tests_ts_snippet(data.get("ok", [])))
        else:
            print(generate_tests_ts_snippet(man))


if __name__ == "__main__":
    main()
