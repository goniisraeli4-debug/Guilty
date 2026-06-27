(async function () {
  const section = document.querySelector('.parallax-flythrough');
  if (!section) return;

  if (window.GuiltyParallaxInlineSvg) {
    const product = document.body.dataset.product || 'pink';
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
  const minZProgress = 0.004;
  const minShowProgress = 0.03;
  let targetOffset = 0;
  let displayOffset = 0;
  let animating = false;
  let wheelTimer = 0;
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

  function hasReveal(layer) {
    return layer.dataset.revealAt !== undefined;
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

  function layerProgress(layer, progress) {
    const zCurve = Number(layer.dataset.zCurve);
    if (zCurve > 1) return Math.pow(progress, zCurve);
    return progress;
  }

  function layerOpacity(layer, progress) {
    let opacity = hasReveal(layer) ? 0 : 1;

    if (hasReveal(layer)) {
      const { at: revealAt, span: revealSpan } = revealFadeIn(layer);
      const revealT = clamp((progress - revealAt) / revealSpan, 0, 1);
      opacity = smoothstep(revealT);
    }

    if (hasFadeOut(layer)) {
      const fadeOutAt = Number(layer.dataset.fadeOutAt);
      const fadeOutSpan = Number(layer.dataset.fadeOutSpan) || 0.32;
      const fadeT = clamp((progress - fadeOutAt) / fadeOutSpan, 0, 1);
      return opacity * (1 - smoothstep(fadeT));
    }

    if (hasReveal(layer)) return opacity;
    return null;
  }

  function renderOffset() {
    return displayOffset;
  }

  function updateLayers() {
    const offset = renderOffset();
    const progress = offset / maxOffset;
    const engaged = offset > 0.5;
    const showParallax = engaged && progress >= minShowProgress;

    section.classList.toggle('is-scrolling', showParallax);
    if (world) world.setAttribute('aria-hidden', showParallax ? 'false' : 'true');

    if (!showParallax) {
      layers.forEach((layer) => {
        layer.style.transform = 'translate3d(0, 0, 0)';
        if (offset <= 0) {
          layer.style.opacity = hasReveal(layer) || hasFadeOut(layer) ? '0' : '';
        } else if (hasFadeOut(layer)) {
          layer.style.opacity = '1';
        } else if (hasReveal(layer)) {
          layer.style.opacity = Number(layer.dataset.revealAt) <= 0 ? '' : '0';
        } else {
          layer.style.opacity = '';
        }
      });
      return;
    }

    const zProgress = Math.max(progress, minZProgress);

    layers.forEach((layer) => {
      const baseZ = Number(layer.dataset.baseZ);
      const travel = Math.round(layerProgress(layer, zProgress) * (baseZ + maxOffset));
      layer.style.transform = `translate3d(0, 0, ${travel}px)`;

      const opacity = layerOpacity(layer, progress);
      if (opacity === null) {
        layer.style.opacity = '';
      } else {
        layer.style.opacity = opacity >= 0.999 ? '1' : String(opacity);
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

    const delta = event.deltaY * 0.68;
    if (delta < 0 && isAtRest()) return;

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      if (!animating && Math.abs(targetOffset - displayOffset) > 0.5) {
        animating = true;
        requestAnimationFrame(tick);
      }
    }, 120);

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

  if (progressFromScroll() < minShowProgress) {
    targetOffset = 0;
    displayOffset = 0;
  } else {
    setOffset(progressFromScroll() * maxOffset);
  }

  updateLayers();
})();
