/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; centers and scales the scene per viewport.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const canvas = document.querySelector('.hero-spline-canvas');
  const stage = document.querySelector('.hero-spline-stage');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!canvas || !stage || !viewer) return;

  const LAPTOP_REF_WIDTH = 1440;
  const IMAC_REF_WIDTH = 2048;
  const IMAC_REF_HEIGHT = 1152;
  const IMAC_MQ = window.matchMedia('(min-width: 2048px) and (min-height: 1080px)');

  const IMAC_OFFSET_X = -35;

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
    stage.style.transform = '';
  }

  function centerCanvas(width, height, scale, offsetX, offsetY) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    canvas.style.inset = 'auto';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform =
      'translate(calc(-50% + ' + offsetX + 'px), calc(-50% + ' + offsetY + 'px)) scale(' + scale + ')';
  }

  function updateSplineLayout() {
    const vw = window.innerWidth;
    resetCanvas();

    if (IMAC_MQ.matches) {
      const scale = vw / IMAC_REF_WIDTH;
      centerCanvas(IMAC_REF_WIDTH, IMAC_REF_HEIGHT, scale, IMAC_OFFSET_X, 0);
      return;
    }

    if (vw <= LAPTOP_REF_WIDTH) {
      canvas.style.inset = '0';
      return;
    }

    const scale = vw / LAPTOP_REF_WIDTH;
    centerCanvas(LAPTOP_REF_WIDTH, window.innerHeight, scale);
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
