/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; scales Spline on ultra-wide screens
 * so the scene fills the viewport without changing laptop layout.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const stage = document.querySelector('.hero-spline-stage');
  const canvas = document.querySelector('.hero-spline-canvas');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!stage || !canvas || !viewer) return;

  /** Viewport width where the scene already looks correct */
  const REF_WIDTH = 1440;

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
    const vw = window.innerWidth - 100;
    const vh = window.innerHeight - 50;

    if (vw <= REF_WIDTH) {
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.style.inset = '';
      canvas.style.left = '';
      canvas.style.top = '';
      canvas.style.transform = '';
      canvas.style.transformOrigin = '';
      stage.style.transform = 'translateY(-20px)';
      return;
    }

    const scale = vw / REF_WIDTH;
    const nudgeX = 42;
    const nudgeY = -34;

    canvas.style.inset = 'auto';
    canvas.style.width = REF_WIDTH + 'px';
    canvas.style.height = vh + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform =
      'translate(calc(-50% - ' + nudgeX + 'px), calc(-50% - ' + nudgeY + 'px)) scale(' + scale + ')';
    canvas.style.transformOrigin = 'center center';
    stage.style.transform = '';
  }

  window.addEventListener('scroll', updateOverlay, { passive: true });
  window.addEventListener('resize', function () {
    updateOverlay();
    updateSplineLayout();
  }, { passive: true });

  viewer.addEventListener('load', updateSplineLayout);
  updateOverlay();
  updateSplineLayout();
})();
