/**
 * About page — wheel-driven parallax (page scroll locked).
 */
(function () {
  const section = document.querySelector('.about-parallax');
  if (!section) return;

  const scrollPageMode = document.body.classList.contains('page-home');

  const layers = [...section.querySelectorAll('[data-base-z]')];
  const MAX_OFFSET = 23339;
  const WHEEL_FACTOR = 0.62;
  const SMOOTH = 0.078;

  let targetOffset = 0;
  let displayOffset = 0;
  let animating = false;

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function smoothstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  }

  /* quintic ease — zero 1st & 2nd derivative at both ends => silkier fades */
  function smootherstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  const scene = section.querySelector('.about-parallax__scene');
  const glass = section.querySelector('.about-parallax__glass');
  const LAYER_INSET = 0.09; /* matches inset: 4.5% on each side */

  const PERSPECTIVE = 1000;

  function getPerspective() {
    return PERSPECTIVE;
  }

  function syncSceneMetrics() {
    const pin = section.querySelector('.about-parallax__pin');
    const containerH = pin ? pin.clientHeight : (section.clientHeight || window.innerHeight);
    const containerW = pin ? pin.clientWidth  : (section.clientWidth  || window.innerWidth);
    /* canvas = largest side of the container so the scene square covers the viewport */
    const canvas = Math.ceil(Math.max(containerW, containerH));
    section.style.setProperty('--about-parallax-canvas',    `${canvas}px`);
    section.style.setProperty('--about-parallax-viewport-h', `${Math.ceil(containerH)}px`);
  }

  function getMarkLayerBox() {
    const canvasSize = scene ? scene.offsetWidth : window.innerWidth;
    return canvasSize * (1 - LAYER_INSET);
  }

  function getMarkScaleForPx(px, travel) {
    const p = getPerspective();
    const layerBox = getMarkLayerBox();
    const perspectiveFactor = p / (p - travel);
    return px / (layerBox * perspectiveFactor);
  }

  function getMarkProximity(rawTravel, baseZ) {
    const maxTravel = baseZ + MAX_OFFSET;
    if (maxTravel <= 0) return 1;
    return clamp(rawTravel / maxTravel, 0, 1);
  }

  /* fade-in keyed to front scarf clearing; fade-out keyed to this layer's DISPLAYED depth */
  function getManifestoOpacity(frontTravel, displayTravel) {
    const p = getPerspective();

    /* stay invisible until the scarf in front has fully passed */
    if (frontTravel < p) return 0;

    /* slight silky unfade once front layer is behind us */
    const fadeInEnd = p + p * 0.08;
    let opacity = 1;
    if (frontTravel < fadeInEnd) {
      opacity = smootherstep((frontTravel - p) / (fadeInEnd - p));
    }

    /* fade out only as the text itself nears the focal plane */
    const fadeOutStart = p * 0.90;
    const fadeOutEnd   = p * 0.99;
    if (displayTravel >= fadeOutEnd) return 0;
    if (displayTravel > fadeOutStart) {
      const fade = 1 - smootherstep((displayTravel - fadeOutStart) / (fadeOutEnd - fadeOutStart));
      opacity *= fade;
    }

    return opacity;
  }

  function applyLayers() {
    const p = getPerspective();
    const progress = displayOffset / MAX_OFFSET;
    const eased = smoothstep(progress);

    section.classList.toggle('is-scrolling', progress > 0.003);

    let glassOpacity = 0;

    layers.forEach((layer) => {
      const baseZ = Number(layer.dataset.baseZ || 0);
      const rawTravel = eased * (baseZ + MAX_OFFSET);
      const isMark = layer.classList.contains('about-parallax__layer--mark');
      const isManifesto = layer.classList.contains('about-parallax__text--manifesto');
      /* once a layer crosses the focal plane it flips — hide it instead */
      const hasPassed = !isMark && !isManifesto && rawTravel >= p;
      let travel = hasPassed ? (p - 1) : rawTravel;

      if (isManifesto) {
        const frontZ = Number(layer.dataset.frontZ || baseZ);
        const frontSpan = frontZ + MAX_OFFSET;
        const ownSpan = baseZ + MAX_OFFSET;
        const frontTravel = eased * frontSpan;
        /* same reveal depth for every manifesto; scroll delta preserved for parallax */
        const revealTravel = (p * ownSpan) / frontSpan;
        const MANIFESTO_REVEAL_Z = 670;
        let displayTravel = MANIFESTO_REVEAL_Z + (rawTravel - revealTravel);
        const manifestoOpacity = getManifestoOpacity(frontTravel, displayTravel);
        layer.style.opacity = manifestoOpacity.toFixed(3);
        if (manifestoOpacity > glassOpacity) glassOpacity = manifestoOpacity;
        if (displayTravel >= p) displayTravel = p - 1;
        layer.style.transform = `translate3d(0, 0, ${displayTravel}px)`;
        layer.style.visibility = '';
        const paragraph = layer.querySelector('p');
        if (paragraph) paragraph.style.transform = '';
        return;
      }

      layer.style.transform = `translate3d(0, 0, ${travel}px)`;
      if (!isMark) layer.style.visibility = hasPassed ? 'hidden' : '';

      if (isMark) {
        const scaleStart = Number(layer.dataset.scaleStart || 0.25);
        const endPx = Number(layer.dataset.scaleEndPx || 120);
        const proximity = getMarkProximity(rawTravel, baseZ);
        const proximityEased = smoothstep(proximity);
        const targetPx = endPx * proximityEased;
        const scale = proximityEased < 0.01
          ? scaleStart
          : getMarkScaleForPx(targetPx, travel);
        layer.style.setProperty('--layer-scale', scale.toFixed(4));

        const opacityStart = Number(layer.dataset.opacityStart ?? 0.12);
        const opacityEnd   = Number(layer.dataset.opacityEnd   ?? 1);
        const opacity = opacityStart + (opacityEnd - opacityStart) * proximityEased;
        layer.style.opacity = opacity.toFixed(3);
      }
    });

    if (glass) glass.style.opacity = glassOpacity.toFixed(3);
  }

  function tick() {
    displayOffset += (targetOffset - displayOffset) * SMOOTH;

    if (Math.abs(targetOffset - displayOffset) < 0.5) {
      displayOffset = targetOffset;
      animating = false;
    }

    applyLayers();
    if (animating) requestAnimationFrame(tick);
  }

  function startAnim() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function handleDelta(delta) {
    if (delta < 0 && targetOffset <= 0 && displayOffset < 1) return;
    targetOffset = clamp(targetOffset + delta, 0, MAX_OFFSET);
    startAnim();
  }

  let resizeRaf = 0;
  function onLayoutChange() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      syncSceneMetrics();
      applyLayers();
    });
  }

  function getHeaderHeight() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function isSectionPinned() {
    if (!scrollPageMode) return true;
    const rect = section.getBoundingClientRect();
    const headerH = getHeaderHeight();
    return rect.top <= headerH + 2 && rect.bottom >= window.innerHeight - 2;
  }

  function canReleaseDown() {
    return targetOffset >= MAX_OFFSET - 1 && displayOffset >= MAX_OFFSET - 2;
  }

  function canReleaseUp() {
    return targetOffset <= 0 && displayOffset <= 1;
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;

    if (scrollPageMode) {
      if (!isSectionPinned()) return;
      if (e.deltaY > 0 && canReleaseDown()) return;
      if (e.deltaY < 0 && canReleaseUp()) return;
    }

    e.preventDefault();
    handleDelta(e.deltaY * WHEEL_FACTOR);
  }, { passive: false, capture: true });

  window.addEventListener('resize', onLayoutChange);

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onLayoutChange).observe(section);
  }

  window.addEventListener('load', () => {
    syncSceneMetrics();
    applyLayers();
  }, { once: true });

  syncSceneMetrics();
  applyLayers();

  function playIntroHint() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (scrollPageMode && !isSectionPinned()) return;

    const hintOffset = MAX_OFFSET * 0.032;

    setTimeout(() => {
      if (scrollPageMode && !isSectionPinned()) return;
      targetOffset = hintOffset;
      startAnim();

      setTimeout(() => {
        targetOffset = 0;
        startAnim();
      }, 1400);
    }, 1500);
  }

  if (scrollPageMode) {
    let introPlayed = false;
    const introObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !introPlayed) {
            introPlayed = true;
            playIntroHint();
          }
        });
      },
      { threshold: 0.6 }
    );
    introObserver.observe(section);
  } else {
    playIntroHint();
  }
})();
