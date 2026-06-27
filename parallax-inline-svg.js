/**
 * Fetch parallax layer SVGs and replace <img src="*.svg"> with inline <svg>
 * for sharp vectors in 3D. Used on product pages and the home detail overlay.
 */
(function () {
  function namespaceSvgIds(svg, prefix) {
    const ids = [...svg.querySelectorAll('[id]')].map((el) => el.id);
    const unique = [...new Set(ids)].sort((a, b) => b.length - a.length);
    unique.forEach((id) => {
      const next = `${prefix}_${id}`;
      svg.querySelectorAll(`[id="${id}"]`).forEach((el) => {
        el.id = next;
      });
      svg.innerHTML = svg.innerHTML
        .replaceAll(`url(#${id})`, `url(#${next})`)
        .replaceAll(`url('#${id}')`, `url('#${next}')`)
        .replaceAll(`xlink:href="#${id}"`, `xlink:href="#${next}"`)
        .replaceAll(`href="#${id}"`, `href="#${next}"`);
    });
  }

  function prepareSvgElement(svg, prefix, isCover) {
    svg.classList.add('parallax-layer-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('shape-rendering', 'geometricPrecision');
    if (!svg.getAttribute('viewBox')) {
      const w = parseFloat(svg.getAttribute('width')) || 1024;
      const h = parseFloat(svg.getAttribute('height')) || 1024;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', isCover ? 'xMidYMid slice' : 'xMidYMid meet');
    namespaceSvgIds(svg, prefix);
    return svg;
  }

  function inlineImg(img, prefix) {
    const src = img.getAttribute('src');
    if (!src || !src.endsWith('.svg')) return Promise.resolve();

    const layer = img.closest('.parallax-layer');
    const isCover = layer?.classList.contains('parallax-layer--pink');

    return fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${src}`);
        return res.text();
      })
      .then((markup) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = markup.trim();
        const svg = wrap.querySelector('svg');
        if (!svg) return;
        img.replaceWith(prepareSvgElement(svg, prefix, isCover));
      })
      .catch(() => {});
  }

  function inlineParallaxSvgs(root, prefixBase) {
    if (!root) return Promise.resolve();
    const imgs = [...root.querySelectorAll('.parallax-layer img[src$=".svg"]')];
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      imgs.map((img, index) => inlineImg(img, `${prefixBase}-l${index + 1}`))
    );
  }

  window.GuiltyParallaxInlineSvg = { inlineParallaxSvgs };
})();
