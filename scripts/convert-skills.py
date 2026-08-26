#!/usr/bin/env python3
"""
Convert the client's clinic skill .docx files into markdown for import.

    pip install python-docx
    python scripts/convert-skills.py

Reads  knowledge-source/raw/*.docx
Writes knowledge-source/converted/<slug>.md
       knowledge-source/converted/_report.md

The report tells you which clinics are missing a do-not-answer section and a
compliance block, which is the gap the client needs to fill. Do not invent that
content.
"""

import glob
import os
import re
import sys

try:
    from docx import Document
except ImportError:
    sys.exit("pip install python-docx")

RAW = "knowledge-source/raw"
OUT = "knowledge-source/converted"

# Sections we expect. Absence is information, not an error.
# An explicit do-not-answer SECTION, not a passing mention of contraindications.
# The difference matters: a section is a block list the validator can enforce,
# a mention is just prose.
MARKERS = {
    "do_not_answer": ("Unconfirmed - do not answer", "Unconfirmed \u2014 do not answer",
                      "do not answer", "Contraindications / Clinical Suitability"),
    "compliance": ("Compliance rules",),
    "known_gap": ("KNOWN GAP", "Known Gaps"),
}


def slug(filename):
    base = os.path.basename(filename)
    base = re.sub(r"\.docx$", "", base, flags=re.I)
    base = re.sub(r"-sms-reply$", "", base, flags=re.I)
    return base.lower().replace(" ", "-")


def extract(path):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def has(text, keys):
    return any(k.lower() in text.lower() for k in keys)


def has_section(text, keys):
    """True only if a heading-level section exists, not a passing mention."""
    for line in text.split("\n"):
        stripped = line.strip().lstrip("#").strip()
        if any(k.lower() in stripped.lower() for k in keys) and len(stripped) < 80:
            return True
    return False


def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(RAW, "*.docx")))
    if not files:
        sys.exit(f"No .docx found in {RAW}/")

    rows = []
    for path in files:
        name = os.path.basename(path)
        if name.lower().startswith("list of"):
            continue

        text = extract(path)
        s = slug(path)

        with open(os.path.join(OUT, f"{s}.md"), "w", encoding="utf-8") as fh:
            fh.write(text)

        platform = re.search(r"BOOKING PLATFORM:\s*([^\n]+)", text)
        platform = platform.group(1).strip() if platform else "UNKNOWN"

        close_type = "manual" if "manual close" in text.lower() else (
            "link_only" if "link-only" in text.lower() or "link only" in text.lower()
            else "UNKNOWN"
        )

        offers = len(re.findall(r"^\*\*\d+\.", text, re.M))
        if offers == 0 and re.search(r"Active Offer\b", text):
            offers = 1

        urls = re.findall(r"https?://[^\s)]+", text)

        rows.append({
            "slug": s,
            "platform": platform,
            "close_type": close_type,
            "offers": offers,
            "urls": len(set(urls)),
            "do_not_answer": has_section(text, MARKERS["do_not_answer"]),
            "compliance": has(text, MARKERS["compliance"]),
            "known_gap": has(text, MARKERS["known_gap"]),
            "chars": len(text),
        })

    with open(os.path.join(OUT, "_report.md"), "w", encoding="utf-8") as fh:
        fh.write("# Clinic skill file import report\n\n")
        fh.write(f"{len(rows)} clinics converted.\n\n")
        fh.write("| clinic | platform | close_type | offers | urls | do-not-answer | compliance |\n")
        fh.write("|---|---|---|---|---|---|---|\n")
        for r in rows:
            fh.write(
                f"| {r['slug']} | {r['platform'][:22]} | {r['close_type']} | "
                f"{r['offers']} | {r['urls']} | "
                f"{'yes' if r['do_not_answer'] else 'MISSING'} | "
                f"{'yes' if r['compliance'] else 'MISSING'} |\n"
            )

        missing = [r["slug"] for r in rows if not r["do_not_answer"]]
        fh.write("\n## Clinics with no do-not-answer list\n\n")
        fh.write(
            "These have nothing for the validator to block on. Import what exists, "
            "surface the gap in the dashboard, and let the client fill it. "
            "Do not write this content yourself.\n\n"
        )
        for m in missing:
            fh.write(f"- {m}\n")

        unknown = [r["slug"] for r in rows if r["close_type"] == "UNKNOWN"]
        if unknown:
            fh.write("\n## close_type could not be determined\n\n")
            for u in unknown:
                fh.write(f"- {u}\n")

    print(f"Converted {len(rows)} clinics into {OUT}/")
    print(f"Read {OUT}/_report.md for gaps.")


if __name__ == "__main__":
    main()
