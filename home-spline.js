/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; nudges Spline down on tall screens
 * so the scene stays vertically centered (e.g. 27" iMac / GitHub Pages).
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const canvas = document.querySelector('.hero-spline-canvas');
  const stage = document.querySelector('.hero-spline-stage');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!canvas || !stage || !viewer) return;

  /** Viewport height where the scene already looks correct */
  const REF_HEIGHT = 900;

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
    const vh = window.innerHeight;
    const offsetY = vh > REF_HEIGHT ? (vh - REF_HEIGHT) * 0.35 : 0;

    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.inset = '';
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.transform = '';
    canvas.style.transformOrigin = '';

    stage.style.transform = offsetY ? 'translateY(' + offsetY + 'px)' : '';
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
