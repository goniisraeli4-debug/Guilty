/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; centers the scene in the viewport.
 * Calibrated for 2048×1152 iMac; laptops use a separate full-bleed layout.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const canvas = document.querySelector('.hero-spline-canvas');
  const stage = document.querySelector('.hero-spline-stage');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!canvas || !stage || !viewer) return;

  /** 21.5" iMac design viewport */
  const IMAC_W = 2048;
  const IMAC_H = 1152;
  /** Laptop design viewport */
  const LAPTOP_W = 1440;
  const LAPTOP_H = 900;

  const IMAC_MQ = window.matchMedia('(min-width: 1900px) and (min-height: 1000px)');

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function updateOverlay() {
    const end = Math.max(520, window.innerHeight * 0.72);
    const raw = Math.min(1, Math.max(0, window.scrollY / end));

    const fadeStart = 0.42;
    const fadeRaw = raw <= fadeStart ? 0 : (raw - fadeStart) / (1 - fadeStart);
    const fadeT = smoothstep(fadeRaw);

    document.documentElement.style.setProperty('--overlay-opacity', 1 - fadeT);
  }

  function resetCanvas() {
    canvas.style.inset = '';
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.transform = '';
    canvas.style.transformOrigin = '';
  }

  function centerCanvas(refW, refH, scale) {
    canvas.style.inset = 'auto';
    canvas.style.width = refW + 'px';
    canvas.style.height = refH + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }

  function updateSplineLayout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    stage.style.transform = '';

    if (IMAC_MQ.matches) {
      const scale = vw / IMAC_W;
      centerCanvas(IMAC_W, IMAC_H, scale);
      return;
    }

    if (vw <= LAPTOP_W && vh <= LAPTOP_H) {
      resetCanvas();
      canvas.style.inset = '0';
      return;
    }

    const scale = vw > LAPTOP_W ? vw / LAPTOP_W : 1;
    centerCanvas(LAPTOP_W, vh, scale);
  }

  window.addEventListener('scroll', updateOverlay, { passive: true });
  window.addEventListener('resize', function () {
    updateOverlay();
    updateSplineLayout();
  }, { passive: true });

  var hero = document.querySelector('.hero-spline');
  if (hero) {
    hero.addEventListener('wheel', function (event) {
      if (event.ctrlKey) return;
      var normalize = window.GuiltyWheelInput && window.GuiltyWheelInput.normalizeWheelDelta;
      var delta = normalize ? normalize(event) : { x: event.deltaX, y: event.deltaY };
      if (Math.abs(delta.y) < Math.abs(delta.x)) return;
      window.scrollBy(0, delta.y);
      event.preventDefault();
    }, { passive: false, capture: true });
  }

  viewer.addEventListener('load', updateSplineLayout);
  updateOverlay();
  updateSplineLayout();
})();
