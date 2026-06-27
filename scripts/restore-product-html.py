#!/usr/bin/env python3
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / "GUILTY copy" / "products"
DST = ROOT / "products"

INLINE_SCRIPT = '  <script src="../parallax-inline-svg.js"></script>\n'

for src_file in sorted(SRC.glob("*.html")):
    text = src_file.read_text(encoding="utf-8")
    if INLINE_SCRIPT.strip() not in text:
        text = re.sub(
            r'(\s*<script src="\.\./(?:product|pink)-parallax\.js"></script>)',
            INLINE_SCRIPT + r"\1",
            text,
            count=1,
        )
    dst_file = DST / src_file.name
    dst_file.write_text(text, encoding="utf-8")
    print(f"restored {dst_file.name} ({len(text.splitlines())} lines)")
