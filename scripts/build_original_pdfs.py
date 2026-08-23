"""Build original exam PDF links (P = questions, R = answer key).

Andalucía with junta URL: remote links.
Other CCAA: copy/hardlink local PDFs into cap-app/public/originales/.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMS = ROOT / "cap-app" / "src" / "data" / "exams"
PUBLIC = ROOT / "cap-app" / "public" / "originales"
OUT = ROOT / "cap-app" / "src" / "data" / "exam-original-pdfs.json"

# Combined Junta PDFs (asterisk / examen con respuestas) → single R.
SEVILLA_JUNTA = {
    "sevilla_enero_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/examen_merc_se_cap1_2024.pdf",
    "sevilla_marzo_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_se_cap2_2024.pdf",
    "sevilla_mayo_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen-a_mer_se_cap3_2024.pdf",
    "sevilla_julio_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_se_cap4_2024_modelo%20A.pdf",
    "sevilla_septiembre_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_merc-modeloA_se_cap5_2024.pdf",
    "sevilla_noviembre_2024": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer-A_se_cap6_2024.pdf",
    "sevilla_enero_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_merc-modeloA_se_cap5_2025_0.pdf",
    "sevilla_marzo_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_cr_mer_se_mod-a_cap2_2025.pdf",
    "sevilla_mayo_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_A_se_cap3_2025.pdf",
    "sevilla_julio_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_se_cap4_modeloA.pdf",
    "sevilla_septiembre_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_se_cap5_2025_opci%C3%B3n%20A.pdf",
    "sevilla_noviembre_2025": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
    "sevilla_enero_2026": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
    "sevilla_marzo_2026": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/Examen%20con%20respuestas%20mercanc%C3%ADas%20A_0.pdf",
    "sevilla_mayo_2026": "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/Examen%20con%20respuestas%20mercanc%C3%ADas%20b.pdf",
}

MANIFESTS = [
    "_cataluna_manifest.json",
    "_valencia_manifest.json",
    "_cantabria_manifest.json",
    "_alava_manifest.json",
    "_guipuzkoa_manifest.json",
    "_murcia_manifest.json",
    "_galicia_manifest.json",
    "_extremadura_manifest.json",
    "_viajeros_manifest.json",
]


def load_json(name: str):
    p = EXAMS / name
    if not p.exists():
        return []
    data = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "ok" in data:
        return data["ok"]
    return data


def publish(src: Path, dest_name: str) -> str | None:
    if not src.exists():
        return None
    PUBLIC.mkdir(parents=True, exist_ok=True)
    dest = PUBLIC / dest_name
    if dest.exists() and dest.stat().st_size == src.stat().st_size:
        return f"/originales/{dest_name}"
    dest.unlink(missing_ok=True)
    try:
        os.link(src, dest)
    except OSError:
        shutil.copy2(src, dest)
    return f"/originales/{dest_name}"


def from_andalucia(item: dict) -> dict:
    exam_url = item.get("exam_url")
    key_url = item.get("key_url")
    combined = bool(item.get("combined"))
    if not exam_url:
        return {}
    if combined or not key_url or key_url == exam_url:
        return {"answers": exam_url}
    return {"questions": exam_url, "answers": key_url}


def from_local(item: dict) -> dict:
    exam = item.get("exam_pdf")
    key = item.get("key_pdf")
    eid = item.get("id")
    if not eid or not exam:
        return {}
    exam_path = ROOT / exam
    key_path = ROOT / key if key else None
    same = (
        key_path
        and key_path.exists()
        and exam_path.exists()
        and exam_path.resolve() == key_path.resolve()
    )
    if key_path and key_path.exists() and exam_path.exists() and not same:
        q = publish(exam_path, f"{eid}-preguntas.pdf")
        a = publish(key_path, f"{eid}-respuestas.pdf")
        out: dict = {}
        if q:
            out["questions"] = q
        if a:
            out["answers"] = a
        return out
    if exam_path.exists():
        a = publish(exam_path, f"{eid}-respuestas.pdf")
        return {"answers": a} if a else {}
    return {}


def main() -> None:
    links: dict[str, dict] = {}

    for item in load_json("_andalucia_provincias_manifest.json"):
        got = from_andalucia(item)
        if got:
            links[item["id"]] = got

    # Sevilla mercancías is not in the provincias manifest (legacy prefix rename).
    for eid, url in SEVILLA_JUNTA.items():
        if eid not in links:
            links[eid] = {"answers": url}

    for name in MANIFESTS:
        for item in load_json(name):
            eid = item.get("id")
            if not eid or eid in links:
                continue
            got = from_local(item)
            if got:
                links[eid] = got

    def rel(p) -> str | None:
        if p is None:
            return None
        path = Path(p)
        if path.is_absolute():
            try:
                return str(path.relative_to(ROOT))
            except ValueError:
                return str(path)
        return str(path)

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    try:
        from ingest_viajeros import FINDERS
    except Exception as exc:  # noqa: BLE001
        print(f"skip viajeros finders: {exc}")
        FINDERS = {}

    for fname, finder in FINDERS.items():
        try:
            pairs = finder()
        except Exception as exc:  # noqa: BLE001
            print(f"skip viajeros {fname}: {exc}")
            continue
        print(f"viajeros {fname}: {len(pairs)} pairs")
        for pair in pairs:
            eid = pair.get("id")
            if not eid or eid in links:
                continue
            item = {
                "id": eid,
                "exam_pdf": rel(pair.get("exam_pdf")),
                "key_pdf": rel(pair.get("key_pdf")),
            }
            got = from_local(item)
            if got:
                links[eid] = got

    OUT.write_text(
        json.dumps(links, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    split = sum(1 for v in links.values() if v.get("questions") and v.get("answers"))
    single = len(links) - split
    print(f"wrote {OUT} ({len(links)} exams: {single} R-only, {split} P+R)")
    print(f"local copies in {PUBLIC}")


if __name__ == "__main__":
    main()
