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

  const REF_WIDTH = 1440;
  const REF_HEIGHT = 900;
  /** Spline scene content sits left of canvas center — nudge down on all sizes */
  const OFFSET_Y = 90;

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

    stage.style.transform = '';

    const offsetX = vw > REF_WIDTH ? Math.round((vw - REF_WIDTH) * 0.1) : 0;
    const offsetY = OFFSET_Y + (vh > REF_HEIGHT ? (vh - REF_HEIGHT) * 0.15 : 0);

    if (vw <= REF_WIDTH) {
      canvas.style.inset = '0';
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.style.left = '';
      canvas.style.top = '';
      canvas.style.transformOrigin = 'center center';
      canvas.style.transform =
        'translate(' + offsetX + 'px, ' + offsetY + 'px)';
      return;
    }

    const scale = vw / REF_WIDTH;

    canvas.style.inset = 'auto';
    canvas.style.width = REF_WIDTH + 'px';
    canvas.style.height = vh + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform =
      'translate(calc(-50% + ' + offsetX + 'px), calc(-50% + ' + offsetY + 'px)) scale(' + scale + ')';
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
