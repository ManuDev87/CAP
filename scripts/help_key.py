"""Shared question-help key. Must stay in sync with cap-app/src/lib/help.ts."""

from __future__ import annotations

import re


def norm_text(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("¿", "").replace("?", "").replace("¡", "").replace("!", "")
    s = re.sub(r"\s+", " ", s)
    return s.strip(" .;:")


def help_key(question: str, correct_text: str) -> str:
    return f"{norm_text(question)}\t{norm_text(correct_text)}"


def correct_text_of(question: dict) -> str:
    letter = (question.get("correct") or "").lower()
    for opt in question.get("options") or []:
        if str(opt.get("id", "")).lower() == letter:
            return opt.get("text") or ""
    return ""
