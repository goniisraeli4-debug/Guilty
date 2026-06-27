#!/usr/bin/env python3
"""
Embeds parallax layer SVGs inline in every product HTML file.
Run once from the terminal:  python3 scripts/build-inline-svgs.py

This makes the site work correctly on file:// (no server needed)
because SVGs are already in the DOM — no fetch required.
"""
import re
from pathlib import Path

ROOT       = Path(__file__).resolve().parents[1]
PRODUCTS   = ROOT / 'products'
SCARFS     = ROOT / 'scarfs'

# ── helpers ─────────────────────────────────────────────────────────────────

def namespace_ids(svg_text, prefix):
    """Prefix every SVG id="" and every #reference to avoid cross-layer clashes."""
    ids = re.findall(r'\bid="([^"]+)"', svg_text)
    for id_val in sorted(set(ids), key=len, reverse=True):
        new = f'{prefix}_{id_val}'
        svg_text = svg_text.replace(f'id="{id_val}"',            f'id="{new}"')
        svg_text = svg_text.replace(f'url(#{id_val})',           f'url(#{new})')
        svg_text = svg_text.replace(f"url('#{id_val}')",         f"url('#{new}')")
        svg_text = svg_text.replace(f'href="#{id_val}"',         f'href="#{new}"')
        svg_text = svg_text.replace(f'xlink:href="#{id_val}"',   f'xlink:href="#{new}"')
    return svg_text

def build_svg(raw, prefix, is_cover):
    raw = namespace_ids(raw.strip(), prefix)

    # extract viewBox (use width/height as fallback before we strip them)
    vb = re.search(r'viewBox="([^"]+)"', raw)
    w  = re.search(r'\bwidth="(\d[^"]*)"',  raw)
    h  = re.search(r'\bheight="(\d[^"]*)"', raw)

    if vb:
        viewbox = vb.group(1)
    elif w and h:
        viewbox = f'0 0 {w.group(1)} {h.group(1)}'
    else:
        viewbox = '0 0 1024 1024'

    pa = 'xMidYMid slice' if is_cover else 'xMidYMid meet'

    # replace opening <svg ...> with standardised attrs
    opening = (
        f'<svg class="parallax-layer-svg" '
        f'aria-hidden="true" focusable="false" '
        f'shape-rendering="geometricPrecision" '
        f'viewBox="{viewbox}" preserveAspectRatio="{pa}" '
        f'fill="none" xmlns="http://www.w3.org/2000/svg">'
    )
    return re.sub(r'<svg[^>]*>', opening, raw, count=1)

# ── process each product HTML ────────────────────────────────────────────────

IMG_RE = re.compile(
    r'<img\s+src="(\.\./scarfs/[^"]+\.svg)"[^>]*/?>',
    re.IGNORECASE
)

for html_file in sorted(PRODUCTS.glob('*.html')):
    html = html_file.read_text(encoding='utf-8')
    product = html_file.stem          # e.g.  'burgundy'
    hits = 0

    def replace_img(m):
        global hits
        src    = m.group(1)           # e.g.  '../scarfs/burgundy-layers/layer-1.svg'
        ln_m   = re.search(r'layer-(\d+)\.svg', src)
        lnum   = ln_m.group(1) if ln_m else '0'
        prefix = f'{product[:4]}-l{lnum}'

        svg_path = ROOT / src.lstrip('../').lstrip('/')
        if not svg_path.exists():
            print(f'  SKIP (not found): {svg_path}')
            return m.group(0)

        raw = svg_path.read_text(encoding='utf-8')

        # is this the background/cover layer?
        ctx = html[max(0, m.start() - 300) : m.start()]
        is_cover = 'parallax-layer--pink' in ctx

        hits += 1
        return build_svg(raw, prefix, is_cover)

    new_html = IMG_RE.sub(replace_img, html)

    if hits:
        html_file.write_text(new_html, encoding='utf-8')
        print(f'  ✓  {html_file.name}  ({hits} SVGs inlined, '
              f'{new_html.count(chr(10))+1:,} lines total)')
    else:
        print(f'  —  {html_file.name}  (nothing to inline)')

print('\nDone. Reload the page — no server needed.')
