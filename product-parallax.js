(async function () {
  const section = document.querySelector('.parallax-flythrough');
  if (!section) return;

  if (window.GuiltyParallaxInlineSvg) {
    const product = document.body.dataset.product || 'product';
    await window.GuiltyParallaxInlineSvg.inlineParallaxSvgs(section, product);
  }

  const frame = section.querySelector('.parallax-frame');
  const scene = section.querySelector('.parallax-scene');
  const world = section.querySelector('.parallax-world');
  const stickyEl = frame || scene;
  const layers = [...section.querySelectorAll('.parallax-layer')];
  const maxOffset = 2500;
  const wheelSmoothFactor = 0.18;
  const resetDuration = 1400;
  const minEngageOffset = (() => {
    let minProgress = 0.03;
    layers.forEach((layer) => {
      const revealAt = Number(layer.dataset.revealAt);
      if (revealAt > 0) minProgress = Math.max(minProgress, revealAt);
    });
    return minProgress * maxOffset;
  })();
  let targetOffset = 0;
  let displayOffset = 0;
  let animating = false;
  let pointerInside = false;
  let resetting = false;
  let resetStart = 0;
  let resetFrom = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function hasFadeOut(layer) {
    return layer.dataset.fadeOutAt !== undefined;
  }

  /* Second pattern layer (layer-2 / --reveal): slightly earlier, slightly longer fade-in */
  function revealFadeIn(layer) {
    const revealAt = Number(layer.dataset.revealAt);
    const revealSpan = Number(layer.dataset.revealSpan) || 0.28;
    if (!layer.classList.contains('parallax-layer--reveal')) {
      return { at: revealAt, span: revealSpan };
    }
    return {
      at: Math.max(0, revealAt - 0.02),
      span: revealSpan + 0.05,
    };
  }

  function stickyTop() {
    return stickyEl ? parseFloat(getComputedStyle(stickyEl).top) || 88 : 88;
  }

  function progressFromScroll() {
    const top = stickyTop();
    const rect = section.getBoundingClientRect();
    const scrollRange = section.offsetHeight - stickyEl.offsetHeight;
    if (scrollRange <= 0 || rect.top > top) return 0;
    return clamp((top - rect.top) / scrollRange, 0, 1);
  }

  function applyIdleLayerState() {
    layers.forEach((layer) => {
      layer.style.transform = 'translate3d(0, 0, 0)';
      layer.style.opacity = layer.dataset.revealAt || hasFadeOut(layer) ? '0' : '';
    });
  }

  function applyPrimedLayerState() {
    layers.forEach((layer) => {
      layer.style.transform = 'translate3d(0, 0, 0)';
      if (hasFadeOut(layer)) {
        layer.style.opacity = '1';
      } else if (layer.dataset.revealAt) {
        layer.style.opacity = Number(layer.dataset.revealAt) <= 0 ? '' : '0';
      } else {
        layer.style.opacity = '';
      }
    });
  }

  function updateLayers() {
    const showParallax = displayOffset >= minEngageOffset;
    section.classList.toggle('is-scrolling', showParallax);
    if (world) world.setAttribute('aria-hidden', showParallax ? 'false' : 'true');

    if (!showParallax) {
      if (displayOffset <= 0) {
        applyIdleLayerState();
      } else {
        applyPrimedLayerState();
      }
      return;
    }

    const progress = displayOffset / maxOffset;
    layers.forEach((layer) => {
      const baseZ = Number(layer.dataset.baseZ);
      const z = Math.round(progress * (baseZ + maxOffset));
      layer.style.transform = `translate3d(0, 0, ${z}px)`;

      const revealAt = Number(layer.dataset.revealAt);
      const fadeOutAt = Number(layer.dataset.fadeOutAt);

      const { at: revealStart, span: revealSpan } = layer.classList.contains('parallax-layer--reveal')
        ? revealFadeIn(layer)
        : { at: revealAt, span: Number(layer.dataset.revealSpan) || 0.28 };

      if (fadeOutAt) {
        const fadeOutSpan = Number(layer.dataset.fadeOutSpan) || 0.32;
        const fadeT = clamp((progress - fadeOutAt) / fadeOutSpan, 0, 1);
        let opacity = 1 - smoothstep(fadeT);
        if (revealAt || layer.classList.contains('parallax-layer--reveal')) {
          opacity *= clamp((progress - revealStart) / revealSpan, 0, 1);
        }
        layer.style.opacity = String(opacity);
      } else if (revealAt || layer.classList.contains('parallax-layer--reveal')) {
        layer.style.opacity = String(clamp((progress - revealStart) / revealSpan, 0, 1));
      } else {
        layer.style.opacity = '';
      }
    });
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick() {
    if (resetting) {
      const t = clamp((performance.now() - resetStart) / resetDuration, 0, 1);
      displayOffset = resetFrom * (1 - easeOutCubic(t));

      if (t >= 1) {
        displayOffset = 0;
        targetOffset = 0;
        resetting = false;
        animating = false;
      }
    } else {
      displayOffset += (targetOffset - displayOffset) * wheelSmoothFactor;

      if (targetOffset <= 0 && displayOffset < 1) {
        displayOffset = 0;
      }

      if (Math.abs(targetOffset - displayOffset) < 0.5) {
        displayOffset = targetOffset;
        animating = false;
      }
    }

    updateLayers();

    if (animating) {
      requestAnimationFrame(tick);
    }
  }

  function startReset() {
    if (isAtRest()) return;

    resetting = true;
    resetStart = performance.now();
    resetFrom = displayOffset;
    targetOffset = 0;

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function setOffset(next, { smooth = false } = {}) {
    resetting = false;
    targetOffset = clamp(next, 0, maxOffset);

    if (!smooth) {
      displayOffset = targetOffset;
      updateLayers();
      return;
    }

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function isAtRest() {
    return targetOffset <= 0 && displayOffset < 1;
  }

  section.addEventListener('mouseenter', () => {
    pointerInside = true;
  });

  section.addEventListener('mouseleave', () => {
    pointerInside = false;
    startReset();
  });

  section.addEventListener('wheel', (event) => {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
    event.preventDefault();

    const delta = event.deltaY * 0.85;
    if (delta < 0 && isAtRest()) return;

    setOffset(targetOffset + delta, { smooth: true });
  }, { passive: false });

  window.addEventListener('scroll', () => {
    if (!pointerInside) return;
    setOffset(progressFromScroll() * maxOffset);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!pointerInside) return;
    setOffset(progressFromScroll() * maxOffset);
  }, { passive: true });

  updateLayers();
})();
