/**
 * About page — wheel-driven parallax (page scroll locked).
 */
(function () {
  const section = document.querySelector('.about-parallax');
  if (!section) return;

  const layers = [...section.querySelectorAll('[data-base-z]')];
  /* scaled with layer depths (+20% spacing from title); title base-z stays 3000 */
  const MAX_OFFSET = 28607;
  const WHEEL_FACTOR = 0.54;
  /* time-based lerp rate — lower = silkier follow (was ~5.1 at 60fps via fixed 0.078) */
  const SMOOTH_RATE = 3.05;
  const SETTLE_EPSILON = 0.035;

  let targetOffset = 0;
  let displayOffset = 0;
  let wheelPending = 0;
  let animating = false;
  let lastFrameTime = 0;

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

  /* title block — soft opacity instead of a visibility snap */
  function getTitleOpacity(rawTravel) {
    const p = getPerspective();
    const fadeOutStart = p * 0.42;
    const fadeOutEnd = p * 0.88;
    if (rawTravel <= fadeOutStart) return 1;
    if (rawTravel >= fadeOutEnd) return 0;
    return 1 - smootherstep((rawTravel - fadeOutStart) / (fadeOutEnd - fadeOutStart));
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
      const isTitle = layer.classList.contains('about-parallax__text--title');
      /* once a layer crosses the focal plane it flips — hide it instead */
      const hasPassed = !isMark && !isManifesto && !isTitle && rawTravel >= p;
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

      if (isTitle) {
        const titleOpacity = getTitleOpacity(rawTravel);
        const titleTravel = Math.min(rawTravel, p - 1);
        layer.style.opacity = titleOpacity.toFixed(3);
        layer.style.transform = `translate3d(0, 0, ${titleTravel}px)`;
        layer.style.visibility = titleOpacity < 0.01 ? 'hidden' : '';
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

  function tick(now) {
    const dt = lastFrameTime ? Math.min(now - lastFrameTime, 32) : 16.67;
    lastFrameTime = now;

    if (wheelPending !== 0) {
      const wheelBlend = 1 - Math.exp(-11.5 * dt / 1000);
      const step = wheelPending * wheelBlend;
      wheelPending -= step;
      if (Math.abs(wheelPending) < 0.02) {
        targetOffset = clamp(targetOffset + wheelPending, 0, MAX_OFFSET);
        wheelPending = 0;
      } else {
        targetOffset = clamp(targetOffset + step, 0, MAX_OFFSET);
      }
    }

    const alpha = 1 - Math.exp(-SMOOTH_RATE * dt / 1000);
    displayOffset += (targetOffset - displayOffset) * alpha;

    if (Math.abs(targetOffset - displayOffset) < SETTLE_EPSILON && wheelPending === 0) {
      displayOffset = targetOffset;
      animating = false;
      lastFrameTime = 0;
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
    if (delta < 0 && targetOffset <= 0 && displayOffset < 1 && wheelPending <= 0) return;
    wheelPending += delta;
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

  function wheelDeltaY(event) {
    const normalize = window.GuiltyWheelInput?.normalizeWheelDelta;
    return normalize ? normalize(event).y : event.deltaY;
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    handleDelta(wheelDeltaY(e) * WHEEL_FACTOR);
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

    const hintOffset = MAX_OFFSET * 0.032;

    setTimeout(() => {
      targetOffset = hintOffset;
      startAnim();

      setTimeout(() => {
        targetOffset = 0;
        startAnim();
      }, 1400);
    }, 1500);
  }

  playIntroHint();
})();
