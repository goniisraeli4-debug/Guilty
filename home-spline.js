/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; keeps the scene centered in the viewport
 * and scales on wide screens from the center.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const canvas = document.querySelector('.hero-spline-canvas');
  const stage = document.querySelector('.hero-spline-stage');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!canvas || !stage || !viewer) return;

  const REF_WIDTH_DEFAULT = 1440;
  const REF_WIDTH_LARGE = 2048;
  const LARGE_SCREEN_MQ = window.matchMedia('(min-width: 2048px) and (min-height: 1080px)');

  function getRefWidth() {
    return LARGE_SCREEN_MQ.matches ? REF_WIDTH_LARGE : REF_WIDTH_DEFAULT;
  }

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

  function updateSplineLayout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const refWidth = getRefWidth();

    stage.style.transform = '';

    const scale = vw > refWidth ? vw / refWidth : 1;
    const canvasW = vw > refWidth ? refWidth : vw;

    canvas.style.inset = 'auto';
    canvas.style.width = canvasW + 'px';
    canvas.style.height = vh + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
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
