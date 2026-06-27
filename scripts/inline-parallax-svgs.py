#!/usr/bin/env python3
"""Inline parallax layer SVGs into product HTML (replaces <img src="*.svg">)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "products"

IMG_RE = re.compile(
    r'<div class="(parallax-layer[^"]*)"([^>]*)>\s*'
    r'<img\s+src="([^"]+\.svg)"[^>]*>\s*'
    r'</div>',
    re.DOTALL,
)


def namespace_svg_ids(svg: str, prefix: str) -> str:
    ids = re.findall(r'\bid="([^"]+)"', svg)
    for id_val in sorted(set(ids), key=len, reverse=True):
        new_id = f"{prefix}_{id_val}"
        svg = svg.replace(f'id="{id_val}"', f'id="{new_id}"')
        svg = svg.replace(f"url(#{id_val})", f"url(#{new_id})")
        svg = svg.replace(f"url('#{id_val}')", f"url('#{new_id}')")
        svg = svg.replace(f'xlink:href="#{id_val}"', f'xlink:href="#{new_id}"')
        svg = svg.replace(f'href="#{id_val}"', f'href="#{new_id}"')
    return svg


def prepare_svg(svg_text: str, prefix: str, is_cover: bool) -> str:
    svg = svg_text.strip()
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)

    match = re.match(r"<svg([^>]*)>(.*)</svg>\s*$", svg, re.DOTALL)
    if not match:
        raise ValueError("Invalid SVG markup")

    attrs, inner = match.group(1), match.group(2)
    attrs = re.sub(r'\s+width="[^"]*"', "", attrs)
    attrs = re.sub(r'\s+height="[^"]*"', "", attrs)

    if "preserveAspectRatio" not in attrs:
        fit = "xMidYMid slice" if is_cover else "xMidYMid meet"
        attrs += f' preserveAspectRatio="{fit}"'

    attrs += ' class="parallax-layer-svg" aria-hidden="true" focusable="false"'
    attrs += ' shape-rendering="geometricPrecision"'

    out = f"<svg{attrs}>{inner}</svg>"
    return namespace_svg_ids(out, prefix)


def inline_product_html(path: Path) -> None:
    text = path.read_text()
    product = path.stem
    layer_idx = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal layer_idx
        layer_idx += 1
        layer_class = match.group(1)
        layer_attrs = match.group(2)
        src = match.group(3)
        svg_path = (path.parent / src).resolve()
        if not svg_path.exists():
            raise FileNotFoundError(svg_path)

        is_cover = "parallax-layer--pink" in layer_class
        prefix = f"{product}-l{layer_idx}"
        inline = prepare_svg(svg_path.read_text(encoding="utf-8"), prefix, is_cover)
        return (
            f'<div class="{layer_class}"{layer_attrs}>\n'
            f"                  {inline}\n"
            f"                </div>"
        )

    new_text, count = IMG_RE.subn(repl, text)
    if count == 0:
        print(f"skip (no layer imgs): {path.name}")
        return

    path.write_text(new_text, encoding="utf-8")
    print(f"inlined {count} layers: {path.name}")


def main() -> None:
    for html in sorted(PRODUCTS.glob("*.html")):
        inline_product_html(html)


if __name__ == "__main__":
    main()
